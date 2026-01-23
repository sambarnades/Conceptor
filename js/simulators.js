/**
 * @file Module de gestion des simulateurs visuels pour les activités MBZ/XML.
 * Permet de prévisualiser le rendu des activités sans avoir besoin de les importer dans Moodle/Éléa.
 */

import { translations } from './modules/translation.js';
import { mathRenderer } from './modules/math-renderer.js';

/**
 * Crée et retourne un bouton plein écran pour les simulateurs.
 * @param {boolean} integrated - Si vrai, ajoute une classe pour une intégration plus discrète dans les en-têtes.
 * @returns {HTMLButtonElement}
 */
function createFullscreenButton(integrated = true) {
    const btn = document.createElement('button');
    btn.className = 'preview-modal__fullscreen-btn';
    if (integrated) btn.classList.add('preview-modal__fullscreen-btn--integrated');

    const title = (translations && translations.fullscreen) || 'Plein écran';
    btn.title = title;
    btn.setAttribute('aria-label', title);

    const isFS = !!document.fullscreenElement;
    btn.innerHTML = isFS ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';

    return btn;
}

/**
 * Rendu du simulateur pour l'activité Millionnaire.
 * @param {HTMLElement} container - Le conteneur DOM où injecter le simulateur.
 * @param {Object} data - Le JSON de l'activité (contient title et questions).
 */
export function renderMillionnaire(container, data) {
    if (!container || !data || !data.questions) return;

    // --- State Management ---
    let currentQuestionIndex = 0;
    let isFinished = false;
    let selectedAnswerIndex = null; // null, or index of answer clicked
    let hasValidated = false; // true if user has clicked an answer (immediate validation)

    // Levels corresponding to standard Moodle Millionnaire (6 questions)
    // 1: 500, 2: 1000, 3: 10000, 4: 50000, 5: 250000, 6: 1000000
    const levels = [
        "1 000 000",
        "250 000",
        "50 000",
        "10 000",
        "1 000",
        "500"
    ];

    // Shuffled questions state
    let questionsWithShuffledAnswers = [];

    function prepareQuestions() {
        questionsWithShuffledAnswers = data.questions.map(q => {
            const answers = [
                { text: q.goodanswer, correct: true },
                ...q.badanswer.map(text => ({ text, correct: false }))
            ];
            // Simple shuffle
            return {
                ...q,
                shuffledAnswers: answers.sort(() => Math.random() - 0.5)
            };
        });
    }

    // Initial preparation
    prepareQuestions();

    function render() {
        // Nettoyage et classe de base
        container.innerHTML = '';

        const root = document.createElement('div');
        root.className = 'millionnaire-simulator';

        const wrapper = document.createElement('div');
        wrapper.className = 'millionnaire-wrapper';

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'millionnaire-header';

        // Use translation or fallback. Since we are in JS module, we use the imported translations object.
        // Assuming 'millionnaire_intro' key might exist or we use hardcoded french from screenshot request.
        const introText = "Réponds aux questions qui te seront posées !";

        header.innerHTML = `
            <div class="millionnaire-nav-tabs">
                <span class="active">${data.title || 'Millionnaire'}</span>
            </div>
            <p class="millionnaire-intro">${introText}</p>
        `;
        const navTabs = header.querySelector('.millionnaire-nav-tabs');
        if (navTabs) {
            navTabs.style.display = 'flex';
            navTabs.style.justifyContent = 'space-between';
            navTabs.style.alignItems = 'center';
            navTabs.style.width = '100%';
            navTabs.appendChild(createFullscreenButton(true));
        }

        wrapper.appendChild(header);

        // --- End Screen ---
        if (isFinished) {
            const endScreenDiv = document.createElement('div');
            endScreenDiv.className = 'millionnaire-end-screen';
            endScreenDiv.innerHTML = `
                <div class="millionnaire-fireworks-left"></div>
                <div class="millionnaire-end-content">
                    <h2>Bravo ! Tu remportes...</h2>
                    <div class="millionnaire-final-score">
                        <i class="fas fa-star"></i> 1 000 000 points
                    </div>
                </div>
                <div class="millionnaire-fireworks-right"></div>
            `;
            wrapper.appendChild(endScreenDiv);
            root.appendChild(wrapper);
            container.appendChild(root);


            // Rendu mathématique
            mathRenderer.renderMath(root);
            return;
        }

        // --- Game Area ---
        const gameArea = document.createElement('div');
        gameArea.className = 'millionnaire-game-area';

        // 1. Question Column (Left)
        const questionCol = document.createElement('div');
        questionCol.className = 'millionnaire-question-col';

        const currentQ = questionsWithShuffledAnswers[currentQuestionIndex];

        // Question Box
        const questionBox = document.createElement('div');
        questionBox.className = 'millionnaire-question-box';
        // "Question X : ..." logic
        questionBox.innerHTML = `<span class="question-label">Question ${currentQuestionIndex + 1} :</span> ${currentQ.question}`;

        // Answers Grid
        const answersDiv = document.createElement('div');
        answersDiv.className = 'millionnaire-answers';

        currentQ.shuffledAnswers.forEach((ans, idx) => {
            const btn = document.createElement('button');
            btn.className = 'millionnaire-answer-btn';
            btn.textContent = ans.text;

            // State styling
            if (hasValidated) {
                // Determine styling based on correctness and selection
                if (ans.correct) {
                    btn.classList.add('correct'); // Always show green for correct answer
                    // Add checkmark icon
                    btn.innerHTML += `&nbsp;<i class="fas fa-check"></i>`;
                } else if (idx === selectedAnswerIndex) {
                    btn.classList.add('wrong'); // Red if selected and wrong
                    btn.innerHTML += `&nbsp;<i class="fas fa-times"></i>`;
                }
                btn.disabled = true; // Disable clicking
            } else {
                btn.onclick = () => handleAnswerClick(idx, ans.correct);
            }

            answersDiv.appendChild(btn);
        });

        // Action Buttons (Next / Restart)
        const actionBtnContainer = document.createElement('div');
        actionBtnContainer.className = 'millionnaire-action-bar';

        if (hasValidated) {
            const selectedAns = currentQ.shuffledAnswers[selectedAnswerIndex];
            if (selectedAns && selectedAns.correct) {
                // Correct answer -> Show "Next Question"
                const nextBtn = document.createElement('button');
                nextBtn.className = 'millionnaire-next-btn';
                nextBtn.textContent = 'QUESTION SUIVANTE';
                nextBtn.onclick = handleNextQuestion;
                actionBtnContainer.appendChild(nextBtn);
            } else {
                // Wrong answer -> Show "Restart"
                const restartBtn = document.createElement('button');
                restartBtn.className = 'millionnaire-restart-btn';
                restartBtn.textContent = 'RECOMMENCER';
                restartBtn.onclick = handleRestart;
                actionBtnContainer.appendChild(restartBtn);
            }
        }

        questionCol.appendChild(questionBox);
        questionCol.appendChild(answersDiv);
        questionCol.appendChild(actionBtnContainer);

        // 2. Pyramid Column (Right)
        const pyramidCol = document.createElement('div');
        pyramidCol.className = 'millionnaire-pyramid-col';
        const pyramidList = document.createElement('ul');
        pyramidList.className = 'millionnaire-pyramid';

        levels.forEach((val, index) => {
            // levels array is "1 000 000" (index 0) to "500" (index 5)
            // Questions are 1 (index 0) to 6 (index 5)
            // Question 1 corresponds to level "500" (levels[5])
            // Question 6 corresponds to level "1 000 000" (levels[0])

            const correspondingQuestionIndex = levels.length - 1 - index;
            const li = document.createElement('li');
            li.className = 'millionnaire-level';

            // Active state: The level currently being played.
            if (correspondingQuestionIndex === currentQuestionIndex) {
                li.classList.add('current');
                li.innerHTML = `<i class="fas fa-star" style="margin-right:8px; font-size:0.8em;"></i> ${val} points`;
            } else if (correspondingQuestionIndex < currentQuestionIndex) {
                // Passed levels (optional styling, traditionally they just stay "won")
                li.classList.add('passed');
                li.textContent = `${val} points`;
            } else {
                li.textContent = `${val} points`;
            }

            pyramidList.appendChild(li);
        });

        pyramidCol.appendChild(pyramidList);

        gameArea.appendChild(questionCol);
        gameArea.appendChild(pyramidCol);

        wrapper.appendChild(gameArea);
        root.appendChild(wrapper);
        container.appendChild(root);



        // Rendu mathématique
        mathRenderer.renderMath(root);
    }



    // --- Event Handlers ---

    function handleAnswerClick(index, isCorrect) {
        selectedAnswerIndex = index;
        hasValidated = true;
        render(); // Re-render to show feedback
    }

    function handleNextQuestion() {
        if (currentQuestionIndex < questionsWithShuffledAnswers.length - 1) {
            currentQuestionIndex++;
            hasValidated = false;
            selectedAnswerIndex = null;
            render();
        } else {
            // Finished game
            isFinished = true;
            render();
        }
    }

    function handleRestart() {
        currentQuestionIndex = 0;
        hasValidated = false;
        selectedAnswerIndex = null;
        isFinished = false;
        prepareQuestions();
        render();
    }

    // Initial render
    render();
}

/**
 * Rendu du simulateur pour l'activité Appariement (Style "Fusion & Remontée").
 * @param {HTMLElement} container - Le conteneur DOM où injecter le simulateur.
 * @param {Object} data - Le JSON de l'activité (contient title et pairs).
 */
export function renderMatching(container, data) {
    if (!container || !data || !data.pairs) return;

    // --- State Management ---
    // We track items by unique ID.
    // Left Items: { id, text, type: 'left', originalPairId }
    // Right Items: { id, text, type: 'right', originalPairId }

    let allLeftItems = data.pairs.map((p, i) => ({
        id: `L${i + 1}`,
        text: p.question,
        type: 'left',
        originalPairId: i + 1
    }));

    let allRightItems = data.pairs.map((p, i) => ({
        id: `R${i + 1}`,
        text: p.answer,
        type: 'right',
        originalPairId: i + 1
    }));

    // Initial State
    // Shuffled right items
    allRightItems.sort(() => Math.random() - 0.5);

    // Matches: Array of { left: Item, right: Item }
    let matches = [];

    // Selection
    let selectedItem = null; // { id, type }
    let isFinished = false;

    function render() {
        container.innerHTML = '';

        const root = document.createElement('div');
        root.className = 'matching-simulator';

        const wrapper = document.createElement('div');
        wrapper.className = 'matching-wrapper';

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'matching-header';

        // Titre style Millionnaire/QCM (petit, gauche, souligné)
        header.innerHTML = `
            <div class="matching-nav-tabs">
                <span class="active">${data.title || 'Appariement'}</span>
            </div>
            <p class="matching-intro">${data.intro || "Bonjour les mathématiciens ! Dans cette activité, tu vas associer chaque type de quadrilatère à sa définition..."}</p>
        `;
        const navTabs = header.querySelector('.matching-nav-tabs');
        if (navTabs) {
            navTabs.style.display = 'flex';
            navTabs.style.justifyContent = 'space-between';
            navTabs.style.alignItems = 'center';
            navTabs.style.width = '100%';
            navTabs.appendChild(createFullscreenButton(true));
        }

        wrapper.appendChild(header);

        // --- Game Area ---
        const gameArea = document.createElement('div');
        gameArea.className = 'matching-game-area';

        // 1. Matched List (Top)
        const matchedList = document.createElement('div');
        matchedList.className = 'matching-matched-list';

        matches.forEach((match, index) => {
            const row = document.createElement('div');
            row.className = 'matching-fused-row';

            // Visual feedback if finished
            let feedbackClass = '';
            let iconHtml = '';
            if (isFinished) {
                if (match.left.originalPairId === match.right.originalPairId) {
                    feedbackClass = 'correct';
                    iconHtml = '<i class="fas fa-check"></i>';
                } else {
                    feedbackClass = 'wrong';
                    iconHtml = '<i class="fas fa-times"></i>';
                }
            }

            if (feedbackClass) row.classList.add(feedbackClass);

            row.innerHTML = `
                <div class="fused-left">${match.left.text}</div>
                <div class="fused-right">${match.right.text}</div>
                <div class="fused-actions">
                    ${!isFinished ? `<button class="unlink-btn" title="Dissocier"><i class="fas fa-unlink"></i></button>` : iconHtml}
                </div>
            `;

            if (!isFinished) {
                row.querySelector('.unlink-btn').onclick = () => handleUnlink(index);
            }

            matchedList.appendChild(row);
        });

        gameArea.appendChild(matchedList);

        // Hide matched list if empty to avoid gaps
        matchedList.style.display = matches.length > 0 ? 'flex' : 'none';

        // 2. Unmatched Pools (Bottom)
        // Filter out items that are already in matches
        const matchedLeftIds = matches.map(m => m.left.id);
        const matchedRightIds = matches.map(m => m.right.id);

        const remainingLeft = allLeftItems.filter(i => !matchedLeftIds.includes(i.id));
        const remainingRight = allRightItems.filter(i => !matchedRightIds.includes(i.id));

        if (remainingLeft.length > 0 || remainingRight.length > 0) {
            const poolsContainer = document.createElement('div');
            poolsContainer.className = 'matching-pools';

            // Left Pool
            const leftPoolDiv = document.createElement('div');
            leftPoolDiv.className = 'matching-pool left-pool';
            remainingLeft.forEach(item => {
                const el = createItemElement(item);
                leftPoolDiv.appendChild(el);
            });

            // Right Pool
            const rightPoolDiv = document.createElement('div');
            rightPoolDiv.className = 'matching-pool right-pool';
            remainingRight.forEach(item => {
                const el = createItemElement(item);
                rightPoolDiv.appendChild(el);
            });

            poolsContainer.appendChild(leftPoolDiv);
            poolsContainer.appendChild(rightPoolDiv);
            gameArea.appendChild(poolsContainer);
        } else if (matches.length > 0 && !isFinished) {
            const msg = document.createElement('div');
            msg.className = 'matching-all-paired-msg';
            msg.textContent = "";
            gameArea.appendChild(msg);
        }

        wrapper.appendChild(gameArea);

        // --- Action Bar ---
        const actionBar = document.createElement('div');
        actionBar.className = 'matching-action-bar';

        if (!isFinished) {
            const checkBtn = document.createElement('button');
            checkBtn.className = 'matching-check-btn';
            checkBtn.textContent = 'Vérifier la réponse';
            // Enable only if all matched
            if (matches.length < allLeftItems.length) {
                checkBtn.disabled = true;
            }
            checkBtn.onclick = handleCheck;
            actionBar.appendChild(checkBtn);
        } else {
            const restartBtn = document.createElement('button');
            restartBtn.className = 'matching-restart-btn';
            restartBtn.textContent = 'Recommencer';
            restartBtn.onclick = handleRestart;
            actionBar.appendChild(restartBtn);
        }

        wrapper.appendChild(actionBar);
        root.appendChild(wrapper);
        container.appendChild(root); // Safe append to root simulator container provided by caller


        // Rendu mathématique
        mathRenderer.renderMath(root);
    }

    function createItemElement(item) {
        const el = document.createElement('div');
        el.className = 'matching-pool-item';
        el.innerHTML = item.text;

        if (selectedItem && selectedItem.id === item.id) {
            el.classList.add('selected');
        }

        if (!isFinished) {
            el.onclick = () => handleItemClick(item);
        } else {
            el.classList.add('disabled');
        }

        return el;
    }



    // --- Logic ---

    function handleItemClick(item) {
        if (isFinished) return;

        if (!selectedItem) {
            // First selection
            selectedItem = item;
        } else {
            // Second selection
            if (selectedItem.id === item.id) {
                // Deselect if same
                selectedItem = null;
            } else if (selectedItem.type === item.type) {
                // Change selection if same side
                selectedItem = item;
            } else {
                // Pair them!
                const left = selectedItem.type === 'left' ? selectedItem : item;
                const right = selectedItem.type === 'right' ? selectedItem : item;

                matches.push({ left, right });
                selectedItem = null;
            }
        }
        render();
    }

    function handleUnlink(index) {
        if (isFinished) return;
        matches.splice(index, 1);
        render();
    }

    function handleCheck() {
        isFinished = true;
        selectedItem = null;
        render();
    }

    function handleRestart() {
        isFinished = false;
        matches = [];
        selectedItem = null;
        allRightItems.sort(() => Math.random() - 0.5);
        render();
    }

    render();
}

/**
 * Rendu du simulateur pour le Glossaire.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON (contient name, entries...).
 */
export function renderGlossary(container, data) {
    if (!container || !data || !Array.isArray(data.entries)) return;

    // --- State Management ---
    // Sort entries alphabetically by concept
    let entries = [...data.entries].sort((a, b) => a.concept.localeCompare(b.concept));

    // Simple parser for bold (**text**) and italic (*text*)
    function parseFormatting(text) {
        if (!text) return '';
        let html = text;
        // Bold: **text** -> <strong>text</strong>
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text* -> <em>text</em>
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return html;
    }

    function render() {
        container.innerHTML = '';

        const root = document.createElement('div');
        root.className = 'glossary-simulator';

        const wrapper = document.createElement('div');
        wrapper.className = 'glossary-wrapper';

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'glossary-header';
        header.innerHTML = `
            <div class="glossary-title-row">
                <h2>${data.name || 'Glossaire'}</h2>
            </div>
        `;
        const titleRow = header.querySelector('.glossary-title-row');
        if (titleRow) {
            titleRow.style.display = 'flex';
            titleRow.style.justifyContent = 'space-between';
            titleRow.style.alignItems = 'center';
            titleRow.appendChild(createFullscreenButton(true));
        }

        wrapper.appendChild(header);

        // --- Entries List ---
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'glossary-entries-compact';

        if (entries.length === 0) {
            entriesContainer.innerHTML = `<p class="glossary-no-results">Aucune entrée dans ce glossaire.</p>`;
        } else {
            entries.forEach(entry => {
                const card = document.createElement('div');
                card.className = 'glossary-entry-compact';

                // Parsed definition
                const definitionHtml = parseFormatting(entry.definition);

                card.innerHTML = `
                    <div class="glossary-term">${entry.concept}</div>
                    <div class="glossary-def">${definitionHtml}</div>
                `;
                entriesContainer.appendChild(card);
            });
        }

        wrapper.appendChild(entriesContainer);
        root.appendChild(wrapper);
        container.appendChild(root);


        // Rendu mathématique
        mathRenderer.renderMath(root);
    }



    render();
}

/**
 * Rendu du simulateur pour l'activité QCM Éléa.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON de l'activité.
 */
export function renderQcmElea(container, data) {
    if (!container || !data || !data.questions) return;

    // --- State ---
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedAnswerIndex = null; // null ou index
    let isFinished = false;
    let hasValidated = false; // true si l'utilisateur a cliqué sur "Vérifier"

    // Normalisation des questions (gestion du format simple vs format complet)
    // On s'attend à data.questions = [{ text, answers: [{text, correct}, ...] }]
    // Support pour le format Éléa où correct peut être un booléen OU iscorrect peut être 1/0
    const questions = data.questions.map(q => ({
        ...q,
        answers: q.answers.map(ans => ({
            ...ans,
            correct: ans.correct !== undefined ? ans.correct : (ans.iscorrect === 1)
        }))
    }));

    function render() {
        container.innerHTML = '';

        const root = document.createElement('div');
        root.className = 'qcm-simulator';

        // --- Header (Toujours visible) ---
        const header = document.createElement('div');
        header.className = 'qcm-header simplified';

        if (data.title) {
            header.innerHTML = `
                <div class="qcm-nav-tabs">
                    <span class="active">${data.title}</span>
                </div>
            `;
            const navTabs = header.querySelector('.qcm-nav-tabs');
            if (navTabs) {
                navTabs.style.justifyContent = 'space-between';
                navTabs.style.width = '100%';
                navTabs.appendChild(createFullscreenButton(true));
            }
        }
        root.appendChild(header);

        // --- Écran de fin ---
        if (isFinished) {
            const percentage = Math.round((score / questions.length) * 100);

            const endScreen = document.createElement('div');
            endScreen.className = 'qcm-end-screen';
            endScreen.innerHTML = `
                <div class="qcm-header-text">Répondez aux questions suivantes.</div>
                <div class="qcm-result-card">
                    <div class="qcm-score-line">Score obtenu : ${percentage}%</div>
                    <div class="qcm-score-line">Meilleur score : ${percentage}%</div>
                    <div class="qcm-score-info">Seul le meilleur score est conservé.</div>
                    <button class="qcm-btn restart-btn">RECOMMENCER</button>
                </div>
            `;

            endScreen.querySelector('.restart-btn').onclick = handleRestart;

            root.appendChild(endScreen);
            container.appendChild(root);


            // Rendu mathématique
            mathRenderer.renderMath(root);
            return;
        }

        // --- Écran de jeu ---
        const wrapper = document.createElement('div');
        wrapper.className = 'qcm-wrapper';
        wrapper.appendChild(header); // Move header inside wrapper for layout consistency



        // Helper simple de formatage Markdown
        const formatText = (text) => {
            if (!text) return '';
            let formatted = text
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\*(.*?)\*/g, '<i>$1</i>');
            return formatted;
        };

        // Header logic moved up

        // Question
        const currentQ = questions[currentQuestionIndex];
        const questionContainer = document.createElement('div');
        questionContainer.className = 'qcm-question-container';

        // Label Question (Question 1 : ...)
        const questionLabel = document.createElement('div');
        questionLabel.className = 'qcm-question-label';

        // Nettoyage sommaire du HTML dans le texte de la question pour l'affichage propre
        let qText = currentQ.text || '';
        // Enlever les balises <p> englobantes pour permettre l'affichage inline
        qText = qText.replace(/^\s*<p[^>]*>/i, '').replace(/<\/p>\s*$/i, '');

        // Application du formatage markdown simple
        qText = formatText(qText);

        // Si c'est wrapped dans <p>, on essaie de garder le style, sinon on affiche direct
        questionLabel.innerHTML = `<span class="qcm-q-num">Question ${currentQuestionIndex + 1} :</span> ${qText}`;
        questionContainer.appendChild(questionLabel);

        // Réponses
        const answersList = document.createElement('div');
        answersList.className = 'qcm-answers-list';

        if (currentQ.answers && Array.isArray(currentQ.answers)) {
            currentQ.answers.forEach((ans, idx) => {
                const ansCard = document.createElement('div');
                ansCard.className = 'qcm-answer-card';

                // État visuel
                if (hasValidated) {
                    // Mode correction
                    if (ans.correct) {
                        ansCard.classList.add('correct');
                        ansCard.innerHTML = `
                            <div class="qcm-ans-text">${ans.text}</div>
                            <div class="qcm-ans-icon"><i class="fas fa-check"></i></div>
                        `;
                    } else if (idx === selectedAnswerIndex) {
                        ansCard.classList.add('wrong');
                        ansCard.innerHTML = `
                            <div class="qcm-ans-text">${ans.text}</div>
                            <div class="qcm-ans-icon"><i class="fas fa-times"></i></div>
                        `;
                    } else {
                        // Réponses non sélectionnées et fausses : neutre ou désactivé
                        ansCard.innerHTML = `<div class="qcm-ans-text">${ans.text}</div>`;
                        ansCard.classList.add('disabled');
                    }
                } else {
                    // Mode sélection
                    ansCard.innerHTML = `<div class="qcm-ans-text">${ans.text}</div>`;
                    if (idx === selectedAnswerIndex) {
                        ansCard.classList.add('selected');
                    }
                    ansCard.onclick = () => handleAnswerClick(idx);
                }

                answersList.appendChild(ansCard);
            });
        }
        questionContainer.appendChild(answersList);

        // Feedback Text (Bonne réponse / Mauvaise réponse) après validation
        if (hasValidated) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'qcm-feedback-text';
            const isCorrect = currentQ.answers[selectedAnswerIndex]?.correct;
            feedbackDiv.textContent = isCorrect ? "Bonne réponse" : "Mauvaise réponse";
            feedbackDiv.style.fontStyle = 'italic';
            feedbackDiv.style.margin = '20px 0';
            feedbackDiv.style.textAlign = 'center';
            feedbackDiv.style.color = '#1d1d1f';
            questionContainer.appendChild(feedbackDiv);
        }

        // Bouton d'action
        const actionBtnContainer = document.createElement('div');
        actionBtnContainer.className = 'qcm-action-bar';

        const actionBtn = document.createElement('button');
        actionBtn.className = 'qcm-btn';

        if (hasValidated) {
            actionBtn.textContent = 'QUESTION SUIVANTE';
            actionBtn.onclick = handleNext;
        } else {
            actionBtn.textContent = 'VÉRIFIER LA RÉPONSE';
            // Désactivé si rien n'est sélectionné
            if (selectedAnswerIndex === null) {
                actionBtn.disabled = true;
                actionBtn.style.opacity = '0.5';
                actionBtn.style.cursor = 'not-allowed';
            }
            actionBtn.onclick = handleCheck;
        }

        actionBtnContainer.appendChild(actionBtn);
        questionContainer.appendChild(actionBtnContainer);

        wrapper.appendChild(questionContainer);
        root.appendChild(wrapper);
        container.appendChild(root);


        // Rendu mathématique
        mathRenderer.renderMath(root);
    }



    // --- Logic ---

    function handleAnswerClick(index) {
        if (hasValidated) return;
        selectedAnswerIndex = index;
        render();
    }

    function handleCheck() {
        if (selectedAnswerIndex === null) return;

        hasValidated = true;
        const currentQ = questions[currentQuestionIndex];
        // Vérif bonne réponse
        if (currentQ.answers[selectedAnswerIndex].correct) {
            score++;
        }
        render();
    }

    function handleNext() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            selectedAnswerIndex = null;
            hasValidated = false;
            render();
        } else {
            isFinished = true;
            render();
        }
    }

    function handleRestart() {
        currentQuestionIndex = 0;
        score = 0;
        selectedAnswerIndex = null;
        hasValidated = false;
        isFinished = false;
        render();
    }

    render();
}

/**
 * Rendu du simulateur pour l'activité Test Moodle/Éléa.
 * Prend en charge les types : multichoice, matching, numerical, truefalse, shortanswer, cloze.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON de l'activité.
 */
export function renderEleaTest(container, data) {
    console.log("renderEleaTest called with:", data);
    if (!container) {
        console.error("renderEleaTest: No container provided");
        return;
    }

    let questions = [];
    if (data && Array.isArray(data.questions)) {
        questions = data.questions;
        console.log("renderEleaTest: Found questions in data.questions, count:", questions.length);
    } else if (Array.isArray(data)) {
        questions = data;
        console.log("renderEleaTest: Data is array, count:", questions.length);
    } else {
        console.error("renderEleaTest: Invalid data format", data);
        container.innerHTML = '<div class="elea-test-simulator"><div class="elea-test-card"><p class="elea-error" style="color:red; text-align:center;">Erreur : Format de données invalide pour le simulateur.</p></div></div>';
        return;
    }

    if (questions.length === 0) {
        console.warn("renderEleaTest: No questions to display");
        container.innerHTML = '<div class="elea-test-simulator"><div class="elea-test-card"><p class="elea-error" style="color:orange; text-align:center;">Aucune question à afficher.</p></div></div>';
        return;
    }

    console.log("renderEleaTest: Rendering", questions.length, "questions");

    // --- State ---
    let currentQuestionIndex = 0;
    // Stockage des réponses utilisateur : { [questionIndex]: answerValue }
    const userAnswers = {};
    const feedbackState = {}; // { [questionIndex]: { isCorrect: bool, message: string, show: bool } }

    // --- Helper functions (must be defined before render()) ---
    const formatMarkdown = (text) => {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br>');
    };

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // addWarning supprimé car géré par notifications.js (preview-modal__warning)

    function render() {
        container.innerHTML = '';
        const root = document.createElement('div');
        root.className = 'elea-test-simulator';

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'elea-test-header';

        // Titre et description
        const title = data.bank_name || 'Test Moodle/Éléa';
        const desc = data.bank_description || '';


        header.innerHTML = `
            <div class="elea-test-title-row">
                <span class="elea-test-icon"><i class="fas fa-clipboard-list"></i></span>
                <span class="elea-test-title">${title}</span>
                <div class="elea-test-nav-arrows">
                    ${currentQuestionIndex > 0 ? '<button class="elea-nav-arrow prev" id="elea-prev-arrow"><i class="fas fa-chevron-left"></i></button>' : ''}
                    ${currentQuestionIndex < questions.length - 1 ? '<button class="elea-nav-arrow next" id="elea-next-arrow"><i class="fas fa-chevron-right"></i></button>' : ''}
                </div>
            </div>
            ${desc ? `<div class="elea-test-desc">${desc}</div>` : ''}
            <div class="elea-test-progress">Question ${currentQuestionIndex + 1} / ${questions.length}</div>
        `;
        const navArrows = header.querySelector('.elea-test-nav-arrows');
        if (navArrows) navArrows.appendChild(createFullscreenButton(true));

        root.appendChild(header);

        // --- Question Card ---
        const qData = questions[currentQuestionIndex];
        const content = qData.content;
        const qType = qData.type;

        const card = document.createElement('div');
        card.className = 'elea-test-card';

        // En-tête de la question (Nom et texte)
        const qHeader = document.createElement('div');
        qHeader.className = 'elea-question-header';
        // Pour cloze, ne pas afficher le questiontext brut (il sera rendu par renderCloze)
        if (qType === 'cloze') {
            qHeader.innerHTML = `
                <div class="elea-question-name">${content.name || `Question ${currentQuestionIndex + 1}`}</div>
            `;
        } else {
            qHeader.innerHTML = `
                <div class="elea-question-name">${content.name || `Question ${currentQuestionIndex + 1}`}</div>
                <div class="elea-question-text">${formatMarkdown(content.questiontext)}</div>
            `;
        }
        card.appendChild(qHeader);

        // Zone de réponse
        const answerZone = document.createElement('div');
        answerZone.className = 'elea-answer-zone';

        // Rendu spécifique selon le type
        switch (qType) {
            case 'multichoice': renderMultichoice(answerZone, content, currentQuestionIndex); break;
            case 'matching': renderMatchingType(answerZone, content, currentQuestionIndex); break;
            case 'numerical': renderNumerical(answerZone, content, currentQuestionIndex); break;
            case 'truefalse': renderTrueFalse(answerZone, content, currentQuestionIndex); break;
            case 'shortanswer': renderShortAnswer(answerZone, content, currentQuestionIndex); break;
            case 'cloze': renderCloze(answerZone, content, currentQuestionIndex); break;
            default: answerZone.innerHTML = '<p class="elea-error">Type de question non supporté.</p>';
        }

        card.appendChild(answerZone);

        // Zone de feedback (après validation)
        const fState = feedbackState[currentQuestionIndex];
        if (fState && fState.show) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = `elea-feedback ${fState.isCorrect ? 'correct' : 'incorrect'}`;
            feedbackDiv.innerHTML = `
                <div class="elea-feedback-icon"><i class="fas ${fState.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i></div>
                <div class="elea-feedback-content">
                    <div class="elea-feedback-title">${fState.isCorrect ? 'Correct !' : 'Incorrect'}</div>
                    <div class="elea-feedback-text">${formatMarkdown(fState.message)}</div>
                </div>
            `;
            card.appendChild(feedbackDiv);
        }

        root.appendChild(card);

        // --- Actions Footer ---
        const footer = document.createElement('div');
        footer.className = 'elea-test-footer';

        // Bouton Valider / Suivant
        const actionBtn = document.createElement('button');
        actionBtn.className = 'elea-btn primary';

        if (fState && fState.show) {
            // Si feedback affiché => bouton Suivant (ou Terminer)
            if (currentQuestionIndex < questions.length - 1) {
                actionBtn.textContent = 'Question Suivante';
                actionBtn.onclick = handleNext;
            } else {
                actionBtn.textContent = 'Terminer le test';
                actionBtn.onclick = handleFinish;
            }
        } else {
            // Pas de feedback => bouton Valider
            actionBtn.textContent = 'Vérifier';
            actionBtn.onclick = () => handleCheck(qType, content, currentQuestionIndex);
        }

        // Navigation simple Précédent (optionnel)
        if (currentQuestionIndex > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'elea-btn secondary';
            prevBtn.textContent = 'Précédent';
            prevBtn.onclick = handlePrev;
            footer.appendChild(prevBtn);
        }

        footer.appendChild(actionBtn);
        root.appendChild(footer);

        container.appendChild(root);
        // addWarning(root); // Enlevé car déjà présent dans la modale preview-modal__warning

        // Attach arrow navigation handlers
        const prevArrow = root.querySelector('#elea-prev-arrow');
        const nextArrow = root.querySelector('#elea-next-arrow');
        if (prevArrow) prevArrow.onclick = handlePrev;
        if (nextArrow) nextArrow.onclick = handleNext;

        // Rendu mathématique
        mathRenderer.renderMath(root);
    }

    // --- Rendeurs spécifiques ---

    function renderMultichoice(container, content, qIdx) {
        const answers = content.answers || [];
        // Single or multiple? content.single usually "true" or "false" string or bool
        const isSingle = String(content.single) !== 'false';

        const list = document.createElement('div');
        list.className = 'elea-options-list';

        answers.forEach((ans, idx) => {
            const opt = document.createElement('div');
            opt.className = 'elea-option-item';

            // Check state
            const isSelected = userAnswers[qIdx] !== undefined && (isSingle ? userAnswers[qIdx] === idx : userAnswers[qIdx].includes(idx));
            if (isSelected) opt.classList.add('selected');

            // Feedback state visualization
            const fState = feedbackState[qIdx];
            if (fState && fState.show) {
                opt.classList.add('disabled');
                if (ans.fraction > 0) opt.classList.add('should-be-selected'); // Indiquer les bonnes réponses
                if (isSelected && ans.fraction <= 0) opt.classList.add('wrong-selection');
            } else {
                opt.onclick = () => {
                    if (isSingle) {
                        userAnswers[qIdx] = idx;
                    } else {
                        const current = userAnswers[qIdx] || [];
                        const newSelection = current.includes(idx)
                            ? current.filter(i => i !== idx)
                            : [...current, idx];
                        userAnswers[qIdx] = newSelection;
                    }
                    render();
                };
            }

            const icon = isSingle
                ? (isSelected ? '<i class="far fa-dot-circle"></i>' : '<i class="far fa-circle"></i>')
                : (isSelected ? '<i class="far fa-check-square"></i>' : '<i class="far fa-square"></i>');

            opt.innerHTML = `
                <div class="elea-opt-icon">${icon}</div>
                <div class="elea-opt-text">${formatMarkdown(ans.text)}</div>
            `;
            list.appendChild(opt);
        });
        container.appendChild(list);
    }

    function renderMatchingType(container, content, qIdx) {
        const subquestions = content.subquestions || [];
        // Créer un pool de réponses uniques pour les listes déroulantes
        const answersPool = Array.from(new Set(subquestions.map(sq => sq.answer))).sort();

        const list = document.createElement('div');
        list.className = 'elea-matching-list';

        subquestions.forEach((sq, idx) => {
            const row = document.createElement('div');
            row.className = 'elea-matching-row';

            const label = document.createElement('div');
            label.className = 'elea-matching-label';
            label.innerHTML = formatMarkdown(sq.text);

            const select = document.createElement('select');
            select.className = 'elea-select';
            select.disabled = feedbackState[qIdx]?.show;

            let optionsHtml = `<option value="">Choisir...</option>`;
            answersPool.forEach(a => {
                const isSelected = userAnswers[qIdx] && userAnswers[qIdx][idx] === a;
                optionsHtml += `<option value="${escapeHtml(a)}" ${isSelected ? 'selected' : ''}>${escapeHtml(a)}</option>`;
            });
            select.innerHTML = optionsHtml;

            select.onchange = (e) => {
                const current = userAnswers[qIdx] || {};
                current[idx] = e.target.value;
                userAnswers[qIdx] = current;
            };

            row.appendChild(label);
            row.appendChild(select);
            list.appendChild(row);
        });
        container.appendChild(list);
    }

    function renderNumerical(container, content, qIdx) {
        const wrapper = document.createElement('div');
        wrapper.className = 'elea-input-wrapper';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'elea-input';
        input.placeholder = 'Votre réponse numérique...';
        input.value = userAnswers[qIdx] || '';
        input.disabled = feedbackState[qIdx]?.show;
        input.oninput = (e) => {
            userAnswers[qIdx] = e.target.value;
        };

        wrapper.appendChild(input);
        container.appendChild(wrapper);
    }

    function renderTrueFalse(container, content, qIdx) {
        // Similar to multichoice single but fixed True/False
        const options = [{ text: 'Vrai', val: true }, { text: 'Faux', val: false }];
        const list = document.createElement('div');
        list.className = 'elea-options-list';

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'elea-option-item';
            const isSelected = userAnswers[qIdx] === opt.val;
            if (isSelected) item.classList.add('selected');

            // Visual feedback
            const fState = feedbackState[qIdx];
            if (fState && fState.show) {
                item.classList.add('disabled');
                // Correct answer check
                const isCorrectVal = (opt.val === content.answer.value);
                if (isCorrectVal) item.classList.add('should-be-selected');
                if (isSelected && !isCorrectVal) item.classList.add('wrong-selection');
            } else {
                item.onclick = () => {
                    userAnswers[qIdx] = opt.val;
                    render();
                };
            }

            const icon = isSelected ? '<i class="far fa-dot-circle"></i>' : '<i class="far fa-circle"></i>';
            item.innerHTML = `
                <div class="elea-opt-icon">${icon}</div>
                <div class="elea-opt-text">${opt.text}</div>
            `;
            list.appendChild(item);
        });
        container.appendChild(list);
    }

    function renderShortAnswer(container, content, qIdx) {
        const wrapper = document.createElement('div');
        wrapper.className = 'elea-input-wrapper';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'elea-input';
        input.placeholder = 'Votre réponse courte...';
        input.value = userAnswers[qIdx] || '';
        input.disabled = feedbackState[qIdx]?.show;
        input.oninput = (e) => {
            userAnswers[qIdx] = e.target.value;
        };
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    }

    function renderCloze(container, content, qIdx) {
        // Syntax: {1:MULTICHOICE:=Correct~Wrong} or {1:SHORTANSWER:=Correct}
        // Simplified regex parser
        const text = content.questiontext;
        const parts = text.split(/(\{\d+:[^}]+\})/); // Split by {...}

        const wrapper = document.createElement('div');
        wrapper.className = 'elea-cloze-text';

        userAnswers[qIdx] = userAnswers[qIdx] || {};

        parts.forEach((part, partIdx) => {
            if (part.match(/^\{\d+:[^}]+\}$/)) {
                // It's a gap
                // Extract inner: 1:TYPE:=A~B
                const inner = part.slice(1, -1);
                const firstColon = inner.indexOf(':');
                const secondColon = inner.indexOf(':', firstColon + 1);

                // Safety check
                if (firstColon === -1 || secondColon === -1) {
                    const span = document.createElement('span');
                    span.textContent = part;
                    wrapper.appendChild(span);
                    return;
                }

                const typeInfo = inner.substring(firstColon + 1, secondColon); // e.g., MULTICHOICE
                const answersStr = inner.substring(secondColon + 1); // e.g., =Correct~Wrong

                const answers = answersStr.split('~');

                if (typeInfo.toUpperCase().includes('MULTICHOICE') || typeInfo.toUpperCase().includes('GAPSELECT')) {
                    // Dropdown
                    const select = document.createElement('select');
                    select.className = 'elea-cloze-select';
                    select.disabled = feedbackState[qIdx]?.show;
                    select.innerHTML = '<option value="">?</option>' +
                        answers.map(a => {
                            const cleanA = a.replace(/^=/, ''); // Remove leading =
                            return `<option value="${escapeHtml(cleanA)}" ${userAnswers[qIdx][partIdx] === cleanA ? 'selected' : ''}>${escapeHtml(cleanA)}</option>`;
                        }).join('');

                    select.onchange = (e) => {
                        userAnswers[qIdx][partIdx] = e.target.value;
                    };
                    wrapper.appendChild(select);
                } else {
                    // Shortanswer / Numerical
                    const input = document.createElement('input');
                    input.className = 'elea-cloze-input';
                    input.type = 'text';
                    input.value = userAnswers[qIdx][partIdx] || '';
                    input.disabled = feedbackState[qIdx]?.show;
                    input.style.width = '100px';
                    input.oninput = (e) => {
                        userAnswers[qIdx][partIdx] = e.target.value;
                    };
                    wrapper.appendChild(input);
                }

            } else {
                // Regular text
                const span = document.createElement('span');
                span.innerHTML = formatMarkdown(part);
                wrapper.appendChild(span);
            }
        });
        container.appendChild(wrapper);
    }

    // --- Logic Handlers ---

    function handleCheck(type, content, idx) {
        if (feedbackState[idx]?.show) return; // Already checked

        let isCorrect = false;
        let message = content.feedback || '';

        // Verification logic (Simplified for simulation)
        switch (type) {
            case 'multichoice':
                const uAns = userAnswers[idx];
                const answers = content.answers;
                if (content.single !== 'false' && content.single !== false) {
                    // Single
                    if (uAns !== undefined && answers[uAns]) {
                        if (answers[uAns].fraction > 0) isCorrect = true;
                        if (answers[uAns].feedback) message += "<br><br>" + answers[uAns].feedback;
                    }
                } else {
                    // Multiple
                    const selected = uAns || [];
                    const allCorrect = answers.every((a, i) => (a.fraction > 0) === selected.includes(i));
                    isCorrect = allCorrect;
                }
                break;
            case 'truefalse':
                isCorrect = (userAnswers[idx] === content.answer.value);
                message += "<br><br>" + (isCorrect ? content.answer.feedback_true : content.answer.feedback_false);
                break;
            case 'numerical':
                const num = parseFloat(userAnswers[idx]);
                const target = parseFloat(content.answer.number);
                const tol = parseFloat(content.answer.tolerance || 0);
                if (!isNaN(num) && Math.abs(num - target) <= tol) {
                    isCorrect = true;
                    message += "<br>" + (content.answer.feedback || '');
                }
                break;
            case 'shortanswer':
                // Case insensitive match with any correct answer
                const val = (userAnswers[idx] || '').trim().toLowerCase();
                const match = content.answers.find(a => a.text.trim().toLowerCase() === val && a.fraction > 0);
                if (match) {
                    isCorrect = true;
                    message += "<br>" + (match.feedback || '');
                }
                break;
            case 'matching':
                const subquestions = content.subquestions;
                const matches = userAnswers[idx] || {};
                isCorrect = subquestions.every((sq, i) => matches[i] === sq.answer);
                break;
            case 'cloze':
                // Real validation for CLOZE: check if all user answers match at least one correct option (=...)
                const text = content.questiontext;
                const parts = text.split(/(\{\d+:[^}]+\})/);
                const clozeAnswers = userAnswers[idx] || {};
                let allCorrect = true;
                let gapsFound = 0;

                parts.forEach((part, partIdx) => {
                    if (part.match(/^\{\d+:[^}]+\}$/)) {
                        gapsFound++;
                        const inner = part.slice(1, -1);
                        const firstColon = inner.indexOf(':');
                        const secondColon = inner.indexOf(':', firstColon + 1);

                        if (secondColon !== -1) {
                            const answersPart = inner.substring(secondColon + 1);
                            const options = answersPart.split('~');

                            // Correct answers are those starting with '='
                            const correctChoices = options
                                .filter(opt => opt.startsWith('='))
                                .map(opt => {
                                    // Remove leading '=' and any feedback after '#'
                                    let clean = opt.substring(1).split('#')[0].trim();
                                    // Handle cases like =Benito Mussolini/Mussolini (Moodle supports / for multiple correct short answers)
                                    return clean.split('/').map(sub => sub.toLowerCase().trim());
                                })
                                .flat();

                            const userAns = (clozeAnswers[partIdx] || '').trim().toLowerCase();
                            if (!correctChoices.includes(userAns)) {
                                allCorrect = false;
                            }
                        }
                    }
                });
                isCorrect = gapsFound > 0 ? allCorrect : false;
                break;
        }

        feedbackState[idx] = { show: true, isCorrect, message };
        render();
    }

    function handleNext() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            render();
        }
    }

    function handlePrev() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            render();
        }
    }

    function handleFinish() {
        container.innerHTML = `
            <div class="elea-test-end" style="position: relative;">
                <div class="elea-test-end-icon"><i class="fas fa-flag-checkered"></i></div>
                <h3>Test terminé !</h3>
                <p>Ceci était une prévisualisation de votre activité.</p>
                <div class="elea-actions">
                    <button class="elea-btn primary" onclick="document.querySelector('.preview-modal__close').click()">Fermer</button>
                    <button class="elea-btn secondary" id="elea-restart-btn">Recommencer</button>
                </div>
                <div class="elea-test-end-fullscreen" style="position: absolute; top: 15px; right: 15px;"></div>
            </div>
        `;
        const endFS = container.querySelector('.elea-test-end-fullscreen');
        if (endFS) endFS.appendChild(createFullscreenButton(true));
        // Helper to restart
        container.querySelector('#elea-restart-btn').onclick = () => {
            // Reset state
            currentQuestionIndex = 0;
            for (let k in userAnswers) delete userAnswers[k];
            for (let k in feedbackState) delete feedbackState[k];
            render();
        };

        // Rendu mathématique
        mathRenderer.renderMath(container);
    }

    // Initial render
    render();
}

/**
 * Rendu du simulateur pour l'activité Page Éléa.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON de l'activité.
 * @param {string} [previewHtml] - Le HTML pré-généré (identique à l'export).
 */
export function renderPage(container, data, previewHtml) {
    if (!container || !data) return;

    if (previewHtml) {
        // Mode "Fidelity": on utilise le HTML généré par le créateur
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'elea-page-fidelity-wrapper';
        wrapper.style.cssText = 'position: relative; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111827; background:#ffffff; padding:28px; border-radius:14px; max-width:1000px; margin:0 auto; line-height:1.65; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);';
        wrapper.innerHTML = previewHtml;

        const fsBtnContainer = document.createElement('div');
        fsBtnContainer.style.cssText = 'position: absolute; top: 15px; right: 15px;';
        fsBtnContainer.appendChild(createFullscreenButton(true));
        wrapper.appendChild(fsBtnContainer);

        container.appendChild(wrapper);

        // addWarning(container); // Redondant

        // Rendu mathématique si nécessaire (bien que le HTML généré devrait déjà être correct)
        mathRenderer.renderMath(wrapper);
        return;
    }

    // --- State ---
    const blocks = data.blocks || [];

    // Helper to format markdown-like text
    const formatText = (text) => {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br>');
    };

    function render() {
        container.innerHTML = '';
        const root = document.createElement('div');
        root.className = 'elea-page-simulator';

        // --- Titre global et intro ---
        if (data.title || data.intro) {
            const pageHeader = document.createElement('div');
            pageHeader.className = 'elea-page-main-header';

            let titleHtml = '';
            if (data.title) titleHtml = `<h1>${data.title}</h1>`;

            pageHeader.innerHTML = `
                <div class="elea-page-title-row" style="display:flex; justify-content:space-between; align-items:center;">
                    ${titleHtml}
                </div>
                ${data.intro ? `<div class="elea-page-intro">${formatText(data.intro)}</div>` : ''}
            `;

            const titleRow = pageHeader.querySelector('.elea-page-title-row');
            if (titleRow) titleRow.appendChild(createFullscreenButton(true));

            root.appendChild(pageHeader);
        }

        // --- Blocks ---
        const blocksContainer = document.createElement('div');
        blocksContainer.className = 'elea-page-blocks';

        blocks.forEach(block => {
            const blockDiv = document.createElement('div');
            blockDiv.className = `elea-page-block block-${block.type.replace('#', '')}`;

            const bData = block.data || {};

            switch (block.type) {
                case '#01_hero_header':
                    blockDiv.innerHTML = `
                        <div class="elea-hero-header">
                            <h2>${bData.title || ''}</h2>
                            <div class="elea-hero-subtitle">${bData.subtitle || ''}</div>
                        </div>
                    `;
                    break;

                case '#02_nav_summary':
                    if (bData.links) {
                        const linksHtml = bData.links.map(l => `<li><a href="${l.href}">${l.text}</a></li>`).join('');
                        blockDiv.innerHTML = `
                             <nav class="elea-summary">
                                <h3>Sommaire</h3>
                                <ul>${linksHtml}</ul>
                             </nav>
                        `;
                    }
                    break;

                case '#04_callout_set':
                    blockDiv.innerHTML = `<h3>${bData.title || ''}</h3>`;
                    if (bData.callouts) {
                        const calloutsDiv = document.createElement('div');
                        calloutsDiv.className = 'elea-callouts';
                        bData.callouts.forEach(c => {
                            const cDiv = document.createElement('div');
                            cDiv.className = `elea-callout type-${c.type}`;
                            cDiv.innerHTML = formatText(c.text);
                            calloutsDiv.appendChild(cDiv);
                        });
                        blockDiv.appendChild(calloutsDiv);
                    }
                    break;

                case '#06_lexique_table':
                    blockDiv.innerHTML = `<h3>${bData.title || 'Vocabulaire'}</h3>`;
                    if (bData.headers && bData.rows) {
                        const table = document.createElement('table');
                        table.className = 'elea-table';
                        const thead = `<thead><tr>${bData.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
                        const tbody = `<tbody>${bData.rows.map(row => `<tr>${row.map(cell => `<td>${formatText(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
                        table.innerHTML = thead + tbody;
                        blockDiv.appendChild(table);
                    }
                    if (bData.caption) {
                        blockDiv.innerHTML += `<div class="elea-table-caption">${bData.caption}</div>`;
                    }
                    break;

                case '#12_context_paragraphs':
                    if (bData.title) blockDiv.innerHTML += `<h3>${bData.title}</h3>`;
                    if (bData.paragraphs) {
                        bData.paragraphs.forEach(p => {
                            blockDiv.innerHTML += `<p>${formatText(p)}</p>`;
                        });
                    }
                    break;

                case '#18_sito_graphy':
                    blockDiv.innerHTML = `<h3>${bData.title || 'Sitographie'}</h3>`;
                    if (bData.links) {
                        const linksHtml = bData.links.map(l => `<li><a href="${l.href}" target="_blank">${l.text}</a></li>`).join('');
                        blockDiv.innerHTML += `<ul>${linksHtml}</ul>`;
                    }
                    break;

                case '#11_definition_box':
                    blockDiv.innerHTML = `
                        <div class="elea-definition-box">
                             <h4>${bData.title || 'Définition'}</h4>
                             <p>${formatText(bData.text)}</p>
                        </div>
                     `;
                    break;

                case '#14_faq_block':
                    blockDiv.innerHTML = `<h3>${bData.title || 'FAQ'}</h3>`;
                    if (bData.questions) {
                        bData.questions.forEach(q => {
                            blockDiv.innerHTML += `
                                 <details>
                                     <summary>${q.q}</summary>
                                     <p>${formatText(q.a)}</p>
                                 </details>
                             `;
                        });
                    }
                    break;

                default:
                    // Generic rendering for other blocks to show at least something
                    const title = bData.title ? `<h3>${bData.title}</h3>` : '';
                    let content = '';

                    // Try to dump text fields or arrays if obvious
                    for (const key in bData) {
                        if (key !== 'title' && typeof bData[key] === 'string') {
                            content += `<p><strong>${key}:</strong> ${formatText(bData[key])}</p>`;
                        } else if (Array.isArray(bData[key])) {
                            content += `<p><strong>${key}:</strong> [${bData[key].length} items]</p>`;
                        }
                    }

                    blockDiv.innerHTML = `
                        ${title}
                        <div class="elea-generic-block-content">
                             <div class="elea-block-type-label">${block.type}</div>
                             ${content}
                        </div>
                    `;
                    break;
            }

            blocksContainer.appendChild(blockDiv);
        });

        root.appendChild(blocksContainer);
        container.appendChild(root);
        // addWarning(root); // Redondant

        // Rendu mathématique
        mathRenderer.renderMath(root);
    }

    // addWarning supprimé car géré par notifications.js (preview-modal__warning)

    render();
}
