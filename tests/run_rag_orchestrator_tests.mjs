/**
 * Tests unitaires de l'orchestrateur RAG « programmes scolaires »
 * (cf. js/services/rag-orchestrator.js).
 *
 * Exécuter avec : node tests/run_rag_orchestrator_tests.mjs
 *
 * Couvre les 5 issues de décision :
 *   - contexte-vide          : rien de saisi → pas de RAG (comportement historique)
 *   - corpus-fourni          : sources en mode avancé → les sources priment
 *   - hors-scolaire          : supérieur / formation d'adultes → programmes inapplicables
 *   - ancrage-scolaire       : niveau de classe ou métier enseignant détecté → RAG
 *   - aucun-ancrage-scolaire : thème libre / persona fictive → pas de RAG
 */
import { evaluateRagRelevance, detectCycle, CORPUS_SKIP_THRESHOLD } from '../js/services/rag-orchestrator.js';

let pass = 0, fail = 0;
function attend(nom, entree, sendAttendu, reasonAttendue = null) {
    const { send, reason } = evaluateRagRelevance(entree);
    const ok = send === sendAttendu && (reasonAttendue === null || reason === reasonAttendue);
    if (ok) {
        pass++;
    } else {
        fail++;
        console.log(`  FAIL: ${nom}`);
        console.log(`    entrée : ${JSON.stringify(entree)}`);
        console.log(`    attendu: send=${sendAttendu}${reasonAttendue ? ` (${reasonAttendue})` : ''} — obtenu: send=${send} (${reason})`);
    }
}

// ── 1. Contexte vide ────────────────────────────────────────────────────────
attend('tout vide', {}, false, 'contexte-vide');
attend('champs blancs', { sujet: '  ', discipline: '', niveau: ' ' }, false, 'contexte-vide');

// ── 2. Corpus fourni (mode avancé) ──────────────────────────────────────────
attend('corpus long → sources priment', {
    sujet: 'La photosynthèse', niveau: '6e', corpusLength: 5000,
}, false, 'corpus-fourni');
attend('corpus au seuil exact', {
    sujet: 'La photosynthèse', niveau: '6e', corpusLength: CORPUS_SKIP_THRESHOLD,
}, false, 'corpus-fourni');
attend('reliquat de corpus sous le seuil → RAG conservé', {
    sujet: 'La photosynthèse', niveau: '6e', corpusLength: CORPUS_SKIP_THRESHOLD - 1,
}, true, 'ancrage-scolaire');

// ── 3. Hors scolaire (supérieur, adultes) ───────────────────────────────────
attend('université', { discipline: 'Enseignant à l\'université', niveau: 'L2 droit' }, false, 'hors-scolaire');
attend('licence', { niveau: 'Licence 2 de biologie', sujet: 'La mitose' }, false, 'hors-scolaire');
attend('master', { niveau: 'Master 1 MEEF' }, false, 'hors-scolaire');
attend('BTS', { niveau: 'BTS électrotechnique' }, false, 'hors-scolaire');
attend('BUT', { niveau: 'BUT informatique 1re année' }, false, 'hors-scolaire');
attend('prépa / CPGE', { niveau: 'CPGE MP2I' }, false, 'hors-scolaire');
attend('bac+3', { niveau: 'bac+3' }, false, 'hors-scolaire');
attend('enseignement supérieur', { niveau: 'enseignement supérieur' }, false, 'hors-scolaire');
attend('formateur d\'adultes', { discipline: 'Formateur en entreprise', sujet: 'La sécurité incendie' }, false, 'hors-scolaire');
attend('étudiants', { niveau: 'étudiants en médecine' }, false, 'hors-scolaire');
attend('négatif prioritaire sur positif', {
    discipline: 'Professeur des universités', niveau: 'Licence',
}, false, 'hors-scolaire');
// Faux amis à NE PAS classer hors-scolaire (mots ambigus dans le SUJET, pas le public)
attend('« but » dans le sujet ne déclenche pas hors-scolaire', {
    sujet: 'Le but du jeu au handball', niveau: '5e',
}, true, 'ancrage-scolaire');
attend('« borne supérieure » dans le sujet', {
    sujet: 'La borne supérieure d\'un ensemble', niveau: 'Terminale',
}, true, 'ancrage-scolaire');

// ── 4. Ancrage scolaire ─────────────────────────────────────────────────────
attend('niveau collège', { niveau: '4e', sujet: 'Les fractions' }, true, 'ancrage-scolaire');
attend('placeholder du champ niveau', { niveau: 'Seconde en bac professionnel' }, true, 'ancrage-scolaire');
attend('placeholder du champ qui', { discipline: 'Enseignant de 3e' }, true, 'ancrage-scolaire');
attend('primaire', { niveau: 'CM2' }, true, 'ancrage-scolaire');
attend('maternelle', { niveau: 'Grande section de maternelle' }, true, 'ancrage-scolaire');
attend('CAP', { niveau: 'CAP cuisine' }, true, 'ancrage-scolaire');
attend('SEGPA', { niveau: '4e SEGPA' }, true, 'ancrage-scolaire');
attend('mot-métier seul dans qui', { discipline: 'Professeure de français', sujet: 'Les super-héros' }, true, 'ancrage-scolaire');
attend('niveau dans le sujet', { sujet: 'La Révolution française en quatrième' }, true, 'ancrage-scolaire');
attend('élèves', { niveau: 'mes élèves de début d\'année' }, true, 'ancrage-scolaire');
attend('accents et casse', { niveau: 'TERMINALE STMG' }, true, 'ancrage-scolaire');

// ── 4bis. Abréviations et variantes francophones ────────────────────────────
attend('abréviation Term', { niveau: 'Term STMG' }, true, 'ancrage-scolaire');
attend('filière STI2D seule', { niveau: 'STI2D' }, true, 'ancrage-scolaire');
attend('3e prépa-métiers = collège (pas prépa sup)', { niveau: '3e prépa-métiers' }, true, 'ancrage-scolaire');
attend('classe prépa = supérieur', { niveau: 'classe prépa MPSI' }, false, 'hors-scolaire');
attend('Belgique — rhéto', { niveau: 'rhéto' }, true, 'ancrage-scolaire');
attend('Belgique — secondaire', { niveau: '3e secondaire' }, true, 'ancrage-scolaire');
attend('Suisse — gymnase', { niveau: 'gymnase, 2e année' }, true, 'ancrage-scolaire');
attend('Québec — cégep = post-secondaire', { niveau: 'cégep' }, false, 'hors-scolaire');
attend('UPE2A', { niveau: 'UPE2A allophones' }, true, 'ancrage-scolaire');

// ── 4ter. Les 11 langues de l'UI ────────────────────────────────────────────
attend('EN — Grade 5 + Teacher', { discipline: 'Teacher', niveau: 'Grade 5', sujet: 'Fractions' }, true, 'ancrage-scolaire');
attend('EN — year 8 (UK)', { niveau: 'Year 8' }, true, 'ancrage-scolaire');
attend('EN — high school', { niveau: 'high school students' }, true, 'ancrage-scolaire');
attend('EN — université', { niveau: 'university undergraduates' }, false, 'hors-scolaire');
attend('EN — PhD', { discipline: 'PhD supervisor' }, false, 'hors-scolaire');
attend('ES — ESO', { niveau: '3º de la ESO' }, true, 'ancrage-scolaire');
attend('ES — maestra de primaria', { discipline: 'Maestra de primaria' }, true, 'ancrage-scolaire');
attend('ES — universidad', { niveau: 'Universidad, doctorado' }, false, 'hors-scolaire');
attend('DE — 7. Klasse Gymnasium', { niveau: '7. Klasse Gymnasium' }, true, 'ancrage-scolaire');
attend('DE — mot composé Grundschullehrerin', { discipline: 'Grundschullehrerin' }, true, 'ancrage-scolaire');
attend('DE — Fachhochschule (composé, négatif)', { niveau: 'Fachhochschule' }, false, 'hors-scolaire');
attend('DE — Bachelorstudium', { niveau: 'Bachelor Studium' }, false, 'hors-scolaire');
attend('IT — liceo', { niveau: 'Liceo scientifico' }, true, 'ancrage-scolaire');
attend('IT — scuole superiori ≠ supérieur FR', { niveau: 'scuole superiori' }, true, 'ancrage-scolaire');
attend('IT — laurea', { niveau: 'Laurea magistrale' }, false, 'hors-scolaire');
attend('NL — groep 5', { niveau: 'groep 5' }, true, 'ancrage-scolaire');
attend('NL — vwo', { niveau: '3 vwo' }, true, 'ancrage-scolaire');
attend('NL — hogeschool', { niveau: 'hogeschool' }, false, 'hors-scolaire');
attend('PT — ensino fundamental', { niveau: '5º ano do ensino fundamental' }, true, 'ancrage-scolaire');
attend('PT — professor + escola', { discipline: 'Professor de escola básica' }, true, 'ancrage-scolaire');
attend('PT — mestrado', { niveau: 'Mestrado' }, false, 'hors-scolaire');
attend('EL — δημοτικό (primaire)', { niveau: 'Δημοτικό σχολείο' }, true, 'ancrage-scolaire');
attend('EL — λύκειο', { niveau: 'Β΄ Λυκείου' }, true, 'ancrage-scolaire');
attend('EL — πανεπιστήμιο', { niveau: 'Πανεπιστήμιο' }, false, 'hors-scolaire');
attend('AR — ابتدائي (primaire)', { niveau: 'الصف الخامس ابتدائي' }, true, 'ancrage-scolaire');
attend('AR — معلم (enseignant)', { discipline: 'معلم لغة عربية' }, true, 'ancrage-scolaire');
attend('AR — جامعة (université)', { niveau: 'طلاب جامعة' }, false, 'hors-scolaire');
attend('ZH — 小学 (primaire)', { niveau: '小学五年级' }, true, 'ancrage-scolaire');
attend('ZH — 老师 (enseignant)', { discipline: '数学老师' }, true, 'ancrage-scolaire');
attend('ZH — 大学 (université)', { niveau: '大学一年级' }, false, 'hors-scolaire');
attend('JP — 中学校', { niveau: '中学校2年生' }, true, 'ancrage-scolaire');
attend('JP — 高校', { niveau: '高校1年' }, true, 'ancrage-scolaire');
attend('JP — 大学院', { niveau: '大学院' }, false, 'hors-scolaire');

// ── 5. Aucun ancrage (thème libre, persona) ─────────────────────────────────
attend('persona super-héros (exemple du besoin)', {
    discipline: 'Super héro', sujet: 'Sauver la veuve et l\'orphelin',
}, false, 'aucun-ancrage-scolaire');
attend('sujet seul sans public', { sujet: 'Les fractions' }, false, 'aucun-ancrage-scolaire');
attend('ordinal court dans le sujet ignoré', { sujet: 'L\'art au 4e siècle' }, false, 'aucun-ancrage-scolaire');
attend('year + grand nombre ignoré', { niveau: 'year 1945' }, false, 'aucun-ancrage-scolaire');

// ── 6. detectCycle : mapping niveau → cycle FR (envoyé au Worker via rag.cycle) ──
function cycleAttendu(nom, entree, attendu) {
    const obtenu = detectCycle(entree);
    if (obtenu === attendu) {
        pass++;
    } else {
        fail++;
        console.log(`  FAIL: ${nom}\n    entrée : ${JSON.stringify(entree)}\n    attendu: '${attendu}' — obtenu: '${obtenu}'`);
    }
}

// Français
cycleAttendu('cycle explicite', { niveau: 'cycle 3' }, 'cycle-3');
cycleAttendu('maternelle', { niveau: 'Grande section de maternelle' }, 'cycle-1');
cycleAttendu('CE2', { niveau: 'CE2' }, 'cycle-2');
cycleAttendu('CM2', { niveau: 'CM2' }, 'cycle-3');
cycleAttendu('6e', { niveau: '6e' }, 'cycle-3');
cycleAttendu('4e via qui', { discipline: 'Enseignant de 4e' }, 'cycle-4');
cycleAttendu('quatrième dans le sujet', { sujet: 'La Révolution française en quatrième' }, 'cycle-4');
cycleAttendu('Terminale', { niveau: 'TERMINALE STMG' }, 'lycee-gt');
cycleAttendu('Seconde bac pro', { niveau: 'Seconde en bac professionnel' }, 'lycee-gt');
cycleAttendu('collège sans classe → rien', { niveau: 'collège' }, '');
cycleAttendu('CAP → pas de cycle en collection', { niveau: 'CAP cuisine' }, '');
// Belgique / Québec / Suisse
cycleAttendu('BE — 5e primaire = CM2', { niveau: '5e primaire' }, 'cycle-3');
cycleAttendu('BE — 2e primaire', { niveau: '2e primaire' }, 'cycle-2');
cycleAttendu('BE — 3e secondaire', { niveau: '3e secondaire' }, 'cycle-4');
cycleAttendu('BE — 5e secondaire', { niveau: '5e secondaire' }, 'lycee-gt');
cycleAttendu('QC — secondaire 3', { niveau: 'secondaire 3' }, 'cycle-4');
cycleAttendu('CH — gymnase', { niveau: 'gymnase' }, 'lycee-gt');
// Anglais
cycleAttendu('EN — Grade 5', { niveau: 'Grade 5' }, 'cycle-3');
cycleAttendu('EN — 8th grade', { niveau: '8th grade' }, 'cycle-4');
cycleAttendu('EN — Year 8 = Grade 7', { niveau: 'Year 8' }, 'cycle-4');
cycleAttendu('EN — KS2', { niveau: 'KS2' }, 'cycle-3');
cycleAttendu('EN — high school', { niveau: 'high school' }, 'lycee-gt');
cycleAttendu('EN — kindergarten', { niveau: 'kindergarten' }, 'cycle-1');
// Allemand
cycleAttendu('DE — 7. Klasse', { niveau: '7. Klasse Gymnasium' }, 'cycle-4');
cycleAttendu('DE — Klasse 2', { niveau: 'Klasse 2' }, 'cycle-2');
cycleAttendu('DE — Abitur', { niveau: 'Abitur' }, 'lycee-gt');
cycleAttendu('DE — Gymnasium sans classe → rien', { niveau: 'Gymnasium' }, '');
// Espagnol
cycleAttendu('ES — 3º ESO', { niveau: '3º de la ESO' }, 'cycle-4');
cycleAttendu('ES — 2º de primaria', { niveau: '2º de primaria' }, 'cycle-2');
cycleAttendu('ES — bachillerato', { niveau: 'Bachillerato' }, 'lycee-gt');
// Italien
cycleAttendu('IT — scuola media', { niveau: 'scuola media' }, 'cycle-4');
cycleAttendu('IT — liceo', { niveau: 'Liceo scientifico' }, 'lycee-gt');
// Néerlandais
cycleAttendu('NL — groep 2 = maternelle', { niveau: 'groep 2' }, 'cycle-1');
cycleAttendu('NL — groep 5', { niveau: 'groep 5' }, 'cycle-2');
cycleAttendu('NL — groep 7', { niveau: 'groep 7' }, 'cycle-3');
// Portugais
cycleAttendu('PT — 5º ano', { niveau: '5º ano do ensino fundamental' }, 'cycle-3');
cycleAttendu('PT — ensino médio', { niveau: 'ensino médio' }, 'lycee-gt');
// Grec
cycleAttendu('EL — γυμνάσιο', { niveau: 'Γυμνάσιο' }, 'cycle-4');
cycleAttendu('EL — λύκειο', { niveau: 'Β΄ Λυκείου' }, 'lycee-gt');
// Arabe
cycleAttendu('AR — ثانوي', { niveau: 'ثانوي' }, 'lycee-gt');
cycleAttendu('AR — متوسط', { niveau: 'الصف الثاني متوسط' }, 'cycle-4');
cycleAttendu('AR — ابتدائي sans année → rien', { niveau: 'ابتدائي' }, '');
// Chinois / japonais
cycleAttendu('ZH — 小学五年级', { niveau: '小学五年级' }, 'cycle-3');
cycleAttendu('ZH — 初中', { niveau: '初中' }, 'cycle-4');
cycleAttendu('ZH — 八年级', { niveau: '八年级' }, 'cycle-4');
cycleAttendu('JP — 中学校2年生', { niveau: '中学校2年生' }, 'cycle-4');
cycleAttendu('JP — 高校', { niveau: '高校1年' }, 'lycee-gt');
// Garde-fous
cycleAttendu('rien de saisi', {}, '');
cycleAttendu('persona sans niveau', { discipline: 'Super héro', sujet: 'Sauver la veuve' }, '');
cycleAttendu('ordinal du sujet ignoré', { sujet: 'L\'art au 4e siècle' }, '');

console.log(`\n${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
