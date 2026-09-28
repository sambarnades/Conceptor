# Consolidation de l’atelier de parcours

> **État d’ensemble et suite du chantier** : [checklist H5P, éditeur et Sucrerie](SUIVI_H5P_PARCOURS.md). Ce document conserve le journal des lots ; les mentions de fin ci-dessous concernent leur périmètre à leur date, pas l’audit exhaustif demandé ensuite.

Date de départ : 10 septembre 2026. Dépôt `bas`, branche `emmanuel`.
Mémoire des choix : [PRD_PARCOURS.md](PRD_PARCOURS.md), décisions D1–D62.
Premier lot de consolidation locale de l’atelier terminé le 10 septembre, puis ajout de l’accès Caramelia. Les recettes plateforme et les extensions demandées ensuite restent suivies séparément.
Les changements du site sont versionnés sur `bas/emmanuel`.

## Objectif

Fiabiliser la création d’un cours `.mbz` et rendre la relecture, la retouche,
l’aperçu et la reprise aussi naturels que pour une activité unique. Compléter
le tutoriel et les connaissances locales de Caramelia après stabilisation.

## État initial

- `bas` et Sucrerie : branches `emmanuel`, arbres propres.
- `rag` : branche `main`, nombreuses modifications préexistantes (200 fichiers
  suivis). Les préserver ; limiter ce chantier aux connaissances du parcours.
- Le socle, cinq bancs spécialisés et plusieurs imports réels existent déjà.
- Carte de progression et ouverture progressive : fichiers contrôlés, mais rendu
  et déblocage des étapes à essayer dans Éléa/Magistère ; deux options décochées
  par défaut. La carte, si choisie, est une activité au début du cours (section 0).
- Périmètre initial local. Emmanuel a ensuite activé le workflow et demandé
  l’ingestion multilingue, breton compris : cette extension a été réalisée.

## Travail

- [x] Lire les consignes, les décisions du PRD et les skills utiles.
- [x] Établir la référence des tests.
- [x] Fiabiliser les retouches et leur persistance.
- [x] Donner accès au scénario dès le cadrage et à la sauvegarde dès le plan.
- [x] Ouvrir l’édition et l’aperçu depuis les activités du plan.
- [x] Consolider annulation, reprise, changement de type et import de scénario.
- [x] Vérifier clavier, petits écrans et cohérence visuelle.
- [x] Compléter les tests par des gestes dans le DOM réel.
- [x] Compléter tutoriel, tutoriels embarqués et chunks RAG multilingues.
- [x] Exécuter les contrôles de non-régression et documenter les limites.

## Problèmes corrigés

| Avant | Désormais |
|---|---|
| Le contenu édité n’était pas immédiatement persisté | Chaque enregistrement met à jour contenu, titre et brouillon ; vérifié après rechargement et dans les exports |
| Le pied de l’éditeur commun pouvait masquer Enregistrer | Pied visible dans le panneau du parcours, sans changer l’éditeur partagé |
| Changer de type conservait un JSON incompatible | Contenu retiré ; annuler retrouve ensemble le type et le contenu |
| Importer un scénario exigeait d’atteindre la livraison | Reprise dès le cadrage, sauvegarde dès le plan, contrôles avant remplacement |
| Pas d’aperçu et édition seulement en fabrication | Modifier/Aperçu sur les cartes prêtes, relecture continue précédent/suivant depuis le plan et la livraison |
| Les consignes des modules propres au parcours étaient difficiles à retoucher | Mise en forme habituelle ; réponses de sondage et colonnes de mur éditables ligne par ligne |
| Une régénération ratée compliquait la reprise | Contenu précédent conservé et éditable, avec erreur de tentative distincte |
| Une réponse annulée pouvait arriver après un changement d’écran | Écriture tardive ignorée ; une nouvelle file attend la précédente |
| Le cadenas ne protégeait pas une carte vide contre l’IA | Carte réservée à la saisie manuelle, exclue de la file et du nombre d’appels annoncés |
| Les échecs pouvaient enfermer dans un cycle de relance | Livraison partielle accessible et activités manquantes signalées |
| Un scénario terminé retraversait la fabrication | Accès direct du plan à la livraison si aucune génération n’est nécessaire |
| Peu de garanties au clavier | Protection de l’abandon, boucle Tab, restitution du focus, Échap jusque dans l’iframe H5P |
| Le quota de stockage pouvait supprimer les contenus de la reprise sans le dire | Message distinct pour sauvegarde complète, limitée au plan ou indisponible |

L’objectif général, les notions pivots, durées, consignes et paliers se retouchent
directement dans le plan. Les suppressions de carte ou d’étape ont une annulation.
Une consigne modifiée ne régénère pas implicitement un contenu.

## Architecture et périmètre

- `js/parcours/activity-panel.js` : panneau commun, éditeur, lecteurs, persistance,
  focus et protection des opérations asynchrones.
- `js/parcours/scenario-actions.js` : commandes persistantes de scénario et tutoriel.
- `js/parcours/dom.js` : petites fabriques de boutons et textes traduits.
- Écrans, état, file et import consolidés dans `js/parcours/` ; adaptations CSS
  limitées au parcours. Éditeurs communs, processeurs H5P et formats Moodle réutilisés.
- `js/ui/notifications.js` expose le gestionnaire H5P existant. Créer un deuxième
  gestionnaire aurait cassé l’interception des fichiers du lecteur, qui est globale.
  `h5p-manager.js` dispose d’une annulation de chargement explicite.
- Constructeur partagé `js/moodle/mbz-course-builder.js` inchangé ; aucun fichier
  de Sucrerie modifié.
- Contrôles Node de garde-fous, types et documentation ajoutés dans la CI.

## Tutoriel et Caramelia

- Chapitre `parcours` dans les 12 fichiers `assets/data/tutorial/<lang>.json`,
  accessible directement depuis le bouton du parcours.
- Wiki et 12 tutoriels embarqués `js/caramelia/tuto-rag/<lang>.md` complétés.
- Dans `rag` : source `caramelia/sources/15-parcours.md`, trois fiches par langue
  (`parcours-creation`, `parcours-relecture-scenario`, `parcours-export-limites`),
  index français et `STATUT.md` complétés, soit 36 fiches.
- `caramelia/tests/golden-parcours.jsonl` : 12 questions/réponses de référence.
  Ce sont des attentes pour l’évaluation après ingestion, pas des réponses déjà
  mesurées sur le service en ligne.
- Changements préexistants du dépôt RAG conservés ; anciens compteurs du corpus
  laissés comme état historique.

### Ingestion ILaaS effectuée le 10 septembre

À la demande d’Emmanuel après activation du workflow, les **36 documents** ont
été ingérés dans `caramelia` (**collection 55**), dans **12 langues dont `br`**.
La collection est passée de **780 à 816 documents**. Les **72 chunks** produits
ont été relus : texte, langue, code et empreinte SHA-256 conformes aux fichiers
locaux. Chaque nom est présent une seule fois ; tous les documents préexistants
sont conservés.

- Script ciblé : `rag/ingest-parcours-2026-09-10.mjs` (lecture seule par défaut,
  `--apply` pour les absents, `--verify` pour relire). Il ne supprime aucun document.
  Une réponse d’écriture incertaine arrête le traitement ; seules les lectures
  attendant la visibilité des chunks sont réessayées. Une première reprise a
  confirmé quatre documents déjà présents sans les recréer.
- Rapport avec IDs et empreintes :
  `rag/caramelia/reports/2026-09-10-parcours-ingestion.json`.
- Recherche sémantique vérifiée en français et en breton. La question en breton
  retrouve **`br__parcours-relecture-scenario` en premier résultat**.
  Rapport : `rag/caramelia/reports/2026-09-10-parcours-recherche.json`.
- Script général `rag/ingest-caramelia.mjs` corrigé : sa liste par défaut inclut
  désormais le breton (12 langues), ce que l’ancienne liste de 11 omettait.
- Cette ingestion répond à l’instruction d’Emmanuel, qui remplace pour cette
  opération la consigne habituelle de la skill Caramelia réservant l’ingestion
  au mainteneur. Aucun workflow n’a été modifié ou désactivé.

## Validation de la consolidation initiale et de l’accès Caramelia

Les résultats de l’ajustement visuel suivant (D52) figurent dans sa section plus bas.

Commande globale : `node tests/run_parcours.mjs` — **8/8 bancs réussis,
556 assertions, aucun échec**.

| Banc | Succès | Couverture |
|---|---:|---|
| `run_parcours_gardefous.mjs` | 46 | Relecture didactique |
| `run_parcours_types.mjs` | 19 | Familles de gestes |
| `run_parcours_atelier.mjs` | 119 | Contexte, plan, file, navigation, scénario, bibliothèque |
| `run_parcours_course.mjs` | 103 | Assemblage réel H5P/Moodle/Test, sections, archives, progression |
| `run_parcours_fiche.mjs` | 31 | Fiche de séquence, détail et formateur partagé |
| `run_parcours_relecture.mjs` | 35 | Import par fichier, édition, aperçus, clavier, téléchargement et relecture du XML du MBZ, reprise et livraison partielle |
| `run_parcours_documentation.mjs` | 169 | Tutoriel, libellés réels, 12 langues et 36 fiches RAG |
| `run_parcours_caramelia.mjs` | 34 | Accueil, reprise, sources, public, double envoi, annulation, échecs, langue et mobile |

Le contrôle documentaire inclut les libellés Caramelia et la correspondance
des 12 locales : **169 succès**. En CI sans dépôt frère RAG, il contrôle les
84 assertions locales et annonce explicitement l’omission des contrôles externes.
Le banc de relecture a été relancé après les derniers ajustements de focus lors
de l’enregistrement et du changement de langue : **35 succès**.

Autres contrôles :

- Caramelia après cette phase : **281 PASS / 0 FAIL**, 2 suites existantes,
  aucune erreur JS. Le banc dédié de 34 assertions a été relancé après la
  synchronisation immédiate de langue, également sans erreur JS.
- Suite générale navigateur, lors de la consolidation initiale : **14 219 PASS / 0 FAIL**, 42 suites. Les 23 erreurs
  de page signalées par le pilote sont également présentes avant cette consolidation :
  même résultat et mêmes diagnostics reproduits dans une copie temporaire de `HEAD`.
  Elles restent distinctes des assertions réussies ; ne pas annoncer une console
  générale sans erreur.
- Hygiène des modules : **10 OK**, 786 imports relatifs vérifiés.
- 28 fichiers JavaScript/MJS modifiés ou ajoutés : syntaxe vérifiée.
- 3 174 clés identiques et dans le même ordre dans les 12 locales ; couverture
  H5P et présence des 1 009 clés de l’éditeur/export partagé vérifiées.
- Caramelia : **157 clés**, identiques et ordonnées dans les 12 langues ;
  paramètres des six nouveaux libellés vérifiés.
- `git diff --check` sans défaut.
- Captures inspectées à 1 440 px et 390 px ; absence de débordement du plan
  vérifiée à 1 024, 768, 390 et 360 px. Panneau vérifié sur téléphone.
  Le banc de relecture n’émet aucune erreur JavaScript non gérée.

Les tests emploient les lecteurs, éditeurs et assembleurs du produit. Les appels
IA des épreuves de file sont doublés : aucun coût de génération d’activité engagé
pour ces tests. L’ingestion et les deux recherches ont ensuite utilisé le RAG réel.
Le nouveau banc produit ses captures et un
`parcours-relu.mbz` dans `/tmp/caramel-parcours-captures/`. Ce fichier est une
fixture de test, pas un parcours pédagogique validé.

## Refaire la vérification fonctionnelle

1. Choisir « Un parcours », puis reprendre un scénario depuis le cadrage.
2. Modifier une Page et un forum ; enregistrer, prévisualiser, passer à l’activité
   suivante, essayer le H5P et fermer au clavier.
3. Changer un type puis annuler ; supprimer une carte puis annuler.
4. Exporter le scénario, recharger, vérifier les retouches ; assembler le cours
   et vérifier titres et contenus dans la plateforme après restauration.
5. Ouvrir Caramelia : « Créer un parcours » ou « Reprendre mon parcours »
   rejoint l’atelier ; vérifier la conservation du sujet, du public et des sources.
6. Pour une génération réelle, remplir le formulaire et joindre les sources
   avant de lancer. Annuler puis reprendre et vérifier le contexte produit.

## Suite demandée : accès au parcours depuis Caramelia

- [x] Bouton « Créer un parcours » au menu, puis « Reprendre mon parcours »
  lorsqu’un plan existe ou que l’atelier est déjà ouvert. Même accès après une
  réponse d’aide ou une indisponibilité du service.
- [x] Un clic ouvre le cadrage ou retrouve le plan, sans appel IA, sans effacer
  le brouillon ni les champs ni le texte source. Le chat se ferme et rend le
  focus à la navigation. Le plan se valide dans l’atelier avant génération.
- [x] Le guidage activité conserve le public déjà saisi et demande seulement
  les champs manquants. Le récapitulatif de fin compte les fichiers réellement
  créés ; les échecs n’entraînent pas de suggestion automatique supplémentaire.
- [x] Double envoi empêché, saisie suivante conservée, requête annulée au
  redémarrage et réponse tardive ignorée. Les anciens choix cessent d’être actifs
  dès qu’un nouveau choix est proposé. Une traduction lente ne remplace pas
  la dernière langue choisie. Boutons et champ de saisie suivent immédiatement
  l’événement de changement de langue de Caramel.
- [x] Six nouveaux libellés dans les 12 locales Caramelia ; tutoriel et aide
  embarquée dans les 12 langues ; 24 fiches RAG locales actualisées (création et
  limites). Aucune nouvelle ingestion : le workflow a été coupé par Emmanuel.
- Banc : `node tests/run_parcours_caramelia.mjs`, services distants bloqués.
  Captures dans `/tmp/caramelia-parcours-captures/`.
- **Limite volontaire de ce premier accès** : Caramelia ouvre l’atelier ; elle
  ne compose pas encore tout le parcours dans la conversation à partir d’une
  demande libre. Aucun changement de prompt ni de workflow n8n.

## Ajustement après la capture d’Emmanuel — cadrage allégé (D52)

La fusion visuelle ci-dessous était la première proposition ; elle est remplacée
par D53, sans modifier les corrections de navigation.

- À la première ouverture de « Un parcours », **aucun défilement automatique**,
  même depuis Caramelia. Le focus reste sur le mode choisi : les champs ne sont
  pas sautés dans le parcours clavier. La reprise d’un plan existant conserve
  l’accès direct au plan ; un retour explicite au cadrage retrouve le formulaire.
- Le formulaire et le cadrage partagent une surface blanche continue. Les champs,
  leurs positions et les onglets Rapide/Avancé sont conservés. La jonction se fait
  par une ligne fine, avec les étapes et les commandes secondaires sur un bandeau.
- Un titre court et une phrase remplacent le préambule ; les trois paragraphes
  redondants sous les rubriques sont retirés. Descriptions des choix conservées.
  Deux textes adaptés dans les **12 langues**, breton compris.
- Classes limitées au cadrage, retirées dès le plan ou le retour en mode activité.
  Aucune modification du CSS partagé ni du formulaire HTML de l’activité unique.
- Vérification visuelle : 1920, 1440, 1024, 768, 390 et 360 px, modes Rapide et
  Avancé, arabe sur mobile. **Défilement initial = 0, débordement = 0** aux six
  largeurs. Après retour en mode activité, dimensions des champs, marges, arrondis
  et ombre du formulaire identiques à leur état initial.
- Captures : `/tmp/caramel-cadrage-captures/`, notamment `parcours-1440.png`,
  `parcours-390.png`, `parcours-avance.png` et `parcours-ar-mobile.png`.
- Les bancs de navigation et Caramelia protègent l’absence de saut initial et le
  rétablissement du formulaire. Résultats : **121 assertions atelier**,
  **35 Caramelia**, **35 relecture** et **169 documentation**, soit **360 succès
  sans échec**. Hygiène des modules et parité des 3 174 clés également vérifiées.
- Le retour en haut attend la stabilisation de la page : le navigateur ne peut
  plus ajouter quelques pixels par ancrage après le retrait du plan. En mouvement
  réduit, le défilement demandé est instantané. Les callbacks devenus obsolètes
  après un changement de mode sont ignorés.
- Travail local uniquement : aucun déploiement, aucune ingestion, Sucrerie inchangée.

## Retouche visuelle demandée — deux cadres distincts (D53)

- Le formulaire garde **son CSS naturel dans les deux modes** : ombre, bordure,
  quatre arrondis et marge basse de 30 px. Le contraste de l’onglet Rapide/Avancé
  inactif est ainsi conservé. Plus de classe ni de code modifiant ce formulaire.
- Le cadrage compact demeure juste dessous, dans son propre cadre blanc arrondi.
  Bandeau regroupé, textes courts et absence de défilement initial conservés.
- Captures actualisées dans `/tmp/caramel-cadrage-captures/`.
- Vérifié sur les six largeurs de 360 à 1920 px : style et géométrie du formulaire
  identiques avant, pendant et après le cadrage ; séparation de 30 px, aucun
  débordement, aucun défilement initial. Modes Rapide et Avancé inspectés.
- Banc atelier : **121 assertions réussies, aucun échec**.
- Ajustement local uniquement ; aucun changement du contenu pédagogique, des
  traductions, du RAG ou de la production.

## Vocabulaire des modalités selon la plateforme (D54)

- Éléa : « En classe » / « Vos élèves sont devant vous ».
- Magistère : « En présence » / « Vos stagiaires sont devant vous ».
- Moodle : « En présence » / « Vos étudiants sont devant vous ».
- Pour Magistère et Moodle, « Les deux » décrit une partie en présence et une
  partie à distance. Le distanciel garde sa formulation commune.
- Quatre clés ajoutées dans les **12 langues**, breton compris : 3 178 clés par
  locale, même ordre, sans doublon. Les termes bretons *stajidi* et *studierien*
  ont été recoupés avec les usages de l’[Office public de la langue bretonne](https://www.brezhoneg.bzh/62-oadourien.htm).
  La relecture humaine des formulations reste prévue.
- Mise à jour immédiate des textes sans remplacer les boutons ; sélection et
  focus conservés. Le public du formulaire et les prompts ne sont pas modifiés.
- Banc atelier : **172 assertions réussies, aucun échec**, dont 51 nouvelles
  vérifications par clic, changement de langue et reprise du brouillon.
- Contrôle à 1 440 et 390 px : les deux plateformes dans les douze langues,
  aucun débordement ni texte coupé. Captures française, bretonne et arabe relues.
- Captures : `/tmp/caramel-vocabulaire-captures/`.

### Avis sur la bascule — emplacement inchangé

Emmanuel demande un avis, pas un déplacement. La recommandation est de conserver
la bascule au centre de l’en-tête sur ordinateur : elle choisit l’objet créé,
reste accessible en descendant dans le plan et laisse le formulaire habituel à
sa place. « Rapide / Avancé » garde ainsi son rôle de réglage de la saisie.

Le point à revoir concerne les petits écrans : sous 900 px, les libellés sont
masqués. Une rangée compacte sous l’en-tête, avec les deux libellés visibles,
serait à étudier pour ces tailles. Les icônes seules n’expliquent pas suffisamment
le choix aux personnes qui découvrent le parcours ([étude NN/g sur les icônes](https://www.nngroup.com/articles/icon-usability/)).
Cette proposition mobile n’est pas implémentée ni consignée comme une décision
d’Emmanuel. Aucun changement de CSS, de RAG ou de production pour cette retouche.

## Harmonisation de la conception, fabrication et livraison (D55–D56)

- Le cadre du cadrage est appliqué aux quatre étapes, attente du plan comprise.
  Navigation compacte, gouttières et outils identiques ; ombres intérieures
  retirées au profit de contours fins. Le formulaire commun reste indépendant.
- Titre et objectif du plan lisibles en entier et éditables sur place ; leur
  hauteur suit la saisie et la largeur de l’écran. L’observateur est libéré
  lorsqu’on quitte l’écran. La marge et la hauteur générales des textarea du
  site ne créent plus de grandes zones vides ici.
- Statistiques regroupées avec l’introduction. Notions et réglages regroupés en
  rubriques dépliantes, avec réglages actifs exposés à la reprise. Les repères de
  relecture sans alerte sont plus discrets ; les alertes restent détaillées.
- Retour et action principale alignés, aide juste dessous, y compris sur mobile.
  Livraison : téléchargement et relecture côte à côte. Les messages ponctuels
  d’import/export ne persistent plus sur les écrans suivants.
- Le commutateur de l’en-tête et les douze traductions existantes sont conservés.
- Nouveau banc `tests/run_parcours_harmonie.mjs` : **117 assertions réussies**,
  quatre écrans, 1 440, 1 024, 768, 600, 390 et 360 px, français, allemand, arabe
  et breton. Vérifie aussi l’agrandissement/réduction des titres et la reprise des
  options. Captures : `/tmp/caramel-harmonie-captures/`.
- Essai ILaaS autorisé : **un plan et huit activités réellement générés**, appels
  successifs sur le backend `bas`, sans repli de modèle. Archive téléchargée depuis
  la livraison, huit activités et quatre étapes pédagogiques plus l’accueil.
- Cet essai a révélé et permis de corriger un défaut de reprise des Glossaires
  générés sous forme de liste (D56). Deux tests ajoutés au banc de relecture.
- Après correction, scénario complet réimporté et les **huit aperçus ouverts**
  dans les lecteurs réels, sans erreur JavaScript. Le banc de relecture passe à
  **37 assertions réussies**. Relevés et captures finales conservés avec l’essai.
- Validation finale : `node tests/run_parcours.mjs` → **9 bancs sur 9 réussis,
  729 assertions, aucun échec**. `git diff --check` sans anomalie.
- [Fichiers de l’essai et relevé détaillé](../tests/sonde-parcours/essai-ux-2026-09-10/README.md)
  conservés dans le dépôt pour la relecture d’Emmanuel. **Écart observé à reprendre** :
  l’IA a proposé huit activités malgré l’ampleur courte demandée (trois à quatre).
  Le respect du calibrage reste à renforcer, distinct de cette harmonisation.
- Aucune modification de production, de Sucrerie, du RAG ou des workflows n8n.

## Version 7.0.0 — 11 septembre 2026

- À la demande d’Emmanuel, version du site portée à **7.0.0** : footer,
  CHANGELOG, README (badge et nouveautés), wiki et identité CLAUDE.md.
- Le contrôleur de version lit déjà le footer local et distant : aucune constante
  à modifier. Les versions des bibliothèques et des formats de scénario restent
  indépendantes de celle du site.
- Point de sauvegarde demandé sur **bas/emmanuel**, avant le travail de calibrage.
  La validation fonctionnelle de référence est celle des neuf bancs : 729 assertions.
- Vérifications de version et des 3 178 clés × 12 locales réussies. Le script
  historique LaTeX signale un marqueur `FillInTheBlanks` absent du prompt français ;
  le prompt est identique à HEAD : cet écart préexiste à la consolidation.
- Suite : garantir l’ampleur demandée à la composition, examiner la cohérence des
  trames et documenter discrètement leurs inspirations pédagogiques.

## Calibrage et trames — 11 septembre 2026 (D57–D59)

- Commit de version créé avant cette phase : **48077cc**, sur `bas/emmanuel`.
- Variantes explicites pour chaque ampleur proposée : aperçus, modèles sans IA
  et prompts utilisent les mêmes données. **207 combinaisons** de trame,
  modalité, ampleur et plateforme vérifiées. Rituel à dix minutes, sans grille
  de mots croisés inadaptée aux réponses chiffrées.
- Contrôle du plan IA avant présentation, une recomposition au maximum sur le
  même modèle. Aucun plan tronqué pour forcer le compte, aucun écrasement du
  brouillon si l’IA échoue. Annulation et erreur réseau testées.
- Le prompt précise les moments en présence/à distance, le nombre de notions,
  la structure JSON et les capacités des activités : une frise se consulte,
  un texte à trous se complète au clavier, une Page n’a pas de champ de réponse.
- **28 compositions réelles**, strictement successives : deux refus dans la
  première série ont guidé la correction ; les **19 suivantes sont conformes**
  au contrat. Les **cinq dernières** valident le prompt final, sans reprise et
  sans repli de modèle, dont anglais et breton. Ce sont des plans à relire,
  pas des contenus déjà fabriqués ni des cours restaurés.
- Dix bancs réussis : **760 assertions** lors de la passe complète ; puis le
  nouveau test d’accents et les derniers ajustements sont revérifiés dans les
  bancs concernés (**calibrage 32**, atelier 172, documentation 169), soit
  **761 assertions au total**. Douze locales : **3 180 clés**, même ordre.
- ABC Learning Design : lien UCL et explication dans le wiki et l’aide des douze
  langues. Le miroir à cinq familles n’est pas présenté comme les six types ABC.
  Les intentions françaises dans `templates.js` sont internes au prompt ;
  les libellés d’interface sont traduits, et les sorties anglaise/bretonne vérifiées.
- [Campagnes, réponses brutes et captures](../tests/sonde-parcours/calibrage-2026-09-11/README.md).

## Sources multimédias intégrées — 11 septembre 2026

- Point de sauvegarde du calibrage : **`fd7064ce`**, après la version 7.0.0
  **`48077cc`**, sur `bas/emmanuel`. Aucun push.
- D60 remplace l’exclusion D20. Les quatre types à support possèdent leurs champs
  dans la carte du **Plan** et de la **Fabrication** : vidéo avec transcription
  automatique ou manuelle, image avec fichier, aperçu, remplacement et retrait.
- Traitements individuels réutilisés : décodage/redimensionnement, vision,
  transcription, construction des prompts, génération, healer, processeurs,
  éditeur et lecteurs H5P. La vision suit le nombre d’éléments de la carte ;
  l’ensemble reste séquentiel et annulable.
- Un support absent laisse sa carte en attente ; les autres avancent. Changer
  une source conserve le contenu relu. Changer le lien vidéo exige de revérifier
  une ancienne transcription collée, dont le texte est conservé. Remplacer le
  fond dans l’éditeur met aussi à jour la source de génération.
- Les médias sont stockés **par carte**, repris dans le scénario et transmis
  explicitement aux exports/aperçus. Deux images distinctes sont relues jusque
  dans les H5P du MBZ. L’éditeur conserve ses médias ajoutés et retire les anciens
  fichiers devenus inutiles. Les images de fond sont incluses dans le document.
- Onze nouvelles clés traduites dans les **12 langues (breton compris)**,
  **3 191 clés** par locale. Tutoriels, aide embarquée Caramelia et wiki complétés.
  Le corpus du dépôt RAG et le workflow d’ingestion n’ont pas été modifiés.
- Vérifications : banc `sources` **43 PASS**, édition et remplacement réel du
  fond, reprise JSON, fichiers du MBZ, transcription automatique simulée au
  réseau, cache, arrêt en cours de détection, conservation après échec, contrôles
  à 390 px en français, arabe et breton. Le banc global comprend désormais
  **11 suites, toutes réussies (816 contrôles)**. Les prompts vidéo individuels, la barre latérale média
  (**56 contrôles**) et les processeurs hotspot (**127 contrôles**, 2 fixtures
  de plateforme absentes) sont également vérifiés.
- **Six générations ILaaS réelles réussies**, sans repli du modèle de texte :
  trois activités visuelles françaises, une Image interactive bretonne,
  une Vidéo interactive française et un essai supplémentaire à quatre zones.
  Six MBZ produits. Vidéo testée avec la transcription du fixture HACCP ;
  lecture YouTube effectivement démarrée après réimport, quatre interactions.
  Les textes et positions proposés par l’IA restent à relire, notamment le breton.
- [Traces, scénarios, exports et captures des essais](../tests/sonde-parcours/sources-2026-09-11/README.md).

## 11 septembre — fond personnel de la carte et dernières retouches (D61)

- Les blocs Notions/Réglages sont séparés par un fond discret, sans cadre commun
  ni empilement de traits. Les champs Notions et Consigne grandissent et
  rétrécissent avec le texte ; le dépliage et le changement de largeur sont pris
  en compte, sans affecter les champs du mode Activité.
- Le cadre « + » porte bien sur **le fond de la Carte de progression Éléa**.
  Dépôt de fichier, glisser-déposer, aperçu du placement, remplacement et retrait
  accessibles depuis le plan, à côté des trente thèmes. La carte reste décochée.
- Conversions H5P réutilisées, sans nouvelle bibliothèque : JPEG, PNG, WebP,
  GIF, BMP, AVIF, SVG, HEIC/HEIF via heic2any, TIFF via UTIF/pako. JPEG final
  autonome ; proportions conservées, sans recadrage. Entrée limitée à 12 Mio.
- Contrat du greffon relu dans ses sources publiques : fichier incorporé à
  `mod_mapmodules/maps/0`, noms techniques imposés, SHA-1 et contexte renuméroté.
  Aucun changement du constructeur partagé avec Sucrerie. Le scénario conserve
  les octets ; le repli sous quota conserve explicitement le nom d’un fond absent.
  Une image illisible/trop lourde ou une conversion tardive ne remplace pas le choix.
- Six nouvelles clés dans **12 langues, breton compris (3 197 clés par locale)**.
  Tutoriel, aide Caramelia embarquée, wiki, README et changelog mis à jour.
  Aucune relance d’ingestion ni modification des dépôts RAG/Sucrerie pour ce lot.
- **12/12 suites du parcours réussies : 884 contrôles**, puis **58/58** pour le
  banc Fonds après ajout de deux cas (poids et conversion tardive), soit
  **886 contrôles au total** dans les versions finales des bancs. Parité des
  traductions et clés partagées vérifiée ; captures desktop/mobile relues.
- [Scénario, MBZ, captures et rapport](../tests/sonde-parcours/fond-personnel-2026-09-11/README.md).
  Restauration réelle du fond personnel sur Éléa toujours à réaliser.
- Publication demandée par Emmanuel : **commit puis push de `bas/emmanuel`**.
  La branche distante de publication est `main` ; elle n’est pas modifiée.
  Les trois commits précédents (7.0.0, calibrage, supports) font partie du push.

## 11 septembre au matin — relecture et exports sans clignotement (D62)

- Retours des trois captures de 08 h 20 : nom technique du Test, double
  confirmation d’annulation et déplacement visuel pendant les téléchargements.
- Aperçu et édition réunis dans un cadre cohérent avec l’atelier : titre unique,
  type traduit, bascule compacte, espaces et pied d’édition adaptés au mobile.
  En arabe, le compteur conserve son ordre et les flèches suivent le sens de lecture.
- L’éditeur Moodle utilise son nom traduit via le registre existant. Vérification
  dans **les douze langues**, y compris dans l’éditeur individuel.
- Une seule confirmation pour Annuler, Fermer, changer d’activité ou passer à
  l’aperçu. Échap/refus conserve les données et rend le focus ; la confirmation
  retient le clavier et suspend les commandes du panneau.
- Le clignotement reproduit venait des messages ajoutés/retirés dans le flux et
  des boutons désactivés qui passaient à 50 % d’opacité. Les messages disposent
  maintenant de leur place ; une icône de travail remplace l’icône habituelle
  sans modifier le libellé ou la taille. Un verrou commun évite les doubles exports.
- **13 suites validées, 1 007 contrôles** : les douze bancs existants passent
  (886), puis le nouveau banc de stabilité (121). Celui-ci réalise **28 exports**,
  MBZ et deux documents en DOCX/ODT/PDF, à 1440/390 px, en FR/AR/BR, avec les
  animations normales du navigateur. La géométrie, les polices et l’opacité
  restent identiques à chaque frame mesurée. Le PDF utilise le repli local ;
  aucun appel au serveur PDF ni à l’IA. Les 1 009 clés de l’éditeur/export sont
  présentes dans les douze locales. Aucun nouveau libellé nécessaire.
- [Captures et rapport de validation](../tests/sonde-parcours/relecture-2026-09-11/README.md).
  Corrections locales sur `bas/emmanuel` ; aucun fichier partagé avec Sucrerie
  modifié, aucune relance du RAG ni publication en production.

## Essais et étapes qui restent à faire après le travail local

- **Restauration réelle** du parcours relu sur les instances cibles. Les imports
  historiques restent dans le PRD ; les tests d’archive ne remplacent pas un nouvel
  essai sur Éléa/Magistère/Moodle.
- **Carte de progression et ouverture progressive** : facultatives, décochées
  par défaut. Si on choisit la carte, vérifier son affichage au début du cours ;
  si on choisit l’ouverture progressive, vérifier qu’un apprenant accède à
  l’étape suivante après avoir terminé la précédente. Ce sont deux essais
  distincts sur la plateforme. Les branchements par note (D34) restent à concevoir.
- **Workflow d’ingestion** : coupé par Emmanuel après la première ingestion.
  Les changements décrivant l’accès Caramelia sont uniquement dans les fichiers
  locaux. Mettre à jour les 24 documents concernés après mise à disposition du
  code ; les rapports existants décrivent la version ingérée antérieure. Le
  script ciblé ajoute seulement les absents et ne remplace pas ces documents.
- **Relecture linguistique humaine**, en particulier du breton : les contrôles
  vérifient la cohérence des clés et des contenus, pas l’idiomaticité.
- **Sucrerie** : dépôt du parcours complet encore à implémenter, distinct de
  l’accès depuis Caramelia désormais présent. Le dépôt Sucrerie n’a pas été modifié.
- Version 7.0.0 et compléments enregistrés sur `bas/emmanuel` ; push de cette
  branche autorisé par Emmanuel le 11 septembre. Aucun déploiement de production ;
  le dépôt RAG reste séparé.


## 11 septembre — dépôt du parcours complet et port Sucrerie

Le socle précédent est enregistré dans `c38f02d7`. Le dépôt complet depuis la
livraison est désormais implémenté : formulaire Sucrerie habituel, un seul MBZ,
activité `parcours`, messages adaptés et tutoriels dans les douze langues.
La branche `emmanuel` de Sucrerie reçoit le lecteur du plan, l'édition des activités
et des consignes, les exports et la conversion des images des anciens parcours.
« Collection » reste le rangement ; « Parcours » désigne aussi le cours complet.

Le correctif d'initialisation H5P attend désormais la Promise renvoyée par le
constructeur. L'essai aperçu → édition rapide ne produit plus d'erreur de ZIP.
Les primitives Test et XML sont partagées, sans embarquer les templates Caramel
ou les dépendances d'interface dans Sucrerie.

Validations : Sucrerie 3 095 tests / 0 échec ; Caramel 14 249 tests / 0 échec après
extraction des primitives, puis 179 contrôles ciblés de l'interface après le
correctif H5P. Pont : 53 tests de domaines et un dépôt de parcours simulé vérifiant
l'intégrité exacte du binaire. Scénarios UI hors CI conservés dans les dépôts.
Suivi détaillé : `../sucrerie.forge.apps.education.fr/docs/SUIVI_PARCOURS_CARAMEL.md`.

À reprendre : restauration réelle du fichier réédité par Sucrerie, contrat des
workflows distants en environnement d'essai, relecture bretonne et ingestion RAG
lorsque son workflow sera réactivé par l'auteur. Le bouton d'enrichissement d'une
collection ordinaire en parcours reste une extension distincte, non réalisée ici.

## Relecture du 11 septembre : exhaustivité et collection parcours

L’utilisateur confirme les bibliothèques Éléa récupérées fin août comme référence. [AUDIT_CAPACITES_H5P.md](AUDIT_CAPACITES_H5P.md) reprend le périmètre complet et distingue l’inventaire natif de la preuve d’édition/export. Les calculées et autres familles Test ne sont plus décrites comme exclues du chantier. Distracteurs de Glisser les mots et corrigé rédigé Essay constituent le premier complément.

La cible Sucrerie devient une expérience commune de collection/parcours, avec consignes facultatives et ouverture directe du plan lors du dépôt d’un MBZ. Le binaire complet reste conservé. Le modèle UX antérieur de parcours systématiquement niché dans une collection est remplacé par la proposition `sucrerie/docs/CONCEPTION_COLLECTION_PARCOURS.md` ; sa migration et l’IA ne sont pas encore implémentées.
