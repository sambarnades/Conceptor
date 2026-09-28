# Formes XML de référence — modules Moodle

Ce dossier est la **matière de l'atelier de parcours** : pour chaque module Moodle,
le `<mod>.xml` et le `module.xml` tels qu'une plateforme les écrit réellement.

- `<module>.xml` — la forme de l'activité : ses champs, et leur **ordre**.
- `<module>.module.xml` — sa fiche de pose, dont le réglage d'achèvement
  (`completion` / `completionview`), qui **diffère d'un module à l'autre et ne se
  devine pas**.

## D'où ça vient

Export authentique d'un cours de démonstration, **Magistère Grenoble, Moodle 5.1.5
(build 20260608), 4 septembre 2026**. 18 modules.

Le `.mbz` d'origine n'est pas versionné : il embarque un fichier déposé portant le nom
de son auteur, et 423 Ko d'image. Ce dossier n'en garde que les XML de structure, qui
ne contiennent ni nom, ni adresse, ni identifiant de site — vérifié.

## À quoi ça sert

À **recopier** au lieu de deviner (décision D25 du PRD de parcours). `label`, `forum`
et `choice` ont été écrits d'après la connaissance du format Moodle et sont passés,
mais c'était un pari qu'on ne peut pas répéter à chaque module. `collabwordcloud` et
`stickynotes` sont les premiers relevés ici, champ par champ ; `tests/run_parcours_course.mjs`
compare la séquence de balises que Caramel produit à celle relevée, et casse à la
moindre dérive.

**Pour changer une référence, il faut un NOUVEL export — jamais une intuition.**

## Limite du lot

Les activités ont été créées **vides**. Les carcasses sont donc complètes, mais les
conteneurs répétés le sont aussi :

| Module | Conteneur vide | Ce qu'il manque pour l'ouvrir |
|---|---|---|
| `questionnaire` | `<questions>` | la forme d'une question et de ses choix |
| `lesson` | `<pages>` | la forme d'une page et de ses branchements |
| `workshop` | `subplugin_workshopform_*` | la forme d'un critère d'évaluation |
| `data` | `<fields>` | (écarté par D23 : ses fiches sont des données utilisateur) |
| `wiki` | `<subwikis>` | (écarté par D23 : ses pages sont des données utilisateur) |

Pour ces modules-là, il faudra un export où **ces conteneurs sont remplis** : la
carcasse seule ne suffit pas à écrire un contenu.

## Ce que ces XML apprennent déjà

- `collabwordcloud` n'a **pas** de balise `<course>` ; `stickynotes` en a une.
- Les modules qui portent leur propre critère d'achèvement (`completionwords`,
  `completionstickynotes`, `completionnotes`) déclarent `completion: 2` **avec**
  `completionview: 0`.
- `url` range ses options en **PHP sérialisé** (`a:1:{s:10:"printintro";i:1;}`) — un
  format qu'on ne fabrique pas au jugé.
- Le module « Nuage de mots » s'appelle `collabwordcloud`, pas `wordcloud`.
