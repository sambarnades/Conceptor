import { translations } from '../translation.js';
import { formatTextToHtml } from '../utils.js';


export const machineName = 'H5P.FindTheWords';
export const version = { major: 1, minor: 4 };
export const extraDependencies = [
    { machineName: 'H5P.Timer', majorVersion: 0, minorVersion: 4 },
    { machineName: 'FontAwesome', majorVersion: 4, minorVersion: 5 },
    { machineName: 'H5P.JoubelUI', majorVersion: 1, minorVersion: 3 },
    { machineName: 'H5P.Transition', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.FontIcons', majorVersion: 1, minorVersion: 0 },
    { machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }
];

export default {
    process: (jsonObj) => {
        return {
            taskDescription: formatTextToHtml(jsonObj.taskDescription || ""),
            wordList: jsonObj.wordList,
            behaviour: {
                orientations: {
                    horizontal: true,
                    horizontalBack: true,
                    vertical: true,
                    verticalUp: true,
                    diagonal: true,
                    diagonalBack: true,
                    diagonalUp: true,
                    diagonalUpBack: true
                },
                fillPool: translations.h5p_find_words_fill_pool || "abcdefghijklmnopqrstuvwxyz",
                preferOverlap: true,
                showVocabulary: true,
                enableShowSolution: true,
                enableRetry: true
            },
            l10n: {
                check: translations.h5p_check_answer || "Vérifier",
                tryAgain: translations.h5p_try_again || "Recommencer",
                showSolution: translations.h5p_show_solution || "Afficher la solution",
                found: translations.h5p_find_words_found || "@found sur @totalWords mots trouvés",
                timeSpent: translations.h5p_find_words_time_spent || "Temps écoulé",
                score: translations.h5p_score || "Vous avez obtenu @score sur @total points",
                wordListHeader: translations.h5p_find_words_word_list_header || "Liste de mots"
            }
        };
    }
};
