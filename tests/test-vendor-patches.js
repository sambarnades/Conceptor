/**
 * @file Patchs appliqués aux bibliothèques vendor — garde anti-écrasement.
 *
 * Cinq fichiers de `js/vendor/` sont PATCHÉS à la main. CLAUDE.md le dit pour chacun :
 * « à réappliquer à chaque mise à jour ». Or une mise à jour vendor est un simple
 * remplacement de fichier : le patch disparaît SANS BRUIT, aucun test ne le remarquait,
 * et la panne n'apparaît qu'à l'aperçu d'une activité — souvent chez l'enseignant.
 *
 * Ce que chaque patch évite, s'il est perdu :
 *
 *  1. `h5p-standalone/frame.bundle.js` — regex de `H5P.getPath` élargie aux `data:image/`,
 *     `data:audio/`, `data:video/` et `blob:`. Sans lui, les images base64 de l'aperçu ET
 *     les médias embarqués d'« Image interactive » (servis en `blob:`) ne se chargent pas.
 *     Restriction volontaire aux types média : un `data:text/html` ne doit PAS passer.
 *
 *  2-3. `H5P.Video-1.6` et `1.5` — `host: youtube-nocookie.com` + `ORIGIN` pris sur
 *     `window.top.location.href`. En aperçu, le contenu tourne dans un iframe
 *     `about:blank` ; sans le patch, YouTube renvoie « Erreur 153 » depuis fin 2025.
 *
 *  4-5. `H5P.DragQuestion-1.15` et `H5P.Components-1.0` — exclusions `:not(...)` pour
 *     MathJax. Sans elles, la règle de thème force `display`/`width` sur TOUS les spans
 *     des étiquettes : les formules LaTeX du Glisser-déposer explosent hors de leur tuile.
 *
 * Le test vérifie AUSSI que les versions déclarées dans `core/lib-loader.js` sont bien
 * celles présentes sur le disque : un patch appliqué à une version qui n'est plus
 * chargée protégerait un fichier mort.
 */

let passCount = 0;
let failCount = 0;
const results = [];
let _ctx = { step: 0, stepName: '' };

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, step: _ctx.step, stepName: _ctx.stepName };
    if (!condition) { entry.diagnostic = diagnostic; failCount++; }
    else passCount++;
    results.push(entry);
}
function beginStep(n, name) { _ctx = { step: n, stepName: name }; }
function endStep() { _ctx = { step: 0, stepName: '' }; }

export const STEP_NAMES = {
    1: 'h5p-standalone — data: et blob: dans getPath',
    2: 'H5P.Video — YouTube sans cookie (erreur 153)',
    3: 'H5P.DragQuestion / Components — formules LaTeX des étiquettes',
    4: 'Cohérence des versions vendor chargées'
};

export const STEP_DESCRIPTIONS = {
    1: 'La regex accepte data:image|audio|video et blob:, et REFUSE data:text/html.',
    2: 'host youtube-nocookie + ORIGIN pris sur window.top, en 1.5 comme en 1.6.',
    3: 'Les exclusions :not(MathJax) / :not(mjx-container) sont présentes dans les 2 CSS.',
    4: 'Les versions patchées sont bien celles que lib-loader charge réellement.'
};

const BASE = new URL('../', new URL(import.meta.url)).href;

async function lire(chemin) {
    try {
        const r = await fetch(BASE + chemin);
        if (!r.ok) return { ERREUR: `HTTP ${r.status}` };
        return await r.text();
    } catch (e) {
        return { ERREUR: String(e.message || e) };
    }
}
const estErreur = (v) => !!(v && typeof v === 'object' && 'ERREUR' in v);

// ============================================================================
// ÉTAPE 1 — h5p-standalone
// ============================================================================

const CHEMIN_STANDALONE = 'js/vendor/h5p-standalone/3.8.2/frame.bundle.js';

async function runStep1_Standalone() {
    beginStep(1, STEP_NAMES[1]);

    const src = await lire(CHEMIN_STANDALONE);
    if (estErreur(src)) {
        assert(false, `[1.0] ${CHEMIN_STANDALONE} est lisible`, src);
        endStep(); return;
    }

    // La regex patchée, telle qu'elle doit apparaître dans le bundle.
    const MARQUEUR = '^([a-z0-9]+:\\/\\/|blob:|data:(image|audio|video)';
    assert(src.includes(MARQUEUR),
        '[1.1] La regex de H5P.getPath accepte blob: et data:(image|audio|video)',
        {
            attendu: MARQUEUR,
            consequence: 'sans ce patch, les images base64 de l\'aperçu et les médias '
                + 'audio/vidéo d\'« Image interactive » (servis en blob:) ne se chargent pas'
        });

    // Le patch doit rester RESTREINT aux types média : accepter `data:` tout court
    // rouvrirait la porte à un `data:text/html` (audit 2026-06).
    assert(!/\^\(\[a-z0-9\]\+:\\\/\\\/\|blob:\|data:\)/.test(src),
        '[1.2] Le patch reste restreint aux types média (pas de data: générique)',
        { risque: 'un data:text/html ne doit jamais être traité comme une URL absolue' });

    // Vérification fonctionnelle : on rejoue la regex extraite sur des cas réels.
    const m = src.match(/\^\(\[a-z0-9\]\+:\\\/\\\/\|blob:\|data:\([^)]*\)[^)]*\)/);
    assert(!!m, '[1.3] La regex patchée est extractible du bundle');
    if (m) {
        let re = null;
        try { re = new RegExp(m[0], 'i'); } catch (e) { /* signalé ci-dessous */ }
        assert(!!re, '[1.4] La regex extraite est compilable', { source: m[0] });
        if (re) {
            const cas = [
                ['https://exemple.org/a.png', true, 'URL absolue'],
                ['blob:http://localhost/abc', true, 'blob: (médias Image interactive)'],
                ['data:image/png;base64,iVBOR', true, 'image base64 de l\'aperçu'],
                ['data:audio/mpeg;base64,SUQz', true, 'audio embarqué'],
                ['data:video/mp4;base64,AAAA', true, 'vidéo embarquée'],
                ['data:text/html,<script>', false, 'HTML en data: — doit être REFUSÉ'],
                ['data:application/json,{}', false, 'JSON en data: — doit être REFUSÉ'],
                ['images/photo.png', false, 'chemin relatif — doit rester relatif']
            ];
            for (const [valeur, attendu, quoi] of cas) {
                assert(re.test(valeur) === attendu,
                    `[1.5] getPath ${attendu ? 'accepte' : 'refuse'} ${quoi}`,
                    { valeur, attendu, obtenu: re.test(valeur) });
            }
        }
    }

    endStep();
}

// ============================================================================
// ÉTAPE 2 — H5P.Video (YouTube)
// ============================================================================

const VIDEOS = [
    'js/vendor/h5p-libs/H5P.Video-1.6/scripts/youtube.js',
    'js/vendor/h5p-libs/H5P.Video-1.5/scripts/youtube.js'
];

async function runStep2_Youtube() {
    beginStep(2, STEP_NAMES[2]);

    for (const chemin of VIDEOS) {
        const version = chemin.match(/H5P\.Video-([\d.]+)/)[1];
        const src = await lire(chemin);
        if (estErreur(src)) {
            assert(false, `[2.0] ${chemin} est lisible`, src);
            continue;
        }

        assert(src.includes("host: 'https://www.youtube-nocookie.com'")
            || src.includes('host: "https://www.youtube-nocookie.com"'),
            `[2.1] H5P.Video ${version} : le lecteur cible youtube-nocookie.com`,
            {
                consequence: 'sans ce patch, YouTube refuse l\'embed depuis un iframe '
                    + 'about:blank → « Erreur 153 / configuration du lecteur vidéo » (Safari surtout)'
            });

        assert(src.includes('window.top.location.href'),
            `[2.2] H5P.Video ${version} : ORIGIN est pris sur window.top`,
            {
                consequence: 'en aperçu, window.location.href vaut "about:blank" → l\'ORIGIN '
                    + 'natif valait undefined et l\'embed était rejeté'
            });

        // Le patch ne doit pas avoir laissé l'ancien host en place ailleurs.
        const occurrencesWww = (src.match(/host:\s*['"]https:\/\/www\.youtube\.com['"]/g) || []).length;
        assert(occurrencesWww === 0,
            `[2.3] H5P.Video ${version} : plus aucun host www.youtube.com résiduel`,
            { occurrences: occurrencesWww });
    }

    endStep();
}

// ============================================================================
// ÉTAPE 3 — CSS des formules dans le Glisser-déposer
// ============================================================================

const CSS_MATH = [
    ['js/vendor/h5p-libs/H5P.DragQuestion-1.15/css/dragquestion.css', 'H5P.DragQuestion 1.15'],
    ['js/vendor/h5p-libs/H5P.Components-1.0/dist/h5p-components.css', 'H5P.Components 1.0']
];

async function runStep3_CssMath() {
    beginStep(3, STEP_NAMES[3]);

    for (const [chemin, nom] of CSS_MATH) {
        const src = await lire(chemin);
        if (estErreur(src)) {
            assert(false, `[3.0] ${chemin} est lisible`, src);
            continue;
        }

        assert(src.includes(':not(mjx-container)'),
            `[3.1] ${nom} : exclusion :not(mjx-container) présente`,
            {
                consequence: 'sans elle, la règle de thème force display/width sur TOUS les spans '
                    + 'des étiquettes → les formules LaTeX explosent hors de leur tuile'
            });
        assert(src.includes(':not(mjx-container *)'),
            `[3.2] ${nom} : exclusion :not(mjx-container *) présente (descendants)`);

        // DragQuestion porte en plus les exclusions MathJax 2 (spans imbriqués HTML-CSS).
        if (nom.startsWith('H5P.DragQuestion')) {
            assert(src.includes(':not([class^="MathJax"])'),
                `[3.3] ${nom} : exclusion :not([class^="MathJax"]) présente (MathJax 2)`);
            assert(src.includes(':not([class^="MathJax"] *)'),
                `[3.4] ${nom} : exclusion :not([class^="MathJax"] *) présente (descendants)`);
        }
    }

    endStep();
}

// ============================================================================
// ÉTAPE 4 — Les versions patchées sont bien celles qui sont chargées
// ============================================================================

async function runStep4_Versions() {
    beginStep(4, STEP_NAMES[4]);

    const loader = await lire('js/core/lib-loader.js');
    if (estErreur(loader)) {
        assert(false, '[4.0] js/core/lib-loader.js est lisible', loader);
        endStep(); return;
    }

    // h5p-standalone : la version patchée doit être celle référencée par le chargeur.
    const versionPatchee = CHEMIN_STANDALONE.match(/h5p-standalone\/([\d.]+)\//)[1];
    assert(loader.includes(`h5p-standalone/${versionPatchee}`),
        `[4.1] lib-loader charge bien h5p-standalone ${versionPatchee} (la version patchée)`,
        {
            versionPatchee,
            risque: 'si le chargeur pointe une autre version, le patch protège un fichier mort'
        });

    // Chaque fichier patché doit exister — un renommage de dossier casserait le patch.
    for (const chemin of [CHEMIN_STANDALONE, ...VIDEOS, ...CSS_MATH.map(c => c[0])]) {
        let present = false;
        try { present = (await fetch(BASE + chemin, { method: 'HEAD' })).ok; } catch { /* absent */ }
        assert(present, `[4.2] Le fichier patché existe : ${chemin}`);
    }

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    console.log('=== Patchs vendor ===');

    await runStep1_Standalone();
    await runStep2_Youtube();
    await runStep3_CssMath();
    await runStep4_Versions();

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
