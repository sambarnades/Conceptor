/**
 * placeholder-collision.mjs — Garde-fou de replacePlaceholders (moteur de
 * substitution PARTAGÉ par TOUTES les activités Moodle : Appariement, QCM, Page,
 * Livre, Millionnaire, Test, Glossaire, Devoir).
 *
 * Deux propriétés vérifiées :
 *   (1) ÉQUIVALENCE — sur les VRAIS templates du dépôt (y compris Page/Livre, non
 *       générables en Node car page-themes exigent un DOM), la nouvelle passe UNIQUE
 *       produit un résultat IDENTIQUE à l'ancienne boucle séquentielle DÈS LORS
 *       qu'aucune valeur ne contient de token {{…}} → aucun impact sur l'existant.
 *   (2) ANTI-COLLISION — un {{AUTRE_CLÉ}} présent dans une VALEUR (intro/titre/JSON
 *       tapé par l'utilisateur) reste LITTÉRAL au lieu d'être ré-substitué (ancien
 *       bug : injection de markup / corruption silencieuse selon l'ordre des clés).
 *       Vérifié bout-en-bout sur les vrais processeurs Appariement + Devoir + xmllint.
 *
 * Node pur via bootstrap.mjs. Lancer : node tests/roundtrip/placeholder-collision.mjs
 * @module tests/roundtrip/placeholder-collision
 */
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
await import('./bootstrap.mjs');
const { replacePlaceholders } = await import(join(REPO, 'js/moodle/processors/shared/placeholder.js'));
const { prepareIntroHtml } = await import(join(REPO, 'js/moodle/moodle-creator.js'));
const { getActivityFiles } = await import(join(REPO, 'js/moodle/processors/index.js'));

let passed = 0, failed = 0; const fails = [];
function ok(cond, label, detail) {
  if (cond) passed++;
  else { failed++; fails.push({ label, detail }); console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}

// --- Ancienne implémentation (boucle séquentielle) pour comparer -------------
function oldReplacePlaceholders(template, data) {
  if (!template) return template;
  let result = template;
  for (const key in data) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const replacement = String(data[key]).replace(/\$/g, '$$$$');
    result = result.replace(regex, replacement);
  }
  return result;
}

const dir = mkdtempSync(join(tmpdir(), 'placeholder-'));
function xmllintOk(name, xml) {
  const p = join(dir, name.replace(/[^a-zA-Z0-9._-]/g, '_'));
  writeFileSync(p, xml);
  try { execFileSync('xmllint', ['--noout', p], { stdio: ['ignore', 'ignore', 'pipe'] }); return true; }
  catch (e) { return String(e.stderr || e).split('\n')[0]; }
}

// ============================================================================
console.log('=== 1. ÉQUIVALENCE old≡new sur les VRAIS fichiers-templates (aucune valeur ne contient {{…}}) ===');
// On lit chaque source Moodle contenant des templates, on extrait TOUTES les clés
// {{CLÉ}} réelles (positions/répétitions authentiques, Page + Livre inclus), et on
// vérifie que new(fichier, data) === old(fichier, data) avec des valeurs bénignes.
const srcDir = join(REPO, 'js/moodle/processors');
const files = [
  join(srcDir, 'shared/templates.js'),
  join(srcDir, 'shared/moodle-backup.js'),
  ...readdirSync(join(srcDir, 'activities')).map(f => join(srcDir, 'activities', f)),
];
let totalKeys = 0;
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const keys = [...new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))];
  if (!keys.length) continue;
  totalKeys += keys.length;
  const data = {};
  for (const k of keys) data[k] = `VAL_${k}_é&<>"'$1`; // valeurs bénignes AVEC $ et méta-chars
  const oldOut = oldReplacePlaceholders(text, data);
  const newOut = replacePlaceholders(text, data);
  ok(oldOut === newOut, `${f.split('/').slice(-2).join('/')} : new≡old (${keys.length} clés)`,
    oldOut === newOut ? '' : `1ère divergence @${[...oldOut].findIndex((c, i) => c !== newOut[i])}`);
}
ok(totalKeys > 40, `couverture : ${totalKeys} placeholders réels testés`);

console.log('=== 2. Gestion des $ dans les valeurs (identique à l\'ancien) ===');
for (const val of ['prix $5', 'a $$ b', 'motif $1 $& $`', 'x $$$$ y']) {
  const t = 'AV {{X}} AP';
  ok(replacePlaceholders(t, { X: val }) === oldReplacePlaceholders(t, { X: val }),
    `valeur avec $ : ${JSON.stringify(val)}`, JSON.stringify(replacePlaceholders(t, { X: val })));
}

console.log('=== 3. Placeholder inconnu laissé littéral (inchangé) ===');
ok(replacePlaceholders('{{KNOWN}} et {{UNKNOWN}}', { KNOWN: 'k' }) === 'k et {{UNKNOWN}}',
  'clé absente du data → {{UNKNOWN}} conservé');

console.log('=== 4. ANTI-COLLISION : un {{CLÉ}} dans une VALEUR reste littéral ===');
{
  // C'était le bug : old ré-substitue le {{Y}} injecté par la valeur de X.
  const t = '<a>{{X}}</a><b>{{Y}}</b>';
  const data = { X: 'texte avec {{Y}} tapé', Y: 'SECRET' };
  const oldOut = oldReplacePlaceholders(t, data);
  const newOut = replacePlaceholders(t, data);
  ok(newOut === '<a>texte avec {{Y}} tapé</a><b>SECRET</b>', 'new : {{Y}} dans la valeur de X reste littéral', newOut);
  ok(oldOut === '<a>texte avec SECRET tapé</a><b>SECRET</b>', '(ancien comportement = collision, documenté)', oldOut);
  ok(newOut !== oldOut, 'new corrige bien la collision (diffère de old sur ce cas)');
}

console.log('=== 5. Bout-en-bout : {{ACTIVITY_ID}} tapé dans l\'intro n\'est PAS substitué ===');
function baseData(introEscaped) {
  return {
    ACTIVITY_TITLE: 'T', ACTIVITY_INTRO_HTML: introEscaped, ASSOCIATIONS_JSON: '{}',
    RUBRIC_NAME: 'R', CRITERIA: [{ description: 'c', levels: [{ definition: 'd', score: 1 }] }],
    COURSE_FULLNAME: 'T', COURSE_SHORTNAME: 'p', COURSE_ID: 1, MODULE_ID: 2, SECTION_ID: 3,
    ACTIVITY_ID: 4, COURSE_CONTEXTID: 5, ACTIVITY_CONTEXTID: 7, TIMESTAMP: 1, BACKUP_DATE: 1,
    CATEGORY_ID: 9, COURSE_ITEM_ID: 9, GRADE_ITEM_ID: 10,
  };
}
for (const key of ['Appariement', 'Devoir']) {
  const escaped = prepareIntroHtml('Consigne : voir {{ACTIVITY_ID}} et {{ASSOCIATIONS_JSON}} ici.', 'def');
  const f = getActivityFiles(key, baseData(escaped));
  const xmlPath = Object.keys(f).find(k => /(epikmatch|assign)\.xml$/.test(k));
  const xml = typeof f[xmlPath] === 'string' ? f[xmlPath] : new TextDecoder().decode(f[xmlPath]);
  const intro = (xml.match(/<intro>[\s\S]*?<\/intro>/) || [''])[0];
  ok(intro.includes('{{ACTIVITY_ID}}') && intro.includes('{{ASSOCIATIONS_JSON}}'),
    `[${key}] placeholders tapés par l'utilisateur restent LITTÉRAUX dans <intro>`, intro);
  ok(!/voir 4 et/.test(intro), `[${key}] {{ACTIVITY_ID}} PAS remplacé par 4 (anti-collision)`, intro);
  // Le VRAI {{ACTIVITY_ID}} du template (attribut <activity id=…>) doit, lui, être résolu.
  ok(/<activity id="4"/.test(xml), `[${key}] les placeholders LÉGITIMES du template restent résolus`);
  // Aucun placeholder de template non résolu ne doit fuir (hors ceux tapés dans l'intro).
  const leaked = (xml.replace(/<intro>[\s\S]*?<\/intro>/, '').match(/\{\{[A-Z_]+\}\}/g) || []);
  ok(leaked.length === 0, `[${key}] aucun placeholder de template non résolu hors intro`, leaked.join(','));
  ok(xmllintOk(`${key}.xml`, xml) === true, `[${key}] .xml bien formé`);
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} OK, ${failed} KO`);
if (failed) { for (const f of fails) console.log(`   - ${f.label}${f.detail ? ': ' + f.detail : ''}`); process.exit(1); }
