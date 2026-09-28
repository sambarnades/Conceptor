/**
 * (i) Caramelia suit le drapeau de Caramel.
 *
 * Bug d'origine : recharger la locale ne repeignait que le CHÂSSIS du panneau
 * (aria-labels, title, placeholder — `dom.js#refreshWidgetLabels`). Or les seuls
 * textes VISIBLES sont les bulles et leurs boutons de réponse rapide, peints une
 * fois pour toutes par `addBotMessage()`. Et `showWelcome()` est gardé par
 * `if (!state.history.length)` dans `index.js#toggle`. Conséquence : dès que le
 * panneau avait été ouvert UNE fois, changer de drapeau laissait Caramelia en
 * français — indéfiniment, y compris après réouverture.
 *
 * Correctif : `index.js#applyLanguageChange()`, appelé par le poller de
 * `watchLanguageChanges()` ET par `toggle()`. Il repeint le châssis puis, si la
 * conversation n'a pas commencé, rejoue `resetConversation()` pour réafficher
 * l'accueil dans la nouvelle langue. Une conversation ENGAGÉE est un historique :
 * on ne la réécrit pas — c'est le sens de la section D.
 *
 * Pourquoi ici et pas dans la suite navigateur : la suite mute par les exports
 * `__testing` et ne clique pas. Ce scénario emprunte l'autre moitié du chemin —
 * vrai sélecteur de langue, vrai FAB, vrai `MutationObserver`, vrai fetch de
 * `js/caramelia/locales/*.json`.
 *
 * Prérequis : `python3 tests/serveur-statique.py 8010` à la RACINE du dépôt.
 * Usage     : node tests/qa-manuel/i-langue-caramelia.mjs
 *             node tests/qa-manuel/i-langue-caramelia.mjs --contre-epreuve
 *
 * La contre-épreuve DÉSARME le correctif (remplacement littéral dans
 * `js/caramelia/index.js`, restauré ensuite par snapshot) et exige le ROUGE.
 */
import { chromium } from '../roundtrip/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE = path.join(RACINE, 'js/caramelia/index.js');
const URL_APP = 'http://localhost:8010/index.html?debug';
const CONTRE = process.argv.includes('--contre-epreuve');

// ── Désarmement (contre-épreuve) ───────────────────────────────────────────────
let instantane = null;
if (CONTRE) {
    instantane = fs.readFileSync(SOURCE, 'utf8');
    if (!instantane.includes('applyLanguageChange();')) {
        console.error('!! `applyLanguageChange();` introuvable — le correctif a-t-il changé de nom ?');
        process.exit(2);
    }
    fs.writeFileSync(SOURCE, instantane.split('applyLanguageChange();').join('refreshWidgetLabels();'));
    console.log('### CONTRE-ÉPREUVE — correctif désarmé, on attend le ROUGE');
}
const restaurer = () => { if (instantane) fs.writeFileSync(SOURCE, instantane); };
process.on('exit', restaurer);
process.on('SIGINT', () => { restaurer(); process.exit(130); });

// ── Outillage ──────────────────────────────────────────────────────────────────
const norm = s => String(s).replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1400, height: 900 } });
p.on('pageerror', e => console.log('  [pageerror]', String(e).slice(0, 160)));

const lire = () => p.evaluate(() => ({
    bulle:   document.querySelector('.caramelia-msg__bubble')?.textContent ?? '',
    boutons: [...document.querySelectorAll('.caramelia-quick-btn')].map(e => e.textContent.trim()),
    ph:      document.querySelector('.caramelia-input')?.placeholder ?? '(introuvable)',
    n:       window.Caramelia.state.history.length,
    lang:    document.documentElement.lang,
}));

// Clic DOM direct : en section C le panneau ouvert RECOUVRE le sélecteur de langue.
// Un clic physique y serait intercepté par le panneau ; `.click()` sur l'élément
// exécute le vrai handler sans dépendre de la superposition.
const changer = async l => {
    await p.evaluate(code => {
        document.querySelector('.language-btn').click();
        document.querySelector(`[data-lang="${code}"]`).click();
    }, l);
    await p.waitForTimeout(2500);   // laisser le poller 2 s de watchLanguageChanges() passer
};
const demarrer = async () => {
    await p.goto(URL_APP);
    await p.waitForFunction(() => !!window.Caramelia, null, { timeout: 15000 });
    await p.waitForTimeout(900);
};

let ko = 0;
const ok = (nom, cond, det = '') => {
    console.log(`  ${cond ? '✅' : '❌'} ${nom}${det ? '  → ' + det : ''}`);
    if (!cond) ko++;
};

// Attendus lus dans les locales Caramelia elles-mêmes (pas de libellé en dur ici).
// Première ligne seulement : le `\n` du message est rendu en <br>, que textContent
// aplatit SANS espace — comparer le message entier ferait un faux rouge.
const attendu = {};
for (const l of ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br']) {
    const j = await (await fetch(`http://localhost:8010/js/caramelia/locales/${l}.json`)).json();
    attendu[l] = { welcome: norm(j.welcome_message.split('\n')[0]), ph: j.ui_input_placeholder, aide: j.welcome_btn_help };
}

// ── A. drapeau changé, panneau JAMAIS ouvert (chemin qui marchait déjà) ────────
console.log('\n── A. drapeau changé, panneau jamais ouvert ──');
for (const l of ['en', 'br', 'ar', 'jp']) {
    await demarrer();
    await changer(l);
    await p.evaluate(() => window.Caramelia.open());
    await p.waitForTimeout(700);
    const r = await lire();
    ok(`${l} bulle`, norm(r.bulle).startsWith(attendu[l].welcome), norm(r.bulle).slice(0, 34) + '…');
    ok(`${l} placeholder`, r.ph === attendu[l].ph);
}

// ── B. le cas du bug : ouvert en fr, fermé, drapeau changé, rouvert ───────────
console.log('\n── B. ouvert en fr, fermé, drapeau changé, rouvert ──');
for (const l of ['en', 'br', 'el']) {
    await demarrer();
    await p.evaluate(() => window.Caramelia.open());
    await p.waitForTimeout(600);
    await p.evaluate(() => window.Caramelia.close());
    await p.waitForTimeout(300);
    await changer(l);
    await p.evaluate(() => window.Caramelia.open());
    await p.waitForTimeout(700);
    const r = await lire();
    ok(`${l} bulle repeinte`, norm(r.bulle).startsWith(attendu[l].welcome), norm(r.bulle).slice(0, 34) + '…');
    ok(`${l} boutons repeints`, r.boutons[0] === attendu[l].aide, r.boutons.join(' | '));
}

// ── C. drapeau changé PENDANT que le panneau est ouvert ───────────────────────
console.log('\n── C. drapeau changé pendant que le panneau est ouvert ──');
await demarrer();
await p.evaluate(() => window.Caramelia.open());
await p.waitForTimeout(600);
await changer('br');
const rc = await lire();
ok('langue Caramel passée à br', rc.lang === 'br', `<html lang="${rc.lang}">`);
ok('bulle repeinte sans refermer', norm(rc.bulle).startsWith(attendu.br.welcome), norm(rc.bulle).slice(0, 34) + '…');

// ── D. conversation ENGAGÉE : on ne réécrit pas un historique ─────────────────
console.log('\n── D. conversation engagée : historique préservé, châssis suivi ──');
await demarrer();
await p.evaluate(() => window.Caramelia.open());
await p.waitForTimeout(600);
await p.click('.caramelia-quick-btn');      // « Aide sur le site » → currentFlow = 'help'
await p.waitForTimeout(900);
const avant = await lire();
await changer('en');
const apres = await lire();
ok('historique NON détruit', apres.n === avant.n && apres.n > 1, `history ${avant.n} → ${apres.n}`);
ok('transcript laissé en l\'état', norm(apres.bulle).startsWith(attendu.fr.welcome), norm(apres.bulle).slice(0, 30) + '…');
ok('châssis suit la langue', apres.ph === attendu.en.ph, `«${apres.ph}»`);

await nav.close();

// ── Verdict ───────────────────────────────────────────────────────────────────
if (CONTRE) {
    // B et C sont les sections que le correctif fait vivre ; A et D sont vertes sans lui.
    console.log(ko ? `\n✅ ROUGE attendu — ${ko} échec(s), correctif bien couvert` : '\n❌ VERT alors que désarmé — le correctif n\'est PAS couvert');
    process.exit(ko ? 0 : 1);
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\n✅ TOUT VERT');
process.exit(ko ? 1 : 0);
