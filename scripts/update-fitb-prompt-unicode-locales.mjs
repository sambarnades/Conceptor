#!/usr/bin/env node
/**
 * Remplace, dans `prompt_fill_in_the_blanks_structure_json` des 11 locales, la ligne LaTeX
 * CONTRADICTOIRE (« ne supporte PAS le LaTeX » MAIS « sera converti automatiquement » — ce
 * message ambigu poussait le modèle à mettre du `\(\frac{}{}\)` dans les trous, qui cassait
 * sur les phrases à plusieurs formules) par une consigne CLAIRE « écris les maths en Unicode
 * direct dans les trous ; réserve `\(...\)` à la consigne ».
 *
 * Validé par A/B ciblé (2026-07-14, 200 tirages Texte à trous) : délimiteurs `\(` dans les
 * trous 80 % → 7 % (Fisher p < 0,0001), math préservée (95 %), 0 échec de build, 0 déséquilibre
 * côté variante. Cf. mémoire [[math-e2e-qa-campagne]].
 *
 * Détection de la ligne (langue-agnostique) : la seule ligne contenant « LaTeX » ET
 * « taskDescription ». Idempotent : marqueur Unicode invariant « ½ ⅓ ¼ ¾ ».
 * Usage : node scripts/update-fitb-prompt-unicode-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const KEY = 'prompt_fill_in_the_blanks_structure_json';
const SENTINEL = '½ ⅓ ¼ ¾'; // invariant : présent uniquement dans la nouvelle consigne

const D = '\\\\'; // -> runtime \\ (forme JSON montrée au LLM)
const O = `${D}(`, C = `${D})`, FR = `${D}frac`, SQ = `${D}sqrt`;

const NEW = {
    fr: `- **Maths dans les trous :** dans \`questions\`, écris les mathématiques DIRECTEMENT en Unicode / texte simple : fractions ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (ou « 2/5 » s'il n'existe pas de caractère), puissances x² x³ aⁿ, racines √2 √3, symboles × ÷ π ≠ ≤ ≥ ∈. N'utilise JAMAIS les délimiteurs ${O} ... ${C} ni les commandes ${FR}, ${SQ} dans \`questions\` (ce champ ne rend PAS le LaTeX). Réserve ${O} ... ${C} uniquement à la consigne \`taskDescription\`. Exemple correct : « Pour additionner ⅔ et ⅙, il faut d'abord trouver un *dénominateur* commun. »`,
    en: `- **Math in the gaps:** in \`questions\`, write mathematics DIRECTLY in Unicode / plain text: fractions ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (or "2/5" if no character exists), powers x² x³ aⁿ, roots √2 √3, symbols × ÷ π ≠ ≤ ≥ ∈. NEVER use the delimiters ${O} ... ${C} nor the commands ${FR}, ${SQ} in \`questions\` (this field does NOT render LaTeX). Reserve ${O} ... ${C} for the \`taskDescription\` instruction only. Correct example: "To add ⅔ and ⅙, you first need to find a common *denominator*."`,
    es: `- **Matemáticas en los huecos:** en \`questions\`, escribe las matemáticas DIRECTAMENTE en Unicode / texto simple: fracciones ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (o «2/5» si no existe carácter), potencias x² x³ aⁿ, raíces √2 √3, símbolos × ÷ π ≠ ≤ ≥ ∈. NUNCA uses los delimitadores ${O} ... ${C} ni los comandos ${FR}, ${SQ} en \`questions\` (este campo NO renderiza LaTeX). Reserva ${O} ... ${C} solo para la consigna \`taskDescription\`. Ejemplo correcto: «Para sumar ⅔ y ⅙, primero hay que encontrar un *denominador* común.»`,
    de: `- **Mathe in den Lücken:** Schreibe in \`questions\` Mathematik DIREKT in Unicode / einfachem Text: Brüche ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (oder „2/5", wenn kein Zeichen existiert), Potenzen x² x³ aⁿ, Wurzeln √2 √3, Symbole × ÷ π ≠ ≤ ≥ ∈. Verwende in \`questions\` NIEMALS die Trennzeichen ${O} ... ${C} oder die Befehle ${FR}, ${SQ} (dieses Feld rendert KEIN LaTeX). Reserviere ${O} ... ${C} nur für die Anweisung \`taskDescription\`. Korrektes Beispiel: „Um ⅔ und ⅙ zu addieren, muss man zuerst einen gemeinsamen *Nenner* finden."`,
    it: `- **Matematica nelle lacune:** in \`questions\`, scrivi la matematica DIRETTAMENTE in Unicode / testo semplice: frazioni ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (o «2/5» se non esiste un carattere), potenze x² x³ aⁿ, radici √2 √3, simboli × ÷ π ≠ ≤ ≥ ∈. Non usare MAI i delimitatori ${O} ... ${C} né i comandi ${FR}, ${SQ} in \`questions\` (questo campo NON rende il LaTeX). Riserva ${O} ... ${C} solo alla consegna \`taskDescription\`. Esempio corretto: «Per addizionare ⅔ e ⅙, bisogna prima trovare un *denominatore* comune.»`,
    nl: `- **Wiskunde in de gaten:** schrijf in \`questions\` wiskunde DIRECT in Unicode / platte tekst: breuken ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (of "2/5" als er geen teken bestaat), machten x² x³ aⁿ, wortels √2 √3, symbolen × ÷ π ≠ ≤ ≥ ∈. Gebruik in \`questions\` NOOIT de scheidingstekens ${O} ... ${C} of de commando's ${FR}, ${SQ} (dit veld rendert GEEN LaTeX). Reserveer ${O} ... ${C} alleen voor de instructie \`taskDescription\`. Correct voorbeeld: "Om ⅔ en ⅙ op te tellen, moet je eerst een gemeenschappelijke *noemer* vinden."`,
    pt: `- **Matemática nos espaços:** em \`questions\`, escreve a matemática DIRETAMENTE em Unicode / texto simples: frações ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (ou «2/5» se não existir carácter), potências x² x³ aⁿ, raízes √2 √3, símbolos × ÷ π ≠ ≤ ≥ ∈. NUNCA uses os delimitadores ${O} ... ${C} nem os comandos ${FR}, ${SQ} em \`questions\` (este campo NÃO renderiza LaTeX). Reserva ${O} ... ${C} apenas para a instrução \`taskDescription\`. Exemplo correto: «Para somar ⅔ e ⅙, é preciso primeiro encontrar um *denominador* comum.»`,
    ar: `- **الرياضيات في الفراغات:** في \`questions\`، اكتب الرياضيات مباشرةً بـ Unicode / نص بسيط: الكسور ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (أو «2/5» إن لم يوجد رمز)، القوى x² x³ aⁿ، الجذور √2 √3، الرموز × ÷ π ≠ ≤ ≥ ∈. لا تستخدم أبدًا الفواصل ${O} ... ${C} ولا الأوامر ${FR}، ${SQ} في \`questions\` (هذا الحقل لا يعرض LaTeX). احتفظ بـ ${O} ... ${C} لتعليمة \`taskDescription\` فقط. مثال صحيح: «لجمع ⅔ و⅙، عليك أولًا إيجاد *مقام* مشترك.»`,
    zh: `- **填空中的数学：**在 \`questions\` 中直接用 Unicode / 纯文本书写数学：分数 ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚（若无对应字符则写「2/5」）、幂 x² x³ aⁿ、根号 √2 √3、符号 × ÷ π ≠ ≤ ≥ ∈。在 \`questions\` 中绝不要使用定界符 ${O} ... ${C} 或命令 ${FR}、${SQ}（该字段不渲染 LaTeX）。仅在说明 \`taskDescription\` 中保留 ${O} ... ${C}。正确示例：「要计算 ⅔ 加 ⅙，先要找到公共*分母*。」`,
    jp: `- **穴埋め内の数式：**\`questions\` では数式を直接 Unicode / プレーンテキストで書く：分数 ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚（対応する文字がなければ「2/5」）、べき x² x³ aⁿ、根号 √2 √3、記号 × ÷ π ≠ ≤ ≥ ∈。\`questions\` では区切り記号 ${O} ... ${C} やコマンド ${FR}、${SQ} を絶対に使わない（このフィールドは LaTeX を描画しない）。${O} ... ${C} は指示 \`taskDescription\` のみに使う。正しい例：「⅔ と ⅙ を足すには、まず共通の*分母*を見つける必要がある。」`,
    el: `- **Μαθηματικά στα κενά:** στο \`questions\`, γράψε τα μαθηματικά ΑΠΕΥΘΕΙΑΣ σε Unicode / απλό κείμενο: κλάσματα ½ ⅓ ¼ ¾ ⅔ ⅙ ⅚ (ή «2/5» αν δεν υπάρχει χαρακτήρας), δυνάμεις x² x³ aⁿ, ρίζες √2 √3, σύμβολα × ÷ π ≠ ≤ ≥ ∈. Μη χρησιμοποιείς ΠΟΤΕ τους οριοθέτες ${O} ... ${C} ούτε τις εντολές ${FR}, ${SQ} στο \`questions\` (αυτό το πεδίο ΔΕΝ αποδίδει LaTeX). Κράτα τους ${O} ... ${C} μόνο για την οδηγία \`taskDescription\`. Σωστό παράδειγμα: «Για να προσθέσεις ⅔ και ⅙, πρέπει πρώτα να βρεις έναν κοινό *παρονομαστή*.»`,
};

let changed = 0;
for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const json = JSON.parse(readFileSync(path, 'utf8'));
    if (!(KEY in json)) { console.warn(`⚠️  ${lang} : clé ${KEY} absente — ignorée`); continue; }
    if (json[KEY].includes(SENTINEL)) { console.log(`${lang} : déjà à jour`); continue; }
    const lines = json[KEY].split('\n');
    const idx = lines.findIndex(l => l.includes('LaTeX') && l.includes('taskDescription'));
    if (idx < 0) { console.warn(`⚠️  ${lang} : ligne LaTeX+taskDescription introuvable — ignorée`); continue; }
    lines[idx] = NEW[lang];
    json[KEY] = lines.join('\n');
    writeFileSync(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
    changed++;
    console.log(`${lang} : ligne LaTeX → consigne « Unicode direct »`);
}
console.log(`\n${changed} locale(s) modifiée(s).`);
