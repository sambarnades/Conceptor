# Refonte de la barre de filtres — Chips unifiées avec code couleur

## Situation initiale

La barre de filtres de Caramel comportait **6 onglets plats** :

```
  Tout | Quiz & Tests | Manipulation de texte | Mémorisation & Découverte | Éléa | H5P
```

### Problème identifié

Ces onglets mélangeaient deux dimensions distinctes :
- **Type d'activité** : Quiz & Tests, Manipulation de texte, Mémorisation & Découverte
- **Plateforme / format** : H5P, Éléa

Un professeur qui cherche un "quiz H5P" devait naviguer entre deux onglets séparés sans pouvoir les combiner. La distinction entre "type d'activité" et "plateforme de destination" n'était pas claire visuellement.

---

## Solution retenue

Système de **chips unifiées avec code couleur** sur une seule ligne, séparée par un trait vertical :

```
  [Tout]  [Quiz & Tests]  [Texte]  [Mémorisation]  │  [H5P]  [Éléa]  [Magistère]
  ─────── activité (gris/bleu) ─────────────────    │  ── plateforme (coloré) ──
```

### Deux groupes visuellement distincts

| Groupe | Style inactif | Style actif | Comportement |
|--------|---------------|-------------|-------------|
| **Activité** | Fond gris clair `#f5f5f7`, bordure `#e0e0e0`, texte gris | Fond bleu `#007AFF`, texte blanc | Sélection exclusive (une seule) |
| **Plateforme** | Fond transparent, bordure colorée (marque) | Fond dégradé de la marque, texte blanc | Toggle indépendant (0 à 3) |

Un **séparateur vertical** (`border-left: 1.5px solid #e0e0e0`) sépare clairement les deux groupes.

### Couleurs des chips plateforme

| Plateforme | Couleur bordure | Dégradé actif | Justification |
|-----------|----------------|---------------|---------------|
| **H5P** | `#0976E7` (bleu vif) | `#0659B8 → #0976E7` | Couleur officielle H5P |
| **Éléa** | `#B9459B` (violet) | `#32038D → #B9459B` | Couleur officielle Éléa |
| **Magistère** (fr) | `#064CA4` (bleu foncé) | `#043A7D → #064CA4` | Couleur officielle Magistère |
| **Moodle** (autres langues) | `#F98012` (orange) | `#E06A00 → #F98012` | Couleur officielle Moodle |

### Switch Magistère / Moodle selon la langue

- En **français** : la chip affiche "Magistère" (bleu foncé `#064CA4`)
- En **autres langues** : la chip affiche "Moodle" (orange `#F98012`)
- Le switch est automatique via l'événement `caramel:language-changed`
- La classe CSS passe de `filter-chip--magistere` à `filter-chip--moodle`

### Logique de filtrage combiné

Les deux dimensions se combinent :
- **Type d'activité** : filtre AND (un seul type actif à la fois, "Tout" = pas de filtre)
- **Plateforme** : filtre OR entre elles (cliquer H5P + Éléa montre les deux)
- **Combinaison** : activité AND plateforme(s)

Exemples :
- `[Quiz]` seul → tous les quiz (H5P + Éléa)
- `[Quiz] + [H5P]` → uniquement les quiz H5P
- `[Tout] + [Magistère]` → tous les modules compatibles Magistère
- Aucune plateforme sélectionnée → tout montrer (pas de filtre plateforme)

### Compatibilité Magistère

| Type de module | Compatible Magistère ? | Raison |
|----------------|----------------------|--------|
| Tous les H5P (20 modules) | Oui | `platforms: ["Éléa", "Magistère", "Moodle"]` |
| Page (module Éléa) | Oui | `platforms: ["Éléa", "Magistère"]` |
| Autres Éléa (5 modules) | Non | `platforms: ["Éléa"]` uniquement |

---

## Harmonisation des étiquettes

Toutes les étiquettes de l'application ont été unifiées pour utiliser le même langage visuel :

### Palette de couleurs unifiée

| Plateforme | Couleur principale | Utilisée dans |
|-----------|-------------------|---------------|
| **H5P** | `#0976E7` | Chips filtre, labels tuiles, badges modale, badges plateforme |
| **Éléa** | `#B9459B` | Chips filtre, labels tuiles, badges modale, badges plateforme |
| **Magistère** | `#064CA4` | Chips filtre, badges plateforme |
| **Moodle** | `#F98012` | Chips filtre (hors FR), badges plateforme |

### Propriétés visuelles harmonisées

| Propriété | Valeur unifiée | Avant |
|-----------|---------------|-------|
| `border-radius` | `10px` (labels/badges), `20px` (chips) | 8px / 10px mélangé |
| `font-weight` | `600` | bold / 500 mélangé |
| `font-size` | `11px` (labels/badges) | 11px / 12px mélangé |
| `border` | `1.5px solid [couleur]` | 1px / gradient mélangé |
| `border-image` | Supprimé | Gradient (cassait border-radius) |

**Correction clé** : Les `border-image: linear-gradient(...)` des anciens labels ont été remplacés par des `border: 1.5px solid [couleur]`. Le `border-image` forçait des coins carrés en ignorant `border-radius`.

---

## Architecture technique

### Avant (onglets multiples)

```
6 <div class="tab-content"> avec chacun sa <div class="grid">
    → Tuiles dupliquées entre onglets
    → Tab switching = show/hide de divs entiers
    → Pas de combinaison possible
```

### Après (grille unique filtrée)

```
1 seule <div class="activity-grid"> avec 1 <div class="grid">
    → Chaque tuile porte data-activity-types et data-platforms
    → Filtrage JS dynamique (show/hide par tuile)
    → Combinaisons possibles
```

### Attributs data sur chaque tuile

```html
<div class="h5p-tile"
     data-module="QuizSet"
     data-activity-types="quiz"
     data-platforms="h5p,elea,magistere">
    ...
</div>
```

- `data-activity-types` : extrait des `categories` (sans h5p/elea), séparé par virgules
- `data-platforms` : construit depuis `categories` (h5p, elea) + `platforms` array (Magistère)

### Fonction de filtrage

```javascript
function applyFilters() {
    const activeType = document.querySelector('.filter-chip--activity.active')?.dataset.filterType || 'all';
    const activePlatforms = [...document.querySelectorAll('.filter-chip[data-filter-platform].active')]
        .map(el => el.dataset.filterPlatform);

    document.querySelectorAll('.h5p-tile').forEach(tile => {
        const types = (tile.dataset.activityTypes || '').split(',');
        const platforms = (tile.dataset.platforms || '').split(',');

        const matchesType = activeType === 'all' || types.includes(activeType);
        const matchesPlatform = activePlatforms.length === 0 ||
            activePlatforms.some(p => platforms.includes(p));

        tile.style.display = (matchesType && matchesPlatform) ? '' : 'none';
    });
}
```

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `index.html` (L183-201) | 6 onglets + 6 grilles → barre de chips + 1 grille unique |
| `css/base/style.css` (section 7) | Styles `.tabs`/`.tab-link` → `.filter-bar`/`.filter-chip` + chips Moodle |
| `css/base/custom.css` (sections 1-2) | Labels tuiles et modale harmonisés (bordures solides, radius 10px) |
| `css/base/style.css` (L4359+) | Platform badges harmonisés (font-weight 600, border 1.5px) |
| `js/ui/ui.js` | `generateTiles()` refactoré, `setupTabs()` → `setupFilters()`, switch Magistère/Moodle |
| `js/main.js` | Import et appel `setupTabs` → `setupFilters` |
| `js/locales/fr.json` | `tab_text` raccourci, `tab_memory` raccourci |

---

## Labels raccourcis (traductions)

Pour que toutes les chips tiennent sur une seule ligne :

| Clé | Avant | Après |
|-----|-------|-------|
| `tab_text` | "Manipulation de texte" | "Texte" |
| `tab_memory` | "Mémorisation & Découverte" | "Mémorisation" |

La clé `tab_moodle: "Magistère"` (fr) / `"Moodle"` (autres) existait déjà et est réutilisée.

---

## Contraintes UX respectées

- Pas de ligne supplémentaire ajoutée
- Interface intuitive : chips = interaction familière (filtre par clic)
- Code couleur immédiat : gris/bleu = type d'activité, coloré = plateforme
- Séparateur vertical entre les deux groupes de filtres
- Barre centrée horizontalement
- Scroll horizontal conservé sur mobile
- Logique `tiles-disabled` conservée (champs vides → tuiles grisées)
- Labels H5P/Éléa harmonisés avec les chips (mêmes couleurs, mêmes proportions)
- Switch automatique Magistère (bleu) / Moodle (orange) selon la langue
