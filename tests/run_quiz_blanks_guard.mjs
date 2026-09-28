/** Question à trous incomplète : reproduire le défaut H5P et bloquer l'export. */
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {validateBlanksContent} from '../js/h5p/validate-blanks.js';
const {chromium}=createRequire(new URL('./roundtrip/package.json',import.meta.url))('playwright');
for(const params of [undefined,{}, {questions:[]},{questions:null},{questions:['']},{questions:['* *']},{questions:['**']},{questions:[null]},{questions:['Texte sans réponse.']}]) {
    assert.throws(()=>validateBlanksContent({questions:[{library:'H5P.Blanks 1.14',params}]},'H5P.QuestionSet'),/Texte à trous incomplet/);
}
const valid={questions:['Une phrase introductive.','La glace est de l’*eau*.']};
validateBlanksContent(valid,'H5P.Blanks');
validateBlanksContent({chapters:[{content:[{library:'H5P.Blanks 1.14',params:valid}]}]},'H5P.InteractiveBook');
validateBlanksContent({questions:['Oslo is the capital of *Norway*.']},'H5P.Blanks');
assert.throws(()=>validateBlanksContent({chapters:[{content:[{library:'H5P.Blanks 1.14',params:{}}]}]},'H5P.InteractiveBook'),/Texte à trous incomplet/);
const server=spawn('python3',['tests/serveur-statique.py','8194','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
    for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:8194')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
    browser=await chromium.launch();const page=await browser.newPage();
    await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
    await page.goto('http://127.0.0.1:8194/tests/preview-feedback-harness.html');await page.waitForFunction(()=>window.__pret);
    const results=await page.evaluate(async()=>{
        const {createH5PBlob}=await import('/js/h5p/h5p-creator.js');
        const failures=[];
        for(const params of [{},{questions:[]}]){
            try{await createH5PBlob({questions:[{library:'H5P.Blanks 1.14',params}]},'H5P.QuestionSet',[]);}
            catch(e){failures.push(e.message);}
        }
        const data=await window.__monter('QuizSet',{title:'Les états de l’eau',questions:[{
            library:'H5P.Blanks 1.14',params:{taskDescription:'Complétez.',questions:['La glace est de l’*eau*.']}
        }]});
        return {failures,content:data.contentJson};
    });
    assert.equal(results.failures.length,2);
    assert.ok(results.failures.every(x=>x.includes('Texte à trous incomplet')));
    const frame=page.frameLocator('.h5p-iframe');await frame.locator('input[type=text]').waitFor();
    assert.ok(!(await frame.locator('body').innerText()).includes('Oslo'));
    // Contre-épreuve avec le vrai lecteur H5P : paramètres absents OU tableau vide.
    const defaults=await frame.locator('body').evaluate(body=>{
        const {H5P}=body.ownerDocument.defaultView;
        return [{},{questions:[]}].map(params=>{
            const node=body.ownerDocument.createElement('div');body.append(node);
            H5P.newRunnable({library:'H5P.Blanks 1.14',params},H5P.instances[0].contentId,H5P.jQuery(node));
            const text=node.textContent;node.remove();return text;
        });
    });
    assert.ok(defaults.every(text=>text.includes('Oslo is the capital of')));
    await frame.locator('input[type=text]').fill('eau');
    await frame.getByText('Vérifier',{exact:true}).and(frame.locator(':visible')).first().click();
    await page.waitForFunction(()=>{const quiz=document.querySelector('.h5p-iframe').contentWindow.H5P.instances[0];return quiz.getScore()===1 && quiz.getMaxScore()===1;});
    console.log('PASS : démonstration Oslo reproduite dans H5P ; export incomplet refusé ; quiz valide exporté, rouvert et corrigé 1/1.');
}finally{await browser?.close();server.kill('SIGTERM');}
