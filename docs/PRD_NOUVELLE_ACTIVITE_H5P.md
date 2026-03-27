# PRD — Ajout d'une nouvelle activité H5P dans Caramel

> **Version** : 1.1.0 — **Date** : 2026-03-11
> **Objectif** : Ce document est le **modèle exhaustif** de tout ce qu'il faut faire pour intégrer une nouvelle activité H5P (ou Moodle) dans Caramel. Chaque étape indique le fichier à modifier, la localisation exacte (section/map/objet), un exemple concret et les critères de validation.

---

## Table des matières

1. [Vue d'ensemble du pipeline](#1-vue-densemble-du-pipeline)
2. [Phase 1 — Enregistrement de l'activité](#2-phase-1--enregistrement-de-lactivité)
3. [Phase 2 — Processeur H5P](#3-phase-2--processeur-h5p)
4. [Phase 3 — Réparation JSON (Healer)](#4-phase-3--réparation-json-healer)
5. [Phase 4 — Prompts et intégration IA](#5-phase-4--prompts-et-intégration-ia)
6. [Phase 5 — Traductions (11 langues)](#6-phase-5--traductions-11-langues)
7. [Phase 6 — Éditeur visuel JSON](#7-phase-6--éditeur-visuel-json)
8. [Phase 7 — Export document (DOCX/ODT/PDF)](#8-phase-7--export-document-docxodtpdf)
9. [Phase 8 — Aide d'urgence (Emergency Help)](#9-phase-8--aide-durgence-emergency-help)
10. [Phase 9 — Assets visuels](#10-phase-9--assets-visuels)
11. [Phase 10 — Librairies H5P vendor](#11-phase-10--librairies-h5p-vendor)
12. [Phase 11 — Tests](#12-phase-11--tests)
13. [Phase 12 — Documentation & Wiki](#13-phase-12--documentation--wiki)
14. [Phase 13 — Intégration QuizSet (optionnel)](#14-phase-13--intégration-quizset-optionnel)
15. [Phase 13b — Activité conteneur avec exercices filles](#14b-phase-13b--activité-conteneur-avec-exercices-filles)
16. [Phase 14 — Cas spéciaux](#15-phase-14--cas-spéciaux)
16. [Checklist de validation finale](#16-checklist-de-validation-finale)
17. [Annexe A — Squelette de processeur](#annexe-a--squelette-de-processeur)
18. [Annexe B — Patron de clés de traduction](#annexe-b--patron-de-clés-de-traduction)
19. [Annexe C — Fichiers modifiés (récapitulatif)](#annexe-c--fichiers-modifiés-récapitulatif)

---

## 1. Vue d'ensemble du pipeline

Quand un utilisateur génère une activité, le flux de données est :

```
definitions.js → prompt-generator.js → llm.js → json-healer.js
    → processors/*.js → h5p-creator.js → .h5p (ZIP)
    → notification → résultat modal → éditeur / export document
```

Chaque étape correspond à une phase de ce PRD. **Aucune ne doit être omise.**

---

## 2. Phase 1 — Enregistrement de l'activité

### 2.1. `js/core/definitions.js` — Registre principal

**Objet** : `h5pModules`

Ajouter une entrée avec **tous** les champs obligatoires :

```javascript
NomActivite: {
    name: "h5p_nom_activite_name",                    // Clé i18n du nom
    englishName: "ActivityName",                        // Nom anglais (identifiant)
    machineName: "H5P.ActivityName",                    // Nom officiel H5P
    description: "h5p_nom_activite_description",       // Clé i18n de la description
    image: "assets/images/activities/nom-activite.webp", // Icône tuile
    promptId: "nomActiviteResultat",                   // ID DOM du textarea résultat
    jsonInputId: "nomActiviteJsonInput",               // ID DOM du textarea JSON
    createBtnId: "createNomActiviteH5P",               // ID DOM du bouton créer
    categories: ["quiz", "h5p"],                       // Catégories de filtre
    platforms: ["Éléa", "Magistère", "Moodle"],        // Plateformes
    formats: ["H5P", "DOCX", "ODT", "PDF"],            // Formats d'export
    hidden: false                                       // false = visible dans la grille
}
```

> **Conventions de nommage des IDs :**
> - `promptId` : `{camelCase}Resultat` (ex: `dragAndDropResultat`)
> - `jsonInputId` : `{camelCase}JsonInput` (ex: `dragAndDropJsonInput`)
> - `createBtnId` : `create{PascalCase}H5P` (ex: `createDragAndDropH5P`)

> **Catégories disponibles** : `quiz`, `memory`, `text`, `h5p`

### 2.2. `js/core/definitions.js` — Ordre d'affichage

**Tableau** : `customOrder`

Insérer la clé du module (ex: `'NomActivite'`) à la position souhaitée dans le tableau. Ce tableau de 28 entrées contrôle l'ordre des tuiles dans la grille.

```javascript
const customOrder = [
    'QuizSetQCM', 'QuizSetVF', 'QuizSet',
    'Flashcards', 'Crossword', 'Timeline',
    'NomActivite',  // ← Ajouter ici selon la priorité
    // ...
];
```

### 2.3. `js/core/translation.js` — Traduction par défaut (affichage immédiat)

**Objet** : `defaultTranslations` (~ligne 13)

Ajouter la clé `name` de l'activité dans les traductions françaises par défaut. Cet objet est utilisé pour l'affichage **immédiat** des tuiles avant le chargement complet du fichier de langue :

```javascript
const defaultTranslations = {
    // Noms des modules H5P
    // ...existants...
    h5p_nom_activite_name: "Ma nouvelle activité",
    // ...
};
```

> **Pourquoi ?** Sans cette entrée, la tuile affiche la clé brute (`h5p_nom_activite_name`) pendant le bref instant entre le rendu initial et le chargement de `fr.json`. Seule la clé `name` est nécessaire ici — la `description` est chargée avec le fichier de langue complet.

### 2.4. Validation Phase 1

- [ ] La tuile apparaît dans la grille avec l'image placeholder
- [ ] Les filtres par catégorie/plateforme fonctionnent
- [ ] Le clic sur la tuile ouvre le panneau latéral avec les bons IDs DOM
- [ ] `test-definitions.js` passe (champs requis, unicité des IDs)

---

## 3. Phase 2 — Processeur H5P

### 3.1. Créer le fichier processeur

**Fichier** : `js/h5p/processors/NomActivite.js`

Structure minimale obligatoire :

```javascript
import { formatTextToHtml, generateUUID } from '../../core/utils.js';
import { translations, currentLang } from '../../core/translation.js';

export default {
    /**
     * Transforme le JSON simplifié de l'IA en structure H5P valide.
     * @param {Object} jsonObj - JSON nettoyé par le healer
     * @param {Object} [helpers] - Fonctions utilitaires (QuizSet uniquement)
     * @returns {Object} JSON H5P prêt pour le packaging
     */
    process(jsonObj) {
        // 1. Extraire/valider les champs de base
        const title = jsonObj.title || translations.h5p_nom_activite_name || 'Activité';

        // 2. Formater le texte (Markdown → HTML sûr)
        // Utiliser formatTextToHtml() pour tout champ texte visible

        // 3. Ajouter les champs H5P techniques
        // (behaviour, overallFeedback, l10n, etc.)

        // 4. Retourner l'objet H5P final
        return {
            // ... structure spécifique au type H5P
        };
    },

    // OPTIONNEL : Si l'activité peut être intégrée dans un QuizSet
    transformForQuizSet(question) {
        question.params = this.process(question.params);
        return question;
    }
};
```

> **Patterns courants :**
> - **Pass-through** (Chart) : `return { ...jsonObj }`
> - **Transformation simple** (Flashcards, Timeline) : map/format des champs
> - **Layout complexe** (DragAndDrop) : calculs de positionnement, grille adaptative
> - **Async avec dépendances** (QuizSet) : traitement récursif des enfants

> **Fonctions utilitaires disponibles :**
> - `formatTextToHtml(text)` — Markdown → HTML sûr (sanitized)
> - `generateUUID()` — UUID v4 pour `subContentId`
> - `translations` — Objet de traductions (pour les labels H5P : boutons, messages)
> - `currentLang` — Code langue actuel (`'fr'`, `'en'`, etc.)

### 3.2. Enregistrer dans le routeur

**Fichier** : `js/h5p/processors/index.js`

**3 registrations obligatoires :**

#### a) Métadonnées statiques — objet `processorMetadata`

```javascript
'NomActivite': {
    machineName: 'H5P.ActivityName',
    version: { major: 1, minor: 0 },
    extraDependencies: [
        { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 },
        { machineName: 'H5P.FontAwesome', majorVersion: 4, minorVersion: 5 },
        { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
        { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
        { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
        { machineName: 'H5P.Question', majorVersion: 1, minorVersion: 5 },
        // + dépendances spécifiques au type
    ]
}
```

> **Note** : `H5P.MathDisplay` est quasi-universel. Les dépendances communes sont `FontAwesome`, `JoubelUI`, `Transition`, `FontIcons`, `Question`. Vérifier dans le `library.json` de la librairie H5P officielle pour la liste exacte.

> **⚠️ Dépendances dynamiques (runtime)** : Certaines librairies H5P chargent des dépendances **à l'exécution** qui ne sont **pas** déclarées dans leur `library.json` (ex : `H5P.DragNDrop`, `H5P.DragNBar`, `H5P.DragNResize`, `H5P.Drop`, `H5P.Tether`). Ces librairies sont injectées par le runtime H5P officiel mais absentes des métadonnées. Pour les identifier :
> 1. Ouvrir l'activité dans l'éditeur H5P officiel (h5p.org ou Lumi)
> 2. Exporter le `.h5p` et examiner le `h5p.json` → section `preloadedDependencies`
> 3. Comparer avec le `library.json` : toute dépendance présente dans `h5p.json` mais absente de `library.json` est une dépendance runtime
> 4. Ajouter ces dépendances dans `extraDependencies` pour que le préchargement et le packaging les incluent

#### b) Chargeur lazy — objet `processorLoaders`

```javascript
'NomActivite': () => import('./NomActivite.js'),
```

#### c) Lookup inversé — objet `libraryToKey`

```javascript
'H5P.ActivityName': 'NomActivite',
```

> **Important** : Cette entrée est indispensable si l'activité peut être enfant d'un QuizSet. Si non, elle reste recommandée pour la cohérence.

### 3.2d. Valeurs par défaut du processeur — correspondance avec l'éditeur H5P officiel

Les constantes `DEFAULTS` du processeur doivent **impérativement** correspondre aux valeurs par défaut de l'éditeur H5P officiel. Une divergence peut provoquer des bugs subtils de rendu (positionnement incorrect, éléments interactifs non fonctionnels, styles manquants) qui ne se manifestent qu'à l'exécution dans le player.

**Méthode de vérification :**
1. Créer une activité vide dans l'éditeur H5P officiel (h5p.org ou Lumi)
2. Sauvegarder **sans modifier aucun réglage**
3. Exporter le `.h5p` et extraire le `content.json`
4. Comparer chaque valeur du `content.json` avec les `DEFAULTS` du processeur
5. Aligner systématiquement les `DEFAULTS` sur les valeurs de l'éditeur officiel

> **Piège courant** : Des champs comme `enableRetry`, `enableSolutionsButton`, `keywordListEnabled`, `globalBackgroundColor` ont souvent des valeurs par défaut non intuitives (ex : `false` au lieu de `true`, `'#ffffff'` au lieu de `null`). Ne pas deviner — toujours vérifier avec l'export officiel.

### 3.3. Validation Phase 2

- [ ] Coller un JSON minimal valide dans le textarea → le fichier .h5p se télécharge
- [ ] Le fichier .h5p s'ouvre dans un lecteur H5P (Lumi, h5p.org)
- [ ] Tous les éléments s'affichent correctement dans le player
- [ ] Le mode debug (`?debug`) affiche les logs du processeur

---

## 4. Phase 3 — Réparation JSON (Healer)

**Fichier** : `js/h5p/json-healer.js`

### 4.1. Ajouter au set de clés H5P

**Objet** : `H5P_MODULE_KEYS` (Set, ~ligne 28)

```javascript
const H5P_MODULE_KEYS = new Set([
    'Timeline', 'Flashcards', /* ... */ 'NomActivite'
]);
```

### 4.2. Healing spécifique (si nécessaire)

**Fonction** : `healActivitySpecificFields(jsonObj, moduleKey)`

Si l'activité a des champs textuels avec des marqueurs spéciaux (comme `*mot*` pour DragTheWords, `**mot**` pour MarkTheWords), ajouter un `case` :

```javascript
case 'NomActivite':
    // Nettoyage spécifique des champs textuels
    break;
```

**Fonction** : `healStructureForActivity(data, moduleKey)`

Si l'activité nécessite des champs structurels par défaut (behaviour, overallFeedback, UUID, etc.) :

```javascript
case 'NomActivite':
    if (!data.behaviour) data.behaviour = { enableRetry: true, enableSolutionsButton: true };
    if (!data.overallFeedback) data.overallFeedback = [];
    break;
```

### 4.3. Versions de librairies (si QuizSet-compatible)

**Map** : `H5P_LIB_VERSIONS` (~ligne 15)

Si l'activité est utilisable comme sous-question QuizSet, ajouter :

```javascript
const H5P_LIB_VERSIONS = {
    // ...existant...
    'H5P.ActivityName': '1.0'
};
```

### 4.4. Règle critique — Ne jamais simplifier les identifiants `library`

> **⚠️ INTERDIT : Le healer ne doit JAMAIS transformer les identifiants `library` des exercices filles.**
>
> Les champs `exercise.library` (ex : `"H5P.MultiChoice 1.16"`) doivent être **préservés tels quels** à travers tout le pipeline. Le format complet est nécessaire pour :
> - L'**éditeur visuel** (`content-detector.js`) : les schemas dynamiques sont indexés par library complète
> - L'**export document** (`document-formatter.js`) : le routing des formatters utilise `library.includes('MultiChoice')`
> - La **validation** (`validators.js`) : les règles métier vérifient la présence de la library
>
> Le **processeur** est le seul composant qui doit gérer les deux formats (complet et simplifié) via un `LIBRARY_MAP`, car l'IA peut occasionnellement générer une clé simplifiée. Tous les autres composants travaillent avec le format complet.
>
> **Erreur passée** : Le healer CoursePresentation simplifiait `"H5P.MultiChoice 1.16"` → `"multichoice"`, ce qui cassait l'éditeur, l'export document et la validation.

### 4.5. Validation Phase 3

- [ ] Passer un JSON volontairement mal formé → le healer le corrige
- [ ] Vérifier en mode debug que `_debugRawJson` et `_debugHealedJson` montrent le diff
- [ ] Si LaTeX : vérifier que les formules sont correctement échappées
- [ ] Si conteneur avec exercices filles : vérifier que les `exercise.library` sont **préservés au format complet**

---

## 5. Phase 4 — Prompts et intégration IA

### 5.1. Template de prompt

**Fichier** : `assets/data/prompts/nom_activite.md`

Créer un fichier Markdown servant de **référence** pour les prompts. Ce fichier est consultatif — les prompts réels sont construits par `prompt-generator.js` à partir des clés de traduction.

Structure type :
```markdown
# Prompt — Nom de l'activité

## Contexte pédagogique
[Commun à toutes les activités]

## Règles spécifiques
[Règles propres à cette activité]

## Structure JSON attendue
[Description précise des champs]

## Exemple de rendu
[JSON complet commenté]
```

### 5.1b. Cohérence des clés params (activités conteneur avec exercices filles)

> **⚠️ RÈGLE CRITIQUE — Homogénéité des formats JSON entre standalone et conteneur :**
>
> Si l'activité est un **conteneur** qui embarque des exercices filles existant déjà en standalone (ex : QuizSet, CoursePresentation), le format JSON de chaque exercice fille dans le prompt du conteneur doit être **strictement identique** à celui du prompt de l'activité standalone correspondante.
>
> **Pourquoi ?** Le processeur du conteneur passe les params directement au processeur standalone de chaque activité fille via `helpers.processChild()`. Si les clés ou les formats diffèrent, le processeur enfant échoue.

#### Principe : pass-through, pas de restructuration

Le processeur du conteneur **ne doit pas** restructurer les données des exercices filles. Il doit :
1. Extraire la clé `library` pour identifier le type d'exercice
2. Passer **toutes les autres clés telles quelles** au processeur enfant
3. Ajouter uniquement une normalisation défensive pour les cas limites connus de l'IA

```javascript
// ✅ BON : pass-through avec normalisation minimale
function buildExerciseParams(exercise, type) {
    const { library, ...params } = exercise;
    // Normalisation défensive uniquement si nécessaire
    if (type === 'blanks' && params.questions) {
        params.questions = params.questions.map(q =>
            typeof q === 'string' ? q : (q.text || '')
        );
    }
    return params;
}

// ❌ MAUVAIS : restructuration des données
function buildExerciseParams(exercise, type) {
    switch (type) {
        case 'multichoice':
            return {
                question: exercise.question || '',
                answers: exercise.answers.map(a => ({
                    text: a.text, correct: a.correct,
                    tipsAndFeedback: { tip: '', chosenFeedback: '', notChosenFeedback: '' }
                })),
                // ← Ceci modifie la structure et peut casser le processeur enfant
            };
    }
}
```

#### Référence des formats par type d'exercice standalone

Voici les clés JSON attendues par chaque processeur standalone. Le prompt du conteneur doit les reproduire **à l'identique** :

| Type | Library | Clés obligatoires | Format |
|------|---------|-------------------|--------|
| **QCM** | `H5P.MultiChoice 1.16` | `question`, `answers`, `overallFeedback` | `answers`: tableau d'objets `{text, correct, tipsAndFeedback?}` |
| **Vrai/Faux** | `H5P.TrueFalse 1.8` | `question`, `correct`, `feedbackOnCorrect`, `feedbackOnWrong` | `correct`: string `"true"`/`"false"` |
| **Texte à trous** | `H5P.Blanks 1.14` | `taskDescription`, `questions`, `overallFeedback` | `questions`: tableau de **strings** (pas d'objets !) |
| **Glisser les mots** | `H5P.DragText 1.10` | `taskDescription`, `textField`, `overallFeedback` | `textField`: string avec `*mot*` |
| **Surligner** | `H5P.MarkTheWords 1.11` | `taskDescription`, `textField`, `overallFeedback` | `textField`: string avec `*mot*` |
| **Choix unique** | `H5P.SingleChoiceSet 1.11` | `choices`, `overallFeedback` | `choices[].answers`: tableau de **strings** |
| **Résumé** | `H5P.Summary 1.10` | `intro`, `summaries`, `overallFeedback` | `summaries[].summary`: tableau de **strings** |
| **Glisser-déposer** | `H5P.DragQuestion 1.14` | `title`, `dropZones`, `elements`, `overallFeedback` | `dropZones[].correctElements`: tableau de **numbers** (indices) |
| **Cartes dialogue** | `H5P.Dialogcards 1.9` | `title`, `description`, `dialogs` | `dialogs[]`: objets `{text, answer, tips?}` |

> **⚠️ Pièges fréquents de l'IA :**
> - `questions` de Blanks : l'IA génère parfois `[{"text": "..."}]` au lieu de `["..."]` → ajouter une normalisation défensive
> - `correct` de TrueFalse : l'IA génère parfois un booléen au lieu d'une string → convertir avec `String()`
> - `answers` de SingleChoiceSet : ce sont des **strings simples**, pas des objets `{text, correct}`
>
> **Méthode de vérification** : Avant d'écrire le prompt du conteneur, ouvrir le prompt standalone de chaque activité fille (`assets/data/prompts/`) et vérifier que les clés et formats correspondent exactement. Ouvrir aussi les exemples standalone (`assets/data/examples/`) pour confirmer le format réel.

### 5.2. Exemples JSON

**Dossier** : `assets/data/examples/`

Créer **au minimum 2 fichiers** d'exemples :
- `nom_activite_1.json` — Exemple simple/standard
- `nom_activite_2.json` — Exemple plus complexe ou avec LaTeX

> Ces fichiers sont utilisés par les tests de cohérence (`test-definitions.js`).

### 5.3. Enregistrer dans le générateur de prompts

**Fichier** : `js/services/prompt-generator.js`

**Objet** : `ACTIVITY_CONFIG` (~ligne 25)

```javascript
nomActivite: { prefix: 'prompt_nom_activite', resultKey: 'nomActiviteResultat' },
```

> **`prefix`** : préfixe des 3 clés de traduction du prompt (voir Phase 5)
> **`resultKey`** : doit correspondre au `promptId` de `definitions.js`

### 5.4. Surcharge de modèle IA (optionnel)

**Fichier** : `js/services/llm.js`

**Objet** : `ACTIVITY_MODEL_OVERRIDES` (~ligne 37)

Si l'activité nécessite un modèle plus puissant (structure JSON complexe) :

```javascript
export const ACTIVITY_MODEL_OVERRIDES = {
    // ...existant...
    'NomActivite': 'gpt-oss-120b'
};
```

> **Modèles disponibles** : `mistral-small-3.2-24b` (défaut), `qwen-3-30b`, `gpt-oss-120b`, `llama-3.3-70b`, `llama-3.1-8b`

### 5.5. Validation Phase 4

- [ ] Le bouton "Générer en un clic" produit un JSON valide
- [ ] Le prompt affiché en mode Guidé est cohérent et complet
- [ ] Les exemples JSON sont parsables et correspondent à la structure attendue

---

## 6. Phase 5 — Traductions (11 langues)

### 6.1. Clés obligatoires par activité

Les clés doivent être ajoutées dans **les 11 fichiers** de `js/locales/` :
`fr.json`, `en.json`, `es.json`, `de.json`, `it.json`, `nl.json`, `pt.json`, `ar.json`, `zh.json`, `jp.json`, `el.json`

#### Groupe 1 — Identité (2 clés)

| Clé | Description | Exemple (fr) |
|-----|-------------|--------------|
| `h5p_nom_activite_name` | Nom affiché sur la tuile | `"Ma nouvelle activité"` |
| `h5p_nom_activite_description` | Description sous la tuile | `"Créez une activité interactive de type..."` |

> **Convention** : `h5p_{moduleKey_snake_case}_name` et `h5p_{moduleKey_snake_case}_description`

#### Groupe 2 — Prompts IA (3 clés)

| Clé | Description | Contenu |
|-----|-------------|---------|
| `prompt_nom_activite_regles_specifiques` | Règles métier de l'activité | Nombre d'éléments, contraintes de format, etc. |
| `prompt_nom_activite_structure_json` | Description de la structure JSON attendue | Champs, types, imbrication |
| `prompt_nom_activite_exemple_rendu` | Exemple JSON complet | Bloc ```json avec un exemple réaliste |

> **Placeholder `[NOMBRE_ELEMENTS]`** : Remplacé dynamiquement par le nombre demandé par l'utilisateur.
> **Format** : Les 3 clés utilisent le préfixe `prompt_{config_prefix}` défini dans `ACTIVITY_CONFIG`.

> **⚠️ ATTENTION — Traduction obligatoire des 3 clés prompt dans chaque langue :**
> Les 3 clés `regles_specifiques`, `structure_json` et `exemple_rendu` doivent être **traduites dans chaque fichier de langue**, exactement comme toutes les autres clés. Seules les clés JSON techniques (`title`, `type`, `library`, etc.) restent en anglais dans l'exemple — le texte descriptif et les valeurs de l'exemple JSON doivent être dans la langue cible.
> Vérifier en comparant avec les clés prompt d'une activité existante (ex: `prompt_timeline_*`) dans chaque fichier de langue pour s'assurer de la cohérence.

#### Groupe 3 — Aide d'urgence "?" (10-20 clés)

Préfixe : `eh_nom_activite_*`

| Clé | Description |
|-----|-------------|
| `eh_nom_activite_desc` | Description pédagogique courte |
| `eh_nom_activite_field_title` | Description du champ "titre" |
| `eh_nom_activite_field_*` | Un par champ du JSON (5-10 clés) |
| `eh_nom_activite_good_*` | Exemple(s) de bon format |
| `eh_nom_activite_bad_example` | Erreur(s) fréquente(s) à éviter |

> **Total** : environ 464 clés `eh_*` existent actuellement, soit ~15-20 par activité.

#### Groupe 4 — Export document (0-5 clés, selon besoin)

Préfixe : `doc_fmt_*`

Si l'activité a des sections spécifiques dans l'export document (ex: `doc_fmt_drag_instructions`, `doc_fmt_zones_header`), ajouter les clés correspondantes.

#### Groupe 5 — Labels H5P internes (variable)

Si le processeur utilise des traductions pour les labels H5P (boutons, messages du player), vérifier que les clés `h5p_check_answer`, `h5p_next`, `h5p_previous`, etc. existent déjà. Sinon, ajouter les clés manquantes.

### 6.2. Placement dans les fichiers JSON

Les clés doivent être insérées **au bon endroit** dans le fichier JSON pour maintenir l'organisation par sections :

| Groupe | Section du fichier | Repère |
|--------|-------------------|--------|
| Identité | Bloc des noms H5P | Après les autres `h5p_*_name` (~lignes 110-135) |
| Prompts | Bloc des prompts | Après les autres `prompt_*` (~lignes 315-500) |
| Emergency Help | Bloc `eh_*` | Après les autres `eh_*` (~lignes 1293-1760) |
| Export doc | Bloc `doc_fmt_*` | Après les autres `doc_fmt_*` (~lignes 1161-1250) |

### 6.3. Tutoriel — Mention dans la liste des activités

**Clé** : `tuto_step2_h5p_content` (~ligne 23)

Ajouter une entrée `<li>` dans le HTML de cette clé pour décrire la nouvelle activité dans le tutoriel :

```html
<li><strong>Nom activité :</strong> Description pédagogique courte.</li>
```

### 6.4. Validation Phase 5

- [ ] Le nom et la description s'affichent correctement en français
- [ ] Le changement de langue met à jour tous les textes
- [ ] Les 11 fichiers de langue contiennent les mêmes clés (même numérotation)
- [ ] Le prompt IA s'affiche dans la bonne langue
- [ ] Les 3 clés `prompt_*` (regles_specifiques, structure_json, exemple_rendu) sont **traduites** dans chaque langue (pas de texte français dans en.json, es.json, etc.)
- [ ] Vérification croisée : ouvrir au moins 2 fichiers de langue non-français et s'assurer que les valeurs des clés `prompt_*` ne sont PAS en français
- [ ] `test-i18n.js` passe (cohérence des clés entre langues)

---

## 7. Phase 6 — Éditeur visuel JSON

### 7.1. Signature de détection

**Fichier** : `js/editor/content-detector.js`

**Objet** : `contentSignatures` (~ligne 20)

Ajouter une fonction de détection basée sur la structure JSON :

```javascript
'NomActivite': (data) =>
    // Conditions uniques identifiant ce type de contenu
    data.hasOwnProperty('champSpecifique') &&
    Array.isArray(data.elements) &&
    data.elements.length > 0,
```

> **Attention** : La signature doit être **unique** et ne pas matcher d'autres types. Si deux types ont la même structure (ex: DragTheWords/MarkTheWords), la distinction se fait par `titleKey` dans `detectContentType()`.

### 7.1b. Mapping titleKey → moduleKey

**Fichier** : `js/editor/content-detector.js`

**Objet** : `titleKeyToModuleKey` (~ligne 174)

Ce mapping permet la détection **prioritaire** du type d'activité via la clé de traduction du titre (plus fiable que la signature JSON quand deux types partagent la même structure) :

```javascript
'h5p_nom_activite_name': 'NomActivite',
```

### 7.1c. Mapping moduleKey → clé de traduction

**Fichier** : `js/editor/content-detector.js`

**Objet** : `moduleTranslationKeys` (~ligne 1615)

Mapping inverse pour retrouver le nom traduit à partir du moduleKey :

```javascript
'NomActivite': 'h5p_nom_activite_name',
```

### 7.2. Schéma de l'éditeur

**Fichier** : `js/editor/content-detector.js`

Ajouter le schéma dans la fonction `getSchemaForType()` :

```javascript
case 'NomActivite':
    return {
        title: t('editor_title_prefix') + ' ' + t('h5p_nom_activite_name'),
        sections: [
            {
                title: t('editor_section_general'),
                fields: [
                    { key: 'title', label: t('editor_label_title'), type: 'text', required: true },
                    { key: 'taskDescription', label: t('editor_label_description'), type: 'html' },
                ]
            },
            {
                title: t('editor_section_content'),
                fields: [
                    {
                        key: 'elements',
                        label: t('editor_label_elements'),
                        type: 'array',
                        itemSchema: {
                            fields: [
                                { key: 'text', label: t('editor_label_text'), type: 'text', required: true },
                                // ... autres champs par élément
                            ]
                        }
                    }
                ]
            },
            // ... sections feedback, etc.
        ]
    };
```

> **Types de champs disponibles** : `text`, `textarea`, `html`, `number`, `boolean`, `select`, `array`, `richtext`, `feedback`

#### Types de champs avancés

Certains types H5P utilisent des patterns avancés dans leur `semantics.json` que l'éditeur Caramel doit savoir interpréter :

**`showWhen` — Champs conditionnels**

Un champ peut être visible uniquement quand un autre champ a une certaine valeur. Le `semantics.json` H5P officiel utilise la propriété `widget: "showWhen"` :

```javascript
{
    key: 'advancedOption',
    label: t('editor_label_advanced'),
    type: 'text',
    showWhen: {
        field: 'enableAdvanced',   // clé du champ de contrôle
        value: true                // valeur qui rend ce champ visible
    }
}
```

> L'éditeur doit masquer/afficher dynamiquement le champ selon la valeur du champ de contrôle. Implémenter dans `field-renderers.js` un listener sur le champ de contrôle qui toggle la visibilité.

**`dynamicObject` — Schéma variable selon le type sélectionné**

Pour les conteneurs avec exercices filles, le schéma des champs varie selon le type d'exercice sélectionné (ex : QCM vs Vrai/Faux vs Texte à trous). Utiliser un type `dynamicObject` dans le schéma de l'éditeur :

```javascript
{
    key: 'exercise',
    label: t('editor_label_exercise'),
    type: 'dynamicObject',
    typeField: '_exerciseLibrary',    // champ qui détermine le schéma actif
    schemas: {
        'H5P.MultiChoice': { fields: [ /* ... */ ] },
        'H5P.TrueFalse':   { fields: [ /* ... */ ] },
        'H5P.Blanks':      { fields: [ /* ... */ ] },
    }
}
```

> Le rendu de l'éditeur doit surveiller la valeur de `typeField` et recharger dynamiquement les champs affichés quand l'utilisateur change le type.

**`optionsFrom` — Résolution relative dans les tableaux imbriqués**

Quand un champ `select` tire ses options d'un autre champ (ex : lier une zone de dépôt à un élément d'une liste), la résolution du chemin doit tenir compte du contexte d'imbrication :

```javascript
{
    key: 'targetElement',
    type: 'select',
    optionsFrom: {
        path: '../../elements',        // chemin relatif depuis le contexte courant
        labelField: 'label',
        valueField: 'id'
    }
}
```

> La résolution de `../../` remonte dans la hiérarchie des données JSON. Implémenter dans `field-renderers.js` ou `json-utils.js` une fonction qui résout ces chemins relatifs depuis le contexte d'édition courant.

### 7.3. Normalisation / Dénormalisation (si nécessaire)

**Fonction** : `normalizeDataForEditor(data, moduleKey)` (~ligne 1807)

Si la structure H5P diffère de ce que l'éditeur attend (ex: Glossary = tableau → objet avec `items`) :

```javascript
case 'NomActivite':
    // Adapter la structure pour l'éditeur
    return { items: data.elements.map(e => ({ ... })) };
```

**Fonction** : `denormalizeDataForSave(data, moduleKey)` (~ligne 1910)

Opération inverse pour la sauvegarde :

```javascript
case 'NomActivite':
    // Reconvertir la structure éditeur vers H5P
    return { elements: data.items.map(i => ({ ... })) };
```

#### Pattern `_exerciseLibrary` pour les conteneurs avec exercices filles

Pour les activités conteneurs, l'éditeur a besoin d'un champ explicite indiquant le type de chaque exercice fille, mais le format H5P stocke cette information dans une structure `library`/`subContentId`/`params` imbriquée. La normalisation crée un champ virtuel `_exerciseLibrary` :

```javascript
// normalizeDataForEditor — extraction du type
case 'MonConteneur':
    data.slides.forEach(slide => {
        slide.elements?.forEach(el => {
            if (el.action?.library) {
                // Extraire le type pour l'éditeur
                el._exerciseLibrary = el.action.library.split(' ')[0]; // "H5P.MultiChoice"
                // Aplatir les params pour l'édition
                Object.assign(el, el.action.params);
            }
        });
    });
    return data;

// denormalizeDataForSave — reconstruction de la structure H5P
case 'MonConteneur':
    data.slides.forEach(slide => {
        slide.elements?.forEach(el => {
            if (el._exerciseLibrary) {
                el.action = {
                    library: el._exerciseLibrary + ' X.Y',
                    subContentId: generateUUID(),
                    params: { /* ... champs extraits */ }
                };
                delete el._exerciseLibrary;
            }
        });
    });
    return data;
```

> Ce pattern permet à l'éditeur d'afficher un sélecteur de type (`dynamicObject`) et d'adapter les champs affichés selon le type sélectionné, tout en reconstruisant la structure H5P valide à la sauvegarde.

### 7.4. Règles de validation

**Fichier** : `js/editor/validators.js`

**Fonction** : `getTypeSpecificErrors(data, schema)` (~ligne 357)

Ajouter les validations métier :

```javascript
case 'NomActivite':
    if (!data.elements || data.elements.length < 2) {
        errors.push({ field: 'elements', message: t('editor_error_min_elements') });
    }
    // + validations spécifiques (champs non vides, cohérence, etc.)
    break;
```

### 7.5. Onglet « Aide » de l'éditeur

**Obligatoire pour chaque activité.** L'éditeur doit proposer un onglet **Aide** accessible depuis le menu latéral de l'éditeur (icône `fa-question-circle`). Cet onglet aide l'utilisateur à comprendre chaque champ de l'activité sans lire de documentation technique.

#### Contenu de l'onglet Aide

Pour chaque champ éditable de l'activité, l'onglet affiche :

1. **Libellé lisible** (en français, pas le nom de la clé JSON ni la clé de traduction technique)
2. **Description courte** expliquant à quoi sert le champ
3. **Exemple concret** montrant une valeur typique
4. **Contraintes** éventuelles (nombre minimum/maximum, format attendu, etc.)

#### Règles

- Les libellés utilisent des **clés de traduction** (`editor_help_*`) — jamais de texte français codé en dur
- L'aide est générée automatiquement à partir du schéma de l'éditeur quand c'est possible (label, hint, minItems, maxItems, required)
- Pour les champs complexes (dynamicObject, arrays imbriqués, showWhen), une explication humaine supplémentaire est ajoutée
- L'onglet Aide est disponible pour **toutes** les activités (H5P et Moodle), pas uniquement CoursePresentation

#### Clés de traduction requises

Pour chaque activité, ajouter dans les 11 fichiers `js/locales/*.json` :

```
editor_help_{moduleKey}_{fieldKey}_desc   → description du champ
editor_help_{moduleKey}_{fieldKey}_example → exemple de valeur
```

#### Fichiers à modifier

- `js/editor/editor-core.js` — Ajouter la section Aide dans le rendu de l'éditeur
- `js/editor/content-detector.js` — Enrichir les schémas avec les clés `helpDesc` et `helpExample` si nécessaire
- `js/locales/*.json` — Ajouter les clés `editor_help_*` pour chaque activité

### 7.6. Validation Phase 6

- [ ] L'éditeur détecte automatiquement le type de contenu
- [ ] Tous les champs sont éditables et bien labellisés
- [ ] Les tableaux (array) supportent ajout/suppression/réorganisation
- [ ] La sauvegarde régénère un fichier .h5p valide
- [ ] Les erreurs de validation s'affichent correctement
- [ ] L'onglet Aide est présent et affiche les descriptions de tous les champs

---

## 8. Phase 7 — Export document (DOCX/ODT/PDF)

### 8.1. Fonction de formatage

**Fichier** : `js/export/document-formatter.js`

#### a) Ajouter au registre des formateurs

**Objet** : `formatters` dans `formatContentForDocument()` (~ligne 21)

```javascript
'NomActivite': formatNomActivite,
```

#### b) Implémenter la fonction de formatage

```javascript
function formatNomActivite(data) {
    const sections = [];
    const title = data.title || t('h5p_nom_activite_name');

    // En-tête
    sections.push({ type: 'header', level: 1, text: title });

    // Consigne
    if (data.taskDescription) {
        sections.push({ type: 'paragraph', text: data.taskDescription, style: 'instructions' });
    }

    // Contenu principal
    // ... adapter selon la structure de l'activité

    // Correction (si pertinent)
    sections.push({ type: 'pageBreak' });
    sections.push({ type: 'header', level: 1, text: title + ' — ' + t('doc_fmt_correction') });
    // ... réponses avec corrections

    return { title, sections };
}
```

#### c) Conteneurs avec exercices filles — routing par library

Si l'activité est un **conteneur** avec des exercices filles (comme CoursePresentation ou QuizSet), le routing vers les helpers de formatage utilise `library.includes('NomType')` :

```javascript
// ✅ BON : utiliser library.includes() avec le nom H5P (PascalCase)
if (library.includes('MultiChoice')) {
    formatMultiChoiceStatement(params, sections);
} else if (library.includes('TrueFalse')) {
    formatTrueFalseStatement(params, sections);
}
```

> **⚠️ Prérequis** : le champ `exercise.library` doit contenir le format complet (`"H5P.MultiChoice 1.16"`) et non une clé simplifiée (`"multichoice"`). C'est garanti si le healer respecte la règle §4.4.
>
> **Réutilisation** : les helpers `formatMultiChoiceStatement()`, `formatTrueFalseStatement()`, `formatBlanksStatement()`, etc. sont déjà définis pour QuizSet. Les réutiliser directement pour les conteneurs — ne pas réécrire la logique de formatage.

> **Types de sections disponibles** :
> - `header` (level 1-3)
> - `paragraph` (styles: `description`, `question`, `answer`, `instructions`, `subtitle`)
> - `bulletPoint`
> - `checkbox`
> - `separator`
> - `image` (url, width, height)
> - `table` (rows/cells)
> - `pageBreak`
> - `flashcardTable` (mise en page cartes A4, 8/page)

> **Convention pédagogique** : Pour les quiz/exercices, le document comporte 2 parties : l'**énoncé** (pour les élèves) puis la **correction** (pour l'enseignant) séparés par un saut de page.

### 8.2. Validation Phase 7

- [ ] Export DOCX produit un fichier lisible dans Word/LibreOffice
- [ ] Export ODT produit un fichier lisible dans LibreOffice
- [ ] Export PDF produit un fichier lisible
- [ ] La mise en page est propre et professionnelle
- [ ] Les formules LaTeX sont converties en Unicode dans les exports

---

## 9. Phase 8 — Aide d'urgence (Emergency Help)

Le bouton `?` dans le panneau latéral affiche une aide contextuelle pour chaque type d'activité.

### 9.1. Clés de traduction `eh_*`

**Fichier** : `js/locales/fr.json` (et les 10 autres)

Ajouter un bloc de ~15-20 clés suivant le patron :

```json
"eh_nom_activite_desc": "Description pédagogique de l'activité...",
"eh_nom_activite_field_title": "Titre de l'activité",
"eh_nom_activite_field_task": "Consigne affichée à l'élève",
"eh_nom_activite_field_elements": "Liste des éléments de contenu",
"eh_nom_activite_field_text": "Texte de chaque élément",
"eh_nom_activite_field_answer": "Réponse correcte",
"eh_nom_activite_good_example": "Exemple de bonne réponse",
"eh_nom_activite_good_tip": "Pensez à un événement concret...",
"eh_nom_activite_bad_example": "Laisser le champ vide ou écrire un texte sans rapport.",
"eh_nom_activite_rule_1": "Première règle importante",
"eh_nom_activite_rule_2": "Deuxième règle importante"
```

> **Modèle** : S'inspirer des `eh_flashcards_*` (~20 clés) ou `eh_crossword_*` (~20 clés) qui sont les plus complets.

### 9.2. Validation Phase 8

- [ ] Le bouton `?` affiche l'aide contextuelle correcte
- [ ] Les champs, exemples et erreurs fréquentes sont pertinents
- [ ] L'aide s'affiche dans les 11 langues

---

## 10. Phase 9 — Assets visuels

### 10.1. Icône de la tuile

**Fichier** : `assets/images/activities/nom-activite.webp`

- **Format** : WebP
- **Dimensions** : ~200×200px (carré ou ratio proche)
- **Style** : Cohérent avec les icônes existantes (contour coloré, fond clair)
- **Nommage** : kebab-case correspondant au `image` de `definitions.js`

### 10.2. Images tutoriel (optionnel)

**Dossier** : `assets/images/tutorials/`

Si l'activité nécessite des captures d'écran spécifiques dans le tutoriel, les ajouter ici.

### 10.3. Images wiki (optionnel)

**Dossier** : `assets/images/wiki/`

Pour les illustrations de la documentation utilisateur.

### 10.4. Validation Phase 9

- [ ] L'icône s'affiche correctement sur la tuile
- [ ] L'icône est lisible en petit format (tuile) et grand (modale)
- [ ] Le fichier WebP est optimisé (<50 Ko idéalement)

---

## 11. Phase 10 — Librairies H5P vendor

### 11.1. Dossier de la librairie principale

**Dossier** : `js/vendor/h5p-libs/H5P.ActivityName-X.Y/`

Contenu minimal requis :
```
H5P.ActivityName-X.Y/
├── library.json          # Métadonnées H5P officielles
├── semantics.json        # Schéma des champs H5P
├── scripts/              # JavaScript du player
│   └── ...
├── styles/               # CSS du player
│   └── ...
└── icon.svg              # Icône H5P (optionnel)
```

> **Source** : Télécharger depuis [h5p.org](https://h5p.org) ou extraire d'un fichier .h5p existant.

### 11.2. Dépendances vendor

Vérifier que **toutes** les `extraDependencies` listées dans `processorMetadata` sont présentes dans `js/vendor/h5p-libs/`. Les dépendances communes (`H5P.MathDisplay-1.0`, `H5P.FontAwesome-4.5`, `H5P.JoubelUI-1.3`, etc.) sont déjà présentes.

### 11.3. Validation Phase 10

- [ ] Le dossier `H5P.ActivityName-X.Y/` contient `library.json` et `semantics.json`
- [ ] Toutes les dépendances sont présentes dans `h5p-libs/`
- [ ] La version dans `processorMetadata` correspond au dossier

---

## 12. Phase 11 — Tests

### 12.1. Tests de cohérence (`tests/test-definitions.js`)

Ce test vérifie **automatiquement** que :
- Tous les champs requis sont présents dans `h5pModules`
- Les IDs DOM sont uniques
- L'image existe dans `assets/images/activities/`
- Le processeur existe et retourne des métadonnées
- Au moins un fichier d'exemple existe dans `assets/data/examples/`
- Les clés de traduction `name` et `description` existent dans `fr.json`

> **Action** : Aucune modification nécessaire si les conventions sont respectées. Simplement **lancer le test** pour vérifier.

### 12.2. Tests d'export document (`tests/test-document-export.js`)

Vérifie que chaque activité produit un export valide dans les 3 formats.

> **Action** : Le test itère automatiquement sur tous les modules. S'assurer qu'un exemple JSON existe pour la nouvelle activité.

### 12.3. Tests d'intégration (`tests/test-integration.js`)

Pipeline complet : JSON → healer → processeur → H5P.

> **Action** : Vérifier que le pipeline fonctionne de bout en bout.

### 12.4. Tests i18n (`tests/test-i18n.js`)

Vérifie que toutes les clés existent dans les 11 langues.

### 12.5. Tests de robustesse (`tests/test-robustness.js`)

Vérifie le comportement avec des JSON malformés, des champs manquants, etc.

### 12.6. Comment lancer les tests

```bash
python3 -m http.server 8000
# Ouvrir : http://localhost:8000/tests/test-all.html
# Ou individuellement : http://localhost:8000/tests/test-definitions.html
```

### 12.7. Validation Phase 11

- [ ] `test-definitions.js` — Tous les tests passent
- [ ] `test-i18n.js` — Cohérence des clés de traduction
- [ ] `test-document-export.js` — Exports fonctionnels
- [ ] `test-integration.js` — Pipeline complet OK
- [ ] `test-robustness.js` — Pas de crash avec des données invalides

---

## 13. Phase 12 — Documentation & Wiki

### 13.1. Wiki utilisateur (`wiki.md`)

Ajouter une section décrivant la nouvelle activité pour les enseignants :
- Nom et description pédagogique
- Cas d'usage typiques
- Captures d'écran
- Conseils de rédaction du prompt

### 13.2. Changelog

Mentionner l'ajout dans le changelog de la prochaine version :
```
## vX.Y.Z
- Ajout : Nouvelle activité H5P « Nom de l'activité »
```

### 13.3. README.md

Mettre à jour la liste des activités H5P supportées dans le README.

### 13.4. Guide processeur (`docs/guide-processeurs.md`)

Pas de modification nécessaire sauf si l'activité introduit un nouveau pattern.

### 13.5. Validation Phase 12

- [ ] Le wiki décrit la nouvelle activité
- [ ] Le changelog mentionne l'ajout
- [ ] Le README liste la nouvelle activité

---

## 14. Phase 13 — Intégration QuizSet (optionnel)

Si l'activité doit pouvoir être utilisée comme **sous-question** dans un QuizSet :

### 14.1. Processeur — `transformForQuizSet()`

**Fichier** : `js/h5p/processors/NomActivite.js`

```javascript
transformForQuizSet(question) {
    question.params = this.process(question.params);
    return question;
}
```

### 14.2. Routeur — `libraryToKey`

**Fichier** : `js/h5p/processors/index.js`

S'assurer que l'entrée existe :
```javascript
'H5P.ActivityName': 'NomActivite',
```

### 14.3. Healer — versions des librairies

**Fichier** : `js/h5p/json-healer.js`

Ajouter dans `H5P_LIB_VERSIONS` :
```javascript
'H5P.ActivityName': '1.0'
```

### 14.4. Prefetch — types QuizSet

**Fichier** : `js/h5p/h5p-prefetch.js`

Si pertinent, ajouter le type dans la liste des sous-types pré-chargés pour QuizSet (~ligne 114).

### 14.5. Éditeur — normalisation QuizSet

**Fichier** : `js/editor/content-detector.js`

Dans `normalizeDataForEditor()` et `denormalizeDataForSave()`, ajouter les cas spécifiques si le format de l'activité diffère entre mode standalone et mode QuizSet.

### 14.6. Prompts QuizSet

Mettre à jour les clés `prompt_quizset_*`, `prompt_quizset_qcm_*`, `prompt_quizset_vf_*` pour mentionner le nouveau type dans les instructions de l'IA.

### 14.7. Validation Phase 13

- [ ] Le type apparaît comme sous-question dans un QuizSet généré
- [ ] Le QuizSet se télécharge et s'affiche correctement
- [ ] L'éditeur gère le type imbriqué dans un QuizSet

---

## 14b. Phase 13b — Activité conteneur avec exercices filles (ex : CoursePresentation)

Si l'activité est elle-même un **conteneur** qui embarque des exercices filles existant en standalone (pattern : QuizSet, CoursePresentation), des règles supplémentaires s'appliquent.

### 14b.1. Architecture du processeur conteneur

Le processeur doit être **async** et utiliser `helpers.processChild()` pour déléguer le traitement de chaque exercice fille à son processeur standalone :

```javascript
export default {
    async process(jsonObj, helpers) {
        for (const item of jsonObj.items) {
            if (item.exercise) {
                // 1. Identifier le type via item.exercise.library
                // 2. Extraire les params (SANS la clé library)
                const { library, ...params } = item.exercise;
                // 3. Déléguer au processeur standalone
                const processed = await helpers.processChild({
                    library: library,
                    params: params  // ← Données brutes, PAS restructurées
                });
            }
        }
    }
};
```

> **⚠️ RÈGLE ABSOLUE — Pass-through des params :**
>
> Le processeur conteneur **ne doit jamais restructurer** les données des exercices filles. Il doit retirer la clé `library`, passer tout le reste tel quel au processeur enfant, et ajouter uniquement des normalisations défensives pour les cas limites documentés de l'IA (voir tableau en §5.1b).
>
> **Pourquoi ?** L'IA génère le même format JSON qu'en mode standalone. Le processeur enfant attend ce format exact. Toute restructuration intermédiaire (ajout de valeurs par défaut, renommage de clés, suppression de champs) casse le pipeline.

### 14b.2. Résolution flexible de la clé `library`

L'IA peut générer la library sous deux formats :
- Chaîne complète : `"H5P.MultiChoice 1.16"` (format du prompt)
- Clé simplifiée : `"multichoice"` (format interne)

Le processeur doit accepter les deux :

```javascript
const LIBRARY_MAP = {
    'multichoice': 'H5P.MultiChoice 1.16',
    'truefalse':   'H5P.TrueFalse 1.8',
    // ...
};

// Résolution : accepter "H5P.MultiChoice 1.16" OU "multichoice"
const rawLib = (exercise.library || '').trim();
const libraryKey = rawLib.includes('.')
    ? Object.keys(LIBRARY_MAP).find(k =>
        LIBRARY_MAP[k].toLowerCase() === rawLib.toLowerCase()
      ) || rawLib.toLowerCase()
    : rawLib.toLowerCase();
```

### 14b.3. Prompt du conteneur — Format des exercices filles

Le prompt du conteneur doit décrire chaque type d'exercice fille en utilisant **exactement** les mêmes clés et formats que le prompt standalone (cf. tableau §5.1b).

Chaque exercice fille dans le JSON contient :
1. `library` : chaîne complète H5P (ex : `"H5P.MultiChoice 1.16"`)
2. Toutes les autres clés **identiques** au format standalone

```json
{
  "exercise": {
    "library": "H5P.Blanks 1.14",
    "taskDescription": "Complétez le texte :",
    "questions": [
      "Rome est la *capitale* de l'Italie."
    ],
    "overallFeedback": [...]
  }
}
```

> **Méthode de rédaction du prompt conteneur :**
> 1. Pour chaque type d'exercice supporté, ouvrir le prompt standalone (`assets/data/prompts/{activite}.md`)
> 2. Copier la section "Structure JSON attendue" du prompt standalone
> 3. Ajouter uniquement la clé `library` devant
> 4. Vérifier avec les exemples standalone (`assets/data/examples/`) que le format est identique
> 5. **Ne jamais inventer** un format différent pour le contexte conteneur

### 14b.4. Normalisation défensive dans le processeur

Malgré le prompt, l'IA peut dévier du format attendu. Documenter et traiter les cas connus :

```javascript
function buildExerciseParams(exercise, type) {
    const { library, ...params } = exercise;

    // Cas connus de déviation IA (documentés, à compléter si besoin)
    switch (type) {
        case 'blanks':
            // L'IA génère parfois [{text: "..."}] au lieu de ["..."]
            if (params.questions) {
                params.questions = params.questions.map(q =>
                    typeof q === 'string' ? q : (q.text || '')
                );
            }
            break;
        case 'truefalse':
            // L'IA génère parfois un booléen au lieu d'une string
            if (params.correct !== undefined) {
                params.correct = String(params.correct);
            }
            break;
    }

    return params;
}
```

> **Quand ajouter une normalisation :**
> - Uniquement si le bug a été **observé en production** (pas de normalisation préventive)
> - Toujours ajouter un commentaire expliquant le cas
> - Vérifier que la normalisation n'altère pas les données correctes

### 14b.5. Workaround `preventResize` dans h5p-manager

Certaines activités conteneurs (notamment celles qui gèrent plusieurs slides ou pages) définissent `preventResize = true` sur toutes leurs instances filles lors de la création. Cela empêche les exercices filles de se redimensionner correctement au premier affichage, causant des bugs de positionnement (zones de dépôt invisibles, éléments mal placés, etc.).

**Fichier** : `js/h5p/h5p-manager.js` — méthode `_scheduleResize()`

Le workaround consiste à accéder aux instances H5P dans l'iframe, désactiver `preventResize` sur chaque instance fille, puis forcer un `trigger('resize')` :

```javascript
_scheduleResize(container) {
    const fixSubInstances = () => {
        const iframe = container.querySelector('iframe');
        if (!iframe?.contentWindow) return;
        try {
            const iframeH5P = iframe.contentWindow.H5P;
            if (!iframeH5P?.instances) return;
            const parentInstance = iframeH5P.instances[0];
            if (!parentInstance?.elementInstances) return;

            for (const group of parentInstance.elementInstances) {
                if (!group) continue;
                for (const inst of group) {
                    if (!inst) continue;
                    if (inst.preventResize === true) inst.preventResize = false;
                    if (inst.trigger && inst.$) iframeH5P.trigger(inst, 'resize');
                }
            }
            iframe.contentWindow.dispatchEvent(new Event('resize'));
        } catch { /* iframe cross-origin ou pas prête */ }
    };

    // Plusieurs tentatives car le chargement des exercices filles est progressif
    setTimeout(fixSubInstances, 500);
    setTimeout(fixSubInstances, 2000);
    setTimeout(fixSubInstances, 5000);
}
```

> **Quand l'appliquer** : Pour toute activité conteneur dont le code source H5P contient `preventResize = true` dans la logique d'initialisation des enfants. Vérifier dans le fichier JS principal de la librairie H5P (ex : `dist/h5p-*.js`).

### 14b.6. Validation Phase 13b

- [ ] Chaque type d'exercice fille fonctionne dans le conteneur (tester tous les types)
- [ ] Le format JSON du prompt conteneur est identique au format standalone pour chaque type
- [ ] Les exemples JSON du conteneur sont valides et chaque exercice utilise le format standalone
- [ ] Les exercices filles sont interactifs dans le player H5P (pas de "Exercice non reconnu")
- [ ] Le mode debug affiche les logs de `processChild` pour chaque exercice fille
- [ ] Tester avec un JSON généré par l'IA (pas seulement les exemples manuels)

---

## 15. Phase 14 — Cas spéciaux

### 15.1. Renderers spécialisés

Si l'activité nécessite un rendu visuel spécial (grille, graphique, etc.) :

**Dossier** : `js/renderers/`

Créer un fichier `nom-activite-renderer.js` et/ou `nom-activite-grid-generator.js`.

> **Exemples existants** :
> - `chart-renderer.js` — Rendu des diagrammes
> - `crossword-grid-generator.js` + `crossword-grid-capture.js` — Grille de mots croisés
> - `find-the-words-grid-generator.js` + `find-the-words-grid-capture.js` — Grille de mots mêlés
> - `math-renderer.js` — Formules LaTeX → SVG (via MathJax)

**Fichier** : `js/ui/notifications.js` (~ligne 1762)

Si l'activité nécessite une capture de grille asynchrone (comme Crossword ou FindTheWords), ajouter le branchement dans la logique de rendu de la preview :

```javascript
if (moduleKey === 'NomActivite') {
    const { captureNomActiviteGrid } = await import('../renderers/nom-activite-grid-capture.js');
    gridImage = await captureNomActiviteGrid(jsonData);
}
```

### 15.2. Librairies externes

Si l'activité requiert une librairie JavaScript externe :

**Fichier** : `js/core/lib-loader.js`

Ajouter l'entrée dans `LIB_PATHS` :

```javascript
'nom-lib': {
    js: 'js/vendor/nom-lib/v1.0/nom-lib.min.js',
    css: 'js/vendor/nom-lib/v1.0/nom-lib.css' // optionnel
}
```

### 15.3. Shuffling / Randomisation

Si l'activité bénéficie d'un mélange aléatoire des éléments (pour que l'ordre ne révèle pas la réponse) :

**Fichier** : `js/h5p/h5p-creator.js`

Ajouter la logique de shuffle dans `handleH5PCreation()`, après le healing et avant le processing (comme DragAndDrop ~ligne 86).

### 15.4. CSS spécifique

Si l'éditeur ou le preview nécessite des styles spécifiques :

**Dossier** : `css/components/`

Créer ou modifier un fichier CSS. Le charger conditionnellement si possible.

#### Layout compact pour les sections d'options de l'éditeur

Quand l'éditeur comporte de nombreuses sections de configuration (options de présentation, comportement, surcharges), utiliser un layout compact en CSS grid ou flexbox pour éviter que l'éditeur ne devienne trop long verticalement :

```css
/* Exemple : options en grille 2 colonnes */
.json-editor-section.compact-options .editor-field {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

/* Les champs booléens (toggle) sur une seule ligne */
.json-editor-section.compact-options .editor-field-boolean {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
}
```

> Appliquer ce pattern dès que la section contient plus de 4-5 champs de type `boolean` ou `select`. Marquer la section avec une classe CSS (`compact-options`) dans le schéma de l'éditeur via la propriété `cssClass`.

### 15.5. Gestion des mathématiques

Si l'activité supporte les formules LaTeX :
- Le healer gère déjà la conversion `$...$` → `\(...\)` et l'auto-wrapping
- S'assurer que `H5P.MathDisplay` est dans les `extraDependencies`
- Pour les exports document : le `postProcessLatex()` convertit automatiquement en Unicode

Si l'activité a des contraintes spéciales avec le LaTeX (comme Crossword qui convertit les lettres grecques en majuscules), ajouter la logique dans le healer.

---

## 16. Checklist de validation finale

### Fonctionnel

- [ ] **Tuile** — Apparaît dans la grille, filtrable par catégorie/plateforme
- [ ] **Prompt** — Se génère correctement en mode Rapide et Avancé
- [ ] **Génération IA** — Le "un clic" produit un résultat valide
- [ ] **Healing** — Le JSON est correctement réparé (LaTeX, structure, champs manquants)
- [ ] **H5P** — Le fichier .h5p se télécharge et s'ouvre dans un player
- [ ] **Prévisualisation** — Le player H5P intégré affiche l'activité
- [ ] **Éditeur** — Les champs sont éditables, la sauvegarde régénère un H5P valide
- [ ] **Export DOCX** — Document lisible et bien formaté
- [ ] **Export ODT** — Document lisible et bien formaté
- [ ] **Export PDF** — Document lisible et bien formaté
- [ ] **Aide `?`** — L'aide contextuelle s'affiche avec les bons champs
- [ ] **Multi-langue** — Tout fonctionne dans les 11 langues

### Technique

- [ ] **Tests** — Tous les tests automatisés passent
- [ ] **Debug** — Le mode `?debug` affiche les logs corrects
- [ ] **Session** — Le contexte est sauvé/restauré correctement dans sessionStorage
- [ ] **Erreurs** — Les erreurs sont classifiées et affichées proprement
- [ ] **Performance** — Pas de régression de performance mesurable

### Documentation

- [ ] **Wiki** — L'activité est documentée pour les enseignants
- [ ] **Changelog** — L'ajout est mentionné
- [ ] **README** — La liste des activités est à jour

---

## Annexe A — Squelette de processeur

```javascript
/**
 * Processeur H5P pour NomActivite
 * Transforme le JSON simplifié de l'IA en structure H5P.ActivityName valide.
 */

import { formatTextToHtml, generateUUID } from '../../core/utils.js';
import { translations, currentLang } from '../../core/translation.js';

export default {
    process(jsonObj) {
        const title = jsonObj.title || translations.h5p_nom_activite_name || 'Activité';

        // === Contenu principal ===
        const elements = (jsonObj.elements || []).map(el => ({
            text: formatTextToHtml(el.text || ''),
            // ... mapper les champs
        }));

        // === Feedbacks (pattern commun) ===
        const overallFeedback = (jsonObj.overallFeedback || []).map(fb => ({
            from: fb.from,
            to: fb.to,
            feedback: formatTextToHtml(fb.feedback || '')
        }));

        // === Comportement ===
        const behaviour = {
            enableRetry: true,
            enableSolutionsButton: true,
            ...(jsonObj.behaviour || {})
        };

        // === Localisation H5P ===
        const l10n = {
            checkAnswer: translations.h5p_check_answer || 'Vérifier',
            submitAnswer: translations.h5p_submit_answer || 'Soumettre',
            showSolution: translations.h5p_show_solution || 'Afficher la solution',
            tryAgain: translations.h5p_try_again || 'Réessayer',
        };

        return {
            title,
            elements,
            overallFeedback,
            behaviour,
            l10n
        };
    },

    // Optionnel : intégration QuizSet
    transformForQuizSet(question) {
        question.params = this.process(question.params);
        return question;
    }
};
```

---

## Annexe B — Patron de clés de traduction

Pour une activité fictive "WordCloud", voici l'ensemble complet des clés à ajouter :

```
=== Identité (2 clés) ===
h5p_word_cloud_name
h5p_word_cloud_description

=== Prompts IA (3 clés) ===
prompt_word_cloud_regles_specifiques
prompt_word_cloud_structure_json
prompt_word_cloud_exemple_rendu

=== Emergency Help (~15 clés) ===
eh_word_cloud_desc
eh_word_cloud_field_title
eh_word_cloud_field_words
eh_word_cloud_field_word_text
eh_word_cloud_field_word_weight
eh_word_cloud_good_example
eh_word_cloud_good_tip
eh_word_cloud_bad_example
eh_word_cloud_rule_uniqueness
eh_word_cloud_rule_weight

=== Export document (si spécifique, 0-5 clés) ===
doc_fmt_word_cloud_header
doc_fmt_word_cloud_words

=== Tutoriel (modification HTML inline) ===
tuto_step2_h5p_content → ajouter <li>

TOTAL ESTIMÉ : ~22-25 clés par activité × 11 langues = ~250 insertions
```

---

## Annexe C — Fichiers modifiés (récapitulatif)

| # | Fichier | Action | Phase |
|---|---------|--------|-------|
| 1 | `js/core/definitions.js` | Ajouter entrée `h5pModules` + `customOrder` | 1 |
| 1b | `js/core/translation.js` | Ajouter clé `name` dans `defaultTranslations` | 1 |
| 2 | `js/h5p/processors/NomActivite.js` | **Créer** le processeur | 2 |
| 3 | `js/h5p/processors/index.js` | 3 maps : metadata, loaders, libraryToKey | 2 |
| 4 | `js/h5p/json-healer.js` | Set H5P_MODULE_KEYS + healing spécifique | 3 |
| 5 | `assets/data/prompts/nom_activite.md` | **Créer** template prompt | 4 |
| 6 | `assets/data/examples/nom_activite_*.json` | **Créer** 2+ exemples JSON | 4 |
| 7 | `js/services/prompt-generator.js` | Ajouter à ACTIVITY_CONFIG | 4 |
| 8 | `js/services/llm.js` | (optionnel) Surcharge modèle | 4 |
| 9 | `js/locales/fr.json` | ~25 clés de traduction | 5 |
| 10 | `js/locales/en.json` | ~25 clés | 5 |
| 11 | `js/locales/es.json` | ~25 clés | 5 |
| 12 | `js/locales/de.json` | ~25 clés | 5 |
| 13 | `js/locales/it.json` | ~25 clés | 5 |
| 14 | `js/locales/nl.json` | ~25 clés | 5 |
| 15 | `js/locales/pt.json` | ~25 clés | 5 |
| 16 | `js/locales/ar.json` | ~25 clés | 5 |
| 17 | `js/locales/zh.json` | ~25 clés | 5 |
| 18 | `js/locales/jp.json` | ~25 clés | 5 |
| 19 | `js/locales/el.json` | ~25 clés | 5 |
| 20 | `js/editor/content-detector.js` | Signature + schéma + normalisation | 6 |
| 21 | `js/editor/validators.js` | Règles de validation | 6 |
| 22 | `js/export/document-formatter.js` | Formateur + registre | 7 |
| 23 | `assets/images/activities/nom-activite.webp` | **Créer** icône | 9 |
| 24 | `js/vendor/h5p-libs/H5P.ActivityName-X.Y/` | **Copier** librairie H5P | 10 |
| 25 | `wiki.md` | Ajouter section | 12 |
| 26 | `README.md` | Mettre à jour liste | 12 |

**Total : ~27 fichiers modifiés/créés minimum** (dont 11 fichiers de traduction).

---

> **Rappel** : Ce PRD est un **modèle générique**. Pour chaque nouvelle activité, remplacer `NomActivite`, `nom_activite`, `H5P.ActivityName`, etc. par les identifiants réels de l'activité à ajouter.
