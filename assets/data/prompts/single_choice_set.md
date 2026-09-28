# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.SingleChoiceSet]

- Nombre de questions : Au minimum 3 questions || [NOMBRE_ELEMENTS] questions.
- Réponses : Propose de 2 à 3 distracteurs par question. La première réponse de la liste `answers` doit toujours être la bonne.
- Distracteurs : Cohérents mais comportant des erreurs logiques ou factuelles plausibles.
- Rétroaction : ce type ne propose qu'un feedback global (`overallFeedback`), sans message par réponse — soigne sa graduation par niveau de maîtrise et son ancrage dans la notion (cf. RÈGLES PÉDAGOGIQUES).

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
- \`choices\` : Tableau d'objets constituant les questions. Chaque objet contient :
  - \`question\` : L'énoncé de la question.
  - \`answers\` : Tableau de chaînes de caractères (réponses) dont la première est toujours la bonne réponse.
- \`overallFeedback\` : tableau de 4 objets pour le score final (0-25, 26-50, 51-75, 76-100).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul. Exemples : \`\\\\( \\\\frac{1}{2} \\\\)\`, \`\\\\( \\\\sqrt{2} \\\\)\`, \`\\\\( \\\\alpha \\\\)\`, \`\\\\( x^{2} \\\\)\`, \`\\\\( \\\\mathbb{R} \\\\)\`, \`\\\\( \\\\sin(\\\\theta) \\\\)\`, \`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`, \`\\\\( x \\\\geq 0 \\\\)\`, \`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`.

# EXEMPLE DE RENDU

```json
{
  "choices": [
    {
      "question": "Quel est le principal gaz responsable de l'effet de serre ?",
      "answers": [
        "Le dioxyde de carbone",
        "Le dioxygène",
        "Le diazote",
        "L'argon"
      ]
    },
    {
      "question": "Quelle est la capitale de la France ?",
      "answers": [
        "Paris",
        "Lyon",
        "Marseille",
        "Bordeaux"
      ]
    }
  ],
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Reprends ces notions à ton rythme : relis le cours puis refais le quiz."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Tu installes ces notions : cible les questions qui t'ont fait hésiter."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Bonne base : repère ce qui t'a fait douter pour consolider."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Tu maîtrises bien l'ensemble. Continue à t'entraîner pour ancrer ces acquis."
    }
  ]
}
```

- Options natives : `behaviour.autoContinue`, `timeoutCorrect` (2000 ms), `timeoutWrong` (3000 ms), `soundEffectsEnabled`, `enableRetry`, `enableSolutionsButton`, `passPercentage` (0–100). Respecte les réglages demandés. Deux à quatre réponses par question ; aucun média ni retour par réponse dans ce type natif.
