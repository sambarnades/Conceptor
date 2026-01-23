/**
 * @file Module de formatage des contenus générés pour l'export document.
 * Ce module transforme les JSON générés par l'IA en contenu structuré
 * adapté aux formats DOCX, ODT et PDF, avec une mise en forme professionnelle
 * destinée aux enseignants.
 */

import { translations, t } from './translation.js';

/**
 * Formatte un contenu JSON selon son type pour l'export document
 * @param {string} moduleKey - La clé du module (ex: 'QuizSet', 'Flashcards', etc.)
 * @param {Object} jsonData - Les données JSON du contenu
 * @returns {Object} - Le contenu formaté avec sections et éléments structurés
 */
export function formatContentForDocument(moduleKey, jsonData) {
    const formatters = {
        'QuizSet': formatQuizSet,
        'QuizSetQCM': formatQuizSet,
        'QuizSetVF': formatQuizSet,
        'Flashcards': formatFlashcards,
        'Crossword': formatCrossword,
        'Timeline': formatTimeline,
        'DragTheWords': formatDragTheWords,
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
        // Modules Éléa
        'QCM': formatQCM,
        'moodleXml': formatMoodleXml,
        'Appariement': formatAppariement,
        'Millionnaire': formatMillionnaire,
        'glossaireXml': formatGlossaireXml,
        'Page': formatPage
    };

    const formatter = formatters[moduleKey];
    if (!formatter) {
        return formatGeneric(moduleKey, jsonData);
    }

    return formatter(jsonData);
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
            text: data.description,
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
                    text: question.metadata.title,
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
        text: '________________________________________________________________________\n\n________________________________________________________________________\n\n________________________________________________________________________\n\n________________________________________________________________________',
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
                text: kw.keyword || kw.text || (typeof kw === 'string' ? kw : ''),
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

            // Recto : ordre normal [gauche, droite]
            rectoRows.push({
                left: leftCard ? {
                    text: cleanHtml(leftCard.text),
                    hint: leftCard.tip ? cleanHtml(leftCard.tip) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1
                } : null,
                right: rightCard ? {
                    text: cleanHtml(rightCard.text),
                    hint: rightCard.tip ? cleanHtml(rightCard.tip) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1
                } : null
            });

            // Verso : ordre miroir [droite, gauche] pour alignement impression
            versoRows.push({
                left: rightCard ? {
                    text: cleanHtml(rightCard.answer),
                    hint: null, // Flashcards n'ont pas d'indice verso
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1
                } : null,
                right: leftCard ? {
                    text: cleanHtml(leftCard.answer),
                    hint: null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1
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
 */
function formatCrossword(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_crossword_title');

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

    if (data.words && Array.isArray(data.words)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_definitions') || 'Définitions'
        });

        data.words.forEach((word, index) => {
            // Indiquer le nombre de lettres comme indice
            const letterCount = word.answer ? word.answer.length : '?';
            sections.push({
                type: 'paragraph',
                text: `${index + 1}. ${cleanHtml(word.clue)} (${letterCount} ${t('doc_fmt_letters') || 'lettres'})`,
                style: 'crosswordClue'
            });

            // Indice supplémentaire si présent
            if (word.extraClue && word.extraClue.params && word.extraClue.params.text) {
                sections.push({
                    type: 'paragraph',
                    text: `   ${t('doc_fmt_hint') || 'Indice'} : ${cleanHtml(word.extraClue.params.text)}`,
                    style: 'tip'
                });
            }
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

    if (data.words && Array.isArray(data.words)) {
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_answers') || 'Réponses'
        });

        data.words.forEach((word, index) => {
            sections.push({
                type: 'paragraph',
                text: `${index + 1}. ${word.answer}`,
                style: 'correctAnswer'
            });
        });
    }

    return { title, sections };
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

    // Gestion de l'image principale (Asset)
    if (timeline.asset) {
        const mediaUrl = timeline.asset.media || timeline.asset.path; // Supporte media ou path

        if (mediaUrl) {
            sections.push({
                type: 'image',
                url: mediaUrl,
                caption: timeline.asset.caption || '',
                alt: timeline.asset.credit || ''
            });
        }
    } else {
        // Fallback: check if 'media' exists at root level (some H5P formats)
        if (timeline.media && (timeline.media.path || timeline.media.url)) {
            const mediaUrl = timeline.media.path || timeline.media.url;
            sections.push({
                type: 'image',
                url: mediaUrl,
                caption: timeline.media.caption || '',
                alt: timeline.media.credit || ''
            });
        }
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
                text: `${event.startDate} - ${cleanHtml(event.headline)}`
            });

            if (event.asset && event.asset.media) {
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
                    text: `🏷️ ${event.tag}`,
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
                text: `${era.startDate} - ${era.endDate} : ${cleanHtml(era.headline)}`,
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
        // Extraire toutes les bonnes réponses
        const answers = [];
        data.questions.forEach(q => {
            const matches = cleanHtml(q).match(/\*([^*]+)\*/g);
            if (matches) {
                matches.forEach(match => {
                    const answer = match.replace(/\*/g, '').split('/')[0].trim();
                    answers.push(answer);
                });
            }
        });

        if (answers.length > 0) {
            sections.push({
                type: 'header',
                level: 2,
                text: t('doc_fmt_correct_answers') || 'Réponses correctes'
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
 * Formate un Chart
 */
function formatChart(data) {
    const sections = [];
    const title = data.figureDefinition || t('doc_fmt_chart_title');

    sections.push({
        type: 'header',
        level: 1,
        text: title
    });

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

            // Recto : ordre normal [gauche, droite]
            rectoRows.push({
                left: leftDialog ? {
                    text: cleanHtml(leftDialog.text),
                    hint: leftDialog.tips?.front ? cleanHtml(leftDialog.tips.front) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1
                } : null,
                right: rightDialog ? {
                    text: cleanHtml(rightDialog.text),
                    hint: rightDialog.tips?.front ? cleanHtml(rightDialog.tips.front) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1
                } : null
            });

            // Verso : ordre miroir [droite, gauche] pour alignement impression
            versoRows.push({
                left: rightDialog ? {
                    text: cleanHtml(rightDialog.answer),
                    hint: rightDialog.tips?.back ? cleanHtml(rightDialog.tips.back) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + rightIndex + 1
                } : null,
                right: leftDialog ? {
                    text: cleanHtml(leftDialog.answer),
                    hint: leftDialog.tips?.back ? cleanHtml(leftDialog.tips.back) : null,
                    cardNumber: pageIndex * CARDS_PER_PAGE + leftIndex + 1
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
        const words = data.wordList.split(',').map(w => w.trim());
        sections.push({
            type: 'paragraph',
            text: `${t('doc_fmt_find_instructions') || 'Trouvez'} ${words.length} ${t('doc_fmt_hidden_words') || 'mots cachés dans la grille.'}`,
            style: 'instructions'
        });

        // Donner des indices : première lettre ou nombre de lettres
        sections.push({
            type: 'header',
            level: 2,
            text: t('doc_fmt_hints') || 'Indices'
        });

        words.forEach((word, i) => {
            sections.push({
                type: 'bulletPoint',
                text: `${i + 1}. ${word.charAt(0).toUpperCase()}${'_'.repeat(word.length - 1)} (${word.length} ${t('doc_fmt_letters') || 'lettres'})`
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

    // Espace pour la réponse de l'élève
    sections.push({
        type: 'header',
        level: 2,
        text: t('doc_fmt_answer_space') || 'Espace pour la réponse'
    });

    sections.push({
        type: 'paragraph',
        text: '________________________________________________________________________\n\n________________________________________________________________________\n\n________________________________________________________________________\n\n________________________________________________________________________\n\n________________________________________________________________________',
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
                text: kw.keyword || kw.text || (typeof kw === 'string' ? kw : ''),
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
 * Formate un QCM pour Éléa
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatQCM(data) {
    const sections = [];
    const title = data.title || t('doc_fmt_qcm_title');

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

    if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question, index) => {
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

            if (question.answers && Array.isArray(question.answers)) {
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

            if (question.answers && Array.isArray(question.answers)) {
                const correctAnswers = question.answers
                    .map((answer, i) => ({ answer, letter: String.fromCharCode(65 + i) }))
                    .filter(item => item.answer.iscorrect);

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
                    // Cloze correction
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
    }

    return { title, sections };
}

/**
 * Formate un Test Moodle XML
 * Structure pédagogique : énoncé + saut de page + correction
 */
function formatMoodleXml(data) {
    const sections = [];
    const title = data.bank_name || t('doc_fmt_moodle_test_title');

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
        data.blocks.forEach((block, index) => {
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
                    if (block.data && block.data.images && Array.isArray(block.data.images)) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        block.data.images.forEach(img => {
                            sections.push({
                                type: 'image',
                                url: img.src,
                                alt: cleanHtml(img.alt || ''),
                                caption: cleanHtml(img.caption || '')
                            });
                        });
                    }
                    break;

                case '#17_method_image_desc':
                    if (block.data) {
                        if (block.data.title) {
                            sections.push({
                                type: 'header',
                                level: 2,
                                text: cleanHtml(block.data.title)
                            });
                        }
                        if (block.data.image) {
                            sections.push({
                                type: 'image',
                                url: block.data.image.src,
                                alt: cleanHtml(block.data.image.alt || ''),
                                caption: cleanHtml(block.data.image.caption || '')
                            });
                        }
                        if (block.data.description) {
                            sections.push({
                                type: 'paragraph',
                                text: cleanHtml(block.data.description)
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
    const emojis = {
        'objectif': '🎯',
        'savoir': '📚',
        'alerte': '⚠️',
        'info': 'ℹ️',
        'tip': '💡',
        'warning': '⚠️',
        'success': '✓',
        'error': '✗'
    };
    return emojis[type] || '•';
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

/**
 * Nettoie le HTML en texte brut (simplifié)
 */
function cleanHtml(html) {
    if (!html) return '';

    let text = html.toString();

    // Remplace les balises HTML courantes par leur équivalent texte
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '');
    text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1');
    text = text.replace(/<li>(.*?)<\/li>/gi, '• $1\n');
    text = text.replace(/<\/?ul[^>]*>/gi, '\n');
    text = text.replace(/<\/?ol[^>]*>/gi, '\n');
    text = text.replace(/<[^>]+>/g, ''); // Supprime toutes les autres balises

    // Décode les entités HTML
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Nettoie les espaces multiples et les retours à la ligne excessifs
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();

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
