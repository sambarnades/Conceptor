/**
 * simulators/devoir.js — Simulateur Devoir (grille d'évaluation critériée).
 * @see ../simulators.js (source originale)
 */

import { tr, formatTextSafe, createFullscreenButton } from './helpers.js';
import { sanitizeSync } from '../export/sanitizer.js';

/**
 * Rendu du simulateur pour l'activité Devoir (grille d'évaluation critériée).
 * Affiche un tableau de rubrique avec les critères en lignes et les niveaux en colonnes.
 * @param {HTMLElement} container - Le conteneur DOM où injecter le simulateur.
 * @param {Object} data - Le JSON de l'activité (title, description, rubricName, criteria[]).
 */
export default function renderDevoir(container, data) {
    if (!container || !data || !data.criteria) return;

    const criteria = data.criteria;
    const maxLevels = Math.max(...criteria.map(c => (c.levels || []).length), 0);

    function render() {
        container.innerHTML = '';

        const root = document.createElement('div');
        root.className = 'devoir-simulator';

        // --- En-tête avec titre et bouton plein écran ---
        const header = document.createElement('div');
        header.className = 'devoir-header';

        const titleRow = document.createElement('div');
        titleRow.className = 'devoir-nav-tabs';
        titleRow.innerHTML = `<span class="active">${sanitizeSync(data.rubricName || data.title || tr('simulator_devoir_title', 'Devoir'), 'STRICT')}</span>`;
        titleRow.appendChild(createFullscreenButton(true));
        header.appendChild(titleRow);

        if (data.description) {
            const desc = document.createElement('p');
            desc.className = 'devoir-description';
            desc.innerHTML = formatTextSafe(data.description);
            header.appendChild(desc);
        }

        root.appendChild(header);

        // --- Tableau de la grille d'évaluation ---
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'devoir-table-wrapper';

        const table = document.createElement('table');
        table.className = 'devoir-table';

        const tbody = document.createElement('tbody');

        criteria.forEach(criterion => {
            const tableRow = document.createElement('tr');

            const tdCriterion = document.createElement('td');
            tdCriterion.className = 'devoir-td-criterion';
            tdCriterion.innerHTML = formatTextSafe(criterion.description || '');
            tableRow.appendChild(tdCriterion);

            const levels = criterion.levels || [];
            levels.forEach(level => {
                const td = document.createElement('td');
                td.className = 'devoir-td-level';

                const defSpan = document.createElement('div');
                defSpan.className = 'devoir-level-definition';
                defSpan.innerHTML = formatTextSafe(level.definition || '');

                const scoreSpan = document.createElement('div');
                scoreSpan.className = 'devoir-level-score';
                const pts = parseFloat(level.score || 0);
                const unit = pts <= 1
                    ? tr('simulator_devoir_point', 'pt')
                    : tr('simulator_devoir_points', 'pts');
                scoreSpan.textContent = `${pts} ${unit}`;

                td.appendChild(defSpan);
                td.appendChild(scoreSpan);
                tableRow.appendChild(td);
            });

            for (let i = levels.length; i < maxLevels; i++) {
                const td = document.createElement('td');
                td.className = 'devoir-td-level devoir-td-empty';
                tableRow.appendChild(td);
            }

            tbody.appendChild(tableRow);
        });

        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        root.appendChild(tableWrapper);

        // --- Note maximale ---
        const totalScore = criteria.reduce((sum, c) => {
            const maxLevel = Math.max(...(c.levels || []).map(l => parseFloat(l.score || 0)), 0);
            return sum + maxLevel;
        }, 0);

        const totalDiv = document.createElement('div');
        totalDiv.className = 'devoir-total';
        const totalLabel = tr('simulator_devoir_total', 'Note maximale');
        const totalUnit = totalScore <= 1
            ? tr('simulator_devoir_point', 'pt')
            : tr('simulator_devoir_points', 'pts');
        totalDiv.textContent = `${totalLabel} : ${totalScore} ${totalUnit}`;
        root.appendChild(totalDiv);

        container.appendChild(root);
    }

    render();
}
