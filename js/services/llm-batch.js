/**
 * @file Génération d'activités par LOTS (« plan + remplissage »).
 *
 * Problème résolu : chaque appel LLM côté proxy n8n a un timeout dur de ~59 s. Au-delà
 * de ~5 questions, la génération mono-appel dépasse ce mur et échoue. Ce module découpe
 * la génération d'une activité « list-shaped » (contenu = un tableau additif de N items)
 * en plusieurs appels qui tiennent chacun sous 59 s, SANS répétition entre lots :
 *
 *   1. PLAN     : 1 appel court → la « carcasse » (titre, feedback global…) + un PLAN de
 *                 N intitulés/angles DISTINCTS couvrant tout le sujet (1 cerveau voit tout).
 *   2. REMPLISSAGE : ⌈N / BATCH_SIZE⌉ appels (séquentiels) → chaque lot rédige les items
 *                 de SES intitulés, le plan complet fourni en contexte (zéro recoupement).
 *   3. FUSION   : code déterministe → carcasse + concat des items dans `data[path]`.
 *
 * Le JSON fusionné est un objet UNIQUE, conforme au schéma attendu par le `json-healer`
 * puis le processor existant (aucun processor n'est modifié : ils itèrent déjà sur le tableau).
 *
 * Stats Grist : les sous-appels portent `stats:'skip'` (le Worker n'écrit pas de ligne) ;
 * une SEULE ligne agrégée est postée en fin → 1 génération = 1 inscription Grist.
 *
 * PARTIE PURE (sans DOM, `translations` passé en argument) : testable en Node.
 * ORCHESTRATEUR (`generateInBatches`) : imports dynamiques (browser uniquement).
 */

// ============================================================================
// RÉGLAGES (validés empiriquement contre le backend dev2 — cf. tests harnais)
// ============================================================================
export const BATCH_CONFIG = Object.freeze({
    // En dessous (inclus) : 1 seul appel (comportement actuel, ~45 s prouvés). Au-dessus : découpage.
    threshold: 5,
    // Items par lot. 4 → ~36 s/lot, marge confortable sous le mur des 59 s (fb=0 attendu).
    batchSize: 4,
    // Plafond « un clic ». Au-delà, l'UI oriente vers « copier le prompt → IA externe ».
    maxItems: 40,
    // 1 = séquentiel. Le test a montré qu'ILaaS tolère mal la concurrence (fallbacks en
    // cascade) sur backend partagé → séquentiel = le plus robuste. Passer à 2 = +~30 % vitesse.
    concurrency: 1,
    // Relances côté client d'un lot/plan en échec (EN PLUS des 3 fallbacks serveur).
    retries: 1,
});

// ============================================================================
// HELPERS PURS
// ============================================================================

const pick = (t, key, fallback) => (t && typeof t[key] === 'string' && t[key]) || fallback;

/**
 * Répartit `count` items en lots aussi équilibrés que possible, chacun ≤ maxSize.
 * Ex. balancedBatches(10, 4) → [4,3,3] ; balancedBatches(20,4) → [4,4,4,4,4].
 * @returns {number[]} tailles de chaque lot
 */
export function balancedBatches(count, maxSize) {
    const n = Math.max(0, Math.floor(count));
    if (n === 0) return [];
    const nb = Math.ceil(n / maxSize);
    const base = Math.floor(n / nb);
    let rest = n % nb;
    const sizes = [];
    for (let i = 0; i < nb; i++) sizes.push(base + (rest-- > 0 ? 1 : 0));
    return sizes;
}

/** Dernier segment d'un chemin pointé : 'timeline.date' → 'date', 'questions' → 'questions'. */
export function arrayKeyOf(path) {
    return String(path || '').split('.').pop();
}

/** Écrit `value` à un chemin pointé dans `obj` (crée les objets intermédiaires). */
export function setByPath(obj, path, value) {
    const parts = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
        cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    return obj;
}

/** Normalise un libellé pour la détection de doublons (minuscules, sans balises/ponctuation). */
export function normalizeStem(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/<[^>]+>/g, ' ')
        .replace(/\\\(|\\\)|\\\[|\\\]/g, ' ')
        .replace(/[^\p{L}\p{N} ]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Réplique PURE de buildActivityPrompt (prompt-generator.js) — `t` (translations) passé
 * en argument au lieu de l'import module, pour rester testable hors navigateur.
 * ⚠️ Garder synchronisé avec prompt-generator.buildActivityPrompt.
 * @param {string} prefix - ex. 'prompt_quizset_qcm'
 * @param {Object} params - { qui, quoi, niveau, nombreQuestions, ocrContent, isAdvanced }
 * @param {Object} t - objet translations
 * @returns {string}
 */
export function assembleActivityPrompt(prefix, params, t) {
    const { qui, quoi, niveau, nombreQuestions, ocrContent, isAdvanced } = params;

    let contexte = t.prompt_contexte_pedagogique_commun || '';
    contexte = contexte
        .replace(/\[QUI\]/g, qui || t.prompt_fallback_teacher || 'un enseignant')
        .replace(/\[QUOI\]/g, quoi || t.prompt_fallback_activity || 'créer une activité pédagogique');
    if (isAdvanced && niveau) contexte = contexte.replace(/\[NIVEAU\]/g, niveau);
    else contexte = contexte.replace(/\n[^\n]*\[NIVEAU\][^\n]*/g, '');

    let regles = t[`${prefix}_regles_specifiques`] || '';
    if (nombreQuestions && nombreQuestions.toString().trim()) {
        regles = regles.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g,
            (m, label, rapid, adv) => label + adv.trim().replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions));
        regles = regles.replace(/\[NOMBRE_ELEMENTS\]/g, nombreQuestions);
    } else {
        regles = regles.replace(/([^:\n]+:\s*)([^|\n]+)\|\|([^|\n]+)/g, (m, label, rapid) => label + rapid);
    }

    const pedago = t.prompt_regles_pedagogiques_communes || '';
    let sources = '';
    if (ocrContent && ocrContent.trim()) {
        const tpl = t[`${prefix}_sources`] || t.prompt_sources_communes || '';
        sources = tpl.replace('[RAG]', ocrContent.trim());
    }
    const structure = t[`${prefix}_structure_json`] || '';
    const exemple = t[`${prefix}_exemple_rendu`] || '';

    let prompt = `# ${t.prompt_header_pedagogical_context || 'CONTEXTE PÉDAGOGIQUE'}
${contexte}

# ${t.prompt_header_specific_rules || 'RÈGLES SPÉCIFIQUES'}
${regles}

# ${t.prompt_header_pedagogical_rules || 'RÈGLES PÉDAGOGIQUES'}
${pedago}
`;
    if (sources) prompt += `\n# ${t.prompt_header_sources || 'SOURCES'}\n${sources}\n`;
    prompt += `\n# ${t.prompt_header_json_structure || 'STRUCTURE DU JSON ATTENDUE'}
${structure}

# ${t.prompt_header_rendering_example || 'EXEMPLE DE RENDU'}
${exemple}`;
    return prompt;
}

/**
 * Extrait la CARCASSE de l'exemple de rendu de base (`${prefix}_exemple_rendu`) : l'objet
 * racine de l'exemple PRIVÉ de son tableau d'items (`path`). Pour les quiz, il reste donc
 * { title, overallFeedback } — c.-à-d. le **vrai feedback global métacognitif** rédigé dans
 * le prompt de base, qu'on réutilise comme modèle dans le plan. Renvoie null si l'exemple
 * n'est pas parsable (l'appelant dégrade alors proprement, sans modèle).
 * @returns {Object|null}
 */
export function extractCarcasseModel(prefix, t, path) {
    try {
        let s = t[`${prefix}_exemple_rendu`] || '';
        if (!s) return null;
        const m = s.match(/```json\s*([\s\S]*?)\s*```/);
        if (m) s = m[1];
        const i = s.indexOf('{');
        if (i > 0) s = s.slice(i);
        const obj = JSON.parse(s);
        if (!obj || typeof obj !== 'object') return null;
        const parts = String(path).split('.');
        // L'exemple doit être l'OBJET RACINE : il contient le tableau d'items au chemin `path`.
        // Sinon (ex. elea_test, dont le 1er bloc ```json est une question ISOLÉE et non l'objet
        // racine), on renvoie null → pas de carcasse trompeuse injectée dans le plan.
        let probe = obj;
        for (let k = 0; k < parts.length; k++) probe = probe && probe[parts[k]];
        if (!Array.isArray(probe)) return null;
        const carcasse = { ...obj };
        let cur = carcasse;
        for (let k = 0; k < parts.length - 1; k++) cur = cur && cur[parts[k]];
        if (cur && typeof cur === 'object') delete cur[parts[parts.length - 1]];
        return Object.keys(carcasse).length ? carcasse : null;
    } catch {
        return null;
    }
}

/** Bloc CONTEXTE PÉDAGOGIQUE seul (substitué), pour le prompt de plan. */
function contextBlock(params, t) {
    let c = t.prompt_contexte_pedagogique_commun || '';
    c = c
        .replace(/\[QUI\]/g, params.qui || t.prompt_fallback_teacher || 'un enseignant')
        .replace(/\[QUOI\]/g, params.quoi || t.prompt_fallback_activity || 'créer une activité pédagogique');
    if (params.isAdvanced && params.niveau) c = c.replace(/\[NIVEAU\]/g, params.niveau);
    else c = c.replace(/\n[^\n]*\[NIVEAU\][^\n]*/g, '');
    return c;
}

/**
 * Prompt de PLAN : carcasse (champs racine SAUF le tableau `path`) + `plan` de N intitulés
 * distincts. S'appuie sur la STRUCTURE de l'activité (multilingue, déjà traduite) pour que
 * le modèle émette les bons champs racine.
 * @returns {string}
 */
export function buildOutlinePrompt({ prefix, params, t, count, path, itemName, carcasse }) {
    const arrKey = arrayKeyOf(path);
    const structure = t[`${prefix}_structure_json`] || '';
    // Les règles pédagogiques (doctrine de feedback) sont incluses pour que le feedback
    // GLOBAL de score (overallFeedback racine) soit aussi riche qu'en génération mono-appel.
    const pedago = t.prompt_regles_pedagogiques_communes || '';
    const item = itemName || pick(t, 'batch_item_generic', 'élément');

    // Modèle de carcasse extrait de l'EXEMPLE DE BASE (title + overallFeedback métacognitif) :
    // on réutilise tel quel le feedback global conçu dans le prompt QCM de référence.
    const carcasseModel = extractCarcasseModel(prefix, t, path);
    // L'activité possède-t-elle un feedback global de score racine (« overallFeedback ») ?
    // → quiz/texte-à-trous : oui ; cartes mémo / Éléa-Test (feedback par item) : non.
    // On exige (et on insiste sur) l'overallFeedback UNIQUEMENT quand il fait partie du format.
    const hasFeedback = Array.isArray(carcasse)
        ? carcasse.includes('overallFeedback')
        : !!(carcasseModel && Object.prototype.hasOwnProperty.call(carcasseModel, 'overallFeedback'));

    const intro = pick(t, 'batch_outline_intro',
        'Tu es un concepteur pédagogique expert. Avant de rédiger l\'activité, tu en prépares le PLAN.');
    const struct = pick(t, 'batch_outline_structure_label',
        'STRUCTURE de l\'objet final (pour information) :');
    // Clause feedback : insérée UNIQUEMENT pour les activités à overallFeedback racine.
    const feedbackClause = hasFeedback
        ? pick(t, 'batch_outline_feedback_clause',
            ' — en particulier le titre ET le feedback global de score (« overallFeedback » : TOUTES ses tranches), rédigé selon les RÈGLES PÉDAGOGIQUES (chaque tranche aide à progresser, jamais un simple « Bien »/« Faux »)')
        : '';
    const taskTpl = pick(t, 'batch_outline_task',
        'Génère UNIQUEMENT un JSON valide (il commence par { et finit par }), contenant :\n- TOUS les champs racine décrits dans la STRUCTURE ci-dessus À L\'EXCEPTION du tableau « {arrayKey} »{feedbackClause} ;\n- un champ « plan » : un tableau d\'EXACTEMENT {count} objets de la forme {"n":entier 1..{count},"intitule":"intitulé court d\'un(e) {item}","angle":"aspect précis et DISTINCT traité"}.\nNe rédige PAS le contenu détaillé des {item} (ni énoncés complets, ni réponses) — uniquement la carcasse + le plan.');
    const constraint = pick(t, 'batch_outline_constraint',
        'CONTRAINTE ESSENTIELLE : les {count} intitulés/angles doivent couvrir tout le sujet de façon VARIÉE et NON REDONDANTE (notions, difficultés, cas particuliers, registres différents). Ne rédige PAS le contenu détaillé des {item} ici — uniquement le plan. Sois concis.');

    const fill = (s) => s
        .replace(/\{count\}/g, count)
        .replace(/\{arrayKey\}/g, arrKey)
        .replace(/\{item\}/g, item)
        .replace(/\{feedbackClause\}/g, feedbackClause);

    let out = `# ${t.prompt_header_pedagogical_context || 'CONTEXTE PÉDAGOGIQUE'}
${contextBlock(params, t)}
`;
    if (pedago) {
        out += `\n# ${t.prompt_header_pedagogical_rules || 'RÈGLES PÉDAGOGIQUES'}\n${pedago}\n`;
    }
    out += `\n# ${pick(t, 'batch_outline_header', 'PLAN DE L\'ACTIVITÉ')}
${intro}

${struct}
${structure}
`;
    if (carcasseModel) {
        const carcasseLabel = hasFeedback
            ? pick(t, 'batch_outline_carcasse_model', 'MODÈLE DE CARCASSE — réutilise EXACTEMENT ce niveau de qualité pour le feedback global métacognitif (« overallFeedback »), en adaptant les messages au sujet :')
            : pick(t, 'batch_outline_carcasse_model_simple', 'MODÈLE DE CARCASSE — reproduis ce niveau de qualité pour les champs racine (titre, consigne…), en les adaptant au sujet :');
        out += `\n${carcasseLabel}\n${JSON.stringify(carcasseModel, null, 2)}\n`;
    }
    out += `
${fill(taskTpl)}

${fill(constraint)}`;
    return out;
}

/**
 * Prompt de REMPLISSAGE d'un lot : prompt d'activité complet (règles + structure + exemple,
 * multilingue) restreint aux intitulés du lot, plan complet en contexte anti-recoupement.
 * @returns {string}
 */
export function buildFillPrompt({ prefix, params, t, plan, slice, path, itemName }) {
    const arrKey = arrayKeyOf(path);
    const item = itemName || pick(t, 'batch_item_generic', 'élément');
    const base = assembleActivityPrompt(prefix, { ...params, nombreQuestions: String(slice.length) }, t);

    const planList = plan.map(p => `${p.n}. ${p.intitule}${p.angle ? ' — ' + p.angle : ''}`).join('\n');
    const mineList = slice.map(p => `${p.n}. ${p.intitule}${p.angle ? ' — ' + p.angle : ''}`).join('\n');

    const planHeader = pick(t, 'batch_fill_plan_header',
        'PLAN GÉNÉRAL (contexte — NE TRAITE QUE TES {item})');
    const taskHeader = pick(t, 'batch_fill_task_header', 'À PRODUIRE MAINTENANT');
    const taskTpl = pick(t, 'batch_fill_task',
        'Produis EXACTEMENT {n} {item} au format décrit ci-dessus, UNIQUEMENT pour les intitulés suivants (dans l\'ordre) :\n{mine}\n\nIMPORTANT pour CETTE requête : réponds par un JSON { "{arrayKey}": [ ... ] } contenant EXACTEMENT {n} éléments, SANS champ « title » ni autre champ racine, et SANS reprendre les autres {item} du plan.');

    const fill = (s) => s
        .replace(/\{n\}/g, slice.length)
        .replace(/\{arrayKey\}/g, arrKey)
        .replace(/\{item\}/g, item)
        .replace(/\{mine\}/g, mineList);

    return `${base}

# ${fill(planHeader)}
${planList}

# ${taskHeader}
${fill(taskTpl)}`;
}

/** Lit une valeur à un chemin pointé dans `obj` (renvoie undefined si absent). */
function getByPath(obj, path) {
    return String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

/**
 * Renumérote le NUMÉRO DE TÊTE d'un champ texte de chaque item, séquentiellement et
 * globalement (1..N), en préservant le préfixe et le reste. Indispensable pour les activités
 * dont chaque item porte un identifiant numéroté (ex. Éléa-Test : `content.name` = "Q01 - …") :
 * chaque lot étant généré INDÉPENDAMMENT, il recommence à 1 → sans cette passe on obtient
 * plusieurs « Q01 ». On ne touche QUE le 1er groupe de chiffres (« 1917 » dans un libellé est
 * préservé), et on zéro-pad sur la largeur de N (tri correct côté Éléa, cf. correctif zéro-pad).
 * @param {Array} items
 * @param {string} fieldPath - chemin pointé du champ à renuméroter dans un item (ex. "content.name")
 */
export function renumberItems(items, fieldPath) {
    if (!fieldPath || !Array.isArray(items)) return;
    const padW = Math.max(2, String(items.length).length);
    const parts = String(fieldPath).split('.');
    const leaf = parts[parts.length - 1];
    items.forEach((it, i) => {
        let parent = it;
        for (let k = 0; k < parts.length - 1; k++) parent = parent && parent[parts[k]];
        if (parent && typeof parent[leaf] === 'string') {
            parent[leaf] = parent[leaf].replace(/^(\D*)(\d+)/,
                (m, pre) => pre + String(i + 1).padStart(padW, '0'));
        }
    });
}

/**
 * Fusion déterministe : carcasse (outline sans `plan`) + items concaténés dans `data[path]`.
 * @param {string} [o.renumber] - chemin de champ à renuméroter globalement (cf. renumberItems).
 * @returns {{merged:Object, dupes:number}}
 */
export function mergeChunks({ outline, items, path, renumber }) {
    if (renumber) renumberItems(items, renumber);
    const merged = { ...outline };
    delete merged.plan;
    setByPath(merged, path, items);

    // Détection (non bloquante) de doublons d'intitulés/énoncés pour diagnostic.
    const stems = items.map(it => normalizeStem(
        (it && (it.question || (it.params && it.params.question) || it.text || it.intitule)) || ''
    )).filter(Boolean);
    const dupes = stems.length - new Set(stems).size;

    return { merged, dupes };
}

/** Seuil de bascule mono→lots pour une activité (surcharge `chunking.threshold` sinon global). */
export function thresholdFor(module) {
    const ov = module && module.chunking && module.chunking.threshold;
    return Number.isFinite(ov) ? ov : BATCH_CONFIG.threshold;
}

/** Taille de lot pour une activité (surcharge `chunking.batchSize` sinon global). */
export function batchSizeFor(module) {
    const ov = module && module.chunking && module.chunking.batchSize;
    return Number.isFinite(ov) && ov > 0 ? ov : BATCH_CONFIG.batchSize;
}

/** Décide si une génération doit être découpée (seuil propre à l'activité). */
export function shouldChunk(module, requestedCount) {
    return !!(module && module.chunking
        && Number.isFinite(requestedCount)
        && requestedCount > thresholdFor(module));
}

// ============================================================================
// ORCHESTRATEUR (browser — imports dynamiques)
// ============================================================================

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, retries, label, debug) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn(attempt);
        } catch (e) {
            // Une annulation demandée par l'enseignant n'est pas un échec à
            // retenter : sans cette sortie, le bouton « Arrêter » relancerait
            // aussitôt le lot qu'il vient d'interrompre.
            if (e && e.code === 'GENERATION_CANCELLED') throw e;
            lastErr = e;
            if (debug) debug('llm-batch', `Échec ${label} (tentative ${attempt + 1}/${retries + 1}) : ${e.message}`);
            if (attempt < retries) await sleep(800);
        }
    }
    throw lastErr;
}

/**
 * Parse une réponse LLM (plan ou lot). Quand `heal` est fourni (healJsonString du
 * json-healer), il est appliqué AVANT le parse — même pipeline que le mono-appel
 * (h5p-creator). Le healing systématique (et pas seulement en rattrapage d'un parse
 * raté) est indispensable : "\times" ou "\frac" à backslash simple contiennent des
 * échappements JSON VALIDES (\t, \f) et seraient silencieusement corrompus
 * (tabulation + « imes ») par un parse direct. Repli sur le parse brut si la chaîne
 * réparée ne parse pas. Pure (healer injecté) → exportée pour tests/test-llm-batch.js.
 */
export function parseJsonStrict(content, what, heal, debug) {
    let obj;
    if (typeof heal === 'function') {
        const healed = heal(content);
        if (debug && healed !== content) debug('llm-batch', `${what} : chaîne réparée par healJsonString avant parse`);
        try { obj = JSON.parse(healed); }
        catch (e) {
            try { obj = JSON.parse(content); }
            catch { throw new Error(`${what} : JSON invalide (${e.message})`); }
        }
    } else {
        try { obj = JSON.parse(content); }
        catch (e) { throw new Error(`${what} : JSON invalide (${e.message})`); }
    }
    if (!obj || typeof obj !== 'object') throw new Error(`${what} : objet JSON attendu`);
    return obj;
}

/**
 * Génère une activité « list-shaped » par lots (plan + remplissage + fusion).
 * Renvoie LE JSON final (string) prêt pour le pipeline createBtn → json-healer → processor.
 *
 * @param {Object} o
 * @param {string} o.moduleKey
 * @param {string} o.model
 * @param {Object} o.activityMeta
 * @param {number} o.requestedCount - N demandé (déjà borné à BATCH_CONFIG.maxItems par l'appelant)
 * @param {function} [o.onProgress] - ({phase:'plan'|'fill', current, total}) => void
 * @returns {Promise<string>} JSON fusionné
 */
export async function generateInBatches({ moduleKey, model, activityMeta, requestedCount, onProgress }) {
    const [{ translations }, promptGen, llm, defs, { ENDPOINTS }, utils, { healJsonString }, ragOrchestrator] = await Promise.all([
        import('../core/translation.js'),
        import('./prompt-generator.js'),
        import('./llm.js'),
        import('../core/definitions.js'),
        import('../core/endpoints.js'),
        import('../core/utils.js'),
        import('../h5p/json-healer.js'),
        import('./rag-orchestrator.js'),
    ]);
    const debug = utils.debugLog;
    const t = translations;
    const module = defs.h5pModules[moduleKey] || defs.moodleModules[moduleKey];
    const chunking = module && module.chunking;
    const prefix = promptGen.prefixForModule(moduleKey);
    if (!chunking || !prefix) throw new Error('Activité non découpable : ' + moduleKey);

    const path = chunking.path;
    const arrKey = arrayKeyOf(path);
    const itemName = chunking.itemName;
    // Champs racine que le plan DOIT produire (ex. quiz : title + overallFeedback global).
    // Le plan est relancé s'ils manquent → on ne livre jamais un quiz sans feedback de fin.
    const carcasseFields = Array.isArray(chunking.carcasse) ? chunking.carcasse : [];
    const batchSize = batchSizeFor(module);
    const params = promptGen.readContextParams();
    const ocrContent = document.getElementById('ocr-output')?.innerText?.trim() || '';
    params.ocrContent = ocrContent;

    // Contexte RAG (programmes officiels) : injecté UNIQUEMENT sur le plan (ancrage programme).
    // La pertinence et le cycle (multilingue) sont décidés par l'orchestrateur ; la
    // raison de la décision reste locale (log ?debug), jamais transmise au serveur.
    const ragCtx = ragOrchestrator.decideRagContextFromDom(debug).context;

    const startedAt = new Date();
    let sumPrompt = 0, sumCompletion = 0;
    const N = requestedCount;

    // ── PHASE 1 : PLAN ──
    const estLots = balancedBatches(N, batchSize).length;
    if (onProgress) onProgress({ phase: 'plan', current: 0, total: estLots, itemsDone: 0, itemsTotal: N });
    const outline = await withRetry(async () => {
        const planPrompt = buildOutlinePrompt({ prefix, params, t, count: N, path, itemName, carcasse: carcasseFields });
        const res = await llm.generateRawWithLLM(planPrompt, model, { activityMeta, rag: ragCtx, stats: 'skip' });
        sumPrompt += res.promptTokens; sumCompletion += res.completionTokens;
        const obj = parseJsonStrict(res.content, 'Plan', healJsonString, debug);
        if (!Array.isArray(obj.plan) || obj.plan.length < N) {
            throw new Error(`Plan incomplet (${obj.plan ? obj.plan.length : 0}/${N})`);
        }
        for (const f of carcasseFields) {
            const v = obj[f];
            const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
            if (empty) throw new Error(`Carcasse incomplète : champ « ${f} » manquant ou vide`);
        }
        obj.plan = obj.plan.slice(0, N).map((p, i) => ({
            n: p.n || (i + 1),
            intitule: String(p.intitule || p.title || '').trim(),
            angle: String(p.angle || '').trim(),
        }));
        return obj;
    }, BATCH_CONFIG.retries, 'plan', debug);
    debug('llm-batch', `Plan OK : ${outline.plan.length} intitulés pour ${moduleKey}`);

    // ── PHASE 2 : REMPLISSAGE ──
    const sizes = balancedBatches(N, batchSize);
    const slices = [];
    let cursor = 0;
    for (const sz of sizes) { slices.push(outline.plan.slice(cursor, cursor + sz)); cursor += sz; }
    const totalLots = slices.length;
    let doneLots = 0;

    const runLot = (slice) => withRetry(async () => {
        const fillPrompt = buildFillPrompt({ prefix, params, t, plan: outline.plan, slice, path, itemName });
        const res = await llm.generateRawWithLLM(fillPrompt, model, { activityMeta, stats: 'skip' });
        sumPrompt += res.promptTokens; sumCompletion += res.completionTokens;
        const obj = parseJsonStrict(res.content, 'Lot', healJsonString, debug);
        let arr = Array.isArray(obj[arrKey]) ? obj[arrKey]
            : (Array.isArray(obj.items) ? obj.items
                : (Array.isArray(obj[path]) ? obj[path] : null));
        if (!arr || arr.length === 0) throw new Error(`Lot vide (clé attendue « ${arrKey} »)`);
        if (arr.length > slice.length) arr = arr.slice(0, slice.length);
        if (arr.length < slice.length) throw new Error(`Lot incomplet (${arr.length}/${slice.length})`);
        return arr;
    }, BATCH_CONFIG.retries, 'remplissage', debug);

    const allItems = [];
    // Pool borné (concurrency=1 → séquentiel). On préserve l'ordre des lots dans le résultat.
    const limit = Math.max(1, BATCH_CONFIG.concurrency);
    const results = new Array(slices.length);
    let idx = 0;
    let itemsDone = 0;
    async function worker() {
        while (idx < slices.length) {
            const myIdx = idx++;
            const arr = await runLot(slices[myIdx]); // throw → propage → échec global (tout ou rien)
            results[myIdx] = arr;
            doneLots++;
            itemsDone += arr.length;
            if (onProgress) onProgress({ phase: 'fill', current: doneLots, total: totalLots, itemsDone, itemsTotal: N });
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, slices.length) }, worker));
    for (const arr of results) allItems.push(...arr);

    if (allItems.length < N) throw new Error(`Génération incomplète (${allItems.length}/${N} ${itemName})`);

    // ── PHASE 3 : FUSION ──
    const { merged, dupes } = mergeChunks({ outline, items: allItems, path, renumber: chunking.renumber });
    if (dupes > 0) debug('llm-batch', `⚠ ${dupes} doublon(s) d'intitulé détecté(s) après fusion (non bloquant)`);
    const finalJson = JSON.stringify(merged, null, 2);

    // ── STATS : 1 seule ligne Grist agrégée (best-effort, jamais bloquant) ──
    if (ENDPOINTS.llmStats) {
        const statsBody = {
            activity_name_key: (activityMeta && activityMeta.nameKey) || '',
            model,
            prompt_tokens: sumPrompt,
            completion_tokens: sumCompletion,
            caramel_version: (activityMeta && activityMeta.caramelVersion) || '',
            started_at: startedAt.toISOString(),
            completed_at: new Date().toISOString(),
            batches: totalLots + 1,
            requested_count: N,
        };
        fetch(ENDPOINTS.llmStats, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(statsBody),
        }).catch(err => debug('llm-batch', `Stats agrégées non envoyées (non bloquant) : ${err.message}`));
    }

    debug('llm-batch', `Fusion OK : ${allItems.length} ${itemName}, ${totalLots} lots, ` +
        `${sumPrompt}+${sumCompletion} tokens`);
    return finalJson;
}
