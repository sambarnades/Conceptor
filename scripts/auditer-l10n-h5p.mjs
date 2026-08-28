/**
 * auditer-l10n-h5p.mjs — Où les activités Caramel restent-elles en anglais ?
 *
 * Une bibliothèque H5P porte ses libellés d'interface dans son `semantics.json`,
 * sous forme de champs `text` munis d'un `default` ANGLAIS. Si le `content.json`
 * produit par Caramel ne fournit pas la valeur, la lib retombe silencieusement sur
 * ce défaut : l'élève voit de l'anglais au milieu d'une activité française, sans
 * qu'aucun test ne le signale.
 *
 * Deux familles d'anomalies sont détectées :
 *
 *   MANQUANT — champ à défaut anglais que le contenu ne renseigne pas.
 *   JETON    — champ renseigné, mais avec des marqueurs de substitution qui ne sont
 *              pas ceux attendus par la lib (`:num` vs `@slide`…). Pire que l'anglais :
 *              le marqueur s'affiche tel quel (« Diapositive @slide sur @total »).
 *
 * DEUXIÈME PASSE — les semantics ne disent pas tout. Certaines bibliothèques portent
 * des libellés UNIQUEMENT dans l'objet `defaults` de leur JavaScript, sans entrée de
 * semantics correspondante : `H5P.Flashcards.informationText` (« Information », infobulle
 * du bouton d'indice) en est l'exemple. Aucun contrôle basé sur `semantics.json` ne peut
 * les voir. La seconde passe lit donc les défauts DANS LE CODE des libs et les confronte
 * au contenu produit. Elle est plus bruyante (elle attrape aussi des défauts de contenu,
 * comme `question: "No question text provided"`) : ses résultats se relisent à la main.
 *
 * L'audit exécute le VRAI pipeline (healer → processeur) sur les fixtures d'exemple,
 * puis descend RÉCURSIVEMENT dans les sous-activités (`library` + `params` : questions
 * d'un Quiz, éléments d'une Course Presentation, chapitres d'un Livre interactif),
 * chacune étant confrontée aux semantics de SA propre bibliothèque.
 *
 * Lancement :  node scripts/auditer-l10n-h5p.mjs [--module=X] [--tout]
 *   --tout : liste aussi les champs facultatifs jamais renseignés (bruit élevé).
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIBS = join(ROOT, 'js/vendor/h5p-libs');

await import('../tests/roundtrip/bootstrap.mjs');
const { listFixtures } = await import('../tests/roundtrip/fixtures-map.mjs');
const healer = await import('../js/h5p/json-healer.js');
const { processH5PContent, getModuleMetadata } = await import('../js/h5p/processors/index.js');
const { h5pModules } = await import('../js/core/definitions.js');

const argv = process.argv.slice(2);
const FILTRE = (argv.find(a => a.startsWith('--module=')) || '').replace('--module=', '');
const TOUT = argv.includes('--tout');

// --------------------------------------------------------------- semantics
const cacheSem = new Map();
/**
 * Champs porteurs d'un libellé d'interface : type `text` avec un `default`
 * non vide. Renvoie une Map chemin → { defaut, jetons }.
 */
async function libellesDe(dossier) {
    if (cacheSem.has(dossier)) return cacheSem.get(dossier);
    let sem;
    try { sem = JSON.parse(await readFile(join(LIBS, dossier, 'semantics.json'), 'utf8')); }
    catch { cacheSem.set(dossier, null); return null; }
    const out = new Map();
    // Un LIBELLÉ d'interface, ce n'est pas n'importe quel `text` muni d'un défaut :
    //  - un `widget` (colorSelector, html…) désigne une VALEUR ou du CONTENU éditable,
    //    pas une chaîne d'interface (`rgb(255,255,255)`, `<p></p>`) ;
    //  - un groupe `optional` (partage social d'une Course Presentation, piloté par un
    //    `showWhen`) n'est jamais rendu tant que l'utilisateur ne l'active pas ;
    //  - un défaut sans mot d'au moins 3 lettres n'est pas une phrase (`en`, `h5p`).
    const walk = (champs, pre = '', conditionnel = false) => {
        for (const c of champs) {
            const n = pre + (c.name ?? '?');
            const sousConditionnel = conditionnel || !!c.optional || !!c.widget;
            if (c.type === 'text' && !c.widget && !sousConditionnel
                && typeof c.default === 'string' && motReel(c.default)) {
                out.set(n, { defaut: c.default, jetons: jetonsDe(c.default), optionnel: !!c.optional });
            }
            if (Array.isArray(c.fields)) walk(c.fields, n + '.', sousConditionnel);
            if (c.field) walk([c.field], n + '.', sousConditionnel);
        }
    };
    walk(sem);
    cacheSem.set(dossier, out);
    return out;
}

/** Le défaut contient-il une vraie phrase (≥1 mot de 3 lettres hors balises et jetons) ? */
function motReel(d) {
    const nu = d.replace(/<[^>]*>/g, ' ').replace(/[:@%][a-zA-Z][a-zA-Z0-9_]*/g, ' ');
    return /[A-Za-zÀ-ÿ]{3,}/.test(nu);
}

/**
 * Gravité d'un libellé non fourni.
 *  - `inatteignable` : dialogue de confirmation alors que le réglage `behaviour`
 *    correspondant est faux — Caramel les met explicitement à `false`, l'élève ne
 *    verra JAMAIS ces chaînes. Les compter serait gonfler artificiellement le constat.
 *  - `a11y` : restitué par un lecteur d'écran uniquement (jamais affiché).
 *  - `visible` : lu à l'écran par tout le monde.
 */
function gravite(champ, params) {
    const m = champ.match(/^confirm(Check|Retry)\./);
    if (m) {
        const flag = `confirm${m[1]}Dialog`;
        const b = params && params.behaviour;
        if (!b || b[flag] !== true) return 'inatteignable';
    }
    if (/(^|\.)a11y/i.test(champ)) return 'a11y';
    return 'visible';
}

/** Marqueurs de substitution d'une chaîne : `:nom`, `@nom`, `%nom`. */
function jetonsDe(s) {
    return new Set((s.match(/[:@%][a-zA-Z][a-zA-Z0-9_]*/g) || []).map(x => x.toLowerCase()));
}

/** Valeur à un chemin pointé, en traversant les tableaux (renvoie la 1re trouvée). */
function valeurA(obj, chemin) {
    const parts = chemin.split('.');
    let cur = [obj];
    for (const p of parts) {
        const suiv = [];
        for (const o of cur) {
            if (o === null || typeof o !== 'object') continue;
            if (Array.isArray(o)) { for (const it of o) if (it && typeof it === 'object' && p in it) suiv.push(it[p]); }
            else if (p in o) suiv.push(o[p]);
        }
        if (!suiv.length) return undefined;
        cur = suiv;
    }
    return cur[0];
}

// --------------------------------------------------------------- pipeline
function parseFixture(raw) {
    try { return JSON.parse(raw); } catch { return JSON.parse(healer.healJsonString(raw)); }
}
function healFull(o, k) {
    let x = healer.healJsonObject(structuredClone(o), k);
    x = healer.healActivitySpecificFields(x, k);
    return healer.healStructureForActivity(x, k);
}

/** `H5P.MultiChoice 1.16` → `H5P.MultiChoice-1.16`. */
const dossierDe = (uber) => uber.trim().replace(/\s+/, '-');


// ═════════════ 2e passe : défauts internes au JavaScript des bibliothèques ═════════════

import { readdirSync, statSync, readFileSync } from 'node:fs';

/** Un fichier est-il du source LISIBLE (non minifié) ? */
function lisible(txt) {
    const l = txt.split('\n');
    return l.length > 3 && (txt.length / l.length) < 300;
}

/** Extrait le bloc `{ … }` équilibré qui suit l'index donné. */
function blocAccolades(src, depuis) {
    const i = src.indexOf('{', depuis);
    if (i < 0) return '';
    let d = 0;
    for (let k = i; k < src.length; k++) {
        if (src[k] === '{') d++;
        else if (src[k] === '}') { d--; if (d === 0) return src.slice(i, k + 1); }
    }
    return '';
}

/**
 * Libellés anglais codés dans les objets de défaut d'une bibliothèque.
 * Trois motifs couvrent l'ensemble du catalogue : `var defaults = {`,
 * `$.extend({}, {` (Flashcards) et `l10n = H5P.jQuery.extend({` (SingleChoiceSet).
 */
function defautsJs(dossier) {
    const out = new Map();
    let racine;
    try { racine = join(LIBS, dossier); statSync(racine); } catch { return out; }
    const pile = [racine];
    while (pile.length) {
        const d = pile.pop();
        for (const e of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) { if (e.name !== 'language') pile.push(p); continue; }
            if (!e.name.endsWith('.js')) continue;
            let src;
            try { src = readFileSync(p, 'utf8'); } catch { continue; }
            if (!lisible(src)) continue;
            for (const motif of [/var\s+defaults\s*=\s*/g, /\.extend\(\s*(?:true\s*,\s*)?\{\}\s*,\s*/g, /l10n\s*=\s*[\w.$]*extend\(/g]) {
                for (const m of src.matchAll(motif)) {
                    const b = blocAccolades(src, m.index + m[0].length - 1);
                    for (const kv of b.matchAll(/(\w+):\s*(['"])((?:[^'"\\]|\\.)*)\2/g)) {
                        if (/[A-Za-z]{3,}/.test(kv[3])) out.set(kv[1], kv[3]);
                    }
                }
            }
        }
    }
    return out;
}

/** Toutes les clés portant une chaîne non vide dans le contenu produit. */
function clesRemplies(o, acc = new Set()) {
    if (Array.isArray(o)) { for (const x of o) clesRemplies(x, acc); return acc; }
    if (o && typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) {
            if (typeof v === 'string' && v.trim()) acc.add(k);
            clesRemplies(v, acc);
        }
    }
    return acc;
}

const anomalies = [];
const jsSeuls = [];
const vus = new Set();

/** Confronte un bloc de params aux libellés de sa bibliothèque. */
async function auditer(params, dossierLib, contexte) {
    if (!params || typeof params !== 'object') return;
    const libelles = await libellesDe(dossierLib);
    if (libelles) {
        for (const [chemin, { defaut, jetons, optionnel }] of libelles) {
            const v = valeurA(params, chemin);
            if (v === undefined || v === null || v === '') {
                const g = gravite(chemin, params);
                if ((!optionnel || TOUT) && (g !== 'inatteignable' || TOUT)) {
                    anomalies.push({ type: 'MANQUANT', gravite: g, contexte, lib: dossierLib, champ: chemin, defaut });
                }
            } else if (typeof v === 'string' && jetons.size) {
                const nos = jetonsDe(v);
                const absents = [...jetons].filter(j => !nos.has(j));
                if (absents.length) {
                    anomalies.push({ type: 'JETON', contexte, lib: dossierLib, champ: chemin, defaut, valeur: v, attendus: [...jetons], absents });
                }
            }
        }
    }
    // Descente récursive dans les sous-activités { library, params }
    const pile = [params];
    while (pile.length) {
        const n = pile.pop();
        if (!n || typeof n !== 'object') continue;
        if (Array.isArray(n)) { pile.push(...n); continue; }
        if (typeof n.library === 'string' && n.params && typeof n.params === 'object') {
            const d = dossierDe(n.library);
            const cle = `${contexte}|${d}`;
            if (!vus.has(cle)) { vus.add(cle); await auditer(n.params, d, `${contexte} › ${n.library}`); }
            continue;
        }
        pile.push(...Object.values(n));
    }
}

// ------------------------------------------------------------------- run
const fixtures = await listFixtures('h5p');
const parModule = new Map();
for (const f of fixtures) if (!parModule.has(f.moduleKey)) parModule.set(f.moduleKey, f);
const cles = Object.keys(h5pModules)
    .filter(k => !h5pModules[k].hidden && parModule.has(k))
    .filter(k => !FILTRE || k === FILTRE);

for (const cle of cles) {
    const f = parModule.get(cle);
    const meta = getModuleMetadata(cle);
    if (!meta) continue;
    let contenu;
    try {
        const brut = parseFixture(await readFile(f.path, 'utf8'));
        const r = await processH5PContent(cle, healFull(brut, cle));
        contenu = (r && r.content && r.dependencies) ? r.content : r;
    } catch (e) {
        console.log(`⚠ ${cle} : pipeline en échec (${String(e.message).slice(0, 70)})`);
        continue;
    }
    vus.clear();
    const dossierPrincipal = `${meta.machineName}-${meta.version.major}.${meta.version.minor}`;
    await auditer(contenu, dossierPrincipal, cle);

    // 2e passe : défauts vivant UNIQUEMENT dans le JS de la lib
    const D = defautsJs(dossierPrincipal);
    if (D.size) {
        const remplies = clesRemplies(contenu);
        const sem = await libellesDe(dossierPrincipal);
        const nomsSem = new Set([...(sem || new Map()).keys()].map(x => x.split('.').pop()));
        for (const [k, en] of D) {
            if (remplies.has(k) || nomsSem.has(k)) continue;   // déjà couvert par la 1re passe
            jsSeuls.push({ module: cle, lib: dossierPrincipal, champ: k, defaut: en });
        }
    }
}

// ---------------------------------------------------------------- rapport
const jetons = anomalies.filter(a => a.type === 'JETON');
const manquants = anomalies.filter(a => a.type === 'MANQUANT');

if (jetons.length) {
    console.log('\n🔴 JETONS DE SUBSTITUTION INCOHÉRENTS — le marqueur s\'affiche tel quel à l\'élève');
    for (const a of jetons) {
        console.log(`   ${a.contexte}`);
        console.log(`      ${a.champ}  attendu ${a.attendus.join(', ')}  →  absent : ${a.absents.join(', ')}`);
        console.log(`      nous écrivons : ${JSON.stringify(a.valeur)}`);
        console.log(`      la lib attend : ${JSON.stringify(a.defaut)}`);
    }
}
const visibles = manquants.filter(a => a.gravite === 'visible');
const a11y = manquants.filter(a => a.gravite === 'a11y');
const rendre = (titre, lst) => {
    if (!lst.length) return;
    console.log(titre);
    const parCtx = new Map();
    for (const a of lst) {
        if (!parCtx.has(a.contexte)) parCtx.set(a.contexte, []);
        parCtx.get(a.contexte).push(a);
    }
    for (const [ctx, l] of parCtx) {
        console.log(`   ${ctx}  (${l.length})`);
        for (const a of l) console.log(`      ${a.champ.padEnd(42)} défaut « ${a.defaut} »`);
    }
};
rendre('\n🟠 LIBELLÉS VISIBLES laissés en anglais — la lib retombe sur son défaut', visibles);
rendre('\n🟡 LIBELLÉS D\'ACCESSIBILITÉ laissés en anglais — lecteurs d\'écran uniquement', a11y);
if (jsSeuls.length) {
    console.log("\n🟣 LIBELLÉS DÉFINIS SEULEMENT DANS LE CODE DE LA LIB (invisibles des semantics)");
    console.log("   À relire : certains sont des défauts de CONTENU, pas des libellés d'interface.");
    for (const a of jsSeuls) console.log(`   ${a.module.padEnd(20)}${a.champ.padEnd(30)} « ${a.defaut.slice(0, 60)} »`);
}
console.log('\n' + '='.repeat(72));
console.log(`${jetons.length} jeton(s) incohérent(s) · ${visibles.length} libellé(s) VISIBLE(s) en anglais · ${a11y.length} libellé(s) d'accessibilité en anglais`);
console.log(`${jsSeuls.length} libellé(s) présent(s) seulement dans le code des bibliothèques (à relire)`);
console.log("(les dialogues de confirmation sont exclus : Caramel les désactive — `--tout` pour les voir)");
console.log('='.repeat(72));
