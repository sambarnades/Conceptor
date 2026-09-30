/**
 * run_parcours_atelier.mjs — La file de fabrication et le scénario du parcours.
 *
 * Ce que ce banc protège, dans l'ordre d'importance :
 *
 *  1. **La sérialité.** D7 tient tout le module : le backend ILaaS est
 *     mutualisé, et deux appels qui se chevauchent fabriquent des replis de
 *     modèle en cascade qu'on prend ensuite pour un défaut de Caramel. Le test
 *     horodate l'entrée et la sortie de chaque appel et refuse le moindre
 *     recouvrement. Un futur `Promise.all` bien intentionné le fera virer au
 *     rouge.
 *  2. **`json-healer.js`, jamais contourné.** Le modèle rend un JSON sans
 *     `overallFeedback` ; s'il ressort avec, c'est que le réparateur est passé.
 *  3. **Le socle commun.** Les notions pivots mot pour mot, l'historique arrêté
 *     à la carte courante, et l'interdiction de réintroduire.
 *  4. **Un échec n'arrête pas la file**, et se rattrape à l'unité.
 *  5. **L'aller-retour du scénario** : ce qui sort du fichier doit être ce qui y
 *     est entré, contenus générés compris — sans quoi rouvrir un parcours
 *     signifierait repayer toutes ses générations.
 *  6. **L'atelier vit DANS la page** (D39) : par de vrais clics — le bouton
 *     d'en-tête bascule les tuiles et l'atelier, le formulaire au-dessus reste
 *     vivant, la fabrication démarre d'elle-même après « Fabriquer », et
 *     « Revenir aux activités » rend la page exactement comme avant.
 *
 * Le modèle de langue est REMPLACÉ par une doublure (`appelModele`) : ce banc
 * teste l'orchestration, pas la qualité des textes, et doit pouvoir tourner sans
 * réseau ni quota.
 *
 * Lancement :  node tests/run_parcours_atelier.mjs
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8113;

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

let exitCode = 0;
try {
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    // « Partir du modèle » poste le relevé d'usage du parcours (D69) : un banc
    // n'écrit jamais dans le Grist réel. Aucun webhook n8n ne part d'ici.
    const webhooksBloques = [];
    await page.route('**/webhook/**', r => {
        let corps = null;
        try { corps = r.request().postDataJSON(); } catch { /* GET ou corps non JSON */ }
        webhooksBloques.push({ url: r.request().url(), corps });
        return r.abort();
    });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0,
        null, { timeout: 60000, polling: 200 });

    const r = await page.evaluate(async () => {
        const { creerFile, cartesAPlat, reparer, ETATS } = await import('/js/parcours/parcours-runner.js');
        const { construireSocleCommun, construirePromptRemplissage, nbElementsCarte } =
            await import('/js/parcours/scenario-prompt.js');
        const { versScenario, depuisScenario } = await import('/js/parcours/scenario-io.js');

        /** Un plan de trois cartes réparties en deux étapes. */
        const faireDraft = () => ({
            version: '0.1.0',
            platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'revision',
            contexte: {
                qui: 'un professeur d\'histoire', quoi: 'la traite atlantique',
                niveau: 'quatrième', corpus: '', corpusLength: 0, sources: [],
            },
            plan: {
                titre: 'La traite atlantique',
                objectifGeneral: 'Comprendre le commerce triangulaire',
                notionsPivots: ['le commerce triangulaire', 'le Code noir', 'les ports négriers'],
                origine: 'revision', personnalise: false,
                // Le réglage de Carte de progression fait partie du plan : il
                // doit voyager dans le scénario comme le reste, et un thème
                // devenu inconnu doit se rattraper à la relecture plutôt que de
                // partir vers un import que le greffon ferait échouer.
                carte: { actif: true, theme: 'planisphère' },
                progression: { actif: true },
                etapes: [
                    { id: 'e1', titre: 'Découvrir', objectif: 'Identifier les acteurs', cartes: [
                        { id: 'c1', titre: 'Les mots de la traite', objectif: 'Mémoriser le vocabulaire',
                          consigne: 'Retourner les cartes', module: 'Flashcards', palier: 'decouverte',
                          duree: 10, verrouillee: false, moduleReplie: false },
                        { id: 'c2', titre: 'La leçon', objectif: 'Lire la synthèse',
                          consigne: 'Lire la page', module: 'Page', palier: 'decouverte',
                          duree: 15, verrouillee: false, moduleReplie: false },
                    ] },
                    { id: 'e2', titre: "S'entraîner", objectif: 'Vérifier ses acquis', cartes: [
                        { id: 'c3', titre: 'Le quiz', objectif: 'Se tester',
                          consigne: 'Répondre aux questions', module: 'MultipleChoice',
                          palier: 'entrainement', duree: 12, verrouillee: false, moduleReplie: false },
                    ] },
                ],
            },
        });

        // --- Réponses de la doublure. Le JSON arrive VOLONTAIREMENT dans un bloc
        //     de code markdown avec une virgule en trop : c'est ce que rendent
        //     réellement certains modèles, et le chemin de nettoyage doit tenir.
        const REPONSES = {
            Flashcards: `\`\`\`json
{"title":"Les mots de la traite","description":"Révisez.","cards":[
  {"text":"Le commerce triangulaire","answer":"Le circuit Europe-Afrique-Amériques"},
  {"text":"Le Code noir","answer":"Le texte qui régit l'esclavage colonial"},
]}
\`\`\``,
            Page: `{"title":"La leçon","intro":"Synthèse.","blocks":[
  {"type":"heading","content":"Les ports négriers"},
  {"type":"paragraph","content":"Nantes, Bordeaux et La Rochelle arment les navires."}]}`,
            MultipleChoice: `{"title":"Le quiz","question":"Quel port arme le plus de navires ?",
  "answers":[{"text":"Nantes","correct":true},{"text":"Marseille","correct":false}]}`,
        };

        /* ---------------------------------------------------------- 1. sérialité */
        const draft = faireDraft();
        const journal = [];
        const file = creerFile(draft, {
            appelModele: async (prompt, carte) => {
                const entree = performance.now();
                await new Promise(res => setTimeout(res, 60));
                const sortie = performance.now();
                journal.push({ module: carte.module, entree, sortie, longueurPrompt: prompt.length });
                return REPONSES[carte.module];
            },
        });
        const final = await file.demarrer();

        // Recouvrement : un appel commence-t-il avant que le précédent soit revenu ?
        let recouvrements = 0;
        for (let i = 1; i < journal.length; i++) {
            if (journal[i].entree < journal[i - 1].sortie - 0.5) recouvrements++;
        }

        /* ------------------------------------------------- 2. socle et prompt */
        const cartes = cartesAPlat(draft.plan);
        const socle1 = construireSocleCommun(draft.plan, cartes[0].carte);
        const socle3 = construireSocleCommun(draft.plan, cartes[2].carte);
        const { prompt: promptC3 } = await construirePromptRemplissage(draft, cartes[2].carte);

        /* ------------------------------------------------------ 3. échec + reprise */
        const draft2 = faireDraft();
        let tours = 0;
        const file2 = creerFile(draft2, {
            appelModele: async (prompt, carte) => {
                tours++;
                // La 2ᵉ carte échoue au premier passage, et seulement à celui-là.
                if (carte.id === 'c2' && tours <= 3) throw new Error('panne simulée');
                return REPONSES[carte.module];
            },
        });
        const apresEchec = await file2.demarrer();
        const apresReprise = await file2.refaire('c2');

        /* --------------------------------------------------- 4. aller-retour scénario */
        const scenario = JSON.parse(JSON.stringify(versScenario(draft)));
        const relu = depuisScenario(JSON.stringify(scenario));
        const cartesRelues = relu.plan.etapes.flatMap(e => e.cartes);

        let scenarioRefuse = null;
        try { depuisScenario('{"produit":"autre chose"}'); }
        catch (e) { scenarioRefuse = e.message; }

        // Un scénario plus ancien peut nommer un thème que le catalogue amont ne
        // connaît plus : il doit retomber sur le thème par défaut.
        const scenarioVieilliseur = JSON.parse(JSON.stringify(scenario));
        scenarioVieilliseur.plan.carte = { actif: true, theme: 'un-thème-retiré' };
        const carteVieillie = depuisScenario(JSON.stringify(scenarioVieilliseur)).plan.carte;

        /* ------------------------------------------------------------ 5. réparateur */
        const repareH5P = await reparer({ title: 'X', cards: [] }, 'Flashcards');

        return {
            statuts: final.lignes.map(l => ({ id: l.id, statut: l.statut })),
            faites: final.faites,
            total: final.total,
            recouvrements,
            ordre: journal.map(j => j.module),
            longueurs: journal.map(j => j.longueurPrompt),
            // Le healer a-t-il posé ce que le modèle n'avait pas donné ?
            flashcardsOverall: Boolean(cartes[0].carte.contenu && cartes[0].carte.contenu.overallFeedback),
            flashcardsCartes: (cartes[0].carte.contenu && cartes[0].carte.contenu.cards || []).length,
            titreImpose: cartes[0].carte.contenu && cartes[0].carte.contenu.title,
            socle1, socle3, promptC3,
            nbElements: cartes.map(({ carte }) => nbElementsCarte(carte)),
            apresEchec: { statuts: apresEchec.lignes.map(l => l.statut), echecs: apresEchec.echecs, faites: apresEchec.faites },
            apresReprise: { statuts: apresReprise.lignes.map(l => l.statut), echecs: apresReprise.echecs, faites: apresReprise.faites },
            relu: {
                titre: relu.plan.titre,
                platform: relu.platform,
                notions: relu.plan.notionsPivots,
                cartes: cartesRelues.map(c => ({ id: c.id, module: c.module, avecContenu: Boolean(c.contenu) })),
                carte: relu.plan.carte,
                progression: relu.plan.progression,
            },
            carteVieillie,
            scenarioRefuse,
            repareH5P: Object.keys(repareH5P).sort(),
            ETATS,
        };
    });

    console.log('\n── La file, en série ───────────────────────────────────────');
    ok('les 3 cartes du plan sont fabriquées', r.faites === 3 && r.total === 3,
        JSON.stringify(r.statuts));
    ok('AUCUN recouvrement entre deux appels au modèle', r.recouvrements === 0,
        `${r.recouvrements} recouvrement(s)`);
    ok('l’ordre du plan est respecté',
        r.ordre.join(',') === 'Flashcards,Page,MultipleChoice', r.ordre.join(','));
    ok('chaque prompt est complet (pas un gabarit vide)',
        r.longueurs.every(n => n > 500), r.longueurs.join(', '));

    console.log('\n── Le réparateur, jamais contourné ─────────────────────────');
    ok('le modèle n’avait pas posé overallFeedback — le healer l’a fait',
        r.flashcardsOverall);
    ok('le JSON en bloc markdown, virgule en trop comprise, est relu',
        r.flashcardsCartes === 2, `${r.flashcardsCartes} carte(s)`);
    ok('le titre du plan prime sur celui du modèle',
        r.titreImpose === 'Les mots de la traite', String(r.titreImpose));
    ok('reparer() pose overallFeedback ET behaviour sur un H5P',
        r.repareH5P.includes('overallFeedback') && r.repareH5P.includes('behaviour'),
        r.repareH5P.join(', '));

    console.log('\n── Le socle commun ─────────────────────────────────────────');
    ok('les notions pivots y sont mot pour mot',
        ['le commerce triangulaire', 'le Code noir', 'les ports négriers']
            .every(n => r.socle1.includes(n)));
    ok('la 1ʳᵉ carte est annoncée comme première, sans acquis supposé',
        /PREMIÈRE/.test(r.socle1));
    ok('la 3ᵉ carte connaît les deux activités qui la précèdent',
        r.socle3.includes('Les mots de la traite') && r.socle3.includes('La leçon'));
    ok('elle ne connaît PAS ce qui vient après elle',
        !r.socle3.includes('Le quiz'));
    ok('la consigne « réinvestis, ne réintroduis pas » est posée',
        /RÉINVESTIS/.test(r.socle3) && /RÉINTRODUIS/.test(r.socle3));
    ok('le prompt d’une carte porte le cadre du parcours',
        r.promptC3.includes('CADRE DU PARCOURS'));
    ok('il porte aussi la structure JSON attendue par le processeur',
        /STRUCTURE DU JSON|JSON STRUCTURE/i.test(r.promptC3));
    ok('il annonce le palier de la carte', /entra[îi]nement/i.test(r.promptC3));
    ok('le nombre d’éléments suit la durée, borné par le palier',
        JSON.stringify(r.nbElements) === JSON.stringify([5, 6, 6]), JSON.stringify(r.nbElements));

    console.log('\n── Un échec n’arrête pas la file ───────────────────────────');
    ok('la carte en panne est marquée en échec',
        r.apresEchec.statuts[1] === r.ETATS.echouee, r.apresEchec.statuts.join(', '));
    ok('la file a continué APRÈS l’échec',
        r.apresEchec.statuts[2] === r.ETATS.faite, r.apresEchec.statuts.join(', '));
    ok('deux cartes sur trois sont tout de même prêtes', r.apresEchec.faites === 2);
    ok('la reprise à l’unité rattrape la carte en panne',
        r.apresReprise.faites === 3 && r.apresReprise.echecs === 0,
        r.apresReprise.statuts.join(', '));

    console.log('\n── Le scénario, aller et retour ────────────────────────────');
    ok('le titre et le cadrage reviennent',
        r.relu.titre === 'La traite atlantique' && r.relu.platform === 'elea');
    ok('les notions pivots reviennent', r.relu.notions.length === 3);
    ok('les trois cartes reviennent avec leur module',
        r.relu.cartes.map(c => c.module).join(',') === 'Flashcards,Page,MultipleChoice',
        JSON.stringify(r.relu.cartes));
    ok('LES CONTENUS GÉNÉRÉS reviennent — rouvrir ne coûte aucune génération',
        r.relu.cartes.every(c => c.avecContenu), JSON.stringify(r.relu.cartes));
    ok('un fichier étranger est refusé, avec un motif traduisible',
        r.scenarioRefuse === 'parcours_scenario_illisible', String(r.scenarioRefuse));
    ok('le réglage de Carte de progression revient avec son thème',
        r.relu.carte && r.relu.carte.actif === true && r.relu.carte.theme === 'planisphère',
        JSON.stringify(r.relu.carte));
    ok('un thème disparu du catalogue retombe sur le thème par défaut à la relecture',
        r.carteVieillie && r.carteVieillie.theme === 'paysage',
        JSON.stringify(r.carteVieillie));
    ok('le réglage d’ouverture progressive revient lui aussi',
        r.relu.progression && r.relu.progression.actif === true,
        JSON.stringify(r.relu.progression));

    /* ----------------------------------------------------- 6. les écrans, dans le DOM */
    console.log('\n── Les écrans, dans le DOM réel ────────────────────────────');
    const dom = await page.evaluate(async () => {
        // Le sujet vient de la page d'accueil : l'atelier ne le ressaisit pas (D2).
        document.getElementById('quoi').value = 'la traite atlantique';

        const parcours = await import('/js/parcours/index.js');
        parcours.__testHooks.ouvrirAtelier();

        const draft = (await import('/js/parcours/state.js')).ouvrirBrouillon();
        const { planDepuisTrame } = await import('/js/parcours/screen-plan.js');
        draft.plan = planDepuisTrame('revision', 'elea');
        // Une carte déjà remplie : l'écran doit la montrer prête sans rien relancer.
        // Un contenu VALABLE pour son module : un quiz sans question fait planter
        // l'aperçu H5P, ce qu'aucune génération réelle ne produit.
        draft.plan.etapes[0].cartes[0].contenu = await (await fetch('/assets/data/examples/quiz_vraifaux_1.json')).json();

        // L'écran du PLAN d'abord : la relecture didactique s'y affiche.
        parcours.__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 120));
        const lireRelecture = () => {
            const bloc = document.querySelector('.pc-relecture');
            return {
                present: !!bloc,
                ok: bloc ? bloc.classList.contains('pc-relecture--ok') : null,
                compte: bloc ? (bloc.querySelector('.pc-relecture__compte') || {}).textContent : null,
                nbItems: bloc ? bloc.querySelectorAll('.pc-relecture__item').length : 0,
                marquesEtape: document.querySelectorAll('.pc-etape--attention').length,
                marquesCarte: document.querySelectorAll('.pc-carte--attention').length,
                plier: bloc ? (bloc.querySelector('.pc-relecture__plier') || {}).textContent : null,
            };
        };
        const relectureTrame = lireRelecture();

        // Les DIX-SEPT trames livrées avec Caramel, passées à leur propre
        // relecture. Une trame ne peut pas porter d'objectifs (c'est ce que
        // l'enseignant écrit), mais sa STRUCTURE est notre travail : elle doit
        // tenir les quatre autres repères. Le jour où ce contrôle est né il a
        // trouvé quatre étapes « entraînement » où rien ne corrigeait.
        const { TRAMES } = await import('/js/parcours/templates.js');
        const { relirePlan } = await import('/js/parcours/garde-fous.js');

        // Les trames sont-elles RÉELLEMENT exploitables sur chaque plateforme ?
        // Une trame qui nomme un module absent de la palette visée ne casse
        // rien : le routeur lui substitue un repli et marque la carte. Mais
        // c'est une dégradation silencieuse au moment du choix — l'enseignant
        // choisit « Millionnaire » et reçoit autre chose. On relève donc, trame
        // par trame et plateforme par plateforme, ce qui se replierait.
        const replis = {};
        for (const pid of ['elea', 'magistere', 'moodle']) {
            replis[pid] = TRAMES.map((tr) => {
                const pl = planDepuisTrame(tr.id, pid);
                if (!pl) return null;
                const repliees = pl.etapes.flatMap(e => e.cartes)
                    .filter(c => c.moduleReplie).length;
                return repliees ? { id: tr.id, repliees } : null;
            }).filter(Boolean);
        }
        const A_REMPLIR = new Set(['objectif_general', 'objectif_par_etape']);
        const trames = TRAMES.map((tr) => {
            const p = planDepuisTrame(tr.id, 'elea');
            // La « Structure libre » ouvre des étapes VIDES : rien à relire.
            if (!p || p.etapes.every(e => !e.cartes.length)) return { id: tr.id, sansStructure: true };
            const ko = relirePlan(p).filter(c => !c.ok && !A_REMPLIR.has(c.cle));
            return { id: tr.id, fautes: ko.map(c => c.cle) };
        });

        // On casse le plan sous ses yeux : le bloc doit suivre SANS redessin manuel.
        // C'est ce qui distingue une relecture d'un rapport.
        const champObjectif = document.querySelector('.pc-etape__objectif')
            || document.querySelector('.pc-etape textarea, .pc-etape input[type="text"]');
        let relectureApresCasse = null;
        if (champObjectif) {
            const avant = champObjectif.value;
            champObjectif.value = '';
            champObjectif.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 60));
            relectureApresCasse = lireRelecture();
            champObjectif.value = avant;
            champObjectif.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 60));
        }

        // Déplier : les six repères doivent apparaître, y compris ceux qui passent.
        const boutonPlier = document.querySelector('.pc-relecture__plier');
        let relectureDepliee = null;
        if (boutonPlier) {
            boutonPlier.click();
            await new Promise(r => setTimeout(r, 60));
            relectureDepliee = lireRelecture();
        }

        // La Carte de progression : un réglage du PLAN, propre à Éléa (D29, D26).
        // On la lit dans le DOM réel — c'est là qu'un enseignant la rencontre.
        // Les deux blocs de réglage partagent leurs classes de mise en forme :
        // on les distingue donc par ce qu'ils CONTIENNENT — la Carte a un menu
        // de thème, l'ouverture progressive a sa ligne de raison. Se fier à la
        // classe de la ligne désignerait le premier des deux venu.
        const ligneReglage = (marqueur) => [...document.querySelectorAll('.pc-reglage')]
            .find(l => l.parentElement && l.parentElement.querySelector(marqueur)
                       || l.querySelector(marqueur));
        // Le thème se choisit dans une GALERIE de vignettes, visible la case
        // cochée seulement (retour d'Emmanuel, 6 sept. 2026).
        const lireCarte = () => {
            const bloc = ligneReglage('.pc-galerie');
            if (!bloc) return { present: false };
            const c = bloc.querySelector('input[type="checkbox"]');
            const galerie = bloc.querySelector('.pc-galerie');
            const items = [...galerie.querySelectorAll('.pc-galerie__item')];
            const choisi = items.find(it => it.getAttribute('aria-checked') === 'true');
            return {
                present: true,
                titreReglages: document.querySelector('.pc-plan-reglages > summary')?.textContent || '',
                cochee: c.checked,
                galerieCachee: galerie.hidden,
                nbThemes: items.length,
                themeChoisi: choisi ? choisi.dataset.theme : null,
                nomsMajuscule: items.every(it => /^[A-ZÀ-Ý]/.test(it.querySelector('.pc-galerie__nom').textContent)),
                vignettes: items.every(it => /assets\/images\/parcours\/cartes\/.+\.jpg$/.test(it.querySelector('img').getAttribute('src'))),
                unSeulArret: items.filter(it => it.tabIndex === 0).length === 1,
                role: galerie.getAttribute('role'),
            };
        };
        const carteAvant = lireCarte();
        const bascule = (ligneReglage('.pc-galerie') || {}).querySelector
            ? ligneReglage('.pc-galerie').querySelector('input[type="checkbox"]') : null;
        if (bascule) {
            bascule.checked = true;
            bascule.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 60));
        }
        const carteApres = lireCarte();
        // Un clic sur une vignette change le thème du plan.
        const autre = [...document.querySelectorAll('.pc-galerie__item')].find(it => it.dataset.theme === 'cerveau');
        if (autre) autre.click();
        await new Promise(r => setTimeout(r, 60));
        const carteApresClic = lireCarte();
        const carteDansLePlan = JSON.parse(JSON.stringify(draft.plan.carte || null));

        // L'ouverture progressive : une case qui ne ferait rien en silence serait
        // exactement ce que ce module refuse. Sur une seule étape, elle doit se
        // désactiver EN LE DISANT.
        // Les deux réglages vivent dans la MÊME carte : la case de l'ouverture
        // progressive est celle de la ligne qui PORTE sa raison, pas la
        // première de la carte (qui est celle de la Carte, sur Éléa).
        const ligneProgression = () => {
            const raison = document.querySelector('.pc-progression__raison');
            return raison ? raison.closest('.pc-reglage') : null;
        };
        const lireProgression = () => {
            const ligne = ligneProgression();
            if (!ligne) return { present: false };
            const c = ligne.querySelector('input[type="checkbox"]');
            return {
                present: true,
                cochee: c.checked,
                desactivee: c.disabled,
                raison: (document.querySelector('.pc-progression__raison') || {}).textContent || '',
            };
        };
        const progAvant = lireProgression();
        const basculeProg = ligneProgression().querySelector('input[type="checkbox"]');
        basculeProg.checked = true;
        basculeProg.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 60));
        const progApres = lireProgression();
        const progDansLePlan = JSON.parse(JSON.stringify(draft.plan.progression || null));

        // Réduit à une seule étape : la case doit se fermer et dire pourquoi.
        const toutesLesEtapes = draft.plan.etapes;
        draft.plan.etapes = [toutesLesEtapes[0]];
        parcours.__testHooks.allerA(2);
        await new Promise(r => setTimeout(r, 80));
        parcours.__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 120));
        const progUneEtape = lireProgression();
        draft.plan.etapes = toutesLesEtapes;

        // Le miroir (D4) : sept tuiles EN BAS de l'écran, et les constats écrits
        // en toutes lettres — une absence signalée par la seule pâleur d'une
        // tuile serait une information portée par la couleur seule.
        const lireMiroir = () => {
            const bloc = document.querySelector('.pc-miroir');
            if (!bloc) return { present: false };
            return {
                present: true,
                tuiles: [...bloc.querySelectorAll('.pc-summary__item')].map(t => ({
                    valeur: t.querySelector('.pc-summary__val').textContent,
                    libelle: t.querySelector('.pc-summary__lab').textContent,
                    vide: t.classList.contains('pc-summary__item--vide'),
                })),
                constats: [...bloc.querySelectorAll('.pc-miroir__constat')]
                    .map(c => c.textContent),
                // Le miroir se regarde APRÈS avoir bâti : il doit venir après les
                // étapes dans le document, pas avant.
                apresLesEtapes: !!(document.querySelector('.pc-etapes')
                    && document.querySelector('.pc-etapes').compareDocumentPosition(bloc)
                       & Node.DOCUMENT_POSITION_FOLLOWING),
            };
        };
        const miroir = lireMiroir();

        // --- Le glisser-déposer, EN SURCOUCHE des flèches.
        //
        // Le plan vient d'être ramené à toutes ses étapes après le test « une
        // seule étape » : il faut REDESSINER, sinon on interrogerait un DOM qui
        // ne montre plus le plan qu'on manipule.
        parcours.__testHooks.allerA(2);
        await new Promise(r => setTimeout(r, 80));
        parcours.__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 120));

        // On synthétise de vrais `DragEvent` : c'est le seul moyen d'exercer le
        // chemin réel, `page.dragAndDrop` ne déclenchant pas le protocole HTML5.
        const cartesDuPlan = () => draft.plan.etapes.map(e => e.cartes.map(c => c.id));
        const noeudCarte = (id) => document.querySelector(`.pc-carte[data-carte="${id}"]`);
        const glisserSur = (idSource, idCible, avant) => {
            const source = noeudCarte(idSource);
            const cible = noeudCarte(idCible);
            if (!source || !cible) throw new Error(`carte introuvable : ${idSource} → ${idCible}`);
            const dt = new DataTransfer();
            source.querySelector('.pc-carte__icone')
                .dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
            const r = cible.getBoundingClientRect();
            const y = avant ? r.top + 2 : r.bottom - 2;
            for (const type of ['dragover', 'drop']) {
                cible.dispatchEvent(new DragEvent(type, {
                    dataTransfer: dt, bubbles: true, cancelable: true, clientY: y,
                }));
            }
        };

        const dnd = { avant: cartesDuPlan() };
        // Les trames n'ont pas toutes deux activités dans leur PREMIÈRE étape :
        // on prend la première étape qui en a deux, plutôt que de supposer.
        const iDeux = dnd.avant.findIndex(e => e.length >= 2);
        const iAutre = dnd.avant.findIndex((e, i) => i !== iDeux && e.length >= 1);
        dnd.etapes = { iDeux, iAutre };

        const premiere = noeudCarte(dnd.avant[iDeux][0]);
        dnd.poignee = {
            draggable: premiere.querySelector('.pc-carte__icone').draggable,
            titre: premiere.querySelector('.pc-carte__icone').title,
            // « Jamais à leur place » : les quatre boutons de la carte restent.
            boutons: premiere.querySelectorAll('.pc-carte__actions button').length,
            // La poignée ne double PAS le chemin clavier : hors tabulation.
            horsTabulation: !premiere.querySelector('.pc-carte__icone').hasAttribute('tabindex'),
        };

        // 1. Dans une même étape : la deuxième carte passe avant la première.
        glisserSur(dnd.avant[iDeux][1], dnd.avant[iDeux][0], true);
        await new Promise(r => setTimeout(r, 80));
        dnd.memeEtape = cartesDuPlan();

        // 2. D'une étape à l'autre : une carte rejoint la tête d'une autre étape.
        const aDeplacer = dnd.memeEtape[iAutre][0];
        glisserSur(aDeplacer, dnd.memeEtape[iDeux][0], true);
        await new Promise(r => setTimeout(r, 80));
        dnd.autreEtape = cartesDuPlan();
        dnd.deplacee = aDeplacer;

        // 2 bis. Déplacer une carte VERS L'AVANT dans sa propre étape.
        //
        // C'est le seul cas qui distingue le décalage d'index du `splice` :
        // retirer la carte décale tout ce qui la suit, donc l'index de dépôt
        // doit reculer d'un cran. Il faut TROIS cartes dans l'étape pour que
        // l'erreur se voie — avec deux, les deux calculs donnent le même ordre.
        // L'étape `iDeux` en compte trois depuis le déplacement précédent.
        const troisCartes = cartesDuPlan()[iDeux];
        glisserSur(troisCartes[0], troisCartes[1], false);
        await new Promise(r => setTimeout(r, 80));
        dnd.versAvant = { attendu: [troisCartes[1], troisCartes[0], troisCartes[2]],
                          obtenu: cartesDuPlan()[iDeux] };

        // 3. Reposer une carte là où elle est ne doit RIEN marquer : sans garde,
        //    un glissement sans effet ferait basculer le plan en « personnalisé ».
        draft.plan.personnalise = false;
        const etat = cartesDuPlan();
        glisserSur(etat[iDeux][0], etat[iDeux][0], true);
        await new Promise(r => setTimeout(r, 80));
        dnd.surPlace = { avant: etat, ordre: cartesDuPlan(), personnalise: draft.plan.personnalise };

        // Même plan, plateforme sans le greffon : le bloc ne doit pas exister.
        draft.platform = 'magistere';
        parcours.__testHooks.allerA(2);
        await new Promise(r => setTimeout(r, 80));
        parcours.__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 120));
        const carteMagistere = lireCarte();
        draft.platform = 'elea';

        parcours.__testHooks.allerA(2);
        await new Promise(r => setTimeout(r, 120));

        const lignes = [...document.querySelectorAll('.pc-carte--fab')];
        // Une seule activité est prête à ce stade : l'aperçu ne doit ni compter
        // les cinq coquilles vides, ni permettre d'y basculer en édition via
        // « Suivante ».
        const cartePrete = draft.plan.etapes.flatMap(e => e.cartes).find(c => c.contenu);
        const { ouvrirActivite } = await import('/js/parcours/activity-panel.js');
        await ouvrirActivite(draft, cartePrete);
        const panneauPartiel = document.querySelector('.pc-editeur');
        const boutonsNavigation = panneauPartiel
            ? [...panneauPartiel.querySelectorAll('.pc-lecture__navigation button')] : [];
        const apercuPartiel = {
            position: panneauPartiel?.querySelector('.pc-lecture__position')?.textContent.trim() || '',
            precedenteDesactivee: boutonsNavigation[1]?.disabled || false,
            suivanteDesactivee: boutonsNavigation[2]?.disabled || false,
            apercuActif: panneauPartiel?.querySelector('.pc-lecture__modes button:first-child')?.getAttribute('aria-pressed') || '',
        };
        panneauPartiel?.querySelector('.pc-editeur__fermer')?.click();
        for (let i = 0; i < 30 && document.querySelector('.pc-editeur'); i++) {
            await new Promise(r => setTimeout(r, 20));
        }
        const actionPrete = document.querySelector('.pc-carte--faite [data-action="external"]');
        const actionAttente = document.querySelector('.pc-carte--attente [data-action="external"]');
        const actionsIa = {
            libellePrete: actionPrete?.textContent.trim() || '',
            iconePrete: !!actionPrete?.querySelector('.fa-arrows-rotate'),
            libelleAttente: actionAttente?.textContent.trim() || '',
            uneParLigne: lignes.every(l => l.querySelectorAll('[data-action="external"]').length === 1
                && !l.querySelector('[data-action="regenerer"]')),
        };
        const cta = document.querySelector('#pc-cta');
        const releve = {
            relectureTrame, relectureApresCasse, relectureDepliee, trames, replis,
            carteAvant, carteApres, carteApresClic, carteDansLePlan, carteMagistere,
            progAvant, progApres, progDansLePlan, progUneEtape, miroir, dnd, actionsIa, apercuPartiel,
            lignes: lignes.length,
            pretes: document.querySelectorAll('.pc-carte--faite').length,
            attente: document.querySelectorAll('.pc-carte--attente').length,
            ctaFabrication: cta ? cta.textContent.trim() : null,
            noteFabrication: (document.querySelector('#pc-action-note') || {}).textContent,
            jauge: !!document.querySelector('.pc-avancement__piste[role="progressbar"]'),
            clesBrutes: [...document.querySelectorAll('.pc-page *')]
                .map(n => n.textContent || '')
                .filter(txt => /^parcours_[a-z_]+$/.test(txt.trim())),
        };

        parcours.__testHooks.allerA(3);
        await new Promise(r => setTimeout(r, 120));
        releve.livraison = {
            titreFichier: !!document.querySelector('.pc-marche'),
            boutonMbz: !!document.querySelector('[data-liv="mbz"]'),
            manques: !!document.querySelector('.pc-block--alerte'),
            etapesMarche: document.querySelectorAll('.pc-marche li').length,
            ctaLivraison: (document.querySelector('#pc-cta') || {}).textContent,
            // Le papier : deux documents, trois formats chacun.
            lignesPapier: document.querySelectorAll('.pc-papier__ligne').length,
            boutonsPapier: document.querySelectorAll('.pc-papier__ligne button').length,
            quoiPapier: [...document.querySelectorAll('.pc-papier__quoi')].map(x => x.textContent),
        };

        parcours.__testHooks.fermerAtelier();

        // Point de reprise : l'atelier fermé, l'entrée de la barre doit porter son rappel,
        // et le rouvrir doit ramener sur le PLAN, pas sur le cadrage.
        const { brouillonEnAttente } = await import('/js/parcours/state.js');
        releve.reprise = {
            enAttente: brouillonEnAttente(),
            entreeMarquee: !!document.querySelector('.pc-commutateur__b--reprise'),
        };
        const e = document.querySelector('#parcours-button');
        const groupe = document.querySelector('#pc-commutateur');
        releve.entree = {
            dansPage: groupe?.parentElement?.id === 'main-content',
            apresLeFormulaire: !!groupe?.previousElementSibling?.matches('.prompt-generator'),
            deuxSegments: groupe ? groupe.querySelectorAll('[role="radio"]').length : 0,
            libelle: e ? (e.querySelector('.pc-commutateur__label') || {}).textContent : null,
            libelleActivite: (document.querySelector('#activites-button .pc-commutateur__label') || {}).textContent,
            pastille: document.querySelectorAll('.pc-fab, .pc-entree').length,
        };
        parcours.__testHooks.ouvrirAtelier();
        await new Promise(r => setTimeout(r, 120));
        releve.reprise.ecranRouvert = document.querySelector('.pc-steps__item--current')?.textContent || '';
        releve.reprise.planRetrouve = !!document.querySelector('.pc-title-input');
        parcours.__testHooks.fermerAtelier();

        return releve;
    });

    ok('l’écran de fabrication liste toutes les activités du plan',
        dom.lignes === 6, `${dom.lignes} ligne(s)`);
    ok('la carte déjà remplie est montrée prête, les autres en attente',
        dom.pretes === 1 && dom.attente === 5, `${dom.pretes} prête(s) / ${dom.attente} en attente`);
    ok('la jauge d’avancement est une vraie barre de progression accessible', dom.jauge);
    ok('avec une seule activité prête, l’aperçu indique 1 / 1 et ne mène pas aux cinq activités vides',
        dom.apercuPartiel.position === '1 / 1'
        && dom.apercuPartiel.precedenteDesactivee
        && dom.apercuPartiel.suivanteDesactivee
        && dom.apercuPartiel.apercuActif === 'true',
        JSON.stringify(dom.apercuPartiel));
    ok('chaque ligne ne présente qu’une seule entrée IA, sans doublon de régénération',
        dom.actionsIa.uneParLigne, JSON.stringify(dom.actionsIa));
    ok('l’entrée IA dit clairement si elle génère ou refait le contenu',
        dom.actionsIa.libellePrete === 'Générer à nouveau'
        && dom.actionsIa.iconePrete
        && dom.actionsIa.libelleAttente === 'Générer avec l’IA',
        JSON.stringify(dom.actionsIa));
    // D64 : une activité déjà prête n'est jamais refaite, et le bouton le dit —
    // il génère les CINQ manquantes, pas six.
    ok('l’action primaire complète le parcours avec les seules activités manquantes',
        /[(（]5[)）]/.test(dom.ctaFabrication || ''), String(dom.ctaFabrication));
    ok('la note reste vide quand rien ne demande d’attention', !(dom.noteFabrication || '').trim(), String(dom.noteFabrication));
    ok('aucune clé de traduction brute à l’écran',
        dom.clesBrutes.length === 0, dom.clesBrutes.join(', '));

    ok('l’écran du plan propose la Carte de progression, décochée par défaut',
        dom.carteAvant.present && dom.carteAvant.cochee === false
        && /carte de progression/i.test(dom.carteAvant.titreReglages),
        JSON.stringify(dom.carteAvant));
    ok('sa galerie de vignettes reste cachée tant que la case ne l’est pas',
        dom.carteAvant.galerieCachee === true, JSON.stringify(dom.carteAvant));
    ok('elle propose les 30 thèmes du catalogue, sur « paysage » par défaut, une vignette embarquée chacun',
        dom.carteAvant.nbThemes === 30 && dom.carteAvant.themeChoisi === 'paysage' && dom.carteAvant.vignettes,
        JSON.stringify(dom.carteAvant));
    ok('les noms des thèmes commencent par une majuscule, et la galerie est un groupe radio à un seul arrêt',
        dom.carteAvant.nomsMajuscule && dom.carteAvant.role === 'radiogroup' && dom.carteAvant.unSeulArret,
        JSON.stringify(dom.carteAvant));
    ok('cocher la case montre la galerie, et cliquer une vignette change le thème du plan',
        dom.carteApres.galerieCachee === false
        && dom.carteApresClic.themeChoisi === 'cerveau'
        && dom.carteDansLePlan && dom.carteDansLePlan.actif === true
        && dom.carteDansLePlan.theme === 'cerveau',
        JSON.stringify({ apres: dom.carteApres, clic: dom.carteApresClic, plan: dom.carteDansLePlan }));
    ok('sur une plateforme sans le greffon, le bloc n’existe pas du tout',
        dom.carteMagistere.present === false, JSON.stringify(dom.carteMagistere));

    ok('l’écran du plan propose l’ouverture progressive, décochée par défaut',
        dom.progAvant.present && dom.progAvant.cochee === false
        && dom.progAvant.desactivee === false,
        JSON.stringify(dom.progAvant));
    ok('cocher la case se retrouve dans le plan',
        dom.progApres.cochee === true
        && dom.progDansLePlan && dom.progDansLePlan.actif === true,
        JSON.stringify(dom.progDansLePlan));
    console.log('\n── Le glisser-déposer, en surcouche des flèches ────────────');
    ok('la vignette est une poignée, avec son intitulé traduit',
        dom.dnd.poignee.draggable === true
        && dom.dnd.poignee.titre && !/^parcours_/.test(dom.dnd.poignee.titre),
        JSON.stringify(dom.dnd.poignee));
    ok('les quatre boutons de la carte sont TOUJOURS là — jamais à leur place',
        dom.dnd.poignee.boutons === 4, String(dom.dnd.poignee.boutons));
    ok('la poignée reste hors tabulation : les flèches sont le chemin accessible',
        dom.dnd.poignee.horsTabulation);
    const { iDeux, iAutre } = dom.dnd.etapes;
    ok('glisser une carte au-dessus d’une autre les réordonne dans le plan',
        dom.dnd.memeEtape[iDeux].slice(0, 2).join(',')
            === [dom.dnd.avant[iDeux][1], dom.dnd.avant[iDeux][0]].join(','),
        `${dom.dnd.avant[iDeux]} → ${dom.dnd.memeEtape[iDeux]}`);
    ok('glisser une carte dans une AUTRE étape l’y déplace vraiment',
        dom.dnd.autreEtape[iDeux][0] === dom.dnd.deplacee
        && !dom.dnd.autreEtape[iAutre].includes(dom.dnd.deplacee),
        JSON.stringify(dom.dnd.autreEtape));
    ok('déplacer une carte VERS L’AVANT tient compte du décalage du splice',
        dom.dnd.versAvant.obtenu.join(',') === dom.dnd.versAvant.attendu.join(','),
        `attendu ${dom.dnd.versAvant.attendu} · obtenu ${dom.dnd.versAvant.obtenu}`);
    ok('reposer une carte sur elle-même ne change rien et ne marque RIEN',
        dom.dnd.surPlace.ordre.join('|') === dom.dnd.surPlace.avant.join('|')
        && dom.dnd.surPlace.personnalise === false,
        JSON.stringify(dom.dnd.surPlace));

    ok('le miroir affiche les SEPT familles, en bas de l’écran du plan',
        dom.miroir.present && dom.miroir.tuiles.length === 7 && dom.miroir.apresLesEtapes,
        JSON.stringify(dom.miroir.tuiles));
    ok('ses libellés sont traduits, pas des clés brutes',
        dom.miroir.tuiles.every(t => t.libelle && !/^parcours_/.test(t.libelle)),
        dom.miroir.tuiles.map(t => t.libelle).join(' · '));
    ok('les familles absentes sont dites EN TOUTES LETTRES, pas seulement pâlies',
        dom.miroir.tuiles.some(t => t.vide) && dom.miroir.constats.length > 0
        && dom.miroir.constats.every(c => c && !/^parcours_/.test(c)),
        JSON.stringify(dom.miroir.constats));

    ok('sur une seule étape la case se ferme, et la raison est ÉCRITE',
        dom.progUneEtape.desactivee === true
        && dom.progUneEtape.raison.trim().length > 0
        && !/^parcours_/.test(dom.progUneEtape.raison.trim()),
        JSON.stringify(dom.progUneEtape));

    ok('l’écran de livraison porte le bouton de téléchargement', dom.livraison.boutonMbz);
    ok('il porte la marche à suivre en trois temps', dom.livraison.etapesMarche === 3);
    ok('il annonce les activités manquantes', dom.livraison.manques);
    ok('il propose DEUX documents papier : la fiche et le détail',
        dom.livraison.lignesPapier === 2, `${dom.livraison.lignesPapier} ligne(s)`);
    ok('chacun dans les trois formats, sans en privilégier un',
        dom.livraison.boutonsPapier === 6, `${dom.livraison.boutonsPapier} bouton(s)`);
    ok('et leurs libellés distinguent bien le PLAN du CONTENU',
        dom.livraison.quoiPapier.length === 2
        && dom.livraison.quoiPapier.every(x => x && !/^parcours_/.test(x))
        && dom.livraison.quoiPapier[0] !== dom.livraison.quoiPapier[1],
        JSON.stringify(dom.livraison.quoiPapier));

    ok('l’action primaire y devient « Terminer »',
        (dom.livraison.ctaLivraison || '').trim().length > 0, String(dom.livraison.ctaLivraison));

    console.log('\n── La relecture didactique, à l’écran ──────────────────────');
    const rl = dom.relectureTrame || {};
    ok('le bloc de relecture est présent sur l’écran du plan', rl.present === true);
    ok('il annonce un décompte, pas une clé brute',
        typeof rl.compte === 'string' && rl.compte.length > 0 && !/^parcours_/.test(rl.compte),
        String(rl.compte));
    ok('il propose de voir les six repères', typeof rl.plier === 'string' && rl.plier.length > 0,
        String(rl.plier));
    // Une trame est un SQUELETTE : ses objectifs sont précisément ce que
    // l'enseignant vient écrire, et la relecture les réclame — c'est sa
    // fonction, pas un défaut. Ce qu'on exige d'une trame livrée avec Caramel,
    // c'est qu'elle ne pèche sur RIEN D'AUTRE : sa STRUCTURE, elle, est notre
    // travail. Le contrôle a servi dès sa première exécution — il a trouvé
    // quatre étapes étiquetées « entraînement » où rien ne corrigeait.
    ok('une trame ne réclame QUE les objectifs, qui sont à l’enseignant',
        rl.nbItems === 2, `${rl.nbItems} point(s) — ${rl.compte}`);
    ok('sa structure, elle, est irréprochable : aucune activité marquée',
        rl.marquesCarte === 0, `${rl.marquesCarte} activité(s)`);

    const boiteuses = (dom.trames || []).filter(x => x.fautes && x.fautes.length);
    for (const pid of ['elea', 'magistere', 'moodle']) {
        ok(`sur ${pid}, aucune trame ne se replie en silence sur un autre module`,
            dom.replis[pid].length === 0,
            dom.replis[pid].map(r => `${r.id} : ${r.repliees} carte(s)`).join(' · '));
    }
    ok('toutes les trames du dépôt tiennent la relecture sur leur STRUCTURE',
        boiteuses.length === 0,
        boiteuses.map(x => `${x.id} → ${x.fautes.join(', ')}`).join(' | '));

    const rc = dom.relectureApresCasse;
    ok('vider un objectif d’étape allume la relecture SUR-LE-CHAMP',
        rc && rc.ok === false && rc.nbItems > 0, JSON.stringify(rc));
    ok('et surligne l’étape en cause', rc && rc.marquesEtape >= 1, JSON.stringify(rc));

    const rd = dom.relectureDepliee;
    ok('déplier montre les SIX repères, ceux qui passent compris',
        rd && rd.nbItems === 6, rd ? `${rd.nbItems} affiché(s)` : 'bouton absent');

    console.log('\n── Le point de reprise ─────────────────────────────────────');
    ok('un plan en cours est retenu entre deux ouvertures', dom.reprise.enAttente);
    ok('le segment « Un parcours » du commutateur porte son point de reprise', dom.reprise.entreeMarquee);
    ok('le commutateur est sous le formulaire commun, avec ses deux segments',
        dom.entree && dom.entree.dansPage && dom.entree.apresLeFormulaire && dom.entree.deuxSegments === 2
        && dom.entree.libelle === 'Un parcours' && dom.entree.libelleActivite === 'Une activité',
        JSON.stringify(dom.entree));
    ok('et ni pastille flottante ni ancien bouton ne subsistent', dom.entree && dom.entree.pastille === 0);
    ok('rouvrir l’atelier ramène sur le PLAN, pas sur le cadrage',
        dom.reprise.planRetrouve, `écran « ${dom.reprise.ecranRouvert} »`);

    /* ----------------------------------------------- 7. l'atelier dans la page (D39) */
    console.log('\n── L’atelier dans la page, par de vrais clics (D39) ────────');
    // On repart d'un brouillon vierge et d'un sujet vide : le premier clic doit
    // ouvrir sur le CADRAGE, avec une action primaire qui attend le sujet.
    await page.evaluate(async () => {
        (await import('/js/parcours/state.js')).reinitialiser();
        document.getElementById('quoi').value = '';
    });
    // L'en-tête, SANS le commutateur : lui seul a le droit de changer d'état.
    const enTeteSansEntree = `(() => {
        const clone = document.querySelector('.app-bar').cloneNode(true);
        const e = clone.querySelector('#pc-commutateur');
        if (e) e.remove();
        return clone.innerHTML;
    })()`;
    const avant = await page.evaluate((src) => ({
        enTete: document.querySelector('.app-bar').children.length,
        enTeteHtml: eval(src),
        filtres: getComputedStyle(document.querySelector('.filter-bar')).display,
        grille: getComputedStyle(document.querySelector('.activity-grid')).display,
        formulaireStyle: ['borderRadius', 'marginBottom', 'boxShadow'].map(k => getComputedStyle(document.querySelector('.prompt-generator'))[k]),
    }), enTeteSansEntree);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.click('#parcours-button');
    await page.waitForTimeout(250);
    const ouvert = await page.evaluate((src) => {
        const at = document.querySelector('#pc-atelier');
        const e = document.querySelector('#parcours-button');
        return {
            present: !!at,
            hote: at && at.parentElement.id,
            sousLeFormulaire: !!(at && at.previousElementSibling
                && at.previousElementSibling.matches('.pc-commutateur')
                && at.previousElementSibling.previousElementSibling?.matches('.prompt-generator')),
            formulaireVisible: getComputedStyle(document.querySelector('.prompt-generator')).display !== 'none',
            ongletsMode: document.querySelectorAll('.mode-tab').length,
            filtres: getComputedStyle(document.querySelector('.filter-bar')).display,
            grille: getComputedStyle(document.querySelector('.activity-grid')).display,
            enTete: document.querySelector('.app-bar').children.length,
            enTeteHtml: eval(src),
            coquille: document.querySelectorAll('.pc-shell, .pc-topbar').length,
            verrou: document.body.classList.contains('pc-locked'),
            allume: e.getAttribute('aria-checked'),
            autreEteint: document.querySelector('#activites-button').getAttribute('aria-checked'),
            unSeulArret: [...document.querySelectorAll('#pc-commutateur [role="radio"]')].filter(b => b.tabIndex === 0).length,
            titre: e.getAttribute('title'),
            role: document.querySelector('#pc-commutateur').getAttribute('role'),
            nomGroupe: document.querySelector('#pc-commutateur').getAttribute('aria-label'),
            marque: document.querySelectorAll('.pc-atelier__mark, .pc-quitter').length,
            focus: document.activeElement && document.activeElement.id,
            scrollY: window.scrollY,
            ecran: (document.querySelector('.pc-steps__item--current') || {}).textContent,
            ctaInactif: document.querySelector('#pc-cta').disabled,
            largeurAtelier: Math.round(at.getBoundingClientRect().width),
            largeurFormulaire: Math.round(document.querySelector('.prompt-generator').getBoundingClientRect().width),
            contexteRecopie: document.querySelectorAll('.pc-context, .pc-context__row').length,
        };
    }, enTeteSansEntree);
    ok('le sélecteur ouvre l’atelier DANS la page, sous le formulaire et le choix du résultat',
        ouvert.present && ouvert.hote === 'main-content' && ouvert.sousLeFormulaire, JSON.stringify(ouvert));
    ok('le formulaire et ses onglets Rapide/Avancé restent visibles',
        ouvert.formulaireVisible && ouvert.ongletsMode === 2);
    ok('les tuiles et la barre de filtres s’effacent VRAIMENT (display, pas seulement `hidden`)',
        ouvert.filtres === 'none' && ouvert.grille === 'none',
        `filtres ${ouvert.filtres}, grille ${ouvert.grille}`);
    ok('l’atelier a la largeur du formulaire, ni plus ni moins',
        ouvert.largeurAtelier === ouvert.largeurFormulaire,
        `${ouvert.largeurAtelier} vs ${ouvert.largeurFormulaire}`);
    ok('l’en-tête du site ne change pas d’un octet (hors l’état du bouton d’entrée)',
        ouvert.enTete === avant.enTete && ouvert.enTeteHtml === avant.enTeteHtml);
    ok('aucune coquille plein écran, aucun verrou de défilement',
        ouvert.coquille === 0 && ouvert.verrou === false);
    ok('ouvert, le segment « Un parcours » est allumé, l’autre éteint : un groupe radio nommé, à un seul arrêt',
        ouvert.allume === 'true' && ouvert.autreEteint === 'false' && ouvert.unSeulArret === 1
        && ouvert.role === 'radiogroup' && ouvert.nomGroupe === 'Que souhaitez-vous créer ?'
        && ouvert.titre === 'Créer un parcours',
        JSON.stringify({ allume: ouvert.allume, autre: ouvert.autreEteint, arrets: ouvert.unSeulArret, role: ouvert.role, nom: ouvert.nomGroupe, titre: ouvert.titre }));
    ok('la tête de l’atelier n’a ni cartouche ni lien de sortie : le nom et le fil, rien d’autre',
        ouvert.marque === 0);
    ok('ouvrir un nouveau parcours garde le focus sur le choix du mode', ouvert.focus === 'parcours-button', String(ouvert.focus));
    ok('sujet vide : ouvrir le cadrage ne fait pas défiler la page', ouvert.scrollY === 0, String(ouvert.scrollY));
    ok('sujet vide : cadrage ouvert, action primaire inactive',
        /Cadrage/.test(ouvert.ecran || '') && ouvert.ctaInactif);
    ok('le contexte n’est plus recopié : le formulaire est juste au-dessus',
        ouvert.contexteRecopie === 0);
    // Une coupe de CSS avait emporté les règles de `.pc-page` (7 sept. 2026) :
    // les blocs se collaient. On mesure l'air entre deux blocs, pas la règle.
    const air = await page.evaluate(() => {
        const blocs = [...document.querySelectorAll('.pc-page > .pc-block')];
        if (blocs.length < 2) return -1;
        const a = blocs[0].getBoundingClientRect(), b = blocs[1].getBoundingClientRect();
        return Math.round(b.top - a.bottom);
    });
    ok('deux blocs de l’écran sont séparés d’au moins 30 px d’air', air >= 30, `${air} px`);

    // Le formulaire vit : taper le sujet AU-DESSUS débloque l'action EN BAS.
    await page.fill('#quoi', 'la traite atlantique');
    await page.waitForTimeout(120);
    const apresSujet = await page.evaluate(() => ({
        ctaInactif: document.querySelector('#pc-cta').disabled,
        note: document.querySelector('#pc-action-note').textContent,
    }));
    ok('taper le sujet dans le formulaire débloque l’action primaire sans rien rouvrir',
        apresSujet.ctaInactif === false, JSON.stringify(apresSujet));

    // Le vocabulaire suit la plateforme, sur les vrais boutons et dans les douze
    // langues. Le choix de modalité et les champs restent intacts (D54).
    const formats = page.locator('.pc-page > .pc-block').nth(1);
    await formats.locator('.pc-choice').first().click();
    let plateformeAvantLangue = 'elea';
    for (const lang of ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br']) {
        const textes = JSON.parse(readFileSync(join(ROOT, 'js/locales', `${lang}.json`), 'utf8'));
        await page.evaluate(async lang => {
            await (await import('/js/core/translation.js')).loadTranslations(lang);
        }, lang);
        const descInitiale = await formats.locator('.pc-choice__desc').first().textContent();
        const cleInitiale = plateformeAvantLangue === 'elea' ? 'parcours_format_presentiel_desc'
            : `parcours_format_presentiel_desc_${plateformeAvantLangue}`;
        ok(`${lang} : changer la langue conserve le vocabulaire de la plateforme choisie`,
            descInitiale === textes[cleInitiale], descInitiale);

        for (const plateforme of ['elea', 'magistere', 'moodle']) {
            const presentielAvant = await formats.locator('.pc-choice').first().elementHandle();
            await page.locator(`.pc-choice--${plateforme}`).click();
            const choix = await presentielAvant.evaluate(async bouton => {
                const { ouvrirBrouillon } = await import('/js/parcours/state.js');
                const d = ouvrirBrouillon();
                return {
                    memeBouton: bouton.isConnected,
                    selection: bouton.getAttribute('aria-pressed'),
                    nom: bouton.querySelector('.pc-choice__name').textContent,
                    description: bouton.querySelector('.pc-choice__desc').textContent,
                    hybride: bouton.parentElement.lastElementChild.querySelector('.pc-choice__desc').textContent,
                    focus: document.activeElement.className,
                    plateforme: d.platform,
                    modalite: d.format,
                    sujet: document.querySelector('#quoi').value,
                };
            });
            await presentielAvant.dispose();
            const scolaire = plateforme === 'elea';
            ok(`${lang}/${plateforme} : libellés adaptés, sélection, focus et sujet conservés`,
                choix.memeBouton && choix.selection === 'true' && choix.modalite === 'presentiel'
                && choix.plateforme === plateforme && choix.focus.includes(`pc-choice--${plateforme}`)
                && choix.sujet === 'la traite atlantique'
                && choix.nom === textes[scolaire ? 'parcours_format_presentiel' : 'parcours_format_presentiel_sur_place']
                && choix.description === textes[scolaire ? 'parcours_format_presentiel_desc' : `parcours_format_presentiel_desc_${plateforme}`]
                && choix.hybride === textes[scolaire ? 'parcours_format_hybride_desc' : 'parcours_format_hybride_desc_distance'],
                JSON.stringify(choix));
        }
        plateformeAvantLangue = 'moodle';
    }
    // La réouverture lit le brouillon ; elle ne revient pas aux libellés Éléa.
    await page.click('#activites-button');
    await page.click('#parcours-button');
    ok('rouvrir le cadrage conserve Moodle et le vocabulaire breton correspondant',
        await page.locator('.pc-choice--moodle').getAttribute('aria-pressed') === 'true'
        && await formats.locator('.pc-choice__desc').first().textContent() === "Ho studierien a zo dirazoc'h");
    await page.evaluate(async () => {
        await (await import('/js/core/translation.js')).loadTranslations('fr');
    });
    await page.locator('.pc-choice--magistere').click();
    ok('Magistère s’adresse bien aux stagiaires en français',
        await formats.locator('.pc-choice__desc').first().textContent() === 'Vos stagiaires sont devant vous');
    await page.locator('.pc-choice--moodle').click();
    ok('Moodle s’adresse bien aux étudiants en français',
        await formats.locator('.pc-choice__desc').first().textContent() === 'Vos étudiants sont devant vous');
    await page.locator('.pc-choice--elea').click();
    await formats.locator('.pc-choice').nth(1).click();

    const apercusTrames = await page.evaluate(() => {
        const cartes = [...document.querySelectorAll('.pc-trame:not(.pc-trame--auto)')];
        const lignes = new Map();
        for (const carte of cartes) {
            const apercu = carte.querySelector('.pc-apercu');
            if (!apercu) continue;
            const ligne = Math.round(carte.getBoundingClientRect().top);
            if (!lignes.has(ligne)) lignes.set(ligne, []);
            lignes.get(ligne).push(apercu.getBoundingClientRect().top);
        }
        return {
            ecarts: [...lignes.values()].filter(v => v.length > 1).map(v => Math.max(...v) - Math.min(...v)),
            motsCroisesEnPastille: [...document.querySelectorAll('.pc-apercu__module')]
                .some(n => /mots croisés/i.test(n.textContent || '')),
        };
    });
    ok('les séparateurs des trames sont alignés sur chaque ligne',
        apercusTrames.ecarts.length > 0 && apercusTrames.ecarts.every(ecart => ecart <= 1), JSON.stringify(apercusTrames));
    ok('les activités des trames sont lisibles séparément, dont les mots croisés',
        apercusTrames.motsCroisesEnPastille, JSON.stringify(apercusTrames));

    // Les descriptions longues restent comparables en deux lignes, mais leur
    // contenu n'est jamais perdu : un vrai bouton les déplie et les replie au
    // clavier sans sélectionner la trame par mégarde.
    // Trois modèles seulement à l'écran (D91) : aucun descriptif français n'y
    // déborde. On en allonge un, comme le ferait une langue plus longue, pour
    // éprouver le repli ; il est rendu à la fin de ces contrôles.
    await page.evaluate(async () => {
        const { translations } = await import('/js/core/translation.js');
        const { tramesCompatibles } = await import('/js/parcours/templates.js');
        const { brouillon } = await import('/js/parcours/state.js');
        const d = brouillon();
        const premiere = tramesCompatibles(d.format, d.ampleur).find(tr => tr.id !== 'libre');
        window.__descriptifOrigine = [premiere.descKey, translations[premiere.descKey]];
        translations[premiere.descKey] = Array(3).fill(translations[premiere.descKey]).join(' ');
    });
    await formats.locator('.pc-choice').nth(1).click();
    const descriptifLong = page.locator('.pc-trame:not(.pc-trame--auto) .pc-trame__desc-toggle:not([hidden])').first();
    const descriptifCompact = await descriptifLong.evaluate((bascule) => {
        const carte = bascule.closest('.pc-trame');
        const description = carte.querySelector('.pc-trame__desc');
        const select = carte.querySelector('.pc-trame__select');
        const meta = carte.querySelector('.pc-trame__meta');
        const style = getComputedStyle(description);
        return {
            hauteur: description.getBoundingClientRect().height,
            troisLignes: parseFloat(style.lineHeight) * 3,
            descriptionBas: description.getBoundingClientRect().bottom,
            basculeHaut: bascule.getBoundingClientRect().top,
            basculeDroite: bascule.getBoundingClientRect().right,
            ligneDroite: bascule.parentElement.getBoundingClientRect().right,
            metaMilieu: meta && (meta.getBoundingClientRect().top + meta.getBoundingClientRect().bottom) / 2,
            basculeMilieu: (bascule.getBoundingClientRect().top + bascule.getBoundingClientRect().bottom) / 2,
            developpe: bascule.getAttribute('aria-expanded'),
            decritSelection: select.getAttribute('aria-describedby') === description.id,
            selection: select.getAttribute('aria-pressed'),
        };
    });
    ok('un descriptif long est replié à trois lignes et relié au bouton de sélection',
        descriptifCompact.hauteur <= descriptifCompact.troisLignes + 1
        && descriptifCompact.developpe === 'false' && descriptifCompact.decritSelection,
        JSON.stringify(descriptifCompact));
    ok('« Lire la suite » partage la ligne des étapes, à droite, sans recouvrir le descriptif',
        descriptifCompact.basculeHaut >= descriptifCompact.descriptionBas
        && Math.abs(descriptifCompact.metaMilieu - descriptifCompact.basculeMilieu) <= 1
        && Math.abs(descriptifCompact.ligneDroite - descriptifCompact.basculeDroite) <= 1,
        JSON.stringify(descriptifCompact));
    await descriptifLong.click();
    const descriptifOuvert = await descriptifLong.evaluate((bascule) => {
        const carte = bascule.closest('.pc-trame');
        return {
            developpe: bascule.getAttribute('aria-expanded'),
            hauteur: carte.querySelector('.pc-trame__desc').getBoundingClientRect().height,
            selection: carte.querySelector('.pc-trame__select').getAttribute('aria-pressed'),
        };
    });
    ok('« Lire la suite » déplie sans sélectionner la trame',
        descriptifOuvert.developpe === 'true'
        && descriptifOuvert.hauteur > descriptifCompact.hauteur
        && descriptifOuvert.selection === descriptifCompact.selection,
        JSON.stringify({ descriptifCompact, descriptifOuvert }));
    await descriptifLong.press('Enter');
    ok('le même contrôle replie le descriptif au clavier',
        await descriptifLong.getAttribute('aria-expanded') === 'false');
    const idDescriptif = await descriptifLong.getAttribute('aria-controls');
    await page.locator(`#${idDescriptif}`).click();
    ok('cliquer le descriptif tronqué sélectionne la trame au lieu de la déplier',
        await page.evaluate((id) => {
            const carte = document.getElementById(id)?.closest('.pc-trame');
            return carte?.querySelector('.pc-trame__select')?.getAttribute('aria-pressed') === 'true'
                && carte?.querySelector('.pc-trame__desc-toggle')?.getAttribute('aria-expanded') === 'false';
        }, idDescriptif));
    await page.evaluate(async () => {
        const { translations } = await import('/js/core/translation.js');
        const [cle, texte] = window.__descriptifOrigine;
        translations[cle] = texte;
    });
    await formats.locator('.pc-choice').nth(1).click();

    // « Structure libre » puis « Partir du modèle » : un squelette VIDE, dimensionné
    // par l'ampleur, où l'on compose soi-même — et non un bouton muet (retour
    // d'Emmanuel, 6 sept. 2026).
    const libre = await page.evaluate(async () => {
        const { planDepuisTrame } = await import('/js/parcours/screen-plan.js');
        const courte = planDepuisTrame('libre', 'elea', 'courte');
        const longue = planDepuisTrame('libre', 'elea', 'longue');
        return {
            courte: courte && courte.etapes.map(e => e.cartes.length),
            longue: longue && longue.etapes.map(e => e.cartes.length),
            origine: courte && courte.origine,
        };
    });
    ok('« Structure libre » donne des étapes vides, deux en courte, quatre en longue',
        libre.courte && libre.courte.length === 2 && libre.courte.every(n => n === 0)
        && libre.longue && libre.longue.length === 4 && libre.origine === 'libre', JSON.stringify(libre));
    // « Structure libre » vit parmi les autres modèles, repliés sous les trois
    // premiers (D91) : on les déplie, comme l'enseignant.
    // La vitrine (D102) : les intentions de Gauthier d'abord, dans son ordre.
    const vitrine = await page.evaluate(async () => {
        const { brouillon } = await import('/js/parcours/state.js');
        const d = brouillon();
        return { format: d.format, ampleur: d.ampleur,
            noms: [...document.querySelectorAll('.pc-trames > .pc-trame:not(.pc-trame--auto) .pc-trame__name')].map(n => n.textContent.trim()) };
    });
    ok('la vitrine montre d’abord apprendre en autonomie, réviser, s’entraîner (deux à trois séances)',
        vitrine.ampleur !== 'moyenne' || JSON.stringify(vitrine.noms) === JSON.stringify(['Apprendre en autonomie', 'Réviser avant l\'évaluation', 'S’entraîner']),
        JSON.stringify(vitrine));
    const basculeAutres = page.locator('.pc-trames__autres');
    ok('« Voir les autres modèles » est un bouton replié qui dit combien il en cache',
        await basculeAutres.getAttribute('aria-expanded') === 'false'
        && /\(\d+\)/.test(await basculeAutres.textContent()), await basculeAutres.textContent());
    await basculeAutres.click();
    ok('déplié, il range les autres modèles par famille, « Structure libre » compris',
        await basculeAutres.getAttribute('aria-expanded') === 'true'
        && await page.locator('.pc-famille').count() >= 2
        && await page.locator('.pc-trame-ligne[data-trame="libre"]').isVisible());
    await page.locator('.pc-trame-ligne[data-trame="libre"]').click();
    await page.waitForTimeout(120);
    const modele = await page.evaluate(() => ({ present: !!document.querySelector('#pc-modele'), inactif: document.querySelector('#pc-modele').disabled }));
    ok('avec « Structure libre » choisie, « Partir du modèle » est actif', modele.present && !modele.inactif, JSON.stringify(modele));
    await page.click('#pc-modele');
    await page.waitForTimeout(150);
    const libreOuvert = await page.evaluate(() => ({
        ecran: (document.querySelector('.pc-steps__item--current') || {}).textContent,
        etapes: document.querySelectorAll('.pc-etape').length,
        cartes: document.querySelectorAll('.pc-carte').length,
        ctaInactif: document.querySelector('#pc-cta').disabled,
        note: document.querySelector('#pc-action-note').textContent,
    }));
    ok('« Partir du modèle » ouvre alors le plan : des étapes vides, l’action qui attend une activité',
        /Plan/.test(libreOuvert.ecran || '') && libreOuvert.etapes >= 2 && libreOuvert.cartes === 0 && libreOuvert.ctaInactif,
        JSON.stringify(libreOuvert));
    // D69 : le plan né du modèle est relevé — une ligne PARCOURS, des identifiants fermés
    // et des compteurs, jamais le sujet ni un titre ; l'identifiant est rangé dans le brouillon.
    const releve = webhooksBloques.filter(w => /\/llm\/stats-/.test(w.url)).map(w => w.corps).pop();
    const { statsId, nbEtapes } = await page.evaluate(async () => {
        const d = (await import('/js/parcours/state.js')).brouillon();
        return { statsId: d.statsId, nbEtapes: d.plan.etapes.length };
    });
    ok('« Partir du modèle » poste le relevé du parcours (origine modele, trame libre, 0 activité, id rangé)',
        releve && releve.kind === 'parcours' && releve.origine === 'modele' && releve.statut === 'ok'
        && releve.modele_parcours === 'libre' && releve.nb_activites === 0 && releve.nb_etapes === nbEtapes
        && releve.parcours_id && releve.parcours_id === statsId && !releve.model,
        JSON.stringify({ releve, statsId }));
    ok('le relevé ne porte que des champs fermés (ni sujet, ni titre, ni contexte)',
        releve && Object.keys(releve).every(k => ['kind', 'parcours_id', 'origine', 'statut', 'modele_parcours',
            'plateforme', 'format', 'ampleur', 'nb_etapes', 'nb_activites', 'model', 'model_demande',
            'niveau_secours', 'essais', 'prompt_tokens', 'completion_tokens', 'started_at', 'completed_at',
            'caramel_version'].includes(k)),
        JSON.stringify(releve && Object.keys(releve)));
    // Retour au cadrage par le fil, pour la suite du banc.
    await page.click('.pc-steps__item:nth-of-type(1) button');
    await page.waitForTimeout(120);

    // Un plan, puis le VRAI clic sur « Fabriquer » : la fabrication démarre seule.
    const REP = { QuizSetVF: 'quiz_vraifaux_1.json', TrueFalse: 'true_false_1.json', Page: 'page_1.json', Flashcards: 'flashcards_1.json',
        FillInTheBlanks: 'fill_in_the_blanks_1.json', Crossword: 'crosswords_1.json', test_elea: 'test_1.json' };
    const plan = await page.evaluate(async (REP) => {
        const parcours = await import('/js/parcours/index.js');
        const d = (await import('/js/parcours/state.js')).ouvrirBrouillon();
        const { planDepuisTrame } = await import('/js/parcours/screen-plan.js');
        d.platform = 'elea';
        d.plan = planDepuisTrame('revision', 'elea');
        d.plan.titre = 'La traite atlantique';
        parcours.__testHooks.doublerModele(async (prompt, carte) => {
            await new Promise(r => setTimeout(r, 40));
            const f = REP[carte.module];
            if (!f) throw new Error('pas de doublure pour ' + carte.module);
            return JSON.stringify(await (await fetch(`/assets/data/examples/${f}`)).json());
        });
        parcours.__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 120));
        return { cta: document.querySelector('#pc-cta').textContent.trim(), inactif: document.querySelector('#pc-cta').disabled };
    }, REP);
    ok('sur le plan, l’action primaire dit COMBIEN d’activités le clic va lancer',
        /6/.test(plan.cta) && !plan.inactif, plan.cta);

    // Retours d'Emmanuel du 6 sept. 2026, au soir : majuscules en tête des
    // objectifs, durée écrite en heures et minutes, estimation expliquée,
    // colonnes des cartes alignées.
    const soir = await page.evaluate(async () => {
        const { normaliserPlan, formaterDuree } = await import('/js/parcours/screen-plan.js');
        const p = normaliserPlan({ titre: 'les trente glorieuses', objectifGeneral: 'comprendre la croissance',
            etapes: [{ titre: 'découvrir la période', objectif: 'identifier les dates',
                cartes: [{ titre: 'les dates clés', objectif: 'repérer les bornes', consigne: 'lisez', module: 'Page', duree: 200 }] }] }, 'elea');
        const c = p.etapes[0].cartes[0];
        const selects = [...document.querySelectorAll('.pc-carte__reglages .pc-select')].map(x => Math.round(x.getBoundingClientRect().width));
        const durees = [...document.querySelectorAll('.pc-carte .pc-duree')].map(x => Math.round(x.getBoundingClientRect().left));
        const info = document.querySelector('.pc-summary .pc-info');
        return {
            majuscules: [p.titre, p.objectifGeneral, p.etapes[0].titre, p.etapes[0].objectif, c.titre, c.objectif, c.consigne],
            intact: normaliserPlan({ titre: '数学', etapes: [] }, 'elea').titre,
            d200: formaterDuree(200), d60: formaterDuree(60), d45: formaterDuree(45), d125: formaterDuree(125),
            selects, durees,
            info: info ? { role: info.getAttribute('role'), titre: info.title, focalisable: info.tabIndex === 0 } : null,
        };
    });
    ok('les titres, objectifs et consignes du plan commencent par une majuscule',
        soir.majuscules.every(x => /^[A-ZÀ-Ý]/.test(x)) && soir.intact === '数学', JSON.stringify(soir.majuscules));
    ok('la durée s’écrit en heures et minutes : 200 min → « 3 h 20 », 125 → « 2 h 05 », jamais en dixièmes',
        soir.d200 === '3 h 20' && soir.d60 === '1 h' && soir.d45 === '45 min' && soir.d125 === '2 h 05',
        JSON.stringify([soir.d200, soir.d60, soir.d45, soir.d125]));
    ok('la tuile « durée totale » porte une infobulle focalisable qui explique l’estimation',
        soir.info && soir.info.role === 'img' && soir.info.focalisable && /somme|sum|Summe|somma|som|soma|مجموع|之和|合計|άθροισμα|sammad/i.test(soir.info.titre),
        JSON.stringify(soir.info));
    ok('sur toutes les cartes, le menu de type a la même largeur et la durée tombe en colonne',
        soir.selects.length >= 3 && new Set(soir.selects).size === 1 && new Set(soir.durees).size === 1,
        JSON.stringify({ selects: soir.selects, durees: soir.durees }));

    // Un plan de 200 minutes : la relecture l'écrit en heures et minutes.
    const relectureDuree = await page.evaluate(async () => {
        const d = (await import('/js/parcours/state.js')).ouvrirBrouillon();
        const parcours = await import('/js/parcours/index.js');
        for (const e of d.plan.etapes) for (const c of e.cartes) c.duree = 25; // 6 × 25 = 150 min, aucune > 30
        parcours.__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 120));
        const items = [...document.querySelectorAll('.pc-relecture__item')].map(li => ({ txt: li.textContent, titre: (li.querySelector('span') || {}).title || '' }));
        const it = items.find(i => /2 h 30/.test(i.txt));
        return { trouve: !!it, titre: it ? it.titre : '', items: items.map(i => i.txt) };
    });
    ok('la relecture écrit « 2 h 30 » et explique l’estimation au survol',
        relectureDuree.trouve && relectureDuree.titre.length > 20, JSON.stringify(relectureDuree));
    await page.evaluate(async () => {
        const d = (await import('/js/parcours/state.js')).ouvrirBrouillon();
        for (const e of d.plan.etapes) for (const c of e.cartes) c.duree = 10;
        (await import('/js/parcours/index.js')).__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 120));
    });

    // Le fil des étapes est la navigation : « 1 » ramène au cadrage d'un clic,
    // « 3 » et « 4 » restent inertes tant qu'on n'y est pas allé.
    const fil = await page.evaluate(() => [...document.querySelectorAll('.pc-steps__item')]
        .map(li => ({ lien: li.classList.contains('pc-steps__item--lien'), bouton: !!li.querySelector('button'),
                      courant: li.classList.contains('pc-steps__item--current') })));
    ok('dans le fil, le cadrage déjà vu est un bouton, le plan est courant, la suite est inerte',
        fil[0].bouton && !fil[1].bouton && fil[1].courant && !fil[2].bouton && !fil[3].bouton,
        JSON.stringify(fil));
    await page.click('.pc-steps__item:nth-of-type(1) button');
    await page.waitForTimeout(120);
    const revenu = await page.evaluate(() => ({
        ecran: (document.querySelector('.pc-steps__item--current') || {}).textContent,
        planCliquable: !!document.querySelector('.pc-steps__item:nth-of-type(3) button'),
    }));
    ok('cliquer « 1 » ramène au cadrage, et « 2 » devient cliquable pour y revenir',
        /Cadrage/.test(revenu.ecran || '') && revenu.planCliquable, JSON.stringify(revenu));
    await page.click('.pc-steps__item:nth-of-type(3) button');
    await page.waitForTimeout(120);
    ok('et « 2 » ramène bien sur le plan',
        await page.evaluate(() => /Plan/.test((document.querySelector('.pc-steps__item--current') || {}).textContent || '')));

    // La mise en couleur du caramel est un ÉVÉNEMENT : une fois par activité, au
    // passage « en cours » → « prête ». L'écran se repeint à chaque changement de
    // la file ; sans garde, chaque repeinture la rejouerait sur toutes les lignes
    // déjà faites (21 fois pour 6 activités au lieu de 6).
    await page.evaluate(() => {
        window.__reveles = 0;
        window.__obs = new MutationObserver(muts => {
            for (const m of muts) for (const n of m.addedNodes) {
                if (n.nodeType === 1 && n.classList?.contains('pc-bonbon--revele')) window.__reveles++;
            }
        });
        window.__obs.observe(document.querySelector('#pc-atelier'), { childList: true, subtree: true });
    });
    await page.click('#pc-cta');
    await page.waitForTimeout(90);
    const lance = await page.evaluate(() => ({
        ecran: (document.querySelector('.pc-steps__item--current') || {}).textContent,
        encours: document.querySelectorAll('.pc-carte--encours').length,
        faites: document.querySelectorAll('.pc-carte--faite').length,
        cta: document.querySelector('#pc-cta').textContent.trim(),
        arret: document.querySelector('#pc-cta').classList.contains('pc-cta--annuler'),
        bonbonEnCours: !!document.querySelector('.pc-carte--encours .pc-bonbon--remplissage'),
        bonbonAttente: document.querySelectorAll('.pc-carte--attente .pc-bonbon--vide').length,
        attente: document.querySelectorAll('.pc-carte--attente').length,
    }));
    // Un statut qui change ne doit pas faire sautiller la ligne : les pastilles
    // des trois statuts gardent la même hauteur (caramel de 22 px partout).
    const pastilles = await page.evaluate(() => {
        const h = s => { const n = document.querySelector(s); return n ? Math.round(n.getBoundingClientRect().height) : null; };
        return { encours: h('.pc-carte--encours .pc-statut'), attente: h('.pc-carte--attente .pc-statut'),
                 faite: h('.pc-carte--faite .pc-statut') };
    });
    ok('la pastille garde la même hauteur d’un statut à l’autre : la ligne ne sautille pas',
        new Set(Object.values(pastilles).filter(Boolean)).size === 1, JSON.stringify(pastilles));
    ok('chaque ligne porte son caramel : celui qui se remplit, ceux qui attendent',
        (lance.encours === 0 || lance.bonbonEnCours) && lance.bonbonAttente === lance.attente,
        JSON.stringify(lance));
    ok('« Fabriquer » ouvre la fabrication ET la lance, sans second bouton',
        /Fabrication/.test(lance.ecran || '') && (lance.encours === 1 || lance.faites > 0) && lance.arret,
        JSON.stringify(lance));
    ok('pendant la fabrication, le fil est gelé : aucune étape n’est cliquable',
        await page.evaluate(() => document.querySelectorAll('.pc-steps__item button').length === 0));
    await page.waitForFunction(
        () => document.querySelectorAll('.pc-carte--encours, .pc-carte--attente').length === 0,
        null, { timeout: 20000 });
    await page.waitForTimeout(80);
    const fini = await page.evaluate(() => ({
        faites: document.querySelectorAll('.pc-carte--faite').length,
        echouees: document.querySelectorAll('.pc-carte--echouee').length,
        cta: document.querySelector('#pc-cta').textContent.trim(),
        arret: document.querySelector('#pc-cta').classList.contains('pc-cta--annuler'),
        bonbonsPleins: document.querySelectorAll('.pc-carte--faite .pc-bonbon--plein').length,
    }));
    ok('les six activités se fabriquent l’une après l’autre, sous les yeux, jusqu’au bout',
        fini.faites === 6 && fini.echouees === 0 && !fini.arret, JSON.stringify(fini));
    ok('une activité prête porte son caramel plein',
        fini.bonbonsPleins === fini.faites, JSON.stringify(fini));
    const reveles = await page.evaluate(() => { window.__obs.disconnect(); return window.__reveles; });
    ok('le caramel se colore UNE fois par activité, au moment où elle devient prête',
        reveles === fini.faites, `${reveles} mises en couleur pour ${fini.faites} activités`);
    ok('la fabrication finie, le fil se rouvre : cadrage et plan redeviennent cliquables',
        await page.evaluate(() => document.querySelectorAll('.pc-steps__item button').length === 2));

    // L'aperçu se comporte comme une vraie modale : son voile ferme la fenêtre,
    // sans avoir à viser la croix.
    await page.click('.pc-carte--faite [data-action="apercu"]');
    await page.waitForSelector('.pc-editeur', { timeout: 15000 });
    await page.locator('.pc-lecture__navigation button').last().click();
    await page.waitForFunction(() => document.querySelector('.pc-lecture__position')?.textContent.trim() === '2 / 6');
    const navigationApercu = await page.evaluate(() => ({
        position: document.querySelector('.pc-lecture__position')?.textContent.trim(),
        apercu: document.querySelector('.pc-lecture__modes button:first-child')?.getAttribute('aria-pressed'),
        edition: document.querySelector('.pc-lecture__modes button:last-child')?.getAttribute('aria-pressed'),
    }));
    ok('« Suivante » passe au prochain aperçu sans basculer en modification',
        navigationApercu.position === '2 / 6'
        && navigationApercu.apercu === 'true' && navigationApercu.edition === 'false',
        JSON.stringify(navigationApercu));
    await page.locator('.pc-editeur').click({ position: { x: 4, y: 4 } });
    await page.waitForSelector('.pc-editeur', { state: 'hidden' });
    const apercuFermeAuVoile = await page.evaluate(() => !document.querySelector('.pc-editeur')
        && !document.body.classList.contains('pc-locked'));
    ok('cliquer à côté de l’aperçu ferme la modale et rend la page', apercuFermeAuVoile);

    // L'éditeur d'activité reste le seul dialogue : ouvert depuis une ligne
    // prête, il verrouille le défilement de la page ; refermé, il le rend.
    page.once('dialog', d => d.accept());
    await page.click('.pc-carte--faite .pc-carte__actions button');
    await page.waitForSelector('.pc-editeur', { timeout: 15000 });
    await page.waitForTimeout(150);
    const editeur = await page.evaluate(() => ({
        dialogue: document.querySelector('.pc-editeur').getAttribute('role'),
        verrou: document.body.classList.contains('pc-locked'),
    }));
    await page.click('.pc-editeur__fermer');
    // Le panneau emploie désormais sa confirmation intégrée d'abandon.
    const confirmation = page.locator('.pc-confirmation__abandon');
    if (await confirmation.isVisible()) await confirmation.click();
    await page.waitForSelector('.pc-editeur', { state: 'hidden' });
    const editeurFerme = await page.evaluate(() => ({
        present: !!document.querySelector('.pc-editeur'),
        verrou: document.body.classList.contains('pc-locked'),
    }));
    ok('l’éditeur d’activité est un dialogue qui verrouille la page derrière lui',
        editeur.dialogue === 'dialog' && editeur.verrou, JSON.stringify(editeur));
    ok('et la rend en se refermant', !editeurFerme.present && !editeurFerme.verrou,
        JSON.stringify(editeurFerme));

    // Revenir sur le plan puis sur la fabrication SANS cliquer « Fabriquer » :
    // rien ne doit repartir tout seul (tout est fait — et ce n'est pas le clic).
    const retour = await page.evaluate(async () => {
        const parcours = await import('/js/parcours/index.js');
        parcours.__testHooks.allerA(1);
        await new Promise(r => setTimeout(r, 60));
        parcours.__testHooks.allerA(2);
        await new Promise(r => setTimeout(r, 60));
        return { arret: document.querySelector('#pc-cta').classList.contains('pc-cta--annuler'),
                 cta: document.querySelector('#pc-cta').textContent.trim() };
    });
    ok('revenir sur l’écran de fabrication ne relance rien de lui-même',
        retour.arret === false, JSON.stringify(retour));

    // « Une activité » dans la barre : la page redevient exactement ce qu'elle
    // était, et remonte en haut (on était descendu jusqu'à l'atelier).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Le caramel des chargements ne doit pas pomper quand on a demandé moins
    // d'animations : il garde son niveau, lisible et immobile.
    const bonbonCalme = await page.evaluate(() => {
        const n = document.createElement('span');
        n.className = 'pc-bonbon pc-bonbon--remplissage';
        const img = document.createElement('img');
        img.className = 'pc-bonbon__plein';
        n.append(img);
        document.body.append(n);
        const style = getComputedStyle(img);
        const lu = { anim: style.animationName, clip: style.clipPath };
        n.remove();
        return lu;
    });
    ok('animations réduites : le caramel garde son niveau au lieu de pomper',
        bonbonCalme.anim === 'none' && /inset/.test(bonbonCalme.clip), JSON.stringify(bonbonCalme));
    const avantFermeture = await page.evaluate(() => Math.round(window.scrollY));
    await page.click('#activites-button');
    await page.waitForTimeout(200);
    const ferme = await page.evaluate(() => ({
        present: !!document.querySelector('#pc-atelier'),
        filtres: getComputedStyle(document.querySelector('.filter-bar')).display,
        grille: getComputedStyle(document.querySelector('.activity-grid')).display,
        activiteAllumee: document.querySelector('#activites-button').getAttribute('aria-checked'),
        parcoursEteint: document.querySelector('#parcours-button').getAttribute('aria-checked'),
        reprise: document.querySelector('#parcours-button').classList.contains('pc-commutateur__b--reprise'),
        focus: document.activeElement && document.activeElement.id,
        scrollY: Math.round(window.scrollY),
        formulaireStyle: ['borderRadius', 'marginBottom', 'boxShadow'].map(k => getComputedStyle(document.querySelector('.prompt-generator'))[k]),
    }));
    ok('le formulaire retrouve exactement son style habituel en mode activité',
        JSON.stringify(ferme.formulaireStyle) === JSON.stringify(avant.formulaireStyle));
    ok('« Une activité » retire l’atelier et rend les tuiles et les filtres',
        !ferme.present && ferme.filtres === avant.filtres && ferme.grille === avant.grille,
        JSON.stringify(ferme));
    ok('le segment « Une activité » s’allume, « Un parcours » s’éteint et porte le point de reprise, le focus suit',
        ferme.activiteAllumee === 'true' && ferme.parcoursEteint === 'false'
        && ferme.reprise && ferme.focus === 'activites-button',
        JSON.stringify(ferme));
    ok('et la page remonte en haut, là où sont les tuiles',
        avantFermeture > 100 && ferme.scrollY === 0, `avant ${avantFermeture}, après ${ferme.scrollY}`);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Le commutateur : « Un parcours » ouvre, « Une activité » referme, et
    // recliquer le segment allumé ne fait rien.
    await page.click('#parcours-button');
    await page.waitForTimeout(120);
    const b1 = await page.evaluate(() => !!document.querySelector('#pc-atelier'));
    await page.click('#parcours-button');
    await page.waitForTimeout(120);
    const b1b = await page.evaluate(() => !!document.querySelector('#pc-atelier'));
    await page.click('#activites-button');
    await page.waitForTimeout(120);
    const b2 = await page.evaluate(() => !!document.querySelector('#pc-atelier'));
    ok('« Un parcours » ouvre, recliquer dessus ne referme pas, « Une activité » referme', b1 && b1b && !b2);

    // Au clavier : depuis le segment allumé, une flèche passe à l'autre ET l'allume.
    await page.focus('#activites-button');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
    const clavier = await page.evaluate(() => ({ ouvert: !!document.querySelector('#pc-atelier'), focus: document.activeElement.id }));
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(120);
    const clavier2 = await page.evaluate(() => ({ ouvert: !!document.querySelector('#pc-atelier'), focus: document.activeElement.id }));
    ok('les flèches du clavier passent d’un segment à l’autre et choisissent',
        clavier.ouvert && clavier.focus === 'parcours-button' && !clavier2.ouvert && clavier2.focus === 'activites-button',
        JSON.stringify({ clavier, clavier2 }));

    ok('aucune erreur JS de page', pageErrors.length === 0, pageErrors.join(' | '));

    /* ------------------------------------------- 8. pas de clé brute au chargement */
    console.log('\n── Le libellé de l’entrée, avant l’arrivée du dictionnaire ──');
    // Le dictionnaire est RETARDÉ : ce qu'on lit alors est ce que l'utilisateur
    // voit au premier rendu. Une clé brute (« parcours_commutateur_parcours ») serait le
    // scintillement constaté par Emmanuel le 7 sept. 2026.
    const lente = await browser.newPage();
    await lente.route('**/js/locales/*.json*', async route => {
        await new Promise(r => setTimeout(r, 1500));
        await route.continue();
    });
    await lente.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await lente.waitForSelector('#parcours-button', { timeout: 20000 });
    const premierRendu = await lente.evaluate(() => {
        const e = document.querySelector('#parcours-button');
        const g = document.querySelector('#pc-commutateur');
        return {
            libelle: (e.querySelector('.pc-commutateur__label') || {}).textContent,
            dataKey: (e.querySelector('.pc-commutateur__label') || {}).dataset?.key,
            libelleActivite: (document.querySelector('#activites-button .pc-commutateur__label') || {}).textContent,
            aria: g.getAttribute('aria-label'), titre: e.getAttribute('title'),
        };
    });
    ok('avant le dictionnaire, les segments disent « Une activité » et « Un parcours » — jamais la clé brute',
        premierRendu.libelle === 'Un parcours' && premierRendu.dataKey === 'parcours_commutateur_parcours'
        && premierRendu.libelleActivite === 'Une activité',
        JSON.stringify(premierRendu));
    ok('et aucun attribut ne porte une clé brute en attendant',
        !/^parcours_/.test(premierRendu.aria || '') && !/^parcours_/.test(premierRendu.titre || ''),
        JSON.stringify(premierRendu));
    await lente.waitForFunction(() => {
        const e = document.querySelector('#parcours-button');
        return e && e.getAttribute('title') && !/^parcours_/.test(e.getAttribute('title'));
    }, null, { timeout: 20000 });
    const apresDico = await lente.evaluate(() => {
        const e = document.querySelector('#parcours-button');
        return { libelle: e.querySelector('.pc-commutateur__label').textContent, titre: e.getAttribute('title'),
                 nomGroupe: document.querySelector('#pc-commutateur').getAttribute('aria-label') };
    });
    ok('le dictionnaire arrivé, libellé, titre et nom du groupe sont traduits',
        apresDico.libelle === 'Un parcours' && apresDico.titre === 'Créer un parcours' && apresDico.nomGroupe === 'Que souhaitez-vous créer ?',
        JSON.stringify(apresDico));
    await lente.close();

    // ── « Évaluer » (D102) : le Test porte ses réglages d'épreuve, et le plan le dit ──
    console.log('\n── « Évaluer » : le Test réglé en épreuve, dit sur le plan ──');
    const epreuve = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await epreuve.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, rt => rt.abort());
    await epreuve.goto(`http://127.0.0.1:${PORT}/index.html`);
    await epreuve.waitForSelector('#parcours-button');
    await epreuve.fill('#qui', 'Professeur de physique');
    await epreuve.fill('#quoi', 'La mécanique des fluides');
    await epreuve.click('#parcours-button');
    await epreuve.click('.pc-choice[data-choix="courte"]');
    const carteEvaluer = epreuve.locator('.pc-trames > .pc-trame', { hasText: 'Évaluer' }).first();
    const vitrineSeance = await epreuve.evaluate(() => [...document.querySelectorAll('.pc-trames > .pc-trame:not(.pc-trame--auto) .pc-trame__name')].map(n => n.textContent.trim()));
    ok('en séance, la vitrine montre les quatre intentions : apprendre, réviser, s’entraîner, évaluer',
        JSON.stringify(vitrineSeance) === JSON.stringify(['Apprendre en autonomie', 'Réviser avant l\'évaluation', 'S’entraîner', 'Évaluer']), JSON.stringify(vitrineSeance));
    await carteEvaluer.locator('.pc-trame__select').click();
    await epreuve.click('#pc-modele');
    await epreuve.waitForSelector('.pc-carte');
    const marqueEpreuve = await epreuve.locator('.pc-carte__epreuve').allTextContents();
    ok('sur le plan, le Test d’« Évaluer » dit qu’il part en épreuve : une tentative, chronométrée, la note seule',
        marqueEpreuve.length === 1 && /^Épreuve : une seule tentative, en \d+ min, la note seule à la fin$/.test(marqueEpreuve[0].trim()), JSON.stringify(marqueEpreuve));
    await epreuve.close();

    // ── Une consigne oubliée est redemandée (quiz de Gauthier, 30 sept. 2026) ──
    // Le modèle avait rendu trois exercices d'un quiz mixte SANS consigne : l'élève
    // voyait un texte à surligner sans savoir quoi y surligner. La file redemande UNE
    // fois en nommant les questions ; au second oubli, la carte échoue et se refait.
    console.log('\n── Une consigne oubliée est redemandée, la longueur suit la durée ──');
    const consignes = await page.evaluate(async () => {
        const { creerFile } = await import('/js/parcours/parcours-runner.js');
        const { construirePromptRemplissage } = await import('/js/parcours/scenario-prompt.js');
        const quiz = sans => JSON.stringify({ title: 'Le quiz', questions: [
            { library: 'H5P.MultiChoice 1.16', params: { question: 'Quel port ?', answers: [{ text: 'Nantes', correct: true }, { text: 'Brest', correct: false }] } },
            { library: 'H5P.MarkTheWords 1.11', params: { ...(sans ? {} : { taskDescription: 'Surligne les noms de ports.' }), textField: 'Les navires partent de *Nantes* et de *Bordeaux*.' } },
            { library: 'H5P.DragText 1.10', params: { taskDescription: 'Place les mots.', textField: 'Le *Code noir* date de *1685*.' } },
        ] });
        const brouillon = () => ({
            platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'libre',
            contexte: { qui: 'un professeur', quoi: 'la traite atlantique', niveau: 'quatrième', corpus: '' },
            plan: { titre: 'Traite', objectifGeneral: 'Comprendre', notionsPivots: [], etapes: [{ id: 'e1', titre: 'Vérifier', cartes: [
                { id: 'q1', titre: 'Le quiz', objectif: 'Se tester', consigne: 'Répondre', module: 'QuizSet', palier: 'entrainement', duree: 10, verrouillee: false }] }] },
        });
        const essai = async (reponses) => {
            const d = brouillon();
            const prompts = [];
            const file = creerFile(d, { appelModele: async (prompt) => { prompts.push(prompt); return reponses[prompts.length - 1]; } });
            const etat = await file.demarrer();
            return { prompts, ligne: etat.lignes[0], contenu: d.plan.etapes[0].cartes[0].contenu };
        };
        const rattrape = await essai([quiz(true), quiz(false)]);
        const obstine = await essai([quiz(true), quiz(true)]);
        const complet = await essai([quiz(false)]);
        const page = mots => construirePromptRemplissage({ ...brouillon(), plan: { ...brouillon().plan } },
            { id: 'p', titre: 'La leçon', objectif: 'Lire', consigne: 'Lire', module: 'Page', palier: 'decouverte', duree: mots, verrouillee: false });
        const [p5, p25] = await Promise.all([page(5), page(25)]);
        const { prompt: pQuiz } = await construirePromptRemplissage(brouillon(), brouillon().plan.etapes[0].cartes[0]);
        return {
            rattrape: { appels: rattrape.prompts.length, statut: rattrape.ligne.statut,
                rappel: rattrape.prompts[1] || '', consigne: rattrape.contenu?.questions?.[1]?.params?.taskDescription || null },
            obstine: { appels: obstine.prompts.length, statut: obstine.ligne.statut, cle: obstine.ligne.erreurKey },
            complet: { appels: complet.prompts.length, statut: complet.ligne.statut },
            p5: p5.prompt.match(/Longueur visée : environ (\d+) mots/)?.[1], p25: p25.prompt.match(/Longueur visée : environ (\d+) mots/)?.[1],
            quizLongueur: /Longueur visée/.test(pQuiz), quizRegle: pQuiz.includes('porte `taskDescription`'),
        };
    });
    ok('un exercice revenu sans consigne est redemandé UNE fois, en nommant la question',
        consignes.rattrape.appels === 2 && consignes.rattrape.statut === 'faite'
        && /CORRECTION DEMANDÉE[\s\S]*la question 2 \(Surligner les mots\)/.test(consignes.rattrape.rappel)
        && consignes.rattrape.consigne === 'Surligne les noms de ports.', JSON.stringify(consignes.rattrape));
    ok('au second oubli, la carte échoue avec un message clair, et se refait d’un clic',
        consignes.obstine.appels === 2 && consignes.obstine.statut === 'echouee' && consignes.obstine.cle === 'parcours_consigne_manquante',
        JSON.stringify(consignes.obstine));
    ok('un quiz complet ne coûte qu’un appel', consignes.complet.appels === 1 && consignes.complet.statut === 'faite', JSON.stringify(consignes.complet));
    ok('le prompt d’un quiz mixte rappelle la consigne de chaque exercice', consignes.quizRegle && !consignes.quizLongueur);
    ok('une Page de 25 minutes vise cinq fois la longueur d’une Page de 5 (400 → 2 000 mots)',
        consignes.p5 === '400' && consignes.p25 === '2000', JSON.stringify({ p5: consignes.p5, p25: consignes.p25 }));

    await browser.close();
} catch (e) {
    fail++;
    echecs.push(`❌ banc interrompu : ${e && e.stack || e}`);
    exitCode = 1;
}

console.log('\n========================================');
console.log(`parcours — atelier de fabrication : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(fail ? 1 : exitCode);
