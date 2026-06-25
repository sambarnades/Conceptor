/**
 * Pré-compression Brotli + gzip des fichiers texte servis statiquement.
 *
 * Génère, à côté de chaque fichier compressible, une variante `.br` et `.gz`.
 * GitLab Pages (et la plupart des serveurs statiques) sert automatiquement la
 * variante pré-compressée quand le navigateur l'accepte (négociation de contenu
 * via `Accept-Encoding`), sinon le fichier d'origine. Gain transport ~70 % sur
 * du JS/CSS minifié, en plus de la minification (qui, elle, réécrit le source).
 *
 * Build-time uniquement : on pousse la qualité au maximum (Brotli 11, gzip 9),
 * le coût CPU n'a pas d'importance puisque c'est fait une fois en CI.
 *
 * Usage : node scripts/precompress.mjs [dossier-cible]   (défaut: .public)
 *
 * NB : on compresse aussi js/vendor/ — la compression transport profite autant
 * aux grosses libs (MathJax, h5p-standalone…) qu'au code applicatif. On ne
 * touche QUE les extensions texte de la whitelist (jamais images/polices/.h5p).
 */

import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync, brotliCompressSync, constants } from 'zlib';

// Extensions texte qui bénéficient de la compression. Tout le reste (png, jpg,
// woff2, ico, pdf, h5p, zip, br, gz…) est déjà compressé ou binaire → ignoré.
const COMPRESSIBLE = new Set([
    '.js', '.mjs', '.css', '.html', '.htm', '.json',
    '.svg', '.xml', '.txt', '.map', '.webmanifest',
]);

// En dessous de ce seuil, le gain ne couvre pas l'overhead (entêtes + une RTT
// de négociation) : on laisse le fichier d'origine servir tel quel.
const MIN_SIZE = 1400;

const targetDir = process.argv[2] || '.public';

let count = 0;
let rawTotal = 0;
let brTotal = 0;
let gzTotal = 0;

function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(p);
        } else if (entry.isFile()) {
            compress(p);
        }
    }
}

function compress(path) {
    if (!COMPRESSIBLE.has(extname(path).toLowerCase())) return;
    const buf = readFileSync(path);
    if (buf.length < MIN_SIZE) return;

    const gz = gzipSync(buf, { level: 9 });
    const br = brotliCompressSync(buf, {
        params: {
            [constants.BROTLI_PARAM_QUALITY]: 11,
            [constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
        },
    });

    writeFileSync(path + '.gz', gz);
    writeFileSync(path + '.br', br);

    count++;
    rawTotal += buf.length;
    gzTotal += gz.length;
    brTotal += br.length;
}

try {
    statSync(targetDir);
} catch {
    console.error(`  ERREUR: dossier introuvable : ${targetDir}`);
    process.exit(1);
}

walk(targetDir);

const ko = (n) => (n / 1024).toFixed(0);
const pct = (part) => rawTotal ? (100 - (100 * part) / rawTotal).toFixed(0) : '0';

console.log(`  ${count} fichiers pré-compressés (.br + .gz)`);
console.log(`  brut ${ko(rawTotal)} Ko → gzip ${ko(gzTotal)} Ko (-${pct(gzTotal)}%) | brotli ${ko(brTotal)} Ko (-${pct(brTotal)}%)`);
