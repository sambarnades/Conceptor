/**
 * Tests Node de la détection de type de fichier de `js/services/ocr.js`.
 *
 * Vérifie le portier `detectFileType` / `isVideoFile` — en particulier la prise
 * en charge des conteneurs vidéo (MP4/MOV/WEBM…) routés vers le pipeline audio
 * (on n'extrait que la piste audio). Le décodage réel (`decodeAudioData` sur une
 * vidéo) dépend du navigateur et n'est PAS testable ici : seul le routage l'est.
 *
 * Lancement : `node tests/run_ocr_filetype_tests.mjs`
 *
 * ocr.js référence des globals navigateur dans la chaîne d'import ; on les stube
 * avec des Proxy no-op avant l'import dynamique.
 */

// --- Stubs DOM minimaux (avant import) ---
const noop = () => {};
const docHandler = { get: (t, p) => {
  if (p === 'baseURI') return 'http://localhost/';
  if (p === 'getElementById' || p === 'querySelector') return () => null;
  if (p === 'querySelectorAll') return () => [];
  if (p === 'createElement') return () => ({ getContext: () => ({}), style: {}, setAttribute: noop, appendChild: noop });
  return noop;
} };
globalThis.document = new Proxy({}, docHandler);
globalThis.window = new Proxy({ document: globalThis.document }, { get: (t, p) => (p in t ? t[p] : noop) });
try { Object.defineProperty(globalThis, 'navigator', { value: { language: 'fr', languages: ['fr'] }, configurable: true }); } catch { /* déjà défini */ }
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
globalThis.sessionStorage = { getItem: () => null, setItem: noop, removeItem: noop };

const { detectFileType, isVideoFile, SUPPORTED_FORMATS_LABEL } = await import('../js/services/ocr.js');

// --- Mini-harnais d'assertions ---
let passed = 0;
let failed = 0;
function assert(cond, label, extra) {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`, extra ? JSON.stringify(extra) : ''); }
}
function file(name, type = '') { return { name, type }; }

console.log('\n[1] Vidéo → routée vers le pipeline audio (par extension)');
for (const ext of ['mp4', 'm4v', 'mov', 'webm']) {
  assert(detectFileType(file(`cours.${ext}`)) === 'audio',
    `.${ext} → 'audio'`, { got: detectFileType(file(`cours.${ext}`)) });
}

console.log('\n[2] Vidéo → routée vers le pipeline audio (par type MIME)');
for (const mime of ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']) {
  assert(detectFileType(file('sans-extension', mime)) === 'audio',
    `${mime} → 'audio'`, { got: detectFileType(file('sans-extension', mime)) });
}

console.log('\n[3] isVideoFile reconnaît les vidéos (hint UX « audio seul »)');
assert(isVideoFile(file('cours.mp4')) === true, '.mp4 est une vidéo');
assert(isVideoFile(file('x', 'video/mp4')) === true, 'MIME video/* est une vidéo');
assert(isVideoFile(file('musique.mp3')) === false, '.mp3 n’est PAS une vidéo');
assert(isVideoFile(file('doc.pdf')) === false, '.pdf n’est PAS une vidéo');

console.log('\n[4] Non-régression : les formats existants restent corrects');
const expectations = {
  'rapport.pdf': 'pdf',
  'cours.docx': 'docx',
  'diapo.pptx': 'pptx',
  'texte.odt': 'odt',
  'diapo.odp': 'odp',
  'photo.png': 'image',
  'photo.jpg': 'image',
  'son.mp3': 'audio',
  'son.m4a': 'audio',
  'son.wav': 'audio',
};
for (const [name, expected] of Object.entries(expectations)) {
  assert(detectFileType(file(name)) === expected,
    `${name} → '${expected}'`, { got: detectFileType(file(name)) });
}

console.log('\n[5] Les formats réellement non supportés restent refusés');
// .mkv retiré volontairement : Matroska n'est pas démuxé de façon fiable
// par decodeAudioData (même sur Chrome) → faux espoir, donc refusé en amont.
for (const name of ['virus.exe', 'archive.zip', 'data.csv', 'page.html', 'film.mkv']) {
  assert(detectFileType(file(name)) === null,
    `${name} → null (refusé)`, { got: detectFileType(file(name)) });
}

console.log('\n[6] Le libellé public mentionne la vidéo');
assert(/MP4/i.test(SUPPORTED_FORMATS_LABEL), 'SUPPORTED_FORMATS_LABEL contient « MP4 »', { label: SUPPORTED_FORMATS_LABEL });

console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} assertions OK, ${failed} échec(s).`);
process.exit(failed === 0 ? 0 : 1);
