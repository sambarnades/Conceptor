Crée un livre de UNE seule page intitulée « Comparer les capitales ». La couverture est activée et présente la consigne « Observe les pays et retrouve leurs capitales. », sans média. Dans la page, place une rangée de DEUX colonnes : largeur 35 pour un texte rappelant France–Paris, Italie–Rome, Espagne–Madrid ; largeur 65 pour trois cartes de dialogue correspondantes. Les cartes sont en mode normal. Conserve progressIndicators:true, progressAuto:false, enableRetry:false et showTableOfContents:false. Aucun média ni lien inventé. Aucun contenu nominatif.

- Nombre de chapitres : 1.
- Structure : Chaque chapitre est une page de livre qui empile verticalement plusieurs blocs (textes, tableaux, exercices). Alterne contenu et exercices AU SEIN d'un même chapitre.
- Richesse des chapitres : Vise 2 à 4 blocs par chapitre (ex : 1-2 paragraphes + 1 exercice). Évite les chapitres à bloc unique, sauf pour la synthèse finale.
- Progression pédagogique : Organise les chapitres dans un ordre logique : introduction → développement → vérification → synthèse. Termine par un chapitre de synthèse avec un exercice récapitulatif.
- Couverture : Fournis un objet `cover` avec une `description` accrocheuse d'une ou deux phrases présentant le livre.
- Titres de chapitres : Courts et explicites — ils forment la table des matières du livre.
- Types de blocs disponibles :
  - Bloc texte (text) — explications, définitions, notions clés (Markdown autorisé)
  - Bloc tableau (table) — tableau de données avec en-têtes et lignes. Utilise TOUJOURS un bloc `table` pour des données en colonnes ; n'écris JAMAIS un tableau en Markdown (`| … | … |`) dans un bloc `text` (il s'afficherait en texte brut, non mis en forme).
  - Bloc exercice (exercise) — un exercice interactif parmi les types ci-dessous
- Types d'exercices disponibles :
  - QCM — une ou plusieurs bonnes réponses, distracteurs plausibles (3-4 réponses)
  - Vrai/Faux — affirmation claire et sans ambiguïté
  - Texte à trous — cible les concepts clés avec `*mot*`, alternatives : `*mot1/mot2*`, indice : `*mot:indice*`
  - Glisser les mots — chaque mot à glisser UNIQUE dans le texte, marqué `*mot*`
  - Surligner les mots — chaque mot marqué individuellement : `*mot1* et *mot2*`. Ponctuation séparée : `l' *oiseau*`
  - Choix unique en série — séquence de 3-5 questions à choix unique rapide, la première réponse est toujours la bonne
  - Résumé — groupes d'affirmations, la première de chaque groupe est correcte
  - Glisser-déposer — 2 à 6 catégories, étiquettes courtes, chaque étiquette dans une seule zone
  - Cartes de dialogue — paires recto/verso pour révision de vocabulaire ou concepts
- Options du livre (optionnelles, à la racine) : `baseColor` (couleur d'accent hexadécimale, ex : `#1768c4`, sobre et cohérente avec le thème), `showTableOfContents` (booléen, table des matières, `true` par défaut), `displaySummary` (booléen, page de bilan finale, `true` par défaut).

- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par `{` et finir par `}`. Aucun autre texte ou commentaire.
- L'objet racine doit contenir :
  - `title` : Le titre du livre.
  - `cover` : Objet optionnel `{ "description": "..." }` — texte de la page de couverture.
  - `chapters` : Un tableau d'objets. Chaque objet représente un chapitre (une page du livre).

**Structure d'un chapitre :**

Chaque chapitre contient :
- `title` (string) : Le titre du chapitre (affiché dans la table des matières).
- `content` (array) : La liste ordonnée des blocs du chapitre (au moins 1 bloc).

**Structure des blocs par type :**

1. **Texte** : `{ "type": "text", "text": "…texte avec Markdown (**gras**, *italique*)…" }`
2. **Tableau** : `{ "type": "table", "tableStyle": "default", "table": { "headers": [...], "rows": [[...], [...]] } }` — `headers` : tableau de strings, `rows` : tableau de tableaux de strings. `tableStyle` optionnel : `default`, `striped`, `bordered`, `dark-header`, `minimal`, `dsfr`.
3. **Exercice** : `{ "type": "exercise", "library": "H5P.MultiChoice 1.16", …champs de l'exercice… }`

**Structure des objets exercice par type :**

Chaque exercice contient `library` suivi des champs décrits ci-dessous. Respecte EXACTEMENT les types de données indiqués.

1. **QCM** (`library: "H5P.MultiChoice 1.16"`) :
   - `question` (string) : L'énoncé de la question.
   - `answers` (array d'objets) : Chaque objet a `text` (string), `correct` (boolean), et optionnellement `tipsAndFeedback` : `{ "tip": "...", "chosenFeedback": "..." }`.
   - `behaviour` : `{ singleAnswer: true }` si une seule bonne réponse, `{ singleAnswer: false }` si plusieurs.
   - `overallFeedback` (4 tranches)

2. **Vrai/Faux** (`library: "H5P.TrueFalse 1.8"`) :
   - `question` (string) : L'affirmation à évaluer.
   - `correct` (string) : `"true"` ou `"false"` — TOUJOURS une string, jamais un boolean.
   - `feedbackOnCorrect` (string), `feedbackOnWrong` (string)

3. **Texte à trous** (`library: "H5P.Blanks 1.14"`) :
   - `taskDescription` (string) : Consigne COURTE (1-2 phrases). INTERDIT d'y mettre des marqueurs `*mot*`.
   - `questions` (array de STRINGS) : Chaque élément est une CHAÎNE DE CARACTÈRES contenant le texte avec les trous marqués `*mot*`. Alternatives : `*mot1/mot2*`. Indice : `*mot:indice*`. JAMAIS d'objets dans ce tableau. ⚠️ CHAQUE phrase de `questions` DOIT contenir au moins un trou `*mot*` (le mot à deviner entre astérisques) ; sans marqueur, l'exercice est cassé (rien à compléter, score 0/0). Correct : `"2 h = *7200* s"`. INTERDIT : `"2 h = 7200 s"`.
   - `overallFeedback` (4 tranches)

4. **Glisser les mots** (`library: "H5P.DragText 1.10"`) :
   - `taskDescription` (string) : Consigne claire.
   - `textField` (string) : Le texte complet avec `*mot*` pour chaque mot à glisser. Chaque mot doit être UNIQUE. ⚠️ `textField` DOIT contenir au moins un `*mot*` ; sans marqueur, il n'y a rien à glisser (score 0/0). Correct : `"2,5 km = *2500* m"`. INTERDIT : `"2,5 km = 2500 m"`. Phrases séparées par `\n`.
   - `overallFeedback` (4 tranches)

5. **Surligner les mots** (`library: "H5P.MarkTheWords 1.11"`) :
   - `taskDescription` (string) : Consigne qui décrit CE QU'IL FAUT SURLIGNER (ex : « Surlignez les unités de mesure. », « Surlignez les verbes conjugués. »). N'emploie JAMAIS « compléter » ni « mots manquants » : l'élève surligne des mots DÉJÀ présents, il n'y a rien à compléter. `**gras**` et `*italique*` autorisés uniquement ici.
   - `textField` (string) : Le texte avec `*mot*` pour chaque mot à surligner. UN mot par marqueur (`*mot1* et *mot2*`, jamais `*mot1 mot2*`). Espace avant `*` et après `*`. Apostrophe séparée : `l' *oiseau*`.
   - `overallFeedback` (4 tranches)

6. **Choix unique en série** (`library: "H5P.SingleChoiceSet 1.11"`) :
   - `choices` (array d'objets) : Chaque objet a `question` (string) et `answers` (array de strings — la PREMIÈRE réponse est toujours la correcte).
   - `overallFeedback` (4 tranches)

7. **Résumé** (`library: "H5P.Summary 1.10"`) :
   - `intro` (string) : Phrase d'introduction courte.
   - `summaries` (array d'objets) : Chaque objet a `summary` (array de strings — la PREMIÈRE est toujours correcte) et optionnellement `tip` (string).
   - `overallFeedback` (4 tranches)

8. **Glisser-déposer** (`library: "H5P.DragQuestion 1.15"`) :
   - `title` (string) : Consigne expliquant ce que l'élève doit faire.
   - `dropZones` (array d'objets) : Chaque objet a `label` (string) et `correctElements` (array d'entiers = indices dans `elements`, commençant à 0).
   - `elements` (array d'objets) : Chaque objet a `text` (string, 1 à 4 mots).
   - `overallFeedback` (4 tranches)

9. **Cartes de dialogue** (`library: "H5P.Dialogcards 1.9"`) :
   - `title` (string), `description` (string)
   - `dialogs` (array d'objets) : Chaque objet a `text` (string, recto) et `answer` (string, verso). Optionnellement `tips` : `{ "front": "...", "back": "..." }`.

**Chaque exercice scoré (sauf Vrai/Faux et Cartes de dialogue) doit inclure son propre `overallFeedback` (4 tranches).**
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (`**texte**`) et l'italique (`*texte*`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : `\\( ... \\)`. N'utilise JAMAIS le signe `$` seul. Exemples : `\\( \\frac{1}{2} \\)`, `\\( \\sqrt{2} \\)`, `\\( \\alpha \\)`, `\\( x^{2} \\)`, `\\( \\mathbb{R} \\)`, `\\( \\sin(\\theta) \\)`, `\\( \\sum_{k=0}^{n} k \\)`, `\\( x \\geq 0 \\)`, `\\( \\forall x \\in \\mathbb{R} \\)`.
- **Feedback :** Les feedbacks (`overallFeedback`, `tipsAndFeedback`) NE DOIVENT PAS contenir de LaTeX ni de Markdown. Texte brut uniquement.
- Colonnes côte à côte facultatives pour comparer : une à quatre colonnes, contenant les mêmes blocs texte/tableau/image/exercice, sans row imbriquée. Largeurs absentes pour une répartition automatique, sinon total 100 et minimum 10 par colonne.
{"type":"row","columns":[{"width":40,"content":[{"type":"text","text":"…"}]},{"width":60,"content":[{"type":"text","text":"…"}]}]}

Le livre accepte de 1 à 50 chapitres. cover.enabled active la couverture ; cover.description est facultatif. progressIndicators, progressAuto et enableRetry règlent la progression et la reprise. progressAuto:false permet une validation manuelle des pages. Un média cover.media est facultatif : action native H5P.Image 1.1 ou H5P.Video 1.6, uniquement avec un média fourni par l’enseignant ; ne pas inventer de fichier ni de lien. Conserver les choix explicites, y compris false.

```json
{
  "title": "Le système solaire",
  "cover": {
    "description": "Un voyage interactif à travers les huit planètes de notre système solaire.",
    "enabled": true
  },
  "chapters": [
    {
      "title": "Introduction",
      "content": [
        {
          "type": "row",
          "columns": [
            {
              "width": 40,
              "content": [
                {
                  "type": "text",
                  "text": "Le **système solaire** s'est formé il y a environ *4,6 milliards d'années*. Il comprend le Soleil et huit planètes."
                }
              ]
            },
            {
              "width": 60,
              "content": [
                {
                  "type": "table",
                  "tableStyle": "default",
                  "table": {
                    "headers": [
                      "Planète",
                      "Type",
                      "Lunes"
                    ],
                    "rows": [
                      [
                        "Mercure",
                        "Tellurique",
                        "0"
                      ],
                      [
                        "Terre",
                        "Tellurique",
                        "1"
                      ],
                      [
                        "Jupiter",
                        "Gazeuse",
                        "95"
                      ]
                    ]
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "exercise",
          "library": "H5P.MultiChoice 1.16",
          "question": "Combien de planètes compte le système solaire ?",
          "answers": [
            {
              "text": "Huit",
              "correct": true,
              "tipsAndFeedback": {
                "chosenFeedback": "Exact !"
              }
            },
            {
              "text": "Neuf",
              "correct": false,
              "tipsAndFeedback": {
                "chosenFeedback": "Pluton est une planète naine depuis 2006."
              }
            },
            {
              "text": "Sept",
              "correct": false
            }
          ],
          "behaviour": {
            "singleAnswer": true
          },
          "overallFeedback": [
            {
              "from": 0,
              "to": 25,
              "feedback": "Revoyez les points clés du livre."
            },
            {
              "from": 26,
              "to": 50,
              "feedback": "C'est un début, continuez !"
            },
            {
              "from": 51,
              "to": 75,
              "feedback": "Bon travail !"
            },
            {
              "from": 76,
              "to": 100,
              "feedback": "Excellent !"
            }
          ]
        }
      ]
    },
    {
      "title": "Les planètes telluriques",
      "content": [
        {
          "type": "text",
          "text": "Les planètes **telluriques** (Mercure, Vénus, Terre, Mars) sont rocheuses et proches du Soleil."
        },
        {
          "type": "exercise",
          "library": "H5P.Blanks 1.14",
          "taskDescription": "Complétez la phrase.",
          "questions": [
            "La planète la plus proche du Soleil est *Mercure*."
          ],
          "overallFeedback": [
            {
              "from": 0,
              "to": 25,
              "feedback": "Revoyez les points clés du livre."
            },
            {
              "from": 26,
              "to": 50,
              "feedback": "C'est un début, continuez !"
            },
            {
              "from": 51,
              "to": 75,
              "feedback": "Bon travail !"
            },
            {
              "from": 76,
              "to": 100,
              "feedback": "Excellent !"
            }
          ]
        },
        {
          "type": "exercise",
          "library": "H5P.TrueFalse 1.8",
          "question": "Mars est surnommée la planète rouge.",
          "correct": "true",
          "feedbackOnCorrect": "Bravo !",
          "feedbackOnWrong": "Si, à cause de l'oxyde de fer à sa surface."
        }
      ]
    },
    {
      "title": "Synthèse",
      "content": [
        {
          "type": "exercise",
          "library": "H5P.Summary 1.10",
          "intro": "Choisissez les affirmations correctes.",
          "summaries": [
            {
              "summary": [
                "La Terre possède une lune",
                "La Terre possède deux lunes",
                "La Terre ne possède aucune lune"
              ]
            }
          ],
          "overallFeedback": [
            {
              "from": 0,
              "to": 25,
              "feedback": "Revoyez les points clés du livre."
            },
            {
              "from": 26,
              "to": 50,
              "feedback": "C'est un début, continuez !"
            },
            {
              "from": 51,
              "to": 75,
              "feedback": "Bon travail !"
            },
            {
              "from": 76,
              "to": 100,
              "feedback": "Excellent !"
            }
          ]
        }
      ]
    }
  ],
  "progressIndicators": true,
  "progressAuto": false,
  "enableRetry": true
}
```

Crée un livre de UNE seule page intitulée « Comparer les capitales ». La couverture est activée et présente la consigne « Observe les pays et retrouve leurs capitales. », sans média. Dans la page, place une rangée de DEUX colonnes : largeur 35 pour un texte rappelant France–Paris, Italie–Rome, Espagne–Madrid ; largeur 65 pour trois cartes de dialogue correspondantes. Les cartes sont en mode normal. Conserve progressIndicators:true, progressAuto:false, enableRetry:false et showTableOfContents:false. Aucun média ni lien inventé. Aucun contenu nominatif.
