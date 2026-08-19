/**
 * @file Module d'agrégation multi-activités pour l'export documentaire.
 *
 * Fusionne les modèles formatés de plusieurs activités (H5P ou Moodle/Éléa)
 * en un unique modèle { title, sections } consommable tel quel par les
 * builders DOCX/ODT/PDF de document-exporter.js : page de garde (titre,
 * description, sommaire) puis un chapitre numéroté par activité, chacun
 * sur une nouvelle page.
 *
 * Contrainte structurelle motivant ce module : les trois builders génèrent
 * leurs styles GLOBALEMENT (bloc office:automatic-styles unique côté ODT,
 * scan des couleurs sur l'ensemble des sections…). La fusion doit donc se
 * faire au niveau du modèle formaté, en amont d'un unique appel au builder —
 * jamais en concaténant des documents produits séparément.
 *
 * Cas particulier : les sections `flashcardTable` (Flashcards/Dialog Cards)
 * détournent les builders vers un document « cartes imprimables » dédié qui
 * ignore toute autre section. Dans un parcours agrégé, elles sont converties
 * en tableau standard (type 'table', une ligne par carte) qui préserve le
 * contenu pédagogique : n° de carte, recto, verso, indices, image.
 *
 * Module volontairement pur (aucune dépendance aux libs d'export, aucun DOM) :
 * les points d'entrée téléchargement vivent dans document-exporter.js
 * (exportCourseToDOCX / exportCourseToODT / exportCourseToPDF).
 */

import { formatContentForDocument } from './document-formatter.js';
import { t } from '../core/translation.js';
import { stripHtml } from '../core/escape.js';

/**
 * Formate un parcours (liste ordonnée d'activités) en un modèle documentaire unique.
 *
 * @param {Object} course - Le parcours à agréger
 * @param {string} [course.title] - Titre du parcours (page de garde).
 *   Défaut : t('doc_fmt_course_default_title')
 * @param {string} [course.description] - Description affichée sur la page de garde
 *   (texte brut ; les balises HTML éventuelles sont retirées)
 * @param {Array<{moduleKey: string, jsonData: Object, title?: string}>} course.activities
 *   Activités dans l'ordre du parcours. `title` optionnel prime sur le titre du JSON.
 * @param {Object} [options={}] - Options passées à formatContentForDocument
 * @param {boolean} [options.keepLatex=false] - true pour DOCX/ODT (formules natives),
 *   false pour le PDF jsPDF (conversion LaTeX → Unicode)
 * @returns {Promise<{title: string, sections: Array}>} - Modèle fusionné
 * @throws {Error} si le parcours ne contient aucune activité
 */
export async function formatCourseForDocument(course, options = {}) {
    const activities = course && Array.isArray(course.activities) ? course.activities : [];
    if (activities.length === 0) {
        throw new Error('formatCourseForDocument : aucune activité à agréger');
    }

    const courseTitle = String(course.title || '').trim() || t('doc_fmt_course_default_title');

    // 1. Formater chaque activité via le pipeline mono-activité inchangé
    const chapters = [];
    for (let i = 0; i < activities.length; i++) {
        const { moduleKey, jsonData, title } = activities[i];
        const formatted = await formatContentForDocument(moduleKey, jsonData, options);
        let sections = convertFlashcardTables(formatted.sections || []);
        sections = trimTrailingPageBreaks(sections);

        const chapterTitle = String(title || '').trim()
            || String(formatted.title || '').trim()
            || `${t('doc_fmt_course_activity')} ${i + 1}`;
        const numberedTitle = `${i + 1}. ${chapterTitle}`;

        // Numérotation : le premier header niveau 1 devient le titre de chapitre ;
        // s'il n'existe pas (formatter sans titre), on en insère un.
        const first = sections[0];
        if (first && first.type === 'header' && first.level === 1) {
            first.text = numberedTitle;
        } else {
            sections.unshift({ type: 'header', level: 1, text: numberedTitle });
        }

        chapters.push({ title: numberedTitle, sections });
    }

    // 2. Page de garde : titre, description, nombre d'activités, sommaire
    const merged = [];
    merged.push({ type: 'header', level: 1, text: courseTitle });
    const description = stripHtml(course.description || '');
    if (description) {
        merged.push({ type: 'paragraph', text: description, style: 'description' });
    }
    merged.push({
        type: 'paragraph',
        text: t('doc_fmt_course_activities_count').replace('{n}', String(chapters.length))
    });
    merged.push({ type: 'separator' });
    merged.push({ type: 'header', level: 2, text: t('doc_fmt_course_toc') });
    chapters.forEach(ch => merged.push({ type: 'bulletPoint', text: ch.title }));

    // 3. Chapitres, chacun ouvrant sur une nouvelle page
    chapters.forEach(ch => {
        merged.push({ type: 'pageBreak' });
        merged.push(...ch.sections);
    });

    return { title: courseTitle, sections: merged };
}

/**
 * Convertit les sections `flashcardTable` (layout d'impression recto/verso par
 * pages de 8 cartes, ordre miroir au verso) en un unique tableau standard, une
 * ligne par carte. Les autres sections sont conservées telles quelles ; le
 * tableau prend la place de la première section flashcardTable rencontrée.
 *
 * Colonnes : Carte | Recto | Verso [| Indice si au moins une carte en a un].
 * L'image éventuelle du recto est portée par une cellule-objet
 * { text, imageUrl } — résolue ensuite par prepareImages (document-exporter).
 *
 * @param {Array} sections - Sections d'UNE activité formatée
 * @returns {Array} - Nouvelles sections, sans aucune flashcardTable
 */
export function convertFlashcardTables(sections) {
    if (!sections.some(s => s.type === 'flashcardTable')) {
        return sections.slice();
    }

    // Reconstituer chaque carte par numéro depuis les pages recto/verso
    const cards = new Map();
    const getCard = (n) => {
        if (!cards.has(n)) {
            cards.set(n, { front: '', back: '', frontHint: null, backHint: null, imageUrl: null });
        }
        return cards.get(n);
    };

    sections.forEach(s => {
        if (s.type !== 'flashcardTable' || !Array.isArray(s.rows)) return;
        s.rows.forEach(row => {
            [row.left, row.right].forEach(c => {
                if (!c || typeof c.cardNumber !== 'number') return;
                const card = getCard(c.cardNumber);
                if (s.side === 'verso') {
                    card.back = c.text || '';
                    if (c.hint) card.backHint = c.hint; // Dialog Cards : tips.back
                } else {
                    card.front = c.text || '';
                    if (c.hint) card.frontHint = c.hint; // tip / tips.front
                }
                if (c.imageUrl && !card.imageUrl) card.imageUrl = c.imageUrl;
            });
        });
    });

    const numbers = [...cards.keys()].sort((a, b) => a - b);
    const hasHints = numbers.some(n => cards.get(n).frontHint || cards.get(n).backHint);

    const headers = [t('doc_fmt_card_index'), t('doc_fmt_cp_card_front'), t('doc_fmt_cp_card_back')];
    if (hasHints) headers.push(t('doc_fmt_course_card_hint'));

    const rows = numbers.map(n => {
        const c = cards.get(n);
        const row = [
            String(n),
            c.imageUrl ? { text: c.front, imageUrl: c.imageUrl } : c.front,
            c.back
        ];
        if (hasHints) {
            row.push([c.frontHint, c.backHint].filter(Boolean).join(' / '));
        }
        return row;
    });

    const table = { type: 'table', headers, rows, style: 'recapTable' };

    const out = [];
    let inserted = false;
    sections.forEach(s => {
        if (s.type === 'flashcardTable') {
            if (!inserted) {
                out.push(table);
                inserted = true;
            }
            return;
        }
        out.push(s);
    });
    return out;
}

/**
 * Retire les sauts de page en fin de sections (les formatters terminent souvent
 * la correction par un pageBreak) — l'agrégateur pose le sien entre chapitres,
 * sans quoi on cumulerait des pages blanches.
 * @param {Array} sections
 * @returns {Array}
 */
function trimTrailingPageBreaks(sections) {
    const out = sections.slice();
    while (out.length > 0 && out[out.length - 1].type === 'pageBreak') {
        out.pop();
    }
    return out;
}

/**
 * Retire les balises HTML d'un texte de description (page de garde).
 * Volontairement minimal : la description d'un parcours est un texte court,
 * pas du contenu riche — pour le HTML pédagogique, voir sanitizer.js.
 * @param {string} value
 * @returns {string}
 */
// Doublon retiré : `stripHtml` canonique dans `core/escape.js`.
