/**
 * Les vidéos que tournent ces outils, et celle que vise la commande : `--video=<id>`
 * (défaut : `presentation`). Chacune a son scénario, son dossier de sortie (exclu de
 * git) et ses réponses d'IA enregistrées ; le tournage, le studio et l'habillage
 * lisent tous ici, si bien que tourner l'une ne touche jamais aux fichiers de l'autre.
 *
 *   node scripts/video-demo/tourner.mjs --video=parcours
 *   node scripts/video-demo/studio.mjs --video=parcours
 */
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const VIDEOS = {
    presentation: {
        scenario: './scenario.mjs',
        sortie: 'tests/.video-demo/7.1',
        fixture: 'tests/fixtures/video-demo/reponses-ia.json',
        titre: 'Caramel 7',
        copie: 'Caramel 7.1 - démonstration commentée.mp4',
    },
    parcours: {
        scenario: './scenario-parcours.mjs',
        sortie: 'tests/.video-demo/parcours',
        fixture: 'tests/fixtures/video-demo/reponses-ia-parcours.json',
        titre: 'Créer un parcours avec Caramel',
        copie: 'Caramel 7.1 - créer un parcours.mp4',
    },
};

const arg = process.argv.find(a => a.startsWith('--video='));
export const VIDEO_ID = arg ? arg.slice('--video='.length) : 'presentation';
if (!VIDEOS[VIDEO_ID]) {
    console.error(`Vidéo inconnue : ${VIDEO_ID} (connues : ${Object.keys(VIDEOS).join(', ')})`);
    process.exit(1);
}
const v = VIDEOS[VIDEO_ID];
export const VIDEO = { ...v, id: VIDEO_ID, sortie: join(ROOT, v.sortie), fixture: join(ROOT, v.fixture) };
/** Le module du scénario : SCENES, CARTON_TITRE, HABILLAGE, et RETOUCHE s'il y en a une. */
export const SCENARIO = await import(v.scenario);
