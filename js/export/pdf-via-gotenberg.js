/**
 * @file Conversion document bureautique → PDF via le proxy n8n Gotenberg.
 *
 * On envoie l'ODT généré par Caramel (formules MathML/StarMath natives) :
 * Gotenberg l'ouvre dans LibreOffice (image dotée du paquet libreoffice-math),
 * rend les formules, et renvoie un PDF fidèle. La source PDF est ainsi la même
 * que l'ODT éditable téléchargé → cohérence des formules entre les deux exports.
 *
 * Le frontend ne connaît PAS l'URL/les credentials Gotenberg : tout passe par
 * n8n qui détient le secret côté serveur (workflow caramel-pdf-convert-bas).
 *
 * Cette voie est tentée en priorité depuis exportToPDF() ; en cas d'échec
 * (réseau, timeout, body trop gros, 5xx, réponse non-PDF), l'appelant
 * retombe automatiquement sur la génération jsPDF historique.
 */

import { debugLog } from '../core/utils.js';
import { ENDPOINTS } from '../core/endpoints.js';

// URL centralisée dans core/endpoints.js (réécrite en prod par la CI via la
// variable PDF_CONVERT_URL, cf. .gitlab-ci.yml).
const PDF_CONVERT_URL = ENDPOINTS.pdfConvert;

// Gotenberg a un timeout serveur de 30s. On laisse une marge pour le cold start
// n8n (~3s) et l'aller-retour réseau, en restant sous des valeurs aberrantes.
const TIMEOUT_MS = 35000;

/**
 * Convertit un Blob bureautique (ODT par défaut) en Blob PDF via le workflow
 * n8n + Gotenberg.
 * @param {Blob} sourceBlob - Le document à convertir (ODT généré par Caramel).
 * @param {string} [fileName='document.odt'] - Nom de fichier transmis à
 *   Gotenberg ; son extension détermine le converter LibreOffice utilisé.
 * @returns {Promise<Blob>} Le PDF retourné par Gotenberg.
 * @throws {Error} En cas d'échec réseau, HTTP, timeout, ou réponse invalide.
 */
export async function convertToPdfViaGotenberg(sourceBlob, fileName = 'document.odt') {
    if (!(sourceBlob instanceof Blob) || !sourceBlob.size) {
        throw new Error('Document source invalide ou vide');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const formData = new FormData();
        // Gotenberg attend un champ multipart nommé "files", et déduit le
        // converter du nom de fichier (extension .odt → route LibreOffice).
        formData.append('files', sourceBlob, fileName);

        debugLog('PDF', `Envoi ${fileName} vers Gotenberg (${sourceBlob.size} octets)`);

        const response = await fetch(PDF_CONVERT_URL, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Gotenberg HTTP ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/pdf')) {
            throw new Error(`Réponse non-PDF (Content-Type: ${contentType})`);
        }

        const pdfBlob = await response.blob();
        if (!pdfBlob.size) {
            throw new Error('PDF vide reçu de Gotenberg');
        }

        debugLog('PDF', `PDF reçu de Gotenberg (${pdfBlob.size} octets)`);
        return pdfBlob;

    } finally {
        clearTimeout(timer);
    }
}
