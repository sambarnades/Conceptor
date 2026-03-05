const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const TRANSLATION_DIR = path.join(__dirname, 'js', 'locales');
const FR_FILE = path.join(TRANSLATION_DIR, 'fr.json');
const REPORT_FILE = path.join(__dirname, 'CLES_TRADUCTION_DOUBLON.MD');
const SEARCH_PATTERN = '**/*.{js,json,vue,jsx,ts,tsx,html}';
const IGNORE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'js/locales/**',
  'check-translations.js',
  'CLES_TRADUCTION_DOUBLON.MD'
];

/**
 * Extrait les clés et leurs numéros de ligne du fichier fr.js
 * Recherche des motifs du type :   key_name: "valeur",
 */
function extractKeysFromFr() {
  const content = fs.readFileSync(FR_FILE, 'utf8');
  const lines = content.split('\n');
  const keys = [];

  // Regex pour capturer la clé : début de ligne (avec espaces), mot, suivi de :
  // On s'assure que c'est bien une définition de clé dans l'objet translations_fr
  const keyRegex = /^\s*([a-zA-Z0-9_]+)\s*:/;

  lines.forEach((line, index) => {
    const match = line.match(keyRegex);
    if (match) {
      const key = match[1];
      // On ignore les clés qui ressemblent à des noms de variables exportées ou début de fichier
      // On ignore aussi les clés demandées par l'utilisateur et les préfixes dynamiques
      const isIgnored = key === 'const' ||
        key === 'translations_fr' ||
        key.endsWith('_REGLES_SPECIFIQUES') ||
        key.endsWith('_STRUCTURE_JSON') ||
        key.endsWith('_EXEMPLE_RENDU') ||
        key === 'success_copy' ||
        key === 'clear_all' ||
        key === 'close_modal';

      if (!isIgnored) {
        keys.push({
          name: key,
          line: index + 1
        });
      }
    }
  });

  return keys;
}

console.log(`📂 Analyse du fichier : js/locales/fr.json`);
const keys = extractKeysFromFr();
console.log(`🔍 ${keys.length} clés extraites\n`);

// Lister tous les fichiers à scanner
const filesToScan = glob.sync(SEARCH_PATTERN, {
  ignore: IGNORE_PATTERNS,
  cwd: __dirname
});

console.log(`🔎 Scan de ${filesToScan.length} fichiers (hors dossiers ignorés et traductions)...`);

// Charger tout le contenu en mémoire pour une recherche rapide
let allContent = '';
filesToScan.forEach(file => {
  try {
    allContent += fs.readFileSync(path.join(__dirname, file), 'utf8') + '\n';
  } catch (e) {
    console.error(`Erreur lecture ${file}: ${e.message}`);
  }
});

const unusedKeys = [];

keys.forEach(keyObj => {
  const key = keyObj.name;
  // Word boundary pour éviter les faux positifs (ex: 'intro' matchant 'introduction')
  const regex = new RegExp(`\\b${key}\\b`, 'g');

  if (!regex.test(allContent)) {
    unusedKeys.push(keyObj);
  }
});

// Générer le rapport Markdown
let reportContent = `# Liste des clés de traduction inutilisées\n\n`;
reportContent += `Généré le : ${new Date().toLocaleString()}\n\n`;
reportContent += `Ces clés apparaissent dans \`js/locales/fr.json\` mais n'ont été trouvées nulle part ailleurs dans le code source.\n\n`;
reportContent += `## Clés inutilisées (${unusedKeys.length})\n\n`;

if (unusedKeys.length > 0) {
  unusedKeys.forEach(k => {
    reportContent += `- Ligne ${k.line} : ${k.name}\n`;
  });
} else {
  reportContent += `✨ Aucune clé inutilisée trouvée !\n`;
}

reportContent += `\n---\n\n`;
reportContent += `## Comment supprimer ces clés ?\n\n`;
reportContent += `Un script Python \`remove-translations.py\` a été généré pour automatiser le nettoyage dans les 11 fichiers de traduction.\n\n`;
reportContent += `### Utilisation :\n`;
reportContent += `1. Vérifiez la liste ci-dessus. Si vous voulez garder une clé, retirez simplement sa ligne de ce fichier markdown.\n`;
reportContent += `2. Exécutez le script :\n`;
reportContent += `   \`\`\`bash\n`;
reportContent += `   python remove-translations.py\n`;
reportContent += `   \`\`\`\n`;
reportContent += `3. Le script lira ce fichier \`CLES_TRADUCTION_DOUBLON.MD\`, extraira les noms des clés, et les supprimera de tous les fichiers de \`js/locales/\`.\n`;

fs.writeFileSync(REPORT_FILE, reportContent);

console.log(`\n✅ Terminé !`);
console.log(`📊 ${unusedKeys.length} clés inutilisées identifiées.`);
console.log(`📝 Rapport généré : ${REPORT_FILE}`);
