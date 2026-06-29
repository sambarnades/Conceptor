# Caramel 🍬

**Création Assistée de Ressources et d'Activités Magistère et Éléa**

[![Version](https://img.shields.io/badge/version-6.1.1-blue.svg)](https://caramel.forge.apps.education.fr/)
[![Licence](https://img.shields.io/badge/licence-GNU%20AGPLv3-green.svg)](LICENSE)
[![Plateforme](https://img.shields.io/badge/plateforme-Web-orange.svg)](https://caramel.forge.apps.education.fr/)
[![Langues](https://img.shields.io/badge/langues-11-purple.svg)](#-multilinguisme)

Caramel est une application web **libre, gratuite et sans compte** qui génère des activités pédagogiques interactives par intelligence artificielle. Conçue par et pour les enseignants, elle produit en quelques minutes des fichiers **H5P** (`.h5p`) et **Moodle/Éléa/Magistère** (`.mbz`, `.xml`) prêts à importer.

> 🌐 **Application en ligne (aucune installation)** : **<https://caramel.forge.apps.education.fr/>**

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Nouveautés 6.0.0](#-nouveautés-600)
- [Fonctionnalités](#-fonctionnalités)
- [Types d'activités](#-types-dactivités)
- [Démarrage rapide](#-démarrage-rapide)
- [Modèles d'IA](#-modèles-dia)
- [Architecture technique](#-architecture-technique)
- [Confidentialité et sécurité](#-confidentialité-et-sécurité)
- [Installation locale](#-installation-locale)
- [Structure du projet](#-structure-du-projet)
- [Contribution](#-contribution)
- [Utilisation de l'IA dans le développement](#-utilisation-de-lia-dans-le-développement)
- [Licence](#-licence)
- [Contact et support](#-contact-et-support)

---

## 🎯 À propos

Caramel automatise la création de contenus pédagogiques en cinq étapes :

1. **Décrire** le contexte pédagogique (discipline, niveau, thème, nombre d'éléments)
2. **Choisir** un type d'activité parmi 31 tuiles
3. **Générer** le contenu via l'infrastructure IA souveraine française **ILaaS**
4. **Affiner** dans l'éditeur visuel intégré (questions, formules, images, texte enrichi)
5. **Télécharger** le fichier prêt à importer dans Moodle, Éléa ou Magistère

### Principes

- ✅ **100 % client-side** : aucune donnée pédagogique ne quitte le navigateur (hors prompts envoyés à l'IA)
- ✅ **Sans compte, sans cookie de suivi, sans collecte de données personnelles** (RGPD)
- ✅ **IA souveraine** : modèles hébergés sur infrastructure française
- ✅ **Multilingue** : interface et génération en 11 langues
- ✅ **Aucun build, aucun `npm`** : ES6 modules natifs servis en statique

---

## 🆕 Nouveautés 6.0.0

> **23 juin 2026** — Contenus interactifs riches, son et vidéo, et génération sans limite de taille.

- **🎬 Vidéo interactive (H5P.InteractiveVideo)** : à partir d'un **lien vidéo**, Caramel récupère la transcription timée et l'IA place des questions (QCM, Vrai/Faux, texte à trous) aux ruptures d'idées, avec un résumé final. La vidéo n'est jamais embarquée (seul son lien est conservé).
- **📖 Livre interactif (H5P.InteractiveBook)** : livre numérique **multi-chapitres** où chaque chapitre empile textes, tableaux, images **et exercices** (9 sous-types), avec table des matières, couverture et page de résumé.
- **🎙️ Transcription audio et vidéo** dans le Mode Avancé : dépôt de fichiers **audio** (MP3, M4A, WAV, OGG, FLAC) ou **vidéo** (MP4, MOV, WEBM, bande-son uniquement), jusqu'à 90 min, transcrits via **Albert (DINUM)**.
- **🔗 Import d'une page web** par lien : le texte d'une page est récupéré côté serveur et rejoint la zone de contexte (RAG).
- **♻️ Génération « par lots »** : pour les activités à nombreux éléments, Caramel découpe automatiquement et de façon transparente la génération en plusieurs appels pour contourner la limite de temps (~59 s) de l'infrastructure IA — sans doublon, résultat identique à une génération en un bloc.
- **📄 Export PDF haute fidélité** : le PDF est désormais produit côté serveur à partir de l'ODT (LibreOffice + Math), préservant mise en page et formules, avec repli automatique sur la génération locale.
- **🤖 Caramelia** : chatbot d'assistance flottant qui pilote l'interface à votre place (remplit les champs, ouvre la bonne tuile, lance la génération) — introduit en 5.3.0, enrichi en 6.0.0.
- **🧠 Mistral Small 4 (119B)** devient le modèle par défaut ; trio mis en avant : Qwen 3.6, Mistral Small 4, GPT-OSS.

📜 **Historique complet** : voir le [CHANGELOG](CHANGELOG).

---

## ⚡ Fonctionnalités

### Génération assistée par IA
- Prompts pré-optimisés par type d'activité, dans les 11 langues
- Modèles IA souverains via ILaaS, avec **cascade de repli automatique** sur 3 modèles
- Découpage automatique des grosses générations (« par lots »)

### Enrichissement du contexte (RAG)
- **OCR universel** : PDF, DOCX, PPTX, ODT, ODP, PNG, JPG, JPEG (Tesseract.js + extraction native)
- **Transcription** : audio et vidéo (bande-son), jusqu'à 90 min
- **Import web** : récupération du texte d'une page par lien
- **Dictée vocale** au micro sur les champs de description
- Limite de contexte : 120 000 caractères

### Édition et exports
- Éditeur visuel intégré : texte enrichi (WYSIWYG), assistant de **formules LaTeX**, éditeur Cloze visuel, ajout d'images
- Prévisualisation fidèle de chaque activité avant téléchargement
- Exports **DOCX, ODT, PDF** pour toutes les activités, avec **formules mathématiques éditables** (OMML pour Word, MathML/StarMath pour LibreOffice)
- Packaging côté client : `.h5p` (ZIP), `.mbz` (TAR+GZIP), `.xml`/`.gift`, `.html`

### Interface
- Design glassmorphism, responsive, thèmes clair/sombre
- Navigation par onglets, historique des générations, téléchargement groupé (ZIP)
- Accessibilité RGAA (navigation clavier complète, focus trap, support RTL)

---

## 📚 Types d'activités

**31 types** au total : **23 H5P** + **8 Moodle/Éléa**.

### Activités H5P (`.h5p`)

| Catégorie | Activités |
|-----------|-----------|
| **Quiz & tests** | Quiz mixte (QuestionSet), Quiz QCM, Quiz Vrai/Faux, Choix multiple, Vrai/Faux, Choix unique en série |
| **Manipulation de texte** | Texte à trous, Glisser les mots, Surligner les mots, Trier les paragraphes, Glisser-déposer, Rédaction, Résumé |
| **Mémorisation & découverte** | Cartes mémo (Flashcards), Frise chronologique, Mots croisés, Mots mêlés, Cartes de dialogue, Glossaire/Accordéon, Graphique |
| **Contenus interactifs riches** | Présentation de cours, **Livre interactif**, **Vidéo interactive** |

### Activités Moodle/Éléa (`.mbz`, `.xml`, `.html`)

| Activité | Format | Description |
|----------|--------|-------------|
| **Page** | `.mbz` / `.html` | Page de cours riche (18 types de blocs, 4 thèmes visuels) |
| **Livre** | `.mbz` | Cours multi-chapitres réutilisant les blocs de Page (table des matières, numérotation décimale) |
| **Test / Banque** | `.xml` / `.gift` | Questions pour banque Moodle (format universel) |
| **QCM** | `.mbz` | Quiz à choix multiples prêt à restaurer |
| **Appariement** | `.mbz` | Association de paires |
| **Millionnaire** | `.mbz` | Jeu « Qui veut gagner des millions » pédagogique |
| **Glossaire** | `.mbz` / `.xml` | Dictionnaire de termes |
| **Devoir** | `.mbz` | Grille d'évaluation critériée et niveaux de réussite |

> 💡 **H5P** : universel, léger, partageable entre plateformes. **Moodle/Éléa** : intégration native (suivi, notes, feedback personnalisé).

---

## 🚀 Démarrage rapide

### Mode Rapide (2 champs)
1. **Qui êtes-vous ?** (ex. _Professeur de mathématiques en lycée_)
2. **Que souhaitez-vous aborder ?** (ex. _Introduction aux fractions en 6e_)

### Mode Avancé (paramètres détaillés)
Discipline · Thème · Niveau · Nombre d'éléments · contexte RAG optionnel (documents, audio/vidéo, lien web).

### Génération
- **Mode Simple** : un clic, l'IA génère et le contenu s'ouvre dans l'éditeur
- **Mode Guidé** : Caramel fournit un prompt à copier dans l'IA externe de votre choix, puis vous collez le JSON obtenu

---

## 🤖 Modèles d'IA

Caramel utilise l'infrastructure souveraine **[ILaaS](https://www.ilaas.fr/)** via l'Incubateur du Ministère de l'Éducation nationale.

| Modèle | Paramètres | Mis en avant | Organisation |
|--------|------------|--------------|--------------|
| **Qwen 3.6** | 35B | ⭐ | Qwen |
| **Mistral Small 4** | 119B | ⭐ **(défaut)** | Mistral AI |
| **GPT-OSS** | 120B | ⭐ | OpenAI |
| Mistral Small 3.2 | 24B | (mode debug) | Mistral AI |
| Llama 3.3 | 70B | (mode debug) | RedHat AI |
| Llama 3.1 | 8B | (mode debug) | Neural Magic |
| Gemma 4 | 31B | (mode debug) | Google |
| Mistral Medium | — | (mode debug) | Mistral AI |

- **Hébergement** : data centers de l'Enseignement supérieur et de la recherche (ESR) français
- **Confidentialité** : requêtes traitées uniquement pour l'exécution, pas de réentraînement
- **Aucun envoi vers une IA commerciale grand public**

---

## 🛠️ Architecture technique

### Stack (100 % frontend, ES6 modules natifs)

| Domaine | Bibliothèques |
|---------|---------------|
| Compression / packaging | JSZip 3.10.1, client-zip 2.5.0, fflate 0.8.3, tar-js 0.3.0 |
| Documents | PDF.js 6.0.227, Tesseract.js 7.0.0, Mammoth.js 1.12.0, docx 8.5.0 |
| Export PDF / math | jsPDF 4.2.1, jsPDF-AutoTable 5.0.8, MathJax 3.2.2 |
| H5P & sécurité | h5p-standalone 3.8.2, DOMPurify 3.4.11 |
| Interface | Font Awesome, flag-icons, CSS personnalisé (glassmorphism) |

### Génération IA — architecture asynchrone (polling)

Les appels à l'IA passent par un proxy **n8n** qui découple la soumission de l'exécution :

```
┌──────────┐  POST /submit   ┌──────────┐                ┌──────────┐
│ Caramel  │ ───────────────>│  Submit  │ ─ fire & ────> │  Worker  │
│ (browser)│ <── {taskId} ── │ (~100ms) │    forget      │ (10-180s)│──> ILaaS
│          │                 └──────────┘                │  + RAG   │   (GPU FR)
│          │  GET /result    ┌──────────┐                └────┬─────┘
│          │ ───────────────>│  Result  │ <── SELECT ─── Postgres
│          │ <── {status} ── │ (~50ms)  │   (file de tâches)
└──────────┘  (polling 3 s)  └──────────┘
```

- Le slot n8n est libéré en **~100 ms** : aucune saturation par des exécutions zombie
- La fermeture d'onglet côté client est **sans impact** sur le serveur
- Clés API gérées **côté serveur uniquement** (jamais exposées au frontend)
- **Cascade de repli** sur 3 modèles (timeout ~59 s par tentative)
- **RAG programmes officiels** : injection automatique d'extraits des programmes scolaires français selon le cycle détecté

### Services associés
- **Transcription audio/vidéo** : service souverain **Albert (DINUM)**, basé sur Whisper — l'audio est transmis le temps de la transcription puis non conservé
- **Import de page web** : extraction de texte côté serveur (contourne CORS)
- **Export PDF** : conversion ODT → PDF via un service serveur (LibreOffice + Math), avec repli local jsPDF

### Pipeline interne

```
H5P :    definitions → prompt-generator → llm → json-healer → processors → h5p-creator → .h5p
Moodle : definitions → prompt-generator → llm → json-healer → processors → moodle-creator → .mbz
```

Le module `json-healer.js` répare systématiquement les sorties du LLM (LaTeX, versions, UUID, structure) avant tout traitement.

---

## 🔒 Confidentialité et sécurité

- ✅ Aucune donnée personnelle collectée, aucun compte, aucun cookie de suivi
- ✅ Documents et images **traités localement** (OCR dans le navigateur)
- ✅ Génération IA sur infrastructure **ESR française**
- ⚠️ **Exception : la voix** (dictée, audio, bande-son vidéo) est transmise à **Albert (DINUM)** pour transcription, puis non conservée
- ⚠️ **Import web** : seul le lien est transmis ; le contenu de la page n'est pas stocké

### Mentions légales (résumé)

- **Éditeurs** : Gauthier Remande (PLP Lettres-Histoire, académie de Nantes) et Emmanuel Gaunard (professeur de mathématiques et chargé de mission DRANE, académie de Grenoble)
- **Hébergement** : Forge des Communs Numériques Éducatifs — Ministère de l'Éducation nationale et de la Jeunesse, 110 rue de Grenelle, 75007 Paris, France
- **Licence du code** : GNU AGPLv3

> Le dépôt **facultatif** d'une activité sur la boutique **La Sucrerie** entraîne une **publication publique** sous licence **CC BY-SA 4.0** ; cette démarche est distincte de la simple génération.

---

## 💻 Installation locale

Aucune dépendance, aucun build. Un serveur HTTP statique suffit (l'OCR et les appels IA nécessitent un contexte HTTP, pas un simple `file://`).

```bash
git clone https://forge.apps.education.fr/caramel/caramel.git
cd caramel
python3 -m http.server 8000
# → http://localhost:8000
```

Mode debug : ajouter `?debug` à l'URL (logs détaillés, JSON brut/healed, modèles cachés).

---

## 📁 Structure du projet

```
caramel/
├── index.html                  # Application principale
├── assets/
│   ├── data/                   # prompts/ (templates IA) + examples/ (échantillons JSON)
│   ├── images/                 # activités, branding, tutoriels, wiki
│   └── templates/              # mentions-légales, tutoriel, aide éditeur
├── css/                        # base/ (style global) + components/ + simulators/ + vendor/
├── js/
│   ├── core/                   # definitions.js (registre), translation.js, lib-loader.js, endpoints.js
│   ├── services/               # llm.js, llm-batch.js, ocr.js, video-transcript.js, prompt-generator.js
│   ├── ui/                     # ui.js, notifications.js, animations.js, version-checker.js
│   ├── h5p/                    # h5p-creator, json-healer, field-constraints, processors/ (23)
│   ├── moodle/                 # moodle-creator, moodle-formats, page-themes/, processors/activities/ (8)
│   ├── renderers/              # chart, math, image, grilles mots croisés/mêlés
│   ├── export/                 # document-exporter/-formatter, latex-parser, math-catalog, OMML/MathML, pdf-via-gotenberg
│   ├── editor/                 # éditeur JSON visuel (richtext, formula-assistant, cloze, interactive-video-panel)
│   ├── simulators/             # prévisualisation (un module par activité, lazy-loaded)
│   ├── caramelia/              # chatbot d'assistance (13 modules, lazy-loaded)
│   ├── locales/                # 11 fichiers JSON (~2034 clés chacun)
│   ├── vendor/                 # bibliothèques externes versionnées
│   └── main.js                 # point d'entrée
├── docs/                       # PRD, guides, audits, plans
├── scripts/                    # outils Node (.mjs) : vérification locales, traductions, QA
├── tests/                      # suites de tests HTML/JS
├── CHANGELOG · LICENSE · CLAUDE.md · wiki.md
```

---

## 🤝 Contribution

- **Signaler un bug ou proposer une fonctionnalité** : [Tickets sur la Forge](https://forge.apps.education.fr/caramel/caramel/-/issues)
- **Échanger avec la communauté** : [Salon Tchap](https://edurl.fr/caramel-tchap)
- **Contribuer au code** : fork → branche → Merge Request

### Conventions
- **JavaScript** : ES6+ moderne, modules natifs (aucun transpileur, aucun bundler)
- **CSS** : BEM-like, variables CSS pour le theming
- **i18n** : toute chaîne d'interface via `data-key` dans les 11 fichiers de langue
- **Commits** : en français, explicites

---

## 🧠 Utilisation de l'IA dans le développement

Caramel est conçu et piloté par deux enseignants qui ne sont pas développeurs professionnels. L'IA a été utilisée tout au long du projet comme **outil de productivité** — écriture et refactorisation du code, processeurs H5P/Moodle, exports documentaires, internationalisation, tests, documentation. Chaque décision d'architecture, choix fonctionnel et validation finale reste sous la responsabilité des auteurs.

Outils mobilisés : **Claude Code** (développement quotidien depuis la v5.0), **ChatGPT/Codex** (prototypage, prompts pédagogiques), **Gemini** (recherche documentaire, vérification de specs).

Ce que l'IA ne fait **pas** : les décisions pédagogiques, la validation fonctionnelle (chaque activité est testée manuellement dans Éléa/Moodle) et la conception UX restent humaines. Le code source est intégralement public et l'historique Git reflète ce processus itératif.

---

## 📄 Licence

Distribué sous **GNU Affero General Public License v3.0 (AGPLv3)** — voir [LICENSE](LICENSE).

✅ Utilisation (y compris commerciale), modification et redistribution autorisées.
⚠️ Obligations : attribution des auteurs (Gauthier Remande et Emmanuel Gaunard), partage des modifications sous AGPLv3, mise à disposition du code source si déployé en ligne.

Chaque bibliothèque tierce conserve sa propre licence (MIT, Apache 2.0, BSD-2-Clause, CC BY 4.0, SIL OFL…).

---

## 📧 Contact et support

- 💬 **Tchap** (recommandé) : [Salon Caramel](https://edurl.fr/caramel-tchap)
- 🐛 **Tickets** : [Forge GitLab](https://forge.apps.education.fr/caramel/caramel/-/issues)
- 📖 **Documentation** : tutoriel intégré (bouton « Tutoriel ») et [wiki du projet](https://forge.apps.education.fr/caramel/caramel/-/wikis/home)
- 🌐 **Application** : <https://caramel.forge.apps.education.fr/>

**Auteurs :**
- **Gauthier Remande** — Professeur de Lettres-Histoire (académie de Nantes) · [gauthier.remande@ac-nantes.fr](mailto:gauthier.remande@ac-nantes.fr)
- **Emmanuel Gaunard** — Professeur de mathématiques et chargé de mission DRANE (académie de Grenoble) · [emmanuel.gaunard@ac-grenoble.fr](mailto:emmanuel.gaunard@ac-grenoble.fr)

---

*Créé avec ❤️ par des enseignants, pour des enseignants.*
