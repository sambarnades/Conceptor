# Plan de tests Caramel

Ce document recense toutes les suites de tests du projet, existantes et planifiees.
Chaque suite est decrite avec ses cas de test et une case a cocher pour suivre l'avancement.

---

## Suites existantes

### Suite 1 : Generation & Telechargement
**Fichier** : `tests/test-generation-download.html`
**Statut** : Implementee

- [x] Prechargement des modules JS et bibliotheques externes
- [x] Equivalence structuredClone vs JSON.parse/stringify
- [x] Pipeline H5P complet (heal → process → blob ZIP → relecture)
- [x] Pipeline Moodle MBZ (heal → fichiers XML → TAR+GZIP → relecture)
- [x] Generation XML/GIFT pour elea_test et glossaire
- [x] Smoke test visualisation H5P (8 types representatifs)
- [x] Lookup map et registre de modules (unicite, champs requis)
- [x] Export documentaire (formatContentForDocument pour chaque type)

### Suite 2 : Flux Edition & Re-export
**Fichier** : `tests/test-edit-export-flow.html`
**Statut** : Implementee

- [x] JSON brut IA → healer (reparation automatique)
- [x] Healer → processeur specifique par type
- [x] Processeur → blob H5P/MBZ
- [x] Blob → editeur visuel (detectContentType, normalize, denormalize)
- [x] Editeur → re-export (round-trip sans perte)
- [x] Preservation LaTeX a chaque etape

### Suite 3 : Internationalisation (i18n)
**Fichier** : `tests/test-i18n.html`
**Statut** : Implementee

- [x] Chargement de chaque locale via fetch (11 fichiers JSON)
- [x] Validation JSON (parseable, non vide, taille raisonnable)
- [x] Coherence des cles (memes cles que fr.json, meme nombre)
- [x] Ordre des cles identique entre les 11 fichiers
- [x] Cles manquantes / en trop entre langues
- [x] Aucune valeur vide ou non-string
- [x] Pas de whitespace parasite dans les cles HTML
- [x] Retours a la ligne preserves dans les cles de prompt
- [x] Backticks preserves (LaTeX, exemples JSON)
- [x] Fonction t() : cle connue, cle inconnue, null, vide
- [x] Changement de langue (loadTranslations pour chaque locale)
- [x] Couverture des definitions (chaque module a ses cles name/description)
- [x] Cles d'onglets (tab_all, tab_quiz, etc.) presentes
- [x] Cles d'erreur (error_parse, error_network, etc.) presentes
- [x] Performance : temps de chargement, changement de langue, translatePage

### Suite 4 : Coherence des definitions
**Fichier** : `tests/test-definitions.html`
**Statut** : Implementee

Verifie que tout est bien cable entre definitions.js, processeurs, prompts et exemples.

- [x] Chaque module H5P a tous ses champs requis (name, machineName, promptId, etc.)
- [x] Chaque module Moodle a tous ses champs requis (name, description, categories, etc.)
- [x] Chaque module H5P a un processeur (getModuleMetadata retourne des donnees)
- [x] Chaque processeur H5P a un machineName et une version
- [x] Chaque module Moodle a un processeur dans supportedActivities
- [x] Chaque module a un fichier prompt dans `assets/data/prompts/`
- [x] Chaque module a au moins un fichier exemple dans `assets/data/examples/`
- [x] Pas de doublon dans promptId, jsonInputId, createBtnId
- [x] Pas de doublon dans les cles de traduction (name)
- [x] Pas de doublon dans customOrder
- [x] Chaque module dans customOrder existe dans allModules
- [x] Chaque module visible est present dans customOrder
- [x] Chaque module a ses cles name et description dans fr.json
- [x] Chaque image d'activite referencee existe sur le disque

### Suite 5 : Interface utilisateur (UI)
**Fichier** : `tests/test-ui.html`
**Statut** : Implementee

Tests visuels et d'interaction via iframe (DOM complet de index.html).

- [x] generateTiles() produit le bon nombre de tuiles (modules visibles, comptage dynamique), sans doublons
- [x] Chaque tuile a un data-module, un titre non vide, une image qui se charge
- [x] Chaque tuile a un label de type (H5P/Elea)
- [x] Filtres par type : clic quiz filtre correctement, retour a "Tout" restaure tout
- [x] Filtres par plateforme : clic H5P filtre, re-clic desactive, filtres combines
- [x] Le selecteur de langue ouvre le dropdown et change document.documentElement.lang
- [x] Clic sur une tuile ouvre la sidebar, active la tuile, affiche l'overlay
- [x] Le bouton fermer referme la sidebar
- [x] Onglets Mode Rapide / Mode Avance : bascule, visibilite #advanced-fields, inputs #niveau et #nombreQuestions
- [x] Champs #qui et #quoi : presence, data-key, mecanisme tiles-disabled (vide = grise, rempli = actif)
- [x] Centre de notifications : cloche, badge, dropdown ouverture/fermeture, message "Aucune notification"
- [x] Footer : liens (>= 5), version vX.Y.Z, lien mentions legales, modale ouverture/fermeture
- [x] Zone OCR/RAG : #ocr-output contenteditable, compteur caracteres, toolbar (copier, plein ecran, verrouiller), zone depot fichier
- [x] Modales : resultat generation (boutons download/preview/continue), overlay animation (marmite), accessibilite role="dialog"

### Suite 6 : Robustesse et gestion d'erreurs
**Fichier** : `tests/test-robustness.html`
**Statut** : Implementee

- [x] classifyError : SyntaxError → PARSE_ERROR
- [x] classifyError : "JSON" / "parse" → PARSE_ERROR
- [x] classifyError : "timeout" → NETWORK_ERROR
- [x] classifyError : "Failed to fetch" → NETWORK_ERROR
- [x] classifyError : "NetworkError" → NETWORK_ERROR
- [x] classifyError : "required" / "missing" → VALIDATION_ERROR
- [x] classifyError : erreur generique → PACKAGING_ERROR (defaut)
- [x] classifyError : technicalMessage present
- [x] cleanJsonInput : supprime bloc ```json ... ```
- [x] cleanJsonInput : supprime bloc ``` ... ```
- [x] cleanJsonInput : trim les espaces
- [x] cleanJsonInput : JSON propre inchange
- [x] healJsonString : JSON valide → parseable
- [x] healJsonString : virgule finale avant } reparee
- [x] healJsonString : virgule finale dans tableau reparee
- [x] healJsonString : code fence supprime
- [x] healJsonString : chaines vides ne crashent pas
- [x] healJsonString : texte autour du JSON supprime
- [x] healJsonString : performance gros JSON < 100ms
- [x] loadTranslations('xx') : langue inexistante ne crash pas
- [x] Recovery : fr se charge apres une erreur
- [x] loadTranslations('') : chaine vide ne crash pas
- [x] Securite : pas de <script>, onerror=, javascript: dans fr.json
- [x] Securite : balises HTML dans la liste blanche pedagogique

### Suite 7 : CSS & rendu visuel
**Fichier** : `tests/test-css.html`
**Statut** : Implementee

Verifie les proprietes CSS calculees sur les elements cles via iframe.

- [x] Variables CSS definies sur :root (z-index, backdrop)
- [x] Hierarchie z-index coherente (dropdown < modal < fullscreen)
- [x] Layout principal : .container visible, pas de scroll horizontal, header/footer
- [x] Grille d'activites en display grid/flex, tuiles cliquables avec titres et images
- [x] Filtres : chips presentes, "Tout" actif par defaut, style actif distinct
- [x] Selecteur de langue : bouton, dropdown cache, 11 langues
- [x] Fichiers CSS critiques charges (style.css, custom.css)
- [x] Typographie : font-family, font-size, line-height, meta viewport/charset/lang

### Suite 8 : Integration pipeline (couverture complete, 19 activites)
**Fichier** : `tests/test-integration.html`
**Statut** : Implementee

Teste le pipeline complet de generation H5P sans appel LLM, en utilisant les 19 fichiers JSON d'exemple comme fixtures. Chaque activite defile visuellement dans l'iframe (sidebar → JSON → generation → modale).

- [x] Chargement des 19 fixtures JSON (toutes les activites H5P visibles) et validation de leur structure
- [x] Pipeline UI visuel pour les 19 activites : pour chaque module, ouverture sidebar, injection JSON, clic generation, attente generation:complete, verification du blob, fermeture modale (Timeline, Flashcards, QuizSet, QuizSetQCM, QuizSetVF, Glossary, Crossword, Essay, Summary, DragTheWords, DragAndDrop, FillInTheBlanks, MarkTheWords, TrueFalse, MultipleChoice, FindTheWords, SortParagraphs, SingleChoiceSet, DialogCards, Chart)
- [x] Verification des 19 notifications creees (titres non vides, badge incremente)
- [x] Validation des 19 blobs H5P avec JSZip : content/content.json et h5p.json presents et valides, mainLibrary correcte
- [x] Pipeline processeur direct (sans UI) : processH5PContent + createH5PBlob pour chaque activite (verification independante)

---

## Suites implementees (suite)

### Suite 9 : Export de documents
**Fichier** : `tests/test-document-export.html`
**Statut** : Implementee

Teste la chaine d'export documentaire (DOCX/ODT/PDF) : formatage, contenu, securite, utilitaires.

- [x] Chargement des 25 fixtures (19 H5P + 6 Moodle) et formatage via formatContentForDocument
- [x] Structure valide pour chaque type : title (string non vide), sections (array non vide)
- [x] Validation approfondie par type de section (header, paragraph, table, flashcardTable, image, etc.)
- [x] Caracteres speciaux preserves (accents, guillemets francais, ligatures, tirets longs)
- [x] Conversion LaTeX → Unicode (x^2 → ², \frac, delimiteurs supprimes)
- [x] DOMPurify bloque 6 vecteurs XSS (script, onerror, javascript:, onclick, iframe, svg onload)
- [x] DOMPurify preserve les balises HTML pedagogiques (profil EDUCATIONAL : strong, em, ul, a, table)
- [x] Profil STRICT : strong preserve, table supprime
- [x] Profil RICH_HTML : section/article preserves
- [x] calculateDimensions : paysage, portrait, tres large, dimensions invalides
- [x] validateImageUrl : https, http, javascript: bloque, chaine vide
- [x] generateChartImage : barChart et pieChart produisent un dataURL PNG

---

### Suite 10 : Performance et optimisation
**Fichier** : `tests/test-performance.html`
**Statut** : Implementee

Benchmarks des operations critiques avec seuils genereux (2-3x le temps attendu).

- [x] Fetch des 11 locales JSON (temps < 500ms chacun)
- [x] Taille individuelle des locales < 400 Ko
- [x] Taille totale js/locales/ < 4 Mo
- [x] translatePage() sur 50 elements data-key < 200ms
- [x] healJsonString() sur 20 fixtures H5P (< 100ms chacun, moyenne < 50ms)
- [x] Pipeline complet healer (clean + heal + healObj + healActivity + healStructure) sur 6 types (< 200ms)
- [x] processH5PContent() pour 20 types H5P (< 500ms chacun, inclut lazy-load, moyenne < 200ms)
- [x] Chargement client-zip < 2000ms
- [x] createH5PBlob() pour 6 types representatifs (< 1000ms chacun, moyenne < 500ms)

*Note : "Premier rendu des tuiles" et "Smart preloading" omis car non testables de maniere deterministe sans iframe + index.html.*

---

## Comment executer les tests

1. Lancer le serveur local :
   ```bash
   python3 -m http.server 8000
   ```

2. Ouvrir dans le navigateur :
   - `http://localhost:8000/tests/test-generation-download.html` — Tests generation & telechargement
   - `http://localhost:8000/tests/test-edit-export-flow.html` — Tests edition & re-export
   - `http://localhost:8000/tests/test-i18n.html` — Tests i18n
   - `http://localhost:8000/tests/test-definitions.html` — Tests coherence definitions
   - `http://localhost:8000/tests/test-ui.html` — Tests interface utilisateur
   - `http://localhost:8000/tests/test-robustness.html` — Tests robustesse
   - `http://localhost:8000/tests/test-css.html` — Tests CSS & rendu visuel
   - `http://localhost:8000/tests/test-integration.html` — Tests integration pipeline (19 activites)
   - `http://localhost:8000/tests/test-document-export.html` — Tests export documents (25 types)
   - `http://localhost:8000/tests/test-math-conversion.html` — Tests conversion formules maths (parser, MathML, StarMath, export DOCX/ODT)
   - `http://localhost:8000/tests/test-performance.html` — Tests performance (benchmarks)

3. Les tests s'executent automatiquement a l'ouverture de la page.

## Conventions pour les nouveaux tests

- **Fichiers** : `tests/test-{nom}.html` + `tests/test-{nom}.js`
- **Structure JS** : meme pattern que les tests existants (assert, passCount, results, STEP_NAMES, runAllTests)
- **Commentaires** : en francais
- **Import** : ES6 modules avec `<base href="../">` dans le HTML
- **Pas de dependance externe** : pas de framework de test, tout est vanilla JS
