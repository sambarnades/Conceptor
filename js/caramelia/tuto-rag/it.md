<!--
Base di conoscenza di Caramelia (assistente pedagogica di Caramel).
Questo file è DOCUMENTAZIONE DI RIFERIMENTO, non un prompt di sistema.
Non deve essere aggiunta qui alcuna istruzione destinata all'LLM.

REGOLA DI EDITING: tutte le etichette menzionate qui sotto (pulsanti,
schede, campi, sezioni) devono riprodurre ESATTAMENTE il testo visibile
sullo schermo in Caramel. Fonte unica di verità: js/locales/it.json
+ index.html. Ogni modifica avviene tramite PR.
-->
---
version: 1.3.0
lang: it
audience: insegnanti
---

# Tutorial Caramel

Caramel è uno strumento web open source che aiuta gli insegnanti a creare
attività pedagogiche interattive (H5P, Éléa, Magistère, Moodle)
con l'aiuto dell'IA. Il sito funziona al 100 % lato browser:
nessun dato pedagogico viene inviato a un server di terze parti.

## Descrivere la tua esigenza (in cima alla pagina)

In cima alla pagina, due schede consentono di scegliere come
descrivere la tua esigenza:

- **Modalità Rapida** — modulo minimo, due campi.
- **Modalità Avanzata** — gli stessi campi più opzioni aggiuntive,
  in particolare la possibilità di allegare documenti.

### Modalità Rapida

Solo due campi:

- **«Chi sei? (es: Insegnante, formatore...)»**
- **«Cosa desideri affrontare? (es: La rivoluzione francese...)»**

### Modalità Avanzata

Stessi campi della Modalità Rapida, più:

- **«Per quale livello (es: Secondaria di secondo grado)»**
- **«Numero di domande/elementi nel modulo (es: 5)»** — a seconda
  dell'attività, ciò corrisponde al numero di domande, di date su
  una linea del tempo, di parole in un glossario, ecc.
- Un campo libero per aggiungere **informazioni aggiuntive**
  (istruzioni specifiche, vincoli o qualsiasi altro dettaglio
  pertinente).

### Allega documenti (facoltativo) — solo in Modalità Avanzata

Questa sezione, intitolata **«Allega documenti (facoltativo)»**,
appare solo quando è selezionata la scheda **Modalità Avanzata**.
Permette di basare la generazione su un contenuto da te fornito.

Tre possibilità:

- **Copiare e incollare un testo** direttamente nell'area di input.
- **Trascinare e rilasciare un documento** (o cliccare su
  **«Scegli un file»**) in formato **PDF, TXT, DOCX, PPTX, ODT, ODP, PNG, JPEG** (sono accettate anche le immagini **WebP** e **BMP**, senza essere elencate sullo schermo). Un'**immagine** caricata (foto, schema, diagramma…) viene **analizzata da un'IA di visione** che ne redige una **descrizione** e **ricopia fedelmente il testo** che contiene — se l'IA non è disponibile, la lettura locale (OCR) subentra automaticamente. Puoi anche rilasciare un **file audio** (MP3, M4A, WAV…) o un **video** (MP4, MOV…): viene quindi trascritta automaticamente solo la traccia audio (tramite Albert, il servizio sovrano della DINUM; vedi riservatezza più sotto). La zona di rilascio mostra **«Trascina qui uno o più documenti (PDF, TXT, DOCX, PPTX, ODT, ODP, PNG, JPEG)»** con il separatore
  **«o»**.
- **Importare una pagina web**: incolla il suo link (`https://…`) nel
  campo sotto l'area di rilascio, poi clicca su **«Aggiungi»**. Il
  testo della pagina viene recuperato automaticamente.

L'estrazione del testo dei **documenti** avviene **interamente in
locale** nel tuo browser (nessun dato inviato).
**Tre eccezioni transitano dai nostri server (ospitati in Francia):**
l'**analisi delle immagini** (l'immagine viene inviata al modello di
visione per il tempo dell'analisi, mai conservata; in caso di
indisponibilità, l'OCR locale — che non invia nulla — subentra), la
**trascrizione audio** e l'**import di una pagina web** (il link che
inserisci vi viene inviato per estrarne il testo; i link verso PDF,
video o pagine a pagamento non sono supportati).

Se lasci questa zona vuota, l'IA si baserà solo sulle sue conoscenze
generali per generare l'attività.

## Scegliere il tipo di attività

Una volta effettuata la descrizione, le tessere delle attività diventano
cliccabili. Clicca su quella che corrisponde al tuo obiettivo
pedagogico. I filtri sopra le tessere consentono di limitare la
visualizzazione: **Tutto**, **Quiz & Test**, **Manipolazione del testo**,
**Memorizzazione & Scoperta**, oltre alle piattaforme **H5P**,
**Éléa**, **Moodle**.

Sotto il modulo, **Un'attività** mostra queste schede; **Un percorso** apre il laboratorio che riunisce più attività in un corso completo (vedi «Creare e riprendere un corso completo»).

### Attività H5P

Attività in formato H5P. Quelle contrassegnate con una stella (★) integrano
un feedback dettagliato in 4 fasce di punteggio.

- **Linea del tempo** — sequenza interattiva di eventi.
- **Flashcard** — fronte-retro per la memorizzazione.
- **Quiz a scelta multipla (Question Set)** ★ — quiz di domande a scelta multipla.
- **Quiz Vero/Falso (Question Set)** ★ — quiz vero o falso.
- **Quiz misto (Question Set)** ★ — domande variate (scelta multipla, trascina e rilascia…).
- **Glossario** — fisarmonica espandibile o FAQ.
- **Cruciverba** ★ — griglia generata a partire da definizioni.
- **Composizione** ★ — argomento di composizione con correzione per parole chiave.
- **Riassunto** ★ — l'alunno ricostruisce un riassunto scegliendo le frasi corrette.
- **Trascina le parole** ★ — testo con parole mancanti da trascinare.
- **Trascina e rilascia** ★ — etichette da posizionare in una zona.
- **Testo a buchi** ★ — l'alunno completa le parole con la tastiera.
- **Evidenzia le parole** ★ — l'alunno evidenzia alcune parole in un testo.
- **Vero/Falso** — domande binarie semplici.
- **Scelta multipla** ★ — domande con una o più risposte corrette.
- **Trova le parole** — griglia di lettere con parole da trovare.
- **Ordina i paragrafi** ★ — rimettere i paragrafi nell'ordine corretto.
- **Serie di scelte singole** ★ — domande con una sola risposta corretta.
- **Carte di dialogo** — carte fronte-retro con testo e audio.
- **Dettato** — dettato audio: frasi lette dalla sintesi vocale (voce F/M, velocità normale o lenta, 11 lingue), lo studente le scrive e la correzione evidenzia gli errori.
- **Testo a buchi complesso** ★ — feedback specifici per errore.
- **Diagramma** — a torta o a barre per visualizzare dati.
- **Presentazione del corso** — diapositive interattive con esercizi integrati.
- **Libro interattivo** — libro multi-capitolo (testi, tabelle, immagini, esercizi) con indice e riepilogo.
- **Video interattivo** — domande (scelta multipla, vero/falso, riempimento) nei momenti chiave di un video, con riepilogo finale. Richiede un URL del video (Tubes di Apps Éducation, PodEduc o YouTube); Caramelia lo chiede prima di generare.
- **Immagine interattiva** — punti cliccabili su un'immagine che alleghi. Caramel individua automaticamente le zone chiave dell'immagine in base al tuo contesto (disciplina, livello, tema) e posiziona i punti, poi redige il contenuto di ciascun punto. In seguito, nell'editor, puoi aggiungere a mano testo, un'immagine, un suono o un video in un punto, e scegliere il colore e il tipo di marcatore (numeri, icona). Chiede di allegare un file immagine (PNG, JPEG, WebP, e perfino HEIC/foto iPhone o TIFF); Caramel lo analizza fin dal caricamento. Esportabile anche in documento (DOCX, ODT, PDF) con pastiglie numerate.
- **Trova la zona (Find the Hotspot)** — una domanda a cui si risponde cliccando direttamente su un'immagine che alleghi: Caramel individua le zone dell'immagine, sceglie LA zona corretta secondo il tuo contesto e redige la consegna e i feedback (le altre zone fungono da distrattori; il punteggio si decide al primo clic). Come per l'Immagine interattiva, occorre allegare un file immagine, analizzato appena caricato. Nell'editor le zone si spostano direttamente sull'immagine (verde = corretta, rosso = distrattore). Esportabile anche come documento (DOCX, ODT, PDF) con scheda studente e correzione.
- **Trova le zone (Find Multiple Hotspots)** — una caccia alle zone su un'immagine che alleghi: lo studente deve cliccare su TUTTE le zone corrette (le verdure, gli errori, i rischi…). Caramel sceglie le zone corrette secondo il tuo contesto, dà un nome a ciò che si cerca e redige consegna e feedback. Stesso flusso dell'Immagine interattiva (file immagine analizzato appena caricato, zone modificabili sull'immagine). Esportabile anche come documento (DOCX, ODT, PDF).

### Attività Éléa / Magistère

- **Test (MBZ / XML / GIFT)** — attività Test pronta da ripristinare in **`.mbz`**
  (banca di domande + quiz cablato), oppure banca di domande variate (scelta multipla,
  abbinamento…) da importare (XML / GIFT) in un test Éléa/Magistère.
- **QCM (MBZ)** — attività a scelta multipla semplice e rapida.
- **Abbinamento (MBZ)** — gioco di associazione tra coppie di elementi.
- **Milionario (MBZ)** — quiz ludico con difficoltà crescente.
- **Glossario (XML)** — file di importazione per un glossario Éléa/Magistère.
- **Pagina (MBZ / HTML)** — pagina di corso strutturata e formattata.
- **Libro (MBZ)** — libro multi-capitolo con navigazione.
- **Compito (MBZ)** — compito con griglia di valutazione per criteri.

## Generare e affinare il contenuto

Dopo aver cliccato su una tessera, si apre una finestra. È qui che
interagisci con l'IA. In cima a questa finestra, un interruttore
**Semplice / Guidato** consente di scegliere la modalità di
visualizzazione.

### Visualizzazione Semplice — pulsante «Genera in un clic»

La via rapida. Clicca su **«Genera in un clic»**: l'IA produce
il contenuto e lo posiziona direttamente nella zona del risultato a destra.
La piccola freccia a destra del pulsante consente di scegliere tra diversi
modelli di IA (rapido, potente…).

### Visualizzazione Guidato — utilizzare un'IA esterna

Per un controllo massimo. Il prompt appare a sinistra.

1. Modifica il prompt se lo desideri.
2. Clicca su **«Copia il prompt»** e apri un'IA esterna
   in una nuova scheda.
3. Incolla il prompt nell'IA, recupera la sua risposta, poi incollala
   nella zona del risultato a destra in Caramel.

Due icone utili, in cima alla zona del prompt: **«Schermo intero»**
per maggior comodità, e **«Blocca»** (che diventa **«Sblocca»**)
per proteggere il prompt.

## Visualizzare, modificare e scaricare

Una volta generato il contenuto, appare la finestra
**«Il tuo dolcetto è pronto!»**, con due scelte: **«Visualizza e modifica»**
oppure **«Continua»** (per generare un'altra attività).

### Visualizzare

Un simulatore integrato prova l'attività come un alunno (clicca,
trascina, scrivi…). Per i contenuti Éléa/Magistère, un simulatore
mostra il rendering reale.

### Modificare (icona matita, pulsante **«Modifica»**)

L'editor visivo si adatta automaticamente al tipo di attività: elenco
degli elementi a sinistra, dettaglio a destra.

- **Barra rich-text** sui campi compatibili: grassetto, corsivo,
  sottolineato, barrato, esponente, pedice, colore, elenchi, link.
- Pulsante `</>` per passare alla **modalità codice sorgente**.
- **Formule matematiche** tramite il pulsante **√x**: 6 categorie
  (frazioni, radici, potenze, lettere greche, operatori,
  strutture), anteprima in tempo reale, doppio clic per modificare.
- **Parole da trovare** (Trascina le parole, Evidenzia le parole,
  Testo a buchi): evidenziazione gialla automatica, pulsanti
  Marca / Rimuovi, oppure asterischi `*parola*`.
- **Testo a buchi (Cloze)** in Test: tre tipi di buchi
  (Scelta multipla, Risposta breve, Valore numerico), visualizzati
  come pastiglie colorate (blu, gialle, verdi).
- **Immagini**: trascina e rilascia, ridimensionamento automatico
  (800×600), testo alternativo, formati JPEG / PNG / WebP.

### Scaricare

Il pulsante **«Scarica»** propone due famiglie di formati:

- **Formati interattivi** (digitali, per Éléa/Magistère):
  H5P, MBZ, XML.
- **Formati stampabili** (versioni offline): DOCX, ODT, PDF.

## Integrare il file generato in Éléa

> Nota: le etichette tra virgolette qui sotto sono in francese, poiché corrispondono all'interfaccia della piattaforma Éléa, utilizzata principalmente in contesto francofono.

### Integrare un file H5P

- **Metodo rapido**: passare alla modalità di modifica del percorso,
  trascinare e rilasciare il file `.h5p` direttamente, scegliere
  « Ajouter une activité H5P » e poi confermare con **« DÉPOSER »**.
- **Metodo consigliato**: « Ajouter une activité ou une ressource »
  → « Contenu interactif (H5P) » → scheda « Téléverser » →
  selezionare il file → **« Utiliser »** → salvare.

### Integrare un file MBZ

1. Aprire il menu di modifica a destra (cliccare sulla freccia per
   espanderlo se necessario).
2. Cliccare su **« IMPORT/EXPORT »** → **« Importer un parcours »**.
3. Trascinare e rilasciare il file `.mbz` → **« IMPORTER »**.
4. **« CONTINUER »**.

### Integrare un XML (banca di domande Test)

1. Scheda **« Plus »** → **« Banque de questions »**.
2. Menu **« Questions »** → **« Importer »**.
3. Selezionare il formato (XML Magistère consigliato, o GIFT).
4. Trascinare e rilasciare il file → **« IMPORTATION »** → **« CONTINUER »**.

### Integrare un XML Glossario

1. Creare un Glossario vuoto nel percorso.
2. Cliccare su **« IMPORTER DES ARTICLES »**.
3. Trascinare e rilasciare il file `.xml` → **« ENVOYER »** → **« CONTINUER »**.

### Integrare un file HTML in un'attività Pagina

1. Aprire il `.html` con un editor di testo, copiare tutto il contenuto.
2. In Éléa, aggiungere un'attività **« Page »**.
3. Nell'editor: **« Outils → Code source »**.
4. Incollare l'HTML → salvare.

## Informazioni su Caramel

### Autori

Se l'utente desidera contattare il team:

- **Gauthier REMANDE** — Insegnante di Lettere e Storia (formazione professionale) — gauthier.remande@ac-nantes.fr
- **Emmanuel GAUNARD** — Insegnante di matematica e incaricato di missione DRANE — Académie de Grenoble — emmanuel.gaunard@ac-grenoble.fr

### Note legali

#### Dati personali

Non viene raccolto né conservato alcun dato personale. Non viene utilizzato alcun cookie di tracciamento.

#### Modelli di Intelligenza Artificiale

L'applicazione Caramel si basa, esclusivamente durante la generazione con un clic, su modelli di IA gestiti da ILaaS, una federazione di infrastrutture di IA condivise. Le richieste vengono instradate tramite un workflow n8n ospitato dall'Incubateur, quindi trasmesse a ILaaS per l'esecuzione su server affidabili ospitati in data center certificati dell'Istruzione Superiore e della Ricerca francese (ESR). Caramel non esegue i modelli e non elabora né archivia dati per proprio conto; i dati vengono utilizzati esclusivamente per eseguire la richiesta e non vengono inviati a IA di consumo. I modelli attualmente disponibili includono Gemma 4 (31 miliardi di parametri), Qwen 3.8 (27 miliardi di parametri) e Mistral Small 4 (119 miliardi di parametri). Le eventuali modalità di hosting, registrazione e conservazione effettuate da ILaaS sono regolate dalla loro politica di riservatezza e dalle loro condizioni di servizio, alle quali è opportuno fare riferimento.

#### Trattamento delle richieste degli utenti tramite n8n e l'Incubateur del Ministero dell'Istruzione nazionale

Il nostro sito utilizza una soluzione tecnica sviluppata con n8n, uno strumento open source ospitato dall'Incubateur del Ministero dell'Istruzione nazionale francese. Tramite un workflow automatizzato, questo servizio trasforma le richieste degli utenti in dati strutturati (formato JSON) per interagire con un'intelligenza artificiale della DINUM, quindi sovrana. Nessuna informazione sensibile viene esposta o trasmessa senza crittografia, garantendo così la riservatezza e la sicurezza degli scambi.

#### Accessibilità

L'applicazione è progettata per essere compatibile con l'uso su computer, inclusi i modi scuro/chiaro, la navigazione da tastiera e il contrasto elevato a seconda dei temi. È in corso un miglioramento continuo dell'accessibilità, in linea con le raccomandazioni del RGAA.

### Collegamenti utili

- **Licenza**: GNU AGPL v3.0 o successiva — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
- **Segnalare un bug**: https://forge.apps.education.fr/caramel/caramel/-/issues
- **Codice sorgente**: https://forge.apps.education.fr/caramel/caramel
- **Changelog**: https://forge.apps.education.fr/caramel/caramel/-/blob/main/CHANGELOG

## Quadro di risposta di Caramelia

- Caramelia risponde sempre nella lingua dell'utente.
- Risposte concise, amichevoli, pedagogiche (da 1 a 3 paragrafi).
- Emoji con parsimonia (1 o 2 al massimo).
- Quando cita un pulsante, una scheda, un campo o una sezione del
  sito, Caramelia usa **esattamente** l'etichetta visibile sullo
  schermo, come elencata sopra (ad esempio **«Modalità Avanzata»**,
  **«Allega documenti (facoltativo)»**, **«Genera in un clic»**).
  Non inventa nomi di tappe («fase 1»…) né termini tecnici interni
  («opzione RAG»…) che non appaiono nell'interfaccia.
- Se l'utente vuole generare un'attività, Caramelia propone il
  tipo più adatto ma non genera MAI il JSON di un'attività.
- Per qualsiasi domanda di integrazione, Caramelia fornisce i passaggi
  precisi indicati sopra.

<!-- parcours-complet -->
## Creare e riprendere un corso completo

In Caramel, **Un percorso** crea un corso per Éléa, Magistère o Moodle: più attività organizzate in sezioni in un unico file **.mbz**. Il punto di partenza resta il modulo abituale: argomento, destinatari e documenti allegati. Il laboratorio usa il vocabolario della piattaforma scelta: alunni su Éléa, partecipanti su Magistère, studenti su Moodle — sullo schermo, nel corso e nei testi che scrive l’IA.

Nel menu di Caramelia, **Crea un percorso** apre direttamente il laboratorio senza chiamare l’IA. Se esiste una bozza, **Riprendi il mio percorso** la riapre. I campi e le fonti presenti vengono conservati. Rileggi le impostazioni e il piano nel laboratorio prima di avviare la generazione.

Scegli **Un percorso** sotto il modulo, poi piattaforma, modalità, ampiezza, **Uno stesso cammino per tutti** o **Cammini in base ai risultati**, e un modello: i più comuni vengono proposti per primi — imparare in autonomia, ripassare, allenarsi, valutare — e **Vedi gli altri modelli** mostra i successivi. **Comporre il piano** adatta il piano all’argomento con l’IA. **Partire dal modello** apre subito una struttura da completare senza chiamare l’IA. Le attività vengono generate solo dopo la tua approvazione del piano.

In **Piano**, modifica titolo, obiettivo generale, concetti chiave, fasi e attività. Sposta le attività con le frecce o trascinando la miniatura. **Consegna e fase** permette di regolare le istruzioni di generazione. I suggerimenti pedagogici aiutano a rileggere senza imporre un modello. Il massimo è di **12 attività**.

Nella scheda di un **Video interattivo**, incollate il link del video. La trascrizione viene recuperata durante la generazione; potete anche incollarla manualmente. Per **Immagine interattiva**, **Trova la zona** o **Trova le zone**, allegate un’immagine alla scheda: sarà analizzata prima della generazione. Potete aggiungere questi supporti anche durante la fase di generazione. Un’attività senza supporto attende mentre le altre proseguono. Lo scenario conserva le immagini e i link delle attività; i documenti del modulo iniziale restano separati. Per un **Link web**, incollate l’indirizzo della risorsa nella scheda: l’IA scrive la consegna di lettura senza aprire la pagina.

Quando il contenuto è pronto, **Modificare il contenuto** apre l’editor abituale e **Anteprima** il lettore. **Rivedere il corso** permette di rivedere le attività in ordine con **Precedente** e **Successiva**. Salva le modifiche per includerle nel piano e nelle esportazioni. Cambiare una consegna nel piano non riscrive i contenuti esistenti.

Approva il piano per avviare la generazione. Puoi fermarla, riprendere le attività mancanti o rigenerarne una. Il lucchetto **Non generare questa attività** riserva il contenuto all’inserimento manuale: l’IA non lo compila. Una rigenerazione fallita conserva il contenuto precedente. Le attività assenti sono indicate prima dell’esportazione.

**Esportare lo scenario (.json)** salva il piano e i contenuti pronti in un file **.json**. Il pulsante **Personalizza il piano**, accanto a **Comporre il piano**, apre la stessa finestra di un’attività: copia il prompt nell’IA che preferisci, poi incollane la risposta. **Riprendere uno scenario** si trova in questa finestra; il file **.json** si scarica alla consegna, accanto al **.mbz**. La bozza resta solo in questa scheda: esporta lo scenario prima di chiuderla. Lo scenario non include argomento, destinatari o allegati; reinseriscili prima di generare nuovi contenuti.

In **Consegna**, scarica il **.mbz** e usa l’importazione o il ripristino del corso della piattaforma. Questo file di corso non va caricato in un’attività H5P. Il percorso compare anche nell’area delle notifiche: **Visualizza** apre la **Panoramica del percorso**, con l’accoglienza, ogni tappa e le sue attività, da rivedere e modificare prima di scaricarlo di nuovo. Conserva anche il **.json** per tornare in Caramel. La scheda della sequenza e i dettagli delle attività si esportano in **DOCX, ODT o PDF**.

Il piano propone anche i moduli del vostro Éléa, Magistère o Moodle, raccolti nel menu di ogni attività sotto **Moduli della piattaforma**: forum, sondaggio, questionario, indagine, lezione, workshop di valutazione tra pari, bacheca, wiki, documento collaborativo, glossario e database da costruire, aula virtuale, scelta del gruppo, condivisione di file e link web. L’IA ne scrive ciò che la piattaforma conserva all’importazione; gli spazi collettivi arrivano vuoti, con la loro consegna. Quando un modulo richiede un’impostazione sulla piattaforma (fasi del workshop, orario dell’aula virtuale, gruppi), Caramel la scrive in una nota **Da fare prima di aprire il corso**, nascosta agli allievi, in cima al corso importato. Il **pacchetto di contenuti IMS** — pagine da leggere con il loro indice, scritte interamente da Caramel — si sceglie nel mosaico; il piano non lo propone.

La mappa di avanzamento è specifica di Éléa. La mappa, l’accesso progressivo e i cammini in base ai risultati richiedono ancora verifiche nell’uso reale sulla piattaforma. La collaborazione avviene sulla piattaforma. La pubblicazione di un percorso completo su Sucrerie non è ancora disponibile.

Per approfondire: [ABC Learning Design (UCL)](https://www.ucl.ac.uk/short-courses/staff-resources/course-design/designing-learning-activities) aiuta a riflettere sulle attività di apprendimento. Le sette famiglie di Caramel, tra cui **Discutere** e **Collaborare**, sono indicazioni semplificate basate sugli strumenti, non i sei tipi ABC né una valutazione della sua didattica.
Su Éléa, apri **Impostazioni del corso**, attiva la mappa di avanzamento e usa il riquadro **+ Aggiungi la mia immagine** per scegliere il tuo sfondo. Puoi cambiare o rimuovere l’immagine e tornare ai temi proposti. Lo sfondo viene salvato nello scenario **.json** e incluso nel corso **.mbz**. JPEG, PNG, HEIC, WebP, GIF, BMP, AVIF, SVG o TIFF · Max. 12 MB. Conversione automatica, senza ritaglio.

<!-- parcours-trames -->
### Scegliere un modello

Dopo **Un percorso**, il modello dà lo svolgimento che l’IA adatta all’argomento. L’elenco mostrato dipende dalla modalità e dall’ampiezza scelte; ogni attività resta modificabile nel piano.

- **Imparare in autonomia** — Un concetto nuovo, imparato da soli: scoprirlo passo dopo passo, esercitarsi con una correzione immediata, fissare l’essenziale, verificare. *(Una lezione · Da due a tre lezioni · Un'unità completa)*
- **Ripassare prima della verifica** — Si individua ciò che è acquisito, si rimette sotto gli occhi l'essenziale, ci si esercita, ci si mette alla prova. *(Una lezione · Da due a tre lezioni)*
- **Allenarsi** — Un richiamo per riattivare, esercizi prima con proposte e poi senza, una verifica finale: la difficoltà cresce, la lezione non viene rifatta. *(Una lezione · Da due a tre lezioni · Un'unità completa)*
- **Valutare** — Le attese, un allenamento nel formato della prova, poi la verifica: un solo tentativo, a tempo, senza correzione visibile; alla fine solo il voto. *(Una lezione)*
- **Recuperare dopo la verifica** — Si riparte dagli errori constatati: si nominano, si rispiega il punto preciso, si rifà, si ricontrolla. *(Una lezione · Da due a tre lezioni · A distanza · Entrambe)*
- **Rituale breve** — Dieci minuti, sempre la stessa forma. È la ripetizione che fissa, non la varietà. *(Una lezione)*
- **Scoprire un concetto** — Una situazione che interroga, documenti da esplorare, poi la sintesi, e solo dopo l'applicazione. *(Da due a tre lezioni · Un'unità completa)*
- **Classe capovolta** — Il video e la sua verifica a casa, il compito che non si può fare da soli in classe, il bilancio dopo. *(Una lezione · Da due a tre lezioni · Entrambe)*
- **Studiare un'opera** — Entrare nel testo o nell'immagine, individuare, collocare, interpretare, e poi produrre la propria lettura. *(Da due a tre lezioni · Un'unità completa)*
- **Condurre un'indagine** — Una domanda, un'ipotesi, dei dati, una conclusione: il metodo scientifico, nell'ordine. *(Da due a tre lezioni · Un'unità completa · In classe · Entrambe)*
- **Analizzare una fonte** — Da dove viene l'informazione, chi la produce, che cosa omette. Attrezzare lo sguardo prima di giudicare. *(Una lezione · Da due a tre lezioni)*
- **Dibattito argomentato** — Un voto per dire da dove si parte, fonti per informarsi, un forum per discutere, un testo per concludere. *(Da due a tre lezioni · Un'unità completa)*
- **Differenziare fin dall’inizio** — Un test iniziale apre a ogni alunno un cammino adatto al suo risultato; tutti si ritrovano per un bilancio comune. *(Una lezione · Da due a tre lezioni · Cammini in base ai risultati)*
- **Recuperare strada facendo** — Si scopre, si fa il punto con un quiz: in base al punteggio si ripassa o si va oltre, poi si mette in pratica insieme. *(Una lezione · Da due a tre lezioni · Cammini in base ai risultati)*
- **Sequenza di lingua straniera** — Prima il lessico, poi la comprensione, la produzione per ultima. *(Da due a tre lezioni)*
- **Preparare un intervento orale** — Che cosa si dirà, in quale ordine, e come ci si allena a dirlo. *(Una lezione · Da due a tre lezioni · In classe · Entrambe)*
- **Imparare a imparare** — Ciò che aiuta davvero a ricordare, provato sull’argomento del corso: mettersi alla prova, distanziare, spiegare. Poi ognuno pianifica i propri ripassi. *(Una lezione · Da due a tre lezioni)*
- **Formarsi in autonomia** — Nessuno dietro allo schermo: il percorso deve bastare a sé stesso, dall'indice alla verifica finale. *(Da due a tre lezioni · Un'unità completa · A distanza)*
- **Formazione mista in tre tempi** — La preparazione a distanza, l'incontro in presenza, poi la messa in pratica e il ritorno di esperienza. Il formato dei percorsi di formazione. *(Un'unità completa · Entrambe)*
- **Lavoro per progetti** — Una commessa con i suoi criteri, documentazione, lavoro di squadra, una produzione rivista tra pari e poi migliorata. *(Un'unità completa · In classe · Entrambe)*
- **Lavoro di gruppo** — Formare le squadre, raccogliere le idee, scrivere insieme, rileggersi tra pari con una griglia. *(Da due a tre lezioni · Un'unità completa)*
- **Gioco di fuga** — Una missione, indizi, enigmi di difficoltà crescente, un codice finale e il debriefing. *(Una lezione · Da due a tre lezioni · In classe · Entrambe)*
- **Struttura libera** — Nessuno svolgimento imposto: componi tu le tappe e Caramel riempie ciò che ci metti. *(Una lezione · Da due a tre lezioni · Un'unità completa)*
<!-- /parcours-trames -->

<!-- parcours-chemins -->
### Cammini in base ai risultati

Nell’impostazione, **Cammini in base ai risultati** fa svolgere un test ai tuoi allievi: in base al voto al primo tentativo, ognuno segue uno dei cammini previsti, da 2 a 4 — **Riprendere le basi**, **Rinforzare**, **Consolidare**, **Approfondire** — e poi tutti si ritrovano in una fase comune. Ogni allievo vede solo il proprio cammino. Due modelli sono pensati per questo: **Differenziare fin dall’inizio** e **Recuperare strada facendo**.

- In **Piano**, la barra dei punteggi mostra quale cammino si apre per ogni numero di risposte corrette; i pulsanti **−** e **+** anticipano o posticipano di una risposta corretta l’inizio di un cammino. **Aggiungi un cammino**, **Rimuovi un cammino** e **Un solo cammino per tutti** cambiano la diramazione.
- Il test che orienta è un **Quiz a scelta multipla**, un **Quiz Vero/Falso** o un **Test**, posto alla fine della fase che precede i cammini. Ogni domanda vale un punto e il test non propone di riprovare.
- **Visualizza come alunno** mostra la pagina del corso come la vedrà l’allievo — prima del test, durante il suo cammino, alla fine — per il punteggio che scegli.
- Per riorientare un allievo, modifica il suo voto al test nel registro del valutatore della piattaforma.

Importa un percorso con cammini in un corso **vuoto**: Moodle sistema le sezioni del file in quelle del corso, e le tue sezioni esistenti riceverebbero le restrizioni dei cammini. Ora tutti i percorsi terminano con una sezione **Fine del percorso**, e la durata stimata compare sotto ogni attività.
<!-- /parcours-chemins -->
<!-- /parcours-complet -->
