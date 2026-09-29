/**
 * @file Parcours — rendre UNE activité du parcours dans un hôte : son aperçu
 * (le vrai lecteur H5P, le simulateur Moodle, ou le texte d'un module de
 * parcours) ou son édition (l'éditeur visuel de Caramel, ou le formulaire des
 * modules de parcours).
 *
 * Extrait du panneau de relecture (`activity-panel.js`) pour servir aussi la
 * vue du parcours ouverte depuis la zone de notifications (D65) : un même
 * rendu aux deux endroits, comme pour une activité unique.
 *
 * Aucune de ces fonctions ne garde d'état global, sauf le montage de l'éditeur
 * visuel, qui est un singleton de Caramel : `attendreEditeur()` le sérialise.
 *
 * @module parcours/rendu-activite
 */
import { mediaFilesPour, contenuPourEdition } from './sources.js';
import { t } from '../core/translation.js';
import { allModules, h5pModules } from '../core/definitions.js';
import { formatTextToHtml } from '../core/utils.js';
import { nomModule } from './activity-router.js';
import { estModuleParcours, MODULES_PARCOURS } from './modules-parcours.js';
import { el, action } from './dom.js';

// L’éditeur est un singleton partagé : une fermeture puis réouverture attend
// aussi la fin du montage précédent avant d’initialiser le suivant.
let chargementEditeur = null;

/** Titre d'affichage d'une carte : le plan, sinon le contenu, sinon le type. */
export function titreActivite(carte) {
    return carte.titre || carte.contenu?.title || nomModule(carte.module);
}

/** Attend la fin d'un montage d'éditeur visuel en cours, où qu'il ait été lancé. */
export async function attendreEditeur() {
    if (!chargementEditeur) return;
    try { await chargementEditeur; } catch { /* L’ouverture précédente affiche son erreur. */ }
}

/**
 * L'aperçu d'une activité.
 *
 * @param {HTMLElement} hote
 * @param {Object} cible - La carte, `cible.contenu` rempli.
 * @param {Object} o
 * @param {Function} o.valide - Faux si l'affichage a été remplacé entre-temps.
 * @param {Function} [o.avantLecteur] - `(poignee) => void`, juste avant le chargement du lecteur H5P.
 * @returns {Promise<{annuler:Function}>}
 */
export async function rendreApercu(hote, cible, { valide, avantLecteur = () => {} }) {
    const rien = { annuler: () => {} };
    const donnees = structuredClone(cible.contenu);
    if (h5pModules[cible.module]) {
        // Les bibliothèques de l'activité sont préchargées pendant l'empaquetage,
        // comme le fait l'accueil dès le choix d'une tuile : sans cela, le lecteur
        // découvrait leurs dépendances niveau par niveau, un aller-retour réseau
        // à chaque fois. Un échec n'arrête rien, le lecteur les demandera lui-même.
        const [{ packageActivity }, { getH5PManager }] = await Promise.all([
            import('../core/package-activity.js'), import('../ui/notifications.js'),
        ]);
        const [paquet] = await Promise.all([
            packageActivity({ moduleKey: cible.module, content: donnees, title: titreActivite(cible), mediaFiles: mediaFilesPour(cible) }),
            prechargerBibliotheques([cible.module]),
        ]);
        if (!valide()) return rien;
        const manager = await getH5PManager();
        if (!valide()) return rien;
        // Le lecteur se monte invisible mais à sa largeur réelle : l'attente posée
        // par l'appelant reste à l'écran jusqu'à ce que l'activité soit montée, et
        // H5P mesure sa mise en page dans la place qu'elle occupera (un conteneur
        // en `display:none` lui donnait une hauteur nulle).
        const lecteur = el('div', 'pc-lecture__lecteur pc-lecture__lecteur--chargement');
        hote.append(lecteur);
        // La poignée est remise AVANT le chargement : quitter pendant qu'il tourne
        // doit pouvoir l'annuler.
        const poignee = { annuler: () => manager.cancelLoad(lecteur) };
        avantLecteur(poignee);
        const charge = await manager.load(paquet.blob, lecteur);
        if (charge === null || !valide()) return poignee;
        for (const enfant of [...hote.children]) if (enfant !== lecteur) enfant.remove();
        lecteur.classList.remove('pc-lecture__lecteur--chargement');
        return poignee;
    }
    if (estModuleParcours(cible.module)) {
        const { sanitizeSync } = await import('../export/sanitizer.js');
        if (!valide()) return rien;
        const article = el('article', 'pc-lecture__texte');
        article.append(el('h3', null, titreActivite(cible)));
        const def = MODULES_PARCOURS[cible.module];
        for (const nom of Object.keys(def.champs).filter(n => n !== 'title')) {
            const valeur = donnees[nom];
            if (!valeur) continue;
            const structure = def.structures?.[nom];
            if (structure) {
                // Questions, pages : rendues comme l'élève les verra, pas dans
                // la syntaxe de la retouche.
                article.append(structure.versDom(valeur, el));
            } else if (Array.isArray(valeur)) {
                const liste = el('ul');
                for (const item of valeur) liste.append(el('li', null, String(item)));
                article.append(liste);
            } else {
                const texte = el('div', 'pc-lecture__prose');
                texte.innerHTML = sanitizeSync(formatTextToHtml(String(valeur)), 'EDUCATIONAL');
                article.append(texte);
            }
        }
        if (def.moduleName !== 'label') article.append(el('p', 'pc-block__hint', t('parcours_lecture_collaborative')));
        hote.replaceChildren(article);
        return rien;
    }
    const [{ renderSimulator }, { construireFichiersActivite, typeMoodle }] = await Promise.all([
        import('../simulators/index.js'), import('../moodle/mono-activity-files.js'),
    ]);
    let html;
    if (['Page', 'Livre'].includes(cible.module)) {
        // Les images envoyées dans les blocs : octets rangés dans `cible.medias`.
        html = (await construireFichiersActivite(typeMoodle(cible.module), contenuPourEdition(cible))).previewHtml;
    }
    if (!valide()) return rien;
    // Le conteneur de montage des simulateurs, comme dans l'éditeur : le
    // simulateur marque son hôte (`data-sim-root`, cible du plein écran) et ces
    // marques ne doivent pas survivre à l'activité suivante.
    const simulateur = el('div', 'sim-mount');
    hote.replaceChildren(simulateur);
    const rendu = await renderSimulator(allModules[cible.module]?.name, simulateur, donnees, html, { mode: 'teacher' });
    if (!rendu) throw new Error('Aucun lecteur pour cette activité');
    return rien;
}

/**
 * Précharge les bibliothèques H5P de ces modules (en mémoire et dans le cache
 * du navigateur), l'un après l'autre. Ne rejette jamais.
 *
 * @param {string[]} modules - Clés de modules ; les non-H5P sont ignorés.
 * @returns {Promise<void>}
 */
export async function prechargerBibliotheques(modules) {
    const h5p = [...new Set(modules)].filter(m => h5pModules[m]);
    if (!h5p.length) return;
    try {
        const { prefetchH5PLibraries } = await import('../h5p/h5p-prefetch.js');
        // En série : le réseau est partagé avec l'aperçu en cours.
        for (const m of h5p) await prefetchH5PLibraries(m);
    } catch { /* Le lecteur demandera lui-même ce qui manque. */ }
}

/**
 * L'édition d'une activité.
 *
 * @param {HTMLElement} hote
 * @param {Object} cible
 * @param {Object} o
 * @param {Function} o.valide
 * @param {Function} o.onSave - `(donnees) => void|Promise`
 * @param {Function} [o.onRequestCancel] - Annuler dans l'éditeur visuel.
 * @param {boolean} [o.dansLaModale] - Rendu dans la modale d'aperçu : ses boutons
 *   Annuler et Enregistrer sont dans le pied de la modale (`enregistrer()`), et
 *   un module de parcours reçoit le même cadre « Édition : … » que l'éditeur visuel.
 * @returns {Promise<{detruire:Function, estModifie:Function, enregistrer:Function}>}
 */
export async function rendreEdition(hote, cible, { valide, onSave, onRequestCancel, dansLaModale = false }) {
    const rien = { detruire: () => {}, estModifie: () => false, enregistrer: () => {} };
    if (estModuleParcours(cible.module)) {
        const { renderRichtextField } = await import('../editor/richtext-editor.js');
        if (!valide()) return rien;
        return formulaireSimple(hote, cible, renderRichtextField, onSave, dansLaModale);
    }
    const api = await import('../editor/index.js');
    if (!valide()) return rien;
    // L'éditeur remplace l'attente une fois monté (initJsonEditor vide son conteneur).
    chargementEditeur = api.initJsonEditor({
        type: h5pModules[cible.module] ? 'h5p' : 'mbz',
        titleKey: allModules[cible.module]?.name,
        moduleKey: cible.module,
        title: titreActivite(cible),
    }, hote, contenuPourEdition(cible), {
        onSave: r => { if (r?.data && valide()) return onSave(r.data); },
        onRequestCancel,
    });
    try { await chargementEditeur; }
    finally { chargementEditeur = null; }
    if (!valide()) { api.destroyEditor(); return rien; }
    return {
        detruire: () => api.destroyEditor(),
        estModifie: () => api.hasUnsavedChanges(),
        // Le bouton du pied de la modale : même validation que celui de l'éditeur.
        enregistrer: async () => {
            const r = await api.saveChanges();
            if (r?.data && valide()) await onSave(r.data);
        },
    };
}

/** Le formulaire d'un module de parcours (forum, sondage, étiquette…). */
function formulaireSimple(hote, cible, renderRichtextField, onSave, dansLaModale) {
    const def = MODULES_PARCOURS[cible.module];
    const donnees = cible.contenu || {};
    const listes = new Set(def.listes || []);
    const longs = new Set(def.longs || []);
    const structures = def.structures || {};
    const form = el('form', 'pc-form');
    const saisies = new Map();
    let modifie = false;
    for (const nom of Object.keys(def.champs)) {
        const cle = nom === 'title' ? 'parcours_plan_carte_titre_ph' : `parcours_mod_champ_${nom}`;
        // Moodle accepte du HTML dans intro. Retoucher sa consigne avec
        // la même barre de mise en forme que dans une activité unique.
        if (nom === 'intro') {
            const bloc = renderRichtextField({ label: cle, renderType: 'html' }, donnees[nom] || '', () => { modifie = true; }, nom);
            bloc.querySelector('[contenteditable]').setAttribute('aria-label', t(cle));
            bloc.querySelector('textarea').setAttribute('aria-label', t(cle));
            form.append(bloc);
            saisies.set(nom, bloc.querySelector('textarea'));
            continue;
        }
        const bloc = el('label', 'pc-form__champ');
        const structure = structures[nom];
        const champ = el(structure || listes.has(nom) || longs.has(nom) ? 'textarea' : 'input', 'pc-form__saisie');
        if (champ.tagName === 'TEXTAREA') champ.rows = structure ? 14 : 6; else champ.type = 'text';
        champ.value = structure ? structure.versTexte(donnees[nom])
            : listes.has(nom) ? (donnees[nom] || []).join('\n') : (donnees[nom] || (nom === 'title' ? cible.titre : '') || '');
        champ.addEventListener('input', () => { modifie = true; });
        bloc.append(el('span', 'pc-form__label', t(cle)), champ);
        // Questions et pages se retouchent en texte : la syntaxe est rappelée
        // sous le champ, sans mode d'emploi à aller chercher ailleurs.
        if (structure) bloc.append(el('span', 'pc-form__aide', t(structure.aideKey)));
        form.append(bloc);
        saisies.set(nom, champ);
    }
    const soumettre = () => {
        const contenu = { ...donnees };
        for (const [nom, champ] of saisies) contenu[nom] = structures[nom]
            ? structures[nom].depuisTexte(champ.value)
            : listes.has(nom)
                ? champ.value.split('\n').map(x => x.trim()).filter(Boolean) : champ.value;
        modifie = false;
        return onSave(contenu);
    };
    form.addEventListener('submit', e => { e.preventDefault(); soumettre(); });
    if (dansLaModale) {
        // Même cadre que l'éditeur visuel d'une activité seule : en-tête
        // « Édition : Forum », fond gris, boutons dans le pied de la modale.
        const cadre = el('div', 'pc-edition');
        const tete = el('div', 'json-editor__header');
        const titre = el('div', 'json-editor__title');
        titre.append(el('i', 'fas fa-edit json-editor__title-icon'), document.createTextNode(`${t('editor_title_prefix')} ${nomModule(cible.module)}`));
        tete.append(titre);
        cadre.append(tete, form);
        hote.replaceChildren(cadre);
    } else {
        form.append(action('parcours_mod_enregistrer', 'fa-check', () => form.requestSubmit(), 'pc-cta'));
        hote.replaceChildren(form);
    }
    saisies.values().next().value?.focus();
    return { detruire: () => {}, estModifie: () => modifie, enregistrer: () => soumettre() };
}
