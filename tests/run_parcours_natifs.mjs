/**
 * Banc des MODULES NATIFS du parcours (ouverts le 27 sept. 2026, D70 à D74).
 *
 * Ce qu'il tient, et pourquoi chaque point compte :
 *
 *   1. La FORME. Chaque module est fabriqué avec un contenu riche, puis la suite
 *      de ses balises est comparée à celle du relevé authentique du même soir
 *      (`tests/fixtures/moodle-reference/sept-2026/`). Une balise perdue, c'est
 *      un réglage que Moodle comblera d'une valeur par défaut — ou pas.
 *   2. L'ACHÈVEMENT. Relevé module par module ; les modules sans achèvement
 *      doivent le rester, et SORTIR de l'ouverture progressive (D71).
 *   3. Les FORMATS TEXTE des questions et des pages : aller-retour sans perte.
 *   4. L'étiquette « À faire », CACHÉE aux élèves, en tête du cours (D72).
 *   5. Les PALETTES constatées : Etherpad sur Magistère seul, Feedback hors
 *      Magistère, les greffons hors Moodle nu.
 *   6. Le Lien web tient son adresse de la CARTE, pas du modèle.
 *   7. Le routeur : la clé H5P `Glossary` n'est pas avalée par `glossary`.
 *   8. Le Paquetage IMS : pages, manifeste, archive et table des matières
 *      (sérialisée à la PHP) écrits par Caramel ; jamais proposé par le plan.
 *   9. Ce que lit le participant : règles de rédaction communes (registre,
 *      aucun jargon du prompt), et refus d'une question à trous injouable.
 *
 * Lancement : node tests/run_parcours_natifs.mjs (serveur statique propre, port 8161).
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8161;
const REF = join(ROOT, 'tests/fixtures/moodle-reference/sept-2026');

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

/** Vocabulaire de balises d'un XML, dans l'ordre de première apparition. */
function vocabulaire(xml) {
    const vus = [];
    for (const m of xml.matchAll(/<([a-z_][a-z0-9_]*)[\s>/]/gi)) {
        if (m[1] === 'activity') continue;
        if (!vus.includes(m[1])) vus.push(m[1]);
    }
    return vus;
}
const champ = (xml, tag) => (xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`)) || [])[1];

/**
 * Contenus d'essai, riches : chaque conteneur répété est rempli, pour que sa
 * forme soit comparée et pas seulement sa coquille.
 */
const CONTENUS = {
    parcours_lien: { title: 'Lien', intro: 'Lis l’article.', externalurl: 'https://example.org/a?b=1&c=2' },
    parcours_questionnaire: { title: 'Questionnaire', intro: 'Réponds.', questions: [
        { texte: 'Unique ?', type: 'unique', choix: ['A', 'B', 'C'] },
        { texte: 'Plusieurs ?', type: 'multiple', choix: ['A', 'B'] },
        { texte: 'Oui ou non ?', type: 'ouinon', choix: [] },
        { texte: 'Libre ?', type: 'libre', choix: [] },
    ] },
    parcours_enquete: { title: 'Enquête', intro: 'Anonyme.', questions: [
        { texte: 'Unique ?', type: 'unique', choix: ['A', 'B'] },
        { texte: 'Libre ?', type: 'libre', choix: [] },
    ] },
    parcours_lecon: { title: 'Leçon', intro: 'Avance.', pages: [
        { titre: 'Page 1', texte: 'Texte 1', question: '', reponses: [] },
        { titre: 'Page 2', texte: 'Texte 2', question: 'Q ?', reponses: [{ texte: 'Oui', correcte: true }, { texte: 'Non', correcte: false }] },
    ] },
    parcours_atelier: { title: 'Atelier', intro: 'Produis.', consigneAuteurs: 'Écris.', consigneEvaluateurs: 'Évalue.', criteres: ['C1', 'C2', 'C3'] },
    parcours_tableau: { title: 'Tableau', intro: 'Dépose.', titresColonnes: ['Un', 'Deux', 'Trois'] },
    parcours_wiki: { title: 'Wiki', intro: 'Écrivons.', premierePage: 'Accueil' },
    parcours_glossaire: { title: 'Glossaire', intro: 'Ajoute un mot.' },
    parcours_document: { title: 'Document', intro: 'Rédigez.', texteInitial: 'Plan\n1. A\n2. B' },
    parcours_etherpad: { title: 'Etherpad', intro: 'Notez.' },
    parcours_depot: { title: 'Dépôt', intro: 'Déposez.' },
    parcours_classe_virtuelle: { title: 'Classe', intro: 'En direct.', accueil: 'Bienvenue' },
    parcours_base: { title: 'Base', intro: 'Remplis.', rubriques: ['Lieu : où', 'Observation : quoi'] },
    parcours_choix_groupe: { title: 'Groupes', intro: 'Choisis.' },
    parcours_test_etudiant: { title: 'Nos questions sur l’eau', intro: 'Crée **une** question, puis réponds à celles des autres.' },
    parcours_ims: { title: 'Données & « vie privée » <essentiel>', intro: 'Parcourez les pages.', pages: [
        { titre: 'Pourquoi protéger ?', texte: 'Les données d’un élève sont **personnelles**.\n## Ce que dit la loi\nLe RGPD encadre la collecte.\n- minimiser\n- informer' },
        { titre: 'Les bons réflexes', texte: 'Un mot de passe par service.' },
        { titre: 'Élève & famille', texte: 'Informer « avant » de collecter.' },
    ] },
};

/** Le relevé d'un module, sur la plateforme où il existe. */
function releve(moduleName) {
    for (const plat of ['elea', 'magistere']) {
        const p = join(REF, plat, `${moduleName}.xml`);
        if (existsSync(p)) return { xml: readFileSync(p, 'utf8'), module: readFileSync(join(REF, plat, `${moduleName}.module.xml`), 'utf8'), plat };
    }
    return null;
}

/**
 * Écarts ASSUMÉS entre notre forme et le relevé, et leur raison. Tout autre
 * écart fait échouer le banc.
 */
const ECARTS_ASSUMES = {
    // Les options d'un choix de groupe SONT des groupes du cours : un backup
    // d'enseignant n'en emporte pas, le module arrive sans option (D72).
    choicegroup: ['option', 'groupid', 'maxanswers'],
};
/** Achèvement volontairement différent du défaut de la plateforme. */
const ACHEVEMENT_ASSUME = {
    // Un atelier avance par phases que seul l'enseignant fait passer, un choix
    // de groupe attend des groupes : aucun des deux ne doit fermer l'étape
    // suivante (D71), quel que soit le réglage par défaut de la plateforme.
    workshop: '0', choicegroup: '0',
};

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

    const r = await page.evaluate(async (CONTENUS) => {
        const mp = await import('/js/parcours/modules-parcours.js');
        const natifs = await import('/js/parcours/modules-natifs.js');
        const routeur = await import('/js/parcours/activity-router.js');
        const sources = await import('/js/parcours/sources.js');
        const { assemblerParcours, activiteDepuisCarte } = await import('/js/parcours/parcours-builder.js');
        const TS = 1756000000;

        const fabriques = {};
        for (const [cle, contenu] of Object.entries(CONTENUS)) {
            const def = mp.MODULES_PARCOURS[cle];
            const f = mp.construireActiviteParcours(cle, contenu, { timestamp: TS });
            const xml = f.files[`${f.activityDir}/${f.moduleName}.xml`];
            const bienForme = !new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror');
            fabriques[cle] = { moduleName: f.moduleName, xml, module: f.files[`${f.activityDir}/module.xml`], bienForme,
                sansAchevement: !!def.sansAchevement };
        }

        // Déterminisme : le même contenu donne le même fichier.
        const deux = mp.construireActiviteParcours('parcours_questionnaire', CONTENUS.parcours_questionnaire, { timestamp: TS });
        const deterministe = deux.files['activities/questionnaire_1/questionnaire.xml'] === fabriques.parcours_questionnaire.xml;
        // Deux contenus différents n'emploient pas les mêmes identifiants imbriqués.
        const autre = mp.construireActiviteParcours('parcours_questionnaire',
            { ...CONTENUS.parcours_questionnaire, title: 'Autre' }, { timestamp: TS }).files['activities/questionnaire_1/questionnaire.xml'];
        const idsQ = x => [...x.matchAll(/<question id="(\d+)"/g)].map(m => m[1]);
        const idsDisjoints = !idsQ(autre).some(id => idsQ(fabriques.parcours_questionnaire.xml).includes(id));

        // Formats texte : aller-retour sans perte.
        const q = natifs.normaliserQuestions(CONTENUS.parcours_questionnaire.questions);
        const qRetour = natifs.questionsDepuisTexte(natifs.questionsVersTexte(q));
        const p = natifs.normaliserPages(CONTENUS.parcours_lecon.pages);
        const pRetour = natifs.pagesDepuisTexte(natifs.pagesVersTexte(p));
        // Une page dont la question n'a aucune bonne réponse redevient une page à lire.
        const pageBancale = natifs.normaliserPages([{ titre: 'X', texte: 'Y', question: 'Z ?', reponses: [{ texte: 'a' }, { texte: 'b' }] }])[0];

        // Gras Markdown du modèle : <strong> dans les champs HTML, retiré des champs texte.
        const gras = {
            lecon: mp.construireActiviteParcours('parcours_lecon', { title: 'L', intro: 'I', pages: [{ titre: 'P', texte: 'Voici **l’évaporation**.', question: '', reponses: [] }] })
                .files['activities/lesson_1/lesson.xml'],
            enquete: mp.construireActiviteParcours('parcours_enquete', { title: 'E', intro: 'I', questions: [{ texte: 'As-tu compris **la condensation** ?', type: 'unique', choix: ['**Oui**', 'Non'] }] })
                .files['activities/feedback_1/feedback.xml'],
        };

        // Palettes.
        const palettes = Object.fromEntries(['elea', 'magistere', 'moodle'].map(pl =>
            [pl, routeur.modulesDisponibles(pl).map(m => m.cle)]));

        // Routeur : la clé H5P `Glossary` reste le lexique H5P.
        const glossaire = [routeur.resoudreModule('Glossary', 'elea').cle, routeur.resoudreModule('glossary', 'elea').cle,
            routeur.resoudreModule('parcours_glossaire', 'elea').cle];

        // Lien web : source de la carte.
        const carteLien = { module: 'parcours_lien', titre: 'Lien', contenu: { title: 'Lien', intro: 'Lis.', externalurl: 'https://ancienne.example' },
            source: { type: 'lien', url: 'https://nouvelle.example/page' } };
        const lienExtrait = await activiteDepuisCarte(carteLien);
        const lienXml = lienExtrait.files['activities/url_1/url.xml'];
        const lien = {
            type: sources.typeSource('parcours_lien'),
            manquante: sources.sourceManquante({ module: 'parcours_lien' }),
            fournie: sources.sourceManquante({ module: 'parcours_lien', source: { type: 'lien', url: 'https://ok.example' } }),
            adresse: (lienXml.match(/<externalurl>([^<]*)</) || [])[1],
        };

        // Assemblage : ouverture progressive + étiquette « À faire ».
        const carte = (id, module, contenu) => ({ id, module, titre: contenu.title, contenu, palier: 'entrainement', duree: 10 });
        const plan = {
            titre: 'Natifs', introduction: 'Bienvenue.', etapes: [
                { id: 'e1', titre: 'Un', introduction: 'Intro 1', cartes: [
                    carte('c1', 'parcours_wiki', CONTENUS.parcours_wiki),
                    carte('c2', 'parcours_tableau', CONTENUS.parcours_tableau),
                    carte('c3', 'parcours_classe_virtuelle', CONTENUS.parcours_classe_virtuelle),
                ] },
                { id: 'e2', titre: 'Deux', introduction: 'Intro 2', cartes: [
                    carte('c4', 'parcours_atelier', CONTENUS.parcours_atelier),
                    carte('c5', 'parcours_lecon', CONTENUS.parcours_lecon),
                ] },
                { id: 'e3', titre: 'Trois', introduction: '', cartes: [carte('c6', 'parcours_forum', { title: 'Forum', intro: 'Échange.' })] },
            ],
            progression: { actif: true },
        };
        // Magistère : la classe virtuelle n'est proposée que là (D77).
        const paquet = await assemblerParcours(plan, { timestamp: TS, platformId: 'magistere' });
        const { loadMoodleLibs } = await import('/js/core/lib-loader.js');
        await loadMoodleLibs();
        const tar = window.fflate.gunzipSync(paquet.bytes);
        const fichiers = {};
        const dec = new TextDecoder();
        for (let off = 0; off + 512 <= tar.length;) {
            const nom = dec.decode(tar.subarray(off, off + 100)).replace(/\0.*$/s, '');
            if (!nom) break;
            const prefixe = dec.decode(tar.subarray(off + 345, off + 500)).replace(/\0.*$/s, '');
            const taille = parseInt(dec.decode(tar.subarray(off + 124, off + 136)).replace(/\0.*$/s, '').trim() || '0', 8);
            const chemin = prefixe ? `${prefixe}/${nom}` : nom;
            fichiers[chemin] = dec.decode(tar.subarray(off + 512, off + 512 + taille));
            off += 512 + Math.ceil(taille / 512) * 512;
        }
        // Document collaboratif : son fichier de départ DOIT voyager (D75).
        const planDoc = { titre: 'Doc', etapes: [{ id: 'd1', titre: 'Un', cartes: [
            carte('d1c1', 'parcours_document', { title: 'Compte rendu : l’expérience', intro: 'Rédigez.', texteInitial: 'Plan\n1. Hypothèse' }),
            carte('d1c2', 'parcours_document', { title: 'Second document', intro: 'Rédigez.', texteInitial: '' }),
        ] }] };
        const paquetDoc = await assemblerParcours(planDoc, { timestamp: TS, platformId: 'elea' });
        const tarDoc = window.fflate.gunzipSync(paquetDoc.bytes);
        const fichiersDoc = {};
        for (let off = 0; off + 512 <= tarDoc.length;) {
            const nom = dec.decode(tarDoc.subarray(off, off + 100)).replace(/\0.*$/s, '');
            if (!nom) break;
            const prefixe = dec.decode(tarDoc.subarray(off + 345, off + 500)).replace(/\0.*$/s, '');
            const taille = parseInt(dec.decode(tarDoc.subarray(off + 124, off + 136)).replace(/\0.*$/s, '').trim() || '0', 8);
            fichiersDoc[prefixe ? `${prefixe}/${nom}` : nom] = dec.decode(tarDoc.subarray(off + 512, off + 512 + taille));
            off += 512 + Math.ceil(taille / 512) * 512;
        }

        // Paquetage IMS : ses fichiers, octets compris (l'archive est binaire).
        const planIms = { titre: 'IMS', etapes: [{ id: 'i1', titre: 'Un', cartes: [
            carte('i1c1', 'parcours_ims', CONTENUS.parcours_ims),
            carte('i1c2', 'parcours_document', { title: 'Doc', intro: 'Rédigez.', texteInitial: 'Plan' }),
        ] }] };
        const paquetIms = await assemblerParcours(planIms, { timestamp: TS, platformId: 'elea' });
        const tarIms = window.fflate.gunzipSync(paquetIms.bytes);
        const octetsIms = {};
        for (let off = 0; off + 512 <= tarIms.length;) {
            const nom = dec.decode(tarIms.subarray(off, off + 100)).replace(/\0.*$/s, '');
            if (!nom) break;
            const prefixe = dec.decode(tarIms.subarray(off + 345, off + 500)).replace(/\0.*$/s, '');
            const taille = parseInt(dec.decode(tarIms.subarray(off + 124, off + 136)).replace(/\0.*$/s, '').trim() || '0', 8);
            octetsIms[prefixe ? `${prefixe}/${nom}` : nom] = tarIms.slice(off + 512, off + 512 + taille);
            off += 512 + Math.ceil(taille / 512) * 512;
        }
        const texteIms = Object.fromEntries(Object.entries(octetsIms).map(([k, v]) => [k, dec.decode(v)]));
        const dirIms = Object.keys(texteIms).find(k => /^activities\/imscp_\d+\/imscp\.xml$/.test(k));
        const xmlIms = texteIms[dirIms] || '';
        const ctxIms = (xmlIms.match(/contextid="(\d+)"/) || [])[1];
        const blocsIms = (texteIms['files.xml'].match(/<file id="\d+">[\s\S]*?<\/file>/g) || [])
            .filter(b => b.includes(`<contextid>${ctxIms}</contextid>`) && b.includes('<component>mod_imscp</component>'))
            .map(b => ({ id: b.match(/<file id="(\d+)"/)[1], zone: b.match(/<filearea>([^<]*)/)[1], item: b.match(/<itemid>([^<]*)/)[1],
                nom: b.match(/<filename>([^<]*)/)[1], hash: b.match(/<contenthash>([^<]*)/)[1] }));
        const contenuDe = nomFichier => {
            const b = blocsIms.find(x => x.zone === 'content' && x.nom === nomFichier);
            return b ? texteIms[`files/${b.hash.slice(0, 2)}/${b.hash}`] : null;
        };
        const archive = blocsIms.find(x => x.zone === 'backup' && x.nom.endsWith('.zip'));
        let dansArchive = null;
        try {
            const z = window.fflate.unzipSync(octetsIms[`files/${archive.hash.slice(0, 2)}/${archive.hash}`]);
            dansArchive = Object.fromEntries(Object.entries(z).map(([k, v]) => [k, dec.decode(v)]));
        } catch { /* archive illisible : le banc le dira */ }
        const structureIms = new DOMParser().parseFromString(xmlIms, 'application/xml').querySelector('structure')?.textContent || '';
        const ims = {
            xml: xmlIms, blocs: blocsIms, structure: structureIms,
            inforef: texteIms[dirIms?.replace('imscp.xml', 'inforef.xml')] || '',
            manifeste: contenuDe('imsmanifest.xml'),
            manifesteBienForme: !new DOMParser().parseFromString(contenuDe('imsmanifest.xml') || '', 'application/xml').querySelector('parsererror'),
            page1: contenuDe('page-01.html'), page3: contenuDe('page-03.html'),
            archive: archive?.nom, dansArchive, pool: blocsIms.every(b => Object.prototype.hasOwnProperty.call(octetsIms, `files/${b.hash.slice(0, 2)}/${b.hash}`)),
            collabora: Object.keys(texteIms).some(k => /^activities\/collabora_\d+\/inforef\.xml$/.test(k)
                && texteIms[k].includes('<id>')),
            // Le CONTENU de l'archive, fichier par fichier : l'en-tête tar porte
            // l'heure d'écriture (`createMbz`), la taille compressée peut varier.
            deterministe: await (async () => {
                const lireTar = octets => {
                    const t = window.fflate.gunzipSync(octets), sortie = {};
                    for (let off = 0; off + 512 <= t.length;) {
                        const nom = dec.decode(t.subarray(off, off + 100)).replace(/\0.*$/s, '');
                        if (!nom) break;
                        const prefixe = dec.decode(t.subarray(off + 345, off + 500)).replace(/\0.*$/s, '');
                        const taille = parseInt(dec.decode(t.subarray(off + 124, off + 136)).replace(/\0.*$/s, '').trim() || '0', 8);
                        sortie[prefixe ? `${prefixe}/${nom}` : nom] = [...t.subarray(off + 512, off + 512 + taille)].join(',');
                        off += 512 + Math.ceil(taille / 512) * 512;
                    }
                    return JSON.stringify(Object.entries(sortie).sort());
                };
                return lireTar((await assemblerParcours(planIms, { timestamp: TS, platformId: 'elea' })).bytes) === lireTar(paquetIms.bytes);
            })(),
            chapitres: natifs.normaliserChapitres(CONTENUS.parcours_ims.pages),
            chapitresRetour: natifs.chapitresDepuisTexte(natifs.chapitresVersTexte(CONTENUS.parcours_ims.pages)),
            sansPage: (() => { try { mp.construireActiviteParcours('parcours_ims', { title: 'Vide', pages: [] }); return false; } catch { return true; } })(),
            // Tel que le modèle l'a écrit le 28 sept. 2026 : un glossaire en intertitres, du gras partout.
            maladroit: (() => {
                const f = mp.construireActiviteParcours('parcours_ims', { title: 'G', intro: 'Le **RGPD**, puis le **RGPD**.', pages: [{ titre: 'Glossaire',
                    texte: '## **Base légale** : fondement juridique du traitement.\n## Ce que dit la loi\nLe **RGPD** protège. Le **RGPD** oblige. Le **rgpd** encadre.' }] });
                return { page: new TextDecoder().decode(f.paquet.zones[0].fichiers[1].octets), xml: f.files['activities/imscp_1/imscp.xml'] };
            })(),
        };

        // Ce que lit le participant : les règles de rédaction.
        const scen = await import('/js/parcours/scenario-prompt.js');
        const draftRedac = { platform: 'magistere', format: 'hybride', ampleur: 'moyenne', trame: null,
            contexte: { quoi: 'Protéger les données', niveau: 'Enseignants en formation continue' },
            plan: { titre: 'T', notionsPivots: ['le RGPD'], etapes: [{ titre: 'E', cartes: [
                { id: 'r1', module: 'parcours_forum', titre: 'Forum', palier: 'transfert', duree: 20 },
                { id: 'r2', module: 'MultipleChoice', titre: 'QCM', palier: 'entrainement', duree: 5 },
            ] }] } };
        const promptPlan = scen.construirePromptPlan(draftRedac).prompt;
        const promptNatif = (await scen.construirePromptRemplissage(draftRedac, draftRedac.plan.etapes[0].cartes[0])).prompt;
        const promptH5p = (await scen.construirePromptRemplissage(draftRedac, draftRedac.plan.etapes[0].cartes[1])).prompt;
        // Le second sondage reçoit les réponses du premier, pour qu'on puisse comparer.
        const draftVotes = { platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: null, contexte: { quoi: 'Débat', niveau: '3e' },
            plan: { titre: 'D', etapes: [{ titre: 'E', cartes: [
                { id: 'v1', module: 'parcours_sondage', titre: 'Avant', contenu: { title: 'Avant', intro: 'Q ?', options: ['plutôt oui', 'peut-être', 'plutôt non'] } },
                { id: 'v2', module: 'parcours_sondage', titre: 'Après', palier: 'transfert', duree: 3 },
            ] }] } };
        const promptVote = (await scen.construirePromptRemplissage(draftVotes, draftVotes.plan.etapes[0].cartes[1])).prompt;
        const promptPremierVote = (await scen.construirePromptRemplissage(draftVotes, draftVotes.plan.etapes[0].cartes[0])).prompt;
        // D82 : les retours d'exemple à l'impersonnel restent DANS le parcours ;
        // le prompt d'une activité créée seule est celui d'avant.
        const gen = await import('/js/services/prompt-generator.js');
        const { RETOURS_IMPERSONNELS } = await import('/js/parcours/retours-impersonnels.js');
        const frLoc = await (await fetch('/js/locales/fr.json')).json();
        const exemplesCommuns = Object.entries(frLoc).filter(([k]) => k.endsWith('_exemple_rendu')).map(([, v]) => v).join('\n');
        const paires = RETOURS_IMPERSONNELS.fr;
        const individuel = gen.buildActivityPrompt(gen.prefixForModule('MultipleChoice'), { qui: 'X', quoi: 'Y', niveau: 'Z', nombreQuestions: 3, isAdvanced: true });
        const isolement = {
            langue: (await import('/js/core/translation.js')).currentLang,
            mortes: paires.filter(([a]) => !exemplesCommuns.includes(`"${a}"`)).map(([a]) => a),
            communsModifies: paires.filter(([, b]) => exemplesCommuns.includes(`"${b}"`)).map(([, b]) => b),
            individuelTutoie: paires.some(([a]) => individuel.includes(`"${a}"`)),
            individuelSansImpersonnel: !paires.some(([, b]) => individuel.includes(`"${b}"`)),
            parcoursSansTutoiement: !paires.some(([a]) => promptH5p.includes(`"${a}"`)),
            parcoursImpersonnel: paires.some(([, b]) => promptH5p.includes(`"${b}"`)),
        };
        const catalogueIms = ['elea', 'magistere', 'moodle'].map(pl => ({
            mosaique: routeur.modulesDisponibles(pl).some(m => m.cle === 'parcours_ims'),
            plan: scen.construirePromptPlan({ platform: pl, format: 'distanciel', ampleur: 'moyenne', trame: null, contexte: { quoi: 'X' } }).modules.some(m => m.cle === 'parcours_ims'),
        }));

        // Test étudiant (D89) : Éléa seul, sur demande, `<coursemodule>` recalé après l'assemblage.
        const lireTexte = octets => {
            const t = window.fflate.gunzipSync(octets), sortie = {};
            for (let off = 0; off + 512 <= t.length;) {
                const nom = dec.decode(t.subarray(off, off + 100)).replace(/\0.*$/s, '');
                if (!nom) break;
                const prefixe = dec.decode(t.subarray(off + 345, off + 500)).replace(/\0.*$/s, '');
                const taille = parseInt(dec.decode(t.subarray(off + 124, off + 136)).replace(/\0.*$/s, '').trim() || '0', 8);
                sortie[prefixe ? `${prefixe}/${nom}` : nom] = dec.decode(t.subarray(off + 512, off + 512 + taille));
                off += 512 + Math.ceil(taille / 512) * 512;
            }
            return sortie;
        };
        const planTe = { titre: 'TE', etapes: [
            { id: 't1', titre: 'Un', cartes: [
                carte('t1c1', 'parcours_wiki', CONTENUS.parcours_wiki),
                carte('t1c2', 'parcours_test_etudiant', CONTENUS.parcours_test_etudiant),
            ] },
            { id: 't2', titre: 'Deux', cartes: [carte('t2c1', 'parcours_forum', { title: 'Forum', intro: 'Échange.' })] },
        ], progression: { actif: true } };
        const paquetTe = await assemblerParcours(planTe, { timestamp: TS, platformId: 'elea' });
        const fichiersTe = lireTexte(paquetTe.bytes);
        const cheminTe = Object.keys(fichiersTe).find(k => /^activities\/studentquiz_\d+\/studentquiz\.xml$/.test(k)) || '';
        const draftTe = { platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: null, contexte: { quoi: 'Le cycle de l’eau', niveau: '5e' },
            plan: { titre: 'Eau', etapes: [{ titre: 'E', cartes: [{ id: 'te1', module: 'parcours_test_etudiant', titre: 'Nos questions', palier: 'entrainement', duree: 20 }] }] } };
        const testEtudiant = {
            xml: fichiersTe[cheminTe] || '',
            module: fichiersTe[cheminTe.replace('studentquiz.xml', 'module.xml')] || '',
            activites: paquetTe.activites.map(a => ({ moduleName: a.moduleName, moduleId: a.moduleId })),
            sections: Object.fromEntries(Object.entries(fichiersTe).filter(([k]) => /sections\/section_\d+\/section\.xml$/.test(k))),
            // Le recalage ne touche que le Test étudiant, avec le `moduleid` de SON enveloppe.
            recale: natifs.recalerModulesDeCours({
                'activities/studentquiz_42/studentquiz.xml': '<activity id="7" moduleid="42" modulename="studentquiz" contextid="9">\n  <studentquiz id="7">\n    <coursemodule>1</coursemodule>',
                'activities/wiki_43/wiki.xml': '<activity id="8" moduleid="43" modulename="wiki" contextid="10"><coursemodule>1</coursemodule>',
            }),
            catalogue: ['elea', 'magistere', 'moodle'].map(pl => ({
                mosaique: routeur.modulesDisponibles(pl).some(m => m.cle === 'parcours_test_etudiant'),
                plan: scen.construirePromptPlan({ platform: pl, format: 'distanciel', ampleur: 'moyenne', trame: null, contexte: { quoi: 'X' } }).modules.some(m => m.cle === 'parcours_test_etudiant'),
            })),
            prompt: (await scen.construirePromptRemplissage(draftTe, draftTe.plan.etapes[0].cartes[0])).prompt,
            famille: (await import('/js/parcours/types-apprentissage.js')).familleDe('parcours_test_etudiant'),
        };

        // Une question à trous injouable est REFUSÉE (jamais retirée en silence).
        const formats = await import('/js/moodle/moodle-formats.js');
        const { reparer } = await import('/js/parcours/parcours-runner.js');
        const { classifyError } = await import('/js/core/utils.js');
        const refus = async f => { try { await f(); return null; } catch (e) { return String(e.message); } };
        const clozeReel = { questions: [
            { type: 'multichoice', content: { questiontext: 'Q', single: true, answers: [{ text: 'a', fraction: 100 }, { text: 'b', fraction: 0 }] } },
            // Tel que le modèle l'a écrit le 28 sept. 2026.
            { type: 'cloze', content: { questiontext: 'Classez de 1 à 6.\n{1:NUMERICAL:=Réponse attendue:0}', answer: { number: 1, tolerance: 0 } } },
        ] };
        const cloze = {
            reel: await refus(() => reparer(structuredClone(clozeReel), 'test_elea')),
            xml: await refus(() => formats.generateMoodleXml(structuredClone(clozeReel))),
            mbz: await refus(() => formats.canonicalizeTestModel(structuredClone(clozeReel))),
            sansBonne: await refus(() => formats.verifierTrousCloze({ questions: [{ type: 'cloze', content: { questiontext: '{1:SHORTANSWER:Paris~Lyon}' } }] })),
            sansTrou: await refus(() => formats.verifierTrousCloze({ questions: [{ type: 'cloze', content: { questiontext: 'Aucun trou.' } }] })),
            valide: await refus(() => formats.verifierTrousCloze({ questions: [{ type: 'cloze', content: {
                questiontext: '{1:NUMERICAL:=12:0} {1:NM:=3,14:0,01} {1:SHORTANSWER:=Paris} {1:MULTICHOICE:=a~b} {1:NUMERICAL:=*}' } }] })),
            message: classifyError(new Error('test_cloze_injouable:2')).userMessageKey,
        };

        // D76 : alternatives de trame, modalités, vignettes, document.
        const alt = ['elea', 'magistere', 'moodle'].map(pl => routeur.moduleDeTrame('parcours_questionnaire|parcours_enquete|parcours_sondage', pl));
        const altDoc = ['elea', 'magistere', 'moodle'].map(pl => routeur.moduleDeTrame('parcours_document|parcours_wiki', pl));
        const { construirePromptPlan } = await import('/js/parcours/scenario-prompt.js');
        const catalogue = f => construirePromptPlan({ platform: 'magistere', format: f, ampleur: 'moyenne', trame: null, contexte: { quoi: 'X' } }).modules.map(m => m.cle);
        const bbb = { presentiel: catalogue('presentiel').includes('parcours_classe_virtuelle'), distanciel: catalogue('distanciel').includes('parcours_classe_virtuelle') };
        const images = await Promise.all(Object.keys(mp.MODULES_PARCOURS).map(async cle => {
            const src = routeur.imageModule(cle);
            return { cle, src, ok: !!src && (await fetch('/' + src, { method: 'HEAD' })).ok };
        }));
        const { construireCoursDocumentaire } = await import('/js/parcours/fiche-sequence.js');
        const cours = construireCoursDocumentaire({ titre: 'T', etapes: [{ cartes: [
            { module: 'parcours_questionnaire', titre: 'Q', contenu: CONTENUS.parcours_questionnaire },
            { module: 'parcours_lecon', titre: 'L', contenu: CONTENUS.parcours_lecon },
            { module: 'Page', titre: 'P', contenu: { title: 'P', blocks: [] } },
        ] }] });
        const { formatForDocument } = await import('/js/export/document-formatter.js').catch(() => ({}));
        const doc = cours.activities.map(a => ({ moduleKey: a.moduleKey, blocs: (a.jsonData.blocks || []).length, json: JSON.stringify(a.jsonData) }));

        return { fabriques, deterministe, idsDisjoints, q, qRetour, p, pRetour, pageBancale, palettes, glossaire, lien, gras, fichiersDoc,
            alt, altDoc, bbb, images, doc, ims, testEtudiant, promptPlan, promptNatif, promptH5p, catalogueIms, cloze, promptVote, promptPremierVote, isolement,
            registre: Object.entries(mp.MODULES_PARCOURS).map(([cle, d]) => ({ cle, moduleName: d.moduleName, platforms: d.platforms })),
            aFaire: paquet.aFaire, activites: paquet.activites, sections: paquet.sections, fichiers };
    }, CONTENUS);

    console.log('\n── 1. La forme, comparée au relevé du 27 sept. 2026 ───────');
    for (const [cle, f] of Object.entries(r.fabriques)) {
        ok(`${cle} : XML bien formé`, f.bienForme);
        const ref = releve(f.moduleName);
        if (!ref) { ok(`${cle} : un relevé existe pour ${f.moduleName}`, false); continue; }
        const nous = vocabulaire(f.xml);
        const eux = vocabulaire(ref.xml);
        const assumes = ECARTS_ASSUMES[f.moduleName] || [];
        const manquent = eux.filter(t => !nous.includes(t) && !assumes.includes(t));
        const enTrop = nous.filter(t => !eux.includes(t));
        ok(`${cle} (${f.moduleName}) : mêmes balises que le relevé ${ref.plat}`,
            !manquent.length && !enTrop.length,
            `manquent : ${manquent.join(', ') || '—'} · en trop : ${enTrop.join(', ') || '—'}`);
        const ordreNous = nous.filter(t => eux.includes(t));
        const ordreEux = eux.filter(t => nous.includes(t));
        ok(`${cle} : dans le même ordre`, JSON.stringify(ordreNous) === JSON.stringify(ordreEux),
            `${ordreNous.join(' ')}\n     ≠ ${ordreEux.join(' ')}`);

        console.log('');
        const completionRef = champ(ref.module, 'completion');
        const attendu = ACHEVEMENT_ASSUME[f.moduleName] ?? completionRef;
        ok(`${cle} : achèvement ${attendu} (relevé : ${completionRef})`, champ(f.module, 'completion') === attendu,
            `produit : ${champ(f.module, 'completion')}`);
        ok(`${cle} : ${f.sansAchevement ? 'déclaré' : 'non déclaré'} sans achèvement, en accord avec son module.xml`,
            f.sansAchevement === (champ(f.module, 'completion') === '0'));
    }

    console.log('\n── 2. Identifiants et déterminisme ─────────────────────────');
    ok('le même contenu donne le même XML', r.deterministe);
    ok('deux contenus différents n’emploient pas les mêmes identifiants imbriqués', r.idsDisjoints);
    const bbb = r.fabriques.parcours_classe_virtuelle.xml;
    ok('classe virtuelle : identifiant de salle opaque (40 hex), sans utilisateur nommé',
        /<meetingid>[0-9a-f]{40}<\/meetingid>/.test(bbb) && !/"selectiontype":"user"/.test(bbb.replace(/&quot;/g, '"')));

    console.log('\n── 3. Les formats texte (questions, pages) ─────────────────');
    ok('questions : texte → objets → texte, sans perte', JSON.stringify(r.q) === JSON.stringify(r.qRetour),
        JSON.stringify(r.qRetour));
    ok('pages : texte → objets → texte, sans perte', JSON.stringify(r.p) === JSON.stringify(r.pRetour),
        JSON.stringify(r.pRetour));
    ok('une question sans bonne réponse redevient une page à lire',
        r.pageBancale && !r.pageBancale.question && !r.pageBancale.reponses.length);
    const lecon = r.fabriques.parcours_lecon.xml;
    ok('leçon : page de contenu (qtype 20) puis question (qtype 3), la dernière mène à la fin (-9)',
        /<qtype>20<\/qtype>/.test(lecon) && /<qtype>3<\/qtype>/.test(lecon) && /<jumpto>-9<\/jumpto>/.test(lecon));
    const enquete = r.fabriques.parcours_enquete.xml;
    // Le saut de ligne s'écrit `&#10;` (escapeXml) ou brut (l'export) : même valeur une fois lu.
    ok('enquête : choix « r>>>>> » échappé comme dans le relevé', /<presentation>r&gt;&gt;&gt;&gt;&gt;A(?:\n|&#10;)\|B<\/presentation>/.test(enquete),
        (enquete.match(/<presentation>[^<]*/) || [''])[0]);

    ok('gras Markdown du modèle → <strong> dans une page de leçon',
        r.gras.lecon.includes('&lt;strong&gt;l&#8217;&#233;vaporation&lt;/strong&gt;'), (r.gras.lecon.match(/<contents>[^<]*/) || [''])[0]);
    ok('… et retiré des champs en texte brut (énoncé et choix d’une enquête)',
        !r.gras.enquete.includes('**') && r.gras.enquete.includes('<name>As-tu compris la condensation ?</name>'));

    console.log('\n── 4. Assemblage : ouverture progressive, « À faire » ──────');
    const sectionXml = n => Object.entries(r.fichiers).find(([k, v]) => /sections\/section_\d+\/section\.xml$/.test(k) && v.includes(`<number>${n}</number>`))?.[1] || '';
    const cmDe = nomModule => r.activites.filter(a => a.moduleName === nomModule).map(a => a.moduleId);
    const conditions = n => {
        const brut = (sectionXml(n).match(/<availabilityjson>([^<]*)<\/availabilityjson>/) || [])[1] || '';
        if (!brut || brut === '$@NULL@$') return [];
        const txt = brut.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        return JSON.parse(txt).c.map(c => c.cm);
    };
    const c2 = conditions(2);
    ok('l’étape 2 n’attend QUE le tableau (wiki et classe virtuelle n’ont pas d’achèvement)',
        c2.length === 1 && c2[0] === cmDe('board')[0], JSON.stringify(c2));
    const c3 = conditions(3);
    ok('l’étape 3 attend la leçon, pas l’atelier (dont les phases dépendent de l’enseignant)',
        c3.length === 1 && c3[0] === cmDe('lesson')[0], JSON.stringify(c3));
    ok('« À faire » liste l’atelier et la classe virtuelle', r.aFaire.length === 2
        && r.aFaire.some(l => l.includes('Atelier')) && r.aFaire.some(l => l.includes('Classe')), JSON.stringify(r.aFaire));
    const labels = Object.entries(r.fichiers).filter(([k]) => /activities\/label_\d+\/module\.xml$/.test(k));
    const cachees = labels.filter(([, v]) => /<visible>0<\/visible>/.test(v));
    ok('une seule étiquette cachée aux élèves : celle de l’enseignant', cachees.length === 1, `${cachees.length}`);
    const seq0 = (sectionXml(0).match(/<sequence>([^<]*)</) || [])[1] || '';
    const idCachee = cachees.length ? Number(cachees[0][0].match(/label_(\d+)/)[1]) : null;
    ok('elle ouvre la zone « Généralités »', Number(seq0.split(',')[0]) === idCachee, seq0);

    console.log('\n── 4 bis. Le fichier de départ du Document collaboratif (D75) ─');
    const fd = r.fichiersDoc;
    const docs = Object.keys(fd).filter(k => /activities\/collabora_\d+\/collabora\.xml$/.test(k));
    const manif = fd['files.xml'] || '';
    const blocs = manif.match(/<file id="\d+">[\s\S]*?<\/file>/g) || [];
    for (const chemin of docs) {
        const ctx = (fd[chemin].match(/contextid="(\d+)"/) || [])[1];
        const siens = blocs.filter(b => b.includes(`<contextid>${ctx}</contextid>`) && b.includes('<component>mod_collabora</component>') && b.includes('<filearea>initial</filearea>'));
        const txt = siens.find(b => /<filename>[^<]*\.txt<\/filename>/.test(b));
        const hash = txt && (txt.match(/<contenthash>([0-9a-f]{40})</) || [])[1];
        const ids = siens.map(b => b.match(/<file id="(\d+)"/)[1]);
        const inforef = fd[chemin.replace('collabora.xml', 'inforef.xml')] || '';
        ok(`${chemin} : fichier .txt + dossier « . » en zone initial, dans son contexte`, siens.length === 2 && !!txt, `${siens.length} entrée(s)`);
        ok(`${chemin} : son contenu est dans le pool`, !!hash && Object.prototype.hasOwnProperty.call(fd, `files/${hash.slice(0, 2)}/${hash}`));
        ok(`${chemin} : l'inforef de l'activité les référence`, ids.length === 2 && ids.every(id => inforef.includes(`<id>${id}</id>`)), inforef);
    }
    ok('deux documents : deux paires de fichiers, identifiants distincts',
        docs.length === 2 && new Set(blocs.map(b => b.match(/<file id="(\d+)"/)[1])).size === blocs.length);
    const premier = docs.map(c => fd[c]).find(x => x.includes('Compte rendu'));
    const ctx1 = premier && (premier.match(/contextid="(\d+)"/) || [])[1];
    const bloc1 = blocs.find(b => b.includes(`<contextid>${ctx1}</contextid>`) && /\.txt</.test(b)) || '';
    const hash1 = (bloc1.match(/<contenthash>([0-9a-f]{40})</) || [])[1];
    ok('le fichier porte le texte de départ, tel quel', hash1 && fd[`files/${hash1.slice(0, 2)}/${hash1}`] === 'Plan\n1. Hypothèse');
    ok('et un nom sans caractère interdit (« : » retiré, comme le greffon)', /<filename>Compte rendu l’expérience\.txt<\/filename>/.test(bloc1), (bloc1.match(/<filename>[^<]*/) || [''])[0]);

    console.log('\n── 5. Les palettes constatées ──────────────────────────────');
    ok('Etherpad sur Magistère seul', r.palettes.magistere.includes('parcours_etherpad')
        && !r.palettes.elea.includes('parcours_etherpad') && !r.palettes.moodle.includes('parcours_etherpad'));
    ok('Feedback absent de Magistère, présent sur Éléa et Moodle', !r.palettes.magistere.includes('parcours_enquete')
        && r.palettes.elea.includes('parcours_enquete') && r.palettes.moodle.includes('parcours_enquete'));
    ok('classe virtuelle : Magistère seul (D77)', r.palettes.magistere.includes('parcours_classe_virtuelle')
        && !r.palettes.elea.includes('parcours_classe_virtuelle') && !r.palettes.moodle.includes('parcours_classe_virtuelle'));
    for (const greffon of ['parcours_questionnaire', 'parcours_tableau', 'parcours_document', 'parcours_depot', 'parcours_choix_groupe']) {
        ok(`${greffon} : sur les deux plateformes académiques, pas sur un Moodle nu`,
            r.palettes.elea.includes(greffon) && r.palettes.magistere.includes(greffon) && !r.palettes.moodle.includes(greffon));
    }
    for (const noyau of ['parcours_lien', 'parcours_lecon', 'parcours_atelier', 'parcours_wiki', 'parcours_glossaire', 'parcours_base']) {
        ok(`${noyau} : du noyau Moodle, sur les trois plateformes`, ['elea', 'magistere', 'moodle'].every(pl => r.palettes[pl].includes(noyau)));
    }

    // Le registre contre les palettes RELEVÉES en direct (sept-2026/palettes.json) :
    // un module déclaré sur une plateforme DOIT y figurer ; un module présent dans
    // une palette mais non déclaré doit être un écart documenté.
    const palettesReleve = JSON.parse(readFileSync(join(REF, 'palettes.json'), 'utf8')).palettes;
    const noms = pl => new Set(palettesReleve[pl].map(x => x.name));
    const ECARTS_PALETTE = { 'bigbluebuttonbn@elea': 'D77 : visio non offerte sur Éléa (confirmé par Emmanuel), malgré le test03' };
    const fautes = [];
    for (const m of r.registre) {
        for (const [pl, nom] of [['elea', 'Éléa'], ['magistere', 'Magistère']]) {
            const declare = m.platforms.includes(nom);
            const present = noms(pl).has(m.moduleName);
            if (declare && !present) fautes.push(`${m.cle} déclaré sur ${nom} mais absent de sa palette`);
            if (!declare && present && !ECARTS_PALETTE[`${m.moduleName}@${pl}`]) fautes.push(`${m.cle} présent sur ${nom} mais non déclaré (écart non documenté)`);
        }
    }
    ok('le registre concorde avec les palettes relevées en direct (Éléa, Magistère)', fautes.length === 0, fautes.join(' · '));

    console.log('\n── 6. Le lien web ──────────────────────────────────────────');
    ok('la carte « Lien web » attend une adresse, comme une vidéo', r.lien.type === 'lien' && r.lien.manquante && !r.lien.fournie);
    ok('l’adresse posée est celle de la CARTE, pas celle du contenu généré', r.lien.adresse === 'https://nouvelle.example/page', r.lien.adresse);
    ok('l’adresse est échappée pour le XML', r.fabriques.parcours_lien.xml.includes('https://example.org/a?b=1&amp;c=2'));

    console.log('\n── 6 bis. Trames, modalités, vignettes, document (D76) ─────');
    ok('alternative « questionnaire | enquête | sondage » : questionnaire sur Éléa et Magistère, enquête sur Moodle',
        JSON.stringify(r.alt) === JSON.stringify(['parcours_questionnaire', 'parcours_questionnaire', 'parcours_enquete']), JSON.stringify(r.alt));
    ok('alternative « document | wiki » : wiki sur un Moodle nu', JSON.stringify(r.altDoc) === JSON.stringify(['parcours_document', 'parcours_document', 'parcours_wiki']), JSON.stringify(r.altDoc));
    ok('la classe virtuelle n’est pas proposée au modèle en présentiel, mais bien à distance', !r.bbb.presentiel && r.bbb.distanciel, JSON.stringify(r.bbb));
    const sansImage = r.images.filter(x => !x.ok);
    ok('chaque module de la plateforme a sa vignette, et le fichier existe', sansImage.length === 0, sansImage.map(x => `${x.cle} → ${x.src}`).join(' · '));
    ok('export documentaire : un module de la plateforme passe par le rendu d’une Page, avec un bloc par champ',
        r.doc[0].moduleKey === 'Page' && r.doc[0].blocs >= 2 && r.doc[1].moduleKey === 'Page', JSON.stringify(r.doc.map(d => [d.moduleKey, d.blocs])));
    ok('… sans aucun objet JSON brut (questions et pages en lignes lisibles)',
        !/\{\\?"texte\\?"|"type":"unique"/.test(r.doc[0].json) && /○/.test(r.doc[0].json) && /✓/.test(r.doc[1].json));

    console.log('\n── 8. Le Paquetage IMS ─────────────────────────────────────');
    const ims = r.ims;
    const zone = z => ims.blocs.filter(b => b.zone === z);
    ok('trois pages + le manifeste + le dossier « . » en zone content, révision 1',
        zone('content').length === 5 && zone('content').every(b => b.item === '1')
        && ['imsmanifest.xml', 'page-01.html', 'page-02.html', 'page-03.html', '.'].every(n => zone('content').some(b => b.nom === n)),
        JSON.stringify(zone('content').map(b => b.nom)));
    ok('l’archive d’origine + « . » en zone backup, comme au dépôt', zone('backup').length === 2 && /\.zip$/.test(ims.archive || ''), ims.archive);
    ok('tout est dans le pool, et l’inforef de l’activité référence chaque fichier',
        ims.pool && ims.blocs.every(b => ims.inforef.includes(`<id>${b.id}</id>`)), ims.inforef);
    ok('le Document collaboratif voisin garde son propre fichier (deux modules à fichiers dans un cours)', ims.collabora);
    ok('l’archive se relit, et porte exactement les fichiers déployés',
        !!ims.dansArchive && Object.keys(ims.dansArchive).sort().join() === 'imsmanifest.xml,page-01.html,page-02.html,page-03.html'
        && ims.dansArchive['page-01.html'] === ims.page1, JSON.stringify(Object.keys(ims.dansArchive || {})));
    // La structure est un `serialize()` PHP : chaque longueur doit être exacte, en OCTETS.
    const octets = x => new TextEncoder().encode(x).length;
    const longueurs = [...ims.structure.matchAll(/s:(\d+):"/g)].map(m => {
        const debut = m.index + m[0].length;
        let fin = debut;
        while (fin < ims.structure.length && octets(ims.structure.slice(debut, fin)) < Number(m[1])) fin++;
        return ims.structure.slice(fin, fin + 2) === '";';
    });
    ok('table des matières : sérialisation PHP aux longueurs exactes (accents et « & » compris)',
        longueurs.length === 18 && longueurs.every(Boolean) && /^a:3:\{i:0;a:4:\{s:4:"href";s:12:"page-01\.html";s:5:"title";/.test(ims.structure),
        ims.structure.slice(0, 160));
    ok('… qui nomme les pages comme le manifeste', ims.structure.includes('"Élève & famille"')
        && ims.manifeste.includes('<title>Élève &amp; famille</title>') && ims.manifeste.includes('identifierref="res-3"'));
    ok('manifeste IMS bien formé : une ressource par page', /<resource identifier="res-3" type="webcontent" href="page-03\.html">/.test(ims.manifeste || '')
        && ims.manifesteBienForme);
    ok('page : document HTML complet, dans la langue de l’interface, sans ressource externe',
        /^<!DOCTYPE html>\n<html lang="fr">/.test(ims.page1 || '') && !/(?:src|href)="https?:/.test(ims.page1 || ''), (ims.page1 || '').slice(0, 80));
    ok('page : titre, intertitre, liste et gras rendus', /<h1>Pourquoi protéger \?<\/h1>/.test(ims.page1 || '') && /<h2>Ce que dit la loi<\/h2>/.test(ims.page1 || '')
        && /<ul>\n<li>minimiser<\/li>\n<li>informer<\/li>\n<\/ul>/.test(ims.page1 || '') && ims.page1.includes('<strong>personnelles</strong>'));
    ok('page : « & » et « < » du texte échappés', (ims.page3 || '').includes('<h1>Élève &amp; famille</h1>'));
    ok('nom d’activité échappé pour le XML', ims.xml.includes('<name>Donn&#233;es &amp; &#171; vie priv&#233;e &#187; &lt;essentiel&gt;</name>'), (ims.xml.match(/<name>[^<]*/) || [''])[0]);
    ok('le même contenu donne le même cours', ims.deterministe);
    ok('chapitres : texte → objets → texte, sans perte (intertitre « ## » compris)',
        JSON.stringify(ims.chapitres) === JSON.stringify(ims.chapitresRetour), JSON.stringify(ims.chapitresRetour));
    ok('un paquetage sans page est refusé (jamais une coquille vide)', ims.sansPage);
    ok('une entrée de glossaire écrite en intertitre (« ## **terme** : … ») redevient un paragraphe',
        /<p><strong>Base légale<\/strong> : fondement/.test(ims.maladroit.page) && /<h2>Ce que dit la loi<\/h2>/.test(ims.maladroit.page), ims.maladroit.page.slice(-400));
    ok('un terme n’est mis en gras qu’à sa première apparition (page et consigne)',
        (ims.maladroit.page.match(/<strong>/g) || []).length === 2 && (ims.maladroit.xml.match(/&lt;strong&gt;/g) || []).length === 1,
        `${(ims.maladroit.page.match(/<strong>/g) || []).length} dans la page`);
    ok('proposé dans la mosaïque des trois plateformes, jamais par le plan de l’IA',
        r.catalogueIms.every(c => c.mosaique && !c.plan), JSON.stringify(r.catalogueIms));

    console.log('\n── 8 bis. Le Test étudiant (D89) ───────────────────────────');
    const te = r.testEtudiant;
    const refTe = releve('studentquiz');
    ok('Test étudiant : dans la mosaïque d’Éléa seulement (absent des palettes de Magistère et de Moodle)',
        te.catalogue[0].mosaique && !te.catalogue[1].mosaique && !te.catalogue[2].mosaique, JSON.stringify(te.catalogue));
    ok('… jamais proposé par le plan : il se choisit dans la mosaïque', te.catalogue.every(c => !c.plan), JSON.stringify(te.catalogue));
    // Barème de points, types de questions, publication… : les valeurs d'Éléa, sauf ce que D89 règle.
    const reglesD89 = ['coursemodule', 'name', 'intro', 'completionpoint', 'completionquestionpublished'];
    const scalaires = [...refTe.xml.matchAll(/<([a-z]+)>([^<]*)<\/\1>/g)].map(m => m[1]).filter(t => !reglesD89.includes(t));
    const differents = scalaires.filter(t => champ(te.xml, t) !== champ(refTe.xml, t));
    ok(`… ses ${scalaires.length} réglages sont ceux d’Éléa (barème, types de questions, publication)`, differents.length === 0,
        differents.map(t => `${t} : ${champ(te.xml, t)} ≠ ${champ(refTe.xml, t)}`).join(' · '));
    ok('… arrive vide : aucune question, tentative, note ni commentaire d’élève',
        ['attempts', 'questions', 'progresses', 'rates', 'comments', 'notifications', 'statehistories']
            .every(t => new RegExp(`<${t}>\\s*</${t}>`).test(te.xml)));
    ok('achèvement : avoir créé une question (et rien qui dépende des autres élèves)',
        champ(te.module, 'completion') === '2' && champ(te.module, 'completionview') === '0'
        && champ(te.xml, 'completionquestionpublished') === '1' && champ(te.xml, 'completionpoint') === '0'
        && champ(te.xml, 'completionquestionapproved') === '0',
        `completion ${champ(te.module, 'completion')}, publiée ${champ(te.xml, 'completionquestionpublished')}, points ${champ(te.xml, 'completionpoint')}`);
    const cmTe = te.activites.find(a => a.moduleName === 'studentquiz')?.moduleId;
    ok('<coursemodule> = identifiant du module dans le cours (la restauration le traduit par get_mappingid)',
        !!cmTe && champ(te.xml, 'coursemodule') === String(cmTe)
        && te.xml.includes(`moduleid="${cmTe}"`) && te.module.includes(`<module id="${cmTe}"`),
        `coursemodule ${champ(te.xml, 'coursemodule')}, module ${cmTe}`);
    ok('… recalé après l’assemblage : la fabrique seule pose l’identifiant neutre, qui ne désigne pas le module',
        champ(r.fabriques.parcours_test_etudiant.xml, 'coursemodule') === '1' && String(cmTe) !== '1');
    ok('… et le recalage ne touche que le Test étudiant',
        te.recale['activities/studentquiz_42/studentquiz.xml'].includes('<coursemodule>42</coursemodule>')
        && te.recale['activities/wiki_43/wiki.xml'].includes('<coursemodule>1</coursemodule>'));
    const conditionsTe = Object.values(te.sections).find(v => v.includes('<number>2</number>'))?.match(/<availabilityjson>([^<]*)<\/availabilityjson>/)?.[1] || '';
    const cmsTe = conditionsTe && conditionsTe !== '$@NULL@$'
        ? JSON.parse(conditionsTe.replace(/&quot;/g, '"').replace(/&amp;/g, '&')).c.map(c => c.cm) : [];
    ok('ouverture progressive : l’étape 2 attend le Test étudiant (le wiki n’a pas d’achèvement)',
        cmsTe.length === 1 && cmsTe[0] === cmTe, JSON.stringify(cmsTe));
    ok('le prompt : une consigne, sans promettre de note, avec un test qui arrive vide',
        te.prompt.includes('arrive VIDE') && te.prompt.includes("N'annonce ni note ni évaluation"), te.prompt.slice(-600));
    ok('famille « coopérer » : la classe écrit ensemble sa banque de questions', te.famille === 'cooperer', te.famille);

    console.log('\n── 9. Ce que lit le participant ────────────────────────────');
    for (const [nom, prompt] of [['plan', r.promptPlan], ['module de la plateforme', r.promptNatif], ['activité H5P', r.promptH5p]]) {
        ok(`prompt ${nom} : registre déduit du public, le même pour tout le parcours`,
            prompt.includes('vouvoiement pour des adultes') && prompt.includes('public visé : Enseignants en formation continue'));
        ok(`prompt ${nom} : le jargon des instructions est interdit dans les textes`, prompt.includes('jamais « notions pivots »'));
    }
    ok('le vocabulaire imposé ne s’appelle plus « notions pivots … MOT POUR MOT »',
        !/NOTIONS PIVOTS|MOT POUR MOT/.test(r.promptNatif) && r.promptNatif.includes('VOCABULAIRE DU PARCOURS'));
    ok('module de la plateforme : s’adresse à qui suit le parcours, pas « à l’élève »', !/À L'ÉLÈVE/.test(r.promptNatif));
    ok('un second sondage reçoit les réponses du premier, pour comparer les avis',
        r.promptVote.includes('« plutôt oui », « peut-être », « plutôt non »') && r.promptVote.includes('EXACTEMENT les mêmes réponses')
        && !r.promptPremierVote.includes('EXACTEMENT les mêmes réponses'));
    ok('un sondage ne demande pas de justification écrite (plan et module)',
        r.promptVote.includes('ne demande ni justification') && r.promptPlan.includes('Un sondage recueille un vote'));
    ok('question à trous du 28 sept. (« {1:NUMERICAL:=Réponse attendue:0} ») : la CARTE échoue, avec son numéro',
        r.cloze.reel === 'test_cloze_injouable:2', r.cloze.reel);
    ok('… et les exports XML et .mbz la refusent aussi', r.cloze.xml === 'test_cloze_injouable:2' && r.cloze.mbz === 'test_cloze_injouable:2');
    ok('trou sans bonne réponse, question sans trou : refusés', r.cloze.sansBonne && r.cloze.sansTrou);
    ok('trous valides (nombre, virgule décimale, joker « * », texte, choix) : acceptés', r.cloze.valide === null, r.cloze.valide);
    ok('message dédié, traduit', r.cloze.message === 'test_cloze_injouable');
    ok('les exemples communs des activités sont ceux d’avant : aucun retour impersonnel n’y est écrit',
        r.isolement.langue === 'fr' && !r.isolement.communsModifies.length, r.isolement.communsModifies.join(' · '));
    ok('chaque retour à substituer se trouve encore dans l’exemple commun (sinon la substitution ne ferait plus rien)',
        !r.isolement.mortes.length, r.isolement.mortes.join(' · '));
    ok('une activité créée seule garde ses retours d’exemple tels quels',
        r.isolement.individuelTutoie && r.isolement.individuelSansImpersonnel);
    ok('la même activité, dans un parcours, reçoit les retours à l’impersonnel',
        r.isolement.parcoursSansTutoiement && r.isolement.parcoursImpersonnel);

    console.log('\n── 7. Le routeur ───────────────────────────────────────────');
    ok('« Glossary » et « glossary » restent le lexique H5P ; le glossaire à construire garde sa clé',
        JSON.stringify(r.glossaire) === JSON.stringify(['Glossary', 'Glossary', 'parcours_glossaire']), JSON.stringify(r.glossaire));

    ok('aucune erreur de page', pageErrors.length === 0, pageErrors.join(' | '));
    await browser.close();
} catch (e) {
    console.error(e);
    exitCode = 1;
} finally {
    stop();
}

console.log('\n========================================');
console.log(`parcours — modules natifs : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(exitCode || (fail ? 1 : 0));
