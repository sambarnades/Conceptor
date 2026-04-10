# PRD — Activité « Livre » (Moodle / Éléa)

> **Version** : 1.2.0 — **Date** : 2026-04-07
> **Changelog** :
> - **1.2.0** : Ajout de la Phase 16 (qualité pédagogique du prompt IA) et du **Piège 8** (bug transversal : les prompts ne se rafraîchissent pas au changement de langue). Documentation des règles d'écriture d'un prompt IA : langage accessible aux enseignants, séparation stricte règles métier / structure technique, exemples concrets de plans, formules mathématiques LaTeX bien formatées.
> - **1.1.0** : Ajout de la Phase 14 (preview & simulateur) et de la Phase 15 (intégration tests). Documentation des pièges découverts pendant l'implémentation : mauvais type de champ `boolean` (à remplacer par `checkbox`), routage de preview par `titleKey` dans `renderPreview`, fonction `renderLivre` à ajouter dans `simulators.js`, indentation visuelle des sous-chapitres dans l'éditeur via compteurs CSS, mise à jour des fixtures de tests.
> - **1.0.0** : Version initiale.
>
> **Objectif** : Document de référence **exécutable** pour intégrer dans Caramel l'activité **Livre** (module Moodle `book`), conçue comme une activité **Page multi-chapitres**. Chaque chapitre du livre = une mini-Page composée des mêmes 18 blocs de mise en forme, avec un thème global cohérent.
>
> **À qui ce PRD s'adresse** : à un développeur (ou à Claude) qui doit produire l'intégration de zéro. Chaque phase est prescriptive et chaque case à cocher est vérifiable.
>
> **Prérequis de lecture** : connaissance du PRD générique H5P pour la philosophie globale ; ce PRD-ci est **autonome** pour Livre.

---

## Table des matières

1. [Vue d'ensemble du pipeline Livre](#1-vue-densemble-du-pipeline-livre)
2. [Anatomie d'un Livre Moodle](#2-anatomie-dun-livre-moodle)
3. [Décisions d'architecture](#3-décisions-darchitecture)
4. [Phase 1 — Définition de l'activité](#4-phase-1--définition-de-lactivité)
5. [Phase 2 — Processeur Moodle `Livre.js`](#5-phase-2--processeur-moodle-livrejs)
6. [Phase 3 — Pipeline de génération (`moodle-creator.js`)](#6-phase-3--pipeline-de-génération-moodle-creatorjs)
7. [Phase 4 — Healer (réparation JSON)](#7-phase-4--healer-réparation-json)
8. [Phase 5 — Prompt IA et exemples](#8-phase-5--prompt-ia-et-exemples)
9. [Phase 6 — Override modèle IA](#9-phase-6--override-modèle-ia)
10. [Phase 7 — Field-constraints](#10-phase-7--field-constraints)
11. [Phase 8 — Éditeur visuel JSON](#11-phase-8--éditeur-visuel-json)
12. [Phase 9 — Aide à 3 niveaux (sidebar / tutoriel / éditeur)](#12-phase-9--aide-à-3-niveaux-sidebar--tutoriel--éditeur)
13. [Phase 10 — Export DOCX / ODT / PDF](#13-phase-10--export-docx--odt--pdf)
14. [Phase 11 — Traductions (11 langues)](#14-phase-11--traductions-11-langues)
15. [Phase 12 — Asset visuel (icône)](#15-phase-12--asset-visuel-icône)
16. [Phase 13 — Tests et validation](#16-phase-13--tests-et-validation)
17. [Phase 14 — Preview dans la modale (simulateur fidèle)](#17-phase-14--preview-dans-la-modale-simulateur-fidèle)
18. [Phase 15 — Intégration aux fixtures de tests](#18-phase-15--intégration-aux-fixtures-de-tests)
19. [**Pièges et apprentissages**](#pièges-et-apprentissages-issus-de-limplémentation)
20. [Checklist de validation finale](#17-checklist-de-validation-finale)
18. [Annexe A — Référence XML `book.xml`](#annexe-a--référence-xml-bookxml)
19. [Annexe B — Récapitulatif des fichiers modifiés](#annexe-b--récapitulatif-des-fichiers-modifiés)
20. [Annexe C — Réutilisations directes depuis Page](#annexe-c--réutilisations-directes-depuis-page)

---

## 1. Vue d'ensemble du pipeline Livre

```
┌──────────────────────────────────────────────────────────────────┐
│  definitions.js (registre)                                        │
│       ↓                                                            │
│  prompt-generator.js → llm.js (gpt-oss-120b)                      │
│       ↓                                                            │
│  json-healer.js (defaults numbering/navstyle, séquence chapitres) │
│       ↓                                                            │
│  moodle-creator.js → handleLivreCreation()                        │
│       ├── Pour CHAQUE chapitre :                                  │
│       │     generateHtmlFromBlocks({title, blocks, theme})         │
│       │     → HTML composé via thème Page                          │
│       ├── escapeXml(htmlChapitre) × N                              │
│       └── MoodleProcessors.getActivityFiles('Livre', data)        │
│             ↓                                                       │
│         Livre.js processor                                         │
│             ↓                                                       │
│         book.xml + module.xml + arborescence Moodle complète      │
│             ↓                                                       │
│         createMbz(files) → .mbz téléchargé                        │
└──────────────────────────────────────────────────────────────────┘
```

**Principe directeur** : `generateHtmlFromBlocks()` (déjà existant pour Page) est **invoqué N fois** (une par chapitre). Chaque chapitre est traité comme une mini-Page indépendante, mais tous partagent le **même thème global** choisi par l'utilisateur — garantissant la cohérence visuelle.

---

## 2. Anatomie d'un Livre Moodle

### 2.1. Structure XML cible (`book.xml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="book" contextid="{{ACTIVITY_CONTEXTID}}">
  <book id="{{ACTIVITY_ID}}">
    <name>{{TITLE}}</name>
    <intro>{{INTRO_HTML}}</intro>
    <introformat>1</introformat>
    <numbering>1</numbering>          <!-- 0=aucun, 1=numérique, 2=puces, 3=tirets -->
    <navstyle>1</navstyle>             <!-- 0=TOC seul, 1=images, 2=texte -->
    <customtitles>0</customtitles>     <!-- 0=titres standards, 1=titres personnalisés -->
    <timecreated>{{TIMESTAMP}}</timecreated>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <chapters>
      <chapter id="{{CHAPTER_ID_1}}">
        <pagenum>1</pagenum>
        <subchapter>0</subchapter>     <!-- 0=chapitre, 1=sous-chapitre -->
        <title>Titre chapitre 1</title>
        <content>HTML composé par generateHtmlFromBlocks</content>
        <contentformat>1</contentformat>
        <hidden>0</hidden>
        <timemodified>{{TIMESTAMP}}</timemodified>
        <importsrc></importsrc>
      </chapter>
      <!-- ... autres chapitres ... -->
    </chapters>
    <chaptertags>
    </chaptertags>
  </book>
</activity>
```

### 2.2. Contraintes Moodle à respecter

| Contrainte | Règle | Conséquence |
|---|---|---|
| **Premier chapitre** | Doit avoir `subchapter=0` (chapitre normal, pas sous-chapitre) | Le healer doit forcer `chapters[0].subchapter = false` |
| **Sous-chapitre orphelin** | Un `subchapter=1` doit obligatoirement être précédé d'un chapitre normal | Le healer doit valider/corriger la séquence |
| **Numérotation `pagenum`** | Séquentielle 1, 2, 3… injectée par Caramel (jamais par l'IA) | Le processeur calcule les `pagenum` au moment du build |
| **`module.xml`** | `modulename=book`, `version=2024100700` | Identique à Page, à hardcoder dans le processeur |
| **Fichiers obligatoires** | `book.xml`, `module.xml`, `grades.xml` (vide), `inforef.xml` (vide), `roles.xml` (vide) | Templates similaires à Page, sauf renommage `book_*` |
| **Reste de l'arborescence** | Tous les fichiers racine + `course/` + `sections/` + `course/blocks/` sont **strictement identiques** à Page | Réutilisation directe des templates `TEMPLATES.*` |

### 2.3. Différences vs Page

| Aspect | Page | Livre |
|---|---|---|
| Module Moodle | `page` | `book` |
| Fichier d'activité | `activities/page_XXX/page.xml` | `activities/book_XXX/book.xml` |
| Structure de contenu | `<content>HTML</content>` plat | `<chapters><chapter>…</chapter>×N</chapters>` |
| Réglages d'affichage | `display`, `displayoptions` | `numbering`, `navstyle`, `customtitles` |
| Mécanisme de rendu blocs | 1 appel `generateHtmlFromBlocks` | N appels (1 par chapitre) |
| Tout le reste de l'arborescence MBZ | — | **Identique** |

---

## 3. Décisions d'architecture

Décisions validées avec l'utilisateur en amont du PRD. **Toute déviation doit être explicitement justifiée et documentée.**

| # | Décision | Justification |
|---|---|---|
| 1 | **Réutilisation des 18 blocs Page** | Cohérence UX, zéro duplication de code, montée en charge progressive du formateur |
| 2 | **Un seul thème global pour tout le livre** | Cohérence visuelle entre chapitres, simplicité prompt IA, simplicité éditeur |
| 3 | **`numbering`/`navstyle`/`customtitles` injectés par Caramel** | L'IA n'a aucun contexte pour choisir ces réglages purement présentationnels |
| 4 | **3 réglages d'affichage exposés dans l'éditeur** | L'utilisateur peut les modifier post-génération via select/toggle |
| 5 | **Modèle IA : `gpt-oss-120b`** | Cohérent avec Page, nécessaire pour la complexité multi-chapitres |
| 6 | **4 à 6 chapitres par défaut** | Volume pédagogiquement raisonnable, contrôlé via le prompt |
| 7 | **Sous-chapitres optionnels** | L'IA décide si la matière s'y prête |
| 8 | **L'IA génère une intro courte (1-2 phrases)** | Présentation du livre sur la page de cours Moodle |
| 9 | **Factorisation de `generateHtmlFromBlocks`** | Fonction déjà atomique ([moodle-creator.js:346](../js/moodle/moodle-creator.js#L346)), appelable N fois |
| 10 | **Aide à 3 niveaux complète** | Description sidebar + tutoriel global + popover éditeur (non négociable) |

---

## 4. Phase 1 — Définition de l'activité

### 4.1. `js/core/definitions.js` — Registre `moodleModules`

**Localisation** : ajouter après l'entrée `Page` (~ligne 427).

```javascript
Livre: {
    name: "moodle_livre_name",
    subtitleKey: "moodle_livre_subtitle",
    description: "moodle_livre_description",
    image: "assets/images/activities/livre.webp",
    promptId: "livreResultat",
    jsonInputId: "livreJsonInput",
    createBtnId: "createLivreMBZ",
    categories: ["elea"],
    hidden: false,
    platforms: ["Éléa", "Magistère", "Moodle"],
    formats: ["MBZ", "DOCX", "ODT", "PDF"]
}
```

> **Note formats** : Livre n'expose **pas** le format `HTML` (contrairement à Page) — un livre est par nature multi-chapitres et un export HTML plat n'a pas de sens pédagogique. Si demandé ultérieurement, l'export HTML pourra concaténer les chapitres avec des séparateurs `<hr>`.

### 4.2. `js/core/definitions.js` — `customOrder`

**Localisation** : tableau `customOrder`, insérer `'Livre'` **immédiatement après `'Page'`** (~ligne 478).

```javascript
export const customOrder = [
    // ...
    'Page',
    'Livre',  // ← Nouveau, juste après Page
    // ...
];
```

### 4.3. `js/core/translation.js` — `defaultTranslations`

**Localisation** : objet `defaultTranslations` (~ligne 13). Ajouter les clés en français pour éviter le flash de clé brute au chargement.

```javascript
const defaultTranslations = {
    // ...existant...
    moodle_livre_name: "Livre",
    moodle_livre_subtitle: "(Cours multi-chapitres)",
    moodle_livre_description: "Activité pédagogique multi-chapitres avec mise en forme avancée et thème visuel cohérent."
};
```

> **Pourquoi** : sans cette injection en dur, la tuile Livre afficherait `moodle_livre_name` brut pendant la fraction de seconde entre `generateTiles()` et `loadTranslations('fr')`. Tous les autres affichages (descriptions complètes, autres langues) sont gérés via `js/locales/*.json`.

### 4.4. Validation Phase 1

- [ ] La tuile Livre apparaît dans la grille avec l'image `livre.webp`
- [ ] La tuile s'affiche immédiatement en français (« Livre ») sans flash de clé brute
- [ ] Les filtres « Éléa » / « Moodle » incluent Livre
- [ ] Le clic ouvre la sidebar avec les bons IDs DOM (`livreResultat`, `livreJsonInput`, `createLivreMBZ`)
- [ ] La position dans la grille est juste après Page

---

## 5. Phase 2 — Processeur Moodle `Livre.js`

### 5.1. Créer `js/moodle/processors/activities/Livre.js`

**Modèle** : copier `js/moodle/processors/activities/Page.js` et adapter les sections marquées « LIVRE-SPÉCIFIQUE ».

#### 5.1.1. Structure générale

```javascript
/**
 * @file Processeur pour l'activité Livre de Moodle (module book).
 * Génère tous les fichiers nécessaires à l'archive MBZ pour un livre multi-chapitres.
 * Réutilise toute la mécanique Page sauf le template d'activité (book.xml au lieu de page.xml).
 */

import { TEMPLATES } from '../shared/templates.js';
import { buildCourseBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';

export const metadata = {
    moduleName: 'book',
    moduleVersion: '2024100700',
    requiredPlaceholders: [
        'ACTIVITY_TITLE',
        'BOOK_NAME',
        'INTRO',
        'NUMBERING',
        'NAVSTYLE',
        'CUSTOMTITLES',
        'CHAPTERS_XML',          // ← Bloc XML <chapter>...</chapter> précomposé
        'COURSE_FULLNAME',
        'COURSE_SHORTNAME',
        'COURSE_ID',
        'MODULE_ID',
        'SECTION_ID',
        'ACTIVITY_ID',
        'COURSE_CONTEXTID',
        'ACTIVITY_CONTEXTID',
        'TIMESTAMP',
        'BACKUP_DATE'
    ]
};
```

#### 5.1.2. Templates XML LIVRE-SPÉCIFIQUES

```javascript
/**
 * Template XML pour l'activité book.
 */
const BOOK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="book" contextid="{{ACTIVITY_CONTEXTID}}">
  <book id="{{ACTIVITY_ID}}">
    <name>{{BOOK_NAME}}</name>
    <intro>{{INTRO}}</intro>
    <introformat>1</introformat>
    <numbering>{{NUMBERING}}</numbering>
    <navstyle>{{NAVSTYLE}}</navstyle>
    <customtitles>{{CUSTOMTITLES}}</customtitles>
    <timecreated>{{TIMESTAMP}}</timecreated>
    <timemodified>{{TIMESTAMP}}</timemodified>
    <chapters>
{{CHAPTERS_XML}}
    </chapters>
    <chaptertags>
    </chaptertags>
  </book>
</activity>`;

/**
 * Template module.xml pour Book (sans grades).
 */
const BOOK_MODULE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<module id="{{MODULE_ID}}" version="${metadata.moduleVersion}">
  <modulename>book</modulename>
  <sectionid>{{SECTION_ID}}</sectionid>
  <sectionnumber>0</sectionnumber>
  <idnumber></idnumber>
  <added>{{TIMESTAMP}}</added>
  <score>0</score>
  <indent>0</indent>
  <visible>1</visible>
  <visibleoncoursepage>1</visibleoncoursepage>
  <visibleold>1</visibleold>
  <groupmode>0</groupmode>
  <groupingid>0</groupingid>
  <completion>2</completion>
  <completiongradeitemnumber>$@NULL@$</completiongradeitemnumber>
  <completionpassgrade>0</completionpassgrade>
  <completionview>1</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>0</showdescription>
  <downloadcontent>1</downloadcontent>
  <lang></lang>
  <tags>
  </tags>
</module>`;

const BOOK_GRADES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`;

const BOOK_INFOREF_XML = `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
</inforef>`;

const BOOK_GRADEBOOK_XML = /* identique à PAGE_GRADEBOOK_XML — copie depuis Page.js */;
const BLOCK_XML = /* identique à Page.js */;
const BLOCK_INFOREF_XML = /* identique à Page.js */;
```

> **Règle de duplication** : `BOOK_GRADEBOOK_XML`, `BLOCK_XML`, `BLOCK_INFOREF_XML` sont **strictement identiques** à leurs équivalents Page. Les copier littéralement plutôt que de créer une dépendance croisée — un livre n'a pas de notes, comme une page.

#### 5.1.3. Fonction `buildFiles(data, options)`

**Cœur du processeur**. Calque exact de `Page.js` mais avec :
- Le répertoire `activities/book_${MODULE_ID}` au lieu de `page_${MODULE_ID}`
- Les templates `BOOK_*` au lieu de `PAGE_*`
- Tous les autres fichiers (course, sections, blocks, racine) **identiques**

```javascript
export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/book_${data.MODULE_ID}`;
    const sectionDir = `sections/section_${data.SECTION_ID}`;

    const blockId = 1000 + Math.floor(Math.random() * 9000);
    const extendedData = {
        ...data,
        ENROL_MANUAL_ID: data.ENROL_MANUAL_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_GUEST_ID: data.ENROL_GUEST_ID || (10000 + Math.floor(Math.random() * 90000)),
        ENROL_SELF_ID: data.ENROL_SELF_ID || (10000 + Math.floor(Math.random() * 90000)),
        BLOCK_ID: blockId,
        BLOCK_CONTEXTID: data.COURSE_CONTEXTID + 1
    };

    const blockDir = `course/blocks/course_toolbar_${blockId}`;

    // === Fichiers racine (identiques à Page) ===
    files['moodle_backup.xml'] = buildCourseBackup(extendedData, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    files['outcomes.xml'] = TEMPLATES.OUTCOMES_XML;
    files['scales.xml'] = TEMPLATES.SCALES_XML;
    files['gradebook.xml'] = BOOK_GRADEBOOK_XML;
    files['groups.xml'] = TEMPLATES.GROUPS_XML;
    files['questions.xml'] = TEMPLATES.QUESTIONS_XML;
    files['completion.xml'] = TEMPLATES.COMPLETION_XML;

    // === course/ (identique à Page) ===
    files['course/course.xml'] = replacePlaceholders(TEMPLATES.COURSE_XML, extendedData);
    files['course/enrolments.xml'] = replacePlaceholders(TEMPLATES.COURSE_ENROLMENTS_XML, extendedData);
    files['course/inforef.xml'] = TEMPLATES.COURSE_INFOREF_XML;
    files['course/roles.xml'] = TEMPLATES.ACTIVITY_ROLES_XML;
    files['course/completiondefaults.xml'] = TEMPLATES.COURSE_COMPLETIONDEFAULTS_XML;
    files['course/contentbank.xml'] = TEMPLATES.COURSE_CONTENTBANK_XML;
    files['course/calendar.xml'] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files['course/filters.xml'] = TEMPLATES.ACTIVITY_FILTERS_XML;

    // === course/blocks/ (identique à Page) ===
    files[`${blockDir}/block.xml`] = replacePlaceholders(BLOCK_XML, extendedData);
    files[`${blockDir}/inforef.xml`] = BLOCK_INFOREF_XML;
    files[`${blockDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;

    // === sections/section_XXX/ (identique à Page) ===
    files[`${sectionDir}/section.xml`] = replacePlaceholders(TEMPLATES.SECTION_XML, extendedData);
    files[`${sectionDir}/inforef.xml`] = TEMPLATES.SECTION_INFOREF_XML;

    // === activities/book_XXX/ (LIVRE-SPÉCIFIQUE) ===
    files[`${activityDir}/book.xml`] = replacePlaceholders(BOOK_XML, extendedData);
    files[`${activityDir}/module.xml`] = replacePlaceholders(BOOK_MODULE_XML, extendedData);
    files[`${activityDir}/grades.xml`] = BOOK_GRADES_XML;
    files[`${activityDir}/inforef.xml`] = BOOK_INFOREF_XML;
    files[`${activityDir}/roles.xml`] = TEMPLATES.ACTIVITY_ROLES_XML;
    files[`${activityDir}/calendar.xml`] = TEMPLATES.ACTIVITY_CALENDAR_XML;
    files[`${activityDir}/filters.xml`] = TEMPLATES.ACTIVITY_FILTERS_XML;

    return files;
}

export default { metadata, buildFiles };
```

> **Important** : `data.CHAPTERS_XML` doit être un **bloc XML déjà composé** (séquence de balises `<chapter>…</chapter>`). La composition du bloc se fait dans `moodle-creator.js` (Phase 3), pas ici. Le processeur `Livre.js` ne sait rien de Markdown, de blocs Page ou de thèmes — il fait du templating XML.

### 5.2. Enregistrer dans `js/moodle/processors/index.js`

```javascript
import * as Livre from './activities/Livre.js';

const processors = {
    'Appariement': Appariement,
    'QCM': QCM,
    'Page': Page,
    'Livre': Livre,            // ← Nouveau
    'Millionnaire': Millionnaire,
    'Test': Test,
    'Glossaire': Glossaire,
    'Devoir': Devoir
};
```

### 5.3. Validation Phase 2

- [ ] Le fichier `Livre.js` existe et exporte `metadata` + `buildFiles`
- [ ] `MoodleProcessors.getActivityFiles('Livre', testData)` retourne un objet `{path: content}` non vide
- [ ] Les chemins générés contiennent `activities/book_*` (pas `page_*`)
- [ ] Aucun appel réseau pendant `buildFiles()`
- [ ] Le fichier MBZ généré avec un `CHAPTERS_XML` minimal s'importe sans erreur dans Moodle/Éléa

---

## 6. Phase 3 — Pipeline de génération (`moodle-creator.js`)

C'est ici que la **factorisation par chapitre** se produit. Cette phase est la plus différente de Page car elle doit boucler sur les chapitres et appeler `generateHtmlFromBlocks()` plusieurs fois.

### 6.1. Localisation et structure

**Fichier** : `js/moodle/moodle-creator.js`
**Référence** : la fonction `handlePageCreation()` (~ligne 229) sert de modèle complet.

### 6.2. Créer `handleLivreCreation(jsonText, format)`

```javascript
/**
 * Gère la création d'un livre Moodle multi-chapitres.
 * Pour chaque chapitre, appelle generateHtmlFromBlocks() avec le thème global du livre.
 *
 * @param {string} jsonText - JSON brut produit par l'IA (ou édité)
 * @param {string} format - 'MBZ' uniquement (pas de HTML pour Livre)
 */
export async function handleLivreCreation(jsonText, format = 'MBZ') {
    let jsonData;
    try {
        jsonData = JSON.parse(jsonText);
    } catch (e) {
        showNotification(translations.error_parse || 'JSON invalide', 'error');
        return;
    }

    // === 1. Healing ===
    jsonData = healStructureForActivity(jsonData, 'Livre');
    healLatexForMoodle(jsonData);

    // === 2. Composition HTML par chapitre ===
    const theme = jsonData.theme || 'elea';
    const chaptersXml = await buildChaptersXml(jsonData.chapters, theme);

    // === 3. Composition de l'intro (peut être un simple paragraphe HTML) ===
    const introHtml = formatTextToHtml(jsonData.intro || '');

    // === 4. Préparation des données pour le processeur ===
    const baseData = MoodleProcessors.generateBaseData(jsonData.title || 'Livre');
    const data = {
        ...baseData,
        BOOK_NAME: escapeXml(jsonData.title || 'Livre'),
        INTRO: escapeXml(introHtml),
        NUMBERING: String(jsonData.numbering ?? 1),
        NAVSTYLE: String(jsonData.navstyle ?? 1),
        CUSTOMTITLES: String(jsonData.customtitles ?? 0),
        CHAPTERS_XML: chaptersXml
    };

    // === 5. Génération des fichiers + packaging MBZ ===
    const files = MoodleProcessors.getActivityFiles('Livre', data);
    const blob = await createMbz(files);
    downloadBlob(blob, `livre-${slugify(jsonData.title)}.mbz`);
}
```

### 6.3. Helper `buildChaptersXml(chapters, theme)`

C'est ici que la **réutilisation de `generateHtmlFromBlocks()`** se produit, **une fois par chapitre**.

```javascript
/**
 * Compose la séquence XML <chapter>...</chapter> à partir d'un tableau de chapitres.
 * Chaque chapitre est rendu via generateHtmlFromBlocks() avec le thème global.
 *
 * @param {Array<{title, subchapter, blocks}>} chapters
 * @param {string} theme - Identifiant du thème Page (elea, dsfr, accessible, dynamique)
 * @returns {Promise<string>} Bloc XML prêt à être injecté dans book.xml
 */
async function buildChaptersXml(chapters, theme) {
    const timestamp = Math.floor(Date.now() / 1000);
    const xmlParts = [];

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        // Rendu HTML du chapitre via la même fonction que Page
        const chapterJsonData = {
            title: chapter.title,
            blocks: chapter.blocks || [],
            theme: theme
        };
        const chapterHtml = await generateHtmlFromBlocks(chapterJsonData);

        // ID séquentiel pour le chapitre (interne au livre)
        const chapterId = 100 + i;
        const pagenum = i + 1;
        const subchapter = chapter.subchapter ? 1 : 0;

        xmlParts.push(`      <chapter id="${chapterId}">
        <pagenum>${pagenum}</pagenum>
        <subchapter>${subchapter}</subchapter>
        <title>${escapeXml(chapter.title || `Chapitre ${pagenum}`)}</title>
        <content>${escapeXml(chapterHtml)}</content>
        <contentformat>1</contentformat>
        <hidden>0</hidden>
        <timemodified>${timestamp}</timemodified>
        <importsrc></importsrc>
      </chapter>`);
    }

    return xmlParts.join('\n');
}
```

> **Point critique** : `generateHtmlFromBlocks()` retourne du HTML composé qui contient potentiellement des entités déjà encodées. La fonction `escapeXml()` ré-encode pour l'inclusion dans `<content>...</content>`. Vérifier qu'il n'y a pas de double-encoding (vérifier comportement actuel sur Page comme référence).

### 6.4. Brancher dans le routeur de création

**Fichier** : selon l'architecture, soit `moodle-creator.js` lui-même, soit `js/main.js` ou `js/ui/ui.js` qui dispatche selon `moduleKey`.

```javascript
// Dans le dispatcher principal (à identifier par la lecture de handlePageCreation appelants)
if (moduleKey === 'Livre') {
    return handleLivreCreation(jsonText, format);
}
```

> **Action** : avant d'écrire le branchement, faire un `Grep` sur `handlePageCreation` pour identifier tous ses appelants, et ajouter Livre **exactement aux mêmes endroits**.

### 6.5. Validation Phase 3

- [ ] Coller un JSON Livre minimal (1 chapitre, 1 bloc) → MBZ téléchargé
- [ ] Le HTML de chaque chapitre est bien encapsulé dans `<content>` du bon `<chapter>`
- [ ] Le `pagenum` est séquentiel et correct
- [ ] Le `subchapter` reflète le booléen JSON
- [ ] Les chapitres avec `subchapter=true` ne sont jamais en première position après healing
- [ ] Le mode `?debug` affiche les logs de composition par chapitre

---

## 7. Phase 4 — Healer (réparation JSON)

### 7.1. Localisation

**Fichier** : `js/h5p/json-healer.js` (oui, ce fichier sert aussi pour Moodle malgré son nom hérité)
**Référence** : le bloc `if (moduleKey === 'Page')` (~ligne 1166).

### 7.2. Bloc de healing Livre

Ajouter à `healStructureForActivity(data, moduleKey)` :

```javascript
if (moduleKey === 'Livre') {
    // 1. Defaults pour les réglages d'affichage (jamais générés par l'IA)
    if (typeof healed.numbering !== 'number' || ![0,1,2,3].includes(healed.numbering)) {
        healed.numbering = 1;     // Numérotation décimale par défaut
    }
    if (typeof healed.navstyle !== 'number' || ![0,1,2].includes(healed.navstyle)) {
        healed.navstyle = 1;       // Boutons flèches par défaut
    }
    if (typeof healed.customtitles !== 'number' || ![0,1].includes(healed.customtitles)) {
        healed.customtitles = 0;
    }

    // 2. Default theme
    if (typeof healed.theme !== 'string' || !['elea','dsfr','accessible','dynamique'].includes(healed.theme)) {
        healed.theme = 'elea';
    }

    // 3. Default intro (chaîne vide acceptée, mais jamais undefined)
    if (typeof healed.intro !== 'string') {
        healed.intro = '';
    }

    // 4. Validation et correction de la séquence des chapitres
    if (Array.isArray(healed.chapters) && healed.chapters.length > 0) {
        // Le premier chapitre ne peut JAMAIS être un sous-chapitre
        healed.chapters[0].subchapter = false;

        // Chaque sous-chapitre doit être précédé d'au moins un chapitre normal
        let lastWasNormal = true;
        healed.chapters.forEach((ch, idx) => {
            if (idx === 0) {
                lastWasNormal = true;
                return;
            }
            if (ch.subchapter && !lastWasNormal) {
                // Sous-chapitre orphelin → forcer en chapitre normal
                ch.subchapter = false;
            }
            lastWasNormal = !ch.subchapter;
        });

        // 5. Chaque chapitre doit avoir un tableau blocks (au moins vide)
        healed.chapters.forEach(ch => {
            if (!Array.isArray(ch.blocks)) ch.blocks = [];
            // Chaque bloc doit avoir un objet data (mêmes règles que Page)
            ch.blocks = ch.blocks.map(b => {
                if (!b.data) b.data = {};
                return b;
            });
            // Title fallback
            if (typeof ch.title !== 'string' || !ch.title.trim()) {
                ch.title = 'Chapitre sans titre';
            }
            // Subchapter doit être un booléen
            ch.subchapter = !!ch.subchapter;
        });
    } else {
        // Cas dégénéré : aucun chapitre → créer un chapitre vide pour éviter le crash
        healed.chapters = [{
            title: healed.title || 'Chapitre 1',
            subchapter: false,
            blocks: []
        }];
    }
}
```

### 7.3. Healing LaTeX

Le healing LaTeX existant `healLatexForMoodle()` (utilisé par Page) doit être appliqué récursivement aux `chapters[].blocks[].data.*`. Vérifier qu'il traverse bien les structures imbriquées — si non, étendre.

### 7.4. Validation Phase 4

- [ ] Un JSON sans `numbering`/`navstyle`/`customtitles` → healé avec valeurs par défaut
- [ ] Un JSON avec un sous-chapitre en première position → healé en chapitre normal
- [ ] Un JSON avec deux sous-chapitres consécutifs sans chapitre parent → corrigé
- [ ] Un JSON sans `chapters` → healé en livre à 1 chapitre vide (au lieu de crasher)
- [ ] Un thème invalide → healé en `'elea'`
- [ ] Le LaTeX dans les blocs est correctement traité (test avec `\(\frac{1}{2}\)`)

---

## 8. Phase 5 — Prompt IA et exemples

### 8.1. Template prompt — `assets/data/prompts/elea_livre.md`

**Modèle** : copier `assets/data/prompts/elea_pages.md` (96 lignes) et adapter.

Structure requise :

```markdown
# Prompt — Livre Moodle/Éléa

## Contexte pédagogique
[Reproduire le contexte commun de Page]

## Règles spécifiques à Livre

- Générer **4 à 6 chapitres** structurés autour d'une progression pédagogique cohérente
- Chaque chapitre doit comporter **3 à 6 blocs** de contenu issus de la liste des 18 types disponibles
- Les **sous-chapitres sont optionnels** : utiliser `subchapter: true` uniquement si la matière s'y prête (ex : un chapitre "Période antique" peut avoir des sous-chapitres "République" / "Empire")
- Le premier chapitre ne peut **jamais** être un sous-chapitre
- Un sous-chapitre doit toujours suivre au moins un chapitre normal
- Générer une **intro courte** (1 à 2 phrases) qui présente l'ensemble du livre sur la page de cours

## Champs IGNORÉS par l'IA
Ne pas générer ces champs — Caramel les injecte automatiquement :
- `numbering` (réglage d'affichage)
- `navstyle` (style de navigation)
- `customtitles` (titres personnalisés)
- `theme` (thème visuel — choisi par l'utilisateur dans l'éditeur)

## Structure JSON attendue

\`\`\`json
{
  "title": "Titre du livre",
  "intro": "<p>Présentation courte du livre (1-2 phrases).</p>",
  "chapters": [
    {
      "title": "Titre du chapitre 1",
      "subchapter": false,
      "blocks": [
        { "type": "#01_hero_header", "data": { ... } },
        { "type": "#04_callout_set", "data": { ... } }
      ]
    },
    {
      "title": "Titre du chapitre 2",
      "subchapter": false,
      "blocks": [ ... ]
    },
    {
      "title": "Sous-section du chapitre 2",
      "subchapter": true,
      "blocks": [ ... ]
    }
  ]
}
\`\`\`

## Liste des 18 types de blocs disponibles

[Reproduire EXACTEMENT la même liste de blocs que dans elea_pages.md, avec leur description et schéma `data` attendu]

## Exemple complet

[JSON complet d'un livre à 4 chapitres dont 1 avec sous-chapitre, avec ~3 blocs par chapitre]
```

> **Règle** : la liste des 18 types de blocs et leur format `data` doivent être **strictement identiques** à ceux du prompt Page. Toute divergence casserait le rendu via `generateHtmlFromBlocks()`. Méthode : copier le bloc complet depuis `elea_pages.md` sans modification.

### 8.2. Clés de traduction du prompt

Le générateur de prompt utilise 3 clés (cf. `js/services/prompt-generator.js`) :

```javascript
// Dans ACTIVITY_CONFIG :
eleaLivre: { prefix: 'prompt_elea_livre', resultKey: 'livreResultat' }
```

Et dans les locales :
- `prompt_elea_livre_regles_specifiques`
- `prompt_elea_livre_structure_json`
- `prompt_elea_livre_exemple_rendu`

### 8.3. Exemples JSON — `assets/data/examples/`

Créer **2 exemples** :

1. **`livre_1.json`** — Livre simple à 4 chapitres sans sous-chapitre, sujet pédagogique générique (ex : « Les états de la matière »)
2. **`livre_2.json`** — Livre à 5 chapitres incluant 2 sous-chapitres, avec LaTeX (ex : « Introduction aux fonctions affines »)

Format identique à celui décrit dans le prompt. Ces exemples servent aux tests automatisés.

### 8.4. Enregistrement dans `js/services/prompt-generator.js`

**Localisation** : `ACTIVITY_CONFIG` (~ligne 25-60).

```javascript
eleaLivre: { prefix: 'prompt_elea_livre', resultKey: 'livreResultat' }
```

### 8.5. Validation Phase 5

- [ ] Le bouton « Générer en un clic » sur la tuile Livre produit un JSON parsable
- [ ] Le JSON contient bien `chapters[]` avec 4 à 6 entrées
- [ ] Les blocs générés sont valides (types reconnus, `data` non vide)
- [ ] Les exemples manuels `livre_1.json` et `livre_2.json` passent dans le pipeline complet

---

## 9. Phase 6 — Override modèle IA

**Fichier** : `js/services/llm.js`
**Localisation** : `ACTIVITY_MODEL_OVERRIDES` (~ligne 37).

```javascript
export const ACTIVITY_MODEL_OVERRIDES = {
    // ...existant...
    'Page': 'gpt-oss-120b',
    'Livre': 'gpt-oss-120b',  // ← Nouveau
    // ...
};
```

> **Justification** : un livre multi-chapitres avec 18 types de blocs disponibles génère un JSON volumineux et structurellement complexe. Le modèle `gpt-oss-120b` a démontré sa capacité à gérer cette complexité pour Page — Livre hérite naturellement du même choix.

### 9.1. Validation Phase 6

- [ ] L'appel IA pour Livre utilise bien `gpt-oss-120b` (vérifiable dans les logs `?debug`)

---

## 10. Phase 7 — Field-constraints

### 10.1. Rôle critique de ce fichier

**Fichier** : `js/h5p/field-constraints.js` (le préfixe `h5p` est historique — ce fichier sert aussi aux activités Moodle, comme c'est déjà le cas pour Page).

C'est la **source de vérité unique** qui décrit, pour chaque champ texte de chaque activité, le **type de contenu accepté et son traitement attendu**. Toute déclaration manquante ou erronée provoque des bugs subtils en chaîne dans 3 composants en aval.

#### Les 6 types de rendu disponibles

| Type | Contenu accepté | Usage typique pour Livre |
|---|---|---|
| `plain` | Texte brut, aucun formatage, aucun HTML, aucun LaTeX | Titre du livre, titre de chapitre, libellés courts |
| `unicode` | Caractères Unicode autorisés (½, √, π) — pas de HTML | Pas utilisé pour Livre |
| `unicode+markers` | Unicode + marqueurs H5P (`*mot*`) | Pas utilisé pour Livre |
| `plain+letters` | Lettres uniquement (A-Z) | Pas utilisé pour Livre |
| `html` | HTML complet, sans support LaTeX | Pas utilisé pour Livre |
| `html+latex` | HTML complet + formules LaTeX `\(...\)` rendues par MathJax | Tous les champs de contenu : intro, blocs de texte, légendes, FAQ, etc. |

### 10.2. Conséquences en aval — 3 composants consomment ces contraintes

Déclarer les contraintes n'est pas un acte cosmétique : c'est ce qui **pilote automatiquement** le comportement du healer, de l'éditeur et du prompt IA. Sans ces déclarations, les 3 composants utilisent des fallbacks dégradés.

#### a) Healer (`js/h5p/json-healer.js`)

Le healer applique un traitement **par champ** selon la contrainte déclarée :

| Type de rendu | Action du healer |
|---|---|
| `plain` | Supprime tout HTML et tout LaTeX du champ — ne garde que le texte brut |
| `html+latex` | **Préserve le LaTeX**, répare les délimiteurs `$...$` → `\(...\)`, échappe les backslashes mal encodés par l'IA |
| `html` | Préserve le HTML mais **supprime les délimiteurs LaTeX** |
| `unicode` | Convertit le LaTeX en équivalents Unicode (`\alpha` → `α`, `\frac{1}{2}` → `½`) |

**Pour Livre** : sans la déclaration de `chapters[].blocks[].data.text` en `html+latex`, les formules LaTeX écrites dans un bloc de paragraphe seraient soit supprimées, soit cassées. La déclaration garantit le bon traitement récursif à travers la structure imbriquée `chapters[] → blocks[] → data.*`.

#### b) Éditeur visuel (`js/editor/field-renderers.js`)

L'éditeur choisit le type de widget à afficher en fonction de la contrainte :

| Type de rendu | Widget éditeur |
|---|---|
| `plain` | `<input type="text">` simple, sans toolbar |
| `html+latex` | **Rich Text Editor WYSIWYG** complet avec toolbar (gras, italique, listes, liens) + **bouton formule** ouvrant le `formula-assistant.js` |
| `html` | Rich Text Editor sans bouton formule |
| `unicode+markers` | Éditeur de marqueurs visuel spécifique |

**Pour Livre** : sans la déclaration des champs de bloc en `html+latex`, l'éditeur proposerait un input texte plat pour saisir un paragraphe de contenu pédagogique — inacceptable. La déclaration active automatiquement le rich text avec bouton formule pour tous les champs `chapters[].blocks[].data.*`.

> **Bonus** : la double-clic sur une formule existante dans le rich text rouvre automatiquement le `formula-assistant` pré-rempli — fonctionnalité héritée gratuitement par Livre dès que les contraintes sont déclarées.

#### c) Prompt IA (`js/services/prompt-generator.js` + locales)

Le prompt généré pour l'IA inclut des **indications de format mathématique** adaptées au type de rendu majoritaire de l'activité :

| Type de rendu majoritaire | Indication injectée dans le prompt |
|---|---|
| `html+latex` | « Pour les formules mathématiques, utilise le format LaTeX entre `\(...\)` (ex : `\(x^2 + 1\)`) » |
| `unicode` | « Pour les formules mathématiques, utilise les caractères Unicode (½, π, √, ≤, ≥) » |
| `plain` | Aucune indication math (les formules ne sont pas attendues) |

**Pour Livre** : avec la majorité des champs en `html+latex`, l'IA reçoit l'instruction de générer du LaTeX bien formé dans tous les champs de bloc. Sans cette déclaration, l'IA pourrait mélanger Unicode et LaTeX, créant un contenu incohérent.

### 10.3. Ajouter `'Livre'` et alias `'elea_livre'`

```javascript
'Livre': {
    platform: 'Moodle',
    machineName: 'book',
    fields: {
        'title': { render: 'plain' },
        'intro': { render: 'html+latex' },
        'chapters[].title': { render: 'plain' },
        'chapters[].blocks[].data': { render: 'html+latex' },
        'chapters[].blocks[].data.text': { render: 'html+latex' },
        'chapters[].blocks[].data.label': { render: 'html+latex' },
        'chapters[].blocks[].data.caption': { render: 'html+latex' },
        'chapters[].blocks[].data.cards[].text': { render: 'html+latex' },
        'chapters[].blocks[].data.callouts[].text': { render: 'html+latex' },
        'chapters[].blocks[].data.stats[].label': { render: 'html+latex' },
        'chapters[].blocks[].data.sections[].text': { render: 'html+latex' },
        'chapters[].blocks[].data.questions[].q': { render: 'html+latex' },
        'chapters[].blocks[].data.questions[].a': { render: 'html+latex' },
        'chapters[].blocks[].data.items[].myth': { render: 'html+latex' },
        'chapters[].blocks[].data.items[].reality': { render: 'html+latex' },
        'chapters[].blocks[].data.quote_langue_initiale': { render: 'html+latex' },
        'chapters[].blocks[].data.quote_langue_arrivee': { render: 'html+latex' }
    }
},

'elea_livre': {
    // Copie conforme de 'Livre' ci-dessus (alias éditeur)
}
```

> **Règle** : tous les chemins de Page sont préfixés par `chapters[].` pour Livre. C'est mécanique. Toute modification ultérieure de Page doit être répercutée sur Livre — envisager un test de cohérence automatique.

### 10.4. Méthode de vérification d'exhaustivité

Avant de considérer la phase terminée, vérifier que **chaque champ texte** de chaque exemple JSON Livre (`livre_1.json`, `livre_2.json`) est couvert par une entrée dans `field-constraints.js`. Procédure :

1. Ouvrir un exemple Livre dans l'éditeur visuel
2. Pour chaque champ affiché, vérifier qu'il déclenche le bon widget (input simple ou rich text)
3. Si un champ de contenu pédagogique apparaît en input simple → c'est qu'il manque une contrainte
4. Croiser avec le dashboard `tests/field-constraints-dashboard.html` (filtrer sur `Livre`) pour visualiser la couverture

### 10.5. Validation Phase 7

- [ ] L'entrée `Livre` apparaît dans le dashboard `tests/field-constraints-dashboard.html`
- [ ] Les chemins listés correspondent aux clés réellement présentes dans les exemples JSON

---

## 11. Phase 8 — Éditeur visuel JSON

### 11.1. Localisation

**Fichier** : `js/editor/content-detector.js`
**Référence** : section `'elea_page'` (~ligne 2213-2284).

### 11.2. Signature de détection

**Objet** : `contentSignatures` (~ligne 20).

```javascript
'Livre': (data) =>
    Array.isArray(data.chapters) &&
    data.chapters.length > 0 &&
    data.chapters.every(ch => Array.isArray(ch.blocks))
```

> **Distinction avec Page** : Page a `blocks[]` au niveau racine, Livre a `chapters[].blocks[]`. La signature doit donc vérifier l'absence de `blocks` racine ET la présence de `chapters[]`.

### 11.3. Mapping titleKey ↔ moduleKey

```javascript
// titleKeyToModuleKey (~ligne 174)
'moodle_livre_name': 'Livre',
// ou plus précisément 'elea_livre' selon la convention de l'éditeur

// moduleTranslationKeys (~ligne 1615)
'elea_livre': 'moodle_livre_name'
```

> **Clarification** : suivre la convention de Page qui utilise `'elea_page'` comme moduleKey **dans l'éditeur** (tandis que `'Page'` est le moduleKey **dans le code**). Cohérence : utiliser `'elea_livre'` partout dans l'éditeur.

### 11.4. Schéma de l'éditeur

Ajouter dans la map des schémas (~ligne 2213) :

```javascript
'elea_livre': {
    sections: [
        {
            id: 'general',
            label: 'editor_section_general',
            icon: 'fa-info-circle',
            fields: {
                title: { type: 'text', label: 'editor_title', required: true },
                intro: {
                    type: 'textarea',
                    label: 'editor_livre_intro',
                    hint: 'editor_livre_intro_hint'
                },
                theme: {
                    type: 'select',
                    label: 'editor_page_theme',  // ← Réutilise les libellés Page
                    options: [
                        { value: 'elea', labelKey: 'editor_page_theme_elea' },
                        { value: 'dsfr', labelKey: 'editor_page_theme_dsfr' },
                        { value: 'accessible', labelKey: 'editor_page_theme_accessible' },
                        { value: 'dynamique', labelKey: 'editor_page_theme_dynamique' }
                    ]
                }
            }
        },
        {
            id: 'display_settings',
            label: 'editor_livre_display_settings',
            icon: 'fa-sliders',
            collapsed: true,   // Repliée par défaut
            fields: {
                numbering: {
                    type: 'select',
                    label: 'editor_livre_numbering',
                    hint: 'editor_livre_numbering_hint',
                    options: [
                        { value: 0, labelKey: 'editor_livre_numbering_none' },
                        { value: 1, labelKey: 'editor_livre_numbering_decimal' },
                        { value: 2, labelKey: 'editor_livre_numbering_bullets' },
                        { value: 3, labelKey: 'editor_livre_numbering_dashes' }
                    ]
                },
                navstyle: {
                    type: 'select',
                    label: 'editor_livre_navstyle',
                    hint: 'editor_livre_navstyle_hint',
                    options: [
                        { value: 0, labelKey: 'editor_livre_navstyle_toc' },
                        { value: 1, labelKey: 'editor_livre_navstyle_images' },
                        { value: 2, labelKey: 'editor_livre_navstyle_text' }
                    ]
                },
                customtitles: {
                    type: 'toggle',
                    label: 'editor_livre_customtitles',
                    hint: 'editor_livre_customtitles_hint'
                }
            }
        },
        {
            id: 'chapters',
            label: 'editor_livre_chapters',
            icon: 'fa-book-open',
            countField: 'chapters',
            fields: {
                chapters: {
                    type: 'array',
                    itemLabel: 'editor_livre_chapter',
                    addLabel: 'editor_livre_add_chapter',
                    dynamicTitleField: 'title',
                    minItems: 1,
                    itemSchema: {
                        title: {
                            type: 'text',
                            label: 'editor_livre_chapter_title',
                            required: true
                        },
                        subchapter: {
                            type: 'toggle',
                            label: 'editor_livre_subchapter',
                            hint: 'editor_livre_subchapter_hint'
                        },
                        blocks: {
                            type: 'array',
                            itemLabel: 'editor_block',
                            addLabel: 'editor_add_block',
                            dynamicTitleField: 'type',
                            minItems: 0,
                            itemSchema: {
                                type: {
                                    type: 'select',
                                    label: 'editor_block_type',
                                    required: true,
                                    options: [
                                        // ← RÉUTILISER les 18 options exactes de elea_page
                                        // (copier le bloc options depuis content-detector.js ligne 2253-2272)
                                        { value: '#01_hero_header', labelKey: 'editor_block_label_01_hero_header' },
                                        // ... × 18
                                    ]
                                },
                                data: {
                                    type: 'pageBlockData',
                                    label: 'editor_block_content',
                                    required: true
                                }
                            }
                        }
                    }
                }
            }
        }
    ]
}
```

### 11.5. Réutilisation du `pageBlockData` field renderer

**Aucune modification nécessaire** dans `js/editor/field-renderers.js` :
- Le type `pageBlockData` accepte n'importe quel `path`, donc `chapters[2].blocks[0].data` fonctionne directement
- Les `pageBlockSchemas` (1511-1700) sont indexés par `blockType` (`#01_hero_header`, etc.), pas par moduleKey
- Le rendu dynamique selon le type de bloc fonctionne identiquement

> **C'est le bénéfice majeur de la décision d'architecture #1** (réutilisation des 18 blocs). Aucun code éditeur n'est dupliqué.

### 11.6. Normalisation / Dénormalisation

**Aucune transformation nécessaire** : la structure JSON Livre est plate et directement éditable.

```javascript
// Dans normalizeDataForEditor() — pas de cas Livre, le JSON brut suffit
// Dans denormalizeDataForSave() — idem
```

### 11.7. Règles de validation

**Fichier** : `js/editor/validators.js` — fonction `getTypeSpecificErrors()` (~ligne 357).

```javascript
case 'Livre':
case 'elea_livre':
    if (!data.title || !data.title.trim()) {
        errors.push({ field: 'title', message: t('editor_error_title_required') });
    }
    if (!Array.isArray(data.chapters) || data.chapters.length === 0) {
        errors.push({ field: 'chapters', message: t('editor_error_no_chapters') });
    } else {
        if (data.chapters[0].subchapter) {
            errors.push({
                field: 'chapters[0].subchapter',
                message: t('editor_error_first_subchapter')
            });
        }
        let lastWasNormal = true;
        data.chapters.forEach((ch, idx) => {
            if (idx > 0 && ch.subchapter && !lastWasNormal) {
                errors.push({
                    field: `chapters[${idx}].subchapter`,
                    message: t('editor_error_orphan_subchapter')
                });
            }
            lastWasNormal = !ch.subchapter;
            if (!ch.title || !ch.title.trim()) {
                errors.push({
                    field: `chapters[${idx}].title`,
                    message: t('editor_error_chapter_title_required')
                });
            }
        });
    }
    break;
```

### 11.8. Validation Phase 8

- [ ] L'éditeur s'ouvre sur un Livre généré et affiche les 3 sections (Général, Réglages, Chapitres)
- [ ] La section Réglages est repliée par défaut
- [ ] L'ajout/suppression/réorganisation de chapitres fonctionne
- [ ] L'ajout/suppression/réorganisation de blocs **dans un chapitre** fonctionne
- [ ] Le changement de type de bloc charge le bon schéma `pageBlockData`
- [ ] La validation détecte un sous-chapitre en première position
- [ ] La sauvegarde régénère un MBZ valide

---

## 12. Phase 9 — Aide à 3 niveaux (sidebar / tutoriel / éditeur)

L'aide est un **livrable critique** pour les enseignants. **Aucun des 3 niveaux ne peut être omis.**

### 12.1. Niveau 1 — Description sidebar (1 phrase)

**Fichier** : `js/core/definitions.js` — déjà fait en Phase 1 via `description: "moodle_livre_description"`.

**Clés à traduire** dans les 11 fichiers locales :
- `moodle_livre_name` — « Livre »
- `moodle_livre_subtitle` — « (Cours multi-chapitres) »
- `moodle_livre_description` — Phrase pédagogique courte expliquant l'usage typique

### 12.2. Niveau 2 — Tutoriel global

**Fichier** : `assets/templates/tutorial_content.html`
**Section** : `#choisir` (étape 2)

Ajouter une carte ou un bloc présentant le Livre dans la liste des activités Éléa, similaire à ce qui existe pour Page. Utiliser des clés `tuto_choisir_livre_*` à créer.

> **Action** : ouvrir `tutorial_content.html`, repérer la sous-section dédiée à Page dans `#choisir`, dupliquer la structure HTML pour Livre, créer les clés de traduction associées.

### 12.3. Niveau 3 — Aide éditeur (popover dans le footer modale) ⭐ FONDAMENTAL

**Fichier à créer** : `assets/templates/editor-help/elea_livre.html`
**Modèle** : `assets/templates/editor-help/elea_page.html` (247 lignes)

**Structure obligatoire** :

```html
<div class="editor-help-content">
    <!-- 1. EN-TÊTE -->
    <h3>{{moodle_livre_name}}</h3>
    <p class="editor-help-intro">{{eh_elea_livre_desc}}</p>

    <!-- 2. CHAMPS GÉNÉRAUX -->
    <h4>{{eh_elea_livre_section_general}}</h4>
    <table class="editor-help-table">
        <tr><td><strong>{{eh_elea_livre_field_title}}</strong></td><td>{{eh_elea_livre_field_title_desc}}</td></tr>
        <tr><td><strong>{{eh_elea_livre_field_intro}}</strong></td><td>{{eh_elea_livre_field_intro_desc}}</td></tr>
        <tr><td><strong>{{eh_elea_livre_field_theme}}</strong></td><td>{{eh_elea_livre_field_theme_desc}}</td></tr>
    </table>

    <!-- 3. RÉGLAGES D'AFFICHAGE -->
    <h4>{{eh_elea_livre_section_settings}}</h4>
    <p>{{eh_elea_livre_settings_intro}}</p>
    <table class="editor-help-table">
        <tr><td><strong>{{eh_elea_livre_field_numbering}}</strong></td><td>{{eh_elea_livre_field_numbering_desc}}</td></tr>
        <tr><td><strong>{{eh_elea_livre_field_navstyle}}</strong></td><td>{{eh_elea_livre_field_navstyle_desc}}</td></tr>
        <tr><td><strong>{{eh_elea_livre_field_customtitles}}</strong></td><td>{{eh_elea_livre_field_customtitles_desc}}</td></tr>
    </table>

    <!-- 4. CHAPITRES ET SOUS-CHAPITRES -->
    <h4>{{eh_elea_livre_section_chapters}}</h4>
    <p>{{eh_elea_livre_chapters_intro}}</p>
    <ul>
        <li>{{eh_elea_livre_rule_min_chapters}}</li>
        <li>{{eh_elea_livre_rule_first_normal}}</li>
        <li>{{eh_elea_livre_rule_subchapter_parent}}</li>
        <li>{{eh_elea_livre_rule_subchapter_optional}}</li>
    </ul>

    <!-- 5. LES 18 TYPES DE BLOCS (réutilisation des clés Page) -->
    <h4>{{eh_elea_livre_section_blocks}}</h4>
    <p>{{eh_elea_livre_blocks_intro}}</p>

    <!-- Les 18 sections de blocs sont IDENTIQUES à elea_page.html
         et utilisent les MÊMES clés de traduction :
         {{editor_block_label_01_hero_header}}, {{eh_elea_page_block_01_desc}}, etc.
         → Copier les sections 27-247 de elea_page.html telles quelles -->

    <h5>{{editor_block_label_01_hero_header}}</h5>
    <p>{{eh_elea_page_block_01_desc}}</p>
    <!-- ... × 18 -->
</div>
```

> **Réutilisation maximale** : les descriptions des 18 blocs sont **identiques** à celles de Page (mêmes clés `eh_elea_page_block_*`). Aucune duplication de traduction nécessaire.
>
> Les **clés nouvelles** sont uniquement celles spécifiques à Livre : section générale, réglages d'affichage, chapitres et règles de séquencement.

### 12.4. Récapitulatif des clés d'aide à créer

| Niveau | Clés nouvelles | Réutilisation |
|---|---|---|
| 1 (sidebar) | `moodle_livre_name`, `moodle_livre_subtitle`, `moodle_livre_description` | — |
| 2 (tutoriel) | `tuto_choisir_livre_title`, `tuto_choisir_livre_desc`, `tuto_choisir_livre_use` (~3 clés) | Structure HTML copiée de Page |
| 3 (popover éditeur) | ~25 clés `eh_elea_livre_*` (sections, champs Livre-spécifiques, règles de chapitres) | 18 × 3 clés `eh_elea_page_block_*` réutilisées telles quelles |
| **Total nouveau** | **~30 clés × 11 langues = ~330 traductions** | **~54 clés réutilisées** |

### 12.5. Validation Phase 9

- [ ] La sidebar affiche la description Livre sous le titre
- [ ] Le tutoriel global mentionne Livre dans la section `#choisir`
- [ ] Le bouton « Aide » du footer de la modale d'édition ouvre le popover
- [ ] Le popover affiche les 4 sections (champs généraux, réglages, chapitres, blocs)
- [ ] Les 18 blocs sont documentés (réutilisation des clés Page)
- [ ] L'aide est lisible dans les 11 langues
- [ ] Le zoom (3 niveaux) du popover fonctionne

---

## 13. Phase 10 — Export DOCX / ODT / PDF

### 13.1. Localisation

**Fichier** : `js/export/document-formatter.js`
**Référence** : fonction `formatPage(data)` (~ligne 2977).

### 13.2. Ajouter au registre des formateurs

**Map** : `formatters` dans `formatContentForDocument()` (~ligne 21).

```javascript
'Livre': formatLivre,
'elea_livre': formatLivre
```

### 13.3. Implémenter `formatLivre(data)`

Le principe : itérer sur les chapitres, générer un titre par chapitre puis appeler la logique de formatage Page existante pour chaque chapitre.

```javascript
function formatLivre(data) {
    const sections = [];
    const title = data.title || t('moodle_livre_name');
    const numbering = data.numbering ?? 1;

    // === En-tête principal ===
    sections.push({ type: 'header', level: 1, text: title });

    // === Intro ===
    if (data.intro && data.intro.trim()) {
        sections.push({ type: 'paragraph', text: data.intro, style: 'description' });
    }
    sections.push({ type: 'separator' });

    // === Itération sur les chapitres ===
    let chapterCounter = 0;
    let subchapterCounter = 0;

    (data.chapters || []).forEach((chapter, idx) => {
        // Calcul de la numérotation à afficher
        let prefix = '';
        if (chapter.subchapter) {
            subchapterCounter++;
            if (numbering === 1) {
                prefix = `${chapterCounter}.${subchapterCounter} `;
            }
        } else {
            chapterCounter++;
            subchapterCounter = 0;
            if (numbering === 1) {
                prefix = `${chapterCounter}. `;
            }
        }

        // Saut de page entre chapitres principaux (pas pour les sous-chapitres)
        if (idx > 0 && !chapter.subchapter) {
            sections.push({ type: 'pageBreak' });
        }

        // Titre du chapitre (h2 pour chapitre, h3 pour sous-chapitre)
        sections.push({
            type: 'header',
            level: chapter.subchapter ? 3 : 2,
            text: prefix + (chapter.title || `Chapitre ${chapterCounter}`)
        });

        // Réutilisation de la logique de formatage des blocs Page
        // → Appeler formatPageBlocks(chapter.blocks, sections) ou un helper équivalent
        // Si formatPage() ne factorise pas le rendu des blocs, le refactorer pour exposer
        // un helper commun formatBlocks(blocks, sections)
        formatPageBlocks(chapter.blocks || [], sections);
    });

    return { title, sections };
}
```

> **Refactoring nécessaire** : si `formatPage()` traite les blocs en ligne (sans helper isolé), créer un helper `formatPageBlocks(blocks, sections)` extrait du corps de `formatPage()`, et l'utiliser depuis `formatPage()` ET `formatLivre()`. Pas de duplication acceptable.

### 13.4. Validation Phase 10

- [ ] Export DOCX : ouvert dans Word, structure hiérarchique correcte (H1=titre livre, H2=chapitres, H3=sous-chapitres)
- [ ] Export ODT : idem dans LibreOffice
- [ ] Export PDF : pagination, table des matières automatique si possible
- [ ] Numérotation décimale (1., 1.1, 2., 2.1) appliquée si `numbering=1`
- [ ] Pas de saut de page avant un sous-chapitre (continuité avec son chapitre parent)
- [ ] Les blocs sont rendus identiquement à Page (mêmes formateurs)
- [ ] Les formules LaTeX sont correctement converties (Unicode pour PDF, OMML pour DOCX, MathML pour ODT)

---

## 14. Phase 11 — Traductions (11 langues)

### 14.1. Récapitulatif des clés à ajouter

| Catégorie | Préfixe | Nombre | Fichiers concernés |
|---|---|---|---|
| Identité | `moodle_livre_*` | 3 | 11 locales |
| Prompt IA | `prompt_elea_livre_*` | 3 | 11 locales |
| Éditeur — section générale | `editor_livre_*` (intro, chapter_title, etc.) | ~5 | 11 locales |
| Éditeur — réglages d'affichage | `editor_livre_numbering_*`, `editor_livre_navstyle_*`, etc. | ~12 | 11 locales |
| Éditeur — chapitres | `editor_livre_chapters`, `editor_livre_chapter`, `editor_livre_add_chapter`, `editor_livre_subchapter` | ~5 | 11 locales |
| Validation | `editor_error_first_subchapter`, `editor_error_orphan_subchapter`, etc. | ~4 | 11 locales |
| Aide éditeur (popover) | `eh_elea_livre_*` | ~25 | 11 locales |
| Tutoriel global | `tuto_choisir_livre_*` | ~3 | 11 locales |

**Total estimé** : ~60 clés × 11 langues = **~660 traductions à insérer**.

### 14.2. Procédure recommandée

1. **Rédiger en français** d'abord, dans `js/locales/fr.json`
2. **Vérifier la cohérence** avec les conventions existantes (structure, ton, vocabulaire)
3. **Propager dans les 10 autres langues** :
   - Anglais (`en.json`) : traduction de référence pour les autres
   - Latin scripts (`es`, `de`, `it`, `nl`, `pt`) : adapter depuis l'anglais ou le français
   - Non-latin scripts (`ar`, `zh`, `jp`, `el`) : traduction soignée, attention aux directions de texte (RTL pour `ar`)
4. **Vérifier l'ordre des clés** : insérer chaque clé au bon emplacement dans le fichier (cohérence avec les sections existantes)

### 14.3. Bonnes pratiques

- **Vocabulaire pédagogique** : utiliser le même registre que les autres activités (pas jargon technique)
- **Cohérence des termes** : « chapitre » / « sous-chapitre » constants dans toutes les clés
- **Réutilisation** : ne pas dupliquer une clé existante. Ex : `editor_title` est déjà universel, ne pas créer `editor_livre_title`.
- **Test croisé** : ouvrir au moins 3 langues différentes (1 latine, 1 RTL, 1 idéographique) et vérifier qu'aucune clé n'est restée en français

### 14.4. Validation Phase 11

- [ ] `js/locales/fr.json` contient toutes les nouvelles clés
- [ ] Les 10 autres fichiers contiennent **exactement** les mêmes clés (test `test-i18n.js`)
- [ ] Le changement de langue dans l'UI met à jour tous les textes Livre (tuile, sidebar, éditeur, popover d'aide)
- [ ] Aucune clé brute (`moodle_livre_*`) visible dans aucune langue
- [ ] Le RTL (arabe) affiche correctement le popover d'aide

---

## 15. Phase 12 — Asset visuel (icône)

### 15.1. Fichier

**Chemin** : `assets/images/activities/livre.webp`

**Statut** : ✅ **Déjà fourni par l'utilisateur** lors de la préparation du PRD. Vérifier sa présence avant tout développement :

```bash
# Doit retourner le fichier
ls assets/images/activities/livre.webp
```

### 15.2. Spécifications attendues

- Format : WebP
- Dimensions : ~200×200px (carré)
- Style cohérent avec les icônes existantes (contour coloré, fond clair)
- Taille fichier : <50 Ko

### 15.3. Validation Phase 12

- [ ] Le fichier `assets/images/activities/livre.webp` existe
- [ ] L'icône s'affiche dans la tuile (taille tuile + taille modale)
- [ ] L'icône reste lisible en petit (vérifier sur mobile)

---

## 16. Phase 13 — Tests et validation

### 16.1. Tests automatisés à exécuter

| Test | Fichier | Vérification |
|---|---|---|
| Cohérence des définitions | `tests/test-definitions.js` | Champs requis, unicité IDs, image existe, exemples présents |
| Cohérence i18n | `tests/test-i18n.js` | Toutes les clés existent dans les 11 langues |
| Export document | `tests/test-document-export.js` | DOCX/ODT/PDF générables sans crash |
| Field-constraints | `tests/field-constraints-dashboard.html` | Visualiser que Livre apparaît avec ses contraintes |
| Pipeline complet | Test manuel | Génération IA → MBZ → import Moodle |

### 16.2. Test manuel critique : import dans Éléa

1. Cliquer sur la tuile Livre
2. Lancer la génération en un clic (mode rapide)
3. Vérifier l'aperçu (chapitres affichés)
4. Cliquer sur « Modifier » → vérifier l'éditeur (3 sections, ajout/suppression de chapitres et blocs)
5. Cliquer sur « Aide » dans le footer → vérifier le popover
6. Sauvegarder et télécharger le MBZ
7. **Importer le MBZ dans une instance Éléa** ([guide d'import](../assets/templates/tutorial_content.html))
8. Vérifier dans Éléa :
   - Le livre apparaît dans le cours
   - Les chapitres sont navigables (boutons précédent/suivant)
   - La numérotation décimale (1., 1.1, 2., 2.1) est appliquée
   - Les blocs sont rendus visuellement avec le bon thème
   - Les formules LaTeX sont rendues par MathJax

### 16.3. Validation Phase 13

- [ ] Tous les tests automatisés passent
- [ ] L'import dans Éléa réussit sans warning
- [ ] La navigation entre chapitres fonctionne dans Éléa
- [ ] Le mode `?debug` affiche les logs de chaque chapitre généré
- [ ] Aucune régression sur les autres activités (lancer une génération Page pour vérifier)

---

## 17. Checklist de validation finale

### Fonctionnel

- [ ] **Tuile** — Apparaît dans la grille, immédiatement en français, filtrable Éléa/Moodle
- [ ] **Génération IA** — Le « un clic » produit un JSON Livre valide à 4-6 chapitres
- [ ] **Healing** — Les défauts d'affichage sont injectés, séquences de chapitres corrigées
- [ ] **MBZ** — Le fichier .mbz se télécharge et s'importe dans Moodle/Éléa sans erreur
- [ ] **Prévisualisation** — La modale d'aperçu affiche le livre lisiblement
- [ ] **Éditeur** — Les 3 sections fonctionnent (Général, Réglages, Chapitres avec nesting)
- [ ] **Bouton Aide éditeur** — Le popover s'ouvre et affiche les 4 sections d'aide
- [ ] **Export DOCX** — Fichier lisible, structure hiérarchique correcte
- [ ] **Export ODT** — Idem
- [ ] **Export PDF** — Idem
- [ ] **Multi-langue** — Tout fonctionne dans les 11 langues, popover d'aide inclus

### Architecture

- [ ] **Réutilisation `generateHtmlFromBlocks`** — Aucune duplication de code de rendu de blocs
- [ ] **Réutilisation `pageBlockSchemas`** — Aucune duplication de schémas dans field-renderers
- [ ] **Réutilisation `pageBlockData` field type** — Aucune modification de l'éditeur
- [ ] **Réutilisation `formatPageBlocks` (Phase 10)** — Helper extrait et utilisé par Page ET Livre
- [ ] **Réutilisation des clés `eh_elea_page_block_*`** — Aide éditeur sans duplication des descriptions de blocs
- [ ] **Hardcoded français** — `defaultTranslations` contient les 3 clés Livre

### Aide à 3 niveaux

- [ ] **Niveau 1 (sidebar)** — Description courte affichée
- [ ] **Niveau 2 (tutoriel global)** — Section Livre présente dans `tutorial_content.html`
- [ ] **Niveau 3 (popover éditeur)** — Fichier `editor-help/elea_livre.html` créé et fonctionnel

### Robustesse

- [ ] **JSON sans `chapters`** → healé en livre à 1 chapitre vide
- [ ] **Sous-chapitre en première position** → corrigé par le healer
- [ ] **Sous-chapitres consécutifs orphelins** → corrigés par le healer
- [ ] **Thème invalide** → forcé à `'elea'`
- [ ] **Bloc avec `data` manquant** → corrigé par le healer

### Documentation

- [ ] **Ce PRD** — Mis à jour si des écarts ont été constatés pendant l'implémentation
- [ ] **Changelog** — Mention de l'ajout dans la prochaine version
- [ ] **`MEMORY.md`** — Mention du nouveau processeur Livre dans le projet

---

---

## 17. Phase 14 — Preview dans la modale (simulateur fidèle)

> **⚠️ Phase ajoutée en v1.1.0** — Initialement omise du PRD car ce point n'avait pas été identifié pendant la conception. Sans cette phase, la modale d'aperçu affiche **« Preview disponible prochainement »** au lieu du contenu du livre.

### 17.1. Architecture de la preview Caramel

La modale de prévisualisation des activités générées route le rendu **par `titleKey`** dans `js/ui/notifications.js` → fonction `renderPreview()`. Pour chaque type d'activité Moodle, une branche `else if (notification.titleKey === '...')` appelle un simulateur dédié dans `js/simulators.js`.

Si aucune branche ne matche, le code tombe dans le **fallback générique** qui affiche `translations.preview_placeholder` (« Preview disponible prochainement »). C'est ce qui se produit pour toute nouvelle activité tant que les 2 points suivants ne sont pas faits.

### 17.2. Étape A — Brancher Livre dans `renderPreview()`

**Fichier** : `js/ui/notifications.js`
**Localisation** : fonction `renderPreview()`, dans la chaîne `else if` qui route les types Moodle (~ligne 1265-1330).

Ajouter une branche après celle de Page :

```javascript
} else if (notification.titleKey === 'elea_page_name') {
    debugLog('notifications', "renderPreview: Rendering Elea Page");
    simulators.renderPage(previewContainer, notification.jsonData, notification.previewHtml);
} else if (notification.titleKey === 'elea_livre_name') {
    // Rendu du simulateur Livre Éléa (multi-chapitres avec TOC)
    debugLog('notifications', "renderPreview: Rendering Elea Livre");
    simulators.renderLivre(previewContainer, notification.jsonData, notification.previewHtml);
} else if (notification.titleKey === 'elea_devoir_name') {
```

> **Critère** : `titleKey` est défini par `addNotification()` dans `handleLivreCreation()` (Phase 3). Vérifier que cette valeur est cohérente entre la création (notification) et le routage (preview).

### 17.3. Étape B — Créer `renderLivre()` dans `simulators.js`

**Fichier** : `js/simulators.js`
**Localisation** : ajouter après `renderPage()` (~ligne 1916-1920).

Le simulateur Livre est un cas particulier : le HTML complet (layout 2 colonnes + TOC + navigation) est **déjà précomposé** par `buildLivrePreviewHtml()` dans `moodle-creator.js` lors de la génération. Le rôle de `renderLivre()` est donc minimal : envelopper le HTML dans un wrapper centré et ajouter le bouton plein écran.

```javascript
export function renderLivre(container, data, previewHtml) {
    if (!container || !data) return;
    if (!previewHtml) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Aperçu non disponible</p>';
        return;
    }
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'elea-livre-fidelity-wrapper';
    wrapper.style.cssText = 'position: relative; font-family: system-ui, ...; max-width:1100px; margin:0 auto; ...';
    wrapper.innerHTML = previewHtml;

    const fsBtnContainer = document.createElement('div');
    fsBtnContainer.style.cssText = 'position: absolute; top: 15px; right: 15px; z-index: 10;';
    fsBtnContainer.appendChild(createFullscreenButton(true));
    wrapper.appendChild(fsBtnContainer);

    container.appendChild(wrapper);
    mathRenderer.renderMath(wrapper);
}
```

### 17.4. Étape C — Le simulateur fidèle dans `moodle-creator.js`

**Fonction** : `buildLivrePreviewHtml(jsonData)` dans `js/moodle/moodle-creator.js`.

**Cahier des charges visuel** (basé sur l'aperçu réel d'Éléa) :
- Layout 2 colonnes : contenu principal à gauche, table des matières à droite
- Header : icône 📖 + titre du livre en grand
- Intro grise sous le titre, séparée par une ligne
- **Un seul chapitre affiché à la fois** (le 1er par défaut)
- Navigation entre chapitres via la TOC : clic = changement de chapitre
- Numérotation décimale (1., 2., 2.1., 3.) selon le mode `numbering`
- Sous-chapitres indentés dans la TOC + dans la liste de gauche
- **PAS de barre d'onglets** « Livre / Paramètres / Importer le chapitre » (présente dans Éléa réel mais non pertinente pour un aperçu)
- Highlight du chapitre actif dans la TOC (fond bleu clair, bordure gauche bleue)
- Responsive : layout 1 colonne sous 800px

**Contrainte technique critique** : le HTML est injecté via `innerHTML` qui **n'exécute pas les `<script>`**. La navigation entre chapitres doit donc être **CSS pure**.

**Solution implémentée** : pattern **radio buttons cachés + labels** :
- Pour chaque chapitre : un `<input type="radio" name="livre-sim-XXX-nav" id="livre-sim-XXX-ch-N">` caché
- Les liens de la TOC sont des `<label for="livre-sim-XXX-ch-N">`
- CSS : `#XXX-ch-N:checked ~ .layout .chapter[data-ch="N"] { display: block; }` (sibling selector)
- Premier chapitre `checked` par défaut

**Identifiant unique** : `livre-sim-XXXXXX` généré aléatoirement à chaque appel pour éviter les collisions si plusieurs previews coexistent.

**Internationalisation** : la clé `livre_toc_label` doit exister dans les 11 langues (Phase 11). Sans elle, l'aperçu affiche « Table des matières » en dur (fallback français).

### 17.5. Validation Phase 14

- [ ] Cliquer sur l'aperçu d'un livre généré n'affiche **plus** « Preview disponible prochainement »
- [ ] Le simulateur affiche le titre + intro + 1er chapitre + TOC à droite
- [ ] Cliquer sur un autre chapitre dans la TOC change le contenu affiché
- [ ] Le chapitre actif est highlighté dans la TOC
- [ ] Les sous-chapitres apparaissent indentés dans la TOC avec leur numérotation décimale
- [ ] Les formules LaTeX sont rendues par MathJax
- [ ] Le bouton plein écran fonctionne
- [ ] Le layout passe en 1 colonne sous 800px
- [ ] Le label « Table des matières » est traduit dans les 11 langues

---

## 18. Phase 15 — Intégration aux fixtures de tests

> **⚠️ Phase ajoutée en v1.1.0** — Sans cette intégration, les tests automatisés ne couvrent pas la nouvelle activité, créant une régression silencieuse.

### 18.1. `tests/test-definitions.js` — examplePrefixMap

**Localisation** : objet `examplePrefixMap` dans `runStep5_ExampleFiles()` (~ligne 270-301).

Ce mapping associe chaque `moduleKey` au préfixe de son fichier d'exemple JSON. Ajouter :

```javascript
'Page': 'page',
'Livre': 'livre',  // ← Nouveau
'Devoir': 'devoir',
```

> **Sans cette ligne** : le test échoue en `[5a.Map] Livre : pas de mapping vers un prefixe d'exemple`.

### 18.2. `tests/test-document-export.js` — ALL_FIXTURES

**Localisation** : tableau `ALL_FIXTURES` (~ligne 90-106).

Ce tableau liste les fixtures à charger pour tester les exports DOCX/ODT/PDF. Ajouter une (ou plusieurs) entrée(s) pour Livre :

```javascript
{ moduleKey: 'Page',            fixture: 'page_1.json' },
{ moduleKey: 'Livre',           fixture: 'livre_1.json' },  // ← Nouveau
{ moduleKey: 'Livre',           fixture: 'livre_2.json' },  // ← Nouveau (avec LaTeX)
{ moduleKey: 'Devoir',          fixture: 'devoir_1.json' }
```

> **Recommandation** : ajouter au moins 2 fixtures par activité pour couvrir un cas simple ET un cas complexe (sous-chapitres, LaTeX, etc.).

### 18.3. Pas de modification de `tests/test-all.html`

Le fichier `tests/test-all.html` itère automatiquement sur les 19+ suites de tests. **Aucune modification n'est nécessaire** : les nouvelles fixtures ajoutées en 18.1 et 18.2 sont prises en compte automatiquement à la prochaine exécution.

### 18.4. Validation Phase 15

- [ ] Ouvrir `tests/test-all.html` dans le navigateur
- [ ] Aucune erreur fatale dans la suite `test-definitions.js`
- [ ] La suite `test-document-export.js` traite bien `Livre` avec ses 2 fixtures
- [ ] La suite `test-i18n.js` confirme que toutes les clés `*_livre_*` existent dans les 11 langues

---

---

## 19. Phase 16 — Qualité pédagogique du prompt IA

> **⚠️ Phase ajoutée en v1.2.0** — Le premier jet du prompt produit en Phase 5 était techniquement correct mais **inadapté aux enseignants** : trop technique, manque d'exemples, sous-chapitres présentés comme une norme plutôt qu'une option.

### 19.1. Cible et contraintes

Le contenu des clés `prompt_*_regles_specifiques`, `prompt_*_structure_json` et `prompt_*_exemple_rendu` est utilisé par **2 publics distincts** :

| Clé | Lu par | Style attendu |
|---|---|---|
| `regles_specifiques` | L'enseignant ET l'IA | **Langage naturel pédagogique** — pas de clés JSON, pas de jargon technique |
| `structure_json` | L'IA uniquement | **Technique et précis** — clés, types, listes exhaustives de blocs |
| `exemple_rendu` | L'IA principalement | **Exemple complet et représentatif** d'un cas d'usage réel |

> **Règle absolue** : la clé `regles_specifiques` **ne doit jamais** mentionner de noms de champs JSON (`title`, `chapters`, `subchapter`...) ni d'identifiants de blocs (`#01_hero_header`...). Tout détail technique est réservé à `structure_json`.

### 19.2. Règles d'écriture pour `regles_specifiques`

**Ce qui est obligatoire** :
1. **Présentation contextuelle** : 1-2 phrases qui expliquent à quoi sert l'activité et quand l'utiliser
2. **Structure attendue** en termes pédagogiques (« 4 à 6 chapitres », « 3 à 6 blocs par chapitre »)
3. **Placeholders Caramel** : `[NOMBRE_ELEMENTS]` doit apparaître pour permettre la personnalisation utilisateur
4. **Règles métier** exprimées en langage naturel (« Le premier chapitre ne peut jamais être un sous-chapitre »)
5. **Exemples concrets de plans** : 3 à 4 plans réels couvrant des disciplines variées (sciences, histoire, maths, lettres)
6. **Mention claire des optionnalités** : « avec parcimonie », « ne les utilise que si... »

**Ce qui est interdit** :
- Noms de champs JSON (`title`, `chapters`, `subchapter`, `blocks`)
- Identifiants techniques de blocs (`#01_hero_header`)
- Vocabulaire de programmation (« tableau d'objets », « booléen »)
- Listes exhaustives de structures techniques

### 19.3. Règles d'écriture pour `exemple_rendu`

**L'exemple doit être** :
1. **Complet et fonctionnel** — un JSON parsable directement utilisable
2. **Représentatif** — couvre les cas typiques (chapitre normal, sous-chapitre éventuel, plusieurs types de blocs)
3. **Pédagogiquement irréprochable** — contenu cohérent avec un programme scolaire réel
4. **Inclut des formules LaTeX** quand l'activité accepte des maths — c'est essentiel pour montrer à l'IA le bon format d'échappement

**Format des formules LaTeX dans le JSON (échappement double)** :
Dans une chaîne JSON, le LaTeX `\(x^2\)` doit être écrit `\\\\( x^2 \\\\)` pour donner après parsing `\\( x^2 \\)` qui sera rendu par MathJax comme `x²`.

**Instruction explicite à l'IA** : ajouter à la fin de l'exemple un rappel comme :
> « Important pour les formules mathématiques : utilise toujours `\\( ... \\)` pour les formules en ligne. Ne jamais écrire `x^2` ou `1/2` en texte brut — toujours en LaTeX comme `\\( x^2 \\)` ou `\\( \\frac{1}{2} \\)`. »

### 19.4. Vérifier que les 11 langues sont fidèles au FR

Le prompt source FR (`prompt_*_regles_specifiques` dans `fr.json`) est la **référence canonique**. Les 10 autres langues doivent être des **traductions fidèles**, pas des versions divergentes.

**Procédure de vérification** :
1. Tout changement majeur du prompt FR doit être propagé immédiatement aux 10 autres langues
2. Utiliser un sous-agent ou un script pour la propagation
3. Vérifier qu'aucune langue ne contient encore l'ancien contenu après modification

**Test rapide** :
```bash
node -e "
const fs = require('fs');
['en','es','de'].forEach(l => {
  const data = JSON.parse(fs.readFileSync('js/locales/'+l+'.json','utf8'));
  console.log('===',l,'===');
  console.log(data.prompt_elea_livre_regles_specifiques.substring(0, 200));
});
"
```

### 19.5. Validation Phase 16

- [ ] La clé `regles_specifiques` est lisible par un enseignant non-technicien (pas de jargon)
- [ ] Aucun nom de champ JSON ni identifiant de bloc dans `regles_specifiques`
- [ ] La clé contient au moins 3 exemples de plans pédagogiques concrets
- [ ] La clé mentionne explicitement quand utiliser ou éviter les éléments optionnels (sous-chapitres, etc.)
- [ ] La clé `exemple_rendu` contient au moins une formule LaTeX correctement échappée
- [ ] Les 11 langues contiennent des **traductions fidèles** du nouveau contenu FR (pas l'ancienne version)
- [ ] Le placeholder `[NOMBRE_ELEMENTS]` est préservé dans toutes les langues
- [ ] Le fichier de référence `assets/data/prompts/elea_livre.md` est aligné avec le contenu réel des locales

---

## Pièges et apprentissages issus de l'implémentation

> **Section ajoutée en v1.1.0** — Documente les erreurs commises pendant l'intégration de Livre pour qu'elles ne se reproduisent pas pour les prochaines activités.

### Piège 1 — Type de champ `boolean` n'existe pas dans l'éditeur

**Symptôme** : un champ `subchapter` configuré avec `type: 'boolean'` affiche **« true » ou « false » en texte brut** (input texte) au lieu d'une case à cocher.

**Cause** : l'éditeur Caramel n'a pas de type `boolean`. Les types valides pour une case à cocher sont :
- `checkbox` — case à cocher classique avec label à droite (le plus simple)
- `toggle` — segmented control multi-options (pas pour un simple booléen, mais pour un choix entre 2-3 valeurs distinctes)

**Solution** : utiliser `type: 'checkbox'`. Exemple :
```javascript
subchapter: {
    type: 'checkbox',  // ← Pas 'boolean' !
    label: 'editor_livre_subchapter',
    hint: 'editor_livre_subchapter_hint'
}
```

**Référence** : registre des types dans [`js/editor/field-renderers.js`](../js/editor/field-renderers.js) — la liste complète est :
`text`, `textarea`, `number`, `select`, `checkbox`, `toggle`, `array`, `object`, `image`, `pageBlockData`, `richtext`, `feedback`, `multiCheckbox`, `dynamicObject`, `rubricGrid`.

> **À ajouter au PRD générique** : créer un tableau de référence des types de champs disponibles pour éviter ce piège lors des prochaines activités.

### Piège 2 — Routage de la preview par `titleKey`

**Symptôme** : la modale de prévisualisation affiche « Preview disponible prochainement » alors que `notification.previewHtml` est correctement défini.

**Cause** : `renderPreview()` dans `notifications.js` route le rendu **par `titleKey`** via une chaîne `else if`. Toute nouvelle activité non explicitement listée tombe dans le fallback générique.

**Solution** : ajouter une branche dans `renderPreview()` (cf. Phase 14.2) **et** créer une fonction `renderXXX` correspondante dans `simulators.js`. Les deux sont indispensables.

> **À ajouter au PRD générique** : phase obligatoire « Preview & simulateur » pour toute nouvelle activité, distincte de la phase de génération.

### Piège 3 — `innerHTML` n'exécute pas les `<script>`

**Symptôme** : un simulateur HTML complexe avec navigation interactive (boutons, onglets) ne réagit pas aux clics quand il est injecté dans la modale de preview.

**Cause** : `element.innerHTML = htmlString` injecte le HTML mais **n'exécute aucun `<script>`** présent dans la chaîne (sécurité du DOM).

**Solutions possibles** :
1. **CSS pur** (pattern radio + label utilisé pour Livre) — recommandé pour les interactions simples
2. **`:target` + ancres** — alternative CSS pure
3. **JS attaché après injection** dans le simulateur (`renderXXX`) — pour les interactions complexes
4. **Iframe avec srcdoc** — overkill mais isolation totale

> **Recommandation** : pour toute interaction dans une preview, **commencer par CSS pur**. N'utiliser du JS que si CSS pur n'est pas suffisant.

### Piège 4 — Indentation visuelle des items dans une liste hiérarchique

**Symptôme** : dans l'éditeur, les sous-chapitres apparaissent au même niveau que les chapitres normaux dans la liste de gauche, sans indication visuelle de leur subordination.

**Solution** : combinaison de 2 modifications :

1. **`array-manager.js`** — ajouter une classe CSS conditionnelle quand l'item a une propriété spécifique :
```javascript
if (item.subchapter === true || item.subchapter === 1) {
    element.classList.add('json-editor__array-item--subchapter');
}
```

2. **`json-editor.css`** — utiliser des **compteurs CSS** pour générer un préfixe lettré (A., B., C., …) qui se réinitialise à chaque chapitre normal :
```css
.json-editor__field--array > .json-editor__array-list {
    counter-reset: subchapter-counter;
}
.json-editor__array-item--subchapter {
    counter-increment: subchapter-counter;
    margin-left: 1.75rem;
    border-left: 3px solid #c7d2fe;
    background: #f5f3ff;
}
.json-editor__array-item--subchapter .json-editor__array-item-title::before {
    content: counter(subchapter-counter, upper-alpha) ". ";
    color: #6366f1;
    font-weight: 700;
}
```

**Bénéfice** : pattern réutilisable pour toute future activité avec hiérarchie. Le compteur CSS se réinitialise naturellement à chaque sibling normal sans logique JS.

> **À ajouter au PRD générique** : section « Patterns CSS avancés pour l'éditeur » avec ce pattern de compteur.

### Piège 5 — Conventions de nommage `elea_*` vs `moodle_*`

**Symptôme** : tentation d'utiliser un préfixe `moodle_*` pour les clés i18n d'une activité Moodle (parce que c'est techniquement Moodle).

**Cause** : cohérence historique du projet — les activités Moodle/Éléa utilisent toutes le préfixe `elea_*` (`elea_page_*`, `elea_devoir_*`, `elea_qcm_*`). Le préfixe `moodle_*` n'existe nulle part dans le projet.

**Solution** : pour toute nouvelle activité Moodle/Éléa, utiliser **systématiquement** le préfixe `elea_*`, que ce soit pour les clés `name`, `description`, `subtitle`, ou les modules dans `definitions.js` (`name: "elea_livre_name"`).

> **À ajouter au PRD générique** : règle de nommage explicite avec convention `elea_{snake_case}_*`.

### Piège 6 — Fonction `buildLivrePreviewHtml` doit recevoir `jsonData` complet

**Symptôme** : initialement écrit comme `buildLivrePreviewHtml(chapters, theme)`, la fonction n'avait pas accès à `jsonData.title`, `jsonData.intro`, `jsonData.numbering` nécessaires pour le rendu fidèle.

**Solution** : passer **l'objet JSON complet** plutôt que des fragments. Signature finale : `buildLivrePreviewHtml(jsonData)`.

> **Règle générale** : les fonctions de rendu de preview doivent recevoir le JSON complet pour rester flexibles. Le découpage en arguments est prématuré tant que les besoins d'affichage ne sont pas figés.

### Piège 8 — **Bug transversal** : les prompts ne se rafraîchissent pas au changement de langue

**Symptôme** : l'utilisateur génère un prompt dans le textarea, change la langue de l'interface via le sélecteur de langue → l'interface se traduit MAIS le textarea du prompt **reste dans la langue d'origine**.

**Cause racine** : la fonction `generatePrompts()` dans `js/services/prompt-generator.js` n'est appelée que :
1. Au clic sur le bouton « Générer le prompt »
2. Lors de l'ouverture d'une activité via `toggleActivityContent()` ([ui.js:388](../js/ui/ui.js#L388))

Elle n'écoute PAS l'événement `caramel:language-changed` dispatché par `loadTranslations()`. Résultat : les textareas cachés `hidden-{promptId}` conservent leur contenu d'origine.

**Solution (déjà appliquée en v1.2.0)** :

1. **`prompt-generator.js`** — ajouter un paramètre `silent` à `generatePrompts()` :
```javascript
export function generatePrompts(silent = false) {
    // ...
    if (!qui && !quoi) {
        if (!silent) {
            showNotification('...', 'error');
        }
        return;
    }
    // ...
}
```

2. **`ui.js`** — brancher le listener `caramel:language-changed` qui appelle `generatePrompts(true)` (silencieux) :
```javascript
window.addEventListener('caramel:language-changed', () => {
    generatePrompts(true);  // silent = true pour ne pas afficher l'erreur "remplir au moins un champ"
});
```

> **Important** : ce bug est **transversal** — il touchait toutes les activités du projet, pas seulement Livre. La correction bénéficie à l'ensemble de Caramel.
>
> **Leçon** : tout système qui consomme des traductions doit explicitement écouter `caramel:language-changed` pour se rafraîchir. Ne JAMAIS supposer que les valeurs sont mises à jour automatiquement.

### Piège 9 — Le fichier `.md` de référence du prompt n'est PAS utilisé en runtime

**Symptôme** : modifier `assets/data/prompts/elea_livre.md` ne change rien au prompt vu par l'utilisateur.

**Cause** : ce fichier `.md` est **purement consultatif/documentaire**. Le runtime utilise les 3 clés `prompt_elea_livre_*` dans les fichiers `js/locales/*.json`.

**Solution** : toute modification du prompt doit être faite **prioritairement dans `fr.json`** (les 3 clés), puis propagée aux 10 autres langues. Le fichier `.md` est mis à jour en parallèle pour garder la documentation cohérente.

> **Convention** : `assets/data/prompts/*.md` est la **référence lisible humaine** du prompt. `js/locales/*.json` est la **vérité runtime**. Les deux doivent rester alignés mais c'est le JSON qui fait foi.

### Piège 7 — Le `previewHtml` doit être ajouté au champ `notification`

**Symptôme** : la fonction `renderLivre(container, data, previewHtml)` reçoit `undefined` comme `previewHtml`.

**Cause** : oubli d'ajouter `previewHtml: previewHtml` dans l'objet de notification créé par `addNotification()` dans `handleLivreCreation()`.

**Solution** : vérifier que **chaque** champ utilisé en aval est explicitement passé :
```javascript
const notifLivre = {
    type: 'mbz',
    title: ...,
    titleKey: 'elea_livre_name',
    moduleKey: 'Livre',
    fileName: ...,
    blob: mbzBlob,
    status: 'success',
    jsonData: jsonData,           // ← Nécessaire pour renderLivre
    originalJsonData: ...,
    previewHtml: previewHtml,      // ← CRITIQUE : sans ça, simulateur vide
    silent: true
};
```

---

## Annexe A — Référence XML `book.xml`

Cette annexe est la **source de vérité** pour le format Moodle attendu, extraite d'une sauvegarde Éléa réelle.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<activity id="33" moduleid="100865" modulename="book" contextid="167140">
  <book id="33">
    <name>Titre du livre</name>
    <intro>&lt;p&gt;Descriptif court du livre&lt;/p&gt;</intro>
    <introformat>1</introformat>
    <numbering>1</numbering>
    <navstyle>1</navstyle>
    <customtitles>0</customtitles>
    <timecreated>1775546745</timecreated>
    <timemodified>1775546809</timemodified>
    <chapters>
      <chapter id="154">
        <pagenum>1</pagenum>
        <subchapter>0</subchapter>
        <title>Titre du chapitre 1</title>
        <content>&lt;p&gt;Contenu HTML du chapitre 1&lt;/p&gt;</content>
        <contentformat>1</contentformat>
        <hidden>0</hidden>
        <timemodified>1775546792</timemodified>
        <importsrc></importsrc>
      </chapter>
      <chapter id="155">
        <pagenum>2</pagenum>
        <subchapter>0</subchapter>
        <title>Titre du chapitre 2</title>
        <content>&lt;p&gt;Contenu HTML du chapitre 2&lt;/p&gt;</content>
        <contentformat>1</contentformat>
        <hidden>0</hidden>
        <timemodified>1775546834</timemodified>
        <importsrc></importsrc>
      </chapter>
      <chapter id="156">
        <pagenum>3</pagenum>
        <subchapter>1</subchapter>
        <title>Sous-chapitre 2.1</title>
        <content>&lt;p&gt;Contenu HTML du sous-chapitre&lt;/p&gt;</content>
        <contentformat>1</contentformat>
        <hidden>0</hidden>
        <timemodified>1775546896</timemodified>
        <importsrc></importsrc>
      </chapter>
    </chapters>
    <chaptertags>
    </chaptertags>
  </book>
</activity>
```

### Champs à connaître

| Champ | Type | Valeurs | Source |
|---|---|---|---|
| `name` | string | Titre du livre | `data.BOOK_NAME` (depuis `jsonData.title`) |
| `intro` | HTML escapé | Présentation courte | `data.INTRO` (depuis `jsonData.intro` formaté) |
| `introformat` | int | `1` (HTML) | hardcoded |
| `numbering` | int | `0`/`1`/`2`/`3` | `data.NUMBERING` (healer default = 1) |
| `navstyle` | int | `0`/`1`/`2` | `data.NAVSTYLE` (healer default = 1) |
| `customtitles` | int | `0`/`1` | `data.CUSTOMTITLES` (healer default = 0) |
| `chapter.id` | int | ID interne | Calculé séquentiellement par `buildChaptersXml` |
| `chapter.pagenum` | int | 1, 2, 3, … | Calculé par `buildChaptersXml` |
| `chapter.subchapter` | int | `0`/`1` | Depuis `chapter.subchapter` JSON |
| `chapter.title` | string | Titre du chapitre | Depuis `chapter.title` JSON |
| `chapter.content` | HTML escapé | Sortie de `generateHtmlFromBlocks` | Composé par `buildChaptersXml` |
| `chapter.contentformat` | int | `1` (HTML) | hardcoded |
| `chapter.hidden` | int | `0` | hardcoded |
| `chapter.importsrc` | string | vide | hardcoded |

---

## Annexe B — Récapitulatif des fichiers modifiés

| # | Fichier | Action | Phase |
|---|---|---|---|
| 1 | `js/core/definitions.js` | Ajouter `moodleModules.Livre` + `customOrder` | 1 |
| 2 | `js/core/translation.js` | Ajouter 3 clés dans `defaultTranslations` | 1 |
| 3 | `js/moodle/processors/activities/Livre.js` | **Créer** le processeur (templates BOOK_*) | 2 |
| 4 | `js/moodle/processors/index.js` | Importer + enregistrer Livre | 2 |
| 5 | `js/moodle/moodle-creator.js` | **Créer** `handleLivreCreation` + `buildChaptersXml` | 3 |
| 6 | `js/main.js` ou `js/ui/ui.js` | Brancher Livre dans le dispatcher de création | 3 |
| 7 | `js/h5p/json-healer.js` | Bloc `if (moduleKey === 'Livre')` | 4 |
| 8 | `assets/data/prompts/elea_livre.md` | **Créer** template prompt | 5 |
| 9 | `assets/data/examples/livre_1.json` | **Créer** exemple simple | 5 |
| 10 | `assets/data/examples/livre_2.json` | **Créer** exemple complexe avec LaTeX | 5 |
| 11 | `js/services/prompt-generator.js` | Ajouter `eleaLivre` à `ACTIVITY_CONFIG` | 5 |
| 12 | `js/services/llm.js` | Ajouter `'Livre': 'gpt-oss-120b'` | 6 |
| 13 | `js/h5p/field-constraints.js` | Ajouter entrées `Livre` + `elea_livre` | 7 |
| 14 | `js/editor/content-detector.js` | Signature + mappings + schéma `elea_livre` | 8 |
| 15 | `js/editor/validators.js` | Cas `Livre` dans `getTypeSpecificErrors` | 8 |
| 16 | `js/locales/fr.json` | ~60 clés (identité, prompts, éditeur, aide) | 9, 11 |
| 17-26 | `js/locales/{en,es,de,it,nl,pt,ar,zh,jp,el}.json` | ~60 clés × 10 langues | 9, 11 |
| 27 | `assets/templates/tutorial_content.html` | Section Livre dans `#choisir` | 9 |
| 28 | `assets/templates/editor-help/elea_livre.html` | **Créer** le popover d'aide | 9 |
| 29 | `js/export/document-formatter.js` | `formatLivre` + extraction `formatPageBlocks` helper | 10 |
| 30 | `assets/images/activities/livre.webp` | **Déjà fourni** — vérifier présence | 12 |

**Total : ~30 fichiers modifiés/créés**, dont 11 fichiers de traduction et 4 fichiers entièrement nouveaux (Livre.js, elea_livre.md, livre_*.json, elea_livre.html).

---

## Annexe C — Réutilisations directes depuis Page

Cette annexe documente **explicitement** ce qui est réutilisé tel quel et ce qui doit être adapté. C'est la garantie de zéro duplication de code.

### Réutilisations directes (aucune modification)

| Composant | Fichier | Pourquoi réutilisable |
|---|---|---|
| `generateHtmlFromBlocks(jsonData)` | `js/moodle/moodle-creator.js:346` | Fonction atomique appelable N fois (1 par chapitre) |
| Les 4 thèmes Page (elea, dsfr, accessible, dynamique) | `js/moodle/page-themes/*.js` | Renderers indépendants du module appelant |
| Le registre `pageBlockSchemas` (18 schémas) | `js/editor/field-renderers.js:1511` | Indexé par `blockType`, pas par moduleKey |
| Le field renderer `pageBlockData` | `js/editor/field-renderers.js:1687` | Accepte n'importe quel `path` |
| Les clés de traduction des 18 blocs | `editor_block_label_*`, `eh_elea_page_block_*` | Identiques entre Page et Livre |
| Tous les templates partagés (`TEMPLATES.*`) | `js/moodle/processors/shared/templates.js` | Course, sections, blocks identiques |
| `buildCourseBackup`, `replacePlaceholders` | `js/moodle/processors/shared/*.js` | Fonctions génériques |

### Adaptations nécessaires

| Composant | Action | Justification |
|---|---|---|
| Templates XML d'activité | **Nouveaux** (`BOOK_XML`, `BOOK_MODULE_XML`, etc.) | Le module Moodle est différent (`book` vs `page`) |
| Pipeline de création | **Nouveau** `handleLivreCreation` | Boucle sur les chapitres + appel multiple à `generateHtmlFromBlocks` |
| Healing | **Nouveau** bloc Livre | Defaults d'affichage + validation séquence chapitres |
| Schéma éditeur | **Nouveau** `elea_livre` | Structure imbriquée `chapters[].blocks[]` |
| Field-constraints | **Nouveau** avec préfixe `chapters[].` | Chemins JSON différents |
| Formateur document | **Nouveau** `formatLivre` | Itération sur chapitres + numérotation |
| Helper `formatPageBlocks` | **Refactoring** | Extrait du corps de `formatPage` pour partage Page/Livre |

### Réutilisations à éviter (anti-patterns)

- ❌ **Ne pas créer de fichier `Livre_modele.html`** : `Page_modele.html` existe déjà comme référence pour les 18 blocs. La structure d'un livre est documentée par ce PRD et l'exemple JSON `livre_1.json`.
- ❌ **Ne pas dupliquer les renderers de blocs** : tous les rendus passent par `generateHtmlFromBlocks` qui appelle les renderers du thème.
- ❌ **Ne pas créer de nouveaux schémas de blocs dans `pageBlockSchemas`** : les 18 blocs sont identiques entre Page et Livre.
- ❌ **Ne pas dupliquer les clés de traduction des blocs** (`eh_elea_page_block_*`) : les copier dans des clés `eh_elea_livre_block_*` créerait de la dette de traduction multipliée par 11.

---

> **Fin du PRD Livre.** Ce document doit être suivi **dans l'ordre** : chaque phase dépend des précédentes. La validation de chaque phase est obligatoire avant de passer à la suivante. En cas de blocage, **mettre à jour ce PRD** avec la solution trouvée pour capitaliser l'expérience.
