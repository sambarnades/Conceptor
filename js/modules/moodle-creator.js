/**
 * @file Gestion de la création des activités Moodle/Éléa.
 * Ce module contient la logique pour transformer le JSON généré par l'IA en différents formats Moodle :
 * - Fichiers de sauvegarde d'activité (.mbz)
 * - Fichiers XML pour les banques de questions et les glossaires.
 * - Fichiers au format GIFT.
 */

import { translations, currentLang } from './translation.js';
import { showNotification, cleanJsonInput, downloadFile, formatTextToHtml, escapeHtmlTags } from './utils.js';

/**
 * Crée une archive de sauvegarde Moodle (.mbz) à partir d'un ensemble de fichiers.
 * @param {Object} files - Un objet où les clés sont les chemins des fichiers et les valeurs leur contenu.
 * @returns {Promise<Uint8Array>} Une promesse qui se résout avec les données compressées de l'archive.
 */
async function createMbz(files) {
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
    // 2. Générer le contenu de l'index
    let archiveIndexContent = `Moodle archive file index. Count: ${dirList.length + fileList.length}\n`;
    for (const dir of dirList) {
        archiveIndexContent += `${dir}\td\t0\t${mtime}\n`;
    }
    for (const path of fileList) {
        const content = files[path];
        const buffer = fflate.strToU8(content);
        archiveIndexContent += `${path}\tf\t${buffer.length}\t${mtime}\n`;
    }
    files['.ARCHIVE_INDEX'] = archiveIndexContent;
    // 3. Ajouter tous les fichiers à l'archive TAR (en UTF-8)
    const sortedPaths = Object.keys(files).sort();
    for (const path of sortedPaths) {
        const content = files[path];
        tar.append(path, fflate.strToU8(content));
    }
    // 4. Obtenir l'archive TAR sous forme de Uint8Array
    const tarball = tar.out;
    // 5. Compresser en GZIP avec fflate
    return new Promise((resolve, reject) => {
        fflate.gzip(tarball, {
            level: 9,
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
            const jsonData = JSON.parse(cleanJsonInput(jsonInput));
            if (!jsonData.title || !Array.isArray(jsonData.blocks)) {
                console.error("Erreur de validation : Le JSON doit contenir un 'title' et un tableau 'blocks'.");
                throw new Error("Le JSON doit contenir un 'title' et un tableau 'blocks'.");
            }
            const htmlContent = await generateHtmlFromBlocks(jsonData);
            const now = new Date();
            const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            if (exportType === 'html') {
                const fileName = `page_elea_${dateString}.html`;
                downloadFile(htmlContent, fileName, 'text/html');
                showNotification(`Fichier ${fileName} généré avec succès !`);
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
                // Utilise le bon chemin (sensible à la casse) pour éviter des redirections
                // et rester en même origine comme pour "Appariement".
                const basePath = 'elea/page';
                let files = await fetchAllFilesRecursively(basePath, 'page');
                
                const newFiles = {};
                for (let path in files) {
                    let fileContent = files[path];
                    
                    // Appliquer toutes les substitutions de données
                    for (const key in data) {
                        const regex = new RegExp(`{{${key}}}`, 'g');
                        fileContent = fileContent.replace(regex, data[key]);
                    }
                    
                    // Appliquer les substitutions d'ID dans le contenu des fichiers XML critiques
                    if (path.endsWith('.xml')) {
                        fileContent = fileContent.replace(/76971/g, data.MODULE_ID);
                        fileContent = fileContent.replace(/15690/g, data.SECTION_ID);
                    }

                    // Déterminer le nouveau chemin du fichier
                    let newPath = path.replace(/page_76971/g, `page_${data.MODULE_ID}`);
                    newPath = newPath.replace(/section_15690/g, `section_${data.SECTION_ID}`);
                    
                console.log("[Page Export] Fichiers après substitutions de variables :", newFiles);
                    newFiles[newPath] = fileContent;
                }
                files = newFiles;

                // Post-processing: scrub template remnants (example values)
                for (let p in files) {
                    if (p.endsWith('moodle_backup.xml')) {
                        const content = files[p];
                        let updated = content;
                        // Activity title under <contents><activities><activity><title>
                        updated = updated.replace(/(<activities>[\s\S]*?<activity>[\s\S]*?<title>)[\s\S]*?(<\/title>)/, `$1${data.PAGE_NAME}$2`);
                        // Course title under <contents><course><title>
                        updated = updated.replace(/(<contents>[\s\S]*?<course>[\s\S]*?<title>)[\s\S]*?(<\/title>)/, `$1${data.COURSE_SHORTNAME}$2`);
                        // Original course names
                        updated = updated.replace(/(<original_course_fullname>)[\s\S]*?(<\/original_course_fullname>)/, `$1${data.COURSE_FULLNAME}$2`);
                        updated = updated.replace(/(<original_course_shortname>)[\s\S]*?(<\/original_course_shortname>)/, `$1${data.COURSE_SHORTNAME}$2`);
                        // IDs/date for consistency
                        updated = updated.replace(/(<original_course_id>)[\s\S]*?(<\/original_course_id>)/, `$1${data.COURSE_ID}$2`);
                        updated = updated.replace(/(<original_course_contextid>)[\s\S]*?(<\/original_course_contextid>)/, `$1${data.COURSE_CONTEXTID}$2`);
                        updated = updated.replace(/(<backup_date>)[\s\S]*?(<\/backup_date>)/, `$1${data.BACKUP_DATE}$2`);
                        files[p] = updated;
                    } else if (p.endsWith('course/course.xml')) {
                        const content = files[p];
                        let updated = content;
                        updated = updated.replace(/(<shortname>)[\s\S]*?(<\/shortname>)/, `$1${data.COURSE_SHORTNAME}$2`);
                        updated = updated.replace(/(<fullname>)[\s\S]*?(<\/fullname>)/, `$1${data.COURSE_FULLNAME}$2`);
                        files[p] = updated;
                    }
                }

                files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';
                const gzData = await createMbz(files);
                
                const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
                const fileName = `page_caramel_${dateString}_${lang}.mbz`;
                
                downloadFile(new Blob([gzData], { type: 'application/gzip' }), fileName);
                showNotification(`Fichier ${fileName} généré avec succès !`);
            }
        } catch (error) {
            console.error("Erreur lors de la création de la page :", error);
            showNotification(`Erreur : ${error.message}`, 'error');
        }
    }

    async function generateHtmlFromBlocks(jsonData) {
        console.log("Début de generateHtmlFromBlocks.");
        const response = await fetch('elea/modele_html_page.html');
        if (!response.ok) {
            console.error("Échec du chargement du modèle HTML 'elea/modele_html_page.html'");
            return "<!-- ERREUR: Modèle HTML introuvable -->";
        }
        const templateHtml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(templateHtml, 'text/html');

        // Ancrage déterministe du sommaire (#02_nav_summary)
        // 1) Récupère les IDs dans l'ordre depuis links[].href
        // 2) Chaque bloc titré suivant consomme le prochain ID
        let __navAnchors = [];
        let __navIdx = 0;
        try {
            const nav = (jsonData.blocks || []).find(b => b && b.type === '#02_nav_summary');
            if (nav && nav.data && Array.isArray(nav.data.links)) {
                __navAnchors = nav.data.links
                    .map(l => (l && typeof l.href === 'string' ? l.href : ''))
                    .map(h => h.replace(/^#/, '').trim())
                    .filter(Boolean);
            }
        } catch (e) {}
        function __attachNextNavAnchor(containerEl) {
            try {
                if (!containerEl) return;
                if (__navIdx >= __navAnchors.length) return;
                const id = __navAnchors[__navIdx];
                if (!id) { __navIdx++; return; }
                if (doc.getElementById(id)) { __navIdx++; return; }
                const span = doc.createElement('span');
                span.id = id;
                span.setAttribute('aria-hidden', 'true');
                span.setAttribute('style', 'display:block; height:0; margin:0; padding:0; scroll-margin-top:96px;');
                const h2 = containerEl.querySelector('h2');
                containerEl.insertBefore(span, h2 || containerEl.firstElementChild);
                __navIdx++;
            } catch (e) { __navIdx++; }
        }
        console.log("Modèle HTML chargé et analysé.");

        const finalHtmlContainer = doc.createElement('div');
        finalHtmlContainer.setAttribute('role', 'document');
        finalHtmlContainer.setAttribute('aria-label', jsonData.title);
        finalHtmlContainer.setAttribute('lang', 'fr');
        finalHtmlContainer.setAttribute('dir', 'ltr');
        finalHtmlContainer.setAttribute('style', 'font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111827; background:#ffffff; padding:28px; border-radius:14px; max-width:1000px; margin:0 auto; line-height:1.65;');

        const blockTemplates = new Map();
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT, null, false);
        let commentNode;
        while (commentNode = walker.nextNode()) {
            const match = commentNode.textContent.match(/#(\d{2}):\s*([A-Z_]+)/);
            if (match) {
                const blockId = `#${match[1]}_${match[2].toLowerCase()}`;
                let element = commentNode.nextElementSibling;
                while (element && element.nodeType !== Node.ELEMENT_NODE) {
                    element = element.nextElementSibling;
                }
                if (element) {
                    blockTemplates.set(blockId, element.cloneNode(true));
                }
            }
        }
        console.log(`Map de modèles de blocs créée avec ${blockTemplates.size} éléments.`);

        jsonData.blocks.forEach((block, index) => {
            console.log(`Traitement du bloc ${index + 1}: type = ${block.type}`);
            if (blockTemplates.has(block.type)) {
                const element = blockTemplates.get(block.type);
                const data = block.data;
                try {
                    // ... (toute la logique switch/case que vous aviez déjà écrite)
                    // Je la remets ici pour être complet
                    switch (block.type) {
                        case '#01_hero_header':
                            {
                                const headerTitle = (jsonData && jsonData.title) ? jsonData.title : data.title;
                                const h1 = element.querySelector('h1');
                                if (h1) {
                                    const replacement = element.ownerDocument.createElement('div');
                                    replacement.setAttribute('role', 'heading');
                                    replacement.setAttribute('aria-level', '1');
                                    // Reprendre le style du modèle pour un rendu identique
                                    replacement.setAttribute('style', h1.getAttribute('style') || 'margin:0 0 10px 0; font-size:2rem; color:#40228b;');
                                    // Important: texte brut pour ne pas être supprimé par le nettoyage des <p>
                                    replacement.textContent = headerTitle || '';
                                    h1.replaceWith(replacement);
                                }
                            }
                            {
                                // Supprimer tous les <p> existants du modèle (évite le sous-titre par défaut)
                                element.querySelectorAll('p').forEach(node => node.remove());
                                const hasSubtitle = data.subtitle && String(data.subtitle).trim();
                                if (hasSubtitle) {
                                    const html = formatTextToHtml(data.subtitle);
                                    const temp = element.ownerDocument.createElement('div');
                                    temp.innerHTML = html;
                                    let nodeToAppend = null;
                                    if (temp.childElementCount === 1 && temp.firstElementChild.tagName === 'P') {
                                        nodeToAppend = temp.firstElementChild;
                                        nodeToAppend.style.margin = '12px 0 0 0';
                                        nodeToAppend.style.color = '#374151';
                                    } else {
                                        nodeToAppend = element.ownerDocument.createElement('p');
                                        nodeToAppend.style = 'margin:12px 0 0 0; color:#374151;';
                                        nodeToAppend.innerHTML = html;
                                    }
                                    element.appendChild(nodeToAppend);
                                }
                            }
                            break;
                        case '#02_nav_summary':
                            const ulNav = element.querySelector('ul');
                            ulNav.innerHTML = '';
                            data.links.forEach(link => {
                                const li = document.createElement('li');
                                li.innerHTML = `<a href="${escapeHtmlTags(link.href)}" style="display:inline-block; padding:8px 12px; border-radius:999px; color:#fff; text-decoration:none; font-weight:600; background:linear-gradient(90deg,#5b2e90,#1f4fff);">${formatTextToHtml(link.text)}</a>`;
                                ulNav.appendChild(li);
                            });
                            break;
                        case '#03_histo_reperes':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const cardsContainer = element.querySelector('div');
                            cardsContainer.innerHTML = '';
                            data.cards.forEach(card => {
                                const cardDiv = document.createElement('div');
                                cardDiv.style = "background:#f6f7ff; border:1px solid #dfe3ff; border-radius:12px; padding:12px;";
                                cardDiv.innerHTML = `<h3 style="margin:0 0 6px 0; font-size:1.05rem; color:#2233aa;">${formatTextToHtml(card.title)}</h3><p style="margin:0;">${formatTextToHtml(card.text)}</p>`;
                                cardsContainer.appendChild(cardDiv);
                            });
                            break;
                        case '#08_monuments_grid':
                             element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                             const gridContainer = element.querySelector('div');
                             gridContainer.innerHTML = '';
                             data.cards.forEach(card => {
                                 const article = document.createElement('article');
                                 article.style = "background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;";
                                 article.innerHTML = `
                                     <div aria-hidden="true" style="height:4px; background:linear-gradient(90deg,#5b2e90,#1f4fff);"></div>
                                     <figure style="margin:0;">
                                         <img src="${escapeHtmlTags(card.img_src)}" alt="${escapeHtmlTags(card.img_alt)}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;">
                                         <figcaption style="padding:8px; font-size:0.9rem; color:#4b5563;">${formatTextToHtml(card.caption)}</figcaption>
                                     </figure>
                                     <div style="padding:12px;">
                                         <h3 style="margin:0 0 6px 0; color:#40228b; font-size:1.05rem;">${formatTextToHtml(card.title)}</h3>
                                         <p style="margin:0;">${formatTextToHtml(card.text)}</p>
                                     </div>
                                 `;
                                 gridContainer.appendChild(article);
                             });
                             break;
                        case '#12_context_paragraphs':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const pContainer = element;
                            // Vider les paragraphes existants tout en gardant le h2
                            Array.from(pContainer.children).forEach(child => {
                                if(child.tagName !== 'H2') child.remove();
                            });
                            data.paragraphs.forEach(pText => {
                                const p = document.createElement('p');
                                p.style = "margin:0 0 8px 0;";
                                p.innerHTML = formatTextToHtml(pText);
                                pContainer.appendChild(p);
                            });
                            break;
                        case '#04_callout_set':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const calloutsContainer = element.querySelector('div');
                            calloutsContainer.innerHTML = '';
                            data.callouts.forEach(callout => {
                                const div = document.createElement('div');
                                let style = '';
                                if (callout.type === 'objectif') style = "border:1px solid #dfe3ff; border-left:6px solid #1f4fff; background:#f6f7ff; border-radius:12px; padding:12px;";
                                else if (callout.type === 'savoir') style = "border:1px solid #ffd1b0; border-left:6px solid #ff7a18; background:#fff6ef; border-radius:12px; padding:12px;";
                                else if (callout.type === 'alerte') style = "border:1px solid #f7c4c4; border-left:6px solid #b91c1c; background:#fff5f5; border-radius:12px; padding:12px;";
                                div.style = style;
                                div.innerHTML = `<p style="margin:0;">${formatTextToHtml(callout.text)}</p>`;
                                calloutsContainer.appendChild(div);
                            });
                            break;
                        case '#05_stats_cards':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const statsContainer = element.querySelector('div');
                            statsContainer.innerHTML = '';
                            data.stats.forEach(stat => {
                                const div = document.createElement('div');
                                div.style = "border:1px solid #e5e7eb; border-radius:16px; padding:14px; text-align:center;";
                                div.innerHTML = `<div aria-hidden="true" style="height:4px; margin:-14px -14px 10px -14px; border-radius:16px 16px 0 0; background:linear-gradient(90deg,#5b2e90,#1f4fff);"></div><p style="margin:2px 0 0 0; font-size:2rem; font-weight:800; color:#1f4fff;">${formatTextToHtml(stat.value)}</p><p style="margin:2px 0 0 0; color:#6b7280;">${formatTextToHtml(stat.label)}</p>`;
                                statsContainer.appendChild(div);
                            });
                            break;
                        case '#06_lexique_table':
                        case '#10_table_comparison':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            element.querySelector('caption').innerHTML = formatTextToHtml(data.caption);
                            const thead = element.querySelector('thead tr');
                            thead.innerHTML = '';
                            data.headers.forEach(header => {
                                const th = document.createElement('th');
                                th.scope = "col";
                                th.style = "text-align:left; padding:10px; border-bottom:2px solid #e5e7eb;";
                                th.innerHTML = formatTextToHtml(header);
                                thead.appendChild(th);
                            });
                            const tbody = element.querySelector('tbody');
                            tbody.innerHTML = '';
                            data.rows.forEach(row => {
                                const tr = document.createElement('tr');
                                row.forEach(cell => {
                                    const td = document.createElement('td');
                                    td.style = "padding:10px; border-bottom:1px solid #eef2f7;";
                                    td.innerHTML = formatTextToHtml(cell);
                                    tr.appendChild(td);
                                });
                                tbody.appendChild(tr);
                            });
                            break;
                        case '#07_glossary_chips':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const chipsUl = element.querySelector('ul');
                            chipsUl.innerHTML = '';
                            data.chips.forEach(chip => {
                                const li = document.createElement('li');
                                li.innerHTML = `<span style="display:inline-block; padding:6px 10px; border-radius:999px; background:#eef2ff; border:1px solid #dfe3ff; color:#2233aa;">${formatTextToHtml(chip)}</span>`;
                                chipsUl.appendChild(li);
                            });
                            break;
                        case '#09_figures_comparison':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const figuresContainer = element.querySelector('div');
                            figuresContainer.innerHTML = '';
                            data.images.forEach(img => {
                                const figure = document.createElement('figure');
                                figure.style = "margin:0; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;";
                                figure.innerHTML = `<img src="${escapeHtmlTags(img.src)}" alt="${escapeHtmlTags(img.alt)}" loading="lazy" decoding="async" style="width:100%; height:180px; object-fit:cover;"><figcaption style="padding:8px; color:#4b5563;">${formatTextToHtml(img.caption)}</figcaption>`;
                                figuresContainer.appendChild(figure);
                            });
                            break;
                        case '#11_definition_box':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            element.querySelector('p').innerHTML = formatTextToHtml(data.text);
                            break;
                        case '#13_monument_sheet_long':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            // Dans le modèle, le H2 est dans le 2e <div> (le 1er est une barre décorative)
                            const h2 = element.querySelector('h2');
                            const contentWrapper = h2 ? h2.parentElement : element;
                            // Nettoyer tout sauf le H2 à l'intérieur du wrapper
                            Array.from(contentWrapper.children).forEach(child => {
                                if (child !== h2) child.remove();
                            });
                            // Injecter les paragraphes après le H2
                            data.paragraphs.forEach(pText => {
                                const p = document.createElement('p');
                                p.style = "margin:0 0 8px 0;";
                                p.innerHTML = formatTextToHtml(pText);
                                contentWrapper.appendChild(p);
                            });
                            break;
                        case '#14_faq_block':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            // Clear existing questions
                            while(element.children.length > 1) {
                                element.lastChild.remove();
                            }
                            data.questions.forEach(q => {
                                const h3 = document.createElement('h3');
                                h3.style = "margin:0 0 6px 0; color:#40228b; font-size:1.05rem;";
                                h3.innerHTML = formatTextToHtml(q.q);
                                const p = document.createElement('p');
                                p.style = "margin:0 0 8px 0;";
                                p.innerHTML = formatTextToHtml(q.a);
                                element.appendChild(h3);
                                element.appendChild(p);
                            });
                            break;
                        case '#15_myths_realities':
                            const mythsDiv = element.children[0];
                            mythsDiv.querySelector('h2').innerHTML = formatTextToHtml(data.myths.title);
                            const mythsUl = mythsDiv.querySelector('ul');
                            mythsUl.innerHTML = '';
                            data.myths.items.forEach(item => {
                                const li = document.createElement('li');
                                li.innerHTML = formatTextToHtml(item);
                                mythsUl.appendChild(li);
                            });
                            const realitiesDiv = element.children[1];
                            realitiesDiv.querySelector('h2').innerHTML = formatTextToHtml(data.realities.title);
                            const realitiesUl = realitiesDiv.querySelector('ul');
                            realitiesUl.innerHTML = '';
                            data.realities.items.forEach(item => {
                                const li = document.createElement('li');
                                li.innerHTML = formatTextToHtml(item);
                                realitiesUl.appendChild(li);
                            });
                            break;
                        case '#17_method_image_desc':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const ol = element.querySelector('ol');
                            ol.innerHTML = '';
                            data.steps.forEach(step => {
                                const li = document.createElement('li');
                                li.innerHTML = formatTextToHtml(step);
                                ol.appendChild(li);
                            });
                            break;
                        case '#18_sito_graphy':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            const sitoUl = element.querySelector('ul');
                            sitoUl.innerHTML = '';
                            data.links.forEach(link => {
                                const li = document.createElement('li');
                                li.innerHTML = `<a href="${escapeHtmlTags(link.href)}" style="color:#1f4fff; text-decoration:underline;">${formatTextToHtml(link.text)}</a>`;
                                sitoUl.appendChild(li);
                            });
                            break;
                        case '#19_quote_bilingual':
                            element.querySelector('h2').innerHTML = formatTextToHtml(data.title);
                            element.querySelector('blockquote').innerHTML = formatTextToHtml(data.quote_fr);
                            element.querySelector('blockquote[lang="it"]').innerHTML = formatTextToHtml(data.quote_alt);
                            element.querySelector('figcaption').innerHTML = formatTextToHtml(data.caption);
                            break;
                        default:
                            break;
                    }
                    finalHtmlContainer.appendChild(element);
                } catch (e) {
                    console.error(`Erreur lors du traitement du bloc de type ${block.type}:`, e);
                    // En cas d'erreur, ajouter le bloc modèle non modifié pour le débogage
                    finalHtmlContainer.appendChild(blockTemplates.get(block.type));
                }
            } else {
                console.warn(`Modèle non trouvé pour le type de bloc: ${block.type}`);
            }
        });

        // Deterministic in-page navigation anchors for #02_nav_summary
        try {
            const navEl = finalHtmlContainer.querySelector('nav[role="navigation"]');
            if (navEl) {
                const links = Array.from(navEl.querySelectorAll('a[href^="#"]'))
                    .map(a => ({ id: (a.getAttribute('href') || '').replace(/^#/, '').trim(), text: (a.textContent || '').trim() }))
                    .filter(x => x.id);
                const allH2 = Array.from(finalHtmlContainer.querySelectorAll('h2'));
                const titledAfter = allH2
                    .filter(h2 => (navEl.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
                    .map(h2 => ({ h2, container: h2.parentElement }));
                const used = new Set();
                links.forEach(link => {
                    if (finalHtmlContainer.ownerDocument.getElementById(link.id) || doc.getElementById(link.id)) {
                        return;
                    }
                    let target = titledAfter.find(b => !used.has(b.h2) && ((b.h2.textContent || '').trim() === link.text));
                    if (!target) {
                        target = titledAfter.find(b => !used.has(b.h2));
                    }
                    const anchor = doc.createElement('span');
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

        return finalHtmlContainer.innerHTML;

        return finalHtml;
    }

/**
 * Gère la création d'une activité "Qui veut gagner des millions" au format .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant le titre et les questions.
 */
export async function handleMillionnaireCreation(jsonInput) {
       try {
           if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
               throw new Error(translations.millionnaire_error_compression_libs);
           }
           const jsonData = JSON.parse(jsonInput);
           if (!jsonData.title || !Array.isArray(jsonData.questions) || jsonData.questions.length !== 6 || jsonData.questions.some(q => !q.question || !q.goodanswer || !Array.isArray(q.badanswer) || q.badanswer.length !== 3)) {
               throw new Error(translations.millionnaire_error_invalid_json);
           }
           const activityTitle = jsonData.title;
           const questions = jsonData.questions;
           const courseFullname = activityTitle;
           const data = {
               'ACTIVITY_TITLE': escapeXml(activityTitle),
               'ACTIVITY_INTRO_HTML': `<p>${translations.millionnaire_activity_intro}</p>`,
               'QUESTIONS_JSON': JSON.stringify(questions),
               'COURSE_FULLNAME': escapeXml(courseFullname),
               'COURSE_CONTEXTID': '110712'
           };
           const basePath = 'elea/millionnairev2/modele_base';
           let files = await fetchAllFilesRecursively(basePath, 'millionnaire');
           for (const path in files) {
               let content = files[path];
               for (const key in data) {
                   const regex = new RegExp(`{{${key}}}`, 'g');
                   content = content.replace(regex, data[key]);
               }
               files[path] = content;
           }
           // Post-traitement pour supprimer tout résidu d'ID/chemin du modèle
           const mmTimestamp = Math.floor(Date.now() / 1000);
           const mmCourseId = 1000 + Math.floor(Math.random() * 9000);
           const mmModuleId = 10000 + Math.floor(Math.random() * 90000);
           const mmSectionId = 1000 + Math.floor(Math.random() * 9000);
           const mmActivityId = 100 + Math.floor(Math.random() * 900);
           const mmCourseShort = `parcours-${Math.random().toString(36).substring(2, 15)}`;
           const mmCourseCtx = 10000 + Math.floor(Math.random() * 90000);
           const mmActivityCtx = mmCourseCtx + 2;
           const remapped = {};
           for (const p in files) {
               let c = files[p];
               if (p.endsWith('.xml')) {
                   c = c.replace(/millionnairev2_59967/g, `millionnairev2_${mmModuleId}`)
                        .replace(/<module id="59967"/g, `<module id="${mmModuleId}"`)
                        .replace(/<sectionid>11207<\/sectionid>/g, `<sectionid>${mmSectionId}<\/sectionid>`)
                        .replace(/<activity id="664" moduleid="59967" modulename="millionnairev2" contextid="110714">/g,
                                 `<activity id="${mmActivityId}" moduleid="${mmModuleId}" modulename="millionnairev2" contextid="${mmActivityCtx}">`)
                        .replace(/<millionnairev2 id="664">/g, `<millionnairev2 id="${mmActivityId}">`)
                        .replace(/<course>3341<\/course>/g, `<course>${mmCourseId}<\/course>`)
                        .replace(/<timecreated>\d+<\/timecreated>/g, `<timecreated>${mmTimestamp}<\/timecreated>`)
                        .replace(/<timemodified>\d+<\/timemodified>/g, `<timemodified>${mmTimestamp}<\/timemodified>`)
                        .replace(/<shortname>[^<]*<\/shortname>/g, `<shortname>${mmCourseShort}<\/shortname>`)
                        .replace(/<fullname>[^<]*<\/fullname>/g, `<fullname>${escapeXml(activityTitle)}<\/fullname>`);
                   if (p.endsWith('moodle_backup.xml')) {
                       c = c.replace(/(<name>)[\s\S]*?(<\/name>)/, `$1${escapeXml(activityTitle + '.mbz')}$2`)
                            .replace(/(<moduleid>)[\s\S]*?(<\/moduleid>)/, `$1${mmModuleId}$2`)
                            .replace(/(<sectionid>)[\s\S]*?(<\/sectionid>)/, `$1${mmSectionId}$2`)
                            .replace(/(<original_course_id>)[\s\S]*?(<\/original_course_id>)/, `$1${mmCourseId}$2`)
                            .replace(/(<original_course_fullname>)[\s\S]*?(<\/original_course_fullname>)/, `$1${escapeXml(activityTitle)}$2`)
                            .replace(/(<original_course_shortname>)[\s\S]*?(<\/original_course_shortname>)/, `$1${mmCourseShort}$2`)
                            .replace(/(<directory>activities\/)millionnairev2_\d+(<\/directory>)/, `$1millionnairev2_${mmModuleId}$2`);
                   }
               }
               let np = p.replace(/millionnairev2_59967/g, `millionnairev2_${mmModuleId}`)
                          .replace(/section_11207/g, `section_${mmSectionId}`);
               remapped[np] = c;
           }
           files = remapped;
           // Ajout automatique du fichier moodle_backup.log minimal
           files['moodle_backup.log'] = translations.millionnaire_backup_log || "Sauvegarde créée automatiquement par Caramel";
           const gzData = await createMbz(files);
           const now = new Date();
           const dateString = now.getFullYear() + '-' +
                            String(now.getMonth() + 1).padStart(2, '0') + '-' +
                            String(now.getDate()).padStart(2, '0') + '-' +
                            String(now.getHours()).padStart(2, '0') + '-' +
                            String(now.getMinutes()).padStart(2, '0');
           const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
           const fileName = `millionnaire_caramel_${dateString}_${lang}.mbz`;
           const a = document.createElement('a');
           a.href = URL.createObjectURL(new Blob([gzData], { type: 'application/gzip' }));
           a.download = fileName;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           URL.revokeObjectURL(a.href);
           showNotification(translations.millionnaire_success_generation.replace('{fileName}', fileName) || `Fichier ${fileName} généré avec succès !`);
       } catch (error) {
           console.error(translations.millionnaire_error_creation_mbz, error);
           showNotification(`${translations.millionnaire_error_generic} ${error.message}`, 'error');
       }
   }

/**
 * Gère la création d'une activité "Appariement" au format .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant le titre et les paires question/réponse.
 */
export async function handleAppariementCreation(jsonInput) {
         try {
             if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
                 throw new Error(translations.millionnaire_error_compression_libs || "Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées.");
             }
             const jsonData = JSON.parse(cleanJsonInput(jsonInput));
            if (!jsonData.title || !Array.isArray(jsonData.pairs) || jsonData.pairs.length === 0 || jsonData.pairs.some(p => !p.question || !p.answer)) {
                throw new Error(translations.appariement_error_invalid_json || "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'pairs' où chaque paire a une 'question' et une 'answer'.");
            }

            const activityTitle = jsonData.title;
            const pairs = jsonData.pairs;
            const questions = {};
            const responses = {};
            pairs.forEach((pair, index) => {
                const q = String(pair.question ?? '').trim();
                const a = String(pair.answer ?? '').trim();
                // Conserver un paragraphe HTML mais neutralisé (balises échappées) pour l'éditeur Moodle
                questions[index + 1] = escapeHtmlTags(`<p dir=\"ltr\" style=\"text-align: left;\">${q}<\/p>`);
                responses[index + 1] = escapeHtmlTags(`<p dir=\"ltr\" style=\"text-align: left;\">${a}<\/p>`);
            });
            // IMPORTANT: ne pas double-échanger ici. Les balises <p> sont déjà échappées
            // dans chaque entrée via escapeHtmlTags(); conserver le JSON brut pour que
            // Moodle restitue bien le HTML (sinon on verrait &lt;p&gt; s'afficher).
            const associations = JSON.stringify({ questions, responses });

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

            const data = {
                'ACTIVITY_TITLE': escapeXml(activityTitle),
                'ACTIVITY_INTRO_HTML': escapeXml(`<p dir="ltr" style="text-align: left;">${jsonData.intro ? String(jsonData.intro) : (translations.appariement_activity_intro || "Trouvez les paires correspondantes.")}</p>`),
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

            const basePath = 'elea/appariement';
            let files = await fetchAllFilesRecursively(basePath, 'appariement');

            const newFiles = {};
            for (let path in files) {
                let content = files[path];
                for (const key in data) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    content = content.replace(regex, data[key]);
                }

                // Corriger les références internes d'IDs et chemins du modèle
                // Dossier activité
                let newPath = path.replace(/epikmatch_13863/g, `epikmatch_${data.MODULE_ID}`);
                // Sections (si présentes)
                newPath = newPath.replace(/section_3585/g, `section_${data.SECTION_ID}`);
                // Inforef: remapper l'ID d'item de note si un ID fixe est présent
                if (newPath.endsWith('inforef.xml')) {
                    content = content.replace(/<id>\d+<\/id>/, `<id>${data.GRADE_ITEM_ID}</id>`);
                }

                newFiles[newPath] = content;
            }
            files = newFiles;

            // Met à jour le nom de sauvegarde dans moodle_backup.xml pour éviter toute trace du modèle
            const now = new Date();
            const dateString = now.getFullYear() + '-' +
                             String(now.getMonth() + 1).padStart(2, '0') + '-' +
                             String(now.getDate()).padStart(2, '0') + '-' +
                             String(now.getHours()).padStart(2, '0') + '-' +
                             String(now.getMinutes()).padStart(2, '0');
            const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
            const fileName = `appariement_caramel_${dateString}_${lang}.mbz`;
            if (files['moodle_backup.xml']) {
                const backupName = jsonData.title ? `${jsonData.title}.mbz` : fileName;
                const safeBackupName = escapeXml(backupName);
                files['moodle_backup.xml'] = files['moodle_backup.xml'].replace(/(<name>)[\s\S]*?(<\/name>)/, `$1${safeBackupName}$2`);
            }

            files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';
            const gzData = await createMbz(files);
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([gzData], { type: 'application/gzip' }));
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            showNotification(translations.appariement_success_generation.replace('{fileName}', fileName) || `Fichier ${fileName} généré avec succès !`);
        } catch (error) {
            console.error(translations.appariement_error_creation_mbz || "Erreur lors de la création du MBZ pour l'appariement:", error);
            showNotification(`${translations.millionnaire_error_generic || "Erreur :"} ${error.message}`, 'error');
        }
    }
 
/**
 * Gère la création d'une activité "QCM" (SimpleQuiz) au format .mbz.
 * @param {string} jsonInput - La chaîne JSON brute contenant le titre et les questions à choix multiples.
 */
export async function handleQCMCreation(jsonInput) {
       try {
           if (typeof Tar === 'undefined' || typeof fflate === 'undefined') {
               throw new Error(translations.millionnaire_error_compression_libs || "Les bibliothèques de compression (Tar.js ou fflate) ne sont pas chargées.");
           }
           const jsonData = JSON.parse(jsonInput);
           if (!jsonData.title || !Array.isArray(jsonData.questions) || jsonData.questions.length === 0 || jsonData.questions.some(q => !q.text || !Array.isArray(q.answers) || q.answers.length === 0)) {
              throw new Error(translations.qcm_error_invalid_json || "La structure du JSON est invalide. Assurez-vous qu'elle contient un 'title' et un tableau 'questions' avec au moins une question et des réponses.");
           }

           // Ajout des balises <p> au contenu textuel
           jsonData.questions.forEach(question => {
               if (question.text && !question.text.startsWith('<p>')) {
                   question.text = `<p>${question.text}</p>`;
               }
               question.answers.forEach(answer => {
                   if (answer.text && !answer.text.startsWith('<p>')) {
                       answer.text = `<p>${answer.text}</p>`;
                   }
               });
           });

            const activityTitle = jsonData.title;
            
            const questionsData = escapeHtmlTags(JSON.stringify(jsonData.questions));

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
                'ACTIVITY_TITLE': activityTitle,
                'ACTIVITY_INTRO_HTML': escapeHtmlTags(`<p dir="ltr" style="text-align: left;">${translations.qcm_activity_intro || "Répondez aux questions suivantes."}</p>`),
                'QUESTIONS_JSON': questionsData, // Placeholder pour le JSON des questions
                'COURSE_FULLNAME': activityTitle,
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

            const basePath = 'elea/QCM'; // Utiliser le dossier QCM comme base
            let files = await fetchAllFilesRecursively(basePath, 'qcm');

            const newFiles = {};
            for (let path in files) {
                let content = files[path];
                for (const key in data) {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    content = content.replace(regex, data[key]);
                }
                
                let newPath = path.replace(/simplequiz_13882/g, `simplequiz_${data.MODULE_ID}`);
                // Pas de remplacement de section pour QCM pour l'instant, à vérifier
                
                newFiles[newPath] = content;
            }
            files = newFiles;

            // Mettre le nom de sauvegarde sur le titre JSON si présent
            if (files['moodle_backup.xml']) {
                const backupTitle = `${activityTitle}.mbz`;
                files['moodle_backup.xml'] = files['moodle_backup.xml'].replace(/(<name>)[\s\S]*?(<\/name>)/, `$1${escapeXml(backupTitle)}$2`);
            }

            files['moodle_backup.log'] = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';
            const gzData = await createMbz(files);
            const now = new Date();
            const dateString = now.getFullYear() + '-' +
                             String(now.getMonth() + 1).padStart(2, '0') + '-' +
                             String(now.getDate()).padStart(2, '0') + '-' +
                             String(now.getHours()).padStart(2, '0') + '-' +
                             String(now.getMinutes()).padStart(2, '0');
            const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
            const fileName = `qcm_caramel_${dateString}_${lang}.mbz`;
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([gzData], { type: 'application/gzip' }));
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            showNotification(translations.qcm_success_generation.replace('{fileName}', fileName) || `Fichier ${fileName} généré avec succès !`);
        } catch (error) {
            console.error(translations.qcm_error_creation_mbz || "Erreur lors de la création du MBZ pour le QCM:", error);
            showNotification(`${translations.millionnaire_error_generic || "Erreur :"} ${error.message}`, 'error');
        }
   }

/**
 * Gère la création d'un fichier d'import de glossaire Moodle au format XML.
 * @param {string} jsonInput - La chaîne JSON brute contenant le nom et les entrées du glossaire.
 */
export function handleGlossaireXmlCreation(jsonInput) {
        try {
            const jsonData = JSON.parse(jsonInput);
            if (!jsonData.name || !Array.isArray(jsonData.entries)) {
                throw new Error("Le JSON doit contenir un nom ('name') et un tableau d'entrées ('entries').");
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
            const dateString = now.getFullYear() + '-' +
                             String(now.getMonth() + 1).padStart(2, '0') + '-' +
                             String(now.getDate()).padStart(2, '0') + '-' +
                             String(now.getHours()).padStart(2, '0') + '-' +
                             String(now.getMinutes()).padStart(2, '0');
            const lang = currentLang === 'zh' ? 'zh-cn' : currentLang;
            const fileName = `glossaire_caramel_${dateString}_${lang}.xml`;
            downloadFile(xmlContent, fileName, 'text/xml');
            showNotification("Fichier glossaire.xml généré avec succès !");

        } catch (error) {
            console.error("Erreur lors de la création du XML du glossaire:", error);
            showNotification(`Erreur : ${error.message}`, 'error');
        }
    }


   async function fetchAllFilesRecursively(basePath, type) {
       let files = {};
       let structure;
       if (type === 'appariement') {
           structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml',
               'activities/epikmatch_13863/epikmatch.xml', 'activities/epikmatch_13863/grades.xml', 'activities/epikmatch_13863/module.xml', 'activities/epikmatch_13863/inforef.xml', 'activities/epikmatch_13863/roles.xml', 'activities/epikmatch_13863/grade_history.xml', 'activities/epikmatch_13863/calendar.xml', 'activities/epikmatch_13863/filters.xml'
           ];
       } else if (type === 'qcm') {
            structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml', 'badges.xml',
               'activities/simplequiz_13882/simplequiz.xml', 'activities/simplequiz_13882/grades.xml', 'activities/simplequiz_13882/module.xml', 'activities/simplequiz_13882/inforef.xml', 'activities/simplequiz_13882/roles.xml', 'activities/simplequiz_13882/grade_history.xml', 'activities/simplequiz_13882/calendar.xml', 'activities/simplequiz_13882/filters.xml'
           ];
       } else if (type === 'test') {
           structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml',
               'activities/quiz_76946/quiz.xml', 'activities/quiz_76946/grades.xml', 'activities/quiz_76946/module.xml', 'activities/quiz_76946/inforef.xml', 'activities/quiz_76946/roles.xml',
               'activities/quiz_76946/calendar.xml', 'activities/quiz_76946/filters.xml','activities/quiz_76946/grade_history.xml'
           ];
       } else if (type === 'page') {
           structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml',
               'course/course.xml', 'course/enrolments.xml', 'course/inforef.xml', 'course/roles.xml', 'course/filters.xml', 'course/calendar.xml', 'course/completiondefaults.xml', 'course/contentbank.xml',
               'activities/page_76971/page.xml', 'activities/page_76971/grades.xml', 'activities/page_76971/module.xml', 'activities/page_76971/inforef.xml', 'activities/page_76971/roles.xml', 'activities/page_76971/filters.xml',
               'sections/section_15690/inforef.xml', 'sections/section_15690/section.xml'
           ];
       } else { // Fallback to millionnaire
           structure = [
               'moodle_backup.xml', 'files.xml', 'roles.xml', 'outcomes.xml', 'scales.xml', 'gradebook.xml', 'grade_history.xml', 'groups.xml', 'questions.xml', 'completion.xml',
               'course/course.xml', 'course/enrolments.xml', 'course/completiondefaults.xml', 'course/inforef.xml', 'course/roles.xml',
               'activities/millionnairev2_59967/millionnairev2.xml', 'activities/millionnairev2_59967/grades.xml', 'activities/millionnairev2_59967/module.xml', 'activities/millionnairev2_59967/inforef.xml', 'activities/millionnairev2_59967/roles.xml', 'activities/millionnairev2_59967/grade_history.xml',
               'sections/section_11207/inforef.xml', 'sections/section_11207/section.xml'
           ];
       }
       for (const path of structure) {
           const response = await fetch(`${basePath}/${path}`);
           if (response.ok) {
               files[path] = await response.text();
           } else {
               console.warn(`Fichier manquant : ${basePath}/${path}`);
           }
       }
       return files;
   }

// =======================================================================
 // 6.5. Fonctions de génération XML et GIFT pour Moodle
 // =======================================================================
    function escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/[^\x20-\x7E]/g, function(ch) {
                return '&#' + ch.charCodeAt(0) + ';';
            });
    }

/**
 * Génère le contenu d'un fichier XML de banque de questions Moodle à partir d'un objet de données.
 * @param {Object} data - L'objet contenant la structure de la banque de questions.
 * @returns {string} Le contenu du fichier XML.
 */
export function generateMoodleXml(data) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;

    if (data.bank_name && data.bank_description) {
        xml += `
  <!-- question: 0  -->
  <question type="category">
    <category>
      <text>$course$/top/${escapeXml(data.bank_name)}</text>
    </category>
    <info format="moodle_auto_format">
      <text>${escapeXml(data.bank_description)}</text>
    </info>
    <idnumber></idnumber>
  </question>
`;
    }

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach(question => {
            switch (question.type) {
                case 'matching':
                    xml += generateMatchingQuestionXml(question.content);
                    break;
                case 'multichoice':
                    xml += generateMultichoiceQuestionXml(question.content);
                    break;
                case 'truefalse':
                    xml += generateTrueFalseQuestionXml(question.content);
                    break;
                case 'shortanswer':
                    xml += generateShortanswerQuestionXml(question.content);
                    break;
                case 'numerical':
                    xml += generateNumericalQuestionXml(question.content);
                    break;
                case 'cloze':
                    xml += generateClozeQuestionXml(question.content);
                    break;
                // Ajoutez d'autres types de questions ici
            }
        });
    }

    xml += '</quiz>';
    return xml;
}

function generateMatchingQuestionXml(content) {
    let subquestionsXml = content.subquestions.map(sq => `
    <subquestion format="html">
      <text><![CDATA[<p>${sq.text}</p>]]></text>
      <answer>
        <text>${escapeXml(sq.answer)}</text>
      </answer>
    </subquestion>`).join('');

    return `
  <question type="matching">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${content.questiontext}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${content.feedback || ''}</p>]]></text>
    </generalfeedback>
    <shuffleanswers>true</shuffleanswers>
    ${subquestionsXml}
  </question>`;
}

function generateMultichoiceQuestionXml(content) {
    let answersXml = content.answers.map(ans => `
    <answer fraction="${ans.fraction}" format="html">
      <text><![CDATA[<p>${ans.text}</p>]]></text>
      <feedback format="html">
        <text><![CDATA[<p>${ans.feedback || ''}</p>]]></text>
      </feedback>
    </answer>`).join('');

    return `
  <question type="multichoice">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${content.questiontext}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${content.feedback || ''}</p>]]></text>
    </generalfeedback>
    <single>${content.single || 'true'}</single>
    <shuffleanswers>true</shuffleanswers>
    <answernumbering>abc</answernumbering>
    ${answersXml}
  </question>`;
}

function generateTrueFalseQuestionXml(content) {
    const fractionTrue = content.answer.value ? 100 : 0;
    const fractionFalse = content.answer.value ? 0 : 100;

    return `
  <question type="truefalse">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${content.questiontext}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${content.feedback || ''}</p>]]></text>
    </generalfeedback>
    <answer fraction="${fractionTrue}" format="moodle_auto_format">
      <text>true</text>
      <feedback format="html">
        <text><![CDATA[<p>${content.answer.feedback_true || ''}</p>]]></text>
      </feedback>
    </answer>
    <answer fraction="${fractionFalse}" format="moodle_auto_format">
      <text>false</text>
      <feedback format="html">
        <text><![CDATA[<p>${content.answer.feedback_false || ''}</p>]]></text>
      </feedback>
    </answer>
  </question>`;
}

function generateShortanswerQuestionXml(content) {
    let answersXml = content.answers.map(ans => `
    <answer fraction="${ans.fraction}" format="moodle_auto_format">
      <text>${escapeXml(ans.text)}</text>
      <feedback format="html">
        <text><![CDATA[<p>${ans.feedback || ''}</p>]]></text>
      </feedback>
    </answer>`).join('');

    return `
  <question type="shortanswer">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${content.questiontext}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${content.feedback || ''}</p>]]></text>
    </generalfeedback>
    <usecase>${content.usecase || 0}</usecase>
    ${answersXml}
  </question>`;
}

function generateNumericalQuestionXml(content) {
    return `
  <question type="numerical">
    <name>
      <text>${escapeXml(content.name)}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<p>${content.questiontext}</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>${content.feedback || ''}</p>]]></text>
    </generalfeedback>
    <answer fraction="100" format="moodle_auto_format">
      <text>${content.answer.number}</text>
      <tolerance>${content.answer.tolerance || 0}</tolerance>
      <feedback format="html">
        <text><![CDATA[<p>${content.answer.feedback || ''}</p>]]></text>
      </feedback>
    </answer>
  </question>`;
}

/**
 * Génère le contenu d'un fichier au format GIFT de Moodle à partir d'un objet de données.
 * @param {Object} data - L'objet contenant la structure de la banque de questions.
 * @returns {string} Le contenu du fichier au format GIFT.
 */
export function generateMoodleGift(data) {
    let gift_string = "";

    if (data.bank_name) {
        gift_string += `// question: 0 name: Switch category to $course$/top/${data.bank_name}\n`;
        gift_string += `$CATEGORY: $course$/top/${data.bank_name}\n\n`;
    }

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach(question => {
            switch (question.type) {
                case 'multichoice':
                    gift_string += generateMultichoiceGift(question.content);
                    break;
                case 'matching':
                    gift_string += generateMatchingGift(question.content);
                    break;
                case 'truefalse':
                    gift_string += generateTrueFalseGift(question.content);
                    break;
                case 'shortanswer':
                    gift_string += generateShortanswerGift(question.content);
                    break;
                case 'numerical':
                    gift_string += generateNumericalGift(question.content);
                    break;
                // Cloze n'a pas de conversion simple directe en GIFT standard, on l'ignore pour l'instant.
            }
        });
    }

    return gift_string;
}

function generateMultichoiceGift(content) {
    let answers_gift = content.answers.map(ans => {
        const prefix = ans.fraction == 100 ? '=' : '~';
        const feedback = ans.feedback ? `#<p>${ans.feedback}</p>` : '';
        return `${prefix}<p>${ans.text}</p>${feedback}`;
    }).join('\n\t');
    
    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{
	${answers_gift}
	${general_feedback}
}\n\n`;
}

function generateMatchingGift(content) {
    let subquestions_gift = content.subquestions.map(sq => 
        `=<p>${sq.text}</p> -> ${sq.answer}`
    ).join('\n\t');
    
    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{
	${subquestions_gift}
	${general_feedback}
}\n\n`;
}

function generateTrueFalseGift(content) {
    const answer = content.answer.value ? 'TRUE' : 'FALSE';
    const feedback_true = content.answer.feedback_true ? `#<p>${content.answer.feedback_true}</p>` : '';
    const feedback_false = content.answer.feedback_false ? `#<p>${content.answer.feedback_false}</p>` : '';
    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{${answer}${feedback_true}${feedback_false}${general_feedback}}\n\n`;
}

function generateShortanswerGift(content) {
    let answers_gift = content.answers.map(ans => {
        const feedback = ans.feedback ? `#<p>${ans.feedback}</p>` : '';
        return `=%${ans.fraction}%${ans.text}${feedback}`;
    }).join('\n\t');

    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';

    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{
	${answers_gift}
	${general_feedback}
}\n\n`;
}

function generateNumericalGift(content) {
    const feedback = content.answer.feedback ? `#<p>${content.answer.feedback}</p>` : '';
    const general_feedback = content.feedback ? `####<p>${content.feedback}</p>` : '';
    
    return `// question: 0 name: ${content.name}
::${content.name}::[html]<p>${content.questiontext}</p>{#
	=%100%${content.answer.number}:${content.answer.tolerance || 0}${feedback}
	${general_feedback}
}\n\n`;
}

function generateClozeQuestionXml(content) {
    return `
    <question type="cloze">
        <name>
            <text>${escapeXml(content.name)}</text>
        </name>
        <questiontext format="html">
            <text><![CDATA[${content.questiontext}]]></text>
        </questiontext>
        <generalfeedback format="html">
            <text><![CDATA[<p>${content.feedback || ''}</p>]]></text>
        </generalfeedback>
    </question>`;
}
