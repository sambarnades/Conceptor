/**
 * simulators/elea-test.js — Simulateur Test Moodle/Éléa.
 * Prend en charge : multichoice, matching, numerical, truefalse, shortanswer, cloze.
 * @see ../simulators.js (source originale)
 */

import { tr, createFullscreenButton, activateOnKey, rerenderPreservingFocus, emitSimulatorCompleted } from './helpers.js';
import { debugLog, markdownToHtml } from '../core/utils.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';
import { escapeHtml as escapeHtmlCanonical } from '../core/escape.js';
import {
    parseClozeGaps, parseGapAnswers, resoudreReglagesTest, masquesRevue, REVUE_PENDANT, REVUE_JUSTE_APRES,
} from '../moodle/mbz-course-builder.js';
import { dansTolerance, correspondanceCourte, fractionTrouCloze, pourcentageTest } from '../moodle/test-evaluation.js';
import { canonicalizeTestModel, numericalAnswers } from '../moodle/moodle-formats.js';

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
 *
 * Les réglages du Test (`data.quiz_settings`, cf. `resoudreReglagesTest`) pilotent
 * l'aperçu comme ils pilotent Éléa : en feedback DIFFÉRÉ (le défaut), pas de
 * « Vérifier » par question — l'élève répond, termine, puis voit sa note et,
 * selon « ce que l'élève peut revoir », la correction ; en mode INTERACTIF, une
 * vérification par question et un essai de plus par indice ; en mode IMMÉDIAT,
 * une seule vérification. La navigation séquentielle retire « Précédent ».
 */
export default function renderEleaTest(container, data, _previewHtml, options = {}) {
    data = canonicalizeTestModel(Array.isArray(data) ? { questions: data } : data);
    debugLog('simulators', "renderEleaTest called with:", data);
    if (!container) {
        console.error("renderEleaTest: No container provided");
        return;
    }

    // Mode prof : accès direct à l'écran de fin depuis la dernière question
    // (consultation). Mode élève (défaut) : émission `simulator:completed`.
    const mode = options.mode === 'teacher' ? 'teacher' : 'student';
    const isTeacher = mode === 'teacher';

    // Réglages du Test : mêmes défauts et mêmes masques de relecture que le .mbz.
    const reglages = resoudreReglagesTest(data && data.quiz_settings);
    const differe = reglages.preferredbehaviour === 'deferredfeedback';
    const essaisMultiples = reglages.preferredbehaviour === 'interactive';
    const navigationLibre = reglages.navmethod === 'free';
    const masques = masquesRevue(reglages.preferredbehaviour, reglages.review, reglages.review_masks);
    const voit = (champ, moment) => (masques[champ] & moment) !== 0;
    // Ce que montre une question corrigée : PENDANT la tentative (interactif,
    // immédiat) ou juste APRÈS (différé, une fois le test terminé).
    const momentRetour = differe ? REVUE_JUSTE_APRES : REVUE_PENDANT;
    const retour = {
        statut: voit('correctness', momentRetour),
        message: voit('specificfeedback', momentRetour) || voit('generalfeedback', momentRetour),
        bonneReponse: voit('rightanswer', momentRetour),
    };

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
    // Différé : la tentative est envoyée (« Terminer le test ») — les questions se
    // relisent alors corrigées, sans être modifiables.
    let tentativeEnvoyee = false;

    // --- Helpers ---
    const formatMarkdown = (text) => !text ? '' : sanitizeSync(markdownToHtml(text, { newlineToBr: true }), 'EDUCATIONAL');

    // Délégation au canonique (`core/escape.js`). L'ancienne copie locale levait un
    // TypeError sur toute entrée non-chaîne (`text.replace`) et transformait `0` en
    // chaîne vide. Elle sert ici en contexte d'ATTRIBUT (`<option value="…">`), d'où
    // l'importance d'échapper aussi `"` et `'`.
    const escapeHtml = escapeHtmlCanonical;

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
        if (differe && !tentativeEnvoyee) {
            const note = document.createElement('p');
            note.className = 'elea-test-mode-note';
            note.textContent = tr('simulator_test_deferred_note', 'Feedback différé : la correction s’affiche à la fin du test.');
            header.appendChild(note);
        }

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
            } else if (retour.statut || (retour.message && fState.message)) {
                const feedbackClass = fState.isCorrect ? 'correct' : (fState.isPartial ? 'partial' : 'incorrect');
                const feedbackIcon = fState.isCorrect ? 'fa-check-circle' : (fState.isPartial ? 'fa-adjust' : 'fa-times-circle');
                const feedbackTitle = fState.isCorrect
                    ? tr('simulator_correct', 'Correct !')
                    : (fState.isPartial ? tr('simulator_partial', 'Partiellement correct') : tr('simulator_incorrect', 'Incorrect'));

                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = `elea-feedback ${feedbackClass}`;
                feedbackDiv.setAttribute('role', 'status');
                feedbackDiv.setAttribute('aria-live', 'polite');
                // Sans « correction » dans la relecture, le cadre reste neutre : ni
                // couleur ni verdict, seulement les retours s'ils sont montrés.
                if (!retour.statut) feedbackDiv.className = 'elea-feedback neutral';
                feedbackDiv.innerHTML = `
                    ${retour.statut ? `<div class="elea-feedback-icon"><i class="fas ${feedbackIcon}"></i></div>` : ''}
                    <div class="elea-feedback-content">
                        ${retour.statut ? `<div class="elea-feedback-title">${feedbackTitle}</div>` : ''}
                        ${retour.message ? `<div class="elea-feedback-text">${formatMarkdown(fState.message)}</div>` : ''}
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

        const derniere = currentQuestionIndex >= questions.length - 1;
        if (differe) {
            // Feedback différé : pas de « Vérifier ». On avance, puis on termine ; une
            // fois le test terminé, la relecture ramène au résultat.
            if (!derniere) {
                actionBtn.textContent = tr('simulator_next_question', 'Question Suivante');
                actionBtn.onclick = handleNext;
            } else if (tentativeEnvoyee) {
                actionBtn.textContent = tr('simulator_test_back_to_results', 'Retour au résultat');
                actionBtn.onclick = afficherResultat;
            } else {
                actionBtn.textContent = tr('simulator_finish_test', 'Terminer le test');
                actionBtn.onclick = handleFinish;
            }
        } else if (fState && fState.show) {
            if (fState.hintShown) {
                actionBtn.textContent = tr('simulator_retry', 'Réessayer');
                actionBtn.onclick = () => {
                    delete feedbackState[currentQuestionIndex];
                    rerender();
                };
            } else if (!derniere) {
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

        // « Précédent » en mode élève quand la navigation est libre (réglage du
        // test) ou pendant la relecture ; en navigation séquentielle, pas de retour.
        // En mode prof, le retour arrière passe par la flèche ◀ de l'en-tête.
        if (!isTeacher && (navigationLibre || tentativeEnvoyee) && currentQuestionIndex > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'elea-btn secondary';
            prevBtn.type = 'button';
            prevBtn.setAttribute('data-focus-key', 'elea-prev');
            prevBtn.textContent = tr('simulator_previous', 'Précédent');
            prevBtn.onclick = handlePrev;
            footer.appendChild(prevBtn);
        }

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
        const isSingle = ![false, 0, 'false', '0'].includes(content.single);

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
                if (retour.bonneReponse && ans.fraction > 0) opt.classList.add('should-be-selected');
                if (retour.statut && isSelected && ans.fraction <= 0) opt.classList.add('wrong-selection');
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
                if (retour.bonneReponse && isCorrectVal) item.classList.add('should-be-selected');
                if (retour.statut && isSelected && !isCorrectVal) item.classList.add('wrong-selection');
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
        const parts = text.split(/(\{\d*:[A-Z_]+:(?:\\[\s\S]|[^}\\])+\})/);

        const wrapper = document.createElement('div');
        wrapper.className = 'elea-cloze-text';

        userAnswers[qIdx] = userAnswers[qIdx] || {};

        parts.forEach((part, partIdx) => {
            if (part.match(/^\{\d*:[A-Z_]+:(?:\\[\s\S]|[^}\\])+\}$/)) {
                const inner = part.slice(1, -1);
                const firstColon = inner.indexOf(':');
                const secondColon = inner.indexOf(':', firstColon + 1);

                if (firstColon === -1 || secondColon === -1) {
                    const span = document.createElement('span');
                    span.textContent = part;
                    wrapper.appendChild(span);
                    return;
                }

                const gap = parseClozeGaps(part).gaps[0];
                if (!gap) { wrapper.appendChild(document.createTextNode(part)); return; }
                const parsed = parseGapAnswers(gap);
                if (parsed.kind === 'multichoice') {
                    const select = document.createElement('select');
                    select.className = 'elea-cloze-select';
                    select.disabled = feedbackState[qIdx]?.show;
                    select.multiple = parsed.single === false;
                    select.setAttribute('aria-label', tr('simulator_short_answer_placeholder', 'Votre réponse'));
                    if (!select.multiple) select.appendChild(new Option('?', ''));
                    for (const answer of parsed.answers) {
                        const option = new Option(answer.text, answer.text);
                        option.selected = select.multiple ? (userAnswers[qIdx][partIdx] || []).includes(answer.text) : userAnswers[qIdx][partIdx] === answer.text;
                        select.appendChild(option);
                    }
                    select.onchange = () => { userAnswers[qIdx][partIdx] = select.multiple ? [...select.selectedOptions].map(o => o.value) : select.value; };
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

    /**
     * Corrige la réponse donnée à une question, sans rien afficher : fraction
     * obtenue et message (retour général, retour de la réponse choisie, retour
     * combiné « correct / partiel / incorrect »).
     */
    function evaluer(type, content, idx) {
        let fraction = 0;
        let message = content.feedback || '';

        switch (type) {
            case 'multichoice': {
                const uAns = userAnswers[idx];
                const answers = content.answers;
                if (![false, 0, 'false', '0'].includes(content.single)) {
                    if (uAns !== undefined && answers[uAns]) {
                        fraction = Number(answers[uAns].fraction) / 100;
                        if (answers[uAns].feedback) message += "<br><br>" + answers[uAns].feedback;
                    }
                } else {
                    const selected = uAns || [];
                    fraction = selected.reduce((n, i) => n + (Number(answers[i]?.fraction) || 0) / 100, 0);
                }
                break;
            }
            case 'truefalse':
                fraction = userAnswers[idx] === isTrueAnswer(content.answer.value) ? 1 : 0;
                message += "<br><br>" + (userAnswers[idx] === true ? content.answer.feedback_true || '' : userAnswers[idx] === false ? content.answer.feedback_false || '' : '');
                break;
            case 'numerical': {
                const answer = numericalAnswers(content).find(a => dansTolerance(userAnswers[idx], a.number, a.tolerance));
                if (answer) {
                    fraction = Number(answer.fraction) / 100;
                    message += "<br>" + (answer.feedback || '');
                }
                break;
            }
            case 'shortanswer': {
                const val = String(userAnswers[idx] ?? '').trim();
                const match = content.answers.find(a => correspondanceCourte(val, a.text, [true, 1, '1', 'true'].includes(content.usecase)));
                if (match) {
                    fraction = Number(match.fraction) / 100;
                    message += "<br>" + (match.feedback || '');
                }
                break;
            }
            case 'matching': {
                const subquestions = content.subquestions;
                const matches = userAnswers[idx] || {};
                const matchCount = subquestions.filter((sq, i) => matches[i] === sq.answer).length;
                fraction = subquestions.length ? matchCount / subquestions.length : 0;
                break;
            }
            case 'cloze': {
                const parts = (content.questiontext || '').split(/(\{\d*:[A-Z_]+:(?:\\[\s\S]|[^}\\])+\})/);
                let score = 0, total = 0;
                parts.forEach((part, partIdx) => {
                    const gap = parseClozeGaps(part).gaps[0];
                    if (!gap) return;
                    const weight = Number(gap.weight) || 1;
                    total += weight;
                    score += weight * fractionTrouCloze(gap, (userAnswers[idx] || {})[partIdx]);
                });
                fraction = total > 0 ? score / total : 0;
                break;
            }
        }

        fraction = Math.max(0, Math.min(1, Number(fraction) || 0));
        const isCorrect = fraction >= 1 - 1e-7;
        const isPartial = !isCorrect && fraction > 0;

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

        return { isCorrect, isPartial, fraction, message };
    }

    /** « Vérifier » (interactif, immédiat) : corrige la question affichée. */
    function handleCheck(type, content, idx) {
        if (feedbackState[idx]?.show) return;
        const resultat = evaluer(type, content, idx);

        // Interactif avec plusieurs essais : chaque indice vaut un essai de plus,
        // comme sur Moodle. En feedback immédiat, une seule vérification.
        const hints = essaisMultiples && Array.isArray(content.hints) ? content.hints : [];
        const nextHint = hintState[idx] || 0;
        if (!resultat.isCorrect && nextHint < hints.length) {
            feedbackState[idx] = { show: true, isCorrect: false, message: hints[nextHint], hintShown: true };
            hintState[idx] = nextHint + 1;
            rerender();
            return;
        }

        feedbackState[idx] = { show: true, ...resultat, hintShown: false };
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
        // Feedback différé : « Terminer le test » envoie la tentative — toutes les
        // questions sont corrigées d'un coup, comme sur la plateforme.
        if (differe && !tentativeEnvoyee) {
            questions.forEach((q, i) => {
                feedbackState[i] = { show: true, ...evaluer(q.type, q.content || {}, i), hintShown: false };
            });
            tentativeEnvoyee = true;
        }
        afficherResultat();

        // Test terminé : signale la complétion au parcours collection (mode
        // élève uniquement), avec les points et crédits partiels du Test.
        const scorePct = pourcentageTest(questions, feedbackState);
        emitSimulatorCompleted(container, mode, scorePct);
    }

    /**
     * Écran de fin. Ce qu'il montre suit « ce que l'élève peut revoir » juste après
     * la tentative : la note, le feedback global de sa plage, la correction de
     * chaque question et, si la relecture est ouverte, « Revoir mes réponses ».
     */
    function afficherResultat() {
        const apres = (champ) => voit(champ, REVUE_JUSTE_APRES);
        const pct = pourcentageTest(questions, feedbackState);
        const format = new Intl.NumberFormat(document.documentElement.lang || undefined, { maximumFractionDigits: 2 });
        const noteHtml = apres('marks')
            ? `<p class="elea-test-end__grade">${tr('simulator_test_grade', 'Note')} : <strong>${format.format(reglages.grade * pct / 100)} / ${format.format(reglages.grade)}</strong></p>`
            : '';
        const plage = [...reglages.overallfeedback].reverse().find(t => pct >= t.from);
        const globalHtml = apres('overallfeedback') && plage && plage.feedback.trim()
            ? `<div class="elea-test-end__overall">${formatMarkdown(plage.feedback)}</div>` : '';
        const correctionHtml = differe && apres('correctness')
            ? `<ol class="elea-test-end__list">${questions.map((q, i) => {
                const f = feedbackState[i] || {};
                const etat = f.isCorrect ? 'correct' : (f.isPartial ? 'partial' : 'incorrect');
                const libelle = f.isCorrect ? tr('simulator_correct', 'Correct !')
                    : (f.isPartial ? tr('simulator_partial', 'Partiellement correct') : tr('simulator_incorrect', 'Incorrect'));
                const nom = sanitizeSync((q.content && q.content.name) || `${tr('simulator_question', 'Question')} ${i + 1}`, 'STRICT');
                return `<li class="elea-test-end__item elea-test-end__item--${etat}"><span>${nom}</span><span>${libelle}</span></li>`;
            }).join('')}</ol>` : '';
        const revoir = differe && apres('attempt');
        const noteSeuleHtml = differe && !revoir
            ? `<p class="elea-test-end__note">${tr('simulator_test_marks_only', 'Ce test ne montre à l’élève que sa note.')}</p>` : '';

        container.innerHTML = `
            <div class="elea-test-end" style="position: relative;">
                <div class="elea-test-end-icon"><i class="fas fa-flag-checkered"></i></div>
                <h3>${tr('simulator_test_finished', 'Test terminé !')}</h3>
                ${noteHtml}${globalHtml}${correctionHtml}${noteSeuleHtml}
                <p>${tr('simulator_test_preview_message', 'Ceci était une prévisualisation de votre activité.')}</p>
                <div class="elea-actions">
                    ${revoir ? `<button class="elea-btn secondary" id="elea-review-btn" type="button">${tr('simulator_test_review_answers', 'Revoir mes réponses')}</button>` : ''}
                    <button class="elea-btn primary" id="elea-restart-btn" type="button">${tr('simulator_restart', 'Recommencer')}</button>
                </div>
                <div class="elea-test-end-fullscreen" style="position: absolute; top: 15px; right: 15px;"></div>
            </div>
        `;
        const endFS = container.querySelector('.elea-test-end-fullscreen');
        if (endFS) endFS.appendChild(createFullscreenButton(true));
        const reviewBtn = container.querySelector('#elea-review-btn');
        if (reviewBtn) reviewBtn.onclick = () => { currentQuestionIndex = 0; rerender(); };
        container.querySelector('#elea-restart-btn').onclick = () => {
            currentQuestionIndex = 0;
            tentativeEnvoyee = false;
            for (let k in userAnswers) delete userAnswers[k];
            for (let k in feedbackState) delete feedbackState[k];
            for (let k in hintState) delete hintState[k];
            rerender();
        };

        mathRenderer.renderMath(container);
    }

    render();
}
