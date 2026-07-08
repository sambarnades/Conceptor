/**
 * simulators/livre.js — Simulateur Livre (Moodle book multi-chapitres).
 * @see ../simulators.js (source originale)
 */

import { createFullscreenButton } from './helpers.js';
import { mathRenderer } from '../renderers/math-renderer.js';
import { sanitizeSync } from '../export/sanitizer.js';

/**
 * Rendu du simulateur pour l'activité Livre.
 * Injecte le HTML du simulateur Livre déjà composé par moodle-creator.js.
 *
 * @param {HTMLElement} container - Le conteneur DOM où injecter le simulateur.
 * @param {Object} data - Le JSON du livre (title, intro, chapters[], theme, numbering).
 * @param {string} previewHtml - HTML du simulateur précomposé par buildLivrePreviewHtml().
 */
export default function renderLivre(container, data, previewHtml) {
    if (!container || !data) return;

    if (!previewHtml) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Aperçu non disponible</p>';
        return;
    }

    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'elea-livre-fidelity-wrapper';
    wrapper.style.cssText = 'position: relative; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111827; background:#ffffff; border-radius:14px; max-width:1180px; margin:0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); text-align: left;';

    const fsStickyAnchor = document.createElement('div');
    fsStickyAnchor.style.cssText = 'position: sticky; top: 0; float: right; width: 0; height: 0; z-index: 50;';
    const fsBtnContainer = document.createElement('div');
    // top:2rem → le bord supérieur du bouton coïncide avec le haut de la table
    // des matières (l'aside .livre-sim__toc démarre au padding-top 2rem du
    // .livre-sim__layout). right:14px le garde dans le coin, au-delà de la TDM.
    fsBtnContainer.style.cssText = 'position: absolute; top: 2rem; right: 14px;';
    fsBtnContainer.appendChild(createFullscreenButton(true));
    fsStickyAnchor.appendChild(fsBtnContainer);
    wrapper.appendChild(fsStickyAnchor);

    const contentDiv = document.createElement('div');
    // SECF-01 : previewHtml = contenu communautaire (MBZ Livre) non sanitisé en amont
    // (buildLivrePreviewHtml laisse passer le HTML brut). On sanitise au point d'injection.
    // Profil RICH_HTML : conserve <section>/<nav>/data-* émis par moodle-creator.
    contentDiv.innerHTML = sanitizeSync(previewHtml, 'RICH_HTML');
    wrapper.appendChild(contentDiv);

    container.appendChild(wrapper);

    // Navigation entre chapitres pilotée en JS : le simulateur Livre n'embarque plus
    // de bloc <style>/radios CSS (ils seraient retirés par la sanitisation RICH_HTML
    // ci-dessus). buildLivrePreviewHtml émet des styles inline + une TDM en
    // <span class="livre-sim__toc-link" data-ch-target>. On câble ici (contexte de
    // confiance, post-injection) le basculement d'affichage + l'accessibilité clavier.
    const sim = contentDiv.querySelector('.livre-sim');
    if (sim) {
        const chapters = Array.from(sim.querySelectorAll('.livre-sim__chapter'));
        const links = Array.from(sim.querySelectorAll('.livre-sim__toc-link'));
        const showChapter = (idx) => {
            const target = String(idx);
            chapters.forEach(ch => {
                ch.style.display = (ch.getAttribute('data-ch') === target) ? 'block' : 'none';
            });
            links.forEach(link => {
                const on = link.getAttribute('data-ch-target') === target;
                const isSub = !!link.closest('.livre-sim__toc-item--sub');
                link.style.background = on ? '#eaf3ff' : '';
                link.style.color = on ? '#0050b3' : (isSub ? '#6366f1' : '#4338ca');
                link.style.fontWeight = on ? '600' : '500';
                link.style.borderLeftColor = on ? '#1677ff' : 'transparent';
                link.setAttribute('aria-current', on ? 'true' : 'false');
            });
        };
        links.forEach(link => {
            const activate = () => showChapter(link.getAttribute('data-ch-target'));
            // Vrais liens <a href="#livre-ch-N"> : focusables et activables à Entrée
            // nativement (Entrée synthétise un clic). On intercepte le clic pour piloter
            // l'affichage JS sans laisser le saut d'ancre défiler vers un chapitre masqué.
            link.addEventListener('click', (e) => { e.preventDefault(); activate(); });
            // A11Y : un lien natif n'est PAS activé par Espace — Espace ferait défiler
            // la page (ici vers un chapitre en display:none → « rien ne se passe » de
            // visible). Comme on détourne ces liens en boutons d'onglet, on câble
            // Espace en miroir d'Entrée (RGAA). Entrée reste géré par le clic natif.
            link.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); activate(); }
            });
        });
        if (chapters.length) showChapter('0');
    }

    mathRenderer.renderMath(wrapper);
}
