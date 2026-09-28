/** Empêche H5P.Blanks de remplacer un exercice incomplet par sa démonstration Oslo. */
export function validateBlanksContent(content, mainLibrary) {
    const check = (params, path) => {
        const questions = params?.questions;
        if (!Array.isArray(questions) || !questions.length ||
            questions.some(question => typeof question !== 'string') ||
            !questions.some(question => /\*[^*]*[^\s*][^*]*\*/.test(question))) {
            throw new Error(`Texte à trous incomplet (${path}) : renseignez les phrases et leurs réponses entre *astérisques* avant d’exporter.`);
        }
    };
    const walk = (value, path) => {
        if (!value || typeof value !== 'object') return;
        if (typeof value.library === 'string' && /^H5P\.Blanks(?:\s|$)/.test(value.library)) {
            check(value.params, path);
        }
        for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
    };
    if (/^H5P\.Blanks(?:\s|$)/.test(mainLibrary || '')) check(content, 'activité');
    walk(content, 'activité');
}
