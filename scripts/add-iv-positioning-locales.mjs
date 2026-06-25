#!/usr/bin/env node
/**
 * Ajoute les clés i18n du positionnement & des options d'affichage des interactions de la
 * Vidéo interactive (groupe « Apparence & placement » + groupe « Adaptativité ») dans les 11 locales.
 *
 * Idempotent : n'écrit que les clés ABSENTES. Les nouvelles clés sont insérées juste après
 * `editor_iv_capture_hint` pour rester groupées avec les autres clés `editor_iv_*`.
 * Usage : node scripts/add-iv-positioning-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'editor_iv_capture_hint'; // insérer les nouvelles clés juste après celle-ci

// Ordre d'insertion des nouvelles clés.
const ORDER = [
    'editor_iv_group_appearance', 'editor_iv_display', 'editor_iv_display_button', 'editor_iv_display_poster',
    'editor_iv_placement', 'editor_iv_placement_center', 'editor_iv_placement_top_left', 'editor_iv_placement_top_right',
    'editor_iv_placement_bottom_left', 'editor_iv_placement_bottom_right', 'editor_iv_placement_bottom',
    'editor_iv_placement_full', 'editor_iv_placement_custom',
    'editor_iv_x', 'editor_iv_y', 'editor_iv_width', 'editor_iv_height',
    'editor_iv_label', 'editor_iv_visible_duration', 'editor_iv_button_on_mobile',
    'editor_iv_group_adaptivity', 'editor_iv_require_completion',
    'editor_iv_adapt_correct_message', 'editor_iv_adapt_correct_seek', 'editor_iv_adapt_correct_optout',
    'editor_iv_adapt_wrong_message', 'editor_iv_adapt_wrong_seek', 'editor_iv_adapt_wrong_optout'
];

const T = {
    editor_iv_group_appearance: { fr: 'Apparence et placement', en: 'Appearance and placement', es: 'Apariencia y posición', de: 'Darstellung und Platzierung', it: 'Aspetto e posizione', nl: 'Weergave en plaatsing', pt: 'Aparência e posição', ar: 'المظهر والموضع', zh: '外观与位置', jp: '表示と配置', el: 'Εμφάνιση και τοποθέτηση' },
    editor_iv_display: { fr: 'Mode d\'affichage', en: 'Display mode', es: 'Modo de visualización', de: 'Anzeigemodus', it: 'Modalità di visualizzazione', nl: 'Weergavemodus', pt: 'Modo de exibição', ar: 'وضع العرض', zh: '显示方式', jp: '表示モード', el: 'Λειτουργία εμφάνισης' },
    editor_iv_display_button: { fr: 'Bouton (ouverture au clic)', en: 'Button (opens on click)', es: 'Botón (se abre al hacer clic)', de: 'Schaltfläche (öffnet bei Klick)', it: 'Pulsante (si apre al clic)', nl: 'Knop (opent bij klik)', pt: 'Botão (abre ao clicar)', ar: 'زر (يفتح عند النقر)', zh: '按钮（点击打开）', jp: 'ボタン（クリックで開く）', el: 'Κουμπί (ανοίγει με κλικ)' },
    editor_iv_display_poster: { fr: 'Sur la vidéo (affichage direct)', en: 'On the video (shown directly)', es: 'Sobre el vídeo (se muestra directamente)', de: 'Auf dem Video (direkt angezeigt)', it: 'Sul video (mostrato direttamente)', nl: 'Op de video (direct getoond)', pt: 'No vídeo (exibido diretamente)', ar: 'على الفيديو (يظهر مباشرة)', zh: '显示在视频上（直接显示）', jp: '動画上に直接表示', el: 'Πάνω στο βίντεο (άμεση εμφάνιση)' },
    editor_iv_placement: { fr: 'Position', en: 'Position', es: 'Posición', de: 'Position', it: 'Posizione', nl: 'Positie', pt: 'Posição', ar: 'الموضع', zh: '位置', jp: '位置', el: 'Θέση' },
    editor_iv_placement_center: { fr: 'Centre', en: 'Center', es: 'Centro', de: 'Mitte', it: 'Centro', nl: 'Midden', pt: 'Centro', ar: 'الوسط', zh: '居中', jp: '中央', el: 'Κέντρο' },
    editor_iv_placement_top_left: { fr: 'Haut gauche', en: 'Top left', es: 'Arriba izquierda', de: 'Oben links', it: 'In alto a sinistra', nl: 'Linksboven', pt: 'Canto superior esquerdo', ar: 'أعلى اليسار', zh: '左上', jp: '左上', el: 'Επάνω αριστερά' },
    editor_iv_placement_top_right: { fr: 'Haut droite', en: 'Top right', es: 'Arriba derecha', de: 'Oben rechts', it: 'In alto a destra', nl: 'Rechtsboven', pt: 'Canto superior direito', ar: 'أعلى اليمين', zh: '右上', jp: '右上', el: 'Επάνω δεξιά' },
    editor_iv_placement_bottom_left: { fr: 'Bas gauche', en: 'Bottom left', es: 'Abajo izquierda', de: 'Unten links', it: 'In basso a sinistra', nl: 'Linksonder', pt: 'Canto inferior esquerdo', ar: 'أسفل اليسار', zh: '左下', jp: '左下', el: 'Κάτω αριστερά' },
    editor_iv_placement_bottom_right: { fr: 'Bas droite', en: 'Bottom right', es: 'Abajo derecha', de: 'Unten rechts', it: 'In basso a destra', nl: 'Rechtsonder', pt: 'Canto inferior direito', ar: 'أسفل اليمين', zh: '右下', jp: '右下', el: 'Κάτω δεξιά' },
    editor_iv_placement_bottom: { fr: 'Bandeau bas', en: 'Bottom bar', es: 'Banda inferior', de: 'Unteres Band', it: 'Banda inferiore', nl: 'Onderbalk', pt: 'Faixa inferior', ar: 'الشريط السفلي', zh: '底部横幅', jp: '下部バー', el: 'Κάτω λωρίδα' },
    editor_iv_placement_full: { fr: 'Plein cadre', en: 'Full frame', es: 'Marco completo', de: 'Vollbild', it: 'Schermo intero', nl: 'Volledig kader', pt: 'Quadro inteiro', ar: 'الإطار الكامل', zh: '全屏', jp: '全画面', el: 'Πλήρες πλαίσιο' },
    editor_iv_placement_custom: { fr: 'Personnalisé (coordonnées)', en: 'Custom (coordinates)', es: 'Personalizado (coordenadas)', de: 'Benutzerdefiniert (Koordinaten)', it: 'Personalizzato (coordinate)', nl: 'Aangepast (coördinaten)', pt: 'Personalizado (coordenadas)', ar: 'مخصّص (إحداثيات)', zh: '自定义（坐标）', jp: 'カスタム（座標）', el: 'Προσαρμοσμένο (συντεταγμένες)' },
    editor_iv_x: { fr: 'Position X (%)', en: 'X position (%)', es: 'Posición X (%)', de: 'X-Position (%)', it: 'Posizione X (%)', nl: 'X-positie (%)', pt: 'Posição X (%)', ar: 'الموضع الأفقي X (%)', zh: 'X 位置（%）', jp: 'X位置（%）', el: 'Θέση X (%)' },
    editor_iv_y: { fr: 'Position Y (%)', en: 'Y position (%)', es: 'Posición Y (%)', de: 'Y-Position (%)', it: 'Posizione Y (%)', nl: 'Y-positie (%)', pt: 'Posição Y (%)', ar: 'الموضع العمودي Y (%)', zh: 'Y 位置（%）', jp: 'Y位置（%）', el: 'Θέση Y (%)' },
    editor_iv_width: { fr: 'Largeur (%)', en: 'Width (%)', es: 'Ancho (%)', de: 'Breite (%)', it: 'Larghezza (%)', nl: 'Breedte (%)', pt: 'Largura (%)', ar: 'العرض (%)', zh: '宽度（%）', jp: '幅（%）', el: 'Πλάτος (%)' },
    editor_iv_height: { fr: 'Hauteur (%)', en: 'Height (%)', es: 'Alto (%)', de: 'Höhe (%)', it: 'Altezza (%)', nl: 'Hoogte (%)', pt: 'Altura (%)', ar: 'الارتفاع (%)', zh: '高度（%）', jp: '高さ（%）', el: 'Ύψος (%)' },
    editor_iv_label: { fr: 'Libellé du bouton', en: 'Button label', es: 'Etiqueta del botón', de: 'Schaltflächentext', it: 'Etichetta del pulsante', nl: 'Knoplabel', pt: 'Rótulo do botão', ar: 'نص الزر', zh: '按钮标签', jp: 'ボタンのラベル', el: 'Ετικέτα κουμπιού' },
    editor_iv_visible_duration: { fr: 'Durée d\'affichage du bouton (s)', en: 'Button display time (s)', es: 'Tiempo de visualización del botón (s)', de: 'Anzeigedauer der Schaltfläche (s)', it: 'Durata di visualizzazione del pulsante (s)', nl: 'Weergaveduur van de knop (s)', pt: 'Tempo de exibição do botão (s)', ar: 'مدة ظهور الزر (ثانية)', zh: '按钮显示时长（秒）', jp: 'ボタンの表示時間（秒）', el: 'Διάρκεια εμφάνισης κουμπιού (δευτ.)' },
    editor_iv_button_on_mobile: { fr: 'Afficher le bouton sur mobile', en: 'Show button on mobile', es: 'Mostrar el botón en móvil', de: 'Schaltfläche auf Mobilgeräten anzeigen', it: 'Mostra il pulsante su mobile', nl: 'Knop tonen op mobiel', pt: 'Mostrar o botão no telemóvel', ar: 'إظهار الزر على الجوال', zh: '在移动设备上显示按钮', jp: 'モバイルでボタンを表示', el: 'Εμφάνιση κουμπιού σε κινητό' },
    editor_iv_group_adaptivity: { fr: 'Adaptativité', en: 'Adaptivity', es: 'Adaptabilidad', de: 'Adaptivität', it: 'Adattività', nl: 'Adaptiviteit', pt: 'Adaptatividade', ar: 'التكيّف', zh: '自适应', jp: 'アダプティブ設定', el: 'Προσαρμοστικότητα' },
    editor_iv_require_completion: { fr: 'Réponse obligatoire pour continuer', en: 'Require an answer to continue', es: 'Requiere respuesta para continuar', de: 'Antwort zum Fortfahren erforderlich', it: 'Risposta obbligatoria per continuare', nl: 'Antwoord vereist om door te gaan', pt: 'Resposta obrigatória para continuar', ar: 'يلزم الإجابة للمتابعة', zh: '必须作答才能继续', jp: '続行するには回答が必須', el: 'Απαιτείται απάντηση για συνέχεια' },
    editor_iv_adapt_correct_message: { fr: 'Message si bonne réponse', en: 'Message on correct answer', es: 'Mensaje si la respuesta es correcta', de: 'Nachricht bei richtiger Antwort', it: 'Messaggio se risposta corretta', nl: 'Bericht bij juist antwoord', pt: 'Mensagem se resposta correta', ar: 'رسالة عند الإجابة الصحيحة', zh: '答对时的消息', jp: '正解時のメッセージ', el: 'Μήνυμα σε σωστή απάντηση' },
    editor_iv_adapt_correct_seek: { fr: 'Aller à (si bonne réponse)', en: 'Jump to (on correct answer)', es: 'Ir a (si respuesta correcta)', de: 'Springen zu (bei richtiger Antwort)', it: 'Vai a (se risposta corretta)', nl: 'Ga naar (bij juist antwoord)', pt: 'Ir para (se resposta correta)', ar: 'الانتقال إلى (عند الإجابة الصحيحة)', zh: '跳转到（答对时）', jp: 'ジャンプ先（正解時）', el: 'Μετάβαση σε (σε σωστή απάντηση)' },
    editor_iv_adapt_correct_optout: { fr: 'Autoriser à continuer (bonne réponse)', en: 'Allow to continue (correct answer)', es: 'Permitir continuar (respuesta correcta)', de: 'Fortfahren erlauben (richtige Antwort)', it: 'Consenti di continuare (risposta corretta)', nl: 'Doorgaan toestaan (juist antwoord)', pt: 'Permitir continuar (resposta correta)', ar: 'السماح بالمتابعة (إجابة صحيحة)', zh: '允许继续（答对）', jp: '続行を許可（正解）', el: 'Να επιτρέπεται η συνέχεια (σωστή απάντηση)' },
    editor_iv_adapt_wrong_message: { fr: 'Message si mauvaise réponse', en: 'Message on wrong answer', es: 'Mensaje si la respuesta es incorrecta', de: 'Nachricht bei falscher Antwort', it: 'Messaggio se risposta errata', nl: 'Bericht bij fout antwoord', pt: 'Mensagem se resposta incorreta', ar: 'رسالة عند الإجابة الخاطئة', zh: '答错时的消息', jp: '不正解時のメッセージ', el: 'Μήνυμα σε λανθασμένη απάντηση' },
    editor_iv_adapt_wrong_seek: { fr: 'Aller à (si mauvaise réponse)', en: 'Jump to (on wrong answer)', es: 'Ir a (si respuesta incorrecta)', de: 'Springen zu (bei falscher Antwort)', it: 'Vai a (se risposta errata)', nl: 'Ga naar (bij fout antwoord)', pt: 'Ir para (se resposta incorreta)', ar: 'الانتقال إلى (عند الإجابة الخاطئة)', zh: '跳转到（答错时）', jp: 'ジャンプ先（不正解時）', el: 'Μετάβαση σε (σε λανθασμένη απάντηση)' },
    editor_iv_adapt_wrong_optout: { fr: 'Autoriser à continuer (mauvaise réponse)', en: 'Allow to continue (wrong answer)', es: 'Permitir continuar (respuesta incorrecta)', de: 'Fortfahren erlauben (falsche Antwort)', it: 'Consenti di continuare (risposta errata)', nl: 'Doorgaan toestaan (fout antwoord)', pt: 'Permitir continuar (resposta incorreta)', ar: 'السماح بالمتابعة (إجابة خاطئة)', zh: '允许继续（答错）', jp: '続行を許可（不正解）', el: 'Να επιτρέπεται η συνέχεια (λανθασμένη απάντηση)' }
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
console.log('Clés positionnement IV ajoutées par locale →', report.join(' | '));
