const translations_nl = {
    subtitle: "Begeleide creatie van Moodle- en Éléa-bronnen en -activiteiten",
    help_button: "Hulp",
    help_modal_title: "🚀 Snelstartgids voor Caramel",
    help_modal_content: `
        <div class="help-modal-content">
            <p>Welkom bij <strong>Caramel</strong>! Deze tool begeleidt u stap voor stap bij het maken van interactieve educatieve activiteiten met behulp van kunstmatige intelligentie. Volg deze eenvoudige stappen om uw ideeën om te zetten in kant-en-klare modules.</p>

            <div class="help-section">
                <h4><span class="help-step-number">1</span> Schrijf uw idee op (de "prompt")</h4>
                <p>Alles begint met het beschrijven van uw behoeften. U heeft hiervoor twee opties:</p>
                <ul>
                    <li><span class="badge-help-mode">Snelle modus</span>: Ideaal voor een snelle start. Geef eenvoudig aan <strong>wie u bent</strong> (bv: <em>Docent wetenschappen</em>) en <strong>wat u wilt behandelen</strong> (bv: <em>de watercyclus in de 6e klas</em>).</li>
                    <li><span class="badge-help-mode">Geleide modus</span>: Voor een preciezer verzoek. Vul de <strong>discipline</strong>, het <strong>thema</strong>, het <strong>niveau van de leerling</strong> en het <strong>aantal gewenste items</strong> in (vragen, data, etc.).</li>
                </ul>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">2</span> Genereer de prompts</h4>
                <p>Nadat u uw informatie heeft ingevoerd, klikt u op de knop <button id="generateBtn" data-key="generate_prompts">Prompts genereren</button>. De tool zal dan gedetailleerde instructies (de "prompts") voorbereiden voor elk beschikbaar activiteitstype.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">3</span> Kies uw activiteit</h4>
                <p>Navigeer tussen de tabbladen <span class="badge-help-tab">H5P</span> en <span class="badge-help-tab">Éléa/Moodle Modules</span> om de verschillende beschikbare activiteiten te ontdekken. Klik op degene die u interesseert (bijvoorbeeld "Tijdlijn" of "MCQ"). De bijbehorende prompt verschijnt in het tekstvak.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">4</span> Gebruik Kunstmatige Intelligentie</h4>
                <p>Hier gebeurt de magie! U heeft twee opties om de inhoud voor uw activiteit te genereren:</p>
                <div class="help-subsection">
                    <h5><i class="fas fa-robot"></i> Optie A: Genereer met Albert (Aanbevolen)</h5>
                    <p>Klik op de knop <button class="action-btn albert-btn">Genereer met Albert</button>. U kunt het AI-model kiezen dat het beste bij uw behoeften past (snel, krachtig of gespecialiseerd in code) door op het pijltje rechts van de knop te klikken. De inhoud voor uw activiteit wordt <strong>automatisch gegenereerd en ingevoegd</strong> in het resultaatveld, klaar voor gebruik.</p>
                    <ul class="advantages">
                        <li><strong>Sterke punten:</strong> Eenvoudig, snel, geïntegreerde AI direct in de tool.</li>
                        <li><strong>Zwakke punten:</strong> Geen zoekopdracht op het web, geen aanpassing van de initiële AI-prompt mogelijk.</li>
                    </ul>
                </div>
                <div class="help-subsection">
                    <h5><i class="fas fa-paste"></i> Optie B: Gebruik uw eigen AI</h5>
                    <p>Klik op <button class="copy-btn">📋 Prompt kopiëren</button> en plak deze instructie in uw favoriete kunstmatige intelligentie (ChatGPT, Le Chat, etc.). Kopieer vervolgens <strong>de reactie van de AI</strong> en <strong>plak deze</strong> in het resultaatveld van Caramel.</p>
                    <ul class="advantages">
                        <li><strong>Sterke punten:</strong> Volledige flexibiliteit, mogelijke internettoegang, mogelijkheid om de initiële prompt te wijzigen en documenten toe te voegen voor het genereren van inhoud.</li>
                        <li><strong>Zwakke punten:</strong> Vereist handmatig kopiëren en plakken en een extern account.</li>
                    </ul>
                </div>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">5</span> Maak en download uw bestand</h4>
                <p>Zodra de inhoud in het resultaatveld staat (gegenereerd door Albert of door u geplakt), klikt u op de knop <button class="download-btn">Genereer H5P</button> (of .mbz/.xml afhankelijk van de activiteit). Uw bestand wordt gedownload, klaar om te worden geïntegreerd in uw Moodle- of Éléa-platform.</p>
                <p class="help-final-tip">En dat is alles! U heeft in een paar klikken een interactieve activiteit gemaakt. Aarzel niet om te experimenteren met de verschillende modi en activiteitstypen om uw cursussen te verrijken.</p>
            </div>
        </div>
    `,
    fast_mode: "Snelle modus",
    guided_mode: "Geleide modus",
    who_are_you: "Wie bent u? (bv.: Docent, trainer...)",
    what_to_address: "Wat wilt u behandelen? (bv.: De aard van een hoek in de brugklas...)",
    discipline: "Discipline (bv.: Geschiedenis)",
    theme: "Thema (bv.: De Franse Revolutie)",
    level: "Niveau (bv.: Tweede jaar beroepsonderwijs)",
    number_of_elements: "Aantal elementen (bv.: 10)",
    additional_info: "Aanvullende en specifieke informatie...",
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
    timeline_prompt_rule1_text: "-   `text`: Beschrijving in HTML (gebruik <p> en <strong>).",
    timeline_prompt_rule1_asset: "-   `asset`: Een optioneel object met een illustrerende afbeelding.",
    timeline_prompt_rule1_tag: "- `tag`: Een trefwoord dat de periode kenmerkt (bv. 'geschiedenis', 'wetenschap').",
    timeline_prompt_rule2: "2.  Zoek voor elke `asset` actief naar een relevante, rechtenvrije afbeelding (bv. Wikimedia Commons). De URL in `media` moet een directe en geldige link zijn. Vermeld de bron en licentie in `credit`. Als er geen geschikte afbeelding wordt gevonden, laat het `asset`-object dan volledig weg.",
    timeline_prompt_rule3: "3.  Voeg voor elke periode (`era`) een `text`-veld toe met een korte beschrijving en een `tag`.",
    timeline_prompt_example_json_title: "**Voorbeeld van JSON-structuur:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Titel van de tijdlijn",
"text": "<p>Inleiding tot het thema van de tijdlijn.</p>",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Begin van de Eerste Wereldoorlog",
"text": "<p>Oostenrijk-Hongarije verklaart de oorlog aan Servië.</p>",
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
"text": "<p>Ondertekening van de wapenstilstand in Rethondes, waarmee de gevechten eindigden.</p>",
"tag": "Verdrag"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Eerste Wereldoorlog",
"text": "<div>Dit is de periode van de Grote Oorlog.</div>",
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
    crossword_prompt_clue: "`clue`: De bijbehorende definitie.",
    crossword_prompt_extra_clue_optional: "`extraClue` (optioneel): Een object met een extra hint. De AI moet de relevantie van het toevoegen ervan beoordelen.",
    crossword_prompt_task_description: "`taskDescription`: Een duidelijke instructie.",
    crossword_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn.",
    crossword_prompt_content_rules_title: "**Regels voor de inhoud:**",
    crossword_prompt_rule1: "1.  De woorden (`answer`) moeten uniek en relevant zijn.",
    crossword_prompt_rule2: "2.  De definities (`clue`) moeten kort en precies zijn.",
    crossword_prompt_rule3: "3.  De rest van de JSON-structuur (gedrag, thema, enz.) blijft ongewijzigd.",
    crossword_prompt_example_json_title: "**JSON-voorbeeld voor één woord:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Kruiswoordpuzzel over Biologie",
"words": [
{
"answer": "Cel",
"clue": "De basiseenheid van het leven.",
"extraClue": {
"params": {
"text": "<p>Kan dierlijk of plantaardig zijn.</p>"
}
}
},
{
"answer": "DNA",
"clue": "Molecuul dat de genetische informatie draagt."
}
],
"taskDescription": "<p>Vul het kruiswoordraadsel in.</p>"
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
    essay_prompt_task_description: "`taskDescription`: Een duidelijke opdracht die de leerling uitnodigt een tekst over het thema te schrijven. Het thema moet vetgedrukt zijn (<strong>) en elke zin moet eindigen met een regeleinde (<p>).",
    essay_prompt_keywords_array: "`keywords`: Een array met ${nombreQuestions} objecten; elk definieert een trefwoord dat het systeem in het antwoord moet vinden.",
    essay_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn.",
    essay_prompt_content_rules_title: "**Regels voor de inhoud:**",
    essay_prompt_rule1: "1.  Elk object in `keywords` bevat de sleutel `keyword` met het te zoeken woord.",
    essay_prompt_rule2: "2.  De trefwoorden zijn relevant en essentieel om het begrip van het onderwerp te beoordelen.",
    essay_prompt_rule3: "3.  De JSON-structuur (gedrag, enz.) blijft behouden.",
    essay_prompt_rule4: "4. De instructie (`taskDescription`) moet het schrijven aanmoedigen zonder de trefwoorden uit `keywords` te gebruiken, behalve de naam van het thema als dat nodig is voor het begrip.",
    essay_prompt_example_json_title: "**JSON-voorbeeld voor één trefwoord:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "<p>Schrijf een korte tekst die de fotosynthese uitlegt.</p>",
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

    // Moodle XML Prompt
    moodle_xml_prompt_intro: "Ik wil een quiz met ${nombreQuestions} vragen aanmaken.",
    moodle_xml_prompt_content_title: "Wat betreft de inhoud:",
    moodle_xml_prompt_content_rule1: "Foute antwoorden moeten inhoudelijk kloppen maar duidelijk onjuist zijn om gokken te vermijden.",
    moodle_xml_prompt_content_rule2: "Varieer in moeilijkheid, idealiter van eenvoudig naar complex.",
    moodle_xml_prompt_content_rule3: "Vereenvoudig de formulering met behoud van inhoudelijke nauwkeurigheid.",
    moodle_xml_prompt_content_rule4: "Voor de feedback geef je in één à twee zinnen de verwachte elementen van het antwoord.",
    moodle_xml_prompt_question_types_intro: "De vragen worden gelijkmatig verdeeld over de volgende types:",
    moodle_xml_prompt_question_type_multichoice: "- multichoice (meerkeuze met één juist antwoord),",
    moodle_xml_prompt_question_type_matching: "- matching (koppelen),",
    moodle_xml_prompt_question_type_numerical: "- numerical (numeriek antwoord met of zonder tolerantie),",
    moodle_xml_prompt_question_type_truefalse: "- truefalse (waar/onwaar).",
    moodle_xml_prompt_question_type_shortanswer: "- shortanswer (kort antwoord) met eventuele alternatieve antwoorden,",
    moodle_xml_prompt_question_type_cloze: "- cloze (invultekst) met de categorieën MULTICHOICE, MULTICHOICE_H, MULTICHOICE_V, MULTICHOICE_S, MULTICHOICE_HS, MULTIRESPONSE, MULTIRESPONSE_H, MULTIRESPONSE_HS, NUMERICAL, SHORTANSWER of SHORTANWSER_C, afhankelijk van wat het best bij de context past.",
    moodle_xml_prompt_form_title: "Wat betreft de vorm:",
    moodle_xml_prompt_form_rule1: "Het XML-bestand moet:",
    moodle_xml_prompt_form_rule1_encoding: "In UTF-8 gecodeerd zijn (voeg de coderegel toe).",
    moodle_xml_prompt_form_rule1_reusable: "Direct herbruikbaar zijn in Moodle, zonder opmaakfouten.",
    moodle_xml_prompt_form_rule1_standard_structure: "De standaard Moodle-XML-structuur volgen (met <quiz>, <question>, enz.).",
    moodle_xml_prompt_form_rule1_special_chars: "Wiskundige symbolen zoals '<' of '>' moeten worden gecodeerd als HTML-entiteiten (bijvoorbeeld, `<` voor '<' en `>` voor '>') om verwarring met XML-tags te voorkomen.",
    moodle_xml_prompt_generate_only_xml: "Niet becommentariëren, niet opmaken, niet samenvatten: ik wil alleen de ruwe XML-inhoud. Respecteer strikt het beschreven formaat, want ik plak het resultaat in een andere tool die dit formaat vereist. Geef het antwoord als vooraf opgemaakte code.",

    // GIFT Prompt
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
    flashcards_prompt_role: "Je bent een specialist in leerontwerp en maakt een H5P-activiteit \"Flashcards\".",
    flashcards_prompt_mission: "**Jouw missie:**",
    flashcards_prompt_generate_json: "Genereer een volledig en geldig JSON-object voor een H5P-flashcardsactiviteit. De JSON moet direct bruikbaar zijn.",
    flashcards_prompt_json_structure_title: "**Verwachte JSON-structuur:**",
    flashcards_prompt_json_structure_main_object: "Het object moet bevatten:",
    flashcards_prompt_title: "`title`: Een passende titel voor de activiteit.",
    flashcards_prompt_description: "`description`: Een duidelijke instructie voor de leerling.",
    flashcards_prompt_cards_array: "`cards`: Een array van ${nombreQuestions} objecten; elk object stelt een kaart voor en bevat:",
    flashcards_prompt_text: "`text`: De vraag of de te raden term (voorzijde).",
    flashcards_prompt_answer: "`answer`: Het antwoord of de definitie (achterzijde). Let op: `answer` mag slechts één eenvoudig woord of een getal bevatten.",
    flashcards_prompt_tip: "`tip` (optioneel): Een hint in HTML-formaat om de leerling te helpen als de vraag moeilijk is. Voeg alleen een hint toe als je denkt dat het relevant is.",
    flashcards_prompt_example_json_title: "**JSON-voorbeeld:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "De hoofdsteden van Europa",
"description": "Onthoud de hoofdstad van elk land. Klik op de kaart om het antwoord te zien.",
"cards": [
{
"text": "Frankrijk",
"answer": "Parijs"
},
{
"text": "Nederland",
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
            "question": "<p>Is Frankrijk een land?</p>",
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
            "question": "<p>Wat is de hoofdstad van Frankrijk?</p>",
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
            "questions": ["<p>Parijs is de *hoofdstad* van Frankrijk.</p>"],
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
            "taskDescription": "<p>Wat is de hoofdstad van Frankrijk?</p>",
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
    glossary_prompt_content: "`text`: De definitie in HTML-formaat (gebruik <p>, <strong>, enz.).",
    glossary_prompt_content_rules_title: "**Regels voor de inhoud:**",
    glossary_prompt_rule1: "1.  Definities moeten duidelijk, beknopt en passend bij het niveau van de leerlingen zijn.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**JSON-voorbeeld voor één item:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Fotosynthese",
"text": "<p>Proces waarbij groene planten zonlicht omzetten in energie.</p>"
},
{
"title": "Cel",
"text": "<p>De basiseenheid van alle levende wezens.</p>"
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
    summary_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn, en gerelateerd aan het onderwerp.",
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
    drag_word_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn, en gerelateerd aan het onderwerp.",

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
    blanks_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn, en gerelateerd aan het onderwerp.",

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
    mark_words_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn, en gerelateerd aan het onderwerp.",
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
"text": "<p>Wat is de datum van de Bestorming van de Bastille?</p>",
"answers": [
{ "text": "<p>14 juli 1789</p>", "iscorrect": 1 },
{ "text": "<p>4 augustus 1789</p>", "iscorrect": 0 },
{ "text": "<p>26 augustus 1789</p>", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
   qcm_prompt_generate_only_json: "Genereer alleen het geldige JSON-object, zonder enig commentaar.",

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
    h5p_true_false_description: "Maak eenvoudige vragen met een binair antwoord: waar of onwaar.",
    h5p_multiple_choice_name: "Meerkeuze",
    h5p_multiple_choice_description: "Maak meerkeuzevragen met een of meer juiste antwoorden.",
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
    moodle_xml_name: "XML Éléa/Moodle",
    moodle_xml_description: "Genereer een bank van 10 vragen voor een toetsactiviteit die klaar is om in XML-formaat geïmporteerd te worden.",
    moodle_xml_help: "Om een XML-bestand toe te voegen aan een ‘Toets’-activiteit in Moodle, maakt u eerst de activiteit aan. Open vervolgens het menu <strong>Meer</strong> en ga naar <strong>Vraagbank</strong>. Klik in dit menu op <strong>Importeren</strong>, kies het formaat <strong>Moodle XML</strong>, selecteer uw bestand en bevestig.",
    moodle_gift_name: "GIFT-formaat",
    moodle_gift_description: "Maak vragen in GIFT-formaat, een eenvoudige manier om vragen in Moodle te importeren.",
    moodle_millionnaire_name: "Miljonair",
    moodle_millionnaire_description: "Genereer een unieke 'Miljonair'-activiteit met 6 vragen die geleidelijk moeilijker worden.",
    moodle_appariement_name: "Koppelen",
    moodle_appariement_description: "Genereer een koppelactiviteit met 10 vragen.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Genereer een eenvoudige MCQ-activiteit.",

    // Dynamic content
    prompt_for_ia: "Prompt voor de AI",
    copy_prompt: "📋 Prompt kopiëren",
    go_duck: "🦆 Naar Duck.ai",
    go_mistral: "Ⓜ️ Naar Le Chat",
    create_h5p_file: "H5P-bestand maken",
    integrate_h5p_libraries: "H5P-bibliotheken integreren:",
    paste_ia_result: "Plak hieronder het AI-resultaat om uw module te maken.",
    generate_h5p: "H5P genereren",
    create_xml_file: "XML-bestand maken",
    paste_ia_result_xml: "Plak hieronder de door de AI gegenereerde XML.",
    generate_xml_file: "XML-bestand genereren",

    create_mbz_file_appariement: "Maak het bestand Koppelen (.mbz)",
    paste_ia_result_appariement: "Plak hieronder de door de AI gegenereerde JSON. De titel van de activiteit wordt automatisch uit de JSON gehaald.",
    generate_mbz_appariement: "Genereer de activiteit Koppelen (mbz)",
    create_mbz_file_millionnaire: "Maak het bestand Miljonair (.mbz)",
    paste_ia_result_millionnaire: "Plak hieronder de door de AI gegenereerde JSON. De titel van de activiteit wordt automatisch uit de JSON gehaald.",
    generate_mbz_millionnaire: "Genereer de activiteit Miljonair (mbz)",

    create_mbz_file_qcm: "Maak MCQ-bestand (.mbz)",
    paste_ia_result_qcm: "Plak hieronder de door de AI gegenereerde JSON. De titel van de activiteit wordt automatisch uit de JSON gehaald.",
    generate_mbz_qcm: "Genereer MCQ-activiteit (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "De Moodle-XML verschijnt hier...",
    paste_xml_placeholder: "Plak hier de volledige, door de AI gegenereerde XML...",

    // H5P empty text fields
    generate_prompts_placeholder: "De AI-prompt verschijnt hier zodra je op 'Prompts genereren' klikt.",
    paste_json_or_text: "Plak hier de JSON-inhoud of de door de AI gegenereerde tekst om je activiteit te maken.",

    // Notifications
    prompts_generated_successfully: "Prompts succesvol gegenereerd!",
    error_please_fill_fields: "Vul alle velden van de eenvoudige modus in.",
    error_please_fill_guided_fields: "Vul alle velden van de geleide modus in.",
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
    legal_app_description: "De webapplicatie 'Caramel' is een gratis, niet-commercieel project voor het maken van H5P-content. Er is geen account vereist, er worden geen persoonlijke gegevens verzameld en alle interacties vinden lokaal in de browser plaats.",
    legal_hosting_title: "Hosting",
    legal_host_name: "<strong>Host</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>Bedrijfsnaam</strong>: Ministerie van Nationaal Onderwijs en Jeugd",
    legal_host_address: "<strong>Adres</strong>: 110 rue de Grenelle, 75007 Parijs, Frankrijk",
    legal_host_phone: "<strong>Telefoon</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Publicatiedirecteur",
    legal_publication_director_name: "Gauthier REMANDE en Emmanuel GAUNARD, als vrijwillige redacteuren.",
    legal_terms_of_use_title: "Algemene gebruiksvoorwaarden",
    legal_terms_of_use_content: "Deze site stelt gebruikers in staat H5P-content te genereren. De weergave gebeurt lokaal, zonder overdracht van gebruikersgegevens. De gebruiker is als enige verantwoordelijk voor het gebruik van de gegenereerde content. De applicatie wordt gratis aangeboden, zonder enige garantie op werking of resultaat. De redacteur wijst alle verantwoordelijkheid af in geval van verkeerde interpretatie van de content of ongepast gebruik.",
    legal_intellectual_property_title: "Intellectueel eigendom",
    legal_intellectual_property_content: "Alle broncodes, grafische elementen en content vallen onder de vrije GNU AGPLv3-licentie. Hergebruik is toegestaan onder de voorwaarden van hun respectieve licenties. Elke herdistributie of wijziging moet de oorspronkelijke auteurs vermelden: Gauthier REMANDE en Emmanuel GAUNARD. De afbeeldingen die in de H5P-modules worden gebruikt, zijn afkomstig van H5P.org.",
    legal_personal_data_title: "Persoonlijke gegevens",
    legal_personal_data_content: "Er worden geen persoonlijke gegevens verzameld of opgeslagen. Er worden geen trackingcookies gebruikt. De sessiegeschiedenis wordt opgeslagen in de lokale browser van de gebruiker (localStorage), zonder overdracht. In overeenstemming met de AVG wordt er geen persoonlijke informatie doorgegeven aan de redacteur of aan derden.",
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
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn.",
    multiple_choice_prompt_content_rules_title: "**Regels voor de inhoud:**",
    multiple_choice_prompt_rule1: "1.  Er mag slechts één juist antwoord zijn (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Geef meerdere onjuiste antwoorden (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**JSON-voorbeeld:**",
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
    find_the_words_prompt_rule1: "1.  De `wordList` moet een enkele tekenreeks zijn met door komma's gescheiden woorden.",
    find_the_words_prompt_example_json_title: "**JSON-voorbeeld:**",
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
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Duidelijke instructies voor de activiteit.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Een array van tekenreeksen, die elk een te sorteren paragraaf vertegenwoordigen. De paragrafen moeten in de juiste volgorde staan.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn.",
    sort_the_paragraphs_prompt_content_rules_title: "**Inhoudsregels:**",
    sort_the_paragraphs_prompt_rule1: "1.  De `paragraphs`-array moet een lijst van paragrafen in de juiste logische volgorde bevatten.",
    sort_the_paragraphs_prompt_example_json_title: "**JSON-voorbeeld:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "<p>Mijn ochtendroutine:</p>",
"paragraphs": [
"<p>Eerst sta ik om 7:30 uur op</p>",
"<p>Daarna kleed ik me aan</p>",
"<p>Dan ontbijt ik</p>",
"<p>Vervolgens poets ik mijn tanden</p>",
"<p>Tot slot ga ik naar school</p>"
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
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: Een array van 6 objecten voor de eindfeedback, met scores van 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100. De tekst (`feedback`) moet welwillend, stapsgewijs en altijd bevestigend geformuleerd zijn.",
    single_choice_set_prompt_content_rules_title: "**Inhoudsregels:**",
    single_choice_set_prompt_rule1: "1. In elke `answers`-array is het eerste antwoord altijd het juiste.",
    single_choice_set_prompt_example_json_title: "**JSON-voorbeeld:**",
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
    dialog_cards_prompt_rule2: "2. Voeg geen afbeeldingen of geluiden toe.",
    dialog_cards_prompt_rule3: "",
    dialog_cards_prompt_example_json_title: "**JSON-voorbeeld:**",
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

    // Albert generation
    generate_with_albert: "Genereer met Albert",
    generation_in_progress: "Generatie wordt uitgevoerd, even geduld...",
    request_sent_to_ia: "Verzoek naar AI verzonden, even geduld...",
    generation_successful: "H5P-inhoud succesvol gegenereerd!",
    generation_failed_empty: "Generatie mislukt. Het antwoord was leeg.",
    generation_failed_error: "Fout tijdens generatie: {errorMessage}",

    // Albert models description
    albert_small_summary: "Snel, eenvoudig, geschikt voor snelle en gestructureerde oefeningen.",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "Krachtig, genuanceerd, ideaal voor complexe taken en schrijven.",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "Gespecialiseerd, nauwkeurig, ontworpen voor programmeren en code.",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "Bronmodel:",
    albert_model_parameters: "Modelgrootte:",
    albert_model_parameters_small: "8 miljard parameters",
    albert_model_parameters_large: "24 miljard parameters",
    albert_model_parameters_code: "32,5 miljard parameters",
    language: "Taal",
    tutorial: "Handleiding"
};
