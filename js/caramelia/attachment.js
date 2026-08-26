/**
 * Caramelia — Pièces jointes glisser-déposer
 *
 * Permet de glisser un document (PDF/DOCX/PPTX/ODT/ODP/PNG/JPEG) sur le panel
 * Caramelia. La transcription est déléguée à `window.CaramelOCR.processFile`
 * (exposé par js/services/ocr.js) et tourne en TÂCHE DE FOND : le widget reste
 * actif, l'utilisateur peut continuer à chatter.
 *
 * On surveille `#pdf-tags-container` via MutationObserver pour détecter la fin
 * réelle de la transcription (apparition d'un .pdf-tag avec le bon nom de fichier).
 *
 * @module caramelia/attachment
 */

import { state } from './state.js';
import { addBotMessage } from './dom.js';
import { offerActivityFromDocument, handleBackgroundImageAttachment } from './flow.js';
import { t } from './i18n.js';
import { debugLog } from '../core/utils.js';

const TRANSCRIPTION_TIMEOUT_MS = 120000; // 2 min — large pour les gros PDF
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 Mo — l'accept de l'input est contournable par drag & drop
const MAX_CONCURRENT_FILES = 3; // borne le nombre de transcriptions simultanées

// Compteur de transcriptions en cours (drop multiple, trombone, drops successifs)
let activeAttachments = 0;

function isOcrAvailable() {
    return !!window.CaramelOCR && typeof window.CaramelOCR.processFile === 'function';
}

/**
 * Attend qu'un .pdf-tag avec le nom de fichier donné apparaisse dans
 * #pdf-tags-container. Résout (true) à l'apparition, (false) au timeout.
 */
function waitForTranscription(fileName, { timeoutMs = TRANSCRIPTION_TIMEOUT_MS } = {}) {
    return new Promise((resolve) => {
        const container = document.getElementById('pdf-tags-container');
        if (!container) return resolve(false);

        // Vérifier d'emblée si déjà présent (cas du fichier déjà transcrit)
        // Une ARCHIVE ne produit pas d'étiquette à son nom : elle en produit une
        // par document extrait, préfixée « archive.zip › ». Sans ce préfixe accepté,
        // un .zip déposé sur le panel finirait en « erreur : timeout » alors que
        // tout s'est bien passé.
        const correspond = (el) => {
            const titre = el.getAttribute('title');
            return titre === fileName || (titre || '').startsWith(fileName + ' › ');
        };

        const alreadyThere = Array.from(container.querySelectorAll('.filename')).some(correspond);
        if (alreadyThere) return resolve(true);

        let resolved = false;
        const observer = new MutationObserver(() => {
            const found = Array.from(container.querySelectorAll('.filename')).some(correspond);
            if (found && !resolved) {
                resolved = true;
                observer.disconnect();
                resolve(true);
            }
        });
        observer.observe(container, { childList: true, subtree: true });

        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                observer.disconnect();
                resolve(false);
            }
        }, timeoutMs);
    });
}

/**
 * Traite UNE pièce jointe : message d'accusé, lancement OCR en arrière-plan,
 * notification finale lorsque la transcription apparaît.
 *
 * Exporté pour pouvoir être appelé depuis un input file (bouton trombone)
 * en plus du drag & drop.
 */
export async function handleAttachment(file) {
    // Étape « image de fond » en cours (Image interactive / Trouve la/les zone·s) :
    // la pièce jointe EST l'image demandée → routée vers le flux de génération,
    // sans OCR (elle sert de fond d'activité, pas de source de texte). Le flux
    // accepte les formats du pipeline image (PNG/JPEG/WebP/GIF/BMP/AVIF/SVG/HEIC/HEIF/TIFF).
    if (handleBackgroundImageAttachment(file)) return;

    if (!isOcrAvailable()) {
        addBotMessage(t('attachment_error', { name: file.name, error: 'OCR indisponible' }));
        return;
    }
    // isSupported est ASYNCHRONE depuis 6.3.2 (elle peut lire la signature
    // binaire du fichier quand ni le MIME ni l'extension ne concluent).
    if (!(await window.CaramelOCR.isSupported(file))) {
        addBotMessage(t('attachment_unsupported', { name: file.name }));
        return;
    }
    // Taille : l'accept de l'input ne protège pas (drag & drop) et l'OCR
    // d'un fichier énorme bloquerait le navigateur. Refus simple, sans casser
    // le traitement des autres fichiers du même drop.
    if (file.size > MAX_FILE_SIZE_BYTES) {
        debugLog('caramelia-attachment', `Fichier refusé (taille ${file.size} octets > 30 Mo) : ${file.name}`);
        addBotMessage(t('attachment_too_large', { name: file.name, max: Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024)) }));
        return;
    }
    // Nombre : on borne les transcriptions simultanées pour ne pas saturer l'OCR.
    if (activeAttachments >= MAX_CONCURRENT_FILES) {
        debugLog('caramelia-attachment', `Fichier refusé (${activeAttachments} transcriptions déjà en cours) : ${file.name}`);
        addBotMessage(t('attachment_too_many', { name: file.name, max: MAX_CONCURRENT_FILES }));
        return;
    }

    // Incrément synchrone (avant tout await) : garantit que les fichiers
    // suivants d'un même drop voient le compteur à jour.
    activeAttachments++;
    try {
        // Accusé immédiat — l'utilisateur peut continuer à chatter pendant ce temps
        addBotMessage(t('attachment_processing', { name: file.name }));

        // Lancement asynchrone (on n'attend PAS le résultat ici pour ne pas bloquer)
        let ocrError = null;
        Promise.resolve()
            .then(() => window.CaramelOCR.processFile(file))
            .catch(err => { ocrError = err; });

        // En parallèle, on observe le DOM pour détecter la fin réelle
        const ok = await waitForTranscription(file.name);
        if (ok) {
            addBotMessage(t('attachment_done', { name: file.name }));
            // Déduire le sujet du document et le PROPOSER (jamais imposer), sauf si
            // l'utilisateur est déjà en train de répondre à une étape guidée.
            const busyInGuidedStep = state.currentFlow === 'generate' && state.genState && state.genState.step;
            if (!busyInGuidedStep && window.CaramelOCR && typeof window.CaramelOCR.getFiles === 'function') {
                const fichiers = window.CaramelOCR.getFiles();
                const entry = fichiers.find(f => f.name === file.name)
                    || fichiers.find(f => f.name.startsWith(file.name + ' › '));
                if (entry && entry.content) offerActivityFromDocument(entry.content, file.name);
            }
        } else {
            const reason = ocrError ? String(ocrError.message || ocrError) : 'timeout';
            addBotMessage(t('attachment_error', { name: file.name, error: reason }));
        }
    } finally {
        activeAttachments = Math.max(0, activeAttachments - 1);
    }
}

/**
 * Active le drag & drop sur le panel Caramelia.
 * À appeler après createWidget() (state.elements.panel doit exister).
 *
 * Stratégie anti-scintillement (document-level counter) :
 * - On compte les dragenter/dragleave au niveau du DOCUMENT (pas du panel).
 *   Un dragenter incrémente, un dragleave décrémente. La classe drag-over
 *   est appliquée tant que le compteur >= 1, retirée quand il revient à 0.
 * - Avantage : zéro handler sur le panel ou ses enfants → aucun
 *   re-déclenchement parasite quand on bouge entre des éléments imbriqués.
 * - Le navigateur envoie un dragenter par élément traversé, et un dragleave
 *   par élément quitté. Tant qu'on est dans la fenêtre, le compteur reste > 0.
 * - Quand on quitte vraiment la fenêtre, tous les dragleave en attente
 *   tombent et le compteur retombe à 0.
 *
 * Le panel garde uniquement les handlers `dragover` (pour autoriser le drop)
 * et `drop` (pour traiter les fichiers).
 */
export function setupDragAndDrop() {
    const panel = state.elements.panel;
    if (!panel) return;

    const isFileDrag = (e) => !!(e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files'));

    let dragCounter = 0;

    const showOverlay = () => panel.classList.add('caramelia-panel--drag-over');
    const hideOverlay = () => panel.classList.remove('caramelia-panel--drag-over');
    const reset = () => { dragCounter = 0; hideOverlay(); };

    document.addEventListener('dragenter', (e) => {
        if (!isFileDrag(e)) return;
        dragCounter++;
        // Afficher l'overlay seulement si le panel est ouvert
        if (state.isOpen) showOverlay();
    });

    document.addEventListener('dragleave', (e) => {
        if (!isFileDrag(e)) return;
        dragCounter = Math.max(0, dragCounter - 1);
        if (dragCounter === 0) hideOverlay();
    });

    // Indispensable au niveau document : sans preventDefault sur dragover,
    // le navigateur refuse le drop. On limite l'effet "copy" au survol du panel.
    document.addEventListener('dragover', (e) => {
        if (!isFileDrag(e)) return;
        if (panel.contains(e.target) || e.target === panel) {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        }
    });

    panel.addEventListener('drop', (e) => {
        if (!e.dataTransfer?.files?.length) return;
        e.preventDefault();
        e.stopPropagation();
        reset();
        for (const file of e.dataTransfer.files) {
            handleAttachment(file);
        }
    });

    // Empêcher le navigateur d'ouvrir le fichier si l'utilisateur lâche
    // en dehors du panel (sinon on quitte la page).
    document.addEventListener('drop', (e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        reset();
    });

    document.addEventListener('dragend', reset);
    window.addEventListener('blur', reset);
}
