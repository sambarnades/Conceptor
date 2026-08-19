/**
 * run_module_hygiene.mjs — Contrôles STATIQUES sur la structure des modules ES.
 *
 * Né d'une régression réelle : lors de la consolidation des fonctions d'échappement,
 * deux modules ont vu leur helper local remplacé par
 *
 *     export { escapeHtml as esc } from '../core/escape.js';
 *
 * `export … from` est une RÉ-EXPORTATION : elle rend le nom disponible aux
 * importateurs mais ne crée AUCUNE liaison dans la portée du module. Les appels
 * internes (`esc(text)` dans `caramelia/utils.js::md`, `escapeHtml(text)` dans
 * `ui/tutorial-modal.js::formatInline`) sont alors des références globales non
 * résolues : `ReferenceError` À L'EXÉCUTION, jamais au chargement.
 *
 * Conséquence observée : le chatbot Caramelia s'ouvrait VIDE (toute réponse passe par
 * `md()`), sans la moindre erreur au chargement du module. Ni `node --check`, ni un
 * test qui se contente d'importer les modules, ni la suite navigateur ne pouvaient le
 * voir — d'où ce contrôle statique dédié.
 *
 * La forme correcte est : `import { x } from '…'; export { x };`
 *
 * Lancement :  node tests/run_module_hygiene.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS_DIR = join(ROOT, 'js');

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) pass++;
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); }
};

/** Tous les .js de production (js/vendor exclu : code tiers, non soumis à nos règles). */
function listerModules(dir, acc = []) {
    for (const nom of readdirSync(dir).sort()) {
        const p = join(dir, nom);
        if (statSync(p).isDirectory()) {
            if (nom !== 'vendor') listerModules(p, acc);
        } else if (nom.endsWith('.js')) acc.push(p);
    }
    return acc;
}
const modules = listerModules(JS_DIR);

/**
 * Retire les COMMENTAIRES en conservant les chaînes — les chemins d'import y vivent.
 * Nécessaire car les JSDoc du dépôt contiennent des exemples d'usage
 * (`* import … from './ui/tutorial-modal.js';`) qui seraient pris pour de vrais imports.
 */
function sansCommentaires(src) {
    let out = '', i = 0, n = src.length, chaine = null;
    while (i < n) {
        const c = src[i], d = src[i + 1] ?? '';
        if (chaine === null) {
            if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
            if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
            if (c === '"' || c === "'" || c === '`') { chaine = c; out += c; i++; continue; }
            out += c; i++;
        } else {
            out += c;
            if (c === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
            if (c === chaine) chaine = null;
            i++;
        }
    }
    return out;
}

/**
 * Retire chaînes et commentaires : sans ça, une occurrence du nom dans un littéral
 * (`'esc('`) ou dans un commentaire d'explication compterait comme un usage.
 */
function corpsNu(src) {
    let out = '', i = 0, n = src.length, chaine = null;
    while (i < n) {
        const c = src[i], d = src[i + 1] ?? '';
        if (chaine === null) {
            if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
            if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
            if (c === '"' || c === "'" || c === '`') { chaine = c; i++; continue; }
            out += c; i++;
        } else {
            if (c === '\\') { i += 2; continue; }
            if (c === chaine) chaine = null;
            i++;
        }
    }
    return out;
}

console.log('\n=== Ré-exportations sans liaison locale ===');
console.log('    (`export {X} from …` puis `X(…)` dans le corps → ReferenceError à l\'exécution)\n');

let reexportsInspectes = 0;
for (const p of modules) {
    const src = readFileSync(p, 'utf8');
    const rel = relative(ROOT, p);

    // Noms rendus disponibles par une RÉ-EXPORTATION.
    const reexportes = new Map();
    for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*from\s*['"][^'"]+['"]/g)) {
        for (const part of m[1].split(',')) {
            const brut = part.trim();
            if (!brut) continue;
            reexportes.set(brut.split(/\s+as\s+/).pop().trim(), m[0].replace(/\s+/g, ' '));
        }
    }
    if (!reexportes.size) continue;
    reexportsInspectes += reexportes.size;

    // Corps = source sans les déclarations import/export-from, sans chaînes ni commentaires.
    let corps = src
        .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/g, '')
        .replace(/export\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/g, '');
    corps = corpsNu(corps);

    for (const [nom, decl] of reexportes) {
        // Une VRAIE importation du même nom crée la liaison manquante : cas sain.
        const importeLocalement = new RegExp(
            `import\\s*\\{[^}]*\\b${nom}\\b[^}]*\\}\\s*from`).test(src);
        const appels = (corps.match(new RegExp(`(?<![.\\w])${nom}\\s*\\(`, 'g')) || []).length;
        ok(`${rel} : « ${nom} » ré-exporté n'est pas appelé sans liaison locale`,
            appels === 0 || importeLocalement,
            `${appels} appel(s) interne(s) sans \`import\` correspondant.\n`
            + `     ${decl}\n`
            + `     Corriger en : import { … } from '…'; export { … };`);
    }
}
console.log(`   ${modules.length} modules analysés | ${reexportsInspectes} nom(s) ré-exporté(s) inspecté(s)`);

console.log('\n=== Imports relatifs résolvables ===');
{
    const manquants = [];
    let total = 0;
    for (const p of modules) {
        const src = sansCommentaires(readFileSync(p, 'utf8'));
        for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g)) {
            total++;
            const cible = join(dirname(p), m[1]);
            try { statSync(cible); }
            catch { manquants.push(`${relative(ROOT, p)} → ${m[1]}`); }
        }
    }
    ok('aucun import relatif cassé', manquants.length === 0, manquants.slice(0, 8).join('\n     '));
    console.log(`   ${total} imports relatifs vérifiés`);
}

console.log('\n========================================');
console.log(`hygiène des modules : ${pass} OK / ${fail} échec(s)`);
console.log('========================================');
if (fail) { console.log(echecs.join('\n')); process.exit(1); }
console.log('✅ Tous les tests passent.');
