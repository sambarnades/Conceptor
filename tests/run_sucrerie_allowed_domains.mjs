/**
 * Tests de la whitelist de dépôt du pont Sucrerie
 * (cf. js/sucrerie-bridge/services/allowed-domains.js).
 *
 * Exécuter avec : node tests/run_sucrerie_allowed_domains.mjs
 *
 * Né de la régression du 2026-08-16 : le pont validait l'email avec une regex
 * FIGÉE (`config.js > emailDomainPattern`), copie périmée de la table
 * `sucrerie.allowed_domain`. Elle refusait 30 des 79 domaines réellement
 * autorisés — dont `ac-noumea.nc` — et le refus était un blocage DUR, sans
 * jamais appeler le backend. Une enseignante de l'académie de Nouvelle-Calédonie,
 * autorisée depuis le 2026-06-02, a dû déposer une demande d'accès le 2026-08-04.
 *
 * Couvre :
 *   - les deux sémantiques de `kind='exact'` (domaine entier vs adresse seule)
 *   - `kind='suffix'` et ses wildcards
 *   - l'anti-spoofing (`@ac-noumea.nc.evil.com`, `@fauxac-noumea.nc`)
 *   - le chargement : réponse `{domains}` ou tableau nu, sanitisation, mémoïsation,
 *     fail-closed, et RELÂCHEMENT de la promesse après échec (retry possible)
 *   - NON-RÉGRESSION : plus aucune liste de domaines en dur dans le pont.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const {
    matchSingleDomain, matchAgainstDomains,
    ensureAllowedDomainsLoaded, areAllowedDomainsLoaded, isEmailAllowed,
    _resetAllowedDomainsCache
} = await import('../js/sucrerie-bridge/services/allowed-domains.js');

let pass = 0, fail = 0;
function test(name, condition) {
    if (condition) { pass++; }
    else { fail++; console.log('  FAIL:', name); }
}
function eq(name, actual, expected) {
    if (actual === expected) { pass++; }
    else {
        fail++;
        console.log(`  FAIL: ${name}\n    attendu: ${JSON.stringify(expected)}\n    obtenu : ${JSON.stringify(actual)}`);
    }
}

const exact = p => ({ pattern: p, kind: 'exact' });

// ====================================================================
console.log("=== kind='exact' SANS @ — tout le domaine ===");
// ====================================================================

test('ac-noumea.nc autorise ses adresses',
    matchSingleDomain('irma.martinez-dubla1@ac-noumea.nc', exact('ac-noumea.nc')));
test('ac-polynesie.pf',  matchSingleDomain('prof@ac-polynesie.pf', exact('ac-polynesie.pf')));
test('ac-wf.wf',         matchSingleDomain('prof@ac-wf.wf',        exact('ac-wf.wf')));
test('education.pf',     matchSingleDomain('prof@education.pf',    exact('education.pf')));
test('unige.ch',         matchSingleDomain('prof@unige.ch',        exact('unige.ch')));
test('uqtr.ca',          matchSingleDomain('prof@uqtr.ca',         exact('uqtr.ca')));
test('casse ignorée',    matchAgainstDomains('PROF@AC-NOUMEA.NC', [exact('ac-noumea.nc')]));
test('espaces ignorés',  matchAgainstDomains('  prof@ac-noumea.nc  ', [exact('ac-noumea.nc')]));

// ----- anti-spoofing : la faille qui a fait supprimer les wildcards -----
test('sous-domaine REFUSÉ',
    !matchSingleDomain('x@etu.ac-noumea.nc', exact('ac-noumea.nc')));
test('suffixe malveillant REFUSÉ',
    !matchSingleDomain('x@ac-noumea.nc.evil.com', exact('ac-noumea.nc')));
test('domaine préfixé REFUSÉ',
    !matchSingleDomain('x@fauxac-noumea.nc', exact('ac-noumea.nc')));
test('sans @ REFUSÉ',
    !matchAgainstDomains('ac-noumea.nc', [exact('ac-noumea.nc')]));

// ====================================================================
console.log("=== kind='exact' AVEC @ — cette adresse SEULE ===");
// ====================================================================

test('adresse nominative exacte',
    matchSingleDomain('josepgalan@ivic.cat', exact('josepgalan@ivic.cat')));
test('nominatif — casse ignorée',
    matchAgainstDomains('JosepGalan@IVIC.cat', [exact('josepgalan@ivic.cat')]));
test('nominatif — autre compte du même domaine REFUSÉ',
    !matchSingleDomain('autre@ivic.cat', exact('josepgalan@ivic.cat')));
test('nominatif — sous-adressage + REFUSÉ',
    !matchSingleDomain('josepgalan+sucrerie@ivic.cat', exact('josepgalan@ivic.cat')));
test('nominatif — n ouvre PAS le domaine',
    !matchSingleDomain('burhan2@pitt.edu', exact('burhan@pitt.edu')));

// ====================================================================
console.log("=== kind='suffix' — wildcards ===");
// ====================================================================

const suffix = p => ({ pattern: p, kind: 'suffix' });
test('ac-*.fr matche ac-grenoble.fr',
    matchSingleDomain('prof@ac-grenoble.fr', suffix('ac-*.fr')));
test('* ne traverse PAS un point',
    !matchSingleDomain('prof@ac-a.b.fr', suffix('ac-*.fr')));
test('partie locale pointée OK quand le pattern n a pas de @',
    matchSingleDomain('jean.dupont@ac-grenoble.fr', suffix('ac-*.fr')));
test('partie locale vide REFUSÉE',
    !matchSingleDomain('@ac-grenoble.fr', suffix('ac-*.fr')));
// Pattern AVEC @ : le `*` de la partie locale garde la règle « pas de point ».
test('wildcard en partie locale',
    matchSingleDomain('jean@example.fr', suffix('*@example.fr')));
test('wildcard local ne traverse PAS un point',
    !matchSingleDomain('jean.dupont@example.fr', suffix('*@example.fr')));

// ====================================================================
console.log('=== Entrées invalides ===');
// ====================================================================

test('liste vide → refus',       !matchAgainstDomains('prof@ac-noumea.nc', []));
test('liste null → refus',       !matchAgainstDomains('prof@ac-noumea.nc', null));
test('email vide → refus',       !matchAgainstDomains('', [exact('ac-noumea.nc')]));
test('email non-string → refus', !matchAgainstDomains(null, [exact('ac-noumea.nc')]));
test('kind inconnu → refus',
    !matchSingleDomain('prof@ac-noumea.nc', { pattern: 'ac-noumea.nc', kind: 'regex' }));

// ====================================================================
console.log('=== Chargement de la liste ===');
// ====================================================================

const realFetch = globalThis.fetch;
function stubFetch(impl) { globalThis.fetch = impl; }
function jsonResponse(body) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}

// --- fail-closed AVANT chargement ---
_resetAllowedDomainsCache();
test('fail-closed : rien chargé → isEmailAllowed false',
    !isEmailAllowed('prof@ac-noumea.nc'));
test('fail-closed : areAllowedDomainsLoaded false',
    !areAllowedDomainsLoaded());

// --- forme { domains: [...] } (celle du workflow B) ---
_resetAllowedDomainsCache();
let calls = 0;
stubFetch(() => { calls++; return jsonResponse({ domains: [{ pattern: 'ac-noumea.nc', kind: 'exact' }] }); });
let list = await ensureAllowedDomainsLoaded();
eq('forme {domains} → 1 entrée', list.length, 1);
test('après chargement : ac-noumea.nc autorisé', isEmailAllowed('prof@ac-noumea.nc'));
test('après chargement : gmail refusé',          !isEmailAllowed('prof@gmail.com'));
test('areAllowedDomainsLoaded true',             areAllowedDomainsLoaded());

// --- mémoïsation : un seul appel réseau ---
await ensureAllowedDomainsLoaded();
await ensureAllowedDomainsLoaded();
eq('mémoïsé : 1 seul fetch', calls, 1);

// --- tableau nu (tolérance de forme) ---
_resetAllowedDomainsCache();
stubFetch(() => jsonResponse([{ pattern: 'unige.ch', kind: 'exact' }]));
list = await ensureAllowedDomainsLoaded();
eq('tableau nu accepté', list.length, 1);

// --- sanitisation : entrées malformées écartées ---
_resetAllowedDomainsCache();
stubFetch(() => jsonResponse({ domains: [
    { pattern: 'ac-noumea.nc', kind: 'exact' },
    { pattern: 'sans-kind.fr' },
    { kind: 'exact' },
    { pattern: 'mauvais-kind.fr', kind: 'regex' },
    null,
    { pattern: 42, kind: 'exact' }
] }));
list = await ensureAllowedDomainsLoaded();
eq('sanitisation : 1 seule entrée retenue', list.length, 1);
eq('sanitisation : la bonne', list[0].pattern, 'ac-noumea.nc');

// --- échec réseau : pas de cache, promesse relâchée (retry) ---
_resetAllowedDomainsCache();
let attempts = 0;
stubFetch(() => { attempts++; return Promise.reject(new Error('offline')); });
list = await ensureAllowedDomainsLoaded();
eq('échec → liste vide', list.length, 0);
test('échec → areAllowedDomainsLoaded false', !areAllowedDomainsLoaded());
await ensureAllowedDomainsLoaded();
eq('échec → promesse relâchée, retry effectif', attempts, 2);

// --- HTTP non-2xx traité comme un échec ---
_resetAllowedDomainsCache();
stubFetch(() => Promise.resolve({ ok: false, status: 502, json: () => Promise.resolve({}) }));
list = await ensureAllowedDomainsLoaded();
eq('HTTP 502 → liste vide', list.length, 0);

// --- liste vide serveur : refus de mettre en cache un néant ---
_resetAllowedDomainsCache();
stubFetch(() => jsonResponse({ domains: [] }));
list = await ensureAllowedDomainsLoaded();
eq('liste vide serveur → non mise en cache', list.length, 0);
test('liste vide serveur → pas "chargée"', !areAllowedDomainsLoaded());

globalThis.fetch = realFetch;
_resetAllowedDomainsCache();

// ====================================================================
console.log('=== NON-RÉGRESSION : aucune whitelist en dur dans le pont ===');
// ====================================================================

const configSrc = readFileSync(join(ROOT, 'js/sucrerie-bridge/config.js'), 'utf8');
const flowSrc   = readFileSync(join(ROOT, 'js/sucrerie-bridge/ui/deposit-flow.js'), 'utf8');

// Le champ supprimé ne doit revivre nulle part (les mentions en commentaire
// expliquant sa suppression sont tolérées — on cible la DÉCLARATION).
test('config.js ne redéclare pas emailDomainPattern',
    !/^\s*emailDomainPattern\s*:/m.test(configSrc));

// La regex fautive elle-même — sous quelque nom que ce soit — ne doit pas
// servir à AUTORISER. Elle reste légitime dans guessEducationSystemFromEmail
// (heuristique cosmétique de pré-sélection), donc on vérifie que le garde
// d'autorisation passe bien par le service.
test('deposit-flow importe le service de whitelist',
    /from '\.\.\/services\/allowed-domains\.js'/.test(flowSrc));
test('le garde local passe par emailPassesLocalGate',
    /if \(!emailPassesLocalGate\(email\)\) \{/.test(flowSrc));
test('emailPassesLocalGate consulte le service',
    /function emailPassesLocalGate\(email\) \{[\s\S]*?areAllowedDomainsLoaded\(\)[\s\S]*?isEmailAllowed\(email\)/.test(flowSrc));
test('endpoint allowedDomains déclaré',
    /allowedDomains\s*:\s*'https:\/\/[^']*sucrerie-allowed-domains'/.test(configSrc));

// Outre-mer : la pré-sélection « système éducatif français » doit les couvrir.
for (const d of ['ac-noumea.nc', 'ac-polynesie.pf', 'ac-wf.wf', 'education.pf']) {
    test(`frenchEducationExtraDomains contient ${d}`, configSrc.includes(`'${d}'`));
}

// ====================================================================
console.log(`\n=== RÉSULTAT : ${pass} OK, ${fail} KO ===`);
process.exit(fail > 0 ? 1 : 0);
