/** Prépare la sonde livre ; --execute nécessite une autorisation supplémentaire.
 * Endpoints bas uniquement, un seul appel de génération, statistiques et RAG coupés.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { ENDPOINTS } from '../js/core/endpoints.js';
const locales = JSON.parse(await readFile(new URL('../js/locales/fr.json', import.meta.url), 'utf8'));
const root = new URL('../tests/sonde-parcours/audit-activites-2026-09-11/prompts/', import.meta.url);
await mkdir(new URL('resultats/', root), { recursive: true });
const demande = 'Crée un livre de UNE seule page intitulée « Comparer les capitales ». La couverture est activée et présente la consigne « Observe les pays et retrouve leurs capitales. », sans média. Dans la page, place une rangée de DEUX colonnes : largeur 35 pour un texte rappelant France–Paris, Italie–Rome, Espagne–Madrid ; largeur 65 pour trois cartes de dialogue correspondantes. Les cartes sont en mode normal. Conserve progressIndicators:true, progressAuto:false, enableRetry:false et showTableOfContents:false. Aucun média ni lien inventé. Aucun contenu nominatif.';
const prompt = [demande, locales.prompt_interactive_book_regles_specifiques.replace(/.*\|\| \[NOMBRE_ELEMENTS\].*\n/, '- Nombre de chapitres : 1.\n'), locales.prompt_interactive_book_structure_json, locales.prompt_interactive_book_exemple_rendu, demande].join('\n\n');
await writeFile(new URL('livre-colonnes-couverture.md', root), prompt + '\n');
if (!process.argv.includes('--execute')) { console.log('Prompt préparé ; aucun appel réseau.'); process.exit(0); }
for (const endpoint of [ENDPOINTS.llmSubmit, ENDPOINTS.llmResult]) {
    const u = new URL(endpoint);
    if (u.origin !== 'https://n8n-caramel.osc-fr1.scalingo.io' || !/^\/webhook\/caramel\/llm\/(submit|result)-bas$/.test(u.pathname)) throw Error('Service bas requis');
}
const response = await fetch(ENDPOINTS.llmSubmit, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, model: 'mistral-small-4-119b', stats: 'skip' }), signal: AbortSignal.timeout(30000) });
if (!response.ok) throw Error('Soumission HTTP ' + response.status);
const { taskId } = await response.json(); if (!taskId) throw Error('Tâche absente');
console.log('Sonde livre soumise sur bas'); const start = Date.now(); let result;
while (Date.now() - start < 240000) {
    await new Promise(r => setTimeout(r, 4000));
    const response = await fetch(ENDPOINTS.llmResult + '?taskId=' + encodeURIComponent(taskId), { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('Lecture HTTP ' + response.status);
    const data = await response.json();
    if (data.status === 'done') { result = data; break; }
    if (data.status === 'error') throw Error('Génération échouée');
}
if (!result) throw Error('Délai dépassé');
const data = JSON.parse(String(result.content).replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, ''));
await writeFile(new URL('resultats/InteractiveBook.json', root), JSON.stringify(data, null, 2) + '\n');
const row = data.chapters?.[0]?.content?.find(b => b.type === 'row');
const cards = row?.columns?.[1]?.content?.find(b => /Dialogcards/.test(b.library || ''));
const tests = { unePage: data.chapters?.length === 1, colonnes: row?.columns?.map(c => c.width).join() === '35,65', cartes: cards?.dialogs?.length === 3, couverture: data.cover?.enabled === true && !data.cover.media, progressionManuelle: data.progressAuto === false, repriseDesactivee: data.enableRetry === false, sommaireFerme: data.showTableOfContents === false };
await writeFile(new URL('resultats/InteractiveBook-preuve.json', root), JSON.stringify({ date: new Date().toISOString(), service: 'bas', modelRequested: 'mistral-small-4-119b', modelReturned: result.model || null, seconds: Math.round((Date.now() - start) / 1000), tests, rag: false, stats: 'skip' }, null, 2) + '\n');
if (Object.values(tests).some(v => !v)) throw Error('Contrat non respecté : ' + JSON.stringify(tests));
console.log(tests);
