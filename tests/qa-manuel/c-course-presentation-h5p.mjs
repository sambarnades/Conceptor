/**
 * Scénario (c) — Course Presentation : le .h5p produit SANS ouvrir l'éditeur doit
 * contenir les bonnes réponses du Glisser-déposer imbriqué.
 *
 * Défaut visé (6.3.0) : `correctElements` arrivait VIDE dans le content.json — l'activité
 * partait sans aucune bonne réponse, et rien ne le signalait. Le healer ne descendait pas
 * dans les Glisser-déposer imbriqués (diapositives, sous-questions, blocs de Livre).
 * Correctif : appel `healDragQuestionsDeep(healed)` dans json-healer.js.
 *
 * Le contrôle porte sur le .h5p RÉEL : l'archive est construite par le même enchaînement
 * que handleH5PCreation (healing → processeur → dépendances → ZIP), écrite sur disque,
 * puis relue avec `unzip`. Les .h5p restent dans tests/qa-manuel/.sorties/ pour inspection.
 */
import { navigateur, bloc, titre } from './lib.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const SORTIES = join(ICI, '.sorties');
mkdirSync(SORTIES, { recursive: true });

const { b, p } = await navigateur();
bloc('(c) COURSE PRESENTATION — .h5p généré sans passer par l’éditeur');
let rouge = 0;

for (const fx of ['course_presentation_4.json', 'course_presentation_5.json']) {
    titre(fx);
    const octets = await p.evaluate(async f => await window.__qa.h5pDepuisFixture(f, 'CoursePresentation'), fx);
    const chemin = join(SORTIES, fx.replace('.json', '.h5p'));
    writeFileSync(chemin, Buffer.from(octets));
    const contenu = JSON.parse(execFileSync('unzip', ['-p', chemin, 'content/content.json'], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }));
    console.log(`  .h5p écrit : ${chemin} (${octets.length} octets)`);

    // Retrouver TOUS les Glisser-déposer, à n'importe quelle profondeur
    const trouves = [];
    (function walk(o, ch) {
        if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${ch}[${i}]`));
        if (o && typeof o === 'object') {
            if (Array.isArray(o.dropZones) && Array.isArray(o.elements)) trouves.push({ chemin: ch || '(racine)', dq: o });
            for (const [k, v] of Object.entries(o)) walk(v, ch ? `${ch}.${k}` : k);
        }
    })(contenu, '');

    if (!trouves.length) { console.log('  (aucun Glisser-déposer dans cette fixture)'); continue; }
    for (const { chemin: ch, dq } of trouves) {
        const total = dq.dropZones.reduce((n, z) => n + (z.correctElements || []).length, 0);
        const detail = dq.dropZones.map(z => `${(z.label || '').replace(/<[^>]*>/g, '').trim()}:${(z.correctElements || []).length}`).join('  ');
        console.log(`  ${ch}`);
        console.log(`     zones=${dq.dropZones.length}  étiquettes=${dq.elements.length}  correctElements=${total}`);
        console.log(`     [${detail}]`);
        const ok = total > 0;
        console.log(`     ${ok ? '✅' : '❌'} ${ok ? 'bonnes réponses présentes dans le content.json' : 'AUCUNE bonne réponse : activité inutilisable'}`);
        if (!ok) rouge++;
    }
}

await b.close();
console.log(`\n${rouge === 0 ? '✅ scénario (c) conforme' : `❌ ${rouge} Glisser-déposer sans bonne réponse`}`);
process.exit(rouge === 0 ? 0 : 1);
