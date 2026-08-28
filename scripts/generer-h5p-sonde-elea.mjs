/**
 * generer-h5p-sonde-elea.mjs — Fabrique un `.h5p` par type d'activité H5P géré par
 * Caramel, destiné à être IMPORTÉ dans Éléa puis RÉ-EXPORTÉ.
 *
 * Pourquoi : le `.h5p` produit par Caramel n'embarque PAS les bibliothèques (piège 9
 * de CLAUDE.md) — il ne déclare que `machineName` + major.minor. À l'import, Éléa y
 * accroche SES bibliothèques installées ; au ré-export, il les empaquette. L'aller-retour
 * est donc le SEUL moyen fiable de connaître les versions réellement en service sur la
 * plateforme, et de repérer une lib qui a changé de génération (cf. H5P.Flashcards
 * 1.7.10 → 1.7.23, passée au design system `h5p-theme`, piège 11).
 *
 * Le pipeline est celui de la production, sans raccourci :
 *   fixture → json-healer (3 étapes) → processeur → h5p-creator.createH5PBlob
 * Il réutilise le bootstrap Node du banc roundtrip (stubs navigateur, aléa seedé,
 * date figée), donc deux exécutions produisent des fichiers identiques.
 *
 * Lancement :  node scripts/generer-h5p-sonde-elea.mjs [--sortie=<dossier>] [--only=A,B]
 * Sortie par défaut : `tests/.sondes-elea/`
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Le bootstrap DOIT précéder tout import Caramel (il installe window/document/localStorage).
await import('../tests/roundtrip/bootstrap.mjs');

const { listFixtures } = await import('../tests/roundtrip/fixtures-map.mjs');
const healer = await import('../js/h5p/json-healer.js');
const { processH5PContent, getModuleMetadata } = await import('../js/h5p/processors/index.js');
const { createH5PBlob } = await import('../js/h5p/h5p-creator.js');
const { h5pModules } = await import('../js/core/definitions.js');

// ------------------------------------------------------------------ args CLI
const argv = process.argv.slice(2);
const getArg = (n) => {
    const a = argv.find(x => x.startsWith(`--${n}=`));
    return a ? a.split('=').slice(1).join('=') : null;
};
const SORTIE = resolve(ROOT, getArg('sortie') || 'tests/.sondes-elea');
const ONLY = (getArg('only') || '').split(',').filter(Boolean);

// --------------------------------------------------------------- pipeline
// ------------------------------------------------- médias de remplacement
/**
 * Certaines activités référencent des médias qui n'existent qu'en session
 * navigateur : la Dictée SYNTHÉTISE ses MP3 via le TTS serveur, indisponible ici.
 * `h5p-creator` refuse (à raison) d'empaqueter un chemin sans blob — l'archive
 * serait cassée. Pour une SONDE, dont le seul objet est de révéler la version de
 * bibliothèque installée sur Éléa, on comble les manquants par un média minimal
 * mais RÉELLEMENT VALIDE (pas un fichier vide renommé) :
 *   - .mp3 : trames MPEG-1 Layer III de silence, 32 kbps / 44,1 kHz / mono
 *            (104 o par trame de 26,1 ms) — décodable par un lecteur standard ;
 *   - .png : PNG 1×1 transparent.
 * Les activités concernées sont signalées dans le rapport ET dans l'inventaire :
 * leur CONTENU n'est pas représentatif, leur MANIFESTE l'est.
 */
function mediaBouchon(chemin) {
    const ext = chemin.split('.').pop().toLowerCase();
    if (ext === 'mp3') {
        const trame = Buffer.concat([Buffer.from([0xFF, 0xFB, 0x10, 0xC4]), Buffer.alloc(100)]);
        return { blob: new Blob([Buffer.concat(Array(20).fill(trame))], { type: 'audio/mpeg' }), type: 'audio/mpeg' };
    }
    if (ext === 'png') {
        const png = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64');
        return { blob: new Blob([png], { type: 'image/png' }), type: 'image/png' };
    }
    return null;
}

/** Chemins médias locaux référencés par un content.json (même regex que h5p-creator). */
function cheminsMediasReferences(content) {
    const s = JSON.stringify(content);
    return [...new Set((s.match(/"(?:images|audios|videos)\/[A-Za-z0-9._-]+"/g) || []).map(m => m.slice(1, -1)))];
}

/** Parse défensif : JSON.parse, puis healJsonString si les backslashes LaTeX cassent. */
function parseFixture(raw) {
    try { return JSON.parse(raw); }
    catch { return JSON.parse(healer.healJsonString(raw)); }
}

/** Les 3 étapes de healing, dans l'ordre de handleH5PCreation. */
function healFull(obj, moduleKey) {
    let o = healer.healJsonObject(structuredClone(obj), moduleKey);
    o = healer.healActivitySpecificFields(o, moduleKey);
    o = healer.healStructureForActivity(o, moduleKey);
    return o;
}

/**
 * heal → process → package. Contrairement au banc roundtrip, on PROPAGE les
 * dépendances dynamiques rendues par le processeur (sous-types de question du
 * QuizSet, blocs Column du Livre interactif) : sans elles le manifeste serait
 * incomplet et l'import Éléa ne révélerait pas ces bibliothèques-là.
 */
async function fabriquer(rawObj, moduleKey) {
    const healed = healFull(rawObj, moduleKey);
    const traite = await processH5PContent(moduleKey, healed);
    let content = traite;
    let depsDynamiques = [];
    if (traite && traite.content && traite.dependencies) {
        content = traite.content;
        depsDynamiques = traite.dependencies;
    }
    const meta = getModuleMetadata(moduleKey);
    if (!meta) throw new Error(`Métadonnées introuvables pour ${moduleKey}`);
    const dependencies = [
        ...meta.extraDependencies,
        { machineName: meta.machineName, majorVersion: meta.version.major, minorVersion: meta.version.minor },
        ...depsDynamiques
    ];
    // Comble les médias absents (TTS serveur indisponible en Node) — cf. mediaBouchon.
    const references = cheminsMediasReferences(content);
    const mediaFiles = new Map();
    const bouchons = [];
    for (const chemin of references) {
        const b = mediaBouchon(chemin);
        if (b) { mediaFiles.set(chemin, b.blob); bouchons.push(chemin); }
    }
    const blob = await createH5PBlob(content, meta.machineName, dependencies, {
        title: content.title || moduleKey, lang: 'fr',
        ...(mediaFiles.size ? { mediaFiles } : {})
    });
    return { blob, dependencies, meta, bouchons };
}

// ------------------------------------------------------------------- run
await mkdir(SORTIE, { recursive: true });

// Une fixture par module : la PREMIÈRE dans l'ordre alphabétique, pour être stable.
const fixtures = await listFixtures('h5p');
const parModule = new Map();
for (const f of fixtures) if (!parModule.has(f.moduleKey)) parModule.set(f.moduleKey, f);

// Ordre de definitions.js, en ignorant les modules masqués (H5P.AdvancedText).
const cles = Object.keys(h5pModules)
    .filter(k => !h5pModules[k].hidden)
    .filter(k => parModule.has(k))
    .filter(k => !ONLY.length || ONLY.includes(k));

const sansFixture = Object.keys(h5pModules).filter(k => !h5pModules[k].hidden && !parModule.has(k));

const lignes = [];
let ok = 0, ko = 0;
for (const cle of cles) {
    const f = parModule.get(cle);
    try {
        const raw = parseFixture(await readFile(f.path, 'utf8'));
        const { blob, dependencies, meta, bouchons } = await fabriquer(raw, cle);
        const buf = Buffer.from(await blob.arrayBuffer());
        const nom = `${cle}.h5p`;
        await writeFile(join(SORTIE, nom), buf);
        lignes.push({
            module: cle, fichier: nom, fixture: f.file,
            lib: `${meta.machineName} ${meta.version.major}.${meta.version.minor}`,
            octets: buf.length,
            mediasBouches: bouchons,
            dependances: dependencies.map(d => `${d.machineName} ${d.majorVersion}.${d.minorVersion}`)
        });
        ok++;
    } catch (e) {
        lignes.push({ module: cle, fichier: null, fixture: f.file, erreur: String(e.message || e).slice(0, 120) });
        ko++;
    }
}

await writeFile(join(SORTIE, 'inventaire.json'), JSON.stringify({
    genereLe: 'date figée par le bootstrap roundtrip',
    racine: ROOT, total: lignes.length, ok, ko, activites: lignes
}, null, 2));

// ---------------------------------------------------------------- rapport
const pad = (s, n) => String(s).padEnd(n);
console.log(`\n▶ ${cles.length} types H5P — sortie : ${SORTIE}\n`);
console.log(pad('module', 24) + pad('fichier', 26) + pad('bibliothèque principale', 32) + 'déps');
console.log('-'.repeat(104));
for (const l of lignes) {
    if (l.erreur) { console.log(`❌ ${pad(l.module, 22)}${l.erreur}`); continue; }
    const marque = l.mediasBouches?.length ? ` ⚠ ${l.mediasBouches.length} média(s) de remplacement` : '';
    console.log(`   ${pad(l.module, 21)}${pad(l.fichier, 26)}${pad(l.lib, 32)}${l.dependances.length}${marque}`);
}
console.log('\n' + '='.repeat(60));
console.log(`${ok} .h5p générés / ${ko} en échec`);
if (sansFixture.length) console.log(`⚠ sans fixture d'exemple, non générés : ${sansFixture.join(', ')}`);
console.log(`inventaire : ${join(SORTIE, 'inventaire.json')}`);
console.log('='.repeat(60));
process.exit(ko ? 1 : 0);
