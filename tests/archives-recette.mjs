/**
 * archives-recette.mjs — Où trouver les archives .h5p que rejouent les bancs
 * `run_native_*_play.mjs`.
 *
 * Ces bancs lisaient `/tmp/sucrerie-*.h5p` (exports de l'éditeur Sucrerie) et
 * `/tmp/caramel-capacites-documents/*.h5p` (exports de Caramel). Ces fichiers
 * n'existaient qu'après une recette manuelle croisée entre les deux dépôts, et
 * `/tmp` est vidé au redémarrage : les 26 bancs échouaient tous au premier
 * `readFile` (constaté le 15 sept. 2026). Or chaque recette a VERSIONNÉ ses
 * archives, avec leurs empreintes, sous `tests/sonde-parcours/audit-activites-*`.
 *
 * Ordre de recherche d'une archive, par son nom :
 *   1. `$ARCHIVES_RECETTE/<nom>`, pour rejouer des exports tout juste produits ;
 *   2. les dossiers de recette versionnés (le plus récent audit d'abord) ;
 *   3. `/tmp/<nom>` et `/tmp/caramel-capacites-documents/<nom>`, l'ancien usage.
 *
 * @module tests/archives-recette
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('./sonde-parcours/', import.meta.url));

let index = null;
function indexer() {
    index = new Map();
    const audits = readdirSync(RACINE).filter(d => d.startsWith('audit-activites-')).sort().reverse();
    const parcourir = (dossier) => {
        for (const nom of readdirSync(dossier).sort()) {
            const chemin = join(dossier, nom);
            if (statSync(chemin).isDirectory()) parcourir(chemin);
            else if (nom.endsWith('.h5p') && !index.has(nom)) index.set(nom, chemin);
        }
    };
    for (const audit of audits) parcourir(join(RACINE, audit));
}

/**
 * @param {string} nom - Nom de fichier, ex. `sucrerie-frise-compacte.h5p`.
 * @returns {string} Chemin absolu de l'archive.
 * @throws {Error} Si l'archive n'existe nulle part, avec les endroits cherchés.
 */
export function archiveRecette(nom) {
    const cherches = [];
    if (process.env.ARCHIVES_RECETTE) {
        const chemin = join(process.env.ARCHIVES_RECETTE, nom);
        if (existsSync(chemin)) return chemin;
        cherches.push(chemin);
    }
    if (!index) indexer();
    if (index.has(nom)) return index.get(nom);
    cherches.push(`${RACINE}audit-activites-*/**/${nom}`);
    for (const chemin of [join('/tmp', nom), join('/tmp/caramel-capacites-documents', nom)]) {
        if (existsSync(chemin)) return chemin;
        cherches.push(chemin);
    }
    throw new Error(`Archive de recette introuvable : ${nom}\n  cherchée dans :\n  - ${cherches.join('\n  - ')}`);
}
