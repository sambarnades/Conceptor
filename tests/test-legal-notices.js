/**
 * @file Mentions légales — conformité des crédits de bibliothèques tierces.
 *
 * CLAUDE.md pose la règle depuis longtemps : « Toute nouvelle lib vendor doit être
 * inscrite dans les mentions légales ». Rien ne la vérifiait. Trois bibliothèques
 * embarquées et effectivement chargées y avaient échappé (audit 2026-07) :
 * `qrcode-generator`, les 221 types de contenu `js/vendor/h5p-libs/`, et `flag-icons`.
 *
 * Pour une application du service public, un crédit de licence manquant est un
 * manquement — et le trou se rouvre à chaque nouvelle dépendance tant qu'un test ne
 * tient pas la règle. Cette suite la tient, dans les deux sens :
 *
 *   · toute bibliothèque de l'inventaire est créditée, dans le HTML **et** dans les
 *     11 langues, avec un texte non vide qui nomme une licence ;
 *   · toute clé `legal_library_*` du HTML correspond à quelque chose de réel — pas
 *     de crédit fantôme pour une lib retirée depuis ;
 *   · tout chemin `js/vendor/<dossier>/` réellement chargé par `LIB_PATHS` figure à
 *     l'inventaire : ajouter une lib au chargeur sans la créditer échoue ici.
 *
 * Le contrôle du DISQUE (un dossier `js/vendor/` ajouté sans même être câblé) n'est
 * pas faisable depuis le navigateur : il vit dans `tests/run_legal_notices.mjs`.
 */

import { LIB_PATHS } from '../js/core/lib-loader.js';
import {
    VENDOR_JS_A_MENTION,
    VENDOR_CSS_A_MENTION,
    MENTIONS_SANS_FICHIER,
    clesAttendues
} from './vendor-legal-map.js';

// ============================================================================
// ÉTAT DES TESTS
// ============================================================================

let passCount = 0;
let failCount = 0;
const results = [];
let _ctx = { step: 0, stepName: '' };

function assert(condition, message, diagnostic = null) {
    const entry = { status: condition ? 'PASS' : 'FAIL', message, step: _ctx.step, stepName: _ctx.stepName };
    if (!condition) { entry.diagnostic = diagnostic; failCount++; }
    else passCount++;
    results.push(entry);
}
function beginStep(n, name) { _ctx = { step: n, stepName: name }; }
function endStep() { _ctx = { step: 0, stepName: '' }; }

export const STEP_NAMES = {
    1: 'Le HTML des mentions légales déclare chaque bibliothèque',
    2: 'Les 11 langues traduisent chaque crédit',
    3: 'Aucun crédit fantôme, aucune lib chargée sans crédit',
    4: 'Qualité rédactionnelle des crédits'
};

export const STEP_DESCRIPTIONS = {
    1: 'Chaque entrée de l\'inventaire a son <li data-translate="legal_library_…">.',
    2: 'Chaque clé existe et est non vide dans fr, en, es, de, it, nl, pt, ar, zh, jp, el.',
    3: 'Sens inverse : pas de clé orpheline, et tout chemin js/vendor/ de LIB_PATHS est inventorié.',
    4: 'Chaque crédit nomme la bibliothèque (<strong>) et sa licence.'
};

const BASE = new URL('../', new URL(import.meta.url)).href;
const LANGUES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];

async function lireTexte(chemin) {
    const r = await fetch(BASE + chemin);
    if (!r.ok) throw new Error(`HTTP ${r.status} sur ${chemin}`);
    return r.text();
}
async function lireJson(chemin) {
    const r = await fetch(BASE + chemin);
    if (!r.ok) throw new Error(`HTTP ${r.status} sur ${chemin}`);
    return r.json();
}

let htmlMentions = '';
let clesDuHtml = [];
const locales = {};

// ============================================================================
// ÉTAPE 1 — Le HTML déclare chaque bibliothèque
// ============================================================================

async function runStep1_Html() {
    beginStep(1, STEP_NAMES[1]);

    try {
        htmlMentions = await lireTexte('assets/templates/mentions-legales.html');
    } catch (e) {
        assert(false, '[1.0] assets/templates/mentions-legales.html est lisible', e.message);
        endStep(); return;
    }

    clesDuHtml = [...htmlMentions.matchAll(/data-translate="(legal_library_[a-z0-9_]+)"/g)]
        .map(m => m[1]);

    assert(clesDuHtml.length > 0, '[1.1] Le document déclare des crédits de bibliothèques',
        clesDuHtml.length);
    assert(new Set(clesDuHtml).size === clesDuHtml.length,
        '[1.2] Aucun crédit déclaré deux fois',
        clesDuHtml.filter((c, i) => clesDuHtml.indexOf(c) !== i));

    const presentes = new Set(clesDuHtml);

    for (const { dossier, cle } of VENDOR_JS_A_MENTION) {
        assert(presentes.has(cle),
            `[1.3] js/vendor/${dossier}/ est crédité (${cle})`,
            {
                dossier,
                cle,
                correction: `ajouter <li data-translate="${cle}"></li> dans assets/templates/mentions-legales.html`
            });
    }

    for (const { fichier, cle } of VENDOR_CSS_A_MENTION) {
        assert(presentes.has(cle),
            `[1.4] css/vendor/${fichier} est crédité (${cle})`,
            { fichier, cle });
    }

    for (const { cle, raison } of MENTIONS_SANS_FICHIER) {
        assert(presentes.has(cle),
            `[1.5] Le crédit hors-fichier ${cle} est déclaré (${raison})`, cle);
    }

    // Les crédits sont rendus dans une liste : un <li> orphelin hors de la liste ne
    // serait jamais affiché. On analyse le vrai DOM plutôt qu'une regex — le fragment
    // est du HTML, pas du texte.
    const doc = new DOMParser().parseFromString(htmlMentions, 'text/html');
    const titre = doc.querySelector('[data-translate="legal_external_libraries_title"]');
    assert(!!titre, '[1.6] Le bloc « bibliothèques externes » est présent');

    const section = titre ? titre.closest('.legal-section') : null;
    assert(!!section, '[1.7] Le bloc est bien une .legal-section');

    if (section) {
        const dansListe = new Set(
            [...section.querySelectorAll('ul li[data-translate]')]
                .map(li => li.getAttribute('data-translate'))
                .filter(c => c.startsWith('legal_library_'))
        );
        // `legal_library_ownership` est volontairement un <p> de clôture, hors liste.
        const horsListe = clesDuHtml.filter(c => !dansListe.has(c) && c !== 'legal_library_ownership');
        assert(horsListe.length === 0,
            '[1.8] Tous les crédits de bibliothèque sont dans la liste affichée', horsListe);

        assert(dansListe.size === clesDuHtml.length - 1,
            `[1.9] La liste rend les ${clesDuHtml.length - 1} crédits déclarés`,
            { dansListe: dansListe.size, declares: clesDuHtml.length - 1 });

        const ordonnees = [...dansListe];
        const trie = [...dansListe].sort();
        assert(JSON.stringify(ordonnees) === JSON.stringify(trie),
            '[1.10] Les crédits sont listés par ordre alphabétique (lecture et diff plus simples)',
            { obtenu: ordonnees, attendu: trie });
    }

    endStep();
}

// ============================================================================
// ÉTAPE 2 — Les 11 langues
// ============================================================================

async function runStep2_Locales() {
    beginStep(2, STEP_NAMES[2]);

    for (const lang of LANGUES) {
        try {
            locales[lang] = await lireJson(`js/locales/${lang}.json`);
        } catch (e) {
            assert(false, `[2.0] js/locales/${lang}.json est lisible`, e.message);
        }
    }

    const attendues = clesAttendues();

    for (const cle of attendues) {
        const manquantes = LANGUES.filter(l => !locales[l] || !(cle in locales[l]));
        assert(manquantes.length === 0,
            `[2.1] ${cle} est traduit dans les 11 langues`,
            {
                cle,
                manquantes,
                consequence: 'la clé s\'afficherait BRUTE à l\'utilisateur (t() renvoie la clé quand elle manque)'
            });

        const vides = LANGUES.filter(l => locales[l] && typeof locales[l][cle] === 'string'
            && locales[l][cle].trim() === '');
        assert(vides.length === 0, `[2.2] ${cle} n'est vide dans aucune langue`, vides);
    }

    // Parité globale : un ajout dans une seule langue est la panne classique.
    const tailles = LANGUES.map(l => ({ lang: l, n: locales[l] ? Object.keys(locales[l]).length : -1 }));
    const reference = tailles[0].n;
    const divergentes = tailles.filter(t => t.n !== reference);
    assert(divergentes.length === 0,
        `[2.3] Les 11 locales portent le même nombre de clés (${reference})`, divergentes);

    // Une traduction copiée-collée du français dans TOUTES les langues signalerait un
    // oubli de traduction. On tolère l'identité sur les langues latines proches, mais
    // pas une identité universelle sur les 11.
    for (const cle of attendues) {
        const fr = locales.fr && locales.fr[cle];
        if (typeof fr !== 'string') continue;
        const identiques = LANGUES.filter(l => l !== 'fr' && locales[l] && locales[l][cle] === fr);
        assert(identiques.length < LANGUES.length - 1,
            `[2.4] ${cle} n'est pas le texte français recopié dans les 10 autres langues`,
            identiques);
    }

    endStep();
}

// ============================================================================
// ÉTAPE 3 — Sens inverse
// ============================================================================

function runStep3_SensInverse() {
    beginStep(3, STEP_NAMES[3]);

    const attendues = new Set(clesAttendues());

    // 3.1 — Pas de crédit fantôme : une clé du HTML sans rien de réel derrière.
    for (const cle of clesDuHtml) {
        assert(attendues.has(cle),
            `[3.1] Le crédit ${cle} correspond à une bibliothèque inventoriée`,
            {
                cle,
                correction: 'soit la lib a été retirée (supprimer le <li> et les 11 clés), '
                    + 'soit elle manque à tests/vendor-legal-map.js'
            });
    }

    // 3.2 — Pas d'entrée d'inventaire oubliée dans le HTML (miroir de 1.3/1.4/1.5,
    // formulé globalement pour donner la liste d'un coup au diagnostic).
    const presentes = new Set(clesDuHtml);
    const absentes = [...attendues].filter(c => !presentes.has(c));
    assert(absentes.length === 0,
        '[3.2] Aucune entrée de l\'inventaire n\'est absente du HTML', absentes);

    // 3.3 — Tout chemin js/vendor/<dossier>/ réellement chargé est inventorié.
    // C'est le contrôle qui aurait attrapé `qrcode` le jour de son ajout.
    const dossiersInventories = new Set(VENDOR_JS_A_MENTION.map(e => e.dossier));
    const dossiersCharges = new Set();
    for (const chemin of Object.values(LIB_PATHS)) {
        const m = String(chemin).match(/^js\/vendor\/([^/]+)/);
        if (m) dossiersCharges.add(m[1]);
    }

    assert(dossiersCharges.size > 0, '[3.3] Des chemins js/vendor/ ont été trouvés dans LIB_PATHS',
        dossiersCharges.size);

    for (const dossier of [...dossiersCharges].sort()) {
        assert(dossiersInventories.has(dossier),
            `[3.4] js/vendor/${dossier}/ (chargé par LIB_PATHS) figure à l'inventaire`,
            {
                dossier,
                correction: 'ajouter { dossier, cle } dans tests/vendor-legal-map.js, '
                    + 'puis le <li> et les 11 clés de traduction'
            });
    }

    // 3.5 — L'inverse n'est PAS une erreur : `mathjax-2` et `h5p-libs` sont chargés
    // hors LIB_PATHS (h5p-manager.js). On se contente de le tracer.
    const inventoriesNonCharges = [...dossiersInventories].filter(d => !dossiersCharges.has(d));
    assert(true,
        `[3.5] ${inventoriesNonCharges.length} dossier(s) inventorié(s) hors LIB_PATHS (chargement direct)`,
        inventoriesNonCharges);

    endStep();
}

// ============================================================================
// ÉTAPE 4 — Qualité rédactionnelle
// ============================================================================

function runStep4_Redaction() {
    beginStep(4, STEP_NAMES[4]);

    // Les crédits hors-fichier (propriété des marques, TTS serveur) ne suivent pas
    // le gabarit « <strong>Nom</strong> (Licence : X) : usage ».
    const cleSansFichier = new Set(MENTIONS_SANS_FICHIER.map(e => e.cle));
    const clesLib = clesAttendues().filter(c => !cleSansFichier.has(c));

    for (const cle of clesLib) {
        const fr = locales.fr && locales.fr[cle];
        if (typeof fr !== 'string') continue;   // déjà signalé à l'étape 2

        assert(/<strong>[^<]+<\/strong>/.test(fr),
            `[4.1] ${cle} nomme la bibliothèque en <strong>`, fr.slice(0, 80));

        // Nommer la licence est l'objet même de la mention légale.
        assert(/licence|license|licenc/i.test(fr),
            `[4.2] ${cle} nomme la licence`, fr.slice(0, 120));

        assert(fr.length >= 40,
            `[4.3] ${cle} décrit l'usage fait de la bibliothèque (pas un simple nom)`,
            { longueur: fr.length, texte: fr });
    }

    // Le HTML des crédits est injecté : les balises doivent rester équilibrées dans
    // TOUTES les langues, sinon la page des mentions légales se disloque.
    for (const lang of LANGUES) {
        if (!locales[lang]) continue;
        for (const cle of clesLib) {
            const v = locales[lang][cle];
            if (typeof v !== 'string') continue;
            const ouvrantes = (v.match(/<strong>/g) || []).length;
            const fermantes = (v.match(/<\/strong>/g) || []).length;
            assert(ouvrantes === fermantes,
                `[4.4] ${lang}/${cle} : balises <strong> équilibrées`,
                { ouvrantes, fermantes, texte: v.slice(0, 100) });
        }
    }

    endStep();
}

// ============================================================================
// RUNNER
// ============================================================================

export async function runAllTests() {
    passCount = 0;
    failCount = 0;
    results.length = 0;

    console.log('=== Mentions légales (crédits de bibliothèques) ===');

    await runStep1_Html();
    await runStep2_Locales();
    runStep3_SensInverse();
    runStep4_Redaction();

    console.log(`\n=== Résultat : ${passCount} PASS / ${failCount} FAIL ===`);

    return { passCount, failCount, results, STEP_NAMES, STEP_DESCRIPTIONS };
}
