/**
 * @file Parcours — écran 1 : le cadrage.
 *
 * Demande les trois seuls réglages que Caramel ne peut pas deviner (plateforme,
 * modalité, ampleur) et fait choisir une trame. Le contexte — sujet, public,
 * niveau, pièces jointes — n'est ni ressaisi ni récapitulé : le formulaire de
 * l'accueil est juste AU-DESSUS de l'atelier (D39), vivant, et c'est lui qui
 * fait foi. Seule exception : une note sur les documents joints, parce qu'en
 * mode Rapide les pièces jointes sont hors de vue. Rien n'est généré ici :
 * l'appel au modèle n'arrive qu'à l'écran suivant, une fois ce cadrage validé.
 *
 * Le DOM est construit par assemblage de nœuds — jamais d'`innerHTML` sur une
 * valeur saisie par l'utilisateur.
 *
 * @module parcours/screen-cadrage
 */

import { t } from '../core/translation.js';
import { CONFIG } from './config.js';
import { TRAMES, tramesCompatibles, nbActivites, nbEtapes, rythme, palierEtape } from './templates.js';
import { ouvrirBrouillon, majBrouillon, validerCadrage } from './state.js';
import { nomModule, moduleDeTrame } from './activity-router.js';

/** Fabrique un élément avec ses classes et son texte. */
function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
}

function icone(nom) {
    const i = document.createElement('i');
    i.className = `fas ${nom}`;
    i.setAttribute('aria-hidden', 'true');
    return i;
}

/**
 * Substitue les jetons `@x` d'un libellé traduit.
 * @param {string} cle
 * @param {Object} jetons
 */
function tr(cle, jetons) {
    let s = t(cle);
    if (jetons) for (const [k, v] of Object.entries(jetons)) s = s.split(`@${k}`).join(String(v));
    return s;
}

/* ------------------------------------------------------------------ *
 *  Note des documents joints
 * ------------------------------------------------------------------ */

/**
 * Peint, dans `zone`, ce que les pièces jointes du formulaire vont apporter.
 *
 * Vide quand il n'y en a pas : le sujet seul est le cas ordinaire, il n'y a
 * rien à en dire. Repeinte à chaque saisie du formulaire et à chaque dépôt,
 * par le `rafraichir` que l'écran expose à la coquille.
 *
 * @param {HTMLElement} zone
 */
function peindreSources(zone) {
    const ctx = ouvrirBrouillon().contexte;
    zone.replaceChildren();
    zone.hidden = !ctx.sources.length;
    if (!ctx.sources.length) return;

    const puces = el('div', 'pc-sources');
    for (const src of ctx.sources) {
        const puce = el('span', 'pc-source');
        const pastille = el('span', 'pc-source__dot');
        if (src.couleur) pastille.style.backgroundColor = src.couleur;
        puce.append(pastille, el('span', 'pc-source__nom', src.nom));
        puces.append(puce);
    }
    zone.append(puces);
    zone.append(el('p', 'pc-context__note', tr('parcours_ctx_sources_n', {
        n: ctx.sources.length,
        c: ctx.corpusLength.toLocaleString(),
    })));
    // Un corpus fourni prime sur les programmes officiels : c'est la règle
    // qu'applique déjà `rag-orchestrator.js`, autant l'annoncer.
    zone.append(el('p', 'pc-context__note pc-context__note--fort', t('parcours_ctx_sources_note')));
}

/* ------------------------------------------------------------------ *
 *  Blocs de choix (plateforme / modalité / ampleur)
 * ------------------------------------------------------------------ */

/**
 * @param {Object} opts
 * @param {string} opts.titleKey
 * @param {string} [opts.hintKey]
 * @param {Array}  opts.options   - { id, nameKey, descKey }
 * @param {string} opts.valeur    - id sélectionné
 * @param {string} [opts.variante]- suffixe de classe (`elea`…) pour la coloration
 * @param {Function} [opts.plateforme] - plateforme courante pour les libellés contextualisés
 * @param {Function} opts.onPick
 * @returns {{ node: HTMLElement, rafraichirLibelles: Function }}
 */
function construireChoix({ titleKey, hintKey, options, valeur, variante, plateforme = () => null, onPick }) {
    const bloc = el('div', 'pc-block');
    const peintres = [];

    const head = el('div', 'pc-block__head');
    head.append(el('h3', 'pc-block__title', t(titleKey)));
    if (hintKey) head.append(el('p', 'pc-block__hint', t(hintKey)));

    const groupe = el('div', 'pc-choices');
    groupe.setAttribute('role', 'group');
    groupe.setAttribute('aria-label', t(titleKey));

    for (const opt of options) {
        const btn = el('button', 'pc-choice');
        btn.type = 'button';
        if (variante) btn.classList.add(`pc-choice--${opt.id}`);
        btn.setAttribute('aria-pressed', String(opt.id === valeur));

        const nom = el('span', 'pc-choice__name');
        if (variante) nom.append(el('span', `pc-dot pc-dot--${opt.id}`));
        const texteNom = document.createTextNode('');
        nom.append(texteNom);
        const description = el('span', 'pc-choice__desc');
        peintres.push(() => {
            const libelles = { ...opt, ...opt.platformLabels?.[plateforme()] };
            nom.dataset.key = libelles.nameKey;
            texteNom.textContent = t(libelles.nameKey);
            description.dataset.key = libelles.descKey;
            description.textContent = t(libelles.descKey);
        });

        const tick = el('span', 'pc-choice__tick');
        tick.append(icone('fa-check'));

        btn.append(tick, nom, description);

        btn.addEventListener('click', () => {
            for (const autre of groupe.children) autre.setAttribute('aria-pressed', 'false');
            btn.setAttribute('aria-pressed', 'true');
            onPick(opt.id);
        });

        groupe.append(btn);
    }

    bloc.append(head, groupe);
    // On ne remplace pas les boutons : focus et sélection restent en place.
    const rafraichirLibelles = () => peintres.forEach(peindre => peindre());
    rafraichirLibelles();
    return { node: bloc, rafraichirLibelles };
}

/* ------------------------------------------------------------------ *
 *  Bloc des trames
 * ------------------------------------------------------------------ */

function carteTrame(trame, selectionnee, onPick, plateforme) {
    const carte = el('article', `pc-trame${selectionnee ? ' pc-trame--selected' : ''}`);
    const select = el('button', 'pc-trame__select');
    select.type = 'button';
    select.setAttribute('aria-pressed', String(selectionnee));

    const tick = el('span', 'pc-choice__tick');
    tick.append(icone('fa-check'));

    select.append(tick, el('span', 'pc-trame__name', t(trame.nameKey)));
    carte.append(select);

    // Deux lignes suffisent pour comparer les trames. Si le texte déborde, il
    // reste intégralement disponible au clic, au clavier et aux lecteurs
    // d'écran, sans transformer la carte de sélection en bouton imbriqué.
    const idDescription = `pc-trame-desc-${trame.id.replace(/[^a-z0-9_-]/gi, '-')}`;
    const zoneDescription = el('div', 'pc-trame__description');
    const description = el('p', 'pc-trame__desc', t(trame.descKey));
    description.id = idDescription;
    select.setAttribute('aria-describedby', idDescription);

    const basculeDescription = el('button', 'pc-trame__desc-toggle');
    basculeDescription.type = 'button';
    basculeDescription.hidden = true;
    basculeDescription.setAttribute('aria-expanded', 'false');
    basculeDescription.setAttribute('aria-controls', idDescription);

    const peindreBascule = () => {
        const ouverte = zoneDescription.classList.contains('pc-trame__description--ouverte');
        basculeDescription.replaceChildren(
            document.createTextNode(t(ouverte ? 'parcours_trame_desc_reduire' : 'parcours_trame_desc_lire')),
            icone(ouverte ? 'fa-chevron-up' : 'fa-chevron-down'),
        );
        basculeDescription.setAttribute('aria-expanded', String(ouverte));
    };
    const basculerDescription = () => {
        zoneDescription.classList.toggle('pc-trame__description--ouverte');
        peindreBascule();
    };
    peindreBascule();
    basculeDescription.addEventListener('click', basculerDescription);
    zoneDescription.append(description);
    carte.append(zoneDescription);

    // Le dépliage partage la ligne des métadonnées : l'information de longueur
    // reste à gauche, l'action complémentaire à droite, sans prendre une ligne
    // entière à elle seule.
    const ligneMeta = el('div', 'pc-trame__meta-row');
    carte.append(ligneMeta);

    // Le contrôle n'apparaît que si la version repliée masque vraiment du
    // texte. Le calcul attend la mise en page effective de la grille.
    requestAnimationFrame(() => {
        if (!description.isConnected) return;
        const deborde = description.scrollHeight > description.clientHeight + 1;
        basculeDescription.hidden = !deborde;
        zoneDescription.classList.toggle('pc-trame__description--repliable', deborde);
    });

    const etapes = nbEtapes(trame);
    if (etapes) {
        ligneMeta.append(el('span', 'pc-trame__meta',
            tr('parcours_trame_meta', { e: etapes, a: nbActivites(trame) })));

        // APERÇU DE LA STRUCTURE. Une description de deux lignes ne dit pas ce
        // qu'un modèle contient : on montre le déroulé réel, étape par étape,
        // avec son palier et les types d'activité suggérés. Aucun libellé neuf
        // n'est nécessaire — les noms de module et de palier sont déjà traduits.
        const apercu = el('ol', 'pc-apercu');
        const r = rythme(trame);
        trame.modules.forEach((etapeModules, i) => {
            const li = el('li', 'pc-apercu__etape');
            li.append(el('span', 'pc-apercu__num', String(i + 1)));

            const corps = el('span', 'pc-apercu__corps');
            const palier = palierEtape(trame, i);
            const pastille = el('span', `pc-palier pc-palier--${palier}`, t(`parcours_palier_${palier}`));
            pastille.title = t(`parcours_palier_${palier}_hint`);
            corps.append(pastille);
            const modules = el('span', 'pc-apercu__modules');
            for (const module of etapeModules) {
                // Une alternative (`a|b`) s'affiche telle que la plateforme choisie la résout.
                modules.append(el('span', 'pc-apercu__module', nomModule(moduleDeTrame(module, plateforme))));
            }
            corps.append(modules);
            li.append(corps);

            li.setAttribute('aria-label',
                tr('parcours_apercu_etape_aria', { n: i + 1, a: r[i] }));
            apercu.append(li);
        });
        carte.append(apercu);
    }
    ligneMeta.append(basculeDescription);

    select.addEventListener('click', () => onPick(trame.id));
    // Toute la surface informative sélectionne la trame. Seul le bouton dédié
    // « Lire la suite » déplie le descriptif.
    carte.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        onPick(trame.id);
    });
    return carte;
}

function carteAuto(selectionnee, onPick) {
    const btn = el('button', 'pc-trame pc-trame--auto');
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(selectionnee));

    const tick = el('span', 'pc-choice__tick');
    tick.append(icone('fa-check'));

    const nom = el('span', 'pc-trame__name');
    nom.append(icone('fa-wand-magic-sparkles'), document.createTextNode(t('parcours_trame_auto')));

    btn.append(tick, nom, el('span', 'pc-trame__desc', t('parcours_trame_auto_desc')));
    btn.addEventListener('click', () => onPick('auto'));
    return btn;
}

/* ------------------------------------------------------------------ *
 *  Écran complet
 * ------------------------------------------------------------------ */

/**
 * Construit l'écran de cadrage.
 * @param {Object} api - { rafraichirAction } fourni par la coquille.
 * @returns {{ node: HTMLElement, rafraichir: Function }}
 */
export function construireCadrage(api) {
    const draft = ouvrirBrouillon();
    const page = el('div', 'pc-page');

    const hero = el('div', 'pc-hero');
    hero.append(
        el('h2', null, t('parcours_cadrage_titre')),
        el('p', null, t('parcours_cadrage_lede')),
    );
    const sources = el('div', 'pc-context__sources pc-context__sources--note');
    peindreSources(sources);
    hero.append(sources);

    // --- Trames : conteneur redessiné à chaque changement de modalité/ampleur.
    const blocTrames = el('div', 'pc-block');
    const headTrames = el('div', 'pc-block__head');
    headTrames.append(
        el('h3', 'pc-block__title', t('parcours_trame_titre')),
        el('p', 'pc-block__hint', t('parcours_trame_hint')),
    );
    const grilleTrames = el('div', 'pc-trames');
    grilleTrames.setAttribute('role', 'group');
    grilleTrames.setAttribute('aria-label', t('parcours_trame_titre'));
    blocTrames.append(headTrames, grilleTrames);

    function choisirTrame(id) {
        majBrouillon({ trame: id });
        dessinerTrames();
        api.rafraichirAction();
    }

    function dessinerTrames() {
        const dispo = tramesCompatibles(draft.format, draft.ampleur);

        // Si la trame retenue ne survit pas au nouveau cadrage, on retombe sur
        // « Caramel propose » plutôt que de laisser une sélection fantôme.
        if (draft.trame !== 'auto' && !dispo.some(tr2 => tr2.id === draft.trame)) {
            draft.trame = 'auto';
            majBrouillon({ trame: 'auto' });
        }

        grilleTrames.replaceChildren();
        grilleTrames.append(carteAuto(draft.trame === 'auto', choisirTrame));

        if (!dispo.length) {
            // Filet de sécurité : la carte « Caramel propose » garantit qu'il
            // reste toujours une action possible.
            grilleTrames.append(el('p', 'pc-empty', t('parcours_trame_aucune')));
            return;
        }
        for (const trame of dispo) {
            grilleTrames.append(carteTrame(trame, trame.id === draft.trame, choisirTrame, draft.platform));
        }
    }

    const blocPlateforme = construireChoix({
        titleKey: 'parcours_platform_titre',
        options: CONFIG.platforms,
        valeur: draft.platform,
        variante: 'platform',
        onPick: (id) => {
            majBrouillon({ platform: id });
            blocFormat.rafraichirLibelles();
            // L'aperçu des trames résout ses alternatives sur la plateforme.
            dessinerTrames();
        },
    });

    const blocFormat = construireChoix({
        titleKey: 'parcours_format_titre',
        options: CONFIG.formats,
        valeur: draft.format,
        plateforme: () => draft.platform,
        onPick: (id) => { majBrouillon({ format: id }); dessinerTrames(); },
    });

    const blocAmpleur = construireChoix({
        titleKey: 'parcours_ampleur_titre',
        options: CONFIG.ampleurs,
        valeur: draft.ampleur,
        onPick: (id) => { majBrouillon({ ampleur: id }); dessinerTrames(); },
    });

    dessinerTrames();

    page.append(hero, blocPlateforme.node, blocFormat.node, blocAmpleur.node, blocTrames);
    return { node: page, rafraichir: () => peindreSources(sources) };
}

/** Expose l'état de validité au pied de page de la coquille. */
export function etatAction() {
    return validerCadrage();
}

/** Liste complète, pour les tests et l'écran de plan. */
export { TRAMES };
