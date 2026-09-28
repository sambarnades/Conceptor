# Recette Marquer les mots — 11 septembre 2026

Référence Éléa : retour utilisateur **06-MarkTheWords.h5p**, H5P.MarkTheWords **1.11.24**, consigne retouchée avec RELU. Compléments testés dans le lecteur natif local, sans nouveau dépôt ni appel IA.

- Média natif conservé et éditable via le composant commun image/audio/vidéo, y compris dans les conteneurs. Image présente dans les paquets et documents ; suppression après sauvegarde Sucrerie vérifiée.
- Texte, marquage, feedback global et quatre comportements natifs conservés. Les libellés personnalisés ne sont plus écrasés ; processeur autonome et QuizSet unifiés.
- Prompts des 12 langues, **24 assemblages rapide/avancé** contrôlés. Précision : aucune vérification automatique dans ce type ; masquer Vérifier suppose un déclenchement par le conteneur.
- Caramel : texte retouché, sauvegardé, rouvert et empaqueté. Sucrerie : consigne et texte modifiés dans les contrôles visibles, sauvegarde via callback local, réouverture, annulation et suppression du média. Pas de persistance serveur annoncée.
- Lecteur natif : mot erroné et points négatifs, solution, reprise puis **2/2**. Variante sans aides : **1/2**, commandes solution/reprise et points par mot absents conformément aux réglages.
- **12 documents DOCX/ODT/PDF relus visuellement** ; image et texte présents côté élève, réponses côté corrigé. Formatage aussi vérifié dans QuizSet, présentation et livre.
- **202 assertions navigateur, 0 échec**, **22 contrôles de conservation Sucrerie**. Miroir de 51 fichiers, 1101 clés dans 12 langues.

Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/marquer-mots/`, paquets, documents, captures et SHA-256.

```sh
node tests/run_h5p_capabilities_documents.mjs --mark-only
# Sucrerie :
node tests/editor/run-marquer-mots-ui.mjs
# Caramel :
node tests/run_native_mark_words_play.mjs
```

Branches `emmanuel`, commits locaux dans les suivis. Aucun push ni déploiement ; RAG coupé.
