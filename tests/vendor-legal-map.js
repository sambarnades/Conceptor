/**
 * @file Inventaire « bibliothèque tierce embarquée → clé de mention légale ».
 *
 * CLAUDE.md pose la règle : « Toute nouvelle lib vendor doit être inscrite dans les
 * mentions légales : `<li data-translate="legal_library_<nom>">` **+** clé
 * `legal_library_<nom>` dans les 11 `js/locales/*.json` ». Cette règle était écrite
 * mais RIEN ne la vérifiait — trois bibliothèques y avaient échappé (audit 2026-07) :
 *   · `qrcode-generator`  — embarquée et chargée par lib-loader, jamais créditée ;
 *   · les 221 bibliothèques de contenu `js/vendor/h5p-libs/` — seul le lecteur
 *     d'aperçu (`h5p-standalone`) l'était, pas les types de contenu eux-mêmes ;
 *   · `flag-icons` (+ ses SVG dans `assets/flags/`) — les drapeaux du sélecteur de langue.
 *
 * Ce fichier est la source de vérité de l'inventaire. Il est consommé par :
 *   · `tests/test-legal-notices.js`  (navigateur) — croise l'inventaire avec le HTML
 *     des mentions légales, les 11 locales et les chemins réellement chargés ;
 *   · `tests/run_legal_notices.mjs`  (Node)       — croise l'inventaire avec le CONTENU
 *     RÉEL du disque, seul capable de voir un dossier vendor ajouté sans aucun câblage.
 *
 * Données pures, sans import : lisible des deux côtés (même idiome que
 * `tests/roundtrip/fixtures-prefixes.js`).
 *
 * AJOUTER UNE BIBLIOTHÈQUE = 3 gestes, dans cet ordre :
 *   1. une entrée ici ;
 *   2. un `<li data-translate="…">` dans `assets/templates/mentions-legales.html` ;
 *   3. la clé dans les 11 `js/locales/*.json`.
 * Sauter l'un des trois fait échouer la suite.
 */

/**
 * Répertoires de `js/vendor/` → clé de mention légale qui les crédite.
 * Plusieurs répertoires peuvent partager une clé (deux versions d'une même lib).
 */
export const VENDOR_JS_A_MENTION = [
    { dossier: 'client-zip', cle: 'legal_library_clientzip' },
    { dossier: 'docx', cle: 'legal_library_docx' },
    { dossier: 'dompurify', cle: 'legal_library_dompurify' },
    { dossier: 'fflate', cle: 'legal_library_fflate' },
    { dossier: 'fonts', cle: 'legal_library_liberation_sans' },
    { dossier: 'h5p-libs', cle: 'legal_library_h5p_content_types' },
    { dossier: 'h5p-standalone', cle: 'legal_library_h5p_standalone' },
    { dossier: 'heic2any', cle: 'legal_library_heic2any' },
    { dossier: 'jspdf', cle: 'legal_library_jspdf' },
    { dossier: 'jspdf-autotable', cle: 'legal_library_jspdf_autotable' },
    { dossier: 'jszip', cle: 'legal_library_jszip' },
    { dossier: 'mammoth', cle: 'legal_library_mammoth' },
    // Deux MathJax cohabitent : la 4.1.3 pour le rendu Caramel, la 2.7.9 imposée par
    // H5P.MathDisplay dans l'aperçu. Même projet, même licence → même mention.
    { dossier: 'mathjax', cle: 'legal_library_mathjax' },
    { dossier: 'mathjax-2', cle: 'legal_library_mathjax' },
    { dossier: 'pako', cle: 'legal_library_pako' },
    { dossier: 'pdf-js', cle: 'legal_library_pdfjs' },
    { dossier: 'qrcode', cle: 'legal_library_qrcode' },
    { dossier: 'tar-js', cle: 'legal_library_tarjs' },
    { dossier: 'tesseract', cle: 'legal_library_tesseract' },
    { dossier: 'utif', cle: 'legal_library_utif' }
];

/**
 * Feuilles de style tierces de `css/vendor/` → clé de mention légale.
 * Elles échappent à `LIB_PATHS` (chargées par `<link>` dans index.html), ce qui est
 * exactement pour cette raison que `flag-icons` était passé sous les radars.
 */
export const VENDOR_CSS_A_MENTION = [
    { fichier: 'fontawesome/7.3.1/css/all.min.css', cle: 'legal_library_fontawesome' },
    { fichier: 'flag-icons/7.5.0/css/flag-icons.min.css', cle: 'legal_library_flag_icons' },
    // Anciennes copies non versionnées (FA 6.7.2 remanié vers assets/fonts/,
    // flag-icons remanié vers assets/flags/), conservées en repli le temps de
    // valider la 7.3.1 / 7.5.0. À retirer avec `assets/fonts/fa-*` et
    // `assets/flags/` une fois la transition entérinée.
    { fichier: 'all.min.css', cle: 'legal_library_fontawesome' },
    { fichier: 'flag-icons.min.css', cle: 'legal_library_flag_icons' }
];

/**
 * Clés `legal_library_*` qui ne correspondent À AUCUN fichier embarqué, avec la
 * raison. Sans cette liste, le contrôle « toute clé correspond à une lib » signalerait
 * à tort ces entrées légitimes.
 */
export const MENTIONS_SANS_FICHIER = [
    { cle: 'legal_library_ownership', raison: 'paragraphe de clôture (propriété des marques), pas une bibliothèque' },
    { cle: 'legal_library_tts_piper', raison: 'moteur de synthèse vocale exécuté côté serveur (n8n), rien n\'est embarqué' },
    { cle: 'legal_library_tts_voices', raison: 'modèles de voix hébergés côté serveur, rien n\'est embarqué' }
];

/** Toutes les clés attendues dans les mentions légales, dédoublonnées et triées. */
export function clesAttendues() {
    const set = new Set([
        ...VENDOR_JS_A_MENTION.map(e => e.cle),
        ...VENDOR_CSS_A_MENTION.map(e => e.cle),
        ...MENTIONS_SANS_FICHIER.map(e => e.cle)
    ]);
    return [...set].sort();
}
