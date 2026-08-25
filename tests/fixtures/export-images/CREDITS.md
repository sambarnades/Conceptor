# Images de fixture — export documentaire

Ces fichiers ne servent QU'AUX TESTS (`tests/run_document_export_oracle.mjs`). Ils ne sont
jamais chargés par l'application et ne sont donc pas concernés par les mentions légales
(`assets/templates/mentions-legales.html`), qui couvrent les bibliothèques de `js/vendor/`
et `css/vendor/`.

| Fichier | Source | Auteur | Licence |
|---|---|---|---|
| `van-gogh-nuit-etoilee.jpg` | [Wikimedia Commons — `File:Van Gogh - Starry Night - Google Art Project.jpg`](https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg) (vignette 330 px) | Vincent van Gogh (1853-1890), numérisation Google Arts & Culture | **Domaine public** (`PD-Art`, auteur mort depuis plus de 70 ans) |

Le fichier est **inliné en `dataURL`** par `run_document_export_oracle.mjs` (marqueur
`_fichier` dans `tests/fixtures/export-cases/`), et non référencé par un chemin :
`validateImageUrl` (`js/renderers/image-utils.js`) n'autorise que `http(s)`, et le repli
« chemin relatif » de `resolveImageData` lit le registre **mémoire** d'`image-manager`,
vide hors application. Le `dataURL` est de toute façon la forme réelle qu'a une image
jointe dans Caramel.

Une image RÉELLE est indispensable ici : l'oracle sert un PNG synthétique d'**un pixel**
(~70 octets) à toute requête sortante, et le contrôle `_attendImages` exige des entrées
média d'au moins 1 Ko. C'est la seule façon de vérifier que le chemin complet
(dimensionnement, `docxImageType`, entrée de manifeste, `Pictures/` ODF) embarque bien de
vrais octets JPEG — une baseline de hachages, elle, ne prouve que « rien n'a changé ».
