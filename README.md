# Caramel

**Création Assistée de Ressources et d'Activités Magistère et Éléa**

[![Version](https://img.shields.io/badge/version-5.2.1-blue.svg)](https://caramel.forge.apps.education.fr/)
[![Licence](https://img.shields.io/badge/licence-GNU%20AGPLv3-green.svg)](LICENSE)
[![Plateforme](https://img.shields.io/badge/plateforme-Web-orange.svg)](https://caramel.forge.apps.education.fr/)

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Correctifs de la version 5.2.1](#correctifs-de-la-version-521)
- [Nouveautés de la version 5.2.0](#nouveautés-de-la-version-520)
- [Correctifs de la version 5.1.2](#correctifs-de-la-version-512)
- [Nouveautés de la version 5.1.1](#nouveautés-de-la-version-511)
- [Nouveautés de la version 5.1.0](#nouveautés-de-la-version-510)
- [Rappel des nouveautés de la version 5.0](#rappel-des-nouveautés-de-la-version-50)
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
- [Utilisation de l'IA dans le développement](#-utilisation-de-lia-dans-le-développement)
- [Licence](#-licence)
- [Contact et support](#-contact-et-support)

---

## 🎯 À propos

**Caramel** est une application web libre, gratuite et sans compte, conçue pour simplifier la **création d'activités pédagogiques interactives** via l'intelligence artificielle. Développée par et pour les enseignants de l'Éducation nationale française, elle automatise la production de contenus H5P et Moodle/Éléa/Magistère.

### Principe de fonctionnement

1. **Saisie du contexte pédagogique** : discipline, niveau, thème, nombre d'items
2. **Génération automatique de prompts IA** optimisés pour chaque type d'activité
3. **Appel à l'IA** via l'infrastructure souveraine ILaaS (Enseignement supérieur français)
4. **Conversion instantanée** en fichiers `.h5p` (H5P) ou `.mbz` (Moodle/Éléa)
5. **Téléchargement direct** prêt à importer dans Moodle/Éléa/Magistère

### Caractéristiques principales

- ✅ **100% client-side** : aucune donnée pédagogique ne quitte le navigateur
- ✅ **Sans compte** : aucune inscription ni authentification requise
- ✅ **Sans collecte de données** : respect total de la vie privée (RGPD)
- ✅ **Multi-plateforme** : compatible Moodle, Éléa, Magistère
- ✅ **Multilingue** : interface disponible en 11 langues
- ✅ **IA souveraine** : modèles hébergés sur infrastructure française (ILaaS)

---

## Correctifs de la version 5.2.1

> **10 avril 2026** — Correctif critique et transparence sur la protection des données.

- **Correctif import Livre sur Éléa** : Les activités Livre contenant des caractères Unicode exotiques (cunéiformes, hiéroglyphes, emojis) provoquaient une erreur `xml_parsing_error` à l'import. La fonction d'échappement XML générait des surrogates UTF-16 invalides. Corrigé via `codePointAt()` et le flag Unicode sur la regex.
- **Protection des données dans l'aide** : Nouvelle section « Vos données sont protégées de bout en bout » dans la philosophie du tutoriel (11 langues), détaillant l'extraction locale des documents, le transit via les serveurs universitaires du projet [ILaaS](https://www.ilaas.fr/), et la responsabilité en cas de copier-coller vers une IA externe.
- **Lien ILaaS** : URL [https://www.ilaas.fr/](https://www.ilaas.fr/) ajoutée dans le tutoriel et les mentions légales.
- **Suite de tests `test-moodle-unicode`** : 95 assertions, 8 exemples JSON dédiés (un par activité Moodle).

---

## Nouveautés de la version 5.2.0

### Nouvelle activité Livre (Moodle/Éléa)

- **Activité Livre multi-chapitres** : Création de cours pédagogiques structurés en plusieurs chapitres, parfaits pour des leçons longues, des dossiers thématiques ou des cours complets.
  - **4 à 6 chapitres** générés par défaut, avec sous-chapitres optionnels
  - Réutilise les **18 blocs visuels** de l'activité Page (bandeau d'ouverture, encadrés, tableaux, paragraphes, FAQ, sitographie, etc.)
  - **Thème visuel global** appliqué à tous les chapitres pour une cohérence d'ensemble (4 thèmes : elea, dsfr, accessible, dynamique)
  - **Numérotation décimale automatique** (1., 1.1, 2., 2.1) dans la table des matières
  - **3 réglages d'affichage** dans l'éditeur : numérotation, navigation, titres personnalisés
  - **Simulateur de prévisualisation fidèle** à l'affichage Moodle/Éléa avec table des matières latérale
  - **Aide à 3 niveaux** : description sidebar, mention dans le tutoriel, popover d'aide éditeur dédié
  - **Export DOCX/ODT/PDF** avec hiérarchie chapitres/sous-chapitres
  - Disponible dans **les 11 langues** de Caramel

### Améliorations de l'éditeur

- **Indentation visuelle des sous-chapitres** : Dans la liste des chapitres de l'éditeur, les sous-chapitres se décalent vers la droite avec un préfixe lettré (A., B., C.) qui se met à jour dynamiquement au clic sur la case « Sous-chapitre ». Pattern réutilisable pour toute future activité hiérarchique.

### Correctifs

- **Bug de traduction des prompts au changement de langue** (transversal) : Corrigé un bug qui faisait que le prompt d'une activité restait dans la langue précédente après changement de langue. La cause était dans le mécanisme `sessionStorage` qui restaurait l'ancien prompt par-dessus la nouvelle traduction. Désormais la langue est stockée avec le prompt et la restauration est ignorée si la langue a changé. **Bénéfice : ce correctif s'applique à toutes les activités**, pas seulement à Livre.

---

## Correctifs de la version 5.1.2

- **Éditeur Timeline** : L'ajout d'images dans l'éditeur visuel de l'activité Timeline revient au fonctionnement par URL uniquement. Le format H5P Timeline ne prend pas en charge les images uploadées comme fichiers embarqués — seules les URLs externes sont valides pour la couverture et les événements.

---

## Nouveautés de la version 5.1.1

### Accessibilité clavier

- **Tuiles d'activités** : Navigables via Tab, activables via Entrée/Espace, contour bleu `:focus-visible`.
- **Modales** : Toutes les modales (résultat, prévisualisation, aide, mentions légales, confirmation, sidebar) implémentent un focus trap clavier, fermeture Escape et restauration du focus à la fermeture.
- **Toggle Simple/Guidé** : Indicateur `:focus-visible` sur le slider.
- **Sélecteur de modèle IA** : Navigation au clavier (flèches haut/bas, Entrée/Espace) dans le dropdown de sélection de modèle.
- **Tutoriel** : Indicateurs `:focus-visible` sur les liens de navigation et sections dépliables.

### Performances et SEO

- **`font-display: swap`** sur FontAwesome : texte visible immédiatement au lieu de 3 secondes d'attente.
- **Dimensions explicites** sur les images statiques pour réduire le Cumulative Layout Shift.
- **Meta description** SEO ajoutée (aucun cookie ni tracking).
- **Liens crawlables** : Les sélecteurs de langue et le lien Mentions légales utilisent des `<button>` sémantiques au lieu de `<a href="#">`.

---

## Nouveautés de la version 5.1.0

### Nouvelle activité

- **Course Presentation (H5P)** : Nouvelle activité permettant de créer des présentations interactives multi-diapositives contenant du texte, des images et des éléments interactifs. Idéal pour structurer un cours sous forme de diaporama intégrable dans Éléa, Magistère ou toute plateforme compatible H5P.

### Images utilisateur dans les activités H5P

- **12 activités compatibles** : Ajoutez vos propres images directement dans l'éditeur intégré, par glisser-déposer ou sélection de fichier. Les images sont redimensionnées automatiquement et intégrées dans le fichier .h5p — 100% client-side, aucun traitement serveur.
  - **Flashcards** et **DialogCards** : image optionnelle par carte
  - **DragAndDrop** : image d'arrière-plan + images d'étiquettes
  - **Crossword** : image d'arrière-plan de la grille
  - **CoursePresentation** : image par diapositive (4 positions au choix)
  - **Timeline** : choix entre URL externe ou image uploadée (couverture + événements)
  - **MultipleChoice, TrueFalse, Essay, FillInTheBlanks, DragTheWords, MarkTheWords** : image de contexte
- **Export document** : Les images sont incluses dans les exports DOCX, ODT et PDF (Flashcards/DialogCards dans les tableaux recto/verso, activités media après l'énoncé, Timeline et CoursePresentation).
- **Preview instantanée** : Les images uploadées sont visibles dans la prévisualisation H5P intégrée.

### Éditeur visuel enrichi

- **Texte enrichi (WYSIWYG)** : Les champs compatibles affichent une barre d'outils contextuelle avec mise en forme (gras, italique, souligné, barré, exposant, indice), couleur, listes, liens et bascule code source. Les champs courts disposent d'une version compacte.
- **Assistant de formules mathématiques** : Bouton √x pour insérer des formules LaTeX avec aperçu MathJax en temps réel, 6 catégories de symboles et double-clic pour éditer une formule existante.
- **Marqueurs visuels** : Mode spécial pour Glisser les mots, Marquer les mots et Texte à trous (H5P) avec surlignage automatique des mots marqués par astérisques.
- **Éditeur Cloze visuel** : Pour l'activité Test Éléa, les trous Moodle (`{1:MULTICHOICE:...}`) sont remplacés par des pastilles colorées (bleu/jaune/vert) configurables d'un double-clic.
- **Rendu MathJax dans la preview** : Les formules LaTeX sont rendues correctement dans la prévisualisation H5P intégrée.
- **Exports enrichis** : Support complet du texte enrichi (couleur, liens, souligné, barré, exposant, indice, listes) dans les exports DOCX, ODT et PDF. Les formules mathématiques LaTeX sont exportées comme formules éditables (OMML dans Word, MathML dans LibreOffice) au lieu de simples caractères Unicode.

### Activité Test enrichie

- **Indices progressifs** : 1 à 2 indices par question (tous types y compris Texte à trous), affichés de manière interactive dans le simulateur.
- **Feedbacks combinés** : Messages globaux selon le résultat (correct, partiellement correct, incorrect) pour les QCM et Appariement.
- **Options QCM** : Numérotation des choix (aucune, a.b.c., 1.2.3., A.B.C., i.ii.iii.) et affichage des instructions standard, configurables dans l'éditeur.

### Réglages avancés H5P

- **16 activités configurables** : Nouvelle section « Réglages » repliée par défaut dans l'éditeur, exposant les paramètres comportementaux (`behaviour`) pour MultipleChoice, TrueFalse, FillInTheBlanks, Flashcards, QuizSet, Crossword, FindTheWords, DragTheWords, DragAndDrop, MarkTheWords, DialogCards, Essay, SortParagraphs, SingleChoiceSet, Summary, Glossary et Timeline. Les valeurs par défaut sont conservées pour la génération rapide.
- **Thème visuel pour les Mots croisés** : 6 palettes prédéfinies (Par défaut, Éléa, DSFR, Accessible, Dynamique, Nature) qui pré-remplissent les 8 couleurs de la grille. Les exports DOCX/ODT/PDF utilisent les couleurs du thème choisi.

### Accessibilité

- **Score Lighthouse Accessibilité 100/100** : Lien d'évitement, labels accessibles, `aria-required`, focus visible, contrastes WCAG AA, `aria-live` sur les messages d'erreur, support RTL pour l'arabe.

### Correctifs

- **Export Moodle (Devoir, Glossaire, Page)** : Correction de l'import MBZ dans Moodle grâce à l'ajout du fichier `calendar.xml` manquant.
- **Prompts IA — Langue cible adaptable** : Les prompts permettent désormais aux enseignants de langues de générer du contenu directement dans la langue enseignée en le précisant dans leur description.
- **Chargement des bibliothèques — retry après échec réseau** : Les bibliothèques OCR et autres se rechargent automatiquement après un échec réseau, sans nécessiter un rechargement de page.

---

## Rappel des nouveautés de la version 5.0

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

- **DOMPurify 3.3.3 intégré** : Assainissement du JSON généré pour prévenir toute injection
- **Validation complète des entrées** : Escaping des contenus XML/HTML, traitement sécurisé des URLs
- **Mise à jour des dépendances** : Montée de version généralisée (dont pdf.js) vers versions sécurisées

---

## ⚡ Fonctionnalités principales

### Génération assistée par IA

- **Prompts pré-configurés** : modèles optimisés pour chaque type d'activité
- **5 modèles IA** disponibles via ILaaS (Mistral, Llama, GPT-OSS, Qwen)
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

### Activités H5P (21 types)

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
- **Course Presentation** : présentations interactives multi-diapositives

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
- **Livre Éléa** : cours pédagogiques **multi-chapitres** réutilisant les 18 mêmes blocs que Page, avec table des matières automatique, sous-chapitres optionnels et numérotation décimale (1., 1.1, 2., etc.). Idéal pour structurer un cours complet ou un dossier thématique.
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
│  4. Appel API via n8n → ILaaS                               │
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
- **[PDF.js](https://mozilla.github.io/pdf.js/)** 5.5.207 (Apache 2.0) : extraction de texte PDF
- **[Tesseract.js](https://tesseract.projectnaptha.com/)** 7.0.0 (Apache 2.0) : OCR multilingue (PDF scannés, images)
- **[Mammoth.js](https://github.com/mwilliamson/mammoth.js)** 1.12.0 (BSD-2-Clause) : lecture de fichiers DOCX
- **[jsPDF](https://github.com/parallax/jsPDF)** 4.2.1 (MIT) : génération de fichiers PDF
- **[jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)** 5.0.7 (MIT) : création de tableaux dans les PDF
- **[MathJax](https://www.mathjax.org/)** 3.2.2 (Apache 2.0) : rendu des formules mathématiques
- **[H5P Standalone](https://github.com/tunapanda/h5p-standalone)** 3.8.2 (MIT) : visualisation des activités H5P

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

#### Intégration IA sécurisée — Architecture asynchrone (polling)

```
┌─────────────┐  POST /submit   ┌──────────────┐                  ┌──────────┐
│   Caramel   │ ──────────────> │  1. Submit   │                  │          │
│  (Browser)  │ <── {taskId} ── │  (~100ms)    │ ─── fire & ───>  │          │
│             │                 └──────────────┘     forget        │          │
│             │                                                     │ 2.Worker │
│             │  GET /result    ┌──────────────┐                   │ (10-180s)│
│             │ ──────────────> │  3. Result   │ <── SELECT ────── │          │
│             │ <── {status} ── │  (~50ms)     │     Postgres      │  ILaaS   │
│             │    (polling     └──────────────┘                   │  (GPU FR)│
│             │     toutes                                          │          │
│             │     les 3s)     ┌──────────────┐                   └──────────┘
│             │                 │  4. Cleanup  │ <── cron/1min
└─────────────┘                 │  (purge DB)  │
                                └──────────────┘
```

**Points clés** :
- Le slot n8n est libéré en **~100ms** — plus aucun risque de saturation par des exécutions zombie
- La fermeture d'onglet ou une erreur réseau côté client est **sans impact** sur le serveur
- Proxy n8n (Scalingo) : `https://n8n-caramel.osc-fr1.scalingo.io`
- Clés API gérées côté serveur (non exposées en frontend)
- File de tâches Postgres avec statuts : `pending` → `running` → `done` / `error`
- Cascade de fallback automatique sur 3 modèles LLM (timeout 59s par tentative)
- Infrastructure ILaaS : data centers ESR français labellisés

---

## 🤖 Modèles d'IA disponibles

Caramel utilise l'infrastructure **[ILaaS](https://ILaaS.fr/)** (Infrastructure de LLMs as a Service) via l'Incubateur du Ministère de l'Éducation nationale.

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
- **Journalisation** : selon politique de confidentialité ILaaS (consulter leurs CGU)

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

- **Requêtes IA** : transmises via workflow n8n chiffré → ILaaS
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
- L'API n8n de l'Incubateur (proxy ILaaS)
- Les modèles IA par défaut
- Les traductions embarquées

---

## 📁 Structure du projet

```
caramel/
│
├── .claude/                             # 🔧 Configuration Claude Code
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
│   └── components/                     # Composants modulaires
│       ├── json-editor.css
│       ├── llm.css
│       ├── modale-aide.css
│       ├── mentions-legales.css
│       ├── richtext-editor.css
│       ├── cloze-editor.css
│       └── debug-logger.css
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
│   │   ├── field-constraints.js       # Contraintes de rendu par champ/activité (27 activités, 99 champs, 6 types)
│   │   └── processors/                # 21 processeurs H5P
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
│   │       ├── ComplexFillTheBlanks.js # Texte à trous complexe
│   │       └── CoursePresentation.js  # Présentation interactive multi-diapositives
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
│   │       │   ├── Livre.js           # Livre Éléa multi-chapitres (module book)
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
│   │   ├── crossword-grid-capture.js  # Capture grille mots croisés (depuis H5P)
│   │   ├── crossword-grid-generator.js # Génération grille mots croisés (standalone)
│   │   ├── find-the-words-grid-capture.js # Capture grille mots mêlés (depuis H5P)
│   │   └── find-the-words-grid-generator.js # Génération grille mots mêlés (standalone)
│   │
│   ├── export/                         # Export documentaire
│   │   ├── document-exporter.js       # Export DOCX/ODT/PDF
│   │   ├── document-formatter.js      # Formatage par type
│   │   ├── sanitizer.js               # Nettoyage HTML/XML
│   │   ├── latex-parser.js            # Parser LaTeX → AST (partagé)
│   │   ├── math-catalog.js            # Catalogue 177 symboles (Unicode/MathML/OMML/StarMath)
│   │   ├── latex-to-omml.js           # AST → OMML (formules éditables Word)
│   │   └── latex-to-mathml.js         # AST → MathML (formules éditables LibreOffice)
│   │
│   ├── editor/                         # Éditeur JSON visuel (11 fichiers)
│   │   ├── index.js                   # Point d'entrée éditeur
│   │   ├── editor-core.js             # Logique centrale de l'éditeur
│   │   ├── field-renderers.js         # Rendu des champs JSON
│   │   ├── array-manager.js           # Gestion des tableaux
│   │   ├── richtext-editor.js         # Éditeur WYSIWYG (texte enrichi, LaTeX, marqueurs)
│   │   ├── formula-assistant.js       # Assistant de formules mathématiques
│   │   ├── cloze-editor.js            # Éditeur visuel Cloze (texte à trous)
│   │   ├── feedback-editor.js         # Édition des retours/feedback
│   │   ├── content-detector.js        # Détection de contenu
│   │   ├── json-utils.js              # Utilitaires JSON
│   │   └── validators.js              # Validateurs de champs
│   │
│   ├── locales/                         # Fichiers de langues JSON (11)
│   │   ├── fr.json .................. Français (2034 clés)
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
│   ├── PRD_FIELD_CONSTRAINTS_LATEX.md   # PRD contraintes de champs & enrichissement LaTeX
│   ├── PRD_COURSE_PRESENTATION.md       # PRD activité Course Presentation
│   ├── PRD_NOUVELLE_ACTIVITE_H5P.md     # PRD template nouvelle activité H5P
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
├── scripts/                             # 🔧 Scripts utilitaires (Node.js)
│   ├── update-locale-latex.mjs          # Propagation contraintes LaTeX dans les 11 locales
│   ├── verify-all-locales.mjs           # Vérification des contraintes dans toutes les locales
│   ├── verify-locale-latex.mjs          # Vérification LaTeX par locale
│   ├── debug-old-patterns.mjs           # Diagnostic patterns LaTeX obsolètes
│   ├── translate-course-presentation.mjs # Traduction Course Presentation (langues latines)
│   ├── translate-cp-ar.mjs              # Traduction Course Presentation (arabe)
│   ├── translate-cp-zh.mjs              # Traduction Course Presentation (chinois)
│   ├── translate-cp-jp.mjs              # Traduction Course Presentation (japonais)
│   └── translate-cp-el.mjs              # Traduction Course Presentation (grec)
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
│   ├── test-h5p-prefetch.html/js        # Suite 12 : Préchargement libs H5P
│   └── field-constraints-dashboard.html # Dashboard interactif des contraintes de champs
│
├── index.html                           # 🏠 Application web principale
│
├── 📄 Fichiers de configuration et documentation (racine)
│   ├── CLAUDE.md                        # 🤖 Instructions pour Claude Code
│   ├── README.md                        # 📖 Documentation (ce fichier)
│   ├── CHANGELOG                        # 📋 Journal de versions (v5.0.2 et antérieures)
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
| llm.js | `js/services/` | Client polling asynchrone : POST /submit → GET /result (3s) → fallback x3 modèles |
| ocr.js | `js/services/` | OCR universel (PDF, DOCX, PPTX, ODT, PNG, JPG) |
| prompt-generator.js | `js/services/` | Génération de prompts optimisés par type |

**H5P & Moodle**
| Module | Localisation | Rôle |
|--------|--------------|------|
| h5p-creator.js | `js/h5p/` | Packaging H5P (JSZip), création `.h5p` |
| h5p-manager.js | `js/h5p/` | Gestionnaire centralisé H5P |
| h5p-prefetch.js | `js/h5p/` | Préchargement intelligent des libs H5P |
| h5p-processors/* | `js/h5p/processors/` | 21 processeurs spécialisés (Timeline, Quiz, CoursePresentation, etc.) |
| json-healer.js | `js/h5p/` | Réparation JSON (LaTeX, versions, structure) |
| field-constraints.js | `js/h5p/` | Contraintes de rendu par champ/activité (27 activités, 99 champs, 6 types) |
| moodle-creator.js | `js/moodle/` | Packaging MBZ (TAR+GZIP, substitutions XML) |
| moodle-formats.js | `js/moodle/` | Génération XML/GIFT |
| moodle-processors/* | `js/moodle/processors/` | 9 processeurs (QCM, Appariement, Page, Livre, Devoir, etc.) |

**Interface & Export**
| Module | Localisation | Rôle |
|--------|--------------|------|
| ui.js | `js/ui/` | Navigation, onglets, tuiles, modales |
| notifications.js | `js/ui/` | Toasts, historique, menu notifications |
| animations.js | `js/ui/` | Effets visuels et transitions |
| document-exporter.js | `js/export/` | Export DOCX/ODT/PDF |
| document-formatter.js | `js/export/` | Formatage et mise en page |
| sanitizer.js | `js/export/` | Assainissement HTML/XML/JSON |
| latex-parser.js | `js/export/` | Parser LaTeX → AST (partagé OMML/MathML) |
| math-catalog.js | `js/export/` | Catalogue 177 symboles LaTeX/Unicode/MathML/StarMath |
| latex-to-omml.js | `js/export/` | Formules éditables Word (OMML via docx.js) |
| latex-to-mathml.js | `js/export/` | Formules éditables LibreOffice (MathML + StarMath) |
| math-renderer.js | `js/renderers/` | Rendu formules mathématiques (MathJax, Unicode) |
| chart-renderer.js | `js/renderers/` | Rendu diagrammes et graphiques |
| image-utils.js | `js/renderers/` | Traitement des images |
| crossword-grid-captur.js | `js/renderers/` | Capture de la grille des mots croisés |
| crossword-grid-generator.js | `js/renderers/` | Génération standalone grille mots croisés |
| find-the-words-grid-captur.js | `js/renderers/` | Capture de la grille des mots fléchés |
| find-the-words-grid-generator.js | `js/renderers/` | Génération standalone grille mots mêlés |

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

## 🧠 Utilisation de l'IA dans le développement

### Philosophie

Caramel est un projet conçu et piloté par deux enseignants — Gauthier REMANDE et Emmanuel GAUNARD — qui ne sont pas développeurs professionnels mais avec des bases de programmation initiales. L'intelligence artificielle a été utilisée tout au long du projet comme un **allié de conception** : pour trouver des conseils, organiser les idées, structurer la pensée, explorer des pistes techniques et produire du code. Chaque décision d'architecture, chaque choix fonctionnel et chaque validation finale restent sous la responsabilité des deux auteurs.

### Outils IA utilisés

Nous avons mobilisé plusieurs IA en exploitant les forces de chacune et leur disponibilité à un instant donné :

| Outil | Usage principal |
|-------|----------------|
| **Claude Code** (Anthropic) | Développement au quotidien : écriture et refactorisation du code, création des processeurs H5P/Moodle, système d'export documentaire, éditeur visuel, tests. Outil principal depuis la v5.0. |
| **ChatGPT / Codex** (OpenAI) | Prototypage initial, exploration de concepts, résolution de problèmes ponctuels, rédaction de prompts IA pour les activités pédagogiques. |
| **Gemini via Antigravity** (Google) | Recherche documentaire, vérification de spécifications (formats H5P, XML Moodle), exploration d'alternatives techniques. |

### Comment l'IA intervient concrètement

- **Architecture et structuration** : L'organisation modulaire du projet (core, services, ui, h5p, moodle, export, editor, renderers) a été pensée avec l'aide de l'IA pour garantir la maintenabilité d'une base de code qui dépasse aujourd'hui les 80 fichiers JavaScript.
- **Écriture du code** : La grande majorité du code a été écrite avec assistance IA — des processeurs H5P (21 types) aux exports documentaires (pipeline LaTeX→OMML/MathML), en passant par le système d'internationalisation (11 langues, ~2 000 clés). Les auteurs décrivent le besoin fonctionnel, l'IA propose une implémentation, les auteurs valident, testent et itèrent.
- **Réparation et robustesse** : Le module `json-healer.js`, qui corrige automatiquement les sorties malformées de l'IA générative, a lui-même été développé avec l'aide de l'IA — une forme de méta-utilisation où l'IA aide à compenser les limites de l'IA.
- **Tests** : Les 12 suites de tests (~2 500 assertions) ont été co-écrites avec l'IA pour couvrir le pipeline de bout en bout.
- **Documentation** : Les guides techniques (`docs/`), les prompts pédagogiques (`assets/data/prompts/`) et ce README ont été rédigés avec assistance IA.

### Ce que l'IA ne fait pas

- **Décisions pédagogiques** : Le choix des types d'activités, la structure des prompts pédagogiques et les attentes en termes de qualité de contenu sont entièrement définis par les auteurs, enseignants de terrain.
- **Validation fonctionnelle** : Chaque fonctionnalité est testée manuellement dans un navigateur, importée dans Éléa/Moodle et vérifiée par les auteurs avant publication.
- **Conception UX** : L'expérience utilisateur (parcours de génération, design glassmorphism, modes simple/guidé) est le fruit de la réflexion des auteurs et des retours de la communauté enseignante.

### Transparence

Le code source est intégralement disponible sur cette Forge. L'historique Git reflète le processus de développement itératif, avec des commits en français décrivant chaque évolution. Nous assumons pleinement l'utilisation de l'IA comme outil de productivité, au même titre qu'un IDE ou une documentation en ligne : c'est un moyen, pas une fin. La valeur du projet réside dans la vision pédagogique, les choix de conception et la qualité du résultat final — pas dans la manière dont les lignes de code ont été produites.

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
- **ILaaS** : mise à disposition de modèles IA souverains
- **Communauté H5P** : ressources et templates de référence
- **Contributeurs open source** : développeurs des bibliothèques utilisées
