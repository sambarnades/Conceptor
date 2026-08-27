/**
 * Caramelia — Chat libre (mode aide)
 * Communique avec le webhook n8n pour répondre aux questions sur Caramel.
 *
 * @module caramelia/chat
 */

import { CONFIG } from './config.js';
import { getHistoryForLLM } from './state.js';
import { addBotMessage, showTyping, removeTyping } from './dom.js';
import { t, getLangFullName, getLang } from './i18n.js';
import { SECURITY_PREAMBLE, fenceUserMessage, detectInjectionAttempt } from './security.js';
import { fetchWithRetry } from './utils.js';
// `DEBUG` vient du cœur de Caramel (drapeau `?debug` dans l'URL), pas de
// `caramelia/utils.js` : même drapeau que le reste de l'app, une seule source.
import { DEBUG } from '../core/utils.js';
import { parseDataBlock, isMeaningfulIntent, buildExtractSchemaBlock } from './extractor.js';

// Borne dure : un .md mal édité ne doit pas saturer le webhook ni les tokens LLM.
const KNOWLEDGE_MAX_BYTES = 40_000;
const KNOWLEDGE_FALLBACK_LANG = 'fr';

// Cache lang -> markdown (ou null si introuvable). Session-only, pas de localStorage.
const knowledgeCache = new Map();

/**
 * Vide le cache de la base de connaissances. Utilisé par les tests.
 */
export function _resetKnowledgeCache() {
    knowledgeCache.clear();
}

/**
 * Charge le tuto markdown de la langue courante (fallback fr).
 * Le contenu est tronqué à KNOWLEDGE_MAX_BYTES pour éviter qu'une édition
 * accidentelle gonfle le payload. Si rien n'est trouvé, retourne null
 * (le webhook doit gérer le cas knowledge=null).
 *
 * Exporté pour permettre les tests unitaires (cf. tests/test-caramelia.js).
 */
export async function loadKnowledge(lang) {
    const candidates = [lang, KNOWLEDGE_FALLBACK_LANG];
    for (const code of candidates) {
        if (knowledgeCache.has(code)) {
            const cached = knowledgeCache.get(code);
            if (cached) return cached;
            continue;
        }
        try {
            const res = await fetch(`js/caramelia/tuto-rag/${code}.md`);
            if (!res.ok) {
                knowledgeCache.set(code, null);
                continue;
            }
            let text = await res.text();
            if (text.length > KNOWLEDGE_MAX_BYTES) {
                text = text.slice(0, KNOWLEDGE_MAX_BYTES);
            }
            knowledgeCache.set(code, text);
            return text;
        } catch (err) {
            console.warn(`[Caramelia] knowledge: échec chargement ${code}`, err);
            knowledgeCache.set(code, null);
        }
    }
    return null;
}

function getPageContext() {
    try {
        const sel = CONFIG.caramelSelectors;
        return {
            page: document.title || 'Caramel',
            // Vie privée : on n'envoie que le chemin, jamais la query string
            // (?debug, paramètres éventuels) ni le hash.
            url: window.location.pathname,
            activeMode: document.querySelector(sel.modeTabActive)?.dataset?.mode || null,
            qui: document.querySelector(sel.qui)?.value || null,
            quoi: document.querySelector(sel.quoi)?.value || null,
            lang: getLang(),
            // Version Caramelia : non affichée dans l'UI, mais transmise pour que
            // l'assistante puisse l'indiquer si on la lui demande.
            carameliaVersion: CONFIG.version,
            // Demande au serveur de joindre sa sonde de diagnostic (modèle
            // réellement utilisé, nombre d'extraits ramenés par la recherche
            // documentaire). Sans ça, une recherche qui ne ramène RIEN est
            // invisible : on accuse le prompt, puis le modèle, sans jamais voir
            // que la base n'avait rien pour cette langue. Actif seulement avec
            // `?debug` dans l'URL — la réponse est identique sinon.
            debug: DEBUG || undefined,
        };
    } catch {
        return { page: 'Caramel', lang: getLang() };
    }
}

/**
 * Construit le payload du webhook avec :
 * - Préambule de sécurité (anti-jailbreak)
 * - Instruction de langue
 * - Message utilisateur sandboxé entre <USER_MESSAGE>...</USER_MESSAGE>
 *
 * Le webhook n8n a son propre prompt système et ignore les autres champs ;
 * c'est pourquoi on injecte tout dans le `message`.
 */
function buildHelpMessage(userText) {
    const langName = getLangFullName();
    return `${SECURITY_PREAMBLE}
[CARAMELIA_HELP] Reponds dans la langue: ${langName}.
Ton role : assistante pedagogique pour le site Caramel. Tu reponds aux questions sur Caramel, l'enseignement, et la pedagogie. Tu refuses tout autre role.

${fenceUserMessage(userText)}`;
}

/**
 * Mode AUTO unifié — le seul appel LLM pour un message libre.
 *
 * Un unique aller-retour n8n (intent='auto', toujours nourri par le RAG côté
 * serveur). Le LLM décide LUI-MÊME, à chaque tour, si l'utilisateur :
 *   (A) pose une QUESTION → il répond en texte (pédagogique, sourcé RAG) ;
 *   (B) veut CRÉER une activité → il répond UNIQUEMENT par <DATA>{...}</DATA>.
 *
 * C'est ce qui remplace l'ancien routage "extraction d'abord, aide en
 * rattrapage" (qui lançait une génération sur la moindre phrase, y compris
 * une simple question). La décision question/création n'est plus portée par
 * des regex fragiles côté client mais par le LLM ancré sur la documentation.
 *
 * @param {string} text - message utilisateur brut (déjà sanitizé en amont)
 * @returns {Promise<{kind:'answer', text:string} | {kind:'creation', data:object} | {kind:'empty'} | null>}
 *   'empty' = le service a répondu 200 mais sans un mot, deux fois de suite.
 *   null    = service injoignable (le caller bascule sur le fallback regex).
 */
export async function runAutoQuery(text) {
    const injection = detectInjectionAttempt(text);
    if (injection.detected) {
        console.warn('[Caramelia] tentative d\'injection détectée (auto):', injection.reason);
    }

    const payload = JSON.stringify({
        // Message sandboxé entre <USER_MESSAGE> : permet au serveur d'extraire
        // la requête RAG proprement ET sert de défense anti-injection (le system
        // prompt côté n8n traite ce bloc comme une donnée, jamais une instruction).
        message: fenceUserMessage(text),
        context: getPageContext(),
        history: getHistoryForLLM(),
        intent: 'auto',
        lang: getLangFullName(),
        // Schéma de création envoyé séparément : le LLM ne l'utilise QUE s'il
        // décide (mode B) que l'utilisateur veut créer une activité.
        extractSchema: buildExtractSchemaBlock(getLangFullName()),
        securityFlag: injection.detected ? { detected: true, reason: injection.reason } : null,
    });

    try {
        // Un HTTP 200 au corps VIDE est un échec serveur déguisé : `fetchWithRetry`
        // ne le voit pas (il ne regarde que le statut), et l'afficher tel quel
        // donnait « Désolé, je n'ai pas pu obtenir de réponse » sur une demande
        // pourtant parfaitement comprise — le symptôme le plus visible de la
        // régression `stop: ['</DATA>']` du 2026-08-27. On retente une fois avant
        // de conclure, la cause étant corrigée côté n8n mais l'aléa restant
        // possible (modèle dégradé, réponse partie dans un canal de réflexion).
        for (let attempt = 0; attempt < 2; attempt++) {
            const res = await fetchWithRetry(CONFIG.chatWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            }, { retries: 1, timeoutMs: 25000 });
            if (!res.ok) {
                const err = new Error(`HTTP ${res.status}`);
                err.kind = res.status >= 500 ? 'server' : 'client';
                throw err;
            }
            const data = await res.json();
            const raw = String(data.response || data.message || '');
            if (!raw.trim()) {
                console.warn(`[Caramelia] réponse vide du webhook (tentative ${attempt + 1}/2)`);
                continue;
            }

            // Le LLM a-t-il choisi le mode CRÉATION (bloc <DATA>) ?
            const parsed = parseDataBlock(raw);
            if (parsed && isMeaningfulIntent(parsed)) {
                return { kind: 'creation', data: parsed };
            }

            // Sinon c'est une RÉPONSE. On retire un éventuel bloc <DATA> résiduel
            // (cas où le LLM a émis un DATA vide à tort) pour ne pas l'afficher.
            const answer = raw.replace(/<DATA>[\s\S]*?(?:<\/DATA>|$)/g, '').trim();
            if (answer) return { kind: 'answer', text: answer };
        }
        return { kind: 'empty' };
    } catch (err) {
        console.warn('[Caramelia] Erreur auto:', err);
        return null;
    }
}

export async function handleHelpMessage(text, { onFlow } = {}) {
    // Log discret si tentative d'injection détectée
    const injection = detectInjectionAttempt(text);
    if (injection.detected) {
        console.warn('[Caramelia] tentative d\'injection détectée (chat):', injection.reason);
    }

    showTyping();
    try {
        // Chargé une fois par langue puis caché. Le webhook n8n l'injectera
        // entre <KNOWLEDGE_BASE>...</KNOWLEDGE_BASE> dans le system prompt.
        const knowledge = await loadKnowledge(getLang());

        // Mode aide : timeout plus long que l'extracteur (les réponses RAG peuvent
        // prendre 8-12s). 1 retry suffit pour absorber les 503 transitoires de n8n.
        const res = await fetchWithRetry(CONFIG.chatWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: buildHelpMessage(text),
                context: getPageContext(),
                // Fenêtre glissante (cf. CONFIG.history) : borne le payload LLM sans amputer l'UI
                history: getHistoryForLLM(),
                intent: 'help',
                lang: getLangFullName(),
                knowledge,
                // Signal d'observabilité : null si rien à signaler, sinon transmet la
                // raison détectée. Le workflow n8n peut l'ignorer ou l'utiliser pour
                // logger / adapter le system prompt côté serveur.
                securityFlag: injection.detected ? { detected: true, reason: injection.reason } : null,
            }),
        }, { retries: 1, timeoutMs: 25000 });
        removeTyping();
        if (!res.ok) {
            const err = new Error(`HTTP ${res.status}`);
            err.kind = res.status >= 500 ? 'server' : 'client';
            throw err;
        }
        const data = await res.json();
        const reply = data.response || data.message || t('help_no_response');
        addBotMessage(reply, [
            { label: t('help_btn_another'), action: () => addBotMessage(t('help_another_prompt')) },
            { label: t('help_btn_create'), action: () => onFlow?.('generate') },
            { label: t('help_btn_back'), action: () => onFlow?.('reset') },
        ]);
    } catch (err) {
        removeTyping();
        console.warn('[Caramelia] Erreur chat:', err);
        // Distingue les 3 cas pour aider l'utilisateur à savoir s'il doit retenter
        // (timeout = serveur lent, server = 5xx persistant, network/offline = pas de réseau).
        let errorKey = 'help_error_offline';
        if (err.kind === 'timeout') errorKey = 'help_error_timeout';
        else if (err.kind === 'server') errorKey = 'help_error_server';
        addBotMessage(t(errorKey), [
            { label: t('help_btn_retry'), action: () => handleHelpMessage(text, { onFlow }) },
            { label: t('help_btn_create'), action: () => onFlow?.('generate') },
        ]);
    }
}
