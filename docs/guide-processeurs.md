# Guide de creation des processeurs Caramel

Guide pratique pour developper de nouveaux processeurs H5P et Moodle dans Caramel.

---

## 1. Processeur H5P

### Emplacement et structure

Chaque processeur est un module ES6 dans `js/h5p/processors/`. Il exporte trois constantes et un objet `default` :

```
js/h5p/processors/
  MonType.js          <-- votre processeur
  index.js            <-- routeur central (a modifier)
```

### Exports obligatoires

| Export              | Type     | Description                                    |
|---------------------|----------|------------------------------------------------|
| `machineName`       | `string` | Nom H5P officiel (ex: `"H5P.WordCloud"`)       |
| `version`           | `object` | `{ major: 1, minor: 0 }`                       |
| `extraDependencies` | `array`  | Bibliotheques H5P supplementaires requises      |
| `default.process`   | `function` | `(jsonObj, helpers) => h5pParams`             |

### Export optionnel

| Export                          | Description                                           |
|---------------------------------|-------------------------------------------------------|
| `default.transformForQuizSet`   | `(question) => question` -- adaptation pour QuizSet   |

### Fonctionnement du pipeline

```
JSON brut IA  -->  json-healer  -->  process(jsonObj, helpers)  -->  h5p-creator  -->  .h5p
```

Le **JSON Healer** s'execute AVANT le processeur. Il corrige automatiquement :
- Les caracteres de controle dans les chaines
- L'encapsulation `{ params: ... }` si manquante
- Les versions de bibliotheques H5P incorrectes
- Les formules LaTeX mal echappees

Le processeur recoit donc un JSON deja partiellement assaini.

### Objet `helpers` (utilise principalement par QuizSet)

```js
{
    processChild,         // (question) => question -- traite une sous-question
    getLibraryMetadata,   // (moduleKey) => { machineName, version, extraDependencies }
    getKeyFromLibrary     // (libName) => moduleKey  (ex: "H5P.MultiChoice" => "MultipleChoice")
}
```

### Enregistrement dans index.js

Deux maps a mettre a jour dans `js/h5p/processors/index.js` :

```js
// 1. Import du module
import * as WordCloud from './WordCloud.js';

// 2. Map moduleKey => module
const processors = {
    // ... existants ...
    'WordCloud': WordCloud,
};

// 3. Map machineName H5P => moduleKey (pour la resolution QuizSet)
const libraryToKey = {
    // ... existants ...
    'H5P.WordCloud': 'WordCloud',
};
```

### Exemple complet : processeur fictif `H5P.WordCloud`

```js
// js/h5p/processors/WordCloud.js

/**
 * Processeur H5P -- Nuage de mots
 * @module processors/WordCloud
 */
import { translations } from '../../core/translation.js';
import { formatTextToHtml } from '../../core/utils.js';

// --- Exports obligatoires ---------------------------------------------------

export const machineName = 'H5P.WordCloud';
export const version = { major: 1, minor: 0 };
export const extraDependencies = [
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 }
];

// --- Traitement principal ---------------------------------------------------

export default {
    /**
     * Transforme le JSON brut de l'IA en structure H5P valide.
     *
     * @param {Object} jsonObj - JSON assaini par le JSON Healer.
     *   Exemple attendu de l'IA :
     *   {
     *     "title": "Les capitales d'Europe",
     *     "words": [
     *       { "text": "Paris", "weight": 10 },
     *       { "text": "Berlin", "weight": 8 }
     *     ]
     *   }
     *
     * @param {Object} helpers - Utilitaires (processChild, getLibraryMetadata, etc.)
     * @returns {Object} Structure conforme au schema H5P (semantics.json)
     */
    process: (jsonObj, helpers) => {
        // Valider et normaliser les mots
        const words = (Array.isArray(jsonObj.words) ? jsonObj.words : []).map(w => ({
            text: String(w.text || ''),
            weight: Math.max(1, Math.min(100, Number(w.weight) || 5))
        }));

        return {
            title: formatTextToHtml(jsonObj.title || ''),
            words,
            // Traductions UI
            l10n: {
                title: translations.h5p_wordcloud_title || "Nuage de mots",
                retry: translations.h5p_try_again || "Recommencer"
            },
            // Comportement par defaut
            behaviour: {
                maxWords: 50,
                enableRetry: true
            }
        };
    },

    /**
     * Optionnel : adaptation pour inclusion dans un QuizSet.
     * Le QuizSet passe un objet { library, params, ... }.
     * On modifie question.params en place et on retourne la question.
     */
    transformForQuizSet: (question) => {
        question.params.l10n = {
            title: translations.h5p_wordcloud_title || "Nuage de mots",
            ...question.params.l10n
        };
        return question;
    }
};
```

---

## 2. Processeur Moodle

### Emplacement et structure

```
js/moodle/processors/
  activities/
    MonType.js        <-- votre processeur
  shared/
    templates.js      <-- templates XML communs (TEMPLATES.FILES_XML, etc.)
    placeholder.js    <-- replacePlaceholders(template, data)
    moodle-backup.js  <-- buildCourseBackup(data, moduleName)
  index.js            <-- routeur central (a modifier)
```

### Exports obligatoires

| Export       | Type       | Description                                          |
|--------------|------------|------------------------------------------------------|
| `metadata`   | `object`   | `{ moduleName, moduleVersion, requiredPlaceholders }` |
| `buildFiles` | `function` | `(data, options) => { "chemin/fichier.xml": contenu }` |

### Systeme de placeholders

Les templates XML utilisent la syntaxe `{{NOM}}`. La fonction `replacePlaceholders()` effectue la substitution. Placeholders standards disponibles :

| Placeholder             | Description                      |
|-------------------------|----------------------------------|
| `ACTIVITY_TITLE`        | Titre de l'activite              |
| `COURSE_ID`             | ID numerique du cours            |
| `MODULE_ID`             | ID numerique du module           |
| `SECTION_ID`            | ID de la section                 |
| `ACTIVITY_ID`           | ID de l'activite                 |
| `COURSE_CONTEXTID`      | ID de contexte du cours          |
| `ACTIVITY_CONTEXTID`    | ID de contexte de l'activite     |
| `TIMESTAMP`             | Timestamp Unix                   |
| `BACKUP_DATE`           | Date de sauvegarde (timestamp)   |
| `COURSE_FULLNAME`       | Nom complet du cours             |
| `COURSE_SHORTNAME`      | Nom court du cours               |

### Enregistrement dans index.js

```js
// js/moodle/processors/index.js

import * as MonType from './activities/MonType.js';

const processors = {
    // ... existants ...
    'MonType': MonType,
};
```

### Structure type d'un processeur Moodle

```js
// js/moodle/processors/activities/MonType.js

import { TEMPLATES } from '../shared/templates.js';
import { buildCourseBackup } from '../shared/moodle-backup.js';
import { replacePlaceholders } from '../shared/placeholder.js';

export const metadata = {
    moduleName: 'montype',
    moduleVersion: '2024100700',
    requiredPlaceholders: [
        'ACTIVITY_TITLE', 'COURSE_ID', 'MODULE_ID',
        'SECTION_ID', 'ACTIVITY_ID', 'TIMESTAMP'
        // ... autres placeholders specifiques
    ]
};

const MONTYPE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="{{ACTIVITY_ID}}" moduleid="{{MODULE_ID}}" modulename="montype"
          contextid="{{ACTIVITY_CONTEXTID}}">
  <montype id="{{ACTIVITY_ID}}">
    <name>{{ACTIVITY_TITLE}}</name>
    <timemodified>{{TIMESTAMP}}</timemodified>
  </montype>
</activity>`;

export function buildFiles(data, options = {}) {
    const files = {};
    const activityDir = `activities/montype_${data.MODULE_ID}`;
    const sectionDir = `sections/section_${data.SECTION_ID}`;

    // Fichiers racine communs
    files['moodle_backup.xml'] = buildCourseBackup(data, metadata.moduleName);
    files['files.xml'] = TEMPLATES.FILES_XML;
    files['roles.xml'] = TEMPLATES.ROLES_XML;
    // ... autres fichiers communs ...

    // Fichiers de l'activite
    files[`${activityDir}/montype.xml`] = replacePlaceholders(MONTYPE_XML, data);
    // ... module.xml, grades.xml, inforef.xml, etc.

    return files;
}

export default { metadata, buildFiles };
```

---

## 3. Checklist complete pour un nouveau type

### H5P

- [ ] **definitions.js** -- ajouter une entree dans `h5pModules` avec : `name`, `englishName`, `machineName`, `description`, `image`, `promptId`, `jsonInputId`, `createBtnId`, `categories`, `platforms`, `formats`
- [ ] **Processeur** -- creer `js/h5p/processors/MonType.js` (exports: `machineName`, `version`, `extraDependencies`, `default.process`)
- [ ] **index.js** -- ajouter dans les maps `processors` et `libraryToKey`
- [ ] **Prompt** -- creer le template dans `assets/data/prompts/`
- [ ] **Exemple JSON** -- ajouter dans `assets/data/examples/`
- [ ] **Libs H5P** -- ajouter les fichiers de la bibliotheque dans `js/vendor/h5p-libs/`
- [ ] **Traductions** -- ajouter les cles dans les 11 fichiers `js/locales/*.json` (fr, en, es, de, it, nl, pt, ar, zh, jp, el)

### Moodle

- [ ] **definitions.js** -- ajouter une entree dans `moodleModules`
- [ ] **Processeur** -- creer `js/moodle/processors/activities/MonType.js` (exports: `metadata`, `buildFiles`)
- [ ] **index.js** -- ajouter dans la map `processors`
- [ ] **Prompt** -- creer le template dans `assets/data/prompts/`
- [ ] **Exemple JSON** -- ajouter dans `assets/data/examples/`
- [ ] **Traductions** -- ajouter les cles dans les 11 fichiers de langue

---

## 4. Conseils pratiques

**Formatage HTML** : Utiliser `formatTextToHtml()` de `core/utils.js` sur tout texte affiche dans H5P. Cette fonction convertit le texte brut en HTML propre.

**Traductions UI** : Importer `translations` de `core/translation.js` et toujours fournir une valeur par defaut en francais (`translations.h5p_ma_cle || "Texte par defaut"`).

**Debug** : Ajouter `?debug` dans l'URL pour afficher le JSON brut et le JSON apres healing dans la modale de resultat.

**JSON Healer** : Si l'IA genere systematiquement une structure incorrecte pour votre type, envisager d'ajouter une regle de correction dans `js/h5p/json-healer.js` plutot que de complexifier le processeur.

**Tests rapides** : Coller un JSON d'exemple directement dans le champ de saisie JSON (onglet avance) et cliquer sur le bouton de creation pour tester le processeur sans appeler l'IA.
