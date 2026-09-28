# Publication des parcours enrichis — 14 septembre 2026

## Lot disponible sur emmanuel

- Le bouton de publication de la bibliotheque charge le brouillon sauvegarde (local, ou BAS explicitement configure), puis prepare un manifeste v3. Aucune publication automatique.
- Introduction, consignes, transitions, conclusion et references repetees sont conservees. Les activites non publiques sont listees avant confirmation ; le brouillon original reste intact.
- Le texte transmis au resume IA contient cette narration dans son ordre pedagogique.
- Les collections sans brouillon conservent le flux v2 existant.
- Une erreur de lecture est affichee, sans publier une autre version par repli silencieux.

## Preuves

- Livraison complete regeneree depuis C/F : comparaison integrale et syntaxe du code valides, preuve `tests/collection-manifest-v3/preuves/livraison-complete.json`.

- 102 tests cibles : `node tests/collection-plan/run-ui.mjs`.
- Vrai bouton bibliotheque -> moderation IA simulee -> formulaire express -> payload v3 : `node tests/collection-manifest-v3/run-publication-ui.mjs`. Aucun appel distant execute, aucun depot.
- Validateurs des exports C/F actuels : `node tests/collection-manifest-v3/run-workflows.mjs`. Un noeud modifie par workflow, connexions identiques, v1/v2/v3 valides.
- Reexport Elea final compare : neuf elements dans l'ordre, deux H5P, consigne modifiee conservee dans le second seulement, medias identiques, question du Test conservee. Dix bibliotheques ajoutees par Elea au H5P edite. Preuve : `tests/collection-draft-course/preuves/elea-mixte-2026-09-14.json`.

## Livraison n8n — réimport confirmé par l’utilisateur

Les deux JSON complets sont disponibles dans `n8n-workflows/livraison-workflows-complets-v3-2026-09-14/` :

- `C. Sucrerie Depot (PROD).json`
- `F. Sucrerie Auteur (PROD).json`

Pour chacun, ouvrir le workflow existant correspondant dans n8n, remplacer tous ses noeuds par le contenu du JSON complet (copier le fichier entier puis coller dans le canevas vide), puis enregistrer et publier. Ne pas coller a cote des anciens noeuds et ne pas activer un second workflow avec le meme webhook. Verifier que les identifiants de connexion sont toujours reconnus avant publication.

Les sources originales sont conservees dans `n8n-workflows/`. Si le workflow en ligne a ete modifie depuis cet export, recuperer son nouvel export avant remplacement pour conserver ces changements. Retour arriere : restaurer le contenu de l'export original correspondant.

Les fichiers livres sont inactifs par precaution. Un seul code de noeud change dans chacun ; les autres proprietes des noeuds, connexions, parametres et references d'identifiants sont identiques aux sources. Les donnees epinglees et l'etat temporaire d'execution ne sont pas inclus. L’agent n’a effectué aucun import distant ; l’utilisateur a confirmé le réimport des deux fichiers.

Ces JSON remplacent la livraison precedente en blocs JavaScript : aucune modification manuelle de code n'est necessaire.

**Aucun SQL pour ce lot de publication** : `content_format` reste `collection`; v3 est une version du JSON stocke. Les anciens contenus v1/v2 gardent leur validation d'origine. Aucune ingestion RAG ajoutee.

## Reste ouvert

- [x] Réimport des deux workflows complets confirmé par l’utilisateur le 14 septembre. Activation et exécution après réimport non vérifiées.
- [ ] Recette serveur reelle de la publication v3 apres installation (les validations actuelles sont locales et les appels UI interceptes).
- [ ] Persistance des brouillons pour les comptes habituels : le workflow et la table installes a ce jour sont ceux de BAS ; aucune table de brouillon de production creee.
- [ ] Partage prive du parcours enrichi et raccordement au compte habituel, distincts de la publication publique preparee ici.
- [ ] Deploiement du front : aucun push sur main ni mise en production dans ce lot.

Commits du raccordement : Sucrerie `f3503ab` ; report bas `9b90f6a6`.

État consolidé et ordre de reprise : [checklist Claude](REPRISE_CLAUDE_PARCOURS_2026-09-14.md).
