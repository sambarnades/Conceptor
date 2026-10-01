/** Contrat d’ampleur + vraie orchestration navigateur, backend remplacé localement. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=createRequire(resolve(root,'tests/roundtrip/package.json'))('playwright');
const port=8145; const server=spawn('python3',['tests/serveur-statique.py',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;let pass=0;const ok=(nom,v,detail='')=>{assert.ok(v,detail?`${nom} — ${detail}`:nom);pass++;console.log('✓',nom);};
try{
    for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}/index.html`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
    browser=await chromium.launch();const page=await browser.newPage();
    await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await page.goto(`http://127.0.0.1:${port}/index.html`);await page.waitForSelector('#parcours-button');
    const ancien=JSON.parse(readFileSync(resolve(root,'tests/sonde-parcours/essai-ux-2026-09-10/scenario-plan.json'))).plan;
    const r=await page.evaluate(async ancien=>{
        const {CONFIG}=await import('/js/parcours/config.js');const {TRAMES,tramesCompatibles,nbActivites}=await import('/js/parcours/templates.js');
        const {calibrer,controlerCalibrage,remarquesComposition}=await import('/js/parcours/calibrage.js');const {construirePromptPlan}=await import('/js/parcours/scenario-prompt.js');
        const {planDepuisTrame,normaliserPlan}=await import('/js/parcours/screen-plan.js');const {modulesDisponibles}=await import('/js/parcours/activity-router.js');
        const avant=JSON.stringify(TRAMES); const ecarts=[];let total=0;const doublons=[];const fuites=[];
        for(const a of CONFIG.ampleurs)for(const f of CONFIG.formats)for(const p of CONFIG.platforms){
            for(const tr of tramesCompatibles(f.id,a.id)){
                total++;const draft={platform:p.id,format:f.id,ampleur:a.id,trame:tr.id,contexte:{qui:'Enseignant',quoi:'Fractions'}};
                const plan=planDepuisTrame(tr.id,p.id,a.id);const {prompt,calibrage,modules}=construirePromptPlan(draft);
                // Aucune trame ne déclenche à elle seule la remarque de doublon (D81).
                if(remarquesComposition(plan).length)doublons.push(`${tr.id}/${a.id}/${p.id}`);
                if(/version (?:longue|courte|moyenne)/i.test(tr.intention||''))fuites.push(`${tr.id}/${a.id}`);
                if(tr.modules){
                    const n=plan.etapes.flatMap(e=>e.cartes).length;
                    if(n<a.activites[0]||n>a.activites[1]||n!==nbActivites(tr))ecarts.push(`${tr.id}/${a.id}/${p.id} : ${n}`);
                    if(JSON.stringify(plan.etapes.map(e=>e.cartes.length))!==JSON.stringify(calibrage.rythme))ecarts.push('rythme divergent');
                    if(plan.etapes.flatMap(e=>e.cartes).some(c=>c.moduleReplie))ecarts.push('module indisponible');
                }
                const exemple=JSON.parse(prompt.slice(prompt.indexOf('{\n')));
                if(controlerCalibrage(exemple,calibrage,modules).length)ecarts.push(`${tr.id}/${a.id} : exemple invalide`);
            }
        }
        const d={platform:'elea',format:'distanciel',ampleur:'courte',trame:'auto'};
        const c=calibrer(d);const modules=modulesDisponibles('elea');
        const bon={titre:'Fractions',objectifGeneral:'Comprendre',etapes:[1,2,3,4].map(i=>({titre:`Étape ${i}`,objectif:'Comprendre',cartes:[{titre:`Activité ${i}`,objectif:'Comparer',consigne:'Comparer les fractions',module:'TrueFalse',palier:'entrainement',duree:5}]}))};
        const invalide=fn=>{const p=structuredClone(bon);fn(p);return controlerCalibrage(p,c,modules).length>0;};
        const accents=structuredClone(bon);accents.etapes[0].cartes[0].palier='Découverte';
        const accentOK=!controlerCalibrage(accents,c,modules).length&&normaliserPlan(accents,'elea').etapes[0].cartes[0].palier==='decouverte';
        const rituel=planDepuisTrame('rituel','elea','courte');
        const variante=calibrer({...d,trame:'revision'});
        const normalise=normaliserPlan(ancien,'elea');
        // Deux espaces d'écriture commune pour un même travail : une remarque, pas une erreur.
        const carte=(module,titre)=>({titre,objectif:'Produire',consigne:'Écrire',module,palier:'transfert',duree:20});
        const avec=cartes=>({...bon,etapes:[{...bon.etapes[0],cartes}]});
        const deuxDocs=avec([carte('parcours_document','Rédiger'),carte('parcours_document','Améliorer votre document')]);
        const docWiki=avec([carte('parcours_document','Rédiger'),carte('parcours_wiki','Finaliser la structure du document')]);
        const deuxForums=avec([carte('parcours_forum','Se présenter'),carte('parcours_forum','Retour d’expérience')]);
        const deuxTableaux=avec([carte('parcours_tableau','Recueillir'),carte('parcours_tableau','Classer')]);
        const debat=l=>construirePromptPlan({platform:'elea',format:'distanciel',ampleur:l,trame:'debat',contexte:{quoi:'Réseaux sociaux'}}).prompt;
        return {ecarts,total,accentOK,pur:avant===JSON.stringify(TRAMES),historique:controlerCalibrage(ancien,c,modules),bon:!controlerCalibrage(bon,c,modules).length,
            gardes:[invalide(p=>p.etapes=[]),invalide(p=>p.etapes[0].cartes=[]),invalide(p=>p.etapes[0].cartes[0].module='inventé'),invalide(p=>p.etapes[0].cartes[0].duree=0),invalide(p=>p.etapes[0].cartes[0].palier='inconnu'),invalide(p=>p.etapes[0].cartes[0].consigne='')],
            repartition:controlerCalibrage({...bon,etapes:[{...bon.etapes[0],cartes:bon.etapes.flatMap(e=>e.cartes)}]},variante,modules).some(e=>e.includes('Répartition')),
            rituel:rituel.etapes.flatMap(e=>e.cartes).reduce((s,c)=>s+c.duree,0),humain:normalise.etapes.flatMap(e=>e.cartes).length===8,
            obsolete:calibrer({...d,format:'distanciel',trame:'inversee'}).trame===null,
            doublons,fuites,
            remarques:[remarquesComposition(deuxDocs).length===1,remarquesComposition(docWiki).length===1,remarquesComposition(deuxTableaux).length===1,
                !remarquesComposition(deuxForums).length,!controlerCalibrage(deuxDocs,calibrer(d),modules).some(e=>/écriture commune/.test(e))],
            intentions:[/wiki construit/.test(debat('longue')),!/wiki/.test(debat('moyenne').split('Intention pédagogique')[1].split('\n')[0])],
        };
    },ancien);
    ok(`${r.total} combinaisons : aperçu, plan local et prompt respectent l’ampleur`,r.ecarts.length===0);
    ok('la résolution des variantes ne modifie pas la bibliothèque',r.pur);
    ok('l’ancien plan réel de 8 activités est refusé pour une séance courte',r.historique.length>0);
    ok('un plan court complet est accepté',r.bon);
    ok('un accent sur un palier connu est toléré sans changer son sens',r.accentOK);
    ok('étapes vides, modules, durées, paliers et consignes invalides sont repérés',r.gardes.every(Boolean));
    ok('la répartition imposée est contrôlée même si le total est juste',r.repartition);
    ok('le rituel sans IA tient en dix minutes',r.rituel===10);
    ok('aucune trame ne déclenche la remarque de doublon d’espace commun',!r.doublons.length,r.doublons.join(' · '));
    ok('deux documents, un document et un wiki, deux tableaux : remarqués ; deux forums : non ; jamais une erreur de cadrage',r.remarques.every(Boolean),JSON.stringify(r.remarques));
    ok('aucune intention ne dit « version longue » (le modèle le recopiait dans un titre)',!r.fuites.length,r.fuites.join(' · '));
    ok('l’intention suit l’ampleur : le wiki du débat n’est annoncé qu’en version longue',r.intentions.every(Boolean),JSON.stringify(r.intentions));
    ok('les plans humains importés ne sont pas tronqués par le calibrage',r.humain);
    ok('une trame devenue incompatible ne supplante pas l’ampleur',r.obsolete);
    // Des chemins selon les résultats (D90–D93) : chaque trame à chemins, pour 2, 3
    // et 4 chemins, sur chaque plateforme — le plan local, le calibrage et
    // l’exemple du prompt disent la même chose, et ce que fait UN élève tient
    // dans l’ampleur choisie.
    const rc=await page.evaluate(async()=>{
        const {CONFIG}=await import('/js/parcours/config.js');
        const {tramesCompatibles,nbActivites,nbActivitesParEleve}=await import('/js/parcours/templates.js');
        const {controlerCalibrage}=await import('/js/parcours/calibrage.js');const {construirePromptPlan}=await import('/js/parcours/scenario-prompt.js');
        const {planDepuisTrame}=await import('/js/parcours/screen-plan.js');
        const {aiguillagesDuPlan,problemesAiguillage}=await import('/js/parcours/aiguillage.js');
        const ecarts=[];const vues=new Set();let total=0;let reference=null;
        for(const a of CONFIG.ampleurs)for(const f of CONFIG.formats)for(const p of CONFIG.platforms)for(const k of CONFIG.nombresDeChemins){
            const trames=tramesCompatibles(f.id,a.id,{structure:'chemins',chemins:k});
            if(trames.some(tr=>tr.id!=='libre'&&tr.structure!=='chemins'))ecarts.push(`${a.id}/${f.id} : une trame linéaire parmi les chemins`);
            for(const tr of trames){
                total++;vues.add(tr.id);const lieu=`${tr.id}/${a.id}/${f.id}/${p.id}/${k}`;
                const draft={platform:p.id,format:f.id,ampleur:a.id,trame:tr.id,structure:'chemins',chemins:k,contexte:{qui:'Enseignant',quoi:'Fractions'}};
                const plan=planDepuisTrame(tr.id,p.id,a.id,{structure:'chemins',chemins:k});
                const groupes=aiguillagesDuPlan(plan);
                if(groupes.length!==1||groupes[0].chemins.length!==k)ecarts.push(`${lieu} : ${groupes.length} aiguillage(s)`);
                else if(!groupes[0].test||Boolean(groupes[0].commune)!==(tr.modules?tr.aiguillage.debut+tr.aiguillage.nombre<tr.modules.length:true))ecarts.push(`${lieu} : test ou étape commune absents`);
                const {prompt,calibrage,modules}=construirePromptPlan(draft);
                if(calibrage.aiguillage?.nombre!==k)ecarts.push(`${lieu} : calibrage sans chemins`);
                if(tr.modules){
                    const n=plan.etapes.flatMap(e=>e.cartes).length;const parEleve=nbActivitesParEleve(tr);
                    if(n!==nbActivites(tr)||n>12)ecarts.push(`${lieu} : ${n} activités à fabriquer`);
                    if(parEleve<a.activites[0]||parEleve>a.activites[1])ecarts.push(`${lieu} : ${parEleve} activités par élève`);
                    if(JSON.stringify(plan.etapes.map(e=>e.cartes.length))!==JSON.stringify(calibrage.rythme))ecarts.push(`${lieu} : rythme divergent`);
                    const pb=problemesAiguillage(plan);if(pb.length)ecarts.push(`${lieu} : ${pb.map(x=>x.code).join(', ')}`);
                }
                const exemple=JSON.parse(prompt.slice(prompt.indexOf('{\n')));
                const erreurs=controlerCalibrage(exemple,calibrage,modules);
                if(erreurs.length)ecarts.push(`${lieu} : exemple invalide — ${erreurs[0]}`);
                if(tr.id==='point_controle'&&a.id==='moyenne'&&p.id==='elea'&&k===3&&!reference)reference={exemple,calibrage,modules};
            }
        }
        // Un plan reçu qui trahit l’aiguillage est renvoyé au modèle.
        const refuse=fn=>{const p=structuredClone(reference.exemple);fn(p);return controlerCalibrage(p,reference.calibrage,reference.modules).length>0;};
        const debut=reference.calibrage.aiguillage.debut;
        const gardes=[
            refuse(p=>{const [x,y]=[p.etapes[debut].chemin,p.etapes[debut+1].chemin];p.etapes[debut].chemin=y;p.etapes[debut+1].chemin=x;}),
            refuse(p=>{p.etapes.splice(debut+1,1);}),
            refuse(p=>{for(const c of p.etapes[debut-1].cartes)c.module='TrueFalse';}),
            refuse(p=>{for(const c of p.etapes[debut].cartes)c.duree=1;}),
            refuse(p=>{p.etapes[debut].cartes.push(...structuredClone(p.etapes[debut].cartes),...structuredClone(p.etapes[debut].cartes));}),
        ];
        return {ecarts,total,vues:[...vues].sort(),gardes,exempleValide:!controlerCalibrage(reference.exemple,reference.calibrage,reference.modules).length};
    });
    ok(`${rc.total} combinaisons à chemins : plan local, calibrage et prompt s’accordent, ce que fait un élève tient dans l’ampleur`,rc.ecarts.length===0,rc.ecarts.slice(0,5).join(' · '));
    ok('les deux trames à chemins et la structure libre sont proposées en mode chemins',JSON.stringify(rc.vues)===JSON.stringify(['differenciation','libre','point_controle']),rc.vues.join(', '));
    ok('un plan reçu est refusé si les rôles sont intervertis, un chemin manque, le test manque, ou les chemins ne sont pas parallèles',rc.exempleValide&&rc.gardes.every(Boolean),JSON.stringify(rc.gardes));
    await page.close();
    // Rejouer le vrai bouton, le vrai service submit/poll et le vrai healer.
    for(const mode of ['valide','corrige','echec','annule','reseau','doublon','illisible','relance']){
        const pg=await browser.newPage();const demandes=[];const releves=[];let polls=0;const errors=[];
        pg.on('pageerror',e=>errors.push(e.message));
        const bon={titre:'Plan conforme',objectifGeneral:'Comprendre les fractions',notionsPivots:['fraction','numérateur','dénominateur'],etapes:[1,2,3,4].map(i=>({titre:`Étape ${i}`,objectif:'Comparer',cartes:[{titre:`Activité ${i}`,objectif:'Comparer',consigne:'Comparer les fractions',module:'TrueFalse',palier:'entrainement',duree:5}]}))};
        // Deux wikis pour le même travail : conforme au cadrage, mais remarqué (D81).
        const doublon={...bon,etapes:bon.etapes.map((e,i)=>i<2?e:{...e,cartes:[{...e.cartes[0],module:'parcours_wiki',titre:i===2?'Écrire le texte':'Améliorer le texte'}]})};
        await pg.route('**/*',async route=>{
            const u=new URL(route.request().url());if(u.hostname==='127.0.0.1')return route.continue();
            if(/\/llm\/submit-(?:bas|prod)$/.test(u.pathname)){demandes.push(route.request().postDataJSON());return route.fulfill({status:mode==='reseau'?503:200,json:{taskId:`local-${demandes.length}`}});}
            if(/\/llm\/stats-(?:bas|prod)$/.test(u.pathname)){releves.push(route.request().postDataJSON());return route.fulfill({json:{status:'ok'}});}
            // « illisible » : deux réponses sans JSON ; « relance » : une sans JSON, puis le bon plan.
            const sansJson='Désolé, je ne peux pas produire ce plan.';
            if(/\/llm\/result-(?:bas|prod)$/.test(u.pathname)){polls++;return route.fulfill({json:mode==='annule'&&demandes.length===2?{status:'processing'}:{status:'done',content:mode==='illisible'||mode==='relance'&&demandes.length===1?sansJson:JSON.stringify(mode==='doublon'?doublon:mode==='valide'||mode==='relance'||mode==='corrige'&&demandes.length===2?bon:ancien),model:'local-double'}});}
            return route.abort();
        });
        await pg.goto(`http://127.0.0.1:${port}/index.html`);await pg.waitForSelector('#parcours-button');await pg.fill('#qui','Enseignant');await pg.fill('#quoi','Les fractions');await pg.click('#parcours-button');
        await pg.evaluate(async ()=>{
            const {majBrouillon}=await import('/js/parcours/state.js');
            majBrouillon({ampleur:'courte',trame:'auto',plan:{titre:'Brouillon à conserver',etapes:[],objectifGeneral:'Travail personnel'}});
            (await import('/js/parcours/index.js')).__testHooks.allerA(0);
        });
        // Un plan existe déjà : l'atelier le demande dans SA modale, plus dans la boîte du navigateur.
        const natifs=[];pg.on('dialog',d=>{natifs.push(d.message());d.dismiss();});
        await pg.click('#pc-cta');
        await pg.waitForSelector('.pc-confirmation[role="alertdialog"]');
        const question=await pg.evaluate(()=>({boutons:document.querySelectorAll('.pc-confirmation button').length,
            focus:document.activeElement?.textContent.trim(),titre:document.querySelector('#pc-confirmation-titre')?.textContent}));
        if(mode==='valide')ok('remplacer un plan : une modale de l’atelier (garder, remplacer, exporter), le focus sur « garder », aucune boîte native',
            natifs.length===0&&question.boutons===3&&/Garder/.test(question.focus)&&/Remplacer le parcours/.test(question.titre||''));
        await pg.click('.pc-confirmation .pc-confirmation__abandon');
        if(mode==='annule'){
            await pg.waitForFunction(()=>document.querySelector('.pc-veil__sub')?.textContent.includes('ajuste'),null,{timeout:20000});
            for(let i=0;i<100&&demandes.length<2;i++)await new Promise(r=>setTimeout(r,20));
            assert.equal(demandes.length,2);
            // L'arrêt vit DANS le panneau d'attente ; la barre du bas se tait
            // pendant la composition (un seul « Arrêter » à l'écran).
            ok('pendant la composition, l’arrêt est dans le panneau et la barre se tait',
                await pg.evaluate(()=>!!document.querySelector('.pc-veil__arret'))
                &&!(await pg.locator('#pc-cta').isVisible()));
            ok('les jalons suivent l’appel réel : envoi fait, modèle en cours',
                await pg.evaluate(()=>{const j=[...document.querySelectorAll('.pc-veil__jalons .pc-jalon')];
                    return j.length===3&&j[0].classList.contains('pc-jalon--fait')&&j[1].classList.contains('pc-jalon--encours');}));
            await pg.click('.pc-veil__arret');
        }
        await pg.waitForFunction(()=>!document.querySelector('.pc-veil'),null,{timeout:30000});
        const etat=await pg.evaluate(async ()=>({titre:(await import('/js/parcours/state.js')).brouillon().plan.titre,note:document.querySelector('#pc-action-note')?.textContent,edition:!!document.querySelector('.pc-title-input')}));
        // D107 : un plan hors cadrage deux fois est réparé et RETENU ; seule une réponse sans plan échoue.
        const titreAttendu={valide:'Plan conforme',corrige:'Plan conforme',doublon:'Plan conforme',relance:'Plan conforme',echec:ancien.titre}[mode]||'Brouillon à conserver';
        const succes=titreAttendu!=='Brouillon à conserver';
        ok(`${mode} : nombre d’appels borné`,demandes.length===(['valide','reseau'].includes(mode)?1:2));
        ok(`${mode} : plan accepté ou brouillon conservé`,etat.titre===titreAttendu,etat.titre);
        ok(`${mode} : interface rend la main au bon écran`,etat.edition===succes);
        if(mode==='corrige')ok('la reprise conserve le sujet, rappelle le compte et reprend le même modèle',demandes[1].prompt.includes('Les fractions')&&demandes[1].prompt.includes('Total reçu : 8')&&demandes[0].model===demandes[1].model);
        if(mode==='doublon')ok('un doublon d’espace commun demande UNE reprise, puis le plan passe même s’il le garde',demandes[1].prompt.includes('écriture commune')&&!demandes[0].prompt.includes('NOUVELLE COMPOSITION'));
        if(mode==='echec'){
            const forme=await pg.evaluate(async ()=>(await import('/js/parcours/state.js')).brouillon().plan.etapes.map(e=>e.cartes.length).join('+'));
            ok('hors cadrage deux fois : ramené à l’ampleur (une activité par étape) et retenu, sans message d’échec (D107)',forme==='1+1+1+1'&&!etat.note.trim(),`${forme} « ${etat.note} »`);
        }
        if(mode==='illisible')ok('deux réponses sans JSON : brouillon conservé, message traduit, aucune clé brute',etat.note.trim().length>10&&!etat.note.includes('parcours_'),etat.note);
        if(mode==='relance')ok('une réponse sans JSON est redemandée UNE fois, et le plan suivant est retenu',demandes[1].prompt.includes('objet JSON lisible')&&!demandes[0].prompt.includes('objet JSON lisible'));
        // D69 : le plan n'écrit plus de ligne DONNEES (`stats:'skip'`) ; il a SA ligne PARCOURS
        // dès que le modèle a répondu — succès, reprise ou hors cadrage — et aucune sinon.
        ok(`${mode} : chaque appel de plan part en stats:'skip'`,demandes.every(d=>d.stats==='skip'));
        const attendu={valide:['ok',1],corrige:['ok',2],echec:['ok',2],doublon:['ok',2],relance:['ok',2],illisible:['echec',2]}[mode]||null;
        for(let i=0;i<50&&attendu&&releves.length<1;i++)await new Promise(r=>setTimeout(r,20));
        const statsId=await pg.evaluate(async ()=>(await import('/js/parcours/state.js')).brouillon().statsId);
        if(attendu){
            const r=releves[0]||{};
            ok(`${mode} : une ligne PARCOURS (${attendu[0]}, ${attendu[1]} essai(s), modèle ayant répondu)`,
                releves.length===1&&r.kind==='parcours'&&r.origine==='ia'&&r.statut===attendu[0]&&r.essais===attendu[1]
                &&r.model==='local-double'&&r.trame===undefined&&r.modele_parcours==='auto'&&r.plateforme==='elea'&&r.ampleur==='courte');
            ok(`${mode} : l’identifiant du parcours n’est rangé que si le plan est retenu`,
                succes?(r.parcours_id===statsId&&r.nb_activites===4):(statsId!==r.parcours_id&&r.nb_activites===0));
        } else ok(`${mode} : sans réponse du modèle, aucun relevé`,releves.length===0);
        ok(`${mode} : aucune erreur JavaScript`,errors.length===0);
        await pg.close();
    }
    // Modèle qui ne répond jamais : c'est l'état que l'enseignant voit le plus
    // longtemps. Le panneau d'attente doit y dire OÙ EN EST l'appel, annoncer
    // sa durée, et porter le seul bouton d'arrêt de l'écran.
    {
        const pg=await browser.newPage();const errors=[];pg.on('pageerror',e=>errors.push(e.message));
        await pg.route('**/*',async route=>{const u=new URL(route.request().url());
            if(u.hostname==='127.0.0.1')return route.continue();
            if(/\/llm\/submit-(?:bas|prod)$/.test(u.pathname))return route.fulfill({json:{taskId:'lent'}});
            if(/\/llm\/result-(?:bas|prod)$/.test(u.pathname))return route.fulfill({json:{status:'processing'}});
            return route.abort();});
        await pg.goto(`http://127.0.0.1:${port}/index.html`);await pg.waitForSelector('#parcours-button');
        await pg.fill('#qui','Enseignant');await pg.fill('#quoi','Les fractions');await pg.click('#parcours-button');
        await pg.evaluate(async ()=>{
            const {majBrouillon}=await import('/js/parcours/state.js');
            majBrouillon({ampleur:'courte',trame:'auto'});
            (await import('/js/parcours/index.js')).__testHooks.allerA(0);
        });
        await pg.click('#pc-cta');
        await pg.waitForSelector('.pc-veil__jalons');
        // Le jalon bascule quand l'appel part VRAIMENT (après la construction du
        // prompt) : on attend l'événement plutôt que de parier sur son instant.
        const jalonsOk=await pg.waitForFunction(()=>{
            const j=[...document.querySelectorAll('.pc-veil__jalons .pc-jalon')];
            return j.length===3&&j[0].classList.contains('pc-jalon--fait')&&j[1].classList.contains('pc-jalon--encours');
        },null,{timeout:10000}).then(()=>true).catch(()=>false);
        const attente=await pg.evaluate(()=>({
            ctaCache:getComputedStyle(document.querySelector('#pc-cta')).display==='none',
            ctaTexte:document.querySelector('#pc-cta').textContent.trim(),
            arret:!!document.querySelector('.pc-veil__arret'),
            jalons:[...document.querySelectorAll('.pc-veil__jalons .pc-jalon')].map(j=>j.className.split('--')[1]),
            duree:document.querySelector('.pc-veil__duree')?.textContent||'',
            bonbon:document.querySelector('.pc-veil .pc-bonbon--remplissage')?getComputedStyle(document.querySelector('.pc-veil .pc-bonbon__plein')).animationName:'',
        }));
        ok('attente : l’arrêt est dans le panneau, la barre du bas se tait — pour de bon',
            attente.arret&&attente.ctaCache&&!(await pg.locator('#pc-cta').isVisible()),JSON.stringify(attente));
        ok('attente : le cadrage est parti, le modèle compose, le format attend son tour',
            jalonsOk&&JSON.stringify(attente.jalons)===JSON.stringify(['fait','encours','attente']),JSON.stringify(attente.jalons));
        ok('attente : la durée habituelle est annoncée',/minute/i.test(attente.duree),attente.duree);
        ok('attente : le caramel se remplit',attente.bonbon==='pc-remplir',attente.bonbon);
        // Le cycle doit être CONTINU : c'est l'effacement en opacité de la
        // première version qui se voyait comme un flash. On échantillonne un
        // tour complet — l'opacité ne doit jamais quitter 1.
        const opacites=[];
        for(let i=0;i<12;i++){
            opacites.push(await pg.evaluate(()=>getComputedStyle(document.querySelector('.pc-veil .pc-bonbon__plein')).opacity));
            await new Promise(r=>setTimeout(r,300));
        }
        ok('attente : le remplissage boucle sans coupure (jamais d’opacité qui s’efface)',
            opacites.every(o=>Number(o)===1),opacites.join(' '));
        await pg.click('.pc-veil__arret');
        await pg.waitForFunction(()=>!document.querySelector('.pc-veil'),null,{timeout:15000});
        ok('l’arrêt du panneau rend la main, et la barre du bas retrouve son bouton',
            await pg.locator('#pc-cta').isVisible());
        ok('attente : aucune erreur JavaScript',errors.length===0);
        await pg.close();
    }
    // D69 — une vraie carte fabriquée par la file, SANS doublure : ce qui part au Worker
    // porte le nom de l'activité, la version et l'identifiant du parcours. Avant, la ligne
    // Grist arrivait avec `Activite` et `Version_caramel` vides.
    {
        const pg=await browser.newPage();const demandes=[];const releves=[];const errors=[];
        pg.on('pageerror',e=>errors.push(e.message));
        const vf=readFileSync(resolve(root,'assets/data/examples/true_false_1.json'),'utf8');
        await pg.route('**/*',async route=>{const u=new URL(route.request().url());
            if(u.hostname==='127.0.0.1')return route.continue();
            if(/\/llm\/submit-(?:bas|prod)$/.test(u.pathname)){demandes.push(route.request().postDataJSON());return route.fulfill({json:{taskId:`carte-${demandes.length}`}});}
            if(/\/llm\/result-(?:bas|prod)$/.test(u.pathname))return route.fulfill({json:{status:'done',content:vf,model:'local-carte'}});
            if(/\/llm\/stats-(?:bas|prod)$/.test(u.pathname)){releves.push(route.request().postDataJSON());return route.fulfill({json:{status:'ok'}});}
            return route.abort();});
        await pg.goto(`http://127.0.0.1:${port}/index.html`);await pg.waitForSelector('#parcours-button');
        await pg.fill('#qui','Enseignant');await pg.fill('#quoi','Les fractions');await pg.click('#parcours-button');
        const r=await pg.evaluate(async ()=>{
            const {majBrouillon,brouillon}=await import('/js/parcours/state.js');
            const {normaliserPlan}=await import('/js/parcours/screen-plan.js');
            const {creerFile}=await import('/js/parcours/parcours-runner.js');
            const {getCaramelVersionFromFooter}=await import('/js/core/utils.js');
            const plan=normaliserPlan({titre:'Fractions',objectifGeneral:'Comparer',notionsPivots:['fraction'],
                etapes:[{titre:'Étape 1',objectif:'Comparer',cartes:[{titre:'Vrai ou faux',objectif:'Comparer',consigne:'Comparer les fractions',module:'TrueFalse',palier:'entrainement',duree:5}]}]},'elea');
            majBrouillon({plan,statsId:'9b2f7c1e-4a8d-4f5e-9c3b-2d1e0f6a7b8c'});
            const etat=await creerFile(brouillon()).demarrer();
            return {faites:etat.faites,version:getCaramelVersionFromFooter(),statsId:brouillon().statsId};
        });
        const a=(demandes[0]||{}).activity||{};
        ok('fabrication : la carte est faite par le vrai chemin submit/poll',r.faites===1&&demandes.length===1);
        ok('fabrication : le Worker reçoit le nom de l’activité, la version et l’identifiant du parcours',
            a.nameKey==='h5p_true_false_name'&&a.moduleKey==='TrueFalse'&&a.category==='parcours'
            &&Boolean(r.version)&&a.caramelVersion===r.version&&a.parcoursId==='9b2f7c1e-4a8d-4f5e-9c3b-2d1e0f6a7b8c');
        ok('fabrication : l’activité garde sa ligne DONNEES (pas de stats:skip) et ne relève aucun plan',
            demandes[0]&&demandes[0].stats===undefined&&releves.length===0);
        ok('fabrication : aucune erreur JavaScript',errors.length===0);
        await pg.close();
    }

    console.log(`Calibrage parcours : ${pass} PASS / 0 FAIL`);
}finally{await browser?.close();server.kill('SIGTERM');}
