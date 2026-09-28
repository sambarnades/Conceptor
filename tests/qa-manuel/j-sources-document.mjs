/**
 * (j) Le document joint arrive-t-il dans le prompt ENVOYÉ à l'IA ?
 *
 * Bug d'origine (signalé en prod, 25-09-2026) : une activité générée « en un clic »
 * ignorait le document de l'enseignant. Le document n'était pas mal compris : il
 * n'était pas ENVOYÉ. Deux causes cumulées :
 *  1. `ocr.js#updateRagArea()` écrit la zone des sources par `innerHTML` (dépôt,
 *     retrait, import d'URL), ce qui n'émet aucun `input`. Or c'est sur `input` que
 *     `ui.js#handleContextChange` régénère les prompts et purge ceux mis en session ;
 *  2. `restoreModalDataFromSession()` rendait à la réouverture d'une tuile le prompt
 *     sauvegardé à sa fermeture, et écrasait le prompt reconstruit.
 * Geste fautif typique : ouvrir la tuile pour voir, la refermer, déposer le document,
 * rouvrir, générer → prompt SANS section SOURCES. Pire : remplacer un document par un
 * autre → l'IA recevait l'ANCIEN.
 *
 * Quatre défauts voisins, trouvés pendant l'enquête, sont verrouillés ici aussi :
 *  3. en mode Rapide la zone est masquée (`display: none`) et `innerText` y retombe
 *     sur `textContent` : les lignes du document partaient recollées bout à bout ;
 *  4. ajouter un fichier reconstruisait la zone à partir des seuls fichiers et
 *     effaçait le texte que l'enseignant y avait collé ;
 *  5. document bien envoyé, le modèle rendait parfois un « Glisser les mots » vidé de
 *     son sens (la capture d'origine : `*emph(choisis un registre parmi…)*` ×4) ;
 *     `h5p/controle-sortie-ia.js` le repère et la génération retente une fois, sans perdre la première sortie si le second essai tombe en panne (S9, S10) ;
 *  6. un PDF arrivait sur une seule ligne par page (S11).
 *
 * Le webhook LLM est BOUCHONNÉ : on capture le corps de la soumission, aucun appel
 * réel n'est émis. L'oracle est le PROMPT ENVOYÉ, pas le textarea affiché.
 *
 * Prérequis : `python3 tests/serveur-statique.py 8010` à la RACINE du dépôt.
 * Usage     : node tests/qa-manuel/j-sources-document.mjs
 *             node tests/qa-manuel/j-sources-document.mjs --contre-epreuve
 *
 * La contre-épreuve désarme chaque correctif TOUR À TOUR — en réécrivant le module
 * SERVI au navigateur (`page.route`), jamais le fichier sur disque — et exige le
 * ROUGE sur le scénario qu'il protège.
 */
import { chromium } from '../roundtrip/node_modules/playwright/index.mjs';

const URL_APP = 'http://localhost:8010/index.html';
const MODULE = 'DragTheWords';
const CONTRE = process.argv.includes('--contre-epreuve');

const doc = (nom, marqueur, corps) => ({ name: nom, mimeType: 'text/plain', buffer: Buffer.from(`${marqueur}. ${corps}\n`.repeat(2)) });
const DOC_A = doc('cours-A.txt', 'MARQUEUR-DOC-A', 'Le village de Trelzac compte trois moulins : Gaspard, Berthe et Ondine.');
const DOC_B = doc('cours-B.txt', 'MARQUEUR-DOC-B', 'La lagune de Vessanne abrite des flamants, des aigrettes et des sternes.');
const DOC_LIGNES = { name: 'lignes.txt', mimeType: 'text/plain', buffer: Buffer.from('Ligne un du cours\nLigne deux du cours\n\nParagraphe trois') };

// ── Désarmements : [fichier servi, texte du correctif, texte désarmé] ─────────────
const DESARMEMENTS = {
    'événement input du corpus': ['js/services/ocr.js', "ocrOutput.dispatchEvent(new Event('input', { bubbles: true }));", ''],
    'garde de contexte à la restauration': ['js/ui/ui.js', 'savedCtx === signatureContexte()', 'true'],
    'lecture du corpus masqué': ['js/core/texte-affiche.js', "if (typeof el.getClientRects === 'function' && el.getClientRects().length > 0) {", 'if (true) {'],
    'relecture de la zone avant reconstruction': ['js/services/ocr.js', 'const texteSaisi = relireSaisies();', "const texteSaisi = '';"],
    'second essai sur sortie inutilisable': ['js/ui/ui.js', 'if (!defauts.length) return contenu;', 'return contenu;'],
    'repli sur la première sortie': ['js/ui/ui.js', 'if (isCancellation(e)) throw e;', 'throw e;'],
    'fins de ligne du PDF': ['js/services/ocr.js', "(item.hasEOL ? '\\n' : ' ')", "' '"],
};

// ── Outillage ──────────────────────────────────────────────────────────────────
/** Réponses successives du modèle (S9, S10) ; vide, ou `null` à ce rang = la soumission échoue (503). */
let reponsesModele = [];

async function page(nav, desarme) {
    const p = await nav.newPage({ viewport: { width: 1500, height: 1000 } });
    p.on('pageerror', e => console.log('  [pageerror]', String(e).slice(0, 180)));
    const envois = [];
    await p.route('**/webhook/caramel/llm/submit-*', route => {
        envois.push(JSON.parse(route.request().postData() || '{}'));
        if (!reponsesModele.length || reponsesModele[envois.length - 1] === null) {
            return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ taskId: `qa-j-${envois.length}` }) });
    });
    await p.route('**/webhook/caramel/llm/result-*', route => {
        const n = Number(new URL(route.request().url()).searchParams.get('taskId').split('-').pop());
        const content = reponsesModele[Math.min(n, reponsesModele.length) - 1];
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'done', content, model: 'bouchon' }) });
    });
    if (desarme) {
        const [fichier, avant, apres] = DESARMEMENTS[desarme];
        await p.route(`**/${fichier}*`, async route => {
            const reponse = await route.fetch();
            const source = await reponse.text();
            if (!source.includes(avant)) throw new Error(`correctif introuvable dans ${fichier} : « ${avant} »`);
            return route.fulfill({ response: reponse, body: source.split(avant).join(apres) });
        });
    }
    await p.goto(URL_APP);
    await p.waitForSelector(`[data-module="${MODULE}"]`, { timeout: 15000 });
    await p.click('.mode-tab[data-mode="advanced"]');
    await p.fill('#qui', 'Professeur de français');
    await p.fill('#quoi', 'Le patrimoine local');
    await p.waitForTimeout(800); // debounce de handleContextChange (500 ms)
    return { p, envois };
}
const tuile = async p => { await p.click(`[data-module="${MODULE}"]`); await p.waitForTimeout(700); };
// Même appel que la croix « × » de la modale (onclick="closeSidebar()").
const fermer = async p => { await p.evaluate(() => window.closeSidebar()); await p.waitForTimeout(700); };
const retirerPremier = async p => { await p.evaluate(() => document.querySelector('#pdf-tags-container .remove-tag-btn').click()); await p.waitForTimeout(900); };
async function deposer(p, fichier) {
    await p.setInputFiles('#pdfUpload', fichier);
    const debut = fichier.buffer.toString().slice(0, 12);
    await p.waitForFunction(d => document.getElementById('ocr-output').textContent.includes(d), debut, { timeout: 15000 });
    await p.waitForTimeout(900);
}
async function generer(p, envois) {
    const n = envois.length;
    await p.click(`#generate-llm-${MODULE}`);
    for (let i = 0; i < 50 && envois.length === n; i++) await p.waitForTimeout(100);
    return envois.length > n ? envois.at(-1).prompt || '' : null;
}
/** Section SOURCES du prompt (vide si absente). */
const sources = prompt => {
    const i = (prompt || '').indexOf('# SOURCES');
    return i < 0 ? '' : prompt.slice(i, prompt.indexOf('# STRUCTURE', i));
};

// Sortie de la capture d'origine (consigne à la place de la réponse), et une sortie saine.
const JSON_CAPTURE = JSON.stringify({ taskDescription: 'Complète le texte.', textField:
    'La mer relève du registre *\\emph(choisis un registre parmi \\`poésie\\`, \\`lyrique\\` )*.\n'
    + 'Baudelaire illustre le registre *\\emph(choisis un registre parmi \\`poésie\\`, \\`lyrique\\` )*.\n'
    + 'Zola relève du registre *\\emph(choisis un registre parmi \\`poésie\\`, \\`lyrique\\` )*.\n' });
const JSON_CORRECT = JSON.stringify({ taskDescription: 'Complète le texte.', textField:
    'La mer relève du registre *réaliste*.\nBaudelaire illustre le registre *lyrique*.\nZola relève du registre *polémique*.\n' });
/**
 * Lance « Générer en un clic » et renvoie ce que le champ JSON de la tuile a reçu en
 * DERNIER — sortie retenue, ou message d'échec : c'est à l'appelant d'en juger. Le
 * champ est relevé PENDANT la génération : une génération réussie referme la tuile,
 * et le textarea disparaît avec elle.
 */
async function genererEtRelever(p) {
    await p.evaluate(() => {
        window.__qaJson = '';
        window.__qaReleve = setInterval(() => {
            const v = document.getElementById('dragWordJsonInput')?.value;
            if (v) window.__qaJson = v;
        }, 25);
    });
    await p.click(`#generate-llm-${MODULE}`);
    const marmite = p.locator('#caramel-animation-overlay');
    await marmite.waitFor({ state: 'visible', timeout: 10000 });
    await marmite.waitFor({ state: 'hidden', timeout: 40000 });
    return p.evaluate(() => { clearInterval(window.__qaReleve); return window.__qaJson; });
}

// ── Scénarios : chacun renvoie [conforme, détail] ───────────────────────────────
const SCENARIOS = {
    'S1 dépôt, puis ouverture de la tuile': async ({ p, envois }) => {
        await deposer(p, DOC_A); await tuile(p);
        const s = sources(await generer(p, envois));
        return [s.includes('MARQUEUR-DOC-A'), s.slice(0, 120)];
    },
    'S2 tuile ouverte pendant le dépôt': async ({ p, envois }) => {
        await tuile(p); await deposer(p, DOC_A);
        const s = sources(await generer(p, envois));
        return [s.includes('MARQUEUR-DOC-A'), s.slice(0, 120) || '(aucune section SOURCES)'];
    },
    'S3 tuile ouverte, refermée, dépôt, réouverture': async ({ p, envois }) => {
        await tuile(p); await fermer(p); await deposer(p, DOC_A); await tuile(p);
        const s = sources(await generer(p, envois));
        return [s.includes('MARQUEUR-DOC-A'), s.slice(0, 120) || '(aucune section SOURCES)'];
    },
    'S4 document A remplacé par B': async ({ p, envois }) => {
        await deposer(p, DOC_A); await tuile(p); await generer(p, envois); await fermer(p);
        await retirerPremier(p); await deposer(p, DOC_B); await tuile(p);
        const s = sources(await generer(p, envois));
        return [s.includes('MARQUEUR-DOC-B') && !s.includes('MARQUEUR-DOC-A'), s.slice(0, 160)];
    },
    'S5 seul document retiré': async ({ p, envois }) => {
        await deposer(p, DOC_A); await tuile(p); await fermer(p); await retirerPremier(p); await tuile(p);
        const pr = await generer(p, envois);
        return [pr !== null && !pr.includes('MARQUEUR-DOC-A') && !sources(pr), sources(pr).slice(0, 120)];
    },
    'S6 texte collé, puis fichier déposé': async ({ p, envois }) => {
        await p.click('#ocr-output');
        await p.keyboard.insertText('MARQUEUR-COLLE ligne 1'); await p.keyboard.press('Enter');
        await p.keyboard.insertText('MARQUEUR-COLLE ligne 2');
        await p.waitForTimeout(900);
        await deposer(p, DOC_A); await tuile(p);
        const s = sources(await generer(p, envois));
        return [s.includes('MARQUEUR-COLLE ligne 1\nMARQUEUR-COLLE ligne 2') && s.includes('MARQUEUR-DOC-A'), s.slice(0, 200)];
    },
    'S7 passage en mode Rapide après une ouverture en Avancé': async ({ p, envois }) => {
        await p.fill('#niveau', 'Classe de 3e'); await p.waitForTimeout(800);
        await tuile(p); await fermer(p);
        await p.click('.mode-tab[data-mode="simple"]'); await p.waitForTimeout(300);
        await tuile(p);
        const pr = await generer(p, envois);
        return [pr !== null && !pr.includes('Classe de 3e'), 'le prompt Rapide ne doit plus porter le niveau du mode Avancé'];
    },
    'S8 mode Rapide : lignes du document conservées': async ({ p, envois }) => {
        await deposer(p, DOC_LIGNES);
        await p.click('.mode-tab[data-mode="simple"]'); await p.waitForTimeout(300);
        await tuile(p);
        const s = sources(await generer(p, envois));
        return [s.includes('Ligne un du cours\nLigne deux du cours\n\nParagraphe trois'), s.slice(0, 160)];
    },
    // Le document part bien, mais le modèle rend un « Glisser les mots » vidé de son
    // sens (la sortie de la capture d'origine) : second essai, qui rend une sortie saine.
    'S9 sortie IA inutilisable : second essai': async ({ p, envois }) => {
        reponsesModele = [JSON_CAPTURE, JSON_CORRECT];
        try {
            await deposer(p, DOC_A); await tuile(p);
            const json = await genererEtRelever(p);
            return [envois.length === 2 && json.includes('*réaliste*') && !json.includes('emph'),
                `${envois.length} soumission(s), JSON retenu : ${json.slice(0, 90)}`];
        } finally {
            reponsesModele = [];
        }
    },
    'S10 second essai en panne : la première sortie reste': async ({ p, envois }) => {
        reponsesModele = [JSON_CAPTURE, null];
        try {
            await deposer(p, DOC_A); await tuile(p);
            const json = await genererEtRelever(p);
            return [envois.length === 2 && json.includes('emph'),
                `${envois.length} soumission(s), JSON retenu : ${json.slice(0, 90)}`];
        } finally {
            reponsesModele = [];
        }
    },
    // Un PDF sortait sur UNE ligne par page (fragments PDF.js joints par une espace,
    // `hasEOL` ignoré) : titres, listes et lignes de tableau collés bout à bout.
    'S11 PDF : une ligne du document = une ligne des SOURCES': async ({ p, envois }) => {
        const rendu = await p.context().browser().newPage();
        await rendu.setContent('<meta charset="utf-8"><h1>Le cycle de l’eau</h1><p>Le soleil chauffe la mer.</p><ul><li>Évaporation</li><li>Condensation</li></ul>');
        const pdf = await rendu.pdf();
        await rendu.close();
        await p.setInputFiles('#pdfUpload', { name: 'cycle.pdf', mimeType: 'application/pdf', buffer: pdf });
        await p.waitForFunction(() => document.getElementById('ocr-output').textContent.includes('Condensation'), null, { timeout: 30000 });
        await p.waitForTimeout(900);
        await tuile(p);
        const s = sources(await generer(p, envois));
        // Chromium dessine les puces sans les écrire : le texte attendu n'en porte pas.
        return [s.includes('Le cycle de l’eau\nLe soleil chauffe la mer.\nÉvaporation\nCondensation'), s.slice(s.indexOf('---'), s.indexOf('---') + 160)];
    },
};

// Scénario que chaque désarmement doit faire virer au rouge.
const CIBLES = {
    'événement input du corpus': 'S2 tuile ouverte pendant le dépôt',
    'garde de contexte à la restauration': 'S7 passage en mode Rapide après une ouverture en Avancé',
    'lecture du corpus masqué': 'S8 mode Rapide : lignes du document conservées',
    'relecture de la zone avant reconstruction': 'S6 texte collé, puis fichier déposé',
    'second essai sur sortie inutilisable': 'S9 sortie IA inutilisable : second essai',
    'repli sur la première sortie': 'S10 second essai en panne : la première sortie reste',
    'fins de ligne du PDF': 'S11 PDF : une ligne du document = une ligne des SOURCES',
};

async function jouer(nav, nom, desarme = null) {
    const ctx = await page(nav, desarme);
    try {
        return await SCENARIOS[nom](ctx);
    } catch (e) {
        // Un geste qui échoue (délai, sélecteur) est un KO du scénario, pas un plantage
        // du banc : les suivants doivent quand même tourner.
        return [false, `exception : ${String(e.message || e).split('\n')[0]}`, true];
    } finally {
        await ctx.p.close();
    }
}

const nav = await chromium.launch();
let echecs = 0;
try {
    if (!CONTRE) {
        for (const nom of Object.keys(SCENARIOS)) {
            const [ok, detail] = await jouer(nav, nom);
            console.log(`  ${ok ? 'OK' : 'KO'}   ${nom}`);
            if (!ok) { echecs++; console.log('        ', JSON.stringify(detail)); }
        }
        console.log(echecs ? `\n❌ (j) sources du prompt : ${echecs} échec(s)` : '\n✅ (j) sources du prompt : conforme');
    } else {
        console.log('### CONTRE-ÉPREUVE — chaque correctif désarmé doit donner le ROUGE');
        for (const [desarme, nom] of Object.entries(CIBLES)) {
            const [ok, detail, exception] = await jouer(nav, nom, desarme);
            // Une exception n'est pas un ROUGE : le désarmement a pu casser la page
            // (correctif introuvable, module non chargé) au lieu de révéler le défaut.
            const libelle = exception ? `KO   exception (${detail})` : ok ? 'KO   reste VERT' : 'OK   vire au ROUGE';
            console.log(`  ${libelle} — ${desarme} → ${nom}`);
            if (ok || exception) echecs++;
        }
        console.log(echecs ? `\n❌ contre-épreuve : ${echecs} désarmement(s) sans effet` : '\n✅ contre-épreuve : chaque correctif est nécessaire');
    }
} finally {
    await nav.close();
}
process.exit(echecs ? 1 : 0);
