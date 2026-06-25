# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.SortParagraphs]

- Nombre d'étapes : Minimum 3 étapes ou paragraphes à trier || [NOMBRE_ELEMENTS] étapes.
- Logique intrinsèque : Les paragraphes (`paragraphs`) doivent former une progression logique inférable par le contenu lui-même.
- Interdiction d'indices artificiels : Tu ne dois JAMAIS utiliser de numérotation (1, 2, 3...), de repères temporels explicites (dates, horaires) ou de connecteurs logiques trop simplistes ("D'abord", "Ensuite", "Enfin"), sauf si l'utilisateur le demande explicitement.
- Fil conducteur : Chaque paragraphe doit faire avancer un fil conducteur unique (ex: chaîne de causalité, passage du général au particulier, ou une séquence préparation → action → résultat). L'ordre doit être déductible par la compréhension du sens.
- Rétroaction : seul le feedback global (`overallFeedback`) est possible (pas de message par étape) — gradue-le par niveau de maîtrise et renvoie à la logique à reconstituer (cf. RÈGLES PÉDAGOGIQUES).

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
- \`taskDescription\` : Une consigne claire (Markdown supporté).
- \`paragraphs\` : Un tableau de chaînes de caractères (paragraphes) initialement présentés dans le **bon ordre** logique dans le JSON. Utilise \`**mot**\` pour le gras, \`*mot*\` pour l'italique.
- \`overallFeedback\` : tableau de 4 objets pour le score final (0-25, 26-50, 51-75, 76-100).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul. Exemples : \`\\\\( \\\\frac{1}{2} \\\\)\`, \`\\\\( \\\\sqrt{2} \\\\)\`, \`\\\\( \\\\alpha \\\\)\`, \`\\\\( x^{2} \\\\)\`, \`\\\\( \\\\mathbb{R} \\\\)\`, \`\\\\( \\\\sin(\\\\theta) \\\\)\`, \`\\\\( \\\\sum_{k=0}^{n} k \\\\)\`, \`\\\\( x \\\\geq 0 \\\\)\`, \`\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)\`.

# EXEMPLE DE RENDU

```json
{
  "taskDescription": "Remettez ces éléments dans l'ordre pour reconstituer la chaîne de causalité du réchauffement climatique.",
  "paragraphs": [
    "Les activités humaines, principalement la combustion d'énergies fossiles, rejettent massivement du **dioxyde de carbone** dans l'atmosphère.",
    "Ce surplus de gaz renforce l'effet de serre naturel, empêchant une partie du rayonnement infrarouge de quitter la Terre.",
    "L'énergie ainsi piégée provoque une augmentation progressive de la température moyenne de l'air et des océans.",
    "Ce réchauffement global entraîne la fonte des glaciers et une élévation préoccupante du niveau des mers."
  ],
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Reprends la chaîne de cause à effet, étape par étape, depuis l'origine."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Bon début de mise en ordre : cherche ce qui déclenche l'étape suivante."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Bonne logique d'ensemble : vérifie l'ordre de deux étapes voisines."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Parfait : la chaîne de causalité est dans le bon ordre."
    }
  ]
}
```
