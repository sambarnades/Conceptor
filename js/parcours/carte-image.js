/** Fond personnel de mod_mapmodules : conversion locale et fichiers du backup. */
import { buildFilesXml, EMPTY_FILE_HASH } from '../moodle/mbz-course-builder.js';

export const NOM_FOND_CARTE = 'fond-parcours.jpg';
const JPEG = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

/** Les octets absents après un repli de stockage restent explicitement absents. */
export function relireImageCarte(image) {
    if (!image) return undefined;
    const width = Number(image.width), height = Number(image.height);
    if (width !== 1000 || !Number.isInteger(height) || height < 250 || height > 2000
        || (image.dataURL !== undefined && (typeof image.dataURL !== 'string'
            || image.dataURL.length > 4 * 1024 * 1024 || !JPEG.test(image.dataURL)))) {
        throw new Error('parcours_scenario_illisible');
    }
    return { nom: String(image.nom || '').slice(0, 255), width, height,
        ...(image.dataURL ? { dataURL: image.dataURL } : {}) };
}

/** Même décodage que les activités H5P, puis JPEG autonome pour Éléa. */
export async function preparerImageCarte(fichier) {
    const { processBackgroundImage } = await import('../h5p/image-manager.js');
    const entree = await processBackgroundImage(fichier, { maxDimension: 1920 });
    const image = await createImageBitmap(entree.blob);
    try {
        const canvas = document.createElement('canvas');
        // maploader travaille dans un repère de 1000 px. Les marges des images
        // très allongées laissent assez de place aux icônes, sans rien rogner.
        canvas.width = 1000;
        canvas.height = Math.max(250, Math.min(2000, Math.round(1000 * image.height / image.width)));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f4f4f7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const ratio = Math.min(canvas.width / image.width, canvas.height / image.height);
        const w = image.width * ratio, h = image.height * ratio;
        ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        return { nom: fichier.name || NOM_FOND_CARTE, width: canvas.width, height: canvas.height,
            dataURL: canvas.toDataURL('image/jpeg', 0.9) };
    } finally { image.close(); }
}

/** Trois traversées, à l'intérieur de l'image, quel que soit son format. */
export function traceCartePersonnelle(image) {
    const h = image.height;
    const y = proportion => Math.round(h * proportion);
    return `M 90 ${y(.16)} H 810 C 940 ${y(.16)} 940 ${y(.5)} 810 ${y(.5)} H 190 C 60 ${y(.5)} 60 ${y(.84)} 190 ${y(.84)} H 910`;
}

/** Ajoute le fond APRÈS renumérotation, sans modifier le constructeur partagé. */
export async function joindreFondCarte(files, carte, { timestamp } = {}) {
    const entree = Object.keys(files).find(p => /^activities\/mapmodules_\d+\/mapmodules.xml$/.test(p));
    if (!entree || !carte?.personnalisee) return files;
    const image = relireImageCarte(carte.image);
    if (!image?.dataURL) throw new Error('parcours_carte_perso_manquante');
    const bytes = Uint8Array.from(atob(image.dataURL.split(',')[1]), c => c.charCodeAt(0));
    // Une importation JSON ne doit pas pouvoir fournir une fausse image.
    let bitmap;
    try {
        bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
        if (bitmap.width !== image.width || bitmap.height !== image.height) throw new Error();
    } catch { throw new Error('parcours_carte_perso_manquante'); }
    finally { bitmap?.close(); }
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-1', bytes))]
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const xml = new DOMParser().parseFromString(files[entree], 'application/xml');
    const contextid = Number(xml.documentElement.getAttribute('contextid'));
    if (!contextid) throw new Error('parcours_carte_perso_manquante');
    const manifeste = new DOMParser().parseFromString(files['files.xml'], 'application/xml');
    const prochainId = Math.max(0, ...[...manifeste.querySelectorAll('file')].map(n => Number(n.getAttribute('id')))) + 1;
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const commun = { contextid, component: 'mod_mapmodules', filearea: 'maps', itemid: 0,
        timecreated: ts, timemodified: ts, license: 'allrightsreserved' };
    const ajouts = buildFilesXml([
        { ...commun, id: prochainId, contenthash: hash, filename: NOM_FOND_CARTE,
            filesize: bytes.length, mimetype: 'image/jpeg', source: NOM_FOND_CARTE },
        { ...commun, id: prochainId + 1, contenthash: EMPTY_FILE_HASH, filename: '.', filesize: 0 },
    ]).match(/<files>([\s\S]*)<\/files>/)[1];
    const dossier = entree.slice(0, entree.lastIndexOf('/'));
    return { ...files,
        'files.xml': files['files.xml'].replace('</files>', `${ajouts}</files>`),
        [`files/${hash.slice(0, 2)}/${hash}`]: bytes,
        [`files/${EMPTY_FILE_HASH.slice(0, 2)}/${EMPTY_FILE_HASH}`]: new Uint8Array(),
        [`${dossier}/inforef.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<inforef><fileref><file><id>${prochainId}</id></file><file><id>${prochainId + 1}</id></file></fileref></inforef>`,
    };
}
