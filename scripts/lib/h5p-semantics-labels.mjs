/**
 * Extraction des libellés officiels H5P depuis les librairies vendorées.
 *
 * Une librairie H5P décrit ses champs dans `semantics.json` (défauts ANGLAIS) et
 * ses traductions dans `language/<code>.json`, un arbre POSITIONNEL qui calque
 * exactement la structure de la semantics (même ordre, mêmes profondeurs) mais ne
 * porte que les chaînes traduisibles (`label`, `description`, `default`, `options`).
 *
 * Ce module aplatit les deux arbres en chemins `/groupe/champ` pour permettre de
 * récupérer le défaut traduit d'un champ précis. Il sert :
 *   - aux scripts de pré-remplissage des locales Caramel ;
 *   - au garde-fou `tests/run_h5p_ui_coverage.mjs` (champs `common: true`).
 *
 * @module scripts/lib/h5p-semantics-labels
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const VENDOR_H5P = path.join(ROOT, 'js/vendor/h5p-libs');

/**
 * Correspondance locale Caramel → codes de fichier `language/*.json` H5P,
 * par ordre de préférence. Le premier fichier présent gagne.
 *
 * `en` n'y figure pas : l'anglais est porté par les `default` de la semantics
 * elle-même, il n'existe pas de `language/en.json`.
 */
export const CARAMEL_TO_H5P_LANGUAGE_FILES = {
    fr: ['fr'],
    es: ['es', 'es-mx'],
    de: ['de'],
    it: ['it'],
    nl: ['nl'],
    pt: ['pt', 'pt-br'],
    ar: ['ar'],
    zh: ['zh-hans', 'zh-cn', 'zh-tw', 'zh-hant'],
    jp: ['ja'],
    el: ['el']
};

/**
 * Aplatit une semantics H5P en `chemin → descripteur de champ`.
 * @param {Array} fields - Tableau de champs semantics.
 * @returns {Map<string, {field: Object, common: boolean}>}
 */
export function flattenSemantics(fields) {
    const out = new Map();
    const walk = (list, prefix, inheritedCommon) => {
        (list || []).forEach((f) => {
            if (!f || typeof f !== 'object') return;
            const common = inheritedCommon || f.common === true;
            const p = `${prefix}/${f.name}`;
            out.set(p, { field: f, common });
            if (f.type === 'group') walk(f.fields, p, common);
            if (f.type === 'list' && f.field && f.field.type === 'group') {
                walk(f.field.fields, `${p}[]`, common);
            }
        });
    };
    walk(fields, '', false);
    return out;
}

/**
 * Aplatit un `language/<code>.json` en suivant la structure de la semantics.
 * Les deux arbres sont parcourus EN PARALLÈLE : le fichier de langue n'ayant pas
 * de `name`, seule la position dans le tableau permet de rattacher une traduction
 * à un champ.
 * @param {Array} semFields - Champs semantics (porteurs des noms).
 * @param {Array} langFields - Champs traduits (porteurs des valeurs).
 * @returns {Map<string, string>} chemin → `default` traduit
 */
export function flattenLanguageDefaults(semFields, langFields) {
    const out = new Map();
    const walk = (sem, lang, prefix) => {
        (sem || []).forEach((f, i) => {
            if (!f || typeof f !== 'object') return;
            const t = Array.isArray(lang) && lang[i] && typeof lang[i] === 'object' ? lang[i] : {};
            const p = `${prefix}/${f.name}`;
            if (typeof t.default === 'string') out.set(p, t.default);
            if (f.type === 'group') walk(f.fields, t.fields, p);
            if (f.type === 'list' && f.field && f.field.type === 'group') {
                walk(f.field.fields, (t.field && t.field.fields) || [], `${p}[]`);
            }
        });
    };
    walk(semFields, langFields, '');
    return out;
}

/**
 * Charge une librairie vendorée et expose ses défauts anglais + traduits.
 * @param {string} libDir - Dossier de la lib (ex: 'H5P.Crossword-0.5').
 * @returns {{semantics: Array, english: Map<string,string>, common: Map<string,boolean>,
 *            defaultsFor: (caramelLang: string) => Map<string,string>,
 *            languageFileFor: (caramelLang: string) => string|null}}
 */
export function loadLibrary(libDir) {
    const semPath = path.join(VENDOR_H5P, libDir, 'semantics.json');
    if (!fs.existsSync(semPath)) throw new Error(`semantics.json introuvable pour ${libDir}`);
    const semantics = JSON.parse(fs.readFileSync(semPath, 'utf8'));

    const flat = flattenSemantics(semantics);
    const english = new Map();
    const common = new Map();
    for (const [p, { field, common: isCommon }] of flat) {
        if (typeof field.default === 'string') english.set(p, field.default);
        common.set(p, isCommon);
    }

    const languageFileFor = (caramelLang) => {
        if (caramelLang === 'en') return null; // porté par la semantics
        for (const code of (CARAMEL_TO_H5P_LANGUAGE_FILES[caramelLang] || [caramelLang])) {
            const p = path.join(VENDOR_H5P, libDir, 'language', `${code}.json`);
            if (fs.existsSync(p)) return p;
        }
        return null;
    };

    const cache = new Map();
    const defaultsFor = (caramelLang) => {
        if (cache.has(caramelLang)) return cache.get(caramelLang);
        const file = languageFileFor(caramelLang);
        // Repli ANGLAIS : langue non fournie par la lib → défauts de la semantics.
        let map = english;
        if (file) {
            const langTree = JSON.parse(fs.readFileSync(file, 'utf8')).semantics;
            const translated = flattenLanguageDefaults(semantics, langTree);
            map = new Map(english); // base anglaise, écrasée champ par champ
            for (const [k, v] of translated) if (v) map.set(k, v);
        }
        cache.set(caramelLang, map);
        return map;
    };

    return { semantics, english, common, defaultsFor, languageFileFor };
}

/** Liste des locales d'interface Caramel, dans l'ordre des fichiers. */
export function caramelLocales() {
    return fs.readdirSync(path.join(ROOT, 'js/locales'))
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''))
        .sort();
}

export { ROOT };
