/**
 * La page de présentation de Caramel : vidéos à la demande, ressources lues dans
 * ressources.json et activités H5P jouées sur place.
 *
 * Aucune dépendance hors du dépôt : le lecteur H5P est celui de Caramel
 * (js/vendor/h5p-standalone), les bibliothèques celles de js/vendor/h5p-libs.
 */
(() => {
    'use strict';

    const $ = (s, racine = document) => racine.querySelector(s);
    const tr = cle => window.CaramelDecouvrirI18n?.t(cle) || cle;
    const RACINE = new URL('../', location.href);
    const duSite = chemin => new URL(chemin, RACINE).href;
    const echapper = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    /* ------------------------------------------------------------ Vidéos */
    /** Même mode de confidentialité pour le lecteur et les codes à intégrer. */
    function urlIntegration(integration) {
        const u = new URL(integration);
        if ((/(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === 'youtube-nocookie.com')
            && u.pathname.startsWith('/embed/')) u.hostname = 'www.youtube-nocookie.com';
        return u;
    }
    /** L'affiche d'abord, le lecteur Podeduc seulement au clic : la page reste légère. */
    function cadreVideo(integration, titre) {
        const f = document.createElement('iframe');
        const u = urlIntegration(integration);
        u.searchParams.set('autoplay', 'true');
        f.src = u.href;
        f.title = titre;
        f.allow = 'autoplay; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        return f;
    }
    /** Lien de consultation et partage du lien public, jamais de l'iframe. */
    function commandesVideo(titre, lien) {
        const commandes = document.createElement('div');
        commandes.className = 'ressource__commandes';
        commandes.innerHTML = `<a class="video-action video-externe" href="${echapper(lien)}" target="_blank" rel="noopener"><i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i><span>${tr('open_video')}</span></a><button type="button" class="video-action video-partager"><i class="fas fa-share-nodes" aria-hidden="true"></i><span aria-live="polite">${tr('share')}</span></button>`;
        const bouton = $('.video-partager', commandes);
        let retour;
        bouton.addEventListener('click', async () => {
            if (bouton.disabled) return;
            clearTimeout(retour);
            commandes.querySelector('.video-lien')?.remove();
            bouton.querySelector('span').textContent = tr('share');
            bouton.querySelector('i').className = 'fas fa-share-nodes';
            bouton.disabled = true;
            const annoncer = cle => {
                bouton.querySelector('span').textContent = tr(cle);
                bouton.querySelector('i').className = 'fas fa-check';
            };
            try {
                let partage = false;
                if (typeof navigator.share === 'function') {
                    try { await navigator.share({ title: titre, url: lien }); partage = true; }
                    catch (e) { if (e.name === 'AbortError') return; }
                }
                if (partage) annoncer('shared');
                else {
                    try { await navigator.clipboard.writeText(lien); annoncer('link_copied'); }
                    catch {
                        // Si la copie est refusée, le lien reste sélectionnable sur place.
                        const champ = Object.assign(document.createElement('input'), {
                            className: 'video-lien', value: lien, readOnly: true
                        });
                        champ.setAttribute('aria-label', tr('video_link'));
                        commandes.append(champ); champ.select();
                        bouton.querySelector('span').textContent = tr('copy_link');
                        bouton.querySelector('i').className = 'fas fa-link';
                    }
                }
            } finally {
                bouton.disabled = false;
                retour = setTimeout(() => {
                    bouton.querySelector('span').textContent = tr('share');
                    bouton.querySelector('i').className = 'fas fa-share-nodes';
                }, 2200);
            }
        });
        return commandes;
    }
    let arreterLecture = () => {};
    function jouerVideo(lecteur, integration, titre, arreter) {
        arreterLecture();
        const cadre = cadreVideo(integration, titre);
        lecteur.replaceChildren(cadre);
        arreterLecture = arreter;
        cadre.focus();
    }
    document.querySelectorAll('.lecteur').forEach(lecteur => {
        const affiche = $('.affiche', lecteur);
        if (lecteur.dataset.lien) {
            const presentation = document.createElement('div');
            presentation.className = 'video-presentation';
            lecteur.before(presentation);
            // Le lecteur d'abord, ses boutons dessous : le haut de la vidéo s'aligne sur la colonne voisine.
            presentation.append(lecteur, commandesVideo(lecteur.dataset.titre, lecteur.dataset.lien));
        }
        affiche?.addEventListener('click', () => jouerVideo(lecteur,
            lecteur.dataset.integration, lecteur.dataset.titre, () => lecteur.replaceChildren(affiche)));
    });

    function fermerVideo(carte, rendreFocus = false) {
        carte.querySelector('.ressource__video')?.remove(); // Retirer l'iframe arrête la lecture.
        carte.classList.remove('ressource--ouverte');
        const bouton = carte.querySelector('.ressource__ouvrir');
        bouton?.setAttribute('aria-expanded', 'false');
        if (rendreFocus) bouton?.focus();
    }
    function ouvrirVideo(carte, ressource) {
        document.querySelectorAll('.ressource--ouverte').forEach(c => fermerVideo(c));
        const zone = document.createElement('div');
        zone.className = 'ressource__video';
        zone.id = carte.querySelector('.ressource__ouvrir').getAttribute('aria-controls');
        const commandes = commandesVideo(ressource.titre, ressource.lien);
        commandes.insertAdjacentHTML('beforeend', `<button type="button" class="video-action ressource__fermer"><i class="fas fa-xmark" aria-hidden="true"></i><span>${tr('close')}</span></button>`);
        zone.append(commandes);
        zone.insertAdjacentHTML('beforeend', '<div class="lecteur"></div>');
        $('.ressource__fermer', zone).addEventListener('click', () => fermerVideo(carte, true));
        carte.classList.add('ressource--ouverte');
        carte.querySelector('.ressource__ouvrir').setAttribute('aria-expanded', 'true');
        carte.querySelector('.ressource__corps').append(zone);
        jouerVideo($('.lecteur', zone), ressource.integration, ressource.titre, () => fermerVideo(carte));
        carte.scrollIntoView({ block: 'start' });
    }

    /* ------------------------------------------------------------ Ressources */
    const TYPES = {
        video: { nom: 'videos', un: 'video', visuel: 'video' },
        tutoriel: { nom: 'tutorials', un: 'tutorial', visuel: 'lire' },
        presentation: { nom: 'publications', un: 'presentation', visuel: 'video' },
        article: { nom: 'articles', un: 'article', visuel: 'lire' },
        communaute: { nom: 'community', un: 'community', visuel: 'lire' },
        conference: { nom: 'conferences', un: 'conference', visuel: 'video' },
        publication: { nom: 'publications', un: 'publication', visuel: 'lire' },
    };
    const SVG = {
        video: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="m10 8 6 4-6 4Z"/></svg>',
        lire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.5h8l4 4V21H6Z"/><path d="M14 2.5V7h4M9 11h6M9 15h6"/></svg>',
    };
    const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const dateLisible = d => {
        const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d || '');
        if (!m) return d || '';
        // « 1er octobre » : l'ordinal du premier du mois.
        return `${m[3] ? `${Number(m[3]) === 1 ? '1er' : Number(m[3])} ` : ''}${MOIS[Number(m[2]) - 1]} ${m[1]}`;
    };
    const codeIntegration = r => `<iframe src="${echapper(urlIntegration(r.integration).href)}" width="640" height="360" style="padding: 0; margin: 0; border:0" allowfullscreen title="${echapper(r.titre)}"></iframe>`;

    /** Du plus récent au plus ancien ; une date au mois passe après les dates au jour du même mois, les entrées sans date à la fin. */
    const parDate = (a, b) => (b.r.date || '').localeCompare(a.r.date || '') || a.i - b.i;

    function rendreCatalogue(ressources, { listeId, filtresId, types = TYPES, trier = false, repli = null }) {
        const liste = $(listeId), filtres = $(filtresId);
        // `data-i` garde l'indice d'origine : l'ordre d'affichage peut changer, pas la référence.
        const ordre = ressources.map((r, i) => ({ r, i }));
        if (trier) ordre.sort(parDate);
        const presents = Object.keys(types).filter(t => ressources.some(r => r.type === t));
        const bouton = (type, nom, n) => `<button type="button" class="filtre" data-type="${type}" aria-pressed="${type === 'tout'}">${nom}<span>${n}</span></button>`;
        filtres.innerHTML = bouton('tout', tr('all'), ressources.length) + presents.map(t => bouton(t, tr(types[t].nom), ressources.filter(r => r.type === t).length)).join('');
        liste.innerHTML = ordre.map(({ r, i }) => {
            const t = types[r.type] || TYPES.tutoriel;
            const meta = [r.source, dateLisible(r.date), r.duree].filter(Boolean).map(echapper).map(m => `<span>${m}</span>`).join('');
            const action = r.integration ? tr('watch_here') : t.visuel === 'video' ? tr('watch') : tr('read');
            return `<article class="ressource ressource--${echapper(r.type)}" data-type="${echapper(r.type)}">
                <div class="ressource__bandeau"></div>
                <div class="ressource__corps">
                    <span class="ressource__type">${SVG[t.visuel] || SVG.lire}<span>${tr(t.un)}<small>${action}</small></span></span>
                    <h3>${r.integration
                        ? `<button type="button" class="ressource__ouvrir" data-i="${i}" aria-expanded="false" aria-controls="${liste.id}-video-${i}">${echapper(r.titre)}</button>`
                        : `<a href="${echapper(r.lien)}" target="_blank" rel="noopener">${echapper(r.titre)}</a>`}</h3>
                    ${r.description ? `<p>${echapper(r.description)}</p>` : ''}
                    <div class="ressource__meta">${meta}</div>
                </div></article>`;
        }).join('');
        // Une vidéo agrandit sa carte dans la grille et accueille son lecteur natif.
        liste.addEventListener('click', e => {
            const bouton = e.target.closest('.ressource__ouvrir');
            const r = bouton && ressources[Number(bouton.dataset.i)];
            if (!r?.integration) return;
            const carte = bouton.closest('.ressource');
            if (carte.classList.contains('ressource--ouverte')) fermerVideo(carte, true);
            else ouvrirVideo(carte, r);
        });
        filtres.addEventListener('click', e => {
            const b = e.target.closest('.filtre');
            if (!b) return;
            filtres.querySelectorAll('.filtre').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
            liste.querySelectorAll('.ressource').forEach(c => {
                c.hidden = b.dataset.type !== 'tout' && c.dataset.type !== b.dataset.type;
                if (c.hidden) fermerVideo(c);
            });
            repli?.();
        });
    }

    /**
     * Trois rangées, puis « … » : le nombre de cartes par rangée suit la largeur de la grille.
     * Le repli a sa propre classe, distincte de `hidden` que posent les filtres.
     */
    function replierApresTroisRangees(liste, bouton) {
        const appliquer = () => {
            const deplie = bouton.getAttribute('aria-expanded') === 'true';
            const colonnes = getComputedStyle(liste).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
            const visibles = [...liste.querySelectorAll('.ressource:not([hidden])')];
            const restantes = Math.max(0, visibles.length - 3 * colonnes);
            visibles.forEach((c, k) => {
                const replie = !deplie && k >= 3 * colonnes;
                c.classList.toggle('ressource--repliee', replie);
                if (replie) fermerVideo(c);
            });
            bouton.hidden = restantes === 0;
            bouton.innerHTML = deplie
                ? `${tr('show_less')} <i class="fas fa-chevron-up" aria-hidden="true"></i>`
                : `<span aria-hidden="true">…</span> ${tr('show_more').replace('{n}', restantes)}`;
        };
        bouton.addEventListener('click', () => {
            bouton.setAttribute('aria-expanded', String(bouton.getAttribute('aria-expanded') !== 'true'));
            appliquer();
        });
        // Seule la LARGEUR change le nombre de colonnes ; replier change la hauteur, qu'on ignore.
        let largeur = 0;
        if ('ResizeObserver' in window) new ResizeObserver(([e]) => {
            if (Math.round(e.contentRect.width) === largeur) return;
            largeur = Math.round(e.contentRect.width);
            appliquer();
        }).observe(liste);
        appliquer();
        return appliquer;
    }

    function rendreMentions(mentions) {
        const types = {
            conference: TYPES.conference,
            video: TYPES.video,
            article: { nom: 'articles', un: 'article', visuel: 'lire' },
            publication: TYPES.publication,
        };
        let repli = null;
        rendreCatalogue(mentions, { listeId: '#liste-mentions', filtresId: '#filtres-mentions', types, trier: true, repli: () => repli?.() });
        repli = replierApresTroisRangees($('#liste-mentions'), $('#plus-mentions'));
        const avecDate = mentions.filter(r => r.date);
        const annees = new Set(avecDate.map(r => r.date.slice(0, 4))).size;
        $('#catalogue-intro').innerHTML = `<b>${mentions.length} ${tr('references')}</b><span>${avecDate.length} ${tr('dated')}</span><span>${annees} ${tr('years')}</span>`;
    }

    function rendreIntegrations(ressources) {
        const zone = $('#integrations');
        const videos = ressources.filter(r => r.integration);
        const option = (r, i, exemple = false) => `<label class="integration-option${exemple ? ' integration-option--exemple' : ''}">
            <input type="radio" name="integration-video" value="${i}" ${i === 0 ? 'checked' : ''}>
            ${exemple ? `<img src="${duSite(`assets/images/branding/${i === 0 ? 'logo_caramel' : 'sucrerie'}.svg`)}" alt="" width="28" height="28">` : '<i class="fas fa-circle-play" aria-hidden="true"></i>'}
            <span><b>${echapper(r.titre)}</b><small>${[r.source, r.duree].filter(Boolean).map(echapper).join(' · ')}</small></span>
        </label>`;
        zone.innerHTML = `<fieldset class="integration-choix"><legend>${tr('choose_video')}</legend>
            <div class="integration-exemples">${videos.slice(0, 2).map((r, i) => option(r, i, true)).join('')}</div>
            <div class="integration-liste">${videos.slice(2).map((r, i) => option(r, i + 2)).join('')}</div>
            </fieldset><button type="button" class="copier"><i class="fas fa-copy" aria-hidden="true"></i> <span aria-live="polite">${tr('copy_code')}</span></button>`;
        const b = $('.copier', zone);
        let choisie = 0;
        let retour;
        const reinitialiser = () => {
            clearTimeout(retour);
            b.classList.remove('fait');
            b.querySelector('span').textContent = tr('copy_code');
            b.querySelector('i').className = 'fas fa-copy';
        };
        zone.addEventListener('change', e => {
            if (e.target.name !== 'integration-video') return;
            choisie = Number(e.target.value);
            reinitialiser();
        });
        b.addEventListener('click', async () => {
            const selection = choisie;
            const code = codeIntegration(videos[Number(selection)]);
            try { await navigator.clipboard.writeText(code); }
            catch {
                // Presse-papiers refusé (page non sûre, navigateur ancien) : on sélectionne le code à la main.
                const t = Object.assign(document.createElement('textarea'), { value: code });
                document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
            }
            // Le retour concerne uniquement la vidéo qui vient d'être copiée.
            if (choisie !== selection) return;
            clearTimeout(retour);
            b.classList.add('fait');
            b.querySelector('span').textContent = tr('copied');
            b.querySelector('i').className = 'fas fa-check';
            retour = setTimeout(reinitialiser, 2200);
        });
    }

    Promise.all([
        fetch('ressources.json', { cache: 'no-cache' }).then(r => r.json()),
        fetch('on-parle-de-nous.json', { cache: 'no-cache' }).then(r => r.json()),
    ]).then(([officielles, catalogue]) => {
        const ressources = officielles.ressources || [], mentions = catalogue.mentions || [];
        rendreCatalogue(ressources, { listeId: '#liste-ressources', filtresId: '#filtres' });
        rendreMentions(mentions);
        rendreIntegrations([...ressources, ...mentions]);
    }).catch(() => {
        $('#liste-ressources').innerHTML = '<p class="signaler">Les ressources n’ont pas pu être chargées.</p>';
        $('#liste-mentions').innerHTML = '<p class="signaler">Le catalogue n’a pas pu être chargé.</p>';
    });

    /* ------------------------------------------------------------ Diaporama */
    // La visionneuse est écrite dans la page par scripts/diaporama/generer-diaporama.mjs :
    // première diapositive, sommaire et notes y sont déjà. Ce script ne charge rien, il
    // passe seulement d'une diapositive à l'autre — d'où aucun saut à l'affichage.
    const DIAPORAMA = duSite('assets/presentation/diaporama/');

    function demarrerDiaporama() {
        const visionneuse = $('#visionneuse');
        if (!visionneuse) return;
        const scene = $('#diapo-scene'), image = $('#diapo-image'), choix = $('#diapo-choix');
        const precedente = $('#diapo-precedente'), suivante = $('#diapo-suivante');
        const options = [...choix.options], notes = [...$('#diapo-notes').children];
        const total = options.length;
        let i = 0;

        /** L'image et ses notes changent ENSEMBLE, une fois la nouvelle image décodée : pas d'éclair blanc. */
        function afficher(k) {
            const url = DIAPORAMA + options[k].dataset.image;
            const echanger = () => {
                if (k !== i) return; // Une autre diapositive a été demandée entre-temps.
                image.src = url;
                image.alt = `Diapositive ${k + 1} sur ${total} : ${options[k].textContent.replace(/^\d+\.\s*/, '')}`;
                notes.forEach((n, j) => {
                    n.classList.toggle('actuelle', j === k);
                    if (j === k) n.removeAttribute('aria-hidden'); else n.setAttribute('aria-hidden', 'true');
                });
            };
            const pret = new Image();
            pret.src = url;
            (pret.decode ? pret.decode() : Promise.resolve()).then(echanger, echanger);
        }
        function aller(k) {
            i = Math.max(0, Math.min(total - 1, k));
            $('#diapo-compteur').textContent = `${i + 1} / ${total}`;
            choix.value = String(i);
            precedente.disabled = i === 0;
            suivante.disabled = i === total - 1;
            afficher(i);
            // La suivante se charge d'avance : le passage reste immédiat.
            if (options[i + 1]) new Image().src = DIAPORAMA + options[i + 1].dataset.image;
        }
        // Les notes restent fermées par défaut : on les ouvre quand on en a besoin.
        const boutonNotes = $('#diapo-notes-bouton'), zoneNotes = $('#diapo-notes-zone');
        boutonNotes.addEventListener('click', () => {
            const ouvrir = zoneNotes.hidden;
            zoneNotes.hidden = !ouvrir;
            boutonNotes.setAttribute('aria-expanded', String(ouvrir));
        });
        precedente.addEventListener('click', () => aller(i - 1));
        suivante.addEventListener('click', () => aller(i + 1));
        choix.addEventListener('change', () => aller(Number(choix.value)));
        scene.addEventListener('click', () => aller(i + 1 < total ? i + 1 : 0));
        visionneuse.addEventListener('keydown', e => {
            if (e.target === choix) return;
            const rtl = document.documentElement.dir === 'rtl';
            const pas = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, PageDown: 1, PageUp: -1 }[e.key];
            if (pas) { e.preventDefault(); aller(i + pas); }
            else if (e.key === 'Home') { e.preventDefault(); aller(0); }
            else if (e.key === 'End') { e.preventDefault(); aller(total - 1); }
        });
        // Balayage au doigt sur tablette et téléphone.
        let depart = null;
        scene.addEventListener('pointerdown', e => { depart = e.pointerType === 'mouse' ? null : e.clientX; });
        scene.addEventListener('pointerup', e => {
            if (depart === null) return;
            const dx = e.clientX - depart;
            depart = null;
            if (Math.abs(dx) > 50) { e.preventDefault(); aller(i + (dx < 0 ? 1 : -1)); }
        });
        const pleinEcran = $('#diapo-plein-ecran');
        if (!scene.requestFullscreen) pleinEcran.hidden = true;
        pleinEcran.addEventListener('click', () => {
            if (document.fullscreenElement) document.exitFullscreen();
            else scene.requestFullscreen().then(() => scene.focus()).catch(() => {});
        });
    }
    demarrerDiaporama();

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
        tuiles.innerHTML = activites.map((a, i) => `<button type="button" class="tuile h5p-tile" role="tab" aria-selected="false" aria-controls="scene" data-i="${i}">
            <span class="module-label h5p-label"><span>H5P</span></span>
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

    /** Un sans-faute reçoit un retour discret : l'activité l'annonce par xAPI. */
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

    /* ------------------------------------------------------------ Navigation */
    // Les ancres restent sous la barre, même quand une traduction augmente sa hauteur.
    const barre = $('#barre');
    const ajusterRecul = () => document.documentElement.style.setProperty(
        '--hauteur-entete', `${Math.ceil(barre.getBoundingClientRect().height) + 12}px`);
    ajusterRecul();
    if ('ResizeObserver' in window) new ResizeObserver(ajusterRecul).observe(barre);
    else window.addEventListener('resize', ajusterRecul);

    const navigation = $('.barre__navigation');
    const boutonNavigation = $('.navigation-bouton');
    const fermerNavigation = (rendreFocus = false) => {
        navigation.classList.remove('ouverte');
        boutonNavigation.setAttribute('aria-expanded', 'false');
        if (rendreFocus) boutonNavigation.focus();
    };
    boutonNavigation.addEventListener('click', () => {
        const ouvrir = !navigation.classList.contains('ouverte');
        navigation.classList.toggle('ouverte', ouvrir);
        boutonNavigation.setAttribute('aria-expanded', String(ouvrir));
        if (ouvrir) $('.navigation a').focus();
    });
    navigation.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); fermerNavigation(true); }
    });
    navigation.addEventListener('click', e => {
        if (e.target.closest('.navigation a')) fermerNavigation(true);
    });
    navigation.addEventListener('focusout', e => {
        if (!navigation.contains(e.relatedTarget)) fermerNavigation();
    });
    document.addEventListener('click', e => {
        if (!navigation.contains(e.target)) fermerNavigation();
    });
    window.matchMedia('(max-width: 1180px)').addEventListener('change', () => fermerNavigation());

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
