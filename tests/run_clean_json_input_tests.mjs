/**
 * run_clean_json_input_tests.mjs — Tests unitaires de `cleanJsonInput` (js/core/utils.js).
 *
 * Vérifie que le collage brut d'une IA EXTERNE (prose avant/après, blocs markdown, JSON
 * imbriqué, LaTeX échappé) est réduit au bloc JSON équilibré exploitable — le tout SANS
 * casser les cas déjà propres (idempotence).
 *
 * Lancement :  node tests/run_clean_json_input_tests.mjs
 * Dépendance : bootstrap.mjs (stubs DOM) car utils.js importe translation/notifications/sanitizer.
 */
import './roundtrip/bootstrap.mjs';
const { cleanJsonInput } = await import('../js/core/utils.js');

let pass = 0, fail = 0;
const failures = [];

/** Assert : cleanJsonInput(input) doit produire un JSON qui, une fois parsé, égale `expected`. */
function eqParsed(name, input, expected) {
    const out = cleanJsonInput(input);
    let parsed;
    try { parsed = JSON.parse(out); }
    catch (e) {
        fail++; failures.push(`❌ ${name}\n   JSON.parse a échoué : ${e.message}\n   sortie: ${JSON.stringify(out).slice(0, 160)}`);
        return;
    }
    const a = JSON.stringify(parsed), b = JSON.stringify(expected);
    if (a === b) { pass++; }
    else { fail++; failures.push(`❌ ${name}\n   attendu: ${b}\n   obtenu: ${a}`); }
}

/** Assert : cleanJsonInput(input) === expectedString (comparaison brute). */
function eqStr(name, input, expectedString) {
    const out = cleanJsonInput(input);
    if (out === expectedString) { pass++; }
    else { fail++; failures.push(`❌ ${name}\n   attendu: ${JSON.stringify(expectedString)}\n   obtenu: ${JSON.stringify(out)}`); }
}

const OBJ = { title: 'Test', a: 1 };

// --- 1. Cas déjà propres : idempotence (aucune régression) ---
eqParsed('objet nu déjà propre', '{"title":"Test","a":1}', OBJ);
eqParsed('tableau nu déjà propre', '[1,2,3]', [1, 2, 3]);
eqParsed('objet avec espaces autour', '   \n {"title":"Test","a":1}  \n ', OBJ);

// --- 2. Blocs markdown (comportement historique conservé) ---
eqParsed('fence ```json au début/fin', '```json\n{"title":"Test","a":1}\n```', OBJ);
eqParsed('fence ``` générique', '```\n{"title":"Test","a":1}\n```', OBJ);

// --- 3. NOUVEAU : prose d'IA externe avant/après (sans fence) ---
eqParsed('prose avant', 'Bien sûr ! Voici le JSON demandé :\n{"title":"Test","a":1}', OBJ);
eqParsed('prose après', '{"title":"Test","a":1}\nJ\'espère que cela vous conviendra !', OBJ);
eqParsed('prose avant ET après', 'Voici votre activité :\n{"title":"Test","a":1}\nBonne journée 😊', OBJ);
eqParsed('tableau avec prose', 'Résultat :\n[1,2,3]\nVoilà.', [1, 2, 3]);

// --- 4. NOUVEAU : fence + prose autour du fence ---
eqParsed('prose + fence json + prose',
    'Bien sûr, voici :\n```json\n{"title":"Test","a":1}\n```\nDis-moi si tu veux des modifications.', OBJ);

// --- 5. LaTeX échappé (doit rester intact ; accolades DANS une chaîne ne comptent pas) ---
eqParsed('latex \\frac dans une chaîne',
    'Voici :\n{"q":"Calcule \\\\frac{1}{2} + \\\\frac{1}{3}","a":"\\\\frac{5}{6}"}',
    { q: 'Calcule \\frac{1}{2} + \\frac{1}{3}', a: '\\frac{5}{6}' });

// --- 6. Accolades imbriquées + accolade dans une chaîne après le JSON ---
eqParsed('objet imbriqué + prose contenant une accolade',
    'JSON :\n{"outer":{"inner":[{"x":1}]}}\nNote : utilise {{ }} pour les variables.',
    { outer: { inner: [{ x: 1 }] } });

// --- 7. Guillemets échappés dans une valeur (ne doivent pas fermer la chaîne) ---
eqParsed('guillemet échappé dans une valeur',
    '{"txt":"il a dit \\"bonjour\\" à midi","n":2}',
    { txt: 'il a dit "bonjour" à midi', n: 2 });

// --- 8. Cas dégénérés (pas de régression du contrat vide) ---
eqStr('chaîne vide', '', '');
eqStr('null', null, '');
eqStr('prose sans aucun JSON', 'Désolé, je ne peux pas générer ce contenu.', 'Désolé, je ne peux pas générer ce contenu.');

// --- 9. JSON tronqué (jamais refermé) : on renvoie du 1er { jusqu'à la fin (le healer tentera) ---
eqStr('json tronqué', 'Voici :\n{"title":"Test","a":1', '{"title":"Test","a":1');

// --- 9b. Adversarial : triple backticks DANS une valeur (le garde-fou évite de couper au fence) ---
eqParsed('backticks dans une valeur', '{"code":"```"}', { code: '```' });
// --- 9c. Adversarial : crochet DANS une chaîne (ne doit pas être pris pour un début de tableau) ---
eqParsed('crochet dans une chaîne', '{"note":"utilise [x] ici","n":3}', { note: 'utilise [x] ici', n: 3 });

// --- 10. Idempotence explicite : cleanJsonInput(cleanJsonInput(x)) === cleanJsonInput(x) ---
{
    const messy = 'Voici :\n```json\n{"title":"Test","a":1}\n```\nMerci !';
    const once = cleanJsonInput(messy);
    const twice = cleanJsonInput(once);
    if (once === twice) { pass++; }
    else { fail++; failures.push(`❌ idempotence\n   1x: ${JSON.stringify(once)}\n   2x: ${JSON.stringify(twice)}`); }
}

// --- Rapport ---
console.log(`\n===== cleanJsonInput : ${pass} OK / ${fail} échec(s) =====`);
if (failures.length) {
    console.log('\n' + failures.join('\n\n'));
    process.exit(1);
}
console.log('✅ Tous les tests passent.');
