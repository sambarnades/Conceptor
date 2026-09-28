/**
 * Boîte à outils des scénarios de QA manuelle (campagne 6.3.0).
 *
 * Ces scénarios pilotent l'éditeur par le DOM RÉEL — vrais boutons, vraie modale de
 * confirmation, vrai saveChanges() — là où `tests/test-editor-activities.js` passe par
 * les exports `__testing`. Les deux sont complémentaires : la suite couvre les 33 schémas
 * sans le coût du DOM, ces scénarios vérifient que les mêmes correctifs tiennent quand
 * c'est un humain qui clique.
 *
 * Prérequis : `python3 tests/serveur-statique.py 8010` à la RACINE du dépôt.
 * Usage     : node tests/qa-manuel/<scenario>.mjs
 */
import { chromium } from '../roundtrip/node_modules/playwright/index.mjs';

export const URL_HOTE = 'http://localhost:8010/tests/qa-manuel/hote.html';

/** Ouvre un navigateur et la page-hôte, traductions chargées. */
export async function navigateur({ silencieux = false } = {}) {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 1600, height: 1100 } });
    if (!silencieux) p.on('pageerror', e => console.log('  [pageerror]', String(e).slice(0, 180)));
    await p.goto(URL_HOTE);
    await p.waitForFunction(() => window.__qaPret);
    await p.evaluate(() => window.__qa.init('fr'));
    await p.evaluate(AIDES);
    return { b, p };
}

/**
 * Aides injectées dans la page (lecture du modèle et des widgets).
 * Passé en string : le code doit s'évaluer DANS la page, pas dans Node.
 */
export const AIDES = `
window.__dd = {
  /** Étiquette → NOMS des zones visées. On lit des NOMS, jamais des indices : après une
      mutation les indices sont renumérotés, seule l'identité de la zone fait foi. */
  async assoc(chemin) {
    const d = window.__qa.modele();
    const ex = chemin ? chemin.split('.').reduce((o,k)=>o?.[k], d) : d;
    const zn = (ex.dropZones||[]).map(z => z.label);
    return {
      zones: zn,
      etiquettes: (ex.elements||[]).map(e => ({
        texte: String(e.type?.params?.text ?? e.text ?? '').replace(/<[^>]*>/g,'').trim(),
        vise: (e.zoneIndices||[]).map(i => zn[i] ?? ('‹indice ' + i + ' HORS LISTE›'))
      }))
    };
  },
  /** Cases « Zones cibles » proposées à une étiquette, telles qu'affichées. */
  casesZones(cheminChamp) {
    const inp = document.querySelector('[data-path="' + cheminChamp + '"]');
    const f = inp ? inp.closest('.json-editor__field') : null;
    if (!f) return null;
    return [...f.querySelectorAll('.json-editor__multi-checkbox-input')].map(c => ({
      zone: ((c.closest('label') || c.parentElement).innerText || '').trim(),
      cochee: c.checked
    }));
  }
};`;

/** Ouvre une fixture et bascule en vue « Plan » si le panneau Glisser-déposer est là. */
export async function ouvrir(p, fixture, moduleKey) {
    await p.evaluate(async ({ f, k }) => { await window.__qa.ouvrir(f, k); }, { f: fixture, k: moduleKey });
    await p.waitForTimeout(700);
    // Le Glisser-déposer s'ouvre en vue « Sur le canevas », qui masque la nav par design.
    const plan = p.locator('.dz-editor-panel button', { hasText: 'Plan' }).first();
    if (await plan.count()) { await plan.click(); await p.waitForTimeout(350); }
}

export async function section(p, texte) {
    await p.locator('.json-editor__nav-item', { hasText: texte }).first().click();
    await p.waitForTimeout(300);
}

export async function item(p, cheminTableau, index) {
    await p.locator(`[data-array-path="${cheminTableau}"] .json-editor__nav-subitem[data-index="${index}"]`).click();
    await p.waitForTimeout(350);
}

/**
 * Clique un bouton d'action du détail. ATTENTION : ces boutons sont ICONOGRAPHIQUES
 * (<i class="fas fa-trash">) — innerText est VIDE, le libellé vit dans `title`.
 * Un filtre `hasText` ne les trouve donc jamais.
 */
export async function bouton(p, titre) {
    const b = p.locator(`#conteneur button[title="${titre}"]`).first();
    await b.waitFor({ state: 'visible', timeout: 10000 });
    await b.click();
    await p.waitForTimeout(250);
}

/** Clique un bouton d'action d'un item de tableau IMBRIQUÉ, ancré par un data-path. */
export async function boutonItemImbrique(p, cheminAncre, titre) {
    return p.evaluate(({ a, t }) => {
        const inp = document.querySelector(`[data-path="${a}"]`);
        let el = inp;
        while (el && !el.classList?.contains('json-editor__array-item')) el = el.parentElement;
        const b = el && [...el.querySelectorAll('button')].find(x => x.title === t);
        if (!b) return 'bouton « ' + t + ' » introuvable';
        b.click();
        return 'clic sur « ' + t + ' »';
    }, { a: cheminAncre, t: titre }).then(async r => { await p.waitForTimeout(450); return r; });
}

/** Réordonne au CLAVIER via la poignée de tri (chemin A11Y-01, seul déplacement pilotable). */
export async function deplacerAuClavier(p, cheminAncre, touche = 'ArrowDown') {
    const etat = await p.evaluate(a => {
        const inp = document.querySelector(`[data-path="${a}"]`);
        let el = inp;
        while (el && !el.classList?.contains('json-editor__array-item')) el = el.parentElement;
        const h = el && el.querySelector('.json-editor__array-btn--drag');
        if (!h) return 'poignée introuvable';
        h.focus();
        return 'poignée focalisée';
    }, cheminAncre);
    if (etat !== 'poignée focalisée') return etat;
    await p.keyboard.press(touche);
    await p.waitForTimeout(600);
    return 'déplacé (' + touche + ')';
}

/**
 * Valide la modale de confirmation et renvoie son message.
 * Attend son APPARITION puis sa DISPARITION : deux suppressions à la suite se marchaient
 * dessus (la 2e modale s'ouvrait pendant que la 1re s'effaçait → innerText sur un noeud
 * déjà détaché).
 */
export async function confirmer(p, { attendreMs = 3000 } = {}) {
    const corps = p.locator('.confirm-modal__body').first();
    try { await corps.waitFor({ state: 'visible', timeout: attendreMs }); }
    catch { return null; }                       // pas de confirmation demandée
    const msg = (await corps.innerText()).trim();
    await p.locator('.confirm-modal .json-editor__modal-btn').last().click();
    await p.locator('.confirm-modal').first().waitFor({ state: 'detached', timeout: attendreMs }).catch(() => {});
    await p.waitForTimeout(300);
    return msg;
}

/** Tente l'enregistrement : { ok } ou { ok:false, resume } tel qu'affiché à l'écran. */
export async function enregistrer(p) {
    return p.evaluate(async () => {
        const r = await window.__qa.save();
        if (r) return { ok: true };
        return { ok: false, resume: window.__qa.resumeErreurs() || '(aucun résumé)' };
    });
}

export function titre(t) { console.log(`\n──────── ${t} ────────`); }
export function bloc(t) { console.log(`\n${'='.repeat(72)}\n${t}\n${'='.repeat(72)}`); }
