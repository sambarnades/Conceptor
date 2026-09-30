/**
 * @file Parcours — les modules natifs ouverts le 27 sept. 2026.
 *
 * Tous sont RELEVÉS, champ par champ, sur deux exports authentiques faits le
 * même soir : un cours d'Éléa (test03, Moodle 5.1.7) et un cours de Magistère
 * (Grenoble, Moodle 5.1.7), remplis de TOUS les types que chaque palette
 * propose, avec du contenu — questions, pages, critères, colonnes. Les formes
 * de référence sont dans `tests/fixtures/moodle-reference/sept-2026/` (D70).
 *
 * **Trois niveaux, et chaque module sait le sien** (`niveau`) :
 *
 *   - `amorce`  : le modèle écrit tout ce que la restauration conserve — une
 *                 consigne, et selon le module des questions, des pages, des
 *                 critères, des colonnes, des rubriques, un texte de départ.
 *   - `source`  : l'enseignant fournit ce que le modèle ne peut pas inventer
 *                 (l'adresse d'un lien) ; la carte l'attend avant la génération,
 *                 comme une vidéo attend son URL.
 *   - `reserve` : le module arrive posé et expliqué, mais il demande un geste
 *                 sur la plateforme (créer les groupes, planifier la séance,
 *                 faire avancer les phases). Ce geste est écrit dans l'étiquette
 *                 « À faire avant d'ouvrir le cours », cachée aux élèves (D72).
 *
 * **Achèvement.** Chaque module garde le réglage que la plateforme lui donne
 * d'elle-même. Ceux qui n'en ont pas (`sansAchevement`) sont tenus HORS de
 * l'ouverture progressive : une condition qu'aucun élève ne peut remplir
 * fermerait l'étape suivante pour toujours (D71).
 *
 * @module parcours/modules-natifs
 */

import { t, currentLang } from '../core/translation.js';
import { languageCodes } from '../core/language-codes.js';
import { tr } from './dom.js';
import { escapeXml } from '../moodle/moodle-formats.js';
import { ID, tronquer, nom, html, activiteXml, graine, hexa, jeton, grasUneFois } from './modules-socle.js';

/* ------------------------------------------------------------------ *
 *  Formats texte des contenus structurés
 * ------------------------------------------------------------------ */

/**
 * Les questions d'un Questionnaire ou d'une enquête Feedback.
 *
 * Le modèle les écrit en JSON ; l'enseignant les retouche en TEXTE, dans une
 * syntaxe qui se lit sans mode d'emploi :
 *
 *     ? D'où vient l'eau de pluie ?        ← une réponse parmi les choix
 *     - Des océans
 *     - Des rivières
 *     ?+ Quels états de l'eau connais-tu ?  ← plusieurs réponses possibles
 *     - Solide
 *     - Liquide
 *     ?! As-tu déjà étudié ce sujet ?       ← oui / non
 *     ? Décris une situation observée.      ← sans choix : réponse libre
 *
 * Les deux formes se convertissent l'une dans l'autre sans perte.
 */
export const TYPES_QUESTION = Object.freeze(['unique', 'multiple', 'ouinon', 'libre']);

export function normaliserQuestions(liste) {
    return (Array.isArray(liste) ? liste : []).map(q => {
        if (typeof q === 'string') return { texte: q.trim(), type: 'libre', choix: [] };
        const texte = String(q?.texte ?? q?.question ?? q?.text ?? '').trim();
        const brut = q?.choix ?? q?.choices ?? q?.options;
        const choix = (Array.isArray(brut) ? brut : [])
            .map(c => String(typeof c === 'string' ? c : (c?.texte ?? c?.text ?? '')).trim())
            .filter(Boolean)
            .slice(0, 10);
        let type = String(q?.type || '').toLowerCase();
        if (!TYPES_QUESTION.includes(type)) type = choix.length ? 'unique' : 'libre';
        // Une question « à choix » sans au moins deux choix n'en est pas une :
        // on la rend libre plutôt que de livrer un bouton radio solitaire.
        if ((type === 'unique' || type === 'multiple') && choix.length < 2) type = 'libre';
        return { texte, type, choix: type === 'unique' || type === 'multiple' ? choix : [] };
    }).filter(q => q.texte).slice(0, 15);
}

export function questionsVersTexte(questions) {
    return normaliserQuestions(questions).map(q => {
        const marque = q.type === 'multiple' ? '?+' : q.type === 'ouinon' ? '?!' : '?';
        return [`${marque} ${q.texte}`, ...q.choix.map(c => `- ${c}`)].join('\n');
    }).join('\n\n');
}

export function questionsDepuisTexte(texte) {
    const questions = [];
    let q = null;
    for (const brute of String(texte || '').split('\n')) {
        const ligne = brute.trim();
        if (!ligne) continue;
        const question = /^\?([+!]?)\s*(.*)$/.exec(ligne);
        if (question) {
            q = { texte: question[2].trim(), type: question[1] === '+' ? 'multiple' : question[1] === '!' ? 'ouinon' : 'unique', choix: [] };
            questions.push(q);
            continue;
        }
        const choix = /^[-•*]\s*(.*)$/.exec(ligne);
        if (choix && q) { q.choix.push(choix[1].trim()); continue; }
        // Une ligne nue prolonge l'énoncé en cours ; après des choix, elle
        // ouvre une nouvelle question — on ne perd jamais ce qui a été tapé.
        if (q && !q.choix.length) q.texte = `${q.texte} ${ligne}`.trim();
        else { q = { texte: ligne, type: 'unique', choix: [] }; questions.push(q); }
    }
    return normaliserQuestions(questions);
}

/**
 * Les pages d'une Leçon.
 *
 *     # Le Soleil, moteur du cycle          ← une page
 *     Le Soleil chauffe l'eau des océans…   ← son texte (plusieurs lignes)
 *     ? Quelle énergie provoque l'évaporation ?   ← question facultative
 *     + Le Soleil                           ← la bonne réponse
 *     - Le vent                             ← une mauvaise réponse
 */
export function normaliserPages(liste) {
    return (Array.isArray(liste) ? liste : []).map(p => {
        if (typeof p === 'string') return { titre: '', texte: p.trim(), question: '', reponses: [] };
        const titre = String(p?.titre ?? p?.title ?? '').trim();
        const texte = String(p?.texte ?? p?.contenu ?? p?.text ?? '').trim();
        let question = String(p?.question ?? '').trim();
        const brut = p?.reponses ?? p?.answers;
        let reponses = (Array.isArray(brut) ? brut : []).map(r => ({
            texte: String(typeof r === 'string' ? r : (r?.texte ?? r?.text ?? '')).trim(),
            correcte: typeof r === 'object' && r !== null && (r.correcte === true || r.correct === true),
        })).filter(r => r.texte).slice(0, 5);
        // Une question n'est posée que si elle est jouable : deux réponses au
        // moins, une et une seule juste. Sinon la page reste une page à lire.
        if (!question || reponses.length < 2 || reponses.filter(r => r.correcte).length !== 1) {
            question = '';
            reponses = [];
        }
        return { titre, texte, question, reponses };
    }).filter(p => p.titre || p.texte).slice(0, 12);
}

export function pagesVersTexte(pages) {
    return normaliserPages(pages).map(p => [
        `# ${p.titre}`,
        ...(p.texte ? [p.texte] : []),
        ...(p.question ? [`? ${p.question}`, ...p.reponses.map(r => `${r.correcte ? '+' : '-'} ${r.texte}`)] : []),
    ].join('\n')).join('\n\n');
}

export function pagesDepuisTexte(texte) {
    const pages = [];
    let p = null;
    const nouvelle = titre => { p = { titre, texte: '', question: '', reponses: [] }; pages.push(p); };
    for (const brute of String(texte || '').split('\n')) {
        const ligne = brute.trim();
        const titre = /^#\s*(.*)$/.exec(ligne);
        if (titre) { nouvelle(titre[1].trim()); continue; }
        if (!p) { if (!ligne) continue; nouvelle(''); }
        const question = /^\?\s*(.*)$/.exec(ligne);
        if (question) { p.question = question[1].trim(); continue; }
        const reponse = /^([+-])\s*(.*)$/.exec(ligne);
        if (reponse && p.question) { p.reponses.push({ texte: reponse[2].trim(), correcte: reponse[1] === '+' }); continue; }
        p.texte = p.texte ? `${p.texte}\n${ligne}` : ligne;
    }
    for (const page of pages) page.texte = page.texte.trim();
    return normaliserPages(pages);
}

/**
 * L'aperçu des questions : ○ une réponse, ☐ plusieurs, Oui / Non, ✎ réponse
 * libre. Des signes plutôt que des mots : rien à traduire, et le type se lit
 * d'un coup d'œil, comme sur la plateforme.
 * @param {*} valeur
 * @param {Function} el - La fabrique DOM de l'atelier (`el(tag, classe, texte)`).
 */
function questionsVersDom(valeur, el) {
    const ol = el('ol', 'pc-lecture__questions');
    for (const q of normaliserQuestions(valeur)) {
        const li = el('li');
        li.append(el('strong', null, q.texte));
        const choix = q.type === 'ouinon' ? [t('parcours_oui'), t('parcours_non')] : q.choix;
        if (choix.length) {
            const ul = el('ul', 'pc-lecture__choix');
            for (const c of choix) ul.append(el('li', null, `${q.type === 'multiple' ? '☐' : '○'} ${c}`));
            li.append(ul);
        } else {
            li.append(el('p', 'pc-lecture__libre', '✎ …'));
        }
        ol.append(li);
    }
    return ol;
}

/** L'aperçu des pages d'une leçon : titre, texte, question, ✓ la bonne réponse. */
function pagesVersDom(valeur, el) {
    const bloc = el('div', 'pc-lecture__pages');
    normaliserPages(valeur).forEach((p, i) => {
        const page = el('section', 'pc-lecture__page');
        page.append(el('h4', null, `${i + 1}. ${p.titre}`));
        for (const ligne of p.texte.split('\n').filter(Boolean)) page.append(el('p', null, ligne));
        if (p.question) {
            page.append(el('p', 'pc-lecture__question', p.question));
            const ul = el('ul', 'pc-lecture__choix');
            for (const r of p.reponses) ul.append(el('li', null, `${r.correcte ? '✓' : '✗'} ${r.texte}`));
            page.append(ul);
        }
        bloc.append(page);
    });
    return bloc;
}

/** Les questions en lignes de document (export DOCX / ODT / PDF). */
function questionsVersLignes(valeur) {
    return normaliserQuestions(valeur).map((q, i) => {
        const choix = q.type === 'ouinon' ? [t('parcours_oui'), t('parcours_non')] : q.choix;
        const signe = q.type === 'multiple' ? '☐' : '○';
        return `${i + 1}. ${q.texte}${choix.length ? ` — ${choix.map(c => `${signe} ${c}`).join('   ')}` : ' — ✎'}`;
    });
}

/** Les pages d'une leçon en lignes de document. */
function pagesVersLignes(valeur) {
    return normaliserPages(valeur).flatMap((p, i) => [
        `${i + 1}. ${p.titre}`,
        ...p.texte.split('\n').filter(Boolean),
        ...(p.question ? [`? ${p.question}`, p.reponses.map(r => `${r.correcte ? '✓' : '✗'} ${r.texte}`).join('   ')] : []),
    ]);
}

/** Les formats, tels que le formulaire de retouche et l'aperçu les emploient. */
export const FORMAT_QUESTIONS = Object.freeze({
    versTexte: questionsVersTexte,
    depuisTexte: questionsDepuisTexte,
    normaliser: normaliserQuestions,
    versDom: questionsVersDom,
    versLignes: questionsVersLignes,
    aideKey: 'parcours_mod_aide_questions',
    exemple: [
        { texte: '…', type: 'unique', choix: ['…', '…', '…'] },
        { texte: '…', type: 'multiple', choix: ['…', '…', '…'] },
        { texte: '…', type: 'ouinon', choix: [] },
        { texte: '…', type: 'libre', choix: [] },
    ],
});

export const FORMAT_PAGES = Object.freeze({
    versTexte: pagesVersTexte,
    depuisTexte: pagesDepuisTexte,
    normaliser: normaliserPages,
    versDom: pagesVersDom,
    versLignes: pagesVersLignes,
    aideKey: 'parcours_mod_aide_pages',
    exemple: [
        { titre: '…', texte: '…', question: '', reponses: [] },
        { titre: '…', texte: '…', question: '…', reponses: [{ texte: '…', correcte: true }, { texte: '…', correcte: false }, { texte: '…', correcte: false }] },
    ],
});

/**
 * Les chapitres d'un Paquetage IMS : un titre, et un texte qui enseigne.
 *
 *     # Pourquoi protéger les données ?   ← un chapitre (une page du paquetage)
 *     Les données d'un élève…             ← son texte, un paragraphe par ligne
 *     ## Ce que dit la loi                ← un intertitre dans la page
 *     - une liste à puces                 ← une ligne commençant par « - »
 *
 * Pas de question : un paquetage IMS se LIT (c'est la Leçon qui interroge).
 */
export function normaliserChapitres(liste) {
    return (Array.isArray(liste) ? liste : []).map(c => {
        if (typeof c === 'string') return { titre: '', texte: c.trim() };
        return {
            titre: String(c?.titre ?? c?.title ?? '').trim(),
            texte: String(c?.texte ?? c?.contenu ?? c?.text ?? '').trim(),
        };
    }).filter(c => c.titre || c.texte).slice(0, 12);
}

export function chapitresVersTexte(chapitres) {
    return normaliserChapitres(chapitres)
        .map(c => [`# ${c.titre}`, ...(c.texte ? [c.texte] : [])].join('\n'))
        .join('\n\n');
}

export function chapitresDepuisTexte(texte) {
    const chapitres = [];
    let c = null;
    for (const brute of String(texte || '').split('\n')) {
        const ligne = brute.trim();
        // « # » ouvre un chapitre ; « ## » est un intertitre, qui reste dans le texte.
        const titre = /^#(?!#)\s*(.*)$/.exec(ligne);
        if (titre) { c = { titre: titre[1].trim(), texte: '' }; chapitres.push(c); continue; }
        if (!c) { if (!ligne) continue; c = { titre: '', texte: '' }; chapitres.push(c); }
        c.texte = c.texte ? `${c.texte}\n${ligne}` : ligne;
    }
    return normaliserChapitres(chapitres);
}

/** Les lignes d'un chapitre, typées : intertitre, puce ou paragraphe. */
function lignesChapitre(texte) {
    return String(texte || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        const inter = /^#{2,}\s*(.*)$/.exec(l);
        // Un intertitre est court. Le modèle en fait parfois une entrée de
        // glossaire (« ## **Base légale** : fondement… ») : c'est un paragraphe.
        if (inter && (inter[1].length > 90 || /^\*\*[^*]+\*\*\s*[:：]/.test(inter[1]))) return { genre: 'para', texte: inter[1] };
        if (inter) return { genre: 'inter', texte: inter[1].replace(/^\*\*(.+)\*\*$/, '$1') };
        const puce = /^[-•]\s+(.*)$/.exec(l);
        if (puce) return { genre: 'puce', texte: puce[1] };
        return { genre: 'para', texte: l };
    });
}

function chapitresVersDom(valeur, el) {
    const bloc = el('div', 'pc-lecture__pages');
    normaliserChapitres(valeur).forEach((c, i) => {
        const page = el('section', 'pc-lecture__page');
        page.append(el('h4', null, `${i + 1}. ${c.titre}`));
        let ul = null;
        for (const l of lignesChapitre(c.texte)) {
            if (l.genre === 'puce') {
                if (!ul) { ul = el('ul', 'pc-lecture__choix'); page.append(ul); }
                ul.append(el('li', null, sansBalise(l.texte)));
                continue;
            }
            ul = null;
            page.append(el(l.genre === 'inter' ? 'h5' : 'p', null, sansBalise(l.texte)));
        }
        bloc.append(page);
    });
    return bloc;
}

function chapitresVersLignes(valeur) {
    return normaliserChapitres(valeur).flatMap((c, i) => [
        `${i + 1}. ${c.titre}`,
        ...lignesChapitre(c.texte).map(l => (l.genre === 'puce' ? `• ${l.texte}` : l.texte)),
    ]);
}

export const FORMAT_CHAPITRES = Object.freeze({
    versTexte: chapitresVersTexte,
    depuisTexte: chapitresDepuisTexte,
    normaliser: normaliserChapitres,
    versDom: chapitresVersDom,
    versLignes: chapitresVersLignes,
    aideKey: 'parcours_mod_aide_chapitres',
    exemple: [
        { titre: '…', texte: '…\n…\n- …\n- …' },
        { titre: '…', texte: '…\n## …\n…' },
    ],
});

/* ------------------------------------------------------------------ *
 *  Aides
 * ------------------------------------------------------------------ */

/** Une liste de chaînes, nettoyée et plafonnée. */
function liste(valeur, max, longueur) {
    return (Array.isArray(valeur) ? valeur : String(valeur || '').split('\n'))
        .map(x => tronquer(typeof x === 'string' ? x : (x?.texte ?? x?.title ?? ''), longueur))
        .filter(Boolean)
        .slice(0, max);
}

/** Sans balise ni gras Markdown : les champs que Moodle affiche en texte brut. */
function sansBalise(texte) {
    return String(texte || '').replace(/<[^>]*>/g, '').replace(/\*\*(.+?)\*\*/g, '$1');
}

/** Un texte sans balise ni saut de ligne (les choix d'une enquête). */
function texteNu(texte) {
    return sansBalise(texte).replace(/\s*\n\s*/g, ' ').trim();
}

/** Un texte brut (pas de HTML), échappé pour le XML. */
function brut(texte) {
    return escapeXml(sansBalise(texte).trim());
}

/* ------------------------------------------------------------------ *
 *  Les fabriques
 * ------------------------------------------------------------------ */

/**
 * **Lien web** (`mod_url`). L'ADRESSE vient de l'enseignant, jamais du modèle :
 * c'est la source de la carte (`source: 'lien'`), saisie avant la génération.
 * `display: 3` = nouvelle fenêtre, ce qui laisse le cours ouvert derrière.
 */
function construireLien(d, ts) {
    return {
        moduleName: 'url',
        xml: activiteXml('url', `  <url id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <externalurl>${escapeXml(String(d.externalurl || '').trim())}</externalurl>
    <display>3</display>
    <displayoptions>a:0:{}</displayoptions>
    <parameters>a:0:{}</parameters>
    <timemodified>${ts}</timemodified>
  </url>`),
    };
}

/** Types de question du Questionnaire (`questionnaire_question.type_id`). */
const TYPE_QUESTIONNAIRE = { unique: 4, multiple: 5, ouinon: 1, libre: 3 };

/**
 * **Questionnaire** (`mod_questionnaire`). Ses questions sont de la STRUCTURE
 * (`questionnaire_question`, `questionnaire_quest_choice`) : elles traversent la
 * restauration ; les réponses sont des données utilisateur et restent derrière.
 *
 * Le module range ses questions dans une `survey` dont `sid` est l'identifiant :
 * les deux doivent coïncider. `name` d'une question est un identifiant technique
 * étroit (`char(30)`) — on y pose `q1`, `q2`… et l'énoncé va dans `content`.
 */
function construireQuestionnaire(d, ts) {
    const base = graine(d);
    const questions = normaliserQuestions(d.questions);
    const questionsXml = questions.map((q, i) => {
        const qid = base + 10 + i;
        const choix = q.choix.map((c, j) => `              <quest_choice id="${base + 100 + i * 10 + j}">
                <question_id>${qid}</question_id>
                <content>${escapeXml(texteNu(c))}</content>
                <value>$@NULL@$</value>
              </quest_choice>`).join('\n');
        return `          <question id="${qid}">
            <surveyid>${base}</surveyid>
            <name>q${i + 1}</name>
            <type_id>${TYPE_QUESTIONNAIRE[q.type]}</type_id>
            <result_id>$@NULL@$</result_id>
            <length>${q.type === 'libre' ? 5 : 0}</length>
            <precise>0</precise>
            <position>${i + 1}</position>
            <content>${html(q.texte)}</content>
            <required>n</required>
            <deleted>$@NULL@$</deleted>
            <extradata>0</extradata>
            <quest_choices>
${choix}
            </quest_choices>
            <quest_dependencies>
            </quest_dependencies>
          </question>`;
    }).join('\n');
    return {
        moduleName: 'questionnaire',
        completionview: 0,
        completionPropre: true,   // <completionsubmit>
        xml: activiteXml('questionnaire', `  <questionnaire id="${ID}">
    <course>${ID}</course>
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <qtype>0</qtype>
    <respondenttype>fullname</respondenttype>
    <resp_eligible>all</resp_eligible>
    <resp_view>1</resp_view>
    <notifications>0</notifications>
    <opendate>0</opendate>
    <closedate>0</closedate>
    <resume>0</resume>
    <navigate>0</navigate>
    <grade>0</grade>
    <sid>${base}</sid>
    <timemodified>${ts}</timemodified>
    <completionsubmit>1</completionsubmit>
    <autonum>3</autonum>
    <removeafter>0</removeafter>
    <surveys>
      <survey id="${base}">
        <name>${nom(d.title)}</name>
        <courseid>${ID}</courseid>
        <realm>private</realm>
        <status>0</status>
        <title>${nom(d.title)}</title>
        <email></email>
        <subtitle></subtitle>
        <info></info>
        <theme></theme>
        <thanks_page></thanks_page>
        <thank_head></thank_head>
        <thank_body></thank_body>
        <feedbacksections>0</feedbacksections>
        <feedbacknotes></feedbacknotes>
        <feedbackscores>0</feedbackscores>
        <chart_type>$@NULL@$</chart_type>
        <questions>
${questionsXml}
        </questions>
        <fb_sections>
        </fb_sections>
      </survey>
    </surveys>
    <responses>
    </responses>
  </questionnaire>`),
    };
}

/**
 * **Enquête** (`mod_feedback`, « Feedback » dans la palette d'Éléa). Même
 * matière que le Questionnaire, autre module : absent de la palette de
 * Magistère, présent dans le noyau Moodle. Ses éléments sont de la structure.
 *
 * Forme d'un choix relevée sur l'export : `presentation` = sous-type (`r` une
 * réponse, `c` plusieurs), `>>>>>`, puis les choix séparés par `\n|`.
 */
function construireEnquete(d, ts) {
    const base = graine(d);
    const oui = t('parcours_oui');
    const non = t('parcours_non');
    const items = normaliserQuestions(d.questions).map((q, i) => {
        const libre = q.type === 'libre';
        const choix = q.type === 'ouinon' ? [oui, non] : q.choix;
        // `r>>>>>A\n|B\n|C` : échappé d'un bloc, comme l'export (`r&gt;&gt;…`).
        const presentation = libre ? '40|5'
            : escapeXml(`${q.type === 'multiple' ? 'c' : 'r'}>>>>>${choix.map(texteNu).join('\n|')}`);
        return `      <item id="${base + 10 + i}">
        <template>0</template>
        <name>${brut(q.texte)}</name>
        <label>q${i + 1}</label>
        <presentation>${presentation}</presentation>
        <typ>${libre ? 'textarea' : 'multichoice'}</typ>
        <hasvalue>1</hasvalue>
        <position>${i + 1}</position>
        <required>0</required>
        <dependitem>0</dependitem>
        <dependvalue></dependvalue>
        <options></options>
      </item>`;
    }).join('\n');
    return {
        moduleName: 'feedback',
        completionview: 0,
        completionPropre: true,   // <completionsubmit>
        xml: activiteXml('feedback', `  <feedback id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <anonymous>1</anonymous>
    <email_notification>0</email_notification>
    <multiple_submit>0</multiple_submit>
    <autonumbering>0</autonumbering>
    <site_after_submit></site_after_submit>
    <page_after_submit>${html(t('parcours_enquete_merci'))}</page_after_submit>
    <page_after_submitformat>1</page_after_submitformat>
    <publish_stats>0</publish_stats>
    <timeopen>0</timeopen>
    <timeclose>0</timeclose>
    <timemodified>${ts}</timemodified>
    <completionsubmit>1</completionsubmit>
    <items>
${items}
    </items>
    <completeds>
    </completeds>
  </feedback>`),
    };
}

/** Destinations d'une réponse de Leçon (constantes de `mod_lesson`). */
const PAGE_SUIVANTE = -1;
const CETTE_PAGE = 0;
const FIN_DE_LECON = -9;

/**
 * **Leçon** (`mod_lesson`). Des pages qu'on lit l'une après l'autre ; une page
 * peut se terminer par une question, qui ne laisse passer qu'avec la bonne
 * réponse. Les pages sont de la structure : elles traversent la restauration.
 *
 * Une page SANS question est une « page de contenu » (`qtype 20`) à un seul
 * bouton, « Continuer ». Une page AVEC question est une question à choix
 * multiple (`qtype 3`) dont le texte porte d'abord la page, puis l'énoncé : la
 * bonne réponse mène à la suite, une mauvaise fait relire. La dernière page
 * mène à la fin de la leçon. Chaînage (`prevpageid`/`nextpageid`) relevé tel
 * quel ; la restauration le renumérote elle-même.
 */
function construireLecon(d, ts) {
    const base = graine(d);
    const pages = normaliserPages(d.pages);
    const id = i => base + 10 + i;
    const pagesXml = pages.map((p, i) => {
        const derniere = i === pages.length - 1;
        const suite = derniere ? FIN_DE_LECON : PAGE_SUIVANTE;
        const avecQuestion = !!p.question;
        const contenu = avecQuestion
            ? `${formatHtml(p.texte)}${formatHtml(p.question)}`
            : formatHtml(p.texte);
        const reponses = avecQuestion
            ? p.reponses.map((r, j) => reponseLecon(base + 100 + i * 10 + j, ts, {
                texte: escapeXml(`<p>${escapeHtml(r.texte)}</p>`),
                retour: escapeXml(`<p>${escapeHtml(t(r.correcte ? 'parcours_lecon_juste' : 'parcours_lecon_faux'))}</p>`),
                saut: r.correcte ? suite : CETTE_PAGE,
                score: r.correcte ? 1 : 0,
                format: 1,
            }))
            : [reponseLecon(base + 100 + i * 10, ts, {
                texte: escapeXml(t('parcours_lecon_continuer')), retour: '$@NULL@$', saut: suite, score: 0, format: 0,
            })];
        return `      <page id="${id(i)}">
        <prevpageid>${i ? id(i - 1) : 0}</prevpageid>
        <nextpageid>${derniere ? 0 : id(i + 1)}</nextpageid>
        <qtype>${avecQuestion ? 3 : 20}</qtype>
        <qoption>0</qoption>
        <layout>${avecQuestion ? 0 : 1}</layout>
        <display>${avecQuestion ? 0 : 1}</display>
        <timecreated>${ts}</timecreated>
        <timemodified>0</timemodified>
        <title>${escapeXml(tronquer(p.titre || `${i + 1}`, 255))}</title>
        <contents>${escapeXml(contenu)}</contents>
        <contentsformat>1</contentsformat>
        <answers>
${reponses.join('\n')}
        </answers>
        <branches>
        </branches>
      </page>`;
    }).join('\n');
    return {
        moduleName: 'lesson',
        completionview: 0,
        completionPropre: true,   // <completionendreached>
        xml: activiteXml('lesson', `  <lesson id="${ID}">
    <course>${ID}</course>
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <practice>0</practice>
    <modattempts>0</modattempts>
    <usepassword>0</usepassword>
    <password></password>
    <dependency>0</dependency>
    <conditions>O:8:"stdClass":3:{s:9:"timespent";i:0;s:9:"completed";i:0;s:15:"gradebetterthan";i:0;}</conditions>
    <grade>100</grade>
    <custom>1</custom>
    <ongoing>0</ongoing>
    <usemaxgrade>0</usemaxgrade>
    <maxanswers>5</maxanswers>
    <maxattempts>1</maxattempts>
    <review>0</review>
    <nextpagedefault>0</nextpagedefault>
    <feedback>0</feedback>
    <minquestions>0</minquestions>
    <maxpages>1</maxpages>
    <timelimit>0</timelimit>
    <retake>1</retake>
    <activitylink>0</activitylink>
    <mediafile></mediafile>
    <mediaheight>480</mediaheight>
    <mediawidth>640</mediawidth>
    <mediaclose>0</mediaclose>
    <slideshow>0</slideshow>
    <width>640</width>
    <height>480</height>
    <bgcolor>#FFFFFF</bgcolor>
    <displayleft>0</displayleft>
    <displayleftif>0</displayleftif>
    <progressbar>1</progressbar>
    <available>0</available>
    <deadline>0</deadline>
    <timemodified>${ts}</timemodified>
    <completionendreached>1</completionendreached>
    <completiontimespent>0</completiontimespent>
    <allowofflineattempts>0</allowofflineattempts>
    <pages>
${pagesXml}
    </pages>
    <grades>
    </grades>
    <timers>
    </timers>
    <overrides>
    </overrides>
  </lesson>`),
    };
}

function reponseLecon(id, ts, { texte, retour, saut, score, format }) {
    return `          <answer id="${id}">
            <jumpto>${saut}</jumpto>
            <grade>0</grade>
            <score>${score}</score>
            <flags>0</flags>
            <timecreated>${ts}</timecreated>
            <timemodified>0</timemodified>
            <answer_text>${texte}</answer_text>
            <response>${retour}</response>
            <answerformat>${format}</answerformat>
            <responseformat>${format}</responseformat>
            <attempts>
            </attempts>
          </answer>`;
}

/**
 * Texte → HTML sûr. Le modèle souligne volontiers les notions pivots en
 * **gras Markdown** ; Moodle afficherait les astérisques. Le gras devient donc
 * `<strong>`, APRÈS l'échappement : rien d'autre ne passe.
 */
function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** Paragraphes HTML d'un texte brut (non échappés pour le XML). */
function formatHtml(texte) {
    return grasUneFois(texte).split(/\n{2,}|\n/).map(x => x.trim()).filter(Boolean)
        .map(x => `<p>${escapeHtml(x)}</p>`).join('');
}

/**
 * **Atelier** (`mod_workshop`) — produire, puis évaluer le travail de ses pairs
 * avec une grille. Consignes aux auteurs et aux évaluateurs, et CRITÈRES de la
 * grille (stratégie « évaluation cumulative ») : tout est de la configuration.
 *
 * Réservé : un atelier avance par PHASES que seul l'enseignant fait passer
 * (mise en place → remise → évaluation → notation). Sans ce geste, rien ne
 * s'ouvre — d'où la ligne dans « À faire », et l'absence de critère
 * d'achèvement : l'étape suivante ne peut pas attendre une phase que personne
 * n'a ouverte. Deux éléments d'évaluation (travail, évaluation) : Moodle les
 * crée à la première notation, le backup n'a pas à les porter.
 */
function construireAtelier(d, ts) {
    const base = graine(d);
    const criteres = liste(d.criteres, 8, 1000);
    const dims = (criteres.length ? criteres : [t('parcours_atelier_critere_defaut')]).map((c, i) => `      <workshopform_accumulative_dimension id="${base + 10 + i}">
        <sort>${i + 1}</sort>
        <description>${html(c)}</description>
        <descriptionformat>1</descriptionformat>
        <grade>10</grade>
        <weight>1</weight>
      </workshopform_accumulative_dimension>`).join('\n');
    return {
        moduleName: 'workshop',
        completionview: 0,
        xml: activiteXml('workshop', `  <workshop id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <instructauthors>${html(d.consigneAuteurs)}</instructauthors>
    <instructauthorsformat>1</instructauthorsformat>
    <instructreviewers>${html(d.consigneEvaluateurs)}</instructreviewers>
    <instructreviewersformat>1</instructreviewersformat>
    <timemodified>${ts}</timemodified>
    <phase>10</phase>
    <useexamples>0</useexamples>
    <usepeerassessment>1</usepeerassessment>
    <useselfassessment>0</useselfassessment>
    <grade>80.00000</grade>
    <gradinggrade>20.00000</gradinggrade>
    <strategy>accumulative</strategy>
    <evaluation>best</evaluation>
    <gradedecimals>0</gradedecimals>
    <submissiontypetext>1</submissiontypetext>
    <submissiontypefile>1</submissiontypefile>
    <nattachments>1</nattachments>
    <submissionfiletypes></submissionfiletypes>
    <latesubmissions>0</latesubmissions>
    <maxbytes>0</maxbytes>
    <examplesmode>0</examplesmode>
    <submissionstart>0</submissionstart>
    <submissionend>0</submissionend>
    <assessmentstart>0</assessmentstart>
    <assessmentend>0</assessmentend>
    <conclusion></conclusion>
    <conclusionformat>1</conclusionformat>
    <overallfeedbackmode>1</overallfeedbackmode>
    <overallfeedbackfiles>0</overallfeedbackfiles>
    <overallfeedbackfiletypes></overallfeedbackfiletypes>
    <overallfeedbackmaxbytes>0</overallfeedbackmaxbytes>
    <subplugin_workshopform_accumulative_workshop>
${dims}
    </subplugin_workshopform_accumulative_workshop>
    <subplugin_workshopform_comments_workshop>
    </subplugin_workshopform_comments_workshop>
    <subplugin_workshopform_numerrors_workshop>
    </subplugin_workshopform_numerrors_workshop>
    <subplugin_workshopform_rubric_workshop>
    </subplugin_workshopform_rubric_workshop>
    <subplugin_workshopeval_best_workshop>
    </subplugin_workshopeval_best_workshop>
    <examplesubmissions>
    </examplesubmissions>
    <submissions>
    </submissions>
    <aggregations>
    </aggregations>
  </workshop>`),
    };
}

/**
 * Largeur de `board_columns.name`. Le greffon crée trois colonnes « Titre »
 * quand on ne lui en donne pas ; on lui donne les nôtres, courtes : le titre
 * d'une colonne se lit d'un coup d'œil ou ne sert à rien.
 */
const MAX_COLONNE_TABLEAU = 50;

/**
 * **Tableau** (`mod_board`) — des colonnes, où les élèves déposent des notes.
 * Les colonnes sont de la structure et traversent la restauration ; les notes
 * sont des données utilisateur. Achèvement relevé : une note déposée.
 */
function construireTableau(d, ts) {
    const base = graine(d);
    const colonnes = liste(d.titresColonnes, 6, MAX_COLONNE_TABLEAU);
    const retenues = colonnes.length ? colonnes : [tronquer(d.title, MAX_COLONNE_TABLEAU) || '1'];
    const colonnesXml = retenues.map((c, i) => `      <column id="${base + 10 + i}">
        <boardid>${ID}</boardid>
        <name>${escapeXml(texteNu(c))}</name>
        <sortorder>${i + 1}</sortorder>
        <notes>
        </notes>
      </column>`).join('\n');
    return {
        moduleName: 'board',
        completionview: 0,
        completionPropre: true,   // <completionnotes>
        xml: activiteXml('board', `  <board id="${ID}">
    <course>${ID}</course>
    <name>${nom(d.title)}</name>
    <timemodified>${ts}</timemodified>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <historyid>0</historyid>
    <background_color></background_color>
    <addrating>0</addrating>
    <hideheaders>0</hideheaders>
    <sortby>3</sortby>
    <postby>0</postby>
    <userscanedit>0</userscanedit>
    <singleusermode>0</singleusermode>
    <completionnotes>1</completionnotes>
    <embed>0</embed>
    <columns>
${colonnesXml}
    </columns>
  </board>`),
    };
}

/**
 * **Wiki** (`mod_wiki`) — un texte que la classe écrit ensemble. Ses pages sont
 * des données utilisateur : le wiki arrive vide, avec le titre de sa première
 * page, qui s'ouvre au premier passage. Pas d'achèvement : relevé ainsi sur les
 * deux plateformes.
 */
function construireWiki(d, ts) {
    return {
        moduleName: 'wiki',
        completionview: 0,
        xml: activiteXml('wiki', `  <wiki id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <timecreated>0</timecreated>
    <timemodified>${ts}</timemodified>
    <firstpagetitle>${escapeXml(tronquer(d.premierePage || d.title, 255))}</firstpagetitle>
    <wikimode>collaborative</wikimode>
    <defaultformat>html</defaultformat>
    <forceformat>0</forceformat>
    <editbegin>0</editbegin>
    <editend>0</editend>
    <subwikis>
    </subwikis>
  </wiki>`),
    };
}

/**
 * **Glossaire à construire** (`mod_glossary`). Le glossaire ALIMENTÉ reste hors
 * palette : ses entrées sont des données utilisateur et reviennent à zéro (D23,
 * aller-retour du 4 sept.). Mais un glossaire VIDE que la classe remplit est un
 * usage à part entière — chacun y dépose une définition. C'est celui-là qu'on
 * pose, avec sa consigne ; achèvement relevé : une entrée déposée.
 */
function construireGlossaire(d, ts) {
    return {
        moduleName: 'glossary',
        completionview: 0,
        completionPropre: true,   // <completionentries>
        xml: activiteXml('glossary', `  <glossary id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <allowduplicatedentries>0</allowduplicatedentries>
    <displayformat>dictionary</displayformat>
    <mainglossary>0</mainglossary>
    <showspecial>1</showspecial>
    <showalphabet>1</showalphabet>
    <showall>1</showall>
    <allowcomments>0</allowcomments>
    <allowprintview>1</allowprintview>
    <usedynalink>1</usedynalink>
    <defaultapproval>1</defaultapproval>
    <globalglossary>0</globalglossary>
    <entbypage>10</entbypage>
    <editalways>0</editalways>
    <rsstype>0</rsstype>
    <rssarticles>0</rssarticles>
    <assessed>0</assessed>
    <assesstimestart>0</assesstimestart>
    <assesstimefinish>0</assesstimefinish>
    <scale>100</scale>
    <timecreated>${ts}</timecreated>
    <timemodified>${ts}</timemodified>
    <completionentries>1</completionentries>
    <entries>
    </entries>
    <entriestags>
    </entriestags>
    <categories>
    </categories>
  </glossary>`),
    };
}

/**
 * **Document collaboratif** (`mod_collabora`) — un document partagé, ouvert dans
 * le traitement de texte en ligne. Relevé : format `text` + `initialtext`, le
 * seul qui ne dépende pas d'un modèle de document propre au site (les autres
 * formats y sont désignés par l'empreinte d'un fichier du serveur).
 */
function construireDocument(d, ts) {
    return {
        moduleName: 'collabora',
        completionview: 0,
        xml: activiteXml('collabora', `  <collabora id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <timecreated>${ts}</timecreated>
    <timemodified>${ts}</timemodified>
    <format>text</format>
    <initialtext>${brut(d.texteInitial)}</initialtext>
    <display>current</display>
    <height>0</height>
    <displayname>1</displayname>
    <displaydescription>1</displaydescription>
    <documents>
    </documents>
  </collabora>`),
    };
}

/** **Etherpad** (`mod_etherpadlite`, Magistère) — un bloc-notes partagé. */
function construireEtherpad(d, ts) {
    return {
        moduleName: 'etherpadlite',
        completionview: 0,
        xml: activiteXml('etherpadlite', `  <etherpadlite id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <guestsallowed>0</guestsallowed>
    <timecreated>${ts}</timecreated>
    <timemodified>0</timemodified>
  </etherpadlite>`),
    };
}

/**
 * **Partage de fichiers** (`mod_publication`) — chaque élève dépose ses fichiers,
 * que la classe peut ensuite consulter. Relevé sans date (l'export en posait,
 * celles du jour de création : elles n'ont aucun sens dans un autre cours).
 */
function construireDepot(d, ts) {
    return {
        moduleName: 'publication',
        completionview: 0,
        xml: activiteXml('publication', `  <publication id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <alwaysshowdescription>1</alwaysshowdescription>
    <duedate>0</duedate>
    <allowsubmissionsfromdate>0</allowsubmissionsfromdate>
    <completionupload>1</completionupload>
    <completionassignsubmission>0</completionassignsubmission>
    <timemodified>${ts}</timemodified>
    <cutoffdate>0</cutoffdate>
    <approvalfromdate>0</approvalfromdate>
    <approvaltodate>0</approvaltodate>
    <mode>0</mode>
    <importfrom>-1</importfrom>
    <obtainstudentapproval>0</obtainstudentapproval>
    <maxfiles>5</maxfiles>
    <maxbytes>5242880</maxbytes>
    <allowedfiletypes></allowedfiletypes>
    <obtainteacherapproval>0</obtainteacherapproval>
    <autoimport>0</autoimport>
    <groupapproval>0</groupapproval>
    <notifystatuschange>3</notifystatuschange>
    <notifyfilechange>2</notifyfilechange>
    <availabilityrestriction>1</availabilityrestriction>
  </publication>`),
    };
}

/**
 * **Classe virtuelle** (`mod_bigbluebuttonbn`). Réservé : la salle existe dès
 * l'import, mais l'heure de la séance est à fixer.
 *
 * Trois valeurs que l'export donnait et qu'on ne recopie PAS :
 *   - `meetingid` et les mots de passe : propres à une salle. On les tire du
 *     contenu (stables pour un même fichier, différents d'un parcours à
 *     l'autre) ; Moodle y ajoute de lui-même le cours et l'instance.
 *   - `participants` : l'export nommait l'utilisateur qui avait créé la salle,
 *     par son identifiant. On ne garde que la règle « tout le monde entre » et
 *     « les enseignants animent » — rôles 3 et 4 (`editingteacher`, `teacher`
 *     d'une installation standard), ce que Magistère pose lui-même par défaut.
 *   - `grade` : 0. Une salle notée demanderait un barème que personne n'a choisi.
 */
function construireClasseVirtuelle(d, ts) {
    const graineSalle = { d, ts };
    const participants = JSON.stringify([
        { selectiontype: 'all', selectionid: 'all', role: 'viewer' },
        { selectiontype: 'role', selectionid: '3', role: 'moderator' },
        { selectiontype: 'role', selectionid: '4', role: 'moderator' },
    ]);
    return {
        moduleName: 'bigbluebuttonbn',
        completionview: 0,
        xml: activiteXml('bigbluebuttonbn', `  <bigbluebuttonbn id="${ID}">
    <type>1</type>
    <course>${ID}</course>
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <meetingid>${hexa(graineSalle, 40)}</meetingid>
    <moderatorpass>${jeton({ ...graineSalle, r: 'm' }, 12)}</moderatorpass>
    <viewerpass>${jeton({ ...graineSalle, r: 'v' }, 12)}</viewerpass>
    <wait>0</wait>
    <record>0</record>
    <recordallfromstart>0</recordallfromstart>
    <recordhidebutton>0</recordhidebutton>
    <welcome>${brut(d.accueil)}</welcome>
    <voicebridge>0</voicebridge>
    <openingtime>0</openingtime>
    <closingtime>0</closingtime>
    <timecreated>${ts}</timecreated>
    <timemodified>0</timemodified>
    <presentation></presentation>
    <participants>${escapeXml(participants)}</participants>
    <userlimit>0</userlimit>
    <recordings_html>0</recordings_html>
    <recordings_deleted>1</recordings_deleted>
    <recordings_imported>0</recordings_imported>
    <recordings_preview>1</recordings_preview>
    <clienttype>0</clienttype>
    <muteonstart>1</muteonstart>
    <completionattendance>0</completionattendance>
    <completionengagementchats>0</completionengagementchats>
    <completionengagementtalks>0</completionengagementtalks>
    <completionengagementraisehand>0</completionengagementraisehand>
    <completionengagementpollvotes>0</completionengagementpollvotes>
    <completionengagementemojis>0</completionengagementemojis>
    <guestallowed>0</guestallowed>
    <mustapproveuser>1</mustapproveuser>
    <showpresentation>1</showpresentation>
    <grade>0</grade>
    <logs>
    </logs>
    <recordings>
    </recordings>
  </bigbluebuttonbn>`),
    };
}

/**
 * **Base de données** (`mod_data`) — une fiche à remplir, que chaque élève
 * ajoute à la collection de la classe. Les RUBRIQUES sont de la structure
 * (`data_fields`) et arrivent ; les fiches sont des données utilisateur et ne
 * sont pas là — ce qui est exactement l'état voulu. Gabarits laissés à `NULL` :
 * Moodle les construit lui-même sur les rubriques, comme dans l'export.
 * Chaque rubrique est un champ texte ; « nom : ce qu'on y écrit ».
 */
function construireBase(d, ts) {
    const base = graine(d);
    const rubriques = liste(d.rubriques, 8, 400).map(r => {
        // Deux-points ASCII ou pleine chasse (chinois, japonais) : même séparateur.
        const i = r.search(/[:：]/);
        return i > 0 ? { nom: r.slice(0, i).trim(), description: r.slice(i + 1).trim() } : { nom: r, description: '' };
    }).filter(r => r.nom);
    const vus = new Set();
    const uniques = rubriques.filter(r => { const k = r.nom.toLowerCase(); if (vus.has(k)) return false; vus.add(k); return true; });
    const champs = (uniques.length ? uniques : [{ nom: t('parcours_base_rubrique_defaut'), description: '' }]);
    const nuls = n => Array.from({ length: n }, (_, k) => `<param${k + 4}>$@NULL@$</param${k + 4}>`).join('');
    const champsXml = champs.map((c, i) => `      <field id="${base + 10 + i}">
        <type>text</type>
        <name>${escapeXml(tronquer(texteNu(c.nom), 255))}</name>
        <description>${escapeXml(texteNu(c.description))}</description>
        <required>0</required>
        <param1></param1><param2></param2><param3></param3>${nuls(7)}
      </field>`).join('\n');
    const nul = '$@NULL@$';
    return {
        moduleName: 'data',
        completionview: 0,
        completionPropre: true,   // <completionentries>
        xml: activiteXml('data', `  <data id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <comments>0</comments>
    <timeavailablefrom>0</timeavailablefrom>
    <timeavailableto>0</timeavailableto>
    <timeviewfrom>0</timeviewfrom>
    <timeviewto>0</timeviewto>
    <requiredentries>0</requiredentries>
    <requiredentriestoview>0</requiredentriestoview>
    <maxentries>0</maxentries>
    <rssarticles>0</rssarticles>
    <singletemplate>${nul}</singletemplate>
    <listtemplate>${nul}</listtemplate>
    <listtemplateheader>${nul}</listtemplateheader>
    <listtemplatefooter>${nul}</listtemplatefooter>
    <addtemplate>${nul}</addtemplate>
    <rsstemplate>${nul}</rsstemplate>
    <rsstitletemplate>${nul}</rsstitletemplate>
    <csstemplate>${nul}</csstemplate>
    <jstemplate>${nul}</jstemplate>
    <asearchtemplate>${nul}</asearchtemplate>
    <approval>0</approval>
    <manageapproved>1</manageapproved>
    <scale>100</scale>
    <assessed>0</assessed>
    <assesstimestart>0</assesstimestart>
    <assesstimefinish>0</assesstimefinish>
    <defaultsort>0</defaultsort>
    <defaultsortdir>0</defaultsortdir>
    <editany>0</editany>
    <notification>0</notification>
    <timemodified>${ts}</timemodified>
    <config>${nul}</config>
    <completionentries>1</completionentries>
    <fields>
${champsXml}
    </fields>
    <records>
    </records>
    <recordstags>
    </recordstags>
  </data>`),
    };
}

/**
 * **Choix de groupe** (`mod_choicegroup`). Réservé : ses options SONT des
 * groupes du cours, et un backup d'enseignant n'emporte pas de groupe. Le
 * module arrive sans option, avec sa consigne ; l'enseignant crée les groupes
 * puis les coche — c'est la ligne « À faire ». Pas d'achèvement pour la même
 * raison : tant qu'il n'y a pas de groupe, personne ne peut choisir.
 */
function construireChoixGroupe(d, ts) {
    return {
        moduleName: 'choicegroup',
        completionview: 0,
        xml: activiteXml('choicegroup', `  <choicegroup id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <publish>1</publish>
    <multipleenrollmentspossible>0</multipleenrollmentspossible>
    <showresults>3</showresults>
    <display>0</display>
    <allowupdate>0</allowupdate>
    <showunanswered>0</showunanswered>
    <limitanswers>0</limitanswers>
    <timeopen>0</timeopen>
    <timeclose>0</timeclose>
    <timemodified>${ts}</timemodified>
    <completionsubmit>1</completionsubmit>
    <sortgroupsby>0</sortgroupsby>
    <onlyactive>0</onlyactive>
    <options>
    </options>
  </choicegroup>`),
    };
}

/* ------------------------------------------------------------------ *
 *  Le registre des modules natifs
 * ------------------------------------------------------------------ */

/**
 * **Paquetage IMS** (`mod_imscp`) — un mini-site de plusieurs pages, avec sa
 * table des matières, que Caramel écrit ENTIER : les pages HTML, le manifeste
 * `imsmanifest.xml`, et l'archive d'origine. Aucun outil tiers à ouvrir.
 *
 * Relevé le 27 sept. 2026 sur les deux plateformes : le module ne vit que par
 * ses fichiers. Le contenu déployé est dans la zone `content`, sous le numéro
 * de révision (1) ; le `.zip` d'origine dans la zone `backup`. La table des
 * matières est la `structure` : le tableau que Moodle tire du manifeste au
 * dépôt, SÉRIALISÉ À LA PHP — la restauration la reprend telle quelle, sans
 * relire le manifeste. Les fichiers se posent après l'assemblage
 * (`moodle/fichiers-modules.js`), comme le texte du Document collaboratif.
 *
 * Jamais proposé par le plan (`surDemande`) : sur Moodle, un Livre fait la même
 * chose en mieux intégré. Le paquetage sert à qui veut un contenu PORTABLE —
 * l'archive se réutilise sur une autre plateforme.
 */
function construireIms(d, ts) {
    const chapitres = normaliserChapitres(d.pages);
    if (!chapitres.length) throw new Error('parcours_ims_sans_page');
    const langue = languageCodes(currentLang).language;
    const titre = texteNu(d.title) || t('parcours_mod_ims_name');
    const pages = chapitres.map((c, i) => ({
        href: `page-${String(i + 1).padStart(2, '0')}.html`,
        titre: tronquer(texteNu(c.titre) || `${i + 1}`, 255),
        texte: c.texte,
    }));
    const encodeur = new TextEncoder();
    const octets = s => encodeur.encode(s);
    const identifiant = `caramel-${hexa(d, 12)}`;
    const manifeste = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifiant}" version="1.1" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1">
  <organizations default="org-1">
    <organization identifier="org-1">
      <title>${echapper(titre)}</title>
${pages.map((p, i) => `      <item identifier="item-${i + 1}" identifierref="res-${i + 1}"><title>${echapper(p.titre)}</title></item>`).join('\n')}
    </organization>
  </organizations>
  <resources>
${pages.map((p, i) => `    <resource identifier="res-${i + 1}" type="webcontent" href="${p.href}"><file href="${p.href}"/></resource>`).join('\n')}
  </resources>
</manifest>
`;
    // `serialize()` de PHP : la longueur d'une chaîne se compte en OCTETS.
    const chaine = s => `s:${octets(s).length}:"${s}";`;
    const structure = `a:${pages.length}:{${pages.map((p, i) => `i:${i};a:4:{${chaine('href')}${chaine(p.href)}` +
        `${chaine('title')}${chaine(p.titre)}${chaine('level')}i:0;${chaine('subitems')}a:0:{}}`).join('')}}`;
    const contenu = [
        { filename: 'imsmanifest.xml', mimetype: 'application/xml', octets: octets(manifeste) },
        ...pages.map(p => ({ filename: p.href, mimetype: 'text/html', octets: octets(pageIms(p.titre, p.texte, langue)) })),
    ];
    return {
        moduleName: 'imscp',
        xml: activiteXml('imscp', `  <imscp id="${ID}">
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <revision>1</revision>
    <keepold>1</keepold>
    <structure>${escapeXml(structure)}</structure>
    <timemodified>${ts}</timemodified>
  </imscp>`),
        paquet: {
            component: 'mod_imscp',
            zones: [
                { filearea: 'content', itemid: 1, fichiers: contenu },
                { filearea: 'backup', itemid: 1, archive: { filename: `${nomArchive(titre)}.zip`, de: contenu } },
            ],
        },
    };
}

/** Un texte échappé pour le HTML ou le XML, sans autre transformation. */
function echapper(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Un nom de fichier sûr partout : ni séparateur, ni caractère réservé. */
function nomArchive(titre) {
    return String(titre || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'paquetage';
}

/** Feuille de style des pages : lisible dans le cadre que Moodle leur donne. */
const STYLE_IMS = 'body{margin:0;background:#fff;color:#1d2433;font:1.0625rem/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}' +
    'main{max-width:44rem;margin:0 auto;padding:1.75rem 1.25rem 3rem}' +
    'h1{font-size:1.6rem;line-height:1.25;margin:0 0 1.25rem;color:#0b3d91}' +
    'h2{font-size:1.2rem;line-height:1.3;margin:1.75rem 0 .6rem;color:#0b3d91}' +
    'p{margin:0 0 1rem}ul{margin:0 0 1rem;padding-left:1.4rem}li{margin:.3rem 0}strong{font-weight:650}';

/** Une page du paquetage : un document HTML complet, autonome, sans ressource externe. */
function pageIms(titre, texte, langue) {
    const corps = [];
    let puces = null;
    const fermer = () => { if (puces) corps.push(`<ul>\n${puces.join('\n')}\n</ul>`); puces = null; };
    for (const l of lignesChapitre(grasUneFois(texte))) {
        if (l.genre === 'puce') { (puces ||= []).push(`<li>${escapeHtml(l.texte)}</li>`); continue; }
        fermer();
        corps.push(l.genre === 'inter' ? `<h2>${escapeHtml(l.texte)}</h2>` : `<p>${escapeHtml(l.texte)}</p>`);
    }
    fermer();
    return `<!DOCTYPE html>
<html lang="${langue}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapper(titre)}</title>
<style>${STYLE_IMS}</style>
</head>
<body>
<main>
<h1>${echapper(titre)}</h1>
${corps.join('\n')}
</main>
</body>
</html>
`;
}

/** Types de question que le Test étudiant d'Éléa admet par défaut (relevé). */
const TYPES_TEST_ETUDIANT = 'multichoice,truefalse,match,shortanswer,numerical,calculated,calculatedmulti,calculatedsimple,multianswer,ddwtos,ddimageortext,ddmarker,gapselect';

/**
 * **Test étudiant** (`mod_studentquiz`, Éléa seul). Les élèves y créent eux-mêmes
 * des questions, répondent à celles des autres, les notent et les commentent ;
 * des points, affichés dans un classement, les y encouragent. Questions,
 * tentatives, notes et commentaires sont des données d'élèves : le module arrive
 * VIDE, avec sa consigne, comme le wiki (D89, qui revient sur D70 pour ce module).
 *
 * Relevé sur l'export d'Éléa (Moodle 5.1.7, greffon 2026030600) : barème de
 * points, types de questions admis, publication immédiate. Deux écarts voulus :
 *   - `coursemodule` : la restauration le traduit par la table des modules de
 *     cours (`get_mappingid('course_module', …)`) ; il doit donc porter
 *     l'identifiant que le cours donne au module, connu seulement après
 *     l'assemblage. On pose `ID`, que `recalerModulesDeCours()` remplace.
 *   - Achèvement : « avoir créé une question » (`completionquestionpublished` 1)
 *     plutôt que « avoir 1 point » (`completionpoint` 1, défaut d'Éléa). Les deux
 *     ne dépendent que de l'élève, mais une série de réponses fausses (−1 chacune)
 *     peut tenir son total sous le seuil ; une règle à 0 est inactive (D71).
 * Pas de carnet de notes (le greffon n'en déclare pas, aucun `grades.xml` au
 * relevé) ; la catégorie de questions se crée d'elle-même au premier affichage
 * (`question_make_default_categories`) : aucun fichier à joindre.
 */
function construireTestEtudiant(d) {
    return {
        moduleName: 'studentquiz',
        completionview: 0,
        completionPropre: true,   // <completionquestionpublished>
        xml: activiteXml('studentquiz', `  <studentquiz id="${ID}">
    <coursemodule>${ID}</coursemodule>
    <name>${nom(d.title)}</name>
    <intro>${html(d.intro)}</intro>
    <introformat>1</introformat>
    <grade>100</grade>
    <anonymrank>1</anonymrank>
    <questionquantifier>10</questionquantifier>
    <approvedquantifier>5</approvedquantifier>
    <ratequantifier>3</ratequantifier>
    <correctanswerquantifier>2</correctanswerquantifier>
    <incorrectanswerquantifier>-1</incorrectanswerquantifier>
    <allowedqtypes>${TYPES_TEST_ETUDIANT}</allowedqtypes>
    <aggregated>1</aggregated>
    <excluderoles></excluderoles>
    <forcerating>0</forcerating>
    <forcecommenting>0</forcecommenting>
    <commentdeletionperiod>10</commentdeletionperiod>
    <reportingemail>$@NULL@$</reportingemail>
    <digesttype>0</digesttype>
    <digestfirstday>1</digestfirstday>
    <privatecommenting>0</privatecommenting>
    <opensubmissionfrom>0</opensubmissionfrom>
    <closesubmissionfrom>0</closesubmissionfrom>
    <openansweringfrom>0</openansweringfrom>
    <closeansweringfrom>0</closeansweringfrom>
    <publishnewquestion>1</publishnewquestion>
    <completionpoint>0</completionpoint>
    <completionquestionpublished>1</completionquestionpublished>
    <completionquestionapproved>0</completionquestionapproved>
    <attempts>
    </attempts>
    <questions>
    </questions>
    <progresses>
    </progresses>
    <rates>
    </rates>
    <comments>
    </comments>
    <notifications>
    </notifications>
    <statehistories>
    </statehistories>
  </studentquiz>`),
    };
}

/**
 * Recale le `<coursemodule>` des Tests étudiants sur l'identifiant de module que
 * l'assemblage leur a donné (`moduleid` de leur enveloppe `<activity>`). Sans lui,
 * la restauration ne retrouve pas le module (`get_mappingid` rend 0) et le Test
 * étudiant restauré ne s'ouvre pas. Posé APRÈS l'assemblage, comme les fichiers
 * joints : le constructeur de cours, partagé avec la Sucrerie, ne renumérote que
 * les identifiants communs à toutes les activités.
 *
 * @param {Object<string, string|Uint8Array>} files - Carte de fichiers du cours.
 * @returns {Object<string, string|Uint8Array>} Une copie, recalée.
 */
export function recalerModulesDeCours(files) {
    const sortie = { ...files };
    for (const [chemin, contenu] of Object.entries(files)) {
        if (typeof contenu !== 'string' || !/^activities\/studentquiz_\d+\/studentquiz\.xml$/.test(chemin)) continue;
        const moduleid = contenu.match(/<activity\b[^>]*\bmoduleid="(\d+)"/)?.[1];
        if (moduleid) sortie[chemin] = contenu.replace(/<coursemodule>\d*<\/coursemodule>/, `<coursemodule>${moduleid}</coursemodule>`);
    }
    return sortie;
}

const TOUTES = ['Éléa', 'Magistère', 'Moodle'];
const ACADEMIQUES = ['Éléa', 'Magistère'];

/**
 * Même forme que `MODULES_PARCOURS`, dans lequel ce registre est fondu.
 *
 * `platforms` est CONSTATÉ sur la palette de chaque plateforme le 27 sept. 2026
 * (D26), et revérifié en direct le 28 sept. (`sept-2026/palettes.json`) : les
 * modules du noyau Moodle sont partout ; les greffons (Questionnaire, Tableau,
 * Document collaboratif, Partage de fichiers, Choix de groupe) sur les deux
 * plateformes académiques ; Etherpad et Nuage de mots sur Magistère seul ;
 * Feedback absent de Magistère ; la Classe virtuelle sur Magistère seul (D77).
 *
 * `structures` : champs dont la valeur est une liste d'OBJETS, retouchée en
 * texte (cf. les formats plus haut). `note` : le module est noté, le prompt ne
 * doit pas dire le contraire. `sansAchevement` : hors ouverture progressive.
 * `aFaireKey` : ce que l'enseignant doit faire sur la plateforme, écrit dans
 * l'étiquette cachée « À faire » (`@t` = titre de l'activité).
 */
export const MODULES_NATIFS = {
    parcours_lien: {
        moduleName: 'url',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-url.webp',
        nameKey: 'parcours_mod_lien_name',
        descKey: 'parcours_mod_lien_desc',
        platforms: TOUTES,
        niveau: 'source',
        source: 'lien',
        icone: 'fa-link',
        champs: {
            title: 'titre court du lien',
            intro: "ce que l'élève doit chercher, relever ou comprendre sur la page ouverte par le lien. Tu ne vois pas cette page : n'invente RIEN de son contenu, donne une consigne de lecture",
        },
        longs: ['intro'],
        construire: construireLien,
    },
    parcours_questionnaire: {
        moduleName: 'questionnaire',
        image: 'assets/images/activities/plateforme-questionnaire.webp',
        nameKey: 'parcours_mod_questionnaire_name',
        descKey: 'parcours_mod_questionnaire_desc',
        platforms: ACADEMIQUES,
        niveau: 'amorce',
        icone: 'fa-clipboard-question',
        champs: {
            title: 'titre court du questionnaire',
            intro: "à quoi sert ce questionnaire, en une ou deux phrases adressées à l'élève (ce n'est pas une évaluation notée)",
            questions: 'de 3 à 8 questions. Chacune est un objet {"texte": "…", "type": "unique" | "multiple" | "ouinon" | "libre", "choix": ["…"]}. `choix` (2 à 6 réponses courtes) seulement pour « unique » et « multiple » ; tableau vide sinon',
        },
        longs: ['intro'],
        structures: { questions: FORMAT_QUESTIONS },
        construire: construireQuestionnaire,
    },
    parcours_enquete: {
        moduleName: 'feedback',
        image: 'assets/images/activities/plateforme-feedback.webp',
        nameKey: 'parcours_mod_enquete_name',
        descKey: 'parcours_mod_enquete_desc',
        platforms: ['Éléa', 'Moodle'],
        niveau: 'amorce',
        icone: 'fa-comment-dots',
        champs: {
            title: "titre court de l'enquête",
            intro: "ce qu'on demande à l'élève et pourquoi (ses réponses sont anonymes), en une ou deux phrases",
            questions: 'de 3 à 8 questions. Chacune est un objet {"texte": "…", "type": "unique" | "multiple" | "ouinon" | "libre", "choix": ["…"]}. `choix` (2 à 6 réponses courtes) seulement pour « unique » et « multiple » ; tableau vide sinon',
        },
        longs: ['intro'],
        structures: { questions: FORMAT_QUESTIONS },
        construire: construireEnquete,
    },
    parcours_lecon: {
        moduleName: 'lesson',
        image: 'assets/images/activities/plateforme-lesson.webp',
        nameKey: 'parcours_mod_lecon_name',
        descKey: 'parcours_mod_lecon_desc',
        platforms: TOUTES,
        niveau: 'amorce',
        note: true,
        icone: 'fa-signs-post',
        champs: {
            title: 'titre court de la leçon',
            intro: "ce que l'élève va apprendre en avançant page à page",
            pages: 'de 3 à 8 pages. Chacune est un objet {"titre": "…", "texte": "…", "question": "…", "reponses": [{"texte": "…", "correcte": true}, {"texte": "…", "correcte": false}]}. `texte` : 2 à 5 phrases qui enseignent. `question` est facultative (chaîne vide sinon) ; quand elle est là, 2 à 4 réponses dont UNE SEULE correcte, et elle porte sur la page elle-même',
        },
        longs: ['intro'],
        structures: { pages: FORMAT_PAGES },
        construire: construireLecon,
    },
    parcours_ims: {
        moduleName: 'imscp',
        image: 'assets/images/activities/plateforme-imscp.webp',
        nameKey: 'parcours_mod_ims_name',
        descKey: 'parcours_mod_ims_desc',
        platforms: TOUTES,
        niveau: 'amorce',
        // Choisi par l'enseignant dans la mosaïque, jamais proposé par le plan.
        surDemande: true,
        icone: 'fa-cubes',
        champs: {
            title: 'titre court du paquetage',
            intro: "ce que l'élève va trouver dans ces pages et comment les parcourir, en une ou deux phrases",
            pages: 'de 3 à 8 pages. Chacune est un objet {"titre": "…", "texte": "…"}. `texte` : 4 à 10 lignes qui enseignent — un paragraphe par ligne, « ## » devant un intertitre court (quelques mots, sans gras), « - » devant une puce (une liste suit toujours la phrase ou l\'intertitre qui l\'annonce ; une définition s\'écrit « - **terme** : définition »), **gras** pour deux ou trois notions clés par page, pas davantage',
        },
        longs: ['intro'],
        structures: { pages: FORMAT_CHAPITRES },
        construire: construireIms,
    },
    parcours_atelier: {
        moduleName: 'workshop',
        image: 'assets/images/activities/plateforme-workshop.webp',
        nameKey: 'parcours_mod_atelier_name',
        descKey: 'parcours_mod_atelier_desc',
        platforms: TOUTES,
        niveau: 'reserve',
        note: true,
        sansAchevement: true,
        aFaireKey: 'parcours_afaire_atelier',
        icone: 'fa-people-arrows',
        champs: {
            title: "titre court de l'atelier",
            intro: 'le déroulé en deux temps : produire, puis évaluer le travail de deux camarades',
            consigneAuteurs: "ce que chaque élève doit produire et remettre : la tâche, sa longueur, ce qu'elle doit contenir",
            // Former les évaluateurs est ce qui fait le plus pour l'évaluation par les
            // pairs : un exemple de commentaire utile en est la forme minimale (D81).
            consigneEvaluateurs: "comment évaluer le travail d'un camarade avec bienveillance, en s'appuyant sur les critères, avec un exemple de commentaire utile : ce qui réussit, ce qui manque, une piste précise pour améliorer",
            criteres: "de 3 à 5 critères d'évaluation, une phrase chacun, observables dans le travail remis",
        },
        longs: ['intro', 'consigneAuteurs', 'consigneEvaluateurs'],
        listes: ['criteres'],
        construire: construireAtelier,
    },
    parcours_tableau: {
        moduleName: 'board',
        image: 'assets/images/activities/plateforme-board.webp',
        nameKey: 'parcours_mod_tableau_name',
        descKey: 'parcours_mod_tableau_desc',
        platforms: ACADEMIQUES,
        niveau: 'amorce',
        icone: 'fa-table-columns',
        champs: {
            title: 'titre court du tableau',
            intro: 'ce que chaque élève dépose, et dans quelle colonne',
            titresColonnes: `de 2 à 4 titres de colonnes courts (${MAX_COLONNE_TABLEAU} caractères maximum) : ce sont eux qui organisent la réflexion`,
        },
        longs: ['intro'],
        listes: ['titresColonnes'],
        construire: construireTableau,
    },
    parcours_wiki: {
        moduleName: 'wiki',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-wiki.webp',
        nameKey: 'parcours_mod_wiki_name',
        descKey: 'parcours_mod_wiki_desc',
        platforms: TOUTES,
        niveau: 'amorce',
        sansAchevement: true,
        icone: 'fa-file-lines',
        champs: {
            title: 'titre court du wiki',
            intro: 'ce que la classe écrit ensemble, comment se répartir le travail, et les règles pour modifier le texte des autres',
            premierePage: 'le titre de la première page du wiki',
        },
        longs: ['intro'],
        construire: construireWiki,
    },
    parcours_glossaire: {
        moduleName: 'glossary',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-glossary.webp',
        nameKey: 'parcours_mod_glossaire_name',
        descKey: 'parcours_mod_glossaire_desc',
        platforms: TOUTES,
        niveau: 'amorce',
        icone: 'fa-spell-check',
        champs: {
            title: 'titre court du glossaire',
            intro: "ce que chaque élève ajoute au glossaire de la classe : quels mots, avec quelle définition et quel exemple. Le glossaire arrive VIDE : ce sont les élèves qui l'écrivent",
        },
        longs: ['intro'],
        construire: construireGlossaire,
    },
    parcours_document: {
        moduleName: 'collabora',
        image: 'assets/images/activities/plateforme-collabora.webp',
        nameKey: 'parcours_mod_document_name',
        descKey: 'parcours_mod_document_desc',
        platforms: ACADEMIQUES,
        niveau: 'amorce',
        sansAchevement: true,
        icone: 'fa-file-pen',
        champs: {
            title: 'titre court du document',
            intro: 'ce que le groupe rédige ensemble, et comment se répartir le travail',
            texteInitial: 'le texte de départ du document partagé, en texte brut : les titres des parties à compléter et une ligne de consigne sous chacune, sans rédiger à la place des élèves',
        },
        longs: ['intro', 'texteInitial'],
        construire: construireDocument,
    },
    parcours_etherpad: {
        moduleName: 'etherpadlite',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-etherpadlite.webp',
        nameKey: 'parcours_mod_etherpad_name',
        descKey: 'parcours_mod_etherpad_desc',
        platforms: ['Magistère'],
        niveau: 'amorce',
        sansAchevement: true,
        icone: 'fa-pen-to-square',
        champs: {
            title: 'titre court du bloc-notes',
            intro: 'ce que le groupe note ensemble, et comment',
        },
        longs: ['intro'],
        construire: construireEtherpad,
    },
    parcours_depot: {
        moduleName: 'publication',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-publication.webp',
        nameKey: 'parcours_mod_depot_name',
        descKey: 'parcours_mod_depot_desc',
        platforms: ACADEMIQUES,
        niveau: 'amorce',
        sansAchevement: true,
        icone: 'fa-folder-open',
        champs: {
            title: 'titre court du dépôt',
            intro: 'quels fichiers déposer, sous quelle forme, et ce que la classe en fera ensuite',
        },
        longs: ['intro'],
        construire: construireDepot,
    },
    parcours_classe_virtuelle: {
        moduleName: 'bigbluebuttonbn',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-bigbluebuttonbn.webp',
        nameKey: 'parcours_mod_classe_name',
        descKey: 'parcours_mod_classe_desc',
        // Magistère SEUL (28 sept. 2026, D77). La palette du test03 d'Éléa propose
        // bien BigBlueButton, mais avec une accréditation serveur « bientôt
        // échue », et Emmanuel confirme que la visio n'est offerte ni sur Éléa ni
        // sur un Moodle ordinaire. Le doute se tranche dans le sens restrictif (D26).
        platforms: ['Magistère'],
        niveau: 'reserve',
        sansAchevement: true,
        // Une séance en visioconférence n'a pas de sens en présentiel : le
        // prompt de plan ne la propose qu'à distance ou en hybride.
        formats: ['distanciel', 'hybride'],
        aFaireKey: 'parcours_afaire_classe',
        icone: 'fa-video',
        champs: {
            title: 'titre court de la séance',
            intro: "à quoi sert la séance en direct, et ce qu'il faut avoir fait avant de la rejoindre",
            accueil: "le message d'accueil affiché à l'ouverture de la salle, une phrase",
        },
        longs: ['intro'],
        construire: construireClasseVirtuelle,
    },
    parcours_base: {
        moduleName: 'data',
        image: 'assets/images/activities/plateforme-data.webp',
        nameKey: 'parcours_mod_base_name',
        descKey: 'parcours_mod_base_desc',
        platforms: TOUTES,
        niveau: 'amorce',
        icone: 'fa-database',
        champs: {
            title: 'titre court de la base',
            intro: "ce que chaque élève ajoute à la collection de la classe, et comment remplir sa fiche",
            rubriques: 'de 2 à 6 rubriques de la fiche que chaque élève remplira, sous la forme « nom de la rubrique : ce qu’on y écrit »',
        },
        longs: ['intro'],
        listes: ['rubriques'],
        construire: construireBase,
    },
    parcours_choix_groupe: {
        moduleName: 'choicegroup',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-choicegroup.webp',
        nameKey: 'parcours_mod_groupe_name',
        descKey: 'parcours_mod_groupe_desc',
        platforms: ACADEMIQUES,
        niveau: 'reserve',
        sansAchevement: true,
        aFaireKey: 'parcours_afaire_groupes',
        icone: 'fa-people-group',
        champs: {
            title: 'titre court du choix',
            intro: 'pourquoi former des groupes, et comment choisir le sien',
        },
        longs: ['intro'],
        construire: construireChoixGroupe,
    },
    parcours_test_etudiant: {
        moduleName: 'studentquiz',
        // Rien à générer : l'IA n'écrit que la consigne (pictogramme de la mosaïque).
        rienAGenerer: true,
        image: 'assets/images/activities/plateforme-studentquiz.webp',
        nameKey: 'parcours_mod_test_etudiant_name',
        descKey: 'parcours_mod_test_etudiant_desc',
        // Éléa SEUL : absent des palettes de Magistère et d'un Moodle nu (palettes.json).
        platforms: ['Éléa'],
        niveau: 'amorce',
        // Choisi par l'enseignant dans la mosaïque, jamais proposé par le plan (D89).
        surDemande: true,
        icone: 'fa-circle-question',
        champs: {
            title: 'titre court du test étudiant',
            intro: "ce que chaque élève fait dans ce test que la classe construit : créer au moins une question sur les notions du parcours (combien, de quel type, avec une bonne réponse sûre et une explication), puis répondre aux questions des camarades, les noter et les commenter avec bienveillance. Le test arrive VIDE : ce sont les élèves qui écrivent les questions",
        },
        longs: ['intro'],
        construire: construireTestEtudiant,
    },
};

/** La ligne « À faire » d'une activité, ou `null` si le module n'en demande pas. */
export function ligneAFaire(def, titre) {
    return def && def.aFaireKey ? tr(def.aFaireKey, { t: titre }) : null;
}
