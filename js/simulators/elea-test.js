/**
 * simulators/elea-test.js — Simulateur Test Moodle/Éléa.
 * Prend en charge : multichoice, matching, numerical, truefalse, shortanswer, cloze.
 * @see ../simulators.js (source originale)
 */

import { tr, createFullscreenButton, activateOnKey, rerenderPreservingFocus, emitSimulatorCompleted } from './helpers.js';
import { debugLog, markdownToHtml } from '../core/utils.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';

/**
 * Normalise la bonne réponse d'une question Vrai/Faux en booléen.
 * Tolère la chaîne "true"/"false" (sorties LLM ou données legacy) en plus du
 * booléen canonique, pour que la comparaison stricte côté preview ne casse pas.
 */
function isTrueAnswer(value) {
    return value === true || value === 'true';
}

/**
 * Rendu du simulateur pour l'activité Test Moodle/Éléa.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON de l'activité.
 * @param {string} [_previewHtml] - inutilisé (signature commune renderSimulator).
 * @param {{mode?: 'teacher'|'student'}} [options] - mode d'affichage.
 */
export default function renderEleaTest(container, data, _previewHtml, options = {}) {
    debugLog('simulators', "renderEleaTest called with:", data);
    if (!container) {
        console.error("renderEleaTest: No container provided");
        return;
    }

    // Mode prof : accès direct à l'écran de fin depuis la dernière question
    // (consultation). Mode élève (défaut) : émission `simulator:completed`.
    const mode = options.mode === 'teacher' ? 'teacher' : 'student';
    const isTeacher = mode === 'teacher';

    let questions = [];
    if (data && Array.isArray(data.questions)) {
        questions = data.questions;
        debugLog('simulators', "renderEleaTest: Found questions in data.questions, count:", questions.length);
    } else if (Array.isArray(data)) {
        questions = data;
        debugLog('simulators', "renderEleaTest: Data is array, count:", questions.length);
    } else {
        console.error("renderEleaTest: Invalid data format", data);
        container.innerHTML = `<div class="elea-test-simulator"><div class="elea-test-card"><p class="elea-error" style="color:red; text-align:center;">${tr('simulator_test_invalid_format', 'Erreur : Format de données invalide pour le simulateur.')}</p></div></div>`;
        return;
    }

    if (questions.length === 0) {
        console.warn("renderEleaTest: No questions to display");
        container.innerHTML = `<div class="elea-test-simulator"><div class="elea-test-card"><p class="elea-error" style="color:orange; text-align:center;">${tr('simulator_test_no_questions', 'Aucune question à afficher.')}</p></div></div>`;
        return;
    }

    debugLog('simulators', "renderEleaTest: Rendering", questions.length, "questions");

    // --- State ---
    // Mode prof (consultation) : une « page 0 » d'accueil (bandeau « banque
    // d'exercices » : titre + description) précède les questions → on défile
    // accueil → Q1 → Q2… Mode élève : page 0 masquée → démarrage direct sur la
    // 1re question (ça devient un questionnaire).
    const hasIntro = isTeacher && !!(data.bank_name || data.bank_description);
    let currentQuestionIndex = hasIntro ? -1 : 0;
    const userAnswers = {};
    const feedbackState = {};
    const hintState = {};

    // --- Helpers ---
    const formatMarkdown = (text) => !text ? '' : sanitizeSync(markdownToHtml(text, { newlineToBr: true }), 'EDUCATIONAL');

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Page d'accueil (mode prof) : présentation CENTRÉE de la banque (icône,
    // titre, description) + bouton « Commencer » au centre → 1re question.
    function renderIntro(root) {
        // Page 0 : on retire le cadre gris du simulateur pour que la zone blanche
        // touche les bords (continuité avec le bandeau footer).
        root.classList.add('elea-test-simulator--intro');
        const title = sanitizeSync(data.bank_name || tr('simulator_test_title', 'Test Moodle/Éléa'), 'STRICT');
        const desc = sanitizeSync(data.bank_description || '', 'EDUCATIONAL');

        const clipboardSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>';
        const arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

        const intro = document.createElement('div');
        intro.className = 'elea-test-intro';
        intro.innerHTML = `
            <div class="elea-test-intro__fs"></div>
            <div class="elea-test-intro__icon">${clipboardSvg}</div>
            <h2 class="elea-test-intro__title">${title}</h2>
            ${desc ? `<p class="elea-test-intro__desc">${desc}</p>` : ''}
            <button class="elea-btn primary elea-test-intro__start" type="button" id="elea-start" data-focus-key="elea-start">
                <span>${tr('simulator_start', 'Voir les questions')}</span>${arrowSvg}
            </button>
        `;
        const fsSlot = intro.querySelector('.elea-test-intro__fs');
        if (fsSlot) fsSlot.appendChild(createFullscreenButton(true));
        const startBtn = intro.querySelector('#elea-start');
        if (startBtn) startBtn.onclick = handleNext;
        root.appendChild(intro);

        mathRenderer.renderMath(root);
    }

    function render() {
        container.innerHTML = '';
        const root = document.createElement('div');
        root.className = 'elea-test-simulator';

        // Page 0 (accueil) — mode prof uniquement : le bandeau « banque
        // d'exercices » est une slide à part entière, pas un en-tête répété.
        if (currentQuestionIndex < 0) {
            renderIntro(root);
            container.appendChild(root);
            return;
        }

        // --- Header (question) : MINIMAL — progression « Question X / Y » +
        // flèches (mode prof) + plein écran. Le titre/description vivent sur la
        // page 0, pas sur chaque question.
        const header = document.createElement('div');
        header.className = 'elea-test-header';
        const progressHtml = `<div class="elea-test-progress">${tr('simulator_question', 'Question')} ${currentQuestionIndex + 1} / ${questions.length}</div>`;
        header.innerHTML = `
            <div class="elea-test-title-row elea-test-title-row--compact">
                ${progressHtml}
                <div class="elea-test-nav-arrows">
                    ${isTeacher && (currentQuestionIndex > 0 || hasIntro) ? '<button class="elea-nav-arrow prev" id="elea-prev-arrow"><i class="fas fa-chevron-left"></i></button>' : ''}
                    ${isTeacher ? '<button class="elea-nav-arrow next" id="elea-next-arrow"><i class="fas fa-chevron-right"></i></button>' : ''}
                </div>
            </div>
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

        const qHeader = document.createElement('div');
        qHeader.className = 'elea-question-header';
        if (qType === 'cloze') {
            qHeader.innerHTML = `
                <div class="elea-question-name">${content.name || `${tr('simulator_question', 'Question')} ${currentQuestionIndex + 1}`}</div>
            `;
        } else {
            qHeader.innerHTML = `
                <div class="elea-question-name">${content.name || `${tr('simulator_question', 'Question')} ${currentQuestionIndex + 1}`}</div>
                <div class="elea-question-text">${formatMarkdown(content.questiontext)}</div>
            `;
        }
        card.appendChild(qHeader);

        // Zone de réponse
        const answerZone = document.createElement('div');
        answerZone.className = 'elea-answer-zone';

        switch (qType) {
            case 'multichoice': renderMultichoice(answerZone, content, currentQuestionIndex); break;
            case 'matching': renderMatchingType(answerZone, content, currentQuestionIndex); break;
            case 'numerical': renderNumerical(answerZone, content, currentQuestionIndex); break;
            case 'truefalse': renderTrueFalse(answerZone, content, currentQuestionIndex); break;
            case 'shortanswer': renderShortAnswer(answerZone, content, currentQuestionIndex); break;
            case 'cloze': renderCloze(answerZone, content, currentQuestionIndex); break;
            default: answerZone.innerHTML = `<p class="elea-error">${tr('simulator_unsupported_type', 'Type de question non supporté.')}</p>`;
        }

        card.appendChild(answerZone);

        // Zone de feedback
        const fState = feedbackState[currentQuestionIndex];
        if (fState && fState.show) {
            if (fState.hintShown) {
                const hintDiv = document.createElement('div');
                hintDiv.className = 'elea-feedback hint';
                hintDiv.setAttribute('role', 'status');
                hintDiv.setAttribute('aria-live', 'polite');
                hintDiv.innerHTML = `
                    <div class="elea-feedback-icon"><i class="fas fa-lightbulb"></i></div>
                    <div class="elea-feedback-content">
                        <div class="elea-feedback-title">${tr('simulator_hint', 'Indice')}</div>
                        <div class="elea-feedback-text">${formatMarkdown(fState.message)}</div>
                    </div>
                `;
                card.appendChild(hintDiv);
            } else {
                const feedbackClass = fState.isCorrect ? 'correct' : (fState.isPartial ? 'partial' : 'incorrect');
                const feedbackIcon = fState.isCorrect ? 'fa-check-circle' : (fState.isPartial ? 'fa-adjust' : 'fa-times-circle');
                const feedbackTitle = fState.isCorrect
                    ? tr('simulator_correct', 'Correct !')
                    : (fState.isPartial ? tr('simulator_partial', 'Partiellement correct') : tr('simulator_incorrect', 'Incorrect'));

                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = `elea-feedback ${feedbackClass}`;
                feedbackDiv.setAttribute('role', 'status');
                feedbackDiv.setAttribute('aria-live', 'polite');
                feedbackDiv.innerHTML = `
                    <div class="elea-feedback-icon"><i class="fas ${feedbackIcon}"></i></div>
                    <div class="elea-feedback-content">
                        <div class="elea-feedback-title">${feedbackTitle}</div>
                        <div class="elea-feedback-text">${formatMarkdown(fState.message)}</div>
                    </div>
                `;
                card.appendChild(feedbackDiv);
            }
        }

        root.appendChild(card);

        // --- Actions Footer ---
        const footer = document.createElement('div');
        footer.className = 'elea-test-footer';

        const actionBtn = document.createElement('button');
        actionBtn.className = 'elea-btn primary';
        actionBtn.type = 'button';
        actionBtn.setAttribute('data-focus-key', 'elea-action');

        if (fState && fState.show) {
            if (fState.hintShown) {
                actionBtn.textContent = tr('simulator_retry', 'Réessayer');
                actionBtn.onclick = () => {
                    delete feedbackState[currentQuestionIndex];
                    rerender();
                };
            } else if (currentQuestionIndex < questions.length - 1) {
                actionBtn.textContent = tr('simulator_next_question', 'Question Suivante');
                actionBtn.onclick = handleNext;
            } else {
                actionBtn.textContent = tr('simulator_finish_test', 'Terminer le test');
                actionBtn.onclick = handleFinish;
            }
        } else {
            actionBtn.textContent = tr('simulator_check', 'Vérifier');
            actionBtn.onclick = () => handleCheck(qType, content, currentQuestionIndex);
        }

        // Pas de bouton « Précédent » dans le pied de page : en mode prof le
        // retour arrière se fait par la flèche ◀ de l'en-tête (consultation) ; en
        // mode élève le test est strict (on répond pour avancer, pas de retour).

        footer.appendChild(actionBtn);
        // Le pied (« Vérifier » / « Question suivante »…) vit DANS la carte
        // blanche, pas sur le fond gris — sinon le bouton flotte hors du cadre.
        card.appendChild(footer);

        container.appendChild(root);

        const prevArrow = root.querySelector('#elea-prev-arrow');
        const nextArrow = root.querySelector('#elea-next-arrow');
        if (prevArrow) prevArrow.onclick = handlePrev;
        // Mode prof : la flèche « suivante » sur la dernière question mène
        // directement à l'écran de fin (consultation sans valider).
        if (nextArrow) {
            nextArrow.onclick = (currentQuestionIndex < questions.length - 1) ? handleNext : handleFinish;
        }

        mathRenderer.renderMath(root);
    }

    // A11Y-06 : re-render préservant le focus clavier (repli : bouton d'action).
    function rerender() {
        rerenderPreservingFocus(container, render, '.elea-btn.primary, .elea-btn');
    }

    // --- Rendeurs spécifiques ---

    function renderMultichoice(container, content, qIdx) {
        const answers = content.answers || [];
        const isSingle = String(content.single) !== 'false';

        const list = document.createElement('div');
        list.className = 'elea-options-list';

        answers.forEach((ans, idx) => {
            const opt = document.createElement('div');
            opt.className = 'elea-option-item';

            const isSelected = userAnswers[qIdx] !== undefined && (isSingle ? userAnswers[qIdx] === idx : userAnswers[qIdx].includes(idx));
            if (isSelected) opt.classList.add('selected');

            // A11Y-04 : option = pseudo-bouton accessible (rôle, focus, état annoncé).
            opt.setAttribute('role', 'button');
            opt.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            opt.setAttribute('data-focus-key', `mc-${idx}`);

            const fState = feedbackState[qIdx];
            if (fState && fState.show) {
                opt.classList.add('disabled');
                opt.setAttribute('tabindex', '-1');
                if (ans.fraction > 0) opt.classList.add('should-be-selected');
                if (isSelected && ans.fraction <= 0) opt.classList.add('wrong-selection');
            } else {
                opt.setAttribute('tabindex', '0');
                const choose = () => {
                    if (isSingle) {
                        userAnswers[qIdx] = idx;
                    } else {
                        const current = userAnswers[qIdx] || [];
                        const newSelection = current.includes(idx)
                            ? current.filter(i => i !== idx)
                            : [...current, idx];
                        userAnswers[qIdx] = newSelection;
                    }
                    rerender();
                };
                opt.onclick = choose;
                activateOnKey(opt, choose);
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
        input.placeholder = tr('simulator_numerical_placeholder', 'Votre réponse numérique...');
        input.value = userAnswers[qIdx] || '';
        input.disabled = feedbackState[qIdx]?.show;
        input.oninput = (e) => { userAnswers[qIdx] = e.target.value; };

        wrapper.appendChild(input);
        container.appendChild(wrapper);
    }

    function renderTrueFalse(container, content, qIdx) {
        const options = [{ text: tr('simulator_true', 'Vrai'), val: true }, { text: tr('simulator_false', 'Faux'), val: false }];
        const list = document.createElement('div');
        list.className = 'elea-options-list';

        options.forEach((opt, optIdx) => {
            const item = document.createElement('div');
            item.className = 'elea-option-item';
            const isSelected = userAnswers[qIdx] === opt.val;
            if (isSelected) item.classList.add('selected');

            // A11Y-04 : option Vrai/Faux = pseudo-bouton accessible.
            item.setAttribute('role', 'button');
            item.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            item.setAttribute('data-focus-key', `tf-${optIdx}`);

            const fState = feedbackState[qIdx];
            if (fState && fState.show) {
                item.classList.add('disabled');
                item.setAttribute('tabindex', '-1');
                const isCorrectVal = (opt.val === isTrueAnswer(content.answer.value));
                if (isCorrectVal) item.classList.add('should-be-selected');
                if (isSelected && !isCorrectVal) item.classList.add('wrong-selection');
            } else {
                item.setAttribute('tabindex', '0');
                const choose = () => {
                    userAnswers[qIdx] = opt.val;
                    rerender();
                };
                item.onclick = choose;
                activateOnKey(item, choose);
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
        input.placeholder = tr('simulator_short_answer_placeholder', 'Votre réponse courte...');
        input.value = userAnswers[qIdx] || '';
        input.disabled = feedbackState[qIdx]?.show;
        input.oninput = (e) => { userAnswers[qIdx] = e.target.value; };
        wrapper.appendChild(input);
        container.appendChild(wrapper);
    }

    function renderCloze(container, content, qIdx) {
        // LEC-01 : questiontext peut être absent (content_json backend, import non-MBZ).
        // Sans garde, text.split() jette un TypeError qui casse tout le rendu du Test.
        const text = content.questiontext || '';
        const parts = text.split(/(\{\d+:[^}]+\})/);

        const wrapper = document.createElement('div');
        wrapper.className = 'elea-cloze-text';

        userAnswers[qIdx] = userAnswers[qIdx] || {};

        parts.forEach((part, partIdx) => {
            if (part.match(/^\{\d+:[^}]+\}$/)) {
                const inner = part.slice(1, -1);
                const firstColon = inner.indexOf(':');
                const secondColon = inner.indexOf(':', firstColon + 1);

                if (firstColon === -1 || secondColon === -1) {
                    const span = document.createElement('span');
                    span.textContent = part;
                    wrapper.appendChild(span);
                    return;
                }

                const typeInfo = inner.substring(firstColon + 1, secondColon);
                const answersStr = inner.substring(secondColon + 1);
                const answers = answersStr.split('~');

                if (typeInfo.toUpperCase().includes('MULTICHOICE') || typeInfo.toUpperCase().includes('GAPSELECT')) {
                    const select = document.createElement('select');
                    select.className = 'elea-cloze-select';
                    select.disabled = feedbackState[qIdx]?.show;
                    select.innerHTML = '<option value="">?</option>' +
                        answers.map(a => {
                            const cleanA = a.replace(/^=/, '');
                            return `<option value="${escapeHtml(cleanA)}" ${userAnswers[qIdx][partIdx] === cleanA ? 'selected' : ''}>${escapeHtml(cleanA)}</option>`;
                        }).join('');

                    select.onchange = (e) => { userAnswers[qIdx][partIdx] = e.target.value; };
                    wrapper.appendChild(select);
                } else {
                    const input = document.createElement('input');
                    input.className = 'elea-cloze-input';
                    input.type = 'text';
                    input.value = userAnswers[qIdx][partIdx] || '';
                    input.disabled = feedbackState[qIdx]?.show;
                    input.style.width = '100px';
                    input.oninput = (e) => { userAnswers[qIdx][partIdx] = e.target.value; };
                    wrapper.appendChild(input);
                }
            } else {
                const span = document.createElement('span');
                span.innerHTML = formatMarkdown(part);
                wrapper.appendChild(span);
            }
        });
        container.appendChild(wrapper);
    }

    // --- Logic Handlers ---

    function handleCheck(type, content, idx) {
        if (feedbackState[idx]?.show) return;

        let isCorrect = false;
        let isPartial = false;
        let message = content.feedback || '';

        switch (type) {
            case 'multichoice': {
                const uAns = userAnswers[idx];
                const answers = content.answers;
                if (content.single !== 'false' && content.single !== false) {
                    if (uAns !== undefined && answers[uAns]) {
                        if (answers[uAns].fraction > 0) isCorrect = true;
                        if (answers[uAns].feedback) message += "<br><br>" + answers[uAns].feedback;
                    }
                } else {
                    const selected = uAns || [];
                    const allCorrect = answers.every((a, i) => (a.fraction > 0) === selected.includes(i));
                    const someCorrect = selected.some(i => answers[i]?.fraction > 0);
                    isCorrect = allCorrect;
                    isPartial = !allCorrect && someCorrect;
                }
                break;
            }
            case 'truefalse':
                isCorrect = (userAnswers[idx] === isTrueAnswer(content.answer.value));
                message += "<br><br>" + (isCorrect ? content.answer.feedback_true : content.answer.feedback_false);
                break;
            case 'numerical': {
                const num = parseFloat(userAnswers[idx]);
                const target = parseFloat(content.answer.number);
                const tol = parseFloat(content.answer.tolerance || 0);
                if (!isNaN(num) && Math.abs(num - target) <= tol) {
                    isCorrect = true;
                    message += "<br>" + (content.answer.feedback || '');
                }
                break;
            }
            case 'shortanswer': {
                const val = (userAnswers[idx] || '').trim().toLowerCase();
                const match = content.answers.find(a => a.text.trim().toLowerCase() === val && a.fraction > 0);
                if (match) {
                    isCorrect = true;
                    message += "<br>" + (match.feedback || '');
                }
                break;
            }
            case 'matching': {
                const subquestions = content.subquestions;
                const matches = userAnswers[idx] || {};
                const matchCount = subquestions.filter((sq, i) => matches[i] === sq.answer).length;
                isCorrect = matchCount === subquestions.length;
                isPartial = !isCorrect && matchCount > 0;
                break;
            }
            case 'cloze': {
                // LEC-01 : même garde côté correction (handleCheck).
                const text = content.questiontext || '';
                const parts = text.split(/(\{\d+:[^}]+\})/);
                const clozeAnswers = userAnswers[idx] || {};
                let clozeCorrectCount = 0;
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

                            const correctChoices = options
                                .filter(opt => opt.startsWith('='))
                                .map(opt => {
                                    let clean = opt.substring(1).split('#')[0].trim();
                                    return clean.split('/').map(sub => sub.toLowerCase().trim());
                                })
                                .flat();

                            const userAns = (clozeAnswers[partIdx] || '').trim().toLowerCase();
                            if (correctChoices.includes(userAns)) {
                                clozeCorrectCount++;
                            }
                        }
                    }
                });
                isCorrect = gapsFound > 0 && clozeCorrectCount === gapsFound;
                isPartial = !isCorrect && clozeCorrectCount > 0;
                break;
            }
        }

        // Gestion des hints
        const hints = Array.isArray(content.hints) ? content.hints : [];
        const nextHint = hintState[idx] || 0;

        if (!isCorrect && nextHint < hints.length) {
            feedbackState[idx] = { show: true, isCorrect: false, message: hints[nextHint], hintShown: true };
            hintState[idx] = nextHint + 1;
            rerender();
            return;
        }

        // Feedbacks combinés
        if (content.correctfeedback || content.partiallycorrectfeedback || content.incorrectfeedback) {
            let combinedMsg = '';
            if (isCorrect && content.correctfeedback) {
                combinedMsg = content.correctfeedback;
            } else if (isPartial && content.partiallycorrectfeedback) {
                combinedMsg = content.partiallycorrectfeedback;
            } else if (!isCorrect && content.incorrectfeedback) {
                combinedMsg = content.incorrectfeedback;
            }
            if (combinedMsg) {
                message = combinedMsg + (message ? '<br><br>' + message : '');
            }
        }

        feedbackState[idx] = { show: true, isCorrect, isPartial, message, hintShown: false };
        rerender();
    }

    function handleNext() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            rerender();
        }
    }

    function handlePrev() {
        // Mode prof : on peut remonter jusqu'à la page 0 (accueil) si elle existe.
        const minIndex = hasIntro ? -1 : 0;
        if (currentQuestionIndex > minIndex) {
            currentQuestionIndex--;
            rerender();
        }
    }

    function handleFinish() {
        container.innerHTML = `
            <div class="elea-test-end" style="position: relative;">
                <div class="elea-test-end-icon"><i class="fas fa-flag-checkered"></i></div>
                <h3>${tr('simulator_test_finished', 'Test terminé !')}</h3>
                <p>${tr('simulator_test_preview_message', 'Ceci était une prévisualisation de votre activité.')}</p>
                <div class="elea-actions">
                    <button class="elea-btn primary" id="elea-restart-btn">${tr('simulator_restart', 'Recommencer')}</button>
                </div>
                <div class="elea-test-end-fullscreen" style="position: absolute; top: 15px; right: 15px;"></div>
            </div>
        `;
        const endFS = container.querySelector('.elea-test-end-fullscreen');
        if (endFS) endFS.appendChild(createFullscreenButton(true));
        container.querySelector('#elea-restart-btn').onclick = () => {
            currentQuestionIndex = 0;
            for (let k in userAnswers) delete userAnswers[k];
            for (let k in feedbackState) delete feedbackState[k];
            for (let k in hintState) delete hintState[k];
            rerender();
        };

        mathRenderer.renderMath(container);

        // Test terminé : signale la complétion au parcours collection (mode
        // élève uniquement). Score = proportion de questions vérifiées correctes.
        const correct = Object.values(feedbackState).filter(f => f && f.isCorrect).length;
        const scorePct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        emitSimulatorCompleted(container, mode, scorePct);
    }

    render();
}
