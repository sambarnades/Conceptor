# GUIDE-PUSH — Publier Conceptor (fork + dépôt racine)

Procédure de première publication des deux dépôts Git de Conceptor :

- **Dépôt racine** : `m-conceptor` (https://github.com/sambarnades/m-conceptor) —
  documents de pilotage (`README.md`, `ROADMAP.md`, ce guide) et build Docker
  (`Dockerfile`, `.dockerignore`, `.gitignore`, `.gitmodules`).
- **Fork applicatif** : `caramel/` (branche `isfec/main`, base Caramel 7.1.0) —
  tout le code Conceptor. Il doit vivre dans **son propre dépôt GitHub**, sinon le
  submodule de la racine pointe vers des commits qui n'existent nulle part et tout
  clone de `m-conceptor` est cassé.

> **Ne jamais pousser sur `main` du dépôt Caramel amont** (Forge) : c'est la
> production de l'équipe Caramel. Les remotes ci-dessous verrouillent ce point.

---

## 0. Pré-requis

- Compte GitHub (`sambarnades`) authentifié (`gh auth login` ou HTTPS + PAT).
- Tout est déjà commité en local : vérifier `git status` dans `caramel/` **et** à la
  racine — aucun fichier ne doit apparaître en « modifié / non suivi ».

## 1. Créer le dépôt du fork sur GitHub

```bash
gh repo create sambarnades/m-conceptor-app --public \
  --description "Fork ISFEC de Caramel (Conceptor) — base Caramel 7.1.0, branche isfec/main"
```

(ou via l'interface GitHub : New repository → nom `m-conceptor-app`, **sans** README
ni licence — le contenu vient du fork local).

> Nom : `m-conceptor-app`, car `m-conceptor` est déjà pris par le dépôt racine. Un
> autre nom est possible : remplacer systématiquement
> `sambarnades/m-conceptor-app` ci-dessous.
> Rendre le dépôt **public** couvre l'obligation AGPL (décision D7) ; un dépôt
> interne reste le minimum acceptable si les formateurs y ont accès.

## 2. Publier le fork (`caramel/`)

```bash
cd /home/sam/Documents/Code/conceptor/caramel

# Renommer le remote amont (la Forge Caramel devient "upstream")
git remote rename origin upstream

# Ajouter le fork ISFEC comme "origin"
git remote add origin https://github.com/sambarnades/m-conceptor-app.git

# Publier la branche de travail
git push -u origin isfec/main
```

Vérifier : `git remote -v` doit montrer `origin` → GitHub fork, `upstream` → Forge.
Le suivi amont reste possible : `git fetch upstream` pour les releases Caramel
(procédure 0.4 de la ROADMAP).

## 3. Pointer le submodule de la racine sur le fork

Dans `/home/sam/Documents/Code/conceptor` :

```bash
# Mettre à jour l'URL du submodule
sed -i 's|url = https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr.git|url = https://github.com/sambarnades/m-conceptor-app.git|' .gitmodules

git config submodule.caramel.url https://github.com/sambarnades/m-conceptor-app.git
```

## 4. Commiter la racine

```bash
cd /home/sam/Documents/Code/conceptor
git add .gitmodules .gitignore .dockerignore Dockerfile README.md ROADMAP.md GUIDE-PUSH.md caramel
git commit -m "ISFEC : socle de publication — submodule pointant le fork, .gitignore, docs (README/ROADMAP/GUIDE-PUSH), Dockerfile COPY"
```

`git add caramel` enregistre le gitlink : l'épinglage passe du commit amont 7.1.0
au sommet de `isfec/main` (commits ISFEC compris).

## 5. Pousser la racine

```bash
git push origin main
```

> `main` de la racine est le dépôt de pilotage ISFEC — la pousser est sûre ; ce
> n'est pas le `main` de Caramel. Une seule poussée par session suffit ; ne jamais
> `--force-push` sans `--force-with-lease`.

## 6. Vérification (contrôle qualité de la publication)

```bash
# Cloner à plat dans un répertoire temporaire et vérifier le submodule
cd /tmp && rm -rf conceptor-check
git clone --recurse-submodules https://github.com/sambarnades/m-conceptor.git conceptor-check
cd conceptor-check
git submodule status          # doit afficher le commit isfec/main, sans préfixe "-"
git -C caramel log --oneline -3   # doit montrer les commits ISFEC
diff -r --exclude=.git caramel /home/sam/Documents/Code/conceptor/caramel && echo "fork identique"

# Reconstruire l'image depuis le clone et la tester
docker build -t conceptor-check .
docker run -d -p 8099:8000 --name conceptor-check conceptor-check
curl -s http://localhost:8099 | grep -o "<title>[^<]*</title>"   # doit afficher Conceptor
docker rm -f conceptor-check && docker rmi conceptor-check
```

## 7. Après la publication — mise en production

Une fois ces vérifications passées, la mise en production suit la **phase 7 de la
ROADMAP** :

1. Arbitrer la décision **D8** (infrastructure IA : webhooks Caramel en l'état, ou
   relais ISFEC autonome avec clé Mistral).
2. Terminer les phases 1 (mentions légales, Matomo) et la recette 3.4 / 4.5.
3. Déployer : `docker build -t conceptor-isfec .` sur le serveur ISFEC, conteneur
   derrière nginx/Caddy + HTTPS, port hôte à choisir selon les ports déjà occupés
   (ex. `-p 8080:8000`).

## Résumé en une commande par dépôt

| Dépôt | Commande |
|---|---|
| Fork (`caramel/`) | `git push -u origin isfec/main` |
| Racine (`conceptor/`) | `git push origin main` |
