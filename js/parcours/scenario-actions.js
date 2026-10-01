/** Le scénario est disponible dès le cadrage, sa sauvegarde dès le plan. */
import { t } from './vocabulaire.js';
import { brouillon, majBrouillon, etatSauvegarde, reinitialiser } from './state.js';
import { depuisScenario, versScenario, nomFichierScenario } from './scenario-io.js';
import { el, action, iconeTutoriel } from './dom.js';
import { confirmer } from './confirm-abandon.js';
import { releverParcours, ORIGINES_PLAN } from './stats-parcours.js';

/**
 * Remplacer le parcours en cours (un nouveau plan, un scénario repris) : une
 * vraie question de l'atelier, plus la boîte du navigateur. Elle propose
 * d'exporter le scénario sans refermer la question — c'est ce qu'elle conseille.
 * @param {HTMLElement} panneau - Rendu inerte pendant la question.
 * @returns {Promise<boolean>} Vrai si l'utilisateur choisit de remplacer.
 */
export function confirmerRemplacement(panneau) {
    return confirmer(panneau, {
        titre: 'parcours_remplacer_titre',
        texte: 'parcours_remplacer_texte',
        garder: 'parcours_remplacer_garder',
        garderIcone: 'fa-arrow-left',
        quitter: 'parcours_remplacer_confirmer',
        quitterIcone: 'fa-arrows-rotate',
        annexe: annexeExporterScenario(),
    });
}

/**
 * L'action annexe des questions qui effacent le parcours : télécharger son scénario
 * sans refermer la question. Le texte conseille d'exporter ; le bouton le fait, au lieu
 * de laisser croire que « Garder ce parcours » sauvegarde (retour d'Emmanuel, 29 sept. 2026).
 */
function annexeExporterScenario() {
    return {
        cle: 'parcours_liv_scenario_exporter', icone: 'fa-download',
        faire: () => {
            const draft = brouillon();
            if (draft?.plan) telecharger(new Blob([JSON.stringify(versScenario(draft), null, 2)], { type: 'application/json' }), nomFichierScenario(draft));
        },
    };
}

export function telecharger(blob, nom) {
    const url = URL.createObjectURL(blob);
    const lien = el('a');
    lien.href = url;
    lien.download = nom;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function construireActionsScenario({ allerA, occupe }) {
    const node = el('div', 'pc-scenario');
    const outils = el('div', 'pc-scenario__outils');
    const sauvegarder = action('parcours_liv_scenario_exporter', 'fa-download', () => {
        const draft = brouillon();
        // Le téléchargement du navigateur suffit à le dire : pas de message.
        telecharger(new Blob([JSON.stringify(versScenario(draft), null, 2)], { type: 'application/json' }), nomFichierScenario(draft));
    });
    sauvegarder.id = 'pc-scenario-exporter';
    const fichier = el('input', 'pc-liv__fichier');
    fichier.type = 'file';
    fichier.accept = '.json,application/json';
    fichier.id = 'pc-scenario-fichier';
    fichier.tabIndex = -1;
    // « Reprendre un scénario » vit dans « Personnaliser les instructions » (panneau 2) :
    // elle déclenche ce champ et écoute le résultat (`pc:scenario-import`).
    const signaler = (detail) => document.dispatchEvent(new CustomEvent('pc:scenario-import', { detail }));
    const aide = action('tutorial', iconeTutoriel(), async () => {
        const { openTutorialModal } = await import('../ui/tutorial-modal.js');
        openTutorialModal({ chapter: 'parcours' });
    });
    // L'aide garde son nom accessible et son infobulle ; à l'écran, son icône
    // suffit, comme le « ? » des autres panneaux de Caramel.
    aide.classList.add('pc-scenario__aide');
    // Un parcours livré, on en commence un autre sans rouvrir d'onglet : le
    // brouillon vivait dans l'onglet et « Un parcours » ramenait toujours le même
    // (retour d'Emmanuel du 15 sept. 2026). Le fichier livré reste dans la zone
    // de notifications ; le formulaire de l'accueil garde son sujet.
    const nouveau = action('parcours_nouveau', 'fa-plus', async () => {
        if (occupe() || !brouillon()?.plan) return;
        const accord = await confirmer(node.closest('.pc-atelier') || node, {
            titre: 'parcours_nouveau_titre',
            texte: 'parcours_nouveau_texte',
            garder: 'parcours_nouveau_garder',
            garderIcone: 'fa-route',
            quitter: 'parcours_nouveau',
            quitterIcone: 'fa-plus',
            annexe: annexeExporterScenario(),
        });
        if (!accord || occupe()) return;
        reinitialiser();
        etat.textContent = '';
        allerA(0);
    });
    nouveau.classList.add('pc-scenario__nouveau');
    nouveau.id = 'pc-nouveau-parcours';
    // « Importer un modèle » à côté de « Nouveau parcours » (D85) : l'autre façon de
    // changer de parcours. Les deux sont là dès le cadrage, pour que le haut de l'atelier
    // ne change pas d'un écran à l'autre. C'est le SEUL « Importer un modèle » : son double
    // dans le pied, à côté de « Partir du modèle », a été retiré (D85).
    const importer = action('parcours_importer_modele', 'fa-file-import', () => {
        if (!occupe()) fichier.click();
    });
    importer.classList.add('pc-scenario__importer');
    importer.id = 'pc-scenario-importer';
    const etat = el('p', 'pc-scenario__etat');
    etat.setAttribute('role', 'status');
    const memoire = el('p', 'pc-scenario__memoire');
    memoire.setAttribute('role', 'status');
    fichier.addEventListener('change', async () => {
        const choisi = fichier.files?.[0];
        if (!choisi || occupe()) return;
        try {
            if (choisi.size > 30 * 1024 * 1024) throw new Error('parcours_scenario_trop_gros');
            const patch = depuisScenario(await choisi.text());
            if (occupe() || !node.isConnected) return;
            if (brouillon()?.plan && !await confirmerRemplacement(node.closest('.pc-atelier') || node)) return;
            // Un scénario repris est un nouveau parcours pour le relevé : son
            // fichier ne porte pas d'identifiant, il en reçoit un neuf.
            majBrouillon({ ...patch, statsId: releverParcours({ ...(brouillon() || {}), ...patch }, patch.plan, { origine: ORIGINES_PLAN.import }) });
            // Le plan qui s'ouvre montre que le scénario est repris.
            etat.textContent = '';
            signaler({ ok: true });
            allerA(1);
        } catch (e) {
            etat.textContent = t(String(e.message).startsWith('parcours_scenario_') ? e.message : 'parcours_liv_import_echec');
            signaler({ ok: false, message: etat.textContent });
        } finally { fichier.value = ''; }
    });
    outils.append(nouveau, importer, sauvegarder, aide, fichier);
    node.append(outils, memoire, etat);
    function rafraichir() {
        const plan = Boolean(brouillon()?.plan);
        const niveauActuel = etatSauvegarde();
        // Exporter le scénario .json est de l'usage avancé : il se télécharge à la
        // livraison. Ici, il n'apparaît que si l'onglet ne peut plus tout garder,
        // puisque le message d'alerte y renvoie.
        sauvegarder.hidden = !plan || niveauActuel === 'complet';
        // Sur un écran étroit, seules les icônes restent : le nom passe en infobulle.
        // Sans plan, rien à effacer : « Nouveau parcours » reste visible, grisé, et son
        // infobulle dit pourquoi (même règle que « Partir du modèle »).
        nouveau.disabled = occupe() || !plan;
        nouveau.setAttribute('aria-disabled', String(nouveau.disabled));
        importer.disabled = occupe();
        for (const [bouton, cle] of [[nouveau, 'parcours_nouveau'], [importer, 'parcours_importer_modele'], [sauvegarder, 'parcours_liv_scenario_exporter'], [aide, 'tutorial']]) {
            bouton.title = t(cle);
            bouton.setAttribute('aria-label', t(cle));
        }
        if (!plan) nouveau.title = t('parcours_nouveau_vide');
        // L'infobulle dit ce qu'on importe : le mot « modèle » seul ne désigne pas le .json.
        importer.title = t('parcours_importer_modele_hint');
        sauvegarder.disabled = occupe();
        fichier.disabled = occupe();
        const niveau = etatSauvegarde();
        // Quand tout est gardé dans l'onglet, l'interface n'a rien à en dire
        // (retour d'Emmanuel du 14 sept. 2026) : seule une perte possible s'affiche.
        memoire.hidden = !plan || niveau === 'complet';
        memoire.textContent = niveau === 'complet' ? ''
            : t(niveau === 'plan' ? 'parcours_sauvegarde_allegee' : 'parcours_sauvegarde_indisponible');
        memoire.classList.toggle('pc-scenario__memoire--alerte', niveau !== 'complet');
    }
    rafraichir();
    return { node, rafraichir, effacerEtat: () => { etat.textContent = ''; } };
}
