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
            [1, 'Il prépare des activités pour Éléa, Magistère (Réseau des concepteurs) et Moodle'],
            [2, 'L’IA rédige un premier jet : vous relisez, corrigez, décidez'],
        ],
        voix: () => `Caramel est un site web gratuit et sans compte, conçu par deux enseignants et hébergé sur la Forge des communs numériques éducatifs. `
            + `Il prépare des activités interactives, quiz, textes à trous, cartes mémoire ou pages de cours, à importer dans Éléa, Magistère ou Moodle. `
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
        chapitre: '2 · Un parcours',
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
            [1, 'Une trame : « Réviser avant l’évaluation »'],
            [2, 'On peut aussi partir de la trame, sans plan de l’IA'],
        ],
        voix: () => `On indique la plateforme, le déroulement et l’ampleur. `
            + `On choisit ensuite une trame, ici « Réviser avant l’évaluation » : situer ses acquis, revoir l’essentiel, s’entraîner, puis se tester. `
            + `On peut aussi partir de la trame sans demander de plan à l’IA.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('#pc-atelier', { ms: 1100, position: 0.02 });
            await m.survoler(page.locator('.pc-choice', { hasText: 'Éléa' }).first(), { ms: 600 });
            await m.survoler(page.locator('.pc-choice', { hasText: 'À distance' }).first(), { ms: 600 });
            await m.cliquer(page.locator('.pc-choice', { hasText: 'Une séance' }).first(), { apres: 500 });
            await phrase(1);
            await m.defiler('.pc-trames', { ms: 1100, position: 0.25 });
            await m.cliquer(page.locator('.pc-trames > *', { hasText: 'Réviser avant l' }).first(), { dy: 0.2, apres: 800 });
            await phrase(2);
            await m.survoler(page.locator('#pc-modele'), { ms: 800 });
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
            await page.locator('.pc-etape').first().waitFor({ state: 'visible', timeout: 900000 });
            await m.pause(500);
            await m.note(null);
        },
    },
    {
        id: 'plan-relecture',
        cles: [
            [0, 'Rien n’est généré avant votre relecture'],
            [1, 'Étapes, consignes, durées et types d’activité se modifient'],
        ],
        voix: () => `Rien n’est encore généré : c’est le moment de relire. Titre, objectifs, consignes et durées se modifient. `
            + `On peut déplacer une activité, la retirer, en ajouter une, ou changer son type dans cette mosaïque.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('.pc-overview', { ms: 1200, position: 0.12 });
            await m.pause(1200);
            await m.defiler('.pc-etape', { ms: 1600, position: 0.12 });
            const duree = page.locator('.pc-etape .pc-carte input[type="number"]').first();
            if (await duree.count()) await m.retaper(duree, '10');
            await phrase(1);
            const choix = page.locator('.pc-etape .pc-select.pc-choix').first();
            await m.cliquer(choix, { apres: 900 });
            await m.pause(1800);
            await page.keyboard.press('Escape');
            await m.pause(500);
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
            [0, 'Un seul fichier .mbz contient tout le cours'],
            [2, 'Fiche de séquence et documents en Word, ODT ou PDF'],
        ],
        voix: () => `À la fin, un seul fichier contient tout le cours : sections, consignes et activités. `
            + `Il se restaure dans un cours Éléa, en trois étapes rappelées à l’écran. `
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
    <p class="demo-carton__sous">Préparer des activités pour Éléa, Magistère (Réseau des concepteurs)<br>et Moodle, avec l’aide d’une IA — et en gardant la main</p>
    <p class="demo-carton__meta">Démonstration commentée · septembre 2026</p>`;
