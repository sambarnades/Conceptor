/**
 * Banc des PARCOURS RÉELS : des scénarios produits de bout en bout par le vrai
 * pipeline (plan de l'IA, file de fabrication, assemblage), rejoués SANS appel
 * au modèle.
 *
 * Les autres bancs éprouvent la forme avec des contenus d'une ligne ; celui-ci
 * éprouve ce qu'un enseignant livre vraiment. Chaque scénario de
 * `tests/fixtures/parcours-reels/` (produit par `scripts/generer-parcours-reel.mjs`)
 * est réimporté comme un fichier `.json` de reprise, réassemblé en `.mbz`, puis
 * le cours est OUVERT : on lit le texte des activités tel que la plateforme
 * l'affichera — XML des modules, banque de questions, `content.json` de chaque
 * `.h5p`, pages d'un paquetage IMS — et l'on y cherche ce qu'un participant ne
 * doit jamais voir.
 *
 *   1. Le scénario se reprend : toutes les cartes ont un contenu, et chaque
 *      contenu passe la réparation de production.
 *   2. Tout s'assemble : aucune activité écartée, autant d'activités que de cartes.
 *   3. Rien de creux : chaque activité a un texte substantiel, et aucun champ,
 *      aucune cellule, aucun paragraphe n'est resté à « … ».
 *   4. Rien de l'atelier ne fuit : ni le jargon des prompts (« notions
 *      pivots », « MOT POUR MOT »), ni gras Markdown non converti (« ** »).
 *   5. Un registre : un public d'adultes n'est jamais tutoyé (le générateur
 *      inscrit le public dans la fixture, sous `banc`, que la reprise ignore).
 *
 * CONTRE-ÉPREUVE, à chaque passage : le premier scénario est rejoué avec cinq
 * défauts injetés (jargon, tutoiement, champ « … », question à trous
 * injouable, carte vide). Chacun DOIT être vu — sinon le vert ne prouve rien.
 *
 * Lancement : node tests/run_parcours_reels.mjs (serveur statique propre, port 8163).
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync } from 'fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8163;
const DOSSIER = join(ROOT, 'tests/fixtures/parcours-reels');

const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stop);

async function waitForServer(ms = 15000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok) return true; }
        catch { /* pas prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) { pass++; console.log(`  ✓ ${nom}`); }
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); console.log(`  ✗ ${nom}`); }
};

/** Le tutoiement, en français : pronoms et possessifs de la 2e personne du singulier. */
const TUTOIEMENT = /(?<![\p{L}'’])(tu|toi|ton|tes|te)(?![\p{L}'’])/giu;
/**
 * Le jargon des prompts, qui n'a rien à faire sous les yeux d'un participant.
 * « mot pour mot » est du français courant (« un plan à ne pas suivre mot pour
 * mot ») : seule sa forme CRIÉE vient du prompt.
 */
const JARGON = /[Nn]otions?\s+[Pp]ivots?|NOTIONS? PIVOTS?|MOT POUR MOT|VOCABULAIRE DU PARCOURS|\((?:version|variante) (?:longue|courte|moyenne)\)/;

/**
 * Une question NOTÉE sur la pratique de celui qui répond (« lesquels de ces outils
 * utilisez-vous régulièrement ? ») : une habitude n'a pas de bonne réponse, le
 * stagiaire est noté faux sur sa propre pratique. Constaté sur une formation
 * Pix+Édu réelle (28 sept. 2026, D81). Une situation à résoudre (« Que faites-vous
 * si… ? ») a, elle, une bonne réponse : elle passe.
 */
const PRATIQUE_NOTEE = /\blesquel(?:le)?s\s+(?:utilisez|appliquez|pratiquez|employez)-vous\b|\b(?:utilisez|appliquez|pratiquez|employez)-vous\b[^.?!]{0,80}\b(?:régulièrement|habituellement|actuellement|d['’]habitude)\b|\blesquel(?:le)?s\s+(?:utilises|appliques|pratiques|emploies)-tu\b/i;

/** Longueur minimale du texte lisible d'une activité, selon ce qu'elle est. */
const PLANCHER = {
    h5pactivity: 300, quiz: 300, page: 800, book: 800, imscp: 800, lesson: 600, assign: 300,
    forum: 150, choice: 120, url: 80, publication: 150, questionnaire: 200, feedback: 200,
    workshop: 200, board: 100, wiki: 100, glossary: 100, collabora: 100, etherpadlite: 80,
    bigbluebuttonbn: 80, data: 120, choicegroup: 80,
};

/**
 * Ouvre le cours d'un scénario, dans la page : reprise, réparation,
 * assemblage, puis lecture de chaque activité telle que la plateforme l'affichera.
 */
function ouvrir(page, texte) {
    return page.evaluate(async (texte) => {
        const { depuisScenario } = await import('/js/parcours/scenario-io.js');
        const { reparer } = await import('/js/parcours/parcours-runner.js');
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { loadMoodleLibs } = await import('/js/core/lib-loader.js');
        const TS = 1759000000;

        // 1. Le scénario se reprend, comme un fichier de reprise déposé à l'écran de cadrage.
        const repris = depuisScenario(texte);
        const cartes = repris.plan.etapes.flatMap(e => e.cartes);
        const reparations = [];
        for (const c of cartes) {
            try { if (c.contenu) await reparer(structuredClone(c.contenu), c.module); reparations.push(null); }
            catch (e) { reparations.push(`${c.titre} (${c.module}) : ${e.message}`); }
        }

        // 2. L'assemblage.
        const paquet = await assemblerParcours(repris.plan, { timestamp: TS, platformId: repris.platform });

        // 3. Le cours ouvert.
        await loadMoodleLibs();
        const tar = window.fflate.gunzipSync(paquet.bytes);
        const dec = new TextDecoder();
        const octets = {};
        for (let off = 0; off + 512 <= tar.length;) {
            const nom = dec.decode(tar.subarray(off, off + 100)).replace(/\0.*$/s, '');
            if (!nom) break;
            const prefixe = dec.decode(tar.subarray(off + 345, off + 500)).replace(/\0.*$/s, '');
            const taille = parseInt(dec.decode(tar.subarray(off + 124, off + 136)).replace(/\0.*$/s, '').trim() || '0', 8);
            octets[prefixe ? `${prefixe}/${nom}` : nom] = tar.slice(off + 512, off + 512 + taille);
            off += 512 + Math.ceil(taille / 512) * 512;
        }
        const lire = chemin => dec.decode(octets[chemin] || new Uint8Array());
        const html = h => new DOMParser().parseFromString(String(h), 'text/html').body;
        // Une case laissée à remplir par le modèle : rien qu'une ellipse.
        const SUSPENDU = /^[\s*_,]*(?:…|\.{3})[\s*_.,…]*$/;
        /** Les éléments d'un fragment HTML réduits à une ellipse (champ, paragraphe, cellule…). */
        const suspendus = fragment => {
            const corps = html(fragment);
            const feuilles = [corps, ...corps.querySelectorAll('*')].filter(n => !n.children.length);
            return feuilles.map(n => n.textContent).filter(t => SUSPENDU.test(t) && t.trim());
        };
        /** Les champs d'un XML de module : chaque feuille, décodée une fois (XML), puis lue en HTML. */
        const feuillesXml = xml => [...new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('*')]
            .filter(n => !n.children.length).map(n => n.textContent.replace(/\$@NULL@\$/g, ''));
        const fichiersXml = new DOMParser().parseFromString(lire('files.xml'), 'application/xml');
        const fichiersDe = ctx => [...fichiersXml.querySelectorAll('file')]
            .filter(f => f.querySelector('contextid').textContent === String(ctx))
            .map(f => ({ zone: f.querySelector('filearea').textContent, nom: f.querySelector('filename').textContent,
                hash: f.querySelector('contenthash').textContent }));

        const activites = [];
        for (const a of paquet.activites) {
            const dir = `activities/${a.moduleName}_${a.moduleId}`;
            const xml = lire(`${dir}/${a.moduleName}.xml`);
            const ctx = (xml.match(/contextid="(\d+)"/) || [])[1];
            const visible = /<visible>1<\/visible>/.test(lire(`${dir}/module.xml`));
            // Les champs lisibles : ceux du module, puis — selon le module — ceux
            // de la banque de questions, du `.h5p`, ou des pages du paquetage.
            const champs = feuillesXml(xml);
            if (a.moduleName === 'quiz') champs.push(...feuillesXml(lire('questions.xml')));
            for (const f of fichiersDe(ctx)) {
                const donnees = octets[`files/${f.hash.slice(0, 2)}/${f.hash}`];
                if (!donnees || f.nom === '.') continue;
                if (f.nom.endsWith('.h5p')) {
                    (function parcourir(v) {
                        if (typeof v === 'string') {
                            if (!/^H5P\.\w+ \d+\.\d+$|^[0-9a-f-]{36}$|^(?:images|audios|videos)\//.test(v)) champs.push(v);
                        } else if (v && typeof v === 'object') Object.values(v).forEach(parcourir);
                    })(JSON.parse(dec.decode(window.fflate.unzipSync(donnees)['content/content.json'])));
                } else if (f.zone === 'content' && f.nom.endsWith('.html')) {
                    champs.push(dec.decode(donnees));
                }
            }
            activites.push({
                titre: a.title, moduleName: a.moduleName, visible,
                lisible: champs.map(c => html(c).textContent).join(' ').replace(/\s+/g, ' ').trim(),
                suspendus: champs.flatMap(suspendus),
            });
        }
        return {
            titre: repris.plan.titre, platform: repris.platform,
            cartes: cartes.map(c => ({ titre: c.titre, module: c.module, contenu: !!c.contenu })),
            reparations, exclues: paquet.exclues, activites,
        };
    }, texte);
}

/**
 * Les constats sur un cours ouvert. `cle` regroupe les contrôles, pour que la
 * contre-épreuve sache lequel devait voir quoi.
 */
function constater(r, banc) {
    const liste = [];
    const constat = (cle, nom, cond, detail = '') => liste.push({ cle, nom, ok: !!cond, detail });
    constat('contenu', 'toutes les cartes ont un contenu', r.cartes.every(c => c.contenu), r.cartes.filter(c => !c.contenu).map(c => c.titre).join(' · '));
    constat('reparation', 'chaque contenu passe la réparation de production', r.reparations.every(x => !x), r.reparations.filter(Boolean).join(' · '));
    constat('assemblage', 'aucune activité écartée à l’assemblage', !r.exclues.length, JSON.stringify(r.exclues));
    const activites = r.activites.filter(a => a.visible && a.moduleName !== 'label');
    constat('contenu', `autant d’activités que de cartes (${r.cartes.length})`, activites.length === r.cartes.length, `${activites.length}`);
    for (const a of activites) {
        const etiquette = `« ${a.titre} » (${a.moduleName})`;
        const plancher = PLANCHER[a.moduleName] ?? 100;
        constat('creux', `${etiquette} : texte substantiel (≥ ${plancher} car.)`, a.lisible.length >= plancher, `${a.lisible.length} car. : ${a.lisible.slice(0, 160)}`);
        constat('suspendu', `${etiquette} : aucun champ, paragraphe ni cellule laissé à « … »`, !a.suspendus.length, a.suspendus.slice(0, 5).map(s => JSON.stringify(s)).join(' · '));
        constat('jargon', `${etiquette} : pas de jargon des prompts`, !JARGON.test(a.lisible), (a.lisible.match(new RegExp(`.{0,60}(?:${JARGON.source}).{0,40}`)) || [''])[0]);
        constat('markdown', `${etiquette} : pas de gras Markdown non converti`, !/\*\*[^*\s][^*]*\*\*/.test(a.lisible), (a.lisible.match(/.{0,40}\*\*[^*]+\*\*.{0,20}/) || [''])[0]);
        if (a.moduleName === 'quiz') constat('pratique', `${etiquette} : aucune question notée sur la pratique de celui qui répond`, !PRATIQUE_NOTEE.test(a.lisible), (a.lisible.match(new RegExp(`.{0,60}(?:${PRATIQUE_NOTEE.source}).{0,40}`, 'i')) || [''])[0]);
    }
    if (banc.adultes) {
        const tutoyees = activites.filter(a => (a.lisible.match(TUTOIEMENT) || []).length)
            .map(a => `${a.titre} : ${[...new Set(a.lisible.match(TUTOIEMENT))].join(', ')}`);
        constat('registre', `public d’adultes (${banc.public}) : jamais tutoyé`, !tutoyees.length, tutoyees.join(' · '));
    }
    return liste;
}

/** Six défauts injectés dans un scénario : ce que le banc doit voir. */
function abimer(scenario) {
    const s = structuredClone(scenario);
    s.banc = { ...s.banc, adultes: true };
    const cartes = s.plan.etapes.flatMap(e => e.cartes);
    const une = pred => cartes.find(pred);
    const moodle = une(c => c.contenu && (c.module.startsWith('parcours_') || ['Devoir', 'Page', 'Livre'].includes(c.module)));
    moodle.contenu.intro = `${moodle.contenu.intro || ''} Employez les notions pivots MOT POUR MOT. Tu dois lire ton support.`;
    const test = une(c => c.module === 'test_elea');
    if (test) {
        test.contenu.questions[0].content.feedback = '…';
        test.contenu.questions[1].content.questiontext = 'Parmi ces outils, lesquels utilisez-vous régulièrement en classe ?';
        test.contenu.questions.push({ type: 'cloze', content: { questiontext: 'Classez : {1:NUMERICAL:=Réponse attendue:0}' } });
    }
    const vide = cartes.filter(c => c !== moodle && c !== test).at(-1);
    vide.contenu = null;
    return { scenario: s, attendus: test ? ['jargon', 'registre', 'suspendu', 'reparation', 'contenu', 'pratique'] : ['jargon', 'registre', 'contenu'] };
}

const scenarios = readdirSync(DOSSIER).filter(f => f.endsWith('.json')).sort();

let exitCode = 0;
try {
    if (!scenarios.length) throw new Error(`aucun scénario dans ${DOSSIER}`);
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0,
        null, { timeout: 60000, polling: 200 });

    for (const fichier of scenarios) {
        const texte = readFileSync(join(DOSSIER, fichier), 'utf8');
        const r = await ouvrir(page, texte);
        console.log(`\n── ${fichier} — ${r.titre} (${r.platform}) ──`);
        for (const c of constater(r, JSON.parse(texte).banc || {})) ok(c.nom, c.ok, c.detail);
    }

    // La contre-épreuve : le cours d'un test, abîmé exprès, doit virer au rouge.
    const temoin = scenarios.map(f => JSON.parse(readFileSync(join(DOSSIER, f), 'utf8')))
        .find(s => s.plan.etapes.some(e => e.cartes.some(c => c.module === 'test_elea'))) || JSON.parse(readFileSync(join(DOSSIER, scenarios[0]), 'utf8'));
    const { scenario, attendus } = abimer(temoin);
    const vus = constater(await ouvrir(page, JSON.stringify(scenario)), scenario.banc).filter(c => !c.ok).map(c => c.cle);
    console.log(`\n── Contre-épreuve : « ${temoin.plan.titre} », abîmé exprès ──`);
    for (const cle of attendus) ok(`le défaut « ${cle} » injecté est vu`, vus.includes(cle), `constats en échec : ${[...new Set(vus)].join(', ') || 'aucun'}`);

    ok('aucune erreur de page', pageErrors.length === 0, pageErrors.join(' | '));
    await browser.close();
} catch (e) {
    console.error(e);
    exitCode = 1;
} finally {
    stop();
}

console.log('\n========================================');
console.log(`parcours — parcours réels : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(exitCode || (fail ? 1 : 0));
