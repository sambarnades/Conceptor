---
name: caramel-add-moodle-activity
description: Intégrer un nouveau type d'activité Moodle/Éléa (.mbz) dans Caramel. À utiliser quand l'utilisateur dit "ajouter activité Moodle", "nouveau module Éléa", "intégrer mod_X", "support Moodle pour ...", ou veut créer un nouveau processeur Moodle avec sa tuile, son prompt et ses traductions.
---

# Ajouter une activité Moodle/Éléa

Référence détaillée : `docs/PRD_NOUVELLE_ACTIVITE_LIVRE.md` (modèle Livre, transposable).

## Pipeline cible

```
definitions.js → prompt-generator → llm → moodle/processors/activities/NewType.js → moodle-creator.js → .mbz
```

## Caractéristiques Moodle vs H5P

- Sortie = archive `.mbz` (TAR.GZ Moodle backup) au lieu de `.h5p` (ZIP)
- API processor : `getActivityFiles(activityKey, data, options)` → objet `{ filePath: fileContent }`
- **Aucun appel réseau** dans les processors (génération 100% locale)
- Système de placeholders : `ACTIVITY_TITLE`, `COURSE_ID`, `MODULE_ID`, `TIMESTAMP` injectés par `generateBaseData(title)`
- 7 activités existantes : Appariement, QCM, Page, Millionnaire, Test, Glossaire, Devoir, Livre

## Checklist d'intégration

### 1. Enregistrement (`js/core/definitions.js`)
Ajouter entrée dans `moodleModules` (mêmes champs que H5P, mais `formats: ["MBZ"]` ou autre selon le cas, `platforms: ["Éléa", "Moodle"]`).

### 2. Processeur (`js/moodle/processors/activities/NewType.js`)
```javascript
export const metadata = {
  moduleName: 'newtype',           // nom Moodle (mod_newtype)
  moduleVersion: '2024xxxxxx',     // version plugin
  requiredPlaceholders: ['ACTIVITY_TITLE', 'COURSE_ID', 'MODULE_ID', 'TIMESTAMP', /*...*/]
};

export function getFiles(data) {
  // data = JSON validé venant du LLM
  return {
    'activities/newtype_42/newtype.xml': '<?xml version="1.0"?>...',
    'activities/newtype_42/module.xml': '...',
    'activities/newtype_42/inforef.xml': '...',
    'activities/newtype_42/roles.xml': '...',
    // etc. — voir un Moodle backup réel pour la structure complète
  };
}
```

### 3. Routeur (`js/moodle/processors/index.js`)
Ajouter dans `processors` map. L'API publique reste `getActivityFiles(activityKey, data, options)`.

### 4. Templates partagés (`js/moodle/processors/shared/`)
- `templates.js` : si tu as des XML répétitifs (grade_items, completion, etc.)
- `placeholder.js` : pour ajouter de nouveaux placeholders globaux
- `moodle-backup.js` : NE PAS toucher sauf raison majeure (orchestre l'archive complète)

### 5. Prompt + exemple
Comme H5P : `assets/data/prompts/NewType.md` + `assets/data/examples/NewType.json`.

### 6. Traductions (11 langues)
Voir skill `caramel-translations`. Conventions de clés :
- `moodle_{snake}_name`, `moodle_{snake}_description`
- `prompt_{snake}_*`
- `emergency_moodle_{snake}_*` si aide d'urgence

**Surfaces de découverte (à NE PAS oublier — non couvert par `verify-all-locales`) :** au-delà de ses propres clés, l'activité doit apparaître là où l'utilisateur la découvre :
- **Tutoriel global** : ajouter une entrée `<li><strong>{nom} (FORMAT) :</strong> …</li>` dans `tuto_step2_elea_content` (section Éléa/Moodle de l'étape « Choisir une activité ») des **11 `js/locales/*.json`**. Suffixer le format comme les voisines (`(MBZ)`, `(XML)`, `(MBZ / HTML)`…) ; ponctuation par langue (` :` fr, `：` zh/jp, `:` ailleurs). `assets/templates/tutorial_content.html` ne change PAS (il ne fait que référencer les clés `tuto_*`).
- **Tuto-rag de Caramelia** : ajouter une ligne descriptive dans les **11 `js/caramelia/tuto-rag/*.md`** (le chatbot s'en sert pour recommander / guider l'activité). Cf. skill `caramel-caramelia`.
- **Aide d'édition** : `assets/templates/editor-help/{moduleKey}.html` (popover « ? » de l'éditeur ; ex. `elea_qcm.html`) + clés `eh_{snake}_*` ×11 — déjà en place pour les activités Éléa existantes, à reproduire.

### 7. Asset visuel
`assets/images/activities/newtype.webp`

## Comment construire les XML Moodle ?

1. **Crée l'activité à la main dans un Moodle/Éléa de test** → exporte un backup `.mbz`
2. `tar -xzf backup.mbz -C /tmp/ref/` pour extraire
3. Inspecte `activities/newtype_*/` — copie la structure des XML
4. Substitue les valeurs concrètes par tes placeholders
5. Construis ton processor pour générer ces XML depuis le `data` JSON

## Page Moodle (cas spécial)

Le module `Page` (mod_page) supporte des thèmes visuels. Voir skill `caramel-page-theme`.

## Validation finale

1. Tuile affichée et fonctionnelle
2. Prompt → JSON → processor → `.mbz` téléchargé
3. Le `.mbz` s'importe SANS ERREUR dans Moodle/Éléa réel
4. L'activité s'affiche correctement, fonctionne pour l'élève
5. 11 traductions OK : `node scripts/verify-all-locales.mjs`
6. Test backup → restore (rountrip) si possible
7. **Surfaces de découverte** : l'activité figure dans le **tutoriel global** (`tuto_step2_elea_content`, 11 langues) **et** le **tuto-rag Caramelia** (`js/caramelia/tuto-rag/*.md`) ; aide d'édition `editor-help/{moduleKey}.html` présente.

## Pièges connus

- **Encodage XML** : tout texte utilisateur doit passer par `escapeXml()` (sinon `<`, `>`, `&` cassent l'archive)
- **MODULE_ID / COURSE_ID** : doivent être uniques et cohérents entre les fichiers (`module.xml`, `inforef.xml`, etc.)
- **`completion`, `grade_items`** : Moodle plante silencieusement si les XML manquants — copie depuis un backup réel
- **Versions plugin** : `moduleVersion` doit correspondre à une version installée sur la plateforme cible (Éléa = version Éléa, pas vanilla Moodle)
- **`Page_modele.html`** dans le dossier processor : modèle HTML de fallback pour mod_page, ne pas supprimer
- **Liste des activités existantes** : `js/moodle/processors/activities/` contient `Appariement.js, Devoir.js, Glossaire.js, Livre.js, Millionnaire.js, Page.js, QCM.js, Test.js` — s'inspirer
