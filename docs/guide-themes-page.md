# Guide de creation des themes visuels pour l'activite Page

Guide pratique pour developper de nouveaux themes visuels pour l'activite Page (Moodle/Elea) dans Caramel.

---

## Table des matieres

1. [Architecture du systeme de themes](#1-architecture-du-systeme-de-themes)
2. [Interface d'un theme](#2-interface-dun-theme)
3. [Le contexte `ctx`](#3-le-contexte-ctx)
4. [Les 18 types de blocs](#4-les-18-types-de-blocs)
5. [Etapes pour creer un nouveau theme](#5-etapes-pour-creer-un-nouveau-theme)
6. [Contraintes techniques Elea](#6-contraintes-techniques-elea)
7. [Utilitaire `_safeTag(html)`](#7-utilitaire-_safetaghtml)
8. [Exemple minimal : theme Sombre](#8-exemple-minimal--theme-sombre)
9. [Verification](#9-verification)
10. [Checklist rapide](#10-checklist-rapide)

---

## 1. Architecture du systeme de themes

L'activite Page utilise un systeme de themes pour generer du HTML avec des styles visuels differents. Chaque theme est un module ES6 autonome qui sait transformer les 18 types de blocs en elements HTML styles.

### Arborescence des fichiers

```
js/moodle/
  page-themes.js                  --> Registre : importe les themes, exporte getTheme()
  page-themes/
    elea.js                       --> Theme Elea (violet/bleu/orange) -- theme par defaut
    dsfr.js                       --> Theme DSFR (Design Systeme de l'Etat)
  moodle-creator.js               --> Orchestrateur : appelle generateHtmlFromBlocks()
```

### Flux de donnees

```
JSON IA  -->  moodle-creator.js  -->  getTheme(themeId)  -->  theme.renderers[blockType](data, ctx)  -->  HTML inline
                                       |                                                                      |
                                       page-themes.js                                                   empaquete dans .mbz
```

L'orchestrateur (`moodle-creator.js`) :

1. Recupere le theme demande via `getTheme(themeId)` depuis `page-themes.js`
2. Cree un conteneur `<div role="document">` avec le `wrapperStyle` du theme
3. Itere sur chaque bloc du JSON et appelle le renderer correspondant
4. Injecte `inheritedStyles` sur chaque enfant direct du conteneur
5. Serialise le HTML resultant dans le fichier .mbz

---

## 2. Interface d'un theme

Chaque theme est un module ES6 qui exporte un objet par defaut avec trois proprietes obligatoires : `id`, `config` et `renderers`.

```javascript
export default {
    // Identifiant unique du theme (correspond a la valeur dans le select de l'editeur)
    id: 'identifiant_unique',

    // Configuration globale du theme
    config: {
        // Style inline du conteneur <div role="document"> englobant toute la page
        wrapperStyle: 'font-family:...; color:...; background:...; padding:...; max-width:1000px; margin:0 auto; line-height:1.65;',

        // Styles herites injectes sur chaque enfant direct pour resister
        // au nettoyage Elea (qui supprime le wrapper englobant)
        inheritedStyles: 'font-family:...; line-height:1.65; color:...;'
    },

    // Un renderer par type de bloc (18 au total)
    renderers: {
        '#01_hero_header':        (data, ctx) => Element,
        '#02_nav_summary':        (data, ctx) => Element,
        '#03_histo_reperes':      (data, ctx) => Element,
        '#04_callout_set':        (data, ctx) => Element,
        '#05_stats_cards':        (data, ctx) => Element,
        '#06_lexique_table':      (data, ctx) => Element,
        '#07_glossary_chips':     (data, ctx) => Element,
        '#08_monuments_grid':     (data, ctx) => Element,
        '#09_figures_comparison': (data, ctx) => Element,
        '#10_table_comparison':   (data, ctx) => Element,
        '#11_definition_box':     (data, ctx) => Element,
        '#12_context_paragraphs': (data, ctx) => Element,
        '#13_monument_sheet_long':(data, ctx) => Element,
        '#14_faq_block':          (data, ctx) => Element,
        '#15_myths_realities':    (data, ctx) => Element,
        '#16_method_image_desc':  (data, ctx) => Element,
        '#17_quote_bilingual':    (data, ctx) => Element,
        '#18_sito_graphy':        (data, ctx) => Element
    }
};
```

### Proprietes detaillees

| Propriete | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Identifiant unique. Doit correspondre a la cle dans `PAGE_THEMES` et a la `value` dans le select de l'editeur. |
| `config.wrapperStyle` | `string` | Style inline applique au `<div role="document">` racine. Definit la police, couleur de base, arriere-plan, padding et largeur max. |
| `config.inheritedStyles` | `string` | Styles reinjectes sur chaque enfant direct. **Obligatoire** pour compenser la suppression du wrapper par Elea. Doit inclure au minimum `font-family`, `line-height` et `color`. |
| `renderers` | `object` | Dictionnaire de 18 fonctions. Chaque cle est un type de bloc (ex: `'#01_hero_header'`). Chaque fonction recoit `(data, ctx)` et retourne un `Element` DOM. |

---

## 3. Le contexte `ctx`

Chaque renderer recoit deux arguments : `data` et `ctx`.

- **`data`** : les donnees du bloc (vient de `block.data` dans le JSON genere par l'IA)
- **`ctx`** : objet partage contenant des utilitaires et des donnees globales

### Proprietes de `ctx`

| Propriete | Type | Description |
|-----------|------|-------------|
| `formatTextToHtml(text)` | `function` | Convertit du texte brut en HTML. Gere le Markdown simple, les formules LaTeX, etc. **Attention** : peut retourner du HTML contenant des `<p>` (voir `_safeTag`). |
| `escapeHtmlTags(text)` | `function` | Echappe les caracteres HTML dangereux (`<`, `>`, `&`, `"`, `'`). A utiliser pour du texte qui ne doit PAS etre interprete comme du HTML. |
| `jsonData` | `object` | Donnees completes de la page (l'integralite du JSON). Utile par exemple pour le fallback du titre dans le hero header : `ctx.jsonData.title`. |

### Exemple d'utilisation dans un renderer

```javascript
function renderDefinitionBox(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0; padding:16px; border-left:4px solid #333;');

    // Titre avec textContent (pas innerHTML) pour la securite
    const h2 = document.createElement('h2');
    h2.setAttribute('style', 'margin:0 0 10px 0; font-size:1.3rem;');
    h2.textContent = data.title || '';
    section.appendChild(h2);

    // Contenu avec formatTextToHtml (peut contenir du Markdown/LaTeX)
    const html = ctx.formatTextToHtml(data.text || '');
    const tag = _safeTag(html);  // 'p' ou 'div' selon le contenu
    const content = document.createElement(tag);
    content.setAttribute('style', 'margin:0;');
    content.innerHTML = html;
    section.appendChild(content);

    return section;
}
```

---

## 4. Les 18 types de blocs

Chaque bloc du JSON a un `type` (ex: `"#01_hero_header"`) et un objet `data` dont la structure depend du type.

| # | Type | `data` attendu | Description |
|---|------|----------------|-------------|
| 01 | `#01_hero_header` | `{ title, subtitle }` | En-tete hero avec titre principal. Le titre doit utiliser `div[role="heading"][aria-level="1"]` et `textContent` (pas `<h1>`, pas `innerHTML`). |
| 02 | `#02_nav_summary` | `{ links: [{ href, text }] }` | Sommaire de navigation. Doit utiliser `<nav role="navigation" aria-label="Sommaire">`. |
| 03 | `#03_histo_reperes` | `{ title, cards: [{ title, text }] }` | Reperes historiques en grille de cartes. |
| 04 | `#04_callout_set` | `{ title, callouts: [{ type, text }] }` | Ensemble de callouts. Types possibles : `objectif`, `savoir`, `alerte`. Le type `alerte` doit avoir `role="alert"`. |
| 05 | `#05_stats_cards` | `{ title, stats: [{ value, label }] }` | Cartes de statistiques avec gros chiffres. |
| 06 | `#06_lexique_table` | `{ title, caption, headers: [], rows: [[]] }` | Tableau avec `<caption>`, `<thead>`, `<tbody>`. |
| 07 | `#07_glossary_chips` | `{ title, chips: [] }` | Liste de mots-cles en chips/tags. |
| 08 | `#08_monuments_grid` | `{ title, cards: [{ img_src, img_alt, caption, title, text }] }` | Grille de fiches illustrees avec images. |
| 09 | `#09_figures_comparison` | `{ title?, left: { img_src, img_alt?, caption }, right: { ... }, text? }` | Comparaison de deux figures cote a cote. |
| 10 | `#10_table_comparison` | (meme que #06) | Tableau de comparaison (reutilise le meme format que #06). |
| 11 | `#11_definition_box` | `{ title, text }` | Encadre de definition. |
| 12 | `#12_context_paragraphs` | `{ title, paragraphs: [] }` | Paragraphes de contexte avec titre. |
| 13 | `#13_monument_sheet_long` | `{ title, content?, img_src?, img_alt?, sections?: [{ subtitle, text }] }` | Fiche longue avec sections ou contenu texte simple. |
| 14 | `#14_faq_block` | `{ title, questions: [{ q, a }] }` | Bloc FAQ avec paires question/reponse. |
| 15 | `#15_myths_realities` | `{ title?, mythsTitle?, realitiesTitle?, items: [{ myth, reality }] }` | Mythes vs Realites en grille 50/50. |
| 16 | `#16_method_image_desc` | `{ title, steps: [], img_src?, img_alt?, caption? }` | Methode illustree avec liste ordonnee et image. |
| 17 | `#17_quote_bilingual` | `{ quote_langue_initiale, quote_langue_arrivee, author? }` | Citation bilingue. Pas de titre `<h2>`. |
| 18 | `#18_sito_graphy` | `{ title, links: [{ href, text }] }` | Sitographie avec liens. |

### Notes sur les types de blocs

- **Bloc #01** : Le titre hero est le titre principal de la page. En fallback, utiliser `ctx.jsonData.title`.
- **Bloc #04** : Le type `alerte` necessite `role="alert"` pour l'accessibilite.
- **Bloc #10** : Partage la meme structure de donnees que #06 (tableau).
- **Bloc #17** : Ce bloc n'a PAS de titre `<h2>`, contrairement aux autres blocs.

---

## 5. Etapes pour creer un nouveau theme

### Etape 1 : Creer le module theme

Creer un fichier `js/moodle/page-themes/monTheme.js`.

Le plus simple est de copier `elea.js` (theme par defaut) et de modifier :
- La palette de couleurs (constantes en haut du fichier)
- Les styles inline de chaque renderer
- La structure HTML si on veut un design vraiment different

Le fichier doit exporter un objet par defaut avec `id`, `config` et `renderers` (voir [section 2](#2-interface-dun-theme)).

**Points importants :**
- Inclure la fonction utilitaire `_safeTag()` (voir [section 7](#7-utilitaire-_safetaghtml))
- Implementer les 18 renderers
- Utiliser uniquement des styles inline (pas de classes CSS)
- Respecter les contraintes Elea (voir [section 6](#6-contraintes-techniques-elea))

### Etape 2 : Enregistrer le theme dans le registre

Dans `js/moodle/page-themes.js`, ajouter l'import du nouveau theme et l'enregistrer dans l'objet `PAGE_THEMES` :

```javascript
import monTheme from './page-themes/monTheme.js';
```

Puis dans l'objet `PAGE_THEMES` :

```javascript
const PAGE_THEMES = {
    elea: eleaTheme,
    dsfr: dsfrTheme,
    monTheme: monTheme    // <-- ajout
};
```

### Etape 3 : Ajouter l'option dans l'editeur

Dans `js/editor/content-detector.js`, chercher le champ `theme` dans le schema `elea_page` (vers la ligne 1470) et ajouter une option :

```javascript
options: [
    { value: 'elea', labelKey: 'editor_page_theme_elea' },
    { value: 'dsfr', labelKey: 'editor_page_theme_dsfr' },
    { value: 'monTheme', labelKey: 'editor_page_theme_monTheme' }  // <-- ajout
]
```

### Etape 4 : Ajouter la traduction

Dans les 11 fichiers de `js/locales/` (fr.json, en.json, etc.), ajouter la cle de traduction apres les cles `editor_page_theme` existantes :

```json
"editor_page_theme_monTheme": "Mon Theme (description courte)",
```

### Resume des fichiers a modifier

| Fichier | Action |
|---------|--------|
| `js/moodle/page-themes/monTheme.js` | **Creer** le module theme (18 renderers) |
| `js/moodle/page-themes.js` | Ajouter l'import et l'entree dans `PAGE_THEMES` |
| `js/editor/content-detector.js` | Ajouter l'option dans le schema `elea_page` |
| `js/locales/*.json` (11 fichiers) | Ajouter la cle `editor_page_theme_monTheme` |

---

## 6. Contraintes techniques Elea

**CRITIQUE** -- Ces regles doivent etre respectees par TOUS les themes pour un rendu correct dans Elea. Le non-respect de ces regles entrainera un affichage casse dans la plateforme.

### 6.1 Pas de classes CSS

Elea supprime les classes CSS. Tous les styles doivent etre **inline** via l'attribut `style="..."`.

```javascript
// INCORRECT -- la classe sera supprimee
element.className = 'hero-title';

// CORRECT -- style inline
element.setAttribute('style', 'font-size:1.8rem; font-weight:700; color:#333;');
```

### 6.2 `inheritedStyles` obligatoire

Elea supprime le wrapper `<div role="document">` englobant. Sans `inheritedStyles`, les enfants directs perdent `font-family`, `line-height` et `color`. L'orchestrateur (`moodle-creator.js`) injecte automatiquement ces styles sur chaque enfant direct.

Le `config.inheritedStyles` doit inclure au minimum :
- `font-family` : la police du theme
- `line-height` : l'interligne (generalement `1.65`)
- `color` : la couleur de texte par defaut

```javascript
config: {
    inheritedStyles: 'font-family:system-ui, -apple-system, sans-serif; line-height:1.65; color:#333;'
}
```

### 6.3 `div[role="heading"][aria-level="1"]` au lieu de `<h1>`

Elea peut reecrire les balises `<h1>`. Pour le titre principal du hero header, utiliser un `<div>` avec les attributs ARIA :

```javascript
// INCORRECT -- Elea peut reecrire <h1>
const heading = document.createElement('h1');
heading.textContent = title;

// CORRECT -- div avec role ARIA
const heading = document.createElement('div');
heading.setAttribute('role', 'heading');
heading.setAttribute('aria-level', '1');
heading.textContent = title;
```

### 6.4 `textContent` pour le titre hero

Pour le titre du hero header, utiliser `textContent` et non `innerHTML` pour resister au nettoyage HTML d'Elea :

```javascript
// INCORRECT -- innerHTML peut etre nettoye
heading.innerHTML = title;

// CORRECT -- textContent resiste au nettoyage
heading.textContent = title;
```

### 6.5 Detection `<p>` imbriques avec `_safeTag()`

`formatTextToHtml()` peut produire du HTML contenant des `<p>`. Si le renderer enveloppe le resultat dans un `<p>`, on obtient `<p><p>...</p></p>` (HTML invalide). Utiliser `_safeTag()` pour choisir le bon conteneur (voir [section 7](#7-utilitaire-_safetaghtml)).

```javascript
// INCORRECT -- risque de <p><p>...</p></p>
const p = document.createElement('p');
p.innerHTML = ctx.formatTextToHtml(data.text);

// CORRECT -- _safeTag choisit 'div' ou 'p' selon le contenu
const html = ctx.formatTextToHtml(data.text);
const el = document.createElement(_safeTag(html));
el.innerHTML = html;
```

### 6.6 Forcer les couleurs avec `-webkit-text-fill-color`

Elea injecte des regles CSS qui peuvent ecraser les couleurs inline, meme avec `!important`. Pour les textes blancs sur fond fonce (hero header, en-tetes de tableau, etc.), utiliser `-webkit-text-fill-color` en complement de `color` :

```javascript
// INCORRECT -- Elea peut ecraser la couleur
element.setAttribute('style', 'color:#ffffff !important;');

// CORRECT -- double declaration pour resister a Elea
element.setAttribute('style', 'color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;');
```

**Regles :**
- Tout texte clair (blanc, gris clair) sur fond fonce necessite `-webkit-text-fill-color`
- Les deux proprietes (`color` et `-webkit-text-fill-color`) doivent avoir la meme valeur
- Toujours ajouter `!important` aux deux proprietes

### 6.7 Images

Elea peut ajouter `class="img-fluid"` aux images automatiquement. Ne pas compter sur ce comportement -- les styles de dimensionnement doivent etre inline sur l'image elle-meme :

```javascript
const img = document.createElement('img');
img.setAttribute('src', data.img_src);
img.setAttribute('alt', data.img_alt || '');
img.setAttribute('style', 'max-width:100%; height:auto; display:block;');
```

### 6.8 `<caption>` de tableau

Forcer les styles sur `<caption>` car Elea peut les remplacer par ses propres styles :

```javascript
const caption = document.createElement('caption');
caption.setAttribute('style', 'caption-side:top; font-weight:700; padding:8px; text-align:left;');
caption.textContent = data.caption;
```

---

## 7. Utilitaire `_safeTag(html)`

Fonction essentielle a inclure dans **chaque** theme :

```javascript
/**
 * Detecte si le HTML contient des <p> et retourne le bon tag conteneur.
 * Evite l'imbrication invalide <p><p>...</p></p>.
 *
 * @param {string} html - Le HTML produit par formatTextToHtml()
 * @returns {string} 'div' si le HTML contient des <p>, sinon 'p'
 */
function _safeTag(html) {
    return /<p[\s>]/i.test(html) ? 'div' : 'p';
}
```

### Pourquoi c'est necessaire

`ctx.formatTextToHtml(text)` peut retourner du HTML contenant des balises `<p>`. Si le renderer enveloppe ce resultat dans un element `<p>`, on obtient :

```html
<!-- HTML invalide : <p> imbrique dans <p> -->
<p><p>Premier paragraphe</p><p>Deuxieme paragraphe</p></p>
```

Avec `_safeTag()`, on utilise `<div>` comme conteneur quand le contenu contient des `<p>` :

```html
<!-- HTML valide : <div> contient les <p> -->
<div><p>Premier paragraphe</p><p>Deuxieme paragraphe</p></div>
```

### Utilisation type

```javascript
const html = ctx.formatTextToHtml(data.text || '');
const container = document.createElement(_safeTag(html));
container.setAttribute('style', 'margin:0 0 10px 0;');
container.innerHTML = html;
section.appendChild(container);
```

---

## 8. Exemple minimal : theme Sombre

Voici un squelette complet pour un theme sombre, montrant la structure et les bonnes pratiques.

```javascript
// js/moodle/page-themes/sombre.js
// Theme sombre pour l'activite Page
// Palette : fond #121212, texte #e0e0e0, accent #bb86fc

/**
 * Detecte si le HTML contient des <p> pour eviter l'imbrication invalide.
 */
function _safeTag(html) {
    return /<p[\s>]/i.test(html) ? 'div' : 'p';
}

// --- Renderers ---

function renderHeroHeader(data, ctx) {
    const header = document.createElement('header');
    header.setAttribute('style',
        'margin:0 0 20px 0; background:#1a1a2e !important; ' +
        'color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; ' +
        'padding:32px; border-radius:8px;');

    // Fallback : utiliser le titre global si data.title est vide
    const headerTitle = (ctx.jsonData && ctx.jsonData.title) ? ctx.jsonData.title : data.title;

    // div[role="heading"] au lieu de <h1> (contrainte Elea)
    const heading = document.createElement('div');
    heading.setAttribute('role', 'heading');
    heading.setAttribute('aria-level', '1');
    heading.setAttribute('style',
        'margin:0 0 10px 0; font-size:1.8rem; font-weight:700; ' +
        'color:#ffffff !important; -webkit-text-fill-color:#ffffff !important;');
    // textContent au lieu de innerHTML (contrainte Elea)
    heading.textContent = headerTitle || '';
    header.appendChild(heading);

    if (data.subtitle) {
        const sub = document.createElement('div');
        sub.setAttribute('style',
            'font-size:1.1rem; color:#cccccc !important; ' +
            '-webkit-text-fill-color:#cccccc !important;');
        sub.textContent = data.subtitle;
        header.appendChild(sub);
    }

    // Barre decorative
    const bar = document.createElement('div');
    bar.setAttribute('style',
        'width:60px; height:4px; background:#bb86fc; margin:16px 0 0 0; border-radius:2px;');
    bar.innerHTML = '&nbsp;';
    header.appendChild(bar);

    return header;
}

function renderNavSummary(data, ctx) {
    const nav = document.createElement('nav');
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Sommaire');
    nav.setAttribute('style', 'margin:0 0 20px 0; padding:16px; background:#1e1e2e; border-radius:6px;');

    const h2 = document.createElement('h2');
    h2.setAttribute('style', 'margin:0 0 10px 0; font-size:1.2rem; color:#bb86fc !important; -webkit-text-fill-color:#bb86fc !important;');
    h2.textContent = 'Sommaire';
    nav.appendChild(h2);

    const ul = document.createElement('ul');
    ul.setAttribute('style', 'margin:0; padding:0 0 0 20px; list-style:disc;');
    (data.links || []).forEach(link => {
        const li = document.createElement('li');
        li.setAttribute('style', 'margin:0 0 6px 0;');
        const a = document.createElement('a');
        a.setAttribute('href', link.href || '#');
        a.setAttribute('style', 'color:#bb86fc; text-decoration:underline;');
        a.textContent = link.text || '';
        li.appendChild(a);
        ul.appendChild(li);
    });
    nav.appendChild(ul);

    return nav;
}

function renderContextParagraphs(data, ctx) {
    const section = document.createElement('section');
    section.setAttribute('style', 'margin:0 0 20px 0;');

    if (data.title) {
        const h2 = document.createElement('h2');
        h2.setAttribute('style', 'margin:0 0 10px 0; font-size:1.3rem; color:#bb86fc !important; -webkit-text-fill-color:#bb86fc !important;');
        h2.textContent = data.title;
        section.appendChild(h2);
    }

    (data.paragraphs || []).forEach(para => {
        const html = ctx.formatTextToHtml(para);
        const el = document.createElement(_safeTag(html));
        el.setAttribute('style', 'margin:0 0 10px 0; color:#e0e0e0;');
        el.innerHTML = html;
        section.appendChild(el);
    });

    return section;
}

// ... les 15 autres renderers suivent le meme patron ...
// Chaque renderer cree des elements DOM, applique des styles inline,
// utilise _safeTag() pour le contenu formate, et retourne l'element racine.

export default {
    id: 'sombre',

    config: {
        wrapperStyle: 'font-family:system-ui, -apple-system, "Segoe UI", sans-serif; color:#e0e0e0; background:#121212; padding:28px; max-width:1000px; margin:0 auto; line-height:1.65;',
        inheritedStyles: 'font-family:system-ui, -apple-system, "Segoe UI", sans-serif; line-height:1.65; color:#e0e0e0;'
    },

    renderers: {
        '#01_hero_header':        renderHeroHeader,
        '#02_nav_summary':        renderNavSummary,
        '#03_histo_reperes':      renderHistoReperes,
        '#04_callout_set':        renderCalloutSet,
        '#05_stats_cards':        renderStatsCards,
        '#06_lexique_table':      renderLexiqueTable,
        '#07_glossary_chips':     renderGlossaryChips,
        '#08_monuments_grid':     renderMonumentsGrid,
        '#09_figures_comparison': renderFiguresComparison,
        '#10_table_comparison':   renderTableComparison,
        '#11_definition_box':     renderDefinitionBox,
        '#12_context_paragraphs': renderContextParagraphs,
        '#13_monument_sheet_long':renderMonumentSheetLong,
        '#14_faq_block':          renderFaqBlock,
        '#15_myths_realities':    renderMythsRealities,
        '#16_method_image_desc':  renderMethodImageDesc,
        '#17_quote_bilingual':    renderQuoteBilingual,
        '#18_sito_graphy':        renderSitoGraphy
    }
};
```

### Points cles de l'exemple

1. **`_safeTag()`** est defini en haut du fichier et utilise dans tous les renderers qui appellent `formatTextToHtml()`
2. **Le hero header** utilise `div[role="heading"][aria-level="1"]` avec `textContent`
3. **Les couleurs claires** sur fond fonce utilisent toujours `-webkit-text-fill-color` en plus de `color`
4. **Tous les styles sont inline** -- aucune classe CSS n'est utilisee
5. **`inheritedStyles`** reprend la police, l'interligne et la couleur de base du theme

---

## 9. Verification

Apres creation d'un theme, effectuer ces verifications dans l'ordre :

### 9.1 Verification syntaxique

```bash
node -c js/moodle/page-themes/monTheme.js
```

### 9.2 Test de non-regression

Generer une Page **sans selectionner le nouveau theme** (theme Elea par defaut). Verifier que le rendu est identique a avant l'ajout du nouveau theme.

### 9.3 Test du nouveau theme

Generer une Page, ouvrir l'editeur JSON et changer le theme pour `monTheme`. Telecharger le .mbz et verifier le HTML genere.

### 9.4 Test de l'editeur

Ouvrir l'editeur JSON sur une activite Page. Verifier que le champ select "Theme visuel" affiche correctement la nouvelle option.

### 9.5 Test dans Elea

Importer le .mbz dans une instance Elea. Verifier particulierement :
- Les couleurs de texte (surtout texte clair sur fond fonce)
- La police de caracteres (elle doit etre preservee grace a `inheritedStyles`)
- L'interligne
- Les images et tableaux

---

## 10. Checklist rapide

Cocher chaque element avant de considerer le theme comme termine :

- [ ] Module JS cree dans `js/moodle/page-themes/` avec `id`, `config`, `renderers` (18 fonctions)
- [ ] Utilitaire `_safeTag()` inclus dans le module
- [ ] Import ajoute dans `js/moodle/page-themes.js` + entree dans `PAGE_THEMES`
- [ ] Option ajoutee dans `js/editor/content-detector.js` (schema `elea_page`, champ `theme`)
- [ ] Cle de traduction ajoutee dans les 11 fichiers de langue (`js/locales/*.json`)
- [ ] Styles 100% inline (aucune classe CSS)
- [ ] `div[role="heading"][aria-level="1"]` avec `textContent` pour le hero header
- [ ] `-webkit-text-fill-color` utilise sur tout texte clair sur fond fonce
- [ ] `_safeTag()` utilise partout ou `formatTextToHtml()` est enveloppe dans un conteneur
- [ ] `inheritedStyles` correctement defini (contient `font-family`, `line-height`, `color`)
- [ ] Verification syntaxique OK (`node -c`)
- [ ] Non-regression du theme Elea par defaut verifiee
- [ ] Rendu du nouveau theme verifie dans le navigateur
- [ ] Select de l'editeur affiche la nouvelle option
