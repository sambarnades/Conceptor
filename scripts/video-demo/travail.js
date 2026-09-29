/**
 * Le suivi d'une génération, partagé par le studio et la table de montage : un dialogue
 * avec le pourcentage, les étapes, le temps restant, puis la vidéo. Le travail tourne sur
 * le serveur du studio : fermer le dialogue (ou la page) ne l'arrête pas, une pastille
 * garde le pourcentage en vue et le rouvre.
 *
 *   Travail.lancer('finale')   montage des voix + habillage + copie sur le Bureau
 *   Travail.lancer('apercu')   montage des voix seul (une minute environ)
 */
(() => {
  const style = document.createElement('style');
  style.textContent = `
  .tr-dialogue { border: 1px solid var(--filet); border-radius: 14px; padding: 0; width: min(860px, calc(100vw - 32px)); background: var(--surface); color: var(--encre); }
  .tr-dialogue::backdrop { background: rgba(10, 14, 20, .55); }
  .tr-corps { padding: 20px 22px; display: grid; gap: 14px; max-height: 90vh; overflow: auto; }
  .tr-corps h2 { margin: 0; font-size: 19px; overflow-wrap: anywhere; }
  .tr-chiffre { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .tr-chiffre b { font: 800 44px/1 -apple-system, BlinkMacSystemFont, sans-serif; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
  .tr-chiffre span { color: var(--doux); font-variant-numeric: tabular-nums; }
  .tr-barre { height: 12px; border-radius: 6px; background: var(--fond); overflow: hidden; }
  .tr-barre > div { height: 100%; width: 0; border-radius: 6px; background: linear-gradient(90deg, #f0a24b, #d97b1c); transition: width .6s ease; }
  .tr-dialogue[data-etat="fini"] .tr-barre > div { background: var(--ok); }
  .tr-dialogue[data-etat="echec"] .tr-barre > div, .tr-dialogue[data-etat="annule"] .tr-barre > div { background: var(--rouge); }
  .tr-etapes { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .tr-etapes li { display: flex; gap: 10px; align-items: center; color: var(--doux); }
  .tr-etapes li::before { content: ""; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--filet); flex: none; }
  .tr-etapes li.faite { color: var(--encre); } .tr-etapes li.faite::before { background: var(--ok); border-color: var(--ok); }
  .tr-etapes li.encours { color: var(--encre); font-weight: 600; } .tr-etapes li.encours::before { border-color: #d97b1c; background: #f0a24b; animation: tr-pouls 1.2s ease-in-out infinite; }
  .tr-etapes small { font-weight: 400; color: var(--doux); }
  @keyframes tr-pouls { 50% { transform: scale(1.35); } }
  .tr-video { width: 100%; max-height: 50vh; background: #000; border-radius: 10px; }
  .tr-journal { margin: 0; max-height: 200px; overflow: auto; font: 12px/1.5 ui-monospace, Menlo, monospace; background: var(--fond); border-radius: 8px; padding: 10px; white-space: pre-wrap; }
  .tr-journal:empty { display: none; }
  .tr-pied { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
  .tr-pastille { position: fixed; right: 18px; bottom: 18px; z-index: 50; display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 999px; border: 1px solid var(--filet); background: var(--surface); color: var(--encre); box-shadow: 0 8px 26px rgba(0,0,0,.18); font: 600 14px/1 -apple-system, sans-serif; cursor: pointer; font-variant-numeric: tabular-nums; }
  .tr-pastille i { width: 60px; height: 6px; border-radius: 3px; background: var(--fond); overflow: hidden; display: block; }
  .tr-pastille i > span { display: block; height: 100%; background: #d97b1c; }
  @media (prefers-reduced-motion: reduce) { .tr-etapes li.encours::before { animation: none; } .tr-barre > div { transition: none; } }`;
  document.head.append(style);

  const d = document.createElement('dialog');
  d.className = 'tr-dialogue';
  d.innerHTML = `<div class="tr-corps">
      <h2 class="tr-titre"></h2>
      <div class="tr-chiffre"><b class="tr-pc">0 %</b><span class="tr-temps"></span></div>
      <div class="tr-barre" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div></div></div>
      <ol class="tr-etapes"></ol>
      <video class="tr-video" controls playsinline hidden></video>
      <pre class="tr-journal"></pre>
      <div class="tr-pied">
        <button type="button" class="tr-annuler">Annuler</button>
        <button type="button" class="tr-finder" hidden>Afficher dans le Finder</button>
        <button type="button" class="tr-fermer">Fermer</button>
      </div></div>`;
  const pastille = document.createElement('button');
  pastille.type = 'button';
  pastille.className = 'tr-pastille';
  pastille.hidden = true;
  document.addEventListener('DOMContentLoaded', () => document.body.append(d, pastille));
  if (document.readyState !== 'loading') document.body.append(d, pastille);

  const q = s => d.querySelector(s);
  const TITRES = { finale: 'Génération de la vidéo finale', apercu: 'Aperçu : les voix posées sur l’image' };
  const duree = s => s >= 90 ? `${Math.round(s / 60)} min` : `${Math.max(1, Math.round(s))} s`;
  let suivi = null, videoMise = null;

  function peindre(t) {
    d.dataset.etat = t.etat;
    d.dataset.quoi = t.quoi || '';
    const pc = Math.floor(t.pourcentage || 0);
    const fini = t.etat === 'fini';
    q('.tr-titre').textContent = fini ? (t.quoi === 'finale' ? `Vidéo prête${t.copie ? ` : ${t.copie}` : ''}` : 'Aperçu prêt')
      : t.etat === 'echec' ? 'La génération a échoué' : t.etat === 'annule' ? 'Génération annulée' : TITRES[t.quoi] || 'Génération';
    q('.tr-pc').textContent = `${pc} %`;
    q('.tr-barre > div').style.width = `${t.pourcentage || 0}%`;
    q('.tr-barre').setAttribute('aria-valuenow', String(pc));
    q('.tr-temps').textContent = t.etat === 'en-cours'
      ? `${duree(t.ecoule)} écoulées${t.restant ? ` · reste environ ${duree(t.restant)}` : ''}`
      : fini ? `en ${duree(t.ecoule)}` : '';
    q('.tr-etapes').innerHTML = (t.etapes || []).map((e, i) => {
      const cls = fini || i < t.indice ? 'faite' : i === t.indice && t.etat === 'en-cours' ? 'encours' : '';
      const detail = i === t.indice && t.etat === 'en-cours' && t.detail && t.detail.toLowerCase() !== e.toLowerCase() ? ` <small>· ${t.detail}</small>` : '';
      return `<li class="${cls}">${e}${detail}</li>`;
    }).join('');
    q('.tr-annuler').hidden = t.etat !== 'en-cours';
    q('.tr-finder').hidden = !fini;
    q('.tr-journal').textContent = t.etat === 'echec' ? (t.journal || '').trim() : '';
    const v = q('.tr-video');
    if (fini && videoMise !== t.fin) { videoMise = t.fin; v.src = `${t.video}?${t.fin}`; v.hidden = false; }
    if (!fini) { v.hidden = true; videoMise = null; }
    pastille.hidden = t.etat !== 'en-cours' || d.open;
    pastille.innerHTML = `Génération ${pc} %<i><span style="width:${pc}%"></span></i>`;
    document.dispatchEvent(new CustomEvent('travail', { detail: t }));
  }

  async function lire() {
    try { return await (await fetch('/travail', { cache: 'no-store' })).json(); } catch { return null; }
  }
  function suivre() {
    clearInterval(suivi);
    suivi = setInterval(async () => {
      const t = await lire();
      if (!t) return;
      peindre(t);
      if (t.etat !== 'en-cours') clearInterval(suivi);
    }, 700);
  }

  async function lancer(quoi) {
    const r = await fetch('/travail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quoi }) });
    const t = await r.json().catch(() => ({ etat: 'echec', journal: 'réponse illisible' }));
    peindre(t);
    if (!d.open) d.showModal();
    suivre();
  }

  q('.tr-fermer').onclick = () => { q('.tr-video').pause(); d.close(); };
  d.addEventListener('close', async () => { const t = await lire(); if (t) peindre(t); });
  q('.tr-annuler').onclick = () => fetch('/travail/annuler', { method: 'POST' });
  q('.tr-finder').onclick = () => fetch('/reveler', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quoi: d.dataset.quoi === 'apercu' ? 'montee' : 'habillee' }) });
  pastille.onclick = () => { d.showModal(); pastille.hidden = true; };

  // Une génération lancée depuis l'autre page (ou avant un rechargement) : on la retrouve.
  lire().then(t => { if (t?.etat === 'en-cours') { peindre(t); suivre(); } });
  window.Travail = { lancer, occupe: () => d.dataset.etat === 'en-cours' };
})();
