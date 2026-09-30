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
import { TRAMES, tramesCompatibles, nbActivites, nbEtapes, rythme, palierEtape, nbActivitesParEleve } from './templates.js';
import { ouvrirBrouillon, majBrouillon, validerCadrage } from './state.js';
import { nomModule, moduleDeTrame } from './activity-router.js';
import { ROLES_PAR_NOMBRE } from './aiguillage.js';

/**
 * Combien de trames s'affichent d'emblée (D92). Retour de Gauthier (sept.
 * 2026) : devant une douzaine de modèles, on se perd. Les trois premiers
 * compatibles, dans l'ordre de la bibliothèque (du besoin le plus fréquent au
 * plus spécialisé), et les autres derrière « Voir les autres modèles ».
 */
const TRAMES_EN_VUE = 3;

/** Les autres modèles restent dépliés le temps de la visite de l'atelier. */
let autresModelesOuverts = false;

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
 * @param {string} [opts.classe] - classe de plus pour la rangée (`pc-choices--2`)
 * @param {Object<string,string>} [opts.pictos] - une icône par option
 * @param {Function} opts.onPick
 * @returns {{ node: HTMLElement, rafraichirLibelles: Function }}
 */
function construireChoix({ titleKey, hintKey, options, valeur, variante, plateforme = () => null, classe, pictos, onPick }) {
    const bloc = el('div', 'pc-block');
    const peintres = [];

    const head = el('div', 'pc-block__head');
    head.append(el('h3', 'pc-block__title', t(titleKey)));
    if (hintKey) head.append(el('p', 'pc-block__hint', t(hintKey)));

    const groupe = el('div', `pc-choices${classe ? ` ${classe}` : ''}`);
    groupe.setAttribute('role', 'group');
    groupe.setAttribute('aria-label', t(titleKey));

    for (const opt of options) {
        const btn = el('button', 'pc-choice');
        btn.type = 'button';
        btn.dataset.choix = opt.id;
        if (variante) btn.classList.add(`pc-choice--${opt.id}`);
        btn.setAttribute('aria-pressed', String(opt.id === valeur));

        const nom = el('span', 'pc-choice__name');
        if (variante) nom.append(el('span', `pc-dot pc-dot--${opt.id}`));
        if (pictos && pictos[opt.id]) nom.append(icone(`${pictos[opt.id]} pc-choice__picto`));
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

/**
 * Une trame à CHEMINS : le déroulé se lit comme un chemin qui se sépare puis se
 * rejoint — étapes communes, les chemins côte à côte, la fin (D90). Même carte
 * que les autres trames ; seul l'aperçu change.
 */
function carteTrameChemins(trame, selectionnee, onPick, plateforme) {
    const carte = el('article', `pc-trame pc-trame--chemins${selectionnee ? ' pc-trame--selected' : ''}`);
    const select = el('button', 'pc-trame__select');
    select.type = 'button';
    select.setAttribute('aria-pressed', String(selectionnee));
    const tick = el('span', 'pc-choice__tick');
    tick.append(icone('fa-check'));
    select.append(tick, el('span', 'pc-trame__name', t(trame.nameKey)));
    const idDescription = `pc-trame-desc-${trame.id}`;
    const description = el('p', 'pc-trame__desc', t(trame.descKey));
    description.id = idDescription;
    select.setAttribute('aria-describedby', idDescription);
    const zone = el('div', 'pc-trame__description');
    zone.append(description);
    const a = trame.aiguillage;
    const meta = el('div', 'pc-trame__meta-row');
    meta.append(el('span', 'pc-trame__meta', tr('parcours_trame_chemins_meta', {
        k: a.nombre, e: nbActivitesParEleve(trame), f: nbActivites(trame),
    })));

    const flux = el('ol', 'pc-flux');
    trame.modules.forEach((modulesEtape, i) => {
        if (i > a.debut && i < a.debut + a.nombre) return;
        const li = el('li', 'pc-flux__etape');
        if (i === a.debut) {
            li.classList.add('pc-flux__etape--chemins');
            li.append(icone('fa-code-fork'));
            for (const role of a.roles) {
                const chip = el('span', `pc-role pc-role--${role}`, t(`parcours_role_${role}`));
                chip.title = t(`parcours_role_${role}_hint`);
                li.append(chip);
            }
        } else {
            li.append(el('span', 'pc-flux__modules', modulesEtape.map(m => nomModule(moduleDeTrame(m, plateforme))).join(' · ')));
        }
        flux.append(li);
    });
    const fin = el('li', 'pc-flux__etape pc-flux__etape--fin');
    fin.append(icone('fa-flag-checkered'), document.createTextNode(t('parcours_fin_titre')));
    flux.append(fin);

    carte.append(select, zone, meta, flux);
    select.addEventListener('click', () => onPick(trame.id));
    carte.addEventListener('click', (event) => { if (!event.target.closest('button')) onPick(trame.id); });
    return carte;
}

/** Une trame en une ligne, dans « Voir les autres modèles ». */
function ligneTrame(trame, selectionnee, onPick) {
    const btn = el('button', 'pc-trame-ligne');
    btn.type = 'button';
    btn.dataset.trame = trame.id;
    btn.setAttribute('aria-pressed', String(selectionnee));
    btn.append(el('span', 'pc-trame-ligne__nom', t(trame.nameKey)), el('span', 'pc-trame-ligne__desc', t(trame.descKey)));
    btn.addEventListener('click', () => onPick(trame.id));
    return btn;
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
    const aideTrames = el('p', 'pc-block__hint');
    headTrames.append(el('h3', 'pc-block__title', t('parcours_trame_titre')), aideTrames);
    const grilleTrames = el('div', 'pc-trames');
    grilleTrames.setAttribute('role', 'group');
    grilleTrames.setAttribute('aria-label', t('parcours_trame_titre'));
    // « Voir les autres modèles » (D92) : les trames au-delà des trois premières,
    // rangées par famille, en lignes courtes.
    const basculeAutres = el('button', 'pc-trames__autres');
    basculeAutres.type = 'button';
    basculeAutres.setAttribute('aria-controls', 'pc-trames-autres');
    const autres = el('div', 'pc-familles');
    autres.id = 'pc-trames-autres';
    basculeAutres.addEventListener('click', () => {
        autresModelesOuverts = !autresModelesOuverts;
        dessinerTrames();
        basculeAutres.focus();
    });
    blocTrames.append(headTrames, grilleTrames, basculeAutres, autres);

    function choisirTrame(id) {
        majBrouillon({ trame: id });
        dessinerTrames();
        api.rafraichirAction();
    }

    function dessinerTrames() {
        const chemins = draft.structure === 'chemins';
        const dispo = tramesCompatibles(draft.format, draft.ampleur, { structure: draft.structure, chemins: draft.chemins });

        // Si la trame retenue ne survit pas au nouveau cadrage, on retombe sur
        // « Caramel propose » — ou, avec des chemins, sur la première trame à
        // chemins — plutôt que de laisser une sélection fantôme.
        if (!dispo.some(tr2 => tr2.id === draft.trame) && (chemins || draft.trame !== 'auto')) {
            const repli = chemins ? ((dispo.find(tr2 => tr2.structure === 'chemins') || dispo[0])?.id || 'libre') : 'auto';
            draft.trame = repli;
            majBrouillon({ trame: repli });
        }
        aideTrames.textContent = t(chemins ? 'parcours_trame_hint_chemins' : 'parcours_trame_hint');

        grilleTrames.replaceChildren();
        autres.replaceChildren();
        // « Caramel propose » choisit parmi les trames d'un seul chemin : avec des
        // chemins, les deux trames dédiées disent déjà tout.
        if (!chemins) grilleTrames.append(carteAuto(draft.trame === 'auto', choisirTrame));

        if (chemins) {
            basculeAutres.hidden = true;
            autres.hidden = true;
            if (!dispo.some(tr2 => tr2.structure === 'chemins')) grilleTrames.append(el('p', 'pc-empty', t('parcours_trame_chemins_aucune')));
            for (const trame of dispo) {
                grilleTrames.append(trame.structure === 'chemins'
                    ? carteTrameChemins(trame, trame.id === draft.trame, choisirTrame, draft.platform)
                    : carteTrame(trame, trame.id === draft.trame, choisirTrame, draft.platform));
            }
            return;
        }

        if (!dispo.length) {
            // Filet de sécurité : la carte « Caramel propose » garantit qu'il
            // reste toujours une action possible.
            grilleTrames.append(el('p', 'pc-empty', t('parcours_trame_aucune')));
            basculeAutres.hidden = true;
            autres.hidden = true;
            return;
        }
        const enVue = dispo.filter(tr2 => tr2.id !== 'libre').slice(0, TRAMES_EN_VUE);
        const reste = dispo.filter(tr2 => !enVue.includes(tr2));
        for (const trame of enVue) {
            grilleTrames.append(carteTrame(trame, trame.id === draft.trame, choisirTrame, draft.platform));
        }
        // Une trame choisie parmi les autres les garde dépliées : la sélection
        // ne doit jamais être hors de vue.
        if (reste.some(tr2 => tr2.id === draft.trame)) autresModelesOuverts = true;
        basculeAutres.hidden = !reste.length;
        basculeAutres.setAttribute('aria-expanded', String(autresModelesOuverts));
        basculeAutres.replaceChildren(icone(autresModelesOuverts ? 'fa-chevron-up' : 'fa-chevron-down'),
            document.createTextNode(autresModelesOuverts ? t('parcours_trames_autres_masquer')
                : tr('parcours_trames_autres', { n: reste.length })));
        autres.hidden = !autresModelesOuverts;
        for (const famille of ['seance', 'sequence', 'projet', 'specialise']) {
            const liste = reste.filter(tr2 => tr2.famille === famille);
            if (!liste.length) continue;
            const groupe = el('section', 'pc-famille');
            groupe.append(el('h4', 'pc-famille__titre', t(`parcours_famille_${famille}`)));
            const lignes = el('div', 'pc-famille__trames');
            for (const trame of liste) lignes.append(ligneTrame(trame, trame.id === draft.trame, choisirTrame));
            groupe.append(lignes);
            autres.append(groupe);
        }
    }

    // --- Un chemin pour tous, ou des chemins selon les résultats (D91).
    const blocStructure = construireChoix({
        titleKey: 'parcours_structure_titre',
        options: CONFIG.structures,
        valeur: draft.structure,
        classe: 'pc-choices--2',
        pictos: { lineaire: 'fa-arrow-right-long', chemins: 'fa-code-fork' },
        onPick: (id) => { majBrouillon({ structure: id }); peindreNombre(); dessinerTrames(); api.rafraichirAction(); },
    });
    const ligneNombre = el('div', 'pc-nb-chemins');
    const libelleNombre = el('span', 'pc-nb-chemins__lab', t('parcours_chemins_nombre'));
    libelleNombre.id = 'pc-nb-chemins-lab';
    const segment = el('div', 'pc-segment');
    segment.setAttribute('role', 'radiogroup');
    segment.setAttribute('aria-labelledby', 'pc-nb-chemins-lab');
    const resume = el('span', 'pc-nb-chemins__resume');
    ligneNombre.append(libelleNombre, segment, resume);
    blocStructure.node.append(ligneNombre);
    const boutonsNombre = CONFIG.nombresDeChemins.map((k) => {
        const b = el('button', 'pc-segment__b', String(k));
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.dataset.chemins = String(k);
        b.addEventListener('click', () => { majBrouillon({ chemins: k }); peindreNombre(); dessinerTrames(); b.focus(); });
        b.addEventListener('keydown', (e) => {
            const i = CONFIG.nombresDeChemins.indexOf(k);
            const j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
            if (j === null || j < 0 || j >= CONFIG.nombresDeChemins.length) return;
            e.preventDefault();
            boutonsNombre[j].click();
        });
        segment.append(b);
        return b;
    });
    function peindreNombre() {
        ligneNombre.hidden = draft.structure !== 'chemins';
        for (const b of boutonsNombre) {
            const actif = Number(b.dataset.chemins) === draft.chemins;
            b.setAttribute('aria-checked', String(actif));
            b.tabIndex = actif ? 0 : -1;
        }
        resume.textContent = tr('parcours_chemins_resume', {
            r: (ROLES_PAR_NOMBRE[draft.chemins] || []).map(r => t(`parcours_role_${r}`)).join(' · '),
        });
    }
    peindreNombre();

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

    page.append(hero, blocPlateforme.node, blocFormat.node, blocAmpleur.node, blocStructure.node, blocTrames);
    return { node: page, rafraichir: () => peindreSources(sources) };
}

/** Expose l'état de validité au pied de page de la coquille. */
export function etatAction() {
    return validerCadrage();
}

/** Liste complète, pour les tests et l'écran de plan. */
export { TRAMES };
