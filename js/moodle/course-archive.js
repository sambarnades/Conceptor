/** Lecture d'un parcours complet sans retirer les fichiers de son archive. */
import { parseXml } from './xml-utils.js';

export const COURSE_MARKER = 'caramel-parcours.json';
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const moodleText = value => value?.trim() === '$@NULL@$' ? '' : (value || '');
export const archiveText = value => typeof value === 'string' ? value : decoder.decode(value || new Uint8Array());

export function courseActivityPaths(files) {
    return [...new Set(Object.keys(files).map(p => p.match(/^(activities\/([a-z0-9]+)_(\d+))\//)?.[1]).filter(Boolean))];
}

/** Les anciennes sauvegardes mono-activité continuent d'emprunter leur lecteur. */
export function isCourseArchive(files) {
    return !!files[COURSE_MARKER] || courseActivityPaths(files).length > 1;
}

/** Le cours et ses séquences font autorité ; aucun tri alphabétique des activités. */
export function readCourseArchive(files) {
    const course = parseXml(archiveText(files['course/course.xml'])).querySelector('course');
    if (!course) throw new Error('course_invalid_archive');
    const activities = new Map();
    for (const dir of courseActivityPaths(files)) {
        const [, moduleName, id] = dir.match(/activities\/([a-z0-9]+)_(\d+)/);
        const xmlPath = `${dir}/${moduleName}.xml`;
        const xml = parseXml(archiveText(files[xmlPath]));
        const node = xml.querySelector(`activity > ${moduleName}`);
        const module = parseXml(archiveText(files[`${dir}/module.xml`])).querySelector('module');
        if (!node || !module || activities.has(id)) throw new Error('course_invalid_archive');
        activities.set(id, {
            id, moduleName, activityDir: dir, xmlPath,
            title: moodleText(node.querySelector(':scope > name')?.textContent),
            intro: moodleText(node.querySelector(moduleName === 'mapmodules' ? ':scope > descriptionheader' : ':scope > intro')?.textContent),
            footer: moodleText(node.querySelector(':scope > descriptionfooter')?.textContent),
            contextId: xml.querySelector('activity')?.getAttribute('contextid') || '',
            moduleXml: module, activityXml: node,
        });
    }
    if (!activities.size || activities.size > 100) throw new Error('course_invalid_archive');
    const seen = new Set();
    const sections = Object.keys(files).filter(p => /^sections\/section_\d+\/section.xml$/.test(p)).map(path => {
        const node = parseXml(archiveText(files[path])).querySelector('section');
        if (!node) throw new Error('course_invalid_archive');
        const ids = moodleText(node.querySelector(':scope > sequence')?.textContent).split(',').map(x => x.trim()).filter(Boolean);
        const items = ids.map(id => {
            if (!activities.has(id) || seen.has(id)) throw new Error('course_invalid_sequence');
            seen.add(id); return activities.get(id);
        });
        return {
            id: node.getAttribute('id'), path,
            number: Number(node.querySelector(':scope > number')?.textContent || 0),
            title: moodleText(node.querySelector(':scope > name')?.textContent),
            summary: moodleText(node.querySelector(':scope > summary')?.textContent),
            availability: moodleText(node.querySelector(':scope > availabilityjson')?.textContent),
            items,
        };
    }).sort((a,b) => a.number - b.number);
    // Une activité hors séquence doit être signalée, jamais disparaître à l'écran.
    if (seen.size !== activities.size) throw new Error('course_invalid_sequence');
    return {
        title: moodleText(course.querySelector(':scope > fullname')?.textContent),
        summary: moodleText(course.querySelector(':scope > summary')?.textContent),
        sections, activities: sections.flatMap(s => s.items),
    };
}

/** Localise le paquet H5P DIRECT par contexte, pas le premier fichier du cours. */
export function embeddedH5pFile(files, activity) {
    if (activity.moduleName !== 'h5pactivity') return null;
    const doc = parseXml(archiveText(files['files.xml']));
    const matches = [...doc.querySelectorAll('files > file')].filter(f =>
        f.querySelector('component')?.textContent === 'mod_h5pactivity' &&
        f.querySelector('filearea')?.textContent === 'package' &&
        f.querySelector('contextid')?.textContent === activity.contextId &&
        f.querySelector('filename')?.textContent?.toLowerCase().endsWith('.h5p'));
    if (matches.length !== 1) throw new Error('course_h5p_package_missing');
    const node = matches[0];
    const hash = node.querySelector('contenthash')?.textContent;
    const path = `files/${hash?.slice(0,2)}/${hash}`;
    if (!hash || !files[path]) throw new Error('course_h5p_package_missing');
    return { id: node.getAttribute('id'), path, bytes: files[path], filename: node.querySelector('filename').textContent };
}

/** Remplace un paquet en gardant les contextes Moodle et les autres activités. */
export async function replaceEmbeddedH5p(files, activity, bytes) {
    const embedded = embeddedH5pFile(files, activity);
    if (!embedded) throw new Error('course_h5p_package_missing');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-1', bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
    const doc = parseXml(archiveText(files['files.xml']));
    const file = [...doc.querySelectorAll('files > file')].find(f=>f.getAttribute('id')===embedded.id);
    file.querySelector('contenthash').textContent = hash;
    file.querySelector('filesize').textContent = String(bytes.byteLength);
    const result = { ...files, [`files/${hash.slice(0,2)}/${hash}`]: bytes,
        'files.xml': encoder.encode(new XMLSerializer().serializeToString(doc)) };
    // Le vieux pool peut être partagé : on ne retire que les octets sans référence.
    if (![...doc.querySelectorAll('contenthash')].some(n => embedded.path.endsWith('/'+n.textContent))) delete result[embedded.path];
    delete result['.ARCHIVE_INDEX'];
    return result;
}

/** Retouche du texte d'un cours/étape, en conservant séquences et restrictions. */
export function updateCourseText(files, { title, summary, sections = [] } = {}) {
    const result = { ...files };
    const write = (path, rootName, values) => {
        const doc = parseXml(archiveText(files[path]));
        const root = doc.querySelector(rootName);
        if (!root) throw new Error('course_invalid_archive');
        for (const [tag, value] of Object.entries(values)) {
            if (value === undefined) continue;
            let node = root.querySelector(`:scope > ${tag}`);
            if (!node) { node = doc.createElement(tag); root.appendChild(node); }
            node.textContent = String(value);
        }
        result[path] = encoder.encode(new XMLSerializer().serializeToString(doc));
    };
    write('course/course.xml', 'course', { fullname:title, summary, ...(summary !== undefined ? {summaryformat:1} : {}) });
    const existing = readCourseArchive(files);
    for (const section of sections) {
        const target = existing.sections.find(s=>s.id===String(section.id));
        if (!target) throw new Error('course_invalid_sequence');
        write(target.path, 'section', { name:section.title, summary:section.summary, summaryformat:1 });
    }
    delete result['.ARCHIVE_INDEX'];
    return result;
}

/** Modification de la consigne d'un outil collaboratif sans réécrire ses réglages. */
export function updateCourseActivityText(files, activity, { title, intro } = {}) {
    const doc = parseXml(archiveText(files[activity.xmlPath]));
    const root = doc.querySelector(`activity > ${activity.moduleName}`);
    if (!root) throw new Error('course_invalid_archive');
    for (const [key,value] of Object.entries({name:title,intro})) {
        if (value === undefined) continue;
        const tag = key === 'intro' && activity.moduleName === 'mapmodules' ? 'descriptionheader' : key;
        const existing = root.querySelector(`:scope > ${tag}`);
        if (!existing) throw new Error('course_activity_text_unavailable');
        existing.textContent = String(value);
    }
    const result = { ...files, [activity.xmlPath]: encoder.encode(new XMLSerializer().serializeToString(doc)) };
    delete result['.ARCHIVE_INDEX'];
    return result;
}
