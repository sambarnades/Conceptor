# Checklist : Ajouter DragAndDrop (Glisser-déposer) dans le QuizSet Mixte

## Contexte

Le QuizSet Mixte (`H5P.QuestionSet`) supporte actuellement 6 types de sous-questions : QCM, Vrai/Faux, Mots à trous, Glisser les mots, Surligner les mots, Rédaction. L'objectif est d'ajouter **DragAndDrop** (`H5P.DragQuestion 1.14`) comme 7ᵉ type, en **réutilisant** le processeur autonome existant.

**Prérequis déjà en place (aucune modification nécessaire) :**
- `H5P.QuestionSet-1.20/semantics.json` (ligne 127) : `H5P.DragQuestion 1.14` est déjà listé comme type nativement supporté
- `processors/index.js` (ligne 302) : le mapping `libraryToKey['H5P.DragQuestion'] = 'DragAndDrop'` existe déjà
- `processors/index.js` (lignes 112-124) : les métadonnées DragAndDrop (machineName, version, extraDependencies) sont déjà enregistrées
- `processors/index.js` (lignes 342-370) : `processQuizSetItem()` charge déjà le processeur et appelle `transformForQuizSet()` si disponible
- `QuizSet.js` (lignes 88-107) : les dépendances dynamiques sont déjà collectées pour chaque sous-type via `getLibraryMetadata()`
- `prompt-generator.js` : utilise les clés de traduction `QUIZSET_*`, aucun code spécifique par type

---

## Étape 1 — Processeur `transformForQuizSet()`

**Fichier** : `js/h5p/processors/DragAndDrop.js`

- [x] Ajouter la méthode `transformForQuizSet(question)` dans l'objet `export default { ... }`, après `process:`
  - Appelle `this.process(question.params)` pour calculer le layout et construire la structure H5P complète
  - Réécrit `question.params` avec le résultat retourné
  - Retourne `question`

---

## Étape 2 — Mélange des étiquettes DragQuestion dans QuizSet

**Fichier** : `js/h5p/h5p-creator.js`

- [x] Dans `handleH5PCreation()`, après le bloc de mélange DragAndDrop autonome et avant le deep clone `originalJson`, ajouter un bloc Fisher-Yates pour mélanger les éléments des sous-questions DragQuestion dans un QuizSet

---

## Étape 3 — JSON Healer : support DragQuestion dans QuizSet

**Fichier** : `js/h5p/json-healer.js`

- [x] 3a. `healStructureForActivity()` — validation structurelle DragQuestion (dropZones, elements, correctElements, title)
- [x] 3b. `cleanAllTexts()` — commentaire documentant le support DragQuestion (nettoyé par le récursif global)

---

## Étape 4 — Éditeur JSON : schéma, normalisation, dénormalisation

**Fichier** : `js/editor/content-detector.js`

- [x] 4a. Option DragQuestion dans le select `library` avec `label: 'h5p_drag_and_drop_name'` (clé existante)
- [x] 4b. Schéma DragQuestion dans `params.schemas` avec layoutSettings, dropZones, elements (multiCheckbox zoneIndices), overallFeedback
- [x] 4c. Normalisation QuizSet : conversion `correctElements → zoneIndices` dans `normalizeDataForEditor()`
- [x] 4d. Dénormalisation QuizSet : conversion `zoneIndices → correctElements` dans `denormalizeDataForSave()` (+ Essay)

---

## Étape 5 — Clé éditeur pour le type DragQuestion

**Réutilisation** : la clé `h5p_drag_and_drop_name` existe déjà dans les 11 fichiers de traduction — aucune nouvelle clé nécessaire.

- [x] Utiliser `label: 'h5p_drag_and_drop_name'` dans le schéma QuizSet (étape 4a)

---

## Étape 6 — Prompt template de base

**Fichier** : `assets/data/prompts/quizset.md`

- [x] Ajouter `- **Glisser-déposer** (\`H5P.DragQuestion\` 1.14)` dans la section "Variété"
- [x] Ajouter le point 7 dans les détails des params par type
- [x] Ajouter un exemple DragQuestion dans le bloc JSON d'exemple

---

## Étape 7 — Prompts QuizSet dans les 11 fichiers de traduction

**11 fichiers** : `js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json`

Pour chaque fichier, modifier 3 clés de prompt :

### 7a. `QUIZSET_REGLES_SPECIFIQUES` — ajouter DragQuestion

- [ ] `fr.js` — `en.js` — `es.js` — `de.js` — `it.js` — `nl.js` — `pt.js` — `ar.js` — `zh.js` — `jp.js` — `el.js`

### 7b. `QUIZSET_STRUCTURE_JSON` — ajouter les détails params

- [ ] `fr.js` — `en.js` — `es.js` — `de.js` — `it.js` — `nl.js` — `pt.js` — `ar.js` — `zh.js` — `jp.js` — `el.js`

### 7c. `QUIZSET_EXEMPLE_RENDU` — ajouter un exemple DragQuestion

- [ ] `fr.js` — `en.js` — `es.js` — `de.js` — `it.js` — `nl.js` — `pt.js` — `ar.js` — `zh.js` — `jp.js` — `el.js`

---

## Étape 8 — Emergency Help (EH) dans les 11 fichiers de traduction

- [x] Ajouter la clé `eh_quizset_rule_dragquestion` dans les 11 fichiers
- [x] Mettre à jour `eh_quizset_desc` pour mentionner le glisser-déposer
- [x] Mettre à jour `eh_quizset_good_example` pour mentionner le glisser-déposer

---

## Étape 9 — Export document (DOCX / ODT / PDF)

**Fichier** : `js/export/document-formatter.js`

L'export utilise le JSON **original** (avant processeur). `formatQuizSet()` dispatch vers les types de questions. Les fonctions réutilisent la même logique que le formatteur autonome `formatDragAndDrop()` : grille de travail complète, étiquettes à découper, grille complétée, tableau récapitulatif.

- [x] 9a. Dispatch dans `formatQuizSet()` — partie énoncé : `formatDragQuestionStatement(params, sections)`
- [x] 9b. Dispatch dans `formatQuizSet()` — partie correction : `formatDragQuestionCorrection(params, sections)`
- [x] 9c. Fonction `formatDragQuestionStatement()` — grille de travail + étiquettes à découper (via `splitIntoBalancedGroups`)
- [x] 9d. Fonction `formatDragQuestionCorrection()` — grille complétée + tableau récapitulatif

---

## Étape 10 — Vérification et tests

### 10a. Vérification manuelle du pipeline complet

**Génération IA :**
- [ ] Sélectionner l'activité "Quiz Mixte" et vérifier que le prompt inclut `H5P.DragQuestion 1.14`
- [ ] Générer un quiz — vérifier qu'une sous-question DragQuestion est bien créée
- [ ] Vérifier que les étiquettes sont mélangées dans le JSON

**Éditeur JSON :**
- [ ] Le type "Glisser-déposer" apparaît dans le select
- [ ] Les champs éditeur fonctionnent : layout, dropZones, elements avec multiCheckbox
- [ ] Sauvegarder → le .h5p est régénéré correctement

**Téléchargement et lecture :**
- [ ] Le .h5p s'ouvre dans un lecteur H5P (Lumi, h5p.org)

**Export document :**
- [ ] DOCX : la sous-question DragQuestion apparaît avec la grille de travail, les étiquettes et la correction
- [ ] PDF : même rendu
- [ ] ODT : même rendu

**Emergency Help :**
- [ ] Le bouton d'aide affiche les règles DragQuestion

---

## Résumé des fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `js/h5p/processors/DragAndDrop.js` | + `transformForQuizSet()` |
| `js/h5p/h5p-creator.js` | + mélange éléments DragQuestion dans QuizSet |
| `js/h5p/json-healer.js` | + validation DragQuestion dans boucle QuizSet |
| `js/editor/content-detector.js` | + schéma, normalisation, dénormalisation |
| `js/export/document-formatter.js` | + dispatch DragQuestion + 2 fonctions formatage complet |
| `assets/data/prompts/quizset.md` | + type, détails params, exemple |
| `js/locales/*.json` (11 fichiers) | + 3 clés prompt QUIZSET + 3 clés EH |
