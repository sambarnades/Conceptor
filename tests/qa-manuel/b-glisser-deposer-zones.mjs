/**
 * Scénario (b) — Glisser-déposer : muter les ZONES ne doit pas déplacer les associations.
 *
 * Les étiquettes renvoient aux zones PAR INDICE (`zoneIndices`). Supprimer, déplacer ou
 * dupliquer une zone renumérote donc les indices : sans remappage, chaque étiquette se
 * met silencieusement à désigner une AUTRE zone — une activité fausse, sans message.
 * Correctifs : remapperRenvoisDIndice (array-manager + editor-core) et
 * refreshArrayManagerAt (redessine la liste qui PORTE les renvois).
 *
 * Tout est comparé par NOM de zone : après renumérotation, l'indice ne prouve rien.
 * Couvre les deux conteneurs : autonome (nav maître-détail) et IMBRIQUÉ dans une
 * diapositive de Course Presentation (gestionnaire de tableau en ligne).
 */
import { navigateur, ouvrir, section, item, bouton, boutonItemImbrique,
         deplacerAuClavier, confirmer, enregistrer, bloc, titre } from './lib.mjs';

const { b, p } = await navigateur();
let rouge = 0;
const verdict = (ok, vrai, faux) => { console.log(`  ${ok ? '✅' : '❌'} ${ok ? vrai : faux}`); if (!ok) rouge++; };
const vues = a => a.etiquettes.map(e => `${e.texte}→${e.vise.join('+') || '∅'}`).join('  ');

// ===================== 1. GLISSER-DÉPOSER AUTONOME =====================
bloc('(b) GLISSER-DÉPOSER AUTONOME — drag_and_drop_1.json');
const CHEMIN_CASES_A = 'elements.0.zoneIndices';
const prepA = async () => { await ouvrir(p, 'drag_and_drop_1.json', 'DragAndDrop'); await section(p, 'Zones de dépôt'); };
const lireA = () => p.evaluate(() => window.__dd.assoc(null));
const casesA = () => p.evaluate(c => window.__dd.casesZones(c), CHEMIN_CASES_A);

// -- suppression --
titre('SUPPRIMER la zone 2 (« 2e groupe »)');
await prepA();
const avA = await lireA();
await item(p, 'dropZones', 1);
await bouton(p, 'Supprimer');
console.log('  [modale]', JSON.stringify(await confirmer(p)));
const apA = await lireA();
await section(p, 'Étiquettes'); await item(p, 'elements', 0);
const cA = await casesA();
console.log('  AVANT :', vues(avA));
console.log('  APRÈS :', vues(apA));
console.log('  zones proposées à « marcher » :', cA.map(c => c.zone + (c.cochee ? '✓' : '')).join(', '));
verdict(avA.etiquettes.every((e, i) =>
    JSON.stringify(e.vise.filter(z => z !== '2e groupe')) === JSON.stringify(apA.etiquettes[i].vise)),
    'les autres étiquettes visent EXACTEMENT la même zone qu’avant', 'des affectations ont glissé');
verdict(JSON.stringify(cA.map(c => c.zone)) === JSON.stringify(['1er groupe', '3e groupe']),
    'liste des zones à jour (« 2e groupe » retiré)', 'liste des zones périmée');
const sA = await enregistrer(p);
console.log('  enregistrement :', sA.ok ? 'PASSE' : 'BLOQUÉ →\n' + sA.resume.split('\n').map(l => '      ' + l).join('\n'));
const orphelines = avA.etiquettes.filter(e => e.vise.includes('2e groupe')).map(e => e.texte);
// Depuis c594a732 (recette Glisser-déposer du 11-09-2026), une étiquette sans zone correcte est un
// DISTRACTEUR valide, comme dans H5P.DragQuestion : le Glisser-déposer autonome s'enregistre donc.
// Ce qui reste exigé : les orphelines ne visent PLUS RIEN (et surtout pas une autre zone).
const apOrphelines = apA.etiquettes.filter(e => orphelines.includes(e.texte));
verdict(sA.ok && apOrphelines.length === orphelines.length && apOrphelines.every(e => e.vise.length === 0),
    `les orphelines (${orphelines.join(', ')}) deviennent des distracteurs sans zone ; l’enregistrement passe`,
    'les étiquettes orphelines bloquent l’enregistrement ou visent encore une zone');

// -- déplacement --
titre('DÉPLACER la zone 1 en 3e position');
await prepA();
const avA2 = await lireA();
await p.evaluate(async () => (await import('/js/editor/editor-core.js')).__testing.handleArrayMove('dropZones', 'dropZones', 0, 2));
await p.waitForTimeout(600);
const apA2 = await lireA();
console.log('  ordre des zones :', JSON.stringify(avA2.zones), '→', JSON.stringify(apA2.zones));
console.log('  APRÈS :', vues(apA2));
verdict(JSON.stringify(avA2.zones) !== JSON.stringify(apA2.zones), 'ordre RÉELLEMENT modifié', 'rien déplacé : test non concluant');
verdict(JSON.stringify(avA2.etiquettes.map(e => e.vise)) === JSON.stringify(apA2.etiquettes.map(e => e.vise)),
    'aucune étiquette n’a changé de zone', 'des étiquettes ont changé de zone');
console.log('  enregistrement :', (await enregistrer(p)).ok ? 'PASSE' : 'BLOQUÉ');

// -- duplication --
titre('DUPLIQUER la zone 2');
await prepA();
const avA3 = await lireA();
await item(p, 'dropZones', 1); await bouton(p, 'Dupliquer'); await p.waitForTimeout(500);
const apA3 = await lireA();
console.log('  ordre des zones :', JSON.stringify(avA3.zones), '→', JSON.stringify(apA3.zones));
verdict(apA3.zones.length === avA3.zones.length + 1, 'zone RÉELLEMENT dupliquée', 'rien dupliqué : test non concluant');
verdict(JSON.stringify(avA3.etiquettes.map(e => e.vise)) === JSON.stringify(apA3.etiquettes.map(e => e.vise)),
    'aucune étiquette n’a changé de zone', 'des étiquettes ont changé de zone');
console.log('  enregistrement :', (await enregistrer(p)).ok ? 'PASSE' : 'BLOQUÉ');

// ===================== 2. GLISSER-DÉPOSER IMBRIQUÉ =====================
bloc('(b bis) GLISSER-DÉPOSER IMBRIQUÉ — course_presentation_5.json, diapositive 13');
const EX = 'slides.12.exercise';
const ANCRE_Z = i => `${EX}.dropZones.${i}.label`;
const CASES_N = `${EX}.elements.0.zoneIndices`;
const prepN = async () => {
    await ouvrir(p, 'course_presentation_5.json', 'CoursePresentation');
    await section(p, 'Diapositives'); await item(p, 'slides', 12); await p.waitForTimeout(400);
};
const lireN = () => p.evaluate(c => window.__dd.assoc(c), 'slides.12.exercise');

titre('SUPPRIMER la zone 2 (« Gazeuses »)');
await prepN();
const avN = await lireN();
console.log('  ', await boutonItemImbrique(p, ANCRE_Z(1), 'Supprimer'));
await confirmer(p);
const apN = await lireN();
const cN = await p.evaluate(c => window.__dd.casesZones(c), CASES_N);
console.log('  AVANT :', vues(avN));
console.log('  APRÈS :', vues(apN));
console.log('  zones proposées à « Mercure » :', cN.map(c => c.zone + (c.cochee ? '✓' : '')).join(', '));
verdict(avN.etiquettes.every((e, i) =>
    JSON.stringify(e.vise.filter(z => z !== 'Gazeuses')) === JSON.stringify(apN.etiquettes[i].vise)),
    'les autres étiquettes visent EXACTEMENT la même zone qu’avant', 'des affectations ont glissé');
verdict(JSON.stringify(cN.map(c => c.zone)) === JSON.stringify(['Telluriques', 'Glacées']),
    'liste des zones à jour', 'liste des zones périmée');
const sN = await enregistrer(p);
console.log('  enregistrement :', sN.ok ? 'PASSE' : 'BLOQUÉ →\n' + sN.resume.split('\n').map(l => '      ' + l).join('\n'));
verdict(!sN.ok && /Diapositive 13 › Exercice › Élément 5/.test(sN.resume),
    'le signalement porte le fil d’Ariane complet (Diapositive › Exercice › Élément)',
    'fil d’Ariane absent du signalement');

titre('DÉPLACER la zone 1 vers le bas (clavier, poignée de tri)');
await prepN();
const avN2 = await lireN();
console.log('  ', await deplacerAuClavier(p, ANCRE_Z(0), 'ArrowDown'));
const apN2 = await lireN();
console.log('  ordre des zones :', JSON.stringify(avN2.zones), '→', JSON.stringify(apN2.zones));
verdict(JSON.stringify(avN2.zones) !== JSON.stringify(apN2.zones), 'ordre RÉELLEMENT modifié', 'rien déplacé : test non concluant');
verdict(JSON.stringify(avN2.etiquettes.map(e => e.vise)) === JSON.stringify(apN2.etiquettes.map(e => e.vise)),
    'aucune étiquette n’a changé de zone', 'des étiquettes ont changé de zone');
console.log('  cases « Mercure » :', (await p.evaluate(c => window.__dd.casesZones(c), CASES_N)).map(c => c.zone + (c.cochee ? '✓' : '')).join(', '));
console.log('  enregistrement :', (await enregistrer(p)).ok ? 'PASSE' : 'BLOQUÉ');

titre('DUPLIQUER la zone 2');
await prepN();
const avN3 = await lireN();
console.log('  ', await boutonItemImbrique(p, ANCRE_Z(1), 'Dupliquer'));
const apN3 = await lireN();
console.log('  ordre des zones :', JSON.stringify(avN3.zones), '→', JSON.stringify(apN3.zones));
verdict(apN3.zones.length === avN3.zones.length + 1, 'zone RÉELLEMENT dupliquée', 'rien dupliqué : test non concluant');
verdict(JSON.stringify(avN3.etiquettes.map(e => e.vise)) === JSON.stringify(apN3.etiquettes.map(e => e.vise)),
    'aucune étiquette n’a changé de zone', 'des étiquettes ont changé de zone');
console.log('  enregistrement :', (await enregistrer(p)).ok ? 'PASSE' : 'BLOQUÉ');

await b.close();
console.log(`\n${rouge === 0 ? '✅ scénario (b) conforme' : `❌ ${rouge} contrôle(s) en échec`}`);
process.exit(rouge === 0 ? 0 : 1);
