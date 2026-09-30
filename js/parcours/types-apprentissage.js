/**
 * @file Parcours — le miroir : ce que le parcours fait travailler.
 *
 * **C'est un RETOUR, pas une entrée** (D4). On n'entre pas dans l'atelier par une
 * méthode de conception : un professeur qui prépare une révision pour vendredi ne
 * raisonne pas en pourcentages de types d'activité, et la bibliothèque de trames
 * est là pour qu'il n'ait pas à le faire. Mais une fois le plan écrit, lui
 * montrer ce qu'il vient de construire est un service — à condition que ce soit
 * un miroir et non un barème.
 *
 * Comme les six garde-fous (§ 5 du PRD), ce module **affiche et ne bloque
 * jamais**. Il ne pose pas de proportion idéale, parce qu'il n'y en a pas : une
 * séance de mémorisation pure est parfaitement légitime, un projet qui ne fait
 * que produire aussi. La seule chose qu'il se permet de dire, c'est ce qui est
 * ABSENT — parce qu'une absence est un fait, là où un déséquilibre serait un
 * jugement.
 *
 * ## Pourquoi sept familles, et pas la taxonomie de quelqu'un
 *
 * Les noms sont en français ordinaire et décrivent le GESTE de l'élève, pas une
 * catégorie savante : découvrir, mémoriser, s'exercer, organiser, discuter,
 * coopérer, produire. « Échanger » est née le 27 sept. 2026 avec les modules
 * natifs (D73) : tant que le forum était rangé dans « produire », un parcours
 * sans le moindre temps d'échange n'était signalé nulle part. Elle s'est scindée
 * le 28 sept. (D82) en DISCUTER et COOPÉRER, que distingue ABC Learning Design :
 * un parcours qui n'avait qu'un forum ne voyait pas qu'il ne faisait jamais
 * construire quoi que ce soit à plusieurs.
 * C'est la même règle que pour les trames (D4) — l'atelier parle la langue de la
 * salle des profs. Emprunter une taxonomie établie aurait obligé à la nommer, à
 * la défendre, et à traduire son vocabulaire en douze langues.
 *
 * ## Ce que la classification ne prétend PAS être
 *
 * Un module ne détermine pas à lui seul le travail mental : un Quiz peut faire
 * réfléchir et une production peut être creuse. La classification porte sur ce
 * que le module DEMANDE DE FAIRE — cliquer une bonne réponse, écrire un texte,
 * remettre en ordre —, ce qui est observable et ne dépend pas du contenu. Un
 * module inconnu n'est pas rangé de force : il est compté à part, et le dit.
 *
 * @module parcours/types-apprentissage
 */

/**
 * Les sept familles, dans l'ordre où un parcours les rencontre le plus souvent.
 * L'ordre n'est pas une progression obligatoire — c'est celui de lecture.
 */
export const FAMILLES = Object.freeze([
    'decouvrir',
    'memoriser',
    'exercer',
    'organiser',
    'discuter',
    'cooperer',
    'produire',
]);

/**
 * Module → famille.
 *
 * **Ce qui a guidé chaque rangement, quand il n'allait pas de soi :**
 *
 * - `Flashcards`, `DialogCards` : deux faces qu'on retourne — c'est le geste de
 *   la révision, pas celui de l'exercice. `Crossword` et `FindTheWords` aussi :
 *   ils font retrouver un mot déjà rencontré, ils n'évaluent rien.
 * - `Appariement`, `DragAndDrop`, `SortParagraphs`, `Timeline`, `Chart`,
 *   `Summary` : dans tous, l'élève met des éléments EN RELATION — apparier,
 *   placer, ordonner, situer. C'est un travail de structure, distinct du
 *   « je réponds à une question ».
 * - `Dictation` est rangée en mémoriser : elle fait fixer une forme écrite.
 * - `ImageHotspots`, `InteractiveVideo`, `CoursePresentation`, `InteractiveBook`
 *   sont des supports qu'on parcourt : découvrir. Qu'ils contiennent des
 *   questions ne change pas leur geste principal, qui est de prendre
 *   connaissance.
 * - `Millionnaire` et `QCM` sont des quiz déguisés en jeu : s'exercer.
 * - `glossaireXml` produit un lexique que l'élève consulte : découvrir.
 * - Les modules de parcours suivent la même règle que les autres. Ce qui n'a de
 *   sens qu'à plusieurs se range selon ce qu'on y fait (D73, D82) :
 *   DISCUTER quand chacun y dit ce qu'il pense et lit ce que pensent les
 *   autres — forum, sondage, nuage de mots, questionnaire, enquête, classe
 *   virtuelle ; COOPÉRER quand on y construit un résultat commun — wiki,
 *   document partagé, bloc-notes, tableau, mur de notes, glossaire et base à
 *   construire, le Test étudiant dont la classe écrit elle-même les questions,
 *   et le choix de groupe qui forme les équipes. L'atelier et le
 *   dépôt de fichiers restent dans produire : on y remet un travail à soi. Le
 *   texte de liaison, le lien et la leçon se lisent : découvrir.
 */
export const FAMILLE_PAR_MODULE = Object.freeze({
    // — Découvrir : prendre connaissance, parcourir un support.
    Page: 'decouvrir',
    Livre: 'decouvrir',
    CoursePresentation: 'decouvrir',
    InteractiveBook: 'decouvrir',
    InteractiveVideo: 'decouvrir',
    ImageHotspots: 'decouvrir',
    Glossary: 'decouvrir',
    glossaireXml: 'decouvrir',
    parcours_etiquette: 'decouvrir',
    parcours_lien: 'decouvrir',
    parcours_lecon: 'decouvrir',
    parcours_ims: 'decouvrir',

    // — Mémoriser : fixer, retrouver, répéter.
    Flashcards: 'memoriser',
    DialogCards: 'memoriser',
    Crossword: 'memoriser',
    FindTheWords: 'memoriser',
    Dictation: 'memoriser',

    // — S'exercer : répondre, se tester, être corrigé.
    QuizSet: 'exercer',
    QuizSetQCM: 'exercer',
    QuizSetVF: 'exercer',
    MultipleChoice: 'exercer',
    TrueFalse: 'exercer',
    SingleChoiceSet: 'exercer',
    FillInTheBlanks: 'exercer',
    ComplexFillTheBlanks: 'exercer',
    DragTheWords: 'exercer',
    MarkTheWords: 'exercer',
    FindTheHotspot: 'exercer',
    FindMultipleHotspots: 'exercer',
    test_elea: 'exercer',
    gift: 'exercer',
    QCM: 'exercer',
    Millionnaire: 'exercer',

    // — Organiser : mettre en relation, ordonner, situer.
    DragAndDrop: 'organiser',
    SortParagraphs: 'organiser',
    Timeline: 'organiser',
    Chart: 'organiser',
    Summary: 'organiser',
    Appariement: 'organiser',

    // — Produire : écrire, déposer, dire quelque chose de soi.
    Essay: 'produire',
    Devoir: 'produire',
    parcours_atelier: 'produire',
    parcours_depot: 'produire',

    // — Discuter : dire ce qu'on pense, lire et répondre aux autres (D73, D82).
    parcours_forum: 'discuter',
    parcours_sondage: 'discuter',
    parcours_nuage_mots: 'discuter',
    parcours_questionnaire: 'discuter',
    parcours_enquete: 'discuter',
    parcours_classe_virtuelle: 'discuter',

    // — Coopérer : construire un résultat commun (D82).
    parcours_mur_notes: 'cooperer',
    parcours_tableau: 'cooperer',
    parcours_wiki: 'cooperer',
    parcours_glossaire: 'cooperer',
    parcours_document: 'cooperer',
    parcours_etherpad: 'cooperer',
    parcours_base: 'cooperer',
    parcours_choix_groupe: 'cooperer',
    parcours_test_etudiant: 'cooperer',
});

/**
 * La famille d'un module, ou `null` s'il n'est pas classé.
 * @param {string} cle
 * @returns {string|null}
 */
export function familleDe(cle) {
    return FAMILLE_PAR_MODULE[cle] || null;
}

/**
 * Passe le plan au miroir.
 *
 * @param {Object} plan
 * @returns {{
 *   total: number,
 *   comptes: Array<{famille:string, n:number}>,
 *   absentes: string[],
 *   dominante: {famille:string, n:number}|null,
 *   nonClasses: number
 * }}
 */
export function analyserPlan(plan) {
    const comptes = new Map(FAMILLES.map(f => [f, 0]));
    let nonClasses = 0;
    let total = 0;

    for (const etape of (plan && plan.etapes) || []) {
        for (const carte of etape.cartes || []) {
            total++;
            const f = familleDe(carte.module);
            if (f) comptes.set(f, comptes.get(f) + 1);
            else nonClasses++;
        }
    }

    const liste = FAMILLES.map(f => ({ famille: f, n: comptes.get(f) }));
    const absentes = liste.filter(x => x.n === 0).map(x => x.famille);

    // « Dominante » veut dire : plus de la MOITIÉ des activités du parcours. En
    // deçà, parler de domination serait un jugement sur une répartition qui n'a
    // rien d'anormal — quatre activités réparties 2/1/1 ne déséquilibrent rien.
    let dominante = null;
    if (total >= 4) {
        const tete = liste.reduce((a, b) => (b.n > a.n ? b : a), liste[0]);
        if (tete.n * 2 > total) dominante = { famille: tete.famille, n: tete.n };
    }

    return { total, comptes: liste, absentes, dominante, nonClasses };
}
