/**
 * @file Catalogue central des correspondances mathématiques LaTeX / Unicode / OMML / MathML / StarMath.
 *
 * Source de vérité UNIQUE pour tous les convertisseurs de formules.
 * Chaque symbole/commande LaTeX est mappé vers :
 *   - char     : caractère Unicode
 *   - mlType   : type MathML (mi = identifiant, mo = opérateur, mn = nombre)
 *   - sm       : commande StarMath (LibreOffice Math) pour l'annotation ODT
 *
 * Les accents ont en plus :
 *   - ommlChar : caractère d'accent OMML
 *   - mathmlOver/mathmlUnder : caractère pour <mover>/<munder>
 *
 * Utilisé par : latex-parser.js, latex-to-omml.js, latex-to-mathml.js, document-exporter.js
 */

// ========================================================================
// LETTRES GRECQUES
// ========================================================================

export const GREEK = {
    // Minuscules
    alpha:      { char: '\u03B1', mlType: 'mi', sm: '%alpha' },
    beta:       { char: '\u03B2', mlType: 'mi', sm: '%beta' },
    gamma:      { char: '\u03B3', mlType: 'mi', sm: '%gamma' },
    delta:      { char: '\u03B4', mlType: 'mi', sm: '%delta' },
    epsilon:    { char: '\u03B5', mlType: 'mi', sm: '%epsilon' },
    varepsilon: { char: '\u03B5', mlType: 'mi', sm: '%varepsilon' },
    zeta:       { char: '\u03B6', mlType: 'mi', sm: '%zeta' },
    eta:        { char: '\u03B7', mlType: 'mi', sm: '%eta' },
    theta:      { char: '\u03B8', mlType: 'mi', sm: '%theta' },
    vartheta:   { char: '\u03D1', mlType: 'mi', sm: '%vartheta' },
    iota:       { char: '\u03B9', mlType: 'mi', sm: '%iota' },
    kappa:      { char: '\u03BA', mlType: 'mi', sm: '%kappa' },
    lambda:     { char: '\u03BB', mlType: 'mi', sm: '%lambda' },
    mu:         { char: '\u03BC', mlType: 'mi', sm: '%mu' },
    nu:         { char: '\u03BD', mlType: 'mi', sm: '%nu' },
    xi:         { char: '\u03BE', mlType: 'mi', sm: '%xi' },
    pi:         { char: '\u03C0', mlType: 'mi', sm: '%pi' },
    rho:        { char: '\u03C1', mlType: 'mi', sm: '%rho' },
    sigma:      { char: '\u03C3', mlType: 'mi', sm: '%sigma' },
    tau:        { char: '\u03C4', mlType: 'mi', sm: '%tau' },
    upsilon:    { char: '\u03C5', mlType: 'mi', sm: '%upsilon' },
    phi:        { char: '\u03C6', mlType: 'mi', sm: '%phi' },
    varphi:     { char: '\u03D5', mlType: 'mi', sm: '%varphi' },
    chi:        { char: '\u03C7', mlType: 'mi', sm: '%chi' },
    psi:        { char: '\u03C8', mlType: 'mi', sm: '%psi' },
    omega:      { char: '\u03C9', mlType: 'mi', sm: '%omega' },

    // Majuscules
    Gamma:      { char: '\u0393', mlType: 'mi', sm: '%GAMMA' },
    Delta:      { char: '\u0394', mlType: 'mi', sm: '%DELTA' },
    Theta:      { char: '\u0398', mlType: 'mi', sm: '%THETA' },
    Lambda:     { char: '\u039B', mlType: 'mi', sm: '%LAMBDA' },
    Xi:         { char: '\u039E', mlType: 'mi', sm: '%XI' },
    Pi:         { char: '\u03A0', mlType: 'mi', sm: '%PI' },
    Sigma:      { char: '\u03A3', mlType: 'mi', sm: '%SIGMA' },
    Phi:        { char: '\u03A6', mlType: 'mi', sm: '%PHI' },
    Psi:        { char: '\u03A8', mlType: 'mi', sm: '%PSI' },
    Omega:      { char: '\u03A9', mlType: 'mi', sm: '%OMEGA' }
};

// ========================================================================
// OPÉRATEURS BINAIRES ET RELATIONNELS
// ========================================================================

export const OPERATORS = {
    // Arithmétique
    times:      { char: '\u00D7', mlType: 'mo', sm: 'times' },
    div:        { char: '\u00F7', mlType: 'mo', sm: 'div' },
    pm:         { char: '\u00B1', mlType: 'mo', sm: '+-' },
    mp:         { char: '\u2213', mlType: 'mo', sm: '-+' },
    cdot:       { char: '\u22C5', mlType: 'mo', sm: 'cdot' },
    circ:       { char: '\u2218', mlType: 'mo', sm: 'circ' },
    ast:        { char: '\u2217', mlType: 'mo', sm: '*' },
    star:       { char: '\u22C6', mlType: 'mo', sm: '*' },
    bullet:     { char: '\u2022', mlType: 'mo', sm: 'cdot' },

    // Relations
    leq:        { char: '\u2264', mlType: 'mo', sm: '<=' },
    le:         { char: '\u2264', mlType: 'mo', sm: '<=' },
    geq:        { char: '\u2265', mlType: 'mo', sm: '>=' },
    ge:         { char: '\u2265', mlType: 'mo', sm: '>=' },
    neq:        { char: '\u2260', mlType: 'mo', sm: '<>' },
    ne:         { char: '\u2260', mlType: 'mo', sm: '<>' },
    approx:     { char: '\u2248', mlType: 'mo', sm: 'approx' },
    equiv:      { char: '\u2261', mlType: 'mo', sm: 'equiv' },
    sim:        { char: '\u223C', mlType: 'mo', sm: 'sim' },
    simeq:      { char: '\u2243', mlType: 'mo', sm: 'simeq' },
    cong:       { char: '\u2245', mlType: 'mo', sm: 'simeq' },
    propto:     { char: '\u221D', mlType: 'mo', sm: 'prop' },
    ll:         { char: '\u226A', mlType: 'mo', sm: '<<' },
    gg:         { char: '\u226B', mlType: 'mo', sm: '>>' },
    prec:       { char: '\u227A', mlType: 'mo', sm: 'prec' },
    succ:       { char: '\u227B', mlType: 'mo', sm: 'succ' },

    // Ensembles
    in:         { char: '\u2208', mlType: 'mo', sm: 'in' },
    notin:      { char: '\u2209', mlType: 'mo', sm: 'notin' },
    subset:     { char: '\u2282', mlType: 'mo', sm: 'subset' },
    supset:     { char: '\u2283', mlType: 'mo', sm: 'supset' },
    subseteq:   { char: '\u2286', mlType: 'mo', sm: 'subseteq' },
    supseteq:   { char: '\u2287', mlType: 'mo', sm: 'supseteq' },
    cup:        { char: '\u222A', mlType: 'mo', sm: 'union' },
    cap:        { char: '\u2229', mlType: 'mo', sm: 'intersection' },
    setminus:   { char: '\u2216', mlType: 'mo', sm: 'setminus' },
    emptyset:   { char: '\u2205', mlType: 'mi', sm: 'emptyset' },
    varnothing: { char: '\u2205', mlType: 'mi', sm: 'emptyset' },

    // Logique
    neg:        { char: '\u00AC', mlType: 'mo', sm: 'neg' },
    lnot:       { char: '\u00AC', mlType: 'mo', sm: 'neg' },
    vee:        { char: '\u2228', mlType: 'mo', sm: 'or' },
    lor:        { char: '\u2228', mlType: 'mo', sm: 'or' },
    wedge:      { char: '\u2227', mlType: 'mo', sm: 'and' },
    land:       { char: '\u2227', mlType: 'mo', sm: 'and' },
    forall:     { char: '\u2200', mlType: 'mo', sm: 'forall' },
    exists:     { char: '\u2203', mlType: 'mo', sm: 'exists' },
    nexists:    { char: '\u2204', mlType: 'mo', sm: 'notexists' },
    oplus:      { char: '\u2295', mlType: 'mo', sm: 'oplus' },
    otimes:     { char: '\u2297', mlType: 'mo', sm: 'otimes' },

    // Flèches
    to:             { char: '\u2192', mlType: 'mo', sm: 'rightarrow' },
    rightarrow:     { char: '\u2192', mlType: 'mo', sm: 'rightarrow' },
    leftarrow:      { char: '\u2190', mlType: 'mo', sm: 'leftarrow' },
    Rightarrow:     { char: '\u21D2', mlType: 'mo', sm: 'drarrow' },
    Leftarrow:      { char: '\u21D0', mlType: 'mo', sm: 'dlarrow' },
    leftrightarrow: { char: '\u2194', mlType: 'mo', sm: 'dlrarrow' },
    Leftrightarrow: { char: '\u21D4', mlType: 'mo', sm: 'dlrarrow' },
    uparrow:        { char: '\u2191', mlType: 'mo', sm: 'uparrow' },
    downarrow:      { char: '\u2193', mlType: 'mo', sm: 'downarrow' },
    mapsto:         { char: '\u21A6', mlType: 'mo', sm: 'rightarrow' },
    hookrightarrow: { char: '\u21AA', mlType: 'mo', sm: 'rightarrow' },
    hookleftarrow:  { char: '\u21A9', mlType: 'mo', sm: 'leftarrow' },
    longrightarrow: { char: '\u27F6', mlType: 'mo', sm: 'rightarrow' },
    Longrightarrow: { char: '\u27F9', mlType: 'mo', sm: 'drarrow' },

    // Divers
    infty:      { char: '\u221E', mlType: 'mi', sm: 'infinity' },
    partial:    { char: '\u2202', mlType: 'mo', sm: 'partial' },
    nabla:      { char: '\u2207', mlType: 'mo', sm: 'nabla' },
    angle:      { char: '\u2220', mlType: 'mo', sm: 'angle' },
    triangle:   { char: '\u25B3', mlType: 'mo', sm: 'triangle' },
    perp:       { char: '\u22A5', mlType: 'mo', sm: 'ortho' },
    parallel:   { char: '\u2225', mlType: 'mo', sm: 'parallel' },
    therefore:  { char: '\u2234', mlType: 'mo', sm: 'therefore' },
    because:    { char: '\u2235', mlType: 'mo', sm: 'because' },
    ell:        { char: '\u2113', mlType: 'mi', sm: 'l' },
    hbar:       { char: '\u210F', mlType: 'mi', sm: 'hbar' },
    Re:         { char: '\u211C', mlType: 'mi', sm: 'Re' },
    Im:         { char: '\u2111', mlType: 'mi', sm: 'Im' },
    aleph:      { char: '\u2135', mlType: 'mi', sm: 'aleph' },

    // Points
    dots:       { char: '\u2026', mlType: 'mo', sm: 'dotslow' },
    ldots:      { char: '\u2026', mlType: 'mo', sm: 'dotslow' },
    cdots:      { char: '\u22EF', mlType: 'mo', sm: 'dotsaxis' },
    vdots:      { char: '\u22EE', mlType: 'mo', sm: 'dotsvert' },
    ddots:      { char: '\u22F1', mlType: 'mo', sm: 'dotsdiag' }
};

// ========================================================================
// OPÉRATEURS N-AIRES (somme, produit, intégrale…)
// ========================================================================

export const NARY_OPS = {
    sum:        { char: '\u2211', mlType: 'mo', sm: 'sum' },
    prod:       { char: '\u220F', mlType: 'mo', sm: 'prod' },
    coprod:     { char: '\u2210', mlType: 'mo', sm: 'coprod' },
    int:        { char: '\u222B', mlType: 'mo', sm: 'int' },
    iint:       { char: '\u222C', mlType: 'mo', sm: 'iint' },
    iiint:      { char: '\u222D', mlType: 'mo', sm: 'iiint' },
    oint:       { char: '\u222E', mlType: 'mo', sm: 'lint' },
    bigcup:     { char: '\u22C3', mlType: 'mo', sm: 'union' },
    bigcap:     { char: '\u22C2', mlType: 'mo', sm: 'intersection' },
    bigoplus:   { char: '\u2A01', mlType: 'mo', sm: 'oplus' },
    bigotimes:  { char: '\u2A02', mlType: 'mo', sm: 'otimes' },
    bigvee:     { char: '\u22C1', mlType: 'mo', sm: 'or' },
    bigwedge:   { char: '\u22C0', mlType: 'mo', sm: 'and' }
};

// ========================================================================
// FONCTIONS MATHÉMATIQUES (noms affichés en romain)
// ========================================================================

/** Set des noms de fonctions + correspondance StarMath */
export const FUNCTIONS = new Set([
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'arcsin', 'arccos', 'arctan',
    'sinh', 'cosh', 'tanh', 'coth',
    'log', 'ln', 'lg', 'exp',
    'lim', 'limsup', 'liminf',
    'sup', 'inf', 'max', 'min',
    'det', 'gcd', 'lcm',
    'dim', 'ker', 'hom', 'deg',
    'arg', 'mod', 'Pr'
]);

/** StarMath pour les fonctions (identique au nom sauf exceptions) */
export const FUNCTION_SM = {
    'coth': 'coth', 'lg': 'log', 'limsup': 'limsup', 'liminf': 'liminf',
    'lcm': 'gcd', 'hom': 'hom', 'Pr': 'Pr'
    // Toutes les autres fonctions ont le même nom en StarMath
};

// ========================================================================
// ACCENTS (commandes avec un argument)
// ========================================================================

export const ACCENTS = {
    vec:       { ommlChar: '\u20D7', mathmlOver: '\u2192', sm: 'vec' },
    hat:       { ommlChar: '\u0302', mathmlOver: '\u005E', sm: 'hat' },
    widehat:   { ommlChar: '\u0302', mathmlOver: '\u005E', sm: 'hat' },
    overline:  { ommlChar: '\u0305', mathmlOver: '\u00AF', sm: 'overline' },
    bar:       { ommlChar: '\u0305', mathmlOver: '\u00AF', sm: 'bar' },
    tilde:     { ommlChar: '\u0303', mathmlOver: '\u007E', sm: 'tilde' },
    widetilde: { ommlChar: '\u0303', mathmlOver: '\u007E', sm: 'tilde' },
    dot:       { ommlChar: '\u0307', mathmlOver: '\u02D9', sm: 'dot' },
    ddot:      { ommlChar: '\u0308', mathmlOver: '\u00A8', sm: 'ddot' },
    check:     { ommlChar: '\u030C', mathmlOver: '\u02C7', sm: 'check' },
    acute:     { ommlChar: '\u0301', mathmlOver: '\u00B4', sm: 'acute' },
    grave:     { ommlChar: '\u0300', mathmlOver: '\u0060', sm: 'grave' },
    breve:     { ommlChar: '\u0306', mathmlOver: '\u02D8', sm: 'breve' },
    underline: { ommlChar: '\u0332', mathmlUnder: '\u005F', sm: 'underline' }
};

// ========================================================================
// ENSEMBLES (\mathbb)
// ========================================================================

export const BLACKBOARD = {
    'A': '\uD835\uDD38', 'B': '\uD835\uDD39', 'C': '\u2102',
    'D': '\uD835\uDD3B', 'E': '\uD835\uDD3C', 'F': '\uD835\uDD3D',
    'G': '\uD835\uDD3E', 'H': '\u210D',       'I': '\uD835\uDD40',
    'J': '\uD835\uDD41', 'K': '\uD835\uDD42', 'L': '\uD835\uDD43',
    'M': '\uD835\uDD44', 'N': '\u2115',       'O': '\uD835\uDD46',
    'P': '\u2119',       'Q': '\u211A',       'R': '\u211D',
    'S': '\uD835\uDD4A', 'T': '\uD835\uDD4B', 'U': '\uD835\uDD4C',
    'V': '\uD835\uDD4D', 'W': '\uD835\uDD4E', 'X': '\uD835\uDD4F',
    'Y': '\uD835\uDD50', 'Z': '\u2124'
};

// ========================================================================
// DÉLIMITEURS
// ========================================================================

export const DELIMITERS = {
    '(':        { open: '(', close: ')' },
    ')':        { open: '(', close: ')' },
    '[':        { open: '[', close: ']' },
    ']':        { open: '[', close: ']' },
    '\\{':      { open: '{', close: '}' },
    '\\}':      { open: '{', close: '}' },
    '|':        { open: '|', close: '|' },
    '\\|':      { open: '\u2016', close: '\u2016' },
    'langle':   { open: '\u27E8', close: '\u27E9' },
    'rangle':   { open: '\u27E8', close: '\u27E9' },
    'lfloor':   { open: '\u230A', close: '\u230B' },
    'rfloor':   { open: '\u230A', close: '\u230B' },
    'lceil':    { open: '\u2308', close: '\u2309' },
    'rceil':    { open: '\u2308', close: '\u2309' },
    '.':        { open: '',  close: '' }
};

// ========================================================================
// FRACTIONS COURANTES (pour fallback Unicode)
// ========================================================================

export const COMMON_FRACTIONS = {
    '1/2': '\u00BD', '1/3': '\u2153', '2/3': '\u2154',
    '1/4': '\u00BC', '3/4': '\u00BE', '1/5': '\u2155',
    '2/5': '\u2156', '3/5': '\u2157', '4/5': '\u2158',
    '1/6': '\u2159', '5/6': '\u215A', '1/7': '\u215B',
    '1/8': '\u215B', '3/8': '\u215C', '5/8': '\u215D',
    '7/8': '\u215E', '1/9': '\u2151', '1/10': '\u2152'
};

// ========================================================================
// LOOKUP COMBINÉ
// ========================================================================

/** Tous les symboles simples (sans argument) */
export const ALL_SYMBOLS = { ...GREEK, ...OPERATORS };

/** Vérifie si un nom de commande est un symbole simple */
export function isSymbol(name) { return name in ALL_SYMBOLS; }

/** Vérifie si un nom de commande est un opérateur n-aire */
export function isNary(name) { return name in NARY_OPS; }

/** Vérifie si un nom de commande est une fonction mathématique */
export function isFunction(name) { return FUNCTIONS.has(name); }

/** Vérifie si un nom de commande est un accent */
export function isAccent(name) { return name in ACCENTS; }

/** Récupère le caractère Unicode d'un symbole ou opérateur */
export function getSymbolChar(name) {
    const sym = ALL_SYMBOLS[name] || NARY_OPS[name];
    return sym ? sym.char : null;
}

/** Récupère le type MathML d'un symbole */
export function getSymbolMlType(name) {
    const sym = ALL_SYMBOLS[name] || NARY_OPS[name];
    return sym ? sym.mlType : 'mi';
}

/**
 * Récupère la commande StarMath d'un symbole, opérateur, n-aire, fonction ou accent.
 * @param {string} name — Nom de la commande LaTeX (sans \)
 * @returns {string|null} Commande StarMath ou null si inconnue
 */
export function getStarMath(name) {
    // Symboles et opérateurs
    const sym = ALL_SYMBOLS[name] || NARY_OPS[name];
    if (sym?.sm) return sym.sm;
    // Accents
    if (ACCENTS[name]?.sm) return ACCENTS[name].sm;
    // Fonctions (même nom en StarMath sauf exceptions)
    if (FUNCTIONS.has(name)) return FUNCTION_SM[name] || name;
    return null;
}
