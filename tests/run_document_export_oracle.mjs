/**
 * run_document_export_oracle.mjs — Oracle de l'export documentaire DOCX / ODT.
 *
 * `js/export/document-exporter.js` fait 4352 lignes et n'était couvert que par
 * `tests/roundtrip/docx-image-type.mjs` (18 assertions sur le seul `type` des
 * `ImageRun`). Les constructeurs eux-mêmes — `createDOCXDocument` (191 l.),
 * `createODTDocument` (415 l.), `createODTFlashcardDocument` (150 l.),
 * `createDOCXFlashcardDocument` (149 l.), `createDOCXTable` (220 l.) — produisaient
 * des octets qu'AUCUN test ne comparait. Ce fichier est byte-identique côté Sucrerie :
 * une régression silencieuse y voyage par `cp`.
 *
 * L'oracle exécute le VRAI pipeline dans Chromium (DOM réel, DOMPurify réel, MathJax
 * réel — impossibles à simuler fidèlement en Node) et hache le contenu des archives
 * produites, entrée par entrée.
 *
 * ── Capture sans couture dans le code produit ────────────────────────────────
 * `exportToDOCX`/`exportToODT` terminent par `downloadBlob()`, qui appelle
 * `URL.createObjectURL(blob)`. On intercepte CETTE fonction du navigateur : aucun
 * `export` de test à ajouter, aucun chemin de code alternatif — l'oracle observe
 * exactement les octets que l'utilisateur télécharge.
 *
 * ── Déterminisme ─────────────────────────────────────────────────────────────
 * DOCX embarque `docProps/core.xml` avec `dcterms:created`/`modified`, et les deux
 * formats peuvent porter des identifiants horodatés. On NEUTRALISE ces valeurs par
 * réécriture (`NORMALISATIONS`) plutôt que par exclusion de fichier : une entrée
 * exclue cesserait d'être surveillée, alors qu'une entrée normalisée reste comparée
 * sur tout ce qui n'est pas la date.
 *
 * Lancement :  node tests/run_document_export_oracle.mjs [--update]
 * Baseline  :  tests/fixtures/document-export-baseline.json
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import { createHash } from 'crypto';
import { deflateSync } from 'zlib';

const zlibSync = (buf) => deflateSync(buf, { level: 9 });

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');

const { listH5pFixtures, listMoodleFixtures, EXAMPLES_DIR } =
    await import('./roundtrip/fixtures-map.mjs');

const BASELINE_PATH = join(ROOT, 'tests/fixtures/document-export-baseline.json');
const CASES_DIR = join(ROOT, 'tests/fixtures/export-cases');
const UPDATE = process.argv.includes('--update');
const PORT = 8098;

// ---------------------------------------------------------------- fixtures
const all = [...await listH5pFixtures(), ...await listMoodleFixtures()];
const seen = new Set();
const CAS = [];
for (const fx of all) {
    // Un cas par (moduleKey, fixture) — on garde AU PLUS 2 fixtures par module pour
    // borner le temps d'exécution tout en conservant deux formes de données.
    const n = [...seen].filter(k => k.startsWith(fx.moduleKey + '#')).length;
    if (n >= 2) continue;
    seen.add(fx.moduleKey + '#' + fx.file);
    CAS.push({
        moduleKey: fx.moduleKey,
        file: fx.file,
        data: JSON.parse(await readFile(join(EXAMPLES_DIR, fx.file), 'utf8'))
    });
}
CAS.sort((a, b) => (a.moduleKey + a.file).localeCompare(b.moduleKey + b.file));

// ── Cas SUPPLÉMENTAIRES : tests/fixtures/export-cases/ ──────────────────────────
// Les fixtures de `assets/data/examples/` servent AUSSI d'échantillons few-shot aux
// prompts : on n'y ajoute pas un champ que le LLM ne doit jamais produire (`mediaImage`
// — l'image est jointe par l'utilisateur). Et le plafond de 2 fixtures par module
// empêcherait de toute façon un 3ᵉ exemple d'être vu. Les cas destinés à couvrir un tel
// champ vivent donc ici, dans un dossier propre aux tests.
//
// Enveloppe : { _moduleKey, _attendImages?, _doc?, data }. `_attendImages` = nombre
// MINIMAL d'entrées média attendues dans chaque archive produite (cf. contrôle plus bas).
//
// AJOUTÉS EN QUEUE, jamais dans le tri : le préchauffage utilise `CAS[0]`, et changer
// ce premier cas déplacerait l'état de départ de TOUS les exports mesurés.
const CAS_SUP = [];
if (existsSync(CASES_DIR)) {
    for (const f of (await readdir(CASES_DIR)).filter(n => n.endsWith('.json')).sort()) {
        const j = JSON.parse(await readFile(join(CASES_DIR, f), 'utf8'));
        if (!j._moduleKey) throw new Error(`tests/fixtures/export-cases/${f} : _moduleKey manquant`);
        CAS_SUP.push({ moduleKey: j._moduleKey, file: `export-cases/${f}`, data: await inlinerImages(j.data), attendImages: j._attendImages || 0 });
    }
    CAS.push(...CAS_SUP);
}

/**
 * Remplace tout `{ _fichier: 'x.jpg', mime }` par le `dataURL` du fichier correspondant
 * de `tests/fixtures/export-images/`.
 *
 * Pourquoi pas un chemin ? `fetchImageAsDataURL` (renderers/image-utils.js) appelle
 * `validateImageUrl`, qui n'autorise QUE http(s) : un chemin relatif est refusé, et le
 * repli « chemin relatif » de `resolveImageData` lit le registre MÉMOIRE d'image-manager,
 * vide hors application. Le `dataURL` est de toute façon la forme réelle que Caramel donne
 * à une image jointe (`getMediaImageUrl` le lit AVANT `path`), et il rend le cas
 * entièrement déterministe : aucun octet ne transite par le réseau.
 *
 * Le fichier reste sur disque — vrai JPEG relisible et crédité (CREDITS.md) — plutôt
 * qu'un pavé base64 illisible recopié dans la fixture.
 */
async function inlinerImages(noeud) {
    if (Array.isArray(noeud)) return Promise.all(noeud.map(inlinerImages));
    if (!noeud || typeof noeud !== 'object') return noeud;
    if (typeof noeud._fichier === 'string') {
        const bin = await readFile(join(ROOT, 'tests/fixtures/export-images', noeud._fichier));
        const { _fichier, ...reste } = noeud;
        return { ...reste, dataURL: `data:${noeud.mime || 'image/jpeg'};base64,${bin.toString('base64')}` };
    }
    const out = {};
    for (const [k, v] of Object.entries(noeud)) out[k] = await inlinerImages(v);
    return out;
}

// ---------------------------------------------------------------- serveur
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stop);

async function waitForServer(ms = 15000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok) return true; }
        catch { /* pas prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

let exitCode = 0;
try {
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));

    // ── Neutralisation du réseau ────────────────────────────────────────────────
    // 6 fixtures (`timeline_*`, `page_*`) référencent des images Wikimedia distantes,
    // que `prepareImages()` télécharge vraiment. Le résultat dépendait donc de la
    // disponibilité du réseau : à la capture de la première baseline, 4 des 5 images de
    // `timeline_1.json` avaient échoué — et un run ultérieur en récupérait un nombre
    // différent, faisant diverger `content.xml`, le manifeste ET l'ordre des entrées.
    // Une porte de non-régression ne peut pas dépendre du réseau.
    //
    // On sert donc un PNG synthétique à toute requête sortante, plutôt que d'exclure ces
    // fixtures : le chemin d'embarquement d'images (dimensionnement, `docxImageType`,
    // conversion `ensureDocxCompatibleImage`, entrée de manifeste) reste couvert, mais
    // avec une entrée déterministe.
    //
    // Le PNG est DISTINCT par URL (couleur dérivée d'un hachage de l'URL). Servir la même
    // image partout ne suffisait pas : `prepareImages()` lance les téléchargements en
    // parallèle, l'ordre d'arrivée varie, et des images au contenu identique deviennent
    // indiscernables — la canonisation par empreinte de contenu ne pouvait plus les
    // départager, si bien que l'ORDRE des entrées `word/media/` oscillait d'un run à
    // l'autre. Une couleur par URL rend le classement stable ET conserve la capacité de
    // détecter un référencement croisé.
    const pngUni = (r, g, b) => {
        const crcT = [...Array(256)].map((_, n) => {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            return c >>> 0;
        });
        const crc = (buf) => {
            let c = 0xFFFFFFFF;
            for (const o of buf) c = crcT[(c ^ o) & 0xFF] ^ (c >>> 8);
            return (c ^ 0xFFFFFFFF) >>> 0;
        };
        const chunk = (type, data) => {
            const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
            const corps = Buffer.concat([Buffer.from(type, 'ascii'), data]);
            const c = Buffer.alloc(4); c.writeUInt32BE(crc(corps));
            return Buffer.concat([len, corps, c]);
        };
        const ihdr = Buffer.alloc(13);
        ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4);
        ihdr[8] = 8; ihdr[9] = 2;                    // 8 bits, RGB
        const brut = Buffer.from([0, r, g, b]);      // 1 ligne : filtre 0 + 1 pixel
        return Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            chunk('IHDR', ihdr),
            chunk('IDAT', zlibSync(brut)),
            chunk('IEND', Buffer.alloc(0))
        ]);
    };
    const cachePng = new Map();
    let requetesExternes = 0;
    await page.route('**/*', (route) => {
        const url = route.request().url();
        if (url.includes('127.0.0.1') || url.startsWith('data:') || url.startsWith('blob:')) {
            return route.continue();
        }
        requetesExternes++;
        if (!cachePng.has(url)) {
            const h = createHash('sha256').update(url).digest();
            cachePng.set(url, pngUni(h[0], h[1], h[2]));
        }
        return route.fulfill({ status: 200, contentType: 'image/png', body: cachePng.get(url) });
    });

    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });

    console.log(`\n${CAS.length} cas × 2 formats — exécution dans Chromium…`);

    const results = await page.evaluate(async (CAS) => {
        const exporter = await import('/js/export/document-exporter.js');
        const { preloadSanitizer, isSanitizerLoaded } = await import('/js/export/sanitizer.js');

        // Même piège que l'oracle des thèmes : `sanitizeSync` est fail-closed. Sans
        // DOMPurify chargé, le premier export d'une session échappe tout le HTML et
        // diffère de tous les suivants.
        await preloadSanitizer();
        if (!isSanitizerLoaded()) throw new Error('DOMPurify non chargé : export non déterministe');

        // --- déterminisme : PRNG semé + horloge figée ---------------------------
        // Plusieurs activités MÉLANGENT leur contenu à l'export (constaté : l'ordre des
        // réponses du Millionnaire change d'un run à l'autre), et docx.js tire au sort
        // les noms des fichiers de `word/media/`. Même graine que `bootstrap.mjs` pour
        // que les deux bancs racontent la même histoire. On resème AVANT CHAQUE export
        // afin qu'un cas ne dépende pas du nombre de tirages faits par les précédents.
        const GRAINE = 0x9e3779b9;
        const vraiRandom = Math.random;
        function semer(graine) {
            let a = graine >>> 0;
            Math.random = () => {
                a = (a + 0x6D2B79F5) >>> 0;
                let t = Math.imul(a ^ (a >>> 15), 1 | a);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }
        // Horloge FIGÉE — le constructeur entier, pas seulement `Date.now`. Chaque document
        // exporté imprime « Date de génération : <date locale> » via
        // `new Date().toLocaleDateString(...)`. Ne stubber que `Date.now()` laissait cette
        // date suivre l'horloge réelle : la baseline capturée un soir faisait échouer les
        // 126 exports le lendemain matin (« 30 juillet 2026 » → « 31 juillet 2026 » : même
        // longueur, sha différent). Un oracle ne doit pas se périmer à minuit.
        const INSTANT = 1781611200000;    // 2026-06-16T12:00:00Z, comme le banc Node
        const VraieDate = Date;
        class DateFigee extends VraieDate {
            constructor(...args) {
                if (args.length === 0) super(INSTANT);
                else super(...args);
            }
            static now() { return INSTANT; }
        }
        window.Date = DateFigee;

        // --- interception du téléchargement -------------------------------------
        const vraiCreate = URL.createObjectURL.bind(URL);
        const vraiRevoke = URL.revokeObjectURL.bind(URL);
        let capture = null;
        URL.createObjectURL = (blob) => { capture = blob; return 'blob:oracle'; };
        URL.revokeObjectURL = (u) => { if (u !== 'blob:oracle') vraiRevoke(u); };
        // `a.click()` déclencherait une vraie navigation de téléchargement.
        const vraiClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function () { /* neutralisé */ };
        // `alert` est appelé par les catch d'export : on le capture au lieu de bloquer.
        const alertes = [];
        const vraiAlert = window.alert;
        window.alert = (m) => alertes.push(String(m));

        /**
         * Réécrit les valeurs intrinsèquement volatiles. Réécriture — PAS exclusion :
         * l'entrée reste comparée sur tout le reste de son contenu.
         */
        const NORMALISATIONS = [
            [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/g, '<DATE>'],
            [/\d{4}-\d{2}-\d{2}/g, '<JOUR>'],
            [/urn:uuid:[0-9a-fA-F-]{36}/g, 'urn:uuid:<UUID>'],
            [/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '<UUID>']
        ];

        async function sha256(buf) {
            const h = await crypto.subtle.digest('SHA-256', buf);
            return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
        }

        /** Échappe une chaîne pour l'insérer dans une RegExp. */
        const reEchap = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        /**
         * Empreinte par ENTRÉE d'archive : un écart désigne le fichier fautif.
         *
         * docx.js NOMME les médias aléatoirement (`word/media/7colzy2zapjcjnj0werx2.jpg`),
         * indépendamment de `Math.random` semé plus haut. On CANONISE ces noms par le
         * rang de leur empreinte de CONTENU (`media0`, `media1`, …) — et on applique le
         * même renommage à l'intérieur des XML qui les référencent. Deux images restent
         * ainsi distinguables (contrairement à un masquage par joker) : un référencement
         * croisé accidentel resterait détecté.
         */
        async function empreinteArchive(blob) {
            const zip = await new window.JSZip().loadAsync(await blob.arrayBuffer());
            const noms = Object.keys(zip.files).filter(n => !zip.files[n].dir).sort();

            const estXml = (n) => /\.(xml|rels|txt)$/i.test(n) || n === 'mimetype';
            const estMedia = (n) => /^(word\/media|Pictures|media)\//i.test(n);

            // 1. empreinte de contenu de chaque média, pour construire le renommage
            const medias = [];
            for (const nom of noms.filter(estMedia)) {
                medias.push({ nom, sha: await sha256(await zip.files[nom].async('arraybuffer')) });
            }
            medias.sort((a, b) => a.sha.localeCompare(b.sha) || a.nom.localeCompare(b.nom));
            const renommage = new Map();
            medias.forEach((m, i) => {
                const dossier = m.nom.slice(0, m.nom.lastIndexOf('/') + 1);
                const ext = m.nom.slice(m.nom.lastIndexOf('.'));
                renommage.set(m.nom, `${dossier}media${i}${ext}`);
            });
            // basename → basename canonique, pour la réécriture dans les XML
            const basenames = [...renommage].map(([o, c]) => [
                o.slice(o.lastIndexOf('/') + 1), c.slice(c.lastIndexOf('/') + 1)
            ]).sort((a, b) => b[0].length - a[0].length);   // plus longs d'abord

            // L'ORDRE d'insertion fait partie du contrat : ODF exige `mimetype` en
            // PREMIER et non compressé. Les entrées étant ensuite comparées par nom,
            // un réordonnancement passerait inaperçu sans cette trace explicite.
            const ordre = Object.keys(zip.files).filter(n => !zip.files[n].dir)
                .map(n => renommage.get(n) ?? n);

            const out = { _ordre: ordre };
            for (const nom of noms) {
                const f = zip.files[nom];
                const cle = renommage.get(nom) ?? nom;
                if (estXml(nom)) {
                    let txt = await f.async('string');
                    for (const [orig, canon] of basenames) txt = txt.replace(new RegExp(reEchap(orig), 'g'), canon);
                    for (const [re, rep] of NORMALISATIONS) txt = txt.replace(re, rep);
                    out[cle] = { taille: txt.length, sha: await sha256(new TextEncoder().encode(txt)) };
                } else {
                    const bin = await f.async('arraybuffer');
                    out[cle] = { taille: bin.byteLength, sha: await sha256(bin) };
                }
            }
            return out;
        }

        // --- préchauffage ---------------------------------------------------------
        // Le PREMIER export d'une session déclenche le chargement paresseux des vendors
        // (JSZip, docx, polices) et le préchargement des images. Ces étapes consomment un
        // nombre VARIABLE de tirages aléatoires (selon ce qui est déjà en cache), ce qui
        // décale le PRNG pour tout ce qui suit : le mélange des réponses de l'Appariement
        // sortait alors différent d'un run à l'autre malgré la graine (constaté : 2 ordres
        // distincts sur 6 exécutions). On brûle donc un export de chaque format avant de
        // mesurer, pour que la mesure parte d'un état chaud identique.
        for (const [, fn] of [['docx', exporter.exportToDOCX], ['odt', exporter.exportToODT]]) {
            capture = null;
            try { await fn(CAS[0].moduleKey, structuredClone(CAS[0].data)); } catch { /* préchauffage */ }
        }
        alertes.length = 0;

        const res = {};
        for (const cas of CAS) {
            for (const [fmt, fn] of [['docx', exporter.exportToDOCX], ['odt', exporter.exportToODT]]) {
                const cle = `${cas.moduleKey}/${cas.file}#${fmt}`;
                capture = null;
                alertes.length = 0;
                semer(GRAINE);
                try {
                    await fn(cas.moduleKey, structuredClone(cas.data));
                    if (!capture) { res[cle] = { erreur: 'aucun blob produit', alertes: [...alertes] }; continue; }
                    res[cle] = { type: capture.type, entrees: await empreinteArchive(capture) };
                    if (alertes.length) res[cle].alertes = [...alertes];
                } catch (e) {
                    res[cle] = { erreur: String(e && e.message || e) };
                }
            }
        }

        URL.createObjectURL = vraiCreate;
        URL.revokeObjectURL = vraiRevoke;
        HTMLAnchorElement.prototype.click = vraiClick;
        window.alert = vraiAlert;
        Math.random = vraiRandom;
        window.Date = VraieDate;
        return res;
    }, CAS);

    await browser.close();

    // ------------------------------------------------------------ bilan
    const cles = Object.keys(results).sort();
    const erreurs = cles.filter(k => results[k].erreur);
    const avecAlerte = cles.filter(k => results[k].alertes?.length);
    const entreesTotal = cles.reduce((n, k) => n + Object.keys(results[k].entrees ?? {}).length, 0);

    console.log(`\n${cles.length} exports | ${entreesTotal} entrées d'archive hachées`);
    console.log(`${requetesExternes} requête(s) sortante(s) interceptée(s) — PNG synthétique, couleur dérivée de l'URL`);
    if (erreurs.length) {
        console.log(`\n${erreurs.length} export(s) en ERREUR :`);
        for (const k of erreurs.slice(0, 10)) console.log(`   • ${k} — ${results[k].erreur}`);
        if (erreurs.length > 10) console.log(`   … et ${erreurs.length - 10} autre(s)`);
    }
    if (avecAlerte.length) {
        console.log(`\n${avecAlerte.length} export(s) ayant déclenché une alerte utilisateur :`);
        for (const k of avecAlerte.slice(0, 6)) console.log(`   • ${k} — ${results[k].alertes.join(' | ')}`);
    }
    if (pageErrors.length) {
        console.log(`\n${pageErrors.length} erreur(s) JS de page :`);
        for (const e of [...new Set(pageErrors)].slice(0, 6)) console.log('   • ' + e);
    }

    // ── Contrôle des cas `_attendImages` ────────────────────────────────────────
    // La baseline prouve « rien n'a changé », jamais « l'image est là » : un correctif
    // d'image qu'on retirerait AVANT la première capture passerait vert à jamais. On
    // exige donc explicitement N entrée(s) média par archive, et des octets réels —
    // ces images-là sont inlinées en `dataURL` depuis un VRAI fichier (jamais interceptées,
    // le filtre de route laisse passer `data:`) : un PNG synthétique de l'oracle
    // (1 pixel, ~70 octets) ne pourrait pas franchir le seuil de taille.
    const MEDIA_RE = /^(word\/media|Pictures|media)\//i;
    const TAILLE_MINI = 1024;
    const manquants = [];
    for (const cas of CAS_SUP.filter(c => c.attendImages > 0)) {
        for (const fmt of ['docx', 'odt']) {
            const r = results[`${cas.moduleKey}/${cas.file}#${fmt}`];
            const medias = Object.entries(r?.entrees ?? {}).filter(([n]) => MEDIA_RE.test(n));
            const vrais = medias.filter(([, v]) => (v?.taille ?? 0) >= TAILLE_MINI);
            if (vrais.length < cas.attendImages) {
                manquants.push(`${cas.file}#${fmt} : ${vrais.length} média(s) ≥ ${TAILLE_MINI} o`
                    + ` sur ${cas.attendImages} attendu(s) (entrées média : ${medias.map(([n, v]) => `${n} ${v.taille}o`).join(', ') || 'aucune'})`);
            }
        }
    }
    if (manquants.length) {
        console.log(`\n❌ ${manquants.length} archive(s) sans l'image attendue :`);
        for (const m of manquants) console.log('   • ' + m);
        exitCode = 1;
    } else if (CAS_SUP.some(c => c.attendImages > 0)) {
        const n = CAS_SUP.filter(c => c.attendImages > 0).length;
        console.log(`\n✅ images embarquées : ${n} cas × 2 formats portent leurs octets d'image réels`);
    }

    if (UPDATE || !existsSync(BASELINE_PATH)) {
        writeFileSync(BASELINE_PATH, JSON.stringify({
            _doc: 'Oracle DOCX/ODT — NE PAS éditer à la main. Régénérer : node tests/run_document_export_oracle.mjs --update',
            exports: cles.length,
            entrees: entreesTotal,
            resultats: results
        }, null, 1) + '\n', 'utf8');
        console.log('\nbaseline écrite : tests/fixtures/document-export-baseline.json');
    } else {
        const base = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).resultats;
        const deltas = [];
        for (const k of [...new Set([...Object.keys(base), ...cles])].sort()) {
            const a = base[k], b = results[k];
            if (!a) { deltas.push(`${k} : ABSENT de la baseline (nouveau cas)`); continue; }
            if (!b) { deltas.push(`${k} : DISPARU du résultat`); continue; }
            if (JSON.stringify(a) === JSON.stringify(b)) continue;
            const ea = a.entrees ?? {}, eb = b.entrees ?? {};
            const noms = [...new Set([...Object.keys(ea), ...Object.keys(eb)])].sort();
            for (const n of noms) {
                if (JSON.stringify(ea[n]) !== JSON.stringify(eb[n])) {
                    deltas.push(`${k} → ${n}\n      baseline : ${JSON.stringify(ea[n])}\n      actuel   : ${JSON.stringify(eb[n])}`);
                }
            }
            if (a.erreur !== b.erreur) deltas.push(`${k} → erreur : ${a.erreur} → ${b.erreur}`);
        }
        console.log('\n========================================');
        if (deltas.length === 0) {
            console.log(`export documentaire : ${cles.length} exports | 0 écart baseline`);
            console.log('========================================');
            console.log('✅ Exports conformes à la baseline.');
        } else {
            console.log(`❌ ${deltas.length} écart(s) vs baseline :`);
            for (const d of deltas.slice(0, 25)) console.log('   • ' + d);
            if (deltas.length > 25) console.log(`   … et ${deltas.length - 25} autre(s)`);
            console.log('========================================');
            exitCode = 1;
        }
    }
} catch (e) {
    console.error('ÉCHEC : ' + (e && e.stack || e));
    exitCode = 1;
} finally {
    stop();
}
process.exit(exitCode);
