/**
 * @file Complétude du câblage d'une activité — de `definitions.js` jusqu'aux 11 locales.
 *
 * Intégrer une activité dans Caramel touche une dizaine d'endroits (le skill
 * `caramel-add-h5p-activity` en décrit 18 étapes). Rien ne vérifiait que ces endroits
 * restent cohérents : oublier une entrée de `field-constraints.js`, une fixture
 * d'exemple ou une clé de prompt dans l'une des 11 langues ne casse RIEN au chargement.
 * Le défaut n'apparaît qu'à l'usage, sur une activité précise, chez l'utilisateur.
 *
 * Cette suite relie entre elles les six sources de vérité :
 *
 *   definitions.js  ─┬─→ processors/index.js        (machineName, version, dépendances)
 *                    ├─→ assets/data/examples/      (fixture jouable)
 *                    ├─→ prompt-generator ACTIVITY_CONFIG + prompts des 11 locales
 *                    ├─→ locales (nom + description de la tuile)
 *                    ├─→ field-constraints.js       (types de rendu des champs)
 *                    └─→ whitelist de dépôt Sucrerie (piège 8 de CLAUDE.md)
 *
 * Elle GÈLE aussi la résolution des types de rendu : le repli conteneur de
 * `resolveRenderTypeForField` itère `FIELD_CONSTRAINTS` et retient le PREMIER module
 * porteur du sous-chemin — l'ORDRE des entrées est donc porteur de sens, et une
 * insertion au mauvais endroit a déjà fait perdre le WYSIWYG d'un champ côté Sucrerie.
 */

let passCount = 0;
let failCount = 0;
const results = [];
let _ctx = { step: 0, stepName: '' };

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, step: _ctx.step, stepName: _ctx.stepName };
    if (!condition) { entry.diagnostic = diagnostic; failCount++; }
    else passCount++;
    results.push(entry);
}
function beginStep(n, name) { _ctx = { step: n, stepName: name }; }
function endStep() { _ctx = { step: 0, stepName: '' }; }

export const STEP_NAMES = {
    1: 'definitions ↔ processeurs H5P',
    2: 'definitions ↔ locales (nom, description)',
    3: 'definitions ↔ prompts des 11 langues',
    4: 'definitions ↔ fixtures d\'exemple',
    5: 'field-constraints : couverture et ordre',
    6: 'Liste des modules H5P (dérive vers Sucrerie)',
    7: 'Aucune ressource distante dans les tuiles',
    8: 'Classification des erreurs de génération'
};

export const STEP_DESCRIPTIONS = {
    1: 'Chaque module H5P a des métadonnées de processeur, cohérentes avec son machineName.',
    2: 'Les clés `name` et `description` de chaque tuile existent dans les 11 locales.',
    3: 'Chaque activité qui déclare un prompt a ses trois clés dans les 11 langues.',
    4: 'Chaque activité générable a une fixture jouable, ou figure dans la liste assumée.',
    5: 'Le type de rendu résolu est GELÉ — le repli conteneur dépend de l\'ordre des entrées.',
    6: 'La liste des modules H5P est la whitelist de dépôt de Sucrerie : toute évolution doit être propagée.',
    7: 'Aucun module ne référence une image sur un domaine tiers (traçage + dépendance externe).',
    8: 'Un échec de génération est classé (PARSE/NETWORK/VALIDATION/PACKAGING) et non affiché brut.'
};

const BASE = new URL('../', new URL(import.meta.url)).href;
const LANGS = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];

let definitions = null, processors = null, locales = {}, exemples = [];

async function charger() {
    definitions = await import(BASE + 'js/core/definitions.js');
    processors = await import(BASE + 'js/h5p/processors/index.js');
    for (const l of LANGS) {
        try { locales[l] = await (await fetch(`${BASE}js/locales/${l}.json`)).json(); }
        catch { locales[l] = null; }
    }
    // Le serveur statique ne liste pas les dossiers de façon fiable : on s'appuie sur le
    // mapping du banc Node, seule source qui relie une fixture à sa clé de module.
    // `fixtures-map.mjs` importe `node:fs` : illisible en navigateur. La table de
    // préfixes vit donc dans `fixtures-prefixes.js`, données pures, que le banc Node
    // ré-exporte — une seule source de vérité pour les deux mondes.
    try {
        const map = await import(BASE + 'tests/roundtrip/fixtures-prefixes.js');
        exemples = map.PREFIX_TO_MODULE || [];
    } catch { exemples = []; }
}

// ============================================================================
// ÉTAPE 1 — Processeurs
// ============================================================================

function runStep1_Processeurs() {
    beginStep(1, STEP_NAMES[1]);

    const { h5pModules } = definitions;
    const cles = Object.keys(h5pModules);
    assert(cles.length > 0, '[1.1] definitions.js déclare des modules H5P', { nombre: cles.length });

    for (const k of cles) {
        const def = h5pModules[k];
        let meta = null;
        try { meta = processors.getModuleMetadata(k); } catch (e) { /* signalé ci-dessous */ }

        assert(!!meta, `[1.2] ${k} : le processeur expose des métadonnées`,
            { indice: 'entrée manquante dans processors/index.js (double map)' });
        if (!meta) continue;

        assert(typeof meta.machineName === 'string' && meta.machineName.startsWith('H5P.'),
            `[1.3] ${k} : machineName du processeur est un nom H5P valide`,
            { machineName: meta.machineName });

        // definitions.js et le processeur doivent parler du MÊME type H5P : une divergence
        // produit un .h5p dont le h5p.json ne correspond pas au contenu.
        if (def.machineName) {
            assert(def.machineName === meta.machineName,
                `[1.4] ${k} : machineName identique dans definitions.js et le processeur`,
                { definitions: def.machineName, processeur: meta.machineName });
        }

        assert(meta.version && Number.isInteger(meta.version.major) && Number.isInteger(meta.version.minor),
            `[1.5] ${k} : version majeure/mineure déclarée`, { version: meta.version });

        assert(Array.isArray(meta.extraDependencies),
            `[1.6] ${k} : extraDependencies est un tableau (même vide)`,
            { obtenu: typeof meta.extraDependencies });

        for (const d of meta.extraDependencies || []) {
            assert(d && typeof d.machineName === 'string'
                && Number.isInteger(d.majorVersion) && Number.isInteger(d.minorVersion),
                `[1.7] ${k} : dépendance bien formée`, { dependance: d });
        }
    }

    endStep();
}

// ============================================================================
// ÉTAPE 2 — Nom et description dans les 11 locales
// ============================================================================

function runStep2_Locales() {
    beginStep(2, STEP_NAMES[2]);

    for (const l of LANGS) {
        assert(!!locales[l], `[2.1] La locale ${l}.json est chargeable`);
    }

    const { allModules } = definitions;
    const manques = [];
    for (const [k, m] of Object.entries(allModules)) {
        for (const champ of ['name', 'description']) {
            const cle = m[champ];
            // Les libellés peuvent être littéraux : on ne contrôle que ce qui RESSEMBLE
            // à une clé i18n (minuscules + underscores, sans espace).
            if (typeof cle !== 'string' || !/^[a-z][a-z0-9_]+$/.test(cle)) continue;
            for (const l of LANGS) {
                if (!locales[l]) continue;
                if (!(cle in locales[l])) manques.push(`${k}.${champ} → « ${cle} » absent de ${l}.json`);
            }
        }
    }
    assert(manques.length === 0,
        '[2.2] Les clés de nom et de description de chaque tuile existent dans les 11 locales',
        { manques: manques.slice(0, 12), total: manques.length });

    endStep();
}

// ============================================================================
// ÉTAPE 3 — Prompts dans les 11 langues
// ============================================================================

/** Suffixes attendus pour un prompt d'activité complet. */
const SUFFIXES_PROMPT = ['_regles_specifiques', '_structure_json', '_exemple_rendu'];

async function runStep3_Prompts() {
    beginStep(3, STEP_NAMES[3]);

    const pg = await import(BASE + 'js/services/prompt-generator.js');
    const { allModules } = definitions;

    const sansPrefixe = [];
    const manques = [];

    for (const [k, m] of Object.entries(allModules)) {
        if (m.hidden) continue;                       // `gift` : format d'export, pas d'activité
        const resultKey = pg.resultKeyForModule ? pg.resultKeyForModule(k) : m.promptId;
        if (!resultKey) continue;                     // activité sans prompt propre

        const prefixe = pg.prefixForModule(k);
        if (!prefixe) { sansPrefixe.push(k); continue; }

        for (const suffixe of SUFFIXES_PROMPT) {
            const cle = prefixe + suffixe;
            // Toutes les activités n'ont pas les 3 suffixes : on n'exige la parité
            // entre langues que pour les clés qui EXISTENT en français (référence).
            if (!locales.fr || !(cle in locales.fr)) continue;
            for (const l of LANGS) {
                if (!locales[l]) continue;
                if (!(cle in locales[l])) manques.push(`${cle} absent de ${l}.json`);
            }
        }
    }

    assert(sansPrefixe.length === 0,
        '[3.1] Toute activité visible déclarant un prompt est résolue par prefixForModule',
        { sansPrefixe });
    assert(manques.length === 0,
        '[3.2] Les clés de prompt présentes en français le sont dans les 10 autres langues',
        { manques: manques.slice(0, 12), total: manques.length });

    endStep();
}

// ============================================================================
// ÉTAPE 4 — Fixtures d'exemple
// ============================================================================

/**
 * Activités générables SANS fixture d'exemple, assumé.
 *
 * ⚠️ Si ce test échoue après l'ajout d'une activité, c'est le signal utile : fournir
 * une fixture (elle alimente le banc `harness.mjs` : déterminisme, idempotence,
 * snapshot) ou inscrire ici la raison de s'en passer.
 */
const SANS_FIXTURE_ASSUME = new Set([
    // `ComplexFillTheBlanks` (H5P.AdvancedBlanks) partage la forme de FillInTheBlanks ;
    // sa fixture propre reste à écrire.
    'ComplexFillTheBlanks'
]);

function runStep4_Fixtures() {
    beginStep(4, STEP_NAMES[4]);

    assert(exemples.length > 0, '[4.1] Le mapping fixture → module est chargeable',
        { entrees: exemples.length });
    if (!exemples.length) { endStep(); return; }

    const { allModules } = definitions;
    const avecFixture = new Set(exemples.map(e => e.moduleKey));

    const manquantes = Object.entries(allModules)
        .filter(([k, m]) => !m.hidden && !avecFixture.has(k) && !SANS_FIXTURE_ASSUME.has(k))
        .map(([k]) => k);

    assert(manquantes.length === 0,
        '[4.2] Toute activité visible a une fixture d\'exemple, ou figure dans SANS_FIXTURE_ASSUME',
        {
            manquantes,
            consequence: 'sans fixture, l\'activité échappe à harness.mjs (T1 déterminisme, '
                + 'T2 idempotence, T4 snapshot) — aucune régression d\'export n\'y serait vue'
        });

    // Liste blanche saine : pas de clé fantôme, pas de clé qui a en fait une fixture.
    const fantomes = [...SANS_FIXTURE_ASSUME].filter(k => !(k in allModules));
    assert(fantomes.length === 0, '[4.3] SANS_FIXTURE_ASSUME : aucune clé fantôme', { fantomes });
    const enTrop = [...SANS_FIXTURE_ASSUME].filter(k => avecFixture.has(k));
    assert(enTrop.length === 0,
        '[4.4] SANS_FIXTURE_ASSUME : aucune clé qui possède en réalité une fixture', { enTrop });

    // Toute entrée du mapping doit désigner un module existant.
    const orphelines = exemples.filter(e => !(e.moduleKey in allModules)).map(e => e.prefix);
    assert(orphelines.length === 0,
        '[4.5] Le mapping ne référence que des modules déclarés', { orphelines });

    endStep();
}

// ============================================================================
// ÉTAPE 5 — field-constraints : couverture et ORDRE
// ============================================================================

/**
 * Résolutions GELÉES du type de rendu.
 *
 * `resolveRenderTypeForField` cherche d'abord une correspondance directe, puis retombe
 * sur un repli conteneur qui parcourt `FIELD_CONSTRAINTS` et retient le PREMIER module
 * possédant le sous-chemin. L'ORDRE des entrées change donc le résultat — CLAUDE.md
 * documente un cas vécu : `taskDescription` gagné par `FindTheHotspot`/`plain` au lieu
 * de `FillInTheBlanks`/`html+latex`, faisant perdre le WYSIWYG au champ « Consigne »
 * des sous-questions.
 *
 * Un écart ici ne signale pas forcément une erreur : il signale qu'une entrée a été
 * insérée à une position qui change le rendu d'un champ existant. À examiner avant de
 * mettre la valeur à jour.
 */
const RENDU_GELE = [
    ['MultipleChoice', 'question', 'html+latex'],
    ['MultipleChoice', 'answers.0.text', 'html+latex'],
    ['TrueFalse', 'question', 'html+latex'],
    ['QuizSet', 'questions.0.params.question', 'html+latex'],
    ['QuizSetQCM', 'questions.0.params.question', 'html+latex'],
    ['QuizSetVF', 'questions.0.params.question', 'html+latex'],
    ['QuizSet', 'questions.0.params.answers.0.text', 'html+latex'],
    ['QuizSet', 'questions.0.params.taskDescription', 'html+latex'],
    ['CoursePresentation', 'slides.0.exercise.question', 'html+latex'],
    ['InteractiveBook', 'chapters.0.content.0.exercise.question', 'html+latex'],
    ['FillInTheBlanks', 'questions.0', 'unicode+markers'],
    // Mesurées sur le code, non supposées : les définitions et les grilles n'acceptent
    // pas de HTML (H5P.Crossword et H5P.FindTheWords rendent du texte brut).
    ['Crossword', 'words.0.clue', 'plain'],
    ['Crossword', 'words.0.answer', 'plain+letters'],
    ['FindTheWords', 'wordList', 'plain']
];

async function runStep5_FieldConstraints() {
    beginStep(5, STEP_NAMES[5]);

    const fc = await import(BASE + 'js/h5p/field-constraints.js');
    const { resolveRenderTypeForField } = await import(BASE + 'js/editor/richtext-editor.js');
    const { h5pModules } = definitions;

    // Couverture : soit une entrée directe, soit une résolution effective par repli.
    const nonResolus = [];
    for (const k of Object.keys(h5pModules)) {
        if (h5pModules[k].hidden) continue;
        const direct = fc.getConstraints(k);
        if (direct) continue;
        // Pas d'entrée directe : le repli conteneur doit au moins résoudre un champ typique.
        const parRepli = resolveRenderTypeForField(k, 'questions.0.params.question');
        if (!parRepli) nonResolus.push(k);
    }
    assert(nonResolus.length === 0,
        '[5.1] Chaque module H5P visible a des contraintes, directes ou par repli conteneur',
        {
            nonResolus,
            consequence: 'sans contraintes, l\'éditeur rend le champ en texte brut : ni WYSIWYG, '
                + 'ni bouton formule'
        });

    // Résolutions gelées.
    let ecarts = 0;
    for (const [moduleKey, chemin, attendu] of RENDU_GELE) {
        const obtenu = resolveRenderTypeForField(moduleKey, chemin);
        if (obtenu !== attendu) ecarts++;
        assert(obtenu === attendu,
            `[5.2] ${moduleKey} · ${chemin} → ${attendu}`,
            {
                attendu, obtenu,
                indice: 'le repli conteneur dépend de l\'ORDRE des entrées de FIELD_CONSTRAINTS ; '
                    + 'une insertion mal placée change le rendu d\'un champ existant'
            });
    }
    assert(ecarts === 0,
        `[5.3] Les ${RENDU_GELE.length} résolutions gelées sont inchangées`, { ecarts });

    // Les variantes d'une même famille doivent se comporter à l'identique.
    for (const chemin of ['questions.0.params.question', 'questions.0.params.answers.0.text']) {
        const ref = resolveRenderTypeForField('QuizSet', chemin);
        for (const variante of ['QuizSetQCM', 'QuizSetVF']) {
            assert(resolveRenderTypeForField(variante, chemin) === ref,
                `[5.4] ${variante} rend ${chemin} comme QuizSet`,
                { reference: ref, variante: resolveRenderTypeForField(variante, chemin) });
        }
    }

    endStep();
}

// ============================================================================
// ÉTAPE 6 — Dérive de la liste des modules vers Sucrerie
// ============================================================================

/**
 * Liste GELÉE des modules H5P exposés par Caramel.
 *
 * Piège 8 de CLAUDE.md : cette liste EST la whitelist de dépôt de Sucrerie. Sucrerie
 * n'accepte que les types H5P gérés ici, via `assets/js/core/activity-types.js`
 * (constante `CARAMEL_H5P`), dont sa whitelist est dérivée.
 *
 * Ajouter, retirer ou masquer un module ici SANS re-synchroniser Sucrerie donne un
 * dépôt qui refuse une activité pourtant produite par Caramel. Ce test ne peut pas
 * lire l'autre dépôt : il fige la liste pour que toute évolution soit VOLONTAIRE et
 * rappelle la propagation à faire.
 */
const MODULES_H5P_GELES = [
    'Chart', 'ComplexFillTheBlanks', 'CoursePresentation', 'Crossword', 'DialogCards',
    'Dictation', 'DragAndDrop', 'DragTheWords', 'Essay', 'FillInTheBlanks',
    'FindMultipleHotspots', 'FindTheHotspot', 'FindTheWords', 'Flashcards', 'Glossary',
    'ImageHotspots', 'InteractiveBook', 'InteractiveVideo', 'MarkTheWords',
    'MultipleChoice', 'QuizSet', 'QuizSetQCM', 'QuizSetVF', 'SingleChoiceSet',
    'SortParagraphs', 'Summary', 'Timeline', 'TrueFalse'
];

function runStep6_Whitelist() {
    beginStep(6, STEP_NAMES[6]);

    const actuels = Object.keys(definitions.h5pModules).sort();
    const geles = [...MODULES_H5P_GELES].sort();

    const ajoutes = actuels.filter(k => !geles.includes(k));
    const retires = geles.filter(k => !actuels.includes(k));

    assert(ajoutes.length === 0,
        '[6.1] Aucun module H5P ajouté sans mise à jour de la liste gelée',
        {
            ajoutes,
            aFaire: 'ajouter la clé ici ET dans CARAMEL_H5P de assets/js/core/activity-types.js '
                + 'côté Sucrerie, sinon le dépôt refusera l\'activité'
        });
    assert(retires.length === 0,
        '[6.2] Aucun module H5P retiré sans mise à jour de la liste gelée',
        { retires, aFaire: 'retirer la clé ici ET côté Sucrerie' });

    // `H5P.AdvancedText` est volontairement masqué — il ne doit pas réapparaître.
    assert(!('AdvancedText' in definitions.h5pModules),
        '[6.3] H5P.AdvancedText reste hors du registre (masqué volontairement)');

    // Le champ `hidden` change aussi la whitelist : on fige les modules masqués.
    // `gift` : format d'export du Test Éléa. `ComplexFillTheBlanks` : intégré mais non
    // exposé en tuile. Démasquer l'un des deux le rend déposable côté Sucrerie — décision
    // à prendre sciemment, d'où le gel.
    const masques = Object.entries(definitions.allModules)
        .filter(([, m]) => m.hidden).map(([k]) => k).sort();
    assert(JSON.stringify(masques) === JSON.stringify(['ComplexFillTheBlanks', 'gift']),
        '[6.4] Les modules masqués sont exactement ComplexFillTheBlanks et gift',
        { masques, attendu: ['ComplexFillTheBlanks', 'gift'] });

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

// ============================================================================
// ÉTAPE 7 — Aucune ressource distante dans les tuiles
// ============================================================================

async function runStep7_ImagesLocales() {
    beginStep(7, STEP_NAMES[7]);

    const modules = Object.entries(definitions.allModules);
    assert(modules.length > 0, '[7.1] Le registre des modules est chargé', modules.length);

    // Une image de tuile sur un domaine tiers fait sortir une requête au chargement de
    // la grille : traçage de l'enseignant par ce tiers, et panne d'affichage si le
    // domaine tombe. `gift` pointait moodle.org (inerte car masqué, actif au premier
    // démasquage) — le garde-fou vaut pour TOUS les modules, masqués compris.
    const distantes = modules
        .filter(([, m]) => m && typeof m.image === 'string' && /^(https?:)?\/\//i.test(m.image))
        .map(([k, m]) => `${k} → ${m.image}`);
    assert(distantes.length === 0,
        '[7.2] Aucun module ne référence une image sur un domaine tiers',
        {
            distantes,
            correction: 'rapatrier le fichier dans assets/images/activities/ et pointer le chemin local'
        });

    // Chaque image déclarée doit exister : une tuile à l'image cassée est un défaut
    // visible, et le chemin n'est vérifié nulle part ailleurs.
    const declarees = [...new Set(modules
        .filter(([, m]) => m && typeof m.image === 'string' && m.image)
        .map(([, m]) => m.image))];
    for (const chemin of declarees) {
        let present = false;
        try { present = (await fetch(BASE + chemin, { method: 'HEAD' })).ok; } catch { /* absent */ }
        assert(present, `[7.3] L'image de tuile existe : ${chemin}`);
    }

    endStep();
}

// ============================================================================
// ÉTAPE 8 — Classification des erreurs de génération
// ============================================================================

async function runStep8_ClassificationErreurs() {
    beginStep(8, STEP_NAMES[8]);

    const utils = await import(BASE + 'js/core/utils.js');
    const { classifyError } = utils;

    assert(typeof classifyError === 'function', '[8.1] classifyError est exporté par core/utils.js');
    if (typeof classifyError !== 'function') { endStep(); return; }

    // --- 8.2 : robustesse. Un `throw` JavaScript peut porter TOUT ET N'IMPORTE QUOI.
    // Une classification qui tombe elle-même laisse l'utilisateur sans message au
    // moment précis où il en a besoin.
    const valeursHostiles = [
        [null, 'null'],
        [undefined, 'undefined'],
        ['une chaîne levée', 'chaîne'],
        [42, 'nombre'],
        [{}, 'objet nu'],
        [{ message: null }, 'objet à message null'],
        [[], 'tableau'],
        [new Error(''), 'Error à message vide']
    ];
    for (const [valeur, quoi] of valeursHostiles) {
        let r = null, aLeve = false;
        try { r = classifyError(valeur); } catch { aLeve = true; }
        assert(!aLeve, `[8.2] classifyError ne lève pas sur ${quoi}`, { quoi });
        assert(!aLeve && r && typeof r.category === 'string'
            && typeof r.userMessageKey === 'string' && typeof r.technicalMessage === 'string',
            `[8.3] classifyError renvoie un triplet complet pour ${quoi}`, r);
    }

    // --- 8.4 : les quatre familles sont bien discriminées -------------------
    const cas = [
        [new SyntaxError('Unexpected token < in JSON at position 0'), 'error_parse', 'JSON invalide'],
        [new Error('Failed to fetch'), 'error_network', 'réseau coupé'],
        [new TypeError('NetworkError when attempting to fetch resource'), 'error_network', 'fetch rejeté'],
        [new Error('Délai dépassé : timeout de 5 minutes'), 'error_network', 'délai dépassé'],
        [new Error('required field missing: title'), 'error_validation', 'structure incomplète'],
        [new Error('Impossible d\'écrire le ZIP'), 'error_packaging', 'empaquetage']
    ];
    for (const [erreur, cleAttendue, quoi] of cas) {
        const r = classifyError(erreur);
        assert(r.userMessageKey === cleAttendue,
            `[8.4] ${quoi} → ${cleAttendue}`,
            { obtenu: r.userMessageKey, attendu: cleAttendue, message: erreur.message });
    }

    // --- 8.5 : les 4 clés de conseil existent dans les 11 langues ------------
    // Sans elles, le conseil ajouté au message d'échec s'afficherait BRUT.
    const CLES_CONSEIL = ['error_parse', 'error_network', 'error_validation', 'error_packaging'];
    for (const cle of CLES_CONSEIL) {
        const manquantes = LANGS.filter(l => !locales[l] || !locales[l][cle]);
        assert(manquantes.length === 0,
            `[8.5] ${cle} est traduit dans les 11 langues`, manquantes);
    }

    // --- 8.5b : libellés du bouton « Arrêter » dans les 11 langues -----------
    // Le bouton vit dans index.html avec `data-key`/`data-key-aria` : une clé
    // absente d'une locale s'affiche BRUTE à l'enseignant (`translatePage` ne
    // substitue que ce qu'il trouve).
    const CLES_ARRET = ['generation_cancel_btn', 'generation_cancel_aria', 'generation_cancelling', 'generation_cancelled'];
    for (const cle of CLES_ARRET) {
        const manquantes = LANGS.filter(l => !locales[l] || !locales[l][cle]);
        assert(manquantes.length === 0,
            `[8.5b] ${cle} est traduit dans les 11 langues`, manquantes);
    }

    // --- 8.6 : ui.js branche bien la classification --------------------------
    // Les quatre chemins de génération affichaient `error.message` BRUT — texte
    // technique, non traduit, sans indication d'action. Le contrôle est statique
    // (les handlers sont des écouteurs d'événements, inatteignables autrement) mais
    // il verrouille la propriété qui compte : plus aucune remontée brute.
    let source = '';
    try { source = await (await fetch(BASE + 'js/ui/ui.js')).text(); } catch { /* signalé */ }
    assert(source.length > 0, '[8.6] js/ui/ui.js est lisible');

    if (source) {
        assert(/import\s*\{[^}]*\bclassifyError\b[^}]*\}\s*from\s*'\.\.\/core\/utils\.js'/.test(source),
            '[8.7] ui.js importe classifyError depuis core/utils.js');
        assert(/function\s+messageEchecGeneration\s*\(/.test(source),
            '[8.8] ui.js définit le composeur de message messageEchecGeneration');

        // Depuis la 6.3.3, les quatre chemins n'appellent plus le composeur
        // directement : ils passent par `signalerFinGeneration`, entonnoir unique
        // qui sépare l'ÉCHEC (on explique et on conseille) de l'ARRÊT DEMANDÉ
        // par l'enseignant (bouton « Arrêter » de l'overlay). La propriété
        // verrouillée est la même — aucun chemin ne remonte un message brut —,
        // elle est simplement tenue en un seul endroit au lieu de quatre.
        assert(/function\s+signalerFinGeneration\s*\(/.test(source),
            '[8.9] ui.js définit l\'entonnoir signalerFinGeneration');

        const parEntonnoir = (source.match(/signalerFinGeneration\s*\(/g) || []).length;
        // 1 déclaration + 4 chemins de génération (contextuelle, image, vidéo, standard).
        assert(parEntonnoir >= 5,
            '[8.9b] Les 4 chemins de génération passent par l\'entonnoir',
            { occurrences: parEntonnoir, attendu: '≥ 5 (déclaration + 4 appels)' });

        const corpsEntonnoir = (source.match(/function\s+signalerFinGeneration[\s\S]*?\n\}/) || [''])[0];
        assert(/messageEchecGeneration\s*\(/.test(corpsEntonnoir),
            '[8.9c] L\'entonnoir compose son message d\'échec via messageEchecGeneration');
        assert(/isCancellation\s*\(/.test(corpsEntonnoir),
            '[8.9d] L\'entonnoir distingue l\'arrêt volontaire d\'un échec technique',
            'sans ce test, cliquer « Arrêter » afficherait « La génération a échoué. Cause : … »');

        const brut = source.match(/generation_failed_llm[\s\S]{0,200}?replace\(\s*'\{errorMessage\}'\s*,\s*error\.message/g) || [];
        assert(brut.length === 0,
            '[8.10] Plus aucun handler n\'injecte `error.message` brut dans le message d\'échec',
            { occurrences: brut.length, extrait: brut[0] });
    }

    endStep();
}

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    console.log('=== Câblage des activités ===');

    await charger();
    runStep1_Processeurs();
    runStep2_Locales();
    await runStep3_Prompts();
    runStep4_Fixtures();
    await runStep5_FieldConstraints();
    runStep6_Whitelist();
    await runStep7_ImagesLocales();
    await runStep8_ClassificationErreurs();

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
