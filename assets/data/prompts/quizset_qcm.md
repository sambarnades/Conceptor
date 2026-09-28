# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.QuizSet QCM]

- Nombre de questions : Génère un tableau de 5 questions minimum || [NOMBRE_ELEMENTS] questions.
- Type : Tu dois générer UNIQUEMENT des questions de type **QCM** (`H5P.MultiChoice` 1.16). Aucun autre type n'est autorisé.
- Qualité des QCM :
  - Chaque question doit avoir au minimum 3 propositions de réponse.
  - Selon la nature de la question, tu peux proposer une seule ou plusieurs bonnes réponses.
  - Les distracteurs (mauvaises réponses) doivent être plausibles et pertinents.
  - Évite les formulations négatives dans les questions.
  - Varie la position de la ou des bonnes réponses.
  - Indices et feedbacks ciblés : ajoute un `tip` (indice avant de répondre) sur les questions difficiles ou piégeuses, et un `chosenFeedback` sur les distracteurs qui ciblent une confusion fréquente (nomme l'erreur, puis rappelle l'idée juste). Tu peux aussi confirmer en une phrase pourquoi la bonne réponse est correcte. Inutile d'en mettre partout : vise les cas les plus formateurs.

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

- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par `{` et finir par `}`. Aucun autre texte ou commentaire.
- L'objet racine doit contenir :
  - `title` : Le titre de l'activité.
  - `questions` : Un tableau d'objets. Chaque objet représente une question QCM et doit contenir :
    - `library` : Toujours `H5P.MultiChoice 1.16`.
    - `metadata` : Un objet contenant une clé `title` (titre court de la question).
    - `params` : Les données de la question.
  - `overallFeedback` : Tableau global de 4 objets pour le score final du QuizSet.

**Détails des `params` pour QCM (`H5P.MultiChoice 1.16`)** :
- `question` : La question posée (string).
- `answers` : Tableau d'objets avec `text` (string), `correct` (boolean), et optionnellement `tipsAndFeedback` (objet, là où c'est pédagogiquement utile — y compris sur la bonne réponse pour confirmer pourquoi elle est correcte).
  - **`tipsAndFeedback`** (optionnel) : objet pouvant contenir `tip` (indice avant validation) et/ou `chosenFeedback` (feedback après validation si cette réponse est cochée : sur un distracteur, nomme l'erreur puis rappelle l'idée juste ; sur la bonne réponse, confirme en une phrase pourquoi elle est correcte). Exemple : `{ "tip": "Indice court", "chosenFeedback": "Explication en 1 phrase" }`. À ajouter uniquement sur les réponses où c'est pédagogiquement utile.
- `behaviour` : Objet avec `singleAnswer` : `true` si une seule bonne réponse, `false` si plusieurs bonnes réponses.

**Chaque question doit inclure son propre `overallFeedback` (4 tranches : 0-25, 26-50, 51-75, 76-100).** Adapte chaque message à la notion (jamais « Faux. » / « Bien. ») : la tranche basse donne une piste pour progresser sans dévaloriser, la tranche haute confirme l'idée juste.
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (`**texte**`) et l'italique (`*texte*`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : `\\( ... \\)`. N'utilise JAMAIS le signe `$` seul. Exemples : `\\( \\frac{1}{2} \\)`, `\\( \\sqrt{2} \\)`, `\\( \\alpha \\)`, `\\( x^{2} \\)`, `\\( \\mathbb{R} \\)`, `\\( \\sin(\\theta) \\)`, `\\( \\sum_{k=0}^{n} k \\)`, `\\( x \\geq 0 \\)`, `\\( \\forall x \\in \\mathbb{R} \\)`.
- **Feedback :** Les feedbacks (`overallFeedback`, `tipsAndFeedback`) NE DOIVENT PAS contenir de LaTeX ni de Markdown. Texte brut uniquement.

# EXEMPLE DE RENDU

```json
{
  "title": "Quiz QCM - Sciences",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": {
        "title": "Astronomie - Planètes"
      },
      "params": {
        "question": "Quelle planète est la plus proche du Soleil ?",
        "answers": [
          {
            "text": "Vénus",
            "correct": false,
            "tipsAndFeedback": {
              "tip": "Range les planètes telluriques de la plus proche à la plus éloignée du Soleil.",
              "chosenFeedback": "Confusion fréquente : Vénus est la 2e planète. On la remarque car c'est la plus brillante du ciel, mais ce n'est pas la plus proche du Soleil."
            }
          },
          {
            "text": "Mars",
            "correct": false,
            "tipsAndFeedback": {
              "chosenFeedback": "Mars est la 4e planète, au-delà de la Terre : elle est plus loin du Soleil, pas plus près."
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
            "text": "Jupiter",
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
      "library": "H5P.MultiChoice 1.16",
      "metadata": {
        "title": "Biologie - Organites"
      },
      "params": {
        "question": "Quels organites possèdent leur propre ADN ?",
        "answers": [
          {
            "text": "Le ribosome",
            "correct": false,
            "tipsAndFeedback": {
              "chosenFeedback": "Confusion à éviter : le ribosome contient de l'ARN ribosomique, mais il n'a pas d'ADN qui lui soit propre."
            }
          },
          {
            "text": "La mitochondrie",
            "correct": true,
            "tipsAndFeedback": {
              "chosenFeedback": "Exact : la mitochondrie possède son propre ADN, vestige de son origine bactérienne."
            }
          },
          {
            "text": "L'appareil de Golgi",
            "correct": false,
            "tipsAndFeedback": {
              "chosenFeedback": "L'appareil de Golgi trie et expédie les protéines, mais il ne contient pas d'ADN."
            }
          },
          {
            "text": "Le chloroplaste",
            "correct": true
          }
        ],
        "behaviour": {
          "singleAnswer": false
        },
        "overallFeedback": [
          {
            "from": 0,
            "to": 25,
            "feedback": "Pense aux organites hérités de bactéries ancestrales : ce sont eux qui ont gardé leur ADN."
          },
          {
            "from": 26,
            "to": 50,
            "feedback": "Tu as une partie de la réponse : il y a deux organites à trouver."
          },
          {
            "from": 51,
            "to": 75,
            "feedback": "Bien : il te manque encore l'un des deux organites concernés."
          },
          {
            "from": 76,
            "to": 100,
            "feedback": "Bien vu : la mitochondrie et le chloroplaste possèdent tous deux leur propre ADN."
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
      "feedback": "Tu es en train d'installer ces notions. Cible ce qui te résiste et entraîne-toi encore un peu."
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

# Réglages natifs du quiz

- Introduction: `introPage: {showIntroPage, title, introduction, startButtonText}`.
- Nombre de questions tirées (vide : toutes): `poolSize` (≥ 1), `disableBackwardsNavigation`, `randomQuestions`.
- Réglages communs aux questions: `override: {checkButton, showSolutionButton: "on"|"off", retryButton: "on"|"off"}`.
- Montrer les résultats: `endGame: {showResultPage, showSolutionButton, showRetryButton, overallFeedback: [{from:0,to:100,feedback:"…"}]}`.
- Lire une vidéo après le quiz: `endGame.showAnimations`, `endGame.skippable`, `endGame.successVideo`, `endGame.failVideo`.
