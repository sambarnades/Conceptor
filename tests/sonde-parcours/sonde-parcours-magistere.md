# Sonde de parcours — magistere

Fichier : `sonde-parcours-magistere.mbz` (54.0 Ko)
Généré par : `node scripts/generer-parcours-sonde.mjs --plateforme=magistere`

> **Une fois importé, le cours doit s'appeler « Sonde Caramel 28/09 08:31 — magistere ».**
> Si le titre affiché diffère, c'est un ANCIEN fichier qui a été importé, et
> tout ce qui suit ne vaut rien. Régénérez, réimportez.

Ce fichier ne contient AUCUN texte produit par une IA : il part des exemples
du dépôt. Il ne met à l'épreuve que l'ASSEMBLAGE — c'est la seule question
qu'un banc local ne peut pas trancher à la place de la plateforme.

Le régénérer donne le même cours (mêmes sections, mêmes activités, mêmes
textes) : deux imports sont comparables. Seuls les horodatages internes
changent — sans effet sur la restauration.

## Comment l'importer

1. Créer un cours VIDE (ne pas réutiliser un cours existant : on veut voir
   exactement ce que le fichier pose, et rien d'autre).
2. Administration du cours → **Restauration**, déposer le `.mbz`.
3. Choisir **« Fusionner la sauvegarde avec ce cours »**, tout laisser par
   défaut, puis valider jusqu'au bout.
4. Noter **tout message d'avertissement** de l'assistant de restauration :
   c'est là que Moodle signale une référence qu'il n'a pas su résoudre.

## Ce qu'il faut regarder, dans cet ordre

### a. La structure du cours

- [ ] Le cours compte **6 sections** nommées (plus la zone
      « Généralités », qui ne contient que le texte d'accueil) :
      - 1 — Le pool de fichiers (H5P)
      - 2 — Les modules Moodle auto-porteurs
      - 3 — Les modules propres au parcours
      - 4 — Modules natifs — faire le point, s’exercer (27 sept. 2026)
      - 5 — Modules natifs — échanger, coopérer (27 sept. 2026)
      - 6 — La banque de questions (Test natif)
- [ ] Il compte **25 activités** au total, dans l'ordre ci-dessous,
      plus **8 textes** posés dans la page (D64).
- [ ] Chaque section s'ouvre sur son **texte d'introduction**, AU-DESSUS de ses
      activités, lisible sans cliquer, sans lien ni case d'achèvement.
- [ ] Aucune section vide ni dupliquée, aucune activité en double.

### b. Chaque activité, une par une

**1 — Le pool de fichiers (H5P)**

- [ ] **Sonde H5P — Cartes mémoire** (Flashcards) — L'activité s'ouvre et les cartes se retournent.
- [ ] **Sonde H5P — Quiz à plusieurs questions** (QuizSet) — Les sous-questions défilent et le score s'affiche à la fin.

**2 — Les modules Moodle auto-porteurs**

- [ ] **Sonde Moodle — Page** (Page) — La mise en page et les titres sont là.
- [ ] **Sonde Moodle — Livre** (Livre) — Le sommaire liste tous les chapitres, dans l'ordre.
- [ ] **Sonde Moodle — Devoir** (Devoir) — La grille d'évaluation est complète.

**3 — Les modules propres au parcours**

- [ ] **Sonde — Texte de liaison** (parcours_etiquette) — Le texte s'affiche à même la page de la section, sans qu'on clique.
- [ ] **Sonde — Forum** (parcours_forum) — Le forum s'ouvre, la consigne est là, et on peut lancer un fil.
- [ ] **Sonde — Sondage** (parcours_sondage) — Les TROIS options sont proposées et le vote fonctionne.
- [ ] **Sonde — Nuage de mots** (parcours_nuage_mots) — Le champ de saisie accepte un mot, et le nuage se dessine. La consigne « à quoi te fait penser… » est bien VISIBLE, distincte de la description.
- [ ] **Sonde — Mur de post-it** (parcours_mur_notes) — Les TROIS colonnes sont là, dans cet ordre. La 2e est RACCOURCIE (« Ce que je crois » : titre limité à 20 caractères par Moodle), la 3e fait exactement 20 caractères et doit passer INTACTE. On peut coller une note.

**4 — Modules natifs — faire le point, s’exercer (27 sept. 2026)**

- [ ] **Sonde — Lien web** (parcours_lien) — Le lien ouvre l’article Wikipédia « Cycle de l’eau » dans un NOUVEL onglet.
- [ ] **Sonde — Questionnaire** (parcours_questionnaire) — QUATRE questions, dans l’ordre : choix unique (3 choix), cases à cocher (3 choix), oui/non, réponse libre.
- [ ] **Sonde — Leçon** (parcours_lecon) — TROIS pages : « Continuer » sur la 1re ; la 2e pose une question (3 réponses) qui ne laisse passer qu’avec « Le Soleil » ; la 3e termine la leçon.
- [ ] **Sonde — Paquetage IMS** (parcours_ims) — TROIS pages dans la table des matières, dans l’ordre ; « Évaporation & condensation » s’écrit avec son « & » ; la 1re page montre un intertitre « Quatre étapes », une liste de quatre puces et « évaporation » en gras ; les boutons Précédent / Suivant du lecteur passent d’une page à l’autre.
- [ ] **Sonde — Atelier** (parcours_atelier) — L’atelier est en phase « Mise en place », avec les deux consignes et TROIS critères (onglet « Formulaire d’évaluation »).
- [ ] **Sonde — Base de données** (parcours_base) — TROIS champs (Lieu, Observation, Étape du cycle) ; on peut ajouter une fiche.

**5 — Modules natifs — échanger, coopérer (27 sept. 2026)**

- [ ] **Sonde — Tableau** (parcours_tableau) — TROIS colonnes à ces titres, dans l’ordre ; on peut y déposer une note.
- [ ] **Sonde — Wiki** (parcours_wiki) — Le wiki s’ouvre sur la création de la page « Lexique de la classe ».
- [ ] **Sonde — Glossaire à construire** (parcours_glossaire) — Le glossaire est VIDE et accepte une entrée.
- [ ] **Sonde — Document collaboratif** (parcours_document) — Le document s’ouvre et contient le plan de départ (Compte rendu, 1. Hypothèse…).
- [ ] **Sonde — Etherpad** (parcours_etherpad) — Le bloc-notes s’ouvre et accepte du texte.
- [ ] **Sonde — Partage de fichiers** (parcours_depot) — Le dépôt s’ouvre et accepte un fichier ; aucune date limite.
- [ ] **Sonde — Classe virtuelle** (parcours_classe_virtuelle) — La salle existe (salle seule, sans enregistrement) ; l’enseignant y est animateur.
- [ ] **Sonde — Choix de groupe** (parcours_choix_groupe) — Le choix de groupe existe, SANS option (aucun groupe dans le cours) : c’est attendu.

**6 — La banque de questions (Test natif)**

- [ ] **Sonde Moodle — Test** (test_elea) — Le Test contient TOUTES ses questions, chacune notée, et la banque de questions du cours porte une catégorie à son nom.

### c. Le carnet de notes

- [ ] Ouvrir le carnet de notes : chaque activité notée y a SA ligne, une seule.
- [ ] Aucune ligne orpheline, aucune catégorie en double.

### d. La banque de questions (si le Test est présent)

- [ ] Banque de questions du cours → une catégorie au nom du Test.
- [ ] Elle contient toutes ses questions, chacune ouvrable sans erreur.
- [ ] Le Test lui-même les enchaîne et rend une note.

### e. Les modules propres au parcours

Leur XML est le seul que Caramel écrit lui-même, sans passer par un processeur
éprouvé. C'est donc ici, et nulle part ailleurs, qu'ils se valident.

**Déjà validés** par l'aller-retour du 4 sept. 2026 (Éléa ET Magistère) —
à re-cocher seulement en cas de doute :

- [ ] Le **texte de liaison** s'affiche à même la page, sans qu'on clique.
- [ ] Le **forum** s'ouvre, porte sa consigne, et permet de lancer un fil.
- [ ] Le **sondage** propose bien ses TROIS options, et le vote fonctionne.

**Validés** eux aussi, par l'aller-retour Magistère du 4 sept. 2026 :

- [ ] Le **nuage de mots** s'ouvre. Sa QUESTION (« à quoi te fait penser… »)
      est visible, et distincte de sa description. Un mot saisi apparaît.
- [ ] Le **mur de post-it** montre ses TROIS colonnes, dans l'ordre. La
      deuxième s'affiche RACCOURCIE — « Ce que je crois » : Moodle plafonne
      le titre d'une colonne à 20 caractères. On peut y coller une note.
- [ ] Aucun des deux ne provoque d'erreur à la restauration.

> Le raccourcissement de la deuxième colonne n'est PAS un défaut : Moodle
> stocke le titre d'une colonne en `char(20)`, et un dépassement ne tronque
> pas — il fait échouer la restauration du cours entier. Cf. § 7 du PRD.

**À valider** — les modules natifs ouverts le 27 sept. 2026 (D70), sections
« Modules natifs ». Chaque carte dit quoi regarder ; en plus :

- [ ] La restauration va au bout, sans module écarté.
- [ ] En tête du cours, une étiquette **« À faire avant d’ouvrir le cours »**,
      marquée « Caché pour les étudiants », liste l’atelier, la classe
      virtuelle et le choix de groupe.
- [ ] L’étape qui suit « échanger, coopérer » n’attend PAS le wiki, le document,
      l’Etherpad, le dépôt, la classe virtuelle ni le choix de groupe : seuls le
      tableau et le glossaire (qui ont un achèvement) la conditionnent.

### f. L'ouverture progressive — le second module à valider

Les étapes 2 à 6 portent une restriction d'accès : chacune
ne s'ouvre que lorsque TOUTES les activités de la précédente sont terminées.
La condition est posée sur la SECTION, pas sur chaque activité.

- [ ] **La restauration va au bout.** Une condition qui pointerait dans le
      vide rendrait l'étape indisponible pour toujours.
- [ ] **L'étape 1 est OUVERTE**, sans aucune restriction. Si elle est fermée,
      le parcours entier est inaccessible et tout le reste est sans objet.
- [ ] Les étapes suivantes s'affichent **grisées mais VISIBLES**, avec la
      raison en clair (« Non disponible tant que… est marqué comme terminé »).
      Si elles sont invisibles, le réglage `showc` n'a pas été compris.
- [ ] Ouvrir les réglages d'une étape restreinte : la condition doit y être
      lisible, et **nommer les activités de l'étape précédente** — pas des
      identifiants orphelins ni des activités d'un autre cours.
- [ ] La condition ne nomme **aucun texte d'introduction** : un texte ne
      s'achève jamais, et l'étape suivante resterait fermée pour toujours.
- [ ] Terminer TOUTES les activités de l'étape 1, puis recharger : l'étape 2
      doit s'ouvrir. **C'est le seul contrôle qui prouve la chaîne entière** —
      l'achèvement, le remappage des identifiants et la condition.

> Ce qu'on cherche vraiment ici : Moodle REMAPPE-T-IL les identifiants de
> module à l'intérieur de la condition ? Le backup les écrit avec les nôtres ;
> le cours d'accueil en a d'autres. C'est une fonction de base de Moodle et
> elle devrait suivre, mais nous ne l'avons jamais vue faire — et le mode
> d'échec est une étape verrouillée à vie.

### g. Le retour (facultatif, mais c'est là qu'on apprend le plus)

- [ ] Ré-exporter le cours depuis la plateforme (Sauvegarde), récupérer le
      `.mbz` produit, et comparer : ce que Moodle a gardé, réécrit ou jeté
      dit exactement ce que notre synthèse doit corriger.

## Écarté à la fabrication

- Sonde Éléa — QCM (QCM) — absent de la palette « magistere »
- Sonde Éléa — Millionnaire (Millionnaire) — absent de la palette « magistere »
- Sonde Éléa — Appariement (Appariement) — absent de la palette « magistere »
- Sonde — Enquête (Feedback) (parcours_enquete) — absent de la palette « magistere »

## À reporter dans le PRD

Quel que soit le résultat, il va dans `docs/PRD_PARCOURS.md` — § 11 (journal)
si tout passe, § 7 (pièges) si quelque chose casse. Un aller-retour dont le
résultat n'est pas écrit devra être refait.
