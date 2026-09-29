import { parseDragTextWord } from '../h5p/drag-text-grammar.js';
/**
 * @file Module de formatage des contenus générés pour l'export document.
 * Ce module transforme les JSON générés par l'IA en contenu structuré
 * adapté aux formats DOCX, ODT et PDF, avec une mise en forme professionnelle
 * destinée aux enseignants.
 */

import { translations, t, currentLang } from '../core/translation.js';
import { h5pDateToLocale } from '../core/utils.js';
import { latexToUnicode } from '../h5p/json-healer.js';
// chart-renderer.js chargé à la demande dans formatChart() pour éviter
// de payer le coût de parsing au premier import de document-formatter.js


/**
 * Formatte un contenu JSON selon son type pour l'export document
 * @param {string} moduleKey - La clé du module (ex: 'QuizSet', 'Flashcards', etc.)
 * @param {Object} jsonData - Les données JSON du contenu
 * @param {Object} [options={}] - Options de formatage
 * @param {boolean} [options.keepLatex=false] - Si true, conserve le LaTeX \(...\) au lieu de convertir en Unicode
 *   (pour les exports DOCX/ODT qui gèrent les formules nativement)
 * @returns {Object} - Le contenu formaté avec sections et éléments structurés
 */
export async function formatContentForDocument(moduleKey, jsonData, options = {}) {
    const formatters = {
        'QuizSet': formatQuizSet,
        'QuizSetQCM': formatQuizSet,
        'QuizSetVF': formatQuizSet,
        'Flashcards': formatFlashcards,
        'Crossword': formatCrossword,
        'Timeline': formatTimeline,
        'DragTheWords': formatDragTheWords,
        'DragAndDrop': formatDragAndDrop,
        'FillInTheBlanks': formatFillInTheBlanks,
        'MarkTheWords': formatMarkTheWords,
        'Glossary': formatGlossary,
        'Chart': formatChart,
        'Summary': formatSummary,
        'MultipleChoice': formatMultipleChoice,
        'SingleChoiceSet': formatSingleChoiceSet,
        'TrueFalse': formatTrueFalse,
        'DialogCards': formatDialogCards,
        'Dictation': formatDictation,
        'SortParagraphs': formatSortParagraphs,
        'FindTheWords': formatFindTheWords,
        'Essay': formatEssay,
        // Modules Éléa (clés courtes)
        'QCM': formatQCM,
        'test_elea': formatMoodleXml,
        'Appariement': formatAppariement,
        'Millionnaire': formatMillionnaire,
        'glossaireXml': formatGlossaireXml,
        'Page': formatPage,
        'Livre': formatLivre,
        'Devoir': formatDevoir,
        // Documents de parcours — voir `formatParcoursDocument` : la structure
        // est AUTODESCRIPTIVE, elle porte ses propres libellés.
        'parcours_document': formatParcoursDocument,
        // Modules Éléa (clés longues — utilisées par l'éditeur)
        'elea_qcm': formatQCM,
        'elea_test': formatMoodleXml,
        'elea_appariement': formatAppariement,
        'elea_millionnaire': formatMillionnaire,
        'elea_glossaire': formatGlossaireXml,
        'elea_page': formatPage,
        'elea_livre': formatLivre,
        'elea_devoir': formatDevoir,
        'CoursePresentation': formatCoursePresentation,
        'InteractiveBook': formatInteractiveBook,
        'InteractiveVideo': formatVideoInteractive,
        'ImageHotspots': formatImageHotspots,
        'FindTheHotspot': formatFindTheHotspot,
        'FindMultipleHotspots': formatFindMultipleHotspots
    };

    const formatter = formatters[moduleKey];
    if (!formatter) {
        const genericResult = formatGeneric(moduleKey, jsonData);
        return options.keepLatex ? genericResult : postProcessLatex(genericResult);
    }

    // formatChart est async (chargement paresseux de chart-renderer.js)
    const result = await formatter(jsonData);
    // Un espacement vide juste avant un saut explicite peut déborder seul et
    // créer une page blanche dans l'ODT. Le saut fournit déjà la séparation.
    result.sections = result.sections.filter((section, index, sections) =>
        section.type !== 'separator' || (sections[index + 1] && sections[index + 1].type !== 'pageBreak'));
    return options.keepLatex ? result : postProcessLatex(result);
}

/**
 * Extrait l'URL d'une image media (mediaImage ou backgroundImage) depuis les données.
 * Retourne le dataURL si disponible, sinon le path relatif.
 * @param {Object|undefined} imageField - Le champ image (ex: data.mediaImage)
 * @returns {string|null} - URL utilisable pour l'export, ou null
 */
function getMediaImageUrl(imageField) {
    if (!imageField) return null;
    return imageField.dataURL || imageField.path || null;
}

/**
 * Formatte un Quiz (mixte, QCM ou Vrai/Faux)
 * Structure pédagogique : énoncé pour élèves + saut de page + correction
 */
function formatQuizSet(data) {
    const sections = [];
    // Le tirage papier reste déterministe, et le corrigé porte sur le même lot.
    if(Number(data.poolSize)>0)data={...data,questions:(data.questions||[]).slice(0,Number(data.poolSize))};
    const title = data.title || t('doc_fmt_quiz_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ (pour les élèves)
    // ========================================

    // En-tête
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.description) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.description),
            style: 'description'
        });
    }

    if(data.introPage?.showIntroPage) {
        if(data.introPage.title)sections.push({type:'header',level:2,text:cleanHtml(data.introPage.title)});
        if(data.introPage.introduction)sections.push({type:'paragraph',text:cleanHtml(data.introPage.introduction),style:'description'});
        if(data.introPage.backgroundImage?.path || data.introPage.backgroundImage?.dataURL) {
            const illustration=[];
            formatQuestionMedia({media:{type:{library:'H5P.Image 1.1',params:{file:data.introPage.backgroundImage,alt:data.introPage.backgroundImageAltText}}}},illustration);
            for(const section of illustration)if(section.type==='image')section.imgSizeMm=140;
            sections.push(...illustration, {type:'pageBreak'});
        }
    }

    // Instructions
    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_instructions'),
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    // Questions (énoncé uniquement)
    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
            const questionStart=sections.length;
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_question_header')} ${index + 1}`
            });

            // Titre de la question (metadata.title)
            if (question.metadata && question.metadata.title) {
                sections.push({
                    type: 'paragraph',
                    text: cleanHtml(question.metadata.title),
                    style: 'subtitle'
                });
            }

            // Contenu de la question
            const params = question.params || {};

            if (params.question) {
                sections.push({
                    type: 'paragraph',
                    text: cleanHtml(params.question),
                    style: 'question'
                });
            }

            // Image de contexte, après l'énoncé et avant les propositions — même
            // placement que `formatMultipleChoice` pour une question autonome. Sans
            // ça, l'image d'une question DANS un questionnaire était perdue aux trois
            // formats : le modèle porte bien `params.mediaImage`, seul ce formatter
            // omettait de l'émettre. Les énoncés spécialisés gèrent désormais leur média :
            // ce repli ne doit pas le dupliquer lorsqu'un pont fournit aussi mediaImage.
            const qImageUrl = getMediaImageUrl(params.mediaImage);
            const statementHandlesMedia = /H5P\.(MultiChoice|TrueFalse|Blanks|DragText|MarkTheWords|Essay)\b/.test(question.library || '');
            if (qImageUrl && !statementHandlesMedia) {
                sections.push({ type: 'image', url: qImageUrl });
            }

            // Propositions de réponse (sans indication de la bonne réponse)
            if (question.library && question.library.includes('MultiChoice')) {
                formatMultiChoiceStatement(params, sections);
            } else if (question.library && question.library.includes('TrueFalse')) {
                formatTrueFalseStatement(params, sections);
            } else if (question.library && question.library.includes('Blanks')) {
                formatBlanksStatement(params, sections);
            } else if (question.library && question.library.includes('DragText')) {
                formatDragTextStatement(params, sections);
            } else if (question.library && question.library.includes('MarkTheWords')) {
                formatMarkWordsStatement(params, sections);
            } else if (question.library && question.library.includes('Essay')) {
                formatEssayStatement(params, sections);
            } else if (question.library && question.library.includes('DragQuestion')) {
                formatDragQuestionStatement(params, sections);
            }

            const group=sections.slice(questionStart);
            if(group.every(s=>['header','paragraph','checkbox'].includes(s.type)))group.slice(0,-1).forEach(s=>s.keepWithNext=true);
            sections.push({ type: 'separator' });
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    // Correction pour chaque question
    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_question_header')} ${index + 1}`
            });

            const params = question.params || {};

            // Correction selon le type de question
            if (question.library && question.library.includes('MultiChoice')) {
                formatMultiChoiceCorrection(params, sections);
            } else if (question.library && question.library.includes('TrueFalse')) {
                formatTrueFalseCorrection(params, sections);
            } else if (question.library && question.library.includes('Blanks')) {
                formatBlanksCorrection(params, sections);
            } else if (question.library && question.library.includes('DragText')) {
                formatDragTextCorrection(params, sections);
            } else if (question.library && question.library.includes('MarkTheWords')) {
                formatMarkWordsCorrection(params, sections);
            } else if (question.library && question.library.includes('Essay')) {
                formatEssayCorrection(params, sections);
            } else if (question.library && question.library.includes('DragQuestion')) {
                formatDragQuestionCorrection(params, sections);
            }

            sections.push({ type: 'separator' });
        });
    }

    return {
        title,
        sections
    };
}

/**
 * Formate une Vidéo interactive (format intermédiaire plat).
 * Énoncé (questions triées par timestamp « À mm:ss ») → saut de page → correction → résumé.
 */
function formatVideoInteractive(data) {
    if(data.interactiveVideo){
        const iv=data.interactiveVideo,video=iv.video||{},chapters=(iv.assets?.interactions||[]).map(item=>({library:'H5P.Column 1.22',metadata:{title:`${Number(item.duration?.from||0).toFixed(1)} s — ${cleanHtml(item.label||item.action?.metadata?.title||'')}`},params:{content:[{content:item.action}]}}));
        if(iv.summary?.task?.params?.summaries?.some(s=>s.summary?.length))chapters.push({library:'H5P.Column 1.22',metadata:{title:t('editor_iv_section_summary')},params:{content:[{content:iv.summary.task}]}});
        return formatNativeInteractiveBook({documentKind:'video',title:data.title||video.startScreenOptions?.title||t('h5p_interactive_video_name'),showCoverPage:true,bookCover:{coverDescription:video.startScreenOptions?.shortStartDescription,coverMedium:{library:'H5P.Video 1.6',params:{sources:video.files,visuals:{poster:video.startScreenOptions?.poster}}}},chapters});
    }

    const sections = [];
    const title = data.title || t('doc_fmt_video_title') || 'Vidéo interactive';
    const mmss = (s) => {
        s = Math.max(0, Math.floor(Number(s) || 0));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    };
    const atLabel = t('doc_fmt_video_at') || 'À';
    const interactions = Array.isArray(data.interactions)
        ? [...data.interactions].sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0))
        : [];

    // PARTIE 1 — énoncé
    sections.push({ type: 'header', level: 1, text: title });
    // Lien de la vidéo : sans lui, les horodatages « À mm:ss » ne renvoient à aucune vidéo identifiable.
    // Dérivé du format intermédiaire (videoSource, chaîne ou objet) OU du content.json natif
    // (interactiveVideo.video.files[] — cas d'une vidéo interactive déposée et éditée côté Sucrerie).
    const videoUrl = (typeof data.videoSource === 'string' ? data.videoSource : (data.videoSource && data.videoSource.url))
        || (data.interactiveVideo && data.interactiveVideo.video && Array.isArray(data.interactiveVideo.video.files)
            && data.interactiveVideo.video.files[0] && data.interactiveVideo.video.files[0].path)
        || '';
    // Instructions spécifiques vidéo (repli sur les instructions génériques).
    sections.push({ type: 'paragraph', text: t('doc_fmt_video_instructions') || t('doc_fmt_instructions'), style: 'instructions' });
    if (videoUrl) {
        sections.push({ type: 'paragraph', text: `${t('doc_fmt_video_link') || 'Lien de la vidéo'} : ${videoUrl}`, style: 'instructions' });
        // QR code de la vidéo source JUSTE SOUS LE LIEN : permet de scanner le papier pour ouvrir
        // et lire la vidéo. Le PNG est généré au moment de prepareImages (section `qrText`).
        sections.push({
            type: 'image',
            qrText: videoUrl,
            imgSizeMm: 32,
            caption: t('doc_fmt_video_qr_caption') || 'Scannez pour ouvrir la vidéo',
            alt: 'QR code'
        });
    }
    sections.push({ type: 'separator' });

    interactions.forEach((it, index) => {
        const type = String(it.type || 'multichoice').toLowerCase();
        sections.push({ type: 'header', level: 2, text: `${atLabel} ${mmss(it.timestamp)} — ${t('doc_fmt_question_header')} ${index + 1}` });
        if (type === 'blanks') {
            const masked = String(it.text || '').replace(/\*([^*]+)\*/g, '______');
            sections.push({ type: 'paragraph', text: cleanHtml(masked), style: 'question' });
        } else {
            if (it.question) sections.push({ type: 'paragraph', text: cleanHtml(it.question), style: 'question' });
            sections.push({ type: 'paragraph', text: t('doc_fmt_proposed_answers') || 'Propositions :', style: 'answersTitle' });
            if (type === 'multichoice' && Array.isArray(it.answers)) {
                it.answers.forEach((a, i) => sections.push({ type: 'checkbox', text: `${String.fromCharCode(65 + i)}. ${cleanHtml(a.text)}` }));
            } else if (type === 'truefalse') {
                sections.push({ type: 'checkbox', text: `A. ${t('doc_fmt_true') || 'Vrai'}` });
                sections.push({ type: 'checkbox', text: `B. ${t('doc_fmt_false') || 'Faux'}` });
            }
        }
        sections.push({ type: 'separator' });
    });

    // SAUT DE PAGE + CORRECTION
    sections.push({ type: 'pageBreak' });
    sections.push({ type: 'header', level: 1, text: t('doc_fmt_correction_title') || 'Correction' });
    sections.push({ type: 'separator' });

    interactions.forEach((it, index) => {
        const type = String(it.type || 'multichoice').toLowerCase();
        sections.push({ type: 'header', level: 2, text: `${atLabel} ${mmss(it.timestamp)} — ${t('doc_fmt_question_header')} ${index + 1}` });
        if (type === 'multichoice' && Array.isArray(it.answers)) {
            const correct = it.answers.map((a, i) => ({ a, l: String.fromCharCode(65 + i) })).filter(x => x.a.correct);
            if (correct.length) {
                sections.push({ type: 'paragraph', text: `${t('doc_fmt_correct_answer') || 'Bonne(s) réponse(s)'} : ${correct.map(x => `${x.l}. ${cleanHtml(x.a.text)}`).join(', ')}`, style: 'correctAnswer' });
            }
            it.answers.forEach((a, i) => { if (a.feedback) sections.push({ type: 'paragraph', text: `${String.fromCharCode(65 + i)}. ${cleanHtml(a.feedback)}`, style: 'tip' }); });
        } else if (type === 'truefalse') {
            const isTrue = (it.correct === true || it.correct === 'true');
            sections.push({ type: 'paragraph', text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${isTrue ? (t('doc_fmt_true') || 'Vrai') : (t('doc_fmt_false') || 'Faux')}`, style: 'correctAnswer' });
            if (it.feedbackOnCorrect) sections.push({ type: 'paragraph', text: cleanHtml(it.feedbackOnCorrect), style: 'tip' });
            if (it.feedbackOnWrong) sections.push({ type: 'paragraph', text: cleanHtml(it.feedbackOnWrong), style: 'tip' });
        } else if (type === 'blanks') {
            const answers = [...String(it.text || '').matchAll(/\*([^*]+)\*/g)].map(m => m[1].split('/')[0].split(':')[0]);
            if (answers.length) {
                sections.push({ type: 'paragraph', text: `${t('doc_fmt_correct_answer') || 'Réponse(s)'} : ${answers.map(cleanHtml).join(', ')}`, style: 'correctAnswer' });
            }
        }
        sections.push({ type: 'separator' });
    });

    // RÉSUMÉ FINAL
    if (data.summary && Array.isArray(data.summary.statements) && data.summary.statements.length) {
        sections.push({ type: 'pageBreak' });
        sections.push({ type: 'header', level: 1, text: t('doc_fmt_video_summary') || 'Résumé' });
        if (data.summary.intro) sections.push({ type: 'paragraph', text: cleanHtml(data.summary.intro), style: 'instructions' });
        sections.push({ type: 'separator' });
        data.summary.statements.forEach((group, gi) => {
            if (!Array.isArray(group) || !group.length) return;
            sections.push({ type: 'header', level: 2, text: `${t('doc_fmt_question_header')} ${gi + 1}` });
            // Anti-divulgation : dans le player H5P les affirmations sont mélangées ; sur papier on
            // dé-positionne de façon déterministe (rotation selon l'index du groupe) pour que la bonne
            // affirmation (`group[0]`) ne soit pas systématiquement la 1ʳᵉ proposée. La correction
            // ci-dessous l'identifie par son TEXTE → l'ordre d'affichage est sans incidence.
            const off = group.length > 1 ? (gi + 1) % group.length : 0;
            const shown = group.slice(off).concat(group.slice(0, off));
            shown.forEach((s) => sections.push({ type: 'checkbox', text: cleanHtml(s) }));
            sections.push({ type: 'paragraph', text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${cleanHtml(group[0])}`, style: 'correctAnswer' });
            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formate une « Image interactive » (H5P.ImageHotspots) pour l'export documentaire.
 * Gère le format intermédiaire plat ({hotspots:[{x,y,header,text}], image, globalColor}) ET le
 * content.json v1.11 ({hotspots:[{position:{x,y}, header, content:[H5P.Text]}]}). Produit :
 * l'image de fond avec PASTILLES NUMÉROTÉES (1..N) pré-composées au canvas, puis une LÉGENDE
 * numérotée (titre du point en en-tête « N. … » + texte). L'image de fond est résolue par
 * `data._backgroundImage` (data URL injectée à l'export par la couche UI Caramel) ou, à défaut, depuis
 * le registre d'export `getAllImages()` via `data.image.path` (cas Sucrerie, sans couche UI). Jamais
 * demandée au LLM. Fonction byte-identique Caramel/Sucrerie (cf. CLAUDE.md item 7).
 * @param {Object} data
 * @returns {Promise<{title:string, sections:Array}>}
 */
async function formatImageHotspots(data) {
    const sections = [];
    const title = data.title || (data.metadata && data.metadata.title) || t('doc_fmt_image_hotspots_title') || 'Image interactive';
    const color = data.globalColor || '#981d99';

    // Normaliser les points : format plat {x,y,header,text} OU content.json {position:{x,y}, header,
    // content:[{library:'H5P.Text 1.1', params:{text}}]}.
    const rawHotspots = Array.isArray(data.hotspots) ? data.hotspots : [];
    const points = rawHotspots.map((h, i) => {
        const x = (h.position && h.position.x != null) ? h.position.x : h.x;
        const y = (h.position && h.position.y != null) ? h.position.y : h.y;
        let text = h.text;
        if (text == null && Array.isArray(h.content)) {
            const txt = h.content.find(c => c && c.library && /H5P\.Text/i.test(c.library) && c.params);
            text = txt ? txt.params.text : '';
        }
        return { n: i + 1, x, y, header: h.header || '', text: text || '', content: h.content || [] };
    });

    sections.push({ type: 'header', level: 1, text: title });
    if (data.backgroundImageAltText) {
        sections.push({ type: 'paragraph', text: cleanHtml(data.backgroundImageAltText), style: 'instructions' });
    }

    // Image de fond → pastilles numérotées (PNG pré-composé au canvas). 1) data URL injectée par la
    // couche UI (Caramel : `_backgroundImage`) ou portée par le modèle ; 2) à défaut, lue depuis le
    // registre d'export `getAllImages()` via `data.image.path` (Sucrerie). Absente → légende seule.
    let bg = data._backgroundImage || (data.image && data.image.dataURL) || '';
    if (!bg && data.image && data.image.path) {
        try {
            const { getAllImages } = await import('../h5p/image-manager.js');
            const blob = getAllImages().get(data.image.path);
            if (blob) {
                bg = await new Promise((resolve) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result);
                    r.onerror = () => resolve('');
                    r.readAsDataURL(blob);
                });
            }
        } catch (e) {
            // Registre indisponible (Caramel passe par `_backgroundImage`) → légende seule.
        }
    }
    if (bg) {
        try {
            const { composeNumberedHotspotImage } = await import('../renderers/hotspot-overlay-renderer.js');
            const overlay = await composeNumberedHotspotImage(
                bg,
                points.map(p => ({ x: p.x, y: p.y, n: p.n })),
                { color }
            );
            if (overlay) {
                // `url` (data URL) → la pré-passe d'images de document-exporter le convertit en `imageData`
                // structuré ({blob,width,height,dataURL,mimeType}) consommé par les rendus DOCX/ODT/PDF.
                sections.push({ type: 'image', url: overlay, fillWidth: true, alt: data.backgroundImageAltText || title });
            }
        } catch (e) {
            // Composition impossible (canvas/chargement) → on continue avec la légende seule.
        }
    }
    sections.push({ type: bg && points.some(p=>p.content.some(n=>n.library?.startsWith('H5P.Image'))) ? 'pageBreak' : 'separator' });

    // Légende numérotée. ⚠️ Titre de point en EN-TÊTE « N. … » (pas un paragraphe « N. » isolé : Word
    // et LibreOffice transformeraient « N. » en liste auto et casseraient la numérotation). Le texte
    // du point suit en paragraphe normal (ne commence pas par « N. »).
    if (points.length) {
        sections.push({ type: 'header', level: 2, text: t('doc_fmt_image_hotspots_legend') || 'Légende' });
    }
    points.forEach(p => {
        const head = p.header ? `${p.n}. ${cleanHtml(p.header)}` : `${p.n}.`;
        sections.push({ type: 'header', level: 3, text: head });
        if (!p.content.length && p.text) sections.push({ type: 'paragraph', text: cleanHtml(p.text), style: 'question' });
        for (const node of p.content) {
            if (node.library?.startsWith('H5P.Text')) {
                if (node.params?.text) sections.push({type:'paragraph',text:cleanHtml(node.params.text),style:'question'});
            } else formatQuestionMedia({media:{type:node}},sections);
        }
    });

    return { title, sections };
}

/**
 * Formate un « Find the Hotspot » (H5P.ImageHotspotQuestion) pour l'export documentaire.
 * @param {Object} data
 * @returns {Promise<{title:string, sections:Array}>}
 */
function formatFindTheHotspot(data) {
    return formatHotspotQuestion(data, 'imageHotspotQuestion', t('doc_fmt_find_the_hotspot_title') || 'Trouver la zone');
}

/**
 * Formate un « Find Multiple Hotspots » (H5P.ImageMultipleHotspotQuestion) pour l'export documentaire.
 * @param {Object} data
 * @returns {Promise<{title:string, sections:Array}>}
 */
function formatFindMultipleHotspots(data) {
    return formatHotspotQuestion(data, 'imageMultipleHotspotQuestion', t('doc_fmt_find_multiple_hotspots_title') || 'Trouver les zones');
}

/**
 * Formate les deux activités « zones à trouver sur une image » pour l'export documentaire.
 * Gère le format intermédiaire plat ({taskDescription, hotspots:[{x,y,correct,feedbackText,label}]},
 * x/y = CENTRES en %) ET le content.json complet ({[rootKey]: {backgroundImageSettings,
 * hotspotSettings.hotspot[].computedSettings}}, x/y = coins haut-gauche + width/height). Produit :
 * l'ÉNONCÉ élève (consigne + image de fond NUE — les zones sont la réponse), un saut de page, puis
 * la CORRECTION (image avec pastilles numérotées pré-composées au canvas + légende ✓/✗ + feedbacks).
 * L'image de fond est résolue par `data._backgroundImage` (data URL injectée à l'export par la couche
 * UI Caramel) ou, à défaut, depuis le registre d'export `getAllImages()` (cas Sucrerie, sans couche
 * UI). Jamais demandée au LLM. Fonction byte-identique Caramel/Sucrerie (cf. CLAUDE.md item 7).
 * @param {Object} data
 * @param {string} rootKey - 'imageHotspotQuestion' | 'imageMultipleHotspotQuestion'.
 * @param {string} fallbackTitle
 * @returns {Promise<{title:string, sections:Array}>}
 */
async function formatHotspotQuestion(data, rootKey, fallbackTitle) {
    const sections = [];
    const isMultiple = rootKey === 'imageMultipleHotspotQuestion';
    const root = (data && data[rootKey]) || null;
    const hs = (root && root.hotspotSettings) || {};

    // Normaliser les zones vers {n, cx, cy (centres %), correct, label, feedback}.
    const rawHotspots = Array.isArray(data.hotspots) ? data.hotspots
        : (Array.isArray(hs.hotspot) ? hs.hotspot : []);
    const points = rawHotspots.map((h, i) => {
        const cs = h.computedSettings;
        const cx = cs ? (Number(cs.x) || 0) + (Number(cs.width) || 0) / 2 : h.x;
        const cy = cs ? (Number(cs.y) || 0) + (Number(cs.height) || 0) / 2 : h.y;
        const us = h.userSettings || h;
        return {
            n: i + 1,
            x: cx, y: cy,
            correct: us.correct === true,
            label: h.label || '',
            feedback: us.feedbackText || ''
        };
    });

    const questionTitle = isMultiple
        ? (data.questionTitle || (root && root.backgroundImageSettings && root.backgroundImageSettings.questionTitle))
        : null;
    const title = data.title || questionTitle || (data.metadata && data.metadata.title) || fallbackTitle;
    const taskDescription = data.taskDescription || hs.taskDescription || '';
    const numberHotspots = isMultiple
        ? (data.numberHotspots || hs.numberHotspots || points.filter(p => p.correct).length)
        : null;

    // --- Énoncé élève : consigne + image NUE (les zones sont la réponse). ---
    sections.push({ type: 'header', level: 1, text: title });
    if (taskDescription) {
        sections.push({ type: 'paragraph', text: cleanHtml(taskDescription), style: 'instructions' });
    }
    if (isMultiple && numberHotspots) {
        sections.push({
            type: 'paragraph',
            text: (t('doc_fmt_hotspot_zones_to_find') || 'Nombre de zones à trouver : {n}').replace('{n}', String(numberHotspots)),
            style: 'instructions'
        });
    }

    // Image de fond : 1) data URL injectée par la couche UI (Caramel : `_backgroundImage`) ou portée
    // par le modèle ; 2) à défaut, lue depuis le registre d'export `getAllImages()` (Sucrerie).
    const imgField = (data.image && (data.image.dataURL || data.image.path)) ? data.image
        : (root && root.backgroundImageSettings
            ? (isMultiple ? root.backgroundImageSettings.backgroundImage : root.backgroundImageSettings)
            : null);
    let bg = data._backgroundImage || (imgField && imgField.dataURL) || '';
    if (!bg && imgField && imgField.path) {
        try {
            const { getAllImages } = await import('../h5p/image-manager.js');
            const blob = getAllImages().get(imgField.path);
            if (blob) {
                bg = await new Promise((resolve) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result);
                    r.onerror = () => resolve('');
                    r.readAsDataURL(blob);
                });
            }
        } catch (e) {
            // Registre indisponible (Caramel passe par `_backgroundImage`) → légende seule.
        }
    }
    if (bg) {
        sections.push({ type: 'image', url: bg, fillWidth: true, alt: taskDescription || title });
    }

    // --- Correction : image avec pastilles numérotées + légende ✓/✗ + feedbacks. ---
    sections.push({ type: 'pageBreak' });
    sections.push({ type: 'header', level: 2, text: t('doc_fmt_correction_title') || 'Correction' });
    if (bg && points.length) {
        try {
            const { composeNumberedHotspotImage } = await import('../renderers/hotspot-overlay-renderer.js');
            const overlay = await composeNumberedHotspotImage(
                bg,
                points.map(p => ({ x: p.x, y: p.y, n: p.n }))
            );
            if (overlay) {
                sections.push({ type: 'image', url: overlay, fillWidth: true, alt: title });
            }
        } catch (e) {
            // Composition impossible (canvas/chargement) → on continue avec la légende seule.
        }
    }
    if (points.length) {
        sections.push({ type: 'header', level: 2, text: t('doc_fmt_image_hotspots_legend') || 'Légende' });
    }
    points.forEach(p => {
        const mark = p.correct
            ? `✓ ${t('doc_fmt_hotspot_correct') || 'Zone correcte'}`
            : `✗ ${t('doc_fmt_hotspot_incorrect') || 'Zone incorrecte'}`;
        // Titre de zone en EN-TÊTE « N. … » (même garde-fou anti-liste auto qu'Image interactive).
        const head = p.label ? `${p.n}. ${cleanHtml(p.label)} — ${mark}` : `${p.n}. ${mark}`;
        sections.push({ type: 'header', level: 3, text: head });
        if (p.feedback) sections.push({ type: 'paragraph', text: cleanHtml(p.feedback), style: 'question' });
    });

    return { title, sections };
}

/**
 * Formate l'énoncé d'une question à choix multiples (sans indication des bonnes réponses)
 */
function formatMultiChoiceStatement(params, sections) {
    formatQuestionMedia(params, sections);
    if (params.answers && Array.isArray(params.answers)) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_proposed_answers') || 'Propositions :',
            style: 'answersTitle'
        });

        params.answers.forEach((answer, i) => {
            const letter = String.fromCharCode(65 + i); // A, B, C, D...
            sections.push({type:'checkbox',text:`${letter}. ${cleanHtml(answer.text)}`});
            if(answer.tipsAndFeedback?.tip)sections.push({type:'paragraph',text:`${t('editor_tip')} ${letter} : ${cleanHtml(answer.tipsAndFeedback.tip)}`,style:'description'});
        });
    }
}

/**
 * Formate la correction d'une question à choix multiples
 */
function formatMultiChoiceCorrection(params, sections) {
    if (params.answers && Array.isArray(params.answers)) {
        const correctAnswers = params.answers
            .map((answer, i) => ({ answer, letter: String.fromCharCode(65 + i) }))
            .filter(item => item.answer.correct);

        if (correctAnswers.length > 0) {
            const answerText = correctAnswers.map(item =>
                `${item.letter}. ${cleanHtml(item.answer.text)}`
            ).join(', ');

            sections.push({
                type: 'paragraph',
                text: `${t('doc_fmt_correct_answer') || 'Bonne(s) réponse(s)'} : ${answerText}`,
                style: 'correctAnswer'
            });
        }
    }
    for (const [index,answer] of (params.answers || []).entries()) {
        for (const [key,label] of [['chosenFeedback','editor_chosen_feedback'],['notChosenFeedback','editor_not_chosen_feedback']]) {
            if(answer.tipsAndFeedback?.[key])sections.push({type:'paragraph',text:`${String.fromCharCode(65+index)} — ${t(label)} : ${cleanHtml(answer.tipsAndFeedback[key])}`,style:'description'});
        }
    }

}

/**
 * Formate l'énoncé d'une question Vrai/Faux (sans indication de la bonne réponse)
 */
function formatTrueFalseStatement(params, sections) {
    formatQuestionMedia(params, sections);
    const trueLabel = (params.l10n && params.l10n.trueText) ? cleanHtml(params.l10n.trueText) : (t('doc_fmt_true') || 'Vrai');
    const falseLabel = (params.l10n && params.l10n.falseText) ? cleanHtml(params.l10n.falseText) : (t('doc_fmt_false') || 'Faux');

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_proposed_answers') || 'Propositions :',
        style: 'answersTitle'
    });

    sections.push({
        type: 'checkbox',
        text: `A. ${trueLabel}`
    });

    sections.push({
        type: 'checkbox',
        text: `B. ${falseLabel}`
    });
}

/**
 * Formate la correction d'une question Vrai/Faux
 */
function formatTrueFalseCorrection(params, sections) {
    const correct = params.correct === 'true' || params.correct === true;
    const trueLabel = (params.l10n && params.l10n.trueText) ? cleanHtml(params.l10n.trueText) : (t('doc_fmt_true') || 'Vrai');
    const falseLabel = (params.l10n && params.l10n.falseText) ? cleanHtml(params.l10n.falseText) : (t('doc_fmt_false') || 'Faux');

    sections.push({
        type: 'paragraph',
        text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${correct ? `A. ${trueLabel}` : `B. ${falseLabel}`}`,
        style: 'correctAnswer'
    });
    for (const [key,label] of [['feedbackOnCorrect','editor_feedback_correct'],['feedbackOnWrong','editor_feedback_wrong']]) {
        const feedback=params[key] ?? params.behaviour?.[key];
        if(feedback)sections.push({type:'paragraph',text:`${t(label)} : ${cleanHtml(feedback)}`,style:'description'});
    }

}

/**
 * Formate l'énoncé d'une question à texte à trous (avec les trous à compléter)
 */
function formatBlanksStatement(params, sections) {
    if (params.taskDescription || params.text) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(params.taskDescription ?? params.text),
            style: 'description'
        });
    }

    formatQuestionMedia(params, sections);
    let blankIndex=0;
    for (const q of params.questions || []) {
        for (const match of cleanHtml(q).matchAll(/\*([^*]+)\*/g)) {
            blankIndex++;
            const colon=match[1].indexOf(':');
            if(colon!==-1)sections.push({type:'paragraph',text:`${t('editor_tip')} ${blankIndex} : ${match[1].slice(colon+1)}`,style:'description'});
        }
    }

    // Extraire le texte avec les trous (remplacer les réponses par des tirets)
    if (params.questions && Array.isArray(params.questions)) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_text_to_complete') || 'Texte à compléter :',
            style: 'answersTitle'
        });
        params.questions.forEach(q => {
            // Remplacer les réponses entre astérisques par des blancs
            const textWithBlanks = cleanHtml(q).replace(/\*([^*]+)\*/g, '_________');
            sections.push({
                type: 'paragraph',
                text: textWithBlanks,
                style: 'blanksText'
            });
        });
    } else if (params.text) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_text_to_complete') || 'Texte à compléter :',
            style: 'answersTitle'
        });
        const textWithBlanks = cleanHtml(params.text).replace(/\*([^*]+)\*/g, '_________');
        sections.push({
            type: 'paragraph',
            text: textWithBlanks,
            style: 'blanksText'
        });
    }
}

/**
 * Formate la correction d'une question à texte à trous
 */
function formatBlanksCorrection(params, sections) {
    // Extraire les bonnes réponses
    const answers = [];

    if (params.questions && Array.isArray(params.questions)) {
        params.questions.forEach(q => {
            const matches = cleanHtml(q).match(/\*([^*]+)\*/g);
            if (matches) {
                matches.forEach(match => {
                    // Nettoyer et extraire la première réponse (avant le /)
                    const answer = match.replace(/\*/g, '').split(':')[0].split('/').map(s=>s.trim()).join(' / ');
                    answers.push(answer);
                });
            }
        });
    } else if (params.text) {
        const matches = cleanHtml(params.text).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                const answer = match.replace(/\*/g, '').split(':')[0].split('/').map(s=>s.trim()).join(' / ');
                answers.push(answer);
            });
        }
    }

    if (answers.length > 0) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_correct_answers') || 'Réponses correctes :',
            style: 'answersTitle'
        });

        answers.forEach((answer, i) => {
            sections.push({
                type: 'bulletPoint',
                text: `${i + 1}. ${answer}`,
                style: 'correctAnswer'
            });
        });
    }
}

/** Extrait la réponse selon la grammaire native DragText (indice et retours exclus). */
function dragTextAnswer(marked) {
    return parseDragTextWord(marked).answer.trim();
}

function formatQuestionMedia(data, sections) {
    const media=data.media?.type, params=media?.params || {};
    const image = media?.library?.startsWith('H5P.Image') ? params.file : !media ? data.mediaImage : null;
    const file = image || (media?.library?.startsWith('H5P.Audio') ? params.files?.[0] : params.sources?.[0]);
    if (image) {
        const url=getMediaImageUrl(image);
        if (url) sections.push({type:'image',url,alt:params.alt || data.mediaImageAlt || ''});
    } else if (file?.path) {
        const path=file.path;
        sections.push({type:'paragraph',text:/^https?:/.test(path) ? `${t('editor_question_media')} : ${path}` : t('doc_fmt_question_embedded_media'),style:'description'});
    }
    const credits=file?.copyright;
    if (credits) {
        // « U » (undisclosed) est le code H5P d'une licence non renseignée : il ne s'imprime pas.
        const text=[credits.title,credits.author,credits.source,credits.license!=='U'?credits.license:''].filter(Boolean).join(' — ');
        if (text) sections.push({type:'paragraph',text:`${t('editor_credit')} : ${cleanHtml(text)}`,style:'metadata'});
    }
}

function formatDragTextHints(params, sections, correction = false) {
    [...(params.textField || '').matchAll(/\*([^*]+)\*/g)].forEach((match,index) => {
        const word=parseDragTextWord(match[0]);
        if (!correction && word.tip) sections.push({type:'paragraph', text:`${t('editor_tip')} ${index+1} : ${cleanHtml(word.tip)}`, style:'tip'});
        if (correction) for (const [key,label] of [['correctFeedback','editor_feedback_correct'],['incorrectFeedback','editor_feedback_wrong']]) {
            if (word[key]) sections.push({type:'paragraph',text:`${index+1}. ${cleanHtml(word.answer)} — ${t(label)} : ${cleanHtml(word[key])}`,style:'tip'});
        }
    });
}

/** Formate l'énoncé DragText : texte à compléter et ensemble des choix. */
function formatDragTextStatement(params, sections) {
    if (params.taskDescription) sections.push({type:'paragraph',text:cleanHtml(params.taskDescription),style:'question'});
    formatQuestionMedia(params,sections);
    formatDragTextHints(params, sections);
    if (params.textField) {
        // Extraire les mots à placer (entre astérisques)
        const wordsToPlace = [];
        const matches = cleanHtml(params.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                const word = dragTextAnswer(match);
                wordsToPlace.push(word);
            });
        }

        // Texte avec les trous
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_text_to_complete') || 'Texte à compléter :',
            style: 'answersTitle'
        });

        const textWithBlanks = cleanHtml(params.textField).replace(/\*([^*]+)\*/g, '_________');
        sections.push({
            type: 'paragraph',
            text: textWithBlanks,
            style: 'blanksText'
        });

        // Les distracteurs font partie des choix, sans révéler lesquels sont faux.
        wordsToPlace.push(...(cleanHtml(params.distractors || '').match(/\*([^*]+)\*/g) || []).map(dragTextAnswer));

        // Liste des mots à placer (mélangés)
        if (wordsToPlace.length > 0) {
            sections.push({
                type: 'paragraph',
                text: params.distractors ? t('doc_fmt_words_available') : t('doc_fmt_words_to_place'),
                style: 'answersTitle'
            });

            // Mélanger les mots pour l'énoncé
            const shuffled = [...wordsToPlace].sort(() => Math.random() - 0.5);
            sections.push({
                type: 'paragraph',
                text: shuffled.join(' - '),
                style: 'description'
            });
        }
    }
}

/**
 * Formate la correction d'une question "Glisser les mots"
 */
function formatDragTextCorrection(params, sections) {
    formatDragTextHints(params, sections, true);
    if (params.textField) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_completed_text') || 'Texte complété :',
            style: 'answersTitle'
        });

        // Afficher le texte avec les réponses (en gras)
        const textWithAnswers = cleanHtml(params.textField).replace(/\*([^*]+)\*/g, (match, content) => {
            const answer = dragTextAnswer(content);
            return `[${answer}]`;
        });

        sections.push({
            type: 'paragraph',
            text: textWithAnswers,
            style: 'correctAnswer'
        });
    }
}

/**
 * Formate l'énoncé d'une question "Marquer les mots" (texte sans indication des mots à trouver)
 */
function formatMarkWordsStatement(params, sections) {
    formatQuestionMedia(params, sections);
    if (params.textField) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_text_to_mark') || 'Texte dans lequel trouver les mots :',
            style: 'answersTitle'
        });

        // Afficher le texte sans les marqueurs (enlever les astérisques)
        const textClean = cleanHtml(params.textField).replace(/\*([^*]+)\*/g, '$1');
        sections.push({
            type: 'paragraph',
            text: textClean,
            style: 'blanksText'
        });

        // Indication du nombre de mots à trouver
        const matches = cleanHtml(params.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            sections.push({
                type: 'paragraph',
                text: `${t('doc_fmt_words_count_to_find') || 'Nombre de mots à trouver'} : ${matches.length}`,
                style: 'metadata'
            });
        }
    }
}

/**
 * Formate la correction d'une question "Marquer les mots"
 */
function formatMarkWordsCorrection(params, sections) {
    if (params.textField) {
        // Extraire les mots à marquer
        const wordsToMark = [];
        const matches = cleanHtml(params.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                wordsToMark.push(match.replace(/\*/g, ''));
            });
        }

        if (wordsToMark.length > 0) {
            sections.push({
                type: 'paragraph',
                text: t('doc_fmt_words_to_mark') || 'Mots à marquer :',
                style: 'answersTitle'
            });

            wordsToMark.forEach((word, i) => {
                sections.push({
                    type: 'bulletPoint',
                    text: word,
                    style: 'correctAnswer'
                });
            });
        }
    }
}

/**
 * Formate l'énoncé d'une question Essay (question ouverte)
 */
function formatEssayStatement(params, sections) {
    if (params.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(params.taskDescription),
            style: 'description'
        });
    }

    formatQuestionMedia(params, sections);
    for (const [key,label] of [['minimumLength','editor_minimum_words'],['maximumLength','editor_maximum_words']]) {
        if (params.behaviour?.[key] > 0) sections.push({type:'paragraph',text:`${t(label)} : ${params.behaviour[key]}`,style:'description'});
    }

    // Espace pour la réponse de l'élève
    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_answer_space') || 'Espace pour la réponse :',
        style: 'answersTitle'
    });

    sections.push({
        type: 'paragraph',
        text: '___________________________________________________________________\n\n___________________________________________________________________\n\n___________________________________________________________________\n\n___________________________________________________________________',
        style: 'blanksText'
    });
}

/**
 * Formate la correction d'une question Essay
 */
function formatEssayCorrection(params, sections) {
    if (params.solution?.sample || params.solution?.introduction) {
        sections.push({ type: 'paragraph', text: t('editor_essay_sample_answer'), style: 'answersTitle' });
        if (params.solution.introduction) sections.push({ type: 'paragraph', text: cleanHtml(params.solution.introduction), style: 'description' });
        if (params.solution.sample) sections.push({ type: 'paragraph', text: cleanHtml(params.solution.sample), style: 'correctAnswer' });
    }
    if (params.keywords?.length) {
        sections.push({ type: 'paragraph', text: t('doc_fmt_keywords_expected'), style: 'answersTitle' });
        for (const kw of params.keywords) {
            const keyword = cleanHtml(kw.keyword || kw.word || kw.text || (typeof kw === 'string' ? kw : ''));
            const options = kw.options || {};
            const points = options.points ?? kw.points ?? 1;
            const occurrences = options.occurrences ?? 1;
            sections.push({ type: 'bulletPoint', text: `${keyword} — ${t('editor_weight')} : ${points}; ${t('editor_essay_occurrences')} : ${occurrences}`, style: 'correctAnswer' });
            if (Array.isArray(kw.alternatives) && kw.alternatives.length) {
                sections.push({ type: 'paragraph', text: `${t('editor_cloze_alternatives')} : ${kw.alternatives.map(cleanHtml).join(' / ')}`, style: 'description' });
            }
            const behaviour = params.behaviour || {};
            for (const [key, override, label] of [['caseSensitive','overrideCaseSensitive','editor_case_sensitive'],['forgiveMistakes','overrideForgiveMistakes','editor_forgive_mistakes']]) {
                const active = behaviour[override] === 'on' || (behaviour[override] !== 'off' && (options[key] ?? (key === 'caseSensitive')));
                sections.push({type:'paragraph',text:`${t(label)} : ${t(active ? 'editor_true' : 'editor_false')}`,style:'description'});
            }
            for (const [field, label] of [['feedbackIncluded', 'editor_essay_feedback_present'], ['feedbackMissed', 'editor_essay_feedback_absent']]) {
                if (options[field]) sections.push({ type: 'paragraph', text: `${t(label)} : ${cleanHtml(options[field])}`, style: 'description' });
            }
        }
    } else if (!params.solution?.sample) {
        sections.push({ type: 'paragraph', text: t('doc_fmt_open_answer'), style: 'description' });
    }
}

/**
 * Formate l'énoncé d'une question Glisser-déposer dans un QuizSet
 * Version quiz papier : tableau avec en-têtes (zones) et cases vides à remplir + liste des mots
 * (différent du standalone qui utilise grille de travail + étiquettes à découper)
 */
function formatDragQuestionStatement(params, sections) {
    const dropZones = Array.isArray(params.dropZones) ? params.dropZones : [];
    const elements = Array.isArray(params.elements) ? params.elements : [];

    // Consigne de l'exercice (ex: "Classe chaque animal dans la bonne catégorie")
    if (params.title) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(params.title),
            style: 'description'
        });
    }

    // Consigne quiz papier (italique)
    if (elements.length > 0) {
        const consigne = t('doc_fmt_dnd_quiz_consigne') || 'Recopiez les mots ci-dessous dans les bonnes cases du tableau :';
        sections.push({
            type: 'paragraph',
            text: consigne,
            style: 'description'
        });

        // Liste des mots à placer (gras, pas italique)
        const shuffled = elements
            .map(el => cleanHtml(el.text || ''))
            .sort(() => Math.random() - 0.5);
        sections.push({
            type: 'paragraph',
            text: shuffled.join('  —  '),
            style: 'wordList'
        });
    }

    // Tableau avec en-têtes (noms des zones) et cases vides pour écrire
    if (dropZones.length > 0) {
        const headers = dropZones.map(zone => cleanHtml(zone.label || ''));
        // Une seule ligne vide par colonne — l'élève écrit tous les mots dans la case
        const emptyRows = [Array(dropZones.length).fill('')];
        sections.push({
            type: 'table',
            headers: headers,
            rows: emptyRows,
            style: 'workGrid'
        });
    }
}

/**
 * Formate la correction d'une question Glisser-déposer dans un QuizSet
 * Version quiz papier : tableau rempli avec les mots dans les bonnes cases
 * (différent du standalone qui utilise grille complétée + tableau récapitulatif)
 */
function formatDragQuestionCorrection(params, sections) {
    const dropZones = Array.isArray(params.dropZones) ? params.dropZones : [];
    const elements = Array.isArray(params.elements) ? params.elements : [];

    // Tableau corrigé : en-têtes (zones) avec les mots correctement placés
    if (dropZones.length > 0) {
        const headers = dropZones.map(zone => cleanHtml(zone.label || ''));

        // Récupérer les mots corrects pour chaque zone
        const zoneCorrectLabels = dropZones.map(zone => {
            const correctIndices = Array.isArray(zone.correctElements) ? zone.correctElements : [];
            return correctIndices
                .map(idx => elements[idx] ? cleanHtml(elements[idx].text || '') : '')
                .filter(label => label);
        });

        const maxPerZone = Math.max(...zoneCorrectLabels.map(l => l.length), 1);
        const filledRows = [];
        for (let row = 0; row < maxPerZone; row++) {
            filledRows.push(zoneCorrectLabels.map(labels => labels[row] || ''));
        }

        sections.push({
            type: 'table',
            headers: headers,
            rows: filledRows,
            style: 'correctionGrid'
        });
    }
}

/**
 * Formate des Flashcards pour impression recto-verso
 * Structure : tableaux 2x4 (8 cartes/page) avec logique miroir pour le verso
 *
 * Logique d'inversion pour impression recto-verso :
 * - Recto : [Carte 1][Carte 2] / [Carte 3][Carte 4] / ...
 * - Verso : [Carte 2][Carte 1] / [Carte 4][Carte 3] / ... (miroir horizontal)
 */
function ajouterCreditsCartes(sections, cards) {
    const credits = cards.flatMap((card, index) => {
        const c = card.image?.copyright;
        if (!c || !['title', 'author', 'source', 'license', 'version', 'licenseVersion'].some(k => c[k] && c[k] !== 'U')) return [];
        return [`${index + 1}. ${[c.title, c.author, c.source, c.license !== 'U' ? c.license : '', c.version || c.licenseVersion].filter(Boolean).map(cleanHtml).join(' — ')}`];
    });
    if (credits.length) {
        sections.push({ type: 'pageBreak' });
        sections.push({ type: 'header', level: 2, text: t('editor_credit') });
        credits.forEach(text => sections.push({ type: 'paragraph', text }));
    }
}

function formatFlashcards(data) {
    const sections = [];
    const title = cleanHtml(data.title || t('doc_fmt_flashcards_title'));
    const cards = data.cards || [];

    // Titre du document en tête, comme les autres formatters (audit Sucrerie
    // 2026-07-05, F6 : les flashcards sortaient sans aucun titre).
    sections.push({ type: 'header', level: 1, text: title });
    if (data.description) sections.push({ type: 'paragraph', text: cleanHtml(data.description), style: 'description' });

    if (cards.length === 0) {
        return { title, sections };
    }

    // Grouper les cartes par pages de 8
    const CARDS_PER_PAGE = 8;
    const pageGroups = [];
    for (let i = 0; i < cards.length; i += CARDS_PER_PAGE) {
        pageGroups.push(cards.slice(i, i + CARDS_PER_PAGE));
    }

    pageGroups.forEach((pageCards, pageIndex) => {
        // Générer les lignes pour le recto (questions)
        const rectoRows = [];
        // Générer les lignes pour le verso (réponses) avec ordre miroir
        const versoRows = [];

        for (let row = 0; row < 4; row++) {
            const leftIndex = row * 2;
            const rightIndex = row * 2 + 1;

            const leftCard = pageCards[leftIndex] || null;
            const rightCard = pageCards[rightIndex] || null;

            // Extraire l'image d'une carte (data URL ou chemin)
            const getCardImage = (card) => {
                if (!card || !card.image || !card.image.path) return null;
                return card.image.dataURL || card.image.path;
            };

            // Recto : ordre normal [gauche, droite]
            rectoRows.push({
                left: leftCard ? {
                    text: cleanHtml(leftCard.text),
                    hint: leftCard.tip ? cleanHtml(typeof leftCard.tip === 'object' ? leftCard.tip?.tip : leftCard.tip) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1,
                    imageUrl: getCardImage(leftCard)
                } : null,
                right: rightCard ? {
                    text: cleanHtml(rightCard.text),
                    hint: rightCard.tip ? cleanHtml(typeof rightCard.tip === 'object' ? rightCard.tip?.tip : rightCard.tip) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1,
                    imageUrl: getCardImage(rightCard)
                } : null
            });

            // Verso : ordre miroir [droite, gauche] pour alignement impression
            versoRows.push({
                left: rightCard ? {
                    text: cleanHtml(rightCard.answer),
                    hint: null, // Flashcards n'ont pas d'indice verso
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1,
                    imageUrl: getCardImage(rightCard)
                } : null,
                right: leftCard ? {
                    text: cleanHtml(leftCard.answer),
                    hint: null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1,
                    imageUrl: getCardImage(leftCard)
                } : null
            });
        }

        // Ajouter la page recto
        sections.push({
            type: 'flashcardTable',
            side: 'recto',
            rows: rectoRows,
            pageNumber: pageIndex + 1,
            totalPages: pageGroups.length
        });

        // Ajouter la page verso (suit immédiatement le recto)
        sections.push({
            type: 'flashcardTable',
            side: 'verso',
            rows: versoRows,
            pageNumber: pageIndex + 1,
            totalPages: pageGroups.length
        });
    });

    ajouterCreditsCartes(sections, cards);
    return { title, sections };
}

/**
 * Formate des mots croisés
 * Structure pédagogique : énoncé (définitions) + saut de page + correction (réponses)
 *
 * Si `data._cluePlacements` est fourni (par crossword-grid-generator), les définitions
 * sont groupées par direction (Horizontalement / Verticalement) et numérotées avec le
 * clueId réel de la grille, ce qui garantit la cohérence entre l'image et la liste.
 * Sinon, fallback sur l'ordre du tableau `data.words`.
 */
function formatCrossword(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_crossword_title');

    const placements = Array.isArray(data._cluePlacements) ? data._cluePlacements : null;
    const unplaced = Array.isArray(data._unplacedWords) ? data._unplacedWords : [];

    // ========================================
    // PARTIE 1 : ÉNONCÉ (définitions uniquement)
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.taskDescription),
            style: 'description'
        });
    }

    sections.push({ type: 'separator' });

    // Image de la grille vide (capturée depuis le H5P)
    if (data._gridImage) {
        sections.push({
            type: 'image',
            imageData: data._gridImage,
            imgSizeMm: 110
        });
    }

    if (placements) {
        appendCrosswordSection(sections, placements, unplaced, 'doc_fmt_definitions', 'Définitions', appendCrosswordClue);
    } else if (data.words && Array.isArray(data.words)) {
        // Fallback : pas de placements disponibles → liste à plat dans l'ordre du JSON
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_definitions') || 'Définitions'
        });
        data.words.forEach((word, index) => appendCrosswordClue(sections, String(index + 1), word));
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    if(data.solutionWord)sections.push({type:'paragraph',text:t('editor_crossword_solution_word')+' (1 → 2 → …) : '+[...data.solutionWord].map(()=> '___').join(' ')});
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    // Image de la grille corrigée (capturée depuis le H5P)
    if (data._solutionGridImage) {
        sections.push({
            type: 'image',
            imageData: data._solutionGridImage,
            imgSizeMm: 110
        });
    }

    if (placements) {
        appendCrosswordSection(sections, placements, unplaced, 'doc_fmt_answers', 'Réponses', appendCrosswordAnswer);
    } else if (data.words && Array.isArray(data.words)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_answers') || 'Réponses'
        });
        data.words.forEach((word, index) => appendCrosswordAnswer(sections, String(index + 1), word));
    }

    if(data.solutionWord)sections.push({type:'paragraph',text:t('editor_crossword_solution_word')+' : '+data.solutionWord,style:'correctAnswer'});
    return { title, sections };
}

/**
 * Ajoute un paragraphe d'indice formaté pour un mot.
 * On utilise « N — text » (en-dash) au lieu de « N. text » : Word et LibreOffice
 * autoformatent agressivement le pattern « N. » en tête de paragraphe en liste
 * numérotée auto-incrémentée, ce qui détruit nos vrais numéros de cases (chaque
 * indice isolé par sa ligne « Indice » devient sa propre liste recommençant à 1).
 * Aucun autoformat ne réagit à « N — ».
 */
function appendCrosswordClue(sections, label, word) {
    const letterCount = word.answer ? word.answer.length : '?';
    sections.push({
        type: 'paragraph',
        text: `${label} — ${cleanHtml(word.clue || '')} (${letterCount} ${t('doc_fmt_letters') || 'lettres'})`,
        style: 'crosswordClue'
    });
    if(word.extraClue?.library && !word.extraClue.library.startsWith('H5P.AdvancedText'))formatQuestionMedia({media:{type:word.extraClue}},sections);
    if (word.extraClue && word.extraClue.params && word.extraClue.params.text) {
        sections.push({
            type: 'paragraph',
            text: `   ${t('doc_fmt_hint') || 'Indice'} : ${cleanHtml(word.extraClue.params.text)}`,
            style: 'tip'
        });
    }
}

/**
 * Ajoute un paragraphe de réponse formaté pour un mot (section correction).
 * Même contrainte d'autoformat que les indices : on utilise « N — text » pour
 * éviter la conversion en liste numérotée auto-incrémentée.
 */
function appendCrosswordAnswer(sections, label, word) {
    sections.push({
        type: 'paragraph',
        text: `${label} — ${word.answer || ''}`,
        style: 'correctAnswer'
    });
}

/**
 * Ajoute une section (Définitions ou Réponses) groupée par direction Horizontal/Vertical,
 * triée par clueId, avec une rubrique « Mots non placés » si nécessaire.
 * @param {Function} renderItem - (sections, label, word) → void
 */
function appendCrosswordSection(sections, placements, unplaced, headerKey, headerFallback, renderItem) {
    const byNum = (a, b) => Number(a.clueId) - Number(b.clueId);
    const across = placements.filter(p => p.direction === 'across').sort(byNum);
    const down = placements.filter(p => p.direction === 'down').sort(byNum);

    sections.push({ type: 'header', level: 2, text: t(headerKey) || headerFallback });

    const subsection = (items, key, fallback, getLabel, getWord) => {
        if (items.length === 0) return;
        sections.push({ type: 'header', level: 3, text: t(key) || fallback });
        items.forEach((item, idx) => renderItem(sections, getLabel(item, idx), getWord(item)));
    };

    subsection(across, 'h5p_crossword_across', 'Horizontal', p => p.clueId, p => p.word);
    subsection(down, 'h5p_crossword_down', 'Vertical', p => p.clueId, p => p.word);
    subsection(unplaced, 'doc_fmt_crossword_unplaced', 'Mots non placés sur la grille', (_w, idx) => String(idx + 1), w => w);
}

/**
 * Formate une Timeline
 */
function formatTimeline(data) {
    const sections = [];
    const timeline = data.timeline || data;
    const title = timeline.headline || 'Timeline';

    sections.push({
        type: 'header',
        level: 1,
        text: cleanHtml(title)
    });

    if (timeline.text) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(timeline.text),
            style: 'description'
        });
    }

    const assetSections = asset => {
        if (!asset) return;
        const url = asset.media || asset.path;
        if (url && (/^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|svg)(?:[?#]|$)/i.test(url))) {
            sections.push({type:'image',url,caption:asset.caption || '',alt:asset.caption || ''});
        } else if (url) sections.push({type:'paragraph',text:url});
        if (asset.caption && !(url && /\.(png|jpe?g|gif|webp|svg)(?:[?#]|$)/i.test(url))) sections.push({type:'paragraph',text:cleanHtml(asset.caption)});
        if (asset.credit) sections.push({type:'paragraph',text:cleanHtml(asset.credit),style:'metadata'});
    };
    assetSections(timeline.asset || timeline.media);

    sections.push({ type: 'separator' });

    // Événements
    if (timeline.date && Array.isArray(timeline.date)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_timeline_events')
        });

        timeline.date.forEach((event, index) => {
            sections.push({
                type: 'header',
                level: 3,
                text: `${h5pDateToLocale(event.startDate, currentLang)}${event.endDate ? ' – '+h5pDateToLocale(event.endDate, currentLang) : ''} - ${cleanHtml(event.headline)}`
            });

            // Image uploadée (eventImage) OU URL (asset.media)
            const eventImageUrl = getMediaImageUrl(event.eventImage);
            if (eventImageUrl) {
                sections.push({
                    type: 'image',
                    url: eventImageUrl,
                    caption: event.eventImageAlt || '',
                    alt: event.eventImageAlt || ''
                });
            } else assetSections(event.asset);

            if (event.text) {
                sections.push({
                    type: 'paragraph',
                    text: cleanHtml(event.text)
                });
            }

            if (event.tag) {
                sections.push({
                    type: 'paragraph',
                    text: event.tag,
                    style: 'metadata'
                });
            }

            sections.push({ type: 'separator' });
        });
    }

    // Ères
    if (timeline.era && Array.isArray(timeline.era)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_timeline_periods')
        });

        timeline.era.forEach((era, index) => {
            sections.push({
                type: 'paragraph',
                text: `${h5pDateToLocale(era.startDate, currentLang)} - ${h5pDateToLocale(era.endDate, currentLang)} : ${cleanHtml(era.headline)}`,
                style: 'timelineEra'
            });

            if (era.tag) sections.push({type:'paragraph',text:era.tag,style:'metadata'});
            if (era.text) {
                sections.push({
                    type: 'paragraph',
                    text: cleanHtml(era.text)
                });
            }
        });
    }

    return { title, sections };
}

/**
 * Formate Drag the Words
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatDragTheWords(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_drag_the_words_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.taskDescription),
            style: 'description'
        });
    }

    formatQuestionMedia(data, sections);

    formatDragTextHints(data, sections);
    if (data.textField) {
        // Extraire les mots à placer (entre astérisques)
        const wordsToPlace = [];
        const matches = cleanHtml(data.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                const word = dragTextAnswer(match);
                wordsToPlace.push(word);
            });
        }

        // Texte avec les trous
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_text_to_complete') || 'Texte à compléter'
        });

        const textWithBlanks = cleanHtml(data.textField).replace(/\*([^*]+)\*/g, '_________');
        sections.push({
            type: 'paragraph',
            text: textWithBlanks,
            style: 'blanksText'
        });

        // Les distracteurs font partie des choix, sans révéler lesquels sont faux.
        wordsToPlace.push(...(cleanHtml(data.distractors || '').match(/\*([^*]+)\*/g) || []).map(dragTextAnswer));

        // Liste des mots à placer (mélangés)
        if (wordsToPlace.length > 0) {
            sections.push({
                type: 'header',
                level: 2,
                text: data.distractors ? t('doc_fmt_words_available') : t('doc_fmt_words_to_place')
            });

            // Mélanger les mots pour l'énoncé
            const shuffled = [...wordsToPlace].sort(() => Math.random() - 0.5);
            sections.push({
                type: 'paragraph',
                text: shuffled.join(' - '),
                style: 'description'
            });
        }
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });
    formatDragTextHints(data, sections, true);

    if (data.textField) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_completed_text') || 'Texte complété'
        });

        // Afficher le texte avec les réponses
        const textWithAnswers = cleanHtml(data.textField).replace(/\*([^*]+)\*/g, (match, content) => {
            const answer = dragTextAnswer(content);
            return `[${answer}]`;
        });

        sections.push({
            type: 'paragraph',
            text: textWithAnswers,
            style: 'correctAnswer'
        });
    }

    return { title, sections };
}

/**
 * Formate Drag and Drop (Glisser-déposer) en activité débranchée
 * Structure pédagogique imprimable :
 * - Page 1 : Consigne + Grille de travail vide + Étiquettes à découper
 * - Page 2 : Correction (grille complétée + tableau récapitulatif)
 */
function formatDragAndDrop(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_drag_and_drop_title');
    const dropZones = Array.isArray(data.dropZones) ? data.dropZones : [];
    const elements = Array.isArray(data.elements) ? data.elements : [];

    // ========================================
    // PARTIE 1 : FICHE ÉLÈVE
    // ========================================

    // Titre
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    // Consigne
    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_dnd_consigne') || 'Découpez les étiquettes ci-dessous et placez-les dans la bonne zone de la grille.',
        style: 'definition'
    });

    sections.push({ type: 'separator' });

    // --- Grille de travail (zones en colonnes, lignes vides) ---
    if (dropZones.length > 0) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_dnd_work_grid') || 'Grille de travail'
        });

        // Répartition intelligente : max 3 colonnes par tableau, jamais de groupe isolé
        // Ex: 2 zones → [2]       4 zones → [2, 2]       7 zones → [3, 2, 2]
        //     3 zones → [3]       5 zones → [3, 2]       8 zones → [3, 3, 2]
        //                         6 zones → [3, 3]       9 zones → [3, 3, 3]
        const zoneGroups = splitIntoBalancedGroups(dropZones);

        zoneGroups.forEach(group => {
            const actualCols = group.length;
            const headers = group.map(zone => cleanHtml(zone.label || ''));

            // 4 lignes vides pour que l'élève place les étiquettes
            const emptyRows = [
                Array(actualCols).fill(''),
                Array(actualCols).fill(''),
                Array(actualCols).fill(''),
                Array(actualCols).fill('')
            ];

            sections.push({
                type: 'table',
                headers: headers,
                rows: emptyRows,
                style: 'workGrid'
            });
        });
    }

    sections.push({ type: 'separator' });

    for (const zone of dropZones) {
        const tip = zone._native?.tipsAndFeedback?.tip || zone.tipsAndFeedback?.tip;
        if (tip) sections.push({type:'paragraph',text:cleanHtml(zone.label || '')+' — '+cleanHtml(tip)});
    }

    // --- Étiquettes à découper (table 3 colonnes, ordre mélangé) ---
    if (elements.length > 0) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_dnd_labels_to_cut') || 'Étiquettes à découper'
        });

        // Mélanger les étiquettes et les numéroter
        const shuffled = elements
            .map((el, i) => ({
                text: cleanHtml(el.text || ''),
                imageUrl: getMediaImageUrl(el.image),
                originalIndex: i
            }))
            .sort(() => Math.random() - 0.5);

        // IMPORTANT : 3 colonnes fixes pour alignement avec la grille de travail
        const LABELS_PER_ROW = 3;
        const labelRows = [];
        for (let i = 0; i < shuffled.length; i += LABELS_PER_ROW) {
            const row = [];
            for (let j = 0; j < LABELS_PER_ROW; j++) {
                if (i + j < shuffled.length) {
                    const item = shuffled[i + j];
                    if (item.imageUrl) {
                        // Étiquette image : objet avec URL pour rendu inline dans la cellule
                        row.push({
                            text: `${i + j + 1}. ${item.text || '[Image]'}`,
                            imageUrl: item.imageUrl
                        });
                    } else {
                        row.push(`${i + j + 1}. ${item.text}`);
                    }
                } else {
                    // Cellule vide pour maintenir les dimensions uniformes
                    row.push('');
                }
            }
            labelRows.push(row);
        }

        sections.push({
            type: 'table',
            headers: [],
            rows: labelRows,
            style: 'cutoutLabels'
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    // --- Grille complétée (zones avec les bonnes réponses) ---
    if (dropZones.length > 0) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_dnd_completed_grid') || 'Grille complétée'
        });

        // Construire un mapping zone → étiquettes correctes (avec image si applicable)
        const zoneCorrectLabels = dropZones.map(zone => {
            const correctIndices = Array.isArray(zone.correctElements) ? zone.correctElements : [];
            return correctIndices
                .map(idx => {
                    if (!elements[idx]) return '';
                    const imageUrl = getMediaImageUrl(elements[idx].image);
                    const text = cleanHtml(elements[idx].text || '') || '[Image]';
                    if (imageUrl) {
                        return { text, imageUrl };
                    }
                    return text;
                })
                .filter(t => t);
        });

        // Répartition intelligente identique à la grille de travail
        // Pour reconstruire les groupes avec les labels associés, on utilise les indices
        const zoneIndices = dropZones.map((_, i) => i);
        const indexGroups = splitIntoBalancedGroups(zoneIndices);

        indexGroups.forEach(idxGroup => {
            const headers = idxGroup.map(i => cleanHtml(dropZones[i].label || ''));
            const labelsForGroup = idxGroup.map(i => zoneCorrectLabels[i]);

            // Trouver le nombre max d'étiquettes dans une zone du groupe
            const maxLabels = Math.max(...labelsForGroup.map(l => l.length), 1);
            const filledRows = [];
            for (let row = 0; row < maxLabels; row++) {
                filledRows.push(labelsForGroup.map(labels => labels[row] || ''));
            }

            sections.push({
                type: 'table',
                headers: headers,
                rows: filledRows,
                style: 'correctionGrid'
            });
        });
    }

    sections.push({ type: 'separator' });

    // --- Tableau récapitulatif ---
    if (dropZones.length > 0) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_dnd_recap_table') || 'Tableau récapitulatif'
        });

        const recapHeaders = [
            t('doc_fmt_dnd_zone_column') || 'Zone',
            t('doc_fmt_dnd_correct_labels') || 'Étiquettes correctes'
        ];

        const recapRows = dropZones.map(zone => {
            const correctIndices = Array.isArray(zone.correctElements) ? zone.correctElements : [];
            const labels = correctIndices
                .map(idx => {
                    if (!elements[idx]) return '';
                    return cleanHtml(elements[idx].text || '');
                })
                .filter(t => t);
            return [
                cleanHtml(zone.label || ''),
                labels.join(', ') || '—'
            ];
        });

        sections.push({
            type: 'table',
            headers: recapHeaders,
            rows: recapRows,
            style: 'recapTable'
        });
    }

    for (const zone of dropZones) {
        const feedback = zone._native?.tipsAndFeedback || zone.tipsAndFeedback || {};
        for (const key of ['feedbackOnCorrect','feedbackOnIncorrect']) {
            if (feedback[key]) sections.push({type:'paragraph',text:cleanHtml(zone.label || '')+' — '+t(key==='feedbackOnCorrect'?'editor_feedback_correct':'editor_feedback_wrong')+' : '+cleanHtml(feedback[key])});
        }
    }
    return { title, sections };
}

/**
 * Formate Fill in the Blanks
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatFillInTheBlanks(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_fill_in_the_blanks_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    formatBlanksStatement(data, sections);

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.questions && Array.isArray(data.questions)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_text_with_answers') || 'Texte avec les réponses'
        });

        data.questions.forEach(q => {
            // Remplacer les mots entre astérisques par les mêmes mots en gras + vert
            // On utilise *** (triple astérisque) pour indiquer "gras + vert"
            const textWithAnswers = cleanHtml(q).replace(/\*([^*]+)\*/g, (match, content) => {
                // Extraire la première réponse (avant le /) et supprimer l'indice (après le :)
                const answer = content.split('/')[0].split(':')[0].trim();
                // Retourner le mot avec triple astérisque (gras + vert)
                return `***${answer}***`;
            });

            sections.push({
                type: 'paragraph',
                text: textWithAnswers,
                style: 'blanksCorrection'
            });
        });
    }

    formatBlanksCorrection(data, sections);

    return { title, sections };
}

/**
 * Formate Mark the Words
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatMarkTheWords(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_mark_the_words_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.taskDescription),
            style: 'description'
        });
    }

    // Image de contexte (après la description, avant le texte)
    formatQuestionMedia(data, sections);

    if (data.textField) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_text_to_mark') || 'Texte dans lequel trouver les mots'
        });

        // Afficher le texte sans les marqueurs (enlever les astérisques)
        const textClean = cleanHtml(data.textField).replace(/\*([^*]+)\*/g, '$1');
        sections.push({
            type: 'paragraph',
            text: textClean,
            style: 'blanksText'
        });

        // Indication du nombre de mots à trouver
        const matches = cleanHtml(data.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            sections.push({
                type: 'paragraph',
                text: `${t('doc_fmt_words_count_to_find') || 'Nombre de mots à trouver'} : ${matches.length}`,
                style: 'metadata'
            });
        }
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.textField) {
        // Extraire les mots à marquer
        const wordsToMark = [];
        const matches = cleanHtml(data.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                wordsToMark.push(match.replace(/\*/g, ''));
            });
        }

        if (wordsToMark.length > 0) {
            sections.push({
                type: 'header',
                level: 2,
                text: t('doc_fmt_words_to_mark') || 'Mots à marquer'
            });

            wordsToMark.forEach(word => {
                sections.push({
                    type: 'bulletPoint',
                    text: word,
                    style: 'correctAnswer'
                });
            });
        }
    }

    return { title, sections };
}

/**
 * Formate un glossaire
 */
function formatGlossary(data) {
    const sections = [];
    // Titre de l'activité s'il existe (titre catalogue injecté par le bridge —
    // audit Sucrerie 2026-07-05, F6), repli sur le libellé générique.
    const title = data.title || t('doc_fmt_glossary_title');

    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    sections.push({ type: 'separator' });

    // H5P Accordion structure usually has 'panels' array
    const entries = data.panels || (Array.isArray(data) ? data : []);

    if (Array.isArray(entries)) {
        entries.forEach((entry, index) => {
            // Accordion panels have 'title' and 'content' (HTML)
            // Or fallback to checking other properties if structure varies
            const term = entry.title || `${t('doc_fmt_term_index')} ${index + 1}`;
            const definition = entry.content ? cleanHtml(entry.content.params ? entry.content.params.text : entry.content) : (entry.text || entry.definition || '');

            sections.push({
                type: 'header',
                level: 2,
                text: cleanHtml(term)
            });

            sections.push({
                type: 'paragraph',
                text: cleanHtml(definition),
                style: 'definition'
            });

        });
    }

    return { title, sections };
}

/**
 * Formate un Chart avec rendu visuel du diagramme
 */
async function formatChart(data) {
    const sections = [];
    const title = data.figureDefinition || t('doc_fmt_chart_title');

    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    // Génération de l'image du diagramme (chargement paresseux de chart-renderer.js)
    try {
        const { generateChartImage } = await import('../renderers/chart-renderer.js');
        const chartImage = generateChartImage(data);
        if (chartImage) {
            sections.push({
                type: 'image',
                url: chartImage.dataURL,
                fillWidth: true
            });
        }
    } catch (e) {
        console.warn('[Document Formatter] Impossible de générer l\'image du diagramme :', e);
    }

    // Données textuelles en complément (accessibilité / fallback)
    if (data.listOfTypes && Array.isArray(data.listOfTypes)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_data')
        });

        data.listOfTypes.forEach(item => {
            sections.push({
                type: 'bulletPoint',
                text: `${item.text} : ${item.value}`
            });
        });
    }

    return { title, sections };
}

/**
 * Formate un Summary
 * Structure pédagogique : énoncé + saut de page + correction
 */
// Rotation reproductible : mêmes lettres dans les trois formats et leur corrigé.
// La première affirmation native est correcte, mais ne doit pas toujours être A sur papier.
function summaryPaperOrder(statements, groupIndex) {
    const offset = statements.length > 1 ? (groupIndex % (statements.length - 1)) + 1 : 0;
    return statements.map((text, index) => ({ text, index })).slice(offset)
        .concat(statements.slice(0, offset).map((text, index) => ({ text, index })));
}

function summaryCorrectLetter(statements, groupIndex) {
    return String.fromCharCode(65 + summaryPaperOrder(statements, groupIndex).findIndex(item => item.index === 0));
}

function formatSummary(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_summary_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.intro) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.intro),
            style: 'description'
        });
    }

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_summary_instructions') || 'Pour chaque groupe, choisissez l\'affirmation correcte.',
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    if (data.summaries && Array.isArray(data.summaries)) {
        data.summaries.forEach((summary, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_claim_index') || 'Groupe'} ${index + 1}`
            });

            const tip = typeof summary.tip === 'object' ? summary.tip?.tip : summary.tip;
            if (tip) sections.push({ type: 'paragraph', text: `${t('editor_tip')} : ${cleanHtml(tip)}`, style: 'description' });

            if (summary.summary && Array.isArray(summary.summary)) {
                summaryPaperOrder(summary.summary, index).forEach(({ text: statement }, i) => {
                    const letter = String.fromCharCode(65 + i);
                    sections.push({
                        type: 'checkbox',
                        text: `${letter}. ${cleanHtml(statement)}`
                    });
                });
            }

            sections.push({ type: 'separator' });
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.summaries && Array.isArray(data.summaries)) {
        data.summaries.forEach((summary, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_claim_index') || 'Groupe'} ${index + 1}`
            });

            if (summary.summary && Array.isArray(summary.summary) && summary.summary.length > 0) {
                // La première affirmation est toujours la bonne
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${summaryCorrectLetter(summary.summary, index)}. ${cleanHtml(summary.summary[0])}`,
                    style: 'correctAnswer'
                });
            }

            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formate une question à choix multiple simple
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatMultipleChoice(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_multiple_choice_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.question) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.question),
            style: 'question'
        });
    }

    formatMultiChoiceStatement(data, sections);

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    formatMultiChoiceCorrection(data, sections);

    return { title, sections };
}

/**
 * Formate un Single Choice Set
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatSingleChoiceSet(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_single_choice_set_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_instructions') || 'Répondez aux questions suivantes.',
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    if (data.choices && Array.isArray(data.choices)) {
        data.choices.forEach((choice, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_question_header')} ${index + 1}`
            });

            sections.push({
                type: 'paragraph',
                text: cleanHtml(choice.question),
                style: 'question'
            });

            if (choice.answers && Array.isArray(choice.answers)) {
                sections.push({
                    type: 'paragraph',
                    text: t('doc_fmt_proposed_answers') || 'Propositions :',
                    style: 'answersTitle'
                });

                summaryPaperOrder(choice.answers, index).forEach(({text: answer}, i) => {
                    const letter = String.fromCharCode(65 + i);
                    sections.push({
                        type: 'checkbox',
                        text: `${letter}. ${cleanHtml(answer)}`
                    });
                });
            }

            sections.push({ type: 'separator' });
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.choices && Array.isArray(data.choices)) {
        data.choices.forEach((choice, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_question_header')} ${index + 1}`
            });

            // La première réponse est toujours la bonne dans SingleChoiceSet
            if (choice.answers && Array.isArray(choice.answers) && choice.answers.length > 0) {
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${summaryCorrectLetter(choice.answers, index)}. ${cleanHtml(choice.answers[0])}`,
                    style: 'correctAnswer'
                });
            }

            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formate une question Vrai/Faux
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatTrueFalse(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_true_false_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.question) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.question),
            style: 'question'
        });
    }

    formatTrueFalseStatement(data, sections);

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    formatTrueFalseCorrection(data, sections);

    return { title, sections };
}

/**
 * Formate des Dialog Cards pour impression recto-verso
 * Structure : tableaux 2x4 (8 cartes/page) avec logique miroir pour le verso
 *
 * Logique d'inversion pour impression recto-verso :
 * - Recto : [Carte 1][Carte 2] / [Carte 3][Carte 4] / ...
 * - Verso : [Carte 2][Carte 1] / [Carte 4][Carte 3] / ... (miroir horizontal)
 *
 * Dialog Cards peuvent avoir des indices séparés pour le recto (tips.front) et le verso (tips.back)
 */
function formatDialogCards(data) {
    const sections = [];
    const title = cleanHtml(data.title || t('doc_fmt_dialog_cards_title'));
    const dialogs = data.dialogs || [];

    // Titre du document en tête, comme les autres formatters (audit Sucrerie
    // 2026-07-05, F6 : les cartes de dialogue sortaient sans aucun titre).
    sections.push({ type: 'header', level: 1, text: title });
    if (data.description) sections.push({ type: 'paragraph', text: cleanHtml(data.description), style: 'description' });

    if (dialogs.length === 0) {
        return { title, sections };
    }

    // Grouper les cartes par pages de 8
    const CARDS_PER_PAGE = 8;
    const pageGroups = [];
    for (let i = 0; i < dialogs.length; i += CARDS_PER_PAGE) {
        pageGroups.push(dialogs.slice(i, i + CARDS_PER_PAGE));
    }

    pageGroups.forEach((pageDialogs, pageIndex) => {
        // Générer les lignes pour le recto (questions)
        const rectoRows = [];
        // Générer les lignes pour le verso (réponses) avec ordre miroir
        const versoRows = [];

        for (let row = 0; row < 4; row++) {
            const leftIndex = row * 2;
            const rightIndex = row * 2 + 1;

            const leftDialog = pageDialogs[leftIndex] || null;
            const rightDialog = pageDialogs[rightIndex] || null;

            // Extraire l'image d'un dialogue (data URL ou chemin)
            const getDialogImage = (dialog) => {
                if (!dialog || !dialog.image || !dialog.image.path) return null;
                return dialog.image.dataURL || dialog.image.path;
            };

            // Recto : ordre normal [gauche, droite]
            rectoRows.push({
                left: leftDialog ? {
                    text: cleanHtml(leftDialog.text),
                    hint: leftDialog.tips?.front ? cleanHtml(leftDialog.tips.front) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1,
                    imageUrl: getDialogImage(leftDialog)
                } : null,
                right: rightDialog ? {
                    text: cleanHtml(rightDialog.text),
                    hint: rightDialog.tips?.front ? cleanHtml(rightDialog.tips.front) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1,
                    imageUrl: getDialogImage(rightDialog)
                } : null
            });

            // Verso : ordre miroir [droite, gauche] pour alignement impression
            versoRows.push({
                left: rightDialog ? {
                    text: cleanHtml(rightDialog.answer),
                    hint: rightDialog.tips?.back ? cleanHtml(rightDialog.tips.back) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1,
                    imageUrl: getDialogImage(rightDialog)
                } : null,
                right: leftDialog ? {
                    text: cleanHtml(leftDialog.answer),
                    hint: leftDialog.tips?.back ? cleanHtml(leftDialog.tips.back) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1,
                    imageUrl: getDialogImage(leftDialog)
                } : null
            });
        }

        // Ajouter la page recto
        sections.push({
            type: 'flashcardTable',
            side: 'recto',
            rows: rectoRows,
            pageNumber: pageIndex + 1,
            totalPages: pageGroups.length
        });

        // Ajouter la page verso (suit immédiatement le recto)
        sections.push({
            type: 'flashcardTable',
            side: 'verso',
            rows: versoRows,
            pageNumber: pageIndex + 1,
            totalPages: pageGroups.length
        });
    });

    ajouterCreditsCartes(sections, dialogs);
    return { title, sections };
}

/**
 * Formate Dictation (dictée)
 * Structure pédagogique : énoncé (lignes d'écriture numérotées — l'audio n'existe pas sur
 * papier, l'enseignant dicte) + saut de page + correction (phrases solutions).
 * Host-agnostique : ne lit QUE data (title, taskDescription, sentences[].text/description).
 */
function formatDictation(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_dictation_title') || 'Dictée';
    const sentences = (Array.isArray(data.sentences) ? data.sentences : [])
        .map(s => (typeof s === 'string' ? { text: s } : (s || {})))
        .filter(s => typeof s.text === 'string' && s.text.trim());

    // ÉNONCÉ (feuille élève)
    sections.push({ type: 'header', level: 1, text: title });
    // Consigne : la `taskDescription` de l'activité si elle existe, SINON l'instruction
    // générique — jamais les deux (elles disent la même chose → doublon visible à l'export).
    const taskDesc = (typeof data.taskDescription === 'string' && data.taskDescription.trim())
        ? cleanHtml(data.taskDescription) : '';
    if (taskDesc) {
        sections.push({ type: 'paragraph', text: taskDesc, style: 'description' });
    }
    formatQuestionMedia(data, sections);
    if (!taskDesc) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_dictation_instructions') || 'Écoutez chaque phrase puis écrivez-la sans faute sur les lignes ci-dessous.',
            style: 'instructions'
        });
    }
    sentences.forEach((s, i) => {
        const label = s.description ? cleanHtml(s.description) : `${t('doc_fmt_dictation_sentence') || 'Phrase'} ${i + 1}`;
        sections.push({ type: 'paragraph', text: `${i + 1}. ${label}` });
        sections.push({ type: 'paragraph', text: '__________________________________________________' });
        sections.push({ type: 'paragraph', text: '__________________________________________________' });
    });

    // CORRECTION (feuille enseignant — sert aussi de texte à dicter)
    sections.push({ type: 'pageBreak' });
    sections.push({ type: 'header', level: 1, text: t('doc_fmt_correction_title') || 'Correction' });
    sentences.forEach((s, i) => {
        // Les variantes acceptées `mot|variante` s'affichent « mot / variante » à l'impression.
        sections.push({ type: 'paragraph', text: `${i + 1}. ${s.text.trim().replace(/\|/g, ' / ')}` });
    });

    const sources=sentences.flatMap(sentence=>[sentence.sample,sentence.sampleAlternative].flatMap(v=>Array.isArray(v)?v:(v?[v]:[])));
    const uniques=sources.filter((source,index)=>sources.findIndex(other=>other.path===source.path)===index);
    ajouterCreditsCartes(sections, uniques.map(source=>({image:source})));
    return { title, sections };
}

/**
 * Formate Sort Paragraphs
 * Structure pédagogique : énoncé (paragraphes mélangés) + saut de page + correction (ordre correct)
 */
function formatSortParagraphs(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_sort_paragraphs_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ (paragraphes dans le désordre)
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.taskDescription),
            style: 'description'
        });
    }

    formatQuestionMedia(data, sections);

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_sort_instructions') || 'Remettez les paragraphes suivants dans le bon ordre.',
        style: 'instructions'
    });

    if (data.paragraphs && Array.isArray(data.paragraphs)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_paragraphs_to_sort') || 'Paragraphes à remettre en ordre'
        });

        // Mélanger les paragraphes pour l'énoncé
        const shuffled = data.paragraphs.map((para, i) => ({ para, originalIndex: i }));
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Ne pas livrer par hasard une fiche dont l'ordre est déjà résolu.
        // Les doublons visibles comptent comme identiques, même si leurs indices diffèrent.
        const originalText = data.paragraphs.map(cleanHtml);
        if (new Set(originalText).size > 1 && shuffled.every((item, i) => cleanHtml(item.para) === originalText[i])) {
            shuffled.push(shuffled.shift());
        }

        shuffled.forEach((item, i) => {
            const letter = String.fromCharCode(65 + i);
            sections.push({
                type: 'paragraph',
                text: `${letter}. ${cleanHtml(item.para)}`,
                style: 'orderedParagraph'
            });
        });

        // Sauvegarder l'ordre pour la correction
        data._shuffledOrder = shuffled.map(item => item.originalIndex);
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.paragraphs && Array.isArray(data.paragraphs)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_correct_order') || 'Ordre correct'
        });

        data.paragraphs.forEach((para, index) => {
            sections.push({
                type: 'paragraph',
                text: `${index + 1}. ${cleanHtml(para)}`,
                style: 'correctAnswer'
            });
        });
    }

    return { title, sections };
}

/**
 * Formate Find the Words
 * Structure pédagogique : énoncé (nombre de mots) + saut de page + correction (liste des mots)
 */
function formatFindTheWords(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_find_the_words_title');
    // Le lecteur natif ne compte qu'une occurrence de chaque mot de la liste.
    const words = [...new Set((Array.isArray(data.wordList) ? data.wordList : (data.wordList || '').split(','))
        .map(word => word.trim()).filter(Boolean))];

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.taskDescription),
            style: 'description'
        });
    }

    if (words.length) {
        const instructionText = (t('doc_fmt_find_instructions') || 'Trouvez les @count mots cachés dans la grille :')
            .replace('@count', words.length);
        sections.push({
            type: 'paragraph',
            text: instructionText,
            style: 'instructions'
        });
        if (data.behaviour?.showVocabulary !== false) {
            sections.push({
                type: 'paragraph',
                text: words.join(', ') + '.',
                style: 'wordList'
            });
        }
    }

    // Grille vierge (énoncé) — image capturée depuis le H5P
    if (data._gridImage) {
        sections.push({
            type: 'image',
            imageData: data._gridImage,
            fillWidth: true
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    // Grille corrigée (solution avec mots surlignés) — image capturée depuis le H5P
    if (data._solutionGridImage) {
        sections.push({
            type: 'image',
            imageData: data._solutionGridImage,
            fillWidth: true
        });
        sections.push({ type: 'spacer' });
    }

    if (words.length) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_words_to_find') || 'Mots à trouver'
        });

        words.forEach((word, i) => {
            sections.push({
                type: 'bulletPoint',
                text: `${i + 1}. ${word}`,
                style: 'correctAnswer'
            });
        });
    }

    return { title, sections };
}

/**
 * Formate Essay
 * Structure pédagogique : énoncé + saut de page + correction (mots-clés attendus)
 */
function formatEssay(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_essay_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    formatEssayStatement(data, sections);

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    formatEssayCorrection(data, sections);

    return { title, sections };
}

    /**
     * Formate un QCM (Éléa/Moodle)
     * Structure pédagogique : énoncé + saut de page + correction
     */
    function formatQCM(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_qcm_title');

    // ========================================
    // PRÉPARATION : Mélange identique au simulateur
    // ========================================
    // On crée une version préparée avec les réponses mélangées
    const preparedQuestions = (data.questions || []).map(q => {
        let answers = [...(q.answers || [])];
        
        // Schwartzian transform : mélange aléatoire identique au simulateur Caramel
        answers = answers
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

        return { ...q, answers };
    });

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_instructions') || 'Répondez aux questions suivantes.',
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    preparedQuestions.forEach((question, index) => {
        sections.push({
            type: 'header',
            level: 2,
            text: `${t('doc_fmt_question_header')} ${index + 1}`
        });

        let qText = cleanHtml(question.text);
        if (qText.includes('{') && qText.includes(':')) {
            qText = processClozeForStatement(qText);
        }

        sections.push({
            type: 'paragraph',
            text: qText,
            style: 'question'
        });

        if (question.answers && question.answers.length > 0) {
            sections.push({
                type: 'paragraph',
                text: t('doc_fmt_proposed_answers') || 'Propositions :',
                style: 'answersTitle'
            });

            question.answers.forEach((answer, i) => {
                const letter = String.fromCharCode(65 + i);
                sections.push({
                    type: 'checkbox',
                    text: `${letter}. ${cleanHtml(answer.text)}`
                });
            });
        }

        sections.push({ type: 'separator' });
    });

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    preparedQuestions.forEach((question, index) => {
        sections.push({
            type: 'header',
            level: 2,
            text: `${t('doc_fmt_question_header')} ${index + 1}`
        });

        if (question.answers && question.answers.length > 0) {
            // On cherche les bonnes réponses parmi les réponses MÉLANGÉES
            const correctAnswers = question.answers
                .map((answer, i) => ({ answer, letter: String.fromCharCode(65 + i) }))
                .filter(item => item.answer.iscorrect === 1 || item.answer.iscorrect === true || item.answer.correct === true);

            if (correctAnswers.length > 0) {
                const answerText = correctAnswers.map(item =>
                    `${item.letter}. ${cleanHtml(item.answer.text)}`
                ).join(', ');

                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_correct_answer') || 'Bonne(s) réponse(s)'} : ${answerText}`,
                    style: 'correctAnswer'
                });
            } else if (question.text && question.text.includes('{') && question.text.includes(':')) {
                // Gestion spécifique pour les questions à trous (Cloze)
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} :`,
                    style: 'answersTitle'
                });
                sections.push({
                    type: 'paragraph',
                    text: processClozeForCorrection(cleanHtml(question.text)),
                    style: 'correctAnswer'
                });
            }
        }

        sections.push({ type: 'separator' });
    });

    return { title, sections };
}

/**
 * Formate un Test Moodle XML
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatMoodleXml(data) {
    const sections = [];
    const title = data.bank_name || t('doc_fmt_elea_test_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.bank_description) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.bank_description),
            style: 'description'
        });
    }

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_instructions') || 'Répondez aux questions suivantes.',
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
            const content = question.content;

            sections.push({
                type: 'header',
                level: 2,
                text: content.name || `${t('doc_fmt_question_header')} ${index + 1}`
            });

            // Question
            if (content.questiontext) {
                let qText = cleanHtml(content.questiontext);
                if (question.type === 'cloze') {
                    qText = processClozeForStatement(qText);
                }
                sections.push({
                    type: 'paragraph',
                    text: qText,
                    style: 'question'
                });
            }

            // Propositions selon le type (sans indication des bonnes réponses)
            if (question.type === 'multichoice' && content.answers) {
                sections.push({
                    type: 'paragraph',
                    text: t('doc_fmt_proposed_answers') || 'Propositions :',
                    style: 'answersTitle'
                });
                content.answers.forEach((answer, i) => {
                    const letter = String.fromCharCode(65 + i);
                    sections.push({
                        type: 'checkbox',
                        text: `${letter}. ${cleanHtml(answer.text)}`
                    });
                });
            } else if (question.type === 'matching' && content.subquestions) {
                sections.push({
                    type: 'paragraph',
                    text: t('doc_fmt_elements_to_match') || 'Éléments à associer :',
                    style: 'answersTitle'
                });
                // Afficher les éléments de gauche
                content.subquestions.forEach((sq, i) => {
                    sections.push({
                        type: 'bulletPoint',
                        text: `${i + 1}. ${cleanHtml(sq.text)}`
                    });
                });
                // Afficher les réponses possibles (mélangées)
                const answers = content.subquestions.map(sq => sq.answer);
                const shuffled = [...answers].sort(() => Math.random() - 0.5);
                sections.push({
                    type: 'paragraph',
                    text: t('doc_fmt_possible_matches') || 'Correspondances possibles :',
                    style: 'answersTitle'
                });
                shuffled.forEach((ans, i) => {
                    const letter = String.fromCharCode(65 + i);
                    sections.push({
                        type: 'checkbox',
                        text: `${letter}. ${cleanHtml(ans)}`
                    });
                });
            } else if (question.type === 'truefalse') {
                sections.push({
                    type: 'paragraph',
                    text: t('doc_fmt_proposed_answers') || 'Propositions :',
                    style: 'answersTitle'
                });
                sections.push({ type: 'checkbox', text: `A. ${t('doc_fmt_true') || 'Vrai'}` });
                sections.push({ type: 'checkbox', text: `B. ${t('doc_fmt_false') || 'Faux'}` });
            } else if (question.type === 'shortanswer' || question.type === 'numerical') {
                sections.push({
                    type: 'paragraph',
                    text: t('doc_fmt_answer_space') || 'Réponse : _________________________',
                    style: 'blanksText'
                });
            } else if (question.type === 'cloze' && content.questiontext) {
                // Le texte à trous est déjà affiché comme question
            }

            sections.push({ type: 'separator' });
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
            const content = question.content;

            sections.push({
                type: 'header',
                level: 2,
                text: content.name || `${t('doc_fmt_question_header')} ${index + 1}`
            });

            // Correction selon le type
            if (question.type === 'multichoice' && content.answers) {
                const correctAnswers = content.answers
                    .map((answer, i) => ({ answer, letter: String.fromCharCode(65 + i) }))
                    .filter(item => item.answer.fraction > 0);

                if (correctAnswers.length > 0) {
                    const answerText = correctAnswers.map(item =>
                        `${item.letter}. ${cleanHtml(item.answer.text)}`
                    ).join(', ');

                    sections.push({
                        type: 'paragraph',
                        text: `${t('doc_fmt_correct_answer') || 'Bonne(s) réponse(s)'} : ${answerText}`,
                        style: 'correctAnswer'
                    });
                }
            } else if (question.type === 'matching' && content.subquestions) {
                sections.push({
                    type: 'paragraph',
                    text: t('doc_fmt_correct_associations') || 'Associations correctes :',
                    style: 'answersTitle'
                });
                content.subquestions.forEach((sq, i) => {
                    sections.push({
                        type: 'bulletPoint',
                        text: `${i + 1}. ${cleanHtml(sq.text)} -> ${cleanHtml(sq.answer)}`,
                        style: 'correctAnswer'
                    });
                });
            } else if (question.type === 'numerical' && content.answer) {
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${content.answer.number}`,
                    style: 'correctAnswer'
                });
            } else if (question.type === 'truefalse' && content.answer) {
                const correct = content.answer.value ? (t('doc_fmt_true') || 'Vrai') : (t('doc_fmt_false') || 'Faux');
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${correct}`,
                    style: 'correctAnswer'
                });
            } else if (question.type === 'shortanswer' && content.answers) {
                const acceptedAnswers = content.answers.map(a => cleanHtml(a.text)).join(', ');
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_accepted_answers') || 'Réponses acceptées'} : ${acceptedAnswers}`,
                    style: 'correctAnswer'
                });
            } else if (question.type === 'cloze' && content.questiontext) {
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} :`,
                    style: 'answersTitle'
                });
                sections.push({
                    type: 'paragraph',
                    text: processClozeForCorrection(cleanHtml(content.questiontext)),
                    style: 'correctAnswer'
                });
            }

            // Feedbacks (correctfeedback, incorrectfeedback, feedback general)
            const feedbackItems = [
                { key: 'correctfeedback', label: t('doc_fmt_feedback_correct') || 'Feedback bonne reponse' },
                { key: 'partiallycorrectfeedback', label: t('doc_fmt_feedback_partial') || 'Feedback reponse partielle' },
                { key: 'incorrectfeedback', label: t('doc_fmt_feedback_incorrect') || 'Feedback mauvaise reponse' },
                { key: 'feedback', label: t('doc_fmt_feedback_general') || 'Feedback general' }
            ];
            const hasFeedback = feedbackItems.some(f => content[f.key]);
            if (hasFeedback) {
                feedbackItems.forEach(f => {
                    if (content[f.key]) {
                        sections.push({
                            type: 'paragraph',
                            text: `*${f.label}* : ${cleanHtml(content[f.key])}`,
                            style: 'tip'
                        });
                    }
                });
            }

            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formate un Appariement
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatAppariement(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_matching_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.intro) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.intro),
            style: 'description'
        });
    }

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_matching_instructions') || 'Associez chaque élément de la colonne de gauche avec l\'élément correspondant de la colonne de droite.',
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    if (data.pairs && Array.isArray(data.pairs)) {
        // Colonne de gauche (questions)
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_elements_to_match') || 'Éléments à associer'
        });

        data.pairs.forEach((pair, index) => {
            sections.push({
                type: 'bulletPoint',
                text: `${index + 1}. ${cleanHtml(pair.question)}`
            });
        });

        sections.push({ type: 'separator' });

        // Colonne de droite (réponses mélangées)
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_possible_matches') || 'Correspondances possibles'
        });

        const shuffledAnswers = [...data.pairs].sort(() => Math.random() - 0.5);
        shuffledAnswers.forEach((pair, i) => {
            const letter = String.fromCharCode(65 + i);
            sections.push({
                type: 'checkbox',
                text: `${letter}. ${cleanHtml(pair.answer)}`
            });
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.pairs && Array.isArray(data.pairs)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_correct_associations') || 'Associations correctes'
        });

        data.pairs.forEach((pair, index) => {
            sections.push({
                type: 'paragraph',
                text: `${index + 1}. ${cleanHtml(pair.question)} -> ${cleanHtml(pair.answer)}`,
                style: 'correctAnswer'
            });
        });
    }

    return { title, sections };
}

/**
 * Formate un jeu du Millionnaire
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatMillionnaire(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_millionnaire_title');

    // ========================================
    // PARTIE 1 : ÉNONCÉ
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_millionnaire_instructions') || 'Pour chaque question, choisissez la bonne réponse parmi les propositions.',
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_question_header')} ${index + 1}`
            });

            sections.push({
                type: 'paragraph',
                text: cleanHtml(question.question),
                style: 'question'
            });

            sections.push({
                type: 'paragraph',
                text: t('doc_fmt_proposed_answers') || 'Propositions :',
                style: 'answersTitle'
            });

            // Créer la liste de toutes les réponses et mélanger
            const allAnswers = [question.goodanswer, ...(question.badanswer || [])];
            const shuffled = [...allAnswers].sort(() => Math.random() - 0.5);

            shuffled.forEach((answer, i) => {
                const letter = String.fromCharCode(65 + i);
                sections.push({
                    type: 'checkbox',
                    text: `${letter}. ${cleanHtml(answer)}`
                });
            });

            sections.push({ type: 'separator' });
        });
    }

    // ========================================
    // SAUT DE PAGE
    // ========================================
    sections.push({ type: 'pageBreak' });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: t('doc_fmt_correction_title') || 'Correction'
    });

    sections.push({ type: 'separator' });

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_question_header')} ${index + 1}`
            });

            sections.push({
                type: 'paragraph',
                text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${cleanHtml(question.goodanswer)}`,
                style: 'correctAnswer'
            });

            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formate un Glossaire XML
 */
function formatGlossaireXml(data) {
    const sections = [];
    const title = data.name || t('doc_fmt_glossary_title');

    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    sections.push({ type: 'separator' });

    if (data.entries && Array.isArray(data.entries)) {
        data.entries.forEach((entry, index) => {
            sections.push({
                type: 'header',
                level: 2,
                text: cleanHtml(entry.concept)
            });

            sections.push({
                type: 'paragraph',
                text: cleanHtml(entry.definition),
                style: 'definition'
            });

            // Alias/synonymes
            if (entry.aliases && Array.isArray(entry.aliases) && entry.aliases.length > 0) {
                sections.push({
                    type: 'paragraph',
                    text: `${t('doc_fmt_also_called')} ${entry.aliases.map(a => cleanHtml(a)).join(', ')}`,
                    style: 'metadata'
                });
            }

            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formate une Page Éléa
 */
function formatPage(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_page_title');

    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.intro) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.intro),
            style: 'description'
        });
    }

    sections.push({ type: 'separator' });

    if (data.blocks && Array.isArray(data.blocks)) {
        formatPageBlocks(data.blocks, sections);
    }

    return { title, sections };
}

/**
 * Formate une liste de blocs Page en sections de document.
 * Helper extrait pour permettre la réutilisation par formatPage() ET formatLivre()
 * (chaque chapitre du livre passe par cette fonction).
 *
 * @param {Array} blocks - Tableau des blocs à formater
 * @param {Array} sections - Tableau des sections de document (modifié in-place)
 */
function formatPageBlocks(blocks, sections) {
    if (!Array.isArray(blocks)) return;
    blocks.forEach((block, index) => {
            // Traiter selon le type de bloc
            switch (block.type) {
                case '#01_hero_header':
                    if (block.data) {
                        sections.push({
                            type: 'header',
                            level: 1,
                            text: cleanHtml(block.data.title || block.data.subtitle || '')
                        });
                        if (block.data.subtitle && block.data.title) {
                            sections.push({
                                type: 'paragraph',
                                text: cleanHtml(block.data.subtitle),
                                style: 'subtitle'
                            });
                        }
                    }
                    break;

                case '#02_nav_summary':
                    if (block.data && block.data.links) {
                        sections.push({
                            type: 'header',
                            level: 2,
                            text: t('doc_fmt_summary_header')
                        });
                        block.data.links.forEach(link => {
                            sections.push({
                                type: 'bulletPoint',
                                text: cleanHtml(link.text)
                            });
                        });
                    }
                    break;

                case '#04_callout_set':
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.callouts && Array.isArray(block.data.callouts)) {
                            block.data.callouts.forEach(callout => {
                                const emoji = getCalloutEmoji(callout.type);
                                sections.push({
                                    type: 'bulletPoint',
                                    text: `${emoji} ${cleanHtml(callout.text)}`
                                });
                            });
                        }
                    }
                    break;

                case '#12_context_paragraphs':
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.paragraphs && Array.isArray(block.data.paragraphs)) {
                            block.data.paragraphs.forEach(para => {
                                sections.push({
                                    type: 'paragraph',
                                    text: cleanHtml(para)
                                });
                            });
                        }
                    }
                    break;

                case '#06_lexique_table':
                case '#10_table_comparison':
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.caption) {
                            sections.push({
                                type: 'paragraph',
                                text: cleanHtml(block.data.caption),
                                style: 'metadata'
                            });
                        }
                        if (block.data.rows && Array.isArray(block.data.rows)) {
                            block.data.rows.forEach(row => {
                                if (Array.isArray(row)) {
                                    sections.push({
                                        type: 'bulletPoint',
                                        text: row.map(cell => cleanHtml(cell)).join(' : ')
                                    });
                                }
                            });
                        }
                    }
                    break;

                case '#18_sito_graphy':
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.links && Array.isArray(block.data.links)) {
                            block.data.links.forEach(link => {
                                sections.push({
                                    type: 'bulletPoint',
                                    text: `${cleanHtml(link.text)} (${link.href})`
                                });
                            });
                        }
                    }
                    break;

                case '#09_figures_comparison':
                    // Schéma réel : { title, left:{img_src,img_alt,caption}, right:{...}, text }
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        ['left', 'right'].forEach(side => {
                            const fig = block.data[side];
                            if (fig && fig.img_src) {
                                sections.push({
                                    type: 'image',
                                    url: fig.img_src,
                                    alt: cleanHtml(fig.img_alt || ''),
                                    caption: cleanHtml(fig.caption || '')
                                });
                            } else if (fig && fig.caption) {
                                // Fallback : pas d'image mais une légende → on garde le texte
                                sections.push({
                                    type: 'paragraph',
                                    text: cleanHtml(fig.caption)
                                });
                            }
                        });
                        if (block.data.text) {
                            sections.push({
                                type: 'paragraph',
                                text: cleanHtml(block.data.text)
                            });
                        }
                    }
                    break;

                case '#13_monument_sheet_long':
                    // Schéma réel : { title, img_src, img_alt, sections:[{subtitle,text}] }
                    // Ce bloc était rendu dans les Pages Moodle mais entièrement ignoré par
                    // les exports documentaires : son image envoyée disparaissait donc des
                    // DOCX, ODT et PDF alors qu'elle avait bien été réhydratée en dataURL.
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.img_src) {
                            sections.push({
                                type: 'image',
                                url: block.data.img_src,
                                alt: cleanHtml(block.data.img_alt || ''),
                                caption: cleanHtml(block.data.caption || '')
                            });
                        }
                        if (Array.isArray(block.data.sections)) {
                            block.data.sections.forEach(partie => {
                                if (partie?.subtitle) {
                                    sections.push({ type: 'header', level: 3, text: cleanHtml(partie.subtitle) });
                                }
                                if (partie?.text) {
                                    sections.push({ type: 'paragraph', text: cleanHtml(partie.text) });
                                }
                            });
                        }
                    }
                    break;

                case '#16_method_image_desc':
                    // Schéma réel : { title, steps:[...], img_src, img_alt, caption }
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (Array.isArray(block.data.steps)) {
                            block.data.steps.forEach(step => {
                                sections.push({
                                    type: 'bulletPoint',
                                    text: cleanHtml(step)
                                });
                            });
                        }
                        if (block.data.img_src) {
                            sections.push({
                                type: 'image',
                                url: block.data.img_src,
                                alt: cleanHtml(block.data.img_alt || ''),
                                caption: cleanHtml(block.data.caption || '')
                            });
                        }
                    }
                    break;

                case '#07_glossary_chips':
                    // Schéma réel : { title, chips:[string,...] }
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (Array.isArray(block.data.chips) && block.data.chips.length > 0) {
                            sections.push({
                                type: 'paragraph',
                                text: block.data.chips.map(chip => cleanHtml(chip)).join(' · ')
                            });
                        }
                    }
                    break;

                case '#14_faq_block':
                    // Schéma réel : { title, questions:[{q,a},...] }
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (Array.isArray(block.data.questions)) {
                            block.data.questions.forEach(qa => {
                                if (qa.q) {
                                    sections.push({
                                        type: 'header',
                                        level: 3,
                                        text: cleanHtml(qa.q)
                                    });
                                }
                                if (qa.a) {
                                    sections.push({
                                        type: 'paragraph',
                                        text: cleanHtml(qa.a)
                                    });
                                }
                            });
                        }
                    }
                    break;

                case '#15_myths_realities':
                    // Schéma réel : { title, items:[{myth,reality},...] }
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (Array.isArray(block.data.items)) {
                            const mythLabel = t('simulator_page_myths') || 'Mythe';
                            const realityLabel = t('simulator_page_realities') || 'Réalité';
                            block.data.items.forEach(item => {
                                if (item.myth) {
                                    sections.push({
                                        type: 'bulletPoint',
                                        text: `${mythLabel} : ${cleanHtml(item.myth)}`
                                    });
                                }
                                if (item.reality) {
                                    sections.push({
                                        type: 'bulletPoint',
                                        text: `${realityLabel} : ${cleanHtml(item.reality)}`
                                    });
                                }
                            });
                        }
                    }
                    break;

                case '#08_monuments_grid':
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.cards && Array.isArray(block.data.cards)) {
                            block.data.cards.forEach(card => {
                                if (card.img_src) {
                                    sections.push({
                                        type: 'image',
                                        url: card.img_src,
                                        alt: cleanHtml(card.img_alt || ''),
                                        caption: cleanHtml(card.caption || card.title || '')
                                    });
                                }
                                if (card.title || card.text) {
                                    sections.push({
                                        type: 'paragraph',
                                        text: `**${cleanHtml(card.title || '')}** ${cleanHtml(card.text || '')}`
                                    });
                                }
                            });
                        }
                    }
                    break;

                case '#07_image_full_width':
                    if (block.data && block.data.src) {
                        sections.push({
                            type: 'image',
                            url: block.data.src,
                            alt: cleanHtml(block.data.alt || ''),
                            caption: cleanHtml(block.data.caption || '')
                        });
                    }
                    break;

                case '#13_quote_background':
                    if (block.data) {
                        if (block.data.image) {
                            sections.push({
                                type: 'image',
                                url: block.data.image,
                                caption: cleanHtml(block.data.text || '')
                            });
                        } else if (block.data.text) {
                            sections.push({
                                type: 'paragraph',
                                text: cleanHtml(block.data.text),
                                style: 'subtitle'
                            });
                        }
                    }
                    break;

                default:
                    // Types de blocs non spécifiquement gérés
                    if (block.data && typeof block.data === 'object') {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.text) {
                            sections.push({
                                type: 'paragraph',
                                text: cleanHtml(block.data.text)
                            });
                        }
                    }
            }

            sections.push({ type: 'separator' });
        });
}

/**
 * Formate une activité Livre (Moodle book multi-chapitres) en sections de document.
 * Itère sur les chapitres et invoque formatPageBlocks() pour chacun, en respectant
 * la hiérarchie chapitre/sous-chapitre et la numérotation décimale.
 */
function formatLivre(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_livre_title') || 'Livre';
    const numbering = data.numbering ?? 1;

    // En-tête principal du livre
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    // Intro
    if (data.intro) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.intro),
            style: 'description'
        });
    }

    sections.push({ type: 'separator' });

    let chapterCounter = 0;
    let subchapterCounter = 0;

    (data.chapters || []).forEach((chapter, idx) => {
        // Calcul de la numérotation à afficher
        let prefix = '';
        if (chapter.subchapter) {
            subchapterCounter++;
            if (numbering === 1) {
                prefix = `${chapterCounter}.${subchapterCounter} `;
            }
        } else {
            chapterCounter++;
            subchapterCounter = 0;
            if (numbering === 1) {
                prefix = `${chapterCounter}. `;
            }
        }

        // Saut de page entre chapitres principaux (pas pour les sous-chapitres)
        if (idx > 0 && !chapter.subchapter) {
            sections.push({ type: 'pageBreak' });
        }

        // Titre du chapitre (h2 pour chapitre, h3 pour sous-chapitre)
        sections.push({
            type: 'header',
            level: chapter.subchapter ? 3 : 2,
            text: prefix + cleanHtml(chapter.title || `Chapitre ${chapterCounter}`)
        });

        // Réutilisation de la logique de formatage des blocs Page
        formatPageBlocks(chapter.blocks || [], sections);
    });

    return { title, sections };
}

/**
 * Obtient le label du type de question Moodle
 */
function getQuestionTypeLabel(type) {
    const types = {
        'multichoice': t('doc_fmt_type_multichoice'),
        'matching': t('doc_fmt_type_matching'),
        'numerical': t('doc_fmt_type_numerical'),
        'truefalse': t('doc_fmt_type_truefalse'),
        'shortanswer': t('doc_fmt_type_shortanswer'),
        'cloze': t('doc_fmt_type_cloze')
    };
    return types[type] || type;
}

/**
 * Obtient l'emoji correspondant au type de callout
 */
function getCalloutEmoji(type) {
    const labels = {
        'objectif': '[OBJ]',
        'savoir': '[SAV]',
        'alerte': '[!]',
        'info': '[i]',
        'tip': '[TIP]',
        'warning': '[!]',
        'success': '[V]',
        'error': '[X]'
    };
    return labels[type] || '-';
}

/**
 * Formatte une CoursePresentation H5P pour l'export document.
 * Partie 1 : contenu des diapositives et énoncés des exercices.
 * Partie 2 : correction des exercices.
 */
function formatNativeCoursePresentation(data) {
    const title=data.title||t('doc_fmt_cp_title'),sections=[{type:'header',level:1,text:title}],corrections=[];
    for(const [index,slide] of data.presentation.slides.entries()){
        sections.push({type:'header',level:2,text:`${t('doc_fmt_cp_slide')} ${index+1}${slide.keywords?.[0]?.main?' — '+cleanHtml(slide.keywords[0].main):''}`});
        const start=sections.length-1;
        for(const element of slide.elements||[]){
            const action=element.action||{},lib=String(action.library||''),params=action.params||{};
            if(lib.startsWith('H5P.Table')){
                const table=new DOMParser().parseFromString(params.text||'','text/html').querySelector('table');
                const rows=table?Array.from(table.rows,row=>Array.from(row.cells,cell=>cleanHtml(cell.innerHTML))):[];
                if(rows.length)sections.push({type:'table',headers:rows[0],rows:rows.slice(1)});
                else if(params.text)sections.push({type:'paragraph',text:cleanHtml(params.text)});
            }else if(/H5P\.(AdvancedText|ContinuousText|Text)\b/.test(lib)){
                if(params.text)sections.push({type:'paragraph',text:cleanHtml(params.text),style:'content'});
            }else if(/H5P\.(Image|Audio|Video)\b/.test(lib))formatQuestionMedia({media:{type:action}},sections);
            else if(lib.startsWith('H5P.Link'))sections.push({type:'paragraph',text:[params.title,params.link?.url||params.link||params.url].filter(v=>typeof v==='string').map(cleanHtml).join(' : ')});
            else if(/H5P\.(MultiChoice|TrueFalse|Blanks|DragText|MarkTheWords|SingleChoiceSet|Summary|Dialogcards|DragQuestion)\b/.test(lib)){
                formatCPExerciseStatement(lib,params,sections);corrections.push({lib,params,slide:index+1});
            }
            if(element.solution)corrections.push({comment:element.solution,slide:index+1});
        }
        if(sections.length-start<=10 && !sections.slice(start).some(s=>s.type==='image'))for(const section of sections.slice(start,-1))section.keepWithNext=true;
        sections.push({type:'separator'});
    }
    if(corrections.length){
        sections.push({type:'pageBreak'},{type:'header',level:1,text:t('doc_fmt_correction_title')});
        for(const c of corrections){
            sections.push({type:'header',level:3,text:`${t('doc_fmt_cp_slide')} ${c.slide}`});
            if(c.comment)sections.push({type:'paragraph',text:cleanHtml(c.comment),style:'tip'});
            else formatCPExerciseCorrection(c.lib,c.params,sections);
        }
    }
    return {title,sections};
}

function formatCoursePresentation(data) {
    if(Array.isArray(data.presentation?.slides))return formatNativeCoursePresentation(data);
    const sections = [];
    const title = data.title || t('doc_fmt_cp_title');

    // ========================================
    // PARTIE 1 : CONTENU ET ÉNONCÉS
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_cp_instructions'),
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    const slides = data.slides || [];
    let exerciseIndex = 0;
    const exercisesForCorrection = [];

    slides.forEach((slide, i) => {
        const slideType = slide.type || 'content';

        // Titre de la diapositive
        sections.push({
            type: 'header',
            level: 2,
            text: `${t('doc_fmt_cp_slide')} ${i + 1}${slide.title ? ' — ' + cleanHtml(slide.title) : ''}`
        });

        // Sous-titre (slide titre)
        if (slideType === 'title' && slide.subtitle) {
            sections.push({
                type: 'paragraph',
                text: cleanHtml(slide.subtitle),
                style: 'subtitle'
            });
        }

        // Image du slide
        const slideImageUrl = getMediaImageUrl(slide.slideImage);
        if (slideImageUrl) {
            sections.push({
                type: 'image',
                url: slideImageUrl,
                caption: slide.slideImageAlt || '',
                alt: slide.slideImageAlt || ''
            });
        }

        // Contenu texte
        if (slide.text) {
            sections.push({
                type: 'paragraph',
                text: cleanHtml(slide.text),
                style: 'content'
            });
        }

        // Tableau
        if (slide.table && slide.table.headers) {
            sections.push({
                type: 'table',
                headers: slide.table.headers,
                rows: (slide.table.rows || []).filter(row => Array.isArray(row))
            });
        }

        // Exercice (quiz, content-quiz, summary)
        if (slide.exercise && slide.exercise.library) {
            exerciseIndex++;
            const lib = slide.exercise.library;
            const { library, ...params } = slide.exercise;

            sections.push({
                type: 'header',
                level: 3,
                text: `${t('doc_fmt_cp_exercise')} ${exerciseIndex}`
            });

            // Énoncé selon le type d'exercice
            formatCPExerciseStatement(lib, params, sections);

            // Stocker pour la correction
            exercisesForCorrection.push({ index: exerciseIndex, library: lib, params });
        }

        sections.push({ type: 'separator' });
    });

    // ========================================
    // PARTIE 2 : CORRECTION
    // ========================================
    if (exercisesForCorrection.length > 0) {
        sections.push({ type: 'pageBreak' });

        sections.push({
            type: 'header',
            level: 1,
            text: t('doc_fmt_correction_title') || 'Correction'
        });

        sections.push({ type: 'separator' });

        exercisesForCorrection.forEach(({ index, library, params }) => {
            sections.push({
                type: 'header',
                level: 2,
                text: `${t('doc_fmt_cp_exercise')} ${index}`
            });

            formatCPExerciseCorrection(library, params, sections);

            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formate l'énoncé d'un exercice CoursePresentation selon sa bibliothèque H5P.
 * Réutilise les helpers existants pour les types QuizSet (MultiChoice, TrueFalse,
 * Blanks, DragText, MarkTheWords, DragQuestion) et ajoute le support inline
 * pour SingleChoiceSet, Summary et DialogCards.
 */
function formatCPExerciseStatement(library, params, sections) {
    if (library.includes('MultiChoice')) {
        if (params.question) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.question), style: 'question' });
        }
        formatMultiChoiceStatement(params, sections);
    } else if (library.includes('TrueFalse')) {
        if (params.question) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.question), style: 'question' });
        }
        formatTrueFalseStatement(params, sections);
    } else if (library.includes('Blanks')) {
        // Le helper émet déjà la consigne, y compris dans un livre ou une présentation.
        formatBlanksStatement(params, sections);
    } else if (library.includes('DragText')) {
        formatDragTextStatement(params, sections);
    } else if (library.includes('MarkTheWords')) {
        if (params.taskDescription) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.taskDescription), style: 'question' });
        }
        formatMarkWordsStatement(params, sections);
    } else if (library.includes('SingleChoiceSet')) {
        // Choix unique en série : afficher chaque sous-question
        if (params.choices && Array.isArray(params.choices)) {
            params.choices.forEach((choice, i) => {
                sections.push({ type: 'paragraph', text: cleanHtml(choice.question), style: 'question' });
                if (choice.answers && Array.isArray(choice.answers)) {
                    summaryPaperOrder(choice.answers, i).forEach(({text: answer}, j) => {
                        const letter = String.fromCharCode(65 + j);
                        sections.push({ type: 'checkbox', text: `${letter}. ${cleanHtml(answer)}` });
                    });
                }
            });
        }
    } else if (library.includes('DragQuestion')) {
        if (params.title) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.title), style: 'question' });
        }
        formatDragQuestionStatement(params, sections);
    } else if (library.includes('Summary')) {
        if (params.intro) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.intro), style: 'question' });
        }
        // Afficher les groupes d'affirmations
        if (params.summaries && Array.isArray(params.summaries)) {
            params.summaries.forEach((group, i) => {
                sections.push({ type: 'header', level: 3, text: `${t('doc_fmt_claim_index') || 'Groupe'} ${i + 1}` });
                const tip = typeof group.tip === 'object' ? group.tip?.tip : group.tip;
                if (tip) sections.push({ type: 'paragraph', text: `${t('editor_tip')} : ${cleanHtml(tip)}`, style: 'description' });
                if (group.summary && Array.isArray(group.summary)) {
                    summaryPaperOrder(group.summary, i).forEach(({ text: statement }, j) => {
                        const letter = String.fromCharCode(65 + j);
                        sections.push({ type: 'checkbox', text: `${letter}. ${cleanHtml(statement)}` });
                    });
                }
            });
        }
    } else if (library.includes('Dialogcards')) {
        if (params.description) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.description), style: 'question' });
        }
        // Afficher les cartes en liste
        if (params.dialogs && Array.isArray(params.dialogs)) {
            const headers = [t('doc_fmt_cp_card_front'), t('doc_fmt_cp_card_back')];
            const rows = [];
            params.dialogs.forEach(dialog => {
                rows.push([
                    [dialog.text, dialog.tips?.front].filter(Boolean).map(cleanHtml).join('\n'),
                    [dialog.answer, dialog.tips?.back].filter(Boolean).map(cleanHtml).join('\n')
                ]);
                const imageUrl = getMediaImageUrl(dialog.image);
                if (imageUrl) sections.push({ type: 'image', url: imageUrl, alt: dialog.imageAlt || '', caption: cleanHtml(dialog.text || '') });
            });
            sections.push({ type: 'table', headers, rows });
            ajouterCreditsCartes(sections, params.dialogs);
        }
    }
}

/**
 * Formate la correction d'un exercice CoursePresentation selon sa bibliothèque H5P.
 */
function formatCPExerciseCorrection(library, params, sections) {
    if (library.includes('MultiChoice')) {
        formatMultiChoiceCorrection(params, sections);
    } else if (library.includes('TrueFalse')) {
        formatTrueFalseCorrection(params, sections);
    } else if (library.includes('Blanks')) {
        formatBlanksCorrection(params, sections);
    } else if (library.includes('DragText')) {
        formatDragTextCorrection(params, sections);
    } else if (library.includes('MarkTheWords')) {
        formatMarkWordsCorrection(params, sections);
    } else if (library.includes('SingleChoiceSet')) {
        // La première réponse est toujours la bonne
        if (params.choices && Array.isArray(params.choices)) {
            params.choices.forEach((choice, i) => {
                sections.push({ type: 'paragraph', text: cleanHtml(choice.question), style: 'question' });
                if (choice.answers && Array.isArray(choice.answers) && choice.answers.length > 0) {
                    sections.push({
                        type: 'paragraph',
                        text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${summaryCorrectLetter(choice.answers, i)}. ${cleanHtml(choice.answers[0])}`,
                        style: 'correctAnswer'
                    });
                }
            });
        }
    } else if (library.includes('DragQuestion')) {
        formatDragQuestionCorrection(params, sections);
    } else if (library.includes('Summary')) {
        // La première affirmation de chaque groupe est la correcte
        if (params.summaries && Array.isArray(params.summaries)) {
            params.summaries.forEach((group, i) => {
                if (group.summary && Array.isArray(group.summary) && group.summary.length > 0) {
                    sections.push({
                        type: 'paragraph',
                        text: `${t('doc_fmt_claim_index') || 'Groupe'} ${i + 1} : ${summaryCorrectLetter(group.summary, i)}. ${cleanHtml(group.summary[0])}`,
                        style: 'correctAnswer'
                    });
                }
            });
        }
    } else if (library.includes('Dialogcards')) {
        // Pas de correction pour les cartes de dialogue (pas scoré)
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_cp_dialogcards_no_correction'),
            style: 'description'
        });
    }
}

/**
 * Formatte un InteractiveBook H5P pour l'export document.
 * Partie 1 : contenu des chapitres (textes, tableaux) et énoncés des exercices.
 * Partie 2 : correction des exercices, regroupée par chapitre.
 * Réutilise les dispatchers d'exercices de CoursePresentation (mêmes 9 types).
 */
/** Parcourir les conteneurs natifs sans perdre les blocs ou leurs corrigés. */
async function formatNativeInteractiveBook(data) {
    const base=formatInteractiveBook({title:data.title,cover:{enabled:data.showCoverPage,description:data.bookCover?.coverDescription,media:data.bookCover?.coverMedium},chapters:[]});
    const sections=base.sections.filter(section=>data.documentKind!=='video'||section.text!==t('doc_fmt_ib_embedded_video')),corrections=[];
    if(data.documentKind==='video')for(const section of sections)if(section.style==='instructions')section.text=t('doc_fmt_video_instructions');
    const modules={Blanks:'FillInTheBlanks',MultiChoice:'MultipleChoice',DragText:'DragTheWords',DragQuestion:'DragAndDrop',Dialogcards:'DialogCards',QuestionSet:'QuizSet',ImageHotspotQuestion:'FindTheHotspot',MultiMediaChoice:'MultiMediaChoice'};
    const walk=async(action,chapter)=>{
        if(!action)return;const library=String(action.library||'').split(' ')[0].replace('H5P.',''),params=action.params||{};
        if(library==='Row'){for(const column of params.columns||[])await walk(column.content,chapter);return;}
        if(library==='Column'||library==='RowColumn'){for(const item of params.content||[])await walk(item.content||item,chapter);return;}
        if(['AdvancedText','ContinuousText','Text','Table','Link','Image','Audio','Video'].includes(library)){
            const one=formatNativeCoursePresentation({presentation:{slides:[{elements:[{action}]}]}});
            sections.push(...one.sections.filter(s=>s.type!=='header'&&s.type!=='separator').map(s=>s.type==='image'?{...s,imgSizeMm:80}:s));return;
        }
        if(library==='Nil')return;
        if(library==='Questionnaire'){for(const item of params.questionnaireElements||[])await walk(item.library||item,chapter);return;}
        if(['FreeTextQuestion','OpenEndedQuestion'].includes(library)){
            sections.push({type:'paragraph',text:cleanHtml(params.question||''),style:'question'},{type:'paragraph',text:'________________________________________________________________'});return;
        }
        if(library==='SimpleMultiChoice'){
            sections.push({type:'paragraph',text:cleanHtml(params.question||''),style:'question'});
            for(const option of params.alternatives||[])sections.push({type:'paragraph',text:'☐ '+cleanHtml(option.text||option)});return;
        }
        if(library==='GoToQuestion'){
            sections.push({type:'paragraph',text:cleanHtml(params.text||''),style:'question'});
            for(const choice of params.choices||[])sections.push({type:'paragraph',text:`☐ ${cleanHtml(choice.text||'')} → ${Number(choice.goTo||0)} s${choice.ifChosenText?' — '+cleanHtml(choice.ifChosenText):''}`});return;
        }
        if(library==='IVHotspot'){
            const target=params.destination?.type==='url'?((params.destination.url?.protocol==='other'?'':params.destination.url?.protocol||'')+(params.destination.url?.url||'')):`${Number(params.destination?.time||0)} s`;
            sections.push({type:'paragraph',text:[params.texts?.label||params.texts?.alternativeText,target].filter(Boolean).map(cleanHtml).join(' → ')});return;
        }
        if(library==='MultiMediaChoice'){
            sections.push({type:'paragraph',text:cleanHtml(params.question||''),style:'question'});const answers=[];
            for(const [i,option] of (params.options||[]).entries()){
                const label=String.fromCharCode(65+i);sections.push({type:'paragraph',text:'☐ '+label});await walk(option.media,chapter);
                if(option.poster)sections.push({type:'image',url:getMediaImageUrl(option.poster),imgSizeMm:60});if(option.correct)answers.push(label);
            }
            corrections.push({chapter,sections:[{type:'paragraph',text:answers.join(', '),style:'answer'}]});return;
        }
        if(library==='Accordion'){for(const panel of params.panels||[]){sections.push({type:'header',level:3,text:cleanHtml(panel.title||'')});await walk(panel.content,chapter);}return;}
        if(['MultiChoice','TrueFalse','Blanks','DragText','MarkTheWords','SingleChoiceSet','Summary','Dialogcards','DragQuestion'].includes(library)){
            const start=sections.length;formatCPExerciseStatement(action.library,params,sections);if(sections.length-start<=10 && !sections.slice(start).some(s=>s.type==='image'))for(const s of sections.slice(start,-1))s.keepWithNext=true;const correction=[];formatCPExerciseCorrection(action.library,params,correction);corrections.push({chapter,sections:correction});return;
        }
        const formatted=await formatContentForDocument(modules[library]||library,params,{keepLatex:true});
        const split=formatted.sections.findIndex(s=>s.type==='header'&&s.text===t('doc_fmt_correction_title'));
        if(split>=0){sections.push(...formatted.sections.slice(0,split).filter(s=>s.type!=='pageBreak'));corrections.push({chapter,sections:formatted.sections.slice(split+1)});}
        else sections.push(...formatted.sections);
    };
    for(const [index,chapter] of (data.chapters||[]).entries()){
        const label=data.documentKind==='video'?cleanHtml(chapter.metadata?.title||''):`${t('doc_fmt_ib_chapter')} ${index+1} — ${cleanHtml(chapter.metadata?.title||'')}`;
        const start=sections.length;sections.push({type:'header',level:2,text:label});await walk(chapter,label);
        if(sections.length-start<=10&&!sections.slice(start).some(s=>s.type==='image'))for(const section of sections.slice(start,-1))section.keepWithNext=true;
    }
    if(corrections.length){sections.push({type:'pageBreak'},{type:'header',level:1,text:t('doc_fmt_correction_title')});for(const c of corrections)sections.push({type:'header',level:3,text:c.chapter},...c.sections);}
    return {title:base.title,sections};
}

function formatInteractiveBook(data) {
    if(data.chapters?.[0]?.params)return formatNativeInteractiveBook(data);
    const sections = [];
    const title = data.title || t('doc_fmt_ib_title');

    // ========================================
    // PARTIE 1 : CONTENU ET ÉNONCÉS
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.cover?.enabled !== false && data.cover?.description) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.cover.description),
            style: 'subtitle'
        });
    }

    if (data.cover?.enabled !== false && data.cover?.media) {
        const media = data.cover.media;
        const params = media.params || {};
        const file = media.library?.startsWith('H5P.Image') ? params.file : params.visuals?.poster;
        if (file && getMediaImageUrl(file)) {
            sections.push({ type: 'image', url: getMediaImageUrl(file), imgSizeMm: 100, alt: params.alt || '', caption: params.alt || '' });
            const credits = file.copyright;
            if (credits) {
                const label = [credits.title, credits.author, credits.source, credits.license !== 'U' ? credits.license : ''].filter(Boolean).join(' — ');
                if (label) sections.push({ type: 'paragraph', text: label, style: 'metadata' });
            }
        }
        if (media.library?.startsWith('H5P.Video')) {
            const path = params.sources?.[0]?.path || '';
            if (/^https?:\/\//i.test(path)) {
                sections.push({ type: 'paragraph', text: `${t('doc_fmt_video_link')} : ${path}`, style: 'metadata' });
                sections.push({ type: 'image', qrText: path, imgSizeMm: 32, caption: t('doc_fmt_video_qr_caption') });
            } else {
                sections.push({ type: 'paragraph', text: t('doc_fmt_ib_embedded_video'), style: 'description' });
            }
        }
    }

    sections.push({
        type: 'paragraph',
        text: t('doc_fmt_ib_instructions'),
        style: 'instructions'
    });

    sections.push({ type: 'separator' });

    const chapters = data.chapters || [];
    let exerciseIndex = 0;
    const exercisesForCorrection = [];

    chapters.forEach((chapter, ci) => {
        // Titre du chapitre
        sections.push({
            type: 'header',
            level: 2,
            text: `${t('doc_fmt_ib_chapter')} ${ci + 1}${chapter.title ? ' — ' + cleanHtml(chapter.title) : ''}`
        });

        // Sur papier, lire les colonnes de gauche à droite puis leurs blocs
        // de haut en bas. Les corrigés restent tous dans la seconde partie.
        const lireBlocs = blocks => blocks.flatMap(block =>
            (block?._blockType || block?.type) === 'row'
                ? (block.columns || []).flatMap(column => lireBlocs(column.content || []).map(b => ({ ...b, _inRow: true })))
                : [block]);
        lireBlocs(chapter.content || []).forEach(block => {
            if (!block || typeof block !== 'object') return;
            const blockType = block._blockType || block.type ||
                (block.library ? 'exercise' : (block.table ? 'table' : (block.image ? 'image' : 'text')));

            if (blockType === 'text' && block.text) {
                sections.push({
                    type: 'paragraph',
                    text: cleanHtml(block.text),
                    style: 'content'
                });
            } else if (blockType === 'table' && block.table && block.table.headers) {
                sections.push({
                    type: 'table',
                    headers: block.table.headers,
                    rows: (block.table.rows || []).filter(row => Array.isArray(row))
                });
            } else if (blockType === 'image') {
                const imageUrl = getMediaImageUrl(block.image);
                if (imageUrl) {
                    sections.push({
                        type: 'image',
                        url: imageUrl,
                        ...(block._inRow ? { imgSizeMm: 80 } : {}),
                        caption: block.alt || '',
                        alt: block.alt || ''
                    });
                }
            } else if (blockType === 'qr' && block.url) {
                // QR code d'une ressource (ex. vidéo interactive embarquée) : même
                // bloc que l'export Vidéo interactive autonome (qrText résolu en image
                // au moment de l'export). Permet de scanner le papier pour ouvrir la vidéo.
                sections.push({
                    type: 'image',
                    qrText: block.url,
                    imgSizeMm: 32,
                    caption: block.caption || t('doc_fmt_video_qr_caption') || 'Scannez pour ouvrir la vidéo',
                    alt: 'QR code'
                });
            } else if (blockType === 'exercise') {
                // Accepter le format healé (params à plat) et le format éditeur (exercise imbriqué)
                const lib = block._exerciseLibrary || block.library;
                if (!lib) return;
                const { type, library, _blockType, _exerciseLibrary, exercise, ...flatParams } = block;
                const params = (exercise && typeof exercise === 'object') ? exercise : flatParams;

                exerciseIndex++;
                sections.push({
                    type: 'header',
                    level: 3,
                    text: `${t('doc_fmt_ib_exercise')} ${exerciseIndex}`
                });

                formatCPExerciseStatement(lib, params, sections);
                exercisesForCorrection.push({ index: exerciseIndex, chapterIndex: ci, chapterTitle: chapter.title, library: lib, params });
            }
        });

        sections.push({ type: 'separator' });
    });

    // ========================================
    // PARTIE 2 : CORRECTION (groupée par chapitre)
    // ========================================
    if (exercisesForCorrection.length > 0) {
        sections.push({ type: 'pageBreak' });

        sections.push({
            type: 'header',
            level: 1,
            text: t('doc_fmt_correction_title') || 'Correction'
        });

        sections.push({ type: 'separator' });

        let lastChapterIndex = -1;
        exercisesForCorrection.forEach(({ index, chapterIndex, chapterTitle, library, params }) => {
            if (chapterIndex !== lastChapterIndex) {
                lastChapterIndex = chapterIndex;
                sections.push({
                    type: 'header',
                    level: 2,
                    text: `${t('doc_fmt_ib_chapter')} ${chapterIndex + 1}${chapterTitle ? ' — ' + cleanHtml(chapterTitle) : ''}`
                });
            }

            sections.push({
                type: 'header',
                level: 3,
                text: `${t('doc_fmt_ib_exercise')} ${index}`
            });

            formatCPExerciseCorrection(library, params, sections);

            sections.push({ type: 'separator' });
        });
    }

    return { title, sections };
}

/**
 * Formatte générique pour les types non supportés
 */
function formatGeneric(moduleKey, data) {
    const sections = [];
    const title = data.title || moduleKey;

    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    sections.push({
        type: 'paragraph',
        text: JSON.stringify(data, null, 2),
        style: 'code'
    });

    return { title, sections };
}

/**
 * Obtient le type de question en français
 */
function getQuestionType(library) {
    const types = {
        'H5P.MultiChoice': t('doc_fmt_type_multichoice'),
        'H5P.TrueFalse': t('doc_fmt_type_truefalse'),
        'H5P.Blanks': t('doc_fmt_type_blanks'),
        'H5P.DragText': t('doc_fmt_type_dragtext'),
        'H5P.MarkTheWords': t('doc_fmt_type_markwords'),
        'H5P.Essay': t('doc_fmt_type_essay')
    };

    for (const [key, value] of Object.entries(types)) {
        if (library && library.includes(key)) {
            return value;
        }
    }

    return library || t('doc_fmt_type_default');
}

// ============================================================================
// Convertisseur LaTeX → Unicode pour les exports DOCX/ODT/PDF
// Transforme les expressions \(...\) en caractères Unicode lisibles
// ============================================================================

/**
 * Trouve et convertit toutes les expressions LaTeX dans un texte.
 * Supporte les délimiteurs \(...\) (inline) et \[...\] (display).
 */
function convertLatexToUnicode(text) {
    if (!text || typeof text !== 'string') return text;
    // Délimiteurs inline \(...\)
    let result = text.replace(/\\\((.+?)\\\)/gs, (match, latex) => {
        try { return latexToUnicode(latex); }
        catch (e) { return match; } // Garder le LaTeX brut en cas d'erreur
    });
    // Délimiteurs display \[...\]
    result = result.replace(/\\\[(.+?)\\\]/gs, (match, latex) => {
        try { return latexToUnicode(latex); }
        catch (e) { return match; }
    });
    return result;
}

/**
 * Formate un Devoir (Grille d'évaluation critériée)
 * Produit un document avec la grille sous forme de tableau professionnel,
 * optimisé pour l'impression papier par les enseignants.
 */
/**
 * Rend un document dont la STRUCTURE porte ses propres libellés.
 *
 * **Pourquoi ce formateur ne ressemble à aucun autre.** Tous ses voisins
 * connaissent leur module : `formatQuizSet` sait ce qu'est une question,
 * `formatFlashcards` ce qu'est une carte, et chacun puise ses en-têtes dans les
 * clés `doc_fmt_*`. Celui-ci ne sait rien du parcours — il reçoit des titres,
 * des puces et des tableaux déjà rédigés, et se contente de les rendre.
 *
 * Ce choix n'est pas de la paresse, c'est le contrat de partage. Ce fichier est
 * byte-identique entre Caramel et La Sucrerie, mais **les traductions, elles, ne
 * voyagent pas avec lui** : une clé ajoutée ici et absente des douze locales de
 * l'autre dépôt s'afficherait BRUTE à l'utilisateur. Un formateur qui connaîtrait
 * le vocabulaire du parcours obligerait donc à traduire des dizaines de libellés
 * des deux côtés, pour un module que La Sucrerie ne produit pas. En laissant
 * l'appelant fournir ses libellés — déjà traduits dans SA langue et SON dépôt —
 * on obtient le même document sans une seule clé nouvelle ici.
 *
 * @param {Object} data
 * @param {string} [data.title]   Titre du document.
 * @param {string} [data.intro]   Chapeau, sous le titre.
 * @param {string[]} [data.meta]  Repères courts, rendus sur une ligne (« 4 étapes · 1 h 25 »).
 * @param {Array<Object>} [data.sections] Blocs, dans l'ordre :
 *        `{ titre?, lignes?: string[], puces?: string[],
 *           table?: { headers: string[], rows: string[][] } }`
 * @returns {{title:string, sections:Array}}
 */
function formatParcoursDocument(data) {
    const sections = [];
    const titre = String((data && data.title) || '').trim();
    sections.push({ type: 'header', level: 1, text: titre });

    if (data && data.intro) {
        sections.push({ type: 'paragraph', text: cleanHtml(data.intro), style: 'description' });
    }
    // Les repères tiennent sur une ligne : « Éléa · 4 étapes · 11 activités ».
    if (data && Array.isArray(data.meta) && data.meta.length) {
        sections.push({ type: 'paragraph', text: data.meta.filter(Boolean).join(' · ') });
    }
    sections.push({ type: 'separator' });

    for (const bloc of (data && Array.isArray(data.sections) ? data.sections : [])) {
        if (!bloc) continue;
        if (bloc.titre) {
            sections.push({ type: 'header', level: 2, text: cleanHtml(bloc.titre) });
        }
        for (const ligne of (Array.isArray(bloc.lignes) ? bloc.lignes : [])) {
            if (ligne) sections.push({ type: 'paragraph', text: cleanHtml(ligne) });
        }
        for (const puce of (Array.isArray(bloc.puces) ? bloc.puces : [])) {
            if (puce) sections.push({ type: 'bulletPoint', text: cleanHtml(puce) });
        }
        const table = bloc.table;
        if (table && Array.isArray(table.headers) && Array.isArray(table.rows) && table.rows.length) {
            sections.push({
                type: 'table',
                headers: table.headers.map(h => cleanHtml(String(h || ''))),
                rows: table.rows.map(r => (Array.isArray(r) ? r : []).map(c => cleanHtml(String(c || '')))),
            });
        }
    }

    return { title: titre, sections };
}

function formatDevoir(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_devoir_title');

    // ========================================
    // EN-TÊTE
    // ========================================
    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

    if (data.description) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.description),
            style: 'description'
        });
    }

    sections.push({ type: 'separator' });

    // ========================================
    // GRILLE D'ÉVALUATION
    // ========================================
    const rubricName = data.rubricName || t('doc_fmt_devoir_rubric_name');
    sections.push({
        type: 'header',
        level: 2,
        text: rubricName
    });

    const criteria = data.criteria || [];
    if (criteria.length > 0) {
        // Déterminer le nombre max de niveaux
        const maxLevels = Math.max(...criteria.map(c => (c.levels || []).length));

        // En-têtes : Critère + Niveau 1, Niveau 2, etc.
        const headers = [t('doc_fmt_devoir_criterion') || 'Critère'];
        for (let j = 0; j < maxLevels; j++) {
            headers.push(`${t('doc_fmt_devoir_level') || 'Niveau'} ${j + 1}`);
        }

        // Lignes : chaque critère = une ligne
        const rows = criteria.map(criterion => {
            const row = [cleanHtml(criterion.description || '')];
            const levels = criterion.levels || [];
            for (let j = 0; j < maxLevels; j++) {
                if (j < levels.length) {
                    const level = levels[j];
                    const score = level.score ?? j;
                    const def = cleanHtml(level.definition || '');
                    // Format : score en gras + descripteur
                    row.push(`**${score} ${score <= 1 ? (t('doc_fmt_devoir_point') || 'pt') : (t('doc_fmt_devoir_points') || 'pts')}** — ${def}`);
                } else {
                    row.push('');
                }
            }
            return row;
        });

        sections.push({
            type: 'table',
            headers: headers,
            rows: rows,
            style: 'rubricGrid'
        });

        // Score total
        const maxScore = criteria.reduce((sum, c) => {
            const levels = c.levels || [];
            const maxLevel = levels.reduce((max, l) => Math.max(max, l.score ?? 0), 0);
            return sum + maxLevel;
        }, 0);

        sections.push({
            type: 'paragraph',
            text: `**${t('doc_fmt_devoir_total') || 'Score total'} : ${maxScore} ${maxScore <= 1 ? (t('doc_fmt_devoir_point') || 'pt') : (t('doc_fmt_devoir_points') || 'pts')}**`,
            style: 'total'
        });
    }

    return { title, sections };
}

/**
 * Post-traitement : applique la conversion LaTeX→Unicode sur tout le contenu formaté
 */
function postProcessLatex(result) {
    if (!result) return result;

    // Convertir le titre
    if (result.title) {
        result.title = convertLatexToUnicode(result.title);
    }

    // Convertir toutes les sections
    if (result.sections && Array.isArray(result.sections)) {
        for (const section of result.sections) {
            if (section.text && typeof section.text === 'string') {
                section.text = convertLatexToUnicode(section.text);
            }
            // Traiter les sections flashcardTable (structure rows avec left/right)
            if (section.type === 'flashcardTable' && section.rows) {
                for (const row of section.rows) {
                    for (const side of ['left', 'right']) {
                        if (row[side]) {
                            if (row[side].text && typeof row[side].text === 'string') {
                                row[side].text = convertLatexToUnicode(row[side].text);
                            }
                            if (row[side].hint && typeof row[side].hint === 'string') {
                                row[side].hint = convertLatexToUnicode(row[side].hint);
                            }
                        }
                    }
                }
            }
            // Traiter les sections table (headers + rows de strings)
            if (section.type === 'table') {
                if (section.headers && Array.isArray(section.headers)) {
                    section.headers = section.headers.map(h =>
                        typeof h === 'string' ? convertLatexToUnicode(h) : h
                    );
                }
                if (section.rows && Array.isArray(section.rows)) {
                    section.rows = section.rows.map(row =>
                        Array.isArray(row)
                            ? row.map(cell => typeof cell === 'string' ? convertLatexToUnicode(cell) : cell)
                            : row
                    );
                }
            }
        }
    }

    return result;
}

/**
 * Répartit un tableau en groupes équilibrés de 3 max, sans jamais créer de groupe isolé.
 * Évite les cas disgracieux comme [3, 1] en préférant [2, 2].
 *
 * Exemples : 2→[2]  3→[3]  4→[2,2]  5→[3,2]  6→[3,3]  7→[3,2,2]  8→[3,3,2]  9→[3,3,3]
 *
 * @param {Array} items - Le tableau à répartir
 * @returns {Array<Array>} - Les groupes
 */
function splitIntoBalancedGroups(items) {
    const MAX_COLS = 3;
    const groups = [];
    let remaining = items.length;
    let offset = 0;

    while (remaining > 0) {
        // Si le reste fait 4, découper en [2, 2] plutôt que [3, 1]
        if (remaining === 4) {
            groups.push(items.slice(offset, offset + 2));
            groups.push(items.slice(offset + 2, offset + 4));
            break;
        }
        const groupSize = Math.min(MAX_COLS, remaining);
        groups.push(items.slice(offset, offset + groupSize));
        offset += groupSize;
        remaining -= groupSize;
    }

    return groups;
}

/**
 * Nettoie le HTML en texte brut (simplifié)
 * Supprime également tous les emojis Unicode pour un rendu propre dans tous les formats (DOCX, ODT, PDF)
 */
function cleanHtml(html) {
    if (!html) return '';

    let text = html.toString();

    // Protéger les blocs LaTeX \(...\) et \[...\] avant le remplacement des \n
    // pour ne pas casser les commandes comme \neq, \nabla, \nu, etc.
    const latexBlocks = [];
    text = text.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, (match) => {
        const idx = latexBlocks.length;
        latexBlocks.push(match);
        return `\x00LATEX${idx}\x00`;
    });

    // Convertir les \n littéraux échappés (venant du JSON) en vrais sauts de ligne
    text = text.replace(/\\n/g, '\n');

    // Remplace les balises de structure par leur équivalent texte
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '');

    // Emphase enveloppant des spans (sortie CKEditor, ex. <em><span color>
    // <strong>quiz</strong></span></em>) : une fois convertie en Markdown, elle
    // est intokenisable à plat (le * ouvrant colle à la balise) → on DISTRIBUE
    // l'emphase À L'INTÉRIEUR de chaque span avant la conversion (audit
    // Sucrerie 2026-07-05, F2). Ne concerne que les emphases dont le contenu
    // est exclusivement composé de spans (+ blancs/ponctuation légère).
    for (const tag of ['strong', 'b', 'em', 'i']) {
        const re = new RegExp(`<${tag}>((?:\\s|,|&nbsp;|<span[^>]*>[\\s\\S]*?<\\/span>)+)<\\/${tag}>`, 'gi');
        text = text.replace(re, (m, content) =>
            content.replace(/(<span[^>]*>)([\s\S]*?)(<\/span>)/gi,
                (mm, open, inner, close) => `${open}<${tag}>${inner}</${tag}>${close}`));
    }

    // Convertir gras/italique en Markdown
    text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');

    // Titres → texte brut
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1');

    // Listes → puces et numéros (préservés pour le formatage document)
    // Listes non ordonnées
    text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
        return '\n' + content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n') + '\n';
    });
    // Listes ordonnées
    text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
        let idx = 0;
        return '\n' + content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, li) => {
            idx++;
            return `${idx}. ${li}\n`;
        }) + '\n';
    });
    // Fallback pour les <li> restants (hors ul/ol)
    text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n');
    text = text.replace(/<\/?[uo]l[^>]*>/gi, '\n');

    // PRÉSERVER : couleur, liens, souligné, barré, sub, sup
    // Ces tags sont gérés par parseMarkdownToTextRuns dans document-exporter.js
    // (ne pas les supprimer ici)

    // Supprimer les autres balises HTML (div, span sans style, etc.)
    // Mais garder : <span style="color:...">, <a ...>, <u>, <s>, <sub>, <sup>
    text = text.replace(/<(?!\/?(?:span|a|u|s|sub|sup)\b)[^>]+>/gi, '');

    // Nettoyer les spans sans style (wrappers vides)
    text = text.replace(/<span>([^<]*)<\/span>/gi, '$1');
    text = text.replace(/<span\s+(?!style)[^>]*>([^<]*)<\/span>/gi, '$1');

    // Décode les entités HTML
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    // Références de caractères numériques génériques : décimales `&#NNN;` (y
    // compris zéro-paddées comme `&#039;`, que l'ancien `&#39;` littéral ne
    // couvrait pas — les apostrophes échappées par CKEditor restaient brutes) et
    // hexadécimales `&#xHH;`. Code points hors plage Unicode laissés intacts.
    text = text.replace(/&#(\d+);/g, (m, dec) => {
        const cp = parseInt(dec, 10);
        return (cp >= 0 && cp <= 0x10FFFF) ? String.fromCodePoint(cp) : m;
    });
    text = text.replace(/&#x([0-9a-fA-F]+);/g, (m, hex) => {
        const cp = parseInt(hex, 16);
        return (cp >= 0 && cp <= 0x10FFFF) ? String.fromCodePoint(cp) : m;
    });

    // Remplacer les symboles Unicode spéciaux par des équivalents textuels
    text = text.replace(/✓/g, '[V]');
    text = text.replace(/✗/g, '[X]');
    text = text.replace(/→/g, '->');
    text = text.replace(/±/g, '+/-');

    // Supprimer tous les emojis Unicode (cohérence DOCX/ODT/PDF)
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1FA00}-\u{1FA6F}\u{FE00}-\u{FE0F}\u{200D}\u{2139}\u{203C}\u{2049}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}]/gu, '');

    // Nettoie les espaces multiples et les retours à la ligne excessifs
    text = text.replace(/ {2,}/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();

    // Restaurer les blocs LaTeX protégés
    text = text.replace(/\x00LATEX(\d+)\x00/g, (_, idx) => latexBlocks[parseInt(idx)]);

    return text;
}

/**
 * Traite le texte Cloze (Moodle) pour l'énoncé élève
 */
function processClozeForStatement(text) {
    if (!text) return '';
    // Remplace les blocs {weight:TYPE:=good~bad...} par des blancs
    return text.replace(/{[^}]+}/g, '_________________');
}

/**
 * Traite le texte Cloze (Moodle) pour la correction
 */
function processClozeForCorrection(text) {
    if (!text) return '';
    // Remplace les blocs {weight:TYPE:=good~bad...} par la bonne réponse
    return text.replace(/{[^}]+}/g, (match) => {
        // Chercher la partie après := ou juste =
        // Cloze format: {weight:TYPE:=correct~wrong} or {weight:TYPE:correct} (if only one option)
        // Usually it's :=correct
        const correctPart = match.match(/[:=]=([^~}]+)/);
        if (correctPart && correctPart[1]) {
            return `**${correctPart[1]}**`; // En gras pour la correction
        }

        // Fallback pour les formats plus simples sans le =
        const simplePart = match.match(/:([^:~}]+)}/);
        if (simplePart && simplePart[1]) {
            return `**${simplePart[1]}**`;
        }

        return '???';
    });
}
