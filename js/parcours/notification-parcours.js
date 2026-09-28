/**
 * @file Parcours — le parcours dans la zone de notifications (D65).
 *
 * Retour d'Emmanuel du 14 sept. 2026 : un parcours téléchargé doit se
 * retrouver au même endroit, et avec le même mécanisme, qu'un H5P généré.
 * La notification porte le fichier de cours ET un instantané du parcours ;
 * la modale d'aperçu en montre la vue (accueil, étapes, forum, activités),
 * permet d'éditer chaque activité, et régénère le fichier après retouche.
 *
 * L'instantané est indépendant du brouillon de l'atelier : comme pour une
 * activité unique, retoucher la notification ne réécrit pas la génération.
 *
 * @module parcours/notification-parcours
 */
import { t } from '../core/translation.js';

/** Les identifiants de notification par parcours, pour n'en garder qu'une. */
const parParcours = new Map();

/**
 * Le texte du parcours, tel que l'enrichissement Sucrerie le lit.
 * Les médias embarqués (data:, blob:) et les champs internes sont écartés.
 * @param {Object} plan
 * @returns {string}
 */
export function texteDuParcours(plan) {
    return [plan.titre, plan.objectifGeneral, plan.introduction, ...(plan.etapes || []).flatMap(etape => [
        etape.titre, etape.objectif, etape.introduction, ...(etape.cartes || []).flatMap(carte => [carte.titre, carte.consigne,
            JSON.stringify(carte.contenu, (key, value) => {
                if (key.startsWith('_') || (typeof value === 'string' && /^(data:|blob:)/.test(value))) return undefined;
                return value;
            })]),
    ])].filter(Boolean).join('\n\n');
}

/**
 * Pose (ou remplace) la notification d'un parcours assemblé.
 *
 * @param {Object} draft - Le brouillon de l'atelier.
 * @param {{blob:Blob, filename:string}} resultat - Le retour de `assemblerParcours`.
 * @returns {Promise<string>} L'identifiant de la notification.
 */
export async function publierNotificationParcours(draft, resultat) {
    const { addNotification, removeNotification, getNotificationById } = await import('../ui/notifications.js');
    const cle = draft.creeLe || draft.plan;
    const precedente = parParcours.get(cle);
    // Une seule notification par parcours : la dernière version remplace l'ancienne.
    if (precedente && getNotificationById(precedente)) removeNotification(precedente);
    const plan = structuredClone(draft.plan);
    const id = addNotification({
        type: 'mbz',
        title: String(plan.titre || '').trim() || t('parcours_titre'),
        fileName: resultat.filename,
        blob: resultat.blob,
        status: 'success',
        isCourse: true,
        courseText: texteDuParcours(plan),
        parcours: {
            plan,
            platform: draft.platform,
            format: draft.format,
            ampleur: draft.ampleur,
            trame: draft.trame,
        },
    });
    parParcours.set(cle, id);
    return id;
}

/**
 * Régénère le fichier d'une notification de parcours après une retouche.
 * @param {Object} notification
 * @returns {Promise<void>}
 */
export async function regenererNotificationParcours(notification) {
    const { assemblerParcours } = await import('./parcours-builder.js');
    const { plan, platform } = notification.parcours;
    const resultat = await assemblerParcours(plan, { platformId: platform });
    if (notification.blobUrl) URL.revokeObjectURL(notification.blobUrl);
    notification.blob = resultat.blob;
    notification.blobUrl = URL.createObjectURL(resultat.blob);
    notification.courseText = texteDuParcours(plan);
    notification.title = String(plan.titre || '').trim() || notification.title;
}

/**
 * Le scénario .json d'une notification de parcours, pour le téléchargement.
 * @param {Object} notification
 * @returns {Promise<{blob:Blob, nom:string}>}
 */
export async function scenarioDeNotification(notification) {
    const { versScenario, nomFichierScenario } = await import('./scenario-io.js');
    const draft = { ...notification.parcours };
    return {
        blob: new Blob([JSON.stringify(versScenario(draft), null, 2)], { type: 'application/json' }),
        nom: nomFichierScenario(draft),
    };
}
