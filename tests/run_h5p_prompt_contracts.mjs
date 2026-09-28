/** Vérifie les prompts réellement assemblés : 27 H5P, 12 langues, deux modes.
 * Aucun appel IA. Contrôle les contradictions livre/vidéo et les variables résolues.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url).pathname;
const { chromium } = createRequire(new URL('./roundtrip/package.json', import.meta.url))('playwright');
const prefixes = [...readFileSync(root + 'js/services/prompt-generator.js', 'utf8').matchAll(/prefix: '(prompt_[^']+)'/g)].map(m => m[1]).filter(p => !p.startsWith('prompt_elea_'));
const languages = ['fr', 'en', 'es', 'de', 'it', 'nl', 'pt', 'ar', 'zh', 'jp', 'el', 'br'];
const origin = 'http://127.0.0.1:8193';
const server = spawn('python3', ['tests/serveur-statique.py', '8193', '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
try {
    let ready = false;
    for (let n = 0; n < 100; n++) {
        try { ready = (await fetch(origin + '/index.html')).ok; } catch { /* Serveur en démarrage. */ }
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('Serveur local indisponible');
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await page.route(origin + '/__prompt_probe__.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="fr"><body></body></html>' }));
    await page.goto(origin + '/__prompt_probe__.html', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async ({ prefixes, languages }) => {
        const i18n = await import('/js/core/translation.js');
        const { buildActivityPrompt } = await import('/js/services/prompt-generator.js');
        let prompts = 0;
        const failures = [];
        const check = (ok, message) => { if (!ok) failures.push(message); };
        check(prefixes.length === 27, '27 familles H5P attendues');
        for (const lang of languages) {
            await i18n.loadTranslations(lang);
            const translations = i18n.translations;
            for (const prefix of prefixes) for (const count of ['', '4']) {
                const prompt = buildActivityPrompt(prefix, { qui: 'Enseignant', quoi: 'Capitales', niveau: 'Collège', nombreQuestions: count, ocrContent: 'France : Paris.', isAdvanced: !!count });
                prompts++;
                for (const section of ['structure_json', 'exemple_rendu']) check(!!translations[prefix + '_' + section] && prompt.includes(translations[prefix + '_' + section]), `${lang}/${prefix}/${count} : ${section}`);
                check(!/\[(QUI|QUOI|NIVEAU|NOMBRE_ELEMENTS|RAG)\]|\|\|/.test(prompt), `${lang}/${prefix}/${count} : variable ou alternative non résolue`);
            }
            for (const count of [1, 2, 3, 4]) {
                const prompt = buildActivityPrompt('prompt_interactive_book', { nombreQuestions: count, isAdvanced: true });
                const numberLine = prompt.split('\n').find(l => /chapitre|chapter|capítulo|Kapitel|capitoli|hoofdstuk|pennad|κεφάλαι|فصول|章/.test(l));
                check(numberLine && new RegExp('(^|[^0-9])' + Math.max(3, count) + '([^0-9]|$)').test(numberLine), `${lang}/livre/${count} : minimum trois chapitres`);
            }
            const video = translations.prompt_interactive_video_structure_json;
            check(video.split('\n').find(l => l.startsWith('- `pause`'))?.includes('`false`'), `${lang}/vidéo : pause:false permis dans la structure`);
        }
        return { prompts, languages: languages.length, activities: prefixes.length, failures };
    }, { prefixes, languages });
    console.log(JSON.stringify(result, null, 2));
    if (result.failures.length) process.exitCode = 1;
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
