/**
 * docx-image-type.mjs — Garde-fou du bug « DOCX qui demande une réparation à l'ouverture ».
 *
 * CAUSE (découverte 2026-07-06) : depuis docx 8.6, un `new ImageRun({...})` SANS champ
 * `type` écrit le média avec une extension `.undefined` → aucun `<Default Extension>` dans
 * `[Content_Types].xml` → Word considère le contenu illisible et propose de « réparer »
 * (le fichier s'ouvre après réparation). docx 8.5 mettait `.png` par défaut, d'où l'absence
 * de symptôme côté Caramel avant l'alignement des versions.
 *
 * CORRECTIF (`js/export/document-exporter.js`) : `type` dérivé du MIME (`docxImageType`) et
 * conversion PNG des formats non natifs (`ensureDocxCompatibleImage`). Ce banc épingle :
 *   1. le COMPORTEMENT de la lib vendorée (sans type → .undefined ; avec type → bonne ext.),
 *      qui justifie le correctif et casse si une MAJ de docx régressait/changeait l'API ;
 *   2. le mappage MIME → type docx (fonction pure réimplémentée à l'identique du correctif).
 *
 * Node pur (charge le bundle UMD, pas de navigateur). Lancer : node tests/roundtrip/docx-image-type.mjs
 *
 * @module tests/roundtrip/docx-image-type
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const DOCX_BUNDLE = join(REPO, 'js/vendor/docx/8.6.0/index.umd.js');

let passed = 0, failed = 0;
const fails = [];
function ok(cond, label, detail) {
    if (cond) passed++;
    else { failed++; fails.push({ label, detail }); console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}

// --- 1. Mappage MIME → type docx (copie fidèle de document-exporter.docxImageType) ---
const DOCX_IMAGE_TYPE_BY_MIME = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif', 'image/bmp': 'bmp'
};
const docxImageType = (mime) => DOCX_IMAGE_TYPE_BY_MIME[String(mime || '').toLowerCase().split(';')[0].trim()] || null;

console.log('=== 1. Mappage MIME → type docx ===');
ok(docxImageType('image/png') === 'png', 'image/png → png');
ok(docxImageType('image/jpeg') === 'jpg', 'image/jpeg → jpg');
ok(docxImageType('image/jpeg; charset=binary') === 'jpg', 'MIME avec paramètre → jpg');
ok(docxImageType('image/gif') === 'gif', 'image/gif → gif');
ok(docxImageType('image/bmp') === 'bmp', 'image/bmp → bmp');
ok(docxImageType('image/webp') === null, 'image/webp → null (à convertir en PNG)');
ok(docxImageType('image/svg+xml') === null, 'image/svg+xml → null (à convertir)');
ok(docxImageType('') === null && docxImageType(undefined) === null, 'MIME vide/absent → null');

// --- 2. Comportement de la lib docx vendorée (le cœur du bug) ---
console.log('=== 2. Comportement docx (extension du média selon `type`) ===');
const bundle = readFileSync(DOCX_BUNDLE, 'utf8');
const mod = { exports: {} };
const docx = new Function('module', 'exports', bundle + '\n;return (typeof docx!=="undefined")?docx:module.exports;')(mod, mod.exports);
const { Document, Packer, Paragraph, ImageRun } = docx;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function mediaExtsFor(imageRunOpts) {
    const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new ImageRun({ data: PNG, transformation: { width: 40, height: 40 }, ...imageRunOpts })] })] }] });
    const dir = mkdtempSync(join(tmpdir(), 'docx-it-'));
    writeFileSync(join(dir, 'a.docx'), await Packer.toBuffer(doc));
    execSync(`cd '${dir}' && unzip -qq a.docx`);
    const media = execSync(`ls '${join(dir, 'word/media')}' 2>/dev/null || true`).toString().trim().split('\n').filter(Boolean);
    const ct = readFileSync(join(dir, '[Content_Types].xml'), 'utf8');
    const declared = new Set([...ct.matchAll(/Extension="([a-zA-Z0-9]+)"/g)].map((m) => m[1].toLowerCase()));
    return { exts: media.map((f) => f.split('.').pop().toLowerCase()), declared };
}

// SANS type : reproduit le bug (.undefined non déclaré) — épingle la cause.
const sansType = await mediaExtsFor({});
ok(sansType.exts.includes('undefined'), 'SANS type → extension .undefined (bug reproduit)', sansType.exts.join(','));
ok(!sansType.declared.has('undefined'), '.undefined absent de [Content_Types] (déclencheur Word)', [...sansType.declared].join(','));

// AVEC type : le correctif — extension correcte ET déclarée.
for (const [type, extAttendue] of [['png', 'png'], ['jpg', 'jpg'], ['gif', 'gif'], ['bmp', 'bmp']]) {
    const r = await mediaExtsFor({ type });
    ok(r.exts.length === 1 && r.exts[0] === extAttendue, `type='${type}' → média .${extAttendue}`, r.exts.join(','));
    ok(r.declared.has(extAttendue), `.${extAttendue} déclaré dans [Content_Types]`, [...r.declared].join(','));
}

console.log(`\n${'='.repeat(50)}`);
console.log(`BILAN docx-image-type : ${passed} OK, ${failed} ÉCHEC(S)`);
if (failed) { for (const f of fails) console.log(`  - ${f.label}${f.detail ? ' :: ' + f.detail : ''}`); }
process.exit(failed ? 1 : 0);
