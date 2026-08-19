#!/usr/bin/env node
/**
 * Garde-fous du prompt « Vidéo interactive » contre la dérive de schéma des IA externes
 * (cas réel, audit 2026-07 : tableau nu `[...]`, `options` au lieu d'`answers`, objet
 * `feedback` global — le JSON collé plantait la génération).
 *
 * Injecte dans les 11 locales :
 *   1. `prompt_interactive_video_rappel_final` (NOUVELLE clé) : rappel court du format,
 *      placé par prompt-generator.js à la TOUTE FIN du prompt, après la transcription
 *      (le schéma détaillé est désormais AVANT les SOURCES — cf. buildActivityPrompt).
 *   2. Un bullet « Noms de champs » APPENDU à `prompt_interactive_video_structure_json` :
 *      interdit explicitement les alias inventés observés (`options`, `hint`, `feedback` global).
 *
 * Idempotent : n'écrit la clé 1 que si ABSENTE, n'appende le bullet 2 que si absent
 * (détection par la présence de « `options` » dans la valeur).
 * Usage : node scripts/add-iv-prompt-guardrails-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);

const RAPPEL_FINAL = {
    fr: 'RAPPEL FINAL : ta réponse est un OBJET JSON unique, conforme à la structure décrite plus haut — elle commence par `{` et contient `title`, `interactions` et `summary`. JAMAIS un tableau nu `[...]`, JAMAIS de champ `videoSource`, aucun texte hors du JSON.',
    en: 'FINAL REMINDER: your reply is a single JSON OBJECT matching the structure described above — it starts with `{` and contains `title`, `interactions` and `summary`. NEVER a bare array `[...]`, NEVER a `videoSource` field, no text outside the JSON.',
    es: 'RECORDATORIO FINAL: tu respuesta es un ÚNICO OBJETO JSON conforme a la estructura descrita más arriba — empieza por `{` y contiene `title`, `interactions` y `summary`. NUNCA un array suelto `[...]`, NUNCA un campo `videoSource`, ningún texto fuera del JSON.',
    de: 'LETZTE ERINNERUNG: Deine Antwort ist ein einziges JSON-OBJEKT gemäß der oben beschriebenen Struktur — sie beginnt mit `{` und enthält `title`, `interactions` und `summary`. NIEMALS ein nacktes Array `[...]`, NIEMALS ein Feld `videoSource`, kein Text außerhalb des JSON.',
    it: 'PROMEMORIA FINALE: la tua risposta è un UNICO OGGETTO JSON conforme alla struttura descritta sopra — inizia con `{` e contiene `title`, `interactions` e `summary`. MAI un array nudo `[...]`, MAI un campo `videoSource`, nessun testo fuori dal JSON.',
    nl: 'LAATSTE HERINNERING: je antwoord is één JSON-OBJECT volgens de hierboven beschreven structuur — het begint met `{` en bevat `title`, `interactions` en `summary`. NOOIT een kale array `[...]`, NOOIT een veld `videoSource`, geen tekst buiten de JSON.',
    pt: 'LEMBRETE FINAL: a tua resposta é um ÚNICO OBJETO JSON conforme a estrutura descrita acima — começa por `{` e contém `title`, `interactions` e `summary`. NUNCA um array solto `[...]`, NUNCA um campo `videoSource`, nenhum texto fora do JSON.',
    ar: 'تذكير أخير: إجابتك هي كائن JSON واحد مطابق للبنية الموصوفة أعلاه — تبدأ بـ `{` وتحتوي على `title` و`interactions` و`summary`. لا تُرجِع أبدًا مصفوفة مجردة `[...]`، ولا حقل `videoSource`، ولا أي نص خارج JSON.',
    zh: '最后提醒：你的回答必须是符合上文所述结构的单个 JSON 对象——以 `{` 开头，包含 `title`、`interactions` 和 `summary`。绝不要返回裸数组 `[...]`，绝不要包含 `videoSource` 字段，JSON 之外不得有任何文本。',
    jp: '最終リマインダー：回答は上で説明した構造に従う単一の JSON オブジェクトです。`{` で始まり、`title`、`interactions`、`summary` を含みます。裸の配列 `[...]` は絶対に返さず、`videoSource` フィールドも含めず、JSON 以外のテキストを書かないでください。',
    el: 'ΤΕΛΙΚΗ ΥΠΕΝΘΥΜΙΣΗ: η απάντησή σου είναι ΕΝΑ ενιαίο ΑΝΤΙΚΕΙΜΕΝΟ JSON σύμφωνα με τη δομή που περιγράφεται παραπάνω — αρχίζει με `{` και περιέχει `title`, `interactions` και `summary`. ΠΟΤΕ γυμνός πίνακας `[...]`, ΠΟΤΕ πεδίο `videoSource`, κανένα κείμενο εκτός του JSON.'
};

const FIELD_NAMES_BULLET = {
    fr: '\n- **Noms de champs :** utilise EXACTEMENT les noms listés ci-dessus. INTERDIT : `options` (le champ s\'appelle `answers`), `hint`, ou un objet `feedback` global au niveau d\'une question.',
    en: '\n- **Field names:** use EXACTLY the names listed above. FORBIDDEN: `options` (the field is called `answers`), `hint`, or a question-level global `feedback` object.',
    es: '\n- **Nombres de campos:** usa EXACTAMENTE los nombres listados arriba. PROHIBIDO: `options` (el campo se llama `answers`), `hint`, o un objeto `feedback` global a nivel de pregunta.',
    de: '\n- **Feldnamen:** Verwende EXAKT die oben aufgeführten Namen. VERBOTEN: `options` (das Feld heißt `answers`), `hint` oder ein globales `feedback`-Objekt auf Fragenebene.',
    it: '\n- **Nomi dei campi:** usa ESATTAMENTE i nomi elencati sopra. VIETATO: `options` (il campo si chiama `answers`), `hint`, o un oggetto `feedback` globale a livello di domanda.',
    nl: '\n- **Veldnamen:** gebruik EXACT de hierboven genoemde namen. VERBODEN: `options` (het veld heet `answers`), `hint`, of een globaal `feedback`-object op vraagniveau.',
    pt: '\n- **Nomes dos campos:** usa EXATAMENTE os nomes listados acima. PROIBIDO: `options` (o campo chama-se `answers`), `hint`, ou um objeto `feedback` global ao nível da pergunta.',
    ar: '\n- **أسماء الحقول:** استخدم بالضبط الأسماء المذكورة أعلاه. ممنوع: `options` (اسم الحقل هو `answers`)، أو `hint`، أو كائن `feedback` عام على مستوى السؤال.',
    zh: '\n- **字段名称：**必须严格使用上面列出的名称。禁止：`options`（该字段名为 `answers`）、`hint`，或问题级的全局 `feedback` 对象。',
    jp: '\n- **フィールド名：**上に列挙した名前を正確に使用してください。禁止：`options`（フィールド名は `answers`）、`hint`、および質問レベルの全体 `feedback` オブジェクト。',
    el: '\n- **Ονόματα πεδίων:** χρησιμοποίησε ΑΚΡΙΒΩΣ τα ονόματα που αναφέρονται παραπάνω. ΑΠΑΓΟΡΕΥΕΤΑΙ: `options` (το πεδίο λέγεται `answers`), `hint`, ή ένα καθολικό αντικείμενο `feedback` σε επίπεδο ερώτησης.'
};

const ANCHOR_KEY = 'prompt_interactive_video_structure_json';
const NEW_KEY = 'prompt_interactive_video_rappel_final';

for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const json = JSON.parse(readFileSync(path, 'utf8'));
    const actions = [];

    if (!(ANCHOR_KEY in json)) {
        console.warn(`⚠️  ${lang} : clé ${ANCHOR_KEY} absente — locale ignorée`);
        continue;
    }

    // 2. Bullet « Noms de champs » (idempotent : détection par « `options` »)
    if (!json[ANCHOR_KEY].includes('`options`')) {
        json[ANCHOR_KEY] += FIELD_NAMES_BULLET[lang];
        actions.push('structure_json += noms de champs');
    }

    // 1. Nouvelle clé, insérée juste APRÈS structure_json (regroupement lisible)
    if (!(NEW_KEY in json)) {
        const rebuilt = {};
        for (const [k, v] of Object.entries(json)) {
            rebuilt[k] = v;
            if (k === ANCHOR_KEY) rebuilt[NEW_KEY] = RAPPEL_FINAL[lang];
        }
        writeFileSync(path, JSON.stringify(rebuilt, null, 2) + '\n', 'utf8');
        actions.push(`+ ${NEW_KEY}`);
    } else if (actions.length) {
        writeFileSync(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
    }

    console.log(`${lang} : ${actions.length ? actions.join(' | ') : 'déjà à jour (aucune écriture)'}`);
}
