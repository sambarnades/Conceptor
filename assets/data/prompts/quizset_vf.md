# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.QuizSet Vrai/Faux]
- Nombre de questions : Génère un tableau de 5 questions minimum || [NOMBRE_ELEMENTS] questions.
- Type : Tu dois générer UNIQUEMENT des questions de type **Vrai/Faux** (\`H5P.TrueFalse\` 1.8). Aucun autre type n'est autorisé.
- Qualité des questions :
  - Les affirmations doivent être claires et non ambiguës.
  - Évite les doubles négations.
  - Varie entre les affirmations vraies et les affirmations fausses.

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
    - \`library\` : Toujours \`H5P.TrueFalse 1.8\`.
    - \`metadata\` : Un objet contenant une clé \`title\` (titre court de la question).
    - \`params\` : Les données de la question.
  - \`overallFeedback\` : Tableau global de 4 objets pour le score final du QuizSet : 0-25, 26-50, 51-75, 76-100.

**Détails des \`params\` pour Vrai/Faux (\`H5P.TrueFalse 1.8\`)** :
- \`question\` : L'assertion ou la question posée (string).
- \`correct\` : La réponse correcte. DOIT être une chaîne de caractères : "true" ou "false".
- \`feedbackOnCorrect\` : Message affiché si l'élève répond correctement (string, encourageant).
- \`feedbackOnWrong\` : Message affiché si l'élève répond incorrectement (string, explicatif et pédagogique).
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (\`**texte**\`) et l'italique (\`*texte*\`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul. Exemples : \`\\\\( \\\\frac{1}{2} \\\\)\`, \`\\\\( \\\\sqrt{2} \\\\)\`, \`\\\\( \\\\alpha \\\\)\`, \`\\\\( x^{2} \\\\)\`, \`\\\\( \\\\mathbb{R} \\\\)\`, \`\\\\( \\\\sin(\\\\theta) \\\\)\`, \`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`, \`\\\\( x \\\\geq 0 \\\\)\`, \`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`.
- **Feedback :** Les feedbacks NE DOIVENT PAS contenir de LaTeX et de Markdown.

# EXEMPLE DE RENDU

```json
{
  "title": "Quiz Vrai/Faux - Géographie",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": {
        "title": "Géographie - Capitales"
      },
      "params": {
        "question": "La capitale de l'Australie est Canberra.",
        "correct": "true",
        "feedbackOnCorrect": "Bravo ! Canberra est bien la capitale de l'Australie, souvent confondue avec Sydney.",
        "feedbackOnWrong": "La capitale de l'Australie est Canberra : on la confond souvent avec Sydney, qui est la plus grande ville."
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": {
        "title": "Géographie - Continents"
      },
      "params": {
        "question": "L'Afrique est le plus grand continent du monde.",
        "correct": "false",
        "feedbackOnCorrect": "Exact : c'est l'Asie le plus grand continent, l'Afrique vient ensuite.",
        "feedbackOnWrong": "En fait, c'est l'Asie le plus grand continent du monde, suivie de l'Afrique."
      }
    }
  ],
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Reprends ces repères à ton rythme : relis le cours puis refais le quiz."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Tu installes ces repères : cible les affirmations qui t'ont fait douter."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Bonne base : repère les énoncés qui t'ont fait hésiter pour consolider."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Tu maîtrises bien ces notions. Continue à t'entraîner pour les ancrer."
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
