/**
 * @file Parcours — l'exemple de rendu du prompt de plan (D108).
 *
 * Chaque activité a son « EXEMPLE DE RENDU » : un JSON complet, sur un autre sujet,
 * qui montre la forme attendue. Le plan n'avait qu'un squelette de « … » : il ne
 * montrait ni la longueur des textes, ni des durées plausibles, ni surtout des
 * chemins qui durent autant — toutes ses cartes duraient 10 minutes. Mistral
 * Small 4 rendait des chemins de 40 et 60 minutes, refusés (relevé du 1er oct.
 * 2026). L'exemple est désormais un plan COMPLET, de la forme exacte demandée —
 * mêmes étapes, mêmes nombres d'activités, le test et les chemins à leur place,
 * des chemins de même durée —, sur un AUTRE sujet : le cycle de l'eau.
 *
 * Pur : le banc vérifie, pour chaque cadrage possible, que l'exemple passe le
 * contrôle de `calibrage.js` (`run_parcours_reparation.mjs`).
 *
 * @module parcours/exemple-plan
 */
import { MODULES_AIGUILLEURS, MODULE_AIGUILLEUR_DEFAUT } from './aiguillage.js';

/** Le genre d'un module, pour lui donner des textes à sa mesure. */
const GENRES = {
    lecture: ['Page', 'Livre', 'CoursePresentation', 'InteractiveBook', 'Summary', 'Glossary', 'Timeline', 'parcours_lecon'],
    quiz: ['QuizSetQCM', 'QuizSet', 'QuizSetVF', 'MultipleChoice', 'SingleChoiceSet', 'TrueFalse', 'QCM', 'test_elea', 'gift', 'Millionnaire'],
    memoire: ['Flashcards', 'DialogCards'],
    glisser: ['DragTheWords', 'DragAndDrop', 'Appariement'],
    reperer: ['MarkTheWords', 'FindTheWords'],
    ordonner: ['SortParagraphs'],
    trous: ['FillInTheBlanks', 'ComplexFillTheBlanks'],
    redaction: ['Essay', 'Devoir', 'parcours_devoir'],
    echange: ['parcours_forum'],
};
const GENRE_DE = Object.fromEntries(Object.entries(GENRES).flatMap(([g, ms]) => ms.map(m => [m, g])));

/** Durée d'un exemple de chaque genre : les repères du prompt (texte 5-10, exercice 3-8, quiz 10-20…). */
const DUREES = { lecture: 10, exemple: 10, quiz: 10, memoire: 5, glisser: 10, reperer: 5, ordonner: 10, trous: 10, redaction: 20, echange: 15, autre: 10 };

/**
 * Les textes d'exemple, par genre : [titre, objectif, consigne tutoyée, consigne vouvoyée].
 * Plusieurs variantes, pour qu'un même genre ne se répète pas mot pour mot.
 */
const CARTES = {
    lecture: [
        ['Le voyage d’une goutte d’eau', 'Décrire les étapes du cycle de l’eau', 'Lis le texte et repère les quatre étapes du cycle.', 'Lisez le texte et repérez les quatre étapes du cycle.'],
        ['Des nuages à la rivière', 'Décrire le trajet de l’eau qui tombe sur le sol', 'Lis le document et note ce que devient l’eau de pluie.', 'Lisez le document et notez ce que devient l’eau de pluie.'],
    ],
    // Le premier geste des chemins les plus étayés : un exemple résolu avant de faire faire.
    exemple: [
        ['Un exemple résolu : la flaque qui disparaît', 'Expliquer une évaporation à partir d’un exemple', 'Suis l’exemple pas à pas, puis note l’étape du cycle qu’il illustre.', 'Suivez l’exemple pas à pas, puis notez l’étape du cycle qu’il illustre.'],
        ['Un exemple résolu : la buée sur la vitre', 'Expliquer une condensation à partir d’un exemple', 'Suis l’exemple étape par étape, puis refais la démarche avec l’aide proposée.', 'Suivez l’exemple étape par étape, puis refaites la démarche avec l’aide proposée.'],
    ],
    quiz: [
        ['Quiz : les étapes du cycle', 'Reconnaître chaque étape du cycle de l’eau', 'Réponds aux questions ; la correction explique chaque réponse.', 'Répondez aux questions ; la correction explique chaque réponse.'],
        ['Quiz : causes et effets', 'Relier chaque étape du cycle à ce qui la provoque', 'Choisis la bonne cause pour chaque situation, puis lis la correction.', 'Choisissez la bonne cause pour chaque situation, puis lisez la correction.'],
        ['Bilan : tout le cycle de l’eau', 'Vérifier ses acquis sur l’ensemble du parcours', 'Réponds aux questions sur tout le parcours, des nuages aux nappes souterraines.', 'Répondez aux questions sur tout le parcours, des nuages aux nappes souterraines.'],
    ],
    memoire: [
        ['Les mots du cycle', 'Mémoriser le vocabulaire du cycle de l’eau', 'Retourne chaque carte et vérifie si tu connaissais la définition.', 'Retournez chaque carte et vérifiez si vous connaissiez la définition.'],
    ],
    glisser: [
        ['Remettre les mots du cycle à leur place', 'Utiliser le vocabulaire du cycle de l’eau', 'Glisse chaque mot dans la phrase qui lui correspond.', 'Glissez chaque mot dans la phrase qui lui correspond.'],
        ['Associer chaque étape à sa cause', 'Relier les étapes du cycle à leurs causes', 'Glisse chaque cause sous l’étape qu’elle provoque.', 'Glissez chaque cause sous l’étape qu’elle provoque.'],
    ],
    reperer: [
        ['Repérer les changements d’état', 'Identifier les changements d’état dans un texte', 'Surligne chaque mot qui désigne un changement d’état.', 'Surlignez chaque mot qui désigne un changement d’état.'],
    ],
    ordonner: [
        ['Remettre le cycle dans l’ordre', 'Ordonner les étapes du cycle de l’eau', 'Range les étapes dans l’ordre où l’eau les parcourt.', 'Rangez les étapes dans l’ordre où l’eau les parcourt.'],
    ],
    trous: [
        ['Compléter l’explication', 'Employer les mots du cycle dans une explication', 'Complète le texte avec les mots qui conviennent.', 'Complétez le texte avec les mots qui conviennent.'],
        ['Défi : de la pluie à la nappe', 'Expliquer le trajet de l’eau qui s’infiltre', 'Complète chaque phrase, sans modèle, puis vérifie avec la correction.', 'Complétez chaque phrase, sans modèle, puis vérifiez avec la correction.'],
    ],
    redaction: [
        ['Expliquer le cycle avec ses mots', 'Rédiger une explication complète du cycle de l’eau', 'Écris un court paragraphe qui explique le cycle, de l’océan à la rivière.', 'Écrivez un court paragraphe qui explique le cycle, de l’océan à la rivière.'],
        ['Enquête : pourquoi la rivière ne s’assèche pas', 'Justifier le rôle des nappes souterraines', 'Rédige ta réponse en t’appuyant sur deux étapes du cycle.', 'Rédigez votre réponse en vous appuyant sur deux étapes du cycle.'],
    ],
    echange: [
        ['Partager une observation', 'Relier le cycle de l’eau à une situation observée', 'Décris une situation où l’eau change d’état, puis réponds à une autre contribution.', 'Décrivez une situation où l’eau change d’état, puis répondez à une autre contribution.'],
    ],
    autre: [
        ['Explorer le cycle de l’eau', 'Observer une étape du cycle de l’eau', 'Réalise l’activité en suivant la consigne de chaque écran.', 'Réalisez l’activité en suivant la consigne de chaque écran.'],
    ],
};
/** Le test qui oriente : il couvre tout le parcours et n'annonce ni note ni groupe. */
const TEST = ['Test sur le cycle de l’eau', 'Faire le point sur toutes les notions du parcours', 'Réponds à chaque question, puis lis la correction : la suite du parcours s’ouvre ensuite.', 'Répondez à chaque question, puis lisez la correction : la suite du parcours s’ouvre ensuite.'];

/** Les étapes : [titre, objectif, introduction tutoyée, introduction vouvoyée]. */
const ETAPES = {
    debut: ['Découvrir le voyage de l’eau', 'Décrire le trajet de l’eau entre l’océan et l’atmosphère',
        'Tu commences par découvrir comment l’eau quitte l’océan et forme les nuages. Repère les mots en gras : ils reviendront dans tout le parcours.',
        'Vous commencez par découvrir comment l’eau quitte l’océan et forme les nuages. Repérez les mots en gras : ils reviendront dans tout le parcours.'],
    test: ['Faire le point', 'Situer ses connaissances sur le cycle de l’eau',
        'Commence par ce test : il porte sur tout le parcours. Réponds sans chercher, puis lis la correction de chaque question.',
        'Commencez par ce test : il porte sur tout le parcours. Répondez sans chercher, puis lisez la correction de chaque question.'],
    milieu: [
        ['S’entraîner à expliquer le cycle', 'Relier les étapes du cycle à leurs causes',
            'Tu t’entraînes maintenant à expliquer chaque étape. Les exercices se corrigent tout de suite : profite de chaque correction.',
            'Vous vous entraînez maintenant à expliquer chaque étape. Les exercices se corrigent tout de suite : profitez de chaque correction.'],
        ['Suivre l’eau sur les continents', 'Distinguer le ruissellement et l’infiltration',
            'Après les nuages, tu suis l’eau qui tombe sur le sol. Compare bien ce qui ruisselle et ce qui s’infiltre.',
            'Après les nuages, vous suivez l’eau qui tombe sur le sol. Comparez bien ce qui ruisselle et ce qui s’infiltre.'],
    ],
    fin: ['Expliquer le cycle avec ses mots', 'Expliquer le cycle de l’eau en entier',
        'Pour finir, tu expliques le cycle en entier. Appuie-toi sur tout ce que tu as vu depuis le début.',
        'Pour finir, vous expliquez le cycle en entier. Appuyez-vous sur tout ce que vous avez vu depuis le début.'],
    reprendre: ['Pas à pas, avec un exemple', 'Nommer les étapes du cycle à partir d’un exemple résolu',
        'Tu suis un exemple résolu étape par étape, puis tu refais la même démarche avec de l’aide. Lis bien chaque correction.',
        'Vous suivez un exemple résolu étape par étape, puis vous refaites la même démarche avec de l’aide. Lisez bien chaque correction.'],
    renforcer: ['Un exemple, puis à toi', 'Associer chaque étape du cycle à ce qui la provoque',
        'Un exemple te montre la méthode ; à toi ensuite de relier chaque étape à sa cause. La correction t’explique chaque choix.',
        'Un exemple vous montre la méthode ; à vous ensuite de relier chaque étape à sa cause. La correction explique chaque choix.'],
    consolider: ['Défis du cycle de l’eau', 'Expliquer les changements d’état dans des situations variées',
        'Tu appliques ce que tu sais à des situations nouvelles, sans modèle à recopier. Vérifie chaque réponse avec la correction.',
        'Vous appliquez ce que vous savez à des situations nouvelles, sans modèle à recopier. Vérifiez chaque réponse avec la correction.'],
    approfondir: ['Enquêtes sur l’eau', 'Justifier le rôle de chaque étape dans un cas complexe',
        'Tu mènes de courtes enquêtes et tu justifies tes réponses par écrit. La correction vient à la fin : compare-la à ta démarche.',
        'Vous menez de courtes enquêtes et justifiez vos réponses par écrit. La correction vient à la fin : comparez-la à votre démarche.'],
};
/** Les genres d'activité d'un chemin, selon son rôle : l'aide change, pas l'objectif. */
const GENRES_DU_ROLE = {
    reprendre: ['exemple', 'glisser', 'quiz'],
    renforcer: ['exemple', 'glisser', 'trous'],
    consolider: ['trous', 'quiz', 'redaction'],
    approfondir: ['redaction', 'trous', 'quiz'],
};
const NOTIONS = ['l’évaporation', 'la condensation', 'les précipitations', 'le ruissellement', 'l’infiltration', 'les nappes souterraines',
    'la transpiration des plantes', 'les réservoirs d’eau', 'le changement d’état', 'l’énergie solaire', 'les glaciers', 'le bassin versant'];

/**
 * L'exemple de rendu, de la forme exacte demandée.
 *
 * @param {Object} calibrage - `calibrer(draft)`.
 * @param {Array<{cle:string}|string>} modules - Le catalogue autorisé.
 * @param {Object} [o]
 * @param {boolean} [o.vouvoyer] - Le registre de la plateforme (D105).
 * @param {Function} [o.moduleDeTrame] - `(entree) => cle` : le module d'une trame sur la plateforme.
 * @returns {{exemple:Object, dureeChemin:number|null, partsChemin:number[]}}
 */
export function exemplePlan(calibrage, modules, { vouvoyer = false, moduleDeTrame = m => String(m).split('|')[0] } = {}) {
    const dispo = new Set((modules || []).map(m => (typeof m === 'string' ? m : m && m.cle)).filter(Boolean));
    const premier = [...dispo][0] || 'Page';
    const r = quatuor => (vouvoyer ? quatuor[3] : quatuor[2]);
    const a = calibrage.aiguillage;
    const debut = a ? (a.debut ?? 1) : -1;
    const k = a ? a.nombre : 0;
    const n = calibrage.exemple.length;
    const vus = {};
    const textes = genre => {
        const liste = CARTES[genre] || CARTES.autre;
        const i = vus[genre] = (vus[genre] ?? -1) + 1;
        return liste[i % liste.length];
    };
    const moduleDuGenre = genre => (GENRES[genre] || []).find(m => dispo.has(m)) || premier;
    const aiguilleur = [MODULE_AIGUILLEUR_DEFAUT, 'test_elea', 'QuizSetVF'].find(m => MODULES_AIGUILLEURS.has(m) && dispo.has(m));
    const dureesDuPremierChemin = [];

    const etapes = calibrage.exemple.map((nb, i) => {
        const role = a && i >= debut && i < debut + k ? a.roles[i - debut] : null;
        const avantChemins = a && i === debut - 1;
        const type = role || (avantChemins && nb === 1 ? 'test' : i === 0 ? 'debut' : i === n - 1 ? 'fin' : 'milieu');
        const quatuor = type === 'milieu' ? ETAPES.milieu[(i - 1) % ETAPES.milieu.length] : ETAPES[type];
        const suggeres = calibrage.trame && Array.isArray(calibrage.trame.modules) ? calibrage.trame.modules[i] || [] : [];
        const genres = role ? GENRES_DU_ROLE[role] : type === 'fin' ? ['quiz', 'redaction'] : type === 'debut' ? ['lecture', 'quiz', 'glisser'] : ['glisser', 'trous', 'quiz'];
        const cartes = Array.from({ length: nb }, (_, j) => {
            // Le test qui oriente ferme l'étape qui précède les chemins.
            const estTest = avantChemins && j === nb - 1 && aiguilleur;
            const deTrame = suggeres.length ? moduleDeTrame(suggeres[j % suggeres.length]) : null;
            const voulu = genres[j % genres.length];
            const module = estTest ? aiguilleur : deTrame && dispo.has(deTrame) ? deTrame : moduleDuGenre(voulu === 'exemple' ? 'lecture' : voulu);
            // Un exemple résolu se lit : il prend un module de lecture et ses propres textes.
            const genre = voulu === 'exemple' && GENRE_DE[module] === 'lecture' ? 'exemple' : GENRE_DE[module] || 'autre';
            const q = estTest ? TEST : textes(genre);
            const palier = calibrage.trame?.paliers?.[i] || (role ? 'entrainement' : type === 'fin' ? 'transfert' : i === 0 ? 'decouverte' : 'entrainement');
            let duree = estTest ? 15 : DUREES[genre];
            if (calibrage.trame?.id === 'rituel') duree = [2, 4, 4][i] ?? 2;
            // Les chemins durent autant : chaque place reprend la durée du premier chemin.
            if (role && i === debut) dureesDuPremierChemin.push(duree);
            if (role && i > debut) duree = dureesDuPremierChemin[j] ?? duree;
            return { titre: q[0], objectif: q[1], module, palier, duree, consigne: r(q) };
        });
        return {
            titre: quatuor[0], objectif: quatuor[1], introduction: r(quatuor),
            ...(role ? { chemin: role } : {}),
            cartes,
        };
    });

    const exemple = {
        titre: 'Comprendre le cycle de l’eau',
        objectifGeneral: 'Expliquer comment l’eau circule entre l’océan, l’atmosphère et les continents',
        introduction: vouvoyer
            ? 'Dans ce parcours, vous suivez le voyage d’une goutte d’eau, de l’océan aux nuages puis aux rivières. Chaque étape commence par un court texte ; vous vous entraînez ensuite, et la correction explique chaque erreur. Prenez le temps de la lire avant de passer à la suite.'
            : 'Dans ce parcours, tu suis le voyage d’une goutte d’eau, de l’océan aux nuages puis aux rivières. Chaque étape commence par un court texte ; tu t’entraînes ensuite, et la correction t’explique chaque erreur. Prends le temps de la lire avant de passer à la suite.',
        conclusion: vouvoyer
            ? 'Vous savez maintenant nommer les étapes du cycle de l’eau et expliquer ce qui fait passer l’eau de l’une à l’autre. Pour aller plus loin, observez la météo d’une semaine et repérez où en est l’eau autour de vous.'
            : 'Tu sais maintenant nommer les étapes du cycle de l’eau et expliquer ce qui fait passer l’eau de l’une à l’autre. Pour aller plus loin, observe la météo d’une semaine et repère où en est l’eau autour de toi.',
        notionsPivots: NOTIONS.slice(0, calibrage.notions[0]),
        etapes,
    };
    const partsChemin = a ? dureesDuPremierChemin : [];
    return { exemple, dureeChemin: partsChemin.length ? partsChemin.reduce((s, d) => s + d, 0) : null, partsChemin };
}
