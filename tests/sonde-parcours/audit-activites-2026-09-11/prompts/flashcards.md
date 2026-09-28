# CONTEXTE PÉDAGOGIQUE
- Ton rôle : enseignant de géographie. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : Nommer les capitales, avec showSolutionsRequiresInput=false, caseSensitive=false et randomCards=false. Ajouter un indice utile.
- Ton public : CM2

# RÈGLES SPÉCIFIQUES POUR [H5P.Flashcards]
- Nombre de cartes : 3 cartes.
- Format question → réponse : Chaque carte est une question courte au recto et une réponse en UN SEUL mot ou un nombre au verso. L'élève tape sa réponse et elle est vérifiée à l'identique : la réponse doit donc être univoque (une seule réponse correcte possible). Évite les relations ambiguës où plusieurs réponses sont valides (ex : auteur -> œuvre, pays -> fleuve).
- Consigne : Formule la consigne ainsi : « Réponds à chaque question. »

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
- **LaTeX :** Pour les formules mathématiques dans les champs `text` et `tip`, utilise le format LaTeX : `\\( ... \\)`. Exemples : `\\( \\frac{1}{2} \\)`, `\\( \\alpha \\)`, `\\( x^{2} \\)`, `\\( \\mathbb{R} \\)`.

# SOURCES
- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
France : Paris, traversée par la Seine. Italie : Rome, traversée par le Tibre. Espagne : Madrid, au centre du pays.
---

# STRUCTURE DU JSON ATTENDUE
- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet doit contenir :
  - \`title\` : Un titre pertinent pour l'activité.
  - \`description\` : Une consigne claire pour l'élève.
  - \`cards\` : Un tableau d'objets, où chaque objet représente une carte (flashcard) et contient :
    - \`text\` : La question posée à l'élève (recto). Doit être courte et univoque.
    - \`answer\` : La réponse attendue (verso), telle que l'élève doit la taper. Règles de normalisation : un seul mot simple ou un nombre (pas de mots composés), minuscules (sauf noms propres), sans article ni ponctuation, nombres en chiffres.
    - \`tip\` (optionnel) : Indice pour aider l'élève. Tu peux utiliser \`**mot**\` pour le gras et \`*mot*\` pour l'italique.

- Dans `behaviour`, `showSolutionsRequiresInput` indique si une saisie est exigée avant la solution. Conserve les crédits des images fournies ; n’invente aucun fichier média.

# EXEMPLE DE RENDU
```json
{
  "title": "Révisions de culture générale",
  "description": "Réponds à chaque question.",
  "cards": [
    {
      "text": "Quelle est la capitale de l'Espagne ?",
      "answer": "madrid",
      "tip": "Située au centre de la péninsule *ibérique*."
    },
    {
      "text": "Combien font 7 × 8 ?",
      "answer": "56",
      "tip": "Table du **7**."
    },
    {
      "text": "Que signifie « cat » en français ?",
      "answer": "chat",
      "tip": "Animal de compagnie *félin*."
    },
    {
      "text": "En quelle année a eu lieu la prise de la Bastille ?",
      "answer": "1789",
      "tip": "Début de la **Révolution française**."
    },
    {
      "text": "Quel est le symbole chimique du fer ?",
      "answer": "Fe",
      "tip": "Du latin *ferrum*."
    }
  ],
  "behaviour": {
    "showSolutionsRequiresInput": true,
    "randomCards": false,
    "caseSensitive": false
  }
}
```
