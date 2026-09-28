/** Réexports Éléa : versions, dépendances ET contenu intégral des semantics.
 * node scripts/comparer-export-elea.mjs <dossier.h5p> [rapport.json]
 * Aucun fichier du vendor n'est modifié. Un paquet sans bibliothèques est refusé.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIBS = join(ROOT, 'js/vendor/h5p-libs');
const cible = process.argv[2];
if (!cible) { console.error('Usage : node scripts/comparer-export-elea.mjs <dossier-des-réexports> [rapport.json]'); process.exit(2); }
const dossier = resolve(cible);
const fichiers = (await readdir(dossier)).filter(f => f.endsWith('.h5p')).sort();
if (!fichiers.length) { console.error('Aucun .h5p'); process.exit(2); }
const canonique = v => JSON.stringify(trier(v));
function trier(v) {
    if (Array.isArray(v)) return v.map(trier);
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, trier(v[k])]));
    return v;
}
const hash = v => createHash('sha256').update(canonique(v)).digest('hex');
const version = l => `${l.majorVersion}.${l.minorVersion}.${l.patchVersion}`;
const comparerVersions = (a,b) => ['majorVersion','minorVersion','patchVersion'].reduce((d,k) => d || Math.sign(Number(a[k])-Number(b[k])),0);
async function lireJson(f) { try { return JSON.parse(await readFile(f,'utf8')); } catch(e) { if(e.code==='ENOENT') return null; throw e; } }
function choixBibliotheques(node, choix = new Set()) {
    if (!node || typeof node !== 'object') return choix;
    if (node.type === 'library') for (const option of node.options || []) {
        const name = typeof option === 'string' ? option : option.name;
        if (name) choix.add(name.replace(' ', '-'));
    }
    Object.values(node).forEach(value => choixBibliotheques(value, choix));
    return choix;
}
// Les tableaux de champs sont rapprochés par nom, pour qu'un ajout ne décale pas
// artificiellement tous les chemins suivants. L'empreinte conserve aussi leur ordre.
function ecarts(a,b,chemin='$',out=[]) {
    if(canonique(a)===canonique(b)) return out;
    if(Array.isArray(a)&&Array.isArray(b)&&[...a,...b].every(v=>v&&typeof v==='object'&&v.name)) {
        const am=Object.fromEntries(a.map(v=>[v.name,v])), bm=Object.fromEntries(b.map(v=>[v.name,v]));
        ecarts(am,bm,chemin,out);
        if(a.map(v=>v.name).join('|')!==b.map(v=>v.name).join('|')) out.push({chemin:chemin+'.ordre',local:a.map(v=>v.name),elea:b.map(v=>v.name)});
    } else if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)) {
        for(const k of new Set([...Object.keys(a),...Object.keys(b)])) ecarts(a[k],b[k],`${chemin}.${k}`,out);
    } else out.push({chemin,local:a??null,elea:b??null});
    return out;
}
const bibliotheques=new Map(), paquets=[];
for(const fichier of fichiers) {
    const path=join(dossier,fichier);
    const noms=(await run('unzip',['-Z1',path],{maxBuffer:32*1024*1024})).stdout.trim().split('\n');
    const json=async nom=>JSON.parse((await run('unzip',['-p',path,nom],{maxBuffer:32*1024*1024})).stdout);
    const manifest=await json('h5p.json');
    const entrees=noms.filter(n=>/^[^/]+\/library\.json$/.test(n));
    paquets.push({fichier,sha256:createHash('sha256').update(await readFile(path)).digest('hex'),mainLibrary:manifest.mainLibrary,bibliotheques:entrees.length,valide:entrees.length>0});
    for(const entree of entrees) {
        const nom=entree.split('/')[0], L=await json(entree);
        const S=noms.includes(`${nom}/semantics.json`)?await json(`${nom}/semantics.json`):null;
        const empreinte=hash({library:L,semantics:S});
        const variantes=bibliotheques.get(nom)||[];
        let variante=variantes.find(v=>v.empreinte===empreinte);
        if(!variante){variante={L,S,empreinte,paquets:[]};variantes.push(variante);bibliotheques.set(nom,variantes);}
        variante.paquets.push(fichier);
    }
}
const lignes=[];
for(const [nom,variantes] of [...bibliotheques].sort()) {
    const local=await lireJson(join(LIBS,nom,'library.json'));
    const semanticsLocal=local?await lireJson(join(LIBS,nom,'semantics.json')):null;
    for(const v of variantes) {
        const dependancesAbsentes=[];
        // Les choix de blocs dans les semantics ne sont pas nécessairement
        // préchargés : Row peut être proposé, mais absent d'un livre sans Row.
        const optionsAbsentes=[];
        for (const choix of choixBibliotheques(v.S)) {
            if (!await lireJson(join(LIBS,choix,'library.json'))) optionsAbsentes.push(choix);
        }
        for(const dep of [...(v.L.preloadedDependencies||[]),...(v.L.dynamicDependencies||[])]) {
            const d=`${dep.machineName}-${dep.majorVersion}.${dep.minorVersion}`;
            if(!await lireJson(join(LIBS,d,'library.json'))) dependancesAbsentes.push(d);
        }
        lignes.push({nom,elea:version(v.L),local:local?version(local):null,
            comparaisonVersion:local?comparerVersions(v.L,local):null,
            paquets:v.paquets,conflitEntrePaquets:variantes.length>1,
            manifesteIdentique:!!local&&hash(v.L)===hash(local),
            semanticsIdentiques:!!local&&hash(v.S)===hash(semanticsLocal),
            hashSemanticsElea:hash(v.S),hashSemanticsLocal:local?hash(semanticsLocal):null,
            sansSemantics:v.S===null,ecartsSemantics:local?ecarts(semanticsLocal,v.S):[],
            ecartsManifeste:local?ecarts(local,v.L):[],dependancesAbsentes,optionsAbsentes,
            themeElea:(v.L.preloadedDependencies||[]).some(d=>d.machineName==='H5P.Components')});
    }
}
const bilan={paquets:paquets.length,paquetsSansBibliotheques:paquets.filter(p=>!p.valide).length,
    bibliotheques:bibliotheques.size,absentes:lignes.filter(l=>!l.local).length,
    versionsDifferentes:lignes.filter(l=>l.local&&l.comparaisonVersion!==0).length,
    semanticsDifferentes:lignes.filter(l=>l.local&&!l.semanticsIdentiques).length,
    conflitsEntrePaquets:[...bibliotheques.values()].filter(v=>v.length>1).length,
    dependancesAbsentes:[...new Set(lignes.flatMap(l=>l.dependancesAbsentes))].sort(),
    optionsAbsentes:[...new Set(lignes.flatMap(l=>l.optionsAbsentes))].sort()};
const rapport={date:new Date().toISOString().slice(0,10),bilan,paquets,bibliotheques:lignes};
if(process.argv[3]) await writeFile(resolve(process.argv[3]),JSON.stringify(rapport,null,2)+'\n');
console.log(JSON.stringify(bilan,null,2));
for(const l of lignes.filter(l=>!l.local||!l.semanticsIdentiques||l.comparaisonVersion!==0||l.conflitEntrePaquets))
    console.log(`${l.nom} : Éléa ${l.elea}, local ${l.local??'absent'} ; ${l.local?l.ecartsSemantics.length+' écart(s) semantics':'à récupérer'}${l.conflitEntrePaquets?' ; conflit entre réexports':''}`);
if(bilan.paquetsSansBibliotheques||bilan.conflitsEntrePaquets) {console.error('Collecte incomplète ou contradictoire : aucun alignement global ne peut être affirmé.');process.exitCode=1;}
