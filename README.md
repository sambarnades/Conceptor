# Conceptor — ISFEC Saint-Joseph

> **Basée sur Caramel 7.1.0** — fork ISFEC, branche `isfec/main`

**Conceptor** est l'adaptation de l'application open source [Caramel](https://forge.apps.education.fr/caramel/caramel)
destinée au centre de formation **ISFEC Saint-Joseph** (Montpellier).

Elle aide les formateurs à **concevoir des parcours et des activités Moodle** à partir de
leurs documents et références (PDF, DOCX, pages web, transcription…), afin de leur
faciliter la conception de **contenus de formation hybrides**. Les activités générées sont
de deux types : **H5P** (import direct dans Moodle) et **Moodle** (modules exportés au
format `.mbz`). Les plateformes Éléa et Magistère ne sont pas utilisées par l'ISFEC et sont
masquées dans cette version — voir la [ROADMAP](ROADMAP.md).

> **Confidentialité** : Conceptor fonctionne **sans compte et sans traceur** ; tout le
> traitement des contenus (assemblage des activités, exports H5P/MBZ) se fait dans le
> navigateur. **Exception : la génération par IA** envoie les prompts — et le cas
> échéant les images, la voix et le texte des dictées — vers les services IA de
> l'équipe Caramel (webhooks n8n, modèles ILaaS). Voir
> [Infrastructure IA](#infrastructure-ia-dépendance-externe).

## Origine et licence

- **Projet amont** : [Caramel](https://forge.apps.education.fr/caramel/caramel) —
  application conçue par des enseignants, publiée sur la Forge des communs numériques
  éducatifs.
- **Version de base** : Caramel **7.1.0** (tag `7.1.0` sur la Forge) — cette adaptation
  embarque la 7.1, pas la 7.0.
- **Licence** : [GNU AGPL v3.0 ou ultérieure](https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE).
  Cette adaptation est une **œuvre dérivée** distribuée sous la même licence.

### Engagements de conformité AGPL v3

- La licence et les mentions de copyright d'origine sont **conservées intégralement**.
- Les modifications par rapport à Caramel sont **documentées** (ce README, la
  [ROADMAP](ROADMAP.md) et l'historique Git).
- Le **code source complet** de cette version (modifications comprises) reste
  disponible auprès des utilisateurs.
- L'interface conserve le crédit **« Propulsé par Caramel »** et le lien vers le
  dépôt d'origine.

## Conteneur Docker

L'application est une application web statique servie par un conteneur
**Python 3** (`python:3.10-slim`). Aucune dépendance Python n'est nécessaire :
le module `http.server` sert les fichiers statiques.

```bash
# Construire l'image
docker build -t conceptor-isfec .

# Lancer l'application (le conteneur écoute sur 8000 ; choisir un port hôte libre)
docker run -d -p 8080:8000 --name conceptor conceptor-isfec
# → http://localhost:8080
```

> Remarque : `python -m http.server` convient pour un usage interne / un petit
> nombre d'utilisateurs simultanés. Pour une mise à disposition à l'échelle du
> centre, prévoir un serveur web dédié (nginx, Caddy…) derrière l'image.

## Infrastructure IA (dépendance externe)

Les fonctions IA de Conceptor (génération d'activités, assistant Caramelia,
transcription, vision, dictée) ne portent **aucune clé API dans le code** : le
frontend appelle des webhooks n8n centralisés dans
[`caramel/js/core/endpoints.js`](caramel/js/core/endpoints.js), aujourd'hui hébergés
par l'équipe Caramel (`n8n-caramel.osc-fr1.scalingo.io`, modèles ILaaS).

Conséquences pour la mise en production ISFEC :

- la disponibilité de ces webhooks n'est **pas garantie** pour un usage tiers ;
- pour une IA autonome (ex. clé Mistral propre à l'ISFEC), il faut déployer un
  relais backend dédié et rediriger les endpoints — voir ROADMAP, décision **D8**.

## État actuel de la personnalisation

| Élément | Emplacement | État |
|---|---|---|
| Code applicatif (fork ISFEC) | `caramel/` (submodule) | Branche `isfec/main`, base Caramel 7.1.0, 7 commits ISFEC (rebranding, masquage Éléa, parcours Moodle uniquement) |
| Page d'accueil personnalisée | `caramel/index.html` | Titre « Conceptor », filtres Éléa/Magistère commentés, assistance ISFEC, boutons Tchap/Sucrerie retirés |
| Identité visuelle | `caramel/assets/images/branding/` | `m-conceptorLogo.svg` / `.png` / `.ico` commités dans le fork |
| Conteneur | `Dockerfile` | Copie le fork `caramel/` — aucun réseau au build, image reproductible |
| Masquage Éléa/Magistère | `js/core/definitions.js`, `js/parcours/config.js` | Modules Éléa-only masqués ; atelier de parcours limité à Moodle |
| Publication | GitHub `sambarnades/m-conceptor` | Voir [`GUIDE-PUSH.md`](GUIDE-PUSH.md) |

## Documentation complémentaire

- [`ROADMAP.md`](ROADMAP.md) — plan de personnalisation détaillé (rebranding, masquage
  Éléa/Magistère, parcours, conformité AGPL).
- [`GUIDE-PUSH.md`](GUIDE-PUSH.md) — procédure de publication des dépôts (fork + racine).
- Documentation du projet amont : [`caramel/README.md`](caramel/README.md),
  [`caramel/docs/`](caramel/docs/).

## Contact

- Assistance : samuel.barnades@isfec-montpellier.org
