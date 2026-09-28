# Vérification élargie Caramel / Sucrerie — 12 septembre 2026

Demandée après l’audit des 27 H5P. Les deux branches restent `emmanuel`, sans push ni déploiement. Ce rapport porte sur le code final du lot de corrections et sur les tests locaux ; il ne certifie pas toutes les instances Moodle, Éléa ou Magistère.

## Résultat final

| Vérification | Résultat |
|---|---|
| Caramel, toutes les suites navigateur | **14 369 assertions réussies, 0 échec, 42/42 suites exécutées** |
| Sucrerie, toutes les suites du lanceur | **3 098 assertions réussies, 0 échec, 145 suites** ; réseau extérieur bloqué |
| Retours de réponses / semantics | 83 fixtures traversées, 21 avec retours ; **96 retours conservés**, 0 clé hors contrat, deux cas de récupération réussis |
| Miroirs éditeur / exports | 37 + 15 fichiers identiques, aucune divergence |
| Contraintes | 328 champs et 189 résolutions de sous-champs comparés, aucune divergence |
| Traductions partagées | 1165 clés présentes dans les 12 langues ; vérificateur des locales conforme |
| Réédition réelle des conteneurs dans Sucrerie | Présentation, livre et vidéo : deux variantes chacun, sauvegarde/réouverture/annulation et exports conformes |
| Quiz illustré | Image de question unique, distincte de l’image d’introduction ; trois documents réellement générés et relus (4 pages chacun) |

## Ce que le passage élargi a trouvé et corrigé

Le premier passage **n’était pas vert** : Sucrerie avait trois échecs ; Caramel 16 assertions en échec et deux suites interrompues. Le journal initial Caramel est conservé pour ne pas effacer ce constat.

Corrections du produit, dans les deux hôtes :

- Une question de quiz pouvait imprimer deux fois son image quand son modèle contenait le média natif et le champ simplifié `mediaImage`. Le conteneur laisse maintenant les formateurs de question gérer ce média une seule fois. Le test Sucrerie existant a détecté le problème ; il passe sans assouplissement.
- Le convertisseur des modèles simplifiés parcourait aussi les trois conteneurs natifs avant leur retour direct. Il pouvait déplacer la consigne Blanks et les retours Vrai/Faux hors des champs édités par les semantics. Les présentations, livres et vidéos natifs le contournent désormais dès l’entrée. Six nouvelles assertions vérifient leur conservation exacte à l’ouverture et à la sauvegarde.
- Dans le modèle simplifié, le texte Blanks est représenté par une seule valeur éditable, puis reconstruit dans le champ natif à l’enregistrement. Le second cycle ne rajoute plus une copie parasite.
- Une description de couverture composée uniquement d’espaces n’active plus implicitement la couverture ; une activation explicitement choisie reste conservée.
- La clé `editor_cp_active_surface` figurait deux fois dans chaque locale des deux hôtes. Une seule définition demeure, avec la valeur déjà effectivement utilisée.
- Le repli sur les libellés anglais des semantics sans traduction est commenté explicitement.

Actualisations des tests, motivées par le contrat natif :

- Le glisser-déposer accepte un distracteur sans zone correcte ; une référence de zone hors limites reste refusée.
- Summary ne possède pas de groupe `behaviour` ; les lettres grecques sont autorisées dans les mots mêlés.
- Les valeurs par défaut QCM/Blanks et les seuils facultatifs Essay suivent les semantics ; la hauteur Timeline se trouve dans `timeline.height`.
- L’exemple du livre contient désormais une ligne de colonnes. Les tests vérifient cette ligne, puis l’ancien modèle plat ; les clics d’ajout/suppression ciblent le tableau extérieur plutôt qu’un tableau de colonne. L’égalité des objets ignore l’ordre de leurs clés, mais conserve l’ordre des listes et toutes les valeurs.
- Le plafond indicatif de taille des traductions passe de 450 à 500 Ko après l’ajout des champs et prompts des 27 activités.

## Limites qui restent ouvertes

L’absence d’échec signifie **aucune régression détectée par ces contrôles**, pas une garantie d’absence de tout défaut. Les bibliothèques H5P nécessaires doivent exister sur la plateforme cible ([documentation Moodle](https://docs.moodle.org/500/en/H5P)). Les derniers paramètres ajoutés n’ont pas tous été redéposés dans Éléa ; aucune campagne complète Magistère/Moodle n’a été menée ici.

Les correctifs locaux FindTheWords et SortParagraphs ne mettent pas à jour leurs bibliothèques dans Éléa. Les sauvegardes Sucrerie récentes emploient un service local simulé, pas la base de production. La collection parcours unifiée reste un chantier distinct, non réalisé par cette vérification. Ingestion RAG coupée.

## Reproduire

```sh
# bas
node tests/run_browser_suite.mjs
node tests/run_feedback_semantics.mjs
node scripts/verify-all-locales.mjs
# Sucrerie : ouvrir tests/index.html via un serveur HTTP local, puis :
node tests/editor/run-presentation-ui.mjs
node tests/editor/run-livre-natif-ui.mjs
node tests/editor/run-video-native-ui.mjs
node scripts/diff-editor-vs-caramel.mjs --caramel ../bas
node scripts/diff-export-vs-caramel.mjs --caramel ../bas
node scripts/diff-field-constraints.mjs
node scripts/check-shared-i18n.mjs
```

Les scénarios de réédition attendent les sondes générées par les scripts Caramel correspondants ; voir les rapports par activité. Les journaux finaux, le journal initial Caramel, le quiz illustré, ses documents et sa planche de relecture sont dans bas : `tests/sonde-parcours/audit-activites-2026-09-11/non-regression-2026-09-12/`, avec SHA-256.
