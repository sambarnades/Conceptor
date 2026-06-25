/**
 * Tests unitaires de la normalisation anti-contournement du pré-filtre
 * profanity (cf. js/sucrerie-bridge/services/profanity-filter.js).
 *
 * Exécuter avec : node tests/run_profanity_tests.mjs
 *
 * Couvre :
 *   - normalize() seul, par langue (FR/EN, EL, AR, ZH/JA)
 *   - compileWordlist() + match end-to-end : on construit une mini-wordlist,
 *     on la compile, et on vérifie qu'elle attrape les variantes obfusquées
 *     ET qu'elle ne génère pas de faux positifs sur du texte normal.
 */
import { normalize, compileWordlist } from '../js/sucrerie-bridge/services/profanity-filter.js';

let pass = 0, fail = 0;
function test(name, condition) {
    if (condition) {
        pass++;
    } else {
        fail++;
        console.log('  FAIL:', name);
    }
}
function eq(name, actual, expected) {
    if (actual === expected) {
        pass++;
    } else {
        fail++;
        console.log(`  FAIL: ${name}\n    attendu: ${JSON.stringify(expected)}\n    obtenu : ${JSON.stringify(actual)}`);
    }
}

// ====================================================================
console.log('=== NORMALIZE — latin (fr/en) ===');
// ====================================================================

eq('casse',                         normalize('CoNnArD', 'fr'), 'connard');
eq('diacritiques (NFKD + strip)',   normalize('çōnnárd', 'fr'), 'connard');
eq('cedille FR',                    normalize('Ça', 'fr'),      'ca');
// NB : `ß` ne se décompose PAS en `ss` via NFKD (c'est volontaire en Unicode).
// On reste donc avec `ß` après normalisation. Les wordlists allemandes LDNOOBW
// listent typiquement les variantes en `ß` et `ss` séparément, ce qui couvre
// les deux formes sans avoir à les fusionner ici.
eq('umlaut DE — ä décomposé, ß conservé', normalize('Schäße', 'de'), 'schaße');
eq('confusable cyrillique с',       normalize('сonnard', 'fr'), 'connard');
eq('confusable cyrillique а+о',     normalize('cаsseroо', 'fr'), 'casseroo');
eq('leet 0→o',                      normalize('c0nnard', 'fr'), 'connard');
eq('leet 4→a',                      normalize('conn4rd', 'fr'), 'connard');
eq('leet 3→e',                      normalize('m3rde', 'fr'),   'merde');
eq('leet @→a',                      normalize('c@nnard', 'fr'), 'cannard');
eq('leet $→s',                      normalize('$alaud', 'fr'),  'salaud');
eq('leet combiné',                  normalize('c0nn4rd', 'fr'), 'connard');
eq('separateurs points',            normalize('c.o.n.n.a.r.d', 'fr'), 'connard');
eq('separateurs espaces',           normalize('c o n n a r d', 'fr'), 'connard');
eq('separateurs mixtes',            normalize('c.o-n_n a r d', 'fr'), 'connard');
eq('separateurs avec contexte',     normalize('tu es un c.o.n.n.a.r.d.', 'fr'), 'tu es un connard.');
eq('phrase normale intacte',        normalize('je suis content', 'fr'), 'je suis content');
eq('mot court non collapsé',        normalize('a b', 'fr'),     'a b');
eq('cumul leet+confusable+sep',     normalize('с.0.n.n.4.r.d', 'fr'), 'connard');

// ====================================================================
console.log('=== NORMALIZE — grec (el) ===');
// ====================================================================

// JS applique le casing grec spécial : Σ final → ς (sigma final), pas σ.
// C'est la forme correcte pour matcher la wordlist (les termes finissant par
// sigma sont écrits avec ς dans l'orthographe grecque normale).
eq('grec lowercase + sigma final',  normalize('ΜΑΛΑΚΑΣ', 'el'), 'μαλακας');
eq('grec accents stripped',         normalize('μαλάκας', 'el'), 'μαλακας');
// On NE doit PAS appliquer le mapping confusable (la wordlist est en grec) :
eq('grec — α reste α',              normalize('αββ', 'el'),     'αββ');

// ====================================================================
console.log('=== NORMALIZE — arabe (ar) ===');
// ====================================================================

// Tashkeel = diacritiques arabes (fatha, damma, kasra, sukun, shadda, …)
// On les retire pour que `كَلْبٌ` matche `كلب`.
eq('arabe tashkeel stripped',       normalize('كَلْبٌ', 'ar'),    'كلب');
eq('arabe sans diacritique',        normalize('كلب', 'ar'),       'كلب');

// ====================================================================
console.log('=== NORMALIZE — CJK (zh/ja) ===');
// ====================================================================

// NFKC convertit les fullwidth → halfwidth pour empêcher l'évasion via
// caractères larges (ex. fullwidth latin qu'un attaquant insérerait).
eq('zh fullwidth latin → halfwidth', normalize('ＡＢＣ', 'zh'),    'ABC');
eq('ja fullwidth latin → halfwidth', normalize('ＡＢＣ', 'ja'),    'ABC');
eq('zh idéogramme inchangé',         normalize('傻逼', 'zh'),       '傻逼');

// ====================================================================
console.log('=== NORMALIZE — non supporté ===');
// ====================================================================

eq('lang null = passthrough latin', normalize('CON', null),     'con');
eq('input vide',                    normalize('', 'fr'),         '');

// ====================================================================
console.log('=== COMPILE + MATCH end-to-end (fr) ===');
// ====================================================================

const wordlistFr = `
# commentaire ignoré
connard
merde
fils de pute
salaud
`;
const reFr = compileWordlist(wordlistFr, 'fr');

function matchFr(input) {
    const probe = normalize(input, 'fr');
    const m = probe.match(reFr);
    return m ? (m[1] || m[0]) : null;
}

// Cas évidents
eq('match simple',                  matchFr('quel connard'),         'connard');
eq('match casse',                   matchFr('Quel CONNARD'),         'connard');

// Diacritiques
eq('match diacritiques',            matchFr('quel çōnnárd'),         'connard');

// Confusables
eq('match cyrillique с',            matchFr('quel сonnard'),         'connard');

// Leet
eq('match leet 0',                  matchFr('quel c0nnard'),         'connard');
eq('match leet combiné',            matchFr('quel c0nn4rd'),         'connard');

// Séparateurs
eq('match c.o.n.n.a.r.d',           matchFr('quel c.o.n.n.a.r.d'),   'connard');
eq('match c o n n a r d',           matchFr('quel c o n n a r d'),   'connard');
eq('match séparateurs avec point final', matchFr('tu es un c.o.n.n.a.r.d.'), 'connard');

// Cumul
eq('match cumul leet+sep+conf',     matchFr('quel с.0.n.n.4.r.d'),   'connard');

// Multi-mots (trier par longueur avant compile : "fils de pute" doit être pris)
eq('match phrase',                  matchFr('espèce de fils de pute'), 'fils de pute');

// Faux positifs (NE doit PAS matcher)
test('pas de FP "content"',         matchFr('je suis content') === null);
test('pas de FP "encore"',          matchFr('je veux encore') === null);
test('pas de FP "concorde"',        matchFr('place de la concorde') === null);
test('pas de FP "connecte"',        matchFr('je me connecte au site') === null);
// "tu connard" vs "tuconnard" : la séparation par espace simple ne déclenche pas
// le collapse (motif `lettre-sep-lettre` non répété 2 fois), donc le `\b` du
// matcher principal sépare bien `tu` de `connard`.
eq('match "tu connard" sans collapse abusif', matchFr('tu connard'), 'connard');

// ====================================================================
console.log('=== COMPILE + MATCH end-to-end (el — grec) ===');
// ====================================================================

const wordlistEl = `μαλάκας\nκόπανος`;
const reEl = compileWordlist(wordlistEl, 'el');

function matchEl(input) {
    const probe = normalize(input, 'el');
    const m = probe.match(reEl);
    return m ? (m[1] || m[0]) : null;
}

// Le terme est stocké avec accent dans la wordlist, mais après normalisation
// il devient `μαλακας`. L'input "MALÁKAS" en majuscules accentuées doit aussi
// se ramener à `μαλακας` et matcher.
eq('grec — match accentué',         matchEl('είσαι μαλάκας'),         'μαλακας');
eq('grec — match majuscules',       matchEl('ΜΑΛΑΚΑΣ'),               'μαλακας');
eq('grec — match sans accent',      matchEl('εισαι μαλακας'),         'μαλακας');
test('grec — pas de FP',            matchEl('καλημέρα φίλε') === null);

// ====================================================================
console.log('=== COMPILE + MATCH end-to-end (zh) ===');
// ====================================================================

const wordlistZh = `傻逼\n操你妈`;
const reZh = compileWordlist(wordlistZh, 'zh');

function matchZh(input) {
    const probe = normalize(input, 'zh');
    const m = probe.match(reZh);
    return m ? (m[1] || m[0]) : null;
}

// Pas de \b en CJK : substring direct.
eq('zh — match direct',             matchZh('你是傻逼'),               '傻逼');
eq('zh — match avec fullwidth',     matchZh('你是傻逼ＡＢＣ'),         '傻逼');
test('zh — pas de FP',              matchZh('你好世界') === null);

// ====================================================================
console.log('=== Edge case : input vide / wordlist vide ===');
// ====================================================================

eq('compile wordlist vide → null',  compileWordlist('', 'fr'),        null);
eq('compile wordlist commentaires uniquement → null',
                                    compileWordlist('# rien\n# nada', 'fr'), null);

// ====================================================================
console.log(`\n=== RÉSULTAT : ${pass} OK, ${fail} KO ===`);
process.exit(fail > 0 ? 1 : 0);
