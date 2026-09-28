# Recette Rédaction — 11 septembre 2026

Référence de plateforme : retour utilisateur **04-Essay.h5p**, H5P.Essay **1.5.13**, mot-clé retouché avec RELU. Les compléments ont été testés dans le lecteur natif local ; aucun nouveau dépôt Éléa ni appel IA annoncé.

## Capacités réalisées

- Mots-clés, variantes, points, occurrences, casse, tolérance aux fautes, retours présent/absent et choix du mot affiché dans chaque retour : champs natifs éditables et conservés.
- Limites en caractères, taille du champ 1/3/10 lignes, nouvelle tentative, mode sans notation et points de remise, seuils réussite/maîtrise, remplacements globaux et traitement des retours à la ligne. Le choix « Selon chaque mot-clé » retire les anciens remplacements globaux après fusion Sucrerie.
- Les limites et seuils facultatifs ne sont plus inventés par le processeur. Les libellés personnalisés sont préservés. Bornes invalides et mots-clés vides refusés ; zéro point et anciens mots-clés simples acceptés.
- Média natif image/audio/vidéo conservé, ajouté, remplacé et supprimé dans les deux hôtes. Fichiers présents dans les six archives produites. Traitement du média commun avec Glisser les mots.
- Prompts dans les 12 langues, **24 assemblages rapide/avancé** contrôlés. Aucun appel de génération distant.
- Caramel : retours, taille, seuil, sauvegarde/réouverture et empaquetage. Sucrerie : consigne/taille modifiées par contrôles visibles, sauvegarde via callback local, réouverture, annulation et suppression du média. Pas de persistance serveur annoncée.
- Lecteur natif depuis les paquets Sucrerie : minimum 10 caractères, maximum 200, aide et 10 lignes présents ; réponse sans mot-clé, retour d’erreur, modèle, reprise puis variante `energie` acceptée **2/2**. Mode sans notation sans barre de score, et reprise absente lorsqu’elle est désactivée.
- **18 documents DOCX/ODT/PDF relus visuellement** : limites et média côté élève ; modèle, mots-clés, variantes, points, occurrences, casse, tolérance et retours côté corrigé. Corrigé QuizSet également vérifié.

## Limite du moteur natif documentée

Avec tolérance désactivée, `energie` est reconnu dans « Cette energie vient du Soleil. », mais pas dans « de l’energie ». Le moteur natif ne sépare pas cette apostrophe typographique comme une frontière de mot. Ajouter la forme complète dans les variantes si elle doit être acceptée, ou choisir une tolérance adaptée. Aucun patch local du vendor n’est présenté comme une correction d’Éléa.

## Preuves et contrôles

- **202 assertions navigateur, 0 échec** ; **22 contrôles de conservation Sucrerie**.
- Audit des champs : 55/55/39 champs transmis dans trois exemples Essay, zéro champ sans effet et zéro erreur (hors champs spécialisés). Rapport extrait `redaction/champs-transmis.json`. L’audit général a émis de nombreux avertissements de sanitizer dans son environnement Node ; il ne vaut pas une recette de rendu et a été conservé tel que généré.
- Miroir : 51 fichiers identiques ; 1099 clés partagées présentes dans 12 langues.
- `tests/sonde-parcours/audit-activites-2026-09-11/redaction/` : 6 H5P, 18 documents, captures, résultats JSON et SHA-256.

```sh
node tests/run_h5p_capabilities_documents.mjs --essay-only
# Depuis Sucrerie :
node tests/editor/run-redaction-ui.mjs
# Depuis Caramel :
node tests/run_native_essay_play.mjs
node tests/run_browser_suite.mjs --suite=document-export,editor-activities
```

Branches `emmanuel`, commits locaux consignés dans les suivis. Aucun push ni déploiement ; ingestion RAG coupée.
