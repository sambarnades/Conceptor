/**
 * @file Convertisseur LaTeX vers OMML (Office Math Markup Language).
 *
 * Transforme du LaTeX en objets docx.js Math pour l'export DOCX.
 * Produit de vraies formules éditables dans Word (pas du Unicode).
 *
 * Utilise le parser partagé (latex-parser.js) et le catalogue (math-catalog.js).
 *
 * @example
 *   import { latexToOmml, textWithMathToDocxChildren } from './latex-to-omml.js';
 *   // Formule pure → objet Math docx.js
 *   const mathObj = latexToOmml('\\frac{x^{2}+1}{\\sqrt{n}}');
 *   // Texte mixte → tableau de TextRun + Math
 *   const children = textWithMathToDocxChildren('La solution est \\(\\frac{1}{2}\\).');
 *
 * Limitations connues :
 * - Les accents (\vec, \hat, \overline) utilisent les caractères Unicode combinants
 *   car docx.js n'expose pas le constructeur <m:acc>. Résultat fonctionnel mais
 *   les barres/flèches ne fusionnent pas visuellement sur plusieurs caractères.
 * - Les opérateurs n-aires autres que \sum et \int (\prod, \coprod, etc.)
 *   utilisent MathSum car docx.js ne permet pas de spécifier un caractère custom.
 *   Le caractère sera ∑ au lieu de ∏ — fallback acceptable.
 */

import { parseLatex, splitTextAndMath } from './latex-parser.js';
import { getSymbolChar, NARY_OPS, ACCENTS, BLACKBOARD } from './math-catalog.js';

/** Fallback paresseux vers latexToUnicode (import dynamique pour éviter les dépendances DOM) */
let _latexToUnicodeFn = null;
async function _loadLatexToUnicode() {
    if (!_latexToUnicodeFn) {
        try {
            const mod = await import('../h5p/json-healer.js');
            _latexToUnicodeFn = mod.latexToUnicode;
        } catch (_) {
            _latexToUnicodeFn = (s) => s; // fallback identité
        }
    }
    return _latexToUnicodeFn;
}
/** Version synchrone : utilise le cache s'il est chargé, sinon strip le backslash */
function _fallbackUnicode(text) {
    if (_latexToUnicodeFn) {
        try { return _latexToUnicodeFn(text); } catch (_) { /* ignorer */ }
    }
    // Fallback minimal : retirer le backslash
    return text.replace(/^\\/, '');
}

// ========================================================================
// API PUBLIQUE
// ========================================================================

/**
 * Convertit une chaîne LaTeX pure en objet Math docx.js.
 * @param {string} latex — LaTeX brut (avec ou sans délimiteurs)
 * @returns {Object} Objet Math docx.js prêt à être inséré dans un Paragraph
 */
export function latexToOmml(latex) {
    // Précharger le fallback Unicode si pas encore fait
    if (!_latexToUnicodeFn) _loadLatexToUnicode();

    const { Math: MathContainer } = _getDocxMath();
    const ast = parseLatex(latex);
    const children = _renderNodes(ast);
    // Assurer qu'il y a au moins un enfant
    if (children.length === 0) {
        const { MathRun } = _getDocxMath();
        children.push(new MathRun(''));
    }
    return new MathContainer({ children });
}

/**
 * Convertit un texte mélangé (texte + formules LaTeX) en tableau d'éléments docx.js.
 * Les formules \(...\) et \[...\] deviennent des objets Math,
 * le reste devient des TextRun (avec parsing Markdown basique).
 *
 * @param {string} text — Texte avec formules LaTeX intégrées
 * @param {Object} [baseStyle={}] — Style de base pour les TextRun
 * @param {function} [textRunParser] — Fonction pour parser le texte (ex: parseMarkdownToTextRuns)
 * @returns {Array} Tableau de TextRun et Math, utilisable comme children d'un Paragraph
 */
export function textWithMathToDocxChildren(text, baseStyle = {}, textRunParser = null) {
    const { TextRun } = window.docx;
    const segments = splitTextAndMath(text);
    const result = [];

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment.type === 'math') {
            result.push(latexToOmml(segment.value));
            // Ajouter un espace fin si du texte suit et ne commence pas par un espace ou ponctuation
            const next = segments[i + 1];
            if (next && next.type === 'text' && next.value && !/^[\s.,;:!?)}\]]/.test(next.value)) {
                result.push(new TextRun({ text: ' ', ...baseStyle }));
            }
        } else if (segment.value) {
            if (textRunParser) {
                result.push(...textRunParser(segment.value, baseStyle));
            } else {
                result.push(new TextRun({ text: segment.value, ...baseStyle }));
            }
        }
    }

    return result;
}

// ========================================================================
// CACHE DOCX.JS — chargement paresseux des classes Math
// ========================================================================

let _docxMathCache = null;

function _getDocxMath() {
    if (_docxMathCache) return _docxMathCache;

    const d = window.docx;
    _docxMathCache = {
        Math: d.Math,
        MathRun: d.MathRun,
        MathFraction: d.MathFraction,
        MathRadical: d.MathRadical,
        MathSuperScript: d.MathSuperScript,
        MathSubScript: d.MathSubScript,
        MathSubSuperScript: d.MathSubSuperScript,
        MathSum: d.MathSum,
        MathIntegral: d.MathIntegral,
        MathFunction: d.MathFunction,
        MathRoundBrackets: d.MathRoundBrackets,
        MathSquareBrackets: d.MathSquareBrackets,
        MathCurlyBrackets: d.MathCurlyBrackets,
        MathAngledBrackets: d.MathAngledBrackets,
        MathPreSubSuperScript: d.MathPreSubSuperScript,
        // Classes internes utiles
        MathBase: d.MathBase,
        MathNumerator: d.MathNumerator,
        MathDenominator: d.MathDenominator,
        MathDegree: d.MathDegree,
        // Pour les éléments OMML personnalisés (matrice, eqArr)
        XmlComponent: d.XmlComponent,
        XmlAttributeComponent: d.XmlAttributeComponent
    };
    return _docxMathCache;
}

// ========================================================================
// RENDU AST → OMML
// ========================================================================

/**
 * Rend une liste de nœuds AST en objets docx.js Math.
 * @param {Array} nodes — Nœuds AST
 * @returns {Array} Objets docx.js Math
 */
function _renderNodes(nodes) {
    if (!nodes || !Array.isArray(nodes)) return [];
    return nodes.flatMap(node => _renderNode(node));
}

/**
 * Rend un seul nœud AST en objet(s) docx.js Math.
 * @param {Object} node — Nœud AST
 * @returns {Array} Objets docx.js Math (tableau car certains nœuds produisent plusieurs éléments)
 */
function _renderNode(node) {
    if (!node) return [];
    const { MathRun } = _getDocxMath();

    switch (node.type) {
        case 'text':
            // Si le texte commence par \ c'est une commande non reconnue → fallback Unicode
            if (node.value && node.value.startsWith('\\')) {
                const unicode = _fallbackUnicode(node.value);
                if (unicode && unicode !== node.value) return [new MathRun(unicode)];
            }
            return [new MathRun(node.value)];

        case 'number':
            return [new MathRun(node.value)];

        case 'operator':
            return [new MathRun(node.value)];

        case 'symbol':
            return _renderSymbol(node);

        case 'frac':
            return [_renderFraction(node)];

        case 'sqrt':
            return [_renderRadical(node)];

        case 'sup':
            return [_renderSuperScript(node)];

        case 'sub':
            return [_renderSubScript(node)];

        case 'subsup':
            return [_renderSubSuperScript(node)];

        case 'nary':
            return [_renderNary(node)];

        case 'func':
            return _renderFunction(node);

        case 'accent':
            return _renderAccent(node);

        case 'font':
            return _renderFont(node);

        case 'textContent':
            return [new MathRun(node.value)];

        case 'delimited':
            return [_renderDelimited(node)];

        case 'matrix':
            return _renderMatrix(node);

        case 'cases':
            return _renderCases(node);

        case 'binom':
            return [_renderBinom(node)];

        case 'group':
            return _renderNodes(node.children);

        case 'aligned':
            return _renderAligned(node);

        case 'space':
            return node.value ? [new MathRun(node.value)] : [];

        case 'newline':
            return [new MathRun(' ')]; // Espace comme fallback dans OMML

        case 'align':
            return []; // Ignoré dans le rendu OMML

        default:
            return [new MathRun(node.value || '')];
    }
}

// ========================================================================
// RENDUS SPÉCIFIQUES
// ========================================================================

/** Symbole LaTeX → MathRun avec le bon caractère Unicode */
function _renderSymbol(node) {
    const { MathRun } = _getDocxMath();
    const char = getSymbolChar(node.name);
    return [new MathRun(char || node.name)];
}

/** \frac{num}{den} → MathFraction */
function _renderFraction(node) {
    const { MathFraction } = _getDocxMath();
    return new MathFraction({
        numerator: _renderNodes(node.num),
        denominator: _renderNodes(node.den)
    });
}

/** \sqrt{body} ou \sqrt[index]{body} → MathRadical */
function _renderRadical(node) {
    const { MathRadical } = _getDocxMath();
    const opts = {
        children: _renderNodes(node.body)
    };
    if (node.index && node.index.length > 0) {
        opts.degree = _renderNodes(node.index);
    }
    return new MathRadical(opts);
}

/** base^{sup} → MathSuperScript */
function _renderSuperScript(node) {
    const { MathSuperScript } = _getDocxMath();
    return new MathSuperScript({
        children: _renderNodes(node.base),
        superScript: _renderNodes(node.sup)
    });
}

/** base_{sub} → MathSubScript */
function _renderSubScript(node) {
    const { MathSubScript } = _getDocxMath();
    return new MathSubScript({
        children: _renderNodes(node.base),
        subScript: _renderNodes(node.sub)
    });
}

/** base_{sub}^{sup} → MathSubSuperScript */
function _renderSubSuperScript(node) {
    const { MathSubSuperScript } = _getDocxMath();
    return new MathSubSuperScript({
        children: _renderNodes(node.base),
        subScript: _renderNodes(node.sub),
        superScript: _renderNodes(node.sup)
    });
}

/**
 * Opérateur n-aire (\sum, \prod, \int...) → MathSum ou MathIntegral.
 * Limitation : seuls \sum (MathSum) et \int (MathIntegral) ont un rendu natif.
 * Les autres utilisent MathSum avec le caractère affiché en fallback.
 */
function _renderNary(node) {
    const { MathSum, MathIntegral, MathRun } = _getDocxMath();

    // Le corps vide → espace insécable pour que le n-ary soit valide
    const bodyChildren = _renderNodes(node.body || []);
    if (bodyChildren.length === 0) bodyChildren.push(new MathRun('\u200B'));

    const opts = {
        children: bodyChildren
    };
    if (node.sub) opts.subScript = _renderNodes(node.sub);
    if (node.sup) opts.superScript = _renderNodes(node.sup);

    // Intégrale
    if (['int', 'iint', 'iiint', 'oint'].includes(node.op)) {
        return new MathIntegral(opts);
    }

    // Somme et tous les autres n-aires → MathSum
    // (MathSum affiche ∑, ce qui est correct pour \sum, mais pas pour \prod etc.)
    return new MathSum(opts);
}

/**
 * Fonction mathématique (\sin, \cos, \log, \lim...) → MathFunction ou MathRun.
 * Si la fonction a un indice (\lim_{x→0}), utilise MathSubScript sur le nom.
 */
function _renderFunction(node) {
    const { MathFunction, MathRun, MathSubScript } = _getDocxMath();

    // Nom de la fonction (en romain)
    let nameChildren = [new MathRun(node.name)];

    // Si la fonction a un indice (ex: \lim_{x \to 0})
    if (node.sub) {
        const subName = new MathSubScript({
            children: nameChildren,
            subScript: _renderNodes(node.sub)
        });
        return [subName];
    }

    // Pas de contenu "enfant" explicite pour les fonctions seules
    // → retourner juste le nom
    return [new MathRun(node.name)];
}

/**
 * Accent (\vec{u}, \hat{x}, \overline{AB}...).
 * Utilise les caractères Unicode combinants car docx.js n'expose pas <m:acc>.
 */
function _renderAccent(node) {
    const { MathRun } = _getDocxMath();
    const accentInfo = ACCENTS[node.name];
    if (!accentInfo) {
        // Accent inconnu → rendre le corps tel quel
        return _renderNodes(node.body);
    }

    // Stratégie : rendre le corps en texte, puis ajouter le caractère combinant
    const bodyText = _nodesToText(node.body);
    const combiningChar = accentInfo.ommlChar;

    // Appliquer le caractère combinant après chaque caractère du corps
    let result = '';
    for (const ch of bodyText) {
        result += ch + combiningChar;
    }

    return [new MathRun(result)];
}

/** Commande de police (\mathbb{R}, \mathcal{L}) */
function _renderFont(node) {
    const { MathRun } = _getDocxMath();

    if (node.name === 'mathbb') {
        // Utiliser les caractères blackboard bold Unicode
        const text = _nodesToText(node.body);
        let result = '';
        for (const ch of text) {
            result += BLACKBOARD[ch] || ch;
        }
        return [new MathRun(result)];
    }

    // Autres polices → rendre comme texte normal
    return _renderNodes(node.body);
}

/**
 * Délimiteurs \left( ... \right) → MathRoundBrackets, MathSquareBrackets, etc.
 */
function _renderDelimited(node) {
    const {
        MathRoundBrackets, MathSquareBrackets, MathCurlyBrackets, MathAngledBrackets, MathRun
    } = _getDocxMath();

    const bodyChildren = _renderNodes(node.body);
    if (bodyChildren.length === 0) bodyChildren.push(new MathRun('\u200B'));
    const opts = { children: bodyChildren };

    // Mapper vers le bon type de brackets
    const open = node.open;
    const close = node.close;

    if (open === '(' && close === ')') return new MathRoundBrackets(opts);
    if (open === '[' && close === ']') return new MathSquareBrackets(opts);
    if (open === '{' && close === '}') return new MathCurlyBrackets(opts);
    if (open === '\u27E8' || close === '\u27E9') return new MathAngledBrackets(opts);

    // Barres verticales et autres → parenthèses rondes par défaut
    // avec fallback en MathRun pour les délimiteurs spéciaux
    if (open === '|' && close === '|') {
        return new MathRoundBrackets(opts); // Fallback - pas de MathBarBrackets dans docx.js
    }

    // Délimiteur invisible ou inconnu
    if (!open && !close) {
        // Pas de délimiteur → retourner le contenu directement
        return bodyChildren.length === 1 ? bodyChildren[0] : new MathRoundBrackets(opts);
    }

    return new MathRoundBrackets(opts);
}

// ========================================================================
// HELPERS OMML PERSONNALISÉS (matrice, eqArr)
// docx.js n'expose pas <m:m> ni <m:eqArr>. On les construit via XmlComponent.
// ========================================================================

/** Élément OMML simple avec des enfants */
function _ommlElement(rootKey, children) {
    const { XmlComponent } = _getDocxMath();
    const el = new XmlComponent(rootKey);
    for (const c of (children || [])) el.root.push(c);
    return el;
}

/** Attribut OMML (ex: <m:count m:val="2"/>) */
function _ommlAttr(rootKey, attrName, attrValue) {
    const { XmlComponent, XmlAttributeComponent } = _getDocxMath();
    const el = new XmlComponent(rootKey);
    el.root.push(new XmlAttributeComponent({ [attrName]: attrValue }));
    return el;
}

/**
 * Matrice (\begin{pmatrix}...) → <m:d><m:e><m:m>..rows..</m:m></m:e></m:d>
 * Utilise le vrai élément OMML <m:m> avec <m:mr>/<m:e> pour un rendu 2D natif.
 */
function _renderMatrix(node) {
    const { MathRun, MathRoundBrackets, MathSquareBrackets, MathCurlyBrackets } = _getDocxMath();

    // Nombre de colonnes (largeur de la première ligne)
    const colCount = node.rows[0]?.length || 1;

    // <m:mPr> : propriétés de la matrice (nombre de colonnes, alignement)
    const mPr = _ommlElement('m:mPr', [
        _ommlElement('m:mcs', [
            _ommlElement('m:mc', [
                _ommlElement('m:mcPr', [
                    _ommlAttr('m:count', 'm:val', String(colCount)),
                    _ommlAttr('m:mcJc', 'm:val', 'center')
                ])
            ])
        ])
    ]);

    // <m:mr> pour chaque ligne, <m:e> pour chaque cellule
    const matrixEl = _ommlElement('m:m', [mPr]);
    for (const row of node.rows) {
        const mr = _ommlElement('m:mr', []);
        for (const cell of row) {
            const cellChildren = _renderNodes(cell);
            mr.root.push(_ommlElement('m:e',
                cellChildren.length > 0 ? cellChildren : [new MathRun('')]
            ));
        }
        matrixEl.root.push(mr);
    }

    // Envelopper dans un délimiteur selon le variant, en injectant la matrice dans <m:e>
    function wrapInDelimiter(BracketClass) {
        const d = new BracketClass({ children: [new MathRun('')] });
        d.root[1] = _ommlElement('m:e', [matrixEl]); // remplace le MathBase placeholder
        return [d];
    }

    switch (node.variant) {
        case 'pmatrix': return wrapInDelimiter(MathRoundBrackets);
        case 'bmatrix': return wrapInDelimiter(MathSquareBrackets);
        case 'Bmatrix': return wrapInDelimiter(MathCurlyBrackets);
        case 'vmatrix': return wrapInDelimiter(MathRoundBrackets);
        default: return wrapInDelimiter(MathRoundBrackets);
    }
}

/**
 * Environnement cases → <m:d begChr="{" endChr=""><m:e><m:eqArr>...</m:eqArr></m:e></m:d>
 * Utilise le vrai élément OMML <m:eqArr> avec accolade gauche seule.
 */
function _renderCases(node) {
    const { MathRun } = _getDocxMath();

    // <m:eqArr> : chaque cas est un <m:e>
    const eqArr = _ommlElement('m:eqArr', []);
    for (const row of node.rows) {
        const lineChildren = [];
        lineChildren.push(..._renderNodes(row.value));
        if (row.condition && row.condition.length > 0) {
            lineChildren.push(new MathRun('  '));
            lineChildren.push(..._renderNodes(row.condition));
        }
        eqArr.root.push(_ommlElement('m:e',
            lineChildren.length > 0 ? lineChildren : [new MathRun('')]
        ));
    }

    // <m:d> avec accolade gauche seule (begChr="{", endChr="")
    const dPr = _ommlElement('m:dPr', [
        _ommlAttr('m:begChr', 'm:val', '{'),
        _ommlAttr('m:endChr', 'm:val', '')
    ]);

    return [_ommlElement('m:d', [dPr, _ommlElement('m:e', [eqArr])])];
}

/**
 * Binôme \binom{n}{k} → fraction sans barre entre parenthèses.
 * OMML : <m:d><m:e><m:f><m:fPr><m:type m:val="noBar"/></m:fPr><m:num>n</m:num><m:den>k</m:den></m:f></m:e></m:d>
 * docx.js MathFraction produit une barre visible — on construit la fraction via XmlComponent.
 */
function _renderBinom(node) {
    const { MathRun, MathRoundBrackets } = _getDocxMath();

    // Fraction sans barre : <m:f><m:fPr><m:type m:val="noBar"/></m:fPr><m:num>...</m:num><m:den>...</m:den></m:f>
    const numChildren = _renderNodes(node.top);
    const denChildren = _renderNodes(node.bottom);
    const frac = _ommlElement('m:f', [
        _ommlElement('m:fPr', [_ommlAttr('m:type', 'm:val', 'noBar')]),
        _ommlElement('m:num', numChildren.length > 0 ? numChildren : [new MathRun('')]),
        _ommlElement('m:den', denChildren.length > 0 ? denChildren : [new MathRun('')])
    ]);

    // Envelopper dans des parenthèses rondes
    const d = new MathRoundBrackets({ children: [new MathRun('')] });
    d.root[1] = _ommlElement('m:e', [frac]);
    return d;
}

/**
 * Environnement aligned → lignes multiples séparées par des espaces.
 */
function _renderAligned(node) {
    const { MathRun } = _getDocxMath();
    const children = [];
    for (let i = 0; i < node.lines.length; i++) {
        children.push(..._renderNodes(node.lines[i]));
        if (i < node.lines.length - 1) {
            children.push(new MathRun(' ')); // séparateur de lignes
        }
    }
    return children;
}

// ========================================================================
// UTILITAIRES
// ========================================================================

/**
 * Extrait le texte brut d'une liste de nœuds AST (pour les accents).
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
        if (n.type === 'space') return n.value || ' ';
        return '';
    }).join('');
}
