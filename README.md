# Caramel

**Création Assistée de Ressources et d'Activités Moodle et Éléa**

[![Version](https://img.shields.io/badge/version-3.3.9-blue.svg)](https://caramel.forge.apps.education.fr/)
[![Licence](https://img.shields.io/badge/licence-GNU%20AGPLv3-green.svg)](LICENSE)
[![Plateforme](https://img.shields.io/badge/plateforme-Web-orange.svg)](https://caramel.forge.apps.education.fr/)

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Types d'activités supportées](#-types-dactivités-supportées)
- [Accès et utilisation](#-accès-et-utilisation)
- [Modes de fonctionnement](#-modes-de-fonctionnement)
- [Architecture technique](#-architecture-technique)
- [Modèles d'IA disponibles](#-modèles-dia-disponibles)
- [Multilinguisme](#-multilinguisme)
- [Sécurité et confidentialité](#-sécurité-et-confidentialité)
- [Installation locale](#-installation-locale)
- [Structure du projet](#-structure-du-projet)
- [Contribution](#-contribution)
- [Licence](#-licence)
- [Contact et support](#-contact-et-support)

---

## 🎯 À propos

**Caramel** est une application web libre, gratuite et sans compte, conçue pour simplifier la **création d'activités pédagogiques interactives** via l'intelligence artificielle. Développée par et pour les enseignants de l'Éducation nationale française, elle automatise la production de contenus H5P et Moodle/Éléa/Magistère.

### Principe de fonctionnement

1. **Saisie du contexte pédagogique** : discipline, niveau, thème, nombre d'items
2. **Génération automatique de prompts IA** optimisés pour chaque type d'activité
3. **Appel à l'IA** via l'infrastructure souveraine ilaaS (Enseignement supérieur français)
4. **Conversion instantanée** en fichiers `.h5p` (H5P) ou `.mbz` (Moodle/Éléa)
5. **Téléchargement direct** prêt à importer dans Moodle/Éléa/Magistère

### Caractéristiques principales

- ✅ **100% client-side** : aucune donnée pédagogique ne quitte le navigateur
- ✅ **Sans compte** : aucune inscription ni authentification requise
- ✅ **Sans collecte de données** : respect total de la vie privée (RGPD)
- ✅ **Multi-plateforme** : compatible Moodle, Éléa, Magistère
- ✅ **Multilingue** : interface disponible en 11 langues
- ✅ **IA souveraine** : modèles hébergés sur infrastructure française (ilaaS)

---

## ⚡ Fonctionnalités principales

### Génération assistée par IA

- **Prompts pré-configurés** : modèles optimisés pour chaque type d'activité
- **6 modèles IA** disponibles via ilaaS (Mistral, Llama, GPT-OSS, Qwen)
- **RAG (Retrieval-Augmented Generation)** : enrichissement via upload de PDFs
- **OCR intégré** : extraction de texte depuis documents scannés (Tesseract.js)
- **Limite de contexte** : jusqu'à 120 000 caractères pour le RAG

### Exports multi-formats

- **Fichiers H5P** (`.h5p`) : archives ZIP auto-contenues importables directement
- **Backups Moodle** (`.mbz`) : archives compressées (TAR+GZIP) prêtes pour restauration
- **Exports XML** : format GIFT/Moodle pour glossaires et questions

### Interface intuitive

- **Design glassmorphism** inspiré d'iOS
- **Navigation par onglets** : Quiz, Texte, Mémorisation, Éléa, Autres, Expérimentaux
- **Notifications toast** : retours visuels non-intrusifs
- **Mode responsive** : adapté ordinateurs et tablettes
- **Thèmes clairs/sombres** : adaptation au système d'exploitation

---

## 📚 Types d'activités supportées

### Activités H5P (18 types)

#### 🧠 Quiz & Tests
- **QuizSet** : ensembles de questions variées (QCM, vrai/faux, glisser-déposer)
- **TrueFalse** : questions vrai/faux simples
- **MultipleChoice** : questions à choix multiples (une question unique)
- **SingleChoiceSet** : séries de choix uniques

#### ✏️ Manipulation de texte
- **DragTheWords** : glisser-déposer de mots dans un texte
- **FillInTheBlanks** : textes à trous avec validation
- **MarkTheWords** : sélection de mots corrects dans un texte
- **SortParagraphs** : réorganisation de paragraphes
- **Essay** : rédaction libre avec grille de mots-clés
- **Summary** : création de résumés interactifs

#### 🎴 Mémorisation & Découverte
- **Flashcards** : cartes mémoire recto-verso
- **Timeline** : frises chronologiques interactives
- **Crossword** : mots croisés générés automatiquement
- **DialogCards** : cartes de dialogue pour révision
- **FindTheWords** : grilles de recherche de mots cachés
- **Glossary/Accordion** : glossaires déroulants
- **Chart** : graphiques et diagrammes visuels

### Activités Moodle/Éléa (7 types)

#### 📝 Tests et questionnaires
- **QCM (XML)** : questions à choix multiples format Moodle
- **Appariement** : association de paires (questions-réponses)
- **Millionnaire** : jeu du Qui veut gagner des millions
- **Moodle XML (GIFT)** : export universel format GIFT

#### 📖 Contenus riches
- **Page Éléa** : pages HTML avec 18 types de blocs (texte, image, vidéo, citation, etc.)
- **Glossaire XML** : dictionnaires de termes importables

---

## 🚀 Accès et utilisation

### Accès direct en ligne

L'application est accessible sans installation à l'adresse :

**[https://caramel.forge.apps.education.fr/](https://caramel.forge.apps.education.fr/)**

### Prérequis techniques

| Élément | Minimum requis |
|---------|----------------|
| **Navigateur** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **Connexion** | Internet (obligatoire pour appels IA) |
| **JavaScript** | Activé |
| **Stockage** | Aucun (pas de localStorage) |
| **Serveur** | Aucun (application statique) |

---

## 🎨 Modes de fonctionnement

### Mode Rapide

Interface simplifiée en 2 champs pour génération express :

1. **Qui êtes-vous ?** (ex : _Professeur de lycée_, _Formateur Magistère_)
2. **Que souhaitez-vous aborder ?** (ex : _La photosynthèse en 2nde_)

→ Caramel génère automatiquement un prompt optimisé.

### Mode Avancé (Guidé)

Interface complète avec paramètres détaillés :

1. **Discipline** (ex : Histoire, Mathématiques, SVT)
2. **Thème** (ex : La Révolution française, Les fractions)
3. **Niveau** (ex : 6e, Seconde professionnelle, Licence 1)
4. **Nombre d'éléments** (ex : 10 questions, 15 flashcards)
5. **RAG (optionnel)** :
   - Upload de fichiers PDF (glisser-déposer)
   - Extraction de texte via OCR (Tesseract.js)
   - Coloration des PDFs traités
   - Édition manuelle du contexte (120 000 caractères max)
   - Verrouillage du champ pour protection

### Workflow complet

```
┌─────────────────────────────────────────────────────────────┐
│  1. Saisie du contexte (Mode Rapide ou Avancé)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Sélection du type d'activité (clic sur tuile)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Modale de génération avec :                             │
│     - Prompt pré-généré (modifiable)                        │
│     - Sélection du modèle IA                                │
│     - Bouton "Générer avec l'IA"                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Appel API via n8n → ilaaS                               │
│     - Requête POST chiffrée                                 │
│     - Parsing JSON de la réponse                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Édition manuelle (optionnelle)                          │
│     - Textarea JSON affichée                                │
│     - Correction/personnalisation possible                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Création du fichier                                     │
│     - Validation JSON                                       │
│     - Adaptations spécifiques au type                       │
│     - Packaging (ZIP/TAR/GZ)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Téléchargement                                          │
│     - .h5p (H5P)                                            │
│     - .mbz (Moodle/Éléa)                                    │
│     - .xml (Glossaires)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Architecture technique

### Stack technologique (100% frontend)

#### Bibliothèques de compression
- **[JSZip](https://stuk.github.io/jszip/)** (MIT/GPL) : création d'archives `.h5p` (ZIP)
- **[fflate](https://github.com/101arrowz/fflate)** (MIT) : compression GZIP ultra-rapide
- **[tar-js](https://github.com/ankitrohatgi/tarballjs)** (MIT) : archives TAR pour `.mbz`
- **[client-zip](https://github.com/Touffy/client-zip)** (MIT) : compression via Web Workers

#### Traitement de documents
- **[PDF.js](https://mozilla.github.io/pdf.js/)** (Apache 2.0) : extraction de texte PDF
- **[Tesseract.js](https://tesseract.projectnaptha.com/)** (Apache 2.0) : OCR multilingue

#### Interface utilisateur
- **[Font Awesome](https://fontawesome.com/)** (CC BY 4.0/MIT/SIL OFL) : bibliothèque d'icônes
- **[flag-icons](https://github.com/lipis/flag-icons)** (MIT) : drapeaux pour sélecteur de langue
- **CSS personnalisé** : glassmorphism, grid dynamique, animations

### Principes architecturaux

#### Traitement full-client
- **Aucune donnée pédagogique ne quitte le navigateur** (sauf prompts IA)
- Génération des fichiers H5P et `.mbz` entièrement côté client
- OCR et extraction PDF réalisés localement (Tesseract.js, PDF.js)
- Pas de stockage persistant (ni localStorage, ni cookies)

#### Intégration IA sécurisée

```
┌─────────────┐      HTTPS      ┌──────────────┐     HTTPS     ┌─────────┐
│   Caramel   │ ────────────────>│ n8n Workflow │ ────────────>│  ilaaS  │
│  (Browser)  │  POST /webhook   │ (Incubateur) │  POST model  │ (GPU FR)│
└─────────────┘                  └──────────────┘               └─────────┘
      │                                  │                           │
      │ 1. Génération prompt             │                           │
      │ 2. Sélection modèle              │                           │
      │ 3. POST { prompt, model }        │                           │
      │                                  │ 4. Transmission sécurisée │
      │                                  │ 5. Exécution GPU          │
      │                                  │ 6. Réponse JSON           │
      │ 7. Parsing et affichage          │                           │
      │ 8. Création fichier local        │                           │
      └──────────────────────────────────────────────────────────────┘
```

**Points clés** :
- Proxy n8n : `https://n8n.incubateur.education.gouv.fr/webhook/llm`
- Clés API gérées côté serveur (non exposées en frontend)
- Réponses JSON flexibles (support multiples formats de réponse)
- Infrastructure ilaaS : data centers ESR français labellisés

---

## 🤖 Modèles d'IA disponibles

Caramel utilise l'infrastructure **[ilaaS](https://ilaas.fr/)** (Infrastructure de LLMs as a Service) via l'Incubateur du Ministère de l'Éducation nationale.

### Modèles proposés (6 au total)

| Modèle | Paramètres | Featured | Organisation |
|--------|------------|----------|--------------|
| **Mistral Small 3.2** | 24B | ⭐ | Mistral AI |
| **Llama 3.3** | 70B | ⭐ | Meta/RedHat AI |
| **GPT-OSS** | 120B | ⭐ | OpenAI |
| **Qwen 2.5** | 3B | | Alibaba Cloud |
| **Llama 3.1** | 8B | | Meta |
| **Qwen 3** | 30B | | Alibaba Cloud |

### Hébergement et confidentialité

- **Hébergement** : data centers labellisés de l'Enseignement supérieur et de la recherche (ESR)
- **Souveraineté** : infrastructure 100% française (pas d'IA grand public US/CN)
- **Confidentialité** : requêtes traitées uniquement pour exécution, pas de réentraînement
- **Journalisation** : selon politique de confidentialité ilaaS (consulter leurs CGU)

---

## 🌍 Multilinguisme

Interface disponible en **11 langues** :

| Langue | Code | Drapeau |
|--------|------|---------|
| Français | `fr` | 🇫🇷 |
| English | `en` | 🇬🇧 |
| Español | `es` | 🇪🇸 |
| Deutsch | `de` | 🇩🇪 |
| Italiano | `it` | 🇮🇹 |
| Nederlands | `nl` | 🇳🇱 |
| Português | `pt` | 🇵🇹 |
| عربي | `ar` | 🇸🇦 |
| 中文 | `zh` | 🇨🇳 |
| 日本語 | `jp` | 🇯🇵 |
| Ελληνικά | `el` | 🇬🇷 |

### Système de traduction

- **Chargement asynchrone** : fichiers `/js/translations/{lang}.js`
- **Traduction dynamique** : via attributs `data-key` dans le DOM
- **OCR multilingue** : Tesseract.js supporte toutes les langues listées
- **Prompts adaptés** : génération de contenus dans la langue sélectionnée

---

## 🔒 Sécurité et confidentialité

### Conformité RGPD

- ✅ **Aucune donnée personnelle collectée**
- ✅ **Aucun cookie de suivi**
- ✅ **Pas de localStorage** (sauf version notifiée en sessionStorage)
- ✅ **Pas de compte utilisateur**
- ✅ **Traitement local** : fichiers générés dans le navigateur

### Mentions légales

**Éditeurs** :
- **Gauthier REMANDE** – PLP Lettres-Histoire (Académie de Nantes)
- **Emmanuel GAUNARD** – Professeur de mathématiques et chargé de mission DRANE (Académie de Grenoble)

**Hébergement** :
- **Forge des Communs Numériques Éducatifs**
- Ministère de l'Éducation nationale et de la Jeunesse
- 110 rue de Grenelle, 75007 Paris, France

**Licence** :
- Code source : **GNU Affero General Public License v3** (AGPLv3)
- Réutilisation libre avec attribution obligatoire des auteurs originaux

### Traitement des données IA

- **Requêtes IA** : transmises via workflow n8n chiffré → ilaaS
- **Utilisation** : uniquement pour exécution de la requête courante
- **Stockage** : pas de conservation de prompts/réponses par Caramel
- **Serveurs** : infrastructure ESR française (pas d'envoi vers IA commerciales)

---

## 💻 Installation locale

### Prérequis

- Serveur web statique (Apache, Nginx, Python HTTP server, etc.)
- Navigateur moderne

### Méthode 1 : Clonage du dépôt

```bash
# Cloner le dépôt
git clone https://forge.apps.education.fr/caramel/caramel.git
cd caramel

# Serveur HTTP Python (exemple)
python3 -m http.server 8000

# Accès : http://localhost:8000
```

### Méthode 2 : Téléchargement direct

1. Télécharger l'archive du dépôt
2. Extraire dans un dossier
3. Ouvrir `index.html` dans un navigateur
   - **Note** : certaines fonctionnalités (OCR, génération IA) nécessitent un serveur HTTP

### Configuration

Aucune configuration requise ! L'application est pré-configurée pour utiliser :
- L'API n8n de l'Incubateur (proxy ilaaS)
- Les modèles IA par défaut
- Les traductions embarquées

---

## 📁 Structure du projet

```
caramel/
│
├── index.html ........................ Page unique de l'application
│
├── css/
│   ├── style.css ..................... Styles principaux (52 KB)
│   ├── custom.css .................... Personnalisations (9 KB)
│   ├── llm.css ....................... Sélecteur de modèles IA
│   ├── modale-aide.css ............... Modal tutoriel
│   ├── mentions-legales.css .......... Page légale
│   ├── all.min.css ................... Font Awesome
│   └── flag-icons.min.css ............ Drapeaux pays
│
├── js/
│   ├── main.js ....................... Point d'entrée (38 lignes)
│   │
│   ├── modules/ ...................... Modules fonctionnels
│   │   ├── definitions.js ............ Configuration des 27 activités
│   │   ├── prompt-generator.js ....... Génération prompts IA (783 lignes)
│   │   ├── h5p-creator.js ............ Packaging H5P (600+ lignes)
│   │   ├── moodle-creator.js ......... Packaging Moodle/Éléa (900+ lignes)
│   │   ├── llm.js .................... Intégration IA n8n
│   │   ├── ui.js ..................... Interface & interactions
│   │   ├── ocr.js .................... OCR Tesseract.js
│   │   ├── translation.js ............ i18n multilingue
│   │   ├── utils.js .................. Fonctions utilitaires
│   │   ├── animations.js ............. Effets visuels
│   │   ├── version-checker.js ........ Notifications de mise à jour
│   │   └── emergency-notification.js . Bandeaux d'urgence
│   │
│   ├── libs/ ......................... Bibliothèques tierces
│   │   ├── jszip/ .................... JSZip (création ZIP)
│   │   ├── fflate/ ................... fflate (compression GZIP)
│   │   ├── tar-js/ ................... tar-js (archives TAR)
│   │   ├── client-zip/ ............... client-zip (Web Workers)
│   │   ├── pdf-js/ ................... PDF.js (extraction PDF)
│   │   └── tesseract/ ................ Tesseract.js (OCR)
│   │
│   └── translations/ ................. Fichiers de langue
│       ├── fr.js ..................... Français (1400+ clés)
│       ├── en.js ..................... Anglais
│       ├── es.js ..................... Espagnol
│       ├── de.js ..................... Allemand
│       ├── it.js ..................... Italien
│       ├── nl.js ..................... Néerlandais
│       ├── pt.js ..................... Portugais
│       ├── ar.js ..................... Arabe
│       ├── zh.js ..................... Chinois
│       ├── jp.js ..................... Japonais
│       └── el.js ..................... Grec
│
├── elea/ ............................. Templates Moodle/Éléa
│   ├── page/ ......................... Template Page HTML
│   ├── appariement/ .................. Template Matching
│   ├── millionnairev2/ ............... Template Millionnaire
│   ├── QCM/ .......................... Template Quiz
│   ├── glossaire/ .................... Template Glossaire
│   ├── PLACEHOLDERS_PAGE.md .......... Documentation substitutions Page
│   ├── PLACEHOLDERS_APPARIEMENT.md ... Documentation Matching
│   ├── PLACEHOLDERS_MILLIONNAIRE.md .. Documentation Millionnaire
│   └── PLACEHOLDERS_QCM.md ........... Documentation Quiz
│
├── images/ ........................... Icônes des activités (PNG)
│   ├── logo_caramel.png .............. Logo principal
│   ├── logo_caramel.ico .............. Favicon
│   ├── tchap.png ..................... Icône Tchap
│   └── [27 icônes d'activités]
│
├── flags/ ............................ Drapeaux pays (SVG)
│
├── legal/ ............................ Pages légales
│   └── mentions-legales.html ......... Mentions légales (template)
│
├── README.md ......................... Documentation (ce fichier)
├── CHANGELOG ......................... Journal des versions
├── LICENSE ........................... Licence GNU AGPLv3
└── package-lock.json ................. Verrouillage dépendances NPM
```

### Modules clés

| Fichier | Lignes | Rôle |
|---------|--------|------|
| `definitions.js` | 311 | Configuration des 27 activités (métadonnées, IDs, catégories) |
| `prompt-generator.js` | 783 | Génération de prompts optimisés pour chaque type |
| `h5p-creator.js` | 600+ | Packaging H5P (JSZip, adaptations par module) |
| `moodle-creator.js` | 900+ | Packaging Moodle/Éléa (TAR, GZIP, substitutions XML) |
| `llm.js` | 199 | Intégration API n8n, gestion des 6 modèles |
| `ui.js` | 400+ | Interface (grille, onglets, modales, notifications) |
| `ocr.js` | 200+ | OCR Tesseract.js, upload PDF, extraction texte |
| `translation.js` | 300+ | Système i18n, chargement asynchrone langues |

---

## 🤝 Contribution

### Signaler un bug

- **Tickets** : [https://forge.apps.education.fr/caramel/caramel/-/issues](https://forge.apps.education.fr/caramel/caramel/-/issues)
- **Tchap** : [Salon Caramel](https://edurl.fr/caramel-tchap) (messagerie instantanée Éducation nationale)

### Proposer une amélioration

1. Fork du dépôt
2. Création d'une branche (`git checkout -b feature/amelioration`)
3. Commit des modifications (`git commit -m "Ajout fonctionnalité X"`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Création d'une Merge Request sur la Forge

### Développement local

```bash
# Cloner le dépôt
git clone https://forge.apps.education.fr/caramel/caramel.git
cd caramel

# Lancer un serveur local
python3 -m http.server 8000

# Éditer les fichiers dans js/modules/
# Tester dans le navigateur (http://localhost:8000)
```

### Conventions de code

- **JavaScript** : ES6+ moderne, modules ES6
- **CSS** : BEM-like pour nommage, variables CSS pour thèmes
- **Traductions** : toujours ajouter clés dans les 11 fichiers de langue
- **Commits** : messages en français, explicites (ex : "Correctif modal responsive")

---

## 📄 Licence

Ce projet est distribué sous la licence **GNU Affero General Public License v3.0 (AGPLv3)**.

### Conditions principales

✅ **Autorisé** :
- Utilisation commerciale et non-commerciale
- Modification du code source
- Distribution et redistribution
- Utilisation privée

⚠️ **Obligations** :
- **Attribution** : citer les auteurs originaux (Gauthier REMANDE et Emmanuel GAUNARD)
- **Partage à l'identique** : modifications distribuées sous AGPLv3
- **Source disponible** : si déployé sur un réseau, code source accessible
- **Notices de licence** : conserver les en-têtes de licence

### Bibliothèques tierces

Chaque bibliothèque utilisée conserve sa licence respective :

| Bibliothèque | Licence |
|--------------|---------|
| Font Awesome | CC BY 4.0 / MIT / SIL OFL 1.1 |
| JSZip | MIT / GPLv3 |
| client-zip | MIT |
| fflate | MIT |
| tar-js | MIT |
| PDF.js | Apache 2.0 |
| Tesseract.js | Apache 2.0 |
| flag-icons | MIT |

Voir [LICENSE](LICENSE) pour le texte complet.

---

## 📧 Contact et support

### Auteurs

**Gauthier REMANDE**
Professeur de Lettres-Histoire
📧 [gauthier.remande@ac-nantes.fr](mailto:gauthier.remande@ac-nantes.fr)
📍 39 avenue de Chanzy, 53000 Laval, France

**Emmanuel GAUNARD**
Professeur de mathématiques et chargé de mission DRANE
Académie de Grenoble
📧 [emmanuel.gaunard@ac-grenoble.fr](mailto:emmanuel.gaunard@ac-grenoble.fr)
📍 30 boulevard de la République, 38200 Vienne, France

### Support

- 💬 **Tchap** : [Salon Caramel](https://edurl.fr/caramel-tchap) (temps réel)
- 🐛 **Issues** : [Forge GitLab](https://forge.apps.education.fr/caramel/caramel/-/issues)
- 📖 **Documentation** : Tutoriel intégré dans l'application (bouton "Tutoriel")
- 🌐 **Site web** : [https://caramel.forge.apps.education.fr/](https://caramel.forge.apps.education.fr/)

---

## 🎉 Remerciements

- **Ministère de l'Éducation nationale** : hébergement Forge des Communs Numériques Éducatifs
- **Incubateur** : infrastructure n8n pour proxy IA sécurisé
- **ilaaS** : mise à disposition de modèles IA souverains
- **Communauté H5P** : ressources et templates de référence
- **Contributeurs open source** : développeurs des bibliothèques utilisées

---

*Caramel v3.3.9 – Novembre 2025*
*Création Assistée de Ressources et d'Activités Moodle et Éléa*
