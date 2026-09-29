/**
 * @file Fabrication des fichiers d'UN backup Moodle mono-activité, sans effet de bord.
 *
 * `construireFichiersActivite()` prend le JSON d'une activité Moodle (celui que
 * l'IA produit et que l'éditeur visuel manipule) et rend la CARTE DE FICHIERS
 * `{chemin: contenu}` du backup, plus de quoi la situer : le nom de module
 * Moodle et le dossier d'activité.
 *
 * Deux appelants, une seule mise en forme :
 *
 *  1. **L'éditeur** (`ui/notifications.js:regenerateMBZFile`) : après édition, il
 *     ré-empaquette la carte en `.mbz` mono-activité et remplace le fichier de
 *     la notification.
 *  2. **L'atelier de parcours** (`parcours/parcours-builder.js`) : il passe la
 *     carte, telle quelle, au constructeur de cours — qui attend exactement la
 *     forme `{files, moduleName, activityDir}` que rend `extractMbz` côté
 *     Sucrerie. Caramel n'a donc RIEN à décompresser : ses processeurs
 *     produisent déjà cette carte en mémoire.
 *
 * Ce fichier ne fait que DÉPLACER une mise en forme qui vivait dans
 * `notifications.js`. La garder à deux endroits, c'était la garantie qu'ils
 * divergent : le parcours et l'éditeur auraient fini par produire deux Livres
 * différents à partir du même JSON.
 *
 * @module moodle/mono-activity-files
 */

import { translations } from '../core/translation.js';

/**
 * Clé de module Caramel → type de processeur Moodle.
 * (`test_elea` et `glossaireXml` sont les deux seules clés qui ne portent pas
 * déjà le nom de leur processeur.)
 */
export const TYPE_MOODLE_PAR_MODULE = {
    Page: 'Page',
    Livre: 'Livre',
    Millionnaire: 'Millionnaire',
    Appariement: 'Appariement',
    QCM: 'QCM',
    Devoir: 'Devoir',
    test_elea: 'Test',
    glossaireXml: 'Glossaire',
};

/**
 * Type de processeur Moodle d'une clé de module Caramel.
 * @param {string} moduleKey
 * @returns {string|null}
 */
export function typeMoodle(moduleKey) {
    return TYPE_MOODLE_PAR_MODULE[moduleKey] || null;
}

/**
 * Construit la carte de fichiers d'un backup Moodle mono-activité.
 *
 * Le Test (`quiz`) ne passe PAS par ici : sa banque de questions vit à la
 * racine du backup, pas dans le dossier d'activité, et le constructeur de cours
 * la régénère lui-même à partir du modèle (cf. `buildQuizActivityFiles`).
 *
 * **Images envoyées (Page, Livre).** Elles ne sont PAS dans `files` : la carte
 * rendue reste celle d'une activité sans fichiers, parce que le constructeur de
 * cours du parcours (partagé avec La Sucrerie) refuse une activité qui arrive
 * avec les siens. Elles sont décrites dans `paquet` ; `fichiersMonoActivite()`
 * les pose pour un `.mbz` d'activité seule, l'atelier les pose après
 * l'assemblage du cours. `previewHtml`, lui, montre déjà les images.
 *
 * @param {string} moodleType - 'Page' | 'Livre' | 'Millionnaire' | 'Appariement' | 'QCM' | 'Devoir'
 * @param {Object} donnees - Le JSON de l'activité (déjà réparé).
 * @param {Object} [options]
 * @param {string} [options.titreParDefaut] - Titre de repli si le JSON n'en porte pas.
 * @returns {Promise<{files:Object<string,string>, moduleName:string, activityDir:string, title:string, previewHtml:string|null, paquet:Object|null}>}
 */
export async function construireFichiersActivite(moodleType, donnees, { titreParDefaut = '' } = {}) {
    const [{ healLatexForTest, prepareIntroHtml }, MoodleProcessors, { escapeXml, escapeXmlPreservingEntities }, { extraireImagesEnvoyees, versApercu }] = await Promise.all([
        import('./moodle-creator.js'),
        import('./processors/index.js'),
        import('./moodle-formats.js'),
        import('./page-images.js'),
    ]);
    // Pipeline LaTeX complet pour Moodle (identique à moodle-creator.js).
    const healLatex = healLatexForTest;

    const metadonnees = MoodleProcessors.getActivityMetadata(moodleType);
    if (!metadonnees) throw new Error(`mono_activity_type_inconnu:${moodleType}`);

    // Le titre du glossaire s'appelle `name` et non `title` — c'est la seule
    // activité Moodle dont le modèle diffère sur ce point.
    const titreEffectif = String(donnees.title || donnees.name || titreParDefaut || 'Activity');

    // Données de base (IDs, horodatages) — même logique que moodle-creator.js.
    const baseData = MoodleProcessors.generateBaseData(titreEffectif);

    // Transformations SPÉCIFIQUES à chaque type d'activité.
    let activitySpecificData = {};
    // Fichiers joints de l'activité (images envoyées d'une Page ou d'un Livre).
    let paquet = null;

    switch (moodleType) {
        case 'Appariement': {
            // Pipeline LaTeX complet pour MathJax Moodle
            donnees = healLatex(donnees);
            // Transformation des pairs en ASSOCIATIONS_JSON (identique à handleAppariementCreation)
            if (Array.isArray(donnees.pairs)) {
                const questions = {};
                const responses = {};
                donnees.pairs.forEach((pair, index) => {
                    let q = String(pair.question ?? '').trim();
                    let a = String(pair.answer ?? '').trim();
                    // Envelopper dans <p> si pas déjà HTML
                    if (!q.match(/^\s*<p[\s>]/i)) {
                        q = `<p dir="ltr" style="text-align: left;">${q}</p>`;
                    }
                    if (!a.match(/^\s*<p[\s>]/i)) {
                        a = `<p dir="ltr" style="text-align: left;">${a}</p>`;
                    }
                    questions[index + 1] = q;
                    responses[index + 1] = a;
                });
                activitySpecificData.ASSOCIATIONS_JSON = escapeXml(JSON.stringify({ questions, responses }));
            }
            // Intro HTML — normalisation identique à la génération (prepareIntroHtml) :
            // Markdown → HTML, pas de <p> autour d'un bloc, échappement entité-safe.
            activitySpecificData.ACTIVITY_INTRO_HTML = prepareIntroHtml(
                donnees.intro,
                translations.appariement_activity_intro || "Trouvez les paires correspondantes."
            );
            break;
        }

        case 'Millionnaire': {
            // Transformation des questions en QUESTIONS_JSON (identique à handleMillionnaireCreation)
            if (Array.isArray(donnees.questions)) {
                // S'assurer que badanswer est un tableau pour chaque question
                const cleanedQuestions = donnees.questions.map(q => {
                    let badanswer = q.badanswer;
                    // Convertir en tableau si c'est une string (après édition avec stringArray)
                    if (!Array.isArray(badanswer)) {
                        badanswer = typeof badanswer === 'string'
                            ? badanswer.split('\n').map(s => s.trim()).filter(s => s.length > 0)
                            : [];
                    }
                    return {
                        question: q.question || '',
                        goodanswer: q.goodanswer || '',
                        badanswer: badanswer
                    };
                });
                activitySpecificData.QUESTIONS_JSON = escapeXml(JSON.stringify(cleanedQuestions));
            }
            activitySpecificData.ACTIVITY_INTRO_HTML = `<p>${translations.millionnaire_activity_intro || "Bienvenue dans ce quiz de type Millionnaire !"}</p>`;
            break;
        }

        case 'QCM': {
            // Pipeline LaTeX complet pour MathJax Moodle
            donnees = healLatex(donnees);
            // Transformation des questions avec formatage HTML (identique à handleQCMCreation)
            // Convertit markdown **gras** et *italique* en HTML
            const formatMarkdown = (text) => {
                if (!text) return '';
                // Une question ou une réponse rendue en liste par le modèle : une seule ligne.
                if (typeof text !== 'string') text = Array.isArray(text) ? text.map(String).join(' ') : String(text);
                return text
                    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                    .replace(/\*(.*?)\*/g, '<i>$1</i>');
            };

            if (Array.isArray(donnees.questions)) {
                const formattedQuestions = donnees.questions.map(question => {
                    const formatted = { ...question };
                    if (formatted.text) {
                        let text = formatMarkdown(formatted.text);
                        if (!text.match(/^\s*<p[\s>]/i)) {
                            text = `<p>${text}</p>`;
                        }
                        formatted.text = text;
                    }
                    if (Array.isArray(formatted.answers)) {
                        formatted.answers = formatted.answers.map(answer => {
                            const formattedAnswer = { ...answer };
                            if (formattedAnswer.text) {
                                let text = formatMarkdown(formattedAnswer.text);
                                if (!text.match(/^\s*<p[\s>]/i)) {
                                    text = `<p>${text}</p>`;
                                }
                                formattedAnswer.text = text;
                            }
                            return formattedAnswer;
                        });
                    }
                    return formatted;
                });
                activitySpecificData.QUESTIONS_JSON = escapeXml(JSON.stringify(formattedQuestions));
            }
            activitySpecificData.ACTIVITY_INTRO_HTML = escapeXml(`<p dir="ltr" style="text-align: left;">${translations.qcm_activity_intro || "Répondez aux questions suivantes."}</p>`);
            break;
        }

        case 'Page': {
            // Les images envoyées sortent du JSON AVANT la réparation LaTeX, qui
            // n'a rien à faire dans leur base64 (cf. page-images.js).
            const images = await extraireImagesEnvoyees(donnees, 'Page');
            paquet = images.paquet;
            // Pipeline LaTeX complet pour MathJax Moodle
            donnees = healLatex(images.donnees);
            // Pour Page, on a besoin de CONTENT et INTRO
            // Import dynamique de la fonction de génération HTML
            let generatedHtml = null;
            try {
                const { generateHtmlFromBlocks } = await import('./moodle-creator.js');
                if (typeof generateHtmlFromBlocks === 'function' && Array.isArray(donnees.blocks)) {
                    generatedHtml = await generateHtmlFromBlocks(donnees);
                    activitySpecificData.CONTENT = escapeXml(generatedHtml);
                }
            } catch (e) {
                // Fallback: si generateHtmlFromBlocks n'est pas exportée, on utilise le contenu brut
                console.warn('[mono-activity-files] generateHtmlFromBlocks not available, using raw content');
                activitySpecificData.CONTENT = escapeXml(donnees.content || '');
            }
            activitySpecificData.PAGE_NAME = escapeXml(donnees.title || titreParDefaut || 'Page');
            activitySpecificData.INTRO = escapeXml(donnees.intro || '');
            // Stocker le HTML généré pour le retourner plus tard (pour previewHtml).
            // Le backup cite les images par `@@PLUGINFILE@@` ; l'aperçu, lui, les montre.
            activitySpecificData._generatedPreviewHtml = versApercu(generatedHtml, images.apercu);
            break;
        }

        case 'Livre': {
            // Images envoyées : même traitement que la Page, une zone par chapitre.
            const images = await extraireImagesEnvoyees(donnees, 'Livre');
            paquet = images.paquet;
            // Pipeline LaTeX complet pour MathJax Moodle
            donnees = healLatex(images.donnees);
            // Healing Livre : injecte les défauts numbering/customtitles + valide la séquence des chapitres
            const { healStructureForActivity } = await import('../h5p/json-healer.js');
            donnees = healStructureForActivity(donnees, 'Livre');

            // Composition du bloc XML <chapter>...</chapter> et du HTML de prévisualisation
            let chaptersXml = '';
            let previewHtml = null;
            try {
                const { buildChaptersXml, buildLivrePreviewHtml } = await import('./moodle-creator.js');
                const theme = donnees.theme || 'elea';
                chaptersXml = await buildChaptersXml(donnees.chapters || [], theme);
                previewHtml = versApercu(await buildLivrePreviewHtml(donnees), images.apercu);
            } catch (e) {
                console.warn('[mono-activity-files] buildChaptersXml/buildLivrePreviewHtml not available:', e);
            }

            // Import des utilitaires de formatage (intro)
            const { formatTextToHtml } = await import('../core/utils.js');

            activitySpecificData.BOOK_NAME = escapeXml(donnees.title || titreParDefaut || 'Livre');
            activitySpecificData.INTRO = escapeXmlPreservingEntities(formatTextToHtml(donnees.intro || ''));
            activitySpecificData.NUMBERING = String(donnees.numbering ?? 1);
            // navstyle forcé à 0 (table des matières) — Éléa n'expose pas les autres modes
            activitySpecificData.NAVSTYLE = '0';
            // Toujours 0 : option Moodle interne, non exposée à l'utilisateur
            activitySpecificData.CUSTOMTITLES = '0';
            activitySpecificData.CHAPTERS_XML = chaptersXml;
            // Stocker le HTML de preview pour le retourner plus tard (mode Fidelity)
            activitySpecificData._generatedPreviewHtml = previewHtml;
            break;
        }

        case 'Devoir': {
            // Transformation identique à handleDevoirCreation (moodle-creator.js)
            // Intro HTML depuis la description
            // Normalisation identique à la génération (prepareIntroHtml).
            activitySpecificData.ACTIVITY_INTRO_HTML = prepareIntroHtml(
                donnees.description,
                translations.devoir_activity_intro || "Consultez la grille d'évaluation ci-dessous pour connaître les critères de réussite."
            );
            activitySpecificData.RUBRIC_NAME = donnees.rubricName || donnees.title || 'Grille d\'évaluation';
            activitySpecificData.CRITERIA = donnees.criteria || [];
            break;
        }

        case 'Glossaire': {
            // Pipeline LaTeX complet pour MathJax Moodle
            donnees = healLatex(donnees);
            // Le glossaire n'a pas de chemin `.mbz` dans le produit — son export
            // est un fichier XML d'import. Le processeur, lui, sait fabriquer un
            // backup `mod_glossary` complet : il ne lui manque que ses entrées.
            const { buildEntriesXml } = await import('./processors/activities/Glossaire.js');
            const entrees = Array.isArray(donnees.entries) ? donnees.entries : [];
            // `replacePlaceholders` ne fait QU'UNE passe et ne rescanne jamais les
            // valeurs insérées : le `{{TIMESTAMP}}` que pose `buildEntriesXml`
            // resterait littéral dans le XML. On le substitue donc ici.
            activitySpecificData.ENTRIES_XML = buildEntriesXml(entrees)
                .split('{{TIMESTAMP}}').join(String(baseData.TIMESTAMP));
            break;
        }

        default:
            // Aucun type ne doit atterrir ici : un backup sans sa mise en forme
            // s'importe, mais VIDE. Mieux vaut échouer bruyamment.
            throw new Error(`mono_activity_mise_en_forme_absente:${moodleType}`);
    }

    const data = {
        ...baseData,
        ACTIVITY_TITLE: escapeXml(titreEffectif),
        COURSE_FULLNAME: escapeXml(titreEffectif),
        ...activitySpecificData,
    };

    // La carte de fichiers d'un backup mono-activité complet : racine + dossier
    // d'activité. L'appelant garde la main sur les fichiers de RACINE — le nom
    // de sauvegarde, la ligne de journal — parce qu'ils ne le concernent pas
    // tous : le constructeur de cours, lui, ne reprend que le dossier
    // d'activité et synthétise sa propre racine.
    const files = MoodleProcessors.getActivityFiles(moodleType, data);

    return {
        files,
        moduleName: metadonnees.moduleName,
        activityDir: `activities/${metadonnees.moduleName}_${data.MODULE_ID}`,
        title: titreEffectif,
        // Page et Livre savent rendre leur aperçu au passage : l'éditeur s'en sert
        // pour son mode « fidélité », le parcours l'ignore.
        previewHtml: activitySpecificData._generatedPreviewHtml || null,
        // Fichiers à joindre au backup, au format de `joindreFichiersInitiaux`.
        paquet,
    };
}

/**
 * La carte de fichiers d'un `.mbz` d'activité SEULE : celle de
 * `construireFichiersActivite()`, plus les fichiers joints de l'activité (les
 * images envoyées d'une Page ou d'un Livre), posés comme un export Moodle les
 * pose — pool `files/`, `files.xml`, `inforef.xml` de l'activité.
 *
 * Le parcours ne passe PAS par ici : il joint les mêmes `paquet` après
 * l'assemblage du cours (`parcours-builder.js`).
 *
 * @param {{files:Object, activityDir:string, paquet:Object|null}} resultat
 * @param {Object} [options]
 * @param {number} [options.timestamp]
 * @returns {Promise<Object>} La carte complète (une nouvelle carte s'il y a des fichiers).
 */
export async function fichiersMonoActivite({ files, activityDir, paquet }, { timestamp } = {}) {
    if (!paquet) return files;
    const { joindreFichiersInitiaux } = await import('./fichiers-modules.js');
    return joindreFichiersInitiaux(files, { timestamp, joints: [{ dir: activityDir, paquet }] });
}
