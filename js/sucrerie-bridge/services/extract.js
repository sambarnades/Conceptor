/**
 * Extracteur de texte pour activités hôte (h5p / mbz / xml / md) → markdown
 * synthétique consommé par `/sucrerie-enrich` (LLM).
 *
 * Logique H5P alignée sur Sucrerie `assets/js/h5p/h5p-reader.js` :
 *   - extractH5p (lit h5p.json + content/content.json)
 *   - collectTextValues (walk récursif, filtrage clés techniques, descente
 *     explicite dans `params` qui est la racine du contenu pédagogique en H5P)
 *
 * Logique MBZ : réutilise `js/moodle/mbz-utils.js > extractMbz()` pour
 * décompresser TAR+GZIP, puis walk des XML d'activité (incluant le HTML
 * imbriqué dans `<content>` qui est entity-encoded) avec filtrage des tags
 * techniques (IDs, timestamps, flags de notation…).
 *
 * Logique MD : passthrough — le blob est déjà un fichier markdown texte
 * (cas aManDe où le contenu n'est pas binaire). On retourne le texte brut,
 * tronqué à MAX_TEXT_LENGTH.
 *
 * IMPORTANT — pas de pollution du markdown par `manifest.title` :
 *   Côté Caramel, h5p.json:title est défini comme `translations[module.name]`
 *   (cf. h5p-creator.js:416), donc générique ("Flashcards H5P", "Cartes
 *   mémoires"…). L'inclure dans le markdown envoyé au LLM lui sert de
 *   suggestion de titre → suggestion bidon. On l'IGNORE volontairement.
 *
 * Les imports lourds (`lib-loader`, `moodle/mbz-utils`) sont chargés
 * dynamiquement à l'intérieur des branches concernées — un site hôte
 * (ex. aManDe) qui n'utilise que le format 'md' n'a pas besoin de les
 * fournir.
 */

const MAX_TEXT_LENGTH = 8000;

const DEBUG = (typeof window !== 'undefined') && window.location.search.includes('debug');

/**
 * @param {Blob}   blob          - notification.blob courant
 * @param {string} format        - 'h5p' | 'mbz' | 'xml' | 'md' | 'scorm' | autre
 * @param {string} fallbackTitle - libellé i18n traduit (notification.titleKey)
 * @returns {Promise<{ markdown: string, title: string, activityType: string }>}
 */
export async function extractMarkdownFromBlob(blob, format, fallbackTitle = '') {
    const fmt = (format || '').toLowerCase();

    let result;
    if (fmt === 'md' || fmt === 'markdown') {
        try {
            result = await extractFromMd(blob, fallbackTitle);
        } catch (err) {
            if (DEBUG) console.warn('[sucrerie-bridge] MD extract failed', err);
            result = synthesize(fallbackTitle, fmt);
        }
    } else if (fmt === 'h5p') {
        try {
            result = await extractFromH5p(blob);
        } catch (err) {
            if (DEBUG) console.warn('[sucrerie-bridge] H5P extract failed', err);
            result = synthesize(fallbackTitle, fmt);
        }
    } else if (fmt === 'xml') {
        try {
            const raw = await blob.text();
            const text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            // Type Éléa PRÉCIS depuis la racine du .xml standalone (quiz/glossaire).
            // Sans ça on envoyait 'xml' générique → Sucrerie stockait 'xml' et
            // l'activité restait INVISIBLE aux filtres « Test » / « Glossaire » du
            // catalogue. Miroir de Sucrerie h5p-reader.js > detectStandaloneXmlActivityType.
            const activityType = detectStandaloneXmlActivityType(raw) || 'xml';
            result = {
                title: '',
                activityType,
                markdown: buildMarkdown(fmt, activityType, text)
            };
        } catch {
            result = synthesize(fallbackTitle, fmt);
        }
    } else if (fmt === 'mbz') {
        try {
            result = await extractFromMbz(blob);
        } catch (err) {
            if (DEBUG) console.warn('[sucrerie-bridge] MBZ extract failed', err);
            result = synthesize(fallbackTitle, fmt);
        }
    } else {
        // scorm / autres : extraction non implémentée — markdown synthétique minimal
        result = synthesize(fallbackTitle, fmt);
    }

    if (DEBUG) {
        console.groupCollapsed('[sucrerie-bridge] markdown envoyé à /sucrerie-enrich');
        console.log('format:', fmt, '— activityType:', result.activityType);
        console.log('longueur:', result.markdown.length);
        console.log(result.markdown);
        console.groupEnd();
    }

    return result;
}

async function extractFromH5p(blob) {
    // loadJSZip() (Caramel) charge le script et place le constructeur sur
    // `window.JSZip` — il NE retourne PAS le constructeur lui-même.
    // Import dynamique : un site hôte qui n'utilise que le format 'md'
    // (ex. aManDe) ne charge jamais ce module et n'a pas besoin de le fournir.
    const { loadJSZip } = await import('../../core/lib-loader.js');
    await loadJSZip();
    const JSZip = window.JSZip;
    if (!JSZip) throw new Error('jszip_unavailable');

    const buffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const manifestFile = zip.file('h5p.json');
    const contentFile = zip.file('content/content.json');
    if (!manifestFile || !contentFile) throw new Error('h5p_invalid');

    const manifest = JSON.parse(await manifestFile.async('string'));
    const content = JSON.parse(await contentFile.async('string'));

    const activityType = String(manifest.mainLibrary || 'H5P');

    // ⚠️ On IGNORE manifest.title (générique côté Caramel).
    const acc = [];
    collectTextValues(content, acc, 0);

    let text = acc.join('\n').replace(/[ \t]+/g, ' ').trim();
    if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH);

    if (text.length < 20) {
        return synthesize('', 'h5p');
    }

    return {
        title: '',
        activityType,
        markdown: buildMarkdown('h5p', activityType, text)
    };
}

/**
 * Passthrough markdown : le blob est déjà du texte markdown (cas aManDe).
 * On retourne le contenu brut, tronqué à MAX_TEXT_LENGTH. L'activityType
 * est récupéré depuis le fallbackTitle (= moduleId côté aManDe, ex.
 * "c-flashcards"), suffisant pour l'enrichissement IA et le mapping
 * d'icône côté Sucrerie.
 */
async function extractFromMd(blob, fallbackTitle) {
    const raw = (await blob.text()) || '';
    let text = raw.replace(/\r\n/g, '\n').trim();
    if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH);

    if (text.length < 20) {
        return synthesize(fallbackTitle, 'md');
    }

    return {
        title: '',
        activityType: fallbackTitle || 'md',
        markdown: text
    };
}

/**
 * Walk récursif — copié à l'identique de Sucrerie h5p-reader.js (collectTextValues).
 * Filtre les clés techniques. Descend explicitement dans `params` qui contient
 * tout le contenu pédagogique en H5P.
 */
function collectTextValues(obj, acc, depth = 0) {
    if (depth > 20 || obj == null) return;

    if (typeof obj === 'string') {
        const cleaned = obj.replace(/<[^>]*>/g, ' ').trim();
        if (cleaned && cleaned.length > 1) acc.push(cleaned);
        return;
    }

    if (Array.isArray(obj)) {
        for (const item of obj) collectTextValues(item, acc, depth + 1);
        return;
    }

    if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            if (/^(library|subContentId|contentId|params|metadata|semantics|version|uuid|machineName|majorVersion|minorVersion|patchVersion|fullscreen|embedTypes|preloaded|dropzone|coreApi)$/i.test(key)) {
                // Cas spécial `params` : c'est là que vit le contenu pédagogique
                if (/^params$/i.test(key)) {
                    collectTextValues(value, acc, depth + 1);
                }
                continue;
            }
            collectTextValues(value, acc, depth + 1);
        }
    }
}

/**
 * Type Éléa d'un `.xml` Moodle standalone depuis sa balise racine (sniff léger,
 * pas de parsing DOM ; on saute prologue `<?xml…?>`, commentaires et DOCTYPE) :
 *   - `<quiz>`     → 'test_elea'    (Test Éléa)
 *   - `<GLOSSARY>` → 'glossaireXml' (Glossaire)
 *   - autre        → '' (l'appelant retombe sur 'xml' générique)
 * Miroir EXACT de Sucrerie `assets/js/h5p/h5p-reader.js > detectStandaloneXmlActivityType`
 * (et des slugs `EDITOR_KEY_TO_ACTIVITY_TYPE` : elea_test → test_elea, elea_glossaire → glossaireXml).
 */
function detectStandaloneXmlActivityType(xmlText) {
    if (!xmlText || typeof xmlText !== 'string') return '';
    const m = xmlText.match(/<\s*([A-Za-z_][\w.:-]*)/);
    const root = m ? m[1] : '';
    if (root === 'quiz') return 'test_elea';
    if (root.toUpperCase() === 'GLOSSARY') return 'glossaireXml';
    return '';
}

function buildMarkdown(format, activityType, text) {
    const typeLabel = format === 'mbz' ? 'Moodle/Éléa' : 'H5P';
    return (`[Type d'activité ${typeLabel} : ${activityType}]\n\nContenu pédagogique extrait :\n\n${text}`)
        .slice(0, MAX_TEXT_LENGTH);
}

/**
 * Extrait le contenu pédagogique d'une activité Moodle/Éléa (.mbz).
 * Réutilise `extractMbz` (TAR+GZIP) du module Moodle, puis collecte le texte
 * des XML d'activité (incluant le HTML imbriqué dans `<content>` qui est
 * entity-encoded) et celui de `questions.xml` (banque pour les Tests).
 */
async function extractFromMbz(blob) {
    const { extractMbz } = await import('../../moodle/mbz-utils.js');

    const buffer = await blob.arrayBuffer();
    const extracted = await extractMbz(buffer);
    const { files, moduleName, activityDir } = extracted;

    // Fichiers porteurs de contenu :
    //   - tous les XML du dossier d'activité (page.xml, book.xml, simplequiz.xml…)
    //     qui agrègent name + intro + content + questions
    //   - questions.xml à la racine (banque de questions du Test/quiz)
    const relevantPaths = Object.keys(files).filter(p =>
        (p.startsWith(activityDir + '/') && /\.xml$/i.test(p)) ||
        p === 'questions.xml'
    );

    const decoder = new TextDecoder('utf-8');
    const acc = [];
    for (const p of relevantPaths) {
        try {
            const xmlStr = decoder.decode(files[p]);
            collectMoodleXmlText(xmlStr, acc);
        } catch { /* ignore un XML cassé, on prend ce qu'on peut */ }
    }

    let text = acc.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length > MAX_TEXT_LENGTH) text = text.slice(0, MAX_TEXT_LENGTH);

    if (text.length < 20) {
        return synthesize('', 'mbz');
    }

    return {
        title: '',
        activityType: moduleName || 'mbz',
        markdown: buildMarkdown('mbz', moduleName || 'mbz', text)
    };
}

// Tags purement techniques des XML Moodle dont le contenu (IDs, timestamps,
// flags numériques, paramètres de notation…) ne porte aucune information
// pédagogique exploitable par l'IA d'enrichissement.
const MBZ_NOISE_TAGS = new Set([
    // IDs / refs
    'id', 'moduleid', 'contextid', 'sortorder', 'pagenum', 'idnumber',
    'sectionid', 'sectionnumber', 'instanceid', 'parent', 'questionid',
    'oldid', 'importsrc',
    // Formats / flags
    'contentformat', 'introformat', 'questiontextformat', 'generalfeedbackformat',
    'commentformat', 'displayformat', 'modulename',
    // Booléens / paramètres
    'hidden', 'visible', 'subchapter', 'showdescription',
    'completion', 'completionview', 'completionexpected', 'completionsubmit',
    // Timestamps
    'timemodified', 'timecreated', 'timeopen', 'timeclose', 'timelimit',
    // Notation / Test
    'grade', 'sumgrades', 'grademethod', 'decimalpoints', 'questiondecimalpoints',
    'shuffleanswers', 'shufflequestions', 'questionsperpage', 'navmethod',
    'attempts_number', 'attemptonlast', 'preferredbehaviour', 'browsersecurity',
    'delay1', 'delay2', 'showuserpicture', 'showblocks', 'overduehandling',
    'graceperiod', 'reviewattempt', 'reviewcorrectness', 'reviewmarks',
    'reviewspecificfeedback', 'reviewgeneralfeedback', 'reviewrightanswer',
    'reviewoverallfeedback', 'penalty', 'defaultmark', 'length',
    'usecase', 'single', 'answernumbering', 'numattempts',
    // Glossaire (paramètres)
    'mainglossary', 'showall', 'showspecial', 'showalphabet',
    'allowduplicatedentries', 'allowprintview', 'rsstype', 'rssarticles',
    'allowcomments', 'usedynalink', 'defaultapproval', 'editingdays',
    'casesensitive', 'fullmatch', 'globalglossary', 'entbypage',
    'assessed', 'assesstimestart', 'assesstimefinish', 'scale', 'grade_pass',
    // Branches structurelles à ignorer
    'tags', 'roles_overrides', 'roles_assignments', 'comments', 'logs',
    'analytics_indicators'
]);

function collectMoodleXmlText(xmlStr, acc) {
    let doc;
    try {
        doc = new DOMParser().parseFromString(xmlStr, 'application/xml');
    } catch { return; }
    if (!doc?.documentElement) return;
    if (doc.querySelector('parsererror')) return;
    walkMoodleXml(doc.documentElement, acc, 0);
}

function walkMoodleXml(node, acc, depth) {
    if (depth > 30 || !node) return;

    if (node.nodeType === 3) {
        // Nœud texte : peut contenir du HTML qui était entity-encoded dans l'XML
        // (ex. `<content>&lt;p&gt;Hello&lt;/p&gt;</content>` → text node `<p>Hello</p>`)
        const s = decodeAndStripHtml(node.nodeValue || '');
        if (s.length > 1) acc.push(s);
        return;
    }
    if (node.nodeType !== 1) return;

    const tag = (node.tagName || '').toLowerCase();
    if (MBZ_NOISE_TAGS.has(tag)) return;

    for (const child of node.childNodes) {
        walkMoodleXml(child, acc, depth + 1);
    }
}

function decodeAndStripHtml(s) {
    // Décode les entités courantes AVANT le strip (sinon `&lt;p&gt;` ne serait
    // pas reconnu comme tag et resterait dans la sortie).
    return String(s || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&apos;/gi, "'")
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function synthesize(fallbackTitle, fmt) {
    // ⚠️ Volontairement minimaliste : si on tombe ici l'IA produira du générique,
    // mais au moins on franchit le seuil 20 chars de /sucrerie-enrich.
    const desc = `Contenu non extractible côté front (format ${fmt || 'inconnu'}). Métadonnées à compléter manuellement par l'enseignant.`;
    return {
        title: '',
        activityType: fmt || 'unknown',
        markdown: desc + (fallbackTitle ? `\n\n[Type indicatif : ${fallbackTitle}]` : '')
    };
}
