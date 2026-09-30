/**
 * La musique de la vidéo, composée par le script : aucun droit à négocier, et un
 * morceau calé sur les parties du film (les changements tombent sur une mesure).
 *
 * Un « pop » d'habillage, clair et posé : 104 BPM, sol majeur, I–V–vi–IV
 * (sol, ré/fa#, mi mineur, do), des arpèges pincés avec un écho à la croche
 * pointée, une nappe, une basse ronde, une batterie légère qui fait « pomper » la
 * nappe sur les temps. La partie « À savoir » se pose (nappe et piano, sans
 * batterie), la fin se résout sur l'accord de sol.
 *
 * Styles de section, du plus nu au plus plein : 'intro', 'couplet', 'plein',
 * 'calme', 'final'. Avec `lit: true`, la même musique en fond sous une voix : sans
 * claps ni cymbales, plus douce.
 *
 * Tout est déterministe (générateur pseudo-aléatoire à graine) : deux rendus
 * donnent le même fichier.
 */
import { writeFileSync } from 'node:fs';

const MIDI = n => 440 * Math.pow(2, (n - 69) / 12);

/** Les accords : basse, nappe (autour du sol 3), arpège (une octave au-dessus). */
const ACCORDS = {
    G: { basse: 43, nappe: [55, 59, 62, 69] },            // sol add9
    D: { basse: 42, nappe: [57, 62, 66, 69] },            // ré / fa#
    Em: { basse: 40, nappe: [55, 59, 64, 67] },           // mi mineur 7
    C: { basse: 36, nappe: [55, 60, 64, 71] },            // do maj 7
};
const GRILLES = {
    intro: ['G', 'C', 'G', 'D'],
    couplet: ['G', 'D', 'Em', 'C'],
    plein: ['G', 'D', 'Em', 'C'],
    calme: ['Em', 'C', 'G', 'D'],
    final: ['G', 'D', 'Em', 'C'],
};
/** Motifs d'arpège, huit croches par mesure : indice dans l'accord, -1 = silence. */
const MOTIFS = {
    intro: [0, -1, 2, -1, 1, -1, 3, -1],
    couplet: [0, 2, 3, 2, 1, 2, 3, 2],
    plein: [0, 2, 3, 2, 1, 3, 2, 3],
    calme: [0, -1, -1, 2, -1, -1, 1, -1],
    final: [0, 2, 3, 2, 1, 3, 2, 3],
};
/** Ce qui joue dans chaque style (niveaux relatifs). */
const COUCHES = {
    intro: { nappe: 1, arpege: 0.7, basse: 0, kick: 0, clap: 0, charley: 0, piano: 0 },
    couplet: { nappe: 0.8, arpege: 1, basse: 0.9, kick: 1, clap: 0.6, charley: 0.8, piano: 0 },
    plein: { nappe: 0.85, arpege: 1, basse: 1, kick: 1, clap: 0.8, charley: 1, piano: 0 },
    calme: { nappe: 1, arpege: 0.45, basse: 0.45, kick: 0, clap: 0, charley: 0, piano: 1 },
    final: { nappe: 0.85, arpege: 1, basse: 1, kick: 1, clap: 0.8, charley: 1, piano: 0 },
};
const INTENSITE = { intro: 0, calme: 0, couplet: 1, plein: 2, final: 2 };

function hasard(graine) {
    let a = graine >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function composer({ duree, sections, bpm = 104, sr = 44100, graine = 7, lit = false }) {
    const n = Math.ceil((duree + 4) * sr);
    const bus = { batterie: new Float32Array(n), musique: new Float32Array(n), envoi: new Float32Array(n), echo: new Float32Array(n),
        arpG: new Float32Array(n), arpD: new Float32Array(n), nappeG: new Float32Array(n), nappeD: new Float32Array(n), pompe: new Float32Array(n).fill(1) };
    const g = new Float32Array(n), d = new Float32Array(n);
    const alea = hasard(graine);
    const noire = 60 / bpm, mesure = 4 * noire, croche = noire / 2;
    const nbMesures = Math.ceil(duree / mesure) + 1;
    const styleA = t => { let st = sections[0].style; for (const s of sections) if (s.debut <= t + mesure * 0.25) st = s.style; return st; };
    const ecrire = (buf, i, v) => { if (i >= 0 && i < n) buf[i] += v; };

    /* ---------------- Voix ---------------- */
    function pincee(t0, f, vel, pan = 0) {
        const i0 = Math.round(t0 * sr), len = Math.round(0.9 * sr);
        const gL = Math.cos((pan + 1) * Math.PI / 4), gR = Math.sin((pan + 1) * Math.PI / 4);
        for (let k = 0; k < len; k++) {
            const t = k / sr;
            const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.24) * (k > len - 400 ? (len - k) / 400 : 1);
            // Modulation de fréquence plus marquée à l'attaque, et un éclat à la quinte de l'octave : de la présence.
            const v = 0.27 * vel * env * (Math.sin(2 * Math.PI * f * t + 2.0 * Math.exp(-t / 0.09) * Math.sin(4 * Math.PI * f * t))
                + 0.22 * Math.sin(Math.PI * f * t) + 0.14 * Math.exp(-t / 0.05) * Math.sin(6 * Math.PI * f * t));
            const i = i0 + k; if (i >= n) break;
            // Légèrement placés à gauche ou à droite ; l'écho ping-pong élargit le reste.
            bus.arpG[i] += v * gL; bus.arpD[i] += v * gR; bus.envoi[i] += v * 0.35; bus.echo[i] += v;
        }
    }
    function nappe(t0, dur, notes, vol) {
        const i0 = Math.round(t0 * sr), len = Math.round((dur + 0.9) * sr);
        const osc = notes.flatMap(m => [-7, 0, 7].map(c => MIDI(m) * Math.pow(2, c / 1200)));
        const phases = osc.map(() => alea() * Math.PI * 2);
        for (let k = 0; k < len; k++) {
            const t = k / sr;
            const env = Math.min(1, t / 0.45) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.9) : 1);
            // Trois oscillateurs par note, désaccordés : le grave à gauche, l'aigu à droite.
            let vg = 0, vd = 0;
            for (let o = 0; o < osc.length; o++) {
                const p = 2 * Math.PI * osc[o] * t + phases[o], x = Math.sin(p) + 0.18 * Math.sin(2 * p) + 0.09 * Math.sin(3 * p) + 0.05 * Math.sin(4 * p);
                const cote = o % 3;
                if (cote === 0) vg += x; else if (cote === 2) vd += x; else { vg += 0.7 * x; vd += 0.7 * x; }
            }
            const a = 0.022 * vol * env;
            const i = i0 + k; if (i >= n) break;
            bus.nappeG[i] += vg * a * bus.pompe[i]; bus.nappeD[i] += vd * a * bus.pompe[i];
            bus.envoi[i] += (vg + vd) * a * 0.3 * bus.pompe[i];
        }
    }
    function basse(t0, dur, f, vol) {
        const i0 = Math.round(t0 * sr), len = Math.round(dur * sr);
        for (let k = 0; k < len; k++) {
            const t = k / sr, p = 2 * Math.PI * f * t;
            const env = Math.min(1, t / 0.008) * (0.6 + 0.4 * Math.exp(-t / 0.18)) * Math.min(1, (len - k) / (0.05 * sr));
            // Moins de fondamentale, plus d'harmoniques : la basse s'entend aussi sur un haut-parleur d'ordinateur.
            const v = 0.15 * vol * env * (0.8 * Math.sin(p) + 0.45 * Math.sin(2 * p) + 0.15 * Math.sin(3 * p));
            const i = i0 + k; if (i >= n) break;
            bus.musique[i] += v * (0.35 + 0.65 * bus.pompe[i]);
        }
    }
    function piano(t0, notes, vel) {
        for (const m of notes) {
            const f = MIDI(m), i0 = Math.round(t0 * sr), len = Math.round(2.6 * sr);
            for (let k = 0; k < len; k++) {
                const t = k / sr;
                const env = Math.min(1, t / 0.004) * Math.exp(-t / 1.3) * Math.min(1, (len - k) / 2000);
                const v = 0.07 * vel * env * Math.sin(2 * Math.PI * f * t + 0.9 * Math.exp(-t / 0.45) * Math.sin(2 * Math.PI * f * t));
                const i = i0 + k; if (i >= n) break;
                bus.musique[i] += v; bus.envoi[i] += v * 0.5;
            }
        }
    }
    function kick(t0, vol) {
        const i0 = Math.round(t0 * sr), len = Math.round(0.45 * sr);
        let ph = 0;
        for (let k = 0; k < len; k++) {
            const t = k / sr, f = 46 + 95 * Math.exp(-t / 0.032);
            ph += 2 * Math.PI * f / sr;
            const v = 0.42 * vol * Math.exp(-t / 0.2) * Math.sin(ph) + (k < 120 ? 0.12 * vol * (alea() * 2 - 1) * (1 - k / 120) : 0);
            ecrire(bus.batterie, i0 + k, v);
        }
        // La « pompe » : nappe et basse s'effacent un instant sous chaque coup.
        const lenP = Math.round(0.5 * sr);
        for (let k = 0; k < lenP; k++) {
            const t = k / sr, i = i0 + k; if (i >= n) break;
            bus.pompe[i] = Math.min(bus.pompe[i], 1 - 0.45 * vol * Math.min(1, t / 0.01) * Math.exp(-t / 0.11) - 0.0);
        }
    }
    const bruit = () => alea() * 2 - 1;
    function clap(t0, vol) {
        const i0 = Math.round(t0 * sr), len = Math.round(0.35 * sr);
        let bp = 0, lp = 0;                                   // filtre à variable d'état ~1,6 kHz
        const fq = 2 * Math.sin(Math.PI * 1600 / sr), q = 0.6;
        for (let k = 0; k < len; k++) {
            const t = k / sr;
            const salves = [0, 0.011, 0.022].reduce((a, s) => a + (t >= s ? Math.exp(-(t - s) / 0.006) : 0), 0);
            const env = Math.min(1, salves) * 0.8 + (t > 0.022 ? Math.exp(-(t - 0.022) / 0.11) * 0.5 : 0);
            const x = bruit(); lp += fq * bp; const hp = x - lp - q * bp; bp += fq * hp;
            const v = 0.36 * vol * env * bp;
            ecrire(bus.batterie, i0 + k, v); ecrire(bus.envoi, i0 + k, v * 0.25);
        }
    }
    function charley(t0, vol, ouvert = false) {
        const i0 = Math.round(t0 * sr), len = Math.round((ouvert ? 0.35 : 0.08) * sr);
        let prec = 0;
        for (let k = 0; k < len; k++) {
            const t = k / sr, x = bruit(), hp = x - prec; prec = x;         // différence : ne garde que l'aigu
            const v = 0.1 * vol * hp * Math.exp(-t / (ouvert ? 0.12 : 0.022));
            ecrire(bus.batterie, i0 + k, v);
        }
    }
    function montee(t0, dur, vol) {                    // souffle qui monte sur la mesure d'avant
        const i0 = Math.round(t0 * sr), len = Math.round(dur * sr);
        let bp = 0, lp = 0;
        for (let k = 0; k < len; k++) {
            const x = k / len, f = 300 * Math.pow(20, x), fq = 2 * Math.sin(Math.PI * Math.min(f, sr / 6) / sr);
            const b = bruit(); lp += fq * bp; const hp = b - lp - 0.5 * bp; bp += fq * hp;
            const v = 0.12 * vol * x * x * bp;
            ecrire(bus.musique, i0 + k, v); ecrire(bus.envoi, i0 + k, v * 0.6);
        }
    }
    function souffle(t0, vol) {                        // la « cymbale » d'arrivée, en douceur
        const i0 = Math.round(t0 * sr), len = Math.round(2.2 * sr);
        let prec = 0;
        for (let k = 0; k < len; k++) {
            const t = k / sr, x = bruit(), hp = x - 0.7 * prec; prec = x;
            const v = 0.06 * vol * hp * Math.exp(-t / 0.7) * Math.min(1, t / 0.01);
            ecrire(bus.musique, i0 + k, v); ecrire(bus.envoi, i0 + k, v * 0.8);
        }
    }

    /* ---------------- La partition, mesure par mesure ---------------- */
    const derniere = Math.floor(duree / mesure);       // la mesure de la résolution finale
    // Les coups de grosse caisse d'abord : la pompe doit exister avant la nappe et la basse.
    const plan = [];
    for (let b = 0; b < nbMesures; b++) {
        const t0 = b * mesure, st = styleA(t0), grille = GRILLES[st], nom = grille[b % 4];
        plan.push({ b, t0, st, accord: ACCORDS[b >= derniere ? 'G' : nom], couches: COUCHES[st] });
    }
    for (const { b, t0, couches } of plan) {
        if (b >= derniere || !couches.kick) continue;
        const temps = INTENSITE[plan[b].st] >= 2 ? [0, 1, 2, 3] : [0, 2];
        for (const tp of temps) kick(t0 + tp * noire, couches.kick * (lit ? 0.55 : 1));
    }
    for (const { b, t0, st, accord, couches } of plan) {
        if (b > derniere) break;
        const fin = b === derniere;
        const precedent = plan[b - 1];
        // Changement de partie : souffle à l'arrivée, montée sur la mesure d'avant si ça s'intensifie.
        if (b > 0 && precedent.st !== st) souffle(t0, lit ? 0.4 : 1);
        const suivant = plan[b + 1];
        if (!lit && suivant && suivant.st !== st && INTENSITE[suivant.st] > INTENSITE[st] && b + 1 < derniere) montee(t0, mesure, 1);
        if (fin) {
            nappe(t0, mesure * 1.5, accord.nappe, 1);
            piano(t0, [43, ...accord.nappe], 0.9);
            basse(t0, mesure * 1.2, MIDI(accord.basse), 0.8);
            souffle(t0, lit ? 0.4 : 1);
            continue;
        }
        nappe(t0, mesure, accord.nappe, couches.nappe * (lit ? 0.8 : 1));
        const motif = MOTIFS[st], notes = accord.nappe.map(m => m + 12);
        motif.forEach((ix, k) => {
            if (ix < 0 || !couches.arpege) return;
            const accent = k === 0 ? 1 : k % 2 ? 0.62 : 0.78;
            const jeu = (alea() - 0.5) * 0.01;
            pincee(t0 + k * croche + jeu, MIDI(notes[ix]), couches.arpege * accent * (0.92 + 0.16 * alea()) * (lit ? 0.7 : 1), k % 2 ? 0.45 : -0.45);
        });
        if (couches.basse) {
            const pas = INTENSITE[st] >= 2 ? croche : noire;
            for (let t = 0; t < mesure - 1e-6; t += pas) basse(t0 + t, pas * 0.9, MIDI(accord.basse), couches.basse * (t === 0 ? 1 : 0.8));
        }
        if (couches.piano) { piano(t0, accord.nappe, 0.9); piano(t0 + 2 * noire, accord.nappe.slice(1), 0.55); }
        if (couches.clap && !lit) { clap(t0 + noire, couches.clap); clap(t0 + 3 * noire, couches.clap); }
        if (couches.charley) {
            for (let k = 0; k < 8; k++) {
                const ouvert = INTENSITE[st] >= 2 && k === 7 && !lit;
                charley(t0 + k * croche + (alea() - 0.5) * 0.006, couches.charley * (k % 2 ? 1 : 0.55) * (lit ? 0.5 : 1), ouvert);
            }
        }
    }

    /* ---------------- Effets : écho à la croche pointée, réverbération ---------------- */
    // Écho ping-pong des arpèges : gauche puis droite, à 3/4 de noire.
    const retard = Math.round(0.75 * noire * sr);
    const echoG = new Float32Array(n), echoD = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        if (i < retard) continue;
        echoG[i] = 0.5 * bus.echo[i - retard] + 0.42 * echoD[i - retard];
        echoD[i] = 0.42 * echoG[i - retard];
    }
    // Réverbération « Freeverb » : 8 filtres en peigne et 4 passe-tout par canal.
    function reverb(entree, ecart) {
        const peignes = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(l => ({ b: new Float32Array(Math.round((l + ecart) * sr / 44100)), i: 0, f: 0 }));
        const passes = [556, 441, 341, 225].map(l => ({ b: new Float32Array(Math.round((l + ecart) * sr / 44100)), i: 0 }));
        const out = new Float32Array(n), fb = 0.84, amort = 0.25;
        for (let k = 0; k < n; k++) {
            const x = entree[k] * 0.015;
            let y = 0;
            for (const c of peignes) { const o = c.b[c.i]; c.f = o * (1 - amort) + c.f * amort; c.b[c.i] = x + c.f * fb; c.i = (c.i + 1) % c.b.length; y += o; }
            for (const a of passes) { const o = a.b[a.i]; const v = -y + o; a.b[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.b.length; y = v; }
            out[k] = y;
        }
        return out;
    }
    const revG = reverb(bus.envoi, 0), revD = reverb(bus.envoi, 23);

    /* ---------------- Mixage ---------------- */
    // Un peu d'« air » : on rajoute l'aigu au-dessus de ~3 kHz (étagère du premier ordre).
    const aCoupe = 1 - Math.exp(-2 * Math.PI * 3000 / sr);
    let bgG = 0, bgD = 0;
    let crete = 0;
    for (let i = 0; i < n; i++) {
        const m = bus.musique[i], b = bus.batterie[i];
        let l = m + b + bus.arpG[i] + bus.nappeG[i] + echoG[i] * 0.55 + revG[i] * 0.9;
        let r = m + b + bus.arpD[i] + bus.nappeD[i] + echoD[i] * 0.55 + revD[i] * 0.9;
        bgG += aCoupe * (l - bgG); bgD += aCoupe * (r - bgD);
        l += 0.45 * (l - bgG); r += 0.45 * (r - bgD);
        l = Math.tanh(l * 1.2) / 1.2; r = Math.tanh(r * 1.2) / 1.2;   // saturation douce, pas d'écrêtage
        g[i] = l; d[i] = r;
        crete = Math.max(crete, Math.abs(l), Math.abs(r));
    }
    const gain = 0.89 / (crete || 1);
    for (let i = 0; i < n; i++) { g[i] *= gain; d[i] *= gain; }
    return { sr, g, d, mesure, bpm };
}

/** WAV stéréo 16 bits. */
export function ecrireWav(fichier, { sr, g, d }) {
    const n = g.length, b = Buffer.alloc(44 + n * 4);
    b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(sr, 24);
    b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
    for (let i = 0; i < n; i++) {
        b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, g[i])) * 32767), 44 + i * 4);
        b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, d[i])) * 32767), 46 + i * 4);
    }
    writeFileSync(fichier, b);
}
