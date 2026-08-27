// scripts/add-cancel-generation-locales.mjs
// Ajoute les 4 clés du bouton « Arrêter » de l'overlay de génération aux 11 locales.
//
//   generation_cancel_btn   libellé du bouton (discret, un seul mot si possible)
//   generation_cancel_aria  aria-label du bouton (explicite, lu par les lecteurs d'écran)
//   generation_cancelling   libellé pendant l'arrêt (le clic doit se voir)
//   generation_cancelled    notification une fois l'attente coupée
//
// Le message d'arrêt dit la vérité : Caramel cesse d'ATTENDRE. La tâche déjà
// soumise finit sa course côté serveur — promettre l'inverse serait faux, et
// l'enseignant qui relance aussitôt doit savoir qu'il n'a rien cassé.
//
// Idempotent. Usage : node scripts/add-cancel-generation-locales.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const AFTER = 'generation_failed_llm';   // voisinage : messages de fin de génération

const T = {
    fr: {
        generation_cancel_btn: 'Arrêter',
        generation_cancel_aria: 'Arrêter la génération en cours',
        generation_cancelling: 'Arrêt en cours…',
        generation_cancelled: 'Génération arrêtée. Caramel n\'attend plus la réponse de l\'IA — vous pouvez relancer quand vous voulez.',
    },
    en: {
        generation_cancel_btn: 'Stop',
        generation_cancel_aria: 'Stop the generation in progress',
        generation_cancelling: 'Stopping…',
        generation_cancelled: 'Generation stopped. Caramel is no longer waiting for the AI — you can start again whenever you like.',
    },
    es: {
        generation_cancel_btn: 'Detener',
        generation_cancel_aria: 'Detener la generación en curso',
        generation_cancelling: 'Deteniendo…',
        generation_cancelled: 'Generación detenida. Caramel ya no espera la respuesta de la IA: puedes volver a empezar cuando quieras.',
    },
    de: {
        generation_cancel_btn: 'Stoppen',
        generation_cancel_aria: 'Laufende Generierung stoppen',
        generation_cancelling: 'Wird gestoppt…',
        generation_cancelled: 'Generierung gestoppt. Caramel wartet nicht mehr auf die KI — du kannst jederzeit neu starten.',
    },
    it: {
        generation_cancel_btn: 'Interrompi',
        generation_cancel_aria: 'Interrompi la generazione in corso',
        generation_cancelling: 'Interruzione…',
        generation_cancelled: 'Generazione interrotta. Caramel non attende più la risposta dell\'IA: puoi ricominciare quando vuoi.',
    },
    nl: {
        generation_cancel_btn: 'Stoppen',
        generation_cancel_aria: 'De lopende generatie stoppen',
        generation_cancelling: 'Bezig met stoppen…',
        generation_cancelled: 'Generatie gestopt. Caramel wacht niet langer op de AI — je kunt opnieuw beginnen wanneer je wilt.',
    },
    pt: {
        generation_cancel_btn: 'Parar',
        generation_cancel_aria: 'Parar a geração em curso',
        generation_cancelling: 'A parar…',
        generation_cancelled: 'Geração parada. O Caramel já não espera pela resposta da IA — podes recomeçar quando quiseres.',
    },
    ar: {
        generation_cancel_btn: 'إيقاف',
        generation_cancel_aria: 'إيقاف عملية الإنشاء الجارية',
        generation_cancelling: 'جارٍ الإيقاف…',
        generation_cancelled: 'تم إيقاف الإنشاء. لم يعد Caramel ينتظر ردّ الذكاء الاصطناعي — يمكنك إعادة المحاولة متى شئت.',
    },
    zh: {
        generation_cancel_btn: '停止',
        generation_cancel_aria: '停止正在进行的生成',
        generation_cancelling: '正在停止…',
        generation_cancelled: '已停止生成。Caramel 不再等待 AI 的回复——你可以随时重新开始。',
    },
    jp: {
        generation_cancel_btn: '中止',
        generation_cancel_aria: '実行中の生成を中止する',
        generation_cancelling: '中止しています…',
        generation_cancelled: '生成を中止しました。Caramel は AI の応答を待たなくなりました。いつでもやり直せます。',
    },
    el: {
        generation_cancel_btn: 'Διακοπή',
        generation_cancel_aria: 'Διακοπή της δημιουργίας που εκτελείται',
        generation_cancelling: 'Διακοπή…',
        generation_cancelled: 'Η δημιουργία διακόπηκε. Το Caramel δεν περιμένει πλέον την απάντηση της ΤΝ — μπορείτε να ξεκινήσετε ξανά όποτε θέλετε.',
    },
};

let touched = 0;
for (const [lang, paires] of Object.entries(T)) {
    const path = `js/locales/${lang}.json`;
    const json = JSON.parse(readFileSync(path, 'utf8'));
    if (Object.entries(paires).every(([k, v]) => json[k] === v)) {
        console.log(`  ${lang} — déjà à jour`);
        continue;
    }
    // Réinsertion ordonnée : les clés se posent juste après AFTER plutôt qu'en
    // fin de fichier (ces locales se relisent à la main).
    const out = {};
    for (const [k, v] of Object.entries(json)) {
        if (k in paires) continue;
        out[k] = v;
        if (k === AFTER) Object.assign(out, paires);
    }
    for (const [k, v] of Object.entries(paires)) if (!(k in out)) out[k] = v;

    writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    touched++;
    console.log(`  ${lang} — ${Object.keys(paires).length} clés ajoutées`);
}
console.log(`\n${touched} locale(s) modifiée(s).`);
