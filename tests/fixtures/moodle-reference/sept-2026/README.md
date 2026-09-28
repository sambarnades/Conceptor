# Formes XML de référence — relevé du 27 septembre 2026

Deux exports authentiques faits le même soir, **Moodle 5.1.7 (build 20260914)** des
deux côtés :

- `elea/` — cours de test d'Éléa (test03), **36 types** proposés à l'ajout, 35 posés
  (la Carte de progression a sa référence dans `../elea/`) ;
- `magistere/` — cours de démonstration de Magistère (académie de Grenoble), **29 types**
  proposés, 28 posés (« Module » — `programcourse` — renvoie à un autre cours de la
  plateforme : il n'a pas de sens dans un parcours).

Chaque activité a été créée AVEC du contenu, pour que les conteneurs répétés soient
remplis et relevables : questions d'un Questionnaire, éléments d'un Feedback, pages
d'une Leçon (page de contenu + question à choix), critères d'un Atelier, rubriques
d'une Base de données, chapitres d'un Livre, entrées d'un Glossaire (qui alimentent
les jeux Mots croisés / Mots mêlés d'Éléa), groupes d'un Choix de groupe.

Pour chaque activité : `<module>.xml`, `<module>.module.xml` (réglage d'achèvement,
mode de groupe, visibilité) et, quand elle est notée, `<module>.grades.xml`. Plus le
`files.xml` de chaque export (Fichier, Dossier, paquetages SCORM / IMS / H5P, GeoGebra).

## Ce qui a été retiré

Ni nom, ni adresse, ni identifiant de compte : les règles « utilisateur N anime la
salle » de la Classe virtuelle sont supprimées, les clés LTI chiffrées et les mots de
passe de salle remplacés par `[retiré]`, `userid` et `author` des fichiers mis à `NULL`.

## Ce que ce relevé a appris (et que le code applique)

- **Les palettes ont bougé depuis le 4 septembre.** Éléa propose désormais le
  *Partage de fichiers* (`publication`). Le *Nuage de mots* reste propre à Magistère,
  *Etherpad Lite* aussi ; *Feedback*, *GeoGebra*, *Test étudiant*, les jeux *Mots
  croisés* / *Mots mêlés* (module `game`, `gamekind` = `cross` / `cryptex`) à Éléa.
- **Capytale est un outil LTI dont l'identifiant de type change d'un site à l'autre**
  (`typeid` 9 sur Éléa, 1 sur Magistère), et le backup d'un type de site n'emporte pas
  son adresse (`baseurl` à `NULL`). Un `.mbz` fabriqué ne peut donc pas le poser de
  façon portable : Capytale reste hors palette.
- **Les jeux d'Éléa peuvent se nourrir d'un Test**, pas seulement d'un glossaire
  (`sourcemodule` = `glossary` | `question` | `quiz`) : piste pour contourner la perte
  des entrées de glossaire à la restauration (D23).
- **Achèvement par défaut** : relevé module par module dans les `.module.xml`. Wiki,
  Dossier, Document collaboratif, Etherpad, Partage de fichiers et Classe virtuelle
  arrivent SANS achèvement ; le parcours les tient hors de l'ouverture progressive (D71).
- **Mode de groupe** : Éléa pose `groupmode = 1` (groupes séparés) par défaut sur la
  plupart des activités ; Magistère `0`. Le parcours écrit `0` partout — un cours
  restauré n'a pas de groupe.
- **Document collaboratif** : ses formats « Diaporama / Tableur / Traitement de texte »
  sont désignés par l'empreinte d'un fichier modèle du serveur ; seul `text`
  (+ `initialtext`) est portable. **Et même en `text`, il range son texte de départ dans
  un fichier `<nom>.txt` (zone `initial`, cf. `files.xml` et son `inforef`), que la
  restauration EXIGE** — l'oublier fait échouer l'import du cours entier (D75).
- **Règle tirée de là** : un `fileref` dans l'`inforef.xml` d'une activité relevée veut
  dire qu'elle porte des fichiers ; les recopier avec elle, ou ne pas ouvrir le module.

## `palettes.json` — ce que chaque plateforme propose à l'ajout

Relu en direct le 28 sept. 2026 (service `core_course_get_course_content_items`). Le banc
`run_parcours_natifs.mjs` compare le registre à ce relevé : un module déclaré sur une
plateforme doit y figurer ; un module présent mais non déclaré doit être un écart documenté
(le seul : BigBlueButton sur Éléa, écarté par D77). **Pour changer une palette, refaire le
relevé**, pas le fichier à la main.

Voir `docs/PRD_PARCOURS.md`, décisions D70 à D77.
