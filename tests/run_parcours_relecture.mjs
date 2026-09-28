/**
 * Relecture réelle : importer → éditer → aperçu → sauvegarder → rouvrir.
 * Le modèle est doublé seulement dans les épreuves de file. Les lecteurs,
 * l’éditeur, les fichiers JSON et les archives sont ceux du produit.
 * Usage : node tests/run_parcours_relecture.mjs
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8121;
const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
let browser;
let pass = 0;
const captures = process.env.QA_CAPTURES || '/tmp/caramel-parcours-captures';
const ok = (nom, condition) => { assert.ok(condition, nom); console.log(`  ✓ ${nom}`); pass++; };
const modelePage = JSON.parse(await readFile(join(ROOT, 'assets/data/examples/page_1.json'), 'utf8'));
const modeleFlash = JSON.parse(await readFile(join(ROOT, 'assets/data/examples/flashcards_1.json'), 'utf8'));
const carte = (id, module, contenu) => ({ id, module, titre: contenu?.title || '', objectif: 'Comprendre et réinvestir les notions', consigne: 'Prenez le temps de lire.', duree: 10, palier: 'decouverte', contenu, verrouillee: false });
const scenario = {
    produit: 'caramel-parcours', format: 1, version: '0.1.0',
    cadrage: { platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'revision' },
    plan: { titre: 'La Révolution française', objectifGeneral: 'Comprendre les ruptures de 1789', notionsPivots: ['la citoyenneté'], origine: 'ia',
        etapes: [
            { id: 'e1', titre: 'Découvrir', objectif: 'Repérer les ruptures', cartes: [
                carte('forum', 'parcours_forum', { title: 'Échanger sur 1789', intro: 'Quelle rupture vous semble décisive ?' }),
                carte('page', 'Page', modelePage),
            ] },
            { id: 'e2', titre: 'Mémoriser', objectif: 'Réutiliser le vocabulaire', cartes: [
                carte('flash', 'Flashcards', modeleFlash),
                carte('sondage', 'parcours_sondage', { title: 'Votre avis', intro: 'Quelle notion approfondir ?', options: ['Citoyenneté', 'Souveraineté'] }),
            ] },
        ] },
};
try {
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`)).ok) break; } catch {}
        await new Promise(r => setTimeout(r, 100));
    }
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => { errors.push(e.message); console.log('JS', e.message); });
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
    await page.goto(`http://127.0.0.1:${PORT}/index.html`);
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0);
    await page.click('#parcours-button');
    // D64 : reprendre un scénario .json est rangé dans « Personnaliser les instructions ».
    ok('le cadrage n’affiche pas d’outil de scénario', await page.locator('#pc-scenario-importer').count() === 0 && !(await page.locator('#pc-scenario-exporter').isVisible()));
    await page.locator('#pc-guide-open').click();
    await page.locator('#pc-guide-importer').waitFor({ state: 'visible' });
    ok('« Reprendre un scénario » est dans la fenêtre de personnalisation', await page.locator('#pc-guide-importer').isVisible());
    await page.keyboard.press('Escape');
    await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
    await page.waitForSelector('[data-carte="forum"]');
    ok('import sans génération ni ressaisie du sujet', await page.locator('.pc-title-input').inputValue() === scenario.plan.titre);
    await page.fill('.pc-plan-objectif', 'Expliquer la naissance de la citoyenneté');
    await page.locator('.pc-plan-notions summary').click();
    await page.fill('.pc-plan-notions .pc-notion__champ--ajout', 'la souveraineté nationale');
    await page.keyboard.press('Enter');
    ok('une notion ajoutée devient une pastille à majuscule, l’original gardé pour le modèle', await page.evaluate(() =>
        [...document.querySelectorAll('.pc-notion__texte')].map(n => n.textContent).join('|') === 'La citoyenneté|La souveraineté nationale'
        && JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).plan.notionsPivots[1] === 'la souveraineté nationale'));
    await page.locator('.pc-plan-notions summary').click();
    await page.locator('[data-carte="forum"] [data-action="editer"]').click();
    await page.waitForSelector('.pc-form input');
    await page.fill('.pc-form input', 'Notre discussion');
    await page.locator('.pc-form [contenteditable="true"]').fill('Justifiez votre choix avec un exemple précis.');
    await page.locator('.pc-form .pc-cta').click();
    await page.waitForSelector('.pc-lecture__texte');
    ok('enregistrer ouvre l’aperçu de la retouche et y garde le focus',
        (await page.locator('.pc-lecture__texte').textContent()).includes('exemple précis')
        && await page.evaluate(() => !!document.activeElement.closest('.pc-editeur')));
    const sauvegarde = await page.evaluate(() => JSON.parse(sessionStorage.getItem('caramel_parcours_draft')));
    ok('titre, contenu, objectif et notions sont persistés immédiatement',
        sauvegarde.plan.etapes[0].cartes[0].titre === 'Notre discussion' &&
        sauvegarde.plan.etapes[0].cartes[0].contenu.intro.includes('exemple précis') &&
        sauvegarde.plan.objectifGeneral.includes('citoyenneté') && sauvegarde.plan.notionsPivots.length === 2);
    await page.locator('.pc-lecture__navigation button').last().click();
    await page.waitForSelector('.elea-page-fidelity-wrapper');
    ok('la suivante s’ouvre avec le vrai simulateur Page', (await page.locator('.elea-page-fidelity-wrapper').textContent()).includes('1789'));
    await page.locator('.pc-lecture__modes button').last().click();
    await page.waitForSelector('.json-editor');
    const titrePage = page.locator('.json-editor input[data-path="title"]');
    await titrePage.fill('Les ruptures révolutionnaires');
    // La fermeture doit préserver une saisie non enregistrée si on refuse.
    await page.locator('.pc-editeur__fermer').click();
    await page.locator('.pc-confirmation button').first().click();
    ok('refuser l’abandon garde les retouches ouvertes', await titrePage.inputValue() === 'Les ruptures révolutionnaires');
    const boutonSave = page.locator('.json-editor button').filter({ hasText: /Enregistrer/ }).first();
    await boutonSave.click();
    await page.waitForSelector('.elea-page-fidelity-wrapper');
    ok('l’éditeur commun enregistre dans la bonne carte', await page.evaluate(() => JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).plan.etapes[0].cartes[1].titre === 'Les ruptures révolutionnaires'));
    await page.locator('.pc-lecture__navigation button').last().click();
    await page.waitForSelector('#pc-lecture-contenu iframe', { timeout: 30000 });
    await page.waitForFunction(() => {
        const frame = document.querySelector('#pc-lecture-contenu iframe');
        return !!frame?.contentDocument?.querySelector('.h5p-flashcards');
    }, null, { timeout: 30000 });
    ok('la relecture H5P utilise le lecteur interactif', true);
    await mkdir(captures, { recursive: true });
    await page.screenshot({ path: join(captures, 'apercu-h5p-desktop.png'), animations: 'disabled' });
    await page.locator('#pc-lecture-contenu iframe').evaluate(frame => {
        const cible = [...frame.contentDocument.querySelectorAll('button,input,a[href],[tabindex="0"]')].find(n => n.getClientRects().length);
        if (!cible) throw Error('Lecteur sans commande focalisable');
        cible.focus();
    });
    await page.keyboard.press('Escape');
    await page.waitForSelector('.pc-editeur', { state: 'detached' });
    ok('Échap ferme, libère le défilement et restitue le focus', await page.evaluate(() => !document.body.classList.contains('pc-locked') && document.activeElement.matches('[data-action="editer"]')));
    await page.locator('[data-carte="sondage"] [data-action="editer"]').click();
    await page.waitForSelector('.pc-form');
    await page.locator('.pc-form textarea.pc-form__saisie').fill('Les droits\nLes devoirs\nLa souveraineté');
    await page.locator('.pc-form .pc-cta').click();
    await page.waitForSelector('.pc-lecture__texte li');
    ok('les réponses du sondage restent une liste éditable et prévisualisée', await page.locator('.pc-lecture__texte li').count() === 3);
    await page.locator('.pc-editeur__fermer').focus();
    await page.keyboard.press('Shift+Tab');
    ok('le clavier reste dans le panneau', await page.evaluate(() => !!document.activeElement.closest('.pc-editeur') && !document.activeElement.classList.contains('pc-editeur__fermer')));
    await page.keyboard.press('Tab');
    ok('Tab revient à la fermeture depuis le dernier contrôle', await page.evaluate(() => document.activeElement.matches('.pc-editeur__fermer')));
    await page.keyboard.press('Escape');
    // Type incompatible : l’ancien JSON doit quitter la carte, et pouvoir revenir.
    // Le type se choisit dans la mosaïque (bouton de la carte → tuile).
    await page.locator('[data-carte="page"] .pc-carte__reglages .pc-choix').click();
    ok('la mosaïque des types s’ouvre, le type actuel marqué',
        await page.locator('dialog.pc-mosaique[open] .pc-tuile[aria-pressed="true"][data-module-choix="Page"]').count() === 1);
    await page.locator('dialog.pc-mosaique[open] .pc-mosaique__filtre').fill('cartes mem');
    ok('le filtre ne garde que ce qui correspond, accents ignorés',
        await page.evaluate(() => [...document.querySelectorAll('dialog.pc-mosaique .pc-tuile:not([hidden])')].map(x => x.dataset.moduleChoix).join()) === 'Flashcards');
    await page.locator('dialog.pc-mosaique[open] .pc-tuile[data-module-choix="Flashcards"]').click();
    // La fermeture d'un <dialog> se notifie de façon asynchrone : on l'attend.
    const fermee = await page.waitForFunction(() => !document.querySelector('dialog.pc-mosaique'), null, { timeout: 3000 }).then(() => true, () => false);
    const focus = await page.evaluate(() => `${document.activeElement?.className} ${document.activeElement?.closest('[data-carte]')?.dataset.carte}`);
    ok('choisir ferme la mosaïque et rend le focus au bouton du type de la même carte',
        fermee && /pc-choix/.test(focus) && focus.endsWith(' page'), focus);
    ok('changer de type retire le contenu incompatible', await page.evaluate(() => !JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).plan.etapes[0].cartes[1].contenu));
    await page.locator('.pc-annulation button').click();
    ok('annuler retrouve le type ET le contenu édité', await page.evaluate(() => {
        const c = JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).plan.etapes[0].cartes[1];
        return c.module === 'Page' && c.contenu.title === 'Les ruptures révolutionnaires';
    }));
    await page.locator('[data-carte="flash"] .pc-icon-btn--danger').click();
    await page.locator('.pc-annulation button').click();
    ok('une suppression se récupère sans régénérer', await page.locator('[data-carte="flash"]').count() === 1);
    await page.click('#pc-cta');
    await page.waitForSelector('.pc-liv__etat', { state: 'attached' });
    ok('un parcours déjà prêt rejoint la livraison en un clic depuis le plan', await page.locator('.pc-body [data-liv="mbz"]').isVisible());
    // D64 : le scénario .json se télécharge à la livraison, à côté du MBZ.
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-liv="json"]');
    const download = await downloadPromise;
    const exporte = JSON.parse(await readFile(await download.path(), 'utf8'));
    ok('le scénario téléchargé contient les retouches, sans corpus', exporte.plan.etapes[0].cartes[1].contenu.title === 'Les ruptures révolutionnaires' && !exporte.contexte);
    const mbzPromise = page.waitForEvent('download');
    await page.locator('.pc-body [data-liv="mbz"]').click();
    const mbz = await mbzPromise;
    await copyFile(await mbz.path(), join(captures, 'parcours-relu.mbz'));
    const tar = gunzipSync(await readFile(await mbz.path()));
    const xml = {};
    for (let o = 0; o + 512 <= tar.length;) {
        const nom = tar.subarray(o, o + 100).toString().replace(/\0.*$/, '');
        if (!nom) break;
        const taille = parseInt(tar.subarray(o + 124, o + 136).toString().replace(/[^0-7]/g, ''), 8) || 0;
        if (nom.endsWith('.xml')) xml[nom] = tar.subarray(o + 512, o + 512 + taille).toString();
        o += 512 + Math.ceil(taille / 512) * 512;
    }
    const contenusXml = await page.evaluate(xml => Object.fromEntries(Object.entries(xml)
        .filter(([nom]) => /\/(forum|page|choice)\.xml$/.test(nom))
        .map(([nom, texte]) => {
            const doc = new DOMParser().parseFromString(texte, 'application/xml');
            if (doc.querySelector('parsererror')) throw Error(`XML invalide : ${nom}`);
            return [nom, doc.documentElement.textContent];
        })), xml);
    const activiteXml = type => Object.entries(contenusXml).find(([nom]) => new RegExp(`activities/${type}_\\d+/${type}\\.xml$`).test(nom))?.[1] || '';
    ok('le MBZ téléchargé contient le forum, la Page et les réponses réellement retouchés',
        activiteXml('forum').includes('exemple précis') && activiteXml('page').includes('Les ruptures révolutionnaires')
        && activiteXml('choice').includes('Les devoirs') && activiteXml('choice').includes('La souveraineté'));
    await page.reload();
    await page.click('#parcours-button');
    await page.waitForSelector('[data-carte="page"]');
    ok('recharger retrouve le titre édité dans le plan', await page.locator('[data-carte="page"] .pc-carte__titre').inputValue() === 'Les ruptures révolutionnaires');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(captures, 'plan-desktop.png'), fullPage: true, animations: 'disabled' });
    for (const largeur of [1024, 768, 390, 360]) {
        await page.setViewportSize({ width: largeur, height: 844 });
        ok(`le plan tient dans ${largeur} px`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(captures, 'plan-mobile.png'), fullPage: true, animations: 'disabled' });
    await page.locator('[data-carte="forum"] [data-action="editer"]').click();
    await page.waitForSelector('.pc-form');
    ok('le panneau tient sur téléphone', await page.evaluate(() => document.querySelector('.pc-editeur').scrollWidth <= innerWidth));
    await page.screenshot({ path: join(captures, 'editeur-mobile.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.locator('.pc-scenario__aide').focus();
    await page.evaluate(async () => (await import('/js/core/translation.js')).loadTranslations('en'));
    ok('changer de langue traduit aussi les outils persistants et conserve les retouches',
        await page.locator('.pc-scenario__aide').getAttribute('aria-label') === await page.evaluate(async () => (await import('/js/core/translation.js')).t('tutorial'))
        && await page.locator('[data-carte="page"] .pc-carte__titre').inputValue() === 'Les ruptures révolutionnaires'
        && await page.evaluate(() => document.activeElement.classList.contains('pc-scenario__aide')));
    await page.evaluate(async () => (await import('/js/core/translation.js')).loadTranslations('fr'));
    // Les imports dégradés ne doivent pas remplacer le travail existant.
    const importInvalide = { ...scenario, format: 99 };
    await page.locator('#pc-scenario-fichier').setInputFiles({ name: 'futur.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(importInvalide)) });
    await page.waitForFunction(() => document.querySelector('.pc-scenario__etat').textContent.includes('version'));
    ok('un scénario refusé laisse le brouillon intact', await page.locator('[data-carte="page"] .pc-carte__titre').inputValue() === 'Les ruptures révolutionnaires');
    // Normalisation des fichiers importés (ids et durées) et limite du produit.
    const casImport = await page.evaluate(async scenario => {
        const { depuisScenario } = await import('/js/parcours/scenario-io.js');
        const s = structuredClone(scenario);
        s.plan.etapes[1].cartes[0].id = s.plan.etapes[0].cartes[0].id;
        s.plan.etapes[0].cartes[0].duree = -5;
        const relu = depuisScenario(JSON.stringify(s));
        const cartes = relu.plan.etapes.flatMap(e => e.cartes);
        let nullRefuse = false, incompatible = false, longRefuse = false;
        s.plan.etapes[0].cartes.push(null);
        try { depuisScenario(JSON.stringify(s)); } catch { nullRefuse = true; }
        s.plan.etapes[0].cartes.pop();
        s.plan.etapes[0].cartes[0].module = 'inconnu';
        try { depuisScenario(JSON.stringify(s)); } catch { incompatible = true; }
        s.plan.etapes[0].cartes = Array.from({ length: 13 }, () => scenario.plan.etapes[0].cartes[0]);
        try { depuisScenario(JSON.stringify(s)); } catch { longRefuse = true; }
        const avecGlossaire = structuredClone(scenario);
        const glossaire = avecGlossaire.plan.etapes[0].cartes[0];
        glossaire.module = 'Glossary';
        glossaire.contenu = [
            { title: 'Citoyenneté', text: 'Appartenance à la communauté politique.' },
            { title: 'Souveraineté', text: 'Exercice du pouvoir suprême.' },
        ];
        const attendu = JSON.stringify(glossaire.contenu);
        const listeRelue = depuisScenario(JSON.stringify(avecGlossaire)).plan.etapes[0].cartes[0].contenu;
        glossaire.module = 'Page';
        let listeIncompatible = false;
        try { depuisScenario(JSON.stringify(avecGlossaire)); } catch { listeIncompatible = true; }
        return { uniques: new Set(cartes.map(c => c.id)).size === cartes.length, duree: cartes[0].duree, nullRefuse, incompatible, longRefuse,
            glossaireIntact: JSON.stringify(listeRelue) === attendu, listeIncompatible };
    }, scenario);
    ok('l’import répare les IDs doublons et durées négatives', casImport.uniques && casImport.duree === 10);
    ok('l’import refuse les cartes nulles, contenus incompatibles et plus de 12 activités', casImport.nullRefuse && casImport.incompatible && casImport.longRefuse);
    ok('un Glossaire généré comme liste se reprend sans perdre ses entrées', casImport.glossaireIntact);
    ok('une liste reste refusée pour un module qui attend un objet', casImport.listeIncompatible);
    await page.evaluate(async () => {
        const { brouillon, majBrouillon } = await import('/js/parcours/state.js');
        const { __testHooks } = await import('/js/parcours/index.js');
        const plan = brouillon().plan;
        plan.etapes.at(-1).cartes.push({ id: 'manquante', titre: 'À préparer plus tard', module: 'Page', palier: 'transfert', duree: 10 });
        majBrouillon({ plan });
        __testHooks.allerA(2);
    });
    await page.locator('.pc-fab-livrer').click();
    ok('livrer un parcours partiel reste possible sans relancer les activités manquantes',
        (await page.locator('.pc-manques').textContent()).includes('À préparer plus tard'));
    const file = await page.evaluate(async () => {
        const { creerFile } = await import('/js/parcours/parcours-runner.js');
        const { ouvrirBrouillon, majBrouillon } = await import('/js/parcours/state.js');
        const d = ouvrirBrouillon();
        const card = (id, extra = {}) => ({ id, titre: id, module: 'parcours_forum', duree: 10, palier: 'decouverte', ...extra });
        d.plan = { titre: 'Épreuve', notionsPivots: [], etapes: [{ id: 'e', cartes: [card('reserve', { verrouillee: true }), card('normal')] }] };
        majBrouillon({ plan: d.plan });
        let appels = 0;
        const f = creerFile(d, { appelModele: async () => { appels++; return '{"title":"fait","intro":"contenu"}'; } });
        const fait = await f.demarrer();
        await f.refaire('reserve');
        const reserve = appels === 1 && fait.reservees === 1 && !d.plan.etapes[0].cartes[0].contenu;
        d.plan.etapes[0].cartes = [card('annule')];
        let liberer;
        const g = creerFile(d, { appelModele: () => new Promise(r => { liberer = r; }) });
        const encours = g.demarrer();
        while (!liberer) await new Promise(r => setTimeout(r, 5));
        g.arreter(); liberer('{"title":"tardif","intro":"Ne doit pas arriver"}');
        await encours;
        const annule = g.etat().restantes === 1 && !d.plan.etapes[0].cartes[0].contenu;
        d.plan.etapes[0].cartes = [card('conserve', { contenu: { title: 'Relu', intro: 'Validé à la main' } })];
        const h = creerFile(d, { appelModele: async () => { throw Error('Panne simulée'); } });
        await h.refaire('conserve');
        const conserve = h.etat().faites === 1 && d.plan.etapes[0].cartes[0].contenu.intro === 'Validé à la main';
        let terminerAncienne, nouvellePartie = false;
        const ancienPlan = { titre: 'Ancien', etapes: [{ id: 'a', cartes: [card('ancien')] }] };
        const nouveauPlan = { titre: 'Nouveau', etapes: [{ id: 'b', cartes: [card('nouveau')] }] };
        const ancienne = creerFile({ ...d, plan: ancienPlan }, { appelModele: () => new Promise(r => { terminerAncienne = r; }) });
        const nouveau = creerFile({ ...d, plan: nouveauPlan }, { appelModele: async () => { nouvellePartie = true; return '{"title":"Nouveau","intro":"Intact"}'; } });
        const p1 = ancienne.demarrer();
        while (!terminerAncienne) await new Promise(r => setTimeout(r, 5));
        ancienne.arreter();
        const p2 = nouveau.demarrer();
        await new Promise(r => setTimeout(r, 50));
        const attend = !nouvellePartie;
        terminerAncienne('{"title":"Ancien","intro":"Tardif"}');
        await Promise.all([p1, p2]);
        const serie = attend && nouvellePartie && !ancienPlan.etapes[0].cartes[0].contenu && nouveauPlan.etapes[0].cartes[0].contenu.intro === 'Intact';
        return { reserve, annule, conserve, serie };
    });
    ok('le cadenas exclut les cartes vides de tous les appels IA', file.reserve);
    ok('une réponse tardive annulée ne remplace rien et reste à reprendre', file.annule);
    ok('une régénération ratée conserve le contenu relu et éditable', file.conserve);
    ok('une nouvelle file attend la fin de l’ancienne requête annulée', file.serie);
    const quota = await page.evaluate(async () => {
        const { majBrouillon, etatSauvegarde } = await import('/js/parcours/state.js');
        const original = Storage.prototype.setItem;
        try {
            Storage.prototype.setItem = function(cle, valeur) {
                if (cle === 'caramel_parcours_draft' && !JSON.parse(valeur).contenusNonPersistes) throw new DOMException('Quota', 'QuotaExceededError');
                return original.call(this, cle, valeur);
            };
            majBrouillon({});
            const plan = etatSauvegarde() === 'plan' && JSON.parse(sessionStorage.getItem('caramel_parcours_draft')).contenusNonPersistes;
            Storage.prototype.setItem = () => { throw new DOMException('Refus', 'SecurityError'); };
            majBrouillon({});
            return plan && etatSauvegarde() === 'aucune';
        } finally { Storage.prototype.setItem = original; majBrouillon({}); }
    });
    ok('un quota ou un stockage bloqué dégrade explicitement la sauvegarde', quota);
    ok('aucune erreur JavaScript non gérée', errors.length === 0);
    console.log(`\nRelecture : ${pass} PASS / 0 FAIL\nCaptures : ${captures}`);
} catch (e) {
    console.error(e);
    console.error(`\nRelecture : ${pass} PASS / 1 FAIL`);
    process.exitCode = 1;
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
