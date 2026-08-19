/**
 * @file Hygiène des modules ES — contrôles STRUCTURELS sur tout le code produit.
 *
 * Née d'une régression réelle : lors de la consolidation des fonctions d'échappement,
 * deux modules ont vu leur helper local remplacé par
 *
 *     export { escapeHtml as esc } from '../core/escape.js';
 *
 * `export … from` est une RÉ-EXPORTATION : elle rend le nom disponible aux
 * importateurs mais ne crée AUCUNE liaison dans la portée du module. Les appels
 * internes (`esc(text)` dans `caramelia/utils.js::md`) deviennent des références
 * globales non résolues → `ReferenceError` À L'EXÉCUTION SEULEMENT.
 *
 * Conséquence vécue : le chatbot Caramelia s'ouvrait VIDE, et le module se chargeait
 * sans la moindre erreur. Ni `node --check`, ni un test qui se contente d'importer les
 * modules ne pouvaient le voir.
 *
 * Cette suite parcourt le GRAPHE D'IMPORTS réel depuis les points d'entrée et vérifie,
 * pour chaque module :
 *   1. les ré-exportations n'omettent pas de liaison locale ;
 *   2. tous les imports relatifs se résolvent (fetch 200) ;
 *   3. le module s'importe sans lever ;
 *   4. les noms annoncés à l'export existent réellement à l'exécution.
 *
 * La forme correcte est : `import { x } from '…'; export { x };`
 */

// ============================================================================
// ÉTAT DES TESTS
// ============================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _ctx = { step: 0, stepName: '' };

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, step: _ctx.step, stepName: _ctx.stepName };
    if (!condition) { entry.diagnostic = diagnostic; failCount++; }
    else passCount++;
    results.push(entry);
}
function beginStep(n, name) { _ctx = { step: n, stepName: name }; }
function endStep() { _ctx = { step: 0, stepName: '' }; }

export const STEP_NAMES = {
    1: 'Découverte du graphe de modules',
    2: 'Ré-exportations sans liaison locale',
    3: 'Imports relatifs résolvables',
    4: 'Import effectif de chaque module',
    5: 'Exports annoncés réellement présents',
    6: 'Aucun `catch` totalement muet'
};

export const STEP_DESCRIPTIONS = {
    1: 'Parcourt les imports statiques ET dynamiques depuis les points d\'entrée du produit.',
    2: 'Détecte `export {X} from …` suivi d\'un appel `X(…)` sans `import` correspondant.',
    3: 'Chaque chemin relatif importé doit répondre 200.',
    4: 'Chaque module doit s\'évaluer sans lever.',
    5: 'Chaque nom exporté doit exister sur l\'objet module.',
    6: 'Un `catch {}` sans code NI commentaire avale l\'erreur sans trace ni intention.'
};

// ============================================================================
// OUTILLAGE
// ============================================================================

/** Racine du dépôt vue depuis tests/test-all.html. */
const BASE = new URL('../', new URL(import.meta.url)).href;

/**
 * Points d'entrée du produit. Le reste du graphe est découvert par les imports.
 * Ceux qui ne sont importés par personne (chargés par une balise, ou réservés à un
 * mode particulier) doivent figurer ici — sinon ils échapperaient à tous les contrôles.
 */
const RACINES = [
    'js/main.js',
    'js/embed/embed-bridge.js',
    'js/caramelia/index.js',
    'js/ui/tutorial-modal.js',
    'js/ui/version-checker.js',
    'js/ui/emergency-notification.js',
    'js/ui/animations.js',
    'js/ui/debug-logger.js',
    'js/ui/prompt-mic.js',
    'js/editor/index.js',
    'js/h5p/processors/index.js',
    'js/moodle/processors/index.js',
    'js/moodle/page-themes.js',
    'js/core/package-activity.js'
];

/** Nombre plancher de modules attendus — garde-fou contre un crawl qui s'effondre. */
const PLANCHER_MODULES = 120;

const sources = new Map();   // chemin normalisé → texte source

function normaliser(chemin) {
    const parts = [];
    for (const seg of chemin.split('/')) {
        if (seg === '.' || seg === '') continue;
        if (seg === '..') parts.pop();
        else parts.push(seg);
    }
    return parts.join('/');
}

function resoudre(depuis, relatif) {
    const dossier = depuis.slice(0, depuis.lastIndexOf('/'));
    return normaliser(`${dossier}/${relatif}`);
}

/** Retire les commentaires en CONSERVANT les chaînes (les chemins y vivent). */
function sansCommentaires(src) {
    let out = '', i = 0, n = src.length, chaine = null;
    while (i < n) {
        const c = src[i], d = src[i + 1] ?? '';
        if (chaine === null) {
            if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
            if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
            if (c === '"' || c === "'" || c === '`') { chaine = c; out += c; i++; continue; }
            out += c; i++;
        } else {
            out += c;
            if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
            if (c === chaine) chaine = null;
            i++;
        }
    }
    return out;
}

/** Retire commentaires ET chaînes — pour compter de VRAIS appels de fonction. */
function corpsNu(src) {
    let out = '', i = 0, n = src.length, chaine = null;
    while (i < n) {
        const c = src[i], d = src[i + 1] ?? '';
        if (chaine === null) {
            if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
            if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
            if (c === '"' || c === "'" || c === '`') { chaine = c; i++; continue; }
            out += c; i++;
        } else {
            if (c === '\\') { i += 2; continue; }
            if (c === chaine) chaine = null;
            i++;
        }
    }
    return out;
}

/** Chemins relatifs importés (statiques et dynamiques), commentaires exclus. */
function importsRelatifs(src) {
    const propre = sansCommentaires(src);
    const out = [];
    for (const m of propre.matchAll(/(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g)) out.push(m[1]);
    return out;
}

// ============================================================================
// ÉTAPE 1 — Découverte du graphe
// ============================================================================

async function runStep1_Graphe() {
    beginStep(1, STEP_NAMES[1]);

    const aVisiter = [...RACINES.map(normaliser)];
    const introuvables = [];

    while (aVisiter.length) {
        const chemin = aVisiter.pop();
        if (sources.has(chemin)) continue;
        let texte = null;
        try {
            const rep = await fetch(BASE + chemin);
            if (rep.ok) texte = await rep.text();
            else introuvables.push(`${chemin} (HTTP ${rep.status})`);
        } catch (e) {
            introuvables.push(`${chemin} (${e.message})`);
        }
        if (texte === null) continue;
        sources.set(chemin, texte);
        for (const rel of importsRelatifs(texte)) {
            const cible = resoudre(chemin, rel);
            if (cible.endsWith('.js') && !sources.has(cible)) aVisiter.push(cible);
        }
    }

    assert(introuvables.length === 0,
        '[1.1] Toutes les racines et leurs dépendances sont accessibles',
        { introuvables: introuvables.slice(0, 10) });

    assert(sources.size >= PLANCHER_MODULES,
        `[1.2] Le graphe couvre au moins ${PLANCHER_MODULES} modules (découverts : ${sources.size})`,
        { decouverts: sources.size, plancher: PLANCHER_MODULES });

    // Les racines déclarées doivent exister : une racine morte masquerait un trou.
    for (const r of RACINES) {
        assert(sources.has(normaliser(r)), `[1.3] Racine déclarée présente : ${r}`);
    }

    endStep();
}

// ============================================================================
// ÉTAPE 2 — Ré-exportations sans liaison locale  (LE bug historique)
// ============================================================================

async function runStep2_Reexports() {
    beginStep(2, STEP_NAMES[2]);

    let inspectes = 0;
    const fautifs = [];

    for (const [chemin, src] of sources) {
        const reexportes = new Map();
        for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from\s*['"][^'"]+['"]/g)) {
            for (const part of m[1].split(',')) {
                const brut = part.trim();
                if (!brut) continue;
                reexportes.set(brut.split(/\s+as\s+/).pop().trim(), m[0].replace(/\s+/g, ' '));
            }
        }
        if (!reexportes.size) continue;
        inspectes += reexportes.size;

        // Corps = source privée des déclarations import/export-from, sans chaînes ni commentaires.
        let corps = src
            .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/g, '')
            .replace(/export\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/g, '');
        corps = corpsNu(corps);

        for (const [nom, decl] of reexportes) {
            // Une VRAIE importation du même nom crée la liaison manquante : cas sain.
            const importeLocalement = new RegExp(`import\\s*\\{[^}]*\\b${nom}\\b[^}]*\\}\\s*from`).test(src);
            const appels = (corps.match(new RegExp(`(?<![.\\w])${nom}\\s*\\(`, 'g')) || []).length;
            if (appels > 0 && !importeLocalement) {
                fautifs.push({ chemin, nom, appels, decl });
            }
        }
    }

    for (const f of fautifs) {
        assert(false,
            `[2.x] ${f.chemin} : « ${f.nom} » est ré-exporté mais appelé ${f.appels}× sans liaison locale`,
            {
                declaration: f.decl,
                consequence: 'ReferenceError à l\'exécution — le module se charge pourtant sans erreur',
                correction: `import { ${f.nom} } from '…'; export { ${f.nom} };`
            });
    }

    assert(fautifs.length === 0,
        `[2.1] Aucune ré-exportation sans liaison locale (${inspectes} nom(s) inspecté(s) sur ${sources.size} modules)`,
        { fautifs: fautifs.map(f => `${f.chemin}:${f.nom}`) });

    endStep();
}

// ============================================================================
// ÉTAPE 3 — Imports relatifs résolvables
// ============================================================================

async function runStep3_Imports() {
    beginStep(3, STEP_NAMES[3]);

    const casses = [];
    let total = 0;

    for (const [chemin, src] of sources) {
        for (const rel of importsRelatifs(src)) {
            total++;
            const cible = resoudre(chemin, rel);
            // Les modules .js du graphe sont déjà chargés ; on ne re-fetch que le reste
            // (json, css importés dynamiquement…).
            if (sources.has(cible)) continue;
            try {
                const rep = await fetch(BASE + cible, { method: 'HEAD' });
                if (!rep.ok) casses.push(`${chemin} → ${rel} (HTTP ${rep.status})`);
            } catch (e) {
                casses.push(`${chemin} → ${rel} (${e.message})`);
            }
        }
    }

    assert(casses.length === 0,
        `[3.1] Les ${total} imports relatifs du graphe se résolvent tous`,
        { casses: casses.slice(0, 10) });

    endStep();
}

// ============================================================================
// ÉTAPE 4 — Import effectif de chaque module
// ============================================================================

/**
 * Modules à NE PAS importer isolément : leur simple évaluation a des effets de bord
 * globaux (installation de listeners, démarrage de l'application) qui perturberaient
 * les autres suites de `test-all.html`.
 */
const NE_PAS_IMPORTER = new Set(['js/main.js']);

/**
 * Modules qui S'AUTO-DÉMARRENT à l'import (effet de bord au chargement du module,
 * pas au premier appel). Les importer reste VOULU — c'est le seul endroit qui prouve
 * que leur boot ne lève pas, et c'est exactement la classe de panne qui avait laissé
 * passer la régression Caramelia. Mais leur effet de bord doit être annulé ensuite :
 * ils montent leur interface dans `document.body`, et la page de tests n'a pas leur
 * CSS — d'où un widget Caramelia brut, non stylé, en bas de test-all.html (constaté
 * 2026-07-31). Cosmétique, mais trompeur à la lecture, et un widget vivant dans la
 * page de tests peut interférer avec les suites suivantes (écouteurs, minuteurs).
 */
const AUTO_DEMARRANTS = ['js/caramelia/index.js'];

async function runStep4_ImportEffectif() {
    beginStep(4, STEP_NAMES[4]);

    const echecs = [];
    let importes = 0;

    // Photo du DOM AVANT : tout nœud racine apparu pendant les imports est un effet
    // de bord, et sera retiré. Générique — vaut pour tout module à auto-démarrage,
    // présent ou futur, sans avoir à le nommer.
    const avantBody = new Set(document.body.children);
    const avantHead = new Set(document.head.children);

    // Même chose pour les MINUTEURS, qui ne vivent pas dans le DOM : `setInterval`
    // s'enregistre sur la fenêtre, pas sur un élément. Retirer le widget d'un module
    // à auto-démarrage n'arrête donc PAS sa boucle — celle de Caramelia
    // (`watchLanguageChanges`, sondage de la langue toutes les 2 s) continuait de
    // tourner dans test-all.html après le nettoyage du DOM.
    //
    // Elle est inoffensive (la langue ne change jamais ici, la boucle compare deux
    // variables et s'arrête), mais un test doit rendre la page telle qu'il l'a
    // trouvée. On note les minuteurs créés PENDANT les imports pour les annuler
    // après — les autres, posés par la page de tests elle-même, ne sont pas touchés.
    const minuteursPoses = [];
    const vraiSetInterval = window.setInterval;
    window.setInterval = function (...args) {
        const id = vraiSetInterval.apply(window, args);
        minuteursPoses.push(id);
        return id;
    };

    for (const chemin of [...sources.keys()].sort()) {
        if (NE_PAS_IMPORTER.has(chemin)) continue;
        try {
            await import(BASE + chemin);
            importes++;
        } catch (e) {
            echecs.push(`${chemin} : ${e.message}`);
        }
    }

    assert(echecs.length === 0,
        `[4.1] Les ${importes} modules du graphe s'importent sans lever`,
        { echecs: echecs.slice(0, 10) });

    // Les modules à auto-démarrage bootent de façon asynchrone (Caramelia charge sa
    // locale avant de créer le widget) : on laisse le boot se terminer, sinon le
    // nettoyage passerait AVANT l'injection et le widget réapparaîtrait après.
    // Le sondage de langue de Caramelia est posé APRÈS la création du widget : on
    // garde donc l'interception active pendant toute l'attente, sinon le minuteur
    // serait posé hors surveillance et échapperait au nettoyage.
    const limite = Date.now() + 3000;
    while (Date.now() < limite && !document.getElementById('caramelia-fab')) {
        await new Promise(r => setTimeout(r, 100));
    }

    window.setInterval = vraiSetInterval;
    for (const id of minuteursPoses) clearInterval(id);

    const injectes = [
        ...[...document.body.children].filter(n => !avantBody.has(n)),
        ...[...document.head.children].filter(n => !avantHead.has(n))
    ];
    for (const n of injectes) n.remove();

    assert(document.querySelector('.caramelia-fab, .caramelia-panel') === null,
        '[4.2] Aucun widget à auto-démarrage ne subsiste dans la page de tests',
        {
            injectes: injectes.length,
            auto: AUTO_DEMARRANTS,
            consequence: 'un widget non stylé s\'affiche en bas de test-all.html et ses '
                + 'écouteurs restent actifs pendant les suites suivantes'
        });

    assert(true,
        `[4.3] ${injectes.length} nœud(s) injecté(s) par les modules à auto-démarrage, retiré(s)`,
        { injectes: injectes.map(n => n.id || n.className || n.tagName).slice(0, 10) });

    assert(window.setInterval === vraiSetInterval,
        '[4.4] setInterval natif restauré (l\'interception ne déborde pas sur les suites suivantes)');

    assert(true,
        `[4.5] ${minuteursPoses.length} minuteur(s) posé(s) à l'import, annulé(s)`,
        {
            minuteurs: minuteursPoses.length,
            connu: 'watchLanguageChanges() de Caramelia — sondage de la langue toutes les 2 s'
        });

    endStep();
}

// ============================================================================
// ÉTAPE 5 — Les exports annoncés existent vraiment
// ============================================================================

async function runStep5_ExportsPresents() {
    beginStep(5, STEP_NAMES[5]);

    const manquants = [];
    let verifies = 0;

    for (const chemin of [...sources.keys()].sort()) {
        if (NE_PAS_IMPORTER.has(chemin)) continue;
        const src = sources.get(chemin);

        // Noms exportés déclarés par `export function/const/class X` et `export { … }`.
        const noms = new Set();
        for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/gm)) noms.add(m[1]);
        for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) {
            for (const part of m[1].split(',')) {
                const alias = part.trim().split(/\s+as\s+/).pop().trim();
                if (alias && alias !== 'default') noms.add(alias);
            }
        }
        if (!noms.size) continue;

        let mod;
        try { mod = await import(BASE + chemin); } catch { continue; }   // déjà signalé à l'étape 4
        for (const nom of noms) {
            verifies++;
            if (!(nom in mod)) manquants.push(`${chemin} : « ${nom} » annoncé mais absent du module`);
            else if (mod[nom] === undefined) manquants.push(`${chemin} : « ${nom} » exporté mais vaut undefined`);
        }
    }

    assert(manquants.length === 0,
        `[5.1] Les ${verifies} noms exportés existent tous à l'exécution`,
        { manquants: manquants.slice(0, 10) });

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

// ============================================================================
// ÉTAPE 6 — Aucun `catch` totalement muet
// ============================================================================

/**
 * Un `catch` vide avale l'erreur sans laisser la moindre trace : ni log, ni
 * commentaire disant que c'est voulu. À la lecture, impossible de distinguer
 * « on ignore volontairement ce cas » d'un oubli — et au diagnostic, la panne est
 * invisible.
 *
 * La convention du dépôt est de TOUJOURS déclarer l'intention, sous l'une des deux
 * formes acceptées ici :
 *     } catch { /* déjà démonté *​/ }        ← silence assumé et documenté
 *     } catch (e) { debugLog('mod', …); }   ← trace en ?debug
 *
 * Seule la forme totalement muette — ni code, ni commentaire — est refusée. Le
 * contrôle porte sur la source BRUTE, précisément pour que le commentaire compte.
 */
async function runStep6_CatchMuets() {
    beginStep(6, STEP_NAMES[6]);

    const MUET = /catch\s*(\([^)]*\))?\s*\{[ \t\r\n]*\}/g;
    const fautifs = [];
    let silencesDocumentes = 0;

    for (const [chemin, src] of sources) {
        // Les chaînes peuvent contenir du faux code ; les commentaires, eux, doivent
        // rester (ce sont eux qui distinguent un silence assumé d'un oubli).
        const sansChaines = src.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');

        for (const m of sansChaines.matchAll(MUET)) {
            const ligne = sansChaines.slice(0, m.index).split('\n').length;
            fautifs.push(`${chemin}:${ligne}`);
        }
        silencesDocumentes += (sansChaines.match(/catch\s*(\([^)]*\))?\s*\{\s*\/[/*]/g) || []).length;
    }

    assert(sources.size > 0, '[6.1] Des modules ont été collectés à l\'étape 1', sources.size);

    assert(fautifs.length === 0,
        `[6.2] Aucun \`catch\` muet dans les ${sources.size} modules du produit`,
        {
            fautifs,
            correction: 'ajouter soit un commentaire expliquant le silence, soit un debugLog(…)'
        });

    // Informatif : la population de silences ASSUMÉS est légitime et nombreuse
    // (imports optionnels, nettoyage best-effort). On la mesure pour que la règle se
    // lise comme « documenter », pas comme « ne jamais ignorer ».
    assert(true,
        `[6.3] ${silencesDocumentes} silence(s) assumé(s) et documenté(s) — forme acceptée`,
        { silencesDocumentes });

    endStep();
}

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;
    sources.clear();

    console.log('=== Hygiène des modules ===');

    await runStep1_Graphe();
    await runStep2_Reexports();
    await runStep3_Imports();
    await runStep4_ImportEffectif();
    await runStep5_ExportsPresents();
    await runStep6_CatchMuets();

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL (${sources.size} modules) ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
