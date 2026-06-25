#!/usr/bin/env node
/**
 * Ajoute les clés i18n de la refonte UX de la barre « lien vidéo » (champ intelligent + popover
 * d'aide + popover « Voir / coller ») dans les 11 locales.
 *
 * Idempotent : n'écrit que les clés ABSENTES. Les nouvelles clés sont insérées juste après
 * `video_paste_ok` pour rester groupées avec les autres clés `video_*`.
 * Usage : node scripts/add-video-ui-v2-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'video_paste_ok'; // insérer les nouvelles clés juste après celle-ci

// Ordre d'insertion des nouvelles clés.
const ORDER = [
    'video_see_transcript', 'video_help_title', 'video_help_intro',
    'video_help_peertube', 'video_help_podeduc', 'video_help_youtube',
    'video_help_status_ok', 'video_help_status_soon', 'video_help_status_beta',
    'video_help_steps', 'video_transcript_title', 'video_transcript_segments',
    'video_transcript_plain', 'video_transcript_replace', 'video_manual_short',
    'video_paste_cta', 'video_retry', 'video_checking_msg', 'video_error_network'
];

const T = {
    video_see_transcript: { fr: 'Voir', en: 'View', es: 'Ver', de: 'Ansehen', it: 'Vedi', nl: 'Bekijken', pt: 'Ver', ar: 'عرض', zh: '查看', jp: '表示', el: 'Προβολή' },
    video_help_title: { fr: 'Quelles vidéos utiliser ?', en: 'Which videos can I use?', es: '¿Qué vídeos puedo usar?', de: 'Welche Videos kann ich verwenden?', it: 'Quali video posso usare?', nl: "Welke video's kan ik gebruiken?", pt: 'Que vídeos posso usar?', ar: 'ما الفيديوهات التي يمكنني استخدامها؟', zh: '可以使用哪些视频？', jp: 'どの動画が使えますか？', el: 'Ποια βίντεο μπορώ να χρησιμοποιήσω;' },
    video_help_intro: {
        fr: 'Collez le lien d’une vidéo : Caramel détecte la vidéo, récupère la transcription, puis l’IA place les questions aux bons moments. Le champ passe au vert quand tout est prêt.',
        en: 'Paste a video link: Caramel detects the video, fetches the transcript, then the AI places questions at the right moments. The field turns green when everything is ready.',
        es: 'Pega el enlace de un vídeo: Caramel detecta el vídeo, obtiene la transcripción y la IA coloca las preguntas en los momentos adecuados. El campo se pone verde cuando todo está listo.',
        de: 'Fügen Sie einen Video-Link ein: Caramel erkennt das Video, holt das Transkript, dann platziert die KI die Fragen an den richtigen Stellen. Das Feld wird grün, sobald alles bereit ist.',
        it: 'Incolla il link di un video: Caramel rileva il video, recupera la trascrizione, poi l’IA inserisce le domande nei momenti giusti. Il campo diventa verde quando tutto è pronto.',
        nl: 'Plak een videolink: Caramel detecteert de video, haalt het transcript op en de AI plaatst vragen op de juiste momenten. Het veld wordt groen zodra alles klaar is.',
        pt: 'Cole o link de um vídeo: o Caramel deteta o vídeo, obtém a transcrição e a IA coloca as perguntas nos momentos certos. O campo fica verde quando tudo está pronto.',
        ar: 'ألصق رابط فيديو: يكتشف Caramel الفيديو ويجلب النص ثم يضع الذكاء الاصطناعي الأسئلة في اللحظات المناسبة. يتحوّل الحقل إلى الأخضر عندما يصبح كل شيء جاهزًا.',
        zh: '粘贴视频链接：Caramel 会检测视频、获取字幕，然后由 AI 在合适的时刻插入题目。一切就绪后，输入框会变绿。',
        jp: '動画のリンクを貼り付けると、Caramel が動画を検出して文字起こしを取得し、AI が適切なタイミングで問題を配置します。準備が整うと入力欄が緑色になります。',
        el: 'Επικολλήστε τον σύνδεσμο ενός βίντεο: το Caramel εντοπίζει το βίντεο, ανακτά τη μεταγραφή και η ΤΝ τοποθετεί τις ερωτήσεις στις σωστές στιγμές. Το πεδίο γίνεται πράσινο όταν όλα είναι έτοιμα.'
    },
    video_help_peertube: {
        fr: 'PeerTube (apps.education) — ex. https://tube-…apps.education.fr/w/…',
        en: 'PeerTube (apps.education) — e.g. https://tube-…apps.education.fr/w/…',
        es: 'PeerTube (apps.education) — p. ej. https://tube-…apps.education.fr/w/…',
        de: 'PeerTube (apps.education) — z. B. https://tube-…apps.education.fr/w/…',
        it: 'PeerTube (apps.education) — es. https://tube-…apps.education.fr/w/…',
        nl: 'PeerTube (apps.education) — bijv. https://tube-…apps.education.fr/w/…',
        pt: 'PeerTube (apps.education) — ex.: https://tube-…apps.education.fr/w/…',
        ar: 'PeerTube (apps.education) — مثال: https://tube-…apps.education.fr/w/…',
        zh: 'PeerTube（apps.education）——如 https://tube-…apps.education.fr/w/…',
        jp: 'PeerTube（apps.education）— 例：https://tube-…apps.education.fr/w/…',
        el: 'PeerTube (apps.education) — π.χ. https://tube-…apps.education.fr/w/…'
    },
    video_help_podeduc: { fr: 'PodEduc (apps.education)', en: 'PodEduc (apps.education)', es: 'PodEduc (apps.education)', de: 'PodEduc (apps.education)', it: 'PodEduc (apps.education)', nl: 'PodEduc (apps.education)', pt: 'PodEduc (apps.education)', ar: 'PodEduc (apps.education)', zh: 'PodEduc（apps.education）', jp: 'PodEduc（apps.education）', el: 'PodEduc (apps.education)' },
    video_help_youtube: { fr: 'YouTube et autres sources', en: 'YouTube and other sources', es: 'YouTube y otras fuentes', de: 'YouTube und andere Quellen', it: 'YouTube e altre fonti', nl: 'YouTube en andere bronnen', pt: 'YouTube e outras fontes', ar: 'YouTube ومصادر أخرى', zh: 'YouTube 及其他来源', jp: 'YouTube やその他のソース', el: 'YouTube και άλλες πηγές' },
    video_help_status_ok: { fr: 'Pris en charge', en: 'Supported', es: 'Compatible', de: 'Unterstützt', it: 'Supportato', nl: 'Ondersteund', pt: 'Suportado', ar: 'مدعوم', zh: '已支持', jp: '対応', el: 'Υποστηρίζεται' },
    video_help_status_soon: { fr: 'Bientôt', en: 'Coming soon', es: 'Próximamente', de: 'Demnächst', it: 'Presto', nl: 'Binnenkort', pt: 'Em breve', ar: 'قريبًا', zh: '即将推出', jp: '近日対応', el: 'Σύντομα' },
    video_help_status_beta: { fr: 'Expérimental', en: 'Experimental', es: 'Experimental', de: 'Experimentell', it: 'Sperimentale', nl: 'Experimenteel', pt: 'Experimental', ar: 'تجريبي', zh: '实验性', jp: '実験的', el: 'Πειραματικό' },
    video_help_steps: {
        fr: 'Pas de transcription automatique ? Ouvrez « Voir / coller » et collez un sous-titrage (WebVTT, SRT) ou le texte de la vidéo.',
        en: 'No automatic transcript? Open “View / paste” and paste subtitles (WebVTT, SRT) or the video text.',
        es: '¿Sin transcripción automática? Abre «Ver / pegar» y pega subtítulos (WebVTT, SRT) o el texto del vídeo.',
        de: 'Kein automatisches Transkript? Öffnen Sie „Ansehen / einfügen“ und fügen Sie Untertitel (WebVTT, SRT) oder den Videotext ein.',
        it: 'Nessuna trascrizione automatica? Apri «Vedi / incolla» e incolla i sottotitoli (WebVTT, SRT) o il testo del video.',
        nl: 'Geen automatisch transcript? Open “Bekijken / plakken” en plak ondertitels (WebVTT, SRT) of de videotekst.',
        pt: 'Sem transcrição automática? Abra «Ver / colar» e cole legendas (WebVTT, SRT) ou o texto do vídeo.',
        ar: 'لا يوجد نص تلقائي؟ افتح «عرض / لصق» وألصق ترجمة (WebVTT أو SRT) أو نص الفيديو.',
        zh: '没有自动字幕？打开“查看 / 粘贴”，粘贴字幕（WebVTT、SRT）或视频文本。',
        jp: '自動の文字起こしがない場合は「表示 / 貼り付け」を開き、字幕（WebVTT、SRT）または動画のテキストを貼り付けてください。',
        el: 'Δεν υπάρχει αυτόματη μεταγραφή; Ανοίξτε «Προβολή / επικόλληση» και επικολλήστε υπότιτλους (WebVTT, SRT) ή το κείμενο του βίντεο.'
    },
    video_transcript_title: { fr: 'Transcription', en: 'Transcript', es: 'Transcripción', de: 'Transkript', it: 'Trascrizione', nl: 'Transcript', pt: 'Transcrição', ar: 'النص', zh: '字幕', jp: '文字起こし', el: 'Μεταγραφή' },
    video_transcript_segments: { fr: '{n} passages récupérés.', en: '{n} passages retrieved.', es: '{n} fragmentos recuperados.', de: '{n} Abschnitte abgerufen.', it: '{n} passaggi recuperati.', nl: '{n} fragmenten opgehaald.', pt: '{n} passagens recuperadas.', ar: 'تم استرجاع {n} مقطعًا.', zh: '已获取 {n} 段。', jp: '{n} 件の区間を取得しました。', el: 'Ανακτήθηκαν {n} αποσπάσματα.' },
    video_transcript_plain: { fr: 'Transcription récupérée.', en: 'Transcript retrieved.', es: 'Transcripción recuperada.', de: 'Transkript abgerufen.', it: 'Trascrizione recuperata.', nl: 'Transcript opgehaald.', pt: 'Transcrição recuperada.', ar: 'تم استرجاع النص.', zh: '已获取字幕。', jp: '文字起こしを取得しました。', el: 'Η μεταγραφή ανακτήθηκε.' },
    video_transcript_replace: { fr: 'Remplacer par un collage manuel', en: 'Replace with a manual paste', es: 'Reemplazar con un pegado manual', de: 'Durch manuelles Einfügen ersetzen', it: 'Sostituisci con un incollaggio manuale', nl: 'Vervangen door handmatig plakken', pt: 'Substituir por colagem manual', ar: 'استبدال بلصق يدوي', zh: '改为手动粘贴', jp: '手動の貼り付けに置き換える', el: 'Αντικατάσταση με χειροκίνητη επικόλληση' },
    video_manual_short: { fr: 'Transcription automatique indisponible.', en: 'Automatic transcript unavailable.', es: 'Transcripción automática no disponible.', de: 'Automatisches Transkript nicht verfügbar.', it: 'Trascrizione automatica non disponibile.', nl: 'Automatisch transcript niet beschikbaar.', pt: 'Transcrição automática indisponível.', ar: 'النص التلقائي غير متوفر.', zh: '自动字幕不可用。', jp: '自動の文字起こしは利用できません。', el: 'Η αυτόματη μεταγραφή δεν είναι διαθέσιμη.' },
    video_paste_cta: { fr: 'Coller la transcription', en: 'Paste the transcript', es: 'Pegar la transcripción', de: 'Transkript einfügen', it: 'Incolla la trascrizione', nl: 'Transcript plakken', pt: 'Colar a transcrição', ar: 'لصق النص', zh: '粘贴字幕', jp: '文字起こしを貼り付け', el: 'Επικόλληση μεταγραφής' },
    video_retry: { fr: 'Réessayer', en: 'Retry', es: 'Reintentar', de: 'Erneut versuchen', it: 'Riprova', nl: 'Opnieuw proberen', pt: 'Tentar novamente', ar: 'إعادة المحاولة', zh: '重试', jp: '再試行', el: 'Επανάληψη' },
    video_checking_msg: {
        fr: 'Analyse de la vidéo et récupération de la transcription…',
        en: 'Analysing the video and fetching the transcript…',
        es: 'Analizando el vídeo y obteniendo la transcripción…',
        de: 'Video wird analysiert und Transkript abgerufen…',
        it: 'Analisi del video e recupero della trascrizione…',
        nl: 'Video analyseren en transcript ophalen…',
        pt: 'A analisar o vídeo e a obter a transcrição…',
        ar: 'جارٍ تحليل الفيديو واسترجاع النص…',
        zh: '正在分析视频并获取字幕…',
        jp: '動画を解析し、文字起こしを取得しています…',
        el: 'Ανάλυση του βίντεο και ανάκτηση της μεταγραφής…'
    },
    video_error_network: {
        fr: 'Erreur réseau pendant la détection. Vérifiez le lien et réessayez.',
        en: 'Network error during detection. Check the link and try again.',
        es: 'Error de red durante la detección. Comprueba el enlace e inténtalo de nuevo.',
        de: 'Netzwerkfehler bei der Erkennung. Prüfen Sie den Link und versuchen Sie es erneut.',
        it: 'Errore di rete durante il rilevamento. Controlla il link e riprova.',
        nl: 'Netwerkfout tijdens detectie. Controleer de link en probeer opnieuw.',
        pt: 'Erro de rede durante a deteção. Verifique o link e tente novamente.',
        ar: 'خطأ في الشبكة أثناء الكشف. تحقّق من الرابط وحاول مجددًا.',
        zh: '检测时网络出错。请检查链接后重试。',
        jp: '検出中にネットワークエラーが発生しました。リンクを確認して再試行してください。',
        el: 'Σφάλμα δικτύου κατά τον εντοπισμό. Ελέγξτε τον σύνδεσμο και δοκιμάστε ξανά.'
    }
};

let report = [];
for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const json = JSON.parse(readFileSync(path, 'utf8'));
    const missing = ORDER.filter(k => !(k in json));
    if (missing.length === 0) { report.push(`${lang}: +0`); continue; }

    // Reconstruire l'objet en insérant les clés manquantes juste après l'ancre.
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
console.log('Clés UX vidéo v2 ajoutées par locale →', report.join(' | '));
