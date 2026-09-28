import { buildMediaStructure } from './image-manager.js';

/** Préserver et valider le média natif facultatif d’une question. */
export function prepareQuestionMedia(data) {
        const media = structuredClone(data.media?.type ? data.media :
            data.mediaImage?.path ? buildMediaStructure(data.mediaImage, data.mediaImageAlt) : data.media || {disableImageZooming:false});
        if (!data.media?.type && data.mediaImage?.copyright && media.type?.params?.file) {
            media.type.params.file.copyright = structuredClone(data.mediaImage.copyright);
        }
        if (!media.type?.library) delete media.type;
        else if (/^H5P\.(Image|Audio|Video) /.test(media.type.library)) {
            const params=media.type.params || {};
            const file=media.type.library.startsWith('H5P.Image') ? params.file : media.type.library.startsWith('H5P.Audio') ? params.files?.[0] : params.sources?.[0];
            if (!file || typeof file.path !== 'string' || !file.path.trim()) throw Error('H5P : le média sélectionné doit contenir un fichier ou une URL.');
            for (const source of [params.file, ...(params.files || []), ...(params.sources || [])].filter(Boolean)) {
                delete source.dataURL;delete source.kind;
            }

        }

        return media;
}
