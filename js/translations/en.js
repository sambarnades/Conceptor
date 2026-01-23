const translations_en = {
  subtitle: "Assisted Creation of Resources and Activities for Moodle and Éléa",
  help_modal_title: "🚀 Caramel Complete Guide for Teachers",
  help_modal_content: `
    <p>Welcome to <strong>Caramel</strong>! This guide is designed to walk you through step by step, even if you're just getting started. Our goal is to help you create interactive learning activities simply and efficiently.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Describe</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Choose</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Generate</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> View & download</a>
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
            This powerful option lets you base generation on content you provide. You can either <strong>copy-paste text</strong> or <strong>upload a document (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
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
            <h5><i class="fas fa-rocket"></i> Option A: Simple Display - One-click generation</h5>
            <p>The fast lane. Click <button class="help-btn-example-llm">Generate in one click</button> to have the AI produce the content and place it directly in the result area on the right. You can choose between different AI models (fast, powerful, …) via the small arrow on the button’s right side.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Option B: Guided Display - Use an external AI</h5>
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
        <h4><span class="help-step-number">4</span> View and download</h4>
        <p>Once the content is generated, you can view, test and download it in different formats.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> View and test</summary>
            <p>Take time to check your activity in the viewing window:</p>
            <ul>
                <li><strong>Scroll</strong> through the content to proofread everything.</li>
                <li><strong>Test</strong> the activity as a student (click, drag, type...).</li>
                <li>For <strong>Éléa/Magistère/Moodle</strong> content, a simulator shows you the real rendering.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Viewing window" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Test the activity directly in the simulator.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Download (Formats & Exports)</summary>
            <p>You have several options for retrieving your work:</p>
            <ul>
                <li><strong>Interactive format (main button):</strong> To retrieve the digital file (e.g., .h5p, .mbz) to put on your platform.</li>
                <li><strong>Other formats (menu dropdown):</strong> Click on the arrow to download in <strong>PDF, DOCX or ODT</strong> (useful for printing or archiving).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Export menu" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Expand the menu to access PDF, DOCX exports...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Integrate in Éléa/Magistère</h5>
        <p>Once the file is downloaded, here is how to add it to your course:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (H5P activities)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Simple method:</strong> Enable editing in your course, then drag and drop the .h5p file directly into the desired section. Choose "Add an H5P activity" and finish with the "DÉPOSER" button.
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="H5P activity quick add interface" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Add the H5P activity, then click DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Recommended method (for designers):</strong> Click "Add an activity or resource", choose "Interactive Content (H5P)", then in the "Editor" field select the "Upload" tab and continue with "Upload a file". Finish by clicking "Use", add the required information, then save. This method ensures the activity will be included if you share your course.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Page, Millionaire, Matching, MCQ)</summary>
                <div class="import-content">
                    <p>This format imports a complete activity into your course.</p>
                    <ol>
                        <li>
                            <p>Open the editing menu located on the right side of the screen. If it is folded, use the small arrow to reveal it.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Editing menu expanded on the right column" style="width:75%;height:auto;">
                                    <figcaption><em>Editing menu expanded.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Arrow to unfold the editing panel" style="width:75%;height:auto;">
                                    <figcaption><em>Use the arrow if the panel is hidden.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Click "IMPORT/EXPORT", then "Importer un parcours" in the submenu that appears.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="IMPORT/EXPORT button in Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Select Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Drag and drop your .mbz file into the import area and click "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Area to drop the MBZ file" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Drop the file, then validate with IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>Finish by clicking "CONTINUER" at the final step: the activity is now in your course.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Glossary activity)</summary>
                <div class="import-content">
                    <p>This format allows you to import a list of definitions into an Éléa/Moodle glossary.</p>
                    <ol>
                        <li>
                            <p>Create a blank Glossary activity in your course and open it.</p>
                        </li>
                        <li>
                            <p>Once inside the Glossary, click on the "IMPORTER DES ARTICLES" button.</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="IMPORTER DES ARTICLES button in the glossary" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Click on IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Drag and drop your .xml file into the import area and click the "ENVOYER" button.</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Drop zone for the glossary XML file" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Drop the file then validate with ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Your entries have been detected. Finish by clicking on the "CONTINUER" button.</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Confirmation of detected entries" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Click on CONTINUER to finalize the import.</em></figcaption>
                            </figure>
                        </li>
                        <li>The import is complete. Your definitions are now available in the Glossary.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> and <span class="help-badge-file">.GIFT</span> (Quiz activity)</summary>
                <div class="import-content">
                    <p>These formats import questions into your "Question bank".</p>
                    <ol>
                        <li>
                            <p>In your Éléa course, go to the "More" tab, then click on "Question bank".</p>
                        </li>
                        <li>
                            <p>In the dropdown menu where "Questions" is displayed, select "Import".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Selecting the Import button in the question bank" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Select Import from the dropdown menu.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Check the format corresponding to your file:</p>
                            <ul>
                                <li><strong>Moodle XML format</strong> (recommended): complete format supporting all question types.</li>
                                <li><strong>GIFT format</strong>: simpler alternative but limited in question types.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Choice between Moodle XML Format and GIFT Format" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Select the format matching your file.</em></figcaption>
                            </figure>
                        </li>
                        <li>Drag and drop your file into the upload area.</li>
                        <li>Click the "IMPORTATION" button. The screen will then display the added questions (for example: 10 questions have been added).</li>
                        <li>Finish by clicking "CONTINUER" at the bottom of the page.</li>
                        <li>The questions are now ready to be added to a Quiz activity. Consult the <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">Éléa tutorial</a> to create a Quiz activity and load questions from the bank.</li>
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
                        <li>In the page's text editor, click the icon to switch to HTML mode (often represented by "&lt;&gt;").</li>
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
            <li><strong>Discuss & Ask:</strong> Join us on the <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> room to connect with the community.</li>
            <li><strong>Report a bug:</strong> Found an issue? Open an <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">issue</a>. If possible, attach the JSON file that caused the error—it helps a lot.</li>
            <li><strong>Support the project:</strong> If you like the tool, leave us a star on the <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">Forge page</a>. It’s our best reward!</li>
        </ul>
    </div>
    `,

  // ============================================================================
  // MAIN INTERFACE
  // ============================================================================
  language: "Language",
  tutorial: "Tutorial",
  notifications: "Notifications",
  fast_mode: "Quick Mode",
  guided_mode: "Advanced Mode",
  who_are_you: "Who are you? (e.g., Teacher, Trainer...)",
  what_to_address: "What do you want to cover? (e.g., The French Revolution...)",
  level: "For which level (e.g., 10th Grade / Vocational)",
  number_of_elements: "Number of questions/elements in the module (e.g., 5)",

  // ============================================================================
  // RAG/OCR
  // ============================================================================
  rag_title: "Attach documents (optional)",
  rag_note: "If you want the AI to work exclusively from your documents, paste your text or drop your files here. Otherwise, leave this area empty to allow the AI to search for information on its own.",
  error_duplicate_file: "This file has already been added.",
  error_unsupported_format: "Unsupported format. Accepted formats: ",
  ocr_scanned_page: "Scanned page detected, OCR in progress",
  ocr_image_processing: "Image recognition (OCR)",
  ocr_initializing: "Initializing OCR...",
  ocr_loading_language: "Loading language model...",
  ocr_preparing: "Preparing analysis...",
  docx_processing: "Extracting DOCX text...",
  pptx_processing: "Extracting PPTX text...",
  odt_processing: "Extracting ODT text...",
  odp_processing: "Extracting ODP text...",
  file_loading: "Loading file...",
  extraction_success: "The document has been processed successfully.",
  extraction_error: "An error occurred during processing.",
  error_fullscreen: "Fullscreen mode failed:",
  lock_text: "Lock",
  unlock_text: "Unlock",
  drag_drop_text: "Drag and drop a document here (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "or",
  upload_pdf_btn: "Choose a file",
  paste_your_text_here: "Copy and paste your text here...",
  rag_tags_tuto: "Find below the uploaded documents. Click the colored circle to customize the highlighting of each document.",

  // ============================================================================
  // TABS
  // ============================================================================
  tab_all: "All",
  tab_quiz: "Quiz & Tests",
  tab_text: "Text Manipulation",
  tab_memory: "Memorization & Discovery",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // H5P ACTIVITIES - DETAILS
  // ============================================================================
  h5p_timeline_name: "Timeline",
  h5p_timeline_description: "Create an interactive timeline to present a sequence of events.",
  h5p_flashcards_name: "Flashcards",
  h5p_flashcards_description: "Create double-sided cards to help memorize terms and definitions.",
  h5p_quiz_set_name: "Mixed Quiz",
  h5p_quiz_set_description: "Compose a series of varied questions (MCQ, drag-and-drop, etc.) to assess knowledge.",
  h5p_quiz_set_qcm_name: "MCQ Quiz",
  h5p_quiz_set_qcm_description: "Create a quiz composed exclusively of multiple-choice questions (MCQ).",
  h5p_quiz_set_vf_name: "True/False Quiz",
  h5p_quiz_set_vf_description: "Create a quiz composed exclusively of True or False questions.",
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
  h5p_true_false_name: "True/False",
  h5p_true_false_description: "Create a <strong style='color: red;'>single</strong> simple question with a binary answer: true or false.",
  h5p_multiple_choice_name: "Multiple Choice",
  h5p_multiple_choice_description: "Create a <strong style='color: red;'>single</strong> multiple choice question with one or more correct answers.",
  h5p_find_the_words_name: "Find the Words",
  h5p_find_the_words_description: "Create a grid of letters where students must find words.",
  h5p_sort_the_paragraphs_name: "Sort the Paragraphs",
  h5p_sort_the_paragraphs_description: "Create a set of paragraphs that students must sort into the correct order.",
  h5p_single_choice_set_name: "Single Choice Set",
  h5p_single_choice_set_description: "Create a series of questions where each question has only one correct answer.",
  h5p_dialog_cards_name: "Dialog Cards",
  h5p_dialog_cards_description: "Create interactive cards with text and optional images on both sides.",
  h5p_complex_fill_the_blanks_name: "Complex Fill in the Blanks",
  h5p_complex_fill_the_blanks_description: "Create an advanced fill-in-the-blanks text with specific feedback for each error.",
  h5p_chart_name: "Chart",
  h5p_chart_description: "Create a pie or bar chart to visualize data.",

  // ============================================================================
  // ÉLÉA/MOODLE ACTIVITIES - DETAILS
  // ============================================================================
  moodle_xml_name: "Quiz",
  moodle_xml_description: "Generate a question bank to import directly into a Quiz activity (in XML or GIFT format)",
  moodle_xml_help: "To add an XML file to a 'Quiz' activity in Moodle, start by creating the activity. Then, open the <strong>More</strong> menu and go to <strong>Question bank</strong>. In this menu, click <strong>Import</strong>, choose the <strong>Moodle XML</strong> format, then select your file and confirm.",
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
  glossaire_success_generation: "File {fileName} generated successfully!",
  glossaire_error_creation: "Error creating glossary XML:",
  glossaire_error_invalid_json: "The JSON must contain a name ('name') and an array of entries ('entries').",
  elea_page_name: "Page",
  elea_page_description: "Create a visually formatted Éléa content page.",

  // ============================================================================
  // GENERATION MODAL
  // ============================================================================
  get_prompt_step: "1/2 Get the prompt",
  create_file_step: "2/2 Create the file",
  generate_one_click: "One-click generation",
  simple_mode: "Simple",
  advanced_mode: "Guided",
  prompt_for_ia: "Prompt for the IA",
  copy_prompt: "Copy the prompt",
  fullscreen_prompt: "Fullscreen",
  exit_fullscreen_prompt: "Exit fullscreen",
  lock_prompt: "Lock",
  unlock_prompt: "Unlock",
  go_duck: "Copy and go to Duck.ai",
  go_mistral: "Copy and go to Le chat",
  create_h5p_file: "Create H5P file",
  integrate_h5p_libraries: "Integrate H5P libraries:",
  paste_ia_result: "Paste the AI result in the area below to create your module.",
  generate_h5p: "Generate H5P",
  create_xml_file: "Create XML file",
  paste_ia_result_xml: "Paste the AI-generated XML below.",
  generate_xml_file: "Generate XML file",
  export_mbz: "MBZ Format",
  export_gift: "GIFT Format",
  export_xml: "XML Format",
  export_html: "HTML Format",
  export_docx: "DOCX Format",
  export_odt: "ODT Format",
  export_pdf: "PDF Format",
  export_error: "Error during export",
  create_mbz_file_appariement: "Create Matching file (.mbz)",
  paste_ia_result_appariement: "Paste the AI-generated JSON below. The activity title will be automatically extracted from the JSON.",
  generate_mbz_appariement: "Generate Matching activity (mbz)",
  create_mbz_file_millionnaire: "Create Millionaire file (.mbz)",
  paste_ia_result_millionnaire: "Paste the AI-generated JSON below. The activity title will be automatically extracted from the JSON.",
  generate_mbz_millionnaire: "Generate Millionaire activity (mbz)",
  generate_mbz_test: "Generate Test activity (mbz)",
  create_mbz_file_qcm: "Create MCQ file (.mbz)",
  paste_ia_result_qcm: "Paste the AI-generated JSON below. The activity title will be automatically extracted from the JSON.",
  generate_mbz_qcm: "Generate MCQ activity (mbz)",
  create_mbz_file_page: "Create Page file (.mbz)",
  paste_ia_result_page: "Paste the AI-generated JSON below to build the page.",
  generate_mbz_page: "Generate Page activity (mbz)",
  generate_prompts_placeholder: "The AI prompt will appear here once you have completed at least one field in Quick or Guided mode.",
  paste_json_or_text: "Paste the JSON content or text generated by the AI here to create your activity.",
  info_prompt_copy: "Do not paste this prompt in the right panel. Copy it to a public AI to get the result, then paste that result in the right panel.",
  generate_with_llm: "Generate with Caramel AI",
  generation_in_progress: "Generation in progress, please wait...",
  request_sent_to_ia: "Request sent to AI, please wait...",
  generation_successful: "H5P content generated successfully!",
  generation_failed_empty: "Generation failed. The response was empty.",
  generation_failed_error: "Error during generation: {errorMessage}",
  generation_failed_llm: "Caramel AI generation failed. Cause: {errorMessage}",
  llm_small_summary: "Soft Caramel: fast, light, perfect for flash exercises and quick answers. Low consumption.",
  llm_large_summary: "Runny Caramel: richer, more nuanced, ideal for tasks requiring some depth. Higher consumption.",
  llm_xl_summary: "Hard Caramel: powerful and complex, for ambitious projects. Patience required, guaranteed result! Much higher consumption.",
  llm_model_source: "Model provider:",
  llm_model_parameters: "Model size:",
  llm_model_parameters_unit: "B parameters",

  // ============================================================================
  // CARAMEL ANIMATION
  // ============================================================================
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
  caramel_success_title: "Your treat is ready!",

  // ============================================================================
  // NOTIFICATIONS AND ERRORS
  // ============================================================================
  prompts_generated_successfully: "Prompts generated successfully!",
  success_copy: "✓ Copied !",
  error_please_fill_fields: "Please fill in at least one field in Quick Mode.",
  error_please_fill_guided_fields: "Please fill in at least one field in Guided Mode.",
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
  error_paste_json_content: "Please paste the generated JSON content.",
  error_paste_xml_content: "Please paste the generated XML content.",
  moodle_xml_success_generation: "File {fileName} generated successfully!",
  test_error_creation_mbz: "Error creating MBZ for Test:",
  test_success_generation: "File {fileName} generated successfully!",
  test_error_generic: "Error:",
  test_backup_log: "Backup automatically created by Caramel\n",
  millionnaire_error_compression_libs: "Compression libraries (Tar.js or fflate) are not loaded. Please check your internet connection or refresh the page.",
  millionnaire_error_invalid_json: "Invalid JSON structure. Ensure it contains a 'title' and a 'questions' array of 6 questions matching the example.",
  millionnaire_activity_intro: "Play this game to test your knowledge.",
  millionnaire_backup_log: "Backup automatically created by Caramel\n",
  millionnaire_success_generation: "File {fileName} generated successfully!",
  millionnaire_error_creation_mbz: "Error creating MBZ:",
  millionnaire_error_generic: "Error:",
  appariement_error_invalid_json: "Invalid JSON structure. Ensure it contains a 'title' and a 'pairs' array where each pair has a 'question' and an 'answer'.",
  appariement_activity_intro: "Find the matching pairs.",
  appariement_success_generation: "File {fileName} generated successfully!",
  appariement_error_creation_mbz: "Error creating MBZ for matching:",
  qcm_error_invalid_json: "Invalid JSON structure. Ensure it contains a 'title' and a 'questions' array with at least one question and answers.",
  qcm_activity_intro: "Answer the following questions.",
  qcm_success_generation: "File {fileName} generated successfully!",
  qcm_error_creation_mbz: "Error creating MBZ for MCQ:",
  version_modal_title: "New version available",
  version_modal_message: "You are currently using version {currentVersion}. A fresher build ({latestVersion}) is already online. Reload the page to get the latest improvements.",
  version_modal_update: "Load the latest version",
  version_modal_remind_later: "Remind me later",

  prompt_header_pedagogical_context: "PEDAGOGICAL CONTEXT",
  prompt_header_specific_rules: "SPECIFIC RULES",
  prompt_header_pedagogical_rules: "PEDAGOGICAL RULES",
  prompt_header_sources: "SOURCES",
  prompt_header_json_structure: "EXPECTED JSON STRUCTURE",
  prompt_header_rendering_example: "RENDERING EXAMPLE",
  prompt_fallback_teacher: "a teacher",
  prompt_fallback_activity: "create a pedagogical activity",

  // ============================================================================

  // --- COMMON KEYS ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- Your role: [QUI]. Expert in didactics and instructional design
- Your objective: [QUOI]
- Your audience: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Adaptation and vocabulary: Adapt the tone, vocabulary, and difficulty of the instructions to the indicated audience. Be relevant and engaging.
- Tone and feedback: Instructions and remarks must be constructive, encouraging, and learning-oriented.
- Compliance: MANDATORILY adapt content to current official references. Unless explicitly stated otherwise, default to the local educational curriculum for schools, and vocational training regulations for adults.
- Language: Content and instructions must be written in the target language (English unless specified otherwise).`,

  SOURCES_COMMUNES: `- You must ONLY use the following texts to generate your activity.
---
[RAG]
---`,

  // ============================================================================
  // === TIMELINE ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Number of events: At least 5 events || [NOMBRE_ELEMENTS] events.
- Periods (era): At least 2 periods covering groups of events.
- Media: Add credits and captions for each asset if possible. Actively search for a relevant and royalty-free image (e.g., Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- **Root object:** Contains the key \`timeline\` (object).
- **Content of \`timeline\`:** Main structure of the activity.
  - \`headline\`: General title of the timeline (required plain text).
  - \`text\`: Captivating introduction (Markdown supported).
  - \`asset\`: Cover media (\`media\`: direct URL, \`caption\`: caption, \`credit\`: source).
  - \`date\`: Array of chronological events.
  - \`era\`: Array of background periods (define colored ranges in the background).
- **Structure of \`date\` and \`era\` objects:**
  - \`startDate\`: **Strict format** \`YYYY,MM,DD\` or \`YYYY\`. (Required)
  - \`endDate\`: **Strict format** \`YYYY,MM,DD\` or \`YYYY\`. (Optional, defines duration/end of period)
  - \`headline\`: Explicit title of the item (required plain text).
  - \`text\`: Pedagogical narration. Use \`**word**\` for bold, \`*word*\` for italics, and \`\\n\` for line breaks.
  - \`asset\`: (Optional) Media object (\`media\`: direct Wikimedia Commons URL, \`caption\`, \`credit\`).
  - \`tag\`: Short keyword (e.g., 'Politics', 'Science') allowing filtering.
- **LaTeX:** Use double escaping: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "The History of Space Exploration",
    "text": "Discover the major milestones that marked man's adventure in **space**.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Launch of the Apollo 11 mission.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Launch of Sputnik 1",
        "text": "The **first artificial satellite** is put into orbit by the USSR.",
        "tag": "Robotics"
      },
      {
        "startDate": "1969,07,20",
        "headline": "First Step on the Moon",
        "text": "Neil Armstrong becomes the first man to walk on the Moon during the **Apollo 11** mission.",
        "tag": "Human"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "The Space Race",
        "text": "Period of intense rivalry between the United States and the USSR.",
        "tag": "Context"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === CROSSWORD ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Number of words: At least 6 words || [NOMBRE_ELEMENTS] words.
- Typographical rules: Answers (\`answer\`) must contain only letters. Any compound word, acronym, or expression must be merged into a single word without spaces, hyphens, or other characters (e.g., 'ice-cream' becomes 'icecream', 'D-DAY' becomes 'DDAY').
- Clues (\`clue\`): It is forbidden to write the word to be found in the clue. They must be short and precise.
- Extra clue (\`extraClue\`): The AI must judge the relevance of adding one.`,

  CROSSWORD_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`title\`: A title for the activity.
- \`words\`: An array of objects containing:
  - \`answer\`: The word to guess (merged without spaces or hyphens).
  - \`clue\`: Short and precise definition.
  - \`extraClue\` (optional): An object \`{"params": {"text": "..."}}\`. The text can use \`**word**\` for bold, \`*word*\` for italics, and \`\\n\` for line breaks.
- \`taskDescription\`: A clear and contextualized instruction. Use \`**word**\` for bold, \`*word*\` for italics, and \`\\n\` for line breaks. After a line break, specify: "For compound words, do not use spaces or hyphens (e.g. 'keychain' for 'key-chain')."
- \`overallFeedback\`: (STRICT RULE) You must mandatorily generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the following score ranges: 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Biology Crossword",
  "words": [
    {"answer": "Cell", "clue": "Basic unit of life.", "extraClue": {"params": {"text": "It can be **animal** or **plant**."}}},
    {"answer": "DNA", "clue": "Molecule carrying genetic information."}
  ],
  "taskDescription": "**Complete** the grid with biology terms.\\nFor compound words, do not use spaces or hyphens (e.g. 'keychain' for 'key-chain').",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Effort is needed to fully understand these biology concepts."},
    {"from": 11, "to": 30, "feedback": "You're almost there, keep trying to consolidate your knowledge."},
    {"from": 31, "to": 50, "feedback": "Good start, but some points remain to be clarified."},
    {"from": 51, "to": 70, "feedback": "Good job! You understood the essentials of the subject."},
    {"from": 71, "to": 90, "feedback": "Very good score! You master the covered concepts well."},
    {"from": 91, "to": 100, "feedback": "Excellent! You have a perfect mastery of this lesson."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Number of cards: At least 5 cards || [NOMBRE_ELEMENTS] cards.
- Association: Front and back must be linked by a unique and stable criterion (e.g., definition -> term, event -> date, author -> work). Use the same relationship for all cards and formulate the instruction as: "Match each X to Y".`,

  FLASHCARDS_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The object must contain:
  - \`title\`: A relevant title for the activity.
  - \`description\`: A clear instruction for the student.
  - \`cards\`: An array of objects, where each object represents a flashcard and contains:
    - \`text\`: The question or term to guess (front).
    - \`answer\`: Answer or definition (back). Normalization rules: a single simple word or a number (no compound words), lowercase (except proper nouns), no articles or punctuation, numbers in digits.
    - \`tip\` (optional): Clue to help the student. You can use \`**word**\` for bold and \`*word*\` for italics.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Capital Cities of Europe",
  "description": "Match each country to its capital.",
  "cards": [
    {
      "text": "France",
      "answer": "paris",
      "tip": "It is the city of the **Eiffel Tower**."
    },
    {
      "text": "Spain",
      "answer": "madrid",
      "tip": "Located in the center of the *Iberian* peninsula."
    },
    {
      "text": "Italy",
      "answer": "rome",
      "tip": "Nicknamed the *Eternal City*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Keywords: At least 5 keywords or expressions expected in the response || [NOMBRE_ELEMENTS] keywords.
- Instruction: The instruction must not list the expected keywords to avoid giving away the answer, except for the name of the general theme.`,

  ESSAY_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
The object must contain:
- \`taskDescription\`: A clear instruction inviting the student to write a text on the topic. Use \`**word**\` for bold (key concepts), \`*word*\` for italics, and \`\\n\` for line breaks.
- \`keywords\`: An array of objects defining the expected keywords. Each object must have the form:
  \`\`\`json
  {
    "keyword": "word or expression",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (STRICT RULE) You must mandatorily generate an array of 6 objects for the final feedback, contextualized to the exercise theme, strictly respecting the following score ranges: 0-10, 11-30, 31-50, 51-70, 71-90, and 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Write a short text explaining the process of **photosynthesis**. Your answer must address the essential elements allowing plants to produce their own energy.",
  "keywords": [
    {"keyword": "light", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "chlorophyll", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "carbon dioxide", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "water", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glucose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "It's a start. Review the lesson on photosynthesis." },
    { "from": 11, "to": 30, "feedback": "You identified some elements. Keep up the effort." },
    { "from": 31, "to": 50, "feedback": "Your understanding is progressing. Think about detailing more." },
    { "from": 51, "to": 70, "feedback": "Good job! You master the basics." },
    { "from": 71, "to": 90, "feedback": "Very good! Your writing shows solid understanding." },
    { "from": 91, "to": 100, "feedback": "Excellent! You have perfect mastery of the subject." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (Glossary H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Number of entries: At least 5 terms || [NOMBRE_ELEMENTS] terms.
- Selection of terms: Identify technical concepts, specific vocabulary, or complex words present in the sources.
- Definitions: Concise, precise, and perfectly adapted to the targeted pedagogical level.`,

  ACCORDION_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The generated JSON must be an ARRAY with as many objects as terms mentioned previously.
- \`title\`: The keyword, expression, or question to define.
- \`text\`: The definition. Use \`**word**\` for bold, \`*word*\` for italics, and \`\\n\` for line breaks. For mathematical formulas, use LaTeX format with double escaping, e.g., \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Photosynthesis", "text": "Process by which plants transform **light** from the **sun** into energy.\\nIt is the basis of the food chain."},
  {"title": "Cell", "text": "Basic **unit** of all living beings. There are *eukaryotes* and *prokaryotes*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Number of steps: Generate a table of at least 5 steps || [NOMBRE_ELEMENTS] steps to cover the entire topic.
- Distractors: Propose at least 2 distractors per step. They must be consistent with the topic but contain plausible factual or logical errors.`,

  SUMMARY_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`intro\`: A short introductory sentence (e.g., "Choose the correct statement.").
- \`summaries\`: Array of objects constituting the steps. Each object contains:
  - \`summary\`: AN array of sentences (**Association**). The first sentence of the list must ALWAYS be the correct summary (exact statement).
  - \`tip\`: (Optional) A contextual clue to help the student.
- \`overallFeedback\`: Array of 6 objects for final score (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Use double escaping for LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Select the correct statements to build the course summary.",
  "summaries": [
    {
      "summary": [
        "Photosynthesis is a biological process allowing plants to transform light energy into chemical energy.",
        "Photosynthesis is a process that occurs only at night.",
        "Photosynthesis is the mechanism by which animals breathe."
      ],
      "tip": "Think of light as an energy source."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Effort is needed to fully understand these concepts." },
    { "from": 11, "to": 30, "feedback": "You're almost there, keep trying." },
    { "from": 31, "to": 50, "feedback": "Good start, but some points remain to be clarified." },
    { "from": 51, "to": 70, "feedback": "Good job! You understood the essentials." },
    { "from": 71, "to": 90, "feedback": "Very good score! You master the concepts well." },
    { "from": 91, "to": 100, "feedback": "Excellent! You have perfect mastery of this lesson." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Number of words: Paragraph of at least 50 words with at least 5 words to drag || [NOMBRE_ELEMENTS] words.
- Uniqueness: Each draggable word must be UNIQUE in the text (no duplicates).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
The object must contain:
- \`taskDescription\`: A clear instruction.
- \`textField\`: The text to complete. Each sentence must end with a line break \`\\n\`.
  - **Format**: \`*word*\` for a draggable item.
- \`overallFeedback\`: Array of 6 objects for final score (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complete the text by dragging the words.",
  "textField": "The *solar system* is composed of *eight* planets orbiting the *Sun*.\\nThe largest planet is *Jupiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Effort is needed." },
    { "from": 11, "to": 30, "feedback": "You're almost there." },
    { "from": 31, "to": 50, "feedback": "Good start." },
    { "from": 51, "to": 70, "feedback": "Good job!" },
    { "from": 71, "to": 90, "feedback": "Very good score!" },
    { "from": 91, "to": 100, "feedback": "Excellent!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Number of blanks: Paragraph of at least 50 words with at least 3 blanks || [NOMBRE_ELEMENTS] words.
- Balance: Do not create blanks on trivial words (articles, prepositions) unless focused on grammar. Target key concepts.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
The object must contain:
- \`taskDescription\`: A clear and short instruction explaining the activity's goal within the global context. Use \`**word**\` for bold (key concepts), \`*word*\` for italics, and \`\\n\` for line breaks.
- \`questions\`: An array of strings. Each string represents a text block to complete.
  - **Blank syntax**: Surround words to guess with asterisks (e.g., \`*word*\`).
  - **Alternatives**: Use \`/\` for multiple accepted answers (e.g., \`*word1/word2*\`).
  - **Tip**: Use \`:\` to add a pedagogical tooltip (e.g., \`*word:clue*\`).
- \`overallFeedback\`: (STRICT RULE) You must mandatorily generate an array of 6 objects for final feedback (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Fill in the blanks in the text below about the solar system.",
  "questions": [
    "Earth is a *planet* of the *solar* system.",
    "It orbits the *Sun:our star* in about 365 days."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Effort is needed to fully understand these concepts."},
    {"from": 11, "to": 30, "feedback": "You're almost there, keep trying to consolidate your knowledge."},
    {"from": 31, "to": 50, "feedback": "Good start, but some points remain to be clarified."},
    {"from": 51, "to": 70, "feedback": "Good job! You understood the essentials of the subject."},
    {"from": 71, "to": 90, "feedback": "Very good score! You master the covered concepts well."},
    {"from": 91, "to": 100, "feedback": "Excellent! You have a perfect mastery of this lesson."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Number of words: Paragraph of at least 50 words with at least 5 words to highlight || [NOMBRE_ELEMENTS] words.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
The object must contain:
- \`taskDescription\`: A clear and engaging instruction. You can use \`**word**\` for bold and \`*word*\` for italics only here.
- \`textField\`: The full text containing words to mark.
  - **MARKING:** Each word to mark must be INDIVIDUALLY surrounded by asterisks. (Ex: \`*word1* *word2*\` is correct; \`*word1 word2*\` is incorrect).
  - **PUNCTUATION:** Apostrophes or punctuation marks MUST NEVER be part of the marking and must be separated from the word by a space. (Ex: Writing \`l' *oiseau*\` is correct, \`l'*oiseau*\` is incorrect).
- \`overallFeedback\`: (STRICT RULE) You must mandatorily generate an array of 6 objects for final feedback (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Click on the **proper nouns** in the following text.",
  "textField": "*Paris* is the capital of *France*. It is *Europe* that interests us.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Effort is needed to fully understand these concepts."},
    {"from": 11, "to": 30, "feedback": "You're almost there, keep trying to consolidate your knowledge."},
    {"from": 31, "to": 50, "feedback": "Good start, but some points remain to be clarified."},
    {"from": 51, "to": 70, "feedback": "Good job! You understood the essentials of the subject."},
    {"from": 71, "to": 90, "feedback": "Very good score! You master the covered concepts well."},
    {"from": 91, "to": 100, "feedback": "Excellent! You have a perfect mastery of this lesson."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Question: A clear and unambiguous statement.
- Answer: The answer must be strictly "true" or "false".
- Feedbacks: Provide specific messages for success (\`feedbackOnCorrect\`) and failure (\`feedbackOnWrong\`) to reinforce learning.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The main object must contain the following keys:
  - \`question\`: (string) The statement to evaluate. Can contain HTML.
  - \`correct\`: (string) The correct answer, either "true" or "false".
  - \`feedbackOnCorrect\`: (string) Comment displayed if the answer is correct.
  - \`feedbackOnWrong\`: (string) Comment displayed if the answer is incorrect.
- **Formatting:** Use Markdown syntax for bold (\`**text**\`) and italics (\`*text*\`).
- **LaTeX:** For mathematical formulas, use EXCLUSIVELY LaTeX format encapsulated by double escaping: \`\\\\( ... \\\\)\`. NEVER use the \`$\` sign alone.
- **Feedback:** Feedback MUST NOT contain LaTeX or Markdown.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo is the capital of Norway.",
  "correct": "true",
  "feedbackOnCorrect": "Correct answer! Oslo is indeed the capital of Norway.",
  "feedbackOnWrong": "Wrong answer. The capital of Norway is Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Question: A clear multiple-choice question.
- Answers: Provide several answer choices (\`answers\`). There must be only one correct answer (\`"correct": true\`) and several plausible distractors (\`"correct": false\`).
- Feedbacks:
  - \`overallFeedback\`: (STRICT RULE) You must mandatorily generate an array of 6 objects for final feedback (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The main object must contain the following keys:
  - \`question\`: (string) The question statement. Can contain HTML.
  - \`answers\`: (array) Array of objects, each representing an answer.
    - \`text\`: (string) The answer text.
    - \`correct\`: (boolean) \`true\` if it is a correct answer, \`false\` otherwise.
    - \`tipsAndFeedback\`: (object, optional) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (array) Array of 6 objects defining feedbacks by score range.
- **Formatting:** Use Markdown syntax for bold (\`**text**\`) and italics (\`*text*\`).
- **LaTeX:** For mathematical formulas, use EXCLUSIVELY LaTeX format encapsulated by double escaping: \`\\\\( ... \\\\)\`. NEVER use the \`$\` sign alone.
- **Feedback:** Feedback MUST NOT contain LaTeX or Markdown.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "What is the real color of blackcurrant berries?",
  "answers": [
    {"text": "Very dark purple", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exactly!" }},
    {"text": "Blue", "correct": false, "tipsAndFeedback": { "chosenFeedback": "No, it's darker." }},
    {"text": "Black", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Effort is needed." },
    { "from": 11, "to": 30, "feedback": "You're almost there." },
    { "from": 31, "to": 50, "feedback": "Good start." },
    { "from": 51, "to": 70, "feedback": "Good job!" },
    { "from": 71, "to": 90, "feedback": "Very good score!" },
    { "from": 91, "to": 100, "feedback": "Excellent!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Number of words: At least 6 words || [NOMBRE_ELEMENTS] words.
- Typographical rules: Words must not contain accents, numbers, punctuation marks, or spaces.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`taskDescription\`: Instruction for the student.
- \`wordList\`: List of words to find separated by commas (without spaces).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Find the hidden words in the grid.",
  "wordList": "CELL,DNA,GENE,NUCLEUS"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Number of steps: Minimum 3 steps or paragraphs to sort || [NOMBRE_ELEMENTS] steps.
- Intrinsic logic: The paragraphs (\`paragraphs\`) must form a logical progression inferable from the content itself.
- Prohibition of artificial clues: You must NEVER use numbering (1, 2, 3...), explicit time markers (dates, times), or overly simplistic logical connectors ("First", "Then", "Finally"), unless the user explicitly asks for it.
- Thread: Each paragraph must advance a single common thread (e.g., causal chain, general to specific, or preparation → action → result sequence). The order must be deductible by understanding the meaning.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`taskDescription\`: A clear instruction (Markdown supported).
- \`paragraphs\`: An array of strings (paragraphs) initially presented in the **correct** logical order in the JSON. Use \`**word**\` for bold, \`*word*\` for italics.
- \`overallFeedback\`: Array of 6 objects for final score (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Use double escaping for LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Put these elements back in order to reconstruct the causal chain of global warming.",
  "paragraphs": [
    "Human activities, mainly burning fossil fuels, release massive amounts of **carbon dioxide** into the atmosphere.",
    "This surplus gas reinforces the natural greenhouse effect, preventing part of the infrared radiation from leaving the Earth.",
    "The trapped energy causes a gradual increase in the average temperature of the air and oceans.",
    "This global warming leads to melting glaciers and a worrying rise in sea levels."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "The causal logic needs review." },
    { "from": 11, "to": 30, "feedback": "You have some understanding, re-read the text." },
    { "from": 31, "to": 50, "feedback": "Good start in ordering." },
    { "from": 51, "to": 70, "feedback": "Good analysis of logical progression." },
    { "from": 71, "to": 90, "feedback": "Very good structuring work!" },
    { "from": 91, "to": 100, "feedback": "Perfect! The logical structure is mastered." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Number of questions: At least 3 questions || [NOMBRE_ELEMENTS] questions.
- Answers: Propose 2 to 3 distractors per question. The first answer in the \`answers\` list must always be the correct one.
- Distractors: Consistent but containing plausible logical or factual errors.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`choices\`: Array of objects constituting the questions. Each object contains:
  - \`question\`: The question statement.
  - \`answers\`: Array of strings (answers) where the first one is always the correct answer.
- \`overallFeedback\`: Array of 6 objects for final score (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Use double escaping for LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "What is the main gas responsible for the greenhouse effect?",
      "answers": ["Carbon dioxide", "Oxygen", "Nitrogen", "Argon"]
    },
    {
      "question": "What is the capital of France?",
      "answers": ["Paris", "Lyon", "Marseille", "Bordeaux"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Effort is needed." },
    { "from": 11, "to": 30, "feedback": "You're almost there." },
    { "from": 31, "to": 50, "feedback": "Good start." },
    { "from": 51, "to": 70, "feedback": "Good job!" },
    { "from": 71, "to": 90, "feedback": "Very good score!" },
    { "from": 91, "to": 100, "feedback": "Excellent!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Number of cards: At least 3 cards (OR in advanced mode [NOMBRE_ELEMENTS] cards).
- Association principle: Front and back must be linked by a unique and stable criterion (e.g., definition -> term, event -> date, author -> work).
- Instruction: The activity description must follow the formula: "Match each [X] to its [Y]".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The root object MUST contain \`title\`, \`description\`, and \`dialogs\`.
- 1. \`title\`: Title of the activity (Simple text, **no** Markdown or HTML).
- 2. \`description\`: The instruction or description (HTML format or simple text).
- 3. \`dialogs\`: The array of card associations: Front (text) and Back (answer).
- 4. \`text\`: Card front. Use \`**word**\` for bold and \`*word*\` for italics.
- 5. \`answer\`: Card back. It must be short. Use \`**word**\` for bold and \`*word*\` for italics.
- 6. \`tips\` (optional): Add a clue for the front (\`front\`) and/or back (\`back\`) only if relevant. Simple text **without** formatting.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Irregular Verbs",
  "description": "Find the infinitive verb.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identify the past tense.", "back": "Base form."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Number of items: At least 5 comparison items (OR in advanced mode [NOMBRE_ELEMENTS] comparison items).
- Chart type: Choose between pie chart (\`pieChart\`) or bar chart (\`barChart\`) depending on pedagogical relevance.
- Labels and colors: Colors must contrast well for readability. Labels must be short and clear.`,

  CHART_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`graphMode\`: The chart type (\`pieChart\` or \`barChart\`).
- \`listOfTypes\`: An array of objects \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: The chart title.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Blueberries"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Raspberries"}
  ],
  "figureDefinition": "Favorite Fruits Chart"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (H5P Quiz) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Number of questions: Generate an array of at least 5 questions || [NOMBRE_ELEMENTS] questions.
- Variety: Choose the most suitable activity types among the following to vary the exercise:
  - **MCQ** (\`H5P.MultiChoice\` 1.16)
  - **Drag the words** (\`H5P.DragText\` 1.10)
  - **True/False** (\`H5P.TrueFalse\` 1.8)
  - **Fill in the blanks** (\`H5P.Blanks\` 1.14)
  - **Mark the words** (\`H5P.MarkTheWords\` 1.11)
  - **Essay / Open Question** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The root object must contain:
  - \`title\`: Activity title.
  - \`questions\`: An array of objects. Each object represents a question and must contain:
    - \`library\`: The exact library name and version (e.g., \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: An object containing a \`title\` key (short question title).
    - \`params\`: Question data.
  - \`overallFeedback\`: Global array of 6 objects for final QuizSet score.

**Details of \`params\` by type:**
1. **MCQ (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (array of objects with \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **True/False (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" or "false" as string)
3. **Fill in the blanks (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (array of strings with \`*word*\`)
4. **Drag the words (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (with \`*word*\`)
5. **Mark the words (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (with \`*word*\`)
6. **Essay (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (array of objects)

**Each question, except for those of type H5P.TrueFalse 1.8, must include its own \`overallFeedback\` (6 ranges).**
- **Formatting:** Use Markdown syntax for bold (\`**text**\`) and italics (\`*text*\`).
- **LaTeX:** For mathematical formulas, use EXCLUSIVEMENT LaTeX format encapsulated by double escaping: \`\\\\( ... \\\\)\`. NEVER use the \`$\` sign alone.
- **Feedback:** Feedback MUST NOT contain LaTeX or Markdown.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "General Science Knowledge",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomy - MCQ" },
      "params": {
        "question": "Which planet is closest to the Sun?",
        "answers": [
          { "text": "Mercury", "correct": true },
          { "text": "Venus", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "False."},
          {"from": 11, "to": 30, "feedback": "Insufficient."},
          {"from": 31, "to": 50, "feedback": "Average."},
          {"from": 51, "to": 70, "feedback": "Good."},
          {"from": 71, "to": 90, "feedback": "Very good."},
          {"from": 91, "to": 100, "feedback": "Excellent."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Biology - True/False" },
      "params": {
        "question": "DNA is a double helix.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Low score."},
    {"from": 11, "to": 30, "feedback": "Insufficient score."},
    {"from": 31, "to": 50, "feedback": "Average score."},
    {"from": 51, "to": 70, "feedback": "Good score."},
    {"from": 71, "to": 90, "feedback": "Very good score."},
    {"from": 91, "to": 100, "feedback": "Excellent score."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (H5P MCQ Quiz) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Number of questions: Generate an array of at least 5 questions || [NOMBRE_ELEMENTS] questions.
- Type: You must generate ONLY **MCQ** type questions (\`H5P.MultiChoice\` 1.16). No other type is allowed.
- MCQ quality:
  - Each question must have at least 3 answer options.
  - Depending on the nature of the question, you can propose one or multiple correct answers.
  - Distractors (wrong answers) must be plausible and relevant.
  - Avoid negative formulations in questions.
  - Vary the position of the correct answer(s).`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The root object must contain:
  - \`title\`: Activity title.
  - \`questions\`: An array of objects. Each object represents an MCQ question and must contain:
    - \`library\`: Always \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: An object containing a \`title\` key (short question title).
    - \`params\`: Question data.
  - \`overallFeedback\`: Global array of 6 objects for final QuizSet score.

**Details of \`params\` for MCQ (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: The question asked (string).
- \`answers\`: Array of objects with \`text\` (string) and \`correct\` (boolean).
- \`behaviour\`: Object with \`singleAnswer\`: \`true\` if single correct answer, \`false\` if multiple correct answers.

**Each question must include its own \`overallFeedback\` (6 ranges: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Formatting:** Use Markdown syntax for bold (\`**text**\`) and italics (\`*text*\`).
- **LaTeX:** For mathematical formulas, use EXCLUSIVELY LaTeX format encapsulated by double escaping: \`\\\\( ... \\\\)\`. NEVER use the \`$\` sign alone.
- **Feedback:** Feedback MUST NOT contain LaTeX or Markdown.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "MCQ Quiz - Science",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomy - Planets" },
      "params": {
        "question": "Which planet is closest to the Sun?",
        "answers": [
          { "text": "Venus", "correct": false },
          { "text": "Mars", "correct": false },
          { "text": "Mercury", "correct": true },
          { "text": "Jupiter", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorrect."},
          {"from": 11, "to": 30, "feedback": "Insufficient."},
          {"from": 31, "to": 50, "feedback": "Average."},
          {"from": 51, "to": 70, "feedback": "Good."},
          {"from": 71, "to": 90, "feedback": "Very good."},
          {"from": 91, "to": 100, "feedback": "Excellent!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Biology - Organelles" },
      "params": {
        "question": "Which organelles have their own DNA?",
        "answers": [
          { "text": "Ribosome", "correct": false },
          { "text": "Mitochondrion", "correct": true },
          { "text": "Golgi apparatus", "correct": false },
          { "text": "Chloroplast", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Incorrect."},
          {"from": 11, "to": 30, "feedback": "Insufficient."},
          {"from": 31, "to": 50, "feedback": "Average."},
          {"from": 51, "to": 70, "feedback": "Good."},
          {"from": 71, "to": 90, "feedback": "Very good."},
          {"from": 91, "to": 100, "feedback": "Excellent!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Low score. Review the basics."},
    {"from": 11, "to": 30, "feedback": "Insufficient score. Keep working."},
    {"from": 31, "to": 50, "feedback": "Average score. You're progressing."},
    {"from": 51, "to": 70, "feedback": "Good score. You master several concepts."},
    {"from": 71, "to": 90, "feedback": "Very good score. You're on the right track."},
    {"from": 91, "to": 100, "feedback": "Excellent score. Congratulations!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P True/False Quiz) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Number of questions: Generate an array of at least 5 questions minimum || [NOMBRE_ELEMENTS] questions.
- Type: You must generate ONLY **True/False** type questions (\`H5P.TrueFalse\` 1.8). No other type is allowed.
- Question quality:
  - Assertions must be clear and unambiguous.
  - Avoid double negatives.
  - Vary between true and false assertions.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- The root object must contain:
  - \`title\`: Activity title.
  - \`questions\`: An array of objects. Each object represents a question and must contain:
    - \`library\`: Always \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: An object containing a \`title\` key (short question title).
    - \`params\`: Question data.
  - \`overallFeedback\`: Global array of 6 objects for final QuizSet score: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Details of \`params\` for True/False (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: The assertion or question asked (string).
- \`correct\`: The correct answer. MUST be a string: "true" or "false".
- **Formatting:** Use Markdown syntax for bold (\`**text**\`) and italics (\`*text*\`).
- **LaTeX:** For mathematical formulas, use EXCLUSIVEMENT LaTeX format encapsulated by double escaping: \`\\\\( ... \\\\)\`. NEVER use the \`$\` sign alone.
- **Feedback:** Feedback MUST NOT contain LaTeX or Markdown.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "True/False Quiz - Geography",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geography - Capitals" },
      "params": {
        "question": "The capital of Australia is Canberra.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geography - Continents" },
      "params": {
        "question": "Africa is the largest continent in the world.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Low score. Review the basics."},
    {"from": 11, "to": 30, "feedback": "Insufficient score. Keep working."},
    {"from": 31, "to": 50, "feedback": "Average score. You're progressing."},
    {"from": 51, "to": 70, "feedback": "Good score. You master several concepts."},
    {"from": 71, "to": 90, "feedback": "Very good score. You're on the right track."},
    {"from": 91, "to": 100, "feedback": "Excellent score. Congratulations!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Moodle/Éléa Test) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Number of questions: At least 10 questions || [NOMBRE_ELEMENTS] questions.
- Variety: Choose the most suitable question formats from the following:
  - **MCQ** (\`multichoice\`)
  - **Matching** (\`matching\`)
  - **Numerical** (\`numerical\`)
  - **True/False** (\`truefalse\`)
  - **Short Answer** (\`shortanswer\`)
  - **Cloze** (\`cloze\`)
- Distractors: Propose at least 3 distractors per \`multichoice\` question.`,

  ELEA_TEST_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.

The main object must contain the following keys:
- \`bank_name\`: A short and descriptive name for the question bank.
- \`bank_description\`: A phrase describing the content of the bank.
- \`questions\`: An array of objects where each object represents a question (\`type\`, \`content\`).
  - Each question must have a short and unique \`content.name\` (e.g., "Q1 - Topic").

**Formatting rules:**
- **Numbers**: use a dot for decimals (e.g., 12.34).
- **Cloze**: strictly respect the syntax \`{1:TYPE:=Correct answer~Wrong answer}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **For type \`multichoice\` (MCQ):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Q1 - Geography",
      "questiontext": "What is the capital of France?",
      "feedback": "Paris is the political and economic capital of France.",
      "answers": [
        { "text": "Paris", "fraction": 100, "feedback": "Exactly!" },
        { "text": "Lyon", "fraction": 0, "feedback": "No, Lyon is a large city but not the capital." },
        { "text": "Marseille", "fraction": 0, "feedback": "No, it is the second largest city in France." }
      ]
    }
  }
  \`\`\`

- **For type \`matching\` (Matching):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Q2 - French Vocabulary",
      "questiontext": "Match each English word to its French translation.",
      "feedback": "Well done, you master the basic vocabulary.",
      "subquestions": [
        { "text": "Dog", "answer": "Chien" },
        { "text": "Cat", "answer": "Chat" },
        { "text": "Bird", "answer": "Oiseau" }
      ]
    }
  }
  \`\`\`

- **For type \`numerical\` (Numerical):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Q3 - Mathematics",
      "questiontext": "What is the value of Pi rounded to two decimal places?",
      "feedback": "Pi is an irrational constant approximately equal to 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "It is indeed 3.14." }
    }
  }
  \`\`\`

- **For type \`truefalse\` (True/False):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Q4 - Science",
      "questiontext": "Water boils at 100°C at sea level.",
      "feedback": "It is a standard physical property of water.",
      "answer": { "value": true, "feedback_true": "True.", "feedback_false": "False, water does boil at 100°C at 1 atm." }
    }
  }
  \`\`\`

- **For type \`shortanswer\` (Short Answer):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Q5 - Literature",
      "questiontext": "Who wrote 'Les Misérables'?",
      "feedback": "It is one of the greatest novels of the 19th century.",
      "answers": [
        { "text": "Victor Hugo", "fraction": 100, "feedback": "Correct!" },
        { "text": "Hugo", "fraction": 100, "feedback": "Correct!" }
      ]
    }
  }
  \`\`\`

- **For type \`cloze\` (Cloze):**
  - Pay attention to the syntax: \`{1:SHORTANSWER:=Good~Bad}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Q6 - History",
      "questiontext": "Napoleon was born in {1:SHORTANSWER:=1769} in {1:MULTICHOICE:=Ajaccio~Bastia~Paris}.",
      "feedback": "Napoleon Bonaparte was born in Corsica."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Millionaire) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Number of questions: EXACTLY 6 questions (must not be changed).
- Progression: Question difficulty must be **increasing and pedagogical**. Important elements to memorize are placed in the first questions.
- Truthfulness: Content must be strictly accurate and relevant.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
A main object with the following keys:
- \`title\`: Activity title (String).
- \`questions\`: An array of EXACTLY 6 objects, where each object represents a question and contains:
  - \`question\`: The question statement (String).
  - \`goodanswer\`: The correct answer (String).
  - \`badanswer\`: An array of EXACTLY 3 wrong answers (Array of strings).
  - For mathematical formulas, LaTeX is forbidden.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "French Revolution Quiz",
  "questions": [
    {
      "question": "Which event marks the beginning of the French Revolution on July 14, 1789?",
      "goodanswer": "Storming of the Bastille",
      "badanswer": ["Tennis Court Oath", "Execution of Louis XVI", "Battle of Valmy"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Matching) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Number of pairs: At least 5 pairs || [NOMBRE_ELEMENTS] pairs.
- Logic: The relationship between the two elements must be obvious after reading the sources.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
A main object with the following keys:
- \`title\`: Activity title (String).
- \`intro\`: Short instruction or intro text (String).
- \`pairs\`: An array of objects, where each object represents a pair and contains:
  - \`question\`: The term or element on the left (String).
  - \`answer\`: The definition or corresponding element on the right (String).
  - For mathematical formulas, use LaTeX format with double escaping, e.g., \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "History Matching",
  "intro": "Match each date to the corresponding event of the French Revolution.",
  "pairs": [
    {"question": "Storming of the Bastille", "answer": "July 14, 1789"},
    {"question": "Abolition of privileges", "answer": "August 4, 1789"},
    {"question": "DDHC", "answer": "August 26, 1789"},
    {"question": "Women's March", "answer": "October 5, 1789"},
    {"question": "Fête de la Fédération", "answer": "July 14, 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (Éléa MCQ) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Number of questions: At least 5 questions || [NOMBRE_ELEMENTS] questions.
- Answers: Propose between 2 and 5 choices per question.
- Distractors: Consistent with the topic but containing logical errors.`,

  ELEA_QCM_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`title\`: Activity title.
- \`questions\`: Array of objects. Each question object must contain:
  - \`text\`: Question statement (can contain simple HTML like \`**\` for bold).
  - \`answers\`: Array of objects \`{"text": "...", "iscorrect": 1/0}\`. \`1\` for a correct answer, \`0\` otherwise.
  - For mathematical formulas, use LaTeX format with double escaping, e.g., \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "French Revolution MCQ",
  "questions": [
    {
      "text": "What is the date of the Storming of the Bastille?",
      "answers": [
        {"text": "July 14, 1789", "iscorrect": 1},
        {"text": "August 4, 1789", "iscorrect": 0},
        {"text": "August 26, 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (XML Glossary) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- Number of entries: At least 5 terms || [NOMBRE_ELEMENTS] terms.
- Selection: Identify keywords, acronyms, and technical concepts.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- **Root:** A main object containing two keys: \`name\` (glossary name) and \`entries\` (an array of objects).
- **Each object in \`entries\` must contain:**
  - \`concept\`: The word or expression to define.
  - \`definition\`: Clear and concise definition. Use **word** for bold, *word* for italics, and \`\\n\` for line breaks, only when pedagogically relevant.
  - \`aliases\` (optional): An array of strings for synonyms or alternative terms. Add this key only if relevant aliases exist.
  - For mathematical formulas, use LaTeX format with double escaping, e.g., \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Journalism Glossary",
  "entries": [
    {
      "concept": "Journalist",
      "definition": "Person who **collects** and distributes *information*.",
      "aliases": ["Reporter", "Chronicler"]
    },
    {
      "concept": "Source",
      "definition": "Origin of verified *information*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Éléa Page) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Structure: The page must contain at least 5 different blocks || [NOMBRE_ELEMENTS] blocks.
- Pedagogical logic: Contents must follow a coherent progression (e.g. Welcome -> Objectives -> Lesson -> Details/Lexicon -> References).
- Content balance: Mix formats to maintain engagement (text, tables, lists, callouts).
- Mandatory contents: Systematically include an opening header (\`#01_hero_header\`), objective or attention callouts (\`#04_callout_set\`), a lexicon for technical terms (\`#06_lexique_table\`), at least three paragraphs of substantial content (\`#12_context_paragraphs\`), and a reference list (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Generate ONLY a complete and valid JSON in a code block. Your response MUST start with \`{\` and end with \`}\`. No other text or comments.
- \`title\`: Page title (String).
- \`intro\`: Short engaging intro text (String).
- \`blocks\`: An array of objects, where each object represents a section of the page. Each block MUST respect one of the following structures:

**List of available blocks:**
- \`#01_hero_header\`: Opening header. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Summary with internal links. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Historical markers in 3 cards. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (max 3 cards)
- \`#04_callout_set\`: Objectives, Info, Alert banners. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Key figures in cards. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Vocabulary table. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Glossary chips. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Monument cards with images. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Two images compared.
- \`#10_table_comparison\`: Comparison table.
- \`#11_definition_box\`: Definition box. \`{ "type": "#11_definition_box", "data": { "title": "Definition", "text": "..." } }\`
- \`#12_context_paragraphs\`: Lesson paragraphs. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Detailed sheet.
- \`#14_faq_block\`: FAQ. \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Myths vs Realities.
- \`#17_method_image_desc\`: Method to describe an image.
- \`#18_sito_graphy\`: References. \`{ "type": "#18_sito_graphy", "data": { "title": "References", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Bilingual quote.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "The French Revolution",
  "intro": "Discover the key moments of this historical period.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "The Revolution", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Objectives",
        "callouts": [{"type": "objectif", "text": "Understand the causes of 1789."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "Tennis Court Oath",
        "paragraphs": [
          "On June 20, 1789, the Third Estate deputies gathered...",
          "This gesture marks the birth of the National Assembly.",
          "It is a major turning point towards the end of absolutism."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Vocabulary",
        "headers": ["Term", "Definition"],
        "rows": [["Third Estate", "The majority of the population..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Further reading",
        "links": [{"href": "https://...", "text": "Official History Site"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === H5P INTERFACE TRANSLATIONS (STANDARDIZED) ===
  // ============================================================================

  // Common keys
  h5p_check_answer: "Check",
  h5p_try_again: "Retry",
  h5p_show_solution: "Show solution",
  h5p_submit_answer: "Submit",
  h5p_score: "You got @score out of @total points",
  h5p_score_bar_label: "You got :num out of :total points",
  h5p_tip_label: "Tip",
  h5p_next: "Next",
  h5p_previous: "Previous",
  h5p_close: "Close",
  h5p_finish_header: "Finish?",
  h5p_finish_body: "Are you sure you wish to finish?",
  h5p_cancel_label: "Cancel",
  h5p_finish_label: "Finish",
  h5p_retry_header: "Retry?",
  h5p_retry_body: "Are you sure you wish to retry?",
  h5p_retry_confirm_label: "Confirm",
  h5p_resume: "Resume",
  h5p_audio_direction: "Audio direction",
  h5p_a11y_check: "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
  h5p_a11y_show_solution: "Show the solution. The task will be marked with its correct solution.",
  h5p_a11y_retry: "Retry the task. Reset all responses and start the task over again.",

  // Crossword
  h5p_crossword_across: "Across",
  h5p_crossword_down: "Down",
  h5p_crossword_extra_clue: "Extra clue",

  // Summary
  h5p_summary_intro: "Choose the correct statement.",
  h5p_summary_solved_label: "Progress:",
  h5p_summary_score_label: "Wrong answers:",
  h5p_summary_result_label: "Your result",
  h5p_summary_feedback: "You got @score out of @total correct statements (@percent%).",
  h5p_summary_label_correct: "Correct.",
  h5p_summary_label_incorrect: "Incorrect! Please try again.",
  h5p_summary_label_correct_answers: "Correct answers.",
  h5p_summary_progress_text: "Progress :num out of :total",
  h5p_summary_alternative_incorrect_label: "Incorrect",

  // Drag the Words
  h5p_drag_words_score_feedback: "Score: @score of @total.",
  h5p_drag_words_correct_text: "Correct!",
  h5p_drag_words_incorrect_text: "Incorrect!",

  // Fill in the Blanks
  h5p_blanks_not_filled_out: "Please fill in all blanks.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; is correct",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; is wrong",
  h5p_blanks_answered_correctly: "Answered correctly",
  h5p_blanks_answered_incorrectly: "Answered incorrectly",
  h5p_blanks_solution_label: "Correct answer:",
  h5p_blanks_input_label: "Blank input @num of @total",
  h5p_blanks_input_has_tip_label: "Tip available",
  h5p_blanks_feedback: "You got @score of @total blanks correct.",
  h5p_blanks_checking_mode_header: "Checking mode",

  // Mark the Words
  h5p_mark_words_correct_answer: "Correct!",
  h5p_mark_words_incorrect_answer: "Incorrect!",
  h5p_mark_words_missed_answer: "Missed!",
  h5p_mark_words_display_solution_description: "Task is updated to contain the solution.",
  h5p_mark_words_a11y_full_text_label: "Full readable text",
  h5p_mark_words_a11y_clickable_text_label: "Full text where words can be marked",
  h5p_mark_words_a11y_solution_mode_header: "Solution mode",
  h5p_mark_words_a11y_checking_header: "Checking mode",

  // Flashcards
  h5p_flashcards_progress_text: "Card @card of @total",
  h5p_flashcards_your_answer: "Your answer",
  h5p_flashcards_correct_answer: "Correct answer",
  h5p_flashcards_incorrect_answer: "Incorrect answer",
  h5p_flashcards_show_solution: "Correct answer",
  h5p_flashcards_results: "Results",
  h5p_flashcards_of_correct: "@score of @total correct",
  h5p_flashcards_show_results: "Show results",
  h5p_flashcards_answer_short: "A:",
  h5p_flashcards_card_announcement: "Incorrect answer. Correct answer was @answer",
  h5p_flashcards_correct_announcement: "@answer is correct.",
  h5p_flashcards_page_announcement: "Page @current of @total",

  // Essay
  h5p_essay_feedbackHeader: "Feedback",
  h5p_essay_solutionTitle: "Sample solution",
  h5p_essay_remainingChars: "Remaining characters: @chars",
  h5p_essay_notEnoughChars: "You must enter at least @chars characters!",
  h5p_essay_messageSave: "saved",
  h5p_essay_placeholderText: "In a hole in the ground there lived a hobbit ...",
  h5p_essay_ariaYourResult: "You got @score out of @total points",
  h5p_essay_ariaNavigatedToSolution: "Navigated to newly included sample solution after textarea.",

  // True/False
  h5p_true_false_true_text: "True",
  h5p_true_false_false_text: "False",
  h5p_true_false_wrong_answer_message: "Wrong answer",
  h5p_true_false_correct_answer_message: "Correct answer",

  // Find the Words
  h5p_find_words_found: "@found of @totalWords words found",
  h5p_find_words_time_spent: "Time spent",
  h5p_find_words_word_list_header: "Word list",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Sort the Paragraphs
  h5p_sort_paragraphs_up: "Up",
  h5p_sort_paragraphs_down: "Down",
  h5p_sort_paragraphs_disabled: "Disabled",
  h5p_sort_paragraphs_paragraph: "Paragraph",
  h5p_sort_paragraphs_point: "@score point",
  h5p_sort_paragraphs_seven_of_nine: "@current of @total",
  h5p_sort_paragraphs_current_position: "Current position in list",
  h5p_sort_paragraphs_instructions_selected: "Press spacebar to reorder",
  h5p_sort_paragraphs_instructions_grabbed: "Press up and down arrow keys to change position, spacebar to drop, escape to cancel",
  h5p_sort_paragraphs_grabbed: "Grabbed",
  h5p_sort_paragraphs_moved: "Moved",
  h5p_sort_paragraphs_dropped: "Dropped",
  h5p_sort_paragraphs_reorder_cancelled: "Reorder cancelled",
  h5p_sort_paragraphs_final_position: "Final position",
  h5p_sort_paragraphs_next_paragraph: "Next paragraph",
  h5p_sort_paragraphs_correct_paragraph: "Correct paragraph at position",
  h5p_sort_paragraphs_list_description: "Sortable list of paragraphs.",
  h5p_sort_paragraphs_list_description_check: "List of paragraphs with results.",
  h5p_sort_paragraphs_list_description_solution: "List of paragraphs with solutions.",

  // Single Choice Set
  h5p_single_choice_solution_view_title: "Solution",
  h5p_single_choice_mute_button_label: "Mute",
  h5p_single_choice_slide_of_total: "Slide @slide of @total",
  h5p_single_choice_solution_list_question_number: "Question @question",
  h5p_single_choice_should_select: "Should select",
  h5p_single_choice_should_not_select: "Should not select",

  // Dialog Cards
  h5p_dialog_cards_answer: "Turn",
  h5p_dialog_cards_progress_text: "Card @card of @total",
  h5p_dialog_cards_card_front_label: "Card front",
  h5p_dialog_cards_card_back_label: "Card back",
  h5p_dialog_cards_audio_not_supported: "Your browser does not support this audio format",
  h5p_dialog_cards_correct_answer: "I got it right!",
  h5p_dialog_cards_incorrect_answer: "I got it wrong",
  h5p_dialog_cards_round: "Round @round",
  h5p_dialog_cards_cards_left: "Cards left: @number",
  h5p_dialog_cards_next_round: "Proceed to round @round",
  h5p_dialog_cards_start_over: "Retry",
  h5p_dialog_cards_show_summary: "Next",
  h5p_dialog_cards_summary: "Summary",
  h5p_dialog_cards_summary_cards_right: "Cards you got right:",
  h5p_dialog_cards_summary_cards_wrong: "Cards you got wrong:",
  h5p_dialog_cards_summary_cards_not_shown: "Cards not shown:",
  h5p_dialog_cards_summary_overall_score: "Overall score",
  h5p_dialog_cards_summary_cards_completed: "Cards you have learned:",
  h5p_dialog_cards_summary_completed_rounds: "Completed rounds:",
  h5p_dialog_cards_summary_all_done: "Well done! You have completed all @cards cards @max times in a row!",

  // Quiz Set
  h5p_quiz_textual_progress: "Question @current of @total",
  h5p_quiz_no_result_message: "Finished",
  h5p_quiz_result_message: "Your results:",
  h5p_quiz_feedback_available: "Feedback available",
  h5p_quiz_read_feedback: "Read feedback",
  h5p_quiz_wrong_answer: "Wrong answer",
  h5p_quiz_correct_answer: "Correct answer",
  h5p_quiz_should_check: "Should have been checked",
  h5p_quiz_should_not_check: "Should not have been checked",
  h5p_quiz_no_input: "Please answer before viewing the solution.",

  // ============================================================================
  // === LEGAL MENTIONS - FOOTER ===
  // ============================================================================
  license_info: "GNU GPL v3.0 or later",
  ticket: "Ticket",
  legal_mentions: "Legal Mentions",
  legal_title: "Legal Mentions",
  legal_editor_title: "Application Editor",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Function:</strong> Vocational High School Teacher in Literature-History",
  legal_editor_gauthier_remande_email: "<strong>Email:</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Address:</strong> 39 avenue de Chanzy, 53000 Laval, France",
  legal_editor_gauthier_remande_phone: "<strong>Phone:</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Function:</strong> Mathematics teacher and DRANE mission officer – Academy of Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>Email:</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Address:</strong> 30 boulevard de la République, 38200 Vienne, France",
  legal_editor_emmanuel_gaunard_phone: "<strong>Phone:</strong> +33 6 46 74 20 94",
  legal_app_description: "The “Caramel” web application is a free, non-commercial project designed to create H5P and Éléa content. No account is required, and no personal data is collected.",
  legal_hosting_title: "Hosting",
  legal_host_name: "<strong>Host</strong>: Forge of Digital Educational Commons",
  legal_host_company: "<strong>Company name</strong>: Ministry of National Education and Youth",
  legal_host_address: "<strong>Address</strong>: 110 rue de Grenelle, 75007 Paris, France",
  legal_host_phone: "<strong>Phone</strong>: +33 1 55 55 10 10",
  legal_publication_director_title: "Publication Director",
  legal_publication_director_name: "Gauthier REMANDE and Emmanuel GAUNARD, as volunteer editors.",
  legal_terms_of_use_title: "General Terms of Use",
  legal_terms_of_use_content: "This site allows users to generate H5P and Éléa content. Display is performed locally, with no user data transmitted. Users are solely responsible for how they use the generated content. The application is provided free of charge, without any guarantee of operation or result. The publisher declines all liability in the event of misinterpretation of the content or inappropriate use.",
  legal_intellectual_property_title: "Intellectual Property",
  legal_intellectual_property_content: "All source codes, graphic elements, and content are licensed under the free GNU AGPLv3 license. Their reuse is permitted under the terms of their respective licenses. Any redistribution or modification must credit the original authors: Gauthier REMANDE and Emmanuel GAUNARD. The images used in the H5P modules are retrieved from H5P.org.",
  legal_personal_data_title: "Personal Data",
  legal_personal_data_content: "No personal data is collected or stored. No tracking cookies are used.",
  legal_ai_models_title: "Artificial Intelligence Models",
  legal_ai_models_content: "The Caramel application relies, only during one-click generation, on AI models operated by ILAAS, a federation of shared AI infrastructures. Requests are routed via an n8n workflow hosted by the Incubator, then sent to ILAAS for execution on trusted servers hosted in data centers labeled by the Higher Education and Research (ESR) sector. Caramel does not run the models and does not process or store data itself; data is used solely to fulfill the request and is not sent to public consumer AIs. The models currently offered include {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}), and {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Any hosting, logging, or retention performed by ILAAS is governed by their privacy policy and terms of service.",
  legal_user_requests_processing_title: "Processing of user requests via n8n and the Incubator of the Ministry of National Education",
  legal_user_requests_processing_content: "Our site uses a technical solution built with n8n, an open-source tool hosted by the Incubator of the Ministry of National Education. Through an automated workflow, this service transforms user requests into structured data (JSON format) to interact with a DINUM artificial intelligence, and is therefore sovereign. No sensitive information is exposed or transmitted without encryption, ensuring the confidentiality and security of exchanges.",
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
  legal_library_mammoth: "<strong>Mammoth</strong> (License: BSD 2-Clause): Converts Word documents (.docx) to HTML, facilitating the import and integration of content from Microsoft Word files.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (License: Apache 2.0): Extracts native text from PDF files directly in the browser, without requiring server-side processing.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (License: Apache 2.0): Optical character recognition (OCR) engine that extracts text from images (PNG, JPG, JPEG) and scanned PDF documents.",
  legal_library_mathjax: "<strong>MathJax</strong> (License: Apache 2.0): Used for rendering mathematical formulas (LaTeX) in previews.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (License: MIT): Allows previewing H5P content directly in the browser without requiring a server or CMS (like Moodle or WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (License: MIT): JavaScript library for generating PDF documents directly in the browser, used for exporting educational content to PDF format.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (License: MIT): Extension for jsPDF that enables generating structured tables in exported PDF documents.",
  legal_library_docx: "<strong>docx</strong> (License: MIT): JavaScript library for creating Word documents (.docx) in the browser, used for exporting educational content to Microsoft Word format.",
  legal_library_ownership: "Each library remains the property of its respective authors and is used in accordance with its license(s).",

  // ============================================================================
  // === NOTIFICATIONS ===
  // ============================================================================
  no_notifications: "No notifications",
  clear_all: "Clear all",
  view: "View",
  today: "Today",
  error: "Error",
  download: "Download",
  edit_content: "Edit",
  compatible_with: "Compatible with:",
  preview_placeholder: "Preview available soon",
  previous: "Previous",
  next: "Next",
  close_modal: "Close",
  loading: "Loading...",
  preview_error: "Unable to preview this file",
  simulator_warning: "Preview via activity simulator: final render on Éléa may slightly differ.",
  editor_confirm_close_title: "Unsaved Changes",
  editor_confirm_close_message: "Do you want to save your changes before leaving?",
  editor_confirm_close_cancel: "Stay in Editor",
  editor_confirm_close_save: "Save and Exit",
  editor_confirm_close_discard: "Exit without Saving",

  // JSON Editor
  editor_title_prefix: "Editing:",
  editor_loading: "Loading editor...",
  editor_unknown_type: "Unrecognized content type",
  editor_no_schema: "Schema not available for this type",
  editor_init_error: "Error initializing the editor",
  editor_save: "Save",
  editor_cancel: "Cancel",
  editor_unsaved_changes: "Unsaved changes",
  editor_confirm_discard: "Are you sure you want to cancel? Unsaved changes will be lost.",
  editor_validation_errors: "Validation errors",

  // Sections
  editor_section_general: "General Information",
  editor_section_question: "Question",
  editor_section_questions: "Questions",
  editor_section_answers: "Answers",
  editor_section_answer: "Answer",
  editor_section_feedback: "Feedback",
  editor_section_cards: "Cards",
  editor_section_sentences: "Sentences",
  editor_section_events: "Events",
  editor_section_words: "Words",
  editor_section_keywords: "Keywords",
  editor_section_entries: "Entries",
  editor_section_pairs: "Pairs",
  editor_section_text: "Text",

  // General Fields
  editor_title: "Title",
  editor_description: "Description",
  editor_description_hint: "Instruction displayed to students",
  editor_intro: "Introduction",
  editor_task_description: "Instruction",
  editor_question_text: "Question Text",

  // Cards
  editor_card: "Card",
  editor_card_front: "Front",
  editor_card_front_placeholder: "Question or term",
  editor_card_back: "Back",
  editor_card_back_placeholder: "Answer or definition",
  editor_card_tip: "Hint",
  editor_add_card: "Add a card",

  // Answers
  editor_answer: "Answer",
  editor_answer_text: "Answer text",
  editor_is_correct: "Correct",
  editor_add_answer: "Add an answer",

  // Tips & Feedback
  editor_tips_feedback: "Hints and Feedback",
  editor_tip: "Hint",
  editor_tip_optional: "Hint (optional)",
  editor_tips_optional: "Hints (optional)",
  editor_tip_front: "Front Hint",
  editor_tip_back: "Back Hint",
  editor_chosen_feedback: "Feedback if selected",
  editor_not_chosen_feedback: "Feedback if not selected",
  editor_feedback_correct: "Feedback if correct",
  editor_feedback_wrong: "Feedback if incorrect",
  editor_overall_feedback: "Overall feedback by score",

  // Feedback ranges
  editor_feedback_ranges_label: "Feedback based on score",
  editor_feedback_placeholder: "Feedback message for this range...",
  editor_add_range: "Add a range",

  // True/False
  editor_correct_answer: "Correct answer",
  editor_true: "True",
  editor_false: "False",

  // Fill in blanks / Drag words
  editor_sentence: "Sentence",
  editor_sentence_text: "Sentence text",
  editor_add_sentence: "Add a sentence",
  editor_blanks_hint: "Surround words to guess with *asterisks*",
  editor_text_with_blanks: "Text with words to place",
  editor_drag_words_hint: "Words between *asterisks* will be drag-and-drop elements",

  // Timeline
  editor_event: "Event",
  editor_add_event: "Add an event",
  editor_start_date: "Start date",
  editor_end_date: "End date",
  editor_event_title: "Event title",
  editor_event_description: "Description",
  editor_event_tag: "Tag",

  // Crossword
  editor_word: "Word",
  editor_add_word: "Add a word",
  editor_clue: "Clue/Definition",
  editor_orientation: "Orientation",
  editor_horizontal: "Horizontal",
  editor_vertical: "Vertical",
  editor_crossword_answer_hint: "The word in uppercase",

  // Essay
  editor_keyword: "Keyword",
  editor_keyword_text: "Expected keyword",
  editor_keyword_weight: "Weight",
  editor_add_keyword: "Add a keyword",

  // Glossary
  editor_entry: "Entry",
  editor_add_entry: "Add an entry",
  editor_term: "Term",
  editor_definition: "Definition",

  // Moodle
  editor_question: "Question",
  editor_add_question: "Add a question",
  editor_pair: "Pair",
  editor_add_pair: "Add a pair",
  editor_left_element: "Left element",
  editor_right_element: "Right element",
  editor_choice: "Choice",
  editor_choice_text: "Choice text",
  editor_add_choice: "Add a choice",

  // Item actions
  editor_add_item: "Add",
  editor_drag: "Drag",
  editor_duplicate: "Duplicate",
  editor_delete: "Delete",
  editor_confirm_delete: "Are you sure you want to delete this item?",
  editor_min_items_reached: "Minimum number of items reached",
  editor_max_items_reached: "Maximum number of items reached",

  // Validation errors
  editor_error_required: "This field is required",
  editor_error_min_length: "Minimum {0} characters",
  editor_error_max_length: "Maximum {0} characters",
  editor_error_pattern: "Invalid format",
  editor_error_min_items: "Minimum {0} item(s)",
  editor_error_max_items: "Maximum {0} item(s)",
  editor_error_number: "Must be a number",
  editor_error_min: "Minimum {0}",
  editor_error_max: "Maximum {0}",
  editor_error_feedback_ranges: "Ranges must cover 0-100% without overlap",
  editor_error_no_correct: "At least one answer must be correct",
  editor_error_date_format: "Invalid date format (expected: YYYY,M,D)",
  editor_error_no_blanks: "The text must contain at least one word between *asterisks*",

  // QuizSet
  editor_library_type: "Library Type",
  editor_question_title: "Question Title",
  editor_question_params: "Question Parameters",
  editor_parameters: "Parameters",

  // Crossword
  editor_extra_clue: "Extra hint",

  // FindTheWords
  editor_word_list: "Word list",

  // SingleChoiceSet
  editor_answers: "Possible answers",

  // MarkTheWords
  editor_text_with_marks: "Text with words to mark",
  editor_mark_words_hint: "Surround words to mark with *asterisks*",

  // SortParagraphs
  editor_section_paragraphs: "Paragraphs",
  editor_paragraph: "Paragraph",
  editor_add_paragraph: "Add a paragraph",
  editor_paragraph_text: "Paragraph text",

  // Summary
  editor_section_summaries: "Summaries",
  editor_summary_item: "Summary element",
  editor_add_summary_item: "Add an element",
  editor_statement: "Statement",
  editor_add_statement: "Add a statement",
  editor_statement_text: "Statement text",

  // Moodle Test
  editor_question_type: "Question type",

  // Moodle Page
  editor_section_blocks: "Blocks",
  editor_block: "Block",
  editor_add_block: "Add a block",
  editor_block_type: "Block type",
  editor_block_content: "Block content",

  // Specific Éléa activities
  // Glossary
  editor_glossary_name: "Glossary name",

  // Millionaire
  editor_good_answer: "Correct answer",
  editor_bad_answers: "Wrong answers",
  editor_bad_answer: "Wrong answer",
  editor_add_bad_answer: "Add a wrong answer",

  // Test (question bank)
  editor_bank_name: "Bank name",
  editor_bank_description: "Bank description",
  editor_question_name: "Question name",
  editor_question_feedback: "General feedback",
  editor_answer_fraction: "Points/Score",
  editor_answer_feedback: "Answer feedback",
  editor_subquestion: "Sub-question",
  editor_add_subquestion: "Add a sub-question",
  editor_numerical_value: "Numerical value",
  editor_numerical_tolerance: "Tolerance",
  editor_section_subquestions: "Sub-questions",
  editor_section_content: "Content",
  editor_feedback_if_true: "Feedback if true",
  editor_feedback_if_false: "Feedback if false",

  // Messages
  editor_save_success: "Changes saved",
  editor_save_error: "Error saving changes",
  editor_regenerating: "Regenerating file...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Page",
  doc_fmt_summary_header: "Table of Contents",
  doc_fmt_quiz_title: "Quiz",
  doc_fmt_instructions: "📝 Instructions: Answer the following questions.",
  doc_fmt_question_header: "Question",

  // --- Shared properties ---
  doc_fmt_type: "Type:",
  doc_fmt_feedbacks: "💬 Feedbacks:",
  doc_fmt_global_feedbacks: "Global Feedbacks",
  doc_fmt_answers: "Answers:",
  doc_fmt_correct_answer_true: "Correct answer: TRUE ✓",
  doc_fmt_correct_answer_false: "Correct answer: FALSE ✓",
  doc_fmt_text_if_true: "Text if true:",
  doc_fmt_text_if_false: "Text if false:",
  doc_fmt_text_with_answers: "Text with answers:",
  doc_fmt_text_with_marks: "Text with words to mark:",
  doc_fmt_marks_to_find: "Words to mark:",
  doc_fmt_keywords_expected: "Expected keywords:",
  doc_fmt_accepted_answers: "Accepted answers:",
  doc_fmt_text_to_complete: "Text to complete:",
  doc_fmt_also_called: "🏷️ Also called:",
  doc_fmt_image_not_found: "⚠️ [Image not found]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Flashcards",
  doc_fmt_card_index: "Card",
  doc_fmt_card_front: "Front:",
  doc_fmt_card_back: "Back:",
  doc_fmt_hint: "💡 Hint:",
  doc_fmt_crossword_title: "Crossword",
  doc_fmt_definitions_and_answers: "Definitions and answers",
  doc_fmt_answer: "Answer:",
  doc_fmt_extra_hint: "💡 Extra hint:",
  doc_fmt_timeline_events: "Events",
  doc_fmt_timeline_periods: "Periods",
  doc_fmt_drag_the_words_title: "Drag the Words",
  doc_fmt_fill_in_the_blanks_title: "Fill in the Blanks",
  doc_fmt_mark_the_words_title: "Mark the Words",
  doc_fmt_glossary_title: "Glossary",
  doc_fmt_term_index: "Term",
  doc_fmt_chart_title: "Chart",
  doc_fmt_data: "Data",
  doc_fmt_summary_title: "Summary",
  doc_fmt_claim_index: "Statement",
  doc_fmt_multiple_choice_title: "Multiple Choice Question",
  doc_fmt_single_choice_set_title: "Single Choice Set",
  doc_fmt_true_false_title: "True/False Question",
  doc_fmt_dialog_cards_title: "Dialog Cards",
  doc_fmt_hint_front: "💡 Hint (front):",
  doc_fmt_hint_back: "💡 Hint (back):",
  doc_fmt_sort_paragraphs_title: "Sort Paragraphs",
  doc_fmt_paragraphs_ordered: "Paragraphs in correct order",
  doc_fmt_find_the_words_title: "Word Search",
  doc_fmt_words_to_find: "Words to find",
  doc_fmt_matching_title: "Matching",
  doc_fmt_matching_instructions: "📝 Instructions: Match each item with its corresponding one.",
  doc_fmt_pairs_to_match: "Pairs to match",
  doc_fmt_millionnaire_title: "Who Wants to Be a Millionaire?",
  doc_fmt_millionnaire_instructions: "📝 Instructions: Find the correct answer from the four options.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Open-ended Question",
  doc_fmt_qcm_title: "MCQ",
  doc_fmt_moodle_test_title: "Test",
  doc_fmt_associations: "Associations:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Multiple Choice (MCQ)",
  doc_fmt_type_matching: "Matching",
  doc_fmt_type_numerical: "Numerical",
  doc_fmt_type_truefalse: "True/False",
  doc_fmt_type_shortanswer: "Short Answer",
  doc_fmt_type_cloze: "Fill in the Blanks (Cloze)",
  doc_fmt_type_blanks: "Fill in the Blanks",
  doc_fmt_type_dragtext: "Drag the Words",
  doc_fmt_type_markwords: "Mark the Words",
  doc_fmt_type_essay: "Open-ended Question",
  doc_fmt_type_default: "Question",

  // New keys for pedagogical structure statement/correction
  doc_fmt_correction_title: "Correction",
  doc_fmt_proposed_answers: "Propositions:",
  doc_fmt_correct_answer: "Correct answer",
  doc_fmt_correct_answers: "Correct answers:",
  doc_fmt_true: "True",
  doc_fmt_false: "False",
  doc_fmt_words_to_place: "Words to place:",
  doc_fmt_completed_text: "Completed text:",
  doc_fmt_text_to_mark: "Text in which to find words:",
  doc_fmt_words_count_to_find: "Number of words to find",
  doc_fmt_words_to_mark: "Words to mark:",
  doc_fmt_answer_space: "Space for answer:",
  doc_fmt_open_answer: "Open answer - evaluation according to criteria defined by the teacher.",
  doc_fmt_definitions: "Definitions",
  doc_fmt_letters: "letters",
  doc_fmt_summary_instructions: "For each group, choose the correct statement.",
  doc_fmt_sort_instructions: "Put the following paragraphs in the correct order.",
  doc_fmt_paragraphs_to_sort: "Paragraphs to sort",
  doc_fmt_correct_order: "Correct order",
  doc_fmt_find_instructions: "Find",
  doc_fmt_hidden_words: "hidden words in the grid.",
  doc_fmt_hints: "Hints",
  doc_fmt_flashcards_instructions: "For each card, find the answer corresponding to the question.",
  doc_fmt_elements_to_match: "Elements to match:",
  doc_fmt_possible_matches: "Possible matches:",
  doc_fmt_correct_associations: "Correct associations:",

};