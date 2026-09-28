# Export du brouillon parcours — 14 septembre 2026

- [x] Commande Télécharger le parcours Moodle dans l’éditeur ouvert depuis la bibliothèque.
- [x] Export de l’état en cours, sans modifier la collection ni publier : titre, étapes, consignes, introduction, conclusion et ordre des références.
- [x] Textes sous forme de modules Moodle label (achèvement désactivé), selon le contrat déjà utilisé par Caramel. Assembleur partagé inchangé.
- [x] Étapes homonymes distinctes, références répétées conservées ; références non exportables bloquent le téléchargement du brouillon au lieu d’être omises silencieusement.
- [x] Cours complets imbriqués toujours refusés pour préserver leurs restrictions et banques.
- [x] 87 tests ciblés réussis, dont quatre nouveaux : plan, exclusions, texte échappé, assemblage XML.
- [x] Clic réel sur Télécharger : archive .mbz de 59 fichiers, réouverte avec les quatre textes attendus. Sonde : `tests/collection-draft-course/preuves/parcours-brouillon.mbz`.
- [ ] Import de cette nouvelle sonde dans Éléa/Magistère : non réalisé dans ce lot. Ne pas annoncer la compatibilité plateforme comme vérifiée par ce seul contrôle local.
- [ ] Partage du plan enrichi et export documentaire/ZIP alignés : encore ouverts.
- [ ] Connexion BAS utilisateur intégrée et activation en production : encore ouvertes.

La nouvelle commande exporte explicitement le brouillon. Le bouton Télécharger de la barre de collection conserve son contrat précédent et les activités sources ne sont pas réécrites. L’export ne sauvegarde pas le brouillon ; le bouton Enregistrer reste distinct.

Tests : `node tests/collection-plan/run-ui.mjs` et `node tests/collection-draft-course/run-ui.mjs` (serveur local 8200). Le banc de téléchargement bloque tous les services externes. La sonde de clic contient uniquement des textes natifs ; les répétitions d’activités et les XML d’assemblage sont vérifiés par la suite dédiée.
