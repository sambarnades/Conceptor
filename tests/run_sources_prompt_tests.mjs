/**
 * run_sources_prompt_tests.mjs — Le document joint arrive-t-il à l'IA, et en ressort-il
 * une activité utilisable ? (Bug prod du 25-09-2026, « le # SOURCES n'est pas compris ».)
 *
 * Trois volets, sans navigateur :
 *  1. `h5p/controle-sortie-ia.js` — un « Glisser les mots » vidé de son sens déclenche le
 *     second essai de la génération en un clic. Fixtures = extraits de VRAIES sorties de
 *     `mistral-small-4-119b` recueillies pendant l'enquête (4 pannes, 5 sorties saines) :
 *     la règle doit attraper les unes sans jamais coûter un appel aux autres.
 *  2. `core/texte-affiche.js` — lecture d'une zone MASQUÉE : les lignes restent séparées
 *     (`innerText` les recollait bout à bout en mode Rapide).
 *  3. `llm-batch.js` — le document et le rappel final des SOURCES, dans les 12 langues :
 *     présents si un document est joint, absents sinon, absents pour une activité qui
 *     cadre elle-même ses sources (zones d'image) ; et en génération PAR LOTS, présents
 *     dans le prompt du PLAN (il en était privé) comme dans celui de chaque lot.
 *
 * Le parcours complet dans le DOM réel (dépôt, tuile, prompt ENVOYÉ) est couvert par
 * `tests/qa-manuel/j-sources-document.mjs` (Playwright, à la main).
 *
 * Lancement : node tests/run_sources_prompt_tests.mjs
 */
import { readFileSync } from 'node:fs';
import { defautsSortieIA, graviteSortieIA } from '../js/h5p/controle-sortie-ia.js';
import { texteAffiche } from '../js/core/texte-affiche.js';
import { assembleActivityPrompt, buildOutlinePrompt, buildFillPrompt } from '../js/services/llm-batch.js';

let pass = 0, fail = 0;
const failures = [];
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    if (a === b) pass++;
    else { fail++; failures.push(`❌ ${name}\n   attendu: ${b}\n   obtenu:  ${a}`); }
}
const glisser = textField => JSON.stringify({ taskDescription: 'Complète le texte.', textField });

// =======================================================================
// 1. Contrôle de la sortie IA — « Glisser les mots »
// =======================================================================
const PANNES = {
    // La capture d'origine (prod) : une consigne à la place de la réponse, 4 fois.
    'capture prod : consigne dans le trou': [String.raw`{"textField":"Quant à la mer, elle relève du registre *\\emph(choisis un registre parmi \\\\` + '`poésie\\\\`, \\\\`polémique\\\\`, \\\\`épique\\\\`, \\\\`réaliste\\\\`, \\\\`lyrique\\\\` )*' + String.raw`.\n"}`, ['réponse trop longue']],
    'capture prod, JSON illisible (\\e)': [String.raw`{"textField":"Quant à la mer, elle relève du registre *\emph(choisis un registre parmi ` + '`poésie`, `polémique`, `épique`, `réaliste`, `lyrique` )*' + String.raw`.\n"}`, ['réponse trop longue']],
    'réel A01 : la même réponse partout': [glisser('Si tu veux comprendre l’émotion que ressent un personnage dans un poème, cherche le *registre* présent. \nUn enfant en larmes après une chute aura pour effet d’éveiller ta compassion : c’est le *registre* qui domine. \nEn lisant les exploits d’un chevalier dans un texte médiéval, tu remarqueras sans doute le *registre* avec ses descriptions grandioses. \nEnfin, dans une comédie, l’auteur utilise souvent le *registre* pour provoquer le rire du public.\n'), ['même réponse dans plusieurs trous']],
    'réel B10 : trous « ___ »': [glisser('Le *registre tragique* montre un personnage *accablé* par une *___* contre laquelle il ne peut *___*.\n\nLe *registre pathétique* cherche à susciter la *___* par la description d’une *___* extrême.\n'), ['trou sans réponse', 'même réponse dans plusieurs trous']],
    'réel F09 : astérisque orphelin': [glisser('Le registre *suscite* une émotion comme la pitié : c’est le registre *.\n\nLe registre *met en scène* un héros en grandissant ses exploits : c’est le registre *.\n'), ['astérisque orphelin']],
};
for (const [nom, [contenu, attendu]] of Object.entries(PANNES)) eq(`panne — ${nom}`, defautsSortieIA('DragTheWords', contenu), attendu);

const SAINES = {
    'réel A03': 'Le *lyrique* exprime les émotions intimes du poète, souvent avec des phrases courtes et des *métaphores*.\nLe *tragique* montre un héros écrasé par une *fatalité* qu’il ne peut éviter, comme dans les pièces de Racine.\nLe *comique* utilise l’*exagération* ou les jeux de mots pour faire rire, comme chez Molière.\n',
    'réel B01': 'Le texte qui produit un effet de rire ou de sourire relève du registre *comique* : il utilise souvent le *quiproquo*, une situation où deux personnes *interprètent* différemment.\n\nLe registre *pathétique* cherche à éveiller la *compassion* du lecteur face à une *souffrance* extrême, comme dans une scène de *désespoir* où un personnage est *victime* d\'une injustice.\n',
    'réel B09': 'Un texte peut faire rire grâce au registre *comique*, qui joue souvent sur l\'*exagération* ou les *quiproquos*. \nQuand un personnage est écrasé par une force qu\'il ne contrôle pas, on parle de registre *tragique*. \nPour provoquer de la *compassion*, un auteur utilise le registre *pathétique*, comme dans une scène de *souffrance*. \n',
    'réel T01 (document fictif)': 'Le village de Trelzac se trouve au bord de la rivière *Aulne-Vive*.\nIl compte trois *moulins* à eau : Gaspard, Berthe et Ondine.\nLe moulin Ondine est le *plus ancien* des trois : il a été façonné en *1642*.\n',
    // Hors sujet vis-à-vis du document, mais la FORME est saine : ce n'est pas l'affaire
    // de ce contrôle (c'est celle du cadrage des SOURCES).
    'réel A91 (dérive, forme saine)': 'Dans *Œdipe roi*, Sophocle met en scène un personnage victime de sa *destinée*. Le registre ici est *tragique* car le héros ne peut échapper à son sort.\n',
    'indice et retours par mot': 'Le *système solaire:pense au Soleil* compte *huit\\+Exact\\-Recompte* planètes.\n',
    'deux fois le même mot (toléré)': 'Le *chat* dort. Le *chien* court. Un autre *chat* miaule.\n',
    'LaTeX \\neq, JSON lisible': 'On a *x* \\neq *y* ici.\nLigne *deux*.\n',
    'sans aucun mot à glisser': 'Rien à glisser.\n',
};
for (const [nom, textField] of Object.entries(SAINES)) eq(`saine — ${nom}`, defautsSortieIA('DragTheWords', glisser(textField)), []);
eq('saine — LaTeX \\neq, JSON illisible', defautsSortieIA('DragTheWords', String.raw`{"textField":"On a *x* \\neq *y* \( a \) ici.\nLigne *deux*."}`), []);
eq('saine — textField en liste', defautsSortieIA('DragTheWords', JSON.stringify({ textField: ['Le *chat* dort.', 'Le *chien* court.'] })), []);
eq('saine — enveloppe params', defautsSortieIA('DragTheWords', JSON.stringify({ params: { textField: 'Le *chat* dort.' } })), []);
eq('autre module : jamais contrôlé', defautsSortieIA('MarkTheWords', glisser('*a* *a* *a* *___*')), []);

// Gravité = nombre de trous touchés : c'est elle qui départage la sortie d'origine et
// celle du second essai. Cas réel (campagne du 25-09-2026) : 1er tirage « moud » ×3,
// 2e tirage « moulin » ×6 — UNE catégorie de défaut chacun ; compter les catégories
// gardait le second, pourtant pire. La gravité garde le premier.
const TIRAGE_1 = glisser('Le moulin Gaspard *moud* le *seigle*.\nLe moulin Berthe *moud* l’*orge*.\nLe moulin Ondine, plus *ancien*, *moud* le *sarrasin*.\n');
const TIRAGE_2 = glisser('Le *moulin* Gaspard transforme le *seigle*, tandis que le *moulin* Berthe broie *l\'orge*. *La* plus ancienne construction est le *moulin* Ondine.\n*La* date de *1642* correspond à la construction de *moulin* Ondine. Elle a abîmé le *moulin* Berthe.\n*Kerbrat* était le *meunier* qui travaillait dans *moulin* Ondine.\n');
eq('gravité — tirage 1 (moud ×3)', graviteSortieIA('DragTheWords', TIRAGE_1), 3);
eq('gravité — tirage 2 (moulin ×6)', graviteSortieIA('DragTheWords', TIRAGE_2), 6);
eq('gravité — la capture (3 consignes dans les trous) contre une sortie saine',
    [graviteSortieIA('DragTheWords', glisser('A *\\emph(choisis un registre parmi poésie, lyrique, épique )*.\nB *\\emph(choisis un registre parmi poésie, lyrique, épique )*.\nC *\\emph(choisis un registre parmi poésie, lyrique, épique )*.\n')),
     graviteSortieIA('DragTheWords', glisser('A *réaliste*.\nB *lyrique*.\nC *polémique*.\n'))], [6, 0]);
eq('gravité — sortie saine', graviteSortieIA('DragTheWords', glisser(SAINES['réel A03'])), 0);
eq('contenu vide ou nul', [defautsSortieIA('DragTheWords', ''), defautsSortieIA('DragTheWords', null)], [[], []]);

// 1 bis. Texte à trous, et exercices à trous d'un quiz : la réponse remplacée par un
// NOM DE VARIABLE (Texte à trous d'un parcours réel, 1er oct. 2026 — l'élève aurait dû
// taper 36, 21, 7,50, 3/20 et 12).
const trous = questions => JSON.stringify({ taskDescription: 'Complète.', questions });
const REEL_VARIABLES = trous([
    'Un magasin propose une réduction de 20% sur un article à 45 €. Le nouveau prix est de *prix_réduit* €.',
    'Dans une classe de 28 élèves, 75% ont réussi leur évaluation. Cela représente *nombre_élèves* élèves.',
    'Pour 3 kg de pommes, on paie 4,50 €. Pour 5 kg, le prix serait de *prix_5kg* € (calcule avec la proportionnalité).',
    'Un pourcentage de 15% correspond à la fraction *fraction_pourcentage* et au nombre décimal 0,15.',
    'Si 6 cahiers coûtent 7,20 €, alors 10 cahiers coûtent *prix_10cahiers* € (utilise le *coefficient*).',
]);
eq('trous — réel : réponses en nom de variable', defautsSortieIA('FillInTheBlanks', REEL_VARIABLES), ['réponse en nom de variable']);
eq('trous — réel : gravité = 5 trous touchés', graviteSortieIA('FillInTheBlanks', REEL_VARIABLES), 5);
eq('trous — sains : nombres, variantes, indice, heure', defautsSortieIA('FillInTheBlanks', trous([
    'Le nouveau prix est de *36* €.', 'Cela représente *21* élèves.', 'Pour 5 kg : *7,50/7.50* €.',
    'Un *triangle:pense aux côtés* a trois côtés.', 'Le train part à *10:30*.', 'La fraction est *3/20*.',
])), []);
eq('trous — trou vide et astérisque orphelin', defautsSortieIA('FillInTheBlanks', trous(['Le *___* dort.', 'Le chat *dort.'])),
    ['astérisque orphelin', 'trou sans réponse']);
eq('trous — réel : variantes qui se contredisent (toute réponse serait juste)', defautsSortieIA('FillInTheBlanks', trous([
    'Le prix est proportionnel à la masse : *situation de proportionnalité/ce n\'est pas une situation de proportionnalité*.',
    'L’âge et la taille : *oui/non*.', 'Cette affirmation est *vrai/faux*.',
])), ['réponses contradictoires']);
eq('trous — variantes équivalentes, et négations légitimes', defautsSortieIA('FillInTheBlanks', trous([
    'Il y a *36/trente-six* élèves.', 'Il *n\'est pas/n\'est point* venu.', 'Réponds : *non/no*.', 'Ce *n\'est pas* juste.',
])), []);
eq('glisser — nom de variable', defautsSortieIA('DragTheWords', glisser('Le *mot_cle* et le *coefficient*.')), ['réponse en nom de variable']);
const quiz = JSON.stringify({ title: 'Quiz', questions: [
    { library: 'H5P.MultiChoice 1.16', params: { question: 'Q ?', answers: [] } },
    { library: 'H5P.Blanks 1.14', params: { text: 'Complète.', questions: ['x = *valeur_x*'] } },
    { library: 'H5P.DragText 1.10', params: { taskDescription: 'Glisse.', textField: 'Le *coefficient* relie *a* et *b*.' } },
] });
eq('quiz — le trou d’un Texte à trous du quiz est vu', defautsSortieIA('QuizSet', quiz), ['réponse en nom de variable']);
eq('quiz — sain, et JSON illisible jamais jugé', [defautsSortieIA('QuizSetQCM', JSON.stringify({ questions: [
    { library: 'H5P.Blanks 1.14', params: { questions: ['x = *4*'] } }] })), defautsSortieIA('QuizSet', '{pas du json')], [[], []]);

// =======================================================================
// 2. texteAffiche — zone des sources MASQUÉE (mode Rapide)
// =======================================================================
const txt = s => ({ nodeType: 3, nodeName: '#text', nodeValue: s, childNodes: [] });
const el = (nodeName, ...childNodes) => ({ nodeType: 1, nodeName, childNodes, getClientRects: () => [] });
// Exactement ce qu'écrit ocr.js#updateRagArea : blocs <mark>, lignes en <br>.
const zone = el('DIV',
    el('MARK', txt('Ligne un du cours'), el('BR'), txt('Ligne deux du cours'), el('BR'), el('BR'), txt('Paragraphe trois')),
    el('BR'), el('BR'),
    el('MARK', txt('Second fichier')),
    el('BR'), el('BR'));
eq('masquée : les <br> restent des sauts de ligne', texteAffiche(zone).trim(), 'Ligne un du cours\nLigne deux du cours\n\nParagraphe trois\n\nSecond fichier');
// Saisie au clavier dans un contenteditable : Chrome enveloppe chaque ligne dans un <div>.
eq('masquée : blocs <div> de la saisie clavier', texteAffiche(el('DIV', txt('Note'), el('DIV', txt('ligne 2')), el('DIV', txt('ligne 3')))).trim(), 'Note\nligne 2\nligne 3');
eq('rendue : innerText fait foi', texteAffiche({ innerText: 'tel qu\'affiché', getClientRects: () => [{}] }), 'tel qu\'affiché');
eq('absente : chaîne vide', texteAffiche(null), '');

// =======================================================================
// 3. Rappel final des SOURCES (constructeur de la génération par lots)
// =======================================================================
const LANGUES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];
for (const lang of LANGUES) {
    const t = JSON.parse(readFileSync(new URL(`../js/locales/${lang}.json`, import.meta.url), 'utf8'));
    const rappel = t.prompt_sources_rappel_final;
    const params = { qui: 'Enseignant', quoi: 'Les moulins', niveau: '', nombreQuestions: '', isAdvanced: false };
    const avec = assembleActivityPrompt('prompt_drag_the_words', { ...params, ocrContent: 'Le moulin Ondine date de 1642.' }, t);
    const sans = assembleActivityPrompt('prompt_drag_the_words', { ...params, ocrContent: '' }, t);
    const zones = assembleActivityPrompt('prompt_image_hotspots', { ...params, ocrContent: 'Zone 1 — x=10% y=20% : pétale.' }, t);
    eq(`${lang} : rappel défini`, typeof rappel === 'string' && rappel.length > 40, true);
    eq(`${lang} : document joint → prompt clos par le rappel`, avec.endsWith(rappel), true);
    eq(`${lang} : document dans les SOURCES, [RAG] résolu`, avec.includes('Le moulin Ondine date de 1642.') && !avec.includes('[RAG]'), true);
    eq(`${lang} : sans document → ni SOURCES ni rappel`, sans.includes(rappel) || sans.includes('Ondine'), false);
    eq(`${lang} : zones d'image (cadrage propre) → pas de rappel`, zones.includes(rappel), false);

    // Génération PAR LOTS : le plan était conçu sans le document (prompt de plan privé
    // de SOURCES) ; plan ET lots doivent le porter.
    const lot = { prefix: 'prompt_quizset_qcm', t, path: 'questions', itemName: 'question' };
    const plan = buildOutlinePrompt({ ...lot, params: { ...params, ocrContent: 'Le moulin Ondine date de 1642.' }, count: 12, carcasse: ['title', 'overallFeedback'] });
    const planSans = buildOutlinePrompt({ ...lot, params: { ...params, ocrContent: '' }, count: 12, carcasse: ['title', 'overallFeedback'] });
    const remplissage = buildFillPrompt({ ...lot, params: { ...params, ocrContent: 'Le moulin Ondine date de 1642.' },
        plan: [{ n: 1, intitule: 'Date du moulin Ondine' }, { n: 2, intitule: 'Grain du moulin Ondine' }], slice: [{ n: 1, intitule: 'Date du moulin Ondine' }] });
    eq(`${lang} : plan par lots → document ET rappel`, plan.includes('Le moulin Ondine date de 1642.') && plan.endsWith(rappel), true);
    eq(`${lang} : plan par lots sans document → ni l'un ni l'autre`, planSans.includes(rappel) || planSans.includes('Ondine'), false);
    eq(`${lang} : lot → document ET rappel`, remplissage.includes('Le moulin Ondine date de 1642.') && remplissage.includes(rappel), true);
}

// =======================================================================
console.log(failures.join('\n'));
console.log(`\nSources du prompt : ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
