/**
 * run_parcours_aiguillage.mjs — Les parcours à CHEMINS : la mécanique, prouvée (D90-D100).
 *
 * Un parcours à chemins ne pardonne pas : une condition mal écrite ne se voit pas
 * à l'import, elle laisse un élève devant une page vide, ou lui ouvre le chemin
 * d'un autre. Ce banc répond donc, sur le VRAI pipeline (processeurs, empaquetage
 * `.h5p`, constructeur de cours, passes d'après l'assemblage), à une seule
 * question : **chaque élève, quel que soit son score, suit-il un chemin et un seul,
 * jusqu'à la fin du parcours ?**
 *
 * Méthode :
 *   1. Chromium assemble trois parcours (test H5P à trois chemins, Test Moodle à
 *      deux chemins, parcours sans chemin) et rend les XML du `.mbz` PRODUIT ;
 *   2. Node relit ce cours comme Moodle : sections, restrictions, modules,
 *      éléments de note, puis fait passer un élève par CHAQUE score possible, avec
 *      les règles relues dans le code de Moodle 5.1 (`aiguillage.js`) : il fait
 *      ce qui est ouvert, jusqu'à ce que plus rien ne s'ouvre ;
 *   3. trois contre-épreuves abîment le cours (un trou dans les seuils, un
 *      identifiant entre guillemets, un chemin qui ne s'achève plus) et exigent
 *      que le banc le voie.
 *
 * Lancement :  node tests/run_parcours_aiguillage.mjs
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as A from '../js/parcours/aiguillage.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8131;

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

/* ------------------------------------------------------------------ *
 *  Relire le cours produit, comme Moodle
 * ------------------------------------------------------------------ */

const balise = (xml, nom) => { const m = xml.match(new RegExp(`<${nom}>([\\s\\S]*?)</${nom}>`)); return m ? m[1] : null; };
// Les XML de Caramel écrivent les caractères accentués en entités numériques
// (`&#233;`) : on les décode comme le reste.
const deXml = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&');

function lireCours(fichiers) {
    const sections = [];
    const modules = new Map();
    const notes = new Map();
    for (const [chemin, xml] of Object.entries(fichiers)) {
        let m = chemin.match(/^sections\/section_(\d+)\/section\.xml$/);
        if (m) {
            const brut = balise(xml, 'availabilityjson');
            sections.push({
                id: Number(m[1]),
                numero: Number(balise(xml, 'number')),
                nom: deXml(balise(xml, 'name') || ''),
                sequence: (balise(xml, 'sequence') || '').split(',').filter(Boolean).map(Number),
                visible: balise(xml, 'visible') === '1',
                dispoTexte: brut === '$@NULL@$' ? null : deXml(brut),
                dispo: brut === '$@NULL@$' ? null : JSON.parse(deXml(brut)),
            });
            continue;
        }
        m = chemin.match(/^activities\/([a-z0-9]+)_(\d+)\/module\.xml$/);
        if (m) {
            modules.set(Number(m[2]), {
                cm: Number(m[2]), module: m[1],
                visible: balise(xml, 'visible') === '1',
                completion: Number(balise(xml, 'completion')),
                vue: balise(xml, 'completionview') === '1',
                note: balise(xml, 'completiongradeitemnumber') === '0',
                showdescription: balise(xml, 'showdescription') === '1',
                dispo: balise(xml, 'availability'),
            });
            continue;
        }
        m = chemin.match(/^activities\/([a-z0-9]+)_(\d+)\/grades\.xml$/);
        if (m) {
            const g = xml.match(/<grade_item id="(\d+)">/);
            if (g) notes.set(Number(m[2]), Number(g[1]));
        }
    }
    sections.sort((a, b) => a.numero - b.numero);
    return { sections, modules, notes };
}

/**
 * Un élève traverse le cours avec `k` bonnes réponses sur `n` au test : il fait
 * tout ce qui lui est ouvert, jusqu'à ce que plus rien ne s'ouvre.
 */
function traverser(cours, test, k) {
    const eleve = { notes: {}, acheves: new Set() };
    const etat = s => A.visibilitePourEleve(s.dispo, eleve);
    const avant = cours.sections.map(s => ({ numero: s.numero, vis: etat(s) }));
    const vues = new Set();
    for (let tour = 0; tour < 60; tour++) {
        let nouveau = false;
        for (const s of cours.sections) {
            if (!s.visible || etat(s) !== 'ouverte') continue;
            vues.add(s.numero);
            for (const cm of s.sequence) {
                const mod = cours.modules.get(cm);
                if (!mod || !mod.visible || mod.completion === 0 || eleve.acheves.has(cm)) continue;
                if (cm === test.cm) eleve.notes[test.noteId] = A.noteMoodle(k, test.n, test.noteMax);
                eleve.acheves.add(cm);
                nouveau = true;
            }
        }
        if (!nouveau) break;
    }
    return { avant, vues, finale: cours.sections.map(s => ({ numero: s.numero, vis: etat(s) })) };
}

/**
 * Tous les scores, du premier au dernier : un chemin et un seul, le bon, puis
 * la fin du parcours. Rend la liste des anomalies (vide si tout va bien).
 */
function verifierTousLesScores(cours, { test, chemins, fin }) {
    const anomalies = [];
    for (let k = 0; k <= test.n; k++) {
        const r = traverser(cours, test, k);
        const cheminsVus = chemins.filter(c => r.vues.has(c.numero));
        const attendu = chemins.find(c => k >= c.de && k <= c.a);
        if (cheminsVus.length !== 1) anomalies.push(`score ${k} : ${cheminsVus.length} chemin(s) ouvert(s)`);
        else if (cheminsVus[0] !== attendu) anomalies.push(`score ${k} : chemin ${cheminsVus[0].numero} au lieu de ${attendu && attendu.numero}`);
        if (fin && !r.vues.has(fin)) anomalies.push(`score ${k} : la fin du parcours ne s'ouvre jamais`);
    }
    return anomalies;
}

/* ------------------------------------------------------------------ *
 *  Le banc
 * ------------------------------------------------------------------ */

let exitCode = 0;
try {
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0,
        null, { timeout: 60000, polling: 200 });

    const r = await page.evaluate(async () => {
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { loadMoodleLibs, loadJSZip } = await import('/js/core/lib-loader.js');
        await Promise.all([loadMoodleLibs(), loadJSZip()]);
        const ex = async n => (await fetch(`/assets/data/examples/${n}.json`)).json();
        const [qcm, page0, dtw, fib, essay, dialog, mtw, test, vf, frise] = await Promise.all(
            ['quiz_qcm_1', 'page_1', 'drag_the_words_1', 'fill_in_the_blanks_1', 'essay_1', 'dialog_cards_1',
             'mark_the_words_1', 'test_1', 'quiz_vraifaux_1', 'timeline_1'].map(ex));
        const carte = (id, module, contenu, duree = 8, palier = 'entrainement') => ({
            id, titre: `Activité ${id}`, objectif: 'S’entraîner', consigne: 'Faire l’exercice.',
            module, palier, duree, verrouillee: false, contenu: structuredClone(contenu),
        });
        const base = { objectifGeneral: 'Comprendre', notionsPivots: [], personnalise: false,
            carte: { actif: false, theme: 'paysage' } };

        // A — test H5P (Quiz QCM, 5 questions), trois chemins, ouverture progressive.
        const planH5P = { ...base, titre: 'Des débuts difficiles', origine: 'differenciation',
            introduction: 'Bienvenue dans ce parcours.', conclusion: 'Pour la suite, lis le chapitre 5.',
            progression: { actif: true },
            etapes: [
                { id: 'e1', titre: 'Se positionner', objectif: 'Faire le point', introduction: 'Réponds seul.',
                  cartes: [carte('c1', 'Page', page0, 6, 'decouverte'), carte('c2', 'QuizSetQCM', qcm, 12)] },
                { id: 'e2', titre: 'Pas à pas', objectif: 'Revoir', introduction: 'Avec des exemples.', chemin: { depuis: 0 },
                  cartes: [carte('c3', 'Page', page0), carte('c4', 'DragTheWords', dtw), carte('c5', 'DialogCards', dialog)] },
                { id: 'e3', titre: 'S’entraîner', objectif: 'Appliquer', introduction: 'À toi de jouer.', chemin: { depuis: 40 },
                  cartes: [carte('c6', 'FillInTheBlanks', fib), carte('c7', 'QuizSetQCM', qcm), carte('c8', 'MarkTheWords', mtw)] },
                { id: 'e4', titre: 'Défis', objectif: 'Approfondir', introduction: 'Des défis.', chemin: { depuis: 75 },
                  cartes: [carte('c9', 'FillInTheBlanks', fib), carte('c10', 'Essay', essay), carte('c11', 'QuizSetVF', vf)] },
                { id: 'e5', titre: 'Faire le point', objectif: 'Réinvestir', introduction: 'Tous ensemble.',
                  cartes: [carte('c12', 'Essay', essay, 12, 'transfert')] },
            ] };

        // B — Test Moodle (10 questions), deux chemins, SANS ouverture progressive,
        // une étape commune APRÈS le bilan, et une Frise (jamais notée) dans un chemin.
        const planTest = { ...base, titre: 'Point de contrôle', origine: 'point_controle',
            introduction: '', conclusion: '', progression: { actif: false },
            etapes: [
                { id: 'f1', titre: 'Découvrir', objectif: 'Découvrir', cartes: [carte('d1', 'Page', page0, 8, 'decouverte')] },
                { id: 'f2', titre: 'Point de contrôle', objectif: 'Vérifier', cartes: [carte('d2', 'test_elea', test, 15)] },
                { id: 'f3', titre: 'Revoir', objectif: 'Revoir', chemin: { depuis: 0 },
                  cartes: [carte('d3', 'Timeline', frise), carte('d4', 'DragTheWords', dtw)] },
                { id: 'f4', titre: 'Aller plus loin', objectif: 'Approfondir', chemin: { depuis: 60 },
                  cartes: [carte('d5', 'Essay', essay), carte('d6', 'FillInTheBlanks', fib)] },
                { id: 'f5', titre: 'Réinvestir', objectif: 'Réinvestir', cartes: [carte('d7', 'QuizSetVF', vf)] },
                { id: 'f6', titre: 'Prolonger', objectif: 'Prolonger', cartes: [carte('d8', 'Page', page0)] },
            ] };

        // C — un parcours SANS chemin : la fin du parcours et les durées valent aussi.
        const planLineaire = { ...base, titre: 'Réviser', origine: 'revision', introduction: 'Bonjour.',
            conclusion: 'Bravo.', progression: { actif: true },
            etapes: [
                { id: 'g1', titre: 'Se tester', objectif: 'Se tester', cartes: [carte('h1', 'QuizSetVF', vf)] },
                { id: 'g2', titre: 'Revoir', objectif: 'Revoir', cartes: [carte('h2', 'Page', page0), carte('h3', 'DialogCards', dialog)] },
            ] };

        const TS = 1759000000;
        const lire = async (plan, platformId = 'elea') => {
            const paquet = await assemblerParcours(plan, { timestamp: TS, platformId });
            const tar = window.fflate.gunzipSync(paquet.bytes);
            const textes = {};
            for (let o = 0; o + 512 <= tar.length;) {
                const nom = new TextDecoder().decode(tar.subarray(o, o + 100)).replace(/\0.*$/, '');
                if (!nom) break;
                const taille = parseInt(new TextDecoder().decode(tar.subarray(o + 124, o + 136)).replace(/[^0-7]/g, ''), 8) || 0;
                if (/\.xml$/.test(nom)) textes[nom] = new TextDecoder().decode(tar.subarray(o + 512, o + 512 + taille));
                o += 512 + Math.ceil(taille / 512) * 512;
            }
            return { textes, chemins: paquet.chemins, fin: paquet.fin, durees: paquet.durees, tests: paquet.tests,
                activites: paquet.activites.map(a => ({ moduleId: a.moduleId, moduleName: a.moduleName, title: a.title })) };
        };

        // Un chemin sans activité prête : refusé, jamais livré à moitié.
        let incomplet = null;
        try {
            const p = structuredClone(planH5P);
            p.etapes[2].cartes.forEach(c => { c.contenu = null; });
            await assemblerParcours(p, { timestamp: TS, platformId: 'elea' });
        } catch (e) { incomplet = { message: e.message, manques: e.manques }; }

        // Le test qui aiguille garde ses réglages à l'ASSEMBLAGE, quoi qu'en ait fait
        // l'éditeur : un point par question, toutes posées, pas de reprise (D93).
        const { activiteDepuisCarte } = await import('/js/parcours/parcours-builder.js');
        const piege = structuredClone(qcm);
        piege.poolSize = 2;
        piege.endGame = { ...(piege.endGame || {}), showRetryButton: true };
        piege.questions.forEach(q => { q.params.behaviour = { ...(q.params.behaviour || {}), singlePoint: false }; });
        const contenuDe = async a => JSON.parse(await (await window.JSZip.loadAsync(a.h5pBytes)).file('content/content.json').async('string'));
        const reglages = c => ({ pool: c.poolSize ?? null, reprise: c.endGame?.showRetryButton ?? null,
            unPoint: c.questions.map(q => q.params?.behaviour?.singlePoint ?? null) });
        const testRegle = reglages(await contenuDe(await activiteDepuisCarte(carte('x1', 'QuizSetQCM', piege), { aiguille: true })));
        const testLibre = reglages(await contenuDe(await activiteDepuisCarte(carte('x2', 'QuizSetQCM', piege))));

        // Le vocabulaire de la plateforme (D105) : le même parcours, sur Magistère et
        // sur Moodle, avec un choix de groupe (Magistère) pour la liste « À faire ».
        const { construireFiche } = await import('/js/parcours/fiche-sequence.js');
        const { construirePromptPlan, construirePromptModuleParcours } = await import('/js/parcours/scenario-prompt.js');
        const { cleSelonPlateforme } = await import('/js/parcours/vocabulaire.js');
        const avecGroupe = structuredClone(planH5P);
        avecGroupe.etapes[0].cartes.unshift({ ...carte('g0', 'parcours_choix_groupe', null, 2, 'decouverte'),
            contenu: { title: 'Les groupes', intro: 'Choisissez votre groupe de travail.' } });
        const texteCours = paquet => Object.values(paquet.textes).map(x => deXmlPage(deXmlPage(x))).join('\n');
        // Le cours encode ses accents en entités numériques (« &#233; ») : on les rend.
        const deXmlPage = x => String(x).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0*39;/g, "'")
            .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
        const brouillonDe = platform => ({ platform, format: 'distanciel', ampleur: 'courte', trame: 'libre', structure: 'lineaire', chemins: 2,
            contexte: { qui: 'un formateur', quoi: 'les accords', niveau: 'adultes', corpus: '' }, plan: structuredClone(planLineaire) });
        const vocabulaire = {};
        for (const platform of ['elea', 'magistere', 'moodle']) {
            const cours = texteCours(await lire(platform === 'magistere' ? avecGroupe : planH5P, platform));
            const fiche = construireFiche(planH5P, { platformId: platform });
            vocabulaire[platform] = {
                prof: (cours.match(/Visible par vous seul\.[^<]*/g) || []),
                aFaire: (cours.match(/Cette liste est cachée[^<]*/g) || []),
                fiche: [...fiche.meta, ...fiche.sections.flatMap(x => [x.titre, ...(x.lignes || [])])].join(' | '),
                promptPlan: construirePromptPlan(brouillonDe(platform)).prompt,
                promptModule: construirePromptModuleParcours(brouillonDe(platform), { id: 'm', titre: 'Le forum', objectif: 'Échanger',
                    consigne: 'Discuter', module: 'parcours_forum', palier: 'transfert', duree: 10 }).prompt,
            };
        }
        vocabulaire.cles = {
            moodle: cleSelonPlateforme('parcours_structure_titre', 'moodle'),
            magistere: cleSelonPlateforme('parcours_structure_titre', 'magistere'),
            elea: cleSelonPlateforme('parcours_structure_titre', 'elea'),
            sansVariante: cleSelonPlateforme('parcours_fin_titre', 'moodle'),
            formateurMoodle: cleSelonPlateforme('parcours_eleve_enseignant', 'moodle'),
        };

        return { h5p: await lire(planH5P), test: await lire(planTest), lineaire: await lire(planLineaire), incomplet, testRegle, testLibre, vocabulaire };
    });

    // ─── Le test qui oriente : une question = un point ──────────────────────
    console.log('\n── Le test qui oriente garde ses réglages (D93) ──');
    ok('à l’assemblage : un point par question, toutes posées, sans « Recommencer »',
        r.testRegle.pool === null && r.testRegle.reprise === false
        && r.testRegle.unPoint.length > 0 && r.testRegle.unPoint.every(v => v === true), JSON.stringify(r.testRegle));
    ok('une activité qui n’oriente pas garde les réglages de son auteur',
        r.testLibre.pool === 2 && r.testLibre.reprise === true && r.testLibre.unPoint.every(v => v === false), JSON.stringify(r.testLibre));
    ok('le Quiz mixte n’oriente pas : ses questions ne pèsent pas le même poids',
        !A.MODULES_AIGUILLEURS.has('QuizSet') && ['QuizSetQCM', 'QuizSetVF', 'test_elea'].every(m => A.MODULES_AIGUILLEURS.has(m)));

    // ─── A. Test H5P, trois chemins ─────────────────────────────────────────
    console.log('\n── A. Test H5P à trois chemins (5 questions, ouverture progressive) ──');
    const coursA = lireCours(r.h5p.textes);
    const [tA] = r.h5p.tests;
    ok('trois chemins posés, fin posée', r.h5p.chemins === 3 && r.h5p.fin === true, JSON.stringify({ c: r.h5p.chemins, f: r.h5p.fin }));
    ok('le test aiguille depuis son élément de note écrit', tA && tA.noteId === coursA.notes.get(tA.moduleId), JSON.stringify(tA));
    ok('le test H5P est noté sur la PREMIÈRE tentative (grademethod 4)',
        /<grademethod>4<\/grademethod>/.test(r.h5p.textes[`activities/h5pactivity_${tA.moduleId}/h5pactivity.xml`] || ''));
    const autres = r.h5p.activites.filter(a => a.moduleName === 'h5pactivity' && a.moduleId !== tA.moduleId);
    ok('les autres H5P gardent la meilleure tentative', autres.every(a => /<grademethod>1<\/grademethod>/.test(r.h5p.textes[`activities/h5pactivity_${a.moduleId}/h5pactivity.xml`] || '')));
    const toutes = coursA.sections.filter(s => s.dispo);
    ok('toute condition écrite passe le contrôle de forme de Moodle', toutes.every(s => !A.verifierCondition(s.dispo).length),
        toutes.map(s => `${s.numero}: ${A.verifierCondition(s.dispo).join(', ')}`).join(' | '));
    ok('aucune condition n’a d’identifiant entre guillemets', toutes.every(s => !/"(id|cm)":"/.test(s.dispoTexte)));
    const cheminsA = coursA.sections.filter(s => s.dispo && s.dispo.c.some(c => c.type === 'grade'));
    const bornesA = A.bornesEnReponses([40, 75], tA.n);
    const plagesA = A.plagesEnReponses(bornesA, tA.n);
    ok('trois sections-chemins, masquées entièrement aux autres', cheminsA.length === 3 && cheminsA.every(s => s.dispo.showc[0] === false));
    ok('les seuils tombent à mi-point entre deux scores',
        JSON.stringify(cheminsA.map(s => [s.dispo.c[0].min ?? null, s.dispo.c[0].max ?? null]))
            === JSON.stringify([[null, A.seuilMoodle(bornesA[0], tA.n)], [A.seuilMoodle(bornesA[0], tA.n), A.seuilMoodle(bornesA[1], tA.n)], [A.seuilMoodle(bornesA[1], tA.n), null]]),
        JSON.stringify(cheminsA.map(s => s.dispo.c[0])));
    const communeA = coursA.sections.find(s => s.dispo && s.dispo.op === '|');
    ok('l’étape commune s’ouvre au bout de N’IMPORTE QUEL chemin, masquée jusque-là',
        communeA && communeA.dispo.show === false && communeA.dispo.c.length === 3);
    const finA = coursA.sections.at(-1);
    ok('la dernière section est la fin du parcours, masquée jusqu’au bout',
        finA.dispo && finA.dispo.op === '&' && finA.dispo.showc.every(v => v === false));
    const profs = cheminsA.map(s => s.sequence.map(cm => coursA.modules.get(cm)).find(m => m.module === 'label'));
    ok('chaque chemin s’ouvre par une étiquette que seul l’enseignant voit',
        profs.every(m => m && !m.visible));
    const etiquettesProf = Object.entries(r.h5p.textes).filter(([p]) => /label_\d+\/label\.xml$/.test(p))
        .map(([p, x]) => [p, deXml(deXml(x))]).filter(([, x]) => /Visible par vous seul/.test(x));
    ok('elle dit la plage de chaque chemin, en bonnes réponses', etiquettesProf.length === 3
        && plagesA.every(([de, a]) => etiquettesProf.some(([, x]) => x.includes(de === a ? `${de} sur ${tA.n}` : `de ${de} à ${a} sur ${tA.n}`))));
    const accueilA = Object.values(r.h5p.textes).map(x => deXml(deXml(x))).find(x => /Bienvenue dans ce parcours/.test(x) && /<label /.test(x));
    // 6 + 12 min de tronc commun, trois chemins de 24 min, 12 min de bilan.
    ok('l’accueil dit la durée d’un élève (chemins de même durée : une seule valeur)', Boolean(accueilA)
        && /<p>Durée estimée du parcours : 54 min<\/p>/.test(accueilA), (accueilA || '').replace(/\s+/g, ' ').slice(0, 400));
    const intros = Object.entries(r.h5p.textes).filter(([p]) => /activities\/(h5pactivity|page)_\d+\/(h5pactivity|page)\.xml$/.test(p));
    ok('chaque activité porte sa durée en tête de sa description', intros.length === 13 - 1
        && intros.every(([, x]) => /^<p>Durée estimée : \d+ min<\/p>/.test(deXml(deXml(balise(x, 'intro') || '')))),
        `${intros.length} activités : ${intros.map(([, x]) => deXml(deXml(balise(x, 'intro') || '')).slice(0, 40)).join(' | ')}`);
    ok('et la description s’affiche dans la page du cours', [...coursA.modules.values()]
        .filter(m => m.module !== 'label').every(m => m.showdescription));
    const cartesDialogue = [...coursA.modules.values()].filter(m => m.module === 'h5pactivity' && m.vue);
    ok('les Cartes de dialogue (jamais notées) s’achèvent à la consultation (D100)', cartesDialogue.length === 1 && !cartesDialogue[0].note);
    ok('aucune Carte de progression dans un parcours à chemins', ![...coursA.modules.values()].some(m => m.module === 'mapmodules'));
    const testA = { cm: tA.moduleId, noteId: tA.noteId, n: tA.n, noteMax: 100 };
    const avantA = traverser(coursA, testA, 0).avant;
    ok('avant le test : aucun chemin, ni l’étape commune, ni la fin',
        [...cheminsA, communeA, finA].every(s => avantA.find(x => x.numero === s.numero).vis === 'masquee'));
    const anomaliesA = verifierTousLesScores(coursA, { test: testA, fin: finA.numero,
        chemins: cheminsA.map((s, j) => ({ numero: s.numero, de: plagesA[j][0], a: plagesA[j][1] })) });
    ok(`chaque score de 0 à ${tA.n} ouvre UN chemin, le bon, puis la fin du parcours`, !anomaliesA.length, anomaliesA.join(' ; '));

    // ─── B. Test Moodle, deux chemins ───────────────────────────────────────
    console.log('\n── B. Test Moodle à deux chemins (10 questions, sans ouverture progressive) ──');
    const coursB = lireCours(r.test.textes);
    const [tB] = r.test.tests;
    ok('le test est un Test Moodle, à une seule tentative', tB && tB.moduleName === 'quiz'
        && /<attempts_number>1<\/attempts_number>/.test(r.test.textes[`activities/quiz_${tB.moduleId}/quiz.xml`] || ''));
    ok('dix questions lues dans le contenu du test', tB.n === 10);
    // Chemins de 16 et 16 min ici ; l'accueil est vide dans le plan : il porte
    // la durée seule, et l'étiquette existe quand même.
    const accueilB = Object.values(r.test.textes).map(x => deXml(deXml(x))).find(x => /<label /.test(x) && /Durée estimée du parcours/.test(x));
    ok('sans texte d’accueil, l’accueil porte au moins la durée', Boolean(accueilB));
    const cheminsB = coursB.sections.filter(s => s.dispo && s.dispo.c.some(c => c.type === 'grade'));
    const plagesB = A.plagesEnReponses(A.bornesEnReponses([60], tB.n), tB.n);
    ok('deux sections-chemins', cheminsB.length === 2);
    const friseB = [...coursB.modules.values()].filter(m => m.module === 'h5pactivity' && m.vue);
    ok('la Frise (jamais notée) s’achève à la consultation, sinon le chemin « Revoir » ne finirait jamais', friseB.length === 1);
    const sansProgression = coursB.sections.filter(s => s.numero >= 1 && !s.dispo).map(s => s.numero);
    ok('sans ouverture progressive, les étapes ordinaires restent ouvertes', sansProgression.length === 3, sansProgression.join(','));
    const finB = coursB.sections.at(-1);
    const testB = { cm: tB.moduleId, noteId: tB.noteId, n: tB.n, noteMax: 10 };
    const anomaliesB = verifierTousLesScores(coursB, { test: testB, fin: finB.numero,
        chemins: cheminsB.map((s, j) => ({ numero: s.numero, de: plagesB[j][0], a: plagesB[j][1] })) });
    ok(`chaque score de 0 à ${tB.n} ouvre UN chemin, le bon, puis la fin du parcours`, !anomaliesB.length, anomaliesB.join(' ; '));

    // ─── C. Sans chemin ─────────────────────────────────────────────────────
    console.log('\n── C. Parcours sans chemin : fin du parcours et durées ──');
    const coursC = lireCours(r.lineaire.textes);
    const finC = coursC.sections.at(-1);
    ok('la fin du parcours existe aussi sans chemin', r.lineaire.fin === true && /Fin du parcours/.test(finC.nom));
    ok('elle attend toutes les activités qui s’achèvent', finC.dispo && finC.dispo.c.length === 3);
    const libelleFin = Object.values(r.lineaire.textes).map(x => deXml(deXml(x))).find(x => /<label /.test(x) && /Bravo/.test(x));
    ok('elle dit « Bravo ! Le parcours est terminé. », puis le mot de la fin', Boolean(libelleFin)
        && /<strong>Bravo ! Le parcours est terminé\.<\/strong>/.test(libelleFin) && /Bravo\./.test(libelleFin), libelleFin && libelleFin.slice(0, 300));
    const rC = traverser(coursC, { cm: -1, noteId: -1, n: 0, noteMax: 100 }, 0);
    ok('en faisant tout, l’élève atteint la fin du parcours', rC.vues.has(finC.numero));
    ok('et pas avant', rC.avant.find(x => x.numero === finC.numero).vis === 'masquee');

    // ─── D. Refus ───────────────────────────────────────────────────────────
    console.log('\n── D. Un chemin sans activité prête ──');
    ok('l’assemblage refuse, avec le chemin en cause', r.incomplet && r.incomplet.message === 'parcours_chemins_incomplets'
        && r.incomplet.manques.some(m => m.role === 'consolider'), JSON.stringify(r.incomplet));

    // ─── E. Contre-épreuves : le banc voit ce qu'on abîme ───────────────────
    console.log('\n── E. Contre-épreuves ──');
    const trou = structuredClone(coursA);
    const b = trou.sections.find(s => s.numero === cheminsA[1].numero);
    b.dispo.c[0].min = b.dispo.c[0].min + 20;
    const anomaliesTrou = verifierTousLesScores(trou, { test: testA, fin: finA.numero,
        chemins: cheminsA.map((s, j) => ({ numero: s.numero, de: plagesA[j][0], a: plagesA[j][1] })) });
    ok('un trou dans les seuils est vu (des scores sans chemin)', anomaliesTrou.some(x => /0 chemin/.test(x)), anomaliesTrou.join(' ; '));
    const guillemets = structuredClone(cheminsA[0].dispo);
    guillemets.c[0].id = String(guillemets.c[0].id);
    ok('un identifiant de note entre guillemets est vu', A.verifierCondition(guillemets).length > 0);
    const muet = structuredClone(coursA);
    for (const cm of cheminsA[0].sequence) { const m = muet.modules.get(cm); if (m) m.completion = 0; }
    const anomaliesMuet = verifierTousLesScores(muet, { test: testA, fin: finA.numero,
        chemins: cheminsA.map((s, j) => ({ numero: s.numero, de: plagesA[j][0], a: plagesA[j][1] })) });
    ok('un chemin qui ne s’achève plus est vu (la fin ne s’ouvre pas)', anomaliesMuet.some(x => /fin du parcours/.test(x)), anomaliesMuet.join(' ; '));

    ok('aucune erreur dans la page', !pageErrors.length, pageErrors.join(' | '));

    // ─── F. L'interface, par de vrais clics ─────────────────────────────────
    //
    // Du cadrage au plan, puis « Voir comme un élève » : ce que l'enseignant
    // manipule, sans `__testing`. Les nombres se lisent dans les libellés à
    // l'écran (« de 5 à 8 sur 8 »), comme il les lit.
    console.log('\n── F. L’interface : cadrage, plan, « Voir comme un élève » ──');
    const ui = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const erreursUi = [];
    ui.on('pageerror', e => erreursUi.push(String(e.message || e)));
    await ui.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, rt => rt.abort());
    await ui.goto(`http://127.0.0.1:${PORT}/index.html`);
    await ui.waitForSelector('#parcours-button');
    await ui.fill('#qui', 'Professeur de français');
    await ui.fill('#quoi', 'Les accords du participe passé');
    await ui.click('#parcours-button');
    await ui.click('.pc-choice[data-choix="chemins"]');
    await ui.click('.pc-segment__b[data-chemins="2"]');
    const cadrage = await ui.evaluate(() => ({
        cartes: document.querySelectorAll('.pc-trame--chemins').length,
        auto: Boolean(document.querySelector('.pc-trame--auto')),
        autres: document.querySelector('.pc-trames__autres')?.hidden,
        roles: [...document.querySelectorAll('.pc-trame--chemins')]
            .map(c => [...c.querySelectorAll('.pc-role')].map(x => x.className.match(/pc-role--(\w+)/)[1]).join(',')),
        coche: document.querySelector('.pc-segment__b[data-chemins="2"]').getAttribute('aria-checked'),
    }));
    ok('« Des chemins selon les résultats » : les deux trames à chemins, sans « Caramel propose » ni autres modèles',
        cadrage.cartes === 2 && !cadrage.auto && cadrage.autres === true, JSON.stringify(cadrage));
    ok('deux chemins : chaque trame annonce « Renforcer » et « Approfondir »',
        cadrage.coche === 'true' && cadrage.roles.every(x => x === 'renforcer,approfondir'), JSON.stringify(cadrage.roles));

    await ui.locator('.pc-trame--chemins').nth(1).locator('.pc-trame__select').click();
    await ui.click('#pc-modele');
    await ui.waitForSelector('.pc-aiguillage');
    const nombres = x => (x.match(/\d+/g) || []).map(Number);
    const lirePlan = () => ui.evaluate(() => ({
        roles: [...document.querySelectorAll('.pc-chemin')].map(c => c.className.match(/pc-chemin--(\w+)/)[1]).join(','),
        cases: document.querySelectorAll('.pc-aiguillage__case').length,
        plages: [...document.querySelectorAll('.pc-aiguillage__intervalle')].map(x => x.textContent),
        pivot: document.querySelectorAll('.pc-carte__aiguille').length,
        fin: Boolean(document.querySelector('.pc-etape__num--fin')),
        tuiles: [...document.querySelector('.pc-summary').querySelectorAll('.pc-summary__item--kpi .pc-summary__lab')].map(x => x.textContent.trim()),
    }));
    const p1 = await lirePlan();
    const bornesLues = p1.plages.map(nombres);
    const nUi = bornesLues[0].at(-1);
    ok('le plan : deux colonnes « Renforcer » | « Approfondir », le test marqué, la fin du parcours en dernier',
        p1.roles === 'renforcer,approfondir' && p1.pivot === 1 && p1.fin, JSON.stringify(p1));
    ok('le bandeau parle d’un élève : chemins, activités par élève, durée par élève',
        p1.tuiles.length === 3 && p1.tuiles[0] === 'chemins' && /par élève/.test(p1.tuiles[1]) && p1.tuiles[2] === 'par élève', JSON.stringify(p1.tuiles));
    ok('la barre compte un carré par score, de 0 à n, et les plages se suivent sans trou',
        p1.cases === nUi + 1 && bornesLues[0][0] === 0 && bornesLues[1][0] === bornesLues[0][1] + 1 && bornesLues[1][1] === nUi,
        JSON.stringify(p1.plages));
    const etapeApprofondir = await ui.locator('.pc-chemin--approfondir').getAttribute('data-etape');
    await ui.click(`[data-pas="${etapeApprofondir}:1"]`);
    const p2 = await lirePlan();
    ok('« + » ouvre « Approfondir » une bonne réponse plus tard, et « Renforcer » suit',
        nombres(p2.plages[1])[0] === bornesLues[1][0] + 1 && nombres(p2.plages[0])[1] === bornesLues[0][1] + 1, JSON.stringify(p2.plages));
    await ui.click(`[data-pas="${etapeApprofondir}:-1"]`);
    ok('« − » revient exactement au réglage d’avant (aucune dérive d’arrondi)',
        JSON.stringify((await lirePlan()).plages) === JSON.stringify(p1.plages));

    await ui.click('.pc-aiguillage__voir');
    await ui.waitForSelector('.pc-eleve[open]');
    const texteDe = cle => ui.evaluate(async c => (await import('/js/core/translation.js')).t(c), cle);
    const vueEleve = () => ui.evaluate(() => [...document.querySelectorAll('.pc-eleve .pc-eleve__section[data-section]')]
        .map(s => (s.dataset.section === 'chemin' ? `chemin:${s.dataset.role}` : s.dataset.section)));
    await ui.locator('.pc-eleve .pc-segment__b', { hasText: await texteDe('parcours_eleve_moment_avant') }).click();
    const avantTest = await vueEleve();
    await ui.locator('.pc-eleve .pc-segment__b', { hasText: await texteDe('parcours_eleve_moment_pendant') }).click();
    await ui.locator('#pc-eleve-score').fill('0');
    const scoreZero = await vueEleve();
    await ui.locator('#pc-eleve-score').fill(String(nUi));
    const scoreMax = await vueEleve();
    await ui.locator('.pc-eleve .pc-segment__b', { hasText: await texteDe('parcours_eleve_moment_fin') }).click();
    const aLaFin = await vueEleve();
    ok('vu par un élève, avant le test : aucun chemin', !avantTest.some(x => x.startsWith('chemin')), JSON.stringify(avantTest));
    ok('0 bonne réponse : « Renforcer » seul ; toutes : « Approfondir » seul',
        scoreZero.filter(x => x.startsWith('chemin')).join() === 'chemin:renforcer'
        && scoreMax.filter(x => x.startsWith('chemin')).join() === 'chemin:approfondir', JSON.stringify({ scoreZero, scoreMax }));
    ok('parcours terminé : la fin du parcours apparaît, toujours un seul chemin',
        aLaFin.includes('fin') && aLaFin.filter(x => x.startsWith('chemin')).length === 1, JSON.stringify(aLaFin));
    await ui.locator('.pc-eleve .pc-segment__b', { hasText: await texteDe('parcours_eleve_enseignant') }).click();
    const prof = await vueEleve();
    ok('vu par l’enseignant : les deux chemins, avec leur condition écrite en clair',
        prof.filter(x => x.startsWith('chemin')).length === 2
        && await ui.locator('.pc-eleve .pc-eleve__condition').count() >= 3, JSON.stringify(prof));
    await ui.click('.pc-eleve__fermer');
    ok('la fenêtre se ferme', await ui.locator('.pc-eleve[open]').count() === 0);

    await ui.click('.pc-aiguillage__actions [data-key="parcours_aig_ajouter"]');
    ok('« Ajouter un chemin » : « Consolider » s’insère au milieu', (await lirePlan()).roles === 'renforcer,consolider,approfondir');
    await ui.click('.pc-aiguillage__actions [data-key="parcours_aig_retirer"]');
    ok('« Retirer un chemin » : on revient à deux', (await lirePlan()).roles === 'renforcer,approfondir');
    await ui.click('.pc-aiguillage__actions [data-key="parcours_aig_fermer"]');
    ok('« Un seul chemin pour tous » : plus d’aiguillage, et l’annulation est proposée',
        await ui.locator('.pc-aiguillage').count() === 0 && await ui.locator('.pc-annulation').isVisible());
    await ui.click('.pc-annulation [data-key="parcours_annuler_modification"]');
    ok('« Annuler » rend les deux chemins', (await lirePlan()).roles === 'renforcer,approfondir');
    ok('aucune erreur dans l’interface', !erreursUi.length, erreursUi.join(' | '));

    // ─── G. Le vocabulaire de la plateforme (D105) ──────────────────────────
    // Des élèves sur Éléa, des stagiaires sur Magistère, des étudiants sur Moodle
    // (Emmanuel, 1er oct. 2026) : à l'écran, dans le cours, la fiche et les prompts.
    console.log('\n── G. Le vocabulaire de la plateforme : élèves, stagiaires, étudiants ──');
    const v = r.vocabulaire;
    ok('une clé prend la variante de sa plateforme, et seulement si elle existe',
        v.cles.moodle === 'parcours_structure_titre_moodle' && v.cles.magistere === 'parcours_structure_titre_magistere'
        && v.cles.elea === 'parcours_structure_titre' && v.cles.sansVariante === 'parcours_fin_titre'
        && v.cles.formateurMoodle === 'parcours_eleve_enseignant', JSON.stringify(v.cles));
    ok('dans le cours, l’étiquette de chaque chemin parle de SON public',
        v.elea.prof.length === 3 && v.elea.prof.every(x => /aux élèves .*un élève/.test(x))
        && v.magistere.prof.length === 3 && v.magistere.prof.every(x => /aux stagiaires .*un stagiaire/.test(x) && !/élève/.test(x))
        && v.moodle.prof.length === 3 && v.moodle.prof.every(x => /aux étudiants .*un étudiant/.test(x) && !/élève/.test(x)),
        JSON.stringify({ elea: v.elea.prof[0], magistere: v.magistere.prof[0], moodle: v.moodle.prof[0] }));
    ok('la liste « À faire » est cachée « aux stagiaires » sur Magistère',
        v.magistere.aFaire.length === 1 && /cachée aux stagiaires/.test(v.magistere.aFaire[0]), JSON.stringify(v.magistere.aFaire));
    ok('la fiche de séquence compte « par stagiaire », « par étudiant »',
        /par élève/.test(v.elea.fiche) && /par stagiaire/.test(v.magistere.fiche) && /par étudiant/.test(v.moodle.fiche)
        && !/élève/.test(v.magistere.fiche) && !/élève/.test(v.moodle.fiche),
        JSON.stringify({ magistere: v.magistere.fiche.slice(0, 200), moodle: v.moodle.fiche.slice(0, 200) }));
    ok('le prompt dit au modèle qui lira : des stagiaires, des étudiants, au vouvoiement',
        /tutoiement pour des élèves/.test(v.elea.promptPlan)
        && /des STAGIAIRES en formation/.test(v.magistere.promptPlan) && /Registre : vouvoiement/.test(v.magistere.promptPlan)
        && /des ÉTUDIANTS/.test(v.moodle.promptPlan) && /Registre : vouvoiement/.test(v.moodle.promptPlan)
        && /des STAGIAIRES/.test(v.magistere.promptModule) && /des ÉTUDIANTS/.test(v.moodle.promptModule));
    ok('sur Magistère, la pièce de plateforme est préparée par un formateur, entre stagiaires',
        /^Tu es un formateur qui prépare une pièce de sa formation/.test(v.magistere.promptModule)
        && /entre stagiaires/.test(v.magistere.promptModule) && /^Tu es un enseignant/.test(v.moodle.promptModule)
        && /entre étudiants/.test(v.moodle.promptModule), v.magistere.promptModule.slice(0, 200));

    // L'écran, par de vrais clics : Moodle, puis Magistère sans recharger.
    const voc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const erreursVoc = [];
    voc.on('pageerror', e => erreursVoc.push(String(e.message || e)));
    await voc.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, rt => rt.abort());
    await voc.goto(`http://127.0.0.1:${PORT}/index.html`);
    await voc.waitForSelector('#parcours-button');
    await voc.fill('#qui', 'Enseignant en licence');
    await voc.fill('#quoi', 'Les accords du participe passé');
    await voc.click('#parcours-button');
    await voc.click('.pc-choice[data-choix="moodle"]');
    await voc.click('.pc-choice[data-choix="chemins"]');
    // Le texte visible du cadrage, hors du bloc des plateformes (« Éléa : pour les élèves » reste juste).
    const lireCadrage = () => voc.evaluate(() => {
        const blocs = [...document.querySelectorAll('.pc-atelier .pc-block, .pc-atelier .pc-trames, .pc-atelier .pc-nb-chemins')]
            .filter(b => !b.querySelector('[data-choix="elea"]'));
        return { texte: blocs.map(b => b.innerText).join(' | '),
            titre: [...document.querySelectorAll('.pc-block__title')].map(x => x.textContent).find(x => /chemin \?$/.test(x)),
            // Les variantes posées en data-key (hors noms de plateforme, qui finissent aussi en _moodle).
            cles: [...document.querySelectorAll('.pc-atelier [data-key]')].map(x => x.dataset.key)
                .filter(k => /_moodle$|_magistere$/.test(k) && !/^parcours_platform_/.test(k)) };
    });
    const cadrageMoodle = await lireCadrage();
    ok('cadrage Moodle : « Tous vos étudiants suivent-ils le même chemin ? », et nulle part « élève »',
        cadrageMoodle.titre === 'Tous vos étudiants suivent-ils le même chemin ?' && /chaque étudiant ne voit que le sien/.test(cadrageMoodle.texte)
        && !/élève/i.test(cadrageMoodle.texte), JSON.stringify({ titre: cadrageMoodle.titre, extrait: (cadrageMoodle.texte.match(/.{0,60}élève.{0,60}/i) || [''])[0] }));
    await voc.click('.pc-choice[data-choix="magistere"]');
    const cadrageMag = await lireCadrage();
    ok('passer à Magistère repeint le cadrage sur place : « Tous vos stagiaires… », data-key compris',
        cadrageMag.titre === 'Tous vos stagiaires suivent-ils le même chemin ?' && /chaque stagiaire ne voit que le sien/.test(cadrageMag.texte)
        && !/élève|étudiant/i.test(cadrageMag.texte) && cadrageMag.cles.every(k => !/_moodle$/.test(k)),
        JSON.stringify({ titre: cadrageMag.titre, cles: cadrageMag.cles, extrait: (cadrageMag.texte.match(/.{0,60}(élève|étudiant).{0,60}/i) || [''])[0] }));
    await voc.locator('.pc-trame--chemins').first().locator('.pc-trame__select').click();
    await voc.click('#pc-modele');
    await voc.waitForSelector('.pc-aiguillage');
    const planMag = await voc.evaluate(() => ({
        voir: document.querySelector('.pc-aiguillage__voir')?.textContent.trim(),
        pivot: document.querySelector('.pc-carte__aiguille')?.textContent.trim(),
        tuiles: [...document.querySelectorAll('.pc-summary__item--kpi .pc-summary__lab')].map(x => x.textContent.trim()),
        chrome: [...document.querySelectorAll('.pc-aiguillage__aide, .pc-summary, .pc-aiguillage__actions, .pc-etape__num--fin')].map(x => x.innerText).join(' | '),
    }));
    ok('plan Magistère : « Voir comme un stagiaire », « Oriente les stagiaires », « par stagiaire »',
        planMag.voir === 'Voir comme un stagiaire' && /Oriente les stagiaires/.test(planMag.pivot || '')
        && planMag.tuiles.filter(x => /par stagiaire/.test(x)).length === 2 && !/élève/i.test(planMag.chrome), JSON.stringify(planMag));
    await voc.click('.pc-aiguillage__voir');
    await voc.waitForSelector('.pc-eleve[open]');
    const vueMag = await voc.evaluate(() => ({
        titre: document.querySelector('.pc-eleve__titre')?.textContent,
        qui: [...document.querySelectorAll('.pc-eleve .pc-segment__b')].map(x => x.textContent.trim()),
        texte: document.querySelector('.pc-eleve')?.innerText || '',
    }));
    ok('la vue élève devient « Voir comme un stagiaire » : « Un stagiaire » | « Le formateur »',
        vueMag.titre === 'Voir comme un stagiaire' && vueMag.qui.includes('Un stagiaire') && vueMag.qui.includes('Le formateur')
        && !/élève|enseignant/i.test(vueMag.texte.replace(/Enseignant en licence/g, '')), JSON.stringify({ ...vueMag, texte: (vueMag.texte.match(/.{0,50}(élève|enseignant).{0,50}/i) || [''])[0] }));
    await voc.locator('.pc-eleve .pc-segment__b', { hasText: 'Le formateur' }).click();
    const conditions = await voc.locator('.pc-eleve .pc-eleve__condition').allTextContents();
    ok('vu par le formateur, les conditions parlent des stagiaires',
        conditions.length >= 3 && conditions.some(x => /des stagiaires qui obtiennent/.test(x)) && !conditions.some(x => /élève/.test(x)), JSON.stringify(conditions));
    ok('aucune erreur dans l’interface (vocabulaire)', !erreursVoc.length, erreursVoc.join(' | '));
    await browser.close();
} catch (e) {
    console.error(e);
    fail++;
    echecs.push(`❌ exception : ${e.message}`);
    exitCode = 1;
}

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (echecs.length) console.log('\n' + echecs.join('\n'));
stop();
process.exit(fail ? 1 : exitCode);
