const translations_de = {
  subtitle: "KI-gestützte Erstellung von Ressourcen und Aktivitäten für Moodle und Éléa",
  help_modal_title: "🚀 Umfassender Caramel-Leitfaden für Lehrkräfte",
  help_modal_content: `
    <p>Willkommen bei <strong>Caramel</strong>! Dieser Leitfaden führt dich Schritt für Schritt durch alles – auch wenn du gerade erst beginnst. Unser Ziel ist es, dir zu helfen, interaktive Lernaktivitäten einfach und effizient zu erstellen.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Beschreiben</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Wählen</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generieren</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Vorschau & Download</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Community</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> Unsere Philosophie: Du behältst die Kontrolle!</h4>
        <p>Mit Caramel ist KI eine Assistenz – aber du steuerst. Du hast in jeder Phase die Kontrolle:</p>
        <ul>
            <li><strong>Vorher:</strong> Du legst den pädagogischen Rahmen fest, indem du die Beschreibungsfelder ausfüllst.</li>
            <li><strong>Währenddessen:</strong> Nachdem die KI den Inhalt (den JSON-Code) erzeugt hat, kannst du ihn direkt im Editor anpassen.</li>
            <li><strong>Nachher:</strong> Auch nach dem Herunterladen kannst du die Datei in anderen Tools öffnen und bearbeiten.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Deinen Bedarf beschreiben: der Ausgangspunkt</h4>
        <p>Hier beginnt alles. Je klarer deine Beschreibung, desto passender das Ergebnis. Es gibt zwei Optionen:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Schnellmodus</span></h5>
            <p>Ideal für das Wesentliche. Fülle zwei Felder aus:</p>
            <ul>
                <li><strong>Wer bist du?</strong> Sei direkt. Kein ganzer Satz nötig. Beispiele: <em>Mathematiklehrer:in</em>, <em>Akademische:r Trainer:in</em>.</li>
                <li><strong>Was möchtest du behandeln?</strong> Der Kern deiner Anfrage. Sei so vollständig wie möglich. Nenne Thema, Niveau und Rahmenbedingungen. Beispiel: <em>Eine Einführung in Brüche für 6. Klasse, mit konkreten Beispielen wie das Teilen eines Kuchens.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Erweiterter Modus</span></h5>
            <p>Für strukturiertere Anfragen bietet dieser Modus präzise Felder:</p>
            <ul>
                <li><strong>Fach, Thema, Niveau:</strong> zur Kontextsetzung.</li>
                <li><strong>Zahl der Elemente:</strong> Sehr wichtig! Anzahl der Fragen, Daten auf einer Zeitleiste, Wörter im Glossar usw.</li>
                <li><strong>Zusätzliche Informationen:</strong> Platz für spezielle Anweisungen, Vorgaben oder weitere relevante Details.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Dokumentbetrachtung aktivieren</span><br>
            Mit dieser leistungsstarken Option kann die Generierung auf bereitgestellten Inhalten basieren. Du kannst entweder <strong>Text einfügen</strong> oder <strong>ein Dokument hochladen (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
            <br><strong><i class="fas fa-lock"></i> Datenschutz:</strong> Keine Sorge, die Verarbeitung deines Dokuments erfolgt <strong>vollständig lokal auf deinem Computer</strong>. Es werden keine Daten an das Internet gesendet.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Aktivitätstyp auswählen</h4>
        <p>Nachdem die Beschreibung steht, werden die Aktivitätskacheln freigeschaltet. Klicke auf die Kachel, die deinem Lernziel entspricht.</p>
        <details>
            <summary><strong>Hier klicken, um die verfügbaren Aktivitäten anzuzeigen</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Interaktive Aktivitäten im H5P-Format. Mit einem Stern <span class="feedback-star">*</span> markierte Aktivitäten enthalten standardmäßig detailliertes Feedback in 6 Bewertungsstufen.</p>
            <ul>
                <li><strong>Zeitleiste:</strong> Interaktive Zeitleiste zur Darstellung einer Ereignisfolge.</li>
                <li><strong>Merkkarten:</strong> Karten Vorder-/Rückseite zum Memorieren.</li>
                <li><strong>Quiz (Question Set) <span class="feedback-star">*</span>:</strong> Fragensammlung (Multiple Choice, Drag&Drop usw.).</li>
                <li><strong>Glossar:</strong> Glossar oder FAQ als aufklappbares Akkordeon.</li>
                <li><strong>Kreuzworträtsel <span class="feedback-star">*</span>:</strong> Kreuzworträtsel aus Definitionen erzeugen.</li>
                <li><strong>Schreiben <span class="feedback-star">*</span>:</strong> Schreibaufgabe mit automatischer Korrektur über Stichwörter.</li>
                <li><strong>Zusammenfassung <span class="feedback-star">*</span>:</strong> Lernende setzen einen korrekten Abstract aus Sätzen zusammen.</li>
                <li><strong>Wörter ziehen <span class="feedback-star">*</span>:</strong> Text, in den fehlende Wörter gezogen werden.</li>
                <li><strong>Lückentext <span class="feedback-star">*</span>:</strong> Fehlende Wörter per Tastatur eingeben.</li>
                <li><strong>Wörter hervorheben <span class="feedback-star">*</span>:</strong> Bestimmte Wörter im Text markieren.</li>
                <li><strong>Wahr/Falsch:</strong> Einfache binäre Fragen.</li>
                <li><strong>Multiple Choice <span class="feedback-star">*</span>:</strong> MC-Fragen mit einer/mehreren richtigen Antworten.</li>
                <li><strong>Wortsuchrätsel:</strong> Buchstabengitter mit versteckten Wörtern.</li>
                <li><strong>Absätze ordnen <span class="feedback-star">*</span>:</strong> Absätze in die richtige Reihenfolge bringen.</li>
                <li><strong>Einfachauswahl-Serie <span class="feedback-star">*</span>:</strong> Serie von Fragen mit genau einer richtigen Antwort.</li>
                <li><strong>Dialogkarten:</strong> Interaktive Karten Vorder-/Rückseite mit Text und Audio.</li>
                <li><strong>Komplexer Lückentext <span class="feedback-star">*</span>:</strong> Erweiterter Cloze mit spezifischem Feedback.</li>
                <li><strong>Diagramm:</strong> Kreis- oder Balkendiagramm zur Datenvisualisierung.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Test (XML / GIFT):</strong> Fragensammlung (MC, Zuordnung usw.) für Moodle-Tests.</li>
                <li><strong>MC (MBZ):</strong> Einfache und schnelle Multiple-Choice-Aktivität.</li>
                <li><strong>Zuordnung (MBZ):</strong> Zuordnungsspiel mit Paaren.</li>
                <li><strong>Millionär (MBZ):</strong> Quizspiel mit ansteigender Schwierigkeit.</li>
                <li><strong>Glossar (XML):</strong> Datei zum Import einer Definitionsliste ins Moodle-Glossar.</li>
                <li><strong>Seite (MBZ / HTML):</strong> Strukturierte, visuell formatierte Kursseite für Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Inhalte generieren und verfeinern</h4>
        <p>Nach dem Klick auf eine Kachel öffnet sich ein Fenster. Hier interagierst du mit der KI.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Option A: Einfache Ansicht - Mit einem Klick generieren</h5>
            <p>Der Schnellweg. Klicke auf <button class="help-btn-example-llm">Mit einem Klick generieren</button>, damit die KI den Inhalt erstellt und direkt rechts im Ergebnisbereich platziert. Über den kleinen Pfeil am rechten Rand des Buttons kannst du zwischen KI-Modellen (schnell, leistungsstark ...) wählen.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Option B: Geführte Ansicht - Externe KI verwenden</h5>
            <p>Für maximale Kontrolle. Der Prompt (Anweisung für die KI) erscheint links.</p>
            <ol>
                <li>Bearbeite den Prompt bei Bedarf.</li>
                <li>Verwenden Sie die Schaltfläche <strong>Prompt kopieren</strong> und öffnen Sie eine öffentlich zugängliche KI Ihrer Wahl in einem neuen Tab.</li>
                <li>Füge den Prompt in der KI ein, übernimm die Antwort und füge sie rechts im Ergebnisbereich in Caramel ein.</li>
            </ol>
            <p>Nützliche Icons helfen dir: <span class="help-badge-icon"><i class="fas fa-expand"></i> Vollbild</span> für mehr Komfort und <span class="help-badge-icon"><i class="fas fa-lock"></i> Sperren</span> zum Schutz des Prompts.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Vorschau und Download</h4>
        <p>Sobald der Inhalt generiert wurde, können Sie ihn in verschiedenen Formaten ansehen, testen und herunterladen.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> Vorschau und Test</summary>
            <p>Nehmen Sie sich Zeit, um Ihre Aktivität im Vorschaufenster zu überprüfen:</p>
            <ul>
                <li><strong>Scrollen</strong> Sie durch den Inhalt, um alles Korrektur zu lesen.</li>
                <li><strong>Testen</strong> Sie die Aktivität als Schüler (klicken, ziehen, schreiben...).</li>
                <li>Für <strong>Éléa/Magistère/Moodle</strong> Inhalte zeigt Ihnen ein Simulator die reale Darstellung.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Vorschaufenster" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Testen Sie die Aktivität direkt im Simulator.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Herunterladen (Formate & Exporte)</summary>
            <p>Sie haben mehrere Möglichkeiten, Ihre Arbeit abzurufen:</p>
            <ul>
                <li><strong>Interaktives Format (Hauptschaltfläche):</strong> Zum Abrufen der digitalen Datei (z. B. .h5p, .mbz) für Ihre Plattform.</li>
                <li><strong>Andere Formate (Dropdown-Menü):</strong> Klicken Sie auf den Pfeil, um als <strong>PDF, DOCX oder ODT</strong> herunterzuladen (nützlich zum Drucken oder Archivieren).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Exportmenü" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Öffnen Sie das Menü, um auf PDF-, DOCX-Exporte zuzugreifen...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> In Éléa/Magistère integrieren</h5>
        <p>Sobald die Datei heruntergeladen ist, erfahren Sie hier, wie Sie sie zu Ihrem Kurs hinzufügen:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (H5P-Aktivitäten)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Einfache Methode:</strong> Aktiviere den Bearbeitungsmodus in deinem Kurs und ziehe die .h5p-Datei direkt in den gewünschten Abschnitt. Wähle anschließend "Ajouter une activité H5P" und schließe mit dem Button "DÉPOSER" ab.
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="Schnellansicht zum Hinzufügen einer H5P-Aktivität" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>H5P-Aktivität hinzufügen und auf DÉPOSER klicken.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Empfohlene Methode (für Designer:innen):</strong> Klicke auf "Aktivität oder Material anlegen", wähle "Interaktiver Inhalt (H5P)" und öffne im Feld "Editor" den Tab "Téléverser", um mit "Téléverser un fichier" fortzufahren. Beende mit "Utiliser", ergänze alle nötigen Angaben und speichere. So wird die Aktivität beim Teilen deines Kurses sicher übernommen.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Seite, Millionär, Zuordnung, MC)</summary>
                <div class="import-content">
                    <p>Dieses Format importiert eine vollständige Aktivität in deinen Kurs.</p>
                    <ol>
                        <li>
                            <p>Öffne das Bearbeitungsmenü auf der rechten Bildschirmseite. Ist es eingeklappt, nutze den kleinen Pfeil, um es einzublenden.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Bearbeitungsmenü in der rechten Spalte geöffnet" style="width:75%;height:auto;">
                                    <figcaption><em>Bearbeitungsmenü geöffnet.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Pfeil zum Aufklappen des Bearbeitungspanels" style="width:75%;height:auto;">
                                    <figcaption><em>Bei Bedarf das Panel aufklappen.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Klicke auf "IMPORT/EXPORT" und dann im Untermenü auf "Importer un parcours".</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="IMPORT/EXPORT-Schaltfläche in Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>"Importer un parcours" auswählen.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Ziehe deine .mbz-Datei in den Importbereich und klicke auf "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Bereich zum Ablegen der MBZ-Datei" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Datei ablegen und mit IMPORTER bestätigen.</em></figcaption>
                            </figure>
                        </li>
                        <li>Schließe den Vorgang mit "CONTINUER" im letzten Schritt ab: Die Aktivität liegt nun in deinem Kurs.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Glossar-Aktivität)</summary>
                <div class="import-content">
                    <p>Dieses Format ermöglicht es Ihnen, eine Definitionsliste in ein Éléa/Moodle-Glossar zu importieren.</p>
                    <ol>
                        <li>
                            <p>Erstellen Sie eine leere Glossar-Aktivität in Ihrem Kurs und öffnen Sie sie.</p>
                        </li>
                        <li>
                            <p>Sobald Sie im Glossar sind, klicken Sie auf die Schaltfläche "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="IMPORTER DES ARTICLES-Schaltfläche im Glossar" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Klicken Sie auf IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Ziehen Sie Ihre .xml-Datei per Drag & Drop in den Importbereich und klicken Sie auf die Schaltfläche "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Drop-Zone für die Glossar-XML-Datei" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Legen Sie die Datei ab und bestätigen Sie mit ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Ihre Einträge wurden erkannt. Schließen Sie ab, indem Sie auf die Schaltfläche "CONTINUER" klicken.</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Bestätigung erkannter Einträge" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Klicken Sie auf CONTINUER, um den Import abzuschließen.</em></figcaption>
                            </figure>
                        </li>
                        <li>Der Import ist abgeschlossen. Ihre Definitionen sind nun im Glossar verfügbar.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> und <span class="help-badge-file">.GIFT</span> (Test-Aktivität)</summary>
                <div class="import-content">
                    <p>Diese Formate importieren Fragen in die „Fragensammlung".</p>
                    <ol>
                        <li>
                            <p>Gehen Sie in Ihrem Éléa-Kurs zum Reiter „Mehr" und klicken Sie auf „Fragensammlung".</p>
                        </li>
                        <li>
                            <p>Wählen Sie im Dropdown-Menü, wo „Fragen" angezeigt wird, „Importieren".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Auswahl der Schaltfläche Importieren in der Fragensammlung" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Wählen Sie Importieren im Dropdown-Menü.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Wählen Sie das Format entsprechend Ihrer Datei:</p>
                            <ul>
                                <li><strong>Moodle XML-Format</strong> (empfohlen): vollständiges Format, das alle Fragetypen unterstützt.</li>
                                <li><strong>GIFT-Format</strong>: einfachere Alternative, aber begrenzt in Fragetypen.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Auswahl zwischen Moodle XML-Format und GIFT-Format" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Wählen Sie das passende Format für Ihre Datei.</em></figcaption>
                            </figure>
                        </li>
                        <li>Ziehen Sie Ihre Datei per Drag & Drop in den Upload-Bereich.</li>
                        <li>Klicken Sie auf die Schaltfläche „IMPORTATION". Der Bildschirm zeigt dann die hinzugefügten Fragen an (z. B.: 10 Fragen wurden hinzugefügt).</li>
                        <li>Beenden Sie den Vorgang, indem Sie unten auf der Seite auf „CONTINUER" klicken.</li>
                        <li>Die Fragen sind nun bereit, einer Test-Aktivität hinzugefügt zu werden. Konsultieren Sie das <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">Éléa-Tutorial</a>, um eine Test-Aktivität zu erstellen und Fragen aus der Sammlung zu laden.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternative für Aktivität „Seite“)</summary>
                <div class="import-content">
                    <p>Für manuelle Inhaltskontrolle.</p>
                    <ol>
                        <li>.html-Datei mit einem Texteditor (z. B. Notepad) öffnen und den gesamten Inhalt kopieren.</li>
                        <li>In Éléa eine „Seite“ hinzufügen.</li>
                        <li>Im Seiten-Editor auf das Icon zum Umschalten in den HTML-Modus klicken (oft dargestellt durch "&lt;&gt;").</li>
                        <li>Den kopierten Inhalt einfügen und speichern.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Community & Support</h4>
        <p>Caramel ist ein lebendiges Projekt – dein Feedback ist wertvoll!</p>
        <ul>
            <li><strong>Diskutieren & Fragen:</strong> Tritt dem <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a>-Raum bei, um dich mit der Community auszutauschen.</li>
            <li><strong>Bug melden:</strong> Problem entdeckt? Erstelle ein <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">Issue</a>. Hänge wenn möglich die JSON-Datei an, die den Fehler verursacht hat – das hilft enorm.</li>
            <li><strong>Projekt unterstützen:</strong> Wenn dir das Tool gefällt, gib uns gern einen Stern auf der <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">Forge-Seite</a>. Das ist unsere beste Belohnung!</li>
        </ul>
    </div>
  `,

  // ============================================================================
  // HAUPT-INTERFACE
  // ============================================================================
  language: "Sprache",
  tutorial: "Anleitung",
  notifications: "Benachrichtigungen",
  fast_mode: "Schnellmodus",
  guided_mode: "Erweiterter Modus",
  who_are_you: "Wer sind Sie? (z.B. Lehrer:in, Trainer:in...)",
  what_to_address: "Was möchten Sie behandeln? (z.B. Die Französische Revolution...)",
  level: "Niveau (z.B. 10. Klasse)",
  number_of_elements: "Anzahl der Fragen/Elemente (z.B. 5)",

  // ============================================================================
  // RAG/OCR
  // ============================================================================
  rag_title: "Dokumente beifügen (optional)",
  rag_note: "Wenn die KI ausschließlich aus Ihren Dokumenten arbeiten soll, fügen Sie Ihren Text hier ein oder laden Sie Ihre Dateien hoch. Andernfalls lassen Sie diesen Bereich leer, damit die KI selbst nach Informationen suchen kann.",
  error_duplicate_file: "Diese Datei wurde bereits hinzugefügt.",
  error_unsupported_format: "Nicht unterstütztes Format. Akzeptierte Formate: ",
  ocr_scanned_page: "Gescannte Seite erkannt, OCR läuft",
  ocr_image_processing: "Bilderkennung (OCR)",
  ocr_initializing: "OCR wird initialisiert...",
  ocr_loading_language: "Sprachmodell wird geladen...",
  ocr_preparing: "Analyse wird vorbereitet...",
  docx_processing: "Extraktion von DOCX-Text...",
  pptx_processing: "Extraktion von PPTX-Text...",
  odt_processing: "Extraktion von ODT-Text...",
  odp_processing: "Extraktion von ODP-Text...",
  file_loading: "Datei wird geladen...",
  extraction_success: "Dokument erfolgreich verarbeitet.",
  extraction_error: "Fehler bei der Verarbeitung.",
  error_fullscreen: "Vollbildmodus fehlgeschlagen:",
  lock_text: "Sperren",
  unlock_text: "Entsperren",
  drag_drop_text: "Dokument hierher ziehen (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "oder",
  upload_pdf_btn: "Datei auswählen",
  paste_your_text_here: "Text hier einfügen...",
  rag_tags_tuto: "Hier finden Sie die hochgeladenen Dokumente. Klicken Sie auf den farbigen Kreis, um die Markierung jedes Dokuments anzupassen.",

  // ============================================================================
  // REITER (ONGLETS)
  // ============================================================================
  tab_all: "Alle",
  tab_quiz: "Quiz & Tests",
  tab_text: "Textbearbeitung",
  tab_memory: "Lernen & Entdecken",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // H5P-AKTIVITÄTEN - DETAILS
  // ============================================================================
  h5p_timeline_name: "Zeitstrahl",
  h5p_timeline_description: "Erstellen Sie eine interaktive Zeitleiste zur Darstellung einer Ereignisfolge.",
  h5p_flashcards_name: "Lernkarten",
  h5p_flashcards_description: "Erstellen Sie Karten mit Vorder- und Rückseite zum Lernen von Begriffen und Definitionen.",
  h5p_quiz_set_name: "Gemischtes Quiz",
  h5p_quiz_set_description: "Erstellen Sie eine Reihe verschiedener Fragen (MCQ, Drag & Drop usw.) zur Wissensüberprüfung.",
  h5p_quiz_set_qcm_name: "Multiple-Choice-Quiz",
  h5p_quiz_set_qcm_description: "Erstellen Sie ein Quiz, das ausschließlich aus Multiple-Choice-Fragen besteht.",
  h5p_quiz_set_vf_name: "Wahr/Falsch-Quiz",
  h5p_quiz_set_vf_description: "Erstellen Sie ein Quiz, das ausschließlich aus Wahr- oder Falsch-Fragen besteht.",
  h5p_glossary_name: "Glossar",
  h5p_glossary_description: "Erstellen Sie ein Glossar oder FAQ als ausklappbares Akkordeon.",
  h5p_crossword_name: "Kreuzworträtsel",
  h5p_crossword_description: "Generieren Sie ein Kreuzworträtsel aus einer Liste von Wörtern und Definitionen.",
  h5p_essay_name: "Aufsatz",
  h5p_essay_description: "Stellen Sie eine Schreibaufgabe und definieren Sie Schlüsselwörter für eine automatische Bewertung.",
  h5p_summary_name: "Zusammenfassung",
  h5p_summary_description: "Schüler müssen eine korrekte Zusammenfassung erstellen, indem sie die richtigen Sätze auswählen.",
  h5p_drag_the_words_name: "Wörter ziehen",
  h5p_drag_the_words_description: "Erstellen Sie einen Lückentext, in den Schüler die fehlenden Wörter ziehen müssen.",
  h5p_fill_in_the_blanks_name: "Lückentext",
  h5p_fill_in_the_blanks_description: "Schüler müssen die fehlenden Wörter in einem Text direkt über die Tastatur eingeben.",
  h5p_mark_the_words_name: "Wörter markieren",
  h5p_mark_the_words_description: "Lassen Sie die Schüler bestimmte Wörter in einem Absatz markieren.",
  h5p_true_false_name: "Wahr/Falsch",
  h5p_true_false_description: "Erstellen Sie <strong style='color: red;'>eine</strong> einfache Frage mit der Antwortmöglichkeit Wahr oder Falsch.",
  h5p_multiple_choice_name: "Multiple Choice",
  h5p_multiple_choice_description: "Erstellen Sie <strong style='color: red;'>eine</strong> Multiple-Choice-Frage mit einer oder mehreren richtigen Antworten.",
  h5p_find_the_words_name: "Wortsuchrätsel",
  h5p_find_the_words_description: "Erstellen Sie ein Buchstabengitter, in dem Schüler Wörter finden müssen.",
  h5p_sort_the_paragraphs_name: "Absätze ordnen",
  h5p_sort_the_paragraphs_description: "Erstellen Sie eine Gruppe von Absätzen, die die Schüler in die richtige Reihenfolge bringen müssen.",
  h5p_single_choice_set_name: "Einfachauswahl-Serie",
  h5p_single_choice_set_description: "Erstellen Sie eine Serie von Fragen, bei denen jede Frage nur eine richtige Antwort hat.",
  h5p_dialog_cards_name: "Dialogkarten",
  h5p_dialog_cards_description: "Erstellen Sie interaktive Karten mit Vorder- und Rückseite, Text und optional Bildern.",
  h5p_complex_fill_the_blanks_name: "Komplexer Lückentext",
  h5p_complex_fill_the_blanks_description: "Erstellen Sie einen erweiterten Lückentext mit spezifischem Feedback für jeden Fehler.",
  h5p_chart_name: "Diagramm",
  h5p_chart_description: "Erstellen Sie ein Kreis- oder Balkendiagramm zur Datenvisualisierung.",

  // ============================================================================
  // ÉLÉA/MOODLE-AKTIVITÄTEN - DETAILS
  // ============================================================================
  moodle_xml_name: "Test",
  moodle_xml_description: "Generieren Sie eine Fragensammlung zum Import in eine Test-Aktivität (XML- oder GIFT-Format)",
  moodle_xml_help: "Um eine XML-Datei in einen Moodle-Test einzufügen, erstellen Sie zuerst die Aktivität. Öffnen Sie dann das Menü <strong>Mehr</strong> und wählen Sie <strong>Fragensammlung</strong>. Klicken Sie dort auf <strong>Importieren</strong>, wählen Sie das Format <strong>Moodle-XML</strong>, laden Sie Ihre Datei hoch und bestätigen Sie.",
  moodle_gift_name: "GIFT-Format",
  moodle_gift_description: "Erstellen Sie Fragen im GIFT-Format, eine einfache Art, Fragen in Moodle zu importieren.",
  moodle_millionnaire_name: "Millionär",
  moodle_millionnaire_description: "Erstellen Sie eine Millionär-Aktivität mit 6 Fragen ansteigender Schwierigkeit.",
  moodle_appariement_name: "Zuordnung",
  moodle_appariement_description: "Erstellen Sie eine Zuordnungsaktivität mit 10 Fragen.",
  moodle_qcm_name: "MCQ",
  moodle_qcm_description: "Erstellen Sie eine einfache MCQ-Aktivität.",
  moodle_glossaire_xml_name: "Glossar (XML)",
  moodle_glossaire_xml_description: "Erstellen Sie ein Glossar zum Import im XML-Format.",
  glossaire_success_generation: "Datei {fileName} erfolgreich generiert!",
  glossaire_error_creation: "Fehler beim Erstellen des Glossar-XMLs:",
  glossaire_error_invalid_json: "Das JSON muss einen Namen ('name') und ein Array von Einträgen ('entries') enthalten.",
  elea_page_name: "Seite",
  elea_page_description: "Erstellen Sie eine visuell formatierte Inhaltsseite für Éléa.",

  // ============================================================================
  // GENERIERUNGS-MODAL
  // ============================================================================
  get_prompt_step: "1/2 Prompt zum Kopieren erhalten",
  create_file_step: "2/2 Datei aus JSON erstellen",
  generate_one_click: "Mit einem Klick generieren",
  simple_mode: "Einfach",
  advanced_mode: "Geführt",
  prompt_for_ia: "Prompt für die KI",
  copy_prompt: "Prompt kopieren",
  fullscreen_prompt: "Vollbild",
  exit_fullscreen_prompt: "Vollbild beenden",
  lock_prompt: "Sperren",
  unlock_prompt: "Entsperren",
  go_duck: "Kopieren und zu Duck.ai gehen",
  go_mistral: "Kopieren und zu Le Chat gehen",
  create_h5p_file: "H5P-Datei erstellen",
  integrate_h5p_libraries: "H5P-Bibliotheken integrieren:",
  paste_ia_result: "Fügen Sie das KI-Ergebnis unten ein, um Ihr Modul zu erstellen.",
  generate_h5p: "H5P generieren",
  create_xml_file: "XML-Datei erstellen",
  paste_ia_result_xml: "Fügen Sie das von der KI generierte XML unten ein.",
  generate_xml_file: "XML-Datei generieren",
  export_mbz: "MBZ-Format",
  export_gift: "GIFT-Format",
  export_xml: "XML-Format",
  export_html: "HTML-Format",
  export_docx: "DOCX-Format",
  export_odt: "ODT-Format",
  export_pdf: "PDF-Format",
  export_error: "Exportfehler",
  create_mbz_file_appariement: "Zuordnungsdatei erstellen (.mbz)",
  paste_ia_result_appariement: "Fügen Sie das von der KI generierte JSON unten ein. Der Titel wird automatisch extrahiert.",
  generate_mbz_appariement: "Zuordnungsaktivität generieren (mbz)",
  create_mbz_file_millionnaire: "Millionär-Datei erstellen (.mbz)",
  paste_ia_result_millionnaire: "Fügen Sie das von der KI generierte JSON unten ein. Der Titel wird automatisch extrahiert.",
  generate_mbz_millionnaire: "Millionär-Aktivität generieren (mbz)",
  generate_mbz_test: "Test-Aktivität generieren (mbz)",
  create_mbz_file_qcm: "MCQ-Datei erstellen (.mbz)",
  paste_ia_result_qcm: "Fügen Sie das von der KI generierte JSON unten ein. Der Titel wird automatisch extrahiert.",
  generate_mbz_qcm: "MCQ-Aktivität generieren (mbz)",
  create_mbz_file_page: "Seiten-Datei erstellen (.mbz)",
  paste_ia_result_page: "Fügen Sie das von der KI generierte JSON unten ein, um die Seite zu erstellen.",
  generate_mbz_page: "Seiten-Aktivität generieren (mbz)",
  generate_prompts_placeholder: "Der Prompt für die KI erscheint hier, sobald ein Feld ausgefüllt wurde.",
  paste_json_or_text: "Fügen Sie hier den JSON-Inhalt oder den KI-Text ein, um Ihre Aktivität zu erstellen.",
  info_prompt_copy: "Fügen Sie diesen Prompt nicht im rechten Bereich ein. Kopieren Sie ihn in eine KI Ihrer Wahl und fügen Sie das Ergebnis rechts ein.",
  generate_with_llm: "Mit Caramel-KI generieren",
  generation_in_progress: "Generierung läuft, bitte warten...",
  request_sent_to_ia: "Anfrage an KI gesendet, bitte warten...",
  generation_successful: "H5P-Inhalt erfolgreich generiert!",
  generation_failed_empty: "Generierung fehlgeschlagen. Die Antwort war leer.",
  generation_failed_error: "Fehler bei der Generierung: {errorMessage}",
  generation_failed_llm: "Generierung über Caramel-KI fehlgeschlagen. Grund: {errorMessage}",
  llm_small_summary: "Caramel mou: schnell, leicht, perfekt für Kurzübungen. Geringer Verbrauch.",
  llm_large_summary: "Caramel coulant: reichhaltiger, ideal für komplexere Aufgaben. Höherer Verbrauch.",
  llm_xl_summary: "Caramel dur: kraftvoll, für anspruchsvolle Projekte. Garantierte Ergebnisse. Hoher Verbrauch.",
  llm_model_source: "Modellanbieter:",
  llm_model_parameters: "Modellgröße:",
  llm_model_parameters_unit: "Mrd. Parameter",

  // ============================================================================
  // KARAMELL-ANIMATION
  // ============================================================================
  caramel_animation_step_1: "Wir geben Zucker in den Topf...",
  caramel_animation_step_2: "Wir geben etwas Wasser hinzu...",
  caramel_animation_step_3: "Wir erhitzen bei mittlerer Hitze...",
  caramel_animation_step_4: "Der Zucker beginnt zu schmelzen...",
  caramel_animation_step_5: "Es beginnt sich zu verfärben...",
  caramel_animation_step_6: "Wir rühren vorsichtig um...",
  caramel_animation_step_7: "Das Karamell nimmt eine schöne Bernsteinfarbe an...",
  caramel_animation_step_8: "Wir geben die heiße Sahne hinzu...",
  caramel_animation_step_9: "Vorsicht vor Spritzern!",
  caramel_animation_step_10: "Wir mischen alles gut...",
  caramel_animation_step_11: "Es ist fast fertig!",
  caramel_success_title: "Ihre Süßigkeit ist fertig!",

  // ============================================================================
  // BENACHRICHTIGUNGEN UND FEHLER
  // ============================================================================
  prompts_generated_successfully: "Prompts erfolgreich generiert!",
  success_copy: "✓ Kopiert!",
  error_please_fill_fields: "Bitte füllen Sie mindestens ein Feld im Schnellmodus aus.",
  error_please_fill_guided_fields: "Bitte füllen Sie mindestens ein Feld im erweiterten Modus aus.",
  error_field_empty: "Das Feld ist leer. Bitte generieren Sie zuerst einen Prompt.",
  error_copy_failed: "Kopieren fehlgeschlagen.",
  error_h5p_module_not_found: "Modul '{moduleKey}' nicht gefunden.",
  error_invalid_quiz_json: "Ungültiges Quiz-JSON: {errorMessage}",
  error_invalid_json: "Bereitgestelltes JSON ist ungültig: {errorMessage}",
  error_h5p_creation: "H5P-Erstellungsfehler: {errorMessage}",
  error_paste_ia_content: "Bitte fügen Sie den KI-Inhalt ein.",
  error_compression_module_not_ready: "Komprimierungsmodul nicht bereit. Erneut versuchen.",
  h5p_file_generated_successfully: "Datei {fileName} erfolgreich generiert!",
  h5p_creation_failed: "H5P-Dateierstellung fehlgeschlagen: {errorMessage}",
  error_paste_json_content: "Bitte fügen Sie das generierte JSON ein.",
  error_paste_xml_content: "Bitte fügen Sie das generierte XML ein.",
  moodle_xml_success_generation: "Datei {fileName} erfolgreich generiert!",
  test_error_creation_mbz: "Fehler beim Erstellen des MBZ für den Test:",
  test_success_generation: "Datei {fileName} erfolgreich generiert!",
  test_error_generic: "Fehler:",
  test_backup_log: "Sicherung automatisch von Caramel erstellt\n",
  millionnaire_error_compression_libs: "Komprimierungsbibliotheken nicht geladen. Bitte Seite neu laden.",
  millionnaire_error_invalid_json: "Ungültige JSON-Struktur. Erwartet werden Titel und 6 Fragen.",
  millionnaire_activity_intro: "Nehmen Sie am Spiel teil, um Ihr Wissen zu testen.",
  millionnaire_backup_log: "Sicherung automatisch von Caramel erstellt\n",
  millionnaire_success_generation: "Datei {fileName} erfolgreich generiert!",
  millionnaire_error_creation_mbz: "Fehler beim Erstellen des MBZ:",
  millionnaire_error_generic: "Fehler:",
  appariement_error_invalid_json: "Ungültige JSON-Struktur. Erwartet werden Titel und Paare.",
  appariement_activity_intro: "Finden Sie die passenden Paare.",
  appariement_success_generation: "Datei {fileName} erfolgreich generiert!",
  appariement_error_creation_mbz: "Fehler beim Erstellen des MBZ für die Zuordnung:",
  qcm_error_invalid_json: "Ungültige JSON-Struktur. Erwartet werden Titel und Fragen.",
  qcm_activity_intro: "Beantworten Sie die folgenden Fragen.",
  qcm_success_generation: "Datei {fileName} erfolgreich generiert!",
  qcm_error_creation_mbz: "Fehler beim Erstellen des MBZ für das MCQ:",
  version_modal_title: "Neue Version verfügbar",
  version_modal_message: "Sie nutzen Version {currentVersion}. Eine neuere Version ({latestVersion}) ist verfügbar.",
  version_modal_update: "Neue Version laden",
  version_modal_remind_later: "Später erinnern",

  prompt_header_pedagogical_context: "PÄDAGOGISCHER KONTEXT",
  prompt_header_specific_rules: "SPEZIFISCHE REGELN",
  prompt_header_pedagogical_rules: "PÄDAGOGISCHE REGELN",
  prompt_header_sources: "QUELLEN",
  prompt_header_json_structure: "ERWARTETE JSON-STRUKTUR",
  prompt_header_rendering_example: "RENDERING-BEISPIEL",
  prompt_fallback_teacher: "ein Lehrer",
  prompt_fallback_activity: "eine pädagogische Aktivität erstellen",

  // ============================================================================

  // --- GEMEINSAME SCHLÜSSEL ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- Deine Rolle: [QUI]. Experte für Didaktik und pädagogisches Engineering
- Dein pädagogisches Ziel: [QUOI]
- Dein Publikum: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Anpassung und Vokabular: Passen Sie Tonfall, Vokabular und Schwierigkeit der Anweisungen an das angegebene Publikum an. Seien Sie relevant und ansprechend.
- Ton und Feedback: Anweisungen und Anmerkungen müssen konstruktiv, ermutigend und lernorientiert sein.
- Konformität: Passen Sie die Inhalte ZWINGEND an die geltenden offiziellen Referenzen an. Sofern nicht ausdrücklich anders angegeben, orientieren Sie sich standardmäßig an den französischen Lehrplänen (Eduscol) für das schulische Publikum und an den regulatorischen Texten der Berufsbildung für Erwachsene.
- Sprache: Der Inhalt und die Anweisungen müssen auf Deutsch verfasst sein.`,

  SOURCES_COMMUNES: `- Verwenden Sie AUSSCHLIESSLICH die folgenden Texte, um Ihre Aktivität zu generieren.
---
[RAG]
---`,

  // ============================================================================
  // === TIMELINE (Zeitstrahl) ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Anzahl der Ereignisse: Mindestens 5 Ereignisse || [NOMBRE_ELEMENTS] Ereignisse.
- Zeiträume (Era): Mindestens 2 Zeiträume, die Gruppen von Ereignissen abdecken.
- Medien: Fügen Sie nach Möglichkeit Credits und Bildunterschriften für jedes Asset hinzu. Suchen Sie aktiv nach einem relevanten und lizenzfreien Bild (z. B. Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- **Root-Objekt:** Enthält den Schlüssel \`timeline\` (Objekt).
- **Inhalt von \`timeline\`:** Hauptstruktur der Aktivität.
  - \`headline\`: Allgemeiner Titel des Zeitstrahls (reiner Text erforderlich).
  - \`text\`: Fesselnde Einleitung (Markdown unterstützt).
  - \`asset\`: Cover-Medium (\`media\`: direkte URL, \`caption\`: Bildunterschrift, \`credit\`: Quelle).
  - \`date\`: Array der chronologischen Ereignisse.
  - \`era\`: Array der Hintergrundzeiträume (definieren farbige Bereiche im Hintergrund).
- **Struktur der Objekte \`date\` und \`era\`:**
  - \`startDate\`: **Striktes Format** \`YYYY,MM,DD\` oder \`YYYY\`. (Erforderlich)
  - \`endDate\`: **Striktes Format** \`YYYY,MM,DD\` oder \`YYYY\`. (Optional, definiert Dauer/Ende des Zeitraums)
  - \`headline\`: Expliziter Titel des Elements (reiner Text erforderlich).
  - \`text\`: Pädagogische Erzählung. Verwenden Sie \`**Wort**\` für Fett, \`*Wort*\` für Kursiv und \`\\n\` für Zeilenumbrüche.
  - \`asset\`: (Optional) Medienobjekt (\`media\`: direkte Wikimedia Commons URL, \`caption\`, \`credit\`).
  - \`tag\`: Kurzes Schlagwort (z. B. 'Politik', 'Wissenschaft') zur Filterung.
- **LaTeX:** Verwenden Sie das doppelte Escape-Zeichen: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "Die Geschichte der Raumfahrt",
    "text": "Entdecken Sie die großen Etappen, die das Abenteuer der Menschheit im **Weltraum** geprägt haben.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Start der Apollo 11 Mission.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Start von Sputnik 1",
        "text": "Der **erste künstliche Satellit** wird von der UdSSR in den Orbit gebracht.",
        "tag": "Robotik"
      },
      {
        "startDate": "1969,07,20",
        "headline": "Erster Schritt auf dem Mond",
        "text": "Neil Armstrong wird im Rahmen der **Apollo 11** Mission der erste Mensch, der den Mond betritt.",
        "tag": "Mensch"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "Der Weltraum-Wettlauf im Kalten Krieg",
        "text": "Zeit intensiver Rivalität zwischen den USA und der UdSSR.",
        "tag": "Kontext"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === CROSSWORD (Kreuzworträtsel) ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Anzahl der Wörter: Mindestens 6 Wörter || [NOMBRE_ELEMENTS] Wörter.
- Typografische Regeln: Die Antworten (\`answer\`) dürfen nur Buchstaben enthalten. Jedes zusammengesetzte Wort, Akronym oder jeder Ausdruck muss zu einem einzigen Wort ohne Leerzeichen, Bindestriche oder andere Zeichen verschmolzen werden (z. B. 'E-Mail' wird zu 'email', 'U-Bahn' zu 'ubahn').
- Hinweise (\`clue\`): Es ist verboten, das zu findende Wort im Hinweis zu schreiben. Sie müssen kurz und präzise sein.
- Zusätzlicher Hinweis (\`extraClue\`): Die KI muss über die Relevanz der Hinzufügung eines solchen entscheiden.`,

  CROSSWORD_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- \`title\`: Ein Titel für die Aktivität.
- \`words\`: Ein Array von Objekten, das Folgendes enthält:
  - \`answer\`: Das zu erratende Wort (ohne Leerzeichen oder Bindestriche verschmolzen).
  - \`clue\`: Die kurze und präzise Definition.
  - \`extraClue\` (optional): Ein Objekt \`{"params": {"text": "..."}}\`. Der Text kann \`**Wort**\` für Fett, \`*Wort*\` für Kursiv und \`\\n\` für Zeilenumbrüche verwenden.
- \`taskDescription\`: Eine klare und kontextualisierte Anweisung. Verwenden Sie \`**Wort**\` für Fett, \`*Wort*\` für Kursiv und \`\\n\` für Zeilenumbrüche. Geben Sie nach einem Zeilenumbruch an: "Verwenden Sie bei zusammengesetzten Wörtern weder Leerzeichen noch Bindestriche (z. B. 'schulbus' für 'Schul-Bus')."
- \`overallFeedback\`: (STRIKTE REGEL) Sie müssen zwingend ein Array mit 6 Objekten für das Abschluss-Feedback generieren, das auf das Thema der Übung kontextualisiert ist und die folgenden Punktebereiche genau einhält: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Kreuzworträtsel zur Biologie",
  "words": [
    {"answer": "Zelle", "clue": "Basiseinheit des Lebens.", "extraClue": {"params": {"text": "Sie kann **tierisch** oder **pflanzlich** sein."}}},
    {"answer": "DNA", "clue": "Molekül, das die Erbinformation trägt."}
  ],
  "taskDescription": "**Vervollständige** das Gitter mit den Begriffen der Biologie.\\nVerwenden Sie bei zusammengesetzten Wörtern weder Leerzeichen noch Bindestriche (z. B. 'schulbus' für 'Schul-Bus').",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Anstrengungen sind erforderlich, um diese Konzepte der Biologie gut zu verstehen."},
    {"from": 11, "to": 30, "feedback": "Du bist fast da, setze deine Bemühungen fort, um dein Wissen zu festigen."},
    {"from": 31, "to": 50, "feedback": "Das ist ein guter Anfang, aber einige Punkte müssen noch geklärt werden."},
    {"from": 51, "to": 70, "feedback": "Gute Arbeit! Du hast das Wesentliche des Themas verstanden."},
    {"from": 71, "to": 90, "feedback": "Sehr gute Punktzahl! Du beherrschst die behandelten Konzepte gut."},
    {"from": 91, "to": 100, "feedback": "Exzellent! Du beherrschst diese Lektion perfekt."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Lernkarten) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Anzahl der Karten: Mindestens 5 Karten || [NOMBRE_ELEMENTS] Karten.
- Zuordnung: Vorder- und Rückseite müssen durch ein einziges und stabiles Kriterium verbunden sein (z. B. Definition -> Begriff, Ereignis -> Datum, Autor -> Werk). Verwenden Sie für alle Karten dieselbe Beziehung und formulieren Sie die Anweisung wie folgt: "Ordne jedes X dem entsprechenden Y zu".`,

  FLASHCARDS_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das Objekt muss enthalten:
  - \`title\`: Ein relevanter Titel für die Aktivität.
  - \`description\`: Eine klare Anweisung für den Schüler.
  - \`cards\`: Ein Array von Objekten, wobei jedes Objekt eine Karte (Flashcard) darstellt und Folgendes enthält:
    - \`text\`: Die Frage oder der zu erratende Begriff (Vorderseite).
    - \`answer\`: Antwort oder Definition (Rückseite). Normalisierungsregeln: ein einzelnes einfaches Wort oder eine Zahl (keine zusammengesetzten Wörter), Kleinschreibung (außer Eigennamen), ohne Artikel oder Interpunktion, Zahlen in Ziffern.
    - \`tip\` (optional): Hinweis, um dem Schüler zu helfen. Sie können \`**Wort**\` für Fett und \`*Wort*\` für Kursiv verwenden.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Hauptstädte Europas",
  "description": "Ordne jedes Land seiner Hauptstadt zu.",
  "cards": [
    {
      "text": "Frankreich",
      "answer": "paris",
      "tip": "Es ist die Stadt mit dem **Eiffelturm**."
    },
    {
      "text": "Spanien",
      "answer": "madrid",
      "tip": "Liegt im Zentrum der *iberischen* Halbinsel."
    },
    {
      "text": "Italien",
      "answer": "rom",
      "tip": "Auch bekannt als die *Ewige Stadt*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (Aufsatz) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Schlüsselwörter: Mindestens 5 erwartMindestens 5 Schlüsselwörter oder Ausdrücke, die in der Antwort erwartet werden || [NOMBRE_ELEMENTS] Schlüsselwörter.
- Anweisung: Die Anweisung darf die erwarteten Schlüsselwörter nicht auflisten, um die Antwort nicht vorwegzunehmen, außer dem Namen des allgemeinen Themas.`,

  ESSAY_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
Das Objekt muss enthalten:
- \`taskDescription\`: Eine klare Anweisung, die den Schüler auffordert, einen Text zum Thema zu verfassen. Verwenden Sie \`**Wort**\` für Fett (Schlüsselkonzepte), \`*Wort*\` für Kursiv und \`\\n\` für Zeilenumbrüche.
- \`keywords\`: Ein Array von Objekten, die die erwarteten Schlüsselwörter definieren. Jedes Objekt muss die folgende Form haben:
  \`\`\`json
  {
    "keyword": "Wort oder Ausdruck",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (STRIKTE REGEL) Sie müssen zwingend ein Array mit 6 Objekten für das Abschluss-Feedback generieren, das auf das Thema der Übung kontextualisiert ist und die folgenden Punktebereiche genau einhält: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Schreiben Sie einen kurzen Text, der den Prozess der **Photosynthese** erklärt. Ihre Antwort sollte die wesentlichen Elemente ansprechen, die es Pflanzen ermöglichen, ihre eigene Energie zu produzieren.",
  "keywords": [
    {"keyword": "Licht", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "Chlorophyll", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "Kohlendioxid", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "Wasser", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "Glukose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Das ist ein Anfang. Lies dir den Kurs zur Photosynthese noch einmal gut durch." },
    { "from": 11, "to": 30, "feedback": "Du hast einige Elemente identifiziert. Setze deine Bemühungen fort." },
    { "from": 31, "to": 50, "feedback": "Dein Verständnis verbessert sich. Überlege, ob du noch mehr Details hinzufügen kannst." },
    { "from": 51, "to": 70, "feedback": "Gute Arbeit! Du beherrschst die Grundlagen." },
    { "from": 71, "to": 90, "feedback": "Sehr gut! Dein Text zeigt ein solides Verständnis." },
    { "from": 91, "to": 100, "feedback": "Exzellent! Du beherrschst das Thema perfekt." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (Glossar H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Anzahl der Einträge: Mindestens 5 Begriffe || [NOMBRE_ELEMENTS] Begriffe.
- Auswahl der Begriffe: Identifizieren Sie technische Konzepte, spezifisches Vokabular oder komplexe Wörter in den Quellen.
- Definitionen: Prägnant, präzise und perfekt an das angestrebte pädagogische Niveau angepasst.`,

  ACCORDION_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das generierte JSON muss ein ARRAY mit so vielen Objekten sein, wie zuvor Begriffe genannt wurden.
- \`title\`: Das Schlüsselwort, der Ausdruck oder die zu definierende Frage.
- \`text\`: Die Definition. Verwenden Sie \`**Wort**\` für Fett, \`*Wort*\` für Kursiv und \`\\n\` für Zeilenumbrüche. Verwenden Sie für mathematische Formeln das LaTeX-Format mit doppeltem Escape-Zeichen, zum Beispiel: \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Photosynthese", "text": "Prozess, bei dem Pflanzen **Sonnenlicht** in Energie umwandeln.\\nEs ist die Basis der Nahrungskette."},
  {"title": "Zelle", "text": "Grundlegende **Einheit** aller Lebewesen. Es gibt *eukaryotische* und *prokaryotische* Zellen."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (Zusammenfassung) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Anzahl der Schritte: GeneErzeugen Sie eine Tabelle mit mindestens 5 Schritten || [NOMBRE_ELEMENTS] Schritte, um das gesamte Thema abzudecken.
- Distraktoren: Bieten Sie mindestens 2 Distraktoren pro Schritt an. Sie müssen zum Thema passen, aber plausible sachliche oder logische Fehler enthalten.`,

  SUMMARY_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- \`intro\`: Ein kurzer Einleitungssatz (z. B. "Wählen Sie die richtige Aussage aus.").
- \`summaries\`: Array von Objekten, die die Schritte bilden. Jedes Objekt enthält:
  - \`summary\`: EINE Tabelle mit Sätzen (**Zuordnung**). Der erste Satz in der Liste muss IMMER die richtige Zusammenfassung (exakte Aussage) sein.
  - \`tip\`: (Optional) Ein kontextueller Hinweis, um dem Schüler zu helfen.
- \`overallFeedback\`: Tabelle aus 6 Objekten für die Abschlussbewertung (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Verwenden Sie das doppelte Escape-Zeichen für LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Wählen Sie die korrekten Aussagen aus, um die Zusammenfassung des Kurses zu erstellen.",
  "summaries": [
    {
      "summary": [
        "Die Photosynthese ist ein biologischer Prozess, bei dem Pflanzen Lichtenergie in chemische Energie umwandeln.",
        "Die Photosynthese ist ein Prozess, der nur nachts stattfindet.",
        "Die Photosynthese ist der Mechanismus, durch den Tiere atmen."
      ],
      "tip": "Denken Sie an das Licht als Energiequelle."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Anstrengungen sind erforderlich, um diese Konzepte gut zu verstehen." },
    { "from": 11, "to": 30, "feedback": "Du bist fast da, setze deine Bemühungen fort." },
    { "from": 31, "to": 50, "feedback": "Das ist ein guter Anfang, aber einige Punkte müssen noch geklärt werden." },
    { "from": 51, "to": 70, "feedback": "Gute Arbeit! Du hast das Wesentliche verstanden." },
    { "from": 71, "to": 90, "feedback": "Sehr gute Punktzahl! Du beherrschst die Konzepte gut." },
    { "from": 91, "to": 100, "feedback": "Exzellent! Du beherrschst diese Lektion perfekt." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (Glisser les mots) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Anzahl der Wörter: Absatz von mindestens 50 Wörtern mit mindestens 5 Wörtern zum Ziehen || [NOMBRE_ELEMENTS] Wörter.
- Eindeutigkeit: Jedes zu ziehende Wort muss im Text EINZIGARTIG sein (keine Duplikate).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
L'objet muss enthalten:
- \`taskDescription\`: Eine klare Anweisung.
- \`textField\`: Der zu vervollständigende Text. Jede Phrase muss mit einem Zeilenumbruch \`\\n\` enden.
  - **Format**: \`*Wort*\` für ein ziehbares Element.
- \`overallFeedback\`: Tabelle aus 6 Objekten für die Abschlussbewertung (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Vervollständige den Text, indem du die Wörter an die richtige Stelle ziehst.",
  "textField": "Das *Sonnensystem* besteht aus *acht* Planeten, die sich um die *Sonne* drehen.\\nDer größte Planet ist *Jupiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Anstrengungen sind erforderlich." },
    { "from": 11, "to": 30, "feedback": "Du bist fast da." },
    { "from": 31, "to": 50, "feedback": "Das ist ein guter Anfang." },
    { "from": 51, "to": 70, "feedback": "Gute Arbeit!" },
    { "from": 71, "to": 90, "feedback": "Sehr gute Punktzahl!" },
    { "from": 91, "to": 100, "feedback": "Exzellent!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (Texte à trous) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Anzahl der Lücken: Absatz von mindestens 50 Wörtern mit mindestens 3 Lücken || [NOMBRE_ELEMENTS] Wörter.
- Ausgewogenheit: Erstellen Sie keine Lücken bei trivialen Wörtern (Artikel, Präpositionen), es sei denn, dies ist das grammatikalische Ziel. Zielen Sie auf Schlüsselkonzepte ab.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
Das Objekt muss enthalten:
- \`taskDescription\`: Eine klare und kurze Anweisung, die das Ziel der Aktivität im globalen Kontext erklärt. Verwenden Sie \`**Wort**\` für Fett (Schlüsselkonzepte), \`*Wort*\` für Kursiv und \`\\n\` für Zeilenumbrüche.
- \`questions\`: Ein Array von Zeichenfolgen. Jede Zeichenfolge stellt einen zu vervollständigenden Textblock dar.
  - **Syntax der Lücken**: Umgeben Sie die zu erratenden Wörter mit Sternchen (z. B. \`*Wort*\`).
  - **Alternativen**: Verwenden Sie \`/\` für mehrere akzeptierte Antworten (z. B. \`*Wort1/Wort2*\`).
  - **Hilfe**: Verwenden Sie \`:\`, um einen pädagogischen Hilfe-Tooltip hinzuzufügen (z. B. \`*Wort:Hinweis*\`).
- \`overallFeedback\`: (STRIKTE REGEL) Sie müssen zwingend ein Array mit 6 Objekten für das Abschluss-Feedback generieren (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Füllen Sie die Lücken im folgenden Text über das Sonnensystem aus.",
  "questions": [
    "Die Erde ist ein *Planet* im *Sonnensystem*.",
    "Sie dreht sich in etwa 365 Tagen um die *Sonne:unser Stern*."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Anstrengungen sind erforderlich, um diese Konzepte gut zu verstehen."},
    {"from": 11, "to": 30, "feedback": "Du bist fast da, setze deine Bemühungen fort, um dein Wissen zu festigen."},
    {"from": 31, "to": 50, "feedback": "Das ist ein guter Anfang, aber einige Punkte müssen noch geklärt werden."},
    {"from": 51, "to": 70, "feedback": "Gute Arbeit! Du hast das Wesentliche des Themas verstanden."},
    {"from": 71, "to": 90, "feedback": "Sehr gute Punktzahl! Du beherrschst die behandelten Konzepte gut."},
    {"from": 91, "to": 100, "feedback": "Exzellent! Du beherrschst diese Lektion perfekt."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (Surligner les mots) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Anzahl der Wörter: Absatz von mindestens 50 Wörtern mit mindestens 5 zu markierenden Wörtern || [NOMBRE_ELEMENTS] Wörter.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
Das Objekt muss enthalten:
- \`taskDescription\`: Eine klare und ansprechende Anweisung. Sie können \`**Wort**\` für Fett und \`*Wort*\` für Kursiv nur hier verwenden.
- \`textField\`: Der vollständige Text, der die zu markierenden Wörter enthält.
  - **MARKIERUNG:** Jedes zu markierende Wort muss EINZELN von Sternchen umgeben sein. (Beispiel: \`*Wort1* *Wort2*\` ist korrekt; \`*Wort1 Wort2*\` ist inkorrekt).
  - **INTERPUNKTION:** Apostrophe oder Satzzeichen DÜRFEN NIEMALS Teil der Markierung sein und müssen vom Wort durch ein Leerzeichen getrennt werden. (Beispiel: Schreiben von \`l' *oiseau*\` ist korrekt, \`l'*oiseau*\` ist inkorrekt).
- \`overallFeedback\`: (STRIKTE REGEL) Sie müssen zwingend ein Array mit 6 Objekten für das Abschluss-Feedback generieren (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Klicken Sie auf die **Eigennamen** im folgenden Text.",
  "textField": "*Paris* ist die Hauptstadt von *Frankreich*. Es ist *Europa*, das uns interessiert.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Anstrengungen sind erforderlich, um diese Konzepte gut zu verstehen."},
    {"from": 11, "to": 30, "feedback": "Du bist fast da, setze deine Bemühungen fort, um dein Wissen zu festigen."},
    {"from": 31, "to": 50, "feedback": "Das ist ein guter Anfang, aber einige Punkte müssen noch geklärt werden."},
    {"from": 51, "to": 70, "feedback": "Gute Arbeit! Du hast das Wesentliche des Themas verstanden."},
    {"from": 71, "to": 90, "feedback": "Sehr gute Punktzahl! Du beherrschst die behandelten Konzepte gut."},
    {"from": 91, "to": 100, "feedback": "Exzellent! Du beherrschst diese Lektion perfekt."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (Vrai/Faux) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Frage: Eine klare und eindeutige Aussage.
- Antwort: Die Antwort muss strikt "true" (Wahr) oder "false" (Falsch) sein.
- Feedbacks: Sehen Sie spezifische Nachrichten für Erfolg (\`feedbackOnCorrect\`) und Misserfolg (\`feedbackOnWrong\`) vor, um das Lernen zu verstärken.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das Hauptobjekt muss die folgenden Schlüssel enthalten:
  - \`question\`: (String) Die zu bewertende Aussage. Kann HTML enthalten.
  - \`correct\`: (String) Die richtige Antwort, entweder "true" oder "false".
  - \`feedbackOnCorrect\`: (String) Kommentar, der angezeigt wird, wenn die Antwort korrekt ist.
  - \`feedbackOnWrong\`: (String) Kommentar, der angezeigt wird, wenn die Antwort inkorrekt ist.
- **Formatierung:** Verwende Markdown-Syntax für Fett (\`**Text**\`) und Kursiv (\`*Text*\`).
- **LaTeX:** Verwende für mathematische Formeln AUSSCHLIESSLICH das LaTeX-Format mit doppeltem Escape-Zeichen: \`\\\\( ... \\\\)\`. Verwende NIEMALS das \`$\`-Zeichen allein.
- **Feedback:** Das Feedback darf KEIN LaTeX oder Markdown enthalten.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo ist die Hauptstadt von Norwegen.",
  "correct": "true",
  "feedbackOnCorrect": "Richtige Antwort! Oslo ist in der Tat die Hauptstadt von Norwegen.",
  "feedbackOnWrong": "Falsche Antwort. Die Hauptstadt von Norwegen ist Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (Choix multiples) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Frage: Eine klare Multiple-Choice-Frage.
- Antworten: Schlagen Sie mehrere Antwortmöglichkeiten (\`answers\`) vor. Es darf nur eine richtige Antwort (\`"correct": true\`) und mehrere plausible Distraktoren (\`"correct": false\`) geben.
- Feedbacks:
  - \`overallFeedback\`: (STRIKTE REGEL) Sie müssen zwingend ein Array mit 6 Objekten für das Abschluss-Feedback generieren (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das Hauptobjekt muss die folgenden Schlüssel enthalten:
  - \`question\`: (String) Die Aufgabenstellung. Kann HTML enthalten.
  - \`answers\`: (Array) Array von Objekten, die jeweils eine Antwort darstellen.
    - \`text\`: (String) Der Text der Antwort.
    - \`correct\`: (Boolean) \`true\`, wenn es eine richtige Antwort ist, andernfalls \`false\`.
    - \`tipsAndFeedback\`: (Object, optional) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (Array) Array mit 6 Objekten, die das Feedback pro Punktebereich definieren.
- **Formatierung:** Verwende Markdown-Syntax für Fett (\`**Text**\`) und Kursiv (\`*Text*\`).
- **LaTeX:** Verwende für mathematische Formeln AUSSCHLIESSLICH das LaTeX-Format mit doppeltem Escape-Zeichen: \`\\\\( ... \\\\)\`. Verwende NIEMALS das \`$\`-Zeichen allein.
- **Feedback:** Das Feedback darf KEIN LaTeX oder Markdown enthalten.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Was ist die tatsächliche Farbe der schwarzen Johannisbeere?",
  "answers": [
    {"text": "Sehr dunkles Violett", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Genau!" }},
    {"text": "Blau", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Nein, es ist dunkler." }},
    {"text": "Schwarz", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Anstrengungen sind erforderlich." },
    { "from": 11, "to": 30, "feedback": "Du bist fast da." },
    { "from": 31, "to": 50, "feedback": "Das ist ein guter Anfang." },
    { "from": 51, "to": 70, "feedback": "Gute Arbeit!" },
    { "from": 71, "to": 90, "feedback": "Sehr gute Punktzahl!" },
    { "from": 91, "to": 100, "feedback": "Exzellent!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (Mots mêlés) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Anzahl der Wörter: Mindestens 6 Wörter || [NOMBRE_ELEMENTS] Wörter.
- Typografische Regeln: Die Wörter dürfen weder Akzente, Zahlen, Satzzeichen noch Leerzeichen enthalten.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- \`taskDescription\`: Anweisung für den Schüler.
- \`wordList\`: Liste der zu findenden Wörter, durch Kommas getrennt (ohne Leerzeichen).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Finden Sie die im Gitter versteckten Wörter.",
  "wordList": "ZELLE,DNA,GEN,KERN"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (Ordonner les paragraphes) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Anzahl der Schritte: Mindestens 3 Schritte oder Absätze zum Sortieren || [NOMBRE_ELEMENTS] Schritte.
- Intrinsische Logik: Die Absätze (\`paragraphs\`) müssen eine logische Abfolge bilden, die aus dem Inhalt selbst ableitbar ist.
- Verbot künstlicher Hinweise: Sie dürfen NIEMALS Nummerierungen (1, 2, 3...), explizite Zeitangaben (Daten, Uhrzeiten) oder zu einfache logische Verknüpfungen ("Zuerst", "Dann", "Schließlich") verwenden, es sei denn, der Benutzer verlangt dies ausdrücklich.
- Roter Faden: Jeder Absatz muss einen einzigen roten Faden vorantreiben (z. B. Kausalkette, Übergang vom Allgemeinen zum Besonderen oder eine Abfolge von Vorbereitung → Aktion → Ergebnis). Die Reihenfolge muss durch das Verständnis des Sinnes ableitbar sein.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- \`taskDescription\`: Eine klare Anweisung (Markdown unterstützt).
- \`paragraphs\`: Ein Array von Zeichenfolgen (Absätze), die im JSON initial in der **richtigen** logischen Reihenfolge präsentiert werden. Verwenden Sie \`**Wort**\` für Fett, \`*Wort*\` für Kursiv.
- \`overallFeedback\`: Tabelle aus 6 Objekten für die Abschlussbewertung (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Verwenden Sie das doppelte Escape-Zeichen für LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Bringen Sie diese Elemente in die richtige Reihenfolge, um die Kausalkette der globalen Erwärmung zu rekonstruieren.",
  "paragraphs": [
    "Menschliche Aktivitäten, vor allem die Verbrennung fossiler Brennstoffe, setzen massiv **Kohlendioxid** in die Atmosphäre frei.",
    "Dieser Überschuss an Gasen verstärkt den natürlichen Treibhauseffekt und verhindert, dass ein Teil der Infrarotstrahlung die Erde verlässt.",
    "Die so eingefangene Energie verursacht einen schrittweisen Anstieg der durchschnittlichen Temperatur der Luft und der Ozeane.",
    "Diese globale Erwärmung führt zum Schmelzen der Gletscher und zu einem besorgniserregenden Anstieg des Meeresspiegels."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Die Kausalitätslogik muss überprüft werden." },
    { "from": 11, "to": 30, "feedback": "Du hast einige Ansätze von Verständnis, lies den Text noch einmal." },
    { "from": 31, "to": 50, "feedback": "Das ist ein guter Anfang für die Ordnung." },
    { "from": 51, "to": 70, "feedback": "Gute Analyse der logischen Abfolge." },
    { "from": 71, "to": 90, "feedback": "Sehr gute Arbeit bei der Strukturierung!" },
    { "from": 91, "to": 100, "feedback": "Perfekt! Die logische Struktur wird beherrscht." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (Série de choix uniques) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Anzahl der Fragen: Mindestens 3 Fragen || [NOMBRE_ELEMENTS] Fragen.
- Antworten: Schlagen Sie 2 bis 3 Distraktoren pro Frage vor. Die erste Antwort in der Liste \`answers\` muss immer die richtige sein.
- Distraktoren: Konsistent, aber mit plausiblen logischen oder sachlichen Fehlern.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- \`choices\`: Array von Objekten, die die Fragen bilden. Jedes Objekt enthält:
  - \`question\`: Die Aufgabenstellung der Frage.
  - \`answers\`: Array von Zeichenfolgen (Antworten), wobei die erste immer die richtige Antwort ist.
- \`overallFeedback\`: Tabelle aus 6 Objekten für die Abschlussbewertung (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Verwenden Sie das doppelte Escape-Zeichen für LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "Was ist das Hauptgas, das für den Treibhauseffekt verantwortlich ist?",
      "answers": ["Kohlendioxid", "Sauerstoff", "Stickstoff", "Argon"]
    },
    {
      "question": "Was ist die Hauptstadt von Frankreich?",
      "answers": ["Paris", "Lyon", "Marseille", "Bordeaux"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Anstrengungen sind erforderlich." },
    { "from": 11, "to": 30, "feedback": "Du bist fast da." },
    { "from": 31, "to": 50, "feedback": "Das ist ein guter Anfang." },
    { "from": 51, "to": 70, "feedback": "Gute Arbeit!" },
    { "from": 71, "to": 90, "feedback": "Sehr gute Punktzahl!" },
    { "from": 91, "to": 100, "feedback": "Exzellent!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (Cartes de dialogue) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Anzahl der Karten: Mindestens 3 Karten || [NOMBRE_ELEMENTS] Karten.
- Zuordnungsprinzip: Vorder- und Rückseite müssen durch ein einziges und stabiles Kriterium verbunden sein (z. B. Definition -> Begriff, Ereignis -> Datum, Autor -> Werk).
- Anweisung: Die Beschreibung der Aktivität muss der Formel folgen: "Ordne jedes [X] seinem [Y] zu".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das Root-Objekt MUSS \`title\`, \`description\` und \`dialogs\` enthalten.
- 1. \`title\`: Der Titel der Aktivität (Einfacher Text, **ohne** Markdown oder HTML).
- 2. \`description\`: Die Anweisung oder Beschreibung (HTML-Format oder einfacher Text).
- 3. \`dialogs\`: Das Array des Zuordnungsprinzips der Karten: Die Vorderseite (text) und die Rückseite (answer).
- 4. \`text\`: Die Vorderseite der Karte. Verwenden Sie \`**Wort**\` für Fett und \`*Wort*\` für Kursiv.
- 5. \`answer\`: Die Rückseite der Karte. Er sollte kurz sein. Verwenden Sie \`**Wort**\` für Fett und \`*Wort*\` für Kursiv.
- 6. \`tips\` (optional): Fügen Sie einen Hinweis für die Vorderseite (\`front\`) und/oder die Rückseite (\`back\`) hinzu, nur wenn dies relevant ist. Einfacher Text **ohne** Formatierung.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Unregelmäßige Verben",
  "description": "Finden Sie das Verb im Infinitiv.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identifizieren Sie das Präteritum.", "back": "Grundform."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (Diagramme) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Anzahl der Elemente: Mindestens 5 Vergleichselemente || [NOMBRE_ELEMENTS] Vergleichselemente.
- Diagrammtyp: Wählen Sie zwischen Kreisdiagramm (\`pieChart\`) oder Balkendiagramm (\`barChart\`), je nach pädagogischer Relevanz.
- Beschriftungen und Farben: Die Farben müssen für eine gute Lesbarkeit kontrastreich sein. Die Beschriftungen müssen kurz und klar sein.`,

  CHART_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- \`graphMode\`: Der Diagrammtyp (\`pieChart\` oder \`barChart\`).
- \`listOfTypes\`: Ein Array von Objekten \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: Der Titel des Diagramms.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Blaubeeren"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Himbeeren"}
  ],
  "figureDefinition": "Grafik der Lieblingsfrüchte"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Quiz H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Anzahl der Fragen: GeneErzeugen Sie eine Tabelle mit mindestens 5 Fragen || [NOMBRE_ELEMENTS] Fragen.
- Vielfalt: Wählen Sie die am besten geeigneten Aktivitätstypen aus den folgenden aus, um die Übung zu variieren:
  - **MCQ** (\`H5P.MultiChoice\` 1.16)
  - **Wörter ziehen** (\`H5P.DragText\` 1.10)
  - **Vahr/Falsch** (\`H5P.TrueFalse\` 1.8)
  - **Lückentext** (\`H5P.Blanks\` 1.14)
  - **Wörter markieren** (\`H5P.MarkTheWords\` 1.11)
  - **Aufsatz / Offene Frage** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das Root-Objekt muss enthalten:
  - \`title\`: Der Titel der Aktivität.
  - \`questions\`: Ein Array von Objekten. Jedes Objekt stellt eine Frage dar und muss enthalten:
    - \`library\`: Der Name und die genaue Version der Bibliothek (z. B. \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: Ein Objekt, das einen Schlüssel \`title\` enthält (kurzer Titel der Frage).
    - \`params\`: Die Daten der Frage.
  - \`overallFeedback\`: Globales Array mit 6 Objekten für die Abschlussbewertung des QuizSet.

**Details der \`params\` pro Typ:**
1. **MCQ (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (Array von Objekten mit \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **Wahr/Falsch (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" oder "false" als String)
3. **Lückentext (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (Array von Strings mit \`*Wort*\`)
4. **Wörter ziehen (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (mit \`*Wort*\`)
5. **Markieren (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (mit \`*Wort*\`)
6. **Aufsatz (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (Array von Objekten)

**Jede Frage, außer denen vom Typ H5P.TrueFalse 1.8, muss ihr eigenes \`overallFeedback\` (6 Tranchen) enthalten.**
- **Formatierung:** Verwende Markdown-Syntax für Fett (\`**Text**\`) und Kursiv (\`*Text*\`).
- **LaTeX:** Verwende für mathematische Formeln AUSSCHLIESSLICH das LaTeX-Format mit doppeltem Escape-Zeichen: \`\\\\( ... \\\\)\`. Verwende NIEMALS das \`$\`-Zeichen allein.
- **Feedback:** Das Feedback darf KEIN LaTeX oder Markdown enthalten.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Wissenschaftliche Allgemeinbildung",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomie - MCQ" },
      "params": {
        "question": "Welcher Planet ist der Sonne am nächsten?",
        "answers": [
          { "text": "Merkur", "correct": true },
          { "text": "Venus", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Falsch."},
          {"from": 11, "to": 30, "feedback": "Ungenügend."},
          {"from": 31, "to": 50, "feedback": "Mittelmäßig."},
          {"from": 51, "to": 70, "feedback": "Gut."},
          {"from": 71, "to": 90, "feedback": "Sehr gut."},
          {"from": 91, "to": 100, "feedback": "Exzellent."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Biologie - Wahr/Falsch" },
      "params": {
        "question": "DNA ist eine Doppelhelix.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Schwaches Ergebnis."},
    {"from": 11, "to": 30, "feedback": "Ungenügendes Ergebnis."},
    {"from": 31, "to": 50, "feedback": "Mittelmäßiges Ergebnis."},
    {"from": 51, "to": 70, "feedback": "Gutes Ergebnis."},
    {"from": 71, "to": 90, "feedback": "Sehr gutes Ergebnis."},
    {"from": 91, "to": 100, "feedback": "Exzellentes Ergebnis."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (H5P Multiple-Choice-Quiz) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Anzahl der Fragen: Erstellen Sie mindestens 5 Fragen || [NOMBRE_ELEMENTS] Fragen.
- Typ: Sie müssen AUSSCHLIESSLICH **Multiple-Choice-Fragen** generieren (\`H5P.MultiChoice\` 1.16). Kein anderer Typ ist erlaubt.
- Qualität der Multiple-Choice-Fragen:
  - Jede Frage muss mindestens 3 Antwortoptionen haben.
  - Je nach Art der Frage können Sie eine oder mehrere richtige Antworten vorschlagen.
  - Falsche Antworten (Distraktoren) müssen plausibel und relevant sein.
  - Vermeiden Sie negative Formulierungen in Fragen.
  - Variieren Sie die Position der richtigen Antwort(en).`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Generieren Sie NUR ein vollständiges und gültiges JSON in einem Code-Block. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das Stammobjekt muss enthalten:
  - \`title\`: Aktivitätstitel.
  - \`questions\`: Ein Array von Objekten. Jedes Objekt stellt eine Multiple-Choice-Frage dar und muss enthalten:
    - \`library\`: Immer \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: Ein Objekt mit einem \`title\`-Schlüssel (kurzer Fragentitel).
    - \`params\`: Fragendaten.
  - \`overallFeedback\`: Globales Array von 6 Objekten für die endgültige QuizSet-Punktzahl.

**Details zu \`params\` für Multiple-Choice (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: Die gestellte Frage (String).
- \`answers\`: Array von Objekten mit \`text\` (String) und \`correct\` (Boolean).
- \`behaviour\`: Objekt mit \`singleAnswer\`: \`true\` bei einer richtigen Antwort, \`false\` bei mehreren richtigen Antworten.

**Jede Frage muss ihr eigenes \`overallFeedback\` enthalten (6 Bereiche: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Formatierung:** Verwende Markdown-Syntax für Fett (\`**Text**\`) und Kursiv (\`*Text*\`).
- **LaTeX:** Verwende für mathematische Formeln AUSSCHLIESSLICH das LaTeX-Format mit doppeltem Escape-Zeichen: \`\\\\( ... \\\\)\`. Verwende NIEMALS das \`$\`-Zeichen allein.
- **Feedback:** Das Feedback darf KEIN LaTeX oder Markdown enthalten.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Multiple-Choice-Quiz - Wissenschaft",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomie - Planeten" },
      "params": {
        "question": "Welcher Planet ist der Sonne am nächsten?",
        "answers": [
          { "text": "Venus", "correct": false },
          { "text": "Mars", "correct": false },
          { "text": "Merkur", "correct": true },
          { "text": "Jupiter", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Falsch."},
          {"from": 11, "to": 30, "feedback": "Unzureichend."},
          {"from": 31, "to": 50, "feedback": "Durchschnittlich."},
          {"from": 51, "to": 70, "feedback": "Gut."},
          {"from": 71, "to": 90, "feedback": "Sehr gut."},
          {"from": 91, "to": 100, "feedback": "Ausgezeichnet!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Biologie - Organellen" },
      "params": {
        "question": "Welche Organellen besitzen ihre eigene DNA?",
        "answers": [
          { "text": "Ribosom", "correct": false },
          { "text": "Mitochondrium", "correct": true },
          { "text": "Golgi-Apparat", "correct": false },
          { "text": "Chloroplast", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Falsch."},
          {"from": 11, "to": 30, "feedback": "Unzureichend."},
          {"from": 31, "to": 50, "feedback": "Durchschnittlich."},
          {"from": 51, "to": 70, "feedback": "Gut."},
          {"from": 71, "to": 90, "feedback": "Sehr gut."},
          {"from": 91, "to": 100, "feedback": "Ausgezeichnet!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Schwaches Ergebnis. Wiederholen Sie die Grundlagen."},
    {"from": 11, "to": 30, "feedback": "Unzureichendes Ergebnis. Machen Sie weiter."},
    {"from": 31, "to": 50, "feedback": "Durchschnittliches Ergebnis. Sie machen Fortschritte."},
    {"from": 51, "to": 70, "feedback": "Gutes Ergebnis. Sie beherrschen mehrere Konzepte."},
    {"from": 71, "to": 90, "feedback": "Sehr gutes Ergebnis. Sie sind auf dem richtigen Weg."},
    {"from": 91, "to": 100, "feedback": "Ausgezeichnetes Ergebnis. Glückwunsch!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P Richtig/Falsch Quiz) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Anzahl der Fragen: Erzeugen Sie eine Tabelle mit mindestens 5 Fragen || [NOMBRE_ELEMENTS] Fragen.
- Typ: Sie müssen AUSSCHLIESSLICH **Richtig/Falsch**-Fragen generieren (\`H5P.TrueFalse\` 1.8). Kein anderer Typ ist erlaubt.
- Qualität der Fragen:
  - Die Aussagen müssen klar und eindeutig sein.
  - Vermeiden Sie doppelte Verneinungen.
  - Variieren Sie zwischen richtigen und falschen Aussagen.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Generieren Sie NUR ein vollständiges und gültiges JSON in einem Code-Block. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das Stammobjekt muss enthalten:
  - \`title\`: Aktivitätstitel.
  - \`questions\`: Ein Array von Objekten. Jedes Objekt stellt eine Frage dar und muss enthalten:
    - \`library\`: Immer \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: Ein Objekt mit einem \`title\`-Schlüssel (kurzer Fragentitel).
    - \`params\`: Fragendaten.
  - \`overallFeedback\`: Globales Array von 6 Objekten für die endgültige QuizSet-Punktzahl: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Details zu \`params\` für Richtig/Falsch (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: Die gestellte Aussage oder Frage (String).
- \`correct\`: Die richtige Antwort. MUSS ein String sein: "true" oder "false".
- **Formatierung:** Verwende Markdown-Syntax für Fett (\`**Text**\`) und Kursiv (\`*Text*\`).
- **LaTeX:** Verwende für mathematische Formeln AUSSCHLIESSLICH das LaTeX-Format mit doppeltem Escape-Zeichen: \`\\\\( ... \\\\)\`. Verwende NIEMALS das \`$\`-Zeichen allein.
- **Feedback:** Das Feedback darf KEIN LaTeX oder Markdown enthalten.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Richtig/Falsch-Quiz - Geografie",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografie - Hauptstädte" },
      "params": {
        "question": "Die Hauptstadt von Australien ist Canberra.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografie - Kontinente" },
      "params": {
        "question": "Afrika ist der größte Kontinent der Welt.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Schwaches Ergebnis. Wiederholen Sie die Grundlagen."},
    {"from": 11, "to": 30, "feedback": "Unzureichendes Ergebnis. Machen Sie weiter."},
    {"from": 31, "to": 50, "feedback": "Durchschnittliches Ergebnis. Sie machen Fortschritte."},
    {"from": 51, "to": 70, "feedback": "Gutes Ergebnis. Sie beherrschen mehrere Konzepte."},
    {"from": 71, "to": 90, "feedback": "Sehr gutes Ergebnis. Sie sind auf dem richtigen Weg."},
    {"from": 91, "to": 100, "feedback": "Ausgezeichnetes Ergebnis. Glückwunsch!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Test Moodle/Éléa) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Anzahl der Fragen: Mindestens 10 Fragen || [NOMBRE_ELEMENTS] Fragen.
- Vielfalt: Wählen Sie die geeignetsten Frageformate aus Folgenden aus:
  - **MCQ** (\`multichoice\`)
  - **Zuordnung** (\`matching\`)
  - **Numerisch** (\`numerical\`)
  - **Wahr/Falsch** (\`truefalse\`)
  - **Kurzantwort** (\`shortanswer\`)
  - **Lückentext** (\`cloze\`)
- Distraktoren: Schlagen Sie mindestens 3 Distraktoren pro \`multichoice\`-Frage vor.`,

  ELEA_TEST_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.

Das Hauptobjekt muss die folgenden Schlüssel enthalten:
- \`bank_name\`: Ein kurzer und beschreibender Name für die Fragensammlung.
- \`bank_description\`: Ein Satz, der den Inhalt der Sammlung beschreibt.
- \`questions\`: Ein Array von Objekten, wobei jedes Objekt eine Frage darstellt (\`type\`, \`content\`).
  - Jede Frage muss einen kurzen und eindeutigen \`content.name\` haben (z. B. "Q1 - Thema").

**Formatierungsregeln:**
- **Zahlen**: Verwenden Sie den Punkt für Dezimalstellen (z. B. 12.34).
- **Cloze**: Halten Sie sich strikt an die Syntax \`{1:TYPE:=Richtige Antwort~Falsche Antwort}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **Für den Typ \`multichoice\` (MCQ):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Q1 - Geografie",
      "questiontext": "Was ist die Hauptstadt von Frankreich?",
      "feedback": "Paris ist die politische und wirtschaftliche Hauptstadt Frankreichs.",
      "answers": [
        { "text": "Paris", "fraction": 100, "feedback": "Genau!" },
        { "text": "Lyon", "fraction": 0, "feedback": "Nein, Lyon ist eine große Stadt, aber nicht die Hauptstadt." },
        { "text": "Marseille", "fraction": 0, "feedback": "Nein, das ist die zweitgrößte Stadt Frankreichs." }
      ]
    }
  }
  \`\`\`

- **Für den Typ \`matching\` (Zuordnung):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Q2 - Englischer Wortschatz",
      "questiontext": "Ordnen Sie jedem englischen Wort seine deutsche Übersetzung zu.",
      "feedback": "Bravo, Sie beherrschen den Grundwortschatz.",
      "subquestions": [
        { "text": "Dog", "answer": "Hund" },
        { "text": "Cat", "answer": "Katze" },
        { "text": "Bird", "answer": "Vogel" }
      ]
    }
  }
  \`\`\`

- **Für den Typ \`numerical\` (Numerisch):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Q3 - Mathematik",
      "questiontext": "Was ist der Wert von Pi auf zwei Dezimalstellen gerundet?",
      "feedback": "Pi ist eine irrationale Konstante, ungefähr gleich 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "Es ist tatsächlich 3.14." }
    }
  }
  \`\`\`

- **Für den Typ \`truefalse\` (Wahr/Falsch):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Q4 - Wissenschaft",
      "questiontext": "Wasser siedet auf Meereshöhe bei 100°C.",
      "feedback": "Das ist eine physikalische Standardeigenschaft von Wasser.",
      "answer": { "value": true, "feedback_true": "Wahr.", "feedback_false": "Falsch, Wasser siedet tatsächlich bei 100°C bei 1 atm." }
    }
  }
  \`\`\`

- **Für den Typ \`shortanswer\` (Kurzantwort):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Q5 - Literatur",
      "questiontext": "Wer schrieb 'Die Elenden' (Les Misérables)?",
      "feedback": "Es ist einer der größten Romane des 19. Jahrhunderts.",
      "answers": [
        { "text": "Victor Hugo", "fraction": 100, "feedback": "Richtig!" },
        { "text": "Hugo", "fraction": 100, "feedback": "Richtig!" }
      ]
    }
  }
  \`\`\`

- **Für den Typ \`cloze\` (Lückentext):**
  - Achten Sie auf die Syntax: \`{1:SHORTANSWER:=Gut~Schlecht}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Q6 - Geschichte",
      "questiontext": "Napoleon wurde {1:SHORTANSWER:=1769} in {1:MULTICHOICE:=Ajaccio~Bastia~Paris} geboren.",
      "feedback": "Napoleon Bonaparte wurde auf Korsika geboren."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Millionnaire) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Anzahl der Fragen: EXAKT 6 Fragen (darf keinesfalls geändert werden)
- Progressivität: Die Schwierigkeit der Fragen muss **steigernd und pädagogisch** sein. Wichtige Elemente, die man sich merken soll, werden in den ersten Fragen platziert.
- Richtigkeit: Der Inhalt muss absolut korrekt und relevant sein.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
Ein Hauptobjekt mit den folgenden Schlüsseln:
- \`title\`: Der Titel der Aktivität (Zeichenfolge).
- \`questions\`: Ein Array von EXAKT 6 Objekten, wobei jedes Objekt eine Frage darstellt und Folgendes enthält:
  - \`question\`: Die Aufgabenstellung der Frage (Zeichenfolge).
  - \`goodanswer\`: Die korrekte Antwort (Zeichenfolge).
  - \`badanswer\`: Ein Array von EXAKT 3 falschen Antworten (Array von Zeichenfolgen).
  - Für mathematische Formeln ist LaTeX verboten.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz über die Französische Revolution",
  "questions": [
    {
      "question": "Welches Ereignis markiert den Beginn der Französischen Revolution am 14. Juli 1789?",
      "goodanswer": "Der Sturm auf die Bastille",
      "badanswer": ["Der Ballhausschwur", "Die Hinrichtung von Ludwig XVI.", "Die Schlacht bei Valmy"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Appariement) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Anzahl der Paare: Mindestens 5 Paare || [NOMBRE_ELEMENTS] Paare.
- Logik: Die Beziehung zwischen den beiden Elementen muss nach dem Lesen der Quellen offensichtlich sein.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
Ein Hauptobjekt mit den folgenden Schlüsseln:
- \`title\`: Der Titel der Aktivität (Zeichenfolge).
- \`intro\`: Kurze Anweisung oder Einleitungstext (Zeichenfolge).
- \`pairs\`: Ein Array von Objekten, wobei jedes Objekt ein Paar darstellt und Folgendes enthält:
  - \`question\`: Der Begriff oder das Element links (Zeichenfolge).
  - \`answer\`: Die entsprechende Definition oder das Element rechts (Zeichenfolge).
  - Verwenden Sie für mathematische Formeln das LaTeX-Format mit doppeltem Escape-Zeichen, zum Beispiel: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Zuordnung Geschichte",
  "intro": "Ordnen Sie jedes Datum dem entsprechenden Ereignis der Französischen Revolution zu.",
  "pairs": [
    {"question": "Sturm auf die Bastille", "answer": "14. Juli 1789"},
    {"question": "Abschaffung der Privilegien", "answer": "4. August 1789"},
    {"question": "DDHC", "answer": "26. August 1789"},
    {"question": "Marsch der Frauen", "answer": "5. Oktober 1789"},
    {"question": "Föderationsfest", "answer": "14. Juli 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (QCM Éléa) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Anzahl der Fragen: Mindestens 5 Fragen || [NOMBRE_ELEMENTS] Fragen.
- Antworten: Schlagen Sie zwischen 2 und 5 Auswahlmöglichkeiten pro Frage vor.
- Distraktoren: Zum Thema passend, aber mit logischen Fehlern.`,

  ELEA_QCM_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
Ein Hauptobjekt mit den folgenden Schlüsseln:
- \`title\`: Der Titel der Aktivität (Zeichenfolge).
- \`questions\`: Ein Array von Objekten, wobei jedes Objekt eine Frage darstellt und Folgendes enthält:
  - \`question\`: Die Aufgabenstellung der Frage (Zeichenfolge).
  - \`answers\`: Ein Array von Objekten, die jeweils eine Antwort darstellen:
    - \`text\`: Der Text der Antwort.
    - \`fraction\`: 100 für die richtige Antwort, 0 für die falschen (oder gewichtet bei mehreren richtigen Antworten).
    - \`feedback\`: Ein spezifisches Feedback für diese Antwort.
- \`overallFeedback\`: (STRIKTE REGEL) Sie müssen zwingend ein Array mit 6 Objekten für das Abschluss-Feedback generieren (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "MCQ über die Photosynthese",
  "questions": [
    {
      "question": "Was produzieren Pflanzen während der Photosynthese?",
      "answers": [
        {"text": "Sauerstoff und Glukose", "fraction": 100, "feedback": "Richtig!"},
        {"text": "Kohlendioxid", "fraction": 0, "feedback": "Falsch, das verbrauchen sie."}
      ]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Anstrengungen erforderlich." },
    { "from": 91, "to": 100, "feedback": "Hervorragend!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE_XML (Glossaire Éléa) ===
  // ============================================================================
  ELEA_GLOSSAIRE_XML_REGLES_SPECIFIQUES: `- Anzahl der Einträge: Mindestens 10 Begriffe || [NOMBRE_ELEMENTS] Begriffe.
- Auswahl der Begriffe: Identifizieren Sie technische Konzepte, spezifisches Vokabular oder komplexe Begriffe in den Quellen.
- Definitionen: Prägnant und pädagogisch auf das Publikum abgestimmt.`,

  ELEA_GLOSSAIRE_XML_STRUCTURE_JSON: `- Generieren Sie AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Ihre Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- Das JSON muss ein Hauptobjekt mit den folgenden Schlüsseln sein:
  - \`name\`: Der Name des Glossars.
  - \`entries\`: Ein Array von Objekten, wobei jedes Objekt ein Glossar-Element darstellt und Folgendes enthält:
    - \`concept\`: Der zu definierende Begriff.
    - \`definition\`: Die Definition des Begriffs. Verwenden Sie \`**Wort**\` für Fett, \`*Wort*\` für Kursiv und \`\\n\` für Zeilenumbrüche. LaTeX ist erlaubt.`,

  ELEA_GLOSSAIRE_XML_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Glossar der Biologie",
  "entries": [
    {"concept": "Photosynthese", "definition": "Prozess, bei dem Pflanzen **Licht** in chemische Energie umwandeln."},
    {"concept": "Zelle", "definition": "Die kleinste funktionelle **Einheit** eines Lebewesens."}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Éléa-Seite) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Struktur: Die Seite muss mindestens 5 verschiedene Blöcke enthalten || [NOMBRE_ELEMENTS] Blöcke.
- Pädagogische Logik: Die Inhalte müssen einer kohärenten Progression folgen (z. B.: Begrüßung -> Ziele -> Kurs -> Details/Lexikon -> Sitografie).
- Inhaltsbalance: Mischen Sie Formate, um das Engagement aufrechtzuerhalten (Text, Tabellen, Listen, Infoboxen).
- Pflichtinhalte: Integrieren Sie systematisch ein Eröffnungsbanner (\`#01_hero_header\`), Infoboxen für Ziele oder wichtige Hinweise (\`#04_callout_set\`), ein Lexikon für Fachbegriffe (\`#06_lexique_table\`), mindestens drei Absätze mit wesentlichem Inhalt (\`#12_context_paragraphs\`) und eine Referenz-Sitografie (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Generiere AUSSCHLIESSLICH ein vollständiges und gültiges JSON in einem Codeblock. Deine Antwort MUSS mit \`{\` beginnen und mit \`}\` enden. Kein anderer Text oder Kommentar.
- \`title\`: Titel der Seite (Zeichenfolge).
- \`intro\`: Kurzer, ansprechender Einführungstext (Zeichenfolge).
- \`blocks\`: Ein Array von Objekten, wobei jedes Objekt einen Abschnitt der Seite darstellt. Jeder Block MUSS einer der folgenden Strukturen entsprechen:

**Liste der verfügbaren Blöcke:**
- \`#01_hero_header\`: Eröffnungsbanner. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Inhaltsverzeichnis mit internen Links. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Historische Anhaltspunkte in 3 Karten. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (max. 3 Karten)
- \`#04_callout_set\`: Banner für Ziele, Wissenswertes, Warnungen. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Kennzahlen in Kartenform. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Vokabeltabelle. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Glossar in Form von Badges. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Monument-Karten mit Bildern. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Vergleich zweier Bilder.
- \`#10_table_comparison\`: Vergleichstabelle.
- \`#11_definition_box\`: Infobox Definition. \`{ "type": "#11_definition_box", "data": { "title": "Definition", "text": "..." } }\`
- \`#12_context_paragraphs\`: Kursabsätze. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Detailblatt.
- \`#14_faq_block\`: Häufig gestellte Fragen (FAQ). \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Mythen vs. Realitäten.
- \`#17_method_image_desc\`: Methode zur Bildbeschreibung.
- \`#18_sito_graphy\`: Sitografie. \`{ "type": "#18_sito_graphy", "data": { "title": "Sitographie", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Zweisprachiges Zitat.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Die Französische Revolution",
  "intro": "Entdecken Sie die Schlüsselmomente dieser historischen Periode.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "Die Revolution", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Ziele",
        "callouts": [{"type": "objectif", "text": "Die Ursachen von 1789 verstehen."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "Der Ballhausschwur",
        "paragraphs": [
          "Am 20. Juni 1789 versammelten sich die Abgeordneten des Dritten Standes...",
          "Diese Geste markiert die Geburtsstunde der Nationalversammlung.",
          "Es ist ein entscheidender Wendepunkt hin zum Ende des Absolutismus."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Vokabular",
        "headers": ["Begriff", "Definition"],
        "rows": [["Dritter Stand", "Der Großteil der Bevölkerung..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Zum Weiterlesen",
        "links": [{"href": "https://...", "text": "Offizielle Seite zur Geschichte"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === H5P-BENUTZEROBERFLÄCHE ÜBERSETZUNGEN (STANDARDISIERT) ===
  // ============================================================================

  // Gemeinsame Schlüssel
  h5p_check_answer: "Überprüfen",
  h5p_try_again: "Wiederholen",
  h5p_show_solution: "Lösung anzeigen",
  h5p_submit_answer: "Absenden",
  h5p_score: "Du hast @score von @total Punkten erreicht",
  h5p_score_bar_label: "Du hast :num von :total Punkten erreicht",
  h5p_tip_label: "Hinweis",
  h5p_next: "Weiter",
  h5p_previous: "Zurück",
  h5p_close: "Schließen",
  h5p_finish_header: "Beenden?",
  h5p_finish_body: "Bist du sicher, dass du beenden möchtest?",
  h5p_cancel_label: "Abbrechen",
  h5p_finish_label: "Beenden",
  h5p_retry_header: "Wiederholen?",
  h5p_retry_body: "Bist du sicher, dass du die Aufgabe wiederholen möchtest?",
  h5p_retry_confirm_label: "Bestätigen",
  h5p_resume: "Fortsetzen",
  h5p_audio_direction: "Audio-Richtung",
  h5p_a11y_check: "Antworten überprüfen. Die Antworten werden als richtig, falsch oder unbeantwortet markiert.",
  h5p_a11y_show_solution: "Lösung anzeigen. Die Aufgabe wird mit der richtigen Lösung markiert.",
  h5p_a11y_retry: "Aufgabe wiederholen. Alle Antworten zurücksetzen und die Aufgabe von vorne beginnen.",

  // Kreuzworträtsel (Crossword)
  h5p_crossword_across: "Waagerecht",
  h5p_crossword_down: "Senkrecht",
  h5p_crossword_extra_clue: "Zusätzlicher Hinweis",

  // Zusammenfassung (Summary)
  h5p_summary_intro: "Wähle die richtige Aussage.",
  h5p_summary_solved_label: "Fortschritt:",
  h5p_summary_score_label: "Falsche Antworten:",
  h5p_summary_result_label: "Dein Ergebnis",
  h5p_summary_feedback: "Du hast @score von @total richtigen Aussagen (@percent%).",
  h5p_summary_label_correct: "Richtig.",
  h5p_summary_label_incorrect: "Falsch! Bitte versuche es erneut.",
  h5p_summary_label_correct_answers: "Richtige Antworten.",
  h5p_summary_progress_text: "Fortschritt :num von :total",
  h5p_summary_alternative_incorrect_label: "Falsch",

  // Wörter ziehen (Drag the Words)
  h5p_drag_words_score_feedback: "Ergebnis: @score von @total.",
  h5p_drag_words_correct_text: "Richtig!",
  h5p_drag_words_incorrect_text: "Falsch!",

  // Lückentext (Fill in the Blanks)
  h5p_blanks_not_filled_out: "Bitte fülle alle Lücken aus.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; ist richtig",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; ist falsch",
  h5p_blanks_answered_correctly: "Richtig beantwortet",
  h5p_blanks_answered_incorrectly: "Überprüfen",
  h5p_blanks_solution_label: "Richtige Antwort:",
  h5p_blanks_input_label: "Lücke @num von @total",
  h5p_blanks_input_has_tip_label: "Hinweis verfügbar",
  h5p_blanks_feedback: "Du hast @score von @total Lücken richtig ausgefüllt.",
  h5p_blanks_checking_mode_header: "Prüfmodus",

  // Wörter markieren (Mark the Words)
  h5p_mark_words_correct_answer: "Richtig!",
  h5p_mark_words_incorrect_answer: "Falsch!",
  h5p_mark_words_missed_answer: "Verpasst!",
  h5p_mark_words_display_solution_description: "Die Aufgabe wurde aktualisiert, um die Lösung anzuzeigen.",
  h5p_mark_words_a11y_full_text_label: "Vollständiger lesbarer Text",
  h5p_mark_words_a11y_clickable_text_label: "Vollständiger Text, in dem Wörter markiert werden können",
  h5p_mark_words_a11y_solution_mode_header: "Lösungsmodus",
  h5p_mark_words_a11y_checking_header: "Prüfmodus",

  // Karteikarten (Flashcards)
  h5p_flashcards_progress_text: "Karte @card von @total",
  h5p_flashcards_your_answer: "Deine Antwort",
  h5p_flashcards_correct_answer: "Richtige Antwort",
  h5p_flashcards_incorrect_answer: "Falsche Antwort",
  h5p_flashcards_show_solution: "Richtige Antwort",
  h5p_flashcards_results: "Ergebnisse",
  h5p_flashcards_of_correct: "@score von @total richtig",
  h5p_flashcards_show_results: "Ergebnisse anzeigen",
  h5p_flashcards_answer_short: "A:",
  h5p_flashcards_card_announcement: "Falsche Antwort. Die richtige Antwort war @answer",
  h5p_flashcards_correct_announcement: "@answer ist richtig.",
  h5p_flashcards_page_announcement: "Seite @current von @total",

  // Aufsatz (Essay)
  h5p_essay_feedbackHeader: "Feedback",
  h5p_essay_solutionTitle: "Beispiellösung",
  h5p_essay_remainingChars: "Verbleibende Zeichen: @chars",
  h5p_essay_notEnoughChars: "Du musst mindestens @chars Zeichen eingeben!",
  h5p_essay_messageSave: "gespeichert",
  h5p_essay_placeholderText: "Beginne hier zu schreiben...",
  h5p_essay_ariaYourResult: "Du hast @score von @total Punkten erreicht",
  h5p_essay_ariaNavigatedToSolution: "Zur neu enthaltenen Beispiellösung nach dem Textbereich navigiert.",

  // Wahr/Falsch (True/False)
  h5p_true_false_true_text: "Wahr",
  h5p_true_false_false_text: "Falsch",
  h5p_true_false_wrong_answer_message: "Falsche Antwort",
  h5p_true_false_correct_answer_message: "Richtige Antwort",

  // Suchsel (Find the Words)
  h5p_find_words_found: "@found von @totalWords Wörtern gefunden",
  h5p_find_words_time_spent: "Verstrichene Zeit",
  h5p_find_words_word_list_header: "Wortliste",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Absätze sortieren (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "Nach oben",
  h5p_sort_paragraphs_down: "Nach unten",
  h5p_sort_paragraphs_disabled: "Deaktiviert",
  h5p_sort_paragraphs_paragraph: "Absatz",
  h5p_sort_paragraphs_point: "@score Punkt",
  h5p_sort_paragraphs_seven_of_nine: "@current von @total",
  h5p_sort_paragraphs_current_position: "Aktuelle Position in der Liste",
  h5p_sort_paragraphs_instructions_selected: "Leertaste zum Umordnen drücken",
  h5p_sort_paragraphs_instructions_grabbed: "Pfeiltasten nach oben und unten zum Ändern der Position, Leertaste zum Loslassen, Escape zum Abbrechen drücken",
  h5p_sort_paragraphs_grabbed: "Gepackt",
  h5p_sort_paragraphs_moved: "Verschoben",
  h5p_sort_paragraphs_dropped: "Abgelegt",
  h5p_sort_paragraphs_reorder_cancelled: "Umordnen abgebrochen",
  h5p_sort_paragraphs_final_position: "Endgültige Position",
  h5p_sort_paragraphs_next_paragraph: "Nächster Absatz",
  h5p_sort_paragraphs_correct_paragraph: "Richtiger Absatz an Position",
  h5p_sort_paragraphs_list_description: "Sortierbare Liste von Absätzen.",
  h5p_sort_paragraphs_list_description_check: "Liste von Absätzen mit Ergebnissen.",
  h5p_sort_paragraphs_list_description_solution: "Liste von Absätzen mit Lösungen.",

  // Einzelauswahl-Set (Single Choice Set)
  h5p_single_choice_solution_view_title: "Lösung",
  h5p_single_choice_mute_button_label: "Stummschalten",
  h5p_single_choice_slide_of_total: "Folie @slide von @total",
  h5p_single_choice_solution_list_question_number: "Frage @question",
  h5p_single_choice_should_select: "Sollte ausgewählt werden",
  h5p_single_choice_should_not_select: "Sollte nicht ausgewählt werden",

  // Dialogkarten (Dialog Cards)
  h5p_dialog_cards_answer: "Umdrehen",
  h5p_dialog_cards_progress_text: "Karte @card von @total",
  h5p_dialog_cards_card_front_label: "Vorderseite der Karte",
  h5p_dialog_cards_card_back_label: "Rückseite der Karte",
  h5p_dialog_cards_audio_not_supported: "Dein Browser unterstützt dieses Audioformat nicht",
  h5p_dialog_cards_correct_answer: "Ich habe es richtig gemacht!",
  h5p_dialog_cards_incorrect_answer: "Ich habe es falsch gemacht",
  h5p_dialog_cards_round: "Runde @round",
  h5p_dialog_cards_cards_left: "Verbleibende Karten: @number",
  h5p_dialog_cards_next_round: "Weiter zur Runde @round",
  h5p_dialog_cards_start_over: "Wiederholen",
  h5p_dialog_cards_show_summary: "Weiter",
  h5p_dialog_cards_summary: "Zusammenfassung",
  h5p_dialog_cards_summary_cards_right: "Karten, die du richtig hattest:",
  h5p_dialog_cards_summary_cards_wrong: "Karten, die du falsch hattest:",
  h5p_dialog_cards_summary_cards_not_shown: "Nicht gezeigte Karten:",
  h5p_dialog_cards_summary_overall_score: "Gesamtergebnis",
  h5p_dialog_cards_summary_cards_completed: "Karten, die du gelernt hast:",
  h5p_dialog_cards_summary_completed_rounds: "Abgeschlossene Runden:",
  h5p_dialog_cards_summary_all_done: "Gut gemacht! Du hast alle @cards Karten @max Mal hintereinander abgeschlossen!",

  // Fragensatz (Quiz Set)
  h5p_quiz_textual_progress: "Frage @current von @total",
  h5p_quiz_no_result_message: "Abgeschlossen",
  h5p_quiz_result_message: "Deine Ergebnisse:",
  h5p_quiz_feedback_available: "Feedback verfügbar",
  h5p_quiz_read_feedback: "Feedback lesen",
  h5p_quiz_wrong_answer: "Falsche Antwort",
  h5p_quiz_correct_answer: "Richtige Antwort",
  h5p_quiz_should_check: "Hätte ausgewählt werden sollen",
  h5p_quiz_should_not_check: "Hätte nicht ausgewählt werden sollen",
  h5p_quiz_no_input: "Bitte antworte, bevor du die Lösung ansiehst.",

  // ============================================================================
  // === RECHTLICHE HINWEISE - FUSSZEILE ===
  // ============================================================================
  license_info: "GNU GPL v3.0 oder später",
  ticket: "Ticket",
  legal_mentions: "Impressum",
  legal_title: "Rechtliche Hinweise",
  legal_editor_title: "Herausgeber der Anwendung",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Funktion:</strong> Lehrer für Literatur und Geschichte",
  legal_editor_gauthier_remande_email: "<strong>E-Mail:</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Adresse:</strong> 39 avenue de Chanzy, 53000 Laval, Frankreich",
  legal_editor_gauthier_remande_phone: "<strong>Telefon:</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Funktion:</strong> Mathematiklehrer und Projektleiter DRANE – Akademie von Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>E-Mail:</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Adresse:</strong> 30 boulevard de la République, 38200 Vienne, Frankreich",
  legal_editor_emmanuel_gaunard_phone: "<strong>Telefon:</strong> +33 6 46 74 20 94",
  legal_app_description: "Die Web-Anwendung „Caramel“ ist ein freies, nicht-kommerzielles Projekt zur Erstellung von H5P- und Éléa-Inhalten. Es ist kein Konto erforderlich, und es werden keine personenbezogenen Daten erhoben.",
  legal_hosting_title: "Hosting",
  legal_host_name: "<strong>Host</strong>: Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>Unternehmensform</strong>: Ministerium für nationale Bildung und Jugend",
  legal_host_address: "<strong>Adresse</strong>: 110 rue de Grenelle, 75007 Paris, Frankreich",
  legal_host_phone: "<strong>Telefon</strong>: +33 1 55 55 10 10",
  legal_publication_director_title: "Verantwortlich für die Veröffentlichung",
  legal_publication_director_name: "Gauthier REMANDE und Emmanuel GAUNARD als ehrenamtliche Herausgeber.",
  legal_terms_of_use_title: "Allgemeine Nutzungsbedingungen",
  legal_terms_of_use_content: "Diese Website ermöglicht es Nutzern, H5P- und Éléa-Inhalte zu generieren. Die Anzeige erfolgt lokal, ohne Übertragung von Nutzerdaten. Der Nutzer ist allein verantwortlich für die Verwendung der generierten Inhalte. Die Anwendung wird kostenlos zur Verfügung gestellt, ohne jegliche Garantie für Funktion oder Ergebnis. Der Herausgeber lehnt jede Verantwortung im Falle einer Fehlinterpretation der Inhalte oder einer unsachgemäßen Verwendung ab.",
  legal_intellectual_property_title: "Geistiges Eigentum",
  legal_intellectual_property_content: "Sämtliche Quellcodes, grafische Elemente und Inhalte stehen unter der freien Lizenz GNU AGPLv3. Ihre Wiederverwendung ist unter den Bedingungen der jeweiligen Lizenz gestattet. Jede Weiterverbreitung oder Änderung muss die Originalautoren zitieren: Gauthier REMANDE und Emmanuel GAUNARD. Die in den H5P-Modulen verwendeten Bilder stammen von der Website H5P.org.",
  legal_personal_data_title: "Personenbezogene Daten",
  legal_personal_data_content: "Es werden keine personenbezogenen Daten erhoben oder gespeichert. Es werden keine Tracking-Cookies verwendet.",
  legal_ai_models_title: "KI-Modelle (Künstliche Intelligenz)",
  legal_ai_models_content: "Die Caramel-Anwendung stützt sich ausschließlich bei der Ein-Klick-Generierung auf KI-Modelle, die von ILAAS betrieben werden, einem Verbund gemeinsam genutzter KI-Infrastrukturen. Die Anfragen werden über einen von L’Incubateur gehosteten n8n-Workflow geleitet und dann zur Ausführung an ILAAS auf vertrauenswürdigen Servern in zertifizierten Rechenzentren der Hochschulbildung und Forschung (ESR) übertragen. Caramel führt die Modelle nicht selbst aus und verarbeitet oder speichert keine eigenen Daten; die Daten werden ausschließlich zur Ausführung der Anfrage verwendet und nicht an öffentliche KIs gesendet. Die aktuell angebotenen Modelle umfassen {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) und {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Die Modalitäten für Hosting, Protokollierung und Aufbewahrung, die eventuell von ILAAS durchgeführt werden, unterliegen deren Datenschutzbestimmungen und Nutzungsbedingungen, auf die verwiesen wird.",
  legal_user_requests_processing_title: "Verarbeitung von Nutzeranfragen über n8n und den Incubateur des Ministeriums für nationale Bildung",
  legal_user_requests_processing_content: "Unsere Website verwendet eine technische Lösung, die von n8n entwickelt wurde, einem Open-Source-Tool, das vom Incubateur des Ministeriums für nationale Bildung gehostet wird. Dieser Dienst ermöglicht es über einen automatisierten Workflow, Nutzeranfragen in strukturierte Daten (JSON-Format) umzuwandeln, um mit einer souveränen KI der DINUM zu interagieren. Keine sensiblen Informationen werden ohne Verschlüsselung offengelegt oder übertragen, wodurch die Vertraulichkeit und Sicherheit des Austauschs gewährleistet wird.",
  legal_accessibility_title: "Barrierefreiheit",
  legal_accessibility_content: "Die Anwendung ist so konzipiert, dass sie mit der Nutzung am Computer kompatibel ist, einschließlich Dunkel-/Hellmodus, Tastaturnavigation und hohem Kontrast je nach Thema. Eine kontinuierliche Verbesserung der Barrierefreiheit im Einklang mit den RGAA-Empfehlungen ist in Arbeit.",
  legal_applicable_law_title: "Anwendbares Recht",
  legal_applicable_law_content: "Diese Website unterliegt französischem Recht. Im Falle eines Rechtsstreits sind die zuständigen Gerichte die im Bezirk von Lyon.",
  legal_external_libraries_title: "Verwendete externe Bibliotheken",
  legal_external_libraries_intro: "Die Caramel-Anwendung verwendet mehrere Open-Source-Bibliotheken unter den folgenden Lizenzen:",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Lizenz: CC BY 4.0, SIL OFL 1.1, MIT): Stellt die in der Benutzeroberfläche verwendeten Symbole bereit, um die Navigation und das visuelle Erlebnis zu verbessern.",
  legal_library_jszip: "<strong>JSZip</strong> (Lizenz: MIT oder GPLv3): Ermöglicht die Erstellung von .h5p-Dateien durch Komprimieren der erforderlichen Inhalte in ein Zip-Archiv.",
  legal_library_clientzip: "<strong>client-zip</strong> (Lizenz: MIT): Eine weitere Bibliothek zur Dateikomprimierung, die eine performante Alternative bietet, um .h5p-Archive direkt im Browser zu generieren.",
  legal_library_fflate: "<strong>fflate</strong> (Lizenz: MIT): Sehr schnelle Bibliothek zur Datenkompression und -dekompression, verwendet für die Erstellung der .mbz-Archive der Moodle-Module.",
  legal_library_tarjs: "<strong>tar-js</strong> (Lizenz: MIT): Ermöglicht die Erstellung von .tar-Archiven, ein notwendiger Schritt vor der Kompression zur Bildung der .mbz-Dateien der Moodle-Module.",
  legal_library_mammoth: "<strong>Mammoth</strong> (Lizenz: BSD 2-Clause): Ermöglicht die Konvertierung von Word-Dokumenten (.docx) in HTML, was den Import und die Integration von Inhalten aus Microsoft Word-Dateien erleichtert.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (Lizenz: Apache 2.0): Ermöglicht das Extrahieren von nativem Text aus PDF-Dateien direkt im Browser, ohne dass eine Serververarbeitung erforderlich ist.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (Lizenz: Apache 2.0): Engine zur optischen Zeichenerkennung (OCR), die das Extrahieren von Text aus Bildern (PNG, JPG, JPEG) und gescannten PDF-Dokumenten ermöglicht.",
  legal_library_mathjax: "<strong>MathJax</strong> (Lizenz: Apache 2.0): Wird für die Darstellung mathematischer Formeln (LaTeX) in der Vorschau verwendet.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (Lizenz: MIT): Ermöglicht die Vorschau von H5P-Inhalten direkt im Browser, ohne dass ein Server oder CMS (wie Moodle oder WordPress) erforderlich ist.",
  legal_library_jspdf: "<strong>jsPDF</strong> (Lizenz: MIT): JavaScript-Bibliothek zur Erzeugung von PDF-Dokumenten direkt im Browser, verwendet für den Export von Bildungsinhalten im PDF-Format.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (Lizenz: MIT): Erweiterung für jsPDF, die das Generieren strukturierter Tabellen in exportierten PDF-Dokumenten ermöglicht.",
  legal_library_docx: "<strong>docx</strong> (Lizenz: MIT): JavaScript-Bibliothek zur Erstellung von Word-Dokumenten (.docx) im Browser, verwendet für den Export von Bildungsinhalten im Microsoft Word-Format.",
  legal_library_ownership: "Jede Bibliothek bleibt Eigentum der jeweiligen Autoren und wird gemäß ihrer Lizenz(en) verwendet.",

  // ============================================================================
  // === BENACHRICHTIGUNGEN ===
  // ============================================================================
  no_notifications: "Keine Benachrichtigungen",
  clear_all: "Alle löschen",
  view: "Ansehen",
  today: "Heute",
  error: "Fehler",
  download: "Herunterladen",
  edit_content: "Bearbeiten",
  compatible_with: "Kompatibel mit:",
  preview_placeholder: "Vorschau demnächst verfügbar",
  previous: "Zurück",
  next: "Weiter",
  close_modal: "Schließen",
  loading: "Laden...",
  preview_error: "Vorschau dieser Datei nicht möglich",
  simulator_warning: "Vorschau über den Aktivitätssimulator: Die endgültige Darstellung in Éléa kann leicht abweichen.",
  editor_confirm_close_title: "Nicht gespeicherte Änderungen",
  editor_confirm_close_message: "Möchten Sie Ihre Änderungen vor dem Verlassen speichern?",
  editor_confirm_close_cancel: "Im Editor bleiben",
  editor_confirm_close_save: "Speichern und beenden",
  editor_confirm_close_discard: "Ohne Speichern beenden",

  // JSON-Editor
  editor_title_prefix: "Bearbeitung:",
  editor_loading: "Editor wird geladen...",
  editor_unknown_type: "Inhaltstyp nicht erkannt",
  editor_no_schema: "Schema für diesen Typ nicht verfügbar",
  editor_init_error: "Fehler beim Initialisieren des Editors",
  editor_save: "Speichern",
  editor_cancel: "Abbrechen",
  editor_unsaved_changes: "Nicht gespeicherte Änderungen",
  editor_confirm_discard: "Möchten Sie wirklich abbrechen? Nicht gespeicherte Änderungen gehen verloren.",
  editor_validation_errors: "Validierungsfehler",

  // Abschnitte
  editor_section_general: "Allgemeine Informationen",
  editor_section_question: "Frage",
  editor_section_questions: "Fragen",
  editor_section_answers: "Antworten",
  editor_section_answer: "Antwort",
  editor_section_feedback: "Feedback",
  editor_section_cards: "Karten",
  editor_section_sentences: "Sätze",
  editor_section_events: "Ereignisse",
  editor_section_words: "Wörter",
  editor_section_keywords: "Schlüsselwörter",
  editor_section_entries: "Einträge",
  editor_section_pairs: "Paare",
  editor_section_text: "Text",

  // Allgemeine Felder
  editor_title: "Titel",
  editor_description: "Beschreibung",
  editor_description_hint: "Anweisung für Schüler",
  editor_intro: "Einführung",
  editor_task_description: "Aufgabenstellung",
  editor_question_text: "Fragentext",

  // Karten
  editor_card: "Karte",
  editor_card_front: "Vorderseite",
  editor_card_front_placeholder: "Frage oder Begriff",
  editor_card_back: "Rückseite",
  editor_card_back_placeholder: "Antwort oder Definition",
  editor_card_tip: "Hinweis",
  editor_add_card: "Karte hinzufügen",

  // Antworten
  editor_answer: "Antwort",
  editor_answer_text: "Antworttext",
  editor_is_correct: "Richtig",
  editor_add_answer: "Antwort hinzufügen",

  // Hinweise & Feedback
  editor_tips_feedback: "Hinweise und Feedback",
  editor_tip: "Hinweis",
  editor_tip_optional: "Hinweis (optional)",
  editor_tips_optional: "Hinweise (optional)",
  editor_tip_front: "Hinweis Vorderseite",
  editor_tip_back: "Hinweis Rückseite",
  editor_chosen_feedback: "Feedback wenn ausgewählt",
  editor_not_chosen_feedback: "Feedback wenn nicht ausgewählt",
  editor_feedback_correct: "Feedback wenn richtig",
  editor_feedback_wrong: "Feedback wenn falsch",
  editor_overall_feedback: "Gesamtfeedback nach Punktzahl",

  // Feedback-Bereiche
  editor_feedback_ranges_label: "Feedback basierend auf der Punktzahl",
  editor_feedback_placeholder: "Feedback-Nachricht für diesen Bereich...",
  editor_add_range: "Bereich hinzufügen",

  // Richtig/Falsch
  editor_correct_answer: "Richtige Antwort",
  editor_true: "Richtig",
  editor_false: "Falsch",

  // Lückentext / Wörter ziehen
  editor_sentence: "Satz",
  editor_sentence_text: "Satztext",
  editor_add_sentence: "Satz hinzufügen",
  editor_blanks_hint: "Umschließen Sie die zu ratenden Wörter mit *Sternchen*",
  editor_text_with_blanks: "Text mit einzusetzenden Wörtern",
  editor_drag_words_hint: "Wörter zwischen *Sternchen* werden zu Drag-and-Drop-Elementen",

  // Zeitstrahl
  editor_event: "Ereignis",
  editor_add_event: "Ereignis hinzufügen",
  editor_start_date: "Startdatum",
  editor_end_date: "Enddatum",
  editor_event_title: "Titel des Ereignisses",
  editor_event_description: "Beschreibung",
  editor_event_tag: "Tag",

  // Kreuzworträtsel
  editor_word: "Wort",
  editor_add_word: "Wort hinzufügen",
  editor_clue: "Hinweis/Definition",
  editor_orientation: "Ausrichtung",
  editor_horizontal: "Horizontal",
  editor_vertical: "Vertikal",
  editor_crossword_answer_hint: "Das Wort in Großbuchstaben",

  // Aufsatz
  editor_keyword: "Schlüsselwort",
  editor_keyword_text: "Erwartetes Schlüsselwort",
  editor_keyword_weight: "Gewichtung",
  editor_add_keyword: "Schlüsselwort hinzufügen",

  // Glossar
  editor_entry: "Eintrag",
  editor_add_entry: "Eintrag hinzufügen",
  editor_term: "Begriff",
  editor_definition: "Definition",

  // Moodle
  editor_question: "Frage",
  editor_add_question: "Frage hinzufügen",
  editor_pair: "Paar",
  editor_add_pair: "Paar hinzufügen",
  editor_left_element: "Linkes Element",
  editor_right_element: "Rechtes Element",
  editor_choice: "Auswahl",
  editor_choice_text: "Auswahltext",
  editor_add_choice: "Auswahl hinzufügen",

  // Element-Aktionen
  editor_add_item: "Hinzufügen",
  editor_drag: "Ziehen",
  editor_duplicate: "Duplizieren",
  editor_delete: "Löschen",
  editor_confirm_delete: "Möchten Sie dieses Element wirklich löschen?",
  editor_min_items_reached: "Minimale Anzahl an Elementen erreicht",
  editor_max_items_reached: "Maximale Anzahl an Elementen erreicht",

  // Validierungsfehler
  editor_error_required: "Dieses Feld ist ein Pflichtfeld",
  editor_error_min_length: "Mindestens {0} Zeichen",
  editor_error_max_length: "Maximal {0} Zeichen",
  editor_error_pattern: "Ungültiges Format",
  editor_error_min_items: "Mindestens {0} Element(e)",
  editor_error_max_items: "Maximal {0} Element(e)",
  editor_error_number: "Muss eine Zahl sein",
  editor_error_min: "Minimum {0}",
  editor_error_max: "Maximum {0}",
  editor_error_feedback_ranges: "Bereiche müssen 0-100% ohne Überschneidungen abdecken",
  editor_error_no_correct: "Mindestens eine Antwort muss richtig sein",
  editor_error_date_format: "Ungültiges Datumsformat (erwartet: JJJJ,M,T)",
  editor_error_no_blanks: "Der Text muss mindestens ein Wort zwischen *Sternchen* enthalten",

  // QuizSet
  editor_library_type: "Bibliothekstyp",
  editor_question_title: "Fragentitel",
  editor_question_params: "Fragenparameter",
  editor_parameters: "Parameter",

  // Kreuzworträtsel
  editor_extra_clue: "Zusätzlicher Hinweis",

  // FindTheWords
  editor_word_list: "Wortliste",

  // SingleChoiceSet
  editor_answers: "Mögliche Antworten",

  // MarkTheWords
  editor_text_with_marks: "Text mit zu markierenden Wörtern",
  editor_mark_words_hint: "Umschließen Sie die zu markierenden Wörter mit *Sternchen*",

  // SortParagraphs
  editor_section_paragraphs: "Absätze",
  editor_paragraph: "Absatz",
  editor_add_paragraph: "Absatz hinzufügen",
  editor_paragraph_text: "Absatztext",

  // Summary
  editor_section_summaries: "Zusammenfassungen",
  editor_summary_item: "Zusammenfassungselement",
  editor_add_summary_item: "Element hinzufügen",
  editor_statement: "Aussage",
  editor_add_statement: "Aussage hinzufügen",
  editor_statement_text: "Aussagentext",

  // Moodle Test
  editor_question_type: "Fragentyp",

  // Moodle Page
  editor_section_blocks: "Blöcke",
  editor_block: "Block",
  editor_add_block: "Block hinzufügen",
  editor_block_type: "Blocktyp",
  editor_block_content: "Blockinhalt",

  // Spezifische Éléa-Aktivitäten
  // Glossar
  editor_glossary_name: "Glossarname",

  // Millionär
  editor_good_answer: "Richtige Antwort",
  editor_bad_answers: "Falsche Antworten",
  editor_bad_answer: "Falsche Antwort",
  editor_add_bad_answer: "Falsche Antwort hinzufügen",

  // Test (Fragenbank)
  editor_bank_name: "Bankname",
  editor_bank_description: "Bankbeschreibung",
  editor_question_name: "Fragenname",
  editor_question_feedback: "Allgemeines Feedback",
  editor_answer_fraction: "Punkte/Score",
  editor_answer_feedback: "Antwort-Feedback",
  editor_subquestion: "Unterfrage",
  editor_add_subquestion: "Unterfrage hinzufügen",
  editor_numerical_value: "Numerischer Wert",
  editor_numerical_tolerance: "Toleranz",
  editor_section_subquestions: "Unterfragen",
  editor_section_content: "Inhalt",
  editor_feedback_if_true: "Feedback wenn wahr",
  editor_feedback_if_false: "Feedback wenn falsch",

  // Nachrichten
  editor_save_success: "Änderungen gespeichert",
  editor_save_error: "Fehler beim Speichern",
  editor_regenerating: "Datei wird neu generiert...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Seite",
  doc_fmt_summary_header: "Inhaltsverzeichnis",
  doc_fmt_quiz_title: "Quiz",
  doc_fmt_instructions: "📝 Anweisungen: Beantworten Sie die folgenden Fragen.",
  doc_fmt_question_header: "Frage",

  // --- Shared properties ---
  doc_fmt_type: "Typ:",
  doc_fmt_feedbacks: "💬 Rückmeldungen:",
  doc_fmt_global_feedbacks: "Globales Feedback",
  doc_fmt_answers: "Antworten:",
  doc_fmt_correct_answer_true: "Richtige Antwort: WAHR ✓",
  doc_fmt_correct_answer_false: "Richtige Antwort: FALSCH ✓",
  doc_fmt_text_if_true: "Text wenn wahr:",
  doc_fmt_text_if_false: "Text wenn falsch:",
  doc_fmt_text_with_answers: "Text mit Antworten:",
  doc_fmt_text_with_marks: "Text mit zu markierenden Wörtern:",
  doc_fmt_marks_to_find: "Zu markierende Wörter:",
  doc_fmt_keywords_expected: "Erwartete Schlüsselwörter:",
  doc_fmt_accepted_answers: "Akzeptierte Antworten:",
  doc_fmt_text_to_complete: "Zu vervollständigender Text:",
  doc_fmt_also_called: "🏷️ Auch genannt:",
  doc_fmt_image_not_found: "⚠️ [Bild nicht gefunden]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Lernkarten",
  doc_fmt_card_index: "Karte",
  doc_fmt_card_front: "Vorderseite:",
  doc_fmt_card_back: "Rückseite:",
  doc_fmt_hint: "💡 Hinweis:",
  doc_fmt_crossword_title: "Kreuzworträtsel",
  doc_fmt_definitions_and_answers: "Definitionen und Antworten",
  doc_fmt_answer: "Antwort:",
  doc_fmt_extra_hint: "💡 Zusätzlicher Hinweis:",
  doc_fmt_timeline_events: "Ereignisse",
  doc_fmt_timeline_periods: "Zeiträume",
  doc_fmt_drag_the_words_title: "Wörter ziehen",
  doc_fmt_fill_in_the_blanks_title: "Lückentext",
  doc_fmt_mark_the_words_title: "Wörter markieren",
  doc_fmt_glossary_title: "Glossar",
  doc_fmt_term_index: "Begriff",
  doc_fmt_chart_title: "Diagramm",
  doc_fmt_data: "Daten",
  doc_fmt_summary_title: "Zusammenfassung",
  doc_fmt_claim_index: "Behauptung",
  doc_fmt_multiple_choice_title: "Multiple-Choice-Frage",
  doc_fmt_single_choice_set_title: "Satz von Single-Choice-Fragen",
  doc_fmt_true_false_title: "Richtig/Falsch-Frage",
  doc_fmt_dialog_cards_title: "Dialogkarten",
  doc_fmt_hint_front: "💡 Hinweis (Vorderseite):",
  doc_fmt_hint_back: "💡 Hinweis (Rückseite):",
  doc_fmt_sort_paragraphs_title: "Absätze ordnen",
  doc_fmt_paragraphs_ordered: "Absätze in der richtigen Reihenfolge",
  doc_fmt_find_the_words_title: "Wortsuche",
  doc_fmt_words_to_find: "Zu findende Wörter",
  doc_fmt_matching_title: "Zuordnung",
  doc_fmt_matching_instructions: "📝 Anweisungen: Ordnen Sie jedes Element seiner Entsprechung zu.",
  doc_fmt_pairs_to_match: "Zuzuordnende Paare",
  doc_fmt_millionnaire_title: "Wer wird Millionär?",
  doc_fmt_millionnaire_instructions: "📝 Anweisungen: Finden Sie die richtige Antwort unter den vier Möglichkeiten.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Offene Frage",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "Test",
  doc_fmt_associations: "Zuordnungen:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Multiple-Choice (QCM)",
  doc_fmt_type_matching: "Zuordnung",
  doc_fmt_type_numerical: "Numerisch",
  doc_fmt_type_truefalse: "Richtig/Falsch",
  doc_fmt_type_shortanswer: "Kurzantwort",
  doc_fmt_type_cloze: "Lückentext (Cloze)",
  doc_fmt_type_blanks: "Lückentext",
  doc_fmt_type_dragtext: "Wörter ziehen",
  doc_fmt_type_markwords: "Wörter markieren",
  doc_fmt_type_essay: "Offene Frage",
  doc_fmt_type_default: "Frage",

  // Neue Schlüssel für die pädagogische Struktur Aussage/Korrektur
  doc_fmt_correction_title: "Korrektur",
  doc_fmt_proposed_answers: "Vorschläge:",
  doc_fmt_correct_answer: "Richtige Antwort",
  doc_fmt_correct_answers: "Richtige Antworten:",
  doc_fmt_true: "Wahr",
  doc_fmt_false: "Falsch",
  doc_fmt_words_to_place: "Zu platzierende Wörter:",
  doc_fmt_completed_text: "Vervollständigter Text:",
  doc_fmt_text_to_mark: "Text, in dem die Wörter zu finden sind:",
  doc_fmt_words_count_to_find: "Anzahl der zu findenden Wörter",
  doc_fmt_words_to_mark: "Zu markierende Wörter:",
  doc_fmt_answer_space: "Platz für die Antwort:",
  doc_fmt_open_answer: "Offene Antwort - Bewertung nach den vom Lehrer festgelegten Kriterien.",
  doc_fmt_definitions: "Definitionen",
  doc_fmt_letters: "Buchstaben",
  doc_fmt_summary_instructions: "Wählen Sie für jede Gruppe die richtige Aussage.",
  doc_fmt_sort_instructions: "Bringen Sie die folgenden Absätze in die richtige Reihenfolge.",
  doc_fmt_paragraphs_to_sort: "Zu ordnende Absätze",
  doc_fmt_correct_order: "Richtige Reihenfolge",
  doc_fmt_find_instructions: "Finden Sie",
  doc_fmt_hidden_words: "versteckte Wörter im Gitter.",
  doc_fmt_hints: "Hinweise",
  doc_fmt_flashcards_instructions: "Suchen Sie für jede Karte die Antwort, die der Frage entspricht.",
  doc_fmt_elements_to_match: "Zu ordnende Elemente:",
  doc_fmt_possible_matches: "Mögliche Entsprechungen:",
  doc_fmt_correct_associations: "Richtige Zuordnungen:",

};