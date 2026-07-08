<!--
Wissensbasis von Caramelia (pädagogische Assistentin von Caramel).
Diese Datei ist REFERENZDOKUMENTATION, kein System-Prompt.
Es dürfen keine Anweisungen für das LLM hinzugefügt werden.

BEARBEITUNGSREGEL: Alle unten erwähnten Beschriftungen (Schaltflächen,
Reiter, Felder, Abschnitte) müssen GENAU dem in Caramel sichtbaren Text
entsprechen. Einzige Quelle: js/locales/de.json + index.html.
Änderungen erfolgen per PR.
-->
---
version: 1.2.0
lang: de
audience: Lehrkräfte
---

# Caramel-Tutorial

Caramel ist ein Open-Source-Webtool, das Lehrkräften hilft,
interaktive pädagogische Aktivitäten (H5P, Éléa, Magistère, Moodle)
mithilfe von KI zu erstellen. Die Anwendung läuft zu 100 % im Browser:
Es werden keine pädagogischen Daten an Drittserver gesendet.

## Beschreiben Sie Ihren Bedarf (oben auf der Seite)

Oben auf der Seite stehen zwei Reiter zur Verfügung, mit denen Sie
auswählen können, wie Sie Ihren Bedarf beschreiben:

- **Schnellmodus** — minimales Formular, zwei Felder.
- **Erweiterter Modus** — dieselben Felder plus zusätzliche Optionen,
  insbesondere die Möglichkeit, Dokumente beizufügen.

### Schnellmodus

Nur zwei Felder:

- **„Wer sind Sie? (z.B. Lehrer:in, Trainer:in...)"**
- **„Was möchten Sie behandeln? (z.B. Die Französische Revolution...)"**

### Erweiterter Modus

Dieselben Felder wie im Schnellmodus, plus:

- **„Niveau (z.B. 10. Klasse)"**
- **„Anzahl der Fragen/Elemente (z.B. 5)"** — je nach Aktivität
  entspricht dies der Anzahl der Fragen, der Daten auf einem Zeitstrahl,
  der Wörter in einem Glossar usw.
- Ein freies Feld für **zusätzliche Informationen**
  (spezifische Anweisungen, Einschränkungen oder andere
  relevante Details).

### Dokumente beifügen (optional) — nur im Erweiterten Modus

Dieser Abschnitt mit dem Titel **„Dokumente beifügen (optional)"**
erscheint nur, wenn der Reiter **Erweiterter Modus** ausgewählt ist.
Er ermöglicht es, die Generierung auf einem von Ihnen bereitgestellten
Inhalt aufzubauen.

Drei Möglichkeiten:

- **Einen Text kopieren und einfügen** direkt in das Eingabefeld.
- **Ein Dokument per Drag-and-Drop ablegen** (oder auf
  **„Datei auswählen"** klicken) im Format **PDF, DOCX, PPTX, ODT,
  ODP, PNG, JPEG**. Sie können auch eine **Audiodatei** (MP3, M4A, WAV…) oder ein **Video** (MP4, MOV…) ablegen: Dann wird nur die Tonspur automatisch transkribiert (durch Albert, den souveränen Dienst der DINUM; siehe Datenschutz unten). Die Ablagezone trägt die Beschriftung
  **„Dokument hierher ziehen (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)"**
  mit dem Trenner **„oder"**.
- **Eine Webseite importieren**: ihren Link (`https://…`) in das
  Feld unter dem Ablagebereich einfügen, dann auf **„Hinzufügen"**
  klicken. Der Text der Seite wird automatisch abgerufen.

Die Textextraktion aus **Dokumenten und Bildern** erfolgt
**vollständig lokal** in Ihrem Browser (es werden keine Daten gesendet).
**Zwei Ausnahmen laufen über unsere Server (gehostet in Frankreich):**
die **Audiotranskription** und der **Import einer Webseite** (der von
Ihnen eingegebene Link wird dorthin gesendet, um den Text zu
extrahieren; Links zu PDF, Videos oder kostenpflichtigen Seiten werden
nicht unterstützt).

Wenn Sie diesen Bereich leer lassen, stützt sich die KI nur auf ihr
Allgemeinwissen, um die Aktivität zu generieren.

## Aktivitätstyp auswählen

Sobald die Beschreibung erfolgt ist, werden die Aktivitätskacheln
anklickbar. Klicken Sie auf diejenige, die Ihrem pädagogischen
Ziel entspricht. Filter über den Kacheln ermöglichen die Eingrenzung
der Anzeige: **Alle**, **Quiz & Tests**, **Textbearbeitung**,
**Lernen & Entdecken**, sowie die Plattformen **H5P**, **Éléa**,
**Moodle**.

### H5P-Aktivitäten

Aktivitäten im H5P-Format. Die mit einem Stern (★) markierten enthalten
detailliertes Feedback in 4 Punktebereichen.

- **Zeitstrahl** — interaktive Ereignisabfolge.
- **Lernkarten (Flashcards)** — Vorder- und Rückseite zum Auswendiglernen.
- **Multiple-Choice-Quiz (Question Set)** ★ — Quiz mit Multiple-Choice-Fragen.
- **Wahr/Falsch-Quiz (Question Set)** ★ — Wahr-oder-Falsch-Quiz.
- **Gemischtes Quiz (Question Set)** ★ — gemischte Fragen (MCQ, Drag and Drop…).
- **Glossar** — aufklappbares Akkordeon oder FAQ.
- **Kreuzworträtsel** ★ — aus Definitionen generiertes Gitter.
- **Aufsatz** ★ — Aufsatzthema mit Stichwortbewertung.
- **Zusammenfassung** ★ — Schüler:innen rekonstruieren eine Zusammenfassung durch Auswahl der richtigen Sätze.
- **Wörter ziehen** ★ — Text mit fehlenden Wörtern zum Ziehen.
- **Drag and Drop** ★ — Etiketten in eine Zone ziehen.
- **Lückentext** ★ — Schüler:innen tippen die fehlenden Wörter ein.
- **Wörter markieren** ★ — Schüler:innen markieren bestimmte Wörter in einem Text.
- **Wahr/Falsch** — einfache binäre Fragen.
- **Multiple Choice** ★ — MCQ mit einer oder mehreren richtigen Antworten.
- **Wortsuchrätsel** — Buchstabengitter mit zu findenden Wörtern.
- **Absätze ordnen** ★ — Absätze in die richtige Reihenfolge bringen.
- **Einfachauswahl-Serie** ★ — Fragen mit nur einer richtigen Antwort.
- **Dialogkarten** — Vorder- und Rückseite mit Text und Audio.
- **Komplexer Lückentext** ★ — fehlerspezifisches Feedback.
- **Diagramm** — Kreis- oder Balkendiagramm zur Visualisierung von Daten.
- **Kurspräsentation** — interaktive Diashow mit eingebetteten Übungen.
- **Interaktives Buch** — mehrkapiteliges Buch (Texte, Tabellen, Bilder, Übungen) mit Inhaltsverzeichnis und Zusammenfassung.
- **Interaktives Video** — Fragen (Multiple-Choice, Wahr/Falsch, Lückentext) an Schlüsselstellen eines Videos, mit Abschlusszusammenfassung. Benötigt eine Video-URL (Apps-Éducation-Tubes, PodEduc oder YouTube); Caramelia fragt vor der Generierung danach.
- **Interaktives Bild** — anklickbare Punkte auf einem von Ihnen beigefügten Bild. Caramel erkennt automatisch die Schlüsselbereiche des Bildes je nach Ihrem Kontext (Fachgebiet, Niveau, Thema), platziert die Punkte und verfasst den Inhalt jedes Punktes. Anschließend können Sie im Editor von Hand Text, ein Bild, einen Ton oder ein Video in einen Punkt einfügen sowie die Farbe und die Art der Markierung (Nummern, Symbol) wählen. Fordert das Beifügen einer Bilddatei an (PNG, JPEG, WebP und sogar HEIC/iPhone-Foto oder TIFF); Caramel analysiert es bereits beim Ablegen. Auch als Dokument exportierbar (DOCX, ODT, PDF) mit nummerierten Markierungen.
- **Den Bereich finden (Find the Hotspot)** — eine Frage, die direkt durch Klicken auf ein von Ihnen angehängtes Bild beantwortet wird: Caramel erkennt die Bereiche des Bildes, wählt DEN richtigen Bereich gemäß Ihrem Kontext und verfasst Aufgabenstellung und Rückmeldungen (die anderen Bereiche dienen als Ablenker; die Punktzahl entscheidet sich beim ersten Klick). Wie beim Interaktiven Bild wird eine Bilddatei angehängt und sofort analysiert. Im Editor lassen sich die Bereiche direkt auf dem Bild verschieben (grün = richtig, rot = Ablenker). Auch als Dokument exportierbar (DOCX, ODT, PDF) mit Schülerblatt und Korrektur.
- **Die Bereiche finden (Find Multiple Hotspots)** — eine Bereichssuche auf einem von Ihnen angehängten Bild: Die Lernenden müssen auf ALLE richtigen Bereiche klicken (Gemüse, Fehler, Gefahren…). Caramel wählt die richtigen Bereiche gemäß Ihrem Kontext, benennt das Gesuchte und verfasst Aufgabenstellung und Rückmeldungen. Gleicher Ablauf wie beim Interaktiven Bild (Bilddatei wird sofort analysiert, Bereiche direkt auf dem Bild bearbeitbar). Auch als Dokument exportierbar (DOCX, ODT, PDF).

### Éléa- / Magistère-Aktivitäten

- **Test (XML / GIFT)** — vielfältige Fragenbank (MCQ, Zuordnung…)
  zum Import in einen Éléa/Magistère-Test.
- **MCQ (MBZ)** — einfache und schnelle MCQ-Aktivität.
- **Zuordnung (MBZ)** — Zuordnungsspiel zwischen Elementpaaren.
- **Millionär (MBZ)** — spielerisches Quiz mit steigendem Schwierigkeitsgrad.
- **Glossar (XML)** — Importdatei für ein Éléa/Magistère-Glossar.
- **Seite (MBZ / HTML)** — strukturierte und formatierte Kursseite.
- **Buch (MBZ)** — mehrkapitliges Buch mit Navigation.
- **Aufgabe (MBZ)** — Aufgabe mit kriterienbasiertem Bewertungsraster.

## Inhalt generieren und verfeinern

Nach dem Klick auf eine Kachel öffnet sich ein Fenster. Hier
interagieren Sie mit der KI. Oben in diesem Fenster ermöglicht ein
Umschalter **Einfach / Geführt** die Wahl des Anzeigemodus.

### Einfache Anzeige — Schaltfläche „Mit einem Klick generieren"

Der schnelle Weg. Klicken Sie auf **„Mit einem Klick generieren"**:
Die KI erzeugt den Inhalt und platziert ihn direkt im Ergebnisbereich
rechts. Mit dem kleinen Pfeil rechts neben der Schaltfläche können Sie
zwischen verschiedenen KI-Modellen wählen (schnell, leistungsstark…).

### Geführte Anzeige — eine externe KI verwenden

Für maximale Kontrolle. Der Prompt erscheint links.

1. Bearbeiten Sie den Prompt nach Belieben.
2. Klicken Sie auf **„Prompt kopieren"** und öffnen Sie eine externe
   KI in einem neuen Tab.
3. Fügen Sie den Prompt in die KI ein, kopieren Sie deren Antwort
   und fügen Sie sie im Ergebnisbereich rechts in Caramel ein.

Zwei nützliche Symbole oben im Prompt-Bereich: **„Vollbild"** für mehr
Komfort und **„Sperren"** (das zu **„Entsperren"** wird) zum Schutz
des Prompts.

## Vorschau, Bearbeitung und Download

Sobald der Inhalt generiert ist, erscheint das Fenster
**„Ihre Süßigkeit ist fertig!"** mit zwei Auswahlmöglichkeiten:
**„Ansehen und bearbeiten"** oder **„Weiter"** (um eine weitere
Aktivität zu generieren).

### Vorschau

Ein integrierter Simulator testet die Aktivität wie ein:e Schüler:in
(Klicken, Ziehen, Tippen…). Für Éléa/Magistère-Inhalte zeigt ein
Simulator die tatsächliche Darstellung.

### Bearbeiten (Stift-Symbol, Schaltfläche **„Bearbeiten"**)

Der visuelle Editor passt sich automatisch an den Aktivitätstyp an:
Liste der Elemente links, Details rechts.

- **Rich-Text-Leiste** für kompatible Felder: fett, kursiv,
  unterstrichen, durchgestrichen, hochgestellt, tiefgestellt, Farbe, Listen, Link.
- Schaltfläche `</>`, um in den **Quellcode-Modus** zu wechseln.
- **Mathematische Formeln** über die Schaltfläche **√x**: 6 Kategorien
  (Brüche, Wurzeln, Potenzen, griechische Buchstaben, Operatoren,
  Strukturen), Echtzeit-Vorschau, Doppelklick zum Bearbeiten.
- **Zu findende Wörter** (Wörter ziehen, Wörter markieren,
  Lückentext): automatische gelbe Hervorhebung, Schaltflächen
  Markieren / Entfernen oder Sternchen `*wort*`.
- **Lückentext (Cloze)** im Test: drei Lückentypen
  (Multiple Choice, Kurzantwort, Zahlenwert), angezeigt
  als farbige Pillen (blau, gelb, grün).
- **Bilder**: Drag-and-Drop, automatische Größenanpassung
  (800×600), Alternativtext, Formate JPEG / PNG / WebP.

### Download

Die Schaltfläche **„Herunterladen"** bietet zwei Formatfamilien:

- **Interaktive Formate** (digital, für Éléa/Magistère):
  H5P, MBZ, XML.
- **Druckbare Formate** (analoge Versionen): DOCX, ODT, PDF.

## Generierte Datei in Éléa integrieren

> Hinweis: Die in Anführungszeichen gesetzten Beschriftungen unten bleiben
> auf Französisch, da sie genau der Éléa-Oberfläche entsprechen, die
> hauptsächlich im französischsprachigen Kontext verwendet wird.

### Eine H5P-Datei integrieren

- **Schnelle Methode**: in den Bearbeitungsmodus des Kurses wechseln,
  die `.h5p`-Datei direkt per Drag-and-Drop ablegen,
  « Ajouter une activité H5P » wählen und mit **DÉPOSER** bestätigen.
- **Empfohlene Methode**: « Ajouter une activité ou une ressource »
  → « Contenu interactif (H5P) » → Reiter « Téléverser » →
  Datei auswählen → **« Utiliser »** → speichern.

### Eine MBZ-Datei integrieren

1. Das Bearbeitungsmenü rechts öffnen (bei Bedarf auf den Pfeil klicken,
   um es auszuklappen).
2. Auf **« IMPORT/EXPORT »** → **« Importer un parcours »** klicken.
3. Die `.mbz`-Datei per Drag-and-Drop ablegen → **IMPORTER**.
4. **CONTINUER**.

### Eine XML-Datei integrieren (Fragenbank Test)

1. Reiter **« Plus »** → **« Banque de questions »**.
2. Menü **« Questions »** → **« Importer »**.
3. Format ankreuzen (XML Magistère empfohlen, oder GIFT).
4. Datei per Drag-and-Drop ablegen → **IMPORTATION** → **CONTINUER**.

### Eine XML-Datei für ein Glossar integrieren

1. Ein leeres Glossar im Kurs erstellen.
2. Auf **« IMPORTER DES ARTICLES »** klicken.
3. Die `.xml`-Datei per Drag-and-Drop ablegen → **ENVOYER** → **CONTINUER**.

### Eine HTML-Datei in eine Seiten-Aktivität integrieren

1. Die `.html`-Datei mit einem Texteditor öffnen, den gesamten Inhalt kopieren.
2. In Éléa eine **« Page »**-Aktivität hinzufügen.
3. Im Editor: **Outils → Code source**.
4. Den HTML-Code einfügen → speichern.

## Über Caramel

### Autoren

Wenn der Benutzer das Team kontaktieren möchte:

- **Gauthier REMANDE** — Lehrer für Sprachen und Geschichte (Berufsausbildung) — gauthier.remande@ac-nantes.fr
- **Emmanuel GAUNARD** — Mathematiklehrer und Beauftragter der DRANE — Académie de Grenoble — emmanuel.gaunard@ac-grenoble.fr

### Rechtliche Hinweise

#### Personenbezogene Daten

Es werden keine personenbezogenen Daten erfasst oder gespeichert. Es werden keine Tracking-Cookies verwendet.

#### Modelle der künstlichen Intelligenz

Die Anwendung Caramel verwendet, ausschließlich bei der Ein-Klick-Generierung, KI-Modelle, die von ILaaS betrieben werden, einem Verbund gemeinsamer KI-Infrastrukturen. Anfragen werden über einen n8n-Workflow geleitet, der vom Incubateur gehostet wird, und dann zur Ausführung an ILaaS übertragen, auf vertrauenswürdigen Servern in zertifizierten Rechenzentren des französischen Hochschul- und Forschungssektors (ESR). Caramel betreibt die Modelle nicht und verarbeitet oder speichert keine Daten in eigenem Namen; die Daten werden ausschließlich zur Ausführung der Anfrage verwendet und nicht an Verbraucher-KI-Dienste gesendet. Zu den derzeit verfügbaren Modellen gehören Mistral-Small-3.2 (24 Mrd. Parameter), Qwen 3.6 (35 Mrd. Parameter) und GPT-OSS (120 Mrd. Parameter). Etwaige Hosting-, Protokollierungs- oder Aufbewahrungspraktiken von ILaaS unterliegen deren eigener Datenschutzerklärung und Nutzungsbedingungen, die direkt einsehbar sind.

#### Verarbeitung der Benutzeranfragen über n8n und den Incubateur des französischen Bildungsministeriums

Unsere Website verwendet eine mit n8n entwickelte technische Lösung, einem Open-Source-Tool, das vom Incubateur des französischen Bildungsministeriums gehostet wird. Über einen automatisierten Workflow wandelt dieser Dienst die Benutzeranfragen in strukturierte Daten (JSON) um, um mit einer souveränen KI der DINUM zu interagieren. Keine sensiblen Informationen werden ohne Verschlüsselung offengelegt oder übertragen, was die Vertraulichkeit und Sicherheit des Austauschs gewährleistet.

#### Barrierefreiheit

Die Anwendung ist für die Nutzung am Computer konzipiert, einschließlich Hell-/Dunkelmodus, Tastaturnavigation und hohem Kontrast je nach Thema. Eine kontinuierliche Verbesserung der Barrierefreiheit ist im Gange, im Einklang mit den Empfehlungen des RGAA.

### Nützliche Links

- **Lizenz**: GNU GPL v3.0 oder höher — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
- **Fehler melden**: https://forge.apps.education.fr/caramel/caramel/-/issues
- **Quellcode**: https://forge.apps.education.fr/caramel/caramel
- **Changelog**: https://forge.apps.education.fr/caramel/caramel/-/blob/main/CHANGELOG

## Antwortrahmen von Caramelia

- Caramelia antwortet immer in der Sprache des Benutzers.
- Knappe, freundliche, pädagogische Antworten (1 bis 3 Absätze).
- Emojis sparsam (höchstens 1 oder 2).
- Wenn Caramelia eine Schaltfläche, einen Reiter, ein Feld oder
  einen Abschnitt der Website zitiert, verwendet sie **genau** die
  auf dem Bildschirm sichtbare Beschriftung, wie oben aufgeführt
  (zum Beispiel **„Erweiterter Modus"**, **„Dokumente beifügen
  (optional)"**, **„Mit einem Klick generieren"**). Sie erfindet
  keine Schrittnamen („Schritt 1"…) und keine internen technischen
  Begriffe („RAG-Option"…), die in der Oberfläche nicht vorkommen.
- Wenn der Benutzer eine Aktivität generieren möchte, schlägt Caramelia
  den am besten geeigneten Typ vor, generiert aber NIEMALS das JSON einer Aktivität.
- Bei jeder Integrationsfrage gibt Caramelia die obigen genauen
  Schritte an.
