# Flux de donnees complet - Caramel

> Document de reference technique decrivant le cheminement des donnees depuis
> la saisie utilisateur jusqu'au telechargement du fichier final (.h5p, .mbz, .xml)
> et aux exports documentaires (DOCX, ODT, PDF).

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Flux H5P](#2-flux-h5p)
3. [Flux Moodle / Elea](#3-flux-moodle--elea)
4. [Edition et regeneration](#4-edition-et-regeneration)
5. [Export documentaire](#5-export-documentaire)
6. [Cas speciaux](#6-cas-speciaux)
7. [Reference des donnees stockees](#7-reference-des-donnees-stockees)

---

## 1. Vue d'ensemble

Caramel utilise un pipeline en plusieurs etapes pour transformer les saisies
utilisateur en contenus pedagogiques interactifs. Tout le traitement se fait
cote client (navigateur), sans serveur applicatif.

```
SAISIE UTILISATEUR
       |
       v
GENERATION DE PROMPT          prompt-generator.js
       |
       v
APPEL IA (via n8n)            llm.js
       |
       v
EXTRACTION JSON               llm.js  (extractJsonContent)
       |
       v
HEALING JSON                  json-healer.js  (3 passes)
       |
       v
PROCESSEUR D'ACTIVITE         h5p-processors/*.js  OU  moodle-processors/*.js
       |
       v
PACKAGING                     h5p-creator.js (ZIP)  OU  moodle-creator.js (TAR+GZIP / XML)
       |
       v
NOTIFICATION + TELECHARGEMENT notifications.js
       |
       v
[OPTIONNEL] EDITION           json-editor/  ->  regeneration du fichier
       |
       v
[OPTIONNEL] EXPORT DOC        document-exporter.js  (DOCX / ODT / PDF)
```

---

## 2. Flux H5P

### 2.1 Declenchement

Deux points d'entree dans `ui.js` :

| Mode | Action utilisateur | Fonction declenchee |
|------|--------------------|---------------------|
| **Rapide** | Clic sur "Generer en un clic" | `attachLLMLogic()` : appel IA puis `createBtn.click()` |
| **Guide** | Clic sur "Generer le H5P" | `attachActivityEventListeners()` : lecture du JSON colle |

Dans les deux cas, le JSON brut (string) est transmis a `handleH5PCreation(moduleKey, jsonInput)` dans `h5p-creator.js`.

### 2.2 Pipeline detaille

```
handleH5PCreation(moduleKey, jsonInput)           h5p-creator.js
  |
  |-- 1. PARSING
  |     JSON.parse(jsonInput)
  |     Si echec : JSONHealer.healJsonString(jsonInput)  ->  re-parse
  |     Resultat : jsonObj (Object)
  |
  |-- 2. HEALING (3 passes)
  |     a) healJsonObject(jsonObj, moduleKey)
  |        - Normalise le LaTeX brut (\pi -> \(\pi\))
  |        - Corrige les versions de librairies H5P
  |     b) healActivitySpecificFields(jsonObj, moduleKey)
  |        - Nettoyage specifique (MarkTheWords multi-mots, DragText LaTeX...)
  |     c) healStructureForActivity(jsonObj, moduleKey)
  |        - Ajoute les champs techniques manquants (behaviour, overallFeedback...)
  |     Resultat : jsonObj heale
  |
  |-- 3. CLONAGE
  |     originalJson = structuredClone(jsonObj)   <-- version Markdown (source d'edition)
  |
  |-- 4. PROCESSEUR H5P
  |     processH5PContent(moduleKey, jsonObj)      h5p-processors/index.js
  |       -> module.default.process(jsonObj, helpers)
  |     Transformations :
  |       - Markdown -> HTML (via formatTextToHtml + DOMPurify)
  |       - Ajout des champs techniques H5P
  |       - Injection des traductions i18n
  |     Resultat : content (HTML-ready) + dependencies (optionnel)
  |
  |-- 5. METADATA
  |     getModuleMetadata(moduleKey)
  |       -> { machineName, version, extraDependencies }
  |
  |-- 6. PACKAGING ZIP
  |     packageAndDownloadH5P(...)
  |       Fichiers dans le ZIP :
  |         content/content.json   <-- content (HTML)
  |         h5p.json               <-- manifeste (titre, librairies, dependances)
  |       Generation : downloadZip(files).blob()  (client-zip)
  |
  |-- 7. TELECHARGEMENT
  |     Fichier : h5p-{type}-caramel-{AAAAMMJJHHMM}-{lang}.h5p
  |     Lien <a> temporaire -> click -> revoke
  |
  +-- 8. NOTIFICATION
        addNotification({
          type: 'h5p',
          blob: zipBlob,
          jsonData: content,           // Version HTML (pour rendu H5P)
          originalJsonData: originalJson, // Version Markdown (pour editeur)
          moduleKey: moduleKey
        })
```

### 2.3 Processeurs H5P disponibles

Chaque processeur est dans `js/h5p/processors/` et exporte :
- `machineName` (ex: `'H5P.Timeline'`)
- `version` (ex: `{ major: 1, minor: 16 }`)
- `extraDependencies` (tableau de librairies requises)
- `default.process(jsonObj, helpers)` (transformation principale)
- `default.transformForQuizSet(question)` (optionnel, pour inclusion dans un QuizSet)

| moduleKey | machineName | Particularites |
|-----------|-------------|----------------|
| Timeline | H5P.Timeline | Eras + events, dates ISO |
| Flashcards | H5P.Flashcards | Images optionnelles, description copiee dans options |
| FillInTheBlanks | H5P.Blanks | Syntaxe *reponse* dans le texte |
| Glossary | H5P.Accordion | Normalisation tableau -> {panels} |
| Crossword | H5P.Crossword | Grille de mots croises |
| Essay | H5P.Essay | Keywords avec options de scoring |
| Summary | H5P.Summary | Groupes d'affirmations avec subContentId |
| DragTheWords | H5P.DragText | Syntaxe *mot* dragable dans le texte |
| TrueFalse | H5P.TrueFalse | Vrai/Faux simple |
| MultipleChoice | H5P.MultiChoice | Reponses avec booleens correct |
| FindTheWords | H5P.FindTheWords | Grille de mots meles, pas de HTML dans taskDescription |
| SortParagraphs | H5P.SortParagraphs | Paragraphes a reordonner |
| SingleChoiceSet | H5P.SingleChoiceSet | Series de QCM a choix unique |
| DialogCards | H5P.Dialogcards | Cartes recto/verso |
| ComplexFillTheBlanks | H5P.AdvancedBlanks | Blanks avec alternatives et indices |
| Chart | H5P.Chart | Diagrammes en barres/camemberts |
| MarkTheWords | H5P.MarkTheWords | Syntaxe *mot* a cliquer, healer multi-mots |
| QuizSet | H5P.QuestionSet | Conteneur recursif (voir cas speciaux) |

---

## 3. Flux Moodle / Elea

### 3.1 Types d'activites Moodle

| moduleKey | Format de sortie | Processeur Moodle | Particularites |
|-----------|------------------|-------------------|----------------|
| Page | .mbz | Page | Generation HTML depuis blocks JSON |
| Millionnaire | .mbz | Millionnaire | Quiz type "Qui veut gagner des millions" |
| Appariement | .mbz | Appariement | Associations question/reponse (epikmatch) |
| QCM (Moodle) | .mbz | QCM | QCM avec Markdown -> HTML |
| Test (Elea) | .mbz | Test | Test Moodle standard |
| Glossaire (Elea) | .mbz | Glossaire | Glossaire Moodle |
| test_elea | .xml | aucun | XML genere directement (moodle-formats.js) |
| glossaireXml | .xml | aucun | XML genere directement (moodle-creator.js) |

### 3.2 Pipeline MBZ (exemple QCM)

```
handleQCMCreation(jsonInput)                      moodle-creator.js
  |
  |-- 1. PARSING + HEALING
  |     JSON.parse(jsonInput)
  |     healStructureForActivity(jsonData, 'QCM')
  |
  |-- 2. TRANSFORMATION
  |     Markdown -> HTML :  **gras** -> <b>gras</b>
  |     Wrap <p> si necessaire
  |     originalJsonData = clone (Markdown)
  |     QUESTIONS_JSON = JSON.stringify(questions) escape
  |
  |-- 3. PLACEHOLDERS
  |     generateBaseData(title) -> IDs aleatoires
  |     data = {
  |       ACTIVITY_TITLE, COURSE_FULLNAME, COURSE_ID,
  |       MODULE_ID, SECTION_ID, ACTIVITY_ID, TIMESTAMP,
  |       QUESTIONS_JSON, ...
  |     }
  |
  |-- 4. PROCESSEUR MOODLE
  |     MoodleProcessors.getActivityFiles('QCM', data)
  |       -> processor.buildFiles(data)
  |       -> Remplacement des {{PLACEHOLDERS}} dans les templates XML
  |     Resultat : { 'chemin/fichier.xml': contenu, ... }
  |
  |-- 5. ARCHIVAGE
  |     createMbz(files)
  |       -> TAR (tar-js) + GZIP (fflate, niveau 9)
  |       -> Blob
  |
  |-- 6. TELECHARGEMENT + NOTIFICATION
  |     addNotification({
  |       type: 'mbz',
  |       blob, jsonData, originalJsonData, moduleKey
  |     })
```

### 3.3 Pipeline XML (pas de processeur Moodle)

Les exports `test_elea` et `glossaireXml` ne passent **pas** par les moodle-processors.
Ils generent le XML directement :

```
handleMoodleXmlCreation(jsonInput)                moodle-creator.js
  |
  |-- JSON.parse + healing
  |-- generateMoodleXml(data)                     moodle-formats.js
  |     Routing par question.type :
  |       matching, multichoice, truefalse,
  |       shortanswer, numerical, cloze
  |-- Telechargement .xml + notification

handleGlossaireXmlCreation(jsonInput)             moodle-creator.js
  |
  |-- JSON.parse
  |-- Generation XML directe (GLOSSARY > ENTRIES > ENTRY)
  |     Chaque entree : CONCEPT, DEFINITION, ALIASES
  |-- Telechargement .xml + notification
```

### 3.4 Structure d'un archive MBZ

```
.ARCHIVE_INDEX                    Manifeste des fichiers/dossiers
moodle_backup.xml                 Manifeste principal du backup
files.xml / roles.xml / ...       Fichiers de configuration Moodle
course/
  course.xml
  enrolments.xml
  inforef.xml
sections/
  section_XXX/
    section.xml
activities/
  {module}_XXX/                   epikmatch_XXX, page_XXX, etc.
    {module}.xml                  Donnees de l'activite
    module.xml
    grades.xml
    inforef.xml
moodle_backup.log
```

---

## 4. Edition et regeneration

### 4.1 Ouverture de l'editeur

```
Clic "Modifier" dans la notification
  |
  v
enterEditMode(notification, previewContainer)     notifications.js
  |
  |-- extractJsonFromNotification(notification)   json-editor/index.js
  |     Priorite :
  |       1. notification.originalJsonData        (Markdown - prioritaire)
  |       2. Extraction depuis le ZIP H5P         (fallback)
  |       3. notification.jsonData                (HTML - dernier recours)
  |
  |-- normalizeDataForEditor(data, moduleKey)     content-detector.js
  |     Cas speciaux :
  |       Glossary : [{title, text}] -> {items: [{title, text}]}
  |       QuizSet/Essay : aplatissement des options
  |
  +-- renderEditor(container, data, schema)       editor-core.js
```

### 4.2 Sauvegarde et regeneration

```
Clic "Enregistrer" dans l'editeur
  |
  v
saveChanges()                                     json-editor/index.js
  |
  |-- getEditorData()                             (collecte des champs)
  |-- healStructureForActivity(data, moduleKey)   (ajout champs manquants)
  |-- getValidationErrors(data, schema)           (validation)
  |-- denormalizeDataForSave(data, moduleKey)      content-detector.js
  |     Cas speciaux :
  |       Glossary : {items: [...]} -> [...]
  |
  v
handleEditorSave(result, notification)            notifications.js
  |
  |-- regenerateFile(notification, editedData, moduleKey)
  |     |
  |     |-- H5P : regenerateH5PFile(blob, editedData, moduleKey, titleKey)
  |     |     1. Passer editedData dans processH5PContent() -> HTML
  |     |     2. Lire h5p.json depuis le ZIP original (dependances)
  |     |     3. Repackager le ZIP avec le nouveau content.json
  |     |
  |     |-- MBZ : regenerateMBZFile(notification, editedData, moduleKey)
  |     |     1. Transformer les donnees (Markdown -> HTML si QCM)
  |     |     2. Regenerer les placeholders
  |     |     3. MoodleProcessors.getActivityFiles() -> fichiers
  |     |     4. createMbz(files) -> nouveau blob
  |     |
  |     +-- XML : regenerateGlossaireXMLFile() ou regenerateMoodleTestXMLFile()
  |           1. Regenerer le XML directement depuis les donnees editees
  |
  +-- Mise a jour de la notification
        notification.blob = newBlob
        notification.blobUrl = nouveau URL
        + mise a jour de jsonData ou originalJsonData (selon le type)
```

### 4.3 Donnee mise a jour apres edition

| Type | titleKey | Champ mis a jour | Raison |
|------|----------|------------------|--------|
| h5p | h5p_*_name | `originalJsonData` | Source Markdown pour reedition |
| mbz | elea_qcm_name | `originalJsonData` | Source Markdown (QCM a du Markdown) |
| mbz | elea_millionnaire_name | `jsonData` | Pas de transformation Markdown |
| mbz | elea_appariement_name | `jsonData` | Pas de transformation Markdown |
| mbz | elea_page_name | `jsonData` + `previewHtml` | Preview HTML regenere en parallele |
| xml | elea_glossaire_xml_name | `jsonData` | XML regenere depuis jsonData |
| xml | elea_test_xml_name | `jsonData` | XML regenere depuis jsonData |

---

## 5. Export documentaire

### 5.1 Source des donnees

```
Clic sur "Exporter en DOCX/PDF/ODT"
  |
  v
exportToDOCX(moduleKey, jsonData)                 document-exporter.js
  |
  |-- Source : notification.originalJsonData || notification.jsonData
  |     Priorite au Markdown (meilleur rendu dans les documents)
  |
  |-- formatContentForDocument(moduleKey, jsonData) document-formatter.js
  |     -> { title, sections: [{type, content, ...}] }
  |
  |-- Langue : currentLang -> LANG_TO_LOCALE -> { bcp47, language, country }
  |
  +-- Generation specifique au format :
        DOCX : new Document({language}) -> Packer.toBlob()
        ODT  : JSZip + templates XML (fo:language, fo:country)
        PDF  : new jsPDF() -> setLanguage() -> save()
```

### 5.2 Formats generes

| Format | Librairie | Particularites |
|--------|-----------|----------------|
| DOCX | docx.js | Sections avec styles, images, tableaux. Langue dans metadata |
| ODT | JSZip + XML manuel | content.xml + styles.xml + meta.xml. Langue dans style:default-style |
| PDF | jsPDF | Rendu texte + images. Langue dans metadata et properties |

---

## 6. Cas speciaux

### 6.1 Glossary (H5P.Accordion)

Le processeur accepte deux formats d'entree et normalise :

```
Entree tableau :   [{title: "...", text: "..."}]
Entree objet  :    {panels: [{title: "...", text: "..."}]}
                            |
                            v
Sortie processeur :  {panels: [{title, content: {params: {text}, library, subContentId, metadata}}], hTag: "h2"}
```

L'editeur normalise en `{items: [...]}` et denormalise en `[...]` a la sauvegarde.

### 6.2 QuizSet (H5P.QuestionSet) - Traitement recursif

```
QuizSet.process(jsonObj, helpers)
  |
  |-- Pour chaque question dans jsonObj.questions :
  |     |
  |     |-- helpers.getKeyFromLibrary(question.library)
  |     |     Ex: "H5P.MultiChoice" -> "MultipleChoice"
  |     |
  |     |-- helpers.processChild(question)
  |     |     -> processQuizSetItem(question)        h5p-processors/index.js
  |     |       |
  |     |       |-- Si transformForQuizSet() existe -> l'utiliser
  |     |       +-- Sinon fallback : process({...question.params})
  |     |
  |     +-- helpers.getLibraryMetadata(moduleKey)
  |           -> dependances de la question enfant ajoutees au QuizSet
  |
  +-- Retour : { content: {...}, dependencies: [...toutes les deps enfants] }
```

### 6.3 Page (Moodle/Elea) - Generation HTML depuis blocks

```
handlePageCreation(jsonInput, 'mbz')
  |
  |-- jsonData = {title, blocks: [{type: "#01_hero_header", ...}, ...]}
  |
  |-- generateHtmlFromBlocks(jsonData)
  |     1. Charger le template : moodle-processors/activities/Page_modele.html
  |     2. Pour chaque block :
  |        - Trouver le template HTML correspondant au type (#01, #02, ...)
  |        - Injecter les donnees dans le template
  |        - 19+ types de blocks supportes
  |     3. Generer les ancres de navigation
  |     Resultat : HTML complet de la page
  |
  +-- CONTENT = HTML escape -> placeholder dans les templates XML
```

### 6.4 test_elea - Pas de processeur Moodle

Les exports au format XML Moodle (`test_elea`) generent le XML directement
via `moodle-formats.js` sans passer par les moodle-processors :

```
generateMoodleXml(data)                           moodle-formats.js
  |
  +-- Routing par question.type :
        matching       -> generateMatchingQuestionXml()
        multichoice    -> generateMultichoiceQuestionXml()
        truefalse      -> generateTrueFalseQuestionXml()
        shortanswer    -> generateShortanswerQuestionXml()
        numerical      -> generateNumericalQuestionXml()
        cloze          -> generateClozeQuestionXml()
```

Un export GIFT est aussi disponible via `generateMoodleGift(data)`.

### 6.5 glossaireXml - Pas de processeur Moodle

Meme principe : XML genere directement dans `moodle-creator.js` avec la structure
`GLOSSARY > INFO + ENTRIES > ENTRY (CONCEPT, DEFINITION, ALIASES)`.

---

## 7. Reference des donnees stockees

### 7.1 Objet Notification

Chaque activite generee est stockee dans une notification (file FIFO, max 20) :

```javascript
{
  id: "notif_1234567890_abc",         // Identifiant unique
  type: "h5p" | "mbz" | "xml",       // Type de fichier
  title: "Mon activite",              // Titre affiche
  titleKey: "h5p_flashcards_name",    // Cle de traduction
  moduleKey: "Flashcards",            // Cle du processeur
  timestamp: 1234567890,              // Date de creation
  status: "success" | "error",        // Statut
  blob: Blob,                         // Fichier genere (.h5p, .mbz, .xml)
  blobUrl: "blob:...",                // URL de telechargement
  jsonData: { ... },                  // Donnees HTML (pour rendu H5P / archivage)
  originalJsonData: { ... },          // Donnees Markdown (pour edition / export doc)
  previewHtml: "<html>..." | null,    // Preview HTML (Page uniquement)
  fileName: "h5p-flashcards-...",     // Nom du fichier telecharge
}
```

### 7.2 jsonData vs originalJsonData

| Champ | Contenu | Utilise par |
|-------|---------|-------------|
| `jsonData` | Version HTML (apres processeur) | Rendu H5P, contenu du ZIP, archivage MBZ |
| `originalJsonData` | Version Markdown (avant processeur) | Editeur JSON, export documentaire |

**Regle de priorite pour l'editeur et l'export :**

```
originalJsonData  (si present)  ->  utilise en priorite
        |
        v (sinon)
jsonData  (fallback)
```

### 7.3 Pipeline de healing JSON

Le healing s'applique dans **tous les cas** (IA ou copier-coller) car il est
execute dans `handleH5PCreation()` / `handleXXXCreation()` avant le processeur :

| Passe | Fonction | Responsabilite |
|-------|----------|----------------|
| 0 | `healJsonString(str)` | Reparer le JSON invalide (backslashes LaTeX mal escapes) |
| 1 | `healJsonObject(obj, key)` | Normaliser le LaTeX, corriger les versions de librairies |
| 2 | `healActivitySpecificFields(obj, key)` | Nettoyage specifique par type d'activite |
| 3 | `healStructureForActivity(obj, key)` | Ajouter les champs techniques manquants |

---

*Derniere mise a jour : Fevrier 2025*
