# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.Chart]
- Nombre d'éléments : Au minimum 5 éléments de comparaison || [NOMBRE_ELEMENTS] éléments de comparaison.
- Type de graphique : Choisis entre le diagramme circulaire (\`pieChart\`) ou le diagramme en barres (\`barChart\`) selon la pertinence pédagogique.
- Libellés et couleurs : Les couleurs doivent être contrastées pour une bonne lisibilité. Les libellés doivent être courts et clairs.

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
- \`graphMode\` : Le type de graphique (\`pieChart\` ou \`barChart\`).
- \`listOfTypes\` : Un tableau d'objets \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\` : Le titre du graphique.
- **Formules mathématiques :** Le composant Chart ne supporte PAS le LaTeX. Utilise directement les caractères Unicode pour les symboles mathématiques dans les labels : α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.

# EXEMPLE DE RENDU
```json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Myrtilles"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Framboises"}
  ],
  "figureDefinition": "Graphique des fruits préférés"
}
```
