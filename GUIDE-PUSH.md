# GUIDE-PUSH — Publication de Conceptor (dépôt unique)

Publication effectuée le **2026-10-13**. Ce document décrit l'architecture Git en
place, la vérification d'un clone sain, et la procédure de synchronisation amont.

## Architecture

Un **dépôt GitHub unique** : [`sambarnades/Conceptor`](https://github.com/sambarnades/Conceptor)
(ancien `m-conceptor`, renommé). Deux branches, deux rôles :

| Branche | Contenu | Rôle |
|---|---|---|
| `main` | Racine de pilotage : `README.md`, `ROADMAP.md`, ce guide, `Dockerfile`, `.dockerignore`, `.gitignore`, `.gitmodules` | Dépôt de pilotage ISFEC |
| `isfec/main` | Fork applicatif complet (`caramel/`, base Caramel 7.1.0 + commits ISFEC) | Code applicatif Conceptor |

`caramel/` reste un **submodule Git** : `.gitmodules` pointe sur
`https://github.com/sambarnades/Conceptor.git` et le gitlink de la racine épingle
le commit `3b5c2a9d` (sommet de `isfec/main`). Le commit étant publié dans le même
dépôt, un clone récursif de la racine est valide.

### Remotes

| Dépôt de travail | Remote | URL |
|---|---|---|
| Racine (`~/Documents/Code/conceptor`) | `origin` | `github.com/sambarnades/Conceptor` |
| Submodule (`caramel/`) | `origin` | `github.com/sambarnades/Conceptor` |
| Submodule (`caramel/`) | `upstream` | `forge.apps.education.fr/caramel/caramel.forge.apps.education.fr.git` |

> **Ne jamais pousser sur `upstream` du submodule** (Forge Caramel) : c'est la
> production de l'équipe Caramel. Toute poussée ISFEC va sur `origin`.

### Visibilité et AGPL (décision D7)

Le dépôt est **public** depuis le 2026-10-13 : l'obligation AGPL v3 de fournir le
code source correspondant aux utilisateurs de l'image distribuée est couverte.
Le conserver public est la recommandation à long terme.

## Vérification d'un clone sain

```bash
cd /tmp && rm -rf conceptor-check
git clone --recurse-submodules https://github.com/sambarnades/Conceptor.git conceptor-check
cd conceptor-check
git submodule status            # doit afficher 3b5c2a9d... sans préfixe "-"
git -C caramel log --oneline -3 # doit montrer les commits ISFEC

# Reconstruire l'image depuis le clone et la tester
docker build -t conceptor-check .
docker run -d -p 8099:8000 --name conceptor-check conceptor-check
curl -s http://localhost:8099 | grep -o "<title>[^<]*</title>"   # doit afficher Conceptor
docker rm -f conceptor-check && docker rmi conceptor-check
```

## Synchronisation amont (task 0.4 de la ROADMAP)

À chaque release Caramel :

```bash
cd /home/sam/Documents/Code/conceptor/caramel
git fetch upstream --tags
git merge v<tag>                # sur isfec/main, revue des conflits
node tests/run_browser_suite.mjs   # rejouer la suite de tests du fork
```

Puis à la racine : re-pinner le submodule sur le nouveau sommet, rejouer les
recettes des phases 3 et 4 de la ROADMAP, et pousser dans l'ordre :

```bash
cd /home/sam/Documents/Code/conceptor
git add caramel && git commit -m "ISFEC : submodule sur <tag ou commit>"
git push origin main            # racine
git -C caramel push origin isfec/main   # fork (dans le même dépôt GitHub)
```

## Après la publication — mise en production

Une fois les vérifications passées, la mise en production suit la **phase 7 de la
ROADMAP** :

1. Arbitrer la décision **D8** (infrastructure IA : webhooks Caramel en l'état, ou
   relais ISFEC autonome avec clé Mistral).
2. Terminer les phases 1 (mentions légales, Matomo) et la recette 3.4 / 4.5.
3. Déployer : `docker build -t conceptor-isfec .` sur le serveur ISFEC, conteneur
   derrière nginx/Caddy + HTTPS, port hôte à choisir selon les ports déjà occupés
   (ex. `-p 8080:8000`).
