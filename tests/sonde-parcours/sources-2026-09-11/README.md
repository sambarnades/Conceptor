# Supports des activités dans le parcours — essais du 11 septembre 2026

Six générations **réelles**, lancées strictement en série sur les endpoints `bas`.
Modèle de texte configuré : `mistral-small-4-119b` ; les six réponses enregistrées
annoncent ce modèle, sans fallback. Vision : service individuel existant.
Aucun déploiement, aucun dépôt Sucrerie, aucune ingestion RAG.

| Essai | Support | Résultat |
|---|---|---|
| `image-fr` | Image interactive, La Nuit étoilée | Génération, scénario, MBZ, lecteur |
| `zone-fr` | Trouver la zone : le cyprès | Génération, scénario, MBZ, lecteur |
| `zones-fr` | Trouver les zones : les astres | Génération, scénario, MBZ, lecteur |
| `image-br` | Image interactive en breton | Génération, scénario, MBZ, lecteur |
| `video-fr` | Vidéo HACCP, lien YouTube et transcription manuelle | Génération, scénario, MBZ ; quatre interactions |
| `image-quatre-fr` | Carte de huit minutes, quatre zones demandées | Génération, scénario, MBZ, lecteur |

Chaque dossier contient `scenario.json`, `trace.json`, `parcours.mbz` et une
capture. L’image vient du fixture documentaire existant
`tests/fixtures/export-images/van-gogh-nuit-etoilee.jpg` (330 × 261 pixels).
Le texte de la vidéo vient du fixture existant
`tests/fixtures/interactive-video-transcript.json` ; le chemin manuel a été
choisi explicitement. Le test automatique de transcription est séparé, dans
`tests/run_parcours_sources.mjs`, avec le réseau remplacé localement.

Les captures initiales isolent les appels externes : YouTube y était bloqué.
`video-fr/lecteur-reseau.png` et `lecteur.json` proviennent d’une seconde relecture
sans IA avec les ressources YouTube autorisées : lecteur de 287 secondes,
lecture démarrée et quatre interactions chargées, sans erreur JavaScript.

Les archives valides et la lecture locale ne remplacent pas la relecture
pédagogique : contrôler les points, les zones correctes et les formulations.
Le breton doit être relu par des locuteurs. Emmanuel doit encore restaurer les
parcours retenus sur les instances Éléa/Magistère/Moodle ciblées.

Validation automatique finale : **11/11 bancs, 816 contrôles**, dont 43 pour
les supports. Barre latérale individuelle : 56 contrôles ; processeurs hotspot :
127 contrôles et 2 essais omis faute de fixtures de plateforme. Prompt vidéo
individuel et parité des 3 191 clés dans les douze langues vérifiés.

## Rejouer manuellement

Depuis la racine de `bas` :

```sh
node tests/sonde-parcours/sources-2026-09-11/run.mjs
node tests/sonde-parcours/sources-2026-09-11/run.mjs quatre
node tests/sonde-parcours/sources-2026-09-11/verifier-video.mjs
```

Les deux premières commandes consomment des appels réels et remplacent leurs
artefacts respectifs. La troisième relit seulement la vidéo déjà générée.
Ces sondes ne font pas partie de la suite automatique.
