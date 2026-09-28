/**
 * Tests e2e : cycle « éditer → modifier → enregistrer » de l'éditeur JSON
 *
 * Signalement d'usage (2026-08) : « dès que je modifie un peu un livret interactif,
 * l'enregistrement est quasi impossible, il manque toujours un élément à remplir que je
 * ne perçois pas ». Trois défauts se cumulaient, tous reproduits ici :
 *
 *  1. Un `<select>` sans option vide AFFICHE sa première option quand la valeur stockée
 *     ne correspond à aucune. Les items neufs naissant avec '' , le menu montrait
 *     « Texte » pendant que le modèle gardait '' — et le champ `required` bloquait
 *     l'enregistrement sur un menu qui paraissait rempli.
 *  2. Le registre `arrayManagers` d'editor-core survivait à la suppression d'un item de
 *     tableau IMBRIQUÉ : la collecte ressuscitait l'item disparu, et la validation
 *     réclamait un champ sur un bloc absent de l'écran.
 *  3. Le résumé d'erreurs ne gardait que les messages dédupliqués, sans dire OÙ — or
 *     l'éditeur est en maître-détail, le champ fautif n'est le plus souvent même pas rendu.
 *
 * D'où les quatre invariants tenus ici :
 *  G1 — un menu obligatoire naît sur une valeur que le menu propose vraiment (TOUTES les
 *       activités, tous leurs tableaux, y compris imbriqués) ;
 *  G2 — un CONTENEUR (chapitre, diapositive, sous-question) naît avec un titre générique,
 *       et rien de son ÉCHAFAUDAGE (titre, type, menus) ne bloque l'enregistrement — seul le
 *       contenu pédagogique qu'il reste à écrire peut le faire, en se nommant ;
 *  G3 — ce qui reste bloquant après l'ajout d'un item est toujours LOCALISABLE : libellé
 *       traduit, et fil d'Ariane jusqu'à l'item fautif ;
 *  G4 — cycle réel dans le DOM sur le Livre interactif : ajouter un bloc, saisir, ajouter
 *       un chapitre, supprimer un bloc — chaque étape reste enregistrable, et la
 *       suppression ne laisse pas d'item fantôme dans les données.
 *
 * G1 à G3 travaillent sur le modèle (rapides, déterministes, sans minutage) : les deux
 * chemins d'ajout de l'éditeur — bouton du sommaire (`handleArrayAdd` d'editor-core) et
 * bouton d'un tableau imbriqué (`ArrayManager.addItem`) — passent tous deux par
 * `createEmptyArrayItem`, c'est donc bien le geste utilisateur qui est simulé.
 * G4 pilote le vrai DOM, seul moyen d'attraper le défaut n°2.
 *
 * Usage : ouvrir tests/test-editor-lifecycle.html depuis le serveur local,
 *         ou via tests/test-all.html (suite `editor-lifecycle`).
 */

import { getSchemaForType, getSupportedTypes } from '../js/editor/content-detector.js';
import { createEmptyArrayItem } from '../js/editor/array-manager.js';
import { renderSelectField } from '../js/editor/field-renderers.js';
import { getValidationErrors } from '../js/editor/validators.js';
import { healStructureForActivity } from '../js/h5p/json-healer.js';
import { initJsonEditor, saveChanges, destroyEditor } from '../js/editor/index.js';
import { getEditorData } from '../js/editor/editor-core.js';
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
        message += ` (attendu: ${JSON.stringify(expected)}, obtenu: ${JSON.stringify(actual)})`;
    }
    assert(pass, message);
}

function group(name) {
    _group = name;
}

const flush = () => new Promise(r => setTimeout(r, 0));
const wait = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Un libellé encore sous forme de clé i18n (`editor_ib_block_type`) est illisible pour
 * l'enseignant : c'est précisément ce que l'ancien résumé d'erreurs affichait.
 */
function estCleI18nBrute(libelle) {
    return typeof libelle === 'string' && /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(libelle.trim());
}

/**
 * Parcourt récursivement les champs `array` d'un schéma d'éditeur.
 * @yields {{ path: string, config: Object }}
 */
function* champsTableau(schema) {
    const vus = new Set();

    function* marcher(champs, prefixe) {
        for (const [cle, config] of Object.entries(champs || {})) {
            if (!config || typeof config !== 'object') continue;
            const chemin = prefixe ? `${prefixe}.${cle}` : cle;
            if (vus.has(chemin)) continue;
            vus.add(chemin);

            if (config.type === 'array' && config.itemSchema) {
                yield { path: chemin, config };
                yield* marcher(config.itemSchema, `${chemin}[]`);
            } else if (config.type === 'object' && config.schema) {
                yield* marcher(config.schema, chemin);
            } else if (config.type === 'fieldGroup' && config.fields) {
                yield* marcher(config.fields, chemin);
            } else if (config.type === 'dynamicObject' && config.schemas) {
                for (const [lib, sous] of Object.entries(config.schemas)) {
                    yield* marcher(sous, `${chemin}<${lib}>`);
                }
            }
        }
    }

    for (const section of schema.sections || []) {
        yield* marcher(section.fields, '');
    }
}

/** Tous les schémas d'éditeur, triés — source unique : content-detector. */
function tousLesSchemas() {
    return getSupportedTypes().sort().map(cle => ({ cle, schema: getSchemaForType(cle) }))
        .filter(e => e.schema && Array.isArray(e.schema.sections));
}

// =======================================================================
// SUITE
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    // Les libellés d'erreur passent par `t()` : sans locale chargée, TOUT ressortirait
    // en clé brute et les contrôles de lisibilité ci-dessous n'auraient aucun sens.
    await loadTranslations('fr');
    assert(t('editor_title') !== 'editor_title', 'Locale fr chargée (les libellés sont traduisibles)');

    const schemas = tousLesSchemas();
    assert(schemas.length > 20, `${schemas.length} schémas d'éditeur inspectés`);

    // ==================================================================
    // G1 : un menu obligatoire naît sur une valeur que le menu propose
    // ==================================================================
    group('Menus obligatoires : affichage = modèle');
    {
        let menusVerifies = 0;
        const fautifs = [];

        for (const { cle, schema } of schemas) {
            for (const { path, config } of champsTableau(schema)) {
                const item = createEmptyArrayItem(config, 0);
                if (!item || typeof item !== 'object') continue;   // tableau de valeurs simples

                for (const [nomChamp, champ] of Object.entries(config.itemSchema)) {
                    if (!champ || champ.type !== 'select') continue;
                    const options = Array.isArray(champ.options) ? champ.options : [];
                    // Options dynamiques (`optionsFrom`) : injectées au rendu, rien à vérifier ici.
                    if (!options.length) continue;

                    menusVerifies++;
                    const valeur = item[nomChamp];
                    const correspond = options.some(o => String(o.value) === String(valeur));
                    // Un menu FACULTATIF peut légitimement naître vide ; un menu OBLIGATOIRE
                    // doit porter la valeur que le navigateur affichera, sinon il bloque
                    // l'enregistrement en paraissant rempli.
                    if (champ.required && !correspond) {
                        fautifs.push(`${cle} / ${path}[].${nomChamp} = ${JSON.stringify(valeur)}`);
                    }
                }
            }
        }

        assert(menusVerifies > 10, `${menusVerifies} menus inspectés dans les items de tableau`);
        assertEqual(fautifs, [], 'Aucun menu obligatoire ne naît sur une valeur absente de ses options');
    }

    // ==================================================================
    // G2 : un conteneur naît avec un titre générique
    // ==================================================================
    group('Conteneurs : titre générique à la création');
    {
        let conteneurs = 0;
        const sansTitre = [];

        for (const { cle, schema } of schemas) {
            for (const { path, config } of champsTableau(schema)) {
                if (!config.autoTitleField) continue;
                conteneurs++;

                // Le titre doit être numéroté selon la position d'insertion.
                const item = createEmptyArrayItem(config, 4);
                const chemin = config.autoTitleField.split('.');
                let valeur = item;
                for (const seg of chemin) valeur = valeur == null ? undefined : valeur[seg];

                if (!String(valeur ?? '').trim()) {
                    sansTitre.push(`${cle} / ${path}`);
                } else {
                    assert(String(valeur).includes('5'),
                        `${cle} / ${path} : le titre générique est numéroté (« ${valeur} »)`);
                    assert(!estCleI18nBrute(String(valeur)),
                        `${cle} / ${path} : le titre générique est traduit, pas une clé i18n`);
                }
            }
        }

        assert(conteneurs >= 4, `${conteneurs} tableaux conteneurs déclarent autoTitleField`);
        assertEqual(sansTitre, [], 'Tout conteneur déclaré naît avec un titre non vide');
    }

    // ==================================================================
    // G3 : après ajout d'un item, ce qui bloque reste LOCALISABLE
    // ==================================================================
    group('Erreurs localisables après ajout d\'un item');
    {
        let cas = 0;
        const illisibles = [];
        const conteneursBloques = [];

        for (const { cle, schema } of schemas) {
            // Sections de premier niveau uniquement : c'est le bouton « Ajouter » du sommaire.
            for (const section of schema.sections || []) {
                for (const [nomChamp, config] of Object.entries(section.fields || {})) {
                    if (!config || config.type !== 'array' || !config.itemSchema) continue;

                    // Document minimal : le tableau visé, plus un item neuf ajouté au bout.
                    const items = [];
                    const mini = Math.max(config.minItems || 0, 1);
                    for (let i = 0; i < mini; i++) items.push(createEmptyArrayItem(config, i));
                    items.push(createEmptyArrayItem(config, items.length));

                    let donnees = { [nomChamp]: items };
                    try { donnees = healStructureForActivity(donnees, cle); }
                    catch { /* le healer n'a pas de règle pour cette clé : on valide tel quel */ }

                    const erreurs = getValidationErrors(donnees, schema);
                    cas++;

                    for (const e of erreurs) {
                        // Une erreur sans libellé, ou dont le libellé est resté une clé i18n,
                        // ne permet pas de retrouver le champ dans un éditeur maître-détail.
                        if (!e.field || estCleI18nBrute(e.field)) {
                            illisibles.push(`${cle} / ${e.path} → « ${e.field} »`);
                        }
                    }

                    // Un conteneur (autoTitleField) doit être enregistrable dès l'ajout : c'est
                    // tout l'objet du titre générique.
                    //
                    // « Enregistrable » porte sur l'ÉCHAFAUDAGE de l'item — titre, type, menus :
                    // ce que l'enseignant ne remplit pas lui-même et ne perçoit donc pas comme un
                    // manque. Le CONTENU pédagogique qu'il vient d'ouvrir (l'énoncé d'une
                    // sous-question, dans le conteneur dynamique « params ») peut, lui,
                    // légitimement rester à écrire : ce champ est le premier du formulaire
                    // affiché, et l'erreur le nomme (cf. l'assertion « libellé traduit et situé »
                    // ci-dessus). Même contrat que pour une carte de Flashcards ou un mot croisé.
                    if (config.autoTitleField) {
                        const prefixe = `${nomChamp}.${items.length - 1}.`;
                        const surLItem = erreurs.filter(e => {
                            const chemin = String(e.path);
                            if (!chemin.startsWith(prefixe)) return false;
                            const premierChamp = chemin.slice(prefixe.length).split('.')[0];
                            const sousConfig = config.itemSchema[premierChamp];
                            return !(sousConfig && sousConfig.type === 'dynamicObject');
                        });
                        if (surLItem.length) {
                            conteneursBloques.push(`${cle} / ${nomChamp} → ${surLItem.map(e => e.path).join(', ')}`);
                        }
                    }
                }
            }
        }

        assert(cas > 15, `${cas} sections de tableau traversées`);
        assertEqual(illisibles, [], 'Toute erreur de validation porte un libellé traduit et situé');
        assertEqual(conteneursBloques, [], 'Ajouter un chapitre / une diapositive / une sous-question ne bloque plus l\'enregistrement');
    }

    // ==================================================================
    // G3 bis : le fil d'Ariane nomme bien l'item fautif
    // ==================================================================
    group('Fil d\'Ariane des erreurs imbriquées');
    {
        const schema = getSchemaForType('InteractiveBook');
        const donnees = {
            title: 'Livre',
            chapters: [
                { title: 'Chapitre A', content: [{ _blockType: 'text', text: 'ok' }] },
                { title: 'Chapitre B', content: [
                    { _blockType: 'text', text: 'ok' },
                    { _blockType: '', text: '' }          // bloc sans type : irréparable
                ] }
            ]
        };
        const erreurs = getValidationErrors(donnees, schema);
        const cible = erreurs.find(e => e.path === 'chapters.1.content.1._blockType');

        assert(!!cible, 'Le bloc sans type est signalé');
        if (cible) {
            const attenduChapitre = `${t('editor_ib_chapter')} 2`;
            const attenduBloc = `${t('editor_ib_block')} 2`;
            assert(cible.field.includes(attenduChapitre),
                `Le libellé nomme le chapitre (« ${cible.field} » contient « ${attenduChapitre} »)`);
            assert(cible.field.includes(attenduBloc),
                `Le libellé nomme le bloc (« ${cible.field} » contient « ${attenduBloc} »)`);
            assert(!estCleI18nBrute(cible.field), 'Le libellé est traduit, pas une clé i18n');
        }
    }

    // ==================================================================
    // G4 : cycle réel dans le DOM (Livre interactif)
    // ==================================================================
    group('Cycle réel (DOM) : Livre interactif');
    {
        const livre = await fetch(`${BASE}assets/data/examples/interactive_book_1.json`).then(r => r.json());
        const conteneur = document.createElement('div');
        conteneur.style.position = 'absolute';
        conteneur.style.left = '-10000px';
        document.body.appendChild(conteneur);

        const notif = { titleKey: 'h5p_interactive_book_name', type: 'h5p', id: 'test-lifecycle' };
        const ouvrir = async () => {
            destroyEditor();
            conteneur.innerHTML = '';
            const ok = await initJsonEditor(notif, conteneur, JSON.parse(JSON.stringify(livre)));
            await flush();
            return ok;
        };
        const allerAuChapitre = async (i) => {
            conteneur.querySelector('[data-section-id="chapters"] .json-editor__nav-item').click();
            await wait(20);
            conteneur.querySelector(`.json-editor__nav-subitem[data-index="${i}"]`).click();
            await wait(50);
        };
        const boutonAjouterBloc = () =>
            [...conteneur.querySelectorAll('button')].filter(b => b.textContent.includes(t('editor_ib_add_block'))).at(-1);

        try {
            // ---- 4.1 : ouverture puis enregistrement sans modification
            assert(await ouvrir(), 'L\'éditeur s\'ouvre sur le Livre interactif');
            assert(!!(await saveChanges()), 'Enregistrement possible sans modification');

            // ---- 4.2 : ajouter un bloc SANS toucher au menu de type
            // (le menu affiche déjà « Texte » : l'enseignant saisit son texte et enregistre)
            await ouvrir();
            await allerAuChapitre(0);
            const blocsAvant = getEditorData().chapters[0].content.length;
            const btnAjout = boutonAjouterBloc();
            assert(!!btnAjout, 'Le bouton « Ajouter un bloc » est présent');
            btnAjout.click();
            await wait(80);

            const donneesAjout = getEditorData();
            assertEqual(donneesAjout.chapters[0].content.length, blocsAvant + 1, 'Le bloc est ajouté');
            const typeNeuf = donneesAjout.chapters[0].content[blocsAvant]._blockType;
            assertEqual(typeNeuf, 'text', 'Le bloc neuf porte le type que son menu affiche (« text »)');
            assert(!!(await saveChanges()),
                'Enregistrement possible après ajout d\'un bloc laissé sur le type affiché');

            // ---- 4.3 : ajouter un chapitre
            await ouvrir();
            conteneur.querySelector('[data-section-id="chapters"] .json-editor__nav-item').click();
            await wait(20);
            const chapAvant = getEditorData().chapters.length;
            conteneur.querySelector('.json-editor__nav-add-btn').click();
            await wait(80);
            const apresChap = getEditorData();
            assertEqual(apresChap.chapters.length, chapAvant + 1, 'Le chapitre est ajouté');
            assert(String(apresChap.chapters[chapAvant].title || '').trim().length > 0,
                `Le chapitre neuf reçoit un titre générique (« ${apresChap.chapters[chapAvant].title} »)`);
            assert(!!(await saveChanges()), 'Enregistrement possible après ajout d\'un chapitre');

            // ---- 4.4 : supprimer un bloc imbriqué → aucun item fantôme
            // BUG HISTORIQUE : les gestionnaires de tableau enregistrés sur les indices
            // disparus ressuscitaient le bloc supprimé via setNestedValue.
            await ouvrir();
            await allerAuChapitre(0);
            const avantSuppr = getEditorData().chapters[0].content.length;
            const item = boutonAjouterBloc().parentElement.querySelector(':scope > .json-editor__array-item[data-index="1"] [data-action="delete"]');
            assert(!!item, 'Le bouton de suppression du bloc 2 est présent');
            item.click();
            await wait(30);
            const confirmer = document.querySelector('.json-editor__modal-overlay .json-editor__modal-btn--danger');
            assert(!!confirmer, 'La confirmation de suppression s\'affiche');
            confirmer.click();
            await wait(80);

            const apresSuppr = getEditorData();
            assertEqual(apresSuppr.chapters[0].content.length, avantSuppr - 1,
                'Un seul bloc a disparu — aucun item fantôme recréé');
            assert(apresSuppr.chapters[0].content.every(b => b && typeof b === 'object' && b._blockType),
                'Tous les blocs restants sont complets (pas d\'objet partiel ressuscité)');
            assert(!!(await saveChanges()), 'Enregistrement possible après suppression d\'un bloc');
        } finally {
            destroyEditor();
            conteneur.remove();
            document.querySelectorAll('.json-editor__modal-overlay').forEach(m => m.remove());
        }
    }

    // ==================================================================
    // G5 : seconde couche — un menu rendu sur une valeur vide réaligne le modèle
    // ==================================================================
    // `createEmptyArrayItem` protège les items NEUFS ; ce filet-ci protège le contenu
    // DÉJÀ LÀ (sortie LLM, .h5p relu, contenu créé avant le correctif) dont un menu
    // obligatoire serait vide. Le navigateur affiche de toute façon la première option :
    // le modèle doit s'y aligner, sinon l'enregistrement rebloque sur un menu qui paraît
    // rempli. Testé sur le renderer, seul endroit où cette couche intervient.
    group('Menu rendu sur une valeur vide : le modèle suit l\'affichage');
    {
        const options = [{ value: 'text', label: 'editor_ib_block_text' },
                         { value: 'table', label: 'editor_ib_block_table' }];

        const rendu = (config, valeur) => {
            const vus = [];
            const el = renderSelectField(config, valeur, (p, v) => vus.push([p, v]), 'champ');
            return { affiche: el.querySelector('select').value, propage: vus };
        };

        const obligatoire = rendu({ type: 'select', label: 'l', required: true, options }, '');
        assertEqual(obligatoire.affiche, 'text', 'Menu obligatoire vide : le navigateur affiche la 1re option');
        assertEqual(obligatoire.propage, [['champ', 'text']], 'Menu obligatoire vide : le modèle est réaligné sur ce qui est affiché');

        const avecDefaut = rendu({ type: 'select', label: 'l', required: true, default: 'table', options }, '');
        assertEqual(avecDefaut.affiche, 'table', 'Un `default` déclaré l\'emporte sur la 1re option');

        // Une valeur NON vide inconnue du menu est du contenu utilisateur : jamais écrasée.
        const inconnue = rendu({ type: 'select', label: 'l', required: true, options }, 'legacy');
        assertEqual(inconnue.propage, [], 'Une valeur non vide inconnue du menu n\'est pas écrasée');

        // Un menu FACULTATIF ne doit pas écrire pendant le rendu : cela lèverait à tort
        // l'indicateur « modifications non enregistrées » à la simple navigation.
        const facultatif = rendu({ type: 'select', label: 'l', options }, '');
        assertEqual(facultatif.propage, [], 'Un menu facultatif n\'écrit pas dans le modèle au rendu');
    }

    return { passCount, failCount, results };
}
