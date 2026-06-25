/**
 * @file Gestion de la création des activités Moodle/Éléa.
 * Ce module contient la logique pour transformer le JSON généré par l'IA en différents formats Moodle :
 * - Fichiers de sauvegarde d'activité (.mbz)
 * - Fichiers XML pour les banques de questions et les glossaires.
 * - Fichiers au format GIFT.
 */

import { translations, currentLang } from '../core/translation.js';
import { cleanJsonInput, downloadFile, formatTextToHtml, markdownToHtml, escapeHtmlTags, DEBUG, classifyError, debugLog } from '../core/utils.js';
import { addNotification } from '../ui/notifications.js';
import { loadMoodleLibs } from '../core/lib-loader.js';
import { escapeXml, generateMoodleXml, generateMoodleGift } from './moodle-formats.js';
import * as MoodleProcessors from './processors/index.js';
import { healStructureForActivity, normalizeDoubleEscapedLatex, repairBrokenLatexEscapes, autoWrapLatex, convertLatexDelimitersDeep, convertLatexEnvironmentsDeep, latexToUnicode } from '../h5p/json-healer.js';
import { getTheme } from './page-themes.js';

/**
 * Pipeline complet de réparation LaTeX pour les activités Moodle/Éléa.
 * Enchaîne : 0) normalisation des doubles échappements (\\( → \(),
 *            1) réparation des commandes LaTeX cassées par JSON.parse (\neq → newline+eq),
 *            2) conversion $...$ → \(...\) et $$...$$ → \[...\],
 *            3) auto-enveloppement du LaTeX nu dans \(...\).
 * @param {any} data - Les données JSON (objet, tableau ou chaîne)
 * @returns {any} Les données avec le LaTeX normalisé
 */
export { healLatexForMoodle as healLatexForTest, healClozeQuestiontext };
function healLatexForMoodle(data) {
    let healed = normalizeDoubleEscapedLatex(data);
    healed = repairBrokenLatexEscapes(healed);
    healed = convertLatexEnvironmentsDeep(healed);
    healed = convertLatexDelimitersDeep(healed);
    healed = autoWrapLatex(healed);
    healed = normalizeDoubleEscapedLatex(healed);
    healed = healClozeSyntax(healed);
    healed = healTestAnswerFields(healed);
    return healed;
}

/**
 * Répare la syntaxe cloze invalide dans les questions de type Test.
 * Opère sur les questions de type "cloze" dans le tableau `questions` :
 * 1) {N:NUMERICAL:#=X:T} → {N:NUMERICAL:=X:T} (# invalide)
 * 2) {N:NUMERICAL:=texte:T} → {N:SHORTANSWER:=texte} si la réponse n'est pas un nombre
 * 3) Supprime les délimiteurs LaTeX \(...\) dans le questiontext des cloze
 *    (conflit backslashes/accolades avec la syntaxe {1:TYPE:...})
 * @param {any} data - Les données JSON de la banque de questions
 * @returns {any} Les données avec la syntaxe cloze corrigée
 */
function healClozeSyntax(data) {
    if (!data || typeof data !== 'object') return data;

    // Parcourt le tableau de questions
    if (Array.isArray(data.questions)) {
        data.questions = data.questions.map(q => {
            if (q.type === 'cloze' && q.content && typeof q.content.questiontext === 'string') {
                q.content.questiontext = healClozeQuestiontext(q.content.questiontext);
            }
            return q;
        });
    }
    return data;
}

/**
 * Répare un questiontext de question cloze.
 * @param {string} text - Le questiontext brut
 * @returns {string} Le questiontext corrigé
 */
function healClozeQuestiontext(text) {
    // 1) Supprime les délimiteurs LaTeX \(...\) en gardant le contenu intérieur
    //    Gère aussi \\(...\\) (double-échappé dans JSON)
    text = text.replace(/\\{1,2}\((.*?)\\{1,2}\)/g, '$1');

    // 2) Corrige {N:NUMERICAL:#=val:tol} → {N:NUMERICAL:=val:tol}
    text = text.replace(/\{(\d+):NUMERICAL:#=/g, '{$1:NUMERICAL:=');

    // 3) Convertit {N:NUMERICAL:=texte:tol} → {N:SHORTANSWER:=texte}
    //    quand la réponse n'est pas un nombre valide
    text = text.replace(/\{(\d+):NUMERICAL:=([^}~]+)\}/g, (match, weight, inner) => {
        // inner peut être "val:tol" ou "val"
        const parts = inner.split(':');
        const answer = parts[0].trim();
        // Vérifie si c'est un nombre (entier, décimal, notation scientifique)
        if (/^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(answer)) {
            return match; // Valide, on ne touche pas
        }
        // Pas un nombre → convertit en SHORTANSWER (sans tolérance)
        debugLog('healClozeSyntax', `NUMERICAL non numérique converti en SHORTANSWER: "${answer}"`);
        return `{${weight}:SHORTANSWER:=${answer}}`;
    });

    return text;
}

/**
 * Convertit le LaTeX (délimité ou nu) en texte brut/Unicode dans une chaîne.
 * Utilisé pour les champs de réponse qui ne supportent pas MathJax.
 * @param {string} text
 * @returns {string}
 */
function stripLatexToPlainText(text) {
    if (!text || typeof text !== 'string') return text;
    // 1. Extraire le contenu des blocs \(...\) et convertir en Unicode
    let cleaned = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => latexToUnicode(inner).trim());
    // 2. Convertir les commandes LaTeX restantes (sans délimiteurs) en Unicode
    if (/\\[a-zA-Z]/.test(cleaned)) {
        cleaned = latexToUnicode(cleaned);
    }
    return cleaned;
}

/**
 * Nettoie les champs de réponse des questions Test qui ne doivent pas contenir de LaTeX.
 * - shortanswer : les réponses (text) doivent être en texte brut (champ saisi par l'élève)
 * - matching : les réponses (answer) doivent être en Unicode (menu déroulant, pas de MathJax)
 * Opère uniquement sur les questions de type "shortanswer" et "matching" dans data.questions.
 * @param {any} data - Les données JSON de la banque de questions
 * @returns {any} Les données avec les réponses nettoyées
 */
function healTestAnswerFields(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.questions)) return data;

    data.questions = data.questions.map(q => {
        if (!q || !q.content) return q;

        // shortanswer : convertir le LaTeX dans les réponses en texte brut
        if (q.type === 'shortanswer' && Array.isArray(q.content.answers)) {
            q.content.answers = q.content.answers.map(a => {
                if (a.text && typeof a.text === 'string') {
                    const cleaned = stripLatexToPlainText(a.text);
                    if (cleaned !== a.text) {
                        debugLog('healTestAnswerFields', `shortanswer: "${a.text}" → "${cleaned}"`);
                        a.text = cleaned;
                    }
                }
                return a;
            });
        }

        // matching : convertir le LaTeX dans les champs answer en Unicode
        if (q.type === 'matching' && Array.isArray(q.content.subquestions)) {
            q.content.subquestions = q.content.subquestions.map(sq => {
                if (sq.answer && typeof sq.answer === 'string') {
                    const cleaned = stripLatexToPlainText(sq.answer);
                    if (cleaned !== sq.answer) {
                        debugLog('healTestAnswerFields', `matching answer: "${sq.answer}" → "${cleaned}"`);
                        sq.answer = cleaned;
                    }
                }
                return sq;
            });
        }

        return q;
    });

    return data;
}

/**
 * Crée une archive de sauvegarde Moodle (.mbz) à partir d'un ensemble de fichiers.
 * @param {Object} files - Un objet où les clés sont les chemins des fichiers et les valeurs leur contenu.
 * @returns {Promise<Uint8Array>} Une promesse qui se résout avec les données compressées de l'archive.
 * @public Exportée pour la régénération après édition
 */
export async function createMbz(files) {
    // S'assurer que les bibliothèques Moodle sont chargées
    await loadMoodleLibs();
    const tar = new Tar();
    const mtime = Math.floor(Date.now() / 1000);
    // 1. Déduire la liste des répertoires à partir des chemins de fichiers
    const allPaths = Object.keys(files);
    const dirSet = new Set();
    for (const path of allPaths) {
        const parts = path.split('/');
        for (let i = 1; i < parts.length; i++) {
            const dir = parts.slice(0, i).join('/') + '/';
            dirSet.add(dir);
        }
    }
    const dirList = Array.from(dirSet).sort();
    const fileList = allPaths.sort();
    // 2. Pré-convertir tous les fichiers en Uint8Array (une seule fois)
    const buffers = new Map();
    for (const path of fileList) {
        buffers.set(path, fflate.strToU8(files[path]));
    }
    // 3. Générer le contenu de l'index
    let archiveIndexContent = `Moodle archive file index. Count: ${dirList.length + fileList.length}\n`;
    for (const dir of dirList) {
        archiveIndexContent += `${dir}\td\t0\t${mtime}\n`;
    }
    for (const path of fileList) {
        archiveIndexContent += `${path}\tf\t${buffers.get(path).length}\t${mtime}\n`;
    }
    // Convertir et ajouter l'index lui-même
    const indexBuffer = fflate.strToU8(archiveIndexContent);
    buffers.set('.ARCHIVE_INDEX', indexBuffer);
    // 4. Ajouter tous les fichiers à l'archive TAR (en UTF-8)
    const sortedPaths = Array.from(buffers.keys()).sort();
    for (const path of sortedPaths) {
        tar.append(path, buffers.get(path));
    }
    // 5. Obtenir l'archive TAR sous forme de Uint8Array
    const tarball = tar.out;
    // 6. Compresser en GZIP avec fflate
    return new Promise((resolve, reject) => {
        fflate.gzip(tarball, {
            level: 6,
            mtime: mtime
        }, (err, data) => {
            if (err) {
                console.error("Erreur de compression GZIP:", err);
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}


/**
 * Gère la création d'une activité "Page" Moodle, soit en HTML simple, soit en archive .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant la structure de la page.
 * @param {string} exportType - Le type d'export ('html' ou 'mbz').
 */
export async function handlePageCreation(jsonInput, exportType) {
    try {
        let jsonData = JSON.parse(cleanJsonInput(jsonInput));
        const _debugRawJsonPage = DEBUG ? structuredClone(jsonData) : null;
        jsonData = healStructureForActivity(jsonData, 'Page');
        // Pipeline LaTeX : réparation des commandes cassées + auto-wrap + conversion délimiteurs
        jsonData = healLatexForMoodle(jsonData);
        const _debugHealedJsonPage = DEBUG ? structuredClone(jsonData) : null;
        const originalJsonDataPage = structuredClone(jsonData);
        if (!jsonData.title || !Array.isArray(jsonData.blocks)) {
            console.error("Erreur de validation : Le JSON doit contenir un 'title' et un tableau 'blocks'.");
            throw new Error("Le JSON doit contenir un 'title' et un tableau 'blocks'.");
        }
        const htmlContent = await generateHtmlFromBlocks(jsonData);
        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');

        if (exportType === 'html') {
            const fileName = `page-elea-${dateString}.html`;
            // Fichier .html autonome : aucun chrome Moodle/Éléa au-dessus du
            // contenu → le héros porte le <h1> de la page (accessibilité).
            const standaloneHtml = await generateHtmlFromBlocks(jsonData, { heroLevel: 1 });
            const htmlBlob = new Blob([standaloneHtml], { type: 'text/html' });

            // Ajouter à la liste des notifications (silent pour la modale de résultat)
            const notificationId = addNotification({
                type: 'html',
                title: translations.elea_page_name || 'Page Éléa',
                titleKey: 'elea_page_name',
                moduleKey: 'Page',
                fileName: fileName,
                blob: htmlBlob,
                status: 'success',
                jsonData: jsonData,
                originalJsonData: originalJsonDataPage,
                silent: true
            });
            document.dispatchEvent(new CustomEvent('generation:complete', {
                detail: { notificationId, blob: htmlBlob, fileName, titleKey: 'elea_page_name', moduleKey: 'Page' }
            }));
        } else if (exportType === 'mbz') {
            const activityTitle = jsonData.title;
            const timestamp = Math.floor(Date.now() / 1000);
            const courseId = 1000 + Math.floor(Math.random() * 9000);
            const moduleId = 10000 + Math.floor(Math.random() * 90000);
            const sectionId = 1000 + Math.floor(Math.random() * 9000);
            const activityId = 100 + Math.floor(Math.random() * 900);
            const courseContextId = 10000 + Math.floor(Math.random() * 90000);
            const activityContextId = courseContextId + 2;

            const data = {
                'ACTIVITY_TITLE': escapeXml(activityTitle),
                'PAGE_NAME': escapeXml(activityTitle),
                'CONTENT': escapeXml(htmlContent),
                'INTRO': escapeXml(jsonData.intro || ''),
                'COURSE_FULLNAME': escapeXml(activityTitle),
                'COURSE_SHORTNAME': `page-${Math.random().toString(36).substring(2, 15)}`,
                'COURSE_ID': courseId,
                'MODULE_ID': moduleId,
                'SECTION_ID': sectionId,
                'ACTIVITY_ID': activityId,
                'COURSE_CONTEXTID': courseContextId,
                'ACTIVITY_CONTEXTID': activityContextId,
                'TIMESTAMP': timestamp,
                'BACKUP_DATE': timestamp
            };
            // Utiliser le nouveau module moodle-processors (ZERO appels réseau)
            let files = MoodleProcessors.getActivityFiles('Page', data);

            files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';
            const gzData = await createMbz(files);

            const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
            const fileName = `page-caramel-${dateString}-${lang}.mbz`;
            const mbzBlob = new Blob([gzData], { type: 'application/octet-stream' });

            // Preview de la modale : pas de chrome Éléa autour → le héros porte
            // le <h1>. (Le contenu du .mbz, lui, reste sans niveau-1 : Éléa pose
            // déjà le <h1> de l'activité au-dessus — voir generateHtmlFromBlocks.)
            const previewHtmlPage = await generateHtmlFromBlocks(jsonData, { heroLevel: 1 });

            // Ajouter à la liste des notifications (silent pour la modale de résultat)
            const notifPage = {
                type: 'mbz',
                title: translations.elea_page_name || 'Page Éléa',
                titleKey: 'elea_page_name',
                moduleKey: 'Page',
                fileName: fileName,
                blob: mbzBlob,
                status: 'success',
                jsonData: jsonData,
                originalJsonData: originalJsonDataPage,
                previewHtml: previewHtmlPage,
                silent: true
            };
            if (_debugRawJsonPage) notifPage._debugRawJson = _debugRawJsonPage;
            if (_debugHealedJsonPage) notifPage._debugHealedJson = _debugHealedJsonPage;
            const notificationId = addNotification(notifPage);
            document.dispatchEvent(new CustomEvent('generation:complete', {
                detail: { notificationId, blob: mbzBlob, fileName, titleKey: 'elea_page_name', moduleKey: 'Page' }
            }));
        }
    } catch (error) {
        console.error("Erreur lors de la création de la page :", error);

        // Classifier l'erreur
        const errorInfo = classifyError(error);

        // Ajouter notification d'erreur (remplace l'ancienne notification)
        addNotification({
            type: 'mbz',
            title: translations.elea_page_name || 'Page Éléa',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'Page' }
        }));
    }
}

export async function generateHtmlFromBlocks(jsonData, opts = {}) {
    debugLog('moodle-creator', "Début de generateHtmlFromBlocks.");
    const theme = getTheme(jsonData.theme);

    // Niveaux de titre (accessibilité RGAA 9.1) : la hiérarchie doit suivre la
    // structure du contenu et s'emboîter sous le <h1> que Moodle/Éléa posent déjà
    // (nom de l'activité pour une Page, titre de chapitre pour un Livre).
    //   headingBase = niveau des titres de blocs (2 par défaut → h2 sous le h1 Éléa)
    //   +1 / +2     = sous-éléments / sous-sous-éléments (h3, h4… clampés à h6)
    //   heroLevel   = niveau du titre du héros (#01) en contexte standalone
    //                 (preview modale, fichier .html autonome). null = bandeau
    //                 décoratif : Éléa/Moodle fournissent déjà le <h1> de
    //                 l'activité, on évite ainsi le doublon de niveau-1.
    const headingBase = opts.headingBase || 2;
    const heroLevel = (opts.heroLevel === undefined) ? null : opts.heroLevel;
    const headingTag = (depth = 0) => 'h' + Math.min(6, Math.max(1, headingBase + depth));

    // 1. Créer le wrapper document
    const finalHtmlContainer = document.createElement('div');
    finalHtmlContainer.setAttribute('role', 'document');
    finalHtmlContainer.setAttribute('aria-label', jsonData.title || '');
    finalHtmlContainer.setAttribute('lang', currentLang || 'fr');
    finalHtmlContainer.setAttribute('dir', 'ltr');
    finalHtmlContainer.setAttribute('style', theme.config.wrapperStyle);

    // 2. Préparer le contexte partagé pour les renderers du thème
    // Fonction de traduction pour les éléments structurels des thèmes
    const t = (key, fallback) => (translations && translations[key]) || fallback;
    const ctx = { formatTextToHtml, escapeHtmlTags, jsonData, t, headingTag, heroLevel };

    // 3. Marqueur de thème en tête de content (rétro-ingénierie Sucrerie).
    // Le wrapper <div role="document"> n'est PAS sérialisé (innerHTML seulement)
    // et son `style` portait la signature CSS du thème : on l'expose explicitement
    // via un commentaire HTML, ignoré par Moodle/Éléa.
    finalHtmlContainer.appendChild(
        document.createComment(' caramel-page-theme:' + (theme.id || '') + ' ')
    );

    // 4. Rendre chaque bloc via le thème
    (jsonData.blocks || []).forEach((block, index) => {
        debugLog('moodle-creator', `Traitement du bloc ${index + 1}: type = ${block.type}`);
        const render = theme.renderers[block.type];
        if (render) {
            try {
                const element = render(block.data, ctx);
                if (element) {
                    // Marqueur de type pour permettre la rétro-ingénierie côté
                    // Sucrerie (parser HTML → blocs typés). Moodle ignore les
                    // commentaires HTML — non destructif, non visible côté élève.
                    finalHtmlContainer.appendChild(document.createComment(' caramel-block:' + block.type + ' '));
                    // Cas particulier : le hero header écrase data.title par le titre
                    // racine de l'activité (jsonData.title) pour l'affichage. On
                    // préserve le data.title original via un attribut data-* afin
                    // que la rétro-ingénierie puisse le restituer.
                    if (
                        block.type === '#01_hero_header'
                        && block.data
                        && typeof block.data.title === 'string'
                        && block.data.title !== (jsonData.title || '')
                    ) {
                        element.setAttribute('data-block-title', block.data.title);
                    }
                    finalHtmlContainer.appendChild(element);
                }
            } catch (e) {
                console.error(`Erreur lors du rendu du bloc ${block.type} (thème ${theme.id}):`, e);
            }
        } else {
            console.warn(`Renderer non trouvé pour le type de bloc: ${block.type} (thème ${theme.id})`);
        }
    });

    // 4. Ancres de navigation intra-page pour #02_nav_summary
    // Associe les liens href="#xxx" du sommaire aux h2 suivants dans le document
    try {
        const navEl = finalHtmlContainer.querySelector('nav[role="navigation"]');
        if (navEl) {
            const links = Array.from(navEl.querySelectorAll('a[href^="#"]'))
                .map(a => ({ id: (a.getAttribute('href') || '').replace(/^#/, '').trim(), text: (a.textContent || '').trim() }))
                .filter(x => x.id);
            const allH2 = Array.from(finalHtmlContainer.querySelectorAll(headingTag(0)));
            const titledAfter = allH2
                .filter(h2 => (navEl.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
                .map(h2 => ({ h2, container: h2.parentElement }));
            const used = new Set();
            links.forEach(link => {
                if (document.getElementById(link.id)) return;
                let target = titledAfter.find(b => !used.has(b.h2) && ((b.h2.textContent || '').trim() === link.text));
                if (!target) {
                    target = titledAfter.find(b => !used.has(b.h2));
                }
                const anchor = document.createElement('span');
                anchor.id = link.id;
                anchor.setAttribute('aria-hidden', 'true');
                anchor.setAttribute('style', 'display:block; height:0; margin:0; padding:0; scroll-margin-top:96px;');
                if (target && target.container) {
                    target.container.insertBefore(anchor, target.h2);
                    used.add(target.h2);
                } else {
                    finalHtmlContainer.appendChild(anchor);
                }
            });
        }
    } catch (e) {
        console.warn('Nav anchors mapping skipped', e);
    }

    // 5. Robustesse Éléa : injecter les styles critiques du wrapper (font-family, line-height)
    // sur chaque élément enfant direct. Éléa supprime le <div role="document"> englobant,
    // ce qui fait perdre ces styles hérités. En les dupliquant sur chaque section/article/nav,
    // le rendu reste identique même après nettoyage.
    const inheritedStyles = theme.config.inheritedStyles;
    Array.from(finalHtmlContainer.children).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const existing = child.getAttribute('style') || '';
            child.setAttribute('style', inheritedStyles + ' ' + existing);
        }
    });

    // 6. Normaliser le LaTeX double-échappé dans le HTML sérialisé
    let finalHtml = finalHtmlContainer.innerHTML;
    finalHtml = normalizeDoubleEscapedLatex(finalHtml);
    return finalHtml;
}

/**
 * Compose le bloc XML <chapter>...</chapter> pour un livre Moodle.
 * Pour chaque chapitre, appelle generateHtmlFromBlocks() avec le thème global du livre,
 * puis encapsule le HTML résultant dans la structure XML <chapter>.
 *
 * @param {Array<{title, subchapter, blocks}>} chapters - Tableau des chapitres
 * @param {string} theme - Identifiant du thème Page (elea, dsfr, accessible, dynamique)
 * @returns {Promise<string>} Bloc XML prêt à être injecté dans book.xml (placeholder CHAPTERS_XML)
 */
export async function buildChaptersXml(chapters, theme) {
    const timestamp = Math.floor(Date.now() / 1000);
    const xmlParts = [];

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        // Rendu HTML du chapitre via la même fonction que Page (réutilisation atomique)
        const chapterJsonData = {
            title: chapter.title,
            blocks: chapter.blocks || [],
            theme: theme
        };
        debugLog('moodle-creator', `Livre - rendu chapitre ${i + 1}: "${chapter.title}" (${(chapter.blocks || []).length} blocs)`);
        // Chaque chapitre est une page Moodle book autonome. Moodle rend au-dessus
        // du contenu (vérifié sur Éléa, mod_book-chapter) : <h1> (chrome) + <h2>
        // (région) = nom du livre, puis <h3> = titre du chapitre. Notre contenu est
        // enfant de ce <h3> → blocs en h4 (headingBase 4), sous-éléments en h5.
        // Héros décoratif (le titre de chapitre est déjà posé par Moodle).
        const chapterHtml = await generateHtmlFromBlocks(chapterJsonData, { headingBase: 4 });

        // ID séquentiel pour le chapitre (interne au livre)
        const chapterId = 100 + i;
        const pagenum = i + 1;
        const subchapter = chapter.subchapter ? 1 : 0;

        xmlParts.push(`      <chapter id="${chapterId}">
        <pagenum>${pagenum}</pagenum>
        <subchapter>${subchapter}</subchapter>
        <title>${escapeXml(chapter.title || `Chapitre ${pagenum}`)}</title>
        <content>${escapeXml(chapterHtml)}</content>
        <contentformat>1</contentformat>
        <hidden>0</hidden>
        <timemodified>${timestamp}</timemodified>
        <importsrc></importsrc>
      </chapter>`);
    }

    return xmlParts.join('\n');
}

/**
 * Calcule deux jeux de prefixes pour chaque chapitre selon le mode `numbering` Moodle book :
 *   0 = aucun prefix nulle part
 *   1 = numérotation décimale "1.", "1.1." (titre h2 + table des matières)
 *   2 = puces "•" devant chaque entrée de la table des matières (pas dans le titre h2)
 *   3 = tirets "—" devant chaque entrée de la table des matières (pas dans le titre h2)
 *
 * Retourne `{ titlePrefixes, tocPrefixes }` — deux tableaux alignés sur l'index des chapitres.
 * Le titre h2 du chapitre n'affiche un préfixe qu'en mode décimal, conformément au book Moodle.
 *
 * @param {Array<{subchapter}>} chapters
 * @param {number} numbering
 * @returns {{titlePrefixes: string[], tocPrefixes: string[]}}
 */
function computeChapterPrefixes(chapters, numbering) {
    const titlePrefixes = [];
    const tocPrefixes = [];
    let chCount = 0;
    let subCount = 0;
    for (const ch of chapters) {
        if (ch.subchapter) {
            subCount++;
        } else {
            chCount++;
            subCount = 0;
        }
        let titlePrefix = '';
        let tocPrefix = '';
        switch (numbering) {
            case 1: // Numérotation décimale : visible partout
                titlePrefix = ch.subchapter ? `${chCount}.${subCount}. ` : `${chCount}. `;
                tocPrefix = titlePrefix;
                break;
            case 2: // Puces : marqueur visible dans la TOC pour TOUS les chapitres
                tocPrefix = '• ';
                break;
            case 3: // Tirets : marqueur visible dans la TOC pour TOUS les chapitres
                tocPrefix = '— ';
                break;
            default: // 0 : aucun prefix
                break;
        }
        titlePrefixes.push(titlePrefix);
        tocPrefixes.push(tocPrefix);
    }
    return { titlePrefixes, tocPrefixes };
}

/**
 * Compose un HTML de prévisualisation pour un Livre multi-chapitres.
 * Produit un simulateur fidèle à l'affichage Moodle/Éléa :
 *  - Titre du livre + intro en haut
 *  - Un seul chapitre affiché à la fois (le 1er par défaut)
 *  - Table des matières à droite avec numérotation et indentation des sous-chapitres
 *  - Navigation CSS pure (radio buttons cachés + labels) — fonctionne sans JS
 *
 * @param {Object} jsonData - JSON complet du livre (avec title, intro, chapters, theme, numbering)
 * @returns {Promise<string>} HTML autonome pour la preview
 */
export async function buildLivrePreviewHtml(jsonData) {
    const chapters = jsonData.chapters || [];
    const theme = jsonData.theme || 'elea';
    const numbering = jsonData.numbering ?? 1;
    // Note : Éléa n'expose que la table des matières comme mode de navigation
    // (pas de boutons flèches ni liens texte). Le navstyle est forcé à 0 côté
    // export Moodle (placeholder NAVSTYLE) et la preview ne rend que la TOC.
    const tocLabel = (translations && translations.livre_toc_label) || 'Table des matières';

    // Identifiant unique pour ce simulateur (évite collisions si plusieurs previews ouvertes)
    const simId = 'livre-sim-' + Math.random().toString(36).substring(2, 10);

    // Calcul des prefixes selon le mode numbering (deux jeux : titre h2 et TOC)
    const { titlePrefixes, tocPrefixes } = computeChapterPrefixes(chapters, numbering);

    // Rendu HTML de chaque chapitre (réutilisation de generateHtmlFromBlocks)
    const chapterContents = [];
    for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        // Preview fidèle au book Moodle : titre du livre = <h1>, titre de chapitre
        // = <h2> (livre-sim__chapter-title), blocs du chapitre en h3 (headingBase
        // 3). L'imbrication des sous-chapitres est navigationnelle (TOC indentée +
        // numérotation), pas un saut de niveau de titre.
        const html = await generateHtmlFromBlocks({
            title: ch.title,
            blocks: ch.blocks || [],
            theme: theme
        }, { headingBase: 3 });
        chapterContents.push(html);
    }

    // Styles inline par élément : pas de bloc <style> (il serait supprimé par la
    // sanitisation RICH_HTML au point d'injection, cf. livre.js) ni de radios CSS.
    // La bascule entre chapitres est pilotée en JS par livre.js (contexte de confiance).
    const S = {
        wrapper: "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif; color:#1f2937; background:#fff; text-align:left;",
        layout: 'display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:2rem; padding:2rem 2.5rem 2.5rem; max-width:1100px; margin:0 auto; text-align:left;',
        main: 'min-width:0; text-align:left;',
        title: 'font-size:1.85rem; font-weight:700; color:#1f2937; margin:0 0 0.75rem 0; line-height:1.25; text-align:left;',
        intro: 'color:#6b7280; font-size:0.95rem; line-height:1.55; margin:0 0 1.25rem 0; padding-bottom:1.25rem; border-bottom:1px solid #e5e7eb; text-align:left;',
        chapTitle: 'font-size:1.5rem; font-weight:700; color:#1e3a8a; margin:1.25rem 0 1rem; text-align:left;',
        chapBody: 'color:#1f2937; line-height:1.65; text-align:left;',
        toc: 'background:#fafaf7; border:1px solid #e5e7eb; border-radius:10px; padding:1.25rem 1.4rem; font-size:0.88rem; align-self:start; position:sticky; top:2rem; max-height:calc(100vh - 4rem); overflow-y:auto; box-shadow:0 1px 3px rgba(0,0,0,0.04); text-align:left;',
        tocTitle: 'font-size:0.75rem; font-weight:700; color:#4b5563; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 1rem 0; padding-bottom:0.6rem; border-bottom:2px solid #e5e7eb; text-align:left;',
        ol: 'list-style:none; padding:0; margin:0; text-align:left;',
        sublist: 'list-style:none; padding-left:1.1rem; margin:0.25rem 0 0.35rem 0.4rem; border-left:2px solid #c7d2fe;',
        li: 'margin:0.2rem 0; text-align:left;',
        link: 'display:block; cursor:pointer; color:#4338ca; font-weight:500; padding:0.4rem 0.6rem; border-radius:5px; border-left:3px solid transparent; line-height:1.4; text-align:left;',
        linkSub: 'display:block; cursor:pointer; color:#6366f1; font-weight:500; font-size:0.9em; padding:0.4rem 0.6rem 0.4rem 0.5rem; border-radius:5px; border-left:3px solid transparent; line-height:1.4; text-align:left;'
    };

    // Sections de chapitres : le 1er visible, les autres masqués (display inline).
    // livre.js bascule l'affichage au clic dans la table des matières.
    const chapterSections = chapters.map((ch, i) => `
        <article class="livre-sim__chapter" data-ch="${i}" style="${i === 0 ? '' : 'display:none; '}text-align:left;">
            <h2 class="livre-sim__chapter-title" style="${S.chapTitle}">${escapeHtmlTags(titlePrefixes[i] + (ch.title || `Chapitre ${i + 1}`))}</h2>
            <div class="livre-sim__chapter-body" style="${S.chapBody}">${chapterContents[i]}</div>
        </article>`).join('');

    // Table des matières (HTML valide : <ol> imbriqué dans le <li> parent).
    // On regroupe d'abord les sous-chapitres consécutifs sous leur chapitre parent.
    const tocTree = [];
    chapters.forEach((ch, i) => {
        const labelText = escapeHtmlTags(tocPrefixes[i] + (ch.title || `Chapitre ${i + 1}`));
        const node = { i, labelText, subchapter: !!ch.subchapter, children: [] };
        if (ch.subchapter && tocTree.length > 0) {
            // Rattacher au dernier chapitre normal (mère)
            tocTree[tocTree.length - 1].children.push(node);
        } else {
            tocTree.push(node);
        }
    });

    const renderTocNode = (node) => {
        const childrenHtml = node.children.length
            ? `<ol class="livre-sim__toc-sublist" style="${S.sublist}">${node.children.map(renderTocNode).join('')}</ol>`
            : '';
        const cls = node.subchapter ? 'livre-sim__toc-item livre-sim__toc-item--sub' : 'livre-sim__toc-item';
        // Lien cliquable = <span> (les <button>/<label> seraient retirés par RICH_HTML) ;
        // livre.js lui ajoute role=button, tabindex et les handlers après injection.
        return `<li class="${cls}" style="${S.li}"><span class="livre-sim__toc-link" data-ch-target="${node.i}" style="${node.subchapter ? S.linkSub : S.link}">${node.labelText}</span>${childrenHtml}</li>`;
    };
    const tocItems = tocTree.map(renderTocNode);

    // Pas de bloc <style> (supprimé par RICH_HTML) : styles inline + nav JS (livre.js).
    return `<div class="livre-sim" id="${simId}" style="${S.wrapper}">
    <div class="livre-sim__layout" style="${S.layout}">
        <div class="livre-sim__main" style="${S.main}">
            <h1 class="livre-sim__title" style="${S.title}">${escapeHtmlTags(jsonData.title || '')}</h1>
            ${jsonData.intro ? `<div class="livre-sim__intro" style="${S.intro}">${jsonData.intro}</div>` : ''}
            ${chapterSections}
        </div>
        <aside class="livre-sim__toc" style="${S.toc}" aria-label="${escapeHtmlTags(tocLabel)}">
            <h3 class="livre-sim__toc-title" style="${S.tocTitle}">${escapeHtmlTags(tocLabel)}</h3>
            <ol class="livre-sim__toc-root" style="${S.ol}">${tocItems.join('')}</ol>
        </aside>
    </div>
</div>`;
}

/**
 * Gère la création d'une activité "Livre" Moodle (module book) au format .mbz.
 * Un livre est une activité Page multi-chapitres : chaque chapitre est rendu
 * via generateHtmlFromBlocks() avec le thème global du livre.
 *
 * @param {string} jsonInput - La chaîne JSON brute contenant titre, intro, chapters[]
 * @param {string} exportType - 'mbz' (seul format supporté pour Livre)
 */
export async function handleLivreCreation(jsonInput, exportType = 'mbz') {
    try {
        let jsonData = JSON.parse(cleanJsonInput(jsonInput));
        const _debugRawJsonLivre = DEBUG ? structuredClone(jsonData) : null;
        jsonData = healStructureForActivity(jsonData, 'Livre');
        // Pipeline LaTeX : réparation des commandes cassées + auto-wrap + conversion délimiteurs
        jsonData = healLatexForMoodle(jsonData);
        const _debugHealedJsonLivre = DEBUG ? structuredClone(jsonData) : null;
        const originalJsonDataLivre = structuredClone(jsonData);

        if (!jsonData.title || !Array.isArray(jsonData.chapters) || jsonData.chapters.length === 0) {
            console.error("Erreur de validation : Le JSON Livre doit contenir un 'title' et un tableau 'chapters' non vide.");
            throw new Error("Le JSON Livre doit contenir un 'title' et un tableau 'chapters' non vide.");
        }

        const theme = jsonData.theme || 'elea';

        // Composition du bloc XML <chapter>...</chapter> pour le book.xml
        const chaptersXml = await buildChaptersXml(jsonData.chapters, theme);

        // Composition du HTML de prévisualisation (simulateur fidèle à Éléa avec TOC)
        const previewHtml = await buildLivrePreviewHtml(jsonData);

        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');

        const activityTitle = jsonData.title;
        const timestamp = Math.floor(Date.now() / 1000);
        const courseId = 1000 + Math.floor(Math.random() * 9000);
        const moduleId = 10000 + Math.floor(Math.random() * 90000);
        const sectionId = 1000 + Math.floor(Math.random() * 9000);
        const activityId = 100 + Math.floor(Math.random() * 900);
        const courseContextId = 10000 + Math.floor(Math.random() * 90000);
        const activityContextId = courseContextId + 2;

        const data = {
            'ACTIVITY_TITLE': escapeXml(activityTitle),
            'BOOK_NAME': escapeXml(activityTitle),
            'INTRO': escapeXml(formatTextToHtml(jsonData.intro || '')),
            'NUMBERING': String(jsonData.numbering ?? 1),
            // Toujours 0 (table des matières) : Éléa n'expose pas les autres
            // modes de navigation à l'utilisateur final.
            'NAVSTYLE': '0',
            // Toujours 0 : Caramel laisse Moodle gérer l'affichage automatique du titre
            // de chapitre. L'option n'est plus exposée dans l'éditeur.
            'CUSTOMTITLES': '0',
            'CHAPTERS_XML': chaptersXml,
            'COURSE_FULLNAME': escapeXml(activityTitle),
            'COURSE_SHORTNAME': `livre-${Math.random().toString(36).substring(2, 15)}`,
            'COURSE_ID': courseId,
            'MODULE_ID': moduleId,
            'SECTION_ID': sectionId,
            'ACTIVITY_ID': activityId,
            'COURSE_CONTEXTID': courseContextId,
            'ACTIVITY_CONTEXTID': activityContextId,
            'TIMESTAMP': timestamp,
            'BACKUP_DATE': timestamp
        };

        // Génération des fichiers via le processeur Livre
        let files = MoodleProcessors.getActivityFiles('Livre', data);
        files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';

        const gzData = await createMbz(files);

        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `livre-caramel-${dateString}-${lang}.mbz`;
        const mbzBlob = new Blob([gzData], { type: 'application/octet-stream' });

        const notifLivre = {
            type: 'mbz',
            title: translations.elea_livre_name || 'Livre Éléa',
            titleKey: 'elea_livre_name',
            moduleKey: 'Livre',
            fileName: fileName,
            blob: mbzBlob,
            status: 'success',
            jsonData: jsonData,
            originalJsonData: originalJsonDataLivre,
            previewHtml: previewHtml,
            silent: true
        };
        if (_debugRawJsonLivre) notifLivre._debugRawJson = _debugRawJsonLivre;
        if (_debugHealedJsonLivre) notifLivre._debugHealedJson = _debugHealedJsonLivre;
        const notificationId = addNotification(notifLivre);
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: mbzBlob, fileName, titleKey: 'elea_livre_name', moduleKey: 'Livre' }
        }));
    } catch (error) {
        console.error("Erreur lors de la création du livre :", error);

        const errorInfo = classifyError(error);

        addNotification({
            type: 'mbz',
            title: translations.elea_livre_name || 'Livre Éléa',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'Livre' }
        }));
    }
}

/**
 * Gère la création d'une activité "Qui veut gagner des millions" au format .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant le titre et les questions.
 */
export async function handleMillionnaireCreation(jsonInput) {
    try {
        // S'assurer que les bibliothèques Moodle sont chargées avant de vérifier leur disponibilité
        await loadMoodleLibs();
        if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
            throw new Error(translations.millionnaire_error_compression_libs);
        }
        let jsonData = JSON.parse(cleanJsonInput(jsonInput));
        const _debugRawJsonMill = DEBUG ? structuredClone(jsonData) : null;
        jsonData = healStructureForActivity(jsonData, 'Millionnaire');
        const _debugHealedJsonMill = DEBUG ? structuredClone(jsonData) : null;
        const originalJsonDataMill = structuredClone(jsonData);
        if (!jsonData.title || !Array.isArray(jsonData.questions) || jsonData.questions.length !== 6 || jsonData.questions.some(q => !q.question || !q.goodanswer || !Array.isArray(q.badanswer) || q.badanswer.length !== 3)) {
            throw new Error(translations.millionnaire_error_invalid_json);
        }
        const activityTitle = jsonData.title;
        const questions = jsonData.questions;
        // Utiliser le nouveau module moodle-processors (ZERO appels réseau)
        const timestamp = Math.floor(Date.now() / 1000);
        const courseId = 1000 + Math.floor(Math.random() * 9000);
        const moduleId = 10000 + Math.floor(Math.random() * 90000);
        const sectionId = 1000 + Math.floor(Math.random() * 9000);
        const activityId = 100 + Math.floor(Math.random() * 900);
        const courseContextId = 10000 + Math.floor(Math.random() * 90000);
        const activityContextId = courseContextId + 2;
        const categoryId = 100 + Math.floor(Math.random() * 900);
        const courseItemId = 1000 + Math.floor(Math.random() * 9000);
        const gradeItemId = 1000 + Math.floor(Math.random() * 9000);

        const data = {
            'ACTIVITY_TITLE': escapeXml(activityTitle),
            'ACTIVITY_INTRO_HTML': `<p>${translations.millionnaire_activity_intro}</p>`,
            'QUESTIONS_JSON': escapeXml(JSON.stringify(questions)),
            'COURSE_FULLNAME': escapeXml(activityTitle),
            'COURSE_SHORTNAME': `parcours-${Math.random().toString(36).substring(2, 15)}`,
            'COURSE_ID': courseId,
            'MODULE_ID': moduleId,
            'SECTION_ID': sectionId,
            'ACTIVITY_ID': activityId,
            'COURSE_CONTEXTID': courseContextId,
            'ACTIVITY_CONTEXTID': activityContextId,
            'CATEGORY_ID': categoryId,
            'COURSE_ITEM_ID': courseItemId,
            'GRADE_ITEM_ID': gradeItemId,
            'TIMESTAMP': timestamp,
            'BACKUP_DATE': timestamp
        };

        let files = MoodleProcessors.getActivityFiles('Millionnaire', data);
        // Ajout automatique du fichier moodle_backup.log minimal
        files['moodle_backup.log'] = translations.millionnaire_backup_log || "Sauvegarde créée automatiquement par Caramel";
        const gzData = await createMbz(files);
        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `millionnaire-caramel-${dateString}-${lang}.mbz`;
        const mbzBlob = new Blob([gzData], { type: 'application/octet-stream' });
        // Ajouter à la liste des notifications (silent = pas de toast, la modale de résultat s'en charge)
        const notifMill = {
            type: 'mbz',
            title: translations.elea_millionnaire_name || 'Millionnaire',
            titleKey: 'elea_millionnaire_name',
            moduleKey: 'Millionnaire',
            fileName: fileName,
            blob: mbzBlob,
            status: 'success',
            jsonData: jsonData,
            originalJsonData: originalJsonDataMill,
            silent: true
        };
        if (_debugRawJsonMill) notifMill._debugRawJson = _debugRawJsonMill;
        if (_debugHealedJsonMill) notifMill._debugHealedJson = _debugHealedJsonMill;
        const notificationId = addNotification(notifMill);
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: mbzBlob, fileName, titleKey: 'elea_millionnaire_name', moduleKey: 'Millionnaire' }
        }));
    } catch (error) {
        console.error(translations.millionnaire_error_creation_mbz, error);

        // Classifier l'erreur
        const errorInfo = classifyError(error);

        // Ajouter notification d'erreur (remplace l'ancienne notification)
        addNotification({
            type: 'mbz',
            title: translations.elea_millionnaire_name || 'Millionnaire',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'Millionnaire' }
        }));
    }
}

/**
 * Gère la création d'une activité "Appariement" au format .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant le titre et les paires question/réponse.
 */
export async function handleAppariementCreation(jsonInput) {
    try {
        // S'assurer que les bibliothèques Moodle sont chargées avant de vérifier leur disponibilité
        await loadMoodleLibs();
        if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
            throw new Error(translations.millionnaire_error_compression_libs || "Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées.");
        }
        let jsonData = JSON.parse(cleanJsonInput(jsonInput));
        const _debugRawJsonApp = DEBUG ? structuredClone(jsonData) : null;
        jsonData = healStructureForActivity(jsonData, 'Appariement');
        // Pipeline LaTeX : réparation des commandes cassées + auto-wrap + conversion délimiteurs
        jsonData = healLatexForMoodle(jsonData);
        const _debugHealedJsonApp = DEBUG ? structuredClone(jsonData) : null;
        const originalJsonDataApp = structuredClone(jsonData);
        if (!jsonData.title || !Array.isArray(jsonData.pairs) || jsonData.pairs.length === 0 || jsonData.pairs.some(p => !p.question || !p.answer)) {
            throw new Error(translations.appariement_error_invalid_json || "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'pairs' où chaque paire a une 'question' et une 'answer'.");
        }

        const activityTitle = jsonData.title;
        const pairs = jsonData.pairs;
        const questions = {};
        const responses = {};
        pairs.forEach((pair, index) => {
            let q = String(pair.question ?? '').trim();
            let a = String(pair.answer ?? '').trim();

            // Vérifier si le contenu contient déjà des balises HTML <p>
            // Si non, envelopper dans des balises <p>
            if (!q.match(/^\s*<p[\s>]/i)) {
                q = `<p dir="ltr" style="text-align: left;">${q}</p>`;
            }
            if (!a.match(/^\s*<p[\s>]/i)) {
                a = `<p dir="ltr" style="text-align: left;">${a}</p>`;
            }

            // Ne PAS échapper les balises HTML - elles doivent rester valides
            // Le LaTeX (ex: \( \sqrt{2} \)) sera automatiquement échappé par JSON.stringify
            questions[index + 1] = q;
            responses[index + 1] = a;
        });

        // Créer le JSON et l'échapper pour l'insertion dans le XML
        const associations = escapeXml(JSON.stringify({ questions, responses }));

        // --- Génération des IDs et Timestamps ---
        const timestamp = Math.floor(Date.now() / 1000);
        const courseId = 1000 + Math.floor(Math.random() * 9000);
        const moduleId = 10000 + Math.floor(Math.random() * 90000);
        const sectionId = 1000 + Math.floor(Math.random() * 9000);
        const activityId = 100 + Math.floor(Math.random() * 900);
        const courseContextId = 10000 + Math.floor(Math.random() * 90000);
        const activityContextId = courseContextId + 2; // Assurer un ID de contexte d'activité unique
        const gradeItemId = 1000 + Math.floor(Math.random() * 9000);
        const categoryId = 1000 + Math.floor(Math.random() * 9000);
        const courseItemId = 1000 + Math.floor(Math.random() * 9000);

        // Préparer l'intro en vérifiant si elle contient déjà du HTML
        let introHtml = jsonData.intro ? String(jsonData.intro).trim() : (translations.appariement_activity_intro || "Trouvez les paires correspondantes.");
        if (!introHtml.match(/^\s*<p[\s>]/i)) {
            introHtml = `<p dir="ltr" style="text-align: left;">${introHtml}</p>`;
        }

        const data = {
            'ACTIVITY_TITLE': escapeXml(activityTitle),
            'ACTIVITY_INTRO_HTML': escapeXml(introHtml),
            'ASSOCIATIONS_JSON': associations,
            'COURSE_FULLNAME': escapeXml(activityTitle),
            'COURSE_SHORTNAME': `parcours-${Math.random().toString(36).substring(2, 15)}`,
            'COURSE_ID': courseId,
            'MODULE_ID': moduleId,
            'SECTION_ID': sectionId,
            'ACTIVITY_ID': activityId,
            'COURSE_CONTEXTID': courseContextId,
            'ACTIVITY_CONTEXTID': activityContextId,
            'GRADE_ITEM_ID': gradeItemId,
            'CATEGORY_ID': categoryId,
            'COURSE_ITEM_ID': categoryId, // L'iteminstance doit être l'ID de la catégorie
            'TIMESTAMP': timestamp,
            'BACKUP_DATE': timestamp
        };

        // Utiliser le nouveau module moodle-processors (ZERO appels réseau)
        let files = MoodleProcessors.getActivityFiles('Appariement', data);

        // Met à jour le nom de sauvegarde dans moodle_backup.xml pour éviter toute trace du modèle
        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `appariement-caramel-${dateString}-${lang}.mbz`;
        if (files['moodle_backup.xml']) {
            const backupName = jsonData.title ? `${jsonData.title}.mbz` : fileName;
            const safeBackupName = escapeXml(backupName);
            files['moodle_backup.xml'] = files['moodle_backup.xml'].replace(/(<name>)[\s\S]*?(<\/name>)/, `$1${safeBackupName}$2`);
        }

        files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';
        const gzData = await createMbz(files);
        const mbzBlob = new Blob([gzData], { type: 'application/gzip' });

        // Ajouter à la liste des notifications (silent = pas de toast, la modale de résultat s'en charge)
        const notifApp = {
            type: 'mbz',
            title: translations.elea_appariement_name || 'Appariement',
            titleKey: 'elea_appariement_name',
            moduleKey: 'Appariement',
            fileName: fileName,
            blob: mbzBlob,
            status: 'success',
            jsonData: jsonData,
            originalJsonData: originalJsonDataApp,
            silent: true
        };
        if (_debugRawJsonApp) notifApp._debugRawJson = _debugRawJsonApp;
        if (_debugHealedJsonApp) notifApp._debugHealedJson = _debugHealedJsonApp;
        const notificationId = addNotification(notifApp);
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: mbzBlob, fileName, titleKey: 'elea_appariement_name', moduleKey: 'Appariement' }
        }));
    } catch (error) {
        console.error(translations.appariement_error_creation_mbz || "Erreur lors de la création du MBZ pour l'appariement:", error);

        // Classifier l'erreur
        const errorInfo = classifyError(error);

        // Ajouter notification d'erreur (remplace l'ancienne notification)
        addNotification({
            type: 'mbz',
            title: translations.elea_appariement_name || 'Appariement',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'Appariement' }
        }));
    }
}

/**
 * Gère la création d'une activité "QCM" (SimpleQuiz) au format .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant le titre et les questions à choix multiples.
 */
export async function handleQCMCreation(jsonInput) {
    try {
        // S'assurer que les bibliothèques Moodle sont chargées avant de vérifier leur disponibilité
        await loadMoodleLibs();
        if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
            throw new Error(translations.millionnaire_error_compression_libs || "Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées.");
        }
        let jsonData = JSON.parse(jsonInput);
        const _debugRawJsonQCM = DEBUG ? structuredClone(jsonData) : null;
        jsonData = healStructureForActivity(jsonData, 'QCM');
        // Pipeline LaTeX : réparation des commandes cassées + auto-wrap + conversion délimiteurs
        jsonData = healLatexForMoodle(jsonData);
        const _debugHealedJsonQCM = DEBUG ? structuredClone(jsonData) : null;
        if (!jsonData.title || !Array.isArray(jsonData.questions) || jsonData.questions.length === 0 || jsonData.questions.some(q => !q.text || !Array.isArray(q.answers) || q.answers.length === 0)) {
            throw new Error(translations.qcm_error_invalid_json || "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' avec au moins une question et des réponses.");
        }

        // Conserver l'original (Markdown) pour l'édition
        const originalJsonData = structuredClone(jsonData);

        // Simple Markdown formatter to HTML (avec protection LaTeX)
        const formatMarkdown = (text) => markdownToHtml(text);

        // Ajout des balises <p> au contenu textuel si elles ne sont pas déjà présentes
        // ET conversion du Markdown en HTML
        jsonData.questions.forEach(question => {
            if (question.text) {
                let text = formatMarkdown(question.text);
                if (!text.match(/^\s*<p[\s>]/i)) {
                    text = `<p>${text}</p>`;
                }
                question.text = text;
            }
            question.answers.forEach(answer => {
                if (answer.text) {
                    let text = formatMarkdown(answer.text);
                    if (!text.match(/^\s*<p[\s>]/i)) {
                        text = `<p>${text}</p>`;
                    }
                    answer.text = text;
                }
            });
        });

        const activityTitle = jsonData.title;

        // Échapper le JSON pour l'insertion dans le XML (pas les balises HTML à l'intérieur)
        const questionsData = escapeXml(JSON.stringify(jsonData.questions));

        // --- Génération des IDs et Timestamps ---
        const timestamp = Math.floor(Date.now() / 1000);
        const courseId = 1000 + Math.floor(Math.random() * 9000);
        const moduleId = 10000 + Math.floor(Math.random() * 90000);
        const sectionId = 1000 + Math.floor(Math.random() * 9000);
        const activityId = 100 + Math.floor(Math.random() * 900);
        const courseContextId = 10000 + Math.floor(Math.random() * 90000);
        const activityContextId = courseContextId + 2;
        const gradeItemId = 1000 + Math.floor(Math.random() * 9000);
        const categoryId = 1000 + Math.floor(Math.random() * 9000);

        const data = {
            'ACTIVITY_TITLE': escapeXml(activityTitle),
            'ACTIVITY_INTRO_HTML': escapeXml(`<p dir="ltr" style="text-align: left;">${translations.qcm_activity_intro || "Répondez aux questions suivantes."}</p>`),
            'QUESTIONS_JSON': questionsData, // Placeholder pour le JSON des questions
            'COURSE_FULLNAME': escapeXml(activityTitle),
            'COURSE_SHORTNAME': `parcours-qcm-${Math.random().toString(36).substring(2, 15)}`,
            'COURSE_ID': courseId,
            'MODULE_ID': moduleId,
            'SECTION_ID': sectionId,
            'ACTIVITY_ID': activityId,
            'COURSE_CONTEXTID': courseContextId,
            'ACTIVITY_CONTEXTID': activityContextId,
            'GRADE_ITEM_ID': gradeItemId,
            'CATEGORY_ID': categoryId,
            'COURSE_ITEM_ID': categoryId,
            'TIMESTAMP': timestamp,
            'BACKUP_DATE': timestamp
        };

        // Utiliser le nouveau module moodle-processors (ZERO appels réseau)
        let files = MoodleProcessors.getActivityFiles('QCM', data);

        // Mettre le nom de sauvegarde sur le titre JSON si présent
        if (files['moodle_backup.xml']) {
            const backupTitle = `${activityTitle}.mbz`;
            files['moodle_backup.xml'] = files['moodle_backup.xml'].replace(/(<name>)[\s\S]*?(<\/name>)/, `$1${escapeXml(backupTitle)}$2`);
        }

        files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';
        const gzData = await createMbz(files);
        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `qcm-caramel-${dateString}-${lang}.mbz`;
        const mbzBlob = new Blob([gzData], { type: 'application/octet-stream' });

        // Ajouter à la liste des notifications (silent = pas de toast, la modale de résultat s'en charge)
        const notifQCM = {
            type: 'mbz',
            title: translations.elea_qcm_name || 'QCM',
            titleKey: 'elea_qcm_name',
            moduleKey: 'QCM',
            fileName: fileName,
            blob: mbzBlob,
            status: 'success',
            jsonData: jsonData,
            originalJsonData: originalJsonData,
            silent: true
        };
        if (_debugRawJsonQCM) notifQCM._debugRawJson = _debugRawJsonQCM;
        if (_debugHealedJsonQCM) notifQCM._debugHealedJson = _debugHealedJsonQCM;
        const notificationId = addNotification(notifQCM);
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: mbzBlob, fileName, titleKey: 'elea_qcm_name', moduleKey: 'QCM' }
        }));
    } catch (error) {
        console.error(translations.qcm_error_creation_mbz || "Erreur lors de la création du MBZ pour le QCM:", error);

        // Classifier l'erreur
        const errorInfo = classifyError(error);

        // Ajouter notification d'erreur (remplace l'ancienne notification)
        addNotification({
            type: 'mbz',
            title: translations.elea_qcm_name || 'QCM',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'QCM' }
        }));
    }
}

/**
 * Gère la création d'un fichier d'import de glossaire Moodle au format XML.
 * @param {string} jsonInput - La chaîne JSON brute contenant le nom et les entrées du glossaire.
 */
export function handleGlossaireXmlCreation(jsonInput) {
    try {
        let jsonData = JSON.parse(jsonInput);
        // Pipeline LaTeX : réparation des commandes cassées + auto-wrap + conversion délimiteurs
        jsonData = healLatexForMoodle(jsonData);
        const originalJsonDataGloss = structuredClone(jsonData);
        if (!jsonData.name || !Array.isArray(jsonData.entries)) {
            throw new Error(translations.glossaire_error_invalid_json || "Le JSON doit contenir un nom ('name') et un tableau d'entrées ('entries').");
        }

        let entriesXml = '';
        for (const entry of jsonData.entries) {
            if (!entry.concept || !entry.definition) {
                console.warn("Entrée de glossaire ignorée (concept ou définition manquant) :", entry);
                continue;
            }

            let aliasesXml = '';
            if (Array.isArray(entry.aliases) && entry.aliases.length > 0) {
                aliasesXml = '<ALIASES>' + entry.aliases.map(alias => `<ALIAS><NAME>${escapeXml(alias)}</NAME></ALIAS>`).join('') + '</ALIASES>';
            }

            entriesXml += `
      <ENTRY>
        <CONCEPT>${escapeXml(entry.concept)}</CONCEPT>
        <DEFINITION>${escapeXml(formatTextToHtml(entry.definition))}</DEFINITION>
        <FORMAT>1</FORMAT>
        <DEFINITIONTRUST>0</DEFINITIONTRUST>
        <USEDYNALINK>1</USEDYNALINK>
        <CASESENSITIVE>0</CASESENSITIVE>
        <FULLMATCH>0</FULLMATCH>
        <TEACHERENTRY>1</TEACHERENTRY>
        ${aliasesXml}
      </ENTRY>`;
        }

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<GLOSSARY>
  <INFO>
    <NAME>${escapeXml(jsonData.name)}</NAME>
    <INTRO><p dir="ltr" style="text-align: left;"></p></INTRO>
    <INTROFORMAT>1</INTROFORMAT>
    <ALLOWDUPLICATEDENTRIES>0</ALLOWDUPLICATEDENTRIES>
    <DISPLAYFORMAT>dictionary</DISPLAYFORMAT>
    <SHOWSPECIAL>1</SHOWSPECIAL>
    <SHOWALPHABET>1</SHOWALPHABET>
    <SHOWALL>1</SHOWALL>
    <ALLOWCOMMENTS>0</ALLOWCOMMENTS>
    <USEDYNALINK>0</USEDYNALINK>
    <DEFAULTAPPROVAL>0</DEFAULTAPPROVAL>
    <GLOBALGLOSSARY>0</GLOBALGLOSSARY>
    <ENTBYPAGE>10</ENTBYPAGE>
    <ENTRIES>${entriesXml}
    </ENTRIES>
  </INFO>
</GLOSSARY>`;

        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `glossaire-caramel-${dateString}-${lang}.xml`;
        const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
        // Ajouter à la liste des notifications (silent pour la modale de résultat)
        const notificationId = addNotification({
            type: 'xml',
            title: translations.elea_glossaire_xml_name || 'Glossaire (XML)',
            titleKey: 'elea_glossaire_xml_name',
            moduleKey: 'glossaireXml',
            fileName: fileName,
            blob: xmlBlob,
            jsonData: jsonData,
            originalJsonData: originalJsonDataGloss,
            status: 'success',
            silent: true
        });
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: xmlBlob, fileName, titleKey: 'elea_glossaire_xml_name', moduleKey: 'glossaireXml' }
        }));

    } catch (error) {
        console.error(translations.glossaire_error_creation || "Erreur lors de la création du XML du glossaire:", error);

        // Classifier l'erreur
        const errorInfo = classifyError(error);

        // Ajouter notification d'erreur (remplace l'ancienne notification)
        addNotification({
            type: 'xml',
            title: translations.elea_glossaire_xml_name || 'Glossaire (XML)',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'glossaireXml' }
        }));
    }
}

/**
 * Gère la création d'un fichier d'import Test (banque de questions) au format XML Moodle.
 * Applique le pipeline de healing LaTeX avant la génération XML, comme pour les autres activités Moodle.
 * @param {string} jsonInput - La chaîne JSON brute contenant la banque de questions.
 */
export function handleTestXmlCreation(jsonInput) {
    try {
        let jsonData = JSON.parse(cleanJsonInput(jsonInput));
        const _debugRawJson = DEBUG ? structuredClone(jsonData) : null;
        // Pipeline LaTeX : réparation des commandes cassées + auto-wrap + conversion délimiteurs
        jsonData = healLatexForMoodle(jsonData);
        const _debugHealedJson = DEBUG ? structuredClone(jsonData) : null;
        const originalJsonData = structuredClone(jsonData);

        const xmlContent = generateMoodleXml(jsonData);

        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `banque-de-questions-caramel-${dateString}-${lang}.xml`;
        const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });

        // Ajouter à la liste des notifications (silent pour la modale de résultat)
        const notifTest = {
            type: 'xml',
            title: translations.elea_test_xml_name || 'Banque de questions (XML)',
            titleKey: 'elea_test_xml_name',
            moduleKey: 'test_elea',
            fileName: fileName,
            blob: xmlBlob,
            status: 'success',
            jsonData: jsonData,
            originalJsonData: originalJsonData,
            silent: true
        };
        if (_debugRawJson) notifTest._debugRawJson = _debugRawJson;
        if (_debugHealedJson) notifTest._debugHealedJson = _debugHealedJson;
        const notificationId = addNotification(notifTest);
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: xmlBlob, fileName, titleKey: 'elea_test_xml_name', moduleKey: 'test_elea' }
        }));

    } catch (error) {
        console.error("Erreur lors de la création du XML de la banque de questions:", error);

        const errorInfo = classifyError(error);

        addNotification({
            type: 'xml',
            title: translations.elea_test_xml_name || 'Banque de questions (XML)',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'test_elea' }
        }));
    }
}

/**
 * Gère la création d'une activité "Devoir" (assign avec grille d'évaluation) au format .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant le titre, la description et les critères.
 */
export async function handleDevoirCreation(jsonInput) {
    try {
        await loadMoodleLibs();
        if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
            throw new Error(translations.millionnaire_error_compression_libs || "Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées.");
        }

        let jsonData = JSON.parse(cleanJsonInput(jsonInput));
        const _debugRawJson = DEBUG ? structuredClone(jsonData) : null;
        jsonData = healStructureForActivity(jsonData, 'Devoir');
        const _debugHealedJson = DEBUG ? structuredClone(jsonData) : null;
        const originalJsonDataDevoir = structuredClone(jsonData);

        // Valider la structure
        if (!jsonData.title || !Array.isArray(jsonData.criteria) || jsonData.criteria.length === 0 ||
            jsonData.criteria.some(c => !c.description || !Array.isArray(c.levels) || c.levels.length === 0)) {
            throw new Error(translations.devoir_error_invalid_json || "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'criteria'.");
        }

        const activityTitle = jsonData.title;

        // --- Génération des IDs et Timestamps ---
        const timestamp = Math.floor(Date.now() / 1000);
        const courseId = 1000 + Math.floor(Math.random() * 9000);
        const moduleId = 10000 + Math.floor(Math.random() * 90000);
        const sectionId = 1000 + Math.floor(Math.random() * 9000);
        const activityId = 100 + Math.floor(Math.random() * 900);
        const courseContextId = 10000 + Math.floor(Math.random() * 90000);
        const activityContextId = courseContextId + 2;
        const gradeItemId = 1000 + Math.floor(Math.random() * 9000);
        const categoryId = 1000 + Math.floor(Math.random() * 9000);
        const courseItemId = 1000 + Math.floor(Math.random() * 9000);

        // Préparer l'intro HTML à partir de la description
        let introHtml = jsonData.description ? String(jsonData.description).trim() : (translations.devoir_activity_intro || "Consultez la grille d'évaluation ci-dessous pour connaître les critères de réussite.");
        if (!introHtml.match(/^\s*<p[\s>]/i)) {
            introHtml = `<p dir="ltr" style="text-align: left;">${introHtml}</p>`;
        }

        const data = {
            'ACTIVITY_TITLE': escapeXml(activityTitle),
            'ACTIVITY_INTRO_HTML': escapeXml(introHtml),
            'RUBRIC_NAME': jsonData.rubricName || jsonData.title || 'Grille d\'évaluation',
            'CRITERIA': jsonData.criteria,
            'COURSE_FULLNAME': escapeXml(activityTitle),
            'COURSE_SHORTNAME': `parcours-${Math.random().toString(36).substring(2, 15)}`,
            'COURSE_ID': courseId,
            'MODULE_ID': moduleId,
            'SECTION_ID': sectionId,
            'ACTIVITY_ID': activityId,
            'COURSE_CONTEXTID': courseContextId,
            'ACTIVITY_CONTEXTID': activityContextId,
            'GRADE_ITEM_ID': gradeItemId,
            'CATEGORY_ID': categoryId,
            'COURSE_ITEM_ID': courseItemId,
            'TIMESTAMP': timestamp,
            'BACKUP_DATE': timestamp
        };

        // Générer les fichiers via le processeur
        let files = MoodleProcessors.getActivityFiles('Devoir', data);

        // Personnaliser le nom de sauvegarde dans moodle_backup.xml
        const now = new Date();
        const dateString = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
        const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
        const fileName = `devoir-caramel-${dateString}-${lang}.mbz`;
        if (files['moodle_backup.xml']) {
            const backupName = jsonData.title ? `${jsonData.title}.mbz` : fileName;
            const safeBackupName = escapeXml(backupName);
            files['moodle_backup.xml'] = files['moodle_backup.xml'].replace(/(<name>)[\s\S]*?(<\/name>)/, `$1${safeBackupName}$2`);
        }

        files['moodle_backup.log'] = translations.devoir_backup_log || 'Backup created automatically by Caramel\n';
        const gzData = await createMbz(files);
        const mbzBlob = new Blob([gzData], { type: 'application/gzip' });

        // Ajouter la notification de succès
        const notifDevoir = {
            type: 'mbz',
            title: translations.elea_devoir_name || 'Devoir',
            titleKey: 'elea_devoir_name',
            moduleKey: 'Devoir',
            fileName: fileName,
            blob: mbzBlob,
            status: 'success',
            jsonData: jsonData,
            originalJsonData: originalJsonDataDevoir,
            silent: true
        };
        if (_debugRawJson) notifDevoir._debugRawJson = _debugRawJson;
        if (_debugHealedJson) notifDevoir._debugHealedJson = _debugHealedJson;
        const notificationId = addNotification(notifDevoir);
        document.dispatchEvent(new CustomEvent('generation:complete', {
            detail: { notificationId, blob: mbzBlob, fileName, titleKey: 'elea_devoir_name', moduleKey: 'Devoir' }
        }));
    } catch (error) {
        console.error(translations.devoir_error_creation_mbz || "Erreur lors de la création du MBZ pour le devoir:", error);

        const errorInfo = classifyError(error);

        addNotification({
            type: 'mbz',
            title: translations.elea_devoir_name || 'Devoir',
            blob: new Blob([''], { type: 'text/plain' }),
            status: 'error',
            errorCategory: errorInfo.category,
            userMessage: translations[errorInfo.userMessageKey] || errorInfo.userMessageKey,
            technicalMessage: errorInfo.technicalMessage
        });

        // Signaler la fin en erreur (arrête l'animation "marmite" côté UI)
        document.dispatchEvent(new CustomEvent('generation:error', {
            detail: { moduleKey: 'Devoir' }
        }));
    }
}
