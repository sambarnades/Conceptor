# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.DragQuestion]

- Nombre d'étiquettes : Au minimum 4 étiquettes à classer, réparties de manière équilibrée entre les zones || Exactement [NOMBRE_ELEMENTS] étiquettes à classer.
- Nombre de zones : Entre 2 et 6 zones de dépôt (catégories), adaptées au sujet.
- Labels des zones : Les noms des zones doivent être courts et explicites (1 à 3 mots).
- Texte des étiquettes : Chaque étiquette doit être concise (1 à 4 mots maximum).
- Unicité : Chaque étiquette doit appartenir à exactement une seule zone correcte.
- Équilibre : Répartis les étiquettes de façon relativement équilibrée entre les zones (pas de zone vide, pas de zone surchargée).
- Les indices et rétroactions par zone sont possibles dans `_native.tipsAndFeedback` : `tip`, `feedbackOnCorrect`, `feedbackOnIncorrect`. Respecte les réglages demandés ; sinon conserve les valeurs par défaut.

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
L'objet doit contenir :
- `title` : Consigne courte expliquant ce que l'élève doit faire (ex : "Classez chaque verbe dans le groupe correspondant"). C'est le seul texte affiché au-dessus de l'activité.
- `dropZones` : Tableau d'objets représentant les zones de dépôt (catégories). Chaque objet contient :
  - `label` : Le nom de la zone (catégorie).
  - `correctElements` : Tableau d'indices (entiers) des étiquettes qui appartiennent à cette zone (index basé sur le tableau `elements`, commençant à 0).
- `elements` : Tableau d'objets représentant les étiquettes à glisser. Chaque objet contient :
  - `text` : Le texte de l'étiquette (1 à 4 mots).
- `overallFeedback` : tableau de 4 objets pour le score final (0-25, 26-50, 51-75, 76-100).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : `\\( ... \\)`. N'utilise JAMAIS le signe `$` seul. Exemples : `\\( \\frac{1}{2} \\)`, `\\( \\sqrt{2} \\)`, `\\( \\alpha \\)`, `\\( x^{2} \\)`, `\\( \\mathbb{R} \\)`, `\\( \\sin(\\theta) \\)`, `\\( \\sum_{k=0}^{n} k \\)`, `\\( x \\geq 0 \\)`, `\\( \\forall x \\in \\mathbb{R} \\)`.

Les indices et rétroactions par zone sont possibles dans `_native.tipsAndFeedback` : `tip`, `feedbackOnCorrect`, `feedbackOnIncorrect`. Respecte les réglages demandés ; sinon conserve les valeurs par défaut.
`behaviour`: {"enableRetry":true,"enableCheckButton":true,"singlePoint":false,"applyPenalties":true,"enableScoreExplanation":true,"dropZoneHighlighting":"dragging","autoAlignSpacing":2,"enableFullScreen":true,"showScorePoints":true,"showTitle":true,"dragHandleVisibility":true}. `dropZoneHighlighting`: "dragging" | "always" | "never"; `autoAlignSpacing` ≥ 0.
`dropZones[]._native`: {"showLabel":true,"single":false,"autoAlign":true,"backgroundOpacity":100,"tipsAndFeedback":{"tip":"","feedbackOnCorrect":"","feedbackOnIncorrect":""}}.
`elements[]._native`: {"multiple":false,"backgroundOpacity":100}; `backgroundOpacity`: 0–100.

# EXEMPLE DE RENDU

```json
{
  "title": "Classez chaque verbe dans le groupe correspondant",
  "dropZones": [
    {
      "label": "1er groupe",
      "correctElements": [
        0,
        1,
        2
      ]
    },
    {
      "label": "2e groupe",
      "correctElements": [
        3,
        4
      ]
    },
    {
      "label": "3e groupe",
      "correctElements": [
        5,
        6,
        7
      ]
    }
  ],
  "elements": [
    {
      "text": "marcher"
    },
    {
      "text": "parler"
    },
    {
      "text": "chanter"
    },
    {
      "text": "finir"
    },
    {
      "text": "choisir"
    },
    {
      "text": "aller"
    },
    {
      "text": "être"
    },
    {
      "text": "avoir"
    }
  ],
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Reprends comment on reconnaît le groupe d'un verbe à sa terminaison à l'infinitif."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Bon début : revois les verbes que tu as hésité à classer."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Bien : un ou deux verbes sont encore mal classés."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Parfait : chaque verbe est dans le bon groupe."
    }
  ]
}
```
