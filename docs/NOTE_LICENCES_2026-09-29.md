# Harmonisation des licences — 29 septembre 2026

Emmanuel a approuvé l’alignement sur **GNU AGPL v3.0 ou ultérieure** des
footers, traductions, aide et quiz, ainsi que la clarification des mentions
légales. Le fichier `LICENSE` était déjà celui de l’AGPL ; sa notice de programme
comportait encore le texte d’exemple, remplacé par le nom de Caramel.

## Modifications

- Caramel : footer principal, footer de `/decouvrir/`, douze locales et douze
  fichiers d’aide locale Caramelia, README et wiki harmonisés.
- Quiz de présentation : la bonne réponse nomme l’AGPL et la source a été
  régénérée par le pipeline habituel. Archive et dossier jouable identiques.
  Les annonces « Diapositive x sur y » restent présentes. Les trois autres
  démonstrations sont inchangées octet pour octet.
- Mentions légales Caramel : distinction entre le code propre au logiciel,
  les ressources tierces et les contenus pédagogiques créés ou importés. Le
  contenu pédagogique ne devient pas automatiquement AGPL du fait de l’outil ;
  les bibliothèques contenues dans un export gardent leur licence.
- Sucrerie : même libellé de licence dans les douze langues et précision du
  périmètre du code dans les mentions légales. Les licences des publications
  déjà déposées restent celles choisies par leurs auteurs.

La référence est le fichier `LICENSE` du dépôt ; le texte officiel est celui de
la [GNU AGPL v3](https://www.gnu.org/licenses/agpl-3.0.html), notamment ses sections
2 (résultats d’exécution), 13 (interaction par réseau) et 14 (versions ultérieures).

## Preuves et limites

- `node tests/run_legal_notices.mjs` : crédits et douze langues conformes ; les
  licences tierces réelles, dont GPL, MIT et MPL, n’ont pas été renommées AGPL.
- Présentation : 173 OK, 0 échec. Suites styles/interface/mentions légales :
  721 PASS, 0 FAIL sur cinq suites.
- Sucrerie : 3 195 PASS, 0 FAIL sur 156 suites ; les 52 fichiers partagés et leur
  manifeste SHA-256 sont intacts.
- Publication Sucrerie autorisée et vérifiée : commit
  `e74fd099c80bc14f6e9c0945666d3338ed581f4d` sur `origin/emmanuel`, dépôt propre,
  référence distante identique. Aucune modification de `main`.
- Les corrections d’aide portent sur les fichiers locaux chargés par Caramelia ;
  aucune ingestion sur un service distant n’a été réalisée.
- **En attente du choix d’Emmanuel :** la licence du contenu pédagogique des
  six démonstrations (deux ajouts après la première harmonisation). Leur champ H5P reste `U` (non renseigné) ; corriger la
  réponse du quiz sur le logiciel ne revient pas à attribuer une licence au quiz.
- Le nouveau quiz doit encore être réimporté sur Éléa, avec contrôle de
  l’annonce des diapositives, idéalement au lecteur d’écran.
- Publication Caramel sur `emmanuel` autorisée par Emmanuel après les derniers
  ajustements de présentation ; contrôles finaux et limites consignés dans le
  § 11 Journal de `docs/PRD_PARCOURS.md`.
- Le fichier `LICENSE` conserve ses fins de ligne CRLF d’origine ; vérification
  des espaces avec `git -c core.whitespace=cr-at-eol diff --check`.

## Deux démonstrations supplémentaires

`video-caramel.h5p` et `preparer-une-activite.h5p` suivent le même périmètre :
la licence de leur contenu pédagogique n’est pas encore choisie, champ H5P `U`.
La vidéo source Caramel 7 est celle d’Emmanuel Gaunard sur
[PodEduc](https://podeduc.apps.education.fr/video/161411-caramel-7/), publiée sous
CC BY 4.0 ; elle reste hébergée sur PodEduc et son crédit est affiché dans la
présentation de l’activité et dans l’écran de démarrage du H5P téléchargé. Cette licence du média ne vaut pas décision de
licence pour les nouvelles questions H5P.
