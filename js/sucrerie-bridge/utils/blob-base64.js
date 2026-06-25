/**
 * Encodage Blob → base64 pour envoi à `/sucrerie-publish` (champ `binary_base64`).
 *
 * Implémentation chunkée pour éviter le stack overflow sur les gros fichiers
 * (`String.fromCharCode(...spread)` plante au-delà de ~100k éléments).
 * Identique au pattern `arrayBufferToBase64` côté Sucrerie h5p-reader.js.
 */

export async function blobToBase64(blob) {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000; // 32 Ko
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
}
