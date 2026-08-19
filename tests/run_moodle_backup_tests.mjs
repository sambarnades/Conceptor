/**
 * run_moodle_backup_tests.mjs — Garde-fou byte-exact des builders de `moodle_backup.xml`.
 *
 * `js/moodle/processors/shared/moodle-backup.js` produit le manifest de l'archive MBZ.
 * Sa sortie est un CONTRAT d'import Moodle/Éléa : l'ordre des éléments et l'indentation
 * font partie du format attendu. Ce test fige donc les sha256 de la sortie pour 36
 * combinaisons (3 variantes × modules réels × 4 jeux de données), relevés AVANT la
 * factorisation des trois templates dupliqués en un squelette + table de variantes.
 *
 * Il vérifie aussi les DIVERGENCES STRUCTURELLES entre variantes, qui étaient auparavant
 * noyées dans du XML copié-collé : présence/absence de <insubsection>, <sections>,
 * <parentcmid>, du réglage `imscc11` et du réglage `xapistate`.
 *
 * Si un hash change, ce n'est pas forcément un bug — mais c'est forcément un changement
 * de format qui DOIT être intentionnel et revalidé par un import Moodle réel.
 *
 * Lancement :  node tests/run_moodle_backup_tests.mjs
 */
import { createHash } from 'crypto';
import {
    buildMoodleBackup, buildCourseBackup, buildSingleActivityBackup
} from '../js/moodle/processors/shared/moodle-backup.js';

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n   obtenu: ${a}`);
}
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

// =======================================================================
// Jeux de données — couvrent tous les placeholders + cas limites
// =======================================================================
const DATASETS = {
    plein: {
        MODULE_ID: '4242', SECTION_ID: '77', COURSE_ID: '9', BACKUP_DATE: '1781611200',
        COURSE_FULLNAME: 'Cours de test', COURSE_SHORTNAME: 'CT-01',
        COURSE_CONTEXTID: '1234', ACTIVITY_TITLE: 'Mon activité'
    },
    vide: {
        MODULE_ID: '', SECTION_ID: '', COURSE_ID: '', BACKUP_DATE: '',
        COURSE_FULLNAME: '', COURSE_SHORTNAME: '', COURSE_CONTEXTID: '', ACTIVITY_TITLE: ''
    },
    // placeholders manquants → doivent rester LITTÉRAUX (cf. replacePlaceholders)
    partiel: { MODULE_ID: '1', ACTIVITY_TITLE: 'Titre seul' },
    // motifs spéciaux de String.replace ($&, $1, $$) et collision de placeholders
    special: {
        MODULE_ID: '5', SECTION_ID: '6', COURSE_ID: '7', BACKUP_DATE: '0',
        COURSE_FULLNAME: 'A $& B $1 C $$ D', COURSE_SHORTNAME: '{{MODULE_ID}}',
        COURSE_CONTEXTID: '8', ACTIVITY_TITLE: '<b>&amp;</b> "quotes" \'apos\''
    }
};

const BUILDERS = {
    buildMoodleBackup: [buildMoodleBackup, ['quiz', 'simplequiz', 'epikmatch', 'assign']],
    buildCourseBackup: [buildCourseBackup, ['quiz', 'page', 'book', 'glossary']],
    buildSingleActivityBackup: [buildSingleActivityBackup, ['millionnairev2']]
};

// =======================================================================
// BASELINE FIGÉE — [sha256, longueur] relevés avant factorisation.
// NE PAS régénérer sans valider un import Moodle/Éléa réel.
// =======================================================================
const BASELINE = {
    'buildMoodleBackup|quiz|plein': ['fe416ec2910f170957144d45c61d4bf114b8ca7d83719b1acf9627dfbb622c0a', 4820],
    'buildMoodleBackup|quiz|vide': ['a68c95ea811490d6a1aebab4fee2de52ee07dbed5df8484be2d07daabaea7abd', 4733],
    'buildMoodleBackup|quiz|partiel': ['24f3214282a0db94e30fb4cf7e25bac4aa5752c73eb1eeacdbc305b2c2ca642b', 4854],
    'buildMoodleBackup|quiz|special': ['94a159bc003a90d4c80632396a76a14645807b71a3f1c6dcec613ce1d3ab7d57', 4804],
    'buildMoodleBackup|simplequiz|plein': ['be40d231d9fdf1b0a635570916dc0fb963d1884c86291fdec896a3d521dc34da', 4868],
    'buildMoodleBackup|simplequiz|vide': ['456c19940066a504f898664c6f8120f8052bdb74c0272581c67bd536d5b1d977', 4781],
    'buildMoodleBackup|simplequiz|partiel': ['11cbf839a5ae73580eac1ba9e72d53e4677b1e256879f477e3672e91eadcfc26', 4902],
    'buildMoodleBackup|simplequiz|special': ['d85cac9388107935eee76e175cd1e31d8411bbef7d9d6fbe799e4cc0d14d9f89', 4852],
    'buildMoodleBackup|epikmatch|plein': ['1c9efcc87314aba72e227aa33d1afe623bddf1dcf37d7258a3a1a13a20544f16', 4860],
    'buildMoodleBackup|epikmatch|vide': ['9972e8bba884587c4009a534d207bb9ad172c0dac63cd2ea8174e1235a374a14', 4773],
    'buildMoodleBackup|epikmatch|partiel': ['57c8e5a636382dcd4244b679e797758fc1eb0a417de6a80ea3cefba4ed0d2d4d', 4894],
    'buildMoodleBackup|epikmatch|special': ['14dcd4f51fdfee42553f776c307d34cb5470aa120a38a9a7627a5a640a146b25', 4844],
    'buildMoodleBackup|assign|plein': ['8c5f67a997948b46dde998e716a55c9ab626dc5fab1535c9553388ce2391779a', 4836],
    'buildMoodleBackup|assign|vide': ['06667a8550006b3d138fa30c00cb6839ace757526cfbd2cf50cfd3458b1f9d84', 4749],
    'buildMoodleBackup|assign|partiel': ['0eb372fc7589453a51b70b14535fd97fe05fceeb8db4acdb43abc10114253e63', 4870],
    'buildMoodleBackup|assign|special': ['bb9cea12525eb87d9178cdd8e93ecc7bd80e0e1eaa2b6609e2885e3ba4fc327e', 4820],
    'buildCourseBackup|quiz|plein': ['f9e6cd5aaf1999b6c0a96cc880bc9719c2e83b2386231b934ee88658919a6630', 5628],
    'buildCourseBackup|quiz|vide': ['e2115bdc63204e7117c5ec9e25b4205f82b651ce334240f033b252efe0493011', 5527],
    'buildCourseBackup|quiz|partiel': ['91ac18ee2dde9e026c740d9734abb12177b0aa3963e74b874f840872118bba58', 5827],
    'buildCourseBackup|quiz|special': ['832999ebd0e1139dca18a2671a0aeb82398c153dd76ece66607cb36300204735', 5642],
    'buildCourseBackup|page|plein': ['1b9949903210cf7cb02314c6de90d8a325e6397f1fcccbeb375c80817b220c86', 5628],
    'buildCourseBackup|page|vide': ['5d16e16266c5765f7ef628d1c81e0c96e1c275d704cb397c04295bba4b6813ba', 5527],
    'buildCourseBackup|page|partiel': ['a41c76f96c175b72e6b6e28eba0d2f9c97fda297006977f6a0f8381b895768d9', 5827],
    'buildCourseBackup|page|special': ['dafe333a9a7d458289ed19cde17f76e5f2cabd38a032633dbb98c5682c39d874', 5642],
    'buildCourseBackup|book|plein': ['333233dbfa3cadd836d3929e3ada45670f16f55108046cb09b6013c81cb74ae0', 5628],
    'buildCourseBackup|book|vide': ['d71a6b44c133d9cfffa6d1b6866d9f8ed4c9db242ecf0a67109f4ad4663fde09', 5527],
    'buildCourseBackup|book|partiel': ['22e89f5c5a422a127a8107faa3b29efc36d110dd3c5b3f008de8f0455d1d64db', 5827],
    'buildCourseBackup|book|special': ['597aeb40b760852bbf31af6c3d91bd32855bb9f180eb74809a1bb0f830ced56a', 5642],
    'buildCourseBackup|glossary|plein': ['f19d07d6e3f4623525cb2ac8768bae05963980bcb2f2e1295fc3235847bf7146', 5652],
    'buildCourseBackup|glossary|vide': ['e447a93eb828f6373df0e50d6dc2dc9b5a1ebe15592e8f9ffb5cb481f67b84fa', 5551],
    'buildCourseBackup|glossary|partiel': ['a0d0fcccc06f8f81923e0aa63945761559cc07e8550dbab2b163aa02e6fedb25', 5851],
    'buildCourseBackup|glossary|special': ['5773c669f82386df99fe2112cf71456ab71f24c32fca6b8217b6f1875cca1668', 5666],
    'buildSingleActivityBackup|millionnairev2|plein': ['c2a1796346c4878864830968e59285f3ed4264a7a7c5082587956218242c6820', 5403],
    'buildSingleActivityBackup|millionnairev2|vide': ['f9e718a6a26d6886602513bf360ce774c9bfeb8c72419d0826a675212fc342c0', 5315],
    'buildSingleActivityBackup|millionnairev2|partiel': ['9b050c76fc16eba49be13db223af7e63cbc126c47362f2941c5deeddfa0289e7', 5540],
    'buildSingleActivityBackup|millionnairev2|special': ['c9cb8cded27921ca6c68f038654a6e7f05215dff08e93b1d2fbf3950363307b1', 5414]
};

// =======================================================================
// 1. Conformité byte-exacte à la baseline
// =======================================================================
{
    let checked = 0, diverged = 0;
    for (const [bName, [fn, modules]] of Object.entries(BUILDERS)) {
        for (const mod of modules) {
            for (const [dsName, ds] of Object.entries(DATASETS)) {
                const key = `${bName}|${mod}|${dsName}`;
                const expected = BASELINE[key];
                if (!expected) { fail++; failures.push(`❌ baseline manquante pour ${key}`); continue; }
                const xml = fn(ds, mod);
                checked++;
                if (sha(xml) !== expected[0] || xml.length !== expected[1]) {
                    diverged++;
                    failures.push(`❌ ${key}\n   longueur ${expected[1]} → ${xml.length}\n   sha ${expected[0].slice(0, 16)} → ${sha(xml).slice(0, 16)}`);
                }
            }
        }
    }
    eq(`baseline : ${checked} cas byte-identiques`, diverged, 0);
    eq('aucune combinaison oubliée', checked, Object.keys(BASELINE).length);
}

// =======================================================================
// 2. Divergences structurelles entre variantes (auparavant implicites)
// =======================================================================
{
    const D = DATASETS.plein;
    const act = buildMoodleBackup(D, 'epikmatch');
    const crs = buildCourseBackup(D, 'page');
    const single = buildSingleActivityBackup(D, 'millionnairev2');

    // --- type de sauvegarde ---
    ok('activity : <type>activity</type>', act.includes('<type>activity</type>'));
    ok('course : <type>course</type>', crs.includes('<type>course</type>'));
    ok('singleactivity : <type>course</type>', single.includes('<type>course</type>'));

    // --- original_course_format ---
    ok('activity : format singleactivity', act.includes('<original_course_format>singleactivity</original_course_format>'));
    ok('course : format topics', crs.includes('<original_course_format>topics</original_course_format>'));
    ok('singleactivity : format singleactivity', single.includes('<original_course_format>singleactivity</original_course_format>'));

    // --- version Moodle : 4.5 sauf singleactivity en 4.1 ---
    ok('activity : Moodle 4.5', act.includes('<backup_release>4.5</backup_release>'));
    ok('course : Moodle 4.5', crs.includes('<backup_release>4.5</backup_release>'));
    ok('singleactivity : Moodle 4.1', single.includes('<backup_release>4.1</backup_release>'));

    // --- include_files ---
    ok('activity : include_files=1', act.includes('<include_files>1</include_files>'));
    ok('course : include_files=1', crs.includes('<include_files>1</include_files>'));
    ok('singleactivity : include_files=0', single.includes('<include_files>0</include_files>'));

    // --- <insubsection> : absent de singleactivity SEULEMENT ---
    ok('activity : <insubsection> présent', act.includes('<insubsection></insubsection>'));
    ok('course : <insubsection> présent', crs.includes('<insubsection></insubsection>'));
    ok('singleactivity : <insubsection> ABSENT', !single.includes('<insubsection>'));

    // --- <sections>/<course> : absents de activity SEULEMENT ---
    ok('activity : pas de bloc <sections>', !act.includes('<sections>'));
    ok('activity : pas de bloc <course>', !act.includes('<course>'));
    ok('course : bloc <sections> présent', crs.includes('<sections>'));
    ok('course : bloc <course> présent', crs.includes('<course>'));
    ok('singleactivity : bloc <sections> présent', single.includes('<sections>'));
    ok('singleactivity : bloc <course> présent', single.includes('<course>'));

    // --- <parentcmid>/<modname> : dans course SEULEMENT ---
    ok('course : <parentcmid> présent', crs.includes('<parentcmid></parentcmid>'));
    ok('course : <modname> présent', crs.includes('<modname></modname>'));
    ok('singleactivity : <parentcmid> ABSENT', !single.includes('<parentcmid>'));
    ok('singleactivity : <modname> ABSENT', !single.includes('<modname>'));

    // --- réglage imscc11 : absent de activity SEULEMENT ---
    ok('activity : réglage imscc11 ABSENT', !act.includes('<name>imscc11</name>'));
    ok('course : réglage imscc11 présent', crs.includes('<name>imscc11</name>'));
    ok('singleactivity : réglage imscc11 présent', single.includes('<name>imscc11</name>'));

    // --- réglage xapistate : absent de singleactivity SEULEMENT ---
    ok('activity : réglage xapistate présent', act.includes('<name>xapistate</name>'));
    ok('course : réglage xapistate présent', crs.includes('<name>xapistate</name>'));
    ok('singleactivity : réglage xapistate ABSENT', !single.includes('<name>xapistate</name>'));

    // --- réglages de section : absents de activity SEULEMENT ---
    ok('activity : pas de <level>section</level>', !act.includes('<level>section</level>'));
    ok('course : <level>section</level> présent', crs.includes('<level>section</level>'));
    ok('singleactivity : <level>section</level> présent', single.includes('<level>section</level>'));

    // --- nombre de réglages root : 21 / 22 / 21 ---
    const countRoot = (s) => (s.match(/<level>root<\/level>/g) || []).length;
    eq('activity : 21 réglages root', countRoot(act), 21);
    eq('course : 22 réglages root', countRoot(crs), 22);
    eq('singleactivity : 21 réglages root', countRoot(single), 21);

    // --- réglages d'activité : toujours 2 (included + userinfo) ---
    const countActivityLvl = (s) => (s.match(/<level>activity<\/level>/g) || []).length;
    eq('activity : 2 réglages d\'activité', countActivityLvl(act), 2);
    eq('course : 2 réglages d\'activité', countActivityLvl(crs), 2);
    eq('singleactivity : 2 réglages d\'activité', countActivityLvl(single), 2);

    // --- nom de fichier par variante ---
    ok('activity : nom sauvegarde-moodle2-activity-…',
        act.includes('<name>sauvegarde-moodle2-activity-4242-epikmatch4242-caramel.mbz</name>'));
    ok('course : nom sauvegarde-moodle2-course-…',
        crs.includes('<name>sauvegarde-moodle2-course-9-CT-01-caramel.mbz</name>'));
    ok('singleactivity : nom modele.mbz', single.includes('<name>modele.mbz</name>'));

    // Le réglage `filename` doit répéter EXACTEMENT le <name> du manifest
    const nameOf = (s) => s.match(/<name>([^<]*)<\/name>/)[1];
    const filenameSettingOf = (s) => s.match(/<name>filename<\/name>\s*<value>([^<]*)<\/value>/)[1];
    eq('activity : filename == <name>', filenameSettingOf(act), nameOf(act));
    eq('course : filename == <name>', filenameSettingOf(crs), nameOf(crs));
    eq('singleactivity : filename == <name>', filenameSettingOf(single), nameOf(single));

    // --- original_course_fullname : ACTIVITY_TITLE pour singleactivity ---
    ok('activity : fullname = COURSE_FULLNAME',
        act.includes('<original_course_fullname>Cours de test</original_course_fullname>'));
    ok('singleactivity : fullname = ACTIVITY_TITLE',
        single.includes('<original_course_fullname>Mon activité</original_course_fullname>'));
}

// =======================================================================
// 3. Invariants XML de base sur les trois variantes
// =======================================================================
{
    for (const [bName, [fn, modules]] of Object.entries(BUILDERS)) {
        const xml = fn(DATASETS.plein, modules[0]);
        ok(`${bName} : déclaration XML en tête`, xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<moodle_backup>'));
        ok(`${bName} : racine fermée`, xml.endsWith('</moodle_backup>'));
        ok(`${bName} : pas de placeholder résiduel`, !/\{\{[A-Z_]+\}\}/.test(xml),
            (xml.match(/\{\{[A-Z_]+\}\}/g) || []).join(', '));
        // balises appariées pour les conteneurs principaux
        for (const tag of ['information', 'details', 'contents', 'activities', 'settings']) {
            const opens = (xml.match(new RegExp(`<${tag}>`, 'g')) || []).length;
            const closes = (xml.match(new RegExp(`</${tag}>`, 'g')) || []).length;
            ok(`${bName} : <${tag}> apparié`, opens === closes && opens === 1, `${opens} ouvrant(s) / ${closes} fermant(s)`);
        }
    }
}

// =======================================================================
// 4. Robustesse : variante inconnue, placeholders manquants
// =======================================================================
{
    // Les placeholders sans donnée restent littéraux (contrat de replacePlaceholders)
    const partial = buildMoodleBackup({ MODULE_ID: '1' }, 'quiz');
    ok('placeholder sans donnée reste littéral', partial.includes('{{COURSE_FULLNAME}}'));
    ok('placeholder fourni est bien substitué', partial.includes('<moduleid>1</moduleid>'));

    // Une collision de placeholder dans une VALEUR ne doit pas être ré-substituée
    const collide = buildCourseBackup(
        { ...DATASETS.plein, COURSE_SHORTNAME: '{{MODULE_ID}}' }, 'page');
    ok('collision de placeholder : valeur laissée littérale',
        collide.includes('<title>{{MODULE_ID}}</title>'));
}

// =======================================================================
// Bilan
// =======================================================================
console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`moodle_backup.xml : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
