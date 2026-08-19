---
name: caramel-add-h5p-activity
description: Intégrer un nouveau type d'activité H5P de A à Z dans Caramel. À utiliser quand l'utilisateur dit "ajouter activité H5P", "nouveau type H5P", "intégrer H5P.X", "support H5P pour ...", ou veut créer un nouveau processeur H5P avec sa tuile, son prompt, ses traductions et son éditeur visuel.
---

# Ajouter une activité H5P

Référence exhaustive : `docs/PRD_NOUVELLE_ACTIVITE_H5P.md` (1876 lignes, 18 phases, lis-le si la tâche est complexe ou si l'activité a des particularités).

## Pipeline cible

```
definitions.js → prompt-generator → llm → json-healer → processors/NewType.js → h5p-creator → .h5p
```

## Checklist d'intégration (11 phases)

### 1. Enregistrement (`js/core/definitions.js`)
- Ajouter entrée dans `h5pModules` avec **tous** les champs : `name` (clé i18n), `englishName`, `machineName` (`H5P.XXX`), `description` (clé i18n), `image` (`assets/images/activities/xxx.webp`), `promptId` (`xxxResultat`), `jsonInputId` (`xxxJsonInput`), `createBtnId` (`createXxxH5P`), `categories`, `platforms`, `formats`, `hidden:false`.
- Insérer la clé dans `customOrder` à la position voulue dans la grille.
- Ajouter défauts français dans `js/core/translation.js` → `defaultTranslations` (rendu instantané avant fetch i18n).

### 2. Processeur (`js/h5p/processors/NewType.js`)
Squelette obligatoire :
```javascript
export const machineName = 'H5P.NewType';
export const version = '1.0.0';
export const extraDependencies = []; // libs H5P additionnelles
export default {
  process(jsonObj, helpers) {
    // 1. Valider jsonObj (champs requis)
    // 2. Transformer vers structure H5P attendue par la lib
    // 3. Retourner { content, dependencies, metadata }
  },
  // Optionnel : transformForQuizSet(question) si l'activité peut servir de sous-question QuizSet
};
```
Helpers fournis : `wrapInParams()`, `getUUID()`, `applyFieldConstraints(field, value, type)`, etc. — voir `docs/guide-processeurs.md`.

**Libellés d'interface — le processeur DOIT tous les écrire.** Un `.h5p` n'embarque pas les
librairies (seulement `content.json` + `h5p.json`), et les `language/*.json` de la lib ne servent
qu'à l'**éditeur** de la plateforme. Sur Éléa, la seule chose traduite est donc ce que le processeur
écrit lui-même. Conséquences :
- tout champ `common: true` de la `semantics.json` **non écrit** repart au défaut **ANGLAIS** ;
- tout champ écrit **en dur** (`checkAnswer: "Vérifier"`) fige une seule langue pour les 11 locales.

Toujours écrire `champ: translations.h5p_xxx || "repli français"`, jamais un littéral nu.

Amorçage : les traductions officielles H5P sont déjà sur disque dans `js/vendor/h5p-libs/<lib>/language/`.
Déclarer les champs dans `LABEL_MAP` de `scripts/sync-h5p-ui-labels.mjs`, puis
`node scripts/sync-h5p-ui-labels.mjs --write` pré-remplit les 11 locales (repli anglais si la lib
ne fournit pas la langue ; `frOverride` pour garder une formulation Caramel existante).

Contrôle : `node tests/run_h5p_ui_coverage.mjs --verbose` doit être **vert sans ajouter d'exclusion**.

### 3. Routeur (`js/h5p/processors/index.js`)
- Ajouter dans `processors` map : `NewType: NewTypeProcessor`
- Ajouter dans `libraryToKey` map : `'H5P.NewType': 'NewType'` (pour lookup inverse QuizSet)

### 4. JSON Healer (`js/h5p/json-healer.js`)
Si l'activité a des spécificités (champs LaTeX particuliers, structure imbriquée, IDs requis), ajouter une branche dans `healJson()` ou utiliser `field-constraints.js`. Souvent rien à faire.

### 5. Field constraints (`js/h5p/field-constraints.js`)
Déclarer le render type de chaque champ texte de l'activité (6 types : `html+latex`, `html`, `unicode`, `unicode+markers`, `plain`, `plain+letters`). Voir skill `caramel-edit-field-constraints`.

> **⚠️ NE PAS DEVINER : le `semantics.json` fait autorité.**
>
> `field-constraints.js` est une déclaration écrite à la main. La vérité de ce qu'un champ
> accepte est dans le `semantics.json` de la bibliothèque H5P, et **rien ne la déduit
> automatiquement**. L'audit 2026-07 a trouvé 15 sur-déclarations et 2 sous-déclarations.
>
> **Avant d'écrire la moindre ligne dans `field-constraints.js`, lancer :**
> ```bash
> node tests/run_semantics_audit.mjs --ecrire          # (re)génère la cartographie
> node tests/run_semantics_audit.mjs --module=<Cle>    # table champ par champ
> ```
> La cartographie descend RÉCURSIVEMENT dans les sous-bibliothèques (`type: library`) —
> indispensable pour les conteneurs, dont le texte vit ailleurs : le contenu d'un point
> d'« Image interactive » n'est pas dans `H5P.ImageHotspots` mais dans `H5P.Text 1.1`.
> Sans cette descente on ne voit que 935 champs sur 6276.
>
> **Règle de lecture d'un champ de semantics :**
>
> | Semantics | Render type Caramel |
> |---|---|
> | `type: text` **+** `widget: "html"` **+** `tags` contenant `strong` | `html` ou `html+latex` |
> | `type: text` **+** `widget: "html"` sans `tags` | idem (toutes balises H5P par défaut) |
> | `type: text` **sans** `widget` | `plain` — **pas** de HTML |
> | champ portant une syntaxe propre (`*mot*` de MarkTheWords/DragTheWords) | `unicode+markers` |
>
> **Deux contrats à ne pas confondre.** Le `semantics.json` dit ce que la PLATEFORME tient
> pour valide ; le JS de la bibliothèque dit ce qui S'AFFICHE. Ils divergent : vérifié en
> aperçu réel, `overallFeedback[].feedback` est déclaré texte brut mais
> `H5P.Question.setFeedback` l'injecte en `.html()` — donc du `<strong>` s'y affiche
> quand même. **Se caler sur le semantics** : le rendu effectif n'est pas garanti après
> validation par une plateforme (Éléa/Moodle).
>
> **Déclarer ne suffit pas — il faut aussi CONVERTIR.** Un champ déclaré `html+latex` dont
> le processeur n'appelle pas `formatTextToHtml()` laisse le `**gras**` de l'IA en
> astérisques à l'écran. C'est exactement le défaut trouvé sur
> `answers[].tipsAndFeedback.*` de MultipleChoice. Après avoir déclaré, vérifier que le
> processeur convertit bien, et le prouver en aperçu (cf. §16).

### 6. Prompt LLM (`assets/data/prompts/NewType.md`)
Template Markdown. Variables interpolées : `{{qui}}`, `{{quoi}}`, `{{niveau}}`, `{{nombreQuestions}}`. Doit produire un JSON valide. Voir skill `caramel-prompts`.

### 7. Exemple JSON (`assets/data/examples/NewType.json`)
Échantillon valide servi en fallback / exemple. Doit traverser le processor sans erreur.

### 8. Lib H5P vendor (`js/vendor/h5p-libs/`)
Copier la structure officielle H5P (dossier avec `library.json`, `semantics.json`, JS, CSS). Doit matcher la version dans `machineName` + `version` du processor.

### 9. Traductions (11 langues) — voir skill `caramel-translations`
Conventions de clés :
- `h5p_{snake}_name`, `h5p_{snake}_description`
- `h5p_{snake}_field_*` pour les champs éditeur
- `prompt_{snake}_*` pour le prompt
- `emergency_h5p_{snake}_*` pour l'aide d'urgence

**Surfaces de découverte (à NE PAS oublier — non couvert par `verify-all-locales`) :** au-delà de ses propres clés, l'activité doit apparaître là où l'utilisateur la découvre :
- **Tutoriel global** : ajouter une entrée `<li><strong>{nom} :</strong> …</li>` dans `tuto_step2_h5p_content` (étape « Choisir une activité ») des **11 `js/locales/*.json`**. Nom repris de `h5p_{snake}_name` ; ponctuation par langue (` :` fr, `：` zh/jp, `:` ailleurs) ; mentionner le flux spécifique éventuel (ex. « joindre une image »). `assets/templates/tutorial_content.html` ne change PAS (il ne fait que référencer les clés `tuto_*`).
- **Tuto-rag de Caramelia** : ajouter une ligne descriptive dans les **11 `js/caramelia/tuto-rag/*.md`** (le chatbot s'en sert pour recommander / guider l'activité). Cf. skill `caramel-caramelia`.
- **Chunks RAG ILaaS de Caramelia** : créer `rag/caramelia/chunks/<lang>/h5p-{slug}.md` dans les **11 langues** (dossier RAG frère du dépôt, cf. CLAUDE.md §RAG ILaaS), sur le modèle des chunks existants du même dossier : front-matter YAML (`referentiel, code, titre, lang, categorie: activite-h5p, breadcrumb, machineName, version`), préfixe `> Contexte :`, libellés UI au char près depuis `js/locales/<lang>.json`. Ajouter aussi la fiche source FR `rag/caramelia/sources/01-activites-h5p/{slug}.md` et mettre à jour `chunks/fr/INDEX.md` + `STATUT.md`. **L'ingestion ILaaS est faite séparément par le mainteneur** (nommage côté ILaaS `<lang>__<code>`, REPLACE = DELETE + INGEST) — ne lancer AUCUN script d'ingestion.
- **Aide d'édition dédiée (optionnel mais recommandé)** : `assets/templates/editor-help/{ModuleKey}.html` (popover « ? » de l'éditeur, chargé par `moduleKey`) + clés `eh_{snake}_*` ×11 ; réutilise les clés partagées `eh_*`. Sans ce fichier, le bouton « ? » n'affiche rien pour l'activité.

### 10. Éditeur visuel JSON
L'éditeur lit `field-constraints.js` automatiquement. Si tu veux des champs custom (image, fieldGroup, toggle, select dynamique), voir skill `caramel-edit-json-editor`.

### 11. Portage Sucrerie (dépôt + aperçu + éditeur + export) — voir skill `caramel-port-to-sucrerie`

⚠️ Les phases 1-10 produisent une activité **Caramel-only**. Pour la rendre déposable / affichable / éditable / exportable dans **Sucrerie** (la bibliothèque), exécuter le skill **`caramel-port-to-sucrerie`** (checklist exhaustive : whitelist dépôt, vendoring lib, i18n éditeur, miroirs, médias, export + table symptôme→cause).

**3 invariants à anticiper DÈS le dev Caramel** (les ignorer = re-travail / bugs silencieux côté Sucrerie) :

1. **Fichiers éditeur + export partagés = BYTE-IDENTIQUES Caramel↔Sucrerie.** `js/editor/{content-detector,field-renderers,…}.js`, `css/components/json-editor.css` **et plusieurs `js/export/*` (dont `document-formatter.js`)** sont dans la liste partagée (test `robustesse` sha256 côté Sucrerie). ⇒ **N'introduis aucune dépendance Caramel-spécifique** dans ces fichiers (ex. import de `json-healer.js` qui n'existe pas côté Sucrerie ; lecture d'un `_backgroundImage` injecté par l'UI). Écris **host-agnostique** ; Sucrerie pull par `cp` puis régénère le manifeste. (cf. CLAUDE.md item 7.) Corollaire export : émettre `{type:'image', url:…}` (PAS `imageData:`) + résoudre le fond via `getAllImages()` en repli.
2. **`denormalizeDataForSave` (content-detector.js) doit produire un `content.json` JOUABLE directement** — `position{}`, nœuds `content[]` complets `{library,params,metadata,subContentId}`, defaults globaux. **Sucrerie n'a PAS de processeur** : la sortie de l'éditeur est écrite telle quelle. Un format intermédiaire « que le processeur Caramel finira » → **aucun contenu en aperçu Sucrerie**. (Si `denormalize` restructure vraiment → ajouter le moduleKey à `H5P_RESTRUCTURING_TYPES`.)
3. **Clés i18n de l'éditeur** (`editor_{x}_*`, `editor_media_*`) à porter dans les 11 `i18n/*.json` Sucrerie — **pas seulement** le nom de tuile `activity_h5p_*`. Sinon l'éditeur Sucrerie affiche les **clés brutes**.

Plus : re-synchroniser la **whitelist dépôt** (`activity-types.js` `CARAMEL_H5P` côté Sucrerie, cf. CLAUDE.md item 8), **vendoriser la lib** dans `vendor/h5p-libs/` de Sucrerie, ajouter l'entrée dans le **`field-constraints.js` Sucrerie** (divergent mais dépendance du richtext).

## Phases optionnelles (selon activité)

- **Images** → skill `caramel-add-image-support`
- **Sous-question QuizSet** → exporter `transformForQuizSet()` + tester dans QuizSetQCM/VF
- **Activité conteneur** (avec exercices filles, comme CoursePresentation, QuizSet) → voir PRD §14b
- **Réglages avancés behaviour** → mapper dans le processor (autoCheck, retry, showSolutions, etc.)
- **Aide d'urgence** : ajouter clés `emergency_*` + entrée dans `js/ui/emergency-notification.js`
- **Asset visuel** : `assets/images/activities/newtype.webp` (ratio carré, ~256×256)

## Validation finale

1. Tuile s'affiche dans la grille avec icône, nom, description traduits
2. Prompt LLM génère un JSON cohérent
3. JSON healer ne casse rien
4. Processor produit un .h5p téléchargeable
5. Le .h5p s'ouvre dans la preview (h5p-standalone)
6. Le .h5p s'ouvre dans Lumi / Moodle / Éléa réel
7. Éditeur JSON visuel charge l'activité sans erreur
8. Toutes les clés i18n sont présentes dans les 11 langues : `node scripts/verify-all-locales.mjs`
8bis. **Libellés d'interface du .h5p** : `node tests/run_h5p_ui_coverage.mjs` est vert **sans
    nouvelle exclusion**. Vérifie que chaque champ `common: true` de la semantics est écrit par
    le processeur, via `translations.*` et non en dur, et que chaque clé employée existe dans les
    11 locales. C'est le seul contrôle qui voie l'anglais résiduel d'une activité française
    (un `.h5p` n'embarque pas les libs — cf. phase 2).
9. Si LaTeX : `node scripts/verify-locale-latex.mjs`
10. Test sous-question QuizSet si applicable
11. **Portage Sucrerie** (phase 11) : côté Sucrerie, `node tests/deposit/test-deposit-validation.js` (anti-dérive whitelist) **et** `node scripts/gen-shared-manifest.mjs --check` (byte-identité des fichiers partagés) passent ; aperçu + édition + export OK en navigateur Sucrerie.
12. **Surfaces de découverte** : l'activité figure dans le **tutoriel global** (`tuto_step2_h5p_content`, 11 langues), le **tuto-rag Caramelia** (`js/caramelia/tuto-rag/*.md`) **et** les **chunks RAG ILaaS** (`rag/caramelia/chunks/<lang>/h5p-{slug}.md`, 11 langues — ingestion faite à part par le mainteneur). Aide d'édition `assets/templates/editor-help/{ModuleKey}.html` présente si fournie.
13. **Conformité au semantics** : `node tests/run_semantics_audit.mjs` ne signale pour la
    nouvelle activité ni SUR-DÉCLARÉ ni SOUS-DÉCLARÉ (ou l'écart est justifié en commentaire
    dans `field-constraints.js`).
14. **Le gras survit à l'aller-retour éditeur.** Un champ déclaré riche doit rendre le MÊME
    résultat qu'on passe ou non par l'éditeur. Le piège : `normalizeDataForEditor` peut
    transformer un champ PLAT (Markdown venu de l'IA) en bloc STRUCTURÉ et supprimer le champ
    plat — le processeur ne voit alors plus que le bloc structuré, dont le chemin se contente
    souvent d'assainir. C'est ainsi qu'« Image interactive » a publié des `**gras**` visibles
    pendant des mois. Vérifier :
    ```js
    A = process(fixture)
    B = process(denormalizeDataForSave(normalizeDataForEditor(fixture)))
    // A et B doivent contenir le même nombre de <strong>, et B aucun ** résiduel
    ```
15. **Preuve en aperçu réel**, et pas seulement dans le JSON : construire l'activité par
    `packageActivity()`, la charger dans `H5PManager`, et vérifier dans le DOM rendu que le
    `<strong>` est présent **et** que son `font-weight` calculé est gras. C'est le seul
    contrôle qui distingue « le HTML est dans le content.json » de « le HTML s'affiche ».

## Fichiers touchés (récap)

```
js/core/definitions.js
js/core/translation.js
js/h5p/processors/NewType.js              [NOUVEAU]
js/h5p/processors/index.js
js/h5p/json-healer.js                     [si nécessaire]
js/h5p/field-constraints.js
assets/data/prompts/NewType.md            [NOUVEAU]
assets/data/examples/NewType.json         [NOUVEAU]
assets/images/activities/newtype.webp     [NOUVEAU]
js/vendor/h5p-libs/H5P.NewType-x.y/...    [NOUVEAU]
js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json   (clés activité + entrée tutoriel `tuto_step2_h5p_content`)
js/caramelia/tuto-rag/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.md   [surface de découverte]
rag/caramelia/chunks/{11 langues}/h5p-newtype.md   [NOUVEAU — chunks RAG ILaaS, hors dépôt ; + fiche source FR + INDEX/STATUT]
assets/templates/editor-help/NewType.html [NOUVEAU, optionnel — popover « ? » de l'éditeur]
```

## Pièges connus

- **Versions H5P** : `version` dans le processor DOIT matcher la version du dossier `vendor/h5p-libs/`. Le healer corrige certaines erreurs mais pas toutes.
- **`extraDependencies`** : oublier une dépendance H5P (ex: `H5P.Image`, `H5P.AdvancedText`) casse le rendu sans erreur explicite — vérifier dans la console du navigateur lors du test preview.
- **`promptId` / `jsonInputId` / `createBtnId`** : doivent matcher EXACTEMENT les IDs DOM générés par `ui.js` à partir de `englishName`. Toute incohérence → boutons morts.
- **Catégories** : utiliser celles existantes (`quiz`, `memory`, `text`, `h5p`) sinon le filtre ignore.
- **Si l'activité est imbricable dans QuizSet** : implémenter `transformForQuizSet()` ET ajouter `'H5P.NewType': 'NewType'` dans `libraryToKey` côté `processors/index.js`.
- **Sucrerie (dépôt jumeau)** : toute évolution d'un fichier éditeur/export **partagé** (`js/editor/*`, `css/components/json-editor.css`, plusieurs `js/export/*` dont `document-formatter.js`) doit rester **host-agnostique** — pas de dépendance Caramel-only. Sinon le test `robustesse` sha256 de Sucrerie casse et l'activité ne s'édite/exporte pas correctement. L'éditeur Sucrerie écrivant le `content.json` **sans processeur**, `denormalizeDataForSave` doit produire une forme **jouable**. Voir **phase 11** + skill `caramel-port-to-sucrerie`.
