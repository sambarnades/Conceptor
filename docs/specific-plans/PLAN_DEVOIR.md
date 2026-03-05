# Plan d'action — Activité Moodle "Devoir" (Grille d'évaluation)

> **Type Moodle** : `assign` (activité native Moodle 4.5)
> **Clé module** : `Devoir`
> **moduleName** : `assign`
> **Principe** : L'IA génère un JSON simplifié (titre, description, critères de la grille d'évaluation avec niveaux de réussite). Le processeur construit l'archive MBZ complète avec `assign.xml` + `grading.xml` (rubrique Moodle).

---

## Contexte — Analyse du modèle de référence

Le dossier `modele_activite_devoirs/` contient un backup Moodle 4.5 d'un devoir (`assign`) avec une grille d'évaluation critériée (`rubric`). Voici les fichiers clés :

### `assign.xml` — Configuration du devoir
- `name` : Titre du devoir
- `intro` : Description HTML de l'évaluation
- `grade` : 100 (note maximale)
- `submissiondrafts` : 0 (pas de brouillon)
- `attemptreopenmethod` : `untilpass` (réouverture jusqu'à réussite)
- `maxattempts` : 1
- `completionsubmit` : 1 (achèvement à la soumission)
- `plugin_configs` : Configuration des plugins (soumission fichier activée, feedback par commentaire et PDF activés)

### `grading.xml` — Grille d'évaluation (RUBRIQUE)
C'est le cœur de l'activité. Structure :
- `activemethod` : `rubric`
- `definition` : Contient le nom de la grille, sa description, ses options JSON et les critères
- `criteria` : Tableau de critères, chacun avec :
  - `description` : Nom du critère (ex: "Clarté de l'expression")
  - `sortorder` : Ordre d'affichage
  - `levels` : Tableau de niveaux avec `score` et `definition` (descripteur)

**Options de la rubrique** (JSON dans le champ `options`) :
```json
{
  "sortlevelsasc": "1",
  "lockzeropoints": "1",
  "alwaysshowdefinition": "1",
  "showdescriptionteacher": "1",
  "showdescriptionstudent": "1",
  "showscoreteacher": "1",
  "showscorestudent": "1",
  "enableremarks": "1",
  "showremarksstudent": "1"
}
```

### Autres fichiers du backup
- `module.xml` : Version `2024100700`, `completion=2`, `groupmode=1`
- `grades.xml` : `grademax=100`, `gradetype=1` (valeur)
- `inforef.xml` : Référence au `grade_item`
- `roles.xml` : Vide (rôles par défaut)
- `gradebook.xml` : Catégorie + item de note du cours
- `moodle_backup.xml` : Manifest principal, format `topics`, Moodle 4.5.8

---

## Règle de progression

- **Ne jamais passer à l'étape suivante tant que la case précédente n'est pas cochée.**
- **Quand une étape est terminée, l'IA coche la case `[x]`, s'arrête et demande à l'utilisateur de tester.**
- L'utilisateur valide, puis l'IA continue.

---

## Story 1 — Enregistrement de l'activité dans le site

### Étape 1.1 — Ajouter la définition dans `definitions.js`

- [x] Ouvrir `js/core/definitions.js`
- [x] Ajouter l'entrée `Devoir` dans l'objet `moodleModules` :

```javascript
Devoir: {
    name: "elea_devoir_name",
    description: "elea_devoir_description",
    image: "assets/images/activities/devoirs.webp",
    promptId: "devoirResultat",
    jsonInputId: "devoirJsonInput",
    createBtnId: "createDevoirMBZ",
    categories: ["quiz","elea"],
    platforms: ["Éléa", "Magistère", "Moodle"],
    formats: ["MBZ", "DOCX", "ODT", "PDF"]
},
```

- [x] Ajouter `'Devoir'` dans le tableau `customOrder`, après `'Page'` (avant `'test_elea'`)
- [ ] Vérifier que le site charge sans erreur (la tuile apparaît dans la grille)

**Fichiers modifiés** : `js/core/definitions.js`
**Test** : Ouvrir le site → la tuile "Devoir" apparaît dans l'onglet "Tout" avec la bonne image

---

### Étape 1.2 — Ajouter les traductions UI de base dans `fr.js`

- [x] Ouvrir `js/locales/fr.json`
- [x] Ajouter les clés de nom et description dans la section des noms d'activités Éléa :

```javascript
// Devoir (Grille d'évaluation)
elea_devoir_name: "Devoir",
elea_devoir_description: "Créez un devoir Moodle avec une grille d'évaluation critériée générée par l'IA.",
```

- [x] Ajouter les clés de traduction pour les messages d'erreur et notifications :

```javascript
devoir_error_invalid_json: "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'criteria'.",
devoir_error_creation_mbz: "Erreur lors de la création du MBZ pour le devoir :",
devoir_activity_intro: "Consultez la grille d'évaluation ci-dessous pour connaître les critères de réussite.",
devoir_backup_log: "Sauvegarde créée automatiquement par Caramel",
```

- [x] Vérifier que le nom et la description apparaissent sur la tuile

**Fichiers modifiés** : `js/locales/fr.json`
**Test** : La tuile affiche "Devoir" avec la description correcte

---

### Étape 1.3 — Ajouter le texte français par défaut dans `translation.js`

> Le fichier `js/core/translation.js` contient un objet `defaultTranslations` chargé **avant** le fichier de langue complet. Il fournit les textes français des tuiles pour un affichage immédiat au chargement de la page. Sans cette entrée, la tuile affichera la clé brute `elea_devoir_name` pendant le chargement initial.

- [x] Ouvrir `js/core/translation.js`
- [x] Ajouter dans l'objet `defaultTranslations`, dans la section `// Noms des modules Moodle/Éléa` :

```javascript
elea_devoir_name: "Devoir",
```

- [ ] Vérifier que le site charge sans erreur et que la tuile affiche "Devoir" dès le chargement initial (avant le chargement complet de `fr.js`)

**Fichiers modifiés** : `js/core/translation.js`
**Test** : Ouvrir le site → la tuile "Devoir" affiche immédiatement le bon nom, sans flash de clé brute

---

## Story 2 — Créer le processeur Moodle

### Étape 2.1 — Créer le fichier `Devoir.js`

- [x] Créer `js/moodle/processors/activities/Devoir.js`
- [x] Le processeur doit :
  1. Recevoir les données avec les placeholders remplis + les données spécifiques de la grille
  2. Construire `assign.xml` avec la configuration du devoir
  3. Construire `grading.xml` avec la rubrique (critères + niveaux)
  4. Générer tous les fichiers annexes du backup (module.xml, grades.xml, inforef.xml, roles.xml)

**Structure du JSON simplifié attendu de l'IA** :

```json
{
  "title": "Évaluation de l'oral de français",
  "description": "Présentez votre analyse du texte étudié en classe. Vous serez évalué selon la grille ci-dessous.",
  "rubricName": "Grille d'évaluation de l'oral",
  "criteria": [
    {
      "description": "Clarté de l'expression",
      "levels": [
        { "score": 0, "definition": "L'élève s'exprime de façon confuse, incompréhensible ou ne répond pas." },
        { "score": 1, "definition": "L'élève s'exprime de façon partiellement claire, avec quelques hésitations gênantes." },
        { "score": 2, "definition": "L'élève s'exprime clairement, de façon audible et compréhensible." }
      ]
    },
    {
      "description": "Maîtrise du contenu",
      "levels": [
        { "score": 0, "definition": "L'élève ne montre pas de compréhension du sujet ou fait des erreurs importantes." },
        { "score": 1, "definition": "L'élève montre une compréhension partielle, avec quelques imprécisions." },
        { "score": 2, "definition": "L'élève maîtrise le contenu, répond avec justesse et précision." }
      ]
    },
    {
      "description": "Qualité de l'échange",
      "levels": [
        { "score": 0, "definition": "L'élève ne répond pas aux questions ou reste passif." },
        { "score": 1, "definition": "L'élève répond aux questions mais de façon courte ou hésitante." },
        { "score": 2, "definition": "L'élève échange avec aisance, reformule et argumente si nécessaire." }
      ]
    }
  ]
}
```

**Structure des fichiers XML à générer** :

#### `assign.xml` (template dans le processeur)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="assign" contextid="{{ACTIVITY_CONTEXTID}}">
  <assign id="{{ACTIVITY_ID}}">
    <name>{{ACTIVITY_TITLE}}</name>
    <intro>{{ACTIVITY_INTRO_HTML}}</intro>
    <introformat>1</introformat>
    <alwaysshowdescription>1</alwaysshowdescription>
    <submissiondrafts>0</submissiondrafts>
    <sendnotifications>0</sendnotifications>
    <sendlatenotifications>0</sendlatenotifications>
    <sendstudentnotifications>1</sendstudentnotifications>
    <duedate>0</duedate>
    <cutoffdate>0</cutoffdate>
    <gradingduedate>0</gradingduedate>
    <allowsubmissionsfromdate>0</allowsubmissionsfromdate>
    <grade>100</grade>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <completionsubmit>1</completionsubmit>
    <requiresubmissionstatement>0</requiresubmissionstatement>
    <teamsubmission>0</teamsubmission>
    <requireallteammemberssubmit>0</requireallteammemberssubmit>
    <teamsubmissiongroupingid>0</teamsubmissiongroupingid>
    <blindmarking>0</blindmarking>
    <hidegrader>0</hidegrader>
    <revealidentities>0</revealidentities>
    <attemptreopenmethod>untilpass</attemptreopenmethod>
    <maxattempts>1</maxattempts>
    <markingworkflow>0</markingworkflow>
    <markingallocation>0</markingallocation>
    <markinganonymous>0</markinganonymous>
    <preventsubmissionnotingroup>0</preventsubmissionnotingroup>
    <activity></activity>
    <activityformat>1</activityformat>
    <timelimit>0</timelimit>
    <submissionattachments>0</submissionattachments>
    <userflags></userflags>
    <submissions></submissions>
    <grades></grades>
    <plugin_configs>
      <!-- Soumission par fichier activée -->
      <plugin_config id="{{PLUGIN_CONFIG_ID_1}}">
        <plugin>onlinetext</plugin>
        <subtype>assignsubmission</subtype>
        <name>enabled</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_2}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_3}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>maxfilesubmissions</name>
        <value>20</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_4}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>maxsubmissionsizebytes</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_5}}">
        <plugin>file</plugin>
        <subtype>assignsubmission</subtype>
        <name>filetypeslist</name>
        <value></value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_6}}">
        <plugin>comments</plugin>
        <subtype>assignsubmission</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <!-- Feedback par commentaire et PDF activés -->
      <plugin_config id="{{PLUGIN_CONFIG_ID_7}}">
        <plugin>comments</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_8}}">
        <plugin>comments</plugin>
        <subtype>assignfeedback</subtype>
        <name>commentinline</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_9}}">
        <plugin>editpdf</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>1</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_10}}">
        <plugin>offline</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>0</value>
      </plugin_config>
      <plugin_config id="{{PLUGIN_CONFIG_ID_11}}">
        <plugin>file</plugin>
        <subtype>assignfeedback</subtype>
        <name>enabled</name>
        <value>0</value>
      </plugin_config>
    </plugin_configs>
    <overrides></overrides>
  </assign>
</activity>
```

#### `grading.xml` (construit dynamiquement)
Le processeur doit générer ce fichier à partir des critères du JSON :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<areas>
  <area id="{{GRADING_AREA_ID}}">
    <areaname>submissions</areaname>
    <activemethod>rubric</activemethod>
    <definitions>
      <definition id="{{RUBRIC_DEFINITION_ID}}">
        <method>rubric</method>
        <name>{{RUBRIC_NAME}}</name>
        <description>{{ACTIVITY_INTRO_HTML}}</description>
        <descriptionformat>1</descriptionformat>
        <status>20</status>
        <timecreated>{{TIMESTAMP}}</timecreated>
        <timemodified>{{TIMESTAMP}}</timemodified>
        <options>{"sortlevelsasc":"1","lockzeropoints":"1","alwaysshowdefinition":"1","showdescriptionteacher":"1","showdescriptionstudent":"1","showscoreteacher":"1","showscorestudent":"1","enableremarks":"1","showremarksstudent":"1"}</options>
        <plugin_gradingform_rubric_definition>
          <criteria>
            <!-- Généré dynamiquement pour chaque critère -->
            <criterion id="XXXX">
              <sortorder>N</sortorder>
              <description>Nom du critère</description>
              <descriptionformat>0</descriptionformat>
              <levels>
                <level id="YYYY">
                  <score>0.00000</score>
                  <definition>Descripteur niveau 0</definition>
                  <definitionformat>0</definitionformat>
                </level>
                <!-- ... autres niveaux ... -->
              </levels>
            </criterion>
          </criteria>
        </plugin_gradingform_rubric_definition>
        <instances></instances>
      </definition>
    </definitions>
  </area>
</areas>
```

**Algorithme de génération de la grille** :

```
Pour chaque critère (index i) :
  - criterion id = CRITERION_BASE_ID + i
  - sortorder = i + 1
  Pour chaque niveau du critère (index j) :
    - level id = LEVEL_BASE_ID + (i * MAX_LEVELS) + j
    - score = valeur fournie par l'IA (0, 1, 2, ...)
    - definition = descripteur textuel du niveau
```

- [x] Exporter : `metadata`, `buildFiles(data, options)`, `buildGradingXml(criteria)`
- [x] `metadata` :
```javascript
export const metadata = {
    moduleName: 'assign',
    moduleVersion: '2024100700',
    requiredPlaceholders: [
        'ACTIVITY_TITLE',
        'ACTIVITY_INTRO_HTML',
        'COURSE_FULLNAME',
        'COURSE_SHORTNAME',
        'COURSE_ID',
        'MODULE_ID',
        'SECTION_ID',
        'ACTIVITY_ID',
        'COURSE_CONTEXTID',
        'ACTIVITY_CONTEXTID',
        'TIMESTAMP',
        'BACKUP_DATE',
        'CATEGORY_ID',
        'COURSE_ITEM_ID',
        'GRADE_ITEM_ID'
    ]
};
```

- [ ] Tester en générant les fichiers manuellement et vérifier la structure XML (test utilisateur)

**Fichiers créés** : `js/moodle/processors/activities/Devoir.js`
**Test** : Appeler `buildFiles()` avec des données de test → les XML sont valides structurellement

---

### Étape 2.2 — Enregistrer le processeur dans `index.js`

- [x] Ouvrir `js/moodle/processors/index.js`
- [x] Ajouter l'import :

```javascript
import * as Devoir from './activities/Devoir.js';
```

- [x] Ajouter dans l'objet `processors` :

```javascript
'Devoir': Devoir,
```

- [ ] Vérifier que le site charge sans erreur

**Fichiers modifiés** : `js/moodle/processors/index.js`
**Test** : Pas d'erreur console au chargement

---

### Étape 2.3 — Ajouter la fonction `handleDevoirCreation` dans `moodle-creator.js`

- [x] Ouvrir `js/moodle/moodle-creator.js`
- [x] Créer la fonction `handleDevoirCreation(jsonInput)` en suivant le même pattern que `handleAppariementCreation` :
  1. Charger les libs Moodle (`loadMoodleLibs`)
  2. Parser et nettoyer le JSON (`cleanJsonInput`, `healStructureForActivity`)
  3. Valider la structure (vérifier `title`, `criteria[]` avec `levels[]`)
  4. Générer les IDs et timestamps
  5. Préparer l'intro HTML à partir de `description`
  6. Construire les données du placeholder + les données spécifiques (critères)
  7. Appeler `MoodleProcessors.getActivityFiles('Devoir', data)`
  8. Ajouter le `moodle_backup.log`
  9. Créer l'archive MBZ via `createMbz(files)`
  10. Télécharger le fichier `.mbz`
  11. Ajouter la notification de succès avec regeneration

- [x] Exporter la fonction depuis `moodle-creator.js`

**Fichiers modifiés** : `js/moodle/moodle-creator.js`
**Test** : La fonction est accessible depuis l'import

---

### Étape 2.4 — Brancher le bouton de création dans `ui.js`

- [x] Trouver dans `js/ui/ui.js` l'endroit où les boutons de création MBZ sont branchés (pattern : `createBtnId` → `handleXxxCreation`)
- [x] Ajouter le branchement pour `createDevoirMBZ` → `handleDevoirCreation`
- [ ] Vérifier que le clic sur le bouton déclenche bien la fonction

**Fichiers modifiés** : `js/ui/ui.js`
**Test** : Cliquer sur le bouton de création → `handleDevoirCreation` est appelé (vérifier via console en mode debug)

---

### Étape 2.5 — Tester la création d'un fichier .mbz

- [x] Saisir manuellement un JSON simplifié dans le champ JSON de l'activité Devoir
- [x] Cliquer sur le bouton de création MBZ
- [x] Vérifier que le fichier `.mbz` se télécharge
- [ ] Décompresser le fichier (c'est un TAR.GZ) et vérifier :
  - `activities/assign_XXXXX/assign.xml` contient le bon titre et la bonne description
  - `activities/assign_XXXXX/grading.xml` contient la rubrique avec les critères et niveaux
  - `activities/assign_XXXXX/module.xml` référence `assign` version `2024100700`
  - `activities/assign_XXXXX/grades.xml` contient le grade_item
  - `moodle_backup.xml` est un manifest valide
- [x] Importer le `.mbz` dans un site Moodle/Éléa et vérifier :
  - Le devoir s'affiche correctement
  - La grille d'évaluation est visible et contient les bons critères/niveaux
  - Les enseignants peuvent utiliser la grille pour évaluer

**Test** : Le fichier .mbz s'importe correctement et la grille d'évaluation est fonctionnelle

---

## Story 3 — Intégration IA (Prompts + Génération)

### Étape 3.1 — Créer le prompt template `assets/data/prompts/devoir.md`

- [x] Créer `assets/data/prompts/elea_devoir.md` en suivant la structure des autres prompts :

```markdown
# CONTEXTE PÉDAGOGIQUE
- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]

# RÈGLES SPÉCIFIQUES POUR [Devoir Moodle - Grille d'évaluation]
- Nombre de critères : Au minimum 3 critères || [NOMBRE_ELEMENTS] critères.
- Nombre de niveaux par critère : L'IA déduit le nombre optimal (2 à 4 niveaux).
  - 2 niveaux → Acquis / Non acquis
  - 3 niveaux → Non acquis / Partiellement acquis / Acquis (défaut)
  - 4 niveaux → Non acquis / Fragile / Satisfaisant / Très satisfaisant
- Scores : Les scores sont des entiers croissants à partir de 0 (0, 1, 2, ... ou 0, 1, 2, 3).
- Descripteurs : Chaque niveau doit avoir un descripteur précis, observable et évaluable.
- Critères : Les critères doivent être indépendants, mesurables et adaptés au sujet.

# RÈGLES PÉDAGOGIQUES
- Adaptation et vocabulaire : Adapte le ton, le vocabulaire et la difficulté au public indiqué.
- Ton et feedback : Les descripteurs doivent être factuels et constructifs.
- Conformité : Adapte aux programmes scolaires français (Eduscol) pour le public scolaire.
- Langue : Le contenu et les descripteurs doivent être rédigés en français.

# SOURCES
- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
[RAG]
---

# STRUCTURE DU JSON ATTENDUE
[Détaillée dans les clés de traduction]

# EXEMPLE DE RENDU
[JSON d'exemple dans les clés de traduction]
```

**Fichiers créés** : `assets/data/prompts/devoir.md`

---

### Étape 3.2 — Créer le JSON d'exemple `assets/data/examples/devoir_1.json`

- [x] Créer `assets/data/examples/devoir_1.json` avec un exemple pédagogique complet :

```json
{
  "title": "Évaluation de l'oral de français",
  "description": "Présentez votre analyse du texte étudié en classe. Vous serez évalué selon les critères de la grille ci-dessous.",
  "rubricName": "Grille d'évaluation de l'oral",
  "criteria": [
    {
      "description": "Clarté de l'expression",
      "levels": [
        { "score": 0, "definition": "L'élève s'exprime de façon confuse, incompréhensible ou ne répond pas." },
        { "score": 1, "definition": "L'élève s'exprime de façon partiellement claire, avec quelques hésitations gênantes." },
        { "score": 2, "definition": "L'élève s'exprime clairement, de façon audible et compréhensible." }
      ]
    },
    {
      "description": "Maîtrise du contenu",
      "levels": [
        { "score": 0, "definition": "L'élève ne montre pas de compréhension du sujet ou fait des erreurs importantes." },
        { "score": 1, "definition": "L'élève montre une compréhension partielle, avec quelques imprécisions ou erreurs mineures." },
        { "score": 2, "definition": "L'élève maîtrise le contenu, répond avec justesse et précision." }
      ]
    },
    {
      "description": "Qualité de l'échange",
      "levels": [
        { "score": 0, "definition": "L'élève ne répond pas aux questions ou reste passif." },
        { "score": 1, "definition": "L'élève répond aux questions mais de façon courte ou hésitante." },
        { "score": 2, "definition": "L'élève échange avec aisance, reformule et argumente si nécessaire." }
      ]
    }
  ]
}
```

**Fichiers créés** : `assets/data/examples/devoir_1.json`
**Test** : Le JSON est valide et peut être collé dans le champ JSON de l'activité

---

### Étape 3.3 — Ajouter les clés de traduction pour les prompts dans `fr.js`

- [x] Ouvrir `js/locales/fr.json`
- [x] Ajouter les 3 clés de prompt dans la section des prompts Éléa :

```javascript
// ============================================================================
// === ELEA_DEVOIR (Devoir - Grille d'évaluation) ===
// ============================================================================
ELEA_DEVOIR_REGLES_SPECIFIQUES: `- Nombre de critères d'évaluation : Au minimum 3 critères || [NOMBRE_ELEMENTS] critères.
- Nombre de niveaux par critère : L'IA déduit le nombre optimal de niveaux de réussite (2 à 4).
  - 2 niveaux → Acquis / Non acquis
  - 3 niveaux → Non acquis / Partiellement acquis / Acquis (défaut recommandé)
  - 4 niveaux → Non acquis / Fragile / Satisfaisant / Très satisfaisant
- Scores : Les scores sont des entiers croissants à partir de 0 (ex : 0, 1, 2).
- Descripteurs : Chaque niveau DOIT avoir un descripteur précis, observable et évaluable. Pas de formulation vague.
- Critères : Les critères doivent être indépendants les uns des autres, mesurables et directement liés au sujet.
- Tous les critères doivent avoir le MÊME nombre de niveaux.`,

ELEA_DEVOIR_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
Un objet principal avec les clés suivantes :
- \`title\` : Le titre du devoir (Chaîne de caractères).
- \`description\` : La consigne ou description de l'évaluation, visible par les élèves (Chaîne de caractères).
- \`rubricName\` : Le nom de la grille d'évaluation (Chaîne de caractères).
- \`criteria\` : Un tableau d'objets, où chaque objet représente un critère d'évaluation et contient :
  - \`description\` : Le nom du critère (Chaîne de caractères, ex : "Clarté de l'expression").
  - \`levels\` : Un tableau d'objets ordonnés par score croissant, où chaque objet contient :
    - \`score\` : Le nombre de points pour ce niveau (Entier, commençant à 0).
    - \`definition\` : Le descripteur précis de ce niveau de réussite (Chaîne de caractères).`,

ELEA_DEVOIR_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Évaluation de l'oral de français",
  "description": "Présentez votre analyse du texte étudié en classe.",
  "rubricName": "Grille d'évaluation de l'oral",
  "criteria": [
    {
      "description": "Clarté de l'expression",
      "levels": [
        { "score": 0, "definition": "L'élève s'exprime de façon confuse ou incompréhensible." },
        { "score": 1, "definition": "L'élève s'exprime de façon partiellement claire." },
        { "score": 2, "definition": "L'élève s'exprime clairement et de façon audible." }
      ]
    },
    {
      "description": "Maîtrise du contenu",
      "levels": [
        { "score": 0, "definition": "L'élève ne montre pas de compréhension du sujet." },
        { "score": 1, "definition": "L'élève montre une compréhension partielle." },
        { "score": 2, "definition": "L'élève maîtrise le contenu avec justesse." }
      ]
    },
    {
      "description": "Qualité de l'échange",
      "levels": [
        { "score": 0, "definition": "L'élève ne répond pas ou reste passif." },
        { "score": 1, "definition": "L'élève répond de façon courte ou hésitante." },
        { "score": 2, "definition": "L'élève échange avec aisance et argumente." }
      ]
    }
  ]
}
\`\`\``,
```

**Fichiers modifiés** : `js/locales/fr.json`
**Test** : Pas d'erreur de syntaxe dans le fichier de traduction

---

### Étape 3.4 — Enregistrer dans `prompt-generator.js`

- [x] Ouvrir `js/services/prompt-generator.js`
- [x] Ajouter l'entrée dans `ACTIVITY_CONFIG` :

```javascript
eleaDevoir: { prefix: 'ELEA_DEVOIR', resultKey: 'devoirResultat' },
```

- [ ] Vérifier que le prompt se génère correctement (test utilisateur)

**Fichiers modifiés** : `js/services/prompt-generator.js`
**Test** : Cliquer sur la tuile Devoir → le prompt IA s'affiche avec les bonnes sections (règles spécifiques, structure JSON, exemple)

---

### Étape 3.5 — Tester la génération IA complète

- [x] Sélectionner l'activité "Devoir"
- [x] Remplir les champs (qui, quoi, niveau, nombre de critères)
- [x] Générer le prompt
- [x] Envoyer à l'IA (via le bouton "Générer")
- [x] Vérifier que le JSON retourné est conforme à la structure attendue (title, description, rubricName, criteria[])
- [x] Créer le fichier MBZ à partir du JSON généré
- [ ] Importer dans Moodle/Éléa et vérifier que la grille d'évaluation est fonctionnelle

**Test** : Le workflow complet fonctionne : prompt → IA → JSON → MBZ → devoir avec grille d'évaluation fonctionnelle

---

## Story 4 — Simulateur visuel de la grille d'évaluation

> Le simulateur permet à l'utilisateur de **prévisualiser** le rendu de la grille d'évaluation directement dans la modale de résultat, sans importer dans Moodle. C'est essentiel pour valider visuellement le contenu avant téléchargement.
>
> **Référence visuelle** : Voir le fichier `visuel-devoir.png` à la racine du projet pour le mockup du rendu attendu.

### Étape 4.1 — Créer la fonction `renderDevoir` dans `simulators.js`

- [x] Ouvrir `js/simulators.js`
- [x] Créer la fonction `renderDevoir(container, data)` qui affiche la grille sous forme de tableau HTML :

**Rendu visuel cible** (conforme au mockup `visuel-devoir.png`) :

```
┌──────────────────────────────────────────────────────────────────┐
│  Nom de la grille pour un objectif défini                        │
│  (titre gras, bleu foncé, grande taille)                         │
│                                                                  │
│  Ici se trouve la description de l'évaluation thématique         │
│  (description en italique, gris)                                 │
│                                                                  │
│  ┌─────────────┬──────────────┬──────────────┬──────────────┐   │
│  │ Clarté de   │ S'exprime de │ S'exprime    │ S'exprime    │   │
│  │ l'expression│ façon confuse│ partiellement│ clairement   │   │
│  │ (gras,      │              │              │              │   │
│  │  bleu)      │ 0 points     │ 1 points     │ 2 points     │   │
│  ├─────────────┼──────────────┼──────────────┼──────────────┤   │
│  │ Maîtrise du │ Ne montre pas│ Compréhension│ Maîtrise le  │   │
│  │ contenu     │ de compréh.  │ partielle    │ contenu      │   │
│  │ (gras,      │              │              │              │   │
│  │  bleu)      │ 0 points     │ 1 points     │ 2 points     │   │
│  ├─────────────┼──────────────┼──────────────┼──────────────┤   │
│  │ Qualité de  │ Ne répond pas│ Répond de    │ Échange avec │   │
│  │ l'échange   │ ou passif    │ façon courte │ aisance      │   │
│  │ (gras,      │              │              │              │   │
│  │  bleu)      │ 0 points     │ 1 points     │ 2 points     │   │
│  └─────────────┴──────────────┴──────────────┴──────────────┘   │
│                                                                  │
│  Note maximale : 6 points (3 critères × 2 pts max)              │
└──────────────────────────────────────────────────────────────────┘
```

**Points clés du rendu** (d'après le mockup) :
- **Pas d'en-tête de colonnes** pour les niveaux — les scores sont intégrés en bas de chaque cellule de descripteur
- **Critères en gras** dans la première colonne, avec une couleur distincte (bleu foncé)
- **Scores en bas de chaque cellule** — affichés en couleur distincte sous le descripteur
- **Titre de la grille** (`rubricName`) en haut, gros, gras, bleu foncé
- **Description** sous le titre, en italique gris
- **Bordures légères** autour des cellules, fond blanc
- **Pas d'icônes/emojis** dans le rendu tableau (rendu sobre comme dans Moodle)

La fonction doit :
  - Afficher le titre du devoir en en-tête
  - Afficher la consigne (`description`)
  - Afficher le nom de la grille (`rubricName`)
  - Construire un `<table>` HTML avec :
    - **Colonnes** : une colonne "Critère" + une colonne par niveau de réussite (en-tête = score en pts)
    - **Lignes** : une ligne par critère, chaque cellule contient le descripteur du niveau
  - Afficher la note maximale calculée (somme des scores max de chaque critère)
  - Styliser le tableau avec des classes CSS cohérentes avec les autres simulateurs
  - Supporter le bouton plein écran (via `createFullscreenButton()`)

- [x] Exporter la fonction depuis `simulators.js`

**Fichiers modifiés** : `js/simulators.js`
**Test** : Appeler `renderDevoir(container, jsonData)` → la grille s'affiche en tableau lisible

---

### Étape 4.2 — Ajouter les styles CSS du simulateur

- [x] Créer ou enrichir les styles dans le CSS existant des simulateurs (probablement `css/components/` ou directement dans les styles simulateurs)
- [ ] Styles nécessaires :
  - `.simulator-devoir` : Container principal
  - `.simulator-devoir__header` : Titre + consigne
  - `.simulator-devoir__rubric-name` : Nom de la grille
  - `.simulator-devoir__table` : Tableau de la grille
  - `.simulator-devoir__th-criterion` : En-tête colonne critère
  - `.simulator-devoir__th-level` : En-tête colonne niveau (avec score)
  - `.simulator-devoir__td-criterion` : Cellule nom du critère (gras, couleur distincte)
  - `.simulator-devoir__td-level` : Cellule descripteur
  - `.simulator-devoir__total` : Ligne note maximale
  - Responsive : le tableau doit scroller horizontalement si trop de colonnes sur petit écran

**Fichiers modifiés** : CSS des simulateurs
**Test** : Le tableau est lisible, les colonnes sont bien alignées, le rendu est cohérent avec les autres simulateurs

---

### Étape 4.3 — Brancher le simulateur dans `notifications.js`

- [x] Ouvrir `js/ui/notifications.js`
- [x] Dans la fonction `renderPreview`, ajouter le cas pour `elea_devoir_name` (même pattern que les autres activités MBZ) :

```javascript
} else if (notification.titleKey === 'elea_devoir_name') {
    // Rendu du simulateur Devoir (grille d'évaluation)
    console.log("renderPreview: Rendering Devoir");
    simulators.renderDevoir(previewContainer, notification.jsonData);
}
```

- [x] S'assurer que `notification.jsonData` est bien transmis lors de la création du MBZ dans `handleDevoirCreation`

**Fichiers modifiés** : `js/ui/notifications.js`
**Test** : Après génération, cliquer sur la notification → la grille d'évaluation s'affiche en preview dans la modale

---

### Étape 4.4 — Ajouter les clés de traduction du simulateur

- [x] Ajouter dans `js/locales/fr.json` les clés pour le simulateur :

```javascript
// Simulateur Devoir
simulator_devoir_criterion: "Critère",
simulator_devoir_total: "Note maximale",
simulator_devoir_points: "pts",
simulator_devoir_point: "pt",
```

**Fichiers modifiés** : `js/locales/fr.json`
**Test** : Les labels du simulateur sont bien traduits

---

## Story 5 — Éditeur JSON spécialisé (grille d'évaluation)

> L'éditeur permet de **modifier** la grille d'évaluation générée par l'IA avant téléchargement. Il doit offrir une expérience adaptée à la nature tabulaire des données : ajouter/supprimer des critères (lignes), ajouter/supprimer des niveaux (colonnes), éditer les descripteurs en place.

### Étape 5.1 — Ajouter la signature de détection dans `content-detector.js`

- [x] Ouvrir `js/editor/content-detector.js`
- [x] Ajouter la signature de détection dans `contentSignatures` :

```javascript
'elea_devoir': (data) =>
    Array.isArray(data.criteria) &&
    data.criteria.length > 0 &&
    data.criteria[0].hasOwnProperty('description') &&
    Array.isArray(data.criteria[0].levels),
```

- [x] Ajouter le mapping dans `titleKeyToModuleKey` :

```javascript
'elea_devoir_name': 'elea_devoir',
'elea_devoir': 'elea_devoir',
```

**Fichiers modifiés** : `js/editor/content-detector.js`
**Test** : Le contenu JSON d'un Devoir est correctement détecté comme `elea_devoir`

---

### Étape 5.2 — Créer le schéma d'éditeur dans `content-detector.js`

- [x] Ajouter le schéma dans l'objet `contentSchemas` :

```javascript
// === MOODLE DEVOIR (Grille d'évaluation) ===
'elea_devoir': {
    sections: [
        {
            id: 'general',
            label: 'editor_section_general',
            icon: 'fa-info-circle',
            fields: {
                title: { type: 'text', label: 'editor_title', required: true },
                description: { type: 'textarea', label: 'editor_devoir_description' },
                rubricName: { type: 'text', label: 'editor_devoir_rubric_name' }
            }
        },
        {
            id: 'rubric',
            label: 'editor_section_rubric',
            icon: 'fa-th',
            countField: 'criteria',
            fields: {
                criteria: {
                    type: 'array',
                    itemLabel: 'editor_devoir_criterion',
                    addLabel: 'editor_devoir_add_criterion',
                    minItems: 1,
                    itemsExpanded: true,
                    itemSchema: {
                        description: {
                            type: 'text',
                            label: 'editor_devoir_criterion_name',
                            required: true
                        },
                        levels: {
                            type: 'array',
                            itemLabel: 'editor_devoir_level',
                            addLabel: 'editor_devoir_add_level',
                            minItems: 2,
                            nested: true,
                            itemsExpanded: false,
                            itemSchema: {
                                score: {
                                    type: 'number',
                                    label: 'editor_devoir_score',
                                    required: true,
                                    min: 0,
                                    inline: true
                                },
                                definition: {
                                    type: 'textarea',
                                    label: 'editor_devoir_level_definition',
                                    required: true
                                }
                            }
                        }
                    }
                }
            }
        }
    ]
},
```

Le schéma utilise le système d'éditeur existant (arrays imbriqués) ce qui permet :
- **Ajouter/supprimer des critères** (lignes) via le bouton "+" du tableau `criteria`
- **Ajouter/supprimer des niveaux** (colonnes) via le bouton "+" du sous-tableau `levels`
- **Réordonner** les critères par glisser-déposer (si supporté par l'array manager)
- **Éditer en place** chaque descripteur dans un textarea

**Fichiers modifiés** : `js/editor/content-detector.js`
**Test** : L'éditeur s'ouvre et affiche les critères avec leurs niveaux éditables

---

### Étape 5.3 — Ajouter les clés de traduction de l'éditeur dans `fr.js`

- [x] Ouvrir `js/locales/fr.json`
- [x] Ajouter les clés pour l'éditeur du Devoir :

```javascript
// Éditeur Devoir
editor_devoir_description: "Consigne de l'évaluation",
editor_devoir_rubric_name: "Nom de la grille d'évaluation",
editor_section_rubric: "Grille d'évaluation",
editor_devoir_criterion: "Critère",
editor_devoir_add_criterion: "Ajouter un critère",
editor_devoir_criterion_name: "Nom du critère",
editor_devoir_level: "Niveau",
editor_devoir_add_level: "Ajouter un niveau",
editor_devoir_score: "Points",
editor_devoir_level_definition: "Descripteur du niveau",
```

**Fichiers modifiés** : `js/locales/fr.json`
**Test** : Tous les labels de l'éditeur sont affichés en français

---

### Étape 5.4 — Tester l'éditeur complet

- [ ] Générer un Devoir via l'IA
- [ ] Cliquer sur "Modifier" dans la notification de résultat
- [ ] Vérifier que l'éditeur s'ouvre avec les bonnes données :
  - Section "Général" : titre, consigne, nom de la grille
  - Section "Grille d'évaluation" : tous les critères avec leurs niveaux
- [ ] Modifier un descripteur → vérifier que le changement est pris en compte
- [ ] Ajouter un critère → vérifier qu'il apparaît avec des niveaux vides
- [ ] Ajouter un niveau à un critère → vérifier qu'il apparaît avec score et définition vides
- [ ] Supprimer un critère → vérifier qu'il disparaît
- [ ] Supprimer un niveau → vérifier qu'il disparaît (min 2 niveaux)
- [ ] Sauvegarder → vérifier que le MBZ est régénéré avec les modifications
- [ ] Annuler → vérifier que les données originales sont restaurées

**Test** : L'éditeur permet de modifier la grille et la sauvegarde régénère le MBZ correct

---

### Étape 5.5 — (Optionnel) Rendu tabulaire avancé dans l'éditeur

> Cette étape est optionnelle et peut être réalisée en amélioration ultérieure. L'étape 5.2 utilise le système d'arrays imbriqués standard qui fonctionne mais n'offre pas un rendu tabulaire "grille". Cette étape ajouterait un renderer spécialisé.

- [ ] Créer un type de champ `rubricGrid` dans `field-renderers.js` qui :
  - Affiche la grille sous forme de **vrai tableau HTML éditable** (comme un spreadsheet)
  - Colonnes : "Critère" + une colonne par niveau (score en en-tête)
  - Lignes : un critère par ligne, avec textareas dans chaque cellule
  - Boutons "+" pour ajouter une colonne (niveau) ou une ligne (critère)
  - Boutons "×" pour supprimer une colonne ou une ligne
  - Le score des colonnes est éditable dans l'en-tête
  - Copier-coller facilité entre cellules
  - Responsive (scroll horizontal si besoin)
- [ ] Si implémenté, remplacer le schéma de l'étape 5.2 par un champ unique :

```javascript
criteria: {
    type: 'rubricGrid',
    label: 'editor_section_rubric'
}
```

**Fichiers modifiés** : `js/editor/field-renderers.js`, `js/editor/content-detector.js`
**Test** : La grille s'affiche en tableau avec ajout/suppression de lignes et colonnes

---

## Story 6 — Export document (DOCX, ODT, PDF)

### Étape 6.1 — Ajouter le formateur dans `document-formatter.js`

- [ ] Ouvrir `js/export/document-formatter.js`
- [ ] Ajouter `'Devoir': formatDevoir` dans le mapping des formateurs
- [ ] Créer la fonction `formatDevoir(data)` qui :
  - Affiche le titre du devoir et la consigne
  - Affiche le nom de la grille d'évaluation
  - Pour chaque critère : affiche le nom du critère et un tableau avec les niveaux (score + descripteur)
  - Format tableau : colonnes = niveaux de réussite, lignes = critères

- [ ] Ajouter les clés de traduction nécessaires dans `fr.js` :

```javascript
doc_fmt_devoir_title: "Devoir",
doc_fmt_devoir_rubric: "Grille d'évaluation",
doc_fmt_devoir_criterion: "Critère",
doc_fmt_devoir_level: "Niveau",
doc_fmt_devoir_score: "Points",
doc_fmt_devoir_description: "Consigne",
```

**Fichiers modifiés** : `js/export/document-formatter.js`, `js/locales/fr.json`
**Test** : Exporter en DOCX → le document contient la grille d'évaluation sous forme de tableau lisible

---

## Story 7 — Traductions internationales

### Étape 7.1 — Ajouter les traductions minimales dans les 10 autres langues

- [x] Pour chaque fichier de traduction (`en.js`, `es.js`, `de.js`, `it.js`, `nl.js`, `pt.js`, `ar.js`, `zh.js`, `jp.js`, `el.js`), ajouter :
  - `elea_devoir_name` : Nom de l'activité traduit
  - `elea_devoir_description` : Description traduite

| Langue | `elea_devoir_name` | `elea_devoir_description` |
|--------|-------------------|--------------------------|
| en | Assignment | Create a Moodle assignment with an AI-generated rubric. |
| es | Tarea | Crea una tarea de Moodle con una rúbrica de evaluación generada por IA. |
| de | Aufgabe | Erstellen Sie eine Moodle-Aufgabe mit einem KI-generierten Bewertungsraster. |
| it | Compito | Crea un compito Moodle con una griglia di valutazione generata dall'IA. |
| nl | Opdracht | Maak een Moodle-opdracht met een door AI gegenereerd beoordelingsraster. |
| pt | Tarefa | Crie uma tarefa Moodle com uma grelha de avaliação gerada por IA. |
| ar | واجب | أنشئ واجبًا في Moodle مع معايير تقييم مولّدة بالذكاء الاصطناعي. |
| zh | 作业 | 创建一个带有AI生成的评分量规的Moodle作业。 |
| jp | 課題 | AIで生成されたルーブリックを持つMoodle課題を作成します。 |
| el | Εργασία | Δημιουργήστε μια εργασία Moodle με ρουμπρίκα αξιολόγησης που δημιουργείται από AI. |

Note : Les clés de prompt (`ELEA_DEVOIR_REGLES_SPECIFIQUES`, etc.) ne sont nécessaires que dans `fr.js` pour le moment.

**Fichiers modifiés** : 10 fichiers de traduction
**Test** : Changer la langue du site → le nom de l'activité est traduit

---

## Story 8 — Finitions et tests

### Étape 8.1 — Valider les cas limites de la grille d'évaluation

- [x] Tester avec 2 critères et 2 niveaux (cas minimal : Acquis / Non acquis)
- [x] Tester avec 3 critères et 3 niveaux (cas standard)
- [x] Tester avec 5 critères et 4 niveaux (cas riche)
- [x] Tester avec 8 critères et 3 niveaux (cas extrême, beaucoup de critères)
- [x] Vérifier que la grille d'évaluation est exploitable dans Moodle/Éléa pour chaque cas
- [x] Vérifier que la note maximale est bien calculée (somme des scores max de chaque critère)

**Test** : Tous les cas de figure produisent une grille d'évaluation valide et exploitable

---

### Étape 8.2 — Ajouter le support dans `json-healer.js` (si nécessaire)

- [ ] Vérifier si `healStructureForActivity` a besoin d'un cas `'Devoir'`
- [ ] Si les retours IA montrent des erreurs récurrentes (champs manquants, structure incorrecte), ajouter des règles de healing spécifiques :
  - Vérifier que `criteria` est bien un tableau
  - Vérifier que chaque critère a `description` et `levels`
  - Vérifier que chaque level a `score` et `definition`
  - Ajouter `rubricName` par défaut si absent

**Fichiers modifiés** : `js/h5p/json-healer.js` (si nécessaire)
**Test** : Un JSON incomplet ou mal formé est correctement réparé

---

### Étape 8.3 — Vérifier l'icône

- [x] Confirmer que `assets/images/activities/devoirs.webp` est bien affichée sur la tuile
- [x] Vérifier les dimensions et le rendu visuel (cohérent avec les autres tuiles)

**Fichiers** : `assets/images/activities/devoirs.webp` (déjà présent)
**Test** : L'icône s'affiche correctement sur la tuile

---

## Récapitulatif des fichiers

| Fichier | Action | Story |
|---------|--------|-------|
| `js/core/definitions.js` | Modifier | 1 |
| `js/core/translation.js` | Modifier | 1 |
| `js/locales/fr.json` | Modifier | 1, 3, 4, 5, 6 |
| `js/moodle/processors/activities/Devoir.js` | **Créer** | 2 |
| `js/moodle/processors/index.js` | Modifier | 2 |
| `js/moodle/moodle-creator.js` | Modifier | 2 |
| `js/ui/ui.js` | Modifier | 2 |
| `assets/data/prompts/devoir.md` | **Créer** | 3 |
| `assets/data/examples/devoir_1.json` | **Créer** | 3 |
| `js/services/prompt-generator.js` | Modifier | 3 |
| `js/simulators.js` | Modifier | 4 |
| `css/components/` (styles simulateur) | Modifier | 4 |
| `js/ui/notifications.js` | Modifier | 4 |
| `js/editor/content-detector.js` | Modifier | 5 |
| `js/editor/field-renderers.js` | Modifier (optionnel) | 5 |
| `js/export/document-formatter.js` | Modifier | 6 |
| `js/locales/en.json` à `el.json` | Modifier | 7 |
| `js/h5p/json-healer.js` | Modifier (si besoin) | 8 |

---

## Notes techniques importantes

1. **Module Moodle natif** : Contrairement aux activités Éléa (simplequiz, epikmatch, millionnairev2) qui sont des plugins spécifiques, `assign` est un module **natif** de Moodle. Cela signifie qu'il est importable sur TOUTE instance Moodle sans plugin supplémentaire.

2. **`grading.xml` est la clé** : C'est le fichier spécifique à cette activité. Il contient la rubrique d'évaluation complète. Les autres fichiers (`assign.xml`, `module.xml`, `grades.xml`) suivent les patterns classiques des processeurs Moodle existants.

3. **IDs uniques** : Les `criterion id` et `level id` dans `grading.xml` doivent être des entiers uniques. Le processeur doit les générer aléatoirement dans des plages suffisamment larges pour éviter les collisions.

4. **Options de la rubrique** : Le champ `options` dans `grading.xml` est un JSON sérialisé en string. Les options par défaut activent la visibilité de la grille pour enseignants et élèves, les remarques, et les scores.

5. **Format du backup** : Le modèle de référence utilise le format `activity` (pas `course`). On utilisera `buildMoodleBackup` (pas `buildCourseBackup`) depuis `moodle-backup.js`, comme pour QCM et Appariement.

6. **Note maximale** : Moodle calcule automatiquement le barème à partir de la somme des scores max de chaque critère. Le champ `<grade>100</grade>` dans `assign.xml` est le maximum configurable, mais la rubrique ramène la note proportionnellement.

7. **plugin_config IDs** : Les IDs des `plugin_config` doivent être des entiers uniques. Le processeur génère une séquence à partir d'un ID de base aléatoire.

8. **Nombre d'éléments** : Dans le prompt, le `[NOMBRE_ELEMENTS]` correspond au nombre de **critères d'évaluation** (pas le nombre de niveaux). Le nombre de niveaux est déterminé par l'IA selon la complexité demandée, mais l'utilisateur pourrait le spécifier via les règles spécifiques.

---

## Spécificités par rapport aux autres activités Moodle

| Aspect | QCM / Appariement | Devoir |
|--------|-------------------|--------|
| Module Moodle | `simplequiz` / `epikmatch` (plugins) | `assign` (natif) |
| Fichier principal | `simplequiz.xml` / `epikmatch.xml` | `assign.xml` + `grading.xml` |
| Compatibilité | Éléa uniquement | Éléa, Magistère, tout Moodle |
| Contenu IA | Questions/Réponses | Critères + Descripteurs de niveaux |
| Évaluation | Automatique | Manuelle (grille critériée) |
| Fichier spécifique | Aucun | `grading.xml` (rubrique) |
