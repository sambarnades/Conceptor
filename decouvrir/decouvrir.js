/**
 * La page de présentation de Caramel : vidéos à la demande, ressources lues dans
 * ressources.json, activités H5P jouées sur place, et quelques touches d'animation.
 *
 * Aucune dépendance hors du dépôt : le lecteur H5P est celui de Caramel
 * (js/vendor/h5p-standalone), les bibliothèques celles de js/vendor/h5p-libs.
 */
(() => {
    'use strict';

    const $ = (s, racine = document) => racine.querySelector(s);
    const RACINE = new URL('../', location.href);
    const duSite = chemin => new URL(chemin, RACINE).href;
    const echapper = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const mouvement = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (mouvement) document.documentElement.classList.add('anime');

    /* ------------------------------------------------------------ Vidéos */
    /** L'affiche d'abord, le lecteur Podeduc seulement au clic : la page reste légère. */
    function cadreVideo(integration, titre) {
        const f = document.createElement('iframe');
        const u = new URL(integration);
        u.searchParams.set('autoplay', 'true');
        f.src = u.href;
        f.title = titre;
        f.allow = 'autoplay; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        return f;
    }
    document.querySelectorAll('.lecteur').forEach(lecteur => {
        $('.affiche', lecteur)?.addEventListener('click', () => {
            const cadre = cadreVideo(lecteur.dataset.integration, lecteur.dataset.titre);
            lecteur.replaceChildren(cadre);
            cadre.focus();
        });
    });

    const visionneuse = $('#visionneuse');
    function ouvrirVisionneuse(integration, titre) {
        $('#visionneuse-titre').textContent = titre;
        $('#visionneuse-cadre').replaceChildren(cadreVideo(integration, titre));
        visionneuse.showModal();
    }
    // Fermer arrête la vidéo : on retire le lecteur.
    visionneuse.addEventListener('close', () => $('#visionneuse-cadre').replaceChildren());
    $('.visionneuse__fermer').addEventListener('click', () => visionneuse.close());
    visionneuse.addEventListener('click', e => { if (e.target === visionneuse) visionneuse.close(); });

    /* ------------------------------------------------------------ Ressources */
    const TYPES = {
        video: { nom: 'Vidéos', un: 'Vidéo', icone: 'fa-circle-play' },
        tutoriel: { nom: 'Tutoriels', un: 'Tutoriel', icone: 'fa-book-open' },
        presentation: { nom: 'Présentations', un: 'Présentation', icone: 'fa-display' },
        article: { nom: 'On parle de Caramel', un: 'On parle de Caramel', icone: 'fa-newspaper' },
        communaute: { nom: 'Communauté', un: 'Communauté', icone: 'fa-users' },
    };
    const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const dateLisible = d => {
        const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d || '');
        if (!m) return d || '';
        return `${m[3] ? `${Number(m[3])} ` : ''}${MOIS[Number(m[2]) - 1]} ${m[1]}`;
    };
    const codeIntegration = r => `<iframe src="${r.integration}" width="640" height="360" style="padding: 0; margin: 0; border:0" allowfullscreen title="${echapper(r.titre)}"></iframe>`;

    function rendreRessources(ressources) {
        const liste = $('#liste-ressources'), filtres = $('#filtres');
        const presents = Object.keys(TYPES).filter(t => ressources.some(r => r.type === t));
        const bouton = (type, nom, n) => `<button type="button" class="filtre" data-type="${type}" aria-pressed="${type === 'tout'}">${nom}<span>${n}</span></button>`;
        filtres.innerHTML = bouton('tout', 'Tout', ressources.length) + presents.map(t => bouton(t, TYPES[t].nom, ressources.filter(r => r.type === t).length)).join('');
        liste.innerHTML = ressources.map((r, i) => {
            const t = TYPES[r.type] || TYPES.tutoriel;
            const meta = [r.source, dateLisible(r.date), r.duree].filter(Boolean).map(echapper).map(m => `<span>${m}</span>`).join('');
            return `<article class="ressource ressource--${echapper(r.type)} revele" data-type="${echapper(r.type)}">
                <div class="ressource__bandeau"></div>
                <div class="ressource__corps">
                    <span class="ressource__type"><i class="fas ${t.icone}" aria-hidden="true"></i>${t.un}</span>
                    <h3><a href="${echapper(r.lien)}" target="_blank" rel="noopener" data-i="${i}">${echapper(r.titre)}</a></h3>
                    ${r.description ? `<p>${echapper(r.description)}</p>` : ''}
                    <div class="ressource__meta">${meta}${r.integration ? '<span><i class="fas fa-play" aria-hidden="true"></i> se regarde ici</span>' : ''}</div>
                </div></article>`;
        }).join('');
        // Une vidéo intégrable se regarde sur place ; le reste s'ouvre dans un nouvel onglet.
        liste.addEventListener('click', e => {
            const a = e.target.closest('a[data-i]');
            const r = a && ressources[Number(a.dataset.i)];
            if (!r?.integration || e.metaKey || e.ctrlKey) return;
            e.preventDefault();
            ouvrirVisionneuse(r.integration, r.titre);
        });
        filtres.addEventListener('click', e => {
            const b = e.target.closest('.filtre');
            if (!b) return;
            filtres.querySelectorAll('.filtre').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
            liste.querySelectorAll('.ressource').forEach(c => { c.hidden = b.dataset.type !== 'tout' && c.dataset.type !== b.dataset.type; });
        });
        observer(liste.querySelectorAll('.revele'));
    }

    function rendreIntegrations(ressources) {
        const zone = $('#integrations');
        const videos = ressources.filter(r => r.integration);
        zone.innerHTML = videos.map((r, i) => `<div class="integration"><b>${echapper(r.titre)}</b><button type="button" class="copier" data-i="${i}"><i class="fas fa-copy" aria-hidden="true"></i> <span>Copier le code</span></button></div>`).join('');
        zone.addEventListener('click', async e => {
            const b = e.target.closest('.copier');
            if (!b) return;
            const code = codeIntegration(videos[Number(b.dataset.i)]);
            try { await navigator.clipboard.writeText(code); }
            catch {
                // Presse-papiers refusé (page non sûre, navigateur ancien) : on sélectionne le code à la main.
                const t = Object.assign(document.createElement('textarea'), { value: code });
                document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
            }
            b.classList.add('fait');
            b.querySelector('span').textContent = 'Copié !';
            b.querySelector('i').className = 'fas fa-check';
            setTimeout(() => { b.classList.remove('fait'); b.querySelector('span').textContent = 'Copier le code'; b.querySelector('i').className = 'fas fa-copy'; }, 2200);
        });
    }

    fetch('ressources.json', { cache: 'no-cache' })
        .then(r => r.json())
        .then(({ ressources = [] }) => { rendreRessources(ressources); rendreIntegrations(ressources); })
        .catch(() => { $('#liste-ressources').innerHTML = '<p class="signaler">Les ressources n’ont pas pu être chargées.</p>'; });

    /* ------------------------------------------------------------ Activités H5P */
    const H5P_LIBS = duSite('js/vendor/h5p-libs');
    const H5P_FRAME_JS = duSite('js/vendor/h5p-standalone/3.8.2/frame.bundle.js');
    const H5P_FRAME_CSS = duSite('js/vendor/h5p-standalone/3.8.2/styles/h5p.css');
    let activites = [], courante = null, ecouteXapi = false;
    // h5p-standalone efface window.H5PStandalone après son premier usage (Caramel garde lui
    // aussi sa référence, h5p-manager.js) : on la garde dès qu'elle est là.
    let Lecteur = null;

    function rendreTuiles() {
        const tuiles = $('#tuiles');
        tuiles.innerHTML = activites.map((a, i) => `<button type="button" class="tuile" role="tab" aria-selected="false" aria-controls="scene" data-i="${i}">
            <em class="badge badge--h5p">H5P</em>
            <img src="${duSite(a.icone)}" alt="" width="56" height="56">
            <span>${echapper(a.type)}</span><small>${echapper(a.titre)}</small></button>`).join('');
        tuiles.addEventListener('click', e => { const t = e.target.closest('.tuile'); if (t) choisir(Number(t.dataset.i)); });
        // Les flèches passent d'une tuile à l'autre, comme des onglets.
        tuiles.addEventListener('keydown', e => {
            const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            if (!d) return;
            e.preventDefault();
            const i = (courante + d + activites.length) % activites.length;
            choisir(i);
            tuiles.children[i].focus();
        });
        $('#telechargements').innerHTML = activites.map(a => `<li><a href="${duSite(a.h5p)}" download><img src="${duSite(a.icone)}" alt="" width="30" height="30"><span>${echapper(a.titre)} <small>(${echapper(a.type)})</small></span><i class="fas fa-download" aria-hidden="true"></i></a></li>`).join('');
    }

    async function choisir(i) {
        if (i === courante) return;
        courante = i;
        const a = activites[i];
        document.querySelectorAll('.tuile').forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
        $('#scene-titre').textContent = a.titre;
        $('#scene-description').textContent = a.description || '';
        const lien = $('#scene-telecharger');
        lien.href = duSite(a.h5p); lien.hidden = false;
        const jeu = $('#scene-jeu');
        jeu.replaceChildren();
        const hote = document.createElement('div');
        jeu.append(hote);
        Lecteur ??= window.H5PStandalone;
        if (!Lecteur) { jeu.innerHTML = '<p class="scene__attente">Le lecteur H5P n’a pas pu être chargé.</p>'; return; }
        try {
            const h5p = new Lecteur.H5P(hote, {
                id: a.id,
                h5pJsonPath: duSite(`assets/presentation/activites/${a.id}`),
                librariesPath: H5P_LIBS,
                frameJs: H5P_FRAME_JS,
                frameCss: H5P_FRAME_CSS,
                frame: false, copyright: false, export: false, icon: false, fullScreen: false,
            });
            await (h5p?.ready || h5p);
            ecouterReussites();
        } catch (e) {
            if (courante === i) jeu.innerHTML = '<p class="scene__attente">Cette activité n’a pas pu être chargée.</p>';
            console.error('[decouvrir] activité', a.id, e);
        }
    }

    /** Un sans-faute fait tomber quelques bonbons : l'activité l'annonce par xAPI. */
    function ecouterReussites() {
        const dispatcher = window.H5P?.externalDispatcher;
        if (ecouteXapi || !dispatcher) return;
        ecouteXapi = true;
        dispatcher.on('xAPI', e => {
            const st = e?.data?.statement;
            const verbe = st?.verb?.id || '';
            const score = st?.result?.score;
            // Seulement l'activité entière (pas chaque sous-question), réussie sans faute.
            if (st?.context?.contextActivities?.parent) return;
            if (!/answered|completed/.test(verbe) || !score || !score.max || score.raw < score.max) return;
            feterReussite();
        });
    }
    let fete = 0;
    function feterReussite() {
        if (Date.now() - fete < 4000) return;
        fete = Date.now();
        const bonbon = duSite('assets/images/branding/logo_caramel_2.webp');
        const bravo = document.createElement('div');
        bravo.className = 'bravo';
        bravo.setAttribute('role', 'status');
        bravo.innerHTML = `<img src="${bonbon}" alt=""> Sans faute, bravo !`;
        document.body.append(bravo);
        setTimeout(() => bravo.remove(), 3200);
        if (!mouvement) return;
        const pluie = document.createElement('div');
        pluie.className = 'pluie';
        pluie.setAttribute('aria-hidden', 'true');
        for (let k = 0; k < 18; k++) {
            const img = document.createElement('img');
            img.src = bonbon; img.alt = '';
            img.style.left = `${Math.random() * 96}%`;
            img.style.animationDuration = `${1.8 + Math.random() * 1.6}s`;
            img.style.animationDelay = `${Math.random() * .6}s`;
            img.style.width = `${30 + Math.random() * 26}px`;
            pluie.append(img);
        }
        document.body.append(pluie);
        setTimeout(() => pluie.remove(), 4400);
    }

    fetch(duSite('assets/presentation/activites/index.json'), { cache: 'no-cache' })
        .then(r => r.json())
        .then(liste => {
            activites = liste;
            rendreTuiles();
            // Le lecteur H5P est chargé en `defer` : on attend qu'il soit là.
            const demarrer = () => ((Lecteur ??= window.H5PStandalone) ? choisir(0) : setTimeout(demarrer, 100));
            demarrer();
        })
        .catch(() => { $('#scene-jeu').innerHTML = '<p class="scene__attente">Les activités n’ont pas pu être chargées.</p>'; });

    /* ------------------------------------------------------------ Apparitions, compteurs, navigation */
    const vues = 'IntersectionObserver' in window ? new IntersectionObserver(entrees => {
        for (const e of entrees) {
            if (!e.isIntersecting) continue;
            e.target.classList.add('vu');
            vues.unobserve(e.target);
        }
    }, { rootMargin: '0px 0px -8% 0px' }) : null;
    function observer(elements) {
        elements.forEach(el => { if (vues) vues.observe(el); else el.classList.add('vu'); });
    }
    document.querySelectorAll('.section__tete, .etape, .carte-kit, .chiffre, .cinema, .sucrerie, .atelier').forEach(el => el.classList.add('revele'));
    observer(document.querySelectorAll('.revele'));

    // Les chiffres montent jusqu'à leur valeur quand ils apparaissent.
    const compteurs = 'IntersectionObserver' in window ? new IntersectionObserver(entrees => {
        for (const e of entrees) {
            if (!e.isIntersecting) continue;
            compteurs.unobserve(e.target);
            const cible = Number(e.target.dataset.compter), debut = performance.now();
            if (!mouvement) continue;
            const pas = t => {
                const f = Math.min(1, (t - debut) / 1100);
                e.target.textContent = String(Math.round(cible * (1 - Math.pow(1 - f, 3))));
                if (f < 1) requestAnimationFrame(pas);
            };
            requestAnimationFrame(pas);
        }
    }, { threshold: .6 }) : null;
    document.querySelectorAll('[data-compter]').forEach(el => { if (mouvement && compteurs) el.textContent = '0'; compteurs?.observe(el); });

    // Le lien de la section en vue s'allume dans la barre.
    const liens = [...document.querySelectorAll('.navigation a')];
    const sections = liens.map(a => $(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
        const actif = new IntersectionObserver(entrees => {
            for (const e of entrees) {
                if (!e.isIntersecting) continue;
                liens.forEach(a => a.classList.toggle('actif', a.getAttribute('href') === `#${e.target.id}`));
            }
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => actif.observe(s));
    }
})();
