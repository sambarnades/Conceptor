# Essais du calibrage — 11 septembre 2026

Backend `bas`, modèle par défaut de Caramel, appels ILaaS réels **en série**,
avec autorisation d’Emmanuel. Le script utilise le véritable bouton de composition,
le service submit/poll et le contrôle du plan. Il ne génère pas les activités.

| Campagne | Plans conformes | Appels IA | Observation |
| --- | ---: | ---: | --- |
| Dossiers à la racine | 7 / 9 | 12 | Deux plans courts refusés : trop de cartes ou identifiant accentué. Le rituel a nécessité une correction après un repli automatique du backend. |
| `validation/` | 9 / 9 | 10 | Trois répétitions du même sujet court ; ampleurs moyenne et longue, rituel, classe inversée anglaise, formation Magistère, révision bretonne. |
| `usages/` | 5 / 5 | 5 | Capacités de la frise, du graphique, des cartes et des supports précisées ; plus de vidéo non fournie en classe inversée. |
| `usages-final/` | 5 / 5 | 5 | Dernier prompt : Page en lecture, Vrai/Faux à une affirmation, texte à trous au clavier. Aucun repli, aucune reprise, aucune erreur JavaScript. |

Les 19 dernières compositions respectent le contrat. Le dernier prompt a été
vérifié sur cinq compositions consécutives. Les captures montrent aussi les
textes réellement produits en anglais et en breton. Une relecture humaine reste
nécessaire pour le contenu pédagogique et l’idiomaticité du breton ; la conformité
au calibrage ne constitue pas une validation scientifique ou linguistique.

Chaque dossier conserve `trace.json` (cadrage, prompt envoyé, réponse brute,
scénario obtenu, résultat du contrôle) et `plan.png`. Les bilans sont dans
`bilan.json` à chaque niveau. Les scénarios sont contenus dans la propriété
`scenario` des traces ; les essais initiaux refusés ont une valeur `null`.

## Rejouer volontairement les appels réels

Depuis la racine de bas, avec Playwright installé dans `tests/roundtrip` :

```sh
node tests/sonde-parcours/calibrage-2026-09-11/run.mjs
node tests/sonde-parcours/calibrage-2026-09-11/run.mjs usages
```

Ces commandes remplacent les relevés de `validation/` et `usages-final/`.
Elles sont **hors CI**. Pour les contrôles sans appel réel :

```sh
node tests/run_parcours_calibrage.mjs
```

Les archives à restaurer sur une plateforme restent les essais de fabrication
réelle du [10 septembre](../essai-ux-2026-09-10/README.md).
