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
version: 1.2.0
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
  **«Scegli un file»**) in formato **PDF, DOCX, PPTX, ODT, ODP,
  PNG, JPEG**. Puoi anche rilasciare un **file audio** (MP3, M4A, WAV…) o un **video** (MP4, MOV…): viene quindi trascritta automaticamente solo la traccia audio (tramite Albert, il servizio sovrano della DINUM; vedi riservatezza più sotto). La zona di rilascio mostra **«Trascina un documento
  qui (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)»** con il separatore
  **«o»**.
- **Importare una pagina web**: incolla il suo link (`https://…`) nel
  campo sotto l'area di rilascio, poi clicca su **«Aggiungi»**. Il
  testo della pagina viene recuperato automaticamente.

L'estrazione del testo dei **documenti e delle immagini** avviene
**interamente in locale** nel tuo browser (nessun dato inviato).
**Due eccezioni transitano dai nostri server (ospitati in Francia):**
la **trascrizione audio** e l'**import di una pagina web** (il link che
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
- **Testo a buchi complesso** ★ — feedback specifici per errore.
- **Diagramma** — a torta o a barre per visualizzare dati.
- **Presentazione del corso** — diapositive interattive con esercizi integrati.
- **Libro interattivo** — libro multi-capitolo (testi, tabelle, immagini, esercizi) con indice e riepilogo.
- **Video interattivo** — domande (scelta multipla, vero/falso, riempimento) nei momenti chiave di un video, con riepilogo finale. Richiede un URL del video (Tubes di Apps Éducation, PodEduc o YouTube); Caramelia lo chiede prima di generare.
- **Immagine interattiva** — punti cliccabili su un'immagine che alleghi. Caramel individua automaticamente le zone chiave dell'immagine in base al tuo contesto (disciplina, livello, tema) e posiziona i punti, poi redige il contenuto di ciascun punto. In seguito, nell'editor, puoi aggiungere a mano testo, un'immagine, un suono o un video in un punto, e scegliere il colore e il tipo di marcatore (numeri, icona). Chiede di allegare un file immagine (PNG, JPEG, WebP, e perfino HEIC/foto iPhone o TIFF); Caramel lo analizza fin dal caricamento. Esportabile anche in documento (DOCX, ODT, PDF) con pastiglie numerate.
- **Trova la zona (Find the Hotspot)** — una domanda a cui si risponde cliccando direttamente su un'immagine che alleghi: Caramel individua le zone dell'immagine, sceglie LA zona corretta secondo il tuo contesto e redige la consegna e i feedback (le altre zone fungono da distrattori; il punteggio si decide al primo clic). Come per l'Immagine interattiva, occorre allegare un file immagine, analizzato appena caricato. Nell'editor le zone si spostano direttamente sull'immagine (verde = corretta, rosso = distrattore). Esportabile anche come documento (DOCX, ODT, PDF) con scheda studente e correzione.
- **Trova le zone (Find Multiple Hotspots)** — una caccia alle zone su un'immagine che alleghi: lo studente deve cliccare su TUTTE le zone corrette (le verdure, gli errori, i rischi…). Caramel sceglie le zone corrette secondo il tuo contesto, dà un nome a ciò che si cerca e redige consegna e feedback. Stesso flusso dell'Immagine interattiva (file immagine analizzato appena caricato, zone modificabili sull'immagine). Esportabile anche come documento (DOCX, ODT, PDF).

### Attività Éléa / Magistère

- **Test (XML / GIFT)** — banca di domande variate (scelta multipla, abbinamento…)
  da importare in un test Éléa/Magistère.
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

L'applicazione Caramel si basa, esclusivamente durante la generazione con un clic, su modelli di IA gestiti da ILaaS, una federazione di infrastrutture di IA condivise. Le richieste vengono instradate tramite un workflow n8n ospitato dall'Incubateur, quindi trasmesse a ILaaS per l'esecuzione su server affidabili ospitati in data center certificati dell'Istruzione Superiore e della Ricerca francese (ESR). Caramel non esegue i modelli e non elabora né archivia dati per proprio conto; i dati vengono utilizzati esclusivamente per eseguire la richiesta e non vengono inviati a IA di consumo. I modelli attualmente disponibili includono Mistral-Small-3.2 (24 miliardi di parametri), Qwen 3.6 (35 miliardi di parametri) e GPT-OSS (120 miliardi di parametri). Le eventuali modalità di hosting, registrazione e conservazione effettuate da ILaaS sono regolate dalla loro politica di riservatezza e dalle loro condizioni di servizio, alle quali è opportuno fare riferimento.

#### Trattamento delle richieste degli utenti tramite n8n e l'Incubateur del Ministero dell'Istruzione nazionale

Il nostro sito utilizza una soluzione tecnica sviluppata con n8n, uno strumento open source ospitato dall'Incubateur del Ministero dell'Istruzione nazionale francese. Tramite un workflow automatizzato, questo servizio trasforma le richieste degli utenti in dati strutturati (formato JSON) per interagire con un'intelligenza artificiale della DINUM, quindi sovrana. Nessuna informazione sensibile viene esposta o trasmessa senza crittografia, garantendo così la riservatezza e la sicurezza degli scambi.

#### Accessibilità

L'applicazione è progettata per essere compatibile con l'uso su computer, inclusi i modi scuro/chiaro, la navigazione da tastiera e il contrasto elevato a seconda dei temi. È in corso un miglioramento continuo dell'accessibilità, in linea con le raccomandazioni del RGAA.

### Collegamenti utili

- **Licenza**: GNU GPL v3.0 o successiva — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
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
