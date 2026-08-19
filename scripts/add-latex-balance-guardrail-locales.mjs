#!/usr/bin/env node
/**
 * Garde-fou « équilibre des formules LaTeX » ajouté à `prompt_regles_pedagogiques_communes`
 * (injecté dans TOUS les prompts d'activité par prompt-generator.js).
 *
 * Motivation (campagne de tests réels math 2026-07, 117 activités générées via le vrai LLM) :
 * ~2 % des activités math sortaient une formule cassée par une bévue du modèle —
 *   • un délimiteur ouvrant `\(` oublié (→ `\)` orphelin, math rendue en texte brut) ;
 *   • une accolade `}` en trop (`\sqrt{a+b}}`).
 * Les règles communes couvraient déjà l'ÉCHAPPEMENT (`\\( … \\)`) mais jamais l'ÉQUILIBRE.
 * Ce bullet cible précisément ça. Le healer ne peut réparer que le LaTeX DANS des `\(...\)`
 * équilibrés, donc mieux vaut que le modèle ne casse pas l'équilibre en amont.
 *
 * Convention : on montre au LLM la forme JSON à DOUBLE antislash `\\(` (comme les autres
 * prompts) — c.-à-d. la valeur runtime contient `\\(`, stockée `\\\\(` dans le fichier.
 * Idempotent : détecté par la présence de l'exemple `\\sqrt{x}, x^{2}`.
 * Usage : node scripts/add-latex-balance-guardrail-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const KEY = 'prompt_regles_pedagogiques_communes';

// D = double antislash tel que vu par le LLM (forme JSON). Source `'\\\\'` → chaîne JS `\\`.
const D = '\\\\';
const OPEN = `${D}(`, CLOSE = `${D})`;        // \\(  \\)
const DOPEN = `${D}[`, DCLOSE = `${D}]`;      // \\[  \\]
const FRAC = `${D}frac{a}{b}`, SQRT = `${D}sqrt{x}`; // \\frac{a}{b}  \\sqrt{x}
// Marqueur d'idempotence : jeton LaTeX identique dans les 11 langues (indépendant de la
// ponctuation — ar/zh/jp utilisent leur propre virgule). `\\sqrt{x}` n'existe que dans ce bullet.
const SENTINEL = SQRT;

// Prose par langue ; les jetons LaTeX (OPEN/CLOSE/…) sont identiques partout.
const BULLET = {
    fr: `\n- Formules mathématiques : chaque délimiteur ouvrant a son fermant — une formule en ligne s'écrit ${OPEN} … ${CLOSE} (jamais un ${OPEN} ou un ${CLOSE} isolé), une formule mise en évidence ${DOPEN} … ${DCLOSE} ; équilibre aussi les accolades { } de chaque commande (${FRAC}, ${SQRT}, x^{2}).`,
    en: `\n- Mathematical formulas: every opening delimiter has its closing one — an inline formula is written ${OPEN} … ${CLOSE} (never a lone ${OPEN} or ${CLOSE}), a displayed formula ${DOPEN} … ${DCLOSE} ; also balance the braces { } of every command (${FRAC}, ${SQRT}, x^{2}).`,
    es: `\n- Fórmulas matemáticas: cada delimitador de apertura tiene el de cierre — una fórmula en línea se escribe ${OPEN} … ${CLOSE} (nunca un ${OPEN} o un ${CLOSE} suelto), una fórmula destacada ${DOPEN} … ${DCLOSE} ; equilibra también las llaves { } de cada comando (${FRAC}, ${SQRT}, x^{2}).`,
    de: `\n- Mathematische Formeln: Zu jedem öffnenden Trennzeichen gehört das schließende — eine Inline-Formel wird ${OPEN} … ${CLOSE} geschrieben (nie ein einzelnes ${OPEN} oder ${CLOSE}), eine abgesetzte Formel ${DOPEN} … ${DCLOSE} ; setze auch die geschweiften Klammern { } jedes Befehls ausgeglichen (${FRAC}, ${SQRT}, x^{2}).`,
    it: `\n- Formule matematiche: ogni delimitatore di apertura ha quello di chiusura — una formula in linea si scrive ${OPEN} … ${CLOSE} (mai un ${OPEN} o un ${CLOSE} da solo), una formula in evidenza ${DOPEN} … ${DCLOSE} ; bilancia anche le parentesi graffe { } di ogni comando (${FRAC}, ${SQRT}, x^{2}).`,
    nl: `\n- Wiskundige formules: elk openend scheidingsteken heeft zijn sluitende — een formule in de lopende tekst schrijf je ${OPEN} … ${CLOSE} (nooit een losse ${OPEN} of ${CLOSE}), een uitgelichte formule ${DOPEN} … ${DCLOSE} ; houd ook de accolades { } van elk commando in balans (${FRAC}, ${SQRT}, x^{2}).`,
    pt: `\n- Fórmulas matemáticas: cada delimitador de abertura tem o de fecho — uma fórmula em linha escreve-se ${OPEN} … ${CLOSE} (nunca um ${OPEN} ou um ${CLOSE} sozinho), uma fórmula em destaque ${DOPEN} … ${DCLOSE} ; equilibra também as chavetas { } de cada comando (${FRAC}, ${SQRT}, x^{2}).`,
    ar: `\n- الصيغ الرياضية: لكل فاصل افتتاحي فاصل إغلاق — تُكتب الصيغة داخل السطر ${OPEN} … ${CLOSE} (لا تترك أبدًا ${OPEN} أو ${CLOSE} بمفرده)، والصيغة المعروضة ${DOPEN} … ${DCLOSE} ؛ وازِن أيضًا الأقواس المعقوفة { } في كل أمر (${FRAC}، ${SQRT}، x^{2}).`,
    zh: `\n- 数学公式：每个左定界符都要有配对的右定界符——行内公式写作 ${OPEN} … ${CLOSE}（绝不出现单独的 ${OPEN} 或 ${CLOSE}），单独展示的公式写作 ${DOPEN} … ${DCLOSE}；同时保证每个命令的花括号 { } 成对（${FRAC}、${SQRT}、x^{2}）。`,
    jp: `\n- 数式：開き区切り記号には必ず対応する閉じ記号を付ける——行内の数式は ${OPEN} … ${CLOSE}（${OPEN} や ${CLOSE} を単独で使わない）、独立表示の数式は ${DOPEN} … ${DCLOSE}。各コマンドの波括弧 { } も過不足なく対応させる（${FRAC}、${SQRT}、x^{2}）。`,
    el: `\n- Μαθηματικοί τύποι: κάθε οριοθέτης ανοίγματος έχει τον αντίστοιχο κλεισίματος — ένας τύπος σε σειρά γράφεται ${OPEN} … ${CLOSE} (ποτέ μεμονωμένο ${OPEN} ή ${CLOSE}), ένας τύπος σε ανάδειξη ${DOPEN} … ${DCLOSE} · ισοστάθμισε επίσης τα άγκιστρα { } κάθε εντολής (${FRAC}, ${SQRT}, x^{2}).`,
};

let changed = 0;
for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const json = JSON.parse(readFileSync(path, 'utf8'));
    if (!(KEY in json)) { console.warn(`⚠️  ${lang} : clé ${KEY} absente — ignorée`); continue; }
    if (json[KEY].includes(SENTINEL)) { console.log(`${lang} : déjà à jour`); continue; }
    json[KEY] += BULLET[lang];
    writeFileSync(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
    changed++;
    console.log(`${lang} : + garde-fou équilibre LaTeX`);
}
console.log(`\n${changed} locale(s) modifiée(s).`);
