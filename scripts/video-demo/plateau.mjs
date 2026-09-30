/**
 * Le plateau de tournage : ce qui s'ajoute à la page filmée (curseur, cartons,
 * notes) et les gestes de la « main » qui la pilote (déplacer, cliquer, taper,
 * faire défiler). Rien ici ne touche au code de Caramel : tout est injecté dans
 * la page au moment du tournage.
 *
 * **Pourquoi un curseur dessiné.** Chromium sans écran n'affiche aucun pointeur :
 * sans lui, le spectateur voit des boutons s'enfoncer tout seuls. Il est posé
 * en `popover` pour vivre dans la « top layer » : une `<dialog>` ouverte par
 * `showModal()` (la mosaïque des types, par exemple) passerait sinon devant lui,
 * quel que soit son z-index. On le remonte au premier plan à chaque mouvement.
 */

/** Script injecté dans la page (avant ses propres scripts). */
export const SCRIPT_PAGE = String.raw`
(() => {
  const CSS = ${JSON.stringify(`
    .demo-top { position: fixed; inset: auto; margin: 0; padding: 0; border: 0; background: transparent;
      overflow: visible; pointer-events: none; }
    #demo-curseur { left: 0; top: 0; width: 28px; height: 28px; z-index: 2147483647;
      transform: translate(-100px, -100px); transition: none; }
    #demo-curseur svg { width: 28px; height: 28px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.35)); }
    #demo-curseur .demo-onde { position: absolute; left: -16px; top: -16px; width: 32px; height: 32px;
      border-radius: 50%; border: 3px solid rgba(232,130,30,.9); opacity: 0; }
    #demo-curseur.demo-clic .demo-onde { animation: demo-onde .45s ease-out; }
    @keyframes demo-onde { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }

    #demo-chapitre { left: 24px; bottom: 22px; padding: 8px 16px; border-radius: 999px;
      background: rgba(22,32,48,.86); color: #fff; font: 600 15px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      letter-spacing: .01em; opacity: 0; transition: opacity .4s; }
    #demo-chapitre.demo-visible { opacity: 1; }

    #demo-note { left: 50%; bottom: 22px; transform: translateX(-50%); max-width: 70vw; padding: 10px 18px;
      border-radius: 10px; background: rgba(255,255,255,.97); color: #1d2a3a; border: 1px solid #d5dbe3;
      box-shadow: 0 6px 24px rgba(0,0,0,.18); font: 500 16px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      opacity: 0; transition: opacity .4s; text-align: center; }
    #demo-note.demo-visible { opacity: 1; }
    #demo-note b { color: #b45f12; }

    #demo-carton { inset: 0; width: 100vw; height: 100vh; max-width: none; max-height: none;
      background: #f6f7f9; color: #1d2a3a; display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      opacity: 0; transition: opacity .6s; }
    #demo-carton.demo-visible { opacity: 1; }
    #demo-carton .demo-carton__boite { width: min(980px, 80vw); }
    #demo-carton .demo-carton__logo { width: 64px; height: 64px; }
    #demo-carton h1 { font-size: 46px; margin: 18px 0 8px; font-weight: 700; letter-spacing: -.01em; }
    #demo-carton h2 { font-size: 34px; margin: 0 0 26px; font-weight: 700; }
    #demo-carton .demo-carton__sous { font-size: 22px; color: #4a5a6e; margin: 0 0 26px; line-height: 1.4; }
    #demo-carton .demo-carton__meta { font-size: 17px; color: #6a7888; }
    #demo-carton ul { list-style: none; padding: 0; margin: 0; }
    #demo-carton li { font-size: 22px; line-height: 1.4; padding: 14px 0 14px 44px; position: relative;
      border-top: 1px solid #e1e5ea; opacity: 0; transform: translateY(6px); transition: opacity .5s, transform .5s; }
    #demo-carton li:first-child { border-top: 0; }
    #demo-carton li.demo-visible { opacity: 1; transform: none; }
    #demo-carton li::before { content: ""; position: absolute; left: 8px; top: 23px; width: 14px; height: 14px;
      border-radius: 50%; background: #e8821e; }
    #demo-carton .demo-carton__url { font-size: 30px; font-weight: 700; color: #0b5cad; margin: 8px 0 22px; }
  `)};

  const FLECHE = '<svg viewBox="0 0 28 28"><path d="M4 2 L4 22 L9.5 17 L13 25.5 L16.6 24 L13.2 15.8 L20.5 15.5 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  let curseur, chapitre, note, carton, pos = { x: -100, y: -100 };

  function top(el) {
    try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch { /* sans popover : tant pis */ }
  }
  /** Une dialog modale vient d'entrer dans la top layer : on repasse devant elle. */
  function remonter() {
    if (!document.querySelector('dialog:modal')) return;
    for (const el of [carton, note, chapitre, curseur]) if (el && (el === curseur || el.classList.contains('demo-visible'))) top(el);
  }

  function monter() {
    if (curseur) return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);
    const cree = (id, html = '') => {
      const el = document.createElement('div');
      el.id = id; el.className = 'demo-top'; el.setAttribute('popover', 'manual'); el.setAttribute('aria-hidden', 'true');
      el.innerHTML = html;
      document.body.append(el);
      top(el);
      return el;
    };
    carton = cree('demo-carton');
    chapitre = cree('demo-chapitre');
    note = cree('demo-note');
    curseur = cree('demo-curseur', FLECHE + '<span class="demo-onde"></span>');
  }

  window.__demo = {
    monter,
    curseur(x, y) {
      monter();
      pos = { x, y };
      curseur.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 2) + 'px)';
      remonter();
    },
    clic() {
      curseur.classList.remove('demo-clic'); void curseur.offsetWidth; curseur.classList.add('demo-clic');
    },
    position: () => pos,
    /** Force une nouvelle image au compositeur (un pixel presque transparent qui change). */
    rafraichir() {
      monter();
      let px = document.getElementById('demo-pixel');
      if (!px) {
        px = document.createElement('div');
        px.id = 'demo-pixel';
        px.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;pointer-events:none;z-index:2147483646';
        carton.append(px);
      }
      px.style.background = px.style.background === 'rgba(0, 0, 0, 0.02)' ? 'rgba(0, 0, 0, 0.01)' : 'rgba(0, 0, 0, 0.02)';
    },
    chapitre(texte) {
      monter();
      if (texte) { chapitre.textContent = texte; chapitre.classList.add('demo-visible'); top(chapitre); }
      else chapitre.classList.remove('demo-visible');
      top(curseur);
    },
    note(html) {
      monter();
      if (html) { note.innerHTML = html; note.classList.add('demo-visible'); top(note); }
      else note.classList.remove('demo-visible');
      top(curseur);
    },
    carton(html) {
      monter();
      // Pas de pointeur sur un carton : il n'y a rien à y désigner.
      curseur.style.opacity = html ? '0' : '1';
      if (html) { carton.innerHTML = '<div class="demo-carton__boite">' + html + '</div>'; top(carton); requestAnimationFrame(() => carton.classList.add('demo-visible')); }
      else carton.classList.remove('demo-visible');
      top(curseur);
    },
    /** Révèle la puce suivante d'un carton à liste. */
    puce() {
      const li = carton.querySelector('li:not(.demo-visible)');
      if (li) li.classList.add('demo-visible');
      return !!carton.querySelector('li:not(.demo-visible)');
    },
    /**
     * Défilement doux jusqu'à « cible » (px, ou sélecteur placé à « position » de la hauteur
     * visible). Le conteneur est l'ancêtre défilant de la cible, à défaut la page.
     */
    defiler(cible, { ms = 900, position = 0.22, conteneur = null } = {}) {
      let el = typeof conteneur === 'string' ? document.querySelector(conteneur) : null;
      let but;
      if (typeof cible === 'string') {
        const noeud = document.querySelector(cible);
        if (!noeud) throw new Error('défilement : introuvable ' + cible);
        if (!el) {
          el = noeud.parentElement;
          while (el && el !== document.body) {
            const s = getComputedStyle(el);
            if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2) break;
            el = el.parentElement;
          }
          if (!el || el === document.body) el = document.scrollingElement;
        }
        const haut = el === document.scrollingElement ? 0 : el.getBoundingClientRect().top;
        const visible = el === document.scrollingElement ? innerHeight : el.clientHeight;
        but = el.scrollTop + (noeud.getBoundingClientRect().top - haut) - visible * position;
      } else {
        el = el || document.scrollingElement;
        but = cible;
      }
      but = Math.max(0, Math.min(but, el.scrollHeight - el.clientHeight));
      const depart = el.scrollTop, delta = but - depart, t0 = performance.now();
      const doux = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      return new Promise(fin => {
        if (Math.abs(delta) < 2) return fin();
        const pas = now => {
          const t = Math.min(1, (now - t0) / ms);
          el.scrollTop = depart + delta * doux(t);
          t < 1 ? requestAnimationFrame(pas) : fin();
        };
        requestAnimationFrame(pas);
      });
    },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter);
  else monter();
})();
`;

/**
 * La main : gestes lents et visibles. Chaque geste passe par le vrai clavier et
 * la vraie souris de Playwright — les gestionnaires de Caramel réagissent comme
 * pour un humain — et le curseur dessiné suit.
 *
 * **Le journal.** Chaque geste y est noté avec son instant et la boîte de sa cible
 * (px CSS de la fenêtre) : c'est ce que suit la caméra de l'habillage
 * (`habillage.mjs`) pour zoomer sur le bon endroit, et ce qui lui dit quand
 * revenir au plan large (défilement, note de durée réelle à l'écran).
 */
export function creerMain(page) {
    const pause = ms => page.waitForTimeout(ms);
    let pos = { x: 720, y: 460 };
    const journal = [];
    const noter = (type, extra = {}) => { const e = { type, t: Date.now(), ...extra }; journal.push(e); return e; };

    async function allerA(x, y, { ms = 650 } = {}) {
        const pas = Math.max(8, Math.round(ms / 22));
        const depart = { ...pos };
        for (let i = 1; i <= pas; i++) {
            const t = i / pas;
            const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const px = depart.x + (x - depart.x) * e, py = depart.y + (y - depart.y) * e;
            await page.mouse.move(px, py);
            await page.evaluate(([a, b]) => window.__demo.curseur(a, b), [px, py]);
            await pause(ms / pas);
        }
        pos = { x, y };
    }

    /** Centre (ou point relatif) d'un locator et sa boîte, en l'amenant dans la vue si besoin. */
    async function viser(locator, { dx = 0.5, dy = 0.5 } = {}) {
        await locator.waitFor({ state: 'visible', timeout: 20000 });
        let b = await locator.boundingBox();
        const vue = page.viewportSize();
        if (!b || b.y < 60 || b.y + b.height > vue.height - 10) {
            noter('defiler', { fin: Date.now() + 250 });
            await locator.scrollIntoViewIfNeeded();
            await pause(250);
            b = await locator.boundingBox();
        }
        return { x: b.x + b.width * dx, y: b.y + b.height * dy, boite: { x: b.x, y: b.y, w: b.width, h: b.height } };
    }

    return {
        pause,
        allerA,
        journal,
        async survoler(locator, opts = {}) {
            const { x, y, boite } = await viser(locator, opts);
            const e = noter('survol', { boite });
            await allerA(x, y, opts);
            e.fin = Date.now();
        },
        async cliquer(locator, opts = {}) {
            const { x, y, boite } = await viser(locator, opts);
            const e = noter('clic', { boite });
            await allerA(x, y, opts);
            await pause(120);
            await page.evaluate(() => window.__demo.clic());
            await page.mouse.down();
            await pause(70);
            await page.mouse.up();
            e.fin = Date.now();
            await pause(opts.apres ?? 350);
            // Le clic a pu ouvrir une <dialog> modale (mosaïque des types) : elle
            // passe devant le curseur tant qu'on ne le remonte pas au premier plan.
            await page.evaluate(([a, b]) => window.__demo.curseur(a, b), [x, y]);
        },
        async taper(locator, texte, { delai = 42 } = {}) {
            await this.cliquer(locator, { apres: 150 });
            const e = noter('saisie', { boite: journal.at(-1).boite });
            await page.keyboard.type(texte, { delay: delai });
            e.fin = Date.now();
        },
        /** Remplace le contenu d'un champ, visiblement : tout sélectionner, puis taper. */
        async retaper(locator, texte, { delai = 42 } = {}) {
            await this.cliquer(locator, { apres: 150 });
            const e = noter('saisie', { boite: journal.at(-1).boite });
            await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
            await pause(250);
            await page.keyboard.type(texte, { delay: delai });
            e.fin = Date.now();
        },
        async defiler(cible, opts = {}) {
            const e = noter('defiler');
            await page.evaluate(([c, o]) => window.__demo.defiler(c, o), [cible, opts]);
            e.fin = Date.now();
        },
        chapitre: texte => page.evaluate(t => window.__demo.chapitre(t), texte),
        async note(html) { noter(html ? 'note' : 'note-fin'); await page.evaluate(h => window.__demo.note(h), html); },
        async carton(html) { noter(html ? 'carton' : 'carton-fin'); await page.evaluate(h => window.__demo.carton(h), html); },
        puce: () => page.evaluate(() => window.__demo.puce()),
    };
}
