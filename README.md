# Caramel

**Création Assistée de Ressources et d'Activités Magistère et Éléa**

[![Version](https://img.shields.io/badge/version-5.0.0-blue.svg)](https://caramel.forge.apps.education.fr/)
[![Licence](https://img.shields.io/badge/licence-GNU%20AGPLv3-green.svg)](LICENSE)
[![Plateforme](https://img.shields.io/badge/plateforme-Web-orange.svg)](https://caramel.forge.apps.education.fr/)

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Nouveautés de la version 5.0.0](#nouveautés-de-la-version-500)
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

## Nouveautés de la version 5.0.0

### Édition et nouvelles activités

- **Éditeur d'activités intégré** : Modification complète du contenu JSON directement dans la modale de visualisation, avec mises à jour en temps réel sur tous les formats d'export. L'édition fine-tuned permet de corriger ou adapter le contenu généré avant téléchargement.
- **Drag and Drop H5P** : Nouvelle activité permettant de créer des exercices de glisser-déposer d'étiquettes dans des zones dédiées. Trois dispositions proposées (haut, bas, centre) et nombre d'étiquettes configurable directement dans le prompt en Mode guidé.
- **Activité Devoir (Moodle)** : Nouvelle activité permettant de créer des devoirs avec grilles d'évaluation critériée. L'IA génère des critères d'évaluation avec des niveaux de réussite (2 à 4 niveaux) et des descripteurs observables. Inclut un simulateur visuel, un éditeur de critères et des exports DOCX/ODT/PDF.

### Activité Page : fidélité et thèmes visuels

- **Simulateur fidèle à Éléa** : Structure complètement refondée pour reproduire précisément l'affichage final que les apprenants verront dans Éléa.
- **Quatre thèmes visuels** : L'activité Page propose désormais quatre thèmes sélectionnables directement dans l'éditeur intégré :
  1. **Éléa** — Thème par défaut reprenant l'identité visuelle de la plateforme
  2. **DSFR** — Système de Design de l'État français
  3. **Accessibilité** — Contraste renforcé WCAG AAA pour les utilisateurs malvoyants ou DYS
  4. **Couleurs vives** — Palette engageante et colorée pour les jeunes élèves
- **Aide à l'import** : Ajout de boutons d'aide contextuelle (icônes ?) à côté des boutons de téléchargement pour les formats MBZ, XML et GIFT, guidant l'enseignant pas à pas vers Éléa ou Moodle.

### Workflow post-génération amélioré

- **Modale de résultats intelligente** : Après chaque génération, une modale contextuelle propose trois actions :
  - **Télécharger** : accès direct au fichier généré (H5P, MBZ, DOCX, etc.)
  - **Visualiser et éditer** : prévisualisation avec éditeur JSON intégré pour fine-tuning avant téléchargement
  - **Continuer** : fermeture rapide pour chaîner les générations
- **Gestion de l'historique** : Conservation du contexte pédagogique et des dernières générations pour relance rapide

### Téléchargement groupé

- **Bouton "Tout télécharger"** : Nouveau contrôle dans la barre de notifications (design pill/étiquette harmonisé)
- **Archive ZIP consolidée** : Télécharger en un clic tous les fichiers générés récemment, organisés par type
- **Notification automatique** : Le toast disparaît automatiquement à l'ouverture du panneau de notifications pour une interface propre

### Robustesse et qualité

- **Auto-réparateur JSON** : Détection et correction automatique des erreurs de syntaxe IA (backslashes, versions de libraires, UUIDs)
- **Validation métier renforcée** : Chaque activité vérifie le contenu pédagogique (questions non vides, réponses suffisantes, etc.)
- **Healing structurel** : Normalisation des données malformées sans intervention utilisateur
- **Gestion des cas limites** : Tous les processeurs traitent robustement les données partielles ou incomplètes

### Exports documentaires enrichis

- **Mots croisés visuels** : Exports DOCX/ODT/PDF incluent maintenant la grille (vide et complétée en corrigé)
- **Formules Unicode généralisées** : Rendu haute fidélité LaTeX→Unicode pour tous les exports bureautiques
- **Détection automatique de langue** : Les documents définissent leur langue pour meilleure correction orthographique et accessibilité

### Traductions complètes des simulateurs

- **Couverture totale** : Tous les éléments des simulateurs d'activités (Millionnaire, Appariement, QCM, Glossaire, Test, Devoir, Page) sont désormais traduits dans les 11 langues supportées — y compris les infobulles, messages système et titres de blocs.

### Restructuration et performance

- **Refonte complète de l'architecture** : Code réorganisé en domaines fonctionnels (`core/`, `services/`, `ui/`, `h5p/`, `moodle/`, `export/`, etc.)
- **Optimisation des ressources** : CSS segmentée, images en WebP, assets centralisées
- **Standardisation des dépendances** : Versions explicites dans les chemins (`jspdf/2.5.1/`), suivi centralisé
- **Workflow n8n amélioré** : Robustesse augmentée, gestion meilleure des erreurs de parsing, génération plus rapide

### Sécurité accrue

- **DOMPurify intégré** : Assainissement du JSON généré pour prévenir toute injection
- **Validation complète des entrées** : Escaping des contenus XML/HTML, traitement sécurisé des URLs
- **Mise à jour des dépendances** : Montée de version généralisée (dont pdf.js) vers versions sécurisées

---

## ⚡ Fonctionnalités principales

### Génération assistée par IA

- **Prompts pré-configurés** : modèles optimisés pour chaque type d'activité
- **5 modèles IA** disponibles via ilaaS (Mistral, Llama, GPT-OSS, Qwen)
- **RAG (Retrieval-Augmented Generation)** : enrichissement via upload de documents
- **OCR universel** : extraction de texte depuis PDF, DOCX, PPTX, ODT, ODP, PNG, JPG et JPEG (Tesseract.js + reconnaissance native)
- **Limite de contexte** : jusqu'à 120 000 caractères pour le RAG

### Exports multi-formats

- **Fichiers H5P** (`.h5p`) : archives ZIP auto-contenues importables directement
- **Backups Moodle** (`.mbz`) : archives compressées (TAR+GZIP) prêtes pour restauration
- **Exports XML** : format GIFT/Moodle pour glossaires et questions
- **Documents bureautiques** : export en **DOCX, ODT et PDF** pour toutes les activités

### Interface intuitive

- **Design glassmorphism** inspiré d'iOS
- **Navigation par onglets** : Quiz, Texte, Mémorisation, Éléa, Autres, Expérimentaux
- **Système de notifications** : menu avec historique complet et fenêtre de visualisation pour re-télécharger les activités
- **Mode responsive** : adapté ordinateurs et tablettes
- **Thèmes clairs/sombres** : adaptation au système d'exploitation

---

## 📚 Types d'activités supportées

### Activités H5P (20 types)

#### 🧠 Quiz & Tests
- **Quiz mixte (QuizSet)** : ensembles de questions variées (QCM, vrai/faux, glisser-déposer, texte à trous, etc.)
- **Quizset QCM** : quiz composé uniquement de questions à choix multiples
- **Quizset Vrai/Faux** : quiz composé uniquement de questions vrai/faux
- **TrueFalse** : questions vrai/faux simples (une question unique)
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

#### 📋 Évaluation
- **Devoir** : création de grilles d'évaluation critériée et niveaux de réussite pour une activité Devoir d'Éléa/Magistère/Moodle.

#### 📖 Contenus riches
- **Page Éléa** : pages HTML avec 18 types de blocs (texte, image, vidéo, citation, FAQ, mythes/réalités, etc.), avec choix de thème visuel (Éléa, DSFR, Accessibilité, Couleurs vives)
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
   - Upload de documents multiformats (glisser-déposer) : **PDF, DOCX, PPTX, ODT, ODP, PNG, JPG, JPEG**
   - Extraction de texte ultra-rapide (reconnaissance native + OCR Tesseract.js)
   - Coloration des fichiers traités
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
- **[Tesseract.js](https://tesseract.projectnaptha.com/)** (Apache 2.0) : OCR multilingue (PDF scannés, images)
- **[Mammoth.js](https://github.com/mwilliamson/mammoth.js)** (BSD-2-Clause) : lecture de fichiers DOCX
- **[jsPDF](https://github.com/parallax/jsPDF)** (MIT) : génération de fichiers PDF
- **[jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)** (MIT) : création de tableaux dans les PDF
- **[MathJax](https://www.mathjax.org/)** (Apache 2.0) : rendu des formules mathématiques
- **[H5P Standalone](https://github.com/tunapanda/h5p-standalone)** (MIT) : visualisation des activités H5P

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

### Modèles proposés (5 au total)

| Modèle | Paramètres | Featured | Organisation |
|--------|------------|----------|--------------|
| **Mistral Small 3.2** | 24B | ⭐ | Mistral AI |
| **Qwen 3** | 30B | ⭐ | Qwen |
| **GPT-OSS** | 120B | ⭐ | OpenAI |
| **Llama 3.3** | 70B | | RedHat AI |
| **Llama 3.1** | 8B | | Neural Magic |

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

- **Chargement asynchrone** : fichiers `/js/locales/{lang}.json`
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
├── .bmad-core/                          # 🤖 Configuration BMad (agents, workflows)
│   ├── agents/                          # 9 agents pour différents rôles
│   │   ├── analyst.md
│   │   ├── architect.md
│   │   ├── bmad-master.md
│   │   ├── bmad-orchestrator.md
│   │   ├── dev.md
│   │   ├── pm.md
│   │   ├── po.md
│   │   ├── qa.md
│   │   └── ux-expert.md
│   ├── agent-teams/                     # Configurations d'équipes
│   │   ├── team-all.yaml
│   │   ├── team-fullstack.yaml
│   │   ├── team-ide-minimal.yaml
│   │   └── team-no-ui.yaml
│   ├── checklists/                      # Listes de contrôle
│   │   ├── architect-checklist.md
│   │   ├── change-checklist.md
│   │   ├── pm-checklist.md
│   │   ├── po-master-checklist.md
│   │   ├── story-dod-checklist.md
│   │   └── story-draft-checklist.md
│   ├── data/                            # Données de référence
│   │   ├── bmad-kb.md
│   │   ├── brainstorming-techniques.md
│   │   ├── elicitation-methods.md
│   │   ├── technical-preferences.md
│   │   ├── test-levels-framework.md
│   │   └── test-priorities-matrix.md
│   ├── tasks/                           # Définitions de tâches (27 fichiers)
│   ├── templates/                       # Templates projet (14 fichiers)
│   ├── workflows/                       # Workflows développement (6 fichiers)
│   ├── core-config.yaml                 # Configuration centrale
│   ├── install-manifest.yaml            # Manifest d'installation
│   ├── user-guide.md                    # Guide utilisateur
│   ├── enhanced-ide-development-workflow.md
│   └── working-in-the-brownfield.md
│
├── .claude/                             # 🔧 Configuration Claude Code
│   ├── commands/                        # Commandes personnalisées BMad
│   │   └── BMad/
│   │       ├── agents/                  # Liens vers agents BMad
│   │       └── tasks/                   # Liens vers tasks BMad
│   ├── settings.local.json              # Paramètres locaux
│   └── keybindings.json (optionnel)
│
├── .vscode/                             # ⚙️ Configuration VSCode
│   └── settings.json
│
├── .mcp.json                            # Configuration MCP
├── .gitignore                           # Fichiers ignorés par Git
├── .gitlab-ci.yml                       # Pipeline GitLab CI/CD
│
├── assets/                              # 🗂️ Ressources statiques
│   ├── data/
│   │   ├── examples/                   # Exemples JSON (78 fichiers)
│   │   └── prompts/                    # Templates de prompts IA (27 fichiers)
│   ├── flags/                          # Icônes de drapeaux (1.5K fichiers)
│   ├── fonts/                          # Webfonts FontAwesome
│   ├── images/
│   │   ├── activities/                 # Icônes d'activités H5P (27 fichiers)
│   │   ├── branding/                   # Logos et identité visuelle
│   │   ├── tutorials/                  # Images des tutoriels
│   │   └── wiki/                       # Images de documentation
│   └── templates/                      # Templates HTML
│       ├── mentions-legales.html      # Mentions légales
│       ├── tutorial_content.html      # Contenu du tutoriel
│       └── editor-help/              # Aide contextuelle éditeur (25 fichiers)
│
├── css/                                 # 🎨 Feuilles de style
│   ├── vendor/                         # Bibliothèques externes (105K)
│   │   ├── all.min.css                # FontAwesome
│   │   └── flag-icons.min.css         # Country flags
│   ├── base/                           # Styles globaux (139.5K)
│   │   ├── style.css                  # CSS principal
│   │   └── custom.css                 # Surcharges globales
│   └── components/                     # Composants modulaires (44.9K)
│       ├── json-editor.css
│       ├── llm.css
│       ├── modale-aide.css
│       └── mentions-legales.css
│
├── js/                                  # 💻 Code JavaScript (ES6 modules)
│   ├── core/                           # Modules fondamentaux
│   │   ├── definitions.js             # Registre des activités H5P/Moodle
│   │   ├── lib-loader.js              # Chargement dynamique des libs
│   │   ├── perf-tracker.js            # Suivi de performance du pipeline
│   │   ├── translation.js             # Système i18n (11 langues)
│   │   └── utils.js                   # Fonctions utilitaires
│   │
│   ├── services/                       # Services métier
│   │   ├── llm.js                     # Communication avec l'IA (n8n)
│   │   ├── ocr.js                     # Extraction de texte (PDF, images)
│   │   └── prompt-generator.js        # Génération de prompts optimisés
│   │
│   ├── ui/                             # Interface utilisateur
│   │   ├── ui.js                      # Navigation, tabs, tiles, modales
│   │   ├── notifications.js           # Toasts et historique
│   │   ├── animations.js              # Animations visuelles
│   │   ├── version-checker.js         # Vérification des mises à jour
│   │   └── emergency-notification.js  # Notifications système
│   │
│   ├── h5p/                            # Écosystème H5P
│   │   ├── h5p-creator.js             # Packaging H5P (ZIP)
│   │   ├── h5p-manager.js             # Gestion des bibliothèques H5P
│   │   ├── h5p-prefetch.js            # Préchargement des libs H5P
│   │   ├── json-healer.js             # Réparation JSON (LaTeX, structure)
│   │   └── processors/                # 20 processeurs H5P
│   │       ├── index.js               # Routeur de processeurs
│   │       ├── Timeline.js            # Frise chronologique
│   │       ├── Flashcards.js          # Cartes mémoires
│   │       ├── QuizSet.js             # Quiz mixte
│   │       ├── MultipleChoice.js      # Questions à choix multiples
│   │       ├── TrueFalse.js           # Questions vrai/faux
│   │       ├── DragAndDrop.js         # Glisser-déposer
│   │       ├── DragTheWords.js        # Glisser les mots
│   │       ├── FillInTheBlanks.js     # Texte à trous
│   │       ├── MarkTheWords.js        # Surligner les mots
│   │       ├── SortParagraphs.js      # Ordonner les paragraphes
│   │       ├── Essay.js               # Rédaction
│   │       ├── Summary.js             # Résumé
│   │       ├── Crossword.js           # Mots croisés
│   │       ├── FindTheWords.js        # Mots mêlés
│   │       ├── DialogCards.js         # Cartes de dialogue
│   │       ├── Glossary.js            # Glossaire/Accordion
│   │       ├── Chart.js               # Diagrammes
│   │       ├── SingleChoiceSet.js     # Série de choix uniques
│   │       └── ComplexFillTheBlanks.js # Texte à trous complexe
│   │
│   ├── moodle/                         # Écosystème Moodle/Éléa
│   │   ├── moodle-creator.js          # Packaging MBZ (TAR+GZIP)
│   │   ├── moodle-formats.js          # Génération XML/GIFT
│   │   ├── page-themes.js             # Registre des 4 thèmes de l'activité Page
│   │   ├── page-themes/               # Implémentation des thèmes visuels
│   │   │   ├── elea.js                # Thème Éléa (identité visuelle plateforme)
│   │   │   ├── dsfr.js                # Thème DSFR (Système de Design de l'État)
│   │   │   ├── accessible.js          # Thème Accessibilité (WCAG AAA)
│   │   │   └── dynamique.js           # Thème Couleurs vives
│   │   └── processors/                # 7 processeurs + utilitaires
│   │       ├── index.js               # Routeur de processeurs
│   │       ├── activities/
│   │       │   ├── QCM.js             # QCM Moodle
│   │       │   ├── Test.js            # Test XML/GIFT
│   │       │   ├── Appariement.js     # Appariement (matching)
│   │       │   ├── Millionnaire.js    # Qui veut gagner des millions
│   │       │   ├── Page.js            # Page Éléa HTML (4 thèmes)
│   │       │   ├── Devoir.js          # Devoir avec grille critériée
│   │       │   └── Glossaire.js       # Glossaire XML
│   │       └── shared/                # Utilitaires partagés
│   │           ├── moodle-backup.js   # Génération backups .mbz
│   │           ├── placeholder.js     # Substitutions templates
│   │           └── templates.js       # Templates HTML/XML
│   │
│   ├── renderers/                      # Moteurs de rendu
│   │   ├── chart-renderer.js          # Rendu des diagrammes
│   │   ├── math-renderer.js           # Rendu des formules mathématiques
│   │   ├── image-utils.js             # Traitement des images
│   │   ├── crossword-grid-capture.js  # Capture grille mots croisés
│   │   └── find-the-words-grid-capture.js # Capture grille mots mêlés
│   │
│   ├── export/                         # Export documentaire
│   │   ├── document-exporter.js       # Export DOCX/ODT/PDF
│   │   ├── document-formatter.js      # Formatage par type
│   │   └── sanitizer.js               # Nettoyage HTML/XML
│   │
│   ├── editor/                         # Éditeur JSON visuel (8 fichiers)
│   │   ├── index.js                   # Point d'entrée éditeur
│   │   ├── editor-core.js             # Logique centrale de l'éditeur
│   │   ├── field-renderers.js         # Rendu des champs JSON
│   │   ├── array-manager.js           # Gestion des tableaux
│   │   ├── feedback-editor.js         # Édition des retours/feedback
│   │   ├── content-detector.js        # Détection de contenu
│   │   ├── json-utils.js              # Utilitaires JSON
│   │   └── validators.js              # Validateurs de champs
│   │
│   ├── locales/                         # Fichiers de langues JSON (11)
│   │   ├── fr.json .................. Français (1651 clés)
│   │   ├── en.json .................. Anglais
│   │   ├── es.json .................. Espagnol
│   │   ├── de.json .................. Allemand
│   │   ├── it.json .................. Italien
│   │   ├── nl.json .................. Néerlandais
│   │   ├── pt.json .................. Portugais
│   │   ├── ar.json .................. Arabe
│   │   ├── zh.json .................. Chinois
│   │   ├── jp.json .................. Japonais
│   │   └── el.json .................. Grec
│   │
│   ├── vendor/                         # Bibliothèques externes
│   │   ├── client-zip/ ............... client-zip (création ZIP streaming)
│   │   ├── jszip/ .................... JSZip (création ZIP)
│   │   ├── fflate/ ................... fflate (compression GZIP)
│   │   ├── tar-js/ ................... tar-js (archives TAR)
│   │   ├── pdf-js/ ................... PDF.js (extraction PDF)
│   │   ├── tesseract/ ................ Tesseract.js (OCR)
│   │   ├── mammoth/ .................. Mammoth.js (lecture DOCX)
│   │   ├── docx/ ..................... Traitement fichiers DOCX
│   │   ├── dompurify/ ................ DOMPurify (assainissement)
│   │   ├── jspdf/ .................... jsPDF (génération PDF)
│   │   ├── jspdf-autotable/ .......... jsPDF-AutoTable (tableaux PDF)
│   │   ├── mathjax/ .................. MathJax (rendu formules maths)
│   │   ├── h5p-standalone/ ........... H5P Standalone (visualisation)
│   │   ├── fonts/ .................... Liberation Sans (export PDF/ODT)
│   │   └── h5p-libs/ ................. Bibliothèques H5P
│   │
│   ├── main.js                         # Point d'entrée
│   └── simulators.js                   # Simulation d'activités
│
├── docs/                                # 📚 Documentation complète
│   ├── guide-processeurs.md             # Guide création processeurs H5P/Moodle
│   ├── guide-traduction.md              # Guide système i18n
│   ├── guide-editeur-json.md            # Guide éditeur JSON visuel
│   ├── guide-themes-page.md             # Guide thèmes visuels Page
│   ├── plan-tests.md                    # Plan de test global
│   ├── checklist-quizset-dragquestion.md # Checklist QuizSet/DragQuestion
│   ├── audits/                          # Audits et analyses
│   │   ├── AUDIT_COMPLET.md            # Audit complet du projet
│   │   ├── RESTRUCTURATION_COMPLETE.md # Architecture détaillée de la refonte
│   │   └── STORIES_AUDIT.md            # Audit des stories/épics
│   ├── visuel/                          # Documentation visuelle
│   │   └── MODALES_ET_ZINDEX.md        # Référence modales & z-index
│   ├── workflows/                       # Documentation flux de travail
│   │   ├── data-flow.md                # Flux de données
│   │   └── WORKFLOW_EXPLICATION.md     # Explications des workflows
│   ├── specific-plans/                  # Plans spécifiques
│   │   ├── PLAN_DRAG_AND_DROP.md       # Plan détaillé Drag and Drop
│   │   ├── PLAN_DEVOIR.md              # Plan activité Devoir
│   │   └── plan-refonte-filtres.md     # Plan de refonte des filtres
│   ├── python_feedback_6_to_4/          # Scripts Python de migration
│   │   ├── cleanup_empty_lines.py
│   │   ├── fix_feedback_instructions.py
│   │   ├── fix_remaining_references.py
│   │   └── reduce_feedbacks.py
│   └── python_js_cles_doublon/          # Outils de traduction
│       ├── check-translations.js
│       ├── CLES_TRADUCTION_DOUBLON.MD
│       └── remove-translations.py
│
├── tests/                               # 🧪 Tests automatisés (12 suites, ~2500 assertions)
│   ├── test-generation-download.html/js # Suite 1 : Génération & téléchargement H5P/MBZ
│   ├── test-edit-export-flow.html/js    # Suite 2 : Flux édition & re-export
│   ├── test-i18n.html/js                # Suite 3 : Internationalisation (11 langues)
│   ├── test-definitions.html/js         # Suite 4 : Cohérence définitions & prompts
│   ├── test-ui.html/js                  # Suite 5 : Interface utilisateur (iframe)
│   ├── test-robustness.html/js          # Suite 6 : Robustesse & gestion d'erreurs
│   ├── test-css.html/js                 # Suite 7 : CSS & rendu visuel (iframe)
│   ├── test-integration.html/js         # Suite 8 : Pipeline complet (19 activités)
│   ├── test-document-export.html/js     # Suite 9 : Export documents (25 types)
│   ├── test-performance.html/js         # Suite 10 : Benchmarks performance
│   ├── test-vendor-libs.html/js         # Suite 11 : Chargement bibliothèques externes
│   └── test-h5p-prefetch.html/js        # Suite 12 : Préchargement libs H5P
│
├── index.html                           # 🏠 Application web principale
│
├── 📄 Fichiers de configuration et documentation (racine)
│   ├── CLAUDE.md                        # 🤖 Instructions pour Claude Code
│   ├── README.md                        # 📖 Documentation (ce fichier)
│   ├── CHANGELOG                        # 📋 Journal de versions (v5.0.0 et antérieures)
│   ├── wiki.md                          # 📝 Page wiki du projet
│   ├── LICENSE                          # ⚖️ Licence GNU AGPLv3
│   ├── .mcp.json                        # Configuration MCP servers
│   └── .gitlab-ci.yml                   # Pipeline CI/CD GitLab
```

### Modules clés

**Core (Fondements)**
| Module | Localisation | Rôle |
|--------|--------------|------|
| definitions.js | `js/core/` | Registre centralisé des 20+ activités H5P et Moodle |
| lib-loader.js | `js/core/` | Chargement dynamique des bibliothèques tierces |
| perf-tracker.js | `js/core/` | Suivi de performance du pipeline (phases, timings) |
| translation.js | `js/core/` | Système i18n (11 langues), chargement asynchrone |
| utils.js | `js/core/` | Fonctions utilitaires partagées |

**Services (Métier)**
| Module | Localisation | Rôle |
|--------|--------------|------|
| llm.js | `js/services/` | Communication n8n → ilaaS, gestion 6 modèles IA |
| ocr.js | `js/services/` | OCR universel (PDF, DOCX, PPTX, ODT, PNG, JPG) |
| prompt-generator.js | `js/services/` | Génération de prompts optimisés par type |

**H5P & Moodle**
| Module | Localisation | Rôle |
|--------|--------------|------|
| h5p-creator.js | `js/h5p/` | Packaging H5P (JSZip), création `.h5p` |
| h5p-manager.js | `js/h5p/` | Gestionnaire centralisé H5P |
| h5p-prefetch.js | `js/h5p/` | Préchargement intelligent des libs H5P |
| h5p-processors/* | `js/h5p/processors/` | 20 processeurs spécialisés (Timeline, Quiz, etc.) |
| json-healer.js | `js/h5p/` | Réparation JSON (LaTeX, versions, structure) |
| moodle-creator.js | `js/moodle/` | Packaging MBZ (TAR+GZIP, substitutions XML) |
| moodle-formats.js | `js/moodle/` | Génération XML/GIFT |
| moodle-processors/* | `js/moodle/processors/` | 8 processeurs (QCM, Appariement, Page, Devoir, etc.) |

**Interface & Export**
| Module | Localisation | Rôle |
|--------|--------------|------|
| ui.js | `js/ui/` | Navigation, onglets, tuiles, modales |
| notifications.js | `js/ui/` | Toasts, historique, menu notifications |
| animations.js | `js/ui/` | Effets visuels et transitions |
| document-exporter.js | `js/export/` | Export DOCX/ODT/PDF |
| document-formatter.js | `js/export/` | Formatage et mise en page |
| sanitizer.js | `js/export/` | Assainissement HTML/XML/JSON |
| math-renderer.js | `js/renderers/` | Rendu formules mathématiques (MathJax, Unicode) |
| chart-renderer.js | `js/renderers/` | Rendu diagrammes et graphiques |
| image-utils.js | `js/renderers/` | Traitement des images |

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

# Éditer les fichiers dans js/
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
| Mammoth.js | BSD-2-Clause |
| jsPDF | MIT |
| jsPDF-AutoTable | MIT |
| MathJax | Apache 2.0 |
| H5P Standalone | MIT |
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
