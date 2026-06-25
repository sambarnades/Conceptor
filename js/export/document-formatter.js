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
        'InteractiveVideo': formatVideoInteractive
    };

    const formatter = formatters[moduleKey];
    if (!formatter) {
        const genericResult = formatGeneric(moduleKey, jsonData);
        return options.keepLatex ? genericResult : postProcessLatex(genericResult);
    }

    // formatChart est async (chargement paresseux de chart-renderer.js)
    const result = await formatter(jsonData);
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
 * Formate l'énoncé d'une question à choix multiples (sans indication des bonnes réponses)
 */
function formatMultiChoiceStatement(params, sections) {
    if (params.answers && Array.isArray(params.answers)) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_proposed_answers') || 'Propositions :',
            style: 'answersTitle'
        });

        // Mélanger les réponses pour l'énoncé (optionnel mais pédagogiquement intéressant)
        const shuffledAnswers = [...params.answers];
        params.answers.forEach((answer, i) => {
            const letter = String.fromCharCode(65 + i); // A, B, C, D...
            sections.push({
                type: 'checkbox',
                text: `${letter}. ${cleanHtml(answer.text)}`
            });
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
}

/**
 * Formate l'énoncé d'une question Vrai/Faux (sans indication de la bonne réponse)
 */
function formatTrueFalseStatement(params, sections) {
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
}

/**
 * Formate l'énoncé d'une question à texte à trous (avec les trous à compléter)
 */
function formatBlanksStatement(params, sections) {
    if (params.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(params.taskDescription),
            style: 'description'
        });
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
                    const answer = match.replace(/\*/g, '').split('/')[0].trim();
                    answers.push(answer);
                });
            }
        });
    } else if (params.text) {
        const matches = cleanHtml(params.text).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                const answer = match.replace(/\*/g, '').split('/')[0].trim();
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

/**
 * Formate l'énoncé d'une question "Glisser les mots" (texte avec trous + liste des mots)
 */
function formatDragTextStatement(params, sections) {
    if (params.textField) {
        // Extraire les mots à placer (entre astérisques)
        const wordsToPlace = [];
        const matches = cleanHtml(params.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                const word = match.replace(/\*/g, '').split('/')[0].trim();
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

        // Liste des mots à placer (mélangés)
        if (wordsToPlace.length > 0) {
            sections.push({
                type: 'paragraph',
                text: t('doc_fmt_words_to_place') || 'Mots à placer :',
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
    if (params.textField) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_completed_text') || 'Texte complété :',
            style: 'answersTitle'
        });

        // Afficher le texte avec les réponses (en gras)
        const textWithAnswers = cleanHtml(params.textField).replace(/\*([^*]+)\*/g, (match, content) => {
            const answer = content.split('/')[0].trim();
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
    if (params.keywords && params.keywords.length > 0) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_keywords_expected') || 'Mots-clés attendus dans la réponse :',
            style: 'answersTitle'
        });

        params.keywords.forEach(kw => {
            sections.push({
                type: 'bulletPoint',
                text: cleanHtml(kw.keyword || kw.word || kw.text || (typeof kw === 'string' ? kw : '')),
                style: 'correctAnswer'
            });
        });
    } else if (!params.keywords || params.keywords.length === 0) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_open_answer') || 'Réponse ouverte - évaluation selon les critères définis.',
            style: 'description'
        });
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
function formatFlashcards(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_flashcards_title');
    const cards = data.cards || [];

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
                return card.image.path; // data URL ou chemin relatif
            };

            // Recto : ordre normal [gauche, droite]
            rectoRows.push({
                left: leftCard ? {
                    text: cleanHtml(leftCard.text),
                    hint: leftCard.tip ? cleanHtml(leftCard.tip) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1,
                    imageUrl: getCardImage(leftCard)
                } : null,
                right: rightCard ? {
                    text: cleanHtml(rightCard.text),
                    hint: rightCard.tip ? cleanHtml(rightCard.tip) : null,
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
            fillWidth: true
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
            fillWidth: true
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

    // H5P Timeline n'accepte que des URLs externes dans asset.media (pas d'upload de fichier)
    if (timeline.asset) {
        const mediaUrl = timeline.asset.media || timeline.asset.path;
        if (mediaUrl) {
            sections.push({
                type: 'image',
                url: mediaUrl,
                caption: timeline.asset.caption || '',
                alt: timeline.asset.credit || ''
            });
        }
    } else if (timeline.media && (timeline.media.path || timeline.media.url)) {
        const mediaUrl = timeline.media.path || timeline.media.url;
        sections.push({
            type: 'image',
            url: mediaUrl,
            caption: timeline.media.caption || '',
            alt: timeline.media.credit || ''
        });
    }

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
                text: `${h5pDateToLocale(event.startDate, currentLang)} - ${cleanHtml(event.headline)}`
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
            } else if (event.asset && event.asset.media) {
                sections.push({
                    type: 'image',
                    url: event.asset.media,
                    caption: event.asset.caption || '',
                    alt: event.asset.credit || ''
                });
            }

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

    // Image de contexte (après la description, avant le texte)
    const dtwImageUrl = getMediaImageUrl(data.mediaImage);
    if (dtwImageUrl) {
        sections.push({ type: 'image', url: dtwImageUrl });
    }

    if (data.textField) {
        // Extraire les mots à placer (entre astérisques)
        const wordsToPlace = [];
        const matches = cleanHtml(data.textField).match(/\*([^*]+)\*/g);
        if (matches) {
            matches.forEach(match => {
                const word = match.replace(/\*/g, '').split('/')[0].trim();
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

        // Liste des mots à placer (mélangés)
        if (wordsToPlace.length > 0) {
            sections.push({
                type: 'header',
                level: 2,
                text: t('doc_fmt_words_to_place') || 'Mots à placer'
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

    if (data.textField) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_completed_text') || 'Texte complété'
        });

        // Afficher le texte avec les réponses
        const textWithAnswers = cleanHtml(data.textField).replace(/\*([^*]+)\*/g, (match, content) => {
            const answer = content.split('/')[0].trim();
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

    if (data.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.taskDescription),
            style: 'description'
        });
    }

    // Image de contexte (après la description, avant le texte à trous)
    const fibImageUrl = getMediaImageUrl(data.mediaImage);
    if (fibImageUrl) {
        sections.push({ type: 'image', url: fibImageUrl });
    }

    if (data.questions && Array.isArray(data.questions)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_text_to_complete') || 'Texte à compléter'
        });

        data.questions.forEach(q => {
            // Remplacer les réponses entre astérisques par des blancs
            const textWithBlanks = cleanHtml(q).replace(/\*([^*]+)\*/g, '_________');
            sections.push({
                type: 'paragraph',
                text: textWithBlanks,
                style: 'blanksText'
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
    const mtwImageUrl = getMediaImageUrl(data.mediaImage);
    if (mtwImageUrl) {
        sections.push({ type: 'image', url: mtwImageUrl });
    }

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
    const title = t('doc_fmt_glossary_title');

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

            sections.push({ type: 'separator' });
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

            if (summary.summary && Array.isArray(summary.summary)) {
                summary.summary.forEach((statement, i) => {
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
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : A. ${cleanHtml(summary.summary[0])}`,
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

    // Image de contexte (après l'énoncé, avant les réponses)
    const mcImageUrl = getMediaImageUrl(data.mediaImage);
    if (mcImageUrl) {
        sections.push({ type: 'image', url: mcImageUrl });
    }

    if (data.answers && Array.isArray(data.answers)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_proposed_answers') || 'Propositions'
        });

        data.answers.forEach((answer, i) => {
            const letter = String.fromCharCode(65 + i);
            sections.push({
                type: 'checkbox',
                text: `${letter}. ${cleanHtml(answer.text)}`
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

    if (data.answers && Array.isArray(data.answers)) {
        const correctAnswers = data.answers
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

                choice.answers.forEach((answer, i) => {
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
                    text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : A. ${cleanHtml(choice.answers[0])}`,
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

    // Image de contexte (après l'énoncé, avant les propositions)
    const tfImageUrl = getMediaImageUrl(data.mediaImage);
    if (tfImageUrl) {
        sections.push({ type: 'image', url: tfImageUrl });
    }

    const trueLabel = (data.l10n && data.l10n.trueText) ? cleanHtml(data.l10n.trueText) : (t('doc_fmt_true') || 'Vrai');
    const falseLabel = (data.l10n && data.l10n.falseText) ? cleanHtml(data.l10n.falseText) : (t('doc_fmt_false') || 'Faux');

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

    const correct = data.correct === 'true' || data.correct === true;
    sections.push({
        type: 'paragraph',
        text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : ${correct ? `A. ${trueLabel}` : `B. ${falseLabel}`}`,
        style: 'correctAnswer'
    });

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
    const title = data.title || t('doc_fmt_dialog_cards_title');
    const dialogs = data.dialogs || [];

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
                return dialog.image.path;
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
        shuffled.sort(() => Math.random() - 0.5);

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

    if (data.wordList) {
        const words = (Array.isArray(data.wordList) ? data.wordList : data.wordList.split(',')).map(w => w.trim());
        const instructionText = (t('doc_fmt_find_instructions') || 'Trouvez les @count mots cachés dans la grille :')
            .replace('@count', words.length);
        sections.push({
            type: 'paragraph',
            text: instructionText,
            style: 'instructions'
        });
        sections.push({
            type: 'paragraph',
            text: words.join(', ') + '.',
            style: 'wordList'
        });
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

    if (data.wordList) {
        const words = Array.isArray(data.wordList) ? data.wordList : data.wordList.split(',').map(w => w.trim());
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

    if (data.taskDescription) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.taskDescription),
            style: 'description'
        });
    }

    // Image de contexte (après la consigne, avant l'espace de réponse)
    const essayImageUrl = getMediaImageUrl(data.mediaImage);
    if (essayImageUrl) {
        sections.push({ type: 'image', url: essayImageUrl });
    }

    // Espace pour la réponse de l'élève
    sections.push({
        type: 'header',
        level: 2,
        text: t('doc_fmt_answer_space') || 'Espace pour la réponse'
    });

    sections.push({
        type: 'paragraph',
        text: '___________________________________________________________________\n\n___________________________________________________________________\n\n___________________________________________________________________\n\n___________________________________________________________________\n\n___________________________________________________________________',
        style: 'blanksText'
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

    if (data.keywords && data.keywords.length > 0) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_keywords_expected') || 'Mots-clés attendus dans la réponse'
        });

        data.keywords.forEach(kw => {
            sections.push({
                type: 'bulletPoint',
                text: cleanHtml(kw.keyword || kw.word || kw.text || (typeof kw === 'string' ? kw : '')),
                style: 'correctAnswer'
            });
        });
    } else if (!data.keywords || data.keywords.length === 0) {
        sections.push({
            type: 'paragraph',
            text: t('doc_fmt_open_answer') || 'Réponse ouverte - évaluation selon les critères définis par l\'enseignant.',
            style: 'description'
        });
    }

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
function formatCoursePresentation(data) {
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
        if (params.taskDescription) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.taskDescription), style: 'question' });
        }
        formatBlanksStatement(params, sections);
    } else if (library.includes('DragText')) {
        if (params.taskDescription) {
            sections.push({ type: 'paragraph', text: cleanHtml(params.taskDescription), style: 'question' });
        }
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
                    choice.answers.forEach((answer, j) => {
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
                if (group.summary && Array.isArray(group.summary)) {
                    group.summary.forEach((statement, j) => {
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
                rows.push([cleanHtml(dialog.text || ''), cleanHtml(dialog.answer || '')]);
            });
            sections.push({ type: 'table', headers, rows });
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
                        text: `${t('doc_fmt_correct_answer') || 'Bonne réponse'} : A. ${cleanHtml(choice.answers[0])}`,
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
                        text: `${t('doc_fmt_claim_index') || 'Groupe'} ${i + 1} : A. ${cleanHtml(group.summary[0])}`,
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
function formatInteractiveBook(data) {
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

    if (data.cover && data.cover.description) {
        sections.push({
            type: 'paragraph',
            text: cleanHtml(data.cover.description),
            style: 'subtitle'
        });
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

        (chapter.content || []).forEach(block => {
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
                        caption: block.alt || '',
                        alt: block.alt || ''
                    });
                }
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
    text = text.replace(/&#39;/g, "'");

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
