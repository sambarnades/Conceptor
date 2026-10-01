/** Les réponses externes suivent les contrats et réparations du parcours existant. */
import { t } from './vocabulaire.js';
import { allModules, h5pModules } from '../core/definitions.js';
import { brouillon, majBrouillon } from './state.js';
import { construirePromptPlan, construirePromptRemplissage, nbElementsCarte, reparationDuPlan } from './scenario-prompt.js';
import { controlerCalibrage } from './calibrage.js';
import { reparerPlan } from './reparation-plan.js';
import { planUtilisable } from './composition-plan.js';
import { normaliserPlan } from './screen-plan.js';
import { extraireJson, reparer } from './parcours-runner.js';
import { sourceManquante, preparerSource, appliquerSource, purgerMedias, typeSource } from './sources.js';
import { MODULES_PARCOURS } from './modules-parcours.js';
import { ouvrirDialogueExterne } from './external-ai-dialog.js';
import { confirmerRegeneration } from './confirm-abandon.js';
import { confirmerRemplacement } from './scenario-actions.js';
import { releverParcours, ORIGINES_PLAN } from './stats-parcours.js';
import { nomModule, imageModule, iconeModule } from './activity-router.js';
import { reglagesDeCarte } from './aiguillage.js';
import { reglagesDeTrame } from './templates.js';

function objet(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('parcours_reponse_sans_json');
    return value;
}
/**
 * La réponse d'une IA externe passe par le même réparateur que celle de l'IA de
 * Caramel (D107) : réparée, puis ramenée à la forme demandée s'il reste un écart.
 * Seule une réponse sans aucune activité est refusée.
 */
export async function verifierPlanExterne(texte, contexte) {
    const brut = objet(await extraireJson(texte));
    const { calibrage, modules, reparation = {} } = contexte;
    let { plan: repare } = reparerPlan(brut, calibrage, modules, reparation);
    if (controlerCalibrage(repare, calibrage, modules).length) {
        repare = reparerPlan(repare, calibrage, modules, { ...reparation, dernierRecours: true }).plan;
    }
    const plan = normaliserPlan(repare, contexte.platform);
    if (!planUtilisable(plan)) throw new Error('parcours_plan_sans_activite');
    return { value: plan, preview: [plan.titre, ...plan.etapes.map(e => `${e.titre} (${e.cartes.length})`)] };
}
export function ouvrirPlanExterne(draft, apresApplication, { genererEnUnClic } = {}) {
    return ouvrirDialogueExterne({
        owner: draft, title: t('parcours_cta_plan'), etiquette: t('parcours_step_plan'),
        description: draft.contexte?.quoi || '', iconeNom: 'fa-route',
        libelleUtiliser: t('parcours_cta_plan'), genererEnUnClic, scenario: true,
        preparer: async () => ({ ...construirePromptPlan(draft), platform: draft.platform, planInitial: draft.plan, reparation: reparationDuPlan(draft) }),
        verifier: verifierPlanExterne,
        appliquer: async (plan, contexte, panneau) => {
            if (brouillon() !== draft || draft.plan !== contexte.planInitial) throw new Error(t('parcours_external_changed'));
            if (draft.plan && !await confirmerRemplacement(panneau)) return false;
            majBrouillon({ plan, statsId: releverParcours(draft, plan, { origine: ORIGINES_PLAN.iaExterne }) }); apresApplication();
        },
    });
}

export async function verifierActiviteExterne(texte, { carte, source }) {
    const brut = await extraireJson(texte);
    if (!(Array.isArray(brut) && ['Glossary', 'InteractiveVideo'].includes(carte.module))) objet(brut);
    const sourceComplete = source?.type === 'image'
        ? { ...source, imageDescription: source.imageDescription || brut.backgroundImageAltText || brut.imageDescription || '' }
        : source;
    const contenu = await reparer(await appliquerSource(brut, sourceComplete, carte.module), carte.module);
    if (carte.titre) contenu.title = carte.titre;
    const special = MODULES_PARCOURS[carte.module];
    if (special) {
        if (!String(contenu.intro || '').trim()) throw new Error(t('parcours_mod_champ_intro'));
        for (const field of special.listes || []) if (!Array.isArray(contenu[field]) || !contenu[field].length) throw new Error(field);
        // Questions, pages : une liste d'objets, jugée APRÈS normalisation — un
        // objet vide ou une question sans énoncé ne compte pas.
        for (const [field, format] of Object.entries(special.structures || {})) {
            contenu[field] = format.normaliser(contenu[field]);
            if (!contenu[field].length) throw new Error(field);
        }
    } else {
        const { getSchemaForType, normalizeDataForEditor, detectContentType } = await import('../editor/content-detector.js');
        const { getValidationErrors } = await import('../editor/validators.js');
        const key = detectContentType(contenu, allModules[carte.module]?.name)?.moduleKey || carte.module;
        const normalized = normalizeDataForEditor(structuredClone(contenu), key);
        const schema = getSchemaForType(key, normalized);
        if (!schema) throw new Error('parcours_module_sans_prompt');
        const errors = getValidationErrors(normalized, schema);
        if (errors.length) throw new Error(errors.slice(0, 8).map(e => `${e.field || e.path} : ${e.message}`).join('\n'));
    }
    return { value: contenu, preview: [carte.titre || contenu.title || carte.module] };
}

export function ouvrirActiviteExterne(draft, carte, apresApplication, { genererEnUnClic } = {}) {
    const h5p = Boolean(h5pModules[carte.module]);
    return ouvrirDialogueExterne({
        owner: carte, title: carte.titre || carte.contenu?.title || nomModule(carte.module),
        // Même pastille que la modale d'activité : « H5P » en bleu, « Éléa » en rose.
        etiquette: h5p ? 'H5P' : 'Éléa', famille: h5p ? 'h5p' : 'elea',
        description: [nomModule(carte.module), carte.objectif].filter(Boolean).join(' · '),
        image: imageModule(carte.module), iconeNom: iconeModule(carte.module) || 'fa-puzzle-piece',
        libelleUtiliser: t('generate_activity'), genererEnUnClic,
        preparer: async signal => {
            if (sourceManquante(carte)) throw new Error('parcours_source_manquante');
            // Une image est jointe par l’enseignant à son IA : aucun appel de vision intégré.
            const image = typeSource(carte.module) === 'image';
            const source = image ? { type: 'image', image: { ...carte.source } }
                : await preparerSource(draft, carte, signal, nbElementsCarte(carte));
            const demande = await construirePromptRemplissage(draft, carte, image ? null : source);
            if (image) demande.prompt += '\n\n' + t('parcours_external_image');
            return { ...demande, source, carte, module: carte.module, plan: draft.plan, contenuInitial: carte.contenu };
        },
        verifier: verifierActiviteExterne,
        appliquer: async (contenu, contexte, panneau) => {
            if (brouillon() !== draft || draft.plan !== contexte.plan || carte.module !== contexte.module || carte.contenu !== contexte.contenuInitial) throw new Error(t('parcours_external_changed'));
            if (carte.contenu && !await confirmerRegeneration(panneau)) return false;
            carte.contenu = reglagesDeTrame(draft.trame, carte, reglagesDeCarte(draft.plan, carte, contenu)); carte.sourceUtilisee = carte.source ? JSON.stringify(carte.source) : null;
            purgerMedias(carte); majBrouillon({ plan: draft.plan }); apresApplication();
        },
    });
}
