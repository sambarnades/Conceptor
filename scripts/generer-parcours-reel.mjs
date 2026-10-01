#!/usr/bin/env node
/**
 * Fabrique un parcours RÉEL, de bout en bout, par le pipeline de production :
 * plan composé par le modèle, chaque activité générée par la file de fabrication
 * de l'atelier (`creerFile`), assemblage du `.mbz` de cours.
 *
 * **Pourquoi ce script existe.** Les sondes éprouvent la FORME (le XML de chaque
 * module revient-il intact de la plateforme ?), avec des contenus d'une ligne.
 * Elles ne disent rien de ce qu'un enseignant verra : une page vide, une leçon
 * creuse, une consigne générique. Ce script produit ce qu'un vrai utilisateur
 * produirait — un parcours de formation complet —, et le garde :
 *
 *   tests/fixtures/parcours-reels/<id>.json   le scénario (plan + contenus), rejoué
 *                                             par `tests/run_parcours_reels.mjs`
 *   tests/sonde-parcours/reel-<id>.mbz        le cours, à importer pour relire
 *   tests/sonde-parcours/reel-<id>.md         le relevé carte par carte
 *
 * Appels au modèle RÉELS (proxy n8n de développement), un à la fois.
 *
 * Lancement : node scripts/generer-parcours-reel.mjs [--scenario=pix-edu-donnees[,autre]] [--tous]
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8186;

/**
 * Les scénarios. Ce sont ceux qu'on rencontre vraiment : une formation
 * d'enseignants de type Pix+Édu sur Magistère, un travail collaboratif, et un
 * parcours d'élèves sur Éléa. Chacun vise d'autres modules de la plateforme.
 */
const SCENARIOS = {
    'pix-edu-donnees': {
        adultes: true,
        titre: 'Pix+Édu — Protéger les données personnelles des élèves',
        platform: 'magistere', format: 'hybride', ampleur: 'longue', trame: 'formation',
        // Le Paquetage IMS n'est jamais proposé par le plan : le formateur le
        // choisit dans la mosaïque, à la place de la première Page (ou du Livre).
        imsAuLieuDe: ['Page', 'Livre'],
        contexte: {
            qui: 'Formateur académique au numérique éducatif',
            quoi: 'Protéger les données personnelles des élèves dans ses pratiques numériques de classe : RGPD, consentement, choix des outils, partage de productions, bonnes pratiques de mots de passe (compétence Pix+Édu « Protéger les données »)',
            niveau: 'Enseignants du second degré en formation continue',
        },
    },
    'pix-edu-cooperer': {
        adultes: true,
        titre: 'Pix+Édu — Concevoir une activité collaborative',
        platform: 'magistere', format: 'hybride', ampleur: 'longue', trame: 'cooperation',
        contexte: {
            qui: 'Formatrice Pix+Édu',
            quoi: 'Concevoir et animer une activité de collaboration entre élèves avec des outils numériques : organisation des équipes, document partagé, évaluation par les pairs (compétence Pix+Édu « Interagir et collaborer »)',
            niveau: 'Enseignants du premier et du second degré en formation continue',
        },
    },
    'debat-reseaux-sociaux': {
        titre: 'Débat argumenté — Les réseaux sociaux',
        platform: 'elea', format: 'distanciel', ampleur: 'longue', trame: 'debat',
        contexte: {
            qui: 'Professeur de français',
            quoi: 'Les réseaux sociaux rendent-ils plus libres ? Débat argumenté, sources, argumentation écrite',
            niveau: '3e',
        },
    },
    // Les deux trames dont la STRUCTURE a changé après l'état de l'art (D81) :
    // le diagnostic en série de Vrai/Faux, et la critique suivie d'une reprise.
    'revision-fractions': {
        titre: 'Réviser avant l’évaluation — Les fractions',
        platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: 'revision',
        contexte: {
            qui: 'Professeur de mathématiques',
            quoi: 'Les fractions : égalité de fractions, simplification, comparaison, addition et soustraction de fractions',
            niveau: '5e',
        },
    },
    // Trame ouverte le 28 sept. 2026 (D82) : les méthodes de travail, essayées
    // sur un vrai sujet d'histoire.
    'apprendre-revolution': {
        titre: 'Apprendre à apprendre — La Révolution française',
        platform: 'elea', format: 'distanciel', ampleur: 'moyenne', trame: 'apprendre',
        contexte: {
            qui: 'Professeur d’histoire-géographie',
            quoi: 'La Révolution française (1789-1799) : causes, prise de la Bastille, Déclaration des droits de l’homme et du citoyen, fin de la monarchie, Terreur',
            niveau: '4e',
        },
    },
    // 7.1.0 (1er oct. 2026) : les trames de la vitrine (D102), les chemins selon
    // les résultats (D90), et le vocabulaire de chaque plateforme (D105) — des
    // étudiants sur Moodle, des stagiaires sur Magistère.
    'moodle-fluides-evaluer': {
        adultes: true,
        titre: 'Évaluer — Mécanique des fluides (Licence 1)',
        platform: 'moodle', format: 'distanciel', ampleur: 'courte', trame: 'evaluation',
        contexte: {
            qui: 'Enseignant de physique à l’université',
            quoi: 'Mécanique des fluides : pression, principe fondamental de l’hydrostatique, poussée d’Archimède, débit et équation de continuité',
            niveau: 'Licence 1 de physique',
        },
    },
    'elea-proportionnalite-chemins': {
        titre: 'Différencier — La proportionnalité (5e)',
        platform: 'elea', format: 'distanciel', ampleur: 'courte', trame: 'differenciation',
        structure: 'chemins', chemins: 3,
        contexte: {
            qui: 'Professeur de mathématiques',
            quoi: 'La proportionnalité : reconnaître une situation de proportionnalité, coefficient de proportionnalité, quatrième proportionnelle, pourcentages simples',
            niveau: '5e',
        },
    },
    // Le parcours d'Emmanuel du 1er oct. 2026 : une Rédaction écartée à la livraison
    // (`occurrences: 0`, D109), deux images inventées dans la Page (D110).
    'elea-angles-chemins': {
        titre: 'Différencier — Les natures des angles (6e)',
        platform: 'elea', format: 'distanciel', ampleur: 'longue', trame: 'auto',
        structure: 'chemins', chemins: 3,
        contexte: {
            qui: 'Professeur de mathématiques',
            quoi: 'Découvrir les natures des angles : angle droit, aigu, obtus, plat, saillant et rentrant ; repérer le sommet et les côtés ; estimer et comparer des mesures d’angles',
            niveau: '6e',
        },
    },
    'magistere-laicite-entrainement': {
        adultes: true,
        titre: 'S’entraîner — Faire vivre la laïcité à l’école',
        platform: 'magistere', format: 'distanciel', ampleur: 'moyenne', trame: 'entrainement',
        contexte: {
            qui: 'Formatrice académique « valeurs de la République »',
            quoi: 'Réagir à des situations de classe qui mettent en jeu la laïcité : lois de 1905 et de 2004, charte de la laïcité à l’école, neutralité des personnels, liberté de conscience des élèves',
            niveau: 'Professeurs néo-titulaires en formation continue',
        },
    },
    'moodle-statistiques-autonomie': {
        adultes: true,
        titre: 'Apprendre en autonomie — Statistiques descriptives (BUT)',
        platform: 'moodle', format: 'distanciel', ampleur: 'courte', trame: 'autonomie',
        contexte: {
            qui: 'Enseignante de mathématiques en IUT',
            quoi: 'Statistiques descriptives : moyenne, médiane, quartiles, étendue, écart-type, lecture d’une boîte à moustaches',
            niveau: 'BUT 1re année',
        },
    },
    'projet-podcast': {
        titre: 'Démarche de projet — Un podcast sur la biodiversité',
        platform: 'elea', format: 'hybride', ampleur: 'longue', trame: 'projet',
        contexte: {
            qui: 'Professeure de SVT',
            quoi: 'Réaliser en équipe un podcast de cinq minutes sur la biodiversité d’un milieu proche du collège : espèces, relations entre êtres vivants, menaces et actions de protection',
            niveau: '4e',
        },
    },
};

/** Adresses réelles pour les cartes « Lien web » : le modèle n'en invente jamais. */
const LIENS = {
    'pix-edu-donnees': 'https://www.cnil.fr/fr/education',
    'pix-edu-cooperer': 'https://eduscol.education.fr/721/cadre-de-reference-des-competences-numeriques',
    'debat-reseaux-sociaux': 'https://www.clemi.fr/ressources/guides-pratiques',
    'revision-fractions': 'https://eduscol.education.fr/',
    'projet-podcast': 'https://www.ofb.gouv.fr/',
    'apprendre-revolution': 'https://www.lumni.fr/',
    'moodle-fluides-evaluer': 'https://fr.wikipedia.org/wiki/M%C3%A9canique_des_fluides',
    'elea-proportionnalite-chemins': 'https://eduscol.education.fr/',
    'magistere-laicite-entrainement': 'https://www.education.gouv.fr/la-laicite-l-ecole-12415',
    'moodle-statistiques-autonomie': 'https://www.insee.fr/fr/information/2549813',
};

const argv = process.argv.slice(2);
const choisi = (argv.find(a => a.startsWith('--scenario=')) || '').split('=')[1];
// `--scenario=a,b` enchaîne plusieurs scénarios, un à la fois.
const ids = argv.includes('--tous') ? Object.keys(SCENARIOS) : (choisi || 'pix-edu-donnees').split(',').filter(Boolean);

const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
process.on('exit', () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } });
await new Promise(r => setTimeout(r, 1500));

const browser = await chromium.launch();
mkdirSync(join(ROOT, 'tests/fixtures/parcours-reels'), { recursive: true });
mkdirSync(join(ROOT, 'tests/sonde-parcours'), { recursive: true });

for (const id of ids) {
    const sc = SCENARIOS[id];
    if (!sc) { console.error(`scénario inconnu : ${id}`); continue; }
    console.log(`\n▶ ${id} — ${sc.titre} (${sc.platform}, ${sc.format}, ${sc.ampleur}, trame ${sc.trame}${sc.structure === 'chemins' ? `, ${sc.chemins} chemins` : ''})`);
    const page = await browser.newPage();
    page.setDefaultTimeout(1800000);
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0, null, { timeout: 60000 });
    await page.waitForTimeout(1200);

    // Une panne passagère du modèle (délai dépassé sur le serveur partagé) ne
    // doit pas emporter les autres scénarios : une seconde tentative, puis on passe.
    let r = null;
    for (let essai = 1; essai <= 2 && !r; essai++) {
      try {
        r = await page.evaluate(async ({ sc, lien }) => {
        const { generateRawWithLLM, DEFAULT_MODEL } = await import('/js/services/llm.js');
        const { extraireJson, creerFile } = await import('/js/parcours/parcours-runner.js');
        const { normaliserPlan } = await import('/js/parcours/screen-plan.js');
        const { typeSource } = await import('/js/parcours/sources.js');
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { versScenario } = await import('/js/parcours/scenario-io.js');
        const { nomModule } = await import('/js/parcours/activity-router.js');

        const draft = { platform: sc.platform, format: sc.format, ampleur: sc.ampleur, trame: sc.trame,
            structure: sc.structure || 'lineaire', chemins: sc.chemins || 2,
            contexte: { ...sc.contexte, corpus: '' } };

        // 1. Le plan, par le modèle — la boucle même de l'atelier (D107) : réparer,
        // contrôler, reprendre une fois, garder le meilleur.
        const debutPlan = Date.now();
        const { construirePromptPlan, reparationDuPlan } = await import('/js/parcours/scenario-prompt.js');
        const { composerAvecReprise } = await import('/js/parcours/composition-plan.js');
        const { prompt, calibrage, modules } = construirePromptPlan(draft);
        const compose = await composerAvecReprise({
            prompt, calibrage, modules, lireJson: extraireJson, reparation: reparationDuPlan(draft),
            appeler: async demande => (await generateRawWithLLM(demande, DEFAULT_MODEL, {
                activityMeta: { moduleKey: 'parcours-plan', category: 'parcours' }, stats: 'skip' })).content,
        });
        if (!compose || !compose.plan) throw new Error('plan illisible');
        draft.plan = normaliserPlan(compose.plan, draft.platform);
        const dureePlan = Math.round((Date.now() - debutPlan) / 1000);

        if (sc.imsAuLieuDe) {
            const cartes = draft.plan.etapes.flatMap(e => e.cartes);
            const c = sc.imsAuLieuDe.map(m => cartes.find(x => x.module === m)).find(Boolean);
            if (c) c.module = 'parcours_ims';
        }

        // 2. Les sources : un lien réel pour les liens web ; les supports vidéo et
        // image ne se fabriquent pas sans l'enseignant — la carte est réservée.
        for (const e of draft.plan.etapes) for (const c of e.cartes) {
            const type = typeSource(c.module);
            if (type === 'lien') c.source = { type: 'lien', url: lien };
            else if (type) c.verrouillee = true;
        }

        // 3. La fabrication, par la file de l'atelier ; un second passage relance
        // ce qui aurait échoué (panne passagère du modèle).
        const debutFab = Date.now();
        const file = creerFile(draft);
        let bilan = await file.demarrer();
        for (const ligne of bilan.lignes.filter(l => l.statut === 'echouee')) await file.refaire(ligne.id);
        bilan = file.etat();
        const dureeFab = Math.round((Date.now() - debutFab) / 1000);

        // 4. L'assemblage.
        const paquet = await assemblerParcours(draft.plan, { platformId: draft.platform });

        const cartes = draft.plan.etapes.flatMap((e, i) => e.cartes.map(c => ({
            etape: i + 1, titre: c.titre, module: c.module, nom: nomModule(c.module),
            statut: (bilan.lignes.find(l => l.id === c.id) || {}).statut || '?',
            taille: c.contenu ? JSON.stringify(c.contenu).length : 0,
            extrait: c.contenu ? JSON.stringify(c.contenu).slice(0, 220) : '',
        })));
        return {
            titre: draft.plan.titre, dureePlan, dureeFab, cartes,
            exclues: paquet.exclues, aFaire: paquet.aFaire, activites: paquet.activites.length - (paquet.textes || 0),
            scenario: JSON.stringify(versScenario(draft), null, 2),
            octets: Array.from(paquet.bytes),
        };
    }, { sc, lien: LIENS[id] });
      } catch (e) {
        console.log(`  tentative ${essai} échouée : ${String(e.message || e).split('\n')[0]}`);
      }
    }
    if (!r) { console.log(`  ✗ ${id} abandonné`); await page.close(); continue; }

    const nomBase = `reel-${id}`;
    // `banc` : ce que la reprise ignore mais que le banc doit savoir (le public).
    const scenario = { ...JSON.parse(r.scenario), banc: { public: sc.contexte.niveau, adultes: !!sc.adultes } };
    writeFileSync(join(ROOT, `tests/fixtures/parcours-reels/${id}.json`), JSON.stringify(scenario, null, 2) + '\n');
    writeFileSync(join(ROOT, `tests/sonde-parcours/${nomBase}.mbz`), Buffer.from(r.octets));
    const md = [
        `# Parcours réel — ${r.titre}`, '',
        `Scénario \`${id}\` : ${sc.platform}, ${sc.format}, ampleur ${sc.ampleur}, trame ${sc.trame}.`,
        `Plan : ${r.dureePlan} s · fabrication : ${r.dureeFab} s · activités assemblées : ${r.activites}.`, '',
        '| Étape | Activité | Type | Statut | Taille du contenu |', '|---|---|---|---|---|',
        ...r.cartes.map(c => `| ${c.etape} | ${c.titre} | ${c.nom} | ${c.statut} | ${c.taille} car. |`), '',
        r.exclues.length ? `**Écartées à l'assemblage** : ${r.exclues.map(x => `${x.titre} (${x.motif}${x.detail ? ` : ${x.detail}` : ''})`).join(' ; ')}` : 'Aucune activité écartée à l’assemblage.',
        r.aFaire?.length ? `\n**À faire sur la plateforme** : ${r.aFaire.join(' ; ')}` : '', '',
    ].join('\n');
    writeFileSync(join(ROOT, `tests/sonde-parcours/${nomBase}.md`), md);
    console.log(md);
    if (erreurs.length) console.log('Erreurs de page :', erreurs.slice(0, 5).join(' | '));
    await page.close();
}
await browser.close();
// Le serveur statique tient la boucle d'événements : sans cet arrêt explicite, le
// script attendait indéfiniment après le dernier scénario (constaté le 1er oct. 2026).
server.kill('SIGTERM');
