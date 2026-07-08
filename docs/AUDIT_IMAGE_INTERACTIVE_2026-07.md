# Audit — activité « Image interactive » (H5P.ImageHotspots) — 2026-07-06

> Audit complet en 3 volets (génération / images-preview-empaquetage / éditeur visuel),
> mené par 3 agents indépendants puis consolidé et dédoublonné. Chaque finding est
> démontrable (fichier:ligne + scénario). Complète `AUDIT_FONCTIONNEL_2026-07.md`.

**Bilan : 1 CRITIQUE, 6 MAJEURS, 9 MINEURS — ✅ TOUS CORRIGÉS le 2026-07-06** (même session).

## État des corrections (2026-07-06)

| # | Correction | Fichiers principaux |
|---|---|---|
| N1 | Croisement content.json ↔ registre au packaging (blocage + message `error_media_missing`) ; healer avant parse aux 2 points d'injection | `h5p-creator.js` (`createH5PBlob`), `ui.js` |
| N2 | URLs `blob:` de la preview suivies (`_mediaObjectUrls`) et révoquées dans `load()`/`destroy()` | `h5p-manager.js` |
| N3 | `accept` élargi + test MIME-ou-extension au drop + hints/messages 12 Mo pour le fond | `field-renderers.js` ⚠partagé |
| N4 | Validation type-spécifique des blocs vides (`validation_ih_block_empty`) + repli texte→header au processeur | `validators.js` ⚠partagé, processeur |
| N5 | Champ d'upload `globalIconImage` (showWhen) + préservation `globalIconImage`/`hotspotIconImage` partout | `content-detector.js` ⚠partagé, processeur |
| N6 | Passthrough `_metadata`/`_subContentId`/`_origParams` : licences, attributions, subContentId et réglages média préservés | `content-detector.js` ⚠partagé, processeur |
| N7 | `processBackgroundImage` porté dans le image-manager Sucrerie (1920 px, format préservé) | Sucrerie `image-manager.js` |
| N8 | Libellés a11y localisés (3 clés × 11 locales Caramel + 7 clés × 11 i18n Sucrerie), repli robuste | processeur, `content-detector.js` |
| N9 | Échelle vision décidée à la MAJORITÉ (aberrante isolée clampée) + support `data.scale` | `hotspot-vision.js` + script E2E |
| N10 | Complétion de version des libraries (`H5P.Text`→`1.1`…) + sanitisation des params texte enrichis | processeur |
| N11 | Assets orphelins non recopiés à la régénération (filtre sur chemins référencés) | `notifications.js` |
| N12 | Médias non référencés écartés du ZIP (plus d'image parasite inter-activités) | `h5p-creator.js`, `notifications.js` |
| N13 | Ré-hydratation audio/vidéo (`blob:` suivies, révoquées à `destroyEditor`) + chargement JSZip si absent | `editor/index.js`, `content-detector.js` |
| N14 | `createEmptyItem` honore `minItems` (récursif) + x/y default 50 (centre) | `editor-core.js` ⚠partagé, `content-detector.js` |
| N15 | Docs : Gemma→`DEFAULT_VISION_MODEL`, CLAUDE.md item 7 (12 fichiers), racine `bas` du diff Sucrerie | docs + Sucrerie scripts |
| N16 | Test E2E vision : `lang`/prompt localisé + `imageMeta` réels (parité prod champ par champ) | `scripts/test-image-hotspots-llm.mjs` |

**Fichiers partagés propagés vers Sucrerie** (byte-identiques vérifiés : `diff-editor-vs-caramel.mjs`
→ 21/21 identiques) : `content-detector.js`, `field-renderers.js`, `validators.js`, `editor-core.js`
(+ `interactive-video-panel.js`/`sync-video-player.js` de l'audit fonctionnel).
**Vérifications** : `node --check` sur tout Caramel hors vendor + fichiers Sucrerie modifiés ;
suites Node existantes 119/119, 43/43, 54/54, 28/28 ; harnais de régression session : llm-batch
25/25, lecteur vidéo 7/7, round-trip Image interactive 33/33 ; locales 11 × 27 contrôles OK.

---

Le cœur du pipeline (prompt → healer → processeur → .h5p → preview) était sain dans les flux
nominaux ; les défauts se concentraient sur les chemins de rattrapage (image ↔ registre), le
round-trip éditeur, et la parité Sucrerie. Détail des constats d'origine ci-dessous.

---

## Clarification préalable — `interactive-image-panel.js` n'est PAS manquant

Le panneau de placement visuel des hotspots **existe dans Caramel `bas`**
(`js/editor/interactive-image-panel.js`, commit `3c464a6` 6.2.0 beta 3) et la copie Sucrerie
est identique (EOL près, normalisées par git). L'alerte « absent côté Caramel » du
`diff-editor-vs-caramel.mjs` vient de sa racine par défaut `../Caramel/cara_dev2`, **resté en
6.0.2** sans support ImageHotspots. Le panneau offre deux modes (Plan master-detail, et
« Sur l'image » : glisser-déposer des pastilles, clavier ±1 %/±5 %, synchro champs ↔ marqueurs).
→ Voir finding **N15** (doc/outillage à rafraîchir).

---

## CRITIQUE

### N1 · Un `.h5p` peut être créé avec une image de fond ABSENTE de l'archive
- **Fichiers** : `js/ui/ui.js:889-905` (`pastedJsonReady` déverrouille « Créer » dès que le
  JSON contient `p.image` ou `hotspots[]`), `js/ui/ui.js:3107-3127` (injection/ré-enregistrement
  du blob seulement si `imageHotspotStates` a un état ET si `JSON.parse` strict réussit — le
  `catch` s'en remet au healer qui tourne APRÈS le point d'injection), `js/h5p/h5p-creator.js:184`
  (`hasMedia() ? getAllMedia() : null`, aucun croisement content.json ↔ fichiers réellement inclus).
- **Scénarios d'échec** (3 portes d'entrée, même défaut) :
  1. *Même session* : générer avec image (OK, puis `clearAllImages()` vide le registre) →
     cliquer ✕ « retirer l'image » (`clearImage`, `ui.js:1067-1081`) → « Créer » reste actif
     (le textarea contient toujours le JSON avec `image`) → .h5p dont `content.json`
     référence `images/image-xxxx.png` **absent du ZIP**. Fond cassé en preview ET sur Éléa.
  2. *Inter-session* : recoller un JSON généré précédemment sans re-joindre l'image → idem.
  3. *JSON réparable seulement* : le LLM renvoie un JSON que seul `healJsonString` sait parser
     (saut de ligne littéral…) → l'injection `parsed.image = st.image` est sautée → le
     processor émet `image: undefined` → « Missing required background image » dans le player
     alors que l'image a bien été jointe et analysée.
- **Correction** : au packaging (handler `createBtn` ou `handleH5PCreation` après healing),
  vérifier que chaque `path` local (`images/…`, `audios/…`, `videos/…`) du content.json a un
  blob dans `getAllMedia()` — sinon bloquer avec un message « re-joignez l'image de fond » ;
  et déplacer l'injection de `st.image` APRÈS le healing (ou healer avant le parse d'injection).

## MAJEUR

### N2 · Preview : fuite d'Object URLs `blob:` (audio/vidéo) — jamais révoqués
- **Fichiers** : `js/h5p/h5p-manager.js:704-711` (`embedMedia` → `URL.createObjectURL(blob)`
  sans suivi), `:368-404` (`destroy()` ne révoque rien ; chaque `load()` recrée des URLs).
- **Scénario** : activité avec vidéo embarquée 60 Mo ; chaque cycle éditer → enregistrer →
  re-preview épingle une nouvelle copie du blob en mémoire → plusieurs centaines de Mo,
  onglet qui rame/crashe. (Contraste : `image-manager.js` révoque systématiquement les siennes.)
- **Correction** : accumuler les URLs dans `this._mediaObjectUrls`, révoquer au début de
  `load()` et dans `destroy()`.

### N3 · Éditeur : le remplacement du fond refuse HEIC/TIFF/BMP/AVIF/SVG pourtant supportés
- **Fichiers** : `js/editor/field-renderers.js:832` (`accept` limité à jpeg/png/gif/webp même
  quand `imageProcessor === 'background'`), `:937` (drop rejeté si `file.type` ne commence pas
  par `image/` — or un `.heic` a souvent un `type` **vide**), `:837` (hint « max 5 Mo » faux
  pour le fond : 12 Mo, 10 formats). La sidebar de création, elle, accepte tout (`ui.js:1876`,
  repli extension `ui.js:1150-1151`).
- **Scénario** : créer avec une photo iPhone HEIC (OK), puis vouloir la remplacer dans
  l'éditeur : invisible dans le sélecteur, drop sans effet, aucun message.
- **Correction** : quand `imageProcessor === 'background'`, aligner `accept` + test
  « MIME **ou** extension » sur la sidebar ; corriger le hint. ⚠ Fichier partagé Sucrerie.

### N4 · Un bloc de contenu vide est silencieusement supprimé à la sauvegarde → le point disparaît du rendu
- **Fichiers** : `js/editor/content-detector.js:3317-3355` (`denormalizeIHContentNode` → `null`
  si texte vide / image sans path / média sans fichier) + `:3838` (`.filter(Boolean)`) ;
  itemSchema `:3013-3037` : aucun champ de payload `required` (seul `_contentType`) ; aucun cas
  ImageHotspots dans `validators.js` (`getTypeSpecificErrors`) ni dans le healer ; côté player
  1.11, un hotspot à `content: []` est sauté sans erreur (`image-hotspots.js:152-173`).
  Recoupe côté génération : `processors/ImageHotspots.js:82-83` (un `text` vide du LLM produit
  aussi `content: []`).
- **Scénario** : mode « Sur l'image » → « Ajouter un point » → titre saisi, texte oublié →
  Enregistrer passe → le point est visible dans l'éditeur mais absent de l'activité finale
  (et la numérotation des points se décale).
- **Correction** : validation type-spécifique (chaque bloc doit avoir son payload selon
  `_contentType`) dans `getTypeSpecificErrors`, ou `required` conditionnel `showWhen` ; côté
  processor/healer, remplacer un `text` vide par le `header` ou avertir.

### N5 · Option d'icône « Image téléversée » morte + icônes-images importées détruites
- **Fichiers** : `content-detector.js:2953-2959` (option `image` proposée) mais aucun champ
  `globalIconImage` dans le schéma (exigé par `semantics.json:86-102`) ; au round-trip,
  `content-detector.js:3832-3841` jette `hotspotIconImage` et `processors/ImageHotspots.js:95-123`
  jette `globalIconImage`.
- **Impact** : choisir « Image » ne fait rien (repli player sur l'icône « plus ») ; un paquet
  importé avec icônes personnalisées les perd définitivement après un simple aller-retour éditeur.
- **Correction** : retirer l'option `image` du select OU ajouter un champ image `showWhen` ;
  préserver `hotspotIconImage`/`globalIconImage` dans denormalize et processeur.

### N6 · Round-trip destructeur sur un content.json v1.11 importé (metadata, subContentId, réglages média)
- **Fichiers** : `content-detector.js:3260-3296` (`normalizeIHContentNode` ne conserve ni
  `metadata` ni `subContentId` ; H5P.Image réduit à path/mime/width/height — `copyright`,
  `title`, `decorative` perdus) ; `:3359-3360` (fallbacks `b.metadata || …` = code mort →
  `subContentId` régénéré à chaque sauvegarde) ; `:3337-3353` (params H5P.Audio/Video
  reconstruits avec défauts figés : `autoplay:false`, `loop:false`, `fit:true`…).
- **Scénario** (surtout côté Sucrerie, qui édite des `.h5p` déposés) : ouvrir un paquet dont
  une image porte `license:'CC BY'` + auteurs → sauvegarder sans rien toucher → licence `'U'`,
  attribution supprimée, `subContentId` renouvelé (rupture xAPI/suivi Moodle).
- **Correction** : faire transiter `metadata`/`subContentId`/`copyright` en champs cachés
  (pattern `_legacyPositioning`, `content-detector.js:3575`). ⚠ Fichier partagé Sucrerie.

### N7 · Parité Sucrerie : le remplacement du fond y est recompressé en 800×600 JPEG
- **Fichiers** : `js/editor/field-renderers.js:878-879` (repli documenté sur `processImage` si
  `processBackgroundImage` absent) ; Caramel a `processBackgroundImage`
  (`js/h5p/image-manager.js:196`), le `image-manager` de Sucrerie **non** (son `processImage` =
  800×600 JPEG).
- **Impact** : perte de définition + transparence PNG écrasée côté Sucrerie uniquement.
- **Correction** : porter `processBackgroundImage` dans le image-manager Sucrerie.

## MINEUR

### N8 · Libellés d'accessibilité hardcodés et bilingues, figés dans les données
`processors/ImageHotspots.js:119-122` et `content-detector.js:3849-3851` : « Untitled
Hotspot » / « Contains Audio/Video » (EN) + « Fermer » (FR) pour toutes les langues ; le
commentaire « traduits via translations[...] dans l'UI » est faux (aucune injection, grep
complet). Le `||` fige la valeur dans les données à la première sauvegarde. → Pattern
`translations.h5p_close || 'Fermer'` (cf. `SingleChoiceSet.js:44`) + clés dans les 11 locales.

### N9 · Vision : heuristique d'échelle à diviseur global unique, deux trous démontrables
`js/services/hotspot-vision.js:129-143` : `div` déduit du MAX global (`>100 ⇒ ÷10 ; ≤1 ⇒ ×100`).
(a) réponse 0-1000 dont toutes les zones sont dans le coin haut-gauche (valeurs ≤ 100) →
interprétées comme des %, décalées ×10 ; (b) une seule valeur aberrante > 100 dans de vrais %
→ tout le jeu ÷10. → Porter l'échelle dans le contrat de réponse du workflow (champ `scale`).

### N10 · Forme enrichie : `library` sans version non réparée, `params` non sanitisés
`processors/ImageHotspots.js:56-70` : `library: "H5P.Text"` (sans « 1.1 ») passe verbatim →
content.json que le player ne résout pas ; la normalisation de versions du healer ne couvre
que `questions[]` (`json-healer.js:702-712`). Le chemin enrichi recopie aussi `params` sans
sanitisation (auto-XSS preview, faible gravité). → Table de complétion des versions alignée
sur `extraDependencies` dans `normalizeStructuredContent`.

### N11 · Archive gonflée : fichiers orphelins recopiés à chaque sauvegarde éditeur
`js/ui/notifications.js:2914-2933` : `regenerateH5PFile` recopie TOUS les assets du ZIP
d'origine ; un fond remplacé (nouveau `h5pPath` à chaque fois) laisse l'ancien fichier mort
dans l'archive. 3 remplacements ≈ 3 copies mortes de plusieurs Mo. → Ne recopier que les
assets encore référencés par le content.json régénéré.

### N12 · Registre média global : image parasite empaquetée dans une AUTRE activité
`image-manager.js:71,91` (registres sans clé d'activité) + `ui.js:1010` (enregistrement dès
l'ANALYSE vision) : uploader un fond pour Image interactive puis générer des Flashcards →
le .h5p Flashcards embarque `images/image-xxxx.png` + dépendance `H5P.Image` parasites.
→ N'enregistrer qu'au packaging, ou filtrer `getAllMedia()` sur les paths référencés.

### N13 · Audio/vidéo non ré-hydratés à la réouverture de l'éditeur
`js/editor/index.js:617-636` (`rehydrateIHImagesFromBlob` ne traite que `images/*`) +
`field-renderers.js:1097` : lecteur monté avec `src=""` pour un média embarqué existant →
l'utilisateur croit le fichier perdu et le re-téléverse (aggrave N11). Pas de perte réelle.
→ Étendre la ré-hydratation aux `audios/*`/`videos/*` (blob: extrait du ZIP, révoqué à la
fermeture). Noter : no-op silencieux si `window.JSZip` pas encore chargé (`index.js:618`).

### N14 · « Ajouter un point » en mode Plan crée un item non conforme à son propre schéma
`js/editor/editor-core.js:130-131` (`createEmptyItem` : array imbriqué → `[]` malgré
`minItems:1`) + `:141-142` (x/y → 0) : point au coin haut-gauche + sauvegarde bloquée par
« Minimum 1 elements » générique, alors que le mode « Sur l'image » crée le bloc texte.
→ Respecter `minItems` dans `createEmptyItem` (créer un item par défaut du sous-schéma).
⚠ Fichier partagé Sucrerie.

### N15 · Documentation et outillage périmés
- Références « Gemma » alors que le modèle vision est Qwen 3.6 (`DEFAULT_VISION_MODEL`) :
  `assets/data/prompts/image_hotspots.md:10,14,18`, `hotspot-vision.js:5`, `endpoints.js:53`,
  `prompt-generator.js:159`, section pipeline de `CLAUDE.md`.
- `CLAUDE.md` item 7 : dit « 11 fichiers JS » partagés — il y en a 12 (dont
  `interactive-image-panel.js`, listé par `shared-files.mjs` côté Sucrerie).
- `sucrerie…/scripts/lib/caramel-root.mjs:26-29` : racine par défaut `cara_dev2` (6.0.2,
  sans ImageHotspots) → faux « caramel-missing » permanent. Pointer vers `bas` ou mettre à
  jour `cara_dev2`.

### N16 · Test E2E vision non représentatif de la prod
`scripts/test-image-hotspots-llm.mjs:80,352` : `lang:'fr'` figé (la prod envoie le prompt
localisé, `hotspot-vision.js:93-94`) et `imageMeta = null` (la prod envoie width/height).
La QA « langue de bout en bout » est biaisée.

---

## RAS vérifiés (synthèse des 3 volets)

- **definitions.js** : entrée ImageHotspots complète (`requiresBackgroundImage` câblé,
  `customOrder`, tuile) ; pas de chunking (justifié).
- **Prompt & locales** : 4 clés `prompt_image_hotspots_*` + `hotspot_vision_prompt` dans les
  11 locales ; placeholders tous substitués ; structure demandée = structure consommée ;
  46 clés `editor_ih_*` présentes dans les 11 locales.
- **Exemple** `image_hotspots_1.json` valide et conforme.
- **Processeur** : `clampPct` [0,100] défaut 50 ; défauts alignés PRD ; idempotent ;
  image absente → message player propre (pas de crash).
- **Dépendances vendored** : H5P.ImageHotspots-1.11.6 + les 8 `extraDependencies` présentes
  aux bonnes versions ; patch H5P.Video-1.6 YouTube présent.
- **Patch preview** `frame.bundle.js` effectif (`blob:|data:(image|audio|video)/`), couvrant
  fond data:image et médias blob: ; `_embedImagesAsDataUrls` couvre tous les formats produits.
- **hotspot-vision.js** : timeout 120 s + AbortController, classifyError, clamps (count,
  labels 80 c, descriptions 400 c), coordonnées non finies → 50.
- **Images** : pako AVANT UTIF garanti même en concurrence ; HEIC/TIFF/SVG gérés avec erreurs
  propres ; limites de taille contrôlées ; image-manager révoque ses Object URLs.
- **Détection éditeur** : signature `hotspots[]+…` sans collision avec les ~30 autres types.
- **Bornes x/y** : clampées à 4 niveaux (validators, denormalize, panneau, processeur).
- **Round-trip du format plat LLM** : aucun champ racine perdu ; whitelist des 4 types de
  blocs = exactement les 4 libraries de `semantics.json`.
- **Hygiène du panneau image** : listeners et classes nettoyés au démontage.
