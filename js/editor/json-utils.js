/**
 * Utilitaires pour la manipulation d'objets JSON
 */

/**
 * Recupere une valeur imbriquee dans un objet a partir d'un chemin (ex: 'words.0.answer')
 * @param {Object} obj - L'objet source
 * @param {string} path - Le chemin vers la valeur
 * @returns {*} La valeur trouvee ou undefined
 */
export function getNestedValue(obj, path) {
    if (!path) return obj;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === undefined || current === null) return undefined;
        current = current[key];
    }
    return current;
}

/** Cles interdites dans un chemin (protection contre la pollution de prototype) */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Definit une valeur imbriquee dans un objet a partir d'un chemin
 * @param {Object} obj - L'objet source
 * @param {string} path - Le chemin vers la valeur
 * @param {*} value - La valeur a definir
 */
export function setNestedValue(obj, path, value) {
    if (!path) return;
    const keys = path.split('.');
    // Garde anti prototype pollution : on ignore tout chemin contenant une cle dangereuse
    if (keys.some(k => FORBIDDEN_KEYS.has(k))) return;
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
            // Creer l'objet ou le tableau manquant (ou remplacer une primitive)
            const nextKey = keys[i + 1];
            current[key] = /^\d+$/.test(nextKey) ? [] : {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}

/**
 * Évalue une condition `showWhen` de schéma d'éditeur.
 *
 * Deux portées, exclusives :
 *  - `field` (historique) — le champ FRÈRE, dans le même objet (item de tableau, section, groupe).
 *  - `rootField` — un champ de la RACINE du document, pour qu'un réglage global commande la
 *    visibilité d'un champ situé dans chaque item. Cas d'usage : « Mode d'affichage des questions »
 *    de la Vidéo interactive, où le choix par question ne doit apparaître qu'en mode « personnalisé »
 *    (offrir un menu que le mode global écrase serait un réglage sans effet).
 *    Il n'y a PAS de listener pour cette portée, et il n'en faut pas : l'éditeur est en maître-détail,
 *    le réglage racine et le détail d'une question ne sont jamais affichés en même temps — le détail
 *    est re-rendu à chaque navigation, donc toujours à jour.
 *
 * `defaultValue` sert de repli quand la valeur référencée est absente des données (contenu généré
 * avant l'ajout du réglage, ou pas encore saisi) : sans lui, un champ conditionné à un réglage
 * jamais écrit resterait invisible.
 *
 * @param {Object} showWhen - { field | rootField, value | values, defaultValue? }
 * @param {Object} data - L'objet portant les champs frères (item, section…).
 * @param {Object} [siblingSchema] - Schéma des frères, pour récupérer leur `default`.
 * @param {Object} [rootData] - Données racine du document (portée `rootField`).
 * @returns {boolean} true si le champ doit être visible.
 */
export function matchesShowWhen(showWhen, data, siblingSchema = null, rootData = null) {
    if (!showWhen) return true;
    const isRoot = !!showWhen.rootField;
    const key = isRoot ? showWhen.rootField : showWhen.field;

    let refValue = getNestedValue(isRoot ? rootData : data, key);
    if (refValue === undefined && !isRoot && siblingSchema && siblingSchema[key]?.default !== undefined) {
        refValue = siblingSchema[key].default;
    }
    if (refValue === undefined && showWhen.defaultValue !== undefined) {
        refValue = showWhen.defaultValue;
    }
    return showWhen.values ? showWhen.values.includes(refValue) : refValue === showWhen.value;
}

/**
 * Nouvel indice d'un item après une mutation de son tableau, ou `null` s'il a disparu.
 *
 * Les quatre mutations possibles sur une liste de l'éditeur, vues depuis un item d'indice
 * `indice` :
 *   · `remove`    — l'item d'indice `index` est retiré : les suivants reculent d'un cran ;
 *   · `insert`    — un item est inséré à l'indice `index` : ceux à partir de là avancent ;
 *   · `duplicate` — une copie est insérée en `index + 1` : mêmes effets qu'un `insert` là ;
 *   · `move`      — l'item `from` est retiré puis réinséré en `to` : la tranche entre les
 *                   deux glisse d'un cran, dans le sens opposé au déplacement.
 *
 * @param {{type: string, index?: number, from?: number, to?: number}} operation
 * @param {number} indice - indice AVANT la mutation
 * @returns {number|null} indice APRÈS la mutation, `null` si l'item visé n'existe plus
 */
function indiceApresMutation(operation, indice) {
    const { type } = operation || {};

    if (type === 'remove') {
        const k = operation.index;
        if (indice === k) return null;
        return indice > k ? indice - 1 : indice;
    }
    if (type === 'insert') {
        return indice >= operation.index ? indice + 1 : indice;
    }
    if (type === 'duplicate') {
        // La copie prend la place `index + 1` : l'original ne bouge pas.
        return indice > operation.index ? indice + 1 : indice;
    }
    if (type === 'move') {
        const { from, to } = operation;
        if (indice === from) return to;
        if (from < to) return (indice > from && indice <= to) ? indice - 1 : indice;
        if (from > to) return (indice >= to && indice < from) ? indice + 1 : indice;
        return indice;
    }
    return indice;
}

/**
 * Réécrit les renvois PAR INDICE vers un tableau qui vient d'être muté.
 *
 * Certains schémas désignent les items d'une liste par leur INDICE depuis une liste FRÈRE :
 * les étiquettes du Glisser-déposer visent leurs zones via `elements[].zoneIndices`
 * (`optionsFrom: 'dropZones'`, `optionsValueType: 'index'`). Supprimer, insérer, dupliquer ou
 * déplacer une zone renumérote toutes les suivantes — sans cette réécriture, les étiquettes
 * restent sur l'ANCIENNE numérotation : elles changent de zone en silence, et celles qui
 * visaient la zone retirée gardent un renvoi dans le vide (qui bloque l'enregistrement depuis
 * une autre section, sans que rien n'explique pourquoi).
 *
 * La liste des renvois est déclarée par le schéma, sur le tableau RÉFÉRENCÉ
 * (`indexReferencedBy`), miroir du `optionsFrom` déclaré côté référent.
 *
 * Le type d'origine de chaque valeur est conservé (les cases à cocher produisent des chaînes,
 * la normalisation produit des nombres) : la réécriture ne doit rien changer d'autre que
 * l'indice. Une valeur non entière est laissée telle quelle — ce n'est pas un indice, ce n'est
 * pas à cette fonction de la juger.
 *
 * @param {Object} parent - objet qui porte le tableau muté ET ses référents (des frères)
 * @param {Array<{array: string, field: string}>} references - contenu de `indexReferencedBy`
 * @param {{type: 'remove'|'insert'|'duplicate'|'move', index?: number, from?: number, to?: number}} operation
 * @returns {number} nombre d'items dont le renvoi a effectivement été réécrit
 */
export function remapIndexReferences(parent, references, operation) {
    if (!parent || typeof parent !== 'object' || !Array.isArray(references) || !operation) return 0;

    let reecrits = 0;
    for (const renvoi of references) {
        if (!renvoi || !renvoi.array || !renvoi.field) continue;
        const referents = parent[renvoi.array];
        if (!Array.isArray(referents)) continue;

        for (const item of referents) {
            if (!item || typeof item !== 'object') continue;
            const avant = item[renvoi.field];
            if (!Array.isArray(avant)) continue;

            const apres = [];
            for (const brut of avant) {
                const n = typeof brut === 'string' ? parseInt(brut, 10) : brut;
                if (!Number.isInteger(n)) { apres.push(brut); continue; }
                const cible = indiceApresMutation(operation, n);
                if (cible === null) continue;                       // visait l'item supprimé
                apres.push(typeof brut === 'string' ? String(cible) : cible);
            }

            if (apres.length !== avant.length || apres.some((v, i) => v !== avant[i])) {
                item[renvoi.field] = apres;
                reecrits++;
            }
        }
    }
    return reecrits;
}
