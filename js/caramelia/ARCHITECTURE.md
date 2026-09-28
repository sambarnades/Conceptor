# Caramelia — Architecture & Méthodologie

> Document de référence pour comprendre, partager et améliorer le chatbot **Caramelia**.
> Lisible sans connaissance préalable du projet : tout ce qu'il faut pour reprendre la main est ici.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Position dans Caramel](#2-position-dans-caramel)
3. [Cartographie des modules](#3-cartographie-des-modules)
4. [Cycle de vie d'une conversation](#4-cycle-de-vie-dune-conversation)
5. [Méthodologie de discussion (le routeur)](#5-méthodologie-de-discussion-le-routeur)
6. [Pipeline d'extraction d'intention](#6-pipeline-dextraction-dintention)
7. [Pont avec le DOM Caramel (actions)](#7-pont-avec-le-dom-caramel-actions)
8. [Pièces jointes (attachment)](#8-pièces-jointes-attachment)
8.bis. [Accessibilité (a11y)](#8bis-accessibilité-a11y)
9. [Internationalisation](#9-internationalisation)
10. [Sécurité](#10-sécurité)
11. [Configuration centrale](#11-configuration-centrale)
12. [Points d'extension](#12-points-dextension)
13. [Pistes d'amélioration](#13-pistes-damélioration)
14. [Glossaire & conventions](#14-glossaire--conventions)

---

## 1. Vue d'ensemble

**Caramelia** est un chatbot flottant intégré à Caramel. Sa mission : faire passer
un enseignant de l'idée *« je veux faire un truc sur les nombres décimaux »* au
téléchargement d'un fichier `.h5p` ou `.mbz`, sans qu'il ait à comprendre la
mécanique du Mode Avancé / des tuiles / du pipeline.

Caramelia ne **crée pas** d'activités elle-même. Elle pilote l'interface Caramel
existante : remplit `#qui`/`#quoi`/`#niveau`/`#nombreQuestions`, ouvre les
tuiles, clique sur les boutons « Générer via LLM ». Tout le pipeline réel
(prompt → LLM → JSON-healer → processors → ZIP/MBZ) reste celui de Caramel.

**Caractéristiques clés :**

- 100 % client-side (ES6 modules, pas de build)
- Webhook n8n unique pour le LLM (chat libre + extraction d'intention)
- 12 langues, alignées sur la langue active de Caramel
- Désactivable : retirer le `<script type="module" src="js/caramelia/index.js">`
- Mode debug : `?debug` dans l'URL → expose `window.Caramelia.{open,close,reset,state}`

---

## 2. Position dans Caramel

```
┌─────────────────────────────────────────────────────────────┐
│                        Caramel (host)                       │
│  ┌───────────────────┐  ┌──────────────────────────────┐    │
│  │ Mode Rapide /     │  │  Tuiles d'activités           │   │
│  │ Mode Avancé       │  │  + sidebar de génération      │   │
│  │ #qui #quoi #niveau│  │  + boutons #generate-llm-X    │   │
│  └───────────────────┘  └──────────────────────────────┘    │
│           ▲                        ▲                        │
│           │ fillFormField()        │ tile.click()           │
│           │                        │ llmBtn.click()         │
│  ┌────────┴────────────────────────┴─────────────────────┐  │
│  │                    CARAMELIA                          │  │
│  │  (FAB + panel flottant en bas à droite)               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Caramelia n'a **aucune autorité** sur Caramel : elle se contente de cliquer
aux bons endroits avec des `MutationObserver` pour attendre que la sidebar
soit prête. Si Caramel évolue (renommage d'IDs, nouveaux sélecteurs), seuls
[`actions.js`](actions.js) et [`config.js`](config.js#L52) doivent être touchés.

---

## 3. Cartographie des modules

Tous les fichiers vivent dans `js/caramelia/`. Une responsabilité par module,
imports descendants (jamais circulaires).

| Fichier | Rôle | Dépend de |
|---------|------|-----------|
| [`index.js`](index.js) | Bootstrap : crée le widget, attache les events, écoute les changements de langue | tout le reste |
| [`config.js`](config.js) | Constantes : version, webhook, catégories, `moduleKeys`, `fuzzyMap`, timing | — |
| [`state.js`](state.js) | État partagé : `isOpen`, `history`, `currentFlow`, `genState`, `elements` | — |
| [`i18n.js`](i18n.js) | Chargement des locales, helper `t()`, `tActivity()` (mappe vers Caramel) | `config`, core/translation |
| [`utils.js`](utils.js) | `esc()`, `md()` (markdown léger : `**gras**`, `*ital*`, `_ital_`, `` `code` ``, listes), `scrollBottom()` | `state` |
| [`security.js`](security.js) | Anti-injection, sanitize, `SECURITY_PREAMBLE`, `fenceUserMessage` | — |
| [`dom.js`](dom.js) | Création du widget, `addBotMessage`, `addUserMessage`, `showTyping`, `addCheckboxList` | `config`, `state`, `utils`, `i18n` |
| [`extractor.js`](extractor.js) | Extraction LLM `<DATA>{…}</DATA>` + fallback regex | `config`, `i18n`, `security` |
| [`chat.js`](chat.js) | Mode aide (chat libre) — communique avec n8n | `config`, `state`, `dom`, `i18n`, `security` |
| [`actions.js`](actions.js) | Pont DOM Caramel : `fillFormField`, `findActivityTile`, `launchGenerations` | `config`, `dom`, `i18n` |
| [`flow.js`](flow.js) | **Cerveau** : orchestre la conversation, `autoRoute`, `proceedAfterCollect` | tout sauf `index` |
| [`attachment.js`](attachment.js) | Drag & drop + bouton trombone → délègue à `window.CaramelOCR` | `state`, `dom`, `i18n` |
| [`locales/*.json`](locales/) | 12 fichiers de traduction (fr, en, es, de, it, nl, pt, ar, zh, jp, el, br) | — |

---

## 4. Cycle de vie d'une conversation

```
                     ┌─────────────────────────┐
                     │  User clique sur le FAB │
                     └────────────┬────────────┘
                                  ▼
            ┌──────────────────────────────────────────┐
            │  toggle() ouvre le panel                 │
            │  syncLocale() recharge si lang a changé  │
            │  showWelcome() (si premier message)      │
            └────────────────────┬─────────────────────┘
                                 ▼
            ┌──────────────────────────────────────────┐
            │  User tape un message → submitInput()    │
            │  sanitizeUserInput() → addUserMessage()  │
            │  handleUserInput(text)                   │
            └────────────────────┬─────────────────────┘
                                 ▼
                  ┌──────────────┴──────────────┐
                  │  state.currentFlow ?        │
                  └──┬───────────────┬──────┬───┘
                     │               │      │
                'help'           'generate' null
                     │               │      │
                     ▼               ▼      ▼
            handleHelpMessage  handleGenerate  smartRoute
              (chat libre)        Step          (extraction
                                  (étape         LLM + route)
                                  en cours)
```

**Routage v1.1 — mode AUTO unifié.** Tout message libre passe par `autoRoute()`
(un seul appel webhook, `intent: 'auto'`, RAG-ancré côté n8n). C'est le **LLM**
qui décide à chaque tour, plus aucune regex côté client :

- **question / info / conseil** → il répond en texte (mode A) ;
- **demande de création explicite** → il émet un bloc `<DATA>{…}</DATA>` (mode B),
  que le client détecte (`parseDataBlock` + `isMeaningfulIntent`) pour enchaîner
  sur le flow de génération.

`state.currentFlow` ne sert plus qu'à une chose : si `'generate'` **et** qu'une
étape guidée est en cours (`genState.step`), le message est traité localement
(réponse à `qui`/`quoi`/`niveau`/catégorie/activité/url vidéo) sans appel LLM.
Tout le reste → `autoRoute()`.

> Avant v1.1 : le 1er message partait **par défaut** vers l'extraction
> d'intention (= génération), et le mode aide n'était qu'un rattrapage (regex
> `isMetaQuestion` + seuil de confiance). Résultat : une simple question
> (« que deviennent mes données ? », « c'est quoi un QCM ? ») déclenchait à tort
> une génération. Le mode auto inverse cette logique : on répond d'abord, on ne
> génère que sur intention claire — décidée par le LLM, pas par des regex.

Le state se réinitialise via `resetConversation()` (boutons « Retour » des bulles).

---

## 5. Méthodologie de discussion (le routeur)

C'est le cœur de Caramelia. Toute la logique vit dans [`flow.js`](flow.js).

### 5.1 Message libre → `autoRoute()`

```
autoRoute(text)
  ├─ showTyping()                       ← 3 dots dorés pendant l'appel LLM
  ├─ runAutoQuery(text)  (chat.js)      ← 1 appel webhook intent='auto', RAG+schéma
  │     ├─ { kind:'answer', text }      → réponse pédagogique (mode A)
  │     ├─ { kind:'creation', data }    → <DATA> parsé (mode B)
  │     ├─ { kind:'empty' }             → 200 au corps vide, 2 fois de suite
  │     └─ null                         → service injoignable
  ├─ removeTyping()                     ← try/finally → toujours nettoyé
  │
  ├─ answer   → addBotMessage(text) + bouton « Créer une activité »
  ├─ creation → handleCreationIntent(data, text)
  │              ├─ champs Caramel déjà remplis & pas encore demandé ?
  │              │     → « Repartir de là / de zéro ? » (1×/conversation)
  │              └─ mergeAndProceed() → genState + récap → proceedAfterCollect()
  ├─ empty    → help_error_empty + boutons Réessayer / Créer
  └─ null     → fallbackExtract() : si moduleKeys trouvés → création dégradée,
                 sinon message hors-ligne + boutons Réessayer / Créer
```

**Pourquoi un état `empty` distinct (27-08-2026).** Le webhook peut répondre
HTTP 200 avec un corps VIDE : `fetchWithRetry` ne le voit pas (il ne juge que le
statut) et l'utilisateur lisait « Désolé, je n'ai pas pu obtenir de réponse » sur
une demande pourtant comprise — de façon intermittente, d'où la réputation de
chatbot capricieux. La cause était côté n8n (`stop: ['</DATA>']` envoyé au modèle,
qui coupait la génération pendant sa délibération puisque la balise figure dans le
prompt : 5 réponses vides sur 6, mesuré). C'est corrigé serveur, mais le client
retente désormais une fois puis le DIT — sans prétendre que la connexion a échoué,
ce qui envoyait vérifier un réseau qui marchait. Voir `bas/docs/n8n-caramelia-v2/`.

**Décision question vs création :** portée par le LLM (`runAutoQuery` dans
[`chat.js`](chat.js)), pas par des regex. Le client se contente de détecter la
forme de la réponse : un bloc `<DATA>` exploitable (`isMeaningfulIntent`) =
création ; sinon = réponse texte. Un `<DATA>` vide (tous champs null) est traité
comme une réponse (garde-fou contre les misfires du LLM).

**Fusion message ↔ champs Caramel (`mergeAndProceed`) :** le message courant
(extraction LLM) a **toujours priorité** sur les champs `#qui/#quoi/#niveau`
déjà remplis ; les champs DOM ne servent qu'à **combler les trous** (`useDom`).
La question « repartir de là / de zéro ? » n'est posée que si les champs
apportent une info absente du message (et une seule fois par conversation).
Côté serveur, le prompt auto interdit explicitement au LLM d'utiliser
`context.qui/quoi` (état des champs envoyé dans le payload) pour remplir le
`<DATA>` (règle 9). Historique : avant ce double verrou, le récap reprenait
l'ancien contenu des champs au lieu du contexte donné dans le chat — notamment
à la 2ᵉ création d'une même conversation, les champs ayant été remplis par
Caramelia elle-même au tour précédent (bug terrain 2026-07).

**Indicateur de frappe (typing dots) :** affiché par `showTyping()` (dans [`dom.js`](dom.js)), retiré par `removeTyping()`. Couleur dorée (`var(--caramelia-primary)`) avec animation `caramelia-bounce`. Présent partout où un appel LLM bloquant a lieu : `smartRoute` (extraction d'intention) ET `handleHelpMessage` (chat libre). Pas de typing sur les actions synchrones (clic catégorie, validation checklist) ni pendant `launchGenerations` qui a son propre feedback (`launch_progress` par activité).

### 5.2 Le routeur central : `proceedAfterCollect(recap)`

Appelé **chaque fois qu'on enrichit `state.genState`** (smartRoute, ou réponse
à une étape qui/quoi). Il choisit la prochaine étape utile :

```
proceedAfterCollect(recap)
  ├─ !qui  → step='qui',  message = recap + "Dis-moi qui tu es"
  ├─ !quoi → step='quoi', message = recap + "Quel sujet ?"
  ├─ envoyer recap (bulle séparée)
  ├─ besoinClarification présent ?  → buildClarificationButtons()
  ├─ moduleKeys.length === 1        → runGeneration([key])  (récap + confirm)
  ├─ moduleKeys.length > 1          → addCheckboxList(déduits cochés
  │                                     + toute la catégorie + « voir tout »)
  └─ aucun module                   → step='category', boutons catégories
```

**Checklist (v1.1) :** on ne montre plus les seules activités déduites. On
pré-coche les déduites mais on affiche **toute la/les catégorie(s)** concernée(s),
avec un bouton « ➕ Voir toutes les activités » qui révèle le reste
(`addCheckboxList(..., { expandKeys })` dans [`dom.js`](dom.js)). Réponse au
retour terrain « on ne voyait que quelques activités à cocher ».

**Point critique :** ce helper a remplacé la duplication de logique entre
`smartRoute` et `handleGenerateStep`. Le bug historique « la bot redemande le
sujet alors qu'il l'avait déjà extrait » venait de cette duplication.

### 5.3 Étapes du flow guidé

`state.genState.step` ∈ `'qui'` | `'quoi'` | `'category'` | `'activity'`

```
handleGenerateStep(text) :
  case 'qui'      → genState.qui = text;  fillFormField; proceedAfterCollect()
  case 'quoi'     → genState.quoi = text; fillFormField; proceedAfterCollect()
  case 'category' → handleCategorySearch(text)  (texte → match catégorie)
  case 'activity' → handleActivitySearch(text)  (texte → match activité par i18n
                                                  + fuzzyMap fallback)
```

Le flow saute automatiquement les étapes déjà renseignées. Exemple :
*« je veux un QCM de 10 questions sur les fractions pour des CM2 »* → tout est
extrait du premier message, le bot va directement à l'écran de confirmation
de génération.

### 5.4 Confirmation et lancement

Toute génération passe par `runGeneration(moduleKeys)` qui :

1. Vérifie via `ensureRequiredFields()` que `qui` ET `quoi` sont remplis
2. Affiche un **récap explicite** (qui, quoi, niveau, nombre de questions, activités)
3. Trois boutons : `🚀 Lancer` / `✏️ Changer d'activité` / `❌ Annuler`
4. Sur « Lancer » → `doLaunch(moduleKeys)` → `launchGenerations()` (cf. §7)

**Aucune génération ne part sans confirmation explicite de l'utilisateur.**

### 5.5 Bouton ZIP en fin de chaîne (multi-activités)

Quand `doLaunch` traite **2+ activités**, `launchGenerations` retourne les IDs des notifications créées pendant le batch. Le message final affiche alors un bouton **« 📦 Télécharger un ZIP »** qui empaquette ces notifications via `downloadNotificationsAsZip(ids)` (exposé par [`js/ui/notifications.js`](../ui/notifications.js)).

```
doLaunch([key1, key2, key3])
  ├─ batchIds = await launchGenerations(...)         ← IDs collectés via 'notification:added'
  ├─ if (batchIds.length >= 2)
  │     └─ ajout du bouton "Télécharger ZIP" → downloadNotificationsAsZip(batchIds)
  └─ message launch_done + boutons (zip + new + back)
```

Le ZIP ainsi produit est un sous-ensemble strict du batch (pas les notifications antérieures), sous le nom `caramel-pack-N-YYYYMMDDHHMM.zip`. Le même mécanisme reste accessible côté Caramel via le bouton « Tout télécharger » du dropdown (qui empaquette **toutes** les notifications réussies, comportement inchangé).

---

## 6. Pipeline d'extraction d'intention

Vit dans [`extractor.js`](extractor.js). Convertit du texte libre en JSON
structuré utilisable par le routeur.

> **v1.1 — mode auto.** Le schéma ci-dessous n'est plus envoyé via un appel
> dédié `intent:'extract'`. Il est exposé par `buildExtractSchemaBlock()` et
> transmis dans le champ `extractSchema` de l'appel `intent:'auto'`. Le serveur
> n8n l'injecte dans le system prompt et le LLM ne le remplit (bloc `<DATA>`)
> **que** s'il décide que l'utilisateur veut créer une activité. Côté client,
> `parseDataBlock` / `validateSchema` / `isMeaningfulIntent` détectent et
> sécurisent le résultat. L'ancien `extractIntent()` (`intent:'extract'`) reste
> présent pour compat mais n'est plus appelé par le flow.

### 6.1 Schéma cible

```jsonc
{
  "qui": string|null,                  // "prof de maths au collège"
  "quoi": string|null,                 // "les nombres décimaux"
  "niveau": string|null,               // "6e", "CM2", "Seconde"
  "nombreQuestions": number|null,      // 1..50, sinon null
  "moduleKeys": string[],              // enum CONFIG.allModuleKeys
  "plateforme": "H5P"|"Elea"|null,
  "besoinClarification": {             // null si tout est clair
    "champ": "qui"|"quoi"|"plateforme",
    "question": string,                // dans la langue du user
    "options": string[]
  } | null,
  "confiance": number                  // 0..1
}
```

### 6.2 Format de réponse LLM

Le webhook n8n est instable face au XML structuré : on lui demande **uniquement**
de produire `<DATA>{…}</DATA>`, rien avant ni après. Le parser regex extrait le
bloc, valide le JSON via `validateSchema()`, applique 4 filets de sécurité
côté client :

1. Filtre `moduleKeys` à l'enum autorisée
2. Force `besoinClarification` si `qui` ou `quoi` manque (le LLM désobéit parfois)
3. Cap `nombreQuestions` à [1, 50]
4. **Anti-confusion type/sujet** : si `quoi` matche une entrée de `fuzzyMap` après strip d'articles (« un QCM », « des flashcards »), on bascule la valeur dans `moduleKeys` et on force `quoi=null`. Le LLM confond souvent le **type d'activité** (QCM, Flashcards…) avec le **sujet pédagogique** ; le prompt insiste désormais lourdement sur cette distinction et le garde-fou rattrape les ratés.

### 6.3 Fallback regex

Si le LLM est injoignable (timeout, 5xx, JSON invalide), on tombe sur
`fallbackExtract()` :

- `fuzzyMap` (config) → trie par longueur décroissante pour éviter `qcm`
  qui matcherait avant `vrai faux`
- `NIVEAU_PATTERNS` → CP/CM2/6e/sixième/Seconde/L1-M2/collège/lycée
- `extractNombreQuestions()` → `/(\d{1,2})\s*(question|item|élément|carte|…)/i`

Le fallback retourne `confiance: 0.4` si au moins un module est trouvé, `0`
sinon — ce qui déclenche le basculement automatique en mode aide via le seuil
`CONFIG.extractor.minConfidence`.

### 6.4 Sécurité du prompt

Le `userMessage` est passé dans `sanitizeForPrompt()` (retire guillemets,
newlines, marqueurs internes) avant interpolation dans `Phrase a analyser :
"${safeUser}"`. Cela évite qu'un user puisse échapper au format du prompt.

### 6.5 Historique conversationnel envoyé au webhook

Depuis v1.2 (suite à un retour utilisateur sur la perte de contexte cross-tour), l'extracteur **et** le chat libre envoient l'historique via `getHistoryForLLM()` (state.js) — une **fenêtre glissante** bornée par `CONFIG.history` (8 derniers tours, 2000 caractères max par message). L'UI conserve toujours l'historique complet ; seul le payload réseau est tronqué :

```jsonc
{
  "message": "<prompt courant>",
  "history": [
    { "role": "user"|"assistant", "content": "<sanitizeUserInput, max 2000 chars>" },
    ...
  ],
  "intent": "extract"|"help",
  "lang": "<langFullName>"
}
```

**Pourquoi 8 tours :** les échanges restent courts en pratique (rarement plus de quelques tours), et le workflow n8n borne de toute façon lui-même (`cleanHistory` : 8 tours en auto/help, 6 en extract) — envoyer plus serait ignoré. Si demain les conversations s'allongent significativement, basculer sur un résumé glissant côté client (ex : derniers 10 + résumé LLM des plus anciens) serait une évolution raisonnable.

**Côté n8n :** le workflow consomme `history[]` pour reconstituer le contexte LLM (filtrage des rôles valides + bornes de taille dans `cleanHistory`). Sans ça, le champ serait ignoré sans erreur (compat ascendante).

---

## 7. Pont avec le DOM Caramel (actions)

[`actions.js`](actions.js) est la seule couche qui touche au DOM Caramel.
Trois APIs publiques :

### 7.1 `fillFormField(id, value)`

Remplit un input et **dispatch les events `input` + `change`** pour que les
listeners de Caramel se déclenchent (Caramel reconstruit ses prompts cachés
à la volée sur l'event `input` de qui/quoi).

### 7.2 `findActivityTile(moduleKey)`

Cascade de sélecteurs : `[data-module]` → `[data-module-key]` → `#tile-X` →
`.activity-tile[data-key]` → fallback recherche textuelle (utilise
`tActivity(key, {suffix:false})` pour matcher le label affiché).

### 7.3 `launchGenerations(moduleKeys, {qui, quoi})` → `Promise<string[]>`

Lance N générations en série et **retourne les IDs des notifications** créées pendant le batch (capture via un listener éphémère sur l'event `notification:added` du centre de notifications). Ces IDs alimentent le bouton ZIP final (cf. §5.5).

```
fillFormField('qui'/'quoi') + dispatch input
addEventListener('notification:added', ...)         ← capture batchIds
waitForHiddenPrompts()                              ← Caramel debounce 500ms
                                                       avant de régénérer
                                                       textarea[id^="hidden-"]

for chaque moduleKey :
  ├─ tile.click()                                   ← ouvre la sidebar
  ├─ waitForElement(`#generate-llm-${key}`, 5s)     ← MutationObserver
  ├─ llmBtn.click()                                 ← lance le pipeline
  ├─ waitForSidebarClose(timeout 120s)              ← attente fin réelle
  │     ├─ MutationObserver sur sidebar.classList
  │     │   (attachLLMLogic appelle closeSidebar()
  │     │    au succès → on détecte la fermeture)
  │     └─ fallback : force closeBtn.click() au timeout
  └─ delay(500ms)                                   ← anim de fermeture

removeEventListener (try/finally)                   ← garantit le nettoyage
return batchIds
```

Les notifications de Caramel empilent les résultats. L'utilisateur les
récupère dans le centre de notifications classique **ou** via le bouton ZIP du chat (sous-ensemble du batch).

**⚠️ Pourquoi on NE ferme PAS la sidebar manuellement après `llmBtn.click()` :**
`closeSidebar()` (ui.js) planifie `sidebar.innerHTML = ''` après 400 ms. Si on
le déclenche pendant que le LLM répond encore, on détache les éléments DOM
nécessaires au pipeline post-génération (`jsonInputTarget`, `createBtn`).
Résultat : `createBtn.click()` ne fait rien (élément null), l'event
`generation:complete` n'est jamais émis, `stopCaramelAnimation()` n'est
jamais appelée → **animation qui tourne en boucle**. Solution : on attend que
`attachLLMLogic` referme la sidebar elle-même au succès.

**Robustesse :** on évite tous les `setTimeout(N, …)` en cascade au profit
de `MutationObserver` + timeout de garde. Une connexion lente ou une anim
ralentie ne casse pas le flow.

---

## 8. Pièces jointes (attachment)

[`attachment.js`](attachment.js) ajoute deux entrées :

- **Bouton trombone** dans la barre d'input
- **Drag & drop** sur le panel entier

Les deux délèguent à `window.CaramelOCR.processFile(file)` (exposé par
`js/services/ocr.js`). La transcription tourne **en tâche de fond** : le user
peut continuer à chatter pendant ce temps.

**Détection de fin réelle :** `MutationObserver` sur `#pdf-tags-container`
qui guette l'apparition d'un `.filename[title="<nom du fichier>"]`. Timeout
de 2 minutes pour les gros PDF.

**Anti-scintillement du drag overlay :** compteur `dragCounter` au niveau du
**document** (et non du panel). Évite les triggers parasites quand le curseur
passe entre éléments imbriqués. Reset sur `dragend` + `window.blur`.

---

## 8.bis Accessibilité (a11y)

Cible Lighthouse a11y ≥ 95. Les patterns clés :

### 8.bis.1 Widget (FAB + panel)

| Élément | Attribut | Valeur | Pourquoi |
|---------|----------|--------|----------|
| FAB | `role` | (button natif) | Bouton réel, pas un div cliquable |
| FAB | `type` | `button` | Évite la soumission de form parent |
| FAB | `aria-label` | `t('ui_aria_open')` ou `t('ui_aria_close')` | Suit l'état d'ouverture |
| FAB | `aria-haspopup` | `dialog` | Annonce qu'il ouvre une boîte de dialogue |
| FAB | `aria-controls` | `caramelia-panel` | Lie au panneau contrôlé |
| FAB | `aria-expanded` | `true` / `false` | Synchronisé par `toggle()` |
| Panel | `role` | `dialog` | Sémantique boîte de dialogue |
| Panel | `aria-modal` | `true` | Annonce le caractère modal |
| Panel | `aria-label` | `t('ui_aria_dialog')` | Titre lu par les SR |
| Messages | `role` + `aria-live` | `log` + `polite` | Annonce non-intrusive des nouveaux messages |
| Inputs / boutons internes | `aria-label` | clés `ui_aria_*` | Tous traduits par `refreshWidgetLabels()` |

### 8.bis.2 Focus management

- À l'**ouverture** : on mémorise `document.activeElement` dans `lastFocusedBeforeOpen`, puis on focus l'input après la fin de la transition CSS (350 ms).
- À la **fermeture** : focus restauré sur l'élément mémorisé (ou sur le FAB si l'élément a disparu du DOM).
- **Touche Échap** : ferme le panel via le listener global dans [`index.js`](index.js).
- **Click outside** : ferme le panel sauf si on clique dans une modale Caramel (`isInsideCaramelModal()`).

### 8.bis.3 Boutons dynamiques

Tous les boutons créés à la volée (`addBotMessage` quick-replies, `addCheckboxList` validate, ZIP final) utilisent `<button type="button">` et héritent du focus visible du thème Caramelia. Les checkboxes sont enveloppées dans un `<label>` réel pour l'association implicite.

### 8.bis.4 Réduction de mouvement

Le widget respecte `@media (prefers-reduced-motion: reduce)` : animations FAB, panel, message-in et typing sont neutralisées (cf. fin de [`caramelia.css`](../../css/components/caramelia.css)).

---

## 9. Internationalisation

12 langues (fr en es de it nl pt ar zh jp el br). Source de vérité : la langue
active de Caramel (`currentLang` exporté par `js/core/translation.js`).

```
loadLocale(lang) ─→ fetch js/caramelia/locales/{lang}.json
                  ├─ fallback fr si HTTP error
                  └─ idempotent (ne refait rien si déjà chargé)

watchLanguageChanges() ─→ caramel:language-changed, recharge immédiatement
                          + applyLanguageChange()

applyLanguageChange() ─→ refreshWidgetLabels()   (châssis : aria, title, placeholder)
     [index.js]         + resetConversation()    SI la conversation est vierge
                          (history ≤ 1 && !currentFlow) → réaffiche l'accueil
                          dans la nouvelle langue. Appelé AUSSI par toggle(),
                          pour vérifier la langue à l’ouverture.

t(key, vars)      ─→ "Bonjour {name}" + {name:'Léa'} → "Bonjour Léa"
                     warn console si clé manquante
tActivity(key)    ─→ utilise d'abord la clé Caramel officielle (single source
                     of truth), fallback sur activity_X de Caramelia, suffixe
                     " (H5P)" ou " (Éléa)"
```

**Pour ajouter une nouvelle clé :** l'ajouter aux 12 fichiers locales (sinon
les langues non couvertes affichent la clé brute en console.warn).

**Piège — recharger la locale ne repeint PAS ce qui est déjà à l'écran.**
`refreshWidgetLabels()` ne touche que le châssis ; les seuls textes VISIBLES du
panneau sont les bulles et leurs boutons de réponse rapide, peints une fois pour
toutes par `addBotMessage()`. Et `showWelcome()` est gardé par `if (!state.history.length)`.
Sans `applyLanguageChange()`, un panneau ouvert ne serait-ce qu'une fois restait
donc dans la langue de cette première ouverture, indéfiniment (constaté 2026-08-28).
Une conversation ENGAGÉE, elle, n'est volontairement pas réécrite : un transcript est
un historique — seuls les messages suivants sortent dans la nouvelle langue.
Couverture : `tests/qa-manuel/i-langue-caramelia.mjs` (+ `--contre-epreuve`).

**Convention italique dans les bulles bot :** utiliser `_texte_` (ou `*texte*`) dans les locales pour les exemples/aparté. Le parser `md()` les convertit en `<em>` et le CSS `.caramelia-msg--bot em` les affiche en doré (`var(--caramelia-primary-dark)`) pour les distinguer du texte courant sans confusion avec un lien hypertexte. Les bornes `_..._` excluent lettres/chiffres/_ pour ne pas casser les `snake_case` ni les URLs.

**Clés ajoutées en v1.2 :** `launch_btn_zip` et `launch_zip_empty` (bouton ZIP final + message d'erreur si rien à empaqueter).

---

## 10. Sécurité

Défense en profondeur côté client. Le webhook n8n a son propre prompt
système, mais on ne contrôle pas son contenu.

### 10.1 `sanitizeUserInput(text)` — appliqué sur **tout** input avant LLM

- Retire les caractères de contrôle invisibles (LRO/RLO/zero-width/BOM)
- Retire les marqueurs internes (`[CARAMELIA_…]`, `<DATA>`, `[Reponds en …]`)
- Cap à 5000 caractères / 80 lignes

### 10.2 `sanitizeForPrompt(text)` — variante stricte pour interpolation

Tout ce que fait `sanitizeUserInput`, plus :

- Remplace `"`, `'`, `` ` `` par des espaces
- Aplatit toutes les newlines (empêche injection sur ligne suivante)
- Compacte les espaces

À utiliser quand le user input est interpolé dans une chaîne entre guillemets
(`Phrase a analyser : "${safeUser}"`).

### 10.3 `fenceUserMessage(text)` — sandbox explicite

Encadre dans `<USER_MESSAGE>…</USER_MESSAGE>` pour le mode aide. Couplé au
`SECURITY_PREAMBLE` qui rappelle au LLM les règles de base.

### 10.4 `detectInjectionAttempt(text)` — observabilité

15 patterns d'injection courants (DAN, jailbreak, "ignore previous instructions",
roleplay, etc.). N'**active rien** : log discret en console. Permet de
remonter des stats sans bloquer de faux positifs.

---

## 11. Configuration centrale

Tout est dans [`config.js`](config.js). Aucune valeur magique ailleurs.

| Section | Contenu |
|---------|---------|
| `version` | Version Caramelia (affichée en footer du panel) |
| `chatWebhookUrl` | Endpoint n8n unique pour chat libre + extraction |
| `activityCategories` | 3 buckets : `quiz`, `text`, `memory` (clés affichées via `t('category_X')`) |
| `allModuleKeys` | Enum complète pour validation extractor |
| `h5pKeys` / `eleaKeys` | Split par plateforme (utilisé pour clarif "H5P ou Éléa ?") |
| `activityCaramelMap` | moduleKey → `{caramelKey, platform}` (pont vers i18n Caramel) |
| `platformSuffix` | `' (H5P)'` / `' (Éléa)'` ajoutés par `tActivity()` |
| `fuzzyMap` | Mots-clés FR → moduleKey (fallback regex) |
| `timing` | Délais d'attente du pipeline (sidebar, click, close) |
| `extractor.minConfidence` | Seuil de bascule en mode aide (default 0.5) |

---

## 12. Points d'extension

### 12.1 Ajouter un type d'activité

1. Ajouter la `moduleKey` à `config.js` :
   - `allModuleKeys`
   - `h5pKeys` ou `eleaKeys`
   - `activityCaramelMap` (mapping vers la clé i18n Caramel + plateforme)
   - `activityCategories.{quiz|text|memory}.keys` (pour le menu catégorie)
   - Quelques entrées dans `fuzzyMap` (fallback regex)
2. Ajouter `activity_<key>` dans les 12 locales (fallback si Caramel n'a pas la clé)
3. Vérifier que la tuile Caramel répond bien à `findActivityTile(moduleKey)`

### 12.2 Ajouter un champ extrait (ex: durée, mode d'évaluation…)

1. Ajouter au schéma de `extractor.js` (prompt + `validateSchema`)
2. Ajouter une regex dans `fallbackExtract` si possible
3. Stocker dans `state.genState.<champ>` via `smartRoute`
4. Auto-remplir le champ DOM correspondant via `fillFormField('<id>', val)`
5. Ajouter la ligne récap dans `extract_recap_<champ>` + `confirm_recap_<champ>` (12 locales)
6. Ajouter au récap dans `smartRoute()` + `runGeneration()`

### 12.3 Ajouter un nouveau flow

Le router central est `handleUserInput(text)` dans `flow.js`. Pour un nouveau
flow `'X'` :

1. Définir `state.currentFlow = 'X'` dans le déclencheur
2. Ajouter une branche `if (state.currentFlow === 'X') return handleX(text)`
3. Implémenter `handleX` (idéalement dans son propre module)

### 12.4 Changer le webhook ou l'instabilité du LLM

Tout passe par `CONFIG.chatWebhookUrl`. Le format `<DATA>{…}</DATA>` a été
choisi parce que le webhook n8n bascule en chat libre dès qu'il voit du XML
structuré (préambule, balises système). Si on migre vers un endpoint plus
robuste (ex: réponse JSON native), `extractor.js` peut être simplifié — le
reste de l'archi est indépendant.

---

## 13. Pistes d'amélioration

Ordre indicatif d'impact / effort :

### Court terme

- ~~**Mémoire conversationnelle**~~ ✅ **Fait en v1.2** : l'historique complet (`state.history`) est désormais envoyé dans le payload de l'extracteur ET du chat libre. Reste à câbler côté n8n (workflow contrôlé par un autre développeur).
- **Auto-fill RAG** : si le user joint un PDF puis tape "fais une activité
  dessus", déduire le sujet via le titre du fichier.
- **Suggestion proactive** : après une génération réussie, proposer des
  activités complémentaires ("tu viens de faire un QCM, et un set de
  flashcards sur le même sujet ?").
- **Suppression de la modale de preview en mode chaîne** : actuellement, chaque génération ouvre une modale de visualisation/téléchargement. En mode multi-activités, ça interrompt l'enchaînement. Idée : passer un flag au pipeline pour court-circuiter cette modale uniquement quand `launchGenerations` est en cours.

### Moyen terme

- **Streaming des réponses** du chat libre (UX plus vivante)
- **Historique persistant** entre rafraîchissements (localStorage avec opt-in)
- **Tests E2E** sur le flow complet (Playwright sur Caramel + Caramelia)
- **Logs structurés** : agréger `detectInjectionAttempt` + erreurs LLM pour
  observer la santé du webhook

### Long terme

- **Mode multi-tour de génération** : "fais 3 activités sur ce sujet, mais
  varie les niveaux de difficulté"
- **Personnalisation par user** : stocker les préférences (toujours H5P,
  toujours 10 questions, etc.) en localStorage
- **Voix** : Web Speech API pour dicter le sujet
- **Désambiguïsation interactive sur plusieurs critères** : actuellement
  on gère une seule clarif (plateforme). Étendre à un wizard multi-questions

### Refactos techniques

- Extraire `runGeneration` / `runGenerationFromChecklist` dans un module
  `confirm.js` séparé (flow.js commence à grossir)
- Typer les payloads webhook (JSDoc strict ou migration TypeScript)
- Centraliser tous les sélecteurs Caramel dans `config.js` (actuellement
  certains sont en dur dans `actions.js`)

---

## 14. Glossaire & conventions

| Terme | Définition |
|-------|------------|
| **moduleKey** | Identifiant interne d'une activité (`'QuizSetQCM'`, `'Flashcards'`…). Enum dans `config.allModuleKeys`. |
| **caramelKey** | Clé i18n officielle de Caramel (`'h5p_quiz_set_qcm_name'`). Mappée via `activityCaramelMap`. |
| **plateforme** | `'h5p'` ou `'elea'`. Détermine le suffixe affiché et le filtrage en cas de clarif. |
| **flow** | État haut-niveau de la conversation : `null`, `'help'`, `'generate'`. |
| **step** | Étape interne du flow `'generate'` : `'qui'`, `'quoi'`, `'category'`, `'activity'`. |
| **autoRoute** | Routeur de tout message libre (1 appel `intent:'auto'`, le LLM décide question vs création). Remplace l'ancien `smartRoute` (extraction-first). |
| **mode auto** | Mode webhook unifié : RAG + schéma de création dans un seul appel ; le LLM répond en texte (A) ou émet `<DATA>` (B). |
| **proceedAfterCollect** | Routeur **central** appelé après tout enrichissement de `genState`. Remplace la logique dupliquée historique. |
| **fuzzyMap** | Dictionnaire mots-clés FR → moduleKey, fallback si LLM KO. Trié par longueur décroissante à l'usage. |
| **extracteur** | Module qui appelle le LLM avec un prompt rigide pour récupérer du JSON structuré. |
| **récap** | Bulle markdown listant ce que Caramelia a compris (qui/quoi/niveau/…). Affichée avant tout choix engageant. |
| **DATA block** | Format `<DATA>{…}</DATA>` imposé au LLM pour fiabiliser le parsing. |
| **batchIds** | IDs des notifications créées pendant un appel à `launchGenerations`. Utilisés pour empaqueter un ZIP ciblé via `downloadNotificationsAsZip()` sans inclure les notifications antérieures. |

### Conventions de code

- **JS** : ES6 modules, pas de transpilation. Pas de `any` implicite (JSDoc partout).
- **Commentaires** : en **français**, courts, expliquent le **pourquoi** pas le quoi.
- **i18n** : toute chaîne user-facing passe par `t()`. Jamais de littéral en dur.
- **DOM Caramel** : ne **jamais** lire/écrire en dehors de `actions.js`. C'est la frontière.
- **Sécurité** : tout input externe (user, fichier, webhook) passe par `sanitize*` avant
  utilisation dans un prompt.
- **Imports** : descendants uniquement. `index.js` importe tout, `config.js`/`utils.js`
  n'importent rien des autres modules métier.

---

**Dernière mise à jour de ce document** : à mettre à jour à chaque ajout de
flow, de champ extrait, ou de point d'extension. Ce fichier est le contrat
de lecture pour qui reprend Caramelia.

## Accès au parcours et consolidation du 10 septembre 2026

Le menu et les réponses d’aide proposent l’atelier de parcours quand le module
est présent. `flow.startParcoursFlow()` passe par les sélecteurs centralisés de
`actions.ouvrirParcours()` : clic sur le commutateur existant, aucune importation
du moteur du parcours, aucun appel IA. Le plan existant reste intact. L’événement
`caramelia:close` laisse le bootstrap fermer le chat avant de rendre le focus au
commutateur au premier cadrage (sans défilement) ou au titre d’un plan repris.
La validation du plan et la fabrication restent dans l’atelier.

`state.pendingQuery` empêche deux messages libres simultanés ; le champ conserve
la saisie suivante. `state.revision` et AbortSignal empêchent une réponse tardive
de repeindre une conversation recommencée ou remplacée par un choix du menu.
L’indicateur d’attente appartient à sa requête. `fetchWithRetry` relaie désormais
l’annulation du demandeur, sans la considérer comme une panne à réessayer.
`generationRunning` protège le lancement en série ; le bilan compte les
notifications créées. Les choix des réponses précédentes sont retirés.
Le dernier appel à `loadLocale` gagne, même si un téléchargement antérieur est lent.

Tests : `node tests/run_parcours_caramelia.mjs` et
`node tests/run_browser_suite.mjs --suite=caramelia,caramelia-ui`.
Le premier bloque les services distants et simule les réponses du chatbot.
Pas de changement du schéma d’intention ni de n8n. La création d’un parcours
entièrement guidée en conversation reste une évolution distincte de ce raccourci.
