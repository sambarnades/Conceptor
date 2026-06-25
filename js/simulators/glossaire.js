/**
 * simulators/glossaire.js — Simulateur Glossaire.
 * @see ../simulators.js (source originale)
 */

import { tr, createFullscreenButton } from './helpers.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';
import { markdownToHtml } from '../core/utils.js';

/**
 * Rendu du simulateur pour le Glossaire.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON (contient name, entries...).
 */
export default function renderGlossary(container, data) {
    if (!container || !data || !Array.isArray(data.entries)) return;

    // LEC-10 : `concept` peut manquer/n'être pas une chaîne (entrée partielle) →
    // String(x||'') évite le crash `undefined.localeCompare`.
    let entries = [...data.entries].sort((a, b) =>
        String(a && a.concept || '').localeCompare(String(b && b.concept || '')));

    function parseFormatting(text) {
        if (!text) return '';
        return sanitizeSync(markdownToHtml(text), 'EDUCATIONAL');
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
                <h2>${sanitizeSync(data.name || tr('simulator_glossary_title', 'Glossaire'), 'STRICT')}</h2>
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
            entriesContainer.innerHTML = `<p class="glossary-no-results">${tr('simulator_glossary_empty', 'Aucune entrée dans ce glossaire.')}</p>`;
        } else {
            entries.forEach(entry => {
                const card = document.createElement('div');
                card.className = 'glossary-entry-compact';

                const definitionHtml = parseFormatting(entry.definition);

                card.innerHTML = `
                    <div class="glossary-term">${sanitizeSync(entry.concept, 'STRICT')}</div>
                    <div class="glossary-def">${definitionHtml}</div>
                `;
                entriesContainer.appendChild(card);
            });
        }

        wrapper.appendChild(entriesContainer);
        root.appendChild(wrapper);
        container.appendChild(root);

        mathRenderer.renderMath(root);
    }

    render();
}
