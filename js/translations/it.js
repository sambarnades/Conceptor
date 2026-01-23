const translations_it = {
  subtitle: "Creazione Assistita di Risorse e Attività per Moodle ed Éléa",
  help_modal_title: "🚀 Guida completa di Caramel per i docenti",
  help_modal_content: `
    <p>Benvenuto/a in <strong>Caramel</strong>! Questa guida è pensata per accompagnarti passo dopo passo, anche se stai iniziando ora. Il nostro obiettivo è aiutarti a creare attività didattiche interattive in modo semplice ed efficace.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Descrivere</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Scegliere</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generare</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Visualizza e scarica</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Comunità</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> La nostra filosofia: il controllo resta a te!</h4>
        <p>Con Caramel, l'IA è un'assistente, ma a guidare sei tu. Mantieni il controllo in ogni fase:</p>
        <ul>
            <li><strong>Prima:</strong> Definisci il quadro pedagogico compilando i campi di descrizione.</li>
            <li><strong>Durante:</strong> Una volta generato dall'IA il contenuto (codice JSON), puoi modificarlo direttamente nell'editor.</li>
            <li><strong>Dopo:</strong> Anche dopo il download, puoi aprire e modificare il file con altri strumenti se necessario.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Descrivi il tuo bisogno: il punto di partenza</h4>
        <p>Tutto inizia qui. Più la descrizione è chiara, più il risultato sarà pertinente. Due opzioni:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Modalità Rapida</span></h5>
            <p>Ideale per andare all'essenziale. Compila due campi:</p>
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
            Questa potente opzione consente di basare la generazione su contenuti forniti da te. Puoi <strong>copiare-incollare un testo</strong> oppure <strong>caricare un documento (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacy:</strong> Nessuna preoccupazione, il trattamento del tuo documento avviene <strong>interamente in locale sul tuo computer</strong>. Nessun dato viene inviato a Internet.</p>
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
                <li><strong>Scelta multipla (MBZ):</strong> Crea un'attività MCQ semplice e veloce.</li>
                <li><strong>Abbinamento (MBZ):</strong> Gioco di associazione fra coppie di elementi.</li>
                <li><strong>Milionario (MBZ):</strong> Gioco a quiz con difficoltà crescente.</li>
                <li><strong>Glossario (XML):</strong> File per importare una lista di definizioni in un glossario Moodle.</li>
                <li><strong>Pagina (MBZ / HTML):</strong> Costruisci una pagina di corso strutturata e formattata visivamente per Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Generare e affinare il contenuto</h4>
        <p>Dopo aver cliccato su una tessera, si apre una finestra. Qui interagisci con l'IA.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Opzione A: Visualizzazione Semplice - Genera con un clic</h5>
            <p>La via rapida. Clicca su <button class="help-btn-example-llm">Genera con un clic</button> per far produrre all'IA il contenuto e collocarlo direttamente nell'area risultati a destra. Puoi scegliere tra diversi modelli (veloce, potente...) tramite la freccia a destra del pulsante.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Opzione B: Visualizzazione Guidata - Usa un'IA esterna</h5>
            <p>Per il massimo controllo. Il prompt (istruzione per l'IA) appare a sinistra.</p>
            <ol>
                <li>Modifica il prompt se vuoi.</li>
                <li>Utilizzate il pulsante <strong>Copia il prompt</strong> e aprite un'IA pubblica a vostra scelta in una nuova scheda.</li>
                <li>Incolla il prompt nell'IA, recupera la risposta e incollala nell'area risultati a destra in Caramel.</li>
            </ol>
            <p>Icone utili: <span class="help-badge-icon"><i class="fas fa-expand"></i> Schermo intero</span> per il comfort e <span class="help-badge-icon"><i class="fas fa-lock"></i> Blocca</span> per proteggere il prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Visualizza e scarica</h4>
        <p>Una volta generato il contenuto, puoi visualizzarlo, testarlo e scaricarlo in diversi formati.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> Visualizza e testa</summary>
            <p>Prenditi il tempo per controllare la tua attività nella finestra di visualizzazione:</p>
            <ul>
                <li><strong>Scorri</strong> il contenu per rileggere tutto.</li>
                <li><strong>Testa</strong> l'attività come uno studente (clicca, trascina, scrivi...).</li>
                <li>Per i contenuti <strong>Éléa/Magistère/Moodle</strong>, un simulatore ti mostra la resa reale.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Finestra di visualizzazione" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Testa l'attività direttamente nel simulatore.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Scarica (Formati ed Esportazioni)</summary>
            <p>Hai diverse opzioni per recuperare il tuo lavoro:</p>
            <ul>
                <li><strong>Formato interattivo (pulsante principale):</strong> Per recuperare il file digitale (es: .h5p, .mbz) da caricare sulla tua piattaforma.</li>
                <li><strong>Altri formati (menu a tendina):</strong> Clicca sulla freccia per scaricare in <strong>PDF, DOCX o ODT</strong> (utile per stampare o archiviare).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Menu di esportazione" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Apri il menu per accedere alle esportazioni PDF, DOCX...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Integra in Éléa/Magistère</h5>
        <p>Una volta scaricato il file, ecco come aggiungerlo al tuo corso:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Attività H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Metodo semplice:</strong> Attiva la modifica nel corso e trascina il file .h5p direttamente nella sezione desiderata. Scegli "Ajouter une activité H5P" e termina con il pulsante "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="Schermata per aggiungere rapidamente un'attività H5P" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Aggiungi l'attività H5P e fai clic su DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Metodo consigliato (per i progettisti):</strong> Fai clic su "Aggiungi attività o risorsa", scegli "Contenuto interattivo (H5P)" e, nel campo "Editor", seleziona la scheda "Téléverser" per proseguire con "Téléverser un fichier". Concludi con "Utiliser", aggiungi gli elementi necessari e salva. Questo metodo garantisce che l'attività sia inclusa quando condividi il corso.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Pagina, Milionario, Abbinamento, MCQ)</summary>
                <div class="import-content">
                    <p>Questo formato importa un'attività completa nel corso.</p>
                    <ol>
                        <li>
                            <p>Apri il menu di modifica sulla destra dello schermo. Se è chiuso, usa la piccola freccia per mostrarlo.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Menu di modifica aperto nella colonna destra" style="width:75%;height:auto;">
                                    <figcaption><em>Menu di modifica aperto.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Freccia per aprire il pannello di modifica" style="width:75%;height:auto;">
                                    <figcaption><em>Apri il pannello se necessario.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Fai clic su "IMPORT/EXPORT" e poi su "Importer un parcours" nel sottomenu.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="Pulsante IMPORT/EXPORT in Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Seleziona Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Trascina il file .mbz nell'area di importazione e fai clic su "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Zona in cui rilasciare il file MBZ" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Rilascia il file e conferma con IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>Termina facendo clic su "CONTINUER" all'ultimo passaggio: l'attività è ora nel corso.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Attività Glossario)</summary>
                <div class="import-content">
                    <p>Questo formato consente di importare un elenco di definizioni in un glossario Éléa/Moodle.</p>
                    <ol>
                        <li>
                            <p>Crea un'attività Glossario vuota nel corso e aprila.</p>
                        </li>
                        <li>
                            <p>Una volta all'interno del Glossario, fai clic sul pulsante "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="Pulsante IMPORTER DES ARTICLES nel glossario" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Fai clic su IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Trascina e rilascia il file .xml nell'area di importazione e fai clic sul pulsante "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Area di rilascio per il file XML del glossario" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Rilascia il file e convalida con ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Le tue voci sono state rilevate. Termina facendo clic sul pulsante "CONTINUER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Conferma delle voci rilevate" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Fai clic su CONTINUER per finalizzare l'importazione.</em></figcaption>
                            </figure>
                        </li>
                        <li>L'importazione è completata. Le definizioni sono ora disponibili nel Glossario.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> e <span class="help-badge-file">.GIFT</span> (Attività Quiz)</summary>
                <div class="import-content">
                    <p>Questi formati importano domande nella "Banca domande".</p>
                    <ol>
                        <li>
                            <p>Nel tuo corso Éléa, vai alla scheda "Altro", quindi fai clic su "Banca domande".</p>
                        </li>
                        <li>
                            <p>Nel menu a discesa dove è visualizzato "Domande", seleziona "Importa".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Selezione del pulsante Importa nella banca domande" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Seleziona Importa nel menu a discesa.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Seleziona il formato corrispondente al tuo file:</p>
                            <ul>
                                <li><strong>Formato Moodle XML</strong> (consigliato): formato completo che supporta tutti i tipi di domande.</li>
                                <li><strong>Formato GIFT</strong>: alternativa più semplice ma limitata nei tipi di domande.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Scelta tra Formato Moodle XML e Formato GIFT" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Seleziona il formato adatto al tuo file.</em></figcaption>
                            </figure>
                        </li>
                        <li>Trascina e rilascia il tuo file nell'area di caricamento.</li>
                        <li>Fai clic sul pulsante "IMPORTATION". Lo schermo visualizzerà le domande aggiunte (ad esempio: sono state aggiunte 10 domande).</li>
                        <li>Termina facendo clic su "CONTINUER" in fondo alla pagina.</li>
                        <li>Le domande sono ora pronte per essere aggiunte a un'attività Quiz. Consulta il <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">tutorial di Éléa</a> per creare un'attività Quiz e caricare domande dalla banca.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternativa per l'attività Pagina)</summary>
                <div class="import-content">
                    <p>Per un controllo manuale del contenuto.</p>
                    <ol>
                        <li>Apri il file .html con un editor di testo (es.: Blocco note) e copia tutto il contenuto.</li>
                        <li>In Éléa, aggiungi un'attività “Pagina”.</li>
                        <li>Nell'editor della pagina, clicca sull'icona per passare alla modalità HTML (spesso rappresentata da "&lt;&gt;").</li>
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
            <li><strong>Discutere & Porre domande:</strong> Unisciti alla stanza <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> per interagire con la comunità.</li>
            <li><strong>Segnalare un bug:</strong> Problema? Apri un <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">issue</a>. Se possibile, allega il file JSON che ha causato l'errore: ci aiuta molto a correggerlo.</li>
            <li><strong>Sostenere il progetto:</strong> Se lo strumento ti piace, lasciaci una stellina sulla <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">pagina Forge</a>. È la nostra ricompensa migliore!</li>
        </ul>
    </div>
    `,

  // ============================================================================
  // INTERFACCIA PRINCIPALE
  // ============================================================================
  language: "Lingua",
  tutorial: "Tutorial",
  notifications: "Notifiche",
  fast_mode: "Modalità Rapida",
  guided_mode: "Modalità Avanzata",
  who_are_you: "Chi sei? (es: Insegnante, formatore...)",
  what_to_address: "Cosa desideri affrontare? (es: La rivoluzione francese...)",
  level: "Per quale livello (es: Secondaria di secondo grado)",
  number_of_elements: "Numero di domande/elementi nel modulo (es: 5)",

  // ============================================================================
  // RAG/OCR
  // ============================================================================
  rag_title: "Allega documenti (facoltativo)",
  rag_note: "Se desideri che l'IA lavori esclusivamente a partire dai tuoi documenti, incolla il tuo testo o trascina i tuoi file qui. Altrimenti, lascia questa zona vuota per permettere all'IA di cercare le informazioni autonomamente.",
  error_duplicate_file: "Questo file è già stato aggiunto.",
  error_unsupported_format: "Formato non supportato. Formati accettati: ",
  ocr_scanned_page: "Pagina scansionata rilevata, OCR in corso",
  ocr_image_processing: "Riconoscimento (OCR) dell'immagine",
  ocr_initializing: "Inizializzazione dell'OCR...",
  ocr_loading_language: "Caricamento del modello linguistico...",
  ocr_preparing: "Preparazione dell'analisi...",
  docx_processing: "Estrazione del testo DOCX...",
  pptx_processing: "Estrazione del testo PPTX...",
  odt_processing: "Estrazione del testo ODT...",
  odp_processing: "Estrazione del testo ODP...",
  file_loading: "Caricamento del file...",
  extraction_success: "Il documento è stato elaborato con successo.",
  extraction_error: "Si è verificato un errore durante l'elaborazione.",
  error_fullscreen: "La modalità a schermo intero è fallita:",
  lock_text: "Blocca",
  unlock_text: "Sblocca",
  drag_drop_text: "Trascina un documento qui (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "o",
  upload_pdf_btn: "Scegli un file",
  paste_your_text_here: "Incolla il tuo testo qui...",
  rag_tags_tuto: "Trovi qui sotto i documenti caricati. Clicca sul cerchio colorato per personalizzare l'evidenziazione di ogni documento.",

  // ============================================================================
  // SCHEDE
  // ============================================================================
  tab_all: "Tutto",
  tab_quiz: "Quiz & Test",
  tab_text: "Manipolazione del testo",
  tab_memory: "Memorizzazione & Scoperta",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // ATTIVITÀ H5P - DETTAGLI
  // ============================================================================
  h5p_timeline_name: "Linea del tempo",
  h5p_timeline_description: "Crea una linea del tempo interattiva per presentare una sequenza di eventi.",
  h5p_flashcards_name: "Flashcard",
  h5p_flashcards_description: "Crea delle carte fronte-retro per aiutare la memorizzazione di termini e definizioni.",
  h5p_quiz_set_name: "Quiz misto",
  h5p_quiz_set_description: "Componi una serie di domande varie (scelta multipla, trascina e rilascia, ecc.) per valutare le conoscenze.",
  h5p_quiz_set_qcm_name: "Quiz a scelta multipla",
  h5p_quiz_set_qcm_description: "Crea un quiz composto esclusivamente da domande a scelta multipla.",
  h5p_quiz_set_vf_name: "Quiz Vero/Falso",
  h5p_quiz_set_vf_description: "Crea un quiz composto esclusivamente da domande di tipo Vero o Falso.",
  h5p_glossary_name: "Glossario",
  h5p_glossary_description: "Crea un glossario o una FAQ sotto forma di fisarmonica pieghevole.",
  h5p_crossword_name: "Cruciverba",
  h5p_crossword_description: "Genera una griglia di cruciverba a partire da un elenco di parole e definizioni.",
  h5p_essay_name: "Composizione",
  h5p_essay_description: "Proponi un argomento di redazione e definisci delle parole chiave per una correzione automatizzata.",
  h5p_summary_name: "Riassunto",
  h5p_summary_description: "Gli studenti devono ricostituire un riassunto corretto scegliendo le frasi giuste.",
  h5p_drag_the_words_name: "Trascina le parole",
  h5p_drag_the_words_description: "Crea un testo a buchi dove gli studenti devono trascinare le parole mancanti.",
  h5p_fill_in_the_blanks_name: "Testo a buchi",
  h5p_fill_in_the_blanks_description: "Gli studenti devono inserire le parole mancanti in un testo direttamente dalla tastiera.",
  h5p_mark_the_words_name: "Evidenzia le parole",
  h5p_mark_the_words_description: "Chiedi agli studenti di evidenziare alcune parole in un paragrafo.",
  h5p_true_false_name: "Vero/Falso",
  h5p_true_false_description: "Crea <strong style='color: red;'>un'unica</strong> domanda semplice con una risposta binaria: vero o falso.",
  h5p_multiple_choice_name: "Scelta multipla",
  h5p_multiple_choice_description: "Crea <strong style='color: red;'>un'unica</strong> domanda a scelta multipla con una o più risposte corrette.",
  h5p_find_the_words_name: "Trova le parole",
  h5p_find_the_words_description: "Crea una griglia di lettere dove gli studenti devono trovare delle parole.",
  h5p_sort_the_paragraphs_name: "Ordina i paragrafi",
  h5p_sort_the_paragraphs_description: "Crea un insieme di paragrafi che gli studenti devono rimettere nell'ordine corretto.",
  h5p_single_choice_set_name: "Serie di scelte singole",
  h5p_single_choice_set_description: "Crea una serie di domande dove ogni domanda ha una sola risposta corretta.",
  h5p_dialog_cards_name: "Carte di dialogo",
  h5p_dialog_cards_description: "Crea delle carte interattive fronte-retro con testo ed eventualmente immagini.",
  h5p_complex_fill_the_blanks_name: "Testo a buchi complesso",
  h5p_complex_fill_the_blanks_description: "Crea un testo a buchi avanzato con feedback specifici per ogni errore.",
  h5p_chart_name: "Diagramma",
  h5p_chart_description: "Crea un diagramma circolare o a barre per visualizzare dei dati.",

  // ============================================================================
  // ATTIVITÀ ÉLÉA/MOODLE - DETTAGLI
  // ============================================================================
  moodle_xml_name: "Test",
  moodle_xml_description: "Genera una banca di domande da importare direttamente in un'attività Test (in formato xml o formato gift)",
  moodle_xml_help: "Per aggiungere un file XML in un'attività « Test » su Moodle, inizia creando l'attività. Successivamente, apri il menu <strong>Altro</strong> e vai in <strong>Deposito delle domande</strong>. In questo menu, clicca su <strong>Importa</strong>, scegli il formato <strong>XML Moodle</strong>, quindi seleziona il tuo file e convalida.",
  moodle_gift_name: "Formato GIFT",
  moodle_gift_description: "Crea domande nel formato GIFT, un modo semplice per importare domande in Moodle.",
  moodle_millionnaire_name: "Milionario",
  moodle_millionnaire_description: "Genera un'attività unica 'Milionario' di 6 domande graduali in termini di difficoltà.",
  moodle_appariement_name: "Abbinamento",
  moodle_appariement_description: "Genera un'attività di abbinamento di 10 domande.",
  moodle_qcm_name: "QCM",
  moodle_qcm_description: "Genera un'attività QCM semplice.",
  moodle_glossaire_xml_name: "Glossario (XML)",
  moodle_glossaire_xml_description: "Genera un glossario pronto per essere importato nel formato XML.",
  glossaire_success_generation: "File {fileName} generato con successo!",
  glossaire_error_creation: "Errore durante la creazione dell'XML del glossario:",
  glossaire_error_invalid_json: "Il JSON deve contenere un nome ('name') e un array di voci ('entries').",
  elea_page_name: "Pagina",
  elea_page_description: "Crea una pagina di contenuti Éléa formattata visivamente.",

  // ============================================================================
  // MODALE DI GENERAZIONE
  // ============================================================================
  get_prompt_step: "1/2 Ottenere il prompt da copiare",
  create_file_step: "2/2 Creare il file a partire dal JSON",
  generate_one_click: "Genera in un clic",
  simple_mode: "Semplice",
  advanced_mode: "Guidato",
  prompt_for_ia: "Prompt per l'IA",
  copy_prompt: "Copia il prompt",
  fullscreen_prompt: "Schermo intero",
  exit_fullscreen_prompt: "Esci dallo schermo intero",
  lock_prompt: "Blocca",
  unlock_prompt: "Sblocca",
  go_duck: "Copia e vai su Duck.ai",
  go_mistral: "Copia e vai su Le chat",
  create_h5p_file: "Crea il file H5P",
  integrate_h5p_libraries: "Integra le librerie H5P:",
  paste_ia_result: "Incolla il risultato dell'IA nella zona sottostante per creare il tuo modulo.",
  generate_h5p: "Genera l'H5P",
  create_xml_file: "Crea il file XML",
  paste_ia_result_xml: "Incolla l'XML generato dall'IA qui sotto.",
  generate_xml_file: "Genera il file XML",
  export_mbz: "Formato MBZ",
  export_gift: "Formato GIFT",
  export_xml: "Formato XML",
  export_html: "Formato HTML",
  export_docx: "Formato DOCX",
  export_odt: "Formato ODT",
  export_pdf: "Formato PDF",
  export_error: "Errore di esportazione",
  create_mbz_file_appariement: "Crea il file Abbinamento (.mbz)",
  paste_ia_result_appariement: "Incolla il JSON generato dall'IA qui sotto. Il titolo dell'attività sarà estratto automaticamente dal JSON.",
  generate_mbz_appariement: "Genera l'attività Abbinamento (mbz)",
  create_mbz_file_millionnaire: "Crea il file Milionario (.mbz)",
  paste_ia_result_millionnaire: "Incolla il JSON generato dall'IA qui sotto. Il titolo dell'attività sarà estratto automaticamente dal JSON.",
  generate_mbz_millionnaire: "Genera l'attività Milionario (mbz)",
  generate_mbz_test: "Genera l'attività Test (mbz)",
  create_mbz_file_qcm: "Crea il file QCM (.mbz)",
  paste_ia_result_qcm: "Incolla il JSON generato dall'IA qui sotto. Il titolo dell'attività sarà estratto automaticamente dal JSON.",
  generate_mbz_qcm: "Genera l'attività QCM (mbz)",
  create_mbz_file_page: "Crea il file Pagina (.mbz)",
  paste_ia_result_page: "Incolla il JSON generato dall'IA qui sotto per costruire la pagina.",
  generate_mbz_page: "Genera l'attività Pagina (mbz)",
  generate_prompts_placeholder: "Il prompt per l'IA apparirà qui una volta completato almeno un campo della modalità Rapida o della modalità Avanzata.",
  paste_json_or_text: "Incolla qui il contenuto JSON o il testo generato dall'IA per creare la tua attività.",
  info_prompt_copy: "Non incollare questo prompt nel pannello di destra. Copialo in un'IA generica per ottenere il risultato, quindi incolla quel risultato nel pannello di destra.",
  generate_with_llm: "Genera con l'IA di Caramel",
  generation_in_progress: "Generazione in corso, attendere prego...",
  request_sent_to_ia: "Richiesta inviata all'IA, attendere prego...",
  generation_successful: "Contenuto H5P generato con successo!",
  generation_failed_empty: "La generazione è fallita. La risposta era vuota.",
  generation_failed_error: "Errore durante la generazione: {errorMessage}",
  generation_failed_llm: "La generazione tramite l'IA di Caramel è fallita. Causa: {errorMessage}",
  llm_small_summary: "Caramel mou: rapido, leggero, perfetto per esercizi flash e risposte immediate. Consuma poco.",
  llm_large_summary: "Caramel coulant: più ricco, più sfumato, ideale per compiti che richiedono un po' di profondità. Consuma di più.",
  llm_xl_summary: "Caramel dur: potente e complesso, da riservare a progetti ambiziosi. Richiede pazienza, risultato garantito! Consuma molto di più.",
  llm_model_source: "Fornitore del modello:",
  llm_model_parameters: "Dimensione modello:",
  llm_model_parameters_unit: "Mrd parametri",

  // ============================================================================
  // ANIMAZIONE CARAMEL
  // ============================================================================
  caramel_animation_step_1: "Versiamo lo zucchero nel pentolino...",
  caramel_animation_step_2: "Aggiungiamo un po' d'acqua...",
  caramel_animation_step_3: "Scaldiamo a fuoco medio...",
  caramel_animation_step_4: "Lo zucchero inizia a sciogliersi...",
  caramel_animation_step_5: "Inizia a colorarsi...",
  caramel_animation_step_6: "Mescoliamo delicatamente...",
  caramel_animation_step_7: "Il caramello assume un bel colore ambrato...",
  caramel_animation_step_8: "Aggiungiamo la panna calda...",
  caramel_animation_step_9: "Attenzione agli schizzi!",
  caramel_animation_step_10: "Mescoliamo bene...",
  caramel_animation_step_11: "È quasi pronto!",
  caramel_success_title: "Il tuo dolcetto è pronto!",

  // ============================================================================
  // NOTIFICHE ED ERRORI
  // ============================================================================
  prompts_generated_successfully: "Prompt generati con successo!",
  success_copy: "✓ Copiato!",
  error_please_fill_fields: "Si prega di compilare almeno un campo della modalità Rapida.",
  error_please_fill_guided_fields: "Si prega di compilare almeno un campo della modalità Avanzata.",
  error_field_empty: "Il campo è vuoto. Si prega di generare prima un prompt.",
  error_copy_failed: "La copia è fallita.",
  error_h5p_module_not_found: "Modulo '{moduleKey}' non trovato.",
  error_invalid_quiz_json: "Il JSON per il Quiz non è valido: {errorMessage}",
  error_invalid_json: "Il JSON fornito non è valido. Errore: {errorMessage}",
  error_h5p_creation: "Errore di creazione H5P: {errorMessage}",
  error_paste_ia_content: "Si prega di incollare il contenuto generato dall'IA.",
  error_compression_module_not_ready: "Il modulo di compressione non è pronto. Riprova tra un istante.",
  h5p_file_generated_successfully: "File {fileName} generato con successo!",
  h5p_creation_failed: "Creazione del file H5P fallita: {errorMessage}",
  error_paste_json_content: "Si prega di incollare il contenuto JSON generato.",
  error_paste_xml_content: "Si prega di incollare il contenuto XML generato.",
  moodle_xml_success_generation: "File {fileName} generato con successo!",
  test_error_creation_mbz: "Errore durante la creazione del MBZ per il Test:",
  test_success_generation: "File {fileName} generato con successo!",
  test_error_generic: "Errore:",
  test_backup_log: "Backup creato automaticamente da Caramel\n",
  millionnaire_error_compression_libs: "Le librerie di compressione (Tar.js o fflate) non sono caricate. Si prega di verificare la connessione internet o di ricaricare la pagina.",
  millionnaire_error_invalid_json: "La struttura del JSON non è valida. Assicurati che contenga un 'title' e un array 'questions' di 6 domande conformi all'esempio.",
  millionnaire_activity_intro: "Partecipa a questo gioco per testare le tue conoscenze.",
  millionnaire_backup_log: "Backup creato automaticamente da Caramel\n",
  millionnaire_success_generation: "File {fileName} generato con successo!",
  millionnaire_error_creation_mbz: "Errore durante la creazione del MBZ:",
  millionnaire_error_generic: "Errore:",
  appariement_error_invalid_json: "La struttura del JSON non è valida. Assicurati che contenga un 'title' e un array 'pairs' dove ogni coppia ha una 'question' e una 'answer'.",
  appariement_activity_intro: "Trova le coppie corrispondenti.",
  appariement_success_generation: "File {fileName} generato con successo!",
  appariement_error_creation_mbz: "Errore durante la creazione del MBZ per l'abbinamento:",
  qcm_error_invalid_json: "La struttura del JSON non è valida. Assicurati che contenga un 'title' e un array 'questions' con almeno una domanda e delle risposte.",
  qcm_activity_intro: "Rispondi alle seguenti domande.",
  qcm_success_generation: "File {fileName} generato con successo!",
  qcm_error_creation_mbz: "Errore durante la creazione del MBZ per il QCM:",
  version_modal_title: "Nuova versione disponibile",
  version_modal_message: "Stai attualmente utilizzando la versione {currentVersion}. Una versione più recente ({latestVersion}) è disponibile. Ricarica la pagina per usufruire degli ultimi miglioramenti.",
  version_modal_update: "Carica la nuova versione",
  version_modal_remind_later: "Ricordamelo più tardi",

  prompt_header_pedagogical_context: "CONTESTO PEDAGOGICO",
  prompt_header_specific_rules: "REGOLE SPECIFICHE",
  prompt_header_pedagogical_rules: "REGOLE PEDAGOGICHE",
  prompt_header_sources: "FONTI",
  prompt_header_json_structure: "STRUTTURA JSON ATTESA",
  prompt_header_rendering_example: "ESEMPIO DI RENDERING",
  prompt_fallback_teacher: "un insegnante",
  prompt_fallback_activity: "creare un'attività pedagogica",

  // ============================================================================

  // --- CHIAVI COMUNI ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- Il tuo ruolo: [QUI]. Esperto in didattica e ingegneria pedagogica
- Il tuo obiettivo pedagogico: [QUOI]
- Il tuo pubblico: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Adattamento e vocabolario: Adatta il tono, il vocabolario e la difficoltà delle istruzioni al pubblico indicato. Sii pertinente e coinvolgente.
- Tono e feedback: Le istruzioni e le osservazioni devono essere costruttive, incoraggianti, orientate all'apprendimento.
- Conformità: Adatta OBBLIGATORIAMENTE i contenuti ai riferimenti ufficiali in vigore. Salvo diversa indicazione esplicita, basati per impostazione predefinita sui programmi scolastici francesi (Eduscol) per il pubblico scolastico, e sui testi normativi della formazione professionale per gli adulti.
- Lingua: Il contenuto e le istruzioni devono essere redatti in italiano.`,

  SOURCES_COMMUNES: `- Utilizzerai UNICAMENTE i seguenti testi per generare la tua attività.
---
[RAG]
---`,

  // ============================================================================
  // === TIMELINE (Frise chronologique) ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Numero di eventi: Almeno 5 eventi || [NOMBRE_ELEMENTS] eventi.
- Periodi (era): Almeno 2 periodi che coprono gruppi di eventi.
- Media: Aggiungi crediti e didascalie per ogni risorsa, se possibile. Cerca attivamente un'immagine pertinente e libera da copyright (es: Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- **Oggetto radice:** Contiene la chiave \`timeline\` (oggetto).
- **Contenuto di \`timeline\`:** Struttura principale dell'attività.
  - \`headline\`: Titolo generale della linea del tempo (testo semplice obbligatorio).
  - \`text\`: Introduzione accattivante (Markdown supportato).
  - \`asset\`: Media di copertina (\`media\`: URL diretto, \`caption\`: didascalia, \`credit\`: fonte).
  - \`date\`: Array degli eventi cronologici.
  - \`era\`: Array dei periodi di sfondo (definiscono fasce colorate sullo sfondo).
- **Struttura degli oggetti \`date\` e \`era\`:**
  - \`startDate\`: **Formato rigoroso** \`YYYY,MM,DD\` o \`YYYY\`. (Obbligatorio)
  - \`endDate\`: **Formato rigoroso** \`YYYY,MM,DD\` o \`YYYY\`. (Opzionale, definisce una durata/fine periodo)
  - \`headline\`: Titolo esplicito dell'elemento (testo semplice obbligatorio).
  - \`text\`: Narrazione pedagogica. Usa \`**parola**\` per il grassetto, \`*parola*\` per l'corsivo e \`\\n\` per le interruzioni di riga.
  - \`asset\`: (Opzionale) Oggetto media (\`media\`: URL diretto Wikimedia Commons, \`caption\`, \`credit\`).
  - \`tag\`: Parola chiave breve (es: 'Politica', 'Scienza') che permette il filtraggio.
- **LaTeX:** Usa il doppio escape: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "L'Histoire de la conquête spatiale",
    "text": "Découvrez les grandes étapes qui ont marqué l'aventure de l'homme dans l'**espace**.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Décollage de la mission Apollo 11.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Lancement de Spoutnik 1",
        "text": "Le **premier satellite artificiel** est mis en orbite par l'URSS.",
        "tag": "Robotique"
      },
      {
        "startDate": "1969,07,20",
        "headline": "Premier pas sur la Lune",
        "text": "Neil Armstrong devient le premier homme à marcher sur la Lune lors de la mission **Apollo 11**.",
        "tag": "Humain"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "La Guerre Froide spatiale",
        "text": "Période de rivalité intense entre les États-Unis et l'URSS.",
        "tag": "Contexte"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === CROSSWORD (Mots croisés) ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Numero di parole: Almeno 6 parole || [NOMBRE_ELEMENTS] parole.
- Regole tipografiche: Le risposte (\`answer\`) devono contenere solo lettere. Qualsiasi parola composta, acronimo o espressione deve essere fusa in un'unica parola senza spazi, trattini o altri caratteri (es: 'arc-en-ciel' diventa 'arcenciel', 'D-DAY' diventa 'DDAY').
- Indizi (\`clue\`): È vietato scrivere la parola da trovare nell'indizio. Devono essere brevi e precisi.
- Indizio supplementare (\`extraClue\`): L'IA deve giudicare la pertinenza di aggiungerne uno.`,

  CROSSWORD_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`title\`: Un titolo per l'attività.
- \`words\`: Un array di oggetti contenente:
  - \`answer\`: La parola da indovinare (fusa senza spazi né trattini).
  - \`clue\`: La definizione breve e precisa.
  - \`extraClue\` (opzionale): Un oggetto \`{"params": {"text": "..."}}\`. Il testo può usare \`**parola**\` per il grassetto, \`*parola*\` per l'corsivo e \`\\n\` per le interruzioni di riga.
- \`taskDescription\`: Un'istruzione chiara e contestualizzata. Usa \`**parola**\` per il grassetto, \`*parola*\` per l'corsivo e \`\\n\` per le interruzioni di riga. Dopo un'interruzione di riga, specifica: "Per le parole composte, non inserire né spazi né trattini (es: 'portachiavi' per 'porta-chiavi')."
- \`overallFeedback\`: (REGOLA RIGOROSA) Devi obbligatoriamente generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando scrupolosamente le seguenti fasce di punteggio: 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Mots croisés sur la Biologie",
  "words": [
    {"answer": "Cellule", "clue": "Unité de base de la vie.", "extraClue": {"params": {"text": "Elle peut être **animale** ou **végétale**."}}},
    {"answer": "ADN", "clue": "Molécule portant l'information génétique."}
  ],
  "taskDescription": "**Complète** la grille avec les termes de biologie.\\nPour les mots composés, ne mettez ni espace ni tiret (ex: 'portecles' pour 'porte-clés').",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions de biologie."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Cartes mémoires) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Numero di carte: Almeno 5 carte || [NOMBRE_ELEMENTS] carte.
- Associazione: Il fronte e il retro devono essere collegati da un criterio unico e stabile (es: definizione -> termine, evento -> data, autore -> opera). Utilizza la stessa relazione per tutte le carte e formula l'istruzione così: « Associa ogni X a Y ».`,

  FLASHCARDS_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- L'oggetto deve contenere:
  - \`title\`: Un titolo pertinente per l'attività.
  - \`description\`: Un'istruzione chiara per lo studente.
  - \`cards\`: Un array di oggetti, dove ogni oggetto rappresenta una carta (flashcard) e contiene:
    - \`text\`: La domanda o il termine da indovinare (fronte).
    - \`answer\`: Risposta o definizione (retro). Regole di normalizzazione: una sola parola semplice o un numero (niente parole composte), minuscole (salvo nomi propri), senza articoli né punteggiatura, numeri in cifre.
    - \`tip\` (opzionale): Indizio per aiutare lo studente. Puoi usare \`**parola**\` per il grassetto e \`*parola*\` per l'corsivo.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Capitales de l'Europe",
  "description": "Associe chaque pays à sa capitale.",
  "cards": [
    {
      "text": "France",
      "answer": "paris",
      "tip": "C'est la ville de la **Tour Eiffel**."
    },
    {
      "text": "Espagne",
      "answer": "madrid",
      "tip": "Située au centre de la péninsule *ibérique*."
    },
    {
      "text": "Italie",
      "answer": "rome",
      "tip": "Surnommée la *Ville Éternelle*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (Rédaction) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Parole chiave: Almeno 5 parole chiave o espressioni attese nella risposta || [NOMBRE_ELEMENTS] parole chiave.
- Istruzione: L'istruzione non deve elencare le parole chiave attese per non dare la risposta, eccetto il nome del tema generale.`,

  ESSAY_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
L'oggetto deve contenere:
- \`taskDescription\`: Un'istruzione chiara che inviti lo studente a redigere un testo sul tema. Usa \`**parola**\` per il grassetto (concetti chiave), \`*parola*\` per l'corsivo e \`\\n\` per le interruzioni di riga.
- \`keywords\`: Un array di oggetti che definiscono le parole chiave attese. Ogni oggetto deve avere la forma:
  \`\`\`json
  {
    "keyword": "parola o espressione",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (REGOLA RIGOROSA) Devi obbligatoriamente generare un array di 6 oggetti per il feedback finale, contestualizzato al tema dell'esercizio, rispettando scrupolosamente le seguenti fasce di punteggio: 0-10, 11-30, 31-50, 51-70, 71-90 e 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Rédigez un court texte expliquant le processus de la **photosynthèse**. Votre réponse doit aborder les éléments essentiels permettant aux plantes de produire leur propre énergie.",
  "keywords": [
    {"keyword": "lumière", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "chlorophylle", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "dioxyde de carbone", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "eau", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glucose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "C'est un début. Relis bien le cours sur la photosynthèse." },
    { "from": 11, "to": 30, "feedback": "Tu avez identifié quelques éléments. Continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "Ta compréhension progresse. Pense à détailler davantage." },
    { "from": 51, "to": 70, "feedback": "Bon travail ! Tu maîtrises les bases." },
    { "from": 71, "to": 90, "feedback": "Très bien ! Ta rédaction montre une solide compréhension." },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu as une maîtrise parfaite du sujet." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (Glossaire H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Numero di voci: Almeno 5 termini || [NOMBRE_ELEMENTS] termini.
- Selezione dei termini: Identifica i concetti tecnici, il vocabolario specifico o le parole complesse presenti nelle fonti.
- Definizioni: Concise, precise e perfettamente adattate al livello pedagogico mirato.`,

  ACCORDION_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- Il JSON generato deve essere un ARRAY con tanti oggetti quanti sono i termini menzionati precedentemente.
- \`title\`: La parola chiave, l'espressione o la domanda da definire.
- \`text\`: La definizione. Usa \`**parola**\` per il grassetto, \`*parola*\` per l'corsivo e \`\\n\` per i ritorni a capo. Per le formule matematiche, usa il formato LaTeX con doppio escape, ad esempio: \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Photosynthèse", "text": "Processus par lequel les plantes transforment la **lumière** du **soleil** en énergie.\\nC'est la base de la chaîne alimentaire."},
  {"title": "Cellule", "text": "**Unité** de base de tous les êtres vivants. Il en existe des *eucaryotes* et des *procaryotes*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (Résumé) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Numero di fasi: Genera una tabella di minimo 5 fasi || [NOMBRE_ELEMENTS] fasi per coprire l'intero argomento.
- Distrattori: Proponi almeno 2 distrattori per fase. Devono essere coerenti con l'argomento ma contenere errori fattuali o logici plausibili.`,

  SUMMARY_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`intro\`: Una breve frase introduttiva (es: "Scegli l'affermazione corretta.").
- \`summaries\`: Array di oggetti che costituiscono le fasi. Ogni oggetto contiene:
  - \`summary\`: UN array di frasi (**Associazione**). La prima frase dell'elenco deve SEMPRE essere il riassunto corretto (affermazione esatta).
  - \`tip\`: (Opzionale) Un indizio contestuale per aiutare lo studente.
- \`overallFeedback\`: Tabella di 6 oggetti per il punteggio finale (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Usa il doppio escape per LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Sélectionnez les affirmations correctes pour construire le résumé du cours.",
  "summaries": [
    {
      "summary": [
        "La photosynthèse est un processus biologique permettant aux plantes de transformer l'énergie lumineuse en énergie chimique.",
        "La photosynthèse est un processus qui se déroule uniquement durant la nuit.",
        "La photosynthèse est le mécanisme par lequel les animaux respirent."
      ],
      "tip": "Pensez à la lumière comme source d'énergie."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir." },
    { "from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel." },
    { "from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts." },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (Glisser les mots) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Numero di parole: Paragrafo di almeno 50 parole con almeno 5 parole da trascinare || [NOMBRE_ELEMENTS] parole.
- Unicità: Ogni parola da trascinare deve essere UNICA nel testo (nessun duplicato).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
L'oggetto deve contenere:
- \`taskDescription\`: Un'istruzione chiara.
- \`textField\`: Il testo da completare. Ogni frase deve terminare con un salto di riga \`\\n\`.
  - **Formato**: \`*parola*\` per un elemento trascinabile.
- \`overallFeedback\`: Tabella di 6 oggetti per il punteggio finale (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complète le texte en faisant glisser les mots.",
  "textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*.\\nLa plus grande planète est *Jupiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (Texte à trous) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Numero di buchi: Paragrafo di almeno 50 parole con almeno 3 parole mancanti || [NOMBRE_ELEMENTS] parole.
- Equilibrio: Non creare buchi su parole banali (articoli, preposizioni) a meno che non sia l'obiettivo grammaticale. Punta ai concetti chiave.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
L'oggetto deve contenere:
- \`taskDescription\`: Un'istruzione chiara e breve che spieghi l'obiettivo dell'attività nel contesto globale. Usa \`**parola**\` per il grassetto (concetti chiave), \`*parola*\` per il corsivo e \`\\n\` per i salti di riga.
- \`questions\`: Un array di stringhe di caratteri. Ogni stringa rappresenta un blocco di testo da completare.
  - **Sintassi dei buchi**: Racchiudi le parole da indovinare tra asterischi (es: \`*parola*\`).
  - **Alternative**: Usa \`/\` per le risposte multiple accettate (es: \`*parola1/parola2*\`).
  - **Aiuto**: Usa \`:\` per aggiungere un fumetto di aiuto pedagogico (es: \`*parola:indizio*\`).
- \`overallFeedback\`: (REGOLA RIGOROSA) Devi obbligatoriamente generare una tabella di 6 oggetti per il feedback finale (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complétez les lacunes du texte ci-dessous concernant le système solaire.",
  "questions": [
    "La Terre est une *planète* du système *solaire*.",
    "Elle tourne autour du *Soleil:notre étoile* en environ 365 jours."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (Surligner les mots) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Numero di parole: Paragrafo di almeno 50 parole con almeno 5 parole da evidenziare || [NOMBRE_ELEMENTS] parole.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
L'oggetto deve contenere:
- \`taskDescription\`: Un'istruzione chiara e coinvolgente. Puoi usare \`**parola**\` per il grassetto e \`*parola*\` per il corsivo unicamente qui.
- \`textField\`: Il testo completo contenente le parole da evidenziare.
  - **EVIDENZIAZIONE:** Ogni parola da evidenziare deve essere INDIVIDUALMENTE racchiusa tra asterischi. (Es: \`*parola1* *parola2*\` è corretto; \`*parola1 parola2*\` non è corretto).
  - **PUNTEGGIATURA:** Gli apostrofi o i segni di punteggiatura NON DEVONO MAI far parte dell'evidenziazione e devono essere separati dalla parola da uno spazio. (Es: Scrivere \`l' *uccello*\` è corretto, \`l'*uccello*\` non è corretto).
- \`overallFeedback\`: (REGOLA RIGOROSA) Devi obbligatoriamente generare una tabella di 6 oggetti per il feedback finale (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Cliquez sur les **noms propres** dans le texte suivant.",
  "textField": "*Paris* est la capitale de la *France*. C'est l' *Europe* qui nous intéresse.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (Vrai/Faux) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Domanda: Un'affermazione chiara e senza ambiguità.
- Risposta: La risposta deve essere strettamente "true" (Vero) o "false" (Falso).
- Feedback: Prevedi messaggi specifici per il successo (\`feedbackOnCorrect\`) e l'insuccesso (\`feedbackOnWrong\`) per rafforzare l'apprendimento.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- L'oggetto principale deve contenere le seguenti chiavi:
  - \`question\`: (string) L'affermazione da valutare. Può contenere HTML.
  - \`correct\`: (string) La risposta corretta, ovvero "true" oppure "false".
  - \`feedbackOnCorrect\`: (string) Commento visualizzato se la risposta è corretta.
  - \`feedbackOnWrong\`: (string) Commento visualizzato se la risposta è errata.
- **Formato:** Usa la sintassi Markdown per il grassetto (\`**testo**\`) e il corsivo (\`*testo*\`).
- **LaTeX:** Per le formule matematiche, usa ESCLUSIVAMENTE il formato LaTeX con doppio escape: \`\\\\( ... \\\\)\`. NON usare MAI il segno \`$\` da solo.
- **Feedback:** I commenti NON DEVONO contenere LaTeX o Markdown.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo est la capitale de la Norvège.",
  "correct": "true",
  "feedbackOnCorrect": "Bonne réponse ! Oslo est bien la capitale de la Norvège.",
  "feedbackOnWrong": "Mauvaise réponse. La capitale de la Norvège est Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (Choix multiples) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Domanda: Una domanda chiara a scelta multipla.
- Risposte: Proponi diverse scelte di risposta (\`answers\`). Deve esserci una sola risposta corretta (\`"correct": true\`) e diversi distrattori plausibili (\`"correct": false\`).
- Feedback:
  - \`overallFeedback\`: (REGOLA RIGOROSA) Devi obbligatoriamente generare una tabella di 6 oggetti per il feedback finale (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- L'oggetto principale deve contenere le seguenti chiavi:
  - \`question\`: (string) Il testo della domanda. Può contenere HTML.
  - \`answers\`: (array) Tabella di oggetti, ciascuno rappresentante una risposta.
    - \`text\`: (string) Il testo della risposta.
    - \`correct\`: (boolean) \`true\` se è una risposta corretta, \`false\` altrimenti.
    - \`tipsAndFeedback\`: (object, opzionale) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (array) Tabella di 6 oggetti che definiscono i feedback per fascia di punteggio.
- **Formato:** Usa la sintassi Markdown per il grassetto (\`**testo**\`) e il corsivo (\`*testo*\`).
- **LaTeX:** Per le formule matematiche, usa ESCLUSIVAMENTE il formato LaTeX con doppio escape: \`\\\\( ... \\\\)\`. NON usare MAI il segno \`$\` da solo.
- **Feedback:** I commenti NON DEVONO contenere LaTeX o Markdown.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Quelle est la couleur réelle de la baie de cassis ?",
  "answers": [
    {"text": "Violet très foncé", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exactement !" }},
    {"text": "Bleu", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Non, c'est plus foncé." }},
    {"text": "Noir", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (Mots mêlés) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Numero di parole: Almeno 6 parole || [NOMBRE_ELEMENTS] parole.
- Regole tipografiche: Le parole non devono contenere né accenti, né numeri, né segni di punteggiatura, né spazi.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`taskDescription\`: Istruzione per lo studente.
- \`wordList\`: Elenco delle parole da trovare separate da virgole (senza spazi).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Trouvez les mots cachés dans la grille.",
  "wordList": "CELLULE,ADN,GENE,NOYAU"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (Ordonner les paragraphes) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Numero di fasi: Minimo 3 fasi o paragrafi da ordinare || [NOMBRE_ELEMENTS] fasi.
- Logica intrinseca: I paragrafi (\`paragraphs\`) devono formare una progressione logica deducibile dal contenuto stesso.
- Divieto di indizi artificiali: Non devi MAI utilizzare numerazioni (1, 2, 3...), riferimenti temporali espliciti (date, orari) o connettori logici troppo semplicistici ("Inizialmente", "Poi", "Infine"), a meno che l'utente non lo richieda esplicitamente.
- Filo conduttore: Ogni paragrafo deve far avanzare un unico filo conduttore (es: catena di causalità, passaggio dal generale al particolare, o una sequenza preparazione → azione → risultato). L'ordine deve essere deducibile attraverso la comprensione del significato.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`taskDescription\`: Un'istruzione chiara (Markdown supportato).
- \`paragraphs\`: Un array di stringhe di caratteri (paragrafi) inizialmente presentati nel **giusto ordine** logico nel JSON. Usa \`**parola**\` per il grassetto, \`*parola*\` per il corsivo.
- \`overallFeedback\`: Tabella di 6 oggetti per il punteggio finale (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Usa il doppio escape per LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Remettez ces éléments dans l'ordre pour reconstituer la chaîne de causalité du réchauffement climatique.",
  "paragraphs": [
    "Les activités humaines, principalement la combustion d'énergies fossiles, rejettent massivement du **dioxyde de carbone** dans l'atmosphère.",
    "Ce surplus de gaz renforce l'effet de serre naturel, empêchant une partie du rayonnement infrarouge de quitter la Terre.",
    "L'énergie ainsi piégée provoque une augmentation progressive de la température moyenne de l'air et des océans.",
    "Ce réchauffement global entraîne la fonte des glaciers et une élévation préoccupante du niveau des mers."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "La logique de causalité est à revoir." },
    { "from": 11, "to": 30, "feedback": "Tu as quelques bribes de compréhension, relis le texte." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début de mise en ordre." },
    { "from": 51, "to": 70, "feedback": "Bonne analyse de la progression logique." },
    { "from": 71, "to": 90, "feedback": "Très bon travail de structuration !" },
    { "from": 91, "to": 100, "feedback": "Parfait ! La structure logique est maîtrisée." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (Série de choix uniques) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Numero di domande: Almeno 3 domande || [NOMBRE_ELEMENTS] domande.
- Risposte: Proponi da 2 a 3 distrattori per domanda. La prima risposta dell'elenco \`answers\` deve essere sempre quella corretta.
- Distrattori: Coerenti ma contenenti errori logici o fattuali plausibili.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`choices\`: Array di oggetti che costituiscono le domande. Ogni oggetto contiene:
  - \`question\`: L'enunciato della domanda.
  - \`answers\`: Array di stringhe di caratteri (risposte) di cui la prima è sempre la risposta corretta.
- \`overallFeedback\`: Tabella di 6 oggetti per il punteggio finale (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Usa il doppio escape per LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "Quel est le principal gaz responsable de l'effet de serre ?",
      "answers": ["Le dioxyde de carbone", "Le dioxygène", "Le diazote", "L'argon"]
    },
    {
      "question": "Quelle est la capitale de la France ?",
      "answers": ["Paris", "Lyon", "Marseille", "Bordeaux"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (Cartes de dialogue) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Numero di carte: Almeno 3 carte || [NOMBRE_ELEMENTS] carte.
- Principio di associazione: Il fronte e il retro devono essere collegati da un criterio unico e stabile (es: definizione -> termine, evento -> data, autore -> opera).
- Istruzione: La descrizione dell'attività deve seguire la formula: "Associa ogni [X] al suo [Y]".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- L'oggetto radice DEVE contenere \`title\`, \`description\` e \`dialogs\`.
- 1. \`title\`: Il titolo dell'attività (Testo semplice, **senza** Markdown né HTML).
- 2. \`description\`: L'istruzione o descrizione (Formato HTML o testo semplice).
- 3. \`dialogs\`: L'array del Principio di associazione delle carte: il fronte (\`text\`) e il retro (\`answer\`).
- 4. \`text\`: Il fronte della carta. Usa \`**parola**\` per il grassetto e \`*parola*\` per il corsivo.
- 5. \`answer\`: Il retro della carta. Deve essere breve. Usa \`**parola**\` per il grassetto e \`*parola*\` per il corsivo.
- 6. \`tips\` (opzionale): Aggiungi un indizio per il fronte (\`front\`) e/o il retro (\`back\`) solo se pertinente. Testo semplice **senza** formattazione.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Verbes irréguliers",
  "description": "Retrouvez le verbe à l'infinitif.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identifiez le prétérit.", "back": "Forme de base."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (Diagramme) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Numero di elementi: Almeno 5 elementi di confronto || [NOMBRE_ELEMENTS] elementi di confronto.
- Tipo di grafico: Scegli tra grafico a torta (\`pieChart\`) o grafico a barre (\`barChart\`) in base alla pertinenza pedagogica.
- Etichette e colori: I colori devono essere contrastati per una buona leggibilità. Le etichette devono essere brevi e chiare.`,

  CHART_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`graphMode\`: Il tipo di grafico (\`pieChart\` o \`barChart\`).
- \`listOfTypes\`: Un array di oggetti \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: Il titolo del grafico.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Myrtilles"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Framboises"}
  ],
  "figureDefinition": "Graphique des fruits préférés"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Quiz H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Numero di domande: Genera un array di minimo 5 domande || [NOMBRE_ELEMENTS] domande.
- Varietà: Scegli i tipi di attività più adatti tra i seguenti per variare l'esercizio:
  - **Scelta Multipla** (\`H5P.MultiChoice\` 1.16)
  - **Trascina le parole** (\`H5P.DragText\` 1.10)
  - **Vero/Falso** (\`H5P.TrueFalse\` 1.8)
  - **Testo a buchi** (\`H5P.Blanks\` 1.14)
  - **Evidenzia le parole** (\`H5P.MarkTheWords\` 1.11)
  - **Saggio / Domanda aperta** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- L'oggetto radice deve contenere:
  - \`title\`: Il titolo dell'attività.
  - \`questions\`: Un array di oggetti. Ogni oggetto rappresenta una domanda e deve contenere:
    - \`library\`: Il nome e la versione esatta della libreria (es: \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: Un oggetto contenente una chiave \`title\` (titolo breve della domanda).
    - \`params\`: I dati della domanda.
  - \`overallFeedback\`: Array globale di 6 oggetti per il punteggio finale del QuizSet.

**Dettagli dei \`params\` per tipo:**
1. **QCM (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (array di oggetti con \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **Vero/Falso (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" o "false" come stringa)
3. **Testo a buchi (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (array di stringhe con \`*parola*\`)
4. **Trascina le parole (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (con \`*parola*\`)
5. **Evidenzia (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (con \`*parola*\`)
6. **Saggio (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (array di oggetti)

**Ogni domanda, tranne quelle di tipo H5P.TrueFalse 1.8, deve includere il proprio \`overallFeedback\` (6 fasce).**
- **Formato:** Usa la sintassi Markdown per il grassetto (\`**testo**\`) e il corsivo (\`*testo*\`).
- **LaTeX:** Per le formule matematiche, usa ESCLUSIVAMENTE il formato LaTeX con doppio escape: \`\\\\( ... \\\\)\`. NON usare MAI il segno \`$\` da solo.
- **Feedback:** I commenti NON DEVONO contenere LaTeX o Markdown.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Culture Générale Scientifique",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomie - QCM" },
      "params": {
        "question": "Quelle planète est la plus proche du Soleil ?",
        "answers": [
          { "text": "Mercure", "correct": true },
          { "text": "Vénus", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Faux."},
          {"from": 11, "to": 30, "feedback": "Insuffisant."},
          {"from": 31, "to": 50, "feedback": "Moyen."},
          {"from": 51, "to": 70, "feedback": "Bien."},
          {"from": 71, "to": 90, "feedback": "Très bien."},
          {"from": 91, "to": 100, "feedback": "Excellent."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Biologia - Vero/Falso" },
      "params": {
        "question": "L'ADN è una doppia elica.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Risultato debole."},
    {"from": 11, "to": 30, "feedback": "Risultato insufficiente."},
    {"from": 31, "to": 50, "feedback": "Risultato medio."},
    {"from": 51, "to": 70, "feedback": "Buon risultato."},
    {"from": 71, "to": 90, "feedback": "Ottimo risultato."},
    {"from": 91, "to": 100, "feedback": "Risultato eccellente."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (Quiz a scelta multipla H5P) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Numero di domande: Genera un insieme di almeno 5 domande || [NOMBRE_ELEMENTS] domande.
- Tipo: Devi generare SOLO domande di tipo **scelta multipla** (\`H5P.MultiChoice\` 1.16). Nessun altro tipo è consentito.
- Qualità delle domande a scelta multipla:
  - Ogni domanda deve avere almeno 3 opzioni di risposta.
  - A seconda della natura della domanda, puoi proporre una o più risposte corrette.
  - I distrattori (risposte errate) devono essere plausibili e rilevanti.
  - Evita formulazioni negative nelle domande.
  - Varia la posizione della/e risposta/e corretta/e.`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Genera SOLO un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- L'oggetto radice deve contenere:
  - \`title\`: Il titolo dell'attività.
  - \`questions\`: Un array di oggetti. Ogni oggetto rappresenta una domanda a scelta multipla e deve contenere:
    - \`library\`: Sempre \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: Un oggetto contenente una chiave \`title\` (titolo breve della domanda).
    - \`params\`: I dati della domanda.
  - \`overallFeedback\`: Array globale di 6 oggetti per il punteggio finale del QuizSet.

**Dettagli di \`params\` per scelta multipla (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: La domanda posta (string).
- \`answers\`: Array di oggetti con \`text\` (string) e \`correct\` (boolean).
- \`behaviour\`: Oggetto con \`singleAnswer\`: \`true\` se una sola risposta corretta, \`false\` se più risposte corrette.

**Ogni domanda deve includere il proprio \`overallFeedback\` (6 fasce: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Formato:** Usa la sintassi Markdown per il grassetto (\`**testo**\`) e il corsivo (\`*testo*\`).
- **LaTeX:** Per le formule matematiche, usa ESCLUSIVAMENTE il formato LaTeX con doppio escape: \`\\\\( ... \\\\)\`. NON usare MAI il segno \`$\` da solo.
- **Feedback:** I commenti NON DEVONO contenere LaTeX o Markdown.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz a scelta multipla - Scienze",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomia - Pianeti" },
      "params": {
        "question": "Quale pianeta è il più vicino al Sole?",
        "answers": [
          { "text": "Venere", "correct": false },
          { "text": "Marte", "correct": false },
          { "text": "Mercurio", "correct": true },
          { "text": "Giove", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Errato."},
          {"from": 11, "to": 30, "feedback": "Insufficiente."},
          {"from": 31, "to": 50, "feedback": "Medio."},
          {"from": 51, "to": 70, "feedback": "Buono."},
          {"from": 71, "to": 90, "feedback": "Molto buono."},
          {"from": 91, "to": 100, "feedback": "Eccellente!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Biologia - Organelli" },
      "params": {
        "question": "Quali organelli possiedono il proprio DNA?",
        "answers": [
          { "text": "Il ribosoma", "correct": false },
          { "text": "Il mitocondrio", "correct": true },
          { "text": "L'apparato di Golgi", "correct": false },
          { "text": "Il cloroplasto", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Errato."},
          {"from": 11, "to": 30, "feedback": "Insufficiente."},
          {"from": 31, "to": 50, "feedback": "Medio."},
          {"from": 51, "to": 70, "feedback": "Buono."},
          {"from": 71, "to": 90, "feedback": "Molto buono."},
          {"from": 91, "to": 100, "feedback": "Eccellente!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Risultato debole. Rivedere le basi."},
    {"from": 11, "to": 30, "feedback": "Risultato insufficiente. Continua a impegnarti."},
    {"from": 31, "to": 50, "feedback": "Risultato medio. Stai progredendo."},
    {"from": 51, "to": 70, "feedback": "Buon risultato. Padroneggi diversi concetti."},
    {"from": 71, "to": 90, "feedback": "Ottimo risultato. Sei sulla buona strada."},
    {"from": 91, "to": 100, "feedback": "Risultato eccellente. Congratulazioni!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P Vero/Falso Quiz) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Numero di domande: Genera un array di almeno 5 domande || [NOMBRE_ELEMENTS] domande.
- Tipo: Devi generare SOLO domande di tipo **Vero/Falso** (\`H5P.TrueFalse\` 1.8). Non è consentito alcun altro tipo.
- Qualità delle domande:
  - Le affermazioni devono essere chiare e senza ambiguità.
  - Evita le doppie negazioni.
  - Varia tra affermazioni vere e false.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- L'oggetto radice deve contenere:
  - \`title\`: Il titolo dell'attività.
  - \`questions\`: Un array di oggetti. Ogni oggetto rappresenta una domanda e deve contenere:
    - \`library\`: Sempre \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: Un oggetto contenente una chiave \`title\` (titolo breve della domanda).
    - \`params\`: I dati della domanda.
  - \`overallFeedback\`: Array globale di 6 oggetti per il punteggio finale del QuizSet: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Dettagli dei \`params\` per Vero/Falso (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: L'affermazione o la domanda posta (string).
- \`correct\`: La risposta corretta. DEVE essere una stringa: "true" o "false".
- **Formato:** Usa la sintassi Markdown per il grassetto (\`**testo**\`) e il corsivo (\`*testo*\`).
- **LaTeX:** Per le formule matematiche, usa ESCLUSIVAMENTE il formato LaTeX con doppio escape: \`\\\\( ... \\\\)\`. NON usare MAI il segno \`$\` da solo.
- **Feedback:** I commenti NON DEVONO contenere LaTeX o Markdown.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz Vero/Falso - Geografia",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografia - Capitali" },
      "params": {
        "question": "La capitale dell'Australia è Canberra.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografia - Continenti" },
      "params": {
        "question": "L'Africa è il continente più grande del mondo.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Risultato debole. Rivedere le basi."},
    {"from": 11, "to": 30, "feedback": "Risultato insufficiente. Continua a impegnarti."},
    {"from": 31, "to": 50, "feedback": "Risultato medio. Stai progredendo."},
    {"from": 51, "to": 70, "feedback": "Buon risultato. Padroneggi diversi concetti."},
    {"from": 71, "to": 90, "feedback": "Ottimo risultato. Sei sulla buona strada."},
    {"from": 91, "to": 100, "feedback": "Risultato eccellente. Congratulazioni!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Test Moodle/Éléa) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Numero di domande: Almeno 10 domande || [NOMBRE_ELEMENTS] domande.
- Varietà: Scegli i formati di domanda più adatti tra i seguenti:
  - **QCM** (\`multichoice\`)
  - **Abbinamento** (\`matching\`)
  - **Numerico** (\`numerical\`)
  - **Vero/Falso** (\`truefalse\`)
  - **Risposta breve** (\`shortanswer\`)
  - **Testo bucato** (\`cloze\`)
- Distrattori: Proponi almeno 3 distrattori per domanda \`multichoice\`.`,

  ELEA_TEST_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.

L'oggetto principale deve contenere le seguenti chiavi:
- \`bank_name\`: Un nome breve e descrittivo per la banca delle domande.
- \`bank_description\`: Una frase che descrive il contenuto della banca.
- \`questions\`: Un array di oggetti dove ogni oggetto rappresenta una domanda (\`type\`, \`content\`).
  - Ogni domanda deve avere un \`content.name\` breve e unico (es: "D1 - Argomento").

**Regole di formattazione:**
- **Numeri**: usa il punto per i decimali (es: 12.34).
- **Cloze**: rispetta rigorosamente la sintassi \`{1:TYPE:=Risposta corretta~Risposta errata}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **Per il tipo \`multichoice\` (QCM):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "D1 - Geografia",
      "questiontext": "Qual è la capitale della Francia?",
      "feedback": "Parigi è la capitale politica ed economica della Francia.",
      "answers": [
        { "text": "Parigi", "fraction": 100, "feedback": "Esatto!" },
        { "text": "Lione", "fraction": 0, "feedback": "No, Lione è una grande città ma non la capitale." },
        { "text": "Marsiglia", "fraction": 0, "feedback": "No, è la seconda città della Francia." }
      ]
    }
  }
  \`\`\`

- **Per il tipo \`matching\` (Abbinamento):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "D2 - Vocabolario Inglese",
      "questiontext": "Associa ogni parola inglese alla sua traduzione italiana.",
      "feedback": "Bravo, padroneggi il vocabolario di base.",
      "subquestions": [
        { "text": "Dog", "answer": "Cane" },
        { "text": "Cat", "answer": "Gatto" },
        { "text": "Bird", "answer": "Uccello" }
      ]
    }
  }
  \`\`\`

- **Per il tipo \`numerical\` (Numerico):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "D3 - Matematica",
      "questiontext": "Qual è il valore di Pi greco arrotondato a due decimali?",
      "feedback": "Pi greco è una costante irrazionale approssimativamente uguale a 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "È proprio 3.14." }
    }
  }
  \`\`\`

- **Per il tipo \`truefalse\` (Vero/Falso):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "D4 - Scienze",
      "questiontext": "L'acqua bolle a 100°C al livello del mare.",
      "feedback": "È una proprietà fisica standard dell'acqua.",
      "answer": { "value": true, "feedback_true": "Vero.", "feedback_false": "Falso, l'acqua bolle a 100°C a 1 atm." }
    }
  }
  \`\`\`

- **Per il tipo \`shortanswer\` (Risposta breve):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "D5 - Letteratura",
      "questiontext": "Chi ha scritto 'I Miserabili'?",
      "feedback": "È uno dei più grandi romanzi del XIX secolo.",
      "answers": [
        { "text": "Victor Hugo", "fraction": 100, "feedback": "Corretto!" },
        { "text": "Hugo", "fraction": 100, "feedback": "Corretto!" }
      ]
    }
  }
  \`\`\`

- **Per il tipo \`cloze\` (Testo bucato):**
  - Attenzione alla sintassi: \`{1:SHORTANSWER:=Buona~Cattiva}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "D6 - Storia",
      "questiontext": "Napoleone è nato nel {1:SHORTANSWER:=1769} a {1:MULTICHOICE:=Ajaccio~Bastia~Parigi}.",
      "feedback": "Napoleone Bonaparte è nato in Corsica."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Millionnaire) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Numero di domande: ESATTAMENTE 6 domande (non deve assolutamente essere modificato).
- Progressività: La difficoltà delle domande deve essere **crescente e pedagogica**. Gli elementi importanti da far memorizzare sono inseriti nelle prime domande.
- Veridicità: Il contenuto deve essere rigorosamente esatto e pertinente.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
Un oggetto principale con le seguenti chiavi:
- \`title\`: Il titolo dell'attività (Stringa di caratteri).
- \`questions\`: Un array di ESATTAMENTE 6 oggetti, dove ogni oggetto rappresenta una domanda e contiene:
  - \`question\`: L'enunciato della domanda (Stringa di caratteri).
  - \`goodanswer\`: La risposta corretta (Stringa di caratteri).
  - \`badanswer\`: Un array di ESATTAMENTE 3 risposte errate (Array di stringhe di caratteri).
  - Per le formule matematiche, il LaTeX è vietato.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz sur la Révolution française",
  "questions": [
    {
      "question": "Quel événement marque le début de la Révolution française le 14 juillet 1789 ?",
      "goodanswer": "La prise de la Bastille",
      "badanswer": ["Le serment du Jeu de Paume", "L'exécution de Louis XVI", "La bataille de Valmy"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Appariement) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Numero di coppie: Almeno 5 coppie || [NOMBRE_ELEMENTS] coppie.
- Logica: La relazione tra i due elementi deve essere evidente dopo la lettura delle fonti.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
Un oggetto principale con le seguenti chiavi:
- \`title\`: Il titolo dell'attività (Stringa di caratteri).
- \`intro\`: Breve istruzione o testo introduttivo (Stringa di caratteri).
- \`pairs\`: Un array di oggetti, dove ogni oggetto rappresenta una coppia e contiene:
  - \`question\`: Il termine o l'elemento a sinistra (Stringa di caratteri).
  - \`answer\`: La definizione o l'elemento corrispondente a destra (Stringa di caratteri).
  - Per le formule matematiche, usa il formato LaTeX con doppio escape, ad esempio: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Appariement Histoire",
  "intro": "Associez chaque date à l'événement correspondant de la Révolution française.",
  "pairs": [
    {"question": "Prise de la Bastille", "answer": "14 juillet 1789"},
    {"question": "Abolition des privilèges", "answer": "4 août 1789"},
    {"question": "DDHC", "answer": "26 août 1789"},
    {"question": "Marche des femmes", "answer": "5 octobre 1789"},
    {"question": "Fête de la Fédération", "answer": "14 juillet 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (QCM Éléa) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Numero di domande: Almeno 5 domande || [NOMBRE_ELEMENTS] domande.
- Risposte: Proponi tra 2 e 5 scelte per domanda.
- Distrattori: Coerenti con l'argomento ma contenenti errori logici.`,

  ELEA_QCM_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`title\`: Titolo dell'attività.
- \`questions\`: Array di oggetti. Ogni oggetto domanda deve contenere:
  - \`text\`: Enunciato della domanda (può contenere HTML semplice come \`**\` per il grassetto).
  - \`answers\`: Array di oggetti \`{"text": "...", "iscorrect": 1/0}\`. \`1\` per una risposta corretta, \`0\` altrimenti.
  - Per le formule matematiche, usa il formato LaTeX con doppio escape, ad esempio: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "QCM sur la Révolution Française",
  "questions": [
    {
      "text": "Quelle est la date de la prise de la Bastille ?",
      "answers": [
        {"text": "14 juillet 1789", "iscorrect": 1},
        {"text": "4 août 1789", "iscorrect": 0},
        {"text": "26 août 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (Glossaire XML) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- Numero di voci: Almeno 5 termini || [NOMBRE_ELEMENTS] termini.
- Selezione: Identifica le parole chiave, gli acronimi e i concetti tecnici.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- **Radice:** Un oggetto principale contenente due chiavi: \`name\` (il nome del glossario) e \`entries\` (un array di oggetti).
- **Ogni oggetto in \`entries\` deve contenere:**
  - \`concept\`: La parola o l'espressione da definire.
  - \`definition\`: La definizione chiara e concisa. Usa **parola** per il grassetto, *parola* per il corsivo e \`\\n\` per i salti di riga, solo quando pedagogicamente pertinente.
  - \`aliases\` (opzionale): Un array di stringhe di caratteri per i sinonimi o termini alternativi. Aggiungi questa chiave solo se esistono alias pertinenti.
  - Per le formule matematiche, usa il formato LaTeX con doppio escape, ad esempio: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Glossaire du Journalisme",
  "entries": [
    {
      "concept": "Journaliste",
      "definition": "Personne qui **collecte** et diffuse des *informations*.",
      "aliases": ["Reporter", "Chroniquer"]
    },
    {
      "concept": "Source",
      "definition": "Origine d'une *information* vérifiée."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Pagina Éléa) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Struttura: La pagina deve contenere almeno 5 blocchi diversi || [NOMBRE_ELEMENTS] blocchi.
- Logica pedagogica: I contenuti devono seguire una progressione coerente (es: Benvenuto -> Obiettivi -> Lezione -> Dettagli/Lessico -> Sitografia).
- Equilibrio dei contenuti: Mescola i formati per mantenere alto l'interesse (testo, tabelle, elenchi, riquadri).
- Contenuti obbligatori: Integra sistematicamente un banner di apertura (\`#01_hero_header\`), riquadri per obiettivi o punti di attenzione (\`#04_callout_set\`), un lessico per i termini tecnici (\`#06_lexique_table\`), almeno tre paragrafi di contenuto sostanziale (\`#12_context_paragraphs\`) e una sitografia di riferimento (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Genera UNICAMENTE un JSON completo e valido in un blocco di codice. La tua risposta DEVE iniziare con \`{\` e finire con \`}\`. Nessun altro testo o commento.
- \`title\`: Titolo della pagina (Stringa).
- \`intro\`: Breve testo introduttivo coinvolgente (Stringa).
- \`blocks\`: Un array di oggetti, dove ogni oggetto rappresenta una sezione della pagina. Ogni blocco DEVE rispettare una delle seguenti strutture:

**Elenco dei blocchi disponibili:**
- \`#01_hero_header\`: Banner di apertura. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Sommario con link interni. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Riferimenti storici in 3 schede. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (max 3 schede)
- \`#04_callout_set\`: Banner Obiettivi, Da sapere, Allerta. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Cifre chiave in schede. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Tabella di vocaboli. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Glossario in pillole. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Schede monumenti con immagini. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Due immagini a confronto.
- \`#10_table_comparison\`: Tabella di confronto.
- \`#11_definition_box\`: Riquadro Definizione. \`{ "type": "#11_definition_box", "data": { "title": "Definizione", "text": "..." } }\`
- \`#12_context_paragraphs\`: Paragrafi della lezione. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Scheda dettagliata.
- \`#14_faq_block\`: Domande frequenti. \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Miti vs Realtà.
- \`#17_method_image_desc\`: Metodo per descrivere un'immagine.
- \`#18_sito_graphy\`: Sitografia. \`{ "type": "#18_sito_graphy", "data": { "title": "Sitografia", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Citazione bilingue.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "La Révolution française",
  "intro": "Découvrez les moments clés de cette période historique.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "La Révolution", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Objectifs",
        "callouts": [{"type": "objectif", "text": "Comprendre les causes de 1789."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "Le Serment du Jeu de Paume",
        "paragraphs": [
          "Le 20 juin 1789, les députés du Tiers-État se réunissent...",
          "Ce geste marque la naissance de l'Assemblée nationale.",
          "C'est un tournant majeur vers la fin de l'absolutisme."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Vocabulaire",
        "headers": ["Terme", "Définition"],
        "rows": [["Tiers-État", "La majeure partie de la population..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Pour aller plus loin",
        "links": [{"href": "https://...", "text": "Site officiel de l'Histoire"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === TRADUZIONI INTERFACCIA H5P (STANDARD) ===
  // ============================================================================

  // Chiavi comuni
  h5p_check_answer: "Controlla",
  h5p_try_again: "Riprova",
  h5p_show_solution: "Mostra soluzione",
  h5p_submit_answer: "Invia",
  h5p_score: "Hai ottenuto @score su @total punti",
  h5p_score_bar_label: "Hai ottenuto :num su :total punti",
  h5p_tip_label: "Suggerimento",
  h5p_next: "Avanti",
  h5p_previous: "Indietro",
  h5p_close: "Chiudi",
  h5p_finish_header: "Finito?",
  h5p_finish_body: "Sei sicuro di voler finire?",
  h5p_cancel_label: "Annulla",
  h5p_finish_label: "Fine",
  h5p_retry_header: "Riprovare?",
  h5p_retry_body: "Sei sicuro di voler riprovare?",
  h5p_retry_confirm_label: "Conferma",
  h5p_resume: "Riprendi",
  h5p_audio_direction: "Direzione audio",
  h5p_a11y_check: "Controlla le risposte. Le risposte saranno contrassegnate come corrette, errate o non risposte.",
  h5p_a11y_show_solution: "Mostra la soluzione. Il compito sarà contrassegnato con la sua soluzione corretta.",
  h5p_a11y_retry: "Riprova il compito. Ripristina tutte le risposte e ricomincia da capo.",

  // Cruciverba (Crossword)
  h5p_crossword_across: "Orizzontali",
  h5p_crossword_down: "Verticali",
  h5p_crossword_extra_clue: "Indizio extra",

  // Sommario (Summary)
  h5p_summary_intro: "Scegli l'affermazione corretta.",
  h5p_summary_solved_label: "Progresso:",
  h5p_summary_score_label: "Risposte errate:",
  h5p_summary_result_label: "Il tuo risultato",
  h5p_summary_feedback: "Hai ottenuto @score su @total affermazioni corrette (@percent%).",
  h5p_summary_label_correct: "Corretto.",
  h5p_summary_label_incorrect: "Errato! Per favore riprova.",
  h5p_summary_label_correct_answers: "Risposte corrette.",
  h5p_summary_progress_text: "Progresso :num su :total",
  h5p_summary_alternative_incorrect_label: "Errato",

  // Trascina le parole (Drag the Words)
  h5p_drag_words_score_feedback: "Punteggio: @score su @total.",
  h5p_drag_words_correct_text: "Corretto!",
  h5p_drag_words_incorrect_text: "Errato!",

  // Riempi gli spazi (Fill in the Blanks)
  h5p_blanks_not_filled_out: "Si prega di riempire tutti gli spazi vuoti.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; è corretto",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; è errato",
  h5p_blanks_answered_correctly: "Risposto correttamente",
  h5p_blanks_answered_incorrectly: "Risposto erroneamente",
  h5p_blanks_solution_label: "Risposta corretta:",
  h5p_blanks_input_label: "Input @num di @total",
  h5p_blanks_input_has_tip_label: "Suggerimento disponibile",
  h5p_blanks_feedback: "Hai ottenuto @score su @total spazi corretti.",
  h5p_blanks_checking_mode_header: "Modalità di controllo",

  // Contrassegna le parole (Mark the Words)
  h5p_mark_words_correct_answer: "Corretto!",
  h5p_mark_words_incorrect_answer: "Errato!",
  h5p_mark_words_missed_answer: "Mancato!",
  h5p_mark_words_display_solution_description: "Il compito è aggiornato per contenere la soluzione.",
  h5p_mark_words_a11y_full_text_label: "Testo leggibile completo",
  h5p_mark_words_a11y_clickable_text_label: "Testo completo dove le parole possono essere contrassegnate",
  h5p_mark_words_a11y_solution_mode_header: "Modalità soluzione",
  h5p_mark_words_a11y_checking_header: "Modalità di controllo",

  // Carte (Flashcards)
  h5p_flashcards_progress_text: "Carta @card di @total",
  h5p_flashcards_your_answer: "La tua risposta",
  h5p_flashcards_correct_answer: "Risposta corretta",
  h5p_flashcards_incorrect_answer: "Risposta errata",
  h5p_flashcards_show_solution: "Risposta corretta",
  h5p_flashcards_results: "Risultati",
  h5p_flashcards_of_correct: "@score su @total corrette",
  h5p_flashcards_show_results: "Mostra i risultati",
  h5p_flashcards_answer_short: "R:",
  h5p_flashcards_card_announcement: "Risposta errata. La risposta corretta era @answer",
  h5p_flashcards_correct_announcement: "@answer è corretto.",
  h5p_flashcards_page_announcement: "Pagina @current di @total",

  // Saggio (Essay)
  h5p_essay_feedbackHeader: "Feedback",
  h5p_essay_solutionTitle: "Esempio di soluzione",
  h5p_essay_remainingChars: "Caratteri rimanenti: @chars",
  h5p_essay_notEnoughChars: "Devi inserire almeno @chars caratteri!",
  h5p_essay_messageSave: "salvato",
  h5p_essay_placeholderText: "Comincia a scrivere qui...",
  h5p_essay_ariaYourResult: "Hai ottenuto @score su @total punti",
  h5p_essay_ariaNavigatedToSolution: "Navigato verso la soluzione di esempio appena inclusa dopo l'area di testo.",

  // Vero/Falso (True/False)
  h5p_true_false_true_text: "Vero",
  h5p_true_false_false_text: "Falso",
  h5p_true_false_wrong_answer_message: "Risposta errata",
  h5p_true_false_correct_answer_message: "Risposta corretta",

  // Trova le parole (Find the Words)
  h5p_find_words_found: "@found su @totalWords parole trovate",
  h5p_find_words_time_spent: "Tempo trascorso",
  h5p_find_words_word_list_header: "Elenco parole",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Ordina i paragrafi (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "Sposta su",
  h5p_sort_paragraphs_down: "Sposta giù",
  h5p_sort_paragraphs_disabled: "Disabilitato",
  h5p_sort_paragraphs_paragraph: "Paragrafo",
  h5p_sort_paragraphs_point: "@score punto",
  h5p_sort_paragraphs_seven_of_nine: "@current di @total",
  h5p_sort_paragraphs_current_position: "Posizione attuale nell'elenco",
  h5p_sort_paragraphs_instructions_selected: "Premi la barra spaziatrice per riordinare",
  h5p_sort_paragraphs_instructions_grabbed: "Premi i tasti freccia su e giù per cambiare posizione, la barra spaziatrice per rilasciare, Esc per annullare",
  h5p_sort_paragraphs_grabbed: "Preso",
  h5p_sort_paragraphs_moved: "Spostato",
  h5p_sort_paragraphs_dropped: "Rilasciato",
  h5p_sort_paragraphs_reorder_cancelled: "Riordinamento annullato",
  h5p_sort_paragraphs_final_position: "Posizione finale",
  h5p_sort_paragraphs_next_paragraph: "Paragrafo successivo",
  h5p_sort_paragraphs_correct_paragraph: "Paragrafo corretto alla posizione",
  h5p_sort_paragraphs_list_description: "Elenco di paragrafi riordinabili.",
  h5p_sort_paragraphs_list_description_check: "Elenco di paragrafi con risultati.",
  h5p_sort_paragraphs_list_description_solution: "Elenco di paragrafi con soluzioni.",

  // Serie a scelta singola (Single Choice Set)
  h5p_single_choice_solution_view_title: "Soluzione",
  h5p_single_choice_mute_button_label: "Disattiva audio",
  h5p_single_choice_slide_of_total: "Diapositiva @slide di @total",
  h5p_single_choice_solution_list_question_number: "Domanda @question",
  h5p_single_choice_should_select: "Dovrebbe selezionare",
  h5p_single_choice_should_not_select: "Non dovrebbe selezionare",

  // Carte di dialogo (Dialog Cards)
  h5p_dialog_cards_answer: "Gira",
  h5p_dialog_cards_progress_text: "Carta @card di @total",
  h5p_dialog_cards_card_front_label: "Fronte della carta",
  h5p_dialog_cards_card_back_label: "Retro della carta",
  h5p_dialog_cards_audio_not_supported: "Il tuo browser non supporta questo formato audio",
  h5p_dialog_cards_correct_answer: "Ho fatto bene!",
  h5p_dialog_cards_incorrect_answer: "Ho sbagliato",
  h5p_dialog_cards_round: "Giro @round",
  h5p_dialog_cards_cards_left: "Carte rimaste: @number",
  h5p_dialog_cards_next_round: "Passa al giro @round",
  h5p_dialog_cards_start_over: "Riprova",
  h5p_dialog_cards_show_summary: "Avanti",
  h5p_dialog_cards_summary: "Sommario",
  h5p_dialog_cards_summary_cards_right: "Carte che hai indovinato:",
  h5p_dialog_cards_summary_cards_wrong: "Carte che hai sbagliato:",
  h5p_dialog_cards_summary_cards_not_shown: "Carte non mostrate:",
  h5p_dialog_cards_summary_overall_score: "Punteggio globale",
  h5p_dialog_cards_summary_cards_completed: "Carte che hai imparato:",
  h5p_dialog_cards_summary_completed_rounds: "Giri completati:",
  h5p_dialog_cards_summary_all_done: "Ben fatto! Hai completato tutte le @cards carte @max volte di seguito!",

  // Gruppo di domande (Quiz Set)
  h5p_quiz_textual_progress: "Domanda @current di @total",
  h5p_quiz_no_result_message: "Finito",
  h5p_quiz_result_message: "I tuoi risultati:",
  h5p_quiz_feedback_available: "Feedback disponibile",
  h5p_quiz_read_feedback: "Leggi feedback",
  h5p_quiz_wrong_answer: "Risposta errata",
  h5p_quiz_correct_answer: "Risposta corretta",
  h5p_quiz_should_check: "Doveva essere selezionato",
  h5p_quiz_should_not_check: "Non doveva essere selezionato",
  h5p_quiz_no_input: "Si prega di rispondere prima di visualizzare la soluzione.",

  // ============================================================================
  // === NOTE LEGALI - PIÈ DI PAGINA ===
  // ============================================================================
  license_info: "GNU GPL v3.0 o successiva",
  ticket: "Segnalazione",
  legal_mentions: "Note legali",
  legal_title: "Note legali",
  legal_editor_title: "Editore dell'applicazione",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Incarico:</strong> PLP Lettres-Histoire",
  legal_editor_gauthier_remande_email: "<strong>Email:</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Indirizzo:</strong> 39 avenue de Chanzy, 53000 Laval, Francia",
  legal_editor_gauthier_remande_phone: "<strong>Telefono:</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Incarico:</strong> Professore di matematica e incaricato di missione DRANE – Académie de Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>Email:</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Indirizzo:</strong> 30 boulevard de la République, 38200 Vienne, Francia",
  legal_editor_emmanuel_gaunard_phone: "<strong>Telefono:</strong> +33 6 46 74 20 94",
  legal_app_description: "L'applicazione web « Caramel » è un progetto libero, non commerciale, destinato alla creazione di contenuti H5P ed Éléa. Non è richiesto alcun account, non viene raccolto alcun dato personale.",
  legal_hosting_title: "Hosting",
  legal_host_name: "<strong>Host</strong>: Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>Ragione sociale</strong>: Ministère de l'Éducation nationale et de la Jeunesse",
  legal_host_address: "<strong>Indirizzo</strong>: 110 rue de Grenelle, 75007 Parigi, Francia",
  legal_host_phone: "<strong>Telefono</strong>: +33 1 55 55 10 10",
  legal_publication_director_title: "Responsabile della pubblicazione",
  legal_publication_director_name: "Gauthier REMANDE ed Emmanuel GAUNARD, in qualità di editori volontari.",
  legal_terms_of_use_title: "Condizioni generali d'uso",
  legal_terms_of_use_content: "Questo sito permette agli utenti di generare contenuti H5P ed Éléa. La visualizzazione avviene localmente, senza trasmissione di dati utente. L'utente è l'unico responsabile dell'uso che fa dei contenuti generati. L'applicazione è offerta a titolo gratuito, senza alcuna garanzia di funzionamento o di risultato. L'editore declina ogni responsabilità in caso di errata interpretazione dei contenuti o di uso improprio.",
  legal_intellectual_property_title: "Proprietà intellettuale",
  legal_intellectual_property_content: "Tutti i codici sorgente, gli elementi grafici e i contenuti sono rilasciati sotto licenza libera GNU AGPLv3. Il loro riutilizzo è permesso alle condizioni della rispettiva licenza. Qualsiasi ridistribuzione o modifica deve citare gli autori originali: Gauthier REMANDE ed Emmanuel GAUNARD. Le immagini utilizzate nei moduli H5P sono recuperate dal sito H5P.org.",
  legal_personal_data_title: "Dati personali",
  legal_personal_data_content: "Nessun dato personale viene raccolto né memorizzato. Non viene utilizzato alcun cookie di tracciamento.",
  legal_ai_models_title: "Modelli di Intelligenza Artificiale",
  legal_ai_models_content: "Lapplicazione Caramel si avvale, unicamente durante la generazione in un clic, di modelli di IA gestiti da ILAAS, una federazione di infrastrutture di IA condivise. Le richieste vengono instradate tramite un workflow n8n ospitato dall'Incubateur, quindi trasmesse a ILAAS per l'esecuzione su server affidabili ospitati in data center certificati dell 'Insegnamento superiore e della ricerca (ESR). Caramel non esegue i modelli e non tratta né memorizza i dati in proprio; i dati vengono utilizzati solo per eseguire la richiesta e non vengono inviati a IA generaliste. I modelli attualmente offerti includono {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) e {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Le modalità di hosting, registrazione e conservazione eventualmente effettuate da ILAAS rientrano nella loro politica sulla privacy e nelle loro condizioni di servizio, alle quali si rimanda.",
  legal_user_requests_processing_title: "Trattamento delle richieste degli utenti tramite n8n e l'Incubateur del Ministero dell'Educazione Nazionale",
  legal_user_requests_processing_content: "Il nostro sito utilizza una soluzione tecnica sviluppata da n8n, uno strumento open source ospitato dall'Incubateur del Ministero dell'Educazione Nazionale francese. Questo servizio permette, tramite un workflow automatizzato, di trasformare le richieste degli utenti in dati strutturati (formato JSON) per interagire con un'intelligenza artificiale della DINUM, quindi sovrana. Nessuna informazione sensibile viene esposta o trasmessa senza crittografia, garantendo così la riservatezza e la sicurezza degli scambi.",
  legal_accessibility_title: "Accessibilità",
  legal_accessibility_content: "L'applicazione è progettata per essere compatibile con l'uso su computer, includendo modalità scura/chiara, navigazione da tastiera e contrasto elevato in base ai temi. È in corso un miglioramento continuo dell'accessibilità, in linea con le raccomandazioni del RGAA.",
  legal_applicable_law_title: "Diritto applicabile",
  legal_applicable_law_content: "Questo sito è soggetto al diritto francese. In caso di controversia, i tribunali competenti saranno quelli della circoscrizione di Lione.",
  legal_external_libraries_title: "Librerie esterne utilizzate",
  legal_external_libraries_intro: "L'applicazione Caramel utilizza diverse librerie open source, sotto le seguenti licenze:",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licenza: CC BY 4.0, SIL OFL 1.1, MIT): Fornisce le icone utilizzate nell'interfaccia per migliorare la navigazione e l'esperienza visiva.",
  legal_library_jszip: "<strong>JSZip</strong> (Licenza: MIT o GPLv3): Permette di creare file .h5p comprimendo il contenuto necessario in un archivio zip.",
  legal_library_clientzip: "<strong>client-zip</strong> (Licenza: MIT): Un'altra libreria utilizzata per la compressione di file, che offre un'alternativa performante per generare gli archivi .h5p direttamente nel browser.",
  legal_library_fflate: "<strong>fflate</strong> (Licenza: MIT): Libreria molto veloce per la compressione e decompressione di dati, utilizzata per la creazione degli archivi .mbz dei moduli Moodle.",
  legal_library_tarjs: "<strong>tar-js</strong> (Licenza: MIT): Permette di creare archivi .tar, un passaggio necessario prima della compressione per formare i file .mbz dei moduli Moodle.",
  legal_library_mammoth: "<strong>Mammoth</strong> (Licenza: BSD 2-Clause): Permette di convertire documenti Word (.docx) in HTML, facilitando l'importazione e l'integrazione di contenuti da file Microsoft Word.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (Licenza: Apache 2.0): Permette di estrarre il testo nativo dei file PDF direttamente nel browser, senza necessità di elaborazione lato server.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (Licence : Apache 2.0) : Motore di riconoscimento ottico dei caratteri (OCR) che permette di estrarre testo da immagini (PNG, JPG, JPEG) e documenti PDF scansionati.",
  legal_library_mathjax: "<strong>MathJax</strong> (Licenza: Apache 2.0): Utilizzato per il rendering delle formule matematiche (LaTeX) nelle anteprime.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (Licenza: MIT): Consente di visualizzare in anteprima i contenuti H5P direttamente nel browser senza richiedere un server o un CMS (come Moodle o WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (Licenza: MIT): Libreria JavaScript per generare documenti PDF direttamente nel browser, utilizzata per esportare i contenuti educativi in formato PDF.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (Licenza: MIT): Estensione di jsPDF che consente di generare tabelle strutturate nei documenti PDF esportati.",
  legal_library_docx: "<strong>docx</strong> (Licenza: MIT): Libreria JavaScript per creare documenti Word (.docx) nel browser, utilizzata per esportare i contenuti educativi in formato Microsoft Word.",
  legal_library_ownership: "Ogni libreria rimane di proprietà dei rispettivi autori e viene utilizzata in conformità con la sua o le sue licenze.",

  // ============================================================================
  // === NOTIFICHE ===
  // ============================================================================
  no_notifications: "Nessuna notifica",
  clear_all: "Cancella tutto",
  view: "Visualizza",
  today: "Oggi",
  error: "Errore",
  download: "Scarica",
  edit_content: "Modifica",
  compatible_with: "Compatibile con:",
  preview_placeholder: "Anteprima disponibile a breve",
  previous: "Precedente",
  next: "Successivo",
  close_modal: "Chiudi",
  loading: "Caricamento...",
  preview_error: "Impossibile visualizzare l'anteprima di questo file",
  simulator_warning: "Anteprima tramite il simulatore di attività: la resa finale su Éléa potrebbe essere leggermente diversa.",
  editor_confirm_close_title: "Modifiche non salvate",
  editor_confirm_close_message: "Vuoi salvare le modifiche prima di uscire?",
  editor_confirm_close_cancel: "Rimani nell'editor",
  editor_confirm_close_save: "Salva ed esci",
  editor_confirm_close_discard: "Esci senza salvare",

  // Editor JSON
  editor_title_prefix: "Modifica:",
  editor_loading: "Caricamento dell'editor...",
  editor_unknown_type: "Tipo di contenuto non riconosciuto",
  editor_no_schema: "Schema non disponibile per questo tipo",
  editor_init_error: "Errore durante l'inizializzazione dell'editor",
  editor_save: "Salva",
  editor_cancel: "Annulla",
  editor_unsaved_changes: "Modifiche non salvate",
  editor_confirm_discard: "Vuoi davvero annullare? Le modifiche non salvate andranno perse.",
  editor_validation_errors: "Errori di validazione",

  // Sezioni
  editor_section_general: "Informazioni generali",
  editor_section_question: "Domanda",
  editor_section_questions: "Domande",
  editor_section_answers: "Risposte",
  editor_section_answer: "Risposta",
  editor_section_feedback: "Feedback",
  editor_section_cards: "Carte",
  editor_section_sentences: "Frasi",
  editor_section_events: "Eventi",
  editor_section_words: "Parole",
  editor_section_keywords: "Parole chiave",
  editor_section_entries: "Voci",
  editor_section_pairs: "Coppie",
  editor_section_text: "Testo",

  // Campi generali
  editor_title: "Titolo",
  editor_description: "Descrizione",
  editor_description_hint: "Istruzioni visualizzate agli studenti",
  editor_intro: "Introduzione",
  editor_task_description: "Consegna",
  editor_question_text: "Testo della domanda",

  // Carte
  editor_card: "Carta",
  editor_card_front: "Fronte",
  editor_card_front_placeholder: "Domanda o termine",
  editor_card_back: "Retro",
  editor_card_back_placeholder: "Risposta o definizione",
  editor_card_tip: "Suggerimento",
  editor_add_card: "Aggiungi una carta",

  // Risposte
  editor_answer: "Risposta",
  editor_answer_text: "Testo della risposta",
  editor_is_correct: "Corretto",
  editor_add_answer: "Aggiungi una risposta",

  // Suggerimenti e Feedback
  editor_tips_feedback: "Suggerimenti e feedback",
  editor_tip: "Suggerimento",
  editor_tip_optional: "Suggerimento (opzionale)",
  editor_tips_optional: "Suggerimenti (opzionali)",
  editor_tip_front: "Suggerimento fronte",
  editor_tip_back: "Suggerimento retro",
  editor_chosen_feedback: "Feedback se selezionato",
  editor_not_chosen_feedback: "Feedback se non selezionato",
  editor_feedback_correct: "Feedback se corretto",
  editor_feedback_wrong: "Feedback se errato",
  editor_overall_feedback: "Feedback globale per punteggio",

  // Intervalli di feedback
  editor_feedback_ranges_label: "Feedback in base al punteggio",
  editor_feedback_placeholder: "Messaggio di feedback per questo intervallo...",
  editor_add_range: "Aggiungi un intervallo",

  // Vero/Falso
  editor_correct_answer: "Risposta corretta",
  editor_true: "Vero",
  editor_false: "Falso",

  // Riempimento spazi / Trascina parole
  editor_sentence: "Frase",
  editor_sentence_text: "Testo della frase",
  editor_add_sentence: "Anuingi una frase",
  editor_blanks_hint: "Circonda le parole da indovinare con *asterischi*",
  editor_text_with_blanks: "Testo con parole da inserire",
  editor_drag_words_hint: "Le parole tra *asterischi* saranno elementi da trascinare",

  // Linea temporale
  editor_event: "Evento",
  editor_add_event: "Aggiungi un evento",
  editor_start_date: "Data di inizio",
  editor_end_date: "Data di fine",
  editor_event_title: "Titolo dell'evento",
  editor_event_description: "Descrizione",
  editor_event_tag: "Etichetta",

  // Cruciverba
  editor_word: "Parola",
  editor_add_word: "Aggiungi una parola",
  editor_clue: "Suggerimento/Definizione",
  editor_orientation: "Orientamento",
  editor_horizontal: "Orizzontale",
  editor_vertical: "Verticale",
  editor_crossword_answer_hint: "La parola in maiuscolo",

  // Saggio
  editor_keyword: "Parola chiave",
  editor_keyword_text: "Parola chiave attesa",
  editor_keyword_weight: "Peso",
  editor_add_keyword: "Aggiungi una parola chiave",

  // Glossario
  editor_entry: "Voce",
  editor_add_entry: "Aggiungi una voce",
  editor_term: "Termine",
  editor_definition: "Definizione",

  // Moodle
  editor_question: "Domanda",
  editor_add_question: "Aggiungi una domanda",
  editor_pair: "Coppia",
  editor_add_pair: "Aggiungi una coppia",
  editor_left_element: "Elemento sinistro",
  editor_right_element: "Elemento destro",
  editor_choice: "Scelta",
  editor_choice_text: "Testo della scelta",
  editor_add_choice: "Aggiungi una scelta",

  // Azioni elementi
  editor_add_item: "Aggiungi",
  editor_drag: "Trascina",
  editor_duplicate: "Duplica",
  editor_delete: "Elimina",
  editor_confirm_delete: "Vuoi davvero eliminare questo elemento?",
  editor_min_items_reached: "Numero minimo di elementi raggiunto",
  editor_max_items_reached: "Numero massimo di elementi raggiunto",

  // Errori di validazione
  editor_error_required: "Questo campo è obbligatorio",
  editor_error_min_length: "Minimo {0} caratteri",
  editor_error_max_length: "Massimo {0} caratteri",
  editor_error_pattern: "Formato non valido",
  editor_error_min_items: "Minimo {0} elemento(i)",
  editor_error_max_items: "Massimo {0} elemento(i)",
  editor_error_number: "Deve essere un numero",
  editor_error_min: "Minimo {0}",
  editor_error_max: "Massimo {0}",
  editor_error_feedback_ranges: "Gli intervalli devono coprire lo 0-100% senza sovrapposizioni",
  editor_error_no_correct: "Almeno una risposta deve essere corretta",
  editor_error_date_format: "Formato data non valido (atteso: AAAA,M,G)",
  editor_error_no_blanks: "Il testo deve contenere almeno una parola tra *asterischi*",

  // QuizSet
  editor_library_type: "Tipo di libreria",
  editor_question_title: "Titolo della domanda",
  editor_question_params: "Parametri della domanda",
  editor_parameters: "Parametri",

  // Cruciverba
  editor_extra_clue: "Suggerimento extra",

  // FindTheWords
  editor_word_list: "Elenco di parole",

  // SingleChoiceSet
  editor_answers: "Risposte possibili",

  // MarkTheWords
  editor_text_with_marks: "Testo con parole da evidenziare",
  editor_mark_words_hint: "Circonda le parole da evidenziare con *asterischi*",

  // SortParagraphs
  editor_section_paragraphs: "Paragrafi",
  editor_paragraph: "Paragrafo",
  editor_add_paragraph: "Aggiungi un paragrafo",
  editor_paragraph_text: "Testo del paragrafo",

  // Summary
  editor_section_summaries: "Riassunti",
  editor_summary_item: "Elemento di riassunto",
  editor_add_summary_item: "Aggiungi un elemento",
  editor_statement: "Affermazione",
  editor_add_statement: "Aggiungi un'affermazione",
  editor_statement_text: "Testo dell'affermazione",

  // Moodle Test
  editor_question_type: "Tipo di domanda",

  // Moodle Page
  editor_section_blocks: "Blocchi",
  editor_block: "Blocco",
  editor_add_block: "Aggiungi un blocco",
  editor_block_type: "Tipo di blocco",
  editor_block_content: "Contenuto del blocco",

  // Attività Éléa specifiche
  // Glossario
  editor_glossary_name: "Nome del glossario",

  // Millionnaire
  editor_good_answer: "Risposta corretta",
  editor_bad_answers: "Risposte errate",
  editor_bad_answer: "Risposta errata",
  editor_add_bad_answer: "Aggiungi una risposta errata",

  // Test (banca delle domande)
  editor_bank_name: "Nome della banca",
  editor_bank_description: "Descrizione della banca",
  editor_question_name: "Nome della domanda",
  editor_question_feedback: "Feedback generale",
  editor_answer_fraction: "Punti/Punteggio",
  editor_answer_feedback: "Feedback della risposta",
  editor_subquestion: "Sottodomanda",
  editor_add_subquestion: "Aggiungi una sottodomanda",
  editor_numerical_value: "Valore numerico",
  editor_numerical_tolerance: "Tolleranza",
  editor_section_subquestions: "Sottodomande",
  editor_section_content: "Contenuto",
  editor_feedback_if_true: "Feedback se vero",
  editor_feedback_if_false: "Feedback se falso",

  // Messaggi
  editor_save_success: "Modifiche salvate",
  editor_save_error: "Errore durante il salvataggio",
  editor_regenerating: "Rigenerazione del file...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Pagina",
  doc_fmt_summary_header: "Sommario",
  doc_fmt_quiz_title: "Quiz",
  doc_fmt_instructions: "📝 Istruzioni: Rispondere alle seguenti domande.",
  doc_fmt_question_header: "Domanda",

  // --- Shared properties ---
  doc_fmt_type: "Tipo:",
  doc_fmt_feedbacks: "💬 Feedback:",
  doc_fmt_global_feedbacks: "Feedback globali",
  doc_fmt_answers: "Risposte:",
  doc_fmt_correct_answer_true: "Risposta corretta: VERO ✓",
  doc_fmt_correct_answer_false: "Risposta corretta: FALSO ✓",
  doc_fmt_text_if_true: "Testo se vero:",
  doc_fmt_text_if_false: "Testo se falso:",
  doc_fmt_text_with_answers: "Testo con le risposte:",
  doc_fmt_text_with_marks: "Testo con le parole da segnare:",
  doc_fmt_marks_to_find: "Parole da segnare:",
  doc_fmt_keywords_expected: "Parole chiave attese:",
  doc_fmt_accepted_answers: "Risposte accettate:",
  doc_fmt_text_to_complete: "Testo da completare:",
  doc_fmt_also_called: "🏷️ Chiamato anche:",
  doc_fmt_image_not_found: "⚠️ [Immagine non trovata]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Flashcard",
  doc_fmt_card_index: "Carta",
  doc_fmt_card_front: "Fronte:",
  doc_fmt_card_back: "Retro:",
  doc_fmt_hint: "💡 Suggerimento:",
  doc_fmt_crossword_title: "Cruciverba",
  doc_fmt_definitions_and_answers: "Definizioni e risposte",
  doc_fmt_answer: "Risposta:",
  doc_fmt_extra_hint: "💡 Suggerimento extra:",
  doc_fmt_timeline_events: "Eventi",
  doc_fmt_timeline_periods: "Periodi",
  doc_fmt_drag_the_words_title: "Trascina le parole",
  doc_fmt_fill_in_the_blanks_title: "Riempi gli spazi vuoti",
  doc_fmt_mark_the_words_title: "Segna le parole",
  doc_fmt_glossary_title: "Glossario",
  doc_fmt_term_index: "Termine",
  doc_fmt_chart_title: "Diagramma",
  doc_fmt_data: "Dati",
  doc_fmt_summary_title: "Riassunto",
  doc_fmt_claim_index: "Affermazione",
  doc_fmt_multiple_choice_title: "Domanda a scelta multipla",
  doc_fmt_single_choice_set_title: "Insieme di domande a scelta singola",
  doc_fmt_true_false_title: "Domanda Vero/Falso",
  doc_fmt_dialog_cards_title: "Carte di dialogo",
  doc_fmt_hint_front: "💡 Suggerimento (fronte):",
  doc_fmt_hint_back: "💡 Suggerimento (retro):",
  doc_fmt_sort_paragraphs_title: "Ordina i paragrafi",
  doc_fmt_paragraphs_ordered: "Paragrafi nell'ordine corretto",
  doc_fmt_find_the_words_title: "Parole intrecciate",
  doc_fmt_words_to_find: "Parole da trovare",
  doc_fmt_matching_title: "Abbinamento",
  doc_fmt_matching_instructions: "📝 Istruzioni: Abbina ogni elemento al suo corrispondente.",
  doc_fmt_pairs_to_match: "Coppie da abbinare",
  doc_fmt_millionnaire_title: "Chi vuol essere milionario?",
  doc_fmt_millionnaire_instructions: "📝 Istruzioni: Trova la risposta corretta tra le quattro opzioni.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Domanda aperta",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "Test",
  doc_fmt_associations: "Associazioni:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Scelta multipla (QCM)",
  doc_fmt_type_matching: "Abbinamento",
  doc_fmt_type_numerical: "Numerico",
  doc_fmt_type_truefalse: "Vero/Falso",
  doc_fmt_type_shortanswer: "Risposta breve",
  doc_fmt_type_cloze: "Testo a completare (Cloze)",
  doc_fmt_type_blanks: "Riempi gli spazi vuoti",
  doc_fmt_type_dragtext: "Trascina le parole",
  doc_fmt_type_markwords: "Segna le parole",
  doc_fmt_type_essay: "Domanda aperta",
  doc_fmt_type_default: "Domanda",

  // Nuove chiavi per la struttura pedagogica enunciato/correzione
  doc_fmt_correction_title: "Correzione",
  doc_fmt_proposed_answers: "Proposte:",
  doc_fmt_correct_answer: "Risposta corretta",
  doc_fmt_correct_answers: "Risposte corrette:",
  doc_fmt_true: "Vero",
  doc_fmt_false: "Falso",
  doc_fmt_words_to_place: "Parole da inserire:",
  doc_fmt_completed_text: "Testo completato:",
  doc_fmt_text_to_mark: "Testo in cui trovare le parole:",
  doc_fmt_words_count_to_find: "Numero di parole da trovare",
  doc_fmt_words_to_mark: "Parole da segnare:",
  doc_fmt_answer_space: "Spazio per la risposta:",
  doc_fmt_open_answer: "Risposta aperta - valutazione secondo i criteri definiti dall'insegnante.",
  doc_fmt_definitions: "Definizioni",
  doc_fmt_letters: "lettere",
  doc_fmt_summary_instructions: "Per ogni gruppo, scegli l'affermazione corretta.",
  doc_fmt_sort_instructions: "Metti i seguenti paragrafi nell'ordine corretto.",
  doc_fmt_paragraphs_to_sort: "Paragrafi da ordinare",
  doc_fmt_correct_order: "Ordine corretto",
  doc_fmt_find_instructions: "Trova",
  doc_fmt_hidden_words: "parole nascoste nella griglia.",
  doc_fmt_hints: "Suggerimenti",
  doc_fmt_flashcards_instructions: "Per ogni carta, trova la risposta corrispondente alla domanda.",
  doc_fmt_elements_to_match: "Elementi da abbinare:",
  doc_fmt_possible_matches: "Possibili corrispondenze:",
  doc_fmt_correct_associations: "Associazioni corrette:",

};