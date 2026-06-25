/**
 * canonicalize.mjs — Réduit une archive packagée (.h5p / .mbz) à une empreinte stable.
 *
 * Décompresse l'archive, scrube les tokens connus comme variables (IDs numériques
 * Moodle, slugs parcours/page/livre, timestamps unix), trie les entrées par nom, et
 * calcule un sha256 par fichier + un sha256 global. Deux exports « identiques au sens
 * de la fidélité » doivent produire le même `totalSha256`.
 *
 * - .h5p : ZIP → décompressé via JSZip (window.JSZip peuplé par bootstrap).
 * - .mbz : gzip+tar → on réutilise `js/moodle/mbz-utils.js > extractMbz` (window.fflate).
 *
 * Pour l'idempotence/déterminisme H5P, le RNG et la Date sont déjà neutralisés par
 * bootstrap, donc le scrub H5P est en principe inutile — on le garde par sécurité
 * (et pour absorber un éventuel UUID non seedé). Le scrub Moodle, lui, est essentiel.
 *
 * @module canonicalize
 */

import { createHash } from 'node:crypto';
import { ensureJSZip, ensureFflate, ensureTar } from './bootstrap.mjs';

const td = new TextDecoder('utf-8');

function sha256(bytes) {
    const h = createHash('sha256');
    h.update(bytes);
    return h.digest('hex');
}

function toUint8(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (typeof input?.arrayBuffer === 'function') return null; // Blob → géré en amont (async)
    throw new TypeError('canonicalize: input doit être Uint8Array/ArrayBuffer/Blob');
}

/**
 * Détermine si un fichier est « texte » (à scruber) d'après son nom.
 * On ne scrube QUE le texte ; les binaires (images) sont hashés tels quels.
 */
function isTextEntry(name) {
    return /\.(json|xml|html?|txt|md|csv)$/i.test(name) || name.endsWith('content.json') || name === 'moodle_backup.xml' || name === '.ARCHIVE_INDEX' || name === 'files.xml';
}

/**
 * Scrub des tokens volatils dans une chaîne texte.
 * @param {string} text
 * @param {'h5p'|'mbz'} kind
 * @returns {string}
 */
function scrubText(text, kind) {
    let s = text;

    if (kind === 'mbz') {
        // --- Identifiants numériques Moodle (toujours regénérés à chaque export) ---
        // On remplace la VALEUR à l'intérieur des balises ID connues par un placeholder
        // stable, sans toucher au reste de la structure.
        const ID_TAGS = [
            'id', 'moduleid', 'contextid', 'sectionid', 'sectionnumber', 'instanceid',
            'parent', 'questionid', 'oldid', 'categoryid', 'questioncategoryid',
            'sortorder', 'pagenum', 'questionbankentryid', 'questionversionid',
            'gradeitemid', 'courseid', 'activityid', 'sectionref', 'number'
        ];
        for (const tag of ID_TAGS) {
            // <tag>123</tag>  et  <tag id="123">  et  id="123"
            s = s.replace(new RegExp(`(<${tag}>)\\d+(</${tag}>)`, 'gi'), `$1<ID>$2`);
        }
        // Attributs id="123" / moduleid="123" / contextid="123" sur n'importe quelle balise
        s = s.replace(/\b(id|moduleid|contextid|sectionid|questionid|categoryid|gradeitemid|courseid|instanceid)="\d+"/gi, '$1="<ID>"');

        // --- Timestamps unix (10 chiffres, ~2001-2033) dans des balises de temps ---
        s = s.replace(/(<(?:timemodified|timecreated|timeopen|timeclose|added|modified|created|backup_date|original_course_startdate|original_course_enddate|timestamp)>)\d{9,10}(<\/)/gi, '$1<TS>$2');
        // Tout entier de 9-10 chiffres ressemblant à un timestamp unix, en valeur de balise
        s = s.replace(/>(1[0-9]{9})</g, '><TS><');

        // --- Slugs aléatoires : parcours-…, page-…, livre-…, backup uuid ---
        s = s.replace(/\b(parcours|page|livre|chapitre|section|activite)-[a-z0-9]{4,}/gi, '$1-<SLUG>');
        // --- UUID / hex aléatoires (backupid, etc.) ---
        s = s.replace(/\b[0-9a-f]{30,40}\b/gi, '<HEX>');
        s = s.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<UUID>');
        // --- backup filename / wwwroot version-spécifiques ---
        s = s.replace(/(<name>)backup-[^<]+(<\/name>)/gi, '$1backup-<SCRUBBED>$2');
        s = s.replace(/(<original_wwwroot>)[^<]*(<\/original_wwwroot>)/gi, '$1<WWWROOT>$2');
        s = s.replace(/(<original_site_identifier_hash>)[^<]*(<\/)/gi, '$1<HASH>$2');
    }

    if (kind === 'h5p') {
        // H5P : RNG/Date neutralisés en amont → peu de volatilité attendue.
        // Filet de sécurité : subContentId UUID (H5P en génère parfois).
        s = s.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<UUID>');
    }

    return s;
}

/**
 * Décompresse + canonicalise une archive.
 * @param {Uint8Array|ArrayBuffer|Blob} archive
 * @param {'h5p'|'mbz'} kind
 * @returns {Promise<{ kind: string, files: Array<{name, rawSize, canonSize, canonSha256}>, totalSha256: string }>}
 */
export async function canonicalize(archive, kind) {
    let bytes = toUint8(archive);
    if (bytes === null) {
        // Blob
        bytes = new Uint8Array(await archive.arrayBuffer());
    }

    let entries; // [{ name, data: Uint8Array }]
    if (kind === 'h5p') {
        entries = await unzipH5p(bytes);
    } else if (kind === 'mbz') {
        entries = await untarMbz(bytes);
    } else {
        throw new Error(`canonicalize: kind inconnu '${kind}'`);
    }

    // Trier par nom pour stabilité (l'ordre d'entrée d'un ZIP peut varier)
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    const files = [];
    const totalHash = createHash('sha256');
    for (const e of entries) {
        let canonBytes;
        if (isTextEntry(e.name)) {
            const scrubbed = scrubText(td.decode(e.data), kind);
            canonBytes = new TextEncoder().encode(scrubbed);
        } else {
            canonBytes = e.data;
        }
        const canonSha256 = sha256(canonBytes);
        files.push({
            name: e.name,
            rawSize: e.data.length,
            canonSize: canonBytes.length,
            canonSha256
        });
        // Inclure le nom + le hash canon dans l'empreinte globale
        totalHash.update(e.name);
        totalHash.update('\0');
        totalHash.update(canonSha256);
        totalHash.update('\n');
    }

    return { kind, files, totalSha256: totalHash.digest('hex') };
}

/** Décompresse un .h5p (ZIP) via JSZip. */
async function unzipH5p(bytes) {
    const JSZip = await ensureJSZip();
    const zip = await JSZip.loadAsync(bytes);
    const out = [];
    const names = Object.keys(zip.files).sort();
    for (const name of names) {
        const file = zip.files[name];
        if (file.dir) continue;
        const data = await file.async('uint8array');
        out.push({ name, data });
    }
    return out;
}

/** Décompresse un .mbz (gzip+tar) via mbz-utils.extractMbz (window.fflate). */
async function untarMbz(bytes) {
    // extractMbz() appelle loadMoodleLibs() (lib-loader réel) qui, si window.fflate ET
    // window.Tar ne sont PAS déjà peuplés, tente un loadScript() <script> → onload jamais
    // déclenché sous le stub document de bootstrap → HANG infini. On pré-peuple les DEUX
    // globals pour que loadMoodleLibs court-circuite (return immédiat, promises=[]).
    // (Le harnais Node appelait ensureTar() en amont ; ici on rend canonicalize autonome.)
    await ensureFflate();
    await ensureTar();
    const { extractMbz } = await import('../../js/moodle/mbz-utils.js');
    const extracted = await extractMbz(bytes);
    const out = [];
    for (const [name, data] of Object.entries(extracted.files)) {
        out.push({ name, data: data instanceof Uint8Array ? data : new Uint8Array(data) });
    }
    return out;
}

export { sha256 };
