/**
 * fixtures-map.mjs — Mapping fixture (assets/data/examples/*.json) → moduleKey Caramel.
 *
 * Il n'existe PAS de manifeste explicite fixture→module dans le code (les exemples
 * sont chargés par convention de nommage côté éditeur). On reconstruit donc le mapping
 * par préfixe snake_case → moduleKey, en s'appuyant sur les clés de definitions.js.
 *
 * Vérifié : les 112 fichiers de assets/data/examples/ correspondent aux préfixes
 * ci-dessous. Les préfixes Moodle (page, livre, devoir, millionnaire, appariement,
 * qcm, test, glossaire_xml, quiz_mixte→QuizSet, quiz_qcm→QuizSetQCM, quiz_vraifaux→QuizSetVF)
 * sont inclus pour la phase Moodle, mais `listH5pFixtures()` ne renvoie QUE les H5P.
 *
 * @module fixtures-map
 */

import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const EXAMPLES_DIR = resolve(__dirname, '../../assets/data/examples');

// La table vit dans `fixtures-prefixes.js` (données pures, sans import Node) afin
// d'être aussi lisible depuis le navigateur par `tests/test-activity-wiring.js`.
// Ré-exportée ici : les appelants Node existants sont inchangés.
// IMPORTER puis exporter, et non `export … from` : la table est utilisée plus bas
// dans ce module (une ré-exportation ne crée aucune liaison locale).
import { PREFIX_TO_MODULE } from './fixtures-prefixes.js';
export { PREFIX_TO_MODULE };

// Trié par longueur de préfixe décroissante pour matcher le plus spécifique d'abord
// (ex: 'quiz_qcm' avant un hypothétique 'quiz').
const SORTED = [...PREFIX_TO_MODULE].sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Résout le moduleKey d'un nom de fichier de fixture.
 * @param {string} filename - ex: 'drag_and_drop_1.json'
 * @returns {{moduleKey: string, kind: string}|null}
 */
export function resolveModuleKey(filename) {
    const base = filename.replace(/\.json$/i, '');
    for (const entry of SORTED) {
        // match exact OU préfixe suivi de _<chiffre/mot> (ex: drag_and_drop_1, quiz_qcm_formules_test)
        if (base === entry.prefix || base.startsWith(entry.prefix + '_')) {
            return { moduleKey: entry.moduleKey, kind: entry.kind };
        }
    }
    return null;
}

/**
 * Liste toutes les fixtures d'un kind donné, avec leur moduleKey résolu.
 * @param {'h5p'|'moodle'|'all'} kind
 * @returns {Promise<Array<{file: string, path: string, moduleKey: string, kind: string}>>}
 */
export async function listFixtures(kind = 'all') {
    const all = (await readdir(EXAMPLES_DIR)).filter(f => f.endsWith('.json')).sort();
    const out = [];
    const unmatched = [];
    for (const file of all) {
        const r = resolveModuleKey(file);
        if (!r) { unmatched.push(file); continue; }
        if (kind !== 'all' && r.kind !== kind) continue;
        out.push({ file, path: resolve(EXAMPLES_DIR, file), moduleKey: r.moduleKey, kind: r.kind });
    }
    if (unmatched.length) {
        console.warn('[fixtures-map] fixtures non mappées (ignorées) :', unmatched.join(', '));
    }
    return out;
}

/** Liste uniquement les fixtures H5P. */
export function listH5pFixtures() {
    return listFixtures('h5p');
}

/** Liste uniquement les fixtures Moodle. */
export function listMoodleFixtures() {
    return listFixtures('moodle');
}
