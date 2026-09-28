# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.MarkTheWords]

- Nombre de mots : Paragraphe d'au minimum 50 mots avec au moins 5 mots à surligner || [NOMBRE_ELEMENTS] mots.
- Rétroaction : seul le feedback global (`overallFeedback`) est possible (pas de message par mot) — gradue-le par niveau de maîtrise et renvoie à la notion (cf. RÈGLES PÉDAGOGIQUES).

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
- **LaTeX :** Le composant MarkTheWords ne supporte PAS le LaTeX dans le texte à marquer (`textField`). Le LaTeX sera automatiquement converti en caractères Unicode. Tu peux utiliser LaTeX `\\( ... \\)` dans la consigne (`taskDescription`). Exemples : `\\( \\frac{1}{2} \\)`, `\\( \\alpha \\)`, `\\( x^{2} \\)`.

# SOURCES
- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
[RAG]
---

# STRUCTURE DU JSON ATTENDUE
- `behaviour.enableCheckButton` (true): Afficher le bouton Vérifier. Décochez seulement si la vérification est automatique ou déclenchée par le conteneur.
- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
L'objet doit contenir :
- \`taskDescription\` : Une consigne claire et engageante. Tu peux utiliser \`**mot**\` pour le gras et \`*mot*\` pour l'italique uniquement ici.
- \`textField\` : Le texte complet contenant les mots à marquer.
  - **MARQUAGE :** Utilise UNIQUEMENT une astérisque simple \`*mot*\` pour marquer chaque mot. N'utilise JAMAIS le gras markdown \`**mot**\` dans textField.
  - **UN MOT PAR MARQUEUR :** Chaque mot doit être marqué individuellement. (Ex: \`*mot1* *mot2*\` est correct ; \`*mot1 mot2*\` est incorrect).
  - **ESPACEMENT :** Il faut TOUJOURS un espace avant le \`*\` ouvrant et un espace après le \`*\` fermant (sauf ponctuation). (Ex: \`le *peuple* renverse\` est correct).
  - **APOSTROPHE :** Sépare toujours l'apostrophe du marqueur par un espace. (Ex: \`l' *oiseau*\` est correct ; \`l'*oiseau*\` est incorrect).
- \`overallFeedback\` : (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 4 objets pour le feedback final (0-25, 26-50, 51-75, 76-100).

# EXEMPLE DE RENDU

```json
{
  "taskDescription": "Cliquez sur les **noms propres** dans le texte suivant.",
  "textField": "*Paris* est la capitale de la *France*. C'est l' *Europe* qui nous intéresse.",
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Rappelle-toi qu'un nom propre désigne une personne ou un lieu précis et prend une majuscule."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Tu en as trouvé quelques-uns : vérifie chaque mot qui porte une majuscule."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Bien : il te reste un ou deux noms propres à repérer."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Parfait : tu as identifié tous les noms propres."
    }
  ]
}
```


Respecte les quatre options demandées. Désactive Vérifier uniquement si le conteneur déclenche la vérification : ce type ne propose pas de correction automatique. Pour le média facultatif, utilise uniquement un fichier ou une URL fourni.
behaviour: enableRetry, enableSolutionsButton, enableCheckButton, showScorePoints (true | false). media.type.library: H5P.Image 1.1 | H5P.Audio 1.5 | H5P.Video 1.6.
