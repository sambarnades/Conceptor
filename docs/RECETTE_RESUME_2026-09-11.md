# Recette Résumé — 11 septembre 2026

## Conclusion

Résumé clôturé sur les deux branches `emmanuel`. Référence native : retour utilisateur **02-Summary.h5p**, Summary **1.10.32**, indice retouché avec RELU (`lot-utilisateur-26/retours-elea/Summary/preuve.json`). Aucun nouvel appel IA, service de production ou ingestion RAG.

## Corrections et capacités vérifiées

- Introduction, groupes d’affirmations, première proposition correcte, indice natif plat, feedback global et libellés d’interface conservés.
- Identifiants de groupe conservés au réexport ; `behaviour` absent des semantics n’est plus inventé.
- Limites éditeur et paquet : 1–100 groupes, au moins deux affirmations non vides. 0, 101, une affirmation et un contenu vide refusés ; 100 accepté par le schéma.
- Prompts des 12 langues et référence Markdown : nombre demandé prioritaire, borne 100, aucune obligation de compléter artificiellement à cinq. 24 assemblages rapide/avancé vérifiés ; aucun appel de génération IA effectué pour ce lot.
- Caramel : champ indice modifié, sauvegardé, rouvert et empaqueté ; RELU et UUID natif conservés.
- Sucrerie : introduction et indice modifiés par les contrôles visibles, sauvegarde via callback local (sans persistance serveur), réouverture et annulation vérifiées ; paquet relu.
- Lecteur H5P natif local, depuis le paquet Sucrerie : indice affiché, une mauvaise réponse puis deux bonnes, score final **1/2**.
- Papier : position des réponses déplacée et lettres du corrigé cohérentes en autonome, présentation et livre. Indices sur la feuille élève, pas ajoutés comme réponses au corrigé.
- **12 documents DOCX/ODT/PDF** produits et relus visuellement (9 Caramel, 3 Sucrerie), sans débordement ni contenu perdu. Deux pages par document ; captures de contrôle conservées.

## Rejouer

```sh
node tests/run_h5p_capabilities_documents.mjs --summary-only
# Depuis Sucrerie, après la commande Caramel :
node tests/editor/run-resume-ui.mjs
# Depuis Caramel, après la commande Sucrerie :
node tests/run_native_summary_play.mjs
node tests/run_browser_suite.mjs --suite=document-export
```

Suite documentaire précédente : 142 assertions, 0 échec. Les tests ciblés ajoutent les bornes, les 24 prompts, les sauvegardes et le jeu natif. Preuves : `tests/sonde-parcours/audit-activites-2026-09-11/resume/` ; SHA-256 dans `sha256.json`.

Premiers correctifs : bas `439fa9f3`, Sucrerie `34f1e8c`. Commit de clôture consigné dans les suivis.
