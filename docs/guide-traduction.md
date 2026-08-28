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

12 fichiers JSON, un par langue :

```
fr.json  en.json  es.json  de.json  it.json  nl.json
pt.json  ar.json  zh.json  jp.json  el.json  br.json
```

Chaque fichier :
- Est un fichier JSON standard (pas de module JS)
- Contient ~2873 cles organisees en sections (separees par des lignes vides)
- Charge via `fetch()` dans `translation.js`
- `fr.json` est la SOURCE DE VERITE : toute cle y existe d'abord, puis est cascadee

Attention : plusieurs outils ne lisent PAS une liste codee en dur mais le CONTENU du
dossier (`caramelLocales()` dans `scripts/lib/h5p-semantics-labels.mjs`). Deposer un
`xx.json` incomplet met donc immediatement `node tests/run_h5p_ui_coverage.mjs` au rouge :
un nouveau fichier se cree TOUJOURS complet (copie de `fr.json`), puis se traduit en place.

### Configuration des langues

Le mapping langue/drapeau est defini dans `languageConfig` a l'interieur de `translation.js` :

```js
const languageConfig = {
  'fr': { name: 'Francais',   code: 'fr'  },
  'en': { name: 'English',    code: 'gb'  },
  'de': { name: 'Deutsch',    code: 'de'  },
  'es': { name: 'Espanol',    code: 'es'  },
  'it': { name: 'Italiano',   code: 'it'  },
  'nl': { name: 'Nederlands', code: 'nl'  },
  'pt': { name: 'Portugues',  code: 'pt'  },
  'ar': { name: 'عربي',       code: 'sa'  },
  'zh': { name: '中文',        code: 'cn'  },
  'jp': { name: '日本語',      code: 'jp'  },
  'el': { name: 'ελληνικά',   code: 'gr'  },
  'br': { name: 'Brezhoneg',  code: 'bzh' }
};
```

Le champ `code` est le suffixe de la classe de drapeau (`class="fi fi-<code>"`), servie par
`css/vendor/flag-icons/7.5.0/`. Ce sont des codes PAYS, pas des codes langue — d'où `en` →
`gb`, `ar` → `sa`, `zh` → `cn`.

`bzh` est la seule exception : flag-icons n'indexe que des codes ISO 3166, et le breton n'a
pas de pays. Le Gwenn ha du est donc un ASSET de Caramel (`assets/images/flags/bzh.svg`),
branche par la regle `.fi-bzh` de `css/base/style.css`. **Ne jamais patcher le dossier
vendor** : il serait ecrase a la prochaine mise a jour de flag-icons.

Le fichier n'est PAS un dessin maison : c'est celui de Wikimedia Commons (auteur
Gryffindor, CC0 / domaine public), repris au caractere pres, la seule modification etant
la `viewBox` ramenee au rapport 4:3 du gabarit. Toute ressource tierce deposee dans
`assets/` doit etre creditee : entree dans `ASSETS_A_MENTION` (`tests/vendor-legal-map.js`),
`<li>` dans `assets/templates/mentions-legales.html`, cle dans les 12 locales. Le controle
`node tests/run_legal_notices.mjs` balaie `assets/images/flags/` et refuse un fichier
non inventorie.

Les CODES de langue (a distinguer du drapeau) vivent dans `js/core/language-codes.js` :
`language` (ISO 639-1 nu, exige par le validateur H5P), `h5p` (avec variante regionale :
`zh` → `zh-cn`), `country` / `bcp47` (exports Word/ODT). C'est la que se corrige le piege
`jp` (cle de locale) → `ja` (code de langue).

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

Checklist etablie a l'ajout du BRETON (`br`, 12e langue, 28-08-2026) — c'est la seule
reference a jour. La langue n'est pas un simple fichier JSON : elle traverse une vingtaine
de points de cablage, dont plusieurs garde-fous qui passent au ROUGE si l'un manque.

L'ordre compte : on cree d'abord les fichiers de contenu COMPLETS (copie de `fr.json`),
sinon les controles echouent des le premier `node tests/run_h5p_ui_coverage.mjs`.

### 1. Contenu — 4 fichiers, tous crees COMPLETS puis traduits en place

| Fichier | Volume | Effet si absent |
|---|---|---|
| `js/locales/<lang>.json` | ~2873 cles | interface, libelles H5P exportes ET prompts LLM |
| `js/caramelia/locales/<lang>.json` | ~151 cles | interface du chatbot (repli `fr` cable) |
| `assets/data/tutorial/<lang>.json` | ~45 Ko | contenu du tutoriel (repli `fr` cable) |
| `js/caramelia/tuto-rag/<lang>.md` | ~17 Ko | base de connaissances envoyee au LLM (repli `fr`) |

```bash
cp js/locales/fr.json                js/locales/<lang>.json
cp js/caramelia/locales/fr.json      js/caramelia/locales/<lang>.json
cp assets/data/tutorial/fr.json      assets/data/tutorial/<lang>.json
cp js/caramelia/tuto-rag/fr.md       js/caramelia/tuto-rag/<lang>.md
```

Trois valeurs doivent etre corrigees AVANT toute traduction, parce qu'elles pilotent le
comportement et pas seulement l'affichage :

- `lang_full_name` dans `js/caramelia/locales/<lang>.json` — nom envoye au LLM pour lui
  dire dans quelle langue repondre. Laisse en francais, Caramelia repond en francais.
- La ligne « Langue : ... » de `prompt_regles_pedagogiques_communes` dans
  `js/locales/<lang>.json` — c'est ce qui fixe la langue du CONTENU genere.
- Le frontmatter `lang:` de `js/caramelia/tuto-rag/<lang>.md` (verifie par
  `tests/test-caramelia.js`, assertion 4.5).

### 2. Cablage — 5 fichiers

1. `js/core/language-codes.js` — entree `<lang>: { language, country, bcp47, h5p }`.
   `language` doit etre le vrai ISO 639-1 (`jp` → `ja` !) : le validateur H5P impose
   `/^[a-z]{1,5}$/` sur `h5p.json:language`.
2. `js/core/translation.js` — entree dans `languageConfig` ; et, si l'anglais n'est pas le
   bon repli pour cette langue, entree dans `BASE_LOCALE` (le breton retombe sur `fr`).
3. `index.html` — `<li><button data-lang="<lang>"><span class="fi fi-<code>"></span>Nom</button></li>`.
4. `js/core/utils.js` — entree dans `TIMELINE_DATE_FORMATS` (ordre jour/mois/annee et
   placeholder localise) ; sans elle, repli silencieux sur le format francais.
5. Drapeau : si flag-icons ne le fournit pas (pas de code ISO 3166), poser un SVG dans
   `assets/images/flags/` + une regle `.fi-<code>` dans `css/base/style.css`. Ne jamais
   patcher `css/vendor/flag-icons/`.

### 3. Services et taxonomies — 5 fichiers

6. `js/caramelia/i18n.js` — `SUPPORTED`.
7. `js/caramelia/extractor.js` — `FIELD_ALIASES` : les traductions probables de `qui`,
   `quoi`, `niveau` (les petits modeles traduisent la CLE du schema JSON).
8. `js/services/rag-orchestrator.js` — lexiques scolaires (`HORS_SCOLAIRE` d'abord, il est
   prioritaire ; puis `ANCRAGE_NIVEAU` / `ANCRAGE_SUJET` / `ANCRAGE_METIER`) et, si la
   langue correspond a un systeme scolaire mappable, une branche dans `detectCycle()`.
   Sans cela, un enseignant travaillant dans cette langue perd l'ancrage programme.
9. `js/sucrerie-bridge/data/taxonomy.js` — `LANGUAGES` (langue de l'activite deposee).
   **Verifier cote aManDe/Sucrerie que le backend accepte le nouveau code** avant
   d'annoncer le depot : la valeur part telle quelle dans le payload.
10. `js/sucrerie-bridge/services/profanity-filter.js` — si LDNOOBW n'a pas de wordlist,
    choisir : alias vers une langue proche (`LANG_ALIAS`) ou repli silencieux assume.

TTS (`js/services/tts.js` `TTS_LANGS` + `js/editor/dictation-tts-panel.js` `LANG_LABELS`) :
n'ajouter la langue QUE si le serveur Piper a une voix pour elle. Sinon la Dictee retombe
proprement sur le francais (`Dictation.js`), ce qui est le comportement voulu.

### 4. Listes de langues codees en dur — 11 fichiers

```bash
grep -rln "'ar', 'zh', 'jp', 'el'\]" tests/ scripts/
```

`tests/{test-i18n,test-legal-notices,test-activity-wiring,test-caramelia,test-performance,test-robustness}.js`,
`tests/run_legal_notices.mjs`, `scripts/{verify-all-locales,check-shared-i18n,update-locale-latex}.mjs`,
plus le `<select>` de `tools/batch-h5p/index.html`. Les `scripts/add-*-locales.mjs` sont des
migrations historiques a usage unique : ne pas les toucher.

Deux tables de langues supplementaires :
- `scripts/lib/h5p-semantics-labels.mjs` — `CARAMEL_TO_H5P_LANGUAGE_FILES`. Si aucune lib
  H5P n'est traduite dans cette langue, mettre un tableau vide et le dire en commentaire.
- `scripts/sync-h5p-ui-labels.mjs` — les blocs `literal:` / `manual:` enumerent les langues
  une par une ; `run_h5p_ui_coverage.mjs` signale les trous.

### 5. Seuils de test a re-baseliser

Une langue de plus, c'est un fichier de plus dans le total : `TOTAL_LOCALES_SIZE` de
`tests/test-performance.js` doit etre releve (le vrai garde anti-bloat est `LOCALE_SIZE`,
par fichier — lui ne bouge pas). Le seuil de taille de `tests/test-i18n.js` etait a 1 Ko
pres du grec : verifier avant d'ajouter.

### 6. Mentions legales

`legal_library_flag_icons` annonce le nombre de langues couvertes par flag-icons : a
reformuler dans les 12 locales si le nouveau drapeau ne vient pas de la bibliotheque.

### 7. Verification

```bash
node scripts/verify-all-locales.mjs      # parite des cles + contraintes LaTeX des prompts
node scripts/check-shared-i18n.mjs       # cles des fichiers PARTAGES avec Sucrerie
node tests/run_h5p_ui_coverage.mjs       # libelles H5P presents dans TOUTES les locales
node tests/run_legal_notices.mjs         # mentions legales x locales
node scripts/auditer-l10n-h5p.mjs        # 0 jeton incoherent, 0 libelle en anglais
node tests/run_browser_suite.mjs         # les 42 suites navigateur
```

Puis un controle visuel : ouvrir `python3 -m http.server 8000`, basculer dans la nouvelle
langue, verifier le drapeau, `document.documentElement.lang` et l'absence d'erreur console.

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
