/**
 * run_parcours_vue.mjs — La vue du parcours et le parcours dans la zone de
 * notifications (D65 du PRD parcours).
 *
 * En cliquant dans le vrai DOM, réseau externe bloqué :
 *  - « Relire le parcours » s'ouvre sur la vue : accueil, introduction de
 *    chaque étape, type de chaque activité (forum, texte de liaison compris),
 *    activité non générée signalée ;
 *  - télécharger le MBZ pose UNE notification de parcours (toast, liste) ;
 *  - l'aperçu de la notification montre la vue, ouvre le vrai lecteur H5P,
 *    avec la même attente, la même édition (éditeur pleine zone, Annuler et
 *    Enregistrer dans le pied) qu'une activité seule, une seule rangée de
 *    flèches en haut et les activités voisines nommées en bas ; édite un H5P
 *    et un forum, régénère le fichier, et protège une retouche non enregistrée ;
 *  - MBZ et JSON téléchargés depuis la notification portent la retouche.
 *
 * Lancement : node tests/run_parcours_vue.mjs
 * Captures : $QA_CAPTURES (défaut /tmp/caramel-parcours-vue)
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.QA_CAPTURES || '/tmp/caramel-parcours-vue';
mkdirSync(OUT, { recursive: true });
const { chromium } = createRequire(ROOT + '/tests/roundtrip/package.json')('playwright');
const server = spawn('python3', ['tests/serveur-statique.py', '8132', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
const pause = ms => new Promise(r => setTimeout(r, ms));
let echecs = 0, reussis = 0;
const ok = (nom, c, d = '') => { if (!c) echecs++; else reussis++; console.log(`${c ? '✓' : '✗'} ${nom}${c ? '' : ' ' + d}`); };
const ex = f => JSON.parse(readFileSync(`${ROOT}/assets/data/examples/${f}`, 'utf8'));
const lireTar = buf => { const tar = gunzipSync(buf); const f = {}; for (let o = 0; o + 512 <= tar.length;) { const nom = tar.subarray(o, o + 100).toString().replace(/\0.*$/, ''); if (!nom) break; const taille = parseInt(tar.subarray(o + 124, o + 136).toString().replace(/[^0-7]/g, ''), 8) || 0; f[nom] = tar.subarray(o + 512, o + 512 + taille).toString(); o += 512 + Math.ceil(taille / 512) * 512; } return f; };
const scenario = {
  produit: 'caramel-parcours', format: 1, version: '0.1.0',
  cadrage: { platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: 'auto' },
  plan: { titre: 'La Révolution française', objectifGeneral: 'Comprendre les ruptures de 1789.', introduction: 'Bienvenue ! Vous allez découvrir, échanger puis vérifier vos acquis.',
    notionsPivots: ['la souveraineté nationale'], origine: 'ia',
    etapes: [
      { id: 'e1', titre: 'Découvrir', objectif: 'Situer 1789', introduction: 'Lisez la page, puis dites si les affirmations sont vraies.', cartes: [
        { id: 'page', module: 'Page', titre: 'Les grandes dates', objectif: 'Situer', consigne: 'Lisez.', duree: 10, palier: 'decouverte', contenu: ex('page_1.json') },
        { id: 'liaison', module: 'parcours_etiquette', titre: 'Avant l’exercice', objectif: 'Faire le lien', consigne: '', duree: 2, palier: 'decouverte', contenu: { title: 'Avant l’exercice', intro: 'Reprenez les trois dates de la page avant de répondre.' } },
        { id: 'vf', module: 'TrueFalse', titre: 'Vrai ou faux sur 1789', objectif: 'Vérifier', consigne: 'Répondez.', duree: 5, palier: 'entrainement', contenu: ex('true_false_1.json') },
      ] },
      { id: 'e2', titre: 'Échanger', objectif: 'Argumenter', introduction: 'Donnez votre avis sur le forum, en vous appuyant sur un exemple.', cartes: [
        { id: 'forum', module: 'parcours_forum', titre: 'Quelle rupture ?', objectif: 'Argumenter', consigne: 'Justifiez.', duree: 15, palier: 'transfert', contenu: { title: 'Quelle rupture ?', intro: 'Quelle rupture vous semble la plus importante ?' } },
        { id: 'manque', module: 'FillInTheBlanks', titre: 'Texte à trous', objectif: 'Réemployer', consigne: 'Complétez.', duree: 8, palier: 'entrainement', contenu: null },
      ] },
    ] },
};
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch('http://127.0.0.1:8132/index.html')).ok) break; } catch {} await pause(100); }
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  const page = await context.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('dialog', d => d.accept());
  await page.route(/https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto('http://127.0.0.1:8132/index.html'); await page.waitForSelector('#parcours-button');
  await page.fill('#quoi', 'La Révolution française');
  await page.click('#parcours-button'); await pause(300);
  await page.locator('#pc-scenario-fichier').setInputFiles({ name: 's.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(scenario)) });
  await page.waitForSelector('.pc-title-input');
  await page.evaluate(async () => (await import('/js/parcours/index.js')).__testHooks.allerA(3));
  await page.waitForSelector('[data-liv="mbz"]');
  // Partage vers la Sucrerie coupé (D67) : construit, jamais visible.
  ok('livraison : bouton Sucrerie présent mais masqué (D67)',
    await page.locator('[data-liv="sucrerie"]').count() === 1 && !(await page.locator('[data-liv="sucrerie"]').isVisible()));

  // --- 1. Relire le parcours : la vue d’abord
  await page.locator('.pc-livrer__relire').click();
  await page.waitForSelector('.pc-editeur .pc-vue');
  const vue = await page.evaluate(() => {
    const v = document.querySelector('.pc-editeur .pc-vue');
    return {
      accueil: v.querySelector('.pc-vue__section--accueil')?.textContent || '',
      intros: [...v.querySelectorAll('.pc-vue__section:not(.pc-vue__section--accueil) > .pc-vue__prose')].map(n => n.textContent.trim()),
      types: [...v.querySelectorAll('.pc-vue__type')].map(n => n.textContent),
      liaison: v.querySelector('.pc-vue__prose--liaison')?.textContent || '',
      nonGeneree: v.querySelectorAll('.pc-vue__statut').length,
      modesCaches: document.querySelector('.pc-lecture__modes').hidden,
    };
  });
  ok('relecture : s’ouvre sur la vue du parcours, texte d’accueil compris', vue.accueil.includes('Bienvenue'), vue.accueil);
  ok('relecture : les introductions des deux étapes sont lisibles', vue.intros.length === 2 && vue.intros[1].includes('forum'), JSON.stringify(vue.intros));
  ok('relecture : chaque activité dit son type, le forum compris', vue.types.includes('Forum') && vue.types.includes('Texte de liaison') && vue.types.includes('Vrai/Faux'), vue.types.join(', '));
  ok('relecture : le texte de liaison se lit en place', vue.liaison.includes('trois dates'));
  ok('relecture : l’activité non générée est signalée, Aperçu/Modifier masqués sur la vue', vue.nonGeneree === 1 && vue.modesCaches);
  await page.screenshot({ path: `${OUT}/1-relecture-vue.png` });
  await page.locator('.pc-editeur .pc-vue__activite[data-carte="forum"]').click();
  await page.waitForSelector('.pc-editeur .pc-lecture__texte');
  ok('relecture : un clic ouvre le forum, « Vue du parcours » y ramène', (await page.locator('.pc-lecture__type').textContent()) === 'Forum' && await page.locator('.pc-lecture__sommaire').isVisible());
  await page.locator('.pc-lecture__sommaire').click();
  await page.waitForSelector('.pc-editeur .pc-vue');
  await page.locator('.pc-lecture__navigation button').last().click();
  await page.waitForFunction(() => document.querySelector('.pc-lecture__position')?.textContent.startsWith('1 /'));
  // Depuis 8f5ffe71, « Précédente » s'arrête à la première activité : c'est
  // « Vue du parcours » qui ramène à la vue.
  const precedenteArretee = await page.locator('.pc-lecture__navigation button', { hasText: 'Précédente' }).isDisabled();
  await page.locator('.pc-lecture__sommaire').click();
  await page.waitForSelector('.pc-editeur .pc-vue');
  ok('relecture : Suivante depuis la vue ouvre la première activité, « Vue du parcours » y ramène', precedenteArretee);
  await page.locator('.pc-editeur__fermer').click();
  await page.waitForSelector('.pc-editeur', { state: 'detached' });

  // --- 2. Télécharger : la notification
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('[data-liv="mbz"]')]);
  await page.waitForSelector('.notification-toast');
  const toast = await page.locator('.notification-toast').innerText();
  ok('téléchargement : un toast annonce le parcours avec « Visualiser »', toast.includes('La Révolution française') && await page.locator('.notification-toast .notification-parcours-icone').count() === 1, toast);
  await page.screenshot({ path: `${OUT}/2-toast.png` });
  ok('notification : dans la liste, avec son icône et son fichier .mbz', await page.evaluate(async () => {
    const { getNotifications } = await import('/js/ui/notifications.js');
    const n = getNotifications()[0];
    return n.parcours && n.fileName.endsWith('.mbz') && n.isCourse && n.courseText.includes('forum');
  }));
  // Deuxième téléchargement : la notification est remplacée, pas doublée
  await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('[data-liv="mbz"]')]);
  await pause(800);
  ok('retélécharger remplace la notification du parcours', await page.evaluate(async () => (await import('/js/ui/notifications.js')).getNotifications().filter(n => n.parcours).length === 1));

  // --- 3. Visualiser depuis la zone de notifications
  await page.click('#notification-btn, .notification-btn');
  await page.waitForSelector('.notification-item .notification-item__btn');
  await page.screenshot({ path: `${OUT}/3-liste.png` });
  await page.locator('.notification-item').first().locator('.notification-item__btn').click();
  await page.waitForSelector('.preview-modal .pc-vue');
  const modale = await page.evaluate(() => {
    const m = document.querySelector('.preview-modal');
    return {
      formats: [...m.querySelectorAll('.preview-modal__download-btn')].map(b => b.dataset.format),
      aide: m.querySelectorAll('.preview-modal__help-btn').length,
      plateformes: m.querySelector('.preview-modal__platforms-list')?.textContent.trim(),
      editeCache: m.querySelector('.preview-modal__edit-btn').classList.contains('hidden'),
      // Partage vers la Sucrerie coupé (D67) : le bouton reste dans le DOM, masqué.
      sucrerie: (b => !!b && getComputedStyle(b).display === 'none')(m.querySelector('[data-sucrerie-bridge-btn]')),
      types: [...m.querySelectorAll('.pc-vue__type')].map(n => n.textContent),
    };
  });
  ok('aperçu : la vue du parcours, forum et texte de liaison compris', modale.types.includes('Forum') && modale.types.includes('Texte de liaison'), modale.types.join(', '));
  ok('aperçu : Télécharger MBZ et JSON, aide à l’import, plateforme Éléa', JSON.stringify(modale.formats) === '["MBZ","JSON"]' && modale.aide === 1 && modale.plateformes === 'Éléa', JSON.stringify(modale));
  ok('aperçu : « Éditer » masqué sur la vue, bouton Sucrerie présent mais masqué (D67)', modale.editeCache && modale.sucrerie);
  await page.screenshot({ path: `${OUT}/4-apercu-vue.png` });

  // H5P dans la modale. Pendant le chargement, la zone ne doit jamais être
  // blanche : l'attente reste jusqu'au lecteur prêt, comme pour une activité seule.
  await page.evaluate(() => {
    const hote = document.querySelector('.pc-vue-apercu__hote');
    window.__attente = { blanc: false, rond: false };
    const obs = new MutationObserver(() => {
      if (!document.contains(hote)) return obs.disconnect();
      // Blanc : ni rond visible, ni lecteur visible.
      const vu = n => Boolean(n && n.getClientRects().length);
      const rond = vu(hote.querySelector('.json-editor__loading-spinner'));
      const lecteur = vu(hote.querySelector('iframe'));
      if (rond) window.__attente.rond = true;
      if (!rond && !lecteur) window.__attente.blanc = true;
      if (lecteur) obs.disconnect();
    });
    obs.observe(hote, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await page.locator('.preview-modal .pc-vue__activite[data-carte="vf"]').click();
  await page.waitForSelector('.preview-modal .pc-vue-apercu__hote iframe', { timeout: 30000 });
  ok('aperçu : un clic ouvre le vrai lecteur H5P, la barre dit l’étape', (await page.locator('.pc-vue-apercu__etape').textContent()).includes('Découvrir')
    && !(await page.locator('.preview-modal__edit-btn').evaluate(b => b.classList.contains('hidden'))));
  const attente = await page.evaluate(() => window.__attente);
  ok('aperçu : le rond de chargement, jamais de zone blanche avant le lecteur', attente.rond && !attente.blanc, JSON.stringify(attente));
  const navigation = await page.evaluate(() => ({
    boutonsBarre: [...document.querySelectorAll('.pc-vue-apercu__barre button')].filter(b => b.getClientRects().length).length,
    precedente: document.querySelector('.pc-vue-apercu__precedente').textContent,
    suivante: document.querySelector('.pc-vue-apercu__suivante').textContent,
    suiteSousLActivite: document.querySelector('.pc-vue-apercu__suite').getBoundingClientRect().top >= document.querySelector('.pc-vue-apercu__hote iframe').getBoundingClientRect().bottom,
  }));
  ok('aperçu : une seule rangée de flèches en haut, les activités voisines nommées en bas', navigation.boutonsBarre === 1
    && navigation.precedente === 'Avant l’exercice' && navigation.suivante === 'Quelle rupture ?' && navigation.suiteSousLActivite, JSON.stringify(navigation));
  await pause(1200);
  await page.screenshot({ path: `${OUT}/5-apercu-h5p.png` });

  // Éditer, comme une activité seule : l'éditeur occupe toute la zone, défile à
  // l'intérieur (une Page sur un écran bas), et Annuler / Enregistrer sont dans
  // le pied de la modale.
  await page.setViewportSize({ width: 1366, height: 620 });
  await page.locator('.pc-vue-apercu__precedente').click();
  await page.waitForFunction(() => document.querySelector('.pc-vue-apercu .pc-lecture__position')?.textContent.startsWith('2 /'));
  await page.locator('.pc-vue-apercu__precedente').click();
  await page.waitForFunction(() => document.querySelector('.pc-vue-apercu .pc-lecture__position')?.textContent.startsWith('1 /'));
  await page.click('.preview-modal__edit-btn');
  await page.waitForSelector('.preview-modal .json-editor__body', { timeout: 30000 });
  await pause(600);
  const edition = await page.evaluate(() => {
    const r = s => { const b = document.querySelector(s)?.getBoundingClientRect(); return b && [b.left, b.top, b.width, b.height].map(Math.round); };
    const pied = document.querySelector('.preview-modal__footer');
    const vus = s => [...pied.querySelectorAll(s)].filter(b => b.getClientRects().length).length;
    const tuile = document.querySelector('.preview-modal__content');
    return {
      editeur: r('.preview-modal .json-editor'), zone: r('.preview-modal__preview'),
      tuileDefilee: tuile.scrollTop, enteteVisible: document.querySelector('.preview-modal .json-editor__header').getBoundingClientRect().top >= tuile.getBoundingClientRect().top,
      barreInterne: [...document.querySelectorAll('.preview-modal .json-editor__actions')].some(b => b.getClientRects().length),
      annuler: vus('.preview-modal__cancel-btn'), enregistrer: vus('.preview-modal__save-btn'), telecharger: vus('.preview-modal__download-btn'),
      entete: document.querySelector('.preview-modal .json-editor__header')?.textContent.trim(),
    };
  });
  ok('édition : l’éditeur occupe exactement la zone, comme pour une activité seule', JSON.stringify(edition.editeur) === JSON.stringify(edition.zone), JSON.stringify(edition));
  ok('édition : écran bas, la tuile ne glisse pas et l’en-tête reste entier', edition.tuileDefilee === 0 && edition.enteteVisible, JSON.stringify(edition));
  ok('édition : Annuler et Enregistrer dans le pied de la modale, pas de seconde barre', edition.annuler === 1 && edition.enregistrer === 1 && edition.telecharger === 0 && !edition.barreInterne, JSON.stringify(edition));
  await page.screenshot({ path: `${OUT}/5a-edition-page-ecran-bas.png` });
  await page.click('.preview-modal__cancel-btn');
  await page.waitForSelector('.preview-modal__download-btn[data-format="MBZ"]');
  ok('édition : Annuler rend l’aperçu et le pied de téléchargement', await page.locator('.pc-vue-apercu__suite').isVisible());
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.locator('.pc-vue-apercu__suivante').click();
  await page.waitForFunction(() => document.querySelector('.pc-vue-apercu .pc-lecture__position')?.textContent.startsWith('2 /'));
  await page.locator('.pc-vue-apercu__suivante').click();
  await page.waitForSelector('.preview-modal .pc-vue-apercu__hote iframe', { timeout: 30000 });

  // Éditer le H5P depuis la modale, enregistrer : le fichier suit.
  const urlAvantH5P = await page.evaluate(async () => (await import('/js/ui/notifications.js')).getNotifications()[0].blobUrl);
  await page.click('.preview-modal__edit-btn');
  const enonce = page.locator('.preview-modal .json-editor [contenteditable="true"]').first();
  await enonce.waitFor({ timeout: 30000 });
  await enonce.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' (retouche)');
  await page.screenshot({ path: `${OUT}/5b-edition-h5p.png` });
  await page.click('.preview-modal__save-btn');
  await page.waitForSelector('.preview-modal .pc-vue-apercu__hote iframe', { timeout: 30000 });
  const apresH5P = await page.evaluate(async () => {
    const n = (await import('/js/ui/notifications.js')).getNotifications()[0];
    return { url: n.blobUrl, contenu: JSON.stringify(n.parcours.plan.etapes[0].cartes[2].contenu), telecharger: document.querySelectorAll('.preview-modal__download-btn').length };
  });
  ok('enregistrer un H5P met à jour le parcours, régénère le fichier et rend le pied', apresH5P.url !== urlAvantH5P && apresH5P.contenu.includes('(retouche)') && apresH5P.telecharger === 2, apresH5P.contenu.slice(0, 200));

  // Éditer le forum depuis la modale : même cadre, même pied
  await page.locator('.pc-vue-apercu__suivante').click();
  await page.waitForSelector('.preview-modal .pc-lecture__texte');
  ok('aperçu : Suivante mène au forum, texte affiché', (await page.locator('.pc-vue-apercu__activite').textContent()).startsWith('Forum'));
  const blobAvant = await page.evaluate(async () => (await import('/js/ui/notifications.js')).getNotifications()[0].blobUrl);
  await page.click('.preview-modal__edit-btn');
  await page.waitForSelector('.preview-modal .pc-form');
  const cadreForum = await page.evaluate(() => ({
    entete: document.querySelector('.preview-modal .pc-edition .json-editor__header')?.textContent.trim(),
    boutonPropre: !!document.querySelector('.preview-modal .pc-form .pc-cta'),
    aide: document.querySelectorAll('.preview-modal__editor-help-btn').length,
  }));
  ok('forum : en-tête « Édition : Forum », boutons dans le pied, sans Aide', cadreForum.entete === 'Édition : Forum' && !cadreForum.boutonPropre && cadreForum.aide === 0, JSON.stringify(cadreForum));
  await page.locator('.preview-modal .pc-form input.pc-form__saisie').first().fill('Quelle rupture retenir ?');
  await page.screenshot({ path: `${OUT}/6-edition.png` });
  // Fermer avec une retouche non enregistrée : confirmation
  await page.click('.preview-modal__close');
  await page.waitForSelector('.pc-confirmation');
  ok('fermer avec une retouche non enregistrée demande confirmation', true);
  await page.locator('.pc-confirmation button').first().click();
  await page.click('.preview-modal__save-btn');
  await page.waitForSelector('.preview-modal .pc-lecture__texte', { timeout: 30000 });
  const apres = await page.evaluate(async () => {
    const n = (await import('/js/ui/notifications.js')).getNotifications()[0];
    return { url: n.blobUrl, titre: n.parcours.plan.etapes[1].cartes[0].titre, annonce: document.querySelector('.pc-vue-apercu .pc-lecture__annonce').textContent };
  });
  ok('enregistrer met à jour le parcours et régénère le fichier', apres.url !== blobAvant && apres.titre === 'Quelle rupture retenir ?' && apres.annonce.length > 0, JSON.stringify(apres));
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.preview-modal__download-btn[data-format="MBZ"]')]);
  const fichiers = lireTar(readFileSync(await dl2.path()));
  const forum = Object.entries(fichiers).find(([n]) => /activities\/forum_\d+\/forum\.xml$/.test(n))?.[1] || '';
  ok('le MBZ téléchargé depuis la notification contient la retouche', forum.includes('Quelle rupture retenir'));
  const [dl3] = await Promise.all([page.waitForEvent('download'), page.click('.preview-modal__download-btn[data-format="JSON"]')]);
  const scen = JSON.parse(readFileSync(await dl3.path(), 'utf8'));
  ok('le JSON téléchargé depuis la notification est un scénario repris', scen.produit === 'caramel-parcours' && scen.plan.etapes[1].cartes[0].titre === 'Quelle rupture retenir ?');
  await page.setViewportSize({ width: 390, height: 844 });
  await pause(300);
  const barreMobile = await page.evaluate(() => Math.round(document.querySelector('.pc-vue-apercu__barre').getBoundingClientRect().height));
  ok('téléphone : la barre du parcours tient sur deux lignes au plus', barreMobile <= 110, `${barreMobile} px`);
  await page.screenshot({ path: `${OUT}/7a-mobile-activite.png` });
  await page.locator('.pc-vue-apercu__retour').click();
  await page.waitForSelector('.preview-modal .pc-vue');
  await pause(300);
  ok('téléphone : aucun débordement', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${OUT}/7-mobile.png` });
  await page.keyboard.press('Escape');
  await pause(500);
  ok('Échap ferme l’aperçu', await page.evaluate(() => getComputedStyle(document.querySelector('.preview-modal-overlay')).display === 'none'));

  // --- 4. Un parcours livré, en commencer un nouveau sans rouvrir d’onglet
  await page.setViewportSize({ width: 1440, height: 950 });
  const nouveau = page.locator('#pc-nouveau-parcours');
  ok('nouveau parcours : le bouton est là une fois le plan posé', await nouveau.isVisible());
  await nouveau.click();
  await page.waitForSelector('.pc-confirmation');
  // D85 : la question porte aussi « Exporter le scénario (.json) », qui ne la ferme pas.
  await page.locator('.pc-confirmation__actions button:not(.pc-confirmation__annexe):not(.pc-confirmation__abandon)').click();
  await page.waitForSelector('.pc-confirmation', { state: 'detached' });
  ok('nouveau parcours : « Garder ce parcours » ne touche à rien', await page.evaluate(async () => Boolean((await import('/js/parcours/state.js')).brouillon()?.plan)));
  await nouveau.click();
  await page.waitForSelector('.pc-confirmation');
  await page.screenshot({ path: `${OUT}/8-nouveau-parcours.png` });
  await page.locator('.pc-confirmation__abandon').click();
  await page.waitForSelector('.pc-atelier--cadrage');
  const neuf = await page.evaluate(async () => ({
    plan: (await import('/js/parcours/state.js')).brouillon()?.plan ?? null,
    bouton: document.querySelector('#pc-nouveau-parcours')?.disabled,
    sujet: document.querySelector('#quoi')?.value,
    notification: (await import('/js/ui/notifications.js')).getNotifications().some(n => n.parcours),
  }));
  // D85 : sans plan, « Nouveau parcours » reste visible, grisé.
  ok('nouveau parcours : retour au cadrage, brouillon vidé, bouton grisé, sujet de l’accueil gardé, MBZ toujours en notification',
    neuf.plan === null && neuf.bouton === true && neuf.sujet === 'La Révolution française' && neuf.notification, JSON.stringify(neuf));
  ok('aucune erreur JavaScript', erreurs.length === 0, erreurs.join(' | '));
  console.log(`Vue du parcours : ${reussis} PASS / ${echecs} FAIL`);
  await browser.close();
  if (echecs) process.exitCode = 1;
} finally { server.kill(); }
