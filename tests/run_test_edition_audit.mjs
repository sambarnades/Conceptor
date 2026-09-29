/** Hors CI : vrais MBZ, édition, réimport, options et données pédagogiques. */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(resolve(root, 'tests/roundtrip/package.json'))('playwright');
const port = 8156;
const server = spawn('python3', ['tests/serveur-statique.py', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
try {
    for (let n = 0; n < 100; n++) { try { if ((await fetch(`http://127.0.0.1:${port}/index.html`)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch(); const page = await browser.newPage();
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForSelector('#parcours-button');
    const resultats = await page.evaluate(async () => {
        const preuves = []; const ok = (nom, valeur) => { if (!valeur) throw Error(nom); preuves.push(nom); };
        const formats = await import('/js/moodle/moodle-formats.js');
        const processor = await import('/js/moodle/processors/activities/Test.js');
        const { buildTestMbz } = await import('/js/moodle/moodle-creator.js');
        const { extractMbz } = await import('/js/moodle/mbz-utils.js');
        const { buildQuizBackup } = await import('/js/moodle/mbz-quiz-backup.js');
        const { normalizeDataForEditor, denormalizeDataForSave } = await import('/js/editor/content-detector.js');
        const glossary = (await import('/js/h5p/processors/Glossary.js')).default;
        const original = { questions: [{ type: 'numerical', content: { questiontext: 'Le taux était de {1:NUMERICAL:=5.5:0.5} %.' } }] };
        const fixed = formats.reparerConsignesTest(original);
        ok('énoncé numérique sans syntaxe Cloze brute', fixed.questions[0].content.questiontext === 'Le taux était de … %.');
        ok('réponse et tolérance récupérées, source inchangée', fixed.questions[0].content.answer.number === 5.5 && fixed.questions[0].content.answer.tolerance === 0.5 && original.questions[0].content.questiontext.includes('NUMERICAL'));
        const explicit = structuredClone(original); explicit.questions[0].content.answer = { number: 0, tolerance: 0 };
        ok('zéros explicites prioritaires sur la proposition IA', formats.reparerConsignesTest(explicit).questions[0].content.answer.number === 0);
        const multiple = structuredClone(original); multiple.questions[0].content.questiontext += ' Et {2:NM:=7:0.2}.';
        ok('plusieurs réponses intégrées gardées comme vraie question Cloze', formats.reparerConsignesTest(multiple).questions[0].type === 'cloze');
        const model = await (await fetch('/assets/data/examples/test_1.json')).json();
        model.options = { answernumbering: 'ABCD', showstandardinstruction: 0 };
        model.questions.push(fixed.questions[0]);
        model.questions.find(q => q.type === 'multichoice').content.defaultgrade = 3;
        model.questions.find(q => q.type === 'multichoice').content.penalty = 0.2;
        const { blob } = await buildTestMbz(model); const archive = await extractMbz(await blob.arrayBuffer());
        const reread = processor.parseFiles(archive.files, archive.activityDir);
        ok('vrai MBZ : toutes les questions relues dans le bon ordre', JSON.stringify(reread.questions.map(q => q.type)) === JSON.stringify(model.questions.map(q => q.type)));
        const qcm = reread.questions.find(q => q.type === 'multichoice').content;
        ok('options QCM effectives dans le MBZ et relues', qcm.answernumbering === 'ABCD' && qcm.showstandardinstruction === 0);
        ok('points et pénalité conservés', qcm.defaultgrade === 3 && qcm.penalty === 0.2);
        ok('Cloze reconstruite avec tous ses trous', reread.questions.find(q => q.type === 'cloze').content.questiontext.includes('{1:'));
        const edit = denormalizeDataForSave(normalizeDataForEditor(structuredClone(reread), 'elea_test'), 'elea_test');
        edit.questions.reverse(); edit.questions[0].content.questiontext = 'Question retouchée é & <strong>test</strong> ]]>.';
        edit.questions.push({ type:'truefalse', content: { name:'Ajout', questiontext:'Ajout conservé ?', answer:{value:false} } });
        processor.serializeFiles(edit, archive.files, archive.activityDir);
        const again = processor.parseFiles(archive.files, archive.activityDir);
        ok('édition du MBZ : ordre, ajout et texte conservés', again.questions.length === edit.questions.length && again.questions[0].content.questiontext === edit.questions[0].content.questiontext && again.questions.at(-1).content.answer.value === false);
        // Réglages du Test (D86 du PRD parcours) : .mbz réel → relecture → retouche →
        // réécriture, sans perte, et SEULES les balises réglées changent.
        const regle = structuredClone(model);
        regle.quiz_settings = { preferredbehaviour: 'interactive', attempts: 2, grademethod: 4, timelimit_minutes: 20, questionsperpage: 1, navmethod: 'sequential', shuffleanswers: 0, review: 'marks',
            overallfeedback: [{ from: 0, to: 49, feedback: 'À revoir' }, { from: 50, to: 100, feedback: 'Bravo' }] };
        const rb = await buildTestMbz(regle); const ra = await extractMbz(await rb.blob.arrayBuffer());
        const rr = processor.parseFiles(ra.files, ra.activityDir);
        ok('réglages : le .mbz réel relu redonne exactement les réglages posés', JSON.stringify(rr.quiz_settings) === JSON.stringify(regle.quiz_settings));
        const quizDe = (a) => new TextDecoder().decode(a.files[`${a.activityDir}/quiz.xml`]);
        // Lecture par DOM : la réécriture sérialise `<password></password>` en `<password/>`.
        const balise = (xml, tag) => new DOMParser().parseFromString(xml, 'application/xml').querySelector(`quiz > ${tag}`)?.textContent;
        const avant = quizDe(ra);
        const re = denormalizeDataForSave(normalizeDataForEditor(structuredClone(rr), 'elea_test'), 'elea_test');
        re.quiz_settings.attempts = 3; re.quiz_settings.review = 'all'; re.quiz_settings.questionsperpage = 2;
        processor.serializeFiles(re, ra.files, ra.activityDir);
        const apres = quizDe(ra); const rr2 = processor.parseFiles(ra.files, ra.activityDir);
        ok('réglages : la réécriture porte les réglages retouchés', rr2.quiz_settings.attempts === 3 && rr2.quiz_settings.review === 'all' && rr2.quiz_settings.navmethod === 'sequential' && rr2.quiz_settings.preferredbehaviour === 'interactive' && rr2.quiz_settings.overallfeedback?.[1]?.feedback === 'Bravo');
        ok('réglages : pages des slots recalculées à la réécriture (2 par page)', [...apres.matchAll(/<page>(\d+)<\/page>/g)].map(m => m[1]).join(',') === Array.from({ length: re.questions.length }, (_, i) => Math.floor(i / 2) + 1).join(','));
        ok('réglages : les balises non réglées gardent la valeur du fichier', ['graceperiod', 'overduehandling', 'password', 'timeopen', 'grade', 'decimalpoints'].every(t => balise(apres, t) === balise(avant, t)));
        // Un Test réglé à la main sur la plateforme (masques hors préréglage) garde SES masques.
        ra.files[`${ra.activityDir}/quiz.xml`] = new TextEncoder().encode(apres.replace(/<reviewrightanswer>\d+<\/reviewrightanswer>/, '<reviewrightanswer>65552</reviewrightanswer>'));
        const perso = processor.parseFiles(ra.files, ra.activityDir);
        ok('réglages : masques de relecture inconnus relus tels quels', perso.quiz_settings.review === 'custom' && perso.quiz_settings.review_masks.rightanswer === 65552);
        processor.serializeFiles(denormalizeDataForSave(normalizeDataForEditor(structuredClone(perso), 'elea_test'), 'elea_test'), ra.files, ra.activityDir);
        ok('réglages : masques inconnus réécrits sans perte', balise(quizDe(ra), 'reviewrightanswer') === '65552' && balise(quizDe(ra), 'reviewattempt') === balise(apres, 'reviewattempt'));
        // Un contenu d'avant les réglages (sans `quiz_settings`) ne touche pas aux réglages du fichier.
        const sansReglages = structuredClone(perso); delete sansReglages.quiz_settings;
        const fige = quizDe(ra);
        processor.serializeFiles(sansReglages, ra.files, ra.activityDir);
        ok('réglages : sans quiz_settings, les réglages du fichier restent intacts', ['preferredbehaviour', 'attempts_number', 'navmethod', 'reviewrightanswer', 'reviewmarks', 'questionsperpage'].every(t => balise(quizDe(ra), t) === balise(fige, t)));
        ok('réglages : sans quiz_settings, les slots se paginent comme le fichier (2 par page)', [...quizDe(ra).matchAll(/<page>(\d+)<\/page>/g)].map(m => m[1]).join(',') === Array.from({ length: sansReglages.questions.length }, (_, i) => Math.floor(i / 2) + 1).join(','));
        // Les masques qu'écrivait Caramel avant les réglages sont relus comme « tout ».
        const heritage = (await buildTestMbz(structuredClone(model))); const ha = await extractMbz(await heritage.blob.arrayBuffer());
        ha.files[`${ha.activityDir}/quiz.xml`] = new TextEncoder().encode(quizDe(ha).replace(/<reviewattempt>\d+/, '<reviewattempt>69888').replace(/<reviewmaxmarks>\d+/, '<reviewmaxmarks>69888')
            .replace(/<review(correctness|marks|specificfeedback|generalfeedback|rightanswer|overallfeedback)>\d+/g, '<review$1>4352'));
        ok('réglages : un Test d\'avant les réglages est relu « tout » (valeurs d\'Éléa à la réécriture)', processor.parseFiles(ha.files, ha.activityDir).quiz_settings.review === 'all');
        const xml = processor.serializeStandaloneXml(edit); const xmlModel = processor.parseStandaloneXml(xml);
        ok('XML autonome : CDATA, accents et options conservés', xmlModel.questions[0].content.questiontext === edit.questions[0].content.questiontext && xmlModel.questions.find(q => q.type === 'multichoice').content.answernumbering === 'ABCD');
        const ctx = { courseId: 1, courseContextId: 2, courseShortname: 'audit', moduleId: 3, activityId:4, activityContextId:5, gradeItemId:6, title:'Sonde' };
        const cloze = buildQuizBackup({ questions:[{type:'cloze',content:{questiontext:'{1:NM:=5.5:0.5#Bravo~%50%6:0.1#Presque} {1:SAC:=Paris}'}}]},ctx,12345);
        const doc = new DOMParser().parseFromString(cloze.questionsXml,'text/xml');
        ok('Cloze numérique : tolérances, fractions et retours séparés', [...doc.querySelectorAll('numerical_record > tolerance')].map(n=>n.textContent).join(',') === '0.5,0.1' && doc.querySelector('plugin_qtype_numerical_question').textContent.includes('0.5000000') && doc.querySelector('shortanswer > usecase').textContent === '1');
        for (const [label, action] of [['XML',()=>formats.generateMoodleXml({questions:[{type:'stack',content:{}}]})],['MBZ',()=>buildQuizBackup({questions:[{type:'stack',content:{}}]},ctx,1)],['GIFT',()=>formats.generateMoodleGift({questions:[{type:'cloze',content:{}}]})]]) {
            let refused = false; try { action(); } catch { refused = true; }
            ok(`${label} : aucune suppression silencieuse de question`, refused);
        }
        const panels = {hTag:'h3',panels:[{title:'Notion',content:{library:'H5P.AdvancedText 1.1',params:{text:'Ancien'}}}]};
        const editable = normalizeDataForEditor(panels,'Glossary'); editable.items[0].text = 'Définition révisée'; editable.hTag = 'h4';
        const saved = JSON.parse(JSON.stringify(denormalizeDataForSave(editable,'Glossary')));
        const rendered = glossary.process(saved);
        ok('Glossaire importé : texte et niveau de titre survivent au JSON et au processeur', rendered.hTag === 'h4' && rendered.panels[0].content.params.text === 'Définition révisée');
        const { fractionTrouCloze, dansTolerance, correspondanceCourte } = await import('/js/moodle/test-evaluation.js');
        ok('aperçu numérique : virgule, borne, refus hors tolérance et texte parasite', dansTolerance('5,8', 5.5, .5) && dansTolerance('.3', '.2', '.1') && !dansTolerance('6.1', 5.5, .5) && !dansTolerance('5foo', 5, 0) && !dansTolerance('1e-14', '1e-15', 0));
        ok('aperçu Cloze : fraction partielle et ordre des tolérances', fractionTrouCloze({type:'NM',content:'%50%6:0.1#Presque~=6:0.5'},'6.05') === .5);
        ok('aperçu court : casse, joker et réponse vide', correspondanceCourte('Éthiopie','éthi*') && !correspondanceCourte('paris','Paris',true) && !correspondanceCourte('','*'));
        const { parseClozeText, serializeGap, renderClozeField } = await import('/js/editor/cloze-editor.js');
        for (const code of ['{1:SAC:=Paris}', '{1:NM:=5.5:0.5#Bravo~%50%6:0.1#Presque}', '{1:SHORTANSWER:=Paris~Lyon}', '{2:MULTIRESPONSE:~%50%A~%50%B}']) {
            ok(`éditeur Cloze conserve la syntaxe avancée ${code}`, serializeGap(parseClozeText(code)[0].gapData) === code);
        }
        const clozeField=renderClozeField({label:'editor_test_type_cloze'},'{1:NM:=5.5:0.5#Bravo}',()=>{},'audit');document.body.appendChild(clozeField);
        clozeField.querySelector('.cloze-chip').dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
        ok('Cloze avancée : formulaire source sans boutons de conversion trompeurs', !!document.querySelector('.cloze-modal textarea') && !document.querySelector('.cloze-modal__type-row'));
        document.querySelector('.cloze-modal .json-editor__formula-btn--cancel').click();clozeField.remove();
        const variants={questions:[{type:'numerical',content:{questiontext:'Valeur </question> ]]> et é',answer:{number:5.5,tolerance:.5,feedback:'Juste'},alternatives:[{number:6.5,tolerance:.1,fraction:50,feedback:'Approché'}]}}]};
        const x=processor.parseStandaloneXml(formats.generateMoodleXml(variants));
        ok('XML : toutes les variantes numériques et leurs crédits survivent', x.questions[0].content.alternatives[0].fraction===50 && x.questions[0].content.questiontext===variants.questions[0].content.questiontext);
        const vb=await buildTestMbz(variants); const va=await extractMbz(await vb.blob.arrayBuffer());const vr=processor.parseFiles(va.files,va.activityDir);
        ok('MBZ : variante numérique avec tolérance et retour propres',vr.questions[0].content.alternatives[0].number===6.5 && vr.questions[0].content.alternatives[0].tolerance===.1 && vr.questions[0].content.alternatives[0].feedback==='Approché');
        const {processH5PContent}=await import('/js/h5p/processors/index.js');
        const content=r=>r.content||r;
        const fixture=async name=>(await(await fetch(`/assets/data/examples/${name}_1.json`)).json());
        const quiz=await fixture('quiz_mixte');quiz.randomQuestions=true;
        const qp=content(await processH5PContent('QuizSet',quiz));
        ok('QuestionSet : mélange des questions dans le vrai champ H5P',qp.randomQuestions===true);
        const mc=(await import('/js/h5p/processors/MultipleChoice.js')).default;
        const child={params:{question:'Question',answers:[{text:'A',correct:true},{text:'B',correct:true}],behaviour:{singleAnswer:false}}};mc.transformForQuizSet(child);
        ok('QCM imbriqué : plusieurs réponses autorisées par le vrai champ type',child.params.behaviour.type==='multi' && !('singleAnswer' in child.params.behaviour));
        const cp=await fixture('course_presentation');cp.enablePrintButton=true;
        const presentation=content(await processH5PContent('CoursePresentation',cp));
        ok('Présentation : impression dans le groupe override natif',presentation.override.enablePrintButton===true);
        const tf=content(await processH5PContent('TrueFalse',{question:'Question',correct:'true',overallFeedback:[{from:0,to:99,feedback:'À revoir'},{from:100,to:100,feedback:'Bravo'}]}));
        ok('Vrai/Faux : retours effectifs dans le paquet',tf.behaviour.feedbackOnCorrect==='Bravo' && tf.behaviour.feedbackOnWrong==='À revoir');
        const essayModel={questions:[{library:'H5P.Essay 1.5',params:{taskDescription:'Rédiger',keywords:[{keyword:'cellule',alternatives:['cellules'],options:{points:2,occurrences:3,feedbackIncluded:'Bien',feedbackMissed:'Ancien',forgiveMistakes:true}}]}}]};
        const ee=normalizeDataForEditor(structuredClone(essayModel),'QuizSet');ee.questions[0].params.keywords[0].options.feedbackMissed='Retouche';
        const er=denormalizeDataForSave(ee,'QuizSet');
        const ep=content(await processH5PContent('QuizSet',er)).questions[0].params.keywords[0];
        ok('Rédaction imbriquée : variantes, réglages natifs et retour retouché conservés',ep.alternatives[0]==='cellules' && ep.options.occurrences===3 && ep.options.feedbackMissed==='Retouche' && ep.options.forgiveMistakes===true);
        const nativeTf={question:'Question',correct:'true',behaviour:{feedbackOnWrong:'Ancien'},overallFeedback:[{from:0,to:100,feedback:'Ancienne proposition'}]};
        const tn=normalizeDataForEditor(nativeTf,'TrueFalse');ok('Vrai/Faux natif : le retour actuel est visible dans le formulaire',tn.feedbackOnWrong==='Ancien');
        tn.feedbackOnWrong='Nouveau';const te=content(await processH5PContent('TrueFalse',denormalizeDataForSave(tn,'TrueFalse')));
        ok('Vrai/Faux natif : la retouche gagne sur les anciens retours IA',te.behaviour.feedbackOnWrong==='Nouveau');
        const {getSchemaForType}=await import('/js/editor/content-detector.js');
        const testSchema=getSchemaForType('elea_test');
        const numericConfig=testSchema.sections.find(s=>s.id==='questions').fields.questions.itemSchema.content.schemas.numerical.answer.schema.number;
        ok('validation numérique clonée : nombre, virgule, exposant et joker acceptés ; texte refusé',numericConfig.pattern instanceof RegExp && ['0','-.75','5,5','1e-12','*'].every(v=>numericConfig.pattern.test(v)) && !numericConfig.pattern.test('abc'));
        const {parseGapAnswers,parseClozeGaps}=await import('/js/moodle/mbz-course-builder.js');
        const special=String.raw`{:SHORTANSWER:=accolade\} et dièse\##Retour \#1}`;
        const sp=parseClozeGaps(special).gaps[0], sa=parseGapAnswers(sp).answers[0];
        ok('Cloze : poids implicite et caractères échappés préservés',sp.weight==='1' && sa.text==='accolade} et dièse#' && sa.feedback==='Retour #1');
        // La puce de l'éditeur garde la source avancée complète, jusqu'à la vraie accolade fermante.
        const specialParts=parseClozeText(special);
        ok('Cloze avancée : édition sans tronquer une accolade échappée',specialParts.length===1 && specialParts[0].gapData.source===special);
        const mr={type:'MR',content:'=A~=B~C'};
        ok('Cloze multiréponse : normalisation du crédit et pénalité Moodle',fractionTrouCloze(mr,['A'])===.5 && fractionTrouCloze(mr,['A','B'])===1 && fractionTrouCloze(mr,['A','C'])===0);
        const layouts=buildQuizBackup({questions:[{type:'cloze',content:{questiontext:'{1:MCHS:=A~B} {1:MR:=A~=B~C}'}}]},ctx,12345);
        const layoutsDoc=new DOMParser().parseFromString(layouts.questionsXml,'text/xml');
        const nativeChoice=[...layoutsDoc.querySelectorAll('multichoice')];
        ok('Cloze natif : disposition, mélange et multiréponse conservés',nativeChoice[0].querySelector('layout').textContent==='2' && nativeChoice[0].querySelector('shuffleanswers').textContent==='1' && nativeChoice[1].querySelector('layout').textContent==='1' && nativeChoice[1].querySelector('shuffleanswers').textContent==='0' && nativeChoice[1].querySelector('single').textContent==='0');
        const insensitive={questions:[{type:'shortanswer',content:{questiontext:'Ville',usecase:'0',answers:[{text:'Paris',fraction:100}]}}]};
        const insensitiveDoc=new DOMParser().parseFromString(buildQuizBackup(insensitive,ctx,12345).questionsXml,'text/xml');
        ok('Réponse courte : la valeur native « 0 » conserve la casse indifférente',insensitiveDoc.querySelector('usecase').textContent==='0' && formats.generateMoodleXml(insensitive).includes('<usecase>0</usecase>'));
        const {pourcentageTest}=await import('/js/moodle/test-evaluation.js');
        ok('score global : points des questions et crédits partiels',pourcentageTest([{type:'numerical',content:{defaultgrade:3}},{type:'truefalse',content:{defaultgrade:1}}],{0:{fraction:.5},1:{fraction:1}})===63);
        const {default:renderTest}=await import('/js/simulators/elea-test.js');
        const screen=document.createElement('div');document.body.appendChild(screen);
        let finalScore;
        screen.addEventListener('simulator:completed',e=>{finalScore=e.detail.scorePct;});
        // Mode interactif (réglage du Test) : « Vérifier » par question.
        renderTest(screen,{quiz_settings:{preferredbehaviour:'interactive'},questions:[
            {type:'multichoice',content:{questiontext:'Réponse partielle',single:'true',defaultgrade:3,answers:[{text:'Partielle',fraction:50,feedback:'À compléter'},{text:'Exacte',fraction:100}]}},
            {type:'truefalse',content:{questiontext:'Le ciel est vert',defaultgrade:1,answer:{value:false,feedback_true:'Retour du vrai',feedback_false:'Retour du faux'}}}
        ]});
        screen.querySelector('#elea-start')?.click();
        screen.querySelector('[data-focus-key="mc-0"]').click();
        screen.querySelector('[data-focus-key="elea-action"]').click();
        ok('aperçu réel : un QCM à 50 % affiche le crédit partiel',!!screen.querySelector('.elea-feedback.partial'));
        screen.querySelector('[data-focus-key="elea-action"]').click();
        screen.querySelector('[data-focus-key="tf-1"]').click();
        screen.querySelector('[data-focus-key="elea-action"]').click();
        ok('aperçu réel : retour de la réponse Faux choisie',screen.querySelector('.elea-feedback.correct')?.textContent.includes('Retour du faux') && !screen.querySelector('.elea-feedback.correct')?.textContent.includes('Retour du vrai'));
        screen.querySelector('[data-focus-key="elea-action"]').click();
        ok('aperçu réel : le parcours reçoit le score pondéré de 63 %',finalScore===63);
        screen.remove();
        // Feedback différé (défaut, comme le .mbz) : pas de « Vérifier », correction à la fin.
        const differe=document.createElement('div');document.body.appendChild(differe);
        let scoreDiffere;differe.addEventListener('simulator:completed',e=>{scoreDiffere=e.detail.scorePct;});
        const questionsDiff=[
            {type:'multichoice',content:{name:'Q1',questiontext:'Réponse partielle',single:'true',defaultgrade:3,answers:[{text:'Partielle',fraction:50,feedback:'À compléter'},{text:'Exacte',fraction:100}]}},
            {type:'truefalse',content:{name:'Q2',questiontext:'Le ciel est vert',defaultgrade:1,answer:{value:false,feedback_true:'Retour du vrai',feedback_false:'Retour du faux'}}}
        ];
        renderTest(differe,{questions:questionsDiff});
        const action=()=>differe.querySelector('[data-focus-key="elea-action"]');
        differe.querySelector('[data-focus-key="mc-0"]').click();
        const {translations:dico}=await import('/js/core/translation.js');
        ok('aperçu différé : pas de « Vérifier » ni de correction pendant la tentative',!differe.querySelector('.elea-feedback') && action().textContent.trim()!==(dico.simulator_check||'Vérifier') && !!differe.querySelector('.elea-test-mode-note'));
        action().click();
        ok('aperçu différé : navigation libre, « Précédent » présent',!!differe.querySelector('[data-focus-key="elea-prev"]'));
        differe.querySelector('[data-focus-key="tf-1"]').click();action().click();
        ok('aperçu différé : correction et note à la fin, score transmis',scoreDiffere===63 && differe.querySelectorAll('.elea-test-end__item').length===2 && !!differe.querySelector('.elea-test-end__grade') && !!differe.querySelector('#elea-review-btn'));
        differe.querySelector('#elea-review-btn').click();
        ok('aperçu différé : la relecture montre la correction de chaque question',!!differe.querySelector('.elea-feedback.partial') && !!differe.querySelector('.should-be-selected'));
        differe.remove();
        // Séquentiel + « note seule » : pas de retour arrière, pas de relecture.
        const strict=document.createElement('div');document.body.appendChild(strict);
        renderTest(strict,{quiz_settings:{navmethod:'sequential',review:'marks'},questions:questionsDiff});
        strict.querySelector('[data-focus-key="elea-action"]').click();
        ok('aperçu séquentiel : pas de « Précédent »',!strict.querySelector('[data-focus-key="elea-prev"]'));
        strict.querySelector('[data-focus-key="elea-action"]').click();
        ok('aperçu « note seule » : la note, sans correction ni relecture',!!strict.querySelector('.elea-test-end__grade') && !strict.querySelector('.elea-test-end__item') && !strict.querySelector('#elea-review-btn') && !!strict.querySelector('.elea-test-end__note'));
        strict.remove();
        const nativeEssay=content(await processH5PContent('Essay',{taskDescription:'Rédiger',keywords:[{keyword:'Paris',options:{caseSensitive:true}}]}));
        const nestedEssay=content(await processH5PContent('QuizSet',{questions:[{library:'H5P.Essay 1.5',params:{taskDescription:'Rédiger',keywords:[{keyword:'Paris',options:{caseSensitive:true}}]}}]})).questions[0].params;
        ok('Rédaction : pas de fausse solution, casse locale autorisée par défaut',nativeEssay.solution.sample==='' && nestedEssay.solution.sample==='' && nativeEssay.behaviour.overrideCaseSensitive==null && nestedEssay.behaviour.overrideCaseSensitive==null && nativeEssay.keywords[0].options.caseSensitive===true);
        const partialQcm={questions:[{type:'multichoice',content:{single:'true',questiontext:'Degré de justesse',answers:[{text:'Exact',fraction:100},{text:'Partiel',fraction:50},{text:'Erreur',fraction:-25}]}}]};
        const qcmRound=processor.parseStandaloneXml(formats.generateMoodleXml(partialQcm)).questions[0].content.answers;
        ok('QCM unique : les crédits partiels et pénalités survivent au XML',qcmRound.map(a=>a.fraction).join(',')==='100,50,-25');
        return preuves;
    });
    resultats.forEach(n => console.log(`✓ ${n}`)); console.log(`Audit Test / éditeur : ${resultats.length} PASS / 0 FAIL`);
    assert.ok(resultats.length >= 11);
} finally { await browser?.close(); server.kill('SIGTERM'); }
