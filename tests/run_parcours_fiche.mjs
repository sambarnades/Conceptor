/**
 * run_parcours_fiche.mjs — La fiche de séquence et le détail des activités.
 *
 * Banc mixte, et c'est voulu :
 *
 *  - **En Node**, la partie qui compte : `construireFiche()` est pure, on peut
 *    donc lire ce que le document DIRA sans jamais l'ouvrir — titres, tableaux,
 *    ordre des blocs. Vérifier un DOCX en dépliant son ZIP dirait moins, et
 *    beaucoup plus lentement.
 *  - **En Chromium**, ce que Node ne peut pas voir : que le formateur partagé
 *    (`document-formatter.js`) accepte la structure et la rende en sections
 *    documentaires valides. C'est le contrat entre les deux dépôts, et il
 *    casserait en silence.
 *
 * Ce que ce banc protège :
 *
 *  1. **Les deux documents ne se confondent pas.** La fiche est le PLAN (une
 *     page, un tableau par étape) ; le détail est le CONTENU. Un enseignant qui
 *     demande sa fiche et reçoit trente pages d'énoncés ne l'imprimera pas.
 *  2. **Aucune clé i18n nouvelle dans le fichier partagé.** La structure porte
 *     ses libellés ; c'est ce qui évite d'avoir à traduire le vocabulaire du
 *     parcours dans un dépôt qui n'en produit pas.
 *  3. **Une carte sans contenu ne devient pas un chapitre vide.**
 *  4. **Rien ne lève** sur un plan bancal : l'export est un bouton, pas un
 *     pipeline — il doit rendre un document ou une erreur nommée.
 *
 * Lancement :  node tests/run_parcours_fiche.mjs
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8114;

const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stop);

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) { pass++; console.log(`  ✓ ${nom}`); }
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); console.log(`  ✗ ${nom}`); }
};

let exitCode = 0;
try {
    const fin = Date.now() + 15000;
    let pret = false;
    while (Date.now() < fin && !pret) {
        try { pret = (await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok; }
        catch { await new Promise(r => setTimeout(r, 150)); }
    }
    if (!pret) throw new Error(`serveur HTTP absent sur ${PORT}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0,
        null, { timeout: 60000, polling: 200 });

    const r = await page.evaluate(async () => {
        const { construireFiche, construireCoursDocumentaire, FORMATS } =
            await import('/js/parcours/fiche-sequence.js');
        const { formatContentForDocument } = await import('/js/export/document-formatter.js');

        const carte = (module, extra = {}) => ({
            id: extra.id || 'c' + Math.random().toString(36).slice(2, 6),
            titre: 'Une activité', objectif: '', consigne: '',
            module, palier: 'entrainement', duree: 10, verrouillee: false, ...extra,
        });

        const plan = {
            titre: 'Les états de la matière',
            objectifGeneral: 'Comprendre pourquoi un corps change d’état',
            notionsPivots: ['fusion', 'vaporisation', 'condensation'],
            etapes: [
                { id: 'e1', titre: 'Observer', objectif: 'Repérer les trois états', cartes: [
                    carte('Page', { titre: 'Trois états', palier: 'decouverte', duree: 8,
                                    contenu: { title: 'Trois états', blocks: [] } }),
                    carte('QuizSet', { titre: 'Ce que j’ai retenu', duree: 12,
                                       consigne: 'Réponds aux cinq questions.',
                                       contenu: { title: 'Quiz', questions: [] } }),
                ] },
                { id: 'e2', titre: 'Expliquer', objectif: 'Justifier un changement d’état', cartes: [
                    carte('Devoir', { titre: 'Le rédigé', palier: 'transfert', duree: 45 }),
                ] },
                { id: 'e3', titre: 'Vide', objectif: '', cartes: [] },
            ],
        };

        const fiche = construireFiche(plan, { platformId: 'elea' });
        const cours = construireCoursDocumentaire(plan);
        // Le contrat avec le formateur PARTAGÉ : il doit accepter la structure.
        const rendu = await formatContentForDocument('parcours_document', fiche, { keepLatex: true });

        // Les deux réglages de parcours changent ce que la classe VIVRA : le
        // papier doit les porter, mais SEULEMENT quand ils s'appliquent vraiment.
        const reglages = { carte: { actif: true, theme: 'paysage' }, progression: { actif: true } };
        const avecReglages = {
            elea: construireFiche({ ...plan, ...reglages }, { platformId: 'elea' }).meta,
            // Magistère n'a pas le greffon de la Carte : elle ne doit pas figurer.
            magistere: construireFiche({ ...plan, ...reglages }, { platformId: 'magistere' }).meta,
            // Une seule étape : il n'y a rien à ouvrir l'une après l'autre.
            uneEtape: construireFiche(
                { ...plan, ...reglages, etapes: [plan.etapes[0]] }, { platformId: 'elea' }).meta,
        };

        const vide = construireFiche({ etapes: [] }, {});
        let leve = null;
        try { construireFiche(null, {}); construireFiche(undefined); construireFiche('x'); }
        catch (e) { leve = String(e && e.message); }

        return {
            fiche, cours, rendu, vide, leve, avecReglages,
            formats: FORMATS.map(f => f.id),
            renduVide: await formatContentForDocument('parcours_document', vide, {}),
            // Le repli générique cracherait du JSON brut : on doit voir la
            // différence, sinon le formateur n'a pas été trouvé.
            renduGenerique: await formatContentForDocument('module_qui_nexiste_pas', fiche, {}),
        };
    });

    console.log('\n── La fiche dit le PLAN, pas le contenu ────────────────────');
    ok('elle porte le titre du parcours', r.fiche.title === 'Les états de la matière', r.fiche.title);
    ok('et son objectif général en chapeau',
        /change d’état/.test(r.fiche.intro || ''), String(r.fiche.intro));
    ok('les repères tiennent sur une ligne : plateforme, étapes, activités, durée',
        r.fiche.meta.length === 4 && /Éléa|elea/i.test(r.fiche.meta[0]), JSON.stringify(r.fiche.meta));
    ok('la durée totale est en heures dès qu’on dépasse 60 min',
        /h/.test(r.fiche.meta[3]) && !/^\d+ min/.test(r.fiche.meta[3]), r.fiche.meta[3]);

    // Le papier doit dire ce que le cours FERA — sinon la fiche relue avant la
    // séance et le cours vécu par la classe divergent en silence.
    const reg = r.avecReglages;
    ok('la Carte et l’ouverture progressive figurent sur la fiche quand elles s’appliquent',
        reg.elea.length === 6 && reg.elea.slice(4).every(x => x && !/^parcours_/.test(x)),
        JSON.stringify(reg.elea));
    ok('la Carte n’y figure PAS sur une plateforme qui ne l’a pas',
        reg.magistere.length === 5, JSON.stringify(reg.magistere));
    ok('l’ouverture progressive n’y figure pas sur une seule étape',
        reg.uneEtape.length === 5, JSON.stringify(reg.uneEtape));

    const notions = r.fiche.sections[0];
    ok('les notions pivots ouvrent la fiche, en puces',
        Array.isArray(notions.puces) && notions.puces.length === 3, JSON.stringify(notions));

    const e1 = r.fiche.sections.find(s => /Observer/.test(s.titre || ''));
    ok('chaque étape a son bloc, numéroté et titré',
        !!e1 && /1/.test(e1.titre), e1 && e1.titre);
    ok('son objectif est écrit en toutes lettres, hors du tableau',
        !!e1 && e1.lignes.some(l => /Repérer les trois états/.test(l)), JSON.stringify(e1 && e1.lignes));
    ok('ses activités forment un tableau à quatre colonnes',
        !!e1 && e1.table && e1.table.headers.length === 4 && e1.table.rows.length === 2,
        JSON.stringify(e1 && e1.table));
    ok('une ligne dit le titre, le type, le palier et la durée',
        !!e1 && e1.table.rows[0].length === 4 && /Page/i.test(e1.table.rows[0][1]),
        JSON.stringify(e1 && e1.table.rows[0]));
    ok('les libellés sont traduits, pas des clés brutes',
        !!e1 && !e1.table.headers.some(h => /^parcours_/.test(h)), JSON.stringify(e1 && e1.table.headers));

    const vide = r.fiche.sections.find(s => /Vide|3/.test(s.titre || '') && !s.table);
    ok('une étape SANS activité le dit, au lieu de disparaître',
        !!vide && vide.lignes.length > 0, JSON.stringify(vide));

    const consignes = r.fiche.sections[r.fiche.sections.length - 1];
    ok('les consignes données aux élèves ferment la fiche',
        Array.isArray(consignes.puces) && consignes.puces.some(x => /cinq questions/.test(x)),
        JSON.stringify(consignes));

    console.log('\n── Le détail, lui, porte le CONTENU ────────────────────────');
    ok('il ne retient que les cartes réellement générées',
        r.cours.activities.length === 2, `${r.cours.activities.length} sur 3 cartes`);
    ok('chaque activité y arrive sous la forme attendue par l’export',
        r.cours.activities.every(a => a.moduleKey && a.jsonData && a.title),
        JSON.stringify(r.cours.activities.map(a => a.moduleKey)));
    ok('le Devoir sans contenu n’y devient pas un chapitre vide',
        !r.cours.activities.some(a => a.moduleKey === 'Devoir'));

    console.log('\n── Le contrat avec le formateur PARTAGÉ ────────────────────');
    ok('le formateur « parcours_document » existe et rend des sections',
        Array.isArray(r.rendu.sections) && r.rendu.sections.length > 0);
    ok('ce n’est PAS le repli générique (qui cracherait du JSON brut)',
        !r.rendu.sections.some(s => s.style === 'code'),
        JSON.stringify(r.rendu.sections.filter(s => s.style === 'code').slice(0, 1)));
    ok('… et le repli générique, lui, en cracherait bien : la table est donc lue',
        r.renduGenerique.sections.some(s => s.style === 'code'));
    ok('le document ouvre sur un titre de niveau 1',
        r.rendu.sections[0].type === 'header' && r.rendu.sections[0].level === 1);
    ok('les tableaux traversent le formateur',
        r.rendu.sections.filter(s => s.type === 'table').length === 2,
        String(r.rendu.sections.filter(s => s.type === 'table').length));
    ok('un tableau rendu garde ses en-têtes et ses lignes',
        r.rendu.sections.find(s => s.type === 'table').headers.length === 4);
    ok('les puces traversent aussi',
        r.rendu.sections.some(s => s.type === 'bulletPoint'));

    console.log('\n── Rien ne casse sur un plan bancal ────────────────────────');
    ok('un plan sans étape rend quand même un document', r.vide.sections.length === 0
        ? true : Array.isArray(r.vide.sections), JSON.stringify(r.vide.sections));
    ok('il porte un titre de repli plutôt qu’un vide',
        typeof r.vide.title === 'string' && r.vide.title.length > 0 && !/^parcours_/.test(r.vide.title),
        r.vide.title);
    ok('null, undefined et une chaîne ne lèvent pas', r.leve === null, String(r.leve));
    ok('le formateur encaisse une fiche vide',
        Array.isArray(r.renduVide.sections) && r.renduVide.sections.length > 0);

    console.log('\n── Les trois formats ───────────────────────────────────────');
    ok('docx, odt et pdf sont proposés, dans cet ordre',
        r.formats.join(',') === 'docx,odt,pdf', r.formats.join(','));

    ok('aucune erreur JS de page', pageErrors.length === 0, pageErrors.join(' | '));

    await browser.close();
} catch (e) {
    fail++;
    echecs.push(`❌ banc interrompu : ${e && e.stack || e}`);
    exitCode = 1;
}

console.log('\n========================================');
console.log(`parcours — fiche de séquence : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(fail ? 1 : exitCode);
