# ROADMAP — Personnalisation de Conceptor (ISFEC Saint-Joseph)

Plan de personnalisation de [Caramel](https://forge.apps.education.fr/caramel/caramel)
pour l'ISFEC Saint-Joseph. Rédigé sur la constatation d'une surcouche v7.0.1 ; le fork
est aujourd'hui basé sur **Caramel 7.1.0** (branche `isfec/main`). Mise à jour :
2026-10-13. Objectifs :

1. Documenter et outiller le fork en restant conforme à la **licence AGPL v3**.
2. Finir le **rebranding** Conceptor.
3. **Masquer / retirer** les activités Éléa et Magistère : seuls **H5P** et **Moodle**
   concernent l'ISFEC.
4. Adapter l'atelier **parcours complet** à Moodle/H5P uniquement.

Les chemins de fichiers sont relatifs au dossier `caramel/` (code applicatif) ou à la
racine du dépôt (conteneur, surcouches).

---

## Phase 0 — Socle technique : tout vivre dans `caramel/`

**Décision structurante (D1)** : `caramel/` devient le fork ISFEC et l'unique base de
travail. Le build Docker ne clône plus amont : il copie le code du fork présent dans
le build context. Concrètement, les personnalisations aujourd'hui posées à la racine
(`index.html`, `branding/`) migrent **dans** `caramel/` sous forme de commits.

État au 2026-10-09 (constat initial revu — le socle est en place) :

- `caramel/` est bien un **submodule Git** (gitlink `160000` dans l'index racine) ;
  `.gitmodules` pointe désormais sur le **dépôt fork ISFEC publié**
  (`github.com/sambarnades/Conceptor`). Le gitlink référence un commit publié :
  un clone récursif de la racine est valide.
- Le `Dockerfile` est réécrit en `COPY` (plus de `apt-get`, plus de `git`, aucun réseau
  au build) — l'image embarque exactement le code du fork épinglé.
- L'incohérence de version est résolue : les personnalisations ont été ré-appliquées
  sur `caramel/index.html` (7.1.0) et commitées dans le fork (branche `isfec/main`,
  7 commits ISFEC au 2026-10-09).
- Publication effectuée le **2026-10-13** (dépôt unique, voir 0.1 et D1/D7) ;
  procédure de synchronisation amont dans [`GUIDE-PUSH.md`](GUIDE-PUSH.md).

Tâches :

- **0.1** (✅ fait, 2026-10-13) Publication sur un **dépôt GitHub unique**
  (`github.com/sambarnades/Conceptor`, ancien `m-conceptor` renommé) : `main` =
  racine de pilotage, `isfec/main` = fork applicatif. Remotes : racine `origin` =
  Conceptor ; submodule `caramel/` : `origin` = Conceptor, `upstream` = Forge
  Caramel. `.gitmodules` pointe sur Conceptor et le gitlink (`3b5c2a9d`) est
  publié. **Décision révisée (D1/D7)** : un seul dépôt, deux branches. Le dépôt
  est **public** (passé en public le 2026-10-13) — obligation AGPL couverte.
- **0.2** (✅ fait) Migrer la personnalisation dans le fork : ré-appliquer les
  modifications de l'`index.html` racine sur `caramel/index.html` (7.1.0), copier
  `branding/` dans `caramel/assets/images/branding/`, commiter chacun de ces
  changements avec un message explicite (« ISFEC : rebranding Conceptor », « ISFEC :
  masquage des modules Éléa-only », « ISFEC : atelier de parcours limité à Moodle »).
- **0.3** (✅ fait) Réécrire le `Dockerfile` :

  ```dockerfile
  FROM python:3.10-slim-trixie
  WORKDIR /usr/src/app
  COPY caramel/ /usr/src/app/
  CMD ["python3", "-m", "http.server", "8000"]
  ```

  Plus de `apt-get`, plus de `git`, plus de réseau au build : l'image est
  reproductible et la version Caramel embarquée est celle du tag Git du contexte.
- **0.4** Définir la procédure de synchronisation amont : à chaque release Caramel,
  `git fetch upstream && git merge <tag>` dans le fork, revue des conflits, puis
  rejouer la recette (phases 3 et 4).

La racine du dépôt ne conserve que les documents de pilotage et de build :
`Dockerfile`, `.dockerignore`, `.gitignore`, `README.md`, `ROADMAP.md`,
`GUIDE-PUSH.md`, `.gitmodules` (pointant le fork) — le fork étant l'unique code
applicatif.

**Critères d'acceptation** : ✅ `docker build` reproductible (aucun réseau au build) ;
✅ `docker run` affiche Conceptor ; ✅ version Caramel embarquée documentée (7.1.0,
branche `isfec/main`) ; ✅ l'historique Git du fork distingue clairement les commits
amont des commits ISFEC ; ✅ dépôt fork publié et gitlink pointant dessus (0.1).

---

## Phase 1 — Conformité AGPL v3

- **1.1** Conserver `caramel/LICENSE` et les en-têtes de copyright dans tous les
  fichiers modifiés (ne jamais retirer une mention d'auteur).
- **1.2** Crédit permanent dans l'UI : lien « Propulsé par Caramel » vers la Forge
  (déjà présent dans le footer de `index.html`) — à **garder** lors des phases
  suivantes.
- **1.3** Documenter les modifications : ce README, la liste des fichiers modifiés
  (diff fork vs upstream version épinglée). Option : un fichier `NOTICE-ISFEC.md`
  dans le dépôt du fork.
- **1.4** Publication du **code source correspondant** à l'image Docker distribuée
  aux formateurs (dépôt accessible — interne ISFEC au minimum, public de préférence).
- **1.5** Mettre à jour les **mentions légales** : module
  `js/ui/mentions-legales.js` + `assets/data/` (propriétaire : ISFEC Saint-Joseph,
  hébergeur, traitement de données). Attention : `caramel/index.html` embarque
  encore le **tracker Matomo de `phm.education.gouv.fr`** (confirmé le 2026-10-13) —
  le retirer (recommandé pour un établissement privé) ou le remplacer par une
  instance propre, et le déclarer dans les mentions légales.

**Critères d'acceptation** : LICENSE intacte ; crédits visibles ; source publiée ;
mentions légales exactes ; aucun appel réseau vers phm.education.gouv.fr.

---

## Phase 2 — Finition du rebranding Conceptor

Résidus « Caramel » identifiés dans `caramel/index.html` (fork 7.1.0) :

- **2.1** Modale de résultat : `assets/images/branding/logo_caramel.svg` (logo Caramel,
  2 occurrences : modale de génération et modale tutoriel) → remplacer par le logo
  Conceptor (le branding copié dans l'image ne contient pas de `.svg`, à créer ou
  réutiliser le `.png`).
- **2.2** Footer : libellé « Caramel v7.0.1 » → version Conceptor + version Caramel
  amont épinglée ; lien « Découvrir Caramel » (dossier `decouvrir/`) à masquer ou
  rediriger.
- **2.3** Animation de chargement « marmite » (`#caramel-animation-overlay`) : la garder
  est possible, mais revoir les textes si nécessaires.
- **2.4** Sucrerie-bridge (partage vers « La Sucrerie ») : déjà masqué en CSS ;
  décider de le retirer du `index.html` et des imports JS pour alléger.
- **2.5** (✅ corrigé dans le fork) Favicon / meta : `caramel/index.html` référence
  désormais le SVG avec `type="image/svg+xml"` et le PNG avec `type="image/png"` ;
  `m-conceptorLogo.ico` est commité mais non référencé — à câbler ou à retirer.

**Critères d'acceptation** : parcours complet de l'UI sans mention « Caramel » hors
crédits licence ; console sans erreur 404 (logo supprimé).

---

## Phase 3 — Masquage des activités Éléa / Magistère (grille d'activités)

Inventaire technique (code réel du dépôt) :

- Définitions : `caramel/js/core/definitions.js`
  - `h5pModules` : toutes les tuiles H5P — **à garder**.
  - `moodleModules` :
    - compatibles Moodle via export `.mbz` : `test_elea` (Test), `glossaireXml`
      (Glossaire), `Page`, `Livre`, `Devoir` — **à garder, décision à valider en
      recette** (voir 3.4) ;
    - Éléa uniquement (`platforms: ["Éléa"]`) : `Millionnaire`, `Appariement`,
      `QCM` ; `gift` est déjà `hidden: true`.
- Rendu et filtres : `caramel/js/ui/ui.js`
  (`renderTile` saute les modules `hidden`, `applyFilters`, `PLATFORM_BADGES`,
  logique « Magistère visible uniquement en français »).
- Chips de filtre : `index.html` racine — les chips Éléa et Magistère sont déjà
  commentées.

Tâches :

- **3.1** (✅ fait — commit « ISFEC : masquage des modules Éléa-only »)
  `definitions.js` : `hidden: true` sur `Millionnaire`, `Appariement`, `QCM`
  (et `gift` masqué). Ne pas supprimer les définitions : les autres modules et le
  garde-fou `tests/test-activity-wiring` les référencent.
- **3.2** `ui.js` : badge par défaut des tuiles non-H5P = « Moodle » au lieu
  « Éléa » (`PLATFORM_BADGES` et `applyFilters`) ; supprimer la logique du chip
  Magistère.
- **3.3** `index.html` : retirer proprement les chips commentées, les CSS
  `css/simulators/elea-*.css` liées aux modules masqués, et vérifier les
  libellés `js/locales/*.json` (clés `tab_elea`, `tab_magistere` deviennent inutilisées —
  suppression optionnelle).
- **3.4** Recette des modules conservés : importer dans le **Moodle de recette ISFEC**
  les exports `.mbz` de Test, Devoir, Page, Livre, Glossaire. Certains MBZ peuvent
  dépendre de greffons Éléa (cf. `js/parcours/activity-router.js` : « greffon d'Éléa
  ou de Magistère sans casser sur un Moodle nu »). Tout module dont l'import échoue
  sur Moodle nu est masqué à son tour.

**Critères d'acceptation** : la grille ne propose que des activités H5P et Moodle ;
tous les exports proposés s'importent dans le Moodle ISFEC ; la suite de tests Node
du dépôt (`node tests/run_browser_suite.mjs` et consorts) passe.

---

## Phase 4 — Parcours complet orienté Moodle / H5P

L'atelier « Parcours » (cadrage → plan → fabrication → livraison) est piloté par
`caramel/js/parcours/`. Points Elea/Magistère identifiés :

- **4.1** `config.js` : (✅ partiel — plateformes Éléa/Magistère retirées, commit
  « ISFEC : atelier de parcours limité à Moodle ») reste à faire :
  `defaults.platform: 'elea'` → `'moodle'` ; nettoyer les `platformLabels`
  Éléa/Magistère dans `formats`.
- **4.2** `activity-router.js` : repli par défaut `'Éléa'` → `'Moodle'` ;
  revoir la logique de remplacement des « greffons d'Éléa/Magistère » par des
  activités Moodle nu (elle devient inutile si tout est Moodle).
- **4.3** `carte-progression.js` : la Carte de progression est une fonctionnalité
  propre à Éléa (D26) — à retirer de l'interface ou à remplacer par une alternative
  Moodle (ex. restriction d'accès / achèvement d'activité).
- **4.4** Passer en revue les modules de la palette parcours
  (`modules-natifs.js`, `modules-parcours.js`, `modules-socle.js`,
  `vocabulaire.js`, `scenario-prompt.js`, `composition-plan.js`) pour exclure toute
  activité Éléa-only du plan généré par l'IA.
- **4.5** Recette bout en bout : cadrage → plan → fabrication → livraison d'un
  parcours complet Moodle/H5P depuis un corpus de documents, puis import dans le
  Moodle ISFEC.

**Critères d'acceptation** : un parcours généré ne contient aucune activité
Éléa/Magistère ; l'export du parcours s'importe dans Moodle.

---

## Phase 5 — Tutoriel, guides et contenus

- **5.1** `assets/data/tutorial/fr.json` : retirer / réécrire les sections Éléa et
  Magistère (les 12 fichiers de langue seront concernés ; priorité au `fr`).
- **5.2** Dossier `decouvrir/` (vitrine Caramel) : masquer l'entrée dans le footer,
  puis décider : reprise dérivée à l'effigie de Conceptor, ou suppression pure.
- **5.3** `assets/templates/editor-help/elea_*.html` : conservés tant que les
  modules MBZ correspondants sont visibles (le préfixe `elea_` est un identifiant
  interne, pas une mention visible).
- **5.4** Rédiger le **guide formateur ISFEC** (usage de Conceptor, import Moodle,
  import H5P) — support dédié, distinct du tutoriel intégré.

---

## Phase 6 — Industrialisation et suivi

- **6.1** Intégrer la suite de tests du dépôt (`caramel/tests/`) dans la vérification
  de chaque livraison (Node requis sur le poste de dev ou en CI).
- **6.2** Versionner les livraisons : `conceptor-<x.y.z>+caramel-<tag>` ; tenir un
  CHANGELOG ISFEC.
- **6.3** CI/CD : build automatique de l'image Docker à chaque tag, publication sur
  une registry interne.
- **6.4** Procédure de veille amont : suivre les releases Caramel, rebaser le fork,
  rejouer la recette (phases 3 et 4).

---

## Phase 7 — Mise en production sur le serveur de l'ISFEC

Pré-requis : phases 0 (publication) et 1 terminées ; D8 arbitrée.

- **7.1** Choisir le mode d'hébergement : conteneur Docker seul (`python
  http.server`, adapté à un petit nombre d'utilisateurs) derrière un reverse proxy
  (nginx/Caddy) avec HTTPS, ou serveur web statique dédié.
- **7.2** Règles réseau : exposer le port du conteneur uniquement via le proxy ;
  vérifier que l'application reste joignable depuis les postes formateurs et que
  les webhooks IA (D8) sont atteignables depuis les navigateurs.
- **7.3** Recette de production : parcours complet de l'UI, génération d'une
  activité H5P et d'un module MBZ, imports dans le Moodle ISFEC, vérification des
  mentions légales (1.5) et du crédit « Propulsé par Caramel » (1.2).
- **7.4** Documentation formateurs : URL de production, guide d'import Moodle/H5P
  (cf. 5.4), contact assistance.
- **7.5** Suivi : sauvegarde n/a (application statique), veille amont (6.4),
  CHANGELOG (6.2).

---

## Récapitulatif des décisions à valider

| # | Décision | Recommandation | État |
|---|---|---|---|
| D1 | Architecture : tout dans `caramel/` (fork) vs surcouche racine | Fork dans `caramel/` en **submodule** pointant sur le dépôt fork ISFEC ; Dockerfile en `COPY` | Fait — submodule publié ; **dépôt unique** Conceptor (`main` + `isfec/main`) |
| D2 | Modules MBZ compatibles Moodle (Test, Devoir, Page, Livre, Glossaire) | Garder, après recette d'import dans Moodle nu | En attente de recette (3.4) |
| D3 | Modules Éléa-only (Millionnaire, Appariement, QCM) | Masquer (`hidden: true`), ne pas supprimer | Fait |
| D4 | Tracker Matomo (phm.education.gouv.fr) | Retirer | Confirmé présent dans `caramel/index.html` — à retirer (1.5) |
| D5 | Vitrine `decouvrir/` | Masquer dans un premier temps | À faire (5.2) |
| D6 | Carte de progression (Éléa-only) dans le parcours | Retirer ; alternative Moodle plus tard si besoin | À faire (4.3) |
| D7 | Publication du code source du fork | Dépôt accessible aux utilisateurs (interne minimum) | Fait — dépôt `sambarnades/Conceptor` **public** (obligation AGPL couverte) |
| D8 | Infrastructure IA : dépendance aux webhooks n8n de l'équipe Caramel | **Nouveau constat** : aucune clé API dans le code ; tous les appels IA (génération, Caramelia, transcription, vision, dictée) passent par `n8n-caramel.osc-fr1.scalingo.io` (ILaaS). Court terme : utiliser tel quel en sachant que la disponibilité n'est pas garantie. Autonomie : déployer un relais backend ISFEC (n8n ou petit serveur) portant une clé Mistral propre, et rediriger `js/core/endpoints.js` | À trancher avant la mise en production |
