# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.Summary]

- Nombre d'étapes : Génère un tableau de 5 étapes minimum || [NOMBRE_ELEMENTS] étapes pour couvrir l'ensemble du sujet.
- Distracteurs : Propose au minimum 2 distracteurs par étape. Ils doivent être cohérents avec le sujet mais comporter des erreurs factuelles ou logiques plausibles.
- Rétroaction : renseigne le `tip` de chaque étape pour aider à reconnaître l'affirmation exacte parmi les distracteurs, sans la désigner. Le `overallFeedback` gradue par niveau de maîtrise (cf. RÈGLES PÉDAGOGIQUES).

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
- \`intro\` : Une phrase d'introduction courte (ex: "Choisissez l'affirmation correcte.").
- \`summaries\` : Tableau d'objets constituant les étapes. Chaque objet contient :
  - \`summary\` : UN tableau de phrases (**Association**). La première phrase de la liste doit TOUJOURS être le résumé correct (affirmation exacte).
  - \`tip\` : (Optionnel) Un indice contextuel pour aider l'élève.
- \`overallFeedback\` : tableau de 4 objets pour le score final (0-25, 26-50, 51-75, 76-100).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul. Exemples : \`\\\\( \\\\frac{1}{2} \\\\)\`, \`\\\\( \\\\sqrt{2} \\\\)\`, \`\\\\( \\\\alpha \\\\)\`, \`\\\\( x^{2} \\\\)\`, \`\\\\( \\\\mathbb{R} \\\\)\`, \`\\\\( \\\\sin(\\\\theta) \\\\)\`, \`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`, \`\\\\( x \\\\geq 0 \\\\)\`, \`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`.
- **Introduction :** Le champ \`intro\` est du texte brut (pas de LaTeX ni de HTML).

# EXEMPLE DE RENDU

```json
{
  "intro": "Sélectionnez les affirmations correctes pour construire le résumé du cours.",
  "summaries": [
    {
      "summary": [
        "La photosynthèse est un processus biologique permettant aux plantes de transformer l'énergie lumineuse en énergie chimique.",
        "La photosynthèse est un processus qui se déroule uniquement durant la nuit.",
        "La photosynthèse est le mécanisme par lequel les animaux respirent."
      ],
      "tip": "Pense à la lumière comme source d'énergie."
    }
  ],
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Reprends ce qu'est la photosynthèse : pense à la lumière comme source d'énergie."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Bon début : distingue bien ce que fait la plante et ce qu'elle ne fait pas."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Tu tiens l'essentiel : vérifie les affirmations qui t'ont fait hésiter."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Très bien : tu sais reconnaître ce qui décrit correctement la photosynthèse."
    }
  ]
}
```
