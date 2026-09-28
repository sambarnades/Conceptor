# Ce qui change dans les éditeurs H5P

12 septembre 2026 — travail local sur les branches `emmanuel` de Caramel et Sucrerie, non publié.

## Ce que vous pouvez faire de plus

Les activités restent des H5P ordinaires. Le chantier rend accessibles des réglages que H5P connaissait déjà, conserve mieux les modifications et complète les documents imprimables. Il ne crée pas 27 nouveaux types d’activités.

Dans **Caramel**, générez votre activité puis ouvrez son éditeur. Selon le type, les champs se trouvent dans les rubriques du contenu, des médias, du comportement ou des retours. Pour les **livres et vidéos issus du modèle simple**, « Options avancées » ouvre les paramètres natifs plus détaillés. Les activités déjà natives ouvrent directement leur formulaire adapté.

Dans **Sucrerie**, ouvrez l’activité déposée puis son éditeur de contenu. Les réglages partagés suivent ceux de Caramel ; les commandes de dépôt, de métadonnées et d’enregistrement restent propres à Sucrerie. Les essais de persistance récents utilisent un service simulé localement : ils ne prouvent pas encore l’enregistrement sur le serveur de production.

Les libellés peuvent varier selon la langue et le type de contenu. Tous les réglages ci-dessous ne sont pas nouveaux : le tableau distingue les champs ajoutés ou rendus accessibles des valeurs déjà présentes dont la conservation a été corrigée.

| Activité | Champs, réglages ou comportements complétés |
|---|---|
| Graphique | Couleurs natives mieux reprises, valeurs décimales et bornes contrôlées ; légendes et graduations corrigées dans les documents. |
| Résumé | Indice de chaque groupe, introduction et libellés conservés ; nombre de groupes conforme à H5P, sans ajout artificiel pour atteindre cinq. |
| Glisser les mots | Fiches par mot pour l’indice et les explications correct/incorrect, mots distracteurs, média de consigne ; codes H5P reconstruits à la sauvegarde. |
| Rédaction | Variantes de mots-clés, points et occurrences, casse et fautes tolérées, explications selon présence/absence, taille et limites de saisie, seuils et mode sans note. |
| Texte à trous | Média de consigne, dialogues de confirmation, vérification automatique, variantes, casse, tolérance et reprise ; retouche de consigne correctement réexportée. |
| Marquer les mots | Média éditable, boutons et points par mot conservés ; explications réservées au corrigé papier. |
| Vrai/Faux | Média, textes des confirmations et explications correct/incorrect ; valeurs de vérification et reprise conservées. |
| Choix multiple | Média et confirmations, choix unique/multiple, seuil, point unique, vérification automatique ; indices et explications par proposition conservés. |
| Choix uniques en série | Délais, progression automatique/manuelle et libellés conservés ; limites de réponses alignées sur H5P. |
| Cartes mémoire | Indices, saisie obligatoire, casse et mélange conservés ; cartes sans image correctement ouvertes. |
| Cartes de dialogue | Audio et crédits conservés ; textes de confirmation de remise à zéro éditables ; répétition et navigation vérifiées. |
| Dictée | Séparateur, segmentation et variantes, sens de traitement des solutions ; sources audio et crédits conservés. |
| Mots mêlés | Accents et alphabets non latins préservés, orientations et liste visible/masquée conservées ; sélection à la souris corrigée dans le lecteur local. |
| Classer les paragraphes | Média de consigne et alternative ; barèmes, doublons et déplacement conservés ; reprise après solution corrigée dans le lecteur local. |
| Mots croisés | Mot-solution, positions imposées, tirage et indices texte/image/audio/vidéo. |
| Glossaire | Niveau des titres H2/H3/H4 conservé ; réédition compatible avec les anciens tableaux et le format natif, sans vider les définitions. |
| Quiz mixte | Introduction avec image et bouton, tirage d’un sous-ensemble, retour arrière, réglages communs, résultats et vidéos de fin. |
| Quiz QCM | Même conteneur que le quiz mixte, options et explications des QCM ; intervalles mathématiques corrigés dans LibreOffice. |
| Quiz Vrai/Faux | Même conteneur, options et explications de chaque affirmation ; exemple pédagogique corrigé. |
| Glisser-déposer | Options de zones et d’étiquettes : visibilité, opacité, capacité, indices, explications, répétition, zones de dépôt autorisées ; distracteurs acceptés. |
| Frise chronologique | Zoom, langue, fond et miniature ; la hauteur modifie enfin la valeur réellement utilisée par H5P. |
| Image à points interactifs | Icône et couleur par point, plein écran, paramètres audio/vidéo ; tous les blocs d’un point passent dans les documents. |
| Trouver la zone | Libellés de reprise, fermeture et accessibilité ; géométrie et explications existantes conservées. |
| Trouver plusieurs zones | Titre interne de la question éditable séparément du titre de l’activité ; géométrie, seuil et explications conservés. |
| Présentation | Accès aux éléments natifs de chaque diapositive : position, taille, fond, commentaires, boutons, paramètres des sous-activités et navigation. |
| Livre interactif | Couverture, progression, reprise, pages, blocs et colonnes ; largeur des colonnes contrôlée ; médias et pistes de sous-titres des vidéos. |
| Vidéo interactive | Sources alternatives avec nom de qualité, piste WebVTT, signets, écran final, résumé, durée et pause de chaque interaction, mode affiche/bouton et paramètres natifs des interactions. |

## Quatre exemples avant / après

**Une frise** : changer la hauteur pouvait laisser l’affichage inchangé, car l’éditeur écrivait au mauvais endroit. La hauteur enregistrée est maintenant celle lue par H5P.

**Un quiz illustré** : l’éditeur conserve les explications et le média de la question. Le document propose l’énoncé et son image, puis un corrigé distinct. Le contrôle élargi du 12 septembre a trouvé et corrigé une image imprimée deux fois lorsque Sucrerie fournissait simultanément le média natif et sa forme simplifiée.

**Une activité importée dans un livre ou une présentation** : ses textes et retours restent à leur emplacement natif. Le contrôle élargi a repéré que la conversion du modèle simplifié pouvait déplacer ces champs ; elle est désormais évitée pour les formulaires natifs.

**Une vidéo** : vous pouvez ajouter deux fichiers de qualités différentes, nommer ces qualités, ajouter une piste de sous-titres et choisir si une question met la lecture en pause. Ces choix doivent rester présents après sauvegarde puis réouverture. Une option de saut laissée vide ne devient plus un saut intempestif vers le début de la vidéo.

## Prompts et documents

Les consignes envoyées à l’IA précisent les formats et réglages pris en charge, dans les douze langues. Cela améliore le contrat demandé ; cela ne garantit pas que chaque génération respectera parfaitement la consigne. Les assemblages de prompts ont été testés, avec seulement quelques essais IA distants autorisés : aucune campagne exhaustive de générations n’est revendiquée.

Les DOCX, ODT et PDF reprennent davantage d’indices, de variantes, de corrections, d’images et de crédits. Les présentations et livres parcourent leurs contenus imbriqués au lieu de n’en retenir qu’une partie. Une vidéo ou un son embarqué reste à consulter dans l’activité numérique : un document papier ne reproduit pas son interactivité. Les documents des sondes ont été ouverts et relus, avec les limites indiquées dans chaque rapport.

## Compatibilité et portée des contrôles

Les champs s’appuient sur les `semantics.json`, c’est-à-dire les définitions de champs des bibliothèques réexportées depuis Éléa. Ce choix vise à produire le format que H5P attend, en conservant les identifiants, les médias et les paramètres non retouchés. Il n’introduit pas un format de fichier propriétaire.

**On ne peut pas en déduire une garantie universelle.** Une instance Moodle doit disposer des types et bibliothèques H5P nécessaires ([documentation Moodle](https://docs.moodle.org/500/en/H5P)). Le même principe de vérification des dépendances s’applique aux paquets destinés aux instances Éléa/Magistère utilisées : les versions installées et leur configuration doivent être qualifiées sur les cibles réelles.

- **Éléa** : références importées, modifiées et réexportées dans le cours de recette ; certains lots supplémentaires y ont été essayés. Tous les réglages ajoutés ensuite n’y ont pas été redéposés.
- **Magistère et autre Moodle** : aucune nouvelle campagne réelle complète sur ces plateformes pendant cet audit. Compatibilité visée par les formats natifs, pas certification de toutes les installations.
- **Mots mêlés et tri** : les deux erreurs du lecteur sont corrigées localement dans Caramel/Sucrerie. Elles ne sont pas corrigées par les seules données du H5P exporté ; les bibliothèques de la plateforme doivent recevoir une correction correspondante.
- **Production** : aucune mise en ligne de ces branches, aucune migration distante et aucune relance de l’ingestion RAG.

Le compteur **27/27** mesure les activités traitées et testées localement ; il ne signifie pas « chaque combinaison de champs éprouvée sur trois plateformes ». Les rapports, scénarios et réserves restent consultables dans le fichier de suivi.
