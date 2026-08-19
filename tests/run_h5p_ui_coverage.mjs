#!/usr/bin/env node
/**
 * Garde-fou : couverture des libellés d'interface H5P dans les .h5p exportés.
 *
 * POURQUOI — un `.h5p` produit par Caramel n'embarque PAS les librairies : il ne
 * contient que `content.json` + `h5p.json`. Les fichiers `language/*.json` des
 * libs ne servent qu'à l'ÉDITEUR de la plateforme, jamais au lecteur. Donc, sur
 * Éléa, la seule chose qui soit traduite est ce que le processeur écrit lui-même
 * dans `content.json`. Tout champ traduisible oublié retombe sur le défaut
 * ANGLAIS de la plateforme, et tout champ écrit en dur fige une seule langue.
 *
 * CE QUI EST VÉRIFIÉ
 *  1. chaque champ `common: true` de la semantics de la lib principale est écrit
 *     par le processeur ;
 *  2. il est écrit via `translations.<clé>` et non en dur (sinon une seule langue
 *     sort, quelle que soit l'interface) ;
 *  3. chaque clé `translations.h5p_*` employée par un processeur existe dans les
 *     11 locales (sinon l'idiome `translations.x || 'repli français'` renvoie
 *     silencieusement le repli FRANÇAIS à un utilisateur grec ou arabophone).
 *
 * Usage : node tests/run_h5p_ui_coverage.mjs [--verbose]
 * Sortie : code 0 si tout est couvert, 1 sinon.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLibrary, caramelLocales, VENDOR_H5P } from '../scripts/lib/h5p-semantics-labels.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROC_DIR = path.join(ROOT, 'js/h5p/processors');
const VERBOSE = process.argv.includes('--verbose');

/**
 * Champs `common` qu'un processeur n'a légitimement pas à écrire, avec la raison.
 * Toute entrée ajoutée ici doit être JUSTIFIÉE : c'est la seule échappatoire du
 * garde-fou. `'*'` couvre tous les champs de la lib.
 */
const EXCLUSIONS = {
    // (vide) — toute exclusion ajoutée ici doit être justifiée en commentaire.
};

const locales = caramelLocales();
const localeData = Object.fromEntries(
    locales.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, 'js/locales', `${l}.json`), 'utf8'))])
);

// --- Métadonnées des processeurs (machineName + version) ---------------------
const idx = await import(path.join(PROC_DIR, 'index.js'));

const metaSrc = fs.readFileSync(path.join(PROC_DIR, 'index.js'), 'utf8');
const metaBlock = metaSrc.slice(
    metaSrc.indexOf('const processorMetadata'),
    metaSrc.indexOf('const processorLoaders')
);
const modules = [...metaBlock.matchAll(
    /'([A-Za-z]+)':\s*\{\s*machineName:\s*'([^']+)',(?:\s*\/\/[^\n]*\n)*\s*version:\s*\{\s*major:\s*(\d+),\s*minor:\s*(\d+)/g
)].map((m) => ({ key: m[1], machineName: m[2], major: +m[3], minor: +m[4] }));

if (modules.length === 0) {
    console.error('Aucun module détecté dans processorMetadata — le format a changé ?');
    process.exit(1);
}

// --- Source « effective » d'un processeur ------------------------------------
// Certains libellés sont écrits par des helpers partagés du même dossier ; on les
// concatène pour éviter les faux positifs.
const SHARED_HELPERS = ['hotspot-question-utils.js'];
const sharedSource = SHARED_HELPERS
    .map((f) => fs.readFileSync(path.join(PROC_DIR, f), 'utf8'))
    .join('\n');

function processorSource(key) {
    const f = path.join(PROC_DIR, `${key}.js`);
    return (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '') + '\n' + sharedSource;
}

/**
 * Analyse une source de processeur pour savoir comment chaque champ est écrit.
 * @returns {{translated: Set<string>, hardcoded: Set<string>, keys: Set<string>}}
 */
function analyseSource(rawSrc) {
    const translated = new Set();
    const hardcoded = new Set();
    const keys = new Set();

    // L'idiome `champ: translations.cle\n    || 'repli'` est courant sur les longs
    // libellés : on recolle les continuations `||` pour que l'affectation tienne
    // sur une seule ligne logique, sinon le repli passerait pour un littéral nu.
    const src = rawSrc
        .replace(/\|\|\s*\n\s*/g, '|| ')
        .replace(/\n\s*\|\|\s*/g, ' || ');

    // Variables locales adossées à une traduction : `const nextLabel = translations.x || '…'`
    // est ensuite réutilisé tel quel (`nextButton: nextLabel`), notamment quand un
    // même libellé alimente plusieurs champs d'une lib.
    const varsTraduites = new Set();
    for (const m of src.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*[^;\n]*translations\.(\w+)/g)) {
        varsTraduites.add(m[1]);
        keys.add(m[2]);
    }

    // `champ: <…> translations.CLE <…>` sur une même ligne logique
    for (const m of src.matchAll(/(\w+)\s*:\s*([^,\n]*translations\.(\w+)[^,\n]*)/g)) {
        translated.add(m[1]);
        keys.add(m[3]);
    }
    // `champ: variableTraduite`
    for (const m of src.matchAll(/(\w+)\s*:\s*(\w+)\s*(?=[,\n}])/g)) {
        if (varsTraduites.has(m[2])) translated.add(m[1]);
    }
    // `champ: 'littéral'` ou `champ: "littéral"` SANS translations
    for (const m of src.matchAll(/(\w+)\s*:\s*(['"])(?:(?!\2)[^\\]|\\.)*\2\s*(?=[,\n}])/g)) {
        if (!translated.has(m[1])) hardcoded.add(m[1]);
    }
    // toutes les clés employées, y compris hors affectation de champ
    for (const m of src.matchAll(/translations\.(\w+)/g)) keys.add(m[1]);

    return { translated, hardcoded, keys };
}

// --- 1 & 2. Couverture champ par champ ---------------------------------------
const problemes = [];
const resume = [];
const toutesLesCles = new Set();

for (const mod of modules.sort((a, b) => a.key.localeCompare(b.key))) {
    const dir = `${mod.machineName}-${mod.major}.${mod.minor}`;
    if (!fs.existsSync(path.join(VENDOR_H5P, dir, 'semantics.json'))) {
        problemes.push(`${mod.key} : librairie absente du vendor (${dir}) — impossible de vérifier`);
        continue;
    }

    const L = loadLibrary(dir);
    const champs = [...L.common.entries()]
        .filter(([p, isCommon]) => isCommon && typeof L.english.get(p) === 'string')
        .map(([p]) => p.split('/').pop());
    const attendus = [...new Set(champs)];

    const { translated, hardcoded, keys } = analyseSource(processorSource(mod.key));
    for (const k of keys) toutesLesCles.add(k);

    const exclusion = EXCLUSIONS[mod.key];
    const exclus = (nom) => exclusion && (exclusion.fields.includes('*') || exclusion.fields.includes(nom));

    const manquants = [];
    const enDur = [];
    for (const nom of attendus) {
        if (exclus(nom)) continue;
        if (translated.has(nom)) continue;
        if (hardcoded.has(nom)) enDur.push(nom);
        else manquants.push(nom);
    }

    const couverts = attendus.length - manquants.length - enDur.length;
    resume.push({ key: mod.key, dir, total: attendus.length, couverts, manquants, enDur, exclu: !!exclusion });

    if (manquants.length) {
        problemes.push(`${mod.key} (${dir}) : ${manquants.length} champ(s) traduisible(s) NON écrit(s) → anglais sur Éléa : ${manquants.join(', ')}`);
    }
    if (enDur.length) {
        problemes.push(`${mod.key} (${dir}) : ${enDur.length} champ(s) écrit(s) EN DUR (une seule langue possible) : ${enDur.join(', ')}`);
    }
}

// --- 3. Toutes les clés employées existent dans les 11 locales ---------------
const clesH5P = [...toutesLesCles].filter((k) => k.startsWith('h5p_')).sort();
for (const locale of locales) {
    const absentes = clesH5P.filter((k) => !(k in localeData[locale]));
    if (absentes.length) {
        problemes.push(`locale ${locale} : ${absentes.length} clé(s) employée(s) par un processeur mais absente(s) → repli FRANÇAIS : ${absentes.join(', ')}`);
    }
}

// --- 4. Pas de clé morte déclarée dans le mapping de pré-remplissage --------
// Une clé pré-remplie dans les 11 locales mais qu'aucun processeur n'emploie est
// du bruit : elle laisse croire qu'un champ est traduit alors qu'il ne l'est pas
// (cas vécu : `h5p_crossword_close_window` pendant que le processeur lisait la
// clé générique `h5p_close`).
try {
    const { LABEL_MAP } = await import('../scripts/sync-h5p-ui-labels.mjs');
    const toutesLesSources = fs.readdirSync(PROC_DIR)
        .filter((f) => f.endsWith('.js'))
        .map((f) => fs.readFileSync(path.join(PROC_DIR, f), 'utf8'))
        .join('\n');
    const mortes = Object.keys(LABEL_MAP).filter((k) => !toutesLesSources.includes(k));
    if (mortes.length) {
        problemes.push(`clé(s) déclarée(s) dans LABEL_MAP mais employée(s) par aucun processeur : ${mortes.join(', ')}`);
    }
} catch (err) {
    problemes.push(`impossible de charger LABEL_MAP pour le contrôle des clés mortes : ${err.message}`);
}

// --- Rapport -----------------------------------------------------------------
if (VERBOSE) {
    console.log('module                    lib                                  couverts/total');
    console.log('─'.repeat(88));
    for (const r of resume) {
        const marque = r.exclu ? '·' : (r.manquants.length || r.enDur.length ? '✗' : '✓');
        console.log(`${marque} ${r.key.padEnd(24)} ${r.dir.padEnd(36)} ${String(r.couverts).padStart(3)}/${r.total}`);
    }
    console.log(`\n${clesH5P.length} clés h5p_* employées par les processeurs, vérifiées sur ${locales.length} locales.`);
}

if (problemes.length) {
    console.error(`\n✗ ${problemes.length} problème(s) de couverture des libellés H5P :\n`);
    for (const p of problemes) console.error('  • ' + p);
    console.error('\nRappel : un .h5p n’embarque pas les libs — seul content.json est traduit.');
    console.error('Pour pré-remplir les locales : node scripts/sync-h5p-ui-labels.mjs --write');
    process.exit(1);
}

console.log(`✓ Libellés H5P : ${resume.length} modules couverts, ${clesH5P.length} clés présentes dans les ${locales.length} locales.`);
