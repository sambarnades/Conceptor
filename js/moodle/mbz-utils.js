/**
 * @file Utilitaires partagés pour la lecture / écriture des archives MBZ Moodle.
 *
 * Pendant inverse de h5p-creator + moodle-creator : permet à Caramel de RE-OUVRIR
 * un .mbz qu'il (ou un autre site) a généré, pour le ré-éditer.
 *
 * Architecture cible :
 *   - mbz-utils.js      → infrastructure (extract, build, helpers XML)
 *   - processors/activities/<Type>.js → logique métier par activité :
 *       buildFiles(data)            (forward — existant)
 *       parseFiles(files, dir)      (inverse — à ajouter)
 *       serializeFiles(data, files, dir)  (patch in-place — à ajouter)
 *
 * Usage typique :
 *   const { files, moduleName, activityDir } = await extractMbz(arrayBuffer);
 *   const processor = await import(`./processors/activities/${TypeMap[moduleName]}.js`);
 *   const editorData = processor.parseFiles(files, activityDir);
 *
 * @module moodle/mbz-utils
 */

import { loadMoodleLibs } from '../core/lib-loader.js';

// =========================================================================
// Mapping moduleName Moodle → métadonnées (type Éléa, fichier XML principal)
// =========================================================================

export const MODULE_TO_ELEA = {
    millionnairev2: { eleaType: 'elea_millionnaire', xmlFile: 'millionnairev2.xml' },
    simplequiz:     { eleaType: 'elea_qcm',          xmlFile: 'simplequiz.xml'     },
    epikmatch:      { eleaType: 'elea_appariement',  xmlFile: 'epikmatch.xml'      },
    glossary:       { eleaType: 'elea_glossaire',    xmlFile: 'glossary.xml'       },
    assign:         { eleaType: 'elea_devoir',       xmlFile: 'assign.xml'         },
    page:           { eleaType: 'elea_page',         xmlFile: 'page.xml'           },
    book:           { eleaType: null,                xmlFile: 'book.xml'           },
    quiz:           { eleaType: 'elea_test',         xmlFile: 'quiz.xml'           }
};

// =========================================================================
// TAR reader (ustar / POSIX)
// =========================================================================

function readTar(uint8) {
    const files = {};
    const decoder = new TextDecoder('utf-8');
    let offset = 0;
    while (offset + 512 <= uint8.length) {
        const header = uint8.subarray(offset, offset + 512);
        // Bloc vide = padding final
        if (header.every(b => b === 0)) { offset += 512; continue; }

        const name    = decoder.decode(header.subarray(0, 100)).replace(/\0.*$/, '');
        const sizeStr = decoder.decode(header.subarray(124, 136)).replace(/\0.*$/, '').trim();
        const size    = parseInt(sizeStr, 8) || 0;
        const typeflag = String.fromCharCode(header[156]);
        const magic   = decoder.decode(header.subarray(257, 263));

        // ustar : préfixe de chemin long
        let fullName = name;
        if (magic.startsWith('ustar')) {
            const prefix = decoder.decode(header.subarray(345, 500)).replace(/\0.*$/, '');
            if (prefix) fullName = prefix + '/' + name;
        }

        offset += 512;
        // typeflag '0' / '' / '\0' = fichier régulier
        if (typeflag === '0' || typeflag === '' || typeflag === '\0') {
            if (fullName) {
                files[fullName] = size > 0
                    ? uint8.subarray(offset, offset + size)
                    : new Uint8Array(0);
            }
        }
        offset += Math.ceil(size / 512) * 512;
    }
    return files;
}

// =========================================================================
// Extraction d'un .mbz complet
// =========================================================================

/**
 * Décompresse un MBZ et détecte automatiquement le module Moodle qu'il contient.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - Contenu binaire du .mbz
 * @returns {Promise<{
 *   files: Object<string, Uint8Array>,
 *   moduleName: string,        // 'simplequiz', 'page', etc.
 *   moduleId: string,          // ID numérique extrait du chemin
 *   activityDir: string,       // 'activities/simplequiz_25'
 *   xmlPath: string,           // 'activities/simplequiz_25/simplequiz.xml'
 *   xml: string,               // Contenu de l'XML principal
 *   info: { eleaType: string, xmlFile: string }
 * }>}
 * @throws {Error} mbz_no_activity_folder | mbz_unknown_module:<name> | mbz_missing_xml:<path>
 */
export async function extractMbz(buffer) {
    await loadMoodleLibs();

    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    // Détection gzip (magic bytes 0x1f 0x8b)
    const tarData = (uint8[0] === 0x1f && uint8[1] === 0x8b)
        ? window.fflate.gunzipSync(uint8)
        : uint8;

    const files = readTar(tarData);
    const paths = Object.keys(files);

    // Détecte le dossier d'activité : activities/<moduleName>_<id>/
    let moduleName = null, moduleId = null, activityDir = null;
    for (const p of paths) {
        const m = p.match(/^activities\/([a-z0-9]+)_(\d+)\//);
        if (m) {
            moduleName  = m[1];
            moduleId    = m[2];
            activityDir = `activities/${m[1]}_${m[2]}`;
            break;
        }
    }
    if (!moduleName) throw new Error('mbz_no_activity_folder');

    const info = MODULE_TO_ELEA[moduleName];
    if (!info) throw new Error(`mbz_unknown_module:${moduleName}`);

    const xmlPath  = `${activityDir}/${info.xmlFile}`;
    const xmlBytes = files[xmlPath];
    if (!xmlBytes) throw new Error(`mbz_missing_xml:${xmlPath}`);

    const xml = new TextDecoder('utf-8').decode(xmlBytes);

    return { files, moduleName, moduleId, activityDir, xmlPath, xml, info };
}

// =========================================================================
// Reconstruction MBZ (tar + gzip)
// Format identique à moodle-creator.createMbz : ustar + .ARCHIVE_INDEX en tête.
// =========================================================================

/**
 * Reconstruit une archive .mbz à partir d'une map { chemin: contenu }.
 *
 * @param {Object<string, Uint8Array|string>} files
 * @returns {Promise<Uint8Array>} - Données tar.gz prêtes à être téléchargées
 */
export async function buildMbz(files) {
    await loadMoodleLibs();
    const tar   = new window.Tar();
    const mtime = Math.floor(Date.now() / 1000);

    const allPaths = Object.keys(files);

    // Liste des dossiers implicites (Moodle attend des entrées 'd' dans l'index)
    const dirSet = new Set();
    for (const p of allPaths) {
        const parts = p.split('/');
        for (let i = 1; i < parts.length; i++) {
            dirSet.add(parts.slice(0, i).join('/') + '/');
        }
    }
    const dirList  = Array.from(dirSet).sort();
    const fileList = allPaths.sort();

    // Conversion de tous les contenus en Uint8Array
    const buffers = new Map();
    for (const p of fileList) {
        buffers.set(
            p,
            files[p] instanceof Uint8Array ? files[p] : window.fflate.strToU8(files[p])
        );
    }

    // .ARCHIVE_INDEX : entête imposé par le format Moodle
    let index = `Moodle archive file index. Count: ${dirList.length + fileList.length}\n`;
    for (const d of dirList)  index += `${d}\td\t0\t${mtime}\n`;
    for (const p of fileList) index += `${p}\tf\t${buffers.get(p).length}\t${mtime}\n`;
    buffers.set('.ARCHIVE_INDEX', window.fflate.strToU8(index));

    // Append dans un ordre stable
    for (const p of Array.from(buffers.keys()).sort()) {
        tar.append(p, buffers.get(p));
    }

    return new Promise((resolve, reject) => {
        window.fflate.gzip(tar.out, { level: 6, mtime }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

// =========================================================================
// Helpers XML (utilisés par les parseFiles() des processors)
// =========================================================================

export { parseXml, tagText, escapeXml, rewriteTag, stripParagraphWrap, wrapP } from './xml-utils.js';
import { parseXml } from './xml-utils.js';

// =========================================================================
// Détection des formats XML standalone (en dehors d'un .mbz)
// =========================================================================

/**
 * Constantes des types XML standalone détectés.
 * Distincts des `MODULE_TO_ELEA` qui décrivent les modules Moodle dans un MBZ.
 */
export const STANDALONE_XML_TYPES = {
    GLOSSARY:      'glossary_standalone',      // Moodle Glossary export (root <GLOSSARY>, balises uppercase)
    QUESTION_BANK: 'questionbank_standalone'   // Moodle Question XML format (root <quiz>, banque de questions)
};

/**
 * Inspecte le tag racine pour déterminer le format XML standalone fourni.
 *
 * @param {string} xml - Contenu XML brut
 * @returns {'glossary_standalone'|'questionbank_standalone'|null}
 */
export function detectStandaloneXmlType(xml) {
    let doc;
    try { doc = parseXml(xml); } catch { return null; }
    const root = doc.documentElement;
    if (!root) return null;

    // <GLOSSARY> = format Glossary export Moodle (UPPERCASE)
    if (root.tagName === 'GLOSSARY') return STANDALONE_XML_TYPES.GLOSSARY;

    // <quiz> = format Moodle Question XML (banque de questions standalone).
    // Note : `<quiz>` existe aussi dans `quiz.xml` à l'intérieur d'un MBZ — mais
    // dans ce cas il est parsé par Test.parseFiles et n'arrive jamais ici.
    if (root.tagName === 'quiz') return STANDALONE_XML_TYPES.QUESTION_BANK;

    return null;
}
