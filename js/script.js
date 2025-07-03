// =======================================================================
// 1. GESTION DES MODULES ET DÉCLARATIONS DE BASE
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- Définition des modules H5P ---
    const h5pModules = {
        Timeline: {
            name: "Frise chronologique",
            englishName: "Timeline",
            machineName: "H5P.Timeline",
            description: "Créez une frise chronologique interactive pour présenter une séquence d'événements.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/timeline_icon-color.png",
            promptId: "timelineResultat",
            jsonInputId: "timelineJsonInput",
            createBtnId: "createTimelineH5P"
        },
        Flashcards: {
            name: "Cartes mémoires",
            englishName: "Flashcards",
            machineName: "H5P.Flashcards",
            description: "Créez des cartes recto-verso pour aider à la mémorisation de termes et définitions.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/flashcards-png-icon.png",
            promptId: "flashcardsResultat",
            jsonInputId: "flashcardsJsonInput",
            createBtnId: "createFlashcardsH5P"
        },
        QuizSet: {
            name: "Quiz",
            englishName: "Quiz (Question Set)",
            machineName: "H5P.QuestionSet",
            description: "Composez une série de questions variées (QCM, glisser-déposer, etc.) pour évaluer les connaissances.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/question-set-icon.png",
            promptId: "quizSetResultat",
            jsonInputId: "quizSetJsonInput",
            createBtnId: "createQuizSetH5P"
        },
        Glossary: {
            name: "Glossaire",
            englishName: "Accordion",
            machineName: "H5P.Accordion",
            description: "Créez un glossaire ou une FAQ sous forme d'accordéon dépliant.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/accordion-icon.png",
            promptId: "glossaryResultat",
            jsonInputId: "glossaryJsonInput",
            createBtnId: "createGlossaryH5P"
        },
        Crossword: {
            name: "Mots croisés",
            englishName: "Crosswords",
            machineName: "H5P.Crossword",
            description: "Générez une grille de mots croisés à partir d'une liste de mots et de définitions.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/crosswords.png",
            promptId: "crosswordResultat",
            jsonInputId: "crosswordJsonInput",
            createBtnId: "createCrosswordH5P"
        },
        Essay: {
            name: "Rédaction",
            englishName: "Essay",
            description: "Proposez un sujet de rédaction et définissez des mots-clés pour une correction automatisée.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/essay.png",
            promptId: "essayResultat",
            jsonInputId: "essayJsonInput",
            createBtnId: "createEssayH5P"
        },
        Summary: {
            name: "Résumé",
            englishName: "Summary",
            description: "Les élèves doivent reconstituer un résumé correct en choisissant les bonnes phrases.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/summary_icon.png",
            promptId: "summaryResultat",
            jsonInputId: "summaryJsonInput",
            createBtnId: "createSummaryH5P"
        },
        DragTheWords: {
            name: "Glisser les mots",
            englishName: "Drag the Words",
            machineName: "H5P.DragText",
            description: "Créez un texte à trous où les élèves doivent glisser les mots manquants.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/drag-the-words-icon.png",
            promptId: "dragWordResultat",
            jsonInputId: "dragWordJsonInput",
            createBtnId: "createDragWordH5P"
        },
        FillInTheBlanks: {
            name: "Texte à trous",
            englishName: "Fill in the Blanks",
            machineName: "H5P.Blanks",
            description: "Les élèves doivent remplir les mots manquants dans un texte directement au clavier.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/fill-in-the-blanks-icon_0.png",
            promptId: "blanksResultat",
            jsonInputId: "blanksJsonInput",
            createBtnId: "createBlanksH5P"
        },
        MarkTheWords: {
            name: "Surligner les mots",
            englishName: "Mark the Words",
            machineName: "H5P.MarkTheWords",
            description: "Demandez aux élèves de surligner certains mots dans un paragraphe.",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/mark-the-words-icon_0.png",
            promptId: "markWordsResultat",
            jsonInputId: "markWordsJsonInput",
            createBtnId: "createMarkWordsH5P"
        }
    };
    
    // --- Définition des modules Éléa ---
   const moodleModules = {
       moodleXml: {
           name: "XML Éléa/Moodle",
           description: "Générez un fichier XML complet pour importer un test dans Moodle ou Éléa.",
           image: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Extensible_Markup_Language_%28XML%29_logo.svg"
       },
       gift: {
           name: "Format GIFT",
           description: "Créez des questions au format GIFT, un moyen simple d'importer des questions dans Moodle.",
           image: "https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg"
       },
       Millionnaire: {
           name: "Millionnaire",
           description: "Générez une activité unique 'Millionnaire' de 6 questions graduelles en terme de difficulté.",
           image: "images/millionnaire.png",
           promptId: "millionnaireResultat",
           jsonInputId: "millionnaireJsonInput",
           createBtnId: "createMillionnaireMBZ"
       }
   };

// =======================================================================
// 2. INITIALISATION DES ÉLÉMENTS INTERFACE ET APPEL DES PREMIERS RENDUS
// =======================================================================
    const h5pGrid = document.querySelector('.h5p-grid');
    const moodleGrid = document.querySelector('.moodle-grid');
    generateH5PTiles();
    generateMoodleTiles();
    setupTabs();
    setupEventListeners();

// =======================================================================
// 3. AFFICHAGE DES TUILES (H5P et MOODLE)
// =======================================================================
    function generateH5PTiles() {
        if (!h5pGrid) return;
        h5pGrid.innerHTML = '';
        for (const key in h5pModules) {
            const module = h5pModules[key];
            const tile = document.createElement('div');
            tile.className = 'h5p-tile';
            tile.dataset.module = key;
            tile.innerHTML = `
                <img src="${module.image}" alt="${module.name} icon">
                <div class="tile-text">
                    <span class="tile-name-fr">${module.name}</span>
                    <span class="tile-name-en">(${module.englishName})</span>
                </div>
            `;
            tile.addEventListener('click', () => toggleInlineContent(key, tile));
            h5pGrid.appendChild(tile);
        }
   }

   function generateMoodleTiles() {
       if (!moodleGrid) return;
       moodleGrid.innerHTML = '';
       for (const key in moodleModules) {
           const module = moodleModules[key];
           const tile = document.createElement('div');
           tile.className = 'h5p-tile'; // Réutiliser le style des tuiles H5P
           tile.dataset.module = key;
           tile.innerHTML = `
               <img src="${module.image}" alt="${module.name} icon">
               <div class="tile-text">
                   <span class="tile-name-fr">${module.name}</span>
               </div>
           `;
           tile.addEventListener('click', () => toggleMoodleContent(key, tile));
           moodleGrid.appendChild(tile);
       }
   }

// =======================================================================
// 4. GESTION DES ONGLETS
// =======================================================================
    function setupTabs() {
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');

        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.dataset.tab;

                tabLinks.forEach(l => l.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                link.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

// =======================================================================
// 5. AFFICHAGE DU CONTENU DYNAMIQUE (Inline + Moodle)
// =======================================================================
    let activeContentContainer = null;
    let activeTile = null;

    function toggleInlineContent(moduleKey, tileElement) {
        const previouslyActiveContainer = activeContentContainer;
        const previouslyActiveTile = activeTile;

        // Fermer l'élément actuellement ouvert en le supprimant directement du DOM
        if (previouslyActiveContainer) {
            previouslyActiveContainer.remove();
        }
        if (previouslyActiveTile) {
            previouslyActiveTile.classList.remove('active');
        }

        // Si on clique sur la même tuile, on la ferme et on s'arrête là
        if (previouslyActiveContainer && previouslyActiveTile === tileElement) {
            activeContentContainer = null;
            activeTile = null;
            return;
        }

        const module = h5pModules[moduleKey];
        if (!module) return;

        // Créer le nouveau conteneur
        const contentContainer = document.createElement('div');
        contentContainer.className = 'h5p-content-container';
        contentContainer.innerHTML = `
                <div class="h5p-content-header">
                    <h2>${module.name}</h2>
                    <span class="close-button">&times;</span>
                </div>
                <p class="h5p-content-description">${module.description}</p>
                
                <div class="h5p-prompt-block">
                    <h3>Prompt pour l'IA</h3>
                    <textarea id="${module.promptId}" readonly placeholder="Générez les prompts pour voir le résultat ici..."></textarea>
                    <div class="action-buttons">
                        <button id="copy-${moduleKey}" class="copy-btn">📋 Copier le prompt</button>
                        <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                        <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
                    </div>
                </div>

                <div class="h5p-processor">
                    <h3>Créer le fichier H5P complet</h3>
                    <p>Collez le résultat de l'IA dans la zone ci-dessous pour créer votre module.</p>
                    <textarea id="${module.jsonInputId}" placeholder="Collez ici le JSON ou le texte généré par l'IA..."></textarea>
                    <button id="${module.createBtnId}" class="download-btn">Générer le H5P</button>
                </div>
        `;

        // Insérer le conteneur APRÈS la grille pour ne pas perturber le layout
        const existingContainer = document.querySelector('.h5p-content-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        h5pGrid.after(contentContainer);
        
        // Activer le conteneur et la tuile
        contentContainer.classList.add('active');
        tileElement.classList.add('active');

        activeContentContainer = contentContainer;
        activeTile = tileElement;

        // Attacher les événements
        attachInlineEventListeners(moduleKey, contentContainer, tileElement);

        // Remplir le prompt si déjà généré
        const generatedPrompt = document.getElementById(`hidden-${module.promptId}`)?.value;
        if (generatedPrompt) {
            document.getElementById(module.promptId).value = generatedPrompt;
        }
    }

   function toggleMoodleContent(moduleKey, tileElement) {
       const previouslyActiveContainer = activeContentContainer;
       const previouslyActiveTile = activeTile;

       if (previouslyActiveContainer) {
           previouslyActiveContainer.remove();
       }
       if (previouslyActiveTile) {
           previouslyActiveTile.classList.remove('active');
       }

       if (previouslyActiveContainer && previouslyActiveTile === tileElement) {
           activeContentContainer = null;
           activeTile = null;
           return;
       }

       const module = moodleModules[moduleKey];
       if (!module) return;

       const contentContainer = document.createElement('div');
       contentContainer.className = 'h5p-content-container'; // Réutiliser le style
       let contentHtml = '';

       if (moduleKey === 'moodleXml') {
           contentHtml = `
               <h3>Génération d'un XML Éléa/Moodle</h3>
               <p>${module.description}</p>
               <textarea id="moodleXmlResultat" readonly placeholder="Le XML Moodle apparaîtra ici..."></textarea>
               <div class="action-buttons">
                   <button id="copyMoodleXmlLink" class="copy-btn">📋 Copier le prompt</button>
                   <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                   <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
               </div>
           `;
       } else if (moduleKey === 'gift') {
           contentHtml = `
               <h3>Génération d'un format GIFT</h3>
               <p>${module.description}</p>
               <textarea id="giftResultat" readonly placeholder="Le format GIFT apparaîtra ici..."></textarea>
               <div class="action-buttons">
                   <button id="copyGiftLink" class="copy-btn">📋 Copier le prompt</button>
                   <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                   <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
               </div>
           `;
       } else if (moduleKey === 'Millionnaire') {
           contentHtml = `
               <h3>Génération d'une activité unique "Millionnaire"</h3>
               <p>${module.description}</p>
               <div class="h5p-prompt-block">
                   <h3>Prompt pour l'IA</h3>
                   
                   <textarea id="${module.promptId}" readonly placeholder="Générez les prompts pour voir le résultat ici..."></textarea>
                   <div class="action-buttons">
                       <button id="copy-${moduleKey}" class="copy-btn">📋 Copier le prompt</button>
                       <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                       <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
                   </div>
               </div>
               <div class="h5p-processor">
                   <h3>Créer le fichier Millionnaire (.mbz)</h3>
                   <p>Collez le JSON généré par l'IA ci-dessous. Le titre de l'activité sera automatiquement extrait du JSON.</p>
                   <textarea id="${module.jsonInputId}" placeholder="Collez ici l'objet JSON complet (avec titre et questions) généré par l'IA..."></textarea>
                   <button id="${module.createBtnId}" class="download-btn">Générer l'activité Millionnaire (mbz)</button>
               </div>
           `;
       }

       contentContainer.innerHTML = `
           <div class="h5p-content-header">
               <h2>${module.name}</h2>
               <span class="close-button">&times;</span>
           </div>
           <div class="module-content">
               ${contentHtml}
           </div>
       `;

       moodleGrid.after(contentContainer);
       contentContainer.classList.add('active');
       tileElement.classList.add('active');

       activeContentContainer = contentContainer;
       activeTile = tileElement;

       // Attach event listeners for the new content
       contentContainer.querySelector('.close-button').addEventListener('click', () => {
           toggleMoodleContent(moduleKey, tileElement);
       });
       if (moduleKey === 'moodleXml') {
           setupCopyButton('copyMoodleXmlLink', 'moodleXmlResultat');
       } else if (moduleKey === 'gift') {
           setupCopyButton('copyGiftLink', 'giftResultat');
       } else if (moduleKey === 'Millionnaire') {
           const module = moodleModules[moduleKey];
           setupCopyButton(`copy-${moduleKey}`, module.promptId);
           document.getElementById(module.createBtnId).addEventListener('click', () => {
               const jsonInput = document.getElementById(module.jsonInputId).value;
               if (!jsonInput) {
                   showNotification('Veuillez coller le contenu JSON généré.', 'error');
                   return;
               }
               handleMillionnaireCreation(jsonInput);
           });
       }
       contentContainer.querySelectorAll('.go-duck').forEach(btn => btn.addEventListener('click', () => window.open('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat&duckai=1', '_blank', 'noopener,noreferrer')));
       contentContainer.querySelectorAll('.go-mistral').forEach(btn => btn.addEventListener('click', () => window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer')));
       
       // Remplir le prompt si déjà généré
       let promptId;
       if (moduleKey === 'moodleXml') {
           promptId = 'moodleXmlResultat';
       } else if (moduleKey === 'gift') {
           promptId = 'giftResultat';
       } else if (moduleKey === 'Millionnaire') {
           promptId = moodleModules[moduleKey].promptId;
       }

       if (promptId) {
           const generatedPrompt = document.getElementById(`hidden-${promptId}`)?.value;
           if (generatedPrompt) {
               const targetTextarea = document.getElementById(promptId);
               if (targetTextarea) {
                   targetTextarea.value = generatedPrompt;
               }
           }
       }
   }

   function attachInlineEventListeners(moduleKey, container, tile) {
        const module = h5pModules[moduleKey];

        // Bouton fermer
        container.querySelector('.close-button').addEventListener('click', () => {
            toggleInlineContent(moduleKey, tile); // Appeler toggle pour fermer
        });
        
        // Bouton Copier
        container.querySelector(`#copy-${moduleKey}`).addEventListener('click', function() {
            copyToClipboard(module.promptId, this);
        });

        // Boutons IA
        container.querySelectorAll('.go-duck').forEach(btn => btn.addEventListener('click', () => window.open('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat&duckai=1', '_blank', 'noopener,noreferrer')));
        container.querySelectorAll('.go-mistral').forEach(btn => btn.addEventListener('click', () => window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer')));

        // Bouton de création H5P
        const createBtn = container.querySelector(`#${module.createBtnId}`);
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const jsonInput = container.querySelector(`#${module.jsonInputId}`).value;
                if (!jsonInput) {
                    showNotification('Veuillez coller le contenu généré par l\'IA.', 'error');
                    return;
                }
                handleH5PCreation(moduleKey, jsonInput);
            });
        }
    }

// =======================================================================
// 6. GÉNÉRATION DES PROMPTS
// =======================================================================

    function generatePrompts() {
        const matiere = document.getElementById('matiere').value.trim();
        const niveau = document.getElementById('niveau').value.trim();
        const theme = document.getElementById('theme').value.trim();
        const nombreQuestions = document.getElementById('nombreQuestions').value.trim();

        if (!matiere || !niveau || !theme || !nombreQuestions) {
            showNotification('Veuillez remplir tous les champs.', 'error');
            return;
        }

        // Stocker les prompts générés dans des éléments cachés pour les réutiliser
        const prompts = getPrompts(matiere, niveau, theme, nombreQuestions);
        
        // Nettoyer les anciens prompts cachés
        document.querySelectorAll('textarea[id^="hidden-"]').forEach(el => el.remove());

        for (const key in prompts) {
            const hiddenTextarea = document.createElement('textarea');
            hiddenTextarea.id = `hidden-${key}`;
            hiddenTextarea.style.display = 'none';
            hiddenTextarea.value = prompts[key];
            document.body.appendChild(hiddenTextarea);
        }
        
        // Si un contenu est ouvert, rafraîchir son prompt
        if (activeContentContainer && activeTile) {
            const moduleKey = activeTile.dataset.module;
            const module = h5pModules[moduleKey] || moodleModules[moduleKey];

            if (module) {
                let promptId;
                // Les modules H5P et le nouveau module Millionnaire ont un promptId
                if (module.promptId) {
                    promptId = module.promptId;
                } 
                // Cas des anciens modules Moodle
                else if (moduleKey === 'moodleXml') {
                    promptId = 'moodleXmlResultat';
                } else if (moduleKey === 'gift') {
                    promptId = 'giftResultat';
                }

                if (promptId) {
                    const promptTextarea = document.getElementById(promptId);
                    const generatedPrompt = document.getElementById(`hidden-${promptId}`)?.value;
                    if (promptTextarea && generatedPrompt) {
                        promptTextarea.value = generatedPrompt;
                    }
                }
            }
        }

        showNotification('Prompts générés avec succès !');
    }

// =======================================================================
// 7. INITIALISATION DES ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX
// =======================================================================
    
    function setupEventListeners() {
        document.getElementById('generateBtn')?.addEventListener('click', generatePrompts);

        // Les boutons Moodle & GIFT sont maintenant gérés dans toggleMoodleContent

        document.querySelectorAll('.go-duck').forEach(button => {
            button.addEventListener('click', () => {
                window.open('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat&duckai=1', '_blank', 'noopener,noreferrer');
            });
        });

        document.querySelectorAll('.go-mistral').forEach(button => {
            button.addEventListener('click', () => {
                window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer');
            });
        });
    }

// =======================================================================
// 8. FONCTIONS UTILITAIRES GLOBALES (copie, notification, etc)
// =======================================================================
    function setupCopyButton(buttonId, textareaId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                copyToClipboard(textareaId, this);
            });
        }
    }

    function copyToClipboard(textareaId, button) {
        const textarea = document.getElementById(textareaId);
        if (!textarea || !textarea.value.trim()) {
            showNotification('Le champ est vide. Veuillez d\'abord générer un prompt.', 'error');
            return;
        }
        navigator.clipboard.writeText(textarea.value).then(() => {
            const originalHtml = button.innerHTML;
            button.innerHTML = '✓ Copié !';
            button.style.backgroundColor = '#2ecc71';
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Erreur de copie:', err);
            showNotification('La copie a échoué.', 'error');
        });
    }

    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        if (type === 'error') {
            notification.classList.add('error');
        }

        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000);
    }

    function handleH5PCreation(moduleKey, jsonInput) {
        const module = h5pModules[moduleKey];
        if (!module) {
            showNotification(`Module '${moduleKey}' non trouvé.`, 'error');
            return;
        }

        // --- NOUVELLE LOGIQUE POUR ESSAY ---
        if (moduleKey === 'Essay') {
            try {
                const contentJson = JSON.parse(jsonInput);
                const title = document.getElementById('theme').value.trim() || module.name;
                createSimpleEssayH5P(title, contentJson);
            } catch (error) {
                showNotification(`Le JSON pour le module Essay est invalide : ${error.message}`, 'error');
                console.error("Erreur JSON pour Essay:", error);
            }
            return; // On arrête ici pour Essay
        }
        // --- FIN DE LA NOUVELLE LOGIQUE ---

        // --- NOUVELLE LOGIQUE POUR QUIZSET ---
        if (moduleKey === 'QuizSet') {
            try {
                const contentJson = JSON.parse(jsonInput);
                // Le titre est maintenant dans le champ de saisie, ou on utilise un titre par défaut.
                const title = document.getElementById('theme').value.trim() || module.name;
                createSimpleQuizSetH5P(title, contentJson);
            } catch (error) {
                showNotification(`Le JSON pour le Quiz est invalide : ${error.message}`, 'error');
                console.error("Erreur JSON pour QuizSet:", error);
            }
            return; // On arrête ici pour le QuizSet
        }
        // --- FIN DE LA NOUVELLE LOGIQUE ---


        // Utilise le machineName s'il est défini, sinon construit le nom (fallback)
        const machineName = module.machineName || `H5P.${moduleKey}`;

        try {
            // Extraction robuste du JSON pour ignorer le texte environnant ou les balises de code.
            const match = jsonInput.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (!match) {
                throw new Error("Aucun contenu JSON valide n'a été trouvé dans le texte fourni.");
            }
            const extractedJson = match[0];
            const jsonObj = JSON.parse(extractedJson);
            let content = jsonObj;
            let options = { title: jsonObj.title || module.name };

            // Adaptations spécifiques par module
            if (moduleKey === 'Timeline' && !jsonObj.timeline) {
                content = { timeline: jsonObj };
            } else if (moduleKey === 'Flashcards') {
                const defaultFlashcardsContent = {
                    title: jsonObj.title || "Flashcards",
                    description: jsonObj.description || "Cliquez sur la carte pour voir la réponse.",
                    cards: jsonObj.cards ? jsonObj.cards.map(card => ({ ...card, tip: card.tip || "" })) : [],
                    progressText: "Carte @card sur @total",
                    next: "Suivant",
                    previous: "Précédent",
                    checkAnswerText: "Vérifier",
                    showSolutionsRequiresInput: true,
                    defaultAnswerText: "Votre réponse",
                    correctAnswerText: "Réponse exacte",
                    incorrectAnswerText: "Réponse inexacte",
                    showSolutionText: "Réponse correcte",
                    results: "Résultats",
                    ofCorrect: "@score réponses correctes sur un total de @total",
                    showResults: "Montrer les résultats",
                    answerShortText: "R :",
                    retry: "Recommencer",
                    caseSensitive: false,
                    cardAnnouncement: "Réponse incorrecte. La réponse correcte était @answer",
                    correctAnswerAnnouncement: "@answer is correct.",
                    pageAnnouncement: "Page @current of @total",
                    randomCards: false
                };
                content = defaultFlashcardsContent;
                options.description = content.description;
            } else if (moduleKey === 'FillInTheBlanks' && jsonObj.textBlocks) {
                // Rétrocompatibilité pour l'ancien format de prompt
                content = { questions: jsonObj.textBlocks };
                if (jsonObj.taskDescription) {
                    options.title = jsonObj.taskDescription;
                }
            } else if (moduleKey === 'MarkTheWords') {
                // Correction pour les apostrophes collées aux astérisques (ex: l'*élève*)
                const correctedTextField = jsonObj.textField.replace(/([’'])\*/g, "$1 *");

                content = {
                    taskDescription: jsonObj.taskDescription,
                    textField: correctedTextField,
                    behaviour: {
                        enableRetry: true,
                        enableSolutionsButton: true,
                        enableCheckButton: true,
                        showScorePoints: true
                    },
                    overallFeedback: []
                };
            }

            const dynamicDependencies = (moduleKey === 'QuizSet' && jsonObj.quiz?.questions)
                ? [...new Set(jsonObj.quiz.questions.map(q => q.library.split(' ')[0]))]
                : [];

            createH5PFile(machineName, JSON.stringify(content), options, dynamicDependencies);

        } catch (error) {
            if (error instanceof SyntaxError) {
                showNotification(`Le JSON fourni est invalide. Erreur: ${error.message}`, 'error');
            } else {
                showNotification(`Erreur de création H5P: ${error.message}`, 'error');
            }
            console.error(`Erreur pour ${moduleKey}:`, error);
        }
    }

// =======================================================================
// 9. GÉNÉRATION DES PROMPTS PERSONNALISÉS PAR MODULE
// =======================================================================


    function getPrompts(matiere, niveau, theme, nombreQuestions) {
        const timelinePrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Timeline".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre d'événements clés :** ${nombreQuestions}

                                **Ta mission :**
                                Génère un objet JSON complet et valide pour une activité H5P de type Timeline. Le JSON doit être directement utilisable.

                                **Structure du JSON attendu :**
                                L'objet principal doit contenir une clé "timeline". Cet objet "timeline" doit inclure :
                                - \`headline\`: Un titre général pour la frise.
                                - \`text\`: Un court paragraphe d'introduction.
                                - \`asset\`: Un objet pour l'image de couverture avec \`media\` (URL), \`caption\` (légende) et \`credit\` (source).
                                - \`date\`: Un tableau contenant ${nombreQuestions} objets, chacun représentant un événement.
                                - \`era\`: Un tableau d'objets pour définir des périodes couvrant plusieurs événements.

                                **Règles pour le contenu :**
                                1.  Chaque événement dans le tableau \`date\` doit avoir :
                                    -   \`startDate\`: Date au format "AAAA,MM,JJ" ou "AAAA".
                                    -   \`headline\`: Titre de l'événement.
                                    -   \`text\`: Description en HTML (utilise <p> et <strong>).
                                    -   \`asset\`: Un objet optionnel pour une image illustrant l'événement.
                                2.  Assure-toi que les URL des images sont valides et accessibles.
                                3.  La langue du contenu doit être "fr".

                                **Exemple de structure JSON :**
                                \`\`\`json
                                {
                                "timeline": {
                                    "headline": "Titre de la frise chronologique",
                                    "text": "<p>Introduction sur le thème de la frise.</p>",
                                    "asset": {
                                    "media": "URL_IMAGE_PRINCIPALE",
                                    "caption": "Légende de l'image",
                                    "credit": "Source de l'image"
                                    },
                                    "date": [
                                    {
                                        "startDate": "1914,07,28",
                                        "headline": "Début de la Première Guerre mondiale",
                                        "text": "<p>L'Autriche-Hongrie déclare la guerre à la Serbie.</p>",
                                        "asset": {
                                        "media": "URL_IMAGE_EVENEMENT_1",
                                        "caption": "Légende",
                                        "credit": "Source"
                                        }
                                    }
                                    ],
                                    "era": [
                                    {
                                        "startDate": "1914,07,28",
                                        "endDate": "1918,11,11",
                                        "headline": "Première Guerre mondiale"
                                    }
                                    ]
                                }
                                }
                                \`\`\`

                                Génère uniquement le code JSON valide, sans aucun commentaire. Le résultat sera directement utilisé par un autre outil.`;

        const crosswordPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Crossword".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre de mots :** ${nombreQuestions} (entre 5 et 10)

                                **Ta mission :**
                                Génère un objet JSON complet et valide pour une activité de mots croisés H5P.

                                **Structure du JSON attendu :**
                                L'objet doit contenir :
                                - \`title\`: Un titre pour l'activité.
                                - \`words\`: Un tableau de ${nombreQuestions} objets, chacun avec :
                                    - \`answer\`: Le mot à deviner.
                                    - \`clue\`: La définition correspondante.
                                - \`taskDescription\`: Une consigne claire.

                                **Règles pour le contenu :**
                                1.  Les mots (\`answer\`) doivent être des termes uniques et pertinents.
                                2.  **CRUCIAL pour la génération de la grille :**
                                    -   Les mots doivent avoir une longueur d'au moins **3 caractères**. Évite les mots trop courts comme "BE" ou "DO".
                                    -   La liste de mots doit contenir suffisamment de lettres communes pour permettre un entrecroisement facile. Choisis des mots qui se partagent des voyelles ou des consonnes fréquentes.
                                3.  Les définitions (\`clue\`) doivent être courtes et précises.
                                4.  **IMPORTANT :** Assure-toi que toutes les chaînes de caractères dans le JSON sont valides. Échappe correctement les caractères spéciaux, notamment les sauts de ligne qui doivent être représentés par \`\\n\` et non par un vrai retour à la ligne.
                                5.  Le reste de la structure JSON (comportement, thème, etc.) doit être conservé tel quel.

                                **Exemple de JSON pour un mot :**
                                \`\`\`json
                                {
                                "title": "Mots croisés sur la Biologie",
                                "words": [
                                    {
                                    "answer": "Cellule",
                                    "clue": "Unité de base de la vie."
                                    }
                                ],
                                "taskDescription": "<p>Complète la grille de mots croisés.</p>"
                                }
                                \`\`\`

                                Génère le JSON complet et valide, en remplissant le titre, la description et le tableau "words", sans aucun autre commentaire.`;

        const essayPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Essay".
                            Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                            **Contexte :**
                            - **Matière :** ${matiere}
                            - **Niveau des élèves :** ${niveau}
                            - **Thème :** ${theme}
                            - **Nombre de mots-clés :** ${nombreQuestions} (entre 5 et 8)

                            **Ta mission :**
                            Génère un objet JSON complet et valide pour une activité H5P de type Essay.

                            **Structure du JSON attendu :**
                            L'objet doit contenir :
                            - \`taskDescription\`: Une consigne claire invitant l'élève à rédiger un texte sur le thème.
                            - \`keywords\`: Un tableau de ${nombreQuestions} objets, chacun définissant un mot-clé.
                            - \`sampleSolution\`: Une phrase d'exemple qui intègre de manière fluide TOUS les mots-clés.

                            **Règles pour le contenu :**
                            1.  Chaque objet dans \`keywords\` doit contenir :
                                - \`keyword\`: Le mot à rechercher (un mot unique, sans espaces).
                                - \`options\`: Un objet avec au minimum \`"points": 1\` et \`"caseSensitive": false\`.
                            2.  Les mots-clés doivent être pertinents et essentiels pour évaluer la compréhension du thème.
                            3.  La \`sampleSolution\` doit être une phrase grammaticalement correcte et cohérente.

                            **Exemple de JSON :**
                            \`\`\`json
                            {
                                "taskDescription": "<p>Rédige un court texte expliquant la photosynthèse.</p>",
                                "keywords": [
                                    { "keyword": "lumière", "options": { "points": 1, "caseSensitive": false } },
                                    { "keyword": "chlorophylle", "options": { "points": 1, "caseSensitive": false } }
                                ],
                                "sampleSolution": "La photosynthèse est le processus par lequel les plantes utilisent la lumière du soleil pour produire de l'énergie grâce à la chlorophylle."
                            }
                            \`\`\`

                            Génère le JSON complet et valide, sans aucun autre commentaire.`;

        const moodleXmlPrompt = `Je suis professeur de ${matiere} pour des élèves de niveau ${niveau}.

                                Je souhaite créer un quiz de ${nombreQuestions} questions sur le thème suivant : ${theme}.
                                Concernant le fond :

                                Les réponses incorrectes doivent être cohérentes avec le sujet mais clairement fausses pour éviter le hasard.
                                Il faut varier la difficulté des questions, idéalement du plus simple au plus complexe.
                                Simplifie la formulation tout en maintenant la précision du contenu.
                                Pour générer le feedback, tu donneras en une phrase ou deux les éléments de réponse attendus

                                Les questions doivent être réparties équitablement entre les types suivants :
                                - multichoice (QCM, avec une seule bonne réponse),
                                                - matching (appariement),
                                                - numerical (réponse numérique avec ou sans tolérance),
                                                - truefalse (vrai ou faux).

                                Concernant la forme :
                                Le fichier XML doit :

                                Être encodé en UTF-8 (insérer la ligne d'encodage).
                                Être directement réutilisable dans Moodle, sans erreur de format.
                                Suivre la structure XML standard de Moodle (avec <quiz>, <question>, etc.).


                                Ne commente pas, ne formate pas, ne résume pas : je veux uniquement le contenu brut du fichier XML. Respecte scrupuleusement le format décrit, car je vais coller le résultat dans un autre outil qui attend ce format. Produit la réponse sous forme de code préformaté`;

        const giftPrompt = `Je suis professeur de ${matiere} pour des élèves de niveau ${niveau}.

                          Je souhaite créer un quiz de ${nombreQuestions} questions sur le thème suivant : ${theme}.

                          Le quizz doit être au format GIFT, destiné à être importé dans Moodle.

                          Chaque question doit être claire, concise, sans ambiguïté. Il faut qu'il ait des feedbacks détaillés.

                          Le code doit être exactement au même format que celui fourni ci-dessous:

                          // question: 1  name: Quel est l'objet central de notre système solaire ?

                          ::Quel est l'objet central de notre système solaire ?::Quel est l'objet central de notre système solaire ?{

                              =Le Soleil#Exact ! Le Soleil est l'étoile centrale de notre système solaire. Bien joué !

                              ~La Lune#Faux. La Lune est un satellite naturel de la Terre. Le Soleil est l'objet central.

                              ~Jupiter#Faux. Jupiter est une planète géante gazeuse. Le Soleil est l'objet central.

                              ~La Terre#Faux. La Terre est la planète où nous vivons. Le Soleil est l'objet central.

                          }

                          Le quiz doit comporter différents types de questions de manière aléatoire :
                          - des questions QCM (multichoice), avec 1 bonne réponse et 3 distracteurs.
                          - des questions vrai/faux (truefalse).
                          - des questions numériques (numerical) avec une marge d'erreur acceptable.
                          - des questions d'appariement (matching) avec au moins 4 paires.

                          Génère directement le quiz au format GIFT, sans commentaires ni balises supplémentaires. Respecte scrupuleusement le format décrit, car je vais coller le résultat dans un autre outil qui attend ce format. Produit la réponse sous forme de code préformaté.`;

        
        const flashcardsPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Flashcards".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre de cartes :** ${nombreQuestions}

                                **Ta mission :**
                                Génère un objet JSON complet et valide pour une activité H5P de type Flashcards.

                                **Structure du JSON attendu :**
                                L'objet doit contenir :
                                - \`title\`: Un titre pertinent pour l'activité.
                                - \`description\`: Une consigne claire pour l'élève.
                                - \`cards\`: Un tableau de ${nombreQuestions} objets, où chaque objet représente une carte et contient :
                                    - \`text\`: La question ou le terme à deviner (recto).
                                    - \`answer\`: La réponse ou la définition (verso).

                                **Exemple de JSON :**
                                \`\`\`json
                                {
                                "title": "Les capitales d'Europe",
                                "description": "Mémorise la capitale de chaque pays. Clique sur la carte pour voir la réponse.",
                                "cards": [
                                    {
                                    "text": "France",
                                    "answer": "Paris"
                                    },
                                    {
                                    "text": "Allemagne",
                                    "answer": "Berlin"
                                    }
                                ]
                                }
                                \`\`\`

                                Génère uniquement le code JSON valide, sans aucun commentaire.`;

        const quizSetPrompt = `Tu es un expert en ingénierie pédagogique créant le contenu pour une activité "H5P Quiz (Question Set)".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre de questions :** ${nombreQuestions}

                                **Ta mission :**
                                Génère un objet JSON **uniquement pour le contenu** d'un quiz H5P. Le JSON doit être directement utilisable comme fichier \`content.json\`.

                                **Structure du JSON attendu :**
                                L'objet principal doit contenir les clés suivantes :
                                - \`progressType\`: "dots"
                                - \`passPercentage\`: 50
                                - \`questions\`: Un tableau de ${nombreQuestions} objets, chacun représentant une question.

                                **Règles pour le contenu des questions :**
                                1.  Chaque objet question doit avoir les clés \`library\`, \`params\`, et \`subContentId\`.
                                2.  **Ne génère PAS de \`subContentId\`**, laisse juste la chaîne "placeholder-uuid".
                                3.  Varie les types de questions. Utilise les bibliothèques suivantes avec leurs versions exactes :
                                    -   \`H5P.MultiChoice 1.16\`
                                    -   \`H5P.Blanks 1.14\`
                                4.  Pour chaque type de question, fournis des \`params\` complets et pertinents, incluant les textes, les bonnes réponses, les distracteurs, les comportements (\`behaviour\`), etc.
                                5.  Assure-toi que le contenu (questions, réponses) est de haute qualité pédagogique, pertinent pour le thème et le niveau.

                                **Exemple de structure pour une question H5P.MultiChoice :**
                                \`\`\`json
                                {
                                "library": "H5P.MultiChoice 1.16",
                                "subContentId": "placeholder-uuid",
                                "params": {
                                    "question": "<p>Quelle est la capitale de la France ?</p>",
                                    "answers": [
                                    { "text": "Paris", "correct": true, "tipsAndFeedback": { "tip": "", "chosenFeedback": "Bonne réponse !", "notChosenFeedback": "" }},
                                    { "text": "Berlin", "correct": false, "tipsAndFeedback": { "tip": "", "chosenFeedback": "Incorrect.", "notChosenFeedback": "" }}
                                    ],
                                    "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true }
                                }
                                }
                                \`\`\`

                                Génère l'objet JSON complet et valide, en commençant par \`{"progressType": "dots", ...}\`, sans aucun commentaire.`;

        const glossaryPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Accordion".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre d'entrées :** ${nombreQuestions}

                                **Ta mission :**
                                Génère un objet JSON complet et valide pour un glossaire H5P de type Accordion.

                                **Structure du JSON attendu :**
                                L'objet doit contenir une clé "panels", qui est un tableau de ${nombreQuestions} objets.
                                Chaque objet représente une entrée du glossaire et doit contenir :
                                - \`title\`: Le mot ou l'expression à définir.
                                - \`content\`: Un objet contenant les "params" avec le texte de la définition. La définition doit être en HTML (utilise <p>, <strong>, etc.).

                                **Règles pour le contenu :**
                                1.  Les définitions doivent être claires, concises et adaptées au niveau des élèves.
                                2.  La structure interne de l'objet "content" (library, metadata, subContentId) doit être respectée, mais tu n'as pas besoin de générer de UUID.

                                **Exemple de JSON pour une entrée :**
                                \`\`\`json
                                {
                                "panels": [
                                    {
                                    "title": "Photosynthèse",
                                    "content": {
                                        "params": {
                                        "text": "<p>Processus par lequel les plantes vertes transforment la lumière du soleil en énergie.</p>"
                                        },
                                        "library": "H5P.AdvancedText 1.1",
                                        "subContentId": "placeholder-uuid"
                                    }
                                    }
                                ],
                                "hTag": "h2"
                                }
                                \`\`\`

                                Génère uniquement le code JSON valide, sans aucun commentaire.`;

        const summaryPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Summary".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre de phrases dans le résumé :** ${nombreQuestions}

                                **Ta mission :**
                                Génère un objet JSON complet pour une activité H5P de type Summary.

                                **Structure du JSON attendu :**
                                L'objet doit contenir une clé "summaries", qui est un tableau de ${nombreQuestions} objets.
                                Chaque objet représente une étape du résumé et contient un tableau "summary" de phrases.

                                **Règles pour le contenu :**
                                1.  Dans chaque tableau "summary", la **première phrase est la bonne**.
                                2.  Les phrases suivantes sont des distracteurs plausibles mais incorrects.
                                3.  L'ensemble des phrases correctes doit former un résumé cohérent.

                                **Exemple de JSON pour une étape :**
                                \`\`\`json
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
                                \`\`\`

                                Génère uniquement le code JSON valide, sans aucun commentaire.`;

        const dragWordPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Drag the Words".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre de mots à glisser :** environ ${nombreQuestions}

                                **Ta mission :**
                                Génère un objet JSON complet pour une activité H5P de type Drag the Words.

                                **Structure du JSON attendu :**
                                L'objet doit contenir :
                                - \`taskDescription\`: Une consigne claire.
                                - \`textField\`: Le texte à compléter, où les mots à glisser sont entourés d'astérisques (*mot*).

                                **Règles pour le contenu :**
                                1.  Crée un texte cohérent sur le thème.
                                2.  Identifie environ ${nombreQuestions} mots-clés à transformer en mots à glisser.

                                **Exemple de JSON :**
                                \`\`\`json
                                {
                                "taskDescription": "Complète le texte en faisant glisser les mots.",
                                "textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*."
                                }
                                \`\`\`

                                Génère uniquement le code JSON valide, sans aucun commentaire.`;

        const blanksPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Fill in the Blanks".
                            Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                            **Contexte :**
                            - **Matière :** ${matiere}
                            - **Niveau des élèves :** ${niveau}
                            - **Thème :** ${theme}
                            - **Nombre de trous :** environ ${nombreQuestions}

                            **Ta mission :**
                            Génère un objet JSON complet pour une activité H5P de type Fill in the Blanks.

                            **Structure du JSON attendu :**
                            L'objet doit contenir une clé \`questions\`, qui est un tableau de chaînes de caractères. Chaque chaîne représente un bloc de texte à compléter.

                            **Règles pour le contenu :**
                            -   Les mots à deviner sont entourés d'astérisques (*mot*).
                            -   Pour des réponses alternatives, utilisez une barre oblique : *Paris/Ville Lumière*.
                            -   Pour ajouter une infobulle, utilisez deux-points : *open-source:Code source public*.

                            **Exemple de JSON :**
                            \`\`\`json
                            {
                            "questions": [
                                "Le système solaire a *huit* planètes. La plus grande est *Jupiter*.",
                                "La capitale de la France est *Paris/Ville Lumière*."
                            ]
                            }
                            \`\`\`

                            Génère uniquement le code JSON valide, sans aucun commentaire.`;

        const markWordsPrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Mark the Words".
                                Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                **Contexte :**
                                - **Matière :** ${matiere}
                                - **Niveau des élèves :** ${niveau}
                                - **Thème :** ${theme}
                                - **Nombre de mots à marquer :** environ ${nombreQuestions}

                                **Ta mission :**
                                Génère un objet JSON complet pour une activité H5P de type Mark the Words.

                                **Structure du JSON attendu :**
                                L'objet doit contenir :
                                - \`taskDescription\`: Une consigne claire.
                                - \`textField\`: Le texte où les mots à marquer sont entourés d'astérisques (*mot*).

                                **Règles pour le contenu :**
                                1.  Crée un paragraphe pertinent sur le thème.
                                2.  Identifie environ ${nombreQuestions} mots-clés importants à marquer.

                                **Exemple de JSON :**
                                \`\`\`json
                                {
                                "taskDescription": "Clique sur les mots importants dans le texte.",
                                "textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*."
                                }
                                \`\`\`

                                Génère uniquement le code JSON valide, sans aucun commentaire.`;

       const millionnairePrompt = `Tu es un expert en ingénierie pédagogique créant une activité H5P "Mark the Words".
                                    Tu es un professeur expert en pédagogie qui adaptera le ton et le vocabulaire en fonction du contenu des programmes actuels et du niveau des élèves pour le cours de ${matiere}.

                                    **Contexte :**
                                    - **Matière :** ${matiere}
                                    - **Niveau :** ${niveau}
                                    - **Thème :** ${theme}
                                    - **Nombre de questions :** 6

                                    **Ta mission :**
                                    Génère un objet JSON contenant un titre et une liste de **6 questions** pour un jeu de type "Qui veut gagner des millions".

                                    **Règles importantes :**
                                    1.  Le \`title\` doit être un titre pertinent et engageant pour l'activité.
                                    2.  La difficulté des questions dans le tableau \`questions\` doit être **croissante et pédagogique**, adaptée au niveau des élèves. La première question doit être très facile, la dernière très difficile.
                                    3.  Le contenu doit être rigoureusement exact et pertinent par rapport au thème et au niveau scolaire.

                                    **Structure du JSON attendu :**
                                    Un objet principal avec deux clés :
                                    - \`title\`: Le titre de l'activité (chaîne de caractères).
                                    - \`questions\`: Un tableau de 6 objets, où chaque objet représente une question et contient :
                                        - \`question\`: La question (chaîne de caractères).
                                        - \`goodanswer\`: La bonne réponse (chaîne de caractères).
                                        - \`badanswer\`: Un tableau de 3 mauvaises réponses (chaînes de caractères).

                                    **Exemple de JSON :**
                                    \`\`\`json
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
                                    \`\`\`

                                    Génère uniquement l'objet JSON valide, sans aucun autre commentaire.`;

        return {
            timelineResultat: timelinePrompt,
            crosswordResultat: crosswordPrompt,
            essayResultat: essayPrompt,
            moodleXmlResultat: moodleXmlPrompt,
            giftResultat: giftPrompt,
            flashcardsResultat: flashcardsPrompt,
            quizSetResultat: quizSetPrompt,
            glossaryResultat: glossaryPrompt,
            summaryResultat: summaryPrompt,
            dragWordResultat: dragWordPrompt,
            blanksResultat: blanksPrompt,
            markWordsResultat: markWordsPrompt,
            millionnaireResultat: millionnairePrompt
        };
    }

// =======================================================================
// 10. CRÉATION MBZ ET ACTIVITÉ MILLIONNAIRE
// =======================================================================

    async function createMbz(files) {
    const tar = new Tar();
    const mtime = Math.floor(Date.now() / 1000);
    const encoder = new TextEncoder();

    // 1. Déduire la liste des répertoires à partir des chemins de fichiers
    const allPaths = Object.keys(files);
    const dirSet = new Set();
    for (const path of allPaths) {
        const parts = path.split('/');
        for (let i = 1; i < parts.length; i++) {
            const dir = parts.slice(0, i).join('/') + '/';
            dirSet.add(dir);
        }
    }
    const dirList = Array.from(dirSet).sort();
    const fileList = allPaths.sort();
    // 2. Générer le contenu de l'index
    let archiveIndexContent = `Moodle archive file index. Count: ${dirList.length + fileList.length}\n`;
    for (const dir of dirList) {
        archiveIndexContent += `${dir}\td\t0\t${mtime}\n`;
    }
    for (const path of fileList) {
        const content = files[path];
        const buffer = encoder.encode(content);
        archiveIndexContent += `${path}\tf\t${buffer.length}\t${mtime}\n`;
    }
    files['.ARCHIVE_INDEX'] = archiveIndexContent;
    // 3. Ajouter tous les fichiers à l'archive TAR (en UTF-8)
    const sortedPaths = Object.keys(files).sort();
    for (const path of sortedPaths) {
        const content = files[path];
        const buffer = encoder.encode(content);
        tar.append(path, buffer);
    }
    // 4. Obtenir l'archive TAR sous forme de Uint8Array
    const tarball = tar.out;
    // 5. Compresser en GZIP avec fflate
    return new Promise((resolve, reject) => {
        fflate.gzip(tarball, {
            level: 9,
            mtime: mtime
        }, (err, data) => {
            if (err) {
                console.error("Erreur de compression GZIP:", err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
    }

   async function handleMillionnaireCreation(jsonInput) {
       try {
           if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
               throw new Error("Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées. Veuillez vérifier votre connexion internet ou rafraîchir la page.");
           }
           const jsonData = JSON.parse(jsonInput);
           if (!jsonData.title || !Array.isArray(jsonData.questions) || jsonData.questions.length !== 6 || jsonData.questions.some(q => !q.question || !q.goodanswer || !Array.isArray(q.badanswer) || q.badanswer.length !== 3)) {
               throw new Error("La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' de 6 questions conformes à l'exemple.");
           }
           const activityTitle = jsonData.title;
           const questions = jsonData.questions;
           const courseFullname = activityTitle;
           const data = {
               'ACTIVITY_TITLE': escapeXml(activityTitle),
               'ACTIVITY_INTRO_HTML': '<p>Participez à ce jeu pour tester vos connaissances.</p>',
               'QUESTIONS_JSON': JSON.stringify(questions),
               'COURSE_FULLNAME': escapeXml(courseFullname),
               'COURSE_CONTEXTID': '110712'
           };
           const basePath = 'elea/millionnairev2/modele_base';
           let files = await fetchAllFilesRecursively(basePath);
           for (const path in files) {
               let content = files[path];
               for (const key in data) {
                   const regex = new RegExp(`{{${key}}}`, 'g');
                   content = content.replace(regex, data[key]);
               }
               files[path] = content;
           }
           // Ajout automatique du fichier moodle_backup.log minimal
           files['moodle_backup.log'] = 'Backup created automatically by my-tool\n';
           const gzData = await createMbz(files);
           const fileName = `${activityTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mbz`;
           const a = document.createElement('a');
           a.href = URL.createObjectURL(new Blob([gzData], { type: 'application/gzip' }));
           a.download = fileName;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           URL.revokeObjectURL(a.href);
           showNotification(`Fichier ${fileName} généré avec succès !`);
       } catch (error) {
           console.error("Erreur lors de la création du fichier MBZ:", error);
           showNotification(`Erreur : ${error.message}`, 'error');
       }
   }

   async function fetchAllFilesRecursively(basePath, relativePath = '') {
       const fullPath = basePath + (relativePath ? '/' + relativePath : '');
       let files = {};
       const structure = [
           'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml',
           'course/course.xml', 'course/enrolments.xml', 'course/completiondefaults.xml', 'course/inforef.xml', 'course/roles.xml',
           'activities/millionnairev2_59967/millionnairev2.xml', 'activities/millionnairev2_59967/grades.xml', 'activities/millionnairev2_59967/module.xml', 'activities/millionnairev2_59967/inforef.xml', 'activities/millionnairev2_59967/roles.xml', 'activities/millionnairev2_59967/grade_history.xml',
           'sections/section_11207/inforef.xml', 'sections/section_11207/section.xml'
       ];
       for (const path of structure) {
           const response = await fetch(`${basePath}/${path}`);
           if (response.ok) {
               files[path] = await response.text();
           } else {
               console.warn(`Fichier manquant : ${basePath}/${path}`);
           }
       }
       return files;
   }

// =======================================================================
// 11. CRÉATION H5P (GLOBALE ET QUIZSET SIMPLE)
// =======================================================================

    (async () => {
      try {
        const mod = await import('./client-zip/index.js');
        downloadZip = mod.downloadZip;
      } catch(e) {
        console.error("Failed to load client-zip", e);
        showNotification('Erreur de chargement du module de compression. La génération de fichiers risque d\'échouer.', 'error');
      }
    })();

    async function createH5PFile(mainLibraryIdentifier, jsonContent, options = {}, dynamicDependencies = []) {
        try {
            // --- Nouvelle logique client-zip ---
            const files = [];
            const moduleName = mainLibraryIdentifier.split('.')[1];
            let allDependencies = new Map();

            // Collecte des fichiers de bibliothèques (récursif)
            async function addLibraryFiles(machineName, processedLibs) {
                if (processedLibs.has(machineName)) return;
                const libPath = await findLatestLibraryPath(machineName);
                if (!libPath) {
                    console.warn(`Bibliothèque locale '${machineName}' non trouvée.`);
                    return;
                }
                const response = await fetch(`${libPath}/library.json`);
                if (!response.ok) {
                    console.warn(`Fichier '${libPath}/library.json' introuvable.`);
                    return;
                }
                const libraryInfo = await response.json();
                const libFolderName = libPath.split('/').pop();
                // Ajout du library.json
                files.push({
                  name: `${libFolderName}/library.json`,
                  input: new TextEncoder().encode(JSON.stringify(libraryInfo, null, 2)),
                  unixPermissions: 0o100644
                });
                // Ajout des fichiers JS/CSS
                const filesToAdd = (libraryInfo.preloadedJs || []).concat(libraryInfo.preloadedCss || []);
                for (const file of filesToAdd) {
                  const sourcePath = `${libPath}/${file.path}`;
                  const destinationPath = `${libFolderName}/${file.path}`;
                  const fileResponse = await fetch(sourcePath);
                  if (fileResponse.ok) {
                    const blob = await fileResponse.blob();
                    files.push({
                      name: destinationPath,
                      input: new Uint8Array(await blob.arrayBuffer()),
                      unixPermissions: 0o100644
                    });
                  }
                }
                // Ajout des fichiers optionnels, sauf pour TimelineJS qui a une structure différente
                const libsToSkipOptionalFiles = [
                    'FontAwesome',
                    'H5P.JoubelUI',
                    'H5P.Transition',
                    'H5P.FontIcons',
                    'H5PEditor.VerticalTabs',
                    'TimelineJS', // TimelineJS a une structure différente et est déjà géré
                    'H5P.Question',
                    'H5PEditor.ShowWhen',
                    'H5P.MaterialDesignIcons',
                    'H5PEditor.RangeList',
                    'H5PEditor.TableList',
                    'H5PEditor.ColorSelector',
                    'H5P.Image'
                ];

                if (!libsToSkipOptionalFiles.includes(machineName)) {
                    for (const opt of ['semantics.json', 'icon.svg']) {
                        const optResp = await fetch(`${libPath}/${opt}`);
                        if (optResp.ok) {
                            const blob = await optResp.blob();
                            files.push({
                                name: `${libFolderName}/${opt}`,
                                input: new Uint8Array(await blob.arrayBuffer()),
                                unixPermissions: 0o100644
                            });
                        }
                    }
                    // Ajout du fichier de langue français
                    const langPath = `${libPath}/language/fr.json`;
                    const langResponse = await fetch(langPath);
                    if (langResponse.ok) {
                        const blob = await langResponse.blob();
                        files.push({
                            name: `${libFolderName}/language/fr.json`,
                            input: new Uint8Array(await blob.arrayBuffer()),
                            unixPermissions: 0o100644
                        });
                    }
                }
                // Ajout des polices si besoin
                const fontFilesToCopy = {
                  'FontAwesome': [
                    'fontawesome-webfont.eot',
                    'fontawesome-webfont.svg',
                    'fontawesome-webfont.ttf',
                    'fontawesome-webfont.woff',
                    'fontawesome-webfont.woff2',
                    'FontAwesome.otf'
                  ],
                  'H5P.FontIcons': [
                    'fonts/h5p.eot',
                    'fonts/h5p.svg',
                    'fonts/h5p.ttf',
                    'fonts/h5p.woff'
                  ],
                  'H5P.JoubelUI': [
                    'fonts/joubel.eot',
                    'fonts/joubel.svg',
                    'fonts/joubel.ttf',
                    'fonts/joubel.woff'
                  ]
                };
                if (fontFilesToCopy[machineName]) {
                  for (const fontFile of fontFilesToCopy[machineName]) {
                    const sourcePath = `${libPath}/${fontFile}`;
                    const destinationPath = `${libFolderName}/${fontFile}`;
                    const fileResponse = await fetch(sourcePath);
                    if (fileResponse.ok) {
                      const blob = await fileResponse.blob();
                      files.push({
                        name: destinationPath,
                        input: new Uint8Array(await blob.arrayBuffer()),
                        unixPermissions: 0o100644
                      });
                    }
                  }
                }
                // Ajout des dépendances récursives
                const allDeps = (libraryInfo.preloadedDependencies || []).concat(libraryInfo.editorDependencies || []);
                for (const dep of allDeps) {
                  await addLibraryFiles(dep.machineName, processedLibs);
                }
                processedLibs.set(machineName, {
                  machineName: libraryInfo.machineName,
                  majorVersion: String(libraryInfo.majorVersion),
                  minorVersion: String(libraryInfo.minorVersion)
                });
            }

            // Ajout de la bibliothèque principale
            await addLibraryFiles(mainLibraryIdentifier, allDependencies);
            // Ajout des dépendances dynamiques (ex: QuizSet)
            for (const dep of dynamicDependencies) {
              await addLibraryFiles(dep, allDependencies);
            }

            // Ajout du content.json
            let finalJsonContent = JSON.parse(jsonContent);
            if (options.description) {
                finalJsonContent.description = options.description;
            }
            files.push({
              name: "content/content.json",
              input: new TextEncoder().encode(JSON.stringify(finalJsonContent, null, 2)),
              unixPermissions: 0o100644
            });

            // Génération du manifeste h5p.json
            const title = options.title || finalJsonContent.title || `${moduleName} Activity`;
            const h5pJson = {
                title: title,
                mainLibrary: mainLibraryIdentifier,
                embedTypes: [mainLibraryIdentifier === 'H5P.Timeline' ? 'iframe' : 'div'],
                preloadedDependencies: Array.from(allDependencies.values()),
                language: "fr",
                license: "U",
                defaultLanguage: "fr"
            };
            files.push({
              name: "h5p.json",
              input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2)),
              unixPermissions: 0o100644
            });

            // Téléchargement du ZIP H5P
            if (!downloadZip) {
                showNotification('Le module de compression n\'est pas prêt. Réessayez dans un instant.', 'error');
                return;
            }
            const zipBlob = await downloadZip(files).blob();
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            const fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            a.download = `${fileName}.h5p`;
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);

            console.log(`Fichier ${a.download} généré avec succès.`);
            showNotification(`Fichier ${a.download} généré avec succès.`);
            return { success: true, message: `Fichier ${a.download} créé.` };
        } catch (error) {
            console.error("Erreur lors de la création du H5P:", error);
            showNotification(`Échec de la création du fichier H5P : ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async function findLatestLibraryPath(machineName) {
        const knownLibraries = {
            'H5P.QuestionSet': 'h5p-libs/H5P.QuestionSet-1.20',
            'H5P.MultiChoice': 'h5p-libs/H5P.MultiChoice-1.16',
            'H5P.DragText': 'h5p-libs/H5P.DragText-1.10',
            'H5P.Blanks': 'h5p-libs/H5P.Blanks-1.14',
            'H5P.JoubelUI': 'h5p-libs/H5P.JoubelUI-1.3',
            'H5P.FontIcons': 'h5p-libs/H5P.FontIcons-1.0',
            'H5P.Transition': 'h5p-libs/H5P.Transition-1.0',
            'H5P.Question': 'h5p-libs/H5P.Question-1.4',
            'H5P.TextUtilities': 'h5p-libs/H5P.TextUtilities-1.3',
            'jQuery.ui': 'h5p-libs/jQuery.ui-1.10',
            'FontAwesome': 'h5p-libs/FontAwesome-4.5',
            'H5P.Timeline': 'h5p-libs/H5P.Timeline-1.1',
            'H5P.Flashcards': 'h5p-libs/H5P.Flashcards-1.6',
            'H5P.Accordion': 'h5p-libs/H5P.Accordion-1.0',
            'H5P.AdvancedText': 'h5p-libs/H5P.AdvancedText-1.1',
            'H5P.Crossword': 'h5p-libs/H5P.Crossword-0.5',
            'H5P.Essay': 'h5p-libs/H5P.Essay-1.5',
            'H5P.Video': 'h5p-libs/H5P.Video-1.6',
            'H5P.Image': 'h5p-libs/H5P.Image-1.1',
            'H5P.MaterialDesignIcons': 'h5p-libs/H5P.MaterialDesignIcons-1.0',
            'H5P.Summary': 'h5p-libs/H5P.Summary-1.10',
            'H5P.MarkTheWords': 'h5p-libs/H5P.MarkTheWords-1.11',
            'H5P.DragQuestion': 'h5p-libs/H5P.DragQuestion-1.14',
            'H5PEditor.VerticalTabs': 'h5p-libs/H5PEditor.VerticalTabs-1.3',
            'H5PEditor.ColorSelector': 'h5p-libs/H5PEditor.ColorSelector-1.2',
            'H5PEditor.Wizard': 'h5p-libs/H5PEditor.Wizard-1.2',
            'H5PEditor.RangeList': 'h5p-libs/H5PEditor.RangeList-1.0',
            'H5PEditor.ShowWhen': 'h5p-libs/H5PEditor.ShowWhen-1.0',
            'H5PEditor.TableList': 'h5p-libs/H5PEditor.TableList-1.0',
            'H5PEditor.SummaryTextualEditor': 'h5p-libs/H5PEditor.SummaryTextualEditor-1.1',
            'TimelineJS': 'h5p-libs/TimelineJS-1.1'
        };
        const path = knownLibraries[machineName];
        if (path) {
            const response = await fetch(`${path}/library.json`);
            if (response.ok) {
                return path;
            }
        }
        return null;
    }

// =======================================================================
// 12. FONCTION D'ÉCHAPPEMENT XML (garde les caractères spéciaux)
// =======================================================================
    function escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/[^\x20-\x7E]/g, function(ch) {
                return '&#' + ch.charCodeAt(0) + ';';
            });
    }

// =======================================================================
// 13. CRÉATION D’UN QUIZSET SIMPLE
// =======================================================================

    async function createSimpleQuizSetH5P(title, contentJson) {
    try {
        if (!downloadZip) {
            showNotification('Le module de compression n\'est pas prêt. Réessayez dans un instant.', 'error');
            return;
        }

        // 1. Créer le fichier h5p.json
        const h5pJson = {
            title: title,
            language: "fr", // Langue par défaut
            mainLibrary: "H5P.QuestionSet",
            embedTypes: ["iframe"],
            license: "U",
            preloadedDependencies: [{
                machineName: "H5P.QuestionSet",
                majorVersion: "1",
                minorVersion: "20"
            }]
        };

        // 2. Préparer les fichiers pour le zip
        const files = [
            {
                name: "h5p.json",
                input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2))
            },
            {
                name: "content/content.json",
                input: new TextEncoder().encode(JSON.stringify(contentJson, null, 2))
            }
        ];

        // 3. Créer et télécharger le fichier .h5p
        const zipBlob = await downloadZip(files).blob();
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        const fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        a.download = `${fileName}.h5p`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification(`Fichier ${a.download} généré avec succès !`);

    } catch (error) {
        console.error("Erreur lors de la création du H5P simple pour QuizSet:", error);
        showNotification(`Échec de la création du fichier H5P : ${error.message}`, 'error');
    }
    }

// =======================================================================
// 14. CRÉATION D’UN ESSAY SIMPLE
// =======================================================================

    async function createSimpleEssayH5P(title, userInputJson) {
        try {
            if (!downloadZip) {
                showNotification('Le module de compression n\'est pas prêt. Réessayez dans un instant.', 'error');
                return;
            }

            // 1. Construire le content.json en fusionnant le modèle et l'entrée utilisateur
            const contentTemplate = {
                "solution": {
                    "introduction": "<div>Voici un exemple de solution. La vôtre peut être différente.</div>\n",
                    "sample": ""
                },
                "keywords": [],
                "overallFeedback": [
                    { "from": 0, "to": 49, "feedback": "Peut mieux faire. Relisez la consigne." },
                    { "from": 50, "to": 79, "feedback": "Bon travail ! Vous avez compris l'essentiel." },
                    { "from": 80, "to": 100, "feedback": "Excellent ! Vous maîtrisez le sujet." }
                ],
                "behaviour": {
                    "inputFieldSize": "10",
                    "enableRetry": true,
                    "ignoreScoring": false,
                    "minimumLength": 10,
                    "maximumLength": 500,
                    "percentagePassing": 50,
                    "percentageMastering": 80,
                    "pointsHost": 1
                },
                "checkAnswer": "Vérifier",
                "tryAgain": "Recommencer",
                "showSolution": "Voir la solution",
                "feedbackHeader": "Feedback",
                "solutionTitle": "Exemple de solution",
                "remainingChars": "Caractères restants : @chars",
                "notEnoughChars": "Vous devez entrer au moins @chars caractères !",
                "messageSave": "Enregistré",
                "taskDescription": "",
                "placeholderText": "Commencez à écrire ici...",
                "media": {},
                "ariaYourResult": "Vous avez obtenu @score sur @total points",
                "ariaNavigatedToSolution": "Navigation vers la solution après la zone de texte.",
                 "submitAnswer":"Submit",
                 "ariaCheck":"Check the answers.",
                 "ariaShowSolution":"Show the solution. You will be provided with a sample solution.",
                 "ariaRetry":"Retry the task. You can improve your previous answer if the author allowed that."
            };

            // Validation des mots-clés
            if (userInputJson.keywords && userInputJson.keywords.some(k => k.keyword.includes(' '))) {
                throw new Error("Les mots-clés ne doivent pas contenir d'espaces. Veuillez utiliser des mots uniques.");
            }

            contentTemplate.taskDescription = userInputJson.taskDescription;
            
            // Enrichir les mots-clés avec des options par défaut si elles sont manquantes
            contentTemplate.keywords = userInputJson.keywords.map(kw => {
                const defaultOptions = {
                    points: 1,
                    caseSensitive: false,
                    forgiveMistakes: false
                };
                // Fusionne les options de l'utilisateur avec les options par défaut
                const finalOptions = { ...defaultOptions, ...(kw.options || {}) };
                return { ...kw, options: finalOptions };
            });

            // Optionnel : permettre à l'utilisateur de surcharger d'autres paramètres
            if (userInputJson.behaviour) {
                contentTemplate.behaviour = { ...contentTemplate.behaviour, ...userInputJson.behaviour };
            }
            if (userInputJson.solution) {
                contentTemplate.solution = { ...contentTemplate.solution, ...userInputJson.solution };
            }
            if (userInputJson.sampleSolution) {
                contentTemplate.solution.sample = `<div>${userInputJson.sampleSolution}</div>\n`;
            }


            // 2. Créer le fichier h5p.json
            const h5pJson = {
                title: title,
                language: "fr",
                mainLibrary: "H5P.Essay",
                embedTypes: ["iframe"],
                license: "U",
                preloadedDependencies: [{
                    machineName: "H5P.Essay",
                    majorVersion: "1",
                    minorVersion: "5"
                }]
            };

            // 3. Préparer les fichiers pour le zip
            const files = [
                {
                    name: "h5p.json",
                    input: new TextEncoder().encode(JSON.stringify(h5pJson, null, 2))
                },
                {
                    name: "content/content.json",
                    input: new TextEncoder().encode(JSON.stringify(contentTemplate, null, 2))
                }
            ];

            // 4. Créer et télécharger le fichier .h5p
            const zipBlob = await downloadZip(files).blob();
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            const fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            a.download = `${fileName}.h5p`;
            a.href = url;
            document.body.appendChild(a);
a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification(`Fichier ${a.download} généré avec succès !`);

        } catch (error) {
            console.error("Erreur lors de la création du H5P simple pour Essay:", error);
            showNotification(`Échec de la création du fichier H5P : ${error.message}`, 'error');
        }
    }
});
