# Listes de filtrage profanity — v1

Wordlists utilisées par le pré-filtre client-side du pont Sucrerie pour bloquer
immédiatement les insultes / vulgarités évidentes avant même d'appeler le LLM
de modération côté workflow n8n.

## Sources

- **fr, en, es, de, it, nl, pt, ar, zh, ja** : projet [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
  par Shutterstock, domaine public. Snapshot téléchargé le 2026-05-06.
- **el** (grec) : non disponible dans LDNOOBW. Liste minimale rédigée à la main
  couvrant les insultes / vulgarités les plus courantes (cf. Wiktionnaire grec).
  À enrichir si besoin.

## Format

Un terme par ligne. Le matcher applique un word-boundary `\b` (ou son équivalent
Unicode pour les langues sans espaces comme le chinois et le japonais) pour
éviter les faux positifs (ex. "con" dans "concept").

Les commentaires `#` ne sont pas supportés — chaque ligne non vide est traitée
comme un terme à filtrer.

## Versioning

Le numéro de version est dans le chemin (`/v1/`) plutôt que dans les noms de
fichier pour permettre :
- mise à jour atomique de toutes les langues d'un coup
- bump simple sans casser le cache des navigateurs ayant l'ancienne version
- rollback trivial (juste changer la version pointée par le module JS)

Pour bumper :
1. Créer `vendor/profanity/v2/` à côté de `v1/`
2. Mettre à jour `services/profanity-filter.js` → `PROFANITY_VERSION = 'v2'`
3. Tester puis push

## Charge

| Langue | Lignes | Taille |
|---|--:|--:|
| fr | 91 | 793 B |
| en | 403 | 3.7 KB |
| es | 68 | 617 B |
| de | 66 | 534 B |
| it | 168 | 1.4 KB |
| nl | 190 | 1.9 KB |
| pt | 76 | 629 B |
| ar | 37 | 331 B |
| zh | 319 | 2.6 KB |
| ja | 180 | 2.3 KB |
| el | ~36 | ~700 B |

Total ~15 KB. Une seule langue est chargée à la fois (lazy load à la 1ʳᵉ frappe).

## Faux positifs

Le matching word-boundary élimine la plupart. Les cas suspects à surveiller :
- `cum` (en) → matche `cumulus`, `cumin`. Heureusement les conjugaisons
  pédagogiques courantes ne contiennent pas le terme isolé.
- `con` (fr) → ce terme N'EST PAS dans la liste FR de LDNOOBW (justement à
  cause des faux positifs). Seuls `connard`, `conne`, `connasse` sont listés.

Si un faux positif est signalé, retirer le terme problématique du `.txt`
correspondant et bumper la version.
