#!/usr/bin/env node
/**
 * Pré-remplit les libellés UI H5P manquants dans les 11 locales Caramel,
 * à partir des traductions OFFICIELLES embarquées dans `js/vendor/h5p-libs/`.
 *
 * Un `.h5p` n'embarque pas les librairies : sur Éléa, seules les chaînes écrites
 * par les processeurs dans `content.json` sont traduites. Ce script fournit la
 * matière première ; le garde-fou `tests/run_h5p_ui_coverage.mjs` vérifie ensuite
 * que rien ne manque.
 *
 * Usage :
 *   node scripts/sync-h5p-ui-labels.mjs            # rapport (aucune écriture)
 *   node scripts/sync-h5p-ui-labels.mjs --write    # écrit les clés absentes
 *
 * Règles :
 *  - une clé DÉJÀ présente dans une locale n'est jamais écrasée ;
 *  - `fr` peut être forcé via `frOverride` pour conserver la formulation Caramel
 *    (tutoiement, vocabulaire maison) et éviter toute régression visible ;
 *  - langue non fournie par la librairie → repli sur le défaut ANGLAIS de la
 *    semantics (jamais sur le français).
 *
 * Les fichiers de locale ne sont PAS triés alphabétiquement : ils sont groupés par
 * famille de clés. Les nouvelles clés sont donc insérées juste après la dernière
 * clé de leur famille (`h5p_crossword_*`, `h5p_cp_*`…), pour garder un diff lisible
 * et laisser chaque libellé rangé au bon endroit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadLibrary, caramelLocales, ROOT } from './lib/h5p-semantics-labels.mjs';

/**
 * Clé de locale Caramel → champ de semantics H5P qui porte le libellé officiel.
 *
 *  - `frOverride` conserve la formulation déjà codée en dur dans le processeur
 *    (tutoiement Caramel) : aucune régression visible côté français ;
 *  - `manual` comble les langues que H5P n'a jamais traduites en amont (le
 *    `language/<code>.json` renvoie alors la chaîne anglaise) ou qu'il ne fournit
 *    pas du tout (pas de fichier pour cette langue).
 *
 * Priorité de résolution : frOverride > manual > traduction vendor > anglais.
 */
const IV = 'H5P.InteractiveVideo-1.28';
const QS = 'H5P.QuestionSet-1.21';

export const LABEL_MAP = {
    // ---- Mots croisés : messages d'erreur + groupe a11y complet -------------
    // H5P.Crossword 0.5 ne fournit AUCUN fichier `zh-*` → chinois entièrement manuel.
    h5p_crossword_could_not_generate: {
        lib: 'H5P.Crossword-0.5', path: '/l10n/couldNotGenerateCrossword',
        manual: { zh: '无法用给定的单词生成填字游戏。请减少单词数量，或改用有更多共同字母的单词后重试。' }
    },
    h5p_crossword_could_not_generate_too_few_words: {
        lib: 'H5P.Crossword-0.5', path: '/l10n/couldNotGenerateCrosswordTooFewWords',
        manual: { zh: '无法生成填字游戏。至少需要两个单词。' }
    },
    h5p_crossword_problematic_words: {
        lib: 'H5P.Crossword-0.5', path: '/l10n/probematicWords',
        manual: { zh: '部分单词无法放置。如果您使用了固定位置的单词，请确认其位置不会妨碍其他单词的放置。方向相同的单词不能相互紧贴。有问题的单词：@words' }
    },
    // (pas d'entrée pour /l10n/closeWindow : Crossword.js réutilise la clé
    //  générique `h5p_close`, partagée avec les autres activités.)
    h5p_crossword_a11y_grid: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/crosswordGrid',
        manual: { zh: '填字游戏网格。使用方向键导航，使用键盘输入字符。也可以使用 Tab 键切换到填空式输入框作答，而不使用网格。' }
    },
    h5p_crossword_a11y_column: { lib: 'H5P.Crossword-0.5', path: '/a11y/column', manual: { zh: '列' } },
    h5p_crossword_a11y_row: { lib: 'H5P.Crossword-0.5', path: '/a11y/row', manual: { zh: '行' } },
    h5p_crossword_a11y_empty: { lib: 'H5P.Crossword-0.5', path: '/a11y/empty', manual: { zh: '空' } },
    h5p_crossword_a11y_result_for: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/resultFor', manual: { zh: '@clue 的结果' }
    },
    h5p_crossword_a11y_correct: { lib: 'H5P.Crossword-0.5', path: '/a11y/correct', manual: { zh: '正确' } },
    h5p_crossword_a11y_wrong: { lib: 'H5P.Crossword-0.5', path: '/a11y/wrong', manual: { zh: '错误' } },
    h5p_crossword_a11y_point: { lib: 'H5P.Crossword-0.5', path: '/a11y/point', manual: { zh: '分' } },
    h5p_crossword_a11y_solution_for: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/solutionFor', manual: { zh: '@clue 的答案是：@solution' }
    },
    h5p_crossword_a11y_extra_clue_for: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/extraClueFor', manual: { zh: '打开 @clue 的额外提示' }
    },
    h5p_crossword_a11y_letter_position: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/letterSevenOfNine', manual: { zh: '第 @position 个字母，共 @length 个' }
    },
    h5p_crossword_a11y_letters_word: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/lettersWord', manual: { zh: '@length 个字母的单词' }
    },
    h5p_crossword_a11y_check: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/check',
        manual: { zh: '检查字符。答案将被标记为正确、错误或未作答。' }
    },
    h5p_crossword_a11y_show_solution: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/showSolution',
        manual: { zh: '显示答案。填字游戏将填入正确答案。' }
    },
    h5p_crossword_a11y_retry: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/retry',
        manual: { zh: '重做任务。重置所有答案并重新开始。' }
    },
    h5p_crossword_a11y_your_result: {
        lib: 'H5P.Crossword-0.5', path: '/a11y/yourResult',
        manual: { zh: '您获得了 @score 分，满分 @total 分' }
    },

    // ---- Présentation de cours : écran de résultats + partage --------------
    // L'écran de résultats (resultHeader / amountCorrect) n'est traduit dans
    // AUCUNE langue en amont : H5P laisse l'anglais partout.
    h5p_cp_result_header: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/resultHeader',
        manual: {
            ar: 'النتائج', de: 'Ergebnisse', el: 'Αποτελέσματα', es: 'Resultados',
            fr: 'Résultats', it: 'Risultati', jp: '結果', nl: 'Resultaten',
            pt: 'Resultados', zh: '结果'
        }
    },
    h5p_cp_amount_correct: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/amountCorrect',
        manual: {
            ar: '@value / @max صحيحة', de: '@value / @max richtig', el: '@value / @max σωστά',
            es: '@value / @max correctas', fr: '@value / @max correctes', it: '@value / @max corrette',
            jp: '@value / @max 正解', nl: '@value / @max correct', pt: '@value / @max corretas',
            zh: '@value / @max 正确'
        }
    },
    h5p_cp_amount_correct_aria: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/amountCorrectAria',
        manual: {
            ar: '@value من أصل @max صحيحة', de: '@value von @max richtig', el: '@value από @max σωστά',
            es: '@value de @max correctas', fr: '@value sur @max correctes', it: '@value su @max corrette',
            jp: '@max 問中 @value 問正解', nl: '@value van @max correct', pt: '@value de @max corretas',
            zh: '@max 题中 @value 题正确'
        }
    },
    h5p_cp_share_result: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/shareResult',
        manual: { ar: 'شارك النتيجة', jp: '結果を共有' }
    },
    h5p_cp_share_facebook: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/shareFacebook',
        manual: { ar: 'شارك على فيسبوك' }
    },
    h5p_cp_share_twitter: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/shareTwitter',
        manual: { ar: 'شارك على تويتر' }
    },
    h5p_cp_share_google: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/shareGoogle',
        manual: { ar: 'شارك على جوجل+', jp: 'Google+ で共有' }
    },
    h5p_cp_slideshow_navigation: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/slideshowNavigationLabel',
        manual: {
            ar: 'التنقل في العرض التقديمي', fr: 'Navigation dans le diaporama',
            it: 'Navigazione della presentazione', jp: 'スライドショーのナビゲーション',
            nl: 'Navigatie diavoorstelling', pt: 'Navegação da apresentação', zh: '幻灯片导航'
        }
    },

    h5p_cp_slides: {
        lib: 'H5P.CoursePresentation-1.27', path: '/l10n/slides',
        manual: {
            ar: 'الشرائح', de: 'Folien', el: 'Διαφάνειες', es: 'Diapositivas',
            fr: 'Diapositives', it: 'Diapositive', jp: 'スライド', nl: 'Dia’s',
            pt: 'Diapositivos', zh: '幻灯片'
        }
    },

    // ---- Quiz (H5P.QuestionSet) : barre de navigation entre questions ------
    // Non écrits jusqu'ici : sur un quiz français, la barre de navigation et ses
    // annonces partaient en anglais (« Choose question to display », « Questions »).
    h5p_quiz_question_label: { lib: QS, path: '/texts/questionLabel' },
    h5p_quiz_read_speaker_progress: {
        lib: QS, path: '/texts/readSpeakerProgress',
        manual: { ar: 'السؤال @current من أصل @total' }
    },
    h5p_quiz_current_question: { lib: QS, path: '/texts/currentQuestionText' },
    h5p_quiz_navigation_label: {
        lib: QS, path: '/texts/navigationLabel',
        manual: {
            ar: 'الأسئلة', fr: 'Questions', it: 'Domande', jp: '設問',
            nl: 'Vragen', pt: 'Perguntas', zh: '题目'
        }
    },
    h5p_quiz_instruction: {
        lib: QS, path: '/texts/questionSetInstruction',
        manual: {
            ar: 'اختر السؤال المراد عرضه', de: 'Frage zum Anzeigen auswählen',
            es: 'Elige la pregunta que quieres mostrar', fr: 'Choisir la question à afficher',
            it: 'Scegli la domanda da visualizzare', jp: '表示する設問を選択',
            nl: 'Kies de vraag die je wilt weergeven', pt: 'Escolha a pergunta a exibir',
            zh: '选择要显示的题目'
        }
    },

    // ---- Glisser les mots : zones de dépôt, annonces a11y, correction ------
    // Ces 10 libellés étaient figés EN ANGLAIS dans DragTheWords.js : sur une
    // activité française, « Correct answer: » et « Feedback » s'affichaient tels
    // quels, et les annonces de zones de dépôt partaient en anglais au lecteur
    // d'écran. Seul `ariaDraggableIndex` était figé en français.
    h5p_drag_words_drop_zone_index: {
        lib: 'H5P.DragText-1.10', path: '/dropZoneIndex',
        manual: { ar: 'منطقة الإفلات @index.' }
    },
    h5p_drag_words_drop_zone_empty: {
        lib: 'H5P.DragText-1.10', path: '/empty',
        manual: { ar: 'منطقة الإفلات @index فارغة.' }
    },
    h5p_drag_words_drop_zone_contains: {
        lib: 'H5P.DragText-1.10', path: '/contains',
        manual: { ar: 'منطقة الإفلات @index تحتوي على العنصر @draggable.' }
    },
    h5p_drag_words_aria_draggable_index: {
        lib: 'H5P.DragText-1.10', path: '/ariaDraggableIndex',
        frOverride: '@index sur @count éléments.',
        manual: { ar: '@index من أصل @count عنصرًا قابلًا للسحب.' }
    },
    h5p_drag_words_reset_drop_title: {
        lib: 'H5P.DragText-1.10', path: '/resetDropTitle',
        manual: { ar: 'إعادة تعيين الإفلات' }
    },
    h5p_drag_words_reset_drop_description: {
        lib: 'H5P.DragText-1.10', path: '/resetDropDescription'
    },
    h5p_drag_words_grabbed: {
        lib: 'H5P.DragText-1.10', path: '/grabbed',
        manual: { ar: 'تم الإمساك بالعنصر.' }
    },
    h5p_drag_words_cancelled_dragging: {
        lib: 'H5P.DragText-1.10', path: '/cancelledDragging',
        manual: { ar: 'تم إلغاء السحب.' }
    },
    h5p_drag_words_correct_answer: {
        lib: 'H5P.DragText-1.10', path: '/correctAnswer'
    },
    h5p_drag_words_feedback_header: {
        lib: 'H5P.DragText-1.10', path: '/feedbackHeader',
        manual: { it: 'Feedback', nl: 'Feedback', pt: 'Feedback' }
    },

    // ---- Vidéo interactive : écran de fin + sous-titres --------------------
    h5p_iv_endcard_question: {
        lib: 'H5P.InteractiveVideo-1.28', path: '/l10n/endcardQuestion',
        manual: {
            ar: 'سؤال', el: 'Ερώτηση', es: 'Pregunta', fr: 'Question', it: 'Domanda',
            jp: '問題', nl: 'Vraag', pt: 'Pergunta'
        }
    },
    h5p_iv_subtitle_label: {
        lib: 'H5P.InteractiveVideo-1.28',
        path: '/interactiveVideo/video/textTracks/videoTrack[]/label',
        frOverride: 'Transcription',
        manual: { ar: 'الترجمة النصية' }
    },

    // ---- Vidéo interactive : lecteur, écran de fin, annonces a11y ----------
    // Ces 46 libellés étaient CODÉS EN DUR EN FRANÇAIS dans InteractiveVideo.js
    // (constante IV_L10N_FR) : le lecteur vidéo s'affichait donc en français
    // même en interface grecque ou espagnole. `frOverride` reprend mot pour mot
    // l'ancienne formulation Caramel — aucun changement visible en français.
    h5p_iv_interaction: { lib: IV, path: '/l10n/interaction', frOverride: 'Interaction' },
    h5p_iv_play: { lib: IV, path: '/l10n/play', frOverride: 'Lecture' },
    h5p_iv_pause: { lib: IV, path: '/l10n/pause', frOverride: 'Pause' },
    h5p_iv_mute: { lib: IV, path: '/l10n/mute', frOverride: 'Couper le son' },
    h5p_iv_unmute: { lib: IV, path: '/l10n/unmute', frOverride: 'Activer le son' },
    h5p_iv_quality: { lib: IV, path: '/l10n/quality', frOverride: 'Qualité de la vidéo' },
    h5p_iv_captions: { lib: IV, path: '/l10n/captions', frOverride: 'Sous-titres' },
    h5p_iv_close: { lib: IV, path: '/l10n/close', frOverride: 'Fermer' },
    h5p_iv_fullscreen: { lib: IV, path: '/l10n/fullscreen', frOverride: 'Plein écran' },
    h5p_iv_exit_fullscreen: { lib: IV, path: '/l10n/exitFullscreen', frOverride: 'Quitter le plein écran' },
    h5p_iv_summary: { lib: IV, path: '/l10n/summary', frOverride: 'Ouvrir le résumé' },
    h5p_iv_bookmarks: { lib: IV, path: '/l10n/bookmarks', frOverride: 'Signets' },
    h5p_iv_endscreen: { lib: IV, path: '/l10n/endscreen', frOverride: 'Écran de soumission' },
    h5p_iv_default_adaptivity_seek_label: { lib: IV, path: '/l10n/defaultAdaptivitySeekLabel', frOverride: 'Continuer' },
    h5p_iv_continue_with_video: { lib: IV, path: '/l10n/continueWithVideo', frOverride: 'Continuer la vidéo' },
    h5p_iv_more: { lib: IV, path: '/l10n/more', frOverride: 'Plus d’options' },
    h5p_iv_playback_rate: { lib: IV, path: '/l10n/playbackRate', frOverride: 'Vitesse de lecture' },
    h5p_iv_rewind10: { lib: IV, path: '/l10n/rewind10', frOverride: 'Reculer de 10 secondes' },
    h5p_iv_nav_disabled: { lib: IV, path: '/l10n/navDisabled', frOverride: 'La navigation est désactivée' },
    h5p_iv_nav_forward_disabled: { lib: IV, path: '/l10n/navForwardDisabled', frOverride: 'La navigation en avant est désactivée' },
    h5p_iv_snd_disabled: { lib: IV, path: '/l10n/sndDisabled', frOverride: 'Le son est désactivé' },
    h5p_iv_requires_completion_warning: { lib: IV, path: '/l10n/requiresCompletionWarning', frOverride: 'Vous devez répondre correctement à toutes les questions avant de continuer.' },
    h5p_iv_back: { lib: IV, path: '/l10n/back', frOverride: 'Retour' },
    h5p_iv_hours: { lib: IV, path: '/l10n/hours', frOverride: 'Heures' },
    h5p_iv_minutes: { lib: IV, path: '/l10n/minutes', frOverride: 'Minutes' },
    h5p_iv_seconds: { lib: IV, path: '/l10n/seconds', frOverride: 'Secondes' },
    h5p_iv_current_time: { lib: IV, path: '/l10n/currentTime', frOverride: 'Temps actuel :' },
    h5p_iv_total_time: { lib: IV, path: '/l10n/totalTime', frOverride: 'Durée totale :' },
    h5p_iv_single_interaction_announcement: { lib: IV, path: '/l10n/singleInteractionAnnouncement', frOverride: 'Une interaction est apparue :' },
    h5p_iv_multiple_interactions_announcement: { lib: IV, path: '/l10n/multipleInteractionsAnnouncement', frOverride: 'Plusieurs interactions sont apparues.' },
    h5p_iv_video_paused_announcement: { lib: IV, path: '/l10n/videoPausedAnnouncement', frOverride: 'La vidéo est en pause' },
    h5p_iv_content: { lib: IV, path: '/l10n/content', frOverride: 'Contenu' },
    h5p_iv_answered: { lib: IV, path: '/l10n/answered', frOverride: '@answered répondue(s)' },
    h5p_iv_endcard_title: { lib: IV, path: '/l10n/endcardTitle', frOverride: '@answered question(s) répondue(s)' },
    h5p_iv_endcard_information: { lib: IV, path: '/l10n/endcardInformation', frOverride: 'Vous avez répondu à @answered questions, cliquez ci-dessous pour soumettre vos réponses.' },
    h5p_iv_endcard_information_on_submit_button_disabled: { lib: IV, path: '/l10n/endcardInformationOnSubmitButtonDisabled', frOverride: 'Vous avez répondu à @answered questions.' },
    h5p_iv_endcard_information_no_answers: { lib: IV, path: '/l10n/endcardInformationNoAnswers', frOverride: 'Vous n’avez répondu à aucune question.' },
    h5p_iv_endcard_information_must_have_answer: { lib: IV, path: '/l10n/endcardInformationMustHaveAnswer', frOverride: 'Vous devez répondre à au moins une question avant de pouvoir soumettre vos réponses.' },
    h5p_iv_endcard_submit_button: { lib: IV, path: '/l10n/endcardSubmitButton', frOverride: 'Soumettre les réponses' },
    h5p_iv_endcard_submit_message: { lib: IV, path: '/l10n/endcardSubmitMessage', frOverride: 'Vos réponses ont été soumises !' },
    h5p_iv_endcard_table_row_score: { lib: IV, path: '/l10n/endcardTableRowScore', frOverride: 'Score' },
    h5p_iv_endcard_answered_score: { lib: IV, path: '/l10n/endcardAnsweredScore', frOverride: 'répondue' },
    h5p_iv_end_card_table_row_summary_with_score: { lib: IV, path: '/l10n/endCardTableRowSummaryWithScore', frOverride: 'Vous avez obtenu @score sur @total points pour la @question apparue après @minutes minutes et @seconds secondes.' },
    h5p_iv_end_card_table_row_summary_without_score: { lib: IV, path: '/l10n/endCardTableRowSummaryWithoutScore', frOverride: 'Vous avez répondu à la @question apparue après @minutes minutes et @seconds secondes.' },
    h5p_iv_video_progress_bar: { lib: IV, path: '/l10n/videoProgressBar', frOverride: 'Progression de la vidéo' },
    h5p_iv_how_to_create_interactions: { lib: IV, path: '/l10n/howToCreateInteractions', frOverride: 'Lancez la vidéo pour commencer à créer des interactions' },

    // Champ HÉRITÉ de H5P.InteractiveVideo : lu par le JS de la lib mais absent de
    // sa semantics 1.28 → aucune traduction officielle à récupérer, d'où `literal`.
    h5p_iv_endcard_table_row_answered: {
        literal: {
            ar: 'الأسئلة المجاب عنها', de: 'Beantwortete Fragen', el: 'Ερωτήσεις που απαντήθηκαν',
            en: 'Questions answered', es: 'Preguntas respondidas', fr: 'Questions répondues',
            it: 'Domande risposte', jp: '回答した質問', nl: 'Beantwoorde vragen',
            pt: 'Perguntas respondidas', zh: '已回答的问题', br: 'Goulennoù respontet'
        }
    },

    // ---- Vidéo interactive : consigne par défaut du Texte à trous imbriqué --
    // Les libellés du RÉSUMÉ imbriqué ne sont volontairement PAS dupliqués ici :
    // le champ H5P est le même que celui de l'activité « Résumé » autonome, donc
    // InteractiveVideo.js réutilise les clés `h5p_summary_*` déjà présentes.
    // Une clé = un champ de semantics, sinon les deux copies divergent en silence.
    h5p_iv_blanks_intro: { lib: 'H5P.Blanks-1.14', path: '/text', frOverride: 'Complète le texte :' },

    // ---- Ordonner les paragraphes : lecture d'écran ------------------------
    h5p_sort_paragraphs_a11y_your_result: {
        lib: 'H5P.SortParagraphs-0.11', path: '/a11y/yourResult',
        manual: {
            it: 'Hai ottenuto @score punti su @total',
            jp: '@total 点中 @score 点を獲得しました',
            zh: '您获得了 @score 分，满分 @total 分'
        }
    },

    // ---- Diagramme --------------------------------------------------------
    h5p_chart_figure_definition: {
        lib: 'H5P.Chart-1.2', path: '/figureDefinition',
        manual: { ar: 'رسم بياني', jp: 'グラフ' }
    },

    // ---- Texte à trous complexe (H5P.AdvancedBlanks) -----------------------
    // Lib communautaire : seulement 9 langues fournies, 6 des nôtres sont absentes.
    h5p_advanced_blanks_spelling_warning: {
        lib: 'H5P.AdvancedBlanks-1.2', path: '/spellingMistakeWarning',
        manual: {
            ar: 'تحقق من الإملاء: @mistake',
            el: 'Ελέγξτε την ορθογραφία σας: @mistake',
            it: "Controlla l'ortografia: @mistake",
            jp: 'スペルを確認してください: @mistake',
            pt: 'Verifique a ortografia: @mistake',
            zh: '请检查拼写：@mistake'
        }
    }
};

/**
 * Langues que H5P n'a jamais traduites pour le lecteur de Vidéo interactive :
 * `language/ar.json` et `language/ja.json` renvoient la chaîne anglaise sur la
 * quasi-totalité du groupe l10n, avec quelques trous isolés en de/it/nl/pt.
 * Sans ces valeurs, un enseignant arabophone verrait un lecteur en anglais.
 * Fusionné dans LABEL_MAP juste après sa déclaration.
 */
const IV_MANUAL = {
    h5p_iv_interaction: { ar: 'تفاعل' },
    h5p_iv_play: { ar: 'تشغيل' },
    h5p_iv_pause: { ar: 'إيقاف مؤقت', de: 'Pause' },
    h5p_iv_mute: {
        ar: 'كتم الصوت، الصوت مفعّل حاليًا',
        it: "Disattiva l'audio (attualmente attivo)",
        jp: 'ミュート（現在は音声オン）'
    },
    h5p_iv_unmute: {
        ar: 'تشغيل الصوت، الصوت مكتوم حاليًا',
        it: "Attiva l'audio (attualmente disattivato)",
        jp: 'ミュート解除（現在はミュート中）'
    },
    h5p_iv_quality: { ar: 'جودة الفيديو' },
    h5p_iv_captions: { ar: 'الترجمة النصية' },
    h5p_iv_fullscreen: { ar: 'ملء الشاشة' },
    h5p_iv_bookmarks: { ar: 'العلامات المرجعية' },
    h5p_iv_endscreen: { ar: 'شاشة الإرسال', jp: '送信画面' },
    h5p_iv_default_adaptivity_seek_label: { ar: 'متابعة' },
    h5p_iv_continue_with_video: { ar: 'متابعة الفيديو' },
    h5p_iv_more: {
        ar: 'خيارات إضافية للمشغّل', it: 'Altre opzioni del lettore',
        jp: 'その他のプレーヤー設定', pt: 'Mais opções do reprodutor'
    },
    h5p_iv_playback_rate: { ar: 'سرعة التشغيل' },
    h5p_iv_rewind10: { ar: 'الرجوع 10 ثوانٍ' },
    h5p_iv_nav_disabled: { ar: 'التنقل معطّل' },
    h5p_iv_nav_forward_disabled: {
        ar: 'التنقل إلى الأمام معطّل', it: "L'avanzamento è disabilitato",
        jp: '早送りは無効です', nl: 'Vooruit navigeren is uitgeschakeld',
        pt: 'O avanço está desativado'
    },
    h5p_iv_snd_disabled: { ar: 'الصوت معطّل' },
    h5p_iv_hours: { ar: 'ساعات' },
    h5p_iv_minutes: { ar: 'دقائق' },
    h5p_iv_seconds: { ar: 'ثوانٍ' },
    h5p_iv_current_time: { ar: 'الوقت الحالي:' },
    h5p_iv_total_time: { ar: 'المدة الإجمالية:' },
    h5p_iv_single_interaction_announcement: {
        ar: 'ظهر تفاعل:', jp: 'インタラクションが表示されました:'
    },
    h5p_iv_multiple_interactions_announcement: {
        ar: 'ظهرت عدة تفاعلات.', jp: '複数のインタラクションが表示されました。'
    },
    h5p_iv_video_paused_announcement: {
        ar: 'الفيديو متوقف مؤقتًا', jp: '動画は一時停止中です'
    },
    h5p_iv_content: { ar: 'المحتوى', jp: 'コンテンツ' },
    h5p_iv_answered: { ar: '@answered تمت الإجابة عنها', jp: '@answered 問回答済み' },
    h5p_iv_endcard_title: {
        ar: 'تمت الإجابة عن @answered سؤال/أسئلة', jp: '@answered 問の質問に回答しました'
    },
    h5p_iv_endcard_information: {
        ar: 'لقد أجبت عن @answered سؤالًا، انقر أدناه لإرسال إجاباتك.',
        jp: '@answered 問の質問に回答しました。下のボタンを押して回答を送信してください。'
    },
    h5p_iv_endcard_information_on_submit_button_disabled: {
        ar: 'لقد أجبت عن @answered سؤالًا.', jp: '@answered 問の質問に回答しました。'
    },
    h5p_iv_endcard_information_no_answers: {
        ar: 'لم تجب عن أي سؤال.', jp: 'まだ質問に回答していません。'
    },
    h5p_iv_endcard_information_must_have_answer: {
        ar: 'يجب أن تجيب عن سؤال واحد على الأقل قبل أن تتمكن من إرسال إجاباتك.',
        jp: '回答を送信するには、少なくとも 1 問に回答する必要があります。'
    },
    h5p_iv_endcard_submit_button: { ar: 'إرسال الإجابات', jp: '回答を送信' },
    h5p_iv_endcard_submit_message: { ar: 'تم إرسال إجاباتك!', jp: '回答を送信しました！' },
    h5p_iv_endcard_table_row_score: { ar: 'النتيجة', jp: 'スコア', nl: 'Score' },
    h5p_iv_endcard_answered_score: { ar: 'تمت الإجابة', jp: '回答済み' },
    h5p_iv_end_card_table_row_summary_with_score: {
        ar: 'حصلت على @score من @total نقطة عن @question الذي ظهر بعد @minutes دقيقة و@seconds ثانية.',
        jp: '@minutes 分 @seconds 秒後に表示された @question で @total 点中 @score 点を獲得しました。'
    },
    h5p_iv_end_card_table_row_summary_without_score: {
        jp: '@minutes 分 @seconds 秒後に表示された @question に回答しました。'
    },
    h5p_iv_video_progress_bar: {
        ar: 'تقدم الفيديو', it: 'Avanzamento del video',
        jp: '動画の再生位置', pt: 'Progresso do vídeo'
    },
    h5p_iv_how_to_create_interactions: {
        ar: 'شغّل الفيديو لبدء إنشاء التفاعلات',
        it: 'Avvia il video per iniziare a creare interazioni',
        jp: '動画を再生してインタラクションの作成を始めましょう',
        nl: 'Speel de video af om interacties aan te maken',
        pt: 'Reproduza o vídeo para começar a criar interações'
    }
};

for (const [key, extra] of Object.entries(IV_MANUAL)) {
    if (!LABEL_MAP[key]) throw new Error(`IV_MANUAL : clé inconnue dans LABEL_MAP → ${key}`);
    LABEL_MAP[key].manual = { ...(LABEL_MAP[key].manual || {}), ...extra };
}

const WRITE = process.argv.includes('--write');
const LOCALES = caramelLocales();
const libCache = new Map();
const lib = (name) => {
    if (!libCache.has(name)) libCache.set(name, loadLibrary(name));
    return libCache.get(name);
};

const localeData = {};
for (const l of LOCALES) {
    localeData[l] = JSON.parse(fs.readFileSync(path.join(ROOT, 'js/locales', `${l}.json`), 'utf8'));
}

/**
 * Famille d'une clé : les deux premiers segments après `h5p_`, ce qui regroupe
 * `h5p_crossword_a11y_row` avec `h5p_crossword_across`, et `h5p_cp_*` entre eux.
 * On tente du plus spécifique au plus large pour trouver un point d'ancrage.
 */
function familyPrefixes(key) {
    const parts = key.split('_');
    const out = [];
    for (let n = parts.length - 1; n >= 2; n--) out.push(parts.slice(0, n).join('_') + '_');
    return out;
}

/**
 * Insère `key` dans `obj` juste après la dernière clé de sa famille.
 * Sans famille identifiable, la clé est ajoutée en fin d'objet.
 * Réécrit l'objet car l'ordre d'insertion des propriétés est significatif ici.
 */
function insertInFamily(obj, key, value) {
    const keys = Object.keys(obj);
    let anchorIndex = -1;
    for (const prefix of familyPrefixes(key)) {
        for (let i = keys.length - 1; i >= 0; i--) {
            if (keys[i].startsWith(prefix)) { anchorIndex = i; break; }
        }
        if (anchorIndex !== -1) break;
    }
    if (anchorIndex === -1) { obj[key] = value; return; }

    const rebuilt = {};
    keys.forEach((k, i) => {
        rebuilt[k] = obj[k];
        if (i === anchorIndex) rebuilt[key] = value;
    });
    for (const k of Object.keys(obj)) delete obj[k];
    Object.assign(obj, rebuilt);
}

let added = 0;
const fallbackToEnglish = [];

for (const [key, spec] of Object.entries(LABEL_MAP)) {
    // Entrée `literal` : champ sans équivalent dans une semantics (champ hérité
    // encore lu par le JS de la lib) → les 11 valeurs sont fournies à la main.
    if (spec.literal) {
        const absentes = LOCALES.filter((l) => !(l in spec.literal));
        if (absentes.length) {
            console.error(`  /!\\ ${key} : literal incomplet, langue(s) manquante(s) → ${absentes.join(', ')}`);
            process.exitCode = 1;
            continue;
        }
        for (const locale of LOCALES) {
            if (key in localeData[locale]) continue;
            insertInFamily(localeData[locale], key, spec.literal[locale]);
            added++;
        }
        continue;
    }

    const L = lib(spec.lib);
    const english = L.english.get(spec.path);
    if (english === undefined) {
        console.error(`  /!\\ ${key} : chemin introuvable dans ${spec.lib} → ${spec.path}`);
        process.exitCode = 1;
        continue;
    }
    for (const locale of LOCALES) {
        if (key in localeData[locale]) continue;
        let value;
        if (locale === 'fr' && spec.frOverride) {
            value = spec.frOverride;
        } else if (spec.manual && spec.manual[locale]) {
            value = spec.manual[locale];
        } else if (locale === 'en') {
            value = english;
        } else {
            value = L.defaultsFor(locale).get(spec.path) ?? english;
            if (value === english) {
                const raison = L.languageFileFor(locale) === null
                    ? 'langue absente de la lib'
                    : 'non traduit en amont';
                fallbackToEnglish.push(`${locale}/${key} (${raison})`);
            }
        }
        insertInFamily(localeData[locale], key, value);
        added++;
    }
}

if (WRITE) {
    for (const locale of LOCALES) {
        fs.writeFileSync(
            path.join(ROOT, 'js/locales', `${locale}.json`),
            JSON.stringify(localeData[locale], null, 2) + '\n',
            'utf8'
        );
    }
    console.log(`${added} clé(s) écrite(s) dans ${LOCALES.length} locales.`);
} else {
    console.log(`${added} clé(s) à ajouter (mode rapport — relancer avec --write).`);
}

if (fallbackToEnglish.length) {
    console.log(`\n${fallbackToEnglish.length} cellule(s) sans traduction officielle H5P → repli anglais, à relire :`);
    for (const f of fallbackToEnglish) console.log('   ' + f);
}
