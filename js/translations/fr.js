const translations_fr = {
    subtitle: "Création Assistée de Ressources et d'Activités Magistère et Éléa",
    help_button: "Aide",
    help_modal_title: "🚀 Guide complet de Caramel pour les enseignants",
    help_modal_content: `
    <p>Bienvenue sur <strong>Caramel</strong> ! Ce guide est conçu pour vous accompagner pas à pas, même si vous débutez. Notre objectif est de vous aider à créer des activités pédagogiques interactives, de manière simple et efficace.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Décrire</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Choisir</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Générer</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Télécharger</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Communauté</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> Notre philosophie : vous gardez la main !</h4>
        <p>Avec Caramel, l'intelligence artificielle est une assistante, mais c'est vous qui pilotez. Vous avez le contrôle à chaque étape :</p>
        <ul>
            <li><strong>Avant :</strong> C'est vous qui définissez le cadre pédagogique en remplissant les champs de description.</li>
            <li><strong>Pendant :</strong> Une fois le contenu généré par l'IA (le code JSON), vous pouvez le modifier directement dans l'éditeur pour l'ajuster.</li>
            <li><strong>Après :</strong> Même après avoir téléchargé le fichier, vous pouvez toujours l'ouvrir et le modifier dans d'autres outils si nécessaire.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Décrire votre besoin : le point de départ</h4>
        <p>Tout commence ici. Plus votre description sera claire, plus le résultat sera pertinent. Deux options s'offrent à vous :</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Mode Rapide</span></h5>
            <p>Idéal pour aller à l'essentiel. Remplissez les deux champs :</p>
            <ul>
                <li><strong>Qui êtes-vous ?</strong> Soyez direct. Pas besoin de phrase. Exemples : <em>Professeur de mathématiques</em>, <em>Formateur académique</em>.</li>
                <li><strong>Que souhaitez-vous aborder ?</strong> C'est le cœur de votre demande. Soyez aussi complet que possible. N'hésitez pas à inclure le thème, le niveau, et les contraintes. Exemple : <em>Une introduction aux fractions pour des élèves de 6e, avec des exemples concrets comme le partage d’un gâteau.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Mode Avancé</span></h5>
            <p>Pour une demande plus structurée, ce mode vous guide avec des champs précis :</p>
            <ul>
                <li><strong>Discipline, Thème, Niveau :</strong> Pour définir le contexte.</li>
                <li><strong>Nombre d'éléments :</strong> Très important ! Cela correspond au nombre de questions, de dates sur une frise, de mots dans un glossaire, etc.</li>
                <li><strong>Informations complémentaires :</strong> Un espace pour ajouter des consignes spécifiques, des contraintes ou tout autre détail pertinent.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Activer la consultation de document</span><br>
            Cette option puissante vous permet de baser la génération sur un contenu que vous fournissez. Vous pouvez soit <strong>copier-coller un texte</strong>, soit <strong>télécharger un fichier PDF</strong>.
            <br><strong><i class="fas fa-lock"></i> Confidentialité :</strong> Rassurez-vous, le traitement de votre document se fait <strong>entièrement en local sur votre ordinateur</strong>. Aucune donnée n'est envoyée sur Internet.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Choisir le type d'activité</h4>
        <p>Une fois la description faite, les tuiles d'activités deviennent accessibles. Cliquez sur celle qui correspond à votre objectif pédagogique.</p>
        <details>
            <summary><strong>Cliquez ici pour voir le détail des activités disponibles</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Activités interactives au format H5P. Celles marquées d'une étoile <span class="feedback-star">*</span> intègrent par défaut un feedback détaillé en 6 tranches de score.</p>
            <ul>
                <li><strong>Frise chronologique :</strong> Créez une frise interactive pour présenter une séquence d'événements.</li>
                <li><strong>Cartes mémoires :</strong> Créez des cartes recto-verso pour aider à la mémorisation.</li>
                <li><strong>Quiz (Question Set) <span class="feedback-star">*</span> :</strong> Composez une série de questions variées (QCM, glisser-déposer, etc.).</li>
                <li><strong>Glossaire :</strong> Créez un glossaire ou une FAQ sous forme d'accordéon dépliant.</li>
                <li><strong>Mots croisés <span class="feedback-star">*</span> :</strong> Générez une grille de mots croisés à partir de définitions.</li>
                <li><strong>Rédaction <span class="feedback-star">*</span> :</strong> Proposez un sujet de rédaction avec correction automatisée par mots-clés.</li>
                <li><strong>Résumé <span class="feedback-star">*</span> :</strong> Les élèves doivent reconstituer un résumé correct en choisissant les bonnes phrases.</li>
                <li><strong>Glisser les mots <span class="feedback-star">*</span> :</strong> Créez un texte où les élèves glissent les mots manquants.</li>
                <li><strong>Texte à trous <span class="feedback-star">*</span> :</strong> Les élèves doivent remplir les mots manquants au clavier.</li>
                <li><strong>Surligner les mots <span class="feedback-star">*</span> :</strong> Demandez aux élèves de surligner certains mots dans un texte.</li>
                <li><strong>Vrai/Faux :</strong> Créez des questions simples avec une réponse binaire.</li>
                <li><strong>Choix multiples <span class="feedback-star">*</span> :</strong> Créez des QCM avec une ou plusieurs bonnes réponses.</li>
                <li><strong>Mots mêlés :</strong> Créez une grille de lettres où les élèves doivent retrouver des mots.</li>
                <li><strong>Ordonner les paragraphes <span class="feedback-star">*</span> :</strong> Les élèves doivent remettre des paragraphes dans le bon ordre.</li>
                <li><strong>Série de choix uniques <span class="feedback-star">*</span> :</strong> Créez une série de questions avec une seule bonne réponse par question.</li>
                <li><strong>Cartes de dialogue :</strong> Créez des cartes interactives recto-verso avec texte et audio.</li>
                <li><strong>Texte à trous complexe <span class="feedback-star">*</span> :</strong> Un texte à trous avancé avec des feedbacks spécifiques pour chaque erreur.</li>
                <li><strong>Diagramme :</strong> Créez un diagramme circulaire ou en barres pour visualiser des données.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Test (XML / GIFT) :</strong> Génère une banque de questions variées (QCM, appariement, etc.) à importer dans un test Moodle.</li>
                <li><strong>QCM (MBZ) :</strong> Crée une activité QCM simple et rapide.</li>
                <li><strong>Appariement (MBZ) :</strong> Un jeu d'association entre des paires d'éléments.</li>
                <li><strong>Millionnaire (MBZ) :</strong> Un jeu de quiz ludique où la difficulté augmente à chaque question.</li>
                <li><strong>Glossaire (XML) :</strong> Produit un fichier pour importer une liste de définitions dans un glossaire Moodle.</li>
                <li><strong>Page (MBZ / HTML) :</strong> Construit une page de cours structurée et visuellement mise en forme pour Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Générer et affiner le contenu</h4>
        <p>Après avoir cliqué sur une tuile, une fenêtre s'ouvre. C'est ici que vous interagissez avec l'IA.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Option A : Générer en un clic</h5>
            <p>La voie rapide. Cliquez sur le bouton <button class="help-btn-example-llm">Générer en un clic</button> pour que l'IA produise le contenu et le place directement dans la zone de résultat à droite. Vous pouvez choisir entre différents modèles d'IA (rapide, puissant...) via la petite flèche sur le côté droit du bouton.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Option B : Utiliser une IA externe</h5>
            <p>Pour un contrôle maximal. Le prompt (instruction pour l'IA) apparaît à gauche.</p>
            <ol>
                <li>Modifiez le prompt si vous le souhaitez.</li>
                <li>Utilisez le bouton <strong>Copier le prompt</strong> et ouvrez une IA grand public de votre choix dans un nouvel onglet.</li>
                <li>Collez le prompt dans l'IA, récupérez sa réponse, et collez-la dans la zone de résultat à droite dans Caramel.</li>
            </ol>
            <p>Des icônes utiles sont là pour vous aider : <span class="help-badge-icon"><i class="fas fa-expand"></i> Plein écran</span> pour plus de confort, et <span class="help-badge-icon"><i class="fas fa-lock"></i> Verrouiller</span> pour protéger le prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Télécharger et intégrer votre activité</h4>
        <p>Une fois le contenu prêt, cliquez sur le bouton de téléchargement (ex: <button class="help-btn-example-download">Générer le H5P</button>). Voici comment intégrer les fichiers dans Éléa/Moodle :</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Activités H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>Méthode simple :</strong> Activez le mode édition dans votre cours, puis glissez-déposez le fichier .h5p directement dans la section de votre choix. Idéal pour un usage rapide sans partage complexe.</li>
                        <li><strong>Méthode recommandée (pour les concepteurs) :</strong> Cliquez sur "Ajouter une activité ou une ressource", choisissez "Contenu interactif (H5P)", puis dans le champ "Fichier", téléchargez votre .h5p. Cette méthode garantit que l'activité sera bien incluse si vous partagez votre parcours.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Page, Millionnaire, Appariement, QCM)</summary>
                <div class="import-content">
                    <p>Ce format importe une activité complète dans votre cours.</p>
                    <ol>
                        <li>Dans votre cours, allez dans le menu d'édition (roue crantée) et cliquez sur "Restaurer".</li>
                        <li>Glissez-déposez votre fichier .mbz dans la zone d'importation.</li>
                        <li>Suivez les étapes en cliquant sur "Continuer". L'activité sera ajoutée à votre cours.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> et <span class="help-badge-file">GIFT</span> (Activité Test)</summary>
                <div class="import-content">
                    <p>Ces formats importent des questions dans votre "Banque de questions".</p>
                    <ol>
                        <li>Allez dans le menu "Plus" de votre cours, puis "Banque de questions".</li>
                        <li>Cliquez sur l'onglet "Importer".</li>
                        <li>Choisissez le format "Format XML Moodle" ou "Format GIFT".</li>
                        <li>Glissez-déposez votre fichier dans la zone "Importer" et validez.</li>
                        <li>Vos questions sont maintenant dans la banque, prêtes à être ajoutées à une activité "Test".</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternative pour l'activité Page)</summary>
                <div class="import-content">
                    <p>Pour un contrôle manuel du contenu.</p>
                    <ol>
                        <li>Ouvrez le fichier .html avec un éditeur de texte (ex: Bloc-notes) et copiez tout son contenu.</li>
                        <li>Dans Éléa, ajoutez une activité "Page".</li>
                        <li>Dans l'éditeur de texte de la page, cliquez sur l'icône pour basculer en mode HTML (souvent représentée par \`</\>\`).</li>
                        <li>Collez le contenu que vous aviez copié, puis enregistrez.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Communauté et Support</h4>
        <p>Caramel est un projet vivant, et votre avis est précieux !</p>
        <ul>
            <li><strong>Discuter & Poser des questions :</strong> Rejoignez-nous sur le salon <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> pour échanger avec la communauté.</li>
            <li><strong>Signaler un bug :</strong> Un problème ? Créez un <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">ticket</a>. Si possible, joignez le fichier JSON qui a causé l'erreur, cela nous aide énormément à le corriger.</li>
            <li><strong>Soutenir le projet :</strong> Si l'outil vous plaît, laissez-nous une petite étoile sur la <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">page de la Forge</a>. C'est notre meilleure récompense !</li>
        </ul>
    </div>
    `,
    fast_mode: "Mode Rapide",
    guided_mode: "Mode Avancé",
    who_are_you: "Qui êtes-vous ? (ex: Enseignant, formateur...)",
    what_to_address: "Que souhaitez-vous aborder ? (ex: La nature d'un angle en 6e...)",
    discipline: "Discipline (ex : Histoire)",
    theme: "Thème (ex : La Révolution française)",
    level: "Niveau (ex : Seconde professionnelle)",
    number_of_elements: "Nombre d'éléments (ex : 5)",
    additional_info: "Informations complémentaires et spécifiques...",
    generate_prompts: "Générer les prompts",
    h5p_tab: "H5P",
    moodle_tab: "Modules Éléa/Moodle",

    // General Context (Advanced Mode)
    prompt_expert_intro: "Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ",
    prompt_context_title: "**Contexte :**",
    prompt_subject: "- **Matière :**",
    prompt_student_level: "- **Niveau des élèves :**",
    prompt_theme: "- **Thème :**",
    prompt_number_of_elements: "- **Nombre d'éléments :**",
    prompt_additional_info: "- **Informations complémentaires :**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "Je suis un(e) **",
    prompt_simple_intro_part2: "** et je souhaite **",
    prompt_language_instruction: "Le contenu généré doit être en français, sauf si une autre langue est spécifiée dans la demande.",
    prompt_code_block_instruction: "Tu dois générer le résultat dans un bloc de code.",

    // Timeline Prompt
    timeline_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Timeline\".",
    timeline_prompt_mission: "**Ta mission :**",
    timeline_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Timeline. Le JSON doit être directement utilisable.",
    timeline_prompt_json_structure_title: "**Structure du JSON attendu :**",
    timeline_prompt_json_structure_main_object: "L'objet principal doit contenir une clé \"timeline\". Cet objet \"timeline\" doit inclure :",
    timeline_prompt_headline: "`headline`: Un titre général pour la frise.",
    timeline_prompt_text: "`text`: Un court paragraphe d'introduction.",
    timeline_prompt_asset: "`asset`: Un objet pour l'image de couverture avec `media` (URL), `caption` (légende) et `credit` (source).",
    timeline_prompt_date_array: "`date`: Un tableau contenant ${nombreQuestions} objets, chacun représentant un événement.",
    timeline_prompt_era_array: "`era`: Un tableau d'objets pour définir des périodes couvrant plusieurs événements.",
    timeline_prompt_content_rules_title: "**Règles pour le contenu :**",
    timeline_prompt_rule1: "1.  Chaque événement dans le tableau `date` doit avoir :",
    timeline_prompt_rule1_startDate: "-   `startDate` et `endDate`: Dates au format \"AAAA,MM,JJ\" ou \"AAAA\". Utilisez `endDate` pour définir une période.",
    timeline_prompt_rule1_headline: "-   `headline`: Titre de l'événement.",
    timeline_prompt_rule1_text: "-   `text`: Description du texte. Utilise `*mot*` pour le gras, `**mot**` pour l'italique et `\\n` pour les sauts de ligne.",
    timeline_prompt_rule1_asset: "-   `asset`: Un objet optionnel pour une image illustrant l'événement.",
    timeline_prompt_rule1_tag: "-   `tag`: Un mot-clé qui caractérise la période (ex: 'histoire', 'science').",
    timeline_prompt_rule2: "2.  Pour chaque `asset`, recherche activement une image pertinente et libre de droits (ex: Wikimedia Commons). L'URL dans `media` doit être un lien direct et valide. Renseigne la source et la licence dans `credit`. Si aucune image appropriée n'est trouvée, omets complètement l'objet `asset`.",
    timeline_prompt_rule3: "3.  Pour chaque période (`era`), ajoute un champ `text` avec une brève description et un `tag`.",
    timeline_prompt_example_json_title: "**Exemple de structure JSON :**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Titre de la frise chronologique",
"text": "Introduction sur le thème de la *frise*.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Début de la Première Guerre mondiale",
"text": "L'Autriche-Hongrie déclare la **guerre** à la *Serbie*.",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "L'archiduc François-Ferdinand juste avant son assassinat.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "Guerre"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Armistice de 1918",
"text": "Signature de l'armistice à *Rethondes*, marquant la fin des combats.",
"tag": "Traité"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Première Guerre mondiale",
"text": "C'est la période de la Grande Guerre.",
"tag": "Période historique"
}
]
}
}
\`\`\` `,
    timeline_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire. Le résultat sera directement utilisé par un autre outil.",

    // Crossword Prompt
    crossword_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Crossword\".",
    crossword_prompt_mission: "**Ta mission :**",
    crossword_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité de mots croisés H5P.",
    crossword_prompt_json_structure_title: "**Structure du JSON attendu :**",
    crossword_prompt_json_structure_main_object: "L'objet doit contenir :",
    crossword_prompt_title: "`title`: Un titre pour l'activité.",
    crossword_prompt_words_array: "`words`: Un tableau de ${nombreQuestions} objets, chacun avec :",
    crossword_prompt_answer: "`answer`: Le mot à deviner.",
    crossword_prompt_clue: "`clue`: La définition correspondante. Il est interdit d'écrire le mot à trouver dans l'indice.",
    crossword_prompt_extra_clue_optional: "`extraClue` (optionnel): Un objet contenant un indice supplémentaire. Le texte de l'indice peut utiliser `*mot*` pour le gras, `**mot**` pour l'italique et `\\n` pour les sauts de ligne. L'IA doit juger de la pertinence d'en ajouter un.",
    crossword_prompt_task_description: "`taskDescription`: Une consigne claire et contextualisée. Utilise `*mot*` pour le gras, `**mot**` pour l'italique et `\\n` pour les sauts de ligne. Après un saut de ligne, précise les règles pour les mots composés : \"Pour les mots composés, ne mettez ni espace ni tiret (ex: 'portecles' pour 'porte-clés').\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",
    crossword_prompt_content_rules_title: "**Règles pour le contenu :**",
    crossword_prompt_rule1: "1.  RÈGLE STRICTE : Les mots (`answer`) ne doivent contenir que des lettres. Tout mot composé, acronyme ou expression doit être fusionné en un seul mot sans espaces, tirets ou autres caractères (ex: 'arc-en-ciel' devient 'arcenciel', 'D-DAY' devient 'DDAY').",
    crossword_prompt_rule2: "2.  Les définitions (`clue`) doivent être courtes et précises.",
    crossword_prompt_rule3: "3.  Le reste de la structure JSON (comportement, thème, etc.) doit être conservé tel quel.",
    crossword_prompt_example_json_title: "**Exemple de JSON pour un mot :**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Mots croisés sur la Biologie",
"words": [
{
"answer": "Cellule",
"clue": "Unité de base de la vie.",
"extraClue": {
"params": {
"text": "Elle peut être *animale* ou *végétale*."
}
}
},
{
"answer": "ADN",
"clue": "Molécule portant l'information génétique."
}
],
"taskDescription": "*Complète* la **grille** de mots croisés."
}
\`\`\` `,
    crossword_prompt_generate_only_json: "Génère le JSON complet et valide, en remplissant le titre, la description et le tableau \"words\", sans aucun autre commentaire.",

    // Crossword UI translations
    crossword_across: "Horizontal",
    crossword_down: "Vertical",
    crossword_check_answer: "Vérifier",
    crossword_try_again: "Recommencer",
    crossword_show_solution: "Afficher la solution",
    crossword_extra_clue: "Indice supplémentaire",
    crossword_close_window: "Fermer",
    crossword_submit_answer: "Valider",

    // Essay Prompt
    essay_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Essay\".",
    essay_prompt_mission: "**Ta mission :**",
    essay_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Essay.",
    essay_prompt_json_structure_title: "**Structure du JSON attendu :**",
    essay_prompt_json_structure_main_object: "L'objet doit contenir :",
    essay_prompt_task_description: "`taskDescription`: Une consigne claire invitant l'élève à rédiger un texte sur le thème. Utilise `*mot*` pour le gras, `**mot**` pour l'italique et `\\n` pour les sauts de ligne.",
    essay_prompt_keywords_array: "`keywords`: Un tableau de ${nombreQuestions} objets, chacun définissant un mot-clé que le système devra retrouver dans la réponse de l'élève.",
    essay_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",
    essay_prompt_content_rules_title: "**Règles pour le contenu :**",
    essay_prompt_rule1: "1.  Chaque objet dans `keywords` doit contenir la clé `keyword` avec le mot à rechercher.",
    essay_prompt_rule2: "2.  Les mots-clés doivent être pertinents et essentiels pour évaluer la compréhension du thème.",
    essay_prompt_rule3: "3.  La structure JSON (comportement, etc.) doit être conservée.",
    essay_prompt_rule4: "4. La consigne (`taskDescription`) doit inciter à la rédaction sans utiliser les mots-clés listés dans `keywords`, à l'exception du nom du thème si nécessaire pour la compréhension.",
    essay_prompt_example_json_title: "**Exemple de JSON pour un mot-clé :**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "Rédige un court texte expliquant la photosynthèse.",
"keywords": [
{
"keyword": "lumière",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "chlorophylle",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "Génère le JSON complet et valide, en remplissant la consigne et la liste de mots-clés, sans aucun autre commentaire.",

    // Moodle XML Prompt
    moodle_xml_prompt_role: "Tu es un expert en ingénierie pédagogique. Ta mission est de créer le contenu d'une activité Test avec sa banque de questions Moodle/Éléa en générant un objet JSON valide.",
    moodle_xml_prompt_intro: "Je souhaite créer un quiz de ${nombreQuestions} questions.",
    moodle_xml_prompt_content_title: "**Règles pour le contenu :**",
    moodle_xml_prompt_content_rule1: "- Les réponses incorrectes doivent être plausibles mais fausses.",
    moodle_xml_prompt_content_rule2: "- La difficulté des questions doit être variée.",
    moodle_xml_prompt_content_rule3: "- La formulation doit être simple et précise.",
    moodle_xml_prompt_content_rule4: "- Les feedbacks doivent expliquer brièvement la bonne réponse.",
    moodle_xml_prompt_question_types_intro: "**Structure JSON attendue :**\nL'objet principal doit contenir les clés suivantes :\n- `bank_name`: Un nom court et descriptif pour la banque de questions.\n- `bank_description`: Une phrase décrivant le contenu de la banque.\n- `questions`: Un tableau d'objets où chaque objet représente une question et doit avoir un `type` et un `content`.",
    moodle_xml_prompt_question_type_multichoice: `
- **Pour le type \`multichoice\` (QCM) :**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Titre de la question",
      "questiontext": "Énoncé de la question.",
      "feedback": "Feedback général.",
      "answers": [
        { "text": "Réponse 1", "fraction": 100, "feedback": "Feedback si choisie." },
        { "text": "Réponse 2", "fraction": 0, "feedback": "Feedback si choisie." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **Pour le type \`matching\` (Appariement) :**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Titre de la question",
      "questiontext": "Énoncé de la question.",
      "feedback": "Feedback général.",
      "subquestions": [
        { "text": "Texte question 1", "answer": "Réponse 1" },
        { "text": "Texte question 2", "answer": "Réponse 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **Pour le type \`numerical\` (Numérique) :**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Titre de la question",
      "questiontext": "Énoncé de la question.",
      "feedback": "Feedback général.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "Feedback pour la réponse." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **Pour le type \`truefalse\` (Vrai/Faux) :**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Titre de la question",
      "questiontext": "Énoncé de la question.",
      "feedback": "Feedback général.",
      "answer": { "value": true, "feedback_true": "Feedback si Vrai.", "feedback_false": "Feedback si Faux." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **Pour le type \`shortanswer\` (Réponse courte) :**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Titre de la question",
      "questiontext": "Énoncé de la question.",
      "feedback": "Feedback général.",
      "answers": [
        { "text": "Réponse exacte 1", "fraction": 100, "feedback": "Feedback si choisie." },
        { "text": "Réponse alternative", "fraction": 100, "feedback": "Feedback si choisie." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **Pour le type \`cloze\` (Texte à trous) :**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Titre de la question",
      "questiontext": "Ceci est un texte avec un trou {1:SHORTANSWER:=Bonne réponse~Feedback} et un autre {1:MULTICHOICE:=Bonne réponse~Mauvaise réponse}.",
      "feedback": "Feedback général."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**Consignes finales :**",
    moodle_xml_prompt_form_rule1: "Répartis équitablement les questions entre les différents types.",
    moodle_xml_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire. Le résultat doit être un objet JSON unique contenant la clé `questions`.",

    // Création test Éléa
    moodle_xml_success_generation: "Fichier {fileName} généré avec succès !",
    test_error_creation_mbz: "Erreur lors de la création du MBZ pour le Test:",
    test_success_generation: "Fichier {fileName} généré avec succès !",
    test_error_generic: "Erreur :",
    test_backup_log: "Sauvegarde créée automatiquement par Caramel\n",

    // GIFT Prompt
    gift_prompt_role: "Tu es un expert en ingénierie pédagogique créant une banque de questions pour une activité Test sur Moodle/Éléa au format GIFT.",
    gift_prompt_intro: "Je souhaite créer un quiz de ${nombreQuestions} questions.",
    gift_prompt_format_info: "Le quizz doit être au format GIFT, destiné à être importé dans Moodle.",
    gift_prompt_question_quality: "Chaque question doit être claire, concise, sans ambiguïté. Il faut qu'il ait des feedbacks détaillés.",
    gift_prompt_code_format_intro: "Le code doit être exactement au même format que celui fourni ci-dessous:",
    gift_prompt_example_question_comment: "// question: 1  name: Quel est l'objet central de notre système solaire ?",
    gift_prompt_example_question_text: "::Quel est l'objet central de notre système solaire ?::Quel est l'objet central de notre système solaire ?{",
    gift_prompt_example_answer_correct: "=Le Soleil#Exact ! Le Soleil est l'étoile centrale de notre système solaire. Bien joué !",
    gift_prompt_example_answer_incorrect1: "~La Lune#Faux. La Lune est un satellite naturel de la Terre. Le Soleil est l'objet central.",
    gift_prompt_example_answer_incorrect2: "~Jupiter#Faux. Jupiter est une planète géante gazeuse. Le Soleil est l'objet central.",
    gift_prompt_example_answer_incorrect3: "~La Terre#Faux. La Terre est la planète où nous vivons. Le Soleil est l'objet central.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "Le quiz doit comporter différents types de questions de manière aléatoire :",
    gift_prompt_question_type_multichoice: "- des questions QCM (multichoice), avec 1 bonne réponse et 3 distracteurs.",
    gift_prompt_question_type_truefalse: "- des questions vrai/faux (truefalse).",
    gift_prompt_question_type_numerical: "- des questions numériques (numerical) avec une marge d'erreur acceptable.",
    gift_prompt_question_type_matching: "- des questions d'appariement (matching) avec au moins 4 paires.",
    gift_prompt_generate_only_gift: "Génère directement le quiz au format GIFT, sans commentaires ni balises supplémentaires. Respecte scrupuleusement le format décrit, car je vais coller le résultat dans un autre outil qui attend ce format. Produis la réponse sous forme de code préformaté.",

    // Flashcards Prompt
    flashcards_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Flashcards\".",
    flashcards_prompt_mission: "**Ta mission :**",
    flashcards_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Flashcards. Le JSON doit être directement utilisable.",
    flashcards_prompt_json_structure_title: "**Structure du JSON attendu :**",
    flashcards_prompt_json_structure_main_object: "L'objet doit contenir :",
    flashcards_prompt_title: "`title`: Un titre pertinent pour l'activité.",
    flashcards_prompt_description: "`description`: Une consigne claire pour l'élève.",
    flashcards_prompt_association_principle: "Le recto et le verso doivent être reliés par un critère unique et stable (ex.: définition→terme, figure→nombre de côtés, événement→date, auteur→œuvre). Utilise la même relation pour toutes les cartes et formule la consigne ainsi : « Associe chaque X à Y ». Réponses (`answer`) normalisées : un mot simple ou un nombre, minuscules, sans article ni ponctuation ; nombres en chiffres.",
    flashcards_prompt_cards_array: "`cards`: Un tableau de ${nombreQuestions} objets, où chaque objet représente une carte et contient :",
    flashcards_prompt_text: "`text`: La question ou le terme à deviner (recto).",
    flashcards_prompt_answer: "`answer`: La réponse ou la définition (verso). Attention, important : answer ne peut contenir qu'un seul mot simple ou un nombre, pas de mots composés ou séparés.",
    flashcards_prompt_tip: "`tip` (optionnel): Un indice pour aider l'élève si la question est difficile. N'ajoute un indice que si cela te semble pertinent.",
    flashcards_prompt_tip_formatting: "Pour les indices (`tip`), tu peux utiliser `*mot*` pour mettre en gras et `**mot**` pour mettre en italique afin de souligner les informations importantes.",
    flashcards_prompt_example_json_title: "**Exemple de JSON :**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "Les capitales d'Europe",
"description": "Mémorise la capitale de chaque pays. Clique sur la carte pour voir la réponse.",
"cards": [
{
"text": "La capitale de la France",
"answer": "Paris"
},
{
"text": "La capitale des Pays-Bas",
"answer": "Amsterdam",
"tip": "C'est la ville des *canaux* et des tulipes !"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // QuizSet Prompt
    quiz_set_prompt_role: "Tu es un expert en ingénierie pédagogique créant le contenu pour une activité \"H5P Quiz (Question Set)\".",
    quiz_set_prompt_mission: "**Ta mission :** Tu dois générer le contenu JSON pour une activité H5P 'Quiz (Question Set)'. Choisis les types de questions les plus pertinents parmi les options autorisées pour créer un quiz varié et pédagogique.",
    quiz_set_prompt_generate_json: "Génère un objet JSON complet et valide qui sera utilisé comme fichier `content.json`.",
    quiz_set_prompt_json_structure_title: "**Structure du JSON de base :**",
    quiz_set_prompt_json_structure_main_object: "L'objet principal doit contenir :",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: Un tableau de ${nombreQuestions} objets, où chaque objet est une activité H5P.",
    quiz_set_prompt_content_rules_title: "**Règles pour chaque question :**",
    quiz_set_prompt_rule1: "1.  **Choix des activités :** Tu dois choisir parmi les types d'activités suivants. Ne propose rien d'autre : `H5P.TrueFalse`, `H5P.MultiChoice`, `H5P.Blanks` (Texte à trous), `H5P.DragText` (Glisser les mots), `H5P.MarkTheWords` (Surligner les mots), `H5P.Essay` (Rédaction).",
    quiz_set_prompt_rule2: "2.  **Structure :** Chaque question doit être un objet avec les clés `library`, `metadata` et `params`.",
    quiz_set_prompt_rule3: "3.  **Titre :** Chaque question doit avoir un titre pertinent dans `metadata.title`.",
    quiz_set_prompt_rule4: "4.  **Feedbacks (RÈGLE CRUCIALE) :** Pour **tous les types de questions** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), tu dois **obligatoirement** générer un `overallFeedback` avec exactement 6 tranches de score : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Pour les questions `TrueFalse`, ajoute les champs `feedbackOnCorrect` et `feedbackOnWrong` en plus. Les feedbacks doivent être bienveillants, graduels et toujours tournés à l'affirmative.",
    quiz_set_prompt_rule5: "5.  **Contenu :** Le contenu dans `params` doit être pédagogiquement pertinent, avec des distracteurs plausibles pour les QCM et des textes cohérents pour les autres activités.",
    quiz_set_prompt_rule6: "6.  **Simplicité :** N'ajoute pas d'images ou de paramètres de comportement superflus. Garde la structure simple comme dans les exemples.",
    quiz_set_prompt_example_json_title: "**Exemples de structures pour chaque type de question autorisé :**",
    quiz_set_example_true_false: "Vrai/Faux :",
    quiz_set_example_multiple_choice: "Choix Multiple (QCM) :",
    quiz_set_example_fill_in_the_blanks: "Texte à trous :",
    quiz_set_example_drag_the_words: "Glisser les mots :",
    quiz_set_example_mark_the_words: "Surligner les mots :",
    quiz_set_example_essay: "Rédaction :",
    quiz_set_prompt_generate_only_json: "Génère uniquement le JSON complet et valide, en commençant par `{\"progressType\": \"dots\", ...}`, sans aucun commentaire.",
 
    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Titre de la question Vrai/Faux" },
        "params": {
            "question": "La France est un pays ?",
            "correct": "true",
            "feedbackOnCorrect": "C'est exact ! La France est bien un pays.",
            "feedbackOnWrong": "Incorrect. La France est reconnue internationalement comme un pays.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Titre du QCM" },
        "params": {
            "question": "Quelle est la capitale de la France ?",
            "answers": [
                { "text": "Paris", "correct": true },
                { "text": "Berlin", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "Titre du texte à trous" },
        "params": {
            "questions": ["Paris est la *capitale* de la France."],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "Titre de l'activité Glisser les mots" },
        "params": {
            "taskDescription": "Complétez la phrase.",
            "textField": "*Paris* est la capitale de la France.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "Titre de l'activité Surligner les mots" },
        "params": {
            "taskDescription": "Surlignez la capitale.",
            "textField": "La capitale de la France est *Paris*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "Titre de la rédaction" },
        "params": {
            "taskDescription": "Quelle est la capitale de la France ?",
            "keywords": [
                { "keyword": "Paris", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Accordion\".",
    glossary_prompt_mission: "**Ta mission :**",
    glossary_prompt_generate_json: "Génère un objet JSON complet et valide pour un glossaire H5P de type Accordion. Le JSON doit être directement utilisable.",
    glossary_prompt_json_structure_title: "**Structure du JSON attendu :**",
    glossary_prompt_json_structure_main_object: "Génère un tableau de ${nombreQuestions} objets JSON.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: Le mot ou l'expression à définir.",
    glossary_prompt_content: "`text`: La définition. Utilise `*mot*` pour le gras, `**mot**` pour l'italique et `\\n` pour les sauts de ligne.",
    glossary_prompt_content_rules_title: "**Règles pour le contenu :**",
    glossary_prompt_rule1: "1.  Les définitions doivent être claires, concises et adaptées au niveau des élèves.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Exemple de JSON pour une entrée :**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Photosynthèse",
"text": "Processus par lequel les plantes vertes transforment la *lumière* du *soleil* en énergie."
},
{
"title": "Cellule",
"text": "**Unité** de base de tous les êtres vivants."
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // Summary Prompt
    summary_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Summary\".",
    summary_prompt_mission: "**Ta mission :**",
    summary_prompt_generate_json: "Génère un objet JSON complet pour une activité H5P de type Summary. Le JSON doit être directement utilisable.",
    summary_prompt_json_structure_title: "**Structure du JSON attendu :**",
    summary_prompt_json_structure_main_object: "L'objet doit contenir les clés suivantes :",
    summary_prompt_intro_field: "`intro`: Une phrase d'introduction pour l'activité (par exemple, \"Choisissez l'affirmation correcte.\").",
    summary_prompt_summaries_array: "`summaries`: Un tableau de ${nombreQuestions} objets, chacun représentant une étape du résumé.",
    summary_prompt_summary_object: "Chaque objet dans `summaries` doit contenir :",
    summary_prompt_summary_array: "- `summary`: Un tableau de phrases.",
    summary_prompt_tip_field: "- `tip` (optionnel mais recommandé): Un indice pour aider l'élève.",
    summary_prompt_content_rules_title: "**Règles pour le contenu :**",
    summary_prompt_rule1: "1.  Dans chaque tableau \"summary\", la **première phrase est la bonne**.",
    summary_prompt_rule2: "2.  Les phrases suivantes sont des distracteurs plausibles mais incorrects.",
    summary_prompt_rule3: "3.  L'ensemble des phrases correctes doit former un résumé cohérent.",
    summary_prompt_example_json_title: "**Exemple de JSON pour une étape :**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "Ceci est la phrase correcte.",
    "Ceci est un distracteur.",
    "Ceci est un autre distracteur."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",
    summary_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // Summary UI translations
    summary_intro: "Choisissez l'affirmation correcte.",
    summary_solved_label: "Progression :",
    summary_score_label: "Mauvaises réponses :",
    summary_result_label: "Votre résultat",
    summary_feedback: "Vous avez @score sur @total affirmations correctes (@percent %).",
    summary_label_correct: "Correct.",
    summary_label_incorrect: "Incorrect ! Veuillez réessayer.",
    summary_label_correct_answers: "Réponses correctes.",
    summary_tip_button_label: "Afficher l'indice",
    summary_score_bar_label: "Vous avez obtenu :num sur :total points",
    summary_progress_text: "Progression :num sur :total",
    summary_alternative_incorrect_label: "Incorrect",

    // Drag the Words Prompt
    drag_word_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Drag the Words\".",
    drag_word_prompt_mission: "**Ta mission :**",
    drag_word_prompt_generate_json: "Génère un objet JSON complet pour une activité H5P de type Drag the Words. Le JSON doit être directement utilisable.",
    drag_word_prompt_json_structure_title: "**Structure du JSON attendu :**",
    drag_word_prompt_json_structure_main_object: "L'objet doit contenir :",
    drag_word_prompt_task_description: "`taskDescription`: Une consigne claire.",
    drag_word_prompt_text_field: "`textField`: Le texte à compléter. Chaque phrase doit se terminer par un saut de ligne `\\n`.",
    drag_word_prompt_content_rules_title: "**Règles pour le contenu :**",
    drag_word_prompt_rule1: "1.  Crée un texte cohérent sur le thème, avec des phrases courtes se terminant par `\\n`.",
    drag_word_prompt_rule2: "2.  Les mots à glisser sont entourés d'astérisques. Tu peux ajouter une aide avec `:mon aide` et un feedback avec `\\+feedback correct \\-feedback incorrect`.",
    drag_word_prompt_example_json_title: "**Exemple de JSON :**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Complète le texte en faisant glisser les mots.",
"textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",

    // Drag the Words UI translations
    drag_words_check_answer: "Vérifier",
    drag_words_try_again: "Recommencer",
    drag_words_show_solution: "Afficher la solution",
    drag_words_score_feedback: "Score : @score sur @total.",
    drag_words_tip_label: "Afficher l'indice",
    drag_words_correct_text: "Correct !",
    drag_words_incorrect_text: "Incorrect !",
    drag_words_score_bar_label: "Vous avez obtenu :num sur :total points",
    drag_words_submit_answer: "Valider",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Fill in the Blanks\".",
    blanks_prompt_mission: "**Ta mission :**",
    blanks_prompt_generate_json: "Génère un objet JSON complet pour une activité H5P de type Fill in the Blanks. Le JSON doit être directement utilisable.",
    blanks_prompt_json_structure_title: "**Structure du JSON attendu :**",
    blanks_prompt_json_structure_main_object: "L'objet doit contenir une clé `questions`, qui est un tableau de chaînes de caractères. Chaque chaîne représente un bloc de texte à compléter.",
    blanks_prompt_content_rules_title: "**Règles pour le contenu :**",
    blanks_prompt_rule1: "-   Les mots à deviner sont entourés d'astérisques (*mot*).",
    blanks_prompt_rule2: "-   Pour des réponses alternatives, utilisez une barre oblique : *Paris/Ville Lumière*.",
    blanks_prompt_rule3: "-   Pour ajouter une infobulle, utilisez deux-points : *open-source:Code source public*.",
    blanks_prompt_example_json_title: "**Exemple de JSON :**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"Le système solaire a *huit* planètes. La plus grande est *Jupiter*.",
"La capitale de la France est *Paris/Ville Lumière*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",
    blanks_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Afficher les solutions",
    blanks_try_again: "Recommencer",
    blanks_check_answer: "Vérifier",
    blanks_not_filled_out: "Veuillez remplir tous les champs.",
    blanks_answer_is_correct: "&#039;:ans&#039; est correct",
    blanks_answer_is_wrong: "&#039;:ans&#039; est incorrect",
    blanks_answered_correctly: "Réponse correcte",
    blanks_answered_incorrectly: "Réponse incorrecte",
    blanks_solution_label: "Réponse correcte :",
    blanks_input_label: "Champ @num sur @total",
    blanks_input_has_tip_label: "Indice disponible",
    blanks_tip_label: "Indice",
    blanks_score_bar_label: "Vous avez obtenu :num sur :total points",
    blanks_submit_answer: "Valider",
    blanks_feedback: "Vous avez @score sur @total blancs corrects.",
    blanks_finish_header: "Terminer ?",
    blanks_finish_body: "Êtes-vous sûr de vouloir terminer ?",
    blanks_cancel_label: "Annuler",
    blanks_finish_label: "Terminer",
    blanks_retry_header: "Recommencer ?",
    blanks_retry_body: "Êtes-vous sûr de vouloir recommencer ?",
    blanks_retry_confirm_label: "Confirmer",
    blanks_checking_mode_header: "Mode de vérification",
    blanks_a11y_check: "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
    blanks_a11y_show_solution: "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
    blanks_a11y_retry: "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",

    // Mark the Words Prompt
    mark_words_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Mark the Words\".",
    mark_words_prompt_mission: "**Ta mission :**",
    mark_words_prompt_generate_json: "Génère un objet JSON complet pour une activité H5P de type Mark the Words. Le JSON doit être directement utilisable.",
    mark_words_prompt_json_structure_title: "**Structure du JSON attendu :**",
    mark_words_prompt_json_structure_main_object: "L'objet doit contenir :",
    mark_words_prompt_task_description: "`taskDescription`: Une consigne claire.",
    mark_words_prompt_text_field: "`textField`: Le texte où les mots à marquer sont entourés d'astérisques (*mot*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",
    mark_words_prompt_content_rules_title: "**Règles pour le contenu :**",
    mark_words_prompt_rule1: "1.  Crée un paragraphe pertinent sur le thème.",
    mark_words_prompt_rule2: "2.  Identifie environ ${nombreQuestions} mots-clés importants à marquer.",
    mark_words_prompt_rule3: "3.  Chaque mot à marquer doit être individuellement entouré d'astérisques. Par exemple, `*mot1* *mot2*` est correct, mais `*mot1 mot2*` ne l'est pas.",
    mark_words_prompt_rule4: "4.  Les apostrophes ou autres signes de ponctuation ne doivent pas être collés aux mots marqués. Par exemple, `l'*oiseau*` est incorrect ; il faut écrire `l' *oiseau*` pour que cela fonctionne.",
    mark_words_prompt_example_json_title: "**Exemple de JSON :**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Clique sur les mots importants dans le texte.",
"textField": "Le *système* *solaire* est composé de *huit* planètes qui tournent autour du *Soleil*."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // Mark the Words UI translations
    mark_words_check_answer: "Vérifier",
    mark_words_try_again: "Recommencer",
    mark_words_show_solution: "Afficher la solution",
    mark_words_correct_answer: "Correct !",
    mark_words_incorrect_answer: "Incorrect !",
    mark_words_missed_answer: "Manqué !",
    mark_words_display_solution_description: "La tâche est mise à jour pour contenir la solution.",
    mark_words_score_bar_label: "Vous avez obtenu :num sur :total points",
    mark_words_submit_answer: "Valider",
    mark_words_a11y_full_text_label: "Texte complet lisible",
    mark_words_a11y_clickable_text_label: "Texte complet où les mots peuvent être marqués",
    mark_words_a11y_solution_mode_header: "Mode solution",
    mark_words_a11y_checking_header: "Mode de vérification",
    mark_words_a11y_check: "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
    mark_words_a11y_show_solution: "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
    mark_words_a11y_retry: "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées. Veuillez vérifier votre connexion internet ou rafraîchir la page.",
    millionnaire_error_invalid_json: "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' de 6 questions conformes à l'exemple.",
    millionnaire_activity_intro: "Participez à ce jeu pour tester vos connaissances.",
    millionnaire_backup_log: "Sauvegarde créée automatiquement par Caramel\n",
    millionnaire_success_generation: "Fichier {fileName} généré avec succès !",
    millionnaire_error_creation_mbz: "Erreur lors de la création du MBZ:",
    millionnaire_error_generic: "Erreur :",

    // Millionnaire Prompt
    millionnaire_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Millionnaire\".",
    millionnaire_prompt_num_questions: "**Nombre de questions :** 6",
    millionnaire_prompt_mission: "**Ta mission :**",
    millionnaire_prompt_generate_json: "Génère un objet JSON contenant un titre et une liste de **6 questions** pour un jeu de type \"Qui veut gagner des millions\".",
    millionnaire_prompt_important_rules_title: "**Règles importantes :**",
    millionnaire_prompt_rule1: "1.  Le `title` doit être un titre pertinent et engageant pour l'activité.",
    millionnaire_prompt_rule2: "2.  La difficulté des questions dans le tableau `questions` doit être **croissante et pédagogique**, adaptée au niveau des élèves. La première question doit être très facile, la dernière très difficile.",
    millionnaire_prompt_rule3: "3.  Le contenu doit être rigoureusement exact et pertinent par rapport au thème et au niveau scolaire.",
    millionnaire_prompt_json_structure_title: "**Structure du JSON attendu :**",
    millionnaire_prompt_main_object: "Un objet principal avec deux clés :",
    millionnaire_prompt_title: "- `title`: Le titre de l'activité (chaîne de caractères).",
    millionnaire_prompt_questions_array: "- `questions`: Un tableau de 6 objets, où chaque objet représente une question et contient :",
    millionnaire_prompt_question: "- `question`: La question (chaîne de caractères).",
    millionnaire_prompt_good_answer: "- `goodanswer`: La bonne réponse (chaîne de caractères).",
    millionnaire_prompt_bad_answer: "- `badanswer`: Un tableau de 3 mauvaises réponses (chaînes de caractères).",
    millionnaire_prompt_example_json_title: "**Exemple de JSON :**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "Quiz sur la Révolution Française",
"questions": [
{
"question": "Quelle est la capitale de la France ?",
"goodanswer": "Paris",
"badanswer": ["Berlin", "Londres", "Madrid"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Génère uniquement l'objet JSON valide, sans aucun commentaire.",

    // Appariement Prompt
    appariement_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité Moodle \"Appariement\".",
    appariement_prompt_num_questions: "**Nombre de paires :** 10",
    appariement_prompt_mission: "**Ta mission :**",
    appariement_prompt_generate_json: "Génère un objet JSON contenant un titre et une liste de **10 paires** pour un jeu d'appariement.",
    appariement_prompt_important_rules_title: "**Règles importantes :**",
    appariement_prompt_rule1: "1.  Le `title` doit être un titre pertinent et engageant pour l'activité.",
    appariement_prompt_rule2: "2.  Le tableau `pairs` doit contenir 10 objets, chacun avec une `question` (l'élément à gauche) et une `answer` (l'élément à droite à apparier).",
    appariement_prompt_rule3: "3.  Le contenu doit être rigoureusement exact et pertinent par rapport au thème et au niveau scolaire.",
    appariement_prompt_json_structure_title: "**Structure du JSON attendu :**",
    appariement_prompt_main_object: "Un objet principal avec deux clés :",
    appariement_prompt_title: "- `title`: Le titre de l'activité (chaîne de caractères).",
    appariement_prompt_pairs_array: "- `pairs`: Un tableau de 10 objets, où chaque objet représente une paire et contient :",
    appariement_prompt_question: "- `question`: Le terme ou l'image à gauche (chaîne de caractères).",
    appariement_prompt_answer: "- `answer`: La définition ou le terme correspondant à droite (chaîne de caractères).",
    appariement_prompt_example_json_title: "**Exemple de JSON :**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Appariement sur la Révolution Française",
"pairs": [
{
"question": "Prise de la Bastille",
"answer": "14 juillet 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "Génère uniquement l'objet JSON valide, sans aucun commentaire.",

   // Appariement Creation
   appariement_error_invalid_json: "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'pairs' où chaque paire a une 'question' et une 'answer'.",
   appariement_activity_intro: "Trouvez les paires correspondantes.",
   appariement_success_generation: "Fichier {fileName} généré avec succès !",
   appariement_error_creation_mbz: "Erreur lors de la création du MBZ pour l'appariement:",

    // QCM Prompt
    qcm_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité Moodle \"QCM\".",
    qcm_prompt_num_questions: "**Nombre de questions :** 10",
    qcm_prompt_mission: "**Ta mission :**",
    qcm_prompt_generate_json: "Génère un objet JSON contenant un titre et une liste de **10 questions** pour un QCM.",
    qcm_prompt_important_rules_title: "**Règles importantes :**",
    qcm_prompt_rule1: "1.  Le `title` doit être un titre pertinent et engageant pour l'activité.",
    qcm_prompt_rule2: "2.  Le tableau `questions` doit contenir 10 objets, chacun avec un `text` (l'intitulé de la question) et un tableau `answers`.",
    qcm_prompt_rule3: "3.  Chaque tableau `answers` doit contenir plusieurs réponses possibles. Chaque réponse est un objet avec un `text` et `iscorrect` (1 pour vrai, 0 pour faux). Selon le contexte de la question, tu peux proposer des questions avec une seule bonne réponse ou avec plusieurs bonnes réponses.",
    qcm_prompt_json_structure_title: "**Structure du JSON attendu :**",
    qcm_prompt_main_object: "Un objet principal avec deux clés :",
    qcm_prompt_title: "- `title`: Le titre de l'activité (chaîne de caractères).",
    qcm_prompt_questions_array: "- `questions`: Un tableau de 10 objets, où chaque objet représente une question et contient :",
    qcm_prompt_question_text: "- `text`: L'intitulé de la question (chaîne de caractères, peut contenir du HTML).",
    qcm_prompt_answers_array: "- `answers`: Un tableau d'objets, où chaque objet représente une réponse et contient :",
    qcm_prompt_answer_text: "- `text`: Le texte de la réponse (chaîne de caractères, peut contenir du HTML).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 si la réponse est correcte, 0 sinon.",
    qcm_prompt_example_json_title: "**Exemple de JSON :**",
    qcm_prompt_example: `\`\`\`json
{
"title": "QCM sur la Révolution Française",
"questions": [
{
"text": "Quelle est la date de la prise de la Bastille ?",
"answers": [
{ "text": "14 juillet 1789", "iscorrect": 1 },
{ "text": "4 août 1789", "iscorrect": 0 },
{ "text": "26 août 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
   qcm_prompt_generate_only_json: "Génère uniquement l'objet JSON valide, sans aucun commentaire.",

   // QCM Creation
   qcm_error_invalid_json: "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' avec au moins une question et des réponses.",
   qcm_activity_intro: "Répondez aux questions suivantes.",
   qcm_success_generation: "Fichier {fileName} généré avec succès !",
   qcm_error_creation_mbz: "Erreur lors de la création du MBZ pour le QCM:",

    // H5P Modules
    h5p_timeline_name: "Frise chronologique",
    h5p_timeline_description: "Créez une frise chronologique interactive pour présenter une séquence d'événements.",
    h5p_flashcards_name: "Cartes mémoires",
    h5p_flashcards_description: "Créez des cartes recto-verso pour aider à la mémorisation de termes et définitions.",
    h5p_quiz_set_name: "Quiz",
    h5p_quiz_set_description: "Composez une série de questions variées (QCM, glisser-déposer, etc.) pour évaluer les connaissances.",
    h5p_glossary_name: "Glossaire",
    h5p_glossary_description: "Créez un glossaire ou une FAQ sous forme d'accordéon dépliant.",
    h5p_crossword_name: "Mots croisés",
    h5p_crossword_description: "Générez une grille de mots croisés à partir d'une liste de mots et de définitions.",
    h5p_essay_name: "Rédaction",
    h5p_essay_description: "Proposez un sujet de rédaction et définissez des mots-clés pour une correction automatisée.",
    h5p_summary_name: "Résumé",
    h5p_summary_description: "Les élèves doivent reconstituer un résumé correct en choisissant les bonnes phrases.",
    h5p_drag_the_words_name: "Glisser les mots",
    h5p_drag_the_words_description: "Créez un texte à trous où les élèves doivent glisser les mots manquants.",
    h5p_fill_in_the_blanks_name: "Texte à trous",
    h5p_fill_in_the_blanks_description: "Les élèves doivent remplir les mots manquants dans un texte directement au clavier.",
    h5p_mark_the_words_name: "Surligner les mots",
    h5p_mark_the_words_description: "Demandez aux élèves de surligner certains mots dans un paragraphe.",
    h5p_true_false_name: "Vrai/Faux",
    h5p_true_false_description: "Créez une unique question simple avec une réponse binaire : vrai ou faux.",
    h5p_multiple_choice_name: "Choix multiples",
    h5p_multiple_choice_description: "Créez une unique question à choix multiples avec une ou plusieurs bonnes réponses.",
    h5p_find_the_words_name: "Mots mêlés",
    h5p_find_the_words_description: "Créez une grille de lettres où les élèves doivent retrouver des mots.",
    h5p_sort_the_paragraphs_name: "Ordonner les paragraphes",
    h5p_sort_the_paragraphs_description: "Créez un ensemble de paragraphes que les élèves doivent remettre dans le bon ordre.",
    h5p_single_choice_set_name: "Série de choix uniques",
    h5p_single_choice_set_description: "Créez une série de questions où chaque question n'a qu'une seule bonne réponse.",
    h5p_dialog_cards_name: "Cartes de dialogue",
    h5p_dialog_cards_description: "Créez des cartes interactives recto-verso avec du texte et éventuellement des images.",
    h5p_complex_fill_the_blanks_name: "Texte à trous complexe",
    h5p_complex_fill_the_blanks_description: "Créez un texte à trous avancé avec des feedbacks spécifiques pour chaque erreur.",
    h5p_chart_name: "Diagramme",
    h5p_chart_description: "Créez un diagramme circulaire ou en barres pour visualiser des données.",

    // Moodle Modules
    moodle_xml_name: "Test",
    moodle_xml_description: "Générez une banque de questions à importer directement dans une activité Test (au format xml ou format gift)",
    moodle_xml_help: "Pour ajouter un fichier XML dans une activité « Test » sur Moodle, commencez par créer l’activité. Ensuite, ouvrez le menu <strong>Plus</strong> et allez dans <strong>Banque de questions</strong>. Dans ce menu, cliquez sur <strong>Importer</strong>, choisissez le format <strong>XML Moodle</strong>, puis sélectionnez votre fichier et validez.",
    moodle_gift_name: "Format GIFT",
    moodle_gift_description: "Créez des questions au format GIFT, un moyen simple d'importer des questions dans Moodle.",
    moodle_millionnaire_name: "Millionnaire",
    moodle_millionnaire_description: "Générez une activité unique 'Millionnaire' de 6 questions graduelles en terme de difficulté.",
    moodle_appariement_name: "Appariement",
    moodle_appariement_description: "Générez une activité d'appariement de 10 questions.",

    moodle_qcm_name: "QCM",
    moodle_qcm_description: "Générez une activité QCM simple.",

    moodle_glossaire_xml_name: "Glossaire (XML)",
    moodle_glossaire_xml_description: "Générez un glossaire prêt à être importé au format XML.",

    elea_page_name: "Page",
    elea_page_description: "Créer une page de contenu Éléa mise en forme visuellement.",
 
     // Dynamic content
    prompt_for_ia: "Prompt pour l'IA",
    copy_prompt: "Copier le prompt",
    fullscreen_prompt: "Plein écran",
    exit_fullscreen_prompt: "Quitter le plein écran",
    lock_prompt: "Verrouiller",
    unlock_prompt: "Déverrouiller",
    go_duck: "Copier et aller sur Duck.ai",
    go_mistral: "Copier et aller sur Le chat",
    create_h5p_file: "Créer le fichier H5P",
    integrate_h5p_libraries: "Intégrer les bibliothèques H5P :",
    paste_ia_result: "Collez le résultat de l'IA dans la zone ci-dessous pour créer votre module.",
    generate_h5p: "Générer le H5P",
    create_xml_file: "Créer le fichier XML",
    paste_ia_result_xml: "Collez le XML généré par l'IA ci-dessous.",
    generate_xml_file: "Générer le fichier XML",
    export_mbz: "Format MBZ",
    export_gift: "Format GIFT",
    export_xml: "Format XML",
    export_html: "Format HTML",

    create_mbz_file_appariement: "Créer le fichier Appariement (.mbz)",
    paste_ia_result_appariement: "Collez le JSON généré par l'IA ci-dessous. Le titre de l'activité sera automatiquement extrait du JSON.",
    generate_mbz_appariement: "Générer l'activité Appariement (mbz)",
    create_mbz_file_millionnaire: "Créer le fichier Millionnaire (.mbz)",
    paste_ia_result_millionnaire: "Collez le JSON généré par l'IA ci-dessous. Le titre de l'activité sera automatiquement extrait du JSON.",
    generate_mbz_millionnaire: "Générer l'activité Millionnaire (mbz)",
    generate_mbz_test: "Générer l'activité Test (mbz)",

    create_mbz_file_qcm: "Créer le fichier QCM (.mbz)",
    paste_ia_result_qcm: "Collez le JSON généré par l'IA ci-dessous. Le titre de l'activité sera automatiquement extrait du JSON.",
    generate_mbz_qcm: "Générer l'activité QCM (mbz)",

    create_mbz_file_page: "Créer le fichier Page (.mbz)",
    paste_ia_result_page: "Collez le JSON généré par l'IA ci-dessous pour construire la page.",
    generate_mbz_page: "Générer l'activité Page (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "Le XML Moodle apparaîtra ici...",
    paste_xml_placeholder: "Collez ici le XML complet généré par l'IA...",

    // H5P champs textes vides
    generate_prompts_placeholder: "Le prompt pour l'IA apparaîtra ici une fois que vous aurez complété au moins un champ du mode Rapide ou du mode Avancé.",
    paste_json_or_text: "Collez ici le contenu JSON ou le texte généré par l'IA pour créer votre activité.",
    info_prompt_copy: "Ne collez pas ce prompt dans le panneau de droite. Copiez-le dans une IA grand public afin d’obtenir le résultat, puis collez ce résultat dans le panneau de droite.",

    // Notifications
    caramel_success_title: "Votre sucrerie est prête !", 
    prompts_generated_successfully: "Prompts générés avec succès !",
    success_copy: "✓ Copié !",
    error_please_fill_fields: "Veuillez remplir au moins un champ du mode Rapide.",
    error_please_fill_guided_fields: "Veuillez remplir au moins un champ du mode Avancé.",
    error_field_empty: "Le champ est vide. Veuillez d'abord générer un prompt.",
    error_copy_failed: "La copie a échoué.",
    error_h5p_module_not_found: "Module '{moduleKey}' non trouvé.",
    error_invalid_quiz_json: "Le JSON pour le Quiz est invalide : {errorMessage}",
    error_invalid_json: "Le JSON fourni est invalide. Erreur: {errorMessage}",
    error_h5p_creation: "Erreur de création H5P: {errorMessage}",
    error_paste_ia_content: "Veuillez coller le contenu généré par l'IA.",
    error_compression_module_not_ready: "Le module de compression n'est pas prêt. Réessayez dans un instant.",
    h5p_file_generated_successfully: "Fichier {fileName} généré avec succès !",
    h5p_creation_failed: "Échec de la création du fichier H5P : {errorMessage}",
    license_info: "GNU GPL v3.0 ou ultérieure",

    // Notifications for JSON content
    error_paste_json_content: "Veuillez coller le contenu JSON généré.",
    error_paste_xml_content: "Veuillez coller le contenu XML généré.",
 
    // Flashcards specific UI translations
    flashcards_progress_text: "Carte @card sur @total",
    flashcards_next: "Suivant",
    flashcards_previous: "Précédent",
    flashcards_check_answer: "Vérifier",
    flashcards_your_answer: "Votre réponse",
    flashcards_correct_answer: "Réponse exacte",
    flashcards_incorrect_answer: "Réponse inexacte",
    flashcards_show_solution: "Réponse correcte",
    flashcards_results: "Résultats",
    flashcards_of_correct: "@score réponses correctes sur un total de @total",
    flashcards_show_results: "Montrer les résultats",
    flashcards_answer_short: "R :",
    flashcards_retry: "Recommencer",
    flashcards_card_announcement: "Réponse incorrecte. La réponse correcte était @answer",
    flashcards_correct_announcement: "@answer est correct.",
    flashcards_page_announcement: "Page @current sur @total",

    ticket: "Ticket",
    legal_mentions: "Mentions légales",

    // Legal Mentions
    legal_title: "Mentions légales",
    legal_editor_title: "Éditeur de l’application",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Fonction : PLP Lettres-Histoire",
    legal_editor_gauthier_remande_email: "Email : gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Adresse : 39 avenue de Chanzy, 53000 Laval, France",
    legal_editor_gauthier_remande_phone: "Téléphone : +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Fonction : Professeur de mathématiques et chargé de mission DRANE – Académie de Grenoble",
    legal_editor_emmanuel_gaunard_email: "Email : emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Adresse : 30 boulevard de la République, 38200 Vienne, France",
    legal_editor_emmanuel_gaunard_phone: "Téléphone : +33 6 46 74 20 94",
    legal_app_description: "L’application web « Caramel » est un projet libre, non commercial, destiné à la création de contenus H5P et Éléa. Aucun compte n’est requis, aucune donnée personnelle n’est collectée.",
    legal_hosting_title: "Hébergement",
    legal_host_name: "<strong>Hébergeur</strong> : Forge des Communs Numériques Éducatifs",
    legal_host_company: "<strong>Raison sociale</strong> : Ministère de l’Éducation nationale et de la Jeunesse",
    legal_host_address: "<strong>Adresse</strong> : 110 rue de Grenelle, 75007 Paris, France",
    legal_host_phone: "<strong>Téléphone</strong> : +33 1 55 55 10 10",
    legal_publication_director_title: "Responsable de la publication",
    legal_publication_director_name: "Gauthier REMANDE et Emmanuel GAUNARD, en qualité d’éditeurs bénévoles.",
    legal_terms_of_use_title: "Conditions générales d’utilisation",
    legal_terms_of_use_content: "Ce site permet aux utilisateurs de générer des contenus H5P et Éléa. L'affichage s’effectue localement, sans transmission de données utilisateur. L’utilisateur est seul responsable de l’usage qu’il fait des contenus générés. L’application est proposée à titre gratuit, sans aucune garantie de fonctionnement ou de résultat. L’éditeur décline toute responsabilité en cas de mauvaise interprétation des contenus ou d’usage inapproprié.",
    legal_intellectual_property_title: "Propriété intellectuelle",
    legal_intellectual_property_content: "L’ensemble des codes sources, éléments graphiques et contenus sont placés sous licence libre GNU AGPLv3. Leur réutilisation est permise dans les conditions de leur licence respective. Toute redistribution ou modification doit citer les auteurs originaux : Gauthier REMANDE et Emmanuel GAUNARD. Les images utilisées dans les modules H5P sont récupérées depuis le site H5P.org.",
    legal_personal_data_title: "Données personnelles",
    legal_personal_data_content: "Aucune donnée personnelle n’est collectée ni stockée. Aucun cookie de suivi n’est utilisé.",
    legal_ai_models_title: "Modèles d'Intelligence Artificielle",
    legal_ai_models_content: "L’application Caramel s’appuie, uniquement lors de la génération en un clic, sur des modèles d’IA opérés par ILAAS, une fédération d’infrastructures d’IA mutualisées. Les requêtes sont acheminées via un workflow n8n hébergé par l’Incubateur, puis transmises à ILAAS pour exécution sur des serveurs de confiance hébergés dans des data centers labellisés de l’Enseignement supérieur et de la recherche (ESR). Caramel n’exécute pas les modèles et ne traite ni ne stocke les données en propre ; les données sont utilisées uniquement pour exécuter la requête et ne sont pas envoyées à des IA grand public. Les modèles actuellement proposés incluent {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) et {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Les modalités d’hébergement, de journalisation et de conservation éventuellement effectuées par ILAAS relèvent de leur politique de confidentialité et de leurs conditions de service, auxquelles il convient de se référer.",
    legal_user_requests_processing_title: "Traitement des requêtes utilisateurs via n8n et l’Incubateur du Ministère de l’Éducation nationale",
    legal_user_requests_processing_content: "Notre site utilise une solution technique développée par n8n, un outil open source hébergé par l’Incubateur du Ministère de l’Éducation nationale. Ce service permet, via un workflow automatisé, de transformer les requêtes des utilisateurs en données structurées (format JSON) afin d’interagir avec une intelligence artificielle de la DINUM, donc souveraine. Aucune information sensible n’est exposée ou transmise sans chiffrement, assurant ainsi la confidentialité et la sécurité des échanges.",
    legal_accessibility_title: "Accessibilité",
    legal_accessibility_content: "L’application est conçue pour être compatible avec une utilisation sur ordinateur, incluant les modes sombre/clair, la navigation au clavier et le contraste élevé selon les thèmes. Une amélioration continue de l’accessibilité est en cours, en lien avec les recommandations du RGAA.",
    legal_applicable_law_title: "Droit applicable",
    legal_applicable_law_content: "Ce site est soumis au droit français. En cas de litige, les juridictions compétentes seront celles du ressort de Lyon.",
    legal_external_libraries_title: "Bibliothèques externes utilisées",
    legal_external_libraries_intro: "L’application Caramel utilise plusieurs bibliothèques open source, sous les licences suivantes :",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licence : CC BY 4.0, SIL OFL 1.1, MIT) : Fournit les icônes utilisées dans l'interface pour améliorer la navigation et l'expérience visuelle.",
    legal_library_jszip: "<strong>JSZip</strong> (Licence : MIT ou GPLv3) : Permet de créer des fichiers .h5p en compressant le contenu nécessaire dans une archive zip.",
    legal_library_clientzip: "<strong>client-zip</strong> (Licence : MIT) : Une autre bibliothèque utilisée pour la compression de fichiers, offrant une alternative performante pour générer les archives .h5p directement dans le navigateur.",
    legal_library_fflate: "<strong>fflate</strong> (Licence : MIT) : Bibliothèque très rapide pour la compression et décompression de données, utilisée pour la création des archives .mbz des modules Moodle.",
    legal_library_tarjs: "<strong>tar-js</strong> (Licence : MIT) : Permet de créer des archives .tar, une étape nécessaire avant la compression pour former les fichiers .mbz des modules Moodle.",
    legal_library_ownership: "Chaque bibliothèque reste la propriété de ses auteurs respectifs et est utilisée conformément à sa ou ses licence(s).",

    // Essay specific UI translations
    essay_checkAnswer: "Vérifier",
    essay_tryAgain: "Recommencer",
    essay_showSolution: "Afficher la solution",
    essay_feedbackHeader: "Commentaire",
    essay_solutionTitle: "Exemple de solution",
    remainingChars: "Caractères restants : @chars",
    notEnoughChars: "Vous devez saisir au moins @chars caractères !",
    messageSave: "enregistré",
    placeholderText: "Commencez à rédiger ici...",
    ariaYourResult: "Vous avez obtenu @score sur @total points",
    ariaNavigatedToSolution: "Navigation vers la solution.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "Votre travail est un bon début. Continuez à explorer le sujet pour enrichir vos idées.",
    essay_overall_feedback_11_30: "Vous avez posé des bases intéressantes. En approfondissant certains points, votre travail gagnera en précision.",
    essay_overall_feedback_31_50: "Votre compréhension du sujet est bien engagée. Pensez à développer davantage vos arguments pour renforcer votre propos.",
    essay_overall_feedback_51_70: "C'est un bon travail. Vous montrez une bonne maîtrise du sujet. Quelques détails supplémentaires pourraient encore l'améliorer.",
    essay_overall_feedback_71_90: "Très bon travail ! Votre analyse est pertinente et bien structurée. Vous démontrez une excellente compréhension.",
    essay_overall_feedback_91_100: "Excellent travail ! Votre réflexion est approfondie, bien argumentée et témoigne d'une maîtrise complète du sujet.",

    // True/False Question
    true_false_prompt_role: "Tu es un expert en conception pédagogique et tu vas créer une question de type Vrai/Faux pour une activité H5P.",
    true_false_prompt_mission: "Ta mission est de générer un objet JSON pour une question Vrai/Faux.",
    true_false_prompt_generate_json: "Génère un objet JSON basé sur la structure suivante :",
    true_false_prompt_json_structure_title: "--- STRUCTURE JSON ATTENDUE ---",
    true_false_prompt_json_structure_main_object: "L'objet principal doit contenir les clés suivantes :",
    true_false_prompt_question: "`question`: (string) L'affirmation à évaluer. Peut contenir du HTML.",
    true_false_prompt_correct: "`correct`: (string) La bonne réponse, soit \"true\", soit \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Commentaire affiché si la réponse est correcte.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Commentaire affiché si la réponse est incorrecte.",
    true_false_prompt_content_rules_title: "--- RÈGLES DE CONTENU ---",
    true_false_prompt_rule1: "La question doit être une affirmation claire.",
    true_false_prompt_rule2: "La valeur de `correct` doit impérativement être une chaîne de caractères : \"true\" ou \"false\".",
    true_false_prompt_example_json_title: "--- EXEMPLE DE JSON ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "Oslo est la capitale de la Norvège.",
"correct": "true",
"feedbackOnCorrect": "Bonne réponse ! Oslo est bien la capitale de la Norvège.",
"feedbackOnWrong": "Mauvaise réponse. La capitale de la Norvège est Oslo."
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "Je veux que tu me génères uniquement le JSON, sans aucun commentaire ou texte d'introduction.",
    true_false_true_text: "Vrai",
    true_false_false_text: "Faux",
    true_false_score: "Vous avez obtenu @score sur @total points",
    true_false_check_answer: "Vérifier",
    true_false_show_solution_button: "Voir la solution",
    true_false_try_again: "Recommencer",
    true_false_wrong_answer_message: "Mauvaise réponse",
    true_false_correct_answer_message: "Bonne réponse",
    true_false_score_bar_label: "Vous avez obtenu :num sur :total points",
    true_false_submit_answer: "Soumettre",
    true_false_a11y_check: "Vérifiez les réponses. Les réponses seront marquées comme correctes, incorrectes ou sans réponse.",
    true_false_a11y_show_solution: "Afficher la solution. La tâche sera marquée avec sa solution correcte.",
    true_false_a11y_retry: "Réessayer la tâche. Réinitialisez toutes les réponses et recommencez la tâche.",
    true_false_finish_header: "Terminer ?",
    true_false_finish_body: "Êtes-vous sûr de vouloir terminer ?",
    true_false_cancel_label: "Annuler",
    true_false_finish_label: "Terminer",
    true_false_retry_header: "Recommencer ?",
    true_false_retry_body: "Êtes-vous sûr de vouloir recommencer ?",
    true_false_retry_confirm_label: "Confirmer",

    // Multiple Choice UI translations
    checkAnswerButton: "Vérifier",
    showSolutionButton: "Afficher la solution",
    tryAgainButton: "Recommencer",
    submitAnswerButton: "Valider",
    scoreBarLabel: "Vous avez obtenu :num sur :total points",
    confirmCheckHeader: "Terminer ?",
    confirmCheckBody: "Êtes-vous sûr de vouloir terminer ?",
    confirmCheckCancelLabel: "Annuler",
    confirmCheckConfirmLabel: "Terminer",
    confirmRetryHeader: "Recommencer ?",
    confirmRetryBody: "Êtes-vous sûr de vouloir recommencer ?",
    confirmRetryCancelLabel: "Annuler",
    confirmRetryConfirmLabel: "Confirmer",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Choix Multiples\".",
    multiple_choice_prompt_mission: "**Ta mission :**",
    multiple_choice_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Choix Multiples.",
    multiple_choice_prompt_json_structure_title: "**Structure du JSON attendu :**",
    multiple_choice_prompt_json_structure_main_object: "L'objet doit contenir :",
    multiple_choice_prompt_question: "`question`: La question à poser (format HTML).",
    multiple_choice_prompt_answers_array: "`answers`: Un tableau d'objets, chacun représentant une réponse.",
    multiple_choice_prompt_text: "`text`: Le texte de la réponse (format HTML).",
    multiple_choice_prompt_correct: "`correct`: Un booléen (`true` ou `false`) indiquant si c'est la bonne réponse.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",
    multiple_choice_prompt_content_rules_title: "**Règles pour le contenu :**",
    multiple_choice_prompt_rule1: "1.  Il ne doit y avoir qu'une seule bonne réponse (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Propose plusieurs mauvaises réponses (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Exemple de JSON :**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "Quelle est la couleur réelle de la baie de cassis ?",
"answers": [
{
"correct": true,
"text": "Violet très foncé"
},
{
"correct": false,
"text": "Bleu"
},
{
"correct": false,
"text": "Noir"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // Find the Words UI translations
    check: "Vérifier",
    tryAgain: "Recommencer",
    showSolution: "Afficher la solution",
    found: "@found sur @totalWords mots trouvés",
    timeSpent: "Temps écoulé",
    score: "Vous avez obtenu @score sur @total points",
    wordListHeader: "Liste de mots",

    // Find the Words Prompt
    find_the_words_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Mots mêlés\".",
    find_the_words_prompt_mission: "**Ta mission :**",
    find_the_words_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Mots mêlés.",
    find_the_words_prompt_json_structure_title: "**Structure du JSON attendu :**",
    find_the_words_prompt_json_structure_main_object: "L'objet doit contenir :",
    find_the_words_prompt_task_description: "`taskDescription`: Une consigne claire pour l'activité.",
    find_the_words_prompt_word_list: "`wordList`: Une chaîne de caractères contenant les mots à trouver, séparés par des virgules et sans espaces.",
    find_the_words_prompt_content_rules_title: "**Règles pour le contenu :**",
    find_the_words_prompt_rule1: "1.  La `wordList` doit être une chaîne de caractères unique avec les mots séparés par des virgules. Chaque mot doit être simple (pas de groupe de mots). Les nombres, symboles de ponctuation et lettres accentuées sont interdits (ex: 'élève' doit s'écrire 'eleve').",
    find_the_words_prompt_example_json_title: "**Exemple de JSON :**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Trouve les noms de villes dans la grille ci-dessous",
"wordList": "Canberra,Minsk,Pekin,Oslo,Paris,Londres,Madrid,Athenes,Tokyo,Moscou,Washington,Stockholm"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",
    fillPool: "abcdefghijklmnopqrstuvwxyz",

    // Sort the Paragraphs UI translations
    checkAnswer: "Vérifier",
    submitAnswer: "Soumettre",
    up: "Monter",
    down: "Descendre",
    disabled: "Désactivé",
    a11y_yourResult: "Vous avez obtenu @score sur @total points",
    a11y_paragraph: "Paragraphe",
    a11y_correct: "correct",
    a11y_wrong: "faux",
    a11y_point: "@score point",
    a11y_sevenOfNine: "@current sur @total",
    a11y_currentPosition: "Position actuelle dans la liste",
    a11y_instructionsSelected: "Appuyez sur la barre d'espace pour réorganiser",
    a11y_instructionsGrabbed: "Appuyez sur les flèches haut et bas pour changer de position, sur la barre d'espace pour déposer, sur échap pour annuler",
    a11y_grabbed: "Saisi",
    a11y_moved: "Déplacé",
    a11y_dropped: "Déposé",
    a11y_reorderCancelled: "Réorganisation annulée",
    a11y_finalPosition: "Position finale",
    a11y_nextParagraph: "Paragraphe suivant",
    a11y_correctParagraph: "Paragraphe correct à la position",
    a11y_listDescription: "Liste de paragraphes triables.",
    a11y_listDescriptionCheckAnswer: "Liste de paragraphes avec résultats.",
    a11y_listDescriptionShowSolution: "Liste de paragraphes avec solutions.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Ordonner les paragraphes\".",
    sort_the_paragraphs_prompt_mission: "**Ta mission :**",
    sort_the_paragraphs_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P d'ordonnancement de paragraphes.",
    sort_the_paragraphs_prompt_json_structure_title: "**Structure du JSON attendu :**",
    sort_the_paragraphs_prompt_json_structure_main_object: "L'objet doit contenir :",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Une consigne claire pour l'activité. Utilise `*mot*` pour le gras, `**mot**` pour l'italique et `\\n` pour les sauts de ligne.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Un tableau de chaînes de caractères, chaque chaîne représentant un paragraphe à ordonner. Les paragraphes doivent être dans le bon ordre. Utilise `*mot*` pour le gras, `**mot**` pour l'italique.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",
    sort_the_paragraphs_prompt_content_rules_title: "**Règles pour le contenu :**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` doit former une progression logique inférable par le contenu, sans indices artificiels (numéros, dates/horaires, « d’abord/ensuite/enfin »), sauf demande explicite.",
    sort_the_paragraphs_prompt_rule2: "2. Pas de liste plate : chaque phrase fait avancer le même fil (cause→effet, préparation→action→résultat, général→particulier) pour rendre l’ordre déductible.",
    sort_the_paragraphs_prompt_example_json_title: "**Exemple de JSON :**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "Ma routine du matin :",
"paragraphs": [
  "Je remplis la bouilloire avec de l’eau fraîche.",
  "Je la mets en marche.",
  "Je dépose un sachet de thé dans la tasse.",
  "Je verse l’eau frémissante sur le sachet.",
  "Je retire le sachet lorsque l’infusion est prête."
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Afficher la solution",
    retryButtonLabel: "Recommencer",
    solutionViewTitle: "Solution",
    correctText: "Correct !",
    incorrectText: "Incorrect !",
    muteButtonLabel: "Désactiver le son",
    closeButtonLabel: "Fermer",
    slideOfTotal: "Diapositive @slide sur @total",
    nextButtonLabel: "Suivant",
    solutionListQuestionNumber: "Question @question",
    a11yShowSolution: "Afficher la solution. La tâche sera marquée avec sa solution correcte.",
    a11yRetry: "Recommencer la tâche. Réinitialiser toutes les réponses et recommencer.",
    shouldSelect: "Devrait sélectionner",
    shouldNotSelect: "Ne devrait pas sélectionner",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Série de choix uniques\".",
    single_choice_set_prompt_mission: "**Ta mission :**",
    single_choice_set_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Série de choix uniques.",
    single_choice_set_prompt_json_structure_title: "**Structure du JSON attendu :**",
    single_choice_set_prompt_json_structure_main_object: "L'objet doit contenir :",
    single_choice_set_prompt_choices_array: "`choices`: Un tableau d'objets, où chaque objet représente une question et contient :",
    single_choice_set_prompt_question: "`question`: La question à poser.",
    single_choice_set_prompt_answers_array: "`answers`: Un tableau de chaînes de caractères. La première chaîne est toujours la bonne réponse.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100. Chaque objet doit avoir la forme `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Le texte du `feedback` doit être bienveillant sans être excessif non plus, graduel et toujours tourné à l'affirmative.",
    single_choice_set_prompt_content_rules_title: "**Règles pour le contenu :**",
    single_choice_set_prompt_rule1: "1.  Dans chaque tableau `answers`, la première réponse est toujours la bonne.",
    single_choice_set_prompt_example_json_title: "**Exemple de JSON :**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "Les baies de goji sont aussi appelées ...",
"answers": ["Baies de loup", "Baies de chat", "Baies d'ours"]
},
{
"question": "Les baies de goji sont originaires de ...",
"answers": ["Asie", "Afrique", "Europe"]
}
],
"overallFeedback":
    { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // Dialog Cards UI translations
    answer: "Retourner",
    next: "Suivant",
    prev: "Précédent",
    retry: "Recommencer",
    progressText: "Carte @card sur @total",
    cardFrontLabel: "Recto de la carte",
    cardBackLabel: "Verso de la carte",
    tipButtonLabel: "Afficher l'indice",
    audioNotSupported: "Votre navigateur ne supporte pas ce format audio",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Cartes de dialogue\".",
    dialog_cards_prompt_mission: "**Ta mission :**",
    dialog_cards_prompt_generate_json: "Génère un objet JSON contenant uniquement les clés `title`, `description` et `dialogs` pour une activité H5P de type Cartes de dialogue.",
    dialog_cards_prompt_json_structure_title: "**Structure du JSON attendu :**",
    dialog_cards_prompt_json_structure_main_object: "L'objet doit contenir :",
    dialog_cards_prompt_title: "`title`: Un titre pour l'activité. Ne pas inclure de balises HTML.",
    dialog_cards_prompt_description: "`description`: Une courte description ou consigne (format HTML).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: Un tableau de ${nombreQuestions} objets, chacun représentant une carte et contenant :",
    dialog_cards_prompt_text: "`text`: Le texte du recto de la carte. Ne pas inclure de balises HTML.",
    dialog_cards_prompt_answer: "`answer`: Le texte du verso de la carte. Ne pas inclure de balises HTML.",
    dialog_cards_prompt_tips: "`tips` (optionnel) : Un objet pour les indices (texte brut uniquement, sans formatage). Si tu le juges pédagogiquement utile, ajoute un indice pour le recto avec la clé `front` et/ou pour le verso avec la clé `back`.",
    dialog_cards_prompt_content_rules_title: "**Règles pour le contenu :**",
    dialog_cards_prompt_rule1: "1.  Pour `text` et `answer`, tu peux utiliser `*mot*` pour mettre en gras et `**mot**` pour mettre en italique.",
    dialog_cards_prompt_example_json_title: "**Exemple de JSON :**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "Apprenez les noms des fruits en anglais",
"description": "Les noms des fruits sont présentés en français. Retournez les cartes pour voir la traduction anglaise correcte.",
"dialogs": [
{
"title": "Retrouvez les verbes anglais au présent",
"description": "À partir d'une phrase en anglais au prétérit, retrouvez le verbe à l'infinitif. Retournez les cartes pour vérifier vos réponses.",
"dialogs": [
{
"text": "He *visited* his grandmother.",
"answer": "to *visit*",
"tips": {
"front": "Identifiez le verbe au prétérit.",
"back": "Pensez à la forme de base du verbe."
}
},
{
"text": "She *played* soccer.",
"answer": "to *play*",
"tips": {
"front": "Cherchez le verbe passé.",
"back": "Visualisez le verbe dans une phrase au présent."
}
}
]
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Génère uniquement le code JSON valide contenant les clés `title`, `description` et `dialogs`, sans aucun commentaire.",

    // Dialog Cards specific UI translations
    correctAnswer: "J'ai eu bon !",
    incorrectAnswer: "Je me suis trompé",
    round: "Manche @round",
    cardsLeft: "Cartes restantes : @number",
    nextRound: "Passer à la manche @round",
    startOver: "Recommencer",
    showSummary: "Suivant",
    summary: "Résumé",
    summaryCardsRight: "Cartes que vous avez réussies :",
    summaryCardsWrong: "Cartes que vous avez manquées :",
    summaryCardsNotShown: "Cartes non montrées :",
    summaryOverallScore: "Score global",
    summaryCardsCompleted: "Cartes que vous avez apprises :",
    summaryCompletedRounds: "Manches terminées :",
    summaryAllDone: "Bien joué ! Vous avez réussi toutes les @cards cartes @max fois de suite !",
    confirmStartingOverHeader: "Recommencer ?",
    confirmStartingOverBody: "Toute votre progression sera perdue. Êtes-vous sûr de vouloir recommencer ?",
    confirmStartingOverCancelLabel: "Annuler",
    confirmStartingOverConfirmLabel: "Recommencer",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Complex Fill the Blanks\".",
    complex_blanks_prompt_mission: "**Ta mission :**",
    complex_blanks_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Structure du JSON attendu :**",
    complex_blanks_prompt_json_structure_main_object: "L'objet principal doit contenir les clés `content` et `overallFeedback`.",
    complex_blanks_prompt_task: "`task`: La consigne de l'exercice (en HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: Le texte contenant les trous, représentés par `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: Un tableau d'objets, un pour chaque trou, dans l'ordre d'apparition.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: La bonne réponse (peut inclure des alternatives avec `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: Un tableau d'objets pour les erreurs fréquentes.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: Le texte d'une erreur fréquente.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: Le feedback spécifique pour cette erreur (en HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: Un tableau pour les feedbacks généraux basés sur le score.",
    complex_blanks_prompt_content_rules_title: "**Règles pour le contenu :**",
    complex_blanks_prompt_rule1: "1. Le nombre d'objets dans `blanksList` doit correspondre au nombre de trous dans `blanksText`.",
    complex_blanks_prompt_rule2: "2. Propose des erreurs fréquentes et des feedbacks constructifs.",
    complex_blanks_prompt_rule3: "3. Le texte et les feedbacks peuvent contenir des balises HTML simples comme `<p>`, `<strong>`, `<em>`.",
    complex_blanks_prompt_example_json_title: "**Exemple de JSON :**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Mets les verbes au temps correct. Tu recevras un retour individuel pour les erreurs typiques.</p>",
"blanksList": [
{
"correctAnswerText": "ne parle pas",
"incorrectAnswersList": [
{
"incorrectAnswerText": "parle pas",
"incorrectAnswerFeedback": "<div>N'oublie pas d'utiliser 'ne ... pas' pour la négation complète du verbe <em>(parler)</em>.</div>"
},
{
"incorrectAnswerText": "ne parlent pas",
"incorrectAnswerFeedback": "<div>Tu as oublié la terminaison du 'troisième personne du singulier' au présent simple <em>(il)</em>.</div>"
}
]
}
],
"blanksText": "<p>Il parle anglais mais il (ne / parler) ___________<strong>&nbsp;</strong>allemand.</p>"
},
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback pour 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback pour 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback pour 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback pour 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback pour 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback pour 91-100%" }
]
}
\`\`\` `,
    complex_blanks_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // Chart Prompt
    chart_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité H5P \"Chart\".",
    chart_prompt_mission: "**Ta mission :**",
    chart_prompt_generate_json: "Génère un objet JSON complet et valide pour une activité H5P de type Chart.",
    chart_prompt_json_structure_title: "**Structure du JSON attendu :**",
    chart_prompt_json_structure_main_object: "L'objet doit contenir :",
    chart_prompt_graph_mode: "`graphMode`: Choisis le type de diagramme le plus pertinent, 'pieChart' (circulaire) ou 'barChart' (barres), en fonction du contexte, sauf instruction contraire.",
    chart_prompt_list_of_types: "`listOfTypes`: Un tableau d'objets, chacun représentant un élément du diagramme.",
    chart_prompt_value: "`value`: La valeur numérique de l'élément.",
    chart_prompt_color: "`color`: La couleur de l'élément (code hexadécimal).",
    chart_prompt_font_color: "`fontColor`: La couleur du texte de l'élément (code hexadécimal).",
    chart_prompt_text: "`text`: Le libellé de l'élément.",
    chart_prompt_figure_definition: "`figureDefinition`: Une brève description du diagramme.",
    chart_prompt_content_rules_title: "**Règles pour le contenu :**",
    chart_prompt_rule1: "1.  Choisis des couleurs contrastées pour une bonne lisibilité.",
    chart_prompt_rule2: "2.  Les libellés doivent être courts et clairs.",
    chart_prompt_rule3: "3.  Si une valeur est très faible par rapport aux autres, privilégie un 'barChart' pour une meilleure visualisation.",
    chart_prompt_example_json_title: "**Exemple de JSON :**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Myrtilles"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Framboises"}
],
"figureDefinition": "Graphique"
}
\`\`\` `,
    chart_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Retour",
    quiz_next_button: "Suivant",
    quiz_finish_button: "Terminer",
    quiz_submit_button: "Vérifier",
    quiz_textual_progress: "Question @current sur @total",
    quiz_no_result_message: "Terminé",
    quiz_result_message: "Vos résultats :",
    quiz_score_bar_label: "Vous avez obtenu @finals sur @totals points",
    quiz_solution_button_text: "Voir la solution",
    quiz_retry_button_text: "Recommencer",
    quiz_finish_button_text: "Terminer",
    quiz_submit_button_text: "Soumettre",
    quiz_feedback_available: "Feedback disponible",
    quiz_read_feedback: "Lire le commentaire",
    quiz_wrong_answer: "Mauvaise réponse",
    quiz_correct_answer: "Bonne réponse",
    quiz_should_check: "Il fallait cocher ici",
    quiz_should_not_check: "Il ne fallait pas cocher ici !",
    quiz_no_input: "Répondez s'il vous plait avant de visionner la solution.",
    quiz_a11y_check: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
    quiz_a11y_show_solution: "Show the solution. The task will be marked with its correct solution.",
    quiz_a11y_retry: "Retry the task. Reset all responses and start the task over again.",

    // IA de Caramel — génération
    generate_with_llm: "Générer avec l'IA de Caramel",
    generation_in_progress: "Génération en cours, veuillez patienter...",
    request_sent_to_ia: "Requête lancée à l'IA, veuillez patienter...",
    generation_successful: "Contenu H5P généré avec succès !",
    generation_failed_empty: "La génération a échoué. La réponse était vide.",
    generation_failed_error: "Erreur lors de la génération : {errorMessage}",
    generation_failed_llm: "La génération via l'IA de Caramel a échoué. Cause : {errorMessage}",

    // Descriptions des modèles (IA de Caramel)
    llm_small_summary: "Caramel mou : rapide, léger, parfait pour les exercices flash et les réponses sans attente. Consomme peu.",
    llm_large_summary: "Caramel coulant : plus riche, plus nuancé, idéal pour les tâches qui demandent un peu de profondeur. Consomme davantage.",
    llm_xl_summary: "Caramel dur : puissant et complexe, à réserver aux projets ambitieux. Patience requise, résultat garanti ! Consomme beaucoup plus.",
 
    // Noms conviviaux pour les modèles (affichage menu)

    // Indications des modèles (IA de Caramel)
    llm_model_source: "Fournisseur du modèle :",
    llm_model_parameters: "Taille modèle :",
    llm_model_parameters_unit: "Mrd paramètres",

    language: "Langue",
    tutorial: "Tutoriel",
    version_modal_title: "Nouvelle version disponible",
    version_modal_message: "Vous utilisez actuellement la version {currentVersion}. Une version plus récente ({latestVersion}) est disponible. Rechargez la page pour profiter des dernières améliorations.",
    version_modal_update: "Charger la nouvelle version",
    version_modal_remind_later: "Me le rappeler plus tard",

    // Glossaire XML Prompt
    glossaire_xml_prompt_role: "Tu es un expert en ingénierie pédagogique et tu vas créer le contenu pour un glossaire.",
    glossaire_xml_prompt_mission: "**Ta mission :** Tu dois générer un objet JSON simple contenant une liste de termes pour un glossaire. Chaque terme doit avoir un concept, une définition et, si pertinent, une liste d'alias.",
    glossaire_xml_prompt_structure_title: "**Structure du JSON attendu :**",
    glossaire_xml_prompt_structure_rules: `
-   **Racine :** Un objet principal contenant deux clés : \`name\` (le nom du glossaire) et \`entries\` (un tableau d'objets).
-   **Chaque objet dans \`entries\` doit contenir :**
    -   \`concept\` : Le mot ou l'expression à définir.
    -   \`definition\` : La définition claire et concise. Utilise *mot* pour mettre en gras, **mot** pour mettre en italique et \\n pour les sauts de ligne, uniquement lorsque c'est pertinent pédagogiquement.
    -   \`aliases\` (optionnel) : Un tableau de chaînes de caractères pour les synonymes ou termes alternatifs. N'ajoute cette clé que si des alias pertinents existent.`,
    glossaire_xml_prompt_example_title: "**Exemple de JSON :**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "Le lexique de l'information",
  "entries": [
    {
      "concept": "Journaliste",
      "definition": "Personne qui **collecte**, vérifie et diffuse des *informations*.",
      "aliases": ["Reporter", "Chroniqueur"]
    },
    {
      "concept": "Source",
      "definition": "Origine d'une *information*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Génère uniquement le code JSON valide, sans aucun commentaire.",
    
    //Barre de menu
    tab_all: "Tout",
    tab_quiz: "Quiz & Tests",
    tab_text: "Manipulation de texte",
    tab_memory: "Mémorisation & Découverte",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 Obtenir le prompt à copier",
    create_file_step: "2/2 Créer le fichier à partir du JSON",
    generate_one_click: "Générer en un clic",
    simple_mode: "Simple",
    advanced_mode: "Guidé",
    
    // RAG feature
    activate_rag: "Activer la consultation de document",
    rag_tooltip: "Permet de copier-coller un texte ou de charger un PDF. Le contenu sera utilisé comme source principale pour générer les activités.",
    rag_title: "Joindre des documents (facultatif)",
    rag_note: "Si vous souhaitez que l'IA travaille exclusivement à partir de vos documents, collez votre texte ou déposez vos fichiers ici. Sinon, laissez cette zone vide pour permettre à l'IA de rechercher les informations par elle-même.",
    upload_pdf: "Ou téléverser un PDF pour analyse",
    pdf_loading: "Chargement du PDF...",
    pdf_processing_page: "Traitement de la page",
    ocr_recognizing_page: "Reconnaissance (OCR) de la page",
    ocr_success: "Le document a été traité avec succès.",
    ocr_error: "Une erreur est survenue lors du traitement.",
    error_invalid_pdf: "Veuillez sélectionner un fichier PDF valide.",
    error_duplicate_pdf: "Ce fichier a déjà été ajouté.",
    error_fullscreen: "Le mode plein écran a échoué:",
    lock_text: "Verrouiller",
    unlock_text: "Déverrouiller",
    rag_instruction: "\n\nTu devras uniquement pour générer le contenu consulter les infos suivantes :",
    drag_drop_text: "Glissez-déposez un fichier PDF ici",
    or_text: "ou",
    upload_pdf_btn: "Choisissez un fichier",
    paste_your_text_here: "Copiez-collez votre texte ici...",
    rag_tags_tuto: "Retrouvez ci-dessous les documents déposés. Cliquez sur le cercle de couleur pour personnaliser le surlignage de chaque document.",
    
    // Caramel Animation Steps
    caramel_animation_step_1: "On verse le sucre dans la casserole...",
    caramel_animation_step_2: "On ajoute un peu d'eau...",
    caramel_animation_step_3: "On fait chauffer à feu moyen...",
    caramel_animation_step_4: "Le sucre commence à fondre...",
    caramel_animation_step_5: "Ça commence à colorer...",
    caramel_animation_step_6: "On remue doucement...",
    caramel_animation_step_7: "Le caramel prend une belle couleur ambrée...",
    caramel_animation_step_8: "On ajoute la crème chaude...",
    caramel_animation_step_9: "Attention aux éclaboussures !",
    caramel_animation_step_10: "On mélange bien...",
    caramel_animation_step_11: "C'est presque prêt !",

    // Page Prompt
    page_prompt_role: "Tu es un expert en ingénierie pédagogique créant une activité Page, structurée, pour Éléa/Moodle.",
    page_prompt_mission: "**Ta mission :**",
    page_prompt_generate_json: "Génère un objet JSON pour construire une page de contenu Éléa. La structure de la page est basée sur des blocs prédéfinis. Tu dois sélectionner les blocs les plus pertinents parmi la liste ci-dessous pour répondre à la demande de l'utilisateur.",
    page_prompt_json_structure_title: "**Structure du JSON attendu :**",
    page_prompt_json_structure_main_object: "L'objet principal doit contenir une clé \"title\" pour le titre de la page, une clé \"intro\" pour une introduction claire et compréhensible du contenu de cours qui suit, et une clé \"blocks\" qui est un tableau d'objets. Chaque objet représente un bloc de contenu et doit avoir un \"type\" correspondant à un des blocs ci-dessous, et un objet \"data\" contenant les informations spécifiques au bloc.",
    page_prompt_blocks_list_title: "**Liste des blocs disponibles :**",
    page_prompt_block_01: "- `#01_hero_header`: Bandeau d'ouverture. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: Sommaire avec des liens internes. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: Repères historiques en 3 cartes. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (max 3 cartes)",
    page_prompt_block_04: "- `#04_callout_set`: Bandeaux Objectifs, À savoir, Alerte. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: Chiffres-clés en cartes. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: Tableau de vocabulaire. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: Glossaire en pastilles. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: Cartes monuments avec images. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: Deux images comparées. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: Tableau de comparaison. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: Encadré Définition. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"Définition\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: Paragraphes de cours. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: Fiche détaillée. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: Foire aux questions. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: Mythes vs Réalités. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"Mythes\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"Réalités\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: Méthode pour décrire une image. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: Sitographie. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"Sitographie\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: Citation bilingue. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**Règles pour le contenu :**",
    page_prompt_rule1: "1.  Le JSON doit être valide.",
    page_prompt_rule2: "2.  Le contenu textuel peut utiliser les balises Markdown `*mot*` pour le gras et `**mot**` pour l'italique.",
    page_prompt_rule3: "3.  Pour les images, trouve des URL pertinentes et libres de droits (ex: Wikimedia Commons).",
    page_prompt_example_json_title: "**Exemple de JSON :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "La Révolution Française",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "La Révolution Française", "subtitle": "Repères essentiels" } },
    { "type": "#12_context_paragraphs", "data": { "title": "Contexte", "paragraphs": ["La Révolution française est une période de bouleversements...", "Plusieurs causes expliquent cet événement..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "Événements clés", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "Prise de la Bastille", "caption": "14 juillet 1789", "title": "Prise de la Bastille", "text": "Cet événement marque le début de la Révolution." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "Génère uniquement le code JSON valide, sans aucun commentaire."
};
