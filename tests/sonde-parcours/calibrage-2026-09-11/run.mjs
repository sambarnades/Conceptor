/** Essai manuel ILaaS : neuf compositions réelles, strictement successives. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = dirname(fileURLToPath(import.meta.url));
const root = resolve(base, '../../..');
const dossier = resolve(base, process.argv[2] === 'usages' ? 'usages-final' : 'validation');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8144;
const cas = [
    ...[1,2,3].map(n => ({ id: `courte-auto-${n}`, lang: 'fr', platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'auto', qui: 'Professeur d’histoire-géographie', quoi: 'Les Trente Glorieuses en 3e : croissance, transformations sociales et limites. Une séance de révision.' })),
    { id: 'moyenne-auto', lang: 'fr', platform: 'moodle', format: 'presentiel', ampleur: 'moyenne', trame: 'auto', qui: 'Enseignante en licence de biologie', quoi: 'Comprendre la mitose et la distinguer de la méiose, en deux à trois séances.' },
    { id: 'longue-auto', lang: 'fr', platform: 'elea', format: 'hybride', ampleur: 'longue', trame: 'auto', qui: 'Professeur de SVT en 5e', quoi: 'Expliquer les besoins des plantes vertes et concevoir une expérience. Une séquence complète.' },
    { id: 'rituel', lang: 'fr', platform: 'elea', format: 'presentiel', ampleur: 'courte', trame: 'rituel', qui: 'Professeur de mathématiques en 6e', quoi: 'Réactiver les tables de multiplication en dix minutes.' },
    { id: 'inversee-en', lang: 'en', platform: 'moodle', format: 'hybride', ampleur: 'courte', trame: 'inversee', qui: 'University economics lecturer', quoi: 'Understand supply and demand, prepare independently then solve a case together in class.' },
    { id: 'formation-magistere', lang: 'fr', platform: 'magistere', format: 'hybride', ampleur: 'longue', trame: 'formation', qui: 'Formatrice d’enseignants', quoi: 'Concevoir une évaluation formative, se préparer à distance, expérimenter en regroupement puis partager son retour de classe.' },
    { id: 'revision-br', lang: 'br', platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'revision', qui: 'Kelenner istor ha douaroniezh', quoi: 'Adwelet ar brezel-bed kentañ gant skolidi trede klas : ar vuhez er fozioù hag ar gevredigezh e-pad ar brezel.' },
];
const server = spawn('python3', ['tests/serveur-statique.py',String(port),'--bind','127.0.0.1'], {cwd:root,stdio:'ignore'});
let browser; const bilans=[];
try {
    await mkdir(dossier, {recursive:true});
    for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}/index.html`)).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
    browser=await chromium.launch();
    const selection = process.argv[2] === 'usages' ? cas.filter(c => ['courte-auto-1', 'moyenne-auto', 'rituel', 'inversee-en', 'revision-br'].includes(c.id)) : cas;
    for(const c of selection){
        const page=await browser.newPage({viewport:{width:1440,height:1000}}); const appels=[]; const erreurs=[]; const raws=[];
        await page.route('**/*',route=>{
            const u=new URL(route.request().url());
            if(u.hostname==='127.0.0.1'||['data:','blob:'].includes(u.protocol))return route.continue();
            if(u.hostname==='n8n-caramel.osc-fr1.scalingo.io'&&/^\/webhook\/caramel\/llm\/(submit|result)-bas$/.test(u.pathname)){
                if(u.pathname.endsWith('submit-bas'))appels.push({demande:route.request().postDataJSON()});
                return route.continue();
            }
            return route.abort();
        });
        page.on('pageerror',e=>erreurs.push(e.message));
        page.on('response',async r=>{if(!r.url().includes('/llm/result-bas'))return;try{const d=await r.json();if(['done','error'].includes(d.status)){raws.push(d); console.log(c.id, d.status, d.model, 'repli',d.fallback_level||0);}}catch{}});
        await page.goto(`http://127.0.0.1:${port}/index.html`);
        await page.waitForSelector('#parcours-button');
        await page.evaluate(async lang=>{await (await import('/js/core/translation.js')).loadTranslations(lang);},c.lang);
        await page.fill('#qui',c.qui);await page.fill('#quoi',c.quoi);await page.click('#parcours-button');
        await page.evaluate(async c=>{
            const s=await import('/js/parcours/state.js');s.majBrouillon({platform:c.platform,format:c.format,ampleur:c.ampleur,trame:c.trame});
            (await import('/js/parcours/index.js')).__testHooks.allerA(0);
        },c);
        await page.click('#pc-cta'); console.log('Démarrage',c.id);
        await page.waitForFunction(()=>document.querySelector('.pc-title-input')||(!document.querySelector('.pc-veil')&&document.querySelector('#pc-action-note')?.textContent),null,{timeout:420000});
        const resultat=await page.evaluate(async ()=>{
            const s=await import('/js/parcours/state.js'); const io=await import('/js/parcours/scenario-io.js'); const {construirePromptPlan}=await import('/js/parcours/scenario-prompt.js');const {controlerCalibrage}=await import('/js/parcours/calibrage.js');
            const d=s.brouillon();const {calibrage,modules}=construirePromptPlan(d);
            return {scenario:d.plan?io.versScenario(d):null,ecarts:d.plan?controlerCalibrage(d.plan,calibrage,modules):['aucun plan'],message:document.querySelector('#pc-action-note')?.textContent};
        });
        const dest=resolve(dossier,c.id);await mkdir(dest,{recursive:true});
        await writeFile(resolve(dest,'trace.json'),JSON.stringify({cas:c,appels,raws,erreurs,...resultat},null,2));
        await page.screenshot({path:resolve(dest,'plan.png'),fullPage:true,animations:'disabled'});
        const bilan={id:c.id,appels:appels.length,activites:resultat.scenario?.plan.etapes.flatMap(e=>e.cartes).length,etapes:resultat.scenario?.plan.etapes.length,ecarts:resultat.ecarts,erreurs};bilans.push(bilan);
        await writeFile(resolve(dossier,'bilan.json'),JSON.stringify(bilans,null,2));console.log(JSON.stringify(bilan));
        await page.close();
    }
}finally{await browser?.close();server.kill('SIGTERM');}
if(bilans.length!==(process.argv[2] === 'usages' ? 5 : cas.length)||bilans.some(b=>b.ecarts.length||b.erreurs.length))process.exitCode=1;
