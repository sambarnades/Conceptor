/**
 * generer-sonde-page-images.mjs — Sondes d'aller-retour pour les images envoyées
 * depuis l'ordinateur dans une Page ou un Livre (29 sept. 2026).
 *
 * Aucun module de parcours n'est annoncé avant son aller-retour sur plateforme
 * (D24 du PRD) : ce script fabrique les fichiers à importer POUR DE VRAI, par le
 * pipeline de production (widget image de l'éditeur → `construireFichiersActivite`
 * → `fichiersMonoActivite` / `assemblerParcours` → `createMbz`), sans IA :
 *
 *   • sonde-page-images.mbz          une Page seule, cinq images jointes dans les
 *                                    quatre blocs qui en portent (#08, #09, #13, #16),
 *                                    un PNG transparent et une photo JPEG ;
 *   • sonde-livre-images.mbz         un Livre seul, images dans le chapitre 2 ;
 *   • sonde-parcours-page-images.mbz un cours : la même Page et le même Livre,
 *                                    octets rangés comme l'atelier les range ;
 *   • sonde-page-images.md           la liste de ce qu'il faut regarder après
 *                                    restauration.
 *
 * Le titre de chaque activité porte l'heure de fabrication : c'est ce qu'on lit
 * dans la plateforme après l'import pour savoir quel fichier on a vraiment importé.
 *
 * Lancement : node scripts/generer-sonde-page-images.mjs [--sortie=<dossier>] [--plateforme=elea|magistere|moodle]
 * Sortie par défaut : `tests/.sondes-elea/` (ignoré par git : régénérable).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(join(ROOT, 'tests/roundtrip/package.json'))('playwright');
const PORT = 8175;
const arg = n => (process.argv.slice(2).find(a => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=') || null;
const SORTIE = resolve(ROOT, arg('sortie') || 'tests/.sondes-elea');
const PLATEFORME = arg('plateforme') || 'elea';
const HORODATAGE = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');

const serveur = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
let navigateur;
try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    navigateur = await chromium.launch();
    const page = await navigateur.newPage();
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await page.goto(`http://127.0.0.1:${PORT}/index.html`);
    await page.waitForSelector('#parcours-button');

    const r = await page.evaluate(async ({ HORODATAGE, PLATEFORME }) => {
        const { loadMoodleLibs } = await import('/js/core/lib-loader.js');
        await loadMoodleLibs();
        const { processBackgroundImage } = await import('/js/h5p/image-manager.js');
        const { construireFichiersActivite, fichiersMonoActivite } = await import('/js/moodle/mono-activity-files.js');
        const { createMbz } = await import('/js/moodle/moodle-creator.js');
        const { recueillirMedias } = await import('/js/parcours/sources.js');
        const { assemblerParcours } = await import('/js/parcours/parcours-builder.js');
        const { translations } = await import('/js/core/translation.js');

        // Exactement ce que rend le widget de l'éditeur (renderImageField, processeur « fond »).
        const envoyer = async (blob, nom) => {
            const e = await processBackgroundImage(new File([blob], nom, { type: blob.type }));
            return { path: e.h5pPath, mime: e.mime, width: e.width, height: e.height, dataURL: e.dataURL };
        };
        // Une photo (domaine public, cf. tests/fixtures/export-images/CREDITS.md) et un
        // schéma PNG à fond TRANSPARENT : la transparence doit survivre jusqu'à la plateforme.
        const photo = await envoyer(await (await fetch('/tests/fixtures/export-images/van-gogh-nuit-etoilee.jpg')).blob(), 'nuit-etoilee.jpg');
        const c = document.createElement('canvas'); c.width = 640; c.height = 360;
        const g = c.getContext('2d');
        g.strokeStyle = '#1e3a8a'; g.lineWidth = 6; g.strokeRect(20, 20, 600, 320);
        g.fillStyle = 'rgba(245, 158, 11, 0.85)'; g.beginPath(); g.arc(200, 180, 110, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(16, 185, 129, 0.85)'; g.fillRect(340, 90, 220, 180);
        g.fillStyle = '#111827'; g.font = 'bold 34px sans-serif'; g.fillText('PNG transparent', 180, 330);
        const schema = await envoyer(await new Promise(ok => c.toBlob(ok, 'image/png')), 'schema.png');

        const titre = `Sonde images de Page — ${HORODATAGE}`;
        const blocsPage = () => [
            { type: '#01_hero_header', data: { title: titre, subtitle: 'Chaque image ci-dessous est un FICHIER joint à la Page, pas une adresse.' } },
            { type: '#08_monuments_grid', data: { title: '#08 — Grille de cartes', cards: [
                { img_src: '', img_alt: 'Schéma aux formes colorées, fond transparent', caption: 'PNG transparent : le fond de la carte doit se voir à travers.', title: 'Carte 1 — PNG', text: 'Image envoyée depuis l\'ordinateur (PNG).', img_file: schema },
                { img_src: '', img_alt: 'La Nuit étoilée, Van Gogh', caption: 'Photo JPEG.', title: 'Carte 2 — JPEG', text: 'Image envoyée depuis l\'ordinateur (JPEG).', img_file: photo },
            ] } },
            { type: '#09_figures_comparison', data: { title: '#09 — Comparaison de deux figures',
                left: { img_src: '', img_alt: 'La Nuit étoilée', caption: 'Gauche : même photo, posée UNE seule fois dans le backup.', img_file: photo },
                right: { img_src: '', img_alt: 'Schéma transparent', caption: 'Droite : même schéma, posé une seule fois.', img_file: schema },
                text: 'Deux blocs citent la même image : un seul fichier dans la zone de la Page.' } },
            { type: '#13_monument_sheet_long', data: { title: '#13 — Fiche document long', img_src: '', img_alt: 'La Nuit étoilée', img_file: photo,
                sections: [{ subtitle: 'À vérifier', text: 'L\'image s\'affiche au-dessus de cette section, servie par pluginfile.php.' }] } },
            { type: '#16_method_image_desc', data: { title: '#16 — Méthode illustrée', steps: ['Ouvrir l\'image dans un nouvel onglet.', 'Lire son adresse : …/mod_page/content/…/image-….png'],
                img_src: '', img_alt: 'Schéma transparent', img_file: schema, caption: 'Adresse attendue : pluginfile.php/[contexte]/mod_page/content/[révision]/image-[empreinte].png' } },
        ];
        const pageJson = { title: titre, intro: '', theme: 'elea', blocks: blocsPage() };

        const livreJson = { title: `Sonde images de Livre — ${HORODATAGE}`, intro: '', theme: 'elea', numbering: 1, chapters: [
            { title: 'Chapitre 1 — sans image jointe', subchapter: false, blocks: [
                { type: '#12_context_paragraphs', data: { title: 'Rien à voir ici', paragraphs: ['Ce chapitre ne porte aucune image jointe.'] } }] },
            { title: 'Chapitre 2 — deux images jointes', subchapter: false, blocks: [
                { type: '#16_method_image_desc', data: { title: 'Schéma', steps: ['Adresse attendue : …/mod_book/chapter/[id du chapitre]/image-….png'], img_src: '', img_alt: 'Schéma transparent', img_file: schema, caption: 'PNG transparent' } },
                { type: '#13_monument_sheet_long', data: { title: 'Photo', img_src: '', img_alt: 'La Nuit étoilée', img_file: photo, sections: [{ subtitle: 'Note', text: 'Photo JPEG jointe au chapitre 2.' }] } }] },
        ] };

        const log = translations.millionnaire_backup_log || 'Backup created automatically by Caramel\n';
        const mono = async (type, json) => {
            const res = await construireFichiersActivite(type, json, { titreParDefaut: json.title });
            const files = await fichiersMonoActivite(res);
            files['moodle_backup.log'] = log;
            return { octets: Array.from(await createMbz(files)), fichiers: res.paquet.zones.map(z => `${res.paquet.component}/${z.filearea}/${z.itemid} : ${z.fichiers.map(f => f.filename).join(', ')}`) };
        };
        const pageSeule = await mono('Page', pageJson);
        const livreSeul = await mono('Livre', livreJson);

        // Le cours : les octets rangés dans `carte.medias`, comme après « Enregistrer » dans l'atelier.
        const sansImages = json => JSON.parse(JSON.stringify(json, (k, v) => (k === 'img_file' ? undefined : v)));
        const cartePage = { id: 'c1', module: 'Page', titre: `Page illustrée — ${HORODATAGE}`, consigne: 'Lisez la page.', duree: 10, palier: 'decouverte', contenu: sansImages(pageJson) };
        const carteLivre = { id: 'c2', module: 'Livre', titre: `Livre illustré — ${HORODATAGE}`, consigne: 'Lisez le livre.', duree: 10, palier: 'decouverte', contenu: sansImages(livreJson) };
        const plan = { titre: `Sonde parcours images — ${HORODATAGE}`, objectifGeneral: 'Vérifier les images jointes aux Pages et aux Livres d\'un cours.',
            etapes: [{ id: 'e1', titre: 'Pages et livres illustrés', cartes: [cartePage, carteLivre] }] };
        Object.assign(cartePage, await recueillirMedias(cartePage, { ...pageJson, title: cartePage.titre }, plan));
        Object.assign(carteLivre, await recueillirMedias(carteLivre, { ...livreJson, title: carteLivre.titre }, plan));
        const cours = await assemblerParcours(plan, { platformId: PLATEFORME });
        return {
            page: pageSeule, livre: livreSeul,
            parcours: { octets: Array.from(cours.bytes), exclues: cours.exclues, activites: cours.activites.map(a => a.moduleName) },
            images: { photo: [photo.width, photo.height, photo.mime], schema: [schema.width, schema.height, schema.mime] },
        };
    }, { HORODATAGE, PLATEFORME });
    if (erreurs.length) throw new Error(erreurs.join(' | '));
    if (r.parcours.exclues.length) throw new Error('carte écartée : ' + JSON.stringify(r.parcours.exclues));

    await mkdir(SORTIE, { recursive: true });
    const ecrits = [
        ['sonde-page-images.mbz', r.page.octets],
        ['sonde-livre-images.mbz', r.livre.octets],
        ['sonde-parcours-page-images.mbz', r.parcours.octets],
    ];
    for (const [nom, octets] of ecrits) await writeFile(join(SORTIE, nom), Buffer.from(octets));

    const fiche = `# Sonde — images envoyées dans une Page et un Livre (${HORODATAGE})

Fabriquée par \`node scripts/generer-sonde-page-images.mjs\` (plateforme du parcours : ${PLATEFORME}).
Images : photo ${r.images.photo.join(' × ').replace(/ × image/, ', image')} ; schéma ${r.images.schema.join(' × ').replace(/ × image/, ', image')}.

| Fichier | Contenu | Fichiers joints |
|---|---|---|
| \`sonde-page-images.mbz\` | Page seule (${(r.page.octets.length / 1024).toFixed(0)} Ko) | ${r.page.fichiers.join(' ; ')} |
| \`sonde-livre-images.mbz\` | Livre seul (${(r.livre.octets.length / 1024).toFixed(0)} Ko) | ${r.livre.fichiers.join(' ; ')} |
| \`sonde-parcours-page-images.mbz\` | Cours : ${r.parcours.activites.join(', ')} (${(r.parcours.octets.length / 1024).toFixed(0)} Ko) | les mêmes, joints après l'assemblage |

## À vérifier après restauration (Éléa, puis Magistère si possible)

**Page seule** — restaurer \`sonde-page-images.mbz\` (dans un cours de test).

1. La restauration va au bout, sans avertissement « fichier manquant » ni erreur.
2. Le titre de la Page porte l'heure ci-dessus : c'est bien ce fichier qui a été importé.
3. Les QUATRE blocs illustrés montrent leur image : #08 (carte 1 PNG, carte 2 photo),
   #09 (gauche photo, droite schéma), #13 (photo), #16 (schéma).
4. Le PNG est TRANSPARENT : le fond de la carte se voit autour des formes (pas de fond blanc ni noir).
5. Clic droit sur une image → « Ouvrir l'image dans un nouvel onglet » : l'adresse est
   \`…/pluginfile.php/<contexte>/mod_page/content/<révision>/image-<empreinte>.png|jpg\`
   — ni une adresse \`data:\`, ni une adresse extérieure.
6. « Modifier les paramètres » de la Page : les images apparaissent dans l'éditeur de texte ; le
   gestionnaire de fichiers de l'éditeur (TinyMCE : Outils → « Gérer les fichiers ») liste
   exactement DEUX fichiers \`image-….png\` et \`image-….jpg\` (la même image citée deux fois
   n'est posée qu'une fois).
7. Vue élève (« Changer de rôle… » → Étudiant, ou un compte élève) : les images s'affichent.
8. Enregistrer la Page sans rien changer, puis la rouvrir : les images sont toujours là.
9. (Facultatif) Sauvegarder la Page depuis la plateforme, restaurer ailleurs : les images suivent.

**Livre seul** — restaurer \`sonde-livre-images.mbz\`.

10. Chapitre 1 : aucune image. Chapitre 2 : le schéma PNG et la photo s'affichent.
11. Adresse d'une image du chapitre 2 : \`…/pluginfile.php/<contexte>/mod_book/chapter/<id du chapitre>/image-….png\`.
12. Modifier le chapitre 2 : les deux images sont dans son gestionnaire de fichiers ; le chapitre 1 n'en a aucune.

**Parcours** — restaurer \`sonde-parcours-page-images.mbz\` comme un NOUVEAU cours.

13. Le cours se restaure sans erreur ; la Page et le Livre sont dans la section « Pages et livres illustrés ».
14. Mêmes contrôles 3 à 7 sur la Page du cours, 10 et 11 sur son Livre.

## À reporter

Le résultat va dans \`docs/PRD_PARCOURS.md\` (§ 11, journal ; D88 à cocher « aller-retour
validé ») — y compris un échec, avec sa capture. Tant que ce n'est pas fait, l'envoi d'image
des Pages et Livres n'est pas annoncé (D24).
`;
    await writeFile(join(SORTIE, 'sonde-page-images.md'), fiche);
    for (const [nom, octets] of ecrits) console.log(`✓ ${join(SORTIE, nom)} — ${(octets.length / 1024).toFixed(0)} Ko`);
    console.log(`✓ ${join(SORTIE, 'sonde-page-images.md')}`);
    console.log(`  Page : ${r.page.fichiers.join(' ; ')}`);
    console.log(`  Livre : ${r.livre.fichiers.join(' ; ')}`);
    console.log(`  Parcours : ${r.parcours.activites.join(', ')}`);
} finally {
    await navigateur?.close();
    serveur.kill('SIGTERM');
}
