/**
 * Rich Text Editor — Éditeur WYSIWYG léger pour l'éditeur JSON
 *
 * Fournit un éditeur contenteditable avec barre d'outils contextuelle,
 * bascule code source, protection LaTeX et mode marqueurs.
 * S'intègre dans le système de field-renderers via le type 'richtext'.
 *
 * Trois modes selon le renderType du champ (field-constraints.js) :
 * - html+latex : WYSIWYG complet + bouton formule math
 * - html : WYSIWYG sans bouton formule
 * - unicode+markers : mode marqueurs *mot* (DragTheWords, MarkTheWords, FillInTheBlanks)
 */

import { t } from '../core/translation.js';
import { validateField } from './validators.js';
import { escapeHtml, generateId } from './field-renderers.js';
import { getConstraints, RENDER_TYPES, FIELD_CONSTRAINTS } from '../h5p/field-constraints.js';
import { loadDOMPurify, loadMathJax } from '../core/lib-loader.js';
import { markdownToHtml } from '../core/utils.js';

// =======================================================================
// RÉSOLUTION DU TYPE DE RENDU
// =======================================================================

/**
 * Normalise un chemin de l'éditeur vers le format des contraintes.
 * Ex: 'cards.0.text' → 'cards[].text'
 *     'questions.2.answers.1.text' → 'questions[].answers[].text'
 *     'textField' → 'textField'
 */
function normalizeFieldPath(editorPath) {
    if (!editorPath) return '';
    return editorPath.replace(/\.\d+(?=\.|$)/g, '[]');
}

/**
 * Résout le type de rendu pour un champ donné en consultant field-constraints.js.
 *
 * Gère aussi les modules conteneurs (QuizSet, CoursePresentation) où les sous-champs
 * passent par .params. — dans ce cas, extrait le sous-chemin et cherche dans tous les
 * modules de FIELD_CONSTRAINTS.
 *
 * @param {string} moduleKey — Clé du module (ex: 'MultipleChoice', 'QCM')
 * @param {string} fieldPath — Chemin du champ dans l'éditeur (ex: 'cards.0.text')
 * @returns {string|null} — Type de rendu ('html+latex', 'html', 'unicode+markers') ou null
 */
export function resolveRenderTypeForField(moduleKey, fieldPath) {
    if (!moduleKey || !fieldPath) return null;

    const constraints = getConstraints(moduleKey);
    const normalized = normalizeFieldPath(fieldPath);

    // 1. Correspondance directe dans le module
    if (constraints && constraints.fields) {
        const fieldDef = constraints.fields[normalized];
        if (fieldDef) return fieldDef.render;
    }

    // 2. Fallback pour les conteneurs (QuizSet, CoursePresentation)
    //    Les sous-champs ont un chemin type: questions[].params.question
    //    Le sous-chemin après .params. correspond aux contraintes du sous-module
    const paramsIdx = normalized.indexOf('.params.');
    if (paramsIdx !== -1) {
        const subPath = normalized.substring(paramsIdx + '.params.'.length);
        if (subPath) {
            // Chercher dans tous les modules de FIELD_CONSTRAINTS
            for (const [, constraint] of Object.entries(FIELD_CONSTRAINTS)) {
                if (!constraint.fields) continue;
                const subDef = constraint.fields[subPath];
                if (subDef) return subDef.render;
            }
        }
    }

    return null;
}


// =======================================================================
// SINGLETON TOOLBAR
// =======================================================================

/** Instance unique de la toolbar partagée entre tous les champs richtext */
let toolbarInstance = null;
/** Champ richtext actuellement actif */
let activeField = null;
/** Délai avant détachement de la toolbar au blur */
let blurTimeout = null;

/**
 * Définition des boutons de la toolbar par groupe.
 * Chaque bouton a : id, icon (FontAwesome), command (execCommand), tooltip (clé i18n)
 */
const TOOLBAR_GROUPS = {
    formatting: [
        { id: 'bold', icon: 'fa-bold', command: 'bold', tooltip: 'editor_richtext_bold' },
        { id: 'italic', icon: 'fa-italic', command: 'italic', tooltip: 'editor_richtext_italic' },
        { id: 'underline', icon: 'fa-underline', command: 'underline', tooltip: 'editor_richtext_underline' },
        { id: 'strikethrough', icon: 'fa-strikethrough', command: 'strikethrough', tooltip: 'editor_richtext_strikethrough' }
    ],
    scripts: [
        { id: 'superscript', icon: 'fa-superscript', command: 'superscript', tooltip: 'editor_richtext_superscript' },
        { id: 'subscript', icon: 'fa-subscript', command: 'subscript', tooltip: 'editor_richtext_subscript' }
    ],
    color: [
        { id: 'color', icon: 'fa-palette', command: null, tooltip: 'editor_richtext_color', isColor: true }
    ],
    lists: [
        { id: 'list_ordered', icon: 'fa-list-ol', command: 'insertOrderedList', tooltip: 'editor_richtext_list_ordered' },
        { id: 'list_unordered', icon: 'fa-list-ul', command: 'insertUnorderedList', tooltip: 'editor_richtext_list_unordered' }
    ],
    insert: [
        { id: 'link', icon: 'fa-link', command: null, tooltip: 'editor_richtext_link', isLink: true }
    ],
    math: [
        { id: 'math', icon: 'fa-square-root-variable', command: null, tooltip: 'editor_richtext_math', isMath: true }
    ],
    source: [
        { id: 'toggle_source', icon: 'fa-code', command: null, tooltip: 'editor_richtext_toggle_source', isToggle: true }
    ]
};

/** Couleurs prédéfinies pour le color picker */
const PRESET_COLORS = [
    { value: '', label: 'editor_richtext_color_default', isDefault: true },
    { value: '#c0392b', label: 'Rouge' },
    { value: '#2980b9', label: 'Bleu' },
    { value: '#27ae60', label: 'Vert' },
    { value: '#f39c12', label: 'Orange' },
    { value: '#8e44ad', label: 'Violet' },
    { value: '#2c3e50', label: 'Foncé' }
];

/**
 * Crée ou retourne la toolbar singleton.
 * @param {string} renderType — Type de rendu du champ actif
 * @returns {HTMLElement} L'élément toolbar
 */
function getOrCreateToolbar(renderType, compact = false) {
    if (!toolbarInstance) {
        toolbarInstance = document.createElement('div');
        toolbarInstance.className = 'json-editor__richtext-toolbar';
        toolbarInstance.setAttribute('role', 'toolbar');
        toolbarInstance.setAttribute('aria-label', 'Formatting');
        // Empêcher le blur du contenteditable quand on clique la toolbar
        toolbarInstance.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }

    // Reconstruire les boutons selon le renderType et le mode
    _buildToolbarButtons(toolbarInstance, renderType, compact);
    return toolbarInstance;
}

/**
 * Construit les boutons de la toolbar selon le renderType et le mode compact
 */
function _buildToolbarButtons(toolbar, renderType, compact = false) {
    toolbar.innerHTML = '';

    if (renderType === 'unicode+markers') {
        _addButton(toolbar, { id: 'mark_word', icon: 'fa-highlighter', command: null, tooltip: 'editor_richtext_mark_word', isMarker: true });
        _addButton(toolbar, { id: 'unmark_word', icon: 'fa-eraser', command: null, tooltip: 'editor_richtext_unmark_word', isUnmarker: true });
        _addSeparator(toolbar);
        _addButton(toolbar, TOOLBAR_GROUPS.source[0]);
        return;
    }

    if (compact) {
        // Mode compact : seulement B, I, formule (si latex), source
        _addButton(toolbar, TOOLBAR_GROUPS.formatting[0]); // Bold
        _addButton(toolbar, TOOLBAR_GROUPS.formatting[1]); // Italic
        _addButton(toolbar, TOOLBAR_GROUPS.scripts[0]);     // Superscript
        _addButton(toolbar, TOOLBAR_GROUPS.scripts[1]);     // Subscript
        if (renderType === 'html+latex') {
            _addSeparator(toolbar);
            _addButton(toolbar, TOOLBAR_GROUPS.math[0]);    // Math
        }
        _addSeparator(toolbar);
        _addButton(toolbar, TOOLBAR_GROUPS.source[0]);      // Source
        return;
    }

    // Mode complet HTML/HTML+LaTeX
    const groups = ['formatting', 'scripts', 'color', 'lists', 'insert'];
    if (renderType === 'html+latex') {
        groups.push('math');
    }
    groups.push('source');

    groups.forEach((groupId, i) => {
        if (i > 0) _addSeparator(toolbar);
        const buttons = TOOLBAR_GROUPS[groupId];
        if (buttons) {
            buttons.forEach(btn => _addButton(toolbar, btn));
        }
    });
}

/**
 * Ajoute un bouton à la toolbar
 */
function _addButton(toolbar, btnDef) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'json-editor__richtext-toolbar-btn';
    btn.dataset.action = btnDef.id;
    btn.title = t(btnDef.tooltip) || btnDef.tooltip;
    btn.innerHTML = `<i class="fas ${btnDef.icon}"></i>`;
    btn.addEventListener('click', () => _handleToolbarClick(btnDef));
    toolbar.appendChild(btn);
}

/**
 * Ajoute un séparateur visuel
 */
function _addSeparator(toolbar) {
    const sep = document.createElement('span');
    sep.className = 'json-editor__richtext-toolbar-separator';
    toolbar.appendChild(sep);
}

/**
 * Gère le clic sur un bouton de la toolbar
 */
function _handleToolbarClick(btnDef) {
    if (!activeField) return;

    const { editable, source, container, renderType, onChange, path } = activeField;

    if (btnDef.isToggle) {
        _toggleSourceMode(activeField);
        return;
    }

    if (btnDef.isColor) {
        _showColorPicker(activeField);
        return;
    }

    if (btnDef.isLink) {
        _showLinkPopup(activeField);
        return;
    }

    if (btnDef.isMath) {
        _showFormulaAssistant(activeField);
        return;
    }

    if (btnDef.isMarker) {
        _markSelection(activeField);
        return;
    }

    if (btnDef.isUnmarker) {
        _unmarkSelection(activeField);
        return;
    }

    // Commande execCommand standard
    if (btnDef.command) {
        editable.focus();
        document.execCommand(btnDef.command, false, null);
        _emitChange(activeField);
        _updateActiveStates();
    }
}

// =======================================================================
// NETTOYAGE HTML
// =======================================================================

/**
 * Trimme les espaces au début et à la fin d'un élément DOM.
 * Retire les espaces du premier et dernier textNode enfant.
 * Ex: <strong>texte </strong> → les childNodes deviennent "texte" sans espace trailing.
 */
function _trimElementEdges(el) {
    // Trimmer le premier textNode
    const first = el.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
        first.textContent = first.textContent.replace(/^\s+/, '');
    }
    // Trimmer le dernier textNode
    const last = el.lastChild;
    if (last && last.nodeType === Node.TEXT_NODE) {
        last.textContent = last.textContent.replace(/\s+$/, '');
    }
}

/**
 * Nettoie le HTML produit par contenteditable pour le rendre compatible H5P.
 */
export function htmlToCleanOutput(innerHTML) {
    if (!innerHTML) return '';

    // Utiliser le DOM pour un nettoyage fiable
    const doc = document.createElement('div');
    doc.innerHTML = innerHTML;

    // 1. Déprotéger les spans LaTeX → placeholder unique
    //    On utilise des placeholders car innerHTML encode les & et > dans les textNodes
    const latexPlaceholders = [];
    doc.querySelectorAll('.json-editor__richtext-latex').forEach(span => {
        const dataLatex = span.getAttribute('data-latex');
        if (dataLatex) {
            const idx = latexPlaceholders.length;
            latexPlaceholders.push(dataLatex);
            span.replaceWith(document.createTextNode(`\x00LATEX${idx}\x00`));
        }
    });

    // 2. Convertir <font color="..."> → <span style="color: ..."> (execCommand legacy)
    doc.querySelectorAll('font[color]').forEach(font => {
        const span = document.createElement('span');
        span.style.color = font.getAttribute('color');
        span.innerHTML = font.innerHTML;
        font.replaceWith(span);
    });

    // 3. Sécurité : supprimer les éléments et attributs dangereux
    doc.querySelectorAll('script, style, iframe, object, embed, form').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => {
        // Supprimer tous les event handlers (onclick, onerror, onload, etc.)
        const toRemove = [];
        for (const attr of el.attributes) {
            if (attr.name.startsWith('on')) toRemove.push(attr.name);
        }
        toRemove.forEach(name => el.removeAttribute(name));
    });

    // 4. Convertir <strong>/<b> → Markdown **...**
    //    Préserve les enfants (ex: <span style="color:...">)
    //    Trimme les espaces aux bords pour éviter **texte ** au lieu de **texte**
    doc.querySelectorAll('strong, b').forEach(el => {
        _trimElementEdges(el);
        if (!el.textContent.trim()) { el.remove(); return; } // Vide → supprimer
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('**'));
        while (el.firstChild) frag.appendChild(el.firstChild);
        frag.appendChild(document.createTextNode('**'));
        el.replaceWith(frag);
    });

    // 5. Convertir <em>/<i> → Markdown *...*
    doc.querySelectorAll('em, i').forEach(el => {
        _trimElementEdges(el);
        if (!el.textContent.trim()) { el.remove(); return; }
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('*'));
        while (el.firstChild) frag.appendChild(el.firstChild);
        frag.appendChild(document.createTextNode('*'));
        el.replaceWith(frag);
    });

    // 7. Supprimer les commentaires et balises Word/Office
    const walker = document.createTreeWalker(doc, NodeFilter.SHOW_COMMENT);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach(c => c.remove());

    // 8. Nettoyer les attributs inutiles
    doc.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    // Supprimer TOUS les attributs data-*
    doc.querySelectorAll('*').forEach(el => {
        const toRemove = [];
        for (const attr of el.attributes) {
            if (attr.name.startsWith('data-')) toRemove.push(attr.name);
        }
        toRemove.forEach(name => el.removeAttribute(name));
    });

    // 9. Nettoyer les styles sauf color
    doc.querySelectorAll('[style]').forEach(el => {
        const color = el.style.color;
        if (color) {
            el.setAttribute('style', `color: ${color}`);
        } else {
            el.removeAttribute('style');
        }
    });

    // 10. Déplier les spans sans attribut (wrappers inutiles)
    doc.querySelectorAll('span').forEach(el => {
        if (!el.hasAttribute('style')) {
            el.replaceWith(...el.childNodes);
        }
    });

    // 11. Supprimer les éléments vides
    doc.querySelectorAll('span, div, p, sub, sup, u, s, strong, em, b, i').forEach(el => {
        if (!el.textContent.trim() && !el.querySelector('img, br, hr')) {
            el.remove();
        }
    });

    // 12. Extraire le HTML nettoyé
    let html = doc.innerHTML;

    // 13. Convertir les blocs en sauts de ligne
    html = html.replace(/<br\s*\/?>/gi, '\n');
    html = html.replace(/<\/p>\s*<p>/gi, '\n');
    html = html.replace(/<\/?p>/gi, '');
    html = html.replace(/<\/?div>/gi, '');

    // 14. Normaliser les espaces
    html = html.replace(/&nbsp;/g, ' ');
    html = html.replace(/\n{3,}/g, '\n\n');

    // 15. Restaurer les formules LaTeX depuis les placeholders
    //     (évite l'encodage HTML des & et > par innerHTML)
    html = html.replace(/\x00LATEX(\d+)\x00/g, (_, idx) => latexPlaceholders[parseInt(idx)]);

    // 16. Nettoyer les marqueurs Markdown mal formés
    //     Le contenteditable met parfois des espaces à l'intérieur des balises :
    //     <strong>texte </strong> → "**texte **" → doit devenir "**texte**"
    //     Gras : espaces aux bords internes des **...**
    html = html.replace(/\*\* +([^*]+?)\*\*/g, ' **$1**');     // "** texte**" → " **texte**"
    html = html.replace(/\*\*([^*]+?) +\*\*/g, '**$1** ');     // "**texte **" → "**texte** "
    //     Supprimer les marqueurs gras vides (rien ou que des espaces entre)
    html = html.replace(/\*\*\s*\*\*/g, '');

    return html.trim();
}

/**
 * Convertit du HTML source en HTML sûr pour contenteditable.
 * - Protège les formules LaTeX en spans non-éditables
 * - Échappe tout contenu suspect
 * @param {object} [options] — { compact: true } pour forcer inline math (champs text)
 */
export function sourceToDisplay(htmlString, renderType, options) {
    if (!htmlString) return '';

    let html = htmlString;

    // En mode compact (champs text une ligne), convertir display math en inline
    // Le healer convertit \begin{equation} → \[...\] (display), inadapté en champ compact
    if (options?.compact && renderType === 'html+latex') {
        html = html.replace(/\\\[([\s\S]*?)\\\]/g, '\\($1\\)');
    }

    // Convertir le Markdown en HTML (les données sources utilisent **gras** et *italique*)
    // markdownToHtml protège automatiquement le LaTeX pendant la conversion
    if (renderType === 'html+latex' || renderType === 'html') {
        html = markdownToHtml(html, { newlineToBr: true });
    }

    // Protéger les formules LaTeX pour affichage dans contenteditable (html+latex uniquement)
    if (renderType === 'html+latex') {
        html = protectLatex(html);
    }

    return html;
}

// =======================================================================
// PROTECTION LATEX
// =======================================================================

/** Regex pour détecter les formules LaTeX inline \(...\) */
const LATEX_INLINE_RE = /\\\((.+?)\\\)/gs;
/** Regex pour détecter les formules LaTeX display \[...\] */
const LATEX_DISPLAY_RE = /\\\[(.+?)\\\]/gs;

/**
 * Protège les formules LaTeX en les enveloppant dans des spans non-éditables.
 * Le contenu LaTeX brut est stocké dans data-latex pour restauration.
 * Note : le healer convertit deja \begin{equation}→\[...\], $→\(...\), $$→\[...\]
 * avant que l'editeur ne recoive les donnees. Les normalisations ici sont un filet
 * de securite pour les donnees chargees directement (exemples, import).
 */
export function protectLatex(html) {
    if (!html) return '';

    // Filet de securite : environnements LaTeX non convertis par le healer
    // \begin{equation}...\end{equation} → \[...\] (display math)
    html = html.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, '\\[$1\\]');
    // \begin{math}...\end{math} → \(...\) (inline math)
    html = html.replace(/\\begin\{math\}([\s\S]*?)\\end\{math\}/g, '\\($1\\)');
    // Note : pas de normalisation $...$ / $$...$$ ici (risque de faux positifs avec du texte contenant $)

    // Inline math \(...\)
    html = html.replace(LATEX_INLINE_RE, (match, latex) => {
        const escaped = escapeHtml(latex);
        return `<span class="json-editor__richtext-latex" contenteditable="false" data-latex="\\(${escaped}\\)" title="${escapeHtml(match)}">\\(${escaped}\\)</span>`;
    });

    // Display math \[...\]
    html = html.replace(LATEX_DISPLAY_RE, (match, latex) => {
        const escaped = escapeHtml(latex);
        return `<span class="json-editor__richtext-latex json-editor__richtext-latex--display" contenteditable="false" data-latex="\\[${escaped}\\]" title="${escapeHtml(match)}">\\[${escaped}\\]</span>`;
    });

    return html;
}

/**
 * Restaure les formules LaTeX depuis les spans protégés.
 * Utilise le DOM pour gérer correctement les spans imbriqués par MathJax.
 */
export function unprotectLatex(html) {
    if (!html) return '';

    // Vérification rapide : s'il n'y a pas de span LaTeX, retourner tel quel
    if (!html.includes('json-editor__richtext-latex')) return html;

    // Utiliser le DOM pour parser correctement (MathJax insère des spans imbriqués)
    const container = document.createElement('div');
    container.innerHTML = html;

    // Remplacer les spans par des placeholders (évite l'encodage innerHTML des & et >)
    const placeholders = [];
    container.querySelectorAll('.json-editor__richtext-latex').forEach(span => {
        const dataLatex = span.getAttribute('data-latex');
        if (dataLatex) {
            const idx = placeholders.length;
            placeholders.push(dataLatex);
            span.replaceWith(document.createTextNode(`\x00LATEX${idx}\x00`));
        }
    });

    // Extraire le HTML puis restaurer les formules LaTeX brutes
    let result = container.innerHTML;
    result = result.replace(/\x00LATEX(\d+)\x00/g, (_, idx) => placeholders[parseInt(idx)]);
    return result;
}

/**
 * Déclenche le rendu MathJax sur les spans LaTeX d'un conteneur.
 * @param {HTMLElement} container — Le conteneur editable
 */
async function renderLatexInContainer(container) {
    const latexSpans = container.querySelectorAll('.json-editor__richtext-latex');
    if (latexSpans.length === 0) return;

    try {
        await loadMathJax();
        if (window.MathJax && window.MathJax.typesetPromise) {
            await window.MathJax.typesetPromise(Array.from(latexSpans));
        }
    } catch (e) {
        // MathJax non disponible — affichage du LaTeX brut (dégradation gracieuse)
    }
}

// =======================================================================
// BASCULE SOURCE / WYSIWYG
// =======================================================================

/**
 * Bascule entre mode WYSIWYG et mode source pour un champ
 */
function _toggleSourceMode(field) {
    const { editable, source, container } = field;
    const isSourceVisible = !source.classList.contains('json-editor__richtext-source--hidden');

    if (isSourceVisible) {
        // Source → WYSIWYG
        if (field.renderType === 'unicode+markers') {
            // Mode marqueurs : afficher le texte brut avec surlignage
            editable.textContent = source.value;
            _highlightMarkers(editable);
        } else {
            editable.innerHTML = sourceToDisplay(source.value, field.renderType, { compact: field.config?.compact });
            // Rendre le LaTeX
            renderLatexInContainer(editable);
        }
        editable.classList.remove('json-editor__richtext-editable--hidden');
        source.classList.add('json-editor__richtext-source--hidden');
        // Mettre à jour l'icône du bouton toggle
        _updateToggleButton(false);
    } else {
        // WYSIWYG → Source
        source.value = htmlToCleanOutput(editable.innerHTML);
        source.classList.remove('json-editor__richtext-source--hidden');
        editable.classList.add('json-editor__richtext-editable--hidden');
        _autoResizeSource(source);
        source.focus();
        _updateToggleButton(true);
    }

    field.isSourceMode = isSourceVisible ? false : true;
}

/**
 * Met à jour l'icône/tooltip du bouton toggle
 */
function _updateToggleButton(isSourceMode) {
    if (!toolbarInstance) return;
    const btn = toolbarInstance.querySelector('[data-action="toggle_source"]');
    if (!btn) return;

    if (isSourceMode) {
        btn.title = t('editor_richtext_toggle_wysiwyg') || 'Aperçu';
        btn.classList.add('json-editor__richtext-toolbar-btn--active');
    } else {
        btn.title = t('editor_richtext_toggle_source') || 'Code source';
        btn.classList.remove('json-editor__richtext-toolbar-btn--active');
    }
}

/**
 * Auto-resize du textarea source
 */
function _autoResizeSource(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.max(textarea.scrollHeight, 80);
    textarea.style.height = newHeight + 'px';
}

// =======================================================================
// COULEUR / LIEN / FORMULE
// =======================================================================

/** Référence au popup couleur/lien ouvert */
let activePopup = null;

/**
 * Ferme tout popup ouvert
 */
function _closeActivePopup() {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }
}

/**
 * Positionne un popup (fixed) sous un bouton d'ancrage.
 * Ajuste automatiquement si le popup déborde à droite ou en bas du viewport.
 * @param {HTMLElement} popup — Le popup à positionner
 * @param {HTMLElement} anchor — Le bouton d'ancrage
 * @param {boolean} alignRight — Aligner à droite du bouton (pour les panels larges)
 */
function _positionPopupUnderButton(popup, anchor, alignRight = false) {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const top = rect.bottom + 4;
    let left = alignRight ? rect.right - 340 : rect.left;

    // Ajuster si déborde à droite
    if (left + 340 > window.innerWidth - 16) {
        left = window.innerWidth - 340 - 16;
    }
    // Ajuster si déborde à gauche
    if (left < 16) left = 16;

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    // Ajuster si déborde en bas
    requestAnimationFrame(() => {
        const popupRect = popup.getBoundingClientRect();
        if (popupRect.bottom > window.innerHeight - 16) {
            // Afficher au-dessus du bouton si pas assez de place en bas
            popup.style.top = Math.max(16, rect.top - popupRect.height - 4) + 'px';
        }
    });
}

/**
 * Affiche le color picker
 */
function _showColorPicker(field) {
    _closeActivePopup();

    const picker = document.createElement('div');
    picker.className = 'json-editor__richtext-color-picker';

    PRESET_COLORS.forEach(color => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'json-editor__richtext-color-swatch';
        if (color.isDefault) {
            swatch.classList.add('json-editor__richtext-color-swatch--default');
            swatch.innerHTML = '<i class="fas fa-ban"></i>';
            swatch.title = t(color.label) || 'Défaut';
        } else {
            swatch.style.backgroundColor = color.value;
            swatch.title = color.label;
        }
        swatch.addEventListener('click', () => {
            field.editable.focus();
            if (color.isDefault) {
                document.execCommand('removeFormat', false, null);
            } else {
                document.execCommand('foreColor', false, color.value);
            }
            _emitChange(field);
            _closeActivePopup();
        });
        picker.appendChild(swatch);
    });

    // Input couleur custom
    const customWrapper = document.createElement('div');
    customWrapper.className = 'json-editor__richtext-color-custom';
    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.value = '#000000';
    customInput.title = 'Personnalisé';
    customInput.addEventListener('input', () => {
        field.editable.focus();
        document.execCommand('foreColor', false, customInput.value);
        _emitChange(field);
    });
    customWrapper.appendChild(customInput);
    picker.appendChild(customWrapper);

    // Positionner le picker sous le bouton couleur (position fixed)
    const colorBtn = toolbarInstance.querySelector('[data-action="color"]');
    _positionPopupUnderButton(picker, colorBtn);

    document.body.appendChild(picker);
    activePopup = picker;

    // Fermer au clic extérieur
    setTimeout(() => {
        const handler = (e) => {
            if (!picker.contains(e.target)) {
                _closeActivePopup();
                document.removeEventListener('mousedown', handler);
            }
        };
        document.addEventListener('mousedown', handler);
    }, 0);
}

/**
 * Ouvre la modale d'insertion/édition de lien
 */
function _showLinkPopup(field) {
    _closeActivePopup();

    // Sauvegarder la sélection et le texte sélectionné
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
    const selectedText = range ? range.toString() : '';

    // Détecter un lien existant
    const anchorNode = selection.anchorNode;
    const existingLink = anchorNode ? anchorNode.parentElement?.closest('a') : null;

    // Créer l'overlay modale
    const overlay = document.createElement('div');
    overlay.className = 'json-editor__formula-overlay';

    const panel = document.createElement('div');
    panel.className = 'json-editor__link-modal';
    panel.addEventListener('mousedown', (e) => e.stopPropagation());

    const isEdit = !!existingLink;
    const titleText = isEdit
        ? (t('editor_richtext_link_edit') || 'Modifier le lien')
        : (t('editor_richtext_link') || 'Insérer un lien');

    panel.innerHTML = `
        <div class="json-editor__formula-header">
            <span>${escapeHtml(titleText)}</span>
            <button type="button" class="json-editor__formula-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="json-editor__link-modal-body">
            <div class="json-editor__link-modal-field">
                <label>${escapeHtml(t('editor_richtext_link_label') || 'Texte du lien')}</label>
                <input type="text" class="json-editor__formula-input" id="link-text-input"
                    value="${escapeHtml(isEdit ? existingLink.textContent : selectedText)}"
                    placeholder="${escapeHtml(t('editor_richtext_link_text_placeholder') || 'Texte à afficher...')}">
            </div>
            <div class="json-editor__link-modal-field">
                <label>${escapeHtml(t('editor_richtext_link_url') || 'Adresse du lien')}</label>
                <input type="url" class="json-editor__formula-input" id="link-url-input"
                    value="${escapeHtml(isEdit ? existingLink.getAttribute('href') : '')}"
                    placeholder="https://...">
            </div>
        </div>
        <div class="json-editor__formula-actions">
            ${isEdit ? `<button type="button" class="json-editor__formula-btn json-editor__formula-btn--remove">
                <i class="fas fa-unlink"></i> ${escapeHtml(t('editor_richtext_link_remove') || 'Supprimer')}
            </button>` : ''}
            <button type="button" class="json-editor__formula-btn json-editor__formula-btn--cancel">
                ${escapeHtml(t('editor_formula_cancel') || 'Annuler')}
            </button>
            <button type="button" class="json-editor__formula-btn json-editor__formula-btn--insert">
                ${escapeHtml(isEdit ? (t('editor_richtext_link_update') || 'Modifier') : (t('editor_richtext_link') || 'Insérer'))}
            </button>
        </div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const urlInput = panel.querySelector('#link-url-input');
    const textInput = panel.querySelector('#link-text-input');
    const closeBtn = panel.querySelector('.json-editor__formula-close');
    const cancelBtn = panel.querySelector('.json-editor__formula-btn--cancel');
    const insertBtn = panel.querySelector('.json-editor__formula-btn--insert');
    const removeBtn = panel.querySelector('.json-editor__formula-btn--remove');

    const closeModal = () => overlay.remove();

    // Insérer/modifier le lien
    const doInsert = () => {
        let url = urlInput.value.trim();
        if (!url) { urlInput.focus(); return; }

        // Ajouter https:// si pas de protocole (évite la résolution en URL relative)
        if (url && !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
            url = 'https://' + url;
        }

        const linkText = textInput.value.trim() || url;

        if (isEdit && existingLink) {
            // Modifier le lien existant (setAttribute pour éviter la résolution relative)
            existingLink.setAttribute('href', url);
            existingLink.textContent = linkText;
            existingLink.target = '_blank';
            existingLink.rel = 'noopener noreferrer';
        } else {
            // Créer un nouveau lien (setAttribute pour éviter la résolution relative)
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = linkText;

            if (range) {
                try {
                    range.deleteContents();
                    range.insertNode(link);
                    const after = document.createRange();
                    after.setStartAfter(link);
                    after.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(after);
                } catch (e) {
                    field.editable.appendChild(link);
                }
            } else {
                field.editable.appendChild(link);
            }
        }

        field.editable.focus();
        _emitChange(field);
        closeModal();
    };

    // Events
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    insertBtn.addEventListener('click', doInsert);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeModal(); });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            if (existingLink) {
                const text = document.createTextNode(existingLink.textContent);
                existingLink.replaceWith(text);
            }
            field.editable.focus();
            _emitChange(field);
            closeModal();
        });
    }

    // Raccourcis clavier
    const keyHandler = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); doInsert(); }
        else if (e.key === 'Escape') closeModal();
    };
    urlInput.addEventListener('keydown', keyHandler);
    textInput.addEventListener('keydown', keyHandler);

    // Focus sur l'URL
    requestAnimationFrame(() => urlInput.focus());
}

/**
 * Ouvre l'assistant formules (chargé dynamiquement)
 */
/**
 * Ouvre la modale assistant formules.
 * @param {object} field — État du champ richtext actif
 * @param {HTMLElement} [targetSpan] — Span LaTeX existant à éditer (optionnel)
 */
async function _showFormulaAssistant(field, targetSpan = null) {
    _closeActivePopup();

    // Sauvegarder la sélection pour l'insertion
    const selection = window.getSelection();
    const range = (!targetSpan && selection.rangeCount > 0) ? selection.getRangeAt(0).cloneRange() : null;

    // Extraire le LaTeX existant si édition d'un span
    let existingLatex = '';
    if (targetSpan) {
        const raw = targetSpan.getAttribute('data-latex') || '';
        existingLatex = raw.replace(/^\\\(|\\\)$|^\\\[|\\\]$/g, '').trim();
    }

    try {
        const { createFormulaAssistant } = await import('./formula-assistant.js');

        createFormulaAssistant(null, (latexString) => {
            // Callback d'insertion/modification
            const wrappedLatex = `\\(${latexString}\\)`;
            const protectedHtml = protectLatex(wrappedLatex);

            if (targetSpan && targetSpan.parentElement) {
                // Remplacement d'une formule existante
                targetSpan.outerHTML = protectedHtml;
            } else {
                // Nouvelle insertion : utiliser l'API DOM (execCommand est fragile après une modale)
                const tempContainer = document.createElement('span');
                tempContainer.innerHTML = protectedHtml;
                const newNode = tempContainer.firstChild;

                if (range) {
                    try {
                        // Restaurer la sélection et insérer à la position du curseur
                        range.deleteContents();
                        range.insertNode(newNode);
                        // Placer le curseur après le noeud inséré
                        range.setStartAfter(newNode);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } catch (e) {
                        // Fallback : ajouter à la fin
                        field.editable.appendChild(newNode);
                    }
                } else {
                    // Pas de range sauvegardé : ajouter à la fin
                    field.editable.appendChild(newNode);
                }
            }

            field.editable.focus();
            _emitChange(field);
            renderLatexInContainer(field.editable);
        }, existingLatex);
    } catch (e) {
        console.error('[RichText] Erreur chargement formula-assistant:', e);
    }
}

// =======================================================================
// MODE MARQUEURS (unicode+markers)
// =======================================================================

/**
 * Marque la sélection courante avec des astérisques *...*
 */
function _markSelection(field) {
    const { editable } = field;
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Vérifier que la sélection est dans notre editable
    if (!editable.contains(selection.anchorNode)) return;

    // Récupérer le texte complet
    let text = editable.textContent;
    const range = selection.getRangeAt(0);

    // Calculer l'offset dans le textContent
    const preRange = document.createRange();
    preRange.selectNodeContents(editable);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + selectedText.length;

    // Vérifier si déjà marqué
    const before = text.charAt(startOffset - 1);
    const after = text.charAt(endOffset);
    if (before === '*' && after === '*') return; // Déjà marqué

    // Insérer les marqueurs
    text = text.substring(0, startOffset) + '*' + selectedText + '*' + text.substring(endOffset);
    editable.textContent = text;
    _highlightMarkers(editable);
    _emitChange(field);
}

/**
 * Retire le marquage de la sélection courante
 */
function _unmarkSelection(field) {
    const { editable } = field;
    let text = editable.textContent;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Retirer les * autour du mot sélectionné
    const markedPattern = '*' + selectedText + '*';
    if (text.includes(markedPattern)) {
        text = text.replace(markedPattern, selectedText);
        editable.textContent = text;
        _highlightMarkers(editable);
        _emitChange(field);
    }
}

/**
 * Met en surbrillance visuelle les mots marqués *mot* dans le conteneur.
 * Utilise des spans décoratifs (non présents dans la donnée).
 */
/**
 * Calcule l'offset texte du curseur dans un conteneur (ignore les spans décoratifs).
 */
function _getTextOffset(container, range) {
    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
}

/**
 * Restaure la position du curseur après un re-rendu du contenu.
 */
function _restoreCursorPosition(container, offset) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let currentOffset = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const len = node.textContent.length;
        if (currentOffset + len >= offset) {
            const range = document.createRange();
            range.setStart(node, offset - currentOffset);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        currentOffset += len;
    }
}

function _highlightMarkers(container) {
    const text = container.textContent;
    if (!text) return;

    // Remplacer les *mot* par des spans visuels
    const html = escapeHtml(text).replace(/\*([^*]+)\*/g,
        '<span class="json-editor__richtext-marker">*$1*</span>'
    );

    container.innerHTML = html;
}

/**
 * Extrait le texte brut depuis un conteneur en mode marqueurs.
 * Retourne le textContent pur (les spans décoratifs n'affectent pas textContent).
 */
function _getMarkerText(container) {
    return container.textContent || '';
}

// =======================================================================
// ÉTATS ACTIFS DE LA TOOLBAR
// =======================================================================

/**
 * Met à jour les états actifs des boutons (bold, italic, etc.)
 * selon la position du curseur dans le contenteditable.
 */
function _updateActiveStates() {
    if (!toolbarInstance || !activeField || activeField.isSourceMode) return;

    const commands = ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript',
        'insertOrderedList', 'insertUnorderedList'];
    const commandToAction = {
        'bold': 'bold', 'italic': 'italic', 'underline': 'underline',
        'strikethrough': 'strikethrough', 'superscript': 'superscript', 'subscript': 'subscript',
        'insertOrderedList': 'list_ordered', 'insertUnorderedList': 'list_unordered'
    };

    commands.forEach(cmd => {
        try {
            const isActive = document.queryCommandState(cmd);
            const action = commandToAction[cmd];
            const btn = toolbarInstance.querySelector(`[data-action="${action}"]`);
            if (btn) {
                btn.classList.toggle('json-editor__richtext-toolbar-btn--active', isActive);
            }
        } catch (e) {
            // Certaines commandes peuvent ne pas être supportées
        }
    });
}

// =======================================================================
// ÉMISSION DES CHANGEMENTS
// =======================================================================

/**
 * Émet un changement de valeur vers l'éditeur JSON
 */
function _emitChange(field) {
    if (!field || !field.onChange) return;

    let value;
    if (field.renderType === 'unicode+markers') {
        value = _getMarkerText(field.editable);
    } else if (field.isSourceMode) {
        value = field.source.value;
    } else {
        value = htmlToCleanOutput(field.editable.innerHTML);
    }

    // Synchroniser la textarea source avec la valeur nettoyée.
    // CRITIQUE : editor-core.js > collectInputValues() lit les textarea[data-path]
    // lors de l'enregistrement. Sans cette synchro, la source obsolète écrase les données.
    if (!field.isSourceMode && field.source) {
        field.source.value = value;
    }

    field.onChange(field.path, value);
}

// =======================================================================
// RENDERER PRINCIPAL
// =======================================================================

/**
 * Rend un champ d'éditeur riche (WYSIWYG).
 * Signature identique aux autres renderers de field-renderers.js.
 *
 * @param {object} config — Configuration du champ (label, required, hint, renderType)
 * @param {string} value — Valeur HTML ou texte du champ
 * @param {function} onChange — Callback (path, newValue)
 * @param {string} path — Chemin du champ dans les données
 * @returns {HTMLElement} L'élément wrapper du champ
 */
export function renderRichtextField(config, value, onChange, path) {
    const id = generateId();
    const renderType = config.renderType || 'html';
    const isMarkerMode = renderType === 'unicode+markers';
    const isCompact = config.compact === true;

    const wrapper = document.createElement('div');
    wrapper.className = `json-editor__field json-editor__field--richtext${isCompact ? ' json-editor__field--richtext-compact' : ''}`;

    const label = config.label ? (t(config.label) !== config.label ? t(config.label) : config.label) : '';
    const hint = config.hint ? (t(config.hint) !== config.hint ? t(config.hint) : config.hint) : '';

    // Label
    const labelEl = document.createElement('label');
    labelEl.className = `json-editor__label ${config.required ? 'json-editor__label--required' : ''}`;
    labelEl.setAttribute('for', id);
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);

    // Container richtext
    const container = document.createElement('div');
    container.className = `json-editor__richtext-container${isCompact ? ' json-editor__richtext-container--compact' : ''}`;

    // Zone éditable (WYSIWYG)
    const editable = document.createElement('div');
    editable.id = id;
    editable.className = `json-editor__richtext-editable${isCompact ? ' json-editor__richtext-editable--compact' : ''}`;
    editable.setAttribute('contenteditable', 'true');
    editable.setAttribute('data-path', path);
    editable.setAttribute('role', 'textbox');
    editable.setAttribute('aria-multiline', isCompact ? 'false' : 'true');
    if (config.placeholder) {
        const ph = t(config.placeholder) !== config.placeholder ? t(config.placeholder) : config.placeholder;
        editable.setAttribute('data-placeholder', ph);
    }

    // Zone source (code)
    const source = document.createElement('textarea');
    source.className = 'json-editor__richtext-source json-editor__richtext-source--hidden';
    source.setAttribute('data-path', path);
    source.setAttribute('spellcheck', 'false');

    // Initialisation du contenu
    if (isMarkerMode) {
        editable.textContent = value || '';
        _highlightMarkers(editable);
        source.value = value || '';
    } else {
        editable.innerHTML = sourceToDisplay(value || '', renderType, { compact: isCompact });
        source.value = value || '';
    }

    container.appendChild(editable);
    container.appendChild(source);
    wrapper.appendChild(container);

    // Hint
    if (hint) {
        const hintEl = document.createElement('span');
        hintEl.className = 'json-editor__hint';
        hintEl.textContent = hint;
        wrapper.appendChild(hintEl);
    }

    // Erreur
    const errorSpan = document.createElement('span');
    errorSpan.className = 'json-editor__error';
    wrapper.appendChild(errorSpan);

    // --- État du champ ---
    const fieldState = {
        editable,
        source,
        container,
        wrapper,
        renderType,
        onChange,
        path,
        isSourceMode: false,
        config
    };

    // --- Événements ---

    // Focus → attacher la toolbar
    editable.addEventListener('focus', () => {
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        // Retirer le focus de l'ancien champ s'il existe
        if (activeField && activeField !== fieldState && activeField.container) {
            activeField.container.classList.remove('json-editor__richtext-container--focused');
        }
        activeField = fieldState;
        const toolbar = getOrCreateToolbar(renderType, isCompact);
        // Insérer la toolbar au début du container
        container.insertBefore(toolbar, container.firstChild);
        container.classList.add('json-editor__richtext-container--focused');
        _updateActiveStates();
        _updateToggleButton(fieldState.isSourceMode);
    });

    // Blur → détacher la toolbar après un délai
    editable.addEventListener('blur', () => {
        blurTimeout = setTimeout(() => {
            if (activeField === fieldState) {
                container.classList.remove('json-editor__richtext-container--focused');
                _closeActivePopup();
            }
        }, 200);
    });

    // Input → émettre le changement
    let markerDebounce = null;
    editable.addEventListener('input', () => {
        _emitChange(fieldState);

        // En mode marqueurs, re-surligner après un court délai (quand l'utilisateur finit de taper *mot*)
        if (isMarkerMode) {
            if (markerDebounce) clearTimeout(markerDebounce);
            markerDebounce = setTimeout(() => {
                // Sauvegarder la position du curseur
                const sel = window.getSelection();
                const textBefore = sel.rangeCount > 0 ? _getTextOffset(editable, sel.getRangeAt(0)) : -1;
                _highlightMarkers(editable);
                // Restaurer la position du curseur
                if (textBefore >= 0) _restoreCursorPosition(editable, textBefore);
            }, 400);
        }

        // Validation
        const val = isMarkerMode ? _getMarkerText(editable) : htmlToCleanOutput(editable.innerHTML);
        const validation = validateField(val, config);
        if (!validation.valid) {
            container.classList.add('json-editor__richtext-container--error');
            errorSpan.textContent = validation.errors[0] || '';
        } else {
            container.classList.remove('json-editor__richtext-container--error');
            errorSpan.textContent = '';
        }
    });

    // Selection change → états actifs
    const selChangeHandler = () => {
        if (activeField === fieldState && !fieldState.isSourceMode) {
            _updateActiveStates();
        }
    };
    document.addEventListener('selectionchange', selChangeHandler);

    // Source textarea → émettre les changements
    source.addEventListener('input', () => {
        _autoResizeSource(source);
        _emitChange(fieldState);
    });

    // Focus sur le source → garder la toolbar
    source.addEventListener('focus', () => {
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        activeField = fieldState;
        const toolbar = getOrCreateToolbar(renderType, isCompact);
        container.insertBefore(toolbar, container.firstChild);
        container.classList.add('json-editor__richtext-container--focused');
        _updateToggleButton(true);
    });

    source.addEventListener('blur', () => {
        blurTimeout = setTimeout(() => {
            if (activeField === fieldState) {
                container.classList.remove('json-editor__richtext-container--focused');
            }
        }, 200);
    });

    // Mode compact : empêcher les retours à la ligne (une seule ligne)
    if (isCompact) {
        editable.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    // Coller du contenu → nettoyer
    editable.addEventListener('paste', (e) => {
        if (isMarkerMode) {
            // En mode marqueurs, coller en texte brut uniquement
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            return;
        }

        // En mode HTML, coller le HTML nettoyé
        e.preventDefault();
        let pastedHtml = e.clipboardData.getData('text/html');
        if (!pastedHtml) {
            // Pas de HTML, coller en texte brut
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            return;
        }

        // Nettoyage basique du HTML collé (Word, Google Docs, etc.)
        pastedHtml = _cleanPastedHtml(pastedHtml);
        document.execCommand('insertHTML', false, pastedHtml);
        _emitChange(fieldState);
    });

    // Rendu LaTeX initial (après insertion dans le DOM)
    if (renderType === 'html+latex' && value && (value.includes('\\(') || value.includes('\\['))) {
        requestAnimationFrame(() => {
            renderLatexInContainer(editable);
        });
    }

    // Double-clic sur un span LaTeX → ouvrir l'éditeur de formule
    editable.addEventListener('dblclick', (e) => {
        const latexSpan = e.target.closest('.json-editor__richtext-latex');
        if (!latexSpan || renderType !== 'html+latex') return;

        e.preventDefault();
        e.stopPropagation();

        activeField = fieldState;
        _showFormulaAssistant(fieldState, latexSpan);
    });

    return wrapper;
}

/**
 * Nettoie le HTML collé depuis des sources externes.
 * Supprime les commentaires, les styles Word, etc.
 */
function _cleanPastedHtml(html) {
    // Supprimer les commentaires HTML
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    // Supprimer les balises Word/Office
    html = html.replace(/<\/?o:[^>]*>/gi, '');
    html = html.replace(/<\/?w:[^>]*>/gi, '');
    html = html.replace(/<\/?m:[^>]*>/gi, '');
    // Supprimer les classes et styles inutiles (garder color)
    html = html.replace(/\sclass="[^"]*"/gi, '');
    html = html.replace(/\sstyle="([^"]*)"/gi, (match, styles) => {
        const colorMatch = styles.match(/color\s*:\s*([^;]+)/i);
        if (colorMatch) {
            return ` style="color: ${colorMatch[1].trim()}"`;
        }
        return '';
    });
    // Supprimer les attributs data-*
    html = html.replace(/\sdata-[a-z-]+="[^"]*"/gi, '');
    return html;
}
