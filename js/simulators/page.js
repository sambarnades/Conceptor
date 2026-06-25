/**
 * simulators/page.js — Simulateur Page Éléa.
 * @see ../simulators.js (source originale)
 */

import { tr, createFullscreenButton, safeUrl, escapeAttr } from './helpers.js';
import { markdownToHtml } from '../core/utils.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';

/**
 * Rendu du simulateur pour l'activité Page Éléa.
 * @param {HTMLElement} container - Le conteneur DOM.
 * @param {Object} data - Le JSON de l'activité.
 * @param {string} [previewHtml] - Le HTML pré-généré (identique à l'export).
 */
export default function renderPage(container, data, previewHtml) {
    if (!container || !data) return;

    if (previewHtml) {
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'elea-page-fidelity-wrapper';
        wrapper.style.cssText = 'position: relative; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111827; background:#ffffff; padding:28px; border-radius:14px; max-width:1000px; margin:0 auto; line-height:1.65; text-align: left; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);';
        // SECF-01 : previewHtml = contenu communautaire (MBZ Page) non sanitisé en amont
        // (formatTextToHtml laisse passer le HTML brut). On sanitise au point d'injection.
        // Profil RICH_HTML : conserve <section>/<nav>/data-* émis par moodle-creator.
        wrapper.innerHTML = sanitizeSync(previewHtml, 'RICH_HTML');

        const fsBtnContainer = document.createElement('div');
        fsBtnContainer.style.cssText = 'position: absolute; top: 15px; right: 15px;';
        fsBtnContainer.appendChild(createFullscreenButton(true));
        wrapper.appendChild(fsBtnContainer);

        container.appendChild(wrapper);

        mathRenderer.renderMath(wrapper);
        return;
    }

    // --- State ---
    const blocks = Array.isArray(data.blocks) ? data.blocks : [];

    const formatText = (text) => !text ? '' : sanitizeSync(markdownToHtml(text, { newlineToBr: true }), 'EDUCATIONAL');

    function render() {
        container.innerHTML = '';
        const root = document.createElement('div');
        root.className = 'elea-page-simulator';

        // --- Titre global et intro ---
        if (data.title || data.intro) {
            const pageHeader = document.createElement('div');
            pageHeader.className = 'elea-page-main-header';

            let titleHtml = '';
            if (data.title) titleHtml = `<h1>${sanitizeSync(data.title, 'STRICT')}</h1>`;

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
            // LEC-09 : `type` peut manquer (bloc partiel d'un .mbz Page) →
            // String évite le crash `undefined.replace` et borne le switch.
            const blockType = (block && typeof block.type === 'string') ? block.type : '';
            const blockDiv = document.createElement('div');
            blockDiv.className = `elea-page-block block-${blockType.replace('#', '')}`;

            const bData = (block && block.data) || {};

            switch (blockType) {
                case '#01_hero_header':
                    blockDiv.innerHTML = `
                        <div class="elea-hero-header">
                            <h2>${sanitizeSync(bData.title || '', 'STRICT')}</h2>
                            <div class="elea-hero-subtitle">${sanitizeSync(bData.subtitle || '', 'EDUCATIONAL')}</div>
                        </div>
                    `;
                    break;

                case '#02_nav_summary':
                    if (bData.links) {
                        // SEC-01 : href = donnée .mbz non fiable → contexte attribut
                        const linksHtml = bData.links.map(l => `<li><a href="${escapeAttr(safeUrl(l.href))}">${sanitizeSync(l.text, 'STRICT')}</a></li>`).join('');
                        blockDiv.innerHTML = `
                             <nav class="elea-summary">
                                <h3>${tr('simulator_page_summary', 'Sommaire')}</h3>
                                <ul>${linksHtml}</ul>
                             </nav>
                        `;
                    }
                    break;

                case '#03_histo_reperes':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_history', 'Repères historiques'), 'STRICT')}</h3>`;
                    if (bData.events) {
                        const eventsHtml = bData.events.map(ev => `
                            <div class="elea-repere-card">
                                <h4>${sanitizeSync(ev.period || '', 'STRICT')}</h4>
                                <p>${formatText(ev.description)}</p>
                            </div>
                        `).join('');
                        blockDiv.innerHTML += `<div class="elea-reperes-grid">${eventsHtml}</div>`;
                    }
                    break;

                case '#04_callout_set':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || '', 'STRICT')}</h3>`;
                    if (bData.callouts) {
                        const calloutsDiv = document.createElement('div');
                        calloutsDiv.className = 'elea-callouts';
                        bData.callouts.forEach(c => {
                            const cDiv = document.createElement('div');
                            cDiv.className = `elea-callout type-${sanitizeSync(c.type || '', 'STRICT')}`;
                            cDiv.innerHTML = formatText(c.text);
                            calloutsDiv.appendChild(cDiv);
                        });
                        blockDiv.appendChild(calloutsDiv);
                    }
                    break;

                case '#05_stats_cards':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_stats', 'Chiffres-clés'), 'STRICT')}</h3>`;
                    if (bData.stats) {
                        const statsHtml = bData.stats.map(stat => `
                            <div class="elea-stat-card">
                                <div class="elea-stat-value">${sanitizeSync(stat.value || '', 'STRICT')}</div>
                                <div class="elea-stat-label">${sanitizeSync(stat.label || '', 'EDUCATIONAL')}</div>
                            </div>
                        `).join('');
                        blockDiv.innerHTML += `<div class="elea-stats-grid">${statsHtml}</div>`;
                    }
                    break;

                case '#06_lexique_table':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_vocabulary', 'Vocabulaire'), 'STRICT')}</h3>`;
                    if (bData.headers && bData.rows) {
                        const table = document.createElement('table');
                        table.className = 'elea-table';
                        const thead = `<thead><tr>${bData.headers.map(h => `<th>${sanitizeSync(h, 'STRICT')}</th>`).join('')}</tr></thead>`;
                        const tbody = `<tbody>${bData.rows.map(row => `<tr>${row.map(cell => `<td>${formatText(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
                        table.innerHTML = thead + tbody;
                        blockDiv.appendChild(table);
                    }
                    if (bData.caption) {
                        blockDiv.innerHTML += `<div class="elea-table-caption">${sanitizeSync(bData.caption, 'EDUCATIONAL')}</div>`;
                    }
                    break;

                case '#07_glossary_chips':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_glossary', 'Glossaire'), 'STRICT')}</h3>`;
                    if (bData.terms) {
                        const termsHtml = bData.terms.map(term => `
                            <span class="elea-chip">${sanitizeSync(term.fr || '', 'STRICT')} → <span lang="it">${sanitizeSync(term.it || '', 'STRICT')}</span></span>
                        `).join('');
                        blockDiv.innerHTML += `<div class="elea-chips-container">${termsHtml}</div>`;
                    }
                    break;

                case '#08_monuments_grid':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_monuments', 'Monuments'), 'STRICT')}</h3>`;
                    if (bData.monuments) {
                        const monumentsHtml = bData.monuments.map(mon => `
                            <article class="elea-monument-card">
                                <img src="${escapeAttr(safeUrl(mon.img_src, ''))}" alt="${escapeAttr(mon.img_alt || '')}" loading="lazy">
                                <div class="elea-monument-content">
                                    <h4>${sanitizeSync(mon.name || '', 'STRICT')}</h4>
                                    <p>${formatText(mon.description)}</p>
                                </div>
                            </article>
                        `).join('');
                        blockDiv.innerHTML += `<div class="elea-monuments-grid">${monumentsHtml}</div>`;
                    }
                    break;

                case '#09_figures_comparison':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_comparison', 'Comparer deux vues'), 'STRICT')}</h3>`;
                    if (bData.figures) {
                        const figuresHtml = bData.figures.map(fig => `
                            <figure class="elea-comparison-figure">
                                <img src="${escapeAttr(safeUrl(fig.img_src, ''))}" alt="${escapeAttr(fig.img_alt || '')}" loading="lazy">
                                <figcaption>${sanitizeSync(fig.caption || '', 'EDUCATIONAL')}</figcaption>
                            </figure>
                        `).join('');
                        blockDiv.innerHTML += `<div class="elea-figures-grid">${figuresHtml}</div>`;
                    }
                    break;

                case '#10_table_comparison':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_table_comparison', 'Tableau comparatif'), 'STRICT')}</h3>`;
                    if (bData.headers && bData.rows) {
                        const table = document.createElement('table');
                        table.className = 'elea-table';
                        const thead = `<thead><tr>${bData.headers.map(h => `<th>${sanitizeSync(h, 'STRICT')}</th>`).join('')}</tr></thead>`;
                        const tbody = `<tbody>${bData.rows.map(row => `<tr>${row.map(cell => `<td>${formatText(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
                        table.innerHTML = thead + tbody;
                        blockDiv.appendChild(table);
                    }
                    if (bData.caption) {
                        blockDiv.innerHTML += `<div class="elea-table-caption">${sanitizeSync(bData.caption, 'EDUCATIONAL')}</div>`;
                    }
                    break;

                case '#11_definition_box':
                    blockDiv.innerHTML = `
                        <div class="elea-definition-box">
                             <h4>${sanitizeSync(bData.title || tr('simulator_page_definition', 'Définition'), 'STRICT')}</h4>
                             <p>${formatText(bData.text)}</p>
                        </div>
                     `;
                    break;

                case '#12_context_paragraphs':
                    if (bData.title) blockDiv.innerHTML += `<h3>${sanitizeSync(bData.title, 'STRICT')}</h3>`;
                    if (bData.paragraphs) {
                        bData.paragraphs.forEach(p => {
                            blockDiv.innerHTML += `<p>${formatText(p)}</p>`;
                        });
                    }
                    break;

                case '#13_monument_sheet_long':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_document_sheet', 'Fiche document'), 'STRICT')}</h3>`;
                    if (bData.img_src) {
                        blockDiv.innerHTML += `<img src="${escapeAttr(safeUrl(bData.img_src, ''))}" alt="${escapeAttr(bData.img_alt || '')}" class="elea-sheet-image" loading="lazy">`;
                    }
                    if (bData.sections) {
                        bData.sections.forEach(sec => {
                            blockDiv.innerHTML += `
                                <div class="elea-sheet-section">
                                    <h4>${sanitizeSync(sec.subtitle || '', 'STRICT')}</h4>
                                    <p>${formatText(sec.text)}</p>
                                </div>
                            `;
                        });
                    }
                    break;

                case '#14_faq_block':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_faq', 'FAQ'), 'STRICT')}</h3>`;
                    if (bData.questions) {
                        bData.questions.forEach(q => {
                            blockDiv.innerHTML += `
                                 <details>
                                     <summary>${sanitizeSync(q.q, 'EDUCATIONAL')}</summary>
                                     <p>${formatText(q.a)}</p>
                                 </details>
                             `;
                        });
                    }
                    break;

                case '#15_myths_realities':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_myths_realities', 'Mythes et Réalités'), 'STRICT')}</h3>`;
                    const mythsRealitiesContainer = document.createElement('div');
                    mythsRealitiesContainer.className = 'elea-myths-realities-grid';
                    if (bData.myths) {
                        const mythsDiv = document.createElement('div');
                        mythsDiv.className = 'elea-myths-column';
                        mythsDiv.innerHTML = `<h4>${tr('simulator_page_myths', 'Mythes')}</h4>`;
                        const mythsList = document.createElement('ul');
                        bData.myths.forEach(myth => {
                            mythsList.innerHTML += `<li>${formatText(myth)}</li>`;
                        });
                        mythsDiv.appendChild(mythsList);
                        mythsRealitiesContainer.appendChild(mythsDiv);
                    }
                    if (bData.realities) {
                        const realitiesDiv = document.createElement('div');
                        realitiesDiv.className = 'elea-realities-column';
                        realitiesDiv.innerHTML = `<h4>${tr('simulator_page_realities', 'Réalités')}</h4>`;
                        const realitiesList = document.createElement('ul');
                        bData.realities.forEach(reality => {
                            realitiesList.innerHTML += `<li>${formatText(reality)}</li>`;
                        });
                        realitiesDiv.appendChild(realitiesList);
                        mythsRealitiesContainer.appendChild(realitiesDiv);
                    }
                    blockDiv.appendChild(mythsRealitiesContainer);
                    break;

                case '#16_method_image_desc':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_method', 'Méthode'), 'STRICT')}</h3>`;
                    if (bData.steps) {
                        const stepsList = document.createElement('ol');
                        stepsList.className = 'elea-method-steps';
                        bData.steps.forEach(step => {
                            stepsList.innerHTML += `<li>${formatText(step)}</li>`;
                        });
                        blockDiv.appendChild(stepsList);
                    }
                    break;

                case '#17_quote_bilingual':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_bilingual_quote', 'Citation bilingue'), 'STRICT')}</h3>`;
                    const quoteContainer = document.createElement('figure');
                    quoteContainer.className = 'elea-quote-bilingual';
                    if (bData.quote_langue_initiale) {
                        const quote1 = document.createElement('blockquote');
                        quote1.innerHTML = formatText(bData.quote_langue_initiale);
                        quoteContainer.appendChild(quote1);
                    }
                    if (bData.quote_langue_arrivee) {
                        const quote2 = document.createElement('blockquote');
                        quote2.setAttribute('lang', 'it');
                        quote2.innerHTML = formatText(bData.quote_langue_arrivee);
                        quoteContainer.appendChild(quote2);
                    }
                    if (bData.author) {
                        const caption = document.createElement('figcaption');
                        caption.textContent = `— ${bData.author}`;
                        quoteContainer.appendChild(caption);
                    }
                    blockDiv.appendChild(quoteContainer);
                    break;

                case '#18_sito_graphy':
                    blockDiv.innerHTML = `<h3>${sanitizeSync(bData.title || tr('simulator_page_sitography', 'Sitographie'), 'STRICT')}</h3>`;
                    if (bData.links) {
                        // SEC-01 : href = donnée .mbz non fiable → contexte attribut
                        const linksHtml = bData.links.map(l => `<li><a href="${escapeAttr(safeUrl(l.href))}" target="_blank" rel="noopener noreferrer">${sanitizeSync(l.text, 'STRICT')}</a></li>`).join('');
                        blockDiv.innerHTML += `<ul>${linksHtml}</ul>`;
                    }
                    break;

                default: {
                    // LEC-09 : titre, type et clés proviennent d'un .mbz déposé →
                    // échappés au point d'injection (DOM-XSS stockée sinon).
                    const title = bData.title ? `<h3>${sanitizeSync(bData.title, 'STRICT')}</h3>` : '';
                    let content = '';

                    for (const key in bData) {
                        if (key !== 'title' && typeof bData[key] === 'string') {
                            content += `<p><strong>${sanitizeSync(key, 'STRICT')}:</strong> ${formatText(bData[key])}</p>`;
                        } else if (Array.isArray(bData[key])) {
                            content += `<p><strong>${sanitizeSync(key, 'STRICT')}:</strong> [${bData[key].length} items]</p>`;
                        }
                    }

                    blockDiv.innerHTML = `
                        ${title}
                        <div class="elea-generic-block-content">
                             <div class="elea-block-type-label">${sanitizeSync(blockType, 'STRICT')}</div>
                             ${content}
                        </div>
                    `;
                    break;
                }
            }

            blocksContainer.appendChild(blockDiv);
        });

        root.appendChild(blocksContainer);
        container.appendChild(root);

        mathRenderer.renderMath(root);
    }

    render();
}
