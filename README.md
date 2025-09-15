# Caramel : Création Assistée de Ressources et d'Activités Moodle et Éléa

## Table des matières

* [Description du projet](#description-du-projet)
* [Objectif](#objectif)
* [Public visé](#public-visé)
* [Pré‑requis techniques](#pré‑requis-techniques)
* [Captures d'écran et Démonstration](#captures-décran-et-démonstration)
* [Installation et Utilisation](#installation-et-utilisation)
* [Fonctionnalités principales](#fonctionnalités-principales)
* [Architecture du dépôt](#architecture-du-dépôt)
* [Licence](#licence)
* [Contributions et Évolutions](#contributions-et-évolutions)
* [Contact](#contact)

---

## Description du projet

**Caramel** est une application web qui simplifie la **création d'activités interactives** comme H5P ou les activités Éléa en s'appuyant sur l'intelligence artificielle.
À partir d'un contexte pédagogique (discipline, thème, niveau scolaire, nombre d'items), Caramel :

1. génère des *prompts* prêts à l'emploi pour être utilisés dans l'IA du choix de l'utilisateur ;
2. convertit la réponse de l'IA en fichiers **.h5p** (modules H5P) ou **.mbz** (activité Moodle/Éléa/Magistère) sans quitter le navigateur.

Aucune donnée n'est envoyée vers un serveur : **tout est traité localement côté client**.

---

## Objectif

Fournir aux enseignants et formateurs un outil :

* **rapide** : plus besoin de concevoir manuellement les H5P ou activités Éléa ;
* **universel** : compatible avec toute IA générative acceptant des prompts textuels ;
* **sans installation** : simple page statique hébergée sur GitLab Pages ou n'importe quel serveur web.

---

## Public visé

* **Enseignants** souhaitant enrichir leurs cours de ressources interactives.
* **Formateurs** utilisant les plateformes Éléa/Magistère/Concepteurs

---

## Pré‑requis techniques

| Élément        | Minimum requis                          |
| -------------- | --------------------------------------- |
| Navigateur     | Chrome, Firefox, Edge ou Safari (2021+) |
| Accès internet | Obligatoire                             |
| Serveur        | Aucun : HTML/JS/CSS statiques           |

---

## Utilisation

Le site internet est accessible directement à ce lien [https://caramel.forge.apps.education.fr/](https://caramel.forge.apps.education.fr/) 

---

## Fonctionnalités principales

* **Génération de prompts IA** pour :

  * H5P : Timeline, Flashcards, QuizSet, Drag the Words, Mark the Words, etc.
  * Moodle/Éléa : export XML, format GIFT, activité unique *Millionnaire*.
* **Transformation instantanée** des réponses IA vers :

  * paquets **.h5p** auto‑contenus (JSZip + fflate) ;
  * archives **.mbz** (tar-js) pour Moodle.
* **Interface UX** inspirée d’iOS : glassmorphism, grille dynamique, notifications toast.
* **Traitement full‑client** : aucune donnée pédagogique ne quitte le navigateur.
* **Mode démonstration** avec jeux de données factices.

---

## Licence

Caramel est distribué sous la **GNU GPL v3 ou ultérieure**.
Les bibliothèques tierces conservent leurs licences respectives (MIT, Zlib, SIL OFL…).


---

## Contact

* **Gauthier Remande** – [gauthier.remande@ac-nantes.fr](mailto:gauthier.remande@ac-nantes.fr)
* **Emmanuel Gaunard** – [emmanuel.gaunard@ac-grenoble.fr](mailto:emmanuel.gaunard@ac-grenoble.fr)

---

*Caramel v1.2 – Septembre 2025*
