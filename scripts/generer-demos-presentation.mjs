/**
 * generer-demos-presentation.mjs — Fabrique les activités H5P jouées EN DIRECT par la
 * page de présentation `decouvrir/index.html`, et le `.h5p` téléchargeable de chacune.
 *
 * Pourquoi un script plutôt que des fichiers posés à la main : la page montre ce que
 * Caramel produit VRAIMENT. Chaque activité part donc d'un JSON au format que l'IA
 * renvoie à Caramel (cf. `assets/data/examples/`) et traverse le pipeline de production,
 * sans raccourci :
 *   source → json-healer (3 étapes) → processeur → h5p-creator.createH5PBlob → .h5p
 * Le dossier jouable par h5p-standalone est ensuite EXTRAIT de ce `.h5p` : ce que la
 * page affiche et ce que le formateur télécharge sont les mêmes octets.
 *
 * Entrées :
 *   scripts/presentation/catalogue.json        — ordre, module Caramel, titre, description ;
 *   scripts/presentation/activites/<id>.json   — contenu au format IA du module.
 * Sorties (le dossier est ENTIÈREMENT régénéré, n'y rien poser à la main) :
 *   assets/presentation/activites/<id>.h5p                   — fichier à déposer sur Éléa/Magistère/Moodle ;
 *   assets/presentation/activites/<id>/h5p.json              — dossier extrait, lu par h5p-standalone
 *   assets/presentation/activites/<id>/content/content.json    (h5pJsonPath = ce dossier) ;
 *   assets/presentation/activites/index.json                 — inventaire lu par la page.
 *
 * Fidélité au navigateur, et ses deux limites assumées :
 *   - la langue est le FRANÇAIS, chargée comme le fait `loadTranslations('fr')` (socle
 *     anglais puis `fr.json`) : les libellés posés par les processeurs sont ceux d'un
 *     utilisateur français de Caramel ;
 *   - DOMPurify n'existe pas en Node : le sanitizer identité du banc roundtrip le remplace.
 *     Il ne rend le même HTML que pour un texte sans balise ni entité — d'où le refus,
 *     plus bas, de toute source contenant `<` ou `&`.
 * Déterminisme : bootstrap roundtrip (date figée, Math.random seedé), et graine
 * réinitialisée PAR ACTIVITÉ à partir de son id — ajouter ou retirer une activité ne
 * change pas les octets des autres.
 *
 * Lancement :  node scripts/generer-demos-presentation.mjs
 */
import { writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCES = join(ROOT, 'scripts/presentation');
const SORTIE_RELATIVE = 'assets/presentation/activites';
const SORTIE = join(ROOT, SORTIE_RELATIVE);

// Le bootstrap DOIT précéder tout import Caramel (il installe window/document/localStorage).
const { resetRandom, ensureFflate, installIdentitySanitizer } = await import('../tests/roundtrip/bootstrap.mjs');

const healer = await import('../js/h5p/json-healer.js');
const { processH5PContent, getModuleMetadata } = await import('../js/h5p/processors/index.js');
const { createH5PBlob } = await import('../js/h5p/h5p-creator.js');
const { h5pModules } = await import('../js/core/definitions.js');
const { translations } = await import('../js/core/translation.js');

// ------------------------------------------------------------ environnement
// Même dictionnaire qu'un utilisateur en français : `loadTranslations('fr')` fusionne
// les défauts, le socle anglais puis fr.json, en CONSERVANT l'objet (les processeurs
// ont importé cette référence-là).
const lireJson = async (chemin) => JSON.parse(await readFile(chemin, 'utf8'));
const socle = await lireJson(join(ROOT, 'js/locales/en.json'));
const francais = await lireJson(join(ROOT, 'js/locales/fr.json'));
Object.assign(translations, socle, francais);

if (!await installIdentitySanitizer()) throw new Error('Sanitizer identité non installé : le HTML des processeurs serait échappé.');
const fflate = await ensureFflate();

// ------------------------------------------------------------------ outils
/** Graine 32 bits stable tirée de l'id (FNV-1a). */
function graine(id) {
    let h = 0x811c9dc5;
    for (const c of id) h = Math.imul(h ^ c.codePointAt(0), 0x01000193) >>> 0;
    return h;
}

/**
 * Le sanitizer identité n'équivaut à DOMPurify que sur du texte sans balise ni entité.
 * Une source qui en contiendrait donnerait ici un HTML différent de celui du navigateur :
 * on la refuse plutôt que de publier un écart silencieux.
 */
function verifierTexteBrut(valeur, chemin, id) {
    if (typeof valeur === 'string') {
        if (/[<&]/.test(valeur)) throw new Error(`${id} : « ${chemin} » contient du HTML ou une entité — écrire du texte brut (Markdown accepté).`);
    } else if (Array.isArray(valeur)) {
        valeur.forEach((v, i) => verifierTexteBrut(v, `${chemin}[${i}]`, id));
    } else if (valeur && typeof valeur === 'object') {
        for (const [cle, v] of Object.entries(valeur)) verifierTexteBrut(v, chemin ? `${chemin}.${cle}` : cle, id);
    }
}

/** Les 3 étapes de healing, dans l'ordre de handleH5PCreation. */
function healComplet(obj, moduleKey) {
    let o = healer.healJsonObject(structuredClone(obj), moduleKey);
    o = healer.healActivitySpecificFields(o, moduleKey);
    o = healer.healStructureForActivity(o, moduleKey);
    return o;
}

/** heal → process → package, comme handleH5PCreation + packageAndDownloadH5P. */
async function fabriquer(source, moduleKey, titre) {
    const healed = healComplet(source, moduleKey);
    const traite = await processH5PContent(moduleKey, healed);
    if (!traite) throw new Error(`Aucun processeur pour ${moduleKey}`);
    let content = traite;
    let depsDynamiques = [];
    if (traite.content && traite.dependencies) {
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
    // Le titre du catalogue tient le rôle du titre saisi dans Caramel (cf. titleOverride
    // de handleH5PCreation) : c'est lui qu'affichera la plateforme après dépôt.
    const blob = await createH5PBlob(content, meta.machineName, dependencies, { title: titre, lang: 'fr' });
    return { octets: new Uint8Array(await blob.arrayBuffer()), meta };
}

/** Écrit le contenu du `.h5p` tel quel dans `dossier` (même octets que l'archive). */
async function extraire(octets, dossier) {
    const fichiers = fflate.unzipSync(octets);
    const noms = Object.keys(fichiers).filter(n => !n.endsWith('/')).sort();
    for (const nom of noms) {
        if (nom.split('/').includes('..')) throw new Error(`Chemin d'archive refusé : ${nom}`);
        const cible = join(dossier, nom);
        await mkdir(dirname(cible), { recursive: true });
        await writeFile(cible, fichiers[nom]);
    }
    return noms;
}

// ------------------------------------------------------------------- run
const catalogue = await lireJson(join(SOURCES, 'catalogue.json'));
const ids = new Set();
for (const entree of catalogue) {
    if (!/^[a-z0-9-]+$/.test(entree.id || '')) throw new Error(`id invalide : « ${entree.id} » (minuscules, chiffres, tirets)`);
    if (ids.has(entree.id)) throw new Error(`id en double : ${entree.id}`);
    ids.add(entree.id);
    const module = h5pModules[entree.module];
    if (!module || module.hidden) throw new Error(`${entree.id} : module « ${entree.module} » absent ou masqué dans definitions.js`);
    if (!entree.titre || !entree.description) throw new Error(`${entree.id} : titre et description requis`);
}

// Dossier entièrement généré : le vider garantit qu'une activité retirée du catalogue disparaît.
await rm(SORTIE, { recursive: true, force: true });
await mkdir(SORTIE, { recursive: true });

const index = [];
for (const entree of catalogue) {
    const module = h5pModules[entree.module];
    const source = await lireJson(join(SOURCES, 'activites', `${entree.id}.json`));
    verifierTexteBrut(source, '', entree.id);

    resetRandom(graine(entree.id));
    const { octets, meta } = await fabriquer(source, entree.module, entree.titre);

    const cheminH5p = `${SORTIE_RELATIVE}/${entree.id}.h5p`;
    await writeFile(join(ROOT, cheminH5p), octets);
    const noms = await extraire(octets, join(SORTIE, entree.id));

    index.push({
        id: entree.id,
        titre: entree.titre,
        type: translations[module.name] || module.englishName,
        machineName: meta.machineName,
        version: `${meta.version.major}.${meta.version.minor}`,
        icone: module.image,
        description: entree.description,
        h5p: cheminH5p,
        dossier: `${SORTIE_RELATIVE}/${entree.id}`
    });
    console.log(`   ${entree.id.padEnd(16)}${`${meta.machineName} ${meta.version.major}.${meta.version.minor}`.padEnd(26)}${String(octets.length).padStart(6)} o  (${noms.join(', ')})`);
}

await writeFile(join(SORTIE, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`\n${index.length} activité(s) — ${SORTIE_RELATIVE}/index.json`);
