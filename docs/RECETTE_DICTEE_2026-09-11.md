# Recette Dictée — 11 septembre 2026

Référence : retour utilisateur Éléa **12-Dictation.h5p**, description RELU. Les nouvelles recettes utilisent les bibliothèques natives dans le lecteur local ; aucun nouveau dépôt en plateforme n'est revendiqué.

- Éditeur : séparateur, sens de lecture, segmentation automatique et variantes de correction ajoutés. Média de question natif conservé par le composant commun. Toutes les sources audio et leurs crédits survivent à la sauvegarde/réouverture ; un téléversement réel remplace la liste audio. Les limites laissées vides restent illimitées.
- Processeur : conservation des libellés personnalisés et sources audio ; valeur native du coût des coquilles (100 %) rétablie. Prompts complétés : 24 assemblages en 12 langues, sans nouvelle génération IA.
- Caramel et Sucrerie : sauvegarde, réouverture et exports réels ; annulation Sucrerie sans sauvegarde. Persistance Sucrerie exercée par callback local, pas en base distante.
- Jeu : écoute réelle, erreur, solution et reprise ; réponse classique et variante toutes deux **7/7**. Segmentation personnalisée **7/7** et segmentation chinoise **2/2**. Le réglage RTL pilote le traitement des solutions natif ; il ne change pas la direction du champ de saisie. Les sondes de segmentation conservent l'audio français sans le jouer et ne constituent pas des dictées chinoises.
- Particularité native : avec un séparateur personnalisé, les segments intermédiaires attendent leur espace final (exemple `Paris _est _la _capitale _de _la _France`). Une chaîne sans ces espaces obtient 2/7 dans la bibliothèque ; le séparateur espace reste le défaut conseillé.
- Synthèse réelle : une requête de développement `caramel-tts-bas`, phrase « Paris est la capitale de la France. », réponse française `fr_FR-upmc-medium#jessica`. MP3 reçu puis effectivement lu localement (2,03 s). Les 44 tests du panneau utilisent leurs réponses simulées habituelles ; ils ne sont pas présentés comme 44 appels au service.
- Papier : **12 DOCX/ODT/PDF relus**, énoncé, correction avec variantes et attribution audio. Les crédits de sources identiques sont dédoublonnés sans perdre le premier crédit.
- **246 assertions navigateur sans échec**, 22 contrôles de conservation et 64 adaptateurs Sucrerie. Miroir de 51 fichiers et 1108 clés dans 12 langues conforme.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/dictee/` dans bas, dont `tts/`, captures et empreintes SHA-256.

```sh
node tests/run_h5p_capabilities_documents.mjs --dictation-only
node tests/run_native_dictee_play.mjs
node tests/run_browser_suite.mjs --suite=document-export,editor-activities,dictation-tts
# Dans Sucrerie :
node tests/editor/run-dictee-ui.mjs
```

Branches emmanuel ; commits locaux consignés dans les suivis. Aucun push ni déploiement ; RAG coupé.
