# Caramel 🍬

> **Chantier sur `emmanuel`** : [état des lieux et tâches H5P, éditeur, parcours et Sucrerie](docs/SUIVI_H5P_PARCOURS.md). Ce suivi distingue les fonctions réalisées des compléments et recettes encore ouverts.

**Création Assistée de Ressources et d'Activités Magistère et Éléa**

[![Version](https://img.shields.io/badge/version-7.0.0-blue.svg)](https://caramel.forge.apps.education.fr/)
[![Licence](https://img.shields.io/badge/licence-GNU%20AGPLv3-green.svg)](LICENSE)
[![Plateforme](https://img.shields.io/badge/plateforme-Web-orange.svg)](https://caramel.forge.apps.education.fr/)
[![Langues](https://img.shields.io/badge/langues-12-purple.svg)](#-fonctionnalités)

Caramel est une application web **libre, gratuite et sans compte** qui génère des activités pédagogiques interactives par intelligence artificielle. Conçue par et pour les enseignants, elle produit en quelques minutes des fichiers **H5P** (`.h5p`) et **Moodle/Éléa/Magistère** (`.mbz`, `.xml`) prêts à importer.

> 🌐 **Application en ligne (aucune installation)** : **<https://caramel.forge.apps.education.fr/>**

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Nouveautés 7.0.0](#-nouveautés-700)
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
2. **Choisir** un type d'activité parmi 35 tuiles
3. **Générer** le contenu via l'infrastructure IA souveraine française **ILaaS**
4. **Affiner** dans l'éditeur visuel intégré (questions, formules, images, texte enrichi)
5. **Télécharger** le fichier prêt à importer dans Moodle, Éléa ou Magistère

Le commutateur placé sous le formulaire propose **« Une activité »**, le fonctionnement habituel, ou **« Un parcours »**, qui reprend ce même contexte pour concevoir un cours complet : cadrage, plan modifiable, fabrication des activités et livraison du fichier `.mbz`.

### Principes

- ✅ **100 % client-side** : tout le traitement se fait dans le navigateur — seuls partent vers les services IA les prompts, et le cas échéant les images, la voix et le texte des dictées
- ✅ **Sans compte, sans cookie de suivi, sans collecte de données personnelles** (RGPD)
- ✅ **IA souveraine** : modèles hébergés sur infrastructure française
- ✅ **Multilingue** : interface et génération en 12 langues (dont le breton)
- ✅ **Aucun build, aucun `npm`** : ES6 modules natifs servis en statique

---

## 🆕 Nouveautés 7.0.0

> **28 septembre 2026** — De l’activité unique au parcours complet, dans les 12 langues de Caramel.

![Le plan d’un parcours, relu avant toute génération : objectif, étapes, activités, durées et relecture du plan](assets/images/wiki/parcours-plan.webp)

- **Un atelier de parcours pour Éléa, Magistère et Moodle** : utilisez votre saisie habituelle, choisissez la modalité et l’ampleur, puis partez d’un plan proposé par l’IA ou d’une trame à compléter.
- **Un plan que vous maîtrisez** : éditez les étapes, objectifs, activités, consignes et durées ; réorganisez l’ensemble avant de lancer la fabrication.
- **Des activités à relire et à retoucher** : génération en série, arrêt et reprise, aperçus et éditeur intégrés. Les contenus déjà préparés sont conservés.
- **Les supports au bon endroit** : renseignez la vidéo ou joignez l’image directement dans sa carte. La génération, l’éditeur et les aperçus réutilisent les outils des activités individuelles ; les images suivent le scénario et l’export du parcours.
- **Une carte de progression personnalisable sur Éléa** : choisissez un thème ou ajoutez votre propre fond avec la tuile « + ». Les photos d’iPhone et les formats d’image courants sont convertis localement ; le fond accompagne le scénario et le `.mbz`. Cette carte reste facultative.
- **Un cours et ses documents** : téléchargez le parcours `.mbz`, la fiche de séquence et les contenus en DOCX, ODT ou PDF. Exportez aussi le scénario `.json` pour poursuivre votre travail après fermeture de l’onglet.
- **Les modules de votre plateforme** : forum, sondage, questionnaire, leçon, atelier d’évaluation par les pairs, wiki, document collaboratif, tableau, base de données… L’IA en rédige les consignes, les questions ou les critères ; un paquetage IMS s’écrit entièrement dans Caramel.
- **Vingt trames relues à la lumière de la recherche**, dont « Apprendre à apprendre » : ABC Learning Design, didactiques et sciences cognitives de l’apprentissage ([état de l’art](docs/ETAT_DE_L_ART_DIDACTIQUE_PARCOURS_2026-09-28.md)).
- **Des quiz générés plus vite, sans plantage** : même en mode Rapide, le quiz est préparé par petits lots rédigés deux par deux, et un lot qui échoue est repris en plus petit au lieu de faire échouer toute la génération. Cinq questions en une quinzaine de secondes, dix en une demi-minute environ ; le quiz mixte garde des exercices de types variés.
- **De nouveaux modèles d’IA** : Gemma 4, Qwen 3.8 et Mistral Small 4 (par défaut), à la suite du renouvellement de l’offre ILaaS.
- **Un accès depuis Caramelia et une aide multilingue** : création ou reprise du parcours, tutoriel dédié et vocabulaire adapté aux élèves, stagiaires ou étudiants, **y compris en breton**.

### Parmi les nouveautés 6.3.0

> **20 août 2026** — La dictée audio de bout en bout, un glisser-déposer que l'on met en page, et des images que l'IA sait lire.

- **🎧 Nouvelle activité « Dictée » (H5P.Dictation)** : à partir d'un simple thème, l'IA rédige la consigne et les phrases — Caramel se charge de la voix. Les phrases sont **synthétisées automatiquement** par un service de synthèse vocale souverain : 11 langues (toutes sauf le breton, pour lequel il n'existe pas de voix), voix féminine ou masculine, piste **« lecture lente »** optionnelle. L'élève écoute, écrit, et la correction met les fautes en évidence.
- **🎙️ Dictaphone « Ma voix »** : dans l'éditeur, enregistrez chaque phrase **au microphone**, rognez la prise et laissez Caramel en générer une version ralentie (vitesse réglable). Un audio enregistré ou téléversé n'est jamais écrasé par la synthèse, et une régénération ne re-synthétise que les phrases modifiées.
- **📝 Feuille élève à l'export** : en DOCX / ODT / PDF, la Dictée devient une feuille de travail — consigne, illustration, **lignes d'écriture numérotées**, puis la correction.
- **🖐️ Glisser-déposer : disposition des zones personnalisable** : l'éditeur gagne une vue **« Sur le canevas »** (même principe que la Vidéo et l'Image interactives) pour placer, redimensionner et aligner zones et étiquettes à la souris, en ajoutant les unes et les autres sans quitter le canevas.
- **📦 Activité « Test » : export `.mbz` restaurable** : en plus de la banque de questions XML/GIFT, générer un Test produit désormais un fichier **`.mbz`** qui restaure une **activité Test complète** dans un cours Éléa/Moodle.
- **👁️ Analyse d'images par IA de vision** : une image jointe au corpus (schéma, diagramme, photo de cours, page scannée) est d'abord **décrite et transcrite par un modèle de vision** avant de rejoindre le contexte, l'OCR local restant le repli. WebP et BMP sont désormais acceptés.
- **📺 Vidéo interactive** : les vidéos du **Tube de Réseau Canopé** (`tube.reseau-canope.fr`) sont acceptées, et un réglage unique décide si les questions s'**affichent directement sur la vidéo** ou derrière une icône à cliquer.
- **🎯 Programmes scolaires consultés à bon escient** : la recherche dans les programmes officiels (RAG) n'est plus lancée à chaque génération mais **déduite** du contexte saisi (niveau, public, corpus fourni) — sans aucun bouton ni question supplémentaire.

### Depuis la 6.0

- **6.2.x** — **Image interactive** (H5P.ImageHotspots) et les deux questions sur image **« Trouver la zone »** / **« Trouver les zones »** : détection des zones assistée par IA de vision, édition visuelle directement sur l'image, export documentaire à pastilles numérotées. Tutoriel du site refondu en centre d'aide ; **Livre** Moodle redessiné sur les quatre thèmes accessibles de la Page.
- **6.1.x** — Alignement complet des librairies H5P sur la nouvelle génération « Components » d'Éléa ; mentions légales listant les versions de librairies H5P exportées ; transcription des vidéos longues fiabilisée.
- **6.0.0** — Vidéo interactive, Livre interactif, transcription audio et vidéo, import d'une page web, génération « par lots », export PDF haute fidélité, chatbot **Caramelia**.

📜 **Historique complet** : voir le [CHANGELOG](CHANGELOG).

---

## ⚡ Fonctionnalités

### Génération assistée par IA
- Prompts pré-optimisés par type d'activité, dans les 12 langues
- Modèles IA souverains via ILaaS, avec **cascade de repli automatique** sur 3 modèles
- Découpage automatique des générations en petits lots (« par lots »), menés deux à deux et repris en plus petit si l’un échoue — y compris pour les quiz en mode Rapide
- Ancrage sur les **programmes scolaires français** (RAG) déclenché automatiquement quand le contexte saisi s'y prête

### Enrichissement du contexte (RAG)
- **Documents** : PDF, TXT, DOCX, PPTX, ODT, ODP — extraction native, dans le navigateur
- **Images** : PNG, JPEG, WebP, BMP — décrites et transcrites par un **modèle de vision**, avec repli OCR local (Tesseract.js)
- **Transcription** : audio et vidéo (bande-son), jusqu'à 90 min
- **Import web** : récupération du texte d'une page par lien
- **Dictée vocale** au micro sur les champs de description
- Limite de contexte : 120 000 caractères

### Édition et exports
- Éditeur visuel intégré : texte enrichi (WYSIWYG), assistant de **formules LaTeX**, éditeur Cloze visuel, ajout d'images
- Panneaux d'édition directe pour les activités visuelles : **sur la vidéo**, **sur l'image**, **sur le canevas** du glisser-déposer, réglages de voix et dictaphone pour la **Dictée**
- Prévisualisation fidèle de chaque activité avant téléchargement
- Exports **DOCX, ODT, PDF** pour toutes les activités, avec **formules mathématiques éditables** (OMML pour Word, MathML/StarMath pour LibreOffice)
- Packaging côté client : `.h5p` (ZIP), `.mbz` (TAR+GZIP), `.xml`/`.gift`, `.html`

### Interface
- Design glassmorphism, responsive, thèmes clair/sombre
- Navigation par onglets, historique des générations, téléchargement groupé (ZIP)
- Accessibilité RGAA (navigation clavier complète, focus trap, support RTL)

---

## 📚 Types d'activités

**35 types** au total : **27 H5P** + **8 Moodle/Éléa**.

### Activités H5P (`.h5p`)

| Catégorie | Activités |
|-----------|-----------|
| **Quiz & tests** | Quiz mixte (QuestionSet), Quiz QCM, Quiz Vrai/Faux, Choix multiples, Vrai/Faux, Série de choix uniques, Trouver la zone, Trouver les zones |
| **Manipulation de texte** | Texte à trous, Glisser les mots, Surligner les mots, Ordonner les paragraphes, Glisser-déposer, Rédaction, Résumé, **Dictée** *(nouveau)* |
| **Mémorisation & découverte** | Cartes mémoires, Frise chronologique, Mots croisés, Mots mêlés, Cartes de dialogue, Glossaire/Accordéon, Diagramme |
| **Contenus interactifs riches** | Présentation de cours, Livre interactif, Vidéo interactive, Image interactive |

### Activités Moodle/Éléa (`.mbz`, `.xml`, `.html`)

| Activité | Format | Description |
|----------|--------|-------------|
| **Page** | `.mbz` / `.html` | Page de cours riche (18 types de blocs, 4 thèmes visuels) |
| **Livre** | `.mbz` | Cours multi-chapitres réutilisant les blocs de Page (table des matières, numérotation décimale) |
| **Test / Banque** | `.mbz` / `.xml` / `.gift` | Activité Test restaurable **et** questions pour la banque Moodle (formats universels) |
| **QCM** | `.mbz` | Quiz à choix multiples prêt à restaurer |
| **Appariement** | `.mbz` | Association de paires |
| **Millionnaire** | `.mbz` | Jeu « Qui veut gagner des millions » pédagogique |
| **Glossaire** | `.xml` | Dictionnaire de termes, prêt à importer dans un glossaire Moodle |
| **Devoir** | `.mbz` | Grille d'évaluation critériée et niveaux de réussite |

> 💡 **H5P** : universel, léger, partageable entre plateformes. **Moodle/Éléa** : intégration native (suivi, notes, feedback personnalisé).

---

## 🚀 Démarrage rapide

### Mode Rapide (2 champs)
1. **Qui êtes-vous ?** (ex. _Professeur de mathématiques en lycée_)
2. **Que souhaitez-vous aborder ?** (ex. _Introduction aux fractions en 6e_)

### Mode Avancé (paramètres détaillés)
Discipline · Thème · Niveau · Nombre d'éléments · contexte RAG optionnel (documents, images, audio/vidéo, lien web).

### Génération
- **Mode Simple** : un clic, l'IA génère et le contenu s'ouvre dans l'éditeur
- **Mode Guidé** : Caramel fournit un prompt à copier dans l'IA externe de votre choix, puis vous collez le JSON obtenu

---

## 🤖 Modèles d'IA

Caramel utilise l'infrastructure souveraine **[ILaaS](https://www.ilaas.fr/)** via l'Incubateur du Ministère de l'Éducation nationale.

| Modèle | Paramètres | Mis en avant | Organisation |
|--------|------------|--------------|--------------|
| **Gemma 4** | 31B | ⭐ | Google |
| **Qwen 3.8** | 27B | ⭐ | Qwen |
| **Mistral Small 4** | 119B | ⭐ **(défaut)** | Mistral AI |
| Qwen 3.6 | 35B | (mode debug) | Qwen |
| Llama 3.1 | 8B | (mode debug) | Neural Magic |
| Mistral Medium | — | (mode debug) | Mistral AI |

Qwen 3.8 remplace progressivement Qwen 3.6 chez ILaaS : tant qu'il n'est pas servi, c'est Qwen 3.6 qui répond à sa place, automatiquement.

Un modèle de **vision** (Qwen 3.8, Qwen 3.6 en relais) est mobilisé à part pour l'analyse des images jointes au corpus et la détection des zones cliquables d'une « Image interactive ».

- **Hébergement** : data centers de l'Enseignement supérieur et de la recherche (ESR) français
- **Confidentialité** : requêtes traitées uniquement pour l'exécution, pas de réentraînement
- **Aucun envoi vers une IA commerciale grand public**

---

## 🛠️ Architecture technique

### Stack (100 % frontend, ES6 modules natifs)

| Domaine | Bibliothèques |
|---------|---------------|
| Compression / packaging | JSZip 3.10.2, client-zip 2.5.1, fflate 0.8.3, tar-js 0.3.0 |
| Documents | PDF.js 6.3.289, Tesseract.js 7.0.0, Mammoth.js 1.13.0, docx 9.8.1 |
| Export PDF / math | jsPDF 4.2.1, jsPDF-AutoTable 5.0.8, MathJax 4.1.3 |
| Images & médias | heic2any 0.0.4, UTIF 3.1.0, pako 3.0.2, qrcode-generator 2.0.4 |
| H5P & sécurité | h5p-standalone 3.8.2, DOMPurify 3.4.16 |
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
- **Cascade de repli** sur 3 modèles (timeout ~59 s par tentative), température fixée à 0,7 pour des réponses JSON régulières
- **RAG programmes officiels** : extraits des programmes scolaires français injectés selon le cycle détecté, **et seulement quand le contexte saisi s'y prête** (décision automatique côté client, sans réglage)

### Services associés
- **Transcription audio/vidéo** : service souverain **Albert (DINUM)**, basé sur Whisper — l'audio est transmis le temps de la transcription puis non conservé
- **Synthèse vocale (Dictée)** : miroir inverse de la transcription — le texte des phrases part vers un service **Piper / OpenJTalk** relayé par n8n et revient en MP3 (11 langues — les 12 de l'interface **moins le breton**, faute de voix disponible ; une dictée créée en breton retombe sur la voix française — voix féminine/masculine, lecture lente). Aucune clé ni modèle côté navigateur
- **Vision** : description et transcription des images jointes, détection des zones cliquables — modèle de vision ILaaS, avec repli sur l'OCR local
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
- ✅ Documents bureautiques (PDF, TXT, DOCX, PPTX, ODT, ODP) **extraits localement**, dans le navigateur
- ✅ Génération IA sur infrastructure **ESR française**
- ⚠️ **Images jointes au corpus** : transmises au modèle de **vision ILaaS** pour être décrites et transcrites (repli sur l'OCR local Tesseract si le service est indisponible)
- ⚠️ **La voix, dans les deux sens** : dictée au micro, fichiers audio et bandes-son vidéo sont transmis à **Albert (DINUM)** pour transcription puis non conservés ; à l'inverse, les phrases d'une **Dictée** sont envoyées au service de synthèse vocale pour produire les MP3
- ⚠️ **Import web** : seul le lien est transmis ; le contenu de la page n'est pas stocké

### Mentions légales (résumé)

- **Éditeurs** : Gauthier Remande (PLP Lettres-Histoire, académie de Nantes) et Emmanuel Gaunard (professeur de mathématiques et chargé de mission DRANE, académie de Grenoble)
- **Hébergement** : Forge des Communs Numériques Éducatifs — Ministère de l'Éducation nationale et de la Jeunesse, 110 rue de Grenelle, 75007 Paris, France
- **Licence du code** : GNU AGPL v3.0 ou ultérieure

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
│   ├── core/                   # definitions.js (registre), translation.js, lib-loader.js, endpoints.js, language-codes.js
│   ├── services/               # llm.js, llm-batch.js, ocr.js, video-transcript.js, tts.js, image-analysis.js, hotspot-vision.js, rag-orchestrator.js, prompt-generator.js
│   ├── ui/                     # ui.js, notifications.js, animations.js, tutorial-modal.js, version-checker.js
│   ├── h5p/                    # h5p-creator, json-healer, field-constraints, image-manager, processors/ (26)
│   ├── moodle/                 # moodle-creator, moodle-formats, mbz-quiz-backup, page-themes/, processors/activities/ (8)
│   ├── renderers/              # chart, math, image, grilles mots croisés/mêlés, pastilles de zones
│   ├── export/                 # document-exporter/-formatter, course-formatter, latex-parser, math-catalog, OMML/MathML, pdf-via-gotenberg
│   ├── editor/                 # éditeur JSON visuel (richtext, formula-assistant, cloze, panneaux vidéo / image / glisser-déposer / dictée)
│   ├── simulators/             # prévisualisation (un module par activité, lazy-loaded)
│   ├── caramelia/              # chatbot d'assistance (13 modules, lazy-loaded)
│   ├── locales/                # 11 fichiers JSON (~2830 clés chacun)
│   ├── vendor/                 # bibliothèques externes versionnées
│   └── main.js                 # point d'entrée
├── docs/                       # PRD, guides, audits, plans
├── scripts/                    # outils Node (.mjs) : vérification locales, traductions, QA
├── tests/                      # 42 suites navigateur (test-all.html) + bancs Node (round-trip, QA Playwright)
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

Distribué sous **GNU AGPL v3.0 ou ultérieure** — voir [LICENSE](LICENSE).

✅ Utilisation (y compris commerciale), modification et redistribution autorisées.
La réutilisation du code doit respecter cette licence : conservation des notices de droit d’auteur et de licence, et fourniture du code source dans les cas prévus, notamment en cas de redistribution ou de mise à disposition d’une version modifiée par un réseau. Les bibliothèques et ressources tierces gardent leurs propres licences. Les contenus pédagogiques créés ou importés ne passent pas automatiquement sous AGPL.

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
