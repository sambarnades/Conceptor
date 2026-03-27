/**
 * Formula Assistant — Modale d'aide à l'insertion de formules LaTeX
 *
 * Fournit une interface visuelle modale pour construire des formules :
 * - 6 catégories de symboles/structures
 * - Grille cliquable pour insérer des templates LaTeX
 * - Saisie directe LaTeX pour les experts
 * - Prévisualisation en temps réel via MathJax
 *
 * Ouverte via le bouton Math de la toolbar ou double-clic sur une formule.
 */

import { t } from '../core/translation.js';
import { loadMathJax } from '../core/lib-loader.js';

// =======================================================================
// CATÉGORIES DE SYMBOLES
// =======================================================================

const FORMULA_CATEGORIES = [
    {
        id: 'fractions',
        label: 'editor_formula_fractions',
        icon: '½',
        items: [
            { latex: '\\frac{a}{b}', display: '\\(\\frac{a}{b}\\)', label: 'a/b' },
            { latex: '\\frac{1}{2}', display: '\\(\\frac{1}{2}\\)', label: '1/2' },
            { latex: '\\frac{1}{3}', display: '\\(\\frac{1}{3}\\)', label: '1/3' },
            { latex: '\\frac{1}{4}', display: '\\(\\frac{1}{4}\\)', label: '1/4' },
            { latex: '\\frac{a+b}{c}', display: '\\(\\frac{a+b}{c}\\)', label: '(a+b)/c' },
            { latex: '\\frac{a}{b+c}', display: '\\(\\frac{a}{b+c}\\)', label: 'a/(b+c)' },
            { latex: '\\frac{\\frac{a}{b}}{c}', display: '\\(\\frac{\\frac{a}{b}}{c}\\)', label: 'Fraction composée' }
        ]
    },
    {
        id: 'roots',
        label: 'editor_formula_roots',
        icon: '√',
        items: [
            { latex: '\\sqrt{x}', display: '\\(\\sqrt{x}\\)', label: '√x' },
            { latex: '\\sqrt[3]{x}', display: '\\(\\sqrt[3]{x}\\)', label: '∛x' },
            { latex: '\\sqrt[n]{x}', display: '\\(\\sqrt[n]{x}\\)', label: 'ⁿ√x' },
            { latex: '\\sqrt{a^2+b^2}', display: '\\(\\sqrt{a^2+b^2}\\)', label: '√(a²+b²)' },
            { latex: '\\sqrt{\\frac{a}{b}}', display: '\\(\\sqrt{\\frac{a}{b}}\\)', label: '√(a/b)' }
        ]
    },
    {
        id: 'powers',
        label: 'editor_formula_powers',
        icon: 'x²',
        items: [
            { latex: 'x^{2}', display: '\\(x^{2}\\)', label: 'x²' },
            { latex: 'x^{3}', display: '\\(x^{3}\\)', label: 'x³' },
            { latex: 'x^{n}', display: '\\(x^{n}\\)', label: 'xⁿ' },
            { latex: 'x_{n}', display: '\\(x_{n}\\)', label: 'xₙ' },
            { latex: 'x^{n}_{m}', display: '\\(x^{n}_{m}\\)', label: 'xₘⁿ' },
            { latex: 'a \\times 10^{n}', display: '\\(a \\times 10^{n}\\)', label: 'a×10ⁿ' },
            { latex: 'e^{x}', display: '\\(e^{x}\\)', label: 'eˣ' },
            { latex: '\\log_{a}(x)', display: '\\(\\log_{a}(x)\\)', label: 'logₐ(x)' },
            { latex: '\\ln(x)', display: '\\(\\ln(x)\\)', label: 'ln(x)' }
        ]
    },
    {
        id: 'greek',
        label: 'editor_formula_greek',
        icon: 'α',
        items: [
            { latex: '\\alpha', display: '\\(\\alpha\\)', label: 'alpha' },
            { latex: '\\beta', display: '\\(\\beta\\)', label: 'beta' },
            { latex: '\\gamma', display: '\\(\\gamma\\)', label: 'gamma' },
            { latex: '\\delta', display: '\\(\\delta\\)', label: 'delta' },
            { latex: '\\epsilon', display: '\\(\\epsilon\\)', label: 'epsilon' },
            { latex: '\\eta', display: '\\(\\eta\\)', label: 'eta' },
            { latex: '\\theta', display: '\\(\\theta\\)', label: 'theta' },
            { latex: '\\lambda', display: '\\(\\lambda\\)', label: 'lambda' },
            { latex: '\\mu', display: '\\(\\mu\\)', label: 'mu' },
            { latex: '\\nu', display: '\\(\\nu\\)', label: 'nu' },
            { latex: '\\xi', display: '\\(\\xi\\)', label: 'xi' },
            { latex: '\\pi', display: '\\(\\pi\\)', label: 'pi' },
            { latex: '\\rho', display: '\\(\\rho\\)', label: 'rho' },
            { latex: '\\sigma', display: '\\(\\sigma\\)', label: 'sigma' },
            { latex: '\\tau', display: '\\(\\tau\\)', label: 'tau' },
            { latex: '\\phi', display: '\\(\\phi\\)', label: 'phi' },
            { latex: '\\chi', display: '\\(\\chi\\)', label: 'chi' },
            { latex: '\\psi', display: '\\(\\psi\\)', label: 'psi' },
            { latex: '\\omega', display: '\\(\\omega\\)', label: 'omega' },
            { latex: '\\Delta', display: '\\(\\Delta\\)', label: 'Delta' },
            { latex: '\\Gamma', display: '\\(\\Gamma\\)', label: 'Gamma' },
            { latex: '\\Theta', display: '\\(\\Theta\\)', label: 'Theta' },
            { latex: '\\Lambda', display: '\\(\\Lambda\\)', label: 'Lambda' },
            { latex: '\\Sigma', display: '\\(\\Sigma\\)', label: 'Sigma' },
            { latex: '\\Phi', display: '\\(\\Phi\\)', label: 'Phi' },
            { latex: '\\Psi', display: '\\(\\Psi\\)', label: 'Psi' },
            { latex: '\\Omega', display: '\\(\\Omega\\)', label: 'Omega' },
            { latex: '\\Pi', display: '\\(\\Pi\\)', label: 'Pi' }
        ]
    },
    {
        id: 'operators',
        label: 'editor_formula_operators',
        icon: '±',
        items: [
            { latex: '\\times', display: '\\(\\times\\)', label: '×' },
            { latex: '\\div', display: '\\(\\div\\)', label: '÷' },
            { latex: '\\pm', display: '\\(\\pm\\)', label: '±' },
            { latex: '\\leq', display: '\\(\\leq\\)', label: '≤' },
            { latex: '\\geq', display: '\\(\\geq\\)', label: '≥' },
            { latex: '\\neq', display: '\\(\\neq\\)', label: '≠' },
            { latex: '\\approx', display: '\\(\\approx\\)', label: '≈' },
            { latex: '\\equiv', display: '\\(\\equiv\\)', label: '≡' },
            { latex: '\\infty', display: '\\(\\infty\\)', label: '∞' },
            { latex: '\\sum_{i=1}^{n}', display: '\\(\\sum_{i=1}^{n}\\)', label: 'Σ somme' },
            { latex: '\\prod_{i=1}^{n}', display: '\\(\\prod_{i=1}^{n}\\)', label: 'Π produit' },
            { latex: '\\int_{a}^{b}', display: '\\(\\int_{a}^{b}\\)', label: '∫ intégrale' },
            { latex: '\\lim_{x \\to a}', display: '\\(\\lim_{x \\to a}\\)', label: 'lim' },
            { latex: '\\partial', display: '\\(\\partial\\)', label: '∂' },
            { latex: '\\nabla', display: '\\(\\nabla\\)', label: '∇' },
            { latex: '\\rightarrow', display: '\\(\\rightarrow\\)', label: '→' },
            { latex: '\\leftarrow', display: '\\(\\leftarrow\\)', label: '←' },
            { latex: '\\Rightarrow', display: '\\(\\Rightarrow\\)', label: '⇒' },
            { latex: '\\Leftrightarrow', display: '\\(\\Leftrightarrow\\)', label: '⇔' },
            { latex: '\\mapsto', display: '\\(\\mapsto\\)', label: '↦' },
            { latex: '\\in', display: '\\(\\in\\)', label: '∈' },
            { latex: '\\notin', display: '\\(\\notin\\)', label: '∉' },
            { latex: '\\subset', display: '\\(\\subset\\)', label: '⊂' },
            { latex: '\\cup', display: '\\(\\cup\\)', label: '∪' },
            { latex: '\\cap', display: '\\(\\cap\\)', label: '∩' },
            { latex: '\\emptyset', display: '\\(\\emptyset\\)', label: '∅' },
            { latex: '\\forall', display: '\\(\\forall\\)', label: '∀' },
            { latex: '\\exists', display: '\\(\\exists\\)', label: '∃' }
        ]
    },
    {
        id: 'structures',
        label: 'editor_formula_structures',
        icon: '{}',
        items: [
            { latex: '\\vec{u}', display: '\\(\\vec{u}\\)', label: 'Vecteur' },
            { latex: '\\overline{AB}', display: '\\(\\overline{AB}\\)', label: 'Barre' },
            { latex: '\\hat{x}', display: '\\(\\hat{x}\\)', label: 'Chapeau' },
            { latex: '\\left( \\right)', display: '\\(\\left( \\right)\\)', label: 'Parenthèses' },
            { latex: '\\left[ \\right]', display: '\\(\\left[ \\right]\\)', label: 'Crochets' },
            { latex: '\\left\\{ \\right\\}', display: '\\(\\left\\{ \\right\\}\\)', label: 'Accolades' },
            { latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', display: '\\(\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\)', label: 'Matrice' },
            { latex: '\\begin{cases} a & \\text{si } x > 0 \\\\ b & \\text{sinon} \\end{cases}', display: '\\(\\begin{cases} a \\\\ b \\end{cases}\\)', label: 'Cas' },
            { latex: '\\binom{n}{k}', display: '\\(\\binom{n}{k}\\)', label: 'Binôme' },
            { latex: '\\mathbb{N}', display: '\\(\\mathbb{N}\\)', label: 'ℕ' },
            { latex: '\\mathbb{Z}', display: '\\(\\mathbb{Z}\\)', label: 'ℤ' },
            { latex: '\\mathbb{Q}', display: '\\(\\mathbb{Q}\\)', label: 'ℚ' },
            { latex: '\\mathbb{R}', display: '\\(\\mathbb{R}\\)', label: 'ℝ' },
            { latex: '\\mathbb{C}', display: '\\(\\mathbb{C}\\)', label: 'ℂ' }
        ]
    }
];

// =======================================================================
// MODALE FORMULE
// =======================================================================

/** Délai pour le debounce de la preview */
let previewTimeout = null;
/** Référence à la modale ouverte (une seule à la fois) */
let activeModal = null;

/**
 * Ouvre la modale assistant formules.
 * @param {function} onInsert — Callback appelé avec le LaTeX final
 * @param {string} existingLatex — LaTeX existant à éditer (vide pour nouvelle formule)
 */
export function createFormulaAssistant(anchorElement, onInsert, existingLatex = '') {
    // Fermer toute modale précédente
    if (activeModal) {
        activeModal.remove();
        activeModal = null;
    }

    // Overlay sombre
    const overlay = document.createElement('div');
    overlay.className = 'json-editor__formula-overlay';

    // Panel central
    const panel = document.createElement('div');
    panel.className = 'json-editor__formula-panel';

    // Empêcher la propagation des clics vers l'overlay
    panel.addEventListener('mousedown', (e) => e.stopPropagation());

    // En-tête
    const header = document.createElement('div');
    header.className = 'json-editor__formula-header';
    const title = document.createElement('span');
    title.textContent = existingLatex
        ? (t('editor_formula_edit') || 'Modifier la formule')
        : (t('editor_formula_title') || 'Formule mathématique');
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'json-editor__formula-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', () => _closeModal(overlay));
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Onglets catégories
    const categories = document.createElement('div');
    categories.className = 'json-editor__formula-categories';
    FORMULA_CATEGORIES.forEach((cat, i) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'json-editor__formula-category';
        if (i === 0) tab.classList.add('json-editor__formula-category--active');
        tab.dataset.category = cat.id;
        tab.textContent = t(cat.label) || cat.icon;
        tab.addEventListener('click', () => _selectCategory(panel, cat.id, input));
        categories.appendChild(tab);
    });
    panel.appendChild(categories);

    // Grille de symboles
    const grid = document.createElement('div');
    grid.className = 'json-editor__formula-grid';
    panel.appendChild(grid);

    // Zone de saisie LaTeX
    const inputArea = document.createElement('div');
    inputArea.className = 'json-editor__formula-input-area';
    const inputLabel = document.createElement('label');
    inputLabel.textContent = 'LaTeX';
    inputArea.appendChild(inputLabel);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'json-editor__formula-input';
    input.placeholder = t('editor_formula_input_placeholder') || 'Saisir du LaTeX...';
    input.value = existingLatex;
    input.addEventListener('input', () => _debouncePreview(panel, input.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            _insertAndClose(overlay, input, onInsert);
        } else if (e.key === 'Escape') {
            _closeModal(overlay);
        }
    });
    inputArea.appendChild(input);
    panel.appendChild(inputArea);

    // Zone de prévisualisation
    const preview = document.createElement('div');
    preview.className = 'json-editor__formula-preview-area';
    if (!existingLatex) {
        preview.classList.add('json-editor__formula-preview-area--empty');
        preview.textContent = t('editor_formula_preview') || 'Aperçu';
    }
    panel.appendChild(preview);

    // Boutons d'action
    const actions = document.createElement('div');
    actions.className = 'json-editor__formula-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'json-editor__formula-btn json-editor__formula-btn--cancel';
    cancelBtn.textContent = t('editor_formula_cancel') || 'Annuler';
    cancelBtn.addEventListener('click', () => _closeModal(overlay));
    actions.appendChild(cancelBtn);

    const insertBtn = document.createElement('button');
    insertBtn.type = 'button';
    insertBtn.className = 'json-editor__formula-btn json-editor__formula-btn--insert';
    insertBtn.textContent = existingLatex
        ? (t('editor_formula_edit') || 'Modifier')
        : (t('editor_formula_insert') || 'Insérer');
    insertBtn.addEventListener('click', () => _insertAndClose(overlay, input, onInsert));
    actions.appendChild(insertBtn);

    panel.appendChild(actions);

    // Assembler
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    activeModal = overlay;

    // Remplir la grille initiale
    _fillGrid(panel, FORMULA_CATEGORIES[0].id, input);

    // Preview initiale
    if (existingLatex) {
        _updatePreview(panel, existingLatex);
    }

    // Fermer au clic sur l'overlay
    overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) _closeModal(overlay);
    });

    // Escape global
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            _closeModal(overlay);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Focus sur l'input
    requestAnimationFrame(() => input.focus());

    // Retourner l'overlay (pour compatibilité, mais il est déjà ajouté au DOM)
    return overlay;
}

// =======================================================================
// LOGIQUE INTERNE
// =======================================================================

/**
 * Ferme la modale formule
 */
function _closeModal(overlay) {
    if (overlay && overlay.parentElement) {
        overlay.remove();
    }
    if (activeModal === overlay) {
        activeModal = null;
    }
}

/**
 * Insère la formule et ferme la modale
 */
function _insertAndClose(overlay, input, onInsert) {
    const latex = input.value.trim();
    if (!latex) return;
    if (onInsert) onInsert(latex);
    _closeModal(overlay);
}

/**
 * Sélectionne une catégorie et remplit la grille
 */
function _selectCategory(panel, categoryId, input) {
    const tabs = panel.querySelectorAll('.json-editor__formula-category');
    tabs.forEach(tab => {
        tab.classList.toggle('json-editor__formula-category--active', tab.dataset.category === categoryId);
    });
    _fillGrid(panel, categoryId, input);
}

/**
 * Remplit la grille avec les symboles d'une catégorie
 */
function _fillGrid(panel, categoryId, input) {
    const grid = panel.querySelector('.json-editor__formula-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const category = FORMULA_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    category.items.forEach(item => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'json-editor__formula-grid-item';
        cell.title = item.label;
        cell.textContent = item.label;
        cell.addEventListener('click', () => {
            // Insérer le template dans l'input à la position du curseur
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const before = input.value.substring(0, start);
            const after = input.value.substring(end);
            input.value = before + item.latex + after;
            const newPos = start + item.latex.length;
            input.setSelectionRange(newPos, newPos);
            input.focus();
            _debouncePreview(panel, input.value);
        });
        grid.appendChild(cell);
    });

    // Rendre les formules MathJax dans la grille
    _renderGridMath(grid, category.items);
}

/**
 * Rend les formules MathJax dans les cellules de la grille
 */
async function _renderGridMath(grid, items) {
    try {
        await loadMathJax();
        if (!window.MathJax || !window.MathJax.typesetPromise) return;

        const cells = grid.querySelectorAll('.json-editor__formula-grid-item');
        cells.forEach((cell, i) => {
            if (items[i] && items[i].display) {
                cell.innerHTML = items[i].display;
            }
        });
        await window.MathJax.typesetPromise(Array.from(cells));
    } catch (e) {
        // Dégradation gracieuse — les labels texte restent
    }
}

/**
 * Debounce de la preview
 */
function _debouncePreview(panel, latex) {
    if (previewTimeout) clearTimeout(previewTimeout);
    previewTimeout = setTimeout(() => _updatePreview(panel, latex), 300);
}

/**
 * Met à jour la prévisualisation MathJax
 */
async function _updatePreview(panel, latex) {
    const preview = panel.querySelector('.json-editor__formula-preview-area');
    if (!preview) return;

    if (!latex.trim()) {
        preview.classList.add('json-editor__formula-preview-area--empty');
        preview.textContent = t('editor_formula_preview') || 'Aperçu';
        return;
    }

    preview.classList.remove('json-editor__formula-preview-area--empty');
    preview.innerHTML = `\\(${latex}\\)`;

    try {
        await loadMathJax();
        if (window.MathJax && window.MathJax.typesetPromise) {
            if (window.MathJax.typesetClear) {
                window.MathJax.typesetClear([preview]);
            }
            await window.MathJax.typesetPromise([preview]);
        }
    } catch (e) {
        preview.textContent = latex;
    }
}
