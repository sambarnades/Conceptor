# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [H5P.Dictation]
- Nombre de phrases : 5 phrases || [NOMBRE_ELEMENTS] phrases.
- Phrases COURTES (8 à 15 mots), naturelles à l'oral : elles seront lues à voix haute par une synthèse vocale, puis écrites par l'élève.
- Orthographe, accents, casse et ponctuation IRRÉPROCHABLES : chaque phrase est la solution EXACTE de la dictée (la correction compare mot à mot).
- Texte 100 % brut : AUCUN Markdown, HTML ou LaTeX dans les phrases. Écris les nombres en toutes lettres si l'objectif porte sur l'orthographe.
- Difficulté progressive : de la phrase la plus simple à la plus difficile, en ciblant les points d'orthographe/grammaire de l'objectif (accords, homophones, terminaisons…).
- Variante d'orthographe acceptée (optionnel, avec parcimonie) : ajoute une barre verticale collée derrière le mot suivie de l'alternative (ex : "clé|clef").
- Consigne (`taskDescription`) : brève, invite à écouter puis écrire.
- `description` (optionnel, par phrase) : court libellé affiché au-dessus du champ de saisie (ex : "Phrase 1", nom du locuteur d'un dialogue).
- NE PRODUIS AUCUN AUDIO : les fichiers audio sont synthétisés automatiquement (voix normale + lecture lente) après la génération.
- Rétroaction : seul le feedback global (`overallFeedback`) est possible (pas de message par phrase) — 4 tranches graduées par niveau de maîtrise, chacune propose une stratégie d'écoute/relecture et renvoie à la notion (cf. RÈGLES PÉDAGOGIQUES).

# RÈGLES PÉDAGOGIQUES
(communes — cf. prompt_regles_pedagogiques_communes)

# SOURCES
- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
[RAG]
---

# STRUCTURE DU JSON ATTENDUE
- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par `{` et finir par `}`. Aucun autre texte ou commentaire.
- L'objet racine DOIT contenir `title`, `taskDescription` et `sentences`.
- 1. `title` : Le titre de l'activité (texte simple, **sans** Markdown ni HTML).
- 2. `taskDescription` : La consigne affichée au-dessus de la dictée (texte simple ou HTML léger).
- 3. `sentences` : Tableau d'objets, un par phrase à dicter.
- 4. `sentences[].text` : La phrase EXACTE à écrire (texte brut strict : ni Markdown, ni HTML, ni LaTeX).
- 5. `sentences[].description` (optionnel) : Court libellé au-dessus du champ de saisie.
- 6. `overallFeedback` : Tableau de 4 tranches { "from", "to", "feedback" } couvrant 0 à 100 sans chevauchement ni trou (0-25 / 26-50 / 51-75 / 76-100).

# EXEMPLE DE RENDU
```json
{
  "title": "Dictée : le printemps",
  "taskDescription": "Écoute chaque phrase puis écris-la sans faute.",
  "sentences": [
    { "text": "Les hirondelles reviennent au début du printemps." },
    { "text": "Dans le jardin, les cerisiers sont déjà en fleurs." },
    { "text": "Nous écoutons chaque matin le chant des oiseaux." }
  ],
  "overallFeedback": [
    {
      "from": 0,
      "to": 25,
      "feedback": "Réécoute chaque phrase en lecture lente et écris-la mot après mot, puis relis-toi."
    },
    {
      "from": 26,
      "to": 50,
      "feedback": "Bon début : appuie-toi sur la lecture lente pour repérer les mots difficiles et vérifie les accords."
    },
    {
      "from": 51,
      "to": 75,
      "feedback": "Presque : relis ta dictée en vérifiant les terminaisons, les accents et les homophones."
    },
    {
      "from": 76,
      "to": 100,
      "feedback": "Bravo : les phrases sont fidèles, accents et accords compris."
    }
  ]
}
```

- Réglages linguistiques : `behaviour.wordSeparator`, `overrideRTL` (`auto`/`on`/`off`), `autosplit` et `alternateSolution` (`first`/`all`). Respecte la langue et les réglages demandés.
