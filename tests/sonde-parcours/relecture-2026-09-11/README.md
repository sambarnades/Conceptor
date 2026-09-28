# Relecture, annulation et stabilité des exports — 11 septembre 2026

Retour d’Emmanuel à 08 h 20 : `elea_test` affiché dans le titre, deux confirmations
d’annulation superposées et clignotement pendant la préparation des fichiers.

La relecture et l’édition utilisent désormais un cadre commun avec le nom traduit
de l’activité. L’annulation est centralisée dans une seule confirmation, avec
conservation de la saisie en cas de refus, piège de focus et retour au bouton initial.

Le diagnostic du clignotement montrait un changement de hauteur de page de
1 351 à 1 387 px pendant le MBZ, puis 1 387 → 1 408 → 1 387 px pour Word. Les
commandes passaient aussi de 100 % à 50 % d’opacité. Après correction, les messages
occupent une place réservée et les commandes gardent leur présentation pendant
l’export ; une icône indique le travail. Les clics concurrents sont ignorés.

## Rejouer

```sh
node tests/run_parcours_stabilite.mjs
node tests/run_parcours.mjs
node scripts/check-shared-i18n.mjs
```

Le nouveau banc passe **121 contrôles** sur quatre configurations : français
1440 px, français 390 px, arabe 390 px et breton 390 px. Il importe le véritable
exemple `test_1.json`, modifie sa banque, enregistre puis ouvre les vraies questions
du simulateur. Il couvre Annuler, Fermer, Suivante, Aperçu, le refus au clavier
et l’abandon accepté, sans dialogue natif. Le nom du Test est également vérifié
dans les douze langues de l’éditeur individuel.

Les **28 téléchargements réels** couvrent le MBZ et les deux documents du parcours
en DOCX, ODT et PDF. À chaque frame, le banc compare la position, les dimensions,
les polices et l’opacité des commandes, le cadre de l’atelier et la hauteur de page :
**une seule présentation distincte pour chacun des 28 exports**. Les animations du
navigateur restent actives. Le réseau externe est bloqué : le PDF utilise le
véritable repli local jsPDF. Aucun test du serveur PDF distant dans ce banc.

Les douze bancs antérieurs passent aussi, dont les vrais lecteurs H5P et leurs
commandes clavier : **886 + 121 = 1 007 contrôles réussis**. Les 1 009 clés
littérales de l’éditeur et de l’export existent dans les douze langues.

## Pièces conservées

- `edition-fr-1440.png`, `edition-br-390.png`, `edition-ar-390.png` : cadre et commandes.
- `annulation-fr-1440.png` : confirmation unique.
- `apercu-fr-1440.png` : aperçu après enregistrement.
- `validation-stabilite.txt` : sortie du nouveau banc.

Cette vérification porte sur la relecture et les exports locaux. Les messages de
diagnostic d’erreur peuvent naturellement prendre plus de place. Les restaurations
réelles Éléa/Magistère/Moodle restent suivies séparément dans le PRD.
