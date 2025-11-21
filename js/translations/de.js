const translations_de = {
    subtitle: "KI-gestützte Erstellung von Ressourcen und Aktivitäten für Magistère und Éléa",
    help_button: "Hilfe",
    help_modal_title: "🚀 Umfassender Caramel-Leitfaden für Lehrkräfte",
    help_modal_content: `
    <p>Willkommen bei <strong>Caramel</strong>! Dieser Leitfaden führt dich Schritt für Schritt durch alles – auch wenn du gerade erst beginnst. Unser Ziel ist es, dir zu helfen, interaktive Lernaktivitäten einfach und effizient zu erstellen.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Beschreiben</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Wählen</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generieren</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Herunterladen</a>
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
            Mit dieser leistungsstarken Option kann die Generierung auf bereitgestellten Inhalten basieren. Du kannst entweder <strong>Text einfügen</strong> oder <strong>eine PDF-Datei hochladen</strong>.
            <br><strong><i class="fas fa-lock"></i> Datenschutz:</strong> Keine Sorge – die Verarbeitung erfolgt <strong>vollständig lokal auf deinem Computer</strong>. Es werden keine Daten ins Internet gesendet.</p>
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
            <h5><i class="fas fa-rocket"></i> Option A: Mit einem Klick generieren</h5>
            <p>Der Schnellweg. Klicke auf <button class="help-btn-example-llm">Mit einem Klick generieren</button>, damit die KI den Inhalt erstellt und direkt rechts im Ergebnisbereich platziert. Über den kleinen Pfeil am rechten Rand des Buttons kannst du zwischen KI-Modellen (schnell, leistungsstark ...) wählen.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Option B: Externe KI verwenden</h5>
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
        <h4><span class="help-step-number">4</span> Aktivität herunterladen und integrieren</h4>
        <p>Wenn der Inhalt bereit ist, klicke auf den Download-Button (z. B. <button class="help-btn-example-download">H5P generieren</button>). So integrierst du Dateien in Éléa/Moodle:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (H5P-Aktivitäten)</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>Einfache Methode:</strong> Bearbeitungsmodus im Kurs aktivieren und die .h5p-Datei direkt in den gewünschten Abschnitt ziehen und ablegen. Ideal für schnellen Einsatz ohne komplexes Teilen.</li>
                        <li><strong>Empfohlene Methode (für Designer:innen):</strong> „Aktivität oder Material anlegen“ → „Interaktiver Inhalt (H5P)“ → im Feld „Datei“ deine .h5p hochladen. So wird die Aktivität beim Teilen deines Kurses korrekt mitgenommen.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Seite, Millionär, Zuordnung, MC)</summary>
                <div class="import-content">
                    <p>Dieses Format importiert eine vollständige Aktivität in deinen Kurs.</p>
                    <ol>
                        <li>Im Kurs über das Zahnradmenü „Wiederherstellen“ wählen.</li>
                        <li>Deine .mbz-Datei in den Importbereich ziehen und ablegen.</li>
                        <li>Den Schritten über „Weiter“ folgen. Die Aktivität wird dem Kurs hinzugefügt.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> und <span class="help-badge-file">GIFT</span> (Test-Aktivität)</summary>
                <div class="import-content">
                    <p>Diese Formate importieren Fragen in die „Fragensammlung“.</p>
                    <ol>
                        <li>Im Kursmenü „Mehr“ → „Fragensammlung“.</li>
                        <li>Auf den Reiter „Import“ klicken.</li>
                        <li>Format „Moodle XML“ oder „GIFT“ wählen.</li>
                        <li>Datei in den Bereich „Import“ ziehen und bestätigen.</li>
                        <li>Die Fragen sind nun in der Sammlung und können einem „Test“ hinzugefügt werden.</li>
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
                        <li>Im Seiten-Editor auf das Icon zum Umschalten in den HTML-Modus klicken (oft dargestellt durch \`</\>\`).</li>
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
    fast_mode: "Schnellmodus",
    guided_mode: "Erweiterter Modus",
    who_are_you: "Wer sind Sie? (z.B. Lehrer, Ausbilder...)",
    what_to_address: "Was möchten Sie behandeln? (z.B. Die Natur eines Winkels in der 6. Klasse...)",
    discipline: "Disziplin (z.B. Geschichte)",
    theme: "Thema (z.B. Die Französische Revolution)",
    level: "Niveau (z.B. Zweites Jahr der Berufsschule)",
    number_of_elements: "Anzahl der Elemente (z.B. 10)",
    additional_info: "Zusätzliche Informationen...",
    generate_prompts: "Prompts generieren",
    h5p_tab: "H5P",
    moodle_tab: "Éléa/Moodle-Module",

    // General Context (Advanced Mode)
    prompt_expert_intro: "Sie sind ein erfahrener Pädagogikprofessor, der den Ton und das Vokabular an den Inhalt der aktuellen Lehrpläne und das Niveau der Schüler für den Kurs von ",
    prompt_context_title: "**Kontext :**",
    prompt_subject: "- **Fach :**",
    prompt_student_level: "- **Schülerlevel :**",
    prompt_theme: "- **Thema :**",
    prompt_number_of_elements: "- **Anzahl der Elemente :**",
    prompt_additional_info: "- **Zusätzliche Informationen :**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "Ich bin ein(e) **",
    prompt_simple_intro_part2: "** und ich möchte **",
    prompt_language_instruction: "Der generierte Inhalt muss auf Deutsch sein, es sei denn, in der Anfrage wird eine andere Sprache angegeben.",
    prompt_code_block_instruction: "Du musst das Ergebnis in einem Codeblock generieren.",

    // Timeline Prompt
    timeline_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Timeline\"-Aktivität erstellt.",
    timeline_prompt_mission: "**Ihre Mission :**",
    timeline_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P Timeline-Aktivität. Das JSON muss direkt verwendbar sein.",
    timeline_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    timeline_prompt_json_structure_main_object: "Das Hauptobjekt muss einen \"timeline\"-Schlüssel enthalten. Dieses \"timeline\"-Objekt muss enthalten :",
    timeline_prompt_headline: "`headline`: Ein allgemeiner Titel für die Zeitleiste.",
    timeline_prompt_text: "`text`: Ein kurzer Einleitungsparagraph.",
    timeline_prompt_asset: "`asset`: Ein Objekt für das Titelbild mit `media` (URL), `caption` (Bildunterschrift) und `credit` (Quelle).",
    timeline_prompt_date_array: "`date`: Ein Array mit ${nombreQuestions} Objekten, die jeweils ein Ereignis darstellen.",
    timeline_prompt_era_array: "`era`: Ein Array von Objekten zur Definition von Zeiträumen, die mehrere Ereignisse abdecken.",
    timeline_prompt_content_rules_title: "**Inhaltsregeln :**",
    timeline_prompt_rule1: "1.  Jedes Ereignis im `date`-Array muss haben :",
    timeline_prompt_rule1_startDate: "-   `startDate` und `endDate`: Datum im Format \"JJJJ,MM,TT\" oder \"JJJJ\". Verwenden Sie `endDate`, um einen Zeitraum zu definieren.",
    timeline_prompt_rule1_headline: "-   `headline`: Ereignistitel.",
    timeline_prompt_rule1_text: "-   `text`: Textbeschreibung. Verwende `*Wort*` für fett, `**Wort**` für kursiv und `\\n` für Zeilenumbrüche.",
    timeline_prompt_rule1_asset: "-   `asset`: Ein optionales Objekt für ein Bild, das das Ereignis illustriert.",
    timeline_prompt_rule1_tag: "- `tag`: Ein Schlüsselwort, das den Zeitraum charakterisiert (z.B. 'Geschichte', 'Wissenschaft').",
    timeline_prompt_rule2: "2.  Suchen Sie für jedes `asset` aktiv nach einem relevanten, lizenzfreien Bild (z. B. Wikimedia Commons). Die URL in `media` muss ein direkter und gültiger Link sein. Geben Sie die Quelle und die Lizenz in `credit` an. Wenn kein passendes Bild gefunden wird, lassen Sie das `asset`-Objekt vollständig weg.",
    timeline_prompt_rule3: "3.  Fügen Sie für jeden Zeitraum (`era`) ein `text`-Feld mit einer kurzen Beschreibung und einem `tag` hinzu.",
    timeline_prompt_example_json_title: "**Beispiel-JSON-Struktur :**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Titel der Zeitleiste",
"text": "Einführung in das Thema der Zeitleiste.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Beginn des Ersten Weltkriegs",
"text": "Österreich-Ungarn erklärt Serbien den Krieg.",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "Erzherzog Franz Ferdinand kurz vor seiner Ermordung.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "Krieg"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Waffenstillstand von 1918",
"text": "Unterzeichnung des Waffenstillstands in Rethondes, der das Ende der Kämpfe markiert.",
"tag": "Vertrag"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Erster Weltkrieg",
"text": "Dies ist die Zeit des Großen Krieges.",
"tag": "Historische Periode"
}
]
}
}
\`\`\` `,
    timeline_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, ohne Kommentare. Das Ergebnis wird direkt von einem anderen Tool verwendet.",

    // Crossword Prompt
    crossword_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Crossword\"-Aktivität erstellt.",
    crossword_prompt_mission: "**Ihre Mission :**",
    crossword_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P-Kreuzworträtselaktivität.",
    crossword_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    crossword_prompt_json_structure_main_object: "Das Objekt muss enthalten :",
    crossword_prompt_title: "`title`: Ein Titel für die Aktivität.",
    crossword_prompt_words_array: "`words`: Ein Array von ${nombreQuestions} Objekten, jeweils mit :",
    crossword_prompt_answer: "`answer`: Das zu erratende Wort.",
    crossword_prompt_clue: "`clue`: Die passende Definition. Es ist verboten, das gesuchte Wort im Hinweis zu nennen.",
    crossword_prompt_extra_clue_optional: "`extraClue` (optional): Ein Objekt mit einem zusätzlichen Hinweis. Der Hinweistext darf `*Wort*` für fett, `**Wort**` für kursiv und `\\n` für Zeilenumbrüche verwenden. Die KI soll beurteilen, ob ein zusätzlicher Hinweis sinnvoll ist.",
    crossword_prompt_task_description: "`taskDescription`: Eine klare, kontextualisierte Anweisung. Verwende `*Wort*` für fett, `**Wort**` für kursiv und `\\n` für Zeilenumbrüche. Nach einem Zeilenumbruch präzisiere die Regel zu Zusammensetzungen: \"Zusammengesetzte Wörter ohne Leerzeichen oder Bindestrich als ein einziges Wort schreiben.\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",
    crossword_prompt_content_rules_title: "**Inhaltsregeln:**",
    crossword_prompt_rule1: "1.  STRIKTE REGEL: Die Wörter (`answer`) dürfen nur Buchstaben enthalten. Zusammensetzungen, Akronyme oder Wortgruppen werden ohne Leerzeichen, Bindestriche oder andere Zeichen zu einem einzigen Wort verschmolzen.",
    crossword_prompt_rule2: "2.  Definitionen (`clue`) müssen kurz und präzise sein.",
    crossword_prompt_rule3: "3.  Der Rest der JSON-Struktur (Verhalten, Thema usw.) muss unverändert bleiben.",
    crossword_prompt_example_json_title: "**Beispiel-JSON für ein Wort :**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Kreuzworträtsel zur Biologie",
"words": [
{
"answer": "Zelle",
"clue": "Basiseinheit des Lebens.",
"extraClue": {
"params": {
"text": "Sie kann *tierisch* oder *pflanzlich* sein."
}
}
},
{
"answer": "DNA",
"clue": "Molekül, das die genetische Information trägt."
}
],
"taskDescription": "*Vervollständige* das **Kreuzworträtsel**."
}
\`\`\` `,   
    crossword_prompt_generate_only_json: "Generieren Sie das vollständige und gültige JSON, füllen Sie den Titel, die Beschreibung und das \"words\"-Array aus, ohne weitere Kommentare.",

    // Crossword UI translations
    crossword_across: "Horizontal",
    crossword_down: "Vertikal",
    crossword_check_answer: "Überprüfen",
    crossword_try_again: "Erneut versuchen",
    crossword_show_solution: "Lösung anzeigen",
    crossword_extra_clue: "Zusätzlicher Hinweis",
    crossword_close_window: "Fenster schließen",
    crossword_submit_answer: "Absenden",

    // Essay Prompt
    essay_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Essay\"-Aktivität erstellt.",
    essay_prompt_mission: "**Ihre Mission :**",
    essay_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P Essay-Aktivität.",
    essay_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    essay_prompt_json_structure_main_object: "Das Objekt muss enthalten :",
    essay_prompt_task_description: "`taskDescription`: Klare Anweisungen, die den Schüler einladen, einen Text zum Thema zu schreiben. Verwenden Sie `*Wort*` für Fett, `**Wort**` für Kursiv und `\\n` für Zeilenumbrüche.",
    essay_prompt_keywords_array: "`keywords`: Ein Array von ${nombreQuestions} Objekten, die jeweils ein Schlüsselwort definieren, das das System in der Antwort des Schülers finden soll.",
    essay_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",
    essay_prompt_content_rules_title: "**Inhaltsregeln :**",
    essay_prompt_rule1: "1.  Jedes Objekt in `keywords` muss den Schlüssel `keyword` mit dem zu suchenden Wort enthalten.",
    essay_prompt_rule2: "2.  Schlüsselwörter müssen relevant und wesentlich für die Bewertung des Verständnisses des Themas sein.",
    essay_prompt_rule3: "3.  Die JSON-Struktur (Verhalten usw.) muss beibehalten werden.",
    essay_prompt_rule4: "4. Die Anweisung (`taskDescription`) sollte zum Schreiben anregen, ohne die in `keywords` aufgeführten Schlüsselwörter zu verwenden, außer dem Namen des Themas, falls dies zum Verständnis erforderlich ist.",
    essay_prompt_example_json_title: "**Beispiel-JSON für ein Schlüsselwort :**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "Schreibe einen kurzen Text, der die Photosynthese erklärt.",
"keywords": [
{
"keyword": "Licht",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "Chlorophyll",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "Generieren Sie das vollständige und gültige JSON, füllen Sie die Anweisungen und die Liste der Schlüsselwörter aus, ohne weitere Kommentare.",

    // Moodle-XML-Eingabeaufforderung
    moodle_xml_prompt_role: "Du bist Expert·in für Instruktionsdesign. Deine Aufgabe ist es, den Inhalt für eine Test-Aktivität mit zugehöriger Moodle/Éléa-Fragensammlung zu erstellen, indem du ein gültiges JSON-Objekt generierst.",
    moodle_xml_prompt_intro: "Ich möchte ein Quiz mit ${nombreQuestions} Fragen erstellen.",
    moodle_xml_prompt_content_title: "**Regeln für den Inhalt:**",
    moodle_xml_prompt_content_rule1: "- Falsche Antworten müssen plausibel, aber falsch sein.",
    moodle_xml_prompt_content_rule2: "- Der Schwierigkeitsgrad der Fragen soll variieren.",
    moodle_xml_prompt_content_rule3: "- Die Formulierungen sollen einfach und präzise sein.",
    moodle_xml_prompt_content_rule4: "- Das Feedback soll die richtige Antwort kurz erklären.",
    moodle_xml_prompt_question_types_intro: "**Erwartete JSON-Struktur:**\nDas Hauptobjekt muss folgende Schlüssel enthalten:\n- `bank_name`: Ein kurzer, beschreibender Name für die Fragensammlung.\n- `bank_description`: Ein Satz, der den Inhalt der Sammlung beschreibt.\n- `questions`: Ein Array von Objekten, wobei jedes Objekt eine Frage darstellt und `type` sowie `content` enthalten muss.",
    moodle_xml_prompt_question_type_multichoice: `
- **Für den Typ \`multichoice\` (MCQ):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Fragetitel",
      "questiontext": "Fragestellung.",
      "feedback": "Allgemeines Feedback.",
      "answers": [
        { "text": "Antwort 1", "fraction": 100, "feedback": "Feedback bei Auswahl." },
        { "text": "Antwort 2", "fraction": 0, "feedback": "Feedback bei Auswahl." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **Für den Typ \`matching\` (Zuordnung):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Fragetitel",
      "questiontext": "Fragestellung.",
      "feedback": "Allgemeines Feedback.",
      "subquestions": [
        { "text": "Fragetext 1", "answer": "Antwort 1" },
        { "text": "Fragetext 2", "answer": "Antwort 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **Für den Typ \`numerical\` (Numerisch):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Fragetitel",
      "questiontext": "Fragestellung.",
      "feedback": "Allgemeines Feedback.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "Feedback zur Antwort." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **Für den Typ \`truefalse\` (Wahr/Falsch):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Fragetitel",
      "questiontext": "Fragestellung.",
      "feedback": "Allgemeines Feedback.",
      "answer": { "value": true, "feedback_true": "Feedback bei Wahr.", "feedback_false": "Feedback bei Falsch." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **Für den Typ \`shortanswer\` (Kurzantwort):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Fragetitel",
      "questiontext": "Fragestellung.",
      "feedback": "Allgemeines Feedback.",
      "answers": [
        { "text": "Exakte Antwort 1", "fraction": 100, "feedback": "Feedback bei Auswahl." },
        { "text": "Alternative Antwort", "fraction": 100, "feedback": "Feedback bei Auswahl." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **Für den Typ \`cloze\` (Lückentext):**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Fragetitel",
      "questiontext": "Dies ist ein Text mit einer Lücke {1:SHORTANSWER:=Richtige Antwort~Feedback} und einer weiteren {1:MULTICHOICE:=Richtige Antwort~Falsche Antwort}.",
      "feedback": "Allgemeines Feedback."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**Abschließende Anweisungen:**",
    moodle_xml_prompt_form_rule1: "Verteile die Fragen gleichmäßig auf die verschiedenen Typen.",
    moodle_xml_prompt_generate_only_json: "Erzeuge ausschließlich gültigen JSON-Code, ohne Kommentare. Das Ergebnis muss ein einzelnes JSON-Objekt mit dem Schlüssel `questions` sein.",

    // Erstellung Test Éléa
    moodle_xml_success_generation: "Datei {fileName} erfolgreich erstellt!",
    test_error_creation_mbz: "Fehler beim Erstellen der MBZ für den Test:",
    test_success_generation: "Datei {fileName} erfolgreich erstellt!",
    test_error_generic: "Fehler:",
    test_backup_log: "Sicherung automatisch von Caramel erstellt\n",

    // GIFT Prompt
    gift_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften und erstellen eine Fragenbank für eine Moodle/Éléa-Testaktivität im GIFT-Format.",
    gift_prompt_intro: "Ich möchte ein Quiz mit ${nombreQuestions} Fragen erstellen.",
    gift_prompt_format_info: "Das Quiz muss im GIFT-Format vorliegen und für den Import in Moodle bestimmt sein.",
    gift_prompt_question_quality: "Jede Frage muss klar, prägnant und eindeutig sein. Sie muss detailliertes Feedback enthalten.",
    gift_prompt_code_format_intro: "Der Code muss genau das gleiche Format haben wie der unten angegebene:",
    gift_prompt_example_question_comment: "// Frage: 1  Name: Was ist das zentrale Objekt unseres Sonnensystems?",
    gift_prompt_example_question_text: "::Was ist das zentrale Objekt unseres Sonnensystems?::Was ist das zentrale Objekt unseres Sonnensystems?{",
    gift_prompt_example_answer_correct: "=Die Sonne#Genau! Die Sonne ist der zentrale Stern unseres Sonnensystems. Gut gemacht!",
    gift_prompt_example_answer_incorrect1: "~Der Mond#Falsch. Der Mond ist ein natürlicher Satellit der Erde. Die Sonne ist das zentrale Objekt.",
    gift_prompt_example_answer_incorrect2: "~Jupiter#Falsch. Jupiter ist ein Gasriesenplanet. Die Sonne ist das zentrale Objekt.",
    gift_prompt_example_answer_incorrect3: "~Die Erde#Falsch. Die Erde ist der Planet, auf dem wir leben. Die Sonne ist das zentrale Objekt.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "Das Quiz muss verschiedene Fragetypen zufällig enthalten :",
    gift_prompt_question_type_multichoice: "- Multiple-Choice-Fragen (MCQ), mit 1 richtigen Antwort und 3 Ablenkern.",
    gift_prompt_question_type_truefalse: "- Wahr/Falsch-Fragen (truefalse).",
    gift_prompt_question_type_numerical: "- numerische Fragen (numerical) mit einem akzeptablen Fehlerbereich.",
    gift_prompt_question_type_matching: "- Zuordnungsfragen (matching) mit mindestens 4 Paaren.",
    gift_prompt_generate_only_gift: "Generieren Sie das Quiz direkt im GIFT-Format, ohne Kommentare oder zusätzliche Tags. Halten Sie sich strikt an das beschriebene Format, da ich das Ergebnis in ein anderes Tool einfügen werde, das dieses Format erwartet. Erstellen Sie die Antwort in vorformatiertem Code.",

    // Flashcards Prompt
    flashcards_prompt_role: "Du bist ein Experte für Lehrdesign und erstellst eine H5P-„Flashcards“-Aktivität.",
    flashcards_prompt_mission: "**Deine Aufgabe:**",
    flashcards_prompt_generate_json: "Erstelle ein vollständiges und gültiges JSON-Objekt für eine H5P-Flashcards-Aktivität. Das JSON muss direkt verwendbar sein.",
    flashcards_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    flashcards_prompt_json_structure_main_object: "Das Objekt muss enthalten:",
    flashcards_prompt_title: "`title`: Einen passenden Titel für die Aktivität.",
    flashcards_prompt_description: "`description`: Eine klare Anweisung für den Lernenden.",
    flashcards_prompt_association_principle: "Vorder- und Rückseite müssen durch ein einziges, konsistentes Kriterium verbunden sein (z. B.: Definition→Begriff, Figur→Anzahl der Seiten, Ereignis→Datum, Autor→Werk). Verwende dieselbe Beziehung für alle Karten und formuliere die Anweisung so: „Ordne jedes X dem Y zu.“ Antworten (`answer`) sollten normalisiert sein: ein einfaches Wort oder eine Zahl, klein geschrieben, ohne Artikel oder Satzzeichen; Zahlen in Ziffern.",
    flashcards_prompt_cards_array: "`cards`: Ein Array von ${nombreQuestions} Objekten, wobei jedes Objekt eine Karte darstellt und enthält:",
    flashcards_prompt_text: "`text`: Die Frage oder der zu erratende Begriff (Vorderseite).",
    flashcards_prompt_answer: "`answer`: Die Antwort oder Definition (Rückseite). Wichtig: `answer` darf nur ein einfaches Wort oder eine Zahl enthalten, keine zusammengesetzten oder getrennten Wörter.",
    flashcards_prompt_tip: "`tip` (optional): Ein Hinweis, der dem Lernenden hilft, wenn die Frage schwierig ist. Füge nur dann einen Hinweis hinzu, wenn es sinnvoll ist.",
    flashcards_prompt_tip_formatting: "Für Hinweise (`tip`) kannst du `*Wort*` für Fett und `**Wort**` für Kursiv verwenden, um wichtige Informationen hervorzuheben.",
    flashcards_prompt_example_json_title: "**Beispiel-JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "Die Hauptstädte Europas",
"description": "Merke dir die Hauptstadt jedes Landes. Klicke auf die Karte, um die Antwort zu sehen.",
"cards": [
{
"text": "Die Hauptstadt von Frankreich",
"answer": "Paris"
},
{
"text": "Die Hauptstadt der Niederlande",
"answer": "Amsterdam",
"tip": "<p>Es ist die Stadt der <strong>Kanäle</strong> und der Tulpen!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, ohne Kommentare.",

    // QuizSet Prompt
    quiz_set_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der Inhalte für eine \"H5P Quiz (Question Set)\"-Aktivität erstellt.",
    quiz_set_prompt_mission: "**Ihre Mission :**",
    quiz_set_prompt_generate_json: "Generieren Sie ein JSON-Objekt **nur für den Inhalt** eines H5P-Quiz. Das JSON muss direkt als `content.json`-Datei verwendbar sein.",
    quiz_set_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    quiz_set_prompt_json_structure_main_object: "Das Hauptobjekt muss die folgenden Schlüssel enthalten :",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: Ein Array mit ${nombreQuestions} Objekten, die jeweils eine Frage darstellen.",
    quiz_set_prompt_content_rules_title: "**Regeln für den Frageninhalt :**",
    quiz_set_prompt_rule1: "1.  Jedes Fragenobjekt muss die Schlüssel `library`, `params` und `subContentId` enthalten.",
    quiz_set_prompt_rule2: "2.  **Struktur:** Jede Frage muss ein Objekt mit den Schlüsseln `library`, `metadata` und `params` sein.",
    quiz_set_prompt_rule3: "3.  Variieren Sie die Fragetypen. Verwenden Sie die folgenden Bibliotheken mit ihren genauen Versionen :",
    quiz_set_prompt_rule4: "4.  **Feedback (ENTSCHEIDENDE REGEL):** Für **alle Fragetypen** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`) **müssen** Sie ein `overallFeedback` mit genau 6 Bewertungsbereichen erstellen: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Fügen Sie für `TrueFalse`-Fragen zusätzlich die Felder `feedbackOnCorrect` und `feedbackOnWrong` hinzu. Das Feedback muss wohlwollend, schrittweise und immer positiv formuliert sein.",
    quiz_set_prompt_rule5: "5.  **Inhalt:** Der Inhalt in `params` muss pädagogisch relevant sein, mit plausiblen Ablenkern für MCQs und zusammenhängenden Texten für andere Aktivitäten.",
    quiz_set_prompt_rule6: "6.  **Einfachheit:** Fügen Sie keine Bilder oder überflüssige Verhaltensparameter hinzu. Halten Sie die Struktur einfach wie in den Beispielen.",
    quiz_set_prompt_example_json_title: "**Beispielstrukturen für jeden zulässigen Fragetyp:**",
    quiz_set_example_true_false: "Wahr/Falsch :",
    quiz_set_example_multiple_choice: "Multiple-Choice (MC) :",
    quiz_set_example_fill_in_the_blanks: "Lückentext :",
    quiz_set_example_drag_the_words: "Wörter ziehen :",
    quiz_set_example_mark_the_words: "Wörter markieren :",
    quiz_set_example_essay: "Aufsatz :",
    quiz_set_prompt_generate_only_json: "Generieren Sie nur das gültige JSON, beginnend mit `{\"progressType\": \"dots\", ...}`, ohne Kommentare.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Titel der Wahr/Falsch-Frage" },
        "params": {
            "question": "Ist Frankreich ein Land?",
            "correct": "true",
            "feedbackOnCorrect": "Das ist richtig! Frankreich ist in der Tat ein Land.",
            "feedbackOnWrong": "Falsch. Frankreich ist international als Land anerkannt.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Titel der MCQ" },
        "params": {
            "question": "Was ist die Hauptstadt von Frankreich?",
            "answers": [
                { "text": "Paris", "correct": true },
                { "text": "Berlin", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "Titel des Lückentextes" },
        "params": {
            "questions": ["Paris ist die *Hauptstadt* von Frankreich."],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "Titel der Drag-the-Words-Aktivität" },
        "params": {
            "taskDescription": "Vervollständige den Satz.",
            "textField": "*Paris* ist die Hauptstadt von Frankreich.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "Titel der Mark-the-Words-Aktivität" },
        "params": {
            "taskDescription": "Markiere die Hauptstadt.",
            "textField": "Die Hauptstadt von Frankreich ist *Paris*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "Titel des Aufsatzes" },
        "params": {
            "taskDescription": "Was ist die Hauptstadt von Frankreich?",
            "keywords": [
                { "keyword": "Paris", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Accordion\"-Aktivität erstellt.",
    glossary_prompt_mission: "**Ihre Mission :**",
    glossary_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für ein H5P Akkordeon-Glossar. Das JSON muss direkt verwendbar sein.",
    glossary_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    glossary_prompt_json_structure_main_object: "Generieren Sie ein Array von ${nombreQuestions} JSON-Objekten.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: Das zu definierende Wort oder der Ausdruck.",
    glossary_prompt_content: "`text`: Die Definition. Verwende `*Wort*` für fett, `**Wort**` für kursiv und `\\n` für Zeilenumbrüche.",
    glossary_prompt_content_rules_title: "**Inhaltsregeln:**",
    glossary_prompt_rule1: "1.  Definitionen müssen klar, prägnant und an das Niveau der Schüler angepasst sein.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Beispiel-JSON für einen Eintrag :**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Photosynthese",
"text": "Prozess, bei dem grüne Pflanzen Sonnenlicht in Energie umwandeln."
},
{
"title": "Zelle",
"text": "Grundeinheit aller Lebewesen."
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, ohne Kommentare.",

    // Summary Prompt
    summary_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Summary\"-Aktivität erstellt.",
    summary_prompt_mission: "**Ihre Mission :**",
    summary_prompt_generate_json: "Generieren Sie ein vollständiges JSON-Objekt für eine H5P Summary-Aktivität. Das JSON muss direkt verwendbar sein.",
    summary_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    summary_prompt_json_structure_main_object: "Das Objekt muss die folgenden Schlüssel enthalten:",
    summary_prompt_intro_field: "`intro`: Ein einleitender Satz für die Aktivität (z.B. \"Wählen Sie die richtige Aussage.\").",
    summary_prompt_summaries_array: "`summaries`: Ein Array von ${nombreQuestions} Objekten, die jeweils einen Zusammenfassungsschritt darstellen.",
    summary_prompt_summary_object: "Jedes Objekt in `summaries` muss enthalten:",
    summary_prompt_summary_array: "- `summary`: Ein Array von Sätzen.",
    summary_prompt_tip_field: "- `tip` (optional, aber empfohlen): Ein Hinweis, um dem Schüler zu helfen.",
    summary_prompt_content_rules_title: "**Inhaltsregeln :**",
    summary_prompt_rule1: "1.  In jedem \"summary\"-Array ist der **erste Satz korrekt**.",
    summary_prompt_rule2: "2.  Nachfolgende Sätze sind plausible, aber falsche Ablenker.",
    summary_prompt_rule3: "3.  Alle richtigen Sätze müssen eine kohärente Zusammenfassung bilden.",
    summary_prompt_example_json_title: "**Beispiel-JSON für einen Schritt :**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "Dies ist der richtige Satz.",
    "Dies ist ein Ablenker.",
    "Dies ist ein weiterer Ablenker."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",
    summary_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, ohne Kommentare.",

    // Summary UI translations
    summary_intro: "Wählen Sie die richtige Aussage.",
    summary_solved_label: "Fortschritt:",
    summary_score_label: "Falsche Antworten:",
    summary_result_label: "Ihr Ergebnis",
    summary_feedback: "Sie haben @score von @total Aussagen (@percent %) richtig.",
    summary_label_correct: "Richtig.",
    summary_label_incorrect: "Falsch! Bitte versuchen Sie es erneut.",
    summary_label_correct_answers: "Richtige Antworten.",
    summary_tip_button_label: "Tipp anzeigen",
    summary_score_bar_label: "Sie haben :num von :total Punkten erreicht",
    summary_progress_text: "Fortschritt :num von :total",
    summary_alternative_incorrect_label: "Falsch",

    // Drag the Words Prompt
    drag_word_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Drag the Words\"-Aktivität erstellt.",
    drag_word_prompt_mission: "**Ihre Mission :**",
    drag_word_prompt_generate_json: "Generieren Sie ein vollständiges JSON-Objekt für eine H5P Drag the Words-Aktivität. Das JSON muss direkt verwendbar sein.",
    drag_word_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    drag_word_prompt_json_structure_main_object: "Das Objekt muss enthalten :",
    drag_word_prompt_task_description: "`taskDescription`: Klare Anweisungen.",
    drag_word_prompt_text_field: "`textField`: Der zu vervollständigende Text. Jeder Satz sollte mit einem Zeilenumbruch `\\n` enden.",
    drag_word_prompt_content_rules_title: "**Inhaltsregeln :**",
    drag_word_prompt_rule1: "1.  Erstellen Sie einen kohärenten Text zum Thema mit kurzen Sätzen, die mit `\\n` enden.",
    drag_word_prompt_rule2: "2.  Ziehbare Wörter sind in Sternchen eingeschlossen. Sie können einen Tipp mit `:mein Tipp` und Feedback mit `\\+richtiges Feedback \\-falsches Feedback` hinzufügen.",
    drag_word_prompt_example_json_title: "**Beispiel-JSON :**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Vervollständige den Text, indem du die Wörter verschiebst.",
"textField": "Das *Sonnensystem* besteht aus *acht* Planeten, die sich um die *Sonne* drehen."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, ohne Kommentare.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",

    // Drag the Words UI translations
    drag_words_check_answer: "Überprüfen",
    drag_words_try_again: "Erneut versuchen",
    drag_words_show_solution: "Lösung anzeigen",
    drag_words_score_feedback: "Punktzahl: @score von @total.",
    drag_words_tip_label: "Tipp anzeigen",
    drag_words_correct_text: "Richtig!",
    drag_words_incorrect_text: "Falsch!",
    drag_words_score_bar_label: "Sie haben :num von :total Punkten erreicht",
    drag_words_submit_answer: "Absenden",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Fill in the Blanks\"-Aktivität erstellt.",
    blanks_prompt_mission: "**Ihre Mission :**",
    blanks_prompt_generate_json: "Generieren Sie ein vollständiges JSON-Objekt für eine H5P Fill in the Blanks-Aktivität. Das JSON muss direkt verwendbar sein.",
    blanks_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    blanks_prompt_json_structure_main_object: "Das Objekt muss einen `questions`-Schlüssel enthalten, der ein Array von Zeichenfolgen ist. Jede Zeichenfolge stellt einen zu vervollständigenden Textblock dar.",
    blanks_prompt_content_rules_title: "**Inhaltsregeln :**",
    blanks_prompt_rule1: "-   Zu erratende Wörter sind in Sternchen (*Wort*) eingeschlossen.",
    blanks_prompt_rule2: "-   Für alternative Antworten verwenden Sie einen Schrägstrich: *Paris/Stadt des Lichts*.",
    blanks_prompt_rule3: "-   Um eine Quickinfo hinzuzufügen, verwenden Sie einen Doppelpunkt: *Open-Source:Öffentlicher Quellcode*.",
    blanks_prompt_example_json_title: "**Beispiel-JSON :**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"Das Sonnensystem hat *acht* Planeten. Der größte ist *Jupiter*.",
"Die Hauptstadt von Frankreich ist *Paris/Stadt des Lichts*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, ohne Kommentare.",
    blanks_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Lösungen anzeigen",
    blanks_try_again: "Erneut versuchen",
    blanks_check_answer: "Überprüfen",
    blanks_not_filled_out: "Bitte füllen Sie alle Lücken aus.",
    blanks_answer_is_correct: "'':ans' ist richtig",
    blanks_answer_is_wrong: "'':ans' ist falsch",
    blanks_answered_correctly: "Richtig beantwortet",
    blanks_answered_incorrectly: "Falsch beantwortet",
    blanks_solution_label: "Richtige Antwort:",
    blanks_input_label: "Lücke @num von @total",
    blanks_input_has_tip_label: "Tipp verfügbar",
    blanks_tip_label: "Tipp",
    blanks_score_bar_label: "Sie haben :num von :total Punkten erreicht",
    blanks_submit_answer: "Absenden",
    blanks_feedback: "Sie haben @score von @total Lücken richtig ausgefüllt.",
    blanks_finish_header: "Beenden?",
    blanks_finish_body: "Möchten Sie wirklich beenden?",
    blanks_cancel_label: "Abbrechen",
    blanks_finish_label: "Beenden",
    blanks_retry_header: "Erneut versuchen?",
    blanks_retry_body: "Möchten Sie wirklich erneut versuchen?",
    blanks_retry_confirm_label: "Bestätigen",
    blanks_checking_mode_header: "Überprüfungsmodus",
    blanks_a11y_check: "Überprüfen Sie die Antworten. Die Antworten werden als richtig, falsch oder unbeantwortet markiert.",
    blanks_a11y_show_solution: "Zeigen Sie die Lösung an. Die Aufgabe wird mit der richtigen Lösung markiert.",
    blanks_a11y_retry: "Versuchen Sie die Aufgabe erneut. Setzen Sie alle Antworten zurück und beginnen Sie von vorne.",

    // Mark the Words Prompt
    mark_words_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Mark the Words\"-Aktivität erstellt.",
    mark_words_prompt_mission: "**Ihre Mission :**",
    mark_words_prompt_generate_json: "Generieren Sie ein vollständiges JSON-Objekt für eine H5P Mark the Words-Aktivität. Das JSON muss direkt verwendbar sein.",
    mark_words_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    mark_words_prompt_json_structure_main_object: "Das Objekt muss enthalten :",
    mark_words_prompt_task_description: "`taskDescription`: Klare Anweisungen.",
    mark_words_prompt_text_field: "`textField`: Der Text, in dem die zu markierenden Wörter in Sternchen (*Wort*) eingeschlossen sind.",
    mark_words_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",
    mark_words_prompt_content_rules_title: "**Inhaltsregeln :**",
    mark_words_prompt_rule1: "1.  Erstellen Sie einen relevanten Absatz zum Thema.",
    mark_words_prompt_rule2: "2.  Identifizieren Sie ungefähr ${nombreQuestions} wichtige Schlüsselwörter zum Markieren.",
    mark_words_prompt_rule3: "3.  Jedes zu markierende Wort muss einzeln in Sternchen eingeschlossen sein. Zum Beispiel ist `*Wort1* *Wort2*` korrekt, aber `*Wort1 Wort2*` nicht.",
    mark_words_prompt_rule4: "4.  Apostrophe oder andere Satzzeichen dürfen nicht an den markierten Wörtern hängen. Zum Beispiel ist `geht's*` falsch; es sollte `geht's *nicht*` geschrieben werden, damit es funktioniert.",
    mark_words_prompt_example_json_title: "**Beispiel-JSON :**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Klicke auf die wichtigen Wörter im Text.",
"textField": "Das *Sonnen* *system* besteht aus *acht* Planeten, die sich um die *Sonne* drehen."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, ohne Kommentare.",

    // Mark the Words UI translations
    mark_words_check_answer: "Überprüfen",
    mark_words_try_again: "Erneut versuchen",
    mark_words_show_solution: "Lösung anzeigen",
    mark_words_correct_answer: "Richtig!",
    mark_words_incorrect_answer: "Falsch!",
    mark_words_missed_answer: "Verfehlt!",
    mark_words_display_solution_description: "Die Aufgabe wird aktualisiert, um die Lösung anzuzeigen.",
    mark_words_score_bar_label: "Sie haben :num von :total Punkten erreicht",
    mark_words_submit_answer: "Absenden",
    mark_words_a11y_full_text_label: "Vollständig lesbarer Text",
    mark_words_a11y_clickable_text_label: "Vollständiger Text, in dem Wörter markiert werden können",
    mark_words_a11y_solution_mode_header: "Lösungsmodus",
    mark_words_a11y_checking_header: "Überprüfungsmodus",
    mark_words_a11y_check: "Überprüfen Sie die Antworten. Die Antworten werden als richtig, falsch oder unbeantwortet markiert.",
    mark_words_a11y_show_solution: "Zeigen Sie die Lösung an. Die Aufgabe wird mit der richtigen Lösung markiert.",
    mark_words_a11y_retry: "Versuchen Sie die Aufgabe erneut. Setzen Sie alle Antworten zurück und beginnen Sie von vorne.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "Die Komprimierungsbibliotheken (Tar.js oder fflate) sind nicht geladen. Bitte überprüfe deine Internetverbindung oder aktualisiere die Seite.",
    millionnaire_error_invalid_json: "Die JSON-Struktur ist ungültig. Stelle sicher, dass sie einen 'title' und ein 'questions'-Array mit 6 Fragen gemäß dem Beispiel enthält.",
    millionnaire_activity_intro: "Nimm an diesem Spiel teil, um dein Wissen zu testen.",
    millionnaire_backup_log: "Sicherung automatisch von Caramel erstellt\n",
    millionnaire_success_generation: "Datei {fileName} erfolgreich erstellt!",
    millionnaire_error_creation_mbz: "Fehler beim Erstellen der MBZ-Datei:",
    millionnaire_error_generic: "Fehler:",

    // Millionnaire Prompt
    millionnaire_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften, der eine H5P \"Millionnaire\"-Aktivität erstellt.",
    millionnaire_prompt_num_questions: "**Anzahl der Fragen :** 6",
    millionnaire_prompt_mission: "**Ihre Mission :**",
    millionnaire_prompt_generate_json: "Generieren Sie ein JSON-Objekt, das einen Titel und eine Liste von **6 Fragen** für ein Spiel vom Typ \"Wer wird Millionär\" enthält.",
    millionnaire_prompt_important_rules_title: "**Wichtige Regeln :**",
    millionnaire_prompt_rule1: "1.  Der `title` muss ein relevanter und ansprechender Titel für die Aktivität sein.",
    millionnaire_prompt_rule2: "2.  Der Schwierigkeitsgrad der Fragen im `questions`-Array muss **zunehmend und pädagogisch** sein, angepasst an das Niveau der Schüler. Die erste Frage muss sehr einfach, die letzte sehr schwierig sein.",
    millionnaire_prompt_rule3: "3.  Der Inhalt muss streng genau und relevant für das Thema und das akademische Niveau sein.",
    millionnaire_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    millionnaire_prompt_main_object: "Ein Hauptobjekt mit zwei Schlüsseln :",
    millionnaire_prompt_title: "- `title`: Der Aktivitätstitel (Zeichenfolge).",
    millionnaire_prompt_questions_array: "- `questions`: Ein Array von 6 Objekten, wobei jedes Objekt eine Frage darstellt und enthält :",
    millionnaire_prompt_question: "- `question`: Die Frage (Zeichenfolge).",
    millionnaire_prompt_good_answer: "- `goodanswer`: Die richtige Antwort (Zeichenfolge).",
    millionnaire_prompt_bad_answer: "- `badanswer`: Ein Array von 3 falschen Antworten (Zeichenfolgen).",
    millionnaire_prompt_example_json_title: "**Beispiel-JSON :**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "Quiz über die Französische Revolution",
"questions": [
{
"question": "Was ist die Hauptstadt von Frankreich?",
"goodanswer": "Paris",
"badanswer": ["Berlin", "London", "Madrid"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Generieren Sie nur das gültige JSON-Objekt, ohne weitere Kommentare.",

    // Appariement Prompt
    appariement_prompt_role: "Du bist eine Expertin/ein Experte für Instruktionsdesign und erstellst eine Moodle-Aktivität \"Zuordnung\".",
    appariement_prompt_num_questions: "**Anzahl der Paare:** 10",
    appariement_prompt_mission: "**Deine Aufgabe:**",
    appariement_prompt_generate_json: "Erzeuge ein JSON-Objekt, das einen Titel und eine Liste von **10 Paaren** für ein Zuordnungsspiel enthält.",
    appariement_prompt_important_rules_title: "**Wichtige Regeln:**",
    appariement_prompt_rule1: "1.  Der `title` muss ein relevanter und ansprechender Titel für die Aktivität sein.",
    appariement_prompt_rule2: "2.  Das Array `pairs` muss 10 Objekte enthalten, jeweils mit einer `question` (Element links) und einer `answer` (Element rechts zum Zuordnen).",
    appariement_prompt_rule3: "3.  Der Inhalt muss streng korrekt und passend zum Thema und zum Schulniveau sein.",
    appariement_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    appariement_prompt_main_object: "Ein Hauptobjekt mit zwei Schlüsseln:",
    appariement_prompt_title: "- `title`: Der Titel der Aktivität (Zeichenkette).",
    appariement_prompt_pairs_array: "- `pairs`: Ein Array mit 10 Objekten, wobei jedes Objekt ein Paar darstellt und Folgendes enthält:",
    appariement_prompt_question: "- `question`: Der Begriff oder das Bild links (Zeichenkette).",
    appariement_prompt_answer: "- `answer`: Die Definition oder der entsprechende Begriff rechts (Zeichenkette).",
    appariement_prompt_example_json_title: "**Beispiel-JSON:**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Zuordnung über die Französische Revolution",
"pairs": [
{
"question": "Sturm auf die Bastille",
"answer": "14. Juli 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "Erzeuge nur das gültige JSON-Objekt, ohne jeglichen Kommentar.",

   // Zuordnungserstellung
   appariement_error_invalid_json: "Die JSON-Struktur ist ungültig. Stellen Sie sicher, dass sie einen 'title' und ein Array 'pairs' enthält, in dem jedes Paar eine 'question' und eine 'answer' hat.",
   appariement_activity_intro: "Finden Sie die passenden Paare.",
   appariement_success_generation: "Datei {fileName} erfolgreich erstellt !",
   appariement_error_creation_mbz: "Fehler beim Erstellen des MBZ für die Zuordnung:",

    // QCM Prompt
    qcm_prompt_role: "Du bist eine Expertin/ein Experte für Instruktionsdesign und erstellst eine Moodle-Aktivität \"QCM\".",
    qcm_prompt_num_questions: "**Anzahl der Fragen:** 10",
    qcm_prompt_mission: "**Deine Aufgabe:**",
    qcm_prompt_generate_json: "Erzeuge ein JSON-Objekt, das einen Titel und eine Liste von **10 Fragen** für ein QCM enthält.",
    qcm_prompt_important_rules_title: "**Wichtige Regeln:**",
    qcm_prompt_rule1: "1.  Der `title` muss ein relevanter und ansprechender Titel für die Aktivität sein.",
    qcm_prompt_rule2: "2.  Das Array `questions` muss 10 Objekte enthalten, jeweils mit einem `text` (Fragetext) und einem `answers`-Array.",
    qcm_prompt_rule3: "3.  Jedes `answers`-Array muss mehrere mögliche Antworten enthalten. Jede Antwort ist ein Objekt mit `text` und `iscorrect` (1 für wahr, 0 für falsch). Je nach Kontext der Frage kannst du Fragen mit einer oder mehreren richtigen Antworten vorschlagen.",
    qcm_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    qcm_prompt_main_object: "Ein Hauptobjekt mit zwei Schlüsseln:",
    qcm_prompt_title: "- `title`: Der Titel der Aktivität (Zeichenkette).",
    qcm_prompt_questions_array: "- `questions`: Ein Array mit 10 Objekten, wobei jedes Objekt eine Frage darstellt und Folgendes enthält:",
    qcm_prompt_question_text: "- `text`: Der Fragetext (Zeichenkette, kann HTML enthalten).",
    qcm_prompt_answers_array: "- `answers`: Ein Array von Objekten, wobei jedes Objekt eine Antwort darstellt und Folgendes enthält:",
    qcm_prompt_answer_text: "- `text`: Der Antworttext (Zeichenkette, kann HTML enthalten).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1, wenn die Antwort richtig ist, sonst 0.",
    qcm_prompt_example_json_title: "**Beispiel-JSON:**",
    qcm_prompt_example: `\`\`\`json
{
"title": "Multiple-Choice-Quiz über die Französische Revolution",
"questions": [
{
"text": "Wann war der Sturm auf die Bastille?",
"answers": [
{ "text": "14. Juli 1789", "iscorrect": 1 },
{ "text": "4. August 1789", "iscorrect": 0 },
{ "text": "26. August 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Erzeuge nur das gültige JSON-Objekt, ohne jeglichen Kommentar.",
 
    // Erstellung eines Multiple-Choice-Tests
    qcm_error_invalid_json: "Die JSON-Struktur ist ungültig. Stellen Sie sicher, dass sie einen 'title' und ein Array 'questions' enthält, mit mindestens einer Frage und Antworten.",
    qcm_activity_intro: "Beantworten Sie die folgenden Fragen.",
    qcm_success_generation: "Datei {fileName} erfolgreich erstellt !",
    qcm_error_creation_mbz: "Fehler beim Erstellen des MBZ für den Multiple-Choice-Test:",

    // H5P Modules
    h5p_timeline_name: "Zeitleiste",
    h5p_timeline_description: "Erstellen Sie eine interaktive Zeitleiste, um eine Abfolge von Ereignissen darzustellen.",
    h5p_flashcards_name: "Lernkarten",
    h5p_flashcards_description: "Erstellen Sie doppelseitige Karten, um das Auswendiglernen von Begriffen und Definitionen zu erleichtern.",
    h5p_quiz_set_name: "Quiz",
    h5p_quiz_set_description: "Stellen Sie eine Reihe verschiedener Fragen (MCQ, Drag-and-Drop usw.) zusammen, um das Wissen zu bewerten.",
    h5p_glossary_name: "Glossar",
    h5p_glossary_description: "Erstellen Sie ein Glossar oder eine FAQ im Akkordeonformat.",
    h5p_crossword_name: "Kreuzworträtsel",
    h5p_crossword_description: "Generieren Sie ein Kreuzworträtselgitter aus einer Liste von Wörtern und Definitionen.",
    h5p_essay_name: "Aufsatz",
    h5p_essay_description: "Schlagen Sie ein Aufsatzthema vor und definieren Sie Schlüsselwörter für die automatisierte Korrektur.",
    h5p_summary_name: "Zusammenfassung",
    h5p_summary_description: "Die Schüler müssen eine korrekte Zusammenfassung rekonstruieren, indem sie die richtigen Sätze auswählen.",
    h5p_drag_the_words_name: "Wörter ziehen",
    h5p_drag_the_words_description: "Erstellen Sie einen Lückentext, in dem die Schüler die fehlenden Wörter ziehen müssen.",
    h5p_fill_in_the_blanks_name: "Lückentext",
    h5p_fill_in_the_blanks_description: "Die Schüler müssen die fehlenden Wörter in einem Text direkt über die Tastatur eingeben.",
    h5p_mark_the_words_name: "Wörter markieren",
    h5p_mark_the_words_description: "Bitten Sie die Schüler, bestimmte Wörter in einem Absatz hervorzuheben.",
    h5p_true_false_name: "Wahr/Falsch Frage",
    h5p_true_false_description: "Erstellen Sie eine einzelne einfache Frage mit einer binären Antwort: wahr oder falsch.",
    h5p_multiple_choice_name: "Multiple Choice",
    h5p_multiple_choice_description: "Erstellen Sie eine einzelne Multiple-Choice-Frage mit einer oder mehreren richtigen Antworten.",
    h5p_find_the_words_name: "Wörter finden",
    h5p_find_the_words_description: "Erstellen Sie ein Buchstabengitter, in dem die Schüler Wörter finden müssen.",
    h5p_sort_the_paragraphs_name: "Absätze sortieren",
    h5p_sort_the_paragraphs_description: "Erstellen Sie eine Reihe von Absätzen, die die Schüler in die richtige Reihenfolge bringen müssen.",
    h5p_single_choice_set_name: "Einzelwahl-Satz",
    h5p_single_choice_set_description: "Erstellen Sie eine Reihe von Fragen, bei denen jede Frage nur eine richtige Antwort hat.",
    h5p_dialog_cards_name: "Dialogkarten",
    h5p_dialog_cards_description: "Erstellen Sie interaktive Karten mit Text und optionalen Bildern auf beiden Seiten.",
    h5p_complex_fill_the_blanks_name: "Komplexer Lückentext",
    h5p_complex_fill_the_blanks_description: "Erstellen Sie einen erweiterten Lückentext mit spezifischem Feedback für jeden Fehler.",
    h5p_chart_name: "Diagramm",
    h5p_chart_description: "Erstellen Sie ein Kreis- oder Balkendiagramm zur Visualisierung von Daten.",

    // Moodle Modules
    moodle_xml_name: "Test",
    moodle_xml_description: "Erstellen Sie eine Fragensammlung, die direkt in eine Test-Aktivität importiert werden kann (im XML- oder GIFT-Format)",
    moodle_xml_help: "Um eine XML-Datei in eine „Test“-Aktivität in Moodle hinzuzufügen, erstellen Sie zunächst die Aktivität. Öffnen Sie dann das Menü <strong>Mehr</strong> und gehen Sie zu <strong>Fragenbank</strong>. In diesem Menü klicken Sie auf <strong>Importieren</strong>, wählen das Format <strong>Moodle XML</strong> und wählen dann Ihre Datei aus und bestätigen.",
    moodle_gift_name: "GIFT-Format",
    moodle_gift_description: "Erstellen Sie Fragen im GIFT-Format, eine einfache Möglichkeit, Fragen in Moodle zu importieren.",
    moodle_millionnaire_name: "Millionär",
    moodle_millionnaire_description: "Erstellen Sie eine einzigartige 'Millionär'-Aktivität mit 6 Fragen, die schrittweise schwieriger werden.",
    moodle_appariement_name: "Zuordnung",
    moodle_appariement_description: "Erzeuge eine Zuordnungsaktivität mit 10 Fragen.",
    
    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Generieren Sie eine einfache MCQ-Aktivität.",

    moodle_glossaire_xml_name: "Glossar (XML)",
    moodle_glossaire_xml_description: "Erstellen Sie ein Glossar, das zum Import im XML-Format bereit ist.",

    elea_page_name: "Seite",
    elea_page_description: "Eine visuell formatierte Éléa-Inhaltsseite erstellen.",

    // Dynamic content
    prompt_for_ia: "Prompt für die KI",
    copy_prompt: "Prompt kopieren",
    fullscreen_prompt: "Vollbild",
    exit_fullscreen_prompt: "Vollbild beenden",
    lock_prompt: "Prompt sperren",
    unlock_prompt: "Prompt entsperren",
    go_duck: "Zu Duck.ai gehen",
    go_mistral: "Zu Le Chat gehen",
    create_h5p_file: "H5P-Datei erstellen",
    integrate_h5p_libraries: "H5P-Bibliotheken integrieren:",
    paste_ia_result: "Fügen Sie das Ergebnis der KI in das untere Feld ein, um Ihr Modul zu erstellen.",
    generate_h5p: "H5P generieren",
    create_xml_file: "XML-Datei erstellen",
    paste_ia_result_xml: "Fügen Sie das von der KI erzeugte XML unten ein.",
    generate_xml_file: "XML-Datei generieren",
    export_mbz: "Format MBZ",
    export_gift: "Format GIFT",
    export_xml: "Format XML",
    export_html: "HTML-Format",

    create_mbz_file_appariement: "Datei „Zuordnung“ (.mbz) erstellen",
    paste_ia_result_appariement: "Fügen Sie unten das von der KI generierte JSON ein. Der Titel der Aktivität wird automatisch aus dem JSON extrahiert.",
    generate_mbz_appariement: "Aktivität „Zuordnung“ generieren (mbz)",
    create_mbz_file_millionnaire: "Datei „Millionär“ (.mbz) erstellen",
    paste_ia_result_millionnaire: "Fügen Sie unten das von der KI generierte JSON ein. Der Titel der Aktivität wird automatisch aus dem JSON extrahiert.",
    generate_mbz_millionnaire: "Aktivität „Millionär“ generieren (mbz)",
    generate_mbz_test: "Test-Aktivität (mbz) erzeugen",

    create_mbz_file_qcm: "MCQ-Datei (.mbz) erstellen",
    paste_ia_result_qcm: "Fügen Sie unten das von der KI generierte JSON ein. Der Titel der Aktivität wird automatisch aus dem JSON extrahiert.",
    generate_mbz_qcm: "MCQ-Aktivität generieren (mbz)",

    create_mbz_file_page: "Seiten-Datei (.mbz) erstellen",
    paste_ia_result_page: "Fügen Sie unten das von der KI erzeugte JSON ein, um die Seite zu erstellen.",
    generate_mbz_page: "Die Aktivität Seite (mbz) generieren",

    // Moodle-XML – spezifisch
    moodle_xml_placeholder: "Das Moodle-XML wird hier angezeigt...",
    paste_xml_placeholder: "Fügen Sie hier das vollständige, von der KI erzeugte XML ein...",

    // H5P leere Textfelder
    generate_prompts_placeholder: "Die Eingabeaufforderung für die KI erscheint hier, sobald Sie mindestens ein Feld im Schnellmodus oder im Erweiterten Modus ausgefüllt haben.",
    paste_json_or_text: "Fügen Sie hier den von der KI erzeugten JSON-Inhalt oder Text ein, um Ihre Aktivität zu erstellen.",
    info_prompt_copy: "Fügen Sie diesen Prompt nicht in das rechte Feld ein. Kopieren Sie ihn in eine externe KI, um das Ergebnis zu erhalten, und fügen Sie dieses Ergebnis anschließend in das rechte Feld ein.",

    // Notifications
    caramel_success_title: "Deine Süßigkeit ist fertig!",
    prompts_generated_successfully: "Prompts erfolgreich generiert!",
    success_copy: "✓ Kopiert !",
    error_please_fill_fields: "Bitte füllen Sie mindestens ein Feld im Schnellmodus aus.",
    error_please_fill_guided_fields: "Bitte füllen Sie mindestens ein Feld im Erweiterten Modus aus.",
    error_field_empty: "Das Feld ist leer. Bitte generieren Sie zuerst einen Prompt.",
    error_copy_failed: "Kopieren fehlgeschlagen.",
    error_h5p_module_not_found: "Modul '{moduleKey}' nicht gefunden.",
    error_invalid_quiz_json: "Das JSON für das Quiz ist ungültig: {errorMessage}",
    error_invalid_json: "Das bereitgestellte JSON ist ungültig. Fehler: {errorMessage}",
    error_h5p_creation: "H5P-Erstellungsfehler: {errorMessage}",
    error_paste_ia_content: "Bitte fügen Sie den von der KI generierten Inhalt ein.",
    error_compression_module_not_ready: "Das Komprimierungsmodul ist nicht bereit. Bitte versuchen Sie es in einem Moment erneut.",
    h5p_file_generated_successfully: "Datei {fileName} erfolgreich generiert!",
    h5p_creation_failed: "Erstellung der H5P-Datei fehlgeschlagen: {errorMessage}",
    license_info: "GNU GPL v3.0 oder später",

    // Notifications for JSON content
    error_paste_json_content: "Bitte fügen Sie den generierten JSON-Inhalt ein.",
    error_paste_xml_content: "Bitte fügen Sie den generierten XML-Inhalt ein.",

    // Flashcards specific UI translations
    flashcards_progress_text: "Karte @card von @total",
    flashcards_next: "Weiter",
    flashcards_previous: "Zurück",
    flashcards_check_answer: "Überprüfen",
    flashcards_your_answer: "Ihre Antwort",
    flashcards_correct_answer: "Richtig",
    flashcards_incorrect_answer: "Falsch",
    flashcards_show_solution: "Richtige Antwort",
    flashcards_results: "Ergebnisse",
    flashcards_of_correct: "@score von @total richtig",
    flashcards_show_results: "Ergebnisse anzeigen",
    flashcards_answer_short: "A:",
    flashcards_retry: "Wiederholen",
    flashcards_card_announcement: "Falsche Antwort. Die richtige Antwort war @answer",
    flashcards_correct_announcement: "@answer ist richtig.",
    flashcards_page_announcement: "Seite @current von @total",

    // Essay specific UI translations
    essay_checkAnswer: "Überprüfen",
    essay_tryAgain: "Erneut versuchen",
    essay_showSolution: "Lösung anzeigen",
    essay_feedbackHeader: "Feedback",
    essay_solutionTitle: "Musterlösung",
    remainingChars: "Verbleibende Zeichen: @chars",
    notEnoughChars: "Sie müssen mindestens @chars Zeichen eingeben!",
    messageSave: "gespeichert",
    placeholderText: "Beginnen Sie hier zu schreiben...",
    ariaYourResult: "Sie haben @score von @total Punkten erreicht",
    ariaNavigatedToSolution: "Zur neu hinzugefügten Musterlösung nach dem Textbereich navigiert.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "Ihre Arbeit ist ein guter Anfang. Erforschen Sie das Thema weiter, um Ihre Ideen zu bereichern.",
    essay_overall_feedback_11_30: "Sie haben eine interessante Grundlage geschaffen. Durch eine Vertiefung bestimmter Punkte wird Ihre Arbeit an Präzision gewinnen.",
    essay_overall_feedback_31_50: "Ihr Verständnis des Themas ist gut auf dem Weg. Erwägen Sie, Ihre Argumente weiterzuentwickeln, um Ihren Standpunkt zu stärken.",
    essay_overall_feedback_51_70: "Das ist eine gute Arbeit. Sie zeigen eine gute Beherrschung des Themas. Einige weitere Details könnten es noch verbessern.",
    essay_overall_feedback_71_90: "Sehr gute Arbeit! Ihre Analyse ist relevant und gut strukturiert. Sie zeigen ein ausgezeichnetes Verständnis.",
    essay_overall_feedback_91_100: "Ausgezeichnete Arbeit! Ihre Überlegungen sind gründlich, gut argumentiert und zeigen eine vollständige Beherrschung des Themas.",

    ticket: "Ticket",
    legal_mentions: "Impressum",

    // Legal Mentions
    legal_title: "Impressum",
    legal_editor_title: "Anwendungsherausgeber",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Funktion: Berufsschullehrer für Literatur-Geschichte",
    legal_editor_gauthier_remande_email: "E-Mail: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Adresse: 39 avenue de Chanzy, 53000 Laval, Frankreich",
    legal_editor_gauthier_remande_phone: "Telefon: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Funktion: Mathematiklehrer und DRANE-Missionsbeauftragter – Akademie von Grenoble",
    legal_editor_emmanuel_gaunard_email: "E-Mail: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Adresse: 30 boulevard de la République, 38200 Vienne, Frankreich",
    legal_editor_emmanuel_gaunard_phone: "Telefon: +33 6 46 74 20 94",
    legal_app_description: "Die Webanwendung „Caramel“ ist ein freies, nichtkommerzielles Projekt zur Erstellung von H5P- und Éléa-Inhalten. Es ist kein Konto erforderlich, und es werden keine personenbezogenen Daten erhoben.",
    legal_hosting_title: "Hosting",
    legal_host_name: "<strong>Host</strong>: Forge des Communs Numériques Éducatifs",
    legal_host_company: "<strong>Firmenname</strong>: Ministerium für Nationale Bildung und Jugend",
    legal_host_address: "<strong>Adresse</strong>: 110 rue de Grenelle, 75007 Paris, Frankreich",
    legal_host_phone: "<strong>Telefon</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Veröffentlichungsdirektor",
    legal_publication_director_name: "Gauthier REMANDE und Emmanuel GAUNARD, als ehrenamtliche Herausgeber.",
    legal_terms_of_use_title: "Allgemeine Nutzungsbedingungen",
    legal_terms_of_use_content: "Diese Website ermöglicht es Nutzern, H5P- und Éléa-Inhalte zu erstellen. Die Anzeige erfolgt lokal, ohne Übermittlung von Nutzerdaten. Die Nutzer sind allein für die Nutzung der erstellten Inhalte verantwortlich. Die Anwendung wird kostenlos und ohne Garantie für Funktion oder Ergebnis bereitgestellt. Der Herausgeber lehnt jede Haftung bei Fehlinterpretation der Inhalte oder unsachgemäßer Nutzung ab.",
    legal_intellectual_property_title: "Geistiges Eigentum",
    legal_intellectual_property_content: "Alle Quellcodes, grafischen Elemente und Inhalte sind unter der freien Lizenz GNU AGPLv3 lizenziert. Ihre Wiederverwendung ist unter den Bedingungen ihrer jeweiligen Lizenzen gestattet. Jede Weiterverbreitung oder Änderung muss die ursprünglichen Autoren nennen: Gauthier REMANDE und Emmanuel GAUNARD. Die in den H5P-Modulen verwendeten Bilder stammen von H5P.org.",
    legal_personal_data_title: "Personenbezogene Daten",
    legal_personal_data_content: "Es werden keine personenbezogenen Daten erhoben oder gespeichert. Es werden keine Tracking-Cookies verwendet.",
    legal_ai_models_title: "Modelle der künstlichen Intelligenz",
    legal_ai_models_content: "Die Caramel‑Anwendung nutzt, ausschließlich bei der Ein‑Klick‑Generierung, von ILAAS betriebene KI‑Modelle – eine Föderation gemeinschaftlich genutzter KI‑Infrastrukturen. Anfragen werden über einen vom Inkubator gehosteten n8n‑Workflow geleitet und anschließend an ILAAS zur Ausführung auf vertrauenswürdigen Servern in vom Bereich Hochschul‑ und Forschungswesen (ESR) zertifizierten Rechenzentren übermittelt. Caramel führt keine Modelle aus und verarbeitet oder speichert Daten nicht selbst; die Daten dienen ausschließlich der Bearbeitung der Anfrage und werden nicht an öffentliche Consumer‑KIs übermittelt. Derzeit verfügbare Modelle sind u. a. {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) und {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Etwaige von ILAAS vorgenommene Hosting‑, Protokollierungs‑ und Aufbewahrungsmaßnahmen unterliegen deren Datenschutzerklärung und Nutzungsbedingungen.",
    legal_user_requests_processing_title: "Verarbeitung von Benutzeranfragen über n8n und den Inkubator des Bildungsministeriums",
    legal_user_requests_processing_content: "Unsere Website nutzt eine technische Lösung, die mit n8n entwickelt wurde, einem Open‑Source‑Tool, das vom Inkubator des Bildungsministeriums gehostet wird. Über einen automatisierten Workflow wandelt dieser Dienst Benutzeranfragen in strukturierte Daten (JSON‑Format) um, um mit einer KI der DINUM zu interagieren – und ist damit souverän. Es werden keine sensiblen Informationen unverschlüsselt offengelegt oder übertragen; Vertraulichkeit und Sicherheit der Kommunikation sind gewährleistet.",
    legal_accessibility_title: "Barrierefreiheit",
    legal_accessibility_content: "Die Anwendung ist so konzipiert, dass sie mit der Nutzung am Computer kompatibel ist, einschließlich Hell-/Dunkel-Modi, Tastaturnavigation und hohem Kontrast je nach Thema. Eine kontinuierliche Verbesserung der Barrierefreiheit ist im Gange, in Anlehnung an die RGAA-Empfehlungen.",
    legal_applicable_law_title: "Anwendbares Recht",
    legal_applicable_law_content: "Diese Seite unterliegt französischem Recht. Im Streitfall sind die zuständigen Gerichte die des Gerichtsbezirks Lyon.",
    legal_external_libraries_title: "Verwendete externe Bibliotheken",
    legal_external_libraries_intro: "Die Caramel-Anwendung verwendet mehrere Open-Source-Bibliotheken unter den folgenden Lizenzen:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Lizenz: CC BY 4.0, SIL OFL 1.1, MIT): Stellt die in der Benutzeroberfläche verwendeten Symbole zur Verbesserung der Navigation und des visuellen Erlebnisses bereit.",
    legal_library_jszip: "<strong>JSZip</strong> (Lizenz: MIT oder GPLv3): Ermöglicht das Erstellen von .h5p-Dateien durch Komprimieren des erforderlichen Inhalts in ein Zip-Archiv.",
    legal_library_clientzip: "<strong>client-zip</strong> (Lizenz: MIT): Eine weitere Bibliothek zur Dateikomprimierung, die eine leistungsstarke Alternative zum direkten Erstellen von .h5p-Archiven im Browser bietet.",
    legal_library_fflate: "<strong>fflate</strong> (Lizenz: MIT): Sehr schnelle Bibliothek zur Datenkomprimierung und -dekomprimierung, die zum Erstellen von .mbz-Archiven für Moodle-Module verwendet wird.",
    legal_library_tarjs: "<strong>tar-js</strong> (Lizenz: MIT): Ermöglicht das Erstellen von .tar-Archiven, ein notwendiger Schritt vor der Komprimierung, um .mbz-Dateien für Moodle-Module zu erstellen.",
    legal_library_ownership: "Jede Bibliothek bleibt Eigentum ihrer jeweiligen Autoren und wird gemäß ihrer Lizenz(en) verwendet.",

    // True/False Question
    true_false_prompt_role: "Sie sind ein Experte für Instruktionsdesign und erstellen eine Wahr/Falsch-Frage für eine H5P-Aktivität.",
    true_false_prompt_mission: "Ihre Aufgabe ist es, ein JSON-Objekt für eine Wahr/Falsch-Frage zu generieren.",
    true_false_prompt_generate_json: "Generieren Sie ein JSON-Objekt basierend auf der folgenden Struktur:",
    true_false_prompt_json_structure_title: "--- ERWARTETE JSON-STRUKTUR ---",
    true_false_prompt_json_structure_main_object: "Das Hauptobjekt muss die folgenden Schlüssel enthalten:",
    true_false_prompt_question: "`question`: (string) Die zu bewertende Aussage. Kann HTML enthalten.",
    true_false_prompt_correct: "`correct`: (string) Die richtige Antwort, entweder \"true\" oder \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Kommentar, der angezeigt wird, wenn die Antwort richtig ist.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Kommentar, der angezeigt wird, wenn die Antwort falsch ist.",
    true_false_prompt_content_rules_title: "--- INHALTSREGELN ---",
    true_false_prompt_rule1: "Die Frage muss eine klare Aussage sein.",
    true_false_prompt_rule2: "Der Wert von `correct` muss eine Zeichenfolge sein: \"true\" oder \"false\".",
    true_false_prompt_example_json_title: "--- JSON-BEISPIEL ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "Oslo ist die Hauptstadt von Norwegen.",
"correct": "true",
"feedbackOnCorrect": "Richtige Antwort! Oslo ist tatsächlich die Hauptstadt von Norwegen.",
"feedbackOnWrong": "Falsche Antwort. Die Hauptstadt von Norwegen ist Oslo."
}
    \`\`\` `,
   true_false_prompt_generate_only_json: "Ich möchte, dass Sie nur das JSON generieren, ohne Kommentare oder einleitenden Text.",
    true_false_true_text: "Wahr",
    true_false_false_text: "Falsch",
    true_false_score: "Sie haben @score von @total Punkten erreicht",
    true_false_check_answer: "Überprüfen",
    true_false_show_solution_button: "Lösung anzeigen",
    true_false_try_again: "Erneut versuchen",
    true_false_wrong_answer_message: "Falsche Antwort",
    true_false_correct_answer_message: "Richtige Antwort",
    true_false_score_bar_label: "Sie haben :num von :total Punkten erreicht",
    true_false_submit_answer: "Absenden",
    true_false_a11y_check: "Überprüfen Sie die Antworten. Die Antworten werden als richtig, falsch oder unbeantwortet markiert.",
    true_false_a11y_show_solution: "Zeigen Sie die Lösung an. Die Aufgabe wird mit der richtigen Lösung markiert.",
    true_false_a11y_retry: "Versuchen Sie die Aufgabe erneut. Setzen Sie alle Antworten zurück und beginnen Sie von vorne.",
    true_false_finish_header: "Beenden?",
    true_false_finish_body: "Möchten Sie wirklich beenden?",
    true_false_cancel_label: "Abbrechen",
    true_false_finish_label: "Beenden",
    true_false_retry_header: "Erneut versuchen?",
    true_false_retry_body: "Möchten Sie wirklich erneut versuchen?",
    true_false_retry_confirm_label: "Bestätigen",

    // Multiple Choice UI translations
    checkAnswerButton: "Überprüfen",
    showSolutionButton: "Lösung anzeigen",
    tryAgainButton: "Erneut versuchen",
    submitAnswerButton: "Absenden",
    scoreBarLabel: "Sie haben :num von :total Punkten erreicht",
    confirmCheckHeader: "Beenden?",
    confirmCheckBody: "Möchten Sie wirklich beenden?",
    confirmCheckCancelLabel: "Abbrechen",
    confirmCheckConfirmLabel: "Beenden",
    confirmRetryHeader: "Erneut versuchen?",
    confirmRetryBody: "Möchten Sie wirklich erneut versuchen?",
    confirmRetryCancelLabel: "Abbrechen",
    confirmRetryConfirmLabel: "Bestätigen",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften und erstellen eine H5P-Aktivität \"Multiple Choice\".",
    multiple_choice_prompt_mission: "**Ihre Mission:**",
    multiple_choice_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P-Multiple-Choice-Aktivität.",
    multiple_choice_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    multiple_choice_prompt_json_structure_main_object: "Das Objekt muss enthalten:",
    multiple_choice_prompt_question: "`question`: Die zu stellende Frage (HTML-Format).",
    multiple_choice_prompt_answers_array: "`answers`: Ein Array von Objekten, die jeweils eine Antwort darstellen.",
    multiple_choice_prompt_text: "`text`: Der Antworttext (HTML-Format).",
    multiple_choice_prompt_correct: "`correct`: Ein boolescher Wert (`true` oder `false`), der angibt, ob es die richtige Antwort ist.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",
    multiple_choice_prompt_content_rules_title: "**Inhaltsregeln:**",
    multiple_choice_prompt_rule1: "1.  Es darf nur eine richtige Antwort geben (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Geben Sie mehrere falsche Antworten an (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Beispiel-JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "Welche ist die tatsächliche Farbe der Schwarzen Johannisbeere?",
"answers": [
{
"correct": true,
"text": "Sehr dunkles Violett"
},
{
"correct": false,
"text": "Blau"
},
{
"correct": false,
"text": "Schwarz"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code ohne Kommentare.",

    // Find the Words UI translations
    check: "Überprüfen",
    tryAgain: "Erneut versuchen",
    showSolution: "Lösung anzeigen",
    found: "@found von @totalWords gefunden",
    timeSpent: "Verbrachte Zeit",
    score: "Sie haben @score von @total Punkten erreicht",
    wordListHeader: "Wortliste",

    // Find the Words Prompt
    find_the_words_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften und erstellen eine H5P-Aktivität \"Wörter finden\".",
    find_the_words_prompt_mission: "**Ihre Mission:**",
    find_the_words_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P-Aktivität zum Finden von Wörtern.",
    find_the_words_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    find_the_words_prompt_json_structure_main_object: "Das Objekt muss enthalten:",
    find_the_words_prompt_task_description: "`taskDescription`: Klare Anweisungen für die Aktivität.",
    find_the_words_prompt_word_list: "`wordList`: Eine Zeichenfolge von zu findenden Wörtern, getrennt durch Kommas ohne Leerzeichen.",
    find_the_words_prompt_content_rules_title: "**Inhaltsregeln:**",
    find_the_words_prompt_rule1: "1.  Die `wordList` muss eine einzelne Zeichenkette sein, in der die Wörter durch Kommas getrennt sind. Jedes Wort muss einfach sein (keine Mehrwortgruppen). Zahlen, Satzzeichen und Buchstaben mit Akzenten/Diakritika sind verboten (z. B.: 'élève' muss 'eleve' geschrieben werden).",
    find_the_words_prompt_example_json_title: "**Beispiel-JSON:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Finde die Städtenamen im folgenden Gitter",
"wordList": "Canberra,Minsk,Peking,Oslo,Paris,London,Madrid,Athen,Tokio,Moskau,Washington,Stockholm"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code ohne Kommentare.",
    fillPool: "abcdefghijklmnopqrstuvwxyzäöüß",

    // Sort the Paragraphs UI translations
    checkAnswer: "Überprüfen",
    submitAnswer: "Absenden",
    up: "Nach oben",
    down: "Nach unten",
    disabled: "Deaktiviert",
    a11y_yourResult: "Sie haben @score von @total Punkten erreicht",
    a11y_paragraph: "Absatz",
    a11y_correct: "richtig",
    a11y_wrong: "falsch",
    a11y_point: "@score Punkt",
    a11y_sevenOfNine: "@current von @total",
    a11y_currentPosition: "Aktuelle Position in der Liste",
    a11y_instructionsSelected: "Drücken Sie die Leertaste zum Neuanordnen",
    a11y_instructionsGrabbed: "Drücken Sie die Pfeiltasten nach oben und unten, um die Position zu ändern, die Leertaste zum Ablegen, Escape zum Abbrechen",
    a11y_grabbed: "Gegriffen",
    a11y_moved: "Verschoben",
    a11y_dropped: "Abgelegt",
    a11y_reorderCancelled: "Neuanordnung abgebrochen",
    a11y_finalPosition: "Endgültige Position",
    a11y_nextParagraph: "Nächster Absatz",
    a11y_correctParagraph: "Korrekter Absatz an Position",
    a11y_listDescription: "Sortierbare Liste von Absätzen.",
    a11y_listDescriptionCheckAnswer: "Liste von Absätzen mit Ergebnissen.",
    a11y_listDescriptionShowSolution: "Liste von Absätzen mit Lösungen.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften und erstellen eine H5P-Aktivität \"Absätze sortieren\".",
    sort_the_paragraphs_prompt_mission: "**Ihre Mission:**",
    sort_the_paragraphs_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P-Aktivität zum Sortieren von Absätzen.",
    sort_the_paragraphs_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "Das Objekt muss enthalten:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Klare Anweisungen für die Aktivität. Verwenden Sie `*Wort*` für Fett, `**Wort**` für Kursiv und `\\n` für Zeilenumbrüche.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Ein Array von Zeichenfolgen, die jeweils einen zu sortierenden Absatz darstellen. Die Absätze müssen in der richtigen Reihenfolge sein. Verwenden Sie `*Wort*` für Fett, `**Wort**` für Kursiv.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",
    sort_the_paragraphs_prompt_content_rules_title: "**Inhaltsregeln:**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` muss eine aus dem Inhalt erschließbare logische Abfolge bilden, ohne künstliche Hinweise (Nummern, Daten/Uhrzeiten, „zuerst/dann/schließlich“), außer bei ausdrücklicher Anforderung.",
    sort_the_paragraphs_prompt_rule2: "2. Keine flache Liste: Jeder Satz führt denselben roten Faden weiter (Ursache→Wirkung, Vorbereitung→Handlung→Ergebnis, allgemein→speziell), damit die Reihenfolge erschließbar ist.",
    sort_the_paragraphs_prompt_example_json_title: "**Beispiel-JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "Meine Morgenroutine:",
"paragraphs": [
  "Ich fülle den Wasserkocher mit frischem Wasser.",
  "Ich schalte ihn ein.",
  "Ich lege einen Teebeutel in die Tasse.",
  "Ich gieße das kochende Wasser über den Beutel.",
  "Ich entferne den Beutel, sobald der Tee fertig gezogen hat."
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code ohne Kommentare.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Lösung anzeigen",
    retryButtonLabel: "Wiederholen",
    solutionViewTitle: "Lösung",
    correctText: "Richtig!",
    incorrectText: "Falsch!",
    muteButtonLabel: "Stummschalten",
    closeButtonLabel: "Schließen",
    slideOfTotal: "Folie @slide von @total",
    nextButtonLabel: "Weiter",
    solutionListQuestionNumber: "Frage @question",
    a11yShowSolution: "Zeigen Sie die Lösung an. Die Aufgabe wird mit der richtigen Lösung markiert.",
    a11yRetry: "Versuchen Sie die Aufgabe erneut. Setzen Sie alle Antworten zurück und beginnen Sie von vorne.",
    shouldSelect: "Sollte auswählen",
    shouldNotSelect: "Sollte nicht auswählen",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften und erstellen eine H5P-Aktivität \"Einzelwahl-Satz\".",
    single_choice_set_prompt_mission: "**Ihre Mission:**",
    single_choice_set_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P-Aktivität vom Typ Einzelwahl-Satz.",
    single_choice_set_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    single_choice_set_prompt_json_structure_main_object: "Das Objekt muss enthalten:",
    single_choice_set_prompt_choices_array: "`choices`: Ein Array von Objekten, wobei jedes Objekt eine Frage darstellt und Folgendes enthält:",
    single_choice_set_prompt_question: "`question`: Die zu stellende Frage.",
    single_choice_set_prompt_answers_array: "`answers`: Ein Array von Zeichenfolgen. Die erste Zeichenfolge ist immer die richtige Antwort.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (STRIKTE REGEL) Du musst zwingend ein Array aus 6 Objekten für das Abschluss-Feedback erzeugen, thematisch an die Übung angepasst, und strikt folgende Score-Bereiche einhalten: 0-10, 11-30, 31-50, 51-70, 71-90 und 91-100. Jedes Objekt hat die Form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. Der `feedback`-Text soll wohlwollend, nicht übertrieben, abgestuft und stets affirmativ sein.",
    single_choice_set_prompt_content_rules_title: "**Inhaltsregeln:**",
    single_choice_set_prompt_rule1: "1.  In jedem `answers`-Array ist die erste Antwort immer die richtige.",
    single_choice_set_prompt_example_json_title: "**Beispiel-JSON:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "Gojibeeren sind auch bekannt als ...",
"answers": ["Wolfbeeren", "Katzenbeeren", "Bärenbeeren"]
},
{
"question": "Gojibeeren stammen aus ...",
"answers": ["Asien", "Afrika", "Europa"]
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code ohne Kommentare.",

    // Dialog Cards UI translations
    answer: "Umdrehen",
    next: "Weiter",
    prev: "Zurück",
    retry: "Wiederholen",
    progressText: "Karte @card von @total",
    cardFrontLabel: "Kartenvorderseite",
    cardBackLabel: "Kartenrückseite",
    tipButtonLabel: "Tipp anzeigen",
    audioNotSupported: "Ihr Browser unterstützt dieses Audioformat nicht",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "Sie sind ein Experte für pädagogische Ingenieurwissenschaften und erstellen eine H5P-Aktivität \"Dialogkarten\".",
    dialog_cards_prompt_mission: "**Ihre Mission:**",
    dialog_cards_prompt_generate_json: "Generieren Sie ein JSON-Objekt, das nur die Schlüssel `title`, `description` und `dialogs` für eine H5P-Aktivität vom Typ Dialogkarten enthält.",
    dialog_cards_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    dialog_cards_prompt_json_structure_main_object: "Das Objekt muss enthalten:",
    dialog_cards_prompt_title: "`title`: Ein Titel für die Aktivität (HTML-Format).",
    dialog_cards_prompt_description: "`description`: Eine kurze Beschreibung oder Anweisung (HTML-Format).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: Ein Array von ${nombreQuestions} Objekten, die jeweils eine Karte darstellen und Folgendes enthalten:",
    dialog_cards_prompt_text: "`text`: Der Text auf der Vorderseite der Karte (HTML-Format).",
    dialog_cards_prompt_answer: "`answer`: Der Text auf der Rückseite der Karte (HTML-Format).",
    dialog_cards_prompt_tips: "`tips` (optional): Ein Objekt für Hinweise. Wenn Sie es für pädagogisch sinnvoll halten, fügen Sie einen Hinweis für die Vorderseite mit dem Schlüssel `front` und/oder für die Rückseite mit dem Schlüssel `back` hinzu.",
    dialog_cards_prompt_content_rules_title: "**Inhaltsregeln:**",
    dialog_cards_prompt_rule1: "1. Die Texte für die Vorderseite (`text`) und die Rückseite (`answer`) müssen klar und prägnant sein. **Formatieren Sie den Inhalt mit HTML (<strong> für fett, <em> für kursiv), um die Lesbarkeit zu verbessern und wichtige Informationen hervorzuheben.**",
    dialog_cards_prompt_example_json_title: "**Beispiel-JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "Lerne die Namen der Früchte auf Englisch",
"description": "Die Fruchtnamen werden auf Französisch präsentiert. Drehe die Karten um, um die richtige englische Übersetzung zu sehen.",
"dialogs": [
{
"title": "Finde die englischen Verben im Präsens",
"description": "Ausgehend von einem englischen Satz im Präteritum, finde das Verb im Infinitiv. Drehe die Karten um, um deine Antworten zu überprüfen.",
"dialogs": [
{
"text": "He *visited* his grandmother.",
"answer": "to *visit*",
"tips": {
"front": "Erkenne das Verb im Präteritum.",
"back": "Denke an die Grundform (Infinitiv) des Verbs."
}
},
{
"text": "She *played* soccer.",
"answer": "to *play*",
"tips": {
"front": "Suche nach dem Verb in der Vergangenheitsform.",
"back": "Stell dir die Grundform des Verbs vor."
}
}
]
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code, der die Schlüssel `title`, `description` und `dialogs` enthält, ohne Kommentare.",

    // Dialog Cards specific UI translations
    correctAnswer: "Ich hatte es richtig!",
    incorrectAnswer: "Ich hatte es falsch",
    round: "Runde @round",
    cardsLeft: "Verbleibende Karten: @number",
    nextRound: "Weiter zu Runde @round",
    startOver: "Von vorne beginnen",
    showSummary: "Weiter",
    summary: "Zusammenfassung",
    summaryCardsRight: "Karten, die Sie richtig hatten:",
    summaryCardsWrong: "Karten, die Sie falsch hatten:",
    summaryCardsNotShown: "Nicht gezeigte Karten im Pool:",
    summaryOverallScore: "Gesamtpunktzahl",
    summaryCardsCompleted: "Karten, die Sie gelernt haben:",
    summaryCompletedRounds: "Abgeschlossene Runden:",
    summaryAllDone: "Gut gemacht! Sie haben alle @cards Karten @max Mal hintereinander richtig beantwortet!",
    confirmStartingOverHeader: "Von vorne beginnen?",
    confirmStartingOverBody: "Ihr gesamter Fortschritt geht verloren. Sind Sie sicher, dass Sie von vorne beginnen möchten?",
    confirmStartingOverCancelLabel: "Abbrechen",
    confirmStartingOverConfirmLabel: "Von vorne beginnen",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "Sie sind ein Experte für Instruktionsdesign und erstellen eine H5P-Aktivität „Complex Fill the Blanks“.",
    complex_blanks_prompt_mission: "**Ihre Mission:**",
    complex_blanks_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P-Aktivität vom Typ Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    complex_blanks_prompt_json_structure_main_object: "Das Hauptobjekt muss die Schlüssel `content` und `overallFeedback` enthalten.",
    complex_blanks_prompt_task: "`task`: Die Anweisung für die Übung (in HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: Der Text mit den Lücken, dargestellt durch `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: Ein Array von Objekten, eines für jede Lücke, in der Reihenfolge ihres Erscheinens.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: Die richtige Antwort (kann Alternativen mit `/` enthalten).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: Ein Array von Objekten für häufige Fehler.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: Der Text eines häufigen Fehlers.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: Das spezifische Feedback für diesen Fehler (in HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: Ein Array für allgemeines Feedback basierend auf der Punktzahl.",
    complex_blanks_prompt_content_rules_title: "**Inhaltsregeln:**",
    complex_blanks_prompt_rule1: "1. Die Anzahl der Objekte in `blanksList` muss mit der Anzahl der Lücken in `blanksText` übereinstimmen.",
    complex_blanks_prompt_rule2: "2. Bieten Sie häufige Fehler und konstruktives Feedback an.",
    complex_blanks_prompt_rule3: "3. Der Text und das Feedback können einfache HTML-Tags wie `<p>`, `<strong>`, `<em>` enthalten.",
    complex_blanks_prompt_example_json_title: "**Beispiel-JSON:**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Setze die Verben in die richtige Zeitform. Du erhältst individuelles Feedback für typische Fehler.</p>",
"blanksList": [
{
"correctAnswerText": "spricht nicht",
"incorrectAnswersList": [
{
"incorrectAnswerText": "nicht spricht",
"incorrectAnswerFeedback": "<div>Denk daran: 'nicht' steht normalerweise hinter dem konjugierten Verb <em>(sprechen)</em>.</div>"
},
{
"incorrectAnswerText": "sprechen nicht",
"incorrectAnswerFeedback": "<div>Du hast die Endung für die dritte Person Singular im Präsens vergessen <em>(er)</em>.</div>"
}
]
}
],
"blanksText": "<p>Er spricht Englisch, aber er (nicht / sprechen) ___________<strong>&nbsp;</strong>Deutsch.</p>"
},
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback für 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback für 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback für 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback für 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback für 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback für 91-100%" }
]
}
\`\`\` `,
    complex_blanks_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code ohne Kommentare.",

    // Chart Prompt
    chart_prompt_role: "Sie sind ein Experte für Instruktionsdesign und erstellen eine H5P-Aktivität \"Diagramm\".",
    chart_prompt_mission: "**Ihre Mission:**",
    chart_prompt_generate_json: "Generieren Sie ein vollständiges und gültiges JSON-Objekt für eine H5P-Diagrammaktivität.",
    chart_prompt_json_structure_title: "**Erwartete JSON-Struktur:**",
    chart_prompt_json_structure_main_object: "Das Objekt muss enthalten:",
    chart_prompt_graph_mode: "`graphMode`: Wählen Sie den relevantesten Diagrammtyp, 'pieChart' (Kreisdiagramm) oder 'barChart' (Balkendiagramm), basierend auf dem Kontext, sofern nicht anders angewiesen.",
    chart_prompt_list_of_types: "`listOfTypes`: Ein Array von Objekten, die jeweils einen Datenpunkt im Diagramm darstellen.",
    chart_prompt_value: "`value`: Der numerische Wert des Datenpunkts.",
    chart_prompt_color: "`color`: Die Farbe des Datenpunkts (Hex-Code).",
    chart_prompt_font_color: "`fontColor`: Die Farbe des Textes für den Datenpunkt (Hex-Code).",
    chart_prompt_text: "`text`: Die Beschriftung für den Datenpunkt.",
    chart_prompt_figure_definition: "`figureDefinition`: Eine kurze Beschreibung des Diagramms.",
    chart_prompt_content_rules_title: "**Inhaltsregeln:**",
    chart_prompt_rule1: "1. Wählen Sie kontrastierende Farben für eine gute Lesbarkeit.",
    chart_prompt_rule2: "2. Beschriftungen sollten kurz und klar sein.",
    chart_prompt_rule3: "3. Wenn ein Wert im Vergleich zu anderen sehr niedrig ist, bevorzugen Sie ein 'barChart' für eine bessere Visualisierung.",
    chart_prompt_example_json_title: "**Beispiel-JSON:**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Blaubeeren"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Himbeeren"}
],
"figureDefinition": "Diagramm"
}
\`\`\` `,
    chart_prompt_generate_only_json: "Generieren Sie nur den gültigen JSON-Code ohne Kommentare.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Zurück",
    quiz_next_button: "Weiter",
    quiz_finish_button: "Fertig",
    quiz_submit_button: "Absenden",
    quiz_textual_progress: "Frage @current von @total",
    quiz_no_result_message: "Abgeschlossen",
    quiz_result_message: "Ihre Ergebnisse:",
    quiz_score_bar_label: "Sie haben @finals von @totals Punkten erreicht",
    quiz_solution_button_text: "Lösung anzeigen",
    quiz_retry_button_text: "Wiederholen",
    quiz_finish_button_text: "Fertig",
    quiz_submit_button_text: "Absenden",
    quiz_feedback_available: "Feedback verfügbar",
    quiz_read_feedback: "Feedback lesen",
    quiz_wrong_answer: "Falsche Antwort",
    quiz_correct_answer: "Richtige Antwort",
    quiz_should_check: "Hätte markiert werden sollen",
    quiz_should_not_check: "Hätte nicht markiert werden sollen",
    quiz_no_input: "Bitte antworten Sie, bevor Sie die Lösung ansehen.",
    quiz_a11y_check: "Überprüfen Sie die Antworten. Die Antworten werden als richtig, falsch oder unbeantwortet markiert.",
    quiz_a11y_show_solution: "Zeigen Sie die Lösung an. Die Aufgabe wird mit der richtigen Lösung markiert.",
    quiz_a11y_retry: "Versuchen Sie die Aufgabe erneut. Setzen Sie alle Antworten zurück und beginnen Sie von vorne.",

    // Caramel-KI — Generierung
    generate_with_llm: "Mit der Caramel-KI generieren",
    generation_in_progress: "Generierung läuft, bitte warten...",
    request_sent_to_ia: "Anfrage an die KI gesendet, bitte warten...",
    generation_successful: "H5P-Inhalt erfolgreich generiert!",
    generation_failed_empty: "Die Generierung ist fehlgeschlagen. Die Antwort war leer.",
    generation_failed_error: "Fehler bei der Generierung: {errorMessage}",
    generation_failed_llm: "Generierung über die Caramel-KI fehlgeschlagen. Ursache: {errorMessage}",

    // Modellbeschreibungen (Caramel-KI)
    llm_small_summary: "Weiches Karamell: schnell, leicht, perfekt für Blitzübungen und Antworten ohne Wartezeit. Verbraucht wenig.",
    llm_large_summary: "Fließendes Karamell: reicher und nuancierter, ideal für Aufgaben, die etwas Tiefe erfordern. Verbraucht mehr.",
    llm_xl_summary: "Hartes Karamell: leistungsstark und komplex, für ambitionierte Projekte. Geduld erforderlich, Ergebnis garantiert! Verbraucht deutlich mehr.",

    // Freundliche Modellnamen (Menüanzeige)

    // Modellangaben (Caramel-KI)
    llm_model_source: "Modellanbieter:",
    llm_model_parameters: "Modellgröße:",
    llm_model_parameters_unit: "Mrd Parameter",

    language: "Sprache",
    tutorial: "Anleitung",
    version_modal_title: "Neue Version verfügbar",
    version_modal_message: "Sie verwenden derzeit Version {currentVersion}. Eine aktuellere Version ({latestVersion}) steht bereit. Laden Sie die Seite neu, um die neuesten Verbesserungen zu erhalten.",
    version_modal_update: "Neueste Version laden",
    version_modal_remind_later: "Später erinnern",

    // Glossar-XML-Prompt
    glossaire_xml_prompt_role: "Du bist Experte für Instruktionsdesign und erstellst den Inhalt für ein Glossar.",
    glossaire_xml_prompt_mission: "**Deine Mission:** Du sollst ein einfaches JSON-Objekt erzeugen, das eine Liste von Begriffen für ein Glossar enthält. Jeder Begriff muss ein Konzept, eine Definition und – falls relevant – eine Liste von Aliassen haben.",
    glossaire_xml_prompt_structure_title: "**Erwartete JSON-Struktur:**",
    glossaire_xml_prompt_structure_rules: `
-   **Wurzel:** Ein Hauptobjekt mit zwei Schlüsseln: \`name\` (der Name des Glossars) und \`entries\` (ein Array von Objekten).
-   **Jedes Objekt in \`entries\` muss enthalten:**
    -   \`concept\`: Das zu definierende Wort oder die Wortgruppe.
    -   \`definition\`: Eine klare und prägnante Definition. Verwende *mot* für fett, **mot** für kursiv und \\n für Zeilenumbrüche, nur wenn es pädagogisch sinnvoll ist.
    -   \`aliases\` (optional): Ein Array aus Zeichenketten für Synonyme oder alternative Begriffe. Füge diesen Schlüssel nur hinzu, wenn relevante Aliasse existieren.`,
    glossaire_xml_prompt_example_title: "**JSON-Beispiel:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "Lexikon der Information",
  "entries": [
    {
      "concept": "Journalist",
      "definition": "Person, die **sammelt**, prüft und *Informationen* verbreitet.",
      "aliases": ["Reporter", "Kolumnist"]
    },
    {
      "concept": "Quelle",
      "definition": "Ursprung einer *Information*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Erzeuge nur gültigen JSON-Code, ohne jeglichen Kommentar.",
    
    //Barre de menu
    tab_all: "Alle",
    tab_quiz: "Quiz & Tests",
    tab_text: "Textmanipulation",
    tab_memory: "Auswendiglernen & Entdecken",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 Prompt erhalten",
    create_file_step: "2/2 Datei erstellen",
    generate_one_click: "Ein-Klick-Generierung",
    simple_mode: "Einfach",
    advanced_mode: "Geführt",

    // RAG feature
    activate_rag: "Dokumentenabfrage aktivieren",
    rag_tooltip: "Ermöglicht das Einfügen von Text oder das Hochladen einer PDF. Der Inhalt wird als Hauptquelle zur Generierung der Aktivitäten verwendet.",
    rag_title: "Dokumente anhängen (optional)",
    rag_note: "Wenn Sie möchten, dass die KI ausschließlich auf der Grundlage Ihrer Dokumente arbeitet, fügen Sie Ihren Text hier ein oder legen Sie Ihre Dateien hier ab. Andernfalls lassen Sie diesen Bereich leer, damit die KI selbst nach Informationen suchen kann.",
    upload_pdf: "Oder laden Sie eine PDF zur Analyse hoch",
    pdf_loading: "PDF wird geladen...",
    pdf_processing_page: "Seite wird verarbeitet",
    ocr_recognizing_page: "Texterkennung (OCR) der Seite",
    ocr_success: "Das Dokument wurde erfolgreich verarbeitet.",
    ocr_error: "Bei der Verarbeitung ist ein Fehler aufgetreten.",
    error_invalid_pdf: "Bitte wählen Sie eine gültige PDF-Datei aus.",
    error_duplicate_pdf: "Diese Datei wurde bereits hinzugefügt.",
    error_fullscreen: "Vollbildmodus fehlgeschlagen:",
    lock_text: "Sperren",
    unlock_text: "Entsperren",
    rag_instruction: "\n\nSie dürfen zur Generierung des Inhalts nur die folgenden Informationen konsultieren:",
    drag_drop_text: "Ziehen Sie eine PDF-Datei hierher und legen Sie sie ab",
    or_text: "oder",
    upload_pdf_btn: "Datei auswählen",
    paste_your_text_here: "Kopieren Sie Ihren Text hierher und fügen Sie ihn ein...",
    rag_tags_tuto: "Unten finden Sie die hochgeladenen Dokumente. Klicken Sie auf den farbigen Kreis, um die Hervorhebung jedes Dokuments anzupassen.",

    // Karamell-Zubereitungsschritte
    caramel_animation_step_1: "Zucker in den Topf geben...",
    caramel_animation_step_2: "Etwas Wasser hinzufügen...",
    caramel_animation_step_3: "Bei mittlerer Hitze erhitzen...",
    caramel_animation_step_4: "Der Zucker beginnt zu schmelzen...",
    caramel_animation_step_5: "Er beginnt sich zu färben...",
    caramel_animation_step_6: "Langsam umrühren...",
    caramel_animation_step_7: "Das Karamell bekommt eine schöne bernsteinfarbene Farbe...",
    caramel_animation_step_8: "Die heiße Sahne hinzufügen...",
    caramel_animation_step_9: "Vorsicht vor Spritzern!",
    caramel_animation_step_10: "Gut umrühren...",
    caramel_animation_step_11: "Es ist fast fertig!",

    // Seiten-Prompt
    page_prompt_role: "Du bist Expert:in für Instructional Design und erstellst eine strukturierte Aktivität „Seite“ für Éléa/Moodle.",
    page_prompt_mission: "**Deine Mission :**",
    page_prompt_generate_json: "Erzeuge ein JSON-Objekt, um eine Éléa-Inhaltsseite zu erstellen. Die Seitenstruktur basiert auf vordefinierten Blöcken. Du musst aus der Liste unten die relevantesten Blöcke auswählen, um der Nutzeranfrage zu entsprechen.",
    page_prompt_json_structure_title: "**Erwartete JSON-Struktur :**",
    page_prompt_json_structure_main_object: "Das Hauptobjekt muss den Schlüssel \"title\" für den Seitentitel, den Schlüssel \"intro\" für eine klare, verständliche Einführung in die folgenden Kursinhalte und den Schlüssel \"blocks\" enthalten, der ein Array von Objekten ist. Jedes Objekt repräsentiert einen Inhaltsblock und muss einen \"type\" besitzen, der einem der unten aufgeführten Blöcke entspricht, sowie ein Objekt \"data\" mit den blockspezifischen Informationen.",
    page_prompt_blocks_list_title: "**Liste der verfügbaren Blöcke :**",
    page_prompt_block_01: "- `#01_hero_header`: Eröffnungsbanner. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: Inhaltsverzeichnis mit internen Links. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: Historische Eckpunkte in 3 Karten. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (max. 3 Karten)",
    page_prompt_block_04: "- `#04_callout_set`: Banner Ziele, Wissenswertes, Warnung. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: Kennzahlen in Karten. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: Wortschatz-Tabelle. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: Glossar als Chips. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: Monumentkarten mit Bildern. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: Zwei Bilder im Vergleich. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: Vergleichstabelle. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: Definitionskasten. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"Definition\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: Kursabsätze. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: Ausführliches Datenblatt. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: Häufig gestellte Fragen. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: Mythen vs. Realitäten. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"Mythen\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"Realitäten\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: Methode zum Beschreiben eines Bildes. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: Webographie. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"Webographie\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: Zweisprachiges Zitat. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**Regeln für den Inhalt :**",
    page_prompt_rule1: "1.  Das JSON muss gültig sein.",
    page_prompt_rule2: "2.  Textinhalte können Markdown-Tags `*Wort*` für Fett und `**Wort**` für Kursiv verwenden.",
    page_prompt_rule3: "3.  Für Bilder: Finde relevante, lizenzfreie URLs (z. B.: Wikimedia Commons).",
    page_prompt_example_json_title: "**JSON-Beispiel :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "Die Französische Revolution",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "Die Französische Revolution", "subtitle": "Wesentliche Orientierungspunkte" } },
    { "type": "#12_context_paragraphs", "data": { "title": "Kontext", "paragraphs": ["Die Französische Revolution ist eine Zeit tiefgreifender Umbrüche...", "Mehrere Ursachen erklären dieses Ereignis..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "Schlüsselereignisse", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "Sturm auf die Bastille", "caption": "14. Juli 1789", "title": "Sturm auf die Bastille", "text": "Dieses Ereignis markiert den Beginn der Revolution." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "Erzeuge nur gültigen JSON-Code, ohne jeglichen Kommentar."
};
