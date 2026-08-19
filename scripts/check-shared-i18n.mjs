#!/usr/bin/env node
/**
 * scripts/check-shared-i18n.mjs
 *
 * Vérifie que toute clé i18n littérale référencée par l'éditeur et l'export
 * documentaire existe réellement dans les 11 locales de `js/locales/`.
 *
 * POURQUOI. Ces répertoires sont partagés byte-identiquement avec Sucrerie
 * (cf. CLAUDE.md, piège 7), mais les dictionnaires i18n sont propres à chaque
 * hôte. Une clé peut donc exister d'un seul côté sans que rien ne le signale :
 * le fichier .js voyage par `cp`, pas sa traduction. Constaté dans les deux
 * sens (audit 2026-07-29) : `editor_section_dialogs`, `editor_dialog`,
 * `editor_section_choices` et `doc_fmt_livre_title` n'existaient QUE côté
 * Sucrerie, `doc_fmt_card_index` QUE côté Caramel.
 *
 * Le symptôme est visible par l'utilisateur : `t()` renvoie la CLÉ quand elle
 * est absente. L'idiome `t('x') || 'repli'` — 379 occurrences dans ce code —
 * ne protège PAS : la clé brute est « truthy », donc le repli n'est jamais
 * atteint. C'est pourquoi ce garde-fou existe plutôt qu'une réécriture des
 * 379 sites.
 *
 * `translateLabel()` a EXACTEMENT le même défaut (`return translated !== label ?
 * translated : label`) et porte la majorité des libellés de l'éditeur, définis
 * comme valeurs de schéma (`label:`, `hint:`…) dans content-detector.js. Une
 * première version de ce script ne regardait que `t('…')` littéral et affichait
 * « ✓ OK » alors que 8 clés s'affichaient brutes — dont `editor_no_items`, du
 * texte visible, et deux aria-label. Les trois formes sont donc couvertes
 * (cf. extractKeys).
 *
 * Le pendant côté Sucrerie est `scripts/check-shared-i18n.mjs` (même nom), qui
 * vérifie SES locales contre SES copies. Les deux doivent être verts.
 *
 * Usage : node scripts/check-shared-i18n.mjs
 * Codes de sortie : 0 = OK, 1 = clé(s) manquante(s)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

const LANGS = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];

/**
 * Périmètre scanné par RÉPERTOIRE plutôt que par liste figée : un nouveau
 * fichier d'éditeur ou d'export est couvert d'office, sans maintenance.
 * C'est un sur-ensemble du périmètre partagé avec Sucrerie (il inclut
 * `js/editor/index.js`, propre à Caramel) — sans inconvénient : ses clés
 * doivent de toute façon exister dans les locales de ce dépôt.
 */
const SCANNED_DIRS = ['js/editor', 'js/export', 'js/renderers', 'js/moodle/page-themes'];
const SCANNED_FILES = [
    'js/ui/sync-video-player.js',
    'js/h5p/field-constraints.js',
    'js/moodle/page-themes.js',
];

function listJs(dirRel) {
    const abs = resolve(root, dirRel);
    if (!existsSync(abs)) return [];
    const out = [];
    for (const e of readdirSync(abs)) {
        const p = resolve(abs, e);
        if (statSync(p).isDirectory()) out.push(...listJs(relative(root, p)));
        else if (e.endsWith('.js')) out.push(relative(root, p));
    }
    return out;
}

/**
 * Propriétés de configuration dont la VALEUR est une clé i18n : elles sont
 * résolues à l'affichage par `translateLabel()` (editor-core.js, field-renderers.js),
 * qui appelle `t()` et renvoie la clé brute si elle manque — exactement comme `t()`.
 * Sans elles, la majorité des libellés de l'éditeur (définis dans les schémas de
 * content-detector.js) échapperait au contrôle.
 */
const LABEL_PROPS = ['label', 'hint', 'placeholder', 'collapsibleLabel', 'itemLabel',
                     'addLabel', 'tooltip', 'nameKey', 'titleKey', 'emptyLabel', 'header'];

/**
 * Clés i18n littérales atteignables statiquement. Trois formes :
 *   1. `t('cle')`                     — appel direct
 *   2. `translateLabel('cle')`        — wrapper, même sémantique de repli
 *   3. `label: 'cle'` (LABEL_PROPS)   — valeur de schéma résolue par translateLabel
 *
 * Pour la forme 3, un filtre par PRÉFIXE écarte les valeurs qui ne sont pas des
 * clés i18n (`type: 'textarea'`, `label: 'A'`…) : seul un littéral contenant `_`
 * dont le premier segment est un préfixe déjà utilisé par le dictionnaire est
 * retenu. Sinon le contrôle serait noyé de faux positifs.
 *
 * Restent hors de portée (par nature) : les appels dynamiques `t(variable)` et
 * `t(`gabarit_${x}`)`. Les méthodes `obj.t('…')` sont exclues par (?<![\w.]).
 */
function extractKeys(src, prefixes) {
    const out = new Set();
    for (const m of src.matchAll(/(?<![\w.])t\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g)) out.add(m[1]);
    for (const m of src.matchAll(/translateLabel\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g)) out.add(m[1]);
    const propRe = new RegExp(`\\b(${LABEL_PROPS.join('|')})\\s*:\\s*['"]([a-zA-Z0-9_.-]+)['"]`, 'g');
    for (const m of src.matchAll(propRe)) {
        const v = m[2];
        if (v.includes('_') && prefixes.has(v.split('_')[0])) out.add(v);
    }
    return out;
}

const files = [...SCANNED_DIRS.flatMap(listJs), ...SCANNED_FILES.filter((f) => existsSync(resolve(root, f)))];

const locales = new Map();
for (const lang of LANGS) {
    const p = resolve(root, 'js/locales', `${lang}.json`);
    if (!existsSync(p)) { console.error(`✗ Locale manquante : js/locales/${lang}.json`); process.exit(1); }
    locales.set(lang, JSON.parse(readFileSync(p, 'utf8')));
}

// Préfixes connus du dictionnaire (1er segment avant `_`), pour filtrer la forme 3.
const prefixes = new Set(Object.keys(locales.get('fr')).map((k) => k.split('_')[0]));

const keysByFile = new Map();
const allKeys = new Set();
for (const rel of files) {
    const keys = extractKeys(readFileSync(resolve(root, rel), 'utf8'), prefixes);
    if (keys.size) keysByFile.set(rel, keys);
    for (const k of keys) allKeys.add(k);
}

console.log('Parité i18n de l\'éditeur et de l\'export documentaire');
console.log(`Fichiers scannés : ${files.length} — clés littérales distinctes : ${allKeys.size}`);
console.log('');

const missing = new Map();
for (const key of allKeys) {
    const absent = LANGS.filter((l) => !Object.prototype.hasOwnProperty.call(locales.get(l), key));
    if (absent.length) missing.set(key, absent);
}

if (!missing.size) {
    console.log(`✓ Les ${allKeys.size} clés existent dans les ${LANGS.length} locales.`);
    process.exit(0);
}

console.log(`✗ ${missing.size} clé(s) manquante(s) :`);
for (const [key, langs] of [...missing].sort()) {
    const owners = [...keysByFile].filter(([, ks]) => ks.has(key)).map(([f]) => f);
    const where = langs.length === LANGS.length ? 'TOUTES les langues' : langs.join(', ');
    console.log(`  - ${key}`);
    console.log(`      absente de : ${where}`);
    console.log(`      utilisée par : ${owners.join(', ')}`);
}
console.log('');
console.log('Rappel : t() renvoie la CLÉ quand elle est absente — elle s\'affichera telle');
console.log('quelle à l\'utilisateur, l\'idiome `t(x) || \'repli\'` n\'y changeant rien.');
console.log('Ajouter la clé dans les 11 locales (si Sucrerie la possède, en recopier la valeur).');
process.exit(1);
