#!/usr/bin/env node
/**
 * Script de mise à jour des contraintes LaTeX dans les fichiers de locale.
 * Met à jour les clés prompt_*_structure_json avec les exemples enrichis
 * et les contraintes par champ définies dans les modèles .md.
 *
 * IMPORTANT : Les valeurs JSON utilisent \n (newline réel) comme séparateur.
 * En JS, on utilise donc \n (pas \\n) pour les ajouts.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'js', 'locales');
const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];

// ==================== EXEMPLES LATEX (identiques toutes langues) ====================
const FULL_EX = '`\\\\( \\\\frac{1}{2} \\\\)`, `\\\\( \\\\sqrt{2} \\\\)`, `\\\\( \\\\alpha \\\\)`, `\\\\( x^{2} \\\\)`, `\\\\( \\\\mathbb{R} \\\\)`, `\\\\( \\\\sin(\\\\theta) \\\\)`, `\\\\( \\\\sum_{k=0}^{n} k \\\\)`, `\\\\( x \\\\geq 0 \\\\)`, `\\\\( \\\\forall x \\\\in \\\\mathbb{R} \\\\)`';
const SHORT_EX = '`\\\\( \\\\frac{1}{2} \\\\)`, `\\\\( \\\\alpha \\\\)`, `\\\\( x^{2} \\\\)`, `\\\\( \\\\mathbb{R} \\\\)`';

// ==================== TRADUCTIONS PAR LANGUE ====================
const T = {
  // Ligne LaTeX complète standard
  fullLatex: {
    fr: `- **LaTeX :** Pour les formules mathématiques, utilise EXCLUSIVEMENT le format LaTeX encapsulé par double échappement : \`\\\\( ... \\\\)\`. N'utilise JAMAIS le signe \`$\` seul. Exemples : ${FULL_EX}.`,
    en: `- **LaTeX:** For mathematical formulas, use EXCLUSIVELY LaTeX format with double escaping: \`\\\\( ... \\\\)\`. NEVER use the \`$\` sign alone. Examples: ${FULL_EX}.`,
    es: `- **LaTeX:** Para fórmulas matemáticas, usa EXCLUSIVAMENTE el formato LaTeX con doble escape: \`\\\\( ... \\\\)\`. NUNCA uses el signo \`$\` solo. Ejemplos: ${FULL_EX}.`,
    de: `- **LaTeX:** Für mathematische Formeln verwende AUSSCHLIESSLICH das LaTeX-Format mit doppeltem Escaping: \`\\\\( ... \\\\)\`. Verwende NIEMALS das \`$\`-Zeichen allein. Beispiele: ${FULL_EX}.`,
    it: `- **LaTeX:** Per le formule matematiche, usa ESCLUSIVAMENTE il formato LaTeX con doppio escape: \`\\\\( ... \\\\)\`. NON usare MAI il segno \`$\` da solo. Esempi: ${FULL_EX}.`,
    nl: `- **LaTeX:** Gebruik voor wiskundige formules UITSLUITEND het LaTeX-formaat met dubbele escaping: \`\\\\( ... \\\\)\`. Gebruik NOOIT het \`$\`-teken alleen. Voorbeelden: ${FULL_EX}.`,
    pt: `- **LaTeX:** Para fórmulas matemáticas, use EXCLUSIVAMENTE o formato LaTeX com escape duplo: \`\\\\( ... \\\\)\`. NUNCA use o sinal \`$\` sozinho. Exemplos: ${FULL_EX}.`,
    ar: `- **LaTeX:** للصيغ الرياضية، استخدم حصريًا تنسيق LaTeX مع التهريب المزدوج: \`\\\\( ... \\\\)\`. لا تستخدم أبدًا علامة \`$\` وحدها. أمثلة: ${FULL_EX}.`,
    zh: `- **LaTeX：** 对于数学公式，请专门使用双转义的 LaTeX 格式：\`\\\\( ... \\\\)\`。切勿单独使用 \`$\` 符号。示例：${FULL_EX}。`,
    jp: `- **LaTeX：** 数学の数式には、ダブルエスケープのLaTeX形式のみを使用してください：\`\\\\( ... \\\\)\`。\`$\` 記号を単独で使用しないでください。例：${FULL_EX}。`,
    el: `- **LaTeX:** Για μαθηματικούς τύπους, χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τη μορφή LaTeX με διπλό escaping: \`\\\\( ... \\\\)\`. ΜΗΝ χρησιμοποιείς ΠΟΤΕ το σύμβολο \`$\` μόνο του. Παραδείγματα: ${FULL_EX}.`
  },
  // Contrainte feedback enrichie
  feedback: {
    fr: '- **Feedback :** Les feedbacks (`overallFeedback`, `tipsAndFeedback`) NE DOIVENT PAS contenir de LaTeX ni de Markdown. Texte brut uniquement.',
    en: '- **Feedback:** Feedbacks (`overallFeedback`, `tipsAndFeedback`) MUST NOT contain LaTeX or Markdown. Plain text only.',
    es: '- **Feedback:** Los feedbacks (`overallFeedback`, `tipsAndFeedback`) NO DEBEN contener LaTeX ni Markdown. Solo texto plano.',
    de: '- **Feedback:** Feedbacks (`overallFeedback`, `tipsAndFeedback`) DÜRFEN KEIN LaTeX oder Markdown enthalten. Nur reiner Text.',
    it: '- **Feedback:** I feedback (`overallFeedback`, `tipsAndFeedback`) NON DEVONO contenere LaTeX o Markdown. Solo testo semplice.',
    nl: '- **Feedback:** Feedbacks (`overallFeedback`, `tipsAndFeedback`) MOGEN GEEN LaTeX of Markdown bevatten. Alleen platte tekst.',
    pt: '- **Feedback:** Os feedbacks (`overallFeedback`, `tipsAndFeedback`) NÃO DEVEM conter LaTeX ou Markdown. Apenas texto simples.',
    ar: '- **التغذية الراجعة:** يجب ألا تحتوي التغذية الراجعة (`overallFeedback`, `tipsAndFeedback`) على LaTeX أو Markdown. نص عادي فقط.',
    zh: '- **反馈：** 反馈（`overallFeedback`、`tipsAndFeedback`）不得包含 LaTeX 或 Markdown。仅限纯文本。',
    jp: '- **フィードバック：** フィードバック（`overallFeedback`、`tipsAndFeedback`）にはLaTeXやMarkdownを含めないでください。プレーンテキストのみ。',
    el: '- **Feedback:** Τα feedbacks (`overallFeedback`, `tipsAndFeedback`) ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX ή Markdown. Μόνο απλό κείμενο.'
  },
  // Titres accordion : texte brut
  accTitles: {
    fr: '- **Titres :** Les `title` des panneaux NE DOIVENT PAS contenir de LaTeX ni de HTML. Texte brut uniquement (les formules seront converties en Unicode : α, β, √, ², etc.).',
    en: '- **Titles:** Panel `title` fields MUST NOT contain LaTeX or HTML. Plain text only (formulas will be converted to Unicode: α, β, √, ², etc.).',
    es: '- **Títulos:** Los `title` de los paneles NO DEBEN contener LaTeX ni HTML. Solo texto plano (las fórmulas se convertirán a Unicode: α, β, √, ², etc.).',
    de: '- **Titel:** Die `title`-Felder der Panels DÜRFEN KEIN LaTeX oder HTML enthalten. Nur reiner Text (Formeln werden in Unicode konvertiert: α, β, √, ², etc.).',
    it: '- **Titoli:** I campi `title` dei pannelli NON DEVONO contenere LaTeX o HTML. Solo testo semplice (le formule saranno convertite in Unicode: α, β, √, ², etc.).',
    nl: '- **Titels:** De `title`-velden van panelen MOGEN GEEN LaTeX of HTML bevatten. Alleen platte tekst (formules worden geconverteerd naar Unicode: α, β, √, ², etc.).',
    pt: '- **Títulos:** Os campos `title` dos painéis NÃO DEVEM conter LaTeX ou HTML. Apenas texto simples (as fórmulas serão convertidas para Unicode: α, β, √, ², etc.).',
    ar: '- **العناوين:** حقول `title` للوحات يجب ألا تحتوي على LaTeX أو HTML. نص عادي فقط (سيتم تحويل الصيغ إلى Unicode: α, β, √, ², إلخ).',
    zh: '- **标题：** 面板的 `title` 字段不得包含 LaTeX 或 HTML。仅限纯文本（公式将转换为 Unicode：α、β、√、²等）。',
    jp: '- **タイトル：** パネルの `title` フィールドにはLaTeXやHTMLを含めないでください。プレーンテキストのみ（数式はUnicodeに変換されます：α、β、√、²など）。',
    el: '- **Τίτλοι:** Τα πεδία `title` των πάνελ ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX ή HTML. Μόνο απλό κείμενο (οι τύποι θα μετατραπούν σε Unicode: α, β, √, ², κλπ.).'
  },
  // Chart : Unicode uniquement
  chartUnicode: {
    fr: '- **Formules mathématiques :** Le composant Chart ne supporte PAS le LaTeX. Utilise directement les caractères Unicode pour les symboles mathématiques dans les labels : α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    en: '- **Mathematical formulas:** The Chart component does NOT support LaTeX. Use Unicode characters directly for mathematical symbols in labels: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    es: '- **Fórmulas matemáticas:** El componente Chart NO soporta LaTeX. Usa directamente caracteres Unicode para los símbolos matemáticos en las etiquetas: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    de: '- **Mathematische Formeln:** Die Chart-Komponente unterstützt KEIN LaTeX. Verwende Unicode-Zeichen direkt für mathematische Symbole in Labels: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    it: '- **Formule matematiche:** Il componente Chart NON supporta LaTeX. Usa direttamente i caratteri Unicode per i simboli matematici nelle etichette: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    nl: '- **Wiskundige formules:** Het Chart-component ondersteunt GEEN LaTeX. Gebruik Unicode-tekens direct voor wiskundige symbolen in labels: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    pt: '- **Fórmulas matemáticas:** O componente Chart NÃO suporta LaTeX. Use diretamente caracteres Unicode para símbolos matemáticos nos rótulos: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    ar: '- **الصيغ الرياضية:** مكون Chart لا يدعم LaTeX. استخدم أحرف Unicode مباشرة للرموز الرياضية في التسميات: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.',
    zh: '- **数学公式：** Chart 组件不支持 LaTeX。请直接使用 Unicode 字符作为标签中的数学符号：α、β、π、√、²、³、≤、≥、≠、∞、→。',
    jp: '- **数学の数式：** Chartコンポーネントは LaTeX をサポートしていません。ラベルの数学記号にはUnicode文字を直接使用してください：α、β、π、√、²、³、≤、≥、≠、∞、→。',
    el: '- **Μαθηματικοί τύποι:** Το στοιχείο Chart ΔΕΝ υποστηρίζει LaTeX. Χρησιμοποίησε απευθείας χαρακτήρες Unicode για μαθηματικά σύμβολα στις ετικέτες: α, β, π, √, ², ³, ≤, ≥, ≠, ∞, →.'
  },
  // Crossword : LaTeX pour clues + letters-only
  crossword: {
    fr: `- **LaTeX :** Pour les indices (\`clue\`), utilise le format LaTeX : \`\\\\( ... \\\\)\`. Exemples : ${SHORT_EX}.\n- **Réponses :** Les \`answer\` (mots de la grille) DOIVENT contenir UNIQUEMENT des lettres alphabétiques (A-Z, À-Ÿ). Pas de chiffres, pas de symboles, pas de LaTeX.`,
    en: `- **LaTeX:** For clues (\`clue\`), use LaTeX format: \`\\\\( ... \\\\)\`. Examples: ${SHORT_EX}.\n- **Answers:** The \`answer\` fields (grid words) MUST contain ONLY alphabetical letters (A-Z, À-Ÿ). No digits, no symbols, no LaTeX.`,
    es: `- **LaTeX:** Para las pistas (\`clue\`), usa el formato LaTeX: \`\\\\( ... \\\\)\`. Ejemplos: ${SHORT_EX}.\n- **Respuestas:** Los campos \`answer\` (palabras de la cuadrícula) DEBEN contener SOLO letras alfabéticas (A-Z, À-Ÿ). Sin dígitos, sin símbolos, sin LaTeX.`,
    de: `- **LaTeX:** Für Hinweise (\`clue\`) verwende das LaTeX-Format: \`\\\\( ... \\\\)\`. Beispiele: ${SHORT_EX}.\n- **Antworten:** Die \`answer\`-Felder (Gitterwörter) DÜRFEN NUR alphabetische Buchstaben enthalten (A-Z, À-Ÿ). Keine Ziffern, keine Symbole, kein LaTeX.`,
    it: `- **LaTeX:** Per gli indizi (\`clue\`), usa il formato LaTeX: \`\\\\( ... \\\\)\`. Esempi: ${SHORT_EX}.\n- **Risposte:** I campi \`answer\` (parole della griglia) DEVONO contenere SOLO lettere alfabetiche (A-Z, À-Ÿ). Nessuna cifra, nessun simbolo, nessun LaTeX.`,
    nl: `- **LaTeX:** Voor aanwijzingen (\`clue\`), gebruik het LaTeX-formaat: \`\\\\( ... \\\\)\`. Voorbeelden: ${SHORT_EX}.\n- **Antwoorden:** De \`answer\`-velden (rasterwoorden) MOETEN ALLEEN alfabetische letters bevatten (A-Z, À-Ÿ). Geen cijfers, geen symbolen, geen LaTeX.`,
    pt: `- **LaTeX:** Para dicas (\`clue\`), use o formato LaTeX: \`\\\\( ... \\\\)\`. Exemplos: ${SHORT_EX}.\n- **Respostas:** Os campos \`answer\` (palavras da grade) DEVEM conter APENAS letras alfabéticas (A-Z, À-Ÿ). Sem dígitos, sem símbolos, sem LaTeX.`,
    ar: `- **LaTeX:** للتلميحات (\`clue\`)، استخدم تنسيق LaTeX: \`\\\\( ... \\\\)\`. أمثلة: ${SHORT_EX}.\n- **الإجابات:** حقول \`answer\` (كلمات الشبكة) يجب أن تحتوي فقط على حروف أبجدية (A-Z, À-Ÿ). بدون أرقام، بدون رموز، بدون LaTeX.`,
    zh: `- **LaTeX：** 对于线索（\`clue\`），使用 LaTeX 格式：\`\\\\( ... \\\\)\`。示例：${SHORT_EX}。\n- **答案：** \`answer\` 字段（网格单词）只能包含字母字符（A-Z、À-Ÿ）。不能有数字、符号或 LaTeX。`,
    jp: `- **LaTeX：** ヒント（\`clue\`）にはLaTeX形式を使用してください：\`\\\\( ... \\\\)\`。例：${SHORT_EX}。\n- **回答：** \`answer\` フィールド（グリッドの単語）にはアルファベット文字のみ（A-Z、À-Ÿ）を含めてください。数字、記号、LaTeXは使用しないでください。`,
    el: `- **LaTeX:** Για τα στοιχεία (\`clue\`), χρησιμοποίησε μορφή LaTeX: \`\\\\( ... \\\\)\`. Παραδείγματα: ${SHORT_EX}.\n- **Απαντήσεις:** Τα πεδία \`answer\` (λέξεις πλέγματος) ΠΡΕΠΕΙ να περιέχουν ΜΟΝΟ αλφαβητικά γράμματα (A-Z, À-Ÿ). Χωρίς ψηφία, χωρίς σύμβολα, χωρίς LaTeX.`
  },
  // DragTheWords
  dragWords: {
    fr: '- **LaTeX :** Le composant DragTheWords ne supporte PAS le LaTeX dans les mots déplaçables (marqués par `*mot*`). Le LaTeX sera automatiquement converti en caractères Unicode dans les marqueurs. Tu peux néanmoins utiliser LaTeX `\\\\( ... \\\\)` dans la consigne (`taskDescription`).',
    en: '- **LaTeX:** The DragTheWords component does NOT support LaTeX in draggable words (marked with `*word*`). LaTeX will be automatically converted to Unicode characters in markers. You can still use LaTeX `\\\\( ... \\\\)` in the instruction (`taskDescription`).',
    es: '- **LaTeX:** El componente DragTheWords NO soporta LaTeX en las palabras arrastrables (marcadas con `*palabra*`). El LaTeX se convertirá automáticamente a caracteres Unicode. Puedes usar LaTeX `\\\\( ... \\\\)` en la consigna (`taskDescription`).',
    de: '- **LaTeX:** Die DragTheWords-Komponente unterstützt KEIN LaTeX in ziehbaren Wörtern (markiert mit `*Wort*`). LaTeX wird automatisch in Unicode-Zeichen konvertiert. Du kannst LaTeX `\\\\( ... \\\\)` in der Anweisung (`taskDescription`) verwenden.',
    it: '- **LaTeX:** Il componente DragTheWords NON supporta LaTeX nelle parole trascinabili (contrassegnate con `*parola*`). Il LaTeX sarà convertito in caratteri Unicode. Puoi usare LaTeX `\\\\( ... \\\\)` nelle istruzioni (`taskDescription`).',
    nl: '- **LaTeX:** Het DragTheWords-component ondersteunt GEEN LaTeX in sleepbare woorden (gemarkeerd met `*woord*`). LaTeX wordt automatisch geconverteerd naar Unicode-tekens. Je kunt LaTeX `\\\\( ... \\\\)` gebruiken in de instructie (`taskDescription`).',
    pt: '- **LaTeX:** O componente DragTheWords NÃO suporta LaTeX nas palavras arrastáveis (marcadas com `*palavra*`). O LaTeX será convertido para caracteres Unicode. Você pode usar LaTeX `\\\\( ... \\\\)` na instrução (`taskDescription`).',
    ar: '- **LaTeX:** مكون DragTheWords لا يدعم LaTeX في الكلمات القابلة للسحب (المحددة بـ `*كلمة*`). سيتم تحويل LaTeX تلقائيًا إلى أحرف Unicode. يمكنك استخدام LaTeX `\\\\( ... \\\\)` في التعليمات (`taskDescription`).',
    zh: '- **LaTeX：** DragTheWords 组件不支持在可拖拽单词（用 `*单词*` 标记）中使用 LaTeX。LaTeX 将自动转换为 Unicode 字符。你可以在说明（`taskDescription`）中使用 LaTeX `\\\\( ... \\\\)`。',
    jp: '- **LaTeX：** DragTheWordsコンポーネントは、ドラッグ可能な単語（`*単語*`）でのLaTeXをサポートしていません。LaTeXは自動的にUnicode文字に変換されます。指示（`taskDescription`）ではLaTeX `\\\\( ... \\\\)` を使用できます。',
    el: '- **LaTeX:** Το DragTheWords ΔΕΝ υποστηρίζει LaTeX σε σύρσιμες λέξεις (`*λέξη*`). Το LaTeX θα μετατραπεί σε Unicode. Μπορείς να χρησιμοποιήσεις LaTeX `\\\\( ... \\\\)` στην οδηγία (`taskDescription`).'
  },
  // FillInTheBlanks
  fillBlanks: {
    fr: '- **LaTeX :** Le composant FillInTheBlanks ne supporte PAS le LaTeX dans les textes à trous (`questions`). Le LaTeX sera automatiquement converti en Unicode. Tu peux utiliser LaTeX `\\\\( ... \\\\)` dans la consigne (`taskDescription`).',
    en: '- **LaTeX:** The FillInTheBlanks component does NOT support LaTeX in gap texts (`questions`). LaTeX will be automatically converted to Unicode. You can use LaTeX `\\\\( ... \\\\)` in the instruction (`taskDescription`).',
    es: '- **LaTeX:** El componente FillInTheBlanks NO soporta LaTeX en los textos con huecos (`questions`). El LaTeX se convertirá automáticamente a Unicode. Puedes usar LaTeX `\\\\( ... \\\\)` en la consigna (`taskDescription`).',
    de: '- **LaTeX:** Die FillInTheBlanks-Komponente unterstützt KEIN LaTeX in Lückentexten (`questions`). LaTeX wird automatisch in Unicode konvertiert. Du kannst LaTeX `\\\\( ... \\\\)` in der Anweisung (`taskDescription`) verwenden.',
    it: '- **LaTeX:** Il componente FillInTheBlanks NON supporta LaTeX nei testi con lacune (`questions`). Il LaTeX sarà convertito in Unicode. Puoi usare LaTeX `\\\\( ... \\\\)` nelle istruzioni (`taskDescription`).',
    nl: '- **LaTeX:** Het FillInTheBlanks-component ondersteunt GEEN LaTeX in invulteksten (`questions`). LaTeX wordt automatisch geconverteerd naar Unicode. Je kunt LaTeX `\\\\( ... \\\\)` gebruiken in de instructie (`taskDescription`).',
    pt: '- **LaTeX:** O componente FillInTheBlanks NÃO suporta LaTeX nos textos lacunares (`questions`). O LaTeX será convertido para Unicode. Você pode usar LaTeX `\\\\( ... \\\\)` na instrução (`taskDescription`).',
    ar: '- **LaTeX:** مكون FillInTheBlanks لا يدعم LaTeX في نصوص الفراغات (`questions`). سيتم تحويل LaTeX إلى Unicode. يمكنك استخدام LaTeX `\\\\( ... \\\\)` في التعليمات (`taskDescription`).',
    zh: '- **LaTeX：** FillInTheBlanks 组件不支持在填空文本（`questions`）中使用 LaTeX。LaTeX 将自动转换为 Unicode。你可以在说明（`taskDescription`）中使用 LaTeX `\\\\( ... \\\\)`。',
    jp: '- **LaTeX：** FillInTheBlanksコンポーネントは穴埋めテキスト（`questions`）でのLaTeXをサポートしていません。LaTeXはUnicodeに変換されます。指示（`taskDescription`）ではLaTeX `\\\\( ... \\\\)` を使用できます。',
    el: '- **LaTeX:** Το FillInTheBlanks ΔΕΝ υποστηρίζει LaTeX σε κείμενα με κενά (`questions`). Το LaTeX θα μετατραπεί σε Unicode. Μπορείς να χρησιμοποιήσεις LaTeX `\\\\( ... \\\\)` στην οδηγία (`taskDescription`).'
  },
  // MarkTheWords
  markWords: {
    fr: '- **LaTeX :** Le composant MarkTheWords ne supporte PAS le LaTeX dans le texte à marquer (`textField`). Le LaTeX sera automatiquement converti en caractères Unicode. Tu peux utiliser LaTeX `\\\\( ... \\\\)` dans la consigne (`taskDescription`).',
    en: '- **LaTeX:** The MarkTheWords component does NOT support LaTeX in the text to mark (`textField`). LaTeX will be automatically converted to Unicode. You can use LaTeX `\\\\( ... \\\\)` in the instruction (`taskDescription`).',
    es: '- **LaTeX:** El componente MarkTheWords NO soporta LaTeX en el texto a marcar (`textField`). El LaTeX se convertirá a caracteres Unicode. Puedes usar LaTeX `\\\\( ... \\\\)` en la consigna (`taskDescription`).',
    de: '- **LaTeX:** Die MarkTheWords-Komponente unterstützt KEIN LaTeX im zu markierenden Text (`textField`). LaTeX wird automatisch in Unicode konvertiert. Du kannst LaTeX `\\\\( ... \\\\)` in der Anweisung (`taskDescription`) verwenden.',
    it: '- **LaTeX:** Il componente MarkTheWords NON supporta LaTeX nel testo da contrassegnare (`textField`). Il LaTeX sarà convertito in Unicode. Puoi usare LaTeX `\\\\( ... \\\\)` nelle istruzioni (`taskDescription`).',
    nl: '- **LaTeX:** Het MarkTheWords-component ondersteunt GEEN LaTeX in de te markeren tekst (`textField`). LaTeX wordt geconverteerd naar Unicode. Je kunt LaTeX `\\\\( ... \\\\)` gebruiken in de instructie (`taskDescription`).',
    pt: '- **LaTeX:** O componente MarkTheWords NÃO suporta LaTeX no texto a marcar (`textField`). O LaTeX será convertido para Unicode. Você pode usar LaTeX `\\\\( ... \\\\)` na instrução (`taskDescription`).',
    ar: '- **LaTeX:** مكون MarkTheWords لا يدعم LaTeX في النص المراد تحديده (`textField`). سيتم تحويل LaTeX إلى أحرف Unicode. يمكنك استخدام LaTeX `\\\\( ... \\\\)` في التعليمات (`taskDescription`).',
    zh: '- **LaTeX：** MarkTheWords 组件不支持在标记文本（`textField`）中使用 LaTeX。LaTeX 将自动转换为 Unicode。你可以在说明（`taskDescription`）中使用 LaTeX `\\\\( ... \\\\)`。',
    jp: '- **LaTeX：** MarkTheWordsコンポーネントはマークするテキスト（`textField`）でのLaTeXをサポートしていません。LaTeXはUnicode文字に変換されます。指示（`taskDescription`）ではLaTeX `\\\\( ... \\\\)` を使用できます。',
    el: '- **LaTeX:** Το MarkTheWords ΔΕΝ υποστηρίζει LaTeX στο κείμενο προς σήμανση (`textField`). Το LaTeX θα μετατραπεί σε Unicode. Μπορείς να χρησιμοποιήσεις LaTeX `\\\\( ... \\\\)` στην οδηγία (`taskDescription`).'
  },
  // FindTheWords
  findWords: {
    fr: '- **Formules mathématiques :** Le composant FindTheWords ne supporte PAS le LaTeX ni les symboles mathématiques. Les mots (`wordList`) et la consigne (`taskDescription`) doivent être du texte brut uniquement.',
    en: '- **Mathematical formulas:** The FindTheWords component does NOT support LaTeX or mathematical symbols. Words (`wordList`) and instruction (`taskDescription`) must be plain text only.',
    es: '- **Fórmulas matemáticas:** El componente FindTheWords NO soporta LaTeX ni símbolos matemáticos. Las palabras (`wordList`) y la consigna (`taskDescription`) deben ser solo texto plano.',
    de: '- **Mathematische Formeln:** Die FindTheWords-Komponente unterstützt KEIN LaTeX oder mathematische Symbole. Wörter (`wordList`) und Anweisung (`taskDescription`) dürfen nur reiner Text sein.',
    it: '- **Formule matematiche:** Il componente FindTheWords NON supporta LaTeX o simboli matematici. Le parole (`wordList`) e le istruzioni (`taskDescription`) devono essere solo testo semplice.',
    nl: '- **Wiskundige formules:** Het FindTheWords-component ondersteunt GEEN LaTeX of wiskundige symbolen. Woorden (`wordList`) en instructie (`taskDescription`) moeten alleen platte tekst zijn.',
    pt: '- **Fórmulas matemáticas:** O componente FindTheWords NÃO suporta LaTeX ou símbolos matemáticos. Palavras (`wordList`) e instrução (`taskDescription`) devem ser apenas texto simples.',
    ar: '- **الصيغ الرياضية:** مكون FindTheWords لا يدعم LaTeX أو الرموز الرياضية. الكلمات (`wordList`) والتعليمات (`taskDescription`) يجب أن تكون نصًا عاديًا فقط.',
    zh: '- **数学公式：** FindTheWords 组件不支持 LaTeX 或数学符号。单词（`wordList`）和说明（`taskDescription`）必须是纯文本。',
    jp: '- **数学の数式：** FindTheWordsコンポーネントはLaTeXや数学記号をサポートしていません。単語（`wordList`）と指示（`taskDescription`）はプレーンテキストのみ。',
    el: '- **Μαθηματικοί τύποι:** Το FindTheWords ΔΕΝ υποστηρίζει LaTeX ή μαθηματικά σύμβολα. Οι λέξεις (`wordList`) και η οδηγία (`taskDescription`) πρέπει να είναι μόνο απλό κείμενο.'
  },
  // Essay
  essay: {
    fr: `- **LaTeX :** Pour les formules mathématiques dans la consigne (\`taskDescription\`), utilise le format LaTeX : \`\\\\( ... \\\\)\`. Exemples : ${SHORT_EX}.\n- **Mots-clés :** Les \`keyword\` sont du texte brut (pas de LaTeX ni de HTML). Ce sont les termes recherchés dans la réponse de l'élève.`,
    en: `- **LaTeX:** For mathematical formulas in the instruction (\`taskDescription\`), use LaTeX format: \`\\\\( ... \\\\)\`. Examples: ${SHORT_EX}.\n- **Keywords:** The \`keyword\` fields are plain text (no LaTeX or HTML). These are terms searched in the student's response.`,
    es: `- **LaTeX:** Para fórmulas matemáticas en la consigna (\`taskDescription\`), usa el formato LaTeX: \`\\\\( ... \\\\)\`. Ejemplos: ${SHORT_EX}.\n- **Palabras clave:** Los campos \`keyword\` son texto plano (sin LaTeX ni HTML). Son los términos buscados en la respuesta del alumno.`,
    de: `- **LaTeX:** Für mathematische Formeln in der Anweisung (\`taskDescription\`) verwende das LaTeX-Format: \`\\\\( ... \\\\)\`. Beispiele: ${SHORT_EX}.\n- **Schlüsselwörter:** Die \`keyword\`-Felder sind reiner Text (kein LaTeX oder HTML). Dies sind Begriffe, die in der Antwort des Schülers gesucht werden.`,
    it: `- **LaTeX:** Per formule matematiche nelle istruzioni (\`taskDescription\`), usa il formato LaTeX: \`\\\\( ... \\\\)\`. Esempi: ${SHORT_EX}.\n- **Parole chiave:** I campi \`keyword\` sono testo semplice (niente LaTeX o HTML). Sono i termini cercati nella risposta dello studente.`,
    nl: `- **LaTeX:** Voor wiskundige formules in de instructie (\`taskDescription\`), gebruik LaTeX-formaat: \`\\\\( ... \\\\)\`. Voorbeelden: ${SHORT_EX}.\n- **Trefwoorden:** De \`keyword\`-velden zijn platte tekst (geen LaTeX of HTML). Dit zijn termen die in het antwoord van de leerling worden gezocht.`,
    pt: `- **LaTeX:** Para fórmulas matemáticas na instrução (\`taskDescription\`), use o formato LaTeX: \`\\\\( ... \\\\)\`. Exemplos: ${SHORT_EX}.\n- **Palavras-chave:** Os campos \`keyword\` são texto simples (sem LaTeX ou HTML). São termos procurados na resposta do aluno.`,
    ar: `- **LaTeX:** للصيغ الرياضية في التعليمات (\`taskDescription\`)، استخدم تنسيق LaTeX: \`\\\\( ... \\\\)\`. أمثلة: ${SHORT_EX}.\n- **الكلمات المفتاحية:** حقول \`keyword\` هي نص عادي (بدون LaTeX أو HTML). هذه المصطلحات يتم البحث عنها في إجابة الطالب.`,
    zh: `- **LaTeX：** 对于说明（\`taskDescription\`）中的数学公式，使用 LaTeX 格式：\`\\\\( ... \\\\)\`。示例：${SHORT_EX}。\n- **关键词：** \`keyword\` 字段是纯文本（无 LaTeX 或 HTML）。这些是在学生回答中搜索的术语。`,
    jp: `- **LaTeX：** 指示（\`taskDescription\`）の数式には LaTeX 形式を使用：\`\\\\( ... \\\\)\`。例：${SHORT_EX}。\n- **キーワード：** \`keyword\` フィールドはプレーンテキスト（LaTeXやHTMLなし）。生徒の回答で検索される用語です。`,
    el: `- **LaTeX:** Για τύπους στην οδηγία (\`taskDescription\`), χρησιμοποίησε LaTeX: \`\\\\( ... \\\\)\`. Παραδείγματα: ${SHORT_EX}.\n- **Λέξεις-κλειδιά:** Τα πεδία \`keyword\` είναι απλό κείμενο (χωρίς LaTeX ή HTML). Αναζητούνται στην απάντηση του μαθητή.`
  },
  // Flashcards
  flashcards: {
    fr: `- **LaTeX :** Pour les formules mathématiques dans les champs \`text\` et \`tip\`, utilise le format LaTeX : \`\\\\( ... \\\\)\`. Exemples : ${SHORT_EX}.\n- **Réponse :** Le champ \`answer\` est du texte brut (pas de LaTeX, pas de Markdown). C'est la saisie attendue de l'élève.`,
    en: `- **LaTeX:** For mathematical formulas in \`text\` and \`tip\` fields, use LaTeX format: \`\\\\( ... \\\\)\`. Examples: ${SHORT_EX}.\n- **Answer:** The \`answer\` field is plain text (no LaTeX, no Markdown). It is the expected student input.`,
    es: `- **LaTeX:** Para fórmulas matemáticas en los campos \`text\` y \`tip\`, usa el formato LaTeX: \`\\\\( ... \\\\)\`. Ejemplos: ${SHORT_EX}.\n- **Respuesta:** El campo \`answer\` es texto plano (sin LaTeX, sin Markdown). Es la entrada esperada del alumno.`,
    de: `- **LaTeX:** Für mathematische Formeln in den Feldern \`text\` und \`tip\` verwende LaTeX: \`\\\\( ... \\\\)\`. Beispiele: ${SHORT_EX}.\n- **Antwort:** Das Feld \`answer\` ist reiner Text (kein LaTeX, kein Markdown). Es ist die erwartete Eingabe des Schülers.`,
    it: `- **LaTeX:** Per formule matematiche nei campi \`text\` e \`tip\`, usa LaTeX: \`\\\\( ... \\\\)\`. Esempi: ${SHORT_EX}.\n- **Risposta:** Il campo \`answer\` è testo semplice (niente LaTeX, niente Markdown). È l'input atteso dello studente.`,
    nl: `- **LaTeX:** Voor wiskundige formules in de velden \`text\` en \`tip\`, gebruik LaTeX: \`\\\\( ... \\\\)\`. Voorbeelden: ${SHORT_EX}.\n- **Antwoord:** Het veld \`answer\` is platte tekst (geen LaTeX, geen Markdown). Het is de verwachte input van de leerling.`,
    pt: `- **LaTeX:** Para fórmulas matemáticas nos campos \`text\` e \`tip\`, use LaTeX: \`\\\\( ... \\\\)\`. Exemplos: ${SHORT_EX}.\n- **Resposta:** O campo \`answer\` é texto simples (sem LaTeX, sem Markdown). É a entrada esperada do aluno.`,
    ar: `- **LaTeX:** للصيغ الرياضية في حقول \`text\` و \`tip\`، استخدم LaTeX: \`\\\\( ... \\\\)\`. أمثلة: ${SHORT_EX}.\n- **الإجابة:** حقل \`answer\` هو نص عادي (بدون LaTeX، بدون Markdown). هو المدخل المتوقع من الطالب.`,
    zh: `- **LaTeX：** 对于 \`text\` 和 \`tip\` 字段中的数学公式，使用 LaTeX：\`\\\\( ... \\\\)\`。示例：${SHORT_EX}。\n- **答案：** \`answer\` 字段是纯文本（无 LaTeX、无 Markdown）。这是学生的预期输入。`,
    jp: `- **LaTeX：** \`text\` と \`tip\` フィールドの数式には LaTeX を使用：\`\\\\( ... \\\\)\`。例：${SHORT_EX}。\n- **回答：** \`answer\` フィールドはプレーンテキスト（LaTeXやMarkdownなし）。生徒の期待される入力です。`,
    el: `- **LaTeX:** Για τύπους στα πεδία \`text\` και \`tip\`, χρησιμοποίησε LaTeX: \`\\\\( ... \\\\)\`. Παραδείγματα: ${SHORT_EX}.\n- **Απάντηση:** Το πεδίο \`answer\` είναι απλό κείμενο (χωρίς LaTeX, χωρίς Markdown). Αναμενόμενη εισαγωγή μαθητή.`
  },
  // Éléa Devoir
  devoir: {
    fr: '- **Critères de la grille :** Les champs `description` (nom du critère) et `definition` (descripteur de niveau) des critères NE DOIVENT PAS contenir de LaTeX. Utilise des caractères Unicode pour les formules : α, β, √, ², x², ≤, ≥, π.',
    en: '- **Rubric criteria:** The `description` (criterion name) and `definition` (level descriptor) fields MUST NOT contain LaTeX. Use Unicode characters for formulas: α, β, √, ², x², ≤, ≥, π.',
    es: '- **Criterios de la rúbrica:** Los campos `description` y `definition` NO DEBEN contener LaTeX. Usa caracteres Unicode para fórmulas: α, β, √, ², x², ≤, ≥, π.',
    de: '- **Rubrik-Kriterien:** Die Felder `description` und `definition` DÜRFEN KEIN LaTeX enthalten. Verwende Unicode-Zeichen: α, β, √, ², x², ≤, ≥, π.',
    it: '- **Criteri della griglia:** I campi `description` e `definition` NON DEVONO contenere LaTeX. Usa Unicode: α, β, √, ², x², ≤, ≥, π.',
    nl: '- **Rubriekcriteria:** De velden `description` en `definition` MOGEN GEEN LaTeX bevatten. Gebruik Unicode: α, β, √, ², x², ≤, ≥, π.',
    pt: '- **Critérios da rubrica:** Os campos `description` e `definition` NÃO DEVEM conter LaTeX. Use Unicode: α, β, √, ², x², ≤, ≥, π.',
    ar: '- **معايير التقييم:** حقول `description` و `definition` يجب ألا تحتوي على LaTeX. استخدم Unicode: α, β, √, ², x², ≤, ≥, π.',
    zh: '- **评分标准：** `description` 和 `definition` 字段不得包含 LaTeX。使用 Unicode：α、β、√、²、x²、≤、≥、π。',
    jp: '- **ルーブリック基準：** `description` と `definition` フィールドにはLaTeXを含めないでください。Unicode文字：α、β、√、²、x²、≤、≥、π。',
    el: '- **Κριτήρια:** Τα πεδία `description` και `definition` ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX. Unicode: α, β, √, ², x², ≤, ≥, π.'
  },
  // Éléa Glossaire : Unicode uniquement
  glossaire: {
    fr: '- **Formules mathématiques :** Les champs `concept` et `definition` du glossaire sont du texte brut (pas de HTML ni de LaTeX). Utilise des caractères Unicode pour les formules : α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    en: '- **Mathematical formulas:** The `concept` and `definition` glossary fields are plain text (no HTML or LaTeX). Use Unicode characters: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    es: '- **Fórmulas matemáticas:** Los campos `concept` y `definition` son texto plano (sin HTML ni LaTeX). Usa Unicode: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    de: '- **Mathematische Formeln:** Die Felder `concept` und `definition` sind reiner Text (kein HTML oder LaTeX). Verwende Unicode: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    it: '- **Formule matematiche:** I campi `concept` e `definition` sono testo semplice (niente HTML o LaTeX). Usa Unicode: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    nl: '- **Wiskundige formules:** De velden `concept` en `definition` zijn platte tekst (geen HTML of LaTeX). Gebruik Unicode: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    pt: '- **Fórmulas matemáticas:** Os campos `concept` e `definition` são texto simples (sem HTML ou LaTeX). Use Unicode: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    ar: '- **الصيغ الرياضية:** حقول `concept` و `definition` هي نص عادي (بدون HTML أو LaTeX). استخدم Unicode: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.',
    zh: '- **数学公式：** `concept` 和 `definition` 字段是纯文本（无 HTML 或 LaTeX）。使用 Unicode：α、β、√、²、x²、≤、≥、π、ℝ、ℕ、∈、∞。',
    jp: '- **数学の数式：** `concept` と `definition` フィールドはプレーンテキスト（HTMLやLaTeXなし）。Unicode：α、β、√、²、x²、≤、≥、π、ℝ、ℕ、∈、∞。',
    el: '- **Μαθηματικοί τύποι:** Τα πεδία `concept` και `definition` είναι απλό κείμενο (χωρίς HTML ή LaTeX). Unicode: α, β, √, ², x², ≤, ≥, π, ℝ, ℕ, ∈, ∞.'
  },
  // Millionnaire
  millionnaire: {
    fr: '- **Formules mathématiques :** Le LaTeX est INTERDIT dans les questions et réponses du Millionnaire. Utilise uniquement des caractères Unicode : α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    en: '- **Mathematical formulas:** LaTeX is FORBIDDEN in Millionnaire questions and answers. Use only Unicode characters: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    es: '- **Fórmulas matemáticas:** El LaTeX está PROHIBIDO en las preguntas y respuestas del Millonario. Usa solo Unicode: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    de: '- **Mathematische Formeln:** LaTeX ist in Millionär-Fragen und -Antworten VERBOTEN. Nur Unicode: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    it: '- **Formule matematiche:** Il LaTeX è VIETATO nelle domande e risposte del Milionario. Solo Unicode: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    nl: '- **Wiskundige formules:** LaTeX is VERBODEN in Miljonair-vragen en -antwoorden. Alleen Unicode: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    pt: '- **Fórmulas matemáticas:** O LaTeX é PROIBIDO nas perguntas e respostas do Milionário. Use apenas Unicode: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    ar: '- **الصيغ الرياضية:** LaTeX ممنوع في أسئلة وإجابات المليونير. استخدم فقط Unicode: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.',
    zh: '- **数学公式：** 百万富翁问答中禁止使用 LaTeX。仅使用 Unicode：α、β、√、²、x²、≤、≥、π、½、×、∞。',
    jp: '- **数学の数式：** ミリオネアの質問と回答ではLaTeX禁止。Unicodeのみ：α、β、√、²、x²、≤、≥、π、½、×、∞。',
    el: '- **Μαθηματικοί τύποι:** Το LaTeX ΑΠΑΓΟΡΕΥΕΤΑΙ στις ερωτήσεις του Εκατομμυριούχου. Μόνο Unicode: α, β, √, ², x², ≤, ≥, π, ½, ×, ∞.'
  },
  // Summary intro
  summaryIntro: {
    fr: '- **Introduction :** Le champ `intro` est du texte brut (pas de LaTeX ni de HTML).',
    en: '- **Introduction:** The `intro` field is plain text (no LaTeX or HTML).',
    es: '- **Introducción:** El campo `intro` es texto plano (sin LaTeX ni HTML).',
    de: '- **Einleitung:** Das Feld `intro` ist reiner Text (kein LaTeX oder HTML).',
    it: '- **Introduzione:** Il campo `intro` è testo semplice (niente LaTeX o HTML).',
    nl: '- **Inleiding:** Het veld `intro` is platte tekst (geen LaTeX of HTML).',
    pt: '- **Introdução:** O campo `intro` é texto simples (sem LaTeX ou HTML).',
    ar: '- **المقدمة:** حقل `intro` هو نص عادي (بدون LaTeX أو HTML).',
    zh: '- **引言：** `intro` 字段是纯文本（无 LaTeX 或 HTML）。',
    jp: '- **はじめに：** `intro` フィールドはプレーンテキスト（LaTeXやHTMLなし）。',
    el: '- **Εισαγωγή:** Το πεδίο `intro` είναι απλό κείμενο (χωρίς LaTeX ή HTML).'
  }
};

// ==================== LOGIQUE DE MISE À JOUR ====================

/**
 * Supprime le vieux pattern LaTeX inline "(2^3)^2" d'une valeur.
 * Gère les deux formats : inline dans une description de champ, ou bullet-point séparé.
 */
function removeOldLatex(val) {
  // 1. Toute ligne (bullet ou non) contenant (2^3)^2
  val = val.replace(/\n[^\n]*\(2\^3\)\^2[^\n]*/g, '');

  // 2. Ligne bullet avec "LaTeX" suivi de "interdit/forbidden/prohibido/verboten/vietato/verboden/proibido/ممنوع/禁止/ΑΠΑΓΟΡΕΥ"
  val = val.replace(/\n[^\n]*LaTeX[^\n]*(?:interdit|forbidden|prohibido|verboten|vietato|verboden|proibido|ممنوع|禁止|禁止されて|ΑΠΑΓΟΡΕΥ)[^\n]*/gi, '');

  // 3. Inline "(2^3)^2" dans une phrase (rare, mais au cas où en début de valeur sans \n)
  val = val.replace(/\(2\^3\)\^2/g, '');

  return val;
}

/**
 * Remplace les lignes LaTeX+Feedback existantes (format moyen sans exemples)
 * par la version enrichie avec exemples.
 */
function enrichLatexFeedback(val, lang) {
  // Stratégie : chercher un bloc de 2-3 lignes consécutives contenant LaTeX + Feedback
  // et le remplacer par la version enrichie.

  // IMPORTANT : les remplacements passent par une FONCTION `() => ...` et non une
  // chaîne. T.fullLatex[lang] contient le littéral « `$` » ; en remplacement-chaîne,
  // la séquence « $` » est interprétée par String.replace comme le motif spécial
  // (portion précédant le match) et DUPLIQUE tout le début de la valeur (bug de
  // gonflement des locales, el.json > 512 Ko). Une fonction de remplacement neutralise
  // tous les motifs `$…` ($&, $`, $', $$, $n).

  // Pattern 1 : "Mise en forme" + "LaTeX" + "Feedback" (3 lignes)
  const triplePattern = /\n(- \*\*[^\n]*)\n- \*\*LaTeX[^\n]*\n- \*\*(?:Feedback|التغذية الراجعة|反馈|フィードバック)[^\n]*/;
  if (triplePattern.test(val)) {
    const mise = val.match(triplePattern);
    const miseEnForme = mise ? mise[1] : '';
    val = val.replace(triplePattern, () => '\n' + miseEnForme + '\n' + T.fullLatex[lang] + '\n' + T.feedback[lang]);
    return val;
  }

  // Pattern 2 : "LaTeX" + "Feedback" (2 lignes) — pas de "Mise en forme"
  const doublePattern = /\n- \*\*LaTeX[^\n]*\n- \*\*(?:Feedback|التغذية الراجعة|反馈|フィードバック)[^\n]*/;
  if (doublePattern.test(val)) {
    val = val.replace(doublePattern, () => '\n' + T.fullLatex[lang] + '\n' + T.feedback[lang]);
    return val;
  }

  // Pattern 3 : Ligne LaTeX seule (sans feedback) contenant \\( mais sans les exemples enrichis
  const latexOnly = /\n- \*\*LaTeX[^\n]*\\\\[^\n]*/;
  if (latexOnly.test(val) && !val.includes('frac{1}{2}')) {
    val = val.replace(latexOnly, () => '\n' + T.fullLatex[lang] + '\n' + T.feedback[lang]);
    return val;
  }

  // Pattern 4 : Aucun pattern trouvé, mais pas encore d'exemples LaTeX → ajouter en fin
  if (!val.includes('frac{1}{2}')) {
    val += '\n' + T.fullLatex[lang] + '\n' + T.feedback[lang];
  }

  return val;
}

function processLocale(lang) {
  const filePath = join(LOCALES_DIR, `${lang}.json`);
  const json = JSON.parse(readFileSync(filePath, 'utf8'));
  let changes = 0;

  function update(key, fn) {
    if (!json[key]) return;
    const oldVal = json[key];
    const newVal = fn(oldVal);
    if (newVal !== oldVal) {
      json[key] = newVal;
      changes++;
    }
  }

  // ===== 1. ACCORDION : full LaTeX + titres =====
  update('prompt_accordion_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    if (!val.includes('α, β')) val += '\n' + T.accTitles[lang];
    return val;
  });

  // ===== 2. CHART : Unicode only =====
  update('prompt_chart_structure_json', val => {
    if (!val.includes('α, β') && !val.includes('Unicode')) val += '\n' + T.chartUnicode[lang];
    return val;
  });

  // ===== 3. CROSSWORD : LaTeX pour clues + letters-only =====
  update('prompt_crossword_structure_json', val => {
    if (!val.includes('frac{1}{2}') && !val.includes('alphabét') && !val.includes('alphabetical') && !val.includes('Buchstaben')) {
      val += '\n' + T.crossword[lang];
    }
    return val;
  });

  // ===== 4. DIALOG CARDS : full LaTeX =====
  update('prompt_dialog_cards_structure_json', val => {
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    return val;
  });

  // ===== 5. DRAG AND DROP : full LaTeX (remplacer l'ancien) =====
  update('prompt_drag_and_drop_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    return val;
  });

  // ===== 6. DRAG THE WORDS : marker constraint =====
  update('prompt_drag_the_words_structure_json', val => {
    if (!val.includes('DragTheWords') && !val.includes('Unicode')) val += '\n' + T.dragWords[lang];
    return val;
  });

  // ===== 7. FILL IN THE BLANKS : marker constraint =====
  update('prompt_fill_in_the_blanks_structure_json', val => {
    if (!val.includes('FillInTheBlanks') && !val.includes('Unicode')) val += '\n' + T.fillBlanks[lang];
    return val;
  });

  // ===== 8. MARK THE WORDS : marker constraint =====
  update('prompt_mark_the_words_structure_json', val => {
    if (!val.includes('MarkTheWords') && !val.includes('Unicode')) val += '\n' + T.markWords[lang];
    return val;
  });

  // ===== 9. FIND THE WORDS : no LaTeX =====
  update('prompt_find_the_words_structure_json', val => {
    if (!val.includes('FindTheWords') && !val.includes('Unicode')) val += '\n' + T.findWords[lang];
    return val;
  });

  // ===== 10. ESSAY : LaTeX pour taskDescription + keywords plain =====
  update('prompt_essay_structure_json', val => {
    if (!val.includes('frac{1}{2}')) val += '\n' + T.essay[lang];
    return val;
  });

  // ===== 11. FLASHCARDS : LaTeX pour text/tip + answer plain =====
  update('prompt_flashcards_structure_json', val => {
    if (!val.includes('frac{1}{2}')) val += '\n' + T.flashcards[lang];
    return val;
  });

  // ===== 12. ELEA APPARIEMENT : full LaTeX (remplacer l'ancien) =====
  update('prompt_elea_appariement_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    return val;
  });

  // ===== 13. ELEA DEVOIR : critères Unicode =====
  update('prompt_elea_devoir_structure_json', val => {
    if (!val.includes('α, β')) val += '\n' + T.devoir[lang];
    return val;
  });

  // ===== 14. ELEA GLOSSAIRE : Unicode only (remplacer l'ancien LaTeX) =====
  update('prompt_elea_glossaire_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('α, β')) val += '\n' + T.glossaire[lang];
    return val;
  });

  // ===== 15. ELEA MILLIONNAIRE : no LaTeX + Unicode =====
  update('prompt_elea_millionnaire_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('α, β') && !val.includes('Unicode')) val += '\n' + T.millionnaire[lang];
    return val;
  });

  // ===== 16. ELEA QCM : full LaTeX (remplacer l'ancien) =====
  update('prompt_elea_qcm_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    return val;
  });

  // ===== 17-22. MULTIPLE CHOICE, TRUE FALSE, QUIZSET*, COURSE PRESENTATION : enrichir LaTeX+Feedback =====
  const enrichKeys = [
    'prompt_multiple_choice_structure_json',
    'prompt_true_false_structure_json',
    'prompt_quizset_structure_json',
    'prompt_quizset_qcm_structure_json',
    'prompt_quizset_vf_structure_json',
    'prompt_course_presentation_structure_json'
  ];
  for (const key of enrichKeys) {
    update(key, val => enrichLatexFeedback(val, lang));
  }

  // ===== 23. TIMELINE : full LaTeX (remplacer l'ancien) =====
  update('prompt_timeline_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    return val;
  });

  // ===== 24. SINGLE CHOICE SET : full LaTeX (remplacer l'ancien) =====
  update('prompt_single_choice_set_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    return val;
  });

  // ===== 25. SORT THE PARAGRAPHS : full LaTeX (remplacer l'ancien) =====
  update('prompt_sort_the_paragraphs_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    return val;
  });

  // ===== 26. SUMMARY : full LaTeX + intro plain =====
  update('prompt_summary_structure_json', val => {
    val = removeOldLatex(val);
    if (!val.includes('frac{1}{2}')) val += '\n' + T.fullLatex[lang];
    if (!val.includes('intro')) val += '\n' + T.summaryIntro[lang];
    // intro field mentioned in value description, use more specific check
    return val;
  });

  // Écriture
  writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
  return changes;
}

// ==================== EXÉCUTION ====================
console.log('=== Mise à jour des contraintes LaTeX dans les fichiers de locale ===\n');

let total = 0;
for (const lang of LOCALES) {
  try {
    const n = processLocale(lang);
    console.log(`${lang}.json : ${n} clés modifiées`);
    total += n;
  } catch (err) {
    console.error(`ERREUR ${lang}.json :`, err.message);
    console.error(err.stack);
  }
}

console.log(`\nTotal : ${total} modifications dans ${LOCALES.length} fichiers.`);
