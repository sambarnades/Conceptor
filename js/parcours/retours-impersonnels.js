/**
 * @file Parcours — les retours d'exemple, à l'impersonnel, POUR LE PARCOURS SEUL.
 *
 * Chaque type d'activité donne au modèle un exemple de rendu
 * (`prompt_<activité>_exemple_rendu` des locales), commun à la génération
 * individuelle et au remplissage d'une carte. Ses retours tutoient (« Tu as
 * compris l'essentiel ») ; dans un parcours pour adultes, le modèle recopiait ce
 * « tu » malgré la règle de registre (parcours réels du 28 sept. 2026, D80).
 *
 * **Les prompts individuels ne changent pas** (demande d'Emmanuel, 28 sept. 2026,
 * D82) : c'est l'atelier qui substitue, dans SON prompt, chaque retour tutoyé par
 * une version impersonnelle — un retour sur la tâche, qui convient aux élèves
 * comme aux adultes. Une paire dont le texte d'origine a disparu de l'exemple ne
 * ferait plus rien : `tests/run_parcours_natifs.mjs` le signale.
 *
 * Seul le français est traité ; les autres langues gardent leurs exemples.
 *
 * @module parcours/retours-impersonnels
 */

/** Paires [retour de l'exemple commun, version impersonnelle], par langue. */
export const RETOURS_IMPERSONNELS = Object.freeze({
    fr: Object.freeze([
        ["Bon travail ! Tu as compris l'essentiel du sujet.", "Bon travail : l'essentiel du sujet est compris."], // crossword
        ["Excellent ! Tu as une parfaite maîtrise de cette leçon.", "Excellent : la leçon est parfaitement maîtrisée."], // crossword
        ["C'est un début. Relis bien le cours sur la photosynthèse.", "C'est un début : le cours sur la photosynthèse est à relire."], // essay
        ["Ta compréhension progresse. Pense à détailler davantage.", "La compréhension progresse ; les explications gagneraient à être plus détaillées."], // essay
        ["Bon travail ! Tu maîtrises les bases.", "Bon travail : les bases sont maîtrisées."], // essay
        ["Excellent ! Tu as une maîtrise parfaite du sujet.", "Excellent : le sujet est parfaitement maîtrisé."], // essay
        ["Pense à la lumière comme source d'énergie.", "Piste : la lumière est la source d'énergie."], // summary
        ["Tu tiens l'essentiel : vérifie les affirmations qui t'ont fait hésiter.", "L'essentiel est là : les affirmations qui ont fait hésiter sont à revérifier."], // summary
        ["Très bien : tu sais reconnaître ce qui décrit correctement la photosynthèse.", "Très bien : ce qui décrit correctement la photosynthèse est reconnu."], // summary
        ["Relie chaque mot à sa place en t'aidant de ce que tu sais du système solaire.", "Chaque mot trouve sa place à partir de ce que l'on sait du système solaire."], // drag_the_words
        ["Bon début : revois les mots que tu hésites à placer.", "Bon début : les mots placés avec hésitation sont à revoir."], // drag_the_words
        ["Reprends comment on reconnaît le groupe d'un verbe à sa terminaison à l'infinitif.", "À revoir : le groupe d'un verbe se reconnaît à sa terminaison à l'infinitif."], // drag_and_drop
        ["Bon début : revois les verbes que tu as hésité à classer.", "Bon début : les verbes classés avec hésitation sont à revoir."], // drag_and_drop
        ["Bon début : revois les mots qui désignent les astres et leur rôle.", "Bon début : les mots qui désignent les astres et leur rôle sont à revoir."], // fill_in_the_blanks
        ["Rappelle-toi qu'un nom propre désigne une personne ou un lieu précis et prend une majuscule.", "Rappel : un nom propre désigne une personne ou un lieu précis et prend une majuscule."], // mark_the_words
        ["Tu en as trouvé quelques-uns : vérifie chaque mot qui porte une majuscule.", "Quelques-uns sont trouvés : chaque mot qui porte une majuscule est à vérifier."], // mark_the_words
        ["Bien : il te reste un ou deux noms propres à repérer.", "Bien : il reste un ou deux noms propres à repérer."], // mark_the_words
        ["Parfait : tu as identifié tous les noms propres.", "Parfait : tous les noms propres sont identifiés."], // mark_the_words
        ["Observe la couleur de la chair et du jus, pas seulement de la peau.", "Indice : la couleur de la chair et du jus compte, pas seulement celle de la peau."], // multiple_choice
        ["Observe bien la couleur de la chair du cassis pour la retenir.", "À retenir : la couleur de la chair du cassis."], // multiple_choice
        ["Tu approches : pense à un violet très soutenu.", "Presque : il s'agit d'un violet très soutenu."], // multiple_choice
        ["Reprends la chaîne de cause à effet, étape par étape, depuis l'origine.", "La chaîne de cause à effet est à reprendre, étape par étape, depuis l'origine."], // sort_the_paragraphs
        ["Bon début de mise en ordre : cherche ce qui déclenche l'étape suivante.", "Bon début de mise en ordre : la clé est ce qui déclenche l'étape suivante."], // sort_the_paragraphs
        ["Bonne logique d'ensemble : vérifie l'ordre de deux étapes voisines.", "Bonne logique d'ensemble : l'ordre de deux étapes voisines reste à vérifier."], // sort_the_paragraphs
        ["Reprends ces notions à ton rythme : relis le cours puis refais le quiz.", "Ces notions sont à reprendre : relire le cours, puis refaire le quiz."], // single_choice_set
        ["Tu installes ces notions : cible les questions qui t'ont fait hésiter.", "Ces notions s'installent : les questions qui ont fait hésiter sont à cibler."], // single_choice_set
        ["Bonne base : repère ce qui t'a fait douter pour consolider.", "Bonne base : repérer ce qui a fait douter permettra de consolider."], // single_choice_set
        ["Tu maîtrises bien l'ensemble. Continue à t'entraîner pour ancrer ces acquis.", "L'ensemble est bien maîtrisé. S'entraîner encore ancrera ces acquis."], // single_choice_set
        ["Réécoute chaque phrase en lecture lente et écris-la mot après mot, puis relis-toi.", "Conseil : réécouter chaque phrase en lecture lente, l'écrire mot après mot, puis se relire."], // dictation
        ["Bon début : appuie-toi sur la lecture lente pour repérer les mots difficiles et vérifie les accords.", "Bon début : la lecture lente aide à repérer les mots difficiles ; les accords sont à vérifier."], // dictation
        ["Presque : relis ta dictée en vérifiant les terminaisons, les accents et les homophones.", "Presque : une relecture attentive des terminaisons, des accents et des homophones s'impose."], // dictation
        ["Pour t'y retrouver, mémorise l'ordre des planètes en partant du Soleil : Mercure vient en premier.", "Repère : l'ordre des planètes part du Soleil, et Mercure vient en premier."], // quizset
        ["Tu approches : cherche la planète qui orbite au plus près du Soleil.", "Presque : la réponse est la planète qui orbite au plus près du Soleil."], // quizset
        ["Tu tiens l'essentiel : relie membrane, perméabilité et échanges dans une même idée.", "L'essentiel est là : membrane, perméabilité et échanges sont à relier dans une même idée."], // quizset
        ["Très complet : tu expliques bien le rôle de la membrane dans les échanges de la cellule.", "Très complet : le rôle de la membrane dans les échanges de la cellule est bien expliqué."], // quizset
        ["Tu en as trouvé quelques-uns : vérifie chaque mot d'action de la phrase.", "Quelques-uns sont trouvés : chaque mot d'action de la phrase est à vérifier."], // quizset
        ["Bien : il te reste un ou deux verbes à repérer.", "Bien : il reste un ou deux verbes à repérer."], // quizset
        ["Parfait : tu as identifié tous les verbes au présent.", "Parfait : tous les verbes au présent sont identifiés."], // quizset
        ["Associe chaque pays à sa capitale en t'aidant de ce que tu connais déjà.", "Chaque pays s'associe à sa capitale à partir de ce qui est déjà connu."], // quizset
        ["Bon début : revois les capitales que tu hésites à placer.", "Bon début : les capitales placées avec hésitation sont à revoir."], // quizset
        ["Bon départ : concentre-toi sur le vocabulaire précis (triangle, somme…).", "Bon départ : le vocabulaire précis (triangle, somme…) fait la différence."], // quizset
        ["Bien : il te manque encore un terme à trouver.", "Bien : il manque encore un terme à trouver."], // quizset
        ["Pense à ce qui distingue un mammifère d'un reptile pour les classer.", "Piste : ce qui distingue un mammifère d'un reptile permet de les classer."], // quizset
        ["Bon début : revois les animaux que tu as hésité à placer.", "Bon début : les animaux placés avec hésitation sont à revoir."], // quizset
        ["Reprends les notions de base à ton rythme : relis le cours puis refais le quiz, tu vas progresser.", "Les notions de base sont à reprendre : relire le cours, puis refaire le quiz, pour progresser."], // quizset
        ["Tu installes ces notions. Cible ce qui te résiste et entraîne-toi encore un peu.", "Ces notions s'installent. Cibler ce qui résiste et s'entraîner encore un peu."], // quizset
        ["Plusieurs notions sont acquises. Repère les questions qui t'ont fait hésiter pour consolider.", "Plusieurs notions sont acquises. Repérer les questions qui ont fait hésiter permettra de consolider."], // quizset
        ["Tu maîtrises bien l'ensemble. Continue à t'entraîner pour ancrer ces acquis.", "L'ensemble est bien maîtrisé. S'entraîner encore ancrera ces acquis."], // quizset
        ["Pour t'y retrouver, mémorise l'ordre des planètes en partant du Soleil : Mercure vient en premier.", "Repère : l'ordre des planètes part du Soleil, et Mercure vient en premier."], // quizset_qcm
        ["Tu approches : cherche la planète qui orbite au plus près du Soleil.", "Presque : la réponse est la planète qui orbite au plus près du Soleil."], // quizset_qcm
        ["Tu as une partie de la réponse : il y a deux organites à trouver.", "Une partie de la réponse est là : il y a deux organites à trouver."], // quizset_qcm
        ["Bien : il te manque encore l'un des deux organites concernés.", "Bien : il manque encore l'un des deux organites concernés."], // quizset_qcm
        ["Reprends les notions de base à ton rythme : relis le cours puis refais le quiz, tu vas progresser.", "Les notions de base sont à reprendre : relire le cours, puis refaire le quiz, pour progresser."], // quizset_qcm
        ["Tu es en train d'installer ces notions. Cible ce qui te résiste et entraîne-toi encore un peu.", "Ces notions s'installent. Cibler ce qui résiste et s'entraîner encore un peu."], // quizset_qcm
        ["Plusieurs notions sont acquises. Repère les questions qui t'ont fait hésiter pour consolider.", "Plusieurs notions sont acquises. Repérer les questions qui ont fait hésiter permettra de consolider."], // quizset_qcm
        ["Tu maîtrises bien l'ensemble. Continue à t'entraîner pour ancrer ces acquis.", "L'ensemble est bien maîtrisé. S'entraîner encore ancrera ces acquis."], // quizset_qcm
        ["Reprends ces repères à ton rythme : relis le cours puis refais le quiz.", "Ces repères sont à reprendre : relire le cours, puis refaire le quiz."], // quizset_vf
        ["Tu installes ces repères : cible les affirmations qui t'ont fait douter.", "Ces repères s'installent : les affirmations qui ont fait douter sont à cibler."], // quizset_vf
        ["Bonne base : repère les énoncés qui t'ont fait hésiter pour consolider.", "Bonne base : repérer les énoncés qui ont fait hésiter permettra de consolider."], // quizset_vf
        ["Tu maîtrises bien ces notions. Continue à t'entraîner pour les ancrer.", "Ces notions sont bien maîtrisées. S'entraîner encore les ancrera."], // quizset_vf
    ]),
});

/**
 * Remplace, dans un prompt de carte, les retours d'exemple tutoyés par leur
 * version impersonnelle. Chaque retour est cherché ENTRE GUILLEMETS, comme il
 * figure dans l'exemple JSON : aucune phrase du sujet ne peut être touchée.
 * @param {string} prompt
 * @param {string} langue - Code de locale Caramel (`fr`, `en`…).
 * @returns {string}
 */
export function retoursImpersonnels(prompt, langue) {
    let texte = String(prompt || '');
    for (const [tutoye, impersonnel] of RETOURS_IMPERSONNELS[langue] || []) {
        texte = texte.split(`"${tutoye}"`).join(`"${impersonnel}"`);
    }
    return texte;
}
