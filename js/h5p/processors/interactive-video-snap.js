/**
 * Snap des timestamps de Vidéo interactive sur les ancres temporelles RÉELLES.
 *
 * Problème réglé : certains modèles (Mistral, Qwen) CALCULENT un instant intermédiaire
 * (90 s, 135 s…) au lieu de RECOPIER un horodatage `[mm:ss]` réellement présent dans la
 * transcription. Résultat : la vidéo se met en pause au milieu d'une phrase. GPT-OSS, lui,
 * recopie les vrais horodatages. Plutôt que de dépendre de la discipline du modèle, on CALE
 * (snap) chaque `timestamp` sur l'ancre réelle la plus proche — geste DÉTERMINISTE qui
 * fonctionne pour les 3 modèles.
 *
 * Module **pur, sans aucune dépendance** : importé par le processeur (`InteractiveVideo.js`),
 * par l'UI (`ui.js`, au point d'injection) ET par le harnais de QA Node (`scripts/…`).
 * Ne rien y importer pour préserver cette portabilité navigateur ↔ Node.
 *
 * Les « ancres » = les secondes des `[mm:ss]` réellement présentés au modèle dans le bloc
 * SOURCES du prompt (cf. `getTranscriptAnchors` de `prompt-generator.js`, même découpage que
 * `formatTranscriptForPrompt`). Sur les vidéos longues, le prompt regroupe les segments : les
 * ancres sont alors ce sous-ensemble groupé, qui reste un ensemble d'instants réels.
 *
 * @module processors/interactive-video-snap
 */

/**
 * Normalise une liste de valeurs (starts de segments ou ancres) en secondes entières uniques,
 * triées croissant, strictement positives (on exclut 0 / le tout début : aucune question avant
 * que quoi que ce soit n'ait été dit).
 * @param {Array<number|string>} values
 * @returns {number[]}
 */
export function buildAnchors(values) {
    const set = new Set();
    for (const v of Array.isArray(values) ? values : []) {
        const n = Math.floor(Number(v));
        if (Number.isFinite(n) && n > 0) set.add(n);
    }
    return [...set].sort((a, b) => a - b);
}

/**
 * Ancre réelle la plus proche de `t`. En cas d'égalité de distance, on choisit la PLUS GRANDE
 * (on cale légèrement vers l'AVANT) : ainsi davantage de contenu a été montré, ce qui garantit
 * mieux que la réponse à la question a déjà été énoncée.
 * @param {number[]} anchors - Ancres triées croissant (cf. buildAnchors).
 * @param {number} t
 * @returns {number}
 */
function nearestAnchor(anchors, t) {
    // Recherche dichotomique du point d'insertion.
    let lo = 0, hi = anchors.length - 1;
    if (t <= anchors[0]) return anchors[0];
    if (t >= anchors[hi]) return anchors[hi];
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (anchors[mid] === t) return anchors[mid];
        if (anchors[mid] < t) lo = mid + 1; else hi = mid - 1;
    }
    // hi = dernière ancre < t ; lo = première ancre > t.
    const below = anchors[hi];
    const above = anchors[lo];
    return (t - below) <= (above - t) ? below : above; // égalité → above (vers l'avant)
}

/** Première ancre strictement supérieure à `after` non encore utilisée, sinon null. */
function nextFreeAnchor(anchors, after, used) {
    for (const a of anchors) {
        if (a > after && !used.has(a)) return a;
    }
    return null;
}

/**
 * Cale chaque interaction sur l'ancre réelle la plus proche, en garantissant des timestamps
 * STRICTEMENT croissants et DISTINCTS (deux questions ne peuvent tomber sur le même instant).
 *
 * @param {Array<Object>} interactions - Interactions du JSON intermédiaire (champ `timestamp`).
 * @param {Array<number|string>} anchorValues - Ancres réelles (starts de segments / `[mm:ss]`).
 * @param {{maxDuration?:number}} [opts] - maxDuration : écarte (sans les caler) les interactions dont
 *   le timestamp D'ORIGINE dépasse la durée — l'IA hallucine parfois loin au-delà (vu : 2238 s pour
 *   une vidéo de 1481 s). Mieux vaut les supprimer que de les agglutiner sur la dernière ancre.
 * @returns {{ interactions: Array<Object>, report: Object }}
 *   `report` : { total, snapped, unchanged, dropped, maxShift, noAnchors } pour le log / la QA.
 */
export function snapInteractions(interactions, anchorValues, opts = {}) {
    const anchors = buildAnchors(anchorValues);
    const maxDuration = Number(opts.maxDuration) > 0 ? Number(opts.maxDuration) : null;
    const report = { total: 0, snapped: 0, unchanged: 0, dropped: 0, maxShift: 0, noAnchors: anchors.length === 0 };

    if (!Array.isArray(interactions) || interactions.length === 0) {
        return { interactions: [], report };
    }
    // Pas d'ancres exploitables → on ne touche à rien (le reste du pipeline gère les bornes).
    if (anchors.length === 0) {
        return { interactions: interactions.slice(), report };
    }

    // Traiter dans l'ordre chronologique des timestamps D'ORIGINE : la question la plus précoce
    // réclame l'ancre la plus précoce → l'ordre relatif est préservé par construction.
    const indexed = interactions
        .map((it, i) => ({ it, i, ts: Number(it && it.timestamp) }))
        .filter(x => x.it && typeof x.it === 'object' && Number.isFinite(x.ts)
            && (maxDuration === null || x.ts <= maxDuration));
    report.dropped += interactions.length - indexed.length; // non numériques + hors-durée écartés
    indexed.sort((a, b) => a.ts - b.ts || a.i - b.i);

    const out = [];
    const used = new Set();
    let lastAssigned = -Infinity;

    for (const x of indexed) {
        report.total++;
        let target = nearestAnchor(anchors, x.ts);
        // Collision ou ordre non croissant → décaler vers la prochaine ancre libre.
        if (target <= lastAssigned || used.has(target)) {
            const next = nextFreeAnchor(anchors, lastAssigned, used);
            if (next == null) { report.dropped++; continue; } // plus d'ancre disponible → écarté
            target = next;
        }
        used.add(target);
        lastAssigned = target;

        const shift = Math.abs(target - x.ts);
        if (shift === 0) report.unchanged++;
        else { report.snapped++; if (shift > report.maxShift) report.maxShift = shift; }

        out.push(x.it.timestamp === target ? x.it : { ...x.it, timestamp: target });
    }

    return { interactions: out, report };
}

// NB : il n'y a VOLONTAIREMENT plus de plafonnement du nombre de questions ici. Le contenu généré
// (par l'IA Caramel en un clic OU collé depuis une IA externe) n'est JAMAIS tronqué par un quota :
// le prompt RECOMMANDE un nombre de questions, mais ce qui est produit est conservé tel quel. Si le
// modèle en génère beaucoup, on les garde toutes — l'enseignant supprime à la main ce qu'il ne veut
// pas. Seul le calage des timestamps sur les ancres réelles (snapInteractions) + l'écart des
// timestamps hors-durée restent : ce sont des contraintes de VALIDITÉ, pas de quantité.

export default { buildAnchors, snapInteractions };
