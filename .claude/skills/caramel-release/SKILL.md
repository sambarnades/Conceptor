---
name: caramel-release
description: Sortir une nouvelle version de Caramel (bump de version, CHANGELOG, footer, version-checker). À utiliser quand l'utilisateur dit "release", "version bump", "sortir version X", "changelog", "5.4.0", "passer en prod", ou veut publier une nouvelle version.
---

# Release Caramel

Convention de version : SemVer informelle. Format prod : `5.3.0`. Versions intermédiaires : `5.3.0 (beta 1)`, `5.3.0 (beta 3b)`.

## Endroits à mettre à jour pour bumper la version

### 1. CHANGELOG (`CHANGELOG`)
Au sommet, ajouter une nouvelle section :
```markdown
## [5.4.0] - DD-MM-YYYY

### Nouveautés
- ...

### Améliorations
- ...

### Corrections
- ...

### Notes techniques
- ...
```

Style à conserver : titres en français, listes claires, mentions techniques (fichiers touchés) en fin si utile.

### 2. Footer HTML (`index.html`)
Chercher la ligne :
```html
<a href="..." class="footer-version">... <span>Caramel v5.3.0</span></a>
```
Bumper à `v5.4.0`.

### 3. Version checker (`js/ui/version-checker.js`)
Vérifier qu'il pointe vers une source de vérité (CHANGELOG distant ou constant). Bumper si version hardcodée.

### 4. CLAUDE.md
Section "Identité" : bumper `v5.3.0` → `v5.4.0`.

### 5. Documentation versionnée (si applicable)
- `wiki.md` si version mentionnée
- `README.md` si version mentionnée
- PRD : pas de bump, mais éventuellement update si refonte structurelle

### 6. Page de présentation et diaporama de formation
- `decouvrir/index.html` : son pied de page porte aussi `Caramel vX.Y.Z` — le bumper.
- Le diaporama (`assets/presentation/diaporama/`) affiche la version et la date sur chaque
  diapositive : si l'interface a changé, refaire d'abord les captures
  (`node scripts/captures-interface.mjs`), puis `node scripts/diaporama/generer-diaporama.mjs`
  (pptxgenjs et Playwright dans `tests/roundtrip/`, LibreOffice, Poppler). Relire le contenu
  des diapositives dans le script si une fonctionnalité présentée a changé.
- Garde-fou : `node tests/run_decouvrir.mjs` échoue tant que `diaporama.json` ne porte pas la
  version d'`index.html`.

### 7. Cache busting (si applicable)
Vérifier que les imports versionnés des libs vendor (`?v=...`) ou les chemins `vendor/lib/x.y.z/` reflètent les versions effectives.

## Workflow git

Branches Caramel typiques :
- `main` : prod
- branches betas : `5.3.0 (beta X)` mergées au fur et à mesure dans main avec commit explicite

Commit de release :
```
git add CHANGELOG index.html js/ui/version-checker.js CLAUDE.md decouvrir/index.html assets/presentation/diaporama assets/images/wiki
git commit -m "Caramel - 5.4.0 (PROD)"
```

Pour les betas :
```
git commit -m "Caramel - 5.4.0 (beta 1)"
git commit -m "Caramel - 5.4.0 (beta 2)"
```

## Validation pré-release

1. **Tests UI** : générer chaque type d'activité H5P + Moodle, télécharger, vérifier ouverture
2. **Tests export** : DOCX, ODT, PDF — ouvrir dans Word, LibreOffice, lecteur PDF
3. **Tests preview** : H5P preview marche pour toutes les activités (vérifier patch `frame.bundle.js` si modif vendor)
4. **Tests i18n** : `node scripts/verify-all-locales.mjs` doit passer
5. **Tests LaTeX** : `node scripts/verify-locale-latex.mjs` doit passer
6. **Tests Caramelia** : ouvrir le chatbot, tester aide + extraction d'intention
7. **Cross-browser** : Chrome, Firefox, Safari (au moins Chrome obligatoire)
8. **Mode debug** : `?debug` doit fonctionner (logs + raw/healed/diff modal)
9. **Performance** : générer une CoursePresentation avec 30+ slides, vérifier que ça reste fluide

## Push & déploiement

Le déploiement est géré par GitLab CI (`.gitlab-ci.yml`) sur `forge.apps.education.fr`. Push sur `main` → déploiement automatique.

```bash
git push origin main
```

Vérifier que l'URL de prod affiche la nouvelle version dans le footer.

## Pièges connus

- **Oublier le footer** : le version-checker affiche un message "nouvelle version disponible" si désaccord — utilisateurs en confusion
- **Oublier le CHANGELOG** : les utilisateurs ne voient pas les nouveautés
- **Beta non mergée** : si tu releases `5.4.0 (PROD)` sans merger toutes les betas, tu perds des fixes
- **Cache navigateur** : utilisateurs en cache ne voient pas le bump immédiatement → version-checker leur signale
- **`.gitlab-ci.yml` modifié sans tester** : peut casser le déploiement — vérifier avant push
- **Versions de libs vendor** : si tu bumpe une lib vendor (ex: h5p-standalone), TOUJOURS réappliquer le patch `data:` URL dans `frame.bundle.js` (voir CLAUDE.md)

## Fichiers touchés

```
CHANGELOG                                [section nouvelle version]
index.html                               [footer-version]
js/ui/version-checker.js                 [si version hardcodée]
CLAUDE.md                                [identité]
README.md, wiki.md                       [si mention version]
```

## Suggestion : routine post-release

Après une release, tu peux lancer un agent de surveillance pour vérifier que la prod va bien. Suggérer un `/schedule` 24h après push pour : check footer prod, vérifier 0 erreur console sur page d'accueil, vérifier qu'au moins 1 activité H5P se génère.
