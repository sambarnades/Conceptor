# Recette Mots mêlés — 11 septembre 2026

Référence : **13-FindTheWords.h5p**, H5P.FindTheWords 1.4.4, retouche RELU enregistrée par l’utilisateur dans Éléa. Bibliothèque identique dans le lecteur local.

- Correction effective : le nettoyage Caramel supprimait les lettres grecques, assimilées à des symboles mathématiques, puis filtrait tout alphabet non latin. Les lettres Unicode et marques diacritiques sont maintenant conservées en NFC ; les plafonds de taille restent appliqués.
- Les prompts des 12 langues autorisent accents et alphabets de la langue cible ; 24 assemblages vérifiés. Aucune nouvelle génération IA.
- Le processeur conserve les libellés natifs personnalisés. Validation partagée : mots composés de lettres, pas de chiffres ou espaces internes, liste non vide. Le réglage d’alphabet et les huit orientations restent éditables ; leurs placements documentaires sont tous exercés.
- Sauvegardes/réouvertures dans les deux hôtes ; annulation Sucrerie sans persistance. Le callback local Sucrerie ne prouve pas une sauvegarde en base distante.
- Paquets finaux : `PARIS,ROME,ΑΘΗΝΑ,ÉTÉ` conservés. Grille horizontale avec vocabulaire et grille verticale ascendante sans vocabulaire jouées au pointeur : 0/4, affichage de solution, reprise, puis **4/4** automatique au dernier mot.
- **Limite native reproductible, non corrigée dans Éléa** : lorsque la consigne occupe deux lignes, H5P 1.4.4 calcule le point final avec un décalage vertical plafonné à ¾ de case, au lieu de la position du canvas. Le centre des cases échoue dans la sonde masquée ; leur quart supérieur réussit. Capture `limite-native-pointage.png`, coordonnées de recette dans le script. La bibliothèque distante n’a pas été modifiée. La clôture de l’audit ne signifie pas disparition de cette limite du lecteur natif.
- **12 DOCX/ODT/PDF relus**, quatre mots présents dans chaque correction, grilles énoncé/corrigé cohérentes et orientations respectées ; vocabulaire masqué respecté. Les grilles sont recalculées pour chaque export Sucrerie.
- **202 assertions éditeur/documents**, **1152 assertions robustesse/grilles**, 22 contrôles de conservation et 64 adaptateurs Sucrerie sans échec. Miroirs conformes, 1109 clés partagées présentes dans 12 langues.

Preuves dans bas : `tests/sonde-parcours/audit-activites-2026-09-11/mots-meles/`.

```sh
node tests/run_h5p_capabilities_documents.mjs --find-words-only
node tests/run_native_mots_meles_play.mjs
node tests/run_browser_suite.mjs --suite=robustness,grid-export
# Sucrerie :
node tests/editor/run-mots-meles-ui.mjs
```

Branches emmanuel ; aucun push/déploiement ; RAG coupé.

## Mise à jour du 12 septembre

Défaut corrigé et joué dans les deux lecteurs locaux. La réserve Éléa reste ouverte : [correctifs, limites et preuves](CORRECTIFS_LECTEURS_H5P_2026-09-12.md).
