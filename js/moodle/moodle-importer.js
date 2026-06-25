/**
 * @file Aiguilleur d'import Moodle.
 *
 * Reçoit un binaire .mbz ou une string XML standalone et le route vers la
 * fonction inverse du processor approprié. Pendant naturel des `Type.buildFiles()`
 * existants côté forward.
 *
 * Sert de point d'entrée unique pour l'éditeur cara_dev2 lorsqu'il doit
 * rouvrir un artefact Moodle généré ailleurs (Caramel lui-même, Sucrerie,
 * autre Moodle, etc.).
 *
 * @module moodle/moodle-importer
 */

import {
    extractMbz,
    detectStandaloneXmlType,
    STANDALONE_XML_TYPES
} from './mbz-utils.js';

import QCM          from './processors/activities/QCM.js';
import Millionnaire from './processors/activities/Millionnaire.js';
import Appariement  from './processors/activities/Appariement.js';
import Devoir       from './processors/activities/Devoir.js';
import Glossaire    from './processors/activities/Glossaire.js';
import Page         from './processors/activities/Page.js';
import Livre        from './processors/activities/Livre.js';
import Test         from './processors/activities/Test.js';

// =========================================================================
// Registres : moduleName Moodle / type XML standalone → processor + moduleKey
// =========================================================================

/**
 * Mapping des modules Moodle (clé tirée du dossier `activities/<moduleName>_<id>`)
 * vers le processor capable de les ouvrir, plus le `moduleKey` exposé au monde
 * extérieur — **convention Caramel canonique forward** (alignée sur
 * `processors/index.js` : `'QCM'`, `'Page'`, `'Glossaire'`, …).
 *
 * Une table de traduction interne `CARAMEL_TO_EDITOR_KEY` est invoquée
 * UNIQUEMENT à la frontière de l'éditeur (cf. `getEditorModuleKey`) pour
 * convertir vers les clés `elea_*` attendues par `content-detector.js`.
 */
const MBZ_REGISTRY = {
    simplequiz:     { processor: QCM,          moduleKey: 'QCM' },
    millionnairev2: { processor: Millionnaire, moduleKey: 'Millionnaire' },
    epikmatch:      { processor: Appariement,  moduleKey: 'Appariement' },
    assign:         { processor: Devoir,       moduleKey: 'Devoir' },
    glossary:       { processor: Glossaire,    moduleKey: 'Glossaire' },
    page:           { processor: Page,         moduleKey: 'Page' },
    book:           { processor: Livre,        moduleKey: 'Livre' },
    quiz:           { processor: Test,         moduleKey: 'Test' }
};

const STANDALONE_REGISTRY = {
    [STANDALONE_XML_TYPES.GLOSSARY]:      { processor: Glossaire, moduleKey: 'Glossaire' },
    [STANDALONE_XML_TYPES.QUESTION_BANK]: { processor: Test,      moduleKey: 'Test' }
};

// =========================================================================
// API publique
// =========================================================================

/**
 * Importe un binaire .mbz vers le JSON attendu par l'éditeur.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - Contenu binaire d'un fichier .mbz
 * @returns {Promise<{
 *   source:      'mbz',
 *   moduleName:  string,    // nom Moodle (simplequiz, page, book, ...)
 *   moduleKey:   string,    // clé Caramel canonique ('QCM', 'Page', 'Livre', ...)
 *   data:        Object,    // JSON éditeur — varie selon le type
 *   files:       Object<string, Uint8Array>,  // tous les fichiers extraits — utiles pour la sauvegarde ultérieure
 *   activityDir: string     // 'activities/<moduleName>_<id>' — idem
 * }>}
 * @throws {Error} mbz_no_processor:<moduleName> si le moduleName n'est pas géré
 */
export async function importMbz(buffer) {
    const extracted = await extractMbz(buffer);
    const entry = MBZ_REGISTRY[extracted.moduleName];
    if (!entry || typeof entry.processor.parseFiles !== 'function') {
        throw new Error(`mbz_no_processor:${extracted.moduleName}`);
    }
    const data = entry.processor.parseFiles(extracted.files, extracted.activityDir);
    return {
        source:      'mbz',
        moduleName:  extracted.moduleName,
        moduleKey:   entry.moduleKey,
        data,
        files:       extracted.files,
        activityDir: extracted.activityDir
    };
}

/**
 * Importe un XML standalone vers le JSON attendu par l'éditeur, avec
 * détection automatique du format (basée sur le tag racine).
 *
 * @param {string} xml
 * @returns {{
 *   source:    'xml-standalone',
 *   xmlType:   string,    // STANDALONE_XML_TYPES.* (glossary_standalone | questionbank_standalone)
 *   moduleKey: string,    // clé Caramel canonique : 'Glossaire' | 'Test'
 *   data:      Object
 * }}
 * @throws {Error} xml_unknown_format si le tag racine n'est pas reconnu
 * @throws {Error} xml_no_processor:<xmlType> si le format n'a pas encore de parser
 */
export function importStandaloneXml(xml) {
    const xmlType = detectStandaloneXmlType(xml);
    if (!xmlType) throw new Error('xml_unknown_format');
    const entry = STANDALONE_REGISTRY[xmlType];
    if (!entry || typeof entry.processor.parseStandaloneXml !== 'function') {
        throw new Error(`xml_no_processor:${xmlType}`);
    }
    return {
        source:    'xml-standalone',
        xmlType,
        moduleKey: entry.moduleKey,
        data:      entry.processor.parseStandaloneXml(xml)
    };
}

/**
 * Liste des moduleNames MBZ supportés en import (utile pour générer la doc /
 * filtrer les types acceptés dans une UI de drop).
 */
export function listSupportedMbzModules() {
    return Object.keys(MBZ_REGISTRY);
}

/**
 * Liste des types XML standalone supportés en import.
 */
export function listSupportedStandaloneTypes() {
    return Object.keys(STANDALONE_REGISTRY);
}

// =========================================================================
// Lookup processor par moduleKey (utilisé par le pipeline d'import .mbz)
// =========================================================================

const PROCESSORS_BY_KEY = {
    QCM:          QCM,
    Millionnaire: Millionnaire,
    Appariement:  Appariement,
    Devoir:       Devoir,
    Glossaire:    Glossaire,
    Page:         Page,
    Livre:        Livre,
    Test:         Test
};

/**
 * Retourne le processor associé à un moduleKey ('QCM', 'Glossaire', etc.).
 * Utilisé après l'import pour appeler `serializeFiles` /
 * `serializeStandaloneXml` lors de la sauvegarde sans ré-importer ni redétecter.
 *
 * @param {string} moduleKey - clé Caramel canonique
 * @returns {Object|null}
 */
export function getProcessorByModuleKey(moduleKey) {
    return PROCESSORS_BY_KEY[moduleKey] || null;
}

// =========================================================================
// Frontière éditeur : traduction Caramel canonique → clé éditeur (elea_*)
// =========================================================================

/**
 * Table de traduction interne : la convention Caramel canonique (`'QCM'`,
 * `'Glossaire'`, …) sert d'identifiant public côté API d'import et côté
 * notification. Le `content-detector.js` de l'éditeur attend cependant des
 * clés préfixées `elea_*`. Cette table — et la fonction publique
 * `getEditorModuleKey` ci-dessous — est invoquée UNIQUEMENT à la frontière
 * de l'éditeur (dans `editor/index.js`).
 *
 * Pourquoi maintenir deux conventions : `processors/index.js` (forward) et
 * `content-detector.js` (éditeur) sont stables et ne doivent pas être
 * touchés. C'est au nouveau code de s'adapter, pas l'inverse.
 */
const CARAMEL_TO_EDITOR_KEY = {
    QCM:          'elea_qcm',
    Millionnaire: 'elea_millionnaire',
    Appariement:  'elea_appariement',
    Devoir:       'elea_devoir',
    Glossaire:    'elea_glossaire',
    Page:         'elea_page',
    Livre:        'elea_livre',
    Test:         'elea_test',
    // Deux entrées par activité quand l'importer .mbz et le pipeline de
    // génération exposent des moduleKey différents : l'import expose la clé
    // canonique courte ('Test', 'Glossaire'), mais moodle-creator dispatche
    // l'« Éditer » d'une activité générée avec la clé de génération
    // ('test_elea', 'glossaireXml'). Les deux doivent résoudre vers le schéma.
    test_elea:    'elea_test',
    glossaireXml: 'elea_glossaire'
};

/**
 * Traduit une clé Caramel canonique vers la clé interne `elea_*` utilisée
 * par `content-detector.js`. Renvoie `null` si la clé n'est pas connue —
 * l'appelant peut alors retomber sur `notification.moduleKey` brut.
 *
 * @param {string} caramelKey - 'QCM', 'Glossaire', 'Page', …
 * @returns {string|null} - 'elea_qcm', 'elea_glossaire', 'elea_page', …
 */
export function getEditorModuleKey(caramelKey) {
    return CARAMEL_TO_EDITOR_KEY[caramelKey] || null;
}

/**
 * Table inverse de `CARAMEL_TO_EDITOR_KEY`, construite une fois pour toutes.
 * Utilisée à la frontière save / healing : l'éditeur travaille avec des clés
 * `elea_*` mais `getProcessorByModuleKey` et `healStructureForActivity`
 * attendent la clé canonique Caramel.
 */
const EDITOR_TO_CARAMEL_KEY = Object.freeze(
    Object.fromEntries(
        Object.entries(CARAMEL_TO_EDITOR_KEY).map(([k, v]) => [v, k])
    )
);

/**
 * Traduit une clé éditeur (`elea_qcm`, `elea_millionnaire`, …) vers la clé
 * Caramel canonique (`'QCM'`, `'Millionnaire'`, …). Si l'argument est déjà
 * une clé canonique connue (ex: 'QCM'), la retourne telle quelle —
 * permet à l'appelant de fournir indifféremment l'une ou l'autre sans
 * se soucier de la convention en amont.
 *
 * Renvoie `null` si la clé est inconnue dans les deux conventions.
 *
 * @param {string} editorKey - 'elea_qcm', ou déjà 'QCM'
 * @returns {string|null} - 'QCM', 'Millionnaire', …
 */
export function getCanonicalFromEditorKey(editorKey) {
    if (!editorKey) return null;
    if (EDITOR_TO_CARAMEL_KEY[editorKey]) return EDITOR_TO_CARAMEL_KEY[editorKey];
    if (CARAMEL_TO_EDITOR_KEY[editorKey]) return editorKey;     // déjà canonique
    return null;
}
