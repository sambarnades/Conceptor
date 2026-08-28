# Brief de traduction — breton (`br`)

Document à transmettre TEL QUEL à l'IA (ou au traducteur) chargée de la traduction.
Le câblage applicatif est déjà fait : il ne reste que le contenu.

État au 28-08-2026 : les 4 fichiers existent et sont des **copies conformes du
français**. Caramel fonctionne déjà en « breton » — il affiche du français en
attendant. Chaque fichier traduit se substitue à sa copie, sans autre modification
de code.

---

## Fichiers à traduire, par ordre de priorité

| # | Fichier | Volume | Ce qu'il pilote |
|---|---|---|---|
| 1 | `js/locales/br.json` | 2874 clés, ~398 Ko | **Le plus important.** Interface, libellés écrits dans les `.h5p`/`.mbz` exportés, ET les prompts envoyés à l'IA |
| 2 | `assets/data/tutorial/br.json` | ~45 Ko | Contenu de la modale « Tutoriel » |
| 3 | `js/caramelia/locales/br.json` | 151 clés, ~12 Ko | Interface du chatbot Caramelia |
| 4 | `js/caramelia/tuto-rag/br.md` | ~17 Ko | Base de connaissances envoyée au LLM de Caramelia |

Le fichier 1 peut être traité seul : les trois autres ont un repli français câblé et
ne cassent rien tant qu'ils ne sont pas traduits.

---

## Prompt à donner à l'IA traductrice

> Tu traduis du **français vers le breton (brezhoneg)** un fichier de localisation
> JSON d'une application web éducative destinée aux enseignants (Caramel, qui génère
> des activités pédagogiques H5P et Moodle).
>
> **Registre** : breton standard écrit (peurunvan), tutoiement pour l'élève,
> vouvoiement pour l'enseignant — le français source distingue déjà les deux, garde
> la distinction. Vocabulaire scolaire : *skol*, *skolaj*, *lise*, *skoliad/skolidi*,
> *kelenner(ez)*, *goulenn*, *respont*, *kentel*.
>
> **Règles absolues — une seule violation casse l'application :**
>
> 1. **Ne traduis JAMAIS les clés** (à gauche du `:`). Seules les valeurs changent.
> 2. **Conserve exactement les 2874 clés, dans le même ordre.** N'en ajoute, n'en
>    supprime, n'en réordonne aucune.
> 3. **JSON strict** : `"` échappé en `\"`, `\` en `\\`. Le fichier doit rester
>    parsable. Indentation : 2 espaces, comme le fichier source.
> 4. **Espaces réservés en MAJUSCULES entre crochets — à recopier tels quels :**
>    `[QUI]`, `[QUOI]`, `[NIVEAU]`, `[NOMBRE_ELEMENTS]`, `[RAG]`, `[X]`, `[Y]`.
> 5. **Jetons de substitution `@…` — à recopier tels quels**, jamais traduits :
>    `@total`, `@score`, `@index`, `@count`, `@current`, `@answered`, `@question`,
>    `@card`, `@clue`, `@minutes`, `@seconds`, `@finals`, `@totals`, `@slideName`…
>    (39 jetons distincts). Idem pour `:num`, `:total`, `:score` et `{{…}}`.
>    Tu peux les DÉPLACER dans la phrase si la syntaxe bretonne l'exige ; jamais les
>    récrire.
> 6. **Le séparateur `||`** (32 occurrences) marque une alternative lue par le
>    générateur de prompts : il doit rester présent, au même endroit dans la phrase.
> 7. **Balises HTML** (`<strong>`, `<li>`, `<code>`, `<br>`, `<a href=…>`, `<span
>    class=…>`…) : structure et attributs inchangés, seul le texte entre balises
>    est traduit.
> 8. **LaTeX** : `\\(`, `\\)`, `\\[`, `\\]`, `\\frac{1}{2}` — recopier au caractère
>    près, **le nombre d'antislashs compte**. Chaque délimiteur ouvrant garde son
>    fermant.
> 9. **Blocs ` ```json ` ** (36 clés `prompt_*_exemple_rendu`) : ce sont des exemples
>    de la sortie attendue de l'IA. **Les noms de champs JSON à l'intérieur
>    (`title`, `description`, `cards`, `text`, `answer`, `tip`, `questions`…) ne se
>    traduisent PAS** — c'est le contrat que lisent les processeurs. Seules les
>    valeurs d'exemple deviennent bretonnes.
> 10. **Identifiants techniques inchangés** : `H5P.MultiChoice`, `H5P.Blanks`,
>     `FindTheWords`, `DragTheWords`, `FillInTheBlanks`, `MarkTheWords`,
>     `taskDescription`, ainsi que les noms de bibliothèques des clés `legal_library_*`
>     (flag-icons, MathJax, JSZip, DOMPurify…) et les noms de plateformes
>     (H5P, Moodle, Éléa, Magistère, Sucrerie, Caramel, Caramelia).
> 11. **Symboles mathématiques Unicode** (`α`, `≤`, `→`…) : recopiés tels quels.
>
> **Cas particuliers à traiter avec soin :**
>
> - Les 122 clés `prompt_*` ne s'affichent jamais à l'écran : ce sont les
>   **instructions envoyées au modèle d'IA**. Elles doivent rester *impératives et
>   non ambiguës* en breton — c'est de la consigne machine, pas de la prose.
> - `prompt_regles_pedagogiques_communes` contient déjà, en français, la ligne qui
>   impose au modèle d'écrire en breton. **Traduis-la en conservant son sens exact :
>   tout le contenu généré doit être en breton, quelle que soit la langue des
>   sources fournies.** C'est la ligne qui décide de la langue des activités.
> - Les clés `legal_*` sont des **mentions légales** : traduction fidèle, aucune
>   reformulation ni ajout.
> - Les clés `error_*` et `validation_*` sont lues par un enseignant en situation de
>   blocage : phrases courtes, action claire.
>
> Rends le fichier JSON complet, sans commentaire ni texte d'accompagnement.

---

## Découpage si le fichier est trop gros pour un seul appel

`js/locales/br.json` fait ~398 Ko. S'il faut le découper, découper **par préfixe de
clé**, jamais au milieu du fichier — et réassembler dans l'ordre d'origine :

| Préfixe | Clés | Nature |
|---|---|---|
| `editor_*` | 929 | libellés de l'éditeur visuel |
| `eh_*` | 608 | aide contextuelle |
| `h5p_*` | 437 | libellés écrits dans les `.h5p` exportés |
| `doc_*` | 157 | exports DOCX/ODT/PDF |
| `prompt_*` | 122 | **instructions à l'IA** (le plus délicat) |
| `simulator_*` | 66 | simulateurs Éléa |
| `legal_*` | 65 | mentions légales |
| `validation_*` | 60 | messages de validation |
| reste | ~429 | interface générale, tutoriel, vidéo, erreurs… |

---

## Vérification au retour du fichier

**Obligatoire avant tout commit :**

```bash
node scripts/verifier-traduction-locale.mjs br            # structure + marqueurs + LaTeX
node scripts/verifier-traduction-locale.mjs br --verbeux  # détail des clés fautives
```

Ce script compare `br.json` à `fr.json` et échoue si une clé manque, si un jeton
`@…` a été traduit, si une balise HTML a disparu, si un délimiteur LaTeX a changé de
forme, ou si un nom de champ d'un exemple JSON a été traduit. Sa dernière section
affiche le pourcentage de valeurs réellement traduites — utile pour suivre
l'avancement d'une traduction livrée par lots.

Puis la chaîne complète :

```bash
node scripts/verify-all-locales.mjs      # contraintes LaTeX des 27 prompts clés
node tests/run_h5p_ui_coverage.mjs       # libellés H5P présents dans les 12 locales
node tests/run_legal_notices.mjs         # mentions légales × locales
node scripts/auditer-l10n-h5p.mjs        # 0 jeton incohérent, 0 libellé en anglais
node tests/run_browser_suite.mjs         # 42 suites navigateur
```

Enfin, un contrôle en situation : `python3 -m http.server 8000`, basculer en
Brezhoneg, générer une activité de chaque famille (un Quiz, un Texte à trous, une
Frise) et vérifier que le contenu produit est bien en breton.

---

## Ce qui restera en anglais, et pourquoi

Aucune bibliothèque H5P n'est traduite en breton (aucun `language/br.json` parmi les
221 libs de `js/vendor/h5p-libs`). Les libellés que Caramel **écrit lui-même** dans
le `content.json` seront bretons ; ceux que la **bibliothèque H5P affiche de son
côté** (certains boutons du lecteur) resteront anglais. Ce n'est pas rattrapable
depuis Caramel — cf. piège 14 de `CLAUDE.md`.

De même, le serveur de synthèse vocale (Piper) n'a pas de voix bretonne : l'activité
« Dictée » créée en interface bretonne utilise la voix française. Comportement voulu,
pas un défaut.
