#!/usr/bin/env node
/**
 * Support du texte brut (.txt) au dépôt de documents (6.3.2) — js/services/ocr.js.
 *
 * 1. Ajoute `txt_processing` : message d'état pendant la lecture du fichier
 *    (inséré juste après `odp_processing`, avec les autres extracteurs).
 * 2. Ajoute **TXT** à la liste des formats affichée dans la zone de dépôt
 *    (`drag_drop_text`), juste après PDF.
 *
 * Idempotent. Usage : node scripts/add-txt-support-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'odp_processing';
const ORDER = ['txt_processing'];

const T = {
    txt_processing: {
        fr: 'Lecture du fichier texte...', en: 'Reading text file...',
        es: 'Leyendo el archivo de texto...', de: 'Textdatei wird gelesen...',
        it: 'Lettura del file di testo...', nl: 'Tekstbestand wordt gelezen...',
        pt: 'A ler o ficheiro de texto...', ar: 'جارٍ قراءة الملف النصي...',
        zh: '正在读取文本文件…', jp: 'テキストファイルを読み込み中…',
        el: 'Ανάγνωση αρχείου κειμένου...'
    }
};

const AVANT = '(PDF, DOCX,';
const APRES = '(PDF, TXT, DOCX,';

for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const journal = [];

    if (ORDER.some(k => !(k in data)) && !(ANCHOR in data)) {
        console.error(`  ${lang} : ancre « ${ANCHOR} » introuvable — fichier ignoré`);
        process.exitCode = 1;
        continue;
    }

    const out = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'drag_drop_text' && typeof value === 'string' && value.includes(AVANT)) {
            out[key] = value.replace(AVANT, APRES);
            journal.push('drag_drop_text (+TXT)');
        } else {
            out[key] = value;
        }
        if (key === ANCHOR) {
            for (const newKey of ORDER) {
                if (!(newKey in data)) { out[newKey] = T[newKey][lang]; journal.push(newKey); }
            }
        }
    }

    if (journal.length === 0) { console.log(`  ${lang} : déjà à jour`); continue; }
    writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ${lang} : ${journal.join(', ')}`);
}

console.log('Terminé. Vérifier avec : node scripts/verify-all-locales.mjs');
