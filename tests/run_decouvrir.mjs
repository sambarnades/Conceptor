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
 *   - l'affiche d'une vidéo laisse place au lecteur Podeduc ;
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
const TYPES = ['video', 'tutoriel', 'presentation', 'article', 'communaute'];
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

// Les ressources locales citées par la page.
const page = lire('decouvrir/index.html');
const locales = [...page.matchAll(/(?:src|href)="([^"#:]+)"/g)].map(m => m[1]).filter(u => !u.startsWith('http') && u !== '../');
for (const u of new Set(locales)) {
    ok(`page : « ${u} » existe`, existsSync(resolve(root, 'decouvrir', u.split('?')[0])), u);
}

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
        const erreurs = [];
        p.on('pageerror', e => erreurs.push(`erreur de page : ${e.message}`));
        p.on('response', r => { if (r.status() >= 400) erreurs.push(`${r.status()} ${r.url()}`); });
        await p.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());       // la mesure d'audience, hors sujet ici
        await p.goto(URL_PAGE, { waitUntil: 'networkidle' });

        ok('navigateur : une carte par ressource', await p.locator('#liste-ressources .ressource').count() === ressources.length);
        const typesPresents = new Set(ressources.map(r => r.type)).size;
        ok('navigateur : « Tout » + un filtre par type présent', await p.locator('#filtres .filtre').count() === typesPresents + 1);
        ok('navigateur : un code d’intégration par vidéo intégrable',
            await p.locator('#integrations .copier').count() === ressources.filter(r => r.integration).length);
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
        const premiere = p.locator('.lecteur').first();
        const attendu = await premiere.getAttribute('data-integration');
        await premiere.locator('.affiche').click();
        const src = await premiere.locator('iframe').getAttribute('src').catch(() => null);
        ok('navigateur : l’affiche laisse place au lecteur Podeduc', !!src && src.startsWith(attendu), src);

        ok('navigateur : aucune erreur ni ressource manquante', !erreurs.length, erreurs.slice(0, 5).join(' | '));

        const mobile = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
        await mobile.route(/wa\.phm\.education\.gouv\.fr/, r => r.abort());
        await mobile.goto(URL_PAGE, { waitUntil: 'networkidle' });
        ok('navigateur : pas de défilement horizontal sur un téléphone',
            await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
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
