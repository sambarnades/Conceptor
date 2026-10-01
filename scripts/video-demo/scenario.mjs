/**
 * Le scénario de la vidéo de présentation de Caramel 7 : une suite de scènes,
 * chacune avec le texte de sa voix off et les gestes filmés pendant qu'on le dit.
 *
 * **Le ton.** Une démonstration pour des collègues, pas une publicité : on montre
 * ce que fait l'outil tel qu'il est, on dit combien de temps il met vraiment (les
 * attentes raccourcies au montage sont signalées à l'écran avec leur durée réelle),
 * et la dernière partie dit ses limites. Pas de superlatifs.
 *
 * **Le texte fait foi pour les voix.** `voix` est ce que lira la personne qui
 * enregistre ; il est découpé en phrases pour les sous-titres. Une scène dure
 * au moins le temps de sa voix (mesurée sur une voix de synthèse un peu lente,
 * cf. `tourner.mjs`), et ses gestes se calent sur le début de ses phrases par
 * `ctx.phrase(n)`.
 *
 * **Les phrases clés** (`cles`) sont la version sans voix (`musicale.mjs`) : chacune
 * s'affiche au début de la phrase de voix off dont elle porte l'idée (son indice),
 * jusqu'à la phrase clé suivante ou la fin de la scène. Les cartons (titre, « À
 * savoir », fin) se lisent seuls et n'en ont pas.
 *
 * Les contenus montrés sont ceux qu'a réellement produits le modèle, enregistrés
 * une fois (`--enregistrer-ia`) puis rejoués au tournage.
 *
 * **Version 7.1 (octobre 2026).** La partie « parcours » montre un parcours
 * DIFFÉRENCIÉ : des chemins selon les résultats d'un test, l'aiguillage du plan,
 * « Voir comme un élève » et la fin du parcours avec sa page de bilan. Le quiz de
 * la première partie garde les réponses enregistrées le 29-09-2026 (et son erreur
 * réelle sur la Bastille) : seules `plan-attente` et `fabrication` ont été
 * réinterrogées (`--enregistrer-ia=plan-attente,fabrication`).
 */

export const QUI = 'Professeur d’histoire-géographie, classe de 4e';
export const QUOI = 'Les débuts de la Révolution française (1789-1792)';

const LOGO = 'assets/images/branding/logo_caramel.svg';

/** « 1 min 05 s », « 24 s ». */
export function duree(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s} secondes`;
    const m = Math.floor(s / 60), r = s % 60;
    return r ? `${m} minute${m > 1 ? 's' : ''} ${r}` : `${m} minute${m > 1 ? 's' : ''}`;
}
const dureeCourte = ms => {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};

/** Note d'honnêteté affichée pendant une attente raccourcie. */
function noteAttente(libelle, ms) {
    return ms ? `${libelle} : <b>${dureeCourte(ms)}</b> en réalité — raccourci au montage` : '';
}

export const SCENES = [
    {
        id: 'titre',
        chapitre: null,
        voix: () => `Cette vidéo présente Caramel, version 7 : à quoi sert l’outil, comment on s’en sert, et ce qu’il ne fait pas.`,
        async jouer({ m }) {
            // Le carton est déjà affiché au démarrage de l'enregistrement (cf. tourner.mjs).
            await m.pause(200);
        },
    },
    {
        id: 'accueil',
        cles: [
            [0, 'Gratuit, sans compte, conçu par Emmanuel GAUNARD et Gauthier REMANDE'],
            [1, 'Des activités et des parcours pour Éléa, Magistère (Réseau des concepteurs) et Moodle'],
            [2, 'L’IA rédige un premier jet : vous relisez, corrigez, décidez'],
        ],
        voix: () => `Caramel est un site web gratuit et sans compte, conçu par deux enseignants et hébergé sur la Forge des communs numériques éducatifs. `
            + `Il prépare des activités interactives, quiz, textes à trous, cartes mémoire ou pages de cours, et des parcours complets, à importer dans Éléa, Magistère ou Moodle. `
            + `Une intelligence artificielle en rédige un premier jet. Vous le relisez, vous le corrigez, et vous décidez de l’utiliser ou non.`,
        async jouer({ m, phrase }) {
            await m.carton(null);
            await m.pause(900);
            await phrase(1);
            await m.defiler('.activity-grid', { ms: 2600, position: 0.08 });
            await m.pause(2200);
            await m.defiler('.activity-grid .grid > [data-module]:nth-child(16)', { ms: 2200, position: 0.1 });
            await phrase(2);
            await m.defiler(0, { ms: 1800 });
        },
    },
    {
        id: 'saisie',
        cles: [
            [0, 'Exemple 1 : un quiz d’histoire en 4e'],
            [1, 'Deux champs : qui vous êtes, ce que vous voulez travailler'],
        ],
        chapitre: '1 · Une activité',
        voix: () => `Premier exemple : un quiz. Deux champs suffisent : qui vous êtes, et ce que vous voulez travailler. `
            + `Ici, un professeur d’histoire-géographie de quatrième, sur les débuts de la Révolution française.`,
        async jouer({ m, page, phrase }) {
            await phrase(1);
            await m.taper(page.locator('#qui'), QUI);
            await m.pause(300);
            await m.taper(page.locator('#quoi'), QUOI);
        },
    },
    {
        id: 'avance',
        cles: [
            [0, 'Mode Avancé : niveau, nombre de questions, votre propre cours'],
            [1, 'Votre document limite les approximations, sans les empêcher'],
        ],
        voix: () => `Le mode Avancé permet de préciser le niveau et le nombre de questions, `
            + `et surtout de joindre votre propre cours, en PDF, en Word ou en texte. `
            + `L’IA s’appuie alors sur votre document : cela limite les approximations, sans les empêcher.`,
        async jouer({ m, page, phrase }) {
            await m.cliquer(page.locator('.mode-tab[data-mode="advanced"]'), { apres: 600 });
            await m.survoler(page.locator('#niveau'), { dx: 0.3 });
            await phrase(1);
            await m.defiler('#rag-section-container', { ms: 1200, position: 0.2 });
            await m.survoler(page.locator('.drag-drop-area'), { dy: 0.35 });
            await phrase(2);
            await m.pause(1800);
            await m.defiler(0, { ms: 1000 });
            await m.cliquer(page.locator('.mode-tab[data-mode="simple"]'), { apres: 400 });
        },
    },
    {
        id: 'tuile',
        cles: [
            [0, 'On choisit le type d’activité, puis « Générer en un clic »'],
        ],
        voix: () => `On choisit ensuite le type d’activité : ici, un quiz à choix multiples. Puis on clique sur « Générer en un clic ».`,
        async jouer({ m, page }) {
            await m.defiler('.filter-bar', { ms: 1100, position: 0.12 });
            await m.cliquer(page.locator('[data-module="QuizSetQCM"]'), { apres: 1100 });
            await m.survoler(page.locator('#generate-llm-QuizSetQCM'), { dx: 0.35 });
            // Le debounce de reconstruction des prompts (cf. qa-manuel/k-quiz-lots.mjs).
            await m.pause(900);
        },
    },
    {
        id: 'generation',
        cles: [
            [0, 'La génération prend de quelques secondes à une minute'],
        ],
        ia: true,
        voix: ({ d }) => `La demande part vers des modèles d’IA opérés par les infrastructures de l’enseignement supérieur et de la recherche. `
            + `La réponse prend de quelques secondes à une minute, selon la charge`
            + (d.generation ? ` : ici, ${duree(d.generation)}, raccourcies au montage.` : '.'),
        async jouer({ m, page, d }) {
            await m.cliquer(page.locator('#generate-llm-QuizSetQCM'), { apres: 300 });
            await m.allerA(1180, 700, { ms: 500 });
            if (d.generation) await m.note(noteAttente('Génération du quiz', d.generation));
            await page.locator('#generation-result-modal').waitFor({ state: 'visible', timeout: 900000 });
            await m.pause(600);
            await m.note(null);
        },
    },
    {
        id: 'apercu',
        cles: [
            [1, 'On teste le quiz comme un élève'],
            [2, 'Tout ce qu’écrit l’IA est à relire'],
        ],
        voix: () => `Le quiz est prêt. On le teste d’abord comme le ferait un élève : on répond, puis on vérifie. `
            + `Tout ce texte a été écrit par l’IA : chaque question, chaque bonne réponse et chaque explication est à relire.`,
        async jouer({ m, page, phrase }) {
            await m.cliquer(page.locator('.generation-result-modal__btn--secondary'), { apres: 400 });
            const cadre = page.frameLocator('.preview-modal iframe').first();
            const reponses = cadre.locator('.h5p-question-content .h5p-answer:visible');
            await reponses.first().waitFor({ state: 'visible', timeout: 30000 });
            await m.pause(1200);
            await m.cliquer(reponses.nth(1), { dx: 0.2 });
            await m.cliquer(cadre.locator('button:visible', { hasText: 'Vérifier' }).first(), { apres: 900 });
            await phrase(1);
            // Un endroit neutre : sur « Recommencer », une infobulle surgirait.
            await m.allerA(1180, 215, { ms: 700 });
        },
    },
    {
        id: 'edition',
        cles: [
            [0, 'Le bouton « Éditer » ouvre chaque question'],
            [1, 'Erreur réelle de l’IA : la Bastille enfermait bien des opposants'],
            [2, 'On corrige l’explication, puis on enregistre'],
        ],
        voix: () => `Le bouton « Éditer » ouvre chaque question. Voici un cas réel : sur la prise de la Bastille, l’explication rédigée par l’IA affirme que la forteresse n’enfermait pas d’opposants politiques. `
            + `C’est inexact : on corrige avant d’enregistrer. `
            + `Reformuler une question, changer la bonne réponse ou en retirer une se fait de la même façon.`,
        async jouer({ m, page, phrase, retouche }) {
            await m.cliquer(page.locator('.preview-modal__edit-btn'), { apres: 1300 });
            await m.cliquer(page.locator('.json-editor__nav-subitem').nth(3), { apres: 900 });
            if (retouche) await retouche({ m, page, phrase });
            await phrase(2);
            await m.cliquer(page.getByRole('button', { name: 'Enregistrer' }), { apres: 1500 });
        },
    },
    {
        id: 'telechargement',
        cles: [
            [0, 'Un fichier H5P, à importer dans Éléa'],
            [1, 'Ou une version papier : Word, ODT ou PDF'],
        ],
        voix: () => `On télécharge enfin le fichier H5P, qui s’importe dans Éléa comme n’importe quelle activité. `
            + `Le même quiz s’exporte aussi en Word, en ODT ou en PDF, pour une version papier.`,
        async jouer({ m, page, phrase }) {
            const h5p = page.locator('.preview-modal__download-btn', { hasText: 'H5P' });
            await m.cliquer(h5p, { apres: 900 });
            await phrase(1);
            await m.survoler(page.locator('.preview-modal__download-btn', { hasText: 'DOCX' }), { ms: 500 });
            await m.survoler(page.locator('.preview-modal__download-btn', { hasText: 'ODT' }), { ms: 400 });
            await m.survoler(page.locator('.preview-modal__download-btn', { hasText: 'PDF' }), { ms: 400 });
        },
    },
    {
        id: 'commutateur',
        cles: [
            [0, 'Exemple 2, nouveau en version 7 : le parcours'],
            [2, 'Un cours complet : cadrage, plan, fabrication, livraison'],
        ],
        chapitre: '2 · Un parcours différencié',
        voix: () => `Deuxième exemple, nouveau dans la version 7 : le parcours. Avec la même saisie, on bascule sur « Un parcours ». `
            + `Caramel prépare alors un cours complet, en quatre étapes : cadrage, plan, fabrication et livraison.`,
        async jouer({ m, page, phrase }) {
            await m.cliquer(page.locator('.preview-modal__close'), { apres: 700 });
            await m.defiler(0, { ms: 900 });
            await m.cliquer(page.locator('#parcours-button'), { apres: 900 });
            await phrase(2);
            await m.survoler(page.locator('#pc-steps'), { dx: 0.1, ms: 500 });
            await m.survoler(page.locator('#pc-steps'), { dx: 0.9, ms: 1400 });
        },
    },
    {
        id: 'cadrage',
        cles: [
            [0, 'Plateforme, déroulement, ampleur'],
            [1, 'Nouveau : tous les élèves suivent-ils le même chemin ?'],
            [2, 'Un test oriente chaque élève ; il ne voit que ses activités'],
            [3, 'Trois chemins : renforcer, consolider, approfondir'],
        ],
        voix: () => `On indique la plateforme, le déroulement et l’ampleur : ici Éléa, à distance, en une séance. `
            + `Vient ensuite une question nouvelle : tous vos élèves suivent-ils le même chemin ? `
            + `Avec « Des chemins selon les résultats », un test oriente chaque élève vers les activités qui lui conviennent, et il ne voit que les siennes. `
            + `On garde trois chemins : renforcer, consolider, approfondir.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('#pc-atelier', { ms: 1100, position: 0.02 });
            await m.survoler(page.locator('.pc-choice[data-choix="elea"]'), { ms: 600 });
            await m.survoler(page.locator('.pc-choice[data-choix="distanciel"]'), { ms: 600 });
            await m.cliquer(page.locator('.pc-choice[data-choix="courte"]'), { apres: 500 });
            await phrase(1);
            await m.survoler(page.locator('.pc-choice[data-choix="lineaire"]'), { dy: 0.3, ms: 700 });
            await phrase(2);
            await m.cliquer(page.locator('.pc-choice[data-choix="chemins"]'), { dy: 0.3, apres: 700 });
            // La ligne « Combien de chemins ? » apparaît tout en bas, sous l'étiquette du chapitre.
            await m.defiler('.pc-nb-chemins', { ms: 900, position: 0.5 });
            await phrase(3);
            await m.cliquer(page.locator('.pc-segment__b[data-chemins="3"]'), { apres: 500 });
            await m.survoler(page.locator('.pc-nb-chemins__resume'), { dx: 0.3, ms: 800 });
        },
    },
    {
        id: 'trame',
        cles: [
            [0, 'Deux modèles de parcours pour différencier'],
            [1, 'Un test de positionnement, un chemin par résultat, un écrit commun'],
        ],
        voix: () => `Deux modèles de parcours sont prévus pour différencier. `
            + `On prend « Différencier dès le départ » : un test de positionnement, un chemin par groupe de résultats, puis un écrit court que tout le monde fait.`,
        async jouer({ m, page, phrase }) {
            const trames = page.locator('.pc-trame--chemins');
            await m.defiler('.pc-trames', { ms: 1100, position: 0.2 });
            await m.survoler(trames.nth(1), { dy: 0.25, ms: 700 });
            await phrase(1);
            const choisie = page.locator('.pc-trame--chemins', { hasText: 'Différencier dès le départ' });
            await m.cliquer(choisie.locator('.pc-trame__select'), { apres: 700 });
            await m.survoler(choisie, { dy: 0.7, ms: 900 });
        },
    },
    {
        id: 'plan-attente',
        cles: [
            [0, 'L’IA propose un plan adapté au sujet et au public'],
        ],
        ia: true,
        voix: ({ d }) => `L’IA compose un plan adapté au sujet et au public`
            + (d['plan-attente'] ? ` ; ici en ${duree(d['plan-attente'])}, là encore raccourcies.` : '.'),
        async jouer({ m, page, d }) {
            await m.cliquer(page.locator('#pc-cta'), { apres: 300 });
            if (d['plan-attente']) await m.note(noteAttente('Composition du plan', d['plan-attente']));
            await page.locator('.pc-aiguillage').first().waitFor({ state: 'visible', timeout: 900000 });
            await m.pause(500);
            await m.note(null);
        },
    },
    {
        id: 'aiguillage',
        cles: [
            [0, 'Une case par score au test, de la couleur du chemin qu’elle ouvre'],
            [1, 'Le début d’un chemin se règle d’une bonne réponse à la fois'],
            [2, 'La première tentative décide ; on réoriente par le carnet de notes'],
            [3, 'Les chemins côte à côte, de durée comparable'],
        ],
        voix: () => `Le plan montre l’aiguillage : une case par score possible au test, de la couleur du chemin qu’elle ouvre. `
            + `Les boutons « moins » et « plus » avancent ou reculent le début d’un chemin, d’une bonne réponse à la fois. `
            + `C’est la première tentative qui décide ; pour réorienter un élève, on modifie sa note dans le carnet de notes. `
            + `En dessous, les trois chemins côte à côte, avec leurs activités et une durée comparable.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('.pc-aiguillage', { ms: 1400, position: 0.13 });
            const cases = page.locator('.pc-aiguillage__cases');
            await m.survoler(cases, { dx: 0.08, ms: 700 });
            await m.survoler(cases, { dx: 0.92, ms: 1600 });
            await phrase(1);
            // Un « + » actif, puis le « − » du même chemin : le plan revient à l'identique.
            const plus = page.locator('.pc-aiguillage__pas button[data-pas$=":1"]:not([disabled])').last();
            const pas = await plus.getAttribute('data-pas');
            await m.cliquer(plus, { apres: 1100 });
            await m.cliquer(page.locator(`.pc-aiguillage__pas button[data-pas="${pas.replace(/:1$/, ':-1')}"]`), { apres: 800 });
            await phrase(2);
            await m.survoler(page.locator('.pc-aiguillage__aide'), { dx: 0.4, ms: 900 });
            await phrase(3);
            await m.defiler('.pc-chemins', { ms: 1400, position: 0.13 });
            await m.survoler(page.locator('.pc-chemin').first(), { dy: 0.35, ms: 700 });
            await m.survoler(page.locator('.pc-chemin').last(), { dy: 0.35, ms: 1500 });
        },
    },
    {
        id: 'plan-relecture',
        cles: [
            [0, 'Rien n’est généré avant votre relecture'],
            [1, 'Titres, consignes, durées et types d’activité se modifient'],
        ],
        voix: () => `Rien n’est encore généré : c’est le moment de relire. Titres, consignes et durées se modifient. `
            + `On peut déplacer une activité, la retirer, en ajouter une, ou changer son type dans cette mosaïque.`,
        async jouer({ m, page, phrase }) {
            const chemin = page.locator('.pc-chemin').first();
            const duree = chemin.locator('.pc-carte input[type="number"]').first();
            if (await duree.count()) await m.retaper(duree, String(await duree.inputValue()));
            await phrase(1);
            await m.cliquer(chemin.locator('.pc-select.pc-choix').first(), { apres: 900 });
            await m.pause(1800);
            await page.keyboard.press('Escape');
            await m.pause(500);
        },
    },
    {
        id: 'vue-eleve',
        cles: [
            [0, '« Voir comme un élève » : le cours selon le moment et le score'],
            [1, 'Avant le test : aucun chemin'],
            [2, 'Peu de bonnes réponses : « Renforcer » seul'],
            [3, 'Toutes les bonnes réponses : « Approfondir »'],
            [4, 'À la fin : « Fin du parcours » et une page de bilan'],
        ],
        voix: () => `« Voir comme un élève » montre la page du cours telle qu’un élève la verra, selon le moment et son score. `
            + `Avant le test, aucun chemin n’apparaît. `
            + `Avec peu de bonnes réponses, seul le chemin « Renforcer » s’ouvre. `
            + `Avec toutes les bonnes réponses, c’est « Approfondir ». `
            + `Une fois tout terminé, la section « Fin du parcours » le félicite, avec une page qui fait le bilan.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('.pc-aiguillage', { ms: 1000, position: 0.13 });
            await m.cliquer(page.locator('.pc-aiguillage__voir'), { apres: 900 });
            const fenetre = page.locator('dialog.pc-eleve');
            const moment = texte => fenetre.locator('.pc-segment__b', { hasText: texte });
            const score = page.locator('#pc-eleve-score');
            const chemin = fenetre.locator('.pc-eleve__section[data-section="chemin"]').first();
            await phrase(1);
            await m.cliquer(moment('Avant le test'), { apres: 900 });
            await phrase(2);
            await m.cliquer(moment('Pendant son chemin'), { apres: 500 });
            await m.cliquer(score, { dx: 0.04, apres: 700 });
            await m.survoler(chemin, { dx: 0.3, dy: 0.15, ms: 700 });
            // La fenêtre défile sous son en-tête collant : on la remonte avant chaque réglage,
            // sans quoi le clic tombe sur l'en-tête (constaté au premier enregistrement).
            const enHaut = () => m.defiler(0, { conteneur: 'dialog.pc-eleve', ms: 700 });
            await phrase(3);
            await enHaut();
            await m.cliquer(score, { dx: 0.98, apres: 700 });
            await m.survoler(chemin, { dx: 0.3, dy: 0.15, ms: 700 });
            await phrase(4);
            await enHaut();
            await m.cliquer(moment('Parcours terminé'), { apres: 600 });
            await m.survoler(fenetre.locator('.pc-eleve__section[data-section="fin"]'), { dx: 0.3, dy: 0.6, ms: 900 });
            await m.pause(1600);
            await m.cliquer(fenetre.locator('.pc-eleve__fermer'), { apres: 600 });
        },
    },
    {
        id: 'fabrication',
        cles: [
            [0, 'Les activités sont rédigées une à une'],
            [2, 'Chacune se prévisualise et se retouche dans l’éditeur'],
        ],
        ia: true,
        voix: ({ d }) => `On lance alors la fabrication. Les activités sont rédigées l’une après l’autre. `
            + `On peut arrêter, reprendre, relancer une activité en échec, et ouvrir chacune dans le même éditeur que tout à l’heure`
            + (d.fabrication ? `. Ici, ${duree(d.fabrication)} en réalité, accélérées au montage.` : '.'),
        async jouer({ m, page, d }) {
            await m.cliquer(page.locator('#pc-cta'), { apres: 600 });
            if (d.fabrication) await m.note(noteAttente('Fabrication des activités', d.fabrication));
            await m.defiler('#pc-atelier', { ms: 900, position: 0.02 });
            await page.waitForFunction(() => /Assembler/.test(document.querySelector('#pc-cta')?.textContent || ''), null, { timeout: 1800000 });
            await m.pause(800);
            await m.note(null);
        },
    },
    {
        id: 'livraison',
        cles: [
            [0, 'Un seul fichier .mbz : tout le cours, conditions des chemins comprises'],
            [1, 'Un parcours à chemins se restaure dans un cours vide'],
            [2, 'Fiche de séquence et documents en Word, ODT ou PDF'],
        ],
        voix: () => `À la fin, un seul fichier contient tout le cours : sections, consignes, activités, et les conditions qui ouvrent chaque chemin. `
            + `Un parcours à chemins se restaure dans un cours vide, en trois étapes rappelées à l’écran. `
            + `La fiche de séquence et le détail des activités s’exportent aussi en Word, ODT ou PDF, et le scénario se garde pour reprendre plus tard.`,
        async jouer({ m, page, phrase }) {
            await m.cliquer(page.locator('#pc-cta'), { apres: 300 });
            await page.waitForFunction(() => /Livraison/.test(document.querySelector('#pc-steps .pc-steps__item--current')?.textContent || ''), null, { timeout: 120000 });
            await m.pause(800);
            await m.defiler('#pc-atelier', { ms: 900, position: 0.02 });
            const mbz = page.getByRole('button', { name: /Télécharger le parcours/ });
            await m.cliquer(mbz, { apres: 900 });
            await phrase(1);
            await m.survoler(page.getByText('Importer le fichier dans votre plateforme'), { ms: 700 });
            await phrase(2);
            await m.defiler(99999, { ms: 2400 });
        },
    },
    {
        id: 'limites',
        chapitre: '3 · À savoir',
        voix: () => `Quelques points à garder en tête. `
            + `L’IA peut se tromper ou rester vague : tout est à relire avant d’être donné aux élèves. `
            + `Ce que vous saisissez ou joignez est envoyé au service d’IA : n’y mettez aucune donnée personnelle d’élève. `
            + `Le service peut être lent, ou momentanément indisponible : il faut alors réessayer plus tard. `
            + `Caramel ne publie rien à votre place : c’est vous qui importez les fichiers dans votre plateforme. `
            + `Le dépôt sur La Sucrerie, facultatif, rend l’activité publique. `
            + `Enfin, un parcours généré est un point de départ, pas une séquence clé en main.`,
        async jouer({ m, phrase }) {
            await m.carton(`<h2>Ce qu’il faut savoir</h2><ul>
                <li>L’IA peut se tromper ou rester vague : <strong>tout est à relire</strong> avant d’être donné aux élèves.</li>
                <li>Ce que vous saisissez ou joignez est envoyé au service d’IA : <strong>aucune donnée personnelle d’élève</strong>.</li>
                <li>Le service peut être lent, ou momentanément indisponible.</li>
                <li>Caramel ne publie rien à votre place : <strong>c’est vous qui importez</strong> les fichiers dans votre plateforme. Le dépôt sur La Sucrerie est facultatif et <strong>rend l’activité publique</strong>.</li>
                <li>Un parcours généré est <strong>un point de départ</strong>, pas une séquence clé en main.</li>
            </ul>`);
            // Une puce par phrase, sauf la Sucrerie (phrase 5) qui complète la puce précédente.
            for (const n of [1, 2, 3, 4, 6]) { await phrase(n); await m.puce(); }
        },
    },
    {
        id: 'fin',
        chapitre: null,
        voix: () => `Caramel est accessible à l’adresse caramel point forge point apps point education point f r. `
            + `Un tutoriel est intégré au site, et l’assistante Caramelia répond aux questions sur son utilisation. Merci de votre attention.`,
        sousTitres: () => `Caramel est accessible à l’adresse caramel.forge.apps.education.fr. `
            + `Un tutoriel est intégré au site, et l’assistante Caramelia répond aux questions sur son utilisation. Merci de votre attention.`,
        async jouer({ m }) {
            await m.carton(`<img class="demo-carton__logo" src="${LOGO}" alt="">
                <h1>Caramel</h1>
                <p class="demo-carton__url">caramel.forge.apps.education.fr</p>
                <p class="demo-carton__sous">Gratuit, sans compte · Tutoriel intégré (bouton « Tutoriel ») · Assistante Caramelia</p>
                <p class="demo-carton__meta">Concepteurs : Emmanuel GAUNARD et Gauthier REMANDE · Logiciel libre, hébergé sur la Forge des communs numériques éducatifs</p>`);
            await m.pause(1500);
        },
    },
];

/**
 * La correction montrée dans l'éditeur (scène « edition »), choisie APRÈS avoir lu
 * ce que le modèle a réellement produit : on ne met pas en scène une erreur inventée.
 *
 * Enregistrement du 29-09-2026 : pour la question 4, le retour de la réponse
 * « une prison où étaient enfermés les opposants politiques » affirme que « la
 * Bastille n'était pas une prison pour opposants politiques ». C'est faux : prison
 * d'État, elle a enfermé sur lettre de cachet (Voltaire en 1717 et 1726, entre
 * autres) ; le 14 juillet 1789, elle ne comptait que sept prisonniers. Si l'on
 * réenregistre les réponses du modèle, relire le quiz et choisir une autre retouche.
 */
export const CORRECTION_BASTILLE = 'En partie : la Bastille a bien enfermé des opposants, sur simple lettre de cachet du roi. '
    + 'Mais le 14 juillet 1789, elle ne compte que sept prisonniers : sa prise vaut surtout comme symbole de l’arbitraire royal.';

export async function RETOUCHE({ m, page, phrase }) {
    const reponse = 'questions.3.params.answers.0';
    await m.defiler(`.json-editor__richtext-editable[data-path="${reponse}.text"]`, { ms: 900, position: 0.15 });
    await m.cliquer(page.locator('.json-editor__array-item', { has: page.locator(`[data-path="${reponse}.text"]`) })
        .getByText('Indices et feedback').first(), { apres: 700 });
    // Le champ existe deux fois dans le DOM (source et éditeur riche) : on vise l'éditeur riche.
    const champ = `.json-editor__richtext-editable[data-path="${reponse}.tipsAndFeedback.chosenFeedback"]`;
    const retour = page.locator(champ);
    await m.defiler(champ, { ms: 900, position: 0.35 });
    await m.survoler(retour, { dx: 0.5, ms: 600 });
    await phrase(1);
    await m.retaper(retour, CORRECTION_BASTILLE, { delai: 28 });
}

export const CARTON_TITRE = `<img class="demo-carton__logo" src="${LOGO}" alt="">
    <h1>Caramel 7</h1>
    <p class="demo-carton__sous">Préparer des activités et des parcours pour Éléa, Magistère (Réseau des concepteurs)<br>et Moodle, avec l’aide d’une IA — et en gardant la main</p>
    <p class="demo-carton__meta">Démonstration commentée · version 7.1 · octobre 2026</p>`;

/**
 * L'habillage (`habillage.mjs`) : les étapes en haut de l'image, les cartons de partie,
 * le carton-titre, celui des limites (une puce par phrase de la scène `limites`, la
 * Sucrerie, phrase 5, complétant la puce précédente) et les sections de la musique.
 */
export const HABILLAGE = {
    fenetre: 'Caramel 7',
    etapes: ['Présentation', 'Une activité', 'Un parcours', 'À savoir'],
    titre: {
        surtitre: 'Démonstration · octobre 2026',
        h1: 'Caramel <b>7</b>',
        texte: 'Préparer des activités et des parcours pour Éléa, Magistère (Réseau des concepteurs) et Moodle avec l’aide d’une IA, en gardant la main.',
    },
    parties: [
        null,
        { debut: 'saisie', titre: 'Une activité', sous: 'Du formulaire au fichier H5P, en passant par la relecture' },
        { debut: 'commutateur', titre: 'Un parcours différencié', sous: 'Nouveau : un test oriente chaque élève vers son chemin' },
        { debut: 'limites', titre: 'À savoir', sous: 'Ce que l’outil ne fait pas à votre place' },
    ],
    sections: [[null, 'intro'], ['saisie', 'couplet'], ['commutateur', 'plein'], ['limites', 'calme'], ['fin', 'final']],
    cartesSource: ['titre', 'limites', 'fin'],
    savoir: {
        scene: 'limites',
        phrases: [1, 2, 3, 4, 6],
        surtitre: 'Avant de s’en servir',
        titre: 'À savoir',
        puces: [
            'L’IA peut se tromper ou rester vague : <b>tout est à relire</b> avant d’être donné aux élèves.',
            'Ce que vous saisissez ou joignez part au service d’IA : <b>aucune donnée personnelle d’élève</b>.',
            'Le service peut être lent, ou momentanément indisponible.',
            'Caramel ne publie rien : <b>vous importez</b> vous-même. Le dépôt sur La Sucrerie, facultatif, <b>rend l’activité publique</b>.',
            'Un parcours généré est <b>un point de départ</b>, pas une séquence clé en main.',
        ],
    },
    /** La version sans voix : ses deux parties filmées, de telle scène à telle scène. */
    musique: { parties: [['saisie', 'telechargement'], ['commutateur', 'livraison']] },
};
