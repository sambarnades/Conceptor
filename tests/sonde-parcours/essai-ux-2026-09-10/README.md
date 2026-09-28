# Essai réel du parcours — harmonisation des quatre écrans

10 septembre 2026, branche `bas/emmanuel`. Autorisé par Emmanuel pour éprouver
le parcours complet avec ILaaS. Aucun déploiement ni modification de workflow.

## Fichiers à relire

- [Scénario complet](scenario-complet.json) : à ouvrir avec « Reprendre un
  scénario » dans Caramel ; contient le plan et les huit activités générées.
- [Parcours Moodle](parcours-trente-glorieuses.mbz) : archive téléchargée depuis
  le véritable écran de livraison, après génération des huit activités.
- [Plan avant fabrication](scenario-plan.json).
- Relevés des appels : [plan](appels-plan.json), [fabrication](appels-fabrication.json),
  et [bilan d’assemblage](bilan.json).
- Captures finales : [plan sur ordinateur](plan-1440.png), [plan sur mobile](plan-390.png),
  [fabrication](fabrication-1440.png), [livraison](livraison-1440.png),
  [livraison sur mobile](livraison-390.png).

## Déroulement et résultat

Sujet : les Trente Glorieuses en troisième, révision de la croissance, des
transformations économiques et sociales et de leurs limites. Plateforme Éléa,
à distance, ampleur courte, trame automatique.

Un appel de plan, puis huit appels de fabrication **successifs**, tous servis
par `mistral-small-4-119b`, sans repli de modèle. Huit activités produites sur
huit : Frise chronologique, Glossaire, Quiz QCM, Appariement Éléa, Ordonner les
paragraphes, Quiz Vrai/Faux, Texte à trous et Résumé.

L’archive comprend quatre étapes pédagogiques et la section d’accueil, soit
cinq sections comptées par l’assembleur. Aucune erreur JavaScript relevée dans
le trajet de fabrication et d’export. Carte de progression et ouverture
progressive désactivées.

La reprise de ce fichier a révélé un défaut corrigé en D56 : le Glossaire
peut être généré comme tableau de panneaux à la racine. Le processeur le gère,
mais la validation du scénario le refusait. L’import accepte désormais ce
format pour le Glossaire ; il continue de refuser une liste pour les modules
qui attendent un objet.

Après correction, scénario complet réimporté et **huit aperçus réellement
ouverts**, dans les lecteurs H5P/Éléa de Caramel, sans erreur JavaScript.
Le [relevé des aperçus](bilan-apercus.json) garde le module et un extrait du texte
présent dans chaque lecteur. Ce contrôle porte sur leur ouverture, pas sur une
validation pédagogique de toutes les questions.

## Observation de calibrage à reprendre

Le modèle a proposé **huit activités alors que l’ampleur courte en demande
trois à quatre**. La normalisation applique le plafond général de douze, mais
ne contrôle pas encore la fourchette demandée ni le rythme exact de la trame.
Cet essai sert donc à éprouver un écran dense et huit types de contenu ; il ne
valide pas le respect de l’ampleur. Prévoir une validation de la réponse et une
correction ciblée avant de considérer ce point comme consolidé. Aucun contenu
n’a été supprimé arbitrairement pour faire rentrer le résultat dans la limite.

## Reste à relire humainement

Exactitude des contenus, qualité didactique et restauration réelle sur une
instance cible. L’assemblage réussi et les aperçus locaux ne remplacent pas
ces contrôles. Les métadonnées françaises de l’archive correspondent à cet
essai ; les libellés d’interface restent disponibles dans les douze langues.
