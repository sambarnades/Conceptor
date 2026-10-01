/**
 * @file Parcours — la file de fabrication.
 *
 * Le plan est validé ; il faut maintenant remplir chaque carte. Une file, et
 * une seule règle qui commande tout le reste : **une requête à la fois**.
 *
 * Ce n'est pas de la prudence excessive. Le backend ILaaS est MUTUALISÉ : trois
 * appels rapprochés le saturent et déclenchent une cascade de replis de modèle
 * — invisible côté client, seul `fallback_level` en garde trace côté n8n — que
 * l'on prend ensuite pour un défaut du module (cf. piège 5 du `CLAUDE.md`, et
 * l'épisode du 26 août 2026 sur la Vidéo interactive). Un parcours de huit
 * activités lancé en parallèle, c'est huit générations dégradées d'un coup.
 * D7 pose deux requêtes en vol au grand maximum ; on n'en met qu'une, parce
 * qu'aucun gain de temps ne vaut ce risque-là.
 *
 * Trois autres exigences :
 *
 *  • **Le socle commun voyage avec chaque carte** (`scenario-prompt.js`) : les
 *    notions pivots mot pour mot, et ce que les activités précédentes ont déjà
 *    couvert — « réinvestis, ne réintroduis pas ». C'est ce qui fait un parcours
 *    plutôt que huit activités sur le même thème.
 *  • **`json-healer.js` passe sur CHAQUE activité**, sans exception ni chemin
 *    rapide. Un `.h5p` cassé noyé dans huit autres est bien plus coûteux à
 *    diagnostiquer qu'un `.h5p` cassé tout seul.
 *  • **Un échec n'arrête pas la file.** La carte est marquée, la suivante part.
 *    L'enseignant relance à l'unité ce qui a manqué.
 *
 * @module parcours/parcours-runner
 */

import { debugLog, classifyError, cleanJsonInput } from '../core/utils.js';
import { h5pModules } from '../core/definitions.js';
import {
    generateH5PWithLLM, DEFAULT_MODEL, ACTIVITY_MODEL_OVERRIDES,
    beginGeneration, requestCancelGeneration, isCancellation,
} from '../services/llm.js';
import { majBrouillon } from './state.js';
import { sourceManquante, preparerSource, appliquerSource, purgerMedias } from './sources.js';
import { construirePromptRemplissage, nbElementsCarte } from './scenario-prompt.js';
import { modeleParcours } from './model-selector.js';
import { metaActiviteParcours } from './stats-parcours.js';
import { reglagesDeCarte } from './aiguillage.js';
import { reglagesDeTrame } from './templates.js';
import { defautsSortieIA, graviteSortieIA } from '../h5p/controle-sortie-ia.js';

/** États possibles d'une carte pendant la fabrication. */
export const ETATS = {
    reservee: 'reservee',
    attente: 'attente',
    source: 'source',
    encours: 'encours',
    faite: 'faite',
    echouee: 'echouee',
    annulee: 'annulee',
};

// Une ancienne file annulée peut encore attendre le réseau. Une nouvelle
// ouverture de l’atelier attend sa fin avant de lancer un autre appel.
let fabricationActive = null;

/** Toutes les cartes du plan, à plat, avec leur étape d'origine. */
export function cartesAPlat(plan) {
    const out = [];
    for (const etape of (plan && plan.etapes) || []) {
        for (const carte of (etape.cartes || [])) out.push({ carte, etape });
    }
    return out;
}

/**
 * Retire les virgules ORPHELINES — celles qui précèdent un `}` ou un `]`.
 *
 * `JSON.parse` les refuse, et ni `cleanJsonInput` ni `healJsonString` ne les
 * traitent : c'est le défaut de sortie le plus banal des modèles, et il coûte
 * une génération entière quand il tombe. Le balayage tient compte des chaînes,
 * pour ne pas mutiler une virgule légitime écrite dans un énoncé.
 *
 * Réparation de DERNIER RECOURS : elle n'est tentée qu'après deux échecs de
 * `JSON.parse`, jamais sur un JSON qui passe déjà.
 *
 * @param {string} texte
 * @returns {string}
 */
export function retirerVirgulesOrphelines(texte) {
    let sortie = '';
    let dansChaine = false;
    let echappe = false;

    for (let i = 0; i < texte.length; i++) {
        const c = texte[i];
        if (dansChaine) {
            sortie += c;
            if (echappe) { echappe = false; continue; }
            if (c === '\\') { echappe = true; continue; }
            if (c === '"') dansChaine = false;
            continue;
        }
        if (c === '"') { dansChaine = true; sortie += c; continue; }
        if (c === ',') {
            let j = i + 1;
            while (j < texte.length && /\s/.test(texte[j])) j++;
            if (texte[j] === '}' || texte[j] === ']') continue;   // virgule de trop
        }
        sortie += c;
    }
    return sortie;
}

/**
 * Extrait l'objet JSON d'une réponse qui peut être bavarde.
 *
 * Quatre tentatives, de la plus fidèle à la plus réparatrice : le JSON tel
 * quel, puis `healJsonString` (échappements LaTeX), puis les virgules
 * orphelines, puis le premier objet équilibré du texte. On ne répare que ce qui
 * a échoué : un JSON valide ressort intact.
 */
export async function extraireJson(texte) {
    const { healJsonString } = await import('../h5p/json-healer.js');
    const propre = cleanJsonInput(String(texte || ''));

    const essais = [
        () => propre,
        () => healJsonString(propre),
        () => retirerVirgulesOrphelines(healJsonString(propre)),
    ];
    for (const produire of essais) {
        try { return JSON.parse(produire()); } catch { /* on passe au suivant */ }
    }

    const debut = propre.indexOf('{');
    const fin = propre.lastIndexOf('}');
    if (debut === -1 || fin <= debut) throw new Error('parcours_reponse_sans_json');
    return JSON.parse(retirerVirgulesOrphelines(healJsonString(propre.slice(debut, fin + 1))));
}

/**
 * Passe le JSON par le réparateur, dans le même ordre que le chemin de
 * production. **Jamais contourné** : c'est lui qui remet les versions de
 * bibliothèque H5P, les UUID manquants et les antislashs LaTeX d'aplomb.
 *
 * @param {Object} brut
 * @param {string} moduleKey
 * @returns {Promise<Object>}
 */
export async function reparer(brut, moduleKey) {
    const { healJsonObject, healActivitySpecificFields, healStructureForActivity } =
        await import('../h5p/json-healer.js');
    let obj = brut;
    // `healJsonObject` et `healActivitySpecificFields` ne concernent que H5P ;
    // `healStructureForActivity` sert aux DEUX familles (il porte notamment la
    // validation de séquence des chapitres du Livre).
    if (h5pModules[moduleKey]) {
        obj = healJsonObject(obj, moduleKey);
        obj = healActivitySpecificFields(obj, moduleKey);
    }
    obj = healStructureForActivity(obj, moduleKey);
    if (moduleKey === 'test_elea') {
        const { reparerConsignesTest, verifierTrousCloze } = await import('../moodle/moodle-formats.js');
        obj = reparerConsignesTest(obj);
        // Une question à trous injouable fait échouer la CARTE, ici, plutôt que
        // l'assemblage du cours entier : « Générer à nouveau » suffit alors.
        verifierTrousCloze(obj);
    }
    return obj;
}

/** Les exercices à consigne, nommés comme dans le prompt du quiz. */
const NOMS_EXERCICES = {
    MarkTheWords: 'Surligner les mots', DragTheWords: 'Glisser les mots',
    FillInTheBlanks: 'Texte à trous', Essay: 'Rédaction',
};

/**
 * La correction demandée au modèle quand des exercices sont revenus SANS consigne :
 * elle nomme les questions en cause, et redit ce qu'est une consigne.
 * @param {Array<{numero:number, module:string}>} manques - `consignesManquantes()`.
 * @returns {string}
 */
export function rappelConsignes(manques) {
    const lesquelles = manques.map(m => (m.numero
        ? `la question ${m.numero} (${NOMS_EXERCICES[m.module] || m.module})`
        : `l'activité (${NOMS_EXERCICES[m.module] || m.module})`)).join(', ');
    return '\n\n# CORRECTION DEMANDÉE\n' +
        `Dans ta réponse précédente, ${lesquelles} ${manques.length > 1 ? 'n’avaient' : 'n’avait'} pas de consigne : ` +
        'l’élève voyait un texte sans savoir quoi y faire. Rends à nouveau le JSON COMPLET. ' +
        'Chaque exercice Texte à trous, Glisser les mots, Surligner les mots ou Rédaction porte `taskDescription` : ' +
        'une consigne adressée à l’élève, qui dit quoi faire et selon quel critère (par exemple « Surligne les mots qui décrivent… »).';
}

/**
 * La correction demandée quand des trous ont perdu leur réponse — un nom de variable
 * (« *prix_réduit* € », parcours réel du 1er oct. 2026), un trou vide, un astérisque
 * seul : l'élève ne pourrait jamais écrire ce qu'on attend de lui.
 * @param {string[]} defauts - `defautsSortieIA()`.
 * @returns {string}
 */
export function rappelTrous(defauts) {
    return '\n\n# CORRECTION DEMANDÉE\n' +
        `Dans ta réponse précédente, des trous ne portaient pas leur réponse (${defauts.join(', ')}). ` +
        'Rends à nouveau le JSON COMPLET. Entre les astérisques, écris la RÉPONSE elle-même, telle que l’élève doit la ' +
        'taper ou la glisser : un mot, ou la valeur calculée (par exemple *36*), jamais un nom de variable, une consigne ni un blanc. ' +
        'Un trou n’a qu’une bonne réponse : pas de « bonne/mauvaise » séparées par une barre oblique ; si la consigne fait ' +
        'choisir, écris dans chaque trou la seule réponse juste pour cette phrase.';
}

/**
 * Crée la file de fabrication d'un brouillon.
 *
 * @param {Object} draft - Le brouillon, `draft.plan` rempli.
 * @param {Object} [options]
 * @param {Function} [options.surChangement] - Appelée à chaque transition d'état.
 * @param {Function} [options.appelModele] - Substitut de l'appel au modèle (tests).
 * @returns {{demarrer:Function, arreter:Function, refaire:Function, etat:Function, enMarche:Function}}
 */
export function creerFile(draft, { surChangement = () => {}, appelModele = null } = {}) {
    const plan = draft.plan;
    /** @type {Map<string, {statut:string, erreurKey:string|null, detail:string|null, essais:number}>} */
    const etats = new Map();
    for (const { carte } of cartesAPlat(plan)) {
        etats.set(carte.id, {
            // Une carte déjà remplie (reprise de brouillon) n'est pas refaite.
            statut: carte.contenu ? ETATS.faite : (carte.verrouillee ? ETATS.reservee : sourceManquante(carte) ? ETATS.source : ETATS.attente),
            erreurKey: null, detail: null, essais: 0,
        });
    }

    let enMarche = false;
    let arretDemande = false;
    let sourceAbort = null;

    const notifier = () => surChangement(instantane());

    function instantane() {
        const lignes = cartesAPlat(plan).map(({ carte, etape }) => ({
            id: carte.id,
            titre: carte.titre,
            module: carte.module,
            etape: etape.titre,
            ...etats.get(carte.id),
        }));
        return {
            lignes,
            total: lignes.length,
            faites: lignes.filter(l => l.statut === ETATS.faite).length,
            echecs: lignes.filter(l => l.statut === ETATS.echouee).length,
            sourcesManquantes: lignes.filter(l => l.statut === ETATS.source).length,
            restantes: lignes.filter(l => [ETATS.attente, ETATS.annulee].includes(l.statut)).length,
            reservees: lignes.filter(l => l.statut === ETATS.reservee).length,
            enMarche,
        };
    }

    /** Remplit UNE carte. Ne lève pas : l'échec est porté par l'état. */
    async function fabriquer(carte, modeleImpose = null) {
        const etat = etats.get(carte.id);
        etat.statut = ETATS.encours;
        etat.erreurKey = null;
        etat.detail = null;
        etat.essais += 1;
        notifier();

        const debut = Date.now();
        try {
            sourceAbort = new AbortController();
            const source = await preparerSource(draft, carte, sourceAbort.signal, nbElementsCarte(carte));
            if (arretDemande) { etat.statut = carte.contenu ? ETATS.faite : ETATS.annulee; return; }
            const { prompt, nbElements } = await construirePromptRemplissage(draft, carte, source);
            if (arretDemande) { etat.statut = carte.contenu ? ETATS.faite : ETATS.annulee; return; }
            const modele = modeleImpose || modeleParcours() || ACTIVITY_MODEL_OVERRIDES[carte.module] || DEFAULT_MODEL;

            const reponse = appelModele
                ? await appelModele(prompt, carte)
                // Nom d'activité, version et identifiant du parcours : sans eux,
                // la ligne Grist du Worker arrivait avec `Activite` vide.
                : await generateH5PWithLLM(prompt, modele, metaActiviteParcours(draft, carte.module));

            const brut = await appliquerSource(await extraireJson(reponse), source, carte.module);
            let contenu = await reparer(brut, carte.module);
            // Un exercice SANS consigne est injouable : dans le quiz de Gauthier
            // (30 sept. 2026), le modèle l'avait omise sur trois questions sur dix,
            // et l'élève voyait un texte sans savoir quoi y faire. On la redemande
            // UNE fois, en nommant les questions ; au second oubli, la carte échoue
            // et se refait d'un clic.
            // Des trous vidés de leur sens (réponse en nom de variable, trou vide) :
            // même seconde demande, et l'on garde le moins grave des deux tirages —
            // comme la génération « en un clic » (`controle-sortie-ia.js`).
            const { consignesManquantes } = await import('../h5p/json-healer.js');
            const manques = consignesManquantes(contenu, carte.module);
            const defauts = defautsSortieIA(carte.module, JSON.stringify(contenu));
            if ((manques.length || defauts.length) && !arretDemande) {
                const rappel = (manques.length ? rappelConsignes(manques) : '') + (defauts.length ? rappelTrous(defauts) : '');
                debugLog('parcours', `carte « ${carte.titre} » : ${[manques.length ? `consigne absente (${manques.map(m => m.numero).join(', ')})` : '',
                    defauts.join(', ')].filter(Boolean).join(' ; ')}, seconde demande`);
                const reponse2 = appelModele
                    ? await appelModele(prompt + rappel, carte)
                    : await generateH5PWithLLM(prompt + rappel, modele, metaActiviteParcours(draft, carte.module));
                const second = await reparer(await appliquerSource(await extraireJson(reponse2), source, carte.module), carte.module);
                const encore = consignesManquantes(second, carte.module);
                if (manques.length) {
                    // Sans consigne, seul le second tirage peut servir, et complet.
                    if (encore.length) throw new Error(`parcours_consigne_manquante:${encore.map(m => m.numero).join(',')}`);
                    contenu = second;
                } else if (!encore.length && graviteSortieIA(carte.module, JSON.stringify(second)) < graviteSortieIA(carte.module, JSON.stringify(contenu))) {
                    contenu = second;
                }
            }
            if (arretDemande) { etat.statut = carte.contenu ? ETATS.faite : ETATS.annulee; return; }
            // Les réglages de son chemin, ou du test qui aiguille (D90, D93).
            // …et ceux que sa trame impose au Test (« Évaluer », D102).
            carte.contenu = reglagesDeTrame(draft.trame, carte, reglagesDeCarte(plan, carte, contenu));
            carte.sourceUtilisee = carte.source ? JSON.stringify(carte.source) : null;
            purgerMedias(carte);
            // Le titre du plan fait foi : c'est celui que l'enseignant a relu,
            // et c'est lui qui s'affichera dans la section du cours.
            if (carte.titre) carte.contenu.title = carte.titre;

            etat.statut = ETATS.faite;
            majBrouillon({ plan });
            debugLog('parcours', `carte « ${carte.titre} » (${carte.module}) faite en ` +
                `${Math.round((Date.now() - debut) / 1000)} s — ${nbElements} élément(s) demandés`);
        } catch (e) {
            if (arretDemande || isCancellation(e)) {
                etat.statut = carte.contenu ? ETATS.faite : ETATS.annulee;
                debugLog('parcours', `carte « ${carte.titre} » annulée`);
            } else {
                const info = classifyError ? classifyError(e) : null;
                // Une tentative ratée ne retire pas un contenu déjà relu.
                etat.statut = carte.contenu ? ETATS.faite : ETATS.echouee;
                etat.erreurKey = String(e.message || '').startsWith('parcours_source_') ? e.message
                    : String(e.message || '').startsWith('parcours_consigne_manquante') ? 'parcours_consigne_manquante'
                        : (info && info.userMessageKey) || 'parcours_fab_echec_carte';
                etat.detail = String((e && e.message) || e);
                console.error(`[parcours] carte « ${carte.titre} » (${carte.module}) échouée :`, e);
            }
        }
        notifier();
    }

    /**
     * Vide la file, EN SÉRIE. Chaque carte attend que la précédente soit
     * revenue : `await` dans une boucle, et surtout pas de `Promise.all`.
     */
    async function demarrer() {
        if (enMarche) return instantane();
        enMarche = true;
        arretDemande = false;
        notifier();

        const precedente = fabricationActive;
        let liberer;
        fabricationActive = new Promise(r => { liberer = r; });
        try {
            if (precedente) await precedente;
            if (!arretDemande) beginGeneration();

            for (const { carte } of cartesAPlat(plan)) {
                if (arretDemande) break;
                const etat = etats.get(carte.id);
                // On ne refait ni ce qui est fait, ni ce que l'enseignant a verrouillé.
                if (etat.statut === ETATS.faite) continue;
                if (carte.verrouillee) { etat.statut = carte.contenu ? ETATS.faite : ETATS.reservee; continue; }
                if (sourceManquante(carte)) { etat.statut = ETATS.source; notifier(); continue; }
                await fabriquer(carte);
            }

            // Ce qui n'a pas été atteint redevient « en attente » : la reprise
            // repartira de là, elle ne redemandera pas ce qui est déjà arrivé.
            if (arretDemande) {
                for (const [, etat] of etats) {
                    if (etat.statut === ETATS.encours) etat.statut = ETATS.annulee;
                }
            }

        } finally {
            liberer();
            enMarche = false;
            notifier();
        }
        return instantane();
    }

    /** Demande l'arrêt : la requête en vol est annulée, la file s'arrête après. */
    function arreter() {
        if (!enMarche) return;
        arretDemande = true;
        sourceAbort?.abort();
        requestCancelGeneration();
        debugLog('parcours', 'fabrication interrompue');
    }

    /** Refait UNE carte — celle qui a échoué, ou celle qu'on veut autrement. */
    async function refaire(carteId, modele = null) {
        if (enMarche) return instantane();
        const trouvee = cartesAPlat(plan).find(({ carte }) => carte.id === carteId);
        if (!trouvee || trouvee.carte.verrouillee) return instantane();
        if (sourceManquante(trouvee.carte)) {
            const e = etats.get(carteId);
            if (!trouvee.carte.contenu) e.statut = ETATS.source;
            e.erreurKey = 'parcours_source_manquante'; notifier(); return instantane();
        }
        enMarche = true;
        arretDemande = false;
        notifier();
        const precedente = fabricationActive;
        let liberer;
        fabricationActive = new Promise(r => { liberer = r; });
        try {
            if (precedente) await precedente;
            if (!arretDemande) { beginGeneration(); await fabriquer(trouvee.carte, modele); }
        } finally {
            liberer();
            enMarche = false;
            notifier();
        }
        return instantane();
    }

    function actualiser(id) {
        const carte = cartesAPlat(plan).find(x => x.carte.id === id)?.carte;
        const etat = etats.get(id);
        if (!carte || !etat || enMarche) return;
        etat.statut = carte.contenu ? ETATS.faite : (carte.verrouillee ? ETATS.reservee : sourceManquante(carte) ? ETATS.source : ETATS.attente);
        etat.erreurKey = null;
        majBrouillon({ plan });
        notifier();
    }

    return { demarrer, arreter, refaire, actualiser, etat: instantane, enMarche: () => enMarche };
}
