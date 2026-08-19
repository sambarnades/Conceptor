#!/usr/bin/env node
/**
 * Ajoute les clés i18n de l'export documentaire de parcours (agrégation
 * multi-activités — js/export/course-formatter.js) :
 *  - doc_fmt_course_default_title : titre de page de garde par défaut ;
 *  - doc_fmt_course_toc : titre du sommaire ;
 *  - doc_fmt_course_activities_count : compteur d'activités ({n} interpolé côté appelant) ;
 *  - doc_fmt_course_activity : libellé de repli pour un chapitre sans titre ;
 *  - doc_fmt_course_card_hint : en-tête de colonne « Indice » du tableau issu de la
 *    conversion des flashcardTable (les en-têtes Recto/Verso/Carte réutilisent
 *    doc_fmt_cp_card_front / doc_fmt_cp_card_back / doc_fmt_card_index existantes).
 *
 * Idempotent : n'écrit que les clés ABSENTES, insérées juste après `doc_fmt_footer_text`.
 * Usage : node scripts/add-course-export-locales.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el'];
const ROOT = new URL('../js/locales/', import.meta.url);
const ANCHOR = 'doc_fmt_footer_text';

const ORDER = [
    'doc_fmt_course_default_title',
    'doc_fmt_course_toc',
    'doc_fmt_course_activities_count',
    'doc_fmt_course_activity',
    'doc_fmt_course_card_hint'
];

const T = {
    doc_fmt_course_default_title: {
        fr: 'Parcours pédagogique', en: 'Learning path', es: 'Itinerario pedagógico',
        de: 'Lernpfad', it: 'Percorso didattico', nl: 'Leerpad',
        pt: 'Percurso pedagógico', ar: 'مسار تعليمي', zh: '教学路径',
        jp: '学習コース', el: 'Μαθησιακή διαδρομή'
    },
    doc_fmt_course_toc: {
        fr: 'Sommaire', en: 'Contents', es: 'Índice',
        de: 'Inhaltsverzeichnis', it: 'Sommario', nl: 'Inhoudsopgave',
        pt: 'Índice', ar: 'المحتويات', zh: '目录',
        jp: '目次', el: 'Περιεχόμενα'
    },
    doc_fmt_course_activities_count: {
        fr: 'Activités du parcours : {n}', en: 'Activities in this path: {n}',
        es: 'Actividades del itinerario: {n}', de: 'Aktivitäten im Lernpfad: {n}',
        it: 'Attività del percorso: {n}', nl: 'Activiteiten in het leerpad: {n}',
        pt: 'Atividades do percurso: {n}', ar: 'أنشطة المسار: {n}',
        zh: '路径中的活动：{n}', jp: 'コース内の活動：{n}',
        el: 'Δραστηριότητες της διαδρομής: {n}'
    },
    doc_fmt_course_activity: {
        fr: 'Activité', en: 'Activity', es: 'Actividad',
        de: 'Aktivität', it: 'Attività', nl: 'Activiteit',
        pt: 'Atividade', ar: 'نشاط', zh: '活动',
        jp: '活動', el: 'Δραστηριότητα'
    },
    doc_fmt_course_card_hint: {
        fr: 'Indice', en: 'Hint', es: 'Pista',
        de: 'Hinweis', it: 'Suggerimento', nl: 'Hint',
        pt: 'Dica', ar: 'تلميح', zh: '提示',
        jp: 'ヒント', el: 'Υπόδειξη'
    }
};

for (const lang of LOCALES) {
    const path = new URL(`${lang}.json`, ROOT);
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw);

    const missing = ORDER.filter(key => !(key in data));
    if (missing.length === 0) {
        console.log(`  ${lang} : déjà à jour`);
        continue;
    }
    if (!(ANCHOR in data)) {
        console.error(`  ${lang} : ancre « ${ANCHOR} » introuvable — fichier ignoré`);
        process.exitCode = 1;
        continue;
    }

    // Reconstruit l'objet en insérant les clés manquantes juste après l'ancre
    const out = {};
    for (const [key, value] of Object.entries(data)) {
        out[key] = value;
        if (key === ANCHOR) {
            for (const newKey of ORDER) {
                if (!(newKey in data)) out[newKey] = T[newKey][lang];
            }
        }
    }

    writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`  ${lang} : +${missing.length} clé(s) (${missing.join(', ')})`);
}

console.log('Terminé. Vérifier avec : node scripts/verify-all-locales.mjs');
