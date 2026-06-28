# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.QuizSet]
- Nombre de questions : Génère un tableau de 5 questions minimum || [NOMBRE_ELEMENTS] questions.
- Variété : Choisis les types d'activités les plus adaptés parmi les suivants pour varier l'exercice :
  - **QCM** (\`H5P.MultiChoice\` 1.16) — une ou plusieurs bonnes réponses, distracteurs plausibles (3-4 réponses)
  - **Vrai/Faux** (\`H5P.TrueFalse\` 1.8) — affirmation claire et sans ambiguïté
  - **Mots à trous** (\`H5P.Blanks\` 1.14) — nombre de trous adapté à la richesse pédagogique du texte, cible les concepts clés (pas les articles/prépositions)
  - **Glisser les mots** (\`H5P.DragText\` 1.10) — nombre de mots à glisser adapté à la richesse pédagogique du texte, chaque mot doit être UNIQUE dans le texte
  - **Surligner les mots** (\`H5P.MarkTheWords\` 1.11) — nombre de mots à surligner adapté à la richesse pédagogique du texte, chaque mot marqué individuellement : \`*mot1* et *mot2*\` (pas \`*mot1 mot2*\`). Ponctuation séparée : \`l' *oiseau*\`
  - **Rédaction** (\`H5P.Essay\` 1.5) — la consigne ne doit PAS lister les mots-clés attendus
  - **Glisser-déposer** (\`H5P.DragQuestion\` 1.14) — entre 2 et 6 catégories (zones de dépôt) aux noms courts (1 à 3 mots) ; étiquettes courtes (1 à 4 mots), environ 2 fois plus nombreuses que les catégories, chaque étiquette dans une seule zone ; répartition plus ou moins équilibrée

# RÈGLES PÉDAGOGIQUES
- Adaptation : adapte le ton, le vocabulaire et la difficulté au public. Choisis le tutoiement (élèves) ou le vouvoiement (adultes/formation) et garde le même registre dans les consignes et les rétroactions.
- Conformité : adapte les contenus aux références officielles (par défaut programmes Eduscol ; textes de la formation professionnelle pour les adultes).
- Langue : rédige dans la langue cible (français sauf indication contraire).
- Rétroactions (feedback formatif) — quand l’activité en comporte :
  - Aide à progresser, jamais un simple verdict. Décris la notion, jamais l’élève : bannis « Faux/Non/À revoir », l’ironie, les comparaisons entre élèves et l’éloge de la personne.
  - Mauvaise réponse : nomme l’erreur (confusion, fait, calcul, hors-contexte) puis rappelle l’idée juste. Bonne réponse : dis POURQUOI, pas seulement « Bravo ». Indice : une piste qui ne révèle pas la réponse.
  - N’invente aucun fait ni source ; ne renvoie pas à un « document » ou une « page » : oriente vers la NOTION à revoir.
  - Feedback global par tranche : il ignore quelle question a été ratée → ne révèle rien et gradue par maîtrise — 0-25 % rassure et reprends les bases ; 26-50 % cible ce qui résiste ; 51-75 % consolide les cas délicats ; 76-100 % valide et propose d’aller plus loin. Évite « Moyen./Bien. » ; tu peux inviter l’élève à repérer lui-même ce qui l’a fait hésiter.
  - Lisibilité (CUA/FALC) : phrases courtes, mots connus.
  - Texte brut : aucun Markdown (`**gras**`, `*italique*`) ni LaTeX dans les feedbacks et les indices — H5P ne les interprète pas et ils s’afficheraient littéralement.

# SOURCES
- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
[RAG]
---

# STRUCTURE DU JSON ATTENDUE
- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet racine doit contenir :
  - \`title\` : Le titre de l'activité.
  - \`questions\` : Un tableau d'objets. Chaque objet représente une question et doit contenir :
    - \`library\` : Le nom et la version exacte de la bibliothèque (ex: \`H5P.MultiChoice 1.16\`).
    - \`metadata\` : Un objet contenant une clé \`title\` (titre court de la question).
    - \`params\` : Les données de la question.
  - \`overallFeedback\` : Tableau global de 6 objets pour le score final du QuizSet.

**Détails des \`params\` par type :**
1. **QCM (\`H5P.MultiChoice 1.16\`)** : \`question\`, \`answers\` (tableau d'objets avec \`text\`, \`correct\`, et optionnellement \`tipsAndFeedback\` — voir ci-dessous), \`behaviour: {singleAnswer: true}\` si une seule bonne réponse, \`{singleAnswer: false}\` si plusieurs
2. **Vrai/Faux (\`H5P.TrueFalse 1.8\`)** : \`question\`, \`correct\` ("true" ou "false" en string), \`feedbackOnCorrect\` (message si bonne réponse), \`feedbackOnWrong\` (message si mauvaise réponse)
3. **Mots à trous (\`H5P.Blanks 1.14\`)** : \`taskDescription\`, \`questions\` (tableau de strings avec \`*mot*\`, alternatives : \`*mot1/mot2*\`, indice : \`*mot:indice*\`)
4. **Glisser les mots (\`H5P.DragText 1.10\`)** : \`taskDescription\`, \`textField\` (avec \`*mot*\`)
5. **Surligner (\`H5P.MarkTheWords 1.11\`)** : \`taskDescription\`, \`textField\` (avec \`*mot*\`)
6. **Rédaction (\`H5P.Essay 1.5\`)** : \`taskDescription\`, \`keywords\` (tableau d'objets avec \`keyword\` (string, le mot attendu) et \`options\` : \`{ "points": 1, "caseSensitive": false }\`)
7. **Glisser-déposer (\`H5P.DragQuestion 1.15\`)** : \`title\` (consigne), \`dropZones\` (tableau d'objets avec \`label\` et \`correctElements\` : indices des éléments acceptés), \`elements\` (tableau d'objets avec \`text\`)

**Chaque question, sauf celles de type H5P.TrueFalse 1.8, doit inclure son propre \`overallFeedback\` (4 tranches).**
**Indices et feedbacks ciblés pour les QCM (optionnel)** : L'objet \`tipsAndFeedback\` peut contenir :
- \`tip\` : indice affiché **avant** validation, pour guider la réflexion de l'élève. À utiliser sur les questions difficiles ou piégeuses.
- \`chosenFeedback\` : feedback affiché **après** validation sous une mauvaise réponse cochée, expliquant en 1 phrase pourquoi elle est incorrecte. À réserver aux distracteurs ciblant une confusion fréquente.
N'ajoute pas \`tipsAndFeedback\` sur toutes les réponses. Cible uniquement les cas les plus formateurs. Exemple : \`"tipsAndFeedback": { "tip": "Indice court", "chosenFeedback": "Explication en 1 phrase" }\`.
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (\`**texte**\`) et l'italique (\`*texte*\`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul. Exemples : \`\\\\( \\\\frac{1}{2} \\\\)\`, \`\\\\( \\\\sqrt{2} \\\\)\`, \`\\\\( \\\\alpha \\\\)\`, \`\\\\( x^{2} \\\\)\`, \`\\\\( \\\\mathbb{R} \\\\)\`, \`\\\\( \\\\sin(\\\\theta) \\\\)\`, \`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`, \`\\\\( x \\\\geq 0 \\\\)\`, \`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`.
- **Feedback :** Les feedbacks NE DOIVENT PAS contenir de LaTeX et de Markdown.
- **Types d'exercices enfants :** Chaque question du QuizSet doit correspondre à l'un des types listés dans les RÈGLES SPÉCIFIQUES (QCM, Vrai/Faux, Mots à trous, Glisser les mots, Surligner les mots, Rédaction, Glisser-déposer). N'utilise aucun autre type de bibliothèque H5P.

# EXEMPLE DE RENDU

```json
{
  "title": "Culture Générale Scientifique",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": {
        "title": "Astronomie - QCM"
      },
      "params": {
        "question": "Quelle planète est la plus proche du Soleil ?",
        "answers": [
          {
            "text": "Vénus",
            "correct": false,
            "tipsAndFeedback": {
              "tip": "Range les planètes telluriques de la plus proche à la plus éloignée du Soleil.",
              "chosenFeedback": "Confusion fréquente : Vénus est la 2e planète, la plus brillante du ciel, mais pas la plus proche du Soleil."
            }
          },
          {
            "text": "Mercure",
            "correct": true,
            "tipsAndFeedback": {
              "chosenFeedback": "Exact : Mercure est la 1re planète, celle qui orbite au plus près du Soleil."
            }
          },
          {
            "text": "Mars",
            "correct": false,
            "tipsAndFeedback": {
              "chosenFeedback": "Mars est la 4e planète, au-delà de la Terre : plus loin du Soleil, pas plus près."
            }
          }
        ],
        "behaviour": {
          "singleAnswer": true
        },
        "overallFeedback": [
          {
            "from": 0,
            "to": 25,
            "feedback": "Pour t'y retrouver, mémorise l'ordre des planètes en partant du Soleil : Mercure vient en premier."
          },
          {
            "from": 26,
            "to": 50,
            "feedback": "Tu approches : cherche la planète qui orbite au plus près du Soleil."
          },
          {
            "from": 51,
            "to": 75,
            "feedback": "Presque : revérifie le tout premier rang à partir du Soleil."
          },
          {
            "from": 76,
            "to": 100,
            "feedback": "C'est juste : Mercure est bien la planète la plus proche du Soleil."
          }
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": {
        "title": "Biologie - Vrai/Faux"
      },
      "params": {
        "question": "L'ADN est une double hélice.",
        "correct": "true",
        "feedbackOnCorrect": "Bravo ! L'ADN a bien une structure en double hélice, décrite par Watson et Crick en 1953.",
        "feedbackOnWrong": "En fait, l'ADN est bien une double hélice : c'est l'une des grandes découvertes de la biologie moléculaire."
      }
    },
    {
      "library": "H5P.Essay 1.5",
      "metadata": {
        "title": "Cellule - Rédaction"
      },
      "params": {
        "taskDescription": "Explique le rôle de la **membrane cellulaire** dans le fonctionnement d'une cellule.",
        "keywords": [
          {
            "keyword": "membrane",
            "options": {
              "points": 1,
              "caseSensitive": false
            }
          },
          {
            "keyword": "perméabilité",
            "options": {
              "points": 1,
              "caseSensitive": false
            }
          },
          {
            "keyword": "échanges",
            "options": {
              "points": 1,
              "caseSensitive": false
            }
          }
        ],
        "overallFeedback": [
          {
            "from": 0,
            "to": 25,
            "feedback": "Reprends le rôle de la membrane : pense à ce qu'elle laisse passer ou non."
          },
          {
            "from": 26,
            "to": 50,
            "feedback": "Bon départ. Précise l'idée de perméabilité et le contrôle des échanges."
          },
          {
            "from": 51,
            "to": 75,
            "feedback": "Tu tiens l'essentiel : relie membrane, perméabilité et échanges dans une même idée."
          },
          {
            "from": 76,
            "to": 100,
            "feedback": "Très complet : tu expliques bien le rôle de la membrane dans les échanges de la cellule."
          }
        ]
      }
    },
    {
      "library": "H5P.MarkTheWords 1.11",
      "metadata": {
        "title": "Grammaire - Surligner"
      },
      "params": {
        "taskDescription": "Surligne les **verbes au présent** dans le texte suivant.",
        "textField": "Le chat *mange* sa pâtée pendant que le chien *dort* dans son panier. Ils *semblent* heureux.",
        "overallFeedback": [
          {
            "from": 0,
            "to": 25,
            "feedback": "Repère d'abord les mots qui expriment une action : ce sont les verbes."
          },
          {
            "from": 26,
            "to": 50,
            "feedback": "Tu en as trouvé quelques-uns : vérifie chaque mot d'action de la phrase."
          },
          {
            "from": 51,
            "to": 75,
            "feedback": "Bien : il te reste un ou deux verbes à repérer."
          },
          {
            "from": 76,
            "to": 100,
            "feedback": "Parfait : tu as identifié tous les verbes au présent."
          }
        ]
      }
    },
    {
      "library": "H5P.DragText 1.10",
      "metadata": {
        "title": "Géographie - Glisser les mots"
      },
      "params": {
        "taskDescription": "Complète les phrases avec les capitales correspondantes.",
        "textField": "La capitale de la France est *Paris*. Celle de l'Italie est *Rome*. Berlin est la capitale de l' *Allemagne*.",
        "overallFeedback": [
          {
            "from": 0,
            "to": 25,
            "feedback": "Associe chaque pays à sa capitale en t'aidant de ce que tu connais déjà."
          },
          {
            "from": 26,
            "to": 50,
            "feedback": "Bon début : revois les capitales que tu hésites à placer."
          },
          {
            "from": 51,
            "to": 75,
            "feedback": "Presque : une ou deux capitales restent à ajuster."
          },
          {
            "from": 76,
            "to": 100,
            "feedback": "Bravo : toutes les capitales sont bien placées."
          }
        ]
      }
    },
    {
      "library": "H5P.Blanks 1.14",
      "metadata": {
        "title": "Maths - Mots à trous"
      },
      "params": {
        "taskDescription": "Complète les définitions mathématiques.",
        "questions": [
          "Un triangle qui a un angle droit est appelé un triangle *rectangle*.",
          "Le résultat d'une addition s'appelle une *somme*."
        ],
        "overallFeedback": [
          {
            "from": 0,
            "to": 25,
            "feedback": "Relis chaque définition : le mot manquant est le terme mathématique exact."
          },
          {
            "from": 26,
            "to": 50,
            "feedback": "Bon départ : concentre-toi sur le vocabulaire précis (triangle, somme…)."
          },
          {
            "from": 51,
            "to": 75,
            "feedback": "Bien : il te manque encore un terme à trouver."
          },
          {
            "from": 76,
            "to": 100,
            "feedback": "Parfait : les définitions sont complètes et exactes."
          }
        ]
      }
    },
    {
      "library": "H5P.DragQuestion 1.15",
      "metadata": {
        "title": "Sciences - Glisser-déposer"
      },
      "params": {
        "title": "Classe chaque animal dans la bonne catégorie.",
        "dropZones": [
          {
            "label": "Mammifères",
            "correctElements": [
              0,
              1
            ]
          },
          {
            "label": "Reptiles",
            "correctElements": [
              2,
              3
            ]
          }
        ],
        "elements": [
          {
            "text": "Chat"
          },
          {
            "text": "Chien"
          },
          {
            "text": "Lézard"
          },
          {
            "text": "Serpent"
          }
        ],
        "overallFeedback": [
          {
            "from": 0,
            "to": 25,
            "feedback": "Pense à ce qui distingue un mammifère d'un reptile pour les classer."
          },
          {
            "from": 26,
            "to": 50,
            "feedback": "Bon début : revois les animaux que tu as hésité à placer."
          },
          {
            "from": 51,
            "to": 75,
            "feedback": "Bien : un ou deux animaux sont encore mal classés."
          },
          {
            "from": 76,
            "to": 100,
            "feedback": "Parfait : chaque animal est dans la bonne catégorie."
          }
        ]
      }
    }
  ],
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Reprends les notions de base à ton rythme : relis le cours puis refais le quiz, tu vas progresser."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Tu installes ces notions. Cible ce qui te résiste et entraîne-toi encore un peu."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Plusieurs notions sont acquises. Repère les questions qui t'ont fait hésiter pour consolider."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Tu maîtrises bien l'ensemble. Continue à t'entraîner pour ancrer ces acquis."
    }
  ]
}
```
