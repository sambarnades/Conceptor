/**
 * Tests unitaires : Mutations sur les arrays primaires de l'editeur
 *
 * Verifie que ajout / suppression / duplication / deplacement d'un item
 * dans la nav primaire (ex: cards de Flashcards, questions de QCM, etc.)
 * ne corrompt pas les items voisins ni le suivi de selection.
 *
 * Bug historique corrige : navigateTo() rappelait collectCurrentViewData()
 * apres une mutation structurelle. Le DOM contenait encore les inputs avec
 * les data-path des anciens index, donc collectInputValues ecrasait l'item
 * voisin avec les valeurs de l'item supprime/deplace.
 *
 * Ces tests utilisent les exports `__testing` de editor-core.js pour
 * declencher les mutations sans passer par les modales et le drag&drop.
 *
 * Usage : ouvrir tests/test-editor-mutations.html depuis le serveur local.
 */

import { renderEditor, getEditorData, destroyEditorCore, __testing } from '../js/editor/editor-core.js';
import { getSchemaForType } from '../js/editor/content-detector.js';

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

// =======================================================================
// HELPERS
// =======================================================================

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Auto-confirme la prochaine modale de confirmation (showConfirm avec isDanger=true).
 * Utilise un MutationObserver pour cliquer le bouton --danger des qu'il apparait.
 * Retourne une fonction de cleanup au cas ou la modale n'apparait pas.
 */
function autoConfirmDanger() {
    const observer = new MutationObserver(() => {
        const btn = document.querySelector('.json-editor__modal-btn--danger');
        if (btn) {
            observer.disconnect();
            btn.click();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
}

/**
 * Monte l'editeur Flashcards avec un jeu de donnees connu.
 * 5 cartes, chacune avec un texte distinct ("CARD-1", ..., "CARD-5") pour
 * pouvoir tracer ou chaque carte se retrouve apres mutation.
 */
function mountFlashcardsEditor(container) {
    const data = {
        title: 'Test Flashcards',
        description: 'Jeu de test',
        cards: [
            { text: 'CARD-1-front', answer: 'CARD-1-back', tip: 'CARD-1-tip' },
            { text: 'CARD-2-front', answer: 'CARD-2-back', tip: 'CARD-2-tip' },
            { text: 'CARD-3-front', answer: 'CARD-3-back', tip: 'CARD-3-tip' },
            { text: 'CARD-4-front', answer: 'CARD-4-back', tip: 'CARD-4-tip' },
            { text: 'CARD-5-front', answer: 'CARD-5-back', tip: 'CARD-5-tip' }
        ]
    };
    const schema = getSchemaForType('Flashcards');
    renderEditor(container, deepClone(data), schema, {
        moduleKey: 'Flashcards',
        moduleName: 'Flashcards',
        onChange: () => {},
        onSave: () => {},
        onCancel: () => {}
    });
    // Section primaire = "cards" (la 1re section "general" n'a pas de tableau)
    const section = schema.sections.find(s => s.id === 'cards');
    const arrayField = __testing.findPrimaryArrayField(section);
    return { schema, section, arrayField, originalData: data };
}

/** Attend N microtasks pour laisser tomber les promises pendantes */
function flush() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

// =======================================================================
// TESTS
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    // Container partage pour les tests
    const container = document.createElement('div');
    container.id = 'test-editor-container';
    document.body.appendChild(container);

    try {
        // ==================================================================
        // GROUPE 1 : Suppression
        // ==================================================================
        group('handleArrayRemove');

        // ---- Test 1.1 : suppression de l'item courant ne corrompt pas le suivant
        {
            const { section, arrayField } = mountFlashcardsEditor(container);

            // On affiche la carte d'index 1 (CARD-2)
            __testing.navigateTo(section.id, 1);

            // Sanity : le DOM contient bien des inputs pointant sur cards.1.*
            const card1Inputs = container.querySelectorAll('[data-path^="cards.1."]');
            assert(card1Inputs.length > 0, 'Le DOM contient des inputs data-path="cards.1.*" apres navigation');

            // Suppression de l'item affiche (index 1)
            autoConfirmDanger();
            await __testing.handleArrayRemove(section.id, arrayField, 1);
            await flush();

            const data = getEditorData();
            assertEqual(data.cards.length, 4, 'cards.length passe de 5 a 4');
            assertEqual(data.cards[0].text, 'CARD-1-front', 'cards[0] inchange (CARD-1)');
            // BUG HISTORIQUE : sans le fix, cards[1] etait ecrase par les valeurs de CARD-2
            assertEqual(data.cards[1].text, 'CARD-3-front', 'cards[1] est bien CARD-3 (l\'ex-CARD-3, pas corrompu)');
            assertEqual(data.cards[1].answer, 'CARD-3-back', 'cards[1].answer est bien CARD-3-back');
            assertEqual(data.cards[1].tip, 'CARD-3-tip', 'cards[1].tip est bien CARD-3-tip');
            assertEqual(data.cards[2].text, 'CARD-4-front', 'cards[2] est bien CARD-4');
            assertEqual(data.cards[3].text, 'CARD-5-front', 'cards[3] est bien CARD-5');

            // La selection doit suivre l'index courant (clamp)
            assertEqual(__testing.getNavState().itemIndex, 1, 'navState.itemIndex reste a 1 (l\'ex-CARD-3)');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ---- Test 1.2 : suppression du dernier item → selection clampee
        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 4); // dernier (CARD-5)

            autoConfirmDanger();
            await __testing.handleArrayRemove(section.id, arrayField, 4);
            await flush();

            const data = getEditorData();
            assertEqual(data.cards.length, 4, 'cards.length passe de 5 a 4');
            assertEqual(data.cards[3].text, 'CARD-4-front', 'cards[3] est bien CARD-4 (intact)');
            assertEqual(__testing.getNavState().itemIndex, 3, 'selection clampee au nouveau dernier index');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ---- Test 1.3 : suppression d'un item AVANT l'item courant ne corrompt pas l'affiche
        // Note : dans l'UI actuelle, le bouton delete est dans le header de l'item affiche,
        // donc on supprime toujours l'item courant. Mais la fonction supporte n'importe
        // quel index, donc on teste ce cas pour la robustesse.
        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 2); // affiche CARD-3

            autoConfirmDanger();
            await __testing.handleArrayRemove(section.id, arrayField, 0); // supprime CARD-1
            await flush();

            const data = getEditorData();
            assertEqual(data.cards.length, 4, 'cards.length passe de 5 a 4');
            assertEqual(data.cards[0].text, 'CARD-2-front', 'cards[0] est ex-CARD-2');
            assertEqual(data.cards[1].text, 'CARD-3-front', 'cards[1] est ex-CARD-3 (intact, pas ecrase)');
            assertEqual(data.cards[2].text, 'CARD-4-front', 'cards[2] est ex-CARD-4');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ==================================================================
        // GROUPE 2 : Ajout
        // ==================================================================
        group('handleArrayAdd');

        // ---- Test 2.1 : ajout cree un item vide a la fin et navigue dessus
        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 1);

            __testing.handleArrayAdd(section.id, arrayField);
            await flush();

            const data = getEditorData();
            assertEqual(data.cards.length, 6, 'cards.length passe de 5 a 6');
            assertEqual(data.cards[0].text, 'CARD-1-front', 'cards[0] inchange');
            assertEqual(data.cards[4].text, 'CARD-5-front', 'cards[4] est bien CARD-5 (pas decale)');
            assertEqual(data.cards[5].text, '', 'cards[5] est un item vide');
            assertEqual(__testing.getNavState().itemIndex, 5, 'navState pointe sur le nouvel item');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ==================================================================
        // GROUPE 3 : Duplication
        // ==================================================================
        group('handleArrayDuplicate');

        // ---- Test 3.1 : duplication insere apres l'item et le contenu original est preserve
        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 1); // affiche CARD-2

            await __testing.handleArrayDuplicate(section.id, arrayField, 1);
            await flush();

            const data = getEditorData();
            assertEqual(data.cards.length, 6, 'cards.length passe de 5 a 6');
            assertEqual(data.cards[0].text, 'CARD-1-front', 'cards[0] inchange');
            assertEqual(data.cards[1].text, 'CARD-2-front', 'cards[1] inchange (original CARD-2)');
            assertEqual(data.cards[2].text, 'CARD-2-front', 'cards[2] est la copie de CARD-2');
            assertEqual(data.cards[3].text, 'CARD-3-front', 'cards[3] est bien CARD-3 (decale, pas corrompu)');
            assertEqual(data.cards[4].text, 'CARD-4-front', 'cards[4] est bien CARD-4');
            assertEqual(data.cards[5].text, 'CARD-5-front', 'cards[5] est bien CARD-5');
            assertEqual(__testing.getNavState().itemIndex, 2, 'navState pointe sur la copie');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ==================================================================
        // GROUPE 4 : Deplacement
        // ==================================================================
        group('handleArrayMove');

        // ---- Test 4.1 : deplacer l'item affiche → la selection le suit
        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 1); // affiche CARD-2

            __testing.handleArrayMove(section.id, arrayField.path, 1, 3);
            await flush();

            const data = getEditorData();
            assertEqual(data.cards.length, 5, 'cards.length inchange');
            assertEqual(data.cards[0].text, 'CARD-1-front', 'cards[0] = CARD-1');
            assertEqual(data.cards[1].text, 'CARD-3-front', 'cards[1] = ex-CARD-3 (decale)');
            assertEqual(data.cards[2].text, 'CARD-4-front', 'cards[2] = ex-CARD-4 (decale)');
            assertEqual(data.cards[3].text, 'CARD-2-front', 'cards[3] = CARD-2 (deplace)');
            assertEqual(data.cards[4].text, 'CARD-5-front', 'cards[4] = CARD-5');
            assertEqual(__testing.getNavState().itemIndex, 3, 'navState suit l\'item deplace');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ---- Test 4.2 : deplacer un AUTRE item, l'affiche glisse mais reste suivi par identite
        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 2); // affiche CARD-3

            // Deplace CARD-1 vers la position 4 → CARD-3 glisse de 2 a 1
            __testing.handleArrayMove(section.id, arrayField.path, 0, 4);
            await flush();

            const data = getEditorData();
            assertEqual(data.cards[0].text, 'CARD-2-front', 'cards[0] = ex-CARD-2');
            assertEqual(data.cards[1].text, 'CARD-3-front', 'cards[1] = ex-CARD-3 (intact, pas ecrase par stale paths)');
            assertEqual(data.cards[2].text, 'CARD-4-front', 'cards[2] = ex-CARD-4');
            assertEqual(data.cards[3].text, 'CARD-5-front', 'cards[3] = ex-CARD-5');
            assertEqual(data.cards[4].text, 'CARD-1-front', 'cards[4] = CARD-1 (deplace)');
            // BUG HISTORIQUE : sans le fix d'identite, navState restait a 2 (= ex-CARD-4)
            assertEqual(__testing.getNavState().itemIndex, 1, 'navState suit CARD-3 par identite (de 2 a 1)');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ---- Test 4.3 : deplacement vers le debut, item courant non concerne
        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 1); // affiche CARD-2

            __testing.handleArrayMove(section.id, arrayField.path, 4, 0); // CARD-5 → debut
            await flush();

            const data = getEditorData();
            assertEqual(data.cards[0].text, 'CARD-5-front', 'cards[0] = CARD-5 (deplace)');
            assertEqual(data.cards[1].text, 'CARD-1-front', 'cards[1] = ex-CARD-1');
            assertEqual(data.cards[2].text, 'CARD-2-front', 'cards[2] = ex-CARD-2 (intact, decale de 1 a 2)');
            assertEqual(data.cards[3].text, 'CARD-3-front', 'cards[3] = ex-CARD-3');
            assertEqual(data.cards[4].text, 'CARD-4-front', 'cards[4] = ex-CARD-4');
            assertEqual(__testing.getNavState().itemIndex, 2, 'navState suit CARD-2 par identite (de 1 a 2)');

            destroyEditorCore();
            container.innerHTML = '';
        }

        // ==================================================================
        // GROUPE 5 : Sequence combinee (ajouter, supprimer, deplacer)
        // ==================================================================
        group('Sequence combinee');

        {
            const { section, arrayField } = mountFlashcardsEditor(container);
            __testing.navigateTo(section.id, 0);

            // 1) Ajouter une carte
            __testing.handleArrayAdd(section.id, arrayField);
            await flush();
            assertEqual(getEditorData().cards.length, 6, 'apres add: 6 cartes');

            // 2) Naviguer sur CARD-3 et la supprimer
            __testing.navigateTo(section.id, 2);
            autoConfirmDanger();
            await __testing.handleArrayRemove(section.id, arrayField, 2);
            await flush();

            let data = getEditorData();
            assertEqual(data.cards.length, 5, 'apres remove: 5 cartes');
            assertEqual(data.cards[2].text, 'CARD-4-front', 'apres remove: cards[2] = ex-CARD-4 (intact)');

            // 3) Deplacer CARD-5 (maintenant en index 3) vers le debut
            __testing.handleArrayMove(section.id, arrayField.path, 3, 0);
            await flush();

            data = getEditorData();
            assertEqual(data.cards[0].text, 'CARD-5-front', 'apres move: cards[0] = CARD-5');
            assertEqual(data.cards[1].text, 'CARD-1-front', 'apres move: cards[1] = CARD-1');
            assertEqual(data.cards[2].text, 'CARD-2-front', 'apres move: cards[2] = CARD-2');
            assertEqual(data.cards[3].text, 'CARD-4-front', 'apres move: cards[3] = ex-CARD-4 (intact)');

            destroyEditorCore();
            container.innerHTML = '';
        }

    } finally {
        if (container.parentNode) container.parentNode.removeChild(container);
        // Nettoyer toute modale eventuellement laissee ouverte
        document.querySelectorAll('.json-editor__modal-overlay').forEach(el => el.remove());
    }

    return { passCount, failCount, results };
}
