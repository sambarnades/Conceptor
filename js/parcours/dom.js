/** Petites fabriques DOM de l’atelier : texte traduit, jamais de HTML implicite. */
import { t, cleSelonPlateforme } from './vocabulaire.js';

export function el(tag, classe, texte) {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texte != null) node.textContent = texte;
    return node;
}

export function icone(nom) {
    const node = el('i', `fas ${nom}`);
    node.setAttribute('aria-hidden', 'true');
    return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Tracés du livre ouvert (viewBox 24) : deux pages, le dos, des lignes de texte, un signet. */
const LIVRE = [
    ['pc-livre__page', 'M12 7C10.3 5.6 7.8 5 4.9 5.1 4.1 5.1 3.5 5.7 3.5 6.5V17.1c0 .8.7 1.4 1.5 1.3 2.7-.2 5.2.4 7 1.6Z'],
    ['pc-livre__page', 'M12 7c1.7-1.4 4.2-2 7.1-1.9.8 0 1.4.6 1.4 1.4V17.1c0 .8-.7 1.4-1.5 1.3-2.7-.2-5.2.4-7 1.6Z'],
    ['pc-livre__dos', 'M12 7V20'],
    ['pc-livre__ligne', 'M6 9.6c1.4-.1 2.7.1 3.8.6M6 13c1.4-.1 2.7.1 3.8.6M14.2 13.6c1.1-.5 2.4-.7 3.8-.6'],
    ['pc-livre__signet', 'M15.3 5.9V10.9l1.4-1 1.4 1V5.5c-.9 0-1.9.1-2.8.4Z'],
];

/**
 * Icône du tutoriel de l'atelier : un livre ouvert, comme le « Tutoriel » de l'en-tête
 * de Caramel (fa-book-open), dessiné pour l'atelier, au trait. Styles en CSS (`.pc-livre`) :
 * le trait suit `currentColor`, la couleur du texte du bouton.
 * @returns {SVGSVGElement}
 */
export function iconeTutoriel() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'pc-livre');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    for (const [classe, d] of LIVRE) {
        const trace = document.createElementNS(SVG_NS, 'path');
        trace.setAttribute('class', classe);
        trace.setAttribute('d', d);
        svg.append(trace);
    }
    return svg;
}

/**
 * Traduit et substitue les jetons `@x`. La plateforme nomme le public (D105) :
 * celle du brouillon par défaut, ou celle que l'appelant donne.
 */
export function tr(cle, jetons = {}, plateforme) {
    let texte = t(cle, plateforme);
    for (const [k, v] of Object.entries(jetons)) texte = texte.split(`@${k}`).join(String(v));
    return texte;
}

/** Le logo du site : déjà en cache, jamais une image de plus à charger. */
const LOGO = 'assets/images/branding/logo_caramel.svg';

/**
 * Le caramel de la marque, en indicateur de chargement.
 *
 * Deux copies du MÊME SVG superposées : la grise dessous, la colorée dessus,
 * découpée par un `clip-path` que la CSS anime. On ne touche pas au dessin,
 * donc rien à redessiner si le logo change — et le fichier est celui de
 * l'en-tête, déjà chargé.
 *
 * Décoratif : ce que l'indicateur raconte est écrit à côté, en toutes lettres
 * (« En cours… », « 3 activités sur 7 »). D'où l'`aria-hidden`.
 *
 * @param {'vide'|'remplissage'|'plein'} niveau - vide = pas commencé,
 *   remplissage = ça travaille (boucle), plein = c'est fait.
 * @param {string} [modificateur] - Classe de taille, ex. `pc-bonbon--mini`.
 * @returns {HTMLElement}
 */
export function bonbon(niveau, modificateur = '') {
    const node = el('span', `pc-bonbon pc-bonbon--${niveau}${modificateur ? ` ${modificateur}` : ''}`);
    node.setAttribute('aria-hidden', 'true');
    for (const couche of ['fond', 'plein']) {
        const img = document.createElement('img');
        img.src = LOGO;
        img.alt = '';
        img.className = `pc-bonbon__${couche}`;
        node.append(img);
    }
    return node;
}

export function action(cle, image, clic, classe = 'pc-secondaire', plateforme) {
    const node = el('button', classe);
    node.type = 'button';
    const label = el('span', null, t(cle, plateforme));
    // La clé de la plateforme (D105) : `translatePage()` la relit au changement de langue.
    label.dataset.key = cleSelonPlateforme(cle, plateforme);
    // `image` : nom d'icône Font Awesome, ou élément déjà construit (SVG dessiné pour l'atelier).
    node.append(typeof image === 'string' ? icone(image) : image, label);
    node.addEventListener('click', clic);
    return node;
}
