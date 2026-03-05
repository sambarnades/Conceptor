# Guide du systeme d'internationalisation (i18n) de Caramel

Guide pratique pour les developpeurs souhaitant comprendre, maintenir ou etendre le systeme de traduction de Caramel.

---

## Architecture du systeme i18n

### Module principal : `js/core/translation.js`

Le module exporte les elements suivants :

| Export | Type | Description |
|---|---|---|
| `translations` | `Object` | Dictionnaire cle/valeur de la langue courante |
| `currentLang` | `string` | Code ISO de la langue active (ex: `'fr'`) |
| `t(key)` | `function` | Retourne la traduction pour une cle, ou la cle elle-meme si absente |
| `loadTranslations(lang)` | `async function` | Charge un fichier de langue, met a jour le DOM et emet l'evenement `caramel:language-changed` |
| `translatePage(container?)` | `function` | Parcourt le DOM (ou un conteneur donne) et applique les traductions |
| `initLanguageSwitcher()` | `function` | Active les ecouteurs du selecteur de langue (bouton + dropdown) |

### Traductions par defaut embarquees

Le module contient un objet `defaultTranslations` en francais avec les noms des activites et des onglets. Ces traductions sont disponibles immediatement au chargement de la page, avant le chargement asynchrone du fichier de langue complet. Cela evite un flash de contenu non traduit sur les tuiles.

### Fichiers de langue : `js/locales/`

11 fichiers JSON, un par langue :

```
fr.json  en.json  es.json  de.json  it.json  nl.json  pt.json  ar.json  zh.json  jp.json  el.json
```

Chaque fichier :
- Est un fichier JSON standard (pas de module JS)
- Contient 1651 cles organisees en 156 sections (separees par des lignes vides)
- Charge via `fetch()` dans `translation.js`

### Configuration des langues

Le mapping langue/drapeau est defini dans `languageConfig` a l'interieur de `translation.js` :

```js
const languageConfig = {
  'fr': { name: 'Francais',   code: 'fr' },
  'en': { name: 'English',    code: 'gb' },
  'de': { name: 'Deutsch',    code: 'de' },
  'es': { name: 'Espanol',    code: 'es' },
  'it': { name: 'Italiano',   code: 'it' },
  'nl': { name: 'Nederlands', code: 'nl' },
  'pt': { name: 'Portugues',  code: 'pt' },
  'ar': { name: 'عربي',       code: 'sa' },
  'zh': { name: '中文',        code: 'cn' },
  'jp': { name: '日本語',      code: 'jp' },
  'el': { name: 'ελληνικά',   code: 'gr' }
};
```

Le champ `code` correspond au code pays utilise pour les icones de drapeaux SVG dans `assets/flags/`.

### Flux de chargement

```
1. Page chargee   --> defaultTranslations (FR) appliquees immediatement
2. loadTranslations(lang) appele
3.   --> fetch('js/locales/{lang}.json?v=X.X.X')
4.   --> JSON.parse() de la reponse
5.   --> Fusionne dans l'objet global `translations`
6.   --> translatePage() met a jour le DOM
7.   --> Evenement 'caramel:language-changed' emis
```

---

## Conventions de nommage des cles

### Format general

```
{scope}_{element}_{detail}
```

### Exemples par categorie

| Cle | Scope | Element | Detail |
|---|---|---|---|
| `h5p_timeline_name` | h5p | timeline | name |
| `tab_quiz` | tab | quiz | - |
| `error_parse` | error | parse | - |
| `editor_save_button` | editor | save | button |
| `tuto_step1_title` | tuto | step1 | title |
| `modal_confirm_delete` | modal | confirm | delete |

### Commentaires de section

Deux niveaux de separation dans les fichiers de langue :

```js
// --- Section mineure ---          // ~65 par fichier (sous-sections)
// ============================================================================
// === MODULE MAJEUR ===             // ~120 par fichier (blocs principaux)
// ============================================================================
```

---

## Attributs de traduction dans le HTML

### `data-key`

Attribut principal. `translatePage()` remplace le contenu textuel de l'element :

```html
<h2 data-key="modal_title">Titre par defaut</h2>
<button data-key="editor_save_button">Enregistrer</button>
```

### `data-translate`

Alias de `data-key`, meme comportement exact.

### `data-key-placeholder` / `data-placeholder-key`

Traduit l'attribut `placeholder` d'un champ de saisie :

```html
<input data-key-placeholder="search_placeholder" placeholder="Rechercher...">
```

### `data-tooltip-key`

Traduit l'attribut `data-tooltip` d'un element (infobulles) :

```html
<button data-tooltip-key="tooltip_help" data-tooltip="Aide">?</button>
```

### Acces programmatique

```js
import { t } from './core/translation.js';

const label = t('editor_save_button');  // "Enregistrer" (ou la cle si absente)
```

### Ecouter les changements de langue

```js
window.addEventListener('caramel:language-changed', (e) => {
  console.log('Nouvelle langue :', e.detail.lang);
  // Mettre a jour du contenu genere dynamiquement
});
```

---

## Ajouter une nouvelle langue

### Etapes

1. **Copier le fichier modele** : dupliquer `js/locales/fr.json`

2. **Renommer** en `{lang}.json` (code ISO 639-1 sur 2 lettres, ex: `ko.json`)

3. **Traduire toutes les valeurs** (les cles a gauche du `:` restent inchangees).

5. **Ajouter l'entree dans `languageConfig`** (dans `js/core/translation.js`) :
   ```js
   'ko': { name: '한국어', code: 'kr' },
   ```

6. **Ajouter l'option dans le selecteur** (`index.html`) :
   ```html
   <a href="#" data-lang="ko"><span class="fi fi-kr"></span> 한국어</a>
   ```

7. **Verifier l'icone du drapeau** : les SVG sont dans `assets/flags/4x3/` et `assets/flags/1x1/`.
   Le code pays (`kr`) doit correspondre a un fichier `kr.svg` existant.

---

## Ajouter de nouvelles cles de traduction

### Etapes

1. **Identifier la section** appropriee dans les fichiers de langue (ou creer une nouvelle section si necessaire)

2. **Ajouter la cle dans les 11 fichiers** au meme emplacement :
   ```js
   // Dans fr.js
   new_feature_label: "Nouvelle fonctionnalite",
   // Dans en.js
   new_feature_label: "New feature",
   // ... et ainsi de suite pour les 9 autres langues
   ```

3. **Utiliser la cle** dans le HTML ou le JS :
   ```html
   <span data-key="new_feature_label">Nouvelle fonctionnalite</span>
   ```
   ```js
   const label = t('new_feature_label');
   ```

4. **Si la cle est utilisee pour les tuiles** (noms d'activites, onglets), l'ajouter aussi dans `defaultTranslations` dans `translation.js` pour un affichage instantane.

### Regles importantes

- Toujours ajouter la cle dans **tous** les 11 fichiers, meme si la traduction est temporairement en francais.
- Respecter la convention de nommage `{scope}_{element}_{detail}`.
- Placer la cle dans la bonne section pour maintenir l'organisation du fichier.
- Ne jamais modifier les cles existantes sans mettre a jour les 11 fichiers et tous les `data-key` correspondants dans le HTML.

---

## Fichiers de reference

| Fichier | Role |
|---|---|
| `js/core/translation.js` | Module principal i18n (366 lignes) |
| `js/locales/*.json` | Fichiers de langue JSON (11 fichiers, 1651 cles chacun) |
| `assets/flags/4x3/*.svg` | Icones de drapeaux (format 4:3) |
| `assets/flags/1x1/*.svg` | Icones de drapeaux (format carre) |
| `index.html` | Selecteur de langue (`.language-switcher`) |
