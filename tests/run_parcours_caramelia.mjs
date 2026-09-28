/** Caramelia → atelier réel, reprises et courses asynchrones ; aucun service distant. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8122;
const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
let browser, pass = 0;
const ok = (label, value) => { assert.ok(value, label); pass++; console.log(`  ✓ ${label}`); };
try {
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`)).ok) break; } catch {}
        await new Promise(r => setTimeout(r, 100));
    }
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
    await page.goto(`http://127.0.0.1:${PORT}/index.html?debug`);
    await page.waitForFunction(() => window.Caramelia && document.querySelector('#parcours-button') && document.querySelector('#caramelia-fab'));
    await page.evaluate(async () => {
        window.qa = {
            flow: await import('/js/caramelia/flow.js'),
            actions: await import('/js/caramelia/actions.js'),
            i18n: await import('/js/caramelia/i18n.js'),
            config: (await import('/js/caramelia/config.js')).CONFIG,
            requests: [], mode: 'answer', response: 'Voici comment préparer votre cours.',
        };
        const original = window.fetch.bind(window);
        window.fetch = async (url, opts = {}) => {
            if (String(url) !== qa.config.chatWebhookUrl) return original(url, opts);
            qa.requests.push(JSON.parse(opts.body));
            if (qa.mode === 'delayed') return new Promise(resolve => { qa.release = () => resolve(new Response(JSON.stringify({ response: qa.response }))); });
            if (qa.mode === 'empty') return new Response(JSON.stringify({ response: '' }));
            if (qa.mode === 'offline') throw new TypeError('Réseau simulé indisponible');
            return new Response(JSON.stringify({ response: qa.response }));
        };
    });
    const quick = label => page.locator('.caramelia-quick-btn').filter({ hasText: label });
    const reset = async () => page.evaluate(() => { Caramelia.reset(); Caramelia.open(); });
    await page.click('#caramelia-fab');
    ok('accueil : aide, activité unique et parcours', await page.locator('.caramelia-quick-btn').count() === 3);
    await page.evaluate(() => {
        qa.actions.fillFormField('qui', 'Formatrice en entreprise');
        qa.actions.fillFormField('quoi', 'Les gestes de sécurité au laboratoire');
        qa.actions.fillFormField('niveau', 'Adultes en formation');
        const corpus = document.querySelector('#ocr-output');
        corpus.textContent = 'Document de référence à conserver.';
        qa.initialFields = ['qui','quoi','niveau'].map(k => document.getElementById(k)?.value);
    });
    await mkdir('/tmp/caramelia-parcours-captures', { recursive: true });
    await page.locator('#caramelia-panel').screenshot({ animations: 'disabled', path: '/tmp/caramelia-parcours-captures/menu-desktop.png' });
    await quick('Créer un parcours').click();
    await page.waitForSelector('#pc-atelier');
    ok('un clic ouvre le cadrage et ferme le chat', await page.evaluate(() => !!document.querySelector('#pc-atelier .pc-steps') && !Caramelia.state.isOpen));
    await page.waitForTimeout(450);
    ok('le focus reste sur le mode parcours sans sauter le formulaire', await page.evaluate(() => document.activeElement.id === 'parcours-button'));
    ok('Caramelia n’ajoute pas de défilement au premier cadrage', await page.evaluate(() => window.scrollY === 0));
    ok('les champs et le corpus sont conservés', await page.evaluate(() => JSON.stringify(qa.initialFields) === JSON.stringify(['qui','quoi','niveau'].map(k => document.getElementById(k)?.value))));
    ok('le texte source est bien hérité par le parcours', await page.evaluate(async () => (await import('/js/parcours/state.js')).contexteHerite().corpus === 'Document de référence à conserver.'));
    ok('aucun appel de chatbot pour ouvrir le parcours', await page.evaluate(() => qa.requests.length === 0));
    // Import par l'interface : la reprise doit retrouver un vrai plan, sans le remplacer.
    const scenario = { produit: 'caramel-parcours', format: 1, version: '0.1.0', cadrage: { platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'revision' }, plan: { titre: 'Un parcours à conserver', objectifGeneral: 'Appliquer les règles', notionsPivots: [], etapes: [{ id: 'e1', titre: 'Échanger', objectif: '', cartes: [{ id: 'c1', module: 'parcours_forum', titre: 'Nos pratiques', objectif: 'Partager', consigne: '', duree: 10, palier: 'decouverte', contenu: { title: 'Nos pratiques', intro: 'Décrivez votre expérience.' } }] }] } };
    await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
    await page.waitForSelector('[data-carte="c1"]');
    const saved = await page.evaluate(() => sessionStorage.getItem('caramel_parcours_draft'));
    await page.click('#activites-button');
    await reset();
    ok('un brouillon existant est annoncé comme une reprise', await quick('Reprendre mon parcours').count() === 1);
    await quick('Reprendre mon parcours').click();
    ok('le plan et ses contenus sont retrouvés sans écrasement', await page.locator('.pc-title-input').inputValue() === scenario.plan.titre && saved === await page.evaluate(() => sessionStorage.getItem('caramel_parcours_draft')));
    // Le guidage existant doit hériter des champs sans redemander le public.
    await page.click('#activites-button');
    await reset();
    await quick('Créer une activité').click();
    ok('le public déjà saisi est repris dans le guidage activité', await page.evaluate(() => Caramelia.state.genState.niveau === 'Adultes en formation' && Caramelia.state.genState.step === 'category'));
    await page.evaluate(() => { qa.actions.fillFormField('qui', ''); qa.flow.startGenerateFlow(); });
    ok('le sujet et le public restent connus quand le rôle manque', await page.evaluate(() => Caramelia.state.genState.step === 'qui' && Caramelia.state.genState.quoi.includes('sécurité') && Caramelia.state.genState.niveau.includes('Adultes')));
    await page.evaluate(() => qa.flow.handleUserInput('Formatrice'));
    ok('répondre au rôle saute les champs déjà connus', await page.evaluate(() => Caramelia.state.genState.step === 'category'));
    await page.evaluate(() => { qa.actions.fillFormField('niveau', ''); qa.flow.startGenerateFlow(); });
    ok('un public absent est demandé avant les activités', await page.evaluate(() => Caramelia.state.genState.step === 'niveau'));
    // Réponse tardive : même un transport qui ignore AbortSignal ne doit pas repeindre.
    await reset();
    await page.evaluate(() => { qa.mode = 'delayed'; });
    await page.fill('.caramelia-input', 'Comment préparer un parcours ?');
    await page.press('.caramelia-input', 'Enter');
    await page.waitForFunction(() => !!qa.release);
    const count = await page.evaluate(() => qa.requests.length);
    await page.fill('.caramelia-input', 'Message suivant à conserver');
    await page.press('.caramelia-input', 'Enter');
    ok('une seule requête en cours, seconde saisie conservée', await page.evaluate(n => qa.requests.length === n && Caramelia.state.elements.input.value === 'Message suivant à conserver' && Caramelia.state.elements.sendBtn.disabled, count));
    await page.evaluate(() => { qa.oldSignal = Caramelia.state.pendingQuery.signal; Caramelia.reset(); qa.release(); });
    await page.waitForTimeout(100);
    ok('redémarrer annule la requête et ignore sa réponse tardive', await page.evaluate(() => qa.oldSignal.aborted && Caramelia.state.history.length === 1 && !Caramelia.state.pendingQuery && !Caramelia.state.elements.sendBtn.disabled && !document.querySelector('[data-typing]')));
    await page.evaluate(() => { qa.mode = 'answer'; });
    await page.fill('.caramelia-input', 'Comment préparer un parcours ?');
    await page.press('.caramelia-input', 'Enter');
    await page.waitForFunction(() => !Caramelia.state.pendingQuery);
    ok('une réponse d’aide propose aussi de rejoindre le parcours', await quick('Reprendre mon parcours').count() >= 1);
    // Double vide : retry borné, message exact et accès local toujours disponible.
    await reset();
    await page.evaluate(() => { qa.mode = 'empty'; qa.requests = []; });
    await page.fill('.caramelia-input', 'Comment fonctionne le site ?');
    await page.press('.caramelia-input', 'Enter');
    await page.waitForFunction(() => !Caramelia.state.pendingQuery);
    ok('deux réponses vides donnent un message explicite et la reprise', await page.evaluate(() => qa.requests.length === 2 && Caramelia.state.history.at(-1).text === qa.i18n.t('help_error_empty')) && await quick('Reprendre mon parcours').count() >= 1);
    await quick('Reprendre mon parcours').last().click();
    ok('l’accès au parcours fonctionne même si le chatbot ne répond pas', await page.locator('#pc-atelier').count() === 1);
    await page.click('#activites-button');
    // API réseau : l'annulation utilisateur n'est jamais retentée.
    const abortTest = await page.evaluate(async () => {
        const { fetchWithRetry } = await import('/js/caramelia/utils.js');
        const savedFetch = window.fetch;
        let n = 0;
        window.fetch = (_url, { signal }) => { n++; return new Promise((_r, reject) => signal.addEventListener('abort', () => reject(new DOMException('Annulé', 'AbortError')))); };
        const controller = new AbortController();
        const result = fetchWithRetry('/qa', { signal: controller.signal }, { retries: 2, backoffMs: 1 }).catch(e => e.name);
        controller.abort();
        try { return { n, result: await result }; } finally { window.fetch = savedFetch; }
    });
    ok('annuler le transport ne déclenche aucun retry', abortTest.n === 1 && abortTest.result === 'AbortError');
    // Locale lente : le dernier choix doit gagner, y compris un retour au français chargé.
    const localeTest = await page.evaluate(async () => {
        await qa.i18n.loadLocale('fr');
        const savedFetch = window.fetch;
        let release;
        window.fetch = async (url, opts) => {
            if (String(url).endsWith('locales/en.json')) {
                const res = await savedFetch(url, opts);
                return new Promise(resolve => { release = () => resolve(res); });
            }
            return savedFetch(url, opts);
        };
        const pending = qa.i18n.loadLocale('en');
        while (!release) await new Promise(r => setTimeout(r, 5));
        await qa.i18n.loadLocale('fr');
        release(); await pending;
        window.fetch = savedFetch;
        return qa.i18n.getLang();
    });
    ok('une locale lente ne remplace pas le dernier choix', localeTest === 'fr');
    // Récap de lancement : simuler une tuile absente, sans aucune génération IA.
    await reset();
    await page.evaluate(() => {
        qa.mode = 'answer';
        qa.response = '<DATA>{"qui":"Formatrice","quoi":"Les gestes de sécurité au laboratoire","niveau":"Adultes","moduleKeys":["Flashcards"]}</DATA>';
        qa.config.tileSelectorsOriginal = qa.config.caramelSelectors.tileSelectors;
        qa.config.tileFallbackOriginal = qa.config.caramelSelectors.tileFallback;
        qa.config.caramelSelectors.tileSelectors = () => ['.qa-tuile-absente'];
        qa.config.caramelSelectors.tileFallback = '.qa-tuile-absente';
        qa.config.timing.promptReadyMaxWait = 10;
    });
    await page.fill('.caramelia-input', 'Créer des cartes mémoire sur la sécurité pour des adultes');
    await page.press('.caramelia-input', 'Enter');
    await quick('Lancer la génération').waitFor();
    await quick('Lancer la génération').click();
    await page.waitForFunction(() => !Caramelia.state.generationRunning);
    ok('une activité non créée n’est pas annoncée comme un fichier prêt', await page.evaluate(() => Caramelia.state.history.some(m => m.text.includes('0 fichier(s) prêt(s) sur 1')) && !Caramelia.state._proactiveShown));
    await page.evaluate(() => {
        qa.config.caramelSelectors.tileSelectors = qa.config.tileSelectorsOriginal;
        qa.config.caramelSelectors.tileFallback = qa.config.tileFallbackOriginal;
    });
    // Menu multilingue et disposition mobile, y compris breton et arabe.
    await page.setViewportSize({ width: 390, height: 844 });
    for (const lang of ['fr','en','es','de','it','nl','pt','ar','zh','jp','el','br']) {
        await page.evaluate(async lang => {
            await (await import('/js/core/translation.js')).loadTranslations(lang);
        }, lang);
        await page.waitForFunction(lang => qa.i18n.getLang() === lang && Caramelia.state.elements.input.placeholder === qa.i18n.t('ui_input_placeholder'), lang);
        const result = await page.evaluate(() => {
            Caramelia.reset();
            return { label: qa.i18n.t('course_btn_resume'), raw: qa.i18n.t('course_opened') };
        });
        ok(`${lang} : bouton de reprise traduit et visible`, await quick(result.label).count() === 1 && !result.raw.includes('course_opened'));
        if (['fr','ar','br'].includes(lang)) await page.locator('#caramelia-panel').screenshot({ animations: 'disabled', path: `/tmp/caramelia-parcours-captures/menu-mobile-${lang}.png` });
    }
    ok('le menu tient dans le panneau sur téléphone', await page.evaluate(() => { const m = Caramelia.state.elements.messages; return m.scrollWidth <= m.clientWidth + 1; }));
    ok('aucune erreur JavaScript non gérée', errors.length === 0);
    console.log(`\nCaramelia et parcours : ${pass} PASS / 0 FAIL`);
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
