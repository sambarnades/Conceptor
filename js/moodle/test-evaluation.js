/** Correction locale des réponses simples, alignée sur les valeurs Moodle. */
import { parseGapAnswers, parseClozeGaps } from './mbz-course-builder.js';

export function valeurNumerique(value) {
    const text = String(value ?? '').trim().replace(',', '.');
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) ? Number(text) : NaN;
}

export function correspondanceCourte(value, expected, caseSensitive = false) {
    if (!String(value ?? '').trim()) return false;
    const pattern = String(expected ?? '').split(/(?<!\\)\*/)
        .map(part => part.replace(/\\\*/g, '*').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    return new RegExp(`^${pattern}$`, caseSensitive ? '' : 'i').test(String(value ?? '').trim());
}

export function dansTolerance(value, expected, tolerance = 0) {
    const n = valeurNumerique(value), target = valeurNumerique(expected), tol = valeurNumerique(tolerance);
    if (!Number.isFinite(n)) return false;
    if (expected === '*') return true;
    if (!Number.isFinite(target) || !Number.isFinite(tol)) return false;
    const roundoff = Number.EPSILON * Math.max(Math.abs(n), Math.abs(target), Math.abs(tol)) * 4;
    return Math.abs(n - target) <= Math.abs(tol) + roundoff;
}

export function fractionTrouCloze(gap, value) {
    const parsed = parseGapAnswers(gap);
    if (parsed.kind === 'numerical') {
        // Comme Moodle, la première réponse correspondant à la tolérance gagne.
        const match = parsed.answers.find(a => dansTolerance(value, a.number, a.tolerance));
        return Math.max(0, match?.fraction || 0);
    }
    if (parsed.kind === 'multichoice' && !parsed.single) {
        const selected = Array.isArray(value) ? value : [];
        return Math.min(1, Math.max(0, parsed.answers.filter(a => selected.includes(a.text)).reduce((sum, a) => sum + a.fraction, 0)));
    }
    const found = parsed.answers.find(a => parsed.kind === 'shortanswer'
        ? correspondanceCourte(value, a.text, parsed.usecase) : String(value ?? '') === a.text);
    return Math.max(0, found?.fraction || 0);
}

/** Score du parcours : points Moodle et crédits partiels, pas un comptage binaire. */
export function pourcentageTest(questions, feedbackState) {
    let total = 0, obtained = 0;
    questions.forEach((q, i) => {
        const c = q.content || q;
        const weight = q.type === 'cloze'
            ? parseClozeGaps(c.questiontext).gaps.reduce((n, g) => n + Number(g.weight), 0)
            : Number(c.defaultgrade ?? 1);
        if (!Number.isFinite(weight) || weight <= 0) return;
        total += weight;
        obtained += weight * Math.max(0, Math.min(1, Number(feedbackState[i]?.fraction) || 0));
    });
    return total ? Math.round(100 * obtained / total) : 0;
}
