---
name: caramel-page-theme
description: Créer ou modifier un thème visuel pour les Pages Moodle/Éléa (mod_page). À utiliser quand l'utilisateur dit "thème Page Moodle", "ajouter thème page", "page-themes", "design Page Éléa", ou veut éditer `js/moodle/page-themes/`.
---

# Thèmes de Page Moodle/Éléa

Référence : `docs/guide-themes-page.md`. Dossier : `js/moodle/page-themes/`. Registre : `js/moodle/page-themes.js`.

## Vue d'ensemble

Le module `Page` (mod_page) supporte **4 thèmes visuels** côté Caramel. Le LLM produit du contenu structuré (titres, paragraphes, médias, blocs de mise en avant), et le thème transforme cette structure en HTML stylé prêt à être injecté dans le `content` du mod_page.

## Architecture

```
js/moodle/page-themes.js              # Registre (export THEMES = { id: themeModule })
js/moodle/page-themes/
  ├── theme1.js                       # Thème par défaut (ex: minimaliste)
  ├── theme2.js                       # Variante (ex: coloré)
  ├── theme3.js                       # ...
  └── theme4.js                       # ...
js/moodle/processors/activities/Page.js   # Lit le thème choisi et l'applique
```

Chaque thème exporte :
```javascript
export const id = 'theme-name';
export const label = 'theme_page_xxx_label';   // clé i18n
export const preview = 'assets/images/themes/theme-xxx.webp';

export function render(structuredContent) {
  // structuredContent = { sections: [{ title, paragraphs, image, callout, ... }] }
  // Retourne une string HTML prête à injecter dans mod_page.content
  return `<div class="page-theme-xxx">...</div>`;
}

export const css = `
  .page-theme-xxx { ... }   /* CSS inline ou classe — Moodle filtre certains tags */
`;
```

## Ajouter un nouveau thème

### 1. Créer le fichier `js/moodle/page-themes/theme5.js`
- Exporter `id`, `label`, `preview`, `render(content)`, `css`
- Le HTML produit doit être **autonome** (pas de dépendance externe) car Moodle nettoie les `<script>`, `<link>`, etc.

### 2. Enregistrer dans `page-themes.js`
```javascript
import * as theme5 from './page-themes/theme5.js';
export const THEMES = { theme1, theme2, theme3, theme4, theme5 };
```

### 3. Asset preview
`assets/images/themes/theme5.webp` (capture d'écran rendue, ratio 16:9 ~640×360)

### 4. Traductions
Ajouter dans les 11 locales :
- `theme_page_theme5_label`
- `theme_page_theme5_description`

### 5. Sélecteur de thème (UI)
Le sélecteur de thème dans l'éditeur lit `THEMES` automatiquement → preview + label apparaissent.

### 6. Tester
1. Générer une Page via Caramel
2. Sélectionner le thème dans l'éditeur
3. Régénérer → télécharger le `.mbz`
4. Importer dans Moodle/Éléa réel
5. Vérifier le rendu HTML

## Contraintes Moodle

Moodle/Éléa applique un filtre HTML strict sur `mod_page.content` :
- **Autorisés** : `<div>, <p>, <h1-h6>, <a>, <img>, <ul>, <ol>, <li>, <table>, <span>, <strong>, <em>, <br>` + attributs `class`, `style`, `id`, `href`, `src`, `alt`
- **Bloqués** : `<script>`, `<iframe>` (sauf YouTube/Vimeo whitelistées), `<link>`, `<style>` (parfois)
- **CSS** : préférer `style="..."` inline plutôt que `<style>` (pas toujours conservé)

## Pièges connus

- **CSS bloqué par Moodle** : préférer style inline ou injecter via une classe et fournir le CSS hors du HTML (instructions à l'admin Moodle)
- **Images** : si tu uses des images uploadées par l'utilisateur, gérer l'injection via le système d'images Moodle (files, contexthash) — voir `Page.js`
- **Polices custom** : pas chargeables depuis le content — utiliser `font-family` du thème Moodle parent
- **Test rountrip** : ce qui marche dans le navigateur Caramel peut être strippé par Moodle — toujours tester import réel
- **Modèle HTML** : `js/moodle/processors/activities/Page_modele.html` est un fallback minimaliste, ne pas supprimer

## Fichiers touchés

```
js/moodle/page-themes/themeX.js           [NOUVEAU]
js/moodle/page-themes.js                  [registre]
js/moodle/processors/activities/Page.js   [si logique custom]
assets/images/themes/themeX.webp          [NOUVEAU]
js/locales/{11}.json                      [labels + description]
```
