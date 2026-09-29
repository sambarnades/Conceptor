/**
 * Les rallonges de la table de montage : quelques secondes ajoutées à la fin d'un
 * bloc, pendant lesquelles l'image reste figée sur sa dernière vue. Elles donnent
 * de la place à une voix plus lente que prévu, sans retourner le film.
 *
 * Réglées dans la table de montage du studio, gardées dans
 * tests/.video-demo/montage.json ({ "rallonges": { "limites": 2, … } }), elles
 * valent pour tout ce qui suit : l'enregistrement et la réécoute au studio, le
 * montage des voix (`tourner.mjs --mixer`) et l'habillage de la version commentée.
 *
 * Un bloc va de son début au début du bloc suivant (sa « coupe ») ; le dernier,
 * jusqu'à la fin du film.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const RALLONGE_MAX = 10;

export function lireMontage(sortie) {
    const f = join(sortie, 'montage.json');
    if (!existsSync(f)) return { rallonges: {} };
    try { return { rallonges: {}, ...JSON.parse(readFileSync(f, 'utf8')) }; } catch { return { rallonges: {} }; }
}

export function ecrireMontage(sortie, montage) {
    const rallonges = {};
    for (const [id, s] of Object.entries(montage.rallonges || {})) {
        const v = Math.round(Math.max(0, Math.min(RALLONGE_MAX, Number(s) || 0)) * 10) / 10;
        if (v > 0) rallonges[id] = v;
    }
    writeFileSync(join(sortie, 'montage.json'), JSON.stringify({ rallonges }, null, 1) + '\n');
    return { rallonges };
}

/**
 * La chronologie montée : chaque bloc avec sa place d'origine, sa rallonge, et ses
 * instants dans le film monté ; `versMonte(t)` traduit un instant de la vidéo muette.
 */
export function chronologie(marques, duree, rallonges = {}) {
    let decalage = 0;
    const blocs = marques.map((m, k) => {
        const coupe = k + 1 < marques.length ? marques[k + 1].debut : duree;
        const rallonge = Math.max(0, Number(rallonges[m.id]) || 0);
        const b = { id: m.id, debut: m.debut, coupe, place: coupe - m.debut, rallonge, debutMonte: m.debut + decalage };
        decalage += rallonge;
        b.finMonte = b.debutMonte + b.place + rallonge;
        return b;
    });
    const versMonte = t => {
        let d = 0;
        for (const b of blocs) { if (t >= b.coupe - 1e-9) d += b.rallonge; else break; }
        return t + d;
    };
    return { blocs, versMonte, dureeMontee: duree + decalage, totalRallonges: decalage };
}
