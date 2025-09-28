// =======================================================================
// 1. GESTION DES MODULES ET DÉCLARATIONS DE BASE
// =======================================================================

document.addEventListener('DOMContentLoaded', function() {
    // =======================================================================
    // 0. GESTION DE LA TRADUCTION
    // =======================================================================
    const languageSwitcher = document.querySelector('.language-switcher');
    const languageDropdown = document.querySelector('.language-dropdown');
    let currentLang = 'fr'; // Langue par défaut
    let translations = {}; // Objet pour stocker les traductions chargées dynamiquement

   const languageConfig = {
       'fr': { name: 'Français', code: 'fr' },
       'de': { name: 'Deutsch', code: 'de' },
       'en': { name: 'English', code: 'gb' },
       'ar': { name: 'عربي', code: 'sa' },
       'zh': { name: '中文', code: 'cn' },
       'es': { name: 'Español', code: 'es' },
       'el': { name: 'ελληνικά', code: 'gr' },
       'it': { name: 'Italiano', code: 'it' },
       'jp': { name: '日本語', code: 'jp' },
       'nl': { name: 'Nederlands', code: 'nl' },
       'pt': { name: 'Português', code: 'pt' }
   };

    // Fonction pour charger dynamiquement le fichier de traduction
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`js/translations/${lang}.js`);
            const scriptText = await response.text();
            // Exécuter le script pour définir la variable translations_XX
            eval(scriptText + `\nwindow.translations_${lang} = translations_${lang};`);
            translations = window[`translations_${lang}`]; // Assigner à l'objet global translations
            currentLang = lang;
            console.log('Translations loaded:', translations); // Ajout d'un log pour le débogage
            translatePage();
            // Mettre à jour l'attribut lang de la balise html
            document.documentElement.lang = lang;
           updateLanguageSelector(); // Mettre à jour l'affichage
        } catch (error) {
            console.error(`Erreur lors du chargement des traductions pour ${lang}:`, error);
        }
    }

   function updateLanguageSelector() {
       // Mettre à jour les drapeaux et la classe active dans la liste déroulante
       document.querySelectorAll('.language-dropdown a').forEach(link => {
           const lang = link.getAttribute('data-lang');
           const flagIcon = link.querySelector('.flag-icon');
   
           if (flagIcon && languageConfig[lang]) {
               // Appliquer les classes de la bibliothèque de drapeaux
               flagIcon.className = `flag-icon flag-icon-${languageConfig[lang].code}`;
           }
   
           if (lang === currentLang) {
               link.classList.add('active');
           } else {
               link.classList.remove('active');
           }
       });
   }

    function translatePage() {
        document.querySelectorAll('[data-key], [data-translate]').forEach(element => {
            const key = element.getAttribute('data-key') || element.getAttribute('data-translate');
            const translation = translations[key]; // Utiliser l'objet translations directement
            if (translation) {
                if (element.placeholder) {
                    element.placeholder = translation;
                } else {
                    element.innerHTML = translation;
                }
            }
        });
    }

    const languageBtn = document.querySelector('.language-btn');

    languageBtn.addEventListener('click', (e) => {
        languageSwitcher.classList.toggle('open');
        e.stopPropagation();
    });

    languageDropdown.addEventListener('click', async (e) => {
        if (e.target.tagName === 'A') {
            const lang = e.target.getAttribute('data-lang');
            await loadTranslations(lang); // Charger les traductions avant de traduire la page
            languageSwitcher.classList.remove('open');
            e.preventDefault();
            // Après le chargement et la traduction, régénérer les tuiles pour mettre à jour les noms
            generateH5PTiles();
            generateMoodleTiles();
            // Si un contenu est ouvert, le rafraîchir
            if (activeContentContainer && activeTile) {
                const moduleKey = activeTile.dataset.module;
                if (h5pModules[moduleKey]) {
                    toggleInlineContent(moduleKey, activeTile);
                } else if (moodleModules[moduleKey]) {
                    toggleMoodleContent(moduleKey, activeTile);
                }
            }
        }
    });

    // Fermer le menu déroulant si on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!languageSwitcher.contains(e.target)) {
            languageSwitcher.classList.remove('open');
        }
    });

    // Initial translation is now handled after setupEventListeners

    // --- Définition des modules H5P ---
    const h5pModules = {
        Timeline: {
            name: "h5p_timeline_name",
            englishName: "Timeline",
            machineName: "H5P.Timeline",
            description: "h5p_timeline_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/timeline_icon-color.png",
            promptId: "timelineResultat",
            jsonInputId: "timelineJsonInput",
            createBtnId: "createTimelineH5P"
        },
        Flashcards: {
            name: "h5p_flashcards_name",
            englishName: "Flashcards",
            machineName: "H5P.Flashcards",
            description: "h5p_flashcards_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/flashcards-png-icon.png",
            promptId: "flashcardsResultat",
            jsonInputId: "flashcardsJsonInput",
            createBtnId: "createFlashcardsH5P"
        },
        QuizSet: {
            name: "h5p_quiz_set_name",
            englishName: "Quiz (Question Set)",
            machineName: "H5P.QuestionSet",
            description: "h5p_quiz_set_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/question-set-icon.png",
            promptId: "quizSetResultat",
            jsonInputId: "quizSetJsonInput",
            createBtnId: "createQuizSetH5P"
        },
        Glossary: {
            name: "h5p_glossary_name",
            englishName: "Accordion",
            machineName: "H5P.Accordion",
            description: "h5p_glossary_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/accordion-icon.png",
            promptId: "glossaryResultat",
            jsonInputId: "glossaryJsonInput",
            createBtnId: "createGlossaryH5P"
        },
        Crossword: {
            name: "h5p_crossword_name",
            englishName: "Crosswords",
            description: "h5p_crossword_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/crosswords.png",
            promptId: "crosswordResultat",
            jsonInputId: "crosswordJsonInput",
            createBtnId: "createCrosswordH5P"
        },
        Essay: {
            name: "h5p_essay_name",
            englishName: "Essay",
            description: "h5p_essay_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/essay.png",
            promptId: "essayResultat",
            jsonInputId: "essayJsonInput",
            createBtnId: "createEssayH5P"
        },
        Summary: {
            name: "h5p_summary_name",
            englishName: "Summary",
            description: "h5p_summary_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/summary_icon.png",
            promptId: "summaryResultat",
            jsonInputId: "summaryJsonInput",
            createBtnId: "createSummaryH5P"
        },
        DragTheWords: {
            name: "h5p_drag_the_words_name",
            englishName: "Drag the Words",
            machineName: "H5P.DragText",
            description: "h5p_drag_the_words_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/drag-the-words-icon.png",
            promptId: "dragWordResultat",
            jsonInputId: "dragWordJsonInput",
            createBtnId: "createDragWordH5P"
        },
        FillInTheBlanks: {
            name: "h5p_fill_in_the_blanks_name",
            englishName: "Fill in the Blanks",
            machineName: "H5P.Blanks",
            description: "h5p_fill_in_the_blanks_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/fill-in-the-blanks-icon_0.png",
            promptId: "blanksResultat",
            jsonInputId: "blanksJsonInput",
            createBtnId: "createBlanksH5P"
        },
        MarkTheWords: {
            name: "h5p_mark_the_words_name",
            englishName: "Mark the Words",
            machineName: "H5P.MarkTheWords",
            description: "h5p_mark_the_words_description",
            image: "https://h5p.org/sites/default/files/styles/small-logo/public/logos/mark-the-words-icon_0.png",
            promptId: "markWordsResultat",
            jsonInputId: "markWordsJsonInput",
            createBtnId: "createMarkWordsH5P"
        }
    };
    
    // --- Définition des modules Éléa ---
   const moodleModules = {
       moodleXml: {
           name: "moodle_xml_name",
           description: "moodle_xml_description",
           image: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Extensible_Markup_Language_%28XML%29_logo.svg"
       },
       gift: {
           name: "moodle_gift_name",
           description: "moodle_gift_description",
           image: "https://moodle.org/theme/moodleorg/pix/moodle_logo_TM.svg"
       },
       Millionnaire: {
           name: "moodle_millionnaire_name",
           description: "moodle_millionnaire_description",
           image: "images/millionnaire.png",
           promptId: "millionnaireResultat",
           jsonInputId: "millionnaireJsonInput",
           createBtnId: "createMillionnaireMBZ"
       },
       Appariement: {
           name: "moodle_appariement_name",
           description: "moodle_appariement_description",
           image: "images/appariement.png",
           promptId: "appariementResultat",
           jsonInputId: "appariementJsonInput",
           createBtnId: "createAppariementMBZ"
       },
       QCM: {
           name: "moodle_qcm_name",
           description: "moodle_qcm_description",
           image: "images/qcm.png",
           promptId: "qcmResultat",
           jsonInputId: "qcmJsonInput",
           createBtnId: "createQCM_MBZ"
       }
   };

// =======================================================================
// 2. INITIALISATION DES ÉLÉMENTS INTERFACE ET APPEL DES PREMIERS RENDUS
// =======================================================================
    const h5pGrid = document.querySelector('.h5p-grid');
    const moodleGrid = document.querySelector('.moodle-grid');
    setupTabs();
    setupEventListeners();
    // Initial translation and tile generation
    loadTranslations('fr').then(() => {
        generateH5PTiles();
        generateMoodleTiles();
    });

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
                <img src="${module.image}" alt="${translations[module.name]} icon">
                <div class="tile-text">
                    <span class="tile-name-fr">${translations[module.name]}</span>
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
               <img src="${module.image}" alt="${translations[module.name]} icon">
               <div class="tile-text">
                   <span class="tile-name-fr">${translations[module.name]}</span>
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
                    <h2>${translations[module.name]}</h2>
                    <span class="close-button">&times;</span>
                </div>
                <p class="h5p-content-description">${translations[module.description]}</p>
                
                <div class="h5p-prompt-block">
                    <h3>${translations.prompt_for_ia}</h3>
                    <textarea id="${module.promptId}" readonly placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}"></textarea>
                    <div class="action-buttons">
                        <button id="copy-${moduleKey}" class="copy-btn">${translations.copy_prompt}</button>
                        <button class="action-btn go-duck">${translations.go_duck}</button>
                        <button class="action-btn go-mistral">${translations.go_mistral}</button>
                    </div>
                </div>

                <div class="h5p-processor">
                    <div class="h5p-processor-header">
                        <h3>${translations.create_h5p_file}</h3>
                        <div class="library-toggle">
                            <label for="includeLibs-${moduleKey}">${translations.integrate_h5p_libraries}</label>
                            <input type="checkbox" id="includeLibs-${moduleKey}" name="includeLibs">
                        </div>
                    </div>
                    <p>${translations.paste_ia_result}</p>
                    <textarea id="${module.jsonInputId}" placeholder="${translations.paste_json_or_text || 'Collez ici le contenu généré par l\'IA...'}"></textarea>
                    <button id="${module.createBtnId}" class="download-btn">${translations.generate_h5p}</button>
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
            <h3>${translations.moodle_xml_name}</h3>
               <p>${translations.moodle_xml_description}</p>
                  <div class="h5p-prompt-block">                   
                    <h3>${translations.prompt_for_ia}</h3>
                    <textarea id="moodleXmlResultat" readonly placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}"></textarea>
                    <div class="action-buttons">
                        <button id="copyMoodleXmlLink" class="copy-btn">📋 Copier le prompt</button>
                        <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                        <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
                    </div>
                </div>
                <div class="h5p-processor">
                    <h3>${translations.create_xml_file}</h3>
                    <p>${translations.paste_ia_result_xml}</p>
                    <textarea id="xmlEleaMoodleInput" placeholder="${translations.paste_json_or_text || 'Collez ici le contenu généré par l\'IA...'}"></textarea>
                    <button id="createXmlEleaMoodle" class="download-btn">${translations.generate_xml_file}</button>
                </div>
           `;
       } else if (moduleKey === 'gift') {
           contentHtml = `
               <h3>${translations.moodle_gift_name}</h3>
               <p>${translations.moodle_gift_description}</p>
               <textarea id="giftResultat" readonly placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}"></textarea>
               <div class="action-buttons">
                   <button id="copyGiftLink" class="copy-btn">📋 Copier le prompt</button>
                   <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                   <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
               </div>
           `;
       } else if (moduleKey === 'Millionnaire') {
           contentHtml = `
               <h3>${translations.moodle_millionnaire_name}</h3>
               <p>${translations.moodle_millionnaire_description}</p>
               <div class="h5p-prompt-block">
                   <h3>Prompt pour l'IA</h3>
                   
                   <textarea id="${module.promptId}" readonly placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}"></textarea>
                   <div class="action-buttons">
                       <button id="copy-${moduleKey}" class="copy-btn">📋 Copier le prompt</button>
                       <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                       <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
                   </div>
               </div>
               <div class="h5p-processor">
                   <h3>${translations.create_mbz_file_millionnaire}</h3>
                   <p>${translations.paste_ia_result_millionnaire}</p>
                   <textarea id="${module.jsonInputId}" placeholder="${translations.paste_json_or_text || 'Collez ici le contenu généré par l\'IA...'}"></textarea>
                   <button id="${module.createBtnId}" class="download-btn">${translations.generate_mbz_millionnaire}</button>
               </div>
           `;
       } else if (moduleKey === 'Appariement') {
           contentHtml = `
               <h3>${translations.moodle_appariement_name}</h3>
               <p>${translations.moodle_appariement_description}</p>
               <div class="h5p-prompt-block">
                   <h3>Prompt pour l'IA</h3>
                   
                   <textarea id="${module.promptId}" readonly placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}"></textarea>
                   <div class="action-buttons">
                       <button id="copy-${moduleKey}" class="copy-btn">📋 Copier le prompt</button>
                       <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                       <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
                   </div>
               </div>
               <div class="h5p-processor">
                   <h3>${translations.create_mbz_file_appariement}</h3>
                   <p>${translations.paste_ia_result_appariement}</p>
                   <textarea id="${module.jsonInputId}" placeholder="${translations.paste_json_or_text || 'Collez ici le contenu généré par l\'IA...'}"></textarea>
                   <button id="${module.createBtnId}" class="download-btn">${translations.generate_mbz_appariement}</button>
               </div>
           `;
       } else if (moduleKey === 'QCM') {
           contentHtml = `
               <h3>${translations.moodle_qcm_name}</h3>
               <p>${translations.moodle_qcm_description}</p>
               <div class="h5p-prompt-block">
                   <h3>Prompt pour l'IA</h3>
                   
                   <textarea id="${module.promptId}" readonly placeholder="${translations.generate_prompts_placeholder || 'Générez les prompts pour voir le résultat ici...'}"></textarea>
                   <div class="action-buttons">
                       <button id="copy-${moduleKey}" class="copy-btn">📋 Copier le prompt</button>
                       <button class="action-btn go-duck">🦆 Accéder à Duck.ai</button>
                       <button class="action-btn go-mistral">Ⓜ️ Accéder à Le chat</button>
                   </div>
               </div>
               <div class="h5p-processor">
                   <h3>${translations.create_mbz_file_qcm}</h3>
                   <p>${translations.paste_ia_result_qcm}</p>
                   <textarea id="${module.jsonInputId}" placeholder="${translations.paste_json_or_text || 'Collez ici le contenu généré par l\'IA...'}"></textarea>
                   <button id="${module.createBtnId}" class="download-btn">${translations.generate_mbz_qcm}</button>
               </div>
           `;
       }
 
       contentContainer.innerHTML = `
           <div class="h5p-content-header">
              <h2>${translations[module.name]}</h2>
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
           document.getElementById('createXmlEleaMoodle').addEventListener('click', () => {
               const xmlContent = document.getElementById('xmlEleaMoodleInput').value;
               if (!xmlContent) {
                   showNotification('Veuillez coller le contenu XML généré.', 'error');
                   return;
               }
               downloadFile(xmlContent, 'moodle_backup.xml', 'text/xml');
           });
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
       } else if (moduleKey === 'Appariement') {
           const module = moodleModules[moduleKey];
           setupCopyButton(`copy-${moduleKey}`, module.promptId);
           document.getElementById(module.createBtnId).addEventListener('click', () => {
               const jsonInput = document.getElementById(module.jsonInputId).value;
               if (!jsonInput) {
                   showNotification('Veuillez coller le contenu JSON généré.', 'error');
                   return;
               }
               handleAppariementCreation(jsonInput);
           });
       } else if (moduleKey === 'QCM') {
           const module = moodleModules[moduleKey];
           setupCopyButton(`copy-${moduleKey}`, module.promptId);
           document.getElementById(module.createBtnId).addEventListener('click', () => {
               const jsonInput = document.getElementById(module.jsonInputId).value;
               if (!jsonInput) {
                   showNotification('Veuillez coller le contenu JSON généré.', 'error');
                   return;
               }
               handleQCMCreation(jsonInput);
           });
       }
       const promptIdForCopy = (moduleKey === 'moodleXml') ? 'moodleXmlResultat' :
                                (moduleKey === 'gift') ? 'giftResultat' :
                                (moduleKey === 'Millionnaire') ? moodleModules[moduleKey].promptId :
                                (moduleKey === 'Appariement') ? moodleModules[moduleKey].promptId :
                                (moduleKey === 'QCM') ? moodleModules[moduleKey].promptId : null;

       contentContainer.querySelectorAll('.go-duck').forEach(btn => btn.addEventListener('click', function() {
           if (promptIdForCopy) copyToClipboard(promptIdForCopy, this);
           window.open('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat&duckai=1', '_blank', 'noopener,noreferrer');
       }));
       contentContainer.querySelectorAll('.go-mistral').forEach(btn => btn.addEventListener('click', function() {
           if (promptIdForCopy) copyToClipboard(promptIdForCopy, this);
           window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer');
       }));
       
       // Remplir le prompt si déjà généré
       let promptId;
       if (moduleKey === 'moodleXml') {
           promptId = 'moodleXmlResultat';
       } else if (moduleKey === 'gift') {
           promptId = 'giftResultat';
       } else if (moduleKey === 'Millionnaire') {
           promptId = moodleModules[moduleKey].promptId;
       } else if (moduleKey === 'Appariement') {
           promptId = moodleModules[moduleKey].promptId;
       } else if (moduleKey === 'QCM') {
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
        container.querySelectorAll('.go-duck').forEach(btn => btn.addEventListener('click', function() {
            copyToClipboard(module.promptId, this);
            window.open('https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat&duckai=1', '_blank', 'noopener,noreferrer');
        }));
        container.querySelectorAll('.go-mistral').forEach(btn => btn.addEventListener('click', function() {
            copyToClipboard(module.promptId, this);
            window.open('https://chat.mistral.ai/', '_blank', 'noopener,noreferrer');
        }));

        // Bouton de création H5P
        const createBtn = container.querySelector(`#${module.createBtnId}`);
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const jsonInput = container.querySelector(`#${module.jsonInputId}`).value;
                const includeLibs = container.querySelector(`#includeLibs-${moduleKey}`).checked;
                if (!jsonInput) {
                    showNotification('Veuillez coller le contenu généré par l\'IA.', 'error');
                    return;
                }
                handleH5PCreation(moduleKey, jsonInput, includeLibs);
            });
        }
    }

// =======================================================================
// 6. GÉNÉRATION DES PROMPTS
// =======================================================================


    function generatePrompts() {
        const simpleModeTab = document.querySelector('.mode-tab[data-mode="simple"]');
        let prompts;

        if (simpleModeTab.classList.contains('active')) { // Mode Simple
            const qui = document.getElementById('qui').value.trim();
            const quoi = document.getElementById('quoi').value.trim();

            if (!qui || !quoi) {
                showNotification('Veuillez remplir tous les champs du mode simple.', 'error');
                return;
            }
            prompts = getPrompts(qui, quoi, null, null, null, false);
        } else { // Mode Guidé (Avancé)
            const matiere = document.getElementById('matiere').value.trim();
            const niveau = document.getElementById('niveau').value.trim();
            const theme = document.getElementById('theme').value.trim();
            const nombreQuestions = document.getElementById('nombreQuestions').value.trim();
            const infosComplementaires = document.getElementById('infosComplementaires').value.trim();

            if (!matiere || !niveau || !theme || !nombreQuestions) {
                showNotification('Veuillez remplir tous les champs du mode guidé.', 'error');
                return;
            }
            prompts = getPrompts(matiere, niveau, theme, nombreQuestions, infosComplementaires, true);
        }
        
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

        showNotification(translations.prompts_generated_successfully);
    }

// =======================================================================
// 7. INITIALISATION DES ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX
// =======================================================================
    
    function setupEventListeners() {
        document.getElementById('generateBtn')?.addEventListener('click', generatePrompts);

        const modeTabs = document.querySelectorAll('.mode-tab');
        const simpleMode = document.getElementById('simple-mode');
        const advancedMode = document.getElementById('advanced-mode');

        modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                modeTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                if (tab.dataset.mode === 'simple') {
                    simpleMode.classList.add('active');
                    advancedMode.classList.remove('active');
                } else {
                    simpleMode.classList.remove('active');
                    advancedMode.classList.add('active');
                }
            });
        });

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

        // Gestion de la modale des mentions légales
        const legalMentionsLink = document.getElementById('legal-mentions-link');
        const legalMentionsModal = document.getElementById('legal-mentions-modal');
        const closeModalBtn = document.querySelector('.close-modal-btn');
        const legalMentionsContent = document.getElementById('legal-mentions-content');

        legalMentionsLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('legal/mentions-legales.html');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const html = await response.text();
                legalMentionsContent.innerHTML = html;
                translatePage(); // Appeler la traduction sur le nouveau contenu
                legalMentionsModal.style.display = 'block';
            } catch (error) {
                console.error('Failed to fetch legal mentions:', error);
                showNotification('Impossible de charger les mentions légales.', 'error');
            }
        });

        closeModalBtn.addEventListener('click', () => {
            legalMentionsModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === legalMentionsModal) {
                legalMentionsModal.style.display = 'none';
            }
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

   function downloadFile(content, fileName, contentType) {
       const a = document.createElement('a');
       const file = new Blob([content], { type: contentType });
       a.href = URL.createObjectURL(file);
       a.download = fileName;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
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

    function handleH5PCreation(moduleKey, jsonInput, includeLibs = false) {
        const module = h5pModules[moduleKey];
        if (!module) {
            showNotification(`Module '${moduleKey}' non trouvé.`, 'error');
            return;
        }

        // --- NOUVELLE LOGIQUE POUR QUIZSET ---
        if (moduleKey === 'QuizSet') {
            try {
                const contentJson = JSON.parse(jsonInput);
                // Le titre est maintenant dans le champ de saisie, ou on utilise un titre par défaut.
                const title = document.getElementById('theme').value.trim() || translations[module.name];
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
           const jsonObj = JSON.parse(jsonInput);
           let content = jsonObj;
           let options = { title: jsonObj.title || translations[module.name] };

            // Adaptations spécifiques par module
            if (moduleKey === 'Timeline') {
               // Si la structure "timeline" n'existe pas, on l'enveloppe
               const timelineData = jsonObj.timeline ? jsonObj : { timeline: jsonObj };

               // Ajout des champs manquants avec des valeurs par défaut
               timelineData.timeline.defaultZoomLevel = timelineData.timeline.defaultZoomLevel || "0";
               const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;
               timelineData.timeline.language = timelineData.timeline.language || h5pLang;
               timelineData.timeline.height = timelineData.timeline.height || 600;
               
               content = timelineData;
            } else if (moduleKey === 'Flashcards') {
                const h5pLang = currentLang === 'zh' ? 'zh-cn' : currentLang;
                const defaultFlashcardsContent = {
                    title: jsonObj.title || translations.h5p_flashcards_name,
                    description: jsonObj.description || translations.h5p_flashcards_description,
                    cards: jsonObj.cards ? jsonObj.cards.map(card => ({ text: card.text, answer: card.answer, tip: card.tip || "" })) : [],
                    progressText: translations.flashcards_progress_text || "Card @card of @total",
                    next: translations.flashcards_next || "Next",
                    previous: translations.flashcards_previous || "Previous",
                    checkAnswerText: translations.flashcards_check_answer || "Check",
                    showSolutionsRequiresInput: true,
                    defaultAnswerText: translations.flashcards_your_answer || "Your answer",
                    correctAnswerText: translations.flashcards_correct_answer || "Correct",
                    incorrectAnswerText: translations.flashcards_incorrect_answer || "Incorrect",
                    showSolutionText: translations.flashcards_show_solution || "Correct answer",
                    results: translations.flashcards_results || "Results",
                    ofCorrect: translations.flashcards_of_correct || "@score of @total correct",
                    showResults: translations.flashcards_show_results || "Show results",
                    answerShortText: translations.flashcards_answer_short || "A:",
                    retry: translations.flashcards_retry || "Retry",
                    caseSensitive: false,
                    cardAnnouncement: translations.flashcards_card_announcement || "Incorrect answer. Correct answer was @answer",
                    correctAnswerAnnouncement: translations.flashcards_correct_announcement || "@answer is correct.",
                    pageAnnouncement: translations.flashcards_page_announcement || "Page @current of @total",
                    randomCards: false,
                    language: h5pLang
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
                content = {
                    taskDescription: jsonObj.taskDescription,
                    textField: jsonObj.textField,
                    behaviour: {
                        enableRetry: true,
                        enableSolutionsButton: true,
                        enableCheckButton: true,
                        showScorePoints: true
                    },
                    overallFeedback: []
                };
            } else if (moduleKey === 'Glossary') {
                // Détecter si c'est le nouveau format simplifié (un tableau) ou l'ancien (un objet avec "panels")
                const panelsData = Array.isArray(jsonObj) ? jsonObj : jsonObj.panels;

                const transformedPanels = panelsData.map(item => {
                    // Si l'item a déjà la structure complète, on ne fait que générer l'UUID
                    if (item.content && item.content.params) {
                        item.content.subContentId = generateUUID();
                        return item;
                    }
                    // Sinon, on transforme la structure simple en structure complète
                    return {
                        title: item.title,
                        content: {
                            params: {
                                text: item.text
                            },
                            library: "H5P.AdvancedText 1.1",
                            subContentId: generateUUID(),
                            metadata: {
                                contentType: "Text",
                                license: "U",
                                title: item.title // On utilise le titre du panneau comme titre de métadonnée
                            }
                        }
                    };
                });

                content = {
                    panels: transformedPanels,
                    hTag: "h2"
                };
            } else if (moduleKey === 'Crossword') {
                content = {
                    ...jsonObj, // Conserve title, words, taskDescription, and overallFeedback
                    behaviour: {
                        enableInstantFeedback: false,
                        scoreWords: true,
                        applyPenalties: false,
                        enableRetry: true,
                        enableSolutionsButton: true
                    },
                    l10n: {
                        across: translations.crossword_across || "Across",
                        down: translations.crossword_down || "Down",
                        checkAnswer: translations.crossword_check_answer || "Check",
                        tryAgain: translations.crossword_try_again || "Retry",
                        showSolution: translations.crossword_show_solution || "Show solution",
                        extraClue: translations.crossword_extra_clue || "Extra clue",
                        closeWindow: translations.crossword_close_window || "Close window",
                        submitAnswer: translations.crossword_submit_answer || "Submit"
                    },
                    // Traiter les extraClues pour ajouter les métadonnées nécessaires
                    words: jsonObj.words.map(word => {
                        if (word.extraClue && word.extraClue.params) {
                            return {
                                ...word,
                                extraClue: {
                                    ...word.extraClue,
                                    library: "H5P.AdvancedText 1.1",
                                    subContentId: generateUUID(),
                                    metadata: {
                                        contentType: "Text",
                                        license: "U",
                                        title: "Extra clue"
                                    }
                                }
                            };
                        }
                        return word;
                    })
                };
            } else if (moduleKey === 'Essay') {
                content = {
                    ...jsonObj, // Conserve taskDescription et keywords
                    behaviour: {
                        inputFieldSize: "10",
                        enableRetry: true,
                        ignoreScoring: false,
                        minimumLength: 100,
                        maximumLength: 0, // 0 = illimité
                        percentagePassing: 50,
                        percentageMastering: 80,
                        pointsHost: 1
                    },
                    overallFeedback: [
                        { from: 0, to: 10, feedback: translations.essay_overall_feedback_0_10 },
                        { from: 11, to: 30, feedback: translations.essay_overall_feedback_11_30 },
                        { from: 31, to: 50, feedback: translations.essay_overall_feedback_31_50 },
                        { from: 51, to: 70, feedback: translations.essay_overall_feedback_51_70 },
                        { from: 71, to: 90, feedback: translations.essay_overall_feedback_71_90 },
                        { from: 91, to: 100, feedback: translations.essay_overall_feedback_91_100 }
                    ],
                    checkAnswer: translations.essay_checkAnswer || "Check",
                    tryAgain: translations.essay_tryAgain || "Retry",
                    showSolution: translations.essay_showSolution || "Show solution",
                    feedbackHeader: translations.essay_feedbackHeader || "Feedback",
                    solutionTitle: translations.essay_solutionTitle || "Sample solution",
                    remainingChars: translations.remainingChars || "Remaining characters: @chars",
                    notEnoughChars: translations.notEnoughChars || "You must enter at least @chars characters!",
                    messageSave: translations.messageSave || "saved",
                    placeholderText: translations.placeholderText || "In a hole in the ground there lived a hobbit ...",
                    solution: {
                        introduction: "",
                        sample: ""
                    },
                    media: {},
                    ariaYourResult: translations.ariaYourResult || "You got @score out of @total points",
                    ariaNavigatedToSolution: translations.ariaNavigatedToSolution || "Navigated to newly included sample solution after textarea."
                };
            } else if (moduleKey === 'Summary') {
                content = {
                    intro: jsonObj.intro || translations.summary_intro,
                    summaries: jsonObj.summaries.map(s => ({
                        ...s,
                        subContentId: generateUUID(),
                        tip: s.tip || ""
                    })),
                    solvedLabel: translations.summary_solved_label,
                    scoreLabel: translations.summary_score_label,
                    resultLabel: translations.summary_result_label,
                    overallFeedback: jsonObj.overallFeedback || [{
                        from: 0,
                        to: 100,
                        feedback: translations.summary_feedback
                    }],
                    labelCorrect: translations.summary_label_correct,
                    labelIncorrect: translations.summary_label_incorrect,
                    labelCorrectAnswers: translations.summary_label_correct_answers,
                    tipButtonLabel: translations.summary_tip_button_label,
                    scoreBarLabel: translations.summary_score_bar_label,
                    progressText: translations.summary_progress_text,
                    alternativeIncorrectLabel: translations.summary_alternative_incorrect_label
                };
            } else if (moduleKey === 'DragTheWords') {
                content = {
                    taskDescription: jsonObj.taskDescription,
                    textField: jsonObj.textField,
                    checkAnswer: translations.drag_words_check_answer || "Check",
                    tryAgain: translations.drag_words_try_again || "Retry",
                    showSolution: translations.drag_words_show_solution || "Show Solution",
                    behaviour: {
                        enableRetry: true,
                        enableSolutionsButton: true,
                        instantFeedback: false,
                        enableCheckButton: true
                    },
                    overallFeedback: jsonObj.overallFeedback || [{
                        from: 0,
                        to: 100,
                        feedback: translations.drag_words_score_feedback || "Score: @score of @total."
                    }],
                    dropZoneIndex: "Drop Zone @index.",
                    empty: "Drop Zone @index is empty.",
                    contains: "Drop Zone @index contains draggable @draggable.",
                    tipLabel: translations.drag_words_tip_label || "Show tip",
                    correctText: translations.drag_words_correct_text || "Correct!",
                    incorrectText: translations.drag_words_incorrect_text || "Incorrect!",
                    resetDropTitle: "Reset drop",
                    resetDropDescription: "Are you sure you want to reset this drop zone?",
                    grabbed: "Draggable is grabbed.",
                    cancelledDragging: "Cancelled dragging.",
                    correctAnswer: "Correct answer:",
                    feedbackHeader: "Feedback",
                    scoreBarLabel: translations.drag_words_score_bar_label || "You got :num out of :total points",
                    media: {
                        disableImageZooming: false
                    },
                    submitAnswer: translations.drag_words_submit_answer || "Submit",
                    ariaDraggableIndex: "@index of @count draggables.",
                    a11yCheck: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                    a11yShowSolution: "Show the solution. The task will be marked with its correct solution.",
                    a11yRetry: "Retry the task. Reset all responses and start the task over again."
                };
            } else if (moduleKey === 'FillInTheBlanks') {
                content = {
                    ...jsonObj, // Conserve les questions
                    showSolutions: translations.blanks_show_solutions || "Show solutions",
                    tryAgain: translations.blanks_try_again || "Try again",
                    checkAnswer: translations.blanks_check_answer || "Check",
                    notFilledOut: translations.blanks_not_filled_out || "Please fill in all blanks",
                    answerIsCorrect: translations.blanks_answer_is_correct || "'':ans' is correct",
                    answerIsWrong: translations.blanks_answer_is_wrong || "'':ans' is wrong",
                    answeredCorrectly: translations.blanks_answered_correctly || "Answered correctly",
                    answeredIncorrectly: translations.blanks_answered_incorrectly || "Answered incorrectly",
                    solutionLabel: translations.blanks_solution_label || "Correct answer:",
                    inputLabel: translations.blanks_input_label || "Blank input @num of @total",
                    inputHasTipLabel: translations.blanks_input_has_tip_label || "Tip available",
                    tipLabel: translations.blanks_tip_label || "Tip",
                    scoreBarLabel: translations.blanks_score_bar_label || "You got :num out of :total points",
                    submitAnswer: translations.blanks_submit_answer || "Submit",
                    behaviour: {
                        enableSolutionsButton: true,
                        autoCheck: true,
                        caseSensitive: false,
                        showSolutionsRequiresInput: true,
                        separateLines: false,
                        enableRetry: true,
                        confirmCheckDialog: false,
                        confirmRetryDialog: false,
                        acceptSpellingErrors: false,
                        enableCheckButton: true
                    },
                    confirmCheck: {
                        header: translations.blanks_finish_header || "Finish ?",
                        body: translations.blanks_finish_body || "Are you sure you wish to finish ?",
                        cancelLabel: translations.blanks_cancel_label || "Cancel",
                        confirmLabel: translations.blanks_finish_label || "Finish"
                    },
                    confirmRetry: {
                        header: translations.blanks_retry_header || "Retry ?",
                        body: translations.blanks_retry_body || "Are you sure you wish to retry ?",
                        cancelLabel: translations.blanks_cancel_label || "Cancel",
                        confirmLabel: translations.blanks_retry_confirm_label || "Confirm"
                    },
                    overallFeedback: [{
                        from: 0,
                        to: 100,
                        feedback: translations.blanks_feedback || "You got @score of @total blanks correct."
                    }],
                    a11yCheck: translations.blanks_a11y_check || "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                    a11yShowSolution: translations.blanks_a11y_show_solution || "Show the solution. The task will be marked with its correct solution.",
                    a11yRetry: translations.blanks_a11y_retry || "Retry the task. Reset all responses and start the task over again.",
                    a11yCheckingModeHeader: translations.blanks_checking_mode_header || "Checking mode"
                };
            }
 
             // Ajout d'une adaptation pour MarkTheWords pour inclure les paramètres par défaut
             if (moduleKey === 'MarkTheWords') {
                 content = {
                    taskDescription: jsonObj.taskDescription,
                    textField: jsonObj.textField,
                    behaviour: {
                        enableRetry: true,
                        enableSolutionsButton: true,
                        enableCheckButton: true,
                        showScorePoints: true
                    },
                    overallFeedback: [{
                        "from": 0,
                        "to": 100,
                        "feedback": "You got @score of @total points."
                    }],
                    checkAnswerButton: translations.mark_words_check_answer || "Check",
                    tryAgainButton: translations.mark_words_try_again || "Retry",
                    showSolutionButton: translations.mark_words_show_solution || "Show solution",
                    correctAnswer: translations.mark_words_correct_answer || "Correct!",
                    incorrectAnswer: translations.mark_words_incorrect_answer || "Incorrect!",
                    missedAnswer: translations.mark_words_missed_answer || "Missed!",
                    displaySolutionDescription: translations.mark_words_display_solution_description || "Task is updated to contain the solution.",
                    scoreBarLabel: translations.mark_words_score_bar_label || "You got :num out of :total points",
                    submitAnswerButton: translations.mark_words_submit_answer || "Submit",
                    a11yFullTextLabel: translations.mark_words_a11y_full_text_label || "Full readable text",
                    a11yClickableTextLabel: translations.mark_words_a11y_clickable_text_label || "Full text where words can be marked",
                    media: {
                        "disableImageZooming": false
                    },
                    a11ySolutionModeHeader: translations.mark_words_a11y_solution_mode_header || "Solution mode",
                    a11yCheckingHeader: translations.mark_words_a11y_checking_header || "Checking mode",
                    a11yCheck: translations.mark_words_a11y_check || "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
                    a11yShowSolution: translations.mark_words_a11y_show_solution || "Show the solution. The task will be marked with its correct solution.",
                    a11yRetry: translations.mark_words_a11y_retry || "Retry the task. Reset all responses and start the task over again."
                };
            }

            const dynamicDependencies = (moduleKey === 'QuizSet' && jsonObj.quiz?.questions)
                ? [...new Set(jsonObj.quiz.questions.map(q => q.library.split(' ')[0]))]
                : [];

            createH5PFile(machineName, JSON.stringify(content), options, dynamicDependencies, includeLibs, moduleKey);

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


    function getPrompts(arg1, arg2, arg3, arg4, arg5, isAdvanced) {
        let contextPrompt;
        let matiere, niveau, theme, nombreQuestions, infosComplementaires;

        // Accéder aux traductions des prompts via l'objet translations
        const pt = translations;

        if (isAdvanced) {
            matiere = arg1;
            niveau = arg2;
            theme = arg3;
            nombreQuestions = arg4;
            infosComplementaires = arg5;
            contextPrompt = `
                ${pt.prompt_expert_intro}${matiere}.

                ${pt.prompt_context_title}
                ${pt.prompt_subject} ${matiere}
                ${pt.prompt_student_level} ${niveau}
                ${pt.prompt_theme} ${theme}
                ${pt.prompt_number_of_elements} ${nombreQuestions}
                ${infosComplementaires ? `${pt.prompt_additional_info} ${infosComplementaires}` : ''}
            `;
        } else {
            const qui = arg1;
            const quoi = arg2;
            contextPrompt = `
                ${pt.prompt_simple_intro_part1}${qui}${pt.prompt_simple_intro_part2}${quoi}.
            `;
            // Pour le mode simple, on peut déduire un nombre par défaut si nécessaire
            nombreQuestions = 10;
        }

        const languageInstruction = `\n\n${pt.prompt_language_instruction}\n\n${pt.prompt_code_block_instruction}`;

        const timelinePrompt = `${pt.timeline_prompt_role}
                                ${contextPrompt}

                                ${pt.timeline_prompt_mission}
                                ${pt.timeline_prompt_generate_json}

                                ${pt.timeline_prompt_json_structure_title}
                                ${pt.timeline_prompt_json_structure_main_object}
                                - ${pt.timeline_prompt_headline}
                                - ${pt.timeline_prompt_text}
                                - ${pt.timeline_prompt_asset}
                                - ${pt.timeline_prompt_date_array.replace('${nombreQuestions}', nombreQuestions)}
                                - ${pt.timeline_prompt_era_array}

                                ${pt.timeline_prompt_content_rules_title}
                                ${pt.timeline_prompt_rule1}
                                    ${pt.timeline_prompt_rule1_startDate}
                                    ${pt.timeline_prompt_rule1_headline}
                                    ${pt.timeline_prompt_rule1_text}
                                    ${pt.timeline_prompt_rule1_asset}
                                    ${pt.timeline_prompt_rule1_tag}
                                ${pt.timeline_prompt_rule2}
                                ${pt.timeline_prompt_rule3}

                                ${pt.timeline_prompt_example_json_title}
                                \`\`\`json
                                {
                                  "timeline": {
                                    "headline": "Titre de la frise chronologique",
                                    "text": "<p>Introduction sur le thème de la frise.</p>",
                                    "date": [
                                      {
                                        "startDate": "1914,07,28",
                                        "endDate": "1914,07,28",
                                        "headline": "Début de la Première Guerre mondiale",
                                        "text": "<p>L'Autriche-Hongrie déclare la guerre à la Serbie.</p>",
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
                                        "text": "<p>Signature de l'armistice à Rethondes, marquant la fin des combats.</p>",
                                        "tag": "Traité"
                                      }
                                    ],
                                    "era": [
                                      {
                                        "startDate": "1914,07,28",
                                        "endDate": "1918,11,11",
                                        "headline": "Première Guerre mondiale",
                                        "text": "<div>C'est la période de la Grande Guerre.</div>",
                                        "tag": "Période historique"
                                      }
                                    ]
                                  }
                                }
                                \`\`\`

                                ${pt.timeline_prompt_generate_only_json}${languageInstruction}`;

        const crosswordPrompt = `${pt.crossword_prompt_role}
                                ${contextPrompt}

                                ${pt.crossword_prompt_mission}
                                ${pt.crossword_prompt_generate_json}

                                ${pt.crossword_prompt_json_structure_title}
                                ${pt.crossword_prompt_json_structure_main_object}
                                - ${pt.crossword_prompt_title}
                                - ${pt.crossword_prompt_words_array.replace('${nombreQuestions}', nombreQuestions)}
                                    - ${pt.crossword_prompt_answer}
                                    - ${pt.crossword_prompt_clue}
                                    - ${pt.crossword_prompt_extra_clue_optional}
                                - ${pt.crossword_prompt_task_description}
                                - ${pt.crossword_prompt_overall_feedback}

                                ${pt.crossword_prompt_content_rules_title}
                                ${pt.crossword_prompt_rule1}
                                ${pt.crossword_prompt_rule2}
                                ${pt.crossword_prompt_rule3}

                                ${pt.crossword_prompt_example_json_title}
                                \`\`\`json
                                {
                                  "title": "Mots croisés sur la Biologie",
                                  "words": [
                                    {
                                      "answer": "Cellule",
                                      "clue": "Unité de base de la vie.",
                                      "extraClue": {
                                        "params": {
                                          "text": "<p>Elle peut être animale ou végétale.</p>"
                                        }
                                      }
                                    },
                                    {
                                       "answer": "ADN",
                                       "clue": "Molécule portant l'information génétique."
                                    }
                                  ],
                                  "taskDescription": "<p>Complète la grille de mots croisés.</p>"
                                }
                                \`\`\`

                                ${pt.crossword_prompt_generate_only_json}${languageInstruction}`;

        const essayPrompt = `${pt.essay_prompt_role}
                            ${contextPrompt}

                            ${pt.essay_prompt_mission}
                            ${pt.essay_prompt_generate_json}

                            ${pt.essay_prompt_json_structure_title}
                            ${pt.essay_prompt_json_structure_main_object}
                            - ${pt.essay_prompt_task_description}
                            - ${pt.essay_prompt_keywords_array.replace('${nombreQuestions}', nombreQuestions)}
                            - ${pt.essay_prompt_overall_feedback}

                            ${pt.essay_prompt_content_rules_title}
                            ${pt.essay_prompt_rule1}
                            ${pt.essay_prompt_rule2}
                            ${pt.essay_prompt_rule3}
                            ${pt.essay_prompt_rule4}

                            ${pt.essay_prompt_example_json_title}
                            \`\`\`json
                            {
                            "taskDescription": "<p>Rédige un court texte expliquant la photosynthèse.</p>",
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
                            \`\`\`

                            ${pt.essay_prompt_generate_only_json}${languageInstruction}`;

        const moodleXmlPrompt = `
                                ${contextPrompt}
                                ${pt.moodle_xml_prompt_intro.replace('${nombreQuestions}', nombreQuestions)}
                                ${pt.moodle_xml_prompt_content_title}

                                ${pt.moodle_xml_prompt_content_rule1}
                                ${pt.moodle_xml_prompt_content_rule2}
                                ${pt.moodle_xml_prompt_content_rule3}
                                ${pt.moodle_xml_prompt_content_rule4}

                                ${pt.moodle_xml_prompt_question_types_intro}
                                ${pt.moodle_xml_prompt_question_type_multichoice}
                                ${pt.moodle_xml_prompt_question_type_matching}
                                ${pt.moodle_xml_prompt_question_type_numerical}
                                ${pt.moodle_xml_prompt_question_type_truefalse}
                                ${pt.moodle_xml_prompt_question_type_shortanswer}
                                ${pt.moodle_xml_prompt_question_type_cloze}
                                
                                ${pt.moodle_xml_prompt_form_title}
                                ${pt.moodle_xml_prompt_form_rule1}

                                ${pt.moodle_xml_prompt_form_rule1_encoding}
                                ${pt.moodle_xml_prompt_form_rule1_reusable}
                                ${pt.moodle_xml_prompt_form_rule1_standard_structure}
                                ${pt.moodle_xml_prompt_form_rule1_special_chars}


                                ${pt.moodle_xml_prompt_generate_only_xml}${languageInstruction}`;

        const giftPrompt = `
                           ${contextPrompt}
                           ${pt.gift_prompt_intro.replace('${nombreQuestions}', nombreQuestions)}

                           ${pt.gift_prompt_format_info}

                           ${pt.gift_prompt_question_quality}

                           ${pt.gift_prompt_code_format_intro}

                           ${pt.gift_prompt_example_question_comment}

                           ${pt.gift_prompt_example_question_text}

                               ${pt.gift_prompt_example_answer_correct}

                               ${pt.gift_prompt_example_answer_incorrect1}

                               ${pt.gift_prompt_example_answer_incorrect2}

                               ${pt.gift_prompt_example_answer_incorrect3}

                           ${pt.gift_prompt_example_end_bracket}

                           ${pt.gift_prompt_question_types_intro}
                           ${pt.gift_prompt_question_type_multichoice}
                           ${pt.gift_prompt_question_type_truefalse}
                           ${pt.gift_prompt_question_type_numerical}
                           ${pt.gift_prompt_question_type_matching}

                           ${pt.gift_prompt_generate_only_gift}${languageInstruction}`;

        
        const flashcardsPrompt = `${pt.flashcards_prompt_role}
                                ${contextPrompt}

                                ${pt.flashcards_prompt_mission}
                                ${pt.flashcards_prompt_generate_json}

                                ${pt.flashcards_prompt_json_structure_title}
                                ${pt.flashcards_prompt_json_structure_main_object}
                                - ${pt.flashcards_prompt_title}
                                - ${pt.flashcards_prompt_description}
                                - ${pt.flashcards_prompt_cards_array.replace('${nombreQuestions}', nombreQuestions)}
                                    - ${pt.flashcards_prompt_text}
                                    - ${pt.flashcards_prompt_answer}
                                    - ${pt.flashcards_prompt_tip}

                                ${pt.flashcards_prompt_example_json_title}
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
                                    "text": "Pays-Bas",
                                    "answer": "Amsterdam",
                                    "tip": "<p>C'est la ville des <strong>canaux</strong> et des tulipes !</p>"
                                    }
                                ]
                                }
                                \`\`\`

                                ${pt.flashcards_prompt_generate_only_json}${languageInstruction}`;

        const quizSetPrompt = `${pt.quiz_set_prompt_role}
                                ${contextPrompt}

                                ${pt.quiz_set_prompt_mission}
                                ${pt.quiz_set_prompt_generate_json}

                                ${pt.quiz_set_prompt_json_structure_title}
                                ${pt.quiz_set_prompt_json_structure_main_object}
                                - ${pt.quiz_set_prompt_progress_type}
                                - ${pt.quiz_set_prompt_pass_percentage}
                                - ${pt.quiz_set_prompt_questions_array.replace('${nombreQuestions}', nombreQuestions)}

                                ${pt.quiz_set_prompt_content_rules_title}
                                ${pt.quiz_set_prompt_rule1}
                                ${pt.quiz_set_prompt_rule2}
                                ${pt.quiz_set_prompt_rule3}
                                    ${pt.quiz_set_prompt_rule3_multichoice}
                                    ${pt.quiz_set_prompt_rule3_blanks}
                                ${pt.quiz_set_prompt_rule4}
                                ${pt.quiz_set_prompt_rule5}

                                ${pt.quiz_set_prompt_example_json_title}
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

                                ${pt.quiz_set_prompt_generate_only_json}${languageInstruction}`;

        const glossaryPrompt = `${pt.glossary_prompt_role}
                                ${contextPrompt}

                                ${pt.glossary_prompt_mission}
                                ${pt.glossary_prompt_generate_json}

                                ${pt.glossary_prompt_json_structure_title}
                                ${pt.glossary_prompt_json_structure_main_object.replace('${nombreQuestions}', nombreQuestions)}
                                - ${pt.glossary_prompt_title}
                                - ${pt.glossary_prompt_content}

                                ${pt.glossary_prompt_content_rules_title}
                                ${pt.glossary_prompt_rule1}

                                ${pt.glossary_prompt_example_json_title}
                                \`\`\`json
                                [
                                    {
                                      "title": "Photosynthèse",
                                      "text": "<p>Processus par lequel les plantes vertes transforment la lumière du soleil en énergie.</p>"
                                    },
                                    {
                                      "title": "Cellule",
                                      "text": "<p>Unité de base de tous les êtres vivants.</p>"
                                    }
                                ]
                                \`\`\`

                                ${pt.glossary_prompt_generate_only_json}${languageInstruction}`;

        const summaryPrompt = `${pt.summary_prompt_role}
                                ${contextPrompt}

                                ${pt.summary_prompt_mission}
                                ${pt.summary_prompt_generate_json}

                                ${pt.summary_prompt_json_structure_title}
                                ${pt.summary_prompt_json_structure_main_object}
                                - ${pt.summary_prompt_intro_field}
                                - ${pt.summary_prompt_summaries_array.replace('${nombreQuestions}', nombreQuestions)}
                                ${pt.summary_prompt_summary_object}
                                - ${pt.summary_prompt_summary_array}
                                - ${pt.summary_prompt_tip_field}
                                - ${pt.summary_prompt_overall_feedback}

                                ${pt.summary_prompt_content_rules_title}
                                ${pt.summary_prompt_rule1}
                                ${pt.summary_prompt_rule2}
                                ${pt.summary_prompt_rule3}

                                ${pt.summary_prompt_example_json_title}
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

                                ${pt.summary_prompt_generate_only_json}${languageInstruction}`;

        const dragWordPrompt = `${pt.drag_word_prompt_role}
                                ${contextPrompt}

                                ${pt.drag_word_prompt_mission}
                                ${pt.drag_word_prompt_generate_json}

                                ${pt.drag_word_prompt_json_structure_title}
                                ${pt.drag_word_prompt_json_structure_main_object}
                                - ${pt.drag_word_prompt_task_description}
                                - ${pt.drag_word_prompt_text_field}
                                - ${pt.drag_word_prompt_overall_feedback}

                                ${pt.drag_word_prompt_content_rules_title}
                                ${pt.drag_word_prompt_rule1}
                                ${pt.drag_word_prompt_rule2.replace('${nombreQuestions}', nombreQuestions)}

                                ${pt.drag_word_prompt_example_json_title}
                                \`\`\`json
                                {
                                "taskDescription": "Complète le texte en faisant glisser les mots.",
                                "textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*."
                                }
                                \`\`\`

                                ${pt.drag_word_prompt_generate_only_json}${languageInstruction}`;

        const blanksPrompt = `${pt.blanks_prompt_role}
                            ${contextPrompt}

                            ${pt.blanks_prompt_mission}
                            ${pt.blanks_prompt_generate_json}

                            ${pt.blanks_prompt_json_structure_title}
                            ${pt.blanks_prompt_json_structure_main_object}

                            ${pt.blanks_prompt_content_rules_title}
                            ${pt.blanks_prompt_rule1}
                            ${pt.blanks_prompt_rule2}
                            ${pt.blanks_prompt_rule3}

                            ${pt.blanks_prompt_example_json_title}
                            \`\`\`json
                            {
                            "questions": [
                                "Le système solaire a *huit* planètes. La plus grande est *Jupiter*.",
                                "La capitale de la France est *Paris/Ville Lumière*."
                            ]
                            }
                            \`\`\`

                            ${pt.blanks_prompt_generate_only_json}${languageInstruction}`;

        const markWordsPrompt = `${pt.mark_words_prompt_role}
                                ${contextPrompt}

                                ${pt.mark_words_prompt_mission}
                                ${pt.mark_words_prompt_generate_json}

                                ${pt.mark_words_prompt_json_structure_title}
                                ${pt.mark_words_prompt_json_structure_main_object}
                                - ${pt.mark_words_prompt_task_description}
                                - ${pt.mark_words_prompt_text_field}

                                ${pt.mark_words_prompt_content_rules_title}
                                ${pt.mark_words_prompt_rule1}
                                ${pt.mark_words_prompt_rule2.replace('${nombreQuestions}', nombreQuestions)}

                                ${pt.mark_words_prompt_example_json_title}
                                \`\`\`json
                                {
                                "taskDescription": "Clique sur les mots importants dans le texte.",
                                "textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*."
                                }
                                \`\`\`

                                ${pt.mark_words_prompt_generate_only_json}${languageInstruction}`;

        const millionnairePrompt = `${pt.millionnaire_prompt_role}
                                    ${contextPrompt}
                                    ${pt.millionnaire_prompt_num_questions}

                                    ${pt.millionnaire_prompt_mission}
                                    ${pt.millionnaire_prompt_generate_json}

                                    ${pt.millionnaire_prompt_important_rules_title}
                                    ${pt.millionnaire_prompt_rule1}
                                    ${pt.millionnaire_prompt_rule2}
                                    ${pt.millionnaire_prompt_rule3}

                                    ${pt.millionnaire_prompt_json_structure_title}
                                    ${pt.millionnaire_prompt_main_object}
                                    ${pt.millionnaire_prompt_title}
                                    ${pt.millionnaire_prompt_questions_array}
                                        ${pt.millionnaire_prompt_question}
                                        ${pt.millionnaire_prompt_good_answer}
                                        ${pt.millionnaire_prompt_bad_answer}

                                    ${pt.millionnaire_prompt_example_json_title}
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

                                    ${pt.millionnaire_prompt_generate_only_json}${languageInstruction}`;

       const appariementPrompt = `${pt.appariement_prompt_role}
                                    ${contextPrompt}
                                    ${pt.appariement_prompt_num_questions}

                                   ${pt.appariement_prompt_mission}
                                   ${pt.appariement_prompt_generate_json}

                                   ${pt.appariement_prompt_important_rules_title}
                                   ${pt.appariement_prompt_rule1}
                                   ${pt.appariement_prompt_rule2}
                                   ${pt.appariement_prompt_rule3}

                                   ${pt.appariement_prompt_json_structure_title}
                                   ${pt.appariement_prompt_main_object}
                                   ${pt.appariement_prompt_title}
                                   ${pt.appariement_prompt_pairs_array}
                                       ${pt.appariement_prompt_question}
                                       ${pt.appariement_prompt_answer}

                                   ${pt.appariement_prompt_example_json_title}
                                   \`\`\`json
                                   {
                                   "title": "Appariement sur la Révolution Française",
                                   "pairs": [
                                       {
                                       "question": "Prise de la Bastille",
                                       "answer": "14 juillet 1789"
                                       }
                                   ]
                                   }
                                   \`\`\`

                                   ${pt.appariement_prompt_generate_only_json}${languageInstruction}`;

        const qcmPrompt = `${pt.qcm_prompt_role}
                                    ${contextPrompt}
                                    ${pt.qcm_prompt_num_questions}
 
                                    ${pt.qcm_prompt_mission}
                                    ${pt.qcm_prompt_generate_json}
 
                                    ${pt.qcm_prompt_important_rules_title}
                                    ${pt.qcm_prompt_rule1}
                                    ${pt.qcm_prompt_rule2}
                                    ${pt.qcm_prompt_rule3}
 
                                    ${pt.qcm_prompt_json_structure_title}
                                    ${pt.qcm_prompt_main_object}
                                    ${pt.qcm_prompt_title}
                                    ${pt.qcm_prompt_questions_array}
                                        ${pt.qcm_prompt_question_text}
                                        ${pt.qcm_prompt_answers_array}
                                            ${pt.qcm_prompt_answer_text}
                                            ${pt.qcm_prompt_answer_iscorrect}
 
                                    ${pt.qcm_prompt_example_json_title}
                                    \`\`\`json
                                    {
                                      "title": "QCM sur la Révolution Française",
                                      "questions": [
                                        {
                                          "text": "<p>Quelle est la date de la prise de la Bastille ?</p>",
                                          "answers": [
                                            { "text": "<p>14 juillet 1789</p>", "iscorrect": 1 },
                                            { "text": "<p>4 août 1789</p>", "iscorrect": 0 },
                                            { "text": "<p>26 août 1789</p>", "iscorrect": 0 }
                                          ]
                                        }
                                      ]
                                    }
                                    \`\`\`
 
                                    ${pt.qcm_prompt_generate_only_json}${languageInstruction}`;
 
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
            millionnaireResultat: millionnairePrompt,
            appariementResultat: appariementPrompt,
            qcmResultat: qcmPrompt
        };
    }

// =======================================================================
// 10. CRÉATION MBZ ET ACTIVITÉ MILLIONNAIRE
// =======================================================================

    async function createMbz(files) {
    const tar = new Tar();
    const mtime = Math.floor(Date.now() / 1000);
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
        const buffer = fflate.strToU8(content);
        archiveIndexContent += `${path}\tf\t${buffer.length}\t${mtime}\n`;
    }
    files['.ARCHIVE_INDEX'] = archiveIndexContent;
    // 3. Ajouter tous les fichiers à l'archive TAR (en UTF-8)
    const sortedPaths = Object.keys(files).sort();
    for (const path of sortedPaths) {
        const content = files[path];
        tar.append(path, fflate.strToU8(content));
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
           let files = await fetchAllFilesRecursively(basePath, 'millionnaire');
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
           console.error("Erreur lors de la création du MBZ:", error);
           showNotification(`Erreur : ${error.message}`, 'error');
       }
   }

   async function handleAppariementCreation(jsonInput) {
        try {
            if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
                throw new Error("Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées.");
            }
            const jsonData = JSON.parse(jsonInput);
            if (!jsonData.title || !Array.isArray(jsonData.pairs) || jsonData.pairs.length === 0) {
                throw new Error("La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'pairs'.");
            }

            const activityTitle = jsonData.title;
            const pairs = jsonData.pairs;
            const questions = {};
            const responses = {};
            pairs.forEach((pair, index) => {
                questions[index + 1] = escapeHtmlTags(`<p dir=\"ltr\" style=\"text-align: left;\">${pair.question}<\/p>`);
                responses[index + 1] = escapeHtmlTags(`<p dir=\"ltr\" style=\"text-align: left;\">${pair.answer}<\/p>`);
            });
            const associations = JSON.stringify({ questions, responses });

            // --- Génération des IDs et Timestamps ---
            const timestamp = Math.floor(Date.now() / 1000);
            const courseId = 1000 + Math.floor(Math.random() * 9000);
            const moduleId = 10000 + Math.floor(Math.random() * 90000);
            const sectionId = 1000 + Math.floor(Math.random() * 9000);
            const activityId = 100 + Math.floor(Math.random() * 900);
            const courseContextId = 10000 + Math.floor(Math.random() * 90000);
            const activityContextId = courseContextId + 2; // Assurer un ID de contexte d'activité unique
            const gradeItemId = 1000 + Math.floor(Math.random() * 9000);
            const categoryId = 1000 + Math.floor(Math.random() * 9000);
            const courseItemId = 1000 + Math.floor(Math.random() * 9000);

            const data = {
                'ACTIVITY_TITLE': activityTitle,
                'ACTIVITY_INTRO_HTML': escapeHtmlTags(`<p dir="ltr" style="text-align: left;">Trouvez les paires correspondantes.</p>`),
                'ASSOCIATIONS_JSON': associations,
                'COURSE_FULLNAME': activityTitle,
                'COURSE_SHORTNAME': `parcours-${Math.random().toString(36).substring(2, 15)}`,
                'COURSE_ID': courseId,
                'MODULE_ID': moduleId,
                'SECTION_ID': sectionId,
                'ACTIVITY_ID': activityId,
                'COURSE_CONTEXTID': courseContextId,
                'ACTIVITY_CONTEXTID': activityContextId,
                'GRADE_ITEM_ID': gradeItemId,
                'CATEGORY_ID': categoryId,
                'COURSE_ITEM_ID': categoryId, // L'iteminstance doit être l'ID de la catégorie
                'TIMESTAMP': timestamp,
                'BACKUP_DATE': timestamp
            };

            const basePath = 'elea/appariement';
            let files = await fetchAllFilesRecursively(basePath, 'appariement');

            const newFiles = {};
            for (let path in files) {
                let content = files[path];
                for (const key in data) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    content = content.replace(regex, data[key]);
                }
                
                let newPath = path.replace(/epikmatch_13863/g, `epikmatch_${data.MODULE_ID}`);
                newPath = newPath.replace(/section_3585/g, `section_${data.SECTION_ID}`);
                
                newFiles[newPath] = content;
            }
            files = newFiles;

            files['moodle_backup.log'] = 'Backup created automatically by Caramel\n';
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
            console.error("Erreur lors de la création du MBZ pour l'appariement:", error);
            showNotification(`Erreur : ${error.message}`, 'error');
        }
    }
 
   async function handleQCMCreation(jsonInput) {
        try {
            if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
                throw new Error("Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées.");
            }
            const jsonData = JSON.parse(jsonInput);
            if (!jsonData.title || !Array.isArray(jsonData.questions) || jsonData.questions.length === 0 || jsonData.questions.some(q => !q.text || !Array.isArray(q.answers) || q.answers.length === 0)) {
               throw new Error("La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' avec au moins une question et des réponses.");
            }

            const activityTitle = jsonData.title;
            
            const questionsData = escapeHtmlTags(JSON.stringify(jsonData.questions));

            // --- Génération des IDs et Timestamps ---
            const timestamp = Math.floor(Date.now() / 1000);
            const courseId = 1000 + Math.floor(Math.random() * 9000);
            const moduleId = 10000 + Math.floor(Math.random() * 90000);
            const sectionId = 1000 + Math.floor(Math.random() * 9000);
            const activityId = 100 + Math.floor(Math.random() * 900);
            const courseContextId = 10000 + Math.floor(Math.random() * 90000);
            const activityContextId = courseContextId + 2;
            const gradeItemId = 1000 + Math.floor(Math.random() * 9000);
            const categoryId = 1000 + Math.floor(Math.random() * 9000);

            const data = {
                'ACTIVITY_TITLE': activityTitle,
                'ACTIVITY_INTRO_HTML': escapeHtmlTags(`<p dir="ltr" style="text-align: left;">Répondez aux questions suivantes.</p>`),
                'QUESTIONS_JSON': questionsData, // Placeholder pour le JSON des questions
                'COURSE_FULLNAME': activityTitle,
                'COURSE_SHORTNAME': `parcours-qcm-${Math.random().toString(36).substring(2, 15)}`,
                'COURSE_ID': courseId,
                'MODULE_ID': moduleId,
                'SECTION_ID': sectionId,
                'ACTIVITY_ID': activityId,
                'COURSE_CONTEXTID': courseContextId,
                'ACTIVITY_CONTEXTID': activityContextId,
                'GRADE_ITEM_ID': gradeItemId,
                'CATEGORY_ID': categoryId,
                'COURSE_ITEM_ID': categoryId,
                'TIMESTAMP': timestamp,
                'BACKUP_DATE': timestamp
            };

            const basePath = 'elea/QCM'; // Utiliser le dossier QCM comme base
            let files = await fetchAllFilesRecursively(basePath, 'qcm');

            const newFiles = {};
            for (let path in files) {
                let content = files[path];
                for (const key in data) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    content = content.replace(regex, data[key]);
                }
                
                let newPath = path.replace(/simplequiz_13882/g, `simplequiz_${data.MODULE_ID}`);
                // Pas de remplacement de section pour QCM pour l'instant, à vérifier
                
                newFiles[newPath] = content;
            }
            files = newFiles;

            files['moodle_backup.log'] = 'Backup created automatically by Caramel\n';
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
            console.error("Erreur lors de la création du MBZ pour le QCM:", error);
            showNotification(`Erreur : ${error.message}`, 'error');
        }
   }

   async function fetchAllFilesRecursively(basePath, type) {
       let files = {};
       let structure;
       if (type === 'appariement') {
           structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml',
               'activities/epikmatch_13863/epikmatch.xml', 'activities/epikmatch_13863/grades.xml', 'activities/epikmatch_13863/module.xml', 'activities/epikmatch_13863/inforef.xml', 'activities/epikmatch_13863/roles.xml', 'activities/epikmatch_13863/grade_history.xml', 'activities/epikmatch_13863/calendar.xml', 'activities/epikmatch_13863/filters.xml'
           ];
       } else if (type === 'qcm') {
            structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml', 'badges.xml',
               'activities/simplequiz_13882/simplequiz.xml', 'activities/simplequiz_13882/grades.xml', 'activities/simplequiz_13882/module.xml', 'activities/simplequiz_13882/inforef.xml', 'activities/simplequiz_13882/roles.xml', 'activities/simplequiz_13882/grade_history.xml', 'activities/simplequiz_13882/calendar.xml', 'activities/simplequiz_13882/filters.xml'
           ];
       }
       else { // Fallback to millionnaire
           structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml',
               'course/course.xml', 'course/enrolments.xml', 'course/completiondefaults.xml', 'course/inforef.xml', 'course/roles.xml',
               'activities/millionnairev2_59967/millionnairev2.xml', 'activities/millionnairev2_59967/grades.xml', 'activities/millionnairev2_59967/module.xml', 'activities/millionnairev2_59967/inforef.xml', 'activities/millionnairev2_59967/roles.xml', 'activities/millionnairev2_59967/grade_history.xml',
               'sections/section_11207/inforef.xml', 'sections/section_11207/section.xml'
           ];
       }
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

    async function createH5PFile(mainLibraryIdentifier, jsonContent, options = {}, dynamicDependencies = [], includeLibs = false, moduleKey = '') {
        try {
            const files = [];
            const moduleName = mainLibraryIdentifier.split('.')[1];
            let allDependencies = new Map();

            if (includeLibs) {
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
                    
                    files.push({
                      name: `${libFolderName}/library.json`,
                      input: new TextEncoder().encode(JSON.stringify(libraryInfo, null, 2)),
                      unixPermissions: 0o100644
                    });

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

                    const optionalFiles = ['semantics.json', 'icon.svg'];
                    for (const opt of optionalFiles) {
                      const optResp = await fetch(`${libPath}/${opt}`);
                      if (optResp.ok) { // Vérifier si la ressource existe avant de l'ajouter
                        const blob = await optResp.blob();
                        files.push({
                          name: `${libFolderName}/${opt}`,
                          input: new Uint8Array(await blob.arrayBuffer()),
                          unixPermissions: 0o100644
                        });
                      }
                    }

                    const langResponse = await fetch(`${libPath}/language/fr.json`);
                    if (langResponse.ok) { // Vérifier si la ressource existe avant de l'ajouter
                      const blob = await langResponse.blob();
                      files.push({
                        name: `${libFolderName}/language/fr.json`,
                        input: new Uint8Array(await blob.arrayBuffer()),
                        unixPermissions: 0o100644
                      });
                    }

                    const fontFilesToCopy = {
                      'FontAwesome': ['fontawesome-webfont.eot', 'fontawesome-webfont.svg', 'fontawesome-webfont.ttf', 'fontawesome-webfont.woff', 'fontawesome-webfont.woff2', 'FontAwesome.otf'],
                      'H5P.FontIcons': ['fonts/h5p.eot', 'fonts/h5p.svg', 'fonts/h5p.ttf', 'fonts/h5p.woff'],
                      'H5P.JoubelUI': ['fonts/joubel.eot', 'fonts/joubel.svg', 'fonts/joubel.ttf', 'fonts/joubel.woff']
                    };
                    if (fontFilesToCopy[machineName]) {
                      for (const fontFile of fontFilesToCopy[machineName]) {
                        const sourcePath = `${libPath}/${fontFile}`;
                        const fileResponse = await fetch(sourcePath);
                        if (fileResponse.ok) { // Vérifier si la ressource existe avant de l'ajouter
                          const destinationPath = `${libFolderName}/${fontFile}`;
                          const blob = await fileResponse.blob();
                          files.push({ name: destinationPath, input: new Uint8Array(await blob.arrayBuffer()), unixPermissions: 0o100644 });
                        }
                      }
                    }

                    const allDeps = (libraryInfo.preloadedDependencies || []).concat(libraryInfo.editorDependencies || []);
                    for (const dep of allDeps) {
                      await addLibraryFiles(dep.machineName, processedLibs);
                    }
                    processedLibs.set(machineName, { machineName: libraryInfo.machineName, majorVersion: String(libraryInfo.majorVersion), minorVersion: String(libraryInfo.minorVersion) });
                }

                await addLibraryFiles(mainLibraryIdentifier, allDependencies);
                for (const dep of dynamicDependencies) {
                  await addLibraryFiles(dep, allDependencies);
                }
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
            let dependenciesForJson = Array.from(allDependencies.values());

            // Si aucune bibliothèque n'est incluse, il faut quand même déclarer la dépendance principale.
            if (dependenciesForJson.length === 0 && mainLibraryIdentifier) {
                const mainLibPath = await findLatestLibraryPath(mainLibraryIdentifier);
                if (mainLibPath) {
                    try {
                        const response = await fetch(`${mainLibPath}/library.json`);
                        if (response.ok) {
                            const libraryInfo = await response.json();
                            dependenciesForJson.push({
                                machineName: libraryInfo.machineName,
                                majorVersion: String(libraryInfo.majorVersion),
                                minorVersion: String(libraryInfo.minorVersion)
                            });
                        }
                    } catch (e) {
                        console.error("Impossible de charger les informations de la bibliothèque principale :", e);
                    }
                }
            }

            const h5pJson = {
                title: title,
                mainLibrary: mainLibraryIdentifier,
                embedTypes: ["iframe"],
                preloadedDependencies: dependenciesForJson,
                language: currentLang === 'zh' ? 'zh-cn' : currentLang,
                license: "U"
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
            const now = new Date();
            const dateString = now.getFullYear() + '-' +
                             String(now.getMonth() + 1).padStart(2, '0') + '-' +
                             String(now.getDate()).padStart(2, '0') + '-' +
                             String(now.getHours()).padStart(2, '0') + '-' +
                             String(now.getMinutes()).padStart(2, '0');

            const h5pType = (moduleKey && h5pModules[moduleKey])
                            ? h5pModules[moduleKey].englishName.toLowerCase().replace(/[^a-z0-9()]+/g, '-').replace(/^-+|-+$/g, '')
                            : mainLibraryIdentifier.split('.')[1].toLowerCase();

            const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
            const fileName = `h5p-${h5pType}_caramel_${dateString}_${lang}.h5p`;
            a.download = fileName;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`Fichier ${a.download} généré avec succès.`);
            showNotification(`Fichier ${a.download} généré avec succès !`);
            return { success: true, message: `Fichier ${a.download} créé.` };
        } catch (error) {
            console.error("Erreur lors de la création du H5P:", error);
            showNotification(`Échec de la création du fichier H5P : ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async function findLatestLibraryPath(machineName) {
        const knownLibraries = {
            'H5P.QuestionSet': './h5p-libs/H5P.QuestionSet-1.20',
            'H5P.MultiChoice': './h5p-libs/H5P.MultiChoice-1.16',
            'H5P.DragText': './h5p-libs/H5P.DragText-1.10',
            'H5P.Blanks': './h5p-libs/H5P.Blanks-1.14',
            'H5P.JoubelUI': './h5p-libs/H5P.JoubelUI-1.3',
            'H5P.FontIcons': './h5p-libs/H5P.FontIcons-1.0',
            'H5P.Transition': './h5p-libs/H5P.Transition-1.0',
            'H5P.Question': './h5p-libs/H5P.Question-1.5',
            'H5P.TextUtilities': './h5p-libs/H5P.TextUtilities-1.3',
            'jQuery.ui': './h5p-libs/jQuery.ui-1.10',
            'FontAwesome': './h5p-libs/FontAwesome-4.5',
            'H5P.Timeline': './h5p-libs/H5P.Timeline-1.1',
            'TimelineJS': './h5p-libs/TimelineJS-1.1',
            'H5P.Flashcards': './h5p-libs/H5P.Flashcards-1.6',
            'H5P.Accordion': './h5p-libs/H5P.Accordion-1.0',
            'H5P.AdvancedText': './h5p-libs/H5P.AdvancedText-1.1',
            'H5P.Crossword': './h5p-libs/H5P.Crossword-0.5',
            'H5P.Essay': './h5p-libs/H5P.Essay-1.5',
            'H5P.Video': './h5p-libs/H5P.Video-1.6',
            'H5P.Image': './h5p-libs/H5P.Image-1.1',
            'H5P.MaterialDesignIcons': './h5p-libs/H5P.MaterialDesignIcons-1.0',
            'H5P.Summary': './h5p-libs/H5P.Summary-1.10',
            'H5P.MarkTheWords': './h5p-libs/H5P.MarkTheWords-1.11',
            'H5P.DragQuestion': './h5p-libs/H5P.DragQuestion-1.14',
            'H5PEditor.VerticalTabs': './h5p-libs/H5PEditor.VerticalTabs-1.3',
            'H5PEditor.ColorSelector': './h5p-libs/H5PEditor.ColorSelector-1.2',
            'H5PEditor.Wizard': './h5p-libs/H5PEditor.Wizard-1.2',
            'H5PEditor.RangeList': './h5p-libs/H5PEditor.RangeList-1.0'
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
// 12. FONCTION D'ÉCHAPPEMENT HTML (uniquement les chevrons)
// =======================================================================
    function escapeHtmlTags(str) {
        return String(str)
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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
            language: currentLang === 'zh' ? 'zh-cn' : currentLang,
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
        const now = new Date();
        const dateString = now.getFullYear() + '-' +
                         String(now.getMonth() + 1).padStart(2, '0') + '-' +
                         String(now.getDate()).padStart(2, '0') + '-' +
                         String(now.getHours()).padStart(2, '0') + '-' +
                         String(now.getMinutes()).padStart(2, '0');

        const h5pType = (h5pModules['QuizSet']?.englishName || 'quiz-set').toLowerCase().replace(/[^a-z0-9()]+/g, '-').replace(/^-+|-+$/g, '');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `h5p-${h5pType}_caramel_${dateString}_${lang}.h5p`;
        a.download = fileName;
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
});
