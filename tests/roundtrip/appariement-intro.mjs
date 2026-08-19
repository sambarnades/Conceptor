/**
 * appariement-intro.mjs — Garde-fou du bug « <intro> corrompu à la création »
 * des activités Appariement (epikmatch) et Devoir (assign) au format .mbz.
 *
 * CONTEXTE (bug déterministe, pas une hallucination LLM). Sur une intro « piège »
 * réaliste (Markdown `**gras**`, bloc `<div style="…">`, entités déjà présentes
 * `&gt;`/`&amp;`, accents), l'ancien pipeline de packaging produisait 3 défauts :
 *   1. bloc `<div>` enveloppé dans un `<p>` → `<p><div>…</div></p>` invalide
 *      (le `<div` « disparaissait » / le `style="…">` s'affichait en texte au rendu) ;
 *   2. entités déjà formées DOUBLE-échappées (`&gt;` → `&amp;gt;`) par un escapeXml
 *      appliqué à du HTML qui contenait déjà des entités ;
 *   3. Markdown `**gras**` jamais converti (affiché littéralement).
 *
 * CORRECTIF : `prepareIntroHtml()` (moodle-creator.js) + `escapeXmlPreservingEntities()`
 * (moodle-formats.js). Ce banc pilote les VRAIS processeurs (getActivityFiles) et
 * vérifie l'`<intro>` réellement écrite dans le .mbz.
 *
 * Node pur via bootstrap.mjs (stubs navigateur ; prepareIntroHtml n'utilise PAS le
 * sanitizer → sortie déterministe, test == production). Lancer :
 *   node tests/roundtrip/appariement-intro.mjs
 *
 * @module tests/roundtrip/appariement-intro
 */
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const boot = await import('./bootstrap.mjs'); // stubs navigateur AVANT tout module Caramel
const { escapeXmlPreservingEntities } = await import(join(REPO, 'js/moodle/moodle-formats.js'));
const { prepareIntroHtml } = await import(join(REPO, 'js/moodle/moodle-creator.js'));
const { getActivityFiles } = await import(join(REPO, 'js/moodle/processors/index.js'));
const { formatTextToHtml } = await import(join(REPO, 'js/core/utils.js'));
await boot.installIdentitySanitizer(); // formatTextToHtml façon navigateur (Livre/Glossaire)

let passed = 0, failed = 0;
const fails = [];
function ok(cond, label, detail) {
  if (cond) { passed++; }
  else { failed++; fails.push({ label, detail }); console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}

// Données minimales valides communes aux 2 processeurs (intro injectée par test).
function baseData(introEscaped, extra = {}) {
  return {
    ACTIVITY_TITLE: 'T', ACTIVITY_INTRO_HTML: introEscaped,
    ASSOCIATIONS_JSON: '{"questions":{},"responses":{}}',
    RUBRIC_NAME: 'R',
    CRITERIA: [{ description: 'Clarté', levels: [{ definition: 'Bien', score: 2 }, { definition: 'Insuffisant', score: 0 }] }],
    COURSE_FULLNAME: 'T', COURSE_SHORTNAME: 'p-x',
    COURSE_ID: 1, MODULE_ID: 2, SECTION_ID: 3, ACTIVITY_ID: 4,
    COURSE_CONTEXTID: 5, ACTIVITY_CONTEXTID: 7, TIMESTAMP: 1700000000,
    BACKUP_DATE: 1700000000, CATEGORY_ID: 9, COURSE_ITEM_ID: 9, GRADE_ITEM_ID: 10,
    ...extra
  };
}

// Extrait l'<intro> réellement écrite par le processeur + le chemin du XML activité.
function introXmlFor(activityKey, rawIntro, fallback) {
  const escaped = prepareIntroHtml(rawIntro, fallback);
  const files = getActivityFiles(activityKey, baseData(escaped));
  const key = Object.keys(files).find(k => /(epikmatch|assign)\.xml$/.test(k));
  const xml = typeof files[key] === 'string' ? files[key] : new TextDecoder().decode(files[key]);
  const intro = (xml.match(/<intro>[\s\S]*?<\/intro>/) || [''])[0];
  return { intro, xml, key };
}

// Décode UNE fois les entités XML → HTML que Moodle stockerait et rendrait.
function xmlUnescapeOnce(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&amp;/g, '&');
}

const dir = mkdtempSync(join(tmpdir(), 'appariement-intro-'));
function xmllintOk(name, xml) {
  const p = join(dir, name.replace(/[^a-zA-Z0-9._-]/g, '_'));
  writeFileSync(p, xml);
  try { execFileSync('xmllint', ['--noout', p], { stdio: ['ignore', 'ignore', 'pipe'] }); return true; }
  catch (e) { return String(e.stderr || e).split('\n')[0] || false; }
}

// Vérifie les critères d'acceptation sur une <intro> générée.
function assertCleanIntro(label, introXml, { expectStrong = false } = {}) {
  const inner = introXml.replace(/^<intro>/, '').replace(/<\/intro>$/, '');
  const stored = xmlUnescapeOnce(inner); // HTML restauré côté Moodle
  // 1. échappé UNE fois : aucune entité double-échappée
  ok(!/&amp;(?:gt|lt|amp|quot|apos|#|nbsp);/.test(introXml),
    `[${label}] pas de double-échappement (&amp;gt; / &amp;amp; / &amp;#…)`,
    (introXml.match(/&amp;(?:gt|lt|amp|quot|apos|#|nbsp);/) || [])[0]);
  // 2. Markdown converti : plus aucun **gras** / *ital* littéral
  ok(!/\*\*[^*\n]+\*\*/.test(stored) && !/(^|[^*])\*[^*\n]+\*([^*]|$)/.test(stored),
    `[${label}] Markdown converti (aucun **gras** résiduel)`, stored.slice(0, 80));
  // 3. pas de <div orphelin : un attribut style="…"> sans balise ouvrante devant
  ok(!(/(^|[^<][^a-z])style="[^"]*">/.test(' ' + stored) && !/<[a-z]+[^>]*style="[^"]*">/i.test(stored)),
    `[${label}] pas de style="…"> orphelin (bloc non cassé)`);
  // 4. pas de <p> enveloppant un bloc : jamais <p>…<div|ul|table…
  ok(!/<p\b[^>]*>\s*<(div|ul|ol|table|section|article|blockquote|pre|h[1-6])\b/i.test(stored),
    `[${label}] pas de <p> autour d'un bloc HTML`, (stored.match(/<p[^>]*>\s*<[a-z]+/i) || [])[0]);
  // 5. XML bien formé (élément <intro> encapsulé)
  ok(xmllintOk(`${label}.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<root>${introXml}</root>`) === true,
    `[${label}] <intro> XML bien formé (xmllint)`);
  if (expectStrong) {
    ok(/<strong>/.test(stored), `[${label}] <strong> présent (gras converti)`, stored.slice(0, 80));
  }
  return stored;
}

// ============================================================================
console.log('=== 1. escapeXmlPreservingEntities (fonction pure) ===');
// entités déjà formées préservées ; texte brut échappé une fois
ok(escapeXmlPreservingEntities('a &gt; b') === 'a &gt; b', '&gt; préservé (pas &amp;gt;)', escapeXmlPreservingEntities('a &gt; b'));
ok(escapeXmlPreservingEntities('x &amp; y') === 'x &amp; y', '&amp; préservé (pas &amp;amp;)', escapeXmlPreservingEntities('x &amp; y'));
ok(escapeXmlPreservingEntities('Curie & Einstein') === 'Curie &amp; Einstein', '& brut échappé en &amp;', escapeXmlPreservingEntities('Curie & Einstein'));
ok(escapeXmlPreservingEntities('<div>&nbsp;ok</div>') === '&lt;div&gt;&amp;nbsp;ok&lt;/div&gt;', 'balise échappée + &nbsp; NEUTRALISÉ (pas une entité XML)', escapeXmlPreservingEntities('<div>&nbsp;ok</div>'));
ok(escapeXmlPreservingEntities('é &#233; "x"') === '&#233; &#233; &quot;x&quot;', 'accent numérisé + &#233; préservé + guillemet échappé', escapeXmlPreservingEntities('é &#233; "x"'));
ok(escapeXmlPreservingEntities('R&D & &gt;') === 'R&amp;D &amp; &gt;', 'faux ami R&D échappé, vraie entité préservée', escapeXmlPreservingEntities('R&D & &gt;'));

console.log('=== 2. prepareIntroHtml : intro « piège » complète (Appariement) ===');
const TRAP = `**Histoire de l'IA** : associez chaque événement à sa date.

<div style="border-left:4px solid #4CAF50;padding:8px;">💡 Astuce : lisez la date &gt; avant.</div>

**1986** Retour des réseaux de neurones.`;
{
  const { intro, xml } = introXmlFor('Appariement', TRAP, 'Trouvez les paires.');
  const stored = assertCleanIntro('Appariement/piège', intro, { expectStrong: true });
  ok(/<div style="border-left:4px solid #4CAF50;padding:8px;">/.test(stored), '[Appariement/piège] <div style> préservé intact');
  ok(/lisez la date > avant/.test(stored), '[Appariement/piège] &gt; rendu comme « > » (pas &gt; littéral)', stored);
  ok(xmllintOk('epikmatch-full.xml', xml) === true, '[Appariement/piège] epikmatch.xml complet bien formé');
}

console.log('=== 3. prepareIntroHtml : description « piège » (Devoir) ===');
const TRAP_DEVOIR = `**Consigne** : rédigez un texte de *plus* de 200 mots.

<ul><li>Introduction &amp; problématique</li><li>Développement &gt; 3 arguments</li></ul>`;
{
  const { intro, xml } = introXmlFor('Devoir', TRAP_DEVOIR, 'Consultez la grille.');
  const stored = assertCleanIntro('Devoir/piège', intro, { expectStrong: true });
  ok(/<em>plus<\/em>/.test(stored), '[Devoir/piège] *italique* converti en <em>', stored.slice(0, 100));
  ok(/<ul><li>/.test(stored), '[Devoir/piège] liste <ul> préservée (pas enveloppée en <p>)');
  ok(xmllintOk('assign-full.xml', xml) === true, '[Devoir/piège] assign.xml complet bien formé');
}

console.log('=== 4. Cas propres (non-régression) ===');
{
  // texte simple avec accents + apostrophe + esperluette
  const { intro } = introXmlFor('Appariement', "Associez chaque terme à sa définition (Curie & Einstein).", 'def');
  const stored = assertCleanIntro('Appariement/texte', intro);
  ok(stored === "<p>Associez chaque terme à sa définition (Curie & Einstein).</p>", 'texte simple → un <p>, & échappé une fois', stored);
}
{
  // intro vide → fallback traduit, jamais de <intro> cassée
  const { intro } = introXmlFor('Appariement', '', 'Trouvez les paires correspondantes.');
  const stored = assertCleanIntro('Appariement/vide', intro);
  ok(/Trouvez les paires correspondantes\./.test(stored), 'intro vide → fallback appliqué', stored);
}
{
  // intro déjà en <p> (ex. ré-import) → pas de double-enveloppe, pas de double-échappement
  const { intro } = introXmlFor('Appariement', '<p>Déjà en HTML &amp; propre.</p>', 'def');
  const stored = assertCleanIntro('Appariement/deja-p', intro);
  ok(stored === '<p>Déjà en HTML & propre.</p>', 'HTML déjà propre inchangé (idempotent)', stored);
}

console.log('=== 5. Idempotence de prepareIntroHtml sur entrée brute ===');
{
  const a = prepareIntroHtml(TRAP, 'x');
  const b = prepareIntroHtml(TRAP, 'x');
  ok(a === b, 'même entrée brute → même sortie (déterministe)');
}

// ============================================================================
// 6. Entités déjà présentes → XML TOUJOURS bien formé (garde-fou anti-régression
//    des trouvailles adversariales : XML ne prédéfinit QUE amp/lt/gt/quot/apos ;
//    &nbsp;/&eacute;/&AMP;/&#0;/&#xD800; DOIVENT être neutralisés, pas préservés).
// ============================================================================
console.log('=== 6. escapeXmlPreservingEntities : entités valides vs invalides ===');
function xmlWellFormed(escaped) {
  return xmllintOk('ent', `<?xml version="1.0" encoding="UTF-8"?>\n<root>${escaped}</root>`) === true;
}
// Entités XML valides → PRÉSERVÉES verbatim (pas de double-échappement).
for (const [inp, exp] of [
  ['a &gt; b', 'a &gt; b'],
  ['x &amp; y', 'x &amp; y'],
  ['&lt; &quot; &apos;', '&lt; &quot; &apos;'],
  ['caf&#233; &#x1F4A1;', 'caf&#233; &#x1F4A1;'],  // refs numériques légales
]) {
  const out = escapeXmlPreservingEntities(inp);
  ok(out === exp, `entité XML valide préservée : ${JSON.stringify(inp)}`, `→ ${JSON.stringify(out)}`);
  ok(xmlWellFormed(out), `→ XML bien formé : ${JSON.stringify(inp)}`);
}
// Séquences NON valides en XML → & échappé en &amp; ; XML reste bien formé.
for (const inp of [
  'Bonjour&nbsp;monde', 'Caf&eacute; fran&ccedil;ais', '&copy; 2026', 'Angle 90&deg;',
  'lettre &alpha; grecque', 'entité &foobar; inconnue', 'a &bc; d',            // HTML/inconnues
  '&AMP;', '&LT;', '&Amp;',                                                     // casse
  'nul &#0; interdit', 'vtab &#11;', 'ctrl &#8;', 'surrogate &#xD800;',
  'nonchar &#xFFFF;', 'hors-plage &#999999999;', 'hex-nul &#x0;',              // refs numériques illégales
]) {
  const out = escapeXmlPreservingEntities(inp);
  ok(xmlWellFormed(out), `séquence non-XML neutralisée → XML bien formé : ${JSON.stringify(inp)}`, `→ ${JSON.stringify(out)}`);
  ok(!/&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/.test(out) || xmlWellFormed(out),
    `aucun & non protégé résiduel : ${JSON.stringify(inp)}`);
}
// Cas mixte réaliste (LLM FR) : accents + nbsp + entité XML + Markdown.
{
  const out = prepareIntroHtml('**Consigne** : rédige un texte a&eacute;r&eacute; de plus de&nbsp;200 mots &gt; niveau A2.', 'def');
  ok(xmlWellFormed(out), 'intro FR (accents nommés + nbsp + &gt; + gras) → XML bien formé', out);
  ok(out.includes('&gt;') && !out.includes('&amp;gt;'), 'intro FR : &gt; préservé, pas &amp;gt;');
  ok(out.includes('&lt;strong&gt;'), 'intro FR : **gras** converti');
}

// ============================================================================
// 7. Bout-en-bout sur les VRAIS processeurs avec entités piégeuses : les
//    fichiers epikmatch.xml / assign.xml complets DOIVENT passer xmllint.
// ============================================================================
console.log('=== 7. .mbz réel (Appariement + Devoir) avec entités piégeuses → xmllint ===');
const ENTITY_TRAPS = [
  'Consigne avec &nbsp; insécable et accent caf&eacute;.',
  'Barème &copy; 2026, angle 90&deg;.',
  'Caractère interdit &#0; puis &#11; et surrogate &#xD800; au milieu.',
  'Faux amis : Curie & Einstein, R&D, AT&T; et &foobar; inconnu.',
  '**Gras** + \\(a &lt; b\\) + &gt; + &#233; + &nbsp; en une ligne.',
];
for (const key of ['Appariement', 'Devoir']) {
  for (const trap of ENTITY_TRAPS) {
    const escaped = prepareIntroHtml(trap, 'def');
    const files = getActivityFiles(key, baseData(escaped));
    let allWellFormed = true, firstBad = '';
    for (const [path, content] of Object.entries(files)) {
      if (!path.endsWith('.xml')) continue;
      const xml = typeof content === 'string' ? content : new TextDecoder().decode(content);
      const res = xmllintOk(`${key}-${path}`, xml);
      if (res !== true) { allWellFormed = false; firstBad = `${path}: ${res}`; break; }
    }
    ok(allWellFormed, `[${key}] tous les .xml bien formés — intro ${JSON.stringify(trap.slice(0, 32))}…`, firstBad);
  }
}

// ============================================================================
// 8. Composition Livre/Glossaire : escapeXmlPreservingEntities(formatTextToHtml(x))
//    (INTRO du Livre, DEFINITION du Glossaire, génération ET ré-export éditeur).
//    Doit : convertir le Markdown, préserver les entités XML (&gt; NON → &amp;gt;),
//    rester XML bien formé. escapeXmlPreservingEntities est déjà couvert §1/§6 ;
//    on vérifie ici la COMPOSITION réelle avec formatTextToHtml (sanitizer identité).
// ============================================================================
console.log('=== 8. Livre/Glossaire : escapeXmlPreservingEntities(formatTextToHtml(x)) ===');
function xmlWellFormed8(escaped) {
  return xmllintOk('livre', `<?xml version="1.0" encoding="UTF-8"?>\n<root>${escaped}</root>`) === true;
}
for (const src of [
  'Ensemble des x tels que x &gt; 0 et **strictement** positif.',
  'Principe : le *pouvoir* appartient à la Nation &amp; au peuple.',
  'Angle de 90&deg; noté &alpha; (entité HTML non-XML → neutralisée).',
]) {
  const out = escapeXmlPreservingEntities(formatTextToHtml(src));
  ok(xmlWellFormed8(out), `Livre/Glossaire XML bien formé : ${JSON.stringify(src.slice(0, 40))}`, out);
  ok(!/&amp;(gt|lt|amp|quot|apos);/.test(out), `pas de double-échappement d'entité XML : ${JSON.stringify(src.slice(0, 40))}`, out);
}
{
  // &gt; explicitement préservé (le cœur du correctif Sig 2, propagé à Livre/Glossaire)
  const out = escapeXmlPreservingEntities(formatTextToHtml('x &gt; y'));
  ok(out.includes('&gt;') && !out.includes('&amp;gt;'), 'Livre/Glossaire : &gt; préservé (pas &amp;gt;)', out);
  // Markdown converti
  const out2 = escapeXmlPreservingEntities(formatTextToHtml('**gras** et *ital*'));
  ok(/&lt;strong&gt;/.test(out2) && /&lt;em&gt;/.test(out2), 'Livre/Glossaire : Markdown converti', out2);
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} OK, ${failed} KO`);
if (failed) { for (const f of fails) console.log(`   - ${f.label}${f.detail ? ': ' + f.detail : ''}`); process.exit(1); }
