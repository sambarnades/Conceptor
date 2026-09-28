/**
 * mbz-course-builder.js — Synthèse d'un backup Moodle « cours » multi-activités
 *
 * PRD-partage-public-collections-2026-07-12, Story 7 (§6.1) — export « Parcours
 * .mbz » d'une collection : recrée un COURS Moodle (format `topics`) avec ses
 * sections (= sous-collections) et ses activités dans l'ordre pédagogique, à
 * partir des .mbz mono-activité déposés (raw_blob de chaque publication).
 *
 * PHASE A (v1) — activités AUTO-PORTEUSES uniquement : les 8 modules Éléa dont
 * le contenu vit DANS le XML de l'activité (millionnairev2, simplequiz,
 * epikmatch, glossary, page, book, assign) s'agrègent nativement. Le Test natif
 * `quiz` (banque de questions racine + wiring `<question_instances>`) est
 * REPOUSSÉ à un spike ultérieur (§6.1.3/§6.1.4) — il n'est jamais inclus
 * silencieusement : listé « non inclus » (→ le ZIP §6.0 le couvre). Les H5P
 * idem (joints en sus, PRD §6.1.4).
 *
 * MÉTHODE : « extract + renumérotation haute ». Chaque .mbz mono-activité est
 * déjà valide à l'import Éléa. On REPREND tel quel son dossier
 * `activities/<mod>_<id>/` (contenu pédagogique intact) et on ne RENUMÉROTE que
 * les IDs de niveau cours (cmid, contextid, sectionid, grade item), dans un
 * espace HAUT déterministe et disjoint (PRD §6.1.2) — collision interne
 * impossible par construction. On JETTE le wrapper de chaque backup déposé
 * (moodle_backup.xml, course/, sections/, gradebook racine…) et on SYNTHÉTISE
 * un unique wrapper « cours » (généralisation du backup `topics` mono-activité
 * de Caramel — la seule référence maison éprouvée à l'import).
 *
 * Fonctions PURES et testables (aucune dépendance `window`) pour toute la
 * synthèse XML ; seul l'orchestrateur asynchrone touche extractMbz/buildMbz.
 *
 * ⚠️ Tant que la matrice d'import réel (Éléa + Magistère + Moodle, cours de 5+
 * activités) n'est pas verte, l'offre reste EXPÉRIMENTALE (cf. reader-modal).
 */

// =========================================================================
// Constantes de version Moodle (cible 4.5, aligné Caramel moodle-backup.js)
// =========================================================================

const MOODLE_VERSION  = '2024100706';
const MOODLE_RELEASE  = '4.5.6 (Build: 20250811)';
const BACKUP_VERSION  = '2024100700';
const BACKUP_RELEASE  = '4.5';
const COURSE_BACKUP_ID = 'b1904924ce499b878a2f32a7569d6ad0';

/**
 * IDENTITÉ DE L'HÔTE — ce que le backup déclare sur son origine.
 *
 * Ce fichier est PARTAGÉ entre La Sucrerie et Caramel (manifeste
 * `scripts/lib/shared-files.mjs`, byte-identique de part et d'autre). Or un
 * backup fabriqué par Caramel ne doit pas se déclarer venu d'ailleurs : ces
 * quatre valeurs — le `wwwroot` et le hash de site écrits dans
 * `moodle_backup.xml`, le nom de catégorie de `course.xml`, le hostname qui
 * entre dans le `stamp` de chaque question, et la ligne de `moodle_backup.log`
 * — sont donc passées à l'APPEL, chaque hôte fournissant la sienne.
 *
 * Les valeurs par défaut sont celles de La Sucrerie : un appelant qui ne
 * fournit rien obtient EXACTEMENT le fichier d'avant ce changement.
 */
export const IDENTITE_DEFAUT = Object.freeze({
  wwwroot:      'https://sucrerie.forge.apps.education.fr/',
  siteHash:     '31f4b05dd157f31e868a2589d8961f99',
  categorie:    'sucrerie',
  quizHostname: 'sucrerie.forge.apps.education.fr',
  journal:      'Parcours généré par Sucrerie\n',
});

/** Complète une identité partielle par les valeurs par défaut. PURE. */
export function resoudreIdentite(identite) {
  return identite ? { ...IDENTITE_DEFAUT, ...identite } : IDENTITE_DEFAUT;
}

/**
 * Modules auto-porteurs — ceux dont le dossier `activities/<mod>_<id>/` se
 * renumérote tel quel. `quiz` (Test natif) en est ABSENT volontairement : sa
 * banque de questions vit à la racine du backup et se régénère
 * (`buildQuizActivityFiles`), elle ne se recopie pas.
 *
 * Les trois derniers (`forum`, `choice`, `label`) sont apportés par l'atelier de
 * parcours de Caramel, qui fabrique leur dossier d'activité de bout en bout
 * (`js/parcours/modules-parcours.js`) : ce sont des pièces de COURS — un espace
 * d'échange, un sondage, un texte de liaison —, pas des activités qu'on
 * télécharge séparément. Ils sont inoffensifs pour La Sucrerie, qui ne les
 * produit pas : ce set ne fait qu'AUTORISER un module, il n'en crée aucun.
 */
export const SELF_CONTAINED_MODULES = new Set([
  'millionnairev2', 'simplequiz', 'epikmatch', 'glossary', 'page', 'book', 'assign',
  'forum', 'choice', 'label',
  'collabwordcloud', 'stickynotes'
]);

/**
 * Fichiers STANDARD attendus dans CHAQUE dossier d'activité par le restore d'un
 * COURS Moodle 4.x (une étape de restore par fichier). Les processeurs Caramel
 * en OMETTENT certains selon le module (ex. `millionnairev2` sans `filters.xml`
 * → « Fichier de sauvegarde XML manquant » au restore de cours). On garantit
 * donc leur présence : tout fichier ABSENT du .mbz déposé est synthétisé VIDE
 * mais valide (jamais d'écrasement d'un fichier réel). `<mod>.xml`/`module.xml`
 * viennent toujours du dépôt (activité inutilisable sinon).
 */
const ACTIVITY_ENSURE = {
  'filters.xml':       `<?xml version="1.0" encoding="UTF-8"?>\n<filters>\n  <filter_actives>\n  </filter_actives>\n  <filter_configs>\n  </filter_configs>\n</filters>`,
  'calendar.xml':      `<?xml version="1.0" encoding="UTF-8"?>\n<events>\n</events>`,
  'comments.xml':      `<?xml version="1.0" encoding="UTF-8"?>\n<comments>\n</comments>`,
  'grade_history.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<grade_history>\n  <grade_grades>\n  </grade_grades>\n</grade_history>`,
  'roles.xml':         `<?xml version="1.0" encoding="UTF-8"?>\n<roles>\n  <role_overrides>\n  </role_overrides>\n  <role_assignments>\n  </role_assignments>\n</roles>`,
  'grades.xml':        `<?xml version="1.0" encoding="UTF-8"?>\n<activity_gradebook>\n  <grade_items>\n  </grade_items>\n  <grade_letters>\n  </grade_letters>\n</activity_gradebook>`,
  'inforef.xml':       `<?xml version="1.0" encoding="UTF-8"?>\n<inforef>\n</inforef>`,
};

// =========================================================================
// Schéma d'IDs (PRD §6.1.2) — espaces HAUTS disjoints, déterministes
// =========================================================================
//   Plafond collection = 100 items (MAX_COLLECTION_ITEMS) → i ∈ [0,99].
//   Familles à pas de 100 (cmid/instance/context/grade) : une décade de 10 000
//   chacune, sans chevauchement. La famille FICHIER (Phase B, pas de 10 :
//   fileIdFor(i)=970000+i*10, 2 ids/activité) occupe 970000-970991 — même décade
//   que les enrol 971001-971003 mais DISJOINTE (marge 10). Invariant testé
//   (tests/mbz-course-builder : « aucune collision (100 items) »).

export const COURSE_ID          = 999000;   // original_course_id
export const COURSE_CONTEXT_ID  = 700000;   // original_course_contextid
export const GRADE_CATEGORY_ID  = 850000;   // catégorie de notes du cours
export const COURSE_GRADE_ITEM  = 850001;   // grade_item itemtype=course
export const ENROL_MANUAL_ID    = 971001;
export const ENROL_GUEST_ID     = 971002;
export const ENROL_SELF_ID      = 971003;

/** cmid (course module id) de l'activité i. */
export const moduleIdFor        = (i) => 900000 + i * 100;
/** id d'instance de l'activité i (table du module). */
export const activityIdFor      = (i) => 910000 + i * 100;
/** contextid de l'activité i. */
export const activityContextFor = (i) => 950000 + i * 100;
/** grade_item id de l'activité i. */
export const gradeItemFor       = (i) => 960000 + i * 100;
/** sectionid de la section s (s=0 → « Généralités »). */
export const sectionIdFor       = (s) => 800000 + s;
/** 1er id de fichier (pool) de l'activité i — 2 ids consécutifs (fichier + stub « . »). */
export const fileIdFor          = (i) => 970000 + i * 10;

/** contenthash Moodle du contenu VIDE (sha1 de "") : stub répertoire « . ». */
export const EMPTY_FILE_HASH = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';

// --- Test (mod_quiz) : IDs de banque de questions (Phase B) --------------
//   Toute la banque d'un Test (catégories, qbe, versions, questions, réponses,
//   sous-éléments, hints, instances, références) est REMAPPÉE au restore Moodle :
//   seules comptent les COHÉRENCES INTERNES (slot↔qbe, sequence↔enfants…). On
//   distribue donc les IDs dans un espace HAUT disjoint : chaque quiz d'index i
//   occupe une plage de 100 000 (base 2M → 12M pour 100 activités), plus large
//   que toute banque réaliste (garde-fou : compteur < stride). Les deux
//   catégories « top »/« Défaut » de CONTEXTE COURS sont PARTAGÉES par tous les
//   Test du parcours (2 IDs fixes, hors plages par-quiz).
export const COURSE_QCAT_TOP_ID     = 860000;   // catégorie « top » (contexte cours) partagée
export const COURSE_QCAT_DEFAULT_ID = 860001;   // catégorie « Défaut » (contexte cours) partagée
const QUIZ_ID_BASE   = 2000000;
const QUIZ_ID_STRIDE = 100000;
/** 1er ID de banque de l'activité quiz i (plage [base, base+stride[). */
export const quizIdBaseFor = (i) => QUIZ_ID_BASE + i * QUIZ_ID_STRIDE;

// =========================================================================
// Helpers XML
// =========================================================================

/** Échappe le texte pour insertion dans un nœud XML (miroir de mbz-parser). */
export function escapeXml(s) {
  if (s == null) return '';
  return String(s).replace(/[<>&'"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','\'':'&apos;','"':'&quot;' }[c]));
}

/** Décode un fichier extrait (Uint8Array|string) en string UTF-8. */
function toText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return new TextDecoder('utf-8').decode(v);
}

/**
 * Remplace le 1er entier d'un `<tag>…</tag>` numérique. Sans correspondance :
 * chaîne inchangée (no-op — ex. grades.xml vide d'une Page).
 */
function setNumTag(xml, tag, value, all = false) {
  const re = new RegExp(`(<${tag}>)\\s*\\d+\\s*(</${tag}>)`, all ? 'g' : '');
  return xml.replace(re, `$1${value}$2`);
}

/** Remplace la valeur d'un attribut numérique sur une balise donnée (1re occ.). */
function setNumAttr(xml, tag, attr, value) {
  const re = new RegExp(`(<${tag}\\b[^>]*?\\b${attr}=")\\d+(")`);
  return xml.replace(re, `$1${value}$2`);
}

// =========================================================================
// Renumérotation d'une activité extraite (PURE)
// =========================================================================

/**
 * Indique si un backup mono-activité extrait embarque des médias (fichiers
 * binaires). En Phase A on EXCLUT ces activités du parcours (renumérotation des
 * `contextid` de fichiers non couverte ici) plutôt que de les inclure cassées —
 * elles restent disponibles via le ZIP §6.0. Jamais d'omission silencieuse.
 * @param {Object<string,*>} files
 * @returns {boolean}
 */
export function hasEmbeddedFiles(files) {
  for (const p of Object.keys(files || {})) {
    if (/^files\//.test(p)) return true;
  }
  const fx = files && files['files.xml'];
  if (fx && /<file\b/i.test(toText(fx))) return true;
  return false;
}

/**
 * Reprend le dossier `activities/<mod>_<old>/` d'un backup extrait et le
 * renumérote dans l'espace cours (index i), sous un nouveau chemin. Les
 * fichiers non structurels (roles, calendar, filters, grade_history) sont
 * recopiés verbatim ; seuls `<mod>.xml`, `module.xml`, `grades.xml`,
 * `inforef.xml` voient leurs IDs de niveau cours réécrits.
 *
 * PURE : n'utilise que des opérations sur chaînes. Ne mute pas `extracted`.
 *
 * @param {{files:Object, moduleName:string, activityDir:string}} extracted - sortie extractMbz
 * @param {{index:number, sectionId:number}} pos
 * @param {number} timestamp - epoch (s) injecté (déterminisme testable)
 * @returns {{
 *   files: Object<string,string|Uint8Array>,
 *   moduleName: string, moduleId: number, activityId: number,
 *   contextId: number, gradeItemId: number, sectionId: number, dir: string
 * }}
 */
export function renumberActivity(extracted, { index, sectionId }, timestamp) {
  const { files, moduleName, activityDir } = extracted;
  const moduleId   = moduleIdFor(index);
  const activityId = activityIdFor(index);
  const contextId  = activityContextFor(index);
  const gradeItem  = gradeItemFor(index);
  const newDir     = `activities/${moduleName}_${moduleId}`;

  const out = {};
  const prefix = activityDir.replace(/\/?$/, '/');
  for (const [path, raw] of Object.entries(files)) {
    if (!path.startsWith(prefix)) continue;               // hors dossier activité → ignoré
    const rel = path.slice(prefix.length);
    const dest = `${newDir}/${rel}`;

    // Fichiers structurels → réécriture ciblée ; autres → verbatim.
    if (rel === `${moduleName}.xml`) {
      let xml = toText(raw);
      // <activity id="…" moduleid="…" modulename="X" contextid="…">
      xml = setNumAttr(xml, 'activity', 'id', activityId);
      xml = setNumAttr(xml, 'activity', 'moduleid', moduleId);
      xml = setNumAttr(xml, 'activity', 'contextid', contextId);
      // instance <X id="…"> (nom d'élément = moduleName)
      xml = setNumAttr(xml, moduleName, 'id', activityId);
      // référence interne au cours (plugins simplequiz/millionnaire/epikmatch)
      xml = setNumTag(xml, 'course', COURSE_ID, true);
      out[dest] = xml;
    } else if (rel === 'module.xml') {
      let xml = toText(raw);
      xml = setNumAttr(xml, 'module', 'id', moduleId);
      xml = setNumTag(xml, 'sectionid', sectionId);
      xml = setNumTag(xml, 'sectionnumber', sectionId - sectionIdFor(0)); // n° local de section
      out[dest] = xml;
    } else if (rel === 'grades.xml') {
      let xml = toText(raw);
      xml = setNumAttr(xml, 'grade_item', 'id', gradeItem);
      xml = setNumTag(xml, 'categoryid', GRADE_CATEGORY_ID, true);
      xml = setNumTag(xml, 'iteminstance', activityId, true);
      // sortorder DÉTERMINISTE et unique par activité (2 + index) : évite que
      // tous les grade_items d'activité portent la même valeur. Non fatal au
      // restore (Moodle recalcule), mais un ordre stable est plus propre.
      xml = setNumTag(xml, 'sortorder', 2 + index, true);
      out[dest] = xml;
    } else if (rel === 'inforef.xml') {
      let xml = toText(raw);
      // inforef ne porte (pour ces modules) qu'une grade_itemref → 1er <id>.
      xml = xml.replace(/(<grade_item>\s*<id>)\d+(<\/id>)/, `$1${gradeItem}$2`);
      out[dest] = xml;
    } else {
      out[dest] = raw; // roles.xml, calendar.xml, filters.xml, grade_history.xml…
    }
  }

  // Complète les fichiers standard manquants (ex. filters.xml absent d'un
  // millionnairev2) → chaque dossier d'activité satisfait les étapes de restore.
  for (const [name, tmpl] of Object.entries(ACTIVITY_ENSURE)) {
    const dest = `${newDir}/${name}`;
    if (!(dest in out)) out[dest] = tmpl;
  }

  return { files: out, moduleName, moduleId, activityId, contextId, gradeItemId: gradeItem, sectionId, dir: newDir };
}

// =========================================================================
// Synthèse des fichiers de niveau COURS (PURES)
// =========================================================================

const ROOT_STATIC = {
  'files.xml':      `<?xml version="1.0" encoding="UTF-8"?>\n<files>\n</files>`,
  'roles.xml':      `<?xml version="1.0" encoding="UTF-8"?>\n<roles_definition>\n</roles_definition>`,
  'outcomes.xml':   `<?xml version="1.0" encoding="UTF-8"?>\n<outcomes_definition>\n</outcomes_definition>`,
  'scales.xml':     `<?xml version="1.0" encoding="UTF-8"?>\n<scales_definition>\n</scales_definition>`,
  'groups.xml':     `<?xml version="1.0" encoding="UTF-8"?>\n<groups>\n  <groupcustomfields>\n  </groupcustomfields>\n  <groupings>\n    <groupingcustomfields>\n    </groupingcustomfields>\n  </groupings>\n</groups>`,
  'questions.xml':  `<?xml version="1.0" encoding="UTF-8"?>\n<question_categories>\n</question_categories>`,
  'completion.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<course_completion>\n</course_completion>`,
};

const COURSE_STATIC_INFOREF   = `<?xml version="1.0" encoding="UTF-8"?>\n<inforef>\n  <roleref>\n    <role>\n      <id>5</id>\n    </role>\n  </roleref>\n</inforef>`;
const EMPTY_ROLES             = `<?xml version="1.0" encoding="UTF-8"?>\n<roles>\n  <role_overrides>\n  </role_overrides>\n  <role_assignments>\n  </role_assignments>\n</roles>`;
const EMPTY_INFOREF           = `<?xml version="1.0" encoding="UTF-8"?>\n<inforef>\n</inforef>`;
const COMPLETIONDEFAULTS      = `<?xml version="1.0" encoding="UTF-8"?>\n<course_completion_defaults>\n</course_completion_defaults>`;
const CONTENTBANK             = `<?xml version="1.0" encoding="UTF-8"?>\n<contents>\n</contents>`;
const EMPTY_CALENDAR          = `<?xml version="1.0" encoding="UTF-8"?>\n<events>\n</events>`;
const EMPTY_FILTERS           = `<?xml version="1.0" encoding="UTF-8"?>\n<filters>\n  <filter_actives>\n  </filter_actives>\n  <filter_configs>\n  </filter_configs>\n</filters>`;

/** gradebook.xml racine : 1 catégorie de cours + 1 grade_item « course ». */
export function buildGradebookXml(timestamp) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gradebook>
  <attributes>
  </attributes>
  <grade_categories>
    <grade_category id="${GRADE_CATEGORY_ID}">
      <parent>$@NULL@$</parent>
      <depth>1</depth>
      <path>/${GRADE_CATEGORY_ID}/</path>
      <fullname>?</fullname>
      <aggregation>13</aggregation>
      <keephigh>0</keephigh>
      <droplow>0</droplow>
      <aggregateonlygraded>1</aggregateonlygraded>
      <aggregateoutcomes>0</aggregateoutcomes>
      <timecreated>${timestamp}</timecreated>
      <timemodified>${timestamp}</timemodified>
      <hidden>0</hidden>
    </grade_category>
  </grade_categories>
  <grade_items>
    <grade_item id="${COURSE_GRADE_ITEM}">
      <categoryid>$@NULL@$</categoryid>
      <itemname>$@NULL@$</itemname>
      <itemtype>course</itemtype>
      <itemmodule>$@NULL@$</itemmodule>
      <iteminstance>${COURSE_ID}</iteminstance>
      <itemnumber>$@NULL@$</itemnumber>
      <iteminfo>$@NULL@$</iteminfo>
      <idnumber>$@NULL@$</idnumber>
      <calculation>$@NULL@$</calculation>
      <gradetype>1</gradetype>
      <grademax>100.00000</grademax>
      <grademin>0.00000</grademin>
      <scaleid>$@NULL@$</scaleid>
      <outcomeid>$@NULL@$</outcomeid>
      <gradepass>0.00000</gradepass>
      <multfactor>1.00000</multfactor>
      <plusfactor>0.00000</plusfactor>
      <aggregationcoef>0.00000</aggregationcoef>
      <aggregationcoef2>0.00000</aggregationcoef2>
      <weightoverride>0</weightoverride>
      <sortorder>1</sortorder>
      <display>0</display>
      <decimals>$@NULL@$</decimals>
      <hidden>0</hidden>
      <locked>0</locked>
      <locktime>0</locktime>
      <needsupdate>0</needsupdate>
      <timecreated>${timestamp}</timecreated>
      <timemodified>${timestamp}</timemodified>
      <grade_grades>
      </grade_grades>
    </grade_item>
  </grade_items>
  <grade_letters>
  </grade_letters>
  <grade_settings>
    <grade_setting id="">
      <name>minmaxtouse</name>
      <value>1</value>
    </grade_setting>
  </grade_settings>
</gradebook>`;
}

/** course/course.xml (format topics). */
export function buildCourseXml({ courseFullname, courseShortname, timestamp, identite }) {
  const hote = resoudreIdentite(identite);
  return `<?xml version="1.0" encoding="UTF-8"?>
<course id="${COURSE_ID}" contextid="${COURSE_CONTEXT_ID}">
  <shortname>${escapeXml(courseShortname)}</shortname>
  <fullname>${escapeXml(courseFullname)}</fullname>
  <idnumber></idnumber>
  <summary>$@NULL@$</summary>
  <summaryformat>0</summaryformat>
  <format>topics</format>
  <showgrades>1</showgrades>
  <newsitems>0</newsitems>
  <startdate>0</startdate>
  <enddate>0</enddate>
  <marker>0</marker>
  <maxbytes>0</maxbytes>
  <legacyfiles>0</legacyfiles>
  <showreports>0</showreports>
  <visible>1</visible>
  <groupmode>1</groupmode>
  <groupmodeforce>0</groupmodeforce>
  <defaultgroupingid>0</defaultgroupingid>
  <lang></lang>
  <theme></theme>
  <timecreated>${timestamp}</timecreated>
  <timemodified>${timestamp}</timemodified>
  <requested>0</requested>
  <showactivitydates>0</showactivitydates>
  <showcompletionconditions>1</showcompletionconditions>
  <pdfexportfont>$@NULL@$</pdfexportfont>
  <enablecompletion>1</enablecompletion>
  <completionnotify>0</completionnotify>
  <category id="53">
    <name>${escapeXml(hote.categorie)}</name>
    <description></description>
  </category>
  <tags>
  </tags>
  <customfields>
  </customfields>
  <courseformatoptions>
    <courseformatoption>
      <format>topics</format>
      <sectionid>0</sectionid>
      <name>coursedisplay</name>
      <value>1</value>
    </courseformatoption>
    <courseformatoption>
      <format>topics</format>
      <sectionid>0</sectionid>
      <name>hiddensections</name>
      <value>1</value>
    </courseformatoption>
  </courseformatoptions>
</course>`;
}

/** course/enrolments.xml (manual + guest + self, désactivés). */
export function buildEnrolmentsXml(timestamp) {
  const enrol = (id, type, status, roleid, extra = '') => `    <enrol id="${id}">
      <enrol>${type}</enrol>
      <status>${status}</status>
      <name>$@NULL@$</name>
      <enrolperiod>0</enrolperiod>
      <enrolstartdate>0</enrolstartdate>
      <enrolenddate>0</enrolenddate>
      <expirynotify>0</expirynotify>
      <expirythreshold>0</expirythreshold>
      <notifyall>0</notifyall>
      <password>$@NULL@$</password>
      <cost>$@NULL@$</cost>
      <currency>$@NULL@$</currency>
      <roleid>${roleid}</roleid>${extra}
      <customint1>$@NULL@$</customint1>
      <customint2>$@NULL@$</customint2>
      <customint3>$@NULL@$</customint3>
      <customint4>$@NULL@$</customint4>
      <customint5>$@NULL@$</customint5>
      <customint6>$@NULL@$</customint6>
      <customint7>$@NULL@$</customint7>
      <customint8>$@NULL@$</customint8>
      <customchar1>$@NULL@$</customchar1>
      <customchar2>$@NULL@$</customchar2>
      <customchar3>$@NULL@$</customchar3>
      <customdec1>$@NULL@$</customdec1>
      <customdec2>$@NULL@$</customdec2>
      <customtext1>$@NULL@$</customtext1>
      <customtext2>$@NULL@$</customtext2>
      <customtext3>$@NULL@$</customtext3>
      <customtext4>$@NULL@$</customtext4>
      <timecreated>${timestamp}</timecreated>
      <timemodified>${timestamp}</timemodified>
      <user_enrolments>
      </user_enrolments>
    </enrol>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<enrolments>
  <enrols>
${enrol(ENROL_MANUAL_ID, 'manual', 0, 5)}
${enrol(ENROL_GUEST_ID, 'guest', 1, 0)}
${enrol(ENROL_SELF_ID, 'self', 1, 5)}
  </enrols>
</enrolments>`;
}

/**
 * sections/section_<id>/section.xml. `sequence` = cmids des activités de la
 * section, dans l'ordre, séparés par des espaces. `name` = titre de la
 * sous-collection (ou null pour « Généralités »). PURE.
 */
export function buildSectionXml({ sectionId, number, name, sequence, timestamp }) {
  const nameXml = (name && String(name).trim())
    ? escapeXml(String(name).trim())
    : '$@NULL@$';
  return `<?xml version="1.0" encoding="UTF-8"?>
<section id="${sectionId}">
  <number>${number}</number>
  <name>${nameXml}</name>
  <summary></summary>
  <summaryformat>1</summaryformat>
  <sequence>${(sequence || []).join(',')}</sequence>
  <visible>1</visible>
  <availabilityjson>$@NULL@$</availabilityjson>
  <component>$@NULL@$</component>
  <itemid>$@NULL@$</itemid>
  <timemodified>${timestamp}</timemodified>
</section>`;
}

/**
 * moodle_backup.xml de niveau COURS (format topics), généralisé à N activités
 * et M sections. PURE.
 *
 * @param {Object} p
 * @param {string} p.backupName
 * @param {string} p.courseFullname
 * @param {string} p.courseShortname
 * @param {number} p.timestamp
 * @param {Array<{moduleId:number, sectionId:number, moduleName:string, title:string}>} p.activities
 * @param {Array<{sectionId:number, number:number}>} p.sections
 * @returns {string}
 */
export function buildCourseBackupXml({ backupName, courseFullname, courseShortname, timestamp, activities, sections, identite }) {
  const hote = resoudreIdentite(identite);
  const activitiesXml = activities.map(a => `        <activity>
          <moduleid>${a.moduleId}</moduleid>
          <sectionid>${a.sectionId}</sectionid>
          <modulename>${a.moduleName}</modulename>
          <title>${escapeXml(a.title)}</title>
          <directory>activities/${a.moduleName}_${a.moduleId}</directory>
          <insubsection></insubsection>
        </activity>`).join('\n');

  const sectionsXml = sections.map(s => `        <section>
          <sectionid>${s.sectionId}</sectionid>
          <title>${s.number}</title>
          <directory>sections/section_${s.sectionId}</directory>
          <parentcmid></parentcmid>
          <modname></modname>
        </section>`).join('\n');

  const rootSetting = (name, value) => `      <setting>
        <level>root</level>
        <name>${name}</name>
        <value>${value}</value>
      </setting>`;

  const sectionSettings = sections.map(s => `      <setting>
        <level>section</level>
        <section>section_${s.sectionId}</section>
        <name>section_${s.sectionId}_included</name>
        <value>1</value>
      </setting>
      <setting>
        <level>section</level>
        <section>section_${s.sectionId}</section>
        <name>section_${s.sectionId}_userinfo</name>
        <value>0</value>
      </setting>`).join('\n');

  const activitySettings = activities.map(a => `      <setting>
        <level>activity</level>
        <activity>${a.moduleName}_${a.moduleId}</activity>
        <name>${a.moduleName}_${a.moduleId}_included</name>
        <value>1</value>
      </setting>
      <setting>
        <level>activity</level>
        <activity>${a.moduleName}_${a.moduleId}</activity>
        <name>${a.moduleName}_${a.moduleId}_userinfo</name>
        <value>0</value>
      </setting>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<moodle_backup>
  <information>
    <name>${escapeXml(backupName)}</name>
    <moodle_version>${MOODLE_VERSION}</moodle_version>
    <moodle_release>${MOODLE_RELEASE}</moodle_release>
    <backup_version>${BACKUP_VERSION}</backup_version>
    <backup_release>${BACKUP_RELEASE}</backup_release>
    <backup_date>${timestamp}</backup_date>
    <mnet_remoteusers>0</mnet_remoteusers>
    <include_files>1</include_files>
    <include_file_references_to_external_content>0</include_file_references_to_external_content>
    <original_wwwroot>${hote.wwwroot}</original_wwwroot>
    <original_site_identifier_hash>${hote.siteHash}</original_site_identifier_hash>
    <original_course_id>${COURSE_ID}</original_course_id>
    <original_course_format>topics</original_course_format>
    <original_course_fullname>${escapeXml(courseFullname)}</original_course_fullname>
    <original_course_shortname>${escapeXml(courseShortname)}</original_course_shortname>
    <original_course_startdate>0</original_course_startdate>
    <original_course_enddate>0</original_course_enddate>
    <original_course_contextid>${COURSE_CONTEXT_ID}</original_course_contextid>
    <original_system_contextid>1</original_system_contextid>
    <details>
      <detail backup_id="${COURSE_BACKUP_ID}">
        <type>course</type>
        <format>moodle2</format>
        <interactive>1</interactive>
        <mode>10</mode>
        <execution>1</execution>
        <executiontime>0</executiontime>
      </detail>
    </details>
    <contents>
      <activities>
${activitiesXml}
      </activities>
      <sections>
${sectionsXml}
      </sections>
      <course>
        <courseid>${COURSE_ID}</courseid>
        <title>${escapeXml(courseShortname)}</title>
        <directory>course</directory>
      </course>
    </contents>
    <settings>
${rootSetting('filename', escapeXml(backupName))}
${rootSetting('imscc11', 0)}
${rootSetting('users', 0)}
${rootSetting('anonymize', 0)}
${rootSetting('role_assignments', 0)}
${rootSetting('activities', 1)}
${rootSetting('blocks', 1)}
${rootSetting('files', 1)}
${rootSetting('filters', 1)}
${rootSetting('comments', 0)}
${rootSetting('badges', 1)}
${rootSetting('calendarevents', 1)}
${rootSetting('userscompletion', 0)}
${rootSetting('logs', 0)}
${rootSetting('grade_histories', 0)}
${rootSetting('questionbank', 1)}
${rootSetting('groups', 1)}
${rootSetting('competencies', 0)}
${rootSetting('customfield', 1)}
${rootSetting('contentbankcontent', 1)}
${rootSetting('xapistate', 0)}
${rootSetting('legacyfiles', 1)}
${sectionSettings}
${activitySettings}
    </settings>
  </information>
</moodle_backup>`;
}

// =========================================================================
// Planification des sections (PURE)
// =========================================================================

/**
 * À partir du manifeste + items résolus, produit le plan ordonné des activités
 * candidates et la carte des sections. Section 0 = « Généralités » (items
 * loose, folder:null) ; chaque sous-collection nommée → une section topic 1..M.
 * Section 0 est TOUJOURS présente (Moodle l'exige), même vide.
 *
 * Les items non-`mbz` (h5p, xml, markdown) et les modules Test/inconnus sont
 * marqués `excluded` avec un motif — jamais omis en silence (PRD §6.1.5).
 *
 * @param {{structure?:Array}} manifest
 * @param {Array} items - items résolus ({public_id, titre, content_format})
 * @returns {{
 *   plan: Array<{public_id:string, title:string, content_format:string, sectionName:string, sectionIndex:number}>,
 *   sections: Array<{index:number, name:string}>,
 *   excluded: Array<{public_id:string, title:string, reason:string}>
 * }}
 */
export function planCourse(manifest, items) {
  const byId = new Map(
    (Array.isArray(items) ? items : [])
      .filter(it => it && it.public_id)
      .map(it => [String(it.public_id), it])
  );
  const structure = (manifest && Array.isArray(manifest.structure)) ? manifest.structure : [];

  // 1ʳᵉ passe : retenir les mbz avec leur clé de section brute (nom, ou '' pour
  // loose). On ne réserve PAS encore d'index — les sections dont TOUS les items
  // sont exclus (ex. sous-collection 100 % H5P) ne doivent créer AUCune section
  // (sinon numéros de topics non contigus au restore Moodle).
  const plan = [];
  const excluded = [];
  for (const sec of structure) {
    const rows = ((sec && Array.isArray(sec.items)) ? sec.items : []);
    if (!rows.length) continue;
    const sectionName = (sec && sec.name && String(sec.name).trim()) ? String(sec.name).trim() : '';
    for (const pid of rows) {
      const it = byId.get(String(pid));
      if (!it) { excluded.push({ public_id: String(pid), title: String(pid), reason: 'unavailable', sectionName }); continue; }
      const fmt = String(it.content_format || '').toLowerCase();
      const entry = { public_id: String(it.public_id), title: String(it.titre || it.public_id), content_format: fmt, sectionName };
      if (fmt !== 'mbz') { excluded.push({ ...entry, reason: fmt === 'h5p' ? 'h5p' : 'not_mbz' }); continue; }
      plan.push(entry);
    }
  }

  // 2ᵉ passe : indices DENSES et contigus. Section 0 = Généralités (toujours) ;
  // chaque nom de sous-collection ayant ≥ 1 mbz reçoit l'indice suivant, dans
  // l'ordre de 1ʳᵉ apparition (préservé par le plan = ordre du manifeste).
  const sections = [{ index: 0, name: '' }];
  const keyToIndex = new Map([['', 0]]);
  for (const p of plan) {
    if (p.sectionName && !keyToIndex.has(p.sectionName)) {
      const idx = sections.length;
      keyToIndex.set(p.sectionName, idx);
      sections.push({ index: idx, name: p.sectionName });
    }
  }
  for (const p of plan) p.sectionIndex = keyToIndex.get(p.sectionName);

  return { plan, sections, excluded };
}

/**
 * Réconcilie le DOUBLE filtre de l'export « parcours » d'une collection et
 * produit directement le plan d'assemblage (activités + sections denses) prêt
 * pour `assembleCourseFiles`/`buildMbzFromExtracted`, plus la liste des
 * exclusions AVEC MOTIF (jamais d'omission silencieuse, PRD §6.1.5).
 *
 * Deux niveaux de filtre, réconciliés AVANT `planCourse` pour que la
 * numérotation reste dense (aucun trou de section/activité, cf. contrat de
 * `buildMbzFromExtracted`) :
 *  1. niveau FORMAT (sur les items résolus) — h5p → motif `h5p`, autres non-mbz
 *     (xml, markdown) → `not_mbz` ;
 *  2. niveau MODULE / MÉDIAS (sur l'extraction déjà faite) — module non
 *     auto-porteur → `quiz` (Test natif) ou `unsupported`, backup à médias
 *     embarqués → `media`, extraction absente (fetch échoué / illisible) →
 *     `unavailable`.
 * Seuls les mbz auto-porteurs SANS média nourrissent `planCourse` → le plan et
 * les sections retournés sont déjà purgés.
 *
 * PURE : le fetch réseau + `extractMbz` sont réalisés EN AMONT par le bridge
 * (collection-export-bridge.js). Ne touche ni `window` ni le réseau.
 *
 * @param {Object} p
 * @param {{structure?:Array}} p.manifest
 * @param {Array} p.items - items résolus ({public_id, titre, content_format})
 * @param {Object<string,{extracted:Object}>} p.extractedById - pid → { extracted } (sortie extractMbz)
 * @returns {{
 *   activities: Array<{extracted:Object, title:string, sectionIndex:number}>,
 *   sections: Array<{index:number, name:string}>,
 *   excluded: Array<{public_id:string, title:string, reason:string}>,
 *   eligibleCount: number
 * }} reason ∈ 'unavailable'|'h5p'|'not_mbz'|'quiz'|'unsupported'|'media'
 */
export function planCollectionCourse({ manifest, items, extractedById }) {
  const byId = new Map(
    (Array.isArray(items) ? items : [])
      .filter(it => it && it.public_id)
      .map(it => [String(it.public_id), it])
  );
  const ex = extractedById || {};
  const structure = (manifest && Array.isArray(manifest.structure)) ? manifest.structure : [];

  const eligibleItems = [];
  const excluded = [];
  const seen = new Set();
  // Structure DÉDUPLIQUÉE (1ʳᵉ occurrence d'un pid gagne). On la reconstruit au
  // lieu de passer le manifeste brut à planCourse : planCourse ne dédup PAS (il
  // ré-émet une activité par occurrence), donc un pid présent deux fois y serait
  // ré-expansé en une activité redondante — la garde `seen` ci-dessous ne
  // protégerait alors qu'`eligibleItems`/`excluded`, pas la sortie réelle.
  const cleanStructure = [];
  for (const sec of structure) {
    const rows = (sec && Array.isArray(sec.items)) ? sec.items : [];
    const keptRows = [];
    for (const pid0 of rows) {
      const pid = String(pid0);
      if (seen.has(pid)) continue;          // dédup GLOBALE (un pid dans 2 sections → gardé 1 fois)
      seen.add(pid);
      keptRows.push(pid);
      const it = byId.get(pid);
      const title = it ? String(it.titre || pid) : pid;
      if (!it) { excluded.push({ public_id: pid, title, reason: 'unavailable' }); continue; }
      // Éligibilité pilotée par l'EXTRACTION : le bridge fournit un dossier
      // d'activité soit via extractMbz (mbz auto-porteur), soit synthétisé
      // (`kind:'h5p'` → moduleName 'h5pactivity', assemblé par buildH5pActivityFiles).
      // Une fois `extracted.moduleName` connu, seuls le module et les médias décident.
      // Les formats non embarquables (xml glossaire/quiz) tombent dans le `else`.
      const rec = ex[pid];
      const extracted = (rec && rec.extracted) ? rec.extracted : null;
      if (extracted && extracted.moduleName) {
        const mod = String(extracted.moduleName);
        const kind = String(extracted.kind || '');
        // Synthèses SPÉCIALES (pas de dossier verbatim, gardes dédiées) :
        //   • H5P (mod_h5pactivity) : octets + contenthash dans le pool ;
        //   • Test (mod_quiz) : modèle {bank_name, questions} → banque régénérée.
        if (kind === 'h5p') {
          if (!(extracted.h5pBytes && extracted.contenthash)) { excluded.push({ public_id: pid, title, reason: 'unavailable' }); continue; }
          eligibleItems.push({ public_id: pid, titre: title, content_format: 'mbz' });
          continue;
        }
        if (kind === 'quiz') {
          const qs = extracted.model && extracted.model.questions;
          if (!(Array.isArray(qs) && qs.length)) { excluded.push({ public_id: pid, title, reason: 'unavailable' }); continue; }
          eligibleItems.push({ public_id: pid, titre: title, content_format: 'mbz' });
          continue;
        }
        // Auto-porteur verbatim : module pris en charge + AUCUN média (le
        // sous-arbre `files/` n'est pas renuméroté). Test natif non converti par
        // le bridge (mod 'quiz' sans kind) → motif 'quiz'.
        if (!SELF_CONTAINED_MODULES.has(mod)) {
          excluded.push({ public_id: pid, title, reason: mod === 'quiz' ? 'quiz' : 'unsupported' });
          continue;
        }
        if (hasEmbeddedFiles(extracted.files)) { excluded.push({ public_id: pid, title, reason: 'media' }); continue; }
        eligibleItems.push({ public_id: pid, titre: title, content_format: 'mbz' });
      } else {
        // Aucun dossier d'activité (non téléchargé / non embarquable) → motif selon
        // le format d'origine : h5p, mbz introuvable (unavailable), ou xml non
        // embarquable (quiz .xml / autre → not_mbz).
        const fmt = String(it.content_format || '').toLowerCase();
        excluded.push({ public_id: pid, title, reason: fmt === 'h5p' ? 'h5p' : (fmt === 'mbz' ? 'unavailable' : 'not_mbz') });
      }
    }
    cleanStructure.push({ ...(sec || {}), items: keptRows });
  }

  // planCourse (déjà éprouvé) densifie les sections dans l'ordre du manifeste, à
  // partir de la structure DÉDUPLIQUÉE (pas le manifeste brut) et des seuls items
  // éligibles. On ignore son `excluded` (motifs déjà calculés ici, granularité
  // module/média).
  const { plan, sections } = planCourse({ ...(manifest || {}), structure: cleanStructure }, eligibleItems);
  const activities = plan.map(p => ({
    extracted: ex[p.public_id].extracted,
    title: p.title,
    sectionIndex: p.sectionIndex
  }));
  return { activities, sections, excluded, eligibleCount: eligibleItems.length };
}

// =========================================================================
// Pool de fichiers Moodle + activité H5P (mod_h5pactivity) — voie DIRECTE (PURE)
// =========================================================================
//
// Reverse-engineered d'un vrai backup de cours Éléa 4.5 (cf. mémoire
// phaseB-h5p-test-backup-specs). Le .h5p est embarqué dans le pool
// `files/<hash[0:2]>/<contenthash>` (contenthash = sha1 des octets, calculé EN
// AMONT par le bridge/oracle) et déclaré par 2 entrées `files.xml` (le fichier +
// un stub répertoire « . »). On génère la voie AUTONOME (source = nom de fichier,
// reference/repository = NULL) — jamais la voie « banque de contenu » (alias
// fragile cross-site, à l'origine du warning « liens externes »).

/** Un élément `<file>` de files.xml. Champs NULL → `$@NULL@$`. PURE. */
function buildFileElement(f) {
  const nz = v => (v === null || v === undefined) ? '$@NULL@$' : String(v);
  return `  <file id="${f.id}">
    <contenthash>${f.contenthash}</contenthash>
    <contextid>${f.contextid}</contextid>
    <component>${f.component}</component>
    <filearea>${f.filearea}</filearea>
    <itemid>${f.itemid}</itemid>
    <filepath>/</filepath>
    <filename>${escapeXml(f.filename)}</filename>
    <userid>${f.userid == null ? 0 : f.userid}</userid>
    <filesize>${f.filesize}</filesize>
    <mimetype>${nz(f.mimetype)}</mimetype>
    <status>0</status>
    <timecreated>${f.timecreated}</timecreated>
    <timemodified>${f.timemodified}</timemodified>
    <source>${f.source == null ? '$@NULL@$' : escapeXml(f.source)}</source>
    <author>${f.author == null || f.author === '' ? '$@NULL@$' : escapeXml(f.author)}</author>
    <license>${nz(f.license)}</license>
    <sortorder>0</sortorder>
    <repositorytype>$@NULL@$</repositorytype>
    <repositoryid>$@NULL@$</repositoryid>
    <reference>$@NULL@$</reference>
  </file>`;
}

/** files.xml racine à partir des entrées agrégées (vide si aucune). PURE. */
export function buildFilesXml(fileEntries) {
  const entries = Array.isArray(fileEntries) ? fileEntries : [];
  if (!entries.length) return `<?xml version="1.0" encoding="UTF-8"?>\n<files>\n</files>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<files>\n${entries.map(buildFileElement).join('\n')}\n</files>`;
}

/** roles.xml/calendar.xml/… vides du set standard, réutilisés pour le dossier H5P. */
const H5P_STANDARD_FILES = ['roles.xml', 'calendar.xml', 'filters.xml', 'grade_history.xml'];

/**
 * Synthétise le dossier `activities/h5pactivity_<mid>/` (voie directe) + le blob
 * `.h5p` dans le pool + les 2 entrées files.xml, à partir d'une activité H5P dont
 * les octets et le contenthash (sha1) ont été calculés EN AMONT par le bridge.
 * PURE : les IDs viennent du schéma haut (index de l'activité dans le parcours).
 *
 * @param {{kind:'h5p', h5pBytes:Uint8Array, contenthash:string, title?:string, filename?:string, author?:string}} extracted
 * @param {{index:number, sectionId:number, timestamp:number}} pos
 * @returns {{ files:Object, fileEntries:Array, moduleId:number, moduleName:'h5pactivity' }}
 */
export function buildH5pActivityFiles(extracted, { index, sectionId, timestamp }) {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const moduleId   = moduleIdFor(index);
  const activityId = activityIdFor(index);
  const contextId  = activityContextFor(index);
  const gradeItem  = gradeItemFor(index);
  const fileId1    = fileIdFor(index);
  const fileId2    = fileId1 + 1;
  const dir = `activities/h5pactivity_${moduleId}`;
  const sectionNumber = sectionId - sectionIdFor(0);

  const name = (extracted && String(extracted.title || '').trim()) || 'Activité H5P';
  const filename = (extracted && extracted.filename)
    || `${(name.replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80)) || 'activite'}.h5p`;
  const contenthash = extracted.contenthash;
  const bytes = extracted.h5pBytes;
  const filesize = bytes.length;
  const author = (extracted && extracted.author) || '';
  const poolPath = `files/${contenthash.slice(0, 2)}/${contenthash}`;

  const files = {
    [`${dir}/h5pactivity.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<activity id="${activityId}" moduleid="${moduleId}" modulename="h5pactivity" contextid="${contextId}">
  <h5pactivity id="${activityId}">
    <name>${escapeXml(name)}</name>
    <timecreated>${ts}</timecreated>
    <timemodified>${ts}</timemodified>
    <intro></intro>
    <introformat>1</introformat>
    <grade>100</grade>
    <displayoptions>15</displayoptions>
    <enabletracking>1</enabletracking>
    <grademethod>1</grademethod>
    <reviewmode>1</reviewmode>
    <attempts>
    </attempts>
  </h5pactivity>
</activity>`,
    [`${dir}/module.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<module id="${moduleId}" version="2024100700">
  <modulename>h5pactivity</modulename>
  <sectionid>${sectionId}</sectionid>
  <sectionnumber>${sectionNumber}</sectionnumber>
  <idnumber></idnumber>
  <added>${ts}</added>
  <score>0</score>
  <indent>0</indent>
  <visible>1</visible>
  <visibleoncoursepage>1</visibleoncoursepage>
  <visibleold>1</visibleold>
  <groupmode>1</groupmode>
  <groupingid>0</groupingid>
  <completion>2</completion>
  <completiongradeitemnumber>0</completiongradeitemnumber>
  <completionpassgrade>0</completionpassgrade>
  <completionview>0</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>0</showdescription>
  <downloadcontent>1</downloadcontent>
  <lang></lang>
  <tags>
  </tags>
</module>`,
    [`${dir}/inforef.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
  <fileref>
    <file>
      <id>${fileId1}</id>
    </file>
    <file>
      <id>${fileId2}</id>
    </file>
  </fileref>
  <grade_itemref>
    <grade_item>
      <id>${gradeItem}</id>
    </grade_item>
  </grade_itemref>
</inforef>`,
    [`${dir}/grades.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
    <grade_item id="${gradeItem}">
      <categoryid>${GRADE_CATEGORY_ID}</categoryid>
      <itemname>${escapeXml(name)}</itemname>
      <itemtype>mod</itemtype>
      <itemmodule>h5pactivity</itemmodule>
      <iteminstance>${activityId}</iteminstance>
      <itemnumber>0</itemnumber>
      <iteminfo>$@NULL@$</iteminfo>
      <idnumber>$@NULL@$</idnumber>
      <calculation>$@NULL@$</calculation>
      <gradetype>1</gradetype>
      <grademax>100.00000</grademax>
      <grademin>0.00000</grademin>
      <scaleid>$@NULL@$</scaleid>
      <outcomeid>$@NULL@$</outcomeid>
      <gradepass>0.00000</gradepass>
      <multfactor>1.00000</multfactor>
      <plusfactor>0.00000</plusfactor>
      <aggregationcoef>0.00000</aggregationcoef>
      <aggregationcoef2>0.00000</aggregationcoef2>
      <weightoverride>0</weightoverride>
      <sortorder>${2 + index}</sortorder>
      <display>0</display>
      <decimals>$@NULL@$</decimals>
      <hidden>0</hidden>
      <locked>0</locked>
      <locktime>0</locktime>
      <needsupdate>0</needsupdate>
      <timecreated>${ts}</timecreated>
      <timemodified>${ts}</timemodified>
      <grade_grades>
      </grade_grades>
    </grade_item>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`,
    [poolPath]: bytes,
  };
  for (const std of H5P_STANDARD_FILES) files[`${dir}/${std}`] = ACTIVITY_ENSURE[std];

  const fileEntries = [
    { id: fileId1, contenthash, contextid: contextId, component: 'mod_h5pactivity', filearea: 'package',
      itemid: 0, filename, userid: 0, filesize, mimetype: 'application/zip.h5p',
      timecreated: ts, timemodified: ts, source: filename, author, license: 'unknown' },
    { id: fileId2, contenthash: EMPTY_FILE_HASH, contextid: contextId, component: 'mod_h5pactivity', filearea: 'package',
      itemid: 0, filename: '.', userid: 0, filesize: 0, mimetype: null,
      timecreated: ts, timemodified: ts, source: null, author: null, license: null },
  ];

  return { files, fileEntries, moduleId, moduleName: 'h5pactivity' };
}

// =========================================================================
// Test (mod_quiz) — banque de questions au format BACKUP (PURE)
// =========================================================================
//
// Reverse-engineered d'un vrai Test exporté d'Éléa 4.5 (Test-mbz/…course-6449…,
// cf. mémoire phaseB-h5p-test-backup-specs). Le MODÈLE source vient toujours du
// format IMPORT `<quiz>` (PARSERS.quiz / parseStandaloneXml de mbz-parser) :
//   { bank_name, bank_description, questions:[{ type, content }] }
//   type ∈ multichoice | matching | truefalse | numerical | shortanswer | cloze
// On RÉGÉNÈRE le format BACKUP restaurable (≠ import) : `questions.xml` racine en
// `<question_categories>` → question_bank_entry → question_version → question,
// un bloc `plugin_qtype_*` par type ; `quiz.xml` câble les slots via
// `<questionbankentryid>` (PAS l'id de question). Le format IMPORT stocke la
// fraction sur 0-100 (attribut) ; le BACKUP sur 0-1 (élément 7 décimales) → on
// DIVISE par 100. Les cohérences internes (slot↔qbe, sequence↔enfants,
// trueanswer↔answer…) sont garanties par construction ; les IDs sont remappés au
// restore. `questionbank=1` (moodle_backup.xml) est déjà posé.

const QUIZ_OWNER_ID = 2;                              // ownerid/createdby (remappé au restore)
const QUIZ_PENALTY  = '0.3333333';                   // pénalité standard des questions top-level

/** Échappe le TEXTE d'un élément XML : uniquement `& < >` (byte-fidèle à la réf,
 *  qui laisse `'"` littéraux). Le HTML interne devient donc `&lt;p&gt;…`. PURE. */
export function escXmlText(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c]));
}

/** Enveloppe en `<p>…</p>` si absent (miroir de mbz-parser.wrapP). PURE. */
function wrapPq(text) {
  const s = String(text || '');
  if (!s) return '';
  return /^\s*<p[\s>]/i.test(s) ? s : `<p>${s}</p>`;
}

/** Champ HTML (questiontext, feedbacks, answertext QCM…) : wrapP puis échappe. */
const htmlField  = (s) => escXmlText(wrapPq(s));
/** Champ TEXTE brut (answertext V/F/numérique/courte, questiontext cloze). */
const plainField = (s) => escXmlText(s);
/** Fraction backup : 7 décimales sur l'échelle 0-1. */
const frac7 = (x) => Number(x || 0).toFixed(7);
/** stamp Moodle déterministe (unicité, non structurel). */
const quizStamp = (hostname, ts, seq) => `${hostname}+${ts}+${String(seq).padStart(6, '0')}`;

// Sous-types cloze Moodle 4.5 : noms LONGS + abréviations officielles. L'éditeur
// Sucrerie n'émet que les noms longs (cloze-editor.js), mais un Test IMPORTÉ d'un
// autre Moodle peut employer les abréviations — non reconnues = trou perdu →
// multianswer cassé au restore. On les capture toutes (triées longueur ↓ pour
// éviter qu'une abréviation courte ne mange un préfixe). Familles : cf. clozeFamily.
const CLOZE_TYPE_TOKENS = [
  'SHORTANSWER_C', 'SHORTANSWER', 'MULTICHOICE_VS', 'MULTICHOICE_HS', 'MULTICHOICE_V',
  'MULTICHOICE_H', 'MULTICHOICE_S', 'MULTICHOICE', 'MULTIRESPONSE_HS', 'MULTIRESPONSE_H',
  'MULTIRESPONSE_S', 'MULTIRESPONSE', 'NUMERICAL',
  'MCVS', 'MCHS', 'MRHS', 'MRVS', 'MCV', 'MCH', 'MCS', 'MRH', 'MRS', 'MWC', 'SAC',
  'MC', 'MR', 'MW', 'SA', 'NM',
].sort((a, b) => b.length - a.length);
const CLOZE_RE = new RegExp('\\{(\\d*):(' + CLOZE_TYPE_TOKENS.join('|') + '):((?:\\\\[\\s\\S]|[^}\\\\])+)\\}', 'g');

/** Sous-type cloze → famille de plugin. `single:false` = multiréponse (MR*). PURE. */
function clozeFamily(type) {
  const u = String(type).toUpperCase();
  if (u.startsWith('NUMERICAL') || u === 'NM') return { kind: 'numerical' };
  if (u.startsWith('MULTIRESPONSE') || u.startsWith('MR')) return { kind: 'multichoice', single: false };
  if (u.startsWith('MULTICHOICE') || u.startsWith('MC')) return { kind: 'multichoice', single: true };
  return { kind: 'shortanswer' }; // SHORTANSWER, SA, SAC, SHORTANSWER_C, MW, MWC
}

/**
 * Découpe un texte cloze en texte parent (marqueurs `{#N}`) + trous. Miroir PUR
 * de cloze-editor.parseClozeText (sans DOM) : le parent stocke `{#1}…{#N}` là où
 * étaient les `{poids:TYPE:…}`, comme un vrai backup multianswer. PURE.
 * @returns {{ parentText:string, gaps:Array<{raw,weight,type,content}> }}
 */
export function parseClozeGaps(text) {
  const src = String(text || '');
  const gaps = [];
  let parentText = '', last = 0, m, n = 0;
  const re = new RegExp(CLOZE_RE.source, 'g');
  while ((m = re.exec(src)) !== null) {
    parentText += src.slice(last, m.index) + `{#${++n}}`;
    gaps.push({ raw: m[0], weight: m[1] || '1', type: m[2], content: m[3] });
    last = m.index + m[0].length;
  }
  parentText += src.slice(last);
  return { parentText, gaps };
}

/**
 * Réponses d'un trou cloze → {text, fraction (0-1), feedback}. Sémantique Moodle
 * STANDARD (≠ quirk éditeur) : `=x`→1, `%N%x`→N/100, nu→0 ; `#fb` = feedback
 * GIFT optionnel. NUMERICAL : `=valeur:tolérance`. PURE.
 */
export function parseGapAnswers(gap) {
  const fam = clozeFamily(gap.type);
  let specificFractions = false;
  // Moodle garde les ~ échappés dans une réponse et ignore le # d'une entité HTML.
  const unquote = text => text.replace(/\\([}#])/g, '$1');
  const answers = String(gap.content).split(/(?<!\\)~/).map(token => {
    let value = token, fraction = 0;
    if (value.startsWith('=')) { fraction = 1; value = value.slice(1); }
    else {
      const m = value.match(/^%(-?\d+(?:[.,]\d+)?)%/);
      if (m) { fraction = Number(m[1].replace(',', '.')) / 100; specificFractions ||= fraction !== 0; value = value.slice(m[0].length); }
    }
    const h = value.search(/(?<!\\|&|&amp;)#/);
    const feedback = h < 0 ? '' : unquote(value.slice(h + 1));
    const text = unquote(h < 0 ? value : value.slice(0, h));
    if (fam.kind === 'numerical') {
      const [number, tolerance = '0'] = text.split(':');
      return { number: number.trim().replace(',', '.'), tolerance: tolerance.trim().replace(',', '.'), fraction, feedback };
    }
    return { text, fraction, feedback };
  });
  if (fam.kind === 'numerical') return { kind: 'numerical', answers };
  if (fam.single === false) {
    const positive = answers.reduce((sum, a) => sum + Math.max(0, a.fraction), 0);
    if (positive) answers.forEach(a => {
      if (a.fraction > 0) a.fraction /= positive;
      else if (!specificFractions) a.fraction = -1 / positive;
    });
  }
  const horizontal = /^(?:MULTICHOICE_HS?|MULTIRESPONSE_HS?|MCHS?|MRHS?)$/.test(gap.type);
  const vertical = fam.single === false || /^(MULTICHOICE_VS?|MCVS?)$/.test(gap.type);
  return { kind: fam.kind, single: fam.single, usecase: /^(SHORTANSWER_C|SAC|MWC)$/.test(gap.type),
    layout: horizontal ? 2 : vertical ? 1 : 0, shuffleanswers: gap.type.endsWith('S'), answers };
}

// --- Blocs plugin_qtype_* (indentation ALIGNÉE sur la réf) ----------------
//   `alloc()` = compteur d'IDs local au quiz. Chaque builder renvoie le bloc XML
//   `<plugin_qtype_*_question>` (base 16 espaces). Les réponses portent une
//   fraction DÉJÀ sur 0-1.

function answerXml(id, text, fraction, feedback, format /* 0 plain | 1 html */) {
  const at = format === 1 ? htmlField(text) : plainField(text);
  return `                    <answer id="${id}">
                      <answertext>${at}</answertext>
                      <answerformat>${format}</answerformat>
                      <fraction>${frac7(fraction)}</fraction>
                      <feedback>${htmlField(feedback)}</feedback>
                      <feedbackformat>1</feedbackformat>
                    </answer>`;
}

function multichoicePlugin(c, alloc, answers /* {text,fraction0to1,feedback} */) {
  const single = [false, 0, 'false', '0'].includes(c.single) ? '0' : '1';
  const ansXml = answers.map(a => answerXml(alloc(), a.text, a.fraction, a.feedback, 1)).join('\n');
  return `                <plugin_qtype_multichoice_question>
                  <answers>
${ansXml}
                  </answers>
                  <multichoice id="${alloc()}">
                    <layout>${[0, 1, 2].includes(Number(c.layout)) ? Number(c.layout) : 0}</layout>
                    <single>${single}</single>
                    <shuffleanswers>${[false, 0, 'false', '0'].includes(c.shuffleanswers) ? 0 : 1}</shuffleanswers>
                    <correctfeedback>${htmlField(c.correctfeedback)}</correctfeedback>
                    <correctfeedbackformat>1</correctfeedbackformat>
                    <partiallycorrectfeedback>${htmlField(c.partiallycorrectfeedback)}</partiallycorrectfeedback>
                    <partiallycorrectfeedbackformat>1</partiallycorrectfeedbackformat>
                    <incorrectfeedback>${htmlField(c.incorrectfeedback)}</incorrectfeedback>
                    <incorrectfeedbackformat>1</incorrectfeedbackformat>
                    <answernumbering>${escXmlText(c.answernumbering || 'none')}</answernumbering>
                    <shownumcorrect>1</shownumcorrect>
                    <showstandardinstruction>${[false, 0, 'false', '0'].includes(c.showstandardinstruction) ? 0 : 1}</showstandardinstruction>
                  </multichoice>
                </plugin_qtype_multichoice_question>`;
}

function matchPlugin(c, alloc) {
  const matchesXml = (c.subquestions || []).map(sq => `                    <match id="${alloc()}">
                      <questiontext>${htmlField(sq.text)}</questiontext>
                      <questiontextformat>1</questiontextformat>
                      <answertext>${plainField(sq.answer)}</answertext>
                    </match>`).join('\n');
  return `                <plugin_qtype_match_question>
                  <matchoptions id="${alloc()}">
                    <shuffleanswers>${[false, 0, 'false', '0'].includes(c.shuffleanswers) ? 0 : 1}</shuffleanswers>
                    <correctfeedback>${htmlField(c.correctfeedback)}</correctfeedback>
                    <correctfeedbackformat>1</correctfeedbackformat>
                    <partiallycorrectfeedback>${htmlField(c.partiallycorrectfeedback)}</partiallycorrectfeedback>
                    <partiallycorrectfeedbackformat>1</partiallycorrectfeedbackformat>
                    <incorrectfeedback>${htmlField(c.incorrectfeedback)}</incorrectfeedback>
                    <incorrectfeedbackformat>1</incorrectfeedbackformat>
                    <shownumcorrect>1</shownumcorrect>
                  </matchoptions>
                  <matches>
${matchesXml}
                  </matches>
                </plugin_qtype_match_question>`;
}

function truefalsePlugin(c, alloc) {
  const a = c.answer || {};
  const idTrue = alloc(), idFalse = alloc();
  return `                <plugin_qtype_truefalse_question>
                  <answers>
                    <answer id="${idTrue}">
                      <answertext>Vrai</answertext>
                      <answerformat>0</answerformat>
                      <fraction>${frac7(a.value ? 1 : 0)}</fraction>
                      <feedback>${htmlField(a.feedback_true)}</feedback>
                      <feedbackformat>1</feedbackformat>
                    </answer>
                    <answer id="${idFalse}">
                      <answertext>Faux</answertext>
                      <answerformat>0</answerformat>
                      <fraction>${frac7(a.value ? 0 : 1)}</fraction>
                      <feedback>${htmlField(a.feedback_false)}</feedback>
                      <feedbackformat>1</feedbackformat>
                    </answer>
                  </answers>
                  <truefalse id="${alloc()}">
                    <trueanswer>${idTrue}</trueanswer>
                    <falseanswer>${idFalse}</falseanswer>
                    <showstandardinstruction>0</showstandardinstruction>
                  </truefalse>
                </plugin_qtype_truefalse_question>`;
}

function numericalPlugin(number, tolerance, feedback, alloc, alternatives) {
  const answers = (alternatives || [{ number, tolerance, feedback, fraction: 1 }]).map(a => ({ ...a, id: alloc() }));
  return `                <plugin_qtype_numerical_question>
                  <answers>
${answers.map(a => answerXml(a.id, a.number, a.fraction ?? 1, a.feedback, 0)).join('\n')}
                  </answers>
                  <numerical_units>
                  </numerical_units>
                  <numerical_options>
                    <numerical_option id="${alloc()}">
                      <showunits>3</showunits>
                      <unitsleft>0</unitsleft>
                      <unitgradingtype>0</unitgradingtype>
                      <unitpenalty>0.1000000</unitpenalty>
                    </numerical_option>
                  </numerical_options>
                  <numerical_records>
${answers.map(a => `                    <numerical_record id="${alloc()}">
                      <answer>${a.id}</answer>
                      <tolerance>${plainField(a.tolerance)}</tolerance>
                    </numerical_record>`).join('\n')}
                  </numerical_records>
                </plugin_qtype_numerical_question>`;
}

function shortanswerPlugin(answers /* {text,fraction0to1,feedback} */, usecase, alloc) {
  const ansXml = answers.map(a => answerXml(alloc(), a.text, a.fraction, a.feedback, 0)).join('\n');
  return `                <plugin_qtype_shortanswer_question>
                  <answers>
${ansXml}
                  </answers>
                  <shortanswer id="${alloc()}">
                    <usecase>${[true, 1, '1', 'true'].includes(usecase) ? 1 : 0}</usecase>
                  </shortanswer>
                </plugin_qtype_shortanswer_question>`;
}

/** `<question_hints>` (0 = qtype support shownumcorrect/clearwrong → 0, sinon NULL). */
function hintsXml(hints, hasOpts, alloc) {
  const list = Array.isArray(hints) ? hints.filter(h => h != null && String(h).length) : [];
  if (!list.length) return `                <question_hints>
                </question_hints>`;
  const nz = hasOpts ? '0' : '$@NULL@$';
  const body = list.map(h => `                  <question_hint id="${alloc()}">
                    <hint>${htmlField(typeof h === 'string' ? h : (h && h._value) || '')}</hint>
                    <hintformat>1</hintformat>
                    <shownumcorrect>${nz}</shownumcorrect>
                    <clearwrong>${nz}</clearwrong>
                    <options>$@NULL@$</options>
                  </question_hint>`).join('\n');
  return `                <question_hints>
${body}
                </question_hints>`;
}

/**
 * Enveloppe `<question_bank_entry>` (base 6 espaces) autour d'une question déjà
 * rendue en `<plugin_qtype_*>`. PURE.
 */
function questionBankEntry({ qbeId, versionId, questionId, parentId, bankCatId, name, questiontext,
  generalfeedback, defaultmark, penalty, qtype, stamp, ts, pluginXml, hints }) {
  return `      <question_bank_entry id="${qbeId}">
        <questioncategoryid>${bankCatId}</questioncategoryid>
        <idnumber>$@NULL@$</idnumber>
        <ownerid>${QUIZ_OWNER_ID}</ownerid>
        <question_version>
          <question_versions id="${versionId}">
            <version>1</version>
            <status>ready</status>
            <questions>
              <question id="${questionId}">
                <parent>${parentId}</parent>
                <name>${escXmlText(name)}</name>
                <questiontext>${questiontext}</questiontext>
                <questiontextformat>1</questiontextformat>
                <generalfeedback>${generalfeedback}</generalfeedback>
                <generalfeedbackformat>1</generalfeedbackformat>
                <defaultmark>${frac7(defaultmark)}</defaultmark>
                <penalty>${penalty}</penalty>
                <qtype>${qtype}</qtype>
                <length>1</length>
                <stamp>${stamp}</stamp>
                <timecreated>${ts}</timecreated>
                <timemodified>${ts}</timemodified>
                <createdby>${QUIZ_OWNER_ID}</createdby>
                <modifiedby>${QUIZ_OWNER_ID}</modifiedby>
${pluginXml}
                <plugin_qbank_comment_question>
                  <comments>
                  </comments>
                </plugin_qbank_comment_question>
                <plugin_qbank_customfields_question>
                  <customfields>
                  </customfields>
                </plugin_qbank_customfields_question>
${hints}
                <tags>
                </tags>
              </question>
            </questions>
          </question_versions>
        </question_version>
      </question_bank_entry>`;
}

/** Bloc plugin d'un ENFANT cloze selon son sous-type (fractions déjà 0-1). */
function clozeChildPlugin(parsed, alloc) {
  if (parsed.kind === 'numerical') return numericalPlugin(parsed.answers[0]?.number, parsed.answers[0]?.tolerance, parsed.answers[0]?.feedback, alloc, parsed.answers);
  if (parsed.kind === 'multichoice') {
    return multichoicePlugin({ single: parsed.single, layout: parsed.layout, shuffleanswers: parsed.shuffleanswers, showstandardinstruction: 0 }, alloc,
      parsed.answers.map(a => ({ text: a.text, fraction: a.fraction, feedback: a.feedback })));
  }
  return shortanswerPlugin(parsed.answers.map(a => ({ text: a.text, fraction: a.fraction, feedback: a.feedback })), parsed.usecase, alloc);
}

/**
 * Transforme UNE question du modèle en 1..N `question_bank_entry` + l'info de
 * slot. Cloze → parent multianswer (answers vide, sequence=enfants) + N enfants
 * NON slottés (parent=idParent). PURE.
 * @returns {{ entries:string[], slot:{ qbeId:number, maxmark:number } }}
 */
export function buildQuestionEntries(modelQ, { alloc, bankCatId, ts, hostname = IDENTITE_DEFAUT.quizHostname, options = {} }) {
  const type = String(modelQ.type || '');
  const c = { ...(modelQ.content || {}), ...options };
  const name = c.name || '';

  // Cloze (multianswer) : parent + enfants -----------------------------------
  if (type === 'cloze') {
    const { parentText, gaps } = parseClozeGaps(c.questiontext);
    const parentQbe = alloc(), parentVer = alloc(), parentQid = alloc();
    const childIds = [], childEntries = [];
    // defaultmark d'un multianswer = SOMME des poids GIFT des trous (Moodle 4.5 lit
    // ces valeurs verbatim au restore, sans re-parser le questiontext) ; chaque
    // enfant porte SON poids. Cas éditeur/réf = tous poids 1 → somme == nb de trous.
    let totalWeight = 0;
    for (const gap of gaps) {
      const parsed = parseGapAnswers(gap);
      const weight = parseInt(gap.weight, 10) || 1;
      totalWeight += weight;
      const cQbe = alloc(), cVer = alloc(), cQid = alloc();
      childIds.push(cQid);
      const plugin = clozeChildPlugin(parsed, alloc);
      const childQtype = parsed.kind === 'numerical' ? 'numerical'
        : parsed.kind === 'multichoice' ? 'multichoice' : 'shortanswer';
      childEntries.push(questionBankEntry({
        qbeId: cQbe, versionId: cVer, questionId: cQid, parentId: parentQid, bankCatId,
        name, questiontext: plainField(gap.raw), generalfeedback: '', defaultmark: weight, penalty: '0.0000000',
        qtype: childQtype, stamp: quizStamp(hostname, ts, cQbe), ts, pluginXml: plugin,
        hints: hintsXml([], false, alloc),
      }));
    }
    const parentMark = totalWeight || 1;
    const parentPlugin = `                <plugin_qtype_multianswer_question>
                  <answers>
                  </answers>
                  <multianswer id="${alloc()}">
                    <question>${parentQid}</question>
                    <sequence>${childIds.join(',')}</sequence>
                  </multianswer>
                </plugin_qtype_multianswer_question>`;
    const parentEntry = questionBankEntry({
      qbeId: parentQbe, versionId: parentVer, questionId: parentQid, parentId: 0, bankCatId,
      name, questiontext: plainField(parentText), generalfeedback: htmlField(c.feedback),
      defaultmark: parentMark, penalty: QUIZ_PENALTY, qtype: 'multianswer',
      stamp: quizStamp(hostname, ts, parentQbe), ts, pluginXml: parentPlugin,
      hints: hintsXml(c.hints, false, alloc),
    });
    return { entries: [parentEntry, ...childEntries], slot: { qbeId: parentQbe, maxmark: parentMark } };
  }

  // Types simples ------------------------------------------------------------
  const qbeId = alloc(), versionId = alloc(), questionId = alloc();
  let pluginXml, qtype, hasOpts = false;
  if (type === 'multichoice') {
    qtype = 'multichoice'; hasOpts = true;
    pluginXml = multichoicePlugin(c, alloc,
      (c.answers || []).map(a => ({ text: a.text, fraction: (a.fraction || 0) / 100, feedback: a.feedback })));
  } else if (type === 'matching') {
    qtype = 'match'; hasOpts = true;
    pluginXml = matchPlugin(c, alloc);
  } else if (type === 'truefalse') {
    qtype = 'truefalse';
    pluginXml = truefalsePlugin(c, alloc);
  } else if (type === 'numerical') {
    qtype = 'numerical';
    const a = c.answer || {};
    pluginXml = numericalPlugin(a.number, a.tolerance, a.feedback, alloc,
      [a, ...(c.alternatives || [])].map(answer => ({...answer, fraction: Number(answer.fraction ?? 100) / 100})));
  } else if (type === 'shortanswer') {
    qtype = 'shortanswer';
    pluginXml = shortanswerPlugin(
      (c.answers || []).map(a => ({ text: a.text, fraction: (a.fraction || 0) / 100, feedback: a.feedback })),
      c.usecase, alloc);
  } else {
    throw new Error(`test_unsupported_question_type:${type}`);
  }
  const entry = questionBankEntry({
    qbeId, versionId, questionId, parentId: 0, bankCatId, name,
    questiontext: htmlField(c.questiontext), generalfeedback: htmlField(c.feedback),
    defaultmark: c.defaultgrade ?? 1, penalty: c.penalty ?? QUIZ_PENALTY, qtype, stamp: quizStamp(hostname, ts, qbeId), ts,
    pluginXml, hints: hintsXml(c.hints, hasOpts, alloc),
  });
  return { entries: [entry], slot: { qbeId, maxmark: Number(c.defaultgrade ?? 1) } };
}

/** Une `<question_category>` (base 2 espaces). `entries` = XML des qbe (ou ''). */
function questionCategoryXml({ id, name, contextid, contextlevel, contextinstanceid, info, stamp, parent, sortorder, entries }) {
  const body = entries && entries.length
    ? `\n${entries}\n    `
    : `\n    `;
  return `  <question_category id="${id}">
    <name>${escXmlText(name)}</name>
    <contextid>${contextid}</contextid>
    <contextlevel>${contextlevel}</contextlevel>
    <contextinstanceid>${contextinstanceid}</contextinstanceid>
    <info>${escXmlText(info)}</info>
    <infoformat>0</infoformat>
    <stamp>${stamp}</stamp>
    <parent>${parent}</parent>
    <sortorder>${sortorder}</sortorder>
    <idnumber>$@NULL@$</idnumber>
    <question_bank_entries>${body}</question_bank_entries>
  </question_category>`;
}

/** Les 2 catégories de CONTEXTE COURS partagées (top + Défaut). PURE. */
export function buildSharedCourseCategoriesXml(courseShortname, ts, hostname = IDENTITE_DEFAUT.quizHostname) {
  const top = questionCategoryXml({
    id: COURSE_QCAT_TOP_ID, name: 'top', contextid: COURSE_CONTEXT_ID, contextlevel: 50,
    contextinstanceid: COURSE_ID, info: '', stamp: quizStamp(hostname, ts, COURSE_QCAT_TOP_ID), parent: 0, sortorder: 0, entries: '',
  });
  const def = questionCategoryXml({
    id: COURSE_QCAT_DEFAULT_ID, name: `Défaut pour ${courseShortname}`, contextid: COURSE_CONTEXT_ID, contextlevel: 50,
    contextinstanceid: COURSE_ID,
    info: `La catégorie par défaut pour les questions partagées dans le contexte « ${courseShortname} ».`,
    stamp: quizStamp(hostname, ts, COURSE_QCAT_DEFAULT_ID), parent: COURSE_QCAT_TOP_ID, sortorder: 999, entries: '',
  });
  return [top, def];
}

/** `questions.xml` racine complet (catégories partagées + celles des quiz). PURE. */
export function buildQuestionsBackupXml(courseShortname, quizCategoryBlocks, ts, hostname = IDENTITE_DEFAUT.quizHostname) {
  const shared = buildSharedCourseCategoriesXml(courseShortname, ts, hostname);
  const all = [...shared, ...quizCategoryBlocks];
  if (!all.length) return `<?xml version="1.0" encoding="UTF-8"?>\n<question_categories>\n</question_categories>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<question_categories>\n${all.join('\n')}\n</question_categories>`;
}

/**
 * Synthétise le dossier `activities/quiz_<mid>/` (config + wiring) + les 3
 * catégories de ce Test (banque + top/Défaut module), à agréger dans le
 * `questions.xml` racine. Le MODÈLE `extracted.model` = sortie PARSERS.quiz /
 * parseStandaloneXml. PURE.
 *
 * @param {{kind:'quiz', model:{bank_name?,bank_description?,questions:Array}, title?:string}} extracted
 * @param {{index:number, sectionId:number, timestamp:number}} pos
 * @returns {{ files:Object, questionCategories:string[], moduleId:number, moduleName:'quiz' }}
 */
export function buildQuizActivityFiles(extracted, { index, sectionId, timestamp, identite }) {
  const hostname = resoudreIdentite(identite).quizHostname;
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const moduleId   = moduleIdFor(index);
  const activityId = activityIdFor(index);
  const contextId  = activityContextFor(index);
  const gradeItem  = gradeItemFor(index);
  const dir = `activities/quiz_${moduleId}`;
  const sectionNumber = sectionId - sectionIdFor(0);

  const model = (extracted && extracted.model) || {};
  const title = (extracted && String(extracted.title || '').trim())
    || String(model.bank_name || '').trim() || 'Test';
  const bankName = String(model.bank_name || title).trim() || title;
  const bankDescription = String(model.bank_description || '');
  const questions = Array.isArray(model.questions) ? model.questions : [];

  // Allocateur d'IDs local au quiz (plage haute disjointe ; garde-fou stride).
  const base = quizIdBaseFor(index);
  let seq = base;
  const alloc = () => {
    const id = seq++;
    if (seq - base >= QUIZ_ID_STRIDE) throw new Error(`quiz_id_overflow:${index}`);
    return id;
  };

  // Catégories : bank (contexte cours) + top/Défaut (contexte module).
  const bankCatId       = alloc();
  const moduleTopCatId  = alloc();
  const moduleDefCatId  = alloc();

  // Génération des questions → qbe + slots (enfants cloze non slottés).
  const qbeBlocks = [];
  const slots = [];
  for (const q of questions) {
    const { entries, slot } = buildQuestionEntries(q, { alloc, bankCatId, ts, hostname, options: model.options });
    qbeBlocks.push(...entries);
    if (slot) slots.push(slot);
  }

  const bankCat = questionCategoryXml({
    id: bankCatId, name: bankName, contextid: COURSE_CONTEXT_ID, contextlevel: 50,
    contextinstanceid: COURSE_ID, info: bankDescription, stamp: quizStamp(hostname, ts, bankCatId),
    parent: COURSE_QCAT_TOP_ID, sortorder: 999, entries: qbeBlocks.join('\n'),
  });
  const moduleTopCat = questionCategoryXml({
    id: moduleTopCatId, name: 'top', contextid: contextId, contextlevel: 70,
    contextinstanceid: moduleId, info: '', stamp: quizStamp(hostname, ts, moduleTopCatId), parent: 0, sortorder: 0, entries: '',
  });
  const moduleDefCat = questionCategoryXml({
    id: moduleDefCatId, name: `Défaut pour ${title}`, contextid: contextId, contextlevel: 70,
    contextinstanceid: moduleId,
    info: `La catégorie par défaut pour les questions partagées dans le contexte « ${title} ».`,
    stamp: quizStamp(hostname, ts, moduleDefCatId), parent: moduleTopCatId, sortorder: 999, entries: '',
  });

  // quiz.xml : wiring des slots (slot → questionbankentryid).
  const sumgrades = slots.reduce((s, sl) => s + sl.maxmark, 0);
  const instancesXml = slots.map((sl, i) => `      <question_instance id="${alloc()}">
        <quizid>${activityId}</quizid>
        <slot>${i + 1}</slot>
        <page>1</page>
        <displaynumber>$@NULL@$</displaynumber>
        <requireprevious>0</requireprevious>
        <maxmark>${frac7(sl.maxmark)}</maxmark>
        <quizgradeitemid>$@NULL@$</quizgradeitemid>
        <question_reference id="${alloc()}">
          <usingcontextid>${contextId}</usingcontextid>
          <component>mod_quiz</component>
          <questionarea>slot</questionarea>
          <questionbankentryid>${sl.qbeId}</questionbankentryid>
          <version>$@NULL@$</version>
        </question_reference>
      </question_instance>`).join('\n');

  const quizXml = `<?xml version="1.0" encoding="UTF-8"?>
<activity id="${activityId}" moduleid="${moduleId}" modulename="quiz" contextid="${contextId}">
  <quiz id="${activityId}">
    <name>${escXmlText(title)}</name>
    <intro></intro>
    <introformat>1</introformat>
    <timeopen>0</timeopen>
    <timeclose>0</timeclose>
    <timelimit>0</timelimit>
    <overduehandling>autosubmit</overduehandling>
    <graceperiod>0</graceperiod>
    <preferredbehaviour>deferredfeedback</preferredbehaviour>
    <canredoquestions>0</canredoquestions>
    <attempts_number>0</attempts_number>
    <attemptonlast>0</attemptonlast>
    <grademethod>1</grademethod>
    <decimalpoints>2</decimalpoints>
    <questiondecimalpoints>-1</questiondecimalpoints>
    <reviewattempt>69888</reviewattempt>
    <reviewcorrectness>4352</reviewcorrectness>
    <reviewmaxmarks>69888</reviewmaxmarks>
    <reviewmarks>4352</reviewmarks>
    <reviewspecificfeedback>4352</reviewspecificfeedback>
    <reviewgeneralfeedback>4352</reviewgeneralfeedback>
    <reviewrightanswer>4352</reviewrightanswer>
    <reviewoverallfeedback>4352</reviewoverallfeedback>
    <questionsperpage>1</questionsperpage>
    <navmethod>free</navmethod>
    <shuffleanswers>1</shuffleanswers>
    <sumgrades>${sumgrades.toFixed(5)}</sumgrades>
    <grade>10.00000</grade>
    <timecreated>${ts}</timecreated>
    <timemodified>${ts}</timemodified>
    <password></password>
    <subnet></subnet>
    <browsersecurity>-</browsersecurity>
    <delay1>0</delay1>
    <delay2>0</delay2>
    <showuserpicture>0</showuserpicture>
    <showblocks>0</showblocks>
    <completionattemptsexhausted>0</completionattemptsexhausted>
    <completionminattempts>0</completionminattempts>
    <allowofflineattempts>0</allowofflineattempts>
    <subplugin_quizaccess_seb_quiz>
    </subplugin_quizaccess_seb_quiz>
    <quiz_grade_items>
    </quiz_grade_items>
    <question_instances>
${instancesXml}
    </question_instances>
    <sections>
      <section id="${alloc()}">
        <firstslot>1</firstslot>
        <heading></heading>
        <shufflequestions>0</shufflequestions>
      </section>
    </sections>
    <feedbacks>
      <feedback id="${alloc()}">
        <feedbacktext></feedbacktext>
        <feedbacktextformat>1</feedbacktextformat>
        <mingrade>0.00000</mingrade>
        <maxgrade>11.00000</maxgrade>
      </feedback>
    </feedbacks>
    <overrides>
    </overrides>
    <grades>
    </grades>
    <attempts>
    </attempts>
  </quiz>
</activity>`;

  const files = {
    [`${dir}/quiz.xml`]: quizXml,
    [`${dir}/module.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<module id="${moduleId}" version="2024100700">
  <modulename>quiz</modulename>
  <sectionid>${sectionId}</sectionid>
  <sectionnumber>${sectionNumber}</sectionnumber>
  <idnumber></idnumber>
  <added>${ts}</added>
  <score>0</score>
  <indent>0</indent>
  <visible>1</visible>
  <visibleoncoursepage>1</visibleoncoursepage>
  <visibleold>1</visibleold>
  <groupmode>1</groupmode>
  <groupingid>0</groupingid>
  <completion>2</completion>
  <completiongradeitemnumber>0</completiongradeitemnumber>
  <completionpassgrade>0</completionpassgrade>
  <completionview>0</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>0</showdescription>
  <downloadcontent>1</downloadcontent>
  <lang></lang>
  <tags>
  </tags>
</module>`,
    [`${dir}/inforef.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
  <grade_itemref>
    <grade_item>
      <id>${gradeItem}</id>
    </grade_item>
  </grade_itemref>
  <question_categoryref>
    <question_category>
      <id>${COURSE_QCAT_TOP_ID}</id>
    </question_category>
    <question_category>
      <id>${COURSE_QCAT_DEFAULT_ID}</id>
    </question_category>
    <question_category>
      <id>${bankCatId}</id>
    </question_category>
    <question_category>
      <id>${moduleTopCatId}</id>
    </question_category>
    <question_category>
      <id>${moduleDefCatId}</id>
    </question_category>
  </question_categoryref>
</inforef>`,
    [`${dir}/grades.xml`]: `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
    <grade_item id="${gradeItem}">
      <categoryid>${GRADE_CATEGORY_ID}</categoryid>
      <itemname>${escXmlText(title)}</itemname>
      <itemtype>mod</itemtype>
      <itemmodule>quiz</itemmodule>
      <iteminstance>${activityId}</iteminstance>
      <itemnumber>0</itemnumber>
      <iteminfo>$@NULL@$</iteminfo>
      <idnumber></idnumber>
      <calculation>$@NULL@$</calculation>
      <gradetype>1</gradetype>
      <grademax>10.00000</grademax>
      <grademin>0.00000</grademin>
      <scaleid>$@NULL@$</scaleid>
      <outcomeid>$@NULL@$</outcomeid>
      <gradepass>0.00000</gradepass>
      <multfactor>1.00000</multfactor>
      <plusfactor>0.00000</plusfactor>
      <aggregationcoef>0.00000</aggregationcoef>
      <aggregationcoef2>0.04762</aggregationcoef2>
      <weightoverride>0</weightoverride>
      <sortorder>${2 + index}</sortorder>
      <display>0</display>
      <decimals>$@NULL@$</decimals>
      <hidden>0</hidden>
      <locked>0</locked>
      <locktime>0</locktime>
      <needsupdate>0</needsupdate>
      <timecreated>${ts}</timecreated>
      <timemodified>${ts}</timemodified>
      <grade_grades>
      </grade_grades>
    </grade_item>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`,
  };
  for (const std of H5P_STANDARD_FILES) files[`${dir}/${std}`] = ACTIVITY_ENSURE[std];

  return { files, questionCategories: [bankCat, moduleTopCat, moduleDefCat], moduleId, moduleName: 'quiz' };
}

// =========================================================================
// Assemblage complet des fichiers du cours (PURE)
// =========================================================================

/**
 * Assemble la map complète des fichiers du .mbz cours à partir des activités
 * DÉJÀ extraites + renumérotées et de la carte des sections. PURE.
 *
 * @param {Object} p
 * @param {string} p.courseTitle
 * @param {number} p.timestamp
 * @param {Array<{extracted:Object, title:string, sectionIndex:number}>} p.activities
 *        extracted = sortie de extractMbz ({files, moduleName, activityDir})
 * @param {Array<{index:number, name:string}>} p.sections
 * @param {Object} [p.identite] - Identité de l'hôte (cf. `IDENTITE_DEFAUT`).
 * @returns {{ files: Object<string,string|Uint8Array>, activities: Array, sectionsUsed: Array }}
 */
export function assembleCourseFiles({ courseTitle, timestamp, activities, sections, identite }) {
  const hote = resoudreIdentite(identite);
  const files = {};
  const title = String(courseTitle || 'Parcours').trim() || 'Parcours';
  const shortname = title.slice(0, 60);
  const backupName = `${title}.mbz`;

  // 1. Renumérotation + agrégation des dossiers d'activité, dans l'ordre.
  const backupActivities = [];
  const sectionSeq = new Map(); // sectionIndex → [cmid,…] dans l'ordre
  const fileEntries = [];       // entrées files.xml (pool) agrégées (H5P & co.)
  const quizCategoryBlocks = []; // catégories de banque agrégées (Test → questions.xml racine)
  activities.forEach((a, i) => {
    const sectionId = sectionIdFor(a.sectionIndex);
    // Activité H5P synthétisée (mod_h5pactivity + .h5p dans le pool de fichiers).
    if (a.extracted && a.extracted.kind === 'h5p') {
      const r = buildH5pActivityFiles(a.extracted, { index: i, sectionId, timestamp });
      Object.assign(files, r.files);
      fileEntries.push(...r.fileEntries);
      backupActivities.push({ moduleId: r.moduleId, sectionId, moduleName: r.moduleName, title: a.title });
      if (!sectionSeq.has(a.sectionIndex)) sectionSeq.set(a.sectionIndex, []);
      sectionSeq.get(a.sectionIndex).push(r.moduleId);
      return;
    }
    // Activité Test synthétisée (mod_quiz + banque régénérée → questions.xml racine).
    if (a.extracted && a.extracted.kind === 'quiz') {
      const r = buildQuizActivityFiles(a.extracted, { index: i, sectionId, timestamp, identite: hote });
      Object.assign(files, r.files);
      quizCategoryBlocks.push(...r.questionCategories);
      backupActivities.push({ moduleId: r.moduleId, sectionId, moduleName: r.moduleName, title: a.title });
      if (!sectionSeq.has(a.sectionIndex)) sectionSeq.set(a.sectionIndex, []);
      sectionSeq.get(a.sectionIndex).push(r.moduleId);
      return;
    }
    // Activité mbz AUTO-PORTEUSE : renumérotation en place. Les activités À MÉDIAS
    // doivent être filtrées EN AMONT (le bridge) — renumberActivity ne recopie que
    // le sous-arbre `activities/<mod>_<id>/`, pas les binaires `files/` : laisser
    // passer une telle activité produirait un cours aux références cassées. On
    // échoue donc BRUYAMMENT (bug d'intégration) plutôt qu'en silence.
    if (hasEmbeddedFiles(a.extracted.files)) {
      throw new Error(`mbz_course_media_activity:${a.extracted.moduleName} — filtrer les médias en amont (orchestrateur)`);
    }
    const r = renumberActivity(a.extracted, { index: i, sectionId }, timestamp);
    Object.assign(files, r.files);
    backupActivities.push({ moduleId: r.moduleId, sectionId, moduleName: r.moduleName, title: a.title });
    if (!sectionSeq.has(a.sectionIndex)) sectionSeq.set(a.sectionIndex, []);
    sectionSeq.get(a.sectionIndex).push(r.moduleId);
  });

  // 2. Ne conserver que les sections réellement utilisées (+ la 0 toujours).
  const usedIdx = new Set(activities.map(a => a.sectionIndex));
  usedIdx.add(0);
  const sectionsUsed = sections
    .filter(s => usedIdx.has(s.index))
    .sort((x, y) => x.index - y.index);

  // 3. Sections.
  const backupSections = [];
  sectionsUsed.forEach((s) => {
    const sectionId = sectionIdFor(s.index);
    files[`sections/section_${sectionId}/section.xml`] = buildSectionXml({
      sectionId, number: s.index, name: s.name, sequence: sectionSeq.get(s.index) || [], timestamp
    });
    files[`sections/section_${sectionId}/inforef.xml`] = EMPTY_INFOREF;
    backupSections.push({ sectionId, number: s.index });
  });

  // 4. Fichiers racine.
  Object.assign(files, ROOT_STATIC);
  // files.xml = manifeste du pool (H5P & co.) ; remplace le stub vide de ROOT_STATIC.
  files['files.xml'] = buildFilesXml(fileEntries);
  // questions.xml = banque de questions des Test (catégories partagées cours +
  // banque/module par quiz) ; remplace le stub vide de ROOT_STATIC dès qu'un Test
  // existe. `questionbank=1` est déjà posé dans moodle_backup.xml.
  if (quizCategoryBlocks.length) {
    files['questions.xml'] = buildQuestionsBackupXml(shortname, quizCategoryBlocks, timestamp, hote.quizHostname);
  }
  files['gradebook.xml'] = buildGradebookXml(timestamp);
  files['moodle_backup.log'] = hote.journal;
  files['moodle_backup.xml'] = buildCourseBackupXml({
    backupName, courseFullname: title, courseShortname: shortname, timestamp,
    activities: backupActivities, sections: backupSections, identite: hote
  });

  // 5. Fichiers course/.
  files['course/course.xml'] = buildCourseXml({ courseFullname: title, courseShortname: shortname, timestamp, identite: hote });
  files['course/enrolments.xml'] = buildEnrolmentsXml(timestamp);
  files['course/inforef.xml'] = COURSE_STATIC_INFOREF;
  files['course/roles.xml'] = EMPTY_ROLES;
  files['course/completiondefaults.xml'] = COMPLETIONDEFAULTS;
  files['course/contentbank.xml'] = CONTENTBANK;
  files['course/calendar.xml'] = EMPTY_CALENDAR;
  files['course/filters.xml'] = EMPTY_FILTERS;

  return { files, activities: backupActivities, sectionsUsed: backupSections };
}

// =========================================================================
// Orchestrateur (navigateur) — extractMbz → assemblage → buildMbz
// =========================================================================

/**
 * Construit le .mbz cours à partir d'une liste d'activités DÉJÀ extraites
 * (chemin réutilisé par le spike et le bridge). Sépare la logique navigateur
 * (extractMbz/buildMbz) de la synthèse pure.
 *
 * CONTRAT APPELANT : `activities`/`sections` proviennent de `planCourse` (ou du
 * spike) et NE contiennent que des activités mbz auto-porteuses SANS médias.
 * Le filtrage (non-mbz, module non pris en charge, `hasEmbeddedFiles`) se fait
 * EN AMONT — avant la planification des sections, pour ne pas créer de trou de
 * numérotation. `assembleCourseFiles` échoue bruyamment si un média passe.
 *
 * @param {Object} p
 * @param {string} p.courseTitle
 * @param {Array<{extracted:Object, title:string, sectionIndex:number}>} p.activities
 * @param {Array<{index:number, name:string}>} p.sections
 * @param {number} [p.timestamp]
 * @param {Object} [p.identite] - Identité de l'hôte (cf. `IDENTITE_DEFAUT`).
 * @param {Function} p.ecrireArchive - Écriture tar.gz `(files) => Promise<Uint8Array>`.
 *        OBLIGATOIRE. Chaque hôte a la sienne — `mbz-parser.buildMbz` côté
 *        Sucrerie, `moodle-creator.createMbz` côté Caramel — et ce fichier est
 *        PARTAGÉ : y importer l'une des deux en dur le rendrait incapable de se
 *        charger dans l'autre dépôt. Une valeur par défaut aurait le même
 *        défaut, en plus silencieux ; on échoue donc franchement, en nommant ce
 *        qu'il faut passer.
 * @returns {Promise<{bytes:Uint8Array, activities:Array, sectionsUsed:Array}>}
 */
export async function buildMbzFromExtracted({ courseTitle, activities, sections, timestamp, identite, ecrireArchive }) {
  if (typeof ecrireArchive !== 'function') {
    throw new Error('mbz_course_ecrireArchive_requis — passer buildMbz (Sucrerie) ou createMbz (Caramel)');
  }
  const buildMbz = ecrireArchive;
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const { files, activities: acts, sectionsUsed } = assembleCourseFiles({
    courseTitle, timestamp: ts, activities, sections, identite
  });
  const bytes = await buildMbz(files);
  return { bytes, activities: acts, sectionsUsed };
}
