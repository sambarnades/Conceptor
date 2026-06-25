#!/usr/bin/env node
/**
 * Injecte les clés i18n de la « Vidéo interactive » dans les 11 locales.
 *
 * - Les clés à forte visibilité (nom/description de la tuile, UI `video_*`, en-têtes d'export
 *   `doc_fmt_video_*`) sont traduites dans les 10 langues.
 * - Les clés secondaires (labels d'éditeur `editor_iv_*`, aide `eh_iv_*`, longs prompts
 *   `prompt_interactive_video_*`) retombent sur la valeur FR (repli) — à affiner ultérieurement.
 *
 * Idempotent : n'écrit que les clés ABSENTES de chaque locale (ne réécrase rien).
 * Usage : node scripts/add-interactive-video-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);

// Traductions des clés à forte visibilité. fr est la référence (déjà en place).
const T = {
    h5p_interactive_video_name: {
        en: 'Interactive video', es: 'Vídeo interactivo', de: 'Interaktives Video', it: 'Video interattivo',
        nl: 'Interactieve video', pt: 'Vídeo interativo', ar: 'فيديو تفاعلي', zh: '互动视频', jp: 'インタラクティブ動画', el: 'Διαδραστικό βίντεο'
    },
    h5p_interactive_video_description: {
        en: 'Turn a video (PeerTube apps.education) into an interactive activity: paste the link, Caramel fetches the transcript and places questions (MCQ, true/false, fill-in-the-blanks) at the right moments, with a final summary.',
        es: 'Convierte un vídeo (PeerTube apps.education) en una actividad interactiva: pega el enlace, Caramel obtiene la transcripción y coloca preguntas (opción múltiple, verdadero/falso, rellenar huecos) en los momentos adecuados, con un resumen final.',
        de: 'Verwandeln Sie ein Video (PeerTube apps.education) in eine interaktive Aktivität: Link einfügen, Caramel holt das Transkript und platziert Fragen (Multiple Choice, Wahr/Falsch, Lückentext) an den richtigen Stellen, mit abschließender Zusammenfassung.',
        it: 'Trasforma un video (PeerTube apps.education) in un\'attività interattiva: incolla il link, Caramel recupera la trascrizione e inserisce domande (a scelta multipla, vero/falso, completamento) nei momenti giusti, con un riepilogo finale.',
        nl: 'Maak van een video (PeerTube apps.education) een interactieve activiteit: plak de link, Caramel haalt het transcript op en plaatst vragen (meerkeuze, waar/onwaar, invuloefening) op de juiste momenten, met een eindsamenvatting.',
        pt: 'Transforme um vídeo (PeerTube apps.education) numa atividade interativa: cole o link, o Caramel obtém a transcrição e coloca perguntas (escolha múltipla, verdadeiro/falso, preenchimento) nos momentos certos, com um resumo final.',
        ar: 'حوّل فيديو (PeerTube apps.education) إلى نشاط تفاعلي: ألصق الرابط، يجلب Caramel النص ويضع الأسئلة (اختيار متعدد، صح/خطأ، ملء الفراغات) في اللحظات المناسبة، مع ملخص نهائي.',
        zh: '将视频（PeerTube apps.education）变成互动活动：粘贴链接，Caramel 获取字幕并在合适的时刻插入题目（选择题、判断题、填空题），并附最终总结。',
        jp: '動画（PeerTube apps.education）をインタラクティブな活動に変換します。リンクを貼り付けると、Caramel が文字起こしを取得し、適切なタイミングで問題（選択式・正誤・穴埋め）を配置し、最後に要約を付けます。',
        el: 'Μετατρέψτε ένα βίντεο (PeerTube apps.education) σε διαδραστική δραστηριότητα: επικολλήστε τον σύνδεσμο, το Caramel ανακτά τη μεταγραφή και τοποθετεί ερωτήσεις (πολλαπλής επιλογής, σωστό/λάθος, συμπλήρωση) στις σωστές στιγμές, με τελική σύνοψη.'
    },
    video_url_label: { en: 'Video link', es: 'Enlace del vídeo', de: 'Video-Link', it: 'Link del video', nl: 'Videolink', pt: 'Link do vídeo', ar: 'رابط الفيديو', zh: '视频链接', jp: '動画リンク', el: 'Σύνδεσμος βίντεο' },
    video_detect_btn: { en: 'Fetch the transcript', es: 'Obtener la transcripción', de: 'Transkript abrufen', it: 'Recupera la trascrizione', nl: 'Transcript ophalen', pt: 'Obter a transcrição', ar: 'جلب النص', zh: '获取字幕', jp: '文字起こしを取得', el: 'Λήψη μεταγραφής' },
    video_help_btn: { en: 'Help', es: 'Ayuda', de: 'Hilfe', it: 'Aiuto', nl: 'Help', pt: 'Ajuda', ar: 'مساعدة', zh: '帮助', jp: 'ヘルプ', el: 'Βοήθεια' },
    video_help_text: {
        en: 'Supported platforms: PeerTube apps.education (e.g. https://tube-…apps.education.fr/w/…). Click “Fetch the transcript”: Caramel detects the video and retrieves subtitles if available. Generation stays disabled until a playable video is detected.',
        es: 'Plataformas compatibles: PeerTube apps.education (p. ej. https://tube-…apps.education.fr/w/…). Haz clic en «Obtener la transcripción»: Caramel detecta el vídeo y recupera los subtítulos si existen. La generación permanece desactivada hasta detectar un vídeo reproducible.',
        de: 'Unterstützte Plattformen: PeerTube apps.education (z. B. https://tube-…apps.education.fr/w/…). Klicken Sie auf „Transkript abrufen“: Caramel erkennt das Video und holt ggf. Untertitel. Die Generierung bleibt deaktiviert, bis ein abspielbares Video erkannt wird.',
        it: 'Piattaforme supportate: PeerTube apps.education (es. https://tube-…apps.education.fr/w/…). Clicca su «Recupera la trascrizione»: Caramel rileva il video e recupera i sottotitoli se disponibili. La generazione resta disattivata finché non viene rilevato un video riproducibile.',
        nl: 'Ondersteunde platforms: PeerTube apps.education (bijv. https://tube-…apps.education.fr/w/…). Klik op “Transcript ophalen”: Caramel detecteert de video en haalt ondertitels op indien beschikbaar. Genereren blijft uitgeschakeld tot een afspeelbare video is gedetecteerd.',
        pt: 'Plataformas suportadas: PeerTube apps.education (ex.: https://tube-…apps.education.fr/w/…). Clique em «Obter a transcrição»: o Caramel deteta o vídeo e recupera as legendas, se existirem. A geração fica desativada até detetar um vídeo reproduzível.',
        ar: 'المنصات المدعومة: PeerTube apps.education (مثال: https://tube-…apps.education.fr/w/…). انقر على «جلب النص»: يكتشف Caramel الفيديو ويجلب الترجمات إن وُجدت. يظل التوليد معطّلاً حتى يُكتشف فيديو قابل للتشغيل.',
        zh: '支持的平台：PeerTube apps.education（如 https://tube-…apps.education.fr/w/…）。点击“获取字幕”：Caramel 会检测视频并在可用时获取字幕。在检测到可播放视频之前，生成保持禁用。',
        jp: '対応プラットフォーム：PeerTube apps.education（例：https://tube-…apps.education.fr/w/…）。「文字起こしを取得」をクリックすると、Caramel が動画を検出し、字幕があれば取得します。再生可能な動画が検出されるまで生成は無効のままです。',
        el: 'Υποστηριζόμενες πλατφόρμες: PeerTube apps.education (π.χ. https://tube-…apps.education.fr/w/…). Κάντε κλικ στο «Λήψη μεταγραφής»: το Caramel εντοπίζει το βίντεο και ανακτά υπότιτλους αν υπάρχουν. Η δημιουργία παραμένει ανενεργή μέχρι να εντοπιστεί αναπαραγώγιμο βίντεο.'
    },
    video_status_empty: { en: 'Paste a video link to enable generation.', es: 'Pega un enlace de vídeo para activar la generación.', de: 'Fügen Sie einen Video-Link ein, um die Generierung zu aktivieren.', it: 'Incolla un link video per attivare la generazione.', nl: 'Plak een videolink om genereren in te schakelen.', pt: 'Cole um link de vídeo para ativar a geração.', ar: 'ألصق رابط فيديو لتفعيل التوليد.', zh: '粘贴视频链接以启用生成。', jp: '生成を有効にするには動画リンクを貼り付けてください。', el: 'Επικολλήστε σύνδεσμο βίντεο για ενεργοποίηση της δημιουργίας.' },
    video_status_checking: { en: 'Detecting…', es: 'Detectando…', de: 'Erkennung…', it: 'Rilevamento…', nl: 'Detecteren…', pt: 'A detetar…', ar: 'جارٍ الكشف…', zh: '检测中…', jp: '検出中…', el: 'Εντοπισμός…' },
    video_status_ready: { en: 'Transcript ready — you can generate.', es: 'Transcripción lista: ya puedes generar.', de: 'Transkript bereit – Sie können generieren.', it: 'Trascrizione pronta: puoi generare.', nl: 'Transcript klaar — je kunt genereren.', pt: 'Transcrição pronta — pode gerar.', ar: 'النص جاهز — يمكنك التوليد.', zh: '字幕就绪——可以生成。', jp: '文字起こし準備完了——生成できます。', el: 'Η μεταγραφή είναι έτοιμη — μπορείτε να δημιουργήσετε.' },
    video_status_playable: { en: 'Playable video — audio transcript to be generated (one click).', es: 'Vídeo reproducible: transcripción de audio por generar (un clic).', de: 'Abspielbares Video – Audio-Transkript wird erzeugt (ein Klick).', it: 'Video riproducibile: trascrizione audio da generare (un clic).', nl: 'Afspeelbare video — audiotranscript nog te genereren (één klik).', pt: 'Vídeo reproduzível — transcrição de áudio a gerar (um clique).', ar: 'فيديو قابل للتشغيل — سيتم توليد النص الصوتي (بنقرة واحدة).', zh: '可播放视频——将生成音频字幕（一键）。', jp: '再生可能な動画——音声の文字起こしを生成します（ワンクリック）。', el: 'Αναπαραγώγιμο βίντεο — η μεταγραφή ήχου θα δημιουργηθεί (ένα κλικ).' },
    video_status_error: { en: 'Video not playable or unsupported platform (PeerTube apps.education).', es: 'Vídeo no reproducible o plataforma no compatible (PeerTube apps.education).', de: 'Video nicht abspielbar oder Plattform nicht unterstützt (PeerTube apps.education).', it: 'Video non riproducibile o piattaforma non supportata (PeerTube apps.education).', nl: 'Video niet afspeelbaar of niet-ondersteund platform (PeerTube apps.education).', pt: 'Vídeo não reproduzível ou plataforma não suportada (PeerTube apps.education).', ar: 'الفيديو غير قابل للتشغيل أو المنصة غير مدعومة (PeerTube apps.education).', zh: '视频无法播放或平台不受支持（PeerTube apps.education）。', jp: '動画を再生できないか、未対応のプラットフォームです（PeerTube apps.education）。', el: 'Το βίντεο δεν αναπαράγεται ή η πλατφόρμα δεν υποστηρίζεται (PeerTube apps.education).' },
    video_status_manual: { en: 'Paste the transcript below, then “Use this transcript”.', es: 'Pega la transcripción abajo y luego «Usar esta transcripción».', de: 'Fügen Sie das Transkript unten ein, dann „Dieses Transkript verwenden“.', it: 'Incolla la trascrizione qui sotto, poi «Usa questa trascrizione».', nl: 'Plak het transcript hieronder en klik op “Dit transcript gebruiken”.', pt: 'Cole a transcrição abaixo e depois «Usar esta transcrição».', ar: 'ألصق النص أدناه ثم «استخدام هذا النص».', zh: '在下方粘贴字幕，然后点击“使用此字幕”。', jp: '下に文字起こしを貼り付け、「この文字起こしを使う」をクリックしてください。', el: 'Επικολλήστε τη μεταγραφή παρακάτω και μετά «Χρήση αυτής της μεταγραφής».' },
    video_need_url: { en: 'Enter a video URL and fetch the transcript first.', es: 'Introduce primero una URL de vídeo y obtén la transcripción.', de: 'Geben Sie zuerst eine Video-URL ein und rufen Sie das Transkript ab.', it: 'Inserisci prima un URL video e recupera la trascrizione.', nl: 'Voer eerst een video-URL in en haal het transcript op.', pt: 'Introduza primeiro um URL de vídeo e obtenha a transcrição.', ar: 'أدخل أولاً رابط الفيديو واجلب النص.', zh: '请先输入视频网址并获取字幕。', jp: 'まず動画 URL を入力し、文字起こしを取得してください。', el: 'Εισαγάγετε πρώτα μια διεύθυνση βίντεο και ανακτήστε τη μεταγραφή.' },
    video_no_transcript_yet: { en: 'Automatic transcript unavailable: generating an example to edit (audio transcription coming soon).', es: 'Transcripción automática no disponible: se genera un ejemplo para editar (transcripción de audio próximamente).', de: 'Automatisches Transkript nicht verfügbar: Es wird ein bearbeitbares Beispiel erzeugt (Audio-Transkription folgt bald).', it: 'Trascrizione automatica non disponibile: viene generato un esempio da modificare (trascrizione audio in arrivo).', nl: 'Automatisch transcript niet beschikbaar: er wordt een voorbeeld gegenereerd om te bewerken (audiotranscriptie komt eraan).', pt: 'Transcrição automática indisponível: a gerar um exemplo para editar (transcrição de áudio em breve).', ar: 'النص التلقائي غير متوفر: يتم توليد مثال للتحرير (النسخ الصوتي قريبًا).', zh: '自动字幕不可用：正在生成可编辑示例（音频转写即将推出）。', jp: '自動文字起こしは利用できません：編集用のサンプルを生成します（音声の文字起こしは近日対応）。', el: 'Η αυτόματη μεταγραφή δεν είναι διαθέσιμη: δημιουργείται παράδειγμα προς επεξεργασία (η μεταγραφή ήχου έρχεται σύντομα).' },
    video_albert_failed: { en: 'Automatic transcript unavailable. Paste the transcript below, then “Use this transcript”.', es: 'Transcripción automática no disponible. Pega la transcripción abajo y luego «Usar esta transcripción».', de: 'Automatisches Transkript nicht verfügbar. Fügen Sie das Transkript unten ein, dann „Dieses Transkript verwenden“.', it: 'Trascrizione automatica non disponibile. Incolla la trascrizione qui sotto, poi «Usa questa trascrizione».', nl: 'Automatisch transcript niet beschikbaar. Plak het transcript hieronder en klik op “Dit transcript gebruiken”.', pt: 'Transcrição automática indisponível. Cole a transcrição abaixo e depois «Usar esta transcrição».', ar: 'النص التلقائي غير متوفر. ألصق النص أدناه ثم «استخدام هذا النص».', zh: '自动字幕不可用。请在下方粘贴字幕，然后点击“使用此字幕”。', jp: '自動文字起こしは利用できません。下に文字起こしを貼り付け、「この文字起こしを使う」をクリックしてください。', el: 'Η αυτόματη μεταγραφή δεν είναι διαθέσιμη. Επικολλήστε τη μεταγραφή παρακάτω και μετά «Χρήση αυτής της μεταγραφής».' },
    video_manual_toggle: { en: 'Paste the transcript manually', es: 'Pegar la transcripción manualmente', de: 'Transkript manuell einfügen', it: 'Incolla la trascrizione manualmente', nl: 'Transcript handmatig plakken', pt: 'Colar a transcrição manualmente', ar: 'ألصق النص يدويًا', zh: '手动粘贴字幕', jp: '文字起こしを手動で貼り付け', el: 'Επικόλληση μεταγραφής χειροκίνητα' },
    video_paste_label: { en: 'Transcript (WebVTT, SRT or text)', es: 'Transcripción (WebVTT, SRT o texto)', de: 'Transkript (WebVTT, SRT oder Text)', it: 'Trascrizione (WebVTT, SRT o testo)', nl: 'Transcript (WebVTT, SRT of tekst)', pt: 'Transcrição (WebVTT, SRT ou texto)', ar: 'النص (WebVTT أو SRT أو نص)', zh: '字幕（WebVTT、SRT 或文本）', jp: '文字起こし（WebVTT、SRT またはテキスト）', el: 'Μεταγραφή (WebVTT, SRT ή κείμενο)' },
    video_paste_btn: { en: 'Use this transcript', es: 'Usar esta transcripción', de: 'Dieses Transkript verwenden', it: 'Usa questa trascrizione', nl: 'Dit transcript gebruiken', pt: 'Usar esta transcrição', ar: 'استخدام هذا النص', zh: '使用此字幕', jp: 'この文字起こしを使う', el: 'Χρήση αυτής της μεταγραφής' },
    video_paste_empty: { en: 'Paste a transcript first.', es: 'Pega primero una transcripción.', de: 'Fügen Sie zuerst ein Transkript ein.', it: 'Incolla prima una trascrizione.', nl: 'Plak eerst een transcript.', pt: 'Cole primeiro uma transcrição.', ar: 'ألصق نصًا أولاً.', zh: '请先粘贴字幕。', jp: 'まず文字起こしを貼り付けてください。', el: 'Επικολλήστε πρώτα μια μεταγραφή.' },
    video_paste_ok: { en: 'Transcript saved.', es: 'Transcripción guardada.', de: 'Transkript gespeichert.', it: 'Trascrizione salvata.', nl: 'Transcript opgeslagen.', pt: 'Transcrição guardada.', ar: 'تم حفظ النص.', zh: '字幕已保存。', jp: '文字起こしを保存しました。', el: 'Η μεταγραφή αποθηκεύτηκε.' },
    doc_fmt_video_title: { en: 'Interactive video', es: 'Vídeo interactivo', de: 'Interaktives Video', it: 'Video interattivo', nl: 'Interactieve video', pt: 'Vídeo interativo', ar: 'فيديو تفاعلي', zh: '互动视频', jp: 'インタラクティブ動画', el: 'Διαδραστικό βίντεο' },
    doc_fmt_video_at: { en: 'At', es: 'En', de: 'Bei', it: 'A', nl: 'Bij', pt: 'Em', ar: 'عند', zh: '在', jp: '時間', el: 'Στο' },
    doc_fmt_video_summary: { en: 'Summary', es: 'Resumen', de: 'Zusammenfassung', it: 'Riepilogo', nl: 'Samenvatting', pt: 'Resumo', ar: 'ملخص', zh: '总结', jp: '要約', el: 'Σύνοψη' }
};

const fr = JSON.parse(readFileSync(new URL('fr.json', ROOT), 'utf8'));
const NEW_KEYS = Object.keys(fr).filter(k =>
    k.startsWith('h5p_interactive_video_') || k.startsWith('video_') ||
    k.startsWith('editor_iv_') || k.startsWith('eh_iv_') ||
    k.startsWith('prompt_interactive_video_') || k.startsWith('doc_fmt_video_')
);

let report = [];
for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const json = JSON.parse(readFileSync(path, 'utf8'));
    let added = 0;
    for (const key of NEW_KEYS) {
        if (key in json) continue; // idempotent : ne pas réécraser
        const translated = (T[key] && T[key][lang]) || fr[key]; // repli FR si non traduit
        json[key] = translated;
        added++;
    }
    if (added > 0) {
        writeFileSync(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
    }
    report.push(`${lang}: +${added}`);
}
console.log('Clés IV ajoutées par locale →', report.join(' | '));
