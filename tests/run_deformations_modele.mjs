/**
 * run_deformations_modele.mjs — Une sortie de modèle légèrement déformée ne doit
 * jamais faire PLANTER la mise en forme d'une activité.
 *
 * Pourquoi (15 sept. 2026) : une activité « Glisser les mots » d'un parcours a été
 * écartée à la livraison parce que le modèle avait rendu `distractors` en LISTE au
 * lieu d'une chaîne ; le processeur levait `cleaned.trim is not a function`. Aucun
 * test ne l'a vu : tous partent des exemples du dépôt, conformes au prompt. Une
 * sonde a ensuite montré que le défaut était général — 150 plantages sur 24 modules,
 * dès qu'un champ texte revenait en liste (la question d'un Vrai/Faux, le texte
 * d'une carte…).
 *
 * Ce banc part de chaque exemple de `assets/data/examples/` et déforme UN champ à la
 * fois, comme le fait un modèle distrait :
 *   - chaîne → liste d'une chaîne      (le cas constaté)
 *   - chaîne → null
 *   - liste de chaînes → chaîne
 *   - nombre ou booléen → texte
 * puis rejoue le chemin de production :
 *   - H5P : réparateur (`healJsonObject`, `healActivitySpecificFields`,
 *     `healStructureForActivity`) puis processeur ;
 *   - Moodle : `healStructureForActivity` puis `construireFichiersActivite` (le
 *     dossier d'activité du .mbz) ; le Test d'Éléa, `canonicalizeTestModel` puis
 *     le XML de sa banque de questions.
 * Sous Node, la mise en page HTML des Pages et des Livres retombe sur le contenu
 * brut (pas de DOM complet) : ces deux-là y sont moins éprouvés que dans l'appli.
 *
 * Un REFUS explicite (message d'erreur du processeur : « au moins trois
 * paragraphes »…) est admis : la fabrication le montre et propose de refaire. Un
 * PLANTAGE (TypeError : `… is not a function`, `Cannot read properties of null`)
 * est un échec du banc.
 *
 * Node seul, sans navigateur (`roundtrip/bootstrap.mjs`) : il tourne en CI.
 *
 * Lancement : node tests/run_deformations_modele.mjs [--detail]
 */
import './roundtrip/bootstrap.mjs';
import { readFileSync } from 'node:fs';
const { listFixtures } = await import('./roundtrip/fixtures-map.mjs');
const { healJsonObject, healActivitySpecificFields, healStructureForActivity } = await import('../js/h5p/json-healer.js');
const { processH5PContent } = await import('../js/h5p/processors/index.js');
const { construireFichiersActivite, typeMoodle } = await import('../js/moodle/mono-activity-files.js');
const { canonicalizeTestModel, generateMoodleXml, reparerConsignesTest } = await import('../js/moodle/moodle-formats.js');
const { healLatexForTest } = await import('../js/moodle/moodle-creator.js');

const DETAIL = process.argv.includes('--detail');
/** Champs techniques que le modèle ne produit pas : on ne les déforme pas. */
const TECHNIQUES = /^(library|subContentId|machineName|mime|path|dataURL|copyright|contentName|metadata|license|extraTitle|authors|changes|id|uuid|_.*)$/;
const PLANTAGE = e => e instanceof TypeError || /is not a function|Cannot read properties|is not iterable/.test(String(e?.message));

/** Les déformations d'un contenu : un champ à la fois, profondeur 4, premier élément des listes. */
function deformations(contenu) {
    const out = [];
    const visiter = (noeud, chemin, profondeur) => {
        if (profondeur > 4 || !noeud || typeof noeud !== 'object') return;
        const entrees = Array.isArray(noeud) ? (noeud.length ? [[0, noeud[0]]] : []) : Object.entries(noeud);
        for (const [cle, val] of entrees) {
            if (!Array.isArray(noeud) && TECHNIQUES.test(cle)) continue;
            const c = [...chemin, cle];
            if (typeof val === 'string') {
                if (/^data:|^https?:|^images\//.test(val)) continue;
                out.push({ chemin: c, type: 'chaîne→liste', valeur: [val] });
                out.push({ chemin: c, type: 'chaîne→null', valeur: null });
            } else if (Array.isArray(val) && val.length && val.every(v => typeof v === 'string')) {
                out.push({ chemin: c, type: 'liste→chaîne', valeur: val.join('\n') });
            } else if (typeof val === 'number') {
                out.push({ chemin: c, type: 'nombre→texte', valeur: String(val) });
            } else if (typeof val === 'boolean') {
                out.push({ chemin: c, type: 'booléen→texte', valeur: String(val) });
            }
            if (val && typeof val === 'object') visiter(val, c, profondeur + 1);
        }
    };
    visiter(contenu, [], 0);
    return out;
}
const poser = (obj, chemin, valeur) => {
    const copie = structuredClone(obj);
    let n = copie;
    for (const k of chemin.slice(0, -1)) n = n[k];
    n[chemin.at(-1)] = valeur;
    return copie;
};

async function miseEnForme(moduleKey, contenu, kind) {
    if (moduleKey === 'test_elea') {
        return generateMoodleXml(canonicalizeTestModel(healLatexForTest(reparerConsignesTest(healStructureForActivity(structuredClone(contenu), moduleKey)))));
    }
    if (kind === 'moodle') {
        return construireFichiersActivite(typeMoodle(moduleKey), healStructureForActivity(structuredClone(contenu), moduleKey));
    }
    let obj = healJsonObject(structuredClone(contenu), moduleKey);
    obj = healActivitySpecificFields(obj, moduleKey);
    obj = healStructureForActivity(obj, moduleKey);
    return processH5PContent(moduleKey, obj);
}

let cas = 0, refus = 0;
const plantages = [];
const temoinsKo = [];
// Les journaux de repli attendus sous Node (pas de DOM complet) ne disent rien ici.
const avertir = console.warn;
console.warn = (...a) => { if (!/not available|DOMPurify/.test(String(a[0]))) avertir(...a); };
const construits = new Set(Object.keys(await import('../js/core/definitions.js').then(m => m.allModules)));
for (const fx of await listFixtures('all')) {
    if (fx.kind === 'moodle' && fx.moduleKey !== 'test_elea' && !typeMoodle(fx.moduleKey)) continue;
    if (!construits.has(fx.moduleKey)) continue;
    let contenu;
    // Certains exemples sont volontairement du JSON « brut de modèle » (antislashs
    // LaTeX) : ils éprouvent `healJsonString`, pas les déformations de forme.
    try { contenu = JSON.parse(readFileSync(fx.path, 'utf8')); } catch { continue; }
    // Témoin : l'exemple intact doit passer, sinon ce module ne prouve rien ici.
    try { await miseEnForme(fx.moduleKey, contenu, fx.kind); }
    catch (e) { temoinsKo.push(`${fx.file} : ${String(e?.message || e).slice(0, 100)}`); continue; }
    for (const d of deformations(contenu)) {
        cas++;
        try { await miseEnForme(fx.moduleKey, poser(contenu, d.chemin, d.valeur), fx.kind); }
        catch (e) {
            if (!PLANTAGE(e)) { refus++; continue; }
            plantages.push({ module: fx.moduleKey, fixture: fx.file, chemin: d.chemin.join('.'), type: d.type, message: String(e.message).slice(0, 120) });
        }
    }
}

// ── Contenu rangé dans `metadata` (constaté en réel le 25-09-2026) ──────────────────
// Le modèle a livré des sous-questions d'un Quiz mixte sous la forme
// `{ library, metadata: { title, taskDescription, questions, … } }` ou
// `{ library, metadata: { title, params: { … } } }`, sans `params` :
// la question était refusée, la génération perdue. Ici chaque sous-contenu H5P
// d'exemple subit la même déformation ; après réparation, la mise en forme doit être
// IDENTIQUE à celle de l'exemple intact (identifiants aléatoires exceptés). Un
// sous-contenu dont `params` porte une clé de métadonnée H5P (`title`…) est écarté :
// la déformation y est ambiguë, rien ne permet de savoir d'où venait la clé.
const CLES_META = new Set(['title', 'a11yTitle', 'license', 'licenseVersion', 'licenseExtras', 'authors', 'changes', 'extraTitle', 'contentType', 'source', 'yearFrom', 'yearTo', 'authorComments', 'defaultLanguage']);
const sansIds = v => JSON.parse(JSON.stringify(v ?? null, (k, x) => (/^(subContentId|uuid|id)$/.test(k) ? undefined : x)));
let casMeta = 0;
const ecartsMeta = [];
for (const fx of await listFixtures('all')) {
    if (fx.kind === 'moodle' || !construits.has(fx.moduleKey)) continue;
    let contenu, reference;
    try { contenu = JSON.parse(readFileSync(fx.path, 'utf8')); reference = JSON.stringify(sansIds(await miseEnForme(fx.moduleKey, contenu, fx.kind))); }
    catch { continue; }
    const chemins = [];
    const visiter = (n, c) => {
        if (!n || typeof n !== 'object') return;
        if (typeof n.library === 'string' && n.params && typeof n.params === 'object' && !Array.isArray(n.params)
            && Object.keys(n.params).length && !Object.keys(n.params).some(k => CLES_META.has(k))) chemins.push(c);
        for (const [k, v] of Object.entries(n)) visiter(v, [...c, k]);
    };
    visiter(contenu, []);
    // Deux variantes constatées : les champs de params ÉTALÉS dans metadata, ou l'objet
    // params ENTIER rangé sous metadata.params.
    const VARIANTES = {
        etales: n => { n.metadata = { ...(n.metadata || {}), ...n.params }; },
        imbrique: n => { n.metadata = { ...(n.metadata || {}), params: n.params }; },
    };
    for (const c of chemins) for (const [variante, deformer] of Object.entries(VARIANTES)) {
        casMeta++;
        const deforme = structuredClone(contenu);
        let n = deforme;
        for (const k of c) n = n[k];
        deformer(n);
        delete n.params;
        try {
            if (JSON.stringify(sansIds(await miseEnForme(fx.moduleKey, deforme, fx.kind))) !== reference) ecartsMeta.push(`${fx.file} · ${c.join('.')} (${variante}) : mise en forme différente`);
        } catch (e) { ecartsMeta.push(`${fx.file} · ${c.join('.')} (${variante}) : ${String(e?.message || e).slice(0, 100)}`); }
    }
}
console.log(`\n${casMeta} sous-contenus H5P au contenu rangé dans metadata : ${casMeta - ecartsMeta.length} réparés à l'identique`);
if (ecartsMeta.length) {
    console.log('❌ Non réparés :\n  ' + ecartsMeta.slice(0, 20).join('\n  '));
    process.exitCode = 1;
}

console.log(`\n${cas} déformations sur les exemples H5P et Moodle : ${cas - refus - plantages.length} mises en forme, ${refus} refus explicites, ${plantages.length} plantage(s)`);
if (temoinsKo.length) console.log(`(${temoinsKo.length} exemple(s) témoin non mis en forme sous Node, ignorés${DETAIL ? ' :\n  ' + temoinsKo.join('\n  ') : ''})`);
if (plantages.length) {
    const groupes = new Map();
    for (const p of plantages) {
        const cle = `${p.module} · ${p.chemin.replace(/\.\d+(?=\.|$)/g, '[]')} · ${p.type} → ${p.message}`;
        groupes.set(cle, (groupes.get(cle) || 0) + 1);
    }
    console.log('\n❌ Plantages (module · champ · déformation → erreur) :');
    for (const [cle, n] of [...groupes].sort()) console.log(`  ${n > 1 ? `${n}× ` : ''}${cle}`);
    process.exitCode = 1;
} else {
    console.log('✅ Aucune déformation ne fait planter la mise en forme.');
}
