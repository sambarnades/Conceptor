# Parcours : sélecteur et IA externe — 13 septembre 2026

> **Version actuelle** : deux boutons rectangulaires intégrés sous les champs, sur toute leur largeur ; avant les documents en Avancé. Sélection bleu pâle, rangée Rapide/Avancé inchangée. Les variantes ci-dessous sont historiques.


> Ajustement visuel suivant : le sélecteur est désormais intégré au bas du formulaire, sur la largeur des champs. La sélection est blanche sur gris léger ; il ne reste plus flottant au défilement. Les captures et descriptions initiales ci-dessous documentent la première version.


Lot local sur `emmanuel`, sans publication ni changement de production. RAG coupé.

## Ce qui est disponible dans Caramel

Le sélecteur **Une activité / Un parcours** est placé sous les champs Rapide/Avancé et au-dessus des filtres. Il reste accessible sous l’en-tête pendant le défilement. Ses deux libellés restent visibles sur téléphone.

L’IA intégrée conserve son bouton principal. Une commande secondaire **IA externe** ouvre uniquement sur demande les deux étapes familières : obtenir le prompt, puis utiliser la réponse.

### Préparer le plan avec une IA externe

1. Renseigner le sujet et le cadrage du parcours.
2. Choisir **IA externe**, copier le prompt et le transmettre à l’IA choisie.
3. Coller sa réponse, puis **Vérifier la réponse**. Un diagnostic indique les corrections nécessaires si le plan ne respecte pas le cadrage.
4. Relire l’aperçu des étapes, puis **Utiliser cette proposition**. Le plan reste modifiable dans Caramel.

La vérification seule ne remplace jamais le plan. Si un plan existe, son remplacement demande confirmation. Aucun contenu d’activité n’est fabriqué à cette étape.

### Remplir les activités

Depuis le plan, **IA externe** ouvre la fabrication sans lancer l’IA intégrée. Chaque activité dispose de sa propre commande ; elle existe aussi avec les réglages de la carte sur le plan.

Le prompt reprend l’objectif du parcours, les notions communes, les activités précédentes et la consigne de cette carte. La réponse passe par les réparations JSON et les schémas de l’éditeur, puis attend une application explicite. Les activités déjà présentes ne sont pas refaites par la file intégrée ; les deux méthodes peuvent donc être combinées.

Les réponses appliquées suivent la sauvegarde du brouillon et l’export/import du scénario. Une saisie non appliquée reste disponible à la réouverture du dialogue dans la même session et pour la même carte ; elle n’est pas incluse dans le fichier scénario. Après fermeture de l’onglet, conserver le scénario exporté reste nécessaire.

Pour les activités à image, joindre également à l’IA externe le fichier choisi ; aucune vision intégrée n’est déclenchée par ce circuit. Pour une vidéo, la préparation habituelle de sa source et de sa transcription est conservée. Les prompts utilisent les sources du parcours selon les mêmes limites que la génération intégrée.

## Vérifications

- **14 369 assertions Caramel réussies, sans échec, dans les 42 suites navigateur générales.**
- **51 contrôles réussis** dans `node tests/run_parcours_external_ai.mjs` : copie réelle du prompt, plan invalide refusé, vérification sans application, réponse d’activité appliquée, export H5P, aller-retour du scénario, annulation, rechargement et mise en page mobile.
- Contrats de réponses : les 27 H5P, les 7 activités Moodle proposées au parcours et les 5 modules propres au parcours ; réponse QCM vide refusée et texte alternatif d’image conservé. Ces contrôles emploient les exemples locaux, pas des générations distantes.
- **172 contrôles d’atelier**, **46 garde-fous didactiques**, **37 contrôles de relecture** réussis. Les assertions de position reflètent le nouvel emplacement ; la recette de fermeture utilise la confirmation d’abandon intégrée existante.
- Douze langues, vérificateur de locales conforme. Aucun appel IA sur le circuit externe textuel de la recette ; services distants bloqués.
- Relecture visuelle des vues ordinateur, dialogue de réponse, téléphone et sélecteur au défilement.

Preuves dans bas : `tests/sonde-parcours/parcours-externe-2026-09-13/` (journaux, résultats et captures). Les nouvelles activités importées par ce circuit n’ont pas fait l’objet d’une nouvelle campagne Éléa/Magistère/Moodle.

## Report Sucrerie et suite

Ce lot concerne le cadrage et la génération dans Caramel ; Sucrerie n’embarque pas ces écrans. Aucune copie artificielle de leurs modules ou traductions n’y est ajoutée. Les activités obtenues utilisent les mêmes contenus et les éditeurs déjà synchronisés. Le présent rapport, le changelog et le suivi sont reportés dans Sucrerie.

L’intégration commune collection/parcours dans Sucrerie et la recette en ligne de l’enrichissement du dépôt restent le lot suivant. Ce travail ne les présente pas comme réalisés.
