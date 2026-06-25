/**
 * simulators/qcm.js — Simulateur QCM Éléa.
 * @see ../simulators.js (source originale)
 */

import { tr, createFullscreenButton, activateOnKey, rerenderPreservingFocus, emitSimulatorCompleted } from './helpers.js';
import { debugLog, markdownToHtml } from '../core/utils.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';

/**
 * Rendu du simulateur pour l'activité QCM Éléa.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON de l'activité.
 * @param {string} [_previewHtml] - inutilisé (signature commune renderSimulator).
 * @param {{mode?: 'teacher'|'student'}} [options] - mode d'affichage.
 */
export default function renderQcmElea(container, data, _previewHtml, options = {}) {
    if (!container || !data || !data.questions) return;

    // Mode prof : navigation libre jusqu'à l'écran de fin + révélation des
    // réponses sans avoir à sélectionner. Mode élève (défaut) : jeu strict +
    // émission `simulator:completed` à la fin (parcours collection).
    const mode = options.mode === 'teacher' ? 'teacher' : 'student';
    const isTeacher = mode === 'teacher';

    // --- State ---
    let currentQuestionIndex = 0;
    let isFinished = false;
    // État conservé PAR question, pour que les flèches de défilement
    // avant/arrière retrouvent la réponse choisie et la validation.
    const selectedAnswers = {};    // { [index]: indexRéponseChoisie }
    const validatedQuestions = {}; // { [index]: true } une fois « Vérifier » cliqué

    const questions = (Array.isArray(data.questions) ? data.questions : []).map(q => {
        // LEC-07 : `answers` peut manquer (content_json partiel / import non-MBZ).
        let answers = (Array.isArray(q.answers) ? q.answers : []).map(ans => ({
            ...ans,
            correct: ans.correct !== undefined ? ans.correct : (ans.iscorrect === 1)
        }));

        answers = answers
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        debugLog('simulators', `Question "${q.text ? q.text.substring(0, 20) : 'Sans titre'}..." : ${answers.length} options mélangées.`);

        return { ...q, answers };
    });

    function render() {
        container.innerHTML = '';

        // LEC-08 : aucune question exploitable → message clair plutôt qu'un
        // écran de fin à `NaN%` (division par 0) ou un crash sur `questions[i]`.
        if (questions.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'qcm-simulator qcm-empty';
            empty.setAttribute('role', 'status');
            empty.textContent = tr('simulator_no_questions', 'Aucune question à afficher.');
            container.appendChild(empty);
            return;
        }

        const root = document.createElement('div');
        root.className = 'qcm-simulator';

        // État dérivé de la question courante.
        const selectedAnswerIndex = selectedAnswers[currentQuestionIndex] ?? null;
        const hasValidated = !!validatedQuestions[currentQuestionIndex];

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'qcm-header simplified';

        const titleHtml = data.title ? `<span class="active">${sanitizeSync(data.title, 'STRICT')}</span>` : '<span></span>';
        // Flèches de défilement gauche/droite (masquées sur l'écran de fin).
        // Flèches de défilement = MODE PROF (consultation) UNIQUEMENT. En mode
        // élève, le QCM est strict : pas de saut libre, on progresse en
        // sélectionnant puis « Vérifier » → « Question suivante ».
        const arrowsHtml = (isFinished || !isTeacher) ? '' : `
            ${currentQuestionIndex > 0 ? `<button type="button" class="qcm-nav-arrow prev" id="qcm-prev-arrow" data-focus-key="qcm-prev" aria-label="${tr('simulator_previous', 'Question précédente')}"><i class="fas fa-chevron-left"></i></button>` : ''}
            <button type="button" class="qcm-nav-arrow next" id="qcm-next-arrow" data-focus-key="qcm-next" aria-label="${tr('simulator_next_question', 'Question suivante')}"><i class="fas fa-chevron-right"></i></button>
        `;
        header.innerHTML = `
            <div class="qcm-nav-tabs">
                ${titleHtml}
                <div class="qcm-nav-arrows">${arrowsHtml}</div>
            </div>
        `;
        const navTabs = header.querySelector('.qcm-nav-tabs');
        if (navTabs) {
            navTabs.style.justifyContent = 'space-between';
            navTabs.style.width = '100%';
        }
        const navArrows = header.querySelector('.qcm-nav-arrows');
        if (navArrows) navArrows.appendChild(createFullscreenButton(true));

        const prevArrow = header.querySelector('#qcm-prev-arrow');
        const nextArrow = header.querySelector('#qcm-next-arrow');
        if (prevArrow) prevArrow.onclick = handlePrev;
        if (nextArrow) nextArrow.onclick = handleNext;

        root.appendChild(header);

        // --- Écran de fin ---
        if (isFinished) {
            const score = questions.reduce((acc, q, i) => {
                const sel = selectedAnswers[i];
                return acc + (sel != null && q.answers[sel]?.correct ? 1 : 0);
            }, 0);
            const percentage = Math.round((score / questions.length) * 100);

            const endScreen = document.createElement('div');
            endScreen.className = 'qcm-end-screen';
            endScreen.setAttribute('role', 'status');
            endScreen.setAttribute('aria-live', 'polite');
            endScreen.innerHTML = `
                <div class="qcm-header-text">${tr('simulator_qcm_header', 'Répondez aux questions suivantes.')}</div>
                <div class="qcm-result-card">
                    <div class="qcm-score-line">${tr('simulator_score_obtained', 'Score obtenu')} : ${percentage}%</div>
                    <div class="qcm-score-line">${tr('simulator_best_score', 'Meilleur score')} : ${percentage}%</div>
                    <div class="qcm-score-info">${tr('simulator_best_score_info', 'Seul le meilleur score est conservé.')}</div>
                    <button class="qcm-btn restart-btn">${tr('simulator_restart', 'RECOMMENCER')}</button>
                </div>
            `;

            endScreen.querySelector('.restart-btn').onclick = handleRestart;

            root.appendChild(endScreen);
            container.appendChild(root);

            mathRenderer.renderMath(root);
            return;
        }

        // --- Écran de jeu ---
        const wrapper = document.createElement('div');
        wrapper.className = 'qcm-wrapper';
        wrapper.appendChild(header);

        const formatText = (text) => !text ? '' : sanitizeSync(markdownToHtml(text), 'EDUCATIONAL');

        const currentQ = questions[currentQuestionIndex];
        const questionContainer = document.createElement('div');
        questionContainer.className = 'qcm-question-container';

        const questionLabel = document.createElement('div');
        questionLabel.className = 'qcm-question-label';

        let qText = currentQ.text || '';
        qText = qText.replace(/^\s*<p[^>]*>/i, '').replace(/<\/p>\s*$/i, '');
        qText = formatText(qText);

        questionLabel.innerHTML = `<span class="qcm-q-num">${tr('simulator_question', 'Question')} ${currentQuestionIndex + 1} :</span> ${qText}`;
        questionContainer.appendChild(questionLabel);

        // Réponses
        const answersList = document.createElement('div');
        answersList.className = 'qcm-answers-list';

        if (currentQ.answers && Array.isArray(currentQ.answers)) {
            currentQ.answers.forEach((ans, idx) => {
                const ansCard = document.createElement('div');
                ansCard.className = 'qcm-answer-card';

                if (hasValidated) {
                    if (ans.correct) {
                        ansCard.classList.add('correct');
                        ansCard.innerHTML = `
                            <div class="qcm-ans-text">${sanitizeSync(ans.text, 'EDUCATIONAL')}</div>
                            <div class="qcm-ans-icon"><i class="fas fa-check"></i></div>
                        `;
                    } else if (idx === selectedAnswerIndex) {
                        ansCard.classList.add('wrong');
                        ansCard.innerHTML = `
                            <div class="qcm-ans-text">${sanitizeSync(ans.text, 'EDUCATIONAL')}</div>
                            <div class="qcm-ans-icon"><i class="fas fa-times"></i></div>
                        `;
                    } else {
                        ansCard.innerHTML = `<div class="qcm-ans-text">${sanitizeSync(ans.text, 'EDUCATIONAL')}</div>`;
                        ansCard.classList.add('disabled');
                    }
                } else {
                    ansCard.innerHTML = `<div class="qcm-ans-text">${sanitizeSync(ans.text, 'EDUCATIONAL')}</div>`;
                    const isSel = (idx === selectedAnswerIndex);
                    if (isSel) ansCard.classList.add('selected');
                    // A11Y-05 : carte de réponse = pseudo-bouton accessible au clavier.
                    ansCard.setAttribute('role', 'button');
                    ansCard.setAttribute('tabindex', '0');
                    ansCard.setAttribute('aria-pressed', isSel ? 'true' : 'false');
                    ansCard.setAttribute('data-focus-key', `ans-${idx}`);
                    ansCard.onclick = () => handleAnswerClick(idx);
                    activateOnKey(ansCard, () => handleAnswerClick(idx));
                }

                answersList.appendChild(ansCard);
            });
        }
        questionContainer.appendChild(answersList);

        // Pas de verdict « bonne/mauvaise » quand le prof révèle sans avoir
        // sélectionné (mode prof) : on a juste mis en évidence la bonne réponse.
        if (hasValidated && selectedAnswerIndex !== null) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'qcm-feedback-text';
            feedbackDiv.setAttribute('role', 'status');
            feedbackDiv.setAttribute('aria-live', 'polite');
            const isCorrect = currentQ.answers[selectedAnswerIndex]?.correct;
            feedbackDiv.textContent = isCorrect ? tr('simulator_correct_answer', 'Bonne réponse') : tr('simulator_wrong_answer', 'Mauvaise réponse');
            feedbackDiv.style.fontStyle = 'italic';
            feedbackDiv.style.margin = '8px 0';
            feedbackDiv.style.textAlign = 'center';
            feedbackDiv.style.color = '#1d1d1f';
            questionContainer.appendChild(feedbackDiv);
        }

        // Bouton d'action
        const actionBtnContainer = document.createElement('div');
        actionBtnContainer.className = 'qcm-action-bar';

        const actionBtn = document.createElement('button');
        actionBtn.className = 'qcm-btn';
        actionBtn.type = 'button';
        actionBtn.setAttribute('data-focus-key', 'qcm-action');

        if (hasValidated) {
            actionBtn.textContent = tr('simulator_next_question', 'QUESTION SUIVANTE');
            actionBtn.onclick = handleNext;
        } else {
            // Mode prof : le bouton « Révéler » dévoile la bonne réponse même
            // sans sélection (consultation). Mode élève : « Vérifier » désactivé
            // tant que rien n'est choisi.
            actionBtn.textContent = (isTeacher && selectedAnswerIndex === null)
                ? tr('simulator_reveal', 'RÉVÉLER LA RÉPONSE')
                : tr('simulator_check_answer', 'VÉRIFIER LA RÉPONSE');
            if (selectedAnswerIndex === null && !isTeacher) {
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

        mathRenderer.renderMath(root);
    }

    // --- Logic ---

    // A11Y-06 : re-render préservant le focus clavier (repli : bouton d'action).
    function rerender() {
        rerenderPreservingFocus(container, render, '.qcm-btn');
    }

    function handleAnswerClick(index) {
        if (validatedQuestions[currentQuestionIndex]) return;
        selectedAnswers[currentQuestionIndex] = index;
        rerender();
    }

    function handleCheck() {
        // Mode prof : révélation autorisée sans sélection.
        if (selectedAnswers[currentQuestionIndex] == null && !isTeacher) return;
        validatedQuestions[currentQuestionIndex] = true;
        rerender();
    }

    /** Score de réussite 0–100 (proportion de bonnes réponses sélectionnées). */
    function computeScorePct() {
        const score = questions.reduce((acc, q, i) => {
            const sel = selectedAnswers[i];
            return acc + (sel != null && q.answers[sel]?.correct ? 1 : 0);
        }, 0);
        return Math.round((score / questions.length) * 100);
    }

    function handleNext() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            rerender();
        } else {
            isFinished = true;
            rerender();
            // Fin atteinte : signale la complétion au parcours collection
            // (mode élève uniquement, no-op en mode prof).
            emitSimulatorCompleted(container, mode, computeScorePct());
        }
    }

    function handlePrev() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            rerender();
        }
    }

    function handleRestart() {
        currentQuestionIndex = 0;
        isFinished = false;
        for (const k in selectedAnswers) delete selectedAnswers[k];
        for (const k in validatedQuestions) delete validatedQuestions[k];
        rerender();
    }

    render();
}
