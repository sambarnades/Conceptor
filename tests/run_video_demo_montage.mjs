/**
 * run_video_demo_montage.mjs — Tests des réglages du studio de la vidéo de présentation
 * (`scripts/video-demo/montage.mjs`) : rallonges, retouches des prises, textes réécrits,
 * et la façon dont le montage pose une prise réglée dans ffmpeg.
 *
 * Tout ce qui est testé ici est PUR : pas de vidéo, pas de micro, pas de ffmpeg. Le
 * studio lui-même (prompteur, capture, pourcentage de la génération) se vérifie à la
 * main, avec un tournage réel — cf. scripts/video-demo/README.md.
 *
 * Contre-épreuve embarquée : une prise dont on aurait oublié de caler le début (le
 * montage la poserait à `debutMonte`, sans tenir compte de la coupe) est vue.
 *
 * Lancement :  node tests/run_video_demo_montage.mjs
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chronologie, ecrireMontage, filtrePrise, lireMontage, poserPrise, reglageAudio, RALLONGE_MAX, GAIN_MAX, DECALAGE_MAX } from '../scripts/video-demo/montage.mjs';

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail = '') {
    if (cond) { pass++; } else { fail++; failures.push(`❌ ${name}${detail ? '\n   ' + detail : ''}`); }
}
function eq(name, actual, expected) {
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    ok(name, a === b, `attendu: ${b}\n   obtenu: ${a}`);
}

const dossier = mkdtempSync(join(tmpdir(), 'montage-'));
try {
    // ------------------------------------------------------------------ lecture / écriture
    eq('montage absent → vide', lireMontage(dossier), { rallonges: {}, audio: {}, textes: {} });
    writeFileSync(join(dossier, 'montage.json'), '{ illisible');
    eq('montage illisible → vide', lireMontage(dossier), { rallonges: {}, audio: {}, textes: {} });
    // Un ancien fichier ne portait que les rallonges : les deux autres clés apparaissent.
    writeFileSync(join(dossier, 'montage.json'), '{"rallonges":{"fin":2}}');
    eq('ancien format complété', lireMontage(dossier), { rallonges: { fin: 2 }, audio: {}, textes: {} });

    const ecrit = ecrireMontage(dossier, {
        rallonges: { a: 3.14159, b: 0, c: 99, d: -4 },
        audio: {
            a: { debut: 1.234, fin: 20, gain: 3.3, decalage: 0.1 },
            b: { debut: 0, gain: 0, decalage: 0 },                 // neutre → disparaît
            c: { debut: 5, fin: 5.05, gain: 40, decalage: -9 },   // fin trop proche, gain et décalage bornés
            d: 'n’importe quoi',
        },
        textes: { a: '  Bonjour\n  la classe  ', b: '   ' },
    });
    eq('rallonges bornées et arrondies', ecrit.rallonges, { a: 3.1, c: RALLONGE_MAX });
    eq('retouche gardée, arrondie au centième', ecrit.audio.a, { debut: 1.23, fin: 20, gain: 3.5, decalage: 0.1 });
    ok('retouche neutre effacée', !('b' in ecrit.audio));
    eq('valeurs hors bornes ramenées', ecrit.audio.c, { debut: 5, gain: GAIN_MAX, decalage: -DECALAGE_MAX });
    ok('retouche illisible ignorée', !('d' in ecrit.audio));
    eq('texte réécrit nettoyé, texte vide effacé', ecrit.textes, { a: 'Bonjour la classe' });
    eq('relecture = écriture', lireMontage(dossier), ecrit);

    // ------------------------------------------------------------------ réglage d'une prise
    eq('prise sans réglage : entière', reglageAudio({ audio: {} }, 'x', 12), { debut: 0, fin: 12, gain: 0, decalage: 0 });
    eq('fin au-delà de la prise ramenée', reglageAudio({ audio: { x: { fin: 50 } } }, 'x', 12).fin, 12);
    eq('début au-delà de la prise ramené', reglageAudio({ audio: { x: { debut: 30 } } }, 'x', 12).debut, 11.9);

    // ------------------------------------------------------------------ chronologie montée
    const marques = [{ id: 'titre', debut: 0 }, { id: 'accueil', debut: 8 }, { id: 'fin', debut: 30 }];
    const ch = chronologie(marques, 40, { accueil: 2 });
    eq('places des blocs', ch.blocs.map(b => [b.id, b.place]), [['titre', 8], ['accueil', 22], ['fin', 10]]);
    eq('la rallonge décale la suite', ch.blocs.map(b => b.debutMonte), [0, 8, 32]);
    eq('durée montée', ch.dureeMontee, 42);
    eq('instant traduit après la rallonge', ch.versMonte(31), 33);

    // ------------------------------------------------------------------ pose d'une prise
    const accueil = ch.blocs[1];
    const coupe = poserPrise(accueil, { debut: 1.5, fin: 20, gain: 3, decalage: 0.1 });
    eq('début coupé : la suite reste calée sur l’image', coupe, { t: 9.6, debut: 1.5, fin: 20, gain: 3 });
    const premier = poserPrise(ch.blocs[0], { debut: 0, fin: 8, gain: 0, decalage: -0.5 });
    eq('décalage négatif au tout début : la prise est rognée, pas posée avant zéro', premier, { t: 0, debut: 0.5, fin: 8, gain: 0 });

    const filtre = filtrePrise(coupe, 1, 'afftdn=nf=-50:nr=12:tn=1,');
    ok('filtre : entrée 2 (la vidéo muette est l’entrée 0)', filtre.startsWith('[2:a]'), filtre);
    ok('filtre : part gardée', filtre.includes('atrim=start=1.500:end=20.000'), filtre);
    ok('filtre : fondus aux coupes', filtre.includes('afade=t=in:d=0.02') && filtre.includes('afade=t=out:st=18.470:d=0.03'), filtre);
    ok('filtre : gain', filtre.includes('volume=3dB'), filtre);
    ok('filtre : débruitage avant la coupe', filtre.indexOf('afftdn') < filtre.indexOf('atrim'), filtre);
    ok('filtre : posé à 9,6 s', filtre.includes('adelay=9600:all=1[a1]'), filtre);
    ok('filtre sans gain : pas de volume', !filtrePrise(premier, 0).includes('volume='));

    // ------------------------------------------------------------------ contre-épreuve
    // Le défaut qu'on veut voir : une prise coupée posée à `debutMonte`, sans tenir compte
    // du début coupé — la voix arriverait 1,5 s trop tôt sur l'image.
    const fautive = { ...coupe, t: accueil.debutMonte };
    ok('contre-épreuve : le défaut « début non calé » se voit', !filtrePrise(fautive, 1).includes('adelay=9600'));
} finally {
    rmSync(dossier, { recursive: true, force: true });
}

console.log('');
if (failures.length) failures.forEach(f => console.log(f));
console.log('========================================');
console.log(`studio vidéo (montage.mjs) : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail === 0) console.log('✅ Tous les tests passent.');
process.exit(fail === 0 ? 0 : 1);
