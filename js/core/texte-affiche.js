/**
 * @file Texte d'un élément tel qu'il s'affiche, sauts de ligne compris — même masqué.
 *
 * `innerText` ne restitue les sauts de ligne (<br>, blocs) que pour un élément RENDU.
 * Sous un ancêtre en `display: none`, il retombe sur `textContent`, qui les ignore :
 * les lignes se recollent bout à bout. Or la zone des sources (#ocr-output) vit dans
 * les champs du mode Avancé, masqués en mode Rapide : un document joint partait alors
 * vers l'IA sous la forme « …Ligne un du coursLigne deux du cours… ».
 *
 * Module SANS import (comme `escape.js`) : lu par le générateur de prompts, l'interface
 * et l'atelier de parcours, et testable en Node.
 */

const BLOCS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DIV', 'DL', 'DT', 'FIGCAPTION',
    'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI',
    'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'TR', 'UL'
]);

/**
 * @param {Element|null} el
 * @returns {string} le texte de `el`, une ligne affichée = une ligne de texte
 */
export function texteAffiche(el) {
    if (!el) return '';
    // Élément rendu : innerText fait foi, c'est ce que l'enseignant a sous les yeux.
    if (typeof el.getClientRects === 'function' && el.getClientRects().length > 0) {
        return el.innerText || '';
    }
    // Élément masqué ou détaché : même règle, appliquée à la main. Les nœuds texte sont
    // repris tels quels — la zone des sources est en `white-space: pre-wrap`.
    let texte = '';
    const finDeLigne = () => { if (texte && !texte.endsWith('\n')) texte += '\n'; };
    const parcourir = (noeud) => {
        for (const n of noeud.childNodes) {
            if (n.nodeType === 3) texte += n.nodeValue;
            else if (n.nodeType !== 1) continue;
            else if (n.nodeName === 'BR') texte += '\n';
            else if (BLOCS.has(n.nodeName)) { finDeLigne(); parcourir(n); finDeLigne(); }
            else parcourir(n);
        }
    };
    parcourir(el);
    return texte;
}
