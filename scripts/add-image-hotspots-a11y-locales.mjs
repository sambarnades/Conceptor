#!/usr/bin/env node
/**
 * Ajoute les clés i18n des correctifs de l'audit « Image interactive » (2026-07) :
 *  - h5p_untitled_hotspot / h5p_contains_audio_video : libellés d'accessibilité du
 *    content.json ImageHotspots, auparavant hardcodés bilingues (audit N8) ;
 *  - error_media_missing : message affiché quand un média référencé par le content.json
 *    n'a plus de blob en mémoire au packaging (audit N1).
 *
 * Idempotent : n'écrit que les clés ABSENTES, insérées juste après `h5p_close`.
 * Usage : node scripts/add-image-hotspots-a11y-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'h5p_close';

const ORDER = ['h5p_untitled_hotspot', 'h5p_contains_audio_video', 'error_media_missing', 'validation_ih_block_empty',
    'editor_image_hint_background', 'editor_image_error_format_background', 'editor_image_error_size_background'];

const T = {
    h5p_untitled_hotspot: {
        fr: 'Point sans titre', en: 'Untitled hotspot', es: 'Punto sin título',
        de: 'Unbenannter Punkt', it: 'Punto senza titolo', nl: 'Naamloos punt',
        pt: 'Ponto sem título', ar: 'نقطة بلا عنوان', zh: '无标题热点',
        jp: '無題のホットスポット', el: 'Σημείο χωρίς τίτλο'
    },
    h5p_contains_audio_video: {
        fr: 'Contient de l\'audio ou de la vidéo', en: 'Contains audio or video',
        es: 'Contiene audio o vídeo', de: 'Enthält Audio oder Video',
        it: 'Contiene audio o video', nl: 'Bevat audio of video',
        pt: 'Contém áudio ou vídeo', ar: 'يحتوي على صوت أو فيديو',
        zh: '包含音频或视频', jp: '音声または動画を含む', el: 'Περιέχει ήχο ή βίντεο'
    },
    editor_image_hint_background: {
        fr: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — max 12 Mo',
        en: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — max 12 MB',
        es: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — máx. 12 MB',
        de: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — max. 12 MB',
        it: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — max 12 MB',
        nl: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — max. 12 MB',
        pt: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — máx. 12 MB',
        ar: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — بحد أقصى 12 م.ب',
        zh: 'JPEG、PNG、WebP、HEIC、TIFF、AVIF、BMP、SVG — 最大 12 MB',
        jp: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — 最大 12 MB',
        el: 'JPEG, PNG, WebP, HEIC, TIFF, AVIF, BMP, SVG — έως 12 MB'
    },
    editor_image_error_format_background: {
        fr: 'Format non supporté pour l\'image de fond.',
        en: 'Unsupported format for the background image.',
        es: 'Formato no compatible para la imagen de fondo.',
        de: 'Nicht unterstütztes Format für das Hintergrundbild.',
        it: 'Formato non supportato per l\'immagine di sfondo.',
        nl: 'Niet-ondersteund formaat voor de achtergrondafbeelding.',
        pt: 'Formato não suportado para a imagem de fundo.',
        ar: 'صيغة غير مدعومة لصورة الخلفية.',
        zh: '背景图片格式不受支持。',
        jp: '背景画像のフォーマットはサポートされていません。',
        el: 'Μη υποστηριζόμενη μορφή για την εικόνα φόντου.'
    },
    editor_image_error_size_background: {
        fr: 'Image trop volumineuse (max 12 Mo).',
        en: 'Image too large (max 12 MB).',
        es: 'Imagen demasiado grande (máx. 12 MB).',
        de: 'Bild zu groß (max. 12 MB).',
        it: 'Immagine troppo grande (max 12 MB).',
        nl: 'Afbeelding te groot (max. 12 MB).',
        pt: 'Imagem demasiado grande (máx. 12 MB).',
        ar: 'الصورة كبيرة جدًا (بحد أقصى 12 م.ب).',
        zh: '图片过大（最大 12 MB）。',
        jp: '画像が大きすぎます（最大 12 MB）。',
        el: 'Η εικόνα είναι πολύ μεγάλη (έως 12 MB).'
    },
    validation_ih_block_empty: {
        fr: 'Le point {n} a un bloc « {type} » sans contenu : complétez-le ou supprimez le bloc.',
        en: 'Hotspot {n} has an empty "{type}" block: fill it in or remove the block.',
        es: 'El punto {n} tiene un bloque «{type}» vacío: complételo o elimine el bloque.',
        de: 'Punkt {n} hat einen leeren „{type}“-Block: Füllen Sie ihn aus oder entfernen Sie den Block.',
        it: 'Il punto {n} ha un blocco «{type}» vuoto: completalo o rimuovi il blocco.',
        nl: 'Punt {n} heeft een leeg "{type}"-blok: vul het in of verwijder het blok.',
        pt: 'O ponto {n} tem um bloco «{type}» vazio: preencha-o ou remova o bloco.',
        ar: 'النقطة {n} تحتوي على كتلة «{type}» فارغة: أكملها أو احذف الكتلة.',
        zh: '热点 {n} 有一个空的“{type}”内容块：请填写或删除该块。',
        jp: 'ホットスポット {n} に空の「{type}」ブロックがあります。内容を入力するか、ブロックを削除してください。',
        el: 'Το σημείο {n} έχει κενό μπλοκ «{type}»: συμπληρώστε το ή αφαιρέστε το μπλοκ.'
    },
    error_media_missing: {
        fr: 'Un média de l\'activité (image de fond ?) n\'est plus en mémoire. Re-téléversez le fichier puis relancez la création.',
        en: 'A media file used by the activity (background image?) is no longer in memory. Upload the file again, then retry the creation.',
        es: 'Un archivo multimedia de la actividad (¿imagen de fondo?) ya no está en memoria. Vuelva a subir el archivo y reinicie la creación.',
        de: 'Eine Mediendatei der Aktivität (Hintergrundbild?) ist nicht mehr im Speicher. Laden Sie die Datei erneut hoch und starten Sie die Erstellung neu.',
        it: 'Un file multimediale dell\'attività (immagine di sfondo?) non è più in memoria. Ricarica il file e riavvia la creazione.',
        nl: 'Een mediabestand van de activiteit (achtergrondafbeelding?) is niet meer in het geheugen. Upload het bestand opnieuw en start het aanmaken opnieuw.',
        pt: 'Um ficheiro multimédia da atividade (imagem de fundo?) já não está em memória. Volte a carregar o ficheiro e reinicie a criação.',
        ar: 'أحد ملفات الوسائط في النشاط (صورة الخلفية؟) لم يعد في الذاكرة. أعد رفع الملف ثم أعد إنشاء النشاط.',
        zh: '活动中的某个媒体文件（背景图片？）已不在内存中。请重新上传文件，然后重新创建。',
        jp: 'アクティビティで使用されるメディアファイル（背景画像？）がメモリにありません。ファイルを再アップロードしてから、作成をやり直してください。',
        el: 'Ένα αρχείο πολυμέσων της δραστηριότητας (εικόνα φόντου;) δεν βρίσκεται πλέον στη μνήμη. Ανεβάστε ξανά το αρχείο και επαναλάβετε τη δημιουργία.'
    }
};

let report = [];
for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const json = JSON.parse(readFileSync(path, 'utf8'));
    const missing = ORDER.filter(k => !(k in json));
    if (missing.length === 0) { report.push(`${lang}: +0`); continue; }

    const out = {};
    let inserted = false;
    for (const [k, v] of Object.entries(json)) {
        out[k] = v;
        if (k === ANCHOR) {
            for (const nk of ORDER) {
                if (!(nk in json)) out[nk] = (T[nk] && T[nk][lang]) || T[nk].fr;
            }
            inserted = true;
        }
    }
    // Repli : si l'ancre n'existe pas dans cette locale, on ajoute en fin.
    if (!inserted) {
        for (const nk of ORDER) {
            if (!(nk in out)) out[nk] = (T[nk] && T[nk][lang]) || T[nk].fr;
        }
    }
    writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
    report.push(`${lang}: +${missing.length}`);
}
console.log('Clés Image interactive (a11y + média manquant) ajoutées →', report.join(' | '));
