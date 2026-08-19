---
name: caramel-translations
description: Ajouter, modifier ou vérifier des traductions dans les 11 fichiers locales (fr, en, es, de, it, nl, pt, ar, zh, jp, el). À utiliser quand l'utilisateur dit "traduire", "ajouter clé i18n", "data-key", "11 langues", "locale", "manque traduction", "vérifier locales", ou veut éditer les fichiers `js/locales/*.json`.
---

# Traductions multilingues (11 langues)

Référence : `docs/guide-traduction.md`. Fichiers : `js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json` (~2034 clés chacun, 170+ sections).

## Système i18n

- `js/core/translation.js`
  - `defaultTranslations` : objet français inline pour rendu instantané (avant fetch)
  - `loadTranslations(lang)` : fetch `js/locales/{lang}.json`
  - `translatePage()` : applique `data-key` → texte sur tous les éléments DOM
  - `t(key)` : helper programmatique
- HTML : `<button data-key="some_key">Fallback FR</button>`
- JS : `t('some_key')` ou `t('some_key', { count: 3 })` pour interpolation

## Conventions de clés

`{scope}_{element}_{detail}` snake_case.

Scopes courants : `h5p_*` (activités H5P), `moodle_*` (activités Moodle), `tab_*`, `error_*`, `editor_*`, `prompt_*`, `emergency_*`, `caramelia_*`.

Exemples : `h5p_timeline_name`, `tab_quiz`, `error_parse`, `editor_field_question`, `prompt_flashcards_intro`.

## Tâches courantes

### Ajouter une nouvelle clé (à insérer dans les 11 langues)

1. Identifier la section sémantique dans le JSON (recherche dans `fr.json`)
2. Ajouter la clé en français (référence)
3. Traduire dans les 10 autres langues — pour les langues non-latines (ar, zh, jp, el), demander si fait à la main ou si script à utiliser
4. Vérifier : `node scripts/verify-all-locales.mjs`

### Ajouter en masse pour une nouvelle activité

Toutes les clés liées à l'activité X (typiquement 20-50 clés) :
- `h5p_x_name`, `h5p_x_description`
- `h5p_x_field_*` (un par champ éditeur)
- `prompt_x_intro`, `prompt_x_format`, `prompt_x_constraints`, `prompt_x_example`
- `emergency_h5p_x_*` (aide d'urgence)

Workflow recommandé :
1. Ajouter tout dans `fr.json` (référence complète)
2. Pour les langues latines : demander à l'utilisateur s'il préfère traduction LLM ou manuelle
3. Pour ar/zh/jp/el : utiliser les scripts dédiés s'ils existent (`scripts/translate-cp-{ar,zh,jp,el}.mjs` est un exemple pour Course Presentation)
4. Vérifier exhaustivité : `node scripts/verify-all-locales.mjs`

### Corriger une traduction
Modifier juste le fichier locale concerné. Pas besoin de recharger le serveur (fetch dynamique).

## Scripts disponibles

```bash
# Vérifie que toutes les locales ont les mêmes clés que fr.json
node scripts/verify-all-locales.mjs

# Vérifie spécifiquement les contraintes LaTeX dans les prompts
node scripts/verify-locale-latex.mjs

# Propage les directives LaTeX dans les 11 prompts (si field-constraints changé)
node scripts/update-locale-latex.mjs

# Libellés d'interface des activités H5P : pré-remplit les 11 locales depuis les
# traductions OFFICIELLES embarquées dans js/vendor/h5p-libs/<lib>/language/
node scripts/sync-h5p-ui-labels.mjs            # rapport, aucune écriture
node scripts/sync-h5p-ui-labels.mjs --write    # écrit les clés absentes

# Garde-fou : chaque champ traduisible d'une lib est-il écrit par son processeur,
# via translations.* (et non en dur), avec sa clé présente dans les 11 locales ?
node tests/run_h5p_ui_coverage.mjs --verbose

# Traduction Course Presentation (modèles à adapter pour autres activités)
node scripts/translate-course-presentation.mjs        # langues latines
node scripts/translate-cp-ar.mjs                       # arabe
node scripts/translate-cp-zh.mjs                       # chinois
node scripts/translate-cp-jp.mjs                       # japonais
node scripts/translate-cp-el.mjs                       # grec
```

## Pièges connus

- **fr.json est la source de vérité** : si une clé manque, la cascader vers les 10 autres
- **Une clé manquante ne tombe PAS en français par accident — mais elle tombe en anglais.**
  Depuis l'audit langues 2026-08, `loadTranslations()` reconstruit le dictionnaire sur un socle
  `en.json` (`{...defaultTranslations, ...en, ...langue}`) et purge l'ancien contenu. Avant, la
  fusion se faisait **par-dessus** la langue précédente : passer de `fr` à `el` laissait donc du
  français à l'écran, et `defaultTranslations` (français) comblait le reste. Corollaire : une clé
  oubliée dans une locale est désormais **invisible à l'œil** (elle s'affiche en anglais correct)
  → s'appuyer sur `verify-all-locales.mjs`, pas sur une relecture visuelle.
- **Libellés H5P : une clé = un champ de semantics.** Ne pas dupliquer une clé pour la même
  chaîne dans deux activités (les copies divergent en silence) — ex. la Vidéo interactive
  réutilise les clés `h5p_summary_*` du Résumé, puisque c'est la même lib imbriquée.
- **Caractères spéciaux** : JSON strict — échapper `"` en `\"`, `\` en `\\`, conserver les `\(...\)` LaTeX intacts
- **Langues RTL** (arabe `ar`) : pas de traitement spécial CSS au niveau de la chaîne — gérer dans le composant si besoin (`dir="rtl"`)
- **Ordre des sections** : conserver le même ordre dans les 11 fichiers pour faciliter les diff
- **defaultTranslations** dans `translation.js` doit contenir les défauts FR pour les éléments visibles avant fetch (sinon flash de FR brut puis re-render)
- **Interpolation** : `{{var}}` est la syntaxe utilisée — vérifier que les variables sont préservées dans toutes les langues
- **Caramelia** a ses propres locales dans `js/caramelia/locales/` — séparées des locales Caramel
- **Wiki** (`wiki.md`) et `tuto-rag/{lang}.md` sont aussi multilingues mais hors du système JSON i18n

## Fichiers touchés

```
js/locales/{fr,en,es,de,it,nl,pt,ar,zh,jp,el}.json
js/core/translation.js                  [si nouveau défaut FR à ajouter]
js/caramelia/locales/                   [si traduction Caramelia]
js/caramelia/tuto-rag/                  [tutos RAG du chatbot]
```

## Audit rapide

```bash
# Compter les clés par fichier
for f in js/locales/*.json; do echo "$f: $(grep -c '":' $f)"; done

# Trouver les clés manquantes (ex: dans en.json par rapport à fr.json)
node -e "
const fr = require('./js/locales/fr.json');
const en = require('./js/locales/en.json');
const missing = Object.keys(fr).filter(k => !(k in en));
console.log(missing);
"
```
