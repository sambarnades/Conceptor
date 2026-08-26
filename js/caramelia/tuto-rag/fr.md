<!--
Base de connaissances de Caramelia (assistante pédagogique de Caramel).
Ce fichier est de la DOCUMENTATION DE RÉFÉRENCE, pas un prompt système.
Aucune instruction destinée au LLM ne doit y être ajoutée.

RÈGLE D'ÉDITION : tous les libellés mentionnés ci-dessous (boutons, onglets,
champs, sections) doivent reproduire EXACTEMENT le texte visible à l'écran
dans Caramel. Source unique de vérité : js/locales/fr.json + index.html.
Toute édition se fait via PR.
-->
---
version: 1.3.0
lang: fr
audience: enseignants
---

# Tutoriel Caramel

Caramel est un outil web open source qui aide les enseignants à créer
des activités pédagogiques interactives (H5P, Éléa, Magistère, Moodle)
avec l'aide de l'IA. Le site fonctionne 100 % côté navigateur :
aucune donnée pédagogique n'est envoyée à un serveur tiers.

## Décrire votre besoin (en haut de la page)

En haut de la page, deux onglets permettent de choisir comment
décrire votre besoin :

- **Mode Rapide** — formulaire minimal, deux champs.
- **Mode Avancé** — mêmes champs plus des options supplémentaires,
  notamment la possibilité de joindre des documents.

### Mode Rapide

Deux champs uniquement :

- **Qui êtes-vous ?** (par exemple : Enseignant, formateur…)
- **Que souhaitez-vous aborder ?** (par exemple : La révolution française…)

### Mode Avancé

Mêmes champs que le Mode Rapide, plus :

- **Pour quel niveau** (par exemple : Seconde en bac professionnel)
- **Nombre de questions/éléments dans le module** (par exemple : 5)
  — selon l'activité, cela correspond au nombre de questions, de dates
  sur une frise, de mots dans un glossaire, etc.
- Un champ libre pour ajouter des **informations complémentaires**
  (consignes spécifiques, contraintes, tout autre détail pertinent).

### Joindre des documents (facultatif) — uniquement en Mode Avancé

Cette section, intitulée **« Joindre des documents (facultatif) »**,
n'apparaît que lorsque l'onglet **Mode Avancé** est sélectionné. Elle
permet de baser la génération sur un contenu fourni par vous.

Trois possibilités :

- **Copier-coller un texte** directement dans la zone de saisie
  (placeholder « Copiez-collez votre texte ici… »).
- **Glisser-déposer un document** (ou cliquer sur **« Choisissez un
  fichier »**) au format **PDF, TXT, DOCX, PPTX, ODT, ODP, PNG, JPEG** (les images **WebP** et **BMP** sont aussi acceptées, sans être listées à l'écran). Une **image** déposée (photo, schéma, diagramme…) est **analysée par une IA de vision** qui en rédige une **description** et **recopie fidèlement le texte** qu'elle contient — si l'IA est indisponible, la lecture locale (OCR) prend automatiquement le relais. Vous pouvez aussi déposer un **fichier audio** (MP3, M4A, WAV…) ou une **vidéo** (MP4, MOV…) : seule la bande-son est alors transcrite automatiquement (par Albert, le service souverain de la DINUM ; voir la confidentialité ci-dessous).
- **Importer une page web** : coller son lien (`https://…`) dans le
  champ sous la zone de dépôt, puis cliquer sur **« Ajouter »**. Le
  texte de la page est récupéré automatiquement.

L'extraction du texte des **documents** se fait **entièrement en
local** dans votre navigateur (aucune donnée envoyée).
**Trois exceptions transitent par nos serveurs (hébergés en France) :**
l'**analyse des images** (l'image est envoyée au modèle de vision le
temps de l'analyse, jamais conservée ; en cas d'indisponibilité,
l'OCR local — qui n'envoie rien — prend le relais), la **transcription
audio** et l'**import d'une page web** (le lien que vous saisissez y
est envoyé pour en extraire le texte ; les liens vers des PDF, vidéos
ou pages payantes ne sont pas pris en charge).

Si vous laissez cette zone vide, l'IA s'appuiera uniquement sur ses
connaissances générales pour générer l'activité.

## Choisir le type d'activité

Une fois la description faite, les tuiles d'activités deviennent
cliquables. Cliquez sur celle qui correspond à votre objectif
pédagogique. Des filtres au-dessus des tuiles permettent de
restreindre l'affichage : **Tout**, **Quiz & Tests**, **Manipulation
de texte**, **Mémorisation & Découverte**, ainsi que les plateformes
**H5P**, **Éléa**, **Magistère**, **Moodle**.

### Activités H5P

Activités au format H5P. Celles marquées d'une étoile (★) intègrent
un feedback détaillé en 4 tranches de score.

- **Frise chronologique** — séquence d'événements interactive.
- **Cartes mémoires** (Flashcards) — recto-verso pour la mémorisation.
- **Quiz QCM (Question Set)** ★ — quiz de questions à choix multiples.
- **Quiz Vrai/Faux (Question Set)** ★ — quiz vrai ou faux.
- **Quiz mixte (Question Set)** ★ — questions variées (QCM, glisser-déposer…).
- **Glossaire** — accordéon dépliant ou FAQ.
- **Mots croisés** ★ — grille générée à partir de définitions.
- **Rédaction** ★ — sujet de rédaction avec correction par mots-clés.
- **Résumé** ★ — l'élève reconstitue un résumé en choisissant les bonnes phrases.
- **Glisser les mots** ★ — texte avec mots manquants à glisser.
- **Glisser-déposer** ★ — étiquettes à déposer dans une zone.
- **Texte à trous** ★ — l'élève remplit les mots au clavier.
- **Surligner les mots** ★ — l'élève surligne certains mots dans un texte.
- **Vrai/Faux** — questions binaires simples.
- **Choix multiples** ★ — QCM avec une ou plusieurs bonnes réponses.
- **Mots mêlés** — grille de lettres avec mots à retrouver.
- **Ordonner les paragraphes** ★ — remettre des paragraphes dans l'ordre.
- **Série de choix uniques** ★ — questions à une seule bonne réponse.
- **Cartes de dialogue** — cartes recto-verso avec texte et audio.
- **Dictée** — dictée audio : phrases lues par synthèse vocale (voix F/M, débit normal ou lent, 11 langues), l'élève écrit, la correction met les fautes en évidence.
- **Texte à trous complexe** ★ — feedbacks spécifiques par erreur.
- **Diagramme** — circulaire ou en barres pour visualiser des données.
- **Présentation de cours** — diaporama interactif avec exercices intégrés.
- **Livre interactif** — livre multi-chapitres (textes, tableaux, images, exercices) avec table des matières et résumé.
- **Vidéo interactive** — questions (QCM, vrai/faux, texte à trous) aux moments clés d'une vidéo, avec résumé final. Demande une URL de vidéo (Tubes Apps Éducation, PodEduc ou YouTube) ; Caramelia la réclame avant de générer.
- **Image interactive** — points cliquables sur une image que vous joignez. Caramel repère automatiquement les zones clés de l'image selon votre contexte (discipline, niveau, thème) et place les points, puis rédige le contenu de chaque point. Vous pouvez ensuite, dans l'éditeur, ajouter à la main du texte, une image, un son ou une vidéo dans un point, et choisir la couleur et le type de repère (numéros, icône). Demande de joindre un fichier image (PNG, JPEG, WebP, et même HEIC/photo iPhone ou TIFF) ; Caramel l'analyse dès le dépôt. Exportable aussi en document (DOCX, ODT, PDF) avec des pastilles numérotées.
- **Trouver la zone (Find the Hotspot)** — question dont la réponse se clique directement sur une image que vous joignez : Caramel repère les zones de l'image, choisit LA zone correcte selon votre contexte et rédige la consigne et les feedbacks (les autres zones servent de leurres ; le score se joue au premier clic). Comme pour l'Image interactive, il faut joindre un fichier image, analysé dès le dépôt. Dans l'éditeur, les zones se déplacent directement sur l'image (vert = correcte, rouge = leurre). Exportable aussi en document (DOCX, ODT, PDF) avec énoncé élève et correction.
- **Trouver les zones (Find Multiple Hotspots)** — chasse aux zones sur une image que vous joignez : l'élève doit cliquer sur TOUTES les zones correctes (les légumes, les erreurs, les risques…). Caramel choisit les zones correctes selon votre contexte, nomme ce qu'on cherche et rédige consigne et feedbacks. Même flux que l'Image interactive (fichier image analysé dès le dépôt, zones éditables sur l'image). Exportable aussi en document (DOCX, ODT, PDF).

### Activités Éléa / Magistère

- **Test (MBZ / XML / GIFT)** — activité Test prête à restaurer en **`.mbz`**
  (banque de questions + quiz câblé), ou banque de questions variées (QCM,
  appariement…) à importer (XML / GIFT) dans un test Éléa/Magistère.
- **QCM (MBZ)** — activité QCM simple et rapide.
- **Appariement (MBZ)** — jeu d'association entre paires d'éléments.
- **Millionnaire (MBZ)** — quiz ludique à difficulté croissante.
- **Glossaire (XML)** — fichier d'import pour un glossaire Éléa/Magistère.
- **Page (MBZ / HTML)** — page de cours structurée et mise en forme.
- **Livre (MBZ)** — livre multi-chapitres avec navigation.
- **Devoir (MBZ)** — devoir avec grille d'évaluation critériée.

## Générer et affiner le contenu

Après avoir cliqué sur une tuile, une fenêtre s'ouvre. C'est ici que
vous interagissez avec l'IA. En haut de cette fenêtre, une bascule
**Simple / Guidé** permet de choisir le mode d'affichage.

### Affichage Simple — bouton « Générer en un clic »

La voie rapide. Cliquez sur **« Générer en un clic »** : l'IA produit
le contenu et le place directement dans la zone de résultat à droite.
La petite flèche à droite du bouton permet de choisir entre différents
modèles d'IA (rapide, puissant…).

### Affichage Guidé — utiliser une IA externe

Pour un contrôle maximal. Le prompt apparaît à gauche.

1. Modifiez le prompt si vous le souhaitez.
2. Cliquez sur **« Copier le prompt »** et ouvrez une IA externe
   dans un nouvel onglet.
3. Collez le prompt dans l'IA, récupérez sa réponse, puis collez-la
   dans la zone de résultat à droite dans Caramel.

Deux icônes utiles, en haut de la zone du prompt : **Plein écran**
pour plus de confort, et **Verrouiller** (qui devient **Déverrouiller**)
pour protéger le prompt.

## Visualiser, éditer et télécharger

Une fois le contenu généré, la fenêtre **« Votre sucrerie est prête ! »**
s'affiche, avec deux choix : **« Visualiser et éditer »** ou
**« Continuer »** (pour générer une autre activité).

### Visualiser

Un simulateur intégré teste l'activité comme un élève (cliquez,
glissez, écrivez…). Pour les contenus Éléa/Magistère, un simulateur
montre le rendu réel.

### Éditer (icône crayon, bouton « Éditer »)

L'éditeur visuel s'adapte automatiquement au type d'activité : liste
des éléments à gauche, détail à droite.

- **Barre rich-text** sur les champs compatibles : gras, italique,
  souligné, barré, exposant, indice, couleur, listes, lien.
- Bouton `</>` pour basculer en **mode code source**.
- **Formules mathématiques** via le bouton **√x** : 6 catégories
  (fractions, racines, puissances, lettres grecques, opérateurs,
  structures), aperçu en temps réel, double-clic pour modifier.
- **Mots à trouver** (Glisser les mots, Surligner les mots,
  Texte à trous) : surlignage jaune automatique, boutons
  Marquer / Retirer, ou astérisques `*mot*`.
- **Texte à trous (Cloze)** dans Test : trois types de trous
  (Choix multiple, Réponse courte, Valeur numérique), affichés
  comme pastilles colorées (bleu, jaune, vert).
- **Images** : glisser-déposer, redimensionnement automatique
  (800×600), texte alternatif, formats JPEG / PNG / WebP.

### Télécharger

Le bouton **« Télécharger »** propose deux familles de formats :

- **Formats interactifs** (numériques, pour Éléa/Magistère) :
  H5P, MBZ, XML.
- **Formats imprimables** (versions débranchées) : DOCX, ODT, PDF.

## Intégrer le fichier généré dans Éléa

### Intégrer un fichier H5P

- **Méthode rapide** : passer en mode édition du parcours,
  glisser-déposer le fichier `.h5p` directement, choisir
  « Ajouter une activité H5P », puis confirmer avec **DÉPOSER**.
- **Méthode recommandée** : « Ajouter une activité ou une ressource »
  → « Contenu interactif (H5P) » → onglet « Téléverser » →
  sélectionner le fichier → **« Utiliser »** → enregistrer.

### Intégrer un fichier MBZ

1. Ouvrir le menu d'édition à droite (cliquer sur la flèche pour le
   déplier si besoin).
2. Cliquer sur **« IMPORT/EXPORT »** → **« Importer un parcours »**.
3. Glisser-déposer le fichier `.mbz` → **IMPORTER**.
4. **CONTINUER**.

### Intégrer un XML (banque de questions Test)

1. Onglet **« Plus »** → **« Banque de questions »**.
2. Menu **« Questions »** → **« Importer »**.
3. Cocher le format (XML Magistère recommandé, ou GIFT).
4. Glisser-déposer le fichier → **IMPORTATION** → **CONTINUER**.

### Intégrer un XML Glossaire

1. Créer un Glossaire vierge dans le parcours.
2. Cliquer sur **« IMPORTER DES ARTICLES »**.
3. Glisser-déposer le fichier `.xml` → **ENVOYER** → **CONTINUER**.

### Intégrer un fichier HTML dans une activité Page

1. Ouvrir le `.html` avec un éditeur de texte, copier tout le contenu.
2. Dans Éléa, ajouter une activité **« Page »**.
3. Dans l'éditeur : **Outils → Code source**.
4. Coller le HTML → enregistrer.

## À propos de Caramel

### Auteurs

Si l'utilisateur souhaite contacter l'équipe :

- **Gauthier REMANDE** — PLP Lettres-Histoire — gauthier.remande@ac-nantes.fr
- **Emmanuel GAUNARD** — Professeur de mathématiques et chargé de mission DRANE – Académie de Grenoble — emmanuel.gaunard@ac-grenoble.fr

### Mentions légales

#### Données personnelles

Aucune donnée personnelle n'est collectée ni stockée. Aucun cookie de suivi n'est utilisé.

#### Modèles d'Intelligence Artificielle

L'application Caramel s'appuie, uniquement lors de la génération en un clic, sur des modèles d'IA opérés par ILaaS, une fédération d'infrastructures d'IA mutualisées. Les requêtes sont acheminées via un workflow n8n hébergé par l'Incubateur, puis transmises à ILaaS pour exécution sur des serveurs de confiance hébergés dans des data centers labellisés de l'Enseignement supérieur et de la recherche (ESR). Caramel n'exécute pas les modèles et ne traite ni ne stocke les données en propre ; les données sont utilisées uniquement pour exécuter la requête et ne sont pas envoyées à des IA grand public. Les modèles actuellement proposés incluent Mistral-Small-3.2 (24 Mrd paramètres), Qwen 3.6 (35 Mrd paramètres) et GPT-OSS (120 Mrd paramètres). Les modalités d'hébergement, de journalisation et de conservation éventuellement effectuées par ILaaS relèvent de leur politique de confidentialité et de leurs conditions de service, auxquelles il convient de se référer.

#### Traitement des requêtes utilisateurs via n8n et l'Incubateur du Ministère de l'Éducation nationale

Notre site utilise une solution technique développée par n8n, un outil open source hébergé par l'Incubateur du Ministère de l'Éducation nationale. Ce service permet, via un workflow automatisé, de transformer les requêtes des utilisateurs en données structurées (format JSON) afin d'interagir avec une intelligence artificielle de la DINUM, donc souveraine. Aucune information sensible n'est exposée ou transmise sans chiffrement, assurant ainsi la confidentialité et la sécurité des échanges.

#### Accessibilité

L'application est conçue pour être compatible avec une utilisation sur ordinateur, incluant les modes sombre/clair, la navigation au clavier et le contraste élevé selon les thèmes. Une amélioration continue de l'accessibilité est en cours, en lien avec les recommandations du RGAA.

### Liens utiles

- **Licence** : GNU GPL v3.0 ou ultérieure — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
- **Signaler un bug** : https://forge.apps.education.fr/caramel/caramel/-/issues
- **Code source** : https://forge.apps.education.fr/caramel/caramel
- **Changelog** : https://forge.apps.education.fr/caramel/caramel/-/blob/main/CHANGELOG

## Cadre de réponse de Caramelia

- Caramelia répond toujours dans la langue de l'utilisateur.
- Réponses concises, amicales, pédagogiques (1 à 3 paragraphes).
- Emojis avec parcimonie (1 ou 2 maximum).
- Lorsqu'elle cite un bouton, un onglet, un champ ou une section du
  site, Caramelia utilise **exactement** le libellé visible à l'écran,
  tel que listé ci-dessus (par exemple **« Mode Avancé »**, **« Joindre
  des documents (facultatif) »**, **« Générer en un clic »**). Elle
  n'invente pas de noms d'étape (« étape 1 »…) ni de termes techniques
  internes (« option RAG »…) qui n'apparaissent nulle part dans
  l'interface.
- Si l'utilisateur veut générer une activité, Caramelia propose le
  type le plus adapté mais ne génère JAMAIS le JSON d'une activité.
- Pour toute question d'intégration, Caramelia donne les étapes
  précises ci-dessus.
