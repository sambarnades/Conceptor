# Bibliothèque et brouillon distant — 14 septembre 2026

- [x] Le bouton « Organiser en parcours » de la collection passe par `openLibraryCollectionDraft`.
- [x] Activation BAS en mémoire, limitée explicitement au couple propriétaire/dossier : aucune reprise de la session de production, aucune bascule globale des endpoints.
- [x] Sans configuration BAS explicite, comportement local existant conservé. Une erreur du serveur BAS ne provoque pas de sauvegarde locale silencieuse.
- [x] 83 contrôles ciblés réussis, dont trois nouveaux sur le périmètre propriétaire/dossier, localhost et la révocation.
- [x] Recette navigateur depuis la vraie page « Mes activités » : sélection du dossier dans l’arborescence, clic Organiser, sauvegarde, navigation et reprise, conflit entre deux onglets. Transport de brouillon n8n réel ; listes de bibliothèque fictives interceptées pour ne pas solliciter le compte de production.
- [x] Huit contrôles HTTP et nettoyage ciblé des fixtures BAS réussis.
- [ ] Connexion BAS complète pour une recette utilisateur sans injection de contexte : le raccordement actuel se configure explicitement en mémoire par `configureLibraryDraftBas`.
- [ ] Généralisation au compte de production, partage et exports du brouillon enrichi : non activés.

Aucun changement visuel supplémentaire : bouton et éditeur existants réutilisés. Le navigateur de l’utilisateur n’a pas été modifié. Le parcours distant ne s’active donc pas automatiquement dans son aperçu connecté à la production.

Preuves : `tests/collection-draft-server/preuves/bibliotheque-reelle-2026-09-14.json`, `http-bibliotheque-2026-09-14.json` et `tests/collection-plan/preuves/resultats.json`. Le banc local `node tests/collection-plan/run-ui.mjs` bloque le réseau externe. Les recettes réelles nécessitent une session BAS temporaire et un dossier de test ; jamais de token dans les fichiers ou URL.

Deux ajustements du banc ont été nécessaires : sélectionner le bouton de l’arborescence au lieu du double-clic et fixer la langue française ; bloquer les scripts distants au lieu de leur répondre avec du JSON. Les essais intermédiaires ont tous nettoyé leurs fixtures.

## Aperçu utilisateur : correction du chargement

Constat direct dans l’onglet utilisateur : la collection était bien sélectionnée, mais le bouton Organiser était absent. Le simple retour sur la même URL ne renouvelait pas le code chargé. Versionnement de `assets/js/main.js` dans index.html et de l’import du module bibliothèque ; navigation vers une URL actualisée. Bouton désormais visible et éditeur ouvert dans cet onglet. Sauvegarde du plan initial sur cet appareil, fermeture/réouverture et deux références d’activités conservées. Aucun texte pédagogique ajouté ni activité publiée.

Cette vérification concerne le stockage local de l’aperçu connecté à la production ; elle ne transforme pas cette session en session BAS. Les tests distants décrits plus haut restent ceux d’une session BAS fictive.
