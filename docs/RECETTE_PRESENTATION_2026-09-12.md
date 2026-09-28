# Recette Présentation — 12 septembre 2026

Référence : n° 25 CoursePresentation, retouche RELU dans la première question, réenregistrée et réexportée par l’utilisateur. Bibliothèque Éléa **1.27.15** ; semantics identiques au vendor **1.27** employé par le formulaire. Recette complémentaire locale, sans nouveau dépôt Éléa ni génération IA distante.

## Corrections

- Formulaire natif commun aux deux hôtes construit depuis les semantics locales, avec leurs traductions. Les 22 bibliothèques proposées disposent de semantics locales. Placements, tailles, commentaires, boutons (dont `buttonLabel`, ajouté en 1.27), fonds, mots-clés, options générales, libellés et paramètres des sous-activités deviennent accessibles sans reconstruire la mise en page depuis un modèle simplifié.
- Conservation du JSON natif, des sous-identifiants et des paramètres non retouchés. Les textes HTML modifiés sont reconvertis ; une sous-activité nouvellement créée reçoit un identifiant. Le processeur conserve une présentation déjà native et collecte ses dépendances.
- Modèle de génération : options du menu, opacité, fond, boutons de bilan, reprise et solutions complétées dans les éditeurs/processeurs. Prompts complétés et **24 assemblages / 12 langues** vérifiés. Le mode surface active reste réservé au formulaire natif, où les liens de navigation peuvent être construits.
- Export documentaire : parcours de **tous** les éléments d’une diapositive, au lieu de ne conserver qu’un seul exercice et une seule image. Textes, médias, commentaires de correction et tableaux natifs pris en compte. Les exercices courts restent groupés : une consigne auparavant séparée de son contenu dans LibreOffice est corrigée.

## Preuves exécutées

- Deux variantes de cinq diapositives : menu permanent avec bilan ; menu repliable sans bilan. Deux exercices sur la première diapositive ; deux textes, image, audio et vidéo sur la dernière. Quatre exercices natifs d’origine conservés, avec leurs identifiants.
- Sauvegarde/réouverture Caramel ; retouche du titre et d’une sous-question, sauvegarde/réouverture et annulation Sucrerie via callback local. Le libellé natif de bouton 1.27 est également retouché et retrouvé dans le paquet.
- Jeu natif local : erreur QCM puis reprise, Vrai/Faux, deux trous, deux mots sélectionnés ; **6/7**, puis reprise globale et **7/7**. La variante sans bilan conserve cinq diapositives et le score 6/7. Image chargée, audio et vidéo décodés et lus.
- Après les solutions, ouverture du bouton natif « Afficher les commentaires » : commentaire RELU visible dans sa fenêtre. Le bouton est identifié par son titre natif (son nom accessible ne reprend pas ce titre).
- **12 DOCX/ODT/PDF relus**, trois pages chacun : questions, médias, correction. Les deux exercices d’une même diapositive et les deux textes sont présents ; les commentaires restent dans la correction.
- **210 contrôles** documentaires/éditeurs conformes ; dernière vérification éditeur **68/68** après alignement 1.27. Sucrerie : **22 conservations + 65 adaptateurs**. Miroirs : **52 fichiers**, **1164 clés** dans les 12 locales.

Le menu permanent du lecteur natif se superpose au tiers gauche : les placements de la sonde sont adaptés pour réserver cet espace. Les décors et fonctions purement interactives ne sont pas reproduits comme une capture dans le document papier ; les médias audio/vidéo portent une mention de consultation dans l’activité numérique. Les champs techniques sans widget et les bibliothèques récursives non proposées sont conservés dans les données.

Preuves et SHA-256 : `tests/sonde-parcours/audit-activites-2026-09-11/presentation/` dans bas.

```sh
node tests/run_h5p_capabilities_documents.mjs --presentation-only
node tests/run_native_presentation_play.mjs
node tests/run_browser_suite.mjs --suite=document-export,editor-activities
# Sucrerie
node tests/editor/run-presentation-ui.mjs
```

Aucun push/déploiement ; ingestion RAG coupée. Arrêt demandé après cette activité. Prochaine reprise : Livre interactif, puis Vidéo interactive, deux réserves natives et collection parcours selon les suivis.

Commits du lot : bas `f9f6c92e` / Sucrerie `81afb86`.
