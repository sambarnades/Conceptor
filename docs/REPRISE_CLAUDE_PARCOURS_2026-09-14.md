# Reprise Caramel / Sucrerie — état consolidé au 14 septembre 2026

## Situation actuelle

**Le socle est développé, mais la fonctionnalité n'est pas encore livrée intégralement aux comptes de production.** Il reste du développement (persistance du compte, partage privé, intégration et assistance IA) et une recette serveur. Ne pas réduire la suite à une migration SQL.

**Dernier retour utilisateur : les workflows C et F complets ont été réimportés.** Cette opération est déclarée par l'utilisateur ; leur activation et leur exécution après réimport n'ont pas encore été contrôlées. Ne pas lui demander de les réimporter une nouvelle fois sans raison.

Ce document est le tableau de bord courant. Les deux SUIVI et les rapports datés gardent un historique avec d'anciennes cases ouvertes et des mentions « non poussé » désormais dépassées. Ne pas recommencer les lots terminés sur cette seule base. Une case se ferme avec une preuve, sa portée et un commit ; un test simulé ne vaut pas un test serveur.

## Réalisé

- [x] Audit des 27 H5P côté code et recette locale : éditeurs, prompts, sauvegardes/réouvertures, exports et reports Sucrerie. 25/27 sans réserve de lecteur ; deux correctifs natifs encore à qualifier sur plateforme. Voir les tableaux des SUIVI et `CORRECTIFS_LECTEURS_H5P_2026-09-12.md`.
- [x] Prompts des 12 langues enrichis, livre généré avec au moins trois chapitres ; parcours Caramel et circuit IA externe du plan/des activités développés. Preuves : `PROMPTS_H5P_2026-09-12.md`, `PARCOURS_IA_EXTERNE_2026-09-13.md`.
- [x] Modèle commun collection/MBZ, lecteurs, brouillon avec étapes, consignes et références ordonnées ; édition, aperçu et sauvegarde locale.
- [x] Bouton de bibliothèque et menus contextuels raccordés ; barre responsive vérifiée de 320 à 1440 px. Preuves Sucrerie : `tests/collection-toolbar/preuves/`.
- [x] Persistance distante BAS testée réellement : enregistrer, rouvrir, conflit entre deux onglets, droits et expiration. Fixtures nettoyées. Preuves Sucrerie : `tests/collection-draft-server/preuves/navigateur-reel-2026-09-14.json` et `http-reel-2026-09-14.json`.
- [x] Brouillon exportable en MBZ, DOCX, ODT, PDF et ZIP ; textes conservés et références indisponibles signalées/bloquantes selon l'opération.
- [x] Publication depuis le brouillon raccordée au formulaire et au résumé IA ; manifeste v3, compatibilité v1/v2. **102 tests ciblés réussis** et vrai bouton testé avec services interceptés : `tests/collection-manifest-v3/preuves/publication-ui.json`. Aucun dépôt réel dans cet essai.
- [x] C/F complets générés depuis les exports actuels : 31/18 nœuds, un code modifié par workflow, autres propriétés et connexions conservées. Preuve : `tests/collection-manifest-v3/preuves/livraison-complete.json`.
- [x] Réimport C/F effectué par l'utilisateur le 14 septembre ; activation/exécution restent à vérifier.
- [x] Éléa test, cours **796 « Nouveau bac »** : restauration textuelle puis mixte, deux H5P DialogCards et un Test Moodle joué à 1/1, modification native du second H5P, enregistrement et réexport comparé. Neuf éléments ordonnés, médias conservés, dix bibliothèques ajoutées au H5P édité. Preuve : `tests/collection-draft-course/preuves/elea-mixte-2026-09-14.json`. Ce test ne couvre pas tous les types H5P/Moodle.

## À terminer — ordre conseillé

### 1. Qualifier les workflows réimportés

- [ ] Vérifier C/F actifs sur les routes attendues et la reconnaissance de leurs connexions ; lire les erreurs éventuelles avant toute modification.
- [ ] Exercer le contrat v3 de création puis de modification via les vrais services dans une recette isolée ; relire le contenu et vérifier ordre, textes, thème et références. Ne pas créer une publication visible dans le catalogue pour servir de test sans accord explicite.
- [ ] Vérifier qu'une collection ancienne v1/v2 et les dépôts d'activités simples restent utilisables après le réimport.
- [ ] Tester le résumé IA réel avec la narration complète et son application au formulaire, puis les erreurs/annulation. Le test actuel intercepte le service IA.

**C/F ne règlent que l'acceptation des collections v3. Aucun SQL nécessaire pour ce lot : `content_format` reste `collection`. Ils ne rendent pas les brouillons privés persistants pour tous les comptes.**

### 2. Finir la sauvegarde et le partage du compte habituel

- [ ] Raccorder le repository distant à l'authentification habituelle de la bibliothèque, au bon propriétaire/dossier, sans configuration BAS manuelle ni sauvegarde locale présentée comme distante.
- [ ] Préparer le raccordement depuis le workflow **G existant**, en conservant ses routes et fonctions ; livrer un JSON complet si un réimport est nécessaire.
- [ ] Préparer et éprouver dans `sucrerie_bas` l'installation nécessaire à la persistance finale, avec droits, contraintes, conflits et retour arrière. La table `collection_draft` existe seulement dans BAS à ce jour.
- [ ] Faire approuver le lot SQL de production concret avant son application : aucun accord de modification de `sucrerie_bas` ne vaut accord de migration de `sucrerie`.
- [ ] Tester sauvegarde/reprise dans une session neuve et sur un autre navigateur, édition concurrente, suppression/déplacement de dossier et référence manquante.
- [ ] Conserver introduction, étapes et consignes dans le partage privé ; éprouver lecture, droits, modification et exports, sans changer automatiquement la visibilité des activités référencées.

### 3. Achever l'expérience commune

- [ ] Terminer/vérifier le chemin dépôt direct MBZ → plan et pont Caramel → même plan, sans carte intermédiaire inutile ni publications enfants automatiques. Conserver le MBZ original complet.
- [ ] Vérifier aperçu/édition au même endroit, retour à la position précédente et commandes contextuelles Ajouter une activité/consigne/étape. Le brouillon a déjà des commandes ; compléter les chemins manquants plutôt que créer un second éditeur.
- [ ] Développer/terminer « Aider à structurer » une collection : proposition relue avant application, annulation et enregistrement distincts. Réutiliser le circuit IA externe Caramel où pertinent, sans surcharger l'interface.
- [ ] Traiter le complément prévu « Ajouter des questions » dans l'éditeur partagé : proposition modifiable, identifiants/médias préservés et insertion annulable. Ne pas le confondre avec le résumé de publication.
- [ ] Préserver les anciennes collections, thèmes, attributions et droits. Deux MBZ rangés ensemble ne doivent pas être fusionnés implicitement.

### 4. Recette finale et livraison

- [ ] Tester le parcours complet Caramel → Sucrerie → réédition → téléchargement, ainsi que le dépôt direct ; contrôler aussi le type `parcours`, la taille des fichiers et le breton côté service. Le manifeste v3 `collection` et un dépôt MBZ `parcours` sont deux contrats distincts.
- [ ] Restaurer le MBZ réédité de ce circuit complet dans Éléa ; vérifier les activités, médias, banques de questions et disponibilités. Une restauration dans un cours vide permettra de vérifier les titres de sections sans l'effet de fusion par numéro observé dans 796.
- [ ] Vérifier le choix des cinq formats sur téléphone, clavier/focus, erreurs et retours au plan ; relire les documents complexes, y compris la voie PDF distante.
- [ ] Qualifier les types MoodleTest supplémentaires et H5P historiques HVP annoncés dans les SUIVI : ne pas déduire leur prise en charge du seul Test QCM de la sonde.
- [ ] Faire qualifier les deux correctifs de bibliothèques H5P (Mots mêlés / Classer les paragraphes) par la maintenance Éléa ; les droits du cours ne permettent pas de mettre à jour globalement les bibliothèques. Ne pas annoncer une compatibilité Magistère/Moodle universelle sans recette correspondante.
- [ ] Rejouer les tests pertinents après corrections, vérifier les miroirs et les 12 langues, compléter changelog/tutoriel/README et prévoir la relecture bretonne.
- [ ] Préparer la livraison front avec les bons endpoints et l'accès au compte habituel, lever les restrictions de recette seulement après validation ; convenir de la mise en production, puis vérifier le parcours sur la version servie.

## Repères techniques et limites de production

Dépôts voisins `Caramel/bas` et `Caramel/sucrerie.forge.apps.education.fr`, branches **emmanuel**. Lire les deux `CLAUDE.md` et les skills utiles avant de coder. Caramel est la source des fichiers partagés ; liste exacte dans Sucrerie `scripts/lib/shared-files.mjs`.

Fichiers Sucrerie à lire en priorité :

- `assets/js/core/collection-draft.js`, `collection-draft-repository.js`, `collection-draft-binding.js` : modèle, stockage, configuration de recette partagée.
- `assets/js/ui/collection-draft-library.js`, `collection-draft-editor.js`, `my-activities.js` : bibliothèque et publication.
- `assets/js/core/collection-manifest-v3.js`, `collection-draft-publish.js`, `collection-publish.js` : manifeste, éligibilité et texte du résumé.
- `assets/js/core/collection-draft-course.js`, `collection-draft-document.js` et `assets/js/collection-export-bridge.js` : exports.
- `scripts/collection-v3/prepare-workflows.mjs` : injection C/F depuis les sources, jamais un déploiement.

Les exports de référence sont dans **Sucrerie `n8n-workflows/`**, ignoré par Git, pas dans l'ancien dossier voisin de sauvegardes. Livraison C/F réimportée : `n8n-workflows/livraison-workflows-complets-v3-2026-09-14/`. Demander un export actuel avant de remplacer un workflow ayant changé depuis ces sources. Ne jamais commiter les exports privés, identifiants, tokens, sauvegardes natives nominatives ou captures personnelles.

**Localhost peut utiliser la base de production.** Vérifier la destination effective de chaque écriture. RAG reste coupé. Aucun nouveau dépôt public ni changement SQL de production dans cette reprise documentaire. L'utilisateur effectue les réimports n8n et les connexions interactives ; ne pas interrompre sa saisie.

## Commandes de reprise, depuis Sucrerie

Ces commandes locales n'appellent pas les workflows réels ; elles ne valident pas leur activation.

```sh
node tests/collection-plan/run-ui.mjs
node tests/collection-manifest-v3/run-workflows.mjs
node tests/collection-manifest-v3/run-publication-ui.mjs
node tests/collection-draft-course/run-ui.mjs
node tests/collection-toolbar/run-ui.mjs
```

Ne pas relancer toutes les anciennes sondes coûteuses si aucun changement ne les affecte. Pour les tests distants BAS, lire d'abord `docs/RECETTE_N8N_BROUILLONS_2026-09-14.md` et les scripts concernés ; ne pas réutiliser des identifiants expirés ni chercher des secrets dans l'historique.

## Git et reprise par Claude

Derniers commits sauvegardés sur `origin/emmanuel` avant ce document : Sucrerie **7d0751c**, bas **979cd813**. Publication développée : Sucrerie **f3503ab** ; report bas **9b90f6a6**. Les workflows complets restent locaux et ignorés ; le générateur et les preuves sont versionnés. Aucun push sur `main` par l'agent.

Le checkout bas contient aussi des modifications d'interface non commitées : lire `git status` et les diffs avant toute édition ; ne pas les effacer ou les inclure dans un commit documentaire. Sucrerie contient trois captures non suivies de la bibliothèque réelle : ne pas les publier.

Message de reprise prêt à copier :

> Reprends le chantier dans les deux dépôts sur emmanuel. Lis d'abord `docs/REPRISE_CLAUDE_PARCOURS_2026-09-14.md`, les deux SUIVI et CLAUDE.md. Les workflows C/F complets ont été réimportés par l'utilisateur ; commence par qualifier leur exécution, puis termine la persistance du compte et le partage privé. Poursuis l'intégration et les recettes de la checklist. Préserve la production, garde RAG coupé, utilise BAS pour les écritures de test. Livre les workflows complets à l'utilisateur si nécessaire. Mets à jour chaque case avec preuve, limite et commit ; ne recommence pas les lots déjà validés.
