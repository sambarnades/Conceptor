# Recalibration de la génération des quiz (2026-09-28)

> Point de départ : « la génération des quiz plante parfois, Mistral semble lent ».
> Mesures faites le 2026-09-28 au soir (17 h 50 – 19 h 10 UTC), sur le **bac à sable** : webhooks
> `-bas`, vrais prompts assemblés par les builders du dépôt, sorties passées dans le vrai pipeline
> (healer → processeur → `.h5p`). Environ 250 appels, **toujours séquentiels entre expériences**
> (le backend ILaaS est partagé). Architecture : `docs/guide-generation-par-lots.md`.
>
> **Limite à garder en tête** : un lundi soir, la charge est faible. Les débits mesurés sont des
> débits de soirée. Ce qui compte ici, ce sont les écarts relatifs et les modes de défaillance.

## 1. Ce qui fait vraiment « planter »

### 1.1 Le mur est un volume de jetons, et le débit est irrégulier

Un appel dure environ « 4 s + jetons produits / débit ». Le débit d'un même modèle varie du
simple au double ou au triple d'un appel à l'autre. ILaaS répartit chaque modèle sur plusieurs
serveurs hétérogènes : la forme même du champ `usage` change d'une réponse à l'autre.

| Modèle (même soirée) | Débit observé (jetons/s) |
|---|---|
| Mistral Small 4 | 120 → 290 |
| Gemma 4 | 87 → 236 |
| Qwen 3.6 | 156 → 276 |
| Mistral Medium | 68 → 99 |

Poids d'un item, mesuré sur les sorties : **QCM 650-800 jetons**, quiz mixte ~500, Vrai/Faux ~230
(≈ 4 caractères par jeton pour Mistral : aucun raisonnement caché).

### 1.2 Le mode Rapide produit une sortie non bornée

La consigne « 5 questions minimum » a fait produire **5 à 9 questions** d'un seul tenant (jusqu'à
4 600 jetons, 28 s à 160 jetons/s). Le même appel franchit le mur dès que le débit tombe sous
~80 jetons/s. Et le mode Rapide ne passait **jamais** par les lots.

### 1.3 La cascade de secours du Worker s'effondre

Chaîne du Worker pour Mistral : Qwen 3.6 puis Gemma 4. Sonde de sortie brute (`caramel/ia/sonde`,
mode `essai`, sans cascade) :

- **Mistral Small 4** : 13/13 lots en JSON strictement valide, aucun tronqué (à température 0,7).
  Ses échecs sont des incidents passagers côté ILaaS, pas des sorties invalides.
- **Qwen 3.6** : 2 quiz mixtes sur 4 en **JSON cassé** (`"to": 25",` : guillemet parasite après
  un nombre dans les feedbacks), irréparable par le healer. S'y ajoute, sur ses 9 quiz de la
  campagne mono-appel, un QCM dont une question est imbriquée dans une autre (« Corrigé ») :
  il ne se fabrique pas.
- **Gemma 4** : 6 secours sur 9 appels, dont un blocage de 50 s sans réponse et un refus
  explicite de la passerelle : « *Model 'gemma-4-31b' is temporarily unavailable* ».

Résultat : sur 87 appels de la campagne finale, **3 lots (3,4 %) sont revenus en erreur « échoué
après 3 tentatives avec différents modèles »**, en 15 à 65 s. En mono-appel, c'est l'échec que
voit l'enseignant.

## 2. Mesures

### 2.1 Mono-appel, mode Rapide actuel (36 appels, 3 sujets × 3 types × 4 modèles)

| Modèle | Secours | `.h5p` fabriqués | Médiane | Pire |
|---|---|---|---|---|
| **Mistral Small 4** | **0/9** | 9/9 | 19,5 s | 28,2 s |
| Gemma 4 | 6/9 | 9/9 | 17,6 s | 65,3 s |
| Qwen 3.6 | 2/9 | **8/9** | 15,1 s | 29,3 s |
| Mistral Medium | 0/9 | 9/9 | 39,2 s | 45,2 s |

→ **Mistral Small 4 reste le meilleur modèle par défaut** : le plus rapide parmi les fiables.
Changer de modèle ne règle rien, la variabilité touche tous les modèles.

### 2.2 Concurrence (même prompt de lot, k flux simultanés, Mistral Small 4)

| k | Durée max | Débit par flux | Débit cumulé | Secours |
|---|---|---|---|---|
| 1 | 11-13 s | ~165 | ~165 | 0 |
| 2 | 11-12 s | ~169 | ~360 | 0 |
| 3 | 12 s | ~150 | ~470 | 0 |
| 4 | 14-20 s | ~140 | ~480 | 1/8 |

En 2026-06, 3 lots de 4 simultanés partaient en cascade sur un modèle bien plus lent. Ce n'est
plus le cas.

### 2.3 Plan + lots, 10 questions (Mistral Small 4)

| Réglage | QCM (total) | Quiz mixte (total) | Appel le plus long |
|---|---|---|---|
| lots de 4, séquentiel (ancien) | 40-57 s | 30-40 s | 27 s (secours Qwen) |
| lots de 3, séquentiel | 66-94 s | 33-38 s | 61 s (secours jusqu'à Gemma) |
| lots de 4, deux de front | 21-26 s | 19-20 s | 19 s |
| **lots de 3, deux de front** | **25-27 s** | **20-23 s** | **12,5 s** |

### 2.4 Mode Rapide : mono « 5 minimum » vs « 5 exactement » vs plan + lots

| Variante (Mistral Small 4) | QCM | Quiz mixte |
|---|---|---|
| mono « 5 minimum » (actuel) | 19-24 s | 19-23 s (7-8 questions) |
| mono « 5 exactement » | 19-21 s | 10-17 s |
| **plan + 2 lots de front** | **15-17 s** | **11-15 s** |

Substitut d'un Mistral Small ralenti (Mistral Medium, débit ÷ 2) : mono 38-42 s (le mur est
proche), plan + lots 29-31 s avec un appel le plus long à 22 s ; 10 QCM en 45-50 s.

### 2.5 Le quiz mixte perd sa variété par lots

Chaque lot choisit ses types sans voir les autres. Sur 5 questions : **2-3 types** par lots,
contre **5-7** en un appel. À 10 questions, 5-6 types, surtout des QCM. D'où la consigne
`batch_outline_hint_quiz_types` : le plan attribue le type de chaque question. Avec elle,
**5 types sur 5 questions** à chaque essai, 6-7 sur 10.

## 3. Décisions (code, 2026-09-28)

| Où | Avant | Après |
|---|---|---|
| `BATCH_CONFIG.batchSize` | 4 | **3** (~2 000 jetons par lot de QCM) |
| `BATCH_CONFIG.concurrency` | 1 | **2** |
| lot en échec | relancé une fois à l'identique | **redécoupé en moitiés** (`fillWithSplit`), budget `maxFailures: 4` partagé |
| QCM, quiz mixte | seuil 5 (mode Rapide = mono « 5 min ») | **seuil 3, `defaultCount: 5`** : le mode Rapide passe par les lots |
| quiz mixte | — | **`planHint`** : le plan attribue les types |
| Vrai/Faux | seuil 5, lots de 4 | **seuil 8, lots de 8** (items légers) |

### Validation sur le vrai code (`generateInBatches`, polling de production)

19 générations sur 19 réussies, toutes fabriquées, 0 doublon. Les 3 effondrements de cascade ont
tous été rattrapés par le redécoupage.

| Demande | Total | Appel le plus long |
|---|---|---|
| QCM, mode Rapide (5) | 14-18 s (39 s avec un redécoupage) | 18 s |
| Quiz mixte, mode Rapide (5) | 15-17 s, 5 types sur 5 | 12 s |
| 10 QCM | 25-41 s | 15 s |
| 10 questions mixtes | 22-29 s, 6-7 types | 12 s |
| 20 QCM | 58-95 s | 65 s (une cascade en échec, rattrapée) |
| 12 Vrai/Faux | 17 s | 9 s |
| 10 QCM, Mistral Medium | 52-56 s | 25 s |

Tests : `tests/test-llm-batch.js` (40 assertions, dont redécoupage, budget, annulation, consigne
de plan, réglages des quiz) ; suite navigateur complète 14 415 / 0.

## 4. Hors du dépôt — recommandations n8n (non appliquées)

1. **Cascade du Worker** : la remplacer, pour Mistral, par Qwen 3.6 → **Mistral Medium**, et
   retirer Gemma 4 tant qu'ILaaS le déclare « temporarily unavailable ». Mistral Medium est lent
   (~85 jetons/s), mais 15/15 appels sans défaut, et un lot de 3 lui prend ~25 s.
2. **Réessayer le même modèle sur une erreur instantanée** (< 5 s, « temporarily unavailable »),
   après ~2 s, avant de basculer. Aujourd'hui, un hoquet de 1 s de Mistral envoie le lot chez Qwen.
3. **Température explicite, ~0,5-0,7** : le Worker n'en envoie aucune, c'est donc le défaut
   du serveur qui s'applique. Or, sur les 13 mêmes prompts de lots (Mistral Small 4, sonde sans
   cascade), 0,7 donne **0 JSON invalide**, 1,0 en donne **4** (accolades manquantes, antislash
   LaTeX simple, texte après le JSON). Chaque sortie invalide coûte un secours vers Qwen.
   **Préparé pour bas le 2026-09-28** : `n8n-bas/_outillage/appliquer-temperature.py`
   (idempotent, même script pour prod) → Worker (2) à réimporter.
4. **Validateur JSON aussi tolérant que le navigateur** : sur les 4 sorties invalides à 1,0,
   2 étaient réparables par le healer du client (antislash LaTeX simple, texte après le JSON).
   Le Worker les jette pour relancer un modèle moins fiable. Extraire le premier objet JSON
   équilibré (comme `extractJsonContent` de `llm.js`) et tolérer les échappements invalides,
   plutôt qu'un `JSON.parse` strict. Idem pour `"to": 25",` de Qwen (nombre suivi d'un
   guillemet), motif qui n'existe dans aucun JSON valide.

## 5. Reste à faire

- **Parcours** : `parcours-runner.js` génère chaque activité en un appel, jusqu'à 8 éléments
  (8 QCM ≈ 5 500 jetons). Un quiz de parcours reste exposé au mur. Le brancher sur ce moteur
  suppose de porter le cadre du parcours dans le plan et les lots (D82 : ne jamais toucher les
  prompts individuels).
- **Charge de jour** : refaire §2.1 et §2.2 un jour de classe (10 h – 16 h). Le relevé Grist
  « vitesse » (heure de début/fin, jetons, modèle) donnerait la distribution réelle des débits.
- **Qwen 3.8** : absent du catalogue au 2026-09-28 ; à mesurer à son arrivée (le JSON de Qwen 3.6
  n'est pas assez fiable pour en faire un défaut).
