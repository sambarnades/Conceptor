/**
 * simulators/millionnaire.js — Simulateur Millionnaire.
 * @see ../simulators.js (source originale)
 */

import { tr, createFullscreenButton, rerenderPreservingFocus, emitSimulatorCompleted } from './helpers.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';

/**
 * Rendu du simulateur pour l'activité Millionnaire.
 * @param {HTMLElement} container - Le conteneur DOM où injecter le simulateur.
 * @param {Object} data - Le JSON de l'activité (contient title et questions).
 * @param {string} [_previewHtml] - inutilisé (signature commune renderSimulator).
 * @param {{mode?: 'teacher'|'student'}} [options] - mode d'affichage.
 */
export default function renderMillionnaire(container, data, _previewHtml, options = {}) {
    if (!container || !data || !data.questions) return;

    // Mode prof : flèches de navigation libre entre les 6 questions + pas de
    // game-over (une mauvaise réponse ne renvoie plus à RECOMMENCER), pour
    // consulter toutes les questions. Mode élève (défaut) : jeu strict.
    const mode = options.mode === 'teacher' ? 'teacher' : 'student';
    const isTeacher = mode === 'teacher';

    // --- State Management ---
    let currentQuestionIndex = 0;
    let isFinished = false;
    let selectedAnswerIndex = null;
    let hasValidated = false;

    // Le format Millionnaire impose EXACTEMENT 6 questions (validators.js
    // « exactement 6 questions » + schéma éditeur minItems/maxItems:6,
    // fixedLength). La pyramide à 6 paliers est donc structurelle → fixe.
    const levels = [
        "1 000 000",
        "250 000",
        "50 000",
        "10 000",
        "1 000",
        "500"
    ];

    let questionsWithShuffledAnswers = [];

    function prepareQuestions() {
        questionsWithShuffledAnswers = (Array.isArray(data.questions) ? data.questions : []).map(q => {
            let badAnswers = q.badanswer;
            if (!Array.isArray(badAnswers)) {
                badAnswers = typeof badAnswers === 'string'
                    ? badAnswers.split('\n').map(s => s.trim()).filter(s => s.length > 0)
                    : [];
            }

            const answers = [
                { text: q.goodanswer, correct: true },
                ...badAnswers.map(text => ({ text, correct: false }))
            ];
            return {
                ...q,
                shuffledAnswers: answers.sort(() => Math.random() - 0.5)
            };
        });
    }

    prepareQuestions();

    function render() {
        container.innerHTML = '';

        // LEC-11 : aucune question → message clair (sinon currentQ undefined → crash).
        if (questionsWithShuffledAnswers.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'millionnaire-simulator millionnaire-empty';
            empty.setAttribute('role', 'status');
            empty.textContent = tr('simulator_no_questions', 'Aucune question à afficher.');
            container.appendChild(empty);
            return;
        }

        const root = document.createElement('div');
        root.className = 'millionnaire-simulator';

        const wrapper = document.createElement('div');
        wrapper.className = 'millionnaire-wrapper';

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'millionnaire-header';

        const introText = tr('simulator_mill_intro', "Réponds aux questions qui te seront posées !");

        header.innerHTML = `
            <div class="millionnaire-nav-tabs">
                <span class="active">${sanitizeSync(data.title || tr('simulator_mill_title', 'Millionnaire'), 'STRICT')}</span>
            </div>
            <p class="millionnaire-intro">${introText}</p>
        `;
        const navTabs = header.querySelector('.millionnaire-nav-tabs');
        if (navTabs) {
            navTabs.style.display = 'flex';
            navTabs.style.justifyContent = 'space-between';
            navTabs.style.alignItems = 'center';
            navTabs.style.width = '100%';

            // Groupe d'actions à droite (flèches en mode prof + plein écran).
            const navRight = document.createElement('div');
            navRight.className = 'millionnaire-nav-arrows';

            // Mode prof : flèches de défilement libre entre les questions.
            if (isTeacher && !isFinished) {
                if (currentQuestionIndex > 0) {
                    const prev = document.createElement('button');
                    prev.type = 'button';
                    prev.className = 'millionnaire-nav-arrow prev';
                    prev.setAttribute('data-focus-key', 'mill-prev');
                    prev.setAttribute('aria-label', tr('simulator_previous', 'Question précédente'));
                    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
                    prev.onclick = handlePrevQuestion;
                    navRight.appendChild(prev);
                }
                const next = document.createElement('button');
                next.type = 'button';
                next.className = 'millionnaire-nav-arrow next';
                next.setAttribute('data-focus-key', 'mill-next-arrow');
                next.setAttribute('aria-label', tr('simulator_next_question', 'Question suivante'));
                next.innerHTML = '<i class="fas fa-chevron-right"></i>';
                next.onclick = handleNextQuestion;
                navRight.appendChild(next);
            }

            navRight.appendChild(createFullscreenButton(true));
            navTabs.appendChild(navRight);
        }

        wrapper.appendChild(header);

        // --- End Screen ---
        if (isFinished) {
            const endScreenDiv = document.createElement('div');
            endScreenDiv.className = 'millionnaire-end-screen';
            endScreenDiv.innerHTML = `
                <div class="millionnaire-fireworks-left"></div>
                <div class="millionnaire-end-content">
                    <h2>${tr('simulator_mill_congrats', 'Bravo ! Tu remportes...')}</h2>
                    <div class="millionnaire-final-score">
                        <i class="fas fa-star"></i> 1 000 000 ${tr('simulator_points', 'points')}
                    </div>
                    <button class="millionnaire-restart-btn" id="mill-end-restart" data-focus-key="mill-end-restart">${tr('simulator_restart', 'RECOMMENCER')}</button>
                </div>
                <div class="millionnaire-fireworks-right"></div>
            `;
            // Bouton « Recommencer » sur l'écran de fin : indispensable en mode
            // prof (consultation) pour ne pas rester bloqué après la dernière
            // question, et pratique en mode élève après une victoire.
            const endRestart = endScreenDiv.querySelector('#mill-end-restart');
            if (endRestart) endRestart.onclick = handleRestart;
            wrapper.appendChild(endScreenDiv);
            root.appendChild(wrapper);
            container.appendChild(root);

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

        const questionBox = document.createElement('div');
        questionBox.className = 'millionnaire-question-box';
        questionBox.innerHTML = `<span class="question-label">${tr('simulator_question', 'Question')} ${currentQuestionIndex + 1} :</span> ${sanitizeSync(currentQ.question, 'EDUCATIONAL')}`;

        const answersDiv = document.createElement('div');
        answersDiv.className = 'millionnaire-answers';

        currentQ.shuffledAnswers.forEach((ans, idx) => {
            const btn = document.createElement('button');
            btn.className = 'millionnaire-answer-btn';
            btn.type = 'button';
            btn.setAttribute('data-focus-key', `mill-ans-${idx}`);
            btn.textContent = ans.text;

            if (hasValidated) {
                if (ans.correct) {
                    btn.classList.add('correct');
                    btn.innerHTML += `&nbsp;<i class="fas fa-check"></i>`;
                } else if (idx === selectedAnswerIndex) {
                    btn.classList.add('wrong');
                    btn.innerHTML += `&nbsp;<i class="fas fa-times"></i>`;
                }
                btn.disabled = true;
            } else {
                btn.onclick = () => handleAnswerClick(idx, ans.correct);
            }

            answersDiv.appendChild(btn);
        });

        const actionBtnContainer = document.createElement('div');
        actionBtnContainer.className = 'millionnaire-action-bar';

        if (hasValidated) {
            const selectedAns = currentQ.shuffledAnswers[selectedAnswerIndex];
            // Mode prof : on avance toujours, même sur une mauvaise réponse
            // (pas de game-over) pour pouvoir parcourir toutes les questions.
            if (isTeacher || (selectedAns && selectedAns.correct)) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'millionnaire-next-btn';
                nextBtn.type = 'button';
                nextBtn.setAttribute('data-focus-key', 'mill-next');
                nextBtn.textContent = tr('simulator_next_question', 'QUESTION SUIVANTE');
                nextBtn.onclick = handleNextQuestion;
                actionBtnContainer.appendChild(nextBtn);
            } else {
                const restartBtn = document.createElement('button');
                restartBtn.className = 'millionnaire-restart-btn';
                restartBtn.type = 'button';
                restartBtn.setAttribute('data-focus-key', 'mill-restart');
                restartBtn.textContent = tr('simulator_restart', 'RECOMMENCER');
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
            const correspondingQuestionIndex = levels.length - 1 - index;
            const li = document.createElement('li');
            li.className = 'millionnaire-level';

            if (correspondingQuestionIndex === currentQuestionIndex) {
                li.classList.add('current');
                li.innerHTML = `<i class="fas fa-star" style="margin-right:8px; font-size:0.8em;"></i> ${val} ${tr('simulator_points', 'points')}`;
            } else if (correspondingQuestionIndex < currentQuestionIndex) {
                li.classList.add('passed');
                li.textContent = `${val} ${tr('simulator_points', 'points')}`;
            } else {
                li.textContent = `${val} ${tr('simulator_points', 'points')}`;
            }

            pyramidList.appendChild(li);
        });

        pyramidCol.appendChild(pyramidList);

        gameArea.appendChild(questionCol);
        gameArea.appendChild(pyramidCol);

        wrapper.appendChild(gameArea);
        root.appendChild(wrapper);
        container.appendChild(root);

        mathRenderer.renderMath(root);
    }

    // --- Event Handlers ---

    // A11Y-06 : re-render préservant le focus clavier (repli : bouton d'action).
    function rerender() {
        rerenderPreservingFocus(container, render,
            '.millionnaire-next-btn, .millionnaire-restart-btn, .millionnaire-answer-btn');
    }

    function handleAnswerClick(index, isCorrect) {
        selectedAnswerIndex = index;
        hasValidated = true;
        rerender();
        // Mode élève : une mauvaise réponse = game-over. On signale tout de même
        // la complétion (score = paliers déjà franchis) pour que le parcours
        // collection débloque en mode guidé et applique le seuil en mode validé
        // — sinon l'élève qui n'a pas un sans-faute resterait bloqué (cf. QCM/Test
        // qui émettent toujours à l'écran de fin).
        if (!isTeacher && !isCorrect) {
            const total = questionsWithShuffledAnswers.length || 1;
            emitSimulatorCompleted(container, mode, Math.round((currentQuestionIndex / total) * 100));
        }
    }

    function handleNextQuestion() {
        if (currentQuestionIndex < questionsWithShuffledAnswers.length - 1) {
            currentQuestionIndex++;
            hasValidated = false;
            selectedAnswerIndex = null;
            rerender();
        } else {
            isFinished = true;
            rerender();
            // Fin atteinte : en mode élève, franchir les 6 paliers = 100 %.
            // (no-op en mode prof.)
            emitSimulatorCompleted(container, mode, 100);
        }
    }

    // Mode prof : recul libre vers la question précédente (réinitialise l'état
    // de réponse de la vue, le Millionnaire ne le conserve pas par question).
    function handlePrevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            hasValidated = false;
            selectedAnswerIndex = null;
            rerender();
        }
    }

    function handleRestart() {
        currentQuestionIndex = 0;
        hasValidated = false;
        selectedAnswerIndex = null;
        isFinished = false;
        prepareQuestions();
        rerender();
    }

    render();
}
