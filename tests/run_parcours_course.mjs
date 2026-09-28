/**
 * run_parcours_course.mjs — Le `.mbz` de COURS de l'atelier de parcours.
 *
 * Ce banc répond à la question qui conditionnait tout le lot 1 : **le Test natif
 * (`mod_quiz`) est-il réellement assemblable dans un cours ?** Quatre trames de
 * la bibliothèque s'appuient dessus (`revision`, `evaluation`,
 * `differenciation`, `autoformation`) ; on ne livre pas un parcours qui perd son
 * évaluation.
 *
 * La réponse tenait à une confusion de vocabulaire dans le constructeur porté :
 * `planCollectionCourse` écarte bien une activité avec le motif `'quiz'`, mais
 * seulement quand La Sucrerie reçoit un `.mbz` DÉPOSÉ contenant un `mod_quiz`
 * verbatim (sa banque de questions vit à la RACINE du backup, hors du dossier
 * d'activité que la renumérotation recopie). Caramel n'est jamais dans ce cas :
 * il détient le MODÈLE de la banque, et `buildQuizActivityFiles` la régénère.
 * C'est la voie `kind: 'quiz'`, et c'est celle que ce banc exerce.
 *
 * Tout tourne dans un vrai navigateur, sur le VRAI pipeline (processeurs,
 * `json-healer`, empaquetage `.h5p`, empreintes sha1) — pas sur des doublures.
 *
 * Lancement :  node tests/run_parcours_course.mjs
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'tests/roundtrip/package.json'));
const { chromium } = require('playwright');
const PORT = 8112;

const server = spawn('python3', ['tests/serveur-statique.py', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* déjà mort */ } };
process.on('exit', stop);

async function waitForServer(ms = 15000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        try { if ((await fetch(`http://127.0.0.1:${PORT}/index.html`, { method: 'HEAD' })).ok) return true; }
        catch { /* pas prêt */ }
        await new Promise(r => setTimeout(r, 150));
    }
    return false;
}

let pass = 0, fail = 0;
const echecs = [];
const ok = (nom, cond, detail = '') => {
    if (cond) { pass++; console.log(`  ✓ ${nom}`); }
    else { fail++; echecs.push(`❌ ${nom}${detail ? '\n     ' + detail : ''}`); console.log(`  ✗ ${nom}`); }
};

/** Un plan de parcours qui couvre les TROIS voies d'assemblage. */
const PLAN = {
    titre: 'La traite atlantique',
    objectifGeneral: 'Comprendre le commerce triangulaire au XVIIIᵉ siècle',
    notionsPivots: ['le commerce triangulaire', 'le Code noir', 'les ports négriers'],
    origine: 'revision',
    personnalise: false,
    etapes: [
        {
            id: 'e1', titre: 'Découvrir', objectif: 'Identifier les acteurs de la traite',
            cartes: [
                {
                    id: 'c1', titre: 'Les mots de la traite', module: 'Flashcards',
                    palier: 'decouverte', duree: 10, verrouillee: false,
                    contenu: {
                        title: 'Les mots de la traite',
                        description: 'Révisez le vocabulaire.',
                        cards: [
                            { text: 'Le commerce triangulaire', answer: 'Le circuit Europe–Afrique–Amériques' },
                            { text: 'Le Code noir', answer: 'Le texte qui régit l’esclavage colonial' },
                        ],
                    },
                },
                {
                    id: 'c2', titre: 'La leçon', module: 'Page',
                    palier: 'decouverte', duree: 15, verrouillee: false,
                    contenu: {
                        title: 'La leçon',
                        intro: 'Les grandes lignes du commerce triangulaire.',
                        blocks: [
                            { type: 'heading', content: 'Les ports négriers' },
                            { type: 'paragraph', content: 'Nantes, Bordeaux et La Rochelle arment les navires.' },
                        ],
                    },
                },
            ],
        },
        {
            id: 'e3', titre: 'Échanger', objectif: 'Confronter les points de vue',
            cartes: [
                {
                    id: 'c6', titre: 'Ce qu’on retient', module: 'parcours_etiquette',
                    palier: 'decouverte', duree: 2, verrouillee: false,
                    contenu: { title: 'Ce qu’on retient', intro: 'Trois ports, un circuit, un code.' },
                },
                {
                    id: 'c7', titre: 'Le débat', module: 'parcours_forum',
                    palier: 'transfert', duree: 20, verrouillee: false,
                    contenu: { title: 'Le débat', intro: 'Peut-on juger le passé avec nos valeurs ?' },
                },
                {
                    id: 'c8', titre: 'Votre avis', module: 'parcours_sondage',
                    palier: 'entrainement', duree: 5, verrouillee: false,
                    contenu: {
                        title: 'Votre avis',
                        intro: 'Quel port vous a le plus surpris ?',
                        options: ['Nantes', 'Bordeaux', 'La Rochelle'],
                    },
                },
            ],
        },
        {
            id: 'e2', titre: "S'entraîner", objectif: 'Vérifier ses acquis',
            cartes: [
                {
                    id: 'c3', titre: 'Le QCM de la séance', module: 'QCM',
                    palier: 'entrainement', duree: 10, verrouillee: false,
                    contenu: {
                        title: 'Le QCM de la séance',
                        questions: [
                            { text: 'Quel port arme le plus de navires négriers ?',
                              answers: [{ text: 'Nantes', correct: true }, { text: 'Marseille', correct: false }] },
                        ],
                    },
                },
                {
                    id: 'c4', titre: "L'évaluation", module: 'test_elea',
                    palier: 'transfert', duree: 20, verrouillee: false,
                    contenu: {
                        title: "L'évaluation",
                        bank_name: 'Traite atlantique — évaluation',
                        bank_description: 'Questions de fin de séquence.',
                        questions: [
                            { type: 'multichoice', content: {
                                name: 'Q01', questiontext: 'Le Code noir date de :',
                                feedback: 'Il est promulgué en 1685.',
                                answers: [
                                    { text: '1685', fraction: 100, feedback: 'Exact.' },
                                    { text: '1789', fraction: 0, feedback: 'Non.' },
                                ],
                            } },
                            { type: 'truefalse', content: {
                                name: 'Q02', questiontext: 'Nantes est un port négrier.',
                                feedback: '', answer: { value: true, feedback_true: 'Oui.', feedback_false: 'Si.' },
                            } },
                            { type: 'shortanswer', content: {
                                name: 'Q03', questiontext: 'Nommez un port négrier français.',
                                usecase: 0,
                                answers: [{ text: 'Nantes', fraction: 100, feedback: '' }],
                            } },
                        ],
                    },
                },
            ],
        },
    ],
};

let exitCode = 0;
try {
    if (!await waitForServer()) throw new Error(`serveur HTTP absent sur ${PORT}`);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-module]').length > 0,
        null, { timeout: 60000, polling: 200 });

    const r = await page.evaluate(async (plan) => {
        const { planVersActivites, assemblerParcours, IDENTITE_CARAMEL } =
            await import('/js/parcours/parcours-builder.js');
        const { assembleCourseFiles, sectionIdFor, moduleIdFor, quizIdBaseFor, SELF_CONTAINED_MODULES } =
            await import('/js/moodle/mbz-course-builder.js');
        const routeur = await import('/js/parcours/activity-router.js');
        const { construireActiviteParcours } = await import('/js/parcours/modules-parcours.js');
        const { construireCarteProgression } = await import('/js/parcours/carte-progression.js');

        const { activities, sections, exclues } = await planVersActivites(plan);
        const TS = 1756000000;
        const { files } = assembleCourseFiles({
            courseTitle: plan.titre, timestamp: TS, activities, sections,
            identite: IDENTITE_CARAMEL,
        });

        const paquet = await assemblerParcours(plan, { timestamp: TS });

        // Aller-retour RÉEL : on rouvre l'archive produite et on relit le .h5p
        // du pool. C'est le seul contrôle qui prouve que les octets binaires
        // traversent l'empaquetage tar+gzip sans être passés par un décodage
        // texte — le piège classique d'un `.mbz` qui contient un média.
        const { loadMoodleLibs } = await import('/js/core/lib-loader.js');
        await loadMoodleLibs();
        const tar = window.fflate.gunzipSync(paquet.bytes);
        const dansArchive = {};
        for (let o = 0; o + 512 <= tar.length;) {
            const nom = new TextDecoder().decode(tar.subarray(o, o + 100)).replace(/\0.*$/, '');
            if (!nom) break;
            const taille = parseInt(new TextDecoder().decode(tar.subarray(o + 124, o + 136)).replace(/[^0-7]/g, ''), 8) || 0;
            dansArchive[nom] = tar.subarray(o + 512, o + 512 + taille);
            o += 512 + Math.ceil(taille / 512) * 512;
        }
        const h5pAttendu = activities[0].extracted.h5pBytes;
        const h5pRelu = dansArchive[`files/${activities[0].extracted.contenthash.slice(0, 2)}/${activities[0].extracted.contenthash}`];
        const h5pIdentique = !!h5pRelu && h5pRelu.length === h5pAttendu.length
            && h5pRelu.every((o2, i) => o2 === h5pAttendu[i]);

        return {
            exclues,
            voies: activities.map((a, i) => ({
                titre: a.title,
                sectionIndex: a.sectionIndex,
                kind: a.extracted.kind || 'mbz',
                moduleName: a.extracted.moduleName,
                contenthash: a.extracted.contenthash || null,
                moduleId: moduleIdFor(i),
            })),
            sections,
            chemins: Object.keys(files).sort(),
            questionsXml: files['questions.xml'] || '',
            quizXml: Object.entries(files).find(([p]) => /activities\/quiz_\d+\/quiz\.xml$/.test(p))?.[1] || '',
            palette: routeur.modulesDisponibles('elea').map(m => m.cle),
            palettes: Object.fromEntries(['elea', 'magistere', 'moodle'].map(p =>
                [p, routeur.modulesDisponibles(p).map(m => m.cle)])),
            nomsModules: ['parcours_etiquette', 'parcours_forum', 'parcours_sondage']
                .map(c => routeur.nomModule(c)),
            autoPorteurs: [...SELF_CONTAINED_MODULES],
            xmlLabel: Object.entries(files).find(([p]) => /label_\d+\/label\.xml$/.test(p))?.[1] || '',
            xmlForum: Object.entries(files).find(([p]) => /forum_\d+\/forum\.xml$/.test(p))?.[1] || '',
            xmlChoice: Object.entries(files).find(([p]) => /choice_\d+\/choice\.xml$/.test(p))?.[1] || '',
            // Les deux greffons tiers ne sont pas dans le plan ci-dessus (ils ne
            // figurent pas dans la palette Éléa qu'il vise) : on les fabrique
            // directement, ce qui est ce qu'on veut contrôler ici — la FORME du
            // XML, pas son passage par le routeur.
            greffons: Object.fromEntries(['parcours_nuage_mots', 'parcours_mur_notes'].map(cle => {
                const d = cle === 'parcours_nuage_mots'
                    ? { title: 'Ce que vous en savez', intro: 'Avant de commencer.',
                        instructions: 'En un mot : à quoi vous fait penser « traite » ?' }
                    : { title: 'Nos questions', intro: 'Déposez une note.',
                        colonnes: ['Ce que je sais', 'Ce que je crois savoir', 'Ce que je veux vérifier'] };
                const r = construireActiviteParcours(cle, d, { timestamp: 1700000000 });
                return [cle, {
                    moduleName: r.moduleName,
                    xml: r.files[`${r.activityDir}/${r.moduleName}.xml`],
                    moduleXml: r.files[`${r.activityDir}/module.xml`],
                }];
            })),
            // Titres de colonne trop longs : le cas qui a fait échouer un import
            // réel de bout en bout, le 4 sept. 2026.
            colonnesLongues: (() => {
                const r = construireActiviteParcours('parcours_mur_notes', {
                    title: 'Trop long', intro: 'x',
                    colonnes: [
                        'Ce que je crois savoir',            // 22 — coupe au mot
                        'Représentationsinitialesdeleleve',  // 32 sans espace — coupe sèche
                        'À vérifier : 20 car.',              // 20 pile — doit passer INTACT
                        'Court',                             // 5 — inchangé
                    ],
                }, { timestamp: 1700000000 });
                return r.files[`${r.activityDir}/stickynotes.xml`];
            })(),
            sansColonne: (() => {
                // Un mur sans colonne ne s'affiche pas : le repli doit en poser une.
                const r = construireActiviteParcours('parcours_mur_notes',
                    { title: 'Mur nu', intro: 'x', colonnes: [] }, { timestamp: 1700000000 });
                return r.files[`${r.activityDir}/stickynotes.xml`];
            })(),
            // ─── La Carte de progression (mapmodules, Éléa seul) ───
            //
            // Elle n'est PAS une carte du plan : elle se pose en section 0, sur
            // demande, et n'a pas de contenu à faire générer. Chaque relevé
            // ci-dessous répond à un mode d'échec précis du greffon, tous lus
            // dans son code source.
            carte: (() => {
                const r = construireCarteProgression(
                    { objectifGeneral: 'Comprendre le commerce triangulaire',
                      carte: { actif: true, theme: 'paysage' } },
                    { timestamp: 1700000000 });
                return {
                    moduleName: r.moduleName,
                    title: r.title,
                    xml: r.files[`${r.activityDir}/mapmodules.xml`],
                    moduleXml: r.files[`${r.activityDir}/module.xml`],
                };
            })(),
            // Ce que la PLATEFORME a renvoyé, après import réel de la sonde dans
            // un cours Éléa puis ré-export (6 sept. 2026). Comparer nos valeurs
            // à celles-là, c'est vérifier qu'on ne dérive pas de la seule
            // version dont on sache qu'elle s'importe.
            carteRelue: await (await fetch(
                '/tests/fixtures/moodle-reference/apres-restauration/mapmodules.elea-apres-caramel.xml')).text(),
            // Un thème que le catalogue amont ne connaît plus doit RETOMBER sur
            // le thème par défaut : posé tel quel, il ferait lever au greffon une
            // exception PHP pendant la restauration, donc échouer l'import du
            // cours entier.
            carteThemeInconnu: construireCarteProgression(
                { carte: { actif: true, theme: 'un-thème-qui-n-existe-pas' } },
                { timestamp: 1700000000 },
            ).files['activities/mapmodules_1/mapmodules.xml'],
            // Posée par la vraie voie d'assemblage, plateforme par plateforme.
            posees: Object.fromEntries(await Promise.all(
                ['elea', 'magistere', 'moodle'].map(async (pid) => {
                    const p2 = { ...plan, carte: { actif: true, theme: 'paysage' } };
                    const { activities: a } = await planVersActivites(p2, { platformId: pid });
                    return [pid, a.map(x => ({
                        moduleName: x.extracted.moduleName || x.extracted.kind,
                        sectionIndex: x.sectionIndex,
                    }))];
                }))),
            // Décochée : rien ne doit être posé, sur aucune plateforme.
            carteDecochee: (await planVersActivites(
                { ...plan, carte: { actif: false, theme: 'paysage' } }, { platformId: 'elea' },
            )).activities.some(a => a.extracted.moduleName === 'mapmodules'),
            // Une carte sans chemin n'est pas une carte : si aucune activité
            // n'aboutit, on ne pose rien plutôt qu'un tracé au-dessus du vide.
            carteSansChemin: (await planVersActivites(
                {
                    titre: 'Vide', objectifGeneral: '', etapes: [{ id: 'e1', titre: 'x', cartes: [
                        { id: 'c1', titre: 'sans contenu', module: 'Page', contenu: null },
                    ] }],
                    carte: { actif: true, theme: 'paysage' },
                }, { platformId: 'elea' },
            )).activities.length,
            // ─── L'ouverture progressive (restrictions d'accès) ───
            //
            // Posée APRÈS l'assemblage, sur la SECTION et non sur l'activité.
            // Chaque relevé répond à un mode d'échec précis : une condition qui
            // pointe dans le vide, ou posée sur l'étape 1, ferme le parcours
            // entier — et l'enseignant ne le verrait qu'une fois la classe devant.
            //
            // On relit les sections DANS l'archive produite, pas dans un
            // intermédiaire : c'est le fichier livré qui compte.
            progression: await (async () => {
                const lireSections = async (p2) => {
                    const paq = await assemblerParcours(p2, { timestamp: TS, platformId: 'elea' });
                    const tar2 = window.fflate.gunzipSync(paq.bytes);
                    const sections = [];
                    const etiquettes = [];
                    for (let o = 0; o + 512 <= tar2.length;) {
                        const nom = new TextDecoder().decode(tar2.subarray(o, o + 100)).replace(/\0.*$/, '');
                        if (!nom) break;
                        const taille = parseInt(new TextDecoder().decode(tar2.subarray(o + 124, o + 136)).replace(/[^0-7]/g, ''), 8) || 0;
                        if (/^sections\/section_\d+\/section\.xml$/.test(nom)) {
                            const x = new TextDecoder().decode(tar2.subarray(o + 512, o + 512 + taille));
                            sections.push({
                                numero: Number((x.match(/<number>(\d+)<\/number>/) || [])[1]),
                                sequence: (x.match(/<sequence>([^<]*)<\/sequence>/) || [])[1] || '',
                                dispo: (x.match(/<availabilityjson>([^<]*)<\/availabilityjson>/) || [])[1] || '',
                            });
                        }
                        if (/^activities\/label_\d+\/label\.xml$/.test(nom)) {
                            etiquettes.push(new TextDecoder().decode(tar2.subarray(o + 512, o + 512 + taille)));
                        }
                        o += 512 + Math.ceil(taille / 512) * 512;
                    }
                    sections.sort((a, b) => a.numero - b.numero);
                    return {
                        sections, etiquettes, etapesContraintes: paq.etapesContraintes, textes: paq.textes,
                        modules: Object.fromEntries(paq.activites.map(a => [String(a.moduleId), a.moduleName])),
                    };
                };

                const active = await lireSections({ ...plan, progression: { actif: true } });
                const decochee = await lireSections(plan);
                // Une seule étape : il n'y a rien à ouvrir après quoi que ce soit.
                const uneSeule = await lireSections({
                    ...plan,
                    progression: { actif: true },
                    etapes: [plan.etapes[0]],
                });
                // Avec la Carte en section 0 : l'étape 1 ne doit SURTOUT pas
                // dépendre d'elle — la carte ne s'achève jamais (completion 0),
                // la condition ne serait donc jamais remplie.
                const avecCarte = await lireSections({
                    ...plan,
                    progression: { actif: true },
                    carte: { actif: true, theme: 'paysage' },
                });
                // D64 : l'accueil et les introductions d'étape deviennent des
                // étiquettes en tête de section. Une étiquette ne s'achève jamais :
                // si elle entrait dans une condition, l'étape suivante resterait
                // fermée pour toujours.
                const avecTextes = await lireSections({
                    ...plan,
                    progression: { actif: true },
                    introduction: 'Bienvenue dans ce parcours de révision.',
                    etapes: plan.etapes.map((e, i) => ({ ...e, introduction: `Dans cette étape ${i + 1}, vous allez travailler.` })),
                });
                return { active, decochee, uneSeule, avecCarte, avecTextes, nbEtapes: plan.etapes.length };
            })(),
            backupXml: files['moodle_backup.xml'] || '',
            courseXml: files['course/course.xml'] || '',
            journal: files['moodle_backup.log'] || '',
            filesXml: files['files.xml'] || '',
            sectionIds: sections.map(s => sectionIdFor(s.index)),
            quizBase: quizIdBaseFor(6),
            tailleMbz: paquet.bytes.length,
            nomFichier: paquet.filename,
            cheminsArchive: Object.keys(dansArchive).length,
            h5pIdentique,
            h5pEstUnZip: !!h5pRelu && h5pRelu[0] === 0x50 && h5pRelu[1] === 0x4b,
            traceSucrerie: Object.entries(files)
                .filter(([, v]) => typeof v === 'string' && /sucrerie/i.test(v))
                .map(([p]) => p),
        };
    }, PLAN);

    console.log('\n── Les sept cartes du plan ─────────────────────────────────');
    for (const v of r.voies) console.log(`   ${v.titre} → ${v.moduleName} (voie « ${v.kind} »)`);
    if (r.exclues.length) console.log('   écartées :', JSON.stringify(r.exclues));

    console.log('\n── Assemblage ──────────────────────────────────────────────');
    ok('les 7 cartes du plan sont assemblées, aucune écartée',
        r.voies.length === 7 && r.exclues.length === 0, JSON.stringify(r.exclues));
    ok('la Flashcards passe par la voie H5P (mod_h5pactivity)',
        r.voies[0]?.kind === 'h5p' && r.voies[0]?.moduleName === 'h5pactivity');
    ok('la Page passe par la voie Moodle auto-porteuse (mod_page)',
        r.voies[1]?.kind === 'mbz' && r.voies[1]?.moduleName === 'page');
    ok('le QCM passe par la voie Moodle auto-porteuse (mod_simplequiz)',
        r.voies[5]?.kind === 'mbz' && r.voies[5]?.moduleName === 'simplequiz');

    console.log('\n── Les modules propres au parcours ─────────────────────────');
    for (const [i, attendu] of [[2, 'label'], [3, 'forum'], [4, 'choice']]) {
        ok(`« ${r.voies[i]?.titre} » est posé comme mod_${attendu}`,
            r.voies[i]?.moduleName === attendu, String(r.voies[i]?.moduleName));
    }
    ok('le texte de liaison porte son contenu',
        /<intro>[^<]*Trois ports/.test(r.xmlLabel), r.xmlLabel.slice(0, 160));
    ok('le forum porte sa CONSIGNE, et aucune discussion (donnée utilisateur)',
        /<intro>[^<]*valeurs/.test(r.xmlForum) && /<discussions>\s*<\/discussions>/.test(r.xmlForum));
    ok('le sondage porte ses 3 options',
        (r.xmlChoice.match(/<option id=/g) || []).length === 3
        && r.xmlChoice.includes('<text>Nantes</text>'));
    ok('les trois modules sont autorisés par le constructeur de cours',
        ['label', 'forum', 'choice'].every(m => r.autoPorteurs.includes(m)),
        r.autoPorteurs.join(', '));
    ok('ils sont proposables dans la palette des trois plateformes',
        ['elea', 'magistere', 'moodle'].every(p =>
            r.palettes[p].includes('parcours_forum')
            && r.palettes[p].includes('parcours_sondage')
            && r.palettes[p].includes('parcours_etiquette')));
    ok('leurs libellés sont traduits, pas des clés brutes',
        r.nomsModules.every(n => n && !/^parcours_mod_/.test(n)), r.nomsModules.join(' · '));

    console.log('\n── Les greffons tiers relevés sur export authentique ───────');
    // FORMES DE RÉFÉRENCE, relevées champ par champ sur un export authentique de
    // Magistère (Moodle 5.1.5, 4 sept. 2026). Ce n'est pas de la décoration :
    // c'est ce qui distingue un XML recopié d'un XML deviné. Toute modification
    // de `modules-parcours.js` qui ajoute, retire ou déplace un champ casse ici
    // — et c'est bien le but. Pour changer la référence, il faut un NOUVEL
    // export, pas une intuition.
    const REF_NUAGE = ['collabwordcloud', 'name', 'intro', 'introformat', 'instructions',
        'wordsallowed', 'wordsrequired', 'timestart', 'timeend', 'completionwords',
        'timecreated', 'timemodified'];
    const REF_MUR = ['stickynotes', 'course', 'name', 'intro', 'introformat', 'colors',
        'votes', 'limitvotes', 'maxlimitvotes', 'limitstickynotes', 'maxstickynotes',
        'orderstickynotes', 'viewauthor', 'rotate',
        'color1', 'color1_meaning', 'color2', 'color2_meaning', 'color3', 'color3_meaning',
        'color4', 'color4_meaning', 'color5', 'color5_meaning', 'color6', 'color6_meaning',
        'timecreated', 'timemodified', 'displaystickycaption', 'moveallnotes', 'seeallnotes',
        'completionstickynotes', 'stickynotescolumns'];
    /** Séquence des balises du XML, colonnes répétées exclues. */
    const sequence = (xml, repetees = []) =>
        [...xml.matchAll(/<([a-z_0-9]+)[ >]/g)].map(m => m[1])
            .filter(t => t !== 'activity' && !repetees.includes(t));

    const nuage = r.greffons.parcours_nuage_mots;
    ok('le nuage de mots est posé comme mod_collabwordcloud',
        nuage.moduleName === 'collabwordcloud', String(nuage.moduleName));
    ok('sa forme XML est CELLE de l’export authentique, champ pour champ et dans l’ordre',
        JSON.stringify(sequence(nuage.xml)) === JSON.stringify(REF_NUAGE),
        sequence(nuage.xml).join(' '));
    ok('il porte sa question, distincte de sa description',
        /<instructions>[^<]*traite/.test(nuage.xml) && /<intro>[^<]*commencer/.test(nuage.xml));

    const mur = r.greffons.parcours_mur_notes;
    ok('le mur de post-it est posé comme mod_stickynotes',
        mur.moduleName === 'stickynotes', String(mur.moduleName));
    ok('sa forme XML est CELLE de l’export authentique, champ pour champ et dans l’ordre',
        JSON.stringify(sequence(mur.xml, ['stickynotescolumn', 'title', 'column_order', 'stickynotesnotes']))
            === JSON.stringify(REF_MUR),
        sequence(mur.xml, ['stickynotescolumn', 'title', 'column_order', 'stickynotesnotes']).join(' '));
    ok('il porte ses 3 colonnes, dans l’ordre, et aucune note (donnée utilisateur)',
        (mur.xml.match(/<stickynotescolumn id=/g) || []).length === 3
        && /<title>Ce que je sais<\/title>[\s\S]*<column_order>1</.test(mur.xml)
        && /<column_order>3<\/column_order>/.test(mur.xml)
        && /<stickynotesnotes>\s*<\/stickynotesnotes>/.test(mur.xml));
    // `stickynotes_column.title` est un char(20), et l'étape de restauration du
    // greffon fait un insert_record BRUT : 21 caractères ne tronquent pas, ils
    // lèvent une dmlwriteexception qui interrompt la restauration du COURS
    // ENTIER — à 79 %, sur un message qui ne nomme ni le module ni le champ.
    // Constaté en vrai le 4 sept. 2026 avec « Ce que je crois savoir » (22).
    const titresColonnes = [...r.colonnesLongues.matchAll(/<title>([^<]*)<\/title>/g)]
        .map(m => m[1].replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)));
    ok('AUCUN titre de colonne ne dépasse les 20 caractères du char(20) de Moodle',
        titresColonnes.every(t => t.length <= 20),
        titresColonnes.map(t => `${t.length}:${t}`).join(' · '));
    ok('un titre trop long est coupé au MOT, pas en plein milieu',
        titresColonnes[0] === 'Ce que je crois', titresColonnes[0]);
    ok('un titre trop long SANS espace est coupé net (mieux vaut ça qu’un import perdu)',
        titresColonnes[1] === 'Représentationsinitia'.slice(0, 20), titresColonnes[1]);
    ok('un titre de 20 caractères PILE passe intact (la borne n’est pas exclusive)',
        titresColonnes[2] === 'À vérifier : 20 car.', titresColonnes[2]);
    ok('un titre court n’est pas touché',
        titresColonnes[3] === 'Court', titresColonnes[3]);

    ok('un mur sans colonne en reçoit une d’office (sinon il ne s’affiche pas)',
        (r.sansColonne.match(/<stickynotescolumn id=/g) || []).length === 1
        && r.sansColonne.includes('<title>Mur nu</title>'));

    // Les deux portent LEUR critère d'achèvement (`completionwords`,
    // `completionstickynotes`) : Moodle attend alors `completion: 2` AVEC
    // `completionview: 0`. Marquer « consulté » à la place viderait le critère de
    // son sens — l'activité serait terminée sans que l'élève ait rien écrit.
    for (const [cle, g] of Object.entries(r.greffons)) {
        ok(`${cle} : achèvement piloté par l’activité (completion 2, completionview 0)`,
            /<completion>2<\/completion>/.test(g.moduleXml)
            && /<completionview>0<\/completionview>/.test(g.moduleXml));
    }

    // Ces deux-là sont des greffons TIERS : ils ne sont déclarés que là où on les
    // a VUS. Les proposer sur une plateforme qui ne les a pas ferait échouer
    // l'import du parcours entier, sans que l'enseignant puisse comprendre.
    // Les deux greffons viennent du MÊME export de Magistère, mais ne sont pas
    // disponibles aux mêmes endroits : la palette d'Éléa propose Sticky Notes et
    // PAS le Nuage de mots (relevé du 4 sept. 2026). C'est la démonstration de
    // D26 — la disponibilité se constate, elle ne se déduit pas.
    ok('les deux sont proposés sur Magistère, où ils ont été relevés',
        r.palettes.magistere.includes('parcours_nuage_mots')
        && r.palettes.magistere.includes('parcours_mur_notes'));
    ok('le mur de post-it est proposé sur Éléa, où sa tuile a été vue',
        r.palettes.elea.includes('parcours_mur_notes'));
    ok('le nuage de mots ne l’est PAS : il est absent de la palette d’Éléa',
        !r.palettes.elea.includes('parcours_nuage_mots'), r.palettes.elea.join(', '));
    ok('aucun des deux n’est proposé sur un Moodle nu (ce sont des greffons tiers)',
        !r.palettes.moodle.includes('parcours_nuage_mots')
        && !r.palettes.moodle.includes('parcours_mur_notes'));
    ok('le constructeur de cours les autorise',
        ['collabwordcloud', 'stickynotes'].every(m => r.autoPorteurs.includes(m)),
        r.autoPorteurs.join(', '));

    // Le Glossaire est HORS palette depuis l'aller-retour réel du 4 sept. 2026 :
    // ses entrées sont des données utilisateur pour Moodle et ne survivent pas à
    // une restauration d'enseignant (sept envoyées, zéro revenues, sur les deux
    // plateformes). Un plan qui le proposerait livrerait une coquille vide.
    ok('le Glossaire n’est PLUS proposable dans un parcours',
        !r.palette.includes('glossaireXml'), r.palette.join(', '));

    console.log('\n── La Carte de progression (mapmodules, Éléa) ──────────────');
    // FORME DE RÉFÉRENCE, relevée sur un export authentique d'Éléa
    // (`tests/fixtures/moodle-reference/elea/mapmodules.xml`, Moodle 5.1.5).
    // Même règle que pour les deux greffons tiers : pour la changer, il faut un
    // NOUVEL export, pas une intuition.
    const REF_CARTE = ['mapmodules', 'course', 'name', 'intro', 'introformat',
        'timecreated', 'timemodified', 'targetsection', 'path', 'iconset',
        'displaymodulenames', 'buttonwidth',
        'descriptionheader', 'descriptionheaderformat',
        'descriptionfooter', 'descriptionfooterformat'];

    const carte = r.carte;
    ok('la carte est posée comme mod_mapmodules',
        carte.moduleName === 'mapmodules', String(carte.moduleName));
    ok('sa forme XML est CELLE de l’export authentique, champ pour champ et dans l’ordre',
        JSON.stringify(sequence(carte.xml)) === JSON.stringify(REF_CARTE),
        sequence(carte.xml).join(' '));

    // Le NOM n'est pas un titre : `get_map_src()` fait `explode(' : ', $name)`
    // pour retrouver l'image, et lève une Exception PHP sur tout autre libellé.
    // Cette exception survient PENDANT la restauration : elle ne dégraderait pas
    // la carte, elle ferait échouer l'import du COURS ENTIER — le même mode
    // d'échec que le char(20) du mur de post-it, en plus silencieux encore.
    ok('son nom respecte la grammaire « Carte standard : <thème> » exigée par le greffon',
        /<name>Carte standard : paysage<\/name>/.test(carte.xml)
        && carte.title === 'Carte standard : paysage', carte.title);
    ok('un thème inconnu retombe sur le thème par défaut au lieu d’être posé tel quel',
        /<name>Carte standard : paysage<\/name>/.test(r.carteThemeInconnu),
        (r.carteThemeInconnu.match(/<name>[^<]*<\/name>/) || [''])[0]);

    // 666 = ALL_SECTIONS_NUM du greffon, la sentinelle « Toutes les sections ».
    // Ce n'est NI un identifiant de section NI un vestige : c'est ce qui fait
    // qu'une carte posée en section 0 montre tout le parcours, et c'est aussi
    // pourquoi elle traverse la restauration sans rien à remapper.
    ok('elle vise « Toutes les sections » (666), donc tout le parcours d’un seul chemin',
        /<targetsection>666<\/targetsection>/.test(carte.xml));

    // L'intro est du HTML GÉNÉRÉ portant des URL absolues vers le site : le
    // greffon la réécrit AU RESTORE (restore_mapmodules_stepslib.php la
    // recalcule juste après l'insert). En poser une serait écrire une
    // contrevérité sur un site que Caramel ne connaît pas.
    ok('son intro est VIDE — le greffon la régénère au restore, avec les URL du site d’accueil',
        /<intro><\/intro>/.test(carte.xml));
    ok('le tracé et le jeu d’icônes viennent du catalogue amont, pas d’un réglage',
        /<path>m 30\.156025 69\.323593 c/.test(carte.xml)
        && /<iconset>10<\/iconset>/.test(carte.xml)
        && /<buttonwidth>50<\/buttonwidth>/.test(carte.xml));
    ok('l’objectif général du parcours s’affiche au-dessus du chemin',
        /<descriptionheader>[^<]*commerce triangulaire/.test(carte.xml));
    ok('le seul thème à second moteur de rendu (khan) est hors catalogue',
        /<displaymodulenames>0<\/displaymodulenames>/.test(carte.xml));

    // La carte EST la description de l'activité : sans `showdescription`, elle ne
    // s'afficherait qu'en ouvrant un lien, ce qui lui retirerait sa raison d'être.
    // Et on ne « termine » pas une carte : elle montre l'avancement des autres.
    ok('elle s’affiche à même la page du cours (showdescription 1) et ne s’achève pas',
        /<showdescription>1<\/showdescription>/.test(carte.moduleXml)
        && /<completion>0<\/completion>/.test(carte.moduleXml)
        && /<completionview>0<\/completionview>/.test(carte.moduleXml));

    // Les champs que la plateforme a RENVOYÉS après un import réel. Ceux-là ne
    // sont pas une convention interne : ce sont les valeurs dont on sait, pour
    // les avoir vues revenir d'Éléa, qu'elles s'importent et se restaurent.
    // Toute dérive ici sortirait de la seule version éprouvée.
    const champ = (xml, nom) => (xml.match(new RegExp(`<${nom}>([^<]*)</${nom}>`)) || [])[1];
    for (const nom of ['name', 'targetsection', 'path', 'iconset',
                       'displaymodulenames', 'buttonwidth', 'descriptionheaderformat']) {
        ok(`<${nom}> est identique à ce qu’Éléa a renvoyé après un import réel`,
            champ(carte.xml, nom) === champ(r.carteRelue, nom),
            `produit « ${String(champ(carte.xml, nom)).slice(0, 48)} » · relu « ${String(champ(r.carteRelue, nom)).slice(0, 48)} »`);
    }
    // L'intro fait exception, et c'est tout l'enseignement : nous en envoyons une
    // VIDE, la plateforme en renvoie une qu'elle a fabriquée avec SES URL.
    ok('l’intro, elle, DIFFÈRE — nous l’envoyons vide, Éléa la refabrique',
        champ(carte.xml, 'intro') === '' && /maploader/.test(r.carteRelue));

    const posee = r.posees.elea;
    ok('posée par la vraie voie d’assemblage, elle ouvre la marche en section 0',
        posee[0].moduleName === 'mapmodules' && posee[0].sectionIndex === 0);
    ok('elle est la SEULE chose en section 0 (la zone « Généralités » reste sinon vide)',
        posee.filter(a => a.sectionIndex === 0).length === 1);
    // D26 : `mapmodules` est dans la palette d'Éléa (35 tuiles) et absent de
    // celle de Magistère (29). Le proposer ailleurs ferait échouer l'import.
    for (const pid of ['magistere', 'moodle']) {
        ok(`sur ${pid}, elle n’est pas posée du tout (greffon absent de la palette)`,
            !r.posees[pid].some(a => a.moduleName === 'mapmodules'));
    }
    ok('décochée, elle n’est posée nulle part',
        r.carteDecochee === false);
    ok('sans aucune activité aboutie, aucune carte n’est posée (un chemin vide n’est pas un chemin)',
        r.carteSansChemin === 0, String(r.carteSansChemin));

    console.log('\n── L’ouverture progressive (restrictions d’accès) ──────────');
    const pr = r.progression;
    const decode = (x) => x.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const etapes = pr.active.sections.filter(s => s.numero >= 1);

    ok('décochée, aucune section ne porte de restriction',
        pr.decochee.etapesContraintes === 0
        && pr.decochee.sections.every(s => s.dispo === '$@NULL@$'),
        pr.decochee.sections.map(s => `${s.numero}:${s.dispo}`).join(' · '));

    ok('cochée, les étapes 2 et suivantes sont contraintes — mais PAS la première',
        pr.active.etapesContraintes === etapes.length - 1
        && pr.active.sections.find(s => s.numero === 1).dispo === '$@NULL@$'
        && pr.active.sections.filter(s => s.numero >= 2).every(s => s.dispo !== '$@NULL@$'),
        pr.active.sections.map(s => `${s.numero}:${s.dispo === '$@NULL@$' ? 'libre' : 'contrainte'}`).join(' · '));

    ok('la zone « Généralités » n’est jamais contrainte',
        pr.active.sections.find(s => s.numero === 0).dispo === '$@NULL@$');

    // La forme exacte attendue par Moodle : `op: &` impose `showc` (tableau
    // parallèle), là où `|` prendrait un `show` booléen. Se tromper de champ
    // donne une condition que Moodle ignore en silence.
    const cond = JSON.parse(decode(pr.active.sections.find(s => s.numero === 2).dispo));
    ok('la condition a la forme que Moodle attend (op &, showc en tableau)',
        cond.op === '&' && Array.isArray(cond.showc)
        && cond.showc.length === cond.c.length && cond.showc.every(Boolean),
        JSON.stringify(cond));
    ok('elle exige l’achèvement (e = 1) de CHAQUE activité de l’étape précédente',
        Array.isArray(cond.c) && cond.c.every(c => c.type === 'completion' && c.e === 1)
        && cond.c.map(c => c.cm).join(',')
           === pr.active.sections.find(s => s.numero === 1).sequence,
        `${cond.c.map(c => c.cm).join(',')} contre ${pr.active.sections.find(s => s.numero === 1).sequence}`);
    // Défensif à dessein : une condition mal formée doit faire ÉCHOUER cette
    // ligne, pas lever une exception qui avorterait le reste du banc et
    // masquerait les régressions suivantes.
    ok('l’étape reste VISIBLE et grisée : on ne cache pas le chemin qu’on trace',
        Array.isArray(cond.showc) && cond.showc.every(v => v === true),
        JSON.stringify(cond.showc));
    ok('le JSON est échappé pour le XML (guillemets et esperluette)',
        pr.active.sections.find(s => s.numero === 2).dispo.includes('&quot;')
        && pr.active.sections.find(s => s.numero === 2).dispo.includes('&amp;'));

    ok('sur une seule étape, rien n’est posé (il n’y a rien à ouvrir après)',
        pr.uneSeule.etapesContraintes === 0
        && pr.uneSeule.sections.every(s => s.dispo === '$@NULL@$'),
        String(pr.uneSeule.etapesContraintes));

    // Le piège qui fermerait le parcours dès sa première page : la Carte de
    // progression occupe la section 0 et ne s'achève JAMAIS (completion 0).
    // Conditionner l'étape 1 à la section 0 rendrait tout inaccessible.
    const carteEnTete = pr.avecCarte.sections.find(s => s.numero === 0);
    ok('avec une Carte en section 0, l’étape 1 reste LIBRE (la carte ne s’achève jamais)',
        pr.avecCarte.sections.find(s => s.numero === 1).dispo === '$@NULL@$'
        && carteEnTete.sequence !== '',
        `section 0 = ${carteEnTete.sequence} · étape 1 = ${pr.avecCarte.sections.find(s => s.numero === 1).dispo}`);
    ok('et la Carte n’apparaît dans AUCUNE condition d’accès',
        pr.avecCarte.sections.filter(s => s.dispo !== '$@NULL@$')
            .every(s => !JSON.parse(decode(s.dispo)).c
                .some(c => carteEnTete.sequence.split(',').includes(String(c.cm)))));

    console.log('\n── Textes d’accueil et d’introduction (D64) ────────────────');
    const tx = pr.avecTextes;
    const premierModule = s => tx.modules[s.sequence.split(',')[0]];
    ok('une étiquette par étape, plus l’accueil, et aucune activité perdue',
        tx.textes === pr.nbEtapes + 1 && tx.etiquettes.length === pr.nbEtapes + 1 + pr.active.etiquettes.length,
        `${tx.textes} texte(s), ${tx.etiquettes.length} étiquette(s) pour ${pr.nbEtapes} étape(s)`);
    ok('chaque section s’ouvre sur son texte, l’accueil compris',
        tx.sections.every(s => premierModule(s) === 'label'),
        tx.sections.map(s => `${s.numero}:${premierModule(s)}`).join(' · '));
    // Le HTML de Moodle porte les accents en entités numériques.
    const lisible = x => x.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
    ok('les textes rédigés arrivent dans les étiquettes du cours',
        tx.etiquettes.some(x => lisible(x).includes('Bienvenue dans ce parcours de révision.'))
        && tx.etiquettes.some(x => lisible(x).includes('Dans cette étape 2, vous allez travailler.')),
        tx.etiquettes.map(x => (x.match(/<intro>([^<]{0,90})/) || [])[1]).join(' | '));
    ok('l’ouverture progressive contraint autant d’étapes qu’avant',
        tx.etapesContraintes === pr.active.etapesContraintes, `${tx.etapesContraintes} contre ${pr.active.etapesContraintes}`);
    ok('aucune étiquette n’entre dans une condition d’accès',
        tx.sections.filter(s => s.dispo !== '$@NULL@$')
            .every(s => JSON.parse(decode(s.dispo)).c.every(c => tx.modules[String(c.cm)] !== 'label')));

    console.log('\n── Le Test natif (la question du lot 1) ────────────────────');
    ok('le Test passe par la voie « quiz » (mod_quiz)',
        r.voies[6]?.kind === 'quiz' && r.voies[6]?.moduleName === 'quiz');
    const dirQuiz = `activities/quiz_${r.voies[6]?.moduleId}`;
    for (const f of ['quiz.xml', 'module.xml', 'grades.xml', 'inforef.xml', 'roles.xml',
                     'calendar.xml', 'filters.xml', 'grade_history.xml']) {
        ok(`le dossier du Test porte ${f}`, r.chemins.includes(`${dirQuiz}/${f}`));
    }
    ok('les 3 questions sont dans la banque du cours',
        (r.questionsXml.match(/<question_bank_entry id=/g) || []).length === 3,
        `trouvé ${(r.questionsXml.match(/<question_bank_entry id=/g) || []).length}`);
    ok('les 3 types de question sont sérialisés',
        ['multichoice', 'truefalse', 'shortanswer'].every(t => r.questionsXml.includes(`<qtype>${t}</qtype>`)));
    ok('la banque du Test est rattachée au contexte COURS (contextlevel 50)',
        r.questionsXml.includes('<contextlevel>50</contextlevel>'));

    // Le câblage : chaque slot du quiz doit pointer une entrée de banque RÉELLE.
    const slots = [...r.quizXml.matchAll(/<questionbankentryid>(\d+)<\/questionbankentryid>/g)].map(m => m[1]);
    const qbes = new Set([...r.questionsXml.matchAll(/<question_bank_entry id="(\d+)"/g)].map(m => m[1]));
    ok('les 3 slots du Test pointent une entrée de banque existante',
        slots.length === 3 && slots.every(s => qbes.has(s)),
        `slots ${slots.join(',')} / banque ${[...qbes].join(',')}`);
    ok('la note totale du Test est la somme de ses slots',
        /<sumgrades>3\.?0*<\/sumgrades>/.test(r.quizXml),
        (r.quizXml.match(/<sumgrades>[^<]*<\/sumgrades>/) || [''])[0]);
    ok('les identifiants de banque tiennent dans la plage haute de ce Test',
        [...qbes].every(id => Number(id) >= r.quizBase && Number(id) < r.quizBase + 100000));

    console.log('\n── Le pool de fichiers (le .h5p embarqué) ──────────────────');
    const hash = r.voies[0]?.contenthash || '';
    ok('l’empreinte sha1 du .h5p est bien formée', /^[0-9a-f]{40}$/.test(hash), hash);
    ok('le .h5p est posé dans le pool sous son empreinte',
        r.chemins.includes(`files/${hash.slice(0, 2)}/${hash}`));
    ok('files.xml déclare le .h5p avec la MÊME empreinte',
        r.filesXml.includes(`<contenthash>${hash}</contenthash>`));

    console.log('\n── Sections ────────────────────────────────────────────────');
    ok('la section 0 (« Généralités ») existe et reste vide',
        r.sections[0]?.index === 0 && r.sections[0]?.name === '');
    ok('les trois étapes du plan deviennent les sections 1 à 3',
        r.sections.length === 4 && r.sections[1]?.name === 'Découvrir'
        && r.sections[2]?.name === 'Échanger' && r.sections[3]?.name === "S'entraîner",
        JSON.stringify(r.sections));
    ok('les numéros de section sont contigus',
        r.sections.every((s, i) => s.index === i));
    for (const id of r.sectionIds) {
        ok(`la section ${id} porte son section.xml`, r.chemins.includes(`sections/section_${id}/section.xml`));
    }

    console.log('\n── L’origine déclarée du fichier ───────────────────────────');
    ok('le backup se déclare fabriqué par Caramel',
        r.backupXml.includes('<original_wwwroot>https://caramel.forge.apps.education.fr/</original_wwwroot>'));
    ok('la catégorie de cours est « caramel »', r.courseXml.includes('<name>caramel</name>'));
    ok('le journal du backup nomme Caramel', r.journal.includes('Caramel'));
    ok('le stamp des questions porte l’hôte Caramel',
        r.questionsXml.includes('caramel.forge.apps.education.fr+'));
    ok('aucun fichier ne mentionne l’autre hôte', r.traceSucrerie.length === 0, r.traceSucrerie.join(', '));

    console.log('\n── Le fichier ──────────────────────────────────────────────');
    ok('le .mbz est produit et non vide', r.tailleMbz > 1000, `${r.tailleMbz} octets`);
    ok('son nom suit la convention des exports', /^parcours-.+-caramel-\d.*\.mbz$/.test(r.nomFichier), r.nomFichier);
    ok('l’archive se relit et porte tous ses fichiers',
        r.cheminsArchive >= r.chemins.length, `${r.cheminsArchive} entrées relues`);
    ok('le .h5p ressort du pool OCTET POUR OCTET (pas de passage par du texte)', r.h5pIdentique);
    ok('le .h5p relu est bien une archive ZIP', r.h5pEstUnZip);

    ok('aucune erreur JS de page', pageErrors.length === 0, pageErrors.join(' | '));

    await browser.close();
} catch (e) {
    fail++;
    echecs.push(`❌ banc interrompu : ${e && e.message || e}`);
    exitCode = 1;
}

console.log('\n========================================');
console.log(`parcours — .mbz de cours : ${pass} PASS / ${fail} FAIL`);
if (echecs.length) { console.log(''); echecs.forEach(l => console.log(l)); }
console.log('========================================');
process.exit(fail ? 1 : exitCode);
