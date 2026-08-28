/**
 * Caramelia — Extracteur d'intention
 * Envoie le message utilisateur au webhook avec un prompt qui force une réponse
 * structurée entre balises <DATA>...</DATA>. Parse et valide le JSON retourné.
 *
 * Le webhook n8n ignore les champs `system`/`intent` mais respecte les instructions
 * placées dans le `message`. C'est pourquoi tout est concaténé dans `message`.
 *
 * Sécurité : le message utilisateur est sandboxé entre <USER_MESSAGE>...</USER_MESSAGE>
 * et précédé du préambule de sécurité (cf. security.js).
 *
 * @module caramelia/extractor
 */

import { CONFIG } from './config.js';
import { getHistoryForLLM } from './state.js';
import { getLangFullName } from './i18n.js';
import { sanitizeForPrompt, detectInjectionAttempt } from './security.js';
import { fetchWithRetry } from './utils.js';

/**
 * Construit le BLOC-SCHEMA d'extraction (schéma JSON + définitions + règles +
 * enum des moduleKeys). Ce bloc est partagé entre :
 *  - le mode "extract" legacy (buildPrompt, ci-dessous), et
 *  - le mode "auto" unifié côté serveur (envoyé dans le champ `extractSchema`
 *    du payload n8n, où le LLM ne l'utilise QUE s'il décide que l'utilisateur
 *    veut créer une activité, cf. js/caramelia/chat.js#runAutoQuery).
 *
 * Règle clé : si `qui` OU `quoi` manque, le LLM DOIT remplir besoinClarification
 * pour les demander, et NE DOIT PAS proposer de moduleKeys (cela évite le
 * lancement automatique d'une génération sans contexte minimal).
 *
 * @param {string} langFullName - Nom complet de la langue (pour les questions générées).
 */
export function buildExtractSchemaBlock(langFullName) {
    const h5p = CONFIG.h5pKeys.join(', ');
    const elea = CONFIG.eleaKeys.join(', ');

    return `Schema JSON strict (tous les champs requis, null si inconnu) :
{"qui":string|null,"quoi":string|null,"niveau":string|null,"nombreQuestions":number|null,"moduleKeys":string[],"plateforme":"H5P"|"Elea"|null,"besoinClarification":{"champ":string,"question":string,"options":string[]}|null,"suggestionEnrichissement":string|null,"confiance":number}

DEFINITIONS (tres important, ne jamais confondre) :
- "qui" = identite/role pedagogique de l'utilisateur (ex "prof de maths au college", "formateur en entreprise").
- "quoi" = SUJET / THEME / NOTION pedagogique a aborder (ex "les fractions decimales", "la photosynthese", "la Revolution francaise"). C'est le CONTENU pedagogique, JAMAIS un type d'activite.
- "moduleKeys" = TYPE d'activite/format (QCM, Flashcards, Glossaire, Mots croises, etc.). Ce n'est PAS un sujet.

Si l'utilisateur ne mentionne qu'un TYPE d'activite (ex "je veux faire un QCM", "des flashcards") SANS sujet pedagogique concret -> "quoi"=null, mettre le type dans moduleKeys, et besoinClarification.champ="quoi" pour demander le SUJET.

Enum moduleKeys autorises :
H5P: ${h5p}
Elea: ${elea}

PRECISIONS sur des types proches (ne jamais confondre) :
- "un QCM"/"questionnaire a choix multiples" de PLUSIEURS questions, ou "un quiz" -> QuizSetQCM (H5P : ensemble de questions QCM). N'utilise MultipleChoice QUE si l'utilisateur veut explicitement UNE seule question isolee.
- "un vrai/faux", "des vrai-faux", "un questionnaire vrai/faux" -> QuizSetVF PAR DEFAUT (ensemble d'affirmations : c'est ce qu'un enseignant demande quand il dit "un vrai/faux"). N'utilise TrueFalse QUE si l'utilisateur precise explicitement UNE SEULE affirmation.
- Quiz melangeant plusieurs TYPES de questions -> QuizSet.

Regles strictes (dans cet ordre) :
1. Si "qui" absent ou trop vague (ex "moi", "un prof") -> besoinClarification.champ="qui", question en ${langFullName}, options=[], moduleKeys=[].
2. Si "quoi" absent OU si l'utilisateur n'a mentionne qu'un type d'activite sans sujet -> "quoi"=null, besoinClarification.champ="quoi", question en ${langFullName} demandant le SUJET pedagogique concret, options=[]. Les moduleKeys deja deduits du message restent listes.
3. Si plusieurs moduleKeys sur 2 plateformes (ex "QCM") -> besoinClarification.champ="plateforme", question en ${langFullName}, options=["H5P","Elea"].
4. Si tout est clair -> besoinClarification=null.
5. Liste TOUS les moduleKeys correspondants.
6. "niveau" : extraire toute mention de niveau scolaire (ex "6e", "sixieme", "CE2", "Seconde", "L1", "college", "lycee").
7. "nombreQuestions" : entier si l'utilisateur precise un nombre de questions/items/elements (ex "10 questions", "5 items"), sinon null.
INTERDICTION ABSOLUE : ne JAMAIS mettre un type d'activite (QCM, Flashcards, Quiz, Glossaire, etc.) dans le champ "quoi". Le champ "quoi" doit contenir un sujet pedagogique CONCRET ou rester null.

NORMALISATION DE "qui" : "qui" doit etre un syntagme nominal court, sans pronom personnel ni verbe d'etat. Capitale initiale. Conserve la langue d'origine.
- "je suis prof de maths" -> "Prof de maths"
- "moi je suis formateur en entreprise" -> "Formateur en entreprise"
- "I'm a math teacher" -> "Math teacher"
- "soy profesor de historia" -> "Profesor de historia"
- "ich bin Lehrer fuer Biologie" -> "Lehrer fuer Biologie"

SUGGESTION D'ENRICHISSEMENT PEDAGOGIQUE :
"suggestionEnrichissement" est UNE phrase courte (max 25 mots) en ${langFullName}, formulee comme une question ouverte amicale, qui propose UNE piste concrete pour enrichir le sujet (sous-theme a inclure, contexte d'usage, type d'exemples...). Le but est d'aider l'enseignant a affiner sa demande sans le forcer.
- Genere TOUJOURS une suggestion si "qui" et "quoi" sont definis. Si "quoi" est tres precis (ex "les fonctions affines representees graphiquement avec coefficient directeur"), la suggestion peut quand meme exister mais sera ignoree cote client si l'intention est deja riche.
- Si "qui" ou "quoi" sont absents -> "suggestionEnrichissement"=null.
- Exemples :
  * quoi="les angles", niveau="6e" -> "Veux-tu cibler des types d'angles particuliers (aigus, droits, obtus) ou un contexte d'usage (geometrie, reperage) ?"
  * quoi="la photosynthese", niveau="5e" -> "Souhaites-tu mettre l'accent sur le mecanisme chimique, les conditions necessaires ou le role ecologique ?"
  * quoi="la Revolution francaise" -> "Tu preferes axer sur les causes, les grandes dates, ou les figures marquantes ?"`;
}

/**
 * Construit le prompt d'extraction "legacy" (mode intent='extract', conservé pour
 * compat ascendante). Le mode "auto" unifié ne l'utilise pas : il envoie le
 * bloc-schéma séparément et laisse le LLM décider question vs création.
 */
function buildPrompt(userMessage, langFullName) {
    const safeUser = sanitizeForPrompt(userMessage);

    // Format compact validé empiriquement : le webhook n8n bascule en chat libre
    // si on lui envoie trop de structure XML/préambules. La sécurité est assurée
    // par sanitizeForPrompt() côté client (pas de quote, pas de newline, pas de
    // marqueurs internes).
    return `[TACHE EXTRACTION] Reponds UNIQUEMENT avec <DATA>{...}</DATA>, aucun texte avant ou apres.

${buildExtractSchemaBlock(langFullName)}

Phrase a analyser : "${safeUser}"`;
}

/**
 * Parse la réponse du webhook. Retourne null si le format est invalide.
 *
 * Tolère l'absence de </DATA> à la fin, et tolère du texte après le bloc.
 * Historique : le workflow n8n envoyait `stop: ['</DATA>']` au modèle pour
 * couper la génération dès la fin du bloc — d'où cette tolérance. Ce `stop`
 * a été retiré le 2026-08-27 (il coupait la génération PENDANT la délibération
 * du modèle, la balise figurant dans le prompt lui-même : réponse vide dans
 * ~80 % des créations, mesuré). La tolérance reste utile : elle absorbe les
 * deux formes, et un déploiement n8n plus ancien continue de fonctionner.
 */
export function parseDataBlock(rawResponse) {
    if (!rawResponse) return null;
    const match = rawResponse.match(/<DATA>([\s\S]*?)(?:<\/DATA>|$)/);
    if (!match) return null;
    try {
        const obj = JSON.parse(match[1].trim());
        return validateSchema(obj);
    } catch (err) {
        console.warn('[Caramelia] extractor: JSON invalide', err, match[1]);
        return null;
    }
}

/**
 * Validation minimale + filets de sécurité côté client.
 * Si qui ou quoi manque mais que le LLM a quand même proposé des moduleKeys,
 * on les efface et on force une clarif locale (le LLM peut désobéir).
 */
// Le schéma nomme ses champs en français, et le prompt serveur l'exige
// explicitement. Les petits modèles traduisent quand même la CLÉ dans la langue
// de la conversation ("nivel" en espagnol, "level" en anglais — constaté sur
// mistral-small-4 le 2026-08-27) : le champ devenait alors invisible et
// l'assistante redemandait le niveau qu'elle venait d'extraire. On re-normalise
// avant lecture. Seules les traductions des 12 langues de Caramel sont listées ;
// une clé inconnue est ignorée, jamais devinée.
const FIELD_ALIASES = {
    qui: ['who', 'quien', 'quién', 'chi', 'wer', 'wie', 'quem', 'من', '谁', '誰', 'ποιος', 'piv'],
    quoi: ['what', 'que', 'qué', 'cosa', 'was', 'wat', 'o_que', 'ماذا', '什么', '何', 'τι', 'petra'],
    niveau: ['nivel', 'level', 'livello', 'niveau_scolaire', 'niveaustufe', 'nivo', 'público', 'public', 'audience', 'المستوى', '级别', 'レベル', 'επίπεδο', 'live'],
    nombreQuestions: ['numeroPreguntas', 'numberOfQuestions', 'numeroDomande', 'anzahlFragen', 'aantalVragen', 'niverGoulennou'],
};

function normalizeFieldNames(obj) {
    const out = { ...obj };
    for (const [canon, aliases] of Object.entries(FIELD_ALIASES)) {
        if (out[canon] != null && out[canon] !== '') continue;
        const hit = aliases.find(a => out[a] != null && out[a] !== '');
        if (hit) out[canon] = out[hit];
    }
    return out;
}

function validateSchema(raw) {
    if (typeof raw !== 'object' || raw === null) return null;
    const obj = normalizeFieldNames(raw);
    const allowedKeys = new Set(CONFIG.allModuleKeys);
    const moduleKeys = Array.isArray(obj.moduleKeys)
        ? obj.moduleKeys.filter(k => allowedKeys.has(k))
        : [];
    let plateforme = obj.plateforme;
    if (plateforme && !['H5P', 'Elea'].includes(plateforme)) plateforme = null;

    let confiance = Number(obj.confiance);
    if (!Number.isFinite(confiance)) confiance = 0;
    confiance = Math.max(0, Math.min(1, confiance));

    let besoinClarification = null;
    if (obj.besoinClarification && typeof obj.besoinClarification === 'object') {
        const bc = obj.besoinClarification;
        if (typeof bc.question === 'string' && bc.question.trim()) {
            besoinClarification = {
                champ: String(bc.champ || ''),
                question: bc.question,
                options: Array.isArray(bc.options) ? bc.options.map(String) : [],
            };
        }
    }

    const qui = normalizeQui(typeof obj.qui === 'string' ? obj.qui : null);
    let quoi = typeof obj.quoi === 'string' ? obj.quoi.trim() || null : null;
    const niveau = typeof obj.niveau === 'string' ? obj.niveau.trim() || null : null;
    const suggestionEnrichissement = typeof obj.suggestionEnrichissement === 'string'
        ? (obj.suggestionEnrichissement.trim() || null)
        : null;

    // Garde-fou anti-confusion "type d'activité" / "sujet pédagogique" : si le LLM
    // a mis un nom de type d'activité dans "quoi" (ex "QCM", "un QCM", "des flashcards"),
    // on bascule la valeur dans moduleKeys et on force quoi=null (proceedAfterCollect
    // demandera ensuite le vrai sujet via t('confirm_missing_quoi')).
    if (quoi) {
        // Strip ponctuation + articles courants (FR + EN basiques) avant comparaison au fuzzyMap
        const norm = quoi.toLowerCase()
            .replace(/[«»"'.!?,;:()]/g, '')
            .replace(/^(un|une|des|le|la|les|du|de\s+la|de|d'|mon|ma|mes|a|an|the|some)\s+/i, '')
            .trim();
        // Match exact, puis singulier (gestion basique du pluriel : "flashcards" -> "flashcard")
        let matchedKey = CONFIG.fuzzyMap[norm];
        if (!matchedKey && norm.endsWith('s')) matchedKey = CONFIG.fuzzyMap[norm.slice(0, -1)];
        if (matchedKey) {
            if (!moduleKeys.includes(matchedKey)) moduleKeys.push(matchedKey);
            quoi = null;
        }
    }

    // nombreQuestions : entier strictement positif, sinon null
    let nombreQuestions = Number(obj.nombreQuestions);
    if (!Number.isFinite(nombreQuestions) || nombreQuestions < 1) {
        nombreQuestions = null;
    } else {
        nombreQuestions = Math.min(50, Math.round(nombreQuestions)); // cap raisonnable
    }

    return {
        qui,
        quoi,
        niveau,
        nombreQuestions,
        moduleKeys,
        plateforme,
        besoinClarification,
        suggestionEnrichissement,
        confiance,
    };
}

/**
 * Vrai si un DATA parsé représente une vraie intention de création (et non un
 * DATA "vide" que le LLM aurait émis à tort pour une simple question). En mode
 * auto, si le LLM choisit d'émettre <DATA> il devrait toujours avoir au moins
 * un signal exploitable ; ce garde-fou rattrape les cas où il émet un bloc
 * entièrement null (qui doit alors être traité comme une question).
 *
 * @param {object|null} data - résultat de parseDataBlock/validateSchema
 * @returns {boolean}
 */
export function isMeaningfulIntent(data) {
    if (!data || typeof data !== 'object') return false;
    return !!(
        (Array.isArray(data.moduleKeys) && data.moduleKeys.length) ||
        data.quoi ||
        data.qui ||
        data.niveau ||
        data.besoinClarification
    );
}

/**
 * Filet de sécurité : normalise "qui" en syntagme nominal.
 * Le LLM est déjà instruit de le faire, mais il peut désobéir, surtout sur les
 * petits modèles. Stripe les ouvertures à la 1ʳᵉ personne les plus courantes
 * dans les langues supportées par Caramel, retire la ponctuation finale et
 * capitalise la première lettre.
 */
function normalizeQui(raw) {
    if (typeof raw !== 'string') return null;
    let s = raw.trim();
    if (!s) return null;
    // FR / EN / ES / IT / DE / NL / PT — patterns de 1ʳᵉ personne du singulier les plus fréquents
    s = s.replace(
        /^(je suis|je m'appelle|moi[,]?\s*je suis|moi c'est|i am|i'm|my name is|soy|yo soy|sono|io sono|mi chiamo|ich bin|mein name ist|ik ben|mijn naam is|eu sou|sou|me chamo)\s+/i,
        ''
    );
    s = s.replace(/[.!?]+$/, '').trim();
    if (!s) return null;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Extraction d'intention. Retourne null en cas d'échec (réseau, parsing, schéma).
 * L'appelant doit alors retomber sur le flow guidé classique.
 */
export async function extractIntent(userMessage, { timeoutMs = 15000 } = {}) {
    const langFullName = getLangFullName();
    const prompt = buildPrompt(userMessage, langFullName);

    // Log discret si tentative d'injection détectée (pour observabilité)
    const injection = detectInjectionAttempt(userMessage);
    if (injection.detected) {
        console.warn('[Caramelia] tentative d\'injection détectée:', injection.reason);
    }

    try {
        // 1 retry sur réseau/timeout/5xx — l'extracteur est silencieux à l'utilisateur
        // (le caller retombe sur fallbackExtract si null) donc on peut être conservateur.
        const res = await fetchWithRetry(CONFIG.chatWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                // Fenêtre glissante (cf. CONFIG.history) : borne le payload LLM sans amputer l'UI
                history: getHistoryForLLM(),
                intent: 'extract',
                lang: langFullName,
                // Signal d'observabilité (null si rien à signaler). Le workflow peut
                // l'ignorer aujourd'hui mais le canal est plombé pour usage futur.
                securityFlag: injection.detected ? { detected: true, reason: injection.reason } : null,
            }),
        }, { retries: 1, timeoutMs });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const raw = data.response || data.message || '';
        return parseDataBlock(raw);
    } catch (err) {
        console.warn('[Caramelia] extractor: échec', err);
        return null;
    }
}

// Détecte un niveau scolaire courant (FR + abréviations universelles).
// Volontairement minimaliste : le LLM reste la source principale.
const NIVEAU_PATTERNS = [
    /\b(CP|CE1|CE2|CM1|CM2)\b/i,
    /\b([1-9])\s*(?:e|ème|eme)\b/i,                          // 6e, 5ème
    /\b(sixi[eè]me|cinqui[eè]me|quatri[eè]me|troisi[eè]me)\b/i,
    /\b(seconde|premi[eè]re|terminale)\b/i,
    /\b(L[1-3]|M[12]|BTS|DUT|licence|master|doctorat)\b/i,
    /\b(maternelle|primaire|coll[eè]ge|lyc[eé]e|universit[eé])\b/i,
];

function extractNiveau(text) {
    for (const re of NIVEAU_PATTERNS) {
        const m = text.match(re);
        if (m) return m[0];
    }
    return null;
}

function extractNombreQuestions(text) {
    // "10 questions", "5 items", "8 éléments", "12 cartes", "6 mots", "100 questions"…
    // \d{1,3} pour que le cap à 50 s'applique aussi quand l'utilisateur tape un nombre
    // déraisonnable (ex: "100 questions"). Au-delà de 999 on ignore : peu probable d'être
    // une intention sérieuse, et le LLM a déjà sa propre validation côté validateSchema().
    const m = text.match(/(\d{1,3})\s*(question|item|[ée]l[eé]ment|carte|flashcard|mot|paire|exercice|slide|diapo)/i);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.min(50, n);
}

/**
 * Fallback regex-based si le LLM est injoignable. Cherche moduleKeys via fuzzyMap.
 */
export function fallbackExtract(userMessage) {
    const raw = String(userMessage || '');
    const l = raw.toLowerCase();
    const sortedEntries = Object.entries(CONFIG.fuzzyMap).sort((a, b) => b[0].length - a[0].length);
    const found = new Set();
    for (const [kw, mk] of sortedEntries) {
        if (l.includes(kw)) found.add(mk);
    }
    return {
        qui: null, quoi: null,
        niveau: extractNiveau(raw),
        nombreQuestions: extractNombreQuestions(raw),
        moduleKeys: Array.from(found),
        plateforme: null,
        besoinClarification: null,
        suggestionEnrichissement: null,
        confiance: found.size ? 0.4 : 0,
    };
}
