const translations_it = {
    subtitle: "Creazione Assistita di Risorse e Attività per Magistère ed Éléa",
    help_button: "Guida",
    help_modal_title: "🚀 Guida completa di Caramel per i docenti",
    help_modal_content: `
    <p>Benvenuto/a in <strong>Caramel</strong>! Questa guida è pensata per accompagnarti passo dopo passo, anche se stai iniziando ora. Il nostro obiettivo è aiutarti a creare attività didattiche interattive in modo semplice ed efficace.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Descrivere</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Scegliere</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generare</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Scaricare</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Comunità</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> La nostra filosofia: il controllo resta a te!</h4>
        <p>Con Caramel, l’IA è un’assistente, ma a guidare sei tu. Mantieni il controllo in ogni fase:</p>
        <ul>
            <li><strong>Prima:</strong> Definisci il quadro pedagogico compilando i campi di descrizione.</li>
            <li><strong>Durante:</strong> Una volta generato dall’IA il contenuto (codice JSON), puoi modificarlo direttamente nell’editor.</li>
            <li><strong>Dopo:</strong> Anche dopo il download, puoi aprire e modificare il file con altri strumenti se necessario.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Descrivi il tuo bisogno: il punto di partenza</h4>
        <p>Tutto inizia qui. Più la descrizione è chiara, più il risultato sarà pertinente. Due opzioni:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Modalità Rapida</span></h5>
            <p>Ideale per andare all’essenziale. Compila due campi:</p>
            <ul>
                <li><strong>Chi sei?</strong> Sii diretto/a. Nessuna frase completa necessaria. Esempi: <em>Docente di matematica</em>, <em>Formatore accademico</em>.</li>
                <li><strong>Cosa vuoi trattare?</strong> È il cuore della richiesta. Sii il più completo/a possibile. Includi tema, livello e vincoli. Esempio: <em>Introduzione alle frazioni per alunni di prima media, con esempi concreti come dividere una torta.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Modalità Avanzata</span></h5>
            <p>Per una richiesta più strutturata, questa modalità offre campi precisi:</p>
            <ul>
                <li><strong>Disciplina, Tema, Livello:</strong> per definire il contesto.</li>
                <li><strong>Numero di elementi:</strong> Molto importante! Corrisponde al numero di domande, date su una timeline, parole in un glossario, ecc.</li>
                <li><strong>Informazioni aggiuntive:</strong> Spazio per indicazioni specifiche, vincoli o altri dettagli rilevanti.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Abilita lettura documento</span><br>
            Questa potente opzione consente di basare la generazione su contenuti forniti da te. Puoi <strong>copiare-incollare un testo</strong> oppure <strong>caricare un file PDF</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacy:</strong> Tranquillo/a: l’elaborazione avviene <strong>interamente in locale sul tuo computer</strong>. Nessun dato viene inviato su Internet.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Scegli il tipo di attività</h4>
        <p>Una volta completata la descrizione, le tessere delle attività si attivano. Clicca su quella che corrisponde al tuo obiettivo didattico.</p>
        <details>
            <summary><strong>Clicca qui per vedere il dettaglio delle attività disponibili</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Attività interattive in formato H5P. Quelle contrassegnate con una stella <span class="feedback-star">*</span> includono di default un feedback dettagliato in 6 fasce di punteggio.</p>
            <ul>
                <li><strong>Linea del tempo:</strong> Crea una timeline interattiva per presentare una sequenza di eventi.</li>
                <li><strong>Flashcard:</strong> Crea carte fronte/retro per la memorizzazione.</li>
                <li><strong>Quiz (Question Set) <span class="feedback-star">*</span>:</strong> Serie di domande varie (scelta multipla, drag-and-drop, ecc.).</li>
                <li><strong>Glossario:</strong> Crea un glossario o una FAQ in formato accordion.</li>
                <li><strong>Cruciverba <span class="feedback-star">*</span>:</strong> Genera una griglia di cruciverba dalle definizioni.</li>
                <li><strong>Scrittura <span class="feedback-star">*</span>:</strong> Proponi un compito di scrittura con correzione automatica basata su parole chiave.</li>
                <li><strong>Riassunto <span class="feedback-star">*</span>:</strong> Gli studenti ricostruiscono un riassunto corretto scegliendo le frasi giuste.</li>
                <li><strong>Trascina le parole <span class="feedback-star">*</span>:</strong> Crea un testo in cui trascinare le parole mancanti.</li>
                <li><strong>Cloze (riempi gli spazi) <span class="feedback-star">*</span>:</strong> Gli studenti digitano le parole mancanti.</li>
                <li><strong>Evidenzia parole <span class="feedback-star">*</span>:</strong> Chiedi di evidenziare parole specifiche in un testo.</li>
                <li><strong>Vero/Falso:</strong> Domande binarie semplici.</li>
                <li><strong>Scelta multipla <span class="feedback-star">*</span>:</strong> Domande con una o più risposte corrette.</li>
                <li><strong>Zuppa di lettere:</strong> Crea una griglia di lettere per trovare parole.</li>
                <li><strong>Ordina i paragrafi <span class="feedback-star">*</span>:</strong> Riordinare i paragrafi in ordine corretto.</li>
                <li><strong>Serie a scelta unica <span class="feedback-star">*</span>:</strong> Serie di domande con una sola risposta corretta.</li>
                <li><strong>Carte di dialogo:</strong> Carte interattive fronte/retro con testo e audio.</li>
                <li><strong>Cloze avanzato <span class="feedback-star">*</span>:</strong> Attività avanzata con feedback specifico per errore.</li>
                <li><strong>Grafico:</strong> Crea grafici a torta o a barre per visualizzare dati.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Test (XML / GIFT):</strong> Genera una banca di domande (scelta multipla, abbinamento, ecc.) da importare in un test Moodle.</li>
                <li><strong>Scelta multipla (MBZ):</strong> Crea un’attività MCQ semplice e veloce.</li>
                <li><strong>Abbinamento (MBZ):</strong> Gioco di associazione fra coppie di elementi.</li>
                <li><strong>Milionario (MBZ):</strong> Gioco a quiz con difficoltà crescente.</li>
                <li><strong>Glossario (XML):</strong> File per importare una lista di definizioni in un glossario Moodle.</li>
                <li><strong>Pagina (MBZ / HTML):</strong> Costruisci una pagina di corso strutturata e formattata visivamente per Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Generare e affinare il contenuto</h4>
        <p>Dopo aver cliccato su una tessera, si apre una finestra. Qui interagisci con l’IA.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Opzione A: Genera con un clic</h5>
            <p>La via rapida. Clicca su <button class="help-btn-example-llm">Genera con un clic</button> per far produrre all’IA il contenuto e collocarlo direttamente nell’area risultati a destra. Puoi scegliere tra diversi modelli (veloce, potente...) tramite la freccia a destra del pulsante.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Opzione B: Usa un’IA esterna</h5>
            <p>Per il massimo controllo. Il prompt (istruzione per l’IA) appare a sinistra.</p>
            <ol>
                <li>Modifica il prompt se vuoi.</li>
                <li>Utilizzate il pulsante <strong>Copia il prompt</strong> e aprite un’IA pubblica a vostra scelta in una nuova scheda.</li>
                <li>Incolla il prompt nell’IA, recupera la risposta e incollala nell’area risultati a destra in Caramel.</li>
            </ol>
            <p>Icone utili: <span class="help-badge-icon"><i class="fas fa-expand"></i> Schermo intero</span> per il comfort e <span class="help-badge-icon"><i class="fas fa-lock"></i> Blocca</span> per proteggere il prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Scaricare e integrare la tua attività</h4>
        <p>Quando il contenuto è pronto, clicca sul pulsante di download (es.: <button class="help-btn-example-download">Genera H5P</button>). Ecco come integrare i file in Éléa/Moodle:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Attività H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>Metodo semplice:</strong> Attiva la modifica nel corso e trascina il file .h5p nella sezione desiderata. Ideale per un uso rapido.</li>
                        <li><strong>Metodo consigliato (per i progettisti):</strong> “Aggiungi attività o risorsa” → “Contenuto interattivo (H5P)” → campo “File”: carica il .h5p. Garantisce il corretto inserimento quando condividi il corso.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Pagina, Milionario, Abbinamento, MCQ)</summary>
                <div class="import-content">
                    <p>Questo formato importa un’attività completa nel corso.</p>
                    <ol>
                        <li>Nel corso, menu impostazioni (ingranaggio) → “Ripristina”.</li>
                        <li>Trascina il file .mbz nell’area di importazione.</li>
                        <li>Segui i passaggi cliccando su “Continua”. L’attività verrà aggiunta al corso.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> e <span class="help-badge-file">GIFT</span> (Attività Quiz)</summary>
                <div class="import-content">
                    <p>Questi formati importano domande nella “Banca domande”.</p>
                    <ol>
                        <li>Menu “Altro” del corso → “Banca domande”.</li>
                        <li>Clic su “Importa”.</li>
                        <li>Scegli “Formato Moodle XML” o “Formato GIFT”.</li>
                        <li>Trascina il file nell’area “Importa” e conferma.</li>
                        <li>Le domande sono ora pronte per essere aggiunte a un “Quiz”.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternativa per l’attività Pagina)</summary>
                <div class="import-content">
                    <p>Per un controllo manuale del contenuto.</p>
                    <ol>
                        <li>Apri il file .html con un editor di testo (es.: Blocco note) e copia tutto il contenuto.</li>
                        <li>In Éléa, aggiungi un’attività “Pagina”.</li>
                        <li>Nell’editor della pagina, clicca sull’icona per passare alla modalità HTML (spesso rappresentata da \`</\>\`).</li>
                        <li>Incolla il contenuto copiato e salva.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Comunità e Supporto</h4>
        <p>Caramel è un progetto vivo e il tuo feedback è prezioso!</p>
        <ul>
            <li><strong>Discutere & Porre domande:</strong> Unisciti alla stanza <a href="https://tchap.beta.gouv.fr/#/room/#Caramel:agent.dinum.tchap.gouv.fr" target="_blank" rel="noopener noreferrer">Tchap</a> per interagire con la comunità.</li>
            <li><strong>Segnalare un bug:</strong> Problema? Apri un <a href="https://github.com/g-rem/caramel/issues" target="_blank" rel="noopener noreferrer">issue</a>. Se possibile, allega il file JSON che ha causato l’errore: ci aiuta molto a correggerlo.</li>
            <li><strong>Sostenere il progetto:</strong> Se lo strumento ti piace, lasciaci una stellina sulla <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">pagina Forge</a>. È la nostra ricompensa migliore!</li>
        </ul>
    </div>
    `,
    fast_mode: "Modalità Rapida",
    guided_mode: "Modalità Avanzata",
    who_are_you: "Chi sei? (es.: Insegnante, formatore...)",
    what_to_address: "Cosa desideri trattare? (es.: La natura di un angolo in prima media...)",
    discipline: "Disciplina (es.: Storia)",
    theme: "Tema (es.: La Rivoluzione francese)",
    level: "Livello (es.: Seconda classe professionale)",
    number_of_elements: "Numero di elementi (es.: 10)",
    additional_info: "Informazioni aggiuntive...",
    generate_prompts: "Genera i prompt",
    h5p_tab: "H5P",
    moodle_tab: "Moduli Éléa/Moodle",

    // General Context (Advanced Mode)
    prompt_expert_intro: "Sei un docente esperto di pedagogia che adatterà il tono e il vocabolario in funzione dei programmi attuali e del livello degli studenti per il corso di ",
    prompt_context_title: "**Contesto:**",
    prompt_subject: "- **Materia:**",
    prompt_student_level: "- **Livello degli studenti:**",
    prompt_theme: "- **Tema:**",
    prompt_number_of_elements: "- **Numero di elementi:**",
    prompt_additional_info: "- **Informazioni aggiuntive:**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "Sono un(a) **",
    prompt_simple_intro_part2: "** e desidero **",
    prompt_language_instruction: "Il contenuto generato deve essere in italiano, a meno che non sia specificata un'altra lingua nella richiesta.",
    prompt_code_block_instruction: "Devi generare il risultato in un blocco di codice.",

    // Timeline Prompt
    timeline_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Timeline\".",
    timeline_prompt_mission: "**La tua missione:**",
    timeline_prompt_generate_json: "Genera un oggetto JSON completo e valido per un’attività H5P di tipo Timeline. Il JSON deve essere direttamente utilizzabile.",
    timeline_prompt_json_structure_title: "**Struttura JSON attesa:**",
    timeline_prompt_json_structure_main_object: "L’oggetto principale deve contenere una chiave \"timeline\". Questo oggetto \"timeline\" deve includere:",
    timeline_prompt_headline: "`headline`: Un titolo generale per la frisa cronologica.",
    timeline_prompt_text: "`text`: Un breve paragrafo introduttivo.",
    timeline_prompt_asset: "`asset`: Un oggetto per l’immagine di copertina con `media` (URL), `caption` (didascalia) e `credit` (fonte).",
    timeline_prompt_date_array: "`date`: Un array contenente ${nombreQuestions} oggetti, ciascuno rappresentante un evento.",
    timeline_prompt_era_array: "`era`: Un array di oggetti per definire periodi che coprono più eventi.",
    timeline_prompt_content_rules_title: "**Regole per il contenuto:**",
    timeline_prompt_rule1: "1. Ogni evento nell’array `date` deve avere:",
    timeline_prompt_rule1_startDate: "- `startDate` e `endDate`: Data nel formato \"AAAA,MM,GG\" o \"AAAA\". Usa `endDate` per definire un periodo.",
    timeline_prompt_rule1_headline: "- `headline`: Titolo dell’evento.",
    timeline_prompt_rule1_text: "-   `text`: Descrizione del testo. Usa `*parola*` per il grassetto, `**parola**` per il corsivo e `\\n` per le interruzioni di riga.",
    timeline_prompt_rule1_asset: "- `asset`: Un oggetto opzionale con un’immagine illustrativa dell’evento.",
    timeline_prompt_rule1_tag: "- `tag`: Una parola chiave che caratterizza il periodo (es: 'storia', 'scienza').",
    timeline_prompt_rule2: "2. Per ogni `asset`, cerca attivamente un'immagine pertinente e libera da diritti (es: Wikimedia Commons). L'URL in `media` deve essere un link diretto e valido. Fornisci la fonte e la licenza in `credit`. Se non viene trovata alcuna immagine adatta, ometti completamente l'oggetto `asset`.",
    timeline_prompt_rule3: "3. Per ogni periodo (`era`), aggiungi un campo `text` con una breve descrizione e un `tag`.",
    timeline_prompt_example_json_title: "**Esempio di struttura JSON:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Titolo della linea del tempo",
"text": "Introduzione al tema della linea del tempo.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Inizio della Prima Guerra Mondiale",
"text": "L'Austria-Ungheria dichiara guerra alla Serbia.",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "L'arciduca Francesco Ferdinando poco prima del suo assassinio.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "Guerra"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Armistizio del 1918",
"text": "Firma dell'armistizio a Rethondes, che segna la fine dei combattimenti.",
"tag": "Trattato"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Prima Guerra Mondiale",
"text": "È il periodo della Grande Guerra.",
"tag": "Periodo storico"
}
]
}
}
\`\`\` `, 
    timeline_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento. Il risultato sarà utilizzato direttamente da un altro strumento.",

    // Crossword Prompt
    crossword_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Crossword\".",
    crossword_prompt_mission: "**La tua missione:**",
    crossword_prompt_generate_json: "Genera un oggetto JSON completo e valido per un’attività di parole crociate H5P.",
    crossword_prompt_json_structure_title: "**Struttura JSON attesa:**",
    crossword_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    crossword_prompt_title: "`title`: Un titolo per l’attività.",
    crossword_prompt_words_array: "`words`: Un array di ${nombreQuestions} oggetti, ciascuno con:",
    crossword_prompt_answer: "`answer`: La parola da indovinare.",
    crossword_prompt_clue: "`clue`: La definizione corrispondente. È vietato scrivere nel suggerimento la parola da trovare.",
    crossword_prompt_extra_clue_optional: "`extraClue` (opzionale): Oggetto con un suggerimento aggiuntivo. Il testo del suggerimento può usare `*parola*` per il grassetto, `**parola**` per il corsivo e `\\n` per gli a capo. L'IA deve valutarne la pertinenza.",
    crossword_prompt_task_description: "`taskDescription`: Istruzione chiara e contestualizzata. Usa `*parola*` per il grassetto, `**parola**` per il corsivo e `\\n` per gli a capo. Dopo un a capo, specifica la regola per i composti: \"Scrivi le parole composte come un'unica parola, senza spazi né trattini.\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",
    crossword_prompt_content_rules_title: "**Regole di contenuto:**",
    crossword_prompt_rule1: "1.  REGOLA RIGOROSA: Le parole (`answer`) devono contenere solo lettere. Parole composte, acronimi o espressioni vanno fuse in un'unica parola senza spazi, trattini o altri caratteri.",
    crossword_prompt_rule2: "2. Le definizioni (`clue`) devono essere brevi e precise.",
    crossword_prompt_rule3: "3. Il resto della struttura JSON (comportamento, tema, ecc.) deve essere mantenuto.",
    crossword_prompt_example_json_title: "**Esempio di JSON per una parola:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Cruciverba di Biologia",
"words": [
{
"answer": "Cellula",
"clue": "Unità di base della vita.",
"extraClue": {
"params": {
"text": "Può essere *animale* o *vegetale*."
}
}
},
{
"answer": "DNA",
"clue": "Molecola che porta l'informazione genetica."
}
],
"taskDescription": "*Completa* il **cruciverba**."
}
\`\`\` `,   
    crossword_prompt_generate_only_json: "Genera il JSON completo e valido, compilando il titolo, la descrizione e l’array \"words\", senza altri commenti.",

    // Crossword UI translations
    crossword_across: "Orizzontale",
    crossword_down: "Verticale",
    crossword_check_answer: "Controlla",
    crossword_try_again: "Riprova",
    crossword_show_solution: "Mostra soluzione",
    crossword_extra_clue: "Indizio extra",
    crossword_close_window: "Chiudi finestra",
    crossword_submit_answer: "Invia",

    // Essay Prompt
    essay_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Essay\".",
    essay_prompt_mission: "**La tua missione:**",
    essay_prompt_generate_json: "Genera un oggetto JSON completo e valido per un’attività H5P di tipo Essay.",
    essay_prompt_json_structure_title: "**Struttura JSON attesa:**",
    essay_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    essay_prompt_task_description: "`taskDescription`: Un’istruzione chiara che invita lo studente a redigere un testo sul tema. Usa `*parola*` per il grassetto, `**parola**` per il corsivo e `\\n` per le interruzioni di riga.",
    essay_prompt_keywords_array: "`keywords`: Un array di ${nombreQuestions} oggetti, ciascuno che definisce una parola chiave che il sistema dovrà individuare nella risposta dello studente.",
    essay_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",
    essay_prompt_content_rules_title: "**Regole per il contenuto:**",
    essay_prompt_rule1: "1. Ogni oggetto in `keywords` deve contenere la chiave `keyword` con la parola da cercare.",
    essay_prompt_rule2: "2. Le parole chiave devono essere pertinenti ed essenziali per valutare la comprensione del tema.",
    essay_prompt_rule3: "3. La struttura JSON (comportamento, ecc.) deve essere mantenuta.",
    essay_prompt_rule4: "4. L'istruzione (`taskDescription`) dovrebbe incoraggiare la scrittura senza utilizzare le parole chiave elencate in `keywords`, ad eccezione del nome del tema se necessario per la comprensione.",
    essay_prompt_example_json_title: "**Esempio di JSON per una parola chiave:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "Scrivi un breve testo che spieghi la fotosintesi.",
"keywords": [
{
"keyword": "luce",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "clorofilla",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "Genera il JSON completo e valido, compilando l’istruzione e l’elenco delle parole chiave, senza altri commenti.",

    // Prompt Moodle XML
    moodle_xml_prompt_role: "Sei un esperto di progettazione didattica. La tua missione è creare il contenuto di un’attività Test con il relativo question bank Moodle/Éléa generando un oggetto JSON valido.",
    moodle_xml_prompt_intro: "Voglio creare un quiz di ${nombreQuestions} domande.",
    moodle_xml_prompt_content_title: "**Regole per il contenuto:**",
    moodle_xml_prompt_content_rule1: "- Le risposte errate devono essere plausibili ma sbagliate.",
    moodle_xml_prompt_content_rule2: "- La difficoltà delle domande deve variare.",
    moodle_xml_prompt_content_rule3: "- La formulazione deve essere semplice e precisa.",
    moodle_xml_prompt_content_rule4: "- Il feedback deve spiegare brevemente la risposta corretta.",
    moodle_xml_prompt_question_types_intro: "**Struttura JSON attesa:**\nL’oggetto principale deve contenere le seguenti chiavi:\n- `bank_name`: Un nome breve e descrittivo per il question bank.\n- `bank_description`: Una frase che descrive il contenuto della banca.\n- `questions`: Un array di oggetti in cui ciascun oggetto rappresenta una domanda e deve avere `type` e `content`.",
    moodle_xml_prompt_question_type_multichoice: `
- **Per il tipo \`multichoice\` (Scelta multipla):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Titolo della domanda",
      "questiontext": "Testo della domanda.",
      "feedback": "Feedback generale.",
      "answers": [
        { "text": "Risposta 1", "fraction": 100, "feedback": "Feedback se scelta." },
        { "text": "Risposta 2", "fraction": 0, "feedback": "Feedback se scelta." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **Per il tipo \`matching\` (Abbinamento):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Titolo della domanda",
      "questiontext": "Testo della domanda.",
      "feedback": "Feedback generale.",
      "subquestions": [
        { "text": "Testo domanda 1", "answer": "Risposta 1" },
        { "text": "Testo domanda 2", "answer": "Risposta 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **Per il tipo \`numerical\` (Numerica):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Titolo della domanda",
      "questiontext": "Testo della domanda.",
      "feedback": "Feedback generale.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "Feedback per la risposta." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **Per il tipo \`truefalse\` (Vero/Falso):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Titolo della domanda",
      "questiontext": "Testo della domanda.",
      "feedback": "Feedback generale.",
      "answer": { "value": true, "feedback_true": "Feedback se Vero.", "feedback_false": "Feedback se Falso." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **Per il tipo \`shortanswer\` (Risposta breve):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Titolo della domanda",
      "questiontext": "Testo della domanda.",
      "feedback": "Feedback generale.",
      "answers": [
        { "text": "Risposta esatta 1", "fraction": 100, "feedback": "Feedback se scelta." },
        { "text": "Risposta alternativa", "fraction": 100, "feedback": "Feedback se scelta." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **Per il tipo \`cloze\` (Testo con lacune):**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Titolo della domanda",
      "questiontext": "Questo è un testo con una lacuna {1:SHORTANSWER:=Risposta corretta~Feedback} e un’altra {1:MULTICHOICE:=Risposta corretta~Risposta errata}.",
      "feedback": "Feedback generale."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**Istruzioni finali:**",
    moodle_xml_prompt_form_rule1: "Distribuisci equamente le domande tra i diversi tipi.",
    moodle_xml_prompt_generate_only_json: "Genera solo codice JSON valido, senza alcun commento. Il risultato deve essere un unico oggetto JSON contenente la chiave `questions`.",

    // Creazione test Éléa
    moodle_xml_success_generation: "File {fileName} generato con successo!",
    test_error_creation_mbz: "Errore durante la creazione del MBZ per il test:",
    test_success_generation: "File {fileName} generato con successo!",
    test_error_generic: "Errore:",
    test_backup_log: "Backup creato automaticamente da Caramel\n",

    // GIFT Prompt
    gift_prompt_role: "Sei un esperto di ingegneria pedagogica che crea una banca di domande per un'attività di test Moodle/Éléa in formato GIFT.",
    gift_prompt_intro: "Desidero creare un quiz di ${nombreQuestions} domande.",
    gift_prompt_format_info: "Il quiz deve essere in formato GIFT, destinato all’importazione in Moodle.",
    gift_prompt_question_quality: "Ogni domanda deve essere chiara, concisa e non ambigua. Deve includere feedback dettagliati.",
    gift_prompt_code_format_intro: "Il codice deve essere esattamente nello stesso formato di quello fornito di seguito:",
    gift_prompt_example_question_comment: "// domanda: 1  name: Qual è l’oggetto centrale del nostro sistema solare?",
    gift_prompt_example_question_text: "::Qual è l’oggetto centrale del nostro sistema solare?::Qual è l’oggetto centrale del nostro sistema solare?{",
    gift_prompt_example_answer_correct: "=Il Sole#Esatto! Il Sole è la stella centrale del nostro sistema solare. Ben fatto!",
    gift_prompt_example_answer_incorrect1: "~La Luna#Falso. La Luna è un satellite naturale della Terra. Il Sole è l’oggetto centrale.",
    gift_prompt_example_answer_incorrect2: "~Giove#Falso. Giove è un pianeta gigante gassoso. Il Sole è l’oggetto centrale.",
    gift_prompt_example_answer_incorrect3: "~La Terra#Falso. La Terra è il pianeta in cui viviamo. Il Sole è l’oggetto centrale.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "Il quiz deve includere diversi tipi di domande in modo casuale:",
    gift_prompt_question_type_multichoice: "- domande a scelta multipla (multichoice), con 1 risposta corretta e 3 distrattori.",
    gift_prompt_question_type_truefalse: "- domande vero/falso (truefalse).",
    gift_prompt_question_type_numerical: "- domande numeriche (numerical) con un margine di errore accettabile.",
    gift_prompt_question_type_matching: "- domande di abbinamento (matching) con almeno 4 coppie.",
    gift_prompt_generate_only_gift: "Genera direttamente il quiz in formato GIFT, senza commenti né tag aggiuntivi. Rispetta scrupolosamente il formato descritto, poiché incollerò il risultato in un altro strumento che si aspetta questo formato. Produci la risposta sotto forma di codice preformattato.",

    // Flashcards Prompt
    flashcards_prompt_role: "Sei un esperto di progettazione didattica che crea un'attività H5P 'Flashcards'.",
    flashcards_prompt_mission: "**La tua missione:**",
    flashcards_prompt_generate_json: "Genera un oggetto JSON completo e valido per un'attività H5P di tipo Flashcards. Il JSON deve essere immediatamente utilizzabile.",
    flashcards_prompt_json_structure_title: "**Struttura JSON prevista:**",
    flashcards_prompt_json_structure_main_object: "L'oggetto deve contenere:",
    flashcards_prompt_title: "`title`: Un titolo pertinente per l'attività.",
    flashcards_prompt_description: "`description`: Una consegna chiara per lo studente.",
    flashcards_prompt_association_principle: "Fronte e retro devono essere collegati da un criterio unico e stabile (es.: definizione→termine, figura→numero di lati, evento→data, autore→opera). Usa la stessa relazione per tutte le carte e formula la consegna così: «Associa ogni X a Y». Risposte (`answer`) normalizzate: una parola semplice o un numero, minuscole, senza articoli né punteggiatura; numeri in cifre.",
    flashcards_prompt_cards_array: "`cards`: Un array di ${nombreQuestions} oggetti, dove ogni oggetto rappresenta una carta e contiene:",
    flashcards_prompt_text: "`text`: La domanda o il termine da indovinare (fronte).",
    flashcards_prompt_answer: "`answer`: La risposta o la definizione (retro). Importante: `answer` può contenere solo una parola semplice o un numero, non parole composte o separate.",
    flashcards_prompt_tip: "`tip` (opzionale): Un suggerimento per aiutare lo studente se la domanda è difficile. Aggiungi un suggerimento solo se pertinente.",
    flashcards_prompt_tip_formatting: "Per i suggerimenti (`tip`), puoi usare `*parola*` per il grassetto e `**parola**` per il corsivo per evidenziare informazioni importanti.",
    flashcards_prompt_example_json_title: "**Esempio di JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "Le capitali d'Europa",
"description": "Memorizza la capitale di ogni paese. Clicca sulla carta per vedere la risposta.",
"cards": [
{
"text": "La capitale della Francia",
"answer": "Parigi"
},
{
"text": "La capitale dei Paesi Bassi",
"answer": "Amsterdam",
"tip": "<p>È la città dei <strong>canali</strong> e dei tulipani!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // QuizSet Prompt
    quiz_set_prompt_role: "Sei un esperto di ingegneria pedagogica che crea i contenuti per un’attività \"H5P Quiz (Question Set)\".",
    quiz_set_prompt_mission: "**La tua missione:**",
    quiz_set_prompt_generate_json: "Genera un oggetto JSON **solo per il contenuto** di un quiz H5P. Il JSON deve essere direttamente utilizzabile come file `content.json`.",
    quiz_set_prompt_json_structure_title: "**Struttura JSON attesa:**",
    quiz_set_prompt_json_structure_main_object: "L’oggetto principale deve contenere le seguenti chiavi:",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: Un array di ${nombreQuestions} oggetti, ciascuno rappresentante una domanda.",
    quiz_set_prompt_content_rules_title: "**Regole per il contenuto delle domande:**",
    quiz_set_prompt_rule1: "1. Ogni oggetto domanda deve avere le chiavi `library`, `params` e `subContentId`.",
    quiz_set_prompt_rule2: "2.  **Struttura:** Ogni domanda deve essere un oggetto con le chiavi `library`, `metadata` e `params`.",
    quiz_set_prompt_rule3: "3. Varia i tipi di domande. Usa le seguenti librerie con le versioni esatte:",
    quiz_set_prompt_rule4: "4.  **Feedback (REGOLA CRUCIALE):** Per **tutti i tipi di domande** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), **devi** generare un `overallFeedback` con esattamente 6 fasce di punteggio: 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Per le domande `TrueFalse`, aggiungi anche i campi `feedbackOnCorrect` e `feedbackOnWrong`. Il feedback deve essere benevolo, graduale e sempre formulato in modo affermativo.",
    quiz_set_prompt_rule5: "5.  **Contenuto:** Il contenuto in `params` deve essere pedagogicamente rilevante, con distrattori plausibili per i QCM e testi coerenti per le altre attività.",
    quiz_set_prompt_rule6: "6.  **Semplicità:** Non aggiungere immagini o parametri di comportamento superflui. Mantieni la struttura semplice come negli esempi.",
    quiz_set_prompt_example_json_title: "**Esempi di strutture per ogni tipo di domanda autorizzata:**",
    quiz_set_example_true_false: "Vero/Falso :",
    quiz_set_example_multiple_choice: "Scelta multipla :",
    quiz_set_example_fill_in_the_blanks: "Testo con spazi vuoti :",
    quiz_set_example_drag_the_words: "Trascina le parole :",
    quiz_set_example_mark_the_words: "Evidenzia le parole :",
    quiz_set_example_essay: "Redazione :",
    quiz_set_prompt_generate_only_json: "Genera solo il JSON valido, iniziando con `{\"progressType\": \"dots\", ...}`, senza alcun commento.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Titolo della domanda Vero/Falso" },
        "params": {
            "question": "La Francia è un paese?",
            "correct": "true",
            "feedbackOnCorrect": "Esatto! La Francia è effettivamente un paese.",
            "feedbackOnWrong": "Sbagliato. La Francia è riconosciuta a livello internazionale come un paese.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Titolo del QCM" },
        "params": {
            "question": "Qual è la capitale della Francia?",
            "answers": [
                { "text": "Parigi", "correct": true },
                { "text": "Berlino", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "Titolo dell'esercizio di completamento" },
        "params": {
            "questions": ["Parigi è la *capitale* della Francia."],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "Titolo dell'attività di trascinamento delle parole" },
        "params": {
            "taskDescription": "Completa la frase.",
            "textField": "*Parigi* è la capitale della Francia.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "Titolo dell'attività di marcatura delle parole" },
        "params": {
            "taskDescription": "Sottolinea la capitale.",
            "textField": "La capitale della Francia è *Parigi*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "Titolo del saggio" },
        "params": {
            "taskDescription": "Qual è la capitale della Francia?",
            "keywords": [
                { "keyword": "Parigi", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Accordion\".",
    glossary_prompt_mission: "**La tua missione:**",
    glossary_prompt_generate_json: "Genera un oggetto JSON completo e valido per un glossario H5P di tipo Accordion. Il JSON deve essere direttamente utilizzabile.",
    glossary_prompt_json_structure_title: "**Struttura JSON attesa:**",
    glossary_prompt_json_structure_main_object: "Genera un array di ${nombreQuestions} oggetti JSON.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: La parola o l’espressione da definire.",
    glossary_prompt_content: "`text`: La definizione. Usa `*parola*` per il grassetto, `**parola**` per il corsivo e `\\n` per le interruzioni di riga.",
    glossary_prompt_content_rules_title: "**Regole per il contenuto:**",
    glossary_prompt_rule1: "1. Le definizioni devono essere chiare, concise e adatte al livello degli studenti.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Esempio di JSON per una voce:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Fotosintesi",
"text": "Processo mediante il quale le piante verdi trasformano la luce solare in energia."
},
{
"title": "Cellula",
"text": "Unità base di tutti gli esseri viventi."
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // Summary Prompt
    summary_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Summary\".",
    summary_prompt_mission: "**La tua missione:**",
    summary_prompt_generate_json: "Genera un oggetto JSON completo per un’attività H5P di tipo Summary. Il JSON deve essere direttamente utilizzabile.",
    summary_prompt_json_structure_title: "**Struttura JSON attesa:**",
    summary_prompt_json_structure_main_object: "L'oggetto deve contenere le seguenti chiavi:",
    summary_prompt_intro_field: "`intro`: Una frase introduttiva per l'attività (es. \"Scegli l'affermazione corretta.\").",
    summary_prompt_summaries_array: "`summaries`: Un array di ${nombreQuestions} oggetti, ciascuno rappresentante una tappa del riassunto.",
    summary_prompt_summary_object: "Ogni oggetto in `summaries` deve contenere:",
    summary_prompt_summary_array: "- `summary`: Un array di frasi.",
    summary_prompt_tip_field: "- `tip` (opzionale ma consigliato): Un suggerimento per aiutare lo studente.",
    summary_prompt_content_rules_title: "**Regole per il contenuto:**",
    summary_prompt_rule1: "1. In ogni array \"summary\", **la prima frase è corretta**.",
    summary_prompt_rule2: "2. Le frasi successive sono distrattori plausibili ma errati.",
    summary_prompt_rule3: "3. Tutte le frasi corrette devono formare un riepilogo coerente.",
    summary_prompt_example_json_title: "**Esempio di JSON per una tappa:**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "Questa è la frase corretta.",
    "Questo è un distrattore.",
    "Questo è un altro distrattore."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",
    summary_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // Summary UI translations
    summary_intro: "Scegli l'affermazione corretta.",
    summary_solved_label: "Progresso:",
    summary_score_label: "Risposte sbagliate:",
    summary_result_label: "Il tuo risultato",
    summary_feedback: "Hai ottenuto @score affermazioni corrette su @total (@percent %).",
    summary_label_correct: "Corretto.",
    summary_label_incorrect: "Sbagliato! Riprova.",
    summary_label_correct_answers: "Risposte corrette.",
    summary_tip_button_label: "Mostra suggerimento",
    summary_score_bar_label: "Hai ottenuto :num punti su :total",
    summary_progress_text: "Progresso :num di :total",
    summary_alternative_incorrect_label: "Sbagliato",

    // Drag the Words Prompt
    drag_word_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Drag the Words\".",
    drag_word_prompt_mission: "**La tua missione:**",
    drag_word_prompt_generate_json: "Genera un oggetto JSON completo per un’attività H5P di tipo Drag the Words. Il JSON deve essere direttamente utilizzabile.",
    drag_word_prompt_json_structure_title: "**Struttura JSON attesa:**",
    drag_word_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    drag_word_prompt_task_description: "`taskDescription`: Un’istruzione chiara.",
    drag_word_prompt_text_field: "`textField`: Il testo da completare. Ogni frase deve terminare con un'interruzione di riga `\\n`.",
    drag_word_prompt_content_rules_title: "**Regole per il contenuto:**",
    drag_word_prompt_rule1: "1. Crea un testo coerente sul tema, con frasi brevi che terminano con `\\n`.",
    drag_word_prompt_rule2: "2. Le parole da trascinare sono racchiuse tra asterischi. Puoi aggiungere un suggerimento con `:il mio suggerimento` e un feedback con `\\+feedback corretto \\-feedback errato`.",
    drag_word_prompt_example_json_title: "**Esempio di JSON:**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Completa il testo trascinando le parole.",
"textField": "Il *sistema solare* è composto da *otto* pianeti che orbitano attorno al *Sole*."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",

    // Drag the Words UI translations
    drag_words_check_answer: "Controlla",
    drag_words_try_again: "Riprova",
    drag_words_show_solution: "Mostra soluzione",
    drag_words_score_feedback: "Punteggio: @score su @total.",
    drag_words_tip_label: "Mostra suggerimento",
    drag_words_correct_text: "Corretto!",
    drag_words_incorrect_text: "Sbagliato!",
    drag_words_score_bar_label: "Hai ottenuto :num punti su :total",
    drag_words_submit_answer: "Invia",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Fill in the Blanks\".",
    blanks_prompt_mission: "**La tua missione:**",
    blanks_prompt_generate_json: "Genera un oggetto JSON completo per un’attività H5P di tipo Fill in the Blanks. Il JSON deve essere direttamente utilizzabile.",
    blanks_prompt_json_structure_title: "**Struttura JSON attesa:**",
    blanks_prompt_json_structure_main_object: "L’oggetto deve contenere una chiave `questions`, che è un array di stringhe. Ogni stringa rappresenta un blocco di testo da completare.",
    blanks_prompt_content_rules_title: "**Regole per il contenuto:**",
    blanks_prompt_rule1: "- Le parole da indovinare sono racchiuse tra asterischi (*parola*).",
    blanks_prompt_rule2: "- Per risposte alternative, usa una barra: *Parigi/Città della Luce*.",
    blanks_prompt_rule3: "- Per aggiungere un suggerimento, usa i due punti: *open-source:Codice sorgente pubblico*.",
    blanks_prompt_example_json_title: "**Esempio di JSON:**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"Il sistema solare ha *otto* pianeti. Il più grande è *Giove*.",
"La capitale della Francia è *Parigi/Città della Luce*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",
    blanks_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Mostra soluzioni",
    blanks_try_again: "Riprova",
    blanks_check_answer: "Controlla",
    blanks_not_filled_out: "Per favore, compila tutti gli spazi.",
    blanks_answer_is_correct: "':ans' è corretto",
    blanks_answer_is_wrong: "':ans' è sbagliato",
    blanks_answered_correctly: "Risposta corretta",
    blanks_answered_incorrectly: "Risposta sbagliata",
    blanks_solution_label: "Risposta corretta:",
    blanks_input_label: "Spazio @num di @total",
    blanks_input_has_tip_label: "Suggerimento disponibile",
    blanks_tip_label: "Suggerimento",
    blanks_score_bar_label: "Hai ottenuto :num punti su :total",
    blanks_submit_answer: "Invia",
    blanks_feedback: "Hai compilato correttamente @score spazi su @total.",
    blanks_finish_header: "Finire?",
    blanks_finish_body: "Sei sicuro di voler finire?",
    blanks_cancel_label: "Annulla",
    blanks_finish_label: "Finisci",
    blanks_retry_header: "Riprovare?",
    blanks_retry_body: "Sei sicuro di voler riprovare?",
    blanks_retry_confirm_label: "Conferma",
    blanks_checking_mode_header: "Modalità di controllo",
    blanks_a11y_check: "Controlla le risposte. Le risposte saranno contrassegnate come corrette, errate o non risposte.",
    blanks_a11y_show_solution: "Mostra la soluzione. L'attività sarà contrassegnata con la sua soluzione corretta.",
    blanks_a11y_retry: "Riprova l'attività. Resetta tutte le risposte e ricomincia l'attività.",

    // Mark the Words Prompt
    mark_words_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Mark the Words\".",
    mark_words_prompt_mission: "**La tua missione:**",
    mark_words_prompt_generate_json: "Genera un oggetto JSON completo per un’attività H5P di tipo Mark the Words. Il JSON deve essere direttamente utilizzabile.",
    mark_words_prompt_json_structure_title: "**Struttura JSON attesa:**",
    mark_words_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    mark_words_prompt_task_description: "`taskDescription`: Un’istruzione chiara.",
    mark_words_prompt_text_field: "`textField`: Il testo in cui le parole da evidenziare sono racchiuse tra asterischi (*parola*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",
    mark_words_prompt_content_rules_title: "**Regole per il contenuto:**",
    mark_words_prompt_rule1: "1. Crea un paragrafo pertinente sul tema.",
    mark_words_prompt_rule2: "2. Identifica circa ${nombreQuestions} parole chiave importanti da evidenziare.",
    mark_words_prompt_rule3: "3. Ogni parola da evidenziare deve essere racchiusa individualmente tra asterischi. Ad esempio, `*parola1* *parola2*` è corretto, ma `*parola1 parola2*` non lo è.",
    mark_words_prompt_rule4: "4. Gli apostrofi o altri segni di punteggiatura non devono essere attaccati alle parole evidenziate. Ad esempio, `l'*albero*` è errato; si dovrebbe scrivere `l' *albero*` perché funzioni.",
    mark_words_prompt_example_json_title: "**Esempio di JSON:**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Clicca sulle parole importanti nel testo.",
"textField": "Il *sistema* *solare* è composto da *otto* pianeti che orbitano attorno al *Sole*."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // Mark the Words UI translations
    mark_words_check_answer: "Controlla",
    mark_words_try_again: "Riprova",
    mark_words_show_solution: "Mostra soluzione",
    mark_words_correct_answer: "Corretto!",
    mark_words_incorrect_answer: "Sbagliato!",
    mark_words_missed_answer: "Mancato!",
    mark_words_display_solution_description: "L'attività è aggiornata per contenere la soluzione.",
    mark_words_score_bar_label: "Hai ottenuto :num punti su :total",
    mark_words_submit_answer: "Invia",
    mark_words_a11y_full_text_label: "Testo completo leggibile",
    mark_words_a11y_clickable_text_label: "Testo completo in cui le parole possono essere evidenziate",
    mark_words_a11y_solution_mode_header: "Modalità soluzione",
    mark_words_a11y_checking_header: "Modalità di controllo",
    mark_words_a11y_check: "Controlla le risposte. Le risposte saranno contrassegnate come corrette, errate o non risposte.",
    mark_words_a11y_show_solution: "Mostra la soluzione. L'attività sarà contrassegnata con la sua soluzione corretta.",
    mark_words_a11y_retry: "Riprova l'attività. Resetta tutte le risposte e ricomincia l'attività.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "Le librerie di compressione (Tar.js o fflate) non sono state caricate. Controlla la connessione Internet o aggiorna la pagina.",
    millionnaire_error_invalid_json: "La struttura JSON non è valida. Assicurati che contenga un 'title' e un array 'questions' con 6 domande conformi all'esempio.",
    millionnaire_activity_intro: "Partecipa a questo gioco per mettere alla prova le tue conoscenze.",
    millionnaire_backup_log: "Backup creato automaticamente da Caramel\n",
    millionnaire_success_generation: "File {fileName} generato con successo!",
    millionnaire_error_creation_mbz: "Errore durante la creazione del file MBZ:",
    millionnaire_error_generic: "Errore:",

    // Millionnaire Prompt
    millionnaire_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Milionario\".",
    millionnaire_prompt_num_questions: "**Numero di domande:** 6",
    millionnaire_prompt_mission: "**La tua missione:**",
    millionnaire_prompt_generate_json: "Genera un oggetto JSON contenente un titolo e un elenco di **6 domande** per un gioco in stile \"Chi vuol essere milionario\".",
    millionnaire_prompt_important_rules_title: "**Regole importanti:**",
    millionnaire_prompt_rule1: "1. `title` deve essere un titolo pertinente e coinvolgente per l’attività.",
    millionnaire_prompt_rule2: "2. La difficoltà delle domande nell’array `questions` deve essere **crescente e didattica**, adatta al livello degli studenti. La prima domanda deve essere molto facile, l’ultima molto difficile.",
    millionnaire_prompt_rule3: "3. Il contenuto deve essere rigorosamente corretto e pertinente al tema e al livello scolastico.",
    millionnaire_prompt_json_structure_title: "**Struttura JSON attesa:**",
    millionnaire_prompt_main_object: "Un oggetto principale con due chiavi:",
    millionnaire_prompt_title: "- `title`: Il titolo dell’attività (stringa).",
    millionnaire_prompt_questions_array: "- `questions`: Un array di 6 oggetti, ciascuno dei quali rappresenta una domanda e contiene:",
    millionnaire_prompt_question: "- `question`: La domanda (stringa).",
    millionnaire_prompt_good_answer: "- `goodanswer`: La risposta corretta (stringa).",
    millionnaire_prompt_bad_answer: "- `badanswer`: Un array di 3 risposte errate (stringhe).",
    millionnaire_prompt_example_json_title: "**Esempio di JSON:**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "Quiz sulla Rivoluzione Francese",
"questions": [
{
"question": "Qual è la capitale della Francia?",
"goodanswer": "Parigi",
"badanswer": ["Berlino", "Londra", "Madrid"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Genera solo l’oggetto JSON valido, senza alcun commento.",

    // Appariement Prompt
    appariement_prompt_role: "Sei un esperto di ingegneria didattica che sta creando un'attività Moodle \"Abbinamento\".",
    appariement_prompt_num_questions: "**Numero di coppie:** 10",
    appariement_prompt_mission: "**La tua missione:**",
    appariement_prompt_generate_json: "Genera un oggetto JSON contenente un titolo e un elenco di **10 coppie** per un gioco di abbinamento.",
    appariement_prompt_important_rules_title: "**Regole importanti:**",
    appariement_prompt_rule1: "1.  Il `title` deve essere un titolo pertinente e coinvolgente per l'attività.",
    appariement_prompt_rule2: "2.  L'array `pairs` deve contenere 10 oggetti, ciascuno con una `question` (l'elemento a sinistra) e una `answer` (l'elemento a destra da abbinare).",
    appariement_prompt_rule3: "3.  Il contenuto deve essere rigorosamente accurato e pertinente al tema e al livello scolastico.",
    appariement_prompt_json_structure_title: "**Struttura JSON prevista:**",
    appariement_prompt_main_object: "Un oggetto principale con due chiavi:",
    appariement_prompt_title: "- `title`: Il titolo dell'attività (stringa).",
    appariement_prompt_pairs_array: "- `pairs`: Un array di 10 oggetti, in cui ogni oggetto rappresenta una coppia e contiene:",
    appariement_prompt_question: "- `question`: Il termine o l'immagine a sinistra (stringa).",
    appariement_prompt_answer: "- `answer`: La definizione o il termine corrispondente a destra (stringa).",
    appariement_prompt_example_json_title: "**Esempio di JSON:**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Abbinamento sulla Rivoluzione Francese",
"pairs": [
{
"question": "Presa della Bastiglia",
"answer": "14 luglio 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "Genera solo l'oggetto JSON valido, senza alcun commento.",
 
   // Creazione abbinamenti
   appariement_error_invalid_json: "La struttura JSON non è valida. Assicurati che contenga un 'title' e un array 'pairs' in cui ogni coppia abbia una 'question' e una 'answer'.",
   appariement_activity_intro: "Trova le coppie corrispondenti.",
   appariement_success_generation: "File {fileName} generato con successo !",
   appariement_error_creation_mbz: "Errore durante la creazione del MBZ per l'abbinamento:",

    // QCM Prompt
    qcm_prompt_role: "Sei un esperto di progettazione didattica che sta creando un'attività Moodle \"QCM\".",
    qcm_prompt_num_questions: "**Numero di domande:** 10",
    qcm_prompt_mission: "**La tua missione:**",
    qcm_prompt_generate_json: "Genera un oggetto JSON contenente un titolo e un elenco di **10 domande** per un QCM.",
    qcm_prompt_important_rules_title: "**Regole importanti:**",
    qcm_prompt_rule1: "1.  Il `title` deve essere un titolo pertinente e coinvolgente per l'attività.",
    qcm_prompt_rule2: "2.  L'array `questions` deve contenere 10 oggetti, ciascuno con un `text` (il testo della domanda) e un array `answers`.",
    qcm_prompt_rule3: "3.  Ogni array `answers` deve contenere diverse risposte possibili. Ogni risposta è un oggetto con `text` e `iscorrect` (1 per vero, 0 for falso). A seconda del contesto della domanda, puoi proporre domande con una sola risposta corretta o con più risposte corrette.",
    qcm_prompt_json_structure_title: "**Struttura JSON prevista:**",
    qcm_prompt_main_object: "Un oggetto principale con due chiavi:",
    qcm_prompt_title: "- `title`: Il titolo dell'attività (stringa).",
    qcm_prompt_questions_array: "- `questions`: Un array di 10 oggetti, in cui ogni oggetto rappresenta una domanda e contiene:",
    qcm_prompt_question_text: "- `text`: Il testo della domanda (stringa, può contenere HTML).",
    qcm_prompt_answers_array: "- `answers`: Un array di oggetti, in cui ogni oggetto rappresenta una risposta e contiene:",
    qcm_prompt_answer_text: "- `text`: Il testo della risposta (stringa, può contenere HTML).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 se la risposta è corretta, altrimenti 0.",
    qcm_prompt_example_json_title: "**Esempio di JSON:**",
    qcm_prompt_example: `\`\`\`json
{
"title": "QCM sulla Rivoluzione Francese",
"questions": [
{
"text": "Qual è la data della Presa della Bastiglia?",
"answers": [
{ "text": "14 luglio 1789", "iscorrect": 1 },
{ "text": "4 agosto 1789", "iscorrect": 0 },
{ "text": "26 agosto 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Genera solo l'oggetto JSON valido, senza alcun commento.",

    // Creazione quiz a scelta multipla
    qcm_error_invalid_json: "La struttura JSON non è valida. Assicurati che contenga un 'title' e un array 'questions' con almeno una domanda e delle risposte.",
    qcm_activity_intro: "Rispondi alle seguenti domande.",
    qcm_success_generation: "File {fileName} generato con successo !",
    qcm_error_creation_mbz: "Errore durante la creazione del MBZ per il quiz a scelta multipla:",

    // H5P Modules
    h5p_timeline_name: "Frisa cronologica",
    h5p_timeline_description: "Crea una frisa cronologica interattiva per presentare una sequenza di eventi.",
    h5p_flashcards_name: "Flashcards",
    h5p_flashcards_description: "Crea carte fronte-retro per facilitare la memorizzazione di termini e definizioni.",
    h5p_quiz_set_name: "Quiz",
    h5p_quiz_set_description: "Compila una serie di domande varie (QCM, drag-and-drop, ecc.) per valutare le conoscenze.",
    h5p_glossary_name: "Glossario",
    h5p_glossary_description: "Crea un glossario o una FAQ in formato a fisarmonica.",
    h5p_crossword_name: "Parole crociate",
    h5p_crossword_description: "Genera una griglia di parole crociate a partire da un elenco di parole e definizioni.",
    h5p_essay_name: "Redazione",
    h5p_essay_description: "Proponi un tema di scrittura e definisci parole chiave per una correzione automatizzata.",
    h5p_summary_name: "Riepilogo",
    h5p_summary_description: "Gli studenti devono ricostruire un riepilogo corretto scegliendo le frasi giuste.",
    h5p_drag_the_words_name: "Trascina le parole",
    h5p_drag_the_words_description: "Crea un testo con lacune in cui gli studenti devono trascinare le parole mancanti.",
    h5p_fill_in_the_blanks_name: "Completa gli spazi",
    h5p_fill_in_the_blanks_description: "Gli studenti devono inserire le parole mancanti in un testo direttamente da tastiera.",
    h5p_mark_the_words_name: "Evidenzia le parole",
    h5p_mark_the_words_description: "Chiedi agli studenti di evidenziare alcune parole in un paragrafo.",
    h5p_true_false_name: "Domanda Vero/Falso",
    h5p_true_false_description: "Crea domande semplici con una risposta binaria: vero o falso.",
    h5p_multiple_choice_name: "Scelta Multipla",
    h5p_multiple_choice_description: "Crea domande a scelta multipla con una o più risposte corrette.",
    h5p_find_the_words_name: "Trova le parole",
    h5p_find_the_words_description: "Crea una griglia di lettere in cui gli studenti devono trovare le parole.",
    h5p_sort_the_paragraphs_name: "Ordina i paragrafi",
    h5p_sort_the_paragraphs_description: "Crea un insieme di paragrafi che gli studenti devono ordinare correttamente.",
    h5p_single_choice_set_name: "Set di scelta singola",
    h5p_single_choice_set_description: "Crea una serie di domande in cui ogni domanda ha una sola risposta corretta.",
    h5p_dialog_cards_name: "Carte di dialogo",
    h5p_dialog_cards_description: "Crea carte interattive con testo e immagini opzionali su entrambi i lati.",
    h5p_complex_fill_the_blanks_name: "Completa gli spazi complesso",
    h5p_complex_fill_the_blanks_description: "Crea un testo avanzato da completare con feedback specifici per ogni errore.",
    h5p_chart_name: "Diagramma",
    h5p_chart_description: "Crea un diagramma circolare o a barre per visualizzare i dati.",

    // Moodle Modules
    moodle_xml_name: "Test",
    moodle_xml_description: "Genera una banca di domande da importare direttamente in un'attività di Test (in formato xml o gift)",
    moodle_xml_help: "Per aggiungere un file XML in un'attività «Quiz» su Moodle, crea prima l'attività. Poi apri il menu <strong>Altro</strong> e vai a <strong>Banca delle domande</strong>. In questo menu, fai clic su <strong>Importa</strong>, scegli il formato <strong>Moodle XML</strong>, quindi seleziona il tuo file e conferma.",
    moodle_gift_name: "Formato GIFT",
    moodle_gift_description: "Crea domande nel formato GIFT, un modo semplice per importare domande in Moodle.",
    moodle_millionnaire_name: "Milionario",
    moodle_millionnaire_description: "Genera un'attività unica 'Milionario' con 6 domande di difficoltà crescente.",
    moodle_appariement_name: "Abbinamento",
    moodle_appariement_description: "Genera un'attività di abbinamento con 10 domande.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Genera un'attività MCQ semplice.",

    moodle_glossaire_xml_name: "Glossario (XML)",
    moodle_glossaire_xml_description: "Genera un glossario pronto per l'importazione in formato XML.",

    elea_page_name: "Pagina",
    elea_page_description: "Creare una pagina di contenuto Éléa con formattazione visiva.",

    // Dynamic content
    prompt_for_ia: "Prompt per l’IA",
    copy_prompt: "Copia il prompt",
    fullscreen_prompt: "Schermo intero",
    exit_fullscreen_prompt: "Esci da schermo intero",
    lock_prompt: "Blocca il prompt",
    unlock_prompt: "Sblocca il prompt",
    go_duck: "Accedi a Duck.ai",
    go_mistral: "Accedi a Le Chat",
    create_h5p_file: "Crea il file H5P",
    integrate_h5p_libraries: "Integra le librerie H5P:",
    paste_ia_result: "Incolla il risultato dell’IA nell’area qui sotto per creare il tuo modulo.",
    generate_h5p: "Genera l’H5P",
    create_xml_file: "Crea il file XML",
    paste_ia_result_xml: "Incolla qui sotto l’XML generato dall’IA.",
    generate_xml_file: "Genera il file XML",
    export_mbz: "Formato MBZ",
    export_gift: "Formato GIFT",
    export_xml: "Formato XML",
    export_html: "Formato HTML",

    create_mbz_file_appariement: "Crea il file Abbinamento (.mbz)",
    paste_ia_result_appariement: "Incolla qui sotto il JSON generato dall'IA. Il titolo dell'attività verrà estratto automaticamente dal JSON.",
    generate_mbz_appariement: "Genera l'attività Abbinamento (mbz)",
    create_mbz_file_millionnaire: "Crea il file Milionario (.mbz)",
    paste_ia_result_millionnaire: "Incolla qui sotto il JSON generato dall'IA. Il titolo dell'attività verrà estratto automaticamente dal JSON.",
    generate_mbz_millionnaire: "Genera l'attività Milionario (mbz)",
    generate_mbz_test: "Genera l'attività Test (mbz)",

    create_mbz_file_qcm: "Crea file MCQ (.mbz)",
    paste_ia_result_qcm: "Incolla qui sotto il JSON generato dall'IA. Il titolo dell'attività verrà estratto automaticamente dal JSON.",
    generate_mbz_qcm: "Genera attività MCQ (mbz)",

    create_mbz_file_page: "Creare il file Pagina (.mbz)",
    paste_ia_result_page: "Incolla qui sotto il JSON generato dall'IA per costruire la pagina.",
    generate_mbz_page: "Generare l'attività Pagina (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "Il Moodle XML verrà visualizzato qui...",
    paste_xml_placeholder: "Incolla qui l'XML completo generato dall'IA...",

    // H5P campi di testo vuoti
    generate_prompts_placeholder: "Il prompt per l'IA apparirà qui non appena avrai completato almeno un campo nella modalità Rapida o nella modalità Avanzata.",
    paste_json_or_text: "Incolla qui il contenuto JSON o il testo generato dall'IA per creare la tua attività.",
    info_prompt_copy: "Non incollate questo prompt nel pannello di destra. Copiatelo in un’IA esterna per ottenere il risultato, quindi incollate tale risultato nel pannello di destra.",

    // Notifications
    caramel_success_title: "La tua caramella è pronta!",
    prompts_generated_successfully: "Prompt generati con successo!",
    success_copy: "✓ Copiato !",
    error_please_fill_fields: "Per favore, compila almeno un campo nella modalità Rapida.",
    error_please_fill_guided_fields: "Per favore, compila almeno un campo nella modalità Avanzata.",
    error_field_empty: "Il campo è vuoto. Genera prima un prompt.",
    error_copy_failed: "Copia non riuscita.",
    error_h5p_module_not_found: "Modulo '{moduleKey}' non trovato.",
    error_invalid_quiz_json: "Il JSON per il Quiz non è valido: {errorMessage}",
    error_invalid_json: "Il JSON fornito non è valido. Errore: {errorMessage}",
    error_h5p_creation: "Errore nella creazione dell’H5P: {errorMessage}",
    error_paste_ia_content: "Incolla il contenuto generato dall’IA.",
    error_compression_module_not_ready: "Il modulo di compressione non è pronto. Riprova tra un momento.",
    h5p_file_generated_successfully: "File {fileName} generato con successo!",
    h5p_creation_failed: "Creazione del file H5P non riuscita: {errorMessage}",
    license_info: "GNU GPL v3.0 o successiva",

    // Notifications for JSON content
    error_paste_json_content: "Si prega di incollare il contenuto JSON generato.",
    error_paste_xml_content: "Si prega di incollare il contenuto XML generato.",

    // Flashcards specific UI translations
    flashcards_progress_text: "Carta @card di @total",
    flashcards_next: "Successivo",
    flashcards_previous: "Precedente",
    flashcards_check_answer: "Controlla",
    flashcards_your_answer: "La tua risposta",
    flashcards_correct_answer: "Corretto",
    flashcards_incorrect_answer: "Sbagliato",
    flashcards_show_solution: "Risposta corretta",
    flashcards_results: "Risultati",
    flashcards_of_correct: "@score di @total corrette",
    flashcards_show_results: "Mostra risultati",
    flashcards_answer_short: "R:",
    flashcards_retry: "Riprova",
    flashcards_card_announcement: "Risposta sbagliata. La risposta corretta era @answer",
    flashcards_correct_announcement: "@answer è corretto.",
    flashcards_page_announcement: "Pagina @current di @total",

    ticket: "Ticket",
    legal_mentions: "Note legali",

    // Legal Mentions
    legal_title: "Note legali",
    legal_editor_title: "Editore dell'applicazione",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Funzione: Professore di Liceo Professionale Lettere-Storia",
    legal_editor_gauthier_remande_email: "Email: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Indirizzo: 39 avenue de Chanzy, 53000 Laval, Francia",
    legal_editor_gauthier_remande_phone: "Telefono: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Funzione: Insegnante di matematica e responsabile della missione DRANE – Accademia di Grenoble",
    legal_editor_emmanuel_gaunard_email: "Email: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Indirizzo: 30 boulevard de la République, 38200 Vienne, Francia",
    legal_editor_emmanuel_gaunard_phone: "Telefono: +33 6 46 74 20 94",
    legal_app_description: "L'applicazione web «Caramel» è un progetto libero e non commerciale per la creazione di contenuti H5P. Non è richiesto alcun account, non vengono raccolti dati personali e tutte le interazioni avvengono localmente nel browser.",
    legal_hosting_title: "Hosting",
    legal_host_name: "<strong>Host</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>Nome della società</strong>: Ministero dell'Istruzione Nazionale e della Gioventù",
    legal_host_address: "<strong>Indirizzo</strong>: 110 rue de Grenelle, 75007 Parigi, Francia",
    legal_host_phone: "<strong>Telefono</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Direttore della pubblicazione",
    legal_publication_director_name: "Gauthier REMANDE ed Emmanuel GAUNARD, in qualità di editori volontari.",
    legal_terms_of_use_title: "Condizioni generali d'uso",
    legal_terms_of_use_content: "Questo sito consente agli utenti di generare contenuti H5P. La visualizzazione avviene localmente, senza trasmissione di dati dell'utente. L'utente è l'unico responsabile dell'uso che fa dei contenuti generati. L'applicazione è offerta gratuitamente, senza alcuna garanzia di funzionamento o di risultato. L'editore declina ogni responsabilità in caso di errata interpretazione dei contenuti o di uso inappropriato.",
    legal_intellectual_property_title: "Proprietà intellettuale",
    legal_intellectual_property_content: "Tutti i codici sorgente, gli elementi grafici e i contenuti sono concessi in licenza con la licenza libera GNU AGPLv3. Il loro riutilizzo è consentito secondo i termini delle rispettive licenze. Qualsiasi ridistribuzione o modifica deve citare gli autori originali: Gauthier REMANDE ed Emmanuel GAUNARD. Le immagini utilizzate nei moduli H5P sono recuperate da H5P.org.",
    legal_personal_data_title: "Dati personali",
    legal_personal_data_content: "Nessun dato personale viene raccolto o memorizzato. Non vengono utilizzati cookie di tracciamento. La cronologia della sessione viene memorizzata nel browser locale dell'utente (localStorage), senza trasmissione. In conformità con il GDPR, nessuna informazione personale viene trasmessa all'editore o a terzi.",
    legal_ai_models_title: "Modelli di Intelligenza Artificiale",
    legal_ai_models_content: "L’applicazione Caramel si basa, esclusivamente durante la generazione con un clic, su modelli di IA operati da ILAAS, una federazione di infrastrutture di IA condivise. Le richieste sono instradate tramite un workflow n8n ospitato dall’Incubatore e quindi inviate a ILAAS per l’esecuzione su server affidabili ospitati in data center etichettati dal settore dell’Istruzione superiore e della Ricerca (ESR). Caramel non esegue i modelli e non elabora né conserva i dati in proprio; i dati sono utilizzati solo per evadere la richiesta e non vengono inviati a IA pubbliche destinate al grande pubblico. I modelli attualmente disponibili includono Mistral Small 3.2 (24B parametri), Llama 3.3 (70B parametri) e GPT‑OSS 120B (120B parametri). Eventuali attività di hosting, logging o conservazione effettuate da ILAAS sono disciplinate dalla loro informativa sulla privacy e dai termini di servizio.",
    legal_user_requests_processing_title: "Trattamento delle richieste degli utenti tramite n8n e l’Incubatore del Ministero dell’Istruzione nazionale",
    legal_user_requests_processing_content: "Il nostro sito utilizza una soluzione tecnica sviluppata con n8n, uno strumento open source ospitato dall’Incubatore del Ministero dell’Istruzione nazionale. Attraverso un flusso di lavoro automatizzato, questo servizio trasforma le richieste degli utenti in dati strutturati (formato JSON) per interagire con un’intelligenza artificiale della DINUM, pertanto sovrana. Nessuna informazione sensibile viene esposta o trasmessa senza cifratura, garantendo la riservatezza e la sicurezza degli scambi.",
    legal_accessibility_title: "Accessibilità",
    legal_accessibility_content: "L'applicazione è progettata per essere compatibile con l'uso su computer, comprese le modalità scuro/chiaro, la navigazione da tastiera e l'alto contrasto a seconda dei temi. È in corso un miglioramento continuo dell'accessibilità, in linea con le raccomandazioni RGAA.",
    legal_applicable_law_title: "Legge applicabile",
    legal_applicable_law_content: "Questo sito è soggetto alla legge francese. In caso di controversia, i tribunali competenti saranno quelli della giurisdizione di Lione.",
    legal_external_libraries_title: "Librerie esterne utilizzate",
    legal_external_libraries_intro: "L'applicazione Caramel utilizza diverse librerie open source, con le seguenti licenze:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licenza: CC BY 4.0, SIL OFL 1.1, MIT): Fornisce le icone utilizzate nell'interfaccia per migliorare la navigazione e l'esperienza visiva.",
    legal_library_jszip: "<strong>JSZip</strong> (Licenza: MIT o GPLv3): Consente di creare file .h5p comprimendo il contenuto necessario in un archivio zip.",
    legal_library_clientzip: "<strong>client-zip</strong> (Licenza: MIT): Un'altra libreria utilizzata per la compressione di file, che offre un'alternativa ad alte prestazioni per la generazione di archivi .h5p direttamente nel browser.",
    legal_library_fflate: "<strong>fflate</strong> (Licenza: MIT): Libreria molto veloce per la compressione e decompressione dei dati, utilizzata per la creazione di archivi .mbz per i moduli Moodle.",
    legal_library_tarjs: "<strong>tar-js</strong> (Licenza: MIT): Consente di creare archivi .tar, un passaggio necessario prima della compressione per formare i file .mbz per i moduli Moodle.",
    legal_library_ownership: "Ogni libreria rimane di proprietà dei rispettivi autori e viene utilizzata in conformità con la/le sua/e licenza/e.",

    // Essay specific UI translations
    essay_checkAnswer: "Controlla",
    essay_tryAgain: "Riprova",
    essay_showSolution: "Mostra soluzione",
    essay_feedbackHeader: "Feedback",
    essay_solutionTitle: "Soluzione di esempio",
    remainingChars: "Caratteri rimanenti: @chars",
    notEnoughChars: "Devi inserire almeno @chars caratteri!",
    messageSave: "salvato",
    placeholderText: "Inizia a scrivere qui...",
    ariaYourResult: "Hai ottenuto @score su @total punti",
    ariaNavigatedToSolution: "Navigato alla soluzione di esempio appena inclusa dopo l'area di testo.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "Il tuo lavoro è un buon inizio. Continua a esplorare l'argomento per arricchire le tue idee.",
    essay_overall_feedback_11_30: "Hai posto delle basi interessanti. Approfondendo alcuni punti, il tuo lavoro guadagnerà in precisione.",
    essay_overall_feedback_31_50: "La tua comprensione dell'argomento è a buon punto. Considera di sviluppare ulteriormente le tue argomentazioni per rafforzare il tuo punto di vista.",
    essay_overall_feedback_51_70: "Questo è un buon lavoro. Dimostri una buona padronanza dell'argomento. Qualche dettaglio in più potrebbe ancora migliorarlo.",
    essay_overall_feedback_71_90: "Ottimo lavoro! La tua analisi è pertinente e ben strutturata. Dimostri un'eccellente comprensione.",
    essay_overall_feedback_91_100: "Lavoro eccellente! La tua riflessione è approfondita, ben argomentata e dimostra una completa padronanza dell'argomento.",

    // True/False Question
    true_false_prompt_role: "Sei un esperto di progettazione didattica che crea una domanda Vero/Falso per un'attività H5P.",
    true_false_prompt_mission: "La tua missione è generare un oggetto JSON per una domanda Vero/Falso.",
    true_false_prompt_generate_json: "Genera un oggetto JSON basato sulla seguente struttura:",
    true_false_prompt_json_structure_title: "--- STRUTTURA JSON PREVISTA ---",
    true_false_prompt_json_structure_main_object: "L'oggetto principale deve contenere le seguenti chiavi:",
    true_false_prompt_question: "`question`: (string) L'affermazione da valutare. Può contenere HTML.",
    true_false_prompt_correct: "`correct`: (string) La risposta corretta, \"true\" o \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Commento visualizzato se la risposta è corretta.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Commento visualizzato se la risposta è errata.",
    true_false_prompt_content_rules_title: "--- REGOLE DI CONTENUTO ---",
    true_false_prompt_rule1: "La domanda deve essere un'affermazione chiara.",
    true_false_prompt_rule2: "Il valore di `correct` deve essere una stringa: \"true\" o \"false\".",
    true_false_prompt_example_json_title: "--- ESEMPIO DI JSON ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "Oslo è la capitale della Norvegia.",
"correct": "true",
"feedbackOnCorrect": "Risposta corretta! Oslo è infatti la capitale della Norvegia.",
"feedbackOnWrong": "Risposta sbagliata. La capitale della Norvegia è Oslo."
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "Voglio che tu generi solo il JSON, senza commenti o testo introduttivo.",
    true_false_true_text: "Vero",
    true_false_false_text: "Falso",
    true_false_score: "Hai ottenuto @score di @total punti",
    true_false_check_answer: "Controlla",
    true_false_show_solution_button: "Mostra soluzione",
    true_false_try_again: "Riprova",
    true_false_wrong_answer_message: "Risposta sbagliata",
    true_false_correct_answer_message: "Risposta corretta",
    true_false_score_bar_label: "Hai ottenuto :num di :total punti",
    true_false_submit_answer: "Invia",
    true_false_a11y_check: "Controlla le risposte. Le risposte saranno contrassegnate come corrette, errate o non risposte.",
    true_false_a11y_show_solution: "Mostra la soluzione. L'attività sarà contrassegnata con la sua soluzione corretta.",
    true_false_a11y_retry: "Riprova l'attività. Resetta tutte le risposte e ricomincia l'attività.",
    true_false_finish_header: "Finire?",
    true_false_finish_body: "Sei sicuro di voler finire?",
    true_false_cancel_label: "Annulla",
    true_false_finish_label: "Finisci",
    true_false_retry_header: "Riprovare?",
    true_false_retry_body: "Sei sicuro di voler riprovare?",
    true_false_retry_confirm_label: "Conferma",

    // Multiple Choice UI translations
    checkAnswerButton: "Controlla",
    showSolutionButton: "Mostra soluzione",
    tryAgainButton: "Riprova",
    submitAnswerButton: "Invia",
    scoreBarLabel: "Hai ottenuto :num punti su :total",
    confirmCheckHeader: "Finire?",
    confirmCheckBody: "Sei sicuro di voler finire?",
    confirmCheckCancelLabel: "Annulla",
    confirmCheckConfirmLabel: "Finisci",
    confirmRetryHeader: "Riprovare?",
    confirmRetryBody: "Sei sicuro di voler riprovare?",
    confirmRetryCancelLabel: "Annulla",
    confirmRetryConfirmLabel: "Conferma",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Scelta Multipla\".",
    multiple_choice_prompt_mission: "**La tua missione:**",
    multiple_choice_prompt_generate_json: "Genera un oggetto JSON completo e valido per un’attività H5P di tipo Scelta Multipla.",
    multiple_choice_prompt_json_structure_title: "**Struttura JSON attesa:**",
    multiple_choice_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    multiple_choice_prompt_question: "`question`: La domanda da porre (formato HTML).",
    multiple_choice_prompt_answers_array: "`answers`: Un array di oggetti, ciascuno rappresentante una risposta.",
    multiple_choice_prompt_text: "`text`: Il testo della risposta (formato HTML).",
    multiple_choice_prompt_correct: "`correct`: Un booleano (`true` o `false`) che indica se è la risposta corretta.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",
    multiple_choice_prompt_content_rules_title: "**Regole per il contenuto:**",
    multiple_choice_prompt_rule1: "1.  Ci deve essere una sola risposta corretta (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Fornisci diverse risposte errate (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Esempio di JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "Qual è il colore reale del ribes nero (cassis)?",
"answers": [
{
"correct": true,
"text": "Viola molto scuro"
},
{
"correct": false,
"text": "Blu"
},
{
"correct": false,
"text": "Nero"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // Find the Words UI translations
    check: "Controlla",
    tryAgain: "Riprova",
    showSolution: "Mostra soluzione",
    found: "@found di @totalWords parole trovate",
    timeSpent: "Tempo trascorso",
    score: "Hai ottenuto @score di @total punti",
    wordListHeader: "Elenco parole",

    // Find the Words Prompt
    find_the_words_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Trova le parole\".",
    find_the_words_prompt_mission: "**La tua missione:**",
    find_the_words_prompt_generate_json: "Genera un oggetto JSON completo e valido per un’attività H5P di tipo Trova le parole.",
    find_the_words_prompt_json_structure_title: "**Struttura JSON attesa:**",
    find_the_words_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    find_the_words_prompt_task_description: "`taskDescription`: Istruzioni chiare per l'attività.",
    find_the_words_prompt_word_list: "`wordList`: Una stringa di parole da trovare, separate da virgole senza spazi.",
    find_the_words_prompt_content_rules_title: "**Regole per il contenuto:**",
    find_the_words_prompt_rule1: "1.  La `wordList` deve essere un'unica stringa con parole separate da virgole. Ogni parola deve essere semplice (niente espressioni multi-parola). Sono vietati numeri, segni di punteggiatura e lettere con accenti/diacritici (es.: scrivi 'eleve' invece di 'élève').",
    find_the_words_prompt_example_json_title: "**Esempio di JSON:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Trova i nomi delle città nella griglia qui sotto",
"wordList": "Canberra,Minsk,Pechino,Oslo,Parigi,Londra,Madrid,Atene,Tokyo,Mosca,Washington,Stoccolma"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",
    fillPool: "abcdefghijklmnopqrstuvwxyz",

    // Sort the Paragraphs UI translations
    checkAnswer: "Controlla",
    submitAnswer: "Invia",
    up: "Su",
    down: "Giù",
    disabled: "Disabilitato",
    a11y_yourResult: "Hai ottenuto @score su @total punti",
    a11y_paragraph: "Paragrafo",
    a11y_correct: "corretto",
    a11y_wrong: "sbagliato",
    a11y_point: "@score punto",
    a11y_sevenOfNine: "@current di @total",
    a11y_currentPosition: "Posizione attuale nell'elenco",
    a11y_instructionsSelected: "Premi la barra spaziatrice per riordinare",
    a11y_instructionsGrabbed: "Premi i tasti freccia su e giù per cambiare posizione, la barra spaziatrice per rilasciare, Esc per annullare",
    a11y_grabbed: "Afferrato",
    a11y_moved: "Spostato",
    a11y_dropped: "Rilasciato",
    a11y_reorderCancelled: "Riordino annullato",
    a11y_finalPosition: "Posizione finale",
    a11y_nextParagraph: "Paragrafo successivo",
    a11y_correctParagraph: "Paragrafo corretto in posizione",
    a11y_listDescription: "Elenco di paragrafi ordinabili.",
    a11y_listDescriptionCheckAnswer: "Elenco di paragrafi con risultati.",
    a11y_listDescriptionShowSolution: "Elenco di paragrafi con soluzioni.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Ordina i paragrafi\".",
    sort_the_paragraphs_prompt_mission: "**La tua missione:**",
    sort_the_paragraphs_prompt_generate_json: "Genera un oggetto JSON completo e valido per un’attività H5P di ordinamento dei paragrafi.",
    sort_the_paragraphs_prompt_json_structure_title: "**Struttura JSON attesa:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Istruzioni chiare per l'attività. Usa `*parola*` per il grassetto, `**parola**` per il corsivo e `\\n` per le interruzioni di riga.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Un array di stringhe, ciascuna rappresentante un paragrafo da ordinare. I paragrafi devono essere nell'ordine corretto. Usa `*parola*` per il grassetto, `**parola**` per il corsivo.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",
    sort_the_paragraphs_prompt_content_rules_title: "**Regole per il contenuto:**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` deve formare una progressione logica inferibile dal contenuto, senza indizi artificiali (numeri, date/orari, «prima/poi/infine»), salvo richiesta esplicita.",
    sort_the_paragraphs_prompt_rule2: "2. Niente elenco piatto: ogni frase fa avanzare lo stesso filo (causa→effetto, preparazione→azione→risultato, generale→particolare) per rendere l’ordine deducibile.",
    sort_the_paragraphs_prompt_example_json_title: "**Esempio di JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "La mia routine del mattino:",
"paragraphs": [
  "Riempio il bollitore con acqua fresca.",
  "Lo accendo.",
  "Metto una bustina di tè nella tazza.",
  "Verso l'acqua bollente sulla bustina.",
  "Rimuovo la bustina quando l'infusione è pronta."
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Mostra soluzione",
    retryButtonLabel: "Riprova",
    solutionViewTitle: "Soluzione",
    correctText: "Corretto!",
    incorrectText: "Sbagliato!",
    muteButtonLabel: "Muto",
    closeButtonLabel: "Chiudi",
    slideOfTotal: "Diapositiva @slide di @total",
    nextButtonLabel: "Avanti",
    solutionListQuestionNumber: "Domanda @question",
    a11yShowSolution: "Mostra la soluzione. L'attività sarà contrassegnata con la sua soluzione corretta.",
    a11yRetry: "Riprova l'attività. Resetta tutte le risposte e ricomincia l'attività.",
    shouldSelect: "Dovrebbe selezionare",
    shouldNotSelect: "Non dovrebbe selezionare",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Set di scelta singola\".",
    single_choice_set_prompt_mission: "**La tua missione:**",
    single_choice_set_prompt_generate_json: "Genera un oggetto JSON completo e valido per un’attività H5P di tipo Set di scelta singola.",
    single_choice_set_prompt_json_structure_title: "**Struttura JSON attesa:**",
    single_choice_set_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    single_choice_set_prompt_choices_array: "`choices`: Un array di oggetti, in cui ogni oggetto rappresenta una domanda e contiene:",
    single_choice_set_prompt_question: "`question`: La domanda da porre.",
    single_choice_set_prompt_answers_array: "`answers`: Un array di stringhe. La prima stringa è sempre la risposta corretta.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (REGOLA RIGOROSA) Devi generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando rigorosamente le fasce 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100. Ogni oggetto deve avere la forma `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Il testo di `feedback` deve essere positivo, misurato e graduale.",
    single_choice_set_prompt_content_rules_title: "**Regole per il contenuto:**",
    single_choice_set_prompt_rule1: "1. In ogni array `answers`, la prima risposta è sempre quella corretta.",
    single_choice_set_prompt_example_json_title: "**Esempio di JSON:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "Le bacche di goji sono anche conosciute come ...",
"answers": ["Bacche di lupo", "Bacche di gatto", "Bacche di orso"]
},
{
"question": "Le bacche di goji sono originarie ...",
"answers": ["Asia", "Africa", "Europa"]
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // Dialog Cards UI translations
    answer: "Gira",
    next: "Successivo",
    prev: "Precedente",
    retry: "Riprova",
    progressText: "Carta @card di @total",
    cardFrontLabel: "Fronte della carta",
    cardBackLabel: "Retro della carta",
    tipButtonLabel: "Mostra suggerimento",
    audioNotSupported: "Il tuo browser non supporta questo audio",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "Sei un esperto di ingegneria pedagogica che crea un’attività H5P \"Carte di dialogo\".",
    dialog_cards_prompt_mission: "**La tua missione:**",
    dialog_cards_prompt_generate_json: "Genera un oggetto JSON contenente solo le chiavi `title`, `description` e `dialogs` per un’attività H5P di tipo Carte di dialogo.",
    dialog_cards_prompt_json_structure_title: "**Struttura JSON attesa:**",
    dialog_cards_prompt_json_structure_main_object: "L’oggetto deve contenere:",
    dialog_cards_prompt_title: "`title`: Un titolo per l'attività (formato HTML).",
    dialog_cards_prompt_description: "`description`: Una breve descrizione o istruzione (formato HTML).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: Un array di ${nombreQuestions} oggetti, ciascuno rappresentante una carta e contenente:",
    dialog_cards_prompt_text: "`text`: Il testo sul fronte della carta (formato HTML).",
    dialog_cards_prompt_answer: "`answer`: Il testo sul retro della carta (formato HTML).",
    dialog_cards_prompt_tips: "`tips` (opzionale): Un oggetto per i suggerimenti. Se lo ritieni pedagogicamente utile, aggiungi un suggerimento per il fronte con la chiave `front` e/o per il retro con la chiave `back`.",
    dialog_cards_prompt_content_rules_title: "**Regole per il contenuto:**",
    dialog_cards_prompt_rule1: "1. I testi per il fronte (`text`) e il retro (`answer`) devono essere chiari e concisi. **Formatta il contenuto con HTML (<strong> per il grassetto, <em> per il corsivo) per migliorare la leggibilità ed evidenziare le informazioni importanti.**",
    dialog_cards_prompt_example_json_title: "**Esempio di JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "Impara i nomi della frutta in inglese",
"description": "I nomi della frutta sono presentati in francese. Gira le carte per vedere la traduzione corretta in inglese.",
"dialogs": [
{
"title": "Trova i verbi inglesi al presente",
"description": "A partire da una frase in inglese al passato semplice, trova il verbo all'infinito. Gira le carte per verificare le tue risposte.",
"dialogs": [
{
"text": "He *visited* his grandmother.",
"answer": "to *visit*",
"tips": {
"front": "Individua il verbo al passato.",
"back": "Pensa alla forma base (infinito) del verbo."
}
},
{
"text": "She *played* soccer.",
"answer": "to *play*",
"tips": {
"front": "Cerca il verbo al passato.",
"back": "Immagina il verbo nella sua forma da dizionario (infinito)."
}
}
]
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Genera solo il codice JSON valido contenente le chiavi `title`, `description` e `dialogs`, senza alcun commento.",

    // Dialog Cards specific UI translations
    correctAnswer: "Ho risposto correttamente!",
    incorrectAnswer: "Ho sbagliato",
    round: "Round @round",
    cardsLeft: "Carte rimaste: @number",
    nextRound: "Procedi al round @round",
    startOver: "Ricomincia",
    showSummary: "Avanti",
    summary: "Riepilogo",
    summaryCardsRight: "Carte che hai risposto correttamente:",
    summaryCardsWrong: "Carte che hai sbagliato:",
    summaryCardsNotShown: "Carte nel mazzo non mostrate:",
    summaryOverallScore: "Punteggio complessivo",
    summaryCardsCompleted: "Carte che hai completato l'apprendimento:",
    summaryCompletedRounds: "Round completati:",
    summaryAllDone: "Ben fatto! Hai risposto correttamente a tutte le @cards carte @max volte di seguito!",
    confirmStartingOverHeader: "Ricominciare?",
    confirmStartingOverBody: "Tutti i progressi andranno persi. Sei sicuro di voler ricominciare?",
    confirmStartingOverCancelLabel: "Annulla",
    confirmStartingOverConfirmLabel: "Ricomincia",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "Sei un esperto di progettazione didattica che crea un'attività H5P \"Complex Fill the Blanks\".",
    complex_blanks_prompt_mission: "**La tua missione:**",
    complex_blanks_prompt_generate_json: "Genera un oggetto JSON completo e valido per un'attività H5P di tipo Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Struttura JSON attesa:**",
    complex_blanks_prompt_json_structure_main_object: "L'oggetto principale deve contenere le chiavi `content` e `overallFeedback`.",
    complex_blanks_prompt_task: "`task`: Le istruzioni per l'esercizio (in HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: Il testo contenente gli spazi vuoti, rappresentati da `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: Un array di oggetti, uno per ogni spazio vuoto, in ordine di apparizione.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: La risposta corretta (può includere alternative con `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: Un array di oggetti per errori comuni.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: Il testo di un errore comune.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: Il feedback specifico for questo errore (in HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: Un array per feedback generale basato sul punteggio.",
    complex_blanks_prompt_content_rules_title: "**Regole per il contenuto:**",
    complex_blanks_prompt_rule1: "1. Il numero di oggetti in `blanksList` deve corrispondere al numero di spazi vuoti in `blanksText`.",
    complex_blanks_prompt_rule2: "2. Fornisci errori comuni e feedback costruttivo.",
    complex_blanks_prompt_rule3: "3. Il testo e il feedback possono contenere tag HTML semplici come `<p>`, `<strong>`, `<em>`.",
    complex_blanks_prompt_example_json_title: "**Esempio di JSON:**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Metti i verbi al tempo corretto. Riceverai un feedback individuale per gli errori tipici.</p>",
"blanksList": [
{
"correctAnswerText": "non parla",
"incorrectAnswersList": [
{
"incorrectAnswerText": "parla non",
"incorrectAnswerFeedback": "<div>Ricorda di mettere 'non' prima del verbo <em>(parlare)</em>.</div>"
},
{
"incorrectAnswerText": "non parliamo",
"incorrectAnswerFeedback": "<div>Hai dimenticato che il soggetto è terza persona singolare <em>(lui)</em>.</div>"
}
]
}
],
"blanksText": "<p>Lui parla inglese ma (non / parlare) ___________<strong>&nbsp;</strong>tedesco.</p>"
},
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback per 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback per 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback per 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback per 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback per 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback per 91-100%" }
]
}
\`\`\` `,
    complex_blanks_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // Chart Prompt
    chart_prompt_role: "Sei un esperto di progettazione didattica che crea un'attività H5P \"Grafico\".",
    chart_prompt_mission: "**La tua missione:**",
    chart_prompt_generate_json: "Genera un oggetto JSON completo e valido per un'attività H5P di tipo Grafico.",
    chart_prompt_json_structure_title: "**Struttura JSON attesa:**",
    chart_prompt_json_structure_main_object: "L'oggetto deve contenere:",
    chart_prompt_graph_mode: "`graphMode`: Il tipo di grafico, 'pieChart' (a torta) o 'barChart' (a barre). L'IA dovrebbe scegliere il più pertinente in base al contesto, se non diversamente indicato.",
    chart_prompt_list_of_types: "`listOfTypes`: Un array di oggetti, ciascuno rappresentante un punto dati nel grafico.",
    chart_prompt_value: "`value`: Il valore numerico del punto dati.",
    chart_prompt_color: "`color`: Il colore del punto dati (codice esadecimale).",
    chart_prompt_font_color: "`fontColor`: Il colore del testo per il punto dati (codice esadecimale).",
    chart_prompt_text: "`text`: L'etichetta per il punto dati.",
    chart_prompt_figure_definition: "`figureDefinition`: Una breve descrizione del grafico.",
    chart_prompt_content_rules_title: "**Regole per il contenuto:**",
    chart_prompt_rule1: "1. Scegli colori contrastanti per una buona leggibilità.",
    chart_prompt_rule2: "2. Le etichette devono essere brevi e chiare.",
    chart_prompt_rule3: "3. Se un valore è molto basso in confronto con altri, preferisci un 'barChart' per una migliore visualizzazione.",
    chart_prompt_example_json_title: "**Esempio di JSON:**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Mirtilli"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Lamponi"}
],
"figureDefinition": "Grafico"
}
\`\`\` `,
    chart_prompt_generate_only_json: "Genera solo il codice JSON valido, senza alcun commento.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Precedente",
    quiz_next_button: "Successivo",
    quiz_finish_button: "Fine",
    quiz_submit_button: "Invia",
    quiz_textual_progress: "Domanda @current di @total",
    quiz_no_result_message: "Finito",
    quiz_result_message: "I tuoi risultati:",
    quiz_score_bar_label: "Hai ottenuto @finals punti su @totals",
    quiz_solution_button_text: "Mostra soluzione",
    quiz_retry_button_text: "Riprova",
    quiz_finish_button_text: "Fine",
    quiz_submit_button_text: "Invia",
    quiz_feedback_available: "Feedback disponibile",
    quiz_read_feedback: "Leggi feedback",
    quiz_wrong_answer: "Risposta sbagliata",
    quiz_correct_answer: "Risposta corretta",
    quiz_should_check: "Avrebbe dovuto essere selezionato",
    quiz_should_not_check: "Non avrebbe dovuto essere selezionato",
    quiz_no_input: "Per favore, rispondi prima di visualizzare la soluzione.",
    quiz_a11y_check: "Controlla le risposte. Le risposte saranno contrassegnate come corrette, errate o non risposte.",
    quiz_a11y_show_solution: "Mostra la soluzione. L'attività sarà contrassegnata con la sua soluzione corretta.",
    quiz_a11y_retry: "Riprova l'attività. Resetta tutte le risposte e ricomincia l'attività.",

    // IA di Caramel — generazione
    generate_with_llm: "Genera con l'IA di Caramel",
    generation_in_progress: "Generazione in corso, attendere prego...",
    request_sent_to_ia: "Richiesta inviata all'IA, attendere prego...",
    generation_successful: "Contenuto H5P generato con successo!",
    generation_failed_empty: "La generazione non è riuscita. La risposta era vuota.",
    generation_failed_error: "Errore durante la generazione: {errorMessage}",
    generation_failed_llm: "La generazione tramite l'IA di Caramel non è riuscita. Causa: {errorMessage}",

    // Descrizioni dei modelli (IA di Caramel)
    llm_small_summary: "Caramello morbido: veloce, leggero, perfetto per esercizi lampo e risposte senza attesa. Consuma poco.",
    llm_small_technical: "Mistral AI",
    llm_large_summary: "Caramello fluido: più ricco e più sfumato, ideale per compiti che richiedono un po' di profondità. Consuma di più.",
    llm_large_technical: "Meta AI",
    llm_xl_summary: "Caramello duro: potente e complesso, da riservare a progetti ambiziosi. Pazienza necessaria, risultato garantito! Consuma molto di più.",
    llm_xl_technical: "OpenAI",

    // Nomi amichevoli per i modelli (visualizzazione menu)
    llm_display_small: "Mistral-Small-3.2",
    llm_display_large: "LLaMa-3.3",
    llm_display_xl: "GPT-OSS",

    // Indicazioni dei modelli (IA di Caramel)
    llm_model_source: "Fornitore del modello:",
    llm_model_parameters: "Dimensione modello:",
    llm_model_parameters_small: "24 Mrd parametri",
    llm_model_parameters_large: "70 Mrd parametri",
    llm_model_parameters_xl: "120 Mrd parametri",

    language: "Lingua",
    tutorial: "Tutorial",

    // Prompt Glossario XML
    glossaire_xml_prompt_role: "Sei un esperto di instructional design e creerai i contenuti per un glossario.",
    glossaire_xml_prompt_mission: "**La tua missione:** Devi generare un semplice oggetto JSON contenente un elenco di termini per un glossario. Ogni termine deve avere un concetto, una definizione e, se pertinente, un elenco di alias.",
    glossaire_xml_prompt_structure_title: "**Struttura JSON attesa:**",
    glossaire_xml_prompt_structure_rules: `
-   **Radice:** Un oggetto principale che contiene due chiavi: \`name\` (il nome del glossario) e \`entries\` (un array di oggetti).
-   **Ogni oggetto in \`entries\` deve contenere:**
    -   \`concept\`: La parola o espressione da definire.
    -   \`definition\`: Una definizione chiara e concisa. Usa *mot* per il grassetto, **mot** per il corsivo e \\n per le interruzioni di riga, solo quando è pedagogicamente pertinente.
    -   \`aliases\` (opzionale): Un array di stringhe per sinonimi o termini alternativi. Aggiungi questa chiave solo se esistono alias pertinenti.`,
    glossaire_xml_prompt_example_title: "**Esempio JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "Il lessico dell'informazione",
  "entries": [
    {
      "concept": "Giornalista",
      "definition": "Persona che **raccoglie**, verifica e diffonde *informazioni*.",
      "aliases": ["Reporter", "Editorialista"]
    },
    {
      "concept": "Fonte",
      "definition": "Origine di un'*informazione*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Genera solo il codice JSON valido, senza alcun commento.",

    //Barre de menu
    tab_all: "Tutto",
    tab_quiz: "Quiz & Test",
    tab_text: "Manipolazione del testo",
    tab_memory: "Memorizzazione & Scoperta",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 Ottieni il prompt",
    create_file_step: "2/2 Crea il file",
    generate_one_click: "Generazione con un clic",
    simple_mode: "Semplice",
    advanced_mode: "Guidato",

    // RAG feature
    activate_rag: "Attiva consultazione documenti",
    rag_tooltip: "Permette di incollare testo o caricare un PDF. Il contenuto verrà utilizzato come fonte principale per generare le attività.",
    rag_title: "Allega documenti (opzionale)",
    rag_note: "Se desideri che l'IA lavori esclusivamente sui tuoi documenti, incolla il tuo testo o rilascia i tuoi file qui. Altrimenti, lascia quest'area vuota per permettere all'IA di cercare le informazioni autonomamente.",
    upload_pdf: "Oppure carica un PDF per l'analisi",
    pdf_loading: "Caricamento PDF...",
    pdf_processing_page: "Elaborazione pagina",
    ocr_recognizing_page: "Riconoscimento (OCR) pagina",
    ocr_success: "Il documento è stato elaborato con successo.",
    ocr_error: "Si è verificato un errore durante l'elaborazione.",
    error_invalid_pdf: "Seleziona un file PDF valido.",
    error_duplicate_pdf: "Questo file è già stato aggiunto.",
    error_fullscreen: "La modalità a schermo intero non è riuscita:",
    lock_text: "Blocca",
    unlock_text: "Sblocca",
    rag_instruction: "\n\nDovrai consultare solo le seguenti informazioni per generare il contenuto:",
    drag_drop_text: "Trascina e rilascia un file PDF qui",
    or_text: "o",
    upload_pdf_btn: "Scegli un file",
    paste_your_text_here: "Copia e incolla qui il tuo testo...",
    rag_tags_tuto: "Qui sotto troverete i documenti caricati. Fate clic sul cerchio colorato per personalizzare l’evidenziazione di ogni documento.",

    // Fasi di preparazione del caramello
    caramel_animation_step_1: "Versiamo lo zucchero nella casseruola...",
    caramel_animation_step_2: "Aggiungiamo un po’ d’acqua...",
    caramel_animation_step_3: "Scaldiamo a fuoco medio...",
    caramel_animation_step_4: "Lo zucchero comincia a sciogliersi...",
    caramel_animation_step_5: "Inizia a colorarsi...",
    caramel_animation_step_6: "Mescoliamo delicatamente...",
    caramel_animation_step_7: "Il caramello assume un bel colore ambrato...",
    caramel_animation_step_8: "Aggiungiamo la panna calda...",
    caramel_animation_step_9: "Attenzione agli schizzi!",
    caramel_animation_step_10: "Mescoliamo bene...",
    caramel_animation_step_11: "È quasi pronto!",

    // Prompt Pagina
    page_prompt_role: "Sei un esperto di ingegneria didattica che crea un'attività Pagina, strutturata, per Éléa/Moodle.",
    page_prompt_mission: "**La tua missione :**",
    page_prompt_generate_json: "Genera un oggetto JSON per costruire una pagina di contenuto Éléa. La struttura della pagina si basa su blocchi predefiniti. Devi selezionare i blocchi più pertinenti dall'elenco sottostante per soddisfare la richiesta dell'utente.",
    page_prompt_json_structure_title: "**Struttura JSON prevista :**",
    page_prompt_json_structure_main_object: "L'oggetto principale deve contenere la chiave \"title\" per il titolo della pagina, la chiave \"intro\" per un'introduzione chiara e comprensibile al contenuto del corso che segue, e la chiave \"blocks\" che è un array di oggetti. Ogni oggetto rappresenta un blocco di contenuto e deve avere un \"type\" corrispondente a uno dei blocchi sotto indicati, e un oggetto \"data\" contenente le informazioni specifiche del blocco.",
    page_prompt_blocks_list_title: "**Elenco dei blocchi disponibili :**",
    page_prompt_block_01: "- `#01_hero_header`: Banner di apertura. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: Sommario con link interni. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: Punti storici di riferimento in 3 schede. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (max 3 schede)",
    page_prompt_block_04: "- `#04_callout_set`: Banner Obiettivi, Da sapere, Allerta. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: Statistiche chiave in schede. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: Tabella di lessico. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: Glossario in chip. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: Schede monumenti con immagini. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: Due immagini a confronto. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: Tabella di confronto. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: Riquadro Definizione. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"Definizione\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: Paragrafi di corso. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: Scheda dettagliata. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: Domande frequenti. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: Miti vs Realtà. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"Miti\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"Realtà\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: Metodo per descrivere un'immagine. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: Webografia. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"Webografia\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: Citazione bilingue. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**Regole per il contenuto :**",
    page_prompt_rule1: "1.  Il JSON deve essere valido.",
    page_prompt_rule2: "2.  Il contenuto testuale può usare i tag Markdown `*parola*` per il grassetto e `**parola**` per il corsivo.",
    page_prompt_rule3: "3.  Per le immagini, trova URL pertinenti e liberi da diritti (es.: Wikimedia Commons).",
    page_prompt_example_json_title: "**Esempio di JSON :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "La Rivoluzione francese",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "La Rivoluzione francese", "subtitle": "Punti di riferimento essenziali" } },
    { "type": "#12_context_paragraphs", "data": { "title": "Contesto", "paragraphs": ["La Rivoluzione francese è un periodo di sconvolgimenti...", "Diverse cause spiegano questo evento..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "Eventi chiave", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "Presa della Bastiglia", "caption": "14 luglio 1789", "title": "Presa della Bastiglia", "text": "Questo evento segna l'inizio della Rivoluzione." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "Genera solo codice JSON valido, senza alcun commento."
};
