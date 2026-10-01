# Suivi du chantier H5P, éditeur et parcours

**Le parcours de maths d’Emmanuel — 1er octobre après-midi (D109 à D111) :** une Rédaction écartée à la livraison (`occurrences: 0`) : le réglage se répare désormais, et chaque activité est mise en paquet dès la fabrication (redemandée si refusée). Deux images inventées (`via.placeholder.com`) dans une Page : retirées — toutes celles de l’IA de Caramel dans un parcours, les seuls services factices ailleurs (une image collée depuis une IA grand public ou ajoutée à la main reste). Trous sans réponse (Mistral) : réparés quand la réponse se déduit (résultat du calcul, valeur et unité à l’envers, fraction en deux trous), repérés sinon, et la seconde demande dit la panne, aussi en un clic. Modale « Commencer un nouveau parcours ? » alignée, rouge au survol. **Reste :** les erreurs de calcul ou de notion du modèle (« l’angle saillant est plus grand qu’un angle droit ») ne se voient pas automatiquement.

**Le plan ne revient plus au cadrage — 1er octobre au matin (D107, D108) :** le plan reçu est réparé avant d’être jugé (`reparation-plan.js` : durées des chemins égalisées, test posé, chemins regroupés, modules et paliers ramenés, textes complétés) ; après la reprise unique, le meilleur plan est ramené à la forme demandée et retenu — seule une réponse sans aucune activité échoue. Le prompt du plan montre un exemple complet de la forme demandée (`exemple-plan.js`), contrôlé sur 600 cadrages. Relevé réel sur 16 cadrages : 7 retours au cadrage avant, 16 plans retenus après, avec Mistral Small 4 comme avec Qwen 3.8. Banc `run_parcours_reparation.mjs` (CI). Aussi : colonnes de chemins alignées (sous-grille), vignette H5P de « Voir comme un élève » à ses proportions. **Reste :** les trous sans réponse de Mistral (`*x*`, unité seule, calcul entier, réponse et indice inversés) ne sont pas tous repérés par `controle-sortie-ia.js` ; le choix du modèle par défaut (Qwen 3.8 le plus juste en calcul) attend la décision d’Emmanuel.

**Vérification de génération réelle — nuit du 1er octobre (D106) :** 8 activités par la vraie interface et 4 parcours (Moodle « Évaluer », Éléa à 3 chemins, Magistère « S’entraîner », Moodle « Apprendre en autonomie »), relus par `run_parcours_reels.mjs`. Corrigé : trous en noms de variables (repérés par `controle-sortie-ia.js`, redemandés par la file du parcours), gras Markdown dans le titre des exercices (Présentation, Livre interactif, Vidéo interactive), générateur de parcours réels qui ne rendait pas la main. Aussi : variantes contradictoires dans un trou (« X/ce n’est pas X »), virgule LaTeX `37{,}5` dans les réponses, longueur des Pages (fourchette, mesurée). **Reste :** un Quiz mixte « en un clic » a échoué une fois sur dix (le premier essai), non reproduit ; les calculs générés en mathématiques peuvent être faux (3 sur 8 dans un tirage) — aucun contrôle ne le voit, à relire.

**Le vocabulaire suit la plateforme — 1er octobre au soir (D105, 7.1.0) :** élèves sur Éléa, stagiaires sur Magistère (et « Le formateur »), étudiants sur Moodle, partout dans l’atelier : cadrage repeint au changement de plateforme, chemins, « Voir comme un stagiaire / un étudiant », relecture, fiche de séquence, modules de la plateforme, étiquettes écrites dans le cours. 125 variantes `_magistere` / `_moodle` dans les 12 langues, choisies par `js/parcours/vocabulaire.js`. Les prompts définissent le public par la plateforme (vouvoiement, « le groupe »). Bancs : aiguillage section G (contre-épreuve au rouge), chemins section 8. Fiche RAG `parcours-creation` (1.5.0) réingérée dans les 12 langues le 1er oct. (12 remplacées, aucun autre document touché).

**Retours de Gauthier sur un parcours réel — 1er octobre (D102 à D104, 7.1.0) :** dans un Quiz mixte, trois exercices sans consigne (le modèle l’avait omise) : réparateur (consigne rangée sous un autre nom remise à sa place), seconde demande dans la file du parcours, règle au cadre du prompt. Vitrine des trames : apprendre en autonomie, réviser, s’entraîner, évaluer (deux trames nouvelles ; « Évaluer » règle le Test en épreuve : une tentative, chronométrée, note seule). La longueur d’une Page ou d’un Livre suit sa durée (80 mots par minute). RAG : fiches parcours écrites en ligne (864 documents). **Reste** : l’aller-retour Éléa avec de vrais comptes élèves ; la seconde demande pour la génération d’une activité seule.

**Chemins selon les résultats — 30 septembre (D90 à D101, 7.1.0) :** la note d’un test (Quiz QCM, Quiz Vrai/Faux ou Test, première tentative, un point par question) ouvre à chaque élève un chemin parmi deux à quatre — Reprendre les bases, Renforcer, Consolider, Approfondir —, les autres lui restant invisibles ; tous se retrouvent pour une étape commune. Choix au cadrage (« Tous vos élèves suivent-ils le même chemin ? »), trois trames à l’écran et « Voir les autres modèles », deux trames à chemins, aiguillage réglable en bonnes réponses dans le plan, « Voir comme un élève ». Dans TOUS les parcours : section « Fin du parcours » et durée dans chaque description. Défaut de la 7.0 corrigé en route : les H5P jamais notés (Frise, Cartes de dialogue…) s’achèvent à la consultation (D100). Bancs : chemins 37/0 (Node, CI), aiguillage 56/0, calibrage 74/0, course 119/0, atelier 193/0. **Reste : l’aller-retour Éléa avec trois élèves** (`node scripts/generer-parcours-sonde-chemins.mjs`, fiche dans `tests/sonde-parcours/sonde-chemins-elea.md`), les traductions relues, le tutoriel et les captures, puis la version.

**Modale de remplacement, pictogrammes — 28 septembre au soir (D84) :** « Remplacer le parcours en cours ? » dans la modale de l’atelier (Garder, Remplacer, et Exporter le scénario sans fermer), plus aucune boîte du navigateur ; pictogrammes SVG à gauche des chiffres clés du plan et de la livraison.

**Captures, tutoriel, wiki et Caramelia — 28 septembre au soir (D83) :** `scripts/captures-interface.mjs` refait les captures (5 de l’accueil, qui montrent maintenant le commutateur, et 7 du parcours sur un parcours réel du banc) ; tutoriel illustré dans les 12 langues, passages périmés corrigés (commutateur sous le formulaire, dépôt Sucrerie masqué retiré du tutoriel, du wiki et du README) ; `scripts/aide-parcours.mjs` donne à Caramelia les vingt trames, les modules de la plateforme et les conseils de construction — aide embarquée active tout de suite, fiches du RAG **ingérées le soir même** (816 → 852 documents ; recherche : 15 questions de référence sur 22 trouvent leur fiche — les échecs restants visent surtout les fiches du 10 septembre).

**Prompts isolés, miroir, nouvelle trame — 28 septembre au soir (D82) :** le parcours ne modifie plus aucun prompt individuel (les 60 retours d’exemple impersonnels sont substitués dans le prompt des cartes seulement, `retours-impersonnels.js` ; exemples communs de `fr.json` revenus à leur texte d’avant) ; miroir à sept familles (*discuter* et *coopérer* au lieu d’*échanger*) ; trame « Apprendre à apprendre » (20 trames), éprouvée sur un parcours réel ; la commande d’une carte passe avant le sujet du parcours dans son prompt.

**État de l’art didactique — 28 septembre (D81) :** trames relues à l’aune d’ABC Learning Design, des didactiques et des sciences cognitives ([document](ETAT_DE_L_ART_DIDACTIQUE_PARCOURS_2026-09-28.md)). Diagnostic et réveil en série de Vrai/Faux (un Vrai/Faux ne porte qu’une affirmation) ; démarche de projet où la critique des pairs est suivie d’une version améliorée ; formation hybride en exemple commenté → essai → plan d’action → mise en œuvre → retour → test final ; intentions précisées (découverte guidée, réfutation, lecture latérale, marche à suivre du débat, tâche finale en langue, seuils de score, responsabilité individuelle). Règles de plan : test de fin sur tout le parcours ; un test ne note pas des habitudes. Contrôle `remarquesComposition()` (second espace collaboratif → une recomposition, jamais un échec). Intention par ampleur (« version longue » finissait en titre). Cinq parcours réels en banc (+ Réviser 5ᵉ, Projet 4ᵉ). Reste : séparer « échanger » en discuter / coopérer dans le miroir (à décider) ; trame « Apprendre à apprendre » (idée).

**Parcours réels, Paquetage IMS, livraison — 28 septembre (D78 à D80) :** écran de livraison réordonné (le cours et ses étapes d’import d’abord ; le `.json` dans « Reprendre ce parcours plus tard ») ; Rédaction à variantes orphelines réparée (cause de l’erreur vue après un Lien web). **Paquetage IMS** écrit entier par Caramel (pages, manifeste, archive, table des matières sérialisée PHP), sur demande dans la mosaïque, jamais proposé par le plan — **aller-retour VALIDÉ le jour même sur Éléa (804) et Magistère (2563), 0 écart au ré-export, fichiers revenus au SHA-1 près**. **Trois parcours réels** (Pix+Édu « Protéger les données » et « Activité collaborative » sur Magistère, débat en 3e sur Éléa) générés par le vrai pipeline et gardés en banc (`run_parcours_reels.mjs`, contre-épreuve à défauts injectés). Défauts trouvés et corrigés à la source : jargon des prompts dans les textes, registre instable (exemples des prompts à l’impersonnel en français), question à trous injouable refusée, espaces communs dupliqués, Page ou sondage qui « recueillent », rôles de la trame Débat, sondages comparables, gras de texte à trous de Présentation, cases « … », gras répété. Reste : exemples à l’impersonnel dans les 11 autres locales ; erreurs de fond du modèle, que seule la relecture voit.

**Palettes et retouches — 28 septembre (D77) :** classe virtuelle sur Magistère seul (visio absente d’Éléa et de Moodle, confirmé par Emmanuel) ; palettes relues en direct et tenues par le banc ; cartes de trame à trois lignes avec fond uni de sélection ; vignettes H5P non déformées et pictogramme « rien à générer » dans la mosaïque.

**Mosaïque des types et trames — 28 septembre (D76) :** le type d’une carte se choisit dans une mosaïque illustrée (vignettes Éléa relevées pour les modules de la plateforme, filtre, deux rubriques) ; alternatives `a|b` dans les trames ; trames « Débat argumenté » et « Travail d’équipe » (19 au total) ; classe virtuelle écartée du prompt en présentiel ; export DOCX/ODT/PDF des modules de la plateforme lisible (plus de JSON brut). Bancs natifs 119, relecture 42.

**Modules de la plateforme dans les parcours — 27 septembre (D70 à D74) :** deux cours de test remplis de tous les types de leur palette (Éléa test03, cours 801 : 36 types ; Magistère Grenoble, cours 2560 : 29), avec contenu, puis exportés ; formes relevées dans `tests/fixtures/moodle-reference/sept-2026/`. Quatorze modules livrés dans `js/parcours/modules-natifs.js` : questionnaire, enquête (Feedback), leçon, atelier, tableau, wiki, glossaire à construire, document collaboratif, Etherpad, partage de fichiers, classe virtuelle, base de données, choix de groupe, lien web. Modules sans achèvement hors de l'ouverture progressive, étiquette « À faire » cachée aux élèves, famille « Échanger », trames et menu groupé. Génération réelle vérifiée (questionnaire, leçon, atelier, tableau). Bancs : natifs **104/104**, suite parcours verte. **27 septembre au soir : premier import des deux sondes en échec total sur `mod_collabora/initialfilemissing` — fichier de départ du Document collaboratif désormais embarqué (D75), sondes régénérées. Second aller-retour VALIDÉ le soir même sur Éléa (cours 803) et Magistère (cours 2563) : restauration complète, 0 écart au ré-export.** Reste : relecture des noms bretons, grecs et chinois ; Fichier/Dossier et Capytale à ouvrir plus tard.

**Quiz à trous — 22 septembre :** valeurs de démonstration H5P « Fill in / Oslo » reproduites avec paramètres absents ou liste vide. Contrôle final ajouté à l’export pour les textes à trous autonomes et imbriqués, y compris natifs. Contre-épreuve lecteur réussie ; exercice valide exporté/rouvert et corrigé 1/1. Suites édition/export : **3 361/3 361**. Changelog 7.0.0 complété. Suivi déplacé dans `docs/`, liens actualisés. **Non publié.**

**Retours utilisateurs — 22 septembre :** bug vidéo reproduit dans Firefox sur la publication Sucrerie signalée : MP4 fragmenté à durée infinie. Téléchargement progressif PeerTube et embarquement du média corrigés localement (80 Mio maximum) ; copie H5P autonome réparée, résumé de cinq groupes ouvert dans Firefox et Chromium. Suite vidéo : 120/120. Textes à trous : recettes locales 2/2, fichier du témoignage encore nécessaire. **Non publié ; import Éléa de la copie corrigée à valider.** [Diagnostic et preuves](RETOURS_UTILISATEURS_2026-09-22.md).

> **État consolidé et reprise Claude (14 septembre)** : [checklist du travail restant](REPRISE_CLAUDE_PARCOURS_2026-09-14.md). C/F réimportés par l’utilisateur ; exécution distante encore à vérifier. Ce bilan remplace les statuts historiques ci-dessous.

**Vue du parcours et notifications, 14 septembre (D65) :** « Relire le parcours » s'ouvre sur la vue du cours (accueil, étapes et leurs textes, forum et textes de liaison compris) ; le MBZ téléchargé rejoint la zone de notifications, où il se revoit, s'édite activité par activité et se retélécharge régénéré. Banc `tests/run_parcours_vue.mjs`. **Reste : réingestion ILaaS des 24 fiches RAG modifiées** dès le retour du service.

**Relecture UX de l'atelier, 14 septembre (D64) :** textes d'accueil et d'introduction d'étape rédigés avec le plan et posés en étiquettes en tête de section ; interrupteur « Simple | Guidé » à la place du bouton « IA externe », fenêtre prompt/réponse reprise de la modale d'activité ; bouton « Générer les activités manquantes » ; livraison sur le modèle du pied d'aperçu ; notions en pastilles ; libellés allégés dans les 12 langues. Correctif : une étiquette n'entre plus dans la condition d'ouverture progressive. Bancs parcours verts, détail dans `docs/PRD_PARCOURS.md` (D64). **Reste : importer `tests/sonde-parcours/sonde-parcours-elea.mbz` régénéré dans Éléa** (étiquettes en tête de section avec ouverture progressive), puis tutoriel et aide Caramelia.

- [x] Livraison Sucrerie C/F complete (14 septembre) : JSON entiers disponibles dans son dossier `n8n-workflows/livraison-workflows-complets-v3-2026-09-14/`, sources preservees, validations v1/v2/v3 et comparaison integrale reussies. Voir `docs/PUBLICATION_PARCOURS_V3_2026-09-14.md`. Réimport confirmé par l’utilisateur ; recette distante à effectuer.

**Lot publication — 14 septembre :** brouillon sauvegarde raccorde au bouton de publication et au resume IA ; formulaire et payload v3 verifies avec services interceptes, **102 tests cibles reussis**. Reexport mixte Elea final compare : ordre, consigne modifiee, medias et Test conserves. **C/F réimportés par l’utilisateur ; recette serveur à effectuer, aucun SQL de publication nécessaire.** [Procedure et reste a faire](PUBLICATION_PARCOURS_V3_2026-09-14.md).


**Recette mixte Éléa — 14 septembre :** neuf éléments restaurés dans le bac 796, deux occurrences H5P utilisables, Test corrigé à **1/1**, consigne H5P réellement modifiée et relue. Réexport final après modification encore en comparaison ; publication et production restent ouvertes. [Détail et limites](PARCOURS_EXPORTS_V3_2026-09-14.md).


**Recette Éléa — 14 septembre :** sonde textuelle restaurée dans le cours 796 « Nouveau bac », affichage vérifié puis réexport natif téléchargé : **4 textes sur 4 et ordre conservés dans le XML**. Fusion sans écraser les réglages du cours. La recette avec activités mixtes et la mise en production restent ouvertes. [Preuves](PARCOURS_EXPORTS_V3_2026-09-14.md).


**Point courant — 14 septembre :** exports du brouillon dans cinq formats et lecteurs de collection v3 implémentés ; **97 contrôles ciblés réussis**. Préparation C/F issue des workflows actuels, sans réimport. **Import Éléa, publication du brouillon et mise en production encore ouverts.** [État détaillé et preuves](PARCOURS_EXPORTS_V3_2026-09-14.md). Les bilans ci-dessous sont chronologiques.


État vérifié le **12 septembre 2026**. Point d’entrée pour la suite du travail.
Branches : **`emmanuel` dans `bas` et dans Sucrerie**. Version Caramel : **7.0.0**.

**Lot du 13 septembre terminé : sélecteur sous le cadrage et IA externe du plan/des activités dans Caramel.** [Recette et mode d’emploi](PARCOURS_IA_EXTERNE_2026-09-13.md). Commits bas `bcafc5da` / Sucrerie `bfd86af` ; non publiés. Collection parcours Sucrerie : lot suivant, encore ouvert.

- [x] Affinement visuel du 13 septembre : sélecteur Caramel élargi à 480 px (350 px sur écran de 390 px), espaces identiques de 12 px de part et d’autre, contenu remonté de 26 px. Huit combinaisons Rapide/Avancé × Activité/Parcours × ordinateur/téléphone mesurées sans débordement. Preuves : `tests/sonde-parcours/selecteur-2026-09-13/`. Correction CSS propre à Caramel ; report documentaire dans Sucrerie. Non publié.

- [x] Variante intégrée du 13 septembre : sélecteur au bas du formulaire, sur toute la largeur des champs, deux moitiés égales ; sélection blanche sur gris léger, sans barre flottante. Écart formulaire/contenu identique de 16 px dans les huit combinaisons testées ; 172 contrôles atelier et recette IA externe sans échec. Captures comparables conservées dans `bas/tests/sonde-parcours/selecteur-2026-09-13/` (avant, commit `c06cf5cf`) et `selecteur-integre-2026-09-13/` (après). Report documentaire Sucrerie, aucun changement de production.

- [x] Raffinement final du choix (13 septembre) : présentation radio sobre, sans seconde barre d’onglets. En Rapide après le sujet ; en Avancé après les champs de niveau/quantité et immédiatement avant les documents. Même groupe déplacé sans perdre la sélection. Huit configurations mesurées, captures dans `bas/tests/sonde-parcours/choix-formulaire-2026-09-13/`, 172 contrôles atelier sans échec. Versions précédentes conservées (`c06cf5cf`, `8413e819`). Non publié.

- [x] Actions du plan allégées (13 septembre) : IA externe et Composer le plan de mêmes dimensions, Partir du modèle distinct ; rappel redondant du sujet et message prêt retirés du cadrage. Blocage sans sujet conservé. Quatre états ordinateur/téléphone, sujet vide/rempli, mesurés sans débordement ; captures `bas/tests/sonde-parcours/actions-plan-2026-09-13/`. Non publié.

- [x] Variante textuelle du 13 septembre : retrait des ronds radio, petites icônes monochromes et soulignement gris du choix actif. Position avant les documents et navigation clavier conservées. Huit configurations de rendu vérifiées ; captures `bas/tests/sonde-parcours/choix-texte-2026-09-13/`. Non publié.

- [x] Proposition bandeau séparé (13 septembre) : toggle sur toute la largeur, sous le bloc complet Rapide/Avancé, sélection blanche sur gris doux. Espaces de 12 px avant/après dans les huit configurations vérifiées. En Avancé, le bandeau suit désormais le formulaire complet, documents compris, conformément au dernier emplacement demandé. Captures `bas/tests/sonde-parcours/bandeau-choix-2026-09-13/`. Versions précédentes conservées ; non publié.

- [x] Zone compacte (13 septembre) : proposition dans la rangée Rapide/Avancé annulée à la demande de l’utilisateur. Choix rétabli après le contexte, réduit à 320 px × 40 px sur ordinateur, sélection bleu pâle ; filtres rapprochés juste dessous. Les cartes remontent de 42 px par rapport au bandeau pleine largeur. Huit configurations mesurées sans débordement ; captures `bas/tests/sonde-parcours/choix-compact-2026-09-13/`. Non publié.

- [x] Deux boutons intégrés (13 septembre, demande utilisateur) : choix rectangulaires côte à côte sur la largeur des champs, sélection bleu pâle, dans le formulaire après la saisie et avant les documents en Avancé. Rapide/Avancé et filtres préservés. Huit configurations de rendu vérifiées sans débordement ; captures `bas/tests/sonde-parcours/choix-boutons-2026-09-13/`. Non publié.

- [x] Libellé du choix (13 septembre) : « Que souhaitez-vous créer ? » à gauche des boutons sur ordinateur, aligné avec le texte des champs ; au-dessus sur téléphone. Clé de traduction existante réutilisée. Huit configurations de rendu vérifiées ; captures `bas/tests/sonde-parcours/choix-libelle-2026-09-13/`. Non publié.

- [x] Choix retenu avec la référence de Gauthier (13 septembre, D63) : capsule centrée sous le formulaire complet, limitée à 480 px, deux segments égaux et sélection bleu grisé clair. Question retirée visuellement, nom accessible et clavier conservés ; icône caramel du parcours. Seize configurations Rapide/Avancé × Activité/Parcours × 1280/1127/390/320 px sans débordement, espaces de 12 px, cibles tactiles de 44 px. Banc atelier : 172 PASS / 0 FAIL. Captures et mesures : `tests/sonde-parcours/selecteur-gauthier-2026-09-13/`. Remplace les variantes ci-dessus ; non publié.

**Collection parcours Sucrerie — premier lot terminé localement :** modèle de plan commun, deux adaptateurs de lecture et rendu commun des étapes/consignes. 63 contrôles ciblés et 3 108 tests de régression réussis ; édition de cours et réouverture avec API simulée. Persistance v3, commandes d’ajout, IA et recette distante encore ouvertes. [Bilan](COLLECTION_PARCOURS_MODELE_2026-09-13.md).

- [x] Harmonisation du bleu (13 septembre, ajustement de D63) : « Tout » et le segment sélectionné partagent le bleu grisé `#51779c`, avec texte blanc (contraste 4,70:1). Seize configurations visuelles revérifiées ; captures actualisées dans `tests/sonde-parcours/selecteur-gauthier-2026-09-13/`. Égalité des couleurs calculées confirmée dans l’aperçu ouvert. Non publié.

- [x] Correction du bleu réellement affiché à l’accueil (13 septembre) : retrait de la désaturation et de l’opacité des filtres lorsque le formulaire est vide. La précédente comparaison des seules couleurs CSS ne détectait pas cet effet. « Tout » et « Une activité » ont désormais le même fond, aucun filtre et une opacité de 1, vérifiés dans l’aperçu vide puis renseigné. URLs des trois feuilles CSS versionnées pour actualiser leur cache. Non publié.

**Collection parcours — deuxième lot terminé localement : brouillon éditable.** Étapes, consignes, références d’activités, aperçu, sauvegarde et réouverture sur cet appareil. Bouton réservé à localhost ; partage/export du brouillon et persistance serveur encore ouverts. 69 tests ciblés et 3 114 tests de régression réussis, zéro écriture HTTP dans la recette. [Preuves et limites](COLLECTION_PARCOURS_BROUILLON_2026-09-13.md).

**Persistance privée — préparation locale du 13 septembre :** contrat versionné, adaptateur de stockage distant et générateur d’un nouveau workflow n8n inactif. 10 contrôles de contrat et 73 tests ciblés réussis. SQL non exécuté, transport non raccordé à l’éditeur ; aucun workflow actif modifié. **Ne pas réimporter encore.** [Bilan et étapes restantes](COLLECTION_PARCOURS_PERSISTANCE_2026-09-13.md).

**Base de test — comparaison réelle en lecture seule (13 septembre) :** structure `sucrerie_bas` comparée à `sucrerie`, isolation des références conservée. Script de rattrapage préparé, terminé par ROLLBACK, **non exécuté** ; sauvegarde et autorisation du lot avant répétition. [Écarts et script](ALIGNEMENT_STRUCTURE_TEST_2026-09-13.md).

**Répétition SQL autorisée — réussie (13 septembre) :** sauvegarde de structure de `sucrerie_bas`, rattrapage temporaire et contrôles réussis, ROLLBACK confirmé ; sauvegardes avant/après identiques. **Aucun changement permanent, aucune écriture sur `sucrerie`.** Application permanente encore non autorisée. [Preuves](ALIGNEMENT_STRUCTURE_TEST_2026-09-13.md).

**Rattrapage de test appliqué avec accord séparé (13 septembre) :** COMMIT sur `sucrerie_bas`, puis contrôle depuis une nouvelle connexion : 15 objets ajoutés, défaut de licence aligné, aucune suppression ; catalogue `sucrerie` inchangé. Aucune copie de données, aucune table de brouillons ni réimport n8n. [Preuve d’application](ALIGNEMENT_STRUCTURE_TEST_2026-09-13.md).

**Brouillons — recette SQL et raccordement éditeur (13 septembre) :** 11 contrôles PostgreSQL sur `sucrerie_bas`, fixtures et table annulées par ROLLBACK. Éditeur raccordable au stockage distant : sauvegarde/réouverture et refus des conflits testés avec transport simulé. 73 régressions ciblées et 10 contrôles n8n réussis. Route réelle non installée, démonstration toujours locale. [Preuves](COLLECTION_PARCOURS_PERSISTANCE_2026-09-13.md).

**Transport BAS préparé (13 septembre) :** éditeur → repository → HTTP raccordés et testés par interception réseau, sans session de production ni repli vers ses routes. 80 contrôles ciblés et 12 contrôles du contrat réussis. Nouveau workflow BAS inactif livré hors Git ; import manuel puis recette n8n réelle encore nécessaires. [Bilan](COLLECTION_PARCOURS_PERSISTANCE_2026-09-13.md).

**Source n8n corrigée (13 septembre) :** reprise depuis `Sucrerie/n8n-workflows/G. Sucrerie Dossiers (PROD).json`, désigné comme export actuel. Branche BAS additive préparée ; 69 nœuds et connexions d’origine inchangés, tests de conservation et 12 contrôles du contrat réussis. Ancien candidat autonome abandonné ; aucun import à faire à ce stade. [Bilan](PARCOURS_WORKFLOWS_EXISTANTS_2026-09-13.md).

**Recette n8n isolée — 14 septembre :** fichier de test issu de la branche préparée sur G, quatre nœuds, aucune route de production ni connexion présélectionnée. Six contrôles d’isolation, douze contrôles de contrat et conservation des 69 nœuds de G vérifiés. Import inactif possible ; table durable et recette distante encore ouvertes. Aucun SQL ni appel réseau dans ce lot. [Procédure](RECETTE_N8N_BROUILLONS_2026-09-14.md).

**Import de recette signalé — 14 septembre :** utilisateur : workflow importé. Premier appel réel sans session : HTTP 404, webhook non enregistré ; sauvegarde non essayée. Activation et prérequis BAS restent à vérifier. Preuve Sucrerie : `tests/collection-draft-server/preuves/webhook-2026-09-14.json`.

**Table de brouillons BAS créée avec accord — 14 septembre :** `sucrerie_bas.collection_draft` créée et COMMIT réussi. Nouvelle connexion en lecture seule : quatre colonnes, quatre contraintes, clé étrangère vers `sucrerie_bas.folder`, zéro ligne. Aucune commande de modification de `sucrerie` ; workflow non activé par l’agent. Preuve Sucrerie : `tests/collection-draft-server/preuves/table-bas-2026-09-14.json`. Session/dossier de recette et sauvegarde n8n réelle encore ouverts.

**Recette HTTP réelle réussie — 14 septembre :** huit contrôles via le webhook BAS actif : lecture vide, sauvegarde, relecture intégrale, modification, conflit, autre propriétaire, contenu préservé et expiration. Dossier/session/brouillon fictifs supprimés, nettoyage vérifié. Aucun dépôt/publication ; essai navigateur réel encore ouvert. Preuve Sucrerie : `tests/collection-draft-server/preuves/http-reel-2026-09-14.json`.

**Recette navigateur réelle réussie — 14 septembre :** éditeur connecté au webhook BAS sans interception : clic Enregistrer, navigation/réouverture avec texte et nouvelle étape conservés, conflit réel entre deux onglets avec saisie préservée. Rendu 390 px sans débordement, captures conservées. Huit contrôles HTTP également réussis ; fixtures BAS supprimées et nettoyage vérifié. Aucune session de production utilisée. Preuves Sucrerie : `tests/collection-draft-server/preuves/navigateur-reel-2026-09-14.json` et `http-avec-navigateur-2026-09-14.json`.

**Bibliothèque raccordée en recette BAS — 14 septembre :** bouton Organiser relié au stockage distant par configuration explicite propriétaire/dossier. 83 tests ciblés réussis ; clic depuis la vraie bibliothèque, sauvegarde et reprise via n8n réel vérifiés sur listes fictives. Nettoyage BAS confirmé. Aucun raccordement automatique du compte de production ; connexion BAS utilisateur encore à intégrer. [Bilan](BIBLIOTHEQUE_BROUILLON_2026-09-14.md).

**Correction de l’aperçu utilisateur — 14 septembre :** bouton absent dans l’onglet ouvert malgré la présence du code. Versionnement du script principal et du module bibliothèque ; rechargement avec URL actualisée : bouton visible dans la collection sélectionnée. Ouverture, enregistrement local et réouverture vérifiés dans l’aperçu utilisateur, deux activités conservées. Aucune écriture serveur ni publication. La sauvegarde de cet onglet est locale ; ne pas la présenter comme une connexion BAS ou une persistance de production.

**Barre de collection responsive — 14 septembre :** adaptation à la largeur utile du panneau, commandes non comprimées, une ou deux rangées, renommage/téléchargement accessibles au menu sur largeur réduite. Organiser en parcours ajouté au clic droit et au menu ⋯. Onze largeurs 320–1440 px contrôlées sans débordement ni bouton écrasé ; vérification dans l’aperçu utilisateur à 989 px (barre 604 px). Preuves Sucrerie : `tests/collection-toolbar/preuves/`. Aucun changement de stockage ou de production.

**Export du brouillon développé — 14 septembre :** commande .mbz dans l’éditeur bibliothèque, textes natifs Moodle, étapes et ordre conservés. 87 tests ciblés réussis ; téléchargement réel puis réouverture d’une sonde de 59 fichiers avec ses quatre textes. Import Éléa de ce nouveau lot encore à faire ; pas de publication. [Bilan](EXPORT_BROUILLON_2026-09-14.md).

## Tableau de bord — actualisé le 12 septembre 2026

**27/27 activités traitées côté code et recette locale (100 %). 25/27 clôturées sans réserve de lecteur (92,6 %). Deux corrections natives sont validées localement, mais restent à appliquer et retester dans Éléa : Mots mêlés et Classer les paragraphes.**

Les références Éléa ont toutes été reçues ; les essais récents du livre, de la vidéo et des deux correctifs natifs sont locaux. Ce compteur ne prétend pas que chaque nouveau réglage a été redéposé dans Éléa. Aucun push/déploiement ; ingestion RAG coupée.

| N° | Activité et preuve | Code, sauvegarde, jeu et documents | Réserve restante |
|---|---|---|---|
| 1 | [Graphique](RECETTE_GRAPHIQUE_2026-09-11.md) | Terminé localement | — |
| 2 | [Résumé](RECETTE_RESUME_2026-09-11.md) | Terminé localement | — |
| 3 | [Glisser les mots](RECETTE_GLISSER_MOTS_2026-09-11.md) | Terminé localement | — |
| 4 | [Rédaction](RECETTE_REDACTION_2026-09-11.md) | Terminé localement | — |
| 5 | [Texte à trous](RECETTE_TEXTE_TROUS_2026-09-11.md) | Terminé localement | — |
| 6 | [Marquer les mots](RECETTE_MARQUER_MOTS_2026-09-11.md) | Terminé localement | — |
| 7 | [Vrai/Faux](RECETTE_VRAI_FAUX_2026-09-11.md) | Terminé localement | — |
| 8 | [Choix multiple](RECETTE_CHOIX_MULTIPLE_2026-09-11.md) | Terminé localement | — |
| 9 | [Choix uniques en série](RECETTE_CHOIX_UNIQUES_2026-09-11.md) | Terminé localement | — |
| 10 | [Cartes mémoire](RECETTE_FLASHCARDS_2026-09-11.md) | Terminé localement | — |
| 11 | [Cartes de dialogue](RECETTE_DIALOGUES_2026-09-11.md) | Terminé localement | — |
| 12 | [Dictée](RECETTE_DICTEE_2026-09-11.md) | Terminé localement | — |
| 13 | [Mots mêlés](RECETTE_MOTS_MELES_2026-09-11.md) | Terminé localement | Bibliothèque Éléa à corriger |
| 14 | [Classer les paragraphes](RECETTE_TRI_PARAGRAPHES_2026-09-11.md) | Terminé localement | Bibliothèque Éléa à corriger |
| 15 | [Mots croisés](RECETTE_MOTS_CROISES_2026-09-11.md) | Terminé localement | — |
| 16 | [Glossaire](RECETTE_GLOSSAIRE_2026-09-11.md) | Terminé localement | — |
| 17 | [Quiz mixte](RECETTE_QUIZ_MIXTE_2026-09-11.md) | Terminé localement | — |
| 18 | [Quiz QCM](RECETTE_QUIZ_QCM_2026-09-11.md) | Terminé localement | — |
| 19 | [Quiz Vrai/Faux](RECETTE_QUIZ_VF_2026-09-11.md) | Terminé localement | — |
| 20 | [Glisser-déposer](RECETTE_GLISSER_DEPOSER_2026-09-11.md) | Terminé localement | — |
| 21 | [Frise chronologique](RECETTE_FRISE_2026-09-11.md) | Terminé localement | — |
| 22 | [Image à points interactifs](RECETTE_IMAGE_POINTS_2026-09-11.md) | Terminé localement | — |
| 23 | [Trouver la zone](RECETTE_TROUVER_ZONE_2026-09-11.md) | Terminé localement | — |
| 24 | [Trouver plusieurs zones](RECETTE_TROUVER_PLUSIEURS_ZONES_2026-09-11.md) | Terminé localement | — |
| 25 | [Présentation](RECETTE_PRESENTATION_2026-09-12.md) | Terminé localement | — |
| 26 | [Livre interactif](RECETTE_LIVRE_NATIF_2026-09-12.md) | Terminé localement | — |
| 27 | [Vidéo interactive](RECETTE_VIDEO_NATIVE_2026-09-12.md) | Terminé localement | — |

**Vérification élargie du 12 septembre : 14 369 tests Caramel (42 suites) et 3 098 tests Sucrerie (145 suites), 0 échec après corrections.** [Bilan et limites](VERIFICATION_H5P_2026-09-12.md). [Ce qui change, activité par activité](CHANGEMENTS_H5P_2026-09-12.md). Changelog complété dans les deux dépôts, sans publication.

Derniers lots : Livre `05df42c9` / `7a462ee` ; Vidéo `cb2faf98` / `f5ea80a` (bas / Sucrerie).

- [x] Terminer les 27 éditeurs, prompts et exports avec les preuves décrites par activité.
- [x] Corriger et jouer les deux anomalies dans les bibliothèques locales des deux hôtes.
- [ ] Faire appliquer les correctifs aux bibliothèques Éléa par la maintenance de plateforme, puis rejouer les deux contre-épreuves. [Patch exact et portée](CORRECTIFS_LECTEURS_H5P_2026-09-12.md).
- [ ] Terminer le chantier distinct collection parcours/MoodleTest décrit plus bas ; il n’est pas inclus dans le compteur des 27 H5P.

### Historique des lots — les compteurs ci-dessous sont ceux de leur étape


**Retour utilisateur : 26/26 réexports natifs reçus et comparés.** [Bilan par activité](../tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26/BILAN_RETOURS.md).
- [x] Conserver les 26 archives, les contenus, les semantics principales, les écarts et les SHA-256.
- [x] Repérer une retouche dans **25/26** retours ; le glisser-déposer a été réenregistré sans marqueur repérable et n’est pas à refaire.
- [x] Vérifier les **18 médias sources : tous identiques**, aucun média référencé absent des retours.
- [x] Confirmer le défaut du **n° 23** signalé par l’utilisateur : image mal imbriquée dans la sonde, et message d’erreur visible ignoré par le contrôle d’ouverture.
- [x] Corriger la sonde 23 et vérifier l’image chargée ainsi qu’un vrai clic sur la zone 2 : **1/1**.
- [x] Recevoir le n° 23 corrigé : **RELU dans le titre**, image et zones conservées à l’identique. **La recette manuelle du lot est terminée pour l’utilisateur.**
- [x] Exploiter les champs natifs et retouches reçus pour compléter chaque éditeur, prompt et export ; voir le tableau courant et les deux réserves Éléa.

Le précédent « 26 ouvertures sans erreur » était insuffisant : le n° 23 affichait
« No background image was added ». Le contrôle est renforcé pour détecter ce cas
et vérifier une image chargée ainsi qu’un vrai clic sur la zone correcte.
**25/27 audits effectués ; 23/27 clôturés sans réserve. Deux défauts natifs restent ouverts (Mots mêlés, Classer les paragraphes).**

**Graphique, Résumé, Glisser les mots, Rédaction, Texte à trous, Marquer les mots, Vrai/Faux, Choix multiple, Série de choix uniques, Cartes mémoire, Cartes de dialogue et Dictée sont clôturés : 12/27.** La recette utilisateur des
26 autres activités ne remplace pas leurs compléments de code et documents.

**Graphique clôturé — voir aussi Résumé ci-dessous ; total 12/27 (44,4 %).**
- [x] Champs natifs, contraintes, couleurs, prompts et rendu documentaire complétés dans les deux hôtes.
- [x] Sauvegarde/réouverture Caramel ; sauvegarde/réouverture/annulation Sucrerie ; **12 documents relus** et suite documentaire **135/135**.
- [x] Deux réexports natifs de l’utilisateur reçus : titres modifiés, Chart **1.2.22**, ColorSelector **1.3.1**, tous les champs natifs identiques aux sources.
- [x] Semantics réexportées identiques au vendor local Chart 1.2.33 ; [rapport et preuves](RECETTE_GRAPHIQUE_2026-09-11.md).
- [x] Code local consigné : bas `fc67d6a5`, Sucrerie `00b0858`, sans push.

Le **12/27** mesure les clôtures complètes ; les cinq lots partiels et les 27 références
collectées s’y ajoutent sans être comptés comme activités clôturées. L’estimation
antérieure de 20 % du chantier global n’était pas une mesure de couverture.
Suite : poursuivre **activité par activité** à partir des 26 réexports reçus ; aucune nouvelle collecte manuelle demandée. Collection parcours non commencée.

**Lot Mots mêlés / Classer les paragraphes terminé et commité : bas `4c5995cf`, Sucrerie `26a0f28`.**
Les quatre sondes Éléa sont jouées/réexportées et les douze documents relus, avec
correction de deux défauts DOCX/ODT et du mélange papier. Les contrôles de miroir
sont conformes. Le lot Graphique décrit ci-dessus est désormais clôturé. La collection
parcours n’est pas commencée.

| Indicateur | Avancement vérifié |
|---|---|
| Références natives des 27 H5P | **27/27** importées, modifiées, enregistrées et réexportées ; collecte des bibliothèques terminée |
| Audit exhaustif de toutes les capacités d’une activité | **12/27 clôturées (Graphique, Résumé, Glisser les mots, Rédaction, Texte à trous, Marquer les mots, Vrai/Faux, Choix multiple, Série de choix uniques, Cartes mémoire, Cartes de dialogue et Dictée)** ; ne pas confondre collecte et éditeurs complets |
| Lots de compléments consignés et commités | **5** : cartes ; colonnes du livre ; couverture/progression ; vérification et livre IA ; grilles/tri |
| Dernier lot terminé grilles/tri | Code et prompts dans les deux hôtes ; sauvegarde/réouverture ; **443 assertions / 0 échec** ; **12 documents produits** ; **4/4 sondes Éléa jouées et réexportées** |
| Réexports grilles/tri | **4/4 objets `behaviour` identiques** aux paquets déposés ; titres natifs retouchés retrouvés ; JSON et SHA-256 conservés |
| Collection parcours commune | **Non commencée** ; conception disponible, implémentation après l’audit H5P |
| Production / RAG | Aucun push ni déploiement ; ingestion RAG toujours coupée |

| Lot | Dernière preuve / état | Commits bas / Sucrerie |
|---|---|---|
| Cartes | Audio, options, sauvegarde/réouverture, documents et Éléa | `945fe51a` / `81fc5d4` |
| Colonnes du livre | Éléa 13840, 11 identifiants et deux médias conservés | `e6a07b40` / `51b69d5` |
| Couverture et progression | Éléa 13841/13842, image/vidéo et progression manuelle | `d33ec715` / `75ca19c` |
| Vérification et livre IA | Éléa 13843–13845 ; erreurs IA corrigées ; 42 exports des options | `74fc3e83` / `bc87473` |
| Grilles et tri | Éléa 13846–13849 ; 12 documents relus et corrigés ; contrôles de miroir conformes | `4c5995cf` / `26a0f28` |

### Prochaines étapes concrètes du lot actuel

- [x] Jouer les deux variantes du tri : boutons présents/absents, déplacement au clavier, réussite/erreur/corrigé.
- [x] Jouer les deux grilles : horizontal/alphabet Z/liste masquée et vertical/alphabet Q/liste visible ; 3/3 dans chaque cas.
- [x] Modifier dans l’éditeur Éléa, enregistrer, réexporter et comparer les quatre objets de comportement. Preuves : [`grilles-tri/`](../tests/sonde-parcours/audit-activites-2026-09-11/grilles-tri).
- [x] Produire les 12 documents ; relire visuellement les quatre pages des deux PDF Caramel.
- [x] Relire les énoncés/corrigés DOCX/ODT/PDF des deux hôtes ; conserver les 12 documents et les captures utiles.
  - **Collision d’images DOCX corrigée et rééprouvée** : la fiche élève montrait la grille corrigée. Les deux images sont désormais distinctes dans les deux hôtes ; fichiers régénérés et relus. ODT/PDF n’étaient pas affectés.
  - **Numérotation corrigée et relue** : le corrigé du tri affichait quatre fois « 1. » dans DOCX/ODT. Les positions 1–4 sont conservées. Le mélange évite également de livrer un ordre déjà résolu.
- [x] Contrôler 50 fichiers communs, 328 contraintes, 1 078 clés dans les 12 locales Sucrerie ; régénérer le manifeste.
- [x] Commiter le lot dans les deux branches : bas `4c5995cf`, Sucrerie `26a0f28`, sans push.
- [ ] Poursuivre les champs encore manquants, notamment le média de consigne du tri et les mots non latins, puis les autres activités.

Ce tableau est actualisé **après chaque étape significative**, sans attendre un
commit. Les cases détaillées ci-dessous gardent la distinction entre une capacité
éprouvée et la clôture exhaustive d’une activité.


### Résumé clôturé — deuxième activité complète

Commits : bas `929f55aa` / Sucrerie `144acfc`.

- [x] Champs natifs, identifiants, limites et prompts complétés ; 24 assemblages de prompts vérifiés dans 12 langues.
- [x] Sauvegarde/réouverture Caramel et Sucrerie ; annulation Sucrerie ; indice RELU conservé.
- [x] Jeu local natif depuis le paquet Sucrerie : indice, mauvaise réponse, progression, résultat **1/2**.
- [x] **12 documents DOCX/ODT/PDF relus**, autonome et embarqué ; lettres énoncé/corrigé cohérentes.
- [x] Référence Éléa native 1.10.32 réenregistrée et réexportée par l’utilisateur. [Rapport et preuves](RECETTE_RESUME_2026-09-11.md).

**12/27 activités clôturées (44,4 %) : Graphique, Résumé, Glisser les mots, Rédaction, Texte à trous, Marquer les mots, Vrai/Faux, Choix multiple, Série de choix uniques, Cartes mémoire, Cartes de dialogue et Dictée. Suivant : Mots croisés.**

### Glisser les mots — clôturé, troisième activité complète

- [x] Ajouter les fiches par mot : indice et retours correct/incorrect, sérialisés dans la grammaire native.
- [x] Ajouter le média de consigne image/audio/vidéo, préserver le natif et permettre son retrait explicite.
- [x] Sauvegarde/réouverture Caramel ; sauvegarde/réouverture/annulation et suppression du média Sucrerie pour les trois variantes.
- [x] Produire 18 documents ; vérifier les indices dans l’énoncé et les retours dans le corrigé, aussi dans les trois conteneurs.
- [x] Relire les 18 documents ; jouer les trois variantes natives (erreur puis 2/2, audio/vidéo, options) ; 202 assertions et 22 contrôles de conservation réussis. [Rapport](RECETTE_GLISSER_MOTS_2026-09-11.md).

Commits Glisser les mots : bas `1b8ffe6f`, Sucrerie `dba54f5`, sans push.

### Rédaction — clôturée, quatrième activité complète

- [x] Compléter les réglages natifs des mots-clés, les médias et les seuils ; sauvegardes/réouvertures dans les deux hôtes, jeu natif avec erreur puis 2/2 et 18 documents relus. [Preuves](RECETTE_REDACTION_2026-09-11.md).

Commits Rédaction : bas `806f7a5b`, Sucrerie `53fe0e4`, sans push.

### Texte à trous — clôturé, cinquième activité complète

- [x] Consigne, médias, dialogues, comportements, variantes/indices et prompts complétés ; sauvegardes/réouvertures, 2/2 dans les deux modes natifs et 12 documents relus. [Preuves](RECETTE_TEXTE_TROUS_2026-09-11.md).

Commits Texte à trous : bas `81314188`, Sucrerie `afa583b`, sans push.

### Marquer les mots — clôturé, sixième activité complète

- [x] Médias natifs, options et prompts complétés ; sauvegardes/réouvertures, jeu natif 2/2 et 12 documents relus. [Preuves](RECETTE_MARQUER_MOTS_2026-09-11.md).

Commits Marquer les mots : bas `11a439ed`, Sucrerie `614a352`, sans push.

### Vrai/Faux — clôturé, septième activité complète

- [x] Médias, dialogues, retours et prompts complétés ; sauvegardes/réouvertures, 1/1 dans les deux modes natifs et 12 documents relus. [Preuves](RECETTE_VRAI_FAUX_2026-09-11.md).

Commits Vrai/Faux : bas `04b7ac76`, Sucrerie `0c00b62`, sans push.

### Choix multiple — en cours

- [ ] Compléter les capacités natives de MultipleChoice et leur recette dans les deux hôtes.



## Où en sommes-nous ?

**L’audit exhaustif et les compléments des 27 activités H5P ne sont pas terminés.**
Les activités existantes ont été testées sur leurs exemples et leurs champs déjà
exposés. L’inventaire des possibilités natives a ensuite révélé des capacités à
compléter. Plusieurs corrections sont livrées ; les cases de clôture ci-dessous
restent ouvertes jusqu’à la vérification complète de chaque activité.

**Sucrerie sait déjà traiter un MBZ de parcours complet sur sa branche de
développement. L’interface commune « collection parcours » reste à construire.**
Le lecteur de cours actuel et la proposition de nouvelle interface sont deux états
différents ; les tests du premier ne valident pas la seconde.

| Chantier | État concret |
|---|---|
| Atelier de parcours Caramel | Implémenté et consolidé ; recettes finales en plateforme encore ouvertes |
| Images WebP et questions numériques mal encodées | Correctifs réalisés ; sonde importée et essayée dans Éléa |
| H5P : inventaire depuis les bibliothèques | 27 activités, 59 bibliothèques référencées ; qualification complète à poursuivre |
| H5P : éditeur, sauvegarde, documents | Corrections ciblées réalisées ; compléments activité par activité à terminer |
| Test Moodle | Six familles prises en charge ; autres types demandés à intégrer |
| Sucrerie : cours MBZ complet | Dépôt, lecteur, réédition ciblée et documents implémentés ; validation du service réel à terminer |
| Sucrerie : collection parcours et aide IA | Modèle/lecteurs communs réalisés ; persistance v3, commandes et IA encore ouvertes |

Une case cochée signifie que **l’action précisément décrite** est réalisée. Elle
n’annonce ni un déploiement en production ni une couverture de tous les cas voisins.
Les rapports plus anciens restent des journaux de leurs lots ; ce fichier donne
l’état d’ensemble, y compris les demandes ajoutées ensuite.

## Déjà réalisé

- [x] Passer Caramel en 7.0.0 et documenter le parcours dans le changelog, le README et le wiki.
- [x] Intégrer le parcours au formulaire habituel : pas de défilement automatique au choix d’un mode vide, carte de saisie conservée, étapes visuellement harmonisées.
- [x] Ajouter relecture, édition, aperçu, reprise du scénario JSON et retouches des étapes ; conserver le contenu après enregistrement.
- [x] Corriger les zones de texte trop hautes/coupées, les séparations des panneaux, le double dialogue d’annulation et les sauts visuels des exports signalés.
- [x] Demander la vidéo ou l’image dans la carte concernée avant génération, avec les outils de l’activité individuelle.
- [x] Proposer un fond personnel pour la carte de progression et convertir les formats d’image courants ; carte et ouverture progressive facultatives, décochées par défaut.
- [x] Convertir réellement le WebP en PNG compatible H5P, avec extension, MIME et contenu concordants ; traiter aussi les anciens scénarios au packaging.
- [x] Corriger les questions numériques contenant à tort de la syntaxe Cloze ; préserver réponses, zéro, tolérances et crédits partiels.
- [x] Corriger plusieurs pertes de réglages dans l’éditeur et les processeurs : retours Vrai/Faux, mode QCM, mélange QuizSet, glossaire, réglages de Rédaction et de Présentation.
- [x] Ajouter les mots supplémentaires de « Glisser les mots », seuls et imbriqués ; les conserver dans les paquets et les documents.
- [x] Compléter les corrigés papier de « Rédaction » : réponse modèle, variantes, points et retours par mot-clé.
- [x] Propager ces compléments dans Sucrerie et contrôler les fichiers communs ainsi que les traductions dans les 12 langues, breton compris.
- [x] Importer et essayer dans Éléa la sonde images/Test ; les images converties sont reconnues et les six familles Test ont été exercées.
- [x] Écrire l’inventaire des capacités natives et les outils pour générer les sondes H5P et comparer les réexports Éléa.
- [x] Ajouter une première aide parcours au tutoriel et à Caramelia ; ingérer les 36 fiches multilingues initiales le 10 septembre. Le workflow a ensuite été coupé à la demande de l’utilisateur.

## 1. Établir les références Éléa actuelles

Référence déjà présente : bibliothèques récupérées dans Éléa **fin août**, précision
confirmée par l’utilisateur. Leurs `library.json` et `semantics.json` sont disponibles
dans `js/vendor/h5p-libs/` et servent déjà à l’audit local.

Les H5P produits par Caramel contiennent les données, mais pas les bibliothèques.
Les réexporter depuis Éléa permet de récupérer les bibliothèques réellement utilisées
sur la plateforme et de vérifier leurs champs, leurs versions et leurs dépendances.

- [x] Reprendre Google Chrome et retrouver le cours bac à sable **794**, dont la manipulation est autorisée ; l’utilisateur a installé l’extension et indiqué être authentifié. Vérifier la session au moment de reprendre, sans présumer qu’elle a expiré.
- [x] Générer un lot couvrant les 27 activités, le déposer dans Éléa par les moyens disponibles, puis récupérer les H5P réexportés avec leurs bibliothèques.
- [x] Comparer versions **et contenu des semantics** avec le vendor local ; consigner les écarts. Le script de comparaison de versions seul ne prouve pas l’égalité des champs.
- [x] Résoudre la référence `H5P.Row 1.3` sur preuve native : Row/RowColumn 1.3.0 intégrés, éditeur et exports éprouvés dans la sonde Éléa 13840.
- [x] Conserver dans le dépôt les rapports et les exemples anonymisés utiles à la reproduction ; indiquer les références des bibliothèques et la date de collecte.

Preuve du lot : [collecte et recette cartes](RECETTE_H5P_CARTES_2026-09-11.md).
Les 27 titres retouchés sont présents dans les réexports, avec 89 bibliothèques,
10 écarts de version corrective et 2 écarts de semantics. Row et RowColumn 1.3.0
ont été récupérés dans une variante native du livre puis intégrés et éprouvés ; voir le lot colonnes ci-dessous.

Les sondes de collecte peuvent employer des médias de remplacement, notamment du
silence pour la Dictée. Elles révèlent les bibliothèques ; elles ne valident pas une
vraie dictée ni les fonctions pédagogiques de chaque activité.

## 2. Compléter chaque activité H5P

Chaque ligne est une **case de clôture complète**, et non une affirmation que
l’activité ne fonctionne pas aujourd’hui. Les points cités sont les premières
capacités à vérifier/compléter ; ils ne remplacent pas la lecture de tous les champs
natifs, y compris dans les sous-activités. Détails et versions dans
[la matrice des capacités](AUDIT_CAPACITES_H5P.md).

- [x] **Frise chronologique — Timeline** : fond, miniatures, zoom initial et hauteur ; médias/crédits jusqu’aux documents.
- [x] **Cartes mémoire — Flashcards** : images vides, libellés, indices, réglages, sauvegardes, jeu et 12 documents ; [preuves](RECETTE_FLASHCARDS_2026-09-11.md).
- [x] **Questionnaire — QuizSet** : introduction, retour arrière, tirage d’un sous-ensemble, fin du quiz et tous les réglages des sous-questions.
- [x] **Questionnaire QCM — QuizSetQCM** : mêmes réglages de conteneur, options QCM cohérentes entre activité seule et imbriquée.
- [x] **Questionnaire Vrai/Faux — QuizSetVF** : mêmes réglages de conteneur, retours et reprise des sous-questions.
- [x] **Glossaire — Glossary / Accordion** : vérifier les autres contenus natifs des panneaux et leur réédition, au-delà des définitions textuelles.
- [x] **Mots croisés — Crossword** : mot solution, placement imposé, indices médias, grille et corrigé documentaire.
- [x] **Rédaction — Essay** : réglages natifs, médias, prompts, sauvegardes, jeu et 18 documents ; [preuves](RECETTE_REDACTION_2026-09-11.md).
- [x] **Résumé — Summary** : champs natifs, limites, prompts, sauvegardes/réouvertures, jeu natif et 12 documents ; [preuves](RECETTE_RESUME_2026-09-11.md).
- [x] **Glisser les mots — DragTheWords** : indices/retours par mot, médias, prompts, sauvegardes, jeu et 18 documents ; [preuves](RECETTE_GLISSER_MOTS_2026-09-11.md).
- [x] **Glisser-déposer — DragAndDrop** : retours/indices des zones, dépôt unique, répétition d’étiquettes, visibilité des labels et sauvegarde du placement.
- [x] **Texte à trous — FillInTheBlanks** : champs natifs, prompts, sauvegardes, jeu et 12 documents ; [preuves](RECETTE_TEXTE_TROUS_2026-09-11.md).
- [x] **Marquer les mots — MarkTheWords** : médias, options, prompts, sauvegardes, jeu et 12 documents ; [preuves](RECETTE_MARQUER_MOTS_2026-09-11.md).
- [x] **Vrai/Faux — TrueFalse** : médias, dialogues, retours, prompts, sauvegardes, jeu et 12 documents ; [preuves](RECETTE_VRAI_FAUX_2026-09-11.md).
- [x] **Choix multiple — MultipleChoice** : médias, dialogues, modes, seuils, sauvegardes, jeu et 12 documents ; [preuves](RECETTE_CHOIX_MULTIPLE_2026-09-11.md).
- [ ] **Mots mêlés — FindTheWords** : nettoyage Unicode corrigé, huit orientations, éditeurs, prompts et documents éprouvés. Jeu 4/4 ; limite native de pointage documentée. [Recette](RECETTE_MOTS_MELES_2026-09-11.md).
- [ ] **Classer les paragraphes — SortParagraphs** : options doublons/déplacement et documents éprouvés ; média de consigne et contre-épreuve des doublons non interchangeables à terminer.
- [x] **Choix unique en série — SingleChoiceSet** : identifiants, délais, limites, ordre papier, sauvegardes, jeu et 12 documents ; [preuves](RECETTE_CHOIX_UNIQUES_2026-09-11.md).
- [x] **Cartes de dialogue — DialogCards** : audio, confirmation, progression, sauvegardes, jeu et 12 documents ; [preuves](RECETTE_DIALOGUES_2026-09-11.md).
- [x] **Dictée — Dictation** : sources audio, segmentation, RTL natif, variantes, téléversement et synthèse réelle vérifiés. [Recette](RECETTE_DICTEE_2026-09-11.md).
- [x] **Graphique — Chart** : champs natifs, valeurs/couleurs, sauvegarde/réouverture dans les deux hôtes, légendes et données relues dans les trois formats ; deux réexports Éléa conformes. [Preuves](RECETTE_GRAPHIQUE_2026-09-11.md), code `fc67d6a5` / `00b0858`.
- [x] **Présentation — CoursePresentation** : formulaire natif 1.27, médias, commentaires, placements et sous-exercices ; sauvegarde/réouverture et recette terminées. [Preuves](RECETTE_PRESENTATION_2026-09-12.md).
- [x] **Livre interactif — InteractiveBook** : couverture, progression, reprise, blocs et réglages natifs ; [recette et preuves](RECETTE_LIVRE_NATIF_2026-09-12.md).
- [x] **Vidéo interactive — InteractiveVideo** : formulaire natif, affiche/bouton, sources, sous-titres, signets et soumission ; [preuves](RECETTE_VIDEO_NATIVE_2026-09-12.md).
- [x] **Image interactive — ImageHotspots** : couleur/icône par point, plein écran et conservation des médias de chaque point.
- [x] **Trouver la zone — FindTheHotspot** : fond, géométrie, retours et correction graphique dans les documents.
- [x] **Trouver les zones — FindMultipleHotspots** : nombre de zones, géométrie, retours, fond et correction graphique dans les documents.

### Lot cartes réalisé le 11 septembre

- [x] Conserver l’audio des DialogCards et les crédits d’image dans les processeurs.
- [x] Ajouter les commandes natives de progression/navigation des DialogCards, la saisie avant solution Flashcards et les délais SingleChoiceSet.
- [x] Enregistrer/rouvrir les cartes et médias dans Caramel ; vérifier les vrais paquets et le décodage du WAV parlé.
- [x] Corriger les annexes, images et alignements recto verso DOCX/ODT/PDF ; produire les 12 documents et relire les pages des cartes.
- [x] Exercer deux générations IA autorisées sur bas ; conserver prompts et sorties avec les nouveaux réglages.
- [x] Restaurer les quatre sondes, interagir, modifier/enregistrer dans Éléa puis réexporter ; contrôler audio, indices et valeurs natives.
- [x] Reporter le lot dans Sucrerie ; vérifier édition, sauvegarde, réouverture, décodage audio et annulation réelle des retouches avec persistance simulée.
- [x] Vérifier les 50 fichiers partagés et les 1 047 clés des 12 locales.

Commits locaux : **bas `945fe51a`**, **Sucrerie `81fc5d4`**, tous deux sur `emmanuel`, sans push.
[Compte rendu, fichiers de preuve et limites](RECETTE_H5P_CARTES_2026-09-11.md).
Ces cases décrivent le lot ; les clôtures complètes des activités restent ouvertes.
Le service de dépôt Sucrerie et la voie PDF distante ne sont pas validés par les tests locaux.

### Lot colonnes réalisé le 11 septembre

- [x] Intégrer Row/RowColumn natifs et proposer une à quatre colonnes avec largeur réglable.
- [x] Préserver les sous-contenus et médias dans Sucrerie ; corriger les chemins de retouche imbriqués et l'affichage du texte alternatif.
- [x] Exercer deux sauvegardes Caramel, réouverture, aperçu H5P et retouche/annulation Sucrerie ; vérifier 11 identifiants et deux médias.
- [x] Produire et relire DOCX/ODT/PDF dans chaque hôte, avec indices et correction ; corriger la page blanche DOCX et les groupes de choix PDF.
- [x] Jouer la sonde Éléa 13840, retoucher/enregistrer dans l'éditeur natif puis comparer son réexport.
- [x] Reporter les champs, les contraintes et les 12 prompts/traductions dans le même lot.
- [ ] Exercer une génération IA contenant les colonnes, les commandes d'ajout/suppression/réordre et les services en ligne.

[Preuves et limites du livre à colonnes](RECETTE_LIVRE_COLONNES_2026-09-11.md).
La clôture complète du livre reste ouverte. Commits locaux : **bas `e6a07b40`**, **Sucrerie `51b69d5`**, sans push.

### Lot couverture et progression du 11 septembre

- [x] Proposer une couverture image ou vidéo, son affiche et ses commandes ; conserver le média lors d'une désactivation de la couverture.
- [x] Exposer la progression automatique/manuelle et la reprise ; accepter le contrat natif de 1 à 50 pages, avec une page réellement exercée.
- [x] Réparer la réhydratation vidéo Sucrerie, le changement de type de média, les champs conditionnels et l'ouverture de la couverture au clavier.
- [x] Enregistrer/rouvrir les paquets, lire la vidéo réhydratée, annuler une retouche ; générer et relire les 12 documents des deux hôtes.
- [x] Jouer les sondes Éléa 13841 et 13842, valider les pages manuellement, retoucher/enregistrer puis réexporter ; médias et identifiants conservés.
- [x] Reporter le code, les contraintes, les prompts et les traductions des 12 langues dans le même lot.
- [x] Exercer la sonde IA livre autorisée, la relire/corriger et jouer le paquet dans Éléa 13843 ; voir le lot suivant.
- [ ] Compléter les autres variantes natives et les services en ligne.

[Compte rendu et décisions par champ](RECETTE_LIVRE_COUVERTURE_2026-09-11.md).
Commits locaux : bas `d33ec715`, Sucrerie `75ca19c`, sans push. La clôture complète du livre reste ouverte.

### Lot vérification et livre IA du 11 septembre

- [x] Exposer les options natives de vérification des QCM, Vrai/Faux, textes à trous et mots à sélectionner, seuls et dans les trois conteneurs.
- [x] Corriger la sauvegarde des options/retours Blanks, la détection MarkTheWords natif et la conservation des identifiants des exercices de présentation dans Sucrerie.
- [x] Exercer sept sauvegardes/réouvertures dans chaque hôte, 42 exports, puis les variantes opposées dans Éléa 13844/13845 ; modification native, sauvegarde et réexport avec options et cinq identifiants conservés.
- [x] Réaliser le troisième essai IA autorisé ; constater ses erreurs pédagogiques, les corriger dans le formulaire et jouer/réexporter le livre corrigé dans Éléa 13843, six identifiants conservés.
- [x] Supprimer le doublon de consigne dans les documents du livre/de la présentation et reporter les prompts/traductions dans les 12 langues.
- [ ] Retester les prompts renforcés avec une nouvelle autorisation IA ; compléter les médias/options restantes, le dépôt en ligne et le PDF distant.

[Compte rendu, décisions par champ et preuves](RECETTE_VERIFICATION_2026-09-11.md).
192 assertions navigateur et 64 cas d’adaptateurs natifs réussis. Les 27 clôtures
complètes restent ouvertes. Commits locaux : bas `74fc3e83`, Sucrerie `bc87473` ; aucun push.

### Lot grilles et tri du 11 septembre

- [x] Ajouter les options de doublons/déplacement, alphabet/chevauchement ; conserver les huit orientations et refuser les combinaisons impossibles.
- [x] Sauvegarder/rouvrir dans les deux éditeurs, annuler une retouche Sucrerie et produire 12 documents.
- [x] Jouer les variantes opposées dans Éléa 13846–13849 ; modifier/enregistrer/réexporter et comparer les quatre contenus et comportements.
- [x] Corriger les images DOCX élève/corrigé, la numérotation DOCX/ODT, le nombre de mots uniques et le mélange du tri papier ; relire les rendus.
- [x] Reporter les prompts/traductions et contrôler les fichiers communs ; 443 assertions réussies.
- [ ] Compléter média de consigne du tri, écritures non latines, autres limites et service réel Sucrerie.

[Compte rendu et preuves](RECETTE_GRILLES_TRI_2026-09-11.md). Commits locaux : bas `4c5995cf`, Sucrerie `26a0f28` ; aucune clôture exhaustive déduite de ce lot.

### Ce qui permet de cocher une activité

Pour chaque champ natif, consigner une décision : éditable et vérifié, piloté
automatiquement, préservé à l’import sans commande d’édition, non pertinent pour
l’auteur, ou à implémenter. Un champ utile manquant reste à faire ; le classer ne
suffit pas à le clôturer. Les réglages techniques de lecture ne doivent pas devenir
du texte parasite sur une fiche élève.

Le compte rendu de chaque activité doit démontrer ces étapes :

1. Relire les semantics et les sous-bibliothèques ; compléter les champs utiles avec une interface courte et des options avancées repliées.
2. Adapter le prompt structurant et ses exemples, puis exercer une génération IA représentative quand le schéma change.
3. Modifier les valeurs dans le vrai formulaire, enregistrer, rouvrir, modifier de nouveau, annuler ; tester les widgets médias et la navigation rapide.
4. Ouvrir le paquet final et vérifier les données et les fichiers, en activité seule et dans les conteneurs qui la proposent.
5. Produire DOCX, ODT et PDF après retouche ; ouvrir les documents, vérifier le rendu et séparer feuille élève/corrigé. Contrôler aussi la voie PDF distante quand elle est employée.
6. Importer/relire/réexporter dans Éléa les cas représentatifs, avec interaction réelle lorsque le comportement dépend de la plateforme.
7. Reporter le lot dans Sucrerie : dépôt, aperçu, édition, sauvegarde et exports ; traductions des deux hôtes dans les 12 langues.
8. Ajouter des régressions ciblées pour les bugs corrigés, sans multiplier les jobs CI ; noter fichiers de preuve et commits des deux dépôts.

## 3. Étendre l’activité Test Moodle

Les six familles actuelles sont QCM, Vrai/Faux, appariement, réponse courte,
numérique et Cloze. **Les autres familles demandées restent dans le chantier.**
Le H5P « Rédaction » ne remplace pas une question Moodle « Composition ».

- [x] Récupérer localement `sonde-test-export-elea-2026-09-11.mbz` ; copie conservée sous `tests/sonde-parcours/audit-activites-2026-09-11/reference-test-elea.mbz`.
- [ ] Rééditer ce Test natif et le restaurer de nouveau.
- [ ] Compléter les unités numériques et les pièces jointes des questions natives ; conserver banques, fichiers et identifiants.
- [ ] Ajouter **Description** et **Composition** : contenu informatif, réponse ouverte, formats, pièces jointes et correction manuelle.
- [ ] Ajouter **Sélectionner les mots manquants** et **Glisser-déposer sur texte** : groupes de choix, trous, doublons, mélange et corrections.
- [ ] Ajouter **Classement** avec le contrat et la notation du plugin réellement installé.
- [ ] Ajouter **Calculée, Calculée simple et QCM calculé** : formules, jeux de valeurs, unités, tolérances et arrondis.
- [ ] Ajouter **Appariement aléatoire à réponse courte** avec ses dépendances à la banque et à la catégorie.
- [ ] Ajouter **Glisser-déposer sur image** et **Marqueurs à glisser-déposer** : médias, zones, bonnes réponses et correction graphique.
- [ ] Qualifier puis intégrer **Enregistrement audio/vidéo, Formules et STACK** selon les plugins réellement disponibles ; documenter toute dépendance plateforme.
- [ ] Qualifier la conservation/import de **GeoGebra** ; priorité basse acceptée par l’utilisateur, sans bloquer le reste sur ce type.

Chaque extension suit génération → éditeur → sauvegarde/réouverture → aperçu →
XML/MBZ → documents → restauration réelle → miroir Sucrerie. Les types non encore
gérés restent signalés explicitement à l’import, sans suppression silencieuse.

## 4. Construire la collection parcours dans Sucrerie

La checklist d’implémentation propre à Sucrerie est dans
[`SUIVI_COLLECTIONS_PARCOURS.md`](../../sucrerie.forge.apps.education.fr/SUIVI_COLLECTIONS_PARCOURS.md)
dans le dépôt voisin. La conception détaillée est dans son
[`docs/CONCEPTION_COLLECTION_PARCOURS.md`](../../sucrerie.forge.apps.education.fr/docs/CONCEPTION_COLLECTION_PARCOURS.md).

- [x] Implémenter la conservation intégrale du cours MBZ, son plan, ses textes, l’édition ciblée d’un H5P/Test et les documents.
- [ ] Donner à une collection ordinaire et à un MBZ importé **la même interface de plan**, avec étapes et consignes facultatives, sans imposer une collection contenant une seule carte « Parcours ».
- [ ] Persister les textes des collections ordinaires et préparer leur compatibilité avec les collections existantes.
- [ ] Achever les allers-retours réels : pont Caramel, dépôt direct Sucrerie, édition, export, restauration Éléa ; valider aussi les contraintes du service de dépôt.
- [ ] Ajouter l’aide IA facultative à la structuration, puis l’ajout de questions dans l’éditeur commun, avec proposition relue et annulation.

## 5. Terminer la recette et l’aide

- [ ] Restaurer les parcours relus sur les instances ciblées Éléa, Magistère et Moodle ; documenter les versions et résultats sans généraliser un essai Éléa aux autres plateformes.
- [ ] Vérifier en plateforme la carte de progression, le fond personnel et le déblocage successif des étapes ; les deux options restent désactivées par défaut.
- [ ] Poursuivre le calibrage des formats de parcours sur des usages enseignants représentatifs et faire relire les parcours d’essai. Les repères ABC Learning Design peuvent rester discrets, seulement là où ils aident.
- [ ] Faire relire les textes bretons par des bretonnants ; parité des clés ne signifie pas validation linguistique humaine. La synthèse vocale bretonne reste indisponible dans le service actuel.
- [ ] Actualiser tutoriel, wiki, exemples et connaissances Caramelia après les prochains compléments ; vérifier les réponses du chatbot sur les nouveaux usages.
- [ ] Préparer les ajouts RAG dans les 12 langues. **Ne pas réactiver ni relancer l’ingestion**, actuellement coupée, sans nouvelle instruction de l’utilisateur.

## Reprendre le travail sans l’historique de conversation

**Prochain lot concret :** poursuivre les cas restants des lots cartes et livre
(colonnes, couverture et progression), puis les capacités manquantes des autres H5P. Les 27 références Éléa sont collectées et comparées ; ne pas refaire
leur collecte globale. Row/RowColumn disposent désormais de références natives. Chaque correction est reportée dans
Sucrerie dans le même lot. La conception collection parcours se réalise ensuite par
étapes testables ; elle ne doit pas être annoncée terminée à partir du seul lecteur MBZ.

Travailler dans `bas`, lire `CLAUDE.md` et les skills correspondant aux fichiers
touchés ; lire aussi `CLAUDE.md` dans Sucrerie avant son adaptation. Utiliser la
branche `emmanuel` de chaque dépôt, préserver les modifications préexistantes,
faire des commits lisibles. Aucune modification de `main`, aucun déploiement ou
changement de production n’est demandé. Le Mac a déjà été mis en veille pour la
nuit précédente ; cette ancienne instruction n’est pas à rejouer à la prochaine reprise.

Le bac à sable Éléa autorisé est le cours `794` sur
`https://test03.elea.apps.education.fr`. Google Chrome est le navigateur indiqué.
Un dépôt de fichier seul ne vaut pas restauration : suivre l’assistant jusqu’au
message final, puis ouvrir l’activité. La session et les téléchargements sont à
vérifier via les outils disponibles ; ne pas considérer l’ancien blocage Brave
comme un échec actuel de Chrome. Aucun identifiant ni secret n’a sa place dans ce fichier.

### Outils et preuves disponibles

À lancer depuis `bas`, selon le lot ; ne pas refaire tous les bancs pour une simple
modification de documentation :

```sh
node scripts/inventorier-capacites-h5p.mjs
node scripts/generer-h5p-sonde-elea.mjs
node scripts/comparer-export-elea.mjs /chemin/vers/les/h5p-reexportes
node scripts/auditer-paquets-h5p.mjs
node scripts/auditer-champs-h5p.mjs
node tests/run_browser_suite.mjs --suite=document-export,editor-activities
node tests/run_h5p_capabilities_documents.mjs --all
```

- Sonde durable : [`sonde-images-test.mbz`](../tests/sonde-parcours/audit-activites-2026-09-11/sonde-images-test.mbz), avec les rapports [`paquets-semantics.json`](../tests/sonde-parcours/audit-activites-2026-09-11/paquets-semantics.json) et [`champs-editeur.json`](../tests/sonde-parcours/audit-activites-2026-09-11/champs-editeur.json).
- [Audit initial](AUDIT_GENERATION_EDITION_2026-09-11.md) : corrections, essais locaux et première restauration réelle ; sa couverture des champs existants n’est pas l’exhaustivité des semantics.
- [Matrice des capacités](AUDIT_CAPACITES_H5P.md) : inventaire, corrections récentes et limites exactes des bancs.
- [Historique parcours](SUIVI_CONSOLIDATION_PARCOURS.md) et [décisions de conception](PRD_PARCOURS.md).
- Les sorties sous `/tmp/caramel-capacites-*` sont **temporaires**. Les régénérer si elles ont disparu ; conserver les nouvelles preuves utiles dans le dépôt.
- Côté Sucrerie, contrôler `diff-editor-vs-caramel.mjs`, `diff-export-vs-caramel.mjs`, `diff-field-constraints.mjs` et `check-shared-i18n.mjs` dans `scripts/`. Le manifeste est la référence des fichiers à recopier ; `field-constraints.js` exige un report ciblé, pas une copie intégrale.

### Dernier lot de code enregistré

| Dépôt | Branche | Commit de référence avant ce suivi |
|---|---|---|
| bas | emmanuel | `945fe51a` — cartes, références Éléa et recettes du 11 septembre |
| Sucrerie | emmanuel | `81fc5d4` — miroir cartes et médias importés |

Les commits du lot cartes ci-dessus sont locaux, sans push. Les résultats globaux ci-dessous proviennent du lot antérieur.
Les derniers contrôles ciblés donnent 172 assertions sans échec ; Sucrerie donne
3 095 tests sans échec. Les 96 documents générés ne représentent pas 96 relectures
visuelles complètes. Le dernier passage global Caramel a révélé 23 échecs dans un
ancien banc d’aperçu ; ce banc a été réparé puis relancé seul, avec 25 contrôles
réussis. Ne pas présenter cela comme un nouveau passage global intégral.

### Journal à tenir pour chaque prochain lot

Ajouter une ligne : **date — capacités réalisées — preuves locales/documents/Éléa —
commit bas — commit Sucrerie — limites restantes**. Cocher ensuite uniquement les
actions démontrées. Le prochain bilan doit commencer par les possibilités nouvelles
pour l’enseignant, puis ce qui reste à faire, plutôt que par un total de tests.

- **11 septembre 2026 — état des lieux** : regroupement des travaux réalisés et restants dans cette checklist et celle de Sucrerie ; aucune nouvelle capacité applicative annoncée par ce lot de documentation.

### Message prêt à copier dans une nouvelle conversation

> Reprends le chantier Caramel dans `bas` et Sucrerie, sur leurs branches `emmanuel`.
> Lis d’abord `bas/docs/SUIVI_H5P_PARCOURS.md`, puis `sucrerie.forge.apps.education.fr/SUIVI_COLLECTIONS_PARCOURS.md`, les `CLAUDE.md` et les skills utiles.
> Poursuis l’audit complet des 27 H5P depuis leurs semantics Éléa : complète réellement l’éditeur, les prompts et les exports, avec sauvegarde/réouverture et essais en plateforme ; ne t’arrête pas à l’inventaire.
> Google Chrome et le cours bac à sable Éléa 794 sont autorisés pour déposer, essayer et réexporter les sondes. Reporte chaque correction dans Sucrerie dans le même lot, puis réalise le modèle de collection parcours décrit dans son suivi.
> Mets à jour les cases avec les preuves et les commits. Préserve la production et laisse l’ingestion RAG coupée.

### Choix multiple — clôturé, huitième activité complète

- [x] Médias, dialogues, libellés, limites natives et prompts complétés dans les deux hôtes.
- [x] Sauvegarde/réouverture ; jeu unique, multiple et barème tout-ou-rien ; 12 documents relus.
- [x] 202 assertions navigateur, conservation native et miroirs conformes. [Rapport](RECETTE_CHOIX_MULTIPLE_2026-09-11.md).

**12/27 clôturées (44,4 %). Prochaine : Mots croisés.**

Commits Choix multiple : bas `60d45a81` / Sucrerie `b431d59`.

### Série de choix uniques — clôturé, neuvième activité complète

- [x] Identifiants, libellés, délais natifs et bornes 2–4 corrigés ; prompts 12 langues.
- [x] Ordre papier corrigé, sauvegarde/réouverture des deux hôtes ; 12 documents relus.
- [x] 202 assertions navigateur sans échec ; 22 contrôles de conservation et 64 adaptateurs Sucrerie.
- [x] Jeu manuel 1/2 et reprise, automatique 2/2. [Rapport et preuves](RECETTE_CHOIX_UNIQUES_2026-09-11.md).

Commits Série de choix uniques : bas `5e918d14` / Sucrerie `da5e0c5`.

### Cartes mémoire — clôturé, dixième activité complète

- [x] Champs natifs et prompts complétés ; blocage du lecteur par image vide corrigé dans les deux hôtes.
- [x] Sauvegardes/réouvertures, indice et règles de saisie joués ; 12 documents relus.
- [x] Régressions et miroirs conformes. [Rapport et preuves](RECETTE_FLASHCARDS_2026-09-11.md).

**12/27 clôturées (44,4 %). Prochaine : Mots croisés.**

Commits Cartes mémoire : bas `d67dd08f` / Sucrerie `63f62d5`.

### Cartes de dialogue — clôturé, onzième activité complète

- [x] Confirmation native éditable en autonome et embarqué ; libellés et médias conservés.
- [x] Sauvegardes/réouvertures des deux hôtes, 24 prompts et 12 documents relus.
- [x] Audio natif lu et navigation normale sans retour arrière vérifiée ; 202 assertions navigateur conformes.
- [x] Deux manches de répétition, remise à zéro annulée puis confirmée. [Rapport et preuves](RECETTE_DIALOGUES_2026-09-11.md).

Commits Cartes de dialogue : bas `87860916` / Sucrerie `87d117f`.

### Dictée — clôturée, douzième activité complète

- [x] Réglages linguistiques, sources et crédits audio, prompts et documents complétés dans les deux hôtes.
- [x] Sauvegardes/réouvertures, téléversement, jeu 7/7, variantes et segmentation vérifiés ; synthèse réelle reçue et lue.
- [x] 12 documents relus, 246 assertions navigateur conformes, miroirs conformes. [Rapport et preuves](RECETTE_DICTEE_2026-09-11.md).

**12/27 clôturées (44,4 %). Prochaine : Mots croisés.**

Commits Dictée : bas `34316c65` / Sucrerie `045ddec`.

### Mots mêlés — audit effectué, réserve native ouverte

- [x] Perte des lettres grecques corrigée ; libellés, mots et réglages conservés dans les deux hôtes.
- [x] 24 prompts, huit orientations, sauvegarde/réouverture et 12 documents relus.
- [x] Deux jeux 4/4 après erreur, solution et reprise ; limite de pointage du lecteur natif explicitée dans le rapport.

**12/27 clôturées (44,4 %). Prochaine : Mots croisés.**

Commits Mots mêlés : bas `55c2a84a` / Sucrerie `69b5313`.

### Classer les paragraphes — code et recette effectués, réserve native ouverte

- [x] Média, texte alternatif, borne minimale et libellés corrigés dans les deux hôtes ; 24 prompts, sauvegardes/réouvertures et 12 documents relus.
- [x] Barèmes joués : positions 4/4 avec reprise, transitions 3/3 sur ouverture neuve.
- [ ] Reprise native en mode transitions : erreur `removeChild` à résoudre/valider. [Rapport](RECETTE_TRI_PARAGRAPHES_2026-09-11.md).

**Bilan corrigé : 14 activités auditées (51,9 %), dont 12 clôturées sans réserve (44,4 %) et 2 avec défauts natifs documentés (Mots mêlés, Classer les paragraphes).** Le précédent total de 13 clôtures incluait la limite de pointage des mots mêlés ; elle est désormais comptée comme réserve ouverte. Prochaine activité : Mots croisés.

Commits Classer les paragraphes : bas `b78d48c4` / Sucrerie `a2df931`.



### Mots croisés — clôturé, treizième activité complète

- [x] Positions fixes, mot-solution, indices multimédias et prompts complétés dans les deux hôtes.
- [x] Sauvegardes/réouvertures, 12 documents relus, quatre variantes jouées et médias lus.
- [x] 1354 assertions navigateur, 22 conservations et 64 adaptateurs conformes. [Rapport](RECETTE_MOTS_CROISES_2026-09-11.md).

**État courant : 15/27 auditées (55,6 %), dont 13/27 clôturées sans réserve (48,1 %). Réserves natives : Mots mêlés et Tri. Prochaine : Glossaire.**

Commits Mots croisés : bas `cb98880c` / Sucrerie `24ff0a4`.

Glossaire en cours : conservation des identifiants et borne de 100 entrées ; correction du prompt JSON et des libellés H2/H3/H4.

### Glossaire — clôturé, quatorzième activité complète

- [x] Perte des panneaux et des identifiants corrigée ; niveaux H2/H3/H4 et prompts cohérents.
- [x] Sauvegardes/réouvertures, clavier natif et douze documents relus ; 202 assertions et contrôles Sucrerie conformes. [Rapport](RECETTE_GLOSSAIRE_2026-09-11.md).

**16/27 auditées (59,3 %), dont 14/27 clôturées sans réserve (51,9 %). Prochaine : Quiz mixte.**

Commits Glossaire : bas `212f36d2` / Sucrerie `1156122`.

Quiz mixte en cours : introduction, tirage, navigation, résultats, vidéos et réglages communs ajoutés dans les deux éditeurs. Tirage papier aligné avec le corrigé ; validations et jeu à effectuer avant clôture.

### Quiz mixte — clôturé, quinzième activité complète

- [x] Introduction, tirage, navigation, résultats, vidéos et libellés natifs complétés dans les deux hôtes.
- [x] Trois modes sauvegardés/réouverts et joués ; 12 documents relus, médias et corrections conservés.
- [x] 202 assertions, 22 conservations et 64 adaptateurs conformes. [Rapport](RECETTE_QUIZ_MIXTE_2026-09-11.md).

**17/27 auditées (63,0 %), dont 15/27 clôturées sans réserve (55,6 %). Prochaine : Quiz QCM.**

Commits Quiz mixte : bas `24b818e3` / Sucrerie `7d5e4e0`.

Quiz QCM en cours : reprise du retour natif mathématique, retouche des rétroactions et vérification des formules dans les exports.

Quiz QCM : sauvegardes/réouvertures et jeu réussis (2/3 puis 3/3 ; reprise désactivée vérifiée). Défaut StarMath des intervalles français corrigé et reporté ; 552 contrôles conformes. Documents en dernière relecture, lot non encore clôturé.

### Quiz QCM — clôturé, seizième activité complète

- [x] Retouches, sauvegardes/réouvertures, formules natives et reprise autorisée/désactivée vérifiées.
- [x] Intervalles StarMath et pagination corrigés dans les deux hôtes ; douze documents relus.
- [x] 552 assertions, 22 conservations et 64 adaptateurs conformes. [Rapport](RECETTE_QUIZ_QCM_2026-09-11.md).

**18/27 auditées (66,7 %), dont 16/27 clôturées sans réserve (59,3 %). Prochaine : Quiz Vrai/Faux.**

Commits Quiz QCM : bas `92ef6bf3` / Sucrerie `a982ded`.

Quiz Vrai/Faux en cours : exemple de racine carrée corrigé (x ≥ 0 implique √(x²) = x) ; recette de la retouche dans les deux éditeurs.

### Quiz Vrai/Faux — clôturé, dix-septième activité complète

- [x] Exemple mathématique corrigé ; titre et rétroactions retouchés dans les deux éditeurs, sauvegardes/réouvertures vérifiées.
- [x] Deux variantes jouées : 2/3 puis 3/3 ; disponibilité du corrigé respectée.
- [x] 24 assemblages de prompts, douze documents relus, 60 contrôles éditeurs et 22 + 64 contrôles Sucrerie conformes.
- [x] [Rapport et preuves](RECETTE_QUIZ_VF_2026-09-11.md).

**19/27 auditées (70,4 %), dont 17/27 clôturées sans réserve (63,0 %). Prochaine : Glisser-déposer.**

Commits Quiz Vrai/Faux : bas `8792329b` / Sucrerie `2dca0f8`.

Glisser-déposer en cours : contrôle de la conservation des identifiants, des options par zone et des réglages natifs ; clôture en attente des recettes.

Glisser-déposer : huit identifiants et indices conservés ; 24 prompts et 12 exports contrôlés, 202 + 22 + 64 contrôles conformes. Jeu clavier 6/8 puis 8/8 et reprise désactivée vérifiés. Complément image / distracteur et relecture finale en cours avant clôture.

### Glisser-déposer — clôturé, dix-huitième activité complète

- [x] Options natives, indices, rétroactions, identifiants et zones de dépôt autorisées complétés dans les deux hôtes.
- [x] Sauvegardes/réouvertures ; image réelle, une zone et distracteur vérifiés. Jeu clavier 6/8 → 8/8, reprise désactivée et distracteur 0/1 → 1/1.
- [x] 24 prompts, douze documents relus ; 202 + 22 + 64 contrôles conformes ; miroirs et traductions conformes.
- [x] [Rapport et preuves](RECETTE_GLISSER_DEPOSER_2026-09-11.md).

**20/27 auditées (74,1 %), dont 18/27 clôturées sans réserve (66,7 %). Prochaine : Frise chronologique.**

Commits Glisser-déposer : bas `c594a732` / Sucrerie `910cba9`.

Frise en cours : hauteur native corrigée ; zoom/langue/fond/vignette ajoutés ; dates de fin, crédits et liens médias conservés dans les exports. Sauvegarde/réouverture et 24 prompts vérifiés dans Caramel, contrôles Sucrerie et navigation native en cours.

### Frise chronologique — clôturée, dix-neuvième activité complète

- [x] Hauteur native corrigée ; zoom, langue, fond et vignette ajoutés ; périodes et dates de fin conservées.
- [x] Sauvegardes/réouvertures et annulation ; lecteur natif 550/800 px, fond décodé et navigation vérifiés.
- [x] 24 prompts, douze documents relus ; 202 + 22 + 64 contrôles conformes ; miroirs et traductions conformes.
- [x] [Rapport et preuves](RECETTE_FRISE_2026-09-11.md).

**21/27 auditées (77,8 %), dont 19/27 clôturées sans réserve (70,4 %). Prochaine : Image à points interactifs.**

Commits Frise : bas `a4623baa` / Sucrerie `690bb99`.

Image à points en cours : options par point et médias ajoutées ; export de tous les blocs corrigé. Sauvegardes/réouvertures et 12 documents contrôlés dans les deux hôtes, 22 + 64 contrôles Sucrerie conformes. Jeu multimédia et relecture visuelle avant clôture.

### Image à points interactifs — clôturée, vingtième activité complète

- [x] Options par point et réglages multimédias complétés ; sauvegardes/réouvertures et identifiants conservés.
- [x] Trois points ouverts/fermés dans deux variantes ; plein écran, image et lectures audio/vidéo vérifiés.
- [x] Export de tous les blocs corrigé ; 24 prompts et douze documents relus, 202 puis 142 contrôles et 22 + 64 Sucrerie conformes.
- [x] [Rapport et preuves](RECETTE_IMAGE_POINTS_2026-09-11.md).

**22/27 auditées (81,5 %), dont 20/27 clôturées sans réserve (74,1 %). Prochaine : Trouver la zone.**

Commits Image à points : bas `bba7661a` / Sucrerie `37efcc3`.

Trouver la zone : image aplatie confirmée, rectangle/cercle et feedback popup/intégré sauvegardés/réouverts dans les deux hôtes ; libellés natifs éditables. 24 prompts et 12 exports contrôlés ; essais de clic et relecture finale en cours.

### Trouver la zone — clôturée, vingt et unième activité complète

- [x] N° 23 corrigé repris ; image aplatie et chargée, formes et feedbacks conservés, libellés natifs éditables.
- [x] Sauvegardes/réouvertures ; clic hors zone 0/1, erreur 0/1, reprise et réussite 1/1 dans deux modes de feedback.
- [x] 24 prompts, douze documents relus ; 60 + 22 + 64 contrôles, miroirs et traductions conformes.
- [x] [Rapport et preuves](RECETTE_TROUVER_ZONE_2026-09-11.md).

**23/27 auditées (85,2 %), dont 21/27 clôturées sans réserve (77,8 %). Prochaine : Trouver plusieurs zones.**

Commits Trouver la zone : bas `47c7c1c7` / Sucrerie `151a82c`.

### Trouver plusieurs zones — clôturé

- [x] Titre interne conservé et éditable ; options, formes, seuil et feedbacks éprouvés dans les deux éditeurs.
- [x] 24 prompts assemblés ; sauvegarde/réouverture et annulation Sucrerie.
- [x] Jeu natif local : hors zone, leurre, double clic sans double point, 2/2 et plafond 1/1 ; référence Éléa utilisateur conservée.
- [x] 12 documents relus, 60 contrôles éditeurs + 22 conservations + 64 adaptateurs ; miroirs conformes.
- [x] [Rapport et preuves](RECETTE_TROUVER_PLUSIEURS_ZONES_2026-09-11.md).

**22/27 clôturées (81,5 %), 24/27 auditées. Suivant : Présentation.** Aucun push ; RAG coupé.

Commits Trouver plusieurs zones : bas `12535ef6` / Sucrerie `69c7279`.

Présentation en cours : ajout du formulaire natif depuis les semantics locales, conservation de la géométrie et des sous-identifiants ; recette à effectuer avant clôture.

Point de recette Présentation (12 septembre) : sauvegarde/réouverture des deux hôtes, retouche de sous-question Sucrerie et annulation validées ; 12 documents produits ; jeu natif 6/7 puis 7/7 après reprise ; 210 contrôles de non-régression, 22 conservations et 65 adaptateurs passés. Dernière relecture et commentaire du corrigé en cours. Arrêt demandé après cette activité.

### Présentation — clôturée le 12 septembre

- [x] Formulaire natif aligné sur les semantics Éléa 1.27 ; placements, commentaires, sous-activités et libellés conservés/éditables dans les deux hôtes.
- [x] Options du modèle de génération et 24 assemblages de prompts complétés ; sauvegarde/réouverture et annulation Sucrerie éprouvées.
- [x] Jeu natif 6/7 puis 7/7 après reprise ; variante sans bilan ; image, audio, vidéo et commentaire du corrigé vérifiés.
- [x] 12 documents relus ; plusieurs exercices par diapositive et pagination corrigés ; 210 contrôles, 22 conservations et 65 adaptateurs conformes.
- [x] [Rapport, limites et preuves](RECETTE_PRESENTATION_2026-09-12.md).

**23/27 clôturées (85,2 %), 25/27 auditées. Arrêt après cette activité à la demande de l’utilisateur.**
Prochaine reprise : Livre interactif, puis Vidéo interactive ; réserves Mots mêlés / Classer les paragraphes ; suites MoodleTest et collection parcours à terminer. Production préservée, RAG coupé.

Commits Présentation : bas **`f9f6c92e`** / Sucrerie **`81afb86`**. Aucun push. Reprise préparée dans le suivi ; arrêt effectif après cette clôture.

### Reprise du 12 septembre — Livre interactif en cours

- [x] Brancher les champs natifs des 35 blocs Column dans les deux éditeurs, préserver les groupes transparents et les identifiants.
- [x] Sauvegarde/réouverture Caramel ; retouche, sauvegarde/réouverture et annulation Sucrerie.
- [x] Livre noté : 1/2 après erreur puis 2/2 après reprise ; variante sans reprise ; progression 100 %, image et vidéo jouées localement.
- [x] Ajouter le téléversement WebVTT et vérifier la piste dans le paquet Caramel.
- [ ] Terminer la lecture effective des sous-titres, la relecture des 12 documents régénérés, les contrôles de miroir et le commit.

Le compteur reste à **23/27** jusqu’à la clôture de ce lot. Aucun nouvel import Éléa revendiqué ; les réexports utilisateur et les recettes plateforme antérieures sont conservés. Production inchangée, RAG coupé.

### Livre interactif — clôturé le 12 septembre

- [x] Terminer le formulaire natif et son accès depuis le livre généré, pistes WebVTT comprises ; report dans Sucrerie.
- [x] Sauvegarder/rouvrir, annuler dans Sucrerie, vérifier 1/2 puis 2/2 après reprise et la variante sans reprise.
- [x] Lire les sous-titres natifs et relire les 12 documents ; 217 assertions, 22 conservations, 65 adaptateurs et 52 fichiers partagés conformes.
- [x] Archiver les paquets, captures, rapports et empreintes : [recette](RECETTE_LIVRE_NATIF_2026-09-12.md).

**24/27 clôturées (88,9 %), 26/27 auditées.** Prochaine activité : Vidéo interactive. Restent ensuite les réserves natives Mots mêlés / Classer les paragraphes. Aucun push ; production préservée, RAG coupé.

Commits Livre interactif : bas **`05df42c9`** / Sucrerie **`7a462ee`**. Vidéo interactive en cours.

### Vidéo interactive — en cours le 12 septembre

- [x] Formulaire natif 1.28 : interactions, placements, durée, adaptativité, signets, écrans de fin et résumé ; report Sucrerie.
- [x] Pistes WebVTT et plusieurs sources vidéo avec libellés de qualité ; conservation après deux sauvegardes.
- [x] Retouche, sauvegarde/réouverture et annulation Sucrerie ; douze documents produits.
- [ ] Terminer le jeu des modes affiche/bouton, la lecture des sous-titres, la qualité vidéo, les exports des interactions complémentaires et les contrôles de miroir.

Compteur inchangé : **24/27 clôturées**.

Point de recette Vidéo : correction d’un saut désactivé sérialisé `null`, interprété par H5P comme un saut vers zéro et masquant la reprise. Les nombres facultatifs vides sont retirés et les options héritées ne sont plus forcées à « activé ». Contre-épreuves ajoutées au banc vidéo.

### Vidéo interactive — clôturée le 12 septembre

- [x] Formulaire natif, 18 types, sources multiples, sous-titres, signets, résumé, options et prompts ; sauvegarde/réouverture dans les deux hôtes.
- [x] Jeu affiche/bouton, reprise autorisée/interdite, scores 2/2 et 1/2, seconde source, sous-titres, signet et soumission finale.
- [x] Douze documents relus, pagination du résumé PDF corrigée ; 226 assertions sans échec ; miroirs conformes.
- [x] Archiver paquets, captures, résultats et SHA-256. [Rapport](RECETTE_VIDEO_NATIVE_2026-09-12.md).

**25/27 clôturées (92,6 %), 27/27 auditées.** Les deux réserves natives sont traitées dans le lot suivant. Aucun nouveau dépôt Éléa pour cette vidéo.

### Correctifs des lecteurs natifs — 12 septembre

- [x] Mots mêlés : sélectionner au centre après solution/reprise, consigne sur deux lignes et liste masquée, 4/4 dans les deux variantes.
- [x] Tri : supprimer l’erreur DOM, afficher la solution et reprendre sans rechargement, 4/4 positions et 3/3 transitions.
- [x] Reporter les deux bibliothèques dans Sucrerie et conserver le patch exact, les sondes, captures, résultats et SHA-256.
- [x] Contrôler les gardes vendor : 33 assertions sans échec.
- [ ] Appliquer les correctifs sur Éléa et rejouer : cette opération dépasse les seuls droits sur le cours 794.

[Rapport et preuves](CORRECTIFS_LECTEURS_H5P_2026-09-12.md). Code et recette locale : **27/27** ; réserves plateforme : **2**.

Commits des correctifs natifs : bas **`b238737a`** / Sucrerie **`94367f3`**. Les 27 lignes du tableau de bord sont actualisées ; aucune publication distante.

### Vérification élargie et documentation — 12 septembre

- [x] Exécuter toutes les suites des deux applications ; corriger les défauts et les tests devenus obsolètes.
- [x] Corriger l’image doublée des quiz, le déplacement des champs natifs dans les conteneurs, la copie de consigne Blanks, la couverture blanche et la traduction dupliquée.
- [x] Rejouer sauvegarde/réouverture/annulation des trois conteneurs et relire le quiz illustré dans les trois formats.
- [x] Mettre à jour les deux changelogs et fournir une explication des champs par activité.
- [ ] Qualifier les dernières variantes dans les plateformes cibles ; les réserves de bibliothèque Éléa restent ouvertes.

[Bilan de non-régression](VERIFICATION_H5P_2026-09-12.md). Aucun push ni migration ; RAG coupé.

Commits du lot de non-régression et documentation : bas **`c02710ce`**, Sucrerie **`6fc35f4`**, sur `emmanuel`, non publiés.

### Prompts initiaux — confirmation du 12 septembre

- [x] Vérifier les 27 familles dans les 12 locales et les 648 assemblages rapides/guidés.
- [x] Imposer au moins trois chapitres au livre généré, y compris si le nombre guidé vaut un ou deux.
- [x] Corriger les contradictions vidéo et les marqueurs non résolus graphique/cartes EN.

[Emplacement, portée et preuves des prompts](PROMPTS_H5P_2026-09-12.md). Aucun appel IA supplémentaire, aucune publication ; RAG coupé.

Commits : bas **`244927af`**, Sucrerie **`078222c`** ; branches `emmanuel`, non publiées.

### Sélecteur et IA externe — 13 septembre

- [x] Déplacer le sélecteur sous le cadrage, avant les filtres ; préserver clavier, reprise et visibilité mobile.
- [x] Ajouter le circuit externe du plan et de chaque activité, avec vérification puis application explicite.
- [x] Contrôler les réponses H5P/Moodle, sauvegarde, scénario, export, annulation et réouverture.
- [x] Relire les vues ordinateur/mobile et reporter documentation/changelog dans Sucrerie.
- [ ] Réaliser le lot distinct de collection parcours Sucrerie et sa recette de dépôt en ligne.

[Rapport et limites](PARCOURS_IA_EXTERNE_2026-09-13.md). Aucun déploiement ; RAG coupé.
