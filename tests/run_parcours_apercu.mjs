/**
 * run_parcours_apercu.mjs — Passer d'une activité à l'autre dans l'aperçu d'un parcours.
 *
 * Constat du 25 sept. 2026 : depuis l'atelier, l'aperçu de « Ordonner les
 * paragraphes », « Surligner les mots » et « Glossaire » était lent, et
 * « plantait » parfois : l'attente disparaissait sur une zone vide. Ce banc
 * garde les trois causes :
 *
 *  1. **L'iframe de 0 px.** H5P dimensionne son iframe sur `body.scrollHeight`.
 *     Monté dans un conteneur en `display:none` (l'attente restait affichée), il
 *     mesurait 0 et l'activité restait invisible, sans une erreur. Environ une
 *     navigation sur cinquante. Le banc monte une activité dans un conteneur
 *     MASQUÉ, l'affiche, et exige une iframe à sa hauteur : déterministe, car le
 *     gestionnaire attend désormais que l'activité soit montée avant de rendre
 *     la main.
 *  2. **La fuite d'écouteurs.** Chaque iframe accrochait un `resize` sur la
 *     fenêtre de Caramel, jamais retiré, qui retenait l'iframe morte en mémoire.
 *  3. **Les bibliothèques jamais préchargées.** Le lecteur découvrait leurs
 *     dépendances niveau par niveau ; l'accueil, lui, les précharge dès le choix
 *     d'une tuile. Le panneau précharge maintenant celles des autres activités.
 *
 * Et, par de vrais clics dans le panneau : chaque activité est VISIBLE dès que
 * l'attente disparaît, rafales comprises ; le Glossaire ne laisse pas ses marques
 * (`data-sim-root`) sur l'hôte des activités suivantes.
 *
 * Contre-épreuves (chacune fait rougir le banc) : retirer
 * `this._suivreTaille(container)` de `load()` dans `h5p-manager.js` ; retirer la
 * boucle `$(window).off()` de `destroy()` ; retirer l'appel à
 * `prechargerBibliotheques` en fin d'`ouvrirActivite()`.
 *
 * Lancement : node tests/run_parcours_apercu.mjs
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(join(ROOT, 'tests/roundtrip/package.json'))('playwright');
const PORT = 8141;
const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
process.on('exit', () => { try { server.kill('SIGTERM'); } catch { /* déjà arrêté */ } });

let reussis = 0, echecs = 0;
const ok = (nom, c, d = '') => { if (c) reussis++; else echecs++; console.log(`${c ? '✓' : '✗'} ${nom}${c ? '' : '\n     ' + d}`); };

async function attendreServeur(ms = 15000) {
    const fin = Date.now() + ms;
    while (Date.now() < fin) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok) return; } catch { /* pas prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    throw new Error(`serveur absent sur ${PORT}`);
}

let code = 0;
try {
    await attendreServeur();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(String(e.message || e)));
    // Pas de `page.route()` : il désactiverait le cache HTTP de Chromium, et le
    // banc mesurerait un navigateur qui n'existe pas. Aucun appel réseau externe
    // ne part d'un aperçu.
    const cdp = await page.context().newCDPSession(page);
    const ecouteursResize = async () => {
        const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
        const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
        return listeners.filter(l => l.type === 'resize').length;
    };
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0, null, { timeout: 60000 });

    // ── 1. Le gestionnaire, seul : conteneur masqué pendant tout le chargement ──
    const masque = await page.evaluate(async () => {
        const { packageActivity } = await import('/js/core/package-activity.js');
        const { H5PManager } = await import('/js/h5p/h5p-manager.js');
        const contenu = await (await fetch('/assets/data/examples/sort_the_paragraphs_1.json')).json();
        const paquet = await packageActivity({ moduleKey: 'SortParagraphs', content: contenu, title: 'Masqué', mediaFiles: [] });
        const boite = document.createElement('div');
        boite.style.cssText = 'display:none; width:900px';
        document.body.append(boite);
        const manager = new H5PManager();
        await manager.load(paquet.blob, boite);
        const iframe = boite.querySelector('iframe');
        const monte = Boolean(iframe?.contentWindow?.H5P?.instances?.length);
        boite.style.display = 'block';
        await new Promise(r => setTimeout(r, 600));
        const hauteur = iframe.getBoundingClientRect().height;
        manager.destroy(boite);
        boite.remove();
        return { monte, hauteur };
    });
    ok('gestionnaire : load() rend la main une fois l’activité montée dans son iframe', masque.monte, JSON.stringify(masque));
    ok('gestionnaire : monté masqué puis affiché, le lecteur prend sa hauteur (plus d’iframe de 0 px)', masque.hauteur > 100, JSON.stringify(masque));

    // ── 2. Le panneau de l'atelier, par de vrais clics ──
    const ordre = ['SortParagraphs', 'MarkTheWords', 'glossaireXml', 'Flashcards'];
    await page.evaluate(async ordre => {
        const fichiers = { SortParagraphs: 'sort_the_paragraphs_1', MarkTheWords: 'mark_the_words_1', glossaireXml: 'glossaire_xml_1', Flashcards: 'flashcards_1' };
        const cartes = [];
        for (const [i, module] of ordre.entries()) {
            const contenu = await (await fetch(`/assets/data/examples/${fichiers[module]}.json`)).json();
            cartes.push({ id: `c${i}`, titre: module, module, contenu, verrouillee: false });
        }
        const { ouvrirActivite } = await import('/js/parcours/activity-panel.js');
        ouvrirActivite({ platform: 'elea', plan: { titre: 'Aperçu', etapes: [{ id: 'e1', titre: 'Étape', cartes }] } }, cartes[0], { mode: 'apercu' });
    }, ordre);

    // L'instant où l'attente disparaît : ce que l'enseignant voit À CE MOMENT.
    const releve = () => page.waitForFunction(() => {
        const hote = document.querySelector('#pc-lecture-contenu');
        if (!hote || hote.querySelector('.pc-lecture__attente')) return false;
        const iframe = hote.querySelector('iframe');
        return {
            titre: document.querySelector('#pc-lecture-titre')?.textContent,
            position: document.querySelector('.pc-lecture__position')?.textContent,
            hauteur: iframe ? Math.round(iframe.getBoundingClientRect().height) : null,
            enChargement: Boolean(hote.querySelector('.pc-lecture__lecteur--chargement')),
            simulateur: Boolean(hote.querySelector('.sim-mount')?.children.length),
            marqueHote: hote.hasAttribute('data-sim-root'),
            erreur: Boolean(hote.querySelector('.pc-editeur__erreur')),
        };
    }, null, { timeout: 30000, polling: 20 }).then(h => h.jsonValue()).catch(() => ({ delai: true }));
    const bouton = texte => page.locator('.pc-lecture__navigation button', { hasText: texte });
    const visible = r => !r.delai && !r.erreur && !r.enChargement
        && (r.titre === 'glossaireXml' ? r.simulateur : r.hauteur > 100);

    const premier = await releve();
    ok('panneau : « Ordonner les paragraphes » est visible dès que l’attente disparaît', visible(premier) && premier.titre === 'SortParagraphs', JSON.stringify(premier));
    // Le préchargement des autres activités, AVANT tout clic : les visiter les
    // préchargerait de toute façon, et le banc ne verrait plus rien.
    // `waitForFunction` ne relance pas un prédicat asynchrone : le module d'abord.
    await page.evaluate(async () => { window.__prefetch = await import('/js/h5p/h5p-prefetch.js'); });
    const precharge = await page.waitForFunction(() => {
        const dossiers = Object.keys(window.__prefetch.getPrefetchStatus().libraries);
        const present = nom => dossiers.some(d => d.startsWith(`${nom}-`));
        return present('H5P.MarkTheWords') && present('H5P.Flashcards') ? dossiers.length : false;
    }, null, { timeout: 15000, polling: 200 }).then(h => h.jsonValue()).catch(() => 0);
    ok('panneau : les bibliothèques des autres activités prêtes sont préchargées', precharge > 0, `bibliothèques préchargées : ${precharge}`);

    const avant = await ecouteursResize();

    const vus = [];
    for (let tour = 0; tour < 3; tour++) {
        for (let i = 1; i < ordre.length; i++) { await bouton('Suivante').click(); vus.push(await releve()); }
        for (let i = ordre.length - 2; i >= 0; i--) { await bouton('Précédente').click(); vus.push(await releve()); }
    }
    const invisibles = vus.filter(r => !visible(r));
    ok(`panneau : ${vus.length} changements d’activité, chacune visible dès que l’attente disparaît`, !invisibles.length, JSON.stringify(invisibles));
    const glossaire = vus.find(r => r.titre === 'glossaireXml');
    ok('panneau : le Glossaire se monte dans son propre conteneur', glossaire?.simulateur === true, JSON.stringify(glossaire));
    ok('panneau : après le Glossaire, l’hôte ne garde pas ses marques de simulateur', vus.every(r => !r.marqueHote), JSON.stringify(vus.filter(r => r.marqueHote)));

    // Une rafale : trois clics sans attendre, la dernière demande gagne.
    await bouton('Suivante').click();
    await page.waitForTimeout(60);
    await bouton('Suivante').click();
    await page.waitForTimeout(60);
    await bouton('Suivante').click();
    const rafale = await releve();
    ok('panneau : après une rafale de clics, la dernière activité demandée est affichée et visible',
        visible(rafale) && rafale.titre === 'Flashcards' && rafale.position.startsWith('4 /'), JSON.stringify(rafale));

    const apres = await ecouteursResize();
    ok('panneau : les iframes quittées ne laissent pas d’écouteur `resize` sur la fenêtre',
        apres - avant <= 1, `avant ${avant}, après ${apres} (${vus.length + 3} changements)`);

    ok('aucune erreur JS de page', !erreurs.length, erreurs.join(' | '));
    await browser.close();
} catch (e) {
    console.error(e);
    code = 1;
}

console.log(`\nAperçu du parcours : ${reussis} PASS / ${echecs} FAIL`);
process.exit(code || (echecs ? 1 : 0));
