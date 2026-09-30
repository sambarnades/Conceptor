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

Sous le formulaire, **Une activité** affiche ces tuiles ; **Un parcours** ouvre l’atelier qui assemble plusieurs activités en un cours complet (voir « Créer et reprendre un parcours complet »).

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

L'application Caramel s'appuie, uniquement lors de la génération en un clic, sur des modèles d'IA opérés par ILaaS, une fédération d'infrastructures d'IA mutualisées. Les requêtes sont acheminées via un workflow n8n hébergé par l'Incubateur, puis transmises à ILaaS pour exécution sur des serveurs de confiance hébergés dans des data centers labellisés de l'Enseignement supérieur et de la recherche (ESR). Caramel n'exécute pas les modèles et ne traite ni ne stocke les données en propre ; les données sont utilisées uniquement pour exécuter la requête et ne sont pas envoyées à des IA grand public. Les modèles actuellement proposés incluent Gemma 4 (31 Mrd paramètres), Qwen 3.8 (27 Mrd paramètres) et Mistral Small 4 (119 Mrd paramètres). Les modalités d'hébergement, de journalisation et de conservation éventuellement effectuées par ILaaS relèvent de leur politique de confidentialité et de leurs conditions de service, auxquelles il convient de se référer.

#### Traitement des requêtes utilisateurs via n8n et l'Incubateur du Ministère de l'Éducation nationale

Notre site utilise une solution technique développée par n8n, un outil open source hébergé par l'Incubateur du Ministère de l'Éducation nationale. Ce service permet, via un workflow automatisé, de transformer les requêtes des utilisateurs en données structurées (format JSON) afin d'interagir avec une intelligence artificielle de la DINUM, donc souveraine. Aucune information sensible n'est exposée ou transmise sans chiffrement, assurant ainsi la confidentialité et la sécurité des échanges.

#### Accessibilité

L'application est conçue pour être compatible avec une utilisation sur ordinateur, incluant les modes sombre/clair, la navigation au clavier et le contraste élevé selon les thèmes. Une amélioration continue de l'accessibilité est en cours, en lien avec les recommandations du RGAA.

### Liens utiles

- **Licence** : GNU AGPL v3.0 ou ultérieure — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
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

<!-- parcours-complet -->
## Créer et reprendre un parcours complet

Dans Caramel, **Un parcours** crée un cours pour Éléa, Magistère ou Moodle : plusieurs activités, rangées en sections, dans un seul fichier **.mbz**. Le formulaire habituel (sujet, public, documents joints) reste le point de départ. L’atelier parle le vocabulaire de la plateforme choisie : des élèves sur Éléa, des stagiaires sur Magistère, des étudiants sur Moodle — à l’écran, dans le cours et dans les textes que rédige l’IA.

Depuis le menu de Caramelia, **Créer un parcours** ouvre directement l’atelier, sans appel à l’IA. Si un brouillon existe, **Reprendre mon parcours** le retrouve. Les champs et les sources déjà présents sont conservés. Le cadrage et le plan se relisent dans l’atelier avant de lancer la génération.

Choisissez **Un parcours** sous le formulaire, puis la plateforme, la modalité, l’ampleur, **Un même chemin pour tous** ou **Des chemins selon les résultats**, et une trame : les plus courantes sont proposées d’abord — apprendre en autonomie, réviser, s’entraîner, évaluer —, **Voir les autres modèles** affiche les suivantes. **Composer le plan** adapte le plan à votre sujet avec l’IA. **Partir du modèle** ouvre immédiatement une structure à compléter, sans appel à l’IA. Les activités ne sont générées qu’après votre validation du plan.

Dans **Plan**, modifiez le titre, l’objectif général, les notions du parcours, les étapes et les activités. Déplacez les activités avec les flèches ou leur vignette. **Consigne et palier** permet d’ajuster les indications de génération. Les repères pédagogiques vous aident à relire sans imposer un modèle. Le maximum est de **12 activités**.

Dans la carte d’une **Vidéo interactive**, collez le lien de la vidéo. La transcription est récupérée pendant la fabrication ; vous pouvez aussi la coller manuellement. Pour **Image interactive**, **Trouver la zone** ou **Trouver les zones**, joignez une image dans la carte : elle sera analysée avant la génération. Ces supports peuvent aussi être complétés dans **Fabrication**. Sans support, l’activité attend et les autres avancent. Le scénario conserve les images et les liens propres aux activités ; les documents du formulaire d’accueil restent à part. Pour un **Lien web**, collez l’adresse de la ressource dans la carte : l’IA rédige la consigne de lecture sans ouvrir la page.

Quand un contenu est prêt, **Modifier le contenu** ouvre l’éditeur habituel et **Aperçu** ouvre son lecteur. **Relire le parcours** permet de les parcourir dans l’ordre avec **Précédente** et **Suivante**. Enregistrez vos retouches pour les retrouver dans le plan et dans les exports. Modifier une consigne du plan ne réécrit pas un contenu déjà généré.

Validez le plan pour lancer la fabrication. Vous pouvez arrêter, reprendre les activités manquantes ou refaire une activité. Le cadenas **Ne pas générer cette activité** réserve son contenu à une saisie manuelle : l’IA ne la remplit pas. Une tentative de régénération ratée conserve le contenu précédent. Les activités absentes sont nommées avant l’export.

**Exporter le scénario (.json)** garde le plan et les contenus déjà prêts dans un fichier **.json**. Le bouton **Personnaliser le plan**, à côté de **Composer le plan**, ouvre la même fenêtre que pour une activité : on y copie le prompt vers l’IA de son choix, puis on y colle sa réponse. **Reprendre un scénario** se trouve dans cette fenêtre ; le fichier **.json** se télécharge à la livraison, à côté du **.mbz**. Le brouillon n’est gardé que dans l’onglet : exportez le scénario avant de le fermer. Le scénario ne contient pas le sujet, le public ni les documents joints ; renseignez-les à nouveau avant de générer de nouveaux contenus.

Dans **Livraison**, téléchargez le **.mbz**, puis utilisez l’import de parcours ou la restauration de cours de votre plateforme. Ce fichier de cours ne se dépose pas dans une activité H5P. Le parcours rejoint aussi la zone de notifications : **Visualiser** y ouvre la **Vue du parcours**, avec l’accueil, chaque étape et ses activités, que l’on revoit et modifie avant de retélécharger. Gardez aussi le **.json** pour revenir dans Caramel. La fiche de séquence et le détail des activités s’exportent en **DOCX, ODT ou PDF**.

Le plan propose aussi les modules de votre Éléa, Magistère ou Moodle, rangés dans le menu de chaque activité sous **Modules de la plateforme** : forum, sondage, questionnaire, enquête, leçon, atelier d’évaluation par les pairs, tableau, wiki, document collaboratif, glossaire et base de données à construire, classe virtuelle, choix de groupe, partage de fichiers et lien web. L’IA en écrit ce que la plateforme conserve à l’import ; les espaces collectifs arrivent vides, avec leur consigne. Quand un module demande un réglage sur la plateforme (phases de l’atelier, heure de la classe virtuelle, groupes), Caramel l’écrit dans une note **À faire avant d’ouvrir le cours**, cachée aux élèves, en tête du cours importé. Le **Paquetage IMS** — des pages à lire avec leur table des matières, entièrement écrites par Caramel — se choisit dans la mosaïque ; le plan ne le propose pas.

La carte de progression est propre à Éléa. La carte, l’ouverture progressive et les chemins selon les résultats demandent encore une vérification en situation sur la plateforme. Les échanges collaboratifs ont lieu sur la plateforme. Le dépôt d’un parcours complet dans Sucrerie n’est pas encore disponible.

Pour aller plus loin : [ABC Learning Design (UCL)](https://www.ucl.ac.uk/short-courses/staff-resources/course-design/designing-learning-activities) aide à réfléchir aux activités d’apprentissage. Les sept familles affichées dans Caramel, dont **Discuter** et **Coopérer**, sont des repères simplifiés liés aux outils, pas les six types ABC ni une évaluation de votre pédagogie.
Sur Éléa, dans **Réglages du cours**, activez la carte de progression puis utilisez la tuile **+ Ajouter mon image** pour choisir votre propre fond. Vous pouvez changer ou retirer l’image et revenir aux thèmes proposés. Le fond est conservé dans le scénario **.json** et intégré au parcours **.mbz**. JPEG, PNG, HEIC, WebP, GIF, BMP, AVIF, SVG ou TIFF · 12 Mo max. Conversion automatique, sans recadrage.

<!-- parcours-trames -->
### Choisir une trame

Après **Un parcours**, la trame donne le déroulé que l’IA adapte au sujet. La liste affichée dépend de la modalité et de l’ampleur choisies ; chaque activité reste modifiable dans le plan.

- **Apprendre en autonomie** — Une notion nouvelle, apprise seul : la découvrir pas à pas, s’exercer avec une correction immédiate, retenir l’essentiel, vérifier. *(Une séance · Deux à trois séances · Une séquence entière)*
- **Réviser avant l'évaluation** — On situe ce qui est acquis, on remet l'essentiel sous les yeux, on s'entraîne, on se teste. *(Une séance · Deux à trois séances)*
- **S’entraîner** — Un rappel pour réactiver, des exercices avec propositions puis sans, une vérification finale : la difficulté monte, le cours n’est pas refait. *(Une séance · Deux à trois séances · Une séquence entière)*
- **Évaluer** — Les attendus, un entraînement au format, puis l’évaluation : une seule tentative, chronométrée, sans correction affichée ; la note seule à la fin. *(Une séance)*
- **Remédier après l'évaluation** — On repart des erreurs constatées : on les nomme, on réexplique le point précis, on refait, on revérifie. *(Une séance · Deux à trois séances · À distance · Les deux)*
- **Rituel court** — Dix minutes, toujours la même forme. C'est la répétition qui installe, pas la variété. *(Une séance)*
- **Découvrir une notion** — Une situation qui interroge, des documents à explorer, puis la synthèse, et seulement ensuite l'application. *(Deux à trois séances · Une séquence entière)*
- **Classe inversée** — La capsule et sa vérification à la maison, la tâche qu'on ne peut pas faire seul en classe, le bilan après. *(Une séance · Deux à trois séances · Les deux)*
- **Étudier une œuvre** — Entrer dans le texte ou l'image, repérer, situer, interpréter, puis produire sa propre lecture. *(Deux à trois séances · Une séquence entière)*
- **Mener une investigation** — Une question, une hypothèse, des données, une conclusion : la démarche scientifique dans l'ordre. *(Deux à trois séances · Une séquence entière · En classe · Les deux)*
- **Analyser une source** — D'où vient l'information, qui la produit, ce qu'elle omet. Outiller le regard avant de juger. *(Une séance · Deux à trois séances)*
- **Débat argumenté** — Un vote pour dire d'où l'on part, des sources pour s'informer, un forum pour débattre, un texte pour conclure. *(Deux à trois séances · Une séquence entière)*
- **Différencier dès le départ** — Un test de positionnement ouvre à chaque élève un chemin adapté à son résultat ; tous se retrouvent pour un bilan commun. *(Une séance · Deux à trois séances · Des chemins selon les résultats)*
- **Remédier en cours de route** — On découvre, on fait le point par un quiz : selon le score, on revoit ou on va plus loin, puis on réinvestit ensemble. *(Une séance · Deux à trois séances · Des chemins selon les résultats)*
- **Séquence de langue vivante** — Le lexique d'abord, la compréhension ensuite, la production en dernier. *(Deux à trois séances)*
- **Préparer une prise de parole** — Ce qu'on va dire, dans quel ordre on va le dire, et comment on s'entraîne à le dire. *(Une séance · Deux à trois séances · En classe · Les deux)*
- **Apprendre à apprendre** — Ce qui aide vraiment à retenir, essayé sur le sujet du cours : se tester, espacer, expliquer. Puis chacun planifie ses révisions. *(Une séance · Deux à trois séances)*
- **Se former en autonomie** — Personne derrière l'écran : le parcours doit se suffire à lui-même, du sommaire à l'évaluation finale. *(Deux à trois séances · Une séquence entière · À distance)*
- **Formation hybride en trois temps** — L'amont à distance, le regroupement, puis la mise en œuvre et le retour d'expérience. Le format des parcours de formation. *(Une séquence entière · Les deux)*
- **Démarche de projet** — Une commande et ses critères, de la documentation, un travail d'équipe, une production relue entre pairs, puis améliorée. *(Une séquence entière · En classe · Les deux)*
- **Travail d'équipe** — Former les équipes, rassembler les idées, écrire ensemble, se relire entre pairs avec une grille. *(Deux à trois séances · Une séquence entière)*
- **Jeu d'évasion** — Une mission, des indices, des énigmes de difficulté croissante, un code final, et le débriefing. *(Une séance · Deux à trois séances · En classe · Les deux)*
- **Structure libre** — Aucun déroulé imposé : vous composez les étapes vous-même et Caramel remplit ce que vous y posez. *(Une séance · Deux à trois séances · Une séquence entière)*
<!-- /parcours-trames -->

<!-- parcours-chemins -->
### Des chemins selon les résultats

Au cadrage, **Des chemins selon les résultats** fait passer un test à vos élèves : selon sa note à la première tentative, chacun suit l’un des 2 à 4 chemins — **Reprendre les bases**, **Renforcer**, **Consolider**, **Approfondir** —, puis tous se retrouvent pour une étape commune. Chaque élève ne voit que son chemin. Deux trames sont pensées pour cela : **Différencier dès le départ** et **Remédier en cours de route**.

- Dans **Plan**, la barre des scores montre quel chemin s’ouvre pour chaque nombre de bonnes réponses ; les boutons **−** et **+** avancent ou reculent le début d’un chemin d’une bonne réponse. **Ajouter un chemin**, **Retirer un chemin** et **Un seul chemin pour tous** changent l’aiguillage.
- Le test qui oriente est un **Quiz QCM**, un **Quiz Vrai/Faux** ou un **Test**, placé à la fin de l’étape qui précède les chemins. Chaque question vaut un point, et le test ne propose pas de recommencer.
- **Voir comme un élève** montre la page du cours telle que l’élève la verra — avant le test, pendant son chemin, à la fin — pour le score que vous choisissez.
- Pour réorienter un élève, modifiez sa note au test dans le carnet de notes de la plateforme.

Importez un parcours à chemins dans un cours **vide** : Moodle range les sections du fichier dans celles du cours, et vos sections existantes recevraient les restrictions des chemins. Tous les parcours se terminent désormais par une section **Fin du parcours**, et la durée estimée s’affiche sous chaque activité.
<!-- /parcours-chemins -->
<!-- /parcours-complet -->
