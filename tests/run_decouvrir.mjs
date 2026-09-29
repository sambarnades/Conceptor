/**
 * run_decouvrir.mjs — La page de présentation (/decouvrir/) : ses données, ses liens,
 * et son fonctionnement dans un vrai navigateur.
 *
 * Volet 1, sans navigateur (en CI) — ce qu'on modifie à la main ou qu'un script régénère :
 *   - `decouvrir/ressources.json` : types connus, titre et lien présents, adresses https,
 *     lecteur Podeduc au bon format, dates lisibles (contre-épreuve : une entrée abîmée
 *     exprès doit être refusée) ;
 *   - `assets/presentation/activites/index.json` : chaque activité a son dossier jouable,
 *     son .h5p (qui contient EXACTEMENT le content.json joué sur la page) et son icône ;
 *   - le lien « Découvrir Caramel » du pied de page et sa clé dans les 12 locales ;
 *   - la publication : `decouvrir` copié par le job `pages`, Podeduc permis en frame-src ;
 *   - toutes les ressources locales citées par la page existent.
 * Volet 2, navigateur (Playwright, sauf `--sans-navigateur`) :
 *   - aucune erreur de page ni ressource manquante ;
 *   - une carte par ressource, un filtre par type présent ;
 *   - CHAQUE tuile charge son activité — h5p-standalone efface sa variable globale après
 *     son premier usage : sans la référence gardée par decouvrir.js, seule la première
 *     activité se chargeait (défaut constaté le 29 sept. 2026) ;
 *   - les lecteurs natifs s'ouvrent dans leurs cartes, se ferment et s'arrêtent
 *     quand une autre vidéo démarre ou qu'un filtre les masque ;
 *   - pas de défilement horizontal sur un téléphone.
 *
 * Lancement :  node tests/run_decouvrir.mjs [--sans-navigateur]
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = chemin => readFileSync(resolve(root, chemin), 'utf8');
const NAVIGATEUR = !process.argv.includes('--sans-navigateur');

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}

// =======================================================================
// Volet 1 — les données et les liens
// =======================================================================
const TYPES = ['video', 'tutoriel', 'presentation', 'article', 'communaute', 'conference', 'publication'];
const PODEDUC = /^https:\/\/podeduc\.apps\.education\.fr\/video\/\d+-[a-z0-9-]+\/\?is_iframe=true$/;

/** Les défauts d'une entrée de ressources.json ([] si elle est bonne). */
function defautsRessource(r) {
    const d = [];
    if (!r || typeof r !== 'object') return ['entrée qui n’est pas un objet'];
    if (!TYPES.includes(r.type)) d.push(`type inconnu « ${r.type} » (attendu : ${TYPES.join(', ')})`);
    if (!String(r.titre ?? '').trim()) d.push('titre vide');
    if (!/^https:\/\//.test(String(r.lien ?? ''))) d.push(`lien absent ou non https : ${r.lien}`);
    if (r.integration !== undefined) {
        if (!/^https:\/\//.test(r.integration)) d.push(`lecteur non https : ${r.integration}`);
        else if (r.integration.includes('podeduc') && !PODEDUC.test(r.integration))
            d.push(`lecteur Podeduc mal formé (attendu …/video/<numéro>-<nom>/?is_iframe=true) : ${r.integration}`);
        else if (/^https:\/\/(?:[^/]+\.)?youtube\.com\//.test(r.integration))
            d.push('lecteur YouTube classique : utiliser www.youtube-nocookie.com');
    }
    if (r.date !== undefined && !/^\d{4}-\d{2}(-\d{2})?$/.test(r.date)) d.push(`date illisible (AAAA-MM ou AAAA-MM-JJ) : ${r.date}`);
    return d;
}

let ressources = [];
try {
    ressources = JSON.parse(lire('decouvrir/ressources.json')).ressources;
    ok('ressources.json : une liste « ressources »', Array.isArray(ressources) && ressources.length > 0);
} catch (e) { ok('ressources.json se lit', false, e.message); }
ressources.forEach((r, i) => {
    const d = defautsRessource(r);
    ok(`ressource ${i + 1} (« ${r?.titre} ») valide`, !d.length, d.join(' ; '));
});
// Contre-épreuve : les défauts qu'une saisie à la main produit le plus souvent se voient.
ok('contre-épreuve : type inconnu refusé', defautsRessource({ type: 'videos', titre: 'x', lien: 'https://x' }).length === 1);
ok('contre-épreuve : lien Podeduc de page (sans is_iframe) refusé',
    defautsRessource({ type: 'video', titre: 'x', lien: 'https://x', integration: 'https://podeduc.apps.education.fr/video/161411-caramel-7/' }).length === 1);
ok('contre-épreuve : date à la française refusée', defautsRessource({ type: 'article', titre: 'x', lien: 'https://x', date: '29/09/2026' }).length === 1);
ok('contre-épreuve : une intégration YouTube classique est signalée',
    defautsRessource({ type: 'video', titre: 'x', lien: 'https://youtu.be/x', integration: 'https://www.youtube.com/embed/x' }).length === 1);

let mentions = [];
try {
    mentions = JSON.parse(lire('decouvrir/on-parle-de-nous.json')).mentions;
    ok('on-parle-de-nous.json : un vrai catalogue', Array.isArray(mentions) && mentions.length >= 20, `${mentions?.length || 0} entrée(s)`);
} catch (e) { ok('on-parle-de-nous.json se lit', false, e.message); }
mentions.forEach((r, i) => {
    const d = defautsRessource(r);
    ok(`mention ${i + 1} (« ${r?.titre} ») valide`, !d.length, d.join(' ; '));
});
ok('catalogue : liens sans doublon', new Set(mentions.map(r => r.lien)).size === mentions.length);
ok('catalogue : conférences, vidéos, articles et publications représentés',
    ['conference', 'video', 'article', 'publication'].every(t => mentions.some(r => r.type === t)));
ok('catalogue : mentions récentes de septembre 2026', mentions.filter(r => r.date?.startsWith('2026-09')).length >= 4);
ok('catalogue : lecteur MoodleMoot/Ubicast vérifié', mentions.some(r => r.integration === 'https://moodlemoot.ubicast.tv/permalink/v126d506dbfdb1pxp314/iframe/'));
ok('catalogue : le MiniMoot démarre à 1 h 25 min 31 s dans YouTube sans cookie', mentions.some(r =>
    r.lien === 'https://www.youtube.com/live/LbBMKHTpVak?si=KTQ-J55WCadlFpRV&t=5131'
    && r.integration === 'https://www.youtube-nocookie.com/embed/LbBMKHTpVak?start=5131'));

// Les activités à essayer.
const { ensureFflate } = await import('./roundtrip/bootstrap.mjs');
const fflate = await ensureFflate();
let activites = [];
try { activites = JSON.parse(lire('assets/presentation/activites/index.json')); } catch (e) { ok('index.json des activités se lit', false, e.message); }
ok('au moins une activité à essayer', activites.length > 0);
for (const a of activites) {
    const nom = `activité « ${a.id} »`;
    for (const cle of ['id', 'titre', 'type', 'machineName', 'icone', 'h5p', 'dossier']) ok(`${nom} : ${cle} présent`, !!a[cle]);
    ok(`${nom} : icône présente`, existsSync(resolve(root, a.icone)), a.icone);
    const h5pJson = resolve(root, a.dossier, 'h5p.json'), contenu = resolve(root, a.dossier, 'content/content.json');
    ok(`${nom} : h5p.json`, existsSync(h5pJson));
    ok(`${nom} : content/content.json`, existsSync(contenu));
    if (!existsSync(h5pJson) || !existsSync(resolve(root, a.h5p))) { ok(`${nom} : .h5p présent`, false, a.h5p); continue; }
    const meta = JSON.parse(readFileSync(h5pJson, 'utf8'));
    ok(`${nom} : bibliothèque principale = ${a.machineName}`, meta.mainLibrary === a.machineName, meta.mainLibrary);
    ok(`${nom} : sa bibliothèque est dans js/vendor/h5p-libs`,
        (meta.preloadedDependencies || []).filter(d => d.machineName === meta.mainLibrary)
            .every(d => existsSync(resolve(root, `js/vendor/h5p-libs/${d.machineName}-${d.majorVersion}.${d.minorVersion}`))));
    const zip = fflate.unzipSync(new Uint8Array(readFileSync(resolve(root, a.h5p))));
    const dansZip = zip['content/content.json'] && Buffer.from(zip['content/content.json']).toString('utf8');
    ok(`${nom} : le .h5p téléchargé contient le content.json joué sur la page`, dansZip === readFileSync(contenu, 'utf8'));
}

// Le pied de page de Caramel, et la clé de son libellé.
const accueil = lire('index.html');
ok('pied de page : lien « Découvrir Caramel »', /<footer class="footer">[\s\S]*href="decouvrir\/"[\s\S]*data-key="footer_discover"[\s\S]*<\/footer>/.test(accueil));
for (const l of ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br']) {
    const v = JSON.parse(lire(`js/locales/${l}.json`)).footer_discover;
    ok(`locale ${l} : footer_discover`, typeof v === 'string' && v.trim().length > 0);
}

// La publication.
ok('job pages : le dossier decouvrir est copié', /cp -r [^\n]*\bdecouvrir\b[^\n]*\.public\//.test(lire('.gitlab-ci.yml')));
if (ressources.some(r => r.integration?.includes('podeduc'))) {
    ok('_headers : Podeduc permis en frame-src', /frame-src[^;]*https:\/\/podeduc\.apps\.education\.fr/.test(lire('_headers')));
}
if (mentions.some(r => r.integration?.includes('moodlemoot.ubicast.tv'))) {
    ok('_headers : MoodleMoot/Ubicast permis en frame-src', /frame-src[^;]*https:\/\/moodlemoot\.ubicast\.tv/.test(lire('_headers')));
}
if (mentions.some(r => r.integration?.includes('youtube-nocookie.com'))) {
    ok('_headers : YouTube sans cookie permis en frame-src', /frame-src[^;]*https:\/\/www\.youtube-nocookie\.com/.test(lire('_headers')));
}
for (const hote of ['tube-sciences-technologies.apps.education.fr', 'tube-numerique-educatif.apps.education.fr']) {
    ok(`_headers : le lecteur natif de ${hote} est permis en frame-src`,
        lire('_headers').match(/frame-src\s+'self'[^;]*/)?.[0].includes(`https://${hote}`));
}

// Les ressources locales citées par la page.
const page = lire('decouvrir/index.html');
const cssDecouvrir = lire('decouvrir/decouvrir.css');
const jsDecouvrir = lire('decouvrir/decouvrir.js');
const locales = [...page.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]).filter(u => !u.startsWith('http') && u !== '../');
for (const u of new Set(locales)) {
    ok(`page : « ${u} » existe`, existsSync(resolve(root, 'decouvrir', u.split('?')[0])), u);
}
ok('ouverture : aucune pastille promotionnelle au-dessus du titre',
    !/pastille-douce|>Gratuit<|>Sans compte<|>Logiciel libre</.test(page));
ok('présentation : aucune animation décorative automatique',
    !/@keyframes|animation\s*:(?!\s*none)/.test(cssDecouvrir)
    && !/\b(?:anime|revele|pluie|requestAnimationFrame|data-compter)\b/.test(page + jsDecouvrir));
ok('pied de page : l’étoile reprend la couleur des autres icônes',
    /\.footer \.footer-discover i\s*\{\s*color:\s*inherit;\s*\}/.test(lire('css/base/custom.css')));
ok('catalogue : les éléments filtrés sont réellement retirés de la mise en page',
    /\.ressource\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/.test(cssDecouvrir));
ok('catalogue : les repères vidéo et lecture sont des SVG',
    /const SVG\s*=/.test(jsDecouvrir) && /<svg viewBox=/.test(jsDecouvrir));
ok('présentation : le sélecteur reprend les douze langues et leurs drapeaux',
    (page.match(/data-lang="(?:fr|en|es|de|it|nl|pt|ar|zh|jp|el|br)"/g) || []).length === 12
    && /flag-icons/.test(page) && /class="fi fi-bzh"/.test(page));
ok('présentation : le bandeau et le pied reprennent les repères structurants de Caramel',
    /class="marque"[\s\S]*class="header-right barre__actions"/.test(page)
    && /Caramel v7\.0\.0/.test(page) && /Gauthier REMANDE/.test(page) && /Emmanuel GAUNARD/.test(page));

// =======================================================================
// Volet 2 — dans un navigateur
// =======================================================================
if (NAVIGATEUR) {
    const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
    const port = 8181;
    const serveur = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    const navigateur = await chromium.launch();
    try {
        const URL_PAGE = `http://127.0.0.1:${port}/decouvrir/`;
        for (let i = 0; i < 50; i++) { try { if ((await fetch(URL_PAGE)).ok) break; } catch { /* pas encore prêt */ } await new Promise(r => setTimeout(r, 100)); }

        const p = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
        await p.addInitScript(() => {
            // Vérifier le code copié sans toucher au presse-papiers de l'utilisateur.
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
                writeText: async code => { window.codeIntegrationCopie = code; }
            } });
            Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: undefined });
        });
        const erreurs = [];
        p.on('pageerror', e => erreurs.push(`erreur de page : ${e.message}`));
        p.on('response', r => { if (r.status() >= 400) erreurs.push(`${r.status()} ${r.url()}`); });
        await p.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());       // la mesure d'audience, hors sujet ici
        await p.route(/moodlemoot\.ubicast\.tv/, r => r.abort());             // lecteur tiers : seul son branchement est testé
        await p.route(/youtube-nocookie\.com/, r => r.abort());               // idem pour le lecteur YouTube sans cookie
        await p.route(/podeduc\.apps\.education\.fr/, r => r.abort());
        await p.route(/tube-(?:sciences-technologies|numerique-educatif)\.apps\.education\.fr/, r => r.abort());
        await p.goto(URL_PAGE, { waitUntil: 'networkidle' });

        const navigationCentree = await p.locator('.navigation a').evaluateAll(liens => {
            const debut = liens[0].getBoundingClientRect(), fin = liens.at(-1).getBoundingClientRect();
            const nav = liens[0].parentElement.getBoundingClientRect();
            return Math.abs((debut.left + fin.right) / 2 - (nav.left + nav.right) / 2) < 1;
        });
        ok('navigateur : les liens de section sont centrés sur ordinateur', navigationCentree);
        ok('navigateur : marque, navigation et outils occupent la même ligne',
            await p.locator('.barre__marque, .barre__navigation, .barre__actions').evaluateAll(elements => {
                const centres = elements.map(e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; });
                return Math.max(...centres) - Math.min(...centres) < 1;
            }));
        ok('navigateur : le footer de présentation annonce la licence réelle du dépôt',
            await p.locator('.pied [data-decouvrir-key="license_info"]').textContent() === 'GNU AGPL v3.0 ou ultérieure');

        ok('navigateur : une carte par ressource', await p.locator('#liste-ressources .ressource').count() === ressources.length);
        ok('navigateur : une carte par mention', await p.locator('#liste-mentions .ressource').count() === mentions.length);
        const typesPresents = new Set(ressources.map(r => r.type)).size;
        ok('navigateur : « Tout » + un filtre par type présent', await p.locator('#filtres .filtre').count() === typesPresents + 1);
        const typesMentions = new Set(mentions.map(r => r.type)).size;
        ok('navigateur : filtres du catalogue complets', await p.locator('#filtres-mentions .filtre').count() === typesMentions + 1);
        await p.locator('#filtres-mentions .filtre[data-type="video"]').click();
        ok('navigateur : le filtre Vidéos ne conserve que les vidéos',
            await p.locator('#liste-mentions .ressource:not([hidden])').count() === mentions.filter(r => r.type === 'video').length);
        ok('navigateur : les cartes exclues par le filtre ne prennent plus de place',
            await p.locator('#liste-mentions .ressource[hidden]').evaluateAll(cartes => cartes.every(c => getComputedStyle(c).display === 'none')));
        await p.locator('#filtres-mentions .filtre[data-type="tout"]').click();
        ok('navigateur : chaque mention affiche un repère SVG vidéo ou lecture',
            await p.locator('#liste-mentions .ressource__type svg').count() === mentions.length);
        ok('navigateur : un code d’intégration par vidéo intégrable',
            await p.locator('#integrations .copier').count() === 1
            && await p.locator('input[name="integration-video"]').count() === [...ressources, ...mentions].filter(r => r.integration).length);
        ok('navigateur : deux exemples et une liste compacte pour les autres vidéos',
            await p.locator('.integration-exemples .integration-option').count() === 2
            && await p.locator('.integration-liste').evaluate(e => e.scrollHeight > e.clientHeight && e.clientHeight <= 150));
        ok('navigateur : une tuile par activité', await p.locator('#tuiles .tuile').count() === activites.length);

        // Chaque tuile charge son activité, l'une après l'autre.
        for (let i = 0; i < activites.length; i++) {
            if (i > 0) await p.click(`#tuiles .tuile[data-i="${i}"]`);
            let charge = false;
            try {
                await p.frameLocator('#scene-jeu iframe').locator('.h5p-content').first().waitFor({ timeout: 15000 });
                charge = true;
            } catch { /* rendu en échec */ }
            const message = await p.locator('#scene-jeu .scene__attente').count() ? await p.locator('#scene-jeu .scene__attente').textContent() : '';
            ok(`navigateur : l’activité « ${activites[i].id} » se charge (tuile ${i + 1})`, charge, message);
        }

        // L'affiche d'une vidéo, puis le lecteur Podeduc.
        for (const [i, video] of [...ressources, ...mentions].filter(r => r.integration).entries()) {
            await p.locator(`input[name="integration-video"][value="${i}"]`).check();
            await p.locator('#integrations .copier').click();
            const copie = await p.evaluate(() => {
                const zone = document.createElement('div');
                zone.innerHTML = window.codeIntegrationCopie;
                const cadre = zone.querySelector('iframe');
                return { src: cadre?.getAttribute('src'), titre: cadre?.title, pleinEcran: cadre?.hasAttribute('allowfullscreen') };
            });
            ok(`navigateur : code choisi et copié pour « ${video.titre} »`,
                copie.src === video.integration && copie.titre === video.titre && copie.pleinEcran);
        }
        ok('navigateur : les trois cartes de formation gardent une hauteur équilibrée',
            await p.locator('.kit > .carte-kit:not(.carte-kit--large)').evaluateAll(cartes => {
                const hauteurs = cartes.map(c => c.getBoundingClientRect().height);
                return Math.max(...hauteurs) < 650 && Math.max(...hauteurs) - Math.min(...hauteurs) < 1;
            }));
        await p.locator('input[name="integration-video"][value="0"]').check();
        await p.locator('input[name="integration-video"][value="0"]').press('ArrowRight');
        await p.locator('#integrations .copier').click();
        ok('navigateur : les flèches choisissent la Sucrerie et son code se copie',
            await p.locator('input[name="integration-video"][value="1"]').isChecked()
            && await p.evaluate(() => window.codeIntegrationCopie.includes('158264-decouvrez-la-sucrerie')));

        const premiere = p.locator('.lecteur').first();
        ok('navigateur : les deux vidéos de présentation ont leurs boutons externe et partage',
            await p.locator('.video-presentation .video-externe').count() === 2
            && await p.locator('.video-presentation .video-partager').count() === 2);
        await p.locator('.video-presentation .video-partager').first().click();
        ok('navigateur : partager la présentation copie son lien public',
            await p.evaluate(() => window.codeIntegrationCopie === 'https://podeduc.apps.education.fr/video/161411-caramel-7/'));
        const attendu = await premiere.getAttribute('data-integration');
        await premiere.locator('.affiche').click();
        const src = await premiere.locator('iframe').getAttribute('src').catch(() => null);
        ok('navigateur : l’affiche laisse place au lecteur Podeduc', !!src && src.startsWith(attendu), src);

        const lienMoot = p.locator('#liste-mentions .ressource__ouvrir').filter({ hasText: 'La Sucrerie au MoodleMoot 2026' });
        await lienMoot.click();
        const srcMoot = await p.locator('.ressource--ouverte iframe').getAttribute('src').catch(() => null);
        ok('navigateur : la captation MoodleMoot s’ouvre dans sa carte',
            srcMoot === 'https://moodlemoot.ubicast.tv/permalink/v126d506dbfdb1pxp314/iframe/?autoplay=true', srcMoot);
        ok('navigateur : la vidéo élargit sa carte dans la grille, sans fenêtre superposée',
            await p.locator('.ressource--ouverte').evaluate(el => Math.abs(el.getBoundingClientRect().width - el.parentElement.getBoundingClientRect().width) < 2)
            && await p.locator('dialog').count() === 0);
        ok('navigateur : le lecteur de présentation est arrêté quand une vidéo du catalogue démarre',
            await premiere.locator('iframe').count() === 0 && await premiere.locator('.affiche').count() === 1);

        const lienMiniMoot = p.locator('#liste-mentions .ressource__ouvrir').filter({ hasText: 'Caramel au MiniMoot de Brest' });
        await lienMiniMoot.click();
        const srcMiniMoot = await p.locator('.ressource--ouverte iframe').getAttribute('src').catch(() => null);
        ok('navigateur : le MiniMoot utilise YouTube sans cookie et démarre au bon instant',
            srcMiniMoot === 'https://www.youtube-nocookie.com/embed/LbBMKHTpVak?start=5131&autoplay=true', srcMiniMoot);
        ok('navigateur : ouvrir une autre vidéo retire le lecteur précédent',
            await p.locator('.ressource__video iframe').count() === 1
            && await lienMoot.getAttribute('aria-expanded') === 'false');
        const dimensions = await p.locator('.ressource--ouverte .lecteur').evaluate(el => {
            const r = el.getBoundingClientRect();
            return { largeur: Math.round(r.width), ratio: r.width / r.height };
        });
        ok('navigateur : le lecteur intégré conserve un format responsive 16/9',
            dimensions.largeur <= 980 && Math.abs(dimensions.ratio - (16 / 9)) < .02, JSON.stringify(dimensions));
        const miniMoot = mentions.find(r => r.titre === 'Caramel au MiniMoot de Brest');
        await p.evaluate(() => {
            navigator.share = async donnees => { window.partageVideo = donnees; };
        });
        await p.locator('.ressource--ouverte .video-partager').click();
        ok('navigateur : le partage natif transmet le titre et le lien MiniMoot avec son départ',
            await p.evaluate(r => window.partageVideo.title === r.titre && window.partageVideo.url === r.lien, miniMoot));
        const avantAnnulation = await p.evaluate(() => window.codeIntegrationCopie);
        await p.evaluate(() => { navigator.share = async () => { throw new DOMException('Annulé', 'AbortError'); }; });
        await p.locator('.ressource--ouverte .video-partager').click();
        ok('navigateur : annuler le partage ne copie rien et garde le bouton disponible',
            await p.evaluate(avant => window.codeIntegrationCopie === avant, avantAnnulation)
            && await p.locator('.ressource--ouverte .video-partager').isEnabled()
            && await p.locator('.ressource--ouverte .video-partager span').textContent() === 'Partager');
        await p.evaluate(() => { navigator.share = async () => { throw new Error('Indisponible'); }; });
        await p.locator('.ressource--ouverte .video-partager').click();
        ok('navigateur : un partage indisponible copie le lien public en secours',
            await p.evaluate(lien => window.codeIntegrationCopie === lien, miniMoot.lien)
            && await p.locator('.ressource--ouverte .video-partager span').textContent() === 'Lien copié !');
        await p.evaluate(() => {
            navigator.share = undefined;
            navigator.clipboard.writeText = async () => { throw new Error('Copie refusée'); };
        });
        await p.locator('.ressource--ouverte .video-partager').click();
        ok('navigateur : une copie refusée laisse le lien sélectionné sans annoncer un succès',
            await p.locator('.ressource--ouverte .video-lien').inputValue() === miniMoot.lien
            && await p.locator('.ressource--ouverte .video-lien').evaluate(e => e.selectionEnd - e.selectionStart === e.value.length)
            && await p.locator('.ressource--ouverte .video-partager span').textContent() === 'Copiez ce lien');
        await p.evaluate(() => { navigator.clipboard.writeText = async code => { window.codeIntegrationCopie = code; }; });
        await p.locator('.ressource__fermer').click();
        ok('navigateur : fermer arrête la vidéo et rend le focus au titre',
            await p.locator('.ressource__video iframe').count() === 0
            && await lienMiniMoot.evaluate(el => document.activeElement === el));

        for (const [liste, donnees] of [['#liste-mentions', mentions], ['#liste-ressources', ressources]]) {
            for (let i = 0; i < donnees.length; i++) {
                const r = donnees[i];
                if (!r.integration) continue;
                await p.locator(`${liste} .ressource__ouvrir[data-i="${i}"]`).click();
                const attendu = new URL(r.integration); attendu.searchParams.set('autoplay', 'true');
                ok(`navigateur : lecteur natif dans la carte « ${r.titre} »`,
                    await p.locator(`${liste} .ressource--ouverte iframe`).getAttribute('src') === attendu.href);
                const externe = p.locator(`${liste} .ressource--ouverte .video-externe`);
                await p.locator(`${liste} .ressource--ouverte .video-partager`).click();
                ok(`navigateur : ouvrir et partager le lien public de « ${r.titre} »`,
                    await externe.getAttribute('href') === r.lien
                    && await externe.getAttribute('target') === '_blank'
                    && await externe.getAttribute('rel') === 'noopener'
                    && await p.evaluate(lien => window.codeIntegrationCopie === lien, r.lien));
            }
        }
        await p.locator('.ressource__fermer').click();
        await lienMiniMoot.click();
        await p.locator('#filtres-mentions .filtre[data-type="article"]').click();
        ok('navigateur : filtrer une vidéo hors de la liste arrête aussi son lecteur',
            await p.locator('.ressource__video iframe').count() === 0);
        await p.locator('#filtres-mentions .filtre[data-type="tout"]').click();

        ok('navigateur : aucune erreur ni ressource manquante', !erreurs.length, erreurs.slice(0, 5).join(' | '));

        // Une future saisie en youtube.com doit aussi être corrigée au rendu et à la copie.
        const confidentialite = await navigateur.newPage();
        await confidentialite.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
                writeText: async code => { window.codeIntegrationCopie = code; }
            } });
        });
        await confidentialite.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());
        await confidentialite.route(/youtube(?:-nocookie)?\.com/, r => r.abort());
        await confidentialite.route('**/decouvrir/on-parle-de-nous.json', r => r.fulfill({
            contentType: 'application/json', body: JSON.stringify({ mentions: mentions.map(m => ({
                ...m, ...(m.integration?.includes('youtube-nocookie.com')
                    ? { integration: m.integration.replace('youtube-nocookie.com', 'youtube.com') } : {})
            })) })
        }));
        await confidentialite.goto(URL_PAGE, { waitUntil: 'networkidle' });
        const integrables = [...ressources, ...mentions].filter(r => r.integration);
        for (const video of mentions.filter(r => r.integration?.includes('youtube-nocookie.com'))) {
            await confidentialite.locator('#liste-mentions .ressource__ouvrir').filter({ hasText: video.titre }).click();
            const lecteur = new URL(await confidentialite.locator('.ressource--ouverte iframe').getAttribute('src'));
            await confidentialite.locator(`input[name="integration-video"][value="${integrables.indexOf(video)}"]`).check();
            await confidentialite.locator('#integrations .copier').click();
            const copie = await confidentialite.evaluate(() => {
                const zone = document.createElement('div'); zone.innerHTML = window.codeIntegrationCopie;
                return zone.querySelector('iframe').src;
            });
            ok(`contre-épreuve navigateur : lecteur et code YouTube sans cookie (« ${video.titre} »)`,
                lecteur.hostname === 'www.youtube-nocookie.com'
                && lecteur.searchParams.get('start') === new URL(video.integration).searchParams.get('start')
                && copie === video.integration);
        }
        await confidentialite.close();

        const anglais = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
        await anglais.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());
        await anglais.goto(`${URL_PAGE}?lang=en`, { waitUntil: 'networkidle' });
        ok('navigateur : le drapeau anglais traduit le bandeau, le titre et le pied',
            await anglais.locator('.bouton-langue .fi-gb').count() === 1
            && await anglais.locator('#titre-principal').textContent() === 'Interactive activities for your students, ready in minutes.'
            && await anglais.locator('.pied__presentation').textContent() === 'Discover Caramel');
        ok('navigateur : le catalogue dynamique suit lui aussi la langue choisie',
            await anglais.locator('#filtres-mentions .filtre[data-type="tout"]').textContent() === `All${mentions.length}`
            && /WATCH HERE/.test((await anglais.locator('#liste-mentions .ressource--video .ressource__type').first().textContent()).toUpperCase()));
        await anglais.close();

        const arabe = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
        await arabe.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());
        await arabe.goto(`${URL_PAGE}?lang=ar`, { waitUntil: 'networkidle' });
        ok('navigateur : l’arabe active son drapeau et le sens droite-à-gauche',
            await arabe.locator('.bouton-langue .fi-sa').count() === 1
            && await arabe.evaluate(() => document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl'));
        await arabe.close();

        const languesEntete = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];
        const entete = await navigateur.newPage();
        await entete.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());
        for (const langue of languesEntete) {
            await entete.goto(`${URL_PAGE}?lang=${langue}`, { waitUntil: 'networkidle' });
            for (const largeur of [320, 390, 760, 1282, 1905]) {
                await entete.setViewportSize({ width: largeur, height: 900 });
                ok(`navigateur : header sans chevauchement ni débordement (${langue}, ${largeur} px)`,
                    await entete.evaluate(() => {
                        const visible = e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 1;
                        const controles = [...document.querySelectorAll('.marque, .navigation-bouton, .navigation a, .barre__actions > a, .bouton-langue')]
                            .filter(e => visible(e) && !e.closest('.navigation') || e.closest('.navigation') && getComputedStyle(e.closest('.navigation')).display !== 'none')
                            .map(e => e.getBoundingClientRect()).sort((a, b) => a.left - b.left);
                        return document.documentElement.scrollWidth <= innerWidth
                            && controles.every((r, i) => r.left >= 0 && r.right <= innerWidth && (!i || r.left >= controles[i - 1].right - 1));
                    }));
            }
        }
        await entete.close();

        const accueilP = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
        await accueilP.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
        const couleurEtoile = await accueilP.locator('.footer-discover i').evaluate(el => getComputedStyle(el).color);
        const couleurAutreIcone = await accueilP.locator('.footer-version i').evaluate(el => getComputedStyle(el).color);
        ok('navigateur : étoile et autres icônes du pied ont exactement le même gris', couleurEtoile === couleurAutreIcone,
            `${couleurEtoile} / ${couleurAutreIcone}`);
        const regroupementPied = el => {
            const s = getComputedStyle(el);
            return [s.display, s.flexWrap, s.justifyContent, s.gap, s.padding].join('|');
        };
        ok('navigateur : le footer reprend le regroupement centré et les espacements de Caramel',
            await p.locator('.pied').evaluate(regroupementPied)
            === await accueilP.locator('.footer').evaluate(regroupementPied));
        const apparenceEtiquette = el => {
            const s = getComputedStyle(el);
            return [s.color, s.border, s.borderRadius, s.padding, s.fontSize, s.fontWeight, s.fontStyle].join('|');
        };
        ok('navigateur : la pastille H5P reprend exactement les styles de Caramel',
            await p.locator('.tuile .h5p-label').first().evaluate(apparenceEtiquette)
            === await accueilP.locator('.h5p-tile .h5p-label').first().evaluate(apparenceEtiquette));

        const mobile = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
        await mobile.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());
        await mobile.goto(URL_PAGE, { waitUntil: 'networkidle' });
        ok('navigateur : pas de défilement horizontal sur un téléphone',
            await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        ok('navigateur : les lignes du footer mobile et Découvrir Caramel restent centrées',
            await mobile.locator('.pied__presentation span').isVisible()
            && await mobile.locator('.pied').evaluate(el => {
                const lignes = [];
                for (const a of el.querySelectorAll('a')) {
                    const r = a.getBoundingClientRect();
                    let ligne = lignes.find(l => Math.abs(l.y - r.y) < 1);
                    if (!ligne) { ligne = { y: r.y, gauche: r.left, droite: r.right }; lignes.push(ligne); }
                    else { ligne.gauche = Math.min(ligne.gauche, r.left); ligne.droite = Math.max(ligne.droite, r.right); }
                }
                const r = el.getBoundingClientRect(), centre = r.left + r.width / 2;
                return lignes.every(l => Math.abs((l.gauche + l.droite) / 2 - centre) < 1);
            }));
        ok('navigateur : les liens mobiles restent repliés dans le header',
            !await mobile.locator('.navigation').isVisible());
        await mobile.locator('.navigation-bouton').click();
        ok('navigateur : Explorer ouvre les cinq liens et donne le focus au premier',
            await mobile.locator('.navigation').isVisible()
            && await mobile.locator('.navigation a').count() === 5
            && await mobile.locator('.navigation a').first().evaluate(e => e === document.activeElement));
        await mobile.locator('.navigation a').first().press('Escape');
        ok('navigateur : Échap replie le menu et rend le focus à Explorer',
            !await mobile.locator('.navigation').isVisible()
            && await mobile.locator('.navigation-bouton').evaluate(e => e === document.activeElement));
        await mobile.locator('.navigation-bouton').click();
        await mobile.locator('.navigation a[href="#former"]').click();
        ok('navigateur : choisir une section ferme le menu et conserve son ancre',
            !await mobile.locator('.navigation').isVisible() && mobile.url().endsWith('#former'));
        await mobile.locator('#liste-mentions .ressource__ouvrir').filter({ hasText: 'Caramel au MiniMoot de Brest' }).click();
        ok('navigateur : le MiniMoot intégré reste fluide sur téléphone',
            await mobile.locator('.ressource--ouverte iframe').evaluate(el => {
                const r = el.getBoundingClientRect();
                return r.width <= window.innerWidth && Math.abs(r.width / r.height - 16 / 9) < .02;
            }) && await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    } finally {
        await navigateur.close();
        serveur.kill();
    }
}

console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`page de présentation (/decouvrir/) : ${pass} OK / ${fail} échec(s)${NAVIGATEUR ? '' : ' — sans navigateur'}`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
