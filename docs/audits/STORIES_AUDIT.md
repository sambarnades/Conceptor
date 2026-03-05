# STORIES - Corrections et Ameliorations suite a l'Audit Caramel

**Date** : 12 Fevrier 2026
**Contexte** : Ce fichier liste toutes les actions à realiser suite a l'audit complet du programme de generation des activites Caramel. Chaque story est autonome et peut etre transmise telle quelle à un developpeur ou à une IA pour execution.

---

## Instructions pour l'IA

**Avant de commencer** : Lis ce fichier en entier. Repere la derniere case cochee [x] dans le suivi ci-dessous. Reprends a la premiere case non cochee [ ]. Quand tu as termine et valide une etape, coche-la immediatement [x] avant de passer a la suivante.

**Regles** :
- Ne modifie JAMAIS le contenu pedagogique (texte de questions, reponses, definitions)
- Valide chaque etape avant de la cocher (pas d'erreur console, pas de regression)
- Si une etape echoue, ne la coche pas et signale le probleme
- Lis CLAUDE.md pour comprendre l'architecture du projet

---

## Suivi d'avancement

### EPIC 1 : Healing structurel + validation metier
- [x] 1.1a - Phase 1 : Implementer `healStructureForActivity()` dans `json-healer.js`
- [x] 1.1b - Phase 2 : Ajouter les validations metier dans `validators.js` (`getTypeSpecificErrors`)
- [x] 1.1c - Phase 3 : Integrer le healer dans `saveChanges()` de `json-editor/index.js`
- [x] 1.1d - Phase 3 : Integrer le healer dans `h5p-creator.js` (apres `healActivitySpecificFields`)
- [x] 1.1e - Verifier que le JSON affiche dans la modale de generation est DEJA heale (l'utilisateur ne doit voir que du JSON propre)
- [x] 1.2 - Ajouter les cles de traduction pour les erreurs de validation (11 langues)

### EPIC 3 : Robustesse du parsing LLM
- [x] 3.1 - Ameliorer `extractJsonContent` dans `llm.js`

### EPIC 4 : Experience developpeur
- [x] 4.1 - Ajouter le mode debug activable par `?debug` dans l'URL
- [x] 4.2 - Ajouter le bouton toggle JSON brut/heale dans la floating-toolbar (mode debug uniquement)

### EPIC 5 : Messages d'erreur utilisateur
- [x] 5.1 - Classifier et ameliorer les messages d'erreur de generation

### EPIC 6 : Coherence des donnees post-edition
- [x] 6.1 - Creer les tests de non-regression edition → export
- [x] 6.2 - Verifier originalJsonData vs jsonData pour tous les types

### EPIC 7 : Securite et robustesse
- [x] 7.1 - Verifier l'echappement des contenus dans les exports
- [x] 7.2 - Verifier les cas limites dans les processeurs

### EPIC 8 : Documentation
- [x] 8.1 - Documenter le flux complet de donnees

### EPIC 9 : Qualite des exports
- [x] 9.1 - Definir la langue du document dans les exports DOCX/ODT/PDF

### EPIC 10 : Monitoring des dependances
- [ ] 10.1 - Creer le workflow n8n de verification des versions JS

---

## Comment utiliser ce fichier

Chaque story est numerotee et independante. Pour demander une correction ou amelioration :
- Copier la story concernee
- La transmettre avec le contexte : "Voici une story issue de l'audit Caramel. Realise cette story."
- Chaque story contient : l'objectif, les fichiers concernes, ce qu'il faut faire, et les criteres de validation

---

## EPIC 1 : HEALING STRUCTUREL + VALIDATION METIER

### Principe general

Le JSON genere par l'IA peut avoir deux types de problemes :
1. **Problemes structurels/metadonnees** : champs manquants qui ont des valeurs par defaut previsibles (behaviour, overallFeedback, subContentId, etc.). Ce ne sont PAS du contenu pedagogique.
2. **Problemes de contenu** : texte de question vide, reponses manquantes, definitions absentes. Ce SONT du contenu pedagogique que l'IA aurait du generer.

**Strategie** : Avant de rejeter un JSON via la validation metier, on tente d'abord un **healing structurel** qui complete automatiquement tout ce qui n'est pas du texte pedagogique. La validation ne rejette ensuite QUE les vrais manques de contenu.

Le module `json-healer.js` existe deja et corrige :
- Structure aplatie QuizSet (oubli de `params`)
- Versions de bibliotheques manquantes/erronees
- LaTeX mal formate (auto-wrap, conversion Unicode)
- Multi-mots MarkTheWords/DragText

La Story 1.1 etend ce healer avec un **healing structurel par type d'activite** (phase 1), puis la validation metier (phase 2) ne rejette que les vrais manques de contenu.

---

### Story 1.1 - Healing structurel par type + validation metier dans l'editeur

**Priorite** : HAUTE
**Objectif** : Avant de rejeter un JSON, tenter de reparer automatiquement les champs structurels manquants (tout ce qui n'est PAS du texte de question/reponse/definition). Puis valider uniquement le contenu pedagogique irreparable.

**Fichiers concernes** :
- `js/modules/json-healer.js` (etendre avec une fonction `healStructure`)
- `js/modules/json-editor/validators.js` (ajouter validation metier post-healing)
- `js/modules/json-editor/index.js` (appeler le healer avant validation dans `saveChanges`)
- `js/modules/utils.js` (pour `generateUUID` deja existant)

**PHASE 1 : Healing structurel (json-healer.js)**

Ajouter une fonction exportee `healStructureForActivity(data, moduleKey)` dans `json-healer.js`.
Cette fonction recoit les donnees brutes et le moduleKey, et complete les champs structurels manquants.

**Principe fondamental** : On NE touche JAMAIS au contenu pedagogique (texte de questions, reponses, definitions, indices). On ne complete QUE les metadonnees, les parametres de comportement, et les champs techniques.

Regles de healing par type :

**H5P commun** (tous les types) :
- Si `overallFeedback` absent → injecter `[{from: 0, to: 100, feedback: ""}]`
- Si `behaviour` absent → injecter `{enableRetry: true, enableSolutionsButton: true}`

**QuizSet / QuizSetQCM / QuizSetVF** :
- Si `progressType` absent → injecter `"dots"`
- Si `passPercentage` absent → injecter `50`
- Pour chaque question dans `questions[]` :
  - Si `subContentId` absent → generer un UUID
  - Si `library` present sans version (ex: `"H5P.MultiChoice"` au lieu de `"H5P.MultiChoice 1.16"`) → ajouter la version depuis la map de versions existante dans json-healer.js (ligne 148-155)
  - Si `library` present et `params` absent mais d'autres champs existent (question, answers, etc.) → envelopper dans `params` (deja fait par healJsonObject, mais re-verifier ici aussi)
  - Si `metadata` absent → injecter `{title: "Question"}`

**MultipleChoice** :
- Si `answers[].correct` absent mais `answers[].iscorrect` present → renommer `iscorrect` en `correct` (convertir 1/0 en true/false)
- Si `answers[].text` absent mais `answers[].answer` present → renommer `answer` en `text`

**TrueFalse** :
- Si `correct` est string (`"true"` / `"false"`) → convertir en booleen
- Si `l10n` absent → injecter objet vide (le processeur ajoutera les traductions)

**Flashcards** :
- Si `cards[].image` absent → injecter `{path: "", alt: ""}`

**Crossword** :
- Si `words[].clue` absent mais `words[].hint` present → renommer `hint` en `clue`
- Si `words[].fixWord` absent → injecter `false`

**Chart** :
- Si `listOfTypes[].color` absent → injecter une couleur par defaut (palette rotative : `#1f4fff`, `#5b2e90`, `#ff7a18`, `#22c55e`, `#ef4444`)
- Si `graphMode` absent → injecter `"bar"`

**Timeline** :
- Si `timeline.type` absent → injecter `"default"`
- Pour chaque `timeline.date[]` :
  - Si `startDate` est string au format "YYYY-MM-DD" → convertir en `"YYYY,M,D"`

**FindTheWords** :
- Si `wordList` est un tableau (au lieu d'une string) → joindre avec `,`

**Millionnaire (moodle_millionnaire)** :
- Si `questions[].badanswer` est une string (au lieu d'un tableau) → convertir en tableau `[badanswer]`
- Si `questions[].badanswer` a moins de 3 elements → completer avec des strings vides "" (le healing ne genere pas de texte, mais evite le crash)

**Appariement (moodle_appariement)** :
- Si `pairs[].question` ou `pairs[].answer` est null/undefined → mettre string vide ""

**QCM (moodle_qcm)** :
- Si `questions[].answers[].iscorrect` present mais `correct` absent → renommer et convertir (1 → true, 0 → false)

**Page (moodle_page)** :
- Si `blocks[].data` absent → injecter `{}`

**PHASE 2 : Validation metier (validators.js)**

Ajouter dans `getTypeSpecificErrors()` (qui existe deja a la ligne 355) les validations suivantes.
Ces validations ne s'executent QU'APRES le healing, donc elles ne portent QUE sur le contenu pedagogique irreparable :

**QuizSet / QuizSetQCM / QuizSetVF** :
- `questions` doit etre un tableau avec au moins 1 element → sinon erreur "Le quiz doit contenir au moins une question"
- Chaque question doit avoir `library` → sinon erreur "La question {i} n'a pas de type defini"

**FindTheWords** :
- `wordList` (apres healing en string) doit etre non vide → sinon erreur "La liste de mots est vide"

**FillInTheBlanks** :
- `questions` doit etre un tableau non vide → sinon erreur "Au moins une phrase est requise"
- (La validation `hasBlanks` existe deja)

**MarkTheWords** :
- `textField` doit etre non vide → sinon erreur "Le texte est vide"
- (La validation `hasBlanks` existe deja)

**DragTheWords** :
- `textField` doit etre non vide → sinon erreur "Le texte est vide"
- (La validation `hasBlanks` existe deja)

**Crossword** :
- `words` doit etre un tableau non vide → sinon erreur "Au moins un mot est requis"
- Chaque mot doit avoir `answer` non vide → sinon erreur "Le mot {i} n'a pas de reponse"
- Chaque mot doit avoir `clue` non vide → sinon erreur "Le mot {i} n'a pas d'indice"

**Flashcards** :
- `cards` doit etre un tableau non vide → sinon erreur "Au moins une carte est requise"
- Chaque carte doit avoir `text` non vide → sinon erreur "La carte {i} n'a pas de question"
- Chaque carte doit avoir `answer` non vide → sinon erreur "La carte {i} n'a pas de reponse"

**DialogCards** :
- `dialogs` doit etre un tableau non vide → sinon erreur "Au moins un dialogue est requis"
- Chaque dialogue doit avoir `text` non vide → sinon erreur "Le dialogue {i} n'a pas de recto"
- Chaque dialogue doit avoir `answer` non vide → sinon erreur "Le dialogue {i} n'a pas de verso"

**Timeline** :
- `timeline.date` doit etre un tableau non vide → sinon erreur "Au moins un evenement est requis"

**Essay** :
- `keywords` doit etre un tableau non vide → sinon erreur "Au moins un mot-cle est requis"

**Summary** :
- `summaries` doit etre un tableau non vide → sinon erreur "Au moins un groupe est requis"

**SingleChoiceSet** :
- `choices` doit etre un tableau non vide → sinon erreur "Au moins une question est requise"
- Chaque choix doit avoir `question` non vide → sinon erreur "La question {i} est vide"

**SortParagraphs** :
- `paragraphs` doit etre un tableau non vide → sinon erreur "Au moins un paragraphe est requis"

**MultipleChoice** :
- `answers` doit etre un tableau non vide → sinon erreur "Au moins une reponse est requise"
- (La validation `hasCorrectAnswer` existe deja)

**TrueFalse** :
- `question` doit etre une chaine non vide → sinon erreur "La question est vide"

**Chart** :
- `listOfTypes` doit etre un tableau non vide → sinon erreur "Au moins une donnee est requise"

**Millionnaire (moodle_millionnaire)** :
- `questions` doit avoir exactement 6 elements → sinon erreur "Le jeu doit contenir exactement 6 questions"
- Chaque question doit avoir `question` non vide → sinon erreur "La question {i} est vide"
- Chaque question doit avoir `goodanswer` non vide → sinon erreur "La question {i} n'a pas de bonne reponse"

**Appariement (moodle_appariement)** :
- `pairs` doit etre un tableau non vide → sinon erreur "Au moins une paire est requise"
- Chaque paire doit avoir `question` et `answer` non vides → sinon erreur "La paire {i} est incomplete"

**QCM (moodle_qcm)** :
- `questions` doit etre un tableau non vide → sinon erreur "Au moins une question est requise"
- Chaque question doit avoir `text` non vide → sinon erreur "La question {i} est vide"
- (La validation `hasCorrectAnswer` existe deja)

**Glossaire (moodle_glossaire)** :
- `entries` doit etre un tableau non vide → sinon erreur "Au moins une entree est requise"
- Chaque entree doit avoir `concept` non vide → sinon erreur "L'entree {i} n'a pas de concept"
- Chaque entree doit avoir `definition` non vide → sinon erreur "L'entree {i} n'a pas de definition"

**Page (moodle_page)** :
- `blocks` doit etre un tableau non vide → sinon erreur "Au moins un bloc est requis"
- Chaque bloc doit avoir `type` non vide → sinon erreur "Le bloc {i} n'a pas de type"

**PHASE 3 : Integration dans le flux de l'editeur (index.js)**

Modifier `saveChanges()` dans `js/modules/json-editor/index.js` pour :
1. Recuperer les donnees via `getEditorData()`
2. **NOUVEAU** : Appeler `healStructureForActivity(data, moduleKey)` sur les donnees
3. Mettre a jour `editorState.currentData` avec les donnees healees
4. Valider via `getValidationErrors()` (qui inclut maintenant les validations metier)
5. Si erreurs → afficher et retourner null
6. Si OK → denormaliser et retourner

De meme, modifier le healing dans `h5p-creator.js` pour appeler `healStructureForActivity` juste apres `healActivitySpecificFields` (a la ligne 67), de sorte que le JSON original stocke soit deja propre structurellement.

**IMPORTANT : Le JSON affiche dans la modale de generation (sidebar droite) doit etre le JSON DEJA heale.** L'utilisateur ne doit jamais voir le JSON brut avec des champs manquants ou des types incorrects. Le healing s'applique AVANT l'affichage dans la modale, AVANT le stockage dans `originalJsonData`, et AVANT le traitement par le processeur H5P/Moodle. Ainsi, l'utilisateur n'y voit que du feu : le JSON qu'il voit est propre et complet. Le meme principe s'applique pour `moodle-creator.js`.

**Criteres de validation** :
- Un QuizSet avec une question sans `subContentId` → le healer ajoute le UUID, la validation passe
- Un QuizSet avec une question sans `params` → le healer enveloppe dans params, la validation passe
- Un QuizSet avec 0 questions → le healer ne peut rien faire (pas de contenu), la validation rejette
- Un MultipleChoice avec `iscorrect` au lieu de `correct` → le healer renomme, la validation passe
- Un TrueFalse avec `correct: "true"` (string) → le healer convertit en booleen, la validation passe
- Un Millionnaire avec `badanswer` string → le healer convertit en tableau, la validation passe
- Un Millionnaire avec 5 questions → la validation rejette (contenu manquant, pas reparable)
- Un FindTheWords avec `wordList: ["MOT1","MOT2"]` (tableau) → le healer joint en string, la validation passe
- Un Chart sans `color` → le healer ajoute les couleurs, la validation passe
- Un Flashcards avec une carte sans `text` → la validation rejette (contenu pedagogique manquant)

---

### Story 1.2 - Ajouter les cles de traduction pour les erreurs de validation metier

**Priorite** : HAUTE (depend de 1.1)
**Objectif** : Traduire tous les messages d'erreur de validation metier dans les 11 langues.

**Fichiers concernes** :
- `js/locales/fr.json` (et les 10 autres fichiers de langue)

**Ce qu'il faut faire** :
1. Ajouter les cles de traduction suivantes dans chaque fichier de langue :
   - `validation_empty_array` : "Ce champ doit contenir au moins un element"
   - `validation_missing_field` : "Le champ '{field}' est requis"
   - `validation_min_items` : "Ce champ doit contenir au moins {min} elements"
   - `validation_exact_items` : "Ce champ doit contenir exactement {count} elements"
   - `validation_must_contain_marker` : "Le texte doit contenir au moins un mot marque avec *asterisques*"
   - `validation_must_have_correct_answer` : "Au moins une reponse doit etre marquee comme correcte"
   - `validation_field_required_non_empty` : "Ce champ ne peut pas etre vide"

**Criteres de validation** :
- Les messages s'affichent dans la langue active de l'utilisateur
- Fallback en francais si traduction manquante

---

## EPIC 3 : ROBUSTESSE DU PARSING LLM

### Story 3.1 - Ameliorer l'extraction JSON depuis les reponses LLM

**Priorite** : BASSE
**Objectif** : Renforcer la fonction `extractJsonContent` pour gerer les cas limites de reponses LLM.

**Fichiers concernes** :
- `js/modules/llm.js` (fonction `extractJsonContent`, lignes 127-156)

**Ce qu'il faut faire** :
1. Ajouter la detection de bloc ```json sans espace apres ``` (ex: ` ```json{...}``` `)
2. Quand on cherche le premier `{` ou `[`, verifier que c'est bien le debut d'un JSON valide :
   - Compter les accolades/crochets ouvrants et fermants
   - Si le JSON est tronque (plus d'ouvrants que de fermants), essayer de trouver la fin correcte
3. Ajouter un log warning si du texte a ete ignore avant le JSON (pour debug)
4. Gerer le cas ou le LLM renvoie plusieurs blocs JSON (ne garder que le premier)

**Criteres de validation** :
- `extractJsonContent('Voici le JSON: ```json\n{"a":1}\n```')` retourne `'{"a":1}'`
- `extractJsonContent('Bien sur! {"a":1}')` retourne `'{"a":1}'`
- `extractJsonContent('{"a":1}')` retourne `'{"a":1}'`
- `extractJsonContent('[{"a":1}]')` retourne `'[{"a":1}]'`
- `extractJsonContent('')` leve une erreur

---

## EPIC 4 : EXPERIENCE DEVELOPPEUR

### Story 4.1 - Ajouter un mode debug activable par URL

**Priorite** : MOYENNE
**Objectif** : Permettre aux developpeurs d'activer des logs detailles pour diagnostiquer les problemes.

**Fichiers concernes** :
- `js/modules/utils.js` (ajouter la fonction de detection)
- `js/modules/llm.js` (logs LLM)
- `js/modules/h5p-creator.js` (logs healer)
- `js/modules/json-editor/index.js` (logs editeur)

**Ce qu'il faut faire** :
1. Dans `utils.js`, ajouter :
   ```javascript
   export const DEBUG = new URLSearchParams(window.location.search).has('debug');
   export function debugLog(module, ...args) {
       if (DEBUG) console.log(`[DEBUG][${module}]`, ...args);
   }
   ```
2. Remplacer les `console.log` existants par `debugLog` dans les modules critiques :
   - `llm.js` : Logs des requetes/reponses LLM
   - `h5p-creator.js` : Logs du healer (avant/apres)
   - `json-editor/index.js` : Logs de l'editeur (init, save, change)
3. Conserver les `console.error` et `console.warn` tels quels (toujours visibles)

**Criteres de validation** :
- Sans `?debug` dans l'URL, aucun log supplementaire dans la console
- Avec `?debug` dans l'URL, les logs detailles apparaissent avec le prefixe `[DEBUG][module]`
- Les erreurs et warnings restent visibles dans tous les cas

---

### Story 4.2 - Bouton toggle JSON brut/heale dans la modale de generation (mode debug)

**Priorite** : BASSE
**Objectif** : En mode debug, permettre de basculer entre le JSON initial (tel que recu du LLM) et le JSON corrige (apres healer) directement dans la modale de generation, via un simple bouton dans la barre d'outils existante.

**Fichiers concernes** :
- `js/modules/h5p-creator.js` (stocker le JSON brut avant healing)
- `js/modules/moodle-creator.js` (idem pour Moodle)
- `js/modules/ui.js` (ajout du bouton dans la toolbar, logique de toggle)
- `js/modules/utils.js` (pour la constante `DEBUG`)
- `index.html` (rien a modifier, le bouton est injecte dynamiquement)

**Ce qu'il faut faire** :

1. **Stocker le JSON brut** : Dans `h5p-creator.js` et `moodle-creator.js`, juste AVANT d'appeler les fonctions de healing, stocker une copie du JSON brut dans la notification :
   ```javascript
   // Avant le healing
   notification._debugRawJson = JSON.parse(JSON.stringify(jsonObj));
   // ... healing ...
   notification._debugHealedJson = JSON.parse(JSON.stringify(jsonObj));
   ```
   Ne stocker ces champs `_debug*` QUE si `DEBUG === true` (import depuis utils.js).

2. **Ajouter le bouton dans la floating-toolbar** : Dans `ui.js`, quand `DEBUG === true`, injecter un bouton supplementaire dans la div `<div class="floating-toolbar">` de la modale de generation :
   ```html
   <button class="toolbar-btn debug-json-btn" data-tooltip="JSON brut/corrigé" style="display:none;">
       <i class="fas fa-bug"></i>
       <span class="toolbar-btn-text">JSON brut</span>
   </button>
   ```
   Ce bouton :
   - N'apparait QUE si `?debug` est dans l'URL
   - N'est visible (`display:block`) QUE quand une generation a ete effectuee et que `_debugRawJson` existe dans la notification courante
   - Est insere a cote des boutons "Plein ecran" et "Verrouiller" existants

3. **Logique de toggle** : Au clic sur le bouton :
   - Si on affiche actuellement le JSON heale (etat par defaut) → remplacer le contenu du textarea/code par `_debugRawJson` et changer le label en "JSON brut" avec une icone/couleur differente (ex: orange)
   - Si on affiche le JSON brut → revenir au JSON heale (etat normal) et changer le label en "JSON corrige"
   - Le toggle est purement visuel, il ne modifie PAS les donnees reelles de la notification

4. **Nettoyage** : Quand la modale se ferme, remettre le toggle a l'etat par defaut (JSON heale)

**Criteres de validation** :
- Sans `?debug` dans l'URL → le bouton n'existe pas dans le DOM
- Avec `?debug` → le bouton apparait dans la floating-toolbar a cote de "Plein ecran" et "Verrouiller"
- Clic sur le bouton → le JSON affiche bascule entre version brute (LLM) et version corrigee (healer)
- Le label du bouton change pour indiquer quel JSON est actuellement affiche
- Le toggle ne modifie pas les donnees reelles, c'est purement de l'affichage
- Fermer et rouvrir la modale remet le toggle a l'etat par defaut

---

## EPIC 5 : MESSAGES D'ERREUR UTILISATEUR

### Story 5.1 - Ameliorer les messages d'erreur lors de l'echec de generation

**Priorite** : MOYENNE
**Objectif** : Quand la generation echoue, afficher un message clair avec des suggestions.

**Fichiers concernes** :
- `js/modules/h5p-creator.js` (fonction `handleError`, ligne 287)
- `js/modules/moodle-creator.js` (catch blocks dans chaque handler)
- `js/modules/notifications.js` (affichage des erreurs)
- `js/locales/fr.json` (et les 10 autres)

**Ce qu'il faut faire** :
1. Classifier les erreurs en categories :
   - `parse_error` : Le JSON genere par le LLM est invalide
   - `validation_error` : Le JSON est valide mais sa structure ne correspond pas au type attendu
   - `network_error` : Erreur reseau (timeout, serveur indisponible)
   - `packaging_error` : Erreur lors du packaging H5P/MBZ
2. Pour chaque categorie, definir un message utilisateur clair :
   - `parse_error` : "L'IA a genere un contenu non valide. Essayez de regenerer ou changez de modele."
   - `validation_error` : "Le contenu genere ne correspond pas au format attendu pour {activite}. Verifiez votre prompt."
   - `network_error` : "Impossible de contacter le serveur. Verifiez votre connexion internet."
   - `packaging_error` : "Erreur lors de la creation du fichier. Essayez de regenerer."
3. Dans les notifications d'erreur, afficher :
   - Le message utilisateur (traduit)
   - Un bouton "Details" pour voir l'erreur technique (collapse)

**Criteres de validation** :
- Un JSON invalide du LLM affiche "L'IA a genere un contenu non valide..."
- Un timeout affiche "Impossible de contacter le serveur..."
- Le bouton "Details" affiche l'erreur technique complete
- Les messages sont traduits dans les 11 langues

---

## EPIC 6 : COHERENCE DES DONNEES POST-EDITION

### Story 6.1 - Ajouter des tests de non-regression pour le flux edition -> export

**Priorite** : HAUTE
**Objectif** : Garantir que les modifications faites dans l'editeur sont correctement repercutees dans les fichiers exportes.

**Fichiers concernes** :
- Nouveau fichier : `tests/test-edit-export-flow.js` (ou dans un framework de test)

**Ce qu'il faut faire** :
1. Creer des tests unitaires pour chaque type d'activite qui verifient :
   - **Chargement** : `extractJsonFromNotification(notification)` retourne les bonnes donnees
   - **Detection** : `detectContentType(jsonData, titleKey)` retourne le bon moduleKey
   - **Normalisation** : `normalizeDataForEditor(data, moduleKey)` preserve toutes les donnees
   - **Denormalisation** : `denormalizeDataForSave(normalizedData, moduleKey)` retourne les donnees originales
   - **Round-trip** : `denormalize(normalize(data)) === data` pour chaque type
2. Creer des tests d'integration qui verifient :
   - Le JSON d'un QuizSet avec 3 questions, edite pour changer le texte d'une question, produit un H5P avec le texte modifie
   - Le JSON d'un Millionnaire edite pour changer une reponse, produit un MBZ avec la reponse modifiee
   - Le JSON d'un Glossaire edite pour ajouter une entree, produit un XML avec l'entree ajoutee
3. Utiliser les fichiers de `assets/data/examples/` comme donnees de test

**Criteres de validation** :
- Tous les tests passent
- Le round-trip normalisation/denormalisation est verifie pour chaque type
- Les tests couvrent au moins : QuizSet, Flashcards, Timeline, Crossword, FillInTheBlanks, MarkTheWords, DragTheWords, FindTheWords, Millionnaire, Appariement, QCM, Glossaire, Page

---

### Story 6.2 - Verifier la coherence originalJsonData vs jsonData apres edition pour tous les types

**Priorite** : HAUTE
**Objectif** : S'assurer que chaque type d'activite met correctement a jour `originalJsonData` ou `jsonData` dans la notification apres edition.

**Fichiers concernes** :
- `js/modules/notifications.js` (fonction `handleEditorSave`, ligne 1987)

**Ce qu'il faut faire** :
1. Verifier que `handleEditorSave` gere correctement CHAQUE type de notification :
   - `h5p` : `notification.originalJsonData = result.data` (OK, verifie)
   - `mbz` avec `titleKey === 'moodle_qcm_name'` : `notification.originalJsonData = result.data` (OK, verifie)
   - `mbz` avec `titleKey === 'moodle_millionnaire_name'` : `notification.jsonData = result.data` (a verifier : est-ce que le Millionnaire a besoin de originalJsonData ?)
   - `mbz` avec `titleKey === 'moodle_appariement_name'` : `notification.jsonData = result.data` (a verifier : meme question)
   - `mbz` avec `titleKey === 'elea_page_name'` : `notification.jsonData = result.data` + `notification.previewHtml = newPreviewHtml` (OK, verifie)
   - `xml` avec `titleKey === 'moodle_glossaire_xml_name'` : regeneration du XML (OK, verifie)
   - `xml` avec `titleKey === 'moodle_xml_name'` : regeneration du XML (OK, verifie)
2. Pour le Millionnaire et l'Appariement, verifier si les exports DOCX/PDF/ODT utilisent `jsonData` ou `originalJsonData` :
   - Dans `notifications.js` ligne 1509-1512 : `let jsonDataToExport = notification.originalJsonData || notification.jsonData`
   - Si `originalJsonData` est null (car Millionnaire ne le stocke pas a la creation), alors `jsonData` est utilise -> c'est correct
   - Si `originalJsonData` est null et `jsonData` est mis a jour par l'editeur -> les exports sont corrects
3. Documenter le comportement attendu pour chaque type dans un commentaire au-dessus de `handleEditorSave`

**Criteres de validation** :
- Le commentaire documente explicitement le comportement pour chaque type
- Aucune regression dans le flux edition -> export pour aucun type

---

## EPIC 7 : SECURITE ET ROBUSTESSE

### Story 7.1 - Verifier l'echappement des contenus utilisateur dans les exports

**Priorite** : MOYENNE
**Objectif** : S'assurer qu'aucune injection HTML/XML n'est possible via les contenus generes par le LLM.

**Fichiers concernes** :
- `js/modules/moodle-creator.js` (echappement XML)
- `js/modules/h5p-creator.js` (echappement HTML)
- `js/modules/utils.js` (fonctions utilitaires)
- `js/modules/moodle-formats.js` (generation XML/GIFT)

**Ce qu'il faut faire** :
1. Verifier que `escapeXml()` est applique a tous les champs utilisateur inseres dans du XML :
   - Titres d'activites
   - Contenus de questions/reponses
   - Descriptions et introductions
2. Verifier que `escapeHtmlTags()` ou `formatTextToHtml()` sont appliques aux contenus inseres dans du HTML
3. Verifier que les URL (images, liens) sont echappees dans les attributs HTML (src, href)
4. Tester avec des payloads contenant : `<script>alert(1)</script>`, `"; DROP TABLE`, `<img onerror=alert(1)>`

**Criteres de validation** :
- Un titre contenant `<script>` produit un fichier sans script executable
- Un contenu contenant des entites XML (`&`, `<`, `>`) est correctement echappe
- Les URLs contenant des caracteres speciaux sont correctement echappees

---

### Story 7.2 - Verifier la gestion des cas limites dans les processeurs

**Priorite** : BASSE
**Objectif** : S'assurer que chaque processeur gere correctement les donnees manquantes ou malformees.

**Fichiers concernes** :
- Tous les fichiers dans `js/modules/h5p-processors/`

**Ce qu'il faut faire** :
1. Pour chaque processeur, verifier le comportement avec :
   - JSON vide `{}`
   - JSON avec champs manquants (ex: Flashcards sans `cards`)
   - JSON avec champs null (ex: `title: null`)
   - JSON avec tableaux vides (ex: `questions: []`)
   - JSON avec types incorrects (ex: `questions: "pas un tableau"`)
2. S'assurer que chaque processeur :
   - Ne crash pas (pas d'erreur non attrapee)
   - Retourne un JSON valide meme avec des donnees partielles
   - Log un warning explicite si des donnees sont manquantes
3. Ajouter des gardes (guards) si necessaire :
   ```javascript
   const cards = Array.isArray(jsonObj.cards) ? jsonObj.cards : [];
   ```

**Criteres de validation** :
- Aucun processeur ne crash avec un JSON vide
- Chaque processeur retourne un JSON valide meme avec des donnees partielles
- Les warnings sont logges dans la console

---

## EPIC 8 : DOCUMENTATION ET MAINTENABILITE

### Story 8.1 - Documenter le flux complet de donnees dans un schema

**Priorite** : BASSE
**Objectif** : Creer un schema visuel du flux de donnees pour faciliter la maintenance.

**Fichiers concernes** :
- Nouveau fichier : `docs/data-flow.md`

**Ce qu'il faut faire** :
1. Documenter le flux H5P :
   ```
   Formulaire -> prompt-generator.js -> llm.js -> h5p-creator.js
   -> JSON Healer -> processeur H5P -> packaging ZIP
   -> notification (jsonData=HTML, originalJsonData=Markdown)
   -> editeur (lit originalJsonData) -> sauvegarde (denormalise)
   -> regenerateH5PFile -> nouveau blob -> notification mise a jour
   -> export DOCX/PDF/ODT (lit originalJsonData || jsonData)
   ```
2. Documenter le flux Moodle/Elea :
   ```
   Formulaire -> prompt-generator.js -> llm.js -> moodle-creator.js
   -> moodle-processors -> packaging TAR+GZIP
   -> notification (jsonData, originalJsonData si QCM)
   -> editeur (lit originalJsonData || jsonData)
   -> regenerateMBZFile -> nouveau blob -> notification mise a jour
   -> export DOCX/PDF/ODT (lit originalJsonData || jsonData)
   ```
3. Documenter les cas speciaux :
   - Glossary : normalisation tableau -> objet pour editeur
   - QuizSet : traitement recursif des questions enfants
   - Page : generation HTML depuis JSON blocks
   - moodleXml/glossaireXml : pas de moodle-processors, gere directement

**Criteres de validation** :
- Le document est clair et lisible
- Tous les types d'activites sont couverts
- Les cas speciaux sont documentes

---

## EPIC 9 : QUALITE DES EXPORTS DOCUMENTAIRES

### Story 9.1 - Definir la langue du document dans les exports DOCX/ODT/PDF

**Priorite** : MOYENNE
**Objectif** : Quand un fichier DOCX, ODT ou PDF est exporte, la langue par defaut du document doit correspondre a la langue active sur le site (celle choisie par l'utilisateur dans l'interface).

**Probleme actuel** :
- **DOCX** : `new Document({...})` dans `document-exporter.js` ne definit pas de propriete `language`. Le document est donc en langue indefinie (souvent interprete comme anglais par Word/LibreOffice).
- **ODT** : Le `styles.xml` genere definit `<style:text-properties style:font-name="Arial" fo:font-size="12pt"/>` dans le `<style:default-style>` (ligne 1448) SANS attribut `fo:language` ni `fo:country`. LibreOffice interprete donc le document sans langue definie.
- **PDF** : jsPDF ne definit pas de langue dans les metadonnees du document.
- **Consequence** : La correction orthographique dans Word/LibreOffice utilise la mauvaise langue. Les lecteurs d'ecran (accessibilite) ne prononcent pas correctement le texte.

**Fichiers concernes** :
- `js/modules/document-exporter.js` (les 3 fonctions de generation DOCX, ODT, PDF)
- `js/modules/translation.js` (pour `currentLang`)

**Ce qu'il faut faire** :

**1. Creer une map de correspondance langue → locale**

Dans `document-exporter.js`, ajouter une constante :
```javascript
const LANG_TO_LOCALE = {
    fr: { language: 'fr', country: 'FR', bcp47: 'fr-FR' },
    en: { language: 'en', country: 'US', bcp47: 'en-US' },
    es: { language: 'es', country: 'ES', bcp47: 'es-ES' },
    de: { language: 'de', country: 'DE', bcp47: 'de-DE' },
    it: { language: 'it', country: 'IT', bcp47: 'it-IT' },
    nl: { language: 'nl', country: 'NL', bcp47: 'nl-NL' },
    pt: { language: 'pt', country: 'PT', bcp47: 'pt-PT' },
    ar: { language: 'ar', country: 'SA', bcp47: 'ar-SA' },
    zh: { language: 'zh', country: 'CN', bcp47: 'zh-CN' },
    jp: { language: 'ja', country: 'JP', bcp47: 'ja-JP' },
    el: { language: 'el', country: 'GR', bcp47: 'el-GR' }
};
```

**2. DOCX (docx.js)** : Ajouter la propriete `language` dans les options du `new Document()` :
```javascript
const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;
return new Document({
    language: locale.bcp47,  // <-- AJOUTER
    styles: { ... },
    sections: [...]
});
```
Note : Il y a deux appels a `new Document()` dans le fichier (lignes ~302 et ~489). Les deux doivent etre modifies.

**3. ODT (styles.xml)** : Ajouter `fo:language` et `fo:country` dans le `<style:default-style>` :
```xml
<style:default-style style:family="paragraph">
    <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0cm"/>
    <style:text-properties style:font-name="Arial" fo:font-size="12pt"
        fo:language="${locale.language}" fo:country="${locale.country}"/>
</style:default-style>
```
Note : Il y a deux generateurs ODT dans le fichier (standard et cartes/flashcards). Les deux doivent etre modifies.

**4. PDF (jsPDF)** : Ajouter la langue dans les proprietes du document :
```javascript
const locale = LANG_TO_LOCALE[currentLang] || LANG_TO_LOCALE.fr;
doc.setLanguage(locale.bcp47);
doc.setProperties({
    language: locale.bcp47
});
```

**Criteres de validation** :
- Exporter un DOCX en francais → ouvrir dans Word/LibreOffice → la correction orthographique est en francais
- Exporter un DOCX en anglais → la correction est en anglais
- Exporter un ODT en espagnol → LibreOffice detecte la langue comme espagnol
- Exporter un PDF en allemand → les metadonnees du PDF indiquent la langue allemande
- Les 11 langues supportees ont toutes un mapping correct
- Fallback en francais si `currentLang` est indefini

---

## EPIC 10 : MONITORING DES DEPENDANCES

### Story 10.1 - Workflow n8n de verification quotidienne des versions des bibliotheques JS

**Priorite** : BASSE
**Objectif** : Mettre en place un workflow n8n qui verifie chaque jour si les bibliotheques JavaScript utilisees par Caramel sont a jour, et envoie un email d'alerte si une mise a jour est disponible.

**Contexte** :
Caramel n'utilise pas npm/package.json. Toutes les bibliotheques sont des fichiers JS commites directement dans `js/vendor/`. Il n'y a donc aucun mecanisme automatique de detection des mises a jour. Les chemins sont declares dans `js/modules/lib-loader.js` (constante `LIB_PATHS`).

**Bibliotheques a surveiller** :

| Bibliotheque | Package npm | Chemin local | Version actuelle |
|---|---|---|---|
| jsPDF | `jspdf` | `js/vendor/jspdf/4.1.0/jspdf.umd.min.js` | 2.5.1 |
| jsPDF-AutoTable | `jspdf-autotable` | `js/vendor/jspdf-autotable/5.0.7/jspdf.plugin.autotable.min.js` | 3.8.2 |
| DOMPurify | `dompurify` | `js/vendor/dompurify/3.3.1/purify.min.js` | 3.2.4 |
| docx | `docx` | `js/vendor/docx/8.5.0/index.umd.js` | a determiner |
| JSZip | `jszip` | `js/vendor/jszip/3.10.1/jszip.min.js` | a determiner |
| fflate | `fflate` | `js/vendor/fflate/0.8.2/index.js` | a determiner |
| client-zip | `client-zip` | `js/vendor/client-zip/2.5.0/worker.js` | a determiner |
| Tesseract.js | `tesseract.js` | `js/vendor/tesseract/6.0.1/tesseract.min.js` | a determiner |
| Mammoth.js | `mammoth` | `js/vendor/mammoths/mammoth.browser.min.js` | a determiner |
| PDF.js | `pdfjs-dist` | `js/vendor/pdf-js/3.11.174/pdf.min.js` | a determiner |
| MathJax | `mathjax` | `js/vendor/mathjax/3.2.2/tex-svg.js` | a determiner |
| tar-js | `tar-js` | `js/vendor/tar-js/0.3.0/tar.bundle.js` | a determiner |
| h5p-standalone | `h5p-standalone` | `js/vendor/h5p-standalone/main.bundle.js` | a determiner |

**Ce qu'il faut faire** :

**Phase 1 : Determiner les versions actuelles**

Avant de creer le workflow, inspecter chaque fichier JS pour trouver la version exacte (en-tete de licence, commentaire `@version`, variable interne). Creer un fichier `lib-versions.json` a la racine :
```json
{
    "libraries": [
        { "name": "jspdf", "npmPackage": "jspdf", "currentVersion": "2.5.1", "localPath": "js/vendor/jspdf/4.1.0/jspdf.umd.min.js" },
        { "name": "dompurify", "npmPackage": "dompurify", "currentVersion": "3.2.4", "localPath": "js/vendor/dompurify/3.3.1/purify.min.js" },
        ...
    ]
}
```

**Phase 2 : Creer le workflow n8n**

Le workflow doit :

1. **Declencheur** : Cron schedule, une fois par jour (ex: 7h00 du matin)
2. **Pour chaque bibliotheque** dans la liste :
   - Appeler l'API npm registry : `GET https://registry.npmjs.org/{package}/latest`
   - Extraire le champ `version` de la reponse
   - Comparer avec la version actuelle connue (stockee dans le workflow ou dans un fichier de config)
3. **Si au moins une bibliotheque est obsolete** :
   - Construire un email recapitulatif avec un tableau :
     - Nom de la bibliotheque
     - Version actuelle
     - Derniere version disponible
     - Lien vers le changelog npm
   - Envoyer l'email a l'adresse configuree
4. **Si toutes les bibliotheques sont a jour** : ne rien faire (pas d'email)

**Structure du workflow n8n** :

```
[Schedule Trigger] → [HTTP Request (npm API)] → [IF outdated] → [Email Send]
```

Detaille :
- Node 1 : Schedule Trigger (cron: `0 7 * * *`)
- Node 2 : Code node qui contient la liste des bibliotheques et leurs versions actuelles
- Node 3 : SplitInBatches pour iterer sur chaque bibliotheque
- Node 4 : HTTP Request vers `https://registry.npmjs.org/{{ $json.npmPackage }}/latest`
- Node 5 : Code node pour comparer `$json.currentVersion` avec `$json.latestVersion`
- Node 6 : IF node : `outdatedLibraries.length > 0`
- Node 7 : Email Send node avec le rapport HTML

**Email type** :
```
Sujet : [Caramel] Mise a jour de bibliotheques disponible

Bonjour,

Les bibliotheques suivantes ont une nouvelle version disponible :

| Bibliotheque | Version actuelle | Derniere version | npm |
|---|---|---|---|
| dompurify | 3.2.4 | 3.3.0 | https://www.npmjs.com/package/dompurify |
| jspdf | 2.5.1 | 2.6.0 | https://www.npmjs.com/package/jspdf |

Pensez a verifier les changelogs avant de mettre a jour.

-- Caramel Monitoring
```

**Criteres de validation** :
- Le workflow s'execute sans erreur une fois par jour
- Si une bibliotheque a une nouvelle version → email envoye avec les details
- Si toutes les bibliotheques sont a jour → aucun email
- Le fichier `lib-versions.json` est a jour avec toutes les versions actuelles
- L'email contient le lien npm pour chaque bibliotheque obsolete

---

## RESUME DES STORIES PAR PRIORITE

### HAUTE
| # | Story | Epic | Effort estime |
|---|-------|------|---------------|
| 1.1 | Healing structurel + validation metier | Healing + Validation | Eleve |
| 1.2 | Cles de traduction validation | Validation | Faible |
| 6.1 | Tests non-regression edition->export | Coherence | Eleve |
| 6.2 | Verifier originalJsonData vs jsonData | Coherence | Faible |

### MOYENNE
| # | Story | Epic | Effort estime |
|---|-------|------|---------------|
| 4.1 | Mode debug URL | Dev experience | Faible |
| 5.1 | Messages d'erreur ameliores | UX | Moyen |
| 7.1 | Echappement contenus | Securite | Moyen |
| 9.1 | Langue document DOCX/ODT/PDF | Qualite exports | Faible |

### BASSE
| # | Story | Epic | Effort estime |
|---|-------|------|---------------|
| 3.1 | Parsing JSON LLM | Robustesse | Faible |
| 4.2 | Toggle JSON brut/heale (debug) | Dev experience | Faible |
| 7.2 | Cas limites processeurs | Robustesse | Moyen |
| 8.1 | Documentation flux donnees | Documentation | Faible |
| 10.1 | Workflow n8n monitoring versions JS | Monitoring | Moyen |
