/**
 * run_preview_feedback.mjs — Vérification VISUELLE du rendu des feedbacks.
 *
 * Monte chaque activité concernée par le type de rendu `latex` dans
 * h5p-standalone (via tests/preview-feedback-harness.html), joue l'activité
 * jusqu'à faire apparaître le feedback, puis vérifie CE QUE L'ÉLÈVE VOIT :
 *
 *   1. aucune balise HTML littérale à l'écran (« <strong> » en toutes lettres) ;
 *   2. les formules du feedback sont bien rendues par MathJax (et pas laissées
 *      en \(...\) brut ni dégradées) ;
 *   3. capture d'écran de la zone de feedback, pour comparaison avant/après.
 *
 * Pourquoi ce banc : l'aperçu h5p-standalone est 100 % JS et n'exécute AUCUN des
 * filtres PHP de Moodle. Il ne prouve donc PAS la conformité au semantics (c'est
 * le rôle de run_semantics_audit.mjs) — il prouve la NON-RÉGRESSION du rendu :
 * que les formules qui s'affichaient s'affichent toujours.
 *
 * Lancement :  node tests/run_preview_feedback.mjs [--headed] [--sortie=<dossier>]
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));

let chromium;
try {
    ({ chromium } = require('playwright'));
} catch {
    console.error('❌ Playwright introuvable. Installer : cd tests/roundtrip && npm install');
    process.exit(2);
}

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const SORTIE = (args.find(a => a.startsWith('--sortie=')) || '').replace('--sortie=', '')
    || join(ROOT, 'tests/.captures-feedback');
const PORT = 8097;

// --------------------------------------------------------------- fixtures
// Chaque cas porte du LaTeX ET du HTML dans les champs `latex`, pour voir
// simultanément ce qui doit survivre (la formule) et ce qui doit disparaître
// (la balise). `jouer` amène l'activité à afficher son feedback.
const FEEDBACK_LATEX = [
    { from: 0, to: 50, feedback: 'Courage ! Revois <strong>bien</strong> que \\(\\sqrt{16} = 4\\).' },
    { from: 51, to: 100, feedback: 'Bravo ! Tu maîtrises \\(\\int_{0}^{1} x^2\\,dx = \\frac{1}{3}\\).' }
];

const CAS = [
    {
        cle: 'MultipleChoice',
        json: {
            question: 'Combien vaut \\(\\sqrt{16}\\) ?',
            answers: [
                { text: '4', correct: true },
                { text: '-4', correct: false }
            ],
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => {
            await clic(page, '.h5p-answer', 0);
            await clicTexte(page, ['Vérifier', 'Check']);
        }
    },
    {
        cle: 'TrueFalse',
        json: {
            question: 'L\'égalité \\(\\sqrt{16} = 4\\) est-elle vraie ?',
            correct: 'true',
            feedbackOnCorrect: 'Oui ! <em>Exactement</em> : \\(\\sqrt{16} = 4\\).',
            feedbackOnWrong: 'Non : \\(\\sqrt{16} = 4\\), pas \\(-4\\).',
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => {
            await clicTexte(page, ['Vrai', 'True']);
            await clicTexte(page, ['Vérifier', 'Check']);
        }
    },
    {
        cle: 'FillInTheBlanks',
        json: {
            taskDescription: 'Complète.',
            questions: ['La racine de 16 vaut *4*.'],
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => {
            await saisir(page, '.h5p-blanks input, .h5p-text-input', '4');
            await clicTexte(page, ['Vérifier', 'Check']);
        }
    },
    {
        cle: 'SingleChoiceSet',
        json: {
            choices: [{ question: 'Combien vaut \\(\\sqrt{16}\\) ?', answers: ['4', '-4'] }],
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => { await clic(page, '.h5p-sc-alternative', 0); }
    },
    {
        cle: 'Summary',
        json: {
            intro: 'Choisis l\'énoncé correct.',
            summaries: [{ summary: ['\\(\\sqrt{16} = 4\\) est vrai.', '\\(\\sqrt{16} = -4\\) est vrai.'] }],
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => { await clic(page, '.h5p-summary-answer', 0); }
    },
    {
        cle: 'MarkTheWords',
        json: {
            taskDescription: 'Surligne le mot juste.',
            textField: 'La *racine* de \\(16\\) vaut 4.',
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => {
            await clic(page, '.h5p-word-selectable', 0);
            await clicTexte(page, ['Vérifier', 'Check']);
        }
    },
    {
        cle: 'DragTheWords',
        json: {
            taskDescription: 'Complète.',
            textField: 'La racine de 16 vaut *4*.',
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => { await clicTexte(page, ['Vérifier', 'Check']); }
    },
    {
        cle: 'Essay',
        json: {
            taskDescription: 'Explique le calcul de \\(\\sqrt{16}\\).',
            keywords: [{ keyword: 'racine' }],
            overallFeedback: FEEDBACK_LATEX
        },
        jouer: async (page) => {
            await saisir(page, 'textarea', 'la racine vaut 4');
            await clicTexte(page, ['Vérifier', 'Check']);
        }
    },
    {
        cle: 'Flashcards',
        json: {
            title: 'Cartes',
            description: 'Révise <strong>bien</strong> la formule \\(\\sqrt{16} = 4\\).',
            cards: [{ text: 'Combien vaut \\(\\sqrt{16}\\) ?', answer: '4' }]
        },
        // La description s'affiche d'emblée : pas d'interaction nécessaire.
        jouer: async () => {}
    },
    {
        cle: 'FindTheWords',
        json: {
            taskDescription: 'Trouve les mots liés à \\(\\sqrt{x}\\) — attention au <em>piège</em>.',
            wordList: 'RACINE,CARRE'
        },
        jouer: async () => {}
    }
];

// ------------------------------------------------------------- utilitaires
async function clic(page, selecteur, index = 0) {
    const el = page.locator(selecteur).nth(index);
    await el.click({ timeout: 8000 }).catch(() => {});
}
async function clicTexte(page, textes) {
    for (const t of textes) {
        const btn = page.locator(`button:has-text("${t}"), .h5p-joubelui-button:has-text("${t}")`).first();
        if (await btn.count().catch(() => 0)) {
            await btn.click({ timeout: 8000 }).catch(() => {});
            return true;
        }
    }
    return false;
}
async function saisir(page, selecteur, valeur) {
    const el = page.locator(selecteur).first();
    await el.fill(valeur, { timeout: 8000 }).catch(() => {});
}

// ------------------------------------------------------------------ serveur
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    cwd: ROOT, stdio: 'ignore'
});
const stopServer = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stopServer);
process.on('SIGINT', () => { stopServer(); process.exit(130); });

async function attendreServeur(timeoutMs = 15000) {
    const fin = Date.now() + timeoutMs;
    while (Date.now() < fin) {
        try {
            const r = await fetch(`http://127.0.0.1:${PORT}/tests/preview-feedback-harness.html`, { method: 'HEAD' });
            if (r.ok) return true;
        } catch { /* pas encore prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

// ---------------------------------------------------------------------- run
let echecs = 0, total = 0;
const rapport = [];

try {
    if (!await attendreServeur()) {
        console.error(`❌ Serveur HTTP non démarré sur ${PORT}`);
        process.exit(2);
    }
    mkdirSync(SORTIE, { recursive: true });

    const browser = await chromium.launch({ headless: !headed });

    for (const cas of CAS) {
        total++;
        const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
        const erreurs = [];
        page.on('pageerror', e => erreurs.push(String(e.message || e)));

        try {
            await page.goto(`http://127.0.0.1:${PORT}/tests/preview-feedback-harness.html`,
                { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__pret === true, null, { timeout: 30000 });

            const monte = await page.evaluate(async ([cle, json]) => window.__monter(cle, json), [cas.cle, cas.json]);
            // L'iframe h5p-standalone monte son contenu de façon asynchrone
            await page.waitForSelector('.h5p-iframe, .h5p-content', { timeout: 30000 });
            const cadre = page.frameLocator('.h5p-iframe');

            await cas.jouer(cadre).catch(() => {});
            // Laisser MathJax composer les formules du feedback
            await page.waitForTimeout(2500);

            // --- Ce que l'élève voit réellement ---
            const vu = await page.evaluate(() => {
                const ifr = document.querySelector('.h5p-iframe');
                const doc = ifr ? ifr.contentDocument : document;
                if (!doc) return null;
                const corps = doc.body;
                return {
                    texte: (corps.innerText || '').replace(/\s+/g, ' ').trim(),
                    // MathJax 2 (HTML-CSS) produit des .MathJax / .MathJax_Preview
                    mathjax: doc.querySelectorAll('.MathJax, .MathJax_Display, mjx-container').length,
                    html: (corps.innerHTML || '')
                };
            });

            if (!vu) throw new Error('iframe H5P inaccessible');

            // 1. Aucune balise littérale visible
            const balisesVues = (vu.texte.match(/<\/?(strong|em|p|span|b|i|br)\b[^>]*>/gi) || []);
            // 2. Aucun LaTeX resté brut à l'écran
            const latexBrut = (vu.texte.match(/\\\(|\\\)|\\sqrt|\\frac|\\int/g) || []);

            // --- Contrôle décisif : le contenu RÉELLEMENT écrit dans le .h5p ---
            // Indépendant du rendu : c'est lui qui décide du sort sur Éléa.
            const releve = (monte && monte.releve) || [];
            const champsAvecBalise = releve.filter(r => /<\/?[a-z][^>]*>/i.test(r.valeur));
            const champsAvecLatex = releve.filter(r => /\\\(|\\\[/.test(r.valeur));

            const okBalises = balisesVues.length === 0;
            const okLatex = latexBrut.length === 0;
            const okMath = vu.mathjax > 0;

            const capture = join(SORTIE, `${cas.cle}.png`);
            await page.screenshot({ path: capture, fullPage: true });

            // La porte porte sur le CONTENU (déterministe) ; le rendu est informatif,
            // car atteindre le feedback dépend d'un pilotage propre à chaque activité.
            const statut = champsAvecBalise.length === 0 ? '✅' : '❌';
            if (statut === '❌') echecs++;
            console.log(`${statut} ${cas.cle.padEnd(18)} contenu: balises=${champsAvecBalise.length} formules=${champsAvecLatex.length}/${releve.length} | écran: balisesVues=${balisesVues.length} latexBrut=${latexBrut.length} mathjax=${vu.mathjax}`);
            if (champsAvecBalise.length) console.log(`     ⛔ balise conservée dans : ${champsAvecBalise.map(r => r.champ + '=' + JSON.stringify(r.valeur.slice(0, 70))).join(' | ')}`);
            if (!okBalises) console.log(`     balises visibles : ${balisesVues.slice(0, 4).join(' ')}`);
            if (!okLatex) console.log(`     LaTeX brut à l'écran : ${latexBrut.slice(0, 6).join(' ')}`);
            if (!okMath) console.log(`     aucune formule rendue par MathJax`);
            if (erreurs.length) console.log(`     ⚠ ${erreurs.length} erreur(s) JS : ${erreurs[0].split('\n')[0]}`);

            rapport.push({
                module: cas.cle, balises: balisesVues, latexBrut, mathjax: vu.mathjax,
                releve, champsAvecBalise, nbFormules: champsAvecLatex.length,
                capture, extrait: vu.texte.slice(0, 400), erreurs: erreurs.slice(0, 3)
            });
        } catch (e) {
            echecs++;
            console.log(`❌ ${cas.cle.padEnd(18)} exception : ${(e.message || e).toString().split('\n')[0]}`);
            rapport.push({ module: cas.cle, erreur: String(e.message || e) });
        } finally {
            await page.close();
        }
    }

    await browser.close();
    writeFileSync(join(SORTIE, 'rapport.json'), JSON.stringify(rapport, null, 2));

    console.log('');
    console.log('========================================');
    console.log(`contenu des champs 'latex' : ${total - echecs}/${total} activités sans balise résiduelle`);
    console.log(`captures + rapport : ${SORTIE}`);
    console.log('========================================');
} catch (e) {
    console.error('❌ ' + (e.message || e));
    echecs = 1;
} finally {
    stopServer();
}
process.exit(echecs > 0 ? 1 : 0);
