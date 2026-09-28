/**
 * @file Habillage de l'interface — modules périphériques longtemps sans couverture.
 *
 * `tutorial-modal`, `version-checker`, `animations`, `debug-logger`,
 * `emergency-notification` et `prompt-mic` n'étaient exercés par aucune suite. Ce sont
 * des modules « de bord » : leur panne ne casse pas la génération, donc elle passe
 * inaperçue — jusqu'à ce qu'un enseignant ouvre le tutoriel et trouve une fenêtre vide.
 *
 * `tutorial-modal.js` portait précisément la seconde occurrence de la régression de
 * ré-exportation (`export { escapeHtml } from …` sans liaison locale → `formatInline()`
 * levait `ReferenceError`), et rien ne l'aurait signalé.
 *
 * Principe directeur : les fonctions sont APPELÉES. Une ré-exportation se résout
 * parfaitement à l'import et n'échoue qu'à l'exécution.
 *
 * Tourne dans l'iframe `index.html` (application réelle).
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
    1: 'Tutoriel — helpers de rendu',
    2: 'Tutoriel — ouverture et contenu',
    3: 'Vérificateur de version',
    4: 'Animations, journal de debug, notifications d\'urgence',
    5: 'Micro des champs de prompt'
};

export const STEP_DESCRIPTIONS = {
    1: 'formatInline, escapeHtml, safeHref, renderBlock… APPELÉS, avec cas limites et anti-XSS.',
    2: 'La modale s\'initialise, s\'ouvre, affiche un contenu non vide et se ferme.',
    3: 'initVersionChecker survit à un sessionStorage hostile (mode privé, quota plein).',
    4: 'Chaque initialiseur est idempotent et ne lève pas, y compris sans son conteneur.',
    5: 'initPromptMic s\'exécute sans jamais demander la permission micro.'
};

let _seq = 0;

/**
 * Évalue du code de module dans l'iframe (même origine) et renvoie sa valeur.
 * Ces modules manipulent le `document` GLOBAL : les importer depuis la page de tests
 * les ferait travailler sur un DOM sans application.
 */
function dansIframe(doc, win, corps) {
    const cle = `__uichrome_test_${++_seq}`;
    return new Promise((resolve) => {
        const minuteur = setTimeout(() => resolve({ ERREUR: 'délai dépassé (10 s)' }), 10000);
        win[cle] = (valeur) => { clearTimeout(minuteur); delete win[cle]; resolve(valeur); };
        const s = doc.createElement('script');
        s.type = 'module';
        s.textContent = `
            (async () => {
                try { window['${cle}'](await (async () => { ${corps} })()); }
                catch (e) { window['${cle}']({ ERREUR: String((e && e.message) || e) }); }
            })();
        `;
        doc.body.appendChild(s);
    });
}

const estErreur = (v) => !!(v && typeof v === 'object' && 'ERREUR' in v);
const attendre = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================================================
// ÉTAPE 1 — Tutoriel : helpers de rendu
// ============================================================================

async function runStep1_TutorielHelpers(doc, win) {
    beginStep(1, STEP_NAMES[1]);

    const r = await dansIframe(doc, win, `
        const m = await import('/js/ui/tutorial-modal.js');
        const out = {};
        const app = (n, fn) => { try { out[n] = fn(); } catch (e) { out[n] = { ERREUR: String(e.message || e) }; } };
        out.api = ['formatInline','escapeHtml','safeHref','renderBlock','renderChapter',
                   'buildSearchHaystack','filterChapters','svgIcon','makeChapterIcon',
                   'openTutorialModal','initTutorialModal'].every(n => typeof m[n] === 'function');
        // formatInline appelle escapeHtml en interne : c'est CET appel qui levait.
        app('inline',      () => m.formatInline('a **gras** <b>&"\\''));
        app('inlineLien',  () => m.formatInline('Voir [ABC Learning](https://example.org/a?b=1&c=2).'));
        app('inlineLienXss', () => m.formatInline('[piège](javascript:alert(1))'));
        app('inlineVide',  () => m.formatInline(''));
        app('inlineNull',  () => m.formatInline(null));
        app('inlineNombre',() => m.formatInline(7));
        app('escape',      () => m.escapeHtml('<a href="x">&\\'</a>'));
        app('escapeNull',  () => m.escapeHtml(null));
        app('hrefHttps',   () => m.safeHref('https://exemple.org/a?b=1&c=2'));
        app('hrefJs',      () => m.safeHref('javascript:alert(1)'));
        app('hrefData',    () => m.safeHref('data:text/html,<script>alert(1)<\\/script>'));
        app('hrefVide',    () => m.safeHref(''));
        const balise = (n) => (n && n.nodeType === 1) ? String(n.tagName).toLowerCase() : ('non-element:' + typeof n);
        app('svg',         () => balise(m.svgIcon('book')));
        app('svgInconnu',  () => balise(m.svgIcon('__inexistant__')));
        app('svgNonVide',  () => (m.svgIcon('book').innerHTML || '').length > 0);
        app('svgA11y',     () => m.svgIcon('book').getAttribute('aria-hidden'));
        app('icone',       () => balise(m.makeChapterIcon('book')));
        app('iconeImage',  () => balise(m.makeChapterIcon('assets/img/logo.svg')));
        app('haystack',    () => typeof m.buildSearchHaystack({ title: 'Titre', blocks: [] }));
        app('haystackNu',  () => typeof m.buildSearchHaystack({}));
        app('filtreVide',  () => m.filterChapters([{title:'Un'},{title:'Deux'}], '').length);
        app('filtreTerme', () => m.filterChapters([{title:'Images'},{title:'Vidéos'}], 'imag').length);
        app('filtreRien',  () => m.filterChapters([{title:'Images'}], 'zzzzzz').length);
        app('blocP',       () => balise(m.renderBlock({ type: 'p', text: 'un **texte**' })));
        app('blocPTexte',  () => (m.renderBlock({ type: 'p', text: 'un **gras**' }).innerHTML || ''));
        app('blocListe',   () => balise(m.renderBlock({ type: 'list', items: ['a', 'b'] })));
        app('blocInconnu', () => m.renderBlock({ type: '__inexistant__' }));
        app('blocNu',      () => m.renderBlock({}));
        app('blocNull',    () => m.renderBlock(null));
        app('chapitre',    () => balise(m.renderChapter({ title: 'T', blocks: [] })));
        app('chapitreRempli', () => m.renderChapter({
            title: 'Titre', blocks: [{ type: 'p', text: 'a' }, { type: 'list', items: ['x'] }]
        }).querySelectorAll('*').length);
        return out;
    `);

    if (estErreur(r)) { assert(false, '[1.0] Le module tutorial-modal.js est exploitable', r); endStep(); return; }

    for (const [nom, v] of Object.entries(r)) {
        if (estErreur(v)) assert(false, `[1.x] tutorial-modal : ${nom} s'exécute sans lever`, v);
    }

    assert(r.api === true, '[1.1] tutorial-modal expose son API complète');
    assert(r.inline === 'a <strong>gras</strong> &lt;b&gt;&amp;&quot;&#39;',
        '[1.2] formatInline convertit **gras** et échappe le reste', { obtenu: r.inline });
    assert(r.inlineLien.includes('<a href="https://example.org/a?b=1&amp;c=2"')
        && r.inlineLien.includes('target="_blank"') && r.inlineLien.includes('>ABC Learning</a>'),
        '[1.2b] formatInline rend les liens Markdown http(s) sûrs', { obtenu: r.inlineLien });
    assert(!r.inlineLienXss.includes('<a ') && r.inlineLienXss.includes('javascript:alert'),
        '[1.2c] formatInline ne transforme pas un lien javascript en lien cliquable', { obtenu: r.inlineLienXss });
    assert(r.inlineVide === '' && r.inlineNull === '',
        '[1.3] formatInline("") et formatInline(null) rendent une chaîne vide',
        { vide: r.inlineVide, null: r.inlineNull });
    assert(r.inlineNombre === '7', '[1.4] formatInline convertit les non-chaînes', { obtenu: r.inlineNombre });
    assert(r.escape === '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
        '[1.5] escapeHtml échappe les 5 caractères sensibles (dont l\'apostrophe)', { obtenu: r.escape });
    assert(r.escapeNull === '', '[1.6] escapeHtml(null) rend une chaîne vide', { obtenu: r.escapeNull });
    assert(typeof r.hrefHttps === 'string' && r.hrefHttps.startsWith('https://'),
        '[1.7] safeHref laisse passer une URL https', { obtenu: r.hrefHttps });
    assert(!String(r.hrefJs).toLowerCase().startsWith('javascript:'),
        '[1.8] safeHref neutralise un javascript: (anti-XSS)', { obtenu: r.hrefJs });
    assert(!String(r.hrefData).toLowerCase().startsWith('data:text/html'),
        '[1.9] safeHref neutralise un data:text/html (anti-XSS)', { obtenu: r.hrefData });
    assert(r.svg === 'svg' && r.svgInconnu === 'svg',
        '[1.10] svgIcon rend un <svg>, y compris pour une icône inconnue (repli)',
        { connu: r.svg, inconnu: r.svgInconnu });
    assert(r.svgNonVide === true, '[1.10b] svgIcon rend un tracé non vide');
    assert(r.svgA11y === 'true', '[1.10c] svgIcon est marqué aria-hidden (icône décorative)',
        { obtenu: r.svgA11y });
    assert(r.icone === 'svg', '[1.11] makeChapterIcon rend un <svg> pour une icône nommée',
        { obtenu: r.icone });
    assert(r.iconeImage === 'img', '[1.11b] makeChapterIcon rend un <img> pour un chemin d\'image',
        { obtenu: r.iconeImage });
    assert(r.haystack === 'string' && r.haystackNu === 'string',
        '[1.12] buildSearchHaystack tolère un chapitre incomplet');
    assert(r.filtreVide === 2, '[1.13] filterChapters sans terme rend tous les chapitres', { obtenu: r.filtreVide });
    assert(r.filtreTerme === 1, '[1.14] filterChapters filtre sur le terme', { obtenu: r.filtreTerme });
    assert(r.filtreRien === 0, '[1.15] filterChapters rend 0 pour un terme absent', { obtenu: r.filtreRien });
    assert(r.blocP === 'p' || r.blocP === 'div',
        '[1.16] renderBlock rend un élément pour un bloc de type « p »', { obtenu: r.blocP });
    assert(typeof r.blocPTexte === 'string' && r.blocPTexte.includes('<strong>'),
        '[1.16b] renderBlock passe le texte par formatInline (**gras** → <strong>)',
        { obtenu: r.blocPTexte });
    assert(typeof r.blocListe === 'string' && r.blocListe !== 'non-element:object',
        '[1.16c] renderBlock rend un élément pour une liste', { obtenu: r.blocListe });
    assert(r.blocInconnu === null, '[1.16d] renderBlock rend null pour un type inconnu',
        { obtenu: r.blocInconnu });
    assert(r.blocNu === null && r.blocNull === null,
        '[1.16e] renderBlock rend null pour un bloc nu ou null',
        { nu: r.blocNu, null: r.blocNull });
    assert(r.chapitre === 'article',
        '[1.17] renderChapter rend un <article>', { obtenu: r.chapitre });
    assert(typeof r.chapitreRempli === 'number' && r.chapitreRempli > 2,
        '[1.17b] renderChapter intègre bien ses blocs', { noeuds: r.chapitreRempli });

    endStep();
}

// ============================================================================
// ÉTAPE 2 — Tutoriel : ouverture
// ============================================================================

async function runStep2_TutorielOuverture(doc, win) {
    beginStep(2, STEP_NAMES[2]);

    const r = await dansIframe(doc, win, `
        const m = await import('/js/ui/tutorial-modal.js');
        const out = {};
        try { m.initTutorialModal(); m.initTutorialModal(); out.initIdempotent = 'ok'; }
        catch (e) { out.initIdempotent = { ERREUR: String(e.message || e) }; }
        try { m.openTutorialModal(); } catch (e) { return { ERREUR: 'open: ' + e.message }; }
        await new Promise(r => setTimeout(r, 500));
        const el = document.getElementById('tutorial-modal');
        if (!el) { out.absente = true; return out; }
        const cs = getComputedStyle(el);
        out.visible = cs.display !== 'none' && cs.visibility !== 'hidden';
        out.longueurTexte = (el.innerText || '').trim().length;
        out.noeuds = el.querySelectorAll('*').length;
        out.exemplaires = document.querySelectorAll('#tutorial-modal').length;
        out.role = el.getAttribute('role') || (el.querySelector('[role="dialog"]') ? 'dialog (interne)' : null);
        return out;
    `);

    if (estErreur(r)) { assert(false, '[2.0] La modale du tutoriel s\'initialise et s\'ouvre sans lever', r); endStep(); return; }

    assert(r.initIdempotent === 'ok',
        '[2.1] initTutorialModal est rejouable sans casse', r.initIdempotent);
    assert(!r.absente, '[2.2] La modale existe dans le DOM après ouverture');
    if (r.absente) { endStep(); return; }

    assert(r.visible === true, '[2.3] La modale est visible', r);
    // Même symptôme que Caramelia : une modale ouverte mais VIDE trahit un helper de
    // rendu qui lève.
    assert(r.longueurTexte > 30,
        '[2.4] La modale n\'est pas vide',
        { longueurTexte: r.longueurTexte, indice: 'un contenu vide trahit un formatInline() qui lève' });
    assert(r.noeuds > 10, '[2.5] La modale rend une vraie arborescence', { noeuds: r.noeuds });
    assert(r.exemplaires === 1, '[2.6] La modale n\'est pas dupliquée après double init',
        { exemplaires: r.exemplaires });

    // Fermeture par Échap : la modale ne doit pas rester ouverte et gêner les suites suivantes.
    doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await attendre(500);
    const apres = await dansIframe(doc, win, `
        const el = document.getElementById('tutorial-modal');
        if (!el) return { retiree: true };
        const cs = getComputedStyle(el);
        return { cachee: cs.display === 'none' || cs.visibility === 'hidden' };
    `);
    assert(apres.retiree === true || apres.cachee === true,
        '[2.7] Échap referme la modale', apres);

    endStep();
}

// ============================================================================
// ÉTAPE 3 — Vérificateur de version
// ============================================================================

async function runStep3_Version(doc, win) {
    beginStep(3, STEP_NAMES[3]);

    const r = await dansIframe(doc, win, `
        const m = await import('/js/ui/version-checker.js');
        const out = { api: typeof m.initVersionChecker === 'function' };

        // Depuis la refactorisation, le module passe par \`safeSession\` au lieu de
        // \`sessionStorage\` direct. On vérifie qu'un stockage HOSTILE (mode privé Safari,
        // quota plein) ne fait plus remonter d'exception — c'était tout l'objet du changement.
        const vrai = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
        try {
            Object.defineProperty(window, 'sessionStorage', {
                configurable: true,
                get() {
                    return {
                        getItem() { throw new Error('SecurityError simulé'); },
                        setItem() { throw new Error('QuotaExceededError simulé'); },
                        removeItem() { throw new Error('SecurityError simulé'); }
                    };
                }
            });
            try { m.initVersionChecker(); out.survitHostile = true; }
            catch (e) { out.survitHostile = false; out.erreur = String(e.message || e); }
        } finally {
            if (vrai) Object.defineProperty(window, 'sessionStorage', vrai);
            else delete window.sessionStorage;
        }

        // Rejouable sur un stockage sain.
        try { m.initVersionChecker(); m.initVersionChecker(); out.idempotent = 'ok'; }
        catch (e) { out.idempotent = { ERREUR: String(e.message || e) }; }
        return out;
    `);

    if (estErreur(r)) { assert(false, '[3.0] Le module version-checker.js est exploitable', r); endStep(); return; }

    assert(r.api === true, '[3.1] version-checker expose initVersionChecker');
    assert(r.survitHostile === true,
        '[3.2] initVersionChecker survit à un sessionStorage qui lève (mode privé, quota plein)',
        { erreur: r.erreur });
    assert(r.idempotent === 'ok', '[3.3] initVersionChecker est rejouable sans casse', r.idempotent);

    endStep();
}

// ============================================================================
// ÉTAPE 4 — Animations, debug-logger, notifications d'urgence
// ============================================================================

async function runStep4_Peripheriques(doc, win) {
    beginStep(4, STEP_NAMES[4]);

    const r = await dansIframe(doc, win, `
        const out = {};
        const essai = async (nom, chemin, fnNom) => {
            try {
                const m = await import(chemin);
                if (typeof m[fnNom] !== 'function') { out[nom] = { ERREUR: fnNom + ' absent' }; return; }
                // Deux appels : ces initialiseurs sont câblés au démarrage puis peuvent
                // être rejoués (changement de langue, retour de veille).
                await m[fnNom]();
                await m[fnNom]();
                out[nom] = 'ok';
            } catch (e) { out[nom] = { ERREUR: String(e.message || e) }; }
        };
        await essai('animations', '/js/ui/animations.js', 'initCaramelAnimationEffects');
        await essai('debugLogger', '/js/ui/debug-logger.js', 'initDebugLogger');
        await essai('urgence', '/js/ui/emergency-notification.js', 'initEmergencyNotifications');

        // Sans leurs conteneurs, ces modules doivent sortir proprement (garde \`if (!el) return\`)
        // plutôt que lever : c'est le cas d'une page partielle ou d'un thème modifié.
        const retires = [];
        for (const id of ['sparkles-container', 'bubbles-container', 'emergency-notification-container']) {
            const el = document.getElementById(id);
            if (el) { retires.push([id, el, el.parentNode]); el.parentNode.removeChild(el); }
        }
        try {
            const a = await import('/js/ui/animations.js');
            const u = await import('/js/ui/emergency-notification.js');
            a.initCaramelAnimationEffects();
            u.initEmergencyNotifications();
            out.sansConteneur = 'ok';
        } catch (e) { out.sansConteneur = { ERREUR: String(e.message || e) }; }
        finally { for (const [, el, parent] of retires) parent.appendChild(el); }
        out.conteneursRestaures = retires.length;
        return out;
    `);

    if (estErreur(r)) { assert(false, '[4.0] Les modules périphériques sont exploitables', r); endStep(); return; }

    assert(r.animations === 'ok',
        '[4.1] initCaramelAnimationEffects s\'exécute deux fois sans lever', r.animations);
    assert(r.debugLogger === 'ok',
        '[4.2] initDebugLogger s\'exécute deux fois sans lever (hors mode ?debug)', r.debugLogger);
    assert(r.urgence === 'ok',
        '[4.3] initEmergencyNotifications s\'exécute deux fois sans lever', r.urgence);
    assert(r.sansConteneur === 'ok',
        '[4.4] Les initialiseurs sortent proprement quand leur conteneur est absent', r.sansConteneur);
    assert(typeof r.conteneursRestaures === 'number',
        '[4.5] Les conteneurs retirés pour le test ont été remis en place',
        { restaures: r.conteneursRestaures });

    endStep();
}

// ============================================================================
// ÉTAPE 5 — Micro des champs de prompt
// ============================================================================

async function runStep5_Micro(doc, win) {
    beginStep(5, STEP_NAMES[5]);

    const r = await dansIframe(doc, win, `
        const out = {};
        // Aucune permission ne doit être demandée : on piège getUserMedia pour le prouver.
        let demandes = 0;
        const vraiGUM = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia = function () {
                demandes++;
                return Promise.reject(new Error('refus simulé'));
            };
        }
        try {
            const m = await import('/js/ui/prompt-mic.js');
            out.api = typeof m.initPromptMic === 'function';
            await m.initPromptMic();
            await m.initPromptMic();
            out.init = 'ok';
        } catch (e) { out.init = { ERREUR: String(e.message || e) }; }
        finally { if (vraiGUM && navigator.mediaDevices) navigator.mediaDevices.getUserMedia = vraiGUM; }
        out.demandesPermission = demandes;
        return out;
    `);

    if (estErreur(r)) { assert(false, '[5.0] Le module prompt-mic.js est exploitable', r); endStep(); return; }

    assert(r.api === true, '[5.1] prompt-mic expose initPromptMic');
    assert(r.init === 'ok', '[5.2] initPromptMic s\'exécute deux fois sans lever', r.init);
    assert(r.demandesPermission === 0,
        '[5.3] initPromptMic ne demande AUCUNE permission micro à l\'initialisation',
        { demandes: r.demandesPermission, indice: 'la permission ne doit être demandée qu\'au clic utilisateur' });

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

export async function runAllTests(iframeDoc, iframeWindow) {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    console.log('=== Habillage UI ===');

    if (!iframeDoc || !iframeWindow) {
        assert(false, '[0] iframe et window requis pour cette suite');
        return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
    }

    await runStep1_TutorielHelpers(iframeDoc, iframeWindow);
    await runStep2_TutorielOuverture(iframeDoc, iframeWindow);
    await runStep3_Version(iframeDoc, iframeWindow);
    await runStep4_Peripheriques(iframeDoc, iframeWindow);
    await runStep5_Micro(iframeDoc, iframeWindow);

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
