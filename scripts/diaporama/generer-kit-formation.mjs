#!/usr/bin/env node
/**
 * Fabrique le kit de formation rapide de Caramel : un diaporama de prise en main pour
 * les enseignants qui découvrent l'outil et pour les formateurs qui le présentent.
 * Deux parties — générer une activité, concevoir un parcours —, une diapositive « À
 * savoir » et une clôture. Une idée par diapositive, des captures réelles, et sur chaque
 * diapositive des notes du présentateur (ce que l'on peut dire).
 *
 *   node scripts/diaporama/generer-kit-formation.mjs                  tout
 *   node scripts/diaporama/generer-kit-formation.mjs --date=2026-10-01
 *   node scripts/diaporama/generer-kit-formation.mjs --sans-rendu     le .pptx seul
 *
 * **À relancer à chaque version de Caramel** : la version est lue dans le pied de page
 * d'`index.html`, la date est celle du jour (ou `--date`) ; les deux figurent sur la
 * couverture, en pied de chaque diapositive et dans `kit-formation.json`.
 *
 * Ce qui sort, dans `assets/presentation/kit-formation/` :
 *   - `caramel-kit-formation.pptx` — PowerPoint, sans animation, notes du présentateur ;
 *   - `caramel-kit-formation.odp`  — LibreOffice Impress, converti par LibreOffice ;
 *   - `caramel-kit-formation.pdf`  — à imprimer ou à projeter tel quel ;
 *   - `diapositives/NN.webp`       — le rendu de chaque diapositive ;
 *   - `kit-formation.json`         — version, date, fichiers, titres et notes.
 *
 * Les captures viennent de deux endroits :
 *   - `assets/images/wiki/` (refaites par `scripts/captures-interface.mjs`) ;
 *   - `assets/presentation/kit-formation/captures/` (refaites par
 *     `scripts/diaporama/captures-kit-formation.mjs`) : les refaire AVANT si l'interface a changé.
 *
 * Charte, aides de mise en page et conversion : `commun.mjs`, partagé avec le diaporama
 * de présentation (`generer-diaporama.mjs`). Les libellés cités entre « » sont ceux de
 * l'interface (`js/locales/fr.json`), au caractère près : les vérifier s'ils changent.
 */
import { join } from 'node:path';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
    ROOT, PptxGenJS, versionEtDate, C, W, X0, XW, LIENS,
    preparerImages, rendreIconesEtQr, outilsDeMiseEnPage, insecables, convertir, rendreImages,
} from './commun.mjs';

const argv = process.argv.slice(2);
const option = nom => (argv.find(a => a.startsWith(`--${nom}=`)) || '').split('=')[1];
const SANS_RENDU = argv.includes('--sans-rendu');

const SORTIE = join(ROOT, 'assets/presentation/kit-formation');
const NOM = 'caramel-kit-formation';
// Un profil LibreOffice à soi : un autre LibreOffice ouvert sur un profil commun ferait
// échouer la conversion sans message.
const PROFIL_LO = '/private/tmp/claude-501/kit-formation-lo';
const temp = mkdtempSync(join(tmpdir(), 'kit-formation-'));
process.on('exit', () => rmSync(temp, { recursive: true, force: true }));

const { VERSION, DATE_ISO, DATE, MOIS } = versionEtDate(option('date'));

// Les couleurs des chemins, celles de l'atelier (css/components/parcours.css) : une
// couleur par chemin, une teinte claire pour le fond.
const CHEMINS = {
    bases: { nom: 'Reprendre les bases', fort: '8F5A00', clair: 'FBF1E0' },
    renforcer: { nom: 'Renforcer', fort: '0E7468', clair: 'E3F4F1' },
    consolider: { nom: 'Consolider', fort: '1A5FB4', clair: 'E6EFFA' },
    approfondir: { nom: 'Approfondir', fort: '6A3FA3', clair: 'EFE8F8' },
};

// ─────────────────────────────────────────────────────────────── Images
// `crop` en pixels de la capture d'origine, `max` : largeur plafonnée.
const WIKI = 'assets/images/wiki', KIT = 'assets/presentation/kit-formation/captures';
const IMAGES = {
    accueil: { src: `${WIKI}/caramel-accueil.webp`, max: 2000 },
    rapide: { src: `${WIKI}/caramel-mode-rapide.png`, max: 2000 },
    avance: { src: `${WIKI}/caramel-mode-avance.png`, max: 1800 },
    activites: { src: `${WIKI}/caramel-activites.png`, max: 2000 },
    modeles: { src: `${KIT}/modeles.webp`, max: 2000 },
    guide: { src: `${KIT}/guide.webp`, max: 1800, coins: true },
    resultat: { src: `${KIT}/resultat.webp`, max: 1480 },
    apercu: { src: `${KIT}/apercu.webp`, max: 1800 },
    barre: { src: `${KIT}/apercu.webp`, crop: [40, 1520, 2228, 1670], max: 2000 },
    editeur: { src: `${KIT}/editeur.webp`, max: 1800 },
    aideImport: { src: `${KIT}/aide-import.webp`, max: 1800 },
    tutoriel: { src: `${WIKI}/modale_tutoriels.PNG`, max: 1221 },
    sucrerie: { src: `${KIT}/sucrerie.webp`, crop: [0, 0, 2268, 1712], max: 1600 },
    commutateur: { src: `${WIKI}/parcours-cadrage.webp`, crop: [0, 410, 2184, 680], max: 2000 },
    cadrage: { src: `${WIKI}/parcours-cadrage.webp`, crop: [0, 680, 2184, 2044], max: 1800 },
    trames: { src: `${WIKI}/parcours-trames.webp`, max: 1800 },
    cadrageActions: { src: `${KIT}/cadrage-actions.webp`, max: 2016 },
    plan: { src: `${WIKI}/parcours-plan.webp`, crop: [0, 1100, 2184, 2282], max: 2000 },
    mosaique: { src: `${WIKI}/parcours-mosaique.webp`, max: 1600, coins: true },
    annulation: { src: `${KIT}/annulation.webp`, max: 2000 },
    fabrication: { src: `${WIKI}/parcours-fabrication.webp`, crop: [0, 0, 2184, 1520], max: 1800 },
    livraison: { src: `${KIT}/livraison.webp`, max: 1600 },
    chemins: { src: `${WIKI}/parcours-chemins.webp`, crop: [0, 690, 2184, 1650], max: 2000 },
    ouvrirChemins: { src: `${KIT}/ouvrir-chemins.webp`, max: 2000 },
    eleve: { src: `${WIKI}/parcours-eleve.webp`, crop: [6, 6, 1834, 1746], max: 1400, coins: true },
    livraisonChemins: { src: `${KIT}/livraison-chemins.webp`, max: 2000 },
    eleveFin: { src: `${KIT}/eleve-fin.webp`, max: 1764 },
    finParcours: { src: `${KIT}/fin-parcours.webp`, max: 2016 },
    caramelia: { src: `${WIKI}/caramelia-assistant.png`, max: 1256 },
};

// ─────────────────────────────────────────────────────────────── Icônes
const ICONES = {};
const ICONES_A_RENDRE = [
    ['user', C.caramelFonce], ['lightbulb', C.caramelFonce], ['microphone', C.caramelFonce], ['sliders', C.caramelFonce],
    ['file-arrow-up', C.caramelFonce], ['filter', C.caramelFonce], ['wand-magic-sparkles', C.caramelFonce],
    ['copy', C.caramelFonce], ['paste', C.caramelFonce], ['user-lock', C.caramelFonce], ['eye', C.caramelFonce],
    ['pen-to-square', C.caramelFonce], ['download', C.caramelFonce], ['circle-question', C.caramelFonce],
    ['share-nodes', C.prune], ['globe', C.prune], ['lock', C.prune], ['route', C.caramelFonce],
    ['layer-group', C.caramelFonce], ['list-check', C.caramelFonce], ['rotate-left', C.caramelFonce], ['clock', C.caramelFonce],
    ['screwdriver-wrench', C.caramelFonce], ['box-archive', C.caramelFonce], ['file-export', C.caramelFonce], ['code-fork', C.caramelFonce],
    ['user-graduate', C.caramelFonce], ['flag-checkered', C.caramelFonce], ['magnifying-glass', C.caramelFonce],
    ['hourglass-half', C.caramelFonce], ['hand', C.caramelFonce], ['seedling', C.caramelFonce], ['book', C.caramelFonce],
    ['film', C.caramelFonce], ['star', C.caramelFonce], ['print', C.caramelFonce], ['display', C.caramelFonce],
    ['circle-info', C.bleuFonce], ['triangle-exclamation', C.caramelTexte], ['arrow-right', C.encre3], ['circle-check', C.vert],
    ['file-lines', C.caramelFonce], ['comments', C.caramelFonce],
];

// ─────────────────────────────────────────────────────────────── Aides de mise en page
let pres;
const { icone, texte, carte, capture, pastille, numero, puces, gras, lien, entete, notesDeBas } =
    outilsDeMiseEnPage({ presentation: () => pres, images: IMAGES, icones: ICONES, typographie: insecables });

/** « Libellé » de l'interface, en gras : ce que l'on cherche des yeux à l'écran. */
const bouton = t => ({ text: `« ${t} »`, options: { bold: true, color: C.encre } });
const t = text => ({ text });

/**
 * Des étapes numérotées : une pastille bleue et son texte (chaîne ou segments).
 * `pas` : écart vertical d'une étape à la suivante.
 */
function etapes(s, items, { x, y, w, pas = 0.62, corps = 14, taille = 0.36 }) {
    items.forEach((el, k) => {
        const yy = y + k * pas;
        numero(s, k + 1, x, yy, { taille, corps: corps - 2 });
        texte(s, typeof el === 'string' ? el : el, { x: x + taille + 0.2, y: yy - 0.03, w: w - taille - 0.2, h: pas - 0.04, fontSize: corps, color: C.encre2, valign: 'top' });
    });
}

/** Un bandeau de mise en garde ou d'information, sur fond teinté, avec son pictogramme. */
function bandeau(s, x, y, w, h, runs, { ic = 'circle-info', couleur = C.bleuFonce, fond = C.bleuDoux, bord = 'C5DAF2', corps = 13.5 } = {}) {
    carte(s, x, y, w, h, { fond, bord, avecOmbre: false });
    s.addImage({ path: ICONES[icone(ic, couleur)], x: x + 0.25, y: y + h / 2 - 0.15, w: 0.3, h: 0.3 });
    texte(s, runs, { x: x + 0.72, y, w: w - 0.95, h, fontSize: corps, valign: 'middle', color: C.encre });
}

/** Un intertitre de colonne. */
const intertitre = (s, txt, x, y, w) => texte(s, txt, { x, y, w, h: 0.36, fontSize: 17, bold: true });

// ─────────────────────────────────────────────────────────────── Les diapositives
const DIAPOSITIVES = [];
const diapo = d => DIAPOSITIVES.push(d);
const PARTIES = ['Partie 1 · Générer une activité', 'Partie 2 · Concevoir un parcours'];

// 1 ── Couverture
diapo({
    titre: 'Prendre en main Caramel', fond: C.surface, sansPied: true,
    notes: `Ce kit sert à prendre en main Caramel en une séance courte. Caramel est une application web gratuite, sans compte, qui prépare avec l'IA des activités interactives et des parcours complets pour Éléa, Magistère et Moodle. Le déroulé suit deux parties : générer une activité, puis concevoir un parcours. Chaque diapositive porte une idée et montre l'écran réel ; les libellés cités entre guillemets sont ceux des boutons. Support conforme à Caramel ${VERSION}, mis à jour le ${DATE}.`,
    dessiner(s) {
        s.addImage({ path: ICONES['logo-caramel'], x: 0.85, y: 1.05, w: 1.05, h: 1.05 });
        texte(s, 'Prendre en main Caramel', { x: 0.85, y: 2.3, w: 5.8, h: 1.5, fontSize: 44, bold: true, lineSpacingMultiple: 0.95 });
        texte(s, 'Kit de formation rapide : générer une activité, concevoir un parcours', { x: 0.85, y: 3.85, w: 5.5, h: 0.85, fontSize: 20, color: C.encre2, lineSpacingMultiple: 1.08 });
        texte(s, 'Pour les enseignants qui découvrent l’outil, et les formateurs qui le présentent. Éléa, Magistère, Moodle.', { x: 0.85, y: 4.8, w: 5.5, h: 0.6, fontSize: 13, color: C.encre3 });
        texte(s, [lien('caramel.forge.apps.education.fr', LIENS.caramel, { bold: true })], { x: 0.85, y: 5.6, w: 5.4, h: 0.35, fontSize: 16 });
        texte(s, `Kit de formation · Caramel v${VERSION} · ${DATE}`, { x: 0.85, y: 6.1, w: 5.6, h: 0.3, fontSize: 12, color: C.encre3 });
        capture(s, 'accueil', 6.75, 1.55, { w: 6.05 });
    },
});

// 2 ── Au programme
diapo({
    titre: 'Au programme',
    notes: 'Deux parties. D’abord une activité seule : on décrit son besoin, on choisit un type d’activité, on génère, on relit, on télécharge et on importe dans sa plateforme. Ensuite un parcours complet : un cours entier, organisé en étapes, livré dans un seul fichier — le même pour tous les élèves, ou différencié selon les résultats d’un test. On termine par quelques points à savoir et par les ressources pour continuer seul.',
    dessiner(s) {
        entete(s, null, 'Au programme');
        const items = [
            ['wand-magic-sparkles', 'Générer une activité', 'Décrire son besoin, choisir le type d’activité, générer, relire, exporter, importer dans sa plateforme.'],
            ['route', 'Concevoir un parcours', 'Un cours entier en quatre temps : cadrage, plan, fabrication, livraison. Linéaire ou différencié.'],
            ['circle-info', 'À savoir', 'Relire, protéger les élèves, patienter ou recommencer : les bons réflexes.'],
            ['book', 'Pour continuer', 'Le tutoriel intégré, l’assistante Caramelia, les vidéos de la page « Découvrir Caramel ».'],
        ];
        const cw = (XW - 0.4) / 2;
        items.forEach(([ic, titre, d], k) => {
            const x = X0 + (k % 2) * (cw + 0.4), y = 1.75 + Math.floor(k / 2) * 2.2;
            carte(s, x, y, cw, 1.9);
            numero(s, k + 1, x + 0.4, y + 0.45, { taille: 0.62, corps: 20 });
            texte(s, titre, { x: x + 1.3, y: y + 0.38, w: cw - 1.6, h: 0.45, fontSize: 21, bold: true });
            texte(s, d, { x: x + 1.3, y: y + 0.88, w: cw - 1.6, h: 0.9, fontSize: 14.5, color: C.encre2 });
        });
        texte(s, [gras('Pour qui ? '), t('les enseignants du second degré sur Éléa, les formateurs sur Magistère, et plus largement tout utilisateur de Moodle.')], { x: X0, y: 6.3, w: XW, h: 0.4, fontSize: 14, color: C.encre2 });
    },
});

// ─────────────────────────────────────────────── Partie 1
// 3 ── Décrire
diapo({
    partie: PARTIES[0], titre: 'Décrivez votre besoin en deux champs',
    notes: 'Tout commence sur la page d’accueil, par deux champs. « Qui êtes-vous ? » : une réponse courte suffit, par exemple « Professeur de mathématiques » ou « Formatrice académique ». « Que souhaitez-vous aborder ? » : c’est le cœur de la demande ; plus elle est précise — thème, niveau, contraintes —, meilleure est l’activité. C’est le mode Rapide, celui qui s’ouvre par défaut. Chaque champ se dicte aussi au micro. Tant que les deux champs sont vides, les tuiles d’activités restent grisées.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Décrivez votre besoin en deux champs');
        capture(s, 'rapide', X0 + (XW - 9.4) / 2, 1.65, { w: 9.4 });
        const cols = [
            ['user', '« Qui êtes-vous ? »', 'Votre rôle, en quelques mots : « Professeur de mathématiques », « Formateur académique ».'],
            ['lightbulb', '« Que souhaitez-vous aborder ? »', 'Le thème, le niveau, vos contraintes. Plus c’est précis, meilleure est l’activité.'],
            ['microphone', 'Au micro', 'Un clic sur le micro d’un champ, et vous dictez au lieu de taper.'],
        ];
        const cw = (XW - 0.6) / 3;
        cols.forEach(([ic, titre, d], k) => {
            const x = X0 + k * (cw + 0.3), y = 4.4;
            pastille(s, ic, x, y, { taille: 0.56 });
            texte(s, titre, { x: x + 0.72, y: y - 0.02, w: cw - 0.72, h: 0.6, fontSize: 14.5, bold: true, valign: 'middle' });
            texte(s, d, { x, y: y + 0.72, w: cw, h: 0.95, fontSize: 14, color: C.encre2 });
        });
        texte(s, [gras('« Mode Rapide » '), t('s’ouvre par défaut. Les tuiles d’activités restent grisées tant que les deux champs sont vides.')], { x: X0, y: 6.25, w: XW, h: 0.4, fontSize: 13.5, color: C.encre2 });
    },
});

// 4 ── Mode Avancé
diapo({
    partie: PARTIES[0], titre: 'Le mode Avancé : préciser, et joindre votre cours',
    notes: 'L’onglet « Mode Avancé » ajoute deux précisions — le niveau, et le nombre de questions ou d’éléments — et surtout la zone « Joindre des documents (facultatif) ». On y colle un texte ou on y dépose son propre cours : PDF, Word, LibreOffice, diaporama, image, audio ou vidéo, ou encore une page web par son lien. L’IA travaille alors exclusivement à partir de ces documents : ils deviennent la référence. Sans document, l’IA s’appuie sur ses connaissances. Le texte est extrait dans le navigateur ; rappel utile : aucune donnée personnelle d’élève dans les documents.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Le mode Avancé : préciser, et joindre votre cours');
        const lw = 5.3;
        puces(s, [
            [gras('« Pour quel niveau »'), t(' : la classe ou le public visé.')],
            [gras('« Nombre de questions/éléments dans le module »'), t(' : par exemple 5 ou 10.')],
            [gras('« Joindre des documents (facultatif) »'), t(' : collez un texte ou déposez vos fichiers — PDF, Word (DOCX), LibreOffice, diaporama, image, audio, vidéo — ou un lien web.')],
        ], { x: X0, y: 1.75, w: lw, h: 3.3, corps: 15, espace: 12 });
        carte(s, X0, 4.45, lw, 1.3, { fond: C.creme, bord: 'EEE0CF', avecOmbre: false });
        pastille(s, 'file-lines', X0 + 0.25, 4.8, { taille: 0.56, fond: C.creme2 });
        texte(s, 'Avec vos documents, l’IA travaille exclusivement à partir d’eux : votre cours devient la référence.', { x: X0 + 1.0, y: 4.45, w: lw - 1.2, h: 1.3, fontSize: 14.5, bold: true, color: C.caramelTexte, valign: 'middle' });
        capture(s, 'avance', X0 + lw + 0.45, 1.7, { w: XW - lw - 0.45, h: 4.55 });
    },
});

// 5 ── Choisir
diapo({
    partie: PARTIES[0], titre: 'Choisissez le type d’activité',
    notes: 'Sous le formulaire, chaque tuile est un type d’activité : trente-cinq en tout, vingt-sept au format H5P — quiz, texte à trous, glisser-déposer, mots croisés, vidéo interactive… — et huit modules de la plateforme, comme la Page, le Livre ou le Test. Deux rangées de filtres aident à s’y retrouver : par famille, et par plateforme ou format. Les activités H5P fonctionnent sur Éléa, Magistère et Moodle. Un clic sur une tuile ouvre sa fenêtre de génération.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Choisissez le type d’activité');
        const r = capture(s, 'activites', X0 + 0.08, 1.75, { w: 7.9 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [gras('35 tuiles'), t(' : 27 activités H5P interactives et 8 modules de la plateforme (Page, Livre, Test…).')],
            [gras('Par famille'), t(' : « Tout », « Quiz & Tests », « Manipulation de texte », « Mémorisation & Découverte ».')],
            [gras('Par plateforme ou format'), t(' : « H5P », « Éléa », « Magistère », « Moodle ».')],
            [gras('Un clic sur une tuile'), t(' ouvre sa fenêtre de génération.')],
        ], { x, y: 1.8, w, h: 4.5, corps: 14.5, espace: 12 });
        notesDeBas(s, [t('H5P : format libre d’activités interactives, lu par Éléa, Magistère et Moodle. Le badge de chaque tuile indique son format.')]);
    },
});

// 6 ── Générer en un clic + modèle
diapo({
    partie: PARTIES[0], titre: 'Générer en un clic, et choisir le modèle d’IA',
    notes: 'La fenêtre d’une tuile s’ouvre en mode Simple : un seul bouton, « Générer en un clic ». L’IA de Caramel, hébergée en France, prépare l’activité en quelques dizaines de secondes. La petite flèche à droite du bouton ouvre le choix du modèle : Gemma 4, rapide et léger ; Qwen 3.8, plus nuancé ; Mistral Small 4, le plus puissant, choisi par défaut, et plus lent. Si une génération échoue ou tarde, on relance, ou on essaie un autre modèle.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Générer en un clic, et choisir le modèle d’IA');
        capture(s, 'modeles', X0 + 0.08, 1.75, { w: 7.6 });
        const x = X0 + 8.2, w = XW - 8.2;
        etapes(s, [
            [t('Cliquez sur '), bouton('Générer en un clic'), t('.')],
            [t('La flèche à droite du bouton ouvre le choix du modèle.')],
            [t('Quelques dizaines de secondes plus tard, l’activité est prête.')],
        ], { x, y: 1.85, w, pas: 0.85, corps: 14.5 });
        const modeles = [['Gemma 4', 'rapide et léger'], ['Qwen 3.8', 'plus riche, plus nuancé'], ['Mistral Small 4', 'le plus puissant, par défaut ; plus lent']];
        modeles.forEach(([n, d], k) => {
            const y = 4.55 + k * 0.5;
            texte(s, [gras(n), { text: `  ${d}`, options: { color: C.encre2 } }], { x, y, w, h: 0.4, fontSize: 14 });
        });
        notesDeBas(s, [t('Les modèles de Caramel sont hébergés en France, sur des serveurs de l’Enseignement supérieur et de la recherche (ILaaS).')]);
    },
});

// 7 ── Mode Guidé : IA de son choix
diapo({
    partie: PARTIES[0], titre: 'Ou passer par l’IA de votre choix : le mode Guidé',
    notes: 'L’interrupteur « Simple » / « Guidé », en haut de la fenêtre, affiche deux panneaux. À gauche, « 1/2 Obtenir le prompt à copier » : c’est l’ensemble des consignes que Caramel envoie à l’IA ; on peut le lire, le déverrouiller pour le modifier, et le copier. On le colle dans l’IA de son choix, puis on recopie sa réponse — un bloc de texte au format JSON — dans le panneau de droite, « 2/2 Créer le fichier à partir du JSON ». Le bouton devient alors « Générer l’activité ». Attention : avec une IA externe, ce sont ses conditions d’utilisation qui s’appliquent. On n’y met jamais de nom ni d’information personnelle d’élève.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Ou passer par l’IA de votre choix : le mode Guidé');
        const r = capture(s, 'guide', X0 + 0.08, 1.7, { h: 4.55 });
        const x = r.x + r.w + 0.5, w = X0 + XW - x;
        etapes(s, [
            [t('Basculez l’interrupteur de '), bouton('Simple'), t(' à '), bouton('Guidé'), t('.')],
            [t('Dans '), bouton('1/2 Obtenir le prompt à copier'), t(', cliquez sur '), bouton('Copier le prompt'), t('.')],
            [t('Collez-le dans l’IA de votre choix.')],
            [t('Recopiez sa réponse dans '), bouton('2/2 Créer le fichier à partir du JSON'), t('.')],
            [t('Cliquez sur '), bouton('Générer l’activité'), t('.')],
        ], { x, y: 1.75, w, pas: 0.8, corps: 13.5 });
        bandeau(s, x, 5.85, w, 0.92, [gras('Aucune donnée personnelle d’élève '), t('dans ce que vous envoyez à une IA externe : ses conditions s’appliquent.')], { ic: 'triangle-exclamation', couleur: C.caramelTexte, fond: C.creme, bord: 'EEE0CF', corps: 12.5 });
    },
});

// 8 ── Votre sucrerie est prête
diapo({
    partie: PARTIES[0], titre: 'L’activité est prête : télécharger ou visualiser',
    notes: 'Une fois l’activité générée, une fenêtre annonce « Votre sucrerie est prête ! ». Le grand bouton télécharge le fichier pour la plateforme : un .h5p pour une activité H5P, un .mbz ou un .xml pour un module de la plateforme. La flèche propose aussi une version papier, en Word, LibreOffice ou PDF. Mais le bon réflexe est l’autre bouton, « Visualiser et éditer » : on regarde l’activité avant de la télécharger.',
    dessiner(s) {
        entete(s, PARTIES[0], 'L’activité est prête : télécharger ou visualiser');
        capture(s, 'resultat', X0 + 0.08, 1.75, { w: 6.9 });
        const x = X0 + 7.55, w = XW - 7.55;
        puces(s, [
            [bouton('Télécharger en H5P'), t(' : le fichier pour la plateforme (selon l’activité : H5P, MBZ ou XML).')],
            [t('La flèche : '), bouton('Format DOCX'), t(', '), bouton('Format ODT'), t(', '), bouton('Format PDF'), t(' pour une version papier.')],
            [bouton('Visualiser et éditer'), t(' : l’aperçu, avant tout téléchargement.')],
        ], { x, y: 1.8, w, h: 3.4, corps: 15, espace: 14 });
        bandeau(s, x, 4.05, w, 0.95, [gras('Bon réflexe : '), t('visualiser avant de télécharger.')], { ic: 'eye', couleur: C.caramelFonce, fond: C.creme, bord: 'EEE0CF', corps: 14 });
    },
});

// 9 ── Aperçu
diapo({
    partie: PARTIES[0], titre: 'Visualisez : l’activité comme vos élèves la verront',
    notes: 'L’aperçu montre l’activité telle que les élèves la verront sur la plateforme, et on peut la jouer : répondre, vérifier, recommencer. En haut, les plateformes compatibles. En bas, la barre de l’aperçu rassemble tout : « Télécharger » et un bouton par format, le point d’interrogation qui explique l’import, « Vers la Sucrerie » pour partager, et « Éditer » pour corriger.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Visualisez : l’activité comme vos élèves la verront');
        const r = capture(s, 'apercu', X0 + 0.08, 1.7, { h: 4.6 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [gras('On la joue'), t(' : répondre, vérifier, recommencer, comme un élève.')],
            [gras('En haut'), t(' : les plateformes compatibles (Éléa, Magistère, Moodle).')],
            [gras('En bas'), t(' : '), bouton('Télécharger'), t(' et un bouton par format, le '), gras('?'), t(' de l’import, '), bouton('Vers la Sucrerie'), t(' et '), bouton('Éditer'), t('.')],
        ], { x, y: 1.8, w, h: 4.4, corps: 15, espace: 14 });
    },
});

// 10 ── Éditeur
diapo({
    partie: PARTIES[0], titre: 'Corrigez dans l’éditeur visuel',
    notes: 'Le bouton « Éditer » ouvre l’éditeur visuel, sans code. À gauche, la liste des éléments — ici les phrases du texte à trous — qu’on ajoute, supprime ou réordonne par glisser-déposer. À droite, le détail de l’élément choisi : texte enrichi, formules mathématiques avec un assistant, images, retours, réglages. « Enregistrer » met à jour l’aperçu et les fichiers à télécharger ; « Aide » rappelle la syntaxe propre à chaque activité. C’est l’étape à ne jamais sauter : l’IA peut se tromper.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Corrigez dans l’éditeur visuel');
        const r = capture(s, 'editeur', X0 + 0.08, 1.7, { h: 4.6 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [bouton('Éditer'), t(' dans la barre de l’aperçu.')],
            [gras('À gauche'), t(' : la liste des éléments, à ajouter, supprimer, réordonner.')],
            [gras('À droite'), t(' : le détail — texte enrichi, formules, images, retours, réglages.')],
            [bouton('Enregistrer'), t(' met à jour l’aperçu et les fichiers.')],
        ], { x, y: 1.8, w, h: 3.6, corps: 14.5, espace: 11 });
        bandeau(s, x, 5.35, w, 0.95, [gras('L’IA peut se tromper : '), t('relisez chaque élément.')], { ic: 'magnifying-glass', couleur: C.caramelFonce, fond: C.creme, bord: 'EEE0CF', corps: 13.5 });
    },
});

// 11 ── Exporter
diapo({
    partie: PARTIES[0], titre: 'Exportez : pour la plateforme, et pour la classe',
    notes: 'Chaque activité sort sous deux formes. Pour la plateforme : le fichier .h5p d’une activité interactive ; pour un module de la plateforme, un .mbz, la sauvegarde Moodle d’une activité ; pour une banque de questions ou un glossaire, un .xml. Pour la classe : une version imprimable en Word, LibreOffice ou PDF, avec l’énoncé et le corrigé ; dans Word et LibreOffice, les formules mathématiques restent modifiables.',
    dessiner(s) {
        entete(s, PARTIES[0], 'Exportez : pour la plateforme, et pour la classe');
        capture(s, 'barre', X0 + 0.6, 1.75, { w: XW - 1.2 });
        const blocs = [
            ['display', 'Pour la plateforme', [
                [gras('.h5p'), t(' : une activité interactive (quiz, texte à trous, mots croisés…).')],
                [gras('.mbz'), t(' : un module de la plateforme (Page, Livre, Devoir…).')],
                [gras('.xml'), t(' : des questions pour la banque de questions, ou un glossaire.')],
            ]],
            ['print', 'Pour la classe', [
                [gras('DOCX'), t(' (Word) et '), gras('ODT'), t(' (LibreOffice) : l’énoncé et son corrigé, à retoucher ; les formules restent modifiables.')],
                [gras('PDF'), t(' : à imprimer tel quel.')],
            ]],
        ];
        const cw = (XW - 0.4) / 2;
        blocs.forEach(([ic, titre, lignes], k) => {
            const x = X0 + k * (cw + 0.4), y = 3.0;
            carte(s, x, y, cw, 3.3);
            pastille(s, ic, x + 0.35, y + 0.33, { taille: 0.6 });
            texte(s, titre, { x: x + 1.15, y: y + 0.36, w: cw - 1.4, h: 0.5, fontSize: 19, bold: true, valign: 'middle' });
            puces(s, lignes, { x: x + 0.35, y: y + 1.15, w: cw - 0.7, h: 2.2, corps: 14.5, espace: 10 });
        });
    },
});

// 12 ── Importer : le ?
diapo({
    partie: PARTIES[0], titre: 'Importez dans votre plateforme : le « ? » vous guide',
    notes: 'Dans la barre de l’aperçu, à droite du bouton du format, un petit point d’interrogation : « Aide pour importer ce fichier ». Il ouvre « Comment utiliser ce fichier ? », avec les étapes et des captures. Pour un .h5p, deux méthodes : la méthode simple — glisser-déposer le fichier dans une section du cours en mode édition — et la méthode recommandée, par « Ajouter une activité ou une ressource », puis « Contenu interactif (H5P) ». Un .mbz s’importe sans écraser le contenu du cours. Les captures montrent Éléa ; la démarche est très proche sur Magistère et Moodle. Le « Tutoriel », en haut de Caramel, reprend tout pas à pas, dans son chapitre « Intégrer dans Éléa / Magistère / Moodle ».',
    dessiner(s) {
        entete(s, PARTIES[0], 'Importez dans votre plateforme : le « ? » vous guide');
        const r = capture(s, 'aideImport', X0 + 0.08, 1.7, { w: 6.9 });
        const x = r.x + r.w + 0.5, w = X0 + XW - x;
        puces(s, [
            [t('Dans l’aperçu, le '), gras('?'), t(' à droite du format ouvre '), bouton('Comment utiliser ce fichier ?'), t('.')],
            [gras('.h5p'), t(' : glisser-déposer dans une section, ou '), bouton('Ajouter une activité ou une ressource'), t(' › '), bouton('Contenu interactif (H5P)'), t('.')],
            [gras('.mbz'), t(' : s’importe sans écraser le contenu du cours.')],
            [bouton('Tutoriel'), t(', en haut de Caramel : chaque import, pas à pas.')],
        ], { x, y: 1.75, w, h: 4.4, corps: 14, espace: 11 });
        notesDeBas(s, [t('Les captures de l’aide montrent Éléa ; la démarche est très proche sur Magistère et Moodle.')]);
    },
});

// 13 ── Sucrerie
diapo({
    partie: PARTIES[0], titre: 'La Sucrerie : partager, si vous le souhaitez',
    notes: 'La Sucrerie est la bibliothèque publique d’activités qui accompagne Caramel. Le bouton « Vers la Sucrerie », dans l’aperçu, ouvre « Publier sur La Sucrerie ». C’est facultatif, et c’est une publication : l’activité devient publique, visible de tous les enseignants, sous licence libre CC BY-SA 4.0. On s’identifie avec son adresse académique, qui sert aussi à recevoir un lien de gestion pour la retirer. On atteste en être l’auteur, l’avoir vérifiée, et qu’elle ne contient aucune donnée personnelle. Sans ce choix, rien n’est publié : l’activité reste sur votre ordinateur.',
    dessiner(s) {
        entete(s, PARTIES[0], 'La Sucrerie : partager, si vous le souhaitez');
        const r = capture(s, 'sucrerie', X0 + 0.08, 1.7, { h: 4.55 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [bouton('Vers la Sucrerie'), t(', dans l’aperçu, ouvre '), bouton('Publier sur La Sucrerie'), t('.')],
            [gras('L’activité devient publique'), t(' : visible de tous les enseignants, sous licence CC BY-SA 4.0.')],
            [gras('Votre adresse académique'), t(' vous identifie et reçoit le lien de gestion, pour retirer l’activité.')],
            [gras('Vous attestez'), t(' en être l’auteur, l’avoir vérifiée, sans donnée personnelle.')],
        ], { x, y: 1.75, w, h: 3.75, corps: 14, espace: 10 });
        bandeau(s, x, 5.45, w, 0.85, [gras('Facultatif : '), t('sans ce choix, rien n’est publié.')], { ic: 'share-nodes', couleur: C.prune, fond: C.roseClair, bord: 'EDDCE5', corps: 14 });
    },
});

// ─────────────────────────────────────────────── Partie 2
// 14 ── Le parcours en 4 temps
diapo({
    partie: PARTIES[1], titre: 'Un parcours : un cours entier, en quatre temps',
    notes: 'Au-delà d’une activité, Caramel prépare un parcours complet : plusieurs activités organisées en étapes, livrées dans un seul fichier de cours. On garde le même formulaire d’accueil, puis le commutateur « Une activité | Un parcours », juste en dessous, ouvre l’atelier de parcours à la place des tuiles. L’atelier avance en quatre temps : le cadrage, le plan, la fabrication et la livraison. Point important : rien n’est généré avant que vous ayez relu le plan.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Un parcours : un cours entier, en quatre temps');
        capture(s, 'commutateur', X0 + 0.5, 1.75, { w: XW - 1.0 });
        const etapesP = [
            ['Cadrage', 'Plateforme, déroulement, ampleur, chemin, trame.'],
            ['Plan', 'L’IA propose ; vous relisez et modifiez tout.'],
            ['Fabrication', 'Les activités sont générées une à une.'],
            ['Livraison', 'Un seul fichier .mbz, et des documents papier.'],
        ];
        const ew = (XW - 0.9) / 4;
        etapesP.forEach(([titre, d], k) => {
            const x = X0 + k * (ew + 0.3), y = 3.5;
            carte(s, x, y, ew, 2.05);
            numero(s, k + 1, x + 0.3, y + 0.3, { taille: 0.5, corps: 16 });
            texte(s, titre, { x: x + 0.95, y: y + 0.3, w: ew - 1.1, h: 0.5, fontSize: 18, bold: true, valign: 'middle' });
            texte(s, d, { x: x + 0.3, y: y + 1.0, w: ew - 0.55, h: 0.95, fontSize: 14, color: C.encre2 });
        });
        bandeau(s, X0, 5.9, XW, 0.7, [bouton('Un parcours'), t(', sous le formulaire, ouvre l’atelier. '), gras('Rien ne sera généré avant que vous ayez relu le plan.')], { corps: 14 });
    },
});

// 15 ── Cadrage
diapo({
    partie: PARTIES[1], titre: 'Le cadrage : quatre questions',
    notes: 'Le cadrage tient en quatre questions, sous le formulaire déjà rempli. « Pour quelle plateforme ? » : Éléa, Magistère ou Moodle — le vocabulaire suit : élèves sur Éléa, stagiaires sur Magistère, étudiants sur Moodle. « Comment se déroule-t-il ? » : en classe, à distance, ou les deux. « Quelle ampleur ? » : d’une séance de trois ou quatre activités à une séquence entière de neuf à douze. Enfin : « Tous vos élèves suivent-ils le même chemin ? » — un même chemin pour tous, ou des chemins selon les résultats ; on y revient dans un instant.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Le cadrage : quatre questions');
        const r = capture(s, 'cadrage', X0 + 0.08, 1.7, { h: 4.6 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [bouton('Pour quelle plateforme ?'), t(' Éléa, Magistère ou Moodle : élèves, stagiaires ou étudiants.')],
            [bouton('Comment se déroule-t-il ?'), t(' En classe, à distance, ou les deux.')],
            [bouton('Quelle ampleur ?'), t(' D’une séance (3 à 4 activités) à une séquence entière (9 à 12).')],
            [bouton('Tous vos élèves suivent-ils le même chemin ?'), t(' : '), bouton('Un même chemin pour tous'), t(' ou '), bouton('Des chemins selon les résultats'), t('.')],
        ], { x, y: 1.75, w, h: 4.6, corps: 14, espace: 11 });
    },
});

// 16 ── Trame et plan
diapo({
    partie: PARTIES[1], titre: 'Une trame, puis « Composer le plan »',
    notes: 'Sous les quatre questions, « Quelle trame ? » propose des modèles de déroulé : apprendre en autonomie, réviser avant l’évaluation, s’entraîner, évaluer… et d’autres derrière « Voir les autres modèles ». On peut aussi laisser Caramel choisir. Trois boutons pour la suite : « Composer le plan », le plus courant, demande le plan à l’IA — sa flèche choisit le modèle, comme pour une activité ; « Partir du modèle » reprend tel quel le plan de la trame choisie, sans l’IA ; « Personnaliser le plan » donne le prompt à copier vers l’IA de votre choix, puis « 2/2 Coller la réponse de l’IA ». Dans tous les cas, rien n’est encore généré.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Une trame, puis « Composer le plan »');
        const r = capture(s, 'trames', X0 + 0.08, 1.7, { h: 3.75 });
        capture(s, 'cadrageActions', X0 + 0.08, 5.8, { w: XW - 0.16 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [bouton('Quelle trame ?'), t(' Un modèle de déroulé, ou '), bouton('Laissez Caramel proposer'), t('.')],
            [bouton('Composer le plan'), t(' : l’IA propose le plan (la flèche choisit le modèle).')],
            [bouton('Partir du modèle'), t(' : le plan de la trame, sans l’IA.')],
            [bouton('Personnaliser le plan'), t(' : le prompt pour l’IA de votre choix, puis '), bouton('2/2 Coller la réponse de l’IA'), t('.')],
        ], { x, y: 1.75, w, h: 3.8, corps: 14.5, espace: 12 });
    },
});

// 17 ── Relire le plan
diapo({
    partie: PARTIES[1], titre: 'Relisez et modifiez le plan',
    notes: 'Le plan est une proposition, entièrement modifiable. Le titre et l’objectif se réécrivent. La « Relecture du plan » signale ce qui mérite attention, selon plusieurs repères. Chaque étape devient une section du cours : on la réordonne avec les flèches, on la supprime avec la corbeille, on en ajoute avec « Ajouter une étape ». Dans chaque étape, « Ajouter une activité ». Le volet « Consigne et palier » précise ce que l’IA doit produire. Le cadenas réserve une activité dont vous fournirez vous-même le contenu : elle ne sera pas générée. Chaque activité a sa durée en minutes, et la durée totale se recalcule.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Relisez et modifiez le plan');
        const r = capture(s, 'plan', X0 + 0.08, 1.7, { w: 7.3 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [gras('Titre, objectif, consignes'), t(' : tout se réécrit.')],
            [bouton('Relecture du plan'), t(' signale ce qui mérite attention.')],
            [gras('Les étapes'), t(' : flèches pour réordonner, corbeille, '), bouton('Ajouter une étape'), t(', '), bouton('Ajouter une activité'), t('.')],
            [bouton('Consigne et palier'), t(' : ce que l’IA doit produire.')],
            [gras('Le cadenas'), t(' : une activité que vous fournirez vous-même, non générée.')],
            [gras('La durée'), t(' de chaque activité, en minutes ; la durée totale suit.')],
        ], { x, y: 1.75, w, h: 4.6, corps: 13.5, espace: 8 });
    },
});

// 18 ── Changer le type
diapo({
    partie: PARTIES[1], titre: 'Changez le type d’une activité : la mosaïque',
    notes: 'Un clic sur le type d’une activité ouvre la mosaïque « Choisir le type d’activité ». En haut, les activités générées par Caramel ; en bas, les modules de la plateforme — forum, atelier, wiki, choix de groupe… — pour lesquels l’IA rédige la consigne, et dont le contenu viendra de la classe. Si on change d’avis, le bandeau « Annuler la modification » récupère l’ancien contenu : il apparaît après un changement de type ou une suppression.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Changez le type d’une activité : la mosaïque');
        const r = capture(s, 'mosaique', X0 + 0.08, 1.7, { h: 4.05 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [gras('Un clic sur le type'), t(' ouvre '), bouton('Choisir le type d’activité'), t('.')],
            [gras('Activités générées par Caramel'), t(' : toutes celles de l’accueil.')],
            [gras('Modules de la plateforme'), t(' : forum, atelier, wiki… L’IA rédige la consigne, le contenu viendra de la classe.')],
        ], { x, y: 1.75, w, h: 3.1, corps: 14.5, espace: 11 });
        texte(s, 'Un changement regretté ?', { x, y: 4.55, w, h: 0.35, fontSize: 15, bold: true });
        capture(s, 'annulation', x + 0.08, 5.05, { w: w - 0.16 });
        texte(s, [t('Le bandeau apparaît après un changement de type ou une suppression.')], { x, y: 5.8, w, h: 0.5, fontSize: 12.5, color: C.encre3 });
        notesDeBas(s, [t('Ici sur Éléa : la liste des modules de la plateforme suit la plateforme choisie au cadrage.')]);
    },
});

// 19 ── Fabrication
diapo({
    partie: PARTIES[1], titre: 'La fabrication : les activités, une à une',
    notes: 'Quand le plan vous convient, « Fabriquer le parcours » lance la génération des activités, une à une, sous vos yeux. Chacune passe d’« En attente » à « En cours… » puis à « Prête ». Une activité prête se relit avec « Aperçu », se corrige avec « Modifier le contenu », ou se génère à nouveau. La fabrication prend quelques minutes : le service peut être lent, et une activité en échec se relance simplement. Quand tout est prêt, « Assembler le parcours » mène à la livraison.',
    dessiner(s) {
        entete(s, PARTIES[1], 'La fabrication : les activités, une à une');
        const r = capture(s, 'fabrication', X0 + 0.08, 1.7, { h: 4.6 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        etapes(s, [
            [bouton('Fabriquer le parcours'), t(' lance les générations.')],
            [t('Chaque activité passe d’« En attente » à « En cours… », puis « Prête ».')],
            [bouton('Aperçu'), t(', '), bouton('Modifier le contenu'), t(' ou '), bouton('Générer à nouveau'), t('.')],
            [bouton('Assembler le parcours'), t(' mène à la livraison.')],
        ], { x, y: 1.8, w, pas: 0.95, corps: 14 });
        bandeau(s, x, 5.55, w, 0.75, [t('Quelques minutes. Une activité en échec ? '), gras('Relancez-la.')], { ic: 'hourglass-half', couleur: C.caramelFonce, fond: C.creme, bord: 'EEE0CF', corps: 13 });
    },
});

// 20 ── Livraison
diapo({
    partie: PARTIES[1], titre: 'La livraison : un seul fichier de cours',
    notes: 'À la livraison, « Télécharger le parcours (.mbz) » donne un seul fichier qui contient tout le cours : sections, activités et consignes. L’import se fait par restauration, en trois étapes : dans la plateforme, créer un cours vide ou ouvrir celui à compléter ; ouvrir « Restauration » et déposer le fichier .mbz ; choisir « Fusionner avec ce cours », puis valider. S’y ajoutent la fiche de séquence et le détail des activités en Word, LibreOffice ou PDF. Enfin, « Exporter le scénario (.json) » garde le parcours pour le rouvrir plus tard dans Caramel, par « Importer un modèle » en haut de l’atelier — sans refaire les générations. Ce fichier-là ne s’importe pas dans la plateforme.',
    dessiner(s) {
        entete(s, PARTIES[1], 'La livraison : un seul fichier de cours');
        const r = capture(s, 'livraison', X0 + 0.08, 1.7, { h: 4.6 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        intertitre(s, 'Importer par restauration', x, 1.7, w);
        etapes(s, [
            'Créez un cours vide, ou ouvrez celui à compléter.',
            [t('Ouvrez '), bouton('Restauration'), t(' et déposez le fichier .mbz.')],
            [t('Choisissez '), bouton('Fusionner avec ce cours'), t(', puis validez.')],
        ], { x, y: 2.2, w, pas: 0.68, corps: 13.5, taille: 0.32 });
        puces(s, [
            [bouton('Fiche de séquence'), t(' et '), bouton('Détail des activités'), t(' : DOCX, ODT, PDF.')],
            [bouton('Exporter le scénario (.json)'), t(' : pour rouvrir le parcours dans Caramel, par '), bouton('Importer un modèle'), t('.')],
        ], { x, y: 4.45, w, h: 1.9, corps: 13.5, espace: 9 });
    },
});

// 21 ── Différencié : le principe
diapo({
    partie: PARTIES[1], titre: 'Un parcours différencié : des chemins selon les résultats',
    notes: 'Au cadrage, « Des chemins selon les résultats » fait du parcours un parcours différencié. Un test — un quiz ou un Test de la plateforme — oriente chaque élève, d’après sa note à la première tentative, vers l’un de deux à quatre chemins : reprendre les bases, renforcer, consolider, approfondir. On choisit leur nombre avec « Combien de chemins ? ». Chaque élève ne voit que son chemin, puis tous se retrouvent pour une étape commune, jusqu’à la fin du parcours. Les restrictions d’accès sont posées par le fichier lui-même : rien à régler à la main dans la plateforme.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Un parcours différencié : des chemins selon les résultats');
        // Le schéma : un test, trois chemins, une étape commune.
        const y0 = 1.95, hc = 0.78, gap = 0.22;
        const chem = [CHEMINS.renforcer, CHEMINS.consolider, CHEMINS.approfondir];
        const hTotal = chem.length * hc + (chem.length - 1) * gap;
        const tx = X0, tw = 2.35, cx = X0 + 3.25, cw = 3.0, ex = X0 + 7.15, ew = 2.35;
        const ym = y0 + hTotal / 2;
        const boite = (x, y, w, h, titre, sous, fond, bord, couleur) => {
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fond }, line: { color: bord, width: 1.25 } });
            texte(s, [{ text: titre, options: { bold: true, color: couleur, fontSize: 15, breakLine: true } }, { text: sous, options: { color: C.encre2, fontSize: 11.5 } }], { x: x + 0.18, y, w: w - 0.3, h, valign: 'middle' });
        };
        const fleche = (x1, y1, x2, y2) => s.addShape(pres.shapes.LINE, {
            x: x1, y: Math.min(y1, y2), w: x2 - x1, h: Math.max(Math.abs(y2 - y1), 0.001), flipV: y2 < y1,
            line: { color: 'B8B8BE', width: 1.25, endArrowType: 'triangle' },
        });
        boite(tx, ym - 0.6, tw, 1.2, 'Le test', 'sa note, à la 1re tentative, décide', C.surface, C.trait, C.encre);
        chem.forEach((c, k) => {
            const y = y0 + k * (hc + gap);
            boite(cx, y, cw, hc, c.nom, k === 0 ? 'de 0 à 3 bonnes réponses sur 8' : k === 1 ? 'de 4 à 5 sur 8' : 'de 6 à 8 sur 8', c.clair, c.fort, c.fort);
            fleche(tx + tw, ym, cx, y + hc / 2);
            fleche(cx + cw, y + hc / 2, ex, ym);
        });
        boite(ex, ym - 0.6, ew, 1.2, 'Étape commune', 'tous se retrouvent', C.surface, C.trait, C.encre);
        fleche(ex + ew, ym, ex + ew + 0.45, ym);
        boite(ex + ew + 0.45, ym - 0.6, X0 + XW - (ex + ew + 0.45), 1.2, 'Fin du parcours', 'et page de bilan', C.vertDoux, 'B9DDC4', C.vert);
        puces(s, [
            [t('Au cadrage : '), bouton('Des chemins selon les résultats'), t(', puis '), bouton('Combien de chemins ?'), t(' (2, 3 ou 4).')],
            [gras('Chaque élève ne voit que son chemin'), t(', puis tous se retrouvent pour une étape commune.')],
            [gras('Le fichier pose lui-même les restrictions d’accès'), t(' : rien à régler à la main dans la plateforme.')],
        ], { x: X0, y: 5.0, w: XW, h: 1.3, corps: 14.5, espace: 8 });
        notesDeBas(s, [t('Quatre chemins possibles : reprendre les bases, renforcer, consolider, approfondir. Exemple ci-dessus : un test sur 8, trois chemins.')]);
    },
});

// 22 ── Aiguillage
diapo({
    partie: PARTIES[1], titre: 'L’aiguillage : une couleur par chemin',
    notes: 'Dans le plan, sous le test, l’aiguillage montre qui va où. La barre va de zéro bonne réponse au maximum du test, et chaque case prend la couleur du chemin qu’elle ouvre. Les boutons moins et plus déplacent les seuils, une bonne réponse à la fois : les seuils se règlent en nombre de bonnes réponses, pas en pourcentage. « Ajouter un chemin », « Retirer un chemin » ou « Un seul chemin pour tous » changent la structure. Une fois en classe, pour réorienter un élève, il suffit de modifier sa note au test dans le carnet de notes.',
    dessiner(s) {
        entete(s, PARTIES[1], 'L’aiguillage : une couleur par chemin');
        const r = capture(s, 'chemins', X0 + 0.08, 1.7, { w: 7.6 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [gras('La barre'), t(' : de 0 bonne réponse au maximum du test ; chaque case a la couleur de son chemin.')],
            [gras('Les boutons moins et plus'), t(' déplacent les seuils, une bonne réponse à la fois.')],
            [bouton('Ajouter un chemin'), t(', '), bouton('Retirer un chemin'), t(', '), bouton('Un seul chemin pour tous'), t('.')],
        ], { x, y: 1.75, w, h: 2.2, corps: 13.5, espace: 9 });
        texte(s, 'Les quatre chemins possibles', { x, y: 3.95, w, h: 0.3, fontSize: 12.5, bold: true, color: C.encre3 });
        Object.values(CHEMINS).forEach((c, k) => {
            const lw = (w - 0.15) / 2, lx = x + (k % 2) * (lw + 0.15), ly = 4.35 + Math.floor(k / 2) * 0.52;
            s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: lx, y: ly, w: lw, h: 0.4, rectRadius: 0.2, fill: { color: c.clair }, line: { color: c.fort, width: 1 } });
            texte(s, c.nom, { x: lx, y: ly, w: lw, h: 0.4, fontSize: 12, bold: true, color: c.fort, align: 'center', valign: 'middle' });
        });
        bandeau(s, X0, 5.55, XW, 0.72, [gras('Réorienter un élève : '), t('modifiez sa note au test dans le carnet de notes de la plateforme.')], { corps: 14 });
    },
});

// 23 ── Ouvrir des chemins sur un parcours linéaire
diapo({
    partie: PARTIES[1], titre: 'Différencier un parcours déjà composé',
    notes: 'Pas besoin de tout reprendre au cadrage. Dans un parcours linéaire, chaque étape qui contient un test propose « Ouvrir des chemins selon ce test ». Un clic, et l’étape suivante se scinde en chemins — trois par défaut, que « Retirer un chemin » ou « Ajouter un chemin » ajustent —, avec l’aiguillage de la diapositive précédente. L’étape d’origine devient le premier chemin ; les nouveaux reprennent ses types d’activité, sans texte : écrivez au moins leurs titres, puis le bouton de fabrication propose de « Générer les activités manquantes ». Pour revenir en arrière : « Un seul chemin pour tous » garde le chemin déjà écrit.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Différencier un parcours déjà composé');
        capture(s, 'ouvrirChemins', X0 + 0.08, 1.75, { w: XW - 0.16 - 3.9 });
        const x = X0 + XW - 3.5, w = 3.5;
        etapes(s, [
            [t('Sous un test du plan : '), bouton('Ouvrir des chemins selon ce test'), t('.')],
            [t('Trois chemins s’ouvrent, avec leur aiguillage : écrivez les titres des nouveaux.')],
            [bouton('Générer les activités manquantes'), t(' complète le plan.')],
        ], { x, y: 1.8, w, pas: 1.1, corps: 14 });
        bandeau(s, X0, 5.35, XW, 0.75, [t('Revenir en arrière : '), bouton('Un seul chemin pour tous'), t(' garde le chemin déjà écrit.')], { ic: 'rotate-left', couleur: C.caramelFonce, fond: C.creme, bord: 'EEE0CF', corps: 14 });
    },
});

// 24 ── Voir comme un élève
diapo({
    partie: PARTIES[1], titre: '« Voir comme un élève »',
    notes: 'Le bouton « Voir comme un élève », en haut de l’aiguillage, montre la page du cours telle qu’elle s’affichera sur la plateforme. On choisit qui regarde — un élève ou l’enseignant —, le moment — avant le test, pendant son chemin, chemin terminé, parcours terminé — et le nombre de bonnes réponses au test, avec le curseur. On vérifie ainsi, avant tout import, qu’un élève qui a eu quatre sur huit voit bien le chemin « Consolider », et lui seul.',
    dessiner(s) {
        entete(s, PARTIES[1], '« Voir comme un élève »');
        const r = capture(s, 'eleve', X0 + 0.08, 1.7, { h: 4.6 });
        const x = r.x + r.w + 0.55, w = X0 + XW - x;
        puces(s, [
            [bouton('Qui regarde ?'), t(' : '), bouton('Un élève'), t(' ou '), bouton('L’enseignant'), t('.')],
            [bouton('Moment'), t(' : '), bouton('Avant le test'), t(', '), bouton('Pendant son chemin'), t(', '), bouton('Chemin terminé'), t(', '), bouton('Parcours terminé'), t('.')],
            [bouton('Bonnes réponses au test'), t(' : le curseur choisit le score.')],
            [gras('Avant tout import'), t(', on vérifie que chacun ne voit que son chemin.')],
        ], { x, y: 1.75, w, h: 4.6, corps: 14.5, espace: 12 });
    },
});

// 25 ── Cours vide + bilan
diapo({
    partie: PARTIES[1], titre: 'Un cours vide, et une page « Bilan du parcours »',
    notes: 'Deux points pour finir le parcours. Un parcours à chemins s’importe dans un cours vide : la plateforme range les sections du fichier dans celles du cours, et des sections existantes recevraient les restrictions des chemins. Et tout parcours, linéaire ou différencié, se termine par une section « Fin du parcours », masquée jusqu’à ce que l’élève ait terminé ses activités ; elle porte une page « Bilan du parcours », composée sans IA à partir du plan : l’objectif, ce que chaque étape a travaillé et où le revoir, les mots à retenir.',
    dessiner(s) {
        entete(s, PARTIES[1], 'Un cours vide, et une page « Bilan du parcours »');
        const lw = (XW - 0.5) / 2;
        intertitre(s, 'Un parcours à chemins : un cours VIDE', X0, 1.65, lw);
        const a = capture(s, 'livraisonChemins', X0 + 0.08, 2.15, { w: lw - 0.16 });
        texte(s, 'Des sections existantes recevraient les restrictions des chemins.', { x: X0, y: a.y + a.h + 0.25, w: lw, h: 0.6, fontSize: 13.5, color: C.encre2 });
        const x = X0 + lw + 0.5;
        intertitre(s, 'À la fin de tout parcours', x, 1.65, lw);
        const b = capture(s, 'eleveFin', x + 0.08, 2.15, { w: lw - 0.16 });
        puces(s, [
            [bouton('Fin du parcours'), t(' : masquée jusqu’à ce que l’élève ait tout terminé.')],
            [bouton('Bilan du parcours'), t(' : l’objectif, ce que chaque étape a travaillé et où le revoir, les mots à retenir. Composé sans IA.')],
        ], { x, y: b.y + b.h + 0.3, w: lw, h: 2.2, corps: 13.5, espace: 8 });
    },
});

// ─────────────────────────────────────────────── À savoir et clôture
// 26 ── À savoir
diapo({
    titre: 'À savoir',
    notes: 'Cinq points à retenir. Tout relire : l’IA peut se tromper sur un fait, une réponse ou une consigne ; l’enseignant reste l’auteur de ce qu’il donne aux élèves. Aucune donnée personnelle d’élève, ni dans les champs, ni dans les documents, ni dans un prompt envoyé à une IA externe. Le service peut être lent, surtout aux heures chargées : on patiente, ou on recommence, éventuellement avec un autre modèle. Caramel ne publie rien à votre place : c’est vous qui importez le fichier dans votre cours, et le dépôt sur la Sucrerie reste un choix. Enfin, un parcours généré est un point de départ, à adapter à votre classe.',
    dessiner(s) {
        entete(s, null, 'À savoir');
        const items = [
            ['magnifying-glass', 'Tout relire', 'L’IA peut se tromper : un fait, une réponse, une consigne. Vous restez l’auteur de ce que vous donnez aux élèves.'],
            ['user-lock', 'Aucune donnée personnelle d’élève', 'Ni dans les champs, ni dans les documents, ni dans un prompt envoyé à une IA externe.'],
            ['hourglass-half', 'Le service peut être lent', 'Patientez, ou recommencez — au besoin avec un autre modèle. Une activité en échec se relance.'],
            ['hand', 'Caramel ne publie rien à votre place', 'Vous importez vous-même le fichier dans votre cours ; la Sucrerie reste un choix.'],
            ['seedling', 'Un point de départ', 'Un parcours généré est à relire, à adapter à votre classe, puis à tester avant de l’ouvrir aux élèves.'],
        ];
        const cw = (XW - 0.3) / 2, ch = 1.42;
        items.forEach(([ic, titre, d], k) => {
            const x = X0 + (k % 2) * (cw + 0.3), y = 1.65 + Math.floor(k / 2) * (ch + 0.2);
            carte(s, x, y, cw, ch);
            pastille(s, ic, x + 0.3, y + 0.3, { taille: 0.6 });
            texte(s, titre, { x: x + 1.12, y: y + 0.22, w: cw - 1.35, h: 0.38, fontSize: 16.5, bold: true });
            texte(s, d, { x: x + 1.12, y: y + 0.62, w: cw - 1.35, h: 0.75, fontSize: 13, color: C.encre2 });
        });
        const x = X0 + cw + 0.3, y = 1.65 + 2 * (ch + 0.2);
        carte(s, x, y, cw, ch, { fond: C.creme, bord: 'EEE0CF', avecOmbre: false });
        texte(s, 'L’IA propose, vous décidez.', { x: x + 0.3, y, w: cw - 0.6, h: ch, fontSize: 22, bold: true, color: C.caramelTexte, valign: 'middle', align: 'center' });
    },
});

// 27 ── Pour continuer
diapo({
    titre: 'Pour continuer', fond: C.surface, sansPied: true,
    notes: `Pour continuer seul : Caramel s’ouvre à l’adresse caramel.forge.apps.education.fr, gratuitement et sans compte. Le bouton « Tutoriel », en haut de l’écran, reprend chaque étape pas à pas, imports compris. Caramelia, l’assistante intégrée — la bulle en bas à droite —, répond aux questions sur l’outil et peut préparer une activité ou un parcours avec vous. Et la page « Découvrir Caramel », liée en pied de page, rassemble les vidéos, les tutoriels et des activités à essayer. Ce kit correspond à Caramel ${VERSION}, dans sa version du ${DATE}.`,
    dessiner(s) {
        s.addImage({ path: ICONES['logo-caramel'], x: X0, y: 0.6, w: 0.8, h: 0.8 });
        texte(s, 'Pour continuer', { x: X0 + 1.0, y: 0.62, w: 7, h: 0.76, fontSize: 34, bold: true, valign: 'middle' });
        const r = capture(s, 'caramelia', X0 + 0.08, 1.75, { w: 5.3 });
        texte(s, 'Caramelia, la bulle en bas à droite.', { x: r.x, y: r.y + r.h + 0.2, w: r.w, h: 0.35, fontSize: 12.5, color: C.encre3 });
        const x = X0 + 6.0, w = 4.25;
        const appuis = [
            ['globe', 'caramel.forge.apps.education.fr', 'Gratuit, sans compte, dans le navigateur.'],
            ['book', 'Le « Tutoriel »', 'En haut de Caramel : chaque étape pas à pas, imports compris.'],
            ['comments', 'Caramelia, l’assistante', 'Répond sur l’outil, prépare une activité ou un parcours avec vous.'],
            ['film', '« Découvrir Caramel »', 'En pied de page : vidéos, tutoriels, activités à essayer.'],
        ];
        appuis.forEach(([ic, titre, d], k) => {
            const y = 1.75 + k * 1.08;
            pastille(s, ic, x, y, { taille: 0.56, couleur: ic === 'globe' ? C.prune : C.caramelFonce, fond: ic === 'globe' ? C.roseClair : C.creme2 });
            texte(s, k === 0 ? [lien(titre, LIENS.caramel, { bold: true })] : titre, { x: x + 0.75, y: y - 0.03, w: w - 0.75, h: 0.34, fontSize: 15.5, bold: true });
            texte(s, d, { x: x + 0.75, y: y + 0.33, w: w - 0.75, h: 0.62, fontSize: 13, color: C.encre2 });
        });
        const qx = X0 + 10.55, qw = XW - 10.55;
        [['qr-caramel', 'Ouvrir Caramel'], ['qr-decouvrir', 'Découvrir Caramel']].forEach(([id, titre], k) => {
            const y = 1.75 + k * 2.2;
            s.addImage({ path: ICONES[id], x: qx + (qw - 1.5) / 2, y, w: 1.5, h: 1.5 });
            texte(s, titre, { x: qx, y: y + 1.55, w: qw, h: 0.3, fontSize: 12, bold: true, align: 'center' });
        });
        texte(s, `Kit de formation · Caramel v${VERSION} · mis à jour le ${DATE}`, { x: X0, y: 6.75, w: XW, h: 0.3, fontSize: 11, color: C.encre3, align: 'center' });
    },
});

// ─────────────────────────────────────────────────────────────── Assemblage
function construire() {
    pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    pres.author = 'Caramel';
    pres.company = 'Caramel';
    pres.title = `Caramel ${VERSION} — kit de formation`;
    pres.subject = 'Prendre en main Caramel : générer une activité, concevoir un parcours';
    pres.lang = 'fr-FR';
    const total = DIAPOSITIVES.length;
    DIAPOSITIVES.forEach((d, k) => {
        const s = pres.addSlide();
        s.background = { color: d.fond || C.fond };
        d.dessiner(s);
        if (!d.sansPied) {
            texte(s, `Caramel v${VERSION} · Kit de formation · ${MOIS}`, { x: X0, y: 7.02, w: 6, h: 0.26, fontSize: 9, color: C.encre3 });
            texte(s, `${k + 1} / ${total}`, { x: W - X0 - 1.5, y: 7.02, w: 1.5, h: 0.26, fontSize: 9, color: C.encre3, align: 'right' });
        }
        s.addNotes(d.notes);
    });
    return pres.writeFile({ fileName: join(temp, `${NOM}.pptx`) });
}

// ─────────────────────────────────────────────────────────────── Programme
console.log(`▶ Kit de formation Caramel v${VERSION} — ${DATE}`);
preparerImages(IMAGES, temp);
await rendreIconesEtQr({
    aRendre: ICONES_A_RENDRE, icones: ICONES, temp,
    qr: [['qr-caramel', LIENS.caramel], ['qr-decouvrir', LIENS.decouvrir]],
});
await construire();
mkdirSync(SORTIE, { recursive: true });
copyFileSync(join(temp, `${NOM}.pptx`), join(SORTIE, `${NOM}.pptx`));
console.log(`  ✓ ${NOM}.pptx (${DIAPOSITIVES.length} diapositives)`);

if (SANS_RENDU) process.exit(0);

const pdf = convertir(temp, NOM, 'pdf', PROFIL_LO);
copyFileSync(pdf, join(SORTIE, `${NOM}.pdf`));
console.log(`  ✓ ${NOM}.pdf`);
copyFileSync(convertir(temp, NOM, 'odp', PROFIL_LO), join(SORTIE, `${NOM}.odp`));
console.log(`  ✓ ${NOM}.odp`);
const pages = rendreImages(pdf, temp, join(SORTIE, 'diapositives'));
if (pages.length !== DIAPOSITIVES.length) throw new Error(`${pages.length} pages rendues pour ${DIAPOSITIVES.length} diapositives`);
console.log(`  ✓ diapositives/ (${pages.length} images)`);

const taille = f => statSync(join(SORTIE, f)).size;
const manifeste = {
    '//': 'Écrit par scripts/diaporama/generer-kit-formation.mjs — ne pas modifier à la main, relancer le script.',
    version: VERSION,
    date: DATE_ISO,
    dateLisible: DATE,
    fichiers: Object.fromEntries(['pptx', 'odp', 'pdf'].map(f => [f, { chemin: `${NOM}.${f}`, octets: taille(`${NOM}.${f}`) }])),
    diapositives: DIAPOSITIVES.map((d, k) => ({
        numero: k + 1,
        partie: d.partie ? d.partie.replace(/^Partie \d+ · /, '') : null,
        titre: d.titre,
        image: `diapositives/${pages[k][0]}`,
        largeur: pages[k][1],
        hauteur: pages[k][2],
        notes: d.notes,
    })),
};
writeFileSync(join(SORTIE, 'kit-formation.json'), JSON.stringify(manifeste, null, 2) + '\n');
console.log('  ✓ kit-formation.json');
for (const f of readdirSync(SORTIE)) {
    if (!['captures', 'diapositives', 'kit-formation.json', `${NOM}.pptx`, `${NOM}.odp`, `${NOM}.pdf`].includes(f)) console.warn(`  ! fichier inattendu dans la sortie : ${f}`);
}
