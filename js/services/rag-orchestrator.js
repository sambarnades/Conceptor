/**
 * @file Orchestrateur du RAG « programmes scolaires » (collection 56).
 *
 * Problème résolu : le contexte {sujet, discipline, niveau} était envoyé au Worker n8n
 * dès qu'UN champ était rempli, déclenchant systématiquement la recherche RAG sur les
 * programmes officiels français — y compris quand elle n'a aucun sens :
 *   - thème original / jeu de rôle (« Qui : super-héros / Quoi : sauver la veuve et
 *     l'orphelin ») → aucun extrait de programme pertinent, le RAG injecte du bruit ;
 *   - public de l'enseignement supérieur ou de la formation d'adultes (université,
 *     licence, master, BUT, formateur…) → les programmes scolaires ne s'appliquent pas ;
 *   - corpus fourni en mode avancé → les sources de l'enseignant SONT la référence,
 *     les extraits de programme diluent l'ancrage sur le corpus.
 *
 * Principe : AUCUN bouton, AUCUNE question à l'utilisateur. La décision est déduite des
 * champs déjà saisis (qui / quoi / niveau) et de la présence d'un corpus :
 *
 *   1. Tout vide                               → pas de RAG (comportement historique) ;
 *   2. Corpus ≥ CORPUS_SKIP_THRESHOLD          → pas de RAG (les sources priment) ;
 *   3. Marqueur « hors scolaire » (supérieur,
 *      adultes…) dans niveau ou qui            → pas de RAG ;
 *   4. Ancrage scolaire détecté (niveau de
 *      classe, mot-métier enseignant…)         → RAG activé ;
 *   5. Aucun ancrage détectable                → pas de RAG (thème libre, persona
 *                                                 fictive…).
 *
 * La règle 4 est volontairement la SEULE porte d'entrée : le RAG programmes n'est utile
 * que si l'on peut cibler un niveau/public scolaire. Un thème fantaisie AVEC
 * « Enseignant de 3e » déclenche bien le RAG : l'enseignant a déclaré un niveau,
 * ancrer la difficulté sur le programme de 3e reste pertinent.
 *
 * Les lexiques couvrent les 11 langues de l'UI (« Grade 5 », « 7. Klasse »,
 * « 3º de la ESO », « 小学 »…) : un enseignant travaillant dans une autre langue
 * (section internationale, AEFE, UI non française) garde l'ancrage programme.
 *
 * Module volontairement SANS import (testable en Node : tests/run_rag_orchestrator_tests.mjs).
 * Le logger (debugLog) est injecté par l'appelant pour tracer la décision en ?debug.
 */

// En dessous de ce seuil (caractères), le contenu de la zone sources est considéré comme
// un reliquat (titre seul, OCR raté…) et ne désactive PAS le RAG programmes. Au-delà,
// l'enseignant a fourni un vrai corpus : c'est LUI la référence, pas le programme.
export const CORPUS_SKIP_THRESHOLD = 200;

/**
 * Normalise un texte pour le matching lexical : minuscules, accents supprimés,
 * espaces (y compris insécables) réduits.
 * @param {string} texte
 * @returns {string}
 */
function normaliser(texte) {
    return (texte || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

// ---------------------------------------------------------------------------
// Lexiques (appliqués sur texte normalisé : minuscules, sans accents latins)
//
// Couverture : les 11 langues de Caramel (fr, en, es, de, it, nl, pt, ar, zh,
// jp, el) + variantes francophones (Belgique, Suisse, Québec) + abréviations.
//
// Pièges regex à connaître avant de modifier :
//   - `\b` en JS ne fonctionne qu'autour de [A-Za-z0-9_] → pour l'arabe, le grec
//     et le CJK, on matche en SOUS-CHAÎNE (pas de \b, jamais).
//   - Les mots composés allemands/néerlandais collent les tokens
//     (« Grundschullehrerin ») → pas de \b OUVRANT sur ces tokens.
//   - Le grec est bien désaccentué par la normalisation NFD (ά→α), l'arabe non
//     (formes de hamza) → tokens arabes choisis pour éviter les lettres à
//     variantes (ex. « بتدائي » plutôt que « ابتدائي »).
// ---------------------------------------------------------------------------

// Marqueurs « hors programmes scolaires » — supérieur, formation d'adultes, monde
// de l'entreprise. Cherchés UNIQUEMENT dans `niveau` et `discipline` (champ
// « qui ») : ces champs décrivent le public. Le sujet (« quoi ») peut contenir ces
// mots pour d'autres raisons (« la borne supérieure », « le but du jeu »…).
// NB : « college » (anglais = supérieur) est volontairement ABSENT — après
// désaccentuation il est indiscernable de « collège » (positif) ; le sens français
// gagne, et le supérieur anglophone est attrapé par university/bachelor/PhD…
const HORS_SCOLAIRE = [
    // Français (+ Québec : cégep). « universit » couvre aussi university/universidad/
    // universität/universiteit/università/universidade.
    /\buniversit/, /\bfacs?\b/, /\bfaculte/, /\blicences?\b/, /\bmasters?\b/, /\bmastere/,
    /\bdoctorat/, /\bpost[- ]?bac/, /\bpost[- ]?doc/, /\bsuperieur/, /\bbac ?\+ ?\d/,
    /\bbts\b/, /\bbut\b/, /\bdut\b/, /\biut\b/, /\bcpge\b/, /\bprepas?\b(?![ -]?(metiers|pro))/,
    /\bpreparatoire/, /\bmpsi\b/, /\bpcsi\b/, /\bmp2i\b/, /\bkhagne/, /\bhypokhagne/,
    /\bingenieur/, /\bmedecine\b/, /\bpaces\b/, /\bl[123]\b/, /\bm[12]\b/, /\betudiant/,
    /\badultes?\b/, /\bformation continue\b/, /\bformateur/, /\bformatrice/, /\bgreta\b/,
    /\bcnam\b/, /\bafpa\b/, /\bentreprise/, /\bsalarie/, /\bdaeu\b/, /\bvae\b/,
    /\bandragogi/, /\bcegep\b/,
    // Anglais
    /\bundergrad/, /\bbachelor/, /\bphd\b/, /\bdoctorate/, /\bhigher education\b/,
    /\bfreshman\b/, /\bsophomore\b/, /\badult education\b/, /\bbusiness school\b/,
    // Espagnol / portugais / italien
    /\bfacultad/, /\bfaculdade/, /\bposgrado/, /\bdoctorado/, /\bdottorato/, /\blaurea\b/,
    /\blaureat[oa]/, /\bmestrado/, /\bdoutorado/, /\bdoutoramento/, /\bsuperior\b/,
    /\bformador/, /\bformatore/,
    // Allemand / néerlandais (pas de \b ouvrant : « Fachhochschule »)
    /hochschule/, /hogeschool/, /\bstudium\b/, /\bstudierende/, /\bstudenten\b/,
    /erwachsenenbildung/, /\bhbo\b/,
    // Grec (sous-chaîne)
    /πανεπιστημι/, /φοιτητ/, /μεταπτυχιακ/, /διδακτορικ/, /ενηλικ/,
    // Arabe (sous-chaîne)
    /جامعة/, /جامعي/, /دكتوراه/, /ماجستير/,
    // Chinois / japonais (sous-chaîne ; 大學 = variante traditionnelle)
    /大学/, /大學/, /高等教育/, /研究生/, /硕士/, /博士/, /成人教育/, /大学院/, /修士/,
    /専門学校/, /短大/, /社会人/,
];

// Ancrages scolaires cherchés dans `niveau` et `discipline` : niveaux de classe,
// cycles, diplômes, filières, dispositifs. Tokens courts (cp, ce1, gs, eso, havo…)
// autorisés ici car ces champs sont courts et descriptifs.
const ANCRAGE_NIVEAU = [
    // Français — niveaux, cycles, diplômes, filières, dispositifs
    /\bmaternelle/, /\b[pmg]s\b/, /\bcp\b/, /\bce[12]\b/, /\bcm[12]\b/, /\belementaire/,
    /\bprimaire/, /\becoles?\b/, /\bcolleges?\b/, /\bcollegien/, /\blycees?\b/, /\blyceen/,
    /\bcycle ?[1-4]\b/, /\b[1-6](e|eme|ere|re|nde|de)s?\b/, /\bsixieme/, /\bcinquieme/,
    /\bquatrieme/, /\btroisieme/, /\bseconde/, /\bpremiere/, /\bterminale/, /\btle\b/,
    /\bterm\b/, /\bbacs?\b/, /\bbaccalaureat/, /\bcap\b/, /\bbep\b/, /\bsegpa\b/,
    /\bulis\b/, /\bupe2a\b/, /\berea\b/, /\bbrevet\b/, /\bdnb\b/, /\beleves?\b/,
    /\bpremier degre\b/, /\bsecond degre\b/, /\bstmg\b/, /\bsti2d\b/, /\bst2s\b/,
    /\bstav\b/, /\bprepas?[ -]?(metiers|pro)/,
    // Variantes francophones : Belgique (secondaire, athénée, rhéto, humanités),
    // Suisse (gymnase = lycée), Québec (« secondaire 3 » couvert par secondaire)
    /\bsecondaire/, /\bathenee/, /\brhetos?\b/, /\bhumanites\b/, /\bgymnase\b/,
    // Anglais
    /\bgrades? ?([1-9]|1[0-3])\b/, /\b([1-9]|1[0-3])(st|nd|rd|th)[ -]grade/,
    /\byear ?([1-9]|1[0-3])\b/, /\bkey stage ?[1-5]\b/, /\bks[1-5]\b/, /\bkindergarten/,
    /\bpreschool/, /\bprimary school/, /\belementary/, /\bmiddle school/, /\bhigh school/,
    /\bsecondary school/, /\bpupils?\b/,
    // Espagnol
    /\bprimaria/, /\bsecundaria/, /\bbachillerato/, /\binfantil\b/, /\bcolegio/,
    /\binstituto/, /\beso\b/, /\balumn[oa]s?\b/,
    // Italien
    /\bscuola/, /\bliceo/, /\belementare/, /\bmedie\b/, /\bsuperiori\b/, /\bmaturita/,
    /\bmatura\b/,
    // Allemand (pas de \b ouvrant : « Gesamtschulklasse », « Mitschüler »…)
    /grundschule/, /gymnasium/, /realschule/, /hauptschule/, /gesamtschule/,
    /sekundarstufe/, /klasse\b/, /\babitur/, /schuler\b/, /\bschule\b/, /\bkita\b/,
    /oberstufe/,
    // Néerlandais (idem mots composés)
    /basisschool/, /\bmiddelbare/, /\bvoortgezet/, /\bvmbo\b/, /\bhavo\b/, /\bvwo\b/,
    /\bgroep ?[1-8]\b/, /leerling/, /\bbrugklas/,
    // Portugais
    /\bensino (fundamental|medio|basico|secundario)/, /\b[1-9]?[0-9]º? ?ano\b/,
    /\bescola/, /\balun[oa]s?\b/,
    // Grec (sous-chaîne)
    /δημοτικ/, /γυμνασι/, /λυκει/, /νηπιαγωγει/, /μαθητ/, /ταξη/,
    // Arabe (sous-chaîne)
    /بتدائي/, /عدادي/, /ثانوي/, /متوسط/, /روضة/, /تلميذ/, /تلاميذ/, /الصف/, /مدرسة/,
    // Chinois / japonais (sous-chaîne ; 小學/中學 = variantes traditionnelles)
    /小学/, /小學/, /中学/, /中學/, /初中/, /高中/, /年级/, /幼儿园/, /小学校/, /中学校/,
    /高校/, /高等学校/, /年生/, /生徒/, /児童/, /幼稚園/,
];

// Ancrages cherchés dans le sujet (« quoi ») : uniquement les marqueurs NON ambigus
// (pas d'ordinaux courts type « 4e » — « l'art au 4e siècle » n'est pas un niveau ;
// pas de « ثانوي » — « أمر ثانوي » = « une chose secondaire »).
const ANCRAGE_SUJET = [
    /\bmaternelle/, /\bprimaire\b/, /\belementaire\b/, /\bcolleges?\b/, /\blycees?\b/,
    /\bcycle ?[1-4]\b/, /\bsixieme/, /\bcinquieme/, /\bquatrieme/, /\btroisieme/,
    /\bterminales?\b/, /\bsegpa\b/, /\bulis\b/, /\bce[12]\b/, /\bcm[12]\b/, /\bdnb\b/,
    /\bbaccalaureat/, /\bbrevet des colleges\b/,
    // Multilingue — marqueurs longs, non ambigus
    /\bgrades? ?([1-9]|1[0-3])\b/, /\bkindergarten/, /\bprimary school/, /\bmiddle school/,
    /\bhigh school/, /\bbachillerato/, /grundschule/, /\bgymnasium\b/, /\babitur/,
    /basisschool/, /\bensino (fundamental|medio|basico|secundario)/,
    /δημοτικ/, /γυμνασι/, /λυκει/, /بتدائي/,
    /小学校/, /中学校/, /高等学校/, /幼稚園/, /小学/, /初中/, /高中/, /幼儿园/,
];

// Mots-métiers de l'enseignement scolaire cherchés dans `discipline` (champ
// « qui »). « professeur à l'université » / « university professor » sont
// interceptés AVANT par HORS_SCOLAIRE (priorité au négatif).
const ANCRAGE_METIER = [
    // Français
    /\benseignant/, /\bprofesseur/, /\bprofs?\b/, /\binstit/, /\bpe\b/, /\bplp\b/,
    /\bplc\b/, /\bpes\b/, /\bcrpe\b/, /\bcpe\b/, /\baesh\b/, /\bdocumentaliste\b/,
    // Anglais (sous-chaîne : « schoolteacher »)
    /teacher/,
    // Espagnol / italien / portugais (« professor » couvre professor(a)/professore(ssa))
    /\bmaestr[oa]s?\b/, /\bprofesor/, /\bprofessor/, /\binsegnante/, /\bdocent/,
    // Allemand / néerlandais (pas de \b ouvrant : « Grundschullehrerin »)
    /lehrer/, /erzieher/, /leraar/, /lerares/, /leerkracht/, /\bjuf\b/,
    // Grec (sous-chaîne)
    /δασκαλ/, /καθηγητ/, /εκπαιδευτικ/,
    // Arabe (sous-chaîne)
    /معلم/, /مدرس/,
    // Chinois / japonais (sous-chaîne)
    /老师/, /教师/, /班主任/, /先生/, /教員/, /教諭/,
];

function matchUn(lexique, texte) {
    return lexique.some((re) => re.test(texte));
}

// ---------------------------------------------------------------------------
// Détection du CYCLE scolaire français équivalent.
//
// Le Worker n8n filtre les chunks de la collection 56 par métadonnée `cycle`
// (valeurs : cycle-2, cycle-3, cycle-4, lycee-gt — cycle-1 réservé pour le jour
// où la maternelle entrera dans la collection) et N'INJECTE RIEN sans cycle.
// C'est donc ICI, où vivent les lexiques 11 langues, qu'on traduit un niveau
// étranger en cycle FR équivalent (par âge : Grade 5 ≈ CM2 → cycle-3, 7. Klasse
// ≈ 5e → cycle-4…). Le cycle est envoyé dans `rag.cycle` ; le Worker l'utilise
// en priorité et garde sa détection FR historique en fallback (anciens clients).
//
// Principe conservateur (« mieux vaut 0 extrait que du hors-niveau ») : un
// marqueur trop large pour choisir un cycle (« collège », « primaire »,
// « Gymnasium » sans classe, « ابتدائي » sans année…) renvoie '' — le contexte
// part quand même, mais le Worker ne lancera pas la recherche.
// ---------------------------------------------------------------------------

/** Grade « à l'américaine » (1 = ~6 ans) → cycle FR équivalent. */
function gradeVersCycle(n) {
    if (n >= 1 && n <= 3) return 'cycle-2';
    if (n >= 4 && n <= 6) return 'cycle-3';
    if (n >= 7 && n <= 9) return 'cycle-4';
    if (n >= 10 && n <= 13) return 'lycee-gt';
    return '';
}

const CHIFFRES_CJK = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };

/**
 * Détecte le cycle scolaire français (ou équivalent étranger) à partir des champs
 * saisis. Renvoie '' si aucun niveau assez précis n'est identifiable.
 *
 * @param {Object} o
 * @param {string} [o.sujet] - Champ « quoi ».
 * @param {string} [o.discipline] - Champ « qui ».
 * @param {string} [o.niveau] - Champ « niveau ».
 * @returns {''|'cycle-1'|'cycle-2'|'cycle-3'|'cycle-4'|'lycee-gt'}
 */
export function detectCycle({ sujet = '', discipline = '', niveau = '' } = {}) {
    // `strict` = champs qui décrivent le public (tokens courts autorisés) ;
    // `tout` ajoute le sujet (mots longs non ambigus uniquement).
    const strict = `${normaliser(niveau)} ${normaliser(discipline)}`;
    const tout = `${strict} ${normaliser(sujet)}`;
    let m;

    // 1. Cycle explicite
    m = tout.match(/\bcycle ?([1-4])\b/);
    if (m) return `cycle-${m[1]}`;

    // 2. Belgique / Québec — AVANT les ordinaux français génériques :
    //    « 5e primaire » (BE) = CM2, pas 5e de collège.
    m = strict.match(/\b([1-6])(?:e|eme|ere|re)? ?primaire/);
    if (m) return +m[1] <= 3 ? 'cycle-2' : 'cycle-3';
    m = strict.match(/\b([1-6])(?:e|eme|ere|re)? ?secondaire/) || strict.match(/secondaire ?([1-6])\b/);
    if (m) return +m[1] <= 3 ? 'cycle-4' : 'lycee-gt';

    // 3. Niveaux français précis (ordinaux courts : champs public uniquement)
    if (/\bmaternelle/.test(tout) || /\b[pmg]s\b/.test(strict)
        || /\b(petite|moyenne|grande) section/.test(strict)) return 'cycle-1';
    if (/\b(cp|ce1|ce2)\b/.test(strict)) return 'cycle-2';
    if (/\b(cm1|cm2)\b/.test(strict) || /\b6(e|eme)s?\b/.test(strict) || /\bsixieme/.test(tout)) return 'cycle-3';
    if (/\b[3-5](e|eme)s?\b/.test(strict) || /\b(cinquieme|quatrieme|troisieme)/.test(tout)) return 'cycle-4';
    if (/\b(lycees?|lyceen\w*|2nde?|2de|seconde|1ere|1re|premiere|terminales?|tle|term|baccalaureat|stmg|sti2d|st2s|stav|gymnase|rhetos?|humanites)\b/.test(strict)
        || /\b(lycees?|terminales?)\b/.test(tout)) return 'lycee-gt';

    // 4. Anglais (Year N UK ≈ Grade N-1 US ; Key Stage 1-5)
    m = strict.match(/\bgrades? ?([1-9]|1[0-3])\b/) || strict.match(/\b([1-9]|1[0-3])(?:st|nd|rd|th)[ -]grade/);
    if (m) return gradeVersCycle(+m[1]);
    m = strict.match(/\byear ?([1-9]|1[0-3])\b/);
    if (m) return gradeVersCycle(+m[1] - 1);
    m = strict.match(/\bkey stage ?([1-5])\b/) || strict.match(/\bks([1-5])\b/);
    if (m) return ['cycle-2', 'cycle-3', 'cycle-4', 'lycee-gt', 'lycee-gt'][+m[1] - 1];
    if (/\bkindergarten|\bpreschool/.test(strict)) return 'cycle-1';
    if (/\bmiddle school/.test(tout)) return 'cycle-4';
    if (/\bhigh school|\bsixth form/.test(tout)) return 'lycee-gt';

    // 5. Allemand
    m = strict.match(/\b([1-9]|1[0-3])\. ?klasse\b/) || strict.match(/\bklasse ?([1-9]|1[0-3])\b/);
    if (m) return gradeVersCycle(+m[1]);
    if (/oberstufe|abitur/.test(strict)) return 'lycee-gt';
    if (/\bkita\b/.test(strict)) return 'cycle-1';

    // 6. Espagnol
    m = strict.match(/\b([1-6])(?:º|o)? ?(?:de )?(?:la )?primaria/);
    if (m) return +m[1] <= 3 ? 'cycle-2' : 'cycle-3';
    if (/\beso\b/.test(strict)) return 'cycle-4';
    if (/\bbachillerato/.test(tout)) return 'lycee-gt';
    if (/\binfantil\b/.test(strict)) return 'cycle-1';

    // 7. Italien
    if (/\bscuola media|\bmedie\b/.test(strict)) return 'cycle-4';
    if (/\bliceo|\bsuperiori\b|\bmaturita/.test(tout)) return 'lycee-gt';

    // 8. Néerlandais (groep 1-2 = maternelle, 3-8 = primaire)
    m = strict.match(/\bgroep ?([1-8])\b/);
    if (m) { const n = +m[1]; return n <= 2 ? 'cycle-1' : (n <= 5 ? 'cycle-2' : 'cycle-3'); }

    // 9. Portugais (1º-12º ano ≈ grades 1-12)
    m = strict.match(/\b([1-9]|1[0-2])(?:º|o)? ?ano\b/);
    if (m) return gradeVersCycle(+m[1]);
    if (/\bensino (medio|secundario)/.test(tout)) return 'lycee-gt';

    // 10. Grec
    if (/νηπιαγωγει/.test(strict)) return 'cycle-1';
    if (/γυμνασι/.test(tout)) return 'cycle-4';
    if (/λυκει/.test(tout)) return 'lycee-gt';

    // 11. Arabe (stades non numérotés : روضة / متوسط-إعدادي / ثانوي)
    if (/روضة/.test(strict)) return 'cycle-1';
    if (/متوسط|عدادي/.test(strict)) return 'cycle-4';
    if (/ثانوي/.test(strict)) return 'lycee-gt';

    // 12. Chinois / japonais
    if (/幼儿园|幼稚園/.test(strict)) return 'cycle-1';
    if (/初中|中学校|中學/.test(tout)) return 'cycle-4';
    if (/高中|高校|高等学校/.test(tout)) return 'lycee-gt';
    m = strict.match(/([1-9一二三四五六七八九])年[级生]/);
    if (m) {
        const n = CHIFFRES_CJK[m[1]] || +m[1];
        if (/小学/.test(strict)) return n <= 3 ? 'cycle-2' : 'cycle-3';
        return gradeVersCycle(n);
    }

    return '';
}

/**
 * Cœur de décision, pur et testable : faut-il envoyer le contexte RAG programmes
 * scolaires au Worker n8n pour cette génération ?
 *
 * @param {Object} o
 * @param {string} [o.sujet] - Champ « quoi » (sujet pédagogique).
 * @param {string} [o.discipline] - Champ « qui » (rôle/discipline de l'enseignant).
 * @param {string} [o.niveau] - Champ « niveau ».
 * @param {number} [o.corpusLength] - Longueur (caractères) du corpus/sources fourni.
 * @returns {{send: boolean, reason: string}} reason ∈ {contexte-vide, corpus-fourni,
 *          hors-scolaire, ancrage-scolaire, aucun-ancrage-scolaire}
 */
export function evaluateRagRelevance({ sujet = '', discipline = '', niveau = '', corpusLength = 0 } = {}) {
    const nSujet = normaliser(sujet);
    const nDiscipline = normaliser(discipline);
    const nNiveau = normaliser(niveau);

    if (!nSujet && !nDiscipline && !nNiveau) {
        return { send: false, reason: 'contexte-vide' };
    }
    if (corpusLength >= CORPUS_SKIP_THRESHOLD) {
        return { send: false, reason: 'corpus-fourni' };
    }
    const publicDecrit = `${nNiveau} ${nDiscipline}`;
    if (matchUn(HORS_SCOLAIRE, publicDecrit)) {
        return { send: false, reason: 'hors-scolaire' };
    }
    if (matchUn(ANCRAGE_NIVEAU, publicDecrit)
        || matchUn(ANCRAGE_METIER, nDiscipline)
        || matchUn(ANCRAGE_SUJET, nSujet)) {
        return { send: true, reason: 'ancrage-scolaire' };
    }
    return { send: false, reason: 'aucun-ancrage-scolaire' };
}

/**
 * Lit les champs qui/quoi/niveau et la zone sources dans le DOM, applique
 * `evaluateRagRelevance` + `detectCycle`, et renvoie la décision complète :
 *   - `context` : l'objet {sujet, discipline, niveau, cycle} à envoyer dans
 *     `rag` au Worker — ou null si le RAG programmes doit être ignoré ;
 *   - `reason`  : l'issue de la décision — usage LOCAL uniquement (log ?debug),
 *     jamais transmise au serveur ni persistée où que ce soit ;
 *   - `cycle`   : le cycle détecté ('' si niveau non mappable — le Worker ne
 *     lancera alors pas la recherche ILaaS).
 *
 * @param {function} [debug] - Logger optionnel signature debugLog(module, ...args).
 * @returns {{context: ({sujet: string, discipline: string, niveau: string, cycle: string}|null), reason: string, cycle: string}}
 */
export function decideRagContextFromDom(debug = null) {
    const sujet = document.getElementById('quoi')?.value?.trim() || '';
    const discipline = document.getElementById('qui')?.value?.trim() || '';
    const niveau = document.getElementById('niveau')?.value?.trim() || '';
    const corpusLength = (document.getElementById('ocr-output')?.innerText?.trim() || '').length;

    const { send, reason } = evaluateRagRelevance({ sujet, discipline, niveau, corpusLength });
    const cycle = send ? detectCycle({ sujet, discipline, niveau }) : '';
    if (debug) debug('rag', `Orchestrateur RAG programmes : ${send ? 'ACTIVÉ' : 'ignoré'} (${reason}${send ? `, cycle : ${cycle || 'aucun'}` : ''})`, { sujet, discipline, niveau, corpusLength });

    return { context: send ? { sujet, discipline, niveau, cycle } : null, reason, cycle };
}
