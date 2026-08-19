/**
 * run_escape_tests.mjs — Tests de `js/core/escape.js` (échappement, source unique).
 *
 * Trois volets :
 *  1. ÉQUIVALENCE — le module canonique reproduit exactement la variante SAINE qui
 *     existait déjà (celle de `core/utils.js::escapeHtmlTags`, la plus utilisée, y
 *     compris sur le chemin d'export .mbz). Aucune régression de sortie.
 *  2. FAILLES CORRIGÉES — les comportements des variantes DÉFECTUEUSES sont
 *     explicitement testés comme corrigés (attribut non sûr, TypeError sur
 *     non-chaîne, `0` transformé en chaîne vide).
 *  3. XML — le filtrage des caractères illégaux en XML 1.0, absent de deux des
 *     anciennes copies, qui produisait des .mbz/.odt refusés à l'ouverture.
 *
 * Lancement :  node tests/run_escape_tests.mjs
 * `core/escape.js` est pur (zéro import) ; bootstrap.mjs n'est nécessaire que pour
 * le volet 5 bis, qui importe `core/utils.js` (lequel tire translation/notifications).
 */
import './roundtrip/bootstrap.mjs';
import { escapeHtml, escapeHtmlAttr, stripHtml, escapeXml, isXmlChar } from '../js/core/escape.js';

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n   obtenu: ${a}`);
}

// =======================================================================
// COPIES DE RÉFÉRENCE des anciennes implémentations (oracles)
// =======================================================================

/** `core/utils.js::escapeHtmlTags` — la variante SAINE, référence d'équivalence. */
function ref_escapeHtmlTags(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** `ui/tutorial-modal.js` — DÉFECTUEUSE : n'échappait pas l'apostrophe. */
function ref_tutorialModal(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** `editor/field-renderers.js` — DÉFECTUEUSE : n'échappait ni `"` ni `'`. */
function ref_fieldRenderers(str) {
    if (str === null || str === undefined) return '';
    // Équivalent Node de `div.textContent = s; return div.innerHTML`
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** `moodle/mbz-utils.js` — variante XML DURCIE, référence pour escapeXml. */
function ref_mbzEscapeXml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/[<>&'"]/g, c => ({
            '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;'
        }[c]));
}

/** `export/document-exporter.js` — variante XML NON durcie (pas de filtrage C0). */
function ref_docExporterEscapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&"']/g, function (m) {
        switch (m) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return m;
        }
    });
}

// =======================================================================
// 1. ÉQUIVALENCE avec la variante saine (aucune régression de sortie)
// =======================================================================
{
    const SAMPLES = [
        '', 'texte simple', 'a & b', '<script>alert(1)</script>',
        'guillemets "doubles"', "apostrophe 'simple'", 'mixte <a href="x">l\'été</a>',
        '&amp; déjà échappé', '&&&', '<<<', '>>>', '""', "''",
        'accents éàçüñ', 'emoji 🎓', 'CJK 漢字', 'arabe مرحبا',
        'LaTeX $\\frac{1}{2}$', 'chemin C:\\dir\\file', 'tab\tet\nsaut',
        'tout <>&"\' ensemble'
    ];
    let diverged = 0;
    const details = [];
    for (const s of SAMPLES) {
        const a = escapeHtml(s), b = ref_escapeHtmlTags(s);
        if (a !== b) { diverged++; details.push(`entrée=${JSON.stringify(s)}\n     canon=${JSON.stringify(a)}\n     ref  =${JSON.stringify(b)}`); }
    }
    eq(`escapeHtml : équivalent à escapeHtmlTags sur ${SAMPLES.length} entrées`, diverged, 0);
    if (details.length) failures.push('   ' + details.join('\n   '));

    // Ancrages explicites
    eq('escapeHtml échappe les 5 caractères', escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
    eq('escapeHtml : & traité une seule fois (pas de double échappement)', escapeHtml('&lt;'), '&amp;lt;');
    eq('escapeHtml : apostrophe en &#39; (forme historique conservée)', escapeHtml("'"), '&#39;');
    eq('escapeHtmlAttr est le même contrat', escapeHtmlAttr(`a"b'c`), escapeHtml(`a"b'c`));
}

// =======================================================================
// 2. FAILLES CORRIGÉES
// =======================================================================
{
    // --- 2a. Contexte d'attribut : les deux variantes défectueuses laissaient
    //         passer un caractère permettant de sortir de l'attribut.
    const breakSingle = "x' onmouseover='alert(1)";
    const breakDouble = 'x" onmouseover="alert(1)';

    ok('tutorial-modal (ancien) : FAILLE apostrophe reproduite',
        ref_tutorialModal(breakSingle).includes("'"),
        'l\'oracle doit bien montrer la faille, sinon le test ne prouve rien');
    ok('escapeHtml : apostrophe neutralisée (faille tutorial-modal fermée)',
        !escapeHtml(breakSingle).includes("'"),
        escapeHtml(breakSingle));

    ok('field-renderers (ancien) : FAILLE guillemet double reproduite',
        ref_fieldRenderers(breakDouble).includes('"'));
    ok('escapeHtml : guillemet double neutralisé (faille field-renderers fermée)',
        !escapeHtml(breakDouble).includes('"'),
        escapeHtml(breakDouble));
    ok('escapeHtml : apostrophe neutralisée aussi vs field-renderers',
        !escapeHtml(breakSingle).includes("'"));

    // La valeur reste utilisable une fois réinjectée dans un attribut simple/double
    const attrSingle = `<a title='${escapeHtml(breakSingle)}'>`;
    const attrDouble = `<a title="${escapeHtml(breakDouble)}">`;
    eq('attribut à guillemets simples : un seul couple de délimiteurs',
        (attrSingle.match(/'/g) || []).length, 2);
    eq('attribut à guillemets doubles : un seul couple de délimiteurs',
        (attrDouble.match(/"/g) || []).length, 2);

    // --- 2b. Entrées non-chaîne : les variantes `text.replace(...)` levaient.
    let threw = false;
    try {
        escapeHtml(42); escapeHtml(0); escapeHtml(true); escapeHtml(false);
        escapeHtml({}); escapeHtml([]); escapeHtml(null); escapeHtml(undefined);
        escapeHtml(NaN); escapeHtml(3.14); escapeHtml(-1);
    } catch { threw = true; }
    ok('escapeHtml ne lève sur aucune entrée non-chaîne', !threw);

    eq('escapeHtml(null) → chaîne vide', escapeHtml(null), '');
    eq('escapeHtml(undefined) → chaîne vide', escapeHtml(undefined), '');
    // Le point important : 0 est falsy mais n'est PAS vide. Les variantes avec
    // `if (!unsafe) return ''` le perdaient silencieusement.
    eq('escapeHtml(0) → "0" (et non "")', escapeHtml(0), '0');
    eq('escapeHtml(false) → "false"', escapeHtml(false), 'false');
    eq('escapeHtml(42) → "42"', escapeHtml(42), '42');

    // Une entrée non-chaîne faisait bien lever l'ancienne variante
    const ref_notificationsEscapeHtml = (unsafe) => {
        if (!unsafe) return '';
        return unsafe.replace(/&/g, '&amp;');
    };
    let refThrew = false;
    try { ref_notificationsEscapeHtml(42); } catch { refThrew = true; }
    ok('notifications (ancien) : TypeError sur un nombre reproduit', refThrew);
    eq('notifications (ancien) : 0 devenait ""', ref_notificationsEscapeHtml(0), '');
}

// =======================================================================
// 3. stripHtml
// =======================================================================
{
    eq('stripHtml retire les balises', stripHtml('<p>Bonjour <b>monde</b></p>'), 'Bonjour monde');
    eq('stripHtml compacte les espaces', stripHtml('a   b\n\nc'), 'a b c');
    eq('stripHtml traite &nbsp;', stripHtml('a&nbsp;b'), 'a b');
    eq('stripHtml &NBSP; insensible à la casse', stripHtml('a&NBSP;b'), 'a b');
    eq('stripHtml(null) → ""', stripHtml(null), '');
    eq('stripHtml(undefined) → ""', stripHtml(undefined), '');
    eq('stripHtml(0) → "0"', stripHtml(0), '0');
    eq('stripHtml trim les bords', stripHtml('  <i>x</i>  '), 'x');
    eq('stripHtml : balise auto-fermante', stripHtml('a<br/>b'), 'a b');
    eq('stripHtml : attributs avec chevrons échappés', stripHtml('<a href="x">t</a>'), 't');
}

// =======================================================================
// 4. escapeXml — équivalence avec la variante durcie + filtrage C0
// =======================================================================
{
    const SAMPLES = [
        '', 'simple', 'a & b', '<tag>', 'guillemet "x"', "apostrophe 'y'",
        'accents éàç', 'emoji 🎓', 'CJK 漢字', 'tab\tnewline\ncr\r',
        'tout <>&"\' ensemble'
    ];
    let diverged = 0;
    const details = [];
    for (const s of SAMPLES) {
        const a = escapeXml(s), b = ref_mbzEscapeXml(s);
        if (a !== b) { diverged++; details.push(`entrée=${JSON.stringify(s)}\n     canon=${JSON.stringify(a)}\n     ref  =${JSON.stringify(b)}`); }
    }
    eq(`escapeXml : équivalent à mbz-utils sur ${SAMPLES.length} entrées`, diverged, 0);
    if (details.length) failures.push('   ' + details.join('\n   '));

    eq('escapeXml : apostrophe en &apos; (convention XML)', escapeXml("'"), '&apos;');
    eq('escapeXml échappe les 5 caractères', escapeXml(`<>&"'`), '&lt;&gt;&amp;&quot;&apos;');
    eq('escapeXml(null) → ""', escapeXml(null), '');
    eq('escapeXml(0) → "0"', escapeXml(0), '0');

    // --- Le cœur du correctif : caractères illégaux en XML 1.0 ---
    eq('escapeXml supprime U+0001', escapeXml('a\u0001b'), 'ab');
    eq('escapeXml supprime U+0008', escapeXml('a\u0008b'), 'ab');
    eq('escapeXml supprime U+000B (VT)', escapeXml('a\u000Bb'), 'ab');
    eq('escapeXml supprime U+000C (FF)', escapeXml('a\u000Cb'), 'ab');
    eq('escapeXml supprime U+001F', escapeXml('a\u001Fb'), 'ab');
    eq('escapeXml supprime U+0000 (NUL)', escapeXml('a\u0000b'), 'ab');
    // …mais PRÉSERVE les trois blancs légaux
    eq('escapeXml préserve la tabulation', escapeXml('a\tb'), 'a\tb');
    eq('escapeXml préserve le saut de ligne', escapeXml('a\nb'), 'a\nb');
    eq('escapeXml préserve le retour chariot', escapeXml('a\rb'), 'a\rb');
    // …et les non-caractères
    eq('escapeXml supprime U+FFFE', escapeXml('a\uFFFEb'), 'ab');
    eq('escapeXml supprime U+FFFF', escapeXml('a\uFFFFb'), 'ab');
    // Une paire de substitution VALIDE (emoji) doit passer intacte
    eq('escapeXml préserve une paire de substitution valide', escapeXml('a🎓b'), 'a🎓b');
    // Un demi-codet ISOLÉ (chaîne mal formée) est supprimé
    eq('escapeXml supprime un demi-codet isolé', escapeXml('a\uD800b'), 'ab');

    // Preuve que l'ancienne variante de document-exporter laissait passer le poison
    ok('document-exporter (ancien) : U+0001 conservé → ODF invalide',
        ref_docExporterEscapeXml('a\u0001b').includes('\u0001'));
    ok('escapeXml : U+0001 éliminé (correctif)', !escapeXml('a\u0001b').includes('\u0001'));

    // Et que l'ancienne variante perdait `0`
    eq('document-exporter (ancien) : 0 devenait ""', ref_docExporterEscapeXml(0), '');
}

// =======================================================================
// 5. isXmlChar — prédicat
// =======================================================================
{
    eq('isXmlChar(0x09) tab légal', isXmlChar(0x09), true);
    eq('isXmlChar(0x0A) LF légal', isXmlChar(0x0A), true);
    eq('isXmlChar(0x0D) CR légal', isXmlChar(0x0D), true);
    eq('isXmlChar(0x00) NUL illégal', isXmlChar(0x00), false);
    eq('isXmlChar(0x08) illégal', isXmlChar(0x08), false);
    eq('isXmlChar(0x1F) illégal', isXmlChar(0x1F), false);
    eq('isXmlChar(0x20) espace légal', isXmlChar(0x20), true);
    eq('isXmlChar(0xD800) demi-codet illégal', isXmlChar(0xD800), false);
    eq('isXmlChar(0xDFFF) demi-codet illégal', isXmlChar(0xDFFF), false);
    eq('isXmlChar(0xFFFE) non-caractère illégal', isXmlChar(0xFFFE), false);
    eq('isXmlChar(0xFFFF) non-caractère illégal', isXmlChar(0xFFFF), false);
    eq('isXmlChar(0x1F393) emoji légal', isXmlChar(0x1F393), true);
    eq('isXmlChar(0xE9) é légal', isXmlChar(0xE9), true);

    // Balayage complet du plan C0 + bornes
    let bad = 0;
    for (let cp = 0; cp < 0x20; cp++) {
        const expected = (cp === 0x09 || cp === 0x0A || cp === 0x0D);
        if (isXmlChar(cp) !== expected) bad++;
    }
    eq('isXmlChar : plan C0 complet conforme', bad, 0);
}

// =======================================================================
// 5 bis. `escapeHtmlTags` (core/utils.js) : sémantique HISTORIQUE préservée
//
// Ce helper coerce les entrées nulles (`"null"`, `"undefined"`) au lieu de
// renvoyer `''`. Des appelants s'y exposent sans repli — `ctx.escapeHtmlTags(
// data.img_src)` dans les 4 thèmes de Page — dont la sortie HTML n'est PAS
// couverte par le banc de snapshots. On vérifie donc l'équivalence stricte
// avec l'implémentation d'origine, entrées nulles incluses.
// =======================================================================
{
    const { escapeHtmlTags } = await import('../js/core/utils.js');

    const INPUTS = [
        '', 'x', '<a>', 'a & b', `"q"`, "'a'", 'éàç', '🎓',
        null, undefined, 0, 1, 42, -1, false, true, NaN, 3.14,
        'tout <>&"\' ensemble'
    ];
    let diverged = 0;
    const details = [];
    for (const v of INPUTS) {
        const a = escapeHtmlTags(v), b = ref_escapeHtmlTags(v);
        if (a !== b) { diverged++; details.push(`entrée=${JSON.stringify(v)}\n     actuel=${JSON.stringify(a)}\n     ref   =${JSON.stringify(b)}`); }
    }
    eq(`escapeHtmlTags : équivalent à l'original sur ${INPUTS.length} entrées`, diverged, 0);
    if (details.length) failures.push('   ' + details.join('\n   '));

    // Les trois divergences volontaires vs escapeHtml, explicitées :
    eq('escapeHtmlTags(null) → "null" (legacy, ≠ escapeHtml)', escapeHtmlTags(null), 'null');
    eq('escapeHtmlTags(undefined) → "undefined" (legacy)', escapeHtmlTags(undefined), 'undefined');
    eq('escapeHtml(null) → "" (canonique)', escapeHtml(null), '');
    // …mais la table d'échappement est bien la même
    eq('même table d\'échappement que escapeHtml', escapeHtmlTags(`<>&"'`), escapeHtml(`<>&"'`));
}

// =======================================================================
// 6. Idempotence / stabilité
// =======================================================================
{
    // Échapper deux fois double bien les `&` (comportement attendu, non idempotent)
    eq('escapeHtml appliqué 2× double l\'échappement (attendu)',
        escapeHtml(escapeHtml('<a>')), '&amp;lt;a&amp;gt;');
    // Mais escapeXml est stable sur le filtrage : re-filtrer ne retire rien de plus
    const once = escapeXml('a\u0001b\tc');
    eq('escapeXml : le filtrage C0 est stable au 2e passage',
        escapeXml(once).replace(/&amp;/g, '&'), once);
}

// =======================================================================
// 7. ANTI-DÉRIVE des copies délibérées (fichiers partagés avec Sucrerie)
//
// Sept fichiers sont byte-identiques côté Sucrerie (`js/editor/*` et
// `js/export/document-exporter.js`, cf. CLAUDE.md pièges 7 et note docx). Ils ne
// peuvent donc PAS importer `js/core/escape.js`, qui n'existe pas dans ce dépôt :
// leur table d'échappement y est recopiée volontairement.
//
// Ce volet vérifie que ces copies restent ALIGNÉES sur le canonique. Sans lui, la
// situation d'origine se reconstitue : un correctif appliqué à `core/escape.js`
// mais oublié dans les copies.
// =======================================================================
{
    const { readFileSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
    const read = (p) => readFileSync(join(ROOT, p), 'utf8');

    // --- 7a. field-renderers.js exporte escapeHtml : test de comportement direct ---
    {
        const { escapeHtml: shared } = await import('../js/editor/field-renderers.js');
        const SAMPLES = ['', '<a>', 'a & b', `"q"`, "'a'", `tout <>&"' ensemble`, 'éàç🎓'];
        let diverged = 0;
        const details = [];
        for (const s of SAMPLES) {
            if (shared(s) !== escapeHtml(s)) {
                diverged++;
                details.push(`entrée=${JSON.stringify(s)}\n     field-renderers=${JSON.stringify(shared(s))}\n     canonique      =${JSON.stringify(escapeHtml(s))}`);
            }
        }
        eq('field-renderers::escapeHtml aligné sur le canonique', diverged, 0);
        if (details.length) failures.push('   ' + details.join('\n   '));
        eq('field-renderers::escapeHtml(null) → ""', shared(null), '');
        eq('field-renderers::escapeHtml(undefined) → ""', shared(undefined), '');
        // La régression à empêcher : retour au détour par le DOM (n'échappe ni " ni ')
        ok('field-renderers : guillemet double bien échappé', shared('a"b') === 'a&quot;b', shared('a"b'));
        ok('field-renderers : apostrophe bien échappée', shared("a'b") === 'a&#39;b', shared("a'b"));
    }

    // --- 7b. Les 5 panneaux : escapeText n'est pas exporté → contrôle de la SOURCE ---
    {
        const PANELS = [
            'js/editor/interactive-video-panel.js',
            'js/editor/interactive-image-panel.js',
            'js/editor/dictation-tts-panel.js',
            'js/editor/dragdrop-layout-panel.js',
            'js/editor/audio-recorder-widget.js'
        ];
        for (const p of PANELS) {
            const src = read(p);
            const m = src.match(/function escapeText\(s\) \{[\s\S]*?\n\}/);
            ok(`${p.split('/').pop()} : escapeText présent`, !!m);
            if (!m) continue;
            const body = m[0];
            // Les 5 caractères doivent tous figurer dans la table
            for (const [ch, ent] of [['&', '&amp;'], ['<', '&lt;'], ['>', '&gt;'], ['"', '&quot;'], ["'", '&#39;']]) {
                ok(`${p.split('/').pop()} : escapeText couvre ${ch}`, body.includes(ent),
                    `entité ${ent} absente de la table`);
            }
            // Et la classe de caractères doit bien inclure quote et apostrophe
            ok(`${p.split('/').pop()} : classe /[&<>"']/ complète`, /\[&<>"'\]/.test(body), body.slice(0, 200));
        }
    }

    // --- 7c. document-exporter.js : escapeXml doit filtrer les caractères illégaux ---
    {
        const src = read('js/export/document-exporter.js');
        const m = src.match(/function escapeXml\(unsafe\) \{[\s\S]*?\n\}/);
        ok('document-exporter : escapeXml présent', !!m);
        if (m) {
            const body = m[0];
            ok('document-exporter : filtre les contrôles C0 (cp < 0x20)', /cp < 0x20/.test(body));
            ok('document-exporter : préserve tab/LF/CR', /0x09|0x0A|0x0D/.test(body));
            ok('document-exporter : filtre les demi-codets', /0xD800/.test(body));
            ok('document-exporter : filtre les non-caractères', /0xFFFE|0xFFFF/.test(body));
            for (const ent of ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;']) {
                ok(`document-exporter : escapeXml émet ${ent}`, body.includes(ent));
            }
        }
    }

    // --- 7d. moodle-formats.js : variante SPÉCIALISÉE, ne doit PAS être alignée ---
    // Elle encode en plus tout non-ASCII en référence numérique (exigence du XML
    // des sauvegardes Moodle). Ce test documente la divergence comme VOULUE.
    {
        const { escapeXml: moodleEscapeXml } = await import('../js/moodle/moodle-formats.js');
        eq('moodle-formats::escapeXml encode les accents en référence numérique',
            moodleEscapeXml('é'), '&#233;');
        ok('canonique, lui, préserve les accents tels quels', escapeXml('é') === 'é');
        // Mais les deux filtrent bien les caractères illégaux
        eq('moodle-formats::escapeXml supprime aussi U+0001', moodleEscapeXml('a\u0001b'), 'ab');
        eq('canonique supprime aussi U+0001', escapeXml('a\u0001b'), 'ab');
    }
}

// =======================================================================
// Bilan
// =======================================================================
console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`core/escape.js : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
