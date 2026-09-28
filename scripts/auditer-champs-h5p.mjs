/** Audit manuel hors CI : réglages réellement transmis de l’éditeur au paquet H5P. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { resetRandom } = await import('../tests/roundtrip/bootstrap.mjs');
const { listH5pFixtures } = await import('../tests/roundtrip/fixtures-map.mjs');
const { h5pModules } = await import('../js/core/definitions.js');
const { processH5PContent, getModuleMetadata } = await import('../js/h5p/processors/index.js');
const { normalizeDataForEditor, denormalizeDataForSave, getSchemaForType } = await import('../js/editor/content-detector.js');
const healer = await import('../js/h5p/json-healer.js');
const fixtures = await listH5pFixtures();
const rapport = [];
function champs(fields, data, path = []) {
    const result = [];
    for (const [key, field] of Object.entries(fields || {})) {
        const segments = key.split('.');
        const scalaire = field.isArrayValue && (data === null || typeof data !== 'object');
        const p = scalaire ? path : [...path, ...segments];
        const value = scalaire ? data : segments.reduce((o, s) => o?.[s], data);
        const condition = field.showWhen;
        if (condition?.field && !(condition.values || [condition.value]).includes(data?.[condition.field])) continue;
        if (field.type === 'array') {
            if (Array.isArray(value)) value.forEach((item, i) => result.push(...champs(field.itemSchema, item, [...p, String(i)])));
        } else if (field.type === 'object') result.push(...champs(field.schema, value, p));
        else if (field.type === 'fieldGroup') result.push(...champs(field.fields || field.schema, data, path));
        else if (field.type === 'dynamicObject') result.push(...champs(field.schemas?.[data?.[field.selector]], value, p));
        else if (['text', 'textarea', 'number', 'checkbox', 'select'].includes(field.type)) result.push({ path: p, field, value });
    }
    return result;
}
function changer(obj, path, value) {
    let p = obj;
    for (const key of path.slice(0, -1)) { if (!p[key] || typeof p[key] !== 'object') p[key] = {}; p = p[key]; }
    p[path.at(-1)] = value;
}
function valeurs(c) {
    if (['type', 'library', 'subContentId'].includes(c.path.at(-1))) return null; // Changer de schéma exige de remplir ses champs.
    if (c.field.type === 'checkbox') return c.field.valueType === 'number' ? [0, 1] : [false, true];
    if (c.field.type === 'number') {
        const a = /\.[xy]$/.test(c.path.join('.')) ? 25 : c.field.min ?? 1, b = /\.[xy]$/.test(c.path.join('.')) ? 65 : Math.min(c.field.max ?? a + 1, a + 1); return a === b ? null : [a, b];
    }
    if (c.field.type === 'select') {
        const options = c.field.options?.map(o => typeof o === 'object' ? o.value : o);
        return options?.length > 1 ? [options[0], options.at(-1)] : null;
    }
    if (/url|path|color|date|startDate|endDate|wordList|answer|keyword/i.test(c.path.at(-1))) return null;
    return ['AUDITALPHA', 'AUDITOMEGA'];
}
function net(obj) {
    if (Array.isArray(obj)) return obj.map(net);
    if (!obj || typeof obj !== 'object') return obj;
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !['subContentId', 'contentId'].includes(k)).map(([k, v]) => [k, net(v)]));
}
const semanticsCache = new Map();
async function projection(value, library) {
    if (!semanticsCache.has(library)) {
        try { semanticsCache.set(library, JSON.parse(await readFile(resolve(root, 'js/vendor/h5p-libs', library.replace(' ', '-'), 'semantics.json'), 'utf8'))); }
        catch { semanticsCache.set(library, null); }
    }
    const fields = semanticsCache.get(library);
    if (!fields) return net(value);
    async function field(v, f) {
        if (v === undefined) return undefined;
        if (f.type === 'group') {
            if (f.fields?.length === 1 && (f.fields[0].name === f.name || (f.fields[0].type === 'library' && v.library))) return field(v, f.fields[0]);
            return group(v, f.fields);
        }
        if (f.type === 'list' && Array.isArray(v)) return Promise.all(v.map(item => field(item, f.field)));
        if (f.type === 'library' && v?.library) return { library: v.library, params: await projection(v.params, v.library) };
        return v;
    }
    async function group(v, fs) {
        if (!v || typeof v !== 'object') return v;
        const out = {};
        for (const f of fs || []) if (v[f.name] !== undefined) out[f.name] = await field(v[f.name], f);
        return out;
    }
    return group(value, fields);
}
for (const module of Object.keys(h5pModules).filter(m => !h5pModules[m].hidden)) {
    for (const fixture of fixtures.filter(f => f.moduleKey === module)) {
    const metadata = getModuleMetadata(module);
    const entree = { module, package: metadata?.machineName, fixture: fixture?.file, verifies: [], sansEffet: [], erreurs: [], specialises: [] };
    rapport.push(entree);
    if (!fixture) { entree.erreurs.push('Aucune fixture'); continue; }
    const source = await readFile(fixture.path, 'utf8');
    let raw; try { raw = JSON.parse(source); } catch { raw = JSON.parse(healer.healJsonString(source)); }
    if (module === 'Dictation') { raw.sentences.forEach((s, i) => { s.sample = [{ path: `audios/audit-${i}.wav`, mime: 'audio/wav' }]; }); raw.tts = { ...(raw.tts || {}), slow: false }; }
    const schemaKey = /^QuizSet/.test(module) ? 'QuizSet' : module;
    const schema = getSchemaForType(schemaKey);
    if (!schema) { entree.erreurs.push('Schéma absent'); continue; }
    const data = normalizeDataForEditor(raw, schemaKey);
    const tous = (schema.sections || []).flatMap(s => champs(s.fields, data));
    entree.champs = tous.length;
    for (const c of tous) {
        const paire = valeurs(c); const path = c.path.join('.');
        if (!paire) { entree.specialises.push(path); continue; }
        try {
            const sorties = [];
            for (const v of paire) {
                const clone = structuredClone(data); changer(clone, c.path, v);
                let contenu = denormalizeDataForSave(clone, schemaKey);
                contenu = healer.healJsonObject(contenu, module);
                contenu = healer.healActivitySpecificFields(contenu, module);
                contenu = healer.healStructureForActivity(contenu, module);
                resetRandom();
                const sortie = await processH5PContent(module, contenu);
                sorties.push(JSON.stringify(await projection(sortie.content || sortie, `${metadata.machineName} ${metadata.version.major}.${metadata.version.minor}`)));
            }
            (sorties[0] === sorties[1] ? entree.sansEffet : entree.verifies).push(path);
        } catch (e) { entree.erreurs.push({ path, message: e.message }); }
    }
    console.log(`${module} (${fixture.file}): ${entree.verifies.length} transmis, ${entree.sansEffet.length} sans effet, ${entree.erreurs.length} à examiner`);
}
}
await mkdir(resolve(root, 'tests/sonde-parcours/audit-activites-2026-09-11'), { recursive: true });
await writeFile(resolve(root, 'tests/sonde-parcours/audit-activites-2026-09-11/champs-editeur.json'), JSON.stringify(rapport, null, 2) + '\n');
