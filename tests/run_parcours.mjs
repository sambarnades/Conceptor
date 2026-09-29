/** Tous les bancs du parcours, séquentiels pour limiter la charge Chromium. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bancs = ['gardefous', 'types', 'calibrage', 'sources', 'fonds', 'atelier', 'import', 'course', 'fiche', 'relecture', 'apercu', 'vue', 'stabilite', 'documentation', 'caramelia', 'harmonie', 'natifs', 'reels'];
const echecs = [];
for (const banc of bancs) {
    console.log(`\n▶ Parcours : ${banc}`);
    const resultat = spawnSync(process.execPath, [`tests/run_parcours_${banc}.mjs`], { cwd: root, stdio: 'inherit', timeout: 180000 });
    if (resultat.status !== 0) echecs.push(banc);
}
console.log(`\nParcours : ${bancs.length - echecs.length}/${bancs.length} bancs réussis.`);
if (echecs.length) { console.error(`Échecs : ${echecs.join(', ')}`); process.exitCode = 1; }
