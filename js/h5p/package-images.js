/** Compatibilité des images réellement empaquetées, y compris les anciens scénarios. */
import { processBackgroundImage } from './image-manager.js';

/** Renomme les références sur une copie ; ne modifie ni le brouillon ni son registre. */
export async function normaliserImagesDuPaquet(contenu, medias) {
    if (!medias?.size) return { contenu, medias };
    const references = new Set();
    function recenser(valeur) {
        if (typeof valeur === 'string' && valeur.startsWith('images/')) references.add(valeur);
        else if (valeur && typeof valeur === 'object') Object.values(valeur).forEach(recenser);
    }
    recenser(contenu);
    const fichiers = new Map(medias);
    const conversions = new Map();
    for (const [chemin, blob] of medias) {
        if (!references.has(chemin)) continue;
        if (!/\.(webp|avif|svg|heic|heif)$/i.test(chemin) && !/^image\/(webp|avif|svg\+xml|heic|heif)$/i.test(blob.type)) continue;
        const image = await processBackgroundImage(new File([blob], chemin.split('/').pop(), { type: blob.type }), {
            // Le placement des éléments peut dépendre des dimensions initiales.
            maxDimension: Number.MAX_SAFE_INTEGER,
        });
        const base = chemin.replace(/\.[^.]+$/, '');
        const extension = image.mime === 'image/jpeg' ? 'jpg' : 'png';
        let nouveau = `${base}.${extension}`, n = 1;
        while (fichiers.has(nouveau)) nouveau = `${base}-converti-${n++}.${extension}`;
        fichiers.delete(chemin); fichiers.set(nouveau, image.blob);
        conversions.set(chemin, { path: nouveau, mime: image.mime });
    }
    if (!conversions.size) return { contenu, medias };
    function remplacer(valeur) {
        if (typeof valeur === 'string') return conversions.get(valeur)?.path || valeur;
        if (!valeur || typeof valeur !== 'object') return valeur;
        if (Array.isArray(valeur)) return valeur.map(remplacer);
        const resultat = Object.fromEntries(Object.entries(valeur).map(([cle, v]) => [cle, remplacer(v)]));
        if (conversions.has(valeur.path)) resultat.mime = conversions.get(valeur.path).mime;
        return resultat;
    }
    return { contenu: remplacer(contenu), medias: fichiers };
}
