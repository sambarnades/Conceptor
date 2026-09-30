/** Recette UI sans IA distante : plan, contenus, erreur, annulation et réouverture. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
const root = new URL('../', import.meta.url).pathname;
const { chromium } = createRequire(new URL('./roundtrip/package.json', import.meta.url))('playwright');
const origin = 'http://127.0.0.1:8194';
const output = '/tmp/caramel-parcours-externe'; await mkdir(output, { recursive: true });
const server = spawn('python3', ['tests/serveur-statique.py', '8194', '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser; const failures = [], successes = []; const check = (ok, label) => (ok ? successes : failures).push(label);
try {
    for (let n = 0; n < 100; n++) { try { if ((await fetch(origin)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 950 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage(); const remote = [];
    await page.route('**/*', r => { if (r.request().url().startsWith(origin + '/')) return r.continue(); remote.push(r.request().url()); return r.abort(); });
    const dialoguesNatifs = [];
    page.on('dialog', d => { dialoguesNatifs.push(d.type()); d.accept(); });
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#pc-commutateur');
    await page.evaluate(async () => { await (await import('/js/core/translation.js')).loadTranslations('fr'); });
    await page.locator('#quoi').fill('Les capitales européennes');
    check(await page.evaluate(() => document.querySelector('#pc-commutateur').previousElementSibling?.matches('.prompt-generator')), 'Choix placé juste après le formulaire complet');
    await page.screenshot({ path: output + '/accueil.png', fullPage: false });
    await page.locator('#parcours-button').click();
    await page.evaluate(async () => (await import('/js/parcours/state.js')).majBrouillon({ ampleur: 'courte', trame: 'auto' }));
    // D64 : l'action primaire génère en un clic ; « Personnaliser les instructions » ouvre la fenêtre
    // de génération d'une activité (prompt à copier, réponse à coller).
    check(await page.locator('#pc-mode').count() === 0 && await page.locator('.pc-actionbar #pc-guide-open').isVisible()
        && await page.locator('#pc-scenario-importer').count() === 0
        && (await page.locator('#pc-guide-open').innerText()).trim() === 'Personnaliser le plan'
        && await page.locator('#pc-guide-open > .fa-sliders').count() === 1
        && await page.locator('#pc-guide-open > .fa-copy').count() === 0,
    'Pied : personnalisation explicite avec une icône de réglage, sans interrupteur ni icône de copie');
    const selecteurPlan = page.locator('#pc-actionbar-generation');
    const fusion = await selecteurPlan.evaluate(root => {
        const ligne = root.querySelector('.llm-buttons-row');
        const principale = root.querySelector('.main-action-button > button');
        const fleche = root.querySelector('.dropdown-toggle');
        const a = principale.getBoundingClientRect(), b = fleche.getBoundingClientRect();
        return {
            jointure: Math.abs(a.right - b.left),
            overflow: getComputedStyle(ligne).overflow,
            rayonPrincipal: getComputedStyle(principale).borderTopRightRadius,
            rayonFleche: getComputedStyle(fleche).borderTopLeftRadius,
            separation: getComputedStyle(fleche).borderLeftWidth,
            flecheHorizontale: Boolean(principale.querySelector('.fa-arrow-right')),
        };
    });
    check(fusion.jointure < 0.5 && fusion.overflow === 'hidden'
        && fusion.rayonPrincipal === '0px' && fusion.rayonFleche === '0px'
        && fusion.separation === '0px' && !fusion.flecheHorizontale,
        'Action IA : un seul contrôle continu, sans séparateur ni flèche horizontale');
    await selecteurPlan.locator('.dropdown-toggle').click();
    check(await selecteurPlan.locator('.model-selector-dropdown.show li').count() === 3,
        'Plan : la flèche accolée ouvre le même choix de modèles que « Générer en un clic »');
    await selecteurPlan.locator('[data-model-id="gemma-4-31b"]').click();
    await page.locator('#pc-guide-open').click();
    await page.waitForFunction(() => document.querySelector('#pc-guide-prompt')?.value.length > 100);
    const dialogue = page.locator('.pc-guide');
    check(await dialogue.locator('.modal-panel').count() === 2 && await dialogue.locator('.floating-toolbar .lock-btn').count() === 2
        && await dialogue.locator('.floating-toolbar .fullscreen-btn').count() === 2 && (await page.locator('#pc-external-title').textContent()).length > 0,
        'Fenêtre de la modale d’activité : deux panneaux, plein écran et cadenas');
    const response = page.locator('#pc-guide-reponse');
    const bouton = page.locator('#pc-guide-generer');
    check((await bouton.textContent()).trim() === await page.evaluate(async () => (await import('/js/core/translation.js')).t('generate_one_click')), 'Zone vide : « Générer en un clic »');
    const selecteursDialogue = dialogue.locator('.pc-llm-selector');
    check(await selecteursDialogue.count() === 2
        && await selecteursDialogue.locator('[data-model-id="gemma-4-31b"].selected').count() === 2,
        'Génération : le modèle choisi pour le plan est repris dans les deux boutons de la fenêtre');
    await dialogue.locator('.copy-prompt-btn').click();
    check((await page.evaluate(() => navigator.clipboard.readText())).includes('capitales'), 'Prompt copié avec le sujet');
    await response.fill('Désolé, je ne peux pas produire ce plan.');
    check(await dialogue.locator('.pc-llm-selector--sans-menu').count() === 2,
        'Réponse collée : la flèche disparaît puisque aucun modèle Caramel ne sera appelé');
    await bouton.click();
    await page.waitForFunction(() => document.querySelector('.pc-guide__etat')?.textContent.includes('corrigée'));
    check(!(await page.locator('.pc-guide__etat').textContent()).includes('parcours_'), 'Réponse sans JSON : message traduit, aucune clé brute');
    await response.fill('{"titre":"incomplet"}');
    await bouton.click();
    await page.waitForFunction(() => document.querySelector('.pc-guide__etat')?.textContent.includes('Total reçu'));
    check(await page.evaluate(async () => !(await import('/js/parcours/state.js')).brouillon().plan), 'Plan invalide non appliqué');
    const plan = { titre: 'Capitales RELU', objectifGeneral: 'Associer pays et capitales', notionsPivots: ['France', 'Italie', 'Espagne'], etapes: Array.from({length: 4}, (_, i) => ({ titre: 'Étape '+(i+1), objectif: 'Identifier une capitale', cartes: [{ module: 'MultipleChoice', titre: 'Question '+(i+1), objectif: 'Identifier Paris', consigne: 'Choisir la capitale', palier: 'entrainement', duree: 5 }] })) };
    // Une réponse telle qu'une IA grand public la rend : phrase, bloc ```json, conclusion.
    await response.fill(`Voici le plan demandé :\n\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\`\n\nN'hésitez pas à me demander des ajustements.`);
    await page.screenshot({ path: output + '/plan-colle.png' });
    await bouton.click();
    await page.waitForSelector('.pc-title-input');
    check(await page.locator('.pc-guide').count() === 0, 'Réponse collée utilisée en un clic, fenêtre fermée');
    check(!(await page.locator('#pc-action-note').textContent()).trim(), 'Plan : aucun texte d’accompagnement dans le pied');
    check((await page.locator('#pc-guide-open').innerText()).trim() === 'Personnaliser les instructions',
        'Une fois le plan créé, l’action distingue les instructions des activités');
    // « Personnaliser les instructions » sur le plan mène aux activités sans démarrer la file IA.
    await page.locator('#pc-guide-open').click();
    await page.waitForSelector('.pc-carte--fab');
    check(await page.evaluate(() => !document.querySelector('.pc-carte--encours') && !document.querySelector('.pc-cta--annuler')), 'Personnalisation : aucune génération lancée en arrivant sur les activités');
    check(await page.locator('[data-action="external"] > .fa-wand-magic-sparkles').count() > 0
        && await page.locator('[data-action="external"] > .fa-copy').count() === 0,
    'Activités : une seule entrée IA, distincte de « Copier le prompt »');
    await page.locator('[data-action="external"]').first().click();
    await page.waitForFunction(() => document.querySelector('#pc-guide-prompt')?.value.includes('Capitales RELU'));
    const answer = { question: 'Quelle est la capitale de la France ?', answers: [{text:'Paris',correct:true},{text:'Rome',correct:false}], behaviour: { singleAnswer: true } };
    await response.fill(`Bien sûr ! \`\`\`json\n${JSON.stringify(answer)}\n\`\`\` Bonne séance.`);
    check((await bouton.textContent()).trim() === await page.evaluate(async () => (await import('/js/core/translation.js')).t('generate_activity')), 'Réponse collée : « Générer l’activité »');
    await bouton.click();
    await page.waitForFunction(() => !document.querySelector('.pc-guide'));
    const result = await page.evaluate(async () => {
        const draft = (await import('/js/parcours/state.js')).brouillon();
        const { versScenario, depuisScenario } = await import('/js/parcours/scenario-io.js');
        const restored = depuisScenario(JSON.stringify(versScenario(draft)));
        const card = draft.plan.etapes[0].cartes[0];
        const { packageActivity } = await import('/js/core/package-activity.js');
        const pkg = await packageActivity({ moduleKey: card.module, content: card.contenu });
        return { answers: restored.plan.etapes[0].cartes[0].contenu.answers.length, bytes: pkg.bytes.length };
    });
    check(result.answers === 2 && result.bytes > 0, 'Réponse externe sauvegardée, scénario réimportable et H5P exportable');
    await page.locator('[data-action="external"]').first().click();
    await page.waitForFunction(() => !!document.querySelector('#pc-guide-prompt')?.value);
    await response.fill(`\`\`\`json\n${JSON.stringify({ ...answer, question: 'Quelle est la capitale de l’Italie ?' })}\n\`\`\``);
    await bouton.click();
    await page.waitForSelector('.pc-confirmation[role="alertdialog"]');
    check(dialoguesNatifs.length === 0
        && await page.locator('.pc-confirmation').getByRole('button', { name: 'Conserver l’activité actuelle' }).count() === 1,
    'Remplacement : confirmation Caramel, aucune popup native');
    await page.locator('.pc-confirmation').getByRole('button', { name: 'Conserver l’activité actuelle' }).click();
    check(await page.locator('.pc-guide').count() === 1
        && await page.evaluate(async () => (await import('/js/parcours/state.js')).brouillon().plan.etapes[0].cartes[0].contenu.question.includes('France')),
    'Conserver garde le contenu actuel et la fenêtre de personnalisation ouverte');
    await response.fill('{invalide');
    await page.keyboard.press('Escape');
    check(await page.evaluate(async () => (await import('/js/parcours/state.js')).brouillon().plan.etapes[0].cartes[0].contenu.answers.length === 2), 'Annulation préserve le contenu');
    await page.reload({waitUntil: 'domcontentloaded'}); await page.waitForSelector('#parcours-button'); await page.locator('#parcours-button').click();
    check(await page.evaluate(async () => (await import('/js/parcours/state.js')).brouillon().plan.etapes[0].cartes[0].contenu.answers.length === 2), 'Réouverture après rechargement préserve le contenu');
    await page.setViewportSize({width:390,height:844});
    // Rouvert sur le plan : la personnalisation mène de nouveau aux activités.
    await page.locator('#pc-guide-open').click();
    await page.locator('[data-action="external"]').first().click();
    await page.waitForFunction(() => !!document.querySelector('#pc-guide-prompt')?.value);
    await page.screenshot({path:output+'/mobile.png'});
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('.pc-guide').getBoundingClientRect().right <= innerWidth), 'Pas de débordement mobile');
    // Le relevé d'usage (`/llm/stats-*`, D69) n'est pas un appel d'IA : il ne porte que des
    // identifiants fermés et des compteurs. Tout le reste reste interdit.
    check(!remote.filter(url => !/\/llm\/stats-/.test(url)).some(url => /submit|result|generate|enrich|vision|webhook/.test(url)), 'Aucun appel IA sur le circuit externe textuel');
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelector('#pc-atelier').scrollIntoView({block:'start'}));
    await page.waitForTimeout(100);
    check(await page.evaluate(() => {
        const group = document.querySelector('#pc-commutateur').getBoundingClientRect();
        const header = document.querySelector('.app-bar').getBoundingClientRect();
        return getComputedStyle(document.querySelector('#pc-commutateur')).position !== 'sticky'
            && [...document.querySelectorAll('.pc-commutateur__label')].every(el => getComputedStyle(el).display !== 'none');
    }), 'Sélecteur mobile non flottant et libellés conservés');
    await page.screenshot({path:output+'/mobile-selection.png'});

    const examples = readdirSync(root + 'assets/data/examples');
    const contracts = await page.evaluate(async names => {
        const { PREFIX_TO_MODULE } = await import('/tests/roundtrip/fixtures-prefixes.js');
        const { verifierActiviteExterne } = await import('/js/parcours/external-ai.js');
        const { modulesDisponibles } = await import('/js/parcours/activity-router.js');
        const allowed = new Set(['elea', 'magistere', 'moodle'].flatMap(p => modulesDisponibles(p).map(m => m.cle)));
        const results = [];
        for (const entry of PREFIX_TO_MODULE) {
            if (!allowed.has(entry.moduleKey)) continue;
            const name = names.find(n => n === entry.prefix + '_1.json');
            if (!name) continue;
            try {
                const text = await fetch('/assets/data/examples/' + name).then(r => r.text());
                await verifierActiviteExterne(text, { carte: { module: entry.moduleKey, titre: 'Essai' }, source: null });
                results.push({module: entry.moduleKey, ok: true});
            } catch (e) { results.push({module: entry.moduleKey, ok: false, error: e.message}); }
        }
        const { MODULES_PARCOURS } = await import('/js/parcours/modules-parcours.js');
        for (const [module, def] of Object.entries(MODULES_PARCOURS)) {
            // Questions, pages (champs structurés) : l'exemple même que le prompt donne.
            const body = Object.fromEntries(Object.keys(def.champs).map(k => [k, def.structures?.[k] ? def.structures[k].exemple
                : def.listes?.includes(k) ? ['Choix A', 'Choix B'] : 'Consigne pour les élèves']));
            try { await verifierActiviteExterne(JSON.stringify(body), {carte: {module, titre: 'Essai'}, source: null}); results.push({module, ok: true}); }
            catch (e) { results.push({module, ok: false, error: e.message}); }
        }
        const imageExample = await fetch('/assets/data/examples/image_hotspots_1.json').then(r => r.json());
        imageExample.backgroundImageAltText = 'Carte des capitales RELU';
        const imageResult = await verifierActiviteExterne(JSON.stringify(imageExample), {carte:{module:'ImageHotspots'},source:{type:'image',image:imageExample.image}});
        results.push({module:'Alternative de l’image conservée',ok:imageResult.value.backgroundImageAltText === imageExample.backgroundImageAltText});
        try { await verifierActiviteExterne('{}', {carte:{module:'MultipleChoice'},source:null}); results.push({module: 'Réponse vide refusée',ok:false}); }
        catch { results.push({module:'Réponse vide refusée',ok:true}); }
        // Un exercice collé sans consigne est refusé, en nommant la question (D103) :
        // le schéma de l'éditeur tient la consigne pour obligatoire.
        const quiz = await fetch('/assets/data/examples/quiz_mixte_1.json').then(r => r.json());
        const rang = quiz.questions.findIndex(q => String(q.library).startsWith('H5P.MarkTheWords'));
        delete quiz.questions[rang].params.taskDescription;
        try { await verifierActiviteExterne(JSON.stringify(quiz), {carte:{module:'QuizSet',titre:'Essai'},source:null}); results.push({module:'Consigne manquante refusée',ok:false}); }
        catch (e) { const nommee = new RegExp(`Question ${rang + 1} .*Consigne`).test(e.message); results.push({module:'Consigne manquante refusée, question nommée',ok:nommee,...(nommee ? {} : {error:e.message})}); }
        return results;
    }, examples);
    for (const result of contracts) check(result.ok, 'Réponse exemple ' + result.module + (result.error ? ': ' + result.error : ''));
    await writeFile(output+'/contrats.json', JSON.stringify(contracts, null, 2));
    await writeFile(output+'/resultats.json',JSON.stringify({successes,failures},null,2));
    console.log(JSON.stringify({successes,failures},null,2)); if(failures.length) process.exitCode=1;
} catch(e) { console.error(e); process.exitCode=1; }
finally { await browser?.close(); server.kill('SIGTERM'); }
