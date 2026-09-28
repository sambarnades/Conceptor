/** Inventaire inverse des contrats H5P et des schémas Caramel. Manuel, hors CI.
 * Les noms concordants NE prouvent ni la transmission au paquet ni le rendu papier.
 * Usage : node scripts/inventorier-capacites-h5p.mjs [chemin-du-rapport.json]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
await import('../tests/roundtrip/bootstrap.mjs');
const { h5pModules } = await import('../js/core/definitions.js');
const { getModuleMetadata } = await import('../js/h5p/processors/index.js');
const { getSchemaForType } = await import('../js/editor/content-detector.js');
const { listH5pFixtures } = await import('../tests/roundtrip/fixtures-map.mjs');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = await listH5pFixtures();
const libraries = new Map();
const hash = text => createHash('sha256').update(text).digest('hex');
const pathJoin = (parent, key) => parent ? `${parent}.${key}` : key;

function nativeFields(fields, parent = '', common = false) {
    return fields.flatMap(field => {
        const path = pathJoin(parent, field.name);
        const isCommon = common || field.common === true;
        if (field.type === 'group') {
            // Les groupes à un champ homonyme sont transparents (ex. overallFeedback).
            if (field.fields?.length === 1 && field.fields[0].name === field.name) {
                return nativeFields(field.fields, parent, isCommon);
            }
            return nativeFields(field.fields || [], path, isCommon);
        }
        if (field.type === 'list') {
            const item = field.field;
            return item.type === 'group'
                ? nativeFields(item.fields || [], `${path}[]`, isCommon)
                : [describe(item, `${path}[]`, isCommon, field)];
        }
        return [describe(field, path, isCommon)];
    });
}
function describe(field, path, common, list) {
    return { path, type: field.type, common, label: list?.label || field.label || '',
        ...(field.options ? { options: field.options } : {}),
        ...(field.default !== undefined ? { default: field.default } : {}),
        ...(field.optional !== undefined ? { optional: field.optional } : {}) };
}
function editorFields(fields, parent = '', context = '') {
    return Object.entries(fields || {}).flatMap(([key, field]) => {
        const path = field.isArrayValue ? parent : pathJoin(parent, key);
        if (field.type === 'fieldGroup') return editorFields(field.fields || field.schema, parent, context);
        if (field.type === 'object') return editorFields(field.schema, path, context);
        if (field.type === 'array') return editorFields(field.itemSchema, `${path}[]`, context);
        if (field.type === 'dynamicObject') return Object.entries(field.schemas || {}).flatMap(([library, schema]) => editorFields(schema, path, library));
        const item = { path, type: field.type, context, ...(field.showWhen ? { showWhen: field.showWhen } : {}) };
        return field.altTextField ? [item, { path: pathJoin(parent, field.altTextField), type: 'imageAltText', context }] : [item];
    });
}
async function inspectLibrary(name) {
    if (libraries.has(name)) return libraries.get(name);
    const folder = name.replace(' ', '-');
    const base = resolve(root, 'js/vendor/h5p-libs', folder);
    const source = await readFile(resolve(base, 'semantics.json'), 'utf8');
    const metadata = JSON.parse(await readFile(resolve(base, 'library.json'), 'utf8'));
    const entry = { library: name, version: `${metadata.majorVersion}.${metadata.minorVersion}.${metadata.patchVersion}`, semanticsSha256: hash(source), fields: nativeFields(JSON.parse(source)) };
    libraries.set(name, entry); // avant récursion : les conteneurs peuvent se référencer
    for (const field of entry.fields.filter(f => f.type === 'library')) {
        for (const option of field.options || []) {
            const child = typeof option === 'string' ? option : option.name;
            if (!child) continue;
            try { await inspectLibrary(child); }
            catch (error) { (entry.unresolvedLibraries ||= []).push({ path: field.path, library: child, error: error.code || error.message }); }
        }
    }
    return entry;
}
const modules = [];
for (const [key, config] of Object.entries(h5pModules).filter(([, config]) => !config.hidden)) {
    const metadata = getModuleMetadata(key);
    const lib = `${metadata.machineName} ${metadata.version.major}.${metadata.version.minor}`;
    const native = await inspectLibrary(lib);
    const schema = getSchemaForType(key.startsWith('QuizSet') ? 'QuizSet' : key);
    const fields = schema.sections.flatMap(s => editorFields(s.fields));
    modules.push({ module: key, library: lib, version: native.version,
        fixtures: fixtures.filter(f => f.moduleKey === key).map(f => f.file),
        editorFields: fields,
        // Liste de travail uniquement : alias, widgets spécialisés et libellés doivent être qualifiés.
        nativePathsWithoutSameEditorPath: native.fields.filter(f => !f.common && !fields.some(e => !e.context && e.path === f.path)).map(f => f.path)
    });
    console.log(`${key}: ${native.version}; ${native.fields.filter(f => !f.common).length} champs natifs hors common; ${fields.length} chemins du schéma (branches comprises)`);
}
const report = { scope: 'Inventaire des contrats natifs, y compris champs optionnels et bibliothèques des conteneurs. Concordance de chemins uniquement : ce rapport ne mesure pas la couverture fonctionnelle.', modules, libraries: [...libraries.values()] };
const output = resolve(process.argv[2] || '/tmp/caramel-capacites-h5p.json');
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(`${modules.length} activités, ${libraries.size} bibliothèques. Rapport : ${output}`);
