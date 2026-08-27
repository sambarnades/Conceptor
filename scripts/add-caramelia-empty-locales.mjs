// scripts/add-caramelia-empty-locales.mjs
// Ajoute la clé `help_error_empty` aux 11 locales Caramelia.
//
// Motif : depuis le 2026-08-27, `runAutoQuery` distingue « service injoignable »
// (message hors-ligne) de « le service a répondu, mais sans un mot ». Le second
// cas s'affichait comme « je n'arrive pas à me connecter », ce qui est faux — la
// connexion avait réussi — et envoyait l'utilisateur vérifier son réseau pour rien.
//
// Idempotent : relancé, il ne réécrit rien si la clé est déjà là.
// Usage : node scripts/add-caramelia-empty-locales.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const KEY = 'help_error_empty';
// Inséré juste après cette clé, pour garder les messages d'erreur groupés.
const AFTER = 'help_error_server';

const T = {
    fr: "🤐 Le serveur m'a répondu, mais sans un mot. Ça arrive quand le modèle est surchargé — réessaie, ça repart en général tout de suite.",
    en: "🤐 The server answered, but said nothing. That happens when the model is overloaded — try again, it usually works right away.",
    es: "🤐 El servidor respondió, pero sin decir nada. Ocurre cuando el modelo está sobrecargado: vuelve a intentarlo, suele funcionar enseguida.",
    de: "🤐 Der Server hat geantwortet, aber kein Wort gesagt. Das passiert, wenn das Modell überlastet ist — versuche es erneut, meist klappt es sofort.",
    it: "🤐 Il server ha risposto, ma senza dire nulla. Succede quando il modello è sovraccarico: riprova, di solito funziona subito.",
    nl: "🤐 De server antwoordde, maar zei niets. Dat gebeurt wanneer het model overbelast is — probeer het opnieuw, meestal lukt het meteen.",
    pt: "🤐 O servidor respondeu, mas sem dizer nada. Acontece quando o modelo está sobrecarregado — tenta novamente, normalmente funciona logo.",
    ar: "🤐 ردّ الخادم لكن دون أي كلمة. يحدث ذلك عندما يكون النموذج مثقلاً — أعد المحاولة، وغالبًا ما ينجح الأمر فورًا.",
    zh: "🤐 服务器回应了，却什么也没说。这通常是模型过载所致——请重试，一般马上就能成功。",
    jp: "🤐 サーバーは応答しましたが、内容が空でした。モデルが混み合っているときに起こります。もう一度お試しください。たいていはすぐに成功します。",
    el: "🤐 Ο διακομιστής απάντησε, αλλά χωρίς λέξη. Συμβαίνει όταν το μοντέλο είναι υπερφορτωμένο — δοκιμάστε ξανά, συνήθως πετυχαίνει αμέσως.",
};

let touched = 0;
for (const [lang, value] of Object.entries(T)) {
    const path = `js/caramelia/locales/${lang}.json`;
    const json = JSON.parse(readFileSync(path, 'utf8'));
    if (json[KEY] === value) { console.log(`  ${lang} — déjà à jour`); continue; }

    // Réinsertion ordonnée : on reconstruit l'objet pour placer la clé juste
    // après AFTER plutôt qu'en fin de fichier (les locales sont relues à la main).
    const out = {};
    for (const [k, v] of Object.entries(json)) {
        if (k === KEY) continue;
        out[k] = v;
        if (k === AFTER) out[KEY] = value;
    }
    if (!(KEY in out)) out[KEY] = value;   // AFTER absent : on ajoute à la fin

    writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    touched++;
    console.log(`  ${lang} — ${KEY} ajoutée`);
}
console.log(`\n${touched} locale(s) modifiée(s).`);
