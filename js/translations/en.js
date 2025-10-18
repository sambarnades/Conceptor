const translations_en = {
    subtitle: "Assisted Creation of Resources and Activities for Magistère and Éléa",
    help_button: "Help",
    help_modal_title: "🚀 Caramel Complete Guide for Teachers",
    help_modal_content: `
    <p>Welcome to <strong>Caramel</strong>! This guide is designed to walk you through step by step, even if you're just getting started. Our goal is to help you create interactive learning activities simply and efficiently.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Describe</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Choose</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generate</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Download</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Community</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> Our philosophy: you stay in control!</h4>
        <p>With Caramel, AI is an assistant—but you’re the pilot. You keep control at every stage:</p>
        <ul>
            <li><strong>Before:</strong> You define the pedagogical framework by filling in the description fields.</li>
            <li><strong>During:</strong> Once the AI generates the content (the JSON code), you can edit it directly in the editor to refine it.</li>
            <li><strong>After:</strong> Even after downloading the file, you can still open and edit it in other tools if needed.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Describe your need: the starting point</h4>
        <p>Everything starts here. The clearer your description, the more relevant the result. You have two options:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Quick Mode</span></h5>
            <p>Ideal to get straight to the point. Fill in two fields:</p>
            <ul>
                <li><strong>Who are you?</strong> Be direct. No full sentence needed. Examples: <em>Mathematics teacher</em>, <em>Academic trainer</em>.</li>
                <li><strong>What do you want to cover?</strong> This is the heart of your request. Be as complete as possible. Include topic, level, and constraints. Example: <em>An introduction to fractions for Grade 6 students, with concrete examples like sharing a cake.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Advanced Mode</span></h5>
            <p>For a more structured request, this mode provides precise fields:</p>
            <ul>
                <li><strong>Subject, Theme, Level:</strong> To define the context.</li>
                <li><strong>Number of items:</strong> Very important! This corresponds to the number of questions, dates on a timeline, words in a glossary, etc.</li>
                <li><strong>Additional information:</strong> A space to add specific instructions, constraints, or any other relevant details.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Enable document reading</span><br>
            This powerful option lets you base generation on content you provide. You can either <strong>copy-paste text</strong> or <strong>upload a PDF file</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacy:</strong> Rest assured, your document is processed <strong>entirely locally on your computer</strong>. No data is sent to the Internet.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Choose the activity type</h4>
        <p>Once the description is done, the activity tiles become available. Click the one that matches your pedagogical goal.</p>
        <details>
            <summary><strong>Click here to see the details of available activities</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Interactive activities in H5P format. Those marked with a star <span class="feedback-star">*</span> include detailed feedback by default across 6 score bands.</p>
            <ul>
                <li><strong>Timeline:</strong> Create an interactive timeline to present a sequence of events.</li>
                <li><strong>Flashcards:</strong> Create two-sided cards for memorization.</li>
                <li><strong>Quiz (Question Set) <span class="feedback-star">*</span>:</strong> Build a set of varied questions (MCQ, drag-and-drop, etc.).</li>
                <li><strong>Glossary:</strong> Create a glossary or FAQ as an accordion.</li>
                <li><strong>Crossword <span class="feedback-star">*</span>:</strong> Generate a crossword grid from definitions.</li>
                <li><strong>Writing <span class="feedback-star">*</span>:</strong> Offer a writing prompt with automated keyword-based correction.</li>
                <li><strong>Summary <span class="feedback-star">*</span>:</strong> Students reconstruct a correct summary by selecting the right sentences.</li>
                <li><strong>Drag the words <span class="feedback-star">*</span>:</strong> Create a text where students drag missing words.</li>
                <li><strong>Cloze (fill-in) <span class="feedback-star">*</span>:</strong> Students type the missing words.</li>
                <li><strong>Highlight words <span class="feedback-star">*</span>:</strong> Ask students to highlight specific words in a text.</li>
                <li><strong>True/False:</strong> Simple binary questions.</li>
                <li><strong>Multiple choice <span class="feedback-star">*</span>:</strong> Create MCQs with one or several correct answers.</li>
                <li><strong>Word search:</strong> Create a letter grid where students find words.</li>
                <li><strong>Order paragraphs <span class="feedback-star">*</span>:</strong> Students must reorder paragraphs.</li>
                <li><strong>Single-choice series <span class="feedback-star">*</span>:</strong> A series of questions with exactly one correct answer each.</li>
                <li><strong>Dialog cards:</strong> Interactive front/back cards with text and audio.</li>
                <li><strong>Advanced cloze <span class="feedback-star">*</span>:</strong> An advanced fill-in activity with specific feedback per error.</li>
                <li><strong>Chart:</strong> Create a pie or bar chart to visualize data.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Quiz (XML / GIFT):</strong> Generate a bank of varied questions (MCQ, matching, etc.) to import into a Moodle quiz.</li>
                <li><strong>MCQ (MBZ):</strong> Create a simple and fast multiple-choice activity.</li>
                <li><strong>Matching (MBZ):</strong> A pairing game between item pairs.</li>
                <li><strong>Millionaire (MBZ):</strong> A quiz game where difficulty increases with each question.</li>
                <li><strong>Glossary (XML):</strong> Provide a file to import a list of definitions into a Moodle glossary.</li>
                <li><strong>Page (MBZ / HTML):</strong> Build a structured, visually formatted course page for Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Generate and refine the content</h4>
        <p>After clicking a tile, a window opens. This is where you interact with the AI.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Option A: One-click generation</h5>
            <p>The fast lane. Click <button class="help-btn-example-albert">Generate in one click</button> to have the AI produce the content and place it directly in the result area on the right. You can choose between different AI models (fast, powerful, …) via the small arrow on the button’s right side.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Option B: Use an external AI</h5>
            <p>For maximum control. The prompt (instruction for the AI) appears on the left.</p>
            <ol>
                <li>Edit the prompt if you wish.</li>
                <li>Use the <strong>Copy prompt</strong> button and open a public AI service of your choice in a new tab.</li>
                <li>Paste the prompt into the AI, retrieve its output, and paste it into the result area on the right in Caramel.</li>
            </ol>
            <p>Helpful icons are there for you: <span class="help-badge-icon"><i class="fas fa-expand"></i> Full screen</span> for comfort, and <span class="help-badge-icon"><i class="fas fa-lock"></i> Lock</span> to protect the prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Download and integrate your activity</h4>
        <p>Once the content is ready, click the download button (e.g., <button class="help-btn-example-download">Generate the H5P</button>). Here’s how to integrate files into Éléa/Moodle:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (H5P activities)</summary>
                <div class="import-content">
                    <ul>
                        <li><strong>Simple method:</strong> Enable editing in your course, then drag and drop the .h5p file directly into the desired section. Ideal for quick use without complex sharing.</li>
                        <li><strong>Recommended method (for designers):</strong> Click “Add an activity or resource”, choose “Interactive Content (H5P)”, then upload your .h5p in the “File” field. This ensures the activity is correctly included if you share your course.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Page, Millionaire, Matching, MCQ)</summary>
                <div class="import-content">
                    <p>This format imports a complete activity into your course.</p>
                    <ol>
                        <li>In your course, go to the settings (gear) menu and click “Restore”.</li>
                        <li>Drag and drop your .mbz file into the import area.</li>
                        <li>Follow the steps by clicking “Continue”. The activity will be added to your course.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> and <span class="help-badge-file">GIFT</span> (Quiz activity)</summary>
                <div class="import-content">
                    <p>These formats import questions into your “Question bank”.</p>
                    <ol>
                        <li>Go to the “More” menu in your course, then “Question bank”.</li>
                        <li>Click the “Import” tab.</li>
                        <li>Choose “Moodle XML format” or “GIFT format”.</li>
                        <li>Drag and drop your file into the “Import” area and confirm.</li>
                        <li>Your questions are now in the bank, ready to be added to a “Quiz”.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Alternative for the Page activity)</summary>
                <div class="import-content">
                    <p>For manual control over the content.</p>
                    <ol>
                        <li>Open the .html file with a text editor (e.g., Notepad) and copy all its content.</li>
                        <li>In Éléa, add a “Page” activity.</li>
                        <li>In the page’s text editor, click the icon to switch to HTML mode (often represented by \`</\>\`).</li>
                        <li>Paste the copied content, then save.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Community & Support</h4>
        <p>Caramel is a living project, and your feedback is invaluable!</p>
        <ul>
            <li><strong>Discuss & Ask:</strong> Join us on the <a href="https://tchap.beta.gouv.fr/#/room/#Caramel:agent.dinum.tchap.gouv.fr" target="_blank" rel="noopener noreferrer">Tchap</a> room to connect with the community.</li>
            <li><strong>Report a bug:</strong> Found an issue? Open an <a href="https://github.com/g-rem/caramel/issues" target="_blank" rel="noopener noreferrer">issue</a>. If possible, attach the JSON file that caused the error—it helps a lot.</li>
            <li><strong>Support the project:</strong> If you like the tool, leave us a star on the <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">Forge page</a>. It’s our best reward!</li>
        </ul>
    </div>
    `,
    fast_mode: "Fast Mode",
    guided_mode: "Advanced Mode",
    who_are_you: "Who are you? (e.g., Teacher, trainer...)",
    what_to_address: "What do you want to address? (e.g., The nature of an angle in 6th grade...)",
    discipline: "Discipline (e.g., History)",
    theme: "Theme (e.g., The French Revolution)",
    level: "Level (e.g., Second year of vocational high school)",
    number_of_elements: "Number of elements (e.g., 10)",
    additional_info: "Additional information...",
    generate_prompts: "Generate prompts",
    h5p_tab: "H5P",
    moodle_tab: "Éléa/Moodle Modules",

    // General Context (Advanced Mode)
    prompt_expert_intro: "You are an expert professor in pedagogy who will adapt the tone and vocabulary according to the content of current programs and the level of students for the course of ",
    prompt_context_title: "**Context :**",
    prompt_subject: "- **Subject :**",
    prompt_student_level: "- **Student Level :**",
    prompt_theme: "- **Theme :**",
    prompt_number_of_elements: "- **Number of elements :**",
    prompt_additional_info: "- **Additional information :**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "I am a **",
    prompt_simple_intro_part2: "** and I want to **",
    prompt_language_instruction: "The generated content must be in English, unless another language is specified in the request.",
    prompt_code_block_instruction: "You must generate the result in a code block.",

    // Timeline Prompt
    timeline_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Timeline\" activity.",
    timeline_prompt_mission: "**Your mission :**",
    timeline_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Timeline activity. The JSON must be directly usable.",
    timeline_prompt_json_structure_title: "**Expected JSON structure :**",
    timeline_prompt_json_structure_main_object: "The main object must contain a \"timeline\" key. This \"timeline\" object must include :",
    timeline_prompt_headline: "`headline`: A general title for the timeline.",
    timeline_prompt_text: "`text`: A short introductory paragraph.",
    timeline_prompt_asset: "`asset`: An object for the cover image with `media` (URL), `caption` (caption) and `credit` (source).",
    timeline_prompt_date_array: "`date`: An array containing ${nombreQuestions} objects, each representing an event.",
    timeline_prompt_era_array: "`era`: An array of objects to define periods covering several events.",
    timeline_prompt_content_rules_title: "**Content rules :**",
    timeline_prompt_rule1: "1.  Each event in the `date` array must have :",
    timeline_prompt_rule1_startDate: "-   `startDate` and `endDate`: Date in \"YYYY,MM,DD\" or \"YYYY\" format. Use `endDate` to define a period.",
    timeline_prompt_rule1_headline: "-   `headline`: Event title.",
    timeline_prompt_rule1_text: "-   `text`: Text description. Use `*word*` for bold, `**word**` for italics, and `\\n` for line breaks.",
    timeline_prompt_rule1_asset: "-   `asset`: An optional object for an image illustrating the event.",
    timeline_prompt_rule1_tag: "- `tag`: A keyword that characterizes the period (e.g., 'history', 'science').",
    timeline_prompt_rule2: "2.  For each `asset`, actively search for a relevant, royalty-free image (e.g., Wikimedia Commons). The URL in `media` must be a direct and valid link. Provide the source and license in `credit`. If no suitable image is found, omit the `asset` object entirely.",
    timeline_prompt_rule3: "3.  For each period (`era`), add a `text` field with a brief description and a `tag`.",
    timeline_prompt_example_json_title: "**Example JSON structure :**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Title of the timeline",
"text": "Introduction to the theme of the timeline.",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Beginning of the First World War",
"text": "Austria-Hungary declares war on Serbia.",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "Archduke Franz Ferdinand just before his assassination.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "War"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Armistice of 1918",
"text": "Signing of the armistice at Rethondes, marking the end of the fighting.",
"tag": "Treaty"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "First World War",
"text": "This is the period of the Great War.",
"tag": "Historical period"
}
]
}
}
\`\`\` `,   
    timeline_prompt_generate_only_json: "Generate only the valid JSON code, without any comments. The result will be directly used by another tool.",

    // Crossword Prompt
    crossword_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Crossword\" activity.",
    crossword_prompt_mission: "**Your mission :**",
    crossword_prompt_generate_json: "Generate a complete and valid JSON object for an H5P crossword activity.",
    crossword_prompt_json_structure_title: "**Expected JSON structure :**",
    crossword_prompt_json_structure_main_object: "The object must contain :",
    crossword_prompt_title: "`title`: A title for the activity.",
    crossword_prompt_words_array: "`words`: An array of ${nombreQuestions} objects, each with :",
    crossword_prompt_answer: "`answer`: The word to guess.",
    crossword_prompt_clue: "`clue`: The corresponding definition. Do not write the target word in the clue.",
    crossword_prompt_extra_clue_optional: "`extraClue` (optional): An object containing an additional hint. The hint text may use `*word*` for bold, `**word**` for italics, and `\\n` for line breaks. The AI must judge whether adding a hint is relevant.",
    crossword_prompt_task_description: "`taskDescription`: A clear, contextualized instruction. Use `*word*` for bold, `**word**` for italics, and `\\n` for line breaks. After a line break, specify the compound-word rule: \"Write compound words as a single word with no spaces or hyphens.\"",
    crossword_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",
    crossword_prompt_content_rules_title: "**Content rules:**",
    crossword_prompt_rule1: "1.  STRICT RULE: Answers (`answer`) must contain letters only. Any compound, acronym, or expression is merged into a single word with no spaces, hyphens, or other characters.",
    crossword_prompt_rule2: "2.  Definitions (`clue`) must be short and precise.",
    crossword_prompt_rule3: "3.  The rest of the JSON structure (behavior, theme, etc.) must be kept as is.",
    crossword_prompt_example_json_title: "**Example JSON for a word :**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Biology Crossword",
"words": [
{
"answer": "Cell",
"clue": "Basic unit of life.",
"extraClue": {
"params": {
"text": "It can be *animal* or *plant*."
}
}
},
{
"answer": "DNA",
"clue": "Molecule carrying genetic information."
}
],
"taskDescription": "*Complete* the **crossword**."
}
\`\`\` `,
    crossword_prompt_generate_only_json: "Generate the complete and valid JSON, filling in the title, description and the \"words\" array, without any other comments.",

    // Crossword UI translations
    crossword_across: "Across",
    crossword_down: "Down",
    crossword_check_answer: "Check",
    crossword_try_again: "Retry",
    crossword_show_solution: "Show solution",
    crossword_extra_clue: "Extra clue",
    crossword_close_window: "Close window",
    crossword_submit_answer: "Submit",

    // Essay Prompt
    essay_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Essay\" activity.",
    essay_prompt_mission: "**Your mission :**",
    essay_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Essay activity.",
    essay_prompt_json_structure_title: "**Expected JSON structure :**",
    essay_prompt_json_structure_main_object: "The object must contain :",
    essay_prompt_task_description: "`taskDescription`: Clear instructions inviting the student to write a text on the theme. Use `*word*` for bold, `**word**` for italics, and `\\n` for line breaks.",
    essay_prompt_keywords_array: "`keywords`: An array of ${nombreQuestions} objects, each defining a keyword that the system should find in the student's answer.",
    essay_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",
    essay_prompt_content_rules_title: "**Content rules :**",
    essay_prompt_rule1: "1.  Each object in `keywords` must contain the `keyword` key with the word to search for.",
    essay_prompt_rule2: "2.  Keywords must be relevant and essential for evaluating understanding of the theme.",
    essay_prompt_rule3: "3.  The JSON structure (behavior, etc.) must be kept.",
    essay_prompt_rule4: "4. The instruction (`taskDescription`) should encourage writing without using the keywords listed in `keywords`, except for the theme name if necessary for comprehension.",
    essay_prompt_example_json_title: "**Example JSON for a keyword :**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "Write a short text explaining photosynthesis.",
"keywords": [
{
"keyword": "light",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "chlorophyll",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "Generate the complete and valid JSON, filling in the instructions and the list of keywords, without any other comments.",

    // Moodle XML Prompt
    moodle_xml_prompt_role: "You are an instructional design expert. Your mission is to create the content of a Test activity with its Moodle/Éléa question bank by generating a valid JSON object.",
    moodle_xml_prompt_intro: "I want to create a quiz with ${nombreQuestions} questions.",
    moodle_xml_prompt_content_title: "**Content rules:**",
    moodle_xml_prompt_content_rule1: "- Incorrect answers must be plausible yet wrong.",
    moodle_xml_prompt_content_rule2: "- Vary the difficulty of the questions.",
    moodle_xml_prompt_content_rule3: "- Wording must be simple and precise.",
    moodle_xml_prompt_content_rule4: "- Feedback must briefly explain the correct answer.",
    moodle_xml_prompt_question_types_intro: "**Expected JSON structure:**\nThe main object must include the following keys:\n- `bank_name`: A short, descriptive name for the question bank.\n- `bank_description`: One sentence describing the bank’s content.\n- `questions`: An array of objects where each object represents a question and must have `type` and `content`.",
    moodle_xml_prompt_question_type_multichoice: `
- **For the \`multichoice\` type (MCQ):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Question title",
      "questiontext": "Question prompt.",
      "feedback": "General feedback.",
      "answers": [
        { "text": "Answer 1", "fraction": 100, "feedback": "Feedback if chosen." },
        { "text": "Answer 2", "fraction": 0, "feedback": "Feedback if chosen." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_matching: `
- **For the \`matching\` type (Matching):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Question title",
      "questiontext": "Question prompt.",
      "feedback": "General feedback.",
      "subquestions": [
        { "text": "Question text 1", "answer": "Answer 1" },
        { "text": "Question text 2", "answer": "Answer 2" }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_numerical: `
- **For the \`numerical\` type (Numerical):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Question title",
      "questiontext": "Question prompt.",
      "feedback": "General feedback.",
      "answer": { "number": 12.34, "tolerance": 0.1, "feedback": "Feedback for the answer." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_truefalse: `
- **For the \`truefalse\` type (True/False):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Question title",
      "questiontext": "Question prompt.",
      "feedback": "General feedback.",
      "answer": { "value": true, "feedback_true": "Feedback if True.", "feedback_false": "Feedback if False." }
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_shortanswer: `
- **For the \`shortanswer\` type (Short answer):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Question title",
      "questiontext": "Question prompt.",
      "feedback": "General feedback.",
      "answers": [
        { "text": "Exact answer 1", "fraction": 100, "feedback": "Feedback if chosen." },
        { "text": "Alternative answer", "fraction": 100, "feedback": "Feedback if chosen." }
      ]
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_question_type_cloze: `
- **For the \`cloze\` type (Fill-in-the-blanks):**
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Question title",
      "questiontext": "This is a text with a gap {1:SHORTANSWER:=Correct answer~Feedback} and another {1:MULTICHOICE:=Correct answer~Wrong answer}.",
      "feedback": "General feedback."
    }
  }
  \`\`\`
`,
    moodle_xml_prompt_form_title: "**Final instructions:**",
    moodle_xml_prompt_form_rule1: "Distribute the questions evenly across the different types.",
    moodle_xml_prompt_generate_only_json: "Generate only valid JSON code, with no comments. The result must be a single JSON object containing the `questions` key.",

    // Éléa test creation
    moodle_xml_success_generation: "File {fileName} generated successfully!",
    test_error_creation_mbz: "Error while creating the MBZ for the test:",
    test_success_generation: "File {fileName} generated successfully!",
    test_error_generic: "Error:",
    test_backup_log: "Backup automatically created by Caramel\n",

    // GIFT Prompt
    gift_prompt_role: "You are an expert in pedagogical engineering creating a question bank for a Moodle/Éléa Test activity in GIFT format.",
    gift_prompt_intro: "I want to create a quiz of ${nombreQuestions} questions.",
    gift_prompt_format_info: "The quiz must be in GIFT format, intended for import into Moodle.",
    gift_prompt_question_quality: "Each question must be clear, concise, unambiguous. It must have detailed feedback.",
    gift_prompt_code_format_intro: "The code must be in exactly the same format as the one provided below:",
    gift_prompt_example_question_comment: "// question: 1  name: What is the central object of our solar system ?",
    gift_prompt_example_question_text: "::What is the central object of our solar system ?::What is the central object of our solar system ?{",
    gift_prompt_example_answer_correct: "=The Sun#Exact! The Sun is the central star of our solar system. Well done!",
    gift_prompt_example_answer_incorrect1: "~The Moon#False. The Moon is a natural satellite of the Earth. The Sun is the central object.",
    gift_prompt_example_answer_incorrect2: "~Jupiter#False. Jupiter is a gas giant planet. The Sun is the central object.",
    gift_prompt_example_answer_incorrect3: "~The Earth#False. The Earth is the planet where we live. The Sun is the central object.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "The quiz must include different types of questions randomly :",
    gift_prompt_question_type_multichoice: "- multiple choice questions (MCQ), with 1 correct answer and 3 distractors.",
    gift_prompt_question_type_truefalse: "- true/false questions (truefalse).",
    gift_prompt_question_type_numerical: "- numerical questions (numerical) with an acceptable margin of error.",
    gift_prompt_question_type_matching: "- matching questions (matching) with at least 4 pairs.",
    gift_prompt_generate_only_gift: "Generate the quiz directly in GIFT format, without comments or additional tags. Strictly respect the described format, as I will paste the result into another tool that expects this format. Produce the response in preformatted code.",

    // Flashcards Prompt
    flashcards_prompt_role: "You are an expert in instructional design creating an H5P 'Flashcards' activity.",
    flashcards_prompt_mission: "**Your mission:**",
    flashcards_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Flashcards activity. The JSON must be directly usable.",
    flashcards_prompt_json_structure_title: "**Expected JSON structure:**",
    flashcards_prompt_json_structure_main_object: "The object must contain:",
    flashcards_prompt_title: "`title`: A relevant title for the activity.",
    flashcards_prompt_description: "`description`: A clear instruction for the student.",
    flashcards_prompt_association_principle: "The front and back must be linked by a single, consistent criterion (e.g.: definition→term, figure→number of sides, event→date, author→work). Use the same relation for all cards and phrase the instruction like: “Match each X to Y.” Answers (`answer`) should be normalized: a simple word or number, lowercase, no article or punctuation; numbers in digits.",
    flashcards_prompt_cards_array: "`cards`: An array of ${nombreQuestions} objects, where each object represents a card and contains:",
    flashcards_prompt_text: "`text`: The question or term to guess (front).",
    flashcards_prompt_answer: "`answer`: The answer or definition (back). Important: `answer` can only contain one simple word or number, not compound or separated words.",
    flashcards_prompt_tip: "`tip` (optional): A hint to help the student if the question is difficult. Add a hint only if relevant.",
    flashcards_prompt_tip_formatting: "For hints (`tip`), you can use `*word*` for bold and `**word**` for italics to emphasize key information.",
    flashcards_prompt_example_json_title: "**Example JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "The Capitals of Europe",
"description": "Memorize the capital of each country. Click on the card to see the answer.",
"cards": [
{
"text": "The capital of France",
"answer": "Paris"
},
{
"text": "The capital of the Netherlands",
"answer": "Amsterdam",
"tip": "<p>It is the city of <strong>canals</strong> and tulips!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // QuizSet Prompt
    quiz_set_prompt_role: "You are an expert in pedagogical engineering creating content for an \"H5P Quiz (Question Set)\" activity.",
    quiz_set_prompt_mission: "**Your mission :**",
    quiz_set_prompt_generate_json: "Generate a JSON object **only for the content** of an H5P quiz. The JSON must be directly usable as a `content.json` file.",
    quiz_set_prompt_json_structure_title: "**Expected JSON structure :**",
    quiz_set_prompt_json_structure_main_object: "The main object must contain the following keys :",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: An array of ${nombreQuestions} objects, each representing a question.",
    quiz_set_prompt_content_rules_title: "**Rules for question content :**",
    quiz_set_prompt_rule1: "1.  Each question object must have the keys `library`, `params`, and `subContentId`.",
    quiz_set_prompt_rule2: "2.  **Structure:** Each question must be an object with the keys `library`, `metadata` and `params`.",
    quiz_set_prompt_rule3: "3.  Vary the types of questions. Use the following libraries with their exact versions :",
    quiz_set_prompt_rule4: "4.  **Feedback (CRUCIAL RULE):** For **all question types** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), you **must** generate an `overallFeedback` with exactly 6 score ranges: 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. For `TrueFalse` questions, also add the `feedbackOnCorrect` and `feedbackOnWrong` fields. The feedback must be benevolent, gradual, and always phrased affirmatively.",
    quiz_set_prompt_rule5: "5.  **Content:** The content in `params` must be pedagogically relevant, with plausible distractors for MCQs and coherent texts for other activities.",
    quiz_set_prompt_rule6: "6.  **Simplicity:** Do not add images or superfluous behavior parameters. Keep the structure simple as in the examples.",
    quiz_set_prompt_example_json_title: "**Example structures for each authorized question type:**",
    quiz_set_example_true_false: "True/False :",
    quiz_set_example_multiple_choice: "Multiple Choice (MCQ) :",
    quiz_set_example_fill_in_the_blanks: "Fill in the Blanks :",
    quiz_set_example_drag_the_words: "Drag the Words :",
    quiz_set_example_mark_the_words: "Mark the Words :",
    quiz_set_example_essay: "Essay :",
    quiz_set_prompt_generate_only_json: "Generate only the valid JSON, starting with `{\"progressType\": \"dots\", ...}`, without any comments.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Title of the True/False question" },
        "params": {
            "question": "Is France a country?",
            "correct": "true",
            "feedbackOnCorrect": "That's correct! France is indeed a country.",
            "feedbackOnWrong": "Incorrect. France is internationally recognized as a country.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Title of the MCQ" },
        "params": {
            "question": "What is the capital of France?",
            "answers": [
                { "text": "Paris", "correct": true },
                { "text": "Berlin", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "Title of the fill-in-the-blanks" },
        "params": {
            "questions": ["Paris is the *capital* of France."],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "Title of the drag the words activity" },
        "params": {
            "taskDescription": "Complete the sentence.",
            "textField": "*Paris* is the capital of France.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "Title of the mark the words activity" },
        "params": {
            "taskDescription": "Highlight the capital city.",
            "textField": "The capital of France is *Paris*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "Title of the essay" },
        "params": {
            "taskDescription": "What is the capital of France?",
            "keywords": [
                { "keyword": "Paris", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
                { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
                { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
                { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
                { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
                { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Accordion\" activity.",
    glossary_prompt_mission: "**Your mission :**",
    glossary_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Accordion glossary.",
    glossary_prompt_json_structure_title: "**Expected JSON structure :**",
    glossary_prompt_json_structure_main_object: "Generate an array of ${nombreQuestions} JSON objects.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: The word or expression to define.",
    glossary_prompt_content: "`text`: The definition. Use `*word*` for bold, `**word**` for italics, and `\\n` for line breaks.",
    glossary_prompt_content_rules_title: "**Content rules:**",
    glossary_prompt_rule1: "1.  Definitions must be clear, concise, and adapted to the students' level.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Example JSON for an entry :**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Photosynthesis",
"text": "Process by which green plants transform sunlight into energy."
},
{
"title": "Cell",
"text": "Basic unit of all living beings."
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // Summary Prompt
    summary_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Summary\" activity.",
    summary_prompt_mission: "**Your mission :**",
    summary_prompt_generate_json: "Generate a complete JSON object for an H5P Summary activity.",
    summary_prompt_json_structure_title: "**Expected JSON structure :**",
    summary_prompt_json_structure_main_object: "The object must contain the following keys:",
    summary_prompt_intro_field: "`intro`: An introductory sentence for the activity (e.g., \"Choose the correct statement.\").",
    summary_prompt_summaries_array: "`summaries`: An array of ${nombreQuestions} objects, each representing a summary step.",
    summary_prompt_summary_object: "Each object in `summaries` must contain:",
    summary_prompt_summary_array: "- `summary`: An array of sentences.",
    summary_prompt_tip_field: "- `tip` (optional but recommended): A hint to help the student.",
    summary_prompt_content_rules_title: "**Content rules :**",
    summary_prompt_rule1: "1.  In each \"summary\" array, the **first sentence is correct**.",
    summary_prompt_rule2: "2.  Subsequent sentences are plausible but incorrect distractors.",
    summary_prompt_rule3: "3.  All correct sentences must form a coherent summary.",
    summary_prompt_example_json_title: "**Example JSON for a step :**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "This is the correct sentence.",
    "This is a distractor.",
    "This is another distractor."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",
    summary_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // Summary UI translations
    summary_intro: "Choose the correct statement.",
    summary_solved_label: "Progress:",
    summary_score_label: "Wrong answers:",
    summary_result_label: "Your result",
    summary_feedback: "You got @score of @total statements (@percent %) correct.",
    summary_label_correct: "Correct.",
    summary_label_incorrect: "Incorrect! Please try again.",
    summary_label_correct_answers: "Correct answers.",
    summary_tip_button_label: "Show tip",
    summary_score_bar_label: "You got :num out of :total points",
    summary_progress_text: "Progress :num of :total",
    summary_alternative_incorrect_label: "Incorrect",

    // Drag the Words Prompt
    drag_word_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Drag the Words\" activity.",
    drag_word_prompt_mission: "**Your mission :**",
    drag_word_prompt_generate_json: "Generate a complete JSON object for an H5P Drag the Words activity.",
    drag_word_prompt_json_structure_title: "**Expected JSON structure :**",
    drag_word_prompt_json_structure_main_object: "The object must contain :",
    drag_word_prompt_task_description: "`taskDescription`: Clear instructions.",
    drag_word_prompt_text_field: "`textField`: The text to complete. Each sentence should end with a line break `\\n`.",
    drag_word_prompt_content_rules_title: "**Content rules :**",
    drag_word_prompt_rule1: "1.  Create a coherent text on the theme, with short sentences ending with `\\n`.",
    drag_word_prompt_rule2: "2.  Draggable words are enclosed in asterisks. You can add a tip with `:my tip` and feedback with `\\+correct feedback \\-incorrect feedback`.",
    drag_word_prompt_example_json_title: "**Example JSON :**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Complete the text by dragging the words.",
"textField": "The *solar system* is made up of *eight* planets that orbit the *Sun*."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",

    // Drag the Words UI translations
    drag_words_check_answer: "Check",
    drag_words_try_again: "Retry",
    drag_words_show_solution: "Show Solution",
    drag_words_score_feedback: "Score: @score of @total.",
    drag_words_tip_label: "Show tip",
    drag_words_correct_text: "Correct!",
    drag_words_incorrect_text: "Incorrect!",
    drag_words_score_bar_label: "You got :num out of :total points",
    drag_words_submit_answer: "Submit",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Fill in the Blanks\" activity.",
    blanks_prompt_mission: "**Your mission :**",
    blanks_prompt_generate_json: "Generate a complete JSON object for an H5P Fill in the Blanks activity.",
    blanks_prompt_json_structure_title: "**Expected JSON structure :**",
    blanks_prompt_json_structure_main_object: "The object must contain a `questions` key, which is an array of strings. Each string represents a text block to complete.",
    blanks_prompt_content_rules_title: "**Content rules :**",
    blanks_prompt_rule1: "-   Words to guess are enclosed in asterisks (*word*).",
    blanks_prompt_rule2: "-   For alternative answers, use a slash: *Paris/City of Light*.",
    blanks_prompt_rule3: "-   To add a tooltip, use a colon: *open-source:Public source code*.",
    blanks_prompt_example_json_title: "**Example JSON :**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"The solar system has *eight* planets. The largest is *Jupiter*.",
"The capital of France is *Paris/City of Light*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",
    blanks_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Show solutions",
    blanks_try_again: "Try again",
    blanks_check_answer: "Check",
    blanks_not_filled_out: "Please fill in all blanks.",
    blanks_answer_is_correct: "'':ans' is correct",
    blanks_answer_is_wrong: "'':ans' is wrong",
    blanks_answered_correctly: "Answered correctly",
    blanks_answered_incorrectly: "Answered incorrectly",
    blanks_solution_label: "Correct answer:",
    blanks_input_label: "Blank input @num of @total",
    blanks_input_has_tip_label: "Tip available",
    blanks_tip_label: "Tip",
    blanks_score_bar_label: "You got :num out of :total points",
    blanks_submit_answer: "Submit",
    blanks_feedback: "You got @score of @total blanks correct.",
    blanks_finish_header: "Finish?",
    blanks_finish_body: "Are you sure you wish to finish?",
    blanks_cancel_label: "Cancel",
    blanks_finish_label: "Finish",
    blanks_retry_header: "Retry?",
    blanks_retry_body: "Are you sure you wish to retry?",
    blanks_retry_confirm_label: "Confirm",
    blanks_checking_mode_header: "Checking mode",
    blanks_a11y_check: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
    blanks_a11y_show_solution: "Show the solution. The task will be marked with its correct solution.",
    blanks_a11y_retry: "Retry the task. Reset all responses and start the task over again.",

    // Mark the Words Prompt
    mark_words_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Mark the Words\" activity.",
    mark_words_prompt_mission: "**Your mission :**",
    mark_words_prompt_generate_json: "Generate a complete JSON object for an H5P Mark the Words activity.",
    mark_words_prompt_json_structure_title: "**Expected JSON structure :**",
    mark_words_prompt_json_structure_main_object: "The object must contain :",
    mark_words_prompt_task_description: "`taskDescription`: Clear instructions.",
    mark_words_prompt_text_field: "`textField`: The text where words to mark are enclosed in asterisks (*word*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",
    mark_words_prompt_content_rules_title: "**Content rules :**",
    mark_words_prompt_rule1: "1.  Create a relevant paragraph on the theme.",
    mark_words_prompt_rule2: "2.  Identify approximately ${nombreQuestions} important keywords to mark.",
    mark_words_prompt_rule3: "3.  Each word to be marked must be individually enclosed in asterisks. For example, `*word1* *word2*` is correct, but `*word1 word2*` is not.",
    mark_words_prompt_rule4: "4.  Apostrophes or other punctuation marks must not be attached to the marked words. For example, `it's*` is incorrect; it should be written as `it's *a*` for it to work.",
    mark_words_prompt_example_json_title: "**Example JSON :**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Click on the important words in the text.",
"textField": "The *solar* *system* is made up of *eight* planets that orbit the *Sun*."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // Mark the Words UI translations
    mark_words_check_answer: "Check",
    mark_words_try_again: "Retry",
    mark_words_show_solution: "Show solution",
    mark_words_correct_answer: "Correct!",
    mark_words_incorrect_answer: "Incorrect!",
    mark_words_missed_answer: "Missed!",
    mark_words_display_solution_description: "Task is updated to contain the solution.",
    mark_words_score_bar_label: "You got :num out of :total points",
    mark_words_submit_answer: "Submit",
    mark_words_a11y_full_text_label: "Full readable text",
    mark_words_a11y_clickable_text_label: "Full text where words can be marked",
    mark_words_a11y_solution_mode_header: "Solution mode",
    mark_words_a11y_checking_header: "Checking mode",
    mark_words_a11y_check: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
    mark_words_a11y_show_solution: "Show the solution. The task will be marked with its correct solution.",
    mark_words_a11y_retry: "Retry the task. Reset all responses and start the task over again.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "The compression libraries (Tar.js or fflate) are not loaded. Please check your internet connection or refresh the page.",
    millionnaire_error_invalid_json: "The JSON structure is invalid. Make sure it includes a 'title' and a 'questions' array with 6 questions matching the example.",
    millionnaire_activity_intro: "Take part in this game to test your knowledge.",
    millionnaire_backup_log: "Backup automatically created by Caramel\n",
    millionnaire_success_generation: "File {fileName} generated successfully!",
    millionnaire_error_creation_mbz: "Error while creating MBZ file:",
    millionnaire_error_generic: "Error:",

    // Millionnaire Prompt
    millionnaire_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Millionnaire\" activity.",
    millionnaire_prompt_num_questions: "**Number of questions :** 6",
    millionnaire_prompt_mission: "**Your mission :**",
    millionnaire_prompt_generate_json: "Generate a JSON object containing a title and a list of **6 questions** for a \"Who Wants to Be a Millionaire\" type game.",
    millionnaire_prompt_important_rules_title: "**Important rules :**",
    millionnaire_prompt_rule1: "1.  The `title` must be a relevant and engaging title for the activity.",
    millionnaire_prompt_rule2: "2.  The difficulty of the questions in the `questions` array must be **increasing and pedagogical**, adapted to the students' level. The first question must be very easy, the last very difficult.",
    millionnaire_prompt_rule3: "3.  The content must be rigorously accurate and relevant to the theme and academic level.",
    millionnaire_prompt_json_structure_title: "**Expected JSON structure :**",
    millionnaire_prompt_main_object: "A main object with two keys :",
    millionnaire_prompt_title: "- `title`: The activity title (string).",
    millionnaire_prompt_questions_array: "- `questions`: An array of 6 objects, where each object represents a question and contains :",
    millionnaire_prompt_question: "- `question`: The question (string).",
    millionnaire_prompt_good_answer: "- `goodanswer`: The correct answer (string).",
    millionnaire_prompt_bad_answer: "- `badanswer`: An array of 3 incorrect answers (strings).",
    millionnaire_prompt_example_json_title: "**Example JSON :**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "Quiz on the French Revolution",
"questions": [
{
"question": "What is the capital of France?",
"goodanswer": "Paris",
"badanswer": ["Berlin", "London", "Madrid"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Generate only the valid JSON object, without any other comments.",

    // Appariement Prompt
    appariement_prompt_role: "You are an instructional design expert creating a Moodle \"Matching\" activity.",
    appariement_prompt_num_questions: "**Number of pairs:** 10",
    appariement_prompt_mission: "**Your mission:**",
    appariement_prompt_generate_json: "Generate a JSON object containing a title and a list of **10 pairs** for a matching game.",
    appariement_prompt_important_rules_title: "**Important rules:**",
    appariement_prompt_rule1: "1.  The `title` must be a relevant and engaging title for the activity.",
    appariement_prompt_rule2: "2.  The `pairs` array must contain 10 objects, each with a `question` (the left item) and an `answer` (the right item to match).",
    appariement_prompt_rule3: "3.  The content must be rigorously accurate and appropriate to the theme and school level.",
    appariement_prompt_json_structure_title: "**Expected JSON structure:**",
    appariement_prompt_main_object: "A main object with two keys:",
    appariement_prompt_title: "- `title`: The activity title (string).",
    appariement_prompt_pairs_array: "- `pairs`: An array of 10 objects, where each object represents a pair and contains:",
    appariement_prompt_question: "- `question`: The term or image on the left (string).",
    appariement_prompt_answer: "- `answer`: The definition or corresponding term on the right (string).",
    appariement_prompt_example_json_title: "**Example JSON:**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Matching on the French Revolution",
"pairs": [
{
"question": "Storming of the Bastille",
"answer": "July 14, 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "Generate only the valid JSON object, with no comments.",

   // Matching Creation
   appariement_error_invalid_json: "The JSON structure is invalid. Make sure it contains a 'title' and a 'pairs' array where each pair has a 'question' and an 'answer'.",
   appariement_activity_intro: "Find the matching pairs.",
   appariement_success_generation: "File {fileName} generated successfully !",
   appariement_error_creation_mbz: "Error while creating the MBZ for matching:",

    // QCM Prompt
    qcm_prompt_role: "You are an instructional design expert creating a Moodle \"MCQ\" activity.",
    qcm_prompt_num_questions: "**Number of questions:** 10",
    qcm_prompt_mission: "**Your mission:**",
    qcm_prompt_generate_json: "Generate a JSON object containing a title and a list of **10 questions** for an MCQ.",
    qcm_prompt_important_rules_title: "**Important rules:**",
    qcm_prompt_rule1: "1.  The `title` must be a relevant and engaging title for the activity.",
    qcm_prompt_rule2: "2.  The `questions` array must contain 10 objects, each with a `text` (the question wording) and an `answers` array.",
    qcm_prompt_rule3: "3.  Each `answers` array must contain several possible answers. Each answer is an object with `text` and `iscorrect` (1 for true, 0 for false). Depending on the context of the question, you can propose questions with a single correct answer or with multiple correct answers.",
    qcm_prompt_json_structure_title: "**Expected JSON structure:**",
    qcm_prompt_main_object: "A main object with two keys:",
    qcm_prompt_title: "- `title`: The activity title (string).",
    qcm_prompt_questions_array: "- `questions`: An array of 10 objects, where each object represents a question and contains:",
    qcm_prompt_question_text: "- `text`: The question wording (string, may contain HTML).",
    qcm_prompt_answers_array: "- `answers`: An array of objects, where each object represents an answer and contains:",
    qcm_prompt_answer_text: "- `text`: The answer text (string, may contain HTML).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 if the answer is correct, 0 otherwise.",
    qcm_prompt_example_json_title: "**Example JSON:**",
    qcm_prompt_example: `\`\`\`json
{
"title": "MCQ on the French Revolution",
"questions": [
{
"text": "What is the date of the Storming of the Bastille?",
"answers": [
{ "text": "July 14, 1789", "iscorrect": 1 },
{ "text": "August 4, 1789", "iscorrect": 0 },
{ "text": "August 26, 1789", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Generate only the valid JSON object, with no comments.",

    // Multiple-Choice Creation
    qcm_error_invalid_json: "The JSON structure is invalid. Make sure it contains a 'title' and a 'questions' array with at least one question and answers.",
    qcm_activity_intro: "Answer the following questions.",
    qcm_success_generation: "File {fileName} generated successfully !",
    qcm_error_creation_mbz: "Error while creating the MBZ for the multiple-choice quiz:",

    // H5P Modules
    h5p_timeline_name: "Timeline",
    h5p_timeline_description: "Create an interactive timeline to present a sequence of events.",
    h5p_flashcards_name: "Flashcards",
    h5p_flashcards_description: "Create double-sided cards to help memorize terms and definitions.",
    h5p_quiz_set_name: "Quiz",
    h5p_quiz_set_description: "Compose a series of varied questions (MCQ, drag-and-drop, etc.) to assess knowledge.",
    h5p_glossary_name: "Glossary",
    h5p_glossary_description: "Create a glossary or FAQ in accordion format.",
    h5p_crossword_name: "Crossword",
    h5p_crossword_description: "Generate a crossword grid from a list of words and definitions.",
    h5p_essay_name: "Essay",
    h5p_essay_description: "Propose an essay topic and define keywords for automated correction.",
    h5p_summary_name: "Summary",
    h5p_summary_description: "Students must reconstruct a correct summary by choosing the right sentences.",
    h5p_drag_the_words_name: "Drag the Words",
    h5p_drag_the_words_description: "Create a gap-fill text where students must drag the missing words.",
    h5p_fill_in_the_blanks_name: "Fill in the Blanks",
    h5p_fill_in_the_blanks_description: "Students must fill in the missing words in a text directly using the keyboard.",
    h5p_mark_the_words_name: "Mark the Words",
    h5p_mark_the_words_description: "Ask students to highlight certain words in a paragraph.",
    h5p_true_false_name: "True/False Question",
    h5p_true_false_description: "Create simple questions with a binary answer: true or false.",
    h5p_multiple_choice_name: "Multiple Choice",
    h5p_multiple_choice_description: "Create multiple choice questions with one or more correct answers.",
    h5p_find_the_words_name: "Find the Words",
    h5p_find_the_words_description: "Create a grid of letters where students must find words.",
    h5p_sort_the_paragraphs_name: "Sort the Paragraphs",
    h5p_sort_the_paragraphs_description: "Create a set of paragraphs that students must sort into the correct order.",
    h5p_single_choice_set_name: "Single Choice Set",
    h5p_single_choice_set_description: "Create a series of questions where each question has only one correct answer.",
    h5p_dialog_cards_name: "Dialog Cards",
    h5p_dialog_cards_description: "Create interactive cards with text and optional images on both sides.",
    h5p_complex_fill_the_blanks_name: "Complex fill the blanks",
    h5p_complex_fill_the_blanks_description: "Create an advanced fill-in-the-blanks text with specific feedback for each error.",
    h5p_chart_name: "Chart",
    h5p_chart_description: "Create a pie or bar chart to visualize data.",

    // Moodle Modules
    moodle_xml_name: "Quiz",
    moodle_xml_description: "Generate a question bank to import directly into a Test activity (in xml or gift format)",
    moodle_xml_help: "To add an XML file into a 'Quiz' activity in Moodle, first create the activity. Then open the <strong>More</strong> menu and go to <strong>Question bank</strong>. In this menu, click <strong>Import</strong>, choose the <strong>Moodle XML</strong> format, then select your file and confirm.",
    moodle_gift_name: "GIFT Format",
    moodle_gift_description: "Create questions in GIFT format, a simple way to import questions into Moodle.",
    moodle_millionnaire_name: "Millionaire",
    moodle_millionnaire_description: "Generate a unique 'Millionaire' activity with 6 questions of increasing difficulty.",
    moodle_appariement_name: "Matching",
    moodle_appariement_description: "Generate a 10-question matching activity.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Generate a simple MCQ activity.",

    moodle_glossaire_xml_name: "Glossary (XML)",
    moodle_glossaire_xml_description: "Generate a glossary ready to be imported in XML format.",
 
    elea_page_name: "Page",
    elea_page_description: "Create a visually formatted Éléa content page.",
    
    // Dynamic content
    prompt_for_ia: "Prompt for the AI",
    copy_prompt: "Copy prompt",
    fullscreen_prompt: "Fullscreen",
    exit_fullscreen_prompt: "Exit fullscreen",
    lock_prompt: "Lock prompt",
    unlock_prompt: "Unlock prompt",
    go_duck: "Go to Duck.ai",
    go_mistral: "Go to Le Chat",
    create_h5p_file: "Create H5P file",
    integrate_h5p_libraries: "Integrate H5P libraries:",
    paste_ia_result: "Paste the result from the AI in the area below to create your module.",
    generate_h5p: "Generate H5P",
    create_xml_file: "Create XML file",
    paste_ia_result_xml: "Paste the XML generated by the AI below.",
    generate_xml_file: "Generate XML file",
    export_mbz: "MBZ format",
    export_gift: "GIFT format",
    export_xml: "XML format",
    export_html: "HTML Format",

    create_mbz_file_appariement: "Create the Matching file (.mbz)",
    paste_ia_result_appariement: "Paste the AI-generated JSON below. The activity title will be automatically extracted from the JSON.",
    generate_mbz_appariement: "Generate the Matching activity (mbz)",
    create_mbz_file_millionnaire: "Create the Millionaire file (.mbz)",
    paste_ia_result_millionnaire: "Paste the AI-generated JSON below. The activity title will be automatically extracted from the JSON.",
    generate_mbz_millionnaire: "Generate the Millionaire activity (mbz)",
    generate_mbz_test: "Generate the Test activity (mbz)",

    create_mbz_file_qcm: "Create MCQ file (.mbz)",
    paste_ia_result_qcm: "Paste the AI-generated JSON below. The activity title will be automatically extracted from the JSON.",
    generate_mbz_qcm: "Generate MCQ activity (mbz)",

    create_mbz_file_page: "Create the Page file (.mbz)",
    paste_ia_result_page: "Paste the AI-generated JSON below to build the page.",
    generate_mbz_page: "Generate the Page activity (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "The Moodle XML will appear here...",
    paste_xml_placeholder: "Paste the full XML generated by the AI here...",

    // H5P empty text fields
    generate_prompts_placeholder: "The prompt for the AI will appear here once you have completed at least one field in Quick mode or Advanced mode.",
    paste_json_or_text: "Paste here the JSON content or the text generated by the AI to create your activity.",
    info_prompt_copy: "Do not paste this prompt into the right panel. Copy it into an external AI to obtain the result, then paste that result into the right panel.",

    // Notifications
    prompts_generated_successfully: "Prompts generated successfully!",
    success_copy: "✓ Copied !",
    error_please_fill_fields: "Please fill in at least one field in Quick Mode.",
    error_please_fill_guided_fields: "Please fill in at least one field in Advanced Mode.",
    error_field_empty: "The field is empty. Please generate a prompt first.",
    error_copy_failed: "Copy failed.",
    error_h5p_module_not_found: "Module '{moduleKey}' not found.",
    error_invalid_quiz_json: "The JSON for the Quiz is invalid: {errorMessage}",
    error_invalid_json: "The provided JSON is invalid. Error: {errorMessage}",
    error_h5p_creation: "H5P creation error: {errorMessage}",
    error_paste_ia_content: "Please paste the content generated by the AI.",
    error_compression_module_not_ready: "The compression module is not ready. Please try again in a moment.",
    h5p_file_generated_successfully: "File {fileName} generated successfully!",
    h5p_creation_failed: "H5P file creation failed: {errorMessage}",
    license_info: "GNU GPL v3.0 or later",

    // Notifications for JSON content
    error_paste_json_content: "Please paste the generated JSON content.",
    error_paste_xml_content: "Please paste the generated XML content.",

    // Flashcards specific UI translations
    flashcards_progress_text: "Card @card of @total",
    flashcards_next: "Next",
    flashcards_previous: "Previous",
    flashcards_check_answer: "Check",
    flashcards_your_answer: "Your answer",
    flashcards_correct_answer: "Correct",
    flashcards_incorrect_answer: "Incorrect",
    flashcards_show_solution: "Correct answer",
    flashcards_results: "Results",
    flashcards_of_correct: "@score of @total correct",
    flashcards_show_results: "Show results",
    flashcards_answer_short: "A:",
    flashcards_retry: "Retry",
    flashcards_card_announcement: "Incorrect answer. Correct answer was @answer",
    flashcards_correct_announcement: "@answer is correct.",
    flashcards_page_announcement: "Page @current of @total",

    ticket: "Ticket",
    legal_mentions: "Legal Mentions",

    // Legal Mentions
    legal_title: "Legal Mentions",
    legal_editor_title: "Application Editor",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Function: Vocational High School Teacher in Literature-History",
    legal_editor_gauthier_remande_email: "Email: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Address: 39 avenue de Chanzy, 53000 Laval, France",
    legal_editor_gauthier_remande_phone: "Phone: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Function: Mathematics teacher and DRANE mission officer – Academy of Grenoble",
    legal_editor_emmanuel_gaunard_email: "Email: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Address: 30 boulevard de la République, 38200 Vienne, France",
    legal_editor_emmanuel_gaunard_phone: "Phone: +33 6 46 74 20 94",
    legal_app_description: "The “Caramel” web application is a free, non-commercial project for creating H5P content. No account is required, no personal data is collected, and all interactions occur locally in the browser.",
    legal_hosting_title: "Hosting",
    legal_host_name: "<strong>Host</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>Company name</strong>: Ministry of National Education and Youth",
    legal_host_address: "<strong>Address</strong>: 110 rue de Grenelle, 75007 Paris, France",
    legal_host_phone: "<strong>Phone</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Publication Director",
    legal_publication_director_name: "Gauthier REMANDE and Emmanuel GAUNARD, as volunteer editors.",
    legal_terms_of_use_title: "General Terms of Use",
    legal_terms_of_use_content: "This site allows users to generate H5P content. Display is done locally, without transmitting user data. The user is solely responsible for the use of the generated content. The application is offered free of charge, without any guarantee of operation or result. The editor declines all responsibility in case of misinterpretation of the content or inappropriate use.",
    legal_intellectual_property_title: "Intellectual Property",
    legal_intellectual_property_content: "All source codes, graphic elements, and content are licensed under the free GNU AGPLv3 license. Their reuse is permitted under the terms of their respective licenses. Any redistribution or modification must credit the original authors: Gauthier REMANDE and Emmanuel GAUNARD. The images used in the H5P modules are retrieved from H5P.org.",
    legal_personal_data_title: "Personal Data",
    legal_personal_data_content: "No personal data is collected or stored. No tracking cookies are used. The session history is stored in the user's local browser (localStorage), without transmission. In accordance with the GDPR, no personal information is transmitted to the editor or to a third party.",
    legal_ai_models_title: "Artificial Intelligence Models",
    legal_ai_models_content: "The Caramel application uses, only during one-click generation, the Albert artificial intelligence models provided by the Interministerial Digital Directorate (DINUM). The available models are: Albert-Small (Llama 3.1, 8B parameters), Albert-Large (Mistral Small 3.2, 24B parameters), and Albert-Code (Qwen 2.5 Coder, 32.5B parameters). Data sent for content generation is processed on DINUM's servers and is not shared with external public AIs, thus ensuring the confidentiality and security of the information.",
    legal_accessibility_title: "Accessibility",
    legal_accessibility_content: "The application is designed to be compatible with computer use, including dark/light modes, keyboard navigation, and high contrast depending on the themes. Continuous improvement of accessibility is underway, in line with RGAA recommendations.",
    legal_applicable_law_title: "Applicable Law",
    legal_applicable_law_content: "This site is subject to French law. In the event of a dispute, the competent courts will be those within the jurisdiction of Lyon.",
    legal_external_libraries_title: "External Libraries Used",
    legal_external_libraries_intro: "The Caramel application uses several open source libraries, under the following licenses:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (License: CC BY 4.0, SIL OFL 1.1, MIT): Provides the icons used in the interface to improve navigation and visual experience.",
    legal_library_jszip: "<strong>JSZip</strong> (License: MIT or GPLv3): Allows creating .h5p files by compressing the necessary content into a zip archive.",
    legal_library_clientzip: "<strong>client-zip</strong> (License: MIT): Another library used for file compression, offering a high-performance alternative for generating .h5p archives directly in the browser.",
    legal_library_fflate: "<strong>fflate</strong> (License: MIT): Very fast library for data compression and decompression, used for creating .mbz archives for Moodle modules.",
    legal_library_tarjs: "<strong>tar-js</strong> (License: MIT): Allows creating .tar archives, a necessary step before compression to form .mbz files for Moodle modules.",
    legal_library_ownership: "Each library remains the property of its respective authors and is used in accordance with its license(s).",

    // Essay specific UI translations
    essay_checkAnswer: "Check",
    essay_tryAgain: "Retry",
    essay_showSolution: "Show solution",
    essay_feedbackHeader: "Feedback",
    essay_solutionTitle: "Sample solution",
    remainingChars: "Remaining characters: @chars",
    notEnoughChars: "You must enter at least @chars characters!",
    messageSave: "saved",
    placeholderText: "Start writing here...",
    ariaYourResult: "You got @score out of @total points",
    ariaNavigatedToSolution: "Navigated to newly included sample solution after textarea.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "Your work is a good start. Keep exploring the topic to enrich your ideas.",
    essay_overall_feedback_11_30: "You have laid some interesting groundwork. By delving deeper into certain points, your work will gain precision.",
    essay_overall_feedback_31_50: "Your understanding of the subject is well underway. Consider developing your arguments further to strengthen your point.",
    essay_overall_feedback_51_70: "This is good work. You show a good command of the subject. A few more details could still improve it.",
    essay_overall_feedback_71_90: "Very good work! Your analysis is relevant and well-structured. You demonstrate an excellent understanding.",
    essay_overall_feedback_91_100: "Excellent work! Your reflection is thorough, well-argued, and shows a complete mastery of the subject.",

    // True/False Question
    true_false_prompt_role: "You are an expert in instructional design creating a True/False question for an H5P activity.",
    true_false_prompt_mission: "Your mission is to generate a JSON object for a True/False question.",
    true_false_prompt_generate_json: "Generate a JSON object based on the following structure:",
    true_false_prompt_json_structure_title: "--- EXPECTED JSON STRUCTURE ---",
    true_false_prompt_json_structure_main_object: "The main object must contain the following keys:",
    true_false_prompt_question: "`question`: (string) The statement to be evaluated. Can contain HTML.",
    true_false_prompt_correct: "`correct`: (string) The correct answer, either \"true\" or \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Comment displayed if the answer is correct.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Comment displayed if the answer is incorrect.",
    true_false_prompt_content_rules_title: "--- CONTENT RULES ---",
    true_false_prompt_rule1: "The question must be a clear statement.",
    true_false_prompt_rule2: "The value of `correct` must be a string: \"true\" or \"false\".",
    true_false_prompt_example_json_title: "--- JSON EXAMPLE ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "Oslo is the capital of Norway.",
"correct": "true",
"feedbackOnCorrect": "Correct! Oslo is indeed the capital of Norway.",
"feedbackOnWrong": "Wrong answer. The capital of Norway is Oslo."
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "I want you to generate only the JSON, without any comments or introductory text.",
    true_false_true_text: "True",
    true_false_false_text: "False",
    true_false_score: "You got @score of @total points",
    true_false_check_answer: "Check",
    true_false_show_solution_button: "Show solution",
    true_false_try_again: "Retry",
    true_false_wrong_answer_message: "Wrong answer",
    true_false_correct_answer_message: "Correct answer",
    true_false_score_bar_label: "You got :num out of :total points",
    true_false_submit_answer: "Submit",
    true_false_a11y_check: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
    true_false_a11y_show_solution: "Show the solution. The task will be marked with its correct solution.",
    true_false_a11y_retry: "Retry the task. Reset all responses and start the task over again.",
    true_false_finish_header: "Finish?",
    true_false_finish_body: "Are you sure you wish to finish?",
    true_false_cancel_label: "Cancel",
    true_false_finish_label: "Finish",
    true_false_retry_header: "Retry?",
    true_false_retry_body: "Are you sure you wish to retry?",
    true_false_retry_confirm_label: "Confirm",

    // Multiple Choice UI translations
    checkAnswerButton: "Check",
    showSolutionButton: "Show solution",
    tryAgainButton: "Retry",
    submitAnswerButton: "Submit",
    scoreBarLabel: "You got :num out of :total points",
    confirmCheckHeader: "Finish?",
    confirmCheckBody: "Are you sure you want to finish?",
    confirmCheckCancelLabel: "Cancel",
    confirmCheckConfirmLabel: "Finish",
    confirmRetryHeader: "Retry?",
    confirmRetryBody: "Are you sure you want to retry?",
    confirmRetryCancelLabel: "Cancel",
    confirmRetryConfirmLabel: "Confirm",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Multiple Choice\" activity.",
    multiple_choice_prompt_mission: "**Your mission:**",
    multiple_choice_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Multiple Choice activity.",
    multiple_choice_prompt_json_structure_title: "**Expected JSON structure:**",
    multiple_choice_prompt_json_structure_main_object: "The object must contain:",
    multiple_choice_prompt_question: "`question`: The question to ask (HTML format).",
    multiple_choice_prompt_answers_array: "`answers`: An array of objects, each representing an answer.",
    multiple_choice_prompt_text: "`text`: The answer text (HTML format).",
    multiple_choice_prompt_correct: "`correct`: A boolean (`true` or `false`) indicating if it's the correct answer.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",
    multiple_choice_prompt_content_rules_title: "**Content rules:**",
    multiple_choice_prompt_rule1: "1.  There must be only one correct answer (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Provide several incorrect answers (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Example JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "What is the real color of blackcurrant?",
"answers": [
{
"correct": true,
"text": "Very dark purple"
},
{
"correct": false,
"text": "Blue"
},
{
"correct": false,
"text": "Black"
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // Find the Words UI translations
    check: "Check",
    tryAgain: "Retry",
    showSolution: "Show Solution",
    found: "@found of @totalWords found",
    timeSpent: "Time Spent",
    score: "You got @score of @total points",
    wordListHeader: "Word list",

    // Find the Words Prompt
    find_the_words_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Find the Words\" activity.",
    find_the_words_prompt_mission: "**Your mission:**",
    find_the_words_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Find the Words activity.",
    find_the_words_prompt_json_structure_title: "**Expected JSON structure:**",
    find_the_words_prompt_json_structure_main_object: "The object must contain:",
    find_the_words_prompt_task_description: "`taskDescription`: Clear instructions for the activity.",
    find_the_words_prompt_word_list: "`wordList`: A string of words to find, separated by commas without spaces.",
    find_the_words_prompt_content_rules_title: "**Content rules:**",
    find_the_words_prompt_rule1: "1.  The `wordList` must be a single string with words separated by commas. Each word must be simple (no multi-word terms). Numbers, punctuation marks, and accented letters are forbidden (e.g., write 'eleve' instead of 'élève').",
    find_the_words_prompt_example_json_title: "**Example JSON:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Find the city names in the grid below",
"wordList": "Canberra,Minsk,Beijing,Oslo,Paris,London,Madrid,Athens,Tokyo,Moscow,Washington,Stockholm"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",
    fillPool: "abcdefghijklmnopqrstuvwxyz",

    // Sort the Paragraphs UI translations
    checkAnswer: "Check",
    submitAnswer: "Submit",
    up: "Up",
    down: "Down",
    disabled: "Disabled",
    a11y_yourResult: "You got @score out of @total points",
    a11y_paragraph: "Paragraph",
    a11y_correct: "correct",
    a11y_wrong: "wrong",
    a11y_point: "@score point",
    a11y_sevenOfNine: "@current of @total",
    a11y_currentPosition: "Current position in list",
    a11y_instructionsSelected: "Press spacebar to reorder",
    a11y_instructionsGrabbed: "Press up and down arrow keys to change position, spacebar to drop, escape to cancel",
    a11y_grabbed: "Grabbed",
    a11y_moved: "Moved",
    a11y_dropped: "Dropped",
    a11y_reorderCancelled: "Reorder cancelled",
    a11y_finalPosition: "Final position",
    a11y_nextParagraph: "Next paragraph",
    a11y_correctParagraph: "Correct paragraph at position",
    a11y_listDescription: "Sortable list of paragraphs.",
    a11y_listDescriptionCheckAnswer: "List of paragraphs with results.",
    a11y_listDescriptionShowSolution: "List of paragraphs with solutions.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Sort the Paragraphs\" activity.",
    sort_the_paragraphs_prompt_mission: "**Your mission:**",
    sort_the_paragraphs_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Sort the Paragraphs activity.",
    sort_the_paragraphs_prompt_json_structure_title: "**Expected JSON structure:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "The object must contain:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Clear instructions for the activity. Use `*word*` for bold, `**word**` for italics, and `\\n` for line breaks.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: An array of strings, each representing a paragraph to be sorted. The paragraphs must be in the correct order. Use `*word*` for bold, `**word**` for italics.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",
    sort_the_paragraphs_prompt_content_rules_title: "**Content rules:**",
    sort_the_paragraphs_prompt_rule1: "1. `paragraphs` must form a logical progression inferable from the content, without artificial cues (numbers, dates/times, “first/then/finally”), unless explicitly requested.",
    sort_the_paragraphs_prompt_rule2: "2. No flat list: each sentence advances the same thread (cause→effect, preparation→action→result, general→particular) to make the order deducible.",
    sort_the_paragraphs_prompt_example_json_title: "**Example JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "My morning routine:",
"paragraphs": [
  "I fill the kettle with fresh water.",
  "I switch it on.",
  "I place a tea bag in the cup.",
  "I pour the boiling water over the bag.",
  "I remove the bag when the infusion is ready."
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Show solution",
    retryButtonLabel: "Retry",
    solutionViewTitle: "Solution",
    correctText: "Correct!",
    incorrectText: "Incorrect!",
    muteButtonLabel: "Mute",
    closeButtonLabel: "Close",
    slideOfTotal: "Slide @slide of @total",
    nextButtonLabel: "Next",
    solutionListQuestionNumber: "Question @question",
    a11yShowSolution: "Show the solution. The task will be marked with its correct solution.",
    a11yRetry: "Retry the task. Reset all responses and start the task over again.",
    shouldSelect: "Should select",
    shouldNotSelect: "Should not select",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Single Choice Set\" activity.",
    single_choice_set_prompt_mission: "**Your mission:**",
    single_choice_set_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Single Choice Set activity.",
    single_choice_set_prompt_json_structure_title: "**Expected JSON structure:**",
    single_choice_set_prompt_json_structure_main_object: "The object must contain:",
    single_choice_set_prompt_choices_array: "`choices`: An array of objects, where each object represents a question and contains:",
    single_choice_set_prompt_question: "`question`: The question to ask.",
    single_choice_set_prompt_answers_array: "`answers`: An array of strings. The first string is always the correct answer.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: (STRICT RULE) You must generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the score bands 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100. Each object must have the form `{ \"from\": 0, \"to\": 10, \"feedback\": \"...\" }`. The `feedback` text must be kind (not excessive), graduated, and always affirmative.",
    single_choice_set_prompt_content_rules_title: "**Content rules:**",
    single_choice_set_prompt_rule1: "1.  In each `answers` array, the first answer is always the correct one.",
    single_choice_set_prompt_example_json_title: "**Example JSON:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "Goji berries are also known as ...",
"answers": ["Wolfberries", "Catberries", "Bearberries"]
},
{
"question": "Goji berries are native to ...",
"answers": ["Asia", "Africa", "Europe"]
}
],
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // Dialog Cards UI translations
    answer: "Turn",
    next: "Next",
    prev: "Previous",
    retry: "Retry",
    progressText: "Card @card of @total",
    cardFrontLabel: "Card front",
    cardBackLabel: "Card back",
    tipButtonLabel: "Show tip",
    audioNotSupported: "Your browser does not support this audio",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "You are an expert in pedagogical engineering creating an H5P \"Dialog Cards\" activity.",
    dialog_cards_prompt_mission: "**Your mission:**",
    dialog_cards_prompt_generate_json: "Generate a JSON object containing only the `title`, `description`, and `dialogs` keys for an H5P activity of type Dialog Cards.",
    dialog_cards_prompt_json_structure_title: "**Expected JSON structure:**",
    dialog_cards_prompt_json_structure_main_object: "The object must contain:",
    dialog_cards_prompt_title: "`title`: A title for the activity. Do not include HTML tags.",
    dialog_cards_prompt_description: "`description`: A short description or instruction (HTML format).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: An array of ${nombreQuestions} objects, each representing a card and containing:",
    dialog_cards_prompt_text: "`text`: The text on the front of the card. Do not include HTML tags.",
    dialog_cards_prompt_answer: "`answer`: The text on the back of the card. Do not include HTML tags.",
    dialog_cards_prompt_tips: "`tips` (optional): An object for hints (plain text only, no formatting). If you deem it pedagogically useful, add a hint for the front with the `front` key and/or for the back with the `back` key.",
    dialog_cards_prompt_content_rules_title: "**Content rules:**",
    dialog_cards_prompt_rule1: "1.  For `text` and `answer`, you can use `*word*` for bold and `**word**` for italics.",
    dialog_cards_prompt_example_json_title: "**Example JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "Learn the names of fruits in English",
"description": "Fruit names are presented in French. Flip the cards to see the correct English translation.",
"dialogs": [
{
"title": "Find the French infinitive",
"description": "From a sentence in French in the passé composé, find the verb in its infinitive form. Flip the cards to check your answers.",
"dialogs": [
{
"text": "Il a *visité* sa grand-mère.",
"answer": "*visiter*",
"tips": {
"front": "Identify the past participle.",
"back": "Think of the base (infinitive) form of the verb."
}
},
{
"text": "Elle a *joué* au football.",
"answer": "*jouer*",
"tips": {
"front": "Look for the past participle.",
"back": "Imagine the verb in its dictionary form (infinitive)."
}
}
]
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Generate only the valid JSON code containing the `title`, `description`, and `dialogs` keys, without any comments.",

    // Dialog Cards specific UI translations
    correctAnswer: "I got it right!",
    incorrectAnswer: "I got it wrong",
    round: "Round @round",
    cardsLeft: "Cards left: @number",
    nextRound: "Proceed to round @round",
    startOver: "Start over",
    showSummary: "Next",
    summary: "Summary",
    summaryCardsRight: "Cards you got right:",
    summaryCardsWrong: "Cards you got wrong:",
    summaryCardsNotShown: "Cards in pool not shown:",
    summaryOverallScore: "Overall Score",
    summaryCardsCompleted: "Cards you have completed learning:",
    summaryCompletedRounds: "Completed rounds:",
    summaryAllDone: "Well done! You got all @cards cards correct @max times in a row!",
    confirmStartingOverHeader: "Start over?",
    confirmStartingOverBody: "All progress will be lost. Are you sure you want to start over?",
    confirmStartingOverCancelLabel: "Cancel",
    confirmStartingOverConfirmLabel: "Start over",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "You are an expert in instructional design creating an H5P activity \"Complex Fill the Blanks\".",
    complex_blanks_prompt_mission: "**Your mission:**",
    complex_blanks_prompt_generate_json: "Generate a complete and valid JSON object for an H5P activity of type Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Expected JSON structure:**",
    complex_blanks_prompt_json_structure_main_object: "The main object must contain the `content` and `overallFeedback` keys.",
    complex_blanks_prompt_task: "`task`: The instructions for the exercise (in HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: The text containing the blanks, represented by `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: An array of objects, one for each blank, in order of appearance.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: The correct answer (can include alternatives with `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: An array of objects for common mistakes.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: The text of a common mistake.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: The specific feedback for this mistake (in HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: An array for general feedback based on the score.",
    complex_blanks_prompt_content_rules_title: "**Content rules:**",
    complex_blanks_prompt_rule1: "1. The number of objects in `blanksList` must match the number of blanks in `blanksText`.",
    complex_blanks_prompt_rule2: "2. Provide common mistakes and constructive feedback.",
    complex_blanks_prompt_rule3: "3. The text and feedback can contain simple HTML tags like `<p>`, `<strong>`, `<em>`.",
    complex_blanks_prompt_example_json_title: "**Example JSON:**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Put the verbs into the correct tense. You'll get individual feedback for typical mistakes.</p>",
"blanksList": [
{
"correctAnswerText": "doesn't speak/does not speak",
"incorrectAnswersList": [
{
"incorrectAnswerText": "speaks not/speak not",
"incorrectAnswerFeedback": "<div>Remember to use 'do/does' when negating a full verb <em>(speak)</em>.</div>"
},
{
"incorrectAnswerText": "don't speak/do not speak",
"incorrectAnswerFeedback": "<div>You forgot the 'third person singular -s' for simple present <em>(he)</em>.</div>"
}
]
}
],
"blanksText": "<p>He speaks English but he (not / speak) ___________<strong>&nbsp;</strong>German.</p>"
},
"overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Feedback for 0-10%" },
    { "from": 11, "to": 30, "feedback": "Feedback for 11-30%" },
    { "from": 31, "to": 50, "feedback": "Feedback for 31-50%" },
    { "from": 51, "to": 70, "feedback": "Feedback for 51-70%" },
    { "from": 71, "to": 90, "feedback": "Feedback for 71-90%" },
    { "from": 91, "to": 100, "feedback": "Feedback for 91-100%" }
]
}
\`\`\` `,
    complex_blanks_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // Chart Prompt
    chart_prompt_role: "You are an expert in instructional design creating an H5P \"Chart\" activity.",
    chart_prompt_mission: "**Your mission:**",
    chart_prompt_generate_json: "Generate a complete and valid JSON object for an H5P Chart activity.",
    chart_prompt_json_structure_title: "**Expected JSON structure:**",
    chart_prompt_json_structure_main_object: "The object must contain:",
    chart_prompt_graph_mode: "`graphMode`: Choose the most relevant chart type, 'pieChart' or 'barChart', based on the context, unless instructed otherwise.",
    chart_prompt_list_of_types: "`listOfTypes`: An array of objects, each representing a data point in the chart.",
    chart_prompt_value: "`value`: The numerical value of the data point.",
    chart_prompt_color: "`color`: The color of the data point (hex code).",
    chart_prompt_font_color: "`fontColor`: The color of the text for the data point (hex code).",
    chart_prompt_text: "`text`: The label for the data point.",
    chart_prompt_figure_definition: "`figureDefinition`: A brief description of the chart.",
    chart_prompt_content_rules_title: "**Content rules:**",
    chart_prompt_rule1: "1. Choose contrasting colors for good readability.",
    chart_prompt_rule2: "2. Labels should be short and clear.",
    chart_prompt_rule3: "3. If a value is very low compared to others, prefer a 'barChart' for better visualization.",
    chart_prompt_example_json_title: "**Example JSON:**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Blueberries"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Raspberries"}
],
"figureDefinition": "Chart"
}
\`\`\` `,
    chart_prompt_generate_only_json: "Generate only the valid JSON code, without any comments.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Previous",
    quiz_next_button: "Next",
    quiz_finish_button: "Finish",
    quiz_submit_button: "Submit",
    quiz_textual_progress: "Question @current of @total",
    quiz_no_result_message: "Finished",
    quiz_result_message: "Your results:",
    quiz_score_bar_label: "You got @finals out of @totals points",
    quiz_solution_button_text: "Show solution",
    quiz_retry_button_text: "Retry",
    quiz_finish_button_text: "Finish",
    quiz_submit_button_text: "Submit",
    quiz_feedback_available: "Feedback available",
    quiz_read_feedback: "Read feedback",
    quiz_wrong_answer: "Wrong answer",
    quiz_correct_answer: "Correct answer",
    quiz_should_check: "Should have been checked",
    quiz_should_not_check: "Should not have been checked",
    quiz_no_input: "Please answer before viewing the solution.",
    quiz_a11y_check: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
    quiz_a11y_show_solution: "Show the solution. The task will be marked with its correct solution.",
    quiz_a11y_retry: "Retry the task. Reset all responses and start the task over again.",

    // Albert generation
    generate_with_albert: "Generate with Albert",
    generation_in_progress: "Generation in progress, please wait...",
    request_sent_to_ia: "Request sent to AI, please wait...",
    generation_successful: "H5P content generated successfully!",
    generation_failed_empty: "Generation failed. The response was empty.",
    generation_failed_error: "Error during generation: {errorMessage}",
    generation_failed_albert: "Generation on Albert AI failed. Cause: {errorMessage}",

    // Albert models description
    albert_small_summary: "Fast, simple, suitable for quick and structured exercises.",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "Powerful, nuanced, ideal for complex tasks and writing.",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "Specialized, precise, designed for programming and code.",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "Source model:",
    albert_model_parameters: "Model size:",
    albert_model_parameters_small: "8B parameters",
    albert_model_parameters_large: "24B parameters",
    albert_model_parameters_code: "32.5B parameters",
    language: "Language",
    tutorial: "Tutorial",

    // Glossaire XML Prompt
    glossaire_xml_prompt_role: "You are an expert in instructional design and you will create the content for a Moodle glossary in XML format.",
    glossaire_xml_prompt_mission: "**Your mission:** You must generate a simple JSON object containing a list of terms for a glossary. Each term must have a concept, a definition, and, if relevant, a list of aliases.",
    glossaire_xml_prompt_structure_title: "**Expected JSON structure:**",
    glossaire_xml_prompt_structure_rules: `
-   **Root:** A main object containing two keys: \`name\` (the name of the glossary) and \`entries\` (an array of objects).
-   **Each object in \`entries\` must contain:**
    -   \`concept\`: The word or expression to be defined.
    -   \`definition\`: A clear and concise definition. Use *mot* for bold, **mot** for italics and \\n for line breaks, only when pedagogically relevant.
    -   \`aliases\` (optional): An array of strings for synonyms or alternative terms. Only add this key if relevant aliases exist.`,
    glossaire_xml_prompt_example_title: "**Example JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "The Information Lexicon",
  "entries": [
    {
      "concept": "Journalist",
      "definition": "A person who **collects**, verifies, and disseminates *information*.",
      "aliases": ["Reporter", "Columnist"]
    },
    {
      "concept": "Source",
      "definition": "Origin of a piece of *information*."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Generate only the valid JSON code, without any comments.",

    //Barre de menu
    tab_all: "All",
    tab_quiz: "Quiz & Tests",
    tab_text: "Text Manipulation",
    tab_memory: "Memorization & Discovery",
    tab_elea: "Éléa",
    tab_h5p: "H5P",
    tab_moodle: "Moodle",

    //Bandeau modale de génération
    get_prompt_step: "1/2 Get the prompt",
    create_file_step: "2/2 Create the file",
    generate_one_click: "One-click generation",
    simple_mode: "Simple",
    advanced_mode: "Guided",

    // RAG feature
    activate_rag: "Enable Document Consultation",
    rag_tooltip: "Allows pasting text or uploading a PDF. The content will be used as the main source for generating activities.",
    rag_title: "Attach documents (optional)",
    rag_note: "If you want the AI to work exclusively from your documents, paste your text or drop your files here. Otherwise, leave this area empty to allow the AI to search for information on its own.",
    upload_pdf: "Or upload a PDF for analysis",
    pdf_loading: "Loading PDF...",
    pdf_processing_page: "Processing page",
    ocr_recognizing_page: "Recognizing (OCR) page",
    ocr_success: "The document has been processed successfully.",
    ocr_error: "An error occurred during processing.",
    error_invalid_pdf: "Please select a valid PDF file.",
    error_duplicate_pdf: "This file has already been added.",
    error_fullscreen: "Fullscreen mode failed:",
    lock_text: "Lock",
    unlock_text: "Unlock",
    rag_instruction: "\n\nYou must only consult the following information to generate the content:",
    drag_drop_text: "Drag and drop a PDF file here",
    or_text: "or",
    upload_pdf_btn: "Choose a file",
    paste_your_text_here: "Copy and paste your text here...",
    rag_tags_tuto: "Find below the uploaded documents. Click the colored circle to customize the highlighting of each document.",

    // Caramel Preparation Steps
    caramel_animation_step_1: "Pour the sugar into the saucepan...",
    caramel_animation_step_2: "Add a little water...",
    caramel_animation_step_3: "Heat over medium heat...",
    caramel_animation_step_4: "The sugar starts to melt...",
    caramel_animation_step_5: "It starts to color...",
    caramel_animation_step_6: "Stir gently...",
    caramel_animation_step_7: "The caramel takes on a beautiful amber color...",
    caramel_animation_step_8: "Add the hot cream...",
    caramel_animation_step_9: "Watch out for splashes!",
    caramel_animation_step_10: "Stir well...",
    caramel_animation_step_11: "It's almost ready!",

    // Page Prompt
    page_prompt_role: "You are an instructional design expert creating a structured Page activity for Éléa/Moodle.",
    page_prompt_mission: "**Your mission :**",
    page_prompt_generate_json: "Generate a JSON object to build an Éléa content page. The page structure is based on predefined blocks. You must select the most relevant blocks from the list below to meet the user's request.",
    page_prompt_json_structure_title: "**Expected JSON structure :**",
    page_prompt_json_structure_main_object: "The main object must contain a \"title\" key for the page title, an \"intro\" key for a clear and understandable introduction to the course content that follows, and a \"blocks\" key which is an array of objects. Each object represents a content block and must have a \"type\" matching one of the blocks below, and a \"data\" object containing the block-specific information.",
    page_prompt_blocks_list_title: "**List of available blocks :**",
    page_prompt_block_01: "- `#01_hero_header`: Opening banner. `{ \"type\": \"#01_hero_header\", \"data\": { \"title\": \"...\", \"subtitle\": \"...\" } }`",
    page_prompt_block_02: "- `#02_nav_summary`: Summary with internal links. `{ \"type\": \"#02_nav_summary\", \"data\": { \"links\": [{ \"href\": \"#...\", \"text\": \"...\" }] } }`",
    page_prompt_block_03: "- `#03_histo_reperes`: Historical landmarks in 3 cards. `{ \"type\": \"#03_histo_reperes\", \"data\": { \"title\": \"...\", \"cards\": [{ \"title\": \"...\", \"text\": \"...\" }] } }` (max 3 cards)",
    page_prompt_block_04: "- `#04_callout_set`: Banners Objectives, Good to know, Alert. `{ \"type\": \"#04_callout_set\", \"data\": { \"title\": \"...\", \"callouts\": [{ \"type\": \"objectif|savoir|alerte\", \"text\": \"...\" }] } }`",
    page_prompt_block_05: "- `#05_stats_cards`: Key figures in cards. `{ \"type\": \"#05_stats_cards\", \"data\": { \"title\": \"...\", \"stats\": [{ \"value\": \"...\", \"label\": \"...\" }] } }`",
    page_prompt_block_06: "- `#06_lexique_table`: Vocabulary table. `{ \\\"type\\\": \\\"#06_lexique_table\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_07: "- `#07_glossary_chips`: Glossary as chips. `{ \"type\": \"#07_glossary_chips\", \"data\": { \"title\": \"...\", \"chips\": [\"...\"] } }`",
    page_prompt_block_08: "- `#08_monuments_grid`: Monument cards with images. `{ \"type\": \"#08_monuments_grid\", \"data\": { \"title\": \"...\", \"cards\": [{ \"img_src\": \"...\", \"img_alt\": \"...\", \"caption\": \"...\", \"title\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_09: "- `#09_figures_comparison`: Two images compared. `{ \"type\": \"#09_figures_comparison\", \"data\": { \"title\": \"...\", \"images\": [{ \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }, { \"src\": \"...\", \"alt\": \"...\", \"caption\": \"...\" }] } }`",
    page_prompt_block_10: "- `#10_table_comparison`: Comparison table. `{ \\\"type\\\": \\\"#10_table_comparison\\\", \\\"data\\\": { \\\"title\\\": \\\"...\\\", \\\"caption\\\": \\\"...\\\", \\\"headers\\\": [\\\"...\\\", \\\"...\\\"], \\\"rows\\\": [[\\\"...\\\",\\\"...\\\"]] } }`",
    page_prompt_block_11: "- `#11_definition_box`: Definition box. `{ \"type\": \"#11_definition_box\", \"data\": { \"title\": \"Definition\", \"text\": \"...\" } }`",
    page_prompt_block_12: "- `#12_context_paragraphs`: Course paragraphs. `{ \"type\": \"#12_context_paragraphs\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\", \"...\"] } }`",
    page_prompt_block_13: "- `#13_monument_sheet_long`: Detailed sheet. `{ \"type\": \"#13_monument_sheet_long\", \"data\": { \"title\": \"...\", \"paragraphs\": [\"...\"] } }`",
    page_prompt_block_14: "- `#14_faq_block`: Frequently asked questions. `{ \"type\": \"#14_faq_block\", \"data\": { \"title\": \"FAQ\", \"questions\": [{ \"q\": \"...\", \"a\": \"...\" }] } }`",
    page_prompt_block_15: "- `#15_myths_realities`: Myths vs Realities. `{ \"type\": \"#15_myths_realities\", \"data\": { \"myths\": { \"title\": \"Myths\", \"items\": [\"...\"] }, \"realities\": { \"title\": \"Realities\", \"items\": [\"...\"] } } }`",
    page_prompt_block_17: "- `#17_method_image_desc`: Method for describing an image. `{ \"type\": \"#17_method_image_desc\", \"data\": { \"title\": \"...\", \"steps\": [\"...\"] } }`",
    page_prompt_block_18: "- `#18_sito_graphy`: Webography. `{ \"type\": \"#18_sito_graphy\", \"data\": { \"title\": \"Webography\", \"links\": [{ \"href\": \"...\", \"text\": \"...\" }] } }`",
    page_prompt_block_19: "- `#19_quote_bilingual`: Bilingual quotation. `{ \"type\": \"#19_quote_bilingual\", \"data\": { \"title\": \"...\", \"quote_fr\": \"...\", \"quote_alt\": \"...\", \"caption\": \"...\" } }`",
    page_prompt_content_rules_title: "**Content rules :**",
    page_prompt_rule1: "1.  The JSON must be valid.",
    page_prompt_rule2: "2.  Text content may use Markdown tags `*word*` for bold and `**word**` for italics.",
    page_prompt_rule3: "3.  For images, find relevant and royalty-free URLs (e.g.: Wikimedia Commons).",
    page_prompt_example_json_title: "**JSON example :**",
    page_prompt_example_json: `\`\`\`json
{
  "title": "The French Revolution",
  "blocks": [
    { "type": "#01_hero_header", "data": { "title": "The French Revolution", "subtitle": "Key reference points" } },
    { "type": "#12_context_paragraphs", "data": { "title": "Context", "paragraphs": ["The French Revolution is a period of upheavals...", "Several causes explain this event..."] } },
    { "type": "#08_monuments_grid", "data": { "title": "Key events", "cards": [{ "img_src": "https://.../Prise_de_la_Bastille.jpg", "img_alt": "Storming of the Bastille", "caption": "14 July 1789", "title": "Storming of the Bastille", "text": "This event marks the beginning of the Revolution." }] } }
  ]
}
\`\`\``,
    page_prompt_generate_only_json: "Generate only valid JSON code, without any comments."
};
