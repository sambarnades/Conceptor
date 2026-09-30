/**
 * run_page_images.mjs — Les images envoyées depuis l'ordinateur dans une Page ou un Livre.
 *
 * Retour de professeur (29 sept. 2026) : « l'édition de la Page ne permet pas de
 * rajouter une image ». L'éditeur greffe désormais un envoi d'image (`img_file`)
 * après chaque « URL de l'image » (`editor/index.js`), et `moodle/page-images.js`
 * en fait un VRAI fichier du backup. Ce banc lit les `.mbz` produits comme la
 * restauration Moodle les lira :
 *
 *   • Page seule : `files.xml` (mod_page / content / 0, contexte de l'activité),
 *     `inforef.xml` de l'activité, octets exacts dans le pool `files/<sha1>`,
 *     `@@PLUGINFILE@@/<nom>` dans `page.xml`, AUCUNE dataURL dans l'archive,
 *     l'aperçu montrant, lui, la dataURL ; une fausse image est écartée ;
 *   • Livre seul : mod_book / chapter / identifiant du chapitre ;
 *   • parcours : la Page et le Livre d'un cours gardent leurs images (octets
 *     rangés dans `carte.medias` par l'atelier, joints après l'assemblage) ;
 *   • export en document : l'image envoyée remplace l'adresse du bloc ET chaque
 *     bloc illustré, notamment `#13_monument_sheet_long`, devient une section image ;
 *   • éditeur : le champ est greffé juste après `img_src`, sans toucher au
 *     fichier partagé avec La Sucrerie.
 *
 * **Contre-épreuves embarquées.** Le banc rejoue les mêmes vérifications en
 * servant au navigateur une version DÉSARMÉE d'un correctif (extraction des
 * images, transmission du `paquet` au parcours, réhydratation des octets rangés
 * dans `carte.medias`) et EXIGE le rouge des vérifications concernées. Un banc
 * qui resterait vert correctif retiré ne prouverait rien.
 *
 * Lancement : node tests/run_page_images.mjs
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8173;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });

/**
 * Les vérifications, exécutées DANS la page. Ne lève jamais : chaque groupe
 * rend ses verdicts, un groupe qui plante rend un verdict rouge.
 * @returns {Promise<Array<[string, boolean, string]>>} [nom, succès, détail]
 */
async function verifier() {
    const verdicts = [];
    const ok = (nom, cond, detail = '') => verdicts.push([nom, !!cond, cond ? '' : String(detail).slice(0, 300)]);
    const groupe = async (prefixe, fn) => {
        try { await fn((nom, cond, detail) => ok(`${prefixe} : ${nom}`, cond, detail)); }
        catch (e) { ok(`${prefixe} : le groupe s'exécute`, false, e && (e.stack || e.message) || e); }
    };

    const { loadMoodleLibs } = await import('/js/core/lib-loader.js');
    await loadMoodleLibs();
    const { processBackgroundImage } = await import('/js/h5p/image-manager.js');
    const { construireFichiersActivite, fichiersMonoActivite } = await import('/js/moodle/mono-activity-files.js');
    const { createMbz } = await import('/js/moodle/moodle-creator.js');

    // --- Outils ---------------------------------------------------------
    const octetsDe = d => Uint8Array.from(atob(d.split(',')[1]), c => c.charCodeAt(0));
    const sha1 = async o => [...new Uint8Array(await crypto.subtle.digest('SHA-1', o))].map(b => b.toString(16).padStart(2, '0')).join('');
    const egaux = (a, b) => a && b && a.length === b.length && a.every((x, i) => x === b[i]);
    const texte = o => (typeof o === 'string' ? o : new TextDecoder().decode(o));
    const xml = s => new DOMParser().parseFromString(texte(s), 'application/xml');
    /** Le `.mbz` tel que Moodle le décompresse : {chemin: octets}. */
    const lireMbz = gz => {
        const tar = window.fflate.gunzipSync(gz); const fichiers = {};
        for (let o = 0; o + 512 <= tar.length;) {
            const nom = new TextDecoder().decode(tar.subarray(o, o + 100)).replace(/\0.*$/, ''); if (!nom) break;
            const taille = parseInt(new TextDecoder().decode(tar.subarray(o + 124, o + 136)).replace(/[^0-7]/g, ''), 8) || 0;
            fichiers[nom] = tar.slice(o + 512, o + 512 + taille); o += 512 + Math.ceil(taille / 512) * 512;
        }
        return { fichiers, brut: tar };
    };
    /** Une image comme la rend le widget de l'éditeur (`renderImageField`, processeur « fond »). */
    const imageEnvoyee = async (type, w, h, peindre) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        peindre(c.getContext('2d'));
        const blob = await new Promise(r => c.toBlob(r, type, 0.9));
        const e = await processBackgroundImage(new File([blob], type === 'image/png' ? 'schema.png' : 'photo.jpg', { type }));
        return { path: e.h5pPath, mime: e.mime, width: e.width, height: e.height, dataURL: e.dataURL };
    };
    /** Entrées `files.xml` d'un composant, en objets. */
    const entrees = (filesXml, component) => [...xml(filesXml).querySelectorAll('file')]
        .filter(n => n.querySelector('component').textContent === component)
        .map(n => Object.fromEntries(['contextid', 'component', 'filearea', 'itemid', 'filename', 'contenthash', 'filesize', 'mimetype']
            .map(k => [k, n.querySelector(k).textContent]).concat([['id', n.getAttribute('id')]])));

    const A = await imageEnvoyee('image/png', 64, 48, ctx => { ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, 32, 48); ctx.fillStyle = '#2980b9'; ctx.fillRect(32, 0, 32, 24); });
    const B = await imageEnvoyee('image/jpeg', 80, 60, ctx => { ctx.fillStyle = '#27ae60'; ctx.fillRect(0, 0, 80, 60); ctx.fillStyle = '#fff'; ctx.fillRect(20, 15, 40, 30); });
    const FAUX = { path: 'images/image-faux0000.png', mime: 'image/png', width: 10, height: 10, dataURL: 'data:image/png;base64,' + btoa('pas une image du tout, un texte') };

    const page = await (await fetch('/assets/data/examples/page_3.json')).json();
    const indice = t => page.blocks.findIndex(b => b.type === t);
    const [i08, i09, i13, i16] = ['#08_monuments_grid', '#09_figures_comparison', '#13_monument_sheet_long', '#16_method_image_desc'].map(indice);
    const url16 = page.blocks[i16].data.img_src;
    page.blocks[i08].data.cards[0].img_file = A;      // même image deux fois : un seul fichier
    page.blocks[i13].data.img_file = A;
    page.blocks[i09].data.left.img_file = B;
    page.blocks[i16].data.img_file = FAUX;              // écartée : l'adresse du bloc reste
    const avant = JSON.stringify(page);

    // --- Page seule -------------------------------------------------------
    await groupe('Page seule', async ok => {
        const r = await construireFichiersActivite('Page', page, { titreParDefaut: 'Page' });
        ok('le JSON d\'origine n\'est pas modifié', JSON.stringify(page) === avant);
        ok('le paquet décrit mod_page, zone content, item 0', r.paquet && r.paquet.component === 'mod_page'
            && r.paquet.zones.length === 1 && r.paquet.zones[0].filearea === 'content' && r.paquet.zones[0].itemid === 0, JSON.stringify(r.paquet && r.paquet.zones.map(z => [z.filearea, z.itemid, z.fichiers.length])));
        const files = await fichiersMonoActivite(r);
        const { fichiers, brut } = lireMbz(await createMbz(files));
        const dir = Object.keys(fichiers).find(p => /^activities\/page_\d+\/page\.xml$/.test(p)).replace(/\/page\.xml$/, '');
        const pageXml = xml(fichiers[`${dir}/page.xml`]);
        const contexte = pageXml.documentElement.getAttribute('contextid');
        const html = pageXml.querySelector('page > content').textContent;
        const liste = entrees(fichiers['files.xml'], 'mod_page');
        const vrais = liste.filter(f => f.filename !== '.');
        const [hA, hB] = [await sha1(octetsDe(A.dataURL)), await sha1(octetsDe(B.dataURL))];
        const nomA = `image-${hA.slice(0, 12)}.png`, nomB = `image-${hB.slice(0, 12)}.jpg`;
        ok('files.xml porte deux images (la même image citée deux fois n\'est posée qu\'une fois) et le dossier « . »',
            vrais.length === 2 && liste.filter(f => f.filename === '.').length === 1, JSON.stringify(liste.map(f => f.filename)));
        ok('chaque entrée vise le contexte de la Page, zone content, item 0', liste.length && liste.every(f => f.contextid === contexte && f.filearea === 'content' && f.itemid === '0'), JSON.stringify(liste));
        const fA = vrais.find(f => f.filename === nomA), fB = vrais.find(f => f.filename === nomB);
        ok('noms tirés du contenu, types MIME exacts', fA && fB && fA.mimetype === 'image/png' && fB.mimetype === 'image/jpeg', JSON.stringify(vrais.map(f => [f.filename, f.mimetype])));
        ok('empreintes sha1 et tailles exactes', fA && fB && fA.contenthash === hA && fB.contenthash === hB
            && Number(fA.filesize) === octetsDe(A.dataURL).length && Number(fB.filesize) === octetsDe(B.dataURL).length);
        ok('le pool files/<sha1> contient les octets exacts', egaux(fichiers[`files/${hA.slice(0, 2)}/${hA}`], octetsDe(A.dataURL))
            && egaux(fichiers[`files/${hB.slice(0, 2)}/${hB}`], octetsDe(B.dataURL)));
        const index = texte(fichiers['.ARCHIVE_INDEX'] || '');
        ok('.ARCHIVE_INDEX annonce les fichiers du pool', index.includes(`files/${hA.slice(0, 2)}/${hA}\tf\t`) && index.includes(`files/${hB.slice(0, 2)}/${hB}\tf\t`));
        const refs = [...xml(fichiers[`${dir}/inforef.xml`]).querySelectorAll('fileref file id')].map(n => n.textContent).sort();
        ok('inforef.xml de la Page référence exactement ses fichiers', JSON.stringify(refs) === JSON.stringify(liste.map(f => f.id).sort()), JSON.stringify([refs, liste.map(f => f.id)]));
        ok('page.xml cite l\'image A deux fois et B une fois par @@PLUGINFILE@@',
            html.split(`src="@@PLUGINFILE@@/${nomA}"`).length === 3 && html.split(`src="@@PLUGINFILE@@/${nomB}"`).length === 2, html.match(/src="[^"]{0,80}/g));
        ok('la fausse image est écartée : le bloc garde son adresse', html.includes(url16) && !vrais.some(f => f.filename.startsWith('image-faux')));
        const latin1 = new TextDecoder('latin1').decode(brut);
        ok('aucune dataURL dans le .mbz', !latin1.includes('data:image') && !latin1.includes(A.dataURL.slice(22, 80)));
        ok('aucun img_file dans le .mbz', !latin1.includes('img_file'));
        ok('l\'aperçu montre les images en dataURL, sans @@PLUGINFILE@@', r.previewHtml.includes(A.dataURL) && r.previewHtml.includes(B.dataURL) && !r.previewHtml.includes('@@PLUGINFILE@@'));
        const r2 = await construireFichiersActivite('Page', JSON.parse(avant));
        ok('deux exports du même JSON posent les mêmes fichiers', JSON.stringify(r2.paquet.zones[0].fichiers.map(f => [f.filename, f.octets.length]))
            === JSON.stringify(r.paquet.zones[0].fichiers.map(f => [f.filename, f.octets.length])));
        const sans = await construireFichiersActivite('Page', await (await fetch('/assets/data/examples/page_3.json')).json());
        ok('sans image envoyée : aucun paquet, carte inchangée, files.xml vide', sans.paquet === null
            && await fichiersMonoActivite(sans) === sans.files && !/<file\b/.test(sans.files['files.xml']));
    });

    // --- Livre seul -------------------------------------------------------
    await groupe('Livre seul', async ok => {
        const livre = await (await fetch('/assets/data/examples/livre_1.json')).json();
        livre.chapters[2].blocks.push({ type: '#16_method_image_desc', data: { title: 'Schéma', steps: ['Observer'], img_src: '', img_alt: 'Schéma', img_file: A } });
        const r = await construireFichiersActivite('Livre', livre, { titreParDefaut: 'Livre' });
        ok('le paquet décrit mod_book, zone chapter, item = identifiant du 3e chapitre (102)', r.paquet && r.paquet.component === 'mod_book'
            && r.paquet.zones.length === 1 && r.paquet.zones[0].filearea === 'chapter' && r.paquet.zones[0].itemid === 102, JSON.stringify(r.paquet && r.paquet.zones.map(z => [z.filearea, z.itemid])));
        const { fichiers, brut } = lireMbz(await createMbz(await fichiersMonoActivite(r)));
        const chemin = Object.keys(fichiers).find(p => /^activities\/book_\d+\/book\.xml$/.test(p));
        const book = xml(fichiers[chemin]);
        const contexte = book.documentElement.getAttribute('contextid');
        const chapitre = id => book.querySelector(`chapter[id="${id}"] > content`)?.textContent || '';
        const hA = await sha1(octetsDe(A.dataURL));
        ok('le chapitre 102 cite l\'image, les autres non', chapitre(102).includes(`@@PLUGINFILE@@/image-${hA.slice(0, 12)}.png`) && !chapitre(100).includes('@@PLUGINFILE@@'));
        const liste = entrees(fichiers['files.xml'], 'mod_book');
        ok('files.xml : mod_book / chapter / 102, contexte du Livre', liste.length === 2 && liste.every(f => f.contextid === contexte && f.filearea === 'chapter' && f.itemid === '102'), JSON.stringify(liste));
        ok('le pool contient les octets exacts', egaux(fichiers[`files/${hA.slice(0, 2)}/${hA}`], octetsDe(A.dataURL)));
        const refs = [...xml(fichiers[chemin.replace('book.xml', 'inforef.xml')]).querySelectorAll('fileref file id')].map(n => n.textContent).sort();
        ok('inforef.xml du Livre référence ses fichiers', JSON.stringify(refs) === JSON.stringify(liste.map(f => f.id).sort()));
        ok('aucune dataURL dans le .mbz', !new TextDecoder('latin1').decode(brut).includes('data:image'));
        ok('l\'aperçu du Livre montre l\'image', r.previewHtml.includes(A.dataURL) && !r.previewHtml.includes('@@PLUGINFILE@@'));
    });

    // --- Parcours -----------------------------------------------------------
    await groupe('Parcours', async ok => {
        const { recueillirMedias, contenuPourEdition } = await import('/js/parcours/sources.js');
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { construireCoursDocumentaire } = await import('/js/parcours/fiche-sequence.js');
        const contenuPage = await (await fetch('/assets/data/examples/page_3.json')).json();
        const contenuLivre = await (await fetch('/assets/data/examples/livre_1.json')).json();
        const cartePage = { id: 'c1', module: 'Page', titre: 'La racine carrée', consigne: 'Lisez.', duree: 10, palier: 'decouverte', contenu: contenuPage };
        const carteLivre = { id: 'c2', module: 'Livre', titre: 'Le livre', consigne: 'Lisez.', duree: 10, palier: 'decouverte', contenu: contenuLivre };
        const plan = { titre: 'Parcours illustré', objectifGeneral: 'Voir.', etapes: [{ id: 'e1', titre: 'Découvrir', cartes: [cartePage, carteLivre] }] };
        // Comme l'atelier après « Enregistrer » dans l'éditeur : les octets vont dans
        // `carte.medias`, le contenu ne garde que le chemin (`recueillirMedias`).
        const editePage = structuredClone(contenuPage);
        editePage.blocks[i08].data.cards[0].img_file = A;
        editePage.blocks[i09].data.right.img_file = B;
        Object.assign(cartePage, await recueillirMedias(cartePage, editePage, plan));
        const editeLivre = structuredClone(contenuLivre);
        editeLivre.chapters[1].blocks.push({ type: '#13_monument_sheet_long', data: { title: 'Fiche', img_src: '', img_alt: 'Fiche', img_file: B, sections: [] } });
        Object.assign(carteLivre, await recueillirMedias(carteLivre, editeLivre, plan));
        ok('l\'atelier range les octets à part (carte.medias), le contenu garde le chemin',
            !JSON.stringify(cartePage.contenu).includes('data:image') && cartePage.medias?.[A.path] === A.dataURL && carteLivre.medias?.[B.path] === B.dataURL);
        const { construireFichiersActivite } = await import('/js/moodle/mono-activity-files.js');
        const apercu = await construireFichiersActivite('Page', contenuPourEdition(cartePage));
        ok('l\'aperçu de la carte montre les images', apercu.previewHtml.includes(A.dataURL) && apercu.previewHtml.includes(B.dataURL));

        const cours = await assemblerParcours(plan, { platformId: 'elea', timestamp: 1790000000 });
        ok('aucune carte écartée', cours.exclues.length === 0, JSON.stringify(cours.exclues));
        const { fichiers, brut } = lireMbz(cours.bytes);
        const hA = await sha1(octetsDe(A.dataURL)), hB = await sha1(octetsDe(B.dataURL));
        const posee = nom => cours.activites.find(a => a.moduleName === nom);
        const pageDir = `activities/page_${posee('page').moduleId}`, bookDir = `activities/book_${posee('book').moduleId}`;
        const ctxPage = xml(fichiers[`${pageDir}/page.xml`]).documentElement.getAttribute('contextid');
        const ctxBook = xml(fichiers[`${bookDir}/book.xml`]).documentElement.getAttribute('contextid');
        const lp = entrees(fichiers['files.xml'], 'mod_page'), lb = entrees(fichiers['files.xml'], 'mod_book');
        ok('files.xml : les images de la Page visent son contexte RENUMÉROTÉ', lp.length === 3 && lp.every(f => f.contextid === ctxPage && f.filearea === 'content' && f.itemid === '0'), JSON.stringify(lp));
        ok('files.xml : l\'image du Livre vise son contexte et le chapitre 101', lb.length === 2 && lb.every(f => f.contextid === ctxBook && f.filearea === 'chapter' && f.itemid === '101'), JSON.stringify(lb));
        ok('identifiants de fichiers uniques dans le cours', new Set([...xml(fichiers['files.xml']).querySelectorAll('file')].map(n => n.getAttribute('id'))).size === xml(fichiers['files.xml']).querySelectorAll('file').length);
        ok('le pool contient les octets exacts', egaux(fichiers[`files/${hA.slice(0, 2)}/${hA}`], octetsDe(A.dataURL)) && egaux(fichiers[`files/${hB.slice(0, 2)}/${hB}`], octetsDe(B.dataURL)));
        const refs = d => [...xml(fichiers[`${d}/inforef.xml`]).querySelectorAll('fileref file id')].map(n => n.textContent).sort().join();
        ok('inforef.xml de la Page et du Livre référencent leurs fichiers', refs(pageDir) === lp.map(f => f.id).sort().join() && refs(bookDir) === lb.map(f => f.id).sort().join());
        const htmlPage = xml(fichiers[`${pageDir}/page.xml`]).querySelector('page > content').textContent;
        ok('page.xml du cours cite les images par @@PLUGINFILE@@', htmlPage.includes(`@@PLUGINFILE@@/image-${hA.slice(0, 12)}.png`) && htmlPage.includes(`@@PLUGINFILE@@/image-${hB.slice(0, 12)}.jpg`));
        ok('aucune dataURL dans le .mbz du cours', !new TextDecoder('latin1').decode(brut).includes('data:image'));
        const doc = construireCoursDocumentaire(plan).activities.find(a => a.moduleKey === 'Page').jsonData;
        ok('le cours documentaire (fiche) reçoit l\'image dans img_src', doc.blocks[i08].data.cards[0].img_src === A.dataURL && !JSON.stringify(doc).includes('img_file'));
    });

    // --- Export en document (DOCX / ODT / PDF) -----------------------------
    await groupe('Document', async ok => {
        const { imagesEnvoyeesPourDocument } = await import('/js/moodle/page-images.js');
        const d = imagesEnvoyeesPourDocument(page);
        ok('l\'image envoyée prend la place de l\'adresse', d.blocks[i08].data.cards[0].img_src === A.dataURL && d.blocks[i09].data.left.img_src === B.dataURL);
        ok('la fausse image garde l\'adresse d\'origine', d.blocks[i16].data.img_src === url16);
        ok('copie : l\'original est intact, img_file retiré de la copie', JSON.stringify(page) === avant && !JSON.stringify(d).includes('img_file'));
        const { hydrateImagesForExport } = await import('/js/ui/notifications.js');
        const h = await hydrateImagesForExport(null, page);
        ok('hydrateImagesForExport (voie des boutons DOCX/ODT/PDF) applique le remplacement', h.blocks[i13].data.img_src === A.dataURL);
        const { formatContentForDocument } = await import('/js/export/document-formatter.js');
        const document = await formatContentForDocument('Page', h, { keepLatex: true });
        const image13 = document.sections.find(s => s.type === 'image' && s.url === A.dataURL && s.alt === h.blocks[i13].data.img_alt);
        ok('#13_monument_sheet_long devient une image dans les DOCX/ODT/PDF', !!image13,
            JSON.stringify(document.sections.filter(s => s.type === 'image').map(s => [s.url?.slice(0, 32), s.alt])));
    });

    // --- Éditeur ------------------------------------------------------------
    await groupe('Éditeur', async ok => {
        await import('/js/editor/index.js');
        const { getPageBlockSchema } = await import('/js/editor/field-renderers.js');
        const ordre = s => Object.keys(s).join(',');
        const s08 = getPageBlockSchema('#08_monuments_grid').cards.itemSchema;
        const s09 = getPageBlockSchema('#09_figures_comparison');
        ok('#08 : img_file juste après img_src', ordre(s08) === 'img_src,img_file,img_alt,caption,title,text', ordre(s08));
        ok('#09 : img_file juste après img_src, à gauche et à droite', ordre(s09.left.schema) === 'img_src,img_file,img_alt,caption' && ordre(s09.right.schema) === 'img_src,img_file,img_alt,caption');
        ok('#13 et #16 : img_file juste après img_src', ordre(getPageBlockSchema('#13_monument_sheet_long')) === 'title,img_src,img_file,img_alt,sections'
            && ordre(getPageBlockSchema('#16_method_image_desc')) === 'title,steps,img_src,img_file,img_alt,caption');
        const f = s08.img_file;
        ok('le champ est le widget image de l\'éditeur, processeur « fond »', f.type === 'image' && f.imageProcessor === 'background' && f.label === 'editor_image' && f.hint === 'editor_page_image_upload_hint');
        ok('greffe idempotente (un seul img_file)', Object.keys(s08).filter(k => k === 'img_file').length === 1);
        const { t } = await import('/js/core/translation.js');
        ok('l\'aide du champ est traduite', t('editor_page_image_upload_hint') !== 'editor_page_image_upload_hint');
    });

    return verdicts;
}

/** Les correctifs à désarmer, et les groupes qui doivent virer au rouge. */
const CONTRE_EPREUVES = [
    {
        nom: 'extraction des images désarmée (page-images.js)',
        fichier: 'js/moodle/page-images.js',
        de: 'export async function extraireImagesEnvoyees(donnees, type) {',
        vers: 'export async function extraireImagesEnvoyees(donnees, type) { return { donnees, paquet: null, apercu: new Map() };',
        rouges: ['Page seule', 'Livre seul', 'Parcours'],
    },
    {
        nom: 'transmission du paquet au parcours désarmée (parcours-builder.js)',
        fichier: 'js/parcours/parcours-builder.js',
        de: '...(paquet ? { paquet } : {})',
        vers: '',
        rouges: ['Parcours'],
        verts: ['Page seule', 'Livre seul'],
    },
    {
        nom: 'réhydratation des octets de carte.medias désarmée (parcours-builder.js)',
        fichier: 'js/parcours/parcours-builder.js',
        de: 'const contenu = carte.medias ? contenuPourEdition(carte) : carte.contenu;',
        vers: 'const contenu = carte.contenu;',
        rouges: ['Parcours'],
        verts: ['Page seule', 'Livre seul'],
    },
    {
        nom: 'formatage documentaire du bloc #13 désarmé (document-formatter.js)',
        fichier: 'js/export/document-formatter.js',
        de: "case '#13_monument_sheet_long':",
        vers: "case '#13_monument_sheet_long_desactive':",
        rouges: ['Document'],
        verts: ['Page seule', 'Livre seul', 'Parcours'],
    },
];

let browser;
let echecs = 0;
try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch();

    const ouvrir = async (desarme) => {
        const contexte = await browser.newContext();
        const page = await contexte.newPage();
        const erreurs = [];
        page.on('pageerror', e => erreurs.push(e.message));
        await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
        if (desarme) {
            const source = readFileSync(resolve(root, desarme.fichier), 'utf8');
            if (source.split(desarme.de).length !== 2) throw new Error(`contre-épreuve « ${desarme.nom} » : motif introuvable ou ambigu dans ${desarme.fichier}`);
            await page.route(`**/${desarme.fichier}`, r => r.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: source.replace(desarme.de, desarme.vers) }));
        }
        await page.goto(`http://127.0.0.1:${port}/index.html`);
        await page.waitForSelector('#parcours-button');
        return { contexte, page, erreurs };
    };

    // 1. Correctifs en place : tout doit être vert.
    console.log('\n=== Images envoyées dans la Page et le Livre ===\n');
    {
        const { contexte, page, erreurs } = await ouvrir(null);
        const verdicts = await page.evaluate(verifier);
        let groupeCourant = '';
        for (const [nom, succes, detail] of verdicts) {
            const g = nom.split(' : ')[0];
            if (g !== groupeCourant) { console.log(`  ${g}`); groupeCourant = g; }
            console.log(`    ${succes ? '✓' : '✗'} ${nom.slice(g.length + 3)}${succes ? '' : `\n        ${detail}`}`);
            if (!succes) echecs++;
        }
        if (erreurs.length) { echecs++; console.log(`  ✗ erreurs JavaScript : ${erreurs.join(' | ')}`); }
        else console.log('  ✓ aucune erreur JavaScript');
        console.log(`\n  ${verdicts.filter(v => v[1]).length}/${verdicts.length} vérifications vertes`);
        await contexte.close();
    }

    // 2. Contre-épreuves : chaque correctif désarmé doit faire virer au rouge.
    console.log('\n=== Contre-épreuves (correctif désarmé → rouge exigé) ===\n');
    for (const ce of CONTRE_EPREUVES) {
        const { contexte, page } = await ouvrir(ce);
        const verdicts = await page.evaluate(verifier);
        const rougesDe = g => verdicts.filter(v => v[0].startsWith(`${g} : `) && !v[1]).length;
        const rouges = ce.rouges.every(g => rougesDe(g) > 0);
        const verts = (ce.verts || []).every(g => rougesDe(g) === 0);
        const bilan = ce.rouges.map(g => `${g} ${rougesDe(g)} rouge(s)`).concat((ce.verts || []).map(g => `${g} ${rougesDe(g)} rouge(s)`)).join(', ');
        console.log(`  ${rouges && verts ? '✓' : '✗'} ${ce.nom} → ${bilan}`);
        if (!rouges || !verts) echecs++;
        await contexte.close();
    }

    console.log(`\nImages de Page : ${echecs ? `${echecs} ÉCHEC(S)` : 'tout est vert, contre-épreuves au rouge'}`);
    if (echecs) process.exitCode = 1;
} catch (e) {
    console.error(e);
    process.exitCode = 1;
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
