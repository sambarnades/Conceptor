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
- Langue : Le contenu et les consignes doivent être rédigés en français.

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
- \`overallFeedback\` : Tableau de 6 objets pour le score final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX :** Utilise le double échappement pour LaTeX : \`\\\\( (2^3)^2 \\\\)\`.

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
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir." },
    { "from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel." },
    { "from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts." },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon." }
  ]
}
```
