# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.Essay]

- Mots-clés : Au minimum 5 mots-clés ou expressions attendus dans la réponse || [NOMBRE_ELEMENTS] mots-clés.
- Consigne : La consigne ne doit pas lister les mots-clés attendus pour ne pas donner la réponse, sauf le nom du thème général.
- Rétroaction : le `overallFeedback` porte sur la COMPLÉTUDE de la réponse (les idées-clés sont-elles présentes ?), pas sur un « juste/faux ». Il gradue par niveau de maîtrise et indique les aspects à développer (cf. RÈGLES PÉDAGOGIQUES).

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
- **LaTeX :** Pour les formules mathématiques dans la consigne (`taskDescription`), utilise le format LaTeX : `\\( ... \\)`. Exemples : `\\( \\frac{1}{2} \\)`, `\\( \\alpha \\)`, `\\( x^{2} \\)`, `\\( \\mathbb{R} \\)`.
- **Mots-clés :** Les `keyword` sont du texte brut (pas de LaTeX ni de HTML). Ce sont les termes recherchés dans la réponse de l'élève.

# SOURCES
- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
[RAG]
---

# STRUCTURE DU JSON ATTENDUE
- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
L'objet doit contenir :
- \`taskDescription\` : Une consigne claire invitant l'élève à rédiger un texte sur le thème. Utilise \`**mot**\` pour le gras (concepts clés), \`*mot*\` pour l'italique et \`\\n\` pour les sauts de ligne.
- \`keywords\` : Un tableau d'objets définissant les mots-clés attendus. Chaque objet doit avoir la forme :
  ```json
  {
    "keyword": "mot ou expression",
    "options": { "points": 1, "caseSensitive": false }
  }
  ```
- \`overallFeedback\` : (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 4 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-25, 26-50, 51-75, et 76-100.

# EXEMPLE DE RENDU
```json
{
  "taskDescription": "Rédigez un court texte expliquant le processus de la **photosynthèse**. Votre réponse doit aborder les éléments essentiels permettant aux plantes de produire leur propre énergie.",
  "keywords": [
    {"keyword": "lumière", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "chlorophylle", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "dioxyde de carbone", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "eau", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glucose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 25, "feedback": "C'est un début. Relis bien le cours sur la photosynthèse." },
    { "from": 26, "to": 50, "feedback": "Ta compréhension progresse. Pense à détailler davantage." },
    { "from": 51, "to": 75, "feedback": "Bon travail ! Tu maîtrises les bases." },
    { "from": 76, "to": 100, "feedback": "Excellent ! Tu as une maîtrise parfaite du sujet." }
  ]
}
```
