/** Régressions du comparateur : même version ne signifie pas mêmes semantics. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
const script=new URL('../../scripts/comparer-export-elea.mjs',import.meta.url);
const vendor=new URL('../../js/vendor/h5p-libs/H5P.Flashcards-1.7/',import.meta.url);
async function verifier(mutate,withLibraries=true) {
 const root=await mkdtemp(join(tmpdir(),'caramel-semantics-'));
 try {
  const source=join(root,'source');await mkdir(source);
  await writeFile(join(source,'h5p.json'),JSON.stringify({mainLibrary:'H5P.Flashcards'}));
  if(withLibraries){
   const L=JSON.parse(await readFile(new URL('library.json',vendor))),S=JSON.parse(await readFile(new URL('semantics.json',vendor)));mutate(L,S);
   await mkdir(join(source,'H5P.Flashcards-1.7'));
   await writeFile(join(source,'H5P.Flashcards-1.7/library.json'),JSON.stringify(L));
   await writeFile(join(source,'H5P.Flashcards-1.7/semantics.json'),JSON.stringify(S));
  }
  execFileSync('zip',['-qr',join(root,'sonde.h5p'),'.'],{cwd:source});
  let status=0;try{execFileSync(process.execPath,[script.pathname,root,join(root,'rapport.json')],{stdio:'pipe'});}catch(e){status=e.status;}
  return {status,report:JSON.parse(await readFile(join(root,'rapport.json')))};
 }finally{await rm(root,{recursive:true,force:true});}
}
test('détecte un champ modifié malgré une version inchangée',async()=>{
 const {status,report}=await verifier((L,S)=>{S.find(f=>f.name==='showSolutionsRequiresInput').default=false;});
 assert.equal(status,0);assert.equal(report.bilan.versionsDifferentes,0);assert.equal(report.bilan.semanticsDifferentes,1);
 assert(report.bibliotheques[0].ecartsSemantics.some(e=>e.chemin.includes('showSolutionsRequiresInput.default')));
});
test('signale une version plateforme plus ancienne sans la dire à jour',async()=>{
 const {report}=await verifier(L=>{L.patchVersion-=1;});assert.equal(report.bibliotheques[0].comparaisonVersion,-1);
});
test('refuse une collecte de paquets sans bibliothèques',async()=>{
 const {status,report}=await verifier(()=>{},false);assert.equal(status,1);assert.equal(report.bilan.paquetsSansBibliotheques,1);
});
test('repère les blocs optionnels absents, distincts des dépendances obligatoires',async()=>{
 // Bibliothèque FICTIVE : un nom réel (H5P.Row 1.3) finit par entrer dans le vendor (e6a07b40).
 const absente='H5P.SondeOptionAbsente-9.9';
 const {report}=await verifier((L,S)=>S.push({name:'bloc',type:'library',options:['H5P.SondeOptionAbsente 9.9']}));
 assert.deepEqual(report.bilan.optionsAbsentes,[absente]);
 assert(!report.bilan.dependancesAbsentes.includes(absente));
});
