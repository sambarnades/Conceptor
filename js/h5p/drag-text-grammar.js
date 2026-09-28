/** Grammaire de H5P.DragText 1.10 : une réponse, un indice, deux retours. */
export function parseDragTextWord(marked) {
    const text = String(marked).replace(/\*/g, '');
    const tip = text.match(/:([^\\*]+)/)?.[1]?.trimEnd() || '';
    const correctFeedback = text.match(/\\\+([^\\*:]+)/)?.[1]?.trimEnd() || '';
    const incorrectFeedback = text.match(/\\-([^\\*:]+)/)?.[1]?.trimEnd() || '';
    return { answer: text.replace(/:[^\\*]+|\\[+-][^\\*:]+/g, '').trimEnd(), tip, correctFeedback, incorrectFeedback };
}
export function serializeDragTextWord(word) {
    return `*${word.answer}${word.tip ? ':' + word.tip : ''}${word.correctFeedback ? '\\+' + word.correctFeedback : ''}${word.incorrectFeedback ? '\\-' + word.incorrectFeedback : ''}*`;
}
