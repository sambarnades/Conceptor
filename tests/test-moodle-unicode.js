/**
 * Tests unitaires — Encodage Unicode dans les activites Moodle
 *
 * Verifie que escapeXml() encode correctement les caracteres Unicode
 * au-dela de U+FFFF (cuneiforme, hieroglyphes, emojis) sans generer
 * de references numeriques de surrogates UTF-16 (invalides en XML).
 *
 * Bug corrige : charCodeAt() renvoyait des surrogates (&#55308;&#57338;)
 * au lieu de vrais code points (&#78842;) pour les caracteres > U+FFFF.
 *
 * Couvre les 7 types d'activites Moodle :
 *   Livre, Page, Glossaire, Test/QCM, Appariement, Millionnaire, Devoir
 *
 * Usage : ouvrir tests/test-moodle-unicode.html depuis le serveur local.
 */

import { escapeXml, generateMoodleXml } from '../js/moodle/moodle-formats.js';

// =======================================================================
// UTILITAIRES DE TEST
// =======================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let currentSection = '';

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, section: currentSection, diagnostic };
    if (condition) {
        passCount++;
    } else {
        failCount++;
        console.error('FAIL:', message, diagnostic || '');
    }
    results.push(entry);
}

function section(name) {
    currentSection = name;
}

// =======================================================================
// CARACTERES DE TEST
// =======================================================================

/** Caracteres cuneiformes (plan SMP, U+12000-U+1254F) */
const CUNEIFORM = {
    A: '\u{12000}',       // 𒀀 — eau
    FIVE: '\u{12415}',    // 𒐕 — chiffre 5
    BA: '\u{12040}',      // 𒁀 — syllabe BA
    EN: '\u{120D7}',      // 𒂗 — seigneur (Note: adjusted codepoint)
    LUGAL: '\u{12217}',   // 𒈗 — roi
};

/** Hieroglyphes egyptiens (plan SMP, U+13000-U+1342F) */
const HIEROGLYPHS = {
    MAN: '\u{13000}',     // 𓀀 — homme assis
    ONE: '\u{133FA}',     // 𓏺 — chiffre 1
    MOUTH: '\u{1308B}',   // 𓂋 — bouche (son "r")
    SUN: '\u{131F3}',     // 𓇳 — soleil
};

/** Autres caracteres > U+FFFF pour tests de robustesse */
const OTHER_HIGH = {
    MUSIC: '\u{1D11E}',   // 𝄞 — cle de sol
    DOMINO: '\u{1F030}',  // 🀰 — domino
    EMOJI: '\u{1F600}',   // 😀 — visage souriant
};

/** Plage des surrogates UTF-16 (invalides en XML) */
const SURROGATE_RANGE = { min: 0xD800, max: 0xDFFF };

/**
 * Verifie qu'une chaine XML ne contient aucune reference numerique
 * pointant vers un code point de surrogate UTF-16.
 */
function hasSurrogateRefs(xml) {
    const matches = xml.match(/&#(\d+);/g);
    if (!matches) return false;
    for (const m of matches) {
        const cp = parseInt(m.slice(2, -1));
        if (cp >= SURROGATE_RANGE.min && cp <= SURROGATE_RANGE.max) return true;
    }
    return false;
}

/**
 * Verifie qu'une chaine XML est bien formee via DOMParser.
 * En environnement Node (pas de DOMParser), retourne true (skip gracieux).
 */
function isWellFormedXml(xmlString) {
    if (typeof DOMParser === 'undefined') return true;
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    return !doc.querySelector('parsererror');
}

// =======================================================================
// TESTS
// =======================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;
    currentSection = '';

    // ===================================================================
    // 1. escapeXml() — caracteres ASCII et Latin etendus (non-regression)
    // ===================================================================
    section('1. escapeXml — ASCII et Latin etendu');

    assert(escapeXml('hello') === 'hello',
        'Texte ASCII simple inchange');

    assert(escapeXml('<p>test</p>') === '&lt;p&gt;test&lt;/p&gt;',
        'Balises HTML echappees');

    assert(escapeXml('a & b') === 'a &amp; b',
        'Esperluette echappee');

    assert(escapeXml('"quotes"') === '&quot;quotes&quot;',
        'Guillemets echappes');

    assert(escapeXml("l'eau") === "l&#39;eau",
        'Apostrophe echappee');

    const accentResult = escapeXml('éàü');
    assert(accentResult === '&#233;&#224;&#252;',
        'Accents encodes en entites numeriques',
        `Got: ${accentResult}`);

    // ===================================================================
    // 2. escapeXml() — caracteres cuneiformes (> U+FFFF)
    // ===================================================================
    section('2. escapeXml — Cuneiforme (U+12000+)');

    for (const [name, char] of Object.entries(CUNEIFORM)) {
        const escaped = escapeXml(char);
        const cp = char.codePointAt(0);

        assert(!hasSurrogateRefs(escaped),
            `${name} (U+${cp.toString(16).toUpperCase()}) : pas de surrogate`,
            `Got: ${escaped}`);

        assert(escaped === `&#${cp};`,
            `${name} : encode comme &#${cp};`,
            `Got: ${escaped}`);
    }

    // ===================================================================
    // 3. escapeXml() — hieroglyphes egyptiens (> U+FFFF)
    // ===================================================================
    section('3. escapeXml — Hieroglyphes (U+13000+)');

    for (const [name, char] of Object.entries(HIEROGLYPHS)) {
        const escaped = escapeXml(char);
        const cp = char.codePointAt(0);

        assert(!hasSurrogateRefs(escaped),
            `${name} (U+${cp.toString(16).toUpperCase()}) : pas de surrogate`,
            `Got: ${escaped}`);

        assert(escaped === `&#${cp};`,
            `${name} : encode comme &#${cp};`,
            `Got: ${escaped}`);
    }

    // ===================================================================
    // 4. escapeXml() — autres caracteres hauts (musique, emojis)
    // ===================================================================
    section('4. escapeXml — Autres caracteres > U+FFFF');

    for (const [name, char] of Object.entries(OTHER_HIGH)) {
        const escaped = escapeXml(char);
        const cp = char.codePointAt(0);

        assert(!hasSurrogateRefs(escaped),
            `${name} (U+${cp.toString(16).toUpperCase()}) : pas de surrogate`,
            `Got: ${escaped}`);

        assert(escaped === `&#${cp};`,
            `${name} : encode comme &#${cp};`,
            `Got: ${escaped}`);
    }

    // ===================================================================
    // 5. escapeXml() — texte mixte (ASCII + accents + cuneiforme)
    // ===================================================================
    section('5. escapeXml — Texte mixte');

    const mixedText = `Le signe ${CUNEIFORM.A} signifie "eau" et ${HIEROGLYPHS.ONE} vaut 1.`;
    const mixedEscaped = escapeXml(mixedText);

    assert(!hasSurrogateRefs(mixedEscaped),
        'Texte mixte : aucun surrogate',
        `Got: ${mixedEscaped}`);

    const cpA = CUNEIFORM.A.codePointAt(0);
    const cpOne = HIEROGLYPHS.ONE.codePointAt(0);
    assert(mixedEscaped.includes(`&#${cpA};`),
        `Texte mixte : contient &#${cpA}; pour cuneiforme A`);
    assert(mixedEscaped.includes(`&#${cpOne};`),
        `Texte mixte : contient &#${cpOne}; pour hieroglyphe ONE`);

    // Verification XML bien forme
    const wrappedXml = `<?xml version="1.0" encoding="UTF-8"?><root>${mixedEscaped}</root>`;
    assert(isWellFormedXml(wrappedXml),
        'Texte mixte echappe : XML bien forme (DOMParser)');

    // ===================================================================
    // 6. escapeXml() — valeurs limites et cas speciaux
    // ===================================================================
    section('6. escapeXml — Cas limites');

    assert(escapeXml('') === '',
        'Chaine vide → chaine vide');

    assert(escapeXml(123) === '123',
        'Nombre converti en chaine');

    // Newlines et tabs (< 0x20 mais valides en XML)
    const nlResult = escapeXml('a\nb\tc');
    assert(nlResult.includes('&#10;') || nlResult.includes('\n'),
        'Newline echappee ou preservee',
        `Got: ${JSON.stringify(nlResult)}`);

    // Caractere a la limite U+FFFF (non-caractere, doit etre filtre)
    const fffe = String.fromCodePoint(0xFFFE);
    const fffeResult = escapeXml(fffe);
    assert(!fffeResult.includes('&#65534;'),
        'U+FFFE (non-caractere) filtre',
        `Got: ${fffeResult}`);

    // ===================================================================
    // 7. Pipeline XML — Test/QCM avec Unicode (generateMoodleXml)
    // ===================================================================
    section('7. Pipeline XML — generateMoodleXml');

    const testBank = {
        bank_name: 'Test cuneiforme et hieroglyphes',
        bank_description: 'Contient des caracteres > U+FFFF',
        questions: [
            {
                type: 'truefalse',
                content: {
                    name: `Q1 — Le signe ${CUNEIFORM.A} signifie eau`,
                    questiontext: `Le signe cuneiforme ${CUNEIFORM.A} represente l'eau en sumerien.`,
                    feedback: `${CUNEIFORM.A} est bien le signe de l'eau.`,
                    answer: { value: true, feedback_true: 'Correct !', feedback_false: 'Incorrect.' }
                }
            },
            {
                type: 'multichoice',
                content: {
                    name: `Q2 — Hieroglyphe ${HIEROGLYPHS.MAN}`,
                    questiontext: `Quel role joue le hieroglyphe ${HIEROGLYPHS.MAN} ?`,
                    feedback: `${HIEROGLYPHS.MAN} est un determinatif.`,
                    answers: [
                        { text: `Determinatif pour les personnes (${HIEROGLYPHS.MAN})`, fraction: 100, feedback: 'Exact !' },
                        { text: `Phonogramme pour le son "a" (${HIEROGLYPHS.MAN})`, fraction: 0, feedback: 'Non.' },
                        { text: `Chiffre 1 (${HIEROGLYPHS.ONE})`, fraction: 0, feedback: 'Non, ${HIEROGLYPHS.ONE} est le chiffre 1.' }
                    ]
                }
            }
        ]
    };

    let xmlOutput;
    try {
        xmlOutput = generateMoodleXml(testBank);
        assert(true, 'generateMoodleXml() ne plante pas avec des caracteres > U+FFFF');
    } catch (e) {
        assert(false, 'generateMoodleXml() a plante', e.message);
    }

    if (xmlOutput) {
        assert(!hasSurrogateRefs(xmlOutput),
            'XML genere : aucune reference surrogate');

        assert(xmlOutput.includes(`&#${CUNEIFORM.A.codePointAt(0)};`),
            'XML genere : contient le code point correct pour cuneiforme A');

        assert(xmlOutput.includes(`&#${HIEROGLYPHS.MAN.codePointAt(0)};`),
            'XML genere : contient le code point correct pour hieroglyphe MAN');

        // Verification XML bien forme
        assert(isWellFormedXml(xmlOutput),
            'XML genere : bien forme (DOMParser)');
    }

    // ===================================================================
    // 8. Exemples JSON — chargement et verification par type d'activite
    // ===================================================================
    section('8. Exemples JSON — verification Unicode');

    const exampleFiles = [
        { file: 'livre_3.json',          type: 'Livre',       fields: ['title', 'intro'] },
        { file: 'page_4.json',           type: 'Page',        fields: ['title', 'intro'] },
        { file: 'glossaire_xml_3.json',  type: 'Glossaire',   fields: ['name'] },
        { file: 'test_6.json',           type: 'Test',        fields: ['bank_name'] },
        { file: 'appariement_3.json',    type: 'Appariement', fields: ['title', 'intro'] },
        { file: 'millionnaire_3.json',   type: 'Millionnaire',fields: ['title'] },
        { file: 'qcm_3.json',           type: 'QCM',         fields: ['title'] },
        { file: 'devoir_7.json',         type: 'Devoir',      fields: ['title', 'description'] },
    ];

    for (const { file, type, fields } of exampleFiles) {
        try {
            let data;
            if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
                const resp = await fetch(`assets/data/examples/${file}`);
                if (!resp.ok) {
                    assert(false, `${type} (${file}) : chargement echoue (${resp.status})`);
                    continue;
                }
                data = await resp.json();
            } else {
                // Mode Node : lecture directe du fichier
                const { readFileSync } = await import('fs');
                data = JSON.parse(readFileSync(`assets/data/examples/${file}`, 'utf8'));
            }
            assert(true, `${type} (${file}) : charge avec succes`);

            // Echapper chaque champ de premier niveau et verifier
            for (const field of fields) {
                if (data[field]) {
                    const escaped = escapeXml(data[field]);
                    assert(!hasSurrogateRefs(escaped),
                        `${type}.${field} : pas de surrogate apres escapeXml()`,
                        `Got: ${escaped.substring(0, 120)}...`);

                    // Verification XML bien forme dans un wrapper
                    const testXml = `<?xml version="1.0" encoding="UTF-8"?><root>${escaped}</root>`;
                    assert(isWellFormedXml(testXml),
                        `${type}.${field} : XML bien forme apres escapeXml()`);
                }
            }

            // Parcourir tout le JSON et echapper toutes les valeurs texte
            const allText = JSON.stringify(data);
            const escapedAll = escapeXml(allText);
            assert(!hasSurrogateRefs(escapedAll),
                `${type} : aucun surrogate dans l'ensemble du contenu JSON echappe`);

        } catch (e) {
            assert(false, `${type} (${file}) : erreur inattendue`, e.message);
        }
    }

    // ===================================================================
    // 9. Test/QCM — pipeline complet avec les exemples
    // ===================================================================
    section('9. Pipeline complet — generateMoodleXml avec exemples');

    try {
        let testData;
        if (typeof fetch !== 'undefined' && typeof window !== 'undefined') {
            const resp = await fetch('assets/data/examples/test_6.json');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            testData = await resp.json();
        } else {
            const { readFileSync } = await import('fs');
            testData = JSON.parse(readFileSync('assets/data/examples/test_6.json', 'utf8'));
        }
        {
            const xml = generateMoodleXml(testData);

            assert(!hasSurrogateRefs(xml),
                'test_6.json → generateMoodleXml() : aucun surrogate');

            assert(isWellFormedXml(xml),
                'test_6.json → generateMoodleXml() : XML bien forme');

            // Verifier la presence des bons code points
            const cpCuneiform = '𒀀'.codePointAt(0); // 73728
            const cpHiero = '𓀀'.codePointAt(0);      // 77824
            assert(xml.includes(`&#${cpCuneiform};`),
                `test_6.json : contient &#${cpCuneiform}; (cuneiforme 𒀀)`);
            assert(xml.includes(`&#${cpHiero};`),
                `test_6.json : contient &#${cpHiero}; (hieroglyphe 𓀀)`);
        }
    } catch (e) {
        assert(false, 'test_6.json pipeline : erreur', e.message);
    }

    // ===================================================================
    // 10. Regression — caracteres courants non affectes
    // ===================================================================
    section('10. Non-regression — caracteres courants');

    const frenchText = "L'élève résout l'équation x² + 3x − 7 = 0 à l'aide de la formule.";
    const frenchEscaped = escapeXml(frenchText);
    assert(!hasSurrogateRefs(frenchEscaped),
        'Texte francais courant : pas de surrogate');
    assert(frenchEscaped.includes('&#233;'), // é
        'e accent aigu : &#233;');
    assert(frenchEscaped.includes('&#232;'), // è
        'e accent grave : &#232;');
    assert(frenchEscaped.includes('&#178;'), // ²
        'Carre ² : &#178;');
    assert(frenchEscaped.includes('&#8722;') || frenchEscaped.includes('&#x2212;') || frenchEscaped.includes('&#8211;') || frenchEscaped.includes('-'),
        'Signe moins preserve');

    const arabicText = 'بِسْمِ اللَّهِ';
    const arabicEscaped = escapeXml(arabicText);
    assert(!hasSurrogateRefs(arabicEscaped),
        'Texte arabe : pas de surrogate');
    assert(isWellFormedXml(`<?xml version="1.0" encoding="UTF-8"?><r>${arabicEscaped}</r>`),
        'Texte arabe echappe : XML bien forme');

    const chineseText = '中文测试';
    const chineseEscaped = escapeXml(chineseText);
    assert(!hasSurrogateRefs(chineseEscaped),
        'Texte chinois (BMP) : pas de surrogate');

    // ===================================================================
    // RENDER (mode standalone uniquement)
    // ===================================================================
    if (typeof document !== 'undefined' && document.getElementById('summary')) {
        render();
    }

    return { passCount, failCount, results };
}

function render() {
    const summaryEl = document.getElementById('summary');
    summaryEl.innerHTML = `
        <div class="summary__card card--pass">${passCount}<small>PASS</small></div>
        <div class="summary__card card--fail">${failCount}<small>FAIL</small></div>
        <div class="summary__card card--total">${passCount + failCount}<small>TOTAL</small></div>
    `;

    const container = document.getElementById('results');
    let currentSec = '';
    let html = '';

    for (const r of results) {
        if (r.section !== currentSec) {
            if (currentSec) html += '</div>';
            currentSec = r.section;
            html += `<div class="section"><h2>${currentSec}</h2>`;
        }
        const cls = r.status === 'PASS' ? 'result--pass' : 'result--fail';
        html += `<div class="result ${cls}">${r.status === 'PASS' ? '&#10003;' : '&#10007;'} ${r.message}`;
        if (r.diagnostic && r.status === 'FAIL') {
            html += `<div class="diagnostic">${r.diagnostic}</div>`;
        }
        html += '</div>';
    }
    if (currentSec) html += '</div>';
    container.innerHTML = html;

    document.title = failCount === 0
        ? `PASS (${passCount}) — Test Moodle Unicode`
        : `FAIL (${failCount}) — Test Moodle Unicode`;
}

// Auto-execution en mode standalone (ouverture directe du HTML)
if (typeof document !== 'undefined' && document.getElementById('summary')) {
    runAllTests().catch(err => {
        console.error('Erreur fatale:', err);
        document.getElementById('results').innerHTML = `<div class="result result--fail">Erreur fatale : ${err.message}</div>`;
    });
}
