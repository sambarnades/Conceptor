/**
 * @file Parser LaTeX vers AST (arbre syntaxique abstrait).
 *
 * Transforme une chaîne LaTeX mathématique en arbre exploitable
 * par les convertisseurs OMML (Word) et MathML (ODT).
 *
 * Gère : fractions, racines, puissances, indices, lettres grecques,
 * opérateurs, fonctions, accents, délimiteurs, matrices, cas,
 * binômes, espaces, et toutes les imbrications.
 *
 * @example
 *   import { parseLatex } from './latex-parser.js';
 *   const ast = parseLatex('\\frac{x^{2}+1}{\\sqrt{n}}');
 *   // → [{ type: 'frac', num: [...], den: [...] }]
 */

import {
    isSymbol, isNary, isFunction, isAccent,
    NARY_OPS, FUNCTIONS, ACCENTS
} from './math-catalog.js';

// ========================================================================
// CONSTANTES
// ========================================================================

/** Commandes de style de texte (contenu traité comme texte brut) */
const TEXT_COMMANDS = new Set([
    'text', 'textrm', 'textbf', 'textit', 'texttt',
    'mathrm', 'mathbf', 'mathit', 'mathtt', 'mathsf',
    'operatorname', 'boldsymbol'
]);

/** Commandes de police spéciale (un argument, traité comme font) */
const FONT_COMMANDS = new Set([
    'mathbb', 'mathcal', 'mathfrak', 'mathscr'
]);

/** Commandes de fraction (deux arguments) */
const FRAC_COMMANDS = new Set(['frac', 'dfrac', 'tfrac', 'cfrac']);

/** Commandes d'espacement */
const SPACE_COMMANDS = {
    'quad':   '\u2003',     // em space
    'qquad':  '\u2003\u2003',
    ',':      '\u2009',     // thin space
    ':':      '\u2005',     // medium space
    ';':      '\u2004',     // thick space
    '!':      '',           // negative thin (ignoré)
    ' ':      ' '           // espace normal
};

/** Commandes de taille (ignorées dans l'AST) */
const SIZE_COMMANDS = new Set([
    'displaystyle', 'textstyle', 'scriptstyle', 'scriptscriptstyle',
    'tiny', 'scriptsize', 'footnotesize', 'small', 'normalsize',
    'large', 'Large', 'LARGE', 'huge', 'Huge',
    'left', 'right', 'big', 'Big', 'bigg', 'Bigg',
    'bigr', 'Bigr', 'bigl', 'Bigl'
]);

// ========================================================================
// PARSER
// ========================================================================

// Profondeur de récursion maximale du parser (garde anti-DoS / stack overflow — S17).
// Au-delà, le contenu restant est retourné comme nœud texte brut (pas d'exception).
const PARSER_MAX_DEPTH = 100;

class LaTeXParser {
    /**
     * @param {string} input — LaTeX brut (sans délimiteurs \( \) ou \[ \])
     */
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.len = input.length;
        this.depth = 0; // profondeur de récursion courante (bornée par PARSER_MAX_DEPTH)
    }

    // ====================================================================
    // API PRINCIPALE
    // ====================================================================

    /**
     * Parse l'intégralité de l'entrée en liste de nœuds AST.
     * @returns {Array} Liste de nœuds AST
     */
    parse() {
        return this._parseExpression();
    }

    // ====================================================================
    // PARSING D'EXPRESSIONS
    // ====================================================================

    /**
     * Parse une séquence de nœuds jusqu'à une condition d'arrêt.
     * @param {function} [stopFn] — Fonction testant le caractère courant, retourne true pour stopper
     * @returns {Array} Liste de nœuds
     */
    _parseExpression(stopFn) {
        // Garde anti-récursion (S17) : au-delà de la profondeur max, arrêter proprement
        // la descente en consommant le contenu restant comme texte brut (pas d'exception)
        if (this.depth >= PARSER_MAX_DEPTH) {
            let raw = '';
            while (this.pos < this.len && !(stopFn && stopFn(this._peek()))) {
                raw += this._consume();
            }
            return raw ? [{ type: 'text', value: raw }] : [];
        }
        this.depth++;
        try {
            const nodes = [];
            while (this.pos < this.len) {
                // Sauter les espaces AVANT le test d'arrêt pour ne pas rater
                // un \right ou \end précédé d'un espace
                if (stopFn) this._skipSpaces();
                if (stopFn && stopFn(this._peek())) break;
                const node = this._parseAtomWithScripts();
                if (node) nodes.push(node);
            }
            return this._reattachClosingDelimiterScripts(nodes);
        } finally {
            this.depth--;
        }
    }

    /**
     * Ré-attache un exposant/indice porté par un délimiteur fermant SEUL
     * (`)` ou `]`) au groupe délimité complet qui le précède.
     *
     * LaTeX lie `^`/`_` au seul atome précédent : `(x-3)^2` produit donc un
     * script dont la base est la parenthèse fermante isolée. Word (OMML) le
     * tolère, mais l'annotation StarMath de l'ODT devient `( x - 3 {)} ^ {2}`
     * — parenthèse ouvrante jamais fermée → LibreOffice rend une parenthèse
     * géante (formules « mal dimensionnées » en ODT et en PDF via Gotenberg).
     *
     * On reconstruit ici un nœud `delimited` équilibré `(x-3)` comme base du
     * script, ce qui corrige d'un coup les trois cibles (OMML, MathML, StarMath)
     * puisqu'elles partagent cet AST.
     *
     * @param {Array} nodes — Liste de nœuds (modifiée en place puis retournée)
     * @returns {Array}
     */
    _reattachClosingDelimiterScripts(nodes) {
        const CLOSERS = { ')': '(', ']': '[' };
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (!n || (n.type !== 'sup' && n.type !== 'sub' && n.type !== 'subsup')) continue;
            if (!Array.isArray(n.base) || n.base.length !== 1) continue;
            const base = n.base[0];
            if (!base || base.type !== 'operator' || !CLOSERS[base.value]) continue;

            const closeCh = base.value;
            const openCh = CLOSERS[closeCh];

            // Remonter jusqu'à l'ouvrant correspondant (en gérant l'imbrication)
            let depth = 0, openIdx = -1;
            for (let j = i - 1; j >= 0; j--) {
                const m = nodes[j];
                if (!m || m.type !== 'operator') continue;
                if (m.value === closeCh) depth++;
                else if (m.value === openCh) {
                    if (depth === 0) { openIdx = j; break; }
                    depth--;
                }
            }
            if (openIdx === -1) continue; // ouvrant absent → laisser tel quel

            const inner = nodes.slice(openIdx + 1, i); // contenu entre ( et )
            n.base = [{ type: 'delimited', open: openCh, close: closeCh, body: inner }];
            nodes.splice(openIdx, i - openIdx); // retire l'ouvrant + le contenu ; le script reste
            i = openIdx; // reprendre à la position du script ré-attaché
        }
        return nodes;
    }

    /**
     * Parse un atome puis attache les éventuels exposants/indices.
     * @returns {Object|null} Nœud AST (possiblement enveloppé dans sup/sub/subsup)
     */
    _parseAtomWithScripts() {
        const atom = this._parseAtom();
        if (!atom) return null;

        // Vérifier ^/_ dans n'importe quel ordre
        let sub = null, sup = null;
        let iterations = 0;
        while (iterations++ < 2 && this.pos < this.len) {
            this._skipSpaces();
            const ch = this._peek();
            if (ch === '^' && !sup) {
                this._consume();
                sup = this._parseScriptArg();
            } else if (ch === '_' && !sub) {
                this._consume();
                sub = this._parseScriptArg();
            } else {
                break;
            }
        }

        if (!sub && !sup) return atom;

        // Cas spécial : opérateur n-aire — les scripts deviennent des limites
        if (atom.type === 'nary') {
            atom.sub = sub;
            atom.sup = sup;
            return atom;
        }

        // Cas spécial : fonction avec souscript (ex: \lim_{x \to 0})
        if (atom.type === 'func' && sub && !sup) {
            atom.sub = sub;
            return atom;
        }

        // Cas général : envelopper dans sup/sub/subsup
        const base = [atom];
        if (sub && sup) return { type: 'subsup', base, sub, sup };
        if (sup) return { type: 'sup', base, sup };
        return { type: 'sub', base, sub };
    }

    /**
     * Parse l'argument d'un script (^ ou _).
     * Un seul caractère ou un groupe entre accolades.
     * @returns {Array} Nœuds du script
     */
    _parseScriptArg() {
        this._skipSpaces();
        if (this._peek() === '{') {
            return this._parseGroup();
        }
        // Caractère unique
        if (this._peek() === '\\') {
            const node = this._parseCommand();
            return node ? [node] : [];
        }
        const ch = this._consume();
        if (!ch) return [];
        // Distinguer chiffre (→ number/mn) de lettre (→ text/mi)
        if (/[0-9]/.test(ch)) return [{ type: 'number', value: ch }];
        return [{ type: 'text', value: ch }];
    }

    // ====================================================================
    // PARSING D'ATOMES
    // ====================================================================

    /**
     * Parse un seul atome (élément indivisible avant scripts).
     * @returns {Object|null} Nœud AST
     */
    _parseAtom() {
        this._skipSpaces();
        if (this.pos >= this.len) return null;

        const ch = this._peek();

        // Commande LaTeX
        if (ch === '\\') return this._parseCommand();

        // Groupe entre accolades
        if (ch === '{') {
            const children = this._parseGroup();
            if (children.length === 1) return children[0];
            return { type: 'group', children };
        }

        // Fin de groupe (ne devrait pas arriver ici)
        if (ch === '}') return null;

        // Séparateurs de matrice (traités au niveau supérieur)
        if (ch === '&') {
            this._consume();
            return { type: 'align' };
        }

        // Opérateurs littéraux
        if ('+-=<>()[]|/!,.:;?'.includes(ch)) {
            this._consume();
            return { type: 'operator', value: ch };
        }

        // Nombre (séquence de chiffres)
        if (/[0-9]/.test(ch)) return this._parseNumber();

        // Caractère simple (lettre, etc.)
        this._consume();
        return { type: 'text', value: ch };
    }

    /**
     * Parse un nombre (séquence de chiffres, éventuellement avec virgule/point).
     * @returns {Object} Nœud number
     */
    _parseNumber() {
        let num = '';
        while (this.pos < this.len && /[0-9.,]/.test(this._peek())) {
            num += this._consume();
        }
        return { type: 'number', value: num };
    }

    /**
     * Parse un groupe entre accolades { ... }.
     * @returns {Array} Nœuds contenus dans le groupe
     */
    _parseGroup() {
        this._expect('{');
        const nodes = this._parseExpression(ch => ch === '}');
        this._expect('}');

        // {n \choose k} → nœud binom (primitif TeX, produit par normalizeBinomDeep du json-healer)
        const chooseIdx = nodes.findIndex(n => n.type === 'text' && n.value === '\\choose');
        if (chooseIdx !== -1) {
            const top = nodes.slice(0, chooseIdx);
            const bottom = nodes.slice(chooseIdx + 1);
            return [{ type: 'binom', top, bottom }];
        }

        return nodes;
    }

    // ====================================================================
    // PARSING DE COMMANDES
    // ====================================================================

    /**
     * Parse une commande LaTeX (\nom...).
     * @returns {Object|null} Nœud AST
     */
    _parseCommand() {
        this._consume(); // consomme le '\'
        if (this.pos >= this.len) return null;

        const ch = this._peek();

        // Commande à un seul caractère spécial
        if (!/[a-zA-Z]/.test(ch)) {
            return this._parseSingleCharCommand();
        }

        // Lire le nom de la commande
        const name = this._readCommandName();

        // Fractions : \frac{num}{den}
        if (FRAC_COMMANDS.has(name)) return this._parseFrac();

        // Racines : \sqrt{x} ou \sqrt[n]{x}
        if (name === 'sqrt') return this._parseSqrt();

        // Binôme : \binom{n}{k}
        if (name === 'binom' || name === 'tbinom' || name === 'dbinom') return this._parseBinom();

        // Accents : \vec{u}, \hat{x}, \overline{AB}...
        if (isAccent(name)) return this._parseAccent(name);

        // Commandes de texte : \text{...}, \mathrm{...}
        if (TEXT_COMMANDS.has(name)) return this._parseTextContent(name);

        // Commandes de police : \mathbb{R}, \mathcal{L}
        if (FONT_COMMANDS.has(name)) return this._parseFontCommand(name);

        // Opérateurs n-aires : \sum, \prod, \int
        if (isNary(name)) return { type: 'nary', op: name, sub: null, sup: null };

        // Fonctions : \sin, \cos, \log, \lim
        if (isFunction(name)) return { type: 'func', name, sub: null };

        // Symboles : \alpha, \times, \infty
        if (isSymbol(name)) return { type: 'symbol', name };

        // Environnements : \begin{...}
        if (name === 'begin') return this._parseEnvironment();

        // \left ... \right (délimiteurs)
        if (name === 'left') return this._parseDelimited();

        // Espacement
        if (name in SPACE_COMMANDS) return { type: 'space', value: SPACE_COMMANDS[name] };

        // Commandes de taille (ignorées)
        if (SIZE_COMMANDS.has(name)) {
            // \left et \right consomment aussi le délimiteur qui suit
            if (name === 'left') return this._parseDelimited();
            if (name === 'right') return null; // géré dans _parseDelimited
            return null;
        }

        // Commande inconnue — retourner comme texte
        return { type: 'text', value: '\\' + name };
    }

    /**
     * Parse une commande à un seul caractère (\\, \{, \}, \,, etc.).
     * @returns {Object|null} Nœud AST
     */
    _parseSingleCharCommand() {
        const ch = this._consume();

        // Retour à la ligne
        if (ch === '\\') return { type: 'newline' };

        // Accolades littérales
        if (ch === '{') return { type: 'operator', value: '{' };
        if (ch === '}') return { type: 'operator', value: '}' };

        // Espacement
        if (ch in SPACE_COMMANDS) return { type: 'space', value: SPACE_COMMANDS[ch] };

        // Barre verticale
        if (ch === '|') return { type: 'operator', value: '\u2016' };

        // Délimiteurs mathématiques \( \) \[ \] — ne devraient pas apparaître
        // dans le contenu interne, mais on les ignore par sécurité
        if ('()[]'.includes(ch)) return null;

        // Caractère littéral
        return { type: 'text', value: ch };
    }

    // ====================================================================
    // COMMANDES SPÉCIFIQUES
    // ====================================================================

    /**
     * Parse \frac{numérateur}{dénominateur}
     */
    _parseFrac() {
        this._skipSpaces();
        const num = this._peek() === '{' ? this._parseGroup() : this._parseSingleArg();
        this._skipSpaces();
        const den = this._peek() === '{' ? this._parseGroup() : this._parseSingleArg();
        return { type: 'frac', num, den };
    }

    /**
     * Parse \sqrt{x} ou \sqrt[n]{x}
     */
    _parseSqrt() {
        this._skipSpaces();
        let index = null;
        // Argument optionnel [n]
        if (this._peek() === '[') {
            this._consume(); // [
            index = this._parseExpression(ch => ch === ']');
            this._expect(']');
        }
        this._skipSpaces();
        const body = this._peek() === '{' ? this._parseGroup() : this._parseSingleArg();
        return { type: 'sqrt', index, body };
    }

    /**
     * Parse \binom{n}{k}
     */
    _parseBinom() {
        this._skipSpaces();
        const top = this._peek() === '{' ? this._parseGroup() : this._parseSingleArg();
        this._skipSpaces();
        const bottom = this._peek() === '{' ? this._parseGroup() : this._parseSingleArg();
        return { type: 'binom', top, bottom };
    }

    /**
     * Parse un accent : \vec{u}, \hat{x}, \overline{AB}...
     */
    _parseAccent(name) {
        this._skipSpaces();
        const body = this._peek() === '{' ? this._parseGroup() : this._parseSingleArg();
        return { type: 'accent', name, body };
    }

    /**
     * Parse une commande de texte : \text{contenu}, \mathrm{contenu}
     */
    _parseTextContent(name) {
        this._skipSpaces();
        if (this._peek() === '{') {
            this._consume(); // {
            let text = '';
            let depth = 1;
            while (this.pos < this.len && depth > 0) {
                const c = this._consume();
                if (c === '{') depth++;
                else if (c === '}') { depth--; if (depth === 0) break; }
                else text += c;
            }
            return { type: 'textContent', value: text, style: name };
        }
        return { type: 'textContent', value: '', style: name };
    }

    /**
     * Parse une commande de police : \mathbb{R}, \mathcal{L}
     */
    _parseFontCommand(name) {
        this._skipSpaces();
        const body = this._peek() === '{' ? this._parseGroup() : this._parseSingleArg();
        return { type: 'font', name, body };
    }

    /**
     * Parse \left( ... \right) — délimiteurs extensibles.
     */
    _parseDelimited() {
        this._skipSpaces();
        const open = this._readDelimiter();
        const body = this._parseExpression(ch => {
            // Arrêter quand on trouve \right
            if (ch === '\\') {
                const ahead = this.input.substring(this.pos + 1, this.pos + 6);
                return ahead.startsWith('right');
            }
            return false;
        });
        // Consommer \right et le délimiteur fermant
        let close = '';
        if (this._peek() === '\\') {
            this._consume(); // '\'
            const name = this._readCommandName();
            if (name === 'right') {
                this._skipSpaces();
                close = this._readDelimiter();
            }
        }
        return { type: 'delimited', open, close, body };
    }

    /**
     * Lit un caractère de délimiteur après \left ou \right.
     * Gère (, ), [, ], |, \{, \}, \langle, \rangle, .
     */
    _readDelimiter() {
        this._skipSpaces();
        if (this.pos >= this.len) return '';
        const ch = this._peek();

        if (ch === '\\') {
            this._consume();
            const next = this._peek();
            if (next === '{' || next === '}') {
                this._consume();
                return next === '{' ? '{' : '}';
            }
            if (next === '|') {
                this._consume();
                return '\u2016'; // double barre
            }
            // \langle, \rangle, etc.
            const name = this._readCommandName();
            if (name === 'langle') return '\u27E8';
            if (name === 'rangle') return '\u27E9';
            if (name === 'lfloor') return '\u230A';
            if (name === 'rfloor') return '\u230B';
            if (name === 'lceil') return '\u2308';
            if (name === 'rceil') return '\u2309';
            return name;
        }

        this._consume();
        if (ch === '.') return ''; // délimiteur invisible
        return ch;
    }

    /**
     * Parse un environnement \begin{nom} ... \end{nom}
     */
    _parseEnvironment() {
        this._skipSpaces();
        // Lire le nom de l'environnement
        this._expect('{');
        let envName = '';
        while (this.pos < this.len && this._peek() !== '}') {
            envName += this._consume();
        }
        this._expect('}');

        // Environnements de matrice
        if (['pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'matrix'].includes(envName)) {
            return this._parseMatrix(envName);
        }

        // Environnement cases
        if (envName === 'cases') {
            return this._parseCases();
        }

        // Environnements align, aligned, etc. — parser comme lignes
        if (['align', 'align*', 'aligned', 'gather', 'gather*'].includes(envName)) {
            return this._parseAlignEnv(envName);
        }

        // Environnement inconnu — parser le contenu et ignorer les balises
        const body = this._parseUntilEnd(envName);
        return { type: 'group', children: body };
    }

    /**
     * Parse une matrice : lignes séparées par \\, cellules par &
     */
    _parseMatrix(variant) {
        const rows = [];
        let currentRow = [];
        let currentCell = [];

        const flush = () => {
            // Parser la cellule accumulée
            if (currentCell.length > 0) {
                currentRow.push(this._reattachClosingDelimiterScripts(currentCell));
                currentCell = [];
            }
        };

        while (this.pos < this.len) {
            this._skipSpaces();
            // Vérifier \end{variant}
            if (this._peek() === '\\' && this._lookaheadEnd(variant)) {
                flush();
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [];
                this._consumeEnd(variant);
                break;
            }

            const ch = this._peek();

            // Séparateur de colonne
            if (ch === '&') {
                this._consume();
                flush();
                continue;
            }

            // Retour à la ligne
            if (ch === '\\' && this.pos + 1 < this.len && this.input[this.pos + 1] === '\\') {
                this._consume(); // premier \
                this._consume(); // deuxième \
                flush();
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [];
                continue;
            }

            // Contenu normal
            const node = this._parseAtomWithScripts();
            if (node) currentCell.push(node);
        }

        // Finaliser
        flush();
        if (currentRow.length > 0) rows.push(currentRow);

        return { type: 'matrix', variant, rows };
    }

    /**
     * Parse un environnement cases
     */
    _parseCases() {
        const rows = [];
        let currentValue = [];
        let currentCondition = [];
        let inCondition = false;

        while (this.pos < this.len) {
            this._skipSpaces();

            // Vérifier \end{cases}
            if (this._peek() === '\\' && this._lookaheadEnd('cases')) {
                if (currentValue.length > 0 || currentCondition.length > 0) {
                    rows.push({
                        value: this._reattachClosingDelimiterScripts(currentValue),
                        condition: this._reattachClosingDelimiterScripts(currentCondition)
                    });
                }
                this._consumeEnd('cases');
                break;
            }

            const ch = this._peek();

            // Séparateur & → bascule vers la condition
            if (ch === '&') {
                this._consume();
                inCondition = true;
                continue;
            }

            // Retour à la ligne \\
            if (ch === '\\' && this.pos + 1 < this.len && this.input[this.pos + 1] === '\\') {
                this._consume();
                this._consume();
                rows.push({
                    value: this._reattachClosingDelimiterScripts(currentValue),
                    condition: this._reattachClosingDelimiterScripts(currentCondition)
                });
                currentValue = [];
                currentCondition = [];
                inCondition = false;
                continue;
            }

            // Contenu
            const node = this._parseAtomWithScripts();
            if (node) {
                if (inCondition) currentCondition.push(node);
                else currentValue.push(node);
            }
        }

        return { type: 'cases', rows };
    }

    /**
     * Parse un environnement align/aligned (lignes séparées par \\, alignées par &)
     */
    _parseAlignEnv(envName) {
        const lines = [];
        let currentLine = [];

        while (this.pos < this.len) {
            this._skipSpaces();
            if (this._peek() === '\\' && this._lookaheadEnd(envName)) {
                if (currentLine.length > 0) lines.push(this._reattachClosingDelimiterScripts(currentLine));
                this._consumeEnd(envName);
                break;
            }

            const ch = this._peek();

            if (ch === '&') {
                this._consume();
                currentLine.push({ type: 'space', value: ' ' });
                continue;
            }

            if (ch === '\\' && this.pos + 1 < this.len && this.input[this.pos + 1] === '\\') {
                this._consume();
                this._consume();
                if (currentLine.length > 0) lines.push(this._reattachClosingDelimiterScripts(currentLine));
                currentLine = [];
                continue;
            }

            const node = this._parseAtomWithScripts();
            if (node) currentLine.push(node);
        }

        if (currentLine.length > 0) lines.push(currentLine);

        // Si une seule ligne, retourner comme groupe
        if (lines.length === 1) return { type: 'group', children: lines[0] };

        // Plusieurs lignes
        return { type: 'aligned', lines };
    }

    // ====================================================================
    // UTILITAIRES DE PARSING
    // ====================================================================

    /** Parse un argument unique (caractère ou groupe) */
    _parseSingleArg() {
        if (this._peek() === '\\') {
            // Garde anti-récursion (S17) : les chaînes \frac\frac\frac… recursent ici
            // sans passer par _parseExpression → consommer la commande comme texte brut
            if (this.depth >= PARSER_MAX_DEPTH) {
                let raw = this._consume(); // le '\'
                while (this.pos < this.len && /[a-zA-Z]/.test(this._peek())) {
                    raw += this._consume();
                }
                return [{ type: 'text', value: raw }];
            }
            this.depth++;
            try {
                const node = this._parseCommand();
                return node ? [node] : [];
            } finally {
                this.depth--;
            }
        }
        const ch = this._consume();
        return ch ? [{ type: 'text', value: ch }] : [];
    }

    /** Parse jusqu'à \end{envName} */
    _parseUntilEnd(envName) {
        const nodes = [];
        while (this.pos < this.len) {
            if (this._peek() === '\\' && this._lookaheadEnd(envName)) {
                this._consumeEnd(envName);
                break;
            }
            const node = this._parseAtomWithScripts();
            if (node) nodes.push(node);
        }
        return nodes;
    }

    /** Vérifie si \end{envName} est la prochaine séquence */
    _lookaheadEnd(envName) {
        const pattern = `\\end{${envName}}`;
        return this.input.substring(this.pos, this.pos + pattern.length) === pattern;
    }

    /** Consomme \end{envName} */
    _consumeEnd(envName) {
        const pattern = `\\end{${envName}}`;
        if (this.input.substring(this.pos, this.pos + pattern.length) === pattern) {
            this.pos += pattern.length;
        }
    }

    // ====================================================================
    // LECTURE BAS NIVEAU
    // ====================================================================

    /** Retourne le caractère courant sans avancer (supporte les surrogate pairs Unicode) */
    _peek() {
        if (this.pos >= this.len) return '';
        const code = this.input.codePointAt(this.pos);
        return String.fromCodePoint(code);
    }

    /** Consomme et retourne le caractère courant (supporte les surrogate pairs Unicode) */
    _consume() {
        if (this.pos >= this.len) return '';
        const code = this.input.codePointAt(this.pos);
        const ch = String.fromCodePoint(code);
        this.pos += ch.length; // 1 pour BMP, 2 pour SMP (ex: 𝒫 U+1D4AB)
        return ch;
    }

    /** Vérifie et consomme un caractère attendu */
    _expect(ch) {
        this._skipSpaces();
        if (this._peek() === ch) this._consume();
        // Mode tolérant : pas d'erreur si le caractère n'est pas trouvé
    }

    /** Saute les espaces blancs */
    _skipSpaces() {
        while (this.pos < this.len && /\s/.test(this.input[this.pos])) {
            this.pos++;
        }
    }

    /** Lit un nom de commande alphabétique */
    _readCommandName() {
        let name = '';
        while (this.pos < this.len && /[a-zA-Z*]/.test(this.input[this.pos])) {
            name += this.input[this.pos++];
        }
        return name;
    }
}

// ========================================================================
// API PUBLIQUE
// ========================================================================

/**
 * Parse une chaîne LaTeX en AST.
 * Gère les délimiteurs \(...\) et \[...\] en les retirant automatiquement.
 *
 * @param {string} input — LaTeX brut
 * @returns {Array} Liste de nœuds AST
 */
export function parseLatex(input) {
    if (!input || typeof input !== 'string') return [];

    // Retirer les délimiteurs MathJax s'ils sont présents
    let clean = input.trim();
    if (clean.startsWith('\\(') && clean.endsWith('\\)')) {
        clean = clean.slice(2, -2);
    } else if (clean.startsWith('\\[') && clean.endsWith('\\]')) {
        clean = clean.slice(2, -2);
    } else if (clean.startsWith('$') && clean.endsWith('$')) {
        clean = clean.slice(1, -1);
        if (clean.startsWith('$') && clean.endsWith('$')) {
            clean = clean.slice(1, -1); // $$...$$
        }
    }

    return new LaTeXParser(clean.trim()).parse();
}

/**
 * Détecte si un texte contient des formules LaTeX.
 * @param {string} text — Texte à analyser
 * @returns {boolean}
 */
export function containsLatex(text) {
    if (!text || typeof text !== 'string') return false;
    return /\\\(.+?\\\)/s.test(text) || /\\\[.+?\\\]/s.test(text);
}

/**
 * Découpe un texte en segments texte/formule.
 * @param {string} text — Texte mélangé texte + LaTeX
 * @returns {Array<{type: 'text'|'math', value: string}>} Segments
 */
export function splitTextAndMath(text) {
    if (!text || typeof text !== 'string') return [{ type: 'text', value: text || '' }];

    const segments = [];
    // Regex pour trouver les blocs \(...\) et \[...\]
    const regex = /\\\((.+?)\\\)|\\\[(.+?)\\\]/gs;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Texte avant la formule
        if (match.index > lastIndex) {
            segments.push({ type: 'text', value: text.substring(lastIndex, match.index) });
        }
        // Formule
        const latex = match[1] || match[2];
        segments.push({ type: 'math', value: latex, display: !!match[2] });
        lastIndex = regex.lastIndex;
    }

    // Texte restant après la dernière formule
    if (lastIndex < text.length) {
        segments.push({ type: 'text', value: text.substring(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}
