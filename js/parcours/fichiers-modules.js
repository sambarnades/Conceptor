/**
 * @file Parcours — les fichiers qu'un module natif exige à la restauration.
 *
 * **Le Document collaboratif (`mod_collabora`) ne vit pas de son seul XML.** Même
 * au format « texte », le greffon range son texte de départ dans un vrai
 * fichier : `<nom>.txt`, composant `mod_collabora`, zone `initial`. Le relevé
 * du 27 sept. 2026 le montre dans les deux exports (Éléa et Magistère), et la
 * restauration l'EXIGE : sans lui, `collabora_fs::get_initial_file()` lève
 * `mod_collabora/initialfilemissing` et Moodle interrompt l'import du COURS
 * ENTIER. Constaté le 27 sept. 2026 au soir sur les deux plateformes, avec la première
 * sonde des modules natifs (D75).
 *
 * **Le Paquetage IMS (`mod_imscp`) n'existe que par ses fichiers** : les pages et
 * le manifeste déployés (zone `content`), l'archive d'origine (zone `backup`).
 * Son constructeur les décrit (`paquet`), on les pose ici.
 *
 * On pose chaque fichier comme l'export le pose : le contenu dans le pool
 * (`files/<2 car.>/<sha1>`), une entrée dans `files.xml` (plus le dossier « . »
 * de sa zone), et les identifiants dans l'`inforef.xml` de l'activité.
 * APRÈS l'assemblage, comme le fond personnel de la Carte (`carte-image.js`) :
 * le constructeur de cours est partagé avec la Sucrerie, et il refuse — à
 * raison — une activité qui arrive avec ses propres fichiers.
 *
 * @module parcours/fichiers-modules
 */

import { buildFilesXml, EMPTY_FILE_HASH } from '../moodle/mbz-course-builder.js';

/**
 * Le nom de fichier que le greffon donnerait : `clean_filename(format_string($name))`
 * + `.txt`. Seule la présence d'un fichier compte pour la restauration ; on
 * reproduit le nom pour que le cours restauré ressemble à celui d'un enseignant.
 */
function nomFichier(nom) {
    const propre = String(nom || '')
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
    return `${propre || 'document'}.txt`;
}

async function sha1(octets) {
    return [...new Uint8Array(await crypto.subtle.digest('SHA-1', octets))]
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Le `contextid` que la renumérotation a donné à l'activité. */
function contexteDe(xml) {
    const contextid = Number(new DOMParser().parseFromString(xml, 'application/xml')
        .documentElement.getAttribute('contextid'));
    if (!contextid) throw new Error('parcours_document_sans_contexte');
    return contextid;
}

/**
 * L'archive d'origine d'un paquetage, reconstituée depuis ses fichiers. Même
 * bibliothèque que l'archive du cours (fflate) ; date figée sur l'horodatage du
 * parcours, pour qu'un même contenu donne le même fichier.
 */
async function archiver(fichiers, ts) {
    const { loadMoodleLibs } = await import('../core/lib-loader.js');
    await loadMoodleLibs();
    const entrees = Object.fromEntries(fichiers.map(f => [f.filename, f.octets]));
    return window.fflate.zipSync(entrees, { level: 6, mtime: new Date(ts * 1000) });
}

/**
 * Ajoute les fichiers propres aux modules natifs du cours.
 *
 * @param {Object<string, string|Uint8Array>} files - Carte de fichiers assemblée.
 * @param {Object} [options]
 * @param {number} [options.timestamp]
 * @param {Array<{dir:string, paquet:Object}>} [options.joints] - Les activités qui
 *        décrivent leurs fichiers (`paquet` : composant et zones), avec le dossier
 *        que l'assemblage leur a donné.
 * @returns {Promise<Object>} Une NOUVELLE carte de fichiers.
 */
export async function joindreFichiersInitiaux(files, { timestamp, joints = [] } = {}) {
    const documents = Object.keys(files).filter(p => /^activities\/collabora_\d+\/collabora\.xml$/.test(p));
    if (!documents.length && !joints.length) return files;

    const sortie = { ...files };
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const manifeste = new DOMParser().parseFromString(sortie['files.xml'], 'application/xml');
    let prochainId = Math.max(0, ...[...manifeste.querySelectorAll('file')].map(n => Number(n.getAttribute('id')) || 0)) + 1;
    const ajouts = [];

    /** Pose les fichiers d'UNE activité et réécrit son `inforef.xml`. */
    async function poser(dir, contextid, component, zones) {
        const ids = [];
        for (const { filearea, itemid, fichiers } of zones) {
            const commun = { contextid, component, filearea, itemid, timecreated: ts, timemodified: ts, license: null };
            for (const f of fichiers) {
                const hash = f.octets.length ? await sha1(f.octets) : EMPTY_FILE_HASH;
                sortie[`files/${hash.slice(0, 2)}/${hash}`] = f.octets;
                ajouts.push({ ...commun, id: prochainId, contenthash: hash, filename: f.filename,
                    filesize: f.octets.length, mimetype: f.mimetype, source: f.source ?? null });
                ids.push(prochainId++);
            }
            // Le dossier « . » de la zone, comme dans tout export.
            ajouts.push({ ...commun, id: prochainId, contenthash: EMPTY_FILE_HASH, filename: '.', filesize: 0 });
            ids.push(prochainId++);
        }
        sortie[`${dir}/inforef.xml`] = `<?xml version="1.0" encoding="UTF-8"?>
<inforef><fileref>${ids.map(id => `<file><id>${id}</id></file>`).join('')}</fileref></inforef>`;
    }

    for (const chemin of documents) {
        const xml = new DOMParser().parseFromString(sortie[chemin], 'application/xml');
        const nom = xml.documentElement.querySelector('collabora > name')?.textContent || '';
        const texte = xml.documentElement.querySelector('collabora > initialtext')?.textContent || '';
        await poser(chemin.slice(0, chemin.lastIndexOf('/')), contexteDe(sortie[chemin]), 'mod_collabora', [{
            filearea: 'initial', itemid: 0,
            fichiers: [{ filename: nomFichier(nom), mimetype: 'text/plain', octets: new TextEncoder().encode(texte) }],
        }]);
    }

    for (const { dir, paquet } of joints) {
        const nomModule = dir.slice('activities/'.length).replace(/_\d+$/, '');
        const contextid = contexteDe(sortie[`${dir}/${nomModule}.xml`]);
        const zones = [];
        for (const zone of paquet.zones) {
            if (!zone.archive) { zones.push(zone); continue; }
            const octets = await archiver(zone.archive.de, ts);
            zones.push({ filearea: zone.filearea, itemid: zone.itemid, fichiers: [{
                filename: zone.archive.filename, mimetype: 'application/zip', octets, source: zone.archive.filename,
            }] });
        }
        await poser(dir, contextid, paquet.component, zones);
    }

    sortie[`files/${EMPTY_FILE_HASH.slice(0, 2)}/${EMPTY_FILE_HASH}`] = new Uint8Array();
    const entrees = buildFilesXml(ajouts).match(/<files>([\s\S]*)<\/files>/)[1];
    sortie['files.xml'] = sortie['files.xml'].replace('</files>', `${entrees}</files>`);
    return sortie;
}
