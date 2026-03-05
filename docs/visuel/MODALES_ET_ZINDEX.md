# Modales et niveaux d'empilement (z-index) — Caramel

> Documentation des couches d'affichage et des modales de l'interface.
> Toutes les valeurs globales sont centralisées dans les variables CSS `:root` de `css/base/style.css`.

---

## 1. Variables CSS — source de vérité unique

```css
:root {
    /* Navigation globale */
    --z-banner: 900;             /* bandeau d'urgence (sous les dropdowns) */
    --z-dropdown: 1000;          /* menus déroulants (langue, notifications, actions) */
    --z-toast: 1050;             /* notifications toast éphémères */
    --z-header: 1100;            /* barre d'en-tête sticky (.app-bar) */

    /* Sidebar (panneau d'activité) */
    --z-sidebar-overlay: 2000;   /* fond sombre derrière la sidebar */
    --z-sidebar: 2050;           /* #module-sidebar */

    /* Modales principales (une seule visible à la fois) */
    --z-modal: 3000;             /* toutes les modales : help, legal, version, result, preview */

    /* Éléments au-dessus des modales */
    --z-modal-confirm: 4000;     /* modales de confirmation (éditeur JSON) */
    --z-fullscreen: 5000;        /* H5P plein écran (.h5p-container.h5p-fullscreen) */
    --z-popover: 6000;           /* help popover contextuel */

    /* Backdrops standardisés */
    --backdrop-light: rgba(0, 0, 0, 0.4);   /* overlays légers (sidebar, preview, result) */
    --backdrop-dark:  rgba(0, 0, 0, 0.6);   /* modales bloquantes (legal, confirm) */
}
```

---

## 2. Carte des niveaux d'empilement

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Variable              Valeur   Élément                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  --z-popover + 1       6001  ●  .help-popover (contenu)                  │
│  --z-popover           6000  ●  .help-popover__backdrop                  │
│  --z-fullscreen        5000  ●  .h5p-container.h5p-fullscreen            │
│  --z-modal-confirm     4000  ●  .confirm-modal-overlay                   │
│                               ●  .json-editor__modal-overlay              │
│  --z-modal             3000  ●  MODALES PRINCIPALES (voir §3)            │
│                               ●  .fullscreen-overlay (RAG)               │
│                               ●  #caramel-animation-overlay (chargement) │
│  --z-sidebar           2050  ●  #module-sidebar                          │
│  --z-sidebar-overlay   2000  ●  #sidebar-overlay                         │
├─────────────────────────────────────────────────────────────────────────┤
│  --z-header            1100  ●  .app-bar (barre d'en-tête sticky)        │
│  --z-toast             1050  ●  .notification-toast                      │
│  --z-dropdown          1000  ●  .language-dropdown                       │
│                               ●  .notification-dropdown                   │
│                               ●  .dropdown-menu (actions)                 │
│  --z-banner             900  ●  #emergency-notification-container         │
├─────────────────────────────────────────────────────────────────────────┤
│  (locaux)              1-100    Éléments internes aux stacking contexts   │
│                                 (.floating-toolbar, .help-nav, tooltips)  │
│  (auto)                  0      Contenu normal                            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Note :** les z-index des libs vendeur H5P (jusqu'à 100001) sont encapsulés dans leurs conteneurs et n'interfèrent pas avec l'interface Caramel.

---

## 3. Fiches des modales

### 3.1 `help-modal` — Tutoriel / Aide

| Propriété | Valeur |
|-----------|--------|
| **z-index** | `var(--z-modal)` = 3000 |
| **ID HTML** | `#help-modal` (créé dynamiquement) |
| **Classe CSS** | `.help-modal` |
| **Fichier CSS** | `css/components/modale-aide.css` |
| **Template HTML** | `assets/templates/tutorial_content.html` |
| **Ouvert par** | `showHelpModal()` dans `js/core/utils.js` |
| **Déclencheur** | Clic sur `#help-button` (header) |
| **Backdrop** | Fond intégré `rgba(0,0,0,0.6)` |
| **Fermeture** | `.help-close-modal-btn` ou clic sur fond |
| **aria-modal** | `true` |

**Structure interne :**
```
.help-modal                         ← overlay (position: fixed, var(--z-modal))
  └── .help-modal-content           ← boîte blanche centrée
        ├── .help-modal-header      ← titre + bouton ×
        ├── .help-nav               ← navigation interne (z-index: 10 local)
        └── .help-modal-body        ← contenu scrollable (max-height: 80vh)
```

---

### 3.2 `preview-modal` — Prévisualisation et édition

| Propriété | Valeur |
|-----------|--------|
| **z-index** | `var(--z-modal)` = 3000 (overlay) |
| **Classe CSS** | `.preview-modal-overlay` / `.preview-modal` |
| **Fichier CSS** | `css/base/style.css` |
| **Ouvert par** | `showPreviewModal()` dans `js/ui/notifications.js` |
| **Déclencheur** | Bouton "Visualiser et éditer" dans la result-modal |
| **Backdrop** | `var(--backdrop-light)` |
| **Fermeture** | `.preview-modal__close` |
| **aria-modal** | `true` (sur `.preview-modal`) |

**Structure interne :**
```
.preview-modal-overlay              ← overlay (position: fixed, var(--z-modal))
  └── .preview-modal                ← boîte de dialogue (role="dialog", aria-modal="true")
        ├── .preview-modal__header          ← z-index: 3000 (local sticky)
        │     ├── .preview-modal__header-nav
        │     ├── .preview-modal__header-title-wrapper
        │     └── .preview-modal__close
        ├── .preview-modal__content
        │     └── .preview-modal__preview
        ├── .preview-modal__warning
        └── .preview-modal__footer
              ├── .preview-modal__download-group
              └── .preview-modal__edit-btn
```

---

### 3.3 `generation-result-modal` — Résultat de génération

| Propriété | Valeur |
|-----------|--------|
| **z-index** | `var(--z-modal)` = 3000 |
| **ID HTML** | `#generation-result-modal` |
| **Classe CSS** | `.generation-result-modal` + `.hidden` au départ |
| **Fichier CSS** | `css/base/style.css` |
| **Ouvert par** | `showGenerationResult()` dans `js/ui/notifications.js` |
| **Déclencheur** | Fin de génération LLM réussie |
| **Backdrop** | `var(--backdrop-light)` (intégré) |
| **Fermeture** | `data-action="continue"` ou téléchargement |
| **aria-modal** | `true` |

**Flux de transition :** clic sur "Visualiser et éditer" → `closeGenerationResultModal()` ferme cette modale → puis `preview-modal` s'ouvre. Les deux ne coexistent jamais.

**Structure interne :**
```
#generation-result-modal            ← position: fixed, var(--z-modal), backdrop intégré
  └── .generation-result-modal__card
        ├── .generation-result-modal__header
        │     ├── img (logo Caramel)
        │     └── h2 "Votre sucrerie est prête !"
        ├── .generation-result-modal__activity
        │     ├── img (icône activité)
        │     └── span (nom activité)
        ├── .generation-result-modal__actions
        │     ├── button [data-action="download"]   ← Télécharger
        │     └── button [data-action="preview"]    ← Visualiser et éditer
        └── a.generation-result-modal__continue     ← Continuer →
```

---

### 3.4 `version-modal` — Mise à jour disponible

| Propriété | Valeur |
|-----------|--------|
| **z-index** | `var(--z-modal)` = 3000 |
| **ID HTML** | `#version-update-modal` (créé dynamiquement) |
| **Classe CSS** | `.version-modal` |
| **Fichier CSS** | `css/base/custom.css` |
| **Créé par** | `createModal()` dans `js/ui/version-checker.js` |
| **Déclencheur** | Vérification automatique au démarrage (délai 8 s) + toutes les 5 min |
| **Backdrop** | `.version-modal__overlay` `rgba(7,11,25,0.55)` + `blur(2px)` |
| **Fermeture** | Boutons "Rafraîchir" ou "Rappeler plus tard" |
| **aria-modal** | `true` (sur `.version-modal__dialog`) |

**Structure interne :**
```
.version-modal                      ← position: fixed, var(--z-modal)
  ├── .version-modal__overlay       ← fond semi-transparent (role="presentation")
  └── .version-modal__dialog        ← boîte blanche (role="dialog", aria-modal="true")
        ├── .version-modal__icon    ← fa-sync-alt
        ├── .version-modal__text
        │     ├── titre
        │     └── message (versions)
        └── .version-modal__actions
              ├── bouton "Rafraîchir"
              └── bouton "Rappeler plus tard"
```

---

### 3.5 `legal-mentions-modal` — Mentions légales

| Propriété | Valeur |
|-----------|--------|
| **z-index** | `var(--z-modal)` = 3000 |
| **ID HTML** | `#legal-mentions-modal` |
| **Classe CSS** | `.modal` |
| **Fichier CSS** | `css/base/style.css` + `css/components/mentions-legales.css` |
| **Template HTML** | `assets/templates/mentions-legales.html` |
| **Déclencheur** | Clic sur le lien "Mentions légales" (footer) |
| **Backdrop** | `var(--backdrop-dark)` (intégré) |
| **Fermeture** | `#close-legal-modal` (bouton ×) |
| **aria-modal** | `true` |

**Structure interne :**
```
#legal-mentions-modal.modal         ← position: fixed, var(--z-modal), backdrop intégré
  └── .modal-content
        ├── .legal-modal-header
        │     ├── h2 (icône fa-gavel + titre)
        │     └── span#close-legal-modal (×)
        └── #legal-mentions-content ← sections chargées depuis template
```

---

### 3.6 `confirm-modal` — Confirmation (éditeur JSON)

| Propriété | Valeur |
|-----------|--------|
| **z-index** | `var(--z-modal-confirm)` = 4000 |
| **Classe CSS** | `.json-editor__modal-overlay` / `.confirm-modal-overlay` |
| **Fichier CSS** | `css/components/json-editor.css` |
| **Créé par** | `showConfirm()`, `showAlert()`, `showBlockTypeChangeConfirm()` dans `js/editor/array-manager.js` et `showThreeButtonConfirm()` dans `js/ui/notifications.js` |
| **Déclencheur** | Confirmations dans l'éditeur JSON (suppressions, abandons, changements de type) |
| **Backdrop** | `var(--backdrop-dark)` + `blur(4px)` |
| **Fermeture** | Boutons d'action ou clic sur fond ou Echap |
| **aria-modal** | `true` |

**Structure interne :**
```
.json-editor__modal-overlay         ← position: fixed, var(--z-modal-confirm)
  └── .confirm-modal                ← carte blanche de dialogue
        ├── .confirm-modal__header
        │     └── h3 (titre)
        ├── .confirm-modal__body
        │     └── p (message)
        └── .confirm-modal__footer
              ├── bouton (primary/danger)
              ├── bouton (secondary)
              └── bouton (optionnel, peut être caché)
```

---

## 4. Overlays et backdrops — tableau récapitulatif

| Élément | Sélecteur | Variable z-index | Fond | Blur | aria-modal |
|---------|-----------|------------------|------|------|------------|
| Sidebar overlay | `#sidebar-overlay` | `--z-sidebar-overlay` (2000) | `var(--backdrop-light)` | — | — |
| Help modal | `.help-modal` | `--z-modal` (3000) | `rgba(0,0,0,0.6)` | — | **oui** |
| Legal modal | `.modal` | `--z-modal` (3000) | `var(--backdrop-dark)` | — | **oui** |
| Version modal | `.version-modal` | `--z-modal` (3000) | `rgba(7,11,25,0.55)` | `blur(2px)` | **oui** |
| Generation result | `.generation-result-modal` | `--z-modal` (3000) | `var(--backdrop-light)` | — | **oui** |
| Preview modal | `.preview-modal-overlay` | `--z-modal` (3000) | `var(--backdrop-light)` | — | **oui** |
| Confirm modal | `.json-editor__modal-overlay` | `--z-modal-confirm` (4000) | `var(--backdrop-dark)` | `blur(4px)` | **oui** |
| Help popover | `.help-popover__backdrop` | `--z-popover` (6000) | `rgba(0,0,0,0.3)` | `blur(6px)` | **oui** |

---

## 5. Vue d'ensemble des couches (empilement visuel)

```
                        ┌──────────────────────────┐
var(--z-popover)        │   help-popover            │  z: 6000/6001
  = 6000                │   (aide contextuelle)     │
                        └──────────────────────────┘
                        ┌──────────────────────────┐
var(--z-fullscreen)     │   .h5p-fullscreen         │  z: 5000
  = 5000                │   (H5P plein écran)       │
                        └──────────────────────────┘
                        ┌──────────────────────────┐
var(--z-modal-confirm)  │   confirm-modal           │  z: 4000
  = 4000                │   (éditeur JSON)          │
                        └──────────────────────────┘

    ┌────────────────────────────────────────────────────┐
var(--z-modal)     ║ help │ preview │ result │ version  ║  z: 3000
  = 3000           ║ legal │ loading │ fullscreen-RAG   ║
    └────────────────────────────────────────────────────┘
    ┌───────────────────┐
var(--z-sidebar)   │ #module-sidebar   │                    z: 2050
  = 2050           └───────────────────┘
    ┌───────────────────┐
var(--z-sidebar-   │ #sidebar-overlay  │                    z: 2000
  overlay) = 2000  └───────────────────┘
    ┌──────────────────────────────────────────────┐
var(--z-header)    │  .app-bar                     │      z: 1100
  = 1100           └──────────────────────────────────┘
    ┌───────────────────┐
var(--z-toast)     │ .notification-toast │                  z: 1050
  = 1050           └───────────────────┘
    ┌────────────────────────────────────┐
var(--z-dropdown)  │ dropdowns (langue, notifs, actions) │  z: 1000
  = 1000           └────────────────────────────────────┘
    ┌──────────────────────────────────────────────┐
var(--z-banner)    │  bandeau d'urgence (barre rouge)  │  z: 900
  = 900            └──────────────────────────────────┘
─────────────────────────────────────────── contenu normal
```

---

## 6. Conventions

- **Variables pour les z-index globaux** : tout élément `position: fixed` ou `position: sticky` au niveau du viewport utilise une variable `--z-*`.
- **Valeurs numériques pour les z-index locaux** : les éléments positionnés à l'intérieur d'un stacking context parent (header sticky dans une modale, dropdown interne, etc.) gardent des valeurs numériques simples (1, 2, 5, 10, 11, 100...).
- **Intervalle de ~1000** entre chaque couche globale : laisse de la marge pour insérer un futur élément sans tout renuméroter.
- **Deux niveaux de backdrop** : `--backdrop-light` (0.4) pour les overlays légers, `--backdrop-dark` (0.6) pour les modales bloquantes.
- **`aria-modal="true"`** sur toutes les modales sans exception.
- **Pas de z-index inline en JS** : les classes CSS gèrent les z-index via les variables.
