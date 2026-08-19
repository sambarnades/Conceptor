/**
 * @file Caramelia — pièces liées au DOM (bouton flottant, panneau, rendu, actions).
 *
 * Complète `test-caramelia.js`, qui ne couvre que les modules SANS DOM (`security`,
 * `config`, `i18n`, `chat`, `extractor`). Restaient hors couverture : `utils`, `dom`,
 * `state`, `actions`, `attachment`, `flow`, `voice`, `index` — soit tout ce qui
 * fabrique et pilote le widget.
 *
 * C'est ce trou qui a laissé passer une régression réelle : `utils.js::esc` remplacé
 * par une RÉ-EXPORTATION (`export {escapeHtml as esc} from …`), qui ne crée pas de
 * liaison locale. `md()` levait alors `ReferenceError` à chaque rendu et le panneau
 * s'ouvrait VIDE — sans aucune erreur au chargement du module.
 *
 * Leçon appliquée ici : les fonctions sont APPELÉES, pas seulement importées. Une
 * ré-exportation se résout parfaitement à l'édition de liens ; seule l'exécution la
 * met en défaut.
 *
 * Tourne dans l'iframe `index.html` (application réelle, Caramelia initialisé).
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
    1: 'Rendu (utils : esc, md)',
    2: 'Bouton flottant',
    3: 'Panneau : ouverture, contenu, fermeture',
    4: 'Actions sur le DOM Caramel',
    5: 'Pièces annexes (voice, attachment, state, dom)'
};

export const STEP_DESCRIPTIONS = {
    1: 'esc et md sont APPELÉS — c\'est l\'appel, pas l\'import, qui révèle une liaison manquante.',
    2: 'Présence, taille de cible tactile, libellé accessible, réactivité au survol.',
    3: 'Le panneau s\'ouvre, affiche l\'accueil (non vide), se ferme et se rouvre proprement.',
    4: 'fillFormField / triggerPromptGeneration / findActivityTile contre le vrai DOM.',
    5: 'Modules restants : chargement et contrat minimal, sans dépendre du micro ni du réseau.'
};

// ============================================================================
// OUTILLAGE — exécution d'un module DANS l'iframe
// ============================================================================

let _seq = 0;

/**
 * Évalue du code de module dans le contexte de l'iframe et renvoie sa valeur.
 *
 * Les modules Caramelia manipulent le `document` GLOBAL : les importer depuis la page
 * de tests les ferait travailler sur un DOM sans application. On injecte donc un
 * `<script type="module">` dans l'iframe, qui est de même origine.
 *
 * @param {Document} doc  document de l'iframe
 * @param {Window} win    window de l'iframe
 * @param {string} corps  corps d'une fonction async ; sa valeur de retour est transmise
 * @returns {Promise<any>} valeur renvoyée, ou `{ ERREUR: '…' }`
 */
function dansIframe(doc, win, corps) {
    const cle = `__caramelia_test_${++_seq}`;
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
// ÉTAPE 1 — Rendu
// ============================================================================

async function runStep1_Rendu(doc, win) {
    beginStep(1, STEP_NAMES[1]);

    const r = await dansIframe(doc, win, `
        const u = await import('/js/caramelia/utils.js');
        const out = {};
        const app = (n, fn) => { try { out[n] = fn(); } catch (e) { out[n] = { ERREUR: String(e.message || e) }; } };
        app('escTypes',  () => typeof u.esc === 'function' && typeof u.md === 'function');
        app('esc',       () => u.esc('<a href="x">&\\'</a>'));
        app('escNull',   () => u.esc(null));
        app('escUndef',  () => u.esc(undefined));
        app('escNombre', () => u.esc(42));
        app('mdGras',    () => u.md('Bonjour **gras**'));
        app('mdItal',    () => u.md('un *mot* isolé'));
        app('mdCode',    () => u.md('voici \\'du code\\''.replace(/'/g, '\\u0060')));
        app('mdListe',   () => u.md('- un\\n- deux'));
        app('mdXss',     () => u.md('<script>alert(1)<\\/script>'));
        app('mdVide',    () => u.md(''));
        app('mdNull',    () => u.md(null));
        app('scroll',    () => { u.scrollBottom(); return 'ok'; });
        return out;
    `);

    if (estErreur(r)) { assert(false, '[1.0] Le module caramelia/utils.js est exploitable', r); endStep(); return; }

    for (const [nom, v] of Object.entries(r)) {
        if (estErreur(v)) assert(false, `[1.x] caramelia/utils : ${nom} s'exécute sans lever`, v);
    }

    assert(r.escTypes === true, '[1.1] esc et md sont bien des fonctions');
    assert(r.esc === '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
        '[1.2] esc échappe les 5 caractères sensibles', { obtenu: r.esc });
    assert(r.escNull === '' && r.escUndef === '',
        '[1.3] esc(null) et esc(undefined) rendent une chaîne vide',
        { null: r.escNull, undefined: r.escUndef });
    assert(r.escNombre === '42', '[1.4] esc convertit les non-chaînes', { obtenu: r.escNombre });
    assert(r.mdGras === '<p>Bonjour <strong>gras</strong></p>',
        '[1.5] md convertit **gras** en <strong>', { obtenu: r.mdGras });
    assert(typeof r.mdItal === 'string' && r.mdItal.includes('<em>'),
        '[1.6] md convertit *italique* en <em>', { obtenu: r.mdItal });
    assert(typeof r.mdListe === 'string' && r.mdListe.includes('<ul>') && r.mdListe.includes('<li>'),
        '[1.7] md rend les listes à puces', { obtenu: r.mdListe });
    assert(typeof r.mdXss === 'string' && !r.mdXss.includes('<script>'),
        '[1.8] md échappe le HTML AVANT toute mise en forme (anti-XSS)', { obtenu: r.mdXss });
    assert(r.mdVide === '' && r.mdNull === '',
        '[1.9] md("") et md(null) rendent une chaîne vide', { vide: r.mdVide, null: r.mdNull });
    assert(r.scroll === 'ok', '[1.10] scrollBottom ne lève pas hors panneau ouvert');

    endStep();
}

// ============================================================================
// ÉTAPE 2 — Bouton flottant
// ============================================================================

async function runStep2_Bouton(doc, win) {
    beginStep(2, STEP_NAMES[2]);

    const fab = doc.getElementById('caramelia-fab');
    assert(!!fab, '[2.1] Le bouton flottant Caramelia existe');
    if (!fab) { endStep(); return; }

    const r = fab.getBoundingClientRect();
    const cs = win.getComputedStyle(fab);

    assert(cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0',
        '[2.2] Le bouton est visible',
        { display: cs.display, visibility: cs.visibility, opacity: cs.opacity });
    assert(r.width >= 44 && r.height >= 44,
        '[2.3] Le bouton respecte la cible tactile minimale (44 px)',
        { largeur: Math.round(r.width), hauteur: Math.round(r.height) });
    assert(cs.pointerEvents !== 'none', '[2.4] Le bouton reçoit les événements pointeur');

    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
    const dessus = doc.elementFromPoint(cx, cy);
    assert(dessus === fab || fab.contains(dessus),
        '[2.5] Rien ne recouvre le bouton en son centre',
        { elementTrouve: dessus ? (dessus.id || dessus.className || dessus.tagName) : null });

    const libelle = fab.title || fab.getAttribute('aria-label') || '';
    assert(libelle.trim().length > 0, '[2.6] Le bouton porte un libellé accessible', { libelle });

    assert(doc.querySelectorAll('#caramelia-fab').length === 1,
        '[2.7] Le bouton n\'est pas dupliqué',
        { nombre: doc.querySelectorAll('#caramelia-fab').length });

    // Retour visuel au survol. La pseudo-classe `:hover` n'est PAS déclenchée par un
    // événement synthétique — seul un vrai pointeur l'active, ce qu'une iframe ne permet
    // pas. On vérifie donc que la RÈGLE existe dans les feuilles de style ; le survol
    // réel, lui, est couvert par `node tests/run_caramelia_smoke.mjs` (souris Playwright).
    let regleSurvol = null;
    for (const feuille of Array.from(doc.styleSheets)) {
        let regles;
        try { regles = feuille.cssRules; } catch { continue; }   // feuille cross-origin
        if (!regles) continue;
        for (const regle of Array.from(regles)) {
            const sel = regle.selectorText;
            if (sel && /\.caramelia-fab[^,{]*:hover/.test(sel)) { regleSurvol = sel; break; }
        }
        if (regleSurvol) break;
    }
    assert(!!regleSurvol,
        '[2.8] Une règle CSS de survol cible le bouton flottant',
        { indice: 'sans règle :hover, le bouton ne donne aucun retour au passage de la souris' });

    // La transition doit être déclarée, sinon le retour est brutal ou absent.
    assert(cs.transition && cs.transition !== 'all 0s ease 0s' && cs.transition !== 'none',
        '[2.9] Le bouton déclare une transition (retour visuel fluide)',
        { transition: cs.transition });

    endStep();
}

// ============================================================================
// ÉTAPE 3 — Panneau
// ============================================================================

const SEL_PANNEAU = '#caramelia-panel, .caramelia-panel, [id*="caramelia"][class*="panel"]';

function etatPanneau(doc, win) {
    const pan = doc.querySelector(SEL_PANNEAU);
    if (!pan) return { absent: true };
    const cs = win.getComputedStyle(pan);
    return {
        visible: cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0',
        longueurTexte: (pan.innerText || '').trim().length,
        noeuds: pan.querySelectorAll('*').length,
        aUnChampDeSaisie: !!pan.querySelector('textarea, input[type="text"]')
    };
}

async function runStep3_Panneau(doc, win) {
    beginStep(3, STEP_NAMES[3]);

    const fab = doc.getElementById('caramelia-fab');
    if (!fab) { assert(false, '[3.0] Bouton flottant requis'); endStep(); return; }

    fab.click();
    await attendre(1200);

    const ouvert = etatPanneau(doc, win);
    assert(!ouvert.absent, '[3.1] Le panneau apparaît dans le DOM');
    if (ouvert.absent) { endStep(); return; }

    assert(ouvert.visible === true, '[3.2] Le panneau est visible', ouvert);
    // LE symptôme de la régression : panneau ouvert mais vide, parce que le message
    // d'accueil traverse `md()`.
    assert(ouvert.longueurTexte > 40,
        '[3.3] Le panneau n\'est pas vide (message d\'accueil rendu)',
        { longueurTexte: ouvert.longueurTexte, indice: 'un panneau quasi vide trahit un md() qui lève' });
    assert(ouvert.noeuds > 10, '[3.4] Le panneau rend une vraie arborescence', { noeuds: ouvert.noeuds });
    assert(ouvert.aUnChampDeSaisie === true, '[3.5] Le panneau offre un champ de saisie');

    // Le rendu du message d'accueil doit contenir du HTML produit par md(), pas du texte brut.
    const pan = doc.querySelector(SEL_PANNEAU);
    assert(pan.querySelectorAll('p, li, strong, em').length > 0,
        '[3.6] Le contenu est bien passé par le rendu Markdown (balises produites)',
        { balises: pan.querySelectorAll('p, li, strong, em').length });

    // Fermeture
    const btnFermer = pan.querySelector('[class*="close"], [aria-label*="ermer"], [title*="ermer"]');
    assert(!!btnFermer, '[3.7] Un bouton de fermeture est présent');
    if (btnFermer) {
        btnFermer.click();
        await attendre(700);
        const ferme = etatPanneau(doc, win);
        assert(ferme.absent === true || ferme.visible === false,
            '[3.8] Le panneau se referme', ferme);
    }

    // Réouverture : un cycle complet ne doit rien laisser de cassé.
    fab.click();
    await attendre(1000);
    const rouvert = etatPanneau(doc, win);
    assert(rouvert.longueurTexte > 40,
        '[3.9] Le panneau se rouvre avec son contenu', { longueurTexte: rouvert.longueurTexte });
    assert(doc.querySelectorAll(SEL_PANNEAU).length === 1,
        '[3.10] Aucun panneau dupliqué après un cycle',
        { nombre: doc.querySelectorAll(SEL_PANNEAU).length });
    assert(doc.querySelectorAll('#caramelia-fab').length === 1,
        '[3.11] Aucun bouton dupliqué après un cycle');

    // On referme pour ne pas polluer les suites suivantes.
    doc.querySelector(SEL_PANNEAU)
        ?.querySelector('[class*="close"], [aria-label*="ermer"], [title*="ermer"]')?.click();
    await attendre(400);

    endStep();
}

// ============================================================================
// ÉTAPE 4 — Actions sur le DOM Caramel
// ============================================================================

async function runStep4_Actions(doc, win) {
    beginStep(4, STEP_NAMES[4]);

    const r = await dansIframe(doc, win, `
        const a = await import('/js/caramelia/actions.js');
        const out = { api: {} };
        for (const n of ['fillFormField', 'triggerPromptGeneration', 'findActivityTile', 'launchGenerations']) {
            out.api[n] = typeof a[n];
        }
        // fillFormField écrit dans le vrai formulaire de Caramel.
        const avant = document.getElementById('qui')?.value ?? null;
        a.fillFormField('qui', 'des élèves de CM1 (test)');
        out.quiApres = document.getElementById('qui')?.value ?? null;
        a.fillFormField('qui', avant ?? '');
        out.quiRestaure = document.getElementById('qui')?.value ?? null;

        // Clé inconnue : ne doit pas lever.
        try { a.fillFormField('__inexistant__', 'x'); out.cleInconnue = 'ok'; }
        catch (e) { out.cleInconnue = { ERREUR: String(e.message || e) }; }

        // Valeur nulle : ne doit pas lever.
        try { a.fillFormField('qui', null); a.fillFormField('qui', avant ?? ''); out.valeurNulle = 'ok'; }
        catch (e) { out.valeurNulle = { ERREUR: String(e.message || e) }; }

        try { a.triggerPromptGeneration(); out.trigger = 'ok'; }
        catch (e) { out.trigger = { ERREUR: String(e.message || e) }; }

        const t = a.findActivityTile('Flashcards');
        out.tuileTrouvee = !!t;
        out.tuileEstElement = !!(t && t.nodeType === 1);
        out.tuileInconnue = a.findActivityTile('__module_inexistant__');
        return out;
    `);

    if (estErreur(r)) { assert(false, '[4.0] Le module caramelia/actions.js est exploitable', r); endStep(); return; }

    for (const n of ['fillFormField', 'triggerPromptGeneration', 'findActivityTile', 'launchGenerations']) {
        assert(r.api[n] === 'function', `[4.1] actions exporte ${n}`, { type: r.api[n] });
    }
    assert(r.quiApres === 'des élèves de CM1 (test)',
        '[4.2] fillFormField écrit dans le champ ciblé', { obtenu: r.quiApres });
    assert(r.cleInconnue === 'ok', '[4.3] fillFormField ignore une clé inconnue sans lever', r.cleInconnue);
    assert(r.valeurNulle === 'ok', '[4.4] fillFormField accepte une valeur nulle sans lever', r.valeurNulle);
    assert(r.trigger === 'ok', '[4.5] triggerPromptGeneration ne lève pas', r.trigger);
    assert(r.tuileTrouvee === true && r.tuileEstElement === true,
        '[4.6] findActivityTile retrouve une tuile existante (Flashcards)',
        { trouvee: r.tuileTrouvee });
    assert(r.tuileInconnue === null || r.tuileInconnue === undefined,
        '[4.7] findActivityTile renvoie null pour un module inconnu', { obtenu: r.tuileInconnue });

    endStep();
}

// ============================================================================
// ÉTAPE 5 — Pièces annexes
// ============================================================================

async function runStep5_Annexes(doc, win) {
    beginStep(5, STEP_NAMES[5]);

    const r = await dansIframe(doc, win, `
        const out = {};
        const charge = async (nom, chemin, verif) => {
            try { const m = await import(chemin); out[nom] = verif(m); }
            catch (e) { out[nom] = { ERREUR: String(e.message || e) }; }
        };

        // voice : aucune permission micro demandée, on n'interroge que les capacités.
        await charge('voice', '/js/caramelia/voice.js', m => ({
            api: ['attachMic', 'cancelMic', 'isMicSupported'].every(n => typeof m[n] === 'function'),
            supporte: typeof m.isMicSupported() === 'boolean',
            annuleSansDemarrer: (() => { try { m.cancelMic(); return 'ok'; } catch (e) { return String(e.message); } })()
        }));

        // attachment : on ne fournit aucun fichier réel, on vérifie le contrat + la robustesse.
        await charge('attachment', '/js/caramelia/attachment.js', m => ({
            api: typeof m.handleAttachment === 'function' && typeof m.setupDragAndDrop === 'function'
        }));

        // state : forme de l'état partagé.
        await charge('state', '/js/caramelia/state.js', m => ({
            existe: !!m.state && typeof m.state === 'object'
        }));

        // dom : le module construit le widget ; il doit s'importer et exposer des fonctions.
        await charge('dom', '/js/caramelia/dom.js', m => ({
            fonctions: Object.values(m).filter(v => typeof v === 'function').length
        }));

        // flow : conversation. resetConversation doit être rejouable sans casse.
        await charge('flow', '/js/caramelia/flow.js', m => {
            const o = { api: ['showWelcome', 'handleUserInput', 'resetConversation', 'isAwaitingBackgroundImage']
                .every(n => typeof m[n] === 'function') };
            try { o.attenteImage = typeof m.isAwaitingBackgroundImage() === 'boolean'; }
            catch (e) { o.attenteImage = { ERREUR: String(e.message || e) }; }
            try { m.resetConversation(); m.resetConversation(); o.resetIdempotent = 'ok'; }
            catch (e) { o.resetIdempotent = { ERREUR: String(e.message || e) }; }
            return o;
        });

        // index : orchestrateur du widget.
        await charge('index', '/js/caramelia/index.js', m => ({ importe: true }));
        return out;
    `);

    if (estErreur(r)) { assert(false, '[5.0] Les modules annexes sont exploitables', r); endStep(); return; }

    for (const [nom, v] of Object.entries(r)) {
        if (estErreur(v)) { assert(false, `[5.x] caramelia/${nom} s'importe sans lever`, v); continue; }
        assert(true, `[5.x] caramelia/${nom} s'importe sans lever`);
    }

    if (!estErreur(r.voice)) {
        assert(r.voice.api === true, '[5.1] voice expose attachMic / cancelMic / isMicSupported');
        assert(r.voice.supporte === true, '[5.2] isMicSupported renvoie un booléen (sans demander la permission)');
        assert(r.voice.annuleSansDemarrer === 'ok',
            '[5.3] cancelMic ne lève pas si aucun enregistrement n\'est en cours',
            { obtenu: r.voice.annuleSansDemarrer });
    }
    if (!estErreur(r.attachment)) {
        assert(r.attachment.api === true, '[5.4] attachment expose handleAttachment / setupDragAndDrop');
    }
    if (!estErreur(r.state)) {
        assert(r.state.existe === true, '[5.5] state expose un objet d\'état partagé');
    }
    if (!estErreur(r.dom)) {
        assert(r.dom.fonctions > 0, '[5.6] dom expose des constructeurs de widget', r.dom);
    }
    if (!estErreur(r.flow)) {
        assert(r.flow.api === true, '[5.7] flow expose showWelcome / handleUserInput / resetConversation');
        assert(r.flow.attenteImage === true,
            '[5.8] isAwaitingBackgroundImage renvoie un booléen', { obtenu: r.flow.attenteImage });
        assert(r.flow.resetIdempotent === 'ok',
            '[5.9] resetConversation est rejouable sans casse', { obtenu: r.flow.resetIdempotent });
    }

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

export async function runAllTests(iframeDoc, iframeWindow) {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    console.log('=== Caramelia (DOM) ===');

    if (!iframeDoc || !iframeWindow) {
        assert(false, '[0] iframe et window requis pour cette suite');
        return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
    }

    // Caramelia est initialisé de façon asynchrone par main.js : on attend son bouton.
    const limite = Date.now() + 20000;
    while (!iframeDoc.getElementById('caramelia-fab') && Date.now() < limite) await attendre(200);

    await runStep1_Rendu(iframeDoc, iframeWindow);
    await runStep2_Bouton(iframeDoc, iframeWindow);
    await runStep3_Panneau(iframeDoc, iframeWindow);
    await runStep4_Actions(iframeDoc, iframeWindow);
    await runStep5_Annexes(iframeDoc, iframeWindow);

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
