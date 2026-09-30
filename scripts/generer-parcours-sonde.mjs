/**
 * generer-parcours-sonde.mjs — Fabrique UN `.mbz` de parcours destiné à être
 * importé pour de vrai dans Éléa, Magistère ou un Moodle nu.
 *
 * **Pourquoi une sonde plutôt que l'atelier.** L'aller-retour réel est le
 * dernier contrôle du lot 1, et le seul qui ne se simule pas : un `.mbz` de
 * COURS touche le carnet de notes, les inscriptions, les catégories de
 * questions et la numérotation des contextes — quatre choses qu'un backup
 * mono-activité ne touche jamais, et qu'aucun banc local ne peut valider à la
 * place de la plateforme.
 *
 * Le faire depuis l'atelier coûterait huit appels au modèle, produirait un
 * fichier différent à chaque essai, et mélangerait deux questions : « le
 * contenu est-il bon ? » et « l'assemblage tient-il ? ». Cette sonde ne répond
 * qu'à la seconde. Elle part des fixtures du dépôt (`assets/data/examples/`) et
 * ne fait AUCUN appel réseau : deux exécutions produisent le même COURS — mêmes
 * sections, mêmes activités, mêmes textes —, donc deux imports comparables.
 *
 * Elles ne produisent pas pour autant le même fichier À L'OCTET : chaque
 * processeur horodate son activité avec `Date.now()` (`generateBaseData`), et
 * l'archive elle-même porte un `mtime`. Vérifié : une fois les horodatages
 * neutralisés, deux exécutions sont identiques fichier par fichier. Rendre la
 * sonde byte-stable demanderait de toucher au chemin de production pour le seul
 * confort d'un outil de diagnostic — on s'en abstient.
 *
 * Elle couvre les TROIS voies d'assemblage, et chaque module que le parcours
 * sait poser :
 *   • H5P            → octets du `.h5p` dans le pool + `mod_h5pactivity` ;
 *   • Test           → banque de questions régénérée à la racine du backup ;
 *   • autres Moodle  → dossier d'activité renuméroté en place.
 *
 * Le pipeline est celui de la production, sans raccourci : fixture →
 * `json-healer` → processeur → assemblage → `createMbz`.
 *
 * **Pourquoi Chromium et non Node**, contrairement à `generer-h5p-sonde-elea.mjs` :
 * la Page et le Livre composent leur HTML avec un VRAI DOM
 * (`generateHtmlFromBlocks` : `createElement`, `createComment`, `appendChild`,
 * puis sérialisation `innerHTML`). Le bootstrap Node du banc roundtrip ne
 * fournit que des éléments-souches — il n'a jamais eu à faire mieux, la suite T5
 * ne couvrant ni Page ni Livre. Les fabriquer en Node donnerait une sonde
 * DÉGRADÉE sur les deux modules les plus employés d'un parcours : autant ne pas
 * la fabriquer du tout. On paie donc un navigateur, et la sonde est fidèle.
 *
 * Lancement :  node scripts/generer-parcours-sonde.mjs [--sortie=<dossier>]
 *                                                     [--plateforme=elea|magistere|moodle]
 * Sortie par défaut : `tests/sonde-parcours/`
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8123;

// ------------------------------------------------------------------ args CLI
const argv = process.argv.slice(2);
const getArg = (n) => {
    const a = argv.find(x => x.startsWith(`--${n}=`));
    return a ? a.split('=').slice(1).join('=') : null;
};
// Dossier VISIBLE et versionné, à dessein. Il s'est d'abord appelé
// `.sonde-parcours` : le point le rendait invisible dans le Finder, si bien
// qu'une copie périmée traînant ailleurs a été importée à sa place, et
// l'aller-retour a validé le fichier d'avant. Un fichier que quelqu'un doit
// aller chercher à la main ne se cache pas.
const SORTIE = resolve(ROOT, getArg('sortie') || 'tests/sonde-parcours');
const PLATEFORME = getArg('plateforme') || 'elea';

// Horodatage fixe des fichiers de niveau COURS (sections, carnet de notes,
// moodle_backup.xml). Les activités, elles, portent celui de leur processeur :
// cf. l'en-tête sur ce qui varie d'une exécution à l'autre.
const TIMESTAMP = 1756000000;

/**
 * Horodatage de GÉNÉRATION, porté par le titre du cours.
 *
 * C'est le repère qui ne se perd pas. Un nom de fichier se renomme, se copie,
 * se retrouve en double dans un dossier de téléchargements — et on importe
 * alors une sonde périmée sans le voir, ce qui est arrivé le 4 sept. 2026 :
 * l'aller-retour a validé, avec application, le fichier de la veille au matin.
 * Le titre du cours, lui, s'affiche dans la plateforme APRÈS l'import : il
 * suffit de le lire pour savoir ce qu'on vient vraiment d'importer.
 */
const HORODATAGE = new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
}).replace(',', '');

/**
 * Le parcours-sonde, étape par étape.
 *
 * Chaque carte nomme sa fixture et ce qu'elle met à l'épreuve — c'est ce texte
 * qui se retrouve dans la fiche de relevé, pour que la personne qui importe
 * sache quoi regarder sans lire ce script.
 */
const SONDE = [
    {
        titre: 'Le pool de fichiers (H5P)',
        objectif: 'Le .h5p est-il retrouvé dans le pool et joué par la plateforme ?',
        cartes: [
            { module: 'Flashcards', fixture: 'flashcards_1.json',
              titre: 'Sonde H5P — Cartes mémoire',
              controle: 'L\'activité s\'ouvre et les cartes se retournent.' },
            { module: 'QuizSet', fixture: 'quiz_mixte_1.json',
              titre: 'Sonde H5P — Quiz à plusieurs questions',
              controle: 'Les sous-questions défilent et le score s\'affiche à la fin.' },
        ],
    },
    {
        titre: 'Les modules Moodle auto-porteurs',
        objectif: 'Les dossiers d\'activité renumérotés sont-ils restaurés intacts ?',
        cartes: [
            { module: 'Page', fixture: 'page_1.json',
              titre: 'Sonde Moodle — Page',
              controle: 'La mise en page et les titres sont là.' },
            { module: 'Livre', fixture: 'livre_1.json',
              titre: 'Sonde Moodle — Livre',
              controle: 'Le sommaire liste tous les chapitres, dans l\'ordre.' },
            { module: 'Devoir', fixture: 'devoir_1.json',
              titre: 'Sonde Moodle — Devoir',
              controle: 'La grille d\'évaluation est complète.' },
        ],
    },
    {
        titre: 'Les greffons Éléa',
        objectif: 'Les modules qui n\'existent que sur Éléa (à ignorer ailleurs).',
        cartes: [
            { module: 'QCM', fixture: 'qcm_1.json',
              titre: 'Sonde Éléa — QCM',
              controle: 'Les questions et leurs réponses sont là.' },
            { module: 'Millionnaire', fixture: 'millionnaire_1.json',
              titre: 'Sonde Éléa — Millionnaire',
              controle: 'Le jeu démarre avec ses questions.' },
            { module: 'Appariement', fixture: 'appariement_1.json',
              titre: 'Sonde Éléa — Appariement',
              controle: 'Les paires sont à associer.' },
        ],
    },
    {
        titre: 'Les modules propres au parcours',
        objectif: 'Les formes XML propres au parcours — les seules que Caramel écrit lui-même.',
        cartes: [
            { module: 'parcours_etiquette', fixture: null,
              titre: 'Sonde — Texte de liaison',
              contenu: {
                  title: 'Sonde — Texte de liaison',
                  intro: 'Ce texte doit apparaître DANS la page du cours, pas comme un lien à ouvrir.',
              },
              controle: 'Le texte s\'affiche à même la page de la section, sans qu\'on clique.' },
            { module: 'parcours_forum', fixture: null,
              titre: 'Sonde — Forum',
              contenu: {
                  title: 'Sonde — Forum',
                  intro: 'Le forum doit exister, porter cette consigne, et être VIDE de discussions.',
              },
              controle: 'Le forum s\'ouvre, la consigne est là, et on peut lancer un fil.' },
            { module: 'parcours_sondage', fixture: null,
              titre: 'Sonde — Sondage',
              contenu: {
                  title: 'Sonde — Sondage',
                  intro: 'Trois options doivent être proposées au vote.',
                  options: ['Première option', 'Deuxième option', 'Troisième option'],
              },
              controle: 'Les TROIS options sont proposées et le vote fonctionne.' },
            { module: 'parcours_nuage_mots', fixture: null,
              titre: 'Sonde — Nuage de mots',
              contenu: {
                  title: 'Sonde — Nuage de mots',
                  intro: 'Ce nuage sert à voir ce que la classe a déjà en tête avant de commencer.',
                  instructions: 'En un mot chacun : à quoi te fait penser le mot « révolution » ?',
              },
              controle: 'Le champ de saisie accepte un mot, et le nuage se dessine. La consigne « à quoi te fait penser… » est bien VISIBLE, distincte de la description.' },
            { module: 'parcours_mur_notes', fixture: null,
              titre: 'Sonde — Mur de post-it',
              contenu: {
                  title: 'Sonde — Mur de post-it',
                  intro: 'Dépose une note dans la colonne qui correspond à ce que tu ressens.',
                  // 20 caractères MAXIMUM par titre : `stickynotes_column.title`
                  // est un char(20), et un dépassement fait échouer la
                  // restauration du cours entier (cf. modules-parcours.js).
                  // La 3ᵉ fait exactement 20 : c'est la borne, testée pour
                  // elle-même. La 2ᵉ dépasse à dessein, pour éprouver la
                  // troncature en conditions réelles.
                  colonnes: ['Je sais', 'Ce que je crois savoir', 'À vérifier : 20 car.'],
              },
              controle: 'Les TROIS colonnes sont là, dans cet ordre. La 2e est RACCOURCIE '
                      + '(« Ce que je crois » : titre limité à 20 caractères par Moodle), '
                      + 'la 3e fait exactement 20 caractères et doit passer INTACTE. On peut coller une note.' },
        ],
    },
    {
        titre: 'Modules natifs — faire le point, s’exercer (27 sept. 2026)',
        objectif: 'Les modules ouverts le 27 sept. 2026 : leur contenu structuré doit revenir intact.',
        cartes: [
            { module: 'parcours_lien', fixture: null,
              titre: 'Sonde — Lien web',
              source: { type: 'lien', url: 'https://fr.wikipedia.org/wiki/Cycle_de_l%27eau' },
              contenu: {
                  title: 'Sonde — Lien web',
                  intro: 'Ouvre l’article et relève les quatre étapes du cycle de l’eau.',
              },
              controle: 'Le lien ouvre l’article Wikipédia « Cycle de l’eau » dans un NOUVEL onglet.' },
            { module: 'parcours_questionnaire', fixture: null,
              titre: 'Sonde — Questionnaire',
              contenu: {
                  title: 'Sonde — Questionnaire',
                  intro: 'Réponds à ces questions avant de commencer : il n’y a pas de mauvaise réponse.',
                  questions: [
                      { texte: 'D’où vient l’eau de pluie ?', type: 'unique', choix: ['Des océans', 'Des rivières', 'Des nuages seulement'] },
                      { texte: 'Quels états de l’eau connais-tu ?', type: 'multiple', choix: ['Solide', 'Liquide', 'Gazeux'] },
                      { texte: 'As-tu déjà étudié le cycle de l’eau ?', type: 'ouinon', choix: [] },
                      { texte: 'Décris une situation où tu as vu de la condensation.', type: 'libre', choix: [] },
                  ],
              },
              controle: 'QUATRE questions, dans l’ordre : choix unique (3 choix), cases à cocher (3 choix), oui/non, réponse libre.' },
            { module: 'parcours_enquete', fixture: null,
              titre: 'Sonde — Enquête (Feedback)',
              contenu: {
                  title: 'Sonde — Enquête (Feedback)',
                  intro: 'Tes réponses sont anonymes : dis-nous ce que tu as pensé de la séquence.',
                  questions: [
                      { texte: 'As-tu compris le cycle de l’eau ?', type: 'unique', choix: ['Oui, très bien', 'En partie', 'Pas encore'] },
                      { texte: 'Qu’est-ce qui t’a aidé ?', type: 'multiple', choix: ['La page', 'La leçon', 'Le forum'] },
                      { texte: 'La séquence était-elle trop longue ?', type: 'ouinon', choix: [] },
                      { texte: 'Une suggestion ?', type: 'libre', choix: [] },
                  ],
              },
              controle: 'QUATRE éléments : choix unique, choix multiple, Oui/Non, zone de texte. Anonyme.' },
            { module: 'parcours_lecon', fixture: null,
              titre: 'Sonde — Leçon',
              contenu: {
                  title: 'Sonde — Leçon',
                  intro: 'Avance page par page : une question te laisse passer quand tu as compris.',
                  pages: [
                      { titre: 'Le Soleil, moteur du cycle', texte: 'Le Soleil chauffe l’eau des océans, qui s’évapore.', question: '', reponses: [] },
                      { titre: 'L’évaporation', texte: 'La vapeur d’eau monte dans l’atmosphère.', question: 'Quelle énergie provoque l’évaporation ?',
                        reponses: [{ texte: 'Le Soleil', correcte: true }, { texte: 'Le vent', correcte: false }, { texte: 'La Lune', correcte: false }] },
                      { titre: 'La condensation', texte: 'En refroidissant, la vapeur forme les nuages.', question: '', reponses: [] },
                  ],
              },
              controle: 'TROIS pages : « Continuer » sur la 1re ; la 2e pose une question (3 réponses) qui ne laisse passer qu’avec « Le Soleil » ; la 3e termine la leçon.' },
            // D79 : le paquetage est écrit ENTIER par Caramel — pages, manifeste,
            // archive, table des matières sérialisée à la PHP. Jamais importé encore.
            { module: 'parcours_ims', fixture: null,
              titre: 'Sonde — Paquetage IMS',
              contenu: {
                  title: 'Sonde — Paquetage IMS',
                  intro: 'Trois pages à parcourir avec la table des matières.',
                  pages: [
                      { titre: 'Le cycle de l’eau', texte: 'L’eau circule sans cesse entre les océans, l’air et les sols.\n## Quatre étapes\n- l’**évaporation**\n- la condensation\n- les précipitations\n- le ruissellement' },
                      { titre: 'Évaporation & condensation', texte: 'Le Soleil chauffe l’eau, qui s’évapore.\nEn refroidissant, la vapeur forme les nuages.' },
                      { titre: 'Précipitations', texte: 'L’eau des nuages retombe en pluie, en neige ou en grêle.' },
                  ],
              },
              controle: 'TROIS pages dans la table des matières, dans l’ordre ; « Évaporation & condensation » s’écrit avec son « & » ; la 1re page montre un intertitre « Quatre étapes », une liste de quatre puces et « évaporation » en gras ; les boutons Précédent / Suivant du lecteur passent d’une page à l’autre.' },
            { module: 'parcours_atelier', fixture: null,
              titre: 'Sonde — Atelier',
              contenu: {
                  title: 'Sonde — Atelier',
                  intro: 'Rédige un paragraphe, puis évalue ceux de deux camarades.',
                  consigneAuteurs: 'Rédige dix lignes expliquant le cycle de l’eau.',
                  consigneEvaluateurs: 'Vérifie les étapes et le vocabulaire ; commence par ce qui est réussi.',
                  criteres: ['Les quatre étapes sont citées.', 'Chaque étape est expliquée.', 'Le vocabulaire scientifique est employé.'],
              },
              controle: 'L’atelier est en phase « Mise en place », avec les deux consignes et TROIS critères (onglet « Formulaire d’évaluation »).' },
            { module: 'parcours_base', fixture: null,
              titre: 'Sonde — Base de données',
              contenu: {
                  title: 'Sonde — Base de données',
                  intro: 'Ajoute une fiche pour chaque observation.',
                  rubriques: ['Lieu : où tu as observé', 'Observation : ce que tu as vu', 'Étape du cycle : laquelle ?'],
              },
              controle: 'TROIS champs (Lieu, Observation, Étape du cycle) ; on peut ajouter une fiche.' },
        ],
    },
    {
        titre: 'Modules natifs — échanger, coopérer (27 sept. 2026)',
        objectif: 'Des espaces collectifs, livrés vides ; les modules sans achèvement ne ferment aucune étape.',
        cartes: [
            { module: 'parcours_tableau', fixture: null,
              titre: 'Sonde — Tableau',
              contenu: {
                  title: 'Sonde — Tableau',
                  intro: 'Dépose une note dans la colonne qui convient.',
                  titresColonnes: ['Ce que je sais', 'Ce que je me demande', 'Ce que j’ai appris'],
              },
              controle: 'TROIS colonnes à ces titres, dans l’ordre ; on peut y déposer une note.' },
            { module: 'parcours_wiki', fixture: null,
              titre: 'Sonde — Wiki',
              contenu: { title: 'Sonde — Wiki', intro: 'Écrivons ensemble le lexique du cycle de l’eau.', premierePage: 'Lexique de la classe' },
              controle: 'Le wiki s’ouvre sur la création de la page « Lexique de la classe ».' },
            { module: 'parcours_glossaire', fixture: null,
              titre: 'Sonde — Glossaire à construire',
              contenu: { title: 'Sonde — Glossaire à construire', intro: 'Ajoute un mot, sa définition et un exemple.' },
              controle: 'Le glossaire est VIDE et accepte une entrée.' },
            { module: 'parcours_document', fixture: null,
              titre: 'Sonde — Document collaboratif',
              contenu: { title: 'Sonde — Document collaboratif', intro: 'Rédigez ensemble le compte rendu.', texteInitial: 'Compte rendu\n1. Hypothèse\n2. Expérience\n3. Conclusion' },
              controle: 'Le document s’ouvre et contient le plan de départ (Compte rendu, 1. Hypothèse…).' },
            { module: 'parcours_etherpad', fixture: null,
              titre: 'Sonde — Etherpad',
              contenu: { title: 'Sonde — Etherpad', intro: 'Prenez des notes ensemble pendant l’expérience.' },
              controle: 'Le bloc-notes s’ouvre et accepte du texte.' },
            { module: 'parcours_depot', fixture: null,
              titre: 'Sonde — Partage de fichiers',
              contenu: { title: 'Sonde — Partage de fichiers', intro: 'Dépose une photo de ton expérience.' },
              controle: 'Le dépôt s’ouvre et accepte un fichier ; aucune date limite.' },
            { module: 'parcours_classe_virtuelle', fixture: null,
              titre: 'Sonde — Classe virtuelle',
              contenu: { title: 'Sonde — Classe virtuelle', intro: 'Rendez-vous en direct pour faire le point.', accueil: 'Bienvenue ! Coupe ton micro en arrivant.' },
              controle: 'La salle existe (salle seule, sans enregistrement) ; l’enseignant y est animateur.' },
            { module: 'parcours_choix_groupe', fixture: null,
              titre: 'Sonde — Choix de groupe',
              contenu: { title: 'Sonde — Choix de groupe', intro: 'Choisis ton équipe pour le projet.' },
              controle: 'Le choix de groupe existe, SANS option (aucun groupe dans le cours) : c’est attendu.' },
            // D89 : Éléa seul (écarté ailleurs par le filtre de plateforme). Arrive VIDE ;
            // achèvement « avoir créé une question », qui ne dépend que de l'élève.
            { module: 'parcours_test_etudiant', fixture: null,
              titre: 'Sonde — Test étudiant',
              contenu: { title: 'Sonde — Test étudiant', intro: 'Crée une question sur le cycle de l’eau, puis réponds à celles de tes camarades, note-les et commente-les.' },
              controle: 'Le Test étudiant s’ouvre VIDE, avec sa consigne. En élève : créer une question, y répondre, la noter, la commenter ; le classement s’affiche. '
                      + 'Paramètres : points 10 / 5 / 3 / 2 / −1, achèvement « au moins 1 question créée » SANS condition de points. '
                      + 'L’étape suivante ne s’ouvre qu’une fois la question créée. Ré-exporter et comparer studentquiz.xml (coursemodule = le module restauré).' },
        ],
    },
    {
        titre: 'La banque de questions (Test natif)',
        objectif: 'LE point le plus délicat : la banque vit à la RACINE du backup.',
        cartes: [
            { module: 'test_elea', fixture: 'test_1.json',
              titre: 'Sonde Moodle — Test',
              controle: 'Le Test contient TOUTES ses questions, chacune notée, et la '
                      + 'banque de questions du cours porte une catégorie à son nom.' },
        ],
    },
];

// --------------------------------------------------------------- fabrication

/** Sert le dépôt en statique, le temps de la fabrication. */
function servir() {
    const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'],
        { cwd: ROOT, stdio: 'ignore' });
    process.on('exit', () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } });
    return server;
}

async function attendreServeur(ms = 15000) {
    const fin = Date.now() + ms;
    while (Date.now() < fin) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok) return true; }
        catch { /* pas prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

/**
 * Fabrique le `.mbz` DANS la page : c'est le seul endroit où la Page et le
 * Livre composent réellement leur HTML, et où `createMbz` dispose de tar-js et
 * de fflate tels que le produit les charge.
 */
async function fabriquerDansLeNavigateur(page) {
    return page.evaluate(async ({ SONDE, PLATEFORME, TIMESTAMP, HORODATAGE }) => {
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { modulesDisponibles } = await import('/js/parcours/activity-router.js');

        const disponibles = new Set(modulesDisponibles(PLATEFORME).map(m => m.cle));
        const etapes = [];
        const ignorees = [];
        let n = 0;

        for (const bloc of SONDE) {
            const cartes = [];
            for (const c of bloc.cartes) {
                if (!disponibles.has(c.module)) {
                    ignorees.push({ titre: c.titre, module: c.module, motif: `absent de la palette « ${PLATEFORME} »` });
                    continue;
                }
                let contenu;
                if (c.contenu) {
                    // Modules propres au parcours : pas de fixture dans le dépôt,
                    // leur contenu tient en deux champs et vit dans ce fichier.
                    contenu = c.contenu;
                } else {
                    try {
                        const r = await fetch(`/assets/data/examples/${c.fixture}`);
                        if (!r.ok) throw new Error(String(r.status));
                        contenu = await r.json();
                    } catch (e) {
                        ignorees.push({ titre: c.titre, module: c.module, motif: `fixture illisible (${c.fixture})` });
                        continue;
                    }
                }
                cartes.push({
                    id: `s${++n}`, titre: c.titre, objectif: c.controle, consigne: '',
                    module: c.module, moduleReplie: false, palier: 'entrainement',
                    duree: 10, verrouillee: false, contenu,
                    // Le Lien web tient son adresse de la carte (sa « source »).
                    ...(c.source ? { source: c.source } : {}),
                });
            }
            if (cartes.length) {
                // Le numéro est calculé À LA CONSTRUCTION, pas écrit dans `SONDE` :
                // un bloc entier peut être écarté par le filtre de plateforme (les
                // greffons Éléa sur Magistère), et une numérotation figée laisserait
                // alors un trou — « 1, 2, 4, 5 » — qu'on prendrait pour une section
                // perdue à la restauration.
                const rang = etapes.length + 1;
                // Chaque étape s'ouvre sur son texte d'introduction (D64) : l'étiquette
                // doit revenir EN TÊTE de section, et ne pas bloquer l'ouverture
                // progressive de l'étape suivante.
                etapes.push({ id: `e${rang}`, titre: `${rang} — ${bloc.titre}`, objectif: bloc.objectif,
                    introduction: `Texte d'introduction de l'étape ${rang}. Il doit s'afficher au-dessus de ses activités.`,
                    cartes });
            }
        }

        const plan = {
            titre: `Sonde Caramel ${HORODATAGE} — ${PLATEFORME}`,
            objectifGeneral: "Vérifier qu'un .mbz de cours s'importe et se restaure entièrement",
            // L'accueil du parcours (D64) : attendu en tête de la section 0,
            // AVANT la Carte de progression.
            introduction: "Texte d'accueil du parcours. Il doit s'afficher en haut du cours, avant la carte.",
            notionsPivots: [], origine: 'sonde', personnalise: false, etapes,
            // La Carte de progression est demandée à la sonde, alors qu'elle est
            // décochée par défaut dans l'atelier : c'est précisément ce que
            // l'aller-retour doit éprouver (D24). Le filtre de plateforme la
            // laissera tomber d'elle-même sur Magistère et sur un Moodle nu.
            carte: { actif: true, theme: 'paysage' },
            // Comme la Carte : demandée à la sonde alors qu'elle est décochée
            // dans l'atelier, parce que c'est ce que l'aller-retour doit
            // éprouver (D24). Les restrictions d'accès sont du noyau Moodle :
            // elles partent sur les trois plateformes, pas seulement sur Éléa.
            progression: { actif: true },
        };

        // On passe par `assemblerParcours`, c'est-à-dire par le chemin de
        // PRODUCTION exact — et non par une réplique de l'assemblage. Une sonde
        // qui recopierait les étapes du produit finirait par les recopier de
        // travers : elle avait déjà cessé de poser l'ouverture progressive, qui
        // se pose après l'assemblage, sans que rien ne le signale.
        const paquet = await assemblerParcours(plan, {
            timestamp: TIMESTAMP, platformId: PLATEFORME,
        });
        const octets = paquet.bytes;

        return {
            // Les octets traversent le pont Playwright en tableau simple : un
            // Uint8Array y arriverait sous forme d'objet indexé.
            octets: Array.from(octets),
            ignorees, exclues: paquet.exclues,
            sections: paquet.sections.length,
            activites: paquet.activites.length,
            textes: paquet.textes || 0,
            carte: paquet.activites.some(a => a.moduleName === 'mapmodules'),
            etapesContraintes: paquet.etapesContraintes,
            resume: plan.etapes.map(e => ({
                titre: e.titre,
                cartes: e.cartes.map(c => ({ titre: c.titre, module: c.module, controle: c.objectif })),
            })),
        };
    }, { SONDE, PLATEFORME, TIMESTAMP, HORODATAGE });
}

/** La fiche de relevé, à côté du fichier : quoi regarder, dans quel ordre. */
function ficheDeReleve({ resume, ignorees, activites, textes = 0, sections, exclues, carte,
                        etapesContraintes, nomMbz, octets }) {
    const l = [];
    l.push(`# Sonde de parcours — ${PLATEFORME}`);
    l.push('');
    l.push(`Fichier : \`${nomMbz}\` (${(octets / 1024).toFixed(1)} Ko)`);
    l.push(`Généré par : \`node scripts/generer-parcours-sonde.mjs --plateforme=${PLATEFORME}\``);
    l.push('');
    l.push(`> **Une fois importé, le cours doit s'appeler « Sonde Caramel ${HORODATAGE} — ${PLATEFORME} ».**`);
    l.push('> Si le titre affiché diffère, c\'est un ANCIEN fichier qui a été importé, et');
    l.push('> tout ce qui suit ne vaut rien. Régénérez, réimportez.');
    l.push('');
    l.push('Ce fichier ne contient AUCUN texte produit par une IA : il part des exemples');
    l.push('du dépôt. Il ne met à l\'épreuve que l\'ASSEMBLAGE — c\'est la seule question');
    l.push('qu\'un banc local ne peut pas trancher à la place de la plateforme.');
    l.push('');
    l.push('Le régénérer donne le même cours (mêmes sections, mêmes activités, mêmes');
    l.push('textes) : deux imports sont comparables. Seuls les horodatages internes');
    l.push('changent — sans effet sur la restauration.');
    l.push('');
    l.push('## Comment l\'importer');
    l.push('');
    l.push('1. Créer un cours VIDE (ne pas réutiliser un cours existant : on veut voir');
    l.push('   exactement ce que le fichier pose, et rien d\'autre).');
    l.push('2. Administration du cours → **Restauration**, déposer le `.mbz`.');
    l.push('3. Choisir **« Fusionner la sauvegarde avec ce cours »**, tout laisser par');
    l.push('   défaut, puis valider jusqu\'au bout.');
    l.push('4. Noter **tout message d\'avertissement** de l\'assistant de restauration :');
    l.push('   c\'est là que Moodle signale une référence qu\'il n\'a pas su résoudre.');
    l.push('');
    l.push('## Ce qu\'il faut regarder, dans cet ordre');
    l.push('');
    l.push('### a. La structure du cours');
    l.push('');
    l.push(`- [ ] Le cours compte **${sections - 1} sections** nommées (plus la zone`);
    l.push(carte
        ? '      « Généralités », qui contient le texte d\'accueil PUIS la Carte de progression) :'
        : '      « Généralités », qui ne contient que le texte d\'accueil) :');
    for (const e of resume) l.push(`      - ${e.titre}`);
    l.push(`- [ ] Il compte **${activites - textes} activités** au total, dans l'ordre ci-dessous,`);
    l.push(`      plus **${textes} textes** posés dans la page (D64).`);
    l.push('- [ ] Chaque section s\'ouvre sur son **texte d\'introduction**, AU-DESSUS de ses');
    l.push('      activités, lisible sans cliquer, sans lien ni case d\'achèvement.');
    l.push('- [ ] Aucune section vide ni dupliquée, aucune activité en double.');
    l.push('');
    l.push('### b. Chaque activité, une par une');
    l.push('');
    for (const e of resume) {
        l.push(`**${e.titre}**`);
        l.push('');
        for (const c of e.cartes) l.push(`- [ ] **${c.titre}** (${c.module}) — ${c.controle}`);
        l.push('');
    }
    l.push('### c. Le carnet de notes');
    l.push('');
    l.push('- [ ] Ouvrir le carnet de notes : chaque activité notée y a SA ligne, une seule.');
    l.push('- [ ] Aucune ligne orpheline, aucune catégorie en double.');
    l.push('');
    l.push('### d. La banque de questions (si le Test est présent)');
    l.push('');
    l.push('- [ ] Banque de questions du cours → une catégorie au nom du Test.');
    l.push('- [ ] Elle contient toutes ses questions, chacune ouvrable sans erreur.');
    l.push('- [ ] Le Test lui-même les enchaîne et rend une note.');
    l.push('');
    l.push('### e. Les modules propres au parcours');
    l.push('');
    l.push('Leur XML est le seul que Caramel écrit lui-même, sans passer par un processeur');
    l.push('éprouvé. C\'est donc ici, et nulle part ailleurs, qu\'ils se valident.');
    l.push('');
    l.push('**Déjà validés** par l\'aller-retour du 4 sept. 2026 (Éléa ET Magistère) —');
    l.push('à re-cocher seulement en cas de doute :');
    l.push('');
    l.push('- [ ] Le **texte de liaison** s\'affiche à même la page, sans qu\'on clique.');
    l.push('- [ ] Le **forum** s\'ouvre, porte sa consigne, et permet de lancer un fil.');
    l.push('- [ ] Le **sondage** propose bien ses TROIS options, et le vote fonctionne.');
    l.push('');
    l.push('**Validés** eux aussi, par l\'aller-retour Magistère du 4 sept. 2026 :');
    l.push('');
    l.push('- [ ] Le **nuage de mots** s\'ouvre. Sa QUESTION (« à quoi te fait penser… »)');
    l.push('      est visible, et distincte de sa description. Un mot saisi apparaît.');
    l.push('- [ ] Le **mur de post-it** montre ses TROIS colonnes, dans l\'ordre. La');
    l.push('      deuxième s\'affiche RACCOURCIE — « Ce que je crois » : Moodle plafonne');
    l.push('      le titre d\'une colonne à 20 caractères. On peut y coller une note.');
    l.push('- [ ] Aucun des deux ne provoque d\'erreur à la restauration.');
    l.push('');
    l.push('> Le raccourcissement de la deuxième colonne n\'est PAS un défaut : Moodle');
    l.push('> stocke le titre d\'une colonne en `char(20)`, et un dépassement ne tronque');
    l.push('> pas — il fait échouer la restauration du cours entier. Cf. § 7 du PRD.');
    l.push('');
    l.push('**À valider** — les modules natifs ouverts le 27 sept. 2026 (D70), sections');
    l.push('« Modules natifs ». Chaque carte dit quoi regarder ; en plus :');
    l.push('');
    l.push('- [ ] La restauration va au bout, sans module écarté.');
    l.push('- [ ] En tête du cours, une étiquette **« À faire avant d’ouvrir le cours »**,');
    l.push('      marquée « Caché pour les étudiants », liste l’atelier, la classe');
    l.push('      virtuelle et le choix de groupe.');
    l.push('- [ ] L’étape qui suit « échanger, coopérer » n’attend PAS le wiki, le document,');
    l.push('      l’Etherpad, le dépôt, la classe virtuelle ni le choix de groupe : seuls le');
    l.push('      tableau et le glossaire (qui ont un achèvement) la conditionnent.');
    l.push('');
    if (carte) {
        l.push('### f. La Carte de progression — le module en cours de validation');
        l.push('');
        l.push('Elle est posée en **zone « Généralités »**, en tête de cours. C\'est le seul');
        l.push('module du parcours qui n\'a jamais franchi l\'aller-retour : tout ce qui suit');
        l.push('est à cocher pour de bon, et le résultat va au PRD.');
        l.push('');
        l.push('- [ ] **La restauration va au bout.** C\'est le point le plus important, avant');
        l.push('      même l\'apparence : le greffon lève une exception PHP quand il ne');
        l.push('      reconnaît pas le nom de l\'activité, et cette exception ferait échouer');
        l.push('      l\'import du COURS ENTIER, sans nommer le module en cause.');
        l.push('- [ ] L\'activité s\'appelle **« Carte standard : paysage »** — ce nom n\'est pas');
        l.push('      un titre, c\'est ce qui indique au greffon quelle image charger.');
        l.push('- [ ] **L\'image de fond s\'affiche** (une route qui serpente dans un paysage)');
        l.push('      et le **chemin** y est tracé. Une image sans chemin = le `path` n\'a pas');
        l.push('      traversé ; un cadre vide = l\'image n\'a pas été retrouvée.');
        l.push('- [ ] La carte se voit **directement dans la page du cours**, sans cliquer.');
        l.push('- [ ] **Une icône par activité** du cours, TOUTES sections confondues — c\'est');
        l.push('      ce que vaut `targetsection = 666` (« Toutes les sections »). Ni les');
        l.push('      textes de liaison ni la carte elle-même ne doivent y figurer.');
        l.push('- [ ] L\'objectif général du parcours s\'affiche **au-dessus** du chemin.');
        l.push('- [ ] Ouvrir les réglages de la carte SANS rien changer : la section visée');
        l.push('      doit y être « Toutes les sections », et l\'image la bonne.');
        l.push('');
        l.push('**Et la question que seule la plateforme peut trancher** — faire UNE activité');
        l.push('en entier (un H5P, puis une Page), revenir à la carte :');
        l.push('');
        l.push('- [ ] Quelles icônes passent au « fait » ? Recensement fait sur le');
        l.push('      ré-export du 6 sept. 2026 : **toutes** les activités portent un critère');
        l.push('      effectif, chacune celui qui lui convient — la note (H5P, Test), la');
        l.push('      consultation (Page, Livre, forum, sondage), le dépôt (Devoir), une');
        l.push('      tentative (QCM, Millionnaire, Appariement), une note déposée (mur).');
        l.push('      Seuls le texte de liaison et la carte n\'ont pas d\'achèvement, et la');
        l.push('      carte les exclut de toute façon.');
        l.push('- [ ] Noter ce qu\'on observe VRAIMENT, y compris si cela contredit ce qui');
        l.push('      précède : c\'est ce relevé, et non une déduction, qui doit commander le');
        l.push('      chantier suivant — l\'achèvement d\'activité.');
        l.push('');
    }
    if (etapesContraintes) {
        l.push(`### ${carte ? 'g' : 'f'}. L'ouverture progressive — le second module à valider`);
        l.push('');
        l.push(`Les étapes 2 à ${etapesContraintes + 1} portent une restriction d'accès : chacune`);
        l.push('ne s\'ouvre que lorsque TOUTES les activités de la précédente sont terminées.');
        l.push('La condition est posée sur la SECTION, pas sur chaque activité.');
        l.push('');
        l.push('- [ ] **La restauration va au bout.** Une condition qui pointerait dans le');
        l.push('      vide rendrait l\'étape indisponible pour toujours.');
        l.push('- [ ] **L\'étape 1 est OUVERTE**, sans aucune restriction. Si elle est fermée,');
        l.push('      le parcours entier est inaccessible et tout le reste est sans objet.');
        l.push('- [ ] Les étapes suivantes s\'affichent **grisées mais VISIBLES**, avec la');
        l.push('      raison en clair (« Non disponible tant que… est marqué comme terminé »).');
        l.push('      Si elles sont invisibles, le réglage `showc` n\'a pas été compris.');
        l.push('- [ ] Ouvrir les réglages d\'une étape restreinte : la condition doit y être');
        l.push('      lisible, et **nommer les activités de l\'étape précédente** — pas des');
        l.push('      identifiants orphelins ni des activités d\'un autre cours.');
        l.push('- [ ] La condition ne nomme **aucun texte d\'introduction** : un texte ne');
        l.push('      s\'achève jamais, et l\'étape suivante resterait fermée pour toujours.');
        l.push('- [ ] Terminer TOUTES les activités de l\'étape 1, puis recharger : l\'étape 2');
        l.push('      doit s\'ouvrir. **C\'est le seul contrôle qui prouve la chaîne entière** —');
        l.push('      l\'achèvement, le remappage des identifiants et la condition.');
        l.push('');
        l.push('> Ce qu\'on cherche vraiment ici : Moodle REMAPPE-T-IL les identifiants de');
        l.push('> module à l\'intérieur de la condition ? Le backup les écrit avec les nôtres ;');
        l.push('> le cours d\'accueil en a d\'autres. C\'est une fonction de base de Moodle et');
        l.push('> elle devrait suivre, mais nous ne l\'avons jamais vue faire — et le mode');
        l.push('> d\'échec est une étape verrouillée à vie.');
        l.push('');
    }
    const rang = 'fghi'[(carte ? 1 : 0) + (etapesContraintes ? 1 : 0)];
    l.push(`### ${rang}. Le retour (facultatif, mais c'est là qu'on apprend le plus)`);
    l.push('');
    l.push('- [ ] Ré-exporter le cours depuis la plateforme (Sauvegarde), récupérer le');
    l.push('      `.mbz` produit, et comparer : ce que Moodle a gardé, réécrit ou jeté');
    l.push('      dit exactement ce que notre synthèse doit corriger.');
    l.push('');
    if (exclues.length || ignorees.length) {
        l.push('## Écarté à la fabrication');
        l.push('');
        for (const x of ignorees) l.push(`- ${x.titre} (${x.module}) — ${x.motif}`);
        for (const x of exclues) l.push(`- ${x.titre} (${x.module}) — ${x.motif}${x.detail ? ` : ${x.detail}` : ''}`);
        l.push('');
    }
    l.push('## À reporter dans le PRD');
    l.push('');
    l.push('Quel que soit le résultat, il va dans `docs/PRD_PARCOURS.md` — § 11 (journal)');
    l.push('si tout passe, § 7 (pièges) si quelque chose casse. Un aller-retour dont le');
    l.push('résultat n\'est pas écrit devra être refait.');
    return l.join('\n') + '\n';
}

// ------------------------------------------------------------------- main
servir();
if (!await attendreServeur()) {
    console.error(`Serveur HTTP absent sur ${PORT}.`);
    process.exit(1);
}

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push(String(e.message || e)));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0,
    null, { timeout: 60000, polling: 200 });

const r = await fabriquerDansLeNavigateur(page);
await navigateur.close();

if (r.erreur) {
    console.error(`Sonde impossible : ${r.erreur}`);
    process.exit(1);
}

const octets = Buffer.from(r.octets);
await mkdir(SORTIE, { recursive: true });
const nomMbz = `sonde-parcours-${PLATEFORME}.mbz`;
await writeFile(join(SORTIE, nomMbz), octets);
await writeFile(
    join(SORTIE, `sonde-parcours-${PLATEFORME}.md`),
    ficheDeReleve({
        resume: r.resume, ignorees: r.ignorees, activites: r.activites, textes: r.textes,
        sections: r.sections, exclues: r.exclues, carte: r.carte,
        etapesContraintes: r.etapesContraintes,
        nomMbz, octets: octets.length,
    }),
);

console.log(`\n✓ ${nomMbz} — ${(octets.length / 1024).toFixed(1)} Ko`);
console.log(`  ${r.activites - (r.textes || 0)} activité(s) et ${r.textes || 0} texte(s) dans ${r.sections - 1} section(s) nommée(s)`);
if (r.carte) console.log('    Zone « Généralités » · Carte de progression (mapmodules)');
if (r.etapesContraintes) console.log(`    Ouverture progressive : ${r.etapesContraintes} étape(s) contrainte(s)`);
for (const e of r.resume) {
    console.log(`    ${e.titre}`);
    for (const c of e.cartes) console.log(`      · ${c.titre.padEnd(40)} ${c.module}`);
}
if (r.ignorees.length || r.exclues.length) {
    console.log('\n  Écarté :');
    for (const x of r.ignorees) console.log(`      · ${x.module} — ${x.motif}`);
    for (const x of r.exclues) console.log(`      · ${x.module} — ${x.motif}${x.detail ? ` (${x.detail})` : ''}`);
}
if (erreurs.length) console.log('\n  ⚠ erreurs JS de page :', erreurs.join(' | '));
console.log(`\n  Fiche de relevé : ${join(SORTIE, `sonde-parcours-${PLATEFORME}.md`)}\n`);
process.exit(0);
