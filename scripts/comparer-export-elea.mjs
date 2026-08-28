/**
 * comparer-export-elea.mjs — Deuxième moitié de l'aller-retour Éléa.
 *
 * Prend un dossier de `.h5p` RÉ-EXPORTÉS depuis Éléa (produits en important les
 * sondes de `scripts/generer-h5p-sonde-elea.mjs`) et le confronte au vendor local
 * `js/vendor/h5p-libs/`. Il répond à trois questions :
 *
 *   1. Quelles bibliothèques Éléa embarque-t-il que nous n'avons pas du tout ?
 *   2. Pour celles que nous avons, Éléa est-il sur une version PLUS RÉCENTE
 *      (major.minor, ou simplement patchVersion / coreApi) ?
 *   3. Une bibliothèque a-t-elle changé de GÉNÉRATION, c'est-à-dire acquis une
 *      dépendance à `H5P.Components` (design system `h5p-theme`) ? C'est ce
 *      changement-là qui casse en silence — cf. piège 11 (Flashcards 1.7.23).
 *
 * Lancement :  node scripts/comparer-export-elea.mjs <dossier-des-exports>
 */
import { readdir, readFile, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIBS = join(ROOT, 'js/vendor/h5p-libs');

const cible = process.argv[2];
if (!cible) {
    console.error('Usage : node scripts/comparer-export-elea.mjs <dossier-des-.h5p-réexportés>');
    process.exit(2);
}
const DOSSIER = resolve(process.cwd(), cible);

/** Numéro comparable à partir d'un library.json. */
const cle = (L) => [L.majorVersion | 0, L.minorVersion | 0, L.patchVersion | 0];
const cmp = (a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]);
const txt = (v) => v.join('.');

/** Lit tous les library.json contenus dans un .h5p (Éléa empaquette ses libs). */
async function libsDuPaquet(chemin, tmp) {
    const dst = join(tmp, 'x');
    await rm(dst, { recursive: true, force: true });
    await run('unzip', ['-qq', '-o', chemin, '-d', dst]);
    const out = new Map();
    for (const d of await readdir(dst, { withFileTypes: true })) {
        if (!d.isDirectory()) continue;
        try {
            const L = JSON.parse(await readFile(join(dst, d.name, 'library.json'), 'utf8'));
            out.set(d.name, L);
        } catch { /* dossier content/ ou lib sans manifeste */ }
    }
    return out;
}

/** library.json vendor pour un nom de dossier `Machine-major.minor`, ou null. */
async function libVendor(nom) {
    try { return JSON.parse(await readFile(join(LIBS, nom, 'library.json'), 'utf8')); }
    catch { return null; }
}

/** Plus haute version présente dans le vendor pour un machineName donné. */
async function meilleureVendor(machineName) {
    let best = null, bestNom = null;
    for (const d of await readdir(LIBS, { withFileTypes: true })) {
        if (!d.isDirectory() || !d.name.startsWith(machineName + '-')) continue;
        const L = await libVendor(d.name);
        if (L && L.machineName === machineName && (!best || cmp(cle(L), cle(best)) > 0)) { best = L; bestNom = d.name; }
    }
    return best ? { L: best, nom: bestNom } : null;
}

const fichiers = (await readdir(DOSSIER)).filter(f => f.endsWith('.h5p')).sort();
if (!fichiers.length) { console.error(`Aucun .h5p dans ${DOSSIER}`); process.exit(2); }

const tmp = await mkdtemp(join(tmpdir(), 'cmp-elea-'));
const vues = new Map();   // dossier → { L, vuDans: Set }
for (const f of fichiers) {
    const libs = await libsDuPaquet(join(DOSSIER, f), tmp);
    for (const [nom, L] of libs) {
        if (!vues.has(nom)) vues.set(nom, { L, vuDans: new Set() });
        vues.get(nom).vuDans.add(f.replace(/\.h5p$/, ''));
    }
}
await rm(tmp, { recursive: true, force: true });

const absentes = [], plusRecentes = [], nouvelleGen = [], identiques = [];
for (const [nom, { L, vuDans }] of [...vues].sort()) {
    const themeElea = (L.preloadedDependencies || []).some(d => d.machineName === 'H5P.Components');
    const v = await libVendor(nom);
    if (!v) {
        const alt = await meilleureVendor(L.machineName);
        absentes.push({ nom, elea: txt(cle(L)), vendorProche: alt ? `${alt.nom} (${txt(cle(alt.L))})` : '—', vuDans, themeElea });
        continue;
    }
    const themeLocal = (v.preloadedDependencies || []).some(d => d.machineName === 'H5P.Components');
    const d = cmp(cle(L), cle(v));
    const ligne = {
        nom, elea: txt(cle(L)), local: txt(cle(v)),
        coreElea: L.coreApi?.minorVersion, coreLocal: v.coreApi?.minorVersion,
        themeElea, themeLocal, vuDans
    };
    if (themeElea && !themeLocal) nouvelleGen.push(ligne);
    else if (d > 0) plusRecentes.push(ligne);
    else identiques.push(ligne);
}

const pad = (s, n) => String(s ?? '').padEnd(n);
console.log(`\n▶ ${fichiers.length} export(s) analysé(s) — ${vues.size} bibliothèques distinctes embarquées par Éléa\n`);

if (nouvelleGen.length) {
    console.log('🔴 CHANGEMENT DE GÉNÉRATION — Éléa a migré ces libs au design system H5P (h5p-theme)');
    console.log('   Attendre : nouvelles dépendances, nouveaux champs de semantics, éventuelles chaînes en dur.');
    for (const l of nouvelleGen) console.log(`   ${pad(l.nom, 36)}local ${pad(l.local, 12)}→ Éléa ${pad(l.elea, 12)}(${[...l.vuDans].join(', ')})`);
    console.log('');
}
if (plusRecentes.length) {
    console.log('🟠 PLUS RÉCENTES chez Éléa');
    for (const l of plusRecentes) console.log(`   ${pad(l.nom, 36)}local ${pad(l.local, 12)}→ Éléa ${pad(l.elea, 12)}coreApi 1.${l.coreLocal} → 1.${l.coreElea}`);
    console.log('');
}
if (absentes.length) {
    console.log('🔵 ABSENTES du vendor (major.minor inconnu localement)');
    for (const l of absentes) console.log(`   ${pad(l.nom, 36)}Éléa ${pad(l.elea, 12)}le plus proche ici : ${l.vendorProche}`);
    console.log('');
}
console.log(`✅ ${identiques.length} bibliothèque(s) à jour ou en avance localement.`);
console.log('='.repeat(72));
const aFaire = nouvelleGen.length + plusRecentes.length + absentes.length;
console.log(aFaire ? `${aFaire} bibliothèque(s) à récupérer.` : 'Rien à récupérer : le vendor est aligné sur Éléa.');
console.log('='.repeat(72));
