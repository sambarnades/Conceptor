const translations_nl = {
    subtitle: "Ondersteunde creatie van bronnen en activiteiten voor Magistère en Éléa",
    help_button: "Help",
    help_modal_title: "🚀 Compleet Caramel-handboek voor docenten",
    help_modal_content: `
    <p>Welkom bij <strong>Caramel</strong>! Deze gids begeleidt je stap voor stap, ook als je net begint. Ons doel is om je te helpen interactieve leeractiviteiten eenvoudig en efficiënt te maken.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Beschrijven</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Kiezen</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Genereren</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Downloaden</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Community</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> Onze filosofie: jij houdt de regie!</h4>
        <p>Met Caramel is AI een assistent, maar jij stuurt. Je behoudt in elke fase de controle:</p>
        <ul>
            <li><strong>Vooraf:</strong> Je bepaalt het didactische kader door de beschrijvingsvelden in te vullen.</li>
            <li><strong>Tijdens:</strong> Nadat de AI de inhoud (JSON-code) heeft gegenereerd, kun je die direct in de editor bijstellen.</li>
            <li><strong>Achteraf:</strong> Ook na het downloaden kun je het bestand in andere tools openen en bewerken.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Beschrijf je behoefte: het startpunt</h4>
        <p>Hier begint alles. Hoe duidelijker je beschrijving, hoe relevanter het resultaat. Je hebt twee opties:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Snelle modus</span></h5>
            <p>Ideaal voor de hoofdzaken. Vul twee velden in:</p>
            <ul>
                <li><strong>Wie ben je?</strong> Wees direct. Geen volledige zin nodig. Voorbeelden: <em>Docent wiskunde</em>, <em>Academische trainer</em>.</li>
                <li><strong>Wat wil je behandelen?</strong> De kern van je vraag. Wees zo volledig mogelijk. Voeg onderwerp, niveau en randvoorwaarden toe. Voorbeeld: <em>Een inleiding tot breuken voor 1e klas van het voortgezet onderwijs, met concrete voorbeelden zoals het delen van een taart.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Geavanceerde modus</span></h5>
            <p>Voor een meer gestructureerde vraag biedt deze modus precieze velden:</p>
            <ul>
                <li><strong>Vaks, Thema, Niveau:</strong> om de context te bepalen.</li>
                <li><strong>Aantal items:</strong> Erg belangrijk! Aantal vragen, data op een tijdlijn, woorden in een glossarium, enz.</li>
                <li><strong>Aanvullende info:</strong> Ruimte voor specifieke instructies, beperkingen of andere relevante details.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Documentlezing inschakelen</span><br>
            Met deze krachtige optie kun je genereren op basis van eigen content. <strong>Kopieer-plak tekst</strong> of <strong>upload een PDF</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacy:</strong> Je document wordt <strong>volledig lokaal op je computer</strong> verwerkt. Er wordt niets naar internet verzonden.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Kies het activiteitstype</h4>
        <p>Na de beschrijving worden de activiteitstegels actief. Klik op de tegel die past bij je didactisch doel.</p>
        <details>
            <summary><strong>Klik hier voor details van de beschikbare activiteiten</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Interactieve activiteiten in H5P-formaat. Activiteiten met een ster <span class="feedback-star">*</span> bevatten standaard uitgebreide feedback in 6 scorebanden.</p>
            <ul>
                <li><strong>Tijdlijn:</strong> Interactieve tijdlijn met een reeks gebeurtenissen.</li>
                <li><strong>Flashcards:</strong> Kaarten voor memorisatie (voor-/achterzijde).</li>
                <li><strong>Quiz (Question Set) <span class="feedback-star">*</span>:</strong> Set van gevarieerde vragen (MC, drag-and-drop, enz.).</li>
                <li><strong>Glossarium:</strong> Glossarium of FAQ als accordeon.</li>
                <li><strong>Kruiswoord <span class="feedback-star">*</span>:</strong> Kruiswoordpuzzel op basis van definities.</li>
                <li><strong>Schrijfopdracht <span class="feedback-star">*</span>:</strong> Schrijfonderwerp met automatische sleutelwoordcorrectie.</li>
                <li><strong>Samenvatting <span class="feedback-star">*</span>:</strong> Leerlingen stellen een juiste samenvatting samen door zinnen te kiezen.</li>
                <li><strong>Woorden slepen <span class="feedback-star">*</span>:</strong> Tekst waarin leerlingen ontbrekende woorden slepen.</li>
                <li><strong>Invultekst <span class="feedback-star">*</span>:</strong> Ontbrekende woorden via toetsenbord invullen.</li>
                <li><strong>Woorden markeren <span class="feedback-star">*</span>:</strong> Bepaalde woorden in een tekst markeren.</li>
                <li><strong>Waar/Onwaar:</strong> Eenvoudige binaire vragen.</li>
                <li><strong>Meerkeuze <span class="feedback-star">*</span>:</strong> MC-vragen met één of meerdere juiste antwoorden.</li>
                <li><strong>Woordzoeker:</strong> Letterrooster om woorden te vinden.</li>
                <li><strong>Alinea’s ordenen <span class="feedback-star">*</span>:</strong> Alinea’s in de juiste volgorde zetten.</li>
                <li><strong>Reeks enkelvoudige keuze <span class="feedback-star">*</span>:</strong> Reeks vragen met exact één goed antwoord.</li>
                <li><strong>Dialoogkaarten:</strong> Interactieve kaarten met tekst en audio.</li>
                <li><strong>Geavanceerde invultekst <span class="feedback-star">*</span>:</strong> Cloze-opgave met specifieke feedback per fout.</li>
                <li><strong>Diagram:</strong> Cirkeldiagram of staafdiagram voor datavisualisatie.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Toets (XML / GIFT):</strong> Bank met gevarieerde vragen (MC, koppelen, enz.) voor import in Moodle.</li>
                <li><strong>MC (MBZ):</strong> Snelle, eenvoudige meerkeuze-activiteit.</li>
                <li><strong>Koppelen (MBZ):</strong> Koppelspel met paren.</li>
                <li><strong>Miljonair (MBZ):</strong> Quiz met oplopende moeilijkheid.</li>
                <li><strong>Glossarium (XML):</strong> Bestand om definities in een Moodle-glossarium te importeren.</li>
                <li><strong>Pagina (MBZ / HTML):</strong> Gestructureerde, visueel opgemaakte cursuspagina voor Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Inhoud genereren en verfijnen</h4>
        <p>Na een klik op een tegel opent een venster. Hier werk je met de AI.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Optie A: In één klik genereren</h5>
            <p>De snelle route. Klik op <button class="help-btn-example-llm">In één klik genereren</button> zodat de AI de inhoud maakt en direct rechts in het resultaatgebied plaatst. Via het pijltje rechts op de knop kies je verschillende AI-modellen (snel, krachtig...).</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Optie B: Externe AI gebruiken</h5>
            <p>Voor maximale controle. De prompt (instructie voor de AI) verschijnt links.</p>
            <ol>
                <li>Pas de prompt aan indien gewenst.</li>
                <li>Gebruik de knop <strong>Prompt kopiëren</strong> en open een publiek toegankelijke AI naar keuze in een nieuw tabblad.</li>
                <li>Plak de prompt in de AI, kopieer de output en plak die rechts in het resultaatgebied in Caramel.</li>
            </ol>
            <p>Handige pictogrammen: <span class="help-badge-icon"><i class="fas fa-expand"></i> Volledig scherm</span> en <span class="help-badge-icon"><i class="fas fa-lock"></i> Vergrendelen</span> om de prompt te beschermen.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Downloaden en integreren</h4>
        <p>Als de inhoud klaar is, klik op de downloadknop (bijv. <button class="help-btn-example-download">H5P genereren</button>). Zo integreer je bestanden in Éléa/Moodle:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (H5P-activiteiten)</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>Eenvoudige methode:</strong> Zet bewerken aan in je cursus en sleep het .h5p-bestand naar de gewenste sectie. Ideaal voor snel gebruik.</li>
                        <li><strong>Aanbevolen methode (voor ontwerpers):</strong> “Activiteit of bron toevoegen” → “Interactieve inhoud (H5P)” → upload je .h5p bij “Bestand”. Zo wordt de activiteit correct meegenomen bij het delen.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Pagina, Miljonair, Koppelen, MC)</summary>
                <div class="import-content">
                    <p>Dit formaat importeert een complete activiteit in je cursus.</p>
                    <ol>
                        <li>In je cursus: tandwielmenu → “Herstellen”.</li>
                        <li>Sleep je .mbz-bestand naar het importgebied.</li>
                        <li>Volg de stappen via “Doorgaan”. De activiteit wordt toegevoegd.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> en <span class="help-badge-file">GIFT</span> (Toetsactiviteit)</summary>
                <div class="import-content">
                    <p>Deze formaten importeren vragen in de “Vragenbank”.</p>
                    <ol>
                        <li>Ga naar “Meer” in je cursus → “Vragenbank”.</li>
                        <li>Klik op het tabblad “Importeren”.</li>
                        <li>Kies “Moodle XML-formaat” of “GIFT-formaat”.</li>
                        <li>Sleep je bestand naar “Importeren” en bevestig.</li>
                        <li>Je vragen staan nu in de bank en zijn klaar voor een “Toets”.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternatief voor activiteit “Pagina”)</summary>
                <div class="import-content">
                    <p>Voor handmatige contentcontrole.</p>
                    <ol>
                        <li>Open het .html-bestand met een teksteditor (bijv. Kladblok) en kopieer de volledige inhoud.</li>
                        <li>Voeg in Éléa een activiteit “Pagina” toe.</li>
                        <li>Klik in de pagina-editor op het pictogram om naar HTML-modus te schakelen (vaak weergegeven als \`</\>\`).</li>
                        <li>Plak de gekopieerde inhoud en sla op.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Community & Support</h4>
        <p>Caramel is een levend project en jouw feedback is waardevol!</p>
        <ul>
            <li><strong>Discussie & Vragen:</strong> Sluit je aan bij de <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a>-ruimte om met de community uit te wisselen.</li>
            <li><strong>Bug melden:</strong> Probleem? Maak een <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">issue</a> aan. Voeg indien mogelijk het JSON-bestand toe dat de fout veroorzaakte.</li>
            <li><strong>Project steunen:</strong> Vind je de tool handig? Geef ons een ster op de <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">Forge-pagina</a>. Dat waarderen we enorm!</li>
        </ul>
    </div>
    `,
    fast_mode: "Snelle modus",
    guided_mode: "Geavanceerde modus",
    who_are_you: "Wie bent u? (bv.: Docent, trainer...)",
    what_to_address: "Wat wilt u behandelen? (bv.: De aard van een hoek in de brugklas...)",
    discipline: "Discipline (bv.: Geschiedenis)",
    theme: "Thema (bv.: De Franse Revolutie)",
    level: "Niveau (bv.: Tweede jaar beroepsonderwijs)",
    number_of_elements: "Aantal elementen (bv.: 10)",
    additional_info: "Aanvullende informatie...",
    generate_prompts: "Prompts genereren",
    h5p_tab: "H5P",
    moodle_tab: "Éléa/Moodle-modules",

    // General Context (Advanced Mode)
    prompt_expert_intro: "Je bent een didactisch expert die toon en woordenschat aanpast aan de huidige leerplannen en het niveau van de leerlingen voor de les ",
    prompt_context_title: "**Context:**",
    prompt_subject: "- **Vak:**",
    prompt_student_level: "- **Leerlingniveau:**",
    prompt_theme: "- **Thema:**",
    prompt_number_of_elements: "- **Aantal elementen:**",
    prompt_additional_info: "- **Aanvullende informatie:**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "Ik ben een **",
    prompt_simple_intro_part2: "** en ik wil **",
    prompt_language_instruction: "De gegenereerde inhoud moet in het Nederlands zijn, tenzij in het verzoek een andere taal wordt opgegeven.",
    prompt_code_block_instruction: "Je moet het resultaat in een codeblok genereren.",

    // Timeline Prompt
    timeline_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Timeline\".",
    timeline_prompt_mission: "**Jouw missie:**",
    timeline_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-activiteit van het type Timeline. De JSON moet direct bruikbaar zijn.",
    timeline_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    timeline_prompt_json_structure_main_object: "Het hoofdobject moet de sleutel \"timeline\" bevatten. Dit object \"timeline\" moet omvatten:",
    timeline_prompt_headline: "`headline`: Een algemene titel voor de tijdlijn.",
    timeline_prompt_text: "`text`: Een korte inleidende alinea.",
    timeline_prompt_asset: "`asset`: Een object voor de omslagafbeelding met `media` (URL), `caption` (onderschrift) en `credit` (bron).",
    timeline_prompt_date_array: "`date`: Een array met ${nombreQuestions} objecten, elk een gebeurtenis.",
    timeline_prompt_era_array: "`era`: Een array met objecten voor periodes die meerdere gebeurtenissen omvatten.",
    timeline_prompt_content_rules_title: "**Regels voor de inhoud:**",
    timeline_prompt_rule1: "1.  Elke gebeurtenis in de array `date` moet bevatten:",
    timeline_prompt_rule1_startDate: "-   `startDate` en `endDate`: Datum in de notatie \"JJJJ,MM,DD\" of \"JJJJ\". Gebruik `endDate` om een periode te definiëren.",
    timeline_prompt_rule1_headline: "-   `headline`: Titel van de gebeurtenis.",
    timeline_prompt_rule1_text: "-   `text`: Tekstbeschrijving. Gebruik `*woord*` voor vet, `**woord**` voor cursief en `\\n` voor regeleinden.",
    timeline_prompt_rule1_asset: "-   `asset`: Een optioneel object met een illustrerende afbeelding.",
    timeline_prompt_rule1_tag: "- `tag`: Een trefwoord dat de periode kenmerkt (bv. 'geschiedenis', 'wetenschap').",
    timeline_prompt_rule2: "2.  Zoek voor elke `asset` actief naar een relevante, rechtenvrije afbeelding (bv. Wikimedia Commons). De URL in `media` moet een directe en geldige link zijn. Vermeld de bron en licentie in `credit`. Als er geen geschikte afbeelding wordt gevonden, laat het `asset`-object dan volledig weg.",
    timeline_prompt_rule3: "3.  Voeg voor elke periode (`era`) een `text`-veld toe met een korte beschrijving en een `tag`.",
    timeline_prompt_example_json_title: "**Voorbeeld van JSON-structuur:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Titel van de tijdlijn",
"text": "Inleiding tot het thema van de tijdlijn.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Begin van de Eerste Wereldoorlog",
"text": "Oostenrijk-Hongarije verklaart de oorlog aan Servië.",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "Aartshertog Franz Ferdinand vlak voor zijn moord.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "Oorlog"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Wapenstilstand van 1918",
"text": "Ondertekening van de wapenstilstand in Rethondes, waarmee de gevechten eindigden.",
"tag": "Verdrag"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Eerste Wereldoorlog",
"text": "Dit is de periode van de Grote Oorlog.",
"tag": "Historische periode"
}
]
}
}
\`\`\` `,
    timeline_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar. Het resultaat wordt direct door een ander hulpmiddel gebruikt.",

    // Crossword Prompt
    crossword_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Crossword\".",
    crossword_prompt_mission: "**Jouw missie:**",
    crossword_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-kruiswoordactiviteit.",
    crossword_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    crossword_prompt_json_structure_main_object: "Het object moet bevatten:",
    crossword_prompt_title: "`title`: Een titel voor de activiteit.",
    crossword_prompt_words_array: "`words`: Een array van ${nombreQuestions} objecten, elk met:",
    crossword_prompt_answer: "`answer`: Het te raden woord.",
    crossword_prompt_clue: "`clue`: De bijbehorende definitie. Het is verboden het te zoeken woord in de hint te zetten.",
    crossword_prompt_extra_clue_optional: "`extraClue` (optioneel): Een object met een extra hint. De hinttekst mag `*woord*` gebruiken voor vet, `**woord**` voor cursief en `\\n` voor regeleinden. De AI beoordeelt of een extra hint zinvol is.",
    crossword_prompt_task_description: "`taskDescription`: Een duidelijke, gecontextualiseerde instructie. Gebruik `*woord*` voor vet, `**woord**` voor cursief en `\\n` voor regeleinden. Na een regeleinde, geef de regel voor samenstellingen: \"Schrijf samengestelde woorden als één doorlopend woord, zonder spaties of koppeltekens.\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",
    crossword_prompt_content_rules_title: "**Inhoudsregels:**",
    crossword_prompt_rule1: "1.  STRICTE REGEL: Woorden (`answer`) mogen alleen letters bevatten. Samenstellingen, afkortingen of woordgroepen worden samengevoegd tot één woord, zonder spaties, koppeltekens of andere tekens.",
    crossword_prompt_rule2: "2.  De definities (`clue`) moeten kort en precies zijn.",
    crossword_prompt_rule3: "3.  De rest van de JSON-structuur (gedrag, thema, enz.) blijft ongewijzigd.",
    crossword_prompt_example_json_title: "**JSON-voorbeeld voor één woord:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Kruiswoordpuzzel over Biologie",
"words": [
{
"answer": "Cel",
"clue": "Basiseenheid van het leven.",
"extraClue": {
"params": {
"text": "Ze kan *dierlijk* of *plantaardig* zijn."
}
}
},
{
"answer": "DNA",
"clue": "Molecuul dat de genetische informatie draagt."
}
],
"taskDescription": "*Vul* de **kruiswoordpuzzel** in."
}
\`\`\` `,
    crossword_prompt_generate_only_json: "Genereer de volledige en geldige JSON door de titel, beschrijving en de array \"words\" in te vullen, zonder verdere opmerkingen.",

    // Crossword UI translations
    crossword_across: "Horizontaal",
    crossword_down: "Verticaal",
    crossword_check_answer: "Controleren",
    crossword_try_again: "Opnieuw proberen",
    crossword_show_solution: "Oplossing tonen",
    crossword_extra_clue: "Extra hint",
    crossword_close_window: "Venster sluiten",
    crossword_submit_answer: "Indienen",

    // Essay Prompt
    essay_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Essay\".",
    essay_prompt_mission: "**Jouw missie:**",
    essay_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-Essay-activiteit.",
    essay_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    essay_prompt_json_structure_main_object: "Het object moet bevatten:",
    essay_prompt_task_description: "`taskDescription`: Een duidelijke opdracht die de leerling uitnodigt een tekst over het thema te schrijven. Gebruik `*woord*` voor vet, `**woord**` voor cursief en `\\n` voor regeleindes.",
    essay_prompt_keywords_array: "`keywords`: Een array met ${nombreQuestions} objecten; elk definieert een trefwoord dat het systeem in het antwoord moet vinden.",
    essay_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",
    essay_prompt_content_rules_title: "**Regels voor de inhoud:**",
    essay_prompt_rule1: "1.  Elk object in `keywords` bevat de sleutel `keyword` met het te zoeken woord.",
    essay_prompt_rule2: "2.  De trefwoorden zijn relevant en essentieel om het begrip van het onderwerp te beoordelen.",
    essay_prompt_rule3: "3.  De JSON-structuur (gedrag, enz.) blijft behouden.",
    essay_prompt_rule4: "4. De instructie (`taskDescription`) moet het schrijven aanmoedigen zonder de trefwoorden uit `keywords` te gebruiken, behalve de naam van het thema als dat nodig is voor het begrip.",
    essay_prompt_example_json_title: "**JSON-voorbeeld voor één trefwoord:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "Schrijf een korte tekst die de fotosynthese uitlegt.",
"keywords": [
{
"keyword": "licht",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "chlorofyl",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "Genereer de volledige en geldige JSON door de opdracht en de lijst met trefwoorden in te vullen, zonder verdere opmerkingen.",

    // Moodle XML-prompt
    moodle_xml_prompt_role: "Je bent expert in onderwijskundig ontwerp. Je taak is de inhoud van een Toets-activiteit met bijbehorende Moodle/Éléa-vragenbank te maken door een geldig JSON-object te genereren.",
    moodle_xml_prompt_intro: "Ik wil een quiz met ${nombreQuestions} vragen maken.",
    moodle_xml_prompt_content_title: "**Regels voor de inhoud:**",
    moodle_xml_prompt_content_rule1: "- Onjuiste antwoorden moeten plausibel maar fout zijn.",
    moodle_xml_prompt_content_rule2: "- Varieer de moeilijkheidsgraad van de vragen.",
    moodle_xml_prompt_content_rule3: "- Formuleer eenvoudig en precies.",
    moodle_xml_prompt_content_rule4: "- Feedback moet kort de juiste oplossing toelichten.",
    moodle_xml_prompt_question_types_intro: "**Verwachte JSON-structuur:**\nHet hoofdobject moet de volgende sleutels bevatten:\n- `bank_name`: Een korte, beschrijvende naam voor de vragenbank.\n- `bank_description`: Eén zin die de inhoud van de bank beschrijft.\n- `questions`: Een array met objecten; elk object stelt een vraag voor en moet `type` en `content` bevatten.",
    moodle_xml_prompt_question_type_multichoice: `
- **Voor het type \`multichoice\` (Meerkeuze):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Vraagtitel",
      "questiontext": "Vraagstelling.",
      "feedback": "Algemene feedback.",
      "answers": [
        { "text": "Antwoord 1", "fraction": 100, "feedback": "Feedback indien gekozen." },
        { "text": "Antwoord 2", "fraction": 0, "feedback": "Feedback indien gekozen." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **Voor het type \`matching\` (Koppelen):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Vraagtitel",
      "questiontext": "Vraagstelling.",
      "feedback": "Algemene feedback.",
      "subquestions": [
        { "text": "Vraagtekst 1", "answer": "Antwoord 1" },
        { "text": "Vraagtekst 2", "answer": "Antwoord 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **Voor het type \`numerical\` (Numeriek):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Vraagtitel",
      "questiontext": "Vraagstelling.",
      "feedback": "Algemene feedback.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "Feedback bij het antwoord." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **Voor het type \`truefalse\` (Waar/Onwaar):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Vraagtitel",
      "questiontext": "Vraagstelling.",
      "feedback": "Algemene feedback.",
      "answer": { "value": true, "feedback_true": "Feedback bij Waar.", "feedback_false": "Feedback bij Onwaar." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **Voor het type \`shortanswer\` (Kort antwoord):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Vraagtitel",
      "questiontext": "Vraagstelling.",
      "feedback": "Algemene feedback.",
      "answers": [
        { "text": "Exact antwoord 1", "fraction": 100, "feedback": "Feedback indien gekozen." },
        { "text": "Alternatief antwoord", "fraction": 100, "feedback": "Feedback indien gekozen." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **Voor het type \`cloze\` (Invultekst):**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Vraagtitel",
      "questiontext": "Dit is een tekst met een gat {1:SHORTANSWER:=Juiste antwoord~Feedback} en nog een {1:MULTICHOICE:=Juiste antwoord~Fout antwoord}.",
      "feedback": "Algemene feedback."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**Laatste instructies:**",
    moodle_xml_prompt_form_rule1: "Verdeel de vragen gelijkmatig over de verschillende typen.",
    moodle_xml_prompt_generate_only_json: "Genereer alleen geldige JSON-code, zonder commentaar. Het resultaat moet één JSON-object zijn met de sleutel `questions`.",

    // Éléa-test aanmaken
    moodle_xml_success_generation: "Bestand {fileName} succesvol gegenereerd!",
    test_error_creation_mbz: "Fout bij het aanmaken van de MBZ voor de toets:",
    test_success_generation: "Bestand {fileName} succesvol gegenereerd!",
    test_error_generic: "Fout:",
    test_backup_log: "Back-up automatisch aangemaakt door Caramel\n",

    // GIFT Prompt
    gift_prompt_role: "U bent een expert in onderwijsontwerp en maakt een vragenbank voor een Moodle/Éléa-toetsactiviteit in GIFT-formaat.",
    gift_prompt_intro: "Ik wil een quiz met ${nombreQuestions} vragen aanmaken.",
    gift_prompt_format_info: "De quiz moet in GIFT-formaat zijn voor import in Moodle.",
    gift_prompt_question_quality: "Elke vraag moet duidelijk, beknopt en ondubbelzinnig zijn, met gedetailleerde feedback.",
    gift_prompt_code_format_intro: "De code moet exact hetzelfde formaat volgen als hieronder:",
    gift_prompt_example_question_comment: "// question: 1  name: Wat is het centrale object van ons zonnestelsel?",
    gift_prompt_example_question_text: "::Wat is het centrale object van ons zonnestelsel?::Wat is het centrale object van ons zonnestelsel?{",
    gift_prompt_example_answer_correct: "=De Zon#Juist! De Zon is de centrale ster van ons zonnestelsel. Goed gedaan!",
    gift_prompt_example_answer_incorrect1: "~De Maan#Onjuist. De Maan is een natuurlijke satelliet van de Aarde. De Zon is het centrale object.",
    gift_prompt_example_answer_incorrect2: "~Jupiter#Onjuist. Jupiter is een gasreus. De Zon is het centrale object.",
    gift_prompt_example_answer_incorrect3: "~De Aarde#Onjuist. De Aarde is de planeet waarop we leven. De Zon is het centrale object.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "De quiz moet willekeurig verschillende vraagtypes bevatten:",
    gift_prompt_question_type_multichoice: "- meerkeuzevragen (multichoice) met 1 juist antwoord en 3 afleiders.",
    gift_prompt_question_type_truefalse: "- waar/onwaar (truefalse).",
    gift_prompt_question_type_numerical: "- numerieke vragen (numerical) met een toelaatbare marge.",
    gift_prompt_question_type_matching: "- koppelvragen (matching) met minstens 4 paren.",
    gift_prompt_generate_only_gift: "Genereer de quiz direct in GIFT-formaat, zonder extra commentaar of tags. Respecteer strikt het beschreven formaat; ik plak het resultaat in een andere tool die dit vereist. Lever het antwoord als vooraf opgemaakte code.",

    // Flashcards Prompt
    flashcards_prompt_role: "Je bent een expert in instructional design en maakt een H5P 'Flashcards' activiteit.",
    flashcards_prompt_mission: "**Je missie:**",
    flashcards_prompt_generate_json: "Genereer een compleet en geldig JSON-object voor een H5P Flashcards-activiteit. Het JSON moet direct bruikbaar zijn.",
    flashcards_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    flashcards_prompt_json_structure_main_object: "Het object moet het volgende bevatten:",
    flashcards_prompt_title: "`title`: Een geschikte titel voor de activiteit.",
    flashcards_prompt_description: "`description`: Een duidelijke instructie voor de leerling.",
    flashcards_prompt_association_principle: "Voorkant en achterkant moeten gekoppeld zijn door één enkel, consistent criterium (bijv.: definitie→term, figuur→aantal zijden, gebeurtenis→datum, auteur→werk). Gebruik voor alle kaarten dezelfde relatie en formuleer de opdracht zo: “Koppel elke X aan Y.” Antwoorden (`answer`) gestandaardiseerd: een enkel woord of een getal, kleine letters, geen lidwoorden of interpunctie; getallen in cijfers.",
    flashcards_prompt_cards_array: "`cards`: Een array van ${nombreQuestions} objecten, waarin elk object een kaart voorstelt en bevat:",
    flashcards_prompt_text: "`text`: De vraag of term die geraden moet worden (voorkant).",
    flashcards_prompt_answer: "`answer`: Het antwoord of de definitie (achterkant). Belangrijk: `answer` mag slechts één enkel woord of een getal bevatten, geen samengestelde of gescheiden woorden.",
    flashcards_prompt_tip: "`tip` (optioneel): Een hint om de leerling te helpen als de vraag moeilijk is. Voeg een hint alleen toe als dat relevant is.",
    flashcards_prompt_tip_formatting: "Voor hints (`tip`) kun je `*woord*` gebruiken voor vet en `**woord**` voor cursief om belangrijke informatie te benadrukken.",
    flashcards_prompt_example_json_title: "**Voorbeeld JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "De hoofdsteden van Europa",
"description": "Onthoud de hoofdstad van elk land. Klik op de kaart om het antwoord te zien.",
"cards": [
{
"text": "De hoofdstad van Frankrijk",
"answer": "Parijs"
},
{
"text": "De hoofdstad van Nederland",
"answer": "Amsterdam",
"tip": "<p>Het is de stad van de <strong>grachten</strong> en tulpen!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",

    // QuizSet Prompt
    quiz_set_prompt_role: "Je bent een specialist in leerontwerp en maakt de inhoud voor een \"H5P Quiz (Question Set)\".",
    quiz_set_prompt_mission: "**Jouw missie:**",
    quiz_set_prompt_generate_json: "Genereer een JSON-object **alleen voor de inhoud** van een H5P-quiz. De JSON moet direct bruikbaar zijn als `content.json`.",
    quiz_set_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    quiz_set_prompt_json_structure_main_object: "Het hoofdobject bevat de volgende sleutels:",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: Een array van ${nombreQuestions} objecten, elk een vraag.",
    quiz_set_prompt_content_rules_title: "**Regels voor de vraaginhoud:**",
    quiz_set_prompt_rule1: "1.  Elk vraagobject moet de sleutels `library`, `params` en `subContentId` hebben.",
    quiz_set_prompt_rule2: "2.  **Structuur:** Elke vraag moet een object zijn met de sleutels `library`, `metadata` en `params`.",
    quiz_set_prompt_rule3: "3. Varieer de vraagtypes. Gebruik de volgende libraries met exacte versies:",
    quiz_set_prompt_rule4: "4.  **Feedback (CRUCIALE REGEL):** Voor **alle vraagtypes** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), **moet** u een `overallFeedback` genereren met exact 6 scorebereiken: 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Voeg voor `TrueFalse`-vragen ook de velden `feedbackOnCorrect` en `feedbackOnWrong` toe. De feedback moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn.",
    quiz_set_prompt_rule5: "5.  **Inhoud:** De inhoud in `params` moet pedagogisch relevant zijn, met plausibele afleiders voor MCQ's en coherente teksten voor andere activiteiten.",
    quiz_set_prompt_rule6: "6.  **Eenvoud:** Voeg geen afbeeldingen of overbodige gedragsparameters toe. Houd de structuur eenvoudig zoals in de voorbeelden.",
    quiz_set_prompt_example_json_title: "**Voorbeeldstructuren voor elk toegestaan vraagtype:**",
    quiz_set_example_true_false: "Waar/Onwaar :",
    quiz_set_example_multiple_choice: "Meerkeuze :",
    quiz_set_example_fill_in_the_blanks: "Invultekst :",
    quiz_set_example_drag_the_words: "Versleep de woorden :",
    quiz_set_example_mark_the_words: "Markeer de woorden :",
    quiz_set_example_essay: "Opstel :",
    quiz_set_prompt_generate_only_json: "Genereer alleen de geldige JSON, beginnend met `{\"progressType\": \"dots\", ...}`, zonder commentaar.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Titel van de Waar/Onwaar-vraag" },
        "params": {
            "question": "Is Frankrijk een land?",
            "correct": "true",
            "feedbackOnCorrect": "Dat klopt! Frankrijk is inderdaad een land.",
            "feedbackOnWrong": "Onjuist. Frankrijk wordt internationaal erkend als een land.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Titel van de MCQ" },
        "params": {
            "question": "Wat is de hoofdstad van Frankrijk?",
            "answers": [
                { "text": "Parijs", "correct": true },
                { "text": "Berlijn", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "Titel van de invuloefening" },
        "params": {
            "questions": ["Parijs is de *hoofdstad* van Frankrijk."],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "Titel van de sleep-de-woorden-activiteit" },
        "params": {
            "taskDescription": "Maak de zin af.",
            "textField": "*Parijs* is de hoofdstad van Frankrijk.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "Titel van de markeer-de-woorden-activiteit" },
        "params": {
            "taskDescription": "Markeer de hoofdstad.",
            "textField": "De hoofdstad van Frankrijk is *Parijs*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "Titel van het essay" },
        "params": {
            "taskDescription": "Wat is de hoofdstad van Frankrijk?",
            "keywords": [
                { "keyword": "Parijs", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Accordion\".",
    glossary_prompt_mission: "**Jouw missie:**",
    glossary_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-woordenlijst (Accordion). De JSON moet direct bruikbaar zijn.",
    glossary_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    glossary_prompt_json_structure_main_object: "Genereer een array van ${nombreQuestions} JSON-objecten.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: Het te definiëren woord of de uitdrukking.",
    glossary_prompt_content: "`text`: De definitie. Gebruik `*woord*` voor vet, `**woord**` voor cursief en `\\n` voor regeleinden.",
    glossary_prompt_content_rules_title: "**Regels voor de inhoud:**",
    glossary_prompt_rule1: "1.  Definities moeten duidelijk, beknopt en passend bij het niveau van de leerlingen zijn.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**JSON-voorbeeld voor één item:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Fotosynthese",
"text": "Proces waarbij groene planten zonlicht omzetten in energie."
},
{
"title": "Cel",
"text": "De basiseenheid van alle levende wezens."
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",

    // Summary Prompt
    summary_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Summary\".",
    summary_prompt_mission: "**Jouw missie:**",
    summary_prompt_generate_json: "Genereer een volledig JSON-object voor een H5P-Summary-activiteit. De JSON moet direct bruikbaar zijn.",
    summary_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    summary_prompt_json_structure_main_object: "Het object moet de volgende sleutels bevatten:",
    summary_prompt_intro_field: "`intro`: Een inleidende zin voor de activiteit (bv. \"Kies de juiste stelling.\").",
    summary_prompt_summaries_array: "`summaries`: Een array van ${nombreQuestions} objecten, die elk een stap van de samenvatting vertegenwoordigen.",
    summary_prompt_summary_object: "Elk object in `summaries` moet bevatten:",
    summary_prompt_summary_array: "- `summary`: Een array van zinnen.",
    summary_prompt_tip_field: "- `tip` (optioneel maar aanbevolen): Een hint om de leerling te helpen.",
    summary_prompt_content_rules_title: "**Regels voor de inhoud:**",
    summary_prompt_rule1: "1.  In elke array \"summary\" is **de eerste zin correct**.",
    summary_prompt_rule2: "2.  De volgende zinnen zijn plausibele maar onjuiste afleiders.",
    summary_prompt_rule3: "3.  Alle correcte zinnen samen vormen een coherente samenvatting.",
    summary_prompt_example_json_title: "**JSON-voorbeeld voor één stap:**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "Dit is de juiste zin.",
    "Dit is een afleider.",
    "Dit is nog een afleider."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",
    summary_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",

    // Summary UI translations
    summary_intro: "Kies de juiste stelling.",
    summary_solved_label: "Voortgang:",
    summary_score_label: "Foute antwoorden:",
    summary_result_label: "Jouw resultaat",
    summary_feedback: "Je hebt @score van de @total stellingen (@percent %) correct.",
    summary_label_correct: "Correct.",
    summary_label_incorrect: "Incorrect! Probeer het opnieuw.",
    summary_label_correct_answers: "Correcte antwoorden.",
    summary_tip_button_label: "Toon tip",
    summary_score_bar_label: "Je hebt :num van de :total punten",
    summary_progress_text: "Voortgang :num van :total",
    summary_alternative_incorrect_label: "Incorrect",

    // Drag the Words Prompt
    drag_word_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Drag the Words\".",
    drag_word_prompt_mission: "**Jouw missie:**",
    drag_word_prompt_generate_json: "Genereer een volledig JSON-object voor een H5P-Drag the Words-activiteit. De JSON moet direct bruikbaar zijn.",
    drag_word_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    drag_word_prompt_json_structure_main_object: "Het object moet bevatten:",
    drag_word_prompt_task_description: "`taskDescription`: Een duidelijke instructie.",
    drag_word_prompt_text_field: "`textField`: De in te vullen tekst. Elke zin moet eindigen met een regeleinde `\\n`.",
    drag_word_prompt_content_rules_title: "**Regels voor de inhoud:**",
    drag_word_prompt_rule1: "1.  Schrijf een coherente tekst over het thema, met korte zinnen die eindigen op `\\n`.",
    drag_word_prompt_rule2: "2.  Versleepbare woorden staan tussen asterisken. U kunt een tip toevoegen met `:mijn tip` en feedback met `\\+juiste feedback \\-onjuiste feedback`.",
    drag_word_prompt_example_json_title: "**JSON-voorbeeld:**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Vul de tekst aan door de woorden te verslepen.",
"textField": "Het *zonnestelsel* bestaat uit *acht* planeten die rond de *zon* draaien."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",

    // Drag the Words UI translations
    drag_words_check_answer: "Controleren",
    drag_words_try_again: "Opnieuw proberen",
    drag_words_show_solution: "Oplossing tonen",
    drag_words_score_feedback: "Score: @score van @total.",
    drag_words_tip_label: "Toon tip",
    drag_words_correct_text: "Correct!",
    drag_words_incorrect_text: "Incorrect!",
    drag_words_score_bar_label: "Je hebt :num van de :total punten",
    drag_words_submit_answer: "Indienen",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Fill in the Blanks\".",
    blanks_prompt_mission: "**Jouw missie:**",
    blanks_prompt_generate_json: "Genereer een volledig JSON-object voor een H5P-invulactiviteit. De JSON moet direct bruikbaar zijn.",
    blanks_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    blanks_prompt_json_structure_main_object: "Het object bevat de sleutel `questions`, een array van tekenreeksen. Elke string is een tekstblok om aan te vullen.",
    blanks_prompt_content_rules_title: "**Regels voor de inhoud:**",
    blanks_prompt_rule1: "-   Te raden woorden staan tussen asterisken (*woord*).",
    blanks_prompt_rule2: "-   Voor alternatieven gebruikt u een schuine streep: *Parijs/Stad van het Licht*.",
    blanks_prompt_rule3: "-   Voor een tooltip gebruikt u een dubbele punt: *open-source:Openbare broncode*.",
    blanks_prompt_example_json_title: "**JSON-voorbeeld:**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"Het zonnestelsel heeft *acht* planeten. De grootste is *Jupiter*.",
"De hoofdstad van Frankrijk is *Parijs/Stad van het Licht*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",
    blanks_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Oplossingen tonen",
    blanks_try_again: "Opnieuw proberen",
    blanks_check_answer: "Controleren",
    blanks_not_filled_out: "Vul alstublieft alle velden in.",
    blanks_answer_is_correct: "':ans' is juist",
    blanks_answer_is_wrong: "':ans' is onjuist",
    blanks_answered_correctly: "Correct beantwoord",
    blanks_answered_incorrectly: "Incorrect beantwoord",
    blanks_solution_label: "Correct antwoord:",
    blanks_input_label: "Invulveld @num van @total",
    blanks_input_has_tip_label: "Tip beschikbaar",
    blanks_tip_label: "Tip",
    blanks_score_bar_label: "Je hebt :num van de :total punten",
    blanks_submit_answer: "Indienen",
    blanks_feedback: "Je hebt @score van de @total invulvelden correct ingevuld.",
    blanks_finish_header: "Voltooien?",
    blanks_finish_body: "Weet je zeker dat je wilt voltooien?",
    blanks_cancel_label: "Annuleren",
    blanks_finish_label: "Voltooien",
    blanks_retry_header: "Opnieuw proberen?",
    blanks_retry_body: "Weet je zeker dat je opnieuw wilt proberen?",
    blanks_retry_confirm_label: "Bevestigen",
    blanks_checking_mode_header: "Controlemodus",
    blanks_a11y_check: "Controleer de antwoorden. De antwoorden worden gemarkeerd als correct, incorrect of onbeantwoord.",
    blanks_a11y_show_solution: "Toon de oplossing. De taak wordt gemarkeerd met de juiste oplossing.",
    blanks_a11y_retry: "Probeer de taak opnieuw. Reset alle antwoorden en begin de taak opnieuw.",

    // Mark the Words Prompt
    mark_words_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Mark the Words\".",
    mark_words_prompt_mission: "**Jouw missie:**",
    mark_words_prompt_generate_json: "Genereer een volledig JSON-object voor een H5P-Mark the Words-activiteit. De JSON moet direct bruikbaar zijn.",
    mark_words_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    mark_words_prompt_json_structure_main_object: "Het object moet bevatten:",
    mark_words_prompt_task_description: "`taskDescription`: Een duidelijke instructie.",
    mark_words_prompt_text_field: "`textField`: De tekst waarin de te markeren woorden tussen asterisken staan (*woord*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",
    mark_words_prompt_content_rules_title: "**Regels voor de inhoud:**",
    mark_words_prompt_rule1: "1.  Schrijf een relevant alinea over het thema.",
    mark_words_prompt_rule2: "2.  Kies ongeveer ${nombreQuestions} belangrijke kernwoorden om te markeren.",
    mark_words_prompt_rule3: "3.  Elk te markeren woord moet afzonderlijk tussen asterisken staan. Bijvoorbeeld, `*woord1* *woord2*` is correct, maar `*woord1 woord2*` niet.",
    mark_words_prompt_rule4: "4.  Apostroffen of andere leestekens mogen niet aan de gemarkeerde woorden vastzitten. Bijvoorbeeld, `l'*vogel*` is onjuist; het moet `de *vogel*` zijn om te werken.",
    mark_words_prompt_example_json_title: "**JSON-voorbeeld:**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Klik op de belangrijke woorden in de tekst.",
"textField": "Het *zonne* *stelsel* bestaat uit *acht* planeten die rond de *zon* draaien."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",

    // Mark the Words UI translations
    mark_words_check_answer: "Controleren",
    mark_words_try_again: "Opnieuw proberen",
    mark_words_show_solution: "Oplossing tonen",
    mark_words_correct_answer: "Correct!",
    mark_words_incorrect_answer: "Incorrect!",
    mark_words_missed_answer: "Gemist!",
    mark_words_display_solution_description: "De taak is bijgewerkt met de oplossing.",
    mark_words_score_bar_label: "Je hebt :num van de :total punten",
    mark_words_submit_answer: "Indienen",
    mark_words_a11y_full_text_label: "Volledig leesbare tekst",
    mark_words_a11y_clickable_text_label: "Volledige tekst waarin woorden gemarkeerd kunnen worden",
    mark_words_a11y_solution_mode_header: "Oplossingsmodus",
    mark_words_a11y_checking_header: "Controlemodus",
    mark_words_a11y_check: "Controleer de antwoorden. De antwoorden worden gemarkeerd als correct, incorrect of onbeantwoord.",
    mark_words_a11y_show_solution: "Toon de oplossing. De taak wordt gemarkeerd met de juiste oplossing.",
    mark_words_a11y_retry: "Probeer de taak opnieuw. Reset alle antwoorden en begin de taak opnieuw.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "De compressiebibliotheken (Tar.js of fflate) zijn niet geladen. Controleer je internetverbinding of vernieuw de pagina.",
    millionnaire_error_invalid_json: "De JSON-structuur is ongeldig. Zorg ervoor dat deze een 'title' en een 'questions'-array met 6 vragen bevat volgens het voorbeeld.",
    millionnaire_activity_intro: "Doe mee aan dit spel om je kennis te testen.",
    millionnaire_backup_log: "Back-up automatisch aangemaakt door Caramel\n",
    millionnaire_success_generation: "Bestand {fileName} succesvol gegenereerd!",
    millionnaire_error_creation_mbz: "Fout bij het maken van MBZ-bestand:",
    millionnaire_error_generic: "Fout:",

    // Millionnaire Prompt
    millionnaire_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Millionnaire\".",
    millionnaire_prompt_num_questions: "**Aantal vragen:** 6",
    millionnaire_prompt_mission: "**Jouw missie:**",
    millionnaire_prompt_generate_json: "Genereer een JSON-object met een titel en **6 vragen** voor een spel in de stijl van \"Wie wordt miljonair\".",
    millionnaire_prompt_important_rules_title: "**Belangrijke regels:**",
    millionnaire_prompt_rule1: "1.  `title` moet een relevant en aansprekend activiteiten-titel zijn.",
    millionnaire_prompt_rule2: "2.  De moeilijkheidsgraad in `questions` is **oplopend en didactisch**, passend bij het niveau. De eerste vraag is zeer eenvoudig, de laatste zeer moeilijk.",
    millionnaire_prompt_rule3: "3.  De inhoud moet strikt correct en relevant zijn voor thema en schoolniveau.",
    millionnaire_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    millionnaire_prompt_main_object: "Een hoofdobject met twee sleutels:",
    millionnaire_prompt_title: "- `title`: De titel van de activiteit (string).",
    millionnaire_prompt_questions_array: "- `questions`: Een array met 6 objecten; elk object is een vraag en bevat:",
    millionnaire_prompt_question: "- `question`: De vraag (string).",
    millionnaire_prompt_good_answer: "- `goodanswer`: Het juiste antwoord (string).",
    millionnaire_prompt_bad_answer: "- `badanswer`: Een array met 3 foute antwoorden (strings).",
    millionnaire_prompt_example_json_title: "**JSON-voorbeeld:**",
   millionnaire_prompt_example: `\`\`\`json
{
"title": "Quiz over de Franse Revolutie",
"questions": [
{
"question": "Wat is de hoofdstad van Frankrijk?",
"goodanswer": "Parijs",
"badanswer": ["Berlijn", "Londen", "Madrid"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Genereer uitsluitend het geldige JSON-object, zonder commentaar.",

    // Appariement Prompt
    appariement_prompt_role: "Je bent een expert in onderwijsontwerp die een Moodle-activiteit \"Koppelen\" maakt.",
    appariement_prompt_num_questions: "**Aantal paren:** 10",
    appariement_prompt_mission: "**Je missie:**",
    appariement_prompt_generate_json: "Genereer een JSON-object met een titel en een lijst van **10 paren** voor een koppelspel.",
    appariement_prompt_important_rules_title: "**Belangrijke regels:**",
    appariement_prompt_rule1: "1.  `title` moet een relevante en aansprekende titel voor de activiteit zijn.",
    appariement_prompt_rule2: "2.  De array `pairs` moet 10 objecten bevatten, elk met een `question` (het linkerelement) en een `answer` (het rechterelement om te koppelen).",
    appariement_prompt_rule3: "3.  De inhoud moet strikt correct zijn en relevant voor het thema en het schoolniveau.",
    appariement_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    appariement_prompt_main_object: "Een hoofdobject met twee sleutels:",
    appariement_prompt_title: "- `title`: De titel van de activiteit (tekenreeks).",
    appariement_prompt_pairs_array: "- `pairs`: Een array van 10 objecten, waarbij elk object een paar vertegenwoordigt en bevat:",
    appariement_prompt_question: "- `question`: De term of de afbeelding links (tekenreeks).",
    appariement_prompt_answer: "- `answer`: De definitie of de corresponderende term rechts (tekenreeks).",
    appariement_prompt_example_json_title: "**Voorbeeld-JSON:**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Koppelen over de Franse Revolutie",
"pairs": [
{
"question": "Bestorming van de Bastille",
"answer": "14 juli 1789"
}
]
}
\`\`\` `,
   appariement_prompt_generate_only_json: "Genereer alleen het geldige JSON-object, zonder enig commentaar.",

    // Koppeling aanmaken
    appariement_error_invalid_json: "De JSON-structuur is ongeldig. Zorg ervoor dat deze een 'title' en een array 'pairs' bevat, waarbij elk paar een 'question' en een 'answer' heeft.",
    appariement_activity_intro: "Vind de bijpassende paren.",
    appariement_success_generation: "Bestand {fileName} is succesvol gegenereerd !",
    appariement_error_creation_mbz: "Fout bij het aanmaken van de MBZ voor de koppeling:",

    // QCM Prompt
    qcm_prompt_role: "Je bent een expert in onderwijsontwerp die een Moodle-activiteit \"MCQ\" maakt.",
    qcm_prompt_num_questions: "**Aantal vragen:** 10",
    qcm_prompt_mission: "**Je missie:**",
    qcm_prompt_generate_json: "Genereer een JSON-object met een titel en een lijst van **10 vragen** voor een MCQ.",
    qcm_prompt_important_rules_title: "**Belangrijke regels:**",
    qcm_prompt_rule1: "1.  `title` moet een relevante en aansprekende titel voor de activiteit zijn.",
    qcm_prompt_rule2: "2.  De array `questions` moet 10 objecten bevatten, elk met een `text` (de vraagstelling) en een `answers`-array.",
    qcm_prompt_rule3: "3.  Elke `answers`-array moet meerdere mogelijke antwoorden bevatten. Elk antwoord is een object met `text` en `iscorrect` (1 voor waar, 0 for onwaar). Afhankelijk van de context van de vraag, kun je vragen voorstellen met één juist antwoord of met meerdere juiste antwoorden.",
    qcm_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    qcm_prompt_main_object: "Een hoofdobject met twee sleutels:",
    qcm_prompt_title: "- `title`: De titel van de activiteit (tekenreeks).",
    qcm_prompt_questions_array: "- `questions`: Een array van 10 objecten, waarbij elk object een vraag vertegenwoordigt en bevat:",
    qcm_prompt_question_text: "- `text`: De vraagstelling (tekenreeks, kan HTML bevatten).",
    qcm_prompt_answers_array: "- `answers`: Een array van objecten, waarbij elk object een antwoord vertegenwoordigt en bevat:",
    qcm_prompt_answer_text: "- `text`: De antwoordtekst (tekenreeks, kan HTML bevatten).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 als het antwoord juist is, anders 0.",
    qcm_prompt_example_json_title: "**Voorbeeld-JSON:**",
    qcm_prompt_example: `\`\`\`json
{
"title": "Meerkeuzequiz over de Franse Revolutie",
"questions": [
{
"text": "Wat is de datum van de Bestorming van de Bastille?",
"answers": [
{ "text": "14 juli 1789", "iscorrect": 1 },
{ "text": "4 augustus 1789", "iscorrect": 0 },
{ "text": "26 augustus 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
   qcm_prompt_generate_only_json: "Genereer alleen het geldige JSON-object, zonder enig commentaar.",

    // Meerkeuzequiz aanmaken
    qcm_error_invalid_json: "De JSON-structuur is ongeldig. Zorg ervoor dat deze een 'title' en een array 'questions' bevat met ten minste één vraag en antwoorden.",
    qcm_activity_intro: "Beantwoord de volgende vragen.",
    qcm_success_generation: "Bestand {fileName} is succesvol gegenereerd !",
    qcm_error_creation_mbz: "Fout bij het aanmaken van de MBZ voor de meerkeuzequiz:",

    // H5P Modules
    h5p_timeline_name: "Tijdlijn",
    h5p_timeline_description: "Maak een interactieve tijdlijn om een reeks gebeurtenissen te presenteren.",
    h5p_flashcards_name: "Flashcards",
    h5p_flashcards_description: "Maak dubbelzijdige kaarten om termen en definities te onthouden.",
    h5p_quiz_set_name: "Quiz",
    h5p_quiz_set_description: "Stel een reeks gevarieerde vragen samen (meerkeuze, slepen-en-neerzetten, enz.) om kennis te beoordelen.",
    h5p_glossary_name: "Woordenlijst",
    h5p_glossary_description: "Maak een woordenlijst of FAQ in uitklap- (accordeon-)vorm.",
    h5p_crossword_name: "Kruiswoord",
    h5p_crossword_description: "Genereer een kruiswoordpuzzel op basis van een lijst met woorden en definities.",
    h5p_essay_name: "Schrijfopdracht",
    h5p_essay_description: "Bied een schrijfonderwerp aan en stel trefwoorden in voor automatische nakijking.",
    h5p_summary_name: "Samenvatting",
    h5p_summary_description: "Leerlingen reconstrueren een correcte samenvatting door de juiste zinnen te kiezen.",
    h5p_drag_the_words_name: "Woorden slepen",
    h5p_drag_the_words_description: "Maak een invultekst waarin leerlingen ontbrekende woorden moeten verslepen.",
    h5p_fill_in_the_blanks_name: "Invultekst",
    h5p_fill_in_the_blanks_description: "Leerlingen vullen de ontbrekende woorden rechtstreeks met het toetsenbord in.",
    h5p_mark_the_words_name: "Woorden markeren",
    h5p_mark_the_words_description: "Vraag leerlingen bepaalde woorden in een alinea te markeren.",
    h5p_true_false_name: "Waar/Onwaar Vraag",
    h5p_true_false_description: "Maak één eenvoudige vraag met een binair antwoord: waar of onwaar.",
    h5p_multiple_choice_name: "Meerkeuze",
    h5p_multiple_choice_description: "Maak één meerkeuzevraag met een of meer juiste antwoorden.",
    h5p_find_the_words_name: "Woorden zoeken",
    h5p_find_the_words_description: "Maak een letterrooster waarin leerlingen woorden moeten vinden.",
    h5p_sort_the_paragraphs_name: "Paragrafen sorteren",
    h5p_sort_the_paragraphs_description: "Maak een set paragrafen die studenten in de juiste volgorde moeten sorteren.",
    h5p_single_choice_set_name: "Enkelkeuze set",
    h5p_single_choice_set_description: "Maak een reeks vragen waarbij elke vraag slechts één juist antwoord heeft.",
    h5p_dialog_cards_name: "Dialoogkaarten",
    h5p_dialog_cards_description: "Maak interactieve kaarten met tekst en optionele afbeeldingen aan beide zijden.",
    h5p_complex_fill_the_blanks_name: "Complexe invuloefening",
    h5p_complex_fill_the_blanks_description: "Maak een geavanceerde invultekst met specifieke feedback voor elke fout.",
    h5p_chart_name: "Grafiek",
    h5p_chart_description: "Maak een cirkel- of staafdiagram om gegevens te visualiseren.",

    // Moodle Modules
    moodle_xml_name: "Test",
    moodle_xml_description: "Genereer een vragenbank om direct in een Test-activiteit te importeren (in xml- of gift-formaat)",
    moodle_xml_help: "Om een XML-bestand toe te voegen aan een ‘Toets’-activiteit in Moodle, maakt u eerst de activiteit aan. Open vervolgens het menu <strong>Meer</strong> en ga naar <strong>Vraagbank</strong>. Klik in dit menu op <strong>Importeren</strong>, kies het formaat <strong>Moodle XML</strong>, selecteer uw bestand en bevestig.",
    moodle_gift_name: "GIFT-formaat",
    moodle_gift_description: "Maak vragen in GIFT-formaat, een eenvoudige manier om vragen in Moodle te importeren.",
    moodle_millionnaire_name: "Miljonair",
    moodle_millionnaire_description: "Genereer een unieke 'Miljonair'-activiteit met 6 vragen die geleidelijk moeilijker worden.",
    moodle_appariement_name: "Koppelen",
    moodle_appariement_description: "Genereer een koppelactiviteit met 10 vragen.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Genereer een eenvoudige MCQ-activiteit.",

    moodle_glossaire_xml_name: "Woordenlijst (XML)",
    moodle_glossaire_xml_description: "Genereer een woordenlijst die klaar is om in XML-indeling te worden geïmporteerd.",

    elea_page_name: "Pagina",
    elea_page_description: "Een visueel opgemaakte Éléa-inhoudspagina maken.",

    // Dynamic content
    prompt_for_ia: "Prompt voor de AI",
    copy_prompt: "Prompt kopiëren",
    fullscreen_prompt: "Volledig scherm",
    exit_fullscreen_prompt: "Volledig scherm verlaten",
    lock_prompt: "Prompt vergrendelen",
    unlock_prompt: "Prompt ontgrendelen",
    go_duck: "Naar Duck.ai",
    go_mistral: "Naar Le Chat",
    create_h5p_file: "H5P-bestand maken",
    integrate_h5p_libraries: "H5P-bibliotheken integreren:",
    paste_ia_result: "Plak hieronder het AI-resultaat om uw module te maken.",
    generate_h5p: "H5P genereren",
    create_xml_file: "XML-bestand maken",
    paste_ia_result_xml: "Plak hieronder de door de AI gegenereerde XML.",
    generate_xml_file: "XML-bestand genereren",
    export_mbz: "Formaat MBZ",
    export_gift: "Formaat GIFT",
    export_xml: "Formaat XML",
    export_html: "HTML-formaat",

    create_mbz_file_appariement: "Maak het bestand Koppelen (.mbz)",
    paste_ia_result_appariement: "Plak hieronder de door de AI gegenereerde JSON. De titel van de activiteit wordt automatisch uit de JSON gehaald.",
    generate_mbz_appariement: "Genereer de activiteit Koppelen (mbz)",
    create_mbz_file_millionnaire: "Maak het bestand Miljonair (.mbz)",
    paste_ia_result_millionnaire: "Plak hieronder de door de AI gegenereerde JSON. De titel van de activiteit wordt automatisch uit de JSON gehaald.",
    generate_mbz_millionnaire: "Genereer de activiteit Miljonair (mbz)",
    generate_mbz_test: "De Toets-activiteit (mbz) genereren",

    create_mbz_file_qcm: "Maak MCQ-bestand (.mbz)",
    paste_ia_result_qcm: "Plak hieronder de door de AI gegenereerde JSON. De titel van de activiteit wordt automatisch uit de JSON gehaald.",
    generate_mbz_qcm: "Genereer MCQ-activiteit (mbz)",

    create_mbz_file_page: "Het bestand Pagina (.mbz) maken",
    paste_ia_result_page: "Plak hieronder de door AI gegenereerde JSON om de pagina te bouwen.",
    generate_mbz_page: "De activiteit Pagina (mbz) genereren",

    // Moodle XML specific
    moodle_xml_placeholder: "De Moodle-XML verschijnt hier...",
    paste_xml_placeholder: "Plak hier de volledige, door de AI gegenereerde XML...",

    // H5P empty text fields
    generate_prompts_placeholder: "De AI-prompt verschijnt hier zodra u minimaal één veld in de Snelle modus of de Geavanceerde modus hebt ingevuld.",
    paste_json_or_text: "Plak hier de JSON-inhoud of de door de AI gegenereerde tekst om je activiteit te maken.",
    info_prompt_copy: "Plak deze prompt niet in het rechterpaneel. Kopieer hem naar een externe AI om het resultaat te verkrijgen en plak dt resultaat vervolgens in het rechterpaneel.",

    // Notifications
    caramel_success_title: "Je snoepje is klaar!",
    prompts_generated_successfully: "Prompts succesvol gegenereerd!",
    success_copy: "✓ Gekopieerd !",
    error_please_fill_fields: "Vul ten minste één veld in de Snelle modus in.",
    error_please_fill_guided_fields: "Vul ten minste één veld in de Geavanceerde modus in.",
    error_field_empty: "Het veld is leeg. Genereer eerst een prompt.",
    error_copy_failed: "Kopiëren mislukt.",
    error_h5p_module_not_found: "Module '{moduleKey}' niet gevonden.",
    error_invalid_quiz_json: "De JSON voor de quiz is ongeldig: {errorMessage}",
    error_invalid_json: "De opgegeven JSON is ongeldig. Fout: {errorMessage}",
    error_h5p_creation: "Fout bij het maken van H5P: {errorMessage}",
    error_paste_ia_content: "Plak de door de AI gegenereerde inhoud.",
    error_compression_module_not_ready: "De compressiemodule is nog niet klaar. Probeer het zo meteen opnieuw.",
    h5p_file_generated_successfully: "Bestand {fileName} succesvol gegenereerd!",
    h5p_creation_failed: "Het maken van het H5P-bestand is mislukt: {errorMessage}",
    license_info: "GNU GPL v3.0 of later",

    // Notifications for JSON content
    error_paste_json_content: "Plak de gegenereerde JSON-inhoud.",
    error_paste_xml_content: "Plak de gegenereerde XML-inhoud.",

    // Flashcards specific UI translations
    flashcards_progress_text: "Kaart @card van @total",
    flashcards_next: "Volgende",
    flashcards_previous: "Vorige",
    flashcards_check_answer: "Controleer",
    flashcards_your_answer: "Jouw antwoord",
    flashcards_correct_answer: "Correct",
    flashcards_incorrect_answer: "Incorrect",
    flashcards_show_solution: "Correct antwoord",
    flashcards_results: "Resultaten",
    flashcards_of_correct: "@score van @total correct",
    flashcards_show_results: "Toon resultaten",
    flashcards_answer_short: "A:",
    flashcards_retry: "Opnieuw proberen",
    flashcards_card_announcement: "Incorrect antwoord. Het juiste antwoord was @answer",
    flashcards_correct_announcement: "@answer is correct.",
    flashcards_page_announcement: "Pagina @current van @total",

    ticket: "Ticket",
    legal_mentions: "Wettelijke vermeldingen",

    // Legal Mentions
    legal_title: "Wettelijke vermeldingen",
    legal_editor_title: "Applicatie-editor",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Functie: Leraar in het Beroepslyceum Letteren-Geschiedenis",
    legal_editor_gauthier_remande_email: "E-mail: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Adres: 39 avenue de Chanzy, 53000 Laval, Frankrijk",
    legal_editor_gauthier_remande_phone: "Telefoon: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Functie: Wiskundeleraar en DRANE-missieofficier – Academie van Grenoble",
    legal_editor_emmanuel_gaunard_email: "E-mail: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Adres: 30 boulevard de la République, 38200 Vienne, Frankrijk",
    legal_editor_emmanuel_gaunard_phone: "Telefoon: +33 6 46 74 20 94",
    legal_app_description: "De webapplicatie ‘Caramel’ is een vrij, niet-commercieel project voor het aanmaken van H5P- en Éléa-content. Er is geen account nodig en er worden geen persoonsgegevens verzameld.",
    legal_hosting_title: "Hosting",
    legal_host_name: "<strong>Host</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>Bedrijfsnaam</strong>: Ministerie van Nationaal Onderwijs en Jeugd",
    legal_host_address: "<strong>Adres</strong>: 110 rue de Grenelle, 75007 Parijs, Frankrijk",
    legal_host_phone: "<strong>Telefoon</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Publicatiedirecteur",
    legal_publication_director_name: "Gauthier REMANDE en Emmanuel GAUNARD, als vrijwillige redacteuren.",
    legal_terms_of_use_title: "Algemene gebruiksvoorwaarden",
    legal_terms_of_use_content: "Deze site laat gebruikers H5P- en Éléa-content genereren. De weergave gebeurt lokaal, zonder overdracht van gebruikersgegevens. De gebruiker is zelf verantwoordelijk voor het gebruik van de gegenereerde content. De applicatie wordt gratis aangeboden, zonder enige garantie op werking of resultaat. De uitgever wijst elke aansprakelijkheid af bij misinterpretatie van de content of oneigenlijk gebruik.",
    legal_intellectual_property_title: "Intellectueel eigendom",
    legal_intellectual_property_content: "Alle broncodes, grafische elementen en content vallen onder de vrije GNU AGPLv3-licentie. Hergebruik is toegestaan onder de voorwaarden van hun respectieve licenties. Elke herdistributie of wijziging moet de oorspronkelijke auteurs vermelden: Gauthier REMANDE en Emmanuel GAUNARD. De afbeeldingen die in de H5P-modules worden gebruikt, zijn afkomstig van H5P.org.",
    legal_personal_data_title: "Persoonlijke gegevens",
    legal_personal_data_content: "Er worden geen persoonsgegevens verzameld of opgeslagen. Er worden geen trackingcookies gebruikt.",
    legal_ai_models_title: "Modellen voor kunstmatige intelligentie",
    legal_ai_models_content: "De Caramel‑app maakt, uitsluitend tijdens de one‑click‑generatie, gebruik van door ILAAS beheerde AI‑modellen, een federatie van gedeelde AI‑infrastructuren. Verzoeken worden via een door de Incubator gehoste n8n‑workflow doorgestuurd en daarna aan ILAAS overgedragen voor uitvoering op vertrouwde servers in datacenters met een ESR‑label (hoger onderwijs en onderzoek). Caramel voert de modellen niet uit en verwerkt of bewaart geen gegevens zelf; gegevens worden alleen gebruikt om het verzoek uit te voeren en worden niet naar publieke consumenten‑AI’s verzonden. De momenteel beschikbare modellen omvatten {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) en {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Eventuele hosting, logging en bewaring door ILAAS vallen onder hun privacyverklaring en servicevoorwaarden.",
    legal_user_requests_processing_title: "Verwerking van gebruikersverzoeken via n8n en de Incubator van het Ministerie van Nationaal Onderwijs",
    legal_user_requests_processing_content: "Onze site gebruikt een technische oplossing gebouwd met n8n, een open‑source‑tool die wordt gehost door de Incubator van het Ministerie van Nationaal Onderwijs. Via een geautomatiseerde workflow zet deze dienst gebruikersverzoeken om in gestructureerde gegevens (JSON‑formaat) om te communiceren met een DINUM‑kunstmatige intelligentie, en is daardoor soeverein. Er wordt geen gevoelige informatie zonder versleuteling blootgesteld of verzonden, waardoor de vertrouwelijkheid en veiligheid van uitwisselingen wordt gewaarborgd.",
    legal_accessibility_title: "Toegankelijkheid",
    legal_accessibility_content: "De applicatie is ontworpen om compatibel te zijn met computergebruik, inclusief donkere/lichte modi, toetsenbordnavigatie en hoog contrast, afhankelijk van de thema's. Er wordt voortdurend gewerkt aan de verbetering van de toegankelijkheid, in lijn met de aanbevelingen van de RGAA.",
    legal_applicable_law_title: "Toepasselijk recht",
    legal_applicable_law_content: "Deze site is onderworpen aan het Franse recht. In geval van een geschil zijn de bevoegde rechtbanken die van het rechtsgebied van Lyon.",
    legal_external_libraries_title: "Gebruikte externe bibliotheken",
    legal_external_libraries_intro: "De Caramel-applicatie maakt gebruik van verschillende open-sourcebibliotheken, onder de volgende licenties:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licentie: CC BY 4.0, SIL OFL 1.1, MIT): Biedt de pictogrammen die in de interface worden gebruikt om de navigatie en de visuele ervaring te verbeteren.",
    legal_library_jszip: "<strong>JSZip</strong> (Licentie: MIT of GPLv3): Maakt het mogelijk om .h5p-bestanden te maken door de benodigde inhoud in een zip-archief te comprimeren.",
    legal_library_clientzip: "<strong>client-zip</strong> (Licentie: MIT): Een andere bibliotheek die wordt gebruikt voor bestandscompressie en een krachtig alternatief biedt voor het rechtstreeks in de browser genereren van .h5p-archieven.",
    legal_library_fflate: "<strong>fflate</strong> (Licentie: MIT): Zeer snelle bibliotheek voor gegevenscompressie en -decompressie, gebruikt voor het maken van .mbz-archieven voor Moodle-modules.",
    legal_library_tarjs: "<strong>tar-js</strong> (Licentie: MIT): Maakt het mogelijk om .tar-archieven te maken, een noodzakelijke stap vóór compressie om .mbz-bestanden voor Moodle-modules te vormen.",
    legal_library_ownership: "Elke bibliotheek blijft eigendom van de respectieve auteurs en wordt gebruikt in overeenstemming met de licentie(s).",

    // Essay specific UI translations
    essay_checkAnswer: "Controleren",
    essay_tryAgain: "Opnieuw proberen",
    essay_showSolution: "Oplossing tonen",
    essay_feedbackHeader: "Feedback",
    essay_solutionTitle: "Voorbeeldoplossing",
    remainingChars: "Resterende tekens: @chars",
    notEnoughChars: "U moet minstens @chars tekens invoeren!",
    messageSave: "opgeslagen",
    placeholderText: "Begin hier met schrijven...",
    ariaYourResult: "U hebt @score van de @total punten behaald",
    ariaNavigatedToSolution: "Naar de nieuw opgenomen voorbeeldoplossing na het tekstvak genavigeerd.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "Je werk is een goed begin. Blijf het onderwerp verkennen om je ideeën te verrijken.",
    essay_overall_feedback_11_30: "Je hebt een interessante basis gelegd. Door dieper op bepaalde punten in te gaan, zal je werk aan precisie winnen.",
    essay_overall_feedback_31_50: "Je begrip van het onderwerp is goed op weg. Overweeg je argumenten verder te ontwikkelen om je standpunt te versterken.",
    essay_overall_feedback_51_70: "Dit is goed werk. Je toont een goede beheersing van het onderwerp. Enkele extra details kunnen het nog verbeteren.",
    essay_overall_feedback_71_90: "Zeer goed werk! Je analyse is relevant en goed gestructureerd. Je toont een uitstekend begrip.",
    essay_overall_feedback_91_100: "Uitstekend werk! Je reflectie is grondig, goed beargumenteerd en toont een volledige beheersing van het onderwerp.",

    // True/False Question
    true_false_prompt_role: "U bent een expert in onderwijsontwerp en maakt een Waar/Onwaar-vraag voor een H5P-activiteit.",
    true_false_prompt_mission: "Uw missie is om een JSON-object te genereren voor een Waar/Onwaar-vraag.",
    true_false_prompt_generate_json: "Genereer een JSON-object op basis van de volgende structuur:",
    true_false_prompt_json_structure_title: "--- VERWACHTE JSON-STRUCTUUR ---",
    true_false_prompt_json_structure_main_object: "Het hoofdobject moet de volgende sleutels bevatten:",
    true_false_prompt_question: "`question`: (string) De te beoordelen bewering. Kan HTML bevatten.",
    true_false_prompt_correct: "`correct`: (string) Het juiste antwoord, \"true\" of \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Commentaar dat wordt weergegeven als het antwoord correct is.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Commentaar dat wordt weergegeven als het antwoord onjuist is.",
    true_false_prompt_content_rules_title: "--- INHOUDSREGELS ---",
    true_false_prompt_rule1: "De vraag moet een duidelijke bewering zijn.",
    true_false_prompt_rule2: "De waarde van `correct` moet een string zijn: \"true\" of \"false\".",
    true_false_prompt_example_json_title: "--- JSON-VOORBEELD ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "Oslo is de hoofdstad van Noorwegen.",
"correct": "true",
"feedbackOnCorrect": "Goed antwoord! Oslo is inderdaad de hoofdstad van Noorwegen.",
"feedbackOnWrong": "Fout antwoord. De hoofdstad van Noorwegen is Oslo."
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "Ik wil dat u alleen de JSON genereert, zonder commentaar of inleidende tekst.",
    true_false_true_text: "Waar",
    true_false_false_text: "Onwaar",
    true_false_score: "U hebt @score van de @total punten behaald",
    true_false_check_answer: "Controleren",
    true_false_show_solution_button: "Oplossing tonen",
    true_false_try_again: "Opnieuw proberen",
    true_false_wrong_answer_message: "Fout antwoord",
    true_false_correct_answer_message: "Correct antwoord",
    true_false_score_bar_label: "U hebt :num van de :total punten behaald",
    true_false_submit_answer: "Indienen",
    true_false_a11y_check: "Controleer de antwoorden. De antwoorden worden gemarkeerd als correct, incorrect of onbeantwoord.",
    true_false_a11y_show_solution: "Toon de oplossing. De taak wordt gemarkeerd met de juiste oplossing.",
    true_false_a11y_retry: "Probeer de taak opnieuw. Reset alle antwoorden en begin de taak opnieuw.",
    true_false_finish_header: "Voltooien?",
    true_false_finish_body: "Weet u zeker dat u wilt voltooien?",
    true_false_cancel_label: "Annuleren",
    true_false_finish_label: "Voltooien",
    true_false_retry_header: "Opnieuw proberen?",
    true_false_retry_body: "Weet u zeker dat u opnieuw wilt proberen?",
    true_false_retry_confirm_label: "Bevestigen",

    // Multiple Choice UI translations
    checkAnswerButton: "Controleren",
    showSolutionButton: "Oplossing tonen",
    tryAgainButton: "Opnieuw proberen",
    submitAnswerButton: "Indienen",
    scoreBarLabel: "Je hebt :num van de :total punten",
    confirmCheckHeader: "Voltooien?",
    confirmCheckBody: "Weet je zeker dat je wilt voltooien?",
    confirmCheckCancelLabel: "Annuleren",
    confirmCheckConfirmLabel: "Voltooien",
    confirmRetryHeader: "Opnieuw proberen?",
    confirmRetryBody: "Weet je zeker dat je opnieuw wilt proberen?",
    confirmRetryCancelLabel: "Annuleren",
    confirmRetryConfirmLabel: "Bevestigen",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Meerkeuze\".",
    multiple_choice_prompt_mission: "**Jouw missie:**",
    multiple_choice_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-meerkeuzeactiviteit.",
    multiple_choice_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    multiple_choice_prompt_json_structure_main_object: "Het object moet bevatten:",
    multiple_choice_prompt_question: "`question`: De te stellen vraag (HTML-formaat).",
    multiple_choice_prompt_answers_array: "`answers`: Een array van objecten, die elk een antwoord vertegenwoordigen.",
    multiple_choice_prompt_text: "`text`: De antwoordtekst (HTML-formaat).",
    multiple_choice_prompt_correct: "`correct`: Een booleaanse waarde (`true` of `false`) die aangeeft of het het juiste antwoord is.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",
    multiple_choice_prompt_content_rules_title: "**Regels voor de inhoud:**",
    multiple_choice_prompt_rule1: "1.  Er mag slechts één juist antwoord zijn (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Geef meerdere onjuiste antwoorden (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**JSON-voorbeeld:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "Wat is de werkelijke kleur van zwarte bes (cassis)?",
"answers": [
{
"correct": true,
"text": "Zeer donker paars"
},
{
"correct": false,
"text": "Blauw"
},
{
"correct": false,
"text": "Zwart"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",

    // Find the Words UI translations
    check: "Controleren",
    tryAgain: "Opnieuw proberen",
    showSolution: "Oplossing tonen",
    found: "@found van @totalWords gevonden",
    timeSpent: "Besteede tijd",
    score: "Je hebt @score van de @total punten",
    wordListHeader: "Woordenlijst",

    // Find the Words Prompt
    find_the_words_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Woorden zoeken\".",
    find_the_words_prompt_mission: "**Jouw missie:**",
    find_the_words_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-activiteit Woorden zoeken.",
    find_the_words_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    find_the_words_prompt_json_structure_main_object: "Het object moet bevatten:",
    find_the_words_prompt_task_description: "`taskDescription`: Duidelijke instructies voor de activiteit.",
    find_the_words_prompt_word_list: "`wordList`: Een tekenreeks van te vinden woorden, gescheiden door komma's zonder spaties.",
    find_the_words_prompt_content_rules_title: "**Regels voor de inhoud:**",
    find_the_words_prompt_rule1: "1.  De `wordList` moet één enkele tekenreeks zijn met woorden gescheiden door komma’s. Elk woord moet eenvoudig zijn (geen meerwoordige termen). Cijfers, leestekens en letters met accenten/diakritische tekens zijn verboden (bv.: schrijf 'eleve' in plaats van 'élève').",
    find_the_words_prompt_example_json_title: "**JSON-voorbeeld:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Zoek de stadsnamen in het onderstaande rooster",
"wordList": "Canberra,Minsk,Peking,Oslo,Parijs,Londen,Madrid,Athene,Tokio,Moskou,Washington,Stockholm"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "Genereer uitsluitend geldige JSON-code, zonder commentaar.",
    fillPool: "abcdefghijklmnopqrstuvwxyz",

    // Sort the Paragraphs UI translations
    checkAnswer: "Controleren",
    submitAnswer: "Indienen",
    up: "Omhoog",
    down: "Omlaag",
    disabled: "Uitgeschakeld",
    a11y_yourResult: "U hebt @score van de @total punten behaald",
    a11y_paragraph: "Paragraaf",
    a11y_correct: "correct",
    a11y_wrong: "fout",
    a11y_point: "@score punt",
    a11y_sevenOfNine: "@current van @total",
    a11y_currentPosition: "Huidige positie in lijst",
    a11y_instructionsSelected: "Druk op de spatiebalk om opnieuw te ordenen",
    a11y_instructionsGrabbed: "Druk op de pijltoetsen omhoog en omlaag om de positie te wijzigen, de spatiebalk om neer te zetten, escape om te annuleren",
    a11y_grabbed: "Vastgepakt",
    a11y_moved: "Verplaatst",
    a11y_dropped: "Neergezet",
    a11y_reorderCancelled: "Opnieuw ordenen geannuleerd",
    a11y_finalPosition: "Eindpositie",
    a11y_nextParagraph: "Volgende paragraaf",
    a11y_correctParagraph: "Correcte paragraaf op positie",
    a11y_listDescription: "Sorteerbare lijst van paragrafen.",
    a11y_listDescriptionCheckAnswer: "Lijst van paragrafen met resultaten.",
    a11y_listDescriptionShowSolution: "Lijst van paragrafen met oplossingen.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "U bent een expert in onderwijsontwerp en maakt een H5P-activiteit \"Paragrafen sorteren\".",
    sort_the_paragraphs_prompt_mission: "**Uw missie:**",
    sort_the_paragraphs_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-activiteit voor het sorteren van paragrafen.",
    sort_the_paragraphs_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "Het object moet bevatten:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Duidelijke instructies voor de activiteit. Gebruik `*woord*` voor vet, `**woord**` voor cursief en `\\n` voor regeleindes.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Een array van tekenreeksen, die elk een te sorteren paragraaf vertegenwoordigen. De paragrafen moeten in de juiste volgorde staan. Gebruik `*woord*` voor vet, `**woord**` voor cursief.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",
    sort_the_paragraphs_prompt_content_rules_title: "**Inhoudsregels:**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` moet een logische voortgang vormen die uit de inhoud is af te leiden, zonder kunstmatige hints (nummers, data/tijden, «eerst/dan/tot slot»), tenzij expliciet gevraagd.",
    sort_the_paragraphs_prompt_rule2: "2. Geen platte lijst: elke zin voert dezelfde rode draad verder (oorzaak→gevolg, voorbereiding→actie→resultaat, algemeen→specifiek) zodat de volgorde afleidbaar is.",
    sort_the_paragraphs_prompt_example_json_title: "**JSON-voorbeeld:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "Mijn ochtendroutine:",
"paragraphs": [
  "Ik vul de waterkoker met vers water.",
  "Ik zet hem aan.",
  "Ik doe een theezakje in het kopje.",
  "Ik schenk het kokende water over het zakje.",
  "Ik haal het zakje eruit zodra de thee klaar is."
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Genereer alleen de geldige JSON-code, zonder commentaar.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Oplossing tonen",
    retryButtonLabel: "Opnieuw proberen",
    solutionViewTitle: "Oplossing",
    correctText: "Correct!",
    incorrectText: "Incorrect!",
    muteButtonLabel: "Dempen",
    closeButtonLabel: "Sluiten",
    slideOfTotal: "Dia @slide van @total",
    nextButtonLabel: "Volgende",
    solutionListQuestionNumber: "Vraag @question",
    a11yShowSolution: "Toon de oplossing. De taak wordt gemarkeerd met de juiste oplossing.",
    a11yRetry: "Probeer de taak opnieuw. Reset alle antwoorden en begin de taak opnieuw.",
    shouldSelect: "Moet selecteren",
    shouldNotSelect: "Moet niet selecteren",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "U bent een expert in onderwijsontwerp en maakt een H5P-activiteit \"Enkelkeuze set\".",
    single_choice_set_prompt_mission: "**Uw missie:**",
    single_choice_set_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-activiteit van het type Enkelkeuze set.",
    single_choice_set_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    single_choice_set_prompt_json_structure_main_object: "Het object moet bevatten:",
    single_choice_set_prompt_choices_array: "`choices`: Een array van objecten, waarbij elk object een vraag vertegenwoordigt en bevat:",
    single_choice_set_prompt_question: "`question`: De te stellen vraag.",
    single_choice_set_prompt_answers_array: "`answers`: Een array van tekenreeksen. De eerste tekenreeks is altijd het juiste antwoord.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (STRICTE REGEL) Genereer verplicht een array van 6 objecten voor de eindfeedback, afgestemd op het thema van de oefening, met strikte scorebanden 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. Elk object heeft de vorm `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. De `feedback`-tekst is vriendelijk, niet overdreven, gradueel en steeds bevestigend.",
    single_choice_set_prompt_content_rules_title: "**Inhoudsregels:**",
    single_choice_set_prompt_rule1: "1. In elke `answers`-array is het eerste antwoord altijd het juiste.",
    single_choice_set_prompt_example_json_title: "**JSON-voorbeeld:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "Goji-bessen staan ook bekend als ...",
"answers": ["Wolfbessen", "Kattenbessen", "Berenbessen"]
},
{
"question": "Goji-bessen zijn afkomstig uit ...",
"answers": ["Azië", "Afrika", "Europa"]
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
]
}
\`\`\` `,
   single_choice_set_prompt_generate_only_json: "Genereer alleen de geldige JSON-code, zonder commentaar.",

    // Dialog Cards UI translations
    answer: "Omdraaien",
    next: "Volgende",
    prev: "Vorige",
    retry: "Opnieuw proberen",
    progressText: "Kaart @card van @total",
    cardFrontLabel: "Voorkant kaart",
    cardBackLabel: "Achterkant kaart",
    tipButtonLabel: "Toon tip",
    audioNotSupported: "Uw browser ondersteunt deze audio niet",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "U bent een expert in onderwijsontwerp en maakt een H5P-activiteit \"Dialoogkaarten\".",
    dialog_cards_prompt_mission: "**Uw missie:**",
    dialog_cards_prompt_generate_json: "Genereer een JSON-object dat alleen de sleutels `title`, `description` en `dialogs` bevat voor een H5P-activiteit van het type Dialoogkaarten.",
    dialog_cards_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    dialog_cards_prompt_json_structure_main_object: "Het object moet bevatten:",
    dialog_cards_prompt_title: "`title`: Een titel voor de activiteit (HTML-formaat).",
    dialog_cards_prompt_description: "`description`: Een korte beschrijving of instructie (HTML-formaat).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: Een array van ${nombreQuestions} objecten, die elk een kaart vertegenwoordigen en bevatten:",
    dialog_cards_prompt_text: "`text`: De tekst op de voorkant van de kaart (HTML-formaat).",
    dialog_cards_prompt_answer: "`answer`: De tekst op de achterkant van de kaart (HTML-formaat).",
    dialog_cards_prompt_tips: "`tips` (optioneel): Een object voor hints. Als u het pedagogisch nuttig acht, voeg dan een hint toe voor de voorkant met de sleutel `front` en/of voor de achterkant met de sleutel `back`.",
    dialog_cards_prompt_content_rules_title: "**Inhoudsregels:**",
    dialog_cards_prompt_rule1: "1. De teksten voor de voorkant (`text`) en achterkant (`answer`) moeten duidelijk en beknopt zijn. **Maak de inhoud op met HTML (<strong> voor vet, <em> voor cursief) om de leesbaarheid te verbeteren en belangrijke informatie te markeren.**",
    dialog_cards_prompt_example_json_title: "**JSON-voorbeeld:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "Leer de namen van fruit in het Engels",
"description": "De fruitnamen worden in het Frans aangeboden. Draai de kaarten om de juiste Engelse vertaling te zien.",
"dialogs": [
{
"title": "Vind de Engelse werkwoorden in de tegenwoordige tijd",
"description": "Vertrekkend van een Engelse zin in de verleden tijd, vind het werkwoord in de infinitief. Draai de kaarten om je antwoorden te controleren.",
"dialogs": [
{
"text": "He *visited* his grandmother.",
"answer": "to *visit*",
"tips": {
"front": "Identificeer het werkwoord in de verleden tijd.",
"back": "Denk aan de basisvorm (infinitief) van het werkwoord."
}
},
{
"text": "She *played* soccer.",
"answer": "to *play*",
"tips": {
"front": "Zoek naar het werkwoord in de verleden tijd.",
"back": "Stel je de woordenboekvorm (infinitief) van het werkwoord voor."
}
}
]
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Genereer alleen de geldige JSON-code met de sleutels `title`, `description` en `dialogs`, zonder commentaar.",

    // Dialog Cards specific UI translations
    correctAnswer: "Ik had het goed!",
    incorrectAnswer: "Ik had het fout",
    round: "Ronde @round",
    cardsLeft: "Resterende kaarten: @number",
    nextRound: "Ga door naar ronde @round",
    startOver: "Begin opnieuw",
    showSummary: "Volgende",
    summary: "Samenvatting",
    summaryCardsRight: "Kaarten die je goed had:",
    summaryCardsWrong: "Kaarten die je fout had:",
    summaryCardsNotShown: "Kaarten in de stapel die niet zijn getoond:",
    summaryOverallScore: "Algemene score",
    summaryCardsCompleted: "Kaarten die je hebt voltooid:",
    summaryCompletedRounds: "Voltooide rondes:",
    summaryAllDone: "Goed gedaan! Je hebt alle @cards kaarten @max keer achter elkaar goed beantwoord!",
    confirmStartingOverHeader: "Opnieuw beginnen?",
    confirmStartingOverBody: "Alle voortgang gaat verloren. Weet je zeker dat je opnieuw wilt beginnen?",
    confirmStartingOverCancelLabel: "Annuleren",
    confirmStartingOverConfirmLabel: "Opnieuw beginnen",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "U bent een expert in onderwijsontwerp en maakt een H5P-activiteit \"Complex Fill the Blanks\".",
    complex_blanks_prompt_mission: "**Uw missie:**",
    complex_blanks_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-activiteit van het type Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    complex_blanks_prompt_json_structure_main_object: "Het hoofdobject moet de sleutels `content` en `overallFeedback` bevatten.",
    complex_blanks_prompt_task: "`task`: De instructies voor de oefening (in HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: De tekst met de lege plekken, weergegeven door `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: Een array van objecten, één voor elke lege plek, in volgorde van verschijning.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: Het juiste antwoord (kan alternatieven bevatten met `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: Een array van objecten voor veelvoorkomende fouten.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: De tekst van een veelvoorkomende fout.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: De specifieke feedback voor deze fout (in HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: Een array voor algemene feedback op basis van de score.",
    complex_blanks_prompt_content_rules_title: "**Inhoudsregels:**",
    complex_blanks_prompt_rule1: "1. Het aantal objecten in `blanksList` moet overeenkomen met het aantal lege plekken in `blanksText`.",
    complex_blanks_prompt_rule2: "2. Geef veelvoorkomende fouten en constructieve feedback.",
    complex_blanks_prompt_rule3: "3. De tekst en feedback kunnen eenvoudige HTML-tags bevatten zoals `<p>`, `<strong>`, `<em>`.",
    complex_blanks_prompt_example_json_title: "**Voorbeeld-JSON:**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Zet de werkwoorden in de juiste tijd. Je krijgt individuele feedback voor typische fouten.</p>",
"blanksList": [
{
"correctAnswerText": "spreekt niet",
"incorrectAnswersList": [
{
"incorrectAnswerText": "niet spreekt",
"incorrectAnswerFeedback": "<div>Onthoud dat 'niet' meestal achter het werkwoord komt <em>(spreken)</em>.</div>"
},
{
"incorrectAnswerText": "spreken niet",
"incorrectAnswerFeedback": "<div>Je bent de uitgang voor derde persoon enkelvoud vergeten <em>(hij)</em>.</div>"
}
]
}
],
"blanksText": "<p>Hij spreekt Engels maar hij (niet / spreken) ___________<strong>&nbsp;</strong>Duits.</p>"
},
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback voor 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback voor 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback voor 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback voor 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback voor 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback voor 91-100%" }
]
}
\`\`\` `,
    complex_blanks_prompt_generate_only_json: "Genereer alleen de geldige JSON-code, zonder commentaar.",

    // Chart Prompt
    chart_prompt_role: "U bent een expert in onderwijsontwerp en maakt een H5P-activiteit \"Grafiek\".",
    chart_prompt_mission: "**Uw missie:**",
    chart_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-Grafiekactiviteit.",
    chart_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    chart_prompt_json_structure_main_object: "Het object moet bevatten:",
    chart_prompt_graph_mode: "`graphMode`: Kies het meest relevante grafiektype, 'pieChart' (cirkeldiagram) of 'barChart' (staafdiagram), op basis van de context, tenzij anders aangegeven.",
    chart_prompt_list_of_types: "`listOfTypes`: Een array van objecten, die elk een gegevenspunt in de grafiek vertegenwoordigen.",
    chart_prompt_value: "`value`: De numerieke waarde van het gegevenspunt.",
    chart_prompt_color: "`color`: De kleur van het gegevenspunt (hex-code).",
    chart_prompt_font_color: "`fontColor`: De kleur van de tekst voor het gegevenspunt (hex-code).",
    chart_prompt_text: "`text`: Het label voor het gegevenspunt.",
    chart_prompt_figure_definition: "`figureDefinition`: Een korte beschrijving van de grafiek.",
    chart_prompt_content_rules_title: "**Inhoudsregels:**",
    chart_prompt_rule1: "1. Kies contrasterende kleuren voor een goede leesbaarheid.",
    chart_prompt_rule2: "2. Labels moeten kort en duidelijk zijn.",
    chart_prompt_rule3: "3. Als een waarde erg laag is in vergelijking met andere, geef dan de voorkeur aan een 'barChart' voor een betere visualisatie.",
    chart_prompt_example_json_title: "**Voorbeeld-JSON:**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Bosbessen"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Frambozen"}
],
"figureDefinition": "Diagram"
}
\`\`\` `,
    chart_prompt_generate_only_json: "Genereer alleen de geldige JSON-code, zonder commentaar.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Vorige",
    quiz_next_button: "Volgende",
    quiz_finish_button: "Voltooien",
    quiz_submit_button: "Indienen",
    quiz_textual_progress: "Vraag @current van @total",
    quiz_no_result_message: "Voltooid",
    quiz_result_message: "Uw resultaten:",
    quiz_score_bar_label: "U hebt @finals van de @totals punten behaald",
    quiz_solution_button_text: "Oplossing tonen",
    quiz_retry_button_text: "Opnieuw proberen",
    quiz_finish_button_text: "Voltooien",
    quiz_submit_button_text: "Indienen",
    quiz_feedback_available: "Feedback beschikbaar",
    quiz_read_feedback: "Lees feedback",
    quiz_wrong_answer: "Fout antwoord",
    quiz_correct_answer: "Correct antwoord",
    quiz_should_check: "Had aangevinkt moeten zijn",
    quiz_should_not_check: "Had niet aangevinkt moeten zijn",
    quiz_no_input: "Gelieve te antwoorden alvorens de oplossing te bekijken.",
    quiz_a11y_check: "Controleer de antwoorden. De antwoorden worden gemarkeerd als correct, incorrect of onbeantwoord.",
    quiz_a11y_show_solution: "Toon de oplossing. De taak wordt gemarkeerd met de juiste oplossing.",
    quiz_a11y_retry: "Probeer de taak opnieuw. Reset alle antwoorden en begin de taak opnieuw.",

    // Caramel-AI — generatie
    generate_with_llm: "Genereren met de AI van Caramel",
    generation_in_progress: "Generatie bezig, even geduld...",
    request_sent_to_ia: "Verzoek naar de AI verzonden, even geduld...",
    generation_successful: "H5P-inhoud succesvol gegenereerd!",
    generation_failed_empty: "Genereren is mislukt. De respons was leeg.",
    generation_failed_error: "Fout tijdens het genereren: {errorMessage}",
    generation_failed_llm: "Genereren via de AI van Caramel is mislukt. Oorzaak: {errorMessage}",

    // Modelbeschrijvingen (AI van Caramel)
    llm_small_summary: "Zachte karamel: snel, licht, perfect voor flitsoefeningen en antwoorden zonder wachttijd. Verbruikt weinig.",
    llm_large_summary: "Vloeiende karamel: rijker en genuanceerder, ideaal voor taken die wat diepgang vragen. Verbruikt meer.",
    llm_xl_summary: "Harde karamel: krachtig en complex, voor ambitieuze projecten. Geduld vereist, resultaat gegarandeerd! Verbruikt veel meer.",

    // Vriendelijke modelnamen (menuweergave)

    // Modelindicatoren (AI van Caramel)
    llm_model_source: "Aanbieder van het model:",
    llm_model_parameters: "Modelgrootte:",
    llm_model_parameters_unit: "Mrd parameters",

    language: "Taal",
    tutorial: "Handleiding",
    version_modal_title: "Nieuwe versie beschikbaar",
    version_modal_message: "Je gebruikt nu versie {currentVersion}. Er staat een nieuwere versie ({latestVersion}) online. Vernieuw de pagina om de laatste verbeteringen te ontvangen.",
    version_modal_update: "Nieuwe versie laden",
    version_modal_remind_later: "Later herinneren",

    // Woordenlijst-XML-prompt
    glossaire_xml_prompt_role: "Je bent een expert in instructieontwerp en je gaat inhoud maken voor een woordenlijst.",
    glossaire_xml_prompt_mission: "**Je missie:** Je moet een eenvoudig JSON-object genereren met een lijst met termen voor een woordenlijst. Elke term moet een concept, een definitie en, indien relevant, een lijst met aliassen bevatten.",
    glossaire_xml_prompt_structure_title: "**Verwachte JSON-structuur:**",
    glossaire_xml_prompt_structure_rules: `
-   **Root:** Een hoofdobject met twee sleutels: \`name\` (de naam van de woordenlijst) en \`entries\` (een array van objecten).
-   **Elk object in \`entries\` moet bevatten:**
    -   \`concept\`: Het woord of de uitdrukking die gedefinieerd moet worden.
    -   \`definition\`: Een duidelijke en beknopte definitie. Gebruik *mot* voor vet, **mot** voor cursief en \\n voor regeleinden, alleen wanneer dit didactisch relevant is.
    -   \`aliases\` (optioneel): Een array met tekenreeksen voor synoniemen of alternatieve termen. Voeg deze sleutel alleen toe als er relevante aliassen bestaan.`,
    glossaire_xml_prompt_example_title: "**JSON-voorbeeld:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "Het lexicon van informatie",
  "entries": [
    {
      "concept": "Journalist",
      "definition": "Persoon die **verzamelt**, controleert en *informatie* verspreidt.",
      "aliases": ["Reporter", "Columnist"]
    },
    {
      "concept": "Bron",
      "definition": "Oorsprong van *informatie*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Genereer alleen geldige JSON-code, zonder enige opmerkingen.",

    //Barre de menu
    tab_all: "Alles",
    tab_quiz: "Quiz & Tests",
    tab_text: "Tekstmanipulatie",
    tab_memory: "Memoriseren & Ontdekken",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 Prompt ophalen",
    create_file_step: "2/2 Bestand aanmaken",
    generate_one_click: "Genereren met één klik",
    simple_mode: "Eenvoudig",
    advanced_mode: "Geleid",

    // RAG feature
    activate_rag: "Documentconsultatie inschakelen",
    rag_tooltip: "Hiermee kunt u tekst plakken of een PDF uploaden. De inhoud wordt gebruikt als de belangrijkste bron voor het genereren van de activiteiten.",
    rag_title: "Documenten bijvoegen (optioneel)",
    rag_note: "Als u wilt dat de AI uitsluitend op basis van uw documenten werkt, plak dan uw tekst of plaats uw bestanden hier. Laat dit gebied anders leeg, zodat de AI zelf naar informatie kan zoeken.",
    upload_pdf: "Of upload een PDF voor analyse",
    pdf_loading: "PDF laden...",
    pdf_processing_page: "Pagina verwerken",
    ocr_recognizing_page: "Pagina herkennen (OCR)",
    ocr_success: "Het document is succesvol verwerkt.",
    ocr_error: "Er is een fout opgetreden tijdens de verwerking.",
    error_invalid_pdf: "Selecteer een geldig PDF-bestand.",
    error_duplicate_pdf: "Dit bestand is al toegevoegd.",
    error_fullscreen: "Volledig scherm is mislukt:",
    lock_text: "Vergrendelen",
    unlock_text: "Ontgrendelen",
    rag_instruction: "\n\nU dient alleen de volgende informatie te raadplegen om de inhoud te genereren:",
    drag_drop_text: "Sleep een PDF-bestand hierheen en laat het los",
    or_text: "of",
    upload_pdf_btn: "Kies een bestand",
    paste_your_text_here: "Kopieer en plak hier je tekst...",
    rag_tags_tuto: "Hieronder vindt u de geüploade documenten. Klik op de gekleurde cirkel om de markering van elk document aan te passen.",

    // Stappen om karamel te maken
    caramel_animation_step_1: "Giet de suiker in de pan...",
    caramel_animation_step_2: "Voeg een beetje water toe...",
    caramel_animation_step_3: "Verwarm op middelhoog vuur...",
    caramel_animation_step_4: "De suiker begint te smelten...",
    caramel_animation_step_5: "Het begint te kleuren...",
    caramel_animation_step_6: "Roer voorzichtig...",
    caramel_animation_step_7: "De karamel krijgt een mooie amberkleur...",
    caramel_animation_step_8: "Voeg de warme room toe...",
    caramel_animation_step_9: "Pas op voor spetters!",
    caramel_animation_step_10: "Roer goed...",
    caramel_animation_step_11: "Het is bijna klaar!",

    // Pagina-prompt
    page_prompt_role: "Je bent een expert in onderwijskunde die een gestructureerde activiteit Pagina maakt voor Éléa/Moodle.",
    page_prompt_mission: "**Je missie :**",
    page_prompt_generate_json: "Genereer een JSON-object om een Éléa-inhoudspagina op te bouwen. De paginastructuur is gebaseerd op vooraf gedefinieerde blokken. Je moet uit onderstaande lijst de meest relevante blokken kiezen om aan de vraag van de gebruiker te voldoen.",
    page_prompt_json_structure_title: "**Verwachte JSON-structuur :**",
    page_prompt_json_structure_main_object: "Het hoofdobject moet een sleutel \"title\" bevatten voor de paginatitel, een sleutel \"intro\" voor een duidelijke en begrijpelijke introductie op de daaropvolgende leerinhoud, en een sleutel \"blocks\" die een array van objecten is. Elk object vertegenwoordigt een inhoudsblok en moet een \"type\" hebben dat overeenkomt met een van de onderstaande blokken, en een \"data\"-object dat de blokspecifieke informatie bevat.",
    page_prompt_blocks_list_title: "**Lijst met beschikbare blokken :**",
    page_prompt_block_01: "- `#01_hero_header`: Openingsbanner. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: Inhoudsopgave met interne links. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: Historische ijkpunten in 3 kaarten. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (max. 3 kaarten)",
    page_prompt_block_04: "- `#04_callout_set`: Banners Doelstellingen, Om te weten, Alarm. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: Kerncijfers in kaarten. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: Woordenlijsttabel. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: Glossarium als chips. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: Monumentkaarten met afbeeldingen. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: Twee afbeeldingen vergeleken. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: Vergelijkingstabel. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: Definitievak. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"Definitie\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: Cursusparagrafen. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: Uitgebreide fiche. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: Veelgestelde vragen. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: Mythes vs Realiteiten. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"Mythes\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"Realiteiten\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: Methode om een afbeelding te beschrijven. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: Webografie. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"Webografie\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: Tweetalige citaat. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**Regels voor de inhoud :**",
    page_prompt_rule1: "1.  De JSON moet geldig zijn.",
    page_prompt_rule2: "2.  Tekstinhoud mag Markdown-tags gebruiken: `*woord*` voor vet en `**woord**` voor cursief.",
    page_prompt_rule3: "3.  Voor afbeeldingen: zoek relevante, rechtenvrije URL's (bijv.: Wikimedia Commons).",
    page_prompt_example_json_title: "**JSON-voorbeeld :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "De Franse Revolutie",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "De Franse Revolutie", "subtitle": "Essentiële referentiepunten" } },
    { "type": "#12_context_paragraphs", "data": { "title": "Context", "paragraphs": ["De Franse Revolutie is een periode van omwentelingen...", "Meerdere oorzaken verklaren deze gebeurtenis..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "Belangrijkste gebeurtenissen", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "Bestorming van de Bastille", "caption": "14 juli 1789", "title": "Bestorming van de Bastille", "text": "Deze gebeurtenis markeert het begin van de Revolutie." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "Genereer alleen geldige JSON-code, zonder enig commentaar."
};
