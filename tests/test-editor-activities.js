/**
 * Tests e2e : l'éditeur JSON sur TOUTES les activités
 *
 * `test-editor-lifecycle.js` couvre les trois défauts corrigés en 6.3.0 (« dès que je
 * modifie un peu un livret interactif, l'enregistrement est quasi impossible ») — mais
 * son cycle RÉEL dans le DOM ne portait que sur le Livre interactif. Or ces défauts
 * vivaient dans `array-manager.js` et `editor-core.js` : le chemin COMMUN à toutes les
 * activités. Un correctif transverse mérite une non-régression transverse.
 *
 * D'où cette suite, qui rejoue le parcours de l'enseignant sur TOUT le catalogue — les
 * 33 schémas d'édition, et les ~116 fixtures d'`assets/data/examples/` :
 *
 *   A — hors DOM, sur les 116 fixtures
 *     A1  chaque contenu ouvre le schéma attendu ;
 *     A2  chaque contenu est enregistrable TEL QUEL (aucune activité ne naît bloquée) ;
 *     A3  toute valeur de menu figure parmi les options de ce menu (sinon l'écran
 *         affiche autre chose que ce que porte le modèle — défaut de 6.3.0 vu depuis le
 *         contenu déjà là, et non depuis un item neuf) ;
 *     A4  les renvois PAR INDICE d'un tableau vers un autre sont déclarés des DEUX côtés
 *         du schéma, leur arithmétique est juste pour les quatre mutations, et aucune
 *         association étiquette → zone du Glisser-déposer n'est perdue en chemin — ni à
 *         l'ouverture de l'éditeur, ni à l'enregistrement, ni dans le .h5p produit ;
 *     A5  un champ obligatoire vidé DANS un conteneur dynamique (sous-question de Quiz,
 *         exercice de diapositive ou de bloc de Livre, contenu d'une question Éléa) est
 *         signalé avec son fil d'Ariane — et un conteneur MASQUÉ ne bloque jamais ;
 *     A6  enregistrer sans rien changer ne perd aucun texte (hors transformations
 *         délibérées, énumérées dans PERTES_ASSUMEES) ;
 *     A7  ce cycle est idempotent.
 *   B — dans le DOM, une fixture par schéma
 *     B1  l'éditeur s'ouvre sur le bon schéma ;
 *     B2  enregistrement possible sans modification, et deux fois de suite (la
 *         dénormalisation écrit DANS l'objet qu'on lui passe : un enregistrement ne doit
 *         pas laisser le document dans un état qui bloque le suivant) ;
 *     B3  parcourir toutes les vues ne réécrit aucune valeur existante (seuls des
 *         défauts peuvent se matérialiser), le document se stabilise, et aucun libellé
 *         ne s'affiche sous forme de clé i18n brute ;
 *     B4  ajouter un item ne rend fautif QUE l'item neuf, et jamais de façon illisible ;
 *     B5  supprimer un item de la liste principale ne touche pas à ses voisins ;
 *     B6  supprimer un item d'un tableau IMBRIQUÉ ne laisse pas d'item fantôme
 *         (défaut n°3 de 6.3.0, généralisé à toutes les activités qui en ont un) ;
 *     B7  muter une liste RÉFÉRENCÉE PAR INDICE (les zones du Glisser-déposer) ne change
 *         la cible d'aucun renvoi — comparaison PAR RÉFÉRENCE d'objet, la seule qui reste
 *         valable une fois les indices renumérotés — et la liste qui porte ces renvois est
 *         redessinée, sinon l'écran proposerait encore la zone supprimée.
 *
 * Deux listes nommées bornent la tolérance de la suite — PERTES_ASSUMEES (textes que le
 * pipeline transforme exprès) et BLOCAGES_ASSUMES (fixtures légitimement bloquantes).
 * Chacune est gardée par une assertion « aucune entrée devenue inutile » : le jour où le
 * comportement change, la suite réclame le retrait de l'entrée au lieu de le passer sous
 * silence.
 *
 * Les mutations passent par les exports `__testing` d'editor-core — mêmes fonctions que
 * les boutons de l'interface, sans les modales — mais l'ouverture et l'enregistrement
 * empruntent le VRAI chemin (`initJsonEditor` / `saveChanges`), notification comprise.
 *
 * Usage : ouvrir tests/test-editor-activities.html depuis le serveur local,
 *         ou via tests/test-all.html (suite `editor-activities`).
 */

import { PREFIX_TO_MODULE } from './roundtrip/fixtures-prefixes.js';
import {
    detectContentType, getSchemaForType, getSupportedTypes,
    normalizeDataForEditor, denormalizeDataForSave
} from '../js/editor/content-detector.js';
import { getValidationErrors } from '../js/editor/validators.js';
import { healStructureForActivity, healJsonString } from '../js/h5p/json-healer.js';
import { cleanJsonInput } from '../js/core/utils.js';
import { initJsonEditor, saveChanges, destroyEditor, getEditorState } from '../js/editor/index.js';
import { getEditorData, __testing } from '../js/editor/editor-core.js';
import { getNestedValue, setNestedValue, matchesShowWhen, remapIndexReferences } from '../js/editor/json-utils.js';
import { processH5PContent } from '../js/h5p/processors/index.js';
import { allModules } from '../js/core/definitions.js';
import { t, loadTranslations } from '../js/core/translation.js';

const BASE = new URL('../', new URL(import.meta.url)).href;

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _group = '';

function assert(condition, message) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, group: _group };
    if (condition) {
        passCount++;
    } else {
        failCount++;
        console.error('FAIL:', _group, '-', message);
    }
    results.push(entry);
}

function assertEqual(actual, expected, message) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (!pass) {
        message += ` (attendu: ${abrege(expected)}, obtenu: ${abrege(actual)})`;
    }
    assert(pass, message);
}

function group(name) { _group = name; }

const clone = (o) => JSON.parse(JSON.stringify(o));
const pause = (ms) => new Promise(r => setTimeout(r, ms));

function abrege(v) {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s && s.length > 400 ? s.slice(0, 400) + '…' : s;
}

/** Un libellé resté sous forme de clé i18n (`editor_ib_block_type`) est illisible. */
function estCleI18nBrute(libelle) {
    return typeof libelle === 'string' && /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(libelle.trim());
}

/**
 * Un libellé d'erreur qui est en fait un CHEMIN de données (« questions.0.params.answers »)
 * n'est ni traduit ni situable : c'est le repli de dernier recours du validateur, jamais
 * une information pour l'enseignant.
 */
function estCheminBrut(libelle) {
    return typeof libelle === 'string' && /(^|\s|›\s)[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+){2,}\s*$/.test(libelle.trim());
}

/** Auto-confirme la prochaine modale de suppression (showConfirm isDanger). */
function autoConfirmeSuppression() {
    const observer = new MutationObserver(() => {
        const btn = document.querySelector('.json-editor__modal-btn--danger');
        if (btn) { observer.disconnect(); btn.click(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
}

// =======================================================================
// CATALOGUE DES FIXTURES
// =======================================================================

/**
 * Clé de fixture (`fixtures-prefixes.js`, convention des processeurs) →
 * clé de SCHÉMA D'ÉDITION (`content-detector.js`). Les deux conventions coexistent
 * volontairement : cf. `CARAMEL_TO_EDITOR_KEY` dans moodle-importer.js.
 */
const FIXTURE_VERS_EDITEUR = {
    QuizSetQCM: 'QuizSet', QuizSetVF: 'QuizSet',
    QCM: 'elea_qcm', Millionnaire: 'elea_millionnaire', Appariement: 'elea_appariement',
    Devoir: 'elea_devoir', glossaireXml: 'elea_glossaire', Page: 'elea_page',
    Livre: 'elea_livre', test_elea: 'elea_test'
};

/** Fixtures qui ne suivent pas la convention `<préfixe>_<n>.json`. */
const FIXTURES_HORS_CONVENTION = [
    { fichier: 'quiz_qcm_formules_test.json', moduleKey: 'QuizSetQCM', kind: 'h5p' },
    { fichier: 'test_cloze_hints.json', moduleKey: 'test_elea', kind: 'moodle' }
];

/**
 * Fixtures légitimement bloquantes à l'enregistrement, avec la raison.
 *
 * `charts_3.json` est au format ANTÉRIEUR au prompt actuel (`chartType` au lieu de
 * `graphMode`, pas de `figureDefinition`) : elle sert de cas LaTeX au banc roundtrip et
 * n'est pas régénérée. Le champ manquant — « Description du graphique » — est le PREMIER
 * champ de la PREMIÈRE section : l'erreur est visible et située, ce n'est pas le défaut
 * invisible de 6.3.0. À noter tout de même : le processeur, lui, a un repli traduit
 * (`Chart.js`), l'éditeur non — un diagramme généré sans `figureDefinition` s'exporte
 * mais ne se ré-enregistre pas.
 */
const BLOCAGES_ASSUMES = new Map([
    ['charts_3.json', 'fixture au format antérieur (chartType / pas de figureDefinition)']
]);

/**
 * Transformations DÉLIBÉRÉES du cycle d'enregistrement : le texte d'origine ne se
 * retrouve pas tel quel dans le fichier produit, et c'est voulu. Toute perte HORS de
 * cette liste est un défaut.
 */
const PERTES_ASSUMEES = [
    { cle: 'Crossword', chemin: /^words\[\]\.answer$/,
      raison: 'la grille n\'accepte que des lettres : espaces retirés, LaTeX converti (\\(\\pi\\) → PI)' },
    { cle: 'FindTheWords', chemin: /^wordList$/,
      raison: 'grille de lettres : les mots non alphabétiques (LaTeX, symboles) sont retirés' },
    { cle: 'FindTheHotspot', chemin: /^hotspots\[\]\.[xy]$/,
      raison: 'coordonnées converties du CENTRE (éditeur) vers le coin haut-gauche (H5P)' },
    { cle: 'FindMultipleHotspots', chemin: /^hotspots\[\]\.[xy]$/,
      raison: 'coordonnées converties du CENTRE (éditeur) vers le coin haut-gauche (H5P)' },
    { cle: 'elea_test', chemin: /^questions\[\]\.content\.answers\[\]\.fraction$/,
      raison: 'les fractions sont ramenées aux valeurs légales de Moodle (33.33334 → 33.33333)' }
];

/**
 * Ré-encodages appliqués par la LECTURE d'un champ (rendu → collecte). Ils changent la
 * valeur stockée sans changer ce qu'elle signifie ; tout AUTRE écart est un écrasement.
 */
const NORMALISATIONS_A_LA_COLLECTE = [
    {
        // « 1789,05,05 » → « 1789,5,5 » : même date, forme canonique de H5P Timeline.
        // L'équivalence est VOLONTAIREMENT étroite : c'est elle qui distingue le ré-encodage
        // légitime de la régression qu'il masquerait (le champ affiche « 05/05/1789 » ; sans
        // reconversion à la collecte, c'est cette chaîne-là qui atterrissait dans le .h5p).
        chemin: /\.(startDate|endDate)$/,
        equivaut: (a, b) => canonDateH5p(a) === canonDateH5p(b),
        raison: 'date Timeline ré-encodée au format H5P canonique, non zéro-paddé'
    },
    {
        // Note Moodle saisie dans un <input> : 100 → "100". La VALEUR doit rester la même.
        chemin: /\.fraction$/,
        equivaut: (a, b) => Number(a) === Number(b),
        raison: 'note Moodle relue depuis un champ texte'
    }
];

/** « 1789,05,05 » et « 1789,5,5 » désignent la même date ; « 05/05/1789 » non. */
function canonDateH5p(v) {
    return String(v).split(',').map(p => {
        const n = parseInt(p, 10);
        return Number.isNaN(n) ? p.trim() : String(n);
    }).join(',');
}

const cleEditeur = (moduleKey) => FIXTURE_VERS_EDITEUR[moduleKey] || moduleKey;

/**
 * Notification telle que l'UI la produit à l'ouverture de l'éditeur (cf. `enterEditMode`
 * dans js/ui/notifications.js) : les activités H5P sont résolues par `titleKey`, les
 * activités Moodle par `moduleKey` — deux chemins distincts d'`initJsonEditor`, tous
 * deux exercés ici.
 */
function notificationPour(moduleKey, kind) {
    const def = allModules[moduleKey];
    const base = { id: `editeur-activites-${moduleKey}`, titleKey: def && def.name };
    return kind === 'h5p'
        ? { ...base, type: 'h5p', moduleKey }
        : { ...base, type: 'mbz', moduleKey };
}

/** Fixtures illisibles même après passage par le pipeline de réparation. */
const erreursDeLecture = [];

/**
 * Le serveur statique ne liste pas les dossiers de façon fiable (cf. test-activity-wiring) :
 * on sonde `<préfixe>_<n>.json` pour chaque préfixe connu, jusqu'à 14. Toute fixture
 * ajoutée plus tard est donc ramassée sans rien déclarer ici.
 */
async function chargerFixtures() {
    const cas = [];
    // Les fixtures sont lues comme la génération lit une sortie de LLM : certaines ne sont
    // PAS du JSON strict (quiz_qcm_3.json porte du LaTeX `\( \sqrt{64} \)` non échappé, exprès).
    // `cleanJsonInput` + `healJsonString` sont le passage obligé du pipeline réel.
    const lire = async (fichier, moduleKey, kind) => {
        const r = await fetch(`${BASE}assets/data/examples/${fichier}`);
        if (!r.ok) return false;
        const brut = await r.text();
        let data;
        try { data = JSON.parse(healJsonString(cleanJsonInput(brut))); }
        catch (e) { erreursDeLecture.push(`${fichier} : ${e.message}`); return false; }
        cas.push({ fichier, moduleKey, kind, cle: cleEditeur(moduleKey), data });
        return true;
    };

    for (const { prefix, moduleKey, kind } of PREFIX_TO_MODULE) {
        for (let i = 1; i <= 14; i++) await lire(`${prefix}_${i}.json`, moduleKey, kind);
    }
    for (const { fichier, moduleKey, kind } of FIXTURES_HORS_CONVENTION) {
        await lire(fichier, moduleKey, kind);
    }
    return cas;
}

// =======================================================================
// OUTILS DE COMPARAISON
// =======================================================================

const normeTexte = (v) => String(v).replace(/\s+/g, '').toLowerCase();

/**
 * Toutes les valeurs scalaires d'un document, avec leur chemin — les indices de tableau
 * étant réduits à `[]` pour que le chemin nomme le CHAMP, pas la position.
 */
function scalairesAvecChemin(valeur, chemin = '', acc = []) {
    if (valeur === null || valeur === undefined) return acc;
    if (typeof valeur === 'object') {
        if (Array.isArray(valeur)) {
            for (const v of valeur) scalairesAvecChemin(v, `${chemin}[]`, acc);
        } else {
            for (const [k, v] of Object.entries(valeur)) {
                scalairesAvecChemin(v, chemin ? `${chemin}.${k}` : k, acc);
            }
        }
        return acc;
    }
    acc.push({ chemin, valeur });
    return acc;
}

/** Valeurs scalaires avec leur chemin EXACT (indices compris) — pour comparer deux états. */
function scalairesIndexes(valeur, chemin = '', acc = new Map()) {
    if (valeur === null || valeur === undefined) return acc;
    if (typeof valeur === 'object') {
        const entrees = Array.isArray(valeur)
            ? valeur.map((v, i) => [String(i), v])
            : Object.entries(valeur);
        for (const [k, v] of entrees) scalairesIndexes(v, chemin ? `${chemin}.${k}` : k, acc);
        return acc;
    }
    acc.set(chemin, valeur);
    return acc;
}

/** Toutes les valeurs scalaires d'un document, normalisées, en vrac. */
function valeursNormalisees(valeur, acc = new Set()) {
    if (valeur === null || valeur === undefined) return acc;
    if (typeof valeur === 'object') {
        for (const v of Object.values(valeur)) valeursNormalisees(v, acc);
        return acc;
    }
    acc.add(normeTexte(valeur));
    return acc;
}

/**
 * Textes de `source` introuvables dans `sortie`. La comparaison ignore casse et espaces
 * (la grille de mots croisés colle les mots, l'éditeur reformate les dates) et tolère
 * qu'une valeur ait été DÉCOUPÉE ou CONCATÉNÉE (listes de mots).
 */
function textesPerdus(source, sortie) {
    const dispo = valeursNormalisees(sortie);
    const concat = [...dispo].join('|');
    return scalairesAvecChemin(source)
        .filter(x => normeTexte(x.valeur).length >= 4)
        .filter(x => !dispo.has(normeTexte(x.valeur)) && !concat.includes(normeTexte(x.valeur)));
}

/**
 * Valeurs existantes RÉÉCRITES entre deux états du document. Les ajouts (champ qui
 * n'existait pas) sont tolérés : l'éditeur matérialise les valeurs par défaut des
 * champs qu'il rend. Les ré-encodages connus sont écartés.
 */
function valeursEcrasees(avant, apres) {
    const a = scalairesIndexes(avant);
    const b = scalairesIndexes(apres);
    const ecarts = [];
    for (const [chemin, valeur] of a) {
        if (!b.has(chemin)) { ecarts.push(`${chemin} : ${JSON.stringify(valeur)} → (disparu)`); continue; }
        const apresValeur = b.get(chemin);
        if (String(valeur) === String(apresValeur)) continue;
        if (NORMALISATIONS_A_LA_COLLECTE.some(n => n.chemin.test(chemin) && n.equivaut(valeur, apresValeur))) continue;
        ecarts.push(`${chemin} : ${JSON.stringify(valeur)} → ${JSON.stringify(apresValeur)}`);
    }
    return ecarts;
}

/**
 * Valeurs de menu (select / cases à cocher multiples) que le menu NE PROPOSE PAS.
 *
 * Un `<select>` affiche sa première option quand la valeur stockée ne correspond à aucune :
 * l'écran et le modèle divergent alors en silence, et le fichier produit part avec une valeur
 * que la librairie H5P ne sait pas lire. C'est le défaut de 6.3.0 vu sous l'autre angle —
 * non plus sur un item NEUF, mais sur le contenu DÉJÀ LÀ.
 *
 * Les menus à options dynamiques (`optionsFrom`) sont hors de portée : leurs options ne sont
 * connues qu'au rendu. Idem pour les `dynamicObject`, dont le sous-schéma dépend d'un autre champ.
 */
function menusHorsOptions(valeur, config, chemin, fautifs = []) {
    if (!config || typeof config !== 'object') return fautifs;

    const options = Array.isArray(config.options) ? config.options.map(o => String(o.value)) : null;
    const statique = options && options.length && !config.optionsFrom;

    if (config.type === 'select' && statique) {
        if (valeur !== undefined && valeur !== null && String(valeur) !== '' && !options.includes(String(valeur))) {
            fautifs.push(`${chemin} = ${JSON.stringify(valeur)} (menu : ${options.join(' | ')})`);
        }
    } else if (config.type === 'multiCheckbox' && statique && Array.isArray(valeur)) {
        for (const v of valeur) {
            if (!options.includes(String(v))) fautifs.push(`${chemin}[] = ${JSON.stringify(v)} (menu : ${options.join(' | ')})`);
        }
    } else if (config.type === 'array' && config.itemSchema && Array.isArray(valeur)) {
        valeur.forEach((item, i) => {
            for (const [k, sous] of Object.entries(config.itemSchema)) {
                menusHorsOptions(item ? item[k] : undefined, sous, `${chemin}.${i}.${k}`, fautifs);
            }
        });
    } else if (config.type === 'object' && config.schema && valeur && typeof valeur === 'object') {
        for (const [k, sous] of Object.entries(config.schema)) {
            menusHorsOptions(valeur[k], sous, `${chemin}.${k}`, fautifs);
        }
    } else if (config.type === 'fieldGroup' && config.fields) {
        for (const [k, sous] of Object.entries(config.fields)) {
            menusHorsOptions(valeur && typeof valeur === 'object' ? valeur[k] : undefined, sous, `${chemin}.${k}`, fautifs);
        }
    }
    return fautifs;
}

/**
 * Parcourt TOUS les champs d'un schéma d'édition, sous-schémas compris, en donnant à
 * chacun un chemin de CONTEXTE : `slides[].exercise<H5P.DragQuestion 1.15>.dropZones`.
 * Les indices de tableau y sont réduits à `[]` et les sous-schémas d'un `dynamicObject`
 * portent leur clé entre chevrons — deux champs de deux bibliothèques différentes ne
 * peuvent donc pas se confondre.
 *
 * @yields {{chemin: string, cle: string, config: Object}}
 */
function* champsDuSchema(schema) {
    function* marcher(champs, prefixe) {
        for (const [cle, config] of Object.entries(champs || {})) {
            if (!config || typeof config !== 'object') continue;
            const chemin = prefixe ? `${prefixe}.${cle}` : cle;
            yield { chemin, cle, config };

            if (config.type === 'array' && config.itemSchema) yield* marcher(config.itemSchema, `${chemin}[]`);
            else if (config.type === 'object' && config.schema) yield* marcher(config.schema, chemin);
            else if (config.type === 'fieldGroup' && config.fields) yield* marcher(config.fields, chemin);
            else if (config.type === 'dynamicObject' && config.schemas) {
                for (const [lib, sous] of Object.entries(config.schemas)) yield* marcher(sous, `${chemin}<${lib}>`);
            }
        }
    }
    for (const section of schema.sections || []) yield* marcher(section.fields, '');
}

/** Contexte parent d'un chemin de champ (« a.b[].c » → « a.b[] »). */
const contexteParent = (chemin) => (chemin.includes('.') ? chemin.slice(0, chemin.lastIndexOf('.')) : '');

/**
 * Associations d'un Glisser-déposer, comptées une seule fois quelle que soit la forme.
 *
 * La MÊME information s'écrit de deux façons : `dropZones[].correctElements` (forme H5P,
 * celle du `.h5p` et des prompts) et `elements[].zoneIndices` (forme éditeur). Un objet
 * qui porte à la fois `dropZones` et `elements` EST un Glisser-déposer, dans n'importe
 * quel conteneur : on les cherche donc en profondeur, sans rien savoir de l'activité.
 *
 * @param {*} noeud - document ou sous-arbre
 * @returns {number} nombre de couples (étiquette, zone)
 */
function compterAssociationsDragQuestion(noeud) {
    let total = 0;
    if (!noeud || typeof noeud !== 'object') return 0;
    if (Array.isArray(noeud)) {
        for (const v of noeud) total += compterAssociationsDragQuestion(v);
        return total;
    }
    if (Array.isArray(noeud.dropZones) && Array.isArray(noeud.elements)) {
        const parCorrectElements = noeud.dropZones
            .reduce((n, z) => n + (Array.isArray(z && z.correctElements) ? z.correctElements.length : 0), 0);
        const parZoneIndices = noeud.elements
            .reduce((n, el) => n + (Array.isArray(el && el.zoneIndices) ? el.zoneIndices.length : 0), 0);
        total += parCorrectElements || parZoneIndices;
    }
    for (const v of Object.values(noeud)) total += compterAssociationsDragQuestion(v);
    return total;
}

/**
 * Champs OBLIGATOIRES d'un document qui ne sont atteignables qu'en descendant dans un
 * conteneur dynamique (`dynamicObject` : sous-question de Quiz, exercice de diapositive ou
 * de bloc de Livre, contenu d'une question Éléa).
 *
 * Le parcours suit exactement celui du validateur — tableaux, objets, groupes de champs et
 * conteneurs dynamiques, sélecteur compris. Un champ masqué (`showWhen` non satisfait) est
 * écarté : ce qui n'est pas affiché ne doit rien bloquer.
 *
 * @returns {Array<{chemin: string, valeur: *}>}
 */
function champsObligatoiresSousConteneurDynamique(racine, schema) {
    const cibles = [];

    const descendre = (valeur, config, chemin, parent, viaDynamique) => {
        if (!config || typeof config !== 'object') return;

        if (config.type === 'array' && Array.isArray(valeur) && config.itemSchema) {
            valeur.forEach((item, i) => {
                for (const [cle, sous] of Object.entries(config.itemSchema)) {
                    if (cle === '_value') continue;
                    descendre(getNestedValue(item, cle), sous, `${chemin}.${i}.${cle}`, item, viaDynamique);
                }
            });
            return;
        }
        if (config.type === 'object' && config.schema && valeur && typeof valeur === 'object') {
            for (const [cle, sous] of Object.entries(config.schema)) {
                descendre(getNestedValue(valeur, cle), sous, `${chemin}.${cle}`, valeur, viaDynamique);
            }
            return;
        }
        if (config.type === 'fieldGroup' && config.fields && parent) {
            const prefixe = chemin.includes('.') ? chemin.slice(0, chemin.lastIndexOf('.')) : '';
            for (const [cle, sous] of Object.entries(config.fields)) {
                descendre(getNestedValue(parent, cle), sous, prefixe ? `${prefixe}.${cle}` : cle, parent, viaDynamique);
            }
            return;
        }
        if (config.type === 'dynamicObject' && config.schemas && valeur && typeof valeur === 'object') {
            if (config.showWhen && !matchesShowWhen(config.showWhen, parent, null, racine)) return;
            const sousSchema = config.schemas[parent ? parent[config.selector || 'type'] : undefined];
            if (!sousSchema) return;
            for (const [cle, sous] of Object.entries(sousSchema)) {
                descendre(getNestedValue(valeur, cle), sous, `${chemin}.${cle}`, valeur, true);
            }
            return;
        }
        if (viaDynamique && config.required) cibles.push({ chemin, valeur });
    };

    for (const section of schema.sections || []) {
        for (const [cle, config] of Object.entries(section.fields || {})) {
            descendre(getNestedValue(racine, cle), config, cle, racine, false);
        }
    }
    return cibles;
}

/**
 * Cibles d'un renvoi par indice, PAR RÉFÉRENCE d'objet — la seule comparaison qui reste
 * valable quand les indices, eux, ont bougé.
 * @returns {Array<Array<Object|undefined>>} une liste de cibles par item référent
 */
function ciblesDesRenvois(parent, nomTableau, renvoi) {
    const source = Array.isArray(parent[nomTableau]) ? parent[nomTableau] : [];
    return (Array.isArray(parent[renvoi.array]) ? parent[renvoi.array] : []).map(item => {
        const valeurs = item && Array.isArray(item[renvoi.field]) ? item[renvoi.field] : [];
        return valeurs.map(v => source[typeof v === 'string' ? parseInt(v, 10) : v]);
    });
}

/** Nombre total d'items-objets contenus dans des tableaux, à toute profondeur. */
function compterItemsDeTableau(valeur) {
    let n = 0;
    if (Array.isArray(valeur)) {
        for (const v of valeur) {
            if (v && typeof v === 'object') n++;
            n += compterItemsDeTableau(v);
        }
    } else if (valeur && typeof valeur === 'object') {
        for (const v of Object.values(valeur)) n += compterItemsDeTableau(v);
    }
    return n;
}

/**
 * Le cycle d'enregistrement réel, hors DOM : normaliser → soigner → dénormaliser.
 * `denormalizeDataForSave` ÉCRIT dans l'objet qu'on lui passe (cf. B2) : on lui donne
 * une copie, sinon l'état validé plus haut serait celui d'APRÈS dénormalisation.
 */
function cycleEnregistrement(data, cle) {
    const soigne = healStructureForActivity(normalizeDataForEditor(clone(data), cle), cle);
    return { soigne, sortie: denormalizeDataForSave(clone(soigne), cle) };
}

const SELECTEURS_LIBELLE = [
    '.json-editor__label', '.json-editor__checkbox-label', '.json-editor__multi-checkbox-label',
    '.json-editor__nav-item-label', '.json-editor__section-title', '.json-editor__detail-title',
    '.json-editor__nested-title', '.json-editor__array-item-title', '.json-editor__hint'
].join(', ');

/** Libellés affichés qui sont restés des clés i18n brutes. */
function clesBrutesAffichees(conteneur) {
    const trouvees = new Set();
    for (const el of conteneur.querySelectorAll(SELECTEURS_LIBELLE)) {
        const texte = (el.textContent || '').trim();
        if (estCleI18nBrute(texte)) trouvees.add(texte);
    }
    return [...trouvees];
}

// =======================================================================
// SUITE
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;
    erreursDeLecture.length = 0;

    // Sans locale chargée, TOUS les libellés ressortiraient en clé brute.
    await loadTranslations('fr');
    assert(t('editor_title') !== 'editor_title', 'Locale fr chargée');

    group('Vidéo native');
    {
        const {prepareNativeVideoSchema,serializeNativeVideo}=await import('../js/editor/native-presentation-schema.js');
        const schema=await prepareNativeVideoSchema(new URL('../js/vendor/h5p-libs/',import.meta.url).href);
        const native=await fetch(new URL('./sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/InteractiveVideo/content.json',import.meta.url)).then(r=>r.json());
        assertEqual(detectContentType(native).moduleKey,'InteractiveVideo','Vidéo native détectée');
        assertEqual(serializeNativeVideo(native,native),native,'Vidéo native sans retouche conservée');
        const item=schema.sections.find(s=>s.id==='interactions').fields['interactiveVideo.assets.interactions'].itemSchema;
        assert(Object.keys(item.action.schema.params.schemas).length===18,'Les 18 interactions natives ont leur formulaire');
        const empty=structuredClone(native);empty.interactiveVideo.assets.interactions[0].adaptivity.wrong.seekTo=null;empty.override.startVideoAt=null;empty.override.showSolutionButton='';
        const saved=serializeNativeVideo(empty,native);
        assert(!('seekTo' in saved.interactiveVideo.assets.interactions[0].adaptivity.wrong)&&!('startVideoAt' in saved.override),'Valeurs vides retirées sans saut fantôme');
        assert(!('showSolutionButton' in saved.override),'Option héritée non forcée');
        const invalid=structuredClone(native);invalid.interactiveVideo.assets.interactions[0].duration={from:5,to:2};
        assert(getValidationErrors(invalid,schema).some(e=>e.path.endsWith('.duration')),'Durée inversée refusée');
        const {processH5PContent}=await import('../js/h5p/processors/index.js');
        const processed=await processH5PContent('InteractiveVideo',{title:'Essai',videoSource:{url:'https://example.invalid/video.mp4'},interactions:[],override:{retryButton:'off',autoplay:false},bookmarks:[{time:2,label:'Repère'}],endscreens:[{time:9,label:'Fin'}],startScreenOptions:{hideStartTitle:true},summary:{statements:[['Oui','Non']],displayAt:0}});
        assert(processed.content.override.retryButton==='off'&&processed.content.interactiveVideo.video.startScreenOptions.hideStartTitle,'Options explicites du modèle généré respectées');
        assert(processed.content.interactiveVideo.assets.bookmarks[0].time===2&&processed.content.interactiveVideo.assets.endscreens[0].time===9&&processed.content.interactiveVideo.summary.displayAt===0,'Signets, écran final et résumé à zéro conservés');
        const {formatContentForDocument}=await import('../js/export/document-formatter.js');
        const action=(library,params)=>({duration:{from:2,to:4},action:{library,params}});
        const document=await formatContentForDocument('InteractiveVideo',{interactiveVideo:{video:{},assets:{interactions:[action('H5P.Text 1.1',{text:'Annotation RELU'}),action('H5P.GoToQuestion 1.3',{text:'Choisis',choices:[{text:'Revoir',goTo:1}]}),action('H5P.FreeTextQuestion 1.0',{question:'Explique ton choix'})]}}});
        assert(JSON.stringify(document).includes('Annotation RELU')&&JSON.stringify(document).includes('Revoir')&&JSON.stringify(document).includes('Explique ton choix')&&!document.sections.some(s=>s.style==='code'),'Interactions textuelles imprimées sans JSON technique');
    }

    group('Livre natif');
    {
        const {prepareNativeBookSchema,serializeNativeBook}=await import('../js/editor/native-presentation-schema.js');
        const schema=await prepareNativeBookSchema(new URL('../js/vendor/h5p-libs/',import.meta.url).href);
        const native=await fetch(new URL('./sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/retours-elea/InteractiveBook/content.json',import.meta.url)).then(r=>r.json());
        assertEqual(detectContentType(native).moduleKey,'InteractiveBook','Livre Éléa natif détecté');
        assertEqual(serializeNativeBook(native,native),native,'Livre sans retouche strictement conservé');
        const chapter=schema.sections.find(s=>s.id==='chapters').fields.chapters;
        const column=chapter.itemSchema.params.schemas['H5P.Column 1.22'].content.itemSchema.content.schema.params.schemas;
        assert(Object.keys(column).length===35,'Les 35 blocs autorisés par Column ont leurs champs natifs');
        assert(column['H5P.Video 1.6'].a11y.itemSchema.track.type==='vtt','Pistes vidéo natives éditables');
        assert(column['H5P.Summary 1.10'].summaries.itemSchema.tip.type==='richtext','Indice Summary transparent, sans objet parasite');
        const changed=structuredClone(native);changed.chapters[0].params.content[0].content.params.columns[1].width=95;
        assert(getValidationErrors(changed,schema).some(e=>e.path.endsWith('.columns')),'Largeurs natives incohérentes rejetées');
        const {formatContentForDocument}=await import('../js/export/document-formatter.js');
        const formatted=await formatContentForDocument('InteractiveBook',native,{keepLatex:true});
        assert(JSON.stringify(formatted).includes('Paris, en France.')&&formatted.sections.some(s=>s.type==='image'),'Livre natif : cartes, image et corrigé présents sur papier');
    }

    group('Conservation des sous-questions dans les conteneurs natifs');
    {
        const actions=[
            {library:'H5P.Blanks 1.14',params:{text:'Complétez.',questions:['La capitale est *Paris*.']}},
            {library:'H5P.TrueFalse 1.8',params:{question:'Paris ?',correct:'true',behaviour:{feedbackOnCorrect:'Exact natif',feedbackOnWrong:'À revoir natif'}}},
            {library:'H5P.MultiChoice 1.16',params:{question:'Capitale ?',answers:[{text:'Paris',correct:true}],behaviour:{type:'single'}}}
        ];
        const containers={
            CoursePresentation:{presentation:{slides:[{elements:actions.map(action=>({action}))}]}},
            InteractiveBook:{chapters:[{library:'H5P.Column 1.22',params:{content:actions.map(content=>({content}))}}]},
            InteractiveVideo:{interactiveVideo:{assets:{interactions:actions.map(action=>({action}))}}}
        };
        for(const [type,source] of Object.entries(containers)) {
            const edited=normalizeDataForEditor(structuredClone(source),type);
            assertEqual(edited,source,type+' : champs natifs non déplacés à l’ouverture');
            assertEqual(denormalizeDataForSave(edited,type),source,type+' : texte et retours natifs conservés à la sauvegarde');
        }
    }

    group('Présentation native');
    {
        const {prepareNativePresentationSchema,serializeNativePresentation}=await import('../js/editor/native-presentation-schema.js');
        const native={presentation:{slides:[{elements:[{x:2,y:2,width:96,height:96,action:{library:'H5P.AdvancedText 1.1',params:{text:'<p>Original</p>'},subContentId:'stable-id'}}]}]}};
        const schema=await prepareNativePresentationSchema(new URL('../js/vendor/h5p-libs/',import.meta.url).href);
        assertEqual(detectContentType(native).moduleKey,'CoursePresentation','Présentation native détectée sans titre de notification');
        assertEqual(serializeNativePresentation(native,native),native,'Enregistrement natif sans retouche strictement conservatif');
        const modified=structuredClone(native);modified.presentation.slides[0].elements[0].action.params.text='**RELU**';
        const saved=serializeNativePresentation(modified,native);
        assert(saved.presentation.slides[0].elements[0].action.params.text.includes('<strong>RELU</strong>'),'Texte natif retouché reconverti en HTML');
        assert(saved.presentation.slides[0].elements[0].action.subContentId==='stable-id','Sous-identifiant conservé');
        const fields=schema.sections[0].fields['presentation.slides'].itemSchema.elements.itemSchema;
        assert(fields.x.type==='number' && fields.solution.type==='richtext' && fields.buttonLabel.type==='text','Placement et commentaire natifs éditables');
        const invalid=structuredClone(native);invalid.presentation.slides[0].elements[0].action.params.text='';
        assert(getValidationErrors(invalid,schema).some(e=>e.path.endsWith('params.text')),'Texte requis vidé détecté dans un bloc natif');
    }

    {
        const {formatContentForDocument}=await import('../js/export/document-formatter.js');
        const q=(question)=>({action:{library:'H5P.TrueFalse 1.8',params:{question,correct:'true'}}});
        const result=await formatContentForDocument('CoursePresentation',{presentation:{slides:[{elements:[q('Première question'),q('Deuxième question'),{action:{library:'H5P.Table 1.2',params:{text:'<table><tr><th>Pays</th><th>Capitale</th></tr><tr><td>France</td><td>Paris</td></tr></table>'}}}]}]}});
        const text=JSON.stringify(result);
        assert(text.includes('Première question')&&text.includes('Deuxième question'),'Tous les exercices natifs d’une diapositive imprimés');
        assert(result.sections.some(s=>s.type==='table'&&s.rows[0][1]==='Paris'),'Tableau natif conservé comme tableau documentaire');
    }

    group('Types natifs à signatures identiques');
    const motsAmbigus = { taskDescription: 'Repère les capitales.', textField: '*Paris* Lyon' };
    assertEqual(detectContentType(motsAmbigus, 'h5p_markthewords_name').moduleKey, 'MarkTheWords', 'Nom machine MarkTheWords prioritaire');
    assertEqual(detectContentType(motsAmbigus, 'h5p_dragtext_name').moduleKey, 'DragTheWords', 'Nom machine DragText prioritaire');

    group('Options natives des cartes et des séries');
    {
        const copyright = { license: 'CC BY', version: '4.0', author: 'Atelier pédagogique', title: 'Image de sonde' };
        const source = { title: 'Cartes', description: 'Associer', mode: 'repetition', dialogs: [{
            text: 'Question', answer: 'Réponse', tips: { front: 'Indice sans balise', back: 'Retour' },
            audio: [{ path: 'audios/carte.wav', mime: 'audio/wav', copyright }],
            image: { path: 'images/carte.png', mime: 'image/png', copyright }
        }], behaviour: { disableBackwardsNavigation: true, scaleTextNotCard: false, maxProficiency: 3, quickProgression: true } };
        const processed = await processH5PContent('DialogCards', source);
        assertEqual(processed.dialogs[0].audio, source.dialogs[0].audio, 'Cartes de dialogue : audio et crédits conservés au traitement');
        assertEqual(processed.dialogs[0].image.copyright, copyright, 'Cartes de dialogue : crédits image conservés');
        assertEqual(processed.dialogs[0].tips.front, 'Indice sans balise', 'Cartes de dialogue : aucun HTML ajouté dans un indice natif brut');
        const flash = { description: 'Saisie facultative', cards: [{ text: 'Question', answer: 'Réponse' }], showSolutionsRequiresInput: false, randomCards: true, caseSensitive: true };
        const normalized = normalizeDataForEditor(structuredClone(flash), 'Flashcards');
        assertEqual(normalized.behaviour.showSolutionsRequiresInput, false, 'Flashcards : réglage natif repris dans le formulaire');
        normalized.behaviour.randomCards = false;
        const saved = denormalizeDataForSave(normalized, 'Flashcards');
        const again = await processH5PContent('Flashcards', saved);
        assertEqual([again.showSolutionsRequiresInput, again.randomCards, again.caseSensitive], [false, false, true], 'Flashcards : retouches et false conservés dans le paquet');
        const choices = { choices: [{question: 'Question', answers: ['Oui', 'Non']}], behaviour: {autoContinue:true,timeoutCorrect:0,timeoutWrong:2300} };
        const series = await processH5PContent('SingleChoiceSet', choices);
        assertEqual([series.behaviour.timeoutCorrect,series.behaviour.timeoutWrong], [0,2300], 'Série : délais conservés, y compris zéro');
    }

    const cas = await chargerFixtures();
    const schemas = getSupportedTypes();

    // ==================================================================
    // A0 : couverture
    // ==================================================================
    group('Couverture du catalogue');
    {
        assert(cas.length >= 110, `${cas.length} fixtures d'exemple chargées`);
        assertEqual(erreursDeLecture, [],
            'Toute fixture est lisible par le pipeline réel (cleanJsonInput + healJsonString)');

        const couverts = new Set(cas.map(c => c.cle));
        const sansFixture = schemas.filter(k => !couverts.has(k));
        assertEqual(sansFixture, [], 'Chaque schéma d\'édition a au moins une fixture à éditer');

        const sansSchema = [...couverts].filter(k => !schemas.includes(k));
        assertEqual(sansSchema, [], 'Chaque fixture vise un schéma d\'édition existant');

        const fantomes = [...BLOCAGES_ASSUMES.keys()].filter(f => !cas.some(c => c.fichier === f));
        assertEqual(fantomes, [], 'BLOCAGES_ASSUMES ne référence que des fixtures existantes');
    }

    // ==================================================================
    // A1 → A4 : cycle d'enregistrement sur TOUTES les fixtures (hors DOM)
    // ==================================================================
    group('Détection du schéma (toutes fixtures)');
    {
        const fautifs = [];
        for (const c of cas) {
            const det = detectContentType(c.data, notificationPour(c.moduleKey, c.kind).titleKey);
            if (!det || det.moduleKey !== c.cle) {
                fautifs.push(`${c.fichier} → ${det ? det.moduleKey : 'aucun'} (attendu ${c.cle})`);
            }
        }
        assertEqual(fautifs, [], `Les ${cas.length} fixtures ouvrent le schéma attendu`);
    }

    group('Contenu généré : enregistrable tel quel');
    {
        const bloquees = [];
        const assumesEnTrop = [];
        for (const c of cas) {
            const { soigne } = cycleEnregistrement(c.data, c.cle);
            const erreurs = getValidationErrors(soigne, getSchemaForType(c.cle));
            if (erreurs.length && !BLOCAGES_ASSUMES.has(c.fichier)) {
                bloquees.push(`${c.fichier} : ${erreurs.slice(0, 3).map(e => `${e.path} (« ${e.field} »)`).join(', ')}`);
            }
            if (!erreurs.length && BLOCAGES_ASSUMES.has(c.fichier)) assumesEnTrop.push(c.fichier);
        }
        assertEqual(bloquees, [], 'Aucune activité d\'exemple ne naît bloquée à l\'enregistrement');
        assertEqual(assumesEnTrop, [], 'BLOCAGES_ASSUMES : aucune entrée devenue inutile');
    }

    group('Menus : le modèle porte une valeur que le menu propose');
    {
        const fautifs = [];
        for (const c of cas) {
            const { soigne } = cycleEnregistrement(c.data, c.cle);
            const schema = getSchemaForType(c.cle);
            for (const section of schema.sections || []) {
                for (const [cle, config] of Object.entries(section.fields || {})) {
                    for (const f of menusHorsOptions(getNestedValue(soigne, cle), config, cle)) {
                        fautifs.push(`${c.fichier} / ${f}`);
                    }
                }
            }
        }
        assertEqual(fautifs, [],
            'Aucune valeur de menu du contenu soigné n\'est absente des options (écran et modèle d\'accord)');
    }

    group('Validation : les champs obligatoires des conteneurs dynamiques');
    {
        // Un `dynamicObject` (sous-question de Quiz, exercice de diapositive ou de bloc de
        // Livre, contenu d'une question Éléa) échappait au validateur : le Glisser-déposer
        // autonome refusait une étiquette sans zone, la MÊME étiquette passait en silence
        // dans une diapositive. Ce groupe tient les deux bouts : ce qui manque est signalé,
        // ce qui est MASQUÉ ne bloque pas.
        let couverts = 0;
        const muets = [];
        const illisibles = [];

        for (const c of cas) {
            const schema = getSchemaForType(c.cle);
            const { soigne } = cycleEnregistrement(c.data, c.cle);
            if (getValidationErrors(soigne, schema).length) continue;   // déjà bloquée (cf. BLOCAGES_ASSUMES)

            const cibles = champsObligatoiresSousConteneurDynamique(soigne, schema);
            if (!cibles.length) continue;
            couverts++;

            const cible = cibles[0];
            const document = clone(soigne);
            setNestedValue(document, cible.chemin, Array.isArray(cible.valeur) ? [] : '');

            const trouvee = getValidationErrors(document, schema).find(e => e.path === cible.chemin);
            if (!trouvee) {
                muets.push(`${c.fichier} / ${cible.chemin}`);
            } else if (!String(trouvee.field).includes('›') || estCleI18nBrute(trouvee.field) || estCheminBrut(trouvee.field)) {
                muets.push(`${c.fichier} / ${cible.chemin} : libellé « ${trouvee.field} » sans fil d'Ariane`);
            }
        }

        assert(couverts >= 15, `${couverts} fixtures portent un champ obligatoire dans un conteneur dynamique`);
        assertEqual(muets, [], 'Vider un champ obligatoire imbriqué le signale, avec son fil d\'Ariane');

        // Une erreur de CARDINALITÉ porte sur le tableau lui-même, et un tableau déclare
        // souvent `itemLabel` plutôt que `label` : sans repli, le validateur affichait le
        // chemin brut des données en guise de libellé — le contraire de ce que 6.3.0 a corrigé.
        {
            const quiz = {
                title: 'Q',
                questions: [{
                    library: 'H5P.MultiChoice 1.16',
                    metadata: { title: 'Q1' },
                    params: { question: 'Énoncé', answers: [] }
                }]
            };
            const surLeTableau = getValidationErrors(quiz, getSchemaForType('QuizSet'))
                .find(e => e.path === 'questions.0.params.answers');
            assert(!!surLeTableau, 'Une sous-question sans proposition est signalée');
            if (surLeTableau) {
                assert(!estCheminBrut(surLeTableau.field) && !estCleI18nBrute(surLeTableau.field),
                    `Le libellé de l\u2019erreur de cardinalité est lisible (« ${surLeTableau.field} »)`);
            }
        }

        // Contre-partie : un conteneur MASQUÉ ne doit rien exiger. Une diapositive de contenu
        // peut garder un exercice résiduel (type changé après coup) : ses champs ne sont pas
        // affichés, les exiger reproduirait le défaut de 6.3.0 — bloquer sur l'invisible.
        {
            const cp = cas.find(x => x.cle === 'CoursePresentation');
            const { soigne } = cycleEnregistrement(cp.data, 'CoursePresentation');
            const schema = getSchemaForType('CoursePresentation');
            const diapo = (soigne.slides || []).find(s2 => !['quiz', 'content-quiz', 'summary'].includes(s2.type));
            assert(!!diapo, 'Une diapositive sans exercice sert de témoin');
            if (diapo) {
                diapo._exerciseLibrary = 'H5P.MultiChoice 1.16';
                diapo.exercise = { question: '' };      // obligatoire… mais masqué
                assertEqual(getValidationErrors(soigne, schema), [],
                    'Un conteneur dynamique masqué (showWhen) ne bloque pas l\'enregistrement');
            }
        }
    }

    group('Enregistrer sans modifier ne perd aucun texte');
    {
        const pertes = [];
        const assumeesUtilisees = new Set();
        for (const c of cas) {
            const { sortie } = cycleEnregistrement(c.data, c.cle);
            for (const perdu of textesPerdus(c.data, sortie)) {
                const assumee = PERTES_ASSUMEES.find(p => p.cle === c.cle && p.chemin.test(perdu.chemin));
                if (assumee) { assumeesUtilisees.add(assumee); continue; }
                pertes.push(`${c.fichier} / ${perdu.chemin} : « ${abrege(perdu.valeur)} »`);
            }
        }
        assertEqual(pertes, [], 'Le cycle normaliser → soigner → dénormaliser ne perd aucun texte');

        const inutiles = PERTES_ASSUMEES.filter(p => !assumeesUtilisees.has(p)).map(p => `${p.cle} / ${p.chemin}`);
        assertEqual(inutiles, [], 'PERTES_ASSUMEES : aucune entrée devenue inutile');
    }

    // ==================================================================
    // A5 : renvois PAR INDICE — déclaration, arithmétique, survie
    // ==================================================================
    // Un schéma peut désigner les items d'une liste par leur INDICE depuis une liste frère
    // (`optionsValueType: 'index'`). Toute mutation de la liste visée renumérote ces renvois :
    // c'est le seul endroit de l'éditeur où supprimer un item peut, en silence, changer le
    // SENS d'un autre. Trois filets : la déclaration doit être complète, l'arithmétique juste,
    // et le résultat vérifié bout en bout dans le DOM (cf. groupe « Renvois par indice (DOM) »).
    group('Renvois par indice : déclaration complète dans les schémas');
    {
        const declares = [];   // tableaux qui annoncent être référencés
        const utilises = [];   // champs qui référencent un tableau

        for (const cle of schemas) {
            const schema = getSchemaForType(cle);
            if (!schema) continue;
            for (const { chemin, config } of champsDuSchema(schema)) {
                if (Array.isArray(config.indexReferencedBy)) {
                    for (const r of config.indexReferencedBy) {
                        declares.push(`${cle} :: ${contexteParent(chemin)} :: ${chemin.split('.').pop()} ← ${r.array}[].${r.field}`);
                    }
                }
                if (config.optionsValueType === 'index') {
                    // Le champ vit dans l'itemSchema d'un tableau : « …elements[].zoneIndices »
                    const cheminTableauReferent = contexteParent(chemin).replace(/\[\]$/, '');
                    const contexte = contexteParent(cheminTableauReferent);
                    const referent = cheminTableauReferent.split('.').pop();
                    utilises.push(`${cle} :: ${contexte} :: ${config.optionsFrom} ← ${referent}[].${chemin.split('.').pop()}`);
                }
            }
        }

        assert(utilises.length >= 3, `${utilises.length} champs désignent un autre tableau par indice`);
        // Les deux listes décrivent la même relation, vue de chaque bout : elles doivent
        // coïncider exactement. Une entrée manquante d'un côté = une mutation qui ne
        // réécrira pas les renvois (ou une déclaration qui ne sert plus à rien).
        assertEqual(utilises.filter(u => !declares.includes(u)).sort(), [],
            'Tout renvoi par indice est déclaré sur le tableau visé (indexReferencedBy)');
        assertEqual(declares.filter(d => !utilises.includes(d)).sort(), [],
            'Toute déclaration indexReferencedBy correspond à un renvoi réel');
    }

    group('Renvois par indice : arithmétique des quatre mutations');
    {
        // Trois zones, quatre étiquettes : chaque cas de figure est représenté.
        const modele = () => ({
            dropZones: [{ label: 'Z0' }, { label: 'Z1' }, { label: 'Z2' }],
            elements: [
                { text: 'E0', zoneIndices: [0] },
                { text: 'E1', zoneIndices: [1] },
                { text: 'E2', zoneIndices: [2] },
                { text: 'E3', zoneIndices: [0, 2] }
            ]
        });
        const renvois = [{ array: 'elements', field: 'zoneIndices' }];
        const lire = (p) => p.elements.map(e => e.zoneIndices);

        const parSuppression = modele();
        parSuppression.dropZones.splice(1, 1);
        remapIndexReferences(parSuppression, renvois, { type: 'remove', index: 1 });
        assertEqual(lire(parSuppression), [[0], [], [1], [0, 1]],
            'Suppression : les suivants reculent, le renvoi vers la zone retirée disparaît');

        const parInsertion = modele();
        parInsertion.dropZones.splice(1, 0, { label: 'neuve' });
        remapIndexReferences(parInsertion, renvois, { type: 'insert', index: 1 });
        assertEqual(lire(parInsertion), [[0], [2], [3], [0, 3]], 'Insertion : les suivants avancent');

        const parDuplication = modele();
        parDuplication.dropZones.splice(1, 0, { label: 'Z0 (copie)' });
        remapIndexReferences(parDuplication, renvois, { type: 'duplicate', index: 0 });
        assertEqual(lire(parDuplication), [[0], [2], [3], [0, 3]],
            'Duplication : l\'original garde sa place, les suivants avancent');

        const versLeHaut = modele();
        versLeHaut.dropZones.splice(0, 0, versLeHaut.dropZones.splice(2, 1)[0]);
        remapIndexReferences(versLeHaut, renvois, { type: 'move', from: 2, to: 0 });
        assertEqual(lire(versLeHaut), [[1], [2], [0], [1, 0]], 'Déplacement vers le haut : la tranche glisse');

        const versLeBas = modele();
        versLeBas.dropZones.splice(2, 0, versLeBas.dropZones.splice(0, 1)[0]);
        remapIndexReferences(versLeBas, renvois, { type: 'move', from: 0, to: 2 });
        assertEqual(lire(versLeBas), [[2], [0], [1], [2, 1]], 'Déplacement vers le bas : la tranche glisse');

        // Robustesse : type conservé, valeur illisible laissée intacte, hors bornes non inventé.
        const casLimites = {
            dropZones: [{ label: 'Z0' }, { label: 'Z1' }],
            elements: [{ zoneIndices: ['1'] }, { zoneIndices: ['pas un indice'] }, { zoneIndices: [7] }]
        };
        remapIndexReferences(casLimites, renvois, { type: 'remove', index: 0 });
        assertEqual(casLimites.elements.map(e => e.zoneIndices), [['0'], ['pas un indice'], [6]],
            'Les chaînes restent des chaînes, l\'illisible est laissé tel quel');
    }

    group('Glisser-déposer : les associations survivent au pipeline');
    {
        // Deux écritures pour la même information — `dropZones[].correctElements` (H5P) et
        // `elements[].zoneIndices` (éditeur). Un contenu écrit dans la seconde traversait
        // tout le pipeline sans être compris : le .h5p partait SANS aucune bonne réponse.
        const perdues = [];
        let examinees = 0;

        for (const c of cas) {
            const attendu = compterAssociationsDragQuestion(c.data);
            if (attendu === 0) continue;
            examinees++;

            const { soigne, sortie } = cycleEnregistrement(c.data, c.cle);
            if (compterAssociationsDragQuestion(soigne) !== attendu) {
                perdues.push(`${c.fichier} : ${attendu} → ${compterAssociationsDragQuestion(soigne)} à l'ouverture de l'éditeur`);
            }
            if (compterAssociationsDragQuestion(sortie) !== attendu) {
                perdues.push(`${c.fichier} : ${attendu} → ${compterAssociationsDragQuestion(sortie)} à l'enregistrement`);
            }

            // Et jusqu'au fichier produit : c'est là que le défaut se voyait (correctElements: []).
            try {
                const traite = await processH5PContent(c.moduleKey, healStructureForActivity(clone(c.data), c.cle));
                if (compterAssociationsDragQuestion(traite) !== attendu) {
                    perdues.push(`${c.fichier} : ${attendu} → ${compterAssociationsDragQuestion(traite)} dans le .h5p`);
                }
            } catch (e) {
                perdues.push(`${c.fichier} : le processeur a échoué (${e && e.message})`);
            }
        }

        assert(examinees >= 6, `${examinees} fixtures portent un Glisser-déposer (autonome ou imbriqué)`);
        assertEqual(perdues, [], 'Aucune association étiquette → zone n\'est perdue en chemin');
    }

    group('Cycle d\'enregistrement idempotent');
    {
        const instables = [];
        for (const c of cas) {
            const un = cycleEnregistrement(c.data, c.cle).sortie;
            const deux = cycleEnregistrement(un, c.cle).sortie;
            if (JSON.stringify(un) !== JSON.stringify(deux)) instables.push(c.fichier);
        }
        assertEqual(instables, [], 'Ré-enregistrer un contenu déjà enregistré ne le change plus');
    }

    // ==================================================================
    // B : cycle réel dans le DOM, une fixture par schéma
    // ==================================================================
    const parSchema = new Map();
    for (const c of cas) if (!parSchema.has(c.cle)) parSchema.set(c.cle, c);
    const casDom = [...parSchema.values()].sort((a, b) => a.cle.localeCompare(b.cle));

    // Les Glisser-déposer IMBRIQUÉS ne sont pas dans la première fixture de chaque activité
    // (course_presentation_1 n'en a pas) : on retient, pour chaque schéma, la première fixture
    // qui en porte un — sinon le cas le plus délicat ne serait jamais joué.
    const parSchemaAvecDragQuestion = new Map();
    for (const c of cas) {
        if (parSchemaAvecDragQuestion.has(c.cle)) continue;
        if (compterAssociationsDragQuestion(c.data) > 0) parSchemaAvecDragQuestion.set(c.cle, c);
    }
    const casDragQuestion = [...parSchemaAvecDragQuestion.values()].sort((a, b) => a.cle.localeCompare(b.cle));

    const conteneur = document.createElement('div');
    conteneur.style.position = 'absolute';
    conteneur.style.left = '-10000px';
    conteneur.style.width = '1200px';
    document.body.appendChild(conteneur);

    const ouvrir = async (c) => {
        destroyEditor();
        conteneur.innerHTML = '';
        const ok = await initJsonEditor(notificationPour(c.moduleKey, c.kind), conteneur, clone(c.data));
        await pause(20);
        return ok;
    };

    /** Parcourt toutes les vues d'un schéma comme le ferait l'enseignant. */
    const parcourirToutesLesVues = async (schema, surChaqueVue) => {
        for (const section of schema.sections || []) {
            const af = __testing.findPrimaryArrayField(section);
            if (!af) {
                __testing.navigateTo(section.id);
                await pause(0);
                if (surChaqueVue) surChaqueVue(section, null);
                continue;
            }
            const items = getNestedValue(getEditorData(), af.path) || [];
            const n = Math.min(items.length, 5);
            if (n === 0) {
                __testing.navigateTo(section.id, null);
                await pause(0);
                if (surChaqueVue) surChaqueVue(section, null);
            }
            for (let i = 0; i < n; i++) {
                __testing.navigateTo(section.id, i);
                await pause(0);
                if (surChaqueVue) surChaqueVue(section, i);
            }
        }
    };

    try {
        // --------------------------------------------------------------
        // B1 / B2 / B3 : ouverture, navigation exhaustive, enregistrement
        // --------------------------------------------------------------
        group('Ouverture et navigation (DOM, tous schémas)');
        {
            const nonOuverts = [];
            const nonEnregistrables = [];
            const secondEnregistrement = [];
            const clesBrutes = [];
            const ecrasements = [];
            const nonStabilises = [];
            let vues = 0;

            for (const c of casDom) {
                const ouvert = await ouvrir(c);
                if (!ouvert) { nonOuverts.push(`${c.cle} (${c.fichier})`); continue; }
                if (getEditorState().moduleKey !== c.cle) {
                    nonOuverts.push(`${c.cle} : ouvert sur ${getEditorState().moduleKey}`);
                    continue;
                }

                const schema = getSchemaForType(c.cle);
                const avant = clone(getEditorData());

                await parcourirToutesLesVues(schema, (section) => {
                    vues++;
                    const brutes = clesBrutesAffichees(conteneur);
                    if (brutes.length) clesBrutes.push(`${c.cle} / ${section.id} : ${brutes.slice(0, 3).join(', ')}`);
                });

                const ecarts = valeursEcrasees(avant, getEditorData());
                if (ecarts.length) ecrasements.push(`${c.cle} : ${ecarts.slice(0, 3).join(' ; ')}`);

                // Le document doit CONVERGER : un second parcours ne peut plus rien matérialiser.
                // (Le premier peut en déclencher un second en cascade : un défaut posé sur un
                // sous-objet fait apparaître les champs de ce sous-objet.)
                const apresDeuxieme = await (async () => { await parcourirToutesLesVues(schema); return JSON.stringify(getEditorData()); })();
                const apresTroisieme = await (async () => { await parcourirToutesLesVues(schema); return JSON.stringify(getEditorData()); })();
                if (apresDeuxieme !== apresTroisieme) nonStabilises.push(`${c.cle} (${c.fichier})`);

                if (!(await saveChanges())) {
                    const errs = (getEditorState().validationErrors || []).slice(0, 3);
                    nonEnregistrables.push(`${c.cle} : ${errs.map(e => `${e.path} (« ${e.field} »)`).join(', ')}`);
                } else if (!(await saveChanges())) {
                    // La dénormalisation écrit dans l'objet qu'on lui passe : si elle atteignait le
                    // modèle vivant, le second enregistrement échouerait sur des champs techniques
                    // que le premier a retirés.
                    const errs = (getEditorState().validationErrors || []).slice(0, 3);
                    secondEnregistrement.push(`${c.cle} : ${errs.map(e => `${e.path} (« ${e.field} »)`).join(', ')}`);
                }
            }

            assert(vues > 60, `${vues} vues de l'éditeur parcourues sur ${casDom.length} activités`);
            assertEqual(nonOuverts, [], 'L\'éditeur s\'ouvre sur chaque activité, avec le bon schéma');
            assertEqual(clesBrutes, [], 'Aucun libellé affiché n\'est resté une clé i18n brute');
            assertEqual(ecrasements, [], 'Parcourir les vues ne réécrit aucune valeur existante');
            assertEqual(nonStabilises, [], 'Le document se stabilise (un parcours de plus ne change plus rien)');
            assertEqual(nonEnregistrables, [], 'Enregistrement possible sans modification, sur chaque activité');
            assertEqual(secondEnregistrement, [], 'Un second enregistrement d\'affilée reste possible');
        }

        // --------------------------------------------------------------
        // B4 : ajouter un item ne rend fautif que l'item neuf
        // --------------------------------------------------------------
        group('Ajout d\'un item (DOM, toutes listes principales)');
        {
            const nonAjoutes = [];
            const contaminations = [];
            const illisibles = [];
            let listes = 0;
            let enregistrables = 0;

            for (const c of casDom) {
                const schema = getSchemaForType(c.cle);
                for (const section of schema.sections || []) {
                    const af = __testing.findPrimaryArrayField(section);
                    if (!af) continue;

                    if (!(await ouvrir(c))) continue;
                    const avant = (getNestedValue(getEditorData(), af.path) || []).length;
                    if (af.config.maxItems && avant >= af.config.maxItems) continue;  // le bouton refuserait
                    listes++;

                    __testing.handleArrayAdd(section.id, af);
                    await pause(20);

                    const items = getNestedValue(getEditorData(), af.path) || [];
                    if (items.length !== avant + 1) {
                        nonAjoutes.push(`${c.cle} / ${af.path} : ${avant} → ${items.length}`);
                        continue;
                    }

                    if (await saveChanges()) { enregistrables++; continue; }

                    // L'activité était enregistrable AVANT l'ajout (cf. groupe précédent) :
                    // tout ce qui bloque doit donc porter sur l'item neuf, et rien d'autre.
                    const erreurs = getEditorState().validationErrors || [];
                    const prefixeNeuf = `${af.path}.${items.length - 1}`;
                    const ailleurs = erreurs.filter(e => !String(e.path).startsWith(prefixeNeuf));
                    if (ailleurs.length) {
                        contaminations.push(`${c.cle} / ${af.path} : ${ailleurs.slice(0, 2).map(e => e.path).join(', ')}`);
                    }
                    const muettes = erreurs.filter(e => !e.field || estCleI18nBrute(e.field) || estCheminBrut(e.field));
                    if (muettes.length) {
                        illisibles.push(`${c.cle} / ${af.path} : ${muettes.slice(0, 2).map(e => `${e.path} → « ${e.field} »`).join(', ')}`);
                    }
                }
            }

            assert(listes >= 25, `${listes} listes principales exercées (${enregistrables} enregistrables telles quelles)`);
            assertEqual(nonAjoutes, [], 'Le bouton « Ajouter » ajoute exactement un item');
            assertEqual(contaminations, [], 'Ajouter un item ne rend fautif aucun autre endroit du document');
            assertEqual(illisibles, [], 'Ce qui reste à remplir est toujours désigné par un libellé lisible');
        }

        // --------------------------------------------------------------
        // B5 : supprimer un item de la liste principale
        // --------------------------------------------------------------
        group('Suppression dans la liste principale (DOM)');
        {
            const mauvaisCompte = [];
            const voisinsAbimes = [];
            const nonEnregistrables = [];
            let listes = 0;

            for (const c of casDom) {
                const schema = getSchemaForType(c.cle);
                for (const section of schema.sections || []) {
                    const af = __testing.findPrimaryArrayField(section);
                    if (!af) continue;

                    if (!(await ouvrir(c))) continue;
                    const items = getNestedValue(getEditorData(), af.path) || [];
                    const minimum = af.config.minItems || 0;
                    if (items.length < 3 || items.length - 1 < minimum) continue;
                    listes++;

                    const attendu = clone(items).filter((_, i) => i !== 1);
                    const stop = autoConfirmeSuppression();
                    await __testing.handleArrayRemove(section.id, af, 1);
                    stop();
                    await pause(20);

                    const restants = getNestedValue(getEditorData(), af.path) || [];
                    if (restants.length !== attendu.length) {
                        mauvaisCompte.push(`${c.cle} / ${af.path} : ${restants.length} restant(s) pour ${attendu.length} attendu(s)`);
                    } else {
                        const ecarts = valeursEcrasees(attendu, restants);
                        if (ecarts.length) voisinsAbimes.push(`${c.cle} / ${af.path} : ${ecarts.slice(0, 3).join(' ; ')}`);
                    }
                    if (!(await saveChanges())) {
                        // Seule exception admise : un renvoi PAR INDICE devenu orphelin. Supprimer
                        // une zone du Glisser-déposer laisse sans cible les étiquettes qui la
                        // visaient — le contenu est réellement incomplet, l'enseignant doit
                        // trancher. L'erreur doit alors désigner ces renvois, et rien d'autre.
                        const renvois = af.config.indexReferencedBy || [];
                        const cheminsAdmis = renvois.map(r => `${r.array}.`);
                        const errs = getEditorState().validationErrors || [];
                        const inattendues = errs.filter(e => {
                            const chemin = String(e.path);
                            if (!cheminsAdmis.some(prefixe => chemin.startsWith(prefixe))) return true;
                            return !renvois.some(r => {
                                if (!chemin.endsWith(`.${r.field}`)) return false;
                                const valeur = getNestedValue(getEditorData(), chemin);
                                return Array.isArray(valeur) && valeur.length === 0;  // bien orphelin
                            });
                        });
                        if (inattendues.length) {
                            nonEnregistrables.push(`${c.cle} / ${af.path} : ${inattendues.slice(0, 2).map(e => `${e.path} (« ${e.field} »)`).join(', ')}`);
                        }
                        if (errs.some(e => !e.field || estCleI18nBrute(e.field) || estCheminBrut(e.field))) {
                            nonEnregistrables.push(`${c.cle} / ${af.path} : erreur sans libellé lisible`);
                        }
                    }
                }
            }

            assert(listes >= 20, `${listes} listes principales dont un item a été supprimé`);
            assertEqual(mauvaisCompte, [], 'Supprimer un item en retire exactement un');
            assertEqual(voisinsAbimes, [], 'Supprimer un item ne réécrit aucune valeur de ses voisins');
            assertEqual(nonEnregistrables, [],
                'Après suppression, rien ne bloque hors des renvois par indice devenus orphelins');
        }

        // --------------------------------------------------------------
        // B7 : muter une liste RÉFÉRENCÉE PAR INDICE ne change aucune cible
        // --------------------------------------------------------------
        // Le geste réel, pas l'arithmétique : supprimer, déplacer ou dupliquer une zone du
        // Glisser-déposer, et vérifier que chaque étiquette vise TOUJOURS LE MÊME OBJET zone
        // — comparaison par référence, seule à rester valable quand les indices ont bougé.
        group('Renvois par indice : mutations réelles (DOM)');
        {
            const derives = [];
            const nonRafraichis = [];
            let mutations = 0;

            /** Comparaison PAR RÉFÉRENCE : seule à rester valable quand les indices ont bougé. */
            const memesCibles = (a, b) => a.length === b.length && a.every((listes, i) =>
                listes.length === b[i].length && listes.every((cibles, j) =>
                    cibles.length === b[i][j].length && cibles.every((z, k) => z === b[i][j][k])));

            for (const c of casDom) {
                const schema = getSchemaForType(c.cle);

                // ---- listes du sommaire (Glisser-déposer autonome)
                for (const section of schema.sections || []) {
                    const af = __testing.findPrimaryArrayField(section);
                    if (!af || !Array.isArray(af.config.indexReferencedBy)) continue;
                    const renvois = af.config.indexReferencedBy;

                    /**
                     * @param {string} nom - libellé du geste, pour le diagnostic
                     * @param {Function} appliquer - le geste, sur la liste référencée
                     * @param {Function} attenduDepuis - cibles attendues, à partir des cibles
                     *        d'avant et de la PHOTO de la liste (les objets, pas le tableau vivant)
                     */
                    const scenario = async (nom, appliquer, attenduDepuis) => {
                        if (!(await ouvrir(c))) return;
                        const parent = getEditorData();
                        const liste = getNestedValue(parent, af.path) || [];
                        if (liste.length < 3) return;
                        const photo = [...liste];                       // le tableau est muté en place
                        const avant = renvois.map(r => ciblesDesRenvois(parent, af.path, r));

                        await appliquer(section, af);
                        await pause(20);
                        mutations++;

                        const apres = renvois.map(r => ciblesDesRenvois(getEditorData(), af.path, r));
                        const attendu = avant.map(listes => attenduDepuis(listes, photo));
                        if (!memesCibles(apres, attendu)) {
                            const lisible = (x) => JSON.stringify(x.map(l => l.map(cibles => cibles.map(z => (z && z.label) ?? null))));
                            derives.push(`${c.cle} / ${af.path} — ${nom} : ${lisible(apres)} au lieu de ${lisible(attendu)}`);
                        }
                    };

                    // Suppression : seule la cible supprimée disparaît des renvois.
                    await scenario('suppression',
                        async (sec, champ) => {
                            const stop = autoConfirmeSuppression();
                            await __testing.handleArrayRemove(sec.id, champ, 1);
                            stop();
                        },
                        (listes, photo) => listes.map(cibles => cibles.filter(z => z !== photo[1])));

                    // Déplacement et duplication : AUCUN renvoi ne change de cible.
                    await scenario('déplacement',
                        async (sec, champ) => { __testing.handleArrayMove(sec.id, champ.path, 2, 0); },
                        (listes) => listes);

                    await scenario('duplication',
                        async (sec, champ) => { await __testing.handleArrayDuplicate(sec.id, champ, 0); },
                        (listes) => listes);
                }

            }

            // ---- tableaux imbriqués (Glisser-déposer d'une diapositive, d'un bloc, d'une
            // sous-question) : c'est l'ArrayManager qui mute, par la corbeille de l'item.
            for (const c of casDragQuestion) {
                const schema = getSchemaForType(c.cle);
                const nomsReferences = new Map();
                for (const { chemin, config } of champsDuSchema(schema)) {
                    if (Array.isArray(config.indexReferencedBy)) {
                        nomsReferences.set(chemin.split('.').pop(), config.indexReferencedBy);
                    }
                }
                if (nomsReferences.size === 0) continue;
                if (!(await ouvrir(c))) continue;

                // Sans limite d'items ici : un Glisser-déposer imbriqué peut se trouver sur
                // n'importe quelle diapositive (la 13e dans course_presentation_5).
                let cible = null;
                for (const section of schema.sections || []) {
                    const af = __testing.findPrimaryArrayField(section);
                    const items = af ? (getNestedValue(getEditorData(), af.path) || []) : [];
                    const n = af ? items.length : 1;
                    for (let i = 0; i < n && !cible; i++) {
                        if (af) __testing.navigateTo(section.id, i); else __testing.navigateTo(section.id);
                        await pause(0);
                        for (const item of conteneur.querySelectorAll('.json-editor__detail .json-editor__array-item')) {
                            const champ = item.querySelector('[data-path]');
                            if (!champ || Number(item.dataset.index) !== 1) continue;
                            const m = String(champ.dataset.path || '').match(/^(.+)\.1(\.|$)/);
                            if (!m || !m[1].includes('.')) continue;
                            const nom = m[1].split('.').pop();
                            if (!nomsReferences.has(nom)) continue;
                            const valeur = getNestedValue(getEditorData(), m[1]);
                            if (!Array.isArray(valeur) || valeur.length < 3) continue;
                            const bouton = item.querySelector('[data-action="delete"]');
                            if (bouton) { cible = { chemin: m[1], nom, bouton }; break; }
                        }
                    }
                    if (cible) break;
                }
                if (!cible) continue;

                const cheminParent = cible.chemin.slice(0, cible.chemin.lastIndexOf('.'));
                const parent = getNestedValue(getEditorData(), cheminParent);
                const renvois = nomsReferences.get(cible.nom);
                const supprimee = parent[cible.nom][1];
                const avant = renvois.map(r => ciblesDesRenvois(parent, cible.nom, r));

                const stop = autoConfirmeSuppression();
                cible.bouton.click();
                await pause(80);
                stop();
                mutations++;

                const apres = renvois.map(r => ciblesDesRenvois(parent, cible.nom, r));
                const attendu = avant.map(listes => listes.map(cibles => cibles.filter(z => z !== supprimee)));
                if (!memesCibles(apres, attendu)) {
                    derives.push(`${c.cle} / ${cible.chemin} — suppression imbriquée`);
                }

                // Les cases à cocher des référents sont construites sur la liste des cibles :
                // sans re-rendu, l'écran proposerait encore l'item supprimé, et cocher une case
                // réécrirait l'ancienne numérotation dans le modèle.
                const libellesAffiches = [...conteneur.querySelectorAll('.json-editor__multi-checkbox-label, .json-editor__checkbox-label')]
                    .map(e => (e.textContent || '').trim());
                if (supprimee && supprimee.label && libellesAffiches.includes(supprimee.label)) {
                    nonRafraichis.push(`${c.cle} / ${cible.chemin} : « ${supprimee.label} » encore proposé après suppression`);
                }
            }

            assert(mutations >= 4, `${mutations} mutations de listes référencées par indice exercées`);
            assertEqual(derives, [], 'Aucun renvoi ne change de cible après suppression, déplacement ou duplication');
            assertEqual(nonRafraichis, [], 'La liste référente est redessinée : la cible supprimée n\'est plus proposée');
        }

        // --------------------------------------------------------------
        // B6 : supprimer un item d'un tableau IMBRIQUÉ (défaut n°3 de 6.3.0)
        // --------------------------------------------------------------
        group('Suppression dans un tableau imbriqué (DOM)');
        {
            const mauvaisCompte = [];
            const voisinsAbimes = [];
            const nonEnregistrables = [];
            const exercees = [];

            // Un tableau imbriqué ne vit que dans la vue de DÉTAIL d'un item : il faut naviguer
            // pour en trouver un. Le chemin vers le modèle se lit sur les CHAMPS de l'item
            // (« chapters.0.content.1.table.headers.0.text ») : le conteneur, lui, n'en porte pas
            // toujours. On remonte donc du champ au tableau qui le contient.
            const tableauImbriqueSupprimable = () => {
                const candidats = new Map();
                for (const item of conteneur.querySelectorAll('.json-editor__detail .json-editor__array-item')) {
                    const champ = item.querySelector('[data-path]');
                    const index = Number(item.dataset.index);
                    if (!champ || !Number.isInteger(index)) continue;
                    const m = String(champ.dataset.path || '').match(new RegExp(`^(.+)\\.${index}(\\.|$)`));
                    if (!m) continue;
                    const chemin = m[1];
                    const valeur = getNestedValue(getEditorData(), chemin);
                    if (!Array.isArray(valeur) || valeur.length < 3) continue;
                    if (!candidats.has(chemin)) candidats.set(chemin, { chemin, valeur, boutons: new Map() });
                    const bouton = item.querySelector('[data-action="delete"]');
                    if (bouton) candidats.get(chemin).boutons.set(index, bouton);
                }
                for (const { chemin, valeur, boutons } of candidats.values()) {
                    if (!boutons.has(1)) continue;
                    // Un tableau partiellement rendu (vue repliée) ne dirait rien de fiable.
                    if (boutons.size !== valeur.length) continue;
                    return { chemin, avant: clone(valeur), bouton: boutons.get(1) };
                }
                return null;
            };

            for (const c of casDom) {
                if (!(await ouvrir(c))) continue;

                let cible = null;
                await parcourirToutesLesVues(getSchemaForType(c.cle), () => {
                    if (!cible) cible = tableauImbriqueSupprimable();
                });
                if (!cible) continue;
                exercees.push(`${c.cle}/${cible.chemin}`);

                const attendu = cible.avant.filter((_, i) => i !== 1);
                const stop = autoConfirmeSuppression();
                cible.bouton.click();
                await pause(60);
                stop();

                const restants = getNestedValue(getEditorData(), cible.chemin) || [];
                if (restants.length !== attendu.length) {
                    mauvaisCompte.push(`${c.cle} / ${cible.chemin} : ${cible.avant.length} → ${restants.length} (attendu ${attendu.length})`);
                } else {
                    const ecarts = valeursEcrasees(attendu, restants);
                    if (ecarts.length) voisinsAbimes.push(`${c.cle} / ${cible.chemin} : ${ecarts.slice(0, 3).join(' ; ')}`);
                }
                if (!(await saveChanges())) {
                    const errs = (getEditorState().validationErrors || []).slice(0, 2);
                    nonEnregistrables.push(`${c.cle} : ${errs.map(e => `${e.path} (« ${e.field} »)`).join(', ')}`);
                }
            }

            assert(exercees.length >= 6, `${exercees.length} tableaux imbriqués exercés (${exercees.join(', ')})`);
            assertEqual(mauvaisCompte, [], 'Supprimer un item imbriqué en retire exactement un — aucun fantôme recréé');
            assertEqual(voisinsAbimes, [], 'Supprimer un item imbriqué ne réécrit aucune valeur de ses voisins');
            assertEqual(nonEnregistrables, [], 'Enregistrement possible après suppression d\'un item imbriqué');
        }
    } finally {
        destroyEditor();
        conteneur.remove();
        document.querySelectorAll('.json-editor__modal-overlay').forEach(m => m.remove());
    }

    return { passCount, failCount, results };
}
