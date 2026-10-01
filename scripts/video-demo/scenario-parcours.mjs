/**
 * Le scénario de la deuxième vidéo : « Créer un parcours avec Caramel », pas à pas
 * (`node scripts/video-demo/tourner.mjs --video=parcours`, cf. video.mjs).
 *
 * Même contrat que `scenario.mjs` (voix, phrases clés, gestes calés sur les phrases,
 * réponses du modèle enregistrées puis rejouées), même ton : une démonstration pour
 * des collègues, qui montre l'outil tel qu'il est et dit les durées réelles.
 *
 * **Le fil.** Un professeur de SVT de 5e joint son cours sur la respiration et part de
 * la trame « Réviser avant l'évaluation », qui commence par un test. Le plan se relit
 * et se modifie ; puis on DIFFÉRENCIE ce parcours linéaire en ouvrant deux chemins
 * après ce test. Fabrication, livraison, et reprise du scénario dans Caramel.
 */

export const QUI = 'Professeur de SVT, classe de 5e';
export const QUOI = 'La respiration chez l’être humain';
export const NIVEAU = '5e';
export const COURS = 'tests/fixtures/video-demo/Cours - La respiration.docx';

const LOGO = 'assets/images/branding/logo_caramel.svg';

/** « 1 minute 05 », « 24 secondes ». */
export function duree(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s} secondes`;
    const m = Math.floor(s / 60), r = s % 60;
    return r ? `${m} minute${m > 1 ? 's' : ''} ${r}` : `${m} minute${m > 1 ? 's' : ''}`;
}
const dureeCourte = ms => {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};
/**
 * La n-ième étape du plan (1 = la première après l'accueil), comme sélecteur et comme
 * locator : les identifiants (`e…`) sont posés par Caramel, on ne les devine pas.
 */
async function etape(page, n) {
    const id = await page.locator('#pc-atelier section.pc-etape[data-etape]:not([data-etape="accueil"]):not([data-etape="fin"])')
        .nth(n - 1).getAttribute('data-etape');
    const sel = `section.pc-etape[data-etape="${id}"]`;
    return { sel, loc: page.locator(sel) };
}

/** L'étape d'entraînement, où l'on montre les réglages d'une activité. */
const etape3 = page => etape(page, 3);

function noteAttente(libelle, ms) {
    return ms ? `${libelle} : <b>${dureeCourte(ms)}</b> en réalité — raccourci au montage` : '';
}

export const SCENES = [
    {
        id: 'titre',
        chapitre: null,
        voix: () => `Cette vidéo montre, pas à pas, comment créer un parcours avec Caramel : du formulaire de départ jusqu’au fichier à importer dans votre plateforme.`,
        async jouer({ m }) {
            await m.pause(200);
        },
    },
    {
        id: 'demande',
        cles: [
            [0, 'Le point de départ : qui vous êtes, ce que vous voulez travailler'],
            [1, 'En mode Avancé : le niveau de la classe'],
        ],
        chapitre: '1 · Préparer',
        voix: () => `Tout part du formulaire de l’accueil, le même que pour une activité : qui vous êtes, et ce que vous voulez travailler. `
            + `Ici, un professeur de SVT de cinquième, sur la respiration. En mode Avancé, on précise aussi le niveau de la classe.`,
        async jouer({ m, page, phrase }) {
            await m.carton(null);
            await m.pause(700);
            await m.taper(page.locator('#qui'), QUI);
            await m.pause(250);
            await m.taper(page.locator('#quoi'), QUOI);
            await phrase(1);
            await m.cliquer(page.locator('.mode-tab[data-mode="advanced"]'), { apres: 600 });
            await m.taper(page.locator('#niveau'), NIVEAU);
        },
    },
    {
        id: 'document',
        cles: [
            [0, 'Joindre son propre cours : il fait référence'],
            [1, 'Toutes les activités du parcours s’appuient dessus'],
        ],
        voix: () => `On peut joindre son propre cours, en Word, en PDF ou en texte : il fait alors référence, avant les programmes officiels. `
            + `Toutes les activités du parcours s’appuieront dessus.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('#rag-section-container', { ms: 1100, position: 0.2 });
            await m.survoler(page.locator('.drag-drop-area'), { dy: 0.35, ms: 700 });
            await page.setInputFiles('#pdfUpload', COURS);
            await page.waitForFunction(() => /Chapitre 3/.test(document.getElementById('ocr-output')?.textContent || ''), null, { timeout: 30000 });
            await phrase(1);
            await m.survoler(page.locator('#pdf-tags-container'), { dx: 0.2, ms: 700 });
            await m.pause(600);
        },
    },
    {
        id: 'commutateur',
        cles: [
            [0, 'Sous le formulaire : « Un parcours »'],
            [1, 'Quatre étapes : cadrage, plan, fabrication, livraison'],
        ],
        voix: () => `Sous le formulaire, on choisit « Un parcours » au lieu d’« Une activité ». `
            + `L’atelier s’ouvre, en quatre étapes : le cadrage, le plan, la fabrication et la livraison.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('#parcours-button', { ms: 1000, position: 0.35 });
            await m.cliquer(page.locator('#parcours-button'), { apres: 900 });
            await phrase(1);
            await m.defiler('#pc-atelier', { ms: 1000, position: 0.02 });
            await m.survoler(page.locator('#pc-steps'), { dx: 0.1, ms: 500 });
            await m.survoler(page.locator('#pc-steps'), { dx: 0.9, ms: 1400 });
        },
    },
    {
        id: 'cadrage',
        cles: [
            [0, 'Le document joint est rappelé en tête'],
            [1, 'Plateforme, déroulement, ampleur'],
            [2, 'D’abord un même chemin pour tous'],
        ],
        voix: () => `Le document joint est rappelé en tête du cadrage. `
            + `On indique ensuite la plateforme, le déroulement et l’ampleur : ici Éléa, en classe et à distance, sur deux à trois séances. `
            + `Pour commencer, tous les élèves suivront le même chemin.`,
        async jouer({ m, page, phrase }) {
            await m.survoler(page.locator('.pc-context__note').first(), { dx: 0.3, ms: 700 });
            await phrase(1);
            await m.survoler(page.locator('.pc-choice[data-choix="elea"]'), { ms: 600 });
            await m.cliquer(page.locator('.pc-choice[data-choix="hybride"]'), { apres: 500 });
            await m.cliquer(page.locator('.pc-choice[data-choix="moyenne"]'), { apres: 500 });
            await phrase(2);
            await m.survoler(page.locator('.pc-choice[data-choix="lineaire"]'), { dy: 0.3, ms: 800 });
        },
    },
    {
        id: 'trames',
        cles: [
            [0, 'Une trame : un déroulé type, adapté au sujet par l’IA'],
            [1, 'D’autres modèles, rangés par famille'],
            [2, '« Réviser avant l’évaluation » : un test d’abord'],
        ],
        voix: () => `Vient le choix d’une trame : un déroulé type, que l’IA adaptera à votre sujet. Chaque carte montre ses étapes et les activités prévues. `
            + `D’autres modèles sont rangés plus bas, par famille : pour une séance, une séquence, un projet. `
            + `On prend « Réviser avant l’évaluation » : il commence par un test, qui permet de repérer ce que chacun sait déjà.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('.pc-trames', { ms: 1100, position: 0.15 });
            const cartes = page.locator('article.pc-trame');
            await m.survoler(cartes.first(), { dy: 0.3, ms: 700 });
            await m.survoler(cartes.nth(1), { dy: 0.3, ms: 700 });
            await phrase(1);
            await m.cliquer(page.locator('.pc-trames__autres'), { apres: 900 });
            await m.defiler('.pc-trames__autres', { ms: 900, position: 0.25 });
            await m.pause(1200);
            await m.cliquer(page.locator('.pc-trames__autres'), { apres: 600 });
            await phrase(2);
            const choisie = page.locator('article.pc-trame', { hasText: 'Réviser avant l\'évaluation' });
            await m.defiler('.pc-trames', { ms: 900, position: 0.15 });
            await m.cliquer(choisie.locator('.pc-trame__select'), { apres: 700 });
            await m.survoler(choisie, { dy: 0.7, ms: 900 });
        },
    },
    {
        id: 'plan-attente',
        cles: [
            [0, '« Partir du modèle » : le déroulé tout de suite, sans IA'],
            [1, '« Composer le plan » : l’IA propose un plan sur votre sujet'],
        ],
        ia: true,
        voix: ({ d }) => `Deux départs sont possibles. « Partir du modèle » ouvre aussitôt le déroulé de la trame, sans IA, à remplir vous-même. `
            + `« Composer le plan » demande à l’IA un plan sur votre sujet et votre cours`
            + (d['plan-attente'] ? ` : ici en ${duree(d['plan-attente'])}, raccourcies au montage.` : '.'),
        async jouer({ m, page, phrase, d }) {
            await m.survoler(page.locator('#pc-modele'), { ms: 800 });
            await phrase(1);
            await m.cliquer(page.locator('#pc-cta'), { apres: 300 });
            if (d['plan-attente']) await m.note(noteAttente('Composition du plan', d['plan-attente']));
            await page.locator('.pc-etapes').first().waitFor({ state: 'visible', timeout: 900000 });
            await m.pause(500);
            await m.note(null);
        },
    },

    /* ---------------- 2 · Relire le plan ---------------- */
    {
        id: 'plan-vue',
        cles: [
            [0, 'Rien n’est encore généré : tout se relit et se modifie'],
            [1, 'Le bandeau résume le parcours'],
        ],
        chapitre: '2 · Relire le plan',
        voix: () => `Le plan arrive. Rien n’est encore généré : le titre et l’objectif se modifient, comme tout ce qui suit. `
            + `Le bandeau résume le parcours : quatre étapes, six activités, environ une heure.`,
        async jouer({ m, page, phrase }) {
            await m.defiler(0, { ms: 900 });
            await m.survoler(page.locator('.pc-title-input').first(), { dx: 0.2, ms: 700 });
            await m.survoler(page.locator('.pc-plan-objectif').first(), { dx: 0.3, ms: 700 });
            await phrase(1);
            await m.survoler(page.locator('.pc-summary').first(), { dx: 0.15, ms: 600 });
            await m.survoler(page.locator('.pc-summary').first(), { dx: 0.85, ms: 1300 });
        },
    },
    {
        id: 'relecture',
        cles: [
            [0, '« Relecture du plan » : des repères, rien de bloquant'],
            [1, 'Ici, rien à signaler'],
        ],
        voix: () => `« Relecture du plan » signale ce qui mérite un coup d’œil : une étape sans objectif, l’absence de vérification des acquis, une durée déséquilibrée. Ce sont des repères : rien n’est bloqué. `
            + `Ici, rien à signaler ; « Voir tous les repères » montre ce qui a été vérifié.`,
        async jouer({ m, page, phrase }) {
            await m.survoler(page.locator('.pc-relecture').first(), { dx: 0.2, ms: 700 });
            await phrase(1);
            await m.cliquer(page.locator('.pc-relecture__plier').first(), { apres: 900 });
            await m.defiler('.pc-relecture', { ms: 900, position: 0.12 });
            await m.pause(2200);
            await m.cliquer(page.locator('.pc-relecture__plier').first(), { apres: 500 });
        },
    },
    {
        id: 'reglages',
        cles: [
            [0, 'Les notions du parcours se corrigent'],
            [1, 'Ouvrir les étapes l’une après l’autre ; une carte de progression sur Éléa'],
        ],
        voix: () => `Les notions que le parcours fait travailler se corrigent ou se complètent. `
            + `Dans les réglages du cours, on peut ouvrir les étapes l’une après l’autre, et, sur Éléa, poser une carte de progression en tête du cours.`,
        async jouer({ m, page, phrase }) {
            const notions = page.locator('details.pc-plan-notions');
            await m.cliquer(notions.locator('summary'), { dx: 0.15, apres: 700 });
            await m.survoler(notions.locator('.pc-notion__texte').nth(2), { ms: 700 });
            await m.survoler(notions.locator('.pc-notion__champ--ajout'), { dx: 0.3, ms: 700 });
            await m.cliquer(notions.locator('summary'), { dx: 0.15, apres: 400 });
            await phrase(1);
            const reglages = page.locator('details.pc-plan-reglages');
            await m.cliquer(reglages.locator('summary'), { dx: 0.15, apres: 700 });
            await m.survoler(page.locator('label:has(#pc-reglage-progression), #pc-reglage-progression').first(), { ms: 800 });
            await m.survoler(page.locator('label:has(#pc-reglage-carte), #pc-reglage-carte').first(), { ms: 900 });
            await m.cliquer(reglages.locator('summary'), { dx: 0.15, apres: 400 });
        },
    },
    {
        id: 'etapes',
        cles: [
            [0, 'Une étape = une section du cours'],
            [1, 'Déplacer, supprimer, ajouter'],
        ],
        voix: () => `Chaque étape deviendra une section du cours, avec son titre, son objectif et un texte d’introduction lu par les élèves. `
            + `Les flèches la déplacent ; on peut aussi la supprimer, ou en ajouter une en bas du plan.`,
        async jouer({ m, page, phrase }) {
            const { sel, loc: bloc } = await etape3(page);
            await m.defiler(sel, { ms: 1200, position: 0.12 });
            await m.survoler(bloc.locator('.pc-etape__titre'), { dx: 0.2, ms: 600 });
            await m.survoler(bloc.locator('.pc-etape__objectif'), { dx: 0.2, ms: 600 });
            await m.survoler(bloc.locator('.pc-etape__intro'), { dx: 0.2, ms: 700 });
            await phrase(1);
            await m.survoler(bloc.locator('[aria-label="Monter cette étape"]'), { ms: 600 });
            await m.survoler(bloc.locator('[aria-label="Supprimer cette étape"]'), { ms: 700 });
        },
    },
    {
        id: 'activite',
        cles: [
            [0, 'Une activité : titre, objectif, durée, consigne'],
            [1, 'Supprimée par erreur ? « Annuler la modification »'],
        ],
        voix: () => `Chaque activité aussi : son titre, son objectif, sa durée, et la consigne donnée à l’IA, sous « Consigne et palier ». `
            + `Supprimée par erreur ? « Annuler la modification » la remet aussitôt.`,
        async jouer({ m, page, phrase }) {
            const carte = (await etape3(page)).loc.locator('article.pc-carte').first();
            await m.survoler(carte.locator('.pc-carte__titre'), { dx: 0.3, ms: 600 });
            await m.survoler(carte.locator('.pc-carte__objectif'), { dx: 0.3, ms: 600 });
            const dureeAct = carte.locator('.pc-duree__input');
            await m.retaper(dureeAct, String(await dureeAct.inputValue()));
            await m.cliquer(carte.locator('.pc-carte__details summary'), { dx: 0.1, apres: 1400 });
            await m.cliquer(carte.locator('.pc-carte__details summary'), { dx: 0.1, apres: 300 });
            await phrase(1);
            await m.cliquer(carte.locator('[aria-label="Supprimer cette activité"]'), { apres: 1100 });
            await m.cliquer(page.locator('.pc-annulation button'), { apres: 900 });
        },
    },
    {
        id: 'mosaique',
        cles: [
            [0, 'Changer le type dans la mosaïque'],
            [1, 'Les modules de la plateforme : l’IA n’écrit que la consigne'],
            [2, 'Les mots croisés deviennent un mur de post-it'],
        ],
        voix: () => `Le type d’une activité se change dans cette mosaïque. En haut, les activités que Caramel rédige entièrement. `
            + `En bas, les modules de la plateforme, comme le forum ou le mur de post-it : l’IA n’en écrit que la consigne, le contenu viendra de la classe. `
            + `Ici, les mots croisés deviennent un mur de post-it, où chacun note ce qui reste flou pour lui.`,
        async jouer({ m, page, phrase }) {
            const carte = (await etape3(page)).loc.locator('article.pc-carte').nth(1);
            await m.cliquer(carte.locator('.pc-choix'), { apres: 1000 });
            const fenetre = page.locator('dialog.pc-mosaique');
            await m.survoler(fenetre.locator('.pc-tuile').nth(3), { ms: 700 });
            await phrase(1);
            await m.defiler('dialog.pc-mosaique .pc-mosaique__groupe:last-of-type', { conteneur: 'dialog.pc-mosaique', ms: 1100, position: 0.1 });
            await m.survoler(fenetre.locator('.pc-tuile', { hasText: 'Forum' }), { ms: 800 });
            await phrase(2);
            await m.taper(fenetre.locator('.pc-mosaique__filtre'), 'post');
            await m.pause(600);
            await m.cliquer(fenetre.locator('.pc-tuile', { hasText: 'Mur de post-it' }), { apres: 1000 });
            await m.survoler(carte, { dx: 0.3, dy: 0.3, ms: 800 });
        },
    },

    /* ---------------- 3 · Différencier ---------------- */
    {
        id: 'chemins-ouvrir',
        cles: [
            [0, 'Pour différencier, il suffit d’un test'],
            [1, '« Ouvrir des chemins selon ce test »'],
        ],
        chapitre: '3 · Différencier',
        voix: () => `Ce parcours est le même pour tous. Pour le différencier, il suffit d’un test : le quiz de la première étape fera l’affaire. `
            + `Juste en dessous, « Ouvrir des chemins selon ce test » : l’étape suivante se décline alors en plusieurs chemins.`,
        async jouer({ m, page, phrase }) {
            const { sel, loc: premiere } = await etape(page, 1);
            await m.defiler(sel, { ms: 1400, position: 0.15 });
            await m.survoler(premiere.locator('article.pc-carte').first(), { dx: 0.3, dy: 0.3, ms: 800 });
            await phrase(1);
            await m.cliquer(premiere.locator('.pc-etape__chemins'), { apres: 1300 });
        },
    },
    {
        id: 'chemins-deux',
        cles: [
            [0, 'Deux chemins : « Retirer un chemin »'],
            [1, 'L’étape de rappel devient « Renforcer »'],
            [2, '« Approfondir » reprend ses types : on écrit les titres'],
        ],
        voix: () => `Trois chemins sont proposés ; on en garde deux, avec « Retirer un chemin ». `
            + `L’étape de rappel devient le chemin « Renforcer ». `
            + `Le chemin « Approfondir » reprend ses types d’activité, sans texte : on écrit leurs titres, l’IA rédigera le reste.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('.pc-aiguillage', { ms: 1200, position: 0.13 });
            await m.cliquer(page.locator('.pc-aiguillage__actions button', { hasText: 'Retirer un chemin' }), { apres: 1200 });
            await phrase(1);
            await m.defiler('.pc-chemins', { ms: 1200, position: 0.13 });
            await m.survoler(page.locator('.pc-chemin').first(), { dy: 0.3, ms: 900 });
            await phrase(2);
            const appro = page.locator('.pc-chemin').last();
            await m.retaper(appro.locator('.pc-chemin__titre'), 'Aller plus loin', { delai: 38 });
            const cartes = appro.locator('article.pc-carte');
            await m.retaper(cartes.nth(0).locator('.pc-carte__titre'), 'La respiration pendant un effort', { delai: 34 });
            await m.retaper(cartes.nth(1).locator('.pc-carte__titre'), 'Tabac, pollution et poumons', { delai: 34 });
        },
    },
    {
        id: 'aiguillage',
        cles: [
            [0, 'Chaque note au test a la couleur du chemin qu’elle ouvre'],
            [1, '« moins » et « plus » : combien de bonnes réponses pour entrer'],
            [2, 'Seule la première tentative compte'],
        ],
        voix: () => `Sur le plan, chaque note possible au test a une couleur : celle du chemin où elle envoie l’élève. `
            + `Les boutons « moins » et « plus » règlent combien de bonnes réponses il faut pour entrer dans un chemin. `
            + `Seule la première tentative compte.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('.pc-aiguillage', { ms: 1400, position: 0.13 });
            const cases = page.locator('.pc-aiguillage__cases');
            await m.survoler(cases, { dx: 0.08, ms: 700 });
            await m.survoler(cases, { dx: 0.92, ms: 1600 });
            await phrase(1);
            const plus = page.locator('.pc-aiguillage__pas button[data-pas$=":1"]:not([disabled])').last();
            const pas = await plus.getAttribute('data-pas');
            await m.cliquer(plus, { apres: 1100 });
            await m.cliquer(page.locator(`.pc-aiguillage__pas button[data-pas="${pas.replace(/:1$/, ':-1')}"]`), { apres: 800 });
            await phrase(2);
            await m.survoler(page.locator('.pc-aiguillage__aide'), { dx: 0.4, ms: 900 });
        },
    },
    {
        id: 'vue-eleve',
        cles: [
            [0, '« Voir comme un élève » : le cours selon son score'],
            [2, '« L’enseignant » : toutes les sections et leurs conditions'],
        ],
        voix: () => `« Voir comme un élève » montre le cours tel qu’un élève le verra, selon le moment et son score. `
            + `Avec peu de bonnes réponses, il ne voit que « Renforcer » ; avec beaucoup, « Aller plus loin ». `
            + `Et en choisissant « L’enseignant », on voit toutes les sections, avec la condition qui ouvre chacune.`,
        async jouer({ m, page, phrase }) {
            await m.cliquer(page.locator('.pc-aiguillage__voir'), { apres: 900 });
            const fenetre = page.locator('dialog.pc-eleve');
            const bouton = texte => fenetre.locator('.pc-segment__b', { hasText: texte });
            const score = page.locator('#pc-eleve-score');
            const chemin = fenetre.locator('.pc-eleve__section[data-section="chemin"]').first();
            const enHaut = () => m.defiler(0, { conteneur: 'dialog.pc-eleve', ms: 700 });
            await m.cliquer(bouton('Pendant son chemin'), { apres: 500 });
            await phrase(1);
            await m.cliquer(score, { dx: 0.04, apres: 700 });
            await m.survoler(chemin, { dx: 0.3, dy: 0.15, ms: 700 });
            await enHaut();
            await m.cliquer(score, { dx: 0.98, apres: 700 });
            await m.survoler(chemin, { dx: 0.3, dy: 0.15, ms: 700 });
            await phrase(2);
            await enHaut();
            await m.cliquer(bouton('L’enseignant'), { apres: 900 });
            await m.defiler('dialog.pc-eleve .pc-eleve__section[data-section="chemin"]', { conteneur: 'dialog.pc-eleve', ms: 1600, position: 0.2 });
            await m.pause(1800);
            await m.cliquer(fenetre.locator('.pc-eleve__fermer'), { apres: 600 });
        },
    },

    /* ---------------- 4 · Fabriquer et livrer ---------------- */
    {
        id: 'fabrication',
        cles: [
            [0, 'Les activités sont rédigées l’une après l’autre'],
        ],
        chapitre: '4 · Fabriquer et livrer',
        ia: true,
        voix: ({ d }) => `On lance la fabrication : les activités sont rédigées l’une après l’autre, à partir de votre cours`
            + (d.fabrication ? `. Ici, ${duree(d.fabrication)} en réalité, accélérées au montage.` : '.'),
        async jouer({ m, page, d }) {
            await m.defiler(99999, { ms: 1200 });
            await m.cliquer(page.locator('#pc-cta'), { apres: 600 });
            if (d.fabrication) await m.note(noteAttente('Fabrication des activités', d.fabrication));
            await m.defiler('#pc-atelier', { ms: 900, position: 0.02 });
            await page.waitForFunction(() => /Assembler/.test(document.querySelector('#pc-cta')?.textContent || ''), null, { timeout: 1800000 });
            await m.pause(800);
            await m.note(null);
        },
    },
    {
        id: 'fab-relire',
        cles: [
            [0, 'Avant d’assembler : essayer et corriger chaque activité'],
        ],
        voix: () => `Chaque activité se relit avant d’assembler : « Aperçu » pour l’essayer comme un élève, « Modifier le contenu » pour la corriger dans l’éditeur. `
            + `Si elle ne convient pas, « Générer à nouveau » en redemande une autre.`,
        async jouer({ m, page, phrase }) {
            const ligne = page.locator('article.pc-carte--fab', { hasText: 'La respiration pendant un effort' });
            await m.defiler('article.pc-carte--fab:nth-of-type(1)', { ms: 900, position: 0.3 });
            await m.cliquer(ligne.locator('[data-action="apercu"]'), { apres: 1800 });
            const panneau = page.locator('.pc-editeur');
            await m.survoler(panneau.getByRole('button', { name: 'Suivante' }), { ms: 700 });
            await m.cliquer(panneau.getByRole('button', { name: 'Modifier le contenu' }), { apres: 2000 });
            await m.cliquer(panneau.locator('.pc-editeur__fermer'), { apres: 700 });
            await phrase(1);
            await m.survoler(ligne.locator('[data-action="external"]'), { ms: 900 });
        },
    },
    {
        id: 'ia-externe',
        cles: [
            [0, 'Ou une autre IA : copier le prompt, coller la réponse'],
            [1, 'Aucune donnée personnelle d’élève'],
        ],
        voix: () => `Cette fenêtre propose aussi de passer par une autre IA : on copie le prompt, on le colle dans l’IA de son choix, puis on colle sa réponse à droite. `
            + `Dans ce cas, n’y mettez aucune donnée personnelle d’élève.`,
        async jouer({ m, page, phrase }) {
            const ligne = page.locator('article.pc-carte--fab', { hasText: 'La respiration pendant un effort' });
            await m.cliquer(ligne.locator('[data-action="external"]'), { apres: 1100 });
            const fenetre = page.locator('.pc-external');
            await m.survoler(fenetre.locator('#pc-guide-prompt'), { dx: 0.4, dy: 0.3, ms: 800 });
            await m.survoler(fenetre.locator('.copy-prompt-btn').first(), { ms: 700 });
            await m.survoler(fenetre.locator('#pc-guide-reponse'), { dx: 0.4, dy: 0.3, ms: 900 });
            await phrase(1);
            await m.pause(1400);
            await page.keyboard.press('Escape');
            await fenetre.first().waitFor({ state: 'hidden', timeout: 5000 });
            await m.pause(600);
        },
    },
    {
        id: 'livraison',
        cles: [
            [0, 'Un seul fichier .mbz : tout le cours, chemins compris'],
            [1, 'À restaurer dans un cours vide'],
        ],
        voix: () => `« Assembler le parcours » mène à la livraison. Un seul fichier contient tout le cours : sections, activités, et les conditions qui ouvrent chaque chemin. `
            + `Il se restaure dans un cours vide d’Éléa, en trois étapes rappelées ici.`,
        async jouer({ m, page, phrase }) {
            await m.defiler(99999, { ms: 1000 });
            await m.cliquer(page.locator('#pc-cta'), { apres: 300 });
            await page.waitForFunction(() => /Livraison/.test(document.querySelector('#pc-steps .pc-steps__item--current')?.textContent || ''), null, { timeout: 120000 });
            await m.pause(800);
            await m.defiler('#pc-atelier', { ms: 900, position: 0.02 });
            await m.cliquer(page.getByRole('button', { name: /Télécharger le parcours/ }), { apres: 1200 });
            await phrase(1);
            await m.survoler(page.getByText('Importer le fichier dans votre plateforme'), { ms: 900 });
        },
    },
    {
        id: 'papier',
        cles: [
            [0, 'Fiche de séquence et détail des activités : Word, ODT, PDF'],
        ],
        voix: () => `La fiche de séquence et le détail des activités, avec leurs corrigés, s’emportent en Word, en ODT ou en PDF : pour préparer la séance, ou en garder une trace.`,
        async jouer({ m, page }) {
            await m.defiler('.pc-livrer--papier', { ms: 1200, position: 0.2 });
            const boutons = page.locator('.pc-livrer--papier .pc-telecharger__btn');
            await m.survoler(boutons.nth(0), { ms: 600 });
            await m.survoler(boutons.nth(2), { ms: 600 });
            await m.survoler(boutons.nth(3), { ms: 700 });
        },
    },
    {
        id: 'reprendre',
        cles: [
            [0, '« Exporter le scénario » : tout le parcours dans un fichier'],
            [1, '« Importer un modèle » le rouvre dans Caramel, activités comprises'],
        ],
        voix: () => `Enfin, « Exporter le scénario » garde tout le parcours dans un fichier. `
            + `Plus tard, « Importer un modèle » le rouvre dans Caramel, activités comprises : pour le retoucher, ou l’adapter à une autre classe.`,
        async jouer({ m, page, phrase }) {
            await m.defiler('.pc-livrer__json', { ms: 1000, position: 0.4 });
            const telechargement = page.waitForEvent('download');
            await m.cliquer(page.locator('.pc-livrer__json'), { apres: 900 });
            const fichier = await (await telechargement).path();
            await phrase(1);
            await m.defiler(0, { ms: 1000 });
            const choix = page.waitForEvent('filechooser');
            await m.cliquer(page.locator('#pc-scenario-importer'), { apres: 300 });
            await (await choix).setFiles(fichier);
            await m.pause(600);
            const remplacer = page.locator('.pc-confirmation__abandon');
            if (await remplacer.isVisible().catch(() => false)) await m.cliquer(remplacer, { apres: 1200 });
            await page.locator('.pc-etapes').first().waitFor({ state: 'visible', timeout: 20000 });
            await m.defiler('.pc-chemins', { ms: 1400, position: 0.13 });
            await m.survoler(page.locator('.pc-carte__etat').first(), { ms: 900 });
        },
    },
    {
        id: 'fin',
        chapitre: null,
        voix: () => `Le tutoriel intégré à Caramel reprend chacune de ces étapes, et l’assistante Caramelia répond à vos questions. Bons parcours !`,
        async jouer({ m }) {
            await m.carton(`<img class="demo-carton__logo" src="${LOGO}" alt="">
                <h1>Caramel</h1>
                <p class="demo-carton__url">caramel.forge.apps.education.fr</p>
                <p class="demo-carton__sous">Gratuit, sans compte · Tutoriel intégré (bouton « Tutoriel ») · Assistante Caramelia</p>
                <p class="demo-carton__meta">Concepteurs : Emmanuel GAUNARD et Gauthier REMANDE · Logiciel libre, hébergé sur la Forge des communs numériques éducatifs</p>`);
            await m.pause(1500);
        },
    },
];

export const CARTON_TITRE = `<img class="demo-carton__logo" src="${LOGO}" alt="">
    <h1>Créer un parcours</h1>
    <p class="demo-carton__sous">Du cadrage au fichier à importer dans Éléa, Magistère ou Moodle :<br>un parcours pour tous, puis des chemins selon les résultats</p>
    <p class="demo-carton__meta">Tutoriel commenté · Caramel 7.1 · octobre 2026</p>`;

export const HABILLAGE = {
    fenetre: 'Caramel 7',
    etapes: ['Introduction', 'Préparer', 'Relire le plan', 'Différencier', 'Fabriquer et livrer'],
    titre: {
        surtitre: 'Tutoriel · octobre 2026',
        h1: 'Créer un <b>parcours</b>',
        texte: 'Du cadrage au fichier à importer dans votre plateforme : un parcours pour tous, puis des chemins selon les résultats d’un test.',
    },
    parties: [
        null,
        { debut: 'demande', titre: 'Préparer', sous: 'Le formulaire, votre cours, le cadrage et la trame' },
        { debut: 'plan-vue', titre: 'Relire le plan', sous: 'Rien n’est généré avant votre relecture' },
        { debut: 'chemins-ouvrir', titre: 'Différencier', sous: 'Un test oriente chaque élève vers son chemin' },
        { debut: 'fabrication', titre: 'Fabriquer et livrer', sous: 'Relire chaque activité, puis un seul fichier pour tout le cours' },
    ],
    sections: [[null, 'intro'], ['demande', 'couplet'], ['plan-vue', 'couplet'], ['chemins-ouvrir', 'plein'], ['fabrication', 'plein'], ['fin', 'final']],
    cartesSource: ['titre', 'fin'],
    savoir: null,
    musique: null,
};
