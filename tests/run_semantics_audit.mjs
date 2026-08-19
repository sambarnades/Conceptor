/**
 * run_semantics_audit.mjs — Cartographie EXHAUSTIVE des semantics H5P,
 * et confrontation avec `js/h5p/field-constraints.js`.
 *
 * ── POURQUOI ────────────────────────────────────────────────────────────────
 * `field-constraints.js` déclare, champ par champ, le type de rendu appliqué par
 * Caramel (`html+latex`, `html`, `plain`…). C'est une déclaration ÉCRITE À LA MAIN,
 * côté Caramel. Elle n'a jamais été confrontée à la seule source qui fasse autorité :
 * le `semantics.json` de chaque bibliothèque H5P, qui dit pour chaque champ
 *   · son `type`   — text, number, boolean, list, group, library, image…
 *   · son `widget` — « html » = éditeur riche ; absent = saisie en texte brut ;
 *   · ses `tags`   — la liste EXACTE des balises autorisées (strong, em, a, …).
 *
 * ── DEUX CONTRATS, À NE PAS CONFONDRE ───────────────────────────────────────
 * Un même champ a deux comportements distincts, et l'audit les sépare :
 *
 *   1. CONTRAT D'ÉDITION (semantics) — ce que la plateforme considère comme valide.
 *      C'est lui qui gouverne la validation des paramètres côté serveur H5P
 *      (Moodle/Éléa) : un champ `text` sans `widget: html` n'est PAS censé contenir
 *      de balises.
 *
 *   2. RENDU EFFECTIF (player) — ce que le code JS de la bibliothèque fait vraiment.
 *      Exemple vérifié : `H5P.Question.setFeedback` (question.js:1247) injecte le
 *      feedback avec `'html': content`, donc du HTML S'AFFICHERAIT — alors même que
 *      le semantics déclare `overallFeedback[].feedback` en texte brut.
 *
 *   Les deux peuvent diverger. S'appuyer sur le rendu effectif est un pari : il tient
 *   en aperçu local (h5p-standalone ne filtre rien), pas nécessairement après passage
 *   par la validation d'une plateforme. Le semantics reste donc la référence.
 *
 * ── CE QUE PRODUIT CE SCRIPT ────────────────────────────────────────────────
 *   · `tests/fixtures/h5p-semantics-map.json` — la cartographie complète, durable :
 *     pour chaque module, chaque champ de semantics avec type/widget/tags.
 *   · un rapport classant chaque champ déclaré par Caramel en 4 verdicts :
 *       CONCORDANT      — Caramel et H5P disent la même chose
 *       SUR-DÉCLARÉ     — Caramel dit riche, le semantics dit texte brut
 *       SOUS-DÉCLARÉ    — le semantics accepte le HTML, Caramel dit `plain`
 *       HORS-SEMANTICS  — chemin du format intermédiaire Caramel, sans équivalent
 *
 * Lancement :
 *   node tests/run_semantics_audit.mjs               → rapport de synthèse
 *   node tests/run_semantics_audit.mjs --module=X    → détail d'un module
 *   node tests/run_semantics_audit.mjs --html        → tous les champs HTML de H5P
 *   node tests/run_semantics_audit.mjs --ecrire      → (ré)écrit la cartographie JSON
 *
 * Le script est un AUDIT : il n'échoue pas sur un écart (code de sortie 0), sauf
 * incohérence structurelle (bibliothèque déclarée absente du disque).
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIBS = join(ROOT, 'js/vendor/h5p-libs');
const CARTE = join(ROOT, 'tests/fixtures/h5p-semantics-map.json');

const args = process.argv.slice(2);
const MODULE_CIBLE = (args.find(a => a.startsWith('--module=')) || '').replace('--module=', '');
const LISTER_HTML = args.includes('--html');
const ECRIRE = args.includes('--ecrire');

// ============================================================================
// 1. APLATISSEMENT DU SEMANTICS
// ============================================================================

/**
 * Aplatit un `semantics.json` en liste de champs feuilles.
 *
 * Correspondance semantics → content.json :
 *   · `list`  → tableau        : le chemin gagne `[]`
 *   · `group` → objet imbriqué : le chemin gagne un segment
 *   · le reste → feuille
 *
 * PIÈGE H5P, traité explicitement : un `group` dont l'unique enfant porte LE MÊME NOM
 * (cas d'`overallFeedback`) est aplati à l'exécution. Le semantics décrit
 * `overallFeedback.overallFeedback[].overallFeedback.feedback`, alors que le player lit
 * `params.overallFeedback[].feedback` — vérifié dans `H5P.Question.determineOverallFeedback`
 * (question.js:1927, itère `feedbacks[i].feedback`) et dans l'appel de MultiChoice
 * (multichoice.js:757, passe `params.overallFeedback` tel quel). On émet donc les DEUX
 * chemins : `semantics` (littéral) et `contenu` (celui réellement écrit dans content.json).
 */
function aplatir(noeuds, cheminSem = '', cheminContenu = '', sortie = [], ctx = null) {
    const liste = Array.isArray(noeuds) ? noeuds : [noeuds];
    for (const f of liste) {
        if (!f || typeof f !== 'object') continue;
        const nom = f.name || '';
        const sem = cheminSem ? (nom ? `${cheminSem}.${nom}` : cheminSem) : nom;

        // Segment redondant (groupe/liste homonyme) : présent dans le semantics,
        // absent du content.json réel.
        const dernierContenu = cheminContenu.split('.').pop().replace(/\[\]$/, '');
        const redondant = nom && nom === dernierContenu;
        const contenu = redondant
            ? cheminContenu
            : (cheminContenu ? (nom ? `${cheminContenu}.${nom}` : cheminContenu) : nom);

        if (f.type === 'list') {
            if (f.field) aplatir(f.field, `${sem}[]`, `${contenu}[]`, sortie, ctx);
        } else if (f.type === 'group') {
            if (f.fields) aplatir(f.fields, sem, contenu, sortie, ctx);
        } else if (f.type === 'library' && Array.isArray(f.options) && ctx) {
            // DESCENTE DANS LES SOUS-BIBLIOTHÈQUES. Sans elle, la cartographie s'arrêtait
            // net sur les conteneurs (Image interactive, Course Presentation, Livre
            // interactif, Vidéo interactive), qui sont précisément ceux dont le contenu
            // textuel vit dans une AUTRE bibliothèque. Exemple : le texte d'un point
            // d'« Image interactive » n'est pas dans H5P.ImageHotspots mais dans
            // `H5P.Text 1.1`, dont le semantics autorise `<strong>`.
            // Le contenu réel est sous `<champ>.params.<…>` (H5P encapsule toujours ainsi).
            for (const option of f.options) {
                const dossier = String(option).replace(/\s+/g, '-');
                if (ctx.pile.includes(dossier)) continue;         // garde anti-cycle
                if (ctx.pile.length >= ctx.profondeurMax) continue;
                const sousSem = ctx.charger(dossier);
                if (!sousSem) { ctx.introuvables.add(dossier); continue; }
                aplatir(sousSem, `${sem}<${option}>`, `${contenu}.params`, sortie,
                    { ...ctx, pile: [...ctx.pile, dossier] });
            }
            sortie.push({
                semantics: sem, contenu, type: 'library',
                widget: null, tags: null, optional: f.optional === true,
                label: f.label || null, options: f.options
            });
        } else {
            sortie.push({
                semantics: sem,
                contenu,
                type: f.type,
                widget: f.widget || null,
                tags: Array.isArray(f.tags) ? f.tags : null,
                optional: f.optional === true,
                label: f.label || null
            });
        }
    }
    return sortie;
}

/** Classe un champ de semantics. */
function classer(champ) {
    if (champ.type !== 'text') {
        return { nature: 'non-textuel', html: false, gras: false };
    }
    if (champ.widget === 'html') {
        const tags = champ.tags || [];
        return {
            nature: 'html',
            html: true,
            // `tags` absent sur un widget html = toutes les balises par défaut de H5P.
            gras: tags.length === 0 || tags.includes('strong'),
            tags: tags.length ? tags : ['(défaut H5P)']
        };
    }
    return { nature: 'texte-brut', html: false, gras: false };
}

// ============================================================================
// 2. RÉSOLUTION module → bibliothèque
// ============================================================================

async function resoudreModules() {
    const src = await readFile(join(ROOT, 'js/h5p/processors/index.js'), 'utf8');
    const bloc = src.slice(src.indexOf('const processorMetadata'));
    const rx = /'([A-Za-z_]+)':\s*\{\s*machineName:\s*'([^']+)',\s*version:\s*\{\s*major:\s*(\d+),\s*minor:\s*(\d+)/g;
    const out = new Map();
    let m;
    while ((m = rx.exec(bloc))) {
        out.set(m[1], { lib: m[2], version: `${m[3]}.${m[4]}`, dossier: `${m[2]}-${m[3]}.${m[4]}` });
    }
    return out;
}

// ============================================================================
// 3. MAIN
// ============================================================================

/** Cache synchrone des semantics, indispensable à la descente récursive. */
function construireChargeur(cacheSem) {
    return (dossier) => cacheSem.get(dossier) || null;
}

async function main() {
    const modules = await resoudreModules();
    const fc = await import(join(ROOT, 'js/h5p/field-constraints.js'));
    const CONTRAINTES = fc.FIELD_CONSTRAINTS;
    const presents = new Set(await readdir(LIBS));

    // Précharge tous les semantics du dossier vendor : la descente dans les
    // sous-bibliothèques est récursive et synchrone.
    const cacheSem = new Map();
    for (const d of presents) {
        const c = join(LIBS, d, 'semantics.json');
        if (existsSync(c)) {
            try { cacheSem.set(d, JSON.parse(await readFile(c, 'utf8'))); } catch { /* semantics illisible */ }
        }
    }
    const introuvables = new Set();

    const carte = {};
    const verdicts = { CONCORDANT: [], 'SUR-DÉCLARÉ': [], 'SOUS-DÉCLARÉ': [], 'SPÉCIALISÉ': [], 'HORS-SEMANTICS': [] };
    const absentes = [];

    for (const [moduleKey, meta] of modules) {
        const chemin = join(LIBS, meta.dossier, 'semantics.json');
        if (!existsSync(chemin)) {
            absentes.push(`${moduleKey} → ${meta.dossier}`);
            continue;
        }
        const sem = JSON.parse(await readFile(chemin, 'utf8'));
        const ctx = {
            charger: construireChargeur(cacheSem),
            pile: [meta.dossier],
            profondeurMax: 4,          // conteneur → bloc → sous-exercice → feuille
            introuvables
        };
        const champs = aplatir(sem, '', '', [], ctx).map(c => ({ ...c, ...classer(c) }));

        carte[moduleKey] = {
            bibliotheque: meta.lib,
            version: meta.version,
            nbChamps: champs.length,
            nbHtml: champs.filter(c => c.html).length,
            champs: champs.map(c => ({
                contenu: c.contenu,
                semantics: c.semantics !== c.contenu ? c.semantics : undefined,
                type: c.type,
                widget: c.widget || undefined,
                tags: c.tags || undefined,
                nature: c.nature
            }))
        };

        // ---- confrontation avec field-constraints -------------------------
        const cons = CONTRAINTES[moduleKey];
        if (!cons || !cons.fields) continue;

        // index par chemin de contenu, ET par queue de chemin (les champs de Caramel
        // décrivent souvent le format PLAT intermédiaire, sans les préfixes H5P).
        const parContenu = new Map(champs.map(c => [c.contenu, c]));
        const parQueue = new Map();
        for (const c of champs) {
            const seg = c.contenu.split('.');
            for (let n = 1; n <= Math.min(3, seg.length); n++) {
                const q = seg.slice(-n).join('.');
                if (!parQueue.has(q)) parQueue.set(q, c);
            }
        }

        for (const [champCaramel, decl] of Object.entries(cons.fields)) {
            const info = parContenu.get(champCaramel) || parQueue.get(champCaramel);
            const caramelRiche = decl.render === 'html' || decl.render === 'html+latex';
            // `unicode+markers` et `plain+letters` ne sont PAS des « plain » par défaut :
            // ce sont des rendus SPÉCIALISÉS, choisis exprès parce que le champ porte une
            // syntaxe propre. Cas emblématique : `MarkTheWords.textField`, où les `*mot*`
            // désignent les mots à cliquer — H5P y autorise `<strong>`, mais y offrir du
            // gras entrerait en conflit avec la syntaxe de marquage. Les compter comme
            // « sous-déclarés » serait un faux positif.
            const specialise = decl.render === 'unicode+markers' || decl.render === 'plain+letters';
            const ligne = { moduleKey, champ: champCaramel, caramel: decl.render };

            if (!info) { verdicts['HORS-SEMANTICS'].push(ligne); continue; }
            ligne.h5p = info.nature;
            ligne.tags = info.tags ? info.tags.join(',') : '—';
            ligne.type = info.type;

            if (specialise) verdicts['SPÉCIALISÉ'].push(ligne);
            else if (caramelRiche && !info.html) verdicts['SUR-DÉCLARÉ'].push(ligne);
            else if (!caramelRiche && info.gras) verdicts['SOUS-DÉCLARÉ'].push(ligne);
            else verdicts.CONCORDANT.push(ligne);
        }
    }

    // ------------------------------------------------------------ artefact
    if (ECRIRE) {
        await writeFile(CARTE, JSON.stringify({
            _commentaire: 'Cartographie EXHAUSTIVE des semantics.json des bibliothèques H5P '
                + 'utilisées par Caramel. Généré par tests/run_semantics_audit.mjs --ecrire. '
                + 'Source de vérité pour savoir quel champ accepte du HTML et quelles balises.',
            _contrats: {
                edition: 'semantics.json — ce que la plateforme considère comme valide',
                rendu: 'code JS de la bibliothèque — ce qui s\'affiche réellement ; peut diverger '
                    + '(ex. H5P.Question.setFeedback injecte en .html() un champ déclaré texte brut)'
            },
            modules: carte
        }, null, 2), 'utf8');
        console.log(`📌 Cartographie écrite : ${CARTE}`);
    }

    // ------------------------------------------------------------- rapports
    if (MODULE_CIBLE) {
        const m = carte[MODULE_CIBLE];
        if (!m) { console.log(`Module inconnu : ${MODULE_CIBLE}`); process.exit(1); }
        console.log(`\n════ ${MODULE_CIBLE} — ${m.bibliotheque} ${m.version} ════`);
        console.log(`${m.nbChamps} champs, dont ${m.nbHtml} acceptant du HTML\n`);
        for (const c of m.champs) {
            const marque = c.nature === 'html' ? '🅷' : c.nature === 'texte-brut' ? '·' : ' ';
            console.log(`  ${marque} ${c.contenu.padEnd(52)} ${String(c.type).padEnd(9)}`
                + (c.tags ? ` tags=${c.tags.join(',')}` : ''));
        }
        return;
    }

    if (LISTER_HTML) {
        console.log('\n════ TOUS LES CHAMPS ACCEPTANT DU HTML (source : semantics.json) ════\n');
        for (const [mod, m] of Object.entries(carte)) {
            const h = m.champs.filter(c => c.nature === 'html');
            if (!h.length) continue;
            console.log(`──── ${mod}  (${m.bibliotheque} ${m.version}) ────`);
            for (const c of h) {
                console.log(`  ${c.contenu.padEnd(52)} tags=${(c.tags || ['(défaut)']).join(',')}`);
            }
            console.log('');
        }
        return;
    }

    console.log('=== Cartographie semantics H5P ↔ field-constraints.js ===\n');
    console.log(`Modules cartographiés : ${Object.keys(carte).length}`);
    console.log(`Champs de semantics   : ${Object.values(carte).reduce((n, m) => n + m.nbChamps, 0)}`);
    console.log(`  dont acceptant HTML : ${Object.values(carte).reduce((n, m) => n + m.nbHtml, 0)}`);
    console.log(`Champs déclarés par Caramel : ${Object.values(verdicts).reduce((n, v) => n + v.length, 0)}`);

    console.log(`\n╔═══ ✅ CONCORDANT (${verdicts.CONCORDANT.length}) ═══╗`);
    console.log('   Caramel et le semantics disent la même chose.');

    console.log(`\n╔═══ ⚠️  SUR-DÉCLARÉ (${verdicts['SUR-DÉCLARÉ'].length}) ═══╗`);
    console.log('   Caramel déclare le champ RICHE, le semantics dit TEXTE BRUT.');
    console.log('   → y injecter du HTML sort du contrat d\'édition de la plateforme.\n');
    grouperParChamp(verdicts['SUR-DÉCLARÉ']);

    console.log(`\n╔═══ ⚠️  SOUS-DÉCLARÉ (${verdicts['SOUS-DÉCLARÉ'].length}) ═══╗`);
    console.log('   Le semantics accepte <strong>, Caramel déclare `plain`.');
    console.log('   → le gras y est possible mais Caramel ne l\'offre pas.\n');
    grouperParChamp(verdicts['SOUS-DÉCLARÉ']);

    console.log(`\n╔═══ 🎯 SPÉCIALISÉ (${verdicts['SPÉCIALISÉ'].length}) ═══╗`);
    console.log('   Rendu volontairement restreint : le champ porte une syntaxe propre');
    console.log('   (marqueurs *mot*, lettres…) incompatible avec du HTML libre.\n');
    grouperParChamp(verdicts['SPÉCIALISÉ']);

    console.log(`\n╔═══ ℹ️  HORS-SEMANTICS (${verdicts['HORS-SEMANTICS'].length}) ═══╗`);
    console.log('   Chemins du format intermédiaire Caramel (transformés par le processeur).');
    console.log('   Normal : ils n\'ont pas d\'équivalent direct dans le semantics.');

    if (introuvables.size) {
        console.log(`\n╔═══ ℹ️  Sous-bibliothèques non cartographiées (${introuvables.size}) ═══╗`);
        console.log('   Référencées par un champ `library` mais absentes de js/vendor/h5p-libs/.');
        console.log('   Sans conséquence pour le .h5p (les libs ne sont pas embarquées),');
        console.log('   mais leurs champs échappent à la cartographie.');
        console.log('   ' + [...introuvables].sort().join(', '));
    }

    if (absentes.length) {
        console.log(`\n╔═══ ❌ BIBLIOTHÈQUES ABSENTES (${absentes.length}) ═══╗`);
        for (const a of absentes) console.log(`   ${a}`);
    }

    console.log('\n─── options : --module=<clé> | --html | --ecrire ───');
    process.exit(absentes.length ? 1 : 0);
}

function grouperParChamp(lignes) {
    const parChamp = new Map();
    for (const l of lignes) {
        if (!parChamp.has(l.champ)) parChamp.set(l.champ, { mods: [], h5p: l.h5p, type: l.type, tags: l.tags });
        parChamp.get(l.champ).mods.push(l.moduleKey);
    }
    if (!parChamp.size) { console.log('   (aucun)'); return; }
    for (const [champ, v] of [...parChamp].sort((a, b) => b[1].mods.length - a[1].mods.length)) {
        console.log(`   ${champ.padEnd(38)} ${String(v.mods.length).padStart(2)} module(s)  [h5p:${v.type}${v.tags && v.tags !== '—' ? ` tags=${v.tags}` : ''}]`);
        console.log(`   ${''.padEnd(38)} ${v.mods.join(', ')}`);
    }
}

main().catch(e => { console.error('FATAL', e); process.exit(2); });
