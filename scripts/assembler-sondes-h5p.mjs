/** Réunit les sondes déjà générées dans un cours de collecte. Aucun appel réseau. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const { ensureFflate, ensureTar } = await import('../tests/roundtrip/bootstrap.mjs');
await ensureFflate();
await ensureTar();
const { assembleCourseFiles } = await import('../js/moodle/mbz-course-builder.js');
const { createMbz } = await import('../js/moodle/moodle-creator.js');
const folder = resolve(process.argv[2] || 'tests/sonde-parcours/audit-activites-2026-09-11/collecte-h5p');
const inventory = JSON.parse(await readFile(join(folder, 'inventaire.json'), 'utf8'));
if (!inventory.ok || inventory.ok !== inventory.activites.length || inventory.ko) throw Error('Inventaire incomplet.');
const activities = [];
for (const [index, item] of inventory.activites.entries()) {
    const bytes = new Uint8Array(await readFile(join(folder, item.fichier)));
    const title = `${inventory.prefixe || 'SONDE'} ${String(index + 1).padStart(2, '0')} — ${item.module}`;
    activities.push({
        title, sectionIndex: Math.floor(index / 9) + 1,
        extracted: {
            kind: 'h5p', moduleName: 'h5pactivity', title,
            h5pBytes: bytes, contenthash: createHash('sha1').update(bytes).digest('hex'), filename: item.fichier
        }
    });
}
const { files } = assembleCourseFiles({
    courseTitle: inventory.titre || 'SONDES Caramel — collecte des 27 H5P', timestamp: 1789128000,
    activities, sections: [{ index: 0, name: '' }, ...Array.from({length: Math.ceil(inventory.ok / 9)}, (_, i) => i + 1).map(index => ({ index, name: `SONDES H5P — lot ${index}` }))]
});
files['caramel-parcours.json'] = JSON.stringify({ version: 1, source: 'caramel' });
const output = join(folder, `sondes-${inventory.ok}-h5p.mbz`);
await writeFile(output, await createMbz(files));
console.log(`${inventory.ok} H5P dans ${output}.`);
