/**
 * @file Les images envoyées depuis l'ordinateur dans les blocs d'une Page ou d'un Livre.
 *
 * Retour de professeur (29 sept. 2026) : « l'édition de la Page ne permet pas de
 * rajouter une image ». Un bloc n'acceptait qu'une ADRESSE (`img_src`), à coller.
 * L'éditeur de Caramel (`editor/index.js`) greffe désormais, juste après chaque
 * `img_src`, un champ `img_file` : l'image envoyée, telle que la rend le widget
 * image de l'éditeur, `{path, mime, width, height, dataURL}`.
 *
 * Ce module fait le reste, UNE fois, pour tous les appelants de
 * `construireFichiersActivite()` (éditeur, parcours, aperçu du parcours) :
 *
 *  1. **Le backup** : l'image devient un vrai fichier Moodle, comme si
 *     l'enseignant l'avait déposée dans l'éditeur de texte de la plateforme —
 *     composant `mod_page`, zone `content`, item 0 pour une Page ; composant
 *     `mod_book`, zone `chapter`, item = identifiant du chapitre pour un Livre
 *     (c'est ce qu'annotent `backup_page_stepslib` et `backup_book_stepslib`).
 *     Le HTML ne la cite que par `@@PLUGINFILE@@/<nom>`, que la restauration
 *     réécrit en adresse de la plateforme. Aucune dataURL n'entre dans le `.mbz`.
 *  2. **L'aperçu** : `@@PLUGINFILE@@/<nom>` ne mène nulle part hors de Moodle ;
 *     l'aperçu reçoit donc le même HTML, la dataURL remise à la place.
 *
 * L'image envoyée REMPLACE l'adresse du même bloc : on garde `img_src` dans le
 * JSON (retirer l'image fait revenir l'adresse), on l'écrase sur la copie
 * rendue. Les octets sont relus depuis la dataURL et VÉRIFIÉS (signature du
 * format) : un scénario de parcours importé est un fichier tiers, il ne doit
 * pas pouvoir glisser autre chose qu'une image dans un backup.
 *
 * Les images sortent du JSON AVANT tout traitement de texte : la réparation
 * LaTeX (`healLatexForMoodle`) parcourt toutes les chaînes, elle n'a rien à
 * faire dans deux mégaoctets de base64.
 *
 * @module moodle/page-images
 */

/** Le champ de bloc qui porte l'image envoyée (greffé par `editor/index.js`). */
export const CHAMP_IMAGE_ENVOYEE = 'img_file';

/**
 * Identifiant du premier chapitre dans `book.xml` (100, 101, …). Le Livre
 * (`buildChaptersXml`) et l'item des images de chapitre DOIVENT le partager.
 */
export const PREMIER_ID_CHAPITRE = 100;

/** Préfixe que Moodle réécrit à la restauration en adresse de la zone de fichiers. */
const PLUGINFILE = '@@PLUGINFILE@@/';

/** Au-delà, ce n'est plus une illustration de page (le widget de l'éditeur borne à 12 Mo). */
const TAILLE_MAX = 12 * 1024 * 1024;

/** Formats admis : ce que l'éditeur de texte de Moodle affiche sans conversion. */
const FORMATS = {
    'image/jpeg': { ext: 'jpg', signature: o => o[0] === 0xFF && o[1] === 0xD8 && o[2] === 0xFF },
    'image/png': { ext: 'png', signature: o => o[0] === 0x89 && o[1] === 0x50 && o[2] === 0x4E && o[3] === 0x47 },
    'image/gif': { ext: 'gif', signature: o => o[0] === 0x47 && o[1] === 0x49 && o[2] === 0x46 && o[3] === 0x38 },
    'image/webp': {
        ext: 'webp',
        signature: o => o[0] === 0x52 && o[1] === 0x49 && o[2] === 0x46 && o[3] === 0x46
            && o[8] === 0x57 && o[9] === 0x45 && o[10] === 0x42 && o[11] === 0x50,
    },
};

const DATA_URL = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * La dataURL d'une image envoyée, si elle en est vraiment une.
 * @param {*} valeur - La valeur du champ `img_file`.
 * @param {Object} [options]
 * @param {boolean} [options.octets=true] - Décoder tout le fichier (sinon, l'en-tête seul).
 * @returns {{dataURL:string, mime:string, ext:string, octets:Uint8Array|null}|null}
 */
function lireImageEnvoyee(valeur, { octets: complet = true } = {}) {
    const dataURL = valeur && typeof valeur === 'object' ? valeur.dataURL : null;
    if (typeof dataURL !== 'string') return null;
    const m = DATA_URL.exec(dataURL);
    const format = m && FORMATS[m[1]];
    if (!format) return null;
    // 3/4 de la longueur base64 : la taille décodée, sans décoder.
    if (m[2].length * 0.75 > TAILLE_MAX) return null;
    let binaire;
    try { binaire = atob(complet ? m[2] : m[2].slice(0, 16)); } catch { return null; }
    const octets = Uint8Array.from(binaire, c => c.charCodeAt(0));
    if (octets.length < 12 || !format.signature(octets)) return null;
    return { dataURL, mime: m[1], ext: format.ext, octets: complet ? octets : null };
}

async function empreinteSha1(octets) {
    return [...new Uint8Array(await crypto.subtle.digest('SHA-1', octets))]
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Remplace, dans le contenu d'un bloc, chaque image envoyée par sa référence
 * `@@PLUGINFILE@@` et range ses octets dans `zone`. Mute `noeud` (une copie).
 */
async function substituer(noeud, zone, apercu) {
    if (Array.isArray(noeud)) {
        for (const n of noeud) await substituer(n, zone, apercu);
        return;
    }
    if (!noeud || typeof noeud !== 'object') return;
    if (CHAMP_IMAGE_ENVOYEE in noeud) {
        const image = lireImageEnvoyee(noeud[CHAMP_IMAGE_ENVOYEE]);
        delete noeud[CHAMP_IMAGE_ENVOYEE];
        if (image) {
            // Nom tiré du CONTENU : une même image citée deux fois n'est posée
            // qu'une fois, et deux exports du même JSON donnent le même backup.
            const filename = `image-${(await empreinteSha1(image.octets)).slice(0, 12)}.${image.ext}`;
            const reference = PLUGINFILE + filename;
            noeud.img_src = reference;
            if (!zone.fichiers.some(f => f.filename === filename)) {
                zone.fichiers.push({ filename, mimetype: image.mime, octets: image.octets, source: filename });
            }
            apercu.set(reference, image.dataURL);
        }
    }
    for (const valeur of Object.values(noeud)) await substituer(valeur, zone, apercu);
}

/**
 * Sépare d'un JSON de Page ou de Livre ses images envoyées.
 *
 * @param {Object} donnees - Le JSON de l'activité (non muté).
 * @param {'Page'|'Livre'} type
 * @returns {Promise<{donnees:Object, paquet:Object|null, apercu:Map<string,string>}>}
 *   `donnees` : une copie où chaque image envoyée est devenue `img_src:
 *   '@@PLUGINFILE@@/<nom>'` et où `img_file` n'existe plus ; `paquet` : les
 *   fichiers à joindre au backup, au format de `joindreFichiersInitiaux`
 *   (`null` s'il n'y en a aucun) ; `apercu` : référence → dataURL, pour
 *   `versApercu()`.
 */
export async function extraireImagesEnvoyees(donnees, type) {
    const apercu = new Map();
    if (!donnees || typeof donnees !== 'object' || !JSON.stringify(donnees).includes(`"${CHAMP_IMAGE_ENVOYEE}"`)) {
        return { donnees, paquet: null, apercu };
    }
    const copie = JSON.parse(JSON.stringify(donnees));
    const zones = [];
    if (type === 'Livre') {
        const chapitres = Array.isArray(copie.chapters) ? copie.chapters : [];
        for (let i = 0; i < chapitres.length; i++) {
            const zone = { filearea: 'chapter', itemid: PREMIER_ID_CHAPITRE + i, fichiers: [] };
            for (const bloc of (Array.isArray(chapitres[i]?.blocks) ? chapitres[i].blocks : [])) {
                await substituer(bloc?.data, zone, apercu);
            }
            zones.push(zone);
        }
    } else {
        const zone = { filearea: 'content', itemid: 0, fichiers: [] };
        for (const bloc of (Array.isArray(copie.blocks) ? copie.blocks : [])) {
            await substituer(bloc?.data, zone, apercu);
        }
        zones.push(zone);
    }
    const pleines = zones.filter(z => z.fichiers.length);
    return {
        donnees: copie,
        paquet: pleines.length ? { component: type === 'Livre' ? 'mod_book' : 'mod_page', zones: pleines } : null,
        apercu,
    };
}

/**
 * Le HTML d'aperçu : chaque `@@PLUGINFILE@@/<nom>` redevient la dataURL de
 * l'image. Les noms sont tirés du contenu (`image-<sha1>.<ext>`) : aucun ne
 * peut être le préfixe d'un autre, le remplacement est sans ambiguïté.
 *
 * @param {string|null} html
 * @param {Map<string,string>} apercu - Référence → dataURL (`extraireImagesEnvoyees`).
 * @returns {string|null}
 */
export function versApercu(html, apercu) {
    if (typeof html !== 'string' || !apercu || !apercu.size) return html;
    let sortie = html;
    for (const [reference, dataURL] of apercu) sortie = sortie.split(reference).join(dataURL);
    return sortie;
}

/**
 * Pour l'export en document (DOCX, ODT, PDF) : une copie où chaque image
 * envoyée prend la place de l'adresse de son bloc, en dataURL — le formateur
 * de documents (partagé avec La Sucrerie) ne lit que `img_src`, et sait déjà
 * embarquer une dataURL.
 *
 * @param {*} donnees
 * @returns {*} Les données d'origine si rien n'est à remplacer, sinon une copie.
 */
export function imagesEnvoyeesPourDocument(donnees) {
    if (!donnees || typeof donnees !== 'object' || !JSON.stringify(donnees).includes(`"${CHAMP_IMAGE_ENVOYEE}"`)) return donnees;
    const copie = JSON.parse(JSON.stringify(donnees));
    (function parcourir(noeud) {
        if (Array.isArray(noeud)) { noeud.forEach(parcourir); return; }
        if (!noeud || typeof noeud !== 'object') return;
        if (CHAMP_IMAGE_ENVOYEE in noeud) {
            const image = lireImageEnvoyee(noeud[CHAMP_IMAGE_ENVOYEE], { octets: false });
            delete noeud[CHAMP_IMAGE_ENVOYEE];
            if (image) noeud.img_src = image.dataURL;
        }
        Object.values(noeud).forEach(parcourir);
    })(copie);
    return copie;
}
