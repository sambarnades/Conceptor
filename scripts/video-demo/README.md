# Vidéo de présentation de Caramel 7

Des outils pour tourner la démonstration dans le vrai Caramel, y poser nos voix au
prompteur, régler le montage et produire les versions finales (commentée et en musique).

Prérequis : Node, `ffmpeg`, et Playwright déjà installé pour les tests
(`tests/roundtrip/node_modules`). Tout se lance depuis la racine du dépôt.

## Dans l'ordre

1. **Tourner** la vidéo muette (6 min environ), en rejouant les réponses de l'IA
   gardées dans `tests/fixtures/video-demo/reponses-ia.json` : aucun appel au modèle.
   ```
   node scripts/video-demo/tourner.mjs
   ```
2. **Relever les gestes** pour la caméra de l'habillage (5 min environ, sans caméra) :
   ```
   node scripts/video-demo/tourner.mjs --journal
   ```
3. **Enregistrer les voix** dans le studio (vidéo, prompteur, micro), qui s'ouvre dans
   le navigateur :
   ```
   node scripts/video-demo/studio.mjs
   ```
   - `Espace` enregistre à partir du bloc choisi, `B` refait un bloc seul, `E` réécoute,
     `F` met le prompteur en plein écran.
   - **✎ Texte** (dans le prompteur) réécrit ce qu'on lit sur un bloc ; la vidéo ne
     change pas, le prompteur répartit le nouveau texte sur la durée du bloc.
   - **Table de montage** : les blocs dont la voix est coupée y sont signalés ; une
     *rallonge* fige l'image en fin de bloc pour laisser de la place, puis on
     réenregistre le bloc. On y **retouche aussi une prise** sans la refaire : couper
     un bruit au début ou à la fin (poignées), régler le volume, avancer ou retarder
     la voix. La prise d'origine reste intacte ; « Rétablir » revient en arrière.
   - **Aperçu rapide** (1 min) pose les voix sur l'image ; **Générer la vidéo** (6 min)
     enchaîne montage, habillage et copie dans `~/Desktop/Caramel 7 - vidéos/`, avec le
     pourcentage et le temps restant. Fermer le dialogue n'arrête pas la génération.
4. **La version en musique**, sans voix :
   ```
   node scripts/video-demo/habillage.mjs --version=musique
   ```

## Ce qui reste sur l'ordinateur

Tout ce qui est produit va dans `tests/.video-demo/`, exclu de git : les prises de voix,
les vidéos, les images de travail, les réglages du montage (`montage.json` : rallonges,
retouches des prises, textes réécrits). Ce dossier commence par un point :
le Finder le masque (`Cmd + Maj + .` pour l'afficher).

## Les fichiers

| Fichier | Rôle |
|---|---|
| `scenario.mjs` | Le texte de la voix off, les gestes filmés, les phrases clés |
| `tourner.mjs` | Tournage, enregistrement des réponses de l'IA (`--enregistrer-ia`), montage des voix (`--mixer`) |
| `plateau.mjs` | Curseur, cartons et gestes injectés dans la page filmée |
| `studio.mjs`, `studio.html` | Le studio de voix off (serveur local, 127.0.0.1 seulement) |
| `table.html`, `montage.mjs` | La table de montage : rallonges, retouches des prises |
| `travail.js` | Le suivi d'une génération (pourcentage, étapes), commun au studio et à la table |
| `habillage.mjs`, `habillage.html` | Caméra, cartons animés, phrases clés, rendu final |
| `musique.mjs` | La musique, composée par le script (aucun droit à régler) |

Retourner avec de nouvelles réponses de l'IA (appelle le vrai modèle) :
`node scripts/video-demo/tourner.mjs --enregistrer-ia`.
