<!--
Caramelia knowledge base (Caramel's pedagogical assistant).
This file is REFERENCE DOCUMENTATION, not a system prompt.
No instructions intended for the LLM should be added here.

EDITING RULE: every label mentioned below (buttons, tabs, fields,
sections) must reproduce EXACTLY the text shown in the Caramel UI.
Single source of truth: js/locales/en.json + index.html.
Any edit goes through a PR.
-->
---
version: 1.3.0
lang: en
audience: teachers
---

# Caramel Tutorial

Caramel is an open source web tool that helps teachers create
interactive educational activities (H5P, Éléa, Magistère, Moodle)
with the help of AI. The site runs 100% in the browser:
no pedagogical data is sent to a third-party server.

## Describe your need (top of the page)

At the top of the page, two tabs let you choose how to describe
your need:

- **Quick Mode** — minimal form, two fields.
- **Advanced Mode** — same fields plus extra options, including
  the ability to attach documents.

### Quick Mode

Two fields only:

- **"Who are you? (e.g., Teacher, Trainer...)"**
- **"What do you want to cover? (e.g., The French Revolution...)"**

### Advanced Mode

Same fields as Quick Mode, plus:

- **"For which level (e.g., 10th Grade / Vocational)"**
- **"Number of questions/elements in the module (e.g., 5)"** — depending
  on the activity, this corresponds to the number of questions, dates
  on a timeline, words in a glossary, etc.
- A free-text field for **additional information**
  (specific instructions, constraints, any other relevant detail).

### Attach documents (optional) — only in Advanced Mode

This section, titled **"Attach documents (optional)"**, only
appears when the **Advanced Mode** tab is selected. It lets
the generation be based on content you provide.

Three options:

- **Copy and paste a text** directly into the input area.
- **Drag and drop a document** (or click **"Choose a file"**)
  in **PDF, TXT, DOCX, PPTX, ODT, ODP, PNG, JPEG** format (**WebP** and **BMP** images are also accepted, without being listed on screen). An **image** you drop (photo, diagram, chart…) is **analysed by a vision AI** that writes a **description** of it and **faithfully transcribes the text** it contains — if the AI is unavailable, local reading (OCR) automatically takes over. You can also drop an **audio file** (MP3, M4A, WAV…) or a **video** (MP4, MOV…): only the soundtrack is then transcribed automatically (by Albert, the French government’s sovereign service; see privacy below). The drop
  zone is labelled **"Drag and drop one or more documents here (PDF, TXT, DOCX,
  PPTX, ODT, ODP, PNG, JPEG)"** with an **"or"** separator.
- **Import a web page**: paste its link (`https://…`) into the
  field below the drop zone, then click **"Add"**. The page text
  is fetched automatically.

Text extraction from **documents** happens **entirely locally**
in your browser (no data sent).
**Three exceptions transit through our servers (hosted in France):**
**image analysis** (the image is sent to the vision model for the
duration of the analysis, never retained; if it is unavailable, local
OCR — which sends nothing — takes over), **audio transcription** and
**importing a web page** (the link you enter is sent there to extract
its text; links to PDFs, videos or paywalled pages are not supported).

If you leave this area empty, the AI will rely solely on its
general knowledge to generate the activity.

## Choose the activity type

Once the description is done, the activity tiles become
clickable. Click the one that matches your educational
objective. Filters above the tiles let you narrow the
display: **All**, **Quiz & Tests**, **Text Manipulation**,
**Memorization & Discovery**, as well as the platforms
**H5P**, **Éléa**, **Moodle**.

Below the form, **An activity** shows these tiles; **A pathway** opens the workshop that assembles several activities into a complete course (see “Create and reopen a complete course”).

### H5P activities

Activities in H5P format. Those marked with a star (★) include
detailed feedback in 4 score ranges.

- **Timeline** — interactive sequence of events.
- **Memory Cards (Flashcards)** — front-and-back cards for memorization.
- **MCQ Quiz (Question Set)** ★ — multiple-choice question quiz.
- **True/False Quiz (Question Set)** ★ — true or false quiz.
- **Mixed Quiz (Question Set)** ★ — varied questions (MCQ, drag and drop…).
- **Glossary** — collapsible accordion or FAQ.
- **Crossword** ★ — grid generated from definitions.
- **Essay** ★ — essay topic with keyword-based grading.
- **Summary** ★ — students reconstruct a summary by choosing the right sentences.
- **Drag the Words** ★ — text with missing words to drag.
- **Drag and Drop** ★ — labels to drop in a zone.
- **Fill in the Blanks** ★ — students type the missing words.
- **Mark the Words** ★ — students highlight certain words in a text.
- **True/False** — simple binary questions.
- **Multiple Choice** ★ — MCQ with one or several correct answers.
- **Find the Words** — letter grid with words to find.
- **Sort the Paragraphs** ★ — put paragraphs back in order.
- **Single Choice Set** ★ — questions with a single correct answer.
- **Dialog Cards** — front-and-back cards with text and audio.
- **Dictation** — audio dictation: sentences read by text-to-speech (F/M voice, normal or slow speed, 11 languages), the student writes them, correction highlights mistakes.
- **Complex Fill in the Blanks** ★ — error-specific feedback.
- **Chart** — pie or bar chart to visualize data.
- **Course Presentation** — interactive slideshow with embedded exercises.
- **Interactive Book** — multi-chapter book (text, tables, images, exercises) with table of contents and summary.
- **Interactive Video** — questions (multiple choice, true/false, fill-in) at key moments of a video, with a final summary. Needs a video URL (Apps Éducation Tubes, PodEduc or YouTube); Caramelia asks for it before generating.
- **Interactive image** — clickable points on an image you attach. Caramel automatically detects the key zones of the image based on your context (subject, level, theme) and places the points, then writes the content of each point. In the editor, you can then add by hand text, an image, a sound or a video to a point, and choose the color and the marker type (numbers, icon). Asks you to attach an image file (PNG, JPEG, WebP, and even HEIC/iPhone photo or TIFF); Caramel analyzes it as soon as it is dropped. Can also be exported as a document (DOCX, ODT, PDF) with numbered pills.
- **Find the Hotspot** — a question answered by clicking directly on an image you attach: Caramel detects the areas of the image, picks THE correct one based on your context and writes the task and the feedback (the other areas are decoys; scoring happens on the first click). As with the Interactive image, you attach an image file, analyzed as soon as it is dropped. In the editor, areas can be dragged directly on the image (green = correct, red = decoy). Can also be exported as a document (DOCX, ODT, PDF) with a student page and an answer key.
- **Find Multiple Hotspots** — a hotspot hunt on an image you attach: the student must click ALL the correct areas (the vegetables, the mistakes, the hazards…). Caramel picks the correct areas based on your context, names what is being searched for and writes the task and the feedback. Same flow as the Interactive image (image file analyzed as soon as it is dropped, areas editable on the image). Can also be exported as a document (DOCX, ODT, PDF).

### Éléa / Magistère activities

- **Quiz (MBZ / XML / GIFT)** — Quiz activity ready to restore as **`.mbz`**
  (question bank + wired-up quiz), or a varied question bank (MCQ,
  matching…) to import (XML / GIFT) into an Éléa/Magistère quiz.
- **MCQ (MBZ)** — simple and quick MCQ activity.
- **Matching (MBZ)** — pairing game between elements.
- **Millionaire (MBZ)** — playful quiz with increasing difficulty.
- **Glossary (XML)** — import file for an Éléa/Magistère glossary.
- **Page (MBZ / HTML)** — structured and formatted course page.
- **Book (MBZ)** — multi-chapter book with navigation.
- **Assignment (MBZ)** — assignment with criteria-based rubric.

## Generate and refine the content

After clicking a tile, a window opens. This is where you
interact with the AI. At the top of this window, a **Simple /
Guided** toggle lets you choose the display mode.

### Simple display — "One-click generation" button

The fast path. Click **"One-click generation"**: the AI produces
the content and places it directly in the result area on the right.
The small arrow next to the button lets you choose between different
AI models (fast, powerful…).

### Guided display — use an external AI

For maximum control. The prompt appears on the left.

1. Modify the prompt if you wish.
2. Click **"Copy the prompt"** and open an external AI in a new tab.
3. Paste the prompt into the AI, retrieve its response, then paste it
   into the result area on the right in Caramel.

Two useful icons at the top of the prompt area: **"Fullscreen"**
for more comfort, and **"Lock"** (which becomes **"Unlock"**) to
protect the prompt.

## Preview, edit and download

Once the content is generated, the **"Your treat is ready!"** window
appears, with two choices: **"Preview and edit"** or **"Continue"**
(to generate another activity).

### Preview

A built-in simulator tests the activity as a student would (click,
drag, type…). For Éléa/Magistère content, a simulator
shows the actual rendering.

### Edit (pencil icon, **"Edit"** button)

The visual editor automatically adapts to the activity type: list
of items on the left, details on the right.

- **Rich-text bar** on compatible fields: bold, italic,
  underline, strikethrough, superscript, subscript, color, lists, link.
- `</>` button to switch to **source code mode**.
- **Math formulas** via the **√x** button: 6 categories
  (fractions, roots, powers, Greek letters, operators,
  structures), real-time preview, double-click to edit.
- **Words to find** (Drag the Words, Mark the Words,
  Fill in the Blanks): automatic yellow highlighting,
  Mark / Unmark buttons, or asterisks `*word*`.
- **Cloze text** in Quiz: three blank types
  (Multiple choice, Short answer, Numeric value), shown
  as colored pills (blue, yellow, green).
- **Images**: drag and drop, automatic resizing
  (800×600), alt text, JPEG / PNG / WebP formats.

### Download

The **"Download"** button offers two families of formats:

- **Interactive formats** (digital, for Éléa/Magistère):
  H5P, MBZ, XML.
- **Printable formats** (unplugged versions): DOCX, ODT, PDF.

## Integrate the generated file into Éléa

> Note: the button labels in quotes below are kept in French because they
> match exactly the Éléa interface, which is mainly used in French-speaking
> contexts.

### Integrate an H5P file

- **Quick method**: switch the course to edit mode,
  drag and drop the `.h5p` file directly, choose
  « Ajouter une activité H5P », then confirm with **DÉPOSER**.
- **Recommended method**: « Ajouter une activité ou une ressource »
  → « Contenu interactif (H5P) » → tab « Téléverser » →
  select the file → **« Utiliser »** → save.

### Integrate an MBZ file

1. Open the edit menu on the right (click the arrow to expand it
   if needed).
2. Click **« IMPORT/EXPORT »** → **« Importer un parcours »**.
3. Drag and drop the `.mbz` file → **IMPORTER**.
4. **CONTINUER**.

### Integrate an XML (Test question bank)

1. Tab **« Plus »** → **« Banque de questions »**.
2. Menu **« Questions »** → **« Importer »**.
3. Tick the format (XML Magistère recommended, or GIFT).
4. Drag and drop the file → **IMPORTATION** → **CONTINUER**.

### Integrate a Glossary XML

1. Create an empty Glossary in the course.
2. Click **« IMPORTER DES ARTICLES »**.
3. Drag and drop the `.xml` file → **ENVOYER** → **CONTINUER**.

### Integrate an HTML file into a Page activity

1. Open the `.html` with a text editor, copy all the content.
2. In Éléa, add a **« Page »** activity.
3. In the editor: **Outils → Code source**.
4. Paste the HTML → save.

## About Caramel

### Authors

If the user wishes to contact the team:

- **Gauthier REMANDE** — Vocational Teacher, French and History — gauthier.remande@ac-nantes.fr
- **Emmanuel GAUNARD** — Mathematics teacher and DRANE project lead — Académie de Grenoble — emmanuel.gaunard@ac-grenoble.fr

### Legal notices

#### Personal data

No personal data is collected or stored. No tracking cookie is used.

#### Artificial Intelligence models

The Caramel application relies, only during one-click generation, on AI models operated by ILaaS, a federation of pooled AI infrastructures. Requests are routed through an n8n workflow hosted by the Incubateur, then transmitted to ILaaS for execution on trusted servers hosted in data centres certified by the French Higher Education and Research sector (ESR). Caramel does not run the models and does not process or store data on its own behalf; data is used solely to execute the request and is not sent to consumer-grade AI services. Currently available models include Gemma 4 (31 B parameters), Qwen 3.8 (27 B parameters) and Mistral Small 4 (119 B parameters). Any hosting, logging or retention practices carried out by ILaaS are governed by their own privacy policy and terms of service, which should be consulted directly.

#### Processing of user requests via n8n and the Incubateur of the French Ministry of Education

Our site uses a technical solution developed with n8n, an open-source tool hosted by the Incubateur of the French Ministry of Education. Through an automated workflow, this service transforms user requests into structured data (JSON) in order to interact with a sovereign AI provided by the DINUM. No sensitive information is exposed or transmitted without encryption, ensuring the confidentiality and security of the exchanges.

#### Accessibility

The application is designed for desktop use, with light/dark modes, keyboard navigation, and high contrast depending on the theme. Continuous accessibility improvement is in progress, in line with the RGAA (French accessibility standard) recommendations.

### Useful links

- **Licence**: GNU AGPL v3.0 or later — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
- **Report a bug**: https://forge.apps.education.fr/caramel/caramel/-/issues
- **Source code**: https://forge.apps.education.fr/caramel/caramel
- **Changelog**: https://forge.apps.education.fr/caramel/caramel/-/blob/main/CHANGELOG

## Caramelia response framework

- Caramelia always replies in the user's language.
- Concise, friendly, pedagogical answers (1 to 3 paragraphs).
- Emojis sparingly (1 or 2 maximum).
- When citing a button, tab, field or section of the site,
  Caramelia uses **exactly** the label visible on screen, as
  listed above (for example **"Advanced Mode"**, **"Attach
  documents (optional)"**, **"One-click generation"**). It does
  not invent step names ("step 1"…) or internal technical terms
  ("RAG option"…) that do not appear anywhere in the interface.
- If the user wants to generate an activity, Caramelia suggests the
  most suitable type but NEVER generates the JSON of an activity.
- For any integration question, Caramelia gives the precise
  steps above.

<!-- parcours-complet -->
## Create and reopen a complete course

In Caramel, **A pathway** creates a course for Éléa, Magistère or Moodle: several activities organised into sections in one **.mbz** file. Start with the usual form: topic, audience and attached documents.

In the Caramelia menu, **Create a course** opens the workshop directly, without an AI request. If a draft exists, **Resume my course** reopens it. Existing fields and sources are preserved. Review the setup and plan in the workshop before starting generation.

Choose **A pathway** below the form, then the platform, delivery mode, scope and template. **Compose the plan** uses AI to adapt a plan to your topic. **Start from the template** immediately opens a structure to complete without an AI request. Activities are generated only after you approve the plan.

In **Plan**, edit the title, overall objective, key concepts, stages and activities. Move activities with the arrows or by dragging their thumbnail. **Instructions and stage** adjusts the generation instructions. Teaching prompts help you review without enforcing a model. The limit is **12 activities**.

In an **Interactive Video** card, paste the video link. The transcript is retrieved during generation; you can also paste it manually. For **Image Hotspots**, **Find the Hotspot** or **Find Multiple Hotspots**, attach an image to the card: it will be analysed before generation. You can also add these sources during the generation stage. An activity without its source waits while the others continue. The scenario keeps activity images and links; documents attached to the home form remain separate. For a **Web link**, paste the resource’s address into the card: the AI writes the reading instructions without opening the page.

Once content is ready, **Edit the content** opens the usual editor and **Preview** opens its player. **Review the course** lets you review them in order with **Previous** and **Next**. Save edits to include them in the plan and exports. Changing a plan instruction does not rewrite existing content.

Approve the plan to start generation. You can stop, resume missing activities or regenerate one activity. The **Do not generate this activity** lock reserves its content for manual entry: AI will not fill it. A failed regeneration keeps the previous content. Missing activities are listed before export.

**Export the scenario (.json)** saves the plan and completed content in a **.json** file. The **Customize the plan** button, next to **Compose the plan**, opens the same window as for an activity: copy the prompt into the AI of your choice, then paste its response back. **Open a scenario** is in this window; the **.json** file is downloaded at delivery, next to the **.mbz**. The draft is kept only in this tab: export the scenario before closing it. The scenario excludes the topic, audience and attachments; enter them again before generating new content.

In **Delivery**, download the **.mbz** and use your platform’s course import or restore feature. Do not upload this course file into an H5P activity. The course also appears in the notifications area: **View** opens the **Course overview**, with the welcome text, each step and its activities, which you can review and edit before downloading again. Keep the **.json** to return to Caramel. The lesson plan and activity details can be exported as **DOCX, ODT or PDF**.

The plan also offers the modules of your Éléa, Magistère or Moodle platform, grouped in each activity’s menu under **Platform modules**: forum, poll, questionnaire, survey, lesson, peer-assessment workshop, board, wiki, collaborative document, glossary and database to build together, virtual classroom, group choice, file sharing and web link. The AI writes the parts that the platform keeps on import; collaborative spaces arrive empty, with their instructions. When a module needs a setting on the platform (workshop phases, virtual classroom time, groups), Caramel writes it in a **To do before opening the course** note, hidden from students, at the top of the imported course. The **IMS content package** — pages to read with their table of contents, written entirely by Caramel — is chosen from the mosaic; the plan does not suggest it.

The progression map is specific to Éléa. The map and progressive access are optional and still require checks in actual platform use. The differentiation template does not create automatic score-based branches. Collaboration takes place on the platform. Publishing a complete course to Sucrerie is not yet available.

To explore further: [ABC Learning Design (UCL)](https://www.ucl.ac.uk/short-courses/staff-resources/course-design/designing-learning-activities) helps you reflect on learning activities. Caramel’s seven families, including **Discuss** and **Collaborate**, are simplified guides based on tools, not the six ABC types or an assessment of your teaching.
On Éléa, open **Course settings**, enable the progress map and use the **+ Add my image** tile to choose your own background. You can replace or remove the image and return to the suggested themes. The background is saved in the **.json** scenario and included in the **.mbz** course. JPEG, PNG, HEIC, WebP, GIF, BMP, AVIF, SVG or TIFF · Max. 12 MB. Converted automatically, without cropping.

<!-- parcours-trames -->
### Choosing a template

After **A pathway**, the template sets the sequence that the AI adapts to your topic. The list shown depends on the delivery mode and scope you choose; every activity can still be changed in the plan.

- **Revise before the test** — Find out what is already known, put the essentials back in view, practise, then self-test. *(One session · Two or three sessions)*
- **Prepare and sit a test** — Practice in the exam format, the graded test, the answer key. Three activities, no more. *(One session)*
- **Remedy after the test** — Start from the actual mistakes: name them, re-explain the exact point, redo, then check again. *(One session · Two or three sessions · Remote · Both)*
- **Short ritual** — Ten minutes, always the same shape. It is repetition that makes it stick, not variety. *(One session)*
- **Discover a new idea** — A situation that raises questions, documents to explore, then the summary, and only then the application. *(Two or three sessions · A full unit)*
- **Flipped classroom** — The video and its check at home, the task you cannot do alone in class, the review afterwards. *(One session · Two or three sessions · Both)*
- **Study a work** — Enter the text or the image, spot, situate, interpret, then produce your own reading. *(Two or three sessions · A full unit)*
- **Run an investigation** — A question, a hypothesis, data, a conclusion: the scientific method, in order. *(Two or three sessions · A full unit · In class · Both)*
- **Analyse a source** — Where the information comes from, who produces it, what it leaves out. Equip the eye before judging. *(One session · Two or three sessions)*
- **Structured debate** — A vote to say where you start, sources to get informed, a forum to debate, a text to conclude. *(Two or three sessions · A full unit)*
- **Three-speed differentiation** — A placement test, then activities to consolidate, continue or explore further. Instructions guide the choices; there is no automatic branching by score. *(Two or three sessions · A full unit · Remote · Both)*
- **Modern language unit** — Vocabulary first, comprehension next, production last. *(Two or three sessions)*
- **Prepare a spoken presentation** — What you will say, in what order, and how you rehearse saying it. *(One session · Two or three sessions · In class · Both)*
- **Learning to learn** — What really helps you remember, tried out on the course topic: self-testing, spacing, explaining. Then everyone plans their revision. *(One session · Two or three sessions)*
- **Learn on your own** — Nobody behind the screen: the course must stand on its own, from contents page to final test. *(Two or three sessions · A full unit · Remote)*
- **Blended training in three phases** — Preparation at a distance, the group session, then classroom implementation and feedback. The standard training format. *(A full unit · Both)*
- **Project-based work** — A brief with its criteria, documentation, teamwork, a deliverable reviewed by peers, then improved. *(A full unit · In class · Both)*
- **Teamwork** — Form teams, gather ideas, write together, review each other's work with a set of criteria. *(Two or three sessions · A full unit)*
- **Escape game** — A mission, clues, puzzles of rising difficulty, a final code, and the debrief. *(One session · Two or three sessions · In class · Both)*
- **Free structure** — No imposed sequence: you compose the steps yourself and Caramel fills in whatever you place there. *(One session · Two or three sessions · A full unit)*
<!-- /parcours-trames -->
<!-- /parcours-complet -->
