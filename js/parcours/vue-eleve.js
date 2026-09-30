/**
 * @file Parcours — « Voir comme un élève » (D98).
 *
 * Demande d'Emmanuel (30 sept. 2026) : quand le parcours se sépare en chemins,
 * l'enseignant doit VOIR ce que chaque élève verra. On choisit un moment (avant le
 * test, pendant son chemin, chemin terminé, parcours terminé) et un score : la
 * page du cours s'affiche comme Éléa la montrera à cet élève — son chemin et lui
 * seul, le bilan quand il y a droit, la fin du parcours au bout. Une bascule
 * « L'enseignant » montre tout, avec ce que chaque section attend.
 *
 * Rien n'est inventé pour l'occasion : le cours est reconstruit depuis le plan
 * par `coursDuPlan`, avec les MÊMES fonctions de conditions que l'assemblage, et
 * évalué avec les règles de Moodle (`visibilitePourEleve`). Ce que montre cette
 * fenêtre, c'est ce que le fichier fera.
 *
 * Un vrai `<dialog>` modal : Échap ferme, le focus y reste, et revient au bouton
 * qui l'a ouverte.
 *
 * @module parcours/vue-eleve
 */

import { t } from '../core/translation.js';
import { el, icone, tr } from './dom.js';
import { nomModule, imageModule, iconeModule } from './activity-router.js';
import { moduleSAcheve } from './modules-parcours.js';
import { formaterDuree } from './duree.js';
import {
    coursDuPlan, visibilitePourEleve, nombreQuestions, dureeParEleve, bornesEnReponses, plagesEnReponses,
} from './aiguillage.js';

const MOMENTS_CHEMINS = ['avant', 'pendant', 'chemin', 'fin'];
const MOMENTS_SIMPLES = ['avant', 'fin'];

/** Le titre d'une carte, sans charger le rendu des activités. */
function titreDe(carte) {
    return carte.titre || carte.contenu?.title || nomModule(carte.module);
}

/** « de 4 à 7 sur 10 », « 4 sur 10 ». */
function textePlage([de, a], n) {
    return de === a ? tr('parcours_plage_une', { de, n }) : tr('parcours_plage', { de, a, n });
}

/**
 * Ce qu'a fait l'élève à ce moment, pour ce score : les notes et les activités
 * achevées. On fait avancer l'élève comme le banc le fait (`run_parcours_aiguillage`) :
 * il fait ce qui lui est ouvert, puis on s'arrête au moment demandé.
 */
function eleveAuMoment(cours, groupe, moment, score, n) {
    const eleve = { notes: {}, acheves: new Set() };
    if (moment === 'avant') return eleve;
    const ouverte = s => visibilitePourEleve(s.condition, eleve) === 'ouverte';
    const faire = (predicat) => {
        for (let tour = 0; tour < 40; tour++) {
            let nouveau = false;
            for (const s of cours.sections) {
                if (s.type === 'fin' || !s.etape || !ouverte(s) || !predicat(s)) continue;
                for (const carte of (s.etape.cartes || [])) {
                    const cm = cours.cm.get(carte);
                    if (eleve.acheves.has(cm)) continue;
                    if (groupe && groupe.test === carte) eleve.notes[cours.noteDe(groupe)] = (score / Math.max(1, n)) * 100;
                    eleve.acheves.add(cm);
                    nouveau = true;
                }
            }
            if (!nouveau) return;
        }
    };
    if (!groupe) { faire(() => true); return eleve; }
    // Jusqu'au test compris : tout ce qui précède l'aiguillage.
    faire(s => s.index < groupe.debut);
    const chemin = cours.sections.find(s => s.groupe === groupe && ouverte(s));
    if (moment === 'pendant') {
        const premiere = chemin && (chemin.etape.cartes || [])[0];
        if (premiere) eleve.acheves.add(cours.cm.get(premiere));
        return eleve;
    }
    if (chemin) for (const carte of (chemin.etape.cartes || [])) eleve.acheves.add(cours.cm.get(carte));
    if (moment === 'chemin') return eleve;
    faire(() => true);
    return eleve;
}

/**
 * Ouvre la fenêtre.
 * @param {Object} plan
 * @param {Object} [o]
 * @param {string} [o.platform]
 */
export function ouvrirVueEleve(plan, { platform } = {}) {
    const retour = document.activeElement;
    const cours = coursDuPlan(plan, { sAcheve: moduleSAcheve });
    // Les aiguillages DU COURS reconstruit : ses sections et ses notes se
    // reconnaissent à ces objets-là, pas à ceux d'une seconde lecture du plan.
    const groupe = cours.groupes[0] || null;
    const n = groupe && groupe.test ? nombreQuestions(groupe.test, groupe.chemins.length) : 10;
    const moments = groupe ? MOMENTS_CHEMINS : MOMENTS_SIMPLES;
    const etat = { moment: groupe ? 'pendant' : 'avant', score: groupe ? Math.round(n / 2) : 0, prof: false };

    const dialog = el('dialog', 'pc-eleve');
    dialog.setAttribute('aria-labelledby', 'pc-eleve-titre');
    const tete = el('header', 'pc-eleve__tete');
    const titre = el('h3', 'pc-eleve__titre', t('parcours_eleve_titre'));
    titre.id = 'pc-eleve-titre';
    const fermer = el('button', 'pc-icon-btn pc-eleve__fermer');
    fermer.type = 'button';
    fermer.setAttribute('aria-label', t('parcours_eleve_fermer'));
    fermer.title = t('parcours_eleve_fermer');
    fermer.append(icone('fa-xmark'));
    fermer.addEventListener('click', () => dialog.close());
    tete.append(titre, fermer);

    const aide = el('p', 'pc-eleve__aide', t(groupe ? 'parcours_eleve_aide' : 'parcours_eleve_aide_simple'));
    const commandes = el('div', 'pc-eleve__commandes');
    const page = el('div', 'pc-eleve__cours');
    page.setAttribute('aria-live', 'polite');

    /** Un groupe de boutons-radios à un seul arrêt de tabulation. */
    function radios(labelKey, options, valeur, surChoix) {
        const ligne = el('div', 'pc-eleve__commande');
        const lab = el('span', 'pc-eleve__lab', t(labelKey));
        lab.id = `pc-eleve-${labelKey}`;
        const segment = el('div', 'pc-segment');
        segment.setAttribute('role', 'radiogroup');
        segment.setAttribute('aria-labelledby', lab.id);
        const boutons = options.map(([id, cle], i) => {
            const b = el('button', 'pc-segment__b', t(cle));
            b.type = 'button';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', String(id === valeur));
            b.tabIndex = id === valeur ? 0 : -1;
            b.addEventListener('click', () => surChoix(id));
            b.addEventListener('keydown', (e) => {
                const j = ['ArrowRight', 'ArrowDown'].includes(e.key) ? i + 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? i - 1 : null;
                if (j === null || j < 0 || j >= options.length) return;
                e.preventDefault();
                surChoix(options[j][0]);
                segment.children[j]?.focus();
            });
            return b;
        });
        segment.append(...boutons);
        ligne.append(lab, segment);
        return ligne;
    }

    function dessinerCommandes() {
        const focus = document.activeElement && commandes.contains(document.activeElement)
            ? (document.activeElement.id || document.activeElement.textContent) : null;
        commandes.replaceChildren(
            radios('parcours_eleve_qui', [['eleve', 'parcours_eleve_un_eleve'], ['prof', 'parcours_eleve_enseignant']],
                etat.prof ? 'prof' : 'eleve', (id) => { etat.prof = id === 'prof'; dessiner(); }),
        );
        if (!etat.prof) {
            // Sans chemin, il n'y a pas de test qui départage : « au début » et « à la fin ».
            const libelle = m => (groupe || m === 'fin' ? `parcours_eleve_moment_${m}` : 'parcours_eleve_moment_debut');
            commandes.append(radios('parcours_eleve_moment', moments.map(m => [m, libelle(m)]), etat.moment,
                (id) => { etat.moment = id; dessiner(); }));
            if (groupe && groupe.test) {
                const ligne = el('div', 'pc-eleve__commande');
                const lab = el('label', 'pc-eleve__lab', t('parcours_eleve_score'));
                lab.htmlFor = 'pc-eleve-score';
                const curseur = el('input', 'pc-eleve__curseur');
                curseur.type = 'range';
                curseur.id = 'pc-eleve-score';
                curseur.min = '0';
                curseur.max = String(n);
                curseur.step = '1';
                curseur.value = String(etat.score);
                curseur.disabled = etat.moment === 'avant';
                const sortie = el('output', 'pc-eleve__score');
                sortie.htmlFor = 'pc-eleve-score';
                const peindreScore = () => {
                    const j = bornesEnReponses(groupe.chemins.slice(1).map(c => c.depuis), n).filter(b => etat.score >= b).length;
                    sortie.replaceChildren(document.createTextNode(tr('parcours_eleve_score_val', { k: etat.score, n })),
                        el('span', `pc-role pc-role--${groupe.chemins[j].role}`, t(`parcours_role_${groupe.chemins[j].role}`)));
                };
                curseur.addEventListener('input', () => { etat.score = Number(curseur.value); peindreScore(); dessinerCours(); });
                peindreScore();
                ligne.append(lab, curseur, sortie);
                commandes.append(ligne);
            }
        }
        if (focus) [...commandes.querySelectorAll('button, input')].find(x => (x.id || x.textContent) === focus)?.focus();
    }

    function activite(carte, fait) {
        const ligne = el('div', 'pc-eleve__activite');
        const vignette = el('span', 'pc-eleve__vignette');
        const src = imageModule(carte.module);
        if (src) {
            const img = el('img');
            img.src = src; img.alt = ''; img.width = 28; img.height = 28; img.loading = 'lazy';
            vignette.append(img);
        } else vignette.append(icone(iconeModule(carte.module) || 'fa-puzzle-piece'));
        const corps = el('span', 'pc-eleve__corps');
        corps.append(el('span', 'pc-eleve__nom', titreDe(carte)));
        if (carte.duree) corps.append(el('span', 'pc-eleve__duree', tr('parcours_duree_activite', { d: formaterDuree(carte.duree) })));
        const statut = el('span', `pc-eleve__statut${fait ? ' pc-eleve__statut--fait' : ''}`);
        if (fait) statut.append(icone('fa-check'));
        statut.append(document.createTextNode(t(fait ? 'parcours_eleve_fait' : 'parcours_eleve_a_faire')));
        ligne.append(vignette, corps, statut);
        return ligne;
    }

    function dessinerCours() {
        const eleve = etat.prof ? { notes: {}, acheves: new Set() } : eleveAuMoment(cours, groupe, etat.moment, etat.score, n);
        page.replaceChildren();
        const accueil = el('section', 'pc-eleve__section');
        const d = dureeParEleve(plan);
        const texteDuree = d.min === d.max ? tr('parcours_duree_parcours', { d: formaterDuree(d.max) })
            : tr('parcours_duree_parcours_chemins', { min: formaterDuree(d.min), max: formaterDuree(d.max) });
        if (String(plan.introduction || '').trim()) accueil.append(el('p', 'pc-eleve__texte', plan.introduction));
        accueil.append(el('p', 'pc-eleve__texte pc-eleve__texte--fort', texteDuree));
        page.append(accueil);

        let rien = true;
        let numero = 0;
        for (const s of cours.sections) {
            if (s.type === 'etape') numero++;
            const vis = visibilitePourEleve(s.condition, eleve);
            if (!etat.prof && vis === 'masquee') continue;
            const section = el('section', `pc-eleve__section${vis === 'grisee' && !etat.prof ? ' pc-eleve__section--grisee' : ''}`);
            section.dataset.section = s.type;
            if (s.role) section.dataset.role = s.role;
            const h = el('h4', 'pc-eleve__section-titre');
            if (s.type === 'fin') {
                h.append(icone('fa-flag-checkered'), document.createTextNode(t('parcours_fin_titre')));
            } else {
                h.append(document.createTextNode(String(s.etape.titre || '').trim()
                    || (s.role ? t(`parcours_role_${s.role}`) : tr('parcours_fiche_etape', { n: numero }))));
                if (s.role && etat.prof) h.append(el('span', `pc-role pc-role--${s.role}`, t(`parcours_role_${s.role}`)));
            }
            section.append(h);
            if (etat.prof && s.condition) {
                const cle = s.type === 'chemin' ? 'parcours_eleve_cond_chemin'
                    : s.type === 'fin' ? 'parcours_eleve_cond_fin'
                        : s.condition.op === '|' ? 'parcours_eleve_cond_apres' : 'parcours_eleve_cond_progression';
                const note = el('p', 'pc-eleve__condition');
                note.append(icone('fa-lock'), document.createTextNode(s.type === 'chemin'
                    ? tr(cle, { p: textePlage(s.plage, n) }) : t(cle)));
                section.append(note);
            } else if (vis === 'grisee') {
                const note = el('p', 'pc-eleve__condition');
                note.append(icone('fa-lock'), document.createTextNode(t('parcours_eleve_grisee')));
                section.append(note);
            }
            if (s.type === 'fin') {
                const bravo = el('div', 'pc-eleve__bravo');
                bravo.append(el('strong', null, t('parcours_fin_bravo')));
                if (String(plan.conclusion || '').trim()) bravo.append(el('p', null, plan.conclusion));
                section.append(bravo);
            } else {
                if (String(s.etape.introduction || '').trim()) section.append(el('p', 'pc-eleve__texte', s.etape.introduction));
                for (const carte of (s.etape.cartes || [])) {
                    section.append(activite(carte, eleve.acheves.has(cours.cm.get(carte))));
                    if (groupe && groupe.test === carte && !etat.prof) {
                        section.append(el('p', 'pc-eleve__texte pc-eleve__texte--suite', t('parcours_chemins_suite')));
                    }
                }
            }
            if (vis === 'ouverte' || etat.prof) rien = false;
            page.append(section);
        }
        if (rien) page.append(el('p', 'pc-eleve__texte', t('parcours_eleve_rien')));
    }

    function dessiner() {
        dessinerCommandes();
        dessinerCours();
    }

    dialog.append(tete, aide, commandes, page);
    dialog.addEventListener('close', () => {
        dialog.remove();
        if (retour && typeof retour.focus === 'function') retour.focus();
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    document.body.append(dialog);
    dessiner();
    dialog.showModal();
    titre.tabIndex = -1;
    return dialog;
}

/** Réexport : l'écran du plan écrit la plage des chemins comme cette fenêtre. */
export { textePlage, plagesEnReponses };
