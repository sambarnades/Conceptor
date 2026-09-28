/** Contrats d’aide du parcours : chapitre trouvable, libellés exacts, 12 langues. */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { TRAMES } from '../js/parcours/templates.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rag = resolve(root, '../rag/caramelia');
const langs = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];
const codes = ['parcours-creation', 'parcours-relecture-scenario', 'parcours-export-limites'];
// Fiches GÉNÉRÉES par scripts/aide-parcours.mjs (D82) : ce que Caramelia sait des parcours à créer.
const generees = ['parcours-trames', 'parcours-modules', 'parcours-conseils'];
const FAMILLES = ['decouvrir', 'memoriser', 'exercer', 'organiser', 'discuter', 'cooperer', 'produire'];
let pass = 0;
const ok = (nom, condition) => { assert.ok(condition, nom); pass++; };
for (const lang of langs) {
    const lire = p => readFileSync(resolve(root, p), 'utf8');
    const locale = JSON.parse(lire(`js/locales/${lang}.json`));
    const tutorial = JSON.parse(lire(`assets/data/tutorial/${lang}.json`));
    const chapitres = tutorial.chapters.filter(c => c.id === 'parcours');
    ok(`${lang} : chapitre parcours unique`, chapitres.length === 1);
    const texte = JSON.stringify(chapitres[0]);
    const embarque = lire(`js/caramelia/tuto-rag/${lang}.md`);
    const bot = JSON.parse(lire(`js/caramelia/locales/${lang}.json`));
    const botFr = JSON.parse(lire('js/caramelia/locales/fr.json'));
    ok(`${lang} : mêmes clés Caramelia, dans le même ordre`, JSON.stringify(Object.keys(bot)) === JSON.stringify(Object.keys(botFr)));
    ok(`${lang} : accès Caramelia décrit avec les vrais boutons`, ['course_btn_create', 'course_btn_resume'].every(k => texte.includes(bot[k]) && embarque.includes(bot[k])));
    ok(`${lang} : tous les gestes ont leurs vrais libellés`, [
        'parcours_commutateur_parcours', 'parcours_cta_plan', 'parcours_cta_modele',
        'parcours_personnaliser_plan',
        'parcours_fab_editer', 'parcours_lecture_apercu', 'parcours_lecture_parcours',
        'parcours_liv_scenario_exporter', 'parcours_liv_scenario_importer',
    ].every(k => texte.includes(locale[k]) && embarque.includes(locale[k])));
    const etapes = chapitres[0].blocks.find(b => b.type === 'steps')?.items || [];
    ok(`${lang} : les six étapes de création sont présentées dans l’ordre`, etapes.length >= 6
        && etapes[3].includes(locale.parcours_plan_verrouiller)
        && etapes[4].includes(locale.parcours_fab_editer)
        && etapes.at(-1).includes('.mbz'));
    ok(`${lang} : les supports sont expliqués dans le tutoriel et l’aide embarquée`, etapes.length >= 6 && embarque.includes(etapes[2]) && Object.keys(locale).filter(k => k.startsWith('parcours_source_')).length === 13);
    ok(`${lang} : le fond personnel et ses formats sont documentés`, texte.includes(locale.parcours_carte_perso_ajouter) && embarque.includes(locale.parcours_carte_perso_ajouter) && ['HEIC', 'TIFF'].every(f => texte.includes(f)));
    ok(`${lang} : cours, scénario et documents sont distingués`, ['.mbz', '.json', 'DOCX', 'ODT', 'PDF'].every(x => texte.includes(x)));
    ok(`${lang} : aucun avertissement périmé ne contredit le dépôt Sucrerie`, !chapitres[0].blocks.some(b => b.type === 'warn' && b.text.includes('Sucrerie')));
    const complements = chapitres[0].blocks.find(b => b.type === 'list' && b.items?.length === 6 && b.items.at(-1).includes('Moodle'));
    ok(`${lang} : six compléments manuels de plateforme sont expliqués`, !!complements && complements.items.every(item => item.includes('**')));
    ok(`${lang} : le lien ABC est conservé en Markdown sûr`, texte.includes('[ABC Learning Design (UCL)](https://www.ucl.ac.uk/'));
    ok(`${lang} : aucun jeton de rédaction oublié`, !/\{parcours_|@n/.test(texte));
    ok(`${lang} : tutoriel embarqué sans doublon`, (embarque.match(/<!-- parcours-complet -->/g) || []).length === 1);
    ok(`${lang} : l’aide de Caramelia nomme les ${TRAMES.length} trames, une seule fois, dans la section du parcours`,
        (embarque.match(/<!-- parcours-trames -->/g) || []).length === 1
        && embarque.indexOf('<!-- parcours-trames -->') > embarque.indexOf('<!-- parcours-complet -->')
        && embarque.indexOf('<!-- /parcours-trames -->') < embarque.indexOf('<!-- /parcours-complet -->')
        && TRAMES.every(tr => embarque.includes(`**${locale[tr.nameKey]}**`)));
    if (existsSync(rag)) {
        for (const code of codes) {
            const chunk = readFileSync(resolve(rag, `chunks/${lang}/${code}.md`), 'utf8');
            ok(`${lang}/${code} : métadonnées et contenu`, chunk.includes(`code: ${code}\n`) && chunk.includes(`lang: ${lang}\n`) && chunk.includes('categorie: integration-plateforme') && chunk.includes('> Contexte : Caramel'));
            ok(`${lang}/${code} : ancrage identique au tutoriel`, chunk.includes(locale.parcours_commutateur_parcours) && !/\{parcours_/.test(chunk));
            if (code === 'parcours-creation') ok(`${lang} : accès Caramelia présent dans le RAG local`, chunk.includes(bot.course_btn_create) && chunk.includes(bot.course_btn_resume));
        }
        const fiche = code => readFileSync(resolve(rag, `chunks/${lang}/${code}.md`), 'utf8');
        for (const code of generees) {
            const chunk = fiche(code);
            ok(`${lang}/${code} : métadonnées`, chunk.includes(`code: ${code}\n`) && chunk.includes(`lang: ${lang}\n`) && chunk.includes('categorie: integration-plateforme') && chunk.includes('> Contexte : Caramel') && !/undefined|\{parcours_|\{P\}/.test(chunk));
        }
        ok(`${lang}/parcours-trames : les ${TRAMES.length} trames, nommées comme à l’écran`, TRAMES.every(tr => fiche('parcours-trames').includes(`**${locale[tr.nameKey]}** — ${locale[tr.descKey]}`)));
        ok(`${lang}/parcours-modules : les modules de la plateforme du tutoriel`, fiche('parcours-modules').includes(chapitres[0].blocks.find(b => b.type === 'list' && b.items?.length === 6).items[0]));
        ok(`${lang}/parcours-conseils : le miroir et ses sept familles`, fiche('parcours-conseils').includes(locale.parcours_types_titre) && FAMILLES.every(f => fiche('parcours-conseils').includes(locale[`parcours_type_${f}`])));
    }
}
if (existsSync(rag)) {
    const qs = readFileSync(resolve(rag, 'tests/golden-parcours.jsonl'), 'utf8').trim().split('\n').map(x => JSON.parse(x));
    ok('questions de référence associées aux six fiches', qs.length >= 22 && [...codes, ...generees].every(code => qs.some(q => q.expected_code === code)));
    const generateur = spawnSync(process.execPath, ['scripts/aide-parcours.mjs', '--verifier'], { cwd: root, encoding: 'utf8' });
    ok('aide et fiches générées à jour (node scripts/aide-parcours.mjs --verifier)', generateur.status === 0);
}
console.log(`Documentation parcours : ${pass} PASS / 0 FAIL${existsSync(rag) ? ' (RAG inclus)' : ' (dépôt RAG absent : contrôle externe omis)'}`);
