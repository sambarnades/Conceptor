# Retours utilisateurs — 22 septembre 2026

## État

- [x] Production identifiée : la page racine annonce Caramel 6.3.4 ; `/bas/` annonce 7.0.0. Le dépôt local est sur `emmanuel`.
- [x] Texte à trous : les deux recettes locales (manuel et automatique) reconnaissent les réponses et atteignent 2/2.
- [ ] Texte à trous du premier témoignage : origine et fichier exact inconnus ; absence de réponse dans les données non démontrée.
- [x] Vidéo publique signalée : défaut reproduit dans Firefox installé, y compris sur Sucrerie en production.
- [x] Choix de source et embarquement corrigés localement pour les vidéos PeerTube proposant un téléchargement progressif.
- [x] Copie H5P autonome réparée, rouverte et vérifiée dans Firefox et Chromium ; résumé de cinq groupes accessible.
- [ ] Import de cette copie dans Éléa et réexport natif.
- [ ] Publication du correctif et remplacement du dépôt public par son auteur.

## Texte à trous : distinguer lecteur et éditeur

### Question de démonstration sur Oslo

Le titre « Fill in » et la phrase « Oslo is the capital of *Norway*. » sont
les valeurs par défaut du lecteur `H5P.Blanks` (versions 1.12 et 1.14).
Sa fusion profonde jQuery conserve même la question de démonstration quand
`questions: []` est fourni. Des paramètres absents ou incomplets peuvent donc
afficher cet exercice sans que l'auteur l'ait demandé.

Le processeur local refusait déjà une liste absente ou vide. Le contrôle final
`validate-blanks.js`, appelé par `createH5PBlob`, couvre désormais aussi les
contenus natifs imbriqués qui ne repassent pas par ce processeur : il refuse
les phrases/réponses absentes avant l'export, avec le chemin du champ concerné.
Il ne supprime ni n'invente de questions, et autorise une véritable question
sur Oslo. Un paquet déjà diffusé doit être complété puis réexporté.

La provenance exacte du quiz de la capture (version et paramètres reçus) reste
inconnue ; l'origine de la démonstration est identifiée dans le lecteur et
reproduite indépendamment. Banc : `node tests/run_quiz_blanks_guard.mjs`.
Résultat : démonstration reproduite avec paramètres absents et tableau vide,
export incomplet refusé, quiz valide exporté puis rouvert et corrigé **1/1**.
Non-régression : `node tests/run_browser_suite.mjs --suite=h5p-prefetch,edit-export-flow`
→ **3 361 PASS, 0 FAIL**.

La capture montre le lecteur élève d'un Quiz mixte. Un champ vide à la place du mot
est attendu dans H5P.Blanks : l'élève doit saisir la réponse. Les réponses attendues
doivent rester dans `questions`, sous la forme `*mot*`, visibles dans l'éditeur.
Glisser les mots est une autre activité : elle fournit des étiquettes à déplacer.

`node tests/run_native_blanks_play.mjs` réussit les deux recettes : indice,
variantes, vérification manuelle et automatique, score 2/2. Ces tests ne prouvent
pas que le fichier inconnu du témoignage est correct. Pour fermer ce point,
récupérer son H5P (ou son JSON de génération) et examiner les réponses dans
`content/content.json`. Ne pas modifier le lecteur pour afficher les solutions
dans les champs avant que l'élève ne réponde.

Le besoin de renommer n'est pas reproduit avec la vidéo signalée : son `h5p.json`
contient bien son titre. Il reste à préciser le fichier et le contexte du premier
témoignage avant de conclure sur le nom attribué par Éléa à son activité.

## Vidéo : cause et correction

Source du signalement :
<https://sucrerie.forge.apps.education.fr/?id=KnF0FonfLFUmCXElt36qOriR>.
Lecture publique seule, aucune écriture sur la publication.

Le H5P contient quatre interactions et cinq groupes d'affirmations dans
`interactiveVideo.summary.task.params.summaries`, avec `displayAt: 3`.
La bibliothèque est InteractiveVideo 1.28 ; le résumé n'a pas été perdu.

La source `static/streaming-playlists/hls/...-fragmented.mp4` annonce une durée
de 225.094833 s dans Chromium, mais **Infinity** dans Firefox. Sur Sucrerie,
Firefox annonce « Durée totale : Infinity Heures, NaN Minutes, NaN Secondes ».
Les positions sur la timeline et l'apparition du résumé final sont donc faussées.

L'API PeerTube fournit aussi un `files[].fileDownloadUrl` progressif : celui-ci
annonce **225 s** dans Firefox. Mais le serveur ignore `Range` sur ce téléchargement :
Chromium expose une plage navigable `[0, 0]`. Changer seulement l'URL ne suffit pas.
Attention : `files[].fileUrl`, pourtant également
annoncé par l'API, renvoie HTTP 200 **text/html** sur cette vidéo. Un simple test
du statut HTTP ne suffit donc pas ; revenir au fichier statique serait incorrect.

Dans `js/services/video-transcript.js`, conserver l'URL de téléchargement
progressive comme `playbackUrl`, et la préférer pour la lecture (vidéo uniquement,
résolution maximale de 720p lorsque disponible). Ne pas reconstruire d'URL :
utiliser celle fournie par l'instance, y compris en fédération. Les sources et
l'ordre de sélection pour Albert restent inchangés. La détection marque cette
source `embed: true`. `InteractiveVideo.js` télécharge ensuite le MP4 et l'enregistre
dans le registre des médias existant, pour l'inclure dans le H5P. La vidéo devient
locale au lecteur : durée finie et plage navigable complète dans les deux navigateurs.

Le téléchargement est limité à 60 secondes et **80 Mio** (plafond vidéo existant),
avec comptage des octets reçus, contrôle de la signature MP4 et rejet explicite
des réponses HTTP en erreur ou HTML. L'archive est plus lourde (environ 16 Mio pour
la copie signalée). Une vidéo trop volumineuse ou trop lente à télécharger bloque
l'export plutôt que de produire silencieusement un paquet défectueux.

Limite explicite : si l'API ne propose aucun téléchargement progressif, le repli
historique HLS reste en place. Le correctif ne garantit donc pas toutes les
instances HLS-only. Les anciens H5P conservent leur ancienne URL jusqu'à une
modification de la source ou une régénération ; aucune réparation automatique
de publications existantes n'est faite.

## Preuves et copie réparable

- `node tests/run_browser_suite.mjs --suite=editor-iv` : **120 PASS, 0 FAIL**.
  Régression couverte : téléchargement progressif distinct du fichier statique,
  plafond 720p, exclusion audio, sélection Albert conservée, repli HLS existant,
  média enregistré pour l'export, source éditable intacte, refus HTML/404/surdimensionné.
- `node tests/run_native_video_native_play.mjs` : recettes affiche et bouton
  réussies, avec résumé, changement de qualité, sous-titres et soumission.
- Firefox installé, recette réelle : ouverture de la copie réparée dans le
  lecteur H5P local, durée 3:45, quatre repères de questions et repère final,
  clic sur le repère à 3:42, bouton « Ouvrir le résumé », cinq groupes affichés
  (« Progression 0 sur 5 »). La lecture atteint 3:45 normalement.
- Le Firefox automatisé n'a pas abouti au lancement ; la preuve Firefox est une
  manipulation du navigateur installé, pas un succès Playwright.
- Chromium, copie finale autonome : durée 225 s, plage navigable `[0, 225]`, saut
  au repère final et affirmation du résumé visible. Capture :
  `tests/sonde-parcours/feedbacks-2026-09-22/chromium-recapitulatif.png`.
- Archive réparée :
  `tests/sonde-parcours/feedbacks-2026-09-22/video-recapitulatif-corrige.h5p`.
  Réouverture ZIP et comparaison : la première source devient
  `videos/video-progressive.mp4`, et ce média est ajouté sous `content/videos/`.
  Questions, réponses, titre, résumé et autres fichiers préexistants restent identiques.

Banc de non-régression complet, sans appel distant (API PeerTube simulée, vrai
MP4 fourni comme fichier local) :
`node tests/run_peertube_embedded_video.mjs /chemin/video-progressive.mp4`.
Il traverse détection, processeur, empaquetage, réouverture et navigation jusqu'au
résumé. **Exécuté avec succès le 22 septembre** sur le MP4 de la copie réparée.
Le média peut être extrait de la copie réparée avec
`unzip -p tests/sonde-parcours/feedbacks-2026-09-22/video-recapitulatif-corrige.h5p content/videos/video-progressive.mp4 > /tmp/video-progressive.mp4`.

La copie peut être importée dans Éléa pour terminer la recette. Elle n'a pas été
déposée sur Sucrerie ni importée sur Éléa pendant ce contrôle. Aucun commit/push.
