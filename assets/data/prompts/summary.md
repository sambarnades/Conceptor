# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.Summary]
- Nombre d'étapes : Génère un tableau de 5 étapes minimum || [NOMBRE_ELEMENTS] étapes pour couvrir l'ensemble du sujet.
- Distracteurs : Propose au minimum 2 distracteurs par étape. Ils doivent être cohérents avec le sujet mais comporter des erreurs factuelles ou logiques plausibles.

# RÈGLES PÉDAGOGIQUES
- Adaptation et vocabulaire : Adapte le ton, le vocabulaire et la difficulté des consignes au public indiqué. Sois pertinent et engageant.
- Ton et feedback : Les consignes et remarques doivent être constructives, encourageantes, tournées vers l'apprentissage.
- Conformité : Adapte OBLIGATOIREMENT les contenus aux références officielles en vigueur. Sauf mention contraire explicite, base-toi par défaut sur les programmes scolaires français (Eduscol) pour le public scolaire, et sur les textes réglementaires de la formation professionnelle pour les adultes.
- Langue : Le contenu et les consignes doivent être rédigés dans la langue cible (français sauf indication contraire).

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
      "tip": "Pensez à la lumière comme source d'énergie."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 25, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions." },
    { "from": 26, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir." },
    { "from": 51, "to": 75, "feedback": "Bon travail ! Tu as compris l'essentiel." },
    { "from": 76, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon." }
  ]
}
```
