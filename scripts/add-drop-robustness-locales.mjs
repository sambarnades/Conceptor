#!/usr/bin/env node
/**
 * Ajoute les clés i18n du glisser-déposer robuste (js/services/ocr.js, 6.3.2) :
 *  - drop_no_file             : le dépôt ne contient aucun fichier exploitable
 *    (lien web glissé depuis un onglet, « fichier promis » d'une application,
 *    source qui ne renseigne ni dataTransfer.files ni items) ;
 *  - drop_folder_unsupported  : un DOSSIER a été déposé (refusé explicitement,
 *    au lieu du message « format non supporté » trompeur).
 *
 * Idempotent : n'écrit que les clés ABSENTES, insérées juste après
 * `error_unsupported_format`.
 * Usage : node scripts/add-drop-robustness-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'error_unsupported_format';

const ORDER = ['drop_no_file', 'drop_folder_unsupported'];

const T = {
    drop_no_file: {
        fr: "Aucun fichier dans ce dépôt. Glissez un fichier depuis votre ordinateur, ou utilisez le champ « lien web » ci-dessous.",
        en: 'No file in this drop. Drag a file from your computer, or use the "web link" field below.',
        es: 'No hay ningún archivo en esta acción. Arrastre un archivo desde su ordenador o utilice el campo «enlace web» de abajo.',
        de: 'Keine Datei in diesem Vorgang. Ziehen Sie eine Datei von Ihrem Computer hierher oder nutzen Sie das Feld „Weblink“ unten.',
        it: 'Nessun file in questo rilascio. Trascina un file dal tuo computer oppure usa il campo «link web» qui sotto.',
        nl: 'Geen bestand in deze actie. Sleep een bestand vanaf uw computer of gebruik het veld "weblink" hieronder.',
        pt: 'Nenhum ficheiro nesta ação. Arraste um ficheiro do seu computador ou utilize o campo «ligação web» abaixo.',
        ar: 'لا يوجد أي ملف في هذا الإفلات. اسحب ملفًا من جهازك، أو استخدم حقل «رابط الويب» أدناه.',
        zh: '此次拖放中没有文件。请从您的电脑拖入文件，或使用下方的“网页链接”栏。',
        jp: 'このドロップにファイルがありません。パソコンからファイルをドラッグするか、下の「ウェブリンク」欄をご利用ください。',
        el: 'Δεν υπάρχει αρχείο σε αυτή την απόθεση. Σύρετε ένα αρχείο από τον υπολογιστή σας ή χρησιμοποιήστε το πεδίο «σύνδεσμος ιστού» παρακάτω.'
    },
    drop_folder_unsupported: {
        fr: 'Un dossier ne peut pas être déposé : glissez les fichiers un par un.',
        en: 'A folder cannot be dropped: drag the files one by one.',
        es: 'No se puede soltar una carpeta: arrastre los archivos uno por uno.',
        de: 'Ein Ordner kann nicht abgelegt werden: Ziehen Sie die Dateien einzeln hierher.',
        it: 'Non è possibile rilasciare una cartella: trascina i file uno per uno.',
        nl: 'Een map kan niet worden neergezet: sleep de bestanden één voor één.',
        pt: 'Não é possível largar uma pasta: arraste os ficheiros um a um.',
        ar: 'لا يمكن إفلات مجلد: اسحب الملفات واحدًا تلو الآخر.',
        zh: '无法拖放文件夹：请逐个拖入文件。',
        jp: 'フォルダーはドロップできません。ファイルを1つずつドラッグしてください。',
        el: 'Δεν μπορείτε να αποθέσετε φάκελο: σύρετε τα αρχεία ένα προς ένα.'
    }
};

for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const data = JSON.parse(readFileSync(path, 'utf-8'));

    const missing = ORDER.filter(key => !(key in data));
    if (missing.length === 0) {
        console.log(`  ${lang} : déjà à jour`);
        continue;
    }
    if (!(ANCHOR in data)) {
        console.error(`  ${lang} : ancre « ${ANCHOR} » introuvable — fichier ignoré`);
        process.exitCode = 1;
        continue;
    }

    const out = {};
    for (const [key, value] of Object.entries(data)) {
        out[key] = value;
        if (key === ANCHOR) {
            for (const newKey of ORDER) {
                if (!(newKey in data)) out[newKey] = T[newKey][lang];
            }
        }
    }

    writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ${lang} : +${missing.length} clé(s) (${missing.join(', ')})`);
}

console.log('Terminé. Vérifier avec : node scripts/verify-all-locales.mjs');
