---
name: caramel-caramelia
description: Modifier le chatbot flottant Caramelia (extracteur d'intention, mode aide, pilotage DOM Caramel, attachments, RAG tutoriels). À utiliser quand l'utilisateur dit "Caramelia", "chatbot", "extracteur d'intention", "tuto-rag", "actions DOM", "mode aide", ou veut éditer `js/caramelia/`.
---

# Caramelia — Chatbot d'assistance

Référence détaillée : `js/caramelia/ARCHITECTURE.md` (LIRE en priorité). Locales : `js/caramelia/locales/`. Tutos RAG : `js/caramelia/tuto-rag/{lang}.md`.

## Mission

Caramelia accompagne le prof depuis l'idée *"je veux faire un truc sur les nombres décimaux"* jusqu'au téléchargement `.h5p` ou `.mbz`. Elle **ne crée rien elle-même** — elle pilote l'UI Caramel : remplit `#qui`, `#quoi`, `#niveau`, `#nombreQuestions`, ouvre les tuiles, clique sur les boutons "Générer via LLM".

## Architecture (13 modules dans `js/caramelia/`)

| Module | Rôle |
|---|---|
| `index.js` | Bootstrap — point d'entrée, expose `window.Caramelia` en mode debug |
| `config.js` | Constantes, `fuzzyMap`, énumérations, sélecteurs DOM Caramel (~ligne 52) |
| `state.js` | État partagé (conversation, intention en cours, pièces jointes) |
| `i18n.js` | Détection de langue alignée sur Caramel + helper `t()` |
| `dom.js` | Création widget (FAB + panel), messages, checklist d'intention |
| `extractor.js` | Extraction d'intention LLM via balises `<DATA>...</DATA>` |
| `chat.js` | Mode aide (chat libre RAG sur tutoriels) |
| `actions.js` | Pilotage DOM Caramel via `MutationObserver` |
| `flow.js` | Routeur intelligent : aide vs extraction d'intention |
| `attachment.js` | Drag & drop pièces jointes (PDF, image, DOCX) |
| `security.js` | Sanitisation entrées utilisateur |
| `utils.js` | escape HTML, markdown léger, scroll auto |
| `locales/` | 11 langues (fichiers JSON dédiés Caramelia) |
| `tuto-rag/` | Tutoriels markdown par langue (RAG en mode aide) |

## Cycle de vie d'une conversation

```
1. User clique FAB → dom.openPanel()
2. User tape un message → flow.routeMessage(text)
3. flow.js décide : aide ou extraction ?
   - Aide : chat.sendToLLM(text + tuto-rag context) → réponse markdown
   - Extraction : extractor.extractIntent(text) via LLM avec balises <DATA>
4. Si intention → state.intent updated → dom.updateChecklist()
5. Quand intention complète → actions.fillCaramelForm() → actions.openTile() → actions.clickGenerate()
6. Caramel fait son job, Caramelia attend (MutationObserver)
7. Téléchargement déclenché → message de confirmation
```

## Webhook LLM

`config.js` définit l'URL — c'est le **même webhook n8n que Caramel** (`llmdev2`), partagé entre chat libre et extraction d'intention.

## Aligner sur des changements Caramel

Caramelia n'a **aucune autorité** sur Caramel : si Caramel change ses IDs ou sélecteurs, **seuls `actions.js` et `config.js` (~ligne 52)** doivent être touchés. Tout le reste est isolé.

## Cas d'usage typiques

### Ajouter une nouvelle activité au routeur d'intention
Caramelia doit savoir reconnaître "fais-moi un quiz" → tile `MultipleChoice`. Modifier :
1. `config.js` → `fuzzyMap` (ajouter mots-clés → activityKey)
2. `extractor.js` → si nouvelle activité a des paramètres spécifiques

### Ajouter un tuto RAG (mode aide)
1. Créer/éditer `js/caramelia/tuto-rag/fr.md` (référence)
2. Traduire dans les 10 autres langues : `ar.md, de.md, el.md, en.md, es.md, it.md, jp.md, nl.md, pt.md, zh.md`
3. Le mode aide `chat.js` injecte automatiquement les tutos comme contexte LLM

### Modifier les locales Caramelia
Indépendantes des locales Caramel (`js/locales/*.json`). Fichiers : `js/caramelia/locales/{lang}.json`. Mêmes 11 langues.

### Désactiver Caramelia
Retirer du `index.html` :
```html
<script type="module" src="js/caramelia/index.js"></script>
```

## Mode debug

`?debug` dans URL Caramel expose :
- `window.Caramelia.open()` / `close()` / `reset()`
- `window.Caramelia.state` (lecture)
- Logs `[DEBUG][caramelia]` dans console

## Accessibilité (a11y)

- Focus restauré à la fermeture sur l'élément focusé avant ouverture
- `aria-expanded` / `aria-label` synchronisés
- Navigation clavier (Tab, Esc pour fermer)
- Texte alternatif pour avatar et icônes

## Sécurité

`security.js` sanitise les inputs avant injection DOM (préventif XSS via messages utilisateur). Ne pas bypasser.

## Pièges connus

- **`MutationObserver`** : Caramelia attend que la sidebar Caramel soit prête avant de cliquer — si Caramel change la timing/structure, les actions plantent silencieusement → instrumenter `actions.js` avec logs
- **Locales séparées** : ne pas confondre `js/locales/` (Caramel) et `js/caramelia/locales/` (Caramelia) — clés indépendantes
- **`fuzzyMap`** : matching approximatif des activités — trop flexible = mauvais routage, trop strict = utilisateur frustré
- **Webhook partagé** : si Caramel change le format de payload n8n, Caramelia plante aussi
- **Tutos RAG** : si trop longs, dépassent le contexte LLM → préférer plusieurs tutos courts ciblés
- **Imports descendants** : `index → flow → chat/extractor → actions → dom → config/utils` (jamais circulaire)

## Fichiers touchés

```
js/caramelia/{module}.js                [selon la modif]
js/caramelia/locales/{11}.json          [traductions]
js/caramelia/tuto-rag/{11}.md           [RAG aide]
js/caramelia/ARCHITECTURE.md            [si arch change, mettre à jour ce doc]
```
