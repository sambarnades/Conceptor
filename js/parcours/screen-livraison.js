/**
 * @file Parcours — écran 4 : la livraison.
 *
 * Le dernier écran doit répondre à trois questions, dans cet ordre : qu'est-ce
 * que je récupère, qu'est-ce qui manque, et qu'est-ce que j'en fais.
 *
 *  • **Ce que je récupère** — un `.mbz` de cours : sections, activités, ordre.
 *    Un seul fichier, un seul import.
 *  • **Ce qui manque** — les cartes écartées, avec leur motif. Un parcours qui
 *    livre sept activités sur huit sans le dire est pire qu'un parcours qui en
 *    livre sept en le disant : l'enseignant découvrirait le trou en classe.
 *  • **Ce que j'en fais** — la marche à suivre pour l'importer, en trois lignes,
 *    sur place. Aller la chercher ailleurs, c'est la même rupture que d'aller
 *    chercher le fichier ailleurs.
 *
 * Le scénario `.json` s'exporte à côté : c'est la mémoire du parcours, celle
 * qui permet d'y revenir dans trois semaines sans repayer les appels au modèle.
 *
 * @module parcours/screen-livraison
 */

import { t } from '../core/translation.js';
import { debugLog, classifyError } from '../core/utils.js';
import { nomModule } from './activity-router.js';
import { cartesAPlat } from './parcours-runner.js';
import { telecharger } from './scenario-actions.js';
import { versScenario, nomFichierScenario } from './scenario-io.js';
import { ouvrirActivite } from './activity-panel.js';
import { action } from './dom.js';
import { CONFIG } from './config.js';
import { exporterFiche, exporterDetail, FORMATS } from './fiche-sequence.js';
import { tuileDuree, tuileChiffre } from './screen-plan.js';

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

function tr(cle, jetons) {
    let s = t(cle);
    if (jetons) for (const [k, v] of Object.entries(jetons)) s = s.split(`@${k}`).join(String(v));
    return s;
}

/** Réserver la place des messages traduits avant le premier téléchargement. */
function statutExport(textes) {
    const node = el('div', 'pc-export-etat');
    const message = el('p', 'pc-liv__etat');
    message.setAttribute('role', 'status');
    node.append(message);
    for (const texte of textes) {
        const reserve = el('span', 'pc-export-etat__reserve', texte);
        reserve.setAttribute('aria-hidden', 'true');
        node.append(reserve);
    }
    return { node, message };
}

/* ------------------------------------------------------------------ *
 *  Écran
 * ------------------------------------------------------------------ */

/**
 * Construit l'écran de livraison.
 *
 * @param {Object} draft - Le brouillon, contenus fabriqués.
 * @param {Object} api   - { rafraichirAction, fermer, allerA }
 * @returns {{node: HTMLElement}}
 */
export function construireLivraison(draft, api) {
    const page = el('div', 'pc-page');
    const plan = draft.plan;
    let exportEnCours = false;
    const boutonsExport = [];
    function occuper(bouton) {
        if (exportEnCours) return null;
        exportEnCours = true;
        boutonsExport.forEach(b => b.setAttribute('aria-disabled', 'true'));
        bouton.setAttribute('aria-busy', 'true');
        const image = bouton.querySelector('i');
        const classe = image.className;
        image.className = 'fas fa-circle-notch fa-spin';
        return () => {
            exportEnCours = false;
            boutonsExport.forEach(b => b.removeAttribute('aria-disabled'));
            bouton.removeAttribute('aria-busy'); image.className = classe;
        };
    }

    const hero = el('div', 'pc-hero');
    hero.append(
        el('h2', 'pc-hero__titre', plan.titre || t('parcours_titre')),
        el('p', 'pc-hero__sous', t('parcours_liv_intro')),
    );

    // --- Ce que pèse le parcours.
    const cartes = cartesAPlat(plan);
    const pretes = cartes.filter(({ carte }) => carte.contenu).length;
    const etapesPleines = (plan.etapes || [])
        .filter(e => (e.cartes || []).some(c => c.contenu)).length;

    // Les MÊMES trois repères que sur l'écran du plan, dans le MÊME ordre —
    // étapes, activités, durée. Le bandeau n'en montrait que deux, inversés :
    // l'enseignant qui venait du plan y lisait autre chose au même endroit.
    const synthese = el('div', 'pc-summary');
    synthese.append(
        tuileChiffre('etapes', etapesPleines, t('parcours_plan_n_etapes')),
        tuileChiffre('activites', pretes, t('parcours_plan_n_activites')),
    );
    synthese.append(tuileDuree({ etapes: plan.etapes.map(e => ({ ...e, cartes: e.cartes.filter(c => c.contenu) })) }));

    // --- Ce qui manque, dit sur place.
    const manquantes = cartes.filter(({ carte }) => !carte.contenu);
    let blocManques = null;
    if (manquantes.length) {
        blocManques = el('div', 'pc-block pc-block--alerte');
        const head = el('div', 'pc-block__head');
        head.append(
            el('h3', 'pc-block__title', tr('parcours_liv_ecartees', { n: manquantes.length })),
            el('p', 'pc-block__hint', t('parcours_liv_ecartees_hint')),
        );
        const ul = el('ul', 'pc-manques');
        for (const { carte } of manquantes) {
            const li = el('li');
            li.append(
                el('span', 'pc-manques__titre', carte.titre || nomModule(carte.module)),
                el('span', 'pc-manques__motif', t('parcours_liv_motif_sans_contenu')),
            );
            ul.append(li);
        }
        const retour = el('button', 'pc-secondaire');
        retour.type = 'button';
        retour.append(icone('fa-arrow-left'), document.createTextNode(t('parcours_liv_retour_fab')));
        retour.addEventListener('click', () => api.allerA(2));
        blocManques.append(head, ul, retour);
    }

    // --- La barre de livraison : le pied de la modale d'une activité générée.
    //
    // Même vocabulaire que l'aperçu d'une activité (retour d'Emmanuel du 14 sept.
    // 2026) : le groupe gris « Télécharger » et son bouton bleu au format écrit en
    // capitales, le bouton rose « Vers la Sucrerie », et « Relire » à droite, là où
    // l'aperçu place « Éditer ». Tous à la même hauteur. Ce qui n'était que de la
    // lecture (la marche d'import) se replie sous la barre.
    const blocFichier = el('section', 'pc-livrer');
    blocFichier.setAttribute('aria-labelledby', 'pc-livrer-titre');
    const titreFichier = el('h3', 'pc-sr', t('parcours_liv_mbz_titre'));
    titreFichier.id = 'pc-livrer-titre';

    const statutMbz = statutExport([t('parcours_liv_assemblage'), tr('parcours_liv_fait', {
        a: pretes + (plan.carte?.actif && draft.platform === 'elea' ? 1 : 0), s: etapesPleines + 1,
    })]);
    const etatMbz = statutMbz.message;

    // Le fichier de COURS est l'action de l'écran : un seul bouton principal,
    // libellé en clair. Le scénario .json n'est plus à côté de lui : placé dans
    // le même groupe, il se prenait pour « l'autre format du cours », alors qu'il
    // ne s'importe dans aucune plateforme (retour du 28 sept. 2026). Il a sa
    // propre section, en bas, « Reprendre ce parcours plus tard dans Caramel ».
    const btnMbz = el('button', 'pc-cta pc-export pc-livrer__mbz');
    btnMbz.type = 'button';
    btnMbz.dataset.liv = 'mbz';
    btnMbz.append(icone('fa-download'), el('span', null, t('parcours_liv_telecharger_mbz')));
    boutonsExport.push(btnMbz);

    const btnJson = el('button', 'pc-secondaire pc-livrer__json');
    btnJson.type = 'button';
    btnJson.dataset.liv = 'json';
    btnJson.append(icone('fa-floppy-disk'), el('span', null, t('parcours_liv_scenario_exporter')));
    btnJson.addEventListener('click', () => {
        telecharger(new Blob([JSON.stringify(versScenario(draft), null, 2)], { type: 'application/json' }), nomFichierScenario(draft));
    });

    btnMbz.addEventListener('click', async () => {
        const liberer = occuper(btnMbz);
        if (!liberer) return;
        etatMbz.className = 'pc-liv__etat';
        etatMbz.textContent = t('parcours_liv_assemblage');
        try {
            const { assemblerParcours } = await import('./parcours-builder.js');
            const resultat = await assemblerParcours(plan, { platformId: draft.platform });
            telecharger(resultat.blob, resultat.filename);
            // Comme un H5P généré : le parcours rejoint la zone de notifications,
            // où il se revoit, s'édite et se retélécharge (D65).
            import('./notification-parcours.js')
                .then(m => m.publierNotificationParcours(draft, resultat))
                .catch(e => console.error('[parcours] notification du parcours :', e));
            blocFichier.querySelectorAll('[data-resultat-mbz]').forEach(n => n.remove());
            etatMbz.className = 'pc-liv__etat pc-liv__etat--ok';
            etatMbz.textContent = tr('parcours_liv_fait', {
                // Les textes d'accueil et d'introduction ne sont pas des activités.
                a: resultat.activites.length - (resultat.textes || 0),
                s: resultat.sections.length,
            });
            // L'ouverture progressive dit ce qu'elle a FAIT, y compris quand
            // elle n'a rien fait. Un réglage coché qui reste sans effet — parce
            // qu'il ne reste qu'une étape, ou que les autres ont été écartées —
            // est un silence que l'enseignant ne découvrirait que devant sa
            // classe. Même règle que pour les activités écartées.
            if (plan.progression && plan.progression.actif) {
                const note = el('p', resultat.etapesContraintes
                    ? 'pc-liv__etat pc-liv__etat--ok'
                    : 'pc-liv__etat pc-liv__etat--alerte');
                note.textContent = resultat.etapesContraintes
                    ? tr('parcours_liv_progression_faite', { n: resultat.etapesContraintes })
                    : t('parcours_liv_progression_sans_effet');
                note.dataset.resultatMbz = '';
                statutMbz.node.after(note);
            }
            // Ce qui reste à faire sur la plateforme (planifier la classe
            // virtuelle, créer les groupes…). La même liste est posée dans le
            // cours, en tête, cachée aux élèves (D72) ; la dire ici aussi évite
            // qu'on ne la découvre qu'après l'import.
            if (resultat.aFaire && resultat.aFaire.length) {
                const liste = el('div', 'pc-liv__etat pc-liv__etat--alerte');
                liste.append(el('strong', null, t('parcours_afaire_titre')));
                const ul = el('ul', 'pc-manques');
                for (const ligne of resultat.aFaire) ul.append(el('li', null, ligne));
                liste.append(ul, el('p', 'pc-block__hint', t('parcours_afaire_note')));
                liste.dataset.resultatMbz = '';
                statutMbz.node.after(liste);
            }
            // Ce que le constructeur a lui-même écarté (un module non géré, un
            // backup à médias) s'ajoute à ce que la fabrication n'a pas produit.
            if (resultat.exclues.length) {
                const detail = el('ul', 'pc-liv__etat pc-liv__etat--alerte pc-manques');
                for (const x of resultat.exclues) {
                    const li = el('li');
                    li.append(el('span', 'pc-manques__titre', x.titre), el('span', 'pc-manques__motif', t(`parcours_liv_motif_${x.motif}`)));
                    detail.append(li);
                }
                detail.dataset.resultatMbz = '';
                // Une activité écartée se corrige là où elle se fabrique : on y va.
                const corriger = action('parcours_liv_retour_fab', 'fa-arrow-left', () => api.allerA(2), 'pc-secondaire');
                corriger.dataset.resultatMbz = '';
                statutMbz.node.after(detail);
                detail.after(corriger);
            }
            debugLog('parcours', 'parcours livré', resultat.filename);
        } catch (e) {
            const info = classifyError ? classifyError(e) : null;
            etatMbz.className = 'pc-liv__etat pc-liv__etat--echec';
            etatMbz.textContent = t(e.message === 'parcours_carte_perso_manquante' ? e.message
                : info && info.userMessageKey ? info.userMessageKey : 'parcours_liv_echec');
            console.error('[parcours] assemblage échoué :', e);
        } finally {
            liberer();
        }
    });

    // Le dépôt reprend le même panneau que les activités individuelles, et le
    // même bouton rose que leur aperçu. Masqué tant que `CONFIG.partageSucrerie`
    // est coupé (D67) : posé avant l'insertion, il n'apparaît jamais.
    const deposer = el('button', 'sucrerie-bridge__btn pc-livrer__sucrerie');
    deposer.hidden = !CONFIG.partageSucrerie;
    deposer.type = 'button';
    deposer.dataset.liv = 'sucrerie';
    deposer.title = t('parcours_sucrerie_hint');
    deposer.append(icone('fa-share-from-square'), el('span', null, t('parcours_deposer_sucrerie')));
    const etatPartage = el('p', 'pc-liv__etat');
    etatPartage.setAttribute('role', 'status');
    deposer.addEventListener('click', async () => {
        const liberer = occuper(deposer);
        if (!liberer) return;
        etatPartage.textContent = '';
        try {
            if (manquantes.length) throw new Error('parcours_depot_incomplet');
            const { assemblerParcours } = await import('./parcours-builder.js');
            const resultat = await assemblerParcours(plan, { platformId: draft.platform });
            if (resultat.exclues.length) throw new Error('parcours_depot_incomplet');
            if (resultat.blob.size > 10 * 1024 * 1024) throw new Error('course_file_too_large');
            const { openCourseDeposit } = await import('../sucrerie-bridge/ui/course-panel.js');
            const { texteDuParcours } = await import('./notification-parcours.js');
            const courseText = texteDuParcours(plan);
            await openCourseDeposit({ blob:resultat.blob, title:plan.titre, courseText });
        } catch (e) {
            const key = ['parcours_depot_incomplet', 'course_file_too_large'].includes(e.message)
                ? e.message : 'parcours_liv_echec';
            etatPartage.textContent = t(key);
        } finally { liberer(); }
    });
    boutonsExport.push(deposer);

    const relire = action('parcours_lecture_parcours', 'fa-eye', () => ouvrirActivite(draft, null, {
        apresEnregistrement: () => api.allerA(3, { resterSurPlace: true }),
    }), 'pc-livrer__relire');

    // En-tête : ce qu'on livre, et pour quelle plateforme ; « Relire » à droite.
    const plateforme = CONFIG.platforms.find(p => p.id === draft.platform);
    titreFichier.className = 'pc-livrer__titre';
    titreFichier.textContent = tr('parcours_liv_cours_titre', { p: plateforme ? t(plateforme.nameKey) : '' });
    const tete = el('div', 'pc-livrer__tete');
    tete.append(titreFichier, relire);

    // Corps : à gauche l'action et son résultat, à droite comment importer —
    // la marche est AFFICHÉE : repliée, on ne la trouvait qu'après avoir cherché.
    const action_ = el('div', 'pc-livrer__action');
    const etats = el('div', 'pc-livrer__etats');
    etats.append(statutMbz.node, etatPartage);
    action_.append(btnMbz, el('p', 'pc-block__hint', t('parcours_liv_mbz_hint')), deposer, etats);

    const marche = el('ol', 'pc-marche');
    for (const cle of ['parcours_liv_import_1', 'parcours_liv_import_2', 'parcours_liv_import_3']) {
        marche.append(el('li', null, t(cle)));
    }
    const importer = el('div', 'pc-livrer__import');
    importer.append(el('p', 'pc-livrer__soustitre', t('parcours_liv_import_titre')), marche);

    const corps = el('div', 'pc-livrer__corps');
    corps.append(action_, importer);
    blocFichier.classList.add('pc-livrer--cours');
    blocFichier.append(tete, corps);

    // --- Le papier : ce que le .mbz n'emporte pas.
    //
    // Deux documents, et la distinction compte. La FICHE est le plan — elle se
    // glisse dans un cahier de textes, se donne à un collègue qui reprend la
    // classe, tient en une page. Le DÉTAIL est le contenu des activités, qu'on
    // relit avant la séance ou qu'on imprime pour une version papier. Les
    // confondre donnerait un document de trente pages là où l'on en voulait une.
    const blocPapier = el('section', 'pc-livrer pc-livrer--papier');
    blocPapier.append(el('h3', 'pc-livrer__titre', t('parcours_fiche_titre')));

    const statutPapier = statutExport([t('parcours_fiche_encours')]);
    const etatPapier = statutPapier.message;

    /**
     * Une ligne de téléchargement : ce qu'on emporte, puis en quel format.
     * Les trois formats sont des boutons de même rang, écrits comme le format
     * d'une activité (DOCX, ODT, PDF) : aucun n'est « le bon », cela dépend de
     * ce dont l'enseignant dispose et de ce qu'il veut retoucher.
     */
    function ligneDocument(cleLibelle, cleAide, exporter) {
        const ligne = el('div', 'pc-papier__ligne');
        const quoi = el('div', 'pc-papier__quoi');
        quoi.append(el('span', 'pc-papier__nom', t(cleLibelle)), el('span', 'pc-papier__aide', t(cleAide)));
        ligne.append(quoi);
        const boutons = el('div', 'pc-telecharger pc-telecharger--formats');
        for (const f of FORMATS) {
            const b = el('button', 'pc-telecharger__btn pc-telecharger__btn--secondaire pc-export');
            b.type = 'button';
            b.title = `${t(cleLibelle)} · ${t(f.labelKey)}`;
            b.setAttribute('aria-label', b.title);
            boutonsExport.push(b);
            b.append(el('span', 'pc-telecharger__ext', f.id.toUpperCase()), icone('fa-download'));
            b.addEventListener('click', async () => {
                const liberer = occuper(b);
                if (!liberer) return;
                etatPapier.textContent = t('parcours_fiche_encours');
                // On verrouille pendant la fabrication : un double clic sur un
                // export qui charge docx.js lancerait deux téléchargements.
                try {
                    await exporter(f.id);
                    etatPapier.textContent = '';
                    debugLog('parcours', `document « ${t(cleLibelle)} » exporté en ${f.id}`);
                } catch (e) {
                    const info = classifyError(e);
                    etatPapier.textContent = t(
                        e && e.message === 'parcours_fiche_rien_a_exporter'
                            ? 'parcours_fiche_rien'
                            : (info && info.userMessageKey) || 'parcours_fiche_echec');
                } finally {
                    liberer();
                }
            });
            boutons.append(b);
        }
        ligne.append(boutons);
        return ligne;
    }

    blocPapier.append(
        ligneDocument('parcours_fiche_quoi_fiche', 'parcours_fiche_quoi_fiche_hint',
            f => exporterFiche(draft.plan, f, { platformId: draft.platform })),
        ligneDocument('parcours_fiche_quoi_detail', 'parcours_fiche_quoi_detail_hint',
            f => exporterDetail(draft.plan, f)),
        statutPapier.node,
    );

    // --- Reprendre plus tard : le scénario .json, pour CARAMEL seulement.
    const blocReprise = el('section', 'pc-livrer pc-livrer--reprise');
    const texteReprise = el('div', 'pc-livrer__reprise-texte');
    texteReprise.append(
        el('h3', 'pc-livrer__titre', t('parcours_liv_reprise_titre')),
        // Le nom du bouton de reprise est celui de l'interface, jamais recopié.
        el('p', 'pc-block__hint', `${t('parcours_liv_scenario_hint')} ${tr('parcours_liv_reprise_note', { b: t('parcours_liv_scenario_importer') })}`),
    );
    blocReprise.append(texteReprise, btnJson);

    const apercu = el('div', 'pc-overview');
    apercu.append(hero, synthese);
    page.append(apercu);
    if (blocManques) page.append(blocManques);
    page.append(blocFichier, blocPapier, blocReprise);
    return { node: page };
}
