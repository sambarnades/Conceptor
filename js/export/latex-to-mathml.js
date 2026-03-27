/**
 * @file Convertisseur LaTeX vers MathML pour l'export ODT.
 *
 * Transforme du LaTeX en chaînes MathML (Presentation MathML)
 * pour l'insertion dans les fichiers content.xml des documents ODT.
 *
 * Le format ODT (OpenDocument) utilise MathML pour les formules
 * mathématiques, encapsulées dans des éléments <draw:frame>/<draw:object>.
 *
 * @example
 *   import { latexToMathML } from './latex-to-mathml.js';
 *   const mathml = latexToMathML('\\frac{x^{2}+1}{\\sqrt{n}}');
 *   // → '<math xmlns="http://www.w3.org/1998/Math/MathML">...</math>'
 */

import { parseLatex, splitTextAndMath } from './latex-parser.js';
import { getSymbolChar, getSymbolMlType, NARY_OPS, ACCENTS, BLACKBOARD } from './math-catalog.js';

/** Fallback paresseux vers latexToUnicode (import dynamique pour éviter les dépendances DOM) */
let _latexToUnicodeFn = null;
function _fallbackUnicode(text) {
    if (_latexToUnicodeFn) {
        try { return _latexToUnicodeFn(text); } catch (_) { /* ignorer */ }
    }
    return text.replace(/^\\/, '');
}

// ========================================================================
// CONSTANTES
// ========================================================================

const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

// ========================================================================
// API PUBLIQUE
// ========================================================================

/**
 * Convertit une chaîne LaTeX en MathML.
 * @param {string} latex — LaTeX brut (avec ou sans délimiteurs)
 * @returns {string} MathML complet avec balise <math>
 */
export function latexToMathML(latex) {
    // Précharger le fallback Unicode si pas encore fait
    if (!_latexToUnicodeFn) {
        import('../h5p/json-healer.js').then(mod => { _latexToUnicodeFn = mod.latexToUnicode; }).catch(() => {});
    }

    const ast = parseLatex(latex);
    const inner = _renderNodes(ast);
    // Envelopper dans <mrow> pour que LibreOffice interprète correctement
    return `<math xmlns="${MATHML_NS}"><mrow>${inner}</mrow></math>`;
}

/**
 * Convertit une chaîne LaTeX en fragment MathML (sans balise <math> englobante).
 * Utile pour construire des structures MathML imbriquées.
 * @param {string} latex — LaTeX brut
 * @returns {string} Fragment MathML
 */
export function latexToMathMLFragment(latex) {
    const ast = parseLatex(latex);
    return _renderNodes(ast);
}

/**
 * Découpe un texte mixte en segments et génère le MathML pour chaque formule.
 * @param {string} text — Texte avec formules LaTeX intégrées
 * @returns {Array<{type: 'text'|'math', value: string}>} Segments avec MathML
 */
export function splitTextWithMathML(text) {
    const segments = splitTextAndMath(text);
    return segments.map(seg => {
        if (seg.type === 'math') {
            return { type: 'math', value: latexToMathML(seg.value) };
        }
        return seg;
    });
}

// ========================================================================
// RENDU AST → MATHML
// ========================================================================

/**
 * Rend une liste de nœuds AST en MathML.
 * @param {Array} nodes — Nœuds AST
 * @returns {string} Fragment MathML
 */
function _renderNodes(nodes) {
    if (!nodes || !Array.isArray(nodes)) return '';
    return nodes.map(n => _renderNode(n)).join('');
}

/**
 * Rend un seul nœud AST en MathML.
 * @param {Object} node — Nœud AST
 * @returns {string} Fragment MathML
 */
function _renderNode(node) {
    if (!node) return '';

    switch (node.type) {
        case 'text':
            // Commande non reconnue → fallback Unicode
            if (node.value && node.value.startsWith('\\')) {
                const unicode = _fallbackUnicode(node.value);
                if (unicode && unicode !== node.value) return `<mi>${_esc(unicode)}</mi>`;
            }
            return `<mi>${_esc(node.value)}</mi>`;

        case 'number':
            return `<mn>${_esc(node.value)}</mn>`;

        case 'operator':
            return `<mo stretchy="false">${_esc(node.value)}</mo>`;

        case 'symbol':
            return _renderSymbol(node);

        case 'frac':
            return _renderFraction(node);

        case 'sqrt':
            return _renderRadical(node);

        case 'sup':
            return _renderSuperScript(node);

        case 'sub':
            return _renderSubScript(node);

        case 'subsup':
            return _renderSubSuperScript(node);

        case 'nary':
            return _renderNary(node);

        case 'func':
            return _renderFunction(node);

        case 'accent':
            return _renderAccent(node);

        case 'font':
            return _renderFont(node);

        case 'textContent':
            return `<mtext>${_esc(node.value)}</mtext>`;

        case 'delimited':
            return _renderDelimited(node);

        case 'matrix':
            return _renderMatrix(node);

        case 'cases':
            return _renderCases(node);

        case 'binom':
            return _renderBinom(node);

        case 'group':
            return _wrapRow(_renderNodes(node.children));

        case 'aligned':
            return _renderAligned(node);

        case 'space':
            return '<mspace width="0.5em"/>';

        case 'newline':
            return '<mspace linebreak="newline"/>';

        case 'align':
            return '';

        default:
            return node.value ? `<mtext>${_esc(node.value)}</mtext>` : '';
    }
}

// ========================================================================
// RENDUS SPÉCIFIQUES
// ========================================================================

/** Symbole → <mi> ou <mo> selon le type */
function _renderSymbol(node) {
    const char = getSymbolChar(node.name);
    const mlType = getSymbolMlType(node.name);
    const c = _esc(char || node.name);
    // Les opérateurs non-délimiteurs ont stretchy="false" pour LibreOffice
    if (mlType === 'mo') return `<mo stretchy="false">${c}</mo>`;
    return `<${mlType}>${c}</${mlType}>`;
}

/** \frac{num}{den} → <mfrac> */
function _renderFraction(node) {
    const num = _wrapRow(_renderNodes(node.num));
    const den = _wrapRow(_renderNodes(node.den));
    return `<mfrac>${num}${den}</mfrac>`;
}

/** \sqrt{body} ou \sqrt[n]{body} → <msqrt> ou <mroot> */
function _renderRadical(node) {
    const body = _wrapRow(_renderNodes(node.body));
    if (node.index && node.index.length > 0) {
        const index = _wrapRow(_renderNodes(node.index));
        return `<mroot>${body}${index}</mroot>`;
    }
    return `<msqrt>${body}</msqrt>`;
}

/** base^{sup} → <msup> */
function _renderSuperScript(node) {
    const base = _wrapRow(_renderNodes(node.base));
    const sup = _wrapRow(_renderNodes(node.sup));
    return `<msup>${base}${sup}</msup>`;
}

/** base_{sub} → <msub> */
function _renderSubScript(node) {
    const base = _wrapRow(_renderNodes(node.base));
    const sub = _wrapRow(_renderNodes(node.sub));
    return `<msub>${base}${sub}</msub>`;
}

/** base_{sub}^{sup} → <msubsup> */
function _renderSubSuperScript(node) {
    const base = _wrapRow(_renderNodes(node.base));
    const sub = _wrapRow(_renderNodes(node.sub));
    const sup = _wrapRow(_renderNodes(node.sup));
    return `<msubsup>${base}${sub}${sup}</msubsup>`;
}

/** Opérateur n-aire → <munderover>/<msubsup> selon le type d'opérateur */
function _renderNary(node) {
    const opInfo = NARY_OPS[node.op];
    const opChar = opInfo ? opInfo.char : node.op;
    const mo = `<mo>${_esc(opChar)}</mo>`;

    // Les intégrales utilisent <msubsup> (limites à droite du symbole),
    // les sommes/produits utilisent <munderover> (limites au-dessus/en-dessous)
    const isIntegral = ['int', 'iint', 'iiint', 'oint'].includes(node.op);

    if (node.sub && node.sup) {
        const sub = _wrapRow(_renderNodes(node.sub));
        const sup = _wrapRow(_renderNodes(node.sup));
        return isIntegral
            ? `<msubsup>${mo}${sub}${sup}</msubsup>`
            : `<munderover>${mo}${sub}${sup}</munderover>`;
    }
    if (node.sub) {
        const sub = _wrapRow(_renderNodes(node.sub));
        return isIntegral
            ? `<msub>${mo}${sub}</msub>`
            : `<munder>${mo}${sub}</munder>`;
    }
    if (node.sup) {
        const sup = _wrapRow(_renderNodes(node.sup));
        return isIntegral
            ? `<msup>${mo}${sup}</msup>`
            : `<mover>${mo}${sup}</mover>`;
    }
    return mo;
}

/** Fonction mathématique → <mi> en romain + argument */
function _renderFunction(node) {
    let nameML = `<mi mathvariant="normal">${_esc(node.name)}</mi>`;

    if (node.sub) {
        const sub = _wrapRow(_renderNodes(node.sub));
        nameML = `<munder>${nameML}${sub}</munder>`;
    }

    return nameML;
}

/** Accent → <mover> ou <munder> */
function _renderAccent(node) {
    const accentInfo = ACCENTS[node.name];
    if (!accentInfo) return _renderNodes(node.body);

    const body = _wrapRow(_renderNodes(node.body));

    if (accentInfo.mathmlUnder) {
        // \underline → <munder>
        return `<munder>${body}<mo>${_esc(accentInfo.mathmlUnder)}</mo></munder>`;
    }

    // Tous les autres accents → <mover>
    const accentChar = accentInfo.mathmlOver;
    return `<mover accent="true">${body}<mo>${_esc(accentChar)}</mo></mover>`;
}

/** Police spéciale (\mathbb, \mathcal) */
function _renderFont(node) {
    if (node.name === 'mathbb') {
        const text = _nodesToText(node.body);
        let result = '';
        for (const ch of text) {
            result += BLACKBOARD[ch] || ch;
        }
        return `<mi>${_esc(result)}</mi>`;
    }
    if (node.name === 'mathcal') {
        return `<mi mathvariant="script">${_esc(_nodesToText(node.body))}</mi>`;
    }
    if (node.name === 'mathfrak') {
        return `<mi mathvariant="fraktur">${_esc(_nodesToText(node.body))}</mi>`;
    }
    return _renderNodes(node.body);
}

/** Délimiteurs → <mfenced> ou <mo>...<mo> */
function _renderDelimited(node) {
    const body = _renderNodes(node.body);
    const open = node.open || '';
    const close = node.close || '';

    // Corps vide → texte littéral des délimiteurs (évite que LibreOffice interprète mal)
    if (!body) {
        return `<mtext>${_esc(open)}${_esc(close)}</mtext>`;
    }

    // Utiliser <mrow> avec <mo> stretch pour les délimiteurs
    return `<mrow><mo stretchy="true">${_esc(open)}</mo>${body}<mo stretchy="true">${_esc(close)}</mo></mrow>`;
}

/** Matrice → <mtable> avec <mtr>/<mtd> */
function _renderMatrix(node) {
    let table = '<mtable>';
    for (const row of node.rows) {
        table += '<mtr>';
        for (const cell of row) {
            table += `<mtd>${_wrapRow(_renderNodes(cell))}</mtd>`;
        }
        table += '</mtr>';
    }
    table += '</mtable>';

    // Envelopper selon le type de matrice
    switch (node.variant) {
        case 'pmatrix':
            return `<mrow><mo>(</mo>${table}<mo>)</mo></mrow>`;
        case 'bmatrix':
            return `<mrow><mo>[</mo>${table}<mo>]</mo></mrow>`;
        case 'Bmatrix':
            return `<mrow><mo>{</mo>${table}<mo>}</mo></mrow>`;
        case 'vmatrix':
            return `<mrow><mo>|</mo>${table}<mo>|</mo></mrow>`;
        case 'Vmatrix':
            return `<mrow><mo>\u2016</mo>${table}<mo>\u2016</mo></mrow>`;
        default:
            return table;
    }
}

/** Environnement cases → accolade gauche + tableau */
function _renderCases(node) {
    let table = '<mtable columnalign="left">';
    for (const row of node.rows) {
        table += '<mtr>';
        table += `<mtd>${_wrapRow(_renderNodes(row.value))}</mtd>`;
        if (row.condition && row.condition.length > 0) {
            table += `<mtd>${_wrapRow(_renderNodes(row.condition))}</mtd>`;
        }
        table += '</mtr>';
    }
    table += '</mtable>';

    return `<mrow><mo>{</mo>${table}</mrow>`;
}

/** Binôme → fraction entre parenthèses (sans barre) */
function _renderBinom(node) {
    const top = _wrapRow(_renderNodes(node.top));
    const bottom = _wrapRow(_renderNodes(node.bottom));
    return `<mrow><mo>(</mo><mfrac linethickness="0">${top}${bottom}</mfrac><mo>)</mo></mrow>`;
}

/** Environnement aligned → tableau multi-lignes */
function _renderAligned(node) {
    let table = '<mtable>';
    for (const line of node.lines) {
        table += `<mtr><mtd>${_wrapRow(_renderNodes(line))}</mtd></mtr>`;
    }
    table += '</mtable>';
    return table;
}

// ========================================================================
// UTILITAIRES
// ========================================================================

/**
 * Enveloppe un fragment MathML dans <mrow> s'il contient plusieurs éléments.
 * @param {string} fragment — Fragment MathML
 * @returns {string} Fragment éventuellement enveloppé
 */
function _wrapRow(fragment) {
    if (!fragment) return '<mrow/>';
    // Compter les éléments de premier niveau (heuristique : compter les < qui ne sont pas </)
    const topLevel = (fragment.match(/<[a-z]/g) || []).length;
    if (topLevel > 1) return `<mrow>${fragment}</mrow>`;
    return fragment || '<mrow/>';
}

/**
 * Échappe les caractères spéciaux XML.
 * @param {string} s — Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
function _esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}

/**
 * Extrait le texte brut d'une liste de nœuds AST.
 * @param {Array} nodes — Nœuds AST
 * @returns {string} Texte concaténé
 */
function _nodesToText(nodes) {
    if (!nodes || !Array.isArray(nodes)) return '';
    return nodes.map(n => {
        if (n.type === 'text' || n.type === 'number' || n.type === 'operator') return n.value;
        if (n.type === 'symbol') return getSymbolChar(n.name) || n.name;
        if (n.type === 'textContent') return n.value;
        if (n.type === 'group') return _nodesToText(n.children);
        return '';
    }).join('');
}

// ========================================================================
// GÉNÉRATION ODT — Structure pour insertion dans content.xml
// ========================================================================

/**
 * Génère le XML complet pour insérer une formule dans un document ODT.
 * Inclut le <draw:frame> et le <draw:object> avec le MathML.
 *
 * @param {string} latex — LaTeX brut
 * @param {number} [index=0] — Index unique pour nommer l'objet
 * @returns {string} XML pour content.xml
 */
export function latexToOdtMathObject(latex, index = 0) {
    const mathml = latexToMathML(latex);
    return `<draw:frame draw:style-name="fr1" draw:name="Formula${index}" ` +
           `text:anchor-type="as-char" svg:width="0.5in" svg:height="0.3in" ` +
           `draw:z-index="0">` +
           `<draw:object>` +
           mathml +
           `</draw:object>` +
           `</draw:frame>`;
}
