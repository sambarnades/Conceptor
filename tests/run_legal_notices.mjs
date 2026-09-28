/**
 * run_legal_notices.mjs — Conformité des mentions légales, côté DISQUE.
 *
 * Complément Node de `tests/test-legal-notices.js` (navigateur). Le navigateur ne peut
 * pas lister un répertoire : il vérifie donc l'inventaire contre ce qui est *câblé*
 * (LIB_PATHS, le HTML, les 12 locales). Le seul contrôle qu'il ne peut pas faire est
 * aussi le plus important : **un dossier `js/vendor/` posé sur le disque sans être
 * inventorié nulle part**. C'est exactement la façon dont `qrcode-generator` est resté
 * non crédité — le fichier était là, chargé, et rien ne le réclamait.
 *
 * Contrôles :
 *   1. tout répertoire de `js/vendor/` est inventorié ;
 *   2. tout fichier de `css/vendor/` est inventorié ;
 *   2 bis. tout fichier d'`assets/images/flags/` est inventorié — les ressources
 *      tierces hors vendor (le Gwenn ha du vient de Wikimedia Commons) avaient le
 *      même angle mort que les dossiers vendor : présentes, servies, non créditées ;
 *   3. tout répertoire ou fichier inventorié existe réellement (pas d'entrée périmée) ;
 *   4. les licences déclarées dans `js/vendor/h5p-libs/ * /library.json` sont bien
 *      couvertes par le texte du crédit `legal_library_h5p_content_types`.
 *
 * Lancement : node tests/run_legal_notices.mjs
 * Sortie    : 0 conforme, 1 non conforme, 2 erreur d'exécution.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import {
    VENDOR_JS_A_MENTION,
    VENDOR_CSS_A_MENTION,
    ASSETS_A_MENTION,
    clesAttendues
} from './vendor-legal-map.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LANGUES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];

let echecs = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const ko = (m, detail) => {
    echecs++;
    console.log(`  ❌ ${m}`);
    if (detail) console.log(`     ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
};

async function main() {
    console.log('=== Mentions légales — contrôle sur disque ===\n');

    // ---------------------------------------------------------------- 1
    console.log('1. Répertoires js/vendor/');
    const dossiersDisque = (await readdir(join(ROOT, 'js/vendor'), { withFileTypes: true }))
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();
    const inventoriesJs = new Set(VENDOR_JS_A_MENTION.map(e => e.dossier));

    const nonInventories = dossiersDisque.filter(d => !inventoriesJs.has(d));
    if (nonInventories.length === 0) {
        ok(`${dossiersDisque.length} répertoires, tous inventoriés`);
    } else {
        ko(`${nonInventories.length} répertoire(s) vendor sans mention légale`, {
            dossiers: nonInventories,
            correction: 'ajouter { dossier, cle } dans tests/vendor-legal-map.js, le <li> dans '
                + 'assets/templates/mentions-legales.html, et la clé dans les 11 js/locales/*.json'
        });
    }

    // ---------------------------------------------------------------- 2
    console.log('\n2. Feuilles de style css/vendor/');
    // Deux formes cohabitent : fichiers .css posés à la racine (historique) et
    // dossiers versionnés `<lib>/<version>/…` (depuis FA 7.3.1 / flag-icons 7.5.0).
    // Un dossier est couvert si AU MOINS une entrée de l'inventaire pointe dedans —
    // sans ce balayage, un dossier posé sans câblage serait invisible du contrôle.
    const entreesCss = (await readdir(join(ROOT, 'css/vendor'), { withFileTypes: true }));
    const cssDisque = entreesCss.filter(e => e.isFile() && e.name.endsWith('.css')).map(e => e.name).sort();
    const dossiersCss = entreesCss.filter(e => e.isDirectory()).map(e => e.name).sort();
    const inventoriesCss = new Set(VENDOR_CSS_A_MENTION.map(e => e.fichier));
    const racinesInventoriees = new Set(
        VENDOR_CSS_A_MENTION.filter(e => e.fichier.includes('/')).map(e => e.fichier.split('/')[0])
    );
    const cssNonInventories = cssDisque.filter(f => !inventoriesCss.has(f));
    const dossiersNonInventories = dossiersCss.filter(d => !racinesInventoriees.has(d));
    if (cssNonInventories.length === 0 && dossiersNonInventories.length === 0) {
        ok(`${cssDisque.length} feuille(s) racine + ${dossiersCss.length} dossier(s) versionné(s), tous inventoriés`);
    } else {
        ko('Élément(s) css/vendor/ sans mention légale',
            { fichiers: cssNonInventories, dossiers: dossiersNonInventories });
    }

    // ---------------------------------------------------------------- 2 bis
    // `assets/images/flags/` est le SEUL répertoire d'assets contenant aujourd'hui des
    // ressources tierces. Le balayer permet de voir un drapeau déposé sans crédit —
    // impossible depuis le navigateur, qui ne sait pas lister un répertoire.
    console.log('\n2 bis. Ressources tierces d\'assets/');
    // Les dossiers d'assets/ qui reçoivent des ressources tierces : chaque
    // fichier qu'ils contiennent doit être couvert — par une entrée `fichier`
    // à son nom, ou par une entrée `dossier` qui crédite le dossier entier.
    const DOSSIERS_TIERS = ['images/flags', ...ASSETS_A_MENTION.filter(e => e.dossier).map(e => e.dossier)];
    for (const dossier of [...new Set(DOSSIERS_TIERS)]) {
        const chemin = join(ROOT, 'assets', dossier);
        if (!existsSync(chemin)) { ok(`assets/${dossier}/ absent — rien à inventorier`); continue; }
        const surDisque = (await readdir(chemin, { withFileTypes: true }))
            .filter(e => e.isFile() && !e.name.startsWith('.'))
            .map(e => `${dossier}/${e.name}`)
            .sort();
        const parFichier = new Set(ASSETS_A_MENTION.filter(e => e.fichier).map(e => e.fichier));
        const parDossier = new Set(ASSETS_A_MENTION.filter(e => e.dossier).map(e => e.dossier));
        const nonInventories = surDisque.filter(f => !parFichier.has(f) && !parDossier.has(dossier));
        if (nonInventories.length === 0) {
            ok(`${surDisque.length} ressource(s) dans assets/${dossier}/, toutes inventoriées`);
        } else {
            ko(`${nonInventories.length} ressource(s) tierce(s) sans mention légale`, {
                fichiers: nonInventories,
                correction: 'ajouter { fichier, cle } ou { dossier, cle } dans ASSETS_A_MENTION (tests/vendor-legal-map.js), '
                    + 'le <li> dans assets/templates/mentions-legales.html, et la clé dans les 12 js/locales/*.json'
            });
        }
    }

    // ---------------------------------------------------------------- 3
    console.log('\n3. Entrées d\'inventaire périmées');
    const perimesJs = VENDOR_JS_A_MENTION
        .filter(e => !existsSync(join(ROOT, 'js/vendor', e.dossier)))
        .map(e => e.dossier);
    const perimesCss = VENDOR_CSS_A_MENTION
        .filter(e => !existsSync(join(ROOT, 'css/vendor', e.fichier)))
        .map(e => e.fichier);
    const perimesAssets = ASSETS_A_MENTION
        .filter(e => !existsSync(join(ROOT, 'assets', e.fichier || e.dossier)))
        .map(e => e.fichier || e.dossier);
    if (perimesJs.length === 0 && perimesCss.length === 0 && perimesAssets.length === 0) {
        ok('Aucune entrée ne pointe un fichier absent');
    } else {
        ko('Entrée(s) d\'inventaire pointant un fichier absent',
            { js: perimesJs, css: perimesCss, assets: perimesAssets });
    }

    // ---------------------------------------------------------------- 4
    console.log(`\n4. HTML et ${LANGUES.length} locales`);
    const html = await readFile(join(ROOT, 'assets/templates/mentions-legales.html'), 'utf8');
    const clesHtml = new Set(
        [...html.matchAll(/data-translate="(legal_library_[a-z0-9_]+)"/g)].map(m => m[1])
    );
    const attendues = clesAttendues();

    const absentesHtml = attendues.filter(c => !clesHtml.has(c));
    if (absentesHtml.length === 0) ok(`${attendues.length} crédits déclarés dans le HTML`);
    else ko('Crédit(s) manquant(s) dans le HTML', absentesHtml);

    const fantomes = [...clesHtml].filter(c => !attendues.includes(c));
    if (fantomes.length === 0) ok('Aucun crédit fantôme');
    else ko('Crédit(s) sans bibliothèque correspondante', fantomes);

    const locales = {};
    for (const lang of LANGUES) {
        locales[lang] = JSON.parse(await readFile(join(ROOT, `js/locales/${lang}.json`), 'utf8'));
    }
    const trous = [];
    for (const cle of attendues) {
        for (const lang of LANGUES) {
            const v = locales[lang][cle];
            if (typeof v !== 'string' || !v.trim()) trous.push(`${lang}/${cle}`);
        }
    }
    if (trous.length === 0) ok(`${attendues.length} crédits × ${LANGUES.length} langues, aucun trou`);
    else ko(`${trous.length} traduction(s) manquante(s) ou vide(s)`, trous.slice(0, 20));

    // ---------------------------------------------------------------- 5
    console.log('\n5. Licences réelles des bibliothèques H5P');
    const h5pDir = join(ROOT, 'js/vendor/h5p-libs');
    const libs = (await readdir(h5pDir, { withFileTypes: true })).filter(d => d.isDirectory());
    const licences = new Map();
    for (const lib of libs) {
        try {
            const meta = JSON.parse(await readFile(join(h5pDir, lib.name, 'library.json'), 'utf8'));
            const l = String(meta.license || '(non déclarée)').toUpperCase();
            licences.set(l, (licences.get(l) || 0) + 1);
        } catch {
            licences.set('(sans library.json)', (licences.get('(sans library.json)') || 0) + 1);
        }
    }
    const repartition = [...licences.entries()].sort((a, b) => b[1] - a[1]);
    console.log('   Répartition : ' + repartition.map(([l, n]) => `${l}×${n}`).join(', '));

    // Le crédit doit citer les familles de licences effectivement présentes. Le code
    // déclaré dans library.json (`pd`, `MPL2`, `GPL3`…) n'apparaît PAS littéralement
    // dans un texte rédigé (« domaine public ») : la correspondance est donc explicite
    // plutôt que devinée par sous-chaîne. Ajouter une famille ici quand H5P en
    // introduit une nouvelle.
    const RECONNAISSANCE_LICENCE = {
        MIT: /\bMIT\b/i,
        MPL: /\bMPL\b/i,
        MPL2: /\bMPL\b/i,
        GPL3: /\bGPL\b/i,
        GPL: /\bGPL\b/i,
        PD: /domaine public/i,
        CC0: /\bCC0\b|domaine public/i,
        'CC BY': /\bCC[\s-]?BY\b/i,
        'CC BY-SA': /\bCC[\s-]?BY[\s-]?SA\b/i
    };

    const texteFr = locales.fr.legal_library_h5p_content_types || '';
    const familles = [...licences.keys()].filter(l => !l.startsWith('('));

    const inconnues = familles.filter(l => !(l in RECONNAISSANCE_LICENCE));
    if (inconnues.length === 0) {
        ok(`${familles.length} famille(s) de licence, toutes connues du contrôle`);
    } else {
        ko('Famille(s) de licence non prévues par le contrôle', {
            inconnues,
            correction: 'ajouter l\'entrée dans RECONNAISSANCE_LICENCE (tests/run_legal_notices.mjs) '
                + 'puis citer la licence dans legal_library_h5p_content_types (12 locales)'
        });
    }

    const nonCitees = familles.filter(l => {
        const motif = RECONNAISSANCE_LICENCE[l];
        return motif && !motif.test(texteFr);
    });
    if (nonCitees.length === 0) {
        ok('Le crédit cite toutes les familles de licence présentes');
    } else {
        ko('Licence(s) présentes sur disque mais absentes du texte du crédit', {
            nonCitees,
            texte: texteFr.slice(0, 200)
        });
    }

    // 50 bibliothèques ne déclarent aucune licence dans leur library.json. Ce n'est pas
    // une non-conformité de Caramel (le champ est facultatif côté H5P) mais le chiffre
    // doit rester visible : il justifie la formulation « selon la bibliothèque ».
    const sansDeclaration = licences.get('(NON DÉCLARÉE)') || licences.get('(sans library.json)') || 0;
    if (sansDeclaration) {
        console.log(`   ℹ ${sansDeclaration} bibliothèque(s) sans licence déclarée dans library.json `
            + '(champ facultatif côté H5P — couvert par la formulation « selon la bibliothèque »)');
    }

    // ---------------------------------------------------------------- bilan
    console.log('\n========================================');
    if (echecs === 0) {
        console.log('✅ Mentions légales conformes.');
    } else {
        console.log(`❌ ${echecs} non-conformité(s).`);
    }
    console.log('========================================');
    process.exit(echecs > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('FATAL', e);
    process.exit(2);
});
