/**
 * @file Module de formatage des contenus générés pour l'export document.
 * Ce module transforme les JSON générés par l'IA en contenu structuré
 * adapté aux formats DOCX, ODT et PDF, avec une mise en forme professionnelle
 * destinée aux enseignants.
 */

import { translations, t, currentLang } from '../core/translation.js';
import { h5pDateToLocale } from '../core/utils.js';
// chart-renderer.js chargé à la demande dans formatChart() pour éviter
// de payer le coût de parsing au premier import de document-formatter.js


/**
 * Formatte un contenu JSON selon son type pour l'export document
 * @param {string} moduleKey - La clé du module (ex: 'QuizSet', 'Flashcards', etc.)
 * @param {Object} jsonData - Les données JSON du contenu
 * @returns {Object} - Le contenu formaté avec sections et éléments structurés
 */
export async function formatContentForDocument(moduleKey, jsonData) {
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
        // Modules Éléa
        'QCM': formatQCM,
        'test_elea': formatMoodleXml,
        'Appariement': formatAppariement,
        'Millionnaire': formatMillionnaire,
        'glossaireXml': formatGlossaireXml,
        'Page': formatPage,
        'Devoir': formatDevoir
    };

    const formatter = formatters[moduleKey];
    if (!formatter) {
        return postProcessLatex(formatGeneric(moduleKey, jsonData));
    }

    // formatChart est async (chargement paresseux de chart-renderer.js)
    const result = await formatter(jsonData);
    return postProcessLatex(result);
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
                text: kw.keyword || kw.word || kw.text || (typeof kw === 'string' ? kw : ''),
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

    // Image de la grille vide (capturée depuis le H5P)
    if (data._gridImage) {
        sections.push({
            type: 'image',
            imageData: data._gridImage,
            fillWidth: true
        });
    }

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

    // Image de la grille corrigée (capturée depuis le H5P)
    if (data._solutionGridImage) {
        sections.push({
            type: 'image',
            imageData: data._solutionGridImage,
            fillWidth: true
        });
    }

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
                text: `${h5pDateToLocale(event.startDate, currentLang)} - ${cleanHtml(event.headline)}`
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
            .map((el, i) => ({ text: cleanHtml(el.text || ''), originalIndex: i }))
            .sort(() => Math.random() - 0.5);

        // IMPORTANT : 3 colonnes fixes pour alignement avec la grille de travail
        const LABELS_PER_ROW = 3;
        const labelRows = [];
        for (let i = 0; i < shuffled.length; i += LABELS_PER_ROW) {
            const row = [];
            for (let j = 0; j < LABELS_PER_ROW; j++) {
                if (i + j < shuffled.length) {
                    row.push(`${i + j + 1}. ${shuffled[i + j].text}`);
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

        // Construire un mapping zone → étiquettes correctes
        const zoneCorrectLabels = dropZones.map(zone => {
            const correctIndices = Array.isArray(zone.correctElements) ? zone.correctElements : [];
            return correctIndices
                .map(idx => elements[idx] ? cleanHtml(elements[idx].text || '') : '')
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
                .map(idx => elements[idx] ? cleanHtml(elements[idx].text || '') : '')
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
                text: kw.keyword || kw.word || kw.text || (typeof kw === 'string' ? kw : ''),
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

                case '#16_method_image_desc':
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

const SUPERSCRIPT_MAP = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ',
    'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ',
    'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ',
    'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
    'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
};

const SUBSCRIPT_MAP = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
    'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
    'v': 'ᵥ', 'x': 'ₓ'
};

const GREEK_MAP = {
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
    'epsilon': 'ε', 'varepsilon': 'ε', 'zeta': 'ζ', 'eta': 'η',
    'theta': 'θ', 'vartheta': 'ϑ', 'iota': 'ι', 'kappa': 'κ',
    'lambda': 'λ', 'mu': 'μ', 'nu': 'ν', 'xi': 'ξ',
    'pi': 'π', 'varpi': 'ϖ', 'rho': 'ρ', 'varrho': 'ϱ',
    'sigma': 'σ', 'varsigma': 'ς', 'tau': 'τ', 'upsilon': 'υ',
    'phi': 'φ', 'varphi': 'ϕ', 'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
    'Gamma': 'Γ', 'Delta': 'Δ', 'Theta': 'Θ', 'Lambda': 'Λ',
    'Xi': 'Ξ', 'Pi': 'Π', 'Sigma': 'Σ', 'Upsilon': 'Υ',
    'Phi': 'Φ', 'Psi': 'Ψ', 'Omega': 'Ω'
};

const OPERATOR_MAP = {
    'times': '×', 'div': '÷', 'cdot': '·', 'pm': '±', 'mp': '∓',
    'leq': '≤', 'le': '≤', 'geq': '≥', 'ge': '≥',
    'neq': '≠', 'ne': '≠', 'approx': '≈', 'equiv': '≡',
    'sim': '∼', 'simeq': '≃', 'propto': '∝',
    'infty': '∞', 'infinity': '∞', 'partial': '∂', 'nabla': '∇',
    'sum': '∑', 'prod': '∏', 'int': '∫', 'iint': '∬', 'iiint': '∭',
    'oint': '∮', 'cup': '∪', 'cap': '∩',
    'subset': '⊂', 'supset': '⊃', 'subseteq': '⊆', 'supseteq': '⊇',
    'in': '∈', 'notin': '∉', 'ni': '∋',
    'emptyset': '∅', 'varnothing': '∅',
    'forall': '∀', 'exists': '∃', 'nexists': '∄',
    'neg': '¬', 'lnot': '¬', 'land': '∧', 'lor': '∨',
    'wedge': '∧', 'vee': '∨',
    'rightarrow': '→', 'to': '→', 'leftarrow': '←',
    'Rightarrow': '⇒', 'Leftarrow': '⇐',
    'leftrightarrow': '↔', 'Leftrightarrow': '⇔',
    'mapsto': '↦', 'implies': '⇒', 'iff': '⇔',
    'ldots': '…', 'cdots': '⋯', 'vdots': '⋮', 'ddots': '⋱', 'dots': '…',
    'langle': '⟨', 'rangle': '⟩',
    'lfloor': '⌊', 'rfloor': '⌋', 'lceil': '⌈', 'rceil': '⌉',
    'circ': '∘', 'star': '⋆', 'bullet': '•',
    'oplus': '⊕', 'otimes': '⊗', 'odot': '⊙',
    'perp': '⊥', 'parallel': '∥', 'angle': '∠',
    'triangle': '△', 'square': '□',
    'aleph': 'ℵ', 'hbar': 'ℏ', 'ell': 'ℓ',
    'Re': 'ℜ', 'Im': 'ℑ'
};

const MATHBB_MAP = {
    'R': 'ℝ', 'N': 'ℕ', 'Z': 'ℤ', 'Q': 'ℚ', 'C': 'ℂ',
    'P': 'ℙ', 'H': 'ℍ', 'F': 'ⅎ'
};

function toSuperscript(str) {
    return str.split('').map(c => SUPERSCRIPT_MAP[c] || c).join('');
}

function toSubscript(str) {
    return str.split('').map(c => SUBSCRIPT_MAP[c] || c).join('');
}

/**
 * Convertit une expression LaTeX en Unicode
 */
function latexToUnicode(latex) {
    let s = latex.trim();

    // \mathbb{X} → ℝ, ℕ, ℤ, etc.
    s = s.replace(/\\mathbb\{([A-Z])\}/g, (_, c) => MATHBB_MAP[c] || c);

    // \text{...} et \mathrm{...} → texte brut
    s = s.replace(/\\(?:text|mathrm|textrm|textit|textbf|mathit|mathbf)\{([^}]*)\}/g, '$1');

    // \sqrt[n]{...} → ⁿ√(...)
    s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]*)\}/g, (_, n, content) => {
        return toSuperscript(n) + '√(' + latexToUnicode(content) + ')';
    });

    // \sqrt{...} → √(...)
    s = s.replace(/\\sqrt\{([^}]*)\}/g, (_, content) => '√(' + latexToUnicode(content) + ')');

    // \frac{a}{b} → a/b ou (a)/(b) si complexe
    s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, (_, num, den) => {
        const n = latexToUnicode(num);
        const d = latexToUnicode(den);
        if (n.length <= 2 && d.length <= 2) {
            // Essayer les fractions Unicode courantes
            const fractionMap = {
                '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
                '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
                '1/6': '⅙', '5/6': '⅚', '1/7': '⅐', '1/8': '⅛',
                '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/9': '⅑', '1/10': '⅒'
            };
            const key = n + '/' + d;
            if (fractionMap[key]) return fractionMap[key];
        }
        const needParensNum = n.length > 1 && !/^[a-zA-Z0-9]$/.test(n);
        const needParensDen = d.length > 1 && !/^[a-zA-Z0-9]$/.test(d);
        return (needParensNum ? '(' + n + ')' : n) + '/' + (needParensDen ? '(' + d + ')' : d);
    });

    // \dfrac, \tfrac → même traitement
    s = s.replace(/\\[dt]frac\{([^}]*)\}\{([^}]*)\}/g, (_, num, den) => {
        const n = latexToUnicode(num);
        const d = latexToUnicode(den);
        const needParensNum = n.length > 1;
        const needParensDen = d.length > 1;
        return (needParensNum ? '(' + n + ')' : n) + '/' + (needParensDen ? '(' + d + ')' : d);
    });

    // \overline{X} → X̄
    s = s.replace(/\\overline\{([^}]*)\}/g, (_, content) => {
        return latexToUnicode(content).split('').map(c => c + '\u0304').join('');
    });

    // \vec{v} → v⃗
    s = s.replace(/\\vec\{([^}]*)\}/g, (_, content) => {
        return latexToUnicode(content) + '\u20D7';
    });

    // \hat{x} → x̂
    s = s.replace(/\\hat\{([^}]*)\}/g, (_, content) => {
        return latexToUnicode(content) + '\u0302';
    });

    // Lettres grecques
    s = s.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
        if (GREEK_MAP[cmd]) return GREEK_MAP[cmd];
        if (OPERATOR_MAP[cmd]) return OPERATOR_MAP[cmd];
        return match; // Garde tel quel si non reconnu, sera nettoyé plus tard
    });

    // Exposants: ^{...} ou ^x
    s = s.replace(/\^\{([^}]*)\}/g, (_, exp) => toSuperscript(latexToUnicode(exp)));
    s = s.replace(/\^([a-zA-Z0-9+\-])/g, (_, c) => toSuperscript(c));

    // Indices: _{...} ou _x
    s = s.replace(/_\{([^}]*)\}/g, (_, sub) => toSubscript(latexToUnicode(sub)));
    s = s.replace(/_([a-zA-Z0-9])/g, (_, c) => toSubscript(c));

    // Noms de fonctions: \sin, \cos, \log, etc.
    const funcNames = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
        'log', 'ln', 'exp', 'lim', 'sup', 'inf', 'max', 'min',
        'det', 'dim', 'ker', 'deg', 'gcd', 'arg', 'mod'];
    for (const fn of funcNames) {
        const regex = new RegExp('\\\\' + fn + '(?![a-zA-Z])', 'g');
        s = s.replace(regex, fn);
    }

    // \left et \right → juste les délimiteurs
    s = s.replace(/\\left\s*/g, '');
    s = s.replace(/\\right\s*/g, '');
    s = s.replace(/\\big[glr]?\s*/gi, '');

    // Accolades LaTeX restantes
    s = s.replace(/\{/g, '');
    s = s.replace(/\}/g, '');

    // Commandes d'espacement LaTeX
    s = s.replace(/\\[,;:!]\s*/g, ' ');
    s = s.replace(/\\quad\s*/g, '  ');
    s = s.replace(/\\qquad\s*/g, '    ');
    s = s.replace(/\\ /g, ' ');

    // Commandes de taille → ignorer
    s = s.replace(/\\(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle|tiny|small|normalsize|large|Large|LARGE|huge|Huge)\s*/g, '');

    // Commandes restantes non reconnues → supprimer le backslash
    s = s.replace(/\\([a-zA-Z]+)/g, '$1');

    // Nettoyage final
    s = s.replace(/\s{2,}/g, ' ').trim();

    return s;
}

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

    // Remplace les balises HTML courantes par leur équivalent texte
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '');
    text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1');
    text = text.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
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
