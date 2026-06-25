/**
 * simulators/appariement.js — Simulateur Appariement (Matching).
 * @see ../simulators.js (source originale)
 */

import { tr, fixMathSpacing, createFullscreenButton, activateOnKey, rerenderPreservingFocus, emitSimulatorCompleted } from './helpers.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';

/**
 * Rendu du simulateur pour l'activité Appariement (Style "Fusion & Remontée").
 * @param {HTMLElement} container - Le conteneur DOM où injecter le simulateur.
 * @param {Object} data - Le JSON de l'activité (contient title et pairs).
 */
export default function renderMatching(container, data, _previewHtml, options = {}) {
    if (!container || !data || !data.pairs) return;

    // Mode élève (défaut) : émet `simulator:completed` (score = paires correctes /
    // total) à la vérification → critère de validation du parcours collection.
    const mode = options.mode === 'teacher' ? 'teacher' : 'student';

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

    allRightItems.sort(() => Math.random() - 0.5);

    let matches = [];
    let selectedItem = null;
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

        header.innerHTML = `
            <div class="matching-nav-tabs">
                <span class="active">${sanitizeSync(data.title || tr('simulator_matching_title', 'Appariement'), 'STRICT')}</span>
            </div>
            <p class="matching-intro">${sanitizeSync(fixMathSpacing(data.intro || tr('simulator_matching_default_intro', "Associe chaque élément de gauche avec l'élément correspondant à droite.")), 'EDUCATIONAL')}</p>
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
                <div class="fused-left">${sanitizeSync(fixMathSpacing(match.left.text), 'EDUCATIONAL')}</div>
                <div class="fused-right">${sanitizeSync(fixMathSpacing(match.right.text), 'EDUCATIONAL')}</div>
                <div class="fused-actions">
                    ${!isFinished ? `<button class="unlink-btn" type="button" title="${tr('simulator_unlink', 'Dissocier')}" aria-label="${tr('simulator_unlink', 'Dissocier')}" data-focus-key="unlink-${index}"><i class="fas fa-unlink"></i></button>` : iconHtml}
                </div>
            `;

            if (!isFinished) {
                row.querySelector('.unlink-btn').onclick = () => handleUnlink(index);
            }

            matchedList.appendChild(row);
        });

        gameArea.appendChild(matchedList);
        matchedList.style.display = matches.length > 0 ? 'flex' : 'none';

        // 2. Unmatched Pools (Bottom)
        const matchedLeftIds = matches.map(m => m.left.id);
        const matchedRightIds = matches.map(m => m.right.id);

        const remainingLeft = allLeftItems.filter(i => !matchedLeftIds.includes(i.id));
        const remainingRight = allRightItems.filter(i => !matchedRightIds.includes(i.id));

        if (remainingLeft.length > 0 || remainingRight.length > 0) {
            const poolsContainer = document.createElement('div');
            poolsContainer.className = 'matching-pools';

            const leftPoolDiv = document.createElement('div');
            leftPoolDiv.className = 'matching-pool left-pool';
            remainingLeft.forEach(item => {
                leftPoolDiv.appendChild(createItemElement(item));
            });

            const rightPoolDiv = document.createElement('div');
            rightPoolDiv.className = 'matching-pool right-pool';
            remainingRight.forEach(item => {
                rightPoolDiv.appendChild(createItemElement(item));
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
            checkBtn.textContent = tr('simulator_check_answer', 'Vérifier la réponse');
            if (matches.length < allLeftItems.length) {
                checkBtn.disabled = true;
            }
            checkBtn.onclick = handleCheck;
            actionBar.appendChild(checkBtn);
        } else {
            const restartBtn = document.createElement('button');
            restartBtn.className = 'matching-restart-btn';
            restartBtn.textContent = tr('simulator_restart', 'Recommencer');
            restartBtn.onclick = handleRestart;
            actionBar.appendChild(restartBtn);
        }

        wrapper.appendChild(actionBar);
        root.appendChild(wrapper);
        container.appendChild(root);

        mathRenderer.renderMath(root);
    }

    function createItemElement(item) {
        const el = document.createElement('div');
        el.className = 'matching-pool-item';
        el.innerHTML = sanitizeSync(fixMathSpacing(item.text), 'EDUCATIONAL');

        const isSelected = !!(selectedItem && selectedItem.id === item.id);
        if (isSelected) el.classList.add('selected');

        // A11Y-03 : pseudo-bouton accessible (rôle, focus, état, clé de focus).
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', isFinished ? '-1' : '0');
        el.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        el.setAttribute('data-focus-key', item.id);

        if (!isFinished) {
            el.onclick = () => handleItemClick(item);
            activateOnKey(el, () => handleItemClick(item));
        } else {
            el.classList.add('disabled');
        }

        return el;
    }

    // A11Y-06 : re-render préservant le focus clavier.
    function rerender() {
        rerenderPreservingFocus(container, render, '.matching-check-btn, .matching-restart-btn');
    }

    // --- Logic ---

    function handleItemClick(item) {
        if (isFinished) return;

        if (!selectedItem) {
            selectedItem = item;
        } else {
            if (selectedItem.id === item.id) {
                selectedItem = null;
            } else if (selectedItem.type === item.type) {
                selectedItem = item;
            } else {
                const left = selectedItem.type === 'left' ? selectedItem : item;
                const right = selectedItem.type === 'right' ? selectedItem : item;

                matches.push({ left, right });
                selectedItem = null;
            }
        }
        rerender();
    }

    function handleUnlink(index) {
        if (isFinished) return;
        matches.splice(index, 1);
        rerender();
    }

    function handleCheck() {
        isFinished = true;
        selectedItem = null;
        rerender();
        // Résultat final : signale la complétion (mode élève uniquement). Score =
        // paires correctement appariées / nombre total de paires.
        const total = allLeftItems.length || 1;
        const correct = matches.filter(m => m.left.originalPairId === m.right.originalPairId).length;
        emitSimulatorCompleted(container, mode, Math.round((correct / total) * 100));
    }

    function handleRestart() {
        isFinished = false;
        matches = [];
        selectedItem = null;
        allRightItems.sort(() => Math.random() - 0.5);
        rerender();
    }

    render();
}
