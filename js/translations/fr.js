const translations_fr = {
  subtitle: "Création Assistée de Ressources et d'Activités Magistère et Éléa",
  help_modal_title: "🚀 Guide complet de Caramel pour les enseignants",
  help_modal_content: `
    <p>Bienvenue sur <strong>Caramel</strong> ! Ce guide est conçu pour vous accompagner pas à pas, même si vous débutez. Notre objectif est de vous aider à créer des activités pédagogiques interactives, de manière simple et efficace.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Décrire</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Choisir</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Générer</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Visualiser & télécharger</a>
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
                <li><strong>Que souhaitez-vous aborder ?</strong> C'est le cœur de votre demande. Soyez aussi complet que possible. N'hésitez pas à inclure le thème, le niveau, et les contraintes. Exemple : <em>Une introduction aux fractions pour des élèves de 6e, avec des exemples concrets comme le partage d'un gâteau.</em></li>
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
            Cette option puissante vous permet de baser la génération sur un contenu que vous fournissez. Vous pouvez soit <strong>copier-coller un texte</strong>, soit <strong>télécharger un document (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
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
            <h5><i class="fas fa-rocket"></i> Option A : Affichage Simple - Générer en un clic</h5>
            <p>La voie rapide. Cliquez sur le bouton <button class="help-btn-example-llm">Générer en un clic</button> pour que l'IA produise le contenu et le place directement dans la zone de résultat à droite. Vous pouvez choisir entre différents modèles d'IA (rapide, puissant...) via la petite flèche sur le côté droit du bouton.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Option B : Affichage Guidé - Utiliser une IA externe</h5>
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
        <h4><span class="help-step-number">4</span> Visualiser et télécharger</h4>
        <p>Une fois le contenu généré, vous pouvez le visualiser, le tester et le télécharger sous différents formats.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> Visualiser et tester</summary>
            <p>Prenez le temps de vérifier votre activité dans la fenêtre de visualisation :</p>
            <ul>
                <li><strong>Faites défiler</strong> le contenu pour tout relire.</li>
                <li><strong>Testez</strong> l'activity comme un élève (cliquez, glissez, écrivez...).</li>
                <li>Pour les contenus <strong>Éléa/Magistère/Moodle</strong>, un simulateur vous montre le rendu réel.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Fenêtre de visualisation" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Testez l'activité directement dans le simulateur.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Télécharger (Formats & Exports)</summary>
            <p>Vous avez plusieurs options pour récupérer votre travail :</p>
            <ul>
                <li><strong>Format interactif (bouton principal) :</strong> Pour récupérer le fichier numérique (ex: .h5p, .mbz) à mettre sur votre plateforme.</li>
                <li><strong>Autres formats (menu déroulant) :</strong> Cliquez sur la flèche pour télécharger en <strong>PDF, DOCX ou ODT</strong> (utile pour imprimer ou archiver).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Menu d'export" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Déroulez le menu pour accéder aux exports PDF, DOCX...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Intégrer dans Éléa/Magistère</h5>
        <p>Une fois le fichier téléchargé, voici comment l'ajouter à votre cours :</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Activités H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Méthode simple :</strong> Activez le mode édition dans votre cours, puis glissez-déposez le fichier .h5p directement dans la section de votre choix. Choisissez "Ajouter une activité H5P" puis terminez avec le bouton "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="Ajouter rapidement une activité H5P" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Ajoutez l'activité H5P puis cliquez sur DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Méthode recommandée (pour les concepteurs) :</strong> Cliquez sur "Ajouter une activité ou une ressource", choisissez "Contenu interactif (H5P)", puis dans le champ "Éditeur", choisissez l'onglet "Téléverser" et poursuivez avec "Téléverser un fichier". Terminez en cliquant sur "Utiliser", ajoutez les éléments nécessaires puis enregistrez. Cette méthode garantit que l'activité sera bien incluse si vous partagez votre parcours.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Page, Millionnaire, Appariement, QCM)</summary>
                <div class="import-content">
                    <p>Ce format importe une activité complète dans votre cours.</p>
                    <ol>
                        <li>
                            <p>Ouvrez le menu d'édition situé à droite de l'écran. S'il est replié, utilisez la petite flèche pour le faire apparaître.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Menu d'édition ouvert dans la colonne de droite" style="width:75%;height:auto;">
                                    <figcaption><em>Menu d'édition ouvert.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Flèche pour déplier le panneau d'édition" style="width:75%;height:auto;">
                                    <figcaption><em>Dépliez le panneau si besoin.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Cliquez sur "IMPORT/EXPORT", puis sur "Importer un parcours" dans le sous-menu qui apparaît.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="Bouton IMPORT/EXPORT dans Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Sélectionnez Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Glissez-déposez votre fichier .mbz dans la zone d'importation et cliquez sur "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Zone pour déposer le fichier MBZ" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Déposez le fichier puis validez avec IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>Terminez en cliquant sur "CONTINUER" à la dernière étape : l'activité est maintenant dans votre cours.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Activité Glossaire)</summary>
                <div class="import-content">
                    <p>Ce format permet d'importer une liste de définitions dans un glossaire Éléa/Moodle.</p>
                    <ol>
                        <li>
                            <p>Créez une activité Glossaire vierge dans votre cours et ouvrez-la.</p>
                        </li>
                        <li>
                            <p>Une fois à l'intérieur du Glossaire, cliquez sur le bouton "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="Bouton IMPORTER DES ARTICLES dans le glossaire" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Cliquez sur IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Glissez-déposez votre fichier .xml dans la zone d'importation et cliquez sur le bouton "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Zone de dépôt pour le fichier XML du glossaire" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Déposez le fichier puis validez avec ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Vos articles ont été détectés. Terminez en cliquant sur le bouton "CONTINUER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Confirmation de détection des articles" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Cliquez sur CONTINUER pour finaliser l'importation.</em></figcaption>
                            </figure>
                        </li>
                        <li>L'importation est terminée. Vos définitions sont maintenant disponibles dans le Glossaire.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> et <span class="help-badge-file">.GIFT</span> (Activité Test)</summary>
                <div class="import-content">
                    <p>Ces formats importent des questions dans votre "Banque de questions".</p>
                    <ol>
                        <li>
                            <p>Dans votre parcours Éléa, allez dans l'onglet "Plus", puis cliquez sur "Banque de questions".</p>
                        </li>
                        <li>
                            <p>Dans le menu déroulant où est indiqué "Questions", sélectionnez "Importer".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Sélection du bouton Importer dans la banque de questions" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Sélectionnez Importer dans le menu déroulant.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Cochez le format correspondant à votre fichier :</p>
                            <ul>
                                <li><strong>Format XML Moodle</strong> (recommandé) : format complet supportant tous les types de questions.</li>
                                <li><strong>Format GIFT</strong> : alternative plus simple mais limitée en types de questions.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Choix entre Format XML Moodle et Format GIFT" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Sélectionnez le format adapté à votre fichier.</em></figcaption>
                            </figure>
                        </li>
                        <li>Glissez-déposez votre fichier dans la zone de dépôt.</li>
                        <li>Cliquez sur le bouton "IMPORTATION". L'écran affiche alors les questions ajoutées (par exemple : 10 questions ont été ajoutées).</li>
                        <li>Terminez en cliquant sur "CONTINUER" en bas de page.</li>
                        <li>Les questions sont maintenant prêtes à être ajoutées à une activité Test. Consultez le <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">tutoriel Éléa</a> pour créer une activité Test et charger des questions depuis la banque.</li>
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
                        <li>Dans l'éditeur de texte de la page, cliquez sur l'icône pour basculer en mode HTML (souvent représentée par "&lt;&gt;").</li>
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

  // ============================================================================
  // INTERFACE PRINCIPALE
  // ============================================================================
  language: "Langue",
  tutorial: "Tutoriel",
  notifications: "Notifications",
  fast_mode: "Mode Rapide",
  guided_mode: "Mode Avancé",
  who_are_you: "Qui êtes-vous ? (ex: Enseignant, formateur...)",
  what_to_address: "Que souhaitez-vous aborder ? (ex: La révolution française...)",
  level: "Pour quel niveau (ex : Seconde en bac professionnel)",
  number_of_elements: "Nombre de questions/éléments dans le module (ex : 5)",

  // ============================================================================
  // RAG/OCR
  // ============================================================================
  rag_title: "Joindre des documents (facultatif)",
  rag_note: "Si vous souhaitez que l'IA travaille exclusivement à partir de vos documents, collez votre texte ou déposez vos fichiers ici. Sinon, laissez cette zone vide pour permettre à l'IA de rechercher les informations par elle-même.",
  error_duplicate_file: "Ce fichier a déjà été ajouté.",
  error_unsupported_format: "Format non supporté. Formats acceptés : ",
  ocr_scanned_page: "Page scannée détectée, OCR en cours",
  ocr_image_processing: "Reconnaissance (OCR) de l'image",
  ocr_initializing: "Initialisation de l'OCR...",
  ocr_loading_language: "Chargement du modèle de langue...",
  ocr_preparing: "Préparation de l'analyse...",
  docx_processing: "Extraction du texte DOCX...",
  pptx_processing: "Extraction du texte PPTX...",
  odt_processing: "Extraction du texte ODT...",
  odp_processing: "Extraction du texte ODP...",
  file_loading: "Chargement du fichier...",
  extraction_success: "Le document a été traité avec succès.",
  extraction_error: "Une erreur est survenue lors du traitement.",
  error_fullscreen: "Le mode plein écran a échoué:",
  lock_text: "Verrouiller",
  unlock_text: "Déverrouiller",
  drag_drop_text: "Glissez-déposez un document ici (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "ou",
  upload_pdf_btn: "Choisissez un fichier",
  paste_your_text_here: "Copiez-collez votre texte ici...",
  rag_tags_tuto: "Retrouvez ci-dessous les documents déposés. Cliquez sur le cercle de couleur pour personnaliser le surlignage de chaque document.",

  // ============================================================================
  // ONGLETS
  // ============================================================================
  tab_all: "Tout",
  tab_quiz: "Quiz & Tests",
  tab_text: "Manipulation de texte",
  tab_memory: "Mémorisation & Découverte",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // ACTIVITES H5P - DETAILS
  // ============================================================================
  h5p_timeline_name: "Frise chronologique",
  h5p_timeline_description: "Créez une frise chronologique interactive pour présenter une séquence d'événements.",
  h5p_flashcards_name: "Cartes mémoires",
  h5p_flashcards_description: "Créez des cartes recto-verso pour aider à la mémorisation de termes et définitions.",
  h5p_quiz_set_name: "Quiz mixte",
  h5p_quiz_set_description: "Composez une série de questions variées (QCM, glisser-déposer, etc.) pour évaluer les connaissances.",
  h5p_quiz_set_qcm_name: "Quiz QCM",
  h5p_quiz_set_qcm_description: "Créez un quiz composé exclusivement de questions à choix multiples (QCM).",
  h5p_quiz_set_vf_name: "Quiz Vrai/Faux",
  h5p_quiz_set_vf_description: "Créez un quiz composé exclusivement de questions de type Vrai ou Faux.",
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
  h5p_true_false_description: "Créez une <strong style='color: red;'>unique</strong> question simple avec une réponse binaire : vrai ou faux.",
  h5p_multiple_choice_name: "Choix multiples",
  h5p_multiple_choice_description: "Créez une <strong style='color: red;'>unique</strong> question à choix multiples avec une ou plusieurs bonnes réponses.",
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

  // ============================================================================
  // ACTIVITES ÉLÉA/MOODLE - DETAILS
  // ============================================================================
  moodle_xml_name: "Test",
  moodle_xml_description: "Générez une banque de questions à importer directement dans une activité Test (au format xml ou format gift)",
  moodle_xml_help: "Pour ajouter un fichier XML dans une activité « Test » sur Moodle, commencez par créer l'activité. Ensuite, ouvrez le menu <strong>Plus</strong> et allez dans <strong>Banque de questions</strong>. Dans ce menu, cliquez sur <strong>Importer</strong>, choisissez le format <strong>XML Moodle</strong>, puis sélectionnez votre fichier et validez.",
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
  glossaire_success_generation: "Fichier {fileName} généré avec succès !",
  glossaire_error_creation: "Erreur lors de la création du XML du glossaire:",
  glossaire_error_invalid_json: "Le JSON doit contenir un nom ('name') et un tableau d'entrées ('entries').",
  elea_page_name: "Page",
  elea_page_description: "Créer une page de contenu Éléa mise en forme visuellement.",

  // ============================================================================
  // MODALE DE GENERATION
  // ============================================================================
  get_prompt_step: "1/2 Obtenir le prompt à copier",
  create_file_step: "2/2 Créer le fichier à partir du JSON",
  generate_one_click: "Générer en un clic",
  simple_mode: "Simple",
  advanced_mode: "Guidé",
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
  export_docx: "Format DOCX",
  export_odt: "Format ODT",
  export_pdf: "Format PDF",
  export_error: "Erreur lors de l'export",
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
  generate_prompts_placeholder: "Le prompt pour l'IA apparaîtra ici une fois que vous aurez complété au moins un champ du mode Rapide ou du mode Avancé.",
  paste_json_or_text: "Collez ici le contenu JSON ou le texte généré par l'IA pour créer votre activité.",
  info_prompt_copy: "Ne collez pas ce prompt dans le panneau de droite. Copiez-le dans une IA grand public afin d'obtenir le résultat, puis collez ce résultat dans le panneau de droite.",
  generate_with_llm: "Générer avec l'IA de Caramel",
  generation_in_progress: "Génération en cours, veuillez patienter...",
  request_sent_to_ia: "Requête lancée à l'IA, veuillez patienter...",
  generation_successful: "Contenu H5P généré avec succès !",
  generation_failed_empty: "La génération a échoué. La réponse était vide.",
  generation_failed_error: "Erreur lors de la génération : {errorMessage}",
  generation_failed_llm: "La génération via l'IA de Caramel a échoué. Cause : {errorMessage}",
  llm_small_summary: "Caramel mou : rapide, léger, parfait pour les exercices flash et les réponses sans attente. Consomme peu.",
  llm_large_summary: "Caramel coulant : plus riche, plus nuancé, idéal pour les tâches qui demandent un peu de profondeur. Consomme davantage.",
  llm_xl_summary: "Caramel dur : puissant et complexe, à réserver aux projets ambitieux. Patience requise, résultat garanti ! Consomme beaucoup plus.",
  llm_model_source: "Fournisseur du modèle :",
  llm_model_parameters: "Taille modèle :",
  llm_model_parameters_unit: "Mrd paramètres",

  // ============================================================================
  // ANIMATION CARAMEL
  // ============================================================================
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
  caramel_success_title: "Votre sucrerie est prête !",

  // ============================================================================
  // NOTIFICATIONS ET ERREURS
  // ============================================================================
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
  error_paste_json_content: "Veuillez coller le contenu JSON généré.",
  error_paste_xml_content: "Veuillez coller le contenu XML généré.",
  moodle_xml_success_generation: "Fichier {fileName} généré avec succès !",
  test_error_creation_mbz: "Erreur lors de la création du MBZ pour le Test:",
  test_success_generation: "Fichier {fileName} généré avec succès !",
  test_error_generic: "Erreur :",
  test_backup_log: "Sauvegarde créée automatiquement par Caramel\n",
  millionnaire_error_compression_libs: "Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées. Veuillez vérifier votre connexion internet ou rafraîchir la page.",
  millionnaire_error_invalid_json: "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' de 6 questions conformes à l'exemple.",
  millionnaire_activity_intro: "Participez à ce jeu pour tester vos connaissances.",
  millionnaire_backup_log: "Sauvegarde créée automatiquement par Caramel\n",
  millionnaire_success_generation: "Fichier {fileName} généré avec succès !",
  millionnaire_error_creation_mbz: "Erreur lors de la création du MBZ:",
  millionnaire_error_generic: "Erreur :",
  appariement_error_invalid_json: "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'pairs' où chaque paire a une 'question' et une 'answer'.",
  appariement_activity_intro: "Trouvez les paires correspondantes.",
  appariement_success_generation: "Fichier {fileName} généré avec succès !",
  appariement_error_creation_mbz: "Erreur lors de la création du MBZ pour l'appariement:",
  qcm_error_invalid_json: "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' avec au moins une question et des réponses.",
  qcm_activity_intro: "Répondez aux questions suivantes.",
  qcm_success_generation: "Fichier {fileName} généré avec succès !",
  qcm_error_creation_mbz: "Erreur lors de la création du MBZ pour le QCM:",
  version_modal_title: "Nouvelle version disponible",
  version_modal_message: "Vous utilisez actuellement la version {currentVersion}. Une version plus récente ({latestVersion}) est disponible. Rechargez la page pour profiter des dernières améliorations.",
  version_modal_update: "Charger la nouvelle version",
  version_modal_remind_later: "Me le rappeler plus tard",

  prompt_header_pedagogical_context: "CONTEXTE PÉDAGOGIQUE",
  prompt_header_specific_rules: "RÈGLES SPÉCIFIQUES",
  prompt_header_pedagogical_rules: "RÈGLES PÉDAGOGIQUES",
  prompt_header_sources: "SOURCES",
  prompt_header_json_structure: "STRUCTURE DU JSON ATTENDUE",
  prompt_header_rendering_example: "EXEMPLE DE RENDU",
  prompt_fallback_teacher: "un enseignant",
  prompt_fallback_activity: "créer une activité pédagogique",

  // ============================================================================

  // --- CLÉS COMMUNES ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- Ton rôle : [QUI]. Expert en didactique et ingénierie pédagogique
- Ton objectif pédagogique : [QUOI]
- Ton public : [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Adaptation et vocabulaire : Adapte le ton, le vocabulaire et la difficulté des consignes au public indiqué. Sois pertinent et engageant.
- Ton et feedback : Les consignes et remarques doivent être constructives, encourageantes, tournées vers l'apprentissage.
- Conformité : Adapte OBLIGATOIREMENT les contenus aux références officielles en vigueur. Sauf mention contraire explicite, base-toi par défaut sur les programmes scolaires français (Eduscol) pour le public scolaire, et sur les textes réglementaires de la formation professionnelle pour les adultes.
- Langue : Le contenu et les consignes doivent être rédigés en français.`,

  SOURCES_COMMUNES: `- Tu utiliseras UNIQUEMENT les textes suivants pour générer ton activité.
---
[RAG]
---`,

  // ============================================================================
  // === TIMELINE (Frise chronologique) ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Nombre d'événements : Au minimum 5 événements || [NOMBRE_ELEMENTS] événements.
- Périodes (era) : Au minimum 2 périodes couvrant des groupes d'événements.
- Médias : Ajoute des crédits et légendes pour chaque actif si possible. Recherche activement une image pertinente et libre de droits (ex: Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- **Objet racine :** Contient la clé \`timeline\` (objet).
- **Contenu de \`timeline\` :** Structure principale de l'activité.
  - \`headline\` : Titre général de la frise (texte brut obligatoire).
  - \`text\` : Introduction captivante (Markdown supporté).
  - \`asset\` : Média de couverture (\`media\` : URL directe, \`caption\` : légende, \`credit\` : source).
  - \`date\` : Tableau des événements chronologiques.
  - \`era\` : Tableau des périodes de fond (définissent des plages colorées en arrière-plan).
- **Structure des objets \`date\` et \`era\` :**
  - \`startDate\` : **Format strict** \`YYYY,MM,DD\` ou \`YYYY\`. (Obligatoire)
  - \`endDate\` : **Format strict** \`YYYY,MM,DD\` ou \`YYYY\`. (Optionnel, définit une durée/fin de période)
  - \`headline\` : Titre explicite de l'élément (texte brut obligatoire).
  - \`text\` : Narration pédagogique. Utilise \`**mot**\` pour le gras, \`*mot*\` pour l'italique et \`\\n\` pour les sauts de ligne.
  - \`asset\` : (Optionnel) Objet média (\`media\` : URL directe Wikimedia Commons, \`caption\`, \`credit\`).
  - \`tag\` : Mot-clé court (ex: 'Politique', 'Science') permettant le filtrage.
- **LaTeX :** Utilise le double échappement : \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "L'Histoire de la conquête spatiale",
    "text": "Découvrez les grandes étapes qui ont marqué l'aventure de l'homme dans l'**espace**.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Décollage de la mission Apollo 11.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Lancement de Spoutnik 1",
        "text": "Le **premier satellite artificiel** est mis en orbite par l'URSS.",
        "tag": "Robotique"
      },
      {
        "startDate": "1969,07,20",
        "headline": "Premier pas sur la Lune",
        "text": "Neil Armstrong devient le premier homme à marcher sur la Lune lors de la mission **Apollo 11**.",
        "tag": "Humain"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "La Guerre Froide spatiale",
        "text": "Période de rivalité intense entre les États-Unis et l'URSS.",
        "tag": "Contexte"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === CROSSWORD (Mots croisés) ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Nombre de mots : Au minimum 6 mots || [NOMBRE_ELEMENTS] mots.
- Règles typographiques : Les réponses (\`answer\`) ne doivent contenir que des lettres. Tout mot composé, acronyme ou expression doit être fusionné en un seul mot sans espaces, tirets ou autres caractères (ex: 'arc-en-ciel' devient 'arcenciel', 'D-DAY' devient 'DDAY').
- Indices (\`clue\`) : Il est interdit d'écrire le mot à trouver dans l'indice. Ils doivent être courts et précis.
- Indice supplémentaire (\`extraClue\`) : L'IA doit juger de la pertinence d'en ajouter un.`,

  CROSSWORD_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`title\` : Un titre pour l'activité.
- \`words\` : Un tableau d'objets contenant :
  - \`answer\` : Le mot à deviner (fusionné sans espaces ni tirets).
  - \`clue\` : La définition courte et précise.
  - \`extraClue\` (optionnel) : Un objet \`{"params": {"text": "..."}}\`. Le texte peut utiliser \`**mot**\` pour le gras, \`*mot*\` pour l'italique et \`\\n\` pour les sauts de ligne.
- \`taskDescription\` : Une consigne claire et contextualisée. Utilise \`**mot**\` pour le gras, \`*mot*\` pour l'italique et \`\\n\` pour les sauts de ligne. Après un saut de ligne, précise : "Pour les mots composés, ne mettez ni espace ni tiret (ex: 'portecles' pour 'porte-clés')."
- \`overallFeedback\` : (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Mots croisés sur la Biologie",
  "words": [
    {"answer": "Cellule", "clue": "Unité de base de la vie.", "extraClue": {"params": {"text": "Elle peut être **animale** ou **végétale**."}}},
    {"answer": "ADN", "clue": "Molécule portant l'information génétique."}
  ],
  "taskDescription": "**Complète** la grille avec les termes de biologie.\\nPour les mots composés, ne mettez ni espace ni tiret (ex: 'portecles' pour 'porte-clés').",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions de biologie."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Cartes mémoires) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Nombre de cartes : Au minimum 5 cartes || [NOMBRE_ELEMENTS] cartes.
- Association : Le recto et le verso doivent être reliés par un critère unique et stable (ex : définition -> terme, événement -> date, auteur -> œuvre). Utilise la même relation pour toutes les cartes et formule la consigne ainsi : « Associe chaque X à Y ».`,

  FLASHCARDS_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet doit contenir :
  - \`title\` : Un titre pertinent pour l'activité.
  - \`description\` : Une consigne claire pour l'élève.
  - \`cards\` : Un tableau d'objets, où chaque objet représente une carte (flashcard) et contient :
    - \`text\` : La question ou le terme à deviner (recto).
    - \`answer\` : Réponse ou définition (verso). Règles de normalisation : un seul mot simple ou un nombre (pas de mots composés), minuscules (sauf noms propres), sans article ni ponctuation, nombres en chiffres.
    - \`tip\` (optionnel) : Indice pour aider l'élève. Tu peux utiliser \`**mot**\` pour le gras et \`*mot*\` pour l'italique.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Capitales de l'Europe",
  "description": "Associe chaque pays à sa capitale.",
  "cards": [
    {
      "text": "France",
      "answer": "paris",
      "tip": "C'est la ville de la **Tour Eiffel**."
    },
    {
      "text": "Espagne",
      "answer": "madrid",
      "tip": "Située au centre de la péninsule *ibérique*."
    },
    {
      "text": "Italie",
      "answer": "rome",
      "tip": "Surnommée la *Ville Éternelle*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (Rédaction) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Mots-clés : Au minimum 5 mots-clés ou expressions attendus dans la réponse || [NOMBRE_ELEMENTS] mots-clés.
- Consigne : La consigne ne doit pas lister les mots-clés attendus pour ne pas donner la réponse, sauf le nom du thème général.`,

  ESSAY_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
L'objet doit contenir :
- \`taskDescription\` : Une consigne claire invitant l'élève à rédiger un texte sur le thème. Utilise \`**mot**\` pour le gras (concepts clés), \`*mot*\` pour l'italique et \`\\n\` pour les sauts de ligne.
- \`keywords\` : Un tableau d'objets définissant les mots-clés attendus. Chaque objet doit avoir la forme :
  \`\`\`json
  {
    "keyword": "mot ou expression",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\` : (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final, contextualisé au thème de l'exercice, en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Rédigez un court texte expliquant le processus de la **photosynthèse**. Votre réponse doit aborder les éléments essentiels permettant aux plantes de produire leur propre énergie.",
  "keywords": [
    {"keyword": "lumière", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "chlorophylle", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "dioxyde de carbone", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "eau", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glucose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "C'est un début. Relis bien le cours sur la photosynthèse." },
    { "from": 11, "to": 30, "feedback": "Tu as identifié quelques éléments. Continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "Ta compréhension progresse. Pense à détailler davantage." },
    { "from": 51, "to": 70, "feedback": "Bon travail ! Tu maîtrises les bases." },
    { "from": 71, "to": 90, "feedback": "Très bien ! Ta rédaction montre une solide compréhension." },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu as une maîtrise parfaite du sujet." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (Glossaire H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Nombre d'entrées : Au minimum 5 termes || [NOMBRE_ELEMENTS] termes.
- Sélection des termes : Identifie les concepts techniques, le vocabulaire spécifique ou les mots complexes présents dans les sources.
- Définitions : Concises, précises et parfaitement adaptées au niveau pédagogique visé.`,

  ACCORDION_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- Le JSON généré doit être un TABLEAU avec autant d'objets que de termes mentionnés précédemment.
- \`title\` : Le mot-clé, l'expression ou la question à définir.
- \`text\` : La définition. Utilise \`**mot**\` pour le gras, \`*mot*\` pour l'italique et \`\\n\` pour les retours à la ligne. Pour les formules mathématiques, utilise le format LaTeX avec double échappement, par exemple : \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Photosynthèse", "text": "Processus par lequel les plantes transforment la **lumière** du **soleil** en énergie.\\nC'est la base de la chaîne alimentaire."},
  {"title": "Cellule", "text": "**Unité** de base de tous les êtres vivants. Il en existe des *eucaryotes* et des *procaryotes*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (Résumé) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Nombre d'étapes : Génère un tableau de 5 étapes minimum || [NOMBRE_ELEMENTS] étapes pour couvrir l'ensemble du sujet.
- Distracteurs : Propose au minimum 2 distracteurs par étape. Ils doivent être cohérents avec le sujet mais comporter des erreurs factuelles ou logiques plausibles.`,

  SUMMARY_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`intro\` : Une phrase d'introduction courte (ex: "Choisissez l'affirmation correcte.").
- \`summaries\` : Tableau d'objets constituant les étapes. Chaque objet contient :
  - \`summary\` : UN tableau de phrases (**Association**). La première phrase de la liste doit TOUJOURS être le résumé correct (affirmation exacte).
  - \`tip\` : (Optionnel) Un indice contextuel pour aider l'élève.
- \`overallFeedback\` : Tableau de 6 objets pour le score final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX :** Utilise le double échappement pour LaTeX : \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Sélectionnez les affirmations correctes pour construire le résumé du cours.",
  "summaries": [
    {
      "summary": [
        "La photosynthèse est un processus biologique permettant aux plantes de transformer l'énergie lumineuse en énergie chimique.",
        "La photosynthèse est un processus qui se déroule uniquement durant la nuit.",
        "La photosynthèse est le mécanisme par lequel les animaux respirent."
      ],
      "tip": "Pensez à la lumière comme source d'énergie."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir." },
    { "from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel." },
    { "from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts." },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (Glisser les mots) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Nombre de mots : Paragraphe d'au minimum 50 mots avec au moins 5 mots à glisser || [NOMBRE_ELEMENTS] mots.
- Unicité : Chaque mot à glisser doit être UNIQUE dans le texte (pas de doublons).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
L'objet doit contenir :
- \`taskDescription\` : Une consigne claire.
- \`textField\` : Le texte à compléter. Chaque phrase doit se terminer par un saut de ligne \`\\n\`.
  - **Format** : \`*mot*\` pour un élément glissable.
- \`overallFeedback\` : Tableau de 6 objets pour le score final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complète le texte en faisant glisser les mots.",
  "textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*.\\nLa plus grande planète est *Jupiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (Texte à trous) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Nombre de trous : Paragraphe d'au minimum 50 mots avec au moins 3 mots à trous || [NOMBRE_ELEMENTS] mots.
- Équilibre : Ne crée pas de trous sur des mots triviaux (articles, prépositions) sauf si c'est l'objectif grammatical. Cible les concepts clés.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
L'objet doit contenir :
- \`taskDescription\` : Une consigne claire et courte expliquant l'objectif de l'activité dans le contexte global. Utilise \`**mot**\` pour le gras (concepts clés), \`*mot*\` pour l'italique et \`\\n\` pour les sauts de ligne.
- \`questions\` : Un tableau de chaînes de caractères. Chaque chaîne représente un bloc de texte à compléter.
  - **Syntaxe des trous** : Entoure les mots à deviner d'astérisques (ex: \`*mot*\`).
  - **Alternatives** : Utilise \`/\` pour les réponses multiples acceptées (ex: \`*mot1/mot2*\`).
  - **Aide** : Utilise \`:\` pour ajouter une infobulle d'aide pédagogique (ex: \`*mot:indice*\`).
- \`overallFeedback\` : (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complétez les lacunes du texte ci-dessous concernant le système solaire.",
  "questions": [
    "La Terre est une *planète* du système *solaire*.",
    "Elle tourne autour du *Soleil:notre étoile* en environ 365 jours."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (Surligner les mots) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Nombre de mots : Paragraphe d'au minimum 50 mots avec au moins 5 mots à surligner || [NOMBRE_ELEMENTS] mots.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
L'objet doit contenir :
- \`taskDescription\` : Une consigne claire et engageante. Tu peux utiliser \`**mot**\` pour le gras et \`*mot*\` pour l'italique uniquement ici.
- \`textField\` : Le texte complet contenant les mots à marquer.
  - **MARQUAGE :** Chaque mot à marquer doit être INDIVIDUELLEMENT entouré d'astérisques. (Ex: \`*mot1* *mot2*\` est correct ; \`*mot1 mot2*\` est incorrect).
  - **PONCTUATION :** Les apostrophes ou les signes de ponctuation NE DOIVENT JAMAIS faire partie du marquage et doivent être séparés du mot par un espace. (Ex: Écrire \`l' *oiseau*\` est correct, \`l'*oiseau*\` est incorrect).
- \`overallFeedback\` : (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Cliquez sur les **noms propres** dans le texte suivant.",
  "textField": "*Paris* est la capitale de la *France*. C'est l' *Europe* qui nous intéresse.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (Vrai/Faux) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Question : Une affirmation claire et sans ambiguïté.
- Réponse : La réponse doit être strictement "true" (Vrai) ou "false" (Faux).
- Feedbacks : Prévois des messages spécifiques pour la réussite (\`feedbackOnCorrect\`) et l'échec (\`feedbackOnWrong\`) pour renforcer l'apprentissage.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet principal doit contenir les clés suivantes :
  - \`question\`: (string) L'affirmation à évaluer. Peut contenir du HTML.
  - \`correct\`: (string) La bonne réponse, soit "true", soit "false".
  - \`feedbackOnCorrect\`: (string) Commentaire affiché si la réponse est correcte.
  - \`feedbackOnWrong\`: (string) Commentaire affiché si la réponse est incorrecte.
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (\`**texte**\`) et l'italique (\`*texte*\`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul.
- **Feedback :** Les feedbacks NE DOIVENT PAS contenir de LaTeX et de Markdown.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo est la capitale de la Norvège.",
  "correct": "true",
  "feedbackOnCorrect": "Bonne réponse ! Oslo est bien la capitale de la Norvège.",
  "feedbackOnWrong": "Mauvaise réponse. La capitale de la Norvège est Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (Choix multiples) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Question : Une question claire à choix multiples.
- Réponses : Propose plusieurs choix de réponse (\`answers\`). Il ne doit y avoir qu'une seule bonne réponse (\`"correct": true\`) et plusieurs distracteurs plausibles (\`"correct": false\`).
- Feedbacks :
  - \`overallFeedback\` : (RÈGLE STRICTE) Tu dois obligatoirement générer un tableau de 6 objets pour le feedback final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet principal doit contenir les clés suivantes :
  - \`question\`: (string) L'énoncé de la question. Peut contenir du HTML.
  - \`answers\`: (array) Tableau d'objets, chacun représentant une réponse.
    - \`text\`: (string) Le texte de la réponse.
    - \`correct\`: (boolean) \`true\` si c'est une bonne réponse, \`false\` sinon.
    - \`tipsAndFeedback\`: (object, optionnel) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (array) Tableau de 6 objets définissant les feedbacks par tranche de score.
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (\`**texte**\`) et l'italique (\`*texte*\`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul.
- **Feedback :** Les feedbacks NE DOIVENT PAS contenir de LaTeX et de Markdown.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Quelle est la couleur réelle de la baie de cassis ?",
  "answers": [
    {"text": "Violet très foncé", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exactement !" }},
    {"text": "Bleu", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Non, c'est plus foncé." }},
    {"text": "Noir", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (Mots mêlés) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Nombre de mots : Au minimum 6 mots || [NOMBRE_ELEMENTS] mots.
- Règles typographiques : Les mots ne doivent contenir ni accents, ni chiffres, ni signes de ponctuation, ni espaces.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`taskDescription\` : Consigne pour l'élève.
- \`wordList\` : Liste des mots à trouver séparés par des virgules (sans espaces).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Trouvez les mots cachés dans la grille.",
  "wordList": "CELLULE,ADN,GENE,NOYAU"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (Ordonner les paragraphes) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Nombre d'étapes : Minimum 3 étapes ou paragraphes à trier || [NOMBRE_ELEMENTS] étapes.
- Logique intrinsèque : Les paragraphes (\`paragraphs\`) doivent former une progression logique inférable par le contenu lui-même.
- Interdiction d'indices artificiels : Tu ne dois JAMAIS utiliser de numérotation (1, 2, 3...), de repères temporels explicites (dates, horaires) ou de connecteurs logiques trop simplistes ("D'abord", "Ensuite", "Enfin"), sauf si l'utilisateur le demande explicitement.
- Fil conducteur : Chaque paragraphe doit faire avancer un fil conducteur unique (ex: chaîne de causalité, passage du général au particulier, ou une séquence préparation → action → résultat). L'ordre doit être déductible par la compréhension du sens.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`taskDescription\` : Une consigne claire (Markdown supporté).
- \`paragraphs\` : Un tableau de chaînes de caractères (paragraphes) initialement présentés dans le **bon ordre** logique dans le JSON. Utilise \`**mot**\` pour le gras, \`*mot*\` pour l'italique.
- \`overallFeedback\` : Tableau de 6 objets pour le score final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX :** Utilise le double échappement pour LaTeX : \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Remettez ces éléments dans l'ordre pour reconstituer la chaîne de causalité du réchauffement climatique.",
  "paragraphs": [
    "Les activités humaines, principalement la combustion d'énergies fossiles, rejettent massivement du **dioxyde de carbone** dans l'atmosphère.",
    "Ce surplus de gaz renforce l'effet de serre naturel, empêchant une partie du rayonnement infrarouge de quitter la Terre.",
    "L'énergie ainsi piégée provoque une augmentation progressive de la température moyenne de l'air et des océans.",
    "Ce réchauffement global entraîne la fonte des glaciers et une élévation préoccupante du niveau des mers."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "La logique de causalité est à revoir." },
    { "from": 11, "to": 30, "feedback": "Tu as quelques bribes de compréhension, relis le texte." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début de mise en ordre." },
    { "from": 51, "to": 70, "feedback": "Bonne analyse de la progression logique." },
    { "from": 71, "to": 90, "feedback": "Très bon travail de structuration !" },
    { "from": 91, "to": 100, "feedback": "Parfait ! La structure logique est maîtrisée." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (Série de choix uniques) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Nombre de questions : Au minimum 3 questions || [NOMBRE_ELEMENTS] questions.
- Réponses : Propose de 2 à 3 distracteurs par question. La première réponse de la liste \`answers\` doit toujours être la bonne.
- Distracteurs : Cohérents mais comportant des erreurs logiques ou factuelles plausibles.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`choices\` : Tableau d'objets constituant les questions. Chaque objet contient :
  - \`question\` : L'énoncé de la question.
  - \`answers\` : Tableau de chaînes de caractères (réponses) dont la première est toujours la bonne réponse.
- \`overallFeedback\` : Tableau de 6 objets pour le score final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX :** Utilise le double échappement pour LaTeX : \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "Quel est le principal gaz responsable de l'effet de serre ?",
      "answers": ["Le dioxyde de carbone", "Le dioxygène", "Le diazote", "L'argon"]
    },
    {
      "question": "Quelle est la capitale de la France ?",
      "answers": ["Paris", "Lyon", "Marseille", "Bordeaux"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (Cartes de dialogue) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Nombre de cartes : Au minimum 3 cartes || [NOMBRE_ELEMENTS] cartes.
- Principe d'association : Le recto et le verso doivent être reliés par un critère unique et stable (ex : définition -> terme, événement -> date, auteur -> œuvre).
- Consigne : La description de l'activité doit suivre la formule : "Associe chaque [X] à son [Y]".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet racine DOIT contenir \`title\`, \`description\` et \`dialogs\`.
- 1. \`title\` : Le titre de l'activité (Texte simple, **sans** Markdown ni HTML).
- 2. \`description\` : La consigne ou description (Format HTML ou texte simple).
- 3. \`dialogs\` : Le tableau de Principe d'association des cartes : Le recto (text) et le verso (answer).
- 4. \`text\` : Le recto de la carte. Utilise \`**mot**\` pour le gras et \`*mot*\` pour l'italique.
- 5. \`answer\` : Le verso de la carte. Elle doit être courte. Utilise \`**mot**\` pour le gras et \`*mot*\` pour l'italique.
- 6. \`tips\` (optionnel) : Ajoute un indice pour le recto (\`front\`) et/ou le verso (\`back\`) uniquement si c'est pertinent. Texte simple **sans** formatage.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Verbes irréguliers",
  "description": "Retrouvez le verbe à l'infinitif.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identifiez le prétérit.", "back": "Forme de base."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (Diagramme) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Nombre d'éléments : Au minimum 5 éléments de comparaison || [NOMBRE_ELEMENTS] éléments de comparaison.
- Type de graphique : Choisis entre le diagramme circulaire (\`pieChart\`) ou le diagramme en barres (\`barChart\`) selon la pertinence pédagogique.
- Libellés et couleurs : Les couleurs doivent être contrastées pour une bonne lisibilité. Les libellés doivent être courts et clairs.`,

  CHART_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`graphMode\` : Le type de graphique (\`pieChart\` ou \`barChart\`).
- \`listOfTypes\` : Un tableau d'objets \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\` : Le titre du graphique.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Myrtilles"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Framboises"}
  ],
  "figureDefinition": "Graphique des fruits préférés"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Quiz H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Nombre de questions : Génère un tableau de 5 questions minimum || [NOMBRE_ELEMENTS] questions.
- Variété : Choisis les types d'activités les plus adaptés parmi les suivants pour varier l'exercice :
  - **QCM** (\`H5P.MultiChoice\` 1.16)
  - **Glisser-déposer les mots** (\`H5P.DragText\` 1.10)
  - **Vrai/Faux** (\`H5P.TrueFalse\` 1.8)
  - **Mots à trous** (\`H5P.Blanks\` 1.14)
  - **Surligner les mots** (\`H5P.MarkTheWords\` 1.11)
  - **Rédaction / Question ouverte** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet racine doit contenir :
  - \`title\` : Le titre de l'activité.
  - \`questions\` : Un tableau d'objets. Chaque objet représente une question et doit contenir :
    - \`library\` : Le nom et la version exacte de la bibliothèque (ex: \`H5P.MultiChoice 1.16\`).
    - \`metadata\` : Un objet contenant une clé \`title\` (titre court de la question).
    - \`params\` : Les données de la question.
  - \`overallFeedback\` : Tableau global de 6 objets pour le score final du QuizSet.

**Détails des \`params\` par type :**
1. **QCM (\`H5P.MultiChoice 1.16\`)** : \`question\`, \`answers\` (tableau d'objets avec \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **Vrai/Faux (\`H5P.TrueFalse 1.8\`)** : \`question\`, \`correct\` ("true" ou "false" en string)
3. **Mots à trous (\`H5P.Blanks 1.14\`)** : \`taskDescription\`, \`questions\` (tableau de strings avec \`*mot*\`)
4. **Glisser les mots (\`H5P.DragText 1.10\`)** : \`taskDescription\`, \`textField\` (avec \`*mot*\`)
5. **Surligner (\`H5P.MarkTheWords 1.11\`)** : \`taskDescription\`, \`textField\` (avec \`*mot*\`)
6. **Rédaction (\`H5P.Essay 1.5\`)** : \`taskDescription\`, \`keywords\` (tableau d'objets)

**Chaque question, sauf celles de type H5P.TrueFalse 1.8, doit inclure son propre \`overallFeedback\` (6 tranches).**
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (\`**texte**\`) et l'italique (\`*texte*\`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul.
- **Feedback :** Les feedbacks NE DOIVENT PAS contenir de LaTeX et de Markdown.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Culture Générale Scientifique",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomie - QCM" },
      "params": {
        "question": "Quelle planète est la plus proche du Soleil ?",
        "answers": [
          { "text": "Mercure", "correct": true },
          { "text": "Vénus", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Faux."},
          {"from": 11, "to": 30, "feedback": "Insuffisant."},
          {"from": 31, "to": 50, "feedback": "Moyen."},
          {"from": 51, "to": 70, "feedback": "Bien."},
          {"from": 71, "to": 90, "feedback": "Très bien."},
          {"from": 91, "to": 100, "feedback": "Excellent."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Biologie - Vrai/Faux" },
      "params": {
        "question": "L'ADN est une double hélice.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Résultat faible."},
    {"from": 11, "to": 30, "feedback": "Résultat insuffisant."},
    {"from": 31, "to": 50, "feedback": "Résultat moyen."},
    {"from": 51, "to": 70, "feedback": "Bon résultat."},
    {"from": 71, "to": 90, "feedback": "Très bon résultat."},
    {"from": 91, "to": 100, "feedback": "Excellent résultat."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (Quiz QCM H5P) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Nombre de questions : Génère un tableau de 5 questions minimum || [NOMBRE_ELEMENTS] questions.
- Type : Tu dois générer UNIQUEMENT des questions de type **QCM** (\`H5P.MultiChoice\` 1.16). Aucun autre type n'est autorisé.
- Qualité des QCM :
  - Chaque question doit avoir au minimum 3 propositions de réponse.
  - Selon la nature de la question, tu peux proposer une seule ou plusieurs bonnes réponses.
  - Les distracteurs (mauvaises réponses) doivent être plausibles et pertinents.
  - Évite les formulations négatives dans les questions.
  - Varie la position de la ou des bonnes réponses.`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet racine doit contenir :
  - \`title\` : Le titre de l'activité.
  - \`questions\` : Un tableau d'objets. Chaque objet représente une question QCM et doit contenir :
    - \`library\` : Toujours \`H5P.MultiChoice 1.16\`.
    - \`metadata\` : Un objet contenant une clé \`title\` (titre court de la question).
    - \`params\` : Les données de la question.
  - \`overallFeedback\` : Tableau global de 6 objets pour le score final du QuizSet.

**Détails des \`params\` pour QCM (\`H5P.MultiChoice 1.16\`)** :
- \`question\` : La question posée (string).
- \`answers\` : Tableau d'objets avec \`text\` (string) et \`correct\` (boolean).
- \`behaviour\` : Objet avec \`singleAnswer\` : \`true\` si une seule bonne réponse, \`false\` si plusieurs bonnes réponses.

**Chaque question doit inclure son propre \`overallFeedback\` (6 tranches : 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (\`**texte**\`) et l'italique (\`*texte*\`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul.
- **Feedback :** Les feedbacks NE DOIVENT PAS contenir de LaTeX et de Markdown.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz QCM - Sciences",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomie - Planètes" },
      "params": {
        "question": "Quelle planète est la plus proche du Soleil ?",
        "answers": [
          { "text": "Vénus", "correct": false },
          { "text": "Mars", "correct": false },
          { "text": "Mercure", "correct": true },
          { "text": "Jupiter", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorrect."},
          {"from": 11, "to": 30, "feedback": "Insuffisant."},
          {"from": 31, "to": 50, "feedback": "Moyen."},
          {"from": 51, "to": 70, "feedback": "Bien."},
          {"from": 71, "to": 90, "feedback": "Très bien."},
          {"from": 91, "to": 100, "feedback": "Excellent !"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Biologie - Organites" },
      "params": {
        "question": "Quels organites possèdent leur propre ADN ?",
        "answers": [
          { "text": "Le ribosome", "correct": false },
          { "text": "La mitochondrie", "correct": true },
          { "text": "L'appareil de Golgi", "correct": false },
          { "text": "Le chloroplaste", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorrect."},
          {"from": 11, "to": 30, "feedback": "Insuffisant."},
          {"from": 31, "to": 50, "feedback": "Moyen."},
          {"from": 51, "to": 70, "feedback": "Bien."},
          {"from": 71, "to": 90, "feedback": "Très bien."},
          {"from": 91, "to": 100, "feedback": "Excellent !"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Résultat faible. Revoyez les notions de base."},
    {"from": 11, "to": 30, "feedback": "Résultat insuffisant. Continuez vos efforts."},
    {"from": 31, "to": 50, "feedback": "Résultat moyen. Vous progressez."},
    {"from": 51, "to": 70, "feedback": "Bon résultat. Vous maîtrisez plusieurs notions."},
    {"from": 71, "to": 90, "feedback": "Très bon résultat. Vous êtes sur la bonne voie."},
    {"from": 91, "to": 100, "feedback": "Excellent résultat. Félicitations !"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (Quiz Vrai/Faux H5P) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Nombre de questions : Génère un tableau de 5 questions minimum || [NOMBRE_ELEMENTS] questions.
- Type : Tu dois générer UNIQUEMENT des questions de type **Vrai/Faux** (\`H5P.TrueFalse\` 1.8). Aucun autre type n'est autorisé.
- Qualité des questions :
  - Les affirmations doivent être claires et non ambiguës.
  - Évite les doubles négations.
  - Varie entre les affirmations vraies et les affirmations fausses.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- L'objet racine doit contenir :
  - \`title\` : Le titre de l'activité.
  - \`questions\` : Un tableau d'objets. Chaque objet représente une question et doit contenir :
    - \`library\` : Toujours \`H5P.TrueFalse 1.8\`.
    - \`metadata\` : Un objet contenant une clé \`title\` (titre court de la question).
    - \`params\` : Les données de la question.
  - \`overallFeedback\` : Tableau global de 6 objets pour le score final du QuizSet : 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Détails des \`params\` pour Vrai/Faux (\`H5P.TrueFalse 1.8\`)** :
- \`question\` : L'assertion ou la question posée (string).
- \`correct\` : La réponse correcte. DOIT être une chaîne de caractères : "true" ou "false".
- **Mise en forme :** Utilise la syntaxe Markdown pour le gras (\`**texte**\`) et l'italique (\`*texte*\`).
- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul.
- **Feedback :** Les feedbacks NE DOIVENT PAS contenir de LaTeX et de Markdown.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz Vrai/Faux - Géographie",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Géographie - Capitales" },
      "params": {
        "question": "La capitale de l'Australie est Canberra.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Géographie - Continents" },
      "params": {
        "question": "L'Afrique est le plus grand continent du monde.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Résultat faible. Revoyez les notions de base."},
    {"from": 11, "to": 30, "feedback": "Résultat insuffisant. Continuez vos efforts."},
    {"from": 31, "to": 50, "feedback": "Résultat moyen. Vous progressez."},
    {"from": 51, "to": 70, "feedback": "Bon résultat. Vous maîtrisez plusieurs notions."},
    {"from": 71, "to": 90, "feedback": "Très bon résultat. Vous êtes sur la bonne voie."},
    {"from": 91, "to": 100, "feedback": "Excellent résultat. Félicitations !"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Test Moodle/Éléa) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Nombre des questions : Au minimum 10 questions || [NOMBRE_ELEMENTS] questions.
- Variété : Choisis les formats des questions les plus adaptés parmi les suivants :
  - **QCM** (\`multichoice\`)
  - **Appariement** (\`matching\`)
  - **Numérique** (\`numerical\`)
  - **Vrai/Faux** (\`truefalse\`)
  - **Réponse courte** (\`shortanswer\`)
  - **Texte à trous** (\`cloze\`)
- Distracteurs : Propose au moins 3 distracteurs par question \`multichoice\`.`,

  ELEA_TEST_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.

L'objet principal doit contenir les clés suivantes :
- \`bank_name\`: Un nom court et descriptif pour la banque de questions.
- \`bank_description\`: Une phrase décrivant le contenu de la banque.
- \`questions\`: Un tableau d'objets où chaque objet représente une question (\`type\`, \`content\`).
  - Chaque question doit avoir un \`content.name\` court et unique (ex: "Q1 - Sujet").

**Règles de formatage :**
- **Nombres** : utilise le point pour les décimales (ex: 12.34).
- **Cloze** : respecte strictement la syntaxe \`{1:TYPE:=Bonne réponse~Mauvaise réponse}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **Pour le type \`multichoice\` (QCM) :**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Q1 - Géographie",
      "questiontext": "Quelle est la capitale de la France ?",
      "feedback": "Paris est la capitale politique et économique de la France.",
      "answers": [
        { "text": "Paris", "fraction": 100, "feedback": "Exactement !" },
        { "text": "Lyon", "fraction": 0, "feedback": "Non, Lyon est une grande ville mais pas la capitale." },
        { "text": "Marseille", "fraction": 0, "feedback": "Non, c'est la deuxième ville de France." }
      ]
    }
  }
  \`\`\`

- **Pour le type \`matching\` (Appariement) :**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Q2 - Vocabulaire Anglais",
      "questiontext": "Associez chaque mot anglais à sa traduction française.",
      "feedback": "Bravo, vous maîtrisez le vocabulaire de base.",
      "subquestions": [
        { "text": "Dog", "answer": "Chien" },
        { "text": "Cat", "answer": "Chat" },
        { "text": "Bird", "answer": "Oiseau" }
      ]
    }
  }
  \`\`\`

- **Pour le type \`numerical\` (Numérique) :**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Q3 - Mathématiques",
      "questiontext": "Quelle est la valeur de Pi arrondie à deux décimales ?",
      "feedback": "Pi est une constante irrationnelle environ égale à 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "C'est bien 3.14." }
    }
  }
  \`\`\`

- **Pour le type \`truefalse\` (Vrai/Faux) :**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Q4 - Sciences",
      "questiontext": "L'eau bout à 100°C au niveau de la mer.",
      "feedback": "C'est une propriété physique standard de l'eau.",
      "answer": { "value": true, "feedback_true": "C'est vrai.", "feedback_false": "C'est faux, l'eau bout bien à 100°C à 1 atm." }
    }
  }
  \`\`\`

- **Pour le type \`shortanswer\` (Réponse courte) :**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Q5 - Littérature",
      "questiontext": "Qui a écrit 'Les Misérables' ?",
      "feedback": "C'est un des plus gandes romans du XIXe siècle.",
      "answers": [
        { "text": "Victor Hugo", "fraction": 100, "feedback": "Correct !" },
        { "text": "Hugo", "fraction": 100, "feedback": "Correct !" }
      ]
    }
  }
  \`\`\`

- **Pour le type \`cloze\` (Texte à trous) :**
  - Attention à la syntaxe : \`{1:SHORTANSWER:=Bonne~Mauvaise}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Q6 - Histoire",
      "questiontext": "Napoléon est né en {1:SHORTANSWER:=1769} à {1:MULTICHOICE:=Ajaccio~Bastia~Paris}.",
      "feedback": "Napoléon Bonaparte est né en Corse."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Millionnaire) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Nombre de questions : EXACTEMENT 6 questions (ne doit surtout pas être modifié)
- Progressivité : La difficulté des questions doit être **croissante et pédagogique**. Les éléments importants à faire mémoriser sont placés dans les premières questions.
- Véracité : Le contenu doit être rigoureusement exact et pertinent.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
Un objet principal avec les clés suivantes :
- \`title\` : Le titre de l'activité (Chaîne de caractères).
- \`questions\` : Un tableau de EXACTEMENT 6 objets, où chaque objet représente une question et contient :
  - \`question\` : L'énoncé de la question (Chaîne de caractères).
  - \`goodanswer\` : La réponse correcte (Chaîne de caractères).
  - \`badanswer\` : Un tableau de EXACTEMENT 3 mauvaises réponses (Tableau de chaînes de caractères).
  - Pour les formules mathématiques, le LaTeX est interdit.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz sur la Révolution française",
  "questions": [
    {
      "question": "Quel événement marque le début de la Révolution française le 14 juillet 1789 ?",
      "goodanswer": "La prise de la Bastille",
      "badanswer": ["Le serment du Jeu de Paume", "L'exécution de Louis XVI", "La bataille de Valmy"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Appariement) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Nombre de paires : Au minimum 5 paires || [NOMBRE_ELEMENTS] paires.
- Logique : La relation entre les deux éléments doit être évidente après lecture des sources.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
Un objet principal avec les clés suivantes :
- \`title\` : Le titre de l'activité (Chaîne de caractères).
- \`intro\` : Courte consigne ou texte d'introduction (Chaîne de caractères).
- \`pairs\` : Un tableau d'objets, où chaque objet représente une paire et contient :
  - \`question\` : Le terme ou l'élément à gauche (Chaîne de caractères).
  - \`answer\` : La définition ou l'élément correspondant à droite (Chaîne de caractères).
  - Pour les formules mathématiques, utilise le format LaTeX avec double échappement, par exemple : \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Appariement Histoire",
  "intro": "Associez chaque date à l'événement correspondant de la Révolution française.",
  "pairs": [
    {"question": "Prise de la Bastille", "answer": "14 juillet 1789"},
    {"question": "Abolition des privilèges", "answer": "4 août 1789"},
    {"question": "DDHC", "answer": "26 août 1789"},
    {"question": "Marche des femmes", "answer": "5 octobre 1789"},
    {"question": "Fête de la Fédération", "answer": "14 juillet 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (QCM Éléa) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Nombre de questions : Au minimum 5 questions || [NOMBRE_ELEMENTS] questions.
- Réponses : Propose entre 2 et 5 choix par question.
- Distracteurs : Cohérents avec le sujet mais comportant des erreurs logiques.`,

  ELEA_QCM_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`title\` : Titre de l'activité.
- \`questions\` : Tableau d'objets. Chaque objet question doit contenir :
  - \`text\` : Énoncé de la question (peut contenir du HTML simple comme \`**\` pour le gras).
  - \`answers\` : Tableau d'objets \`{"text": "...", "iscorrect": 1/0}\`. \`1\` pour une réponse correcte, \`0\` sinon.
  - Pour les formules mathématiques, utilise le format LaTeX avec double échappement, par exemple : \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "QCM sur la Révolution Française",
  "questions": [
    {
      "text": "Quelle est la date de la prise de la Bastille ?",
      "answers": [
        {"text": "14 juillet 1789", "iscorrect": 1},
        {"text": "4 août 1789", "iscorrect": 0},
        {"text": "26 août 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (Glossaire XML) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- Nombre d'entrées : Au minimum 5 termes || [NOMBRE_ELEMENTS] termes.
- Sélection : Identifie les mots-clés, acronymes et concepts techniques.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- **Racine :** Un objet principal contenant deux clés : \`name\` (le nom du glossaire) et \`entries\` (un tableau d'objets).
- **Chaque objet dans \`entries\` doit contenir :**
  - \`concept\` : Le mot ou l'expression à définir.
  - \`definition\` : La définition claire et concise. Utilise **mot** pour mettre en gras, *mot* pour mettre en italique et \`\\n\` pour les sauts de ligne, uniquement lorsque c'est pertinent pédagogiquement.
  - \`aliases\` (optionnel) : Un tableau de chaînes de caractères pour les synonymes ou termes alternatifs. N'ajoute cette clé que si des alias pertinents existent.
  - Pour les formules mathématiques, utilise le format LaTeX avec double échappement, par exemple : \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Glossaire du Journalisme",
  "entries": [
    {
      "concept": "Journaliste",
      "definition": "Personne qui **collecte** et diffuse des *informations*.",
      "aliases": ["Reporter", "Chroniquer"]
    },
    {
      "concept": "Source",
      "definition": "Origine d'une *information* vérifiée."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Page Éléa) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Structure : La page doit comporter au minimum 5 blocs différents || [NOMBRE_ELEMENTS] blocs.
- Logique pédagogique : Les contenus doivent suivre une progression cohérente (ex : Accueil -> Objectifs -> Cours -> Détails/Lexique -> Sitographie).
- Équilibre des contenus : Mixez les formats pour maintenir l'engagement (texte, tableaux, listes, encadrés).
- Contenus obligatoires : Intégrez systématiquement un bandeau d'ouverture (\`#01_hero_header\`), des encadrés d'objectifs ou de points d'attention (\`#04_callout_set\`), un lexique pour les termes techniques (\`#06_lexique_table\`), au moins trois paragraphes de contenu substantiel (\`#12_context_paragraphs\`) et une sitographie de référence (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Génère UNIQUEMENT un JSON complet et valide dans un bloc de code. Ta réponse DOIT commencer par \`{\` et finir par \`}\`. Aucun autre texte ou commentaire.
- \`title\` : Titre de la page (Chaîne de caractères).
- \`intro\` : Court texte d'introduction engageant (Chaîne de caractères).
- \`blocks\` : Un tableau d'objets, où chaque objet représente une section de la page. Chaque bloc DOIT respecter l'une des structures suivantes :

**Liste des blocs disponibles :**
- \`#01_hero_header\`: Bandeau d'ouverture. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Sommaire avec des liens internes. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Repères historiques en 3 cartes. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (max 3 cartes)
- \`#04_callout_set\`: Bandeaux Objectifs, À savoir, Alerte. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Chiffres-clés en cartes. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Tableau de vocabulaire. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Glossaire en pastilles. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Cartes monuments avec images. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Deux images comparées.
- \`#10_table_comparison\`: Tableau de comparaison.
- \`#11_definition_box\`: Encadré Définition. \`{ "type": "#11_definition_box", "data": { "title": "Définition", "text": "..." } }\`
- \`#12_context_paragraphs\`: Paragraphes de cours. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Fiche détaillée.
- \`#14_faq_block\`: Foire aux questions. \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Mythes vs Réalités.
- \`#17_method_image_desc\`: Méthode pour décrire une image.
- \`#18_sito_graphy\`: Sitographie. \`{ "type": "#18_sito_graphy", "data": { "title": "Sitographie", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Citation bilingue.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "La Révolution française",
  "intro": "Découvrez les moments clés de cette période historique.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "La Révolution", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Objectifs",
        "callouts": [{"type": "objectif", "text": "Comprendre les causes de 1789."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "Le Serment du Jeu de Paume",
        "paragraphs": [
          "Le 20 juin 1789, les députés du Tiers-État se réunissent...",
          "Ce geste marque la naissance de l'Assemblée nationale.",
          "C'est un tournant majeur vers la fin de l'absolutisme."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Vocabulaire",
        "headers": ["Terme", "Définition"],
        "rows": [["Tiers-État", "La majeure partie de la population..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Pour aller plus loin",
        "links": [{"href": "https://...", "text": "Site officiel de l'Histoire"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === TRADUCTIONS DES INTERFACES H5P (STANDARDISÉES) ===
  // ============================================================================

  // Clés communes
  h5p_check_answer: "Vérifier",
  h5p_try_again: "Recommencer",
  h5p_show_solution: "Afficher la solution",
  h5p_submit_answer: "Valider",
  h5p_score: "Vous avez obtenu @score sur @total points",
  h5p_score_bar_label: "Vous avez obtenu :num sur :total points",
  h5p_tip_label: "Indice",
  h5p_next: "Suivant",
  h5p_previous: "Précédent",
  h5p_close: "Fermer",
  h5p_finish_header: "Terminer ?",
  h5p_finish_body: "Êtes-vous sûr de vouloir terminer ?",
  h5p_cancel_label: "Annuler",
  h5p_finish_label: "Terminer",
  h5p_retry_header: "Recommencer ?",
  h5p_retry_body: "Êtes-vous sûr de vouloir recommencer ?",
  h5p_retry_confirm_label: "Confirmer",
  h5p_resume: "Reprendre",
  h5p_audio_direction: "Direction de l'audio",
  h5p_a11y_check: "Vérifier les réponses. Les réponses seront marquées comme correctes, incorrectes ou non répondues.",
  h5p_a11y_show_solution: "Afficher la solution. L'exercice sera marqué avec sa solution correcte.",
  h5p_a11y_retry: "Recommencer l'exercice. Réinitialiser toutes les réponses et recommencer.",

  // Mots croisés (Crossword)
  h5p_crossword_across: "Horizontal",
  h5p_crossword_down: "Vertical",
  h5p_crossword_extra_clue: "Indice supplémentaire",

  // Résumé (Summary)
  h5p_summary_intro: "Choisissez l'affirmation correcte.",
  h5p_summary_solved_label: "Progression :",
  h5p_summary_score_label: "Mauvaises réponses :",
  h5p_summary_result_label: "Votre résultat",
  h5p_summary_feedback: "Vous avez @score sur @total affirmations correctes (@percent %).",
  h5p_summary_label_correct: "Correct.",
  h5p_summary_label_incorrect: "Incorrect ! Veuillez réessayer.",
  h5p_summary_label_correct_answers: "Réponses correctes.",
  h5p_summary_progress_text: "Progression :num sur :total",
  h5p_summary_alternative_incorrect_label: "Incorrect",

  // Glisser les mots (Drag the Words)
  h5p_drag_words_score_feedback: "Score : @score sur @total.",
  h5p_drag_words_correct_text: "Correct !",
  h5p_drag_words_incorrect_text: "Incorrect !",

  // Texte à trous (Fill in the Blanks)
  h5p_blanks_not_filled_out: "Veuillez remplir tous les champs.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; est correct",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; est incorrect",
  h5p_blanks_answered_correctly: "Réponse correcte",
  h5p_blanks_answered_incorrectly: "Réponse incorrecte",
  h5p_blanks_solution_label: "Réponse correcte :",
  h5p_blanks_input_label: "Champ @num sur @total",
  h5p_blanks_input_has_tip_label: "Indice disponible",
  h5p_blanks_feedback: "Vous avez @score sur @total blancs corrects.",
  h5p_blanks_checking_mode_header: "Mode de vérification",

  // Surligner les mots (Mark the Words)
  h5p_mark_words_correct_answer: "Correct !",
  h5p_mark_words_incorrect_answer: "Incorrect !",
  h5p_mark_words_missed_answer: "Manqué !",
  h5p_mark_words_display_solution_description: "La tâche est mise à jour pour contenir la solution.",
  h5p_mark_words_a11y_full_text_label: "Texte complet lisible",
  h5p_mark_words_a11y_clickable_text_label: "Texte complet où les mots peuvent être marqués",
  h5p_mark_words_a11y_solution_mode_header: "Mode solution",
  h5p_mark_words_a11y_checking_header: "Mode de vérification",

  // Cartes mémoires (Flashcards)
  h5p_flashcards_progress_text: "Carte @card sur @total",
  h5p_flashcards_your_answer: "Votre réponse",
  h5p_flashcards_correct_answer: "Réponse exacte",
  h5p_flashcards_incorrect_answer: "Réponse inexacte",
  h5p_flashcards_show_solution: "Réponse correcte",
  h5p_flashcards_results: "Résultats",
  h5p_flashcards_of_correct: "@score réponses correctes sur un total de @total",
  h5p_flashcards_show_results: "Montrer les résultats",
  h5p_flashcards_answer_short: "R :",
  h5p_flashcards_card_announcement: "Réponse incorrecte. La réponse correcte était @answer",
  h5p_flashcards_correct_announcement: "@answer est correct.",
  h5p_flashcards_page_announcement: "Page @current sur @total",

  // Rédaction (Essay)
  h5p_essay_feedbackHeader: "Commentaire",
  h5p_essay_solutionTitle: "Exemple de solution",
  h5p_essay_remainingChars: "Caractères restants : @chars",
  h5p_essay_notEnoughChars: "Vous devez saisir au moins @chars caractères !",
  h5p_essay_messageSave: "enregistré",
  h5p_essay_placeholderText: "Commencez à rédiger ici...",
  h5p_essay_ariaYourResult: "Vous avez obtenu @score sur @total points",
  h5p_essay_ariaNavigatedToSolution: "Navigation vers la solution.",

  // Vrai/Faux (True/False)
  h5p_true_false_true_text: "Vrai",
  h5p_true_false_false_text: "Faux",
  h5p_true_false_wrong_answer_message: "Mauvaise réponse",
  h5p_true_false_correct_answer_message: "Bonne réponse",

  // Mots mêlés (Find the Words)
  h5p_find_words_found: "@found sur @totalWords mots trouvés",
  h5p_find_words_time_spent: "Temps écoulé",
  h5p_find_words_word_list_header: "Liste de mots",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Ordonner les paragraphes (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "Monter",
  h5p_sort_paragraphs_down: "Descendre",
  h5p_sort_paragraphs_disabled: "Désactivé",
  h5p_sort_paragraphs_paragraph: "Paragraphe",
  h5p_sort_paragraphs_point: "@score point",
  h5p_sort_paragraphs_seven_of_nine: "@current sur @total",
  h5p_sort_paragraphs_current_position: "Position actuelle dans la liste",
  h5p_sort_paragraphs_instructions_selected: "Appuyez sur la barre d'espace pour réorganiser",
  h5p_sort_paragraphs_instructions_grabbed: "Appuyez sur les flèches haut et bas pour changer de position, sur la barre d'espace pour déposer, sur échap pour annuler",
  h5p_sort_paragraphs_grabbed: "Saisi",
  h5p_sort_paragraphs_moved: "Déplacé",
  h5p_sort_paragraphs_dropped: "Déposé",
  h5p_sort_paragraphs_reorder_cancelled: "Réorganisation annulée",
  h5p_sort_paragraphs_final_position: "Position finale",
  h5p_sort_paragraphs_next_paragraph: "Paragraphe suivant",
  h5p_sort_paragraphs_correct_paragraph: "Paragraphe correct à la position",
  h5p_sort_paragraphs_list_description: "Liste de paragraphes triables.",
  h5p_sort_paragraphs_list_description_check: "Liste de paragraphes avec résultats.",
  h5p_sort_paragraphs_list_description_solution: "Liste de paragraphes avec solutions.",

  // Série de choix uniques (Single Choice Set)
  h5p_single_choice_solution_view_title: "Solution",
  h5p_single_choice_mute_button_label: "Désactiver le son",
  h5p_single_choice_slide_of_total: "Diapositive @slide sur @total",
  h5p_single_choice_solution_list_question_number: "Question @question",
  h5p_single_choice_should_select: "Devrait sélectionner",
  h5p_single_choice_should_not_select: "Ne devrait pas sélectionner",

  // Cartes de dialogue (Dialog Cards)
  h5p_dialog_cards_answer: "Retourner",
  h5p_dialog_cards_progress_text: "Carte @card sur @total",
  h5p_dialog_cards_card_front_label: "Recto de la carte",
  h5p_dialog_cards_card_back_label: "Verso de la carte",
  h5p_dialog_cards_audio_not_supported: "Votre navigateur ne supporte pas ce format audio",
  h5p_dialog_cards_correct_answer: "J'ai eu bon !",
  h5p_dialog_cards_incorrect_answer: "Je me suis trompé",
  h5p_dialog_cards_round: "Manche @round",
  h5p_dialog_cards_cards_left: "Cartes restantes : @number",
  h5p_dialog_cards_next_round: "Passer à la manche @round",
  h5p_dialog_cards_start_over: "Recommencer",
  h5p_dialog_cards_show_summary: "Suivant",
  h5p_dialog_cards_summary: "Résumé",
  h5p_dialog_cards_summary_cards_right: "Cartes que vous avez réussies :",
  h5p_dialog_cards_summary_cards_wrong: "Cartes que vous avez manquées :",
  h5p_dialog_cards_summary_cards_not_shown: "Cartes non montrées :",
  h5p_dialog_cards_summary_overall_score: "Score global",
  h5p_dialog_cards_summary_cards_completed: "Cartes que vous avez apprises :",
  h5p_dialog_cards_summary_completed_rounds: "Manches terminées :",
  h5p_dialog_cards_summary_all_done: "Bien joué ! Vous avez réussi toutes les @cards cartes @max fois de suite !",

  // Quiz Set (Question Set)
  h5p_quiz_textual_progress: "Question @current sur @total",
  h5p_quiz_no_result_message: "Terminé",
  h5p_quiz_result_message: "Vos résultats :",
  h5p_quiz_feedback_available: "Feedback disponible",
  h5p_quiz_read_feedback: "Lire le commentaire",
  h5p_quiz_wrong_answer: "Mauvaise réponse",
  h5p_quiz_correct_answer: "Bonne réponse",
  h5p_quiz_should_check: "Il fallait cocher ici",
  h5p_quiz_should_not_check: "Il ne fallait pas cocher ici !",
  h5p_quiz_no_input: "Répondez s'il vous plait avant de visionner la solution.",

  // ============================================================================
  // === MENTIONS LEGALES - FOOTER ===
  // ============================================================================
  license_info: "GNU GPL v3.0 ou ultérieure",
  ticket: "Ticket",
  legal_mentions: "Mentions légales",
  legal_title: "Mentions légales",
  legal_editor_title: "Éditeur de l'application",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Fonction :</strong> PLP Lettres-Histoire",
  legal_editor_gauthier_remande_email: "<strong>Email :</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Adresse :</strong> 39 avenue de Chanzy, 53000 Laval, France",
  legal_editor_gauthier_remande_phone: "<strong>Téléphone :</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Fonction :</strong> Professeur de mathématiques et chargé de mission DRANE – Académie de Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>Email :</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Adresse :</strong> 30 boulevard de la République, 38200 Vienne, France",
  legal_editor_emmanuel_gaunard_phone: "<strong>Téléphone :</strong> +33 6 46 74 20 94",
  legal_app_description: "L'application web « Caramel » est un projet libre, non commercial, destiné à la création de contenus H5P et Éléa. Aucun compte n'est requis, aucune donnée personnelle n'est collectée.",
  legal_hosting_title: "Hébergement",
  legal_host_name: "<strong>Hébergeur</strong> : Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>Raison sociale</strong> : Ministère de l'Éducation nationale et de la Jeunesse",
  legal_host_address: "<strong>Adresse</strong> : 110 rue de Grenelle, 75007 Paris, France",
  legal_host_phone: "<strong>Téléphone</strong> : +33 1 55 55 10 10",
  legal_publication_director_title: "Responsable de la publication",
  legal_publication_director_name: "Gauthier REMANDE et Emmanuel GAUNARD, en qualité d'éditeurs bénévoles.",
  legal_terms_of_use_title: "Conditions générales d'utilisation",
  legal_terms_of_use_content: "Ce site permet aux utilisateurs de générer des contenus H5P et Éléa. L'affichage s'effectue localement, sans transmission de données utilisateur. L'utilisateur est seul responsable de l'usage qu'il fait des contenus générés. L'application est proposée à titre gratuit, sans aucune garantie de fonctionnement ou de résultat. L'éditeur décline toute responsabilité en cas de mauvaise interprétation des contenus ou d'usage inapproprié.",
  legal_intellectual_property_title: "Propriété intellectuelle",
  legal_intellectual_property_content: "L'ensemble des codes sources, éléments graphiques et contenus sont placés sous licence libre GNU AGPLv3. Leur réutilisation est permise dans les conditions de leur licence respective. Toute redistribution ou modification doit citer les auteurs originaux : Gauthier REMANDE et Emmanuel GAUNARD. Les images utilisées dans les modules H5P sont récupérées depuis le site H5P.org.",
  legal_personal_data_title: "Données personnelles",
  legal_personal_data_content: "Aucune donnée personnelle n'est collectée ni stockée. Aucun cookie de suivi n'est utilisé.",
  legal_ai_models_title: "Modèles d'Intelligence Artificielle",
  legal_ai_models_content: "L'application Caramel s'appuie, uniquement lors de la génération en un clic, sur des modèles d'IA opérés par ILAAS, une fédération d'infrastructures d'IA mutualisées. Les requêtes sont acheminées via un workflow n8n hébergé par l'Incubateur, puis transmises à ILAAS pour exécution sur des serveurs de confiance hébergés dans des data centers labellisés de l'Enseignement supérieur et de la recherche (ESR). Caramel n'exécute pas les modèles et ne traite ni ne stocke les données en propre ; les données sont utilisées uniquement pour exécuter la requête et ne sont pas envoyées à des IA grand public. Les modèles actuellement proposés incluent {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) et {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Les modalités d'hébergement, de journalisation et de conservation éventuellement effectuées par ILAAS relèvent de leur politique de confidentialité et de leurs conditions de service, auxquelles il convient de se référer.",
  legal_user_requests_processing_title: "Traitement des requêtes utilisateurs via n8n et l'Incubateur du Ministère de l'Éducation nationale",
  legal_user_requests_processing_content: "Notre site utilise une solution technique développée par n8n, un outil open source hébergé par l'Incubateur du Ministère de l'Éducation nationale. Ce service permet, via un workflow automatisé, de transformer les requêtes des utilisateurs en données structurées (format JSON) afin d'interagir avec une intelligence artificielle de la DINUM, donc souveraine. Aucune information sensible n'est exposée ou transmise sans chiffrement, assurant ainsi la confidentialité et la sécurité des échanges.",
  legal_accessibility_title: "Accessibilité",
  legal_accessibility_content: "L'application est conçue pour être compatible avec une utilisation sur ordinateur, incluant les modes sombre/clair, la navigation au clavier et le contraste élevé selon les thèmes. Une amélioration continue de l'accessibilité est en cours, en lien avec les recommandations du RGAA.",
  legal_applicable_law_title: "Droit applicable",
  legal_applicable_law_content: "Ce site est soumis au droit français. En cas de litige, les juridictions compétentes seront celles du ressort de Lyon.",
  legal_external_libraries_title: "Bibliothèques externes utilisées",
  legal_external_libraries_intro: "L'application Caramel utilise plusieurs bibliothèques open source, sous les licences suivantes :",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licence : CC BY 4.0, SIL OFL 1.1, MIT) : Fournit les icônes utilisées dans l'interface pour améliorer la navigation et l'expérience visuelle.",
  legal_library_jszip: "<strong>JSZip</strong> (Licence : MIT ou GPLv3) : Permet de créer des fichiers .h5p en compressant le contenu nécessaire dans une archive zip.",
  legal_library_clientzip: "<strong>client-zip</strong> (Licence : MIT) : Une autre bibliothèque utilisée pour la compression de fichiers, offrant une alternative performante pour générer les archives .h5p directement dans le navigateur.",
  legal_library_fflate: "<strong>fflate</strong> (Licence : MIT) : Bibliothèque très rapide pour la compression et décompression de données, utilisée pour la création des archives .mbz des modules Moodle.",
  legal_library_tarjs: "<strong>tar-js</strong> (Licence : MIT) : Permet de créer des archives .tar, une étape nécessaire avant la compression pour former les fichiers .mbz des modules Moodle.",
  legal_library_mammoth: "<strong>Mammoth</strong> (Licence : BSD 2-Clause) : Permet de convertir des documents Word (.docx) en HTML, facilitant l'importation et l'intégration de contenus depuis des fichiers Microsoft Word.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (Licence : Apache 2.0) : Permet d'extraire le texte natif des fichiers PDF directement dans le navigateur, sans nécessiter de traitement serveur.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (Licence : Apache 2.0) : Moteur de reconnaissance optique de caractères (OCR) permettant d'extraire du texte depuis des images (PNG, JPG, JPEG) et des documents PDF scannés.",
  legal_library_mathjax: "<strong>MathJax</strong> (Licence : Apache 2.0) : Utilisé pour le rendu des formules mathématiques (LaTeX) dans les prévisualisations.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (Licence : MIT) : Permet de prévisualiser les contenus H5P directement dans le navigateur sans nécessiter de serveur ou de CMS (comme Moodle ou WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (Licence : MIT) : Bibliothèque JavaScript permettant de générer des documents PDF directement dans le navigateur, utilisée pour l'export des contenus pédagogiques au format PDF.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (Licence : MIT) : Extension de jsPDF permettant de générer des tableaux structurés dans les documents PDF exportés.",
  legal_library_docx: "<strong>docx</strong> (Licence : MIT) : Bibliothèque JavaScript permettant de créer des documents Word (.docx) dans le navigateur, utilisée pour l'export des contenus pédagogiques au format Microsoft Word.",
  legal_library_ownership: "Chaque bibliothèque reste la propriété de ses auteurs respectifs et est utilisée conformément à sa ou ses licence(s).",

  // ============================================================================
  // === NOTIFICATIONS ===
  // ============================================================================
  no_notifications: "Aucune notification",
  clear_all: "Tout effacer",
  view: "Visualiser",
  today: "Aujourd'hui",
  error: "Erreur",
  download: "Télécharger",
  edit_content: "Éditer",
  compatible_with: "Compatible avec :",
  preview_placeholder: "Preview disponible prochainement",
  previous: "Précédent",
  next: "Suivant",
  close_modal: "Fermer",
  loading: "Chargement...",
  preview_error: "Impossible de prévisualiser ce fichier",
  simulator_warning: "Prévisualisation via le simulateur d'activités : le rendu final sur Éléa peut être légèrement différent.",
  editor_confirm_close_title: "Modifications non enregistrées",
  editor_confirm_close_message: "Voulez-vous enregistrer vos modifications avant de quitter ?",
  editor_confirm_close_cancel: "Rester dans l'éditeur",
  editor_confirm_close_save: "Enregistrer et quitter",
  editor_confirm_close_discard: "Quitter sans enregistrer",

  // JSON Editor
  editor_title_prefix: "Édition :",
  editor_loading: "Chargement de l'éditeur...",
  editor_unknown_type: "Type de contenu non reconnu",
  editor_no_schema: "Schéma non disponible pour ce type",
  editor_init_error: "Erreur lors de l'initialisation de l'éditeur",
  editor_save: "Enregistrer",
  editor_cancel: "Annuler",
  editor_unsaved_changes: "Modifications non sauvegardées",
  editor_confirm_discard: "Voulez-vous vraiment annuler ? Les modifications non sauvegardées seront perdues.",
  editor_validation_errors: "Erreurs de validation",

  // Sections
  editor_section_general: "Informations générales",
  editor_section_question: "Question",
  editor_section_questions: "Questions",
  editor_section_answers: "Réponses",
  editor_section_answer: "Réponse",
  editor_section_feedback: "Feedback",
  editor_section_cards: "Cartes",
  editor_section_sentences: "Phrases",
  editor_section_events: "Événements",
  editor_section_words: "Mots",
  editor_section_keywords: "Mots-clés",
  editor_section_entries: "Entrées",
  editor_section_pairs: "Paires",
  editor_section_text: "Texte",

  // Champs généraux
  editor_title: "Titre",
  editor_description: "Description",
  editor_description_hint: "Consigne affichée aux élèves",
  editor_intro: "Introduction",
  editor_task_description: "Consigne",
  editor_question_text: "Énoncé de la question",

  // Cartes
  editor_card: "Carte",
  editor_card_front: "Recto",
  editor_card_front_placeholder: "Question ou terme",
  editor_card_back: "Verso",
  editor_card_back_placeholder: "Réponse ou définition",
  editor_card_tip: "Indice",
  editor_add_card: "Ajouter une carte",

  // Réponses
  editor_answer: "Réponse",
  editor_answer_text: "Texte de la réponse",
  editor_is_correct: "Correct",
  editor_add_answer: "Ajouter une réponse",

  // Tips & Feedback
  editor_tips_feedback: "Indices et feedback",
  editor_tip: "Indice",
  editor_tip_optional: "Indice (optionnel)",
  editor_tips_optional: "Indices (optionnel)",
  editor_tip_front: "Indice recto",
  editor_tip_back: "Indice verso",
  editor_chosen_feedback: "Feedback si sélectionné",
  editor_not_chosen_feedback: "Feedback si non sélectionné",
  editor_feedback_correct: "Feedback si correct",
  editor_feedback_wrong: "Feedback si incorrect",
  editor_overall_feedback: "Feedback global par score",

  // Feedback ranges
  editor_feedback_ranges_label: "Feedback selon le score",
  editor_feedback_placeholder: "Message de feedback pour cette tranche...",
  editor_add_range: "Ajouter une tranche",

  // True/False
  editor_correct_answer: "Réponse correcte",
  editor_true: "Vrai",
  editor_false: "Faux",

  // Fill in blanks / Drag words
  editor_sentence: "Phrase",
  editor_sentence_text: "Texte de la phrase",
  editor_add_sentence: "Ajouter une phrase",
  editor_blanks_hint: "Entourez les mots à deviner avec des *astérisques*",
  editor_text_with_blanks: "Texte avec mots à placer",
  editor_drag_words_hint: "Les mots entre *astérisques* seront à glisser-déposer",

  // Timeline
  editor_event: "Événement",
  editor_add_event: "Ajouter un événement",
  editor_start_date: "Date de début",
  editor_end_date: "Date de fin",
  editor_event_title: "Titre de l'événement",
  editor_event_description: "Description",
  editor_event_tag: "Étiquette",

  // Crossword
  editor_word: "Mot",
  editor_add_word: "Ajouter un mot",
  editor_clue: "Indice/Définition",
  editor_orientation: "Orientation",
  editor_horizontal: "Horizontal",
  editor_vertical: "Vertical",
  editor_crossword_answer_hint: "Le mot en majuscules",

  // Essay
  editor_keyword: "Mot-clé",
  editor_keyword_text: "Mot-clé attendu",
  editor_keyword_weight: "Poids",
  editor_add_keyword: "Ajouter un mot-clé",

  // Glossary
  editor_entry: "Entrée",
  editor_add_entry: "Ajouter une entrée",
  editor_term: "Terme",
  editor_definition: "Définition",

  // Moodle
  editor_question: "Question",
  editor_add_question: "Ajouter une question",
  editor_pair: "Paire",
  editor_add_pair: "Ajouter une paire",
  editor_left_element: "Élément gauche",
  editor_right_element: "Élément droit",
  editor_choice: "Choix",
  editor_choice_text: "Texte du choix",
  editor_add_choice: "Ajouter un choix",

  // Actions tableau
  editor_add_item: "Ajouter",
  editor_drag: "Déplacer",
  editor_duplicate: "Dupliquer",
  editor_delete: "Supprimer",
  editor_confirm_delete: "Voulez-vous vraiment supprimer cet élément ?",
  editor_min_items_reached: "Nombre minimum d'éléments atteint",
  editor_max_items_reached: "Nombre maximum d'éléments atteint",

  // Erreurs de validation
  editor_error_required: "Ce champ est obligatoire",
  editor_error_min_length: "Minimum {0} caractères",
  editor_error_max_length: "Maximum {0} caractères",
  editor_error_pattern: "Format invalide",
  editor_error_min_items: "Minimum {0} élément(s)",
  editor_error_max_items: "Maximum {0} élément(s)",
  editor_error_number: "Doit être un nombre",
  editor_error_min: "Minimum {0}",
  editor_error_max: "Maximum {0}",
  editor_error_feedback_ranges: "Les tranches doivent couvrir 0-100% sans chevauchement",
  editor_error_no_correct: "Au moins une réponse doit être correcte",
  editor_error_date_format: "Format de date invalide (attendu : AAAA,M,J)",
  editor_error_no_blanks: "Le texte doit contenir au moins un mot entre *astérisques*",

  // QuizSet
  editor_library_type: "Type de bibliothèque",
  editor_question_title: "Titre de la question",
  editor_question_params: "Paramètres de la question",
  editor_parameters: "Paramètres",

  // Crossword
  editor_extra_clue: "Indice supplémentaire",

  // FindTheWords
  editor_word_list: "Liste de mots",

  // SingleChoiceSet
  editor_answers: "Réponses possibles",

  // MarkTheWords
  editor_text_with_marks: "Texte avec mots à marquer",
  editor_mark_words_hint: "Entourez les mots à marquer avec des *astérisques*",

  // SortParagraphs
  editor_section_paragraphs: "Paragraphes",
  editor_paragraph: "Paragraphe",
  editor_add_paragraph: "Ajouter un paragraphe",
  editor_paragraph_text: "Texte du paragraphe",

  // Summary
  editor_section_summaries: "Résumés",
  editor_summary_item: "Élément de résumé",
  editor_add_summary_item: "Ajouter un élément",
  editor_statement: "Affirmation",
  editor_add_statement: "Ajouter une affirmation",
  editor_statement_text: "Texte de l'affirmation",

  // Moodle Test
  editor_question_type: "Type de question",

  // Moodle Page
  editor_section_blocks: "Blocs",
  editor_block: "Bloc",
  editor_add_block: "Ajouter un bloc",
  editor_block_type: "Type de bloc",
  editor_block_content: "Contenu du bloc",

  // Activités Éléa spécifiques
  // Glossaire
  editor_glossary_name: "Nom du glossaire",

  // Millionnaire
  editor_good_answer: "Bonne réponse",
  editor_bad_answers: "Mauvaises réponses",
  editor_bad_answer: "Mauvaise réponse",
  editor_add_bad_answer: "Ajouter une mauvaise réponse",

  // Test (banque de questions)
  editor_bank_name: "Nom de la banque",
  editor_bank_description: "Description de la banque",
  editor_question_name: "Nom de la question",
  editor_question_feedback: "Feedback général",
  editor_answer_fraction: "Points/Score",
  editor_answer_feedback: "Feedback de la réponse",
  editor_subquestion: "Sous-question",
  editor_add_subquestion: "Ajouter une sous-question",
  editor_numerical_value: "Valeur numérique",
  editor_numerical_tolerance: "Tolérance",
  editor_section_subquestions: "Sous-questions",
  editor_section_content: "Contenu",
  editor_feedback_if_true: "Feedback si vrai",
  editor_feedback_if_false: "Feedback si faux",

  // Messages
  editor_save_success: "Modifications enregistrées",
  editor_save_error: "Erreur lors de l'enregistrement",
  editor_regenerating: "Régénération du fichier...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Ressource pédagogique",
  doc_fmt_generation_date: "Date de génération : ",
  doc_fmt_footer_text: "Document généré avec Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Page",
  doc_fmt_summary_header: "Sommaire",
  doc_fmt_quiz_title: "Quiz",
  doc_fmt_instructions: "📝 Instructions : Répondez aux questions suivantes.",
  doc_fmt_question_header: "Question",

  // --- Shared properties ---
  doc_fmt_type: "Type :",
  doc_fmt_feedbacks: "💬 Feedbacks :",
  doc_fmt_global_feedbacks: "Feedbacks globaux",
  doc_fmt_answers: "Réponses :",
  doc_fmt_correct_answer_true: "Réponse correcte : VRAI ✓",
  doc_fmt_correct_answer_false: "Réponse correcte : FAUX ✓",
  doc_fmt_text_if_true: "Texte si vrai :",
  doc_fmt_text_if_false: "Texte si faux :",
  doc_fmt_text_with_answers: "Texte avec les réponses :",
  doc_fmt_text_with_marks: "Texte avec les mots à marquer :",
  doc_fmt_marks_to_find: "Mots à marquer :",
  doc_fmt_keywords_expected: "Mots-clé attendus :",
  doc_fmt_accepted_answers: "Réponses acceptées :",
  doc_fmt_text_to_complete: "Texte à compléter :",
  doc_fmt_also_called: "🏷️ Aussi appelé :",
  doc_fmt_image_not_found: "⚠️ [Image non trouvée]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Flashcards",
  doc_fmt_card_index: "Carte",
  doc_fmt_card_front: "Recto :",
  doc_fmt_card_back: "Verso :",
  doc_fmt_hint: "💡 Indice :",
  doc_fmt_crossword_title: "Mots croisés",
  doc_fmt_definitions_and_answers: "Définitions et réponses",
  doc_fmt_answer: "Réponse :",
  doc_fmt_extra_hint: "💡 Indice supplémentaire :",
  doc_fmt_timeline_events: "Événements",
  doc_fmt_timeline_periods: "Périodes",
  doc_fmt_drag_the_words_title: "Glisser les mots",
  doc_fmt_fill_in_the_blanks_title: "Texte à trous",
  doc_fmt_mark_the_words_title: "Marquer les mots",
  doc_fmt_glossary_title: "Glossaire",
  doc_fmt_term_index: "Terme",
  doc_fmt_chart_title: "Diagramme",
  doc_fmt_data: "Données",
  doc_fmt_summary_title: "Résumé",
  doc_fmt_claim_index: "Affirmation",
  doc_fmt_multiple_choice_title: "Question à choix multiple",
  doc_fmt_single_choice_set_title: "Ensemble de questions à choix unique",
  doc_fmt_true_false_title: "Question Vrai/Faux",
  doc_fmt_dialog_cards_title: "Cartes de dialogue",
  doc_fmt_hint_front: "💡 Indice (recto) :",
  doc_fmt_hint_back: "💡 Indice (verso) :",
  doc_fmt_sort_paragraphs_title: "Ordonner les paragraphes",
  doc_fmt_paragraphs_ordered: "Paragraphes dans le bon ordre",
  doc_fmt_find_the_words_title: "Mots mêlés",
  doc_fmt_words_to_find: "Mots à trouver",
  doc_fmt_matching_title: "Appariement",
  doc_fmt_matching_instructions: "📝 Instructions : Associez chaque élément à sa correspondance.",
  doc_fmt_pairs_to_match: "Paires à associer",
  doc_fmt_millionnaire_title: "Qui veut gagner des millions ?",
  doc_fmt_millionnaire_instructions: "📝 Instructions : Trouvez la bonne réponse parmi les quatre propositions.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Question ouverte",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "Test",
  doc_fmt_associations: "Associations :",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Choix multiple (QCM)",
  doc_fmt_type_matching: "Appariement",
  doc_fmt_type_numerical: "Numérique",
  doc_fmt_type_truefalse: "Vrai/Faux",
  doc_fmt_type_shortanswer: "Réponse courte",
  doc_fmt_type_cloze: "Texte à trous (Cloze)",
  doc_fmt_type_blanks: "Texte à trous",
  doc_fmt_type_dragtext: "Glisser les mots",
  doc_fmt_type_markwords: "Marquer les mots",
  doc_fmt_type_essay: "Question ouverte",
  doc_fmt_type_default: "Question",

  // Nouvelles clés pour la structure pédagogique énoncé/correction
  doc_fmt_correction_title: "Correction",
  doc_fmt_proposed_answers: "Propositions :",
  doc_fmt_correct_answer: "Bonne réponse",
  doc_fmt_correct_answers: "Réponses correctes :",
  doc_fmt_true: "Vrai",
  doc_fmt_false: "Faux",
  doc_fmt_words_to_place: "Mots à placer :",
  doc_fmt_completed_text: "Texte complété :",
  doc_fmt_text_to_mark: "Texte dans lequel trouver les mots :",
  doc_fmt_words_count_to_find: "Nombre de mots à trouver",
  doc_fmt_words_to_mark: "Mots à marquer :",
  doc_fmt_answer_space: "Espace pour la réponse :",
  doc_fmt_open_answer: "Réponse ouverte - évaluation selon les critères définis par l'enseignant.",
  doc_fmt_definitions: "Définitions",
  doc_fmt_letters: "lettres",
  doc_fmt_summary_instructions: "Pour chaque groupe, choisissez l'affirmation correcte.",
  doc_fmt_sort_instructions: "Remettez les paragraphes suivants dans le bon ordre.",
  doc_fmt_paragraphs_to_sort: "Paragraphes à remettre en ordre",
  doc_fmt_correct_order: "Ordre correct",
  doc_fmt_find_instructions: "Trouvez",
  doc_fmt_hidden_words: "mots cachés dans la grille.",
  doc_fmt_hints: "Indices",
  doc_fmt_flashcards_instructions: "Pour chaque carte, trouvez la réponse correspondant à la question.",
  doc_fmt_elements_to_match: "Éléments à associer :",
  doc_fmt_possible_matches: "Correspondances possibles :",
  doc_fmt_correct_associations: "Associations correctes :",

};