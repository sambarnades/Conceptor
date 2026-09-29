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
 * Le même fichier garde deux autres réglages, eux aussi sans rien détruire :
 *   - `audio`  : par prise, la part gardée (`debut`, `fin`, en secondes dans la prise),
 *                le `gain` (dB) et un `decalage` (s) pour avancer ou retarder la voix ;
 *   - `textes` : le texte du prompteur réécrit pour un bloc (la vidéo ne change pas).
 * La prise elle-même reste intacte sur le disque : on peut toujours revenir en arrière.
 *
 * Un bloc va de son début au début du bloc suivant (sa « coupe ») ; le dernier,
 * jusqu'à la fin du film.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const RALLONGE_MAX = 10;
export const GAIN_MAX = 12;
export const DECALAGE_MAX = 2;
const VIDE = () => ({ rallonges: {}, audio: {}, textes: {} });

export function lireMontage(sortie) {
    const f = join(sortie, 'montage.json');
    if (!existsSync(f)) return VIDE();
    try { return { ...VIDE(), ...JSON.parse(readFileSync(f, 'utf8')) }; } catch { return VIDE(); }
}

const borne = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
const centieme = v => Math.round(v * 100) / 100;

/** Écrit le montage en ne gardant que des valeurs sensées ; un réglage neutre disparaît. */
export function ecrireMontage(sortie, montage) {
    const propre = VIDE();
    for (const [id, s] of Object.entries(montage.rallonges || {})) {
        const v = Math.round(borne(s, 0, RALLONGE_MAX) * 10) / 10;
        if (v > 0) propre.rallonges[id] = v;
    }
    for (const [id, a] of Object.entries(montage.audio || {})) {
        if (!a || typeof a !== 'object') continue;
        const r = {};
        const debut = centieme(borne(a.debut, 0, 600));
        if (debut > 0) r.debut = debut;
        if (a.fin !== undefined && a.fin !== null) { const fin = centieme(borne(a.fin, 0, 600)); if (fin > debut + 0.1) r.fin = fin; }
        const gain = Math.round(borne(a.gain, -GAIN_MAX, GAIN_MAX) * 2) / 2;
        if (gain) r.gain = gain;
        const decalage = centieme(borne(a.decalage, -DECALAGE_MAX, DECALAGE_MAX));
        if (decalage) r.decalage = decalage;
        if (Object.keys(r).length) propre.audio[id] = r;
    }
    for (const [id, t] of Object.entries(montage.textes || {})) {
        const texte = String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, 4000);
        if (texte) propre.textes[id] = texte;
    }
    writeFileSync(join(sortie, 'montage.json'), JSON.stringify(propre, null, 1) + '\n');
    return propre;
}

/**
 * Où tombe une prise une fois réglée : la part gardée [debut, fin] (secondes dans la
 * prise), posée à `debut + decalage` après le début de son bloc, au gain voulu.
 */
export function reglageAudio(montage, id, duree) {
    const a = montage.audio?.[id] || {};
    const debut = Math.min(Number(a.debut) || 0, Math.max(0, duree - 0.1));
    const fin = Math.min(duree, a.fin ?? duree);
    return { debut, fin: Math.max(debut + 0.05, fin), gain: Number(a.gain) || 0, decalage: Number(a.decalage) || 0 };
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
