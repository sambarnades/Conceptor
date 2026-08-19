/**
 * Caramelia — Orchestration des conversations
 *
 * Router intelligent : tant qu'aucun flow n'est engagé, le 1er message
 * passe par l'extracteur LLM pour pré-remplir qui/quoi/niveau/moduleKeys
 * et sauter les étapes inutiles. Si l'extraction échoue, fallback sur
 * le flow guidé classique (qui → quoi → catégorie → activité).
 *
 * @module caramelia/flow
 */

import { CONFIG } from './config.js';
import { state, resetGenState } from './state.js';
import { addBotMessage, addUserMessage, addCheckboxList, showTyping, removeTyping } from './dom.js';
import { runAutoQuery } from './chat.js';
import { fallbackExtract, extractIntent } from './extractor.js';
import { fillFormField, launchGenerations } from './actions.js';
import { downloadNotificationsAsZip } from '../ui/notifications.js';
import { t, tActivity } from './i18n.js';

// ── Helpers boutons ──
function buildCategoryButtons() {
    return Object.keys(CONFIG.activityCategories).map(id => ({
        label: t(`category_${id}`),
        action: () => selectCategory(id),
    }));
}

/**
 * Pour un ensemble de modules déduits par le LLM, renvoie les clés à AFFICHER
 * dans la checklist : l'union des catégories qui les contiennent, dans l'ordre
 * des catégories. Objectif : montrer tout l'éventail pertinent (et non les seules
 * activités devinées) pour que l'utilisateur voie/coche d'autres possibilités.
 * Les déduits sont toujours inclus, même s'ils sortent d'une catégorie connue.
 */
function categoryKeysForDeduced(moduleKeys) {
    const cats = CONFIG.activityCategories;
    const catIds = new Set();
    for (const mk of moduleKeys) {
        for (const id of Object.keys(cats)) {
            if (cats[id].keys.includes(mk)) catIds.add(id);
        }
    }
    const visible = [];
    for (const id of Object.keys(cats)) {
        if (!catIds.has(id)) continue;
        for (const k of cats[id].keys) if (!visible.includes(k)) visible.push(k);
    }
    for (const mk of moduleKeys) if (!visible.includes(mk)) visible.unshift(mk);
    return visible;
}

// ── Welcome ──
export function showWelcome() {
    addBotMessage(t('welcome_message'), [
        { label: t('welcome_btn_help'), action: () => startHelpFlow() },
        { label: t('welcome_btn_create'), action: () => startGenerateFlow() },
    ]);
}

// ── Help flow ──
export function startHelpFlow() {
    state.currentFlow = 'help';
    addUserMessage(t('help_user_label'));
    addBotMessage(t('help_intro'));
}

// ── Generate flow (guidé) ──
export function startGenerateFlow() {
    state.currentFlow = 'generate';
    state.genState = { step: 'qui' };
    addUserMessage(t('gen_user_label'));

    const sel = CONFIG.caramelSelectors;
    const eQui = document.querySelector(sel.qui)?.value?.trim();
    const eQuoi = document.querySelector(sel.quoi)?.value?.trim();

    if (eQui && eQuoi) {
        state.genState.qui = eQui;
        state.genState.quoi = eQuoi;
        state.genState.step = 'category';
        addBotMessage(t('gen_already_filled', { qui: eQui, quoi: eQuoi }), buildCategoryButtons());
    } else if (eQui) {
        state.genState.qui = eQui;
        state.genState.step = 'quoi';
        addBotMessage(t('gen_quoi_prompt_with_qui', { qui: eQui }));
    } else {
        addBotMessage(t('gen_qui_prompt'));
    }
}

function handleGenerateStep(text) {
    switch (state.genState.step) {
        case 'qui':
            state.genState.qui = text;
            fillFormField('qui', text);
            // Si quoi (ou plus) déjà connu via autoRoute, on saute les redondances
            proceedAfterCollect();
            break;
        case 'quoi':
            state.genState.quoi = text;
            fillFormField('quoi', text);
            proceedAfterCollect();
            break;
        case 'niveau':
            state.genState.niveau = text;
            fillFormField('niveau', text);
            proceedAfterCollect();
            break;
        case 'category':
            handleCategorySearch(text);
            break;
        case 'activity':
            handleActivitySearch(text);
            break;
        case 'video_url': {
            const u = (text || '').trim();
            if (!/^https?:\/\/\S+/i.test(u)) { addBotMessage(t('video_url_invalid')); return; }
            state.genState.videoUrl = u;
            state.genState.step = null;
            runGeneration(state.genState._pendingModuleKeys || state.genState.moduleKeys || []);
            break;
        }
        case 'bg_image':
            // L'utilisateur tape du texte alors qu'on attend une pièce jointe image.
            addBotMessage(t('bg_image_reminder'));
            break;
        default:
            addBotMessage(t('gen_resume'), [
                { label: t('gen_btn_create'), action: () => startGenerateFlow() },
                { label: t('gen_btn_back'), action: () => resetConversation() },
            ]);
    }
}

/**
 * Routeur central : à appeler dès qu'on enrichit `state.genState`.
 * Picks la prochaine étape utile en fonction de ce qui est déjà collecté
 * (qui, quoi, moduleKeys, besoinClarification) — évite de redemander
 * un champ déjà rempli en amont par autoRoute/mergeAndProceed ou par les champs DOM.
 *
 * @param {string} [recap] - Texte de récap optionnel à préfixer au prochain message.
 *   Si on est en garde-fou (qui/quoi manquant), recap est concaténé au prompt.
 *   Sinon le recap est envoyé en bulle séparée puis la prochaine étape suit.
 */
function proceedAfterCollect(recap = '') {
    const { qui, quoi, moduleKeys = [] } = state.genState;
    let { besoinClarification } = state.genState;

    // Garde-fous : qui/quoi/niveau sont obligatoires avant tout.
    // niveau (public cible) est aussi requis : sans lui, le LLM produit du contenu
    // sans calibration pédagogique (ton, vocabulaire, profondeur).
    if (!qui) {
        state.genState.step = 'qui';
        addBotMessage(recap + t('confirm_missing_qui'));
        return;
    }
    if (!quoi) {
        state.genState.step = 'quoi';
        addBotMessage(recap + t('confirm_missing_quoi'));
        return;
    }
    if (!state.genState.niveau) {
        state.genState.step = 'niveau';
        addBotMessage(recap + t('confirm_missing_niveau'));
        return;
    }

    // Si la besoinClarification du LLM concernait un champ désormais rempli (qui/quoi),
    // on la considère comme satisfaite — sinon le bot redemande indéfiniment le même
    // sujet à chaque tour ("Quel sujet ?" en boucle après que l'user a déjà répondu).
    if (besoinClarification && (besoinClarification.champ === 'qui' || besoinClarification.champ === 'quoi')) {
        besoinClarification = null;
        state.genState.besoinClarification = null;
    }

    // Recap envoyé séparément avant l'étape suivante (UX cohérente avec l'original)
    if (recap) addBotMessage(recap);

    // Clarification à lever (typiquement plateforme H5P/Éléa ambiguë)
    if (besoinClarification) {
        addBotMessage(t('extract_clarify_question', { question: besoinClarification.question }),
            buildClarificationButtons(besoinClarification, { moduleKeys }));
        return;
    }

    // Module(s) déjà identifié(s) par l'extracteur
    if (moduleKeys.length === 1) {
        runGeneration(moduleKeys);
        return;
    }
    if (moduleKeys.length > 1) {
        // On pré-coche les déduits MAIS on affiche tout l'éventail de leur(s)
        // catégorie(s), avec un dépliant "voir toutes les activités" (réponse au
        // retour terrain : "on ne voyait que quelques activités à cocher").
        const visible = categoryKeysForDeduced(moduleKeys);
        addCheckboxList(visible, moduleKeys, 'extract_preselected_intro', runGenerationFromChecklist, {
            expandKeys: CONFIG.allModuleKeys,
        });
        return;
    }

    // Aucun module déduit → demander la catégorie
    state.genState.step = 'category';
    addBotMessage(t('gen_quoi_ack_category_prompt', { quoi }), buildCategoryButtons());
}

function selectCategory(catId) {
    const cat = CONFIG.activityCategories[catId];
    if (!cat) return;
    state.genState.step = 'activity';
    state.genState.category = catId;
    addUserMessage(t(`category_${catId}`));
    addCheckboxList(cat.keys, [], 'checklist_intro', runGenerationFromChecklist, {
        expandKeys: CONFIG.allModuleKeys,
    });
}

function handleCategorySearch(text) {
    const l = text.toLowerCase();
    for (const id of Object.keys(CONFIG.activityCategories)) {
        const label = t(`category_${id}`).toLowerCase();
        if (label.includes(l) || l.includes(id)) {
            selectCategory(id);
            return;
        }
    }
    handleActivitySearch(text);
}

function handleActivitySearch(text) {
    const l = text.toLowerCase();
    for (const key of CONFIG.allModuleKeys) {
        const label = tActivity(key, { suffix: false }).toLowerCase();
        if (label && (label.includes(l) || l.includes(label))) {
            runGeneration([key]);
            return;
        }
    }
    // Fallback fuzzy
    const sortedEntries = Object.entries(CONFIG.fuzzyMap).sort((a, b) => b[0].length - a[0].length);
    for (const [kw, mk] of sortedEntries) {
        if (l.includes(kw)) { runGeneration([mk]); return; }
    }
    addBotMessage(t('gen_no_match', { text }), buildCategoryButtons());
}

// Vrai si l'un des modules sélectionnés exige une URL vidéo (cf. requiresVideoUrl).
function needsVideoUrl(moduleKeys) {
    const reqs = CONFIG.requiresVideoUrlKeys || [];
    return (moduleKeys || []).some(k => reqs.includes(k));
}

// Vrai si l'un des modules sélectionnés exige une image de fond (cf. requiresBackgroundImage).
function needsBackgroundImage(moduleKeys) {
    const reqs = CONFIG.requiresBackgroundImageKeys || [];
    return (moduleKeys || []).some(k => reqs.includes(k));
}

// ── Étape « image de fond » (Image interactive / Trouve la zone / Trouve les zones) ──
// Formats acceptés : miroir de la drop-zone hotspot de ui.js (image-manager convertit
// HEIC/HEIF/TIFF automatiquement) ; taille max alignée sur BG_IMAGE_CONFIG.maxFileSize.
const BG_IMAGE_NAME_RE = /\.(png|jpe?g|webp|gif|bmp|avif|svg|heic|heif|tiff?)$/i;
const BG_IMAGE_MAX_MB = 12;
const BG_IMAGE_ACCEPT = 'image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif,.svg,.heic,.heif,.tif,.tiff';

/**
 * Bascule l'`accept` du trombone vers les formats d'image de fond pendant l'étape
 * 'bg_image' (le filtre habituel PDF/DOCX/PNG/JPEG cacherait les WebP/HEIC/TIFF
 * pourtant acceptés par le pipeline image), puis le restaure ensuite.
 */
function setAttachAcceptForImage(on) {
    const fi = state.elements.fileInput;
    if (!fi) return;
    if (on) {
        if (!fi.dataset.defaultAccept) fi.dataset.defaultAccept = fi.getAttribute('accept') || '';
        fi.setAttribute('accept', BG_IMAGE_ACCEPT);
    } else if (fi.dataset.defaultAccept) {
        fi.setAttribute('accept', fi.dataset.defaultAccept);
        delete fi.dataset.defaultAccept;
    }
}

/** Vrai si Caramelia attend une image de fond (étape 'bg_image' du flow guidé). */
export function isAwaitingBackgroundImage() {
    return state.currentFlow === 'generate' && state.genState && state.genState.step === 'bg_image';
}

/**
 * Consomme une pièce jointe déposée pendant l'étape 'bg_image'. Renvoie true si le
 * fichier a été traité (accepté OU refusé avec message) — attachment.js ne doit alors
 * PAS lancer l'OCR dessus : l'image sert de FOND d'activité, pas de source de texte.
 * @param {File} file
 * @returns {boolean}
 */
export function handleBackgroundImageAttachment(file) {
    if (!isAwaitingBackgroundImage() || !file) return false;
    const looksImage = (file.type && file.type.indexOf('image/') === 0) || BG_IMAGE_NAME_RE.test(file.name || '');
    if (!looksImage) {
        addBotMessage(t('bg_image_invalid', { name: file.name || '?' }));
        return true;
    }
    if (file.size > BG_IMAGE_MAX_MB * 1024 * 1024) {
        addBotMessage(t('bg_image_too_large', { name: file.name, max: BG_IMAGE_MAX_MB }));
        return true;
    }
    setAttachAcceptForImage(false);
    state.genState.backgroundImageFile = file;
    state.genState.step = null;
    addBotMessage(t('bg_image_received', { name: file.name }));
    runGeneration(state.genState._pendingModuleKeys || state.genState.moduleKeys || []);
    return true;
}

// ── Lancement final ──
async function doLaunch(moduleKeys) {
    const batchIds = await launchGenerations(moduleKeys, {
        qui: state.genState.qui,
        quoi: state.genState.quoi,
        videoUrl: state.genState.videoUrl,
        backgroundImageFile: state.genState.backgroundImageFile,
    });

    // Si plusieurs activités générées avec succès dans ce batch, proposer un ZIP groupé
    // (réutilise le mécanisme existant du centre de notifications, exposé via downloadNotificationsAsZip)
    const buttons = [];
    if (batchIds && batchIds.length >= 2) {
        buttons.push({
            label: t('launch_btn_zip'),
            action: async () => {
                addUserMessage(t('launch_btn_zip'));
                const n = await downloadNotificationsAsZip(batchIds);
                if (!n) addBotMessage(t('launch_zip_empty'));
            },
        });
    }
    buttons.push({ label: t('launch_btn_new'), action: () => startGenerateFlow() });
    buttons.push({ label: t('launch_btn_back'), action: () => resetConversation() });

    addBotMessage(t('launch_done', { count: moduleKeys.length }), buttons);

    // Rebond pédagogique : propose 1-2 activités complémentaires sur le MÊME
    // sujet (mémorisation / évaluation), réutilisant qui/quoi/niveau déjà connus.
    // Transforme une création isolée en petit parcours cohérent.
    offerComplementaryActivities(moduleKeys);
}

/**
 * Active sûre : types d'activités multi-sujets qui complètent bien n'importe
 * quelle création (mémorisation + évaluation + lexique).
 */
function complementaryFor(madeKeys) {
    const made = new Set(madeKeys);
    const pool = ['Flashcards', 'QuizSetQCM', 'Glossary', 'Crossword'];
    return pool.filter(k => !made.has(k)).slice(0, 2);
}

/**
 * Affiche, après une génération réussie, une suggestion d'activités
 * complémentaires sur le même sujet. Ne s'affiche que si on connaît le sujet.
 */
function offerComplementaryActivities(madeKeys) {
    const quoi = state.genState.quoi;
    if (!quoi) return;
    // Une seule suggestion proactive par conversation (sinon on relance à chaque
    // génération en chaîne → lassant).
    if (state._proactiveShown) return;
    const comp = complementaryFor(madeKeys);
    if (!comp.length) return;
    state._proactiveShown = true;
    const buttons = comp.map(k => ({
        label: tActivity(k),
        action: () => { addUserMessage(tActivity(k)); runGeneration([k]); },
    }));
    buttons.push({ label: t('proactive_suggest_no'), action: () => addBotMessage(t('proactive_suggest_ok')) });
    addBotMessage(t('proactive_suggest_intro', { quoi }), buttons);
}

/**
 * Garde-fou central : refuse de lancer si "qui" ou "quoi" manque.
 * Pousse alors le flow vers le step manquant au lieu de générer à l'aveugle.
 */
function ensureRequiredFields() {
    if (!state.genState.qui) {
        state.genState.step = 'qui';
        addBotMessage(t('confirm_missing_qui'));
        return false;
    }
    if (!state.genState.quoi) {
        state.genState.step = 'quoi';
        addBotMessage(t('confirm_missing_quoi'));
        return false;
    }
    if (!state.genState.niveau) {
        state.genState.step = 'niveau';
        addBotMessage(t('confirm_missing_niveau'));
        return false;
    }
    return true;
}

/**
 * Décide si on affiche la suggestion d'enrichissement pédagogique.
 * Critères cumulatifs : suggestion fournie par le LLM, "quoi" maigre (< 6 mots),
 * pas de nombreQuestions précisé, et message d'origine pas trop verbeux (< 25 mots).
 * L'enseignant qui tape un brief détaillé n'est jamais embêté.
 */
function shouldShowEnrichmentSuggestion() {
    const g = state.genState;
    if (!g.suggestionEnrichissement) return false;
    if (g._suggestionShown) return false;
    const quoiWords = String(g.quoi || '').trim().split(/\s+/).filter(Boolean).length;
    if (quoiWords >= 6) return false;
    if (g.nombreQuestions) return false;
    const origWords = String(g.originalMessage || '').trim().split(/\s+/).filter(Boolean).length;
    if (origWords >= 25) return false;
    return true;
}

/**
 * Affiche un récap final + boutons "Lancer" / "Modifier" avant toute génération.
 * Aucune génération ne part sans confirmation explicite de l'utilisateur.
 *
 * Étape supplémentaire (discrète) : si l'intention extraite est maigre et que
 * le LLM a proposé une question d'enrichissement pédagogique, on l'affiche avant
 * le récap avec deux boutons (Compléter / Lancer comme ça). Ne s'affiche qu'une
 * seule fois (flag _suggestionShown).
 */
function runGeneration(moduleKeys) {
    if (!ensureRequiredFields()) return;

    if (shouldShowEnrichmentSuggestion()) {
        state.genState._suggestionShown = true;
        addBotMessage(t('enrich_intro') + state.genState.suggestionEnrichissement, [
            {
                label: t('enrich_btn_complete'),
                action: () => {
                    addUserMessage(t('enrich_btn_complete'));
                    state.genState.step = 'quoi';
                    addBotMessage(t('enrich_complete_prompt', { quoi: state.genState.quoi }));
                },
            },
            {
                label: t('enrich_btn_launch_anyway'),
                action: () => {
                    addUserMessage(t('enrich_btn_launch_anyway'));
                    runGeneration(moduleKeys);
                },
            },
        ]);
        return;
    }

    // Activité à URL vidéo (Vidéo interactive) : on a besoin du lien AVANT de générer.
    // On le demande une fois, puis on relance runGeneration avec l'URL en mémoire.
    if (needsVideoUrl(moduleKeys) && !state.genState.videoUrl) {
        state.genState.step = 'video_url';
        state.genState._pendingModuleKeys = moduleKeys;
        addBotMessage(t('video_url_ask'));
        return;
    }

    // Activité à image de fond (Image interactive, Trouve la/les zone·s) : on a besoin
    // du FICHIER image AVANT de générer. On le demande une fois (trombone ou glisser-
    // déposer sur le panel), puis handleBackgroundImageAttachment relance runGeneration.
    if (needsBackgroundImage(moduleKeys) && !state.genState.backgroundImageFile) {
        state.genState.step = 'bg_image';
        state.genState._pendingModuleKeys = moduleKeys;
        setAttachAcceptForImage(true);
        addBotMessage(t('bg_image_ask'));
        return;
    }

    const labels = moduleKeys.map(k => tActivity(k)).join(', ');
    let recap = t('confirm_recap_intro') + '\n';
    recap += t('confirm_recap_qui', { qui: state.genState.qui });
    recap += t('confirm_recap_quoi', { quoi: state.genState.quoi });
    if (state.genState.niveau) recap += t('confirm_recap_niveau', { niveau: state.genState.niveau });
    if (state.genState.nombreQuestions) recap += t('confirm_recap_nombre_questions', { n: state.genState.nombreQuestions });
    if (state.genState.videoUrl) recap += t('confirm_recap_video', { url: state.genState.videoUrl });
    if (state.genState.backgroundImageFile) recap += t('confirm_recap_image', { name: state.genState.backgroundImageFile.name });
    recap += t('confirm_recap_activities', { list: labels });

    addBotMessage(recap, [
        { label: t('confirm_btn_launch'), action: () => { addUserMessage(t('confirm_btn_launch')); doLaunch(moduleKeys); } },
        { label: t('confirm_btn_modify_activities'), action: () => { addUserMessage(t('confirm_btn_modify_activities')); state.genState.step = 'category'; addBotMessage(t('gen_quoi_ack_category_prompt', { quoi: state.genState.quoi }), buildCategoryButtons()); } },
        { label: t('confirm_btn_cancel'), action: () => resetConversation() },
    ]);
}

/**
 * Variante : affiche le choix utilisateur (validation checklist) avant le récap.
 */
function runGenerationFromChecklist(moduleKeys) {
    const labels = moduleKeys.map(k => tActivity(k)).join(', ');
    addUserMessage(labels);
    runGeneration(moduleKeys);
}

// ── Routeur AUTO (message libre) ──
/**
 * Point d'entrée de tout message libre. Un seul appel LLM (mode 'auto',
 * RAG-ancré côté n8n) où le LLM décide lui-même question vs création :
 *   - kind 'answer'   → on affiche la réponse pédagogique.
 *   - kind 'creation' → on enchaîne sur le flow de génération.
 *   - null            → service injoignable, on retombe sur le fallback regex.
 *
 * Plus aucune regex côté client ne décide question/création : c'est le LLM
 * (qui voit la documentation RAG et l'historique) qui tranche à chaque tour.
 */
async function autoRoute(text) {
    showTyping();
    let result;
    try {
        result = await runAutoQuery(text);
    } finally {
        removeTyping();
    }

    // Service injoignable → fallback regex local (best-effort)
    if (result === null) {
        const fb = fallbackExtract(text);
        if (fb.moduleKeys.length) {
            // Au moins un type d'activité deviné → flow de création dégradé
            handleCreationIntent(fb, text, { isFallback: true });
        } else {
            // Impossible de répondre hors-ligne → message d'erreur + actions
            addBotMessage(t('help_error_offline'), [
                { label: t('help_btn_retry'), action: () => autoRoute(text) },
                { label: t('gen_btn_create'), action: () => startGenerateFlow() },
            ]);
        }
        return;
    }

    if (result.kind === 'answer') {
        // Reste conversationnel : le prochain message repassera par autoRoute.
        state.currentFlow = null;
        addBotMessage(result.text, [
            { label: t('help_btn_create'), action: () => startGenerateFlow() },
        ]);
        return;
    }

    // result.kind === 'creation'
    handleCreationIntent(result.data, text, { isFallback: false });
}

/**
 * Reçoit une intention de création (depuis le LLM ou le fallback regex).
 * Si les champs Caramel contiennent une info que le message courant n'a PAS
 * fournie et qu'on ne l'a pas encore demandé dans cette conversation, on
 * propose d'hériter de ces infos ou de repartir de zéro (besoin remonté par
 * les enseignants : tous ne veulent pas hériter du contenu des champs).
 * Sinon on enchaîne directement — la fusion donne de toute façon priorité
 * au message courant (cf. mergeAndProceed), la question serait sans objet.
 */
function handleCreationIntent(extracted, originalText, { isFallback }) {
    const sel = CONFIG.caramelSelectors;
    const eQui = document.querySelector(sel.qui)?.value?.trim();
    const eQuoi = document.querySelector(sel.quoi)?.value?.trim();
    const eNiveau = document.querySelector(sel.niveau)?.value?.trim();

    // Seuls les champs qui COMPLÈTENT le message justifient la question :
    // un champ que l'extraction courante fournit déjà sera écrasé par elle.
    const domAddsInfo = (eQui && !extracted.qui) || (eQuoi && !extracted.quoi) || (eNiveau && !extracted.niveau);

    if (domAddsInfo && !state._prefillAsked) {
        state._prefillAsked = true;
        let details = '';
        if (eQui && !extracted.qui) details += t('confirm_recap_qui', { qui: eQui });
        if (eQuoi && !extracted.quoi) details += t('confirm_recap_quoi', { quoi: eQuoi });
        if (eNiveau && !extracted.niveau) details += t('confirm_recap_niveau', { niveau: eNiveau });
        addBotMessage(t('prefill_ask', { details }), [
            {
                label: t('prefill_btn_reuse'),
                action: () => { addUserMessage(t('prefill_btn_reuse')); mergeAndProceed(extracted, originalText, { useDom: true, isFallback }); },
            },
            {
                label: t('prefill_btn_fresh'),
                action: () => { addUserMessage(t('prefill_btn_fresh')); mergeAndProceed(extracted, originalText, { useDom: false, isFallback }); },
            },
        ]);
        return;
    }
    mergeAndProceed(extracted, originalText, { useDom: true, isFallback });
}

/**
 * Fusionne l'intention extraite avec (ou sans) les champs DOM Caramel, mémorise
 * le genState, auto-remplit les champs, construit le récap et délègue au routeur
 * central proceedAfterCollect.
 *
 * PRIORITÉ AU MESSAGE COURANT : ce que l'utilisateur vient de dire dans le chat
 * (extraction LLM) gagne toujours sur les champs déjà remplis — les champs DOM
 * ne servent qu'à combler les trous. Sans ça, une 2e création dans la même
 * conversation (ou des champs remplis avant d'ouvrir le chat) faisait que le
 * récap reprenait l'ancien contenu des champs au lieu du contexte donné dans
 * le message (bug terrain 2026-07).
 *
 * @param {boolean} useDom - true = combler les champs manquants avec
 *   #qui/#quoi/#niveau déjà remplis ; false = repartir de zéro (on n'utilise
 *   que ce que le LLM a extrait du message courant).
 */
function mergeAndProceed(extracted, text, { useDom, isFallback }) {
    const sel = CONFIG.caramelSelectors;
    const eQui = useDom ? document.querySelector(sel.qui)?.value?.trim() : '';
    const eQuoi = useDom ? document.querySelector(sel.quoi)?.value?.trim() : '';
    const eNiveau = useDom ? document.querySelector(sel.niveau)?.value?.trim() : '';
    const eNombreQuestions = useDom ? document.querySelector(sel.nombreQuestions)?.value?.trim() : '';

    const qui = extracted.qui || eQui || null;
    const quoi = extracted.quoi || eQuoi || null;
    const niveau = extracted.niveau || eNiveau || null;
    const nombreQuestions = extracted.nombreQuestions || eNombreQuestions || null;

    state.currentFlow = 'generate';
    state.genState = {
        qui,
        quoi,
        niveau,
        nombreQuestions,
        moduleKeys: extracted.moduleKeys || [],
        besoinClarification: extracted.besoinClarification || null,
        suggestionEnrichissement: extracted.suggestionEnrichissement || null,
        originalMessage: text,
        _isFallback: isFallback,
    };
    // On réécrit les champs avec les valeurs FUSIONNÉES : si l'extraction a
    // gagné sur un champ déjà rempli, le DOM doit refléter la nouvelle valeur
    // (le pipeline Caramel lit ces champs pour construire ses prompts).
    if (qui) fillFormField('qui', qui);
    if (quoi) fillFormField('quoi', quoi);
    if (niveau) fillFormField('niveau', niveau);
    if (nombreQuestions) fillFormField('nombreQuestions', String(nombreQuestions));

    // Récap. En mode fallback (LLM injoignable), avertissement honnête en préfixe.
    let recap = isFallback ? t('extract_fallback_warning') : '';
    recap += t('extract_recap_intro');
    if (qui) recap += t('extract_recap_qui', { qui });
    if (quoi) recap += t('extract_recap_quoi', { quoi });
    if (niveau) recap += t('extract_recap_niveau', { niveau });
    if (nombreQuestions) recap += t('extract_recap_nombre_questions', { n: nombreQuestions });

    proceedAfterCollect(recap);
}

/**
 * Construit les quick-replies pour une question de clarification.
 * Pour une clarif "plateforme", on filtre les moduleKeys selon le choix
 * et on relance le bon scénario.
 */
function buildClarificationButtons(bc, extracted) {
    if (bc.champ === 'plateforme') {
        const h5pSet = new Set(CONFIG.h5pKeys);
        const eleaSet = new Set(CONFIG.eleaKeys);
        const handlePlatformChoice = (label, set) => {
            addUserMessage(label);
            const filtered = extracted.moduleKeys.filter(k => set.has(k));
            if (filtered.length === 1) runGeneration(filtered);
            else addCheckboxList(filtered, filtered, 'extract_preselected_intro', runGenerationFromChecklist, {
                expandKeys: Array.from(set),
            });
        };
        return [
            { label: t('extract_btn_h5p'), action: () => handlePlatformChoice(t('extract_btn_h5p'), h5pSet) },
            { label: t('extract_btn_elea'), action: () => handlePlatformChoice(t('extract_btn_elea'), eleaSet) },
        ];
    }
    // Clarification générique : options libres → boutons libres (texte affiché tel quel)
    return (bc.options || []).map(opt => ({
        label: opt,
        action: () => {
            addUserMessage(opt);
            // L'option est traitée comme un nouveau message dans le flow
            handleUserInput(opt);
        },
    }));
}

// ── Router principal ──
export function handleUserInput(text) {
    if (!text) return;

    // Flow de création guidé en cours (réponse à une étape qui/quoi/niveau/
    // catégorie/activité/url vidéo) → traitement local, sans appel LLM.
    if (state.currentFlow === 'generate' && state.genState.step) {
        handleGenerateStep(text);
        return;
    }

    // Tout autre message libre → routeur AUTO : le LLM (RAG-ancré) décide à
    // chaque tour s'il s'agit d'une question ou d'une demande de création.
    autoRoute(text);
}

// ── Pièce jointe → proposition de sujet (#3) ──
/**
 * Appelé par attachment.js quand une transcription de document est terminée.
 * Déduit le sujet pédagogique du texte transcrit (via l'extracteur LLM), puis
 * PROPOSE ce sujet à l'utilisateur — sans jamais décider à sa place :
 *   - « Oui »          → on enchaîne sur la création avec ce sujet.
 *   - « Non, je précise » → on invite l'utilisateur à donner le sujet lui-même.
 *
 * @param {string} text - texte transcrit du document
 * @param {string} fileName - nom du fichier (pour le message)
 */
export async function offerActivityFromDocument(text, fileName) {
    const snippet = String(text || '').trim().slice(0, 1500);
    if (snippet.length < 20) return; // document vide / illisible → on ne propose rien

    showTyping();
    let extracted;
    try {
        extracted = await extractIntent(snippet);
    } finally {
        removeTyping();
    }

    const quoi = extracted && extracted.quoi;
    if (!quoi) {
        // Sujet indéterminable : on propose quand même de créer, l'utilisateur précisera.
        addBotMessage(t('attach_subject_unknown', { name: fileName }), [
            { label: t('gen_btn_create'), action: () => startGenerateFlow() },
        ]);
        return;
    }

    addBotMessage(t('attach_subject_confirm', { name: fileName, quoi }), [
        {
            label: t('attach_subject_yes'),
            action: () => {
                addUserMessage(t('attach_subject_yes'));
                // On ne reprend QUE le sujet (+ niveau si détecté) ; le type d'activité
                // reste à choisir par l'utilisateur (moduleKeys vide → checklist).
                handleCreationIntent({
                    qui: null,
                    quoi,
                    niveau: extracted.niveau || null,
                    nombreQuestions: extracted.nombreQuestions || null,
                    moduleKeys: [],
                    besoinClarification: null,
                    suggestionEnrichissement: null,
                }, `document: ${fileName}`, { isFallback: false });
            },
        },
        {
            label: t('attach_subject_no'),
            action: () => {
                addUserMessage(t('attach_subject_no'));
                addBotMessage(t('attach_subject_ask'));
            },
        },
    ]);
}

// ── Reset ──
export function resetConversation() {
    setAttachAcceptForImage(false);   // restaure le filtre habituel du trombone
    resetGenState();
    showWelcome();
}
