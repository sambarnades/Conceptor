/**
 * run_parcours_import.mjs — « Importer un modèle » et « Nouveau parcours » (D85 du
 * PRD parcours).
 *
 * En cliquant dans le vrai DOM, réseau externe bloqué :
 *  - en haut, « Nouveau parcours » et « Importer un modèle » sont là dès le cadrage,
 *    le premier grisé tant qu'il n'y a rien à effacer, avec une infobulle qui le dit ;
 *    l'import ouvre le choix d'un fichier et le scénario repris ouvre le plan ;
 *  - le pied n'a PLUS d'« Importer un modèle » à côté de « Partir du modèle » (retiré :
 *    doublon au cadrage, et deux « modèle » côte à côte qui ne désignent pas la même chose) ;
 *  - la fenêtre « Commencer un nouveau parcours ? » ne laisse plus croire que
 *    « Garder ce parcours » sauvegarde : son texte dit d'exporter, et son bouton
 *    annexe télécharge le scénario sans la refermer ;
 *  - la livraison renvoie à « Importer un modèle » pour rouvrir le parcours ;
 *  - sur téléphone, les trois outils du haut tiennent à côté du fil.
 *
 * Lancement : node tests/run_parcours_import.mjs
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(ROOT + '/tests/roundtrip/package.json')('playwright');
const PORT = 8157;
const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const pause = ms => new Promise(r => setTimeout(r, ms));
let echecs = 0, reussis = 0;
const ok = (nom, c, d = '') => { if (!c) echecs++; else reussis++; console.log(`${c ? '✓' : '✗'} ${nom}${c ? '' : ' ' + d}`); };
const fr = JSON.parse(readFileSync(`${ROOT}/js/locales/fr.json`, 'utf8'));
const ex = f => JSON.parse(readFileSync(`${ROOT}/assets/data/examples/${f}`, 'utf8'));
const scenario = {
    produit: 'caramel-parcours', format: 1, version: '0.1.0',
    cadrage: { platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: 'auto' },
    plan: {
        titre: 'La Révolution française', objectifGeneral: 'Comprendre les ruptures de 1789.', introduction: 'Bienvenue.',
        notionsPivots: [], origine: 'ia',
        etapes: [{ id: 'e1', titre: 'Découvrir', objectif: 'Situer 1789', introduction: 'Lisez puis répondez.', cartes: [
            { id: 'vf', module: 'TrueFalse', titre: 'Vrai ou faux sur 1789', objectif: 'Vérifier', consigne: 'Répondez.', duree: 5, palier: 'entrainement', contenu: ex('true_false_1.json') },
        ] }],
    },
};
const fichierScenario = { name: 'scenario.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) };
const boite = (page, s) => page.evaluate(sel => {
    const e = document.querySelector(sel);
    if (!e || !e.offsetParent) return null;
    const r = e.getBoundingClientRect();
    return { l: r.left, r: r.right, t: r.top, b: r.bottom, disabled: e.disabled, title: e.title };
}, s);

let browser;
try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`)).ok) break; } catch {} await pause(100); }
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
    const page = await context.newPage();
    const erreurs = [], natifs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('dialog', d => { natifs.push(d.message()); d.dismiss(); });
    await page.route(/https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    await page.goto(`http://127.0.0.1:${PORT}/index.html`); await page.waitForSelector('#parcours-button');
    await page.fill('#quoi', 'La Révolution française');
    await page.click('#parcours-button'); await page.waitForSelector('#pc-scenario-importer');

    // --- Le pied du cadrage : « Partir du modèle » seul, sans son ancien voisin.
    ok('cadrage : le pied n’a plus d’« Importer un modèle » à côté de « Partir du modèle »',
        await page.locator('.pc-actionbar #pc-importer-modele').count() === 0
        && !(await page.locator('.pc-actionbar').innerText()).includes(fr.parcours_importer_modele)
        && await page.locator('#pc-modele').isVisible());

    // --- Le haut du cadrage.
    const nouveauVide = await boite(page, '#pc-nouveau-parcours'), importerHaut = await boite(page, '#pc-scenario-importer');
    ok('cadrage : « Nouveau parcours » est déjà là, grisé, et son infobulle dit pourquoi',
        nouveauVide && nouveauVide.disabled && nouveauVide.title === fr.parcours_nouveau_vide, JSON.stringify(nouveauVide));
    ok('cadrage : « Importer un modèle » est en haut, à côté de « Nouveau parcours », actif, et son infobulle dit ce qu’il ouvre',
        importerHaut && nouveauVide && !importerHaut.disabled && Math.abs(importerHaut.t - nouveauVide.t) < 2 && importerHaut.l >= nouveauVide.r
        && importerHaut.title === fr.parcours_importer_modele_hint,
        JSON.stringify({ nouveauVide, importerHaut }));

    // --- Il ouvre le choix du fichier, et le scénario repris ouvre le plan.
    const [choix] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), page.click('#pc-scenario-importer')]);
    ok('« Importer un modèle » ouvre le choix d’un fichier .json', !!choix && !choix.isMultiple());
    if (choix) await choix.setFiles(fichierScenario);
    await page.waitForSelector('.pc-title-input', { timeout: 5000 }).catch(() => {});
    const apres = await page.evaluate(() => ({
        titre: document.querySelector('.pc-title-input')?.value,
        ecran: document.querySelector('.pc-steps__item--current')?.textContent,
    }));
    ok('le scénario importé ouvre son plan', apres.titre === scenario.plan.titre && /Plan/.test(apres.ecran || ''), JSON.stringify(apres));
    const nouveauPlan = await boite(page, '#pc-nouveau-parcours');
    ok('avec un plan, « Nouveau parcours » est actif', nouveauPlan && !nouveauPlan.disabled && nouveauPlan.title === fr.parcours_nouveau, JSON.stringify(nouveauPlan));
    const [choixHaut] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), page.click('#pc-scenario-importer')]);
    ok('sur le plan, « Importer un modèle » reste en haut et ouvre le même choix', !!choixHaut);

    // --- « Commencer un nouveau parcours ? » : exporter sans fermer, garder sans rien perdre.
    await page.click('#pc-nouveau-parcours');
    await page.waitForSelector('.pc-confirmation[role="alertdialog"]');
    const question = await page.evaluate(() => ({
        texte: document.querySelector('#pc-confirmation-texte')?.textContent,
        boutons: [...document.querySelectorAll('.pc-confirmation button')].map(b => b.textContent.trim()),
        focus: document.activeElement?.textContent.trim(),
    }));
    ok('la question dit d’exporter le scénario, plus de le « garder »',
        // La modale rend insécable l'espace d'avant « : » (le signe ne part pas seul à la ligne).
        question.texte.replace(/\u202f/g, ' ') === fr.parcours_nouveau_texte && /export/i.test(question.texte) && !/gardez/i.test(question.texte), JSON.stringify(question));
    ok('la question offre « Exporter le scénario (.json) », « Garder ce parcours » et « Nouveau parcours », le focus sur Garder',
        question.boutons.length === 3 && question.boutons.includes(fr.parcours_liv_scenario_exporter)
        && question.boutons.includes(fr.parcours_nouveau_garder) && question.focus === fr.parcours_nouveau_garder, JSON.stringify(question));
    const [telechargement] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('.pc-confirmation__annexe')]);
    const exporte = telechargement ? JSON.parse(readFileSync(await telechargement.path(), 'utf8')) : null;
    ok('« Exporter le scénario (.json) » télécharge le scénario du parcours en cours',
        !!exporte && /\.json$/.test(telechargement.suggestedFilename()) && exporte.plan?.titre === scenario.plan.titre,
        telechargement ? telechargement.suggestedFilename() : 'aucun téléchargement');
    ok('…sans refermer la question', await page.locator('.pc-confirmation__boite').count() === 1);
    await page.getByRole('button', { name: fr.parcours_nouveau_garder }).click(); await pause(150);
    ok('« Garder ce parcours » ferme la question et laisse le plan en place',
        await page.locator('.pc-confirmation__boite').count() === 0
        && await page.locator('.pc-title-input').inputValue() === scenario.plan.titre);

    // --- La livraison renvoie au nouveau bouton pour rouvrir le parcours.
    await page.evaluate(async () => (await import('/js/parcours/index.js')).__testHooks.allerA(3));
    await page.waitForSelector('[data-liv="mbz"]');
    const reprise = await page.evaluate(() => [...document.querySelectorAll('.pc-block__hint')].map(p => p.textContent).join(' '));
    ok('livraison : la note de reprise nomme « Importer un modèle »',
        reprise.includes(fr.parcours_liv_reprise_note.replace('@b', fr.parcours_importer_modele)), reprise.slice(0, 300));
    ok('livraison : « Importer un modèle » est en haut, à portée', !!(await boite(page, '#pc-scenario-importer')));

    // --- Nouveau parcours confirmé : retour au cadrage, rien à effacer de nouveau.
    await page.click('#pc-nouveau-parcours');
    await page.click('.pc-confirmation .pc-confirmation__abandon'); await pause(200);
    const vide = await page.evaluate(() => ({
        plan: !!document.querySelector('.pc-title-input'),
        nouveau: document.querySelector('#pc-nouveau-parcours')?.disabled,
        modele: !!document.querySelector('#pc-modele')?.offsetParent,
    }));
    ok('« Nouveau parcours » confirmé ramène au cadrage, bouton regrisé, « Partir du modèle » revenu',
        !vide.plan && vide.nouveau === true && vide.modele, JSON.stringify(vide));

    // --- Téléphone : les trois outils du haut (Nouveau, Importer, Tutoriel) à côté du fil.
    await page.setViewportSize({ width: 390, height: 844 }); await pause(200);
    const [fil, nv, imp, aide] = await Promise.all(['.pc-navigation .pc-steps', '#pc-nouveau-parcours', '#pc-scenario-importer', '.pc-scenario__aide'].map(s => boite(page, s)));
    ok('téléphone : « Nouveau parcours », « Importer un modèle » et le tutoriel tiennent sur la ligne du fil',
        fil && nv && imp && aide && [nv, imp, aide].every(b => b.t < fil.b && Math.abs(b.t - nv.t) < 2), JSON.stringify({ fil, nv, imp, aide }));
    ok('téléphone : la page ne défile pas en largeur', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    ok('aucune boîte native du navigateur', natifs.length === 0, natifs.join(' | '));
    ok('aucune erreur JS de page', erreurs.length === 0, erreurs.join(' | '));
} catch (e) {
    echecs++;
    console.error('✗ exception :', e);
} finally {
    await browser?.close();
    server.kill();
}
console.log(`\nImporter un modèle : ${reussis} PASS / ${echecs} FAIL`);
process.exit(echecs ? 1 : 0);
