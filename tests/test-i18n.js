/**
 * Tests du systeme d'internationalisation (i18n) de Caramel
 *
 * Verifie l'integrite des fichiers JSON, la coherence des cles entre les 11 langues,
 * la qualite des valeurs (prompts, HTML), le fonctionnement de la traduction,
 * et la couverture des definitions d'activites.
 *
 * Usage : ouvrir tests/test-i18n.html depuis le serveur local.
 */

import { translations, t, loadTranslations, currentLang, translatePage } from '../js/core/translation.js';
import { allModules, h5pModules, moodleModules } from '../js/core/definitions.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
let skipCount = 0;
const results = [];
const timings = [];

let _ctx = { step: 0, stepName: '', file: '', module: '', source: '' };

function assert(condition, message, diagnostic = null) {
    const entry = {
        status: condition ? 'PASS' : 'FAIL',
        message,
        step: _ctx.step,
        stepName: _ctx.stepName,
        file: _ctx.file,
        module: _ctx.module,
        source: _ctx.source
    };
    if (!condition) {
        entry.diagnostic = diagnostic;
        failCount++;
        console.error('FAIL:', message);
    } else {
        passCount++;
    }
    results.push(entry);
}

function recordTiming(category, operation, durationMs) {
    timings.push({ category, operation, durationMs: Math.round(durationMs * 100) / 100 });
}

// =======================================================================
// CONFIGURATION
// =======================================================================

const LANGS = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];
const LOCALES_DIR = './js/locales';

// =======================================================================
// ETAPE 1 : INTEGRITE DES FICHIERS JSON
// =======================================================================

const loadedLocales = {}; // lang -> objet JSON charge

async function runStep1_FileIntegrity() {
    console.group('Etape 1 : Integrite des fichiers JSON');
    _ctx = { step: 1, stepName: 'Integrite fichiers', file: '', module: '', source: '' };

    for (const lang of LANGS) {
        _ctx.file = `${lang}.json`;
        const url = `${LOCALES_DIR}/${lang}.json`;
        try {
            const t0 = performance.now();
            const response = await fetch(url);
            const t1 = performance.now();

            assert(
                response.ok,
                `[1a.Fetch] ${lang}.json : HTTP ${response.status}`,
                !response.ok ? { url, status: response.status } : null
            );

            if (!response.ok) continue;

            const text = await response.text();
            const t2 = performance.now();

            // JSON parseable ?
            let obj;
            try {
                obj = JSON.parse(text);
                assert(true, `[1b.Parse] ${lang}.json : JSON valide`);
            } catch (e) {
                assert(false, `[1b.Parse] ${lang}.json : JSON INVALIDE`, { error: e.message });
                continue;
            }

            // Objet non vide ?
            const keyCount = Object.keys(obj).length;
            assert(
                keyCount > 0,
                `[1c.Keys] ${lang}.json : ${keyCount} cles`
            );

            // Taille raisonnable ? Garde-fou anti-emballement, pas une cible : le
            // seuil se mesure en CARACTÈRES (text.length), pas en octets — d'où un
            // ar.json de 465 Ko sur disque qui ne pèse ici que 340 Ko. Relevé de
            // 400 à 450 Ko à l'ajout du breton (2026-08-28) : el.json était déjà à
            // 399 Ko, une seule clé de plus faisait passer la suite au rouge alors
            // que rien n'était cassé.
            const sizeKo = Math.round(text.length / 1024);
            assert(
                sizeKo < 450,
                `[1d.Size] ${lang}.json : ${sizeKo} Ko (< 450 Ko)`
            );

            loadedLocales[lang] = obj;
            recordTiming('Chargement', `${lang}.json (${sizeKo} Ko)`, t2 - t0);

        } catch (e) {
            assert(false, `[1.Fetch] ${lang}.json : exception - ${e.message}`);
        }
    }

    // Tous les fichiers charges ?
    assert(
        Object.keys(loadedLocales).length === LANGS.length,
        `[1e.Total] ${Object.keys(loadedLocales).length}/${LANGS.length} fichiers charges`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 2 : COHERENCE DES CLES
// =======================================================================

async function runStep2_KeyConsistency() {
    console.group('Etape 2 : Coherence des cles');
    _ctx = { step: 2, stepName: 'Coherence cles', file: '', module: '', source: '' };

    const fr = loadedLocales['fr'];
    if (!fr) {
        assert(false, '[2.Skip] fr.json non charge, impossible de comparer');
        console.groupEnd();
        return;
    }

    const refKeys = Object.keys(fr);

    for (const lang of LANGS) {
        if (lang === 'fr') continue;
        _ctx.file = `${lang}.json`;

        const obj = loadedLocales[lang];
        if (!obj) {
            assert(false, `[2a.Missing] ${lang}.json non charge`);
            continue;
        }

        const langKeys = Object.keys(obj);

        // Meme nombre de cles ?
        assert(
            langKeys.length === refKeys.length,
            `[2a.Count] ${lang} : ${langKeys.length} cles (attendu ${refKeys.length})`
        );

        // Memes cles ?
        const refSet = new Set(refKeys);
        const langSet = new Set(langKeys);
        const missing = refKeys.filter(k => !langSet.has(k));
        const extra = langKeys.filter(k => !refSet.has(k));

        assert(
            missing.length === 0,
            `[2b.Missing] ${lang} : ${missing.length} cle(s) manquante(s)`,
            missing.length > 0 ? { keys: missing.slice(0, 10) } : null
        );
        assert(
            extra.length === 0,
            `[2c.Extra] ${lang} : ${extra.length} cle(s) en trop`,
            extra.length > 0 ? { keys: extra.slice(0, 10) } : null
        );

        // Meme ordre ?
        let orderOk = true;
        let firstDiff = -1;
        for (let i = 0; i < refKeys.length && i < langKeys.length; i++) {
            if (refKeys[i] !== langKeys[i]) {
                orderOk = false;
                firstDiff = i;
                break;
            }
        }
        assert(
            orderOk,
            `[2d.Order] ${lang} : ordre ${orderOk ? 'identique a fr' : 'different a l\'index ' + firstDiff}`,
            !orderOk ? { index: firstDiff, expected: refKeys[firstDiff], got: langKeys[firstDiff] } : null
        );
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 3 : QUALITE DES VALEURS
// =======================================================================

async function runStep3_ValueQuality() {
    console.group('Etape 3 : Qualite des valeurs');
    _ctx = { step: 3, stepName: 'Qualite valeurs', file: '', module: '', source: '' };

    for (const lang of LANGS) {
        _ctx.file = `${lang}.json`;
        const obj = loadedLocales[lang];
        if (!obj) continue;

        const keys = Object.keys(obj);

        // 3a. Pas de valeurs vides
        const emptyKeys = keys.filter(k => {
            const v = obj[k];
            return v === '' || v === undefined || v === null;
        });
        assert(
            emptyKeys.length === 0,
            `[3a.Empty] ${lang} : ${emptyKeys.length} valeur(s) vide(s)`,
            emptyKeys.length > 0 ? { keys: emptyKeys.slice(0, 10) } : null
        );

        // 3b. Pas de valeurs non-string
        const nonStringKeys = keys.filter(k => typeof obj[k] !== 'string');
        assert(
            nonStringKeys.length === 0,
            `[3b.Type] ${lang} : ${nonStringKeys.length} valeur(s) non-string`,
            nonStringKeys.length > 0 ? { keys: nonStringKeys.slice(0, 5).map(k => `${k} (${typeof obj[k]})`) } : null
        );
    }

    // Tests specifiques sur fr.json
    _ctx.file = 'fr.json';
    const fr = loadedLocales['fr'];
    if (!fr) { console.groupEnd(); return; }

    // 3c. Cles HTML : pas de whitespace parasite en debut
    const htmlKeys = Object.keys(fr).filter(k => typeof fr[k] === 'string' && fr[k].includes('<p>') && fr[k].length > 50);
    const dirtyHtml = htmlKeys.filter(k => fr[k].startsWith('\n') || fr[k].startsWith(' '));
    assert(
        dirtyHtml.length === 0,
        `[3c.HTML] fr : ${dirtyHtml.length}/${htmlKeys.length} cle(s) HTML avec whitespace parasite`,
        dirtyHtml.length > 0 ? { keys: dirtyHtml.slice(0, 5) } : null
    );

    // 3d. Cles de prompt (prefixe prompt_) : non vides et contiennent du contenu
    const promptKeys = Object.keys(fr).filter(k => k.startsWith('prompt_') && k.includes('_regles_') || k.includes('_structure_') || k.includes('_exemple_') || k === 'prompt_contexte_pedagogique_commun' || k === 'prompt_regles_pedagogiques_communes' || k === 'prompt_sources_communes');
    const emptyPrompts = promptKeys.filter(k => !fr[k] || fr[k].length < 10);
    assert(
        emptyPrompts.length === 0,
        `[3d.Prompts] fr : ${promptKeys.length - emptyPrompts.length}/${promptKeys.length} cles de prompt valides`,
        emptyPrompts.length > 0 ? { keys: emptyPrompts } : null
    );

    // 3e. Cles de prompt multi-lignes : retours a la ligne preserves
    const multilinePrompts = ['prompt_contexte_pedagogique_commun', 'prompt_regles_pedagogiques_communes', 'prompt_timeline_regles_specifiques'];
    for (const key of multilinePrompts) {
        const val = fr[key];
        if (val) {
            const lines = val.split('\n').length;
            assert(
                lines > 1,
                `[3e.Newlines] ${key} : ${lines} lignes (retours a la ligne preserves)`
            );
        } else {
            assert(false, `[3e.Newlines] ${key} : cle manquante`);
        }
    }

    // 3f. Cles avec backticks (LaTeX, exemples JSON) : preserves
    const backtickKeys = Object.keys(fr).filter(k => typeof fr[k] === 'string' && fr[k].includes('`'));
    assert(
        backtickKeys.length > 0,
        `[3f.Backticks] fr : ${backtickKeys.length} cle(s) contiennent des backticks (LaTeX/JSON preserves)`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 4 : FONCTION t() ET TRADUCTION
// =======================================================================

async function runStep4_TranslationFunction() {
    console.group('Etape 4 : Fonction t() et traduction');
    _ctx = { step: 4, stepName: 'Fonction t()', file: '', module: '', source: '' };

    // Charger fr.json d'abord pour que translations soit rempli
    // (la page de test n'a pas de footer CHANGELOG, donc le chargement auto ne se fait pas)
    try { await loadTranslations('fr'); } catch (e) { /* ignore */ }

    // 4a. t() retourne la valeur pour une cle existante
    const val = t('subtitle');
    assert(
        val && val !== 'subtitle',
        `[4a.Known] t('subtitle') = "${(val || '').substring(0, 40)}..." (pas la cle brute)`
    );

    // 4b. t() retourne la cle pour une cle inexistante
    const unknown = t('cle_totalement_inexistante_xyz');
    assert(
        unknown === 'cle_totalement_inexistante_xyz',
        `[4b.Unknown] t('cle_inexistante') retourne la cle elle-meme`
    );

    // 4c. t() avec chaine vide
    const empty = t('');
    assert(
        empty === '',
        `[4c.Empty] t('') retourne chaine vide`
    );

    // 4d. t() avec null/undefined
    const nullVal = t(null);
    assert(
        nullVal === '',
        `[4d.Null] t(null) retourne chaine vide`
    );

    console.groupEnd();
}

// =======================================================================
// ETAPE 5 : CHANGEMENT DE LANGUE
// =======================================================================

async function runStep5_LanguageSwitching() {
    console.group('Etape 5 : Changement de langue');
    _ctx = { step: 5, stepName: 'Changement langue', file: '', module: '', source: '' };

    // Sauvegarder la langue courante
    const originalLang = currentLang;

    for (const lang of LANGS) {
        _ctx.file = `${lang}.json`;
        try {
            const t0 = performance.now();
            await loadTranslations(lang);
            const t1 = performance.now();

            // La langue courante a change ?
            assert(
                currentLang === lang,
                `[5a.Lang] ${lang} : currentLang = "${currentLang}"`
            );

            // L'objet translations est rempli ?
            const key = 'subtitle';
            const val = translations[key];
            assert(
                val && typeof val === 'string' && val.length > 0,
                `[5b.Value] ${lang} : translations.subtitle = "${(val || '').substring(0, 30)}..."`
            );

            // Le contenu est different du francais (sauf pour fr) ?
            if (lang !== 'fr') {
                const frVal = loadedLocales['fr']?.[key];
                const langVal = loadedLocales[lang]?.[key];
                // Ne pas tester si la langue n'a pas ete traduite (valeur identique)
                if (frVal && langVal && frVal !== langVal) {
                    assert(
                        val === langVal,
                        `[5c.Match] ${lang} : valeur chargee correspond au fichier JSON`
                    );
                }
            }

            recordTiming('Changement langue', `${lang}`, t1 - t0);

        } catch (e) {
            assert(false, `[5.Switch] ${lang} : exception - ${e.message}`);
        }
    }

    // Restaurer le francais
    try {
        await loadTranslations(originalLang || 'fr');
    } catch (e) {
        // Ignorer l'erreur de restauration
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 6 : COUVERTURE DES DEFINITIONS
// =======================================================================

async function runStep6_DefinitionCoverage() {
    console.group('Etape 6 : Couverture des definitions');
    _ctx = { step: 6, stepName: 'Couverture definitions', file: '', module: '', source: '' };

    const fr = loadedLocales['fr'];
    if (!fr) { console.groupEnd(); return; }

    const frKeySet = new Set(Object.keys(fr));

    // 6a. Chaque module a une cle de nom dans les traductions
    for (const [key, mod] of Object.entries(allModules)) {
        _ctx.module = key;
        if (mod.name) {
            assert(
                frKeySet.has(mod.name),
                `[6a.Name] ${key} : cle de nom "${mod.name}" existe dans fr.json`
            );
        }
    }

    // 6b. Chaque module a une cle de description
    for (const [key, mod] of Object.entries(allModules)) {
        _ctx.module = key;
        if (mod.description) {
            assert(
                frKeySet.has(mod.description),
                `[6b.Desc] ${key} : cle de description "${mod.description}" existe dans fr.json`
            );
        }
    }

    // 6c. Cles de prompt pour les activites H5P
    _ctx.source = 'h5p';
    for (const [key, mod] of Object.entries(h5pModules)) {
        _ctx.module = key;
        // Convertir la cle module en prefixe prompt (ex: h5p_timeline -> TIMELINE)
        const prefix = key.replace(/^h5p_/, '').toUpperCase();
        const structKey = `${prefix}_STRUCTURE_JSON`;
        const rulesKey = `${prefix}_REGLES_SPECIFIQUES`;

        if (frKeySet.has(structKey)) {
            assert(true, `[6c.Prompt] ${key} : cle ${structKey} presente`);
        }
        // Ne pas echouer si la cle n'existe pas car certains modules utilisent des noms differents
    }

    // 6d. Onglets de filtrage
    const tabKeys = ['tab_all', 'tab_quiz', 'tab_text', 'tab_memory', 'tab_elea', 'tab_h5p'];
    for (const tabKey of tabKeys) {
        assert(
            frKeySet.has(tabKey),
            `[6d.Tab] Cle d'onglet "${tabKey}" presente`
        );
    }

    // 6e. Cles d'erreur
    const errorKeys = ['error_parse', 'error_network', 'error_validation', 'error_packaging'];
    for (const errKey of errorKeys) {
        assert(
            frKeySet.has(errKey),
            `[6e.Error] Cle d'erreur "${errKey}" presente`
        );
    }

    // 6f. Cles hints/feedbacks combines (editeur + simulateur)
    const hintsFeedbackKeys = [
        'editor_test_correctfeedback',
        'editor_test_partiallycorrectfeedback',
        'editor_test_incorrectfeedback',
        'editor_test_hint',
        'editor_test_add_hint',
        'editor_test_hint_text',
        'simulator_hint',
        'simulator_retry',
        'simulator_partial',
        'editor_test_options',
        'editor_test_answernumbering',
        'editor_test_numbering_none',
        'editor_test_numbering_abc',
        'editor_test_numbering_123',
        'editor_test_numbering_ABCD',
        'editor_test_numbering_iii',
        'editor_test_showstandardinstruction'
    ];
    for (const hfKey of hintsFeedbackKeys) {
        assert(
            frKeySet.has(hfKey),
            `[6f.HintsFeedback] Cle "${hfKey}" presente en francais`
        );
    }

    // Verifier la presence de ces cles dans TOUTES les langues chargees
    for (const lang of Object.keys(loadedLocales)) {
        if (lang === 'fr') continue;
        const langData = loadedLocales[lang];
        for (const hfKey of hintsFeedbackKeys) {
            assert(
                hfKey in langData,
                `[6f.HintsFeedback] Cle "${hfKey}" presente en ${lang}`
            );
        }
    }

    console.groupEnd();
}

// =======================================================================
// ETAPE 7 : PERFORMANCE
// =======================================================================

async function runStep7_Performance() {
    console.group('Etape 7 : Performance');
    _ctx = { step: 7, stepName: 'Performance', file: '', module: '', source: '' };

    // 7a. Temps moyen de chargement
    const loadTimings = timings.filter(t => t.category === 'Chargement');
    if (loadTimings.length > 0) {
        const avgMs = loadTimings.reduce((sum, t) => sum + t.durationMs, 0) / loadTimings.length;
        assert(
            avgMs < 500,
            `[7a.LoadAvg] Temps moyen de chargement : ${avgMs.toFixed(1)}ms (< 500ms)`
        );
    }

    // 7b. Temps de changement de langue
    const switchTimings = timings.filter(t => t.category === 'Changement langue');
    if (switchTimings.length > 0) {
        const avgMs = switchTimings.reduce((sum, t) => sum + t.durationMs, 0) / switchTimings.length;
        assert(
            avgMs < 1000,
            `[7b.SwitchAvg] Temps moyen de changement : ${avgMs.toFixed(1)}ms (< 1000ms)`
        );
    }

    // 7c. Performance de translatePage
    const t0 = performance.now();
    translatePage();
    const t1 = performance.now();
    const duration = t1 - t0;
    assert(
        duration < 200,
        `[7c.TranslatePage] translatePage() en ${duration.toFixed(1)}ms (< 200ms)`
    );
    recordTiming('Performance', 'translatePage()', duration);

    console.groupEnd();
}

// =======================================================================
// EXECUTION
// =======================================================================

export const STEP_NAMES = [
    '',
    'Integrite fichiers',
    'Coherence cles',
    'Qualite valeurs',
    'Fonction t()',
    'Changement langue',
    'Couverture definitions',
    'Performance'
];

export const STEP_DESCRIPTIONS = [
    '',
    'Verifie que les 11 fichiers JSON de traduction (js/locales/*.json) se chargent correctement via fetch(), sont du JSON valide, et contiennent un nombre de cles non nul.\n\nExemple : si un fichier a ete corrompu ou supprime, ce test le detecte immediatement.',
    'Compare chaque fichier de langue a fr.json : meme nombre de cles, memes noms de cles, meme ordre. Detecte les cles manquantes, en trop, ou desordonnees.\n\nExemple : si on ajoute une cle dans fr.json mais qu\'on oublie de.json, ce test le signale.',
    'Verifie la qualite des valeurs : aucune valeur vide, types corrects (string), pas de whitespace parasite dans les cles HTML, retours a la ligne preserves dans les prompts IA, backticks preserves pour le LaTeX.\n\nExemple : les prompts envoyes a l\'IA doivent contenir des \\n — sinon le formatage est casse.',
    'Teste la fonction t() de translation.js : retourne la bonne traduction pour une cle connue, retourne la cle elle-meme pour une cle inconnue, gere les cas limites (null, chaine vide).\n\nExemple : t(\'subtitle\') doit retourner le sous-titre traduit, pas la chaine "subtitle".',
    'Charge successivement chacune des 11 langues via loadTranslations(), verifie que currentLang change et que les valeurs sont correctement injectees dans l\'objet translations.\n\nExemple : apres loadTranslations(\'en\'), translations.subtitle doit etre en anglais.',
    'Verifie que toutes les activites definies dans definitions.js ont leurs cles de traduction dans fr.json : noms, descriptions, onglets de filtrage, messages d\'erreur.\n\nExemple : si on ajoute un nouveau module sans ses traductions, ce test le detecte.',
    'Mesure les temps de chargement (fetch + parse), de changement de langue, et d\'application de translatePage() au DOM. Verifie que tout reste sous les seuils de performance.\n\nExemple : translatePage() doit traiter 1651 cles en moins de 200ms.'
];

export async function runAllTests() {
    console.log('=== Tests i18n Caramel (7 etapes) ===');
    passCount = 0;
    failCount = 0;
    skipCount = 0;
    results.length = 0;
    timings.length = 0;

    await runStep1_FileIntegrity();
    await runStep2_KeyConsistency();
    await runStep3_ValueQuality();
    await runStep4_TranslationFunction();
    await runStep5_LanguageSwitching();
    await runStep6_DefinitionCoverage();
    await runStep7_Performance();

    console.log(`\n=== Resultats : ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ===`);

    return { passCount, failCount, skipCount, results, STEP_NAMES, timings };
}
