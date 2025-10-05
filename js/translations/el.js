const translations_el = {
    subtitle: "Υποβοηθούμενη δημιουργία πόρων και δραστηριοτήτων Moodle και Éléa",
    help_button: "Βοήθεια",
    help_modal_title: "🚀 Οδηγός Γρήγορης Εκκίνησης για το Caramel",
    help_modal_content: `
        <div class="help-modal-content">
            <p>Καλώς ήρθατε στο <strong>Caramel</strong>! Αυτό το εργαλείο σας καθοδηγεί βήμα προς βήμα για να δημιουργήσετε διαδραστικές εκπαιδευτικές δραστηριότητες με τη βοήθεια της τεχνητής νοημοσύνης. Ακολουθήστε αυτά τα απλά βήματα για να μετατρέψετε τις ιδέες σας σε έτοιμες προς χρήση ενότητες.</p>

            <div class="help-section">
                <h4><span class="help-step-number">1</span> Γράψτε την ιδέα σας (το "prompt")</h4>
                <p>Όλα ξεκινούν με την περιγραφή των αναγκών σας. Έχετε δύο επιλογές για αυτό:</p>
                <ul>
                    <li><span class="badge-help-mode">Γρήγορη Λειτουργία</span>: Ιδανική για γρήγορη εκκίνηση. Απλώς αναφέρετε <strong>ποιος είστε</strong> (π.χ. <em>Καθηγητής Φυσικών Επιστημών</em>) και <strong>τι θέλετε να καλύψετε</strong> (π.χ. <em>ο κύκλος του νερού στην ΣΤ' Δημοτικού</em>).</li>
                    <li><span class="badge-help-mode">Καθοδηγούμενη Λειτουργία</span>: Για ένα πιο ακριβές αίτημα. Συμπληρώστε την <strong>ειδικότητα</strong>, το <strong>θέμα</strong>, το <strong>επίπεδο του μαθητή</strong> και τον <strong>αριθμό των στοιχείων</strong> που επιθυμείτε (ερωτήσεις, ημερομηνίες, κ.λπ.).</li>
                </ul>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">2</span> Δημιουργήστε τα prompts</h4>
                <p>Αφού εισαγάγετε τις πληροφορίες σας, κάντε κλικ στο κουμπί <button id="generateBtn" data-key="generate_prompts">Δημιουργία prompts</button>. Το εργαλείο θα προετοιμάσει τότε λεπτομερείς οδηγίες (τα "prompts") για κάθε διαθέσιμο τύπο δραστηριότητας.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">3</span> Επιλέξτε τη δραστηριότητά σας</h4>
                <p>Περιηγηθείτε στις καρτέλες <span class="badge-help-tab">H5P</span> και <span class="badge-help-tab">Ενότητες Éléa/Moodle</span> για να ανακαλύψετε τις διάφορες διαθέσιμες δραστηριότητες. Κάντε κλικ σε αυτή που σας ενδιαφέρει (για παράδειγμα, "Χρονολόγιο" ή "MCQ"). Το αντίστοιχο prompt θα εμφανιστεί στην περιοχή κειμένου.</p>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">4</span> Χρησιμοποιήστε την Τεχνητή Νοημοσύνη</h4>
                <p>Εδώ συμβαίνει η μαγεία! Έχετε δύο επιλογές για να δημιουργήσετε το περιεχόμενο της δραστηριότητάς σας:</p>
                <div class="help-subsection">
                    <h5><i class="fas fa-robot"></i> Επιλογή Α: Δημιουργία με τον Albert (Συνιστάται)</h5>
                    <p>Κάντε κλικ στο κουμπί <button class="action-btn albert-btn">Δημιουργία με τον Albert</button>. Μπορείτε να επιλέξετε το μοντέλο ΤΝ που ταιριάζει καλύτερα στις ανάγκες σας (γρήγορο, ισχυρό ή εξειδικευμένο στον κώδικα) κάνοντας κλικ στο μικρό βέλος στα δεξιά του κουμπιού. Το περιεχόμενο της δραστηριότητάς σας θα <strong>δημιουργηθεί και θα εισαχθεί αυτόματα</strong> στο πεδίο αποτελεσμάτων, έτοιμο για χρήση.</p>
                    <ul class="advantages">
                        <li><strong>Δυνατά σημεία:</strong> Απλό, γρήγορο, ενσωματωμένη ΤΝ απευθείας στο εργαλείο.</li>
                        <li><strong>Αδύνατα σημεία:</strong> Χωρίς αναζήτηση στο διαδίκτυο, δεν υπάρχει δυνατότητα προσαρμογής του αρχικού prompt της ΤΝ.</li>
                    </ul>
                </div>
                <div class="help-subsection">
                    <h5><i class="fas fa-paste"></i> Επιλογή Β: Χρησιμοποιήστε τη δική σας ΤΝ</h5>
                    <p>Κάντε κλικ στο <button class="copy-btn">📋 Αντιγραφή prompt</button> και επικολλήστε αυτήν την οδηγία στην αγαπημένη σας τεχνητή νοημοσύνη (ChatGPT, Le Chat, κ.λπ.). Στη συνέχεια, <strong>αντιγράψτε την απάντηση της ΤΝ</strong> και <strong>επικολλήστε την</strong> στο πεδίο αποτελεσμάτων του Caramel.</p>
                    <ul class="advantages">
                        <li><strong>Δυνατά σημεία:</strong> Πλήρης ευελιξία, πιθανή πρόσβαση στο διαδίκτυο, δυνατότητα τροποποίησης του αρχικού prompt και προσθήκης εγγράφων για τη δημιουργία περιεχομένου.</li>
                        <li><strong>Αδύνατα σημεία:</strong> Απαιτεί χειροκίνητη αντιγραφή και επικόλληση και εξωτερικό λογαριασμό.</li>
                    </ul>
                </div>
            </div>

            <div class="help-section">
                <h4><span class="help-step-number">5</span> Δημιουργήστε και κατεβάστε το αρχείο σας</h4>
                <p>Μόλις το περιεχόμενο βρεθεί στο πεδίο αποτελεσμάτων (είτε δημιουργήθηκε από τον Albert είτε το επικολλήσατε εσείς), κάντε κλικ στο κουμπί <button class="download-btn">Δημιουργία H5P</button> (ή .mbz/.xml ανάλογα με τη δραστηριότητα). Το αρχείο σας θα ληφθεί, έτοιμο για ενσωμάτωση στην πλατφόρμα σας Moodle ή Éléa.</p>
                <p class="help-final-tip">Και αυτό ήταν! Δημιουργήσατε μια διαδραστική δραστηριότητα με λίγα μόνο κλικ. Μη διστάσετε να πειραματιστείτε με τις διάφορες λειτουργίες και τύπους δραστηριοτήτων για να εμπλουτίσετε τα μαθήματά σας.</p>
            </div>
        </div>
    `,
    fast_mode: "Γρήγορη λειτουργία",
    guided_mode: "Καθοδηγούμενη λειτουργία",
    who_are_you: "Ποιος/α είστε; (π.χ.: Εκπαιδευτικός, επιμορφωτής...)",
    what_to_address: "Τι θα θέλατε να προσεγγίσετε; (π.χ.: Η φύση της γωνίας στην Α΄ γυμνασίου...)",
    discipline: "Μάθημα (π.χ.: Ιστορία)",
    theme: "Θέμα (π.χ.: Η Γαλλική Επανάσταση)",
    level: "Επίπεδο (π.χ.: Β΄ επαγγελματικού)",
    number_of_elements: "Αριθμός στοιχείων (π.χ.: 10)",
    additional_info: "Συμπληρωματικές και ειδικές πληροφορίες...",
    generate_prompts: "Δημιουργία prompts",
    h5p_tab: "H5P",
    moodle_tab: "Μονάδες Éléa/Moodle",

    // General Context (Advanced Mode)
    prompt_expert_intro: "Είσαι έμπειρος/η παιδαγωγός που θα προσαρμόσει τον τόνο και το λεξιλόγιο με βάση τα ισχύοντα προγράμματα και το επίπεδο των μαθητών για το μάθημα ",
    prompt_context_title: "**Πλαίσιο:**",
    prompt_subject: "- **Μάθημα:**",
    prompt_student_level: "- **Επίπεδο μαθητών:**",
    prompt_theme: "- **Θέμα:**",
    prompt_number_of_elements: "- **Αριθμός στοιχείων:**",
    prompt_additional_info: "- **Συμπληρωματικές πληροφορίες:**",

    // General Context (Simple Mode)
    prompt_simple_intro_part1: "Είμαι **",
    prompt_simple_intro_part2: "** και θα ήθελα **",
    prompt_language_instruction: "Το περιεχόμενο που θα δημιουργηθεί πρέπει να είναι στα ελληνικά, εκτός αν ορίζεται άλλη γλώσσα στην αίτηση.",
    prompt_code_block_instruction: "Πρέπει να δημιουργήσετε το αποτέλεσμα σε ένα μπλοκ κώδικα.",

    // Timeline Prompt
    timeline_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Timeline\".",
    timeline_prompt_mission: "**Αποστολή σου:**",
    timeline_prompt_generate_json: "Δημιούργησε ένα πλήρες και έγκυρο αντικείμενο JSON για δραστηριότητα H5P τύπου Timeline. Το JSON πρέπει να είναι άμεσα χρησιμοποιήσιμο.",
    timeline_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    timeline_prompt_json_structure_main_object: "Το κύριο αντικείμενο πρέπει να περιέχει το κλειδί \"timeline\". Το αντικείμενο αυτό πρέπει να περιλαμβάνει:",
    timeline_prompt_headline: "`headline`: Γενικός τίτλος για τη χρονογραμμή.",
    timeline_prompt_text: "`text`: Σύντομη εισαγωγική παράγραφος.",
    timeline_prompt_asset: "`asset`: Αντικείμενο για την εικόνα εξωφύλλου με `media` (URL), `caption` (λεζάντα) και `credit` (πηγή).",
    timeline_prompt_date_array: "`date`: Πίνακας με ${nombreQuestions} αντικείμενα, το καθένα ένα γεγονός.",
    timeline_prompt_era_array: "`era`: Πίνακας αντικειμένων για περιόδους που καλύπτουν πολλά γεγονότα.",
    timeline_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    timeline_prompt_rule1: "1. Κάθε γεγονός στον πίνακα `date` πρέπει να έχει:",
    timeline_prompt_rule1_startDate: "-   `startDate` και `endDate`: Ημερομηνία σε μορφή \"ΕΕΕΕ,ΜΜ,ΗΗ\" ή \"ΕΕΕΕ\". Χρησιμοποιήστε το `endDate` για να ορίσετε μια περίοδο.",
    timeline_prompt_rule1_headline: "-   `headline`: Τίτλος γεγονότος.",
    timeline_prompt_rule1_text: "-   `text`: Περιγραφή σε HTML (χρησιμοποιήστε <p> και <strong>).",
    timeline_prompt_rule1_asset: "-   `asset`: Προαιρετικό αντικείμενο εικόνας που εικονογραφεί το γεγονός.",
    timeline_prompt_rule1_tag: "- `tag`: Μια λέξη-κλειδί που χαρακτηρίζει την περίοδο (π.χ. 'ιστορία', 'επιστήμη').",
    timeline_prompt_rule2: "2. Για κάθε `asset`, αναζητήστε ενεργά μια σχετική εικόνα χωρίς δικαιώματα (π.χ. Wikimedia Commons). Η διεύθυνση URL στο `media` πρέπει να είναι ένας άμεσος και έγκυρος σύνδεσμος. Αναφέρετε την πηγή και την άδεια στο `credit`. Εάν δεν βρεθεί κατάλληλη εικόνα, παραλείψτε εντελώς το αντικείμενο `asset`.",
    timeline_prompt_rule3: "3. Για κάθε περίοδο (`era`), προσθέστε ένα πεδίο `text` με μια σύντομη περιγραφή και ένα `tag`.",
    timeline_prompt_example_json_title: "**Παράδειγμα δομής JSON:**",
    timeline_prompt_example: `\`\`\`json
{
"timeline": {
"headline": "Τίτλος της χρονογραμμής",
"text": "<p>Εισαγωγή στο θέμα της χρονογραμμής.</p>",
"date": [
{
"startDate": "1914,07,28",
"endDate": "1914,07,28",
"headline": "Έναρξη του Πρώτου Παγκοσμίου Πολέμου",
"text": "<p>Η Αυστροουγγαρία κηρύσσει πόλεμο στη Σερβία.</p>",
"asset": {
"media": "https://upload.wikimedia.org/wikipedia/commons/3/31/Sarajevo-1914-06-28a.jpg",
"caption": "Ο αρχιδούκας Φραγκίσκος Φερδινάνδος λίγο πριν τη δολοφονία του.",
"credit": "Wikimedia Commons / CC BY-SA 4.0"
},
"tag": "Πόλεμος"
},
{
"startDate": "1918,11,11",
"endDate": "1918,11,11",
"headline": "Ανακωχή του 1918",
"text": "<p>Υπογραφή της ανακωχής στη Ρετόντ, που σηματοδότησε το τέλος των μαχών.</p>",
"tag": "Συνθήκη"
}
],
"era": [
{
"startDate": "1914,07,28",
"endDate": "1918,11,11",
"headline": "Πρώτος Παγκόσμιος Πόλεμος",
"text": "<div>Είναι η περίοδος του Μεγάλου Πολέμου.</div>",
"tag": "Ιστορική περίοδος"
}
]
}
}
\`\`\` `,   
    timeline_prompt_generate_only_json: "Παράγετε μόνο έγκυρο κώδικα JSON, χωρίς σχόλια. Το αποτέλεσμα θα χρησιμοποιηθεί απευθείας από άλλο εργαλείο.",

    // Crossword Prompt
    crossword_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Crossword\".",
    crossword_prompt_mission: "**Αποστολή σου:**",
    crossword_prompt_generate_json: "Δημιούργησε πλήρες και έγκυρο JSON για δραστηριότητα σταυρολέξου H5P.",
    crossword_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    crossword_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    crossword_prompt_title: "`title`: Τίτλος δραστηριότητας.",
    crossword_prompt_words_array: "`words`: Πίνακας με ${nombreQuestions} αντικείμενα, το καθένα περιλαμβάνει:",
    crossword_prompt_answer: "`answer`: Η λέξη προς εύρεση.",
    crossword_prompt_clue: "`clue`: Ο αντίστοιχος ορισμός.",
    crossword_prompt_extra_clue_optional: "`extraClue` (προαιρετικό): Ένα αντικείμενο που περιέχει μια πρόσθετη ένδειξη. Η ΤΝ πρέπει να κρίνει τη σκοπιμότητα της προσθήκης του.",
    crossword_prompt_task_description: "`taskDescription`: Σαφής οδηγία.",
    crossword_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά.",
    crossword_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    crossword_prompt_rule1: "1. Οι λέξεις (`answer`) πρέπει να είναι μοναδικές και σχετικές.",
    crossword_prompt_rule2: "2. Οι ορισμοί (`clue`) να είναι σύντομοι και ακριβείς.",
    crossword_prompt_rule3: "3. Η υπόλοιπη δομή JSON (συμπεριφορά, θέμα κ.λπ.) παραμένει ως έχει.",
    crossword_prompt_example_json_title: "**Παράδειγμα JSON για μία λέξη:**",
    crossword_prompt_example: `\`\`\`json
{
"title": "Σταυρόλεξο για τη Βιολογία",
"words": [
{
"answer": "Κύτταρο",
"clue": "Βασική μονάδα της ζωής.",
"extraClue": {
"params": {
"text": "<p>Μπορεί να είναι ζωικό ή φυτικό.</p>"
}
}
},
{
"answer": "DNA",
"clue": "Μόριο που φέρει τη γενετική πληροφορία."
}
],
"taskDescription": "<p>Συμπλήρωσε το πλέγμα του σταυρόλεξου.</p>"
}
\`\`\` `, 
    crossword_prompt_generate_only_json: "Παρήγαγε πλήρες και έγκυρο JSON συμπληρώνοντας τίτλο, περιγραφή και τον πίνακα \"words\", χωρίς πρόσθετα σχόλια.",

    // Crossword UI translations
    crossword_across: "Οριζόντια",
    crossword_down: "Κάθετα",
    crossword_check_answer: "Έλεγχος",
    crossword_try_again: "Προσπάθησε ξανά",
    crossword_show_solution: "Εμφάνιση λύσης",
    crossword_extra_clue: "Επιπλέον στοιχείο",
    crossword_close_window: "Κλείσιμο παραθύρου",
    crossword_submit_answer: "Υποβολή",

    // Essay Prompt
    essay_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Essay\".",
    essay_prompt_mission: "**Αποστολή σου:**",
    essay_prompt_generate_json: "Δημιούργησε πλήρες και έγκυρο JSON για δραστηριότητα H5P τύπου Essay.",
    essay_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    essay_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    essay_prompt_task_description: "`taskDescription`: Σαφής οδηγία που προσκαλεί τον μαθητή να γράψει κείμενο πάνω στο θέμα. Το θέμα πρέπει να είναι με έντονα γράμματα (<strong>) και κάθε πρόταση πρέπει να τελειώνει με αλλαγή γραμμής (<p>).",
    essay_prompt_keywords_array: "`keywords`: Πίνακας με ${nombreQuestions} αντικείμενα· το καθένα ορίζει λέξη-κλειδί που πρέπει να εντοπίζει το σύστημα στην απάντηση.",
    essay_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά.",
    essay_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    essay_prompt_rule1: "1. Κάθε αντικείμενο στο `keywords` έχει κλειδί `keyword` με τη ζητούμενη λέξη.",
    essay_prompt_rule2: "2. Οι λέξεις-κλειδιά πρέπει να είναι σχετικές και ουσιώδεις για την αξιολόγηση της κατανόησης.",
    essay_prompt_rule3: "3. Η δομή JSON (συμπεριφορά κ.λπ.) διατηρείται.",
    essay_prompt_rule4: "4. Η οδηγία (`taskDescription`) πρέπει να ενθαρρύνει τη συγγραφή χωρίς να χρησιμοποιεί τις λέξεις-κλειδιά που αναφέρονται στο `keywords`, εκτός από το όνομα του θέματος εάν είναι απαραίτητο για την κατανόηση.",
    essay_prompt_example_json_title: "**Παράδειγμα JSON για λέξη-κλειδί:**",
    essay_prompt_example: `\`\`\`json
{
"taskDescription": "<p>Γράψε ένα σύντομο κείμενο που εξηγεί τη φωτοσύνθεση.</p>",
"keywords": [
{
"keyword": "φως",
"options": { "points": 1, "caseSensitive": false }
},
{
"keyword": "χλωροφύλλη",
"options": { "points": 1, "caseSensitive": false }
}
]
}
\`\`\` `,
    essay_prompt_generate_only_json: "Παρήγαγε πλήρες και έγκυρο JSON, συμπληρώνοντας την οδηγία και τη λίστα λέξεων-κλειδιών, χωρίς άλλα σχόλια.",

    // Moodle XML Prompt
    moodle_xml_prompt_intro: "Θέλω να δημιουργήσω ένα κουίζ με ${nombreQuestions} ερωτήσεις.",
    moodle_xml_prompt_content_title: "Όσον αφορά το περιεχόμενο:",
    moodle_xml_prompt_content_rule1: "Τα λανθασμένα απαντήματα πρέπει να ταιριάζουν με το θέμα αλλά να είναι ξεκάθαρα λανθασμένα ώστε να αποφεύγεται το τυχαίο.",
    moodle_xml_prompt_content_rule2: "Να υπάρχει διαβάθμιση δυσκολίας, ιδανικά από το απλό στο σύνθετο.",
    moodle_xml_prompt_content_rule3: "Απλοποίησε τη διατύπωση διατηρώντας την ακρίβεια του περιεχομένου.",
    moodle_xml_prompt_content_rule4: "Για την ανατροφοδότηση, δώσε σε μία-δύο προτάσεις τα αναμενόμενα στοιχεία της απάντησης.",
    moodle_xml_prompt_question_types_intro: "Οι ερωτήσεις κατανέμονται ισότιμα στους ακόλουθους τύπους:",
    moodle_xml_prompt_question_type_multichoice: "- multichoice (πολλαπλής επιλογής με μία σωστή απάντηση),",
    moodle_xml_prompt_question_type_matching: "- matching (αντιστοίχιση),",
    moodle_xml_prompt_question_type_numerical: "- numerical (αριθμητική απάντηση με ή χωρίς ανοχή),",
    moodle_xml_prompt_question_type_truefalse: "- truefalse (σωστό/λάθος).",
    moodle_xml_prompt_question_type_shortanswer: "- shortanswer (σύντομη απάντηση) με πιθανές εναλλακτικές απαντήσεις,",
    moodle_xml_prompt_question_type_cloze: "- cloze (κείμενο με κενά) με τις κατηγορίες MULTICHOICE, MULTICHOICE_H, MULTICHOICE_V, MULTICHOICE_S, MULTICHOICE_HS, MULTIRESPONSE, MULTIRESPONSE_H, MULTIRESPONSE_HS, NUMERICAL, SHORTANSWER ή SHORTANWSER_C, ό,τι ταιριάζει καλύτερα στο πλαίσιο.",
    moodle_xml_prompt_form_title: "Όσον αφορά τη μορφή:",
    moodle_xml_prompt_form_rule1: "Το αρχείο XML πρέπει να:",
    moodle_xml_prompt_form_rule1_encoding: "Κωδικοποιείται σε UTF-8 (συμπεριλάβετε τη γραμμή κωδικοποίησης).",
    moodle_xml_prompt_form_rule1_reusable: "Είναι άμεσα επαναχρησιμοποιήσιμο στο Moodle, χωρίς σφάλματα μορφοποίησης.",
    moodle_xml_prompt_form_rule1_standard_structure: "Ακολουθεί την τυπική δομή XML του Moodle (με <quiz>, <question> κ.λπ.).",
    moodle_xml_prompt_form_rule1_special_chars: "Τα μαθηματικά σύμβολα όπως '<' ή '>' πρέπει να κωδικοποιούνται ως οντότητες HTML (για παράδειγμα, `<` για το '<' και `>` για το '>') ώστε να αποφεύγεται οποιαδήποτε σύγχυση με ετικέτες XML.",
    moodle_xml_prompt_generate_only_xml: "Χωρίς σχόλια, χωρίς μορφοποίηση, χωρίς σύνοψη: θέλω μόνο το ακατέργαστο περιεχόμενο του XML. Τήρησε αυστηρά τη μορφή, γιατί θα το επικολλήσω σε εργαλείο που την απαιτεί. Παράδωσε την απάντηση ως προμορφοποιημένο κώδικα.",

    // GIFT Prompt
    gift_prompt_intro: "Θέλω να δημιουργήσω ένα κουίζ με ${nombreQuestions} ερωτήσεις.",
    gift_prompt_format_info: "Το κουίζ πρέπει να είναι σε μορφή GIFT, κατάλληλο για εισαγωγή στο Moodle.",
    gift_prompt_question_quality: "Κάθε ερώτηση να είναι σαφής, σύντομη και χωρίς ασάφεια, με αναλυτική ανατροφοδότηση.",
    gift_prompt_code_format_intro: "Ο κώδικας πρέπει να ακολουθεί ακριβώς τη μορφή που δίνεται παρακάτω:",
    gift_prompt_example_question_comment: "// question: 1  name: Ποιο είναι το κεντρικό σώμα του ηλιακού μας συστήματος;",
    gift_prompt_example_question_text: "::Ποιο είναι το κεντρικό σώμα του ηλιακού μας συστήματος;::Ποιο είναι το κεντρικό σώμα του ηλιακού μας συστήματος;{",
    gift_prompt_example_answer_correct: "=Ο Ήλιος#Σωστά! Ο Ήλιος είναι το κεντρικό άστρο του ηλιακού μας συστήματος. Μπράβο!",
    gift_prompt_example_answer_incorrect1: "~Η Σελήνη#Λάθος. Η Σελήνη είναι φυσικός δορυφόρος της Γης. Ο Ήλιος είναι το κεντρικό σώμα.",
    gift_prompt_example_answer_incorrect2: "~Δίας#Λάθος. Ο Δίας είναι γιγάντιος αέριος πλανήτης. Ο Ήλιος είναι το κεντρικό σώμα.",
    gift_prompt_example_answer_incorrect3: "~Η Γη#Λάθος. Η Γη είναι ο πλανήτης όπου ζούμε. Ο Ήλιος είναι το κεντρικό σώμα.",
    gift_prompt_example_end_bracket: "}",
    gift_prompt_question_types_intro: "Το κουίζ πρέπει να περιέχει τυχαία διάφορους τύπους ερωτήσεων:",
    gift_prompt_question_type_multichoice: "- ερωτήσεις πολλαπλής επιλογής (multichoice) με 1 σωστή απάντηση και 3 παραπλανητικές.",
    gift_prompt_question_type_truefalse: "- σωστό/λάθος (truefalse).",
    gift_prompt_question_type_numerical: "- αριθμητικές (numerical) με αποδεκτό περιθώριο σφάλματος.",
    gift_prompt_question_type_matching: "- αντιστοίχισης (matching) με τουλάχιστον 4 ζεύγη.",
    gift_prompt_generate_only_gift: "Παράγετε απευθείας το κουίζ σε μορφή GIFT, χωρίς πρόσθετα σχόλια ή ετικέτες. Τηρήστε αυστηρά τη μορφή, καθώς θα επικολληθεί σε άλλο εργαλείο. Δώστε την απάντηση ως προμορφοποιημένο κείμενο.",

    // Flashcards Prompt
    flashcards_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Flashcards\".",
    flashcards_prompt_mission: "**Αποστολή σου:**",
    flashcards_prompt_generate_json: "Δημιούργησε πλήρες και έγκυρο JSON για δραστηριότητα H5P τύπου Flashcards. Πρέπει να είναι άμεσα χρησιμοποιήσιμο.",
    flashcards_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    flashcards_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    flashcards_prompt_title: "`title`: Κατάλληλος τίτλος για τη δραστηριότητα.",
    flashcards_prompt_description: "`description`: Σαφής οδηγία για τον μαθητή.",
    flashcards_prompt_cards_array: "`cards`: Πίνακας με ${nombreQuestions} αντικείμενα· κάθε αντικείμενο είναι μία κάρτα και περιέχει:",
    flashcards_prompt_text: "`text`: Η ερώτηση ή ο όρος προς αναγνώριση (μπροστινή όψη).",
    flashcards_prompt_answer: "`answer`: Η απάντηση ή ο ορισμός (πίσω όψη). Σημαντικό: το `answer` μπορεί να περιέχει μόνο μία απλή λέξη ή έναν αριθμό.",
    flashcards_prompt_tip: "`tip` (προαιρετικό): Μια υπόδειξη σε μορφή HTML για να βοηθήσει τον μαθητή εάν η ερώτηση είναι δύσκολη. Προσθέστε μια υπόδειξη μόνο εάν πιστεύετε ότι είναι σχετική.",
    flashcards_prompt_example_json_title: "**Παράδειγμα JSON:**",
    flashcards_prompt_example: `\`\`\`json
{
"title": "Οι πρωτεύουσες της Ευρώπης",
"description": "Απομνημόνευσε την πρωτεύουσα κάθε χώρας. Κάνε κλικ στην κάρτα για να δεις την απάντηση.",
"cards": [
{
"text": "Γαλλία",
"answer": "Παρίσι"
},
{
"text": "Κάτω Χώρες",
"answer": "Άμστερνταμ",
"tip": "<p>Είναι η πόλη των <strong>καναλιών</strong> και των τουλίπων!</p>"
}
]
}
\`\`\` `,
    flashcards_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",

    // QuizSet Prompt
    quiz_set_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς περιεχόμενο για \"H5P Quiz (Question Set)\".",
    quiz_set_prompt_mission: "**Αποστολή σου:**",
    quiz_set_prompt_generate_json: "Δημιούργησε αντικείμενο JSON **μόνο για το περιεχόμενο** ενός H5P κουίζ. Να είναι άμεσα χρησιμοποιήσιμο ως αρχείο `content.json`.",
    quiz_set_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    quiz_set_prompt_json_structure_main_object: "Το κύριο αντικείμενο περιέχει τα εξής κλειδιά:",
    quiz_set_prompt_progress_type: "`progressType`: \"dots\"",
    quiz_set_prompt_pass_percentage: "`passPercentage`: 50",
    quiz_set_prompt_questions_array: "`questions`: Πίνακας με ${nombreQuestions} αντικείμενα, το καθένα μία ερώτηση.",
    quiz_set_prompt_content_rules_title: "**Κανόνες για το περιεχόμενο των ερωτήσεων:**",
    quiz_set_prompt_rule1: "1. Κάθε αντικείμενο ερώτησης πρέπει να έχει τα `library`, `params` και `subContentId`.",
    quiz_set_prompt_rule2: "2.  **Δομή:** Κάθε ερώτηση πρέπει να είναι ένα αντικείμενο με τα κλειδιά `library`, `metadata` και `params`.",
    quiz_set_prompt_rule3: "3. Ποικιλία τύπων ερώτησης. Χρησιμοποίησε τις παρακάτω βιβλιοθήκες με ακριβείς εκδόσεις:",
    quiz_set_prompt_rule4: "4.  **Ανατροφοδότηση (ΚΡΙΣΙΜΟΣ ΚΑΝΟΝΑΣ):** Για **όλους τους τύπους ερωτήσεων** (`MultiChoice`, `Blanks`, `DragText`, `MarkTheWords`, `Essay`), **πρέπει** να δημιουργήσετε ένα `overallFeedback` με ακριβώς 6 κλίμακες βαθμολογίας: 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Για τις ερωτήσεις `TrueFalse`, προσθέστε επίσης τα πεδία `feedbackOnCorrect` και `feedbackOnWrong`. Η ανατροφοδότηση πρέπει να είναι ενθαρρυντική, σταδιακή και πάντα διατυπωμένη θετικά.",
    quiz_set_prompt_rule5: "5.  **Περιεχόμενο:** Το περιεχόμενο στο `params` πρέπει να είναι παιδαγωγικά σχετικό, με εύλογους αντιπερισπασμούς για τα MCQ και συνεκτικά κείμενα για άλλες δραστηριότητες.",
    quiz_set_prompt_rule6: "6.  **Απλότητα:** Μην προσθέτετε εικόνες ή περιττές παραμέτρους συμπεριφοράς. Διατηρήστε τη δομή απλή όπως στα παραδείγματα.",
    quiz_set_prompt_example_json_title: "**Παραδείγματα δομών για κάθε επιτρεπόμενο τύπο ερώτησης:**",
    quiz_set_example_true_false: "Σωστό/Λάθος :",
    quiz_set_example_multiple_choice: "Πολλαπλής επιλογής :",
    quiz_set_example_fill_in_the_blanks: "Κείμενο με κενά :",
    quiz_set_example_drag_the_words: "Σύρε τις λέξεις :",
    quiz_set_example_mark_the_words: "Επισήμανση λέξεων :",
    quiz_set_example_essay: "Έκθεση :",
    quiz_set_prompt_generate_only_json: "Παράγετε μόνο το έγκυρο JSON, ξεκινώντας με `{\"progressType\": \"dots\", ...}`, χωρίς σχόλια.",

    // VRAI/FAUX
    quiz_set_true_false_example: JSON.stringify({
        "library": "H5P.TrueFalse 1.8",
        "metadata": { "title": "Τίτλος ερώτησης Σωστό/Λάθος" },
        "params": {
            "question": "<p>Είναι η Γαλλία χώρα;</p>",
            "correct": "true",
            "feedbackOnCorrect": "Σωστό! Η Γαλλία είναι πράγματι χώρα.",
            "feedbackOnWrong": "Λάθος. Η Γαλλία αναγνωρίζεται διεθνώς ως χώρα.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true }
        }
    }, null, 4),

    // QCM
    quiz_set_multiple_choice_example: JSON.stringify({
        "library": "H5P.MultiChoice 1.16",
        "metadata": { "title": "Τίτλος MCQ" },
        "params": {
            "question": "<p>Ποια είναι η πρωτεύουσα της Γαλλίας;</p>",
            "answers": [
                { "text": "Παρίσι", "correct": true },
                { "text": "Βερολίνο", "correct": false }
            ],
            "behaviour": { "type": "auto", "singleAnswer": true, "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Ανατροφοδότηση για 0-10%" },
                { "from": 11, "to": 30, "feedback": "Ανατροφοδότηση για 11-30%" },
                { "from": 31, "to": 50, "feedback": "Ανατροφοδότηση για 31-50%" },
                { "from": 51, "to": 70, "feedback": "Ανατροφοδότηση για 51-70%" },
                { "from": 71, "to": 90, "feedback": "Ανατροφοδότηση για 71-90%" },
                { "from": 91, "to": 100, "feedback": "Ανατροφοδότηση για 91-100%" }
            ]
        }
    }, null, 4),

    // Texte à trous
    quiz_set_fill_in_the_blanks_example: JSON.stringify({
        "library": "H5P.Blanks 1.14",
        "metadata": { "title": "Τίτλος άσκησης συμπλήρωσης κενών" },
        "params": {
            "questions": ["<p>Το Παρίσι είναι η *πρωτεύουσα* της Γαλλίας.</p>"],
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "caseSensitive": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Ανατροφοδότηση για 0-10%" },
                { "from": 11, "to": 30, "feedback": "Ανατροφοδότηση για 11-30%" },
                { "from": 31, "to": 50, "feedback": "Ανατροφοδότηση για 31-50%" },
                { "from": 51, "to": 70, "feedback": "Ανατροφοδότηση για 51-70%" },
                { "from": 71, "to": 90, "feedback": "Ανατροφοδότηση για 71-90%" },
                { "from": 91, "to": 100, "feedback": "Ανατροφοδότηση για 91-100%" }
            ]
        }
    }, null, 4),

    // Glisser les mots
    quiz_set_drag_the_words_example: JSON.stringify({
        "library": "H5P.DragText 1.10",
        "metadata": { "title": "Τίτλος δραστηριότητας μεταφοράς λέξεων" },
        "params": {
            "taskDescription": "Συμπληρώστε την πρόταση.",
            "textField": "*Το Παρίσι* είναι η πρωτεύουσα της Γαλλίας.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true, "instantFeedback": false },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Ανατροφοδότηση για 0-10%" },
                { "from": 11, "to": 30, "feedback": "Ανατροφοδότηση για 11-30%" },
                { "from": 31, "to": 50, "feedback": "Ανατροφοδότηση για 31-50%" },
                { "from": 51, "to": 70, "feedback": "Ανατροφοδότηση για 51-70%" },
                { "from": 71, "to": 90, "feedback": "Ανατροφοδότηση για 71-90%" },
                { "from": 91, "to": 100, "feedback": "Ανατροφοδότηση για 91-100%" }
            ]
        }
    }, null, 4),

    // Surligner les mots
    quiz_set_mark_the_words_example: JSON.stringify({
        "library": "H5P.MarkTheWords 1.11",
        "metadata": { "title": "Τίτλος δραστηριότητας επισήμανσης λέξεων" },
        "params": {
            "taskDescription": "Επισημάνετε την πρωτεύουσα.",
            "textField": "Η πρωτεύουσα της Γαλλίας είναι *το Παρίσι*.",
            "behaviour": { "enableRetry": true, "enableSolutionsButton": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Ανατροφοδότηση για 0-10%" },
                { "from": 11, "to": 30, "feedback": "Ανατροφοδότηση για 11-30%" },
                { "from": 31, "to": 50, "feedback": "Ανατροφοδότηση για 31-50%" },
                { "from": 51, "to": 70, "feedback": "Ανατροφοδότηση για 51-70%" },
                { "from": 71, "to": 90, "feedback": "Ανατροφοδότηση για 71-90%" },
                { "from": 91, "to": 100, "feedback": "Ανατροφοδότηση για 91-100%" }
            ]
        }
    }, null, 4),

    // Rédaction
    quiz_set_essay_example: JSON.stringify({
        "library": "H5P.Essay 1.5",
        "metadata": { "title": "Τίτλος του δοκιμίου" },
        "params": {
            "taskDescription": "<p>Ποια είναι η πρωτεύουσα της Γαλλίας;</p>",
            "keywords": [
                { "keyword": "Παρίσι", "options": { "points": 1, "caseSensitive": false } }
            ],
            "behaviour": { "inputFieldSize": "1", "enableRetry": true },
            "overallFeedback": [
                { "from": 0, "to": 10, "feedback": "Ανατροφοδότηση για 0-10%" },
                { "from": 11, "to": 30, "feedback": "Ανατροφοδότηση για 11-30%" },
                { "from": 31, "to": 50, "feedback": "Ανατροφοδότηση για 31-50%" },
                { "from": 51, "to": 70, "feedback": "Ανατροφοδότηση για 51-70%" },
                { "from": 71, "to": 90, "feedback": "Ανατροφοδότηση για 71-90%" },
                { "from": 91, "to": 100, "feedback": "Ανατροφοδότηση για 91-100%" }
            ]
        }
    }, null, 4),

    // Glossary Prompt
    glossary_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Accordion\".",
    glossary_prompt_mission: "**Αποστολή σου:**",
    glossary_prompt_generate_json: "Δημιούργησε πλήρες και έγκυρο JSON για γλωσσάρι τύπου Accordion μέσω H5P. Πρέπει να είναι άμεσα χρησιμοποιήσιμο.",
    glossary_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    glossary_prompt_json_structure_main_object: "Δημιούργησε έναν πίνακα με ${nombreQuestions} αντικείμενα JSON.",
    glossary_prompt_panel_object: "",
    glossary_prompt_title: "`title`: Η λέξη ή έκφραση προς ορισμό.",
    glossary_prompt_content: "`text`: Ο ορισμός σε μορφή HTML (χρησιμοποίησε <p>, <strong>, κ.λπ.).",
    glossary_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    glossary_prompt_rule1: "1. Οι ορισμοί να είναι σαφείς, συνοπτικοί και κατάλληλοι για το επίπεδο των μαθητών.",
    glossary_prompt_rule2: "",
    glossary_prompt_example_json_title: "**Παράδειγμα JSON για μία καταχώριση:**",
    glossary_prompt_example: `\`\`\`json
[
{
"title": "Φωτοσύνθεση",
"text": "<p>Διαδικασία με την οποία τα πράσινα φυτά μετατρέπουν το ηλιακό φως σε ενέργεια.</p>"
},
{
"title": "Κύτταρο",
"text": "<p>Η βασική μονάδα όλων των ζωντανών οργανισμών.</p>"
}
]
\`\`\` `,
    glossary_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",

    // Summary Prompt
    summary_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Summary\".",
    summary_prompt_mission: "**Αποστολή σου:**",
    summary_prompt_generate_json: "Δημιούργησε πλήρες JSON για δραστηριότητα H5P τύπου Summary. Πρέπει να είναι άμεσα χρησιμοποιήσιμο.",
    summary_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    summary_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει τα ακόλουθα κλειδιά:",
    summary_prompt_intro_field: "`intro`: Μια εισαγωγική πρόταση για τη δραστηριότητα (π.χ. «Επιλέξτε τη σωστή δήλωση.»).",
    summary_prompt_summaries_array: "`summaries`: Ένας πίνακας με ${nombreQuestions} αντικείμενα, καθένα από τα οποία αντιπροσωπεύει ένα βήμα της σύνοψης.",
    summary_prompt_summary_object: "Κάθε αντικείμενο στο `summaries` πρέπει να περιέχει:",
    summary_prompt_summary_array: "- `summary`: Ένας πίνακας προτάσεων.",
    summary_prompt_tip_field: "- `tip` (προαιρετικό αλλά συνιστάται): Μια υπόδειξη για να βοηθήσει τον μαθητή.",
    summary_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    summary_prompt_rule1: "1. Σε κάθε πίνακα \"summary\" η **πρώτη πρόταση είναι σωστή**.",
    summary_prompt_rule2: "2. Οι επόμενες είναι πιθανές αλλά λανθασμένες αποσπάσεις.",
    summary_prompt_rule3: "3. Όλες οι σωστές προτάσεις μαζί σχηματίζουν συνεκτική σύνοψη.",
    summary_prompt_example_json_title: "**Παράδειγμα JSON για ένα βήμα:**",
    summary_prompt_example: `\`\`\`json
{
"summaries": [
{
"summary": [
    "Αυτή είναι η σωστή πρόταση.",
    "Αυτή είναι μια παραπλανητική επιλογή.",
    "Αυτή είναι μια άλλη παραπλανητική επιλογή."
]
}
]
}
\`\`\` `,
    summary_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά, σχετικό με το θέμα.",
    summary_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",

    // Summary UI translations
    summary_intro: "Επιλέξτε τη σωστή δήλωση.",
    summary_solved_label: "Πρόοδος:",
    summary_score_label: "Λανθασμένες απαντήσεις:",
    summary_result_label: "Το αποτέλεσμά σας",
    summary_feedback: "Έχετε @score από τις @total δηλώσεις (@percent %) σωστές.",
    summary_label_correct: "Σωστό.",
    summary_label_incorrect: "Λάθος! Παρακαλώ προσπαθήστε ξανά.",
    summary_label_correct_answers: "Σωστές απαντήσεις.",
    summary_tip_button_label: "Εμφάνιση συμβουλής",
    summary_score_bar_label: "Έχετε :num από τους :total πόντους",
    summary_progress_text: "Πρόοδος :num από :total",
    summary_alternative_incorrect_label: "Λάθος",

    // Drag the Words Prompt
    drag_word_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Drag the Words\".",
    drag_word_prompt_mission: "**Αποστολή σου:**",
    drag_word_prompt_generate_json: "Δημιούργησε πλήρες JSON για δραστηριότητα H5P τύπου Drag the Words. Πρέπει να είναι άμεσα χρησιμοποιήσιμο.",
    drag_word_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    drag_word_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    drag_word_prompt_task_description: "`taskDescription`: Σαφής οδηγία.",
    drag_word_prompt_text_field: "`textField`: Το κείμενο προς συμπλήρωση. Κάθε πρόταση πρέπει να τελειώνει με αλλαγή γραμμής `\\n`.",
    drag_word_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    drag_word_prompt_rule1: "1. Δημιούργησε ένα συνεκτικό κείμενο πάνω στο θέμα, με σύντομες προτάσεις που τελειώνουν με `\\n`.",
    drag_word_prompt_rule2: "2. Οι μετακινούμενες λέξεις περικλείονται με αστερίσκους. Μπορείς να προσθέσεις μια συμβουλή με `:η συμβουλή μου` και ανατροφοδότηση με `\\+σωστή ανατροφοδότηση \\-λανθασμένη ανατροφοδότηση`.",
    drag_word_prompt_example_json_title: "**Παράδειγμα JSON:**",
    drag_word_prompt_example: `\`\`\`json
{
"taskDescription": "Συμπλήρωσε το κείμενο σύροντας τις λέξεις.",
"textField": "Το *ηλιακό σύστημα* αποτελείται από *οκτώ* πλανήτες που περιστρέφονται γύρω από τον *Ήλιο*."
}
 \`\`\` `,
    drag_word_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",
    drag_word_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά, σχετικό με το θέμα.",

    // Drag the Words UI translations
    drag_words_check_answer: "Έλεγχος",
    drag_words_try_again: "Προσπάθησε ξανά",
    drag_words_show_solution: "Εμφάνιση λύσης",
    drag_words_score_feedback: "Βαθμολογία: @score από @total.",
    drag_words_tip_label: "Εμφάνιση συμβουλής",
    drag_words_correct_text: "Σωστό!",
    drag_words_incorrect_text: "Λάθος!",
    drag_words_score_bar_label: "Έχετε :num από τους :total πόντους",
    drag_words_submit_answer: "Υποβολή",

    // Fill in the Blanks Prompt
    blanks_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Fill in the Blanks\".",
    blanks_prompt_mission: "**Αποστολή σου:**",
    blanks_prompt_generate_json: "Δημιούργησε πλήρες JSON για δραστηριότητα H5P τύπου Fill in the Blanks. Πρέπει να είναι άμεσα χρησιμοποιήσιμο.",
    blanks_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    blanks_prompt_json_structure_main_object: "Το αντικείμενο περιέχει το κλειδί `questions`, έναν πίνακα συμβολοσειρών. Κάθε συμβολοσειρά είναι ένα μπλοκ κειμένου προς συμπλήρωση.",
    blanks_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    blanks_prompt_rule1: "- Οι λέξεις προς εύρεση περικλείονται με αστερίσκους (*λέξη*).",
    blanks_prompt_rule2: "- Για εναλλακτικές απαντήσεις χρησιμοποιήστε κάθετο: *Paris/Πόλη του Φωτός*.",
    blanks_prompt_rule3: "- Για προσθήκη υπόδειξης χρησιμοποιήστε άνω-κάτω τελεία: *open-source:Δημόσιος πηγαίος κώδικας*.",
    blanks_prompt_example_json_title: "**Παράδειγμα JSON:**",
    blanks_prompt_example: `\`\`\`json
{
"questions": [
"Το ηλιακό σύστημα έχει *οκτώ* πλανήτες. Ο μεγαλύτερος είναι ο *Δίας*.",
"Η πρωτεύουσα της Γαλλίας είναι το *Παρίσι/Πόλη του Φωτός*."
]
}
\`\`\` `,
    blanks_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",
    blanks_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά, σχετικό με το θέμα.",

    // Fill in the Blanks UI translations
    blanks_show_solutions: "Εμφάνιση λύσεων",
    blanks_try_again: "Προσπάθησε ξανά",
    blanks_check_answer: "Έλεγχος",
    blanks_not_filled_out: "Παρακαλώ συμπληρώστε όλα τα κενά.",
    blanks_answer_is_correct: "Το '':ans' είναι σωστό",
    blanks_answer_is_wrong: "Το '':ans' είναι λάθος",
    blanks_answered_correctly: "Απαντήθηκε σωστά",
    blanks_answered_incorrectly: "Απαντήθηκε λανθασμένα",
    blanks_solution_label: "Σωστή απάντηση:",
    blanks_input_label: "Κενό @num από @total",
    blanks_input_has_tip_label: "Διαθέσιμη συμβουλή",
    blanks_tip_label: "Συμβουλή",
    blanks_score_bar_label: "Έχετε :num από τους :total πόντους",
    blanks_submit_answer: "Υποβολή",
    blanks_feedback: "Συμπληρώσατε σωστά @score από τα @total κενά.",
    blanks_finish_header: "Ολοκλήρωση;",
    blanks_finish_body: "Είστε σίγουροι ότι θέλετε να ολοκληρώσετε;",
    blanks_cancel_label: "Άκυρο",
    blanks_finish_label: "Ολοκλήρωση",
    blanks_retry_header: "Επανάληψη;",
    blanks_retry_body: "Είστε σίγουροι ότι θέλετε να προσπαθήσετε ξανά;",
    blanks_retry_confirm_label: "Επιβεβαίωση",
    blanks_checking_mode_header: "Λειτουργία ελέγχου",
    blanks_a11y_check: "Ελέγξτε τις απαντήσεις. Οι απαντήσεις θα επισημανθούν ως σωστές, λανθασμένες ή αναπάντητες.",
    blanks_a11y_show_solution: "Εμφάνιση της λύσης. Η εργασία θα επισημανθεί με τη σωστή λύση της.",
    blanks_a11y_retry: "Επαναλάβετε την εργασία. Επαναφέρετε όλες τις απαντήσεις και ξεκινήστε την εργασία από την αρχή.",

    // Mark the Words Prompt
    mark_words_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Mark the Words\".",
    mark_words_prompt_mission: "**Αποστολή σου:**",
    mark_words_prompt_generate_json: "Δημιούργησε πλήρες JSON για δραστηριότητα H5P τύπου Mark the Words. Πρέπει να είναι άμεσα χρησιμοποιήσιμο.",
    mark_words_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    mark_words_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    mark_words_prompt_task_description: "`taskDescription`: Σαφής οδηγία.",
    mark_words_prompt_text_field: "`textField`: Κείμενο όπου οι λέξεις προς σήμανση περικλείονται με αστερίσκους (*λέξη*).",
    mark_words_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά, σχετικό με το θέμα.",
    mark_words_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    mark_words_prompt_rule1: "1. Γράψε σχετική παράγραφο για το θέμα.",
    mark_words_prompt_rule2: "2. Επίλεξε περίπου ${nombreQuestions} σημαντικές λέξεις-κλειδιά για σήμανση.",
    mark_words_prompt_rule3: "3. Κάθε λέξη προς επισήμανση πρέπει να περικλείεται ατομικά από αστερίσκους. Για παράδειγμα, το `*λέξη1* *λέξη2*` είναι σωστό, αλλά το `*λέξη1 λέξη2*` δεν είναι.",
    mark_words_prompt_rule4: "4. Οι απόστροφοι ή άλλα σημεία στίξης δεν πρέπει να είναι κολλημένοι στις επισημασμένες λέξεις. Για παράδειγμα, το `τ'*αστέρι*` είναι λανθασμένο· πρέπει να γραφτεί `το *αστέρι*` για να λειτουργήσει.",
    mark_words_prompt_example_json_title: "**Παράδειγμα JSON:**",
    mark_words_prompt_example: `\`\`\`json
{
"taskDescription": "Κάνε κλικ στις σημαντικές λέξεις στο κείμενο.",
"textField": "Το *ηλιακό* *σύστημα* αποτελείται από *οκτώ* πλανήτες που περιστρέφονται γύρω από τον *Ήλιο*."
}
\`\`\` `,
    mark_words_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",

    // Mark the Words UI translations
    mark_words_check_answer: "Έλεγχος",
    mark_words_try_again: "Προσπάθησε ξανά",
    mark_words_show_solution: "Εμφάνιση λύσης",
    mark_words_correct_answer: "Σωστό!",
    mark_words_incorrect_answer: "Λάθος!",
    mark_words_missed_answer: "Παραλείφθηκε!",
    mark_words_display_solution_description: "Η εργασία ενημερώθηκε για να περιέχει τη λύση.",
    mark_words_score_bar_label: "Έχετε :num από τους :total πόντους",
    mark_words_submit_answer: "Υποβολή",
    mark_words_a11y_full_text_label: "Πλήρες αναγνώσιμο κείμενο",
    mark_words_a11y_clickable_text_label: "Πλήρες κείμενο όπου μπορούν να επισημανθούν λέξεις",
    mark_words_a11y_solution_mode_header: "Λειτουργία λύσης",
    mark_words_a11y_checking_header: "Λειτουργία ελέγχου",
    mark_words_a11y_check: "Ελέγξτε τις απαντήσεις. Οι απαντήσεις θα επισημανθούν ως σωστές, λανθασμένες ή αναπάντητες.",
    mark_words_a11y_show_solution: "Εμφάνιση της λύσης. Η εργασία θα επισημανθεί με τη σωστή λύση της.",
    mark_words_a11y_retry: "Επαναλάβετε την εργασία. Επαναφέρετε όλες τις απαντήσεις και ξεκινήστε την εργασία από την αρχή.",

    // Millionnaire Creation
    millionnaire_error_compression_libs: "Οι βιβλιοθήκες συμπίεσης (Tar.js ή fflate) δεν έχουν φορτωθεί. Ελέγξτε τη σύνδεσή σας στο διαδίκτυο ή ανανεώστε τη σελίδα.",
    millionnaire_error_invalid_json: "Η δομή JSON δεν είναι έγκυρη. Βεβαιωθείτε ότι περιέχει 'title' και έναν πίνακα 'questions' με 6 ερωτήσεις σύμφωνα με το παράδειγμα.",
    millionnaire_activity_intro: "Συμμετέχετε σε αυτό το παιχνίδι για να δοκιμάσετε τις γνώσεις σας.",
    millionnaire_backup_log: "Αντίγραφο ασφαλείας δημιουργήθηκε αυτόματα από το Caramel\n",
    millionnaire_success_generation: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
    millionnaire_error_creation_mbz: "Σφάλμα κατά τη δημιουργία του αρχείου MBZ:",
    millionnaire_error_generic: "Σφάλμα:",

    // Millionnaire Prompt
    millionnaire_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Millionnaire\".",
    millionnaire_prompt_num_questions: "**Αριθμός ερωτήσεων:** 6",
    millionnaire_prompt_mission: "**Αποστολή σου:**",
    millionnaire_prompt_generate_json: "Δημιούργησε αντικείμενο JSON με τίτλο και λίστα **6 ερωτήσεων** για παιχνίδι τύπου «Ποιος θέλει να γίνει εκατομμυριούχος».",
    millionnaire_prompt_important_rules_title: "**Σημαντικοί κανόνες:**",
    millionnaire_prompt_rule1: "1. Το `title` πρέπει να είναι σχετικός και ελκυστικός τίτλος δραστηριότητας.",
    millionnaire_prompt_rule2: "2. Η δυσκολία των ερωτήσεων στο `questions` είναι **αυξανόμενη και παιδαγωγική**, κατάλληλη για το επίπεδο των μαθητών· η πρώτη πολύ εύκολη, η τελευταία πολύ δύσκολη.",
    millionnaire_prompt_rule3: "3. Το περιεχόμενο πρέπει να είναι αυστηρά ακριβές και σχετικό με το θέμα και το σχολικό επίπεδο.",
    millionnaire_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    millionnaire_prompt_main_object: "Κύριο αντικείμενο με δύο κλειδιά:",
    millionnaire_prompt_title: "- `title`: Τίτλος δραστηριότητας (string).",
    millionnaire_prompt_questions_array: "- `questions`: Πίνακας 6 αντικειμένων· το καθένα αντιστοιχεί σε ερώτηση και περιέχει:",
    millionnaire_prompt_question: "- `question`: Η ερώτηση (string).",
    millionnaire_prompt_good_answer: "- `goodanswer`: Η σωστή απάντηση (string).",
    millionnaire_prompt_bad_answer: "- `badanswer`: Πίνακας με 3 λανθασμένες απαντήσεις (strings).",
    millionnaire_prompt_example_json_title: "**Παράδειγμα JSON:**",
    millionnaire_prompt_example: `\`\`\`json
{
"title": "Κουίζ για τη Γαλλική Επανάσταση",
"questions": [
{
"question": "Ποια είναι η πρωτεύουσα της Γαλλίας;",
"goodanswer": "Παρίσι",
"badanswer": ["Βερολίνο", "Λονδίνο", "Μαδρίτη"]
}
]
}
\`\`\` `,
    millionnaire_prompt_generate_only_json: "Παράγετε μόνο το έγκυρο αντικείμενο JSON, χωρίς σχόλια.",

    // Appariement Prompt
    appariement_prompt_role: "Είσαι ειδικός στον εκπαιδευτικό σχεδιασμό και δημιουργείς μια δραστηριότητα Moodle «Αντιστοίχιση».",
    appariement_prompt_num_questions: "**Αριθμός ζευγών:** 10",
    appariement_prompt_mission: "**Η αποστολή σου:**",
    appariement_prompt_generate_json: "Δημιούργησε ένα αντικείμενο JSON που να περιέχει έναν τίτλο και μια λίστα από **10 ζεύγη** για παιχνίδι αντιστοίχισης.",
    appariement_prompt_important_rules_title: "**Σημαντικοί κανόνες:**",
    appariement_prompt_rule1: "1.  Το `title` πρέπει να είναι σχετικός και ελκυστικός τίτλος για τη δραστηριότητα.",
    appariement_prompt_rule2: "2.  Ο πίνακας `pairs` πρέπει να περιέχει 10 αντικείμενα, το καθένα με `question` (το στοιχείο αριστερά) και `answer` (το στοιχείο δεξιά προς αντιστοίχιση).",
    appariement_prompt_rule3: "3.  Το περιεχόμενο πρέπει να είναι απολύτως ακριβές και κατάλληλο για το θέμα και το σχολικό επίπεδο.",
    appariement_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    appariement_prompt_main_object: "Ένα κύριο αντικείμενο με δύο κλειδιά:",
    appariement_prompt_title: "- `title`: Ο τίτλος της δραστηριότητας (συμβολοσειρά).",
    appariement_prompt_pairs_array: "- `pairs`: Ένας πίνακας 10 αντικειμένων, όπου κάθε αντικείμενο αντιπροσωπεύει ένα ζεύγος και περιλαμβάνει:",
    appariement_prompt_question: "- `question`: Ο όρος ή η εικόνα στα αριστερά (συμβολοσειρά).",
    appariement_prompt_answer: "- `answer`: Ο ορισμός ή ο αντίστοιχος όρος στα δεξιά (συμβολοσειρά).",
    appariement_prompt_example_json_title: "**Παράδειγμα JSON:**",
    appariement_prompt_example: `\`\`\`json
{
"title": "Συσχέτιση για τη Γαλλική Επανάσταση",
"pairs": [
{
"question": "Άλωση της Βαστίλης",
"answer": "14 Ιουλίου 1789"
}
]
}
\`\`\` `,
    appariement_prompt_generate_only_json: "Παρήγαγε μόνο το έγκυρο αντικείμενο JSON, χωρίς κανένα σχόλιο.",

    // QCM Prompt
    qcm_prompt_role: "Είσαι ειδικός στον εκπαιδευτικό σχεδιασμό και δημιουργείς μια δραστηριότητα Moodle «MCQ».",
    qcm_prompt_num_questions: "**Αριθμός ερωτήσεων:** 10",
    qcm_prompt_mission: "**Η αποστολή σου:**",
    qcm_prompt_generate_json: "Δημιούργησε ένα αντικείμενο JSON που να περιέχει έναν τίτλο και μια λίστα από **10 ερωτήσεις** για ένα MCQ.",
    qcm_prompt_important_rules_title: "**Σημαντικοί κανόνες:**",
    qcm_prompt_rule1: "1.  Το `title` πρέπει να είναι σχετικός και ελκυστικός τίτλος για τη δραστηριότητα.",
    qcm_prompt_rule2: "2.  Ο πίνακας `questions` πρέπει να περιέχει 10 αντικείμενα, το καθένα με `text` (η διατύπωση της ερώτησης) και έναν πίνακα `answers`.",
    qcm_prompt_rule3: "3.  Κάθε πίνακας `answers` πρέπει να περιέχει πολλές πιθανές απαντήσεις. Κάθε απάντηση είναι ένα αντικείμενο με `text` και `iscorrect` (1 για σωστό, 0 για λάθος). Ανάλογα με το πλαίσιο της ερώτησης, μπορείς να προτείνεις ερωτήσεις με μία μόνο σωστή απάντηση ή με πολλαπλές σωστές απαντήσεις.",
    qcm_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    qcm_prompt_main_object: "Ένα κύριο αντικείμενο με δύο κλειδιά:",
    qcm_prompt_title: "- `title`: Ο τίτλος της δραστηριότητας (συμβολοσειρά).",
    qcm_prompt_questions_array: "- `questions`: Ένας πίνακας 10 αντικειμένων, όπου κάθε αντικείμενο αντιπροσωπεύει μια ερώτηση και περιλαμβάνει:",
    qcm_prompt_question_text: "- `text`: Η διατύπωση της ερώτησης (συμβολοσειρά, μπορεί να περιέχει HTML).",
    qcm_prompt_answers_array: "- `answers`: Ένας πίνακας αντικειμένων, όπου κάθε αντικείμενο αντιπροσωπεύει μια απάντηση και περιλαμβάνει:",
    qcm_prompt_answer_text: "- `text`: Το κείμενο της απάντησης (συμβολοσειρά, μπορεί να περιέχει HTML).",
    qcm_prompt_answer_iscorrect: "- `iscorrect`: 1 αν η απάντηση είναι σωστή, αλλιώς 0.",
    qcm_prompt_example_json_title: "**Παράδειγμα JSON:**",
    qcm_prompt_example: `\`\`\`json
{
"title": "Πολλαπλής επιλογής για τη Γαλλική Επανάσταση",
"questions": [
{
"text": "<p>Ποια είναι η ημερομηνία της Άλωσης της Βαστίλης;</p>",
"answers": [
{ "text": "<p>14 Ιουλίου 1789</p>", "iscorrect": 1 },
{ "text": "<p>4 Αυγούστου 1789</p>", "iscorrect": 0 },
{ "text": "<p>26 Αυγούστου 1789</p>", "iscorrect": 0 }
]
}
]
}
\`\`\` `,
    qcm_prompt_generate_only_json: "Παρήγαγε μόνο το έγκυρο αντικείμενο JSON, χωρίς κανένα σχόλιο.",

    // H5P Modules
    h5p_timeline_name: "Χρονογραμμή",
    h5p_timeline_description: "Δημιουργήστε διαδραστική χρονογραμμή για την παρουσίαση μιας ακολουθίας γεγονότων.",
    h5p_flashcards_name: "Κάρτες μνήμης",
    h5p_flashcards_description: "Δημιουργήστε δίπλευρες κάρτες για απομνημόνευση όρων και ορισμών.",
    h5p_quiz_set_name: "Κουίζ",
    h5p_quiz_set_description: "Συνθέστε σειρά ποικίλων ερωτήσεων (πολλαπλής επιλογής, σύρε-και-άφησε κ.λπ.) για αξιολόγηση γνώσεων.",
    h5p_glossary_name: "Γλωσσάρι",
    h5p_glossary_description: "Δημιουργήστε γλωσσάρι ή FAQ σε μορφή accordion.",
    h5p_crossword_name: "Σταυρόλεξο",
    h5p_crossword_description: "Παραγάγετε πλέγμα σταυρολέξου από λίστα λέξεων και ορισμών.",
    h5p_essay_name: "Έκθεση",
    h5p_essay_description: "Προτείνετε θέμα γραπτού και ορίστε λέξεις-κλειδιά για αυτόματο έλεγχο.",
    h5p_summary_name: "Σύνοψη",
    h5p_summary_description: "Οι μαθητές ανασυνθέτουν σωστή σύνοψη επιλέγοντας τις κατάλληλες προτάσεις.",
    h5p_drag_the_words_name: "Σύρε τις λέξεις",
    h5p_drag_the_words_description: "Δημιουργήστε κείμενο με κενά όπου οι μαθητές σύρουν τις λέξεις που λείπουν.",
    h5p_fill_in_the_blanks_name: "Συμπλήρωση κενών",
    h5p_fill_in_the_blanks_description: "Οι μαθητές συμπληρώνουν τις λέξεις που λείπουν απευθείας με το πληκτρολόγιο.",
    h5p_mark_the_words_name: "Επισήμανση λέξεων",
    h5p_mark_the_words_description: "Ζητήστε από τους μαθητές να επισημάνουν συγκεκριμένες λέξεις σε μια παράγραφο.",
    h5p_true_false_name: "Ερώτηση Σωστό/Λάθος",
    h5p_true_false_description: "Δημιουργήστε απλές ερωτήσεις με δυαδική απάντηση: σωστό ή λάθος.",
    h5p_multiple_choice_name: "Πολλαπλή Επιλογή",
    h5p_multiple_choice_description: "Δημιουργήστε ερωτήσεις πολλαπλής επιλογής με μία ή περισσότερες σωστές απαντήσεις.",
    h5p_find_the_words_name: "Κρυπτόλεξο",
    h5p_find_the_words_description: "Δημιουργήστε ένα πλέγμα γραμμάτων όπου οι μαθητές πρέπει να βρουν λέξεις.",
    h5p_sort_the_paragraphs_name: "Ταξινόμηση παραγράφων",
    h5p_sort_the_paragraphs_description: "Δημιουργήστε ένα σύνολο παραγράφων που οι μαθητές πρέπει να ταξινομήσουν στη σωστή σειρά.",
    h5p_single_choice_set_name: "Σετ απλής επιλογής",
    h5p_single_choice_set_description: "Δημιουργήστε μια σειρά ερωτήσεων όπου κάθε ερώτηση έχει μόνο μία σωστή απάντηση.",
    h5p_dialog_cards_name: "Κάρτες διαλόγου",
    h5p_dialog_cards_description: "Δημιουργήστε διαδραστικές κάρτες με κείμενο και προαιρετικές εικόνες και στις δύο πλευρές.",
    h5p_complex_fill_the_blanks_name: "Συμπλήρωση κενών (σύνθετο)",
    h5p_complex_fill_the_blanks_description: "Δημιουργήστε ένα προηγμένο κείμενο συμπλήρωσης κενών με ειδική ανατροφοδότηση για κάθε λάθος.",
    h5p_chart_name: "Γράφημα",
    h5p_chart_description: "Δημιουργήστε ένα γράφημα πίτας ή ράβδων για την οπτικοποίηση δεδομένων.",

    // Moodle Modules
    moodle_xml_name: "XML Éléa/Moodle",
    moodle_xml_description: "Δημιουργήστε μια τράπεζα 10 ερωτήσεων για μια δραστηριότητα Κουίζ έτοιμη για εισαγωγή σε μορφή XML.",
    moodle_xml_help: "Για να προσθέσετε ένα αρχείο XML σε μια δραστηριότητα «Κουίζ» στο Moodle, δημιουργήστε πρώτα τη δραστηριότητα. Στη συνέχεια, ανοίξτε το μενού <strong>Περισσότερα</strong> και μεταβείτε στην <strong>Τράπεζα ερωτήσεων</strong>. Σε αυτό το μενού, κάντε κλικ στο <strong>Εισαγωγή</strong>, επιλέξτε τη μορφή <strong>Moodle XML</strong>, στη συνέχεια επιλέξτε το αρχείο σας και επιβεβαιώστε.",
    moodle_gift_name: "Μορφή GIFT",
    moodle_gift_description: "Δημιουργήστε ερωτήσεις σε μορφή GIFT, ένας απλός τρόπος για να εισάγετε ερωτήσεις στο Moodle.",
    moodle_millionnaire_name: "Εκατομμυριούχος",
    moodle_millionnaire_description: "Δημιουργήστε μια μοναδική δραστηριότητα 'Εκατομμυριούχος' με 6 ερωτήσεις αυξανόμενης δυσκολίας.",
    moodle_appariement_name: "Αντιστοίχιση",
    moodle_appariement_description: "Δημιούργησε μια δραστηριότητα αντιστοίχισης με 10 ερωτήσεις.",

    moodle_qcm_name: "MCQ",
    moodle_qcm_description: "Δημιουργήστε μια απλή δραστηριότητα MCQ.",

    moodle_glossaire_xml_name: "Γλωσσάρι (XML)",
    moodle_glossaire_xml_description: "Δημιουργήστε ένα γλωσσάρι έτοιμο για εισαγωγή σε μορφή XML.",

    // Dynamic content
    prompt_for_ia: "Prompt για ΤΝ",
    copy_prompt: "📋 Αντιγραφή prompt",
    go_duck: "🦆 Μετάβαση στο Duck.ai",
    go_mistral: "Ⓜ️ Μετάβαση στο Le Chat",
    create_h5p_file: "Δημιουργία αρχείου H5P",
    integrate_h5p_libraries: "Ενσωμάτωση βιβλιοθηκών H5P:",
    paste_ia_result: "Επικολλήστε το αποτέλεσμα της ΤΝ στην περιοχή παρακάτω για να δημιουργήσετε τη μονάδα σας.",
    generate_h5p: "Δημιουργία H5P",
    create_xml_file: "Δημιουργία αρχείου XML",
    paste_ia_result_xml: "Επικολλήστε εδώ το XML που παρήγαγε η ΤΝ.",
    generate_xml_file: "Δημιουργία αρχείου XML",

    create_mbz_file_appariement: "Δημιούργησε το αρχείο Αντιστοίχιση (.mbz)",
    paste_ia_result_appariement: "Επικόλλησε παρακάτω το JSON που δημιουργήθηκε από την ΤΝ. Ο τίτλος της δραστηριότητας θα εξαχθεί αυτόματα από το JSON.",
    generate_mbz_appariement: "Δημιούργησε τη δραστηριότητα Αντιστοίχιση (mbz)",
    create_mbz_file_millionnaire: "Δημιούργησε το αρχείο Εκατομμυριούχος (.mbz)",
    paste_ia_result_millionnaire: "Επικόλλησε παρακάτω το JSON που δημιουργήθηκε από την ΤΝ. Ο τίτλος της δραστηριότητας θα εξαχθεί αυτόματα από το JSON.",
    generate_mbz_millionnaire: "Δημιούργησε τη δραστηριότητα Εκατομμυριούχος (mbz)",

    create_mbz_file_qcm: "Δημιουργία αρχείου MCQ (.mbz)",
    paste_ia_result_qcm: "Επικολλήστε παρακάτω το JSON που δημιουργήθηκε από την ΤΝ. Ο τίτλος της δραστηριότητας θα εξαχθεί αυτόματα από το JSON.",
    generate_mbz_qcm: "Δημιουργία δραστηριότητας MCQ (mbz)",

    // Moodle XML specific
    moodle_xml_placeholder: "Το Moodle XML θα εμφανιστεί εδώ...",
    paste_xml_placeholder: "Επικολλήστε εδώ το πλήρες XML που παρήγαγε η ΤΝ...",

    // H5P empty text fields
    generate_prompts_placeholder: "Το prompt για την ΤΝ θα εμφανιστεί εδώ μόλις κάνετε κλικ στο 'Δημιουργία prompts'.",
    paste_json_or_text: "Επικολλήστε εδώ το περιεχόμενο JSON ή το κείμενο που δημιουργήθηκε από την ΤΝ για να δημιουργήσετε τη δραστηριότητά σας.",

    // Notifications
    prompts_generated_successfully: "Τα prompts δημιουργήθηκαν με επιτυχία!",
    error_please_fill_fields: "Συμπληρώστε όλα τα πεδία της απλής λειτουργίας.",
    error_please_fill_guided_fields: "Συμπληρώστε όλα τα πεδία της καθοδηγούμενης λειτουργίας.",
    error_field_empty: "Το πεδίο είναι κενό. Δημιουργήστε πρώτα ένα prompt.",
    error_copy_failed: "Αποτυχία αντιγραφής.",
    error_h5p_module_not_found: "Η μονάδα '{moduleKey}' δεν βρέθηκε.",
    error_invalid_quiz_json: "Το JSON για το Κουίζ δεν είναι έγκυρο: {errorMessage}",
    error_invalid_json: "Το παρεχόμενο JSON δεν είναι έγκυρο. Σφάλμα: {errorMessage}",
    error_h5p_creation: "Σφάλμα δημιουργίας H5P: {errorMessage}",
    error_paste_ia_content: "Παρακαλούμε επικολλήστε το περιεχόμενο που παρήγαγε η ΤΝ.",
    error_compression_module_not_ready: "Η μονάδα συμπίεσης δεν είναι έτοιμη. Δοκιμάστε ξανά σε λίγο.",
    h5p_file_generated_successfully: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
    h5p_creation_failed: "Αποτυχία δημιουργίας αρχείου H5P: {errorMessage}",
    license_info: "GNU GPL v3.0 ή νεότερη",

    // Notifications for JSON content
    error_paste_json_content: "Παρακαλώ επικολλήστε το περιεχόμενο JSON που δημιουργήθηκε.",
    error_paste_xml_content: "Παρακαλώ επικολλήστε το περιεχόμενο XML που δημιουργήθηκε.",

    // Flashcards specific UI translations
    flashcards_progress_text: "Κάρτα @card από @total",
    flashcards_next: "Επόμενο",
    flashcards_previous: "Προηγούμενο",
    flashcards_check_answer: "Έλεγχος",
    flashcards_your_answer: "Η απάντησή σας",
    flashcards_correct_answer: "Σωστό",
    flashcards_incorrect_answer: "Λάθος",
    flashcards_show_solution: "Σωστή απάντηση",
    flashcards_results: "Αποτελέσματα",
    flashcards_of_correct: "@score από @total σωστά",
    flashcards_show_results: "Εμφάνιση αποτελεσμάτων",
    flashcards_answer_short: "Α:",
    flashcards_retry: "Επανάληψη",
    flashcards_card_announcement: "Λανθασμένη απάντηση. Η σωστή απάντηση ήταν @answer",
    flashcards_correct_announcement: "Το @answer είναι σωστό.",
    flashcards_page_announcement: "Σελίδα @current από @total",

    ticket: "Αίτημα",
    legal_mentions: "Νομικές σημειώσεις",

    // Legal Mentions
    legal_title: "Νομικές σημειώσεις",
    legal_editor_title: "Εκδότης της εφαρμογής",
    legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
    legal_editor_gauthier_remande_function: "Λειτουργία: Καθηγητής Επαγγελματικού Λυκείου Φιλολογίας-Ιστορίας",
    legal_editor_gauthier_remande_email: "Email: gauthier.remande@ac-nantes.fr",
    legal_editor_gauthier_remande_address: "Διεύθυνση: 39 avenue de Chanzy, 53000 Laval, Γαλλία",
    legal_editor_gauthier_remande_phone: "Τηλέφωνο: +33 2 43 67 24 00",
    legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
    legal_editor_emmanuel_gaunard_function: "Λειτουργία: Καθηγητής μαθηματικών και υπεύθυνος αποστολής DRANE – Ακαδημία της Γκρενόμπλ",
    legal_editor_emmanuel_gaunard_email: "Email: emmanuel.gaunard@ac-grenoble.fr",
    legal_editor_emmanuel_gaunard_address: "Διεύθυνση: 30 boulevard de la République, 38200 Vienne, Γαλλία",
    legal_editor_emmanuel_gaunard_phone: "Τηλέφωνο: +33 6 46 74 20 94",
    legal_app_description: "Η διαδικτυακή εφαρμογή «Caramel» είναι ένα ελεύθερο, μη εμπορικό έργο για τη δημιουργία περιεχομένου H5P. Δεν απαιτείται λογαριασμός, δεν συλλέγονται προσωπικά δεδομένα και όλες οι αλληλεπιδράσεις πραγματοποιούνται τοπικά στον περιηγητή.",
    legal_hosting_title: "Φιλοξενία",
    legal_host_name: "<strong>Πάροχος φιλοξενίας</strong>: Forge of Digital Educational Commons",
    legal_host_company: "<strong>Επωνυμία εταιρείας</strong>: Υπουργείο Εθνικής Παιδείας και Νεολαίας",
    legal_host_address: "<strong>Διεύθυνση</strong>: 110 rue de Grenelle, 75007 Παρίσι, Γαλλία",
    legal_host_phone: "<strong>Τηλέφωνο</strong>: +33 1 55 55 10 10",
    legal_publication_director_title: "Διευθυντής έκδοσης",
    legal_publication_director_name: "Gauthier REMANDE και Emmanuel GAUNARD, ως εθελοντές εκδότες.",
    legal_terms_of_use_title: "Γενικοί Όροι Χρήσης",
    legal_terms_of_use_content: "Αυτός ο ιστότοπος επιτρέπει στους χρήστες να δημιουργούν περιεχόμενο H5P. Η εμφάνιση γίνεται τοπικά, χωρίς μετάδοση δεδομένων χρήστη. Ο χρήστης είναι αποκλειστικά υπεύθυνος για τη χρήση του περιεχομένου που δημιουργείται. Η εφαρμογή προσφέρεται δωρεάν, χωρίς καμία εγγύηση λειτουργίας ή αποτελέσματος. Ο εκδότης αποποιείται κάθε ευθύνης σε περίπτωση παρερμηνείας του περιεχομένου ή ακατάλληλης χρήσης.",
    legal_intellectual_property_title: "Πνευματική Ιδιοκτησία",
    legal_intellectual_property_content: "Όλοι οι πηγαίοι κώδικες, τα γραφικά στοιχεία και το περιεχόμενο διατίθενται υπό την ελεύθερη άδεια GNU AGPLv3. Η επαναχρησιμοποίησή τους επιτρέπεται υπό τους όρους των αντίστοιχων αδειών τους. Κάθε αναδιανομή ή τροποποίηση πρέπει να αναφέρει τους αρχικούς συγγραφείς: Gauthier REMANDE και Emmanuel GAUNARD. Οι εικόνες που χρησιμοποιούνται στις ενότητες H5P ανακτώνται από το H5P.org.",
    legal_personal_data_title: "Προσωπικά Δεδομένα",
    legal_personal_data_content: "Δεν συλλέγονται ούτε αποθηκεύονται προσωπικά δεδομένα. Δεν χρησιμοποιούνται cookies παρακολούθησης. Το ιστορικό της περιόδου λειτουργίας αποθηκεύεται στον τοπικό περιηγητή του χρήστη (localStorage), χωρίς μετάδοση. Σύμφωνα με τον GDPR, καμία προσωπική πληροφορία δεν διαβιβάζεται στον εκδότη ή σε τρίτους.",
    legal_accessibility_title: "Προσβασιμότητα",
    legal_accessibility_content: "Η εφαρμογή έχει σχεδιαστεί για να είναι συμβατή με τη χρήση σε υπολογιστή, συμπεριλαμβανομένων των σκοτεινών/φωτεινών λειτουργιών, της πλοήγησης με το πληκτρολόγιο και της υψηλής αντίθεσης ανάλογα με τα θέματα. Η συνεχής βελτίωση της προσβασιμότητας βρίσκεται σε εξέλιξη, σύμφωνα με τις συστάσεις του RGAA.",
    legal_applicable_law_title: "Εφαρμοστέο Δίκαιο",
    legal_applicable_law_content: "Αυτός ο ιστότοπος υπόκειται στο γαλλικό δίκαιο. Σε περίπτωση διαφοράς, τα αρμόδια δικαστήρια θα είναι αυτά της δικαιοδοσίας της Λυών.",
    legal_external_libraries_title: "Χρησιμοποιούμενες εξωτερικές βιβλιοθήκες",
    legal_external_libraries_intro: "Η εφαρμογή Caramel χρησιμοποιεί διάφορες βιβλιοθήκες ανοιχτού κώδικα, με τις ακόλουθες άδειες:",
    legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Άδεια: CC BY 4.0, SIL OFL 1.1, MIT): Παρέχει τα εικονίδια που χρησιμοποιούνται στη διεπαφή για τη βελτίωση της πλοήγησης και της οπτικής εμπειρίας.",
    legal_library_jszip: "<strong>JSZip</strong> (Άδεια: MIT ή GPLv3): Επιτρέπει τη δημιουργία αρχείων .h5p συμπιέζοντας το απαραίτητο περιεχόμενο σε ένα αρχείο zip.",
    legal_library_clientzip: "<strong>client-zip</strong> (Άδεια: MIT): Μια άλλη βιβλιοθήκη που χρησιμοποιείται για τη συμπίεση αρχείων, προσφέροντας μια εναλλακτική λύση υψηλής απόδοσης για τη δημιουργία αρχείων .h5p απευθείας στον περιηγητή.",
    legal_library_fflate: "<strong>fflate</strong> (Άδεια: MIT): Πολύ γρήγορη βιβλιοθήκη για συμπίεση και αποσυμπίεση δεδομένων, που χρησιμοποιείται για τη δημιουργία αρχείων .mbz για ενότητες Moodle.",
    legal_library_tarjs: "<strong>tar-js</strong> (Άδεια: MIT): Επιτρέπει τη δημιουργία αρχείων .tar, ένα απαραίτητο βήμα πριν από τη συμπίεση για τη δημιουργία αρχείων .mbz για ενότητες Moodle.",
    legal_library_ownership: "Κάθε βιβλιοθήκη παραμένει ιδιοκτησία των αντίστοιχων συγγραφέων της και χρησιμοποιείται σύμφωνα με την(τις) άδειά(ές) της.",

    // Essay specific UI translations
    essay_checkAnswer: "Έλεγχος",
    essay_tryAgain: "Προσπάθησε ξανά",
    essay_showSolution: "Εμφάνιση λύσης",
    essay_feedbackHeader: "Ανατροφοδότηση",
    essay_solutionTitle: "Υποδειγματική λύση",
    remainingChars: "Εναπομείναντες χαρακτήρες: @chars",
    notEnoughChars: "Πρέπει να εισαγάγετε τουλάχιστον @chars χαρακτήρες!",
    messageSave: "αποθηκεύτηκε",
    placeholderText: "Ξεκινήστε να γράφετε εδώ...",
    ariaYourResult: "Έχετε λάβει @score από @total βαθμούς",
    ariaNavigatedToSolution: "Πλοηγηθήκατε στη νέα υποδειγματική λύση μετά την περιοχή κειμένου.",

    // Essay Overall Feedback
    essay_overall_feedback_0_10: "Η δουλειά σου είναι μια καλή αρχή. Συνέχισε να εξερευνάς το θέμα για να εμπλουτίσεις τις ιδέες σου.",
    essay_overall_feedback_11_30: "Έχεις θέσει μερικές ενδιαφέρουσες βάσεις. Εμβαθύνοντας σε ορισμένα σημεία, η δουλειά σου θα αποκτήσει μεγαλύτερη ακρίβεια.",
    essay_overall_feedback_31_50: "Η κατανόησή σου για το θέμα είναι σε καλό δρόμο. Σκέψου να αναπτύξεις περαιτέρω τα επιχειρήματά σου για να ενισχύσεις τη θέση σου.",
    essay_overall_feedback_51_70: "Αυτή είναι καλή δουλειά. Δείχνεις καλή γνώση του θέματος. Μερικές ακόμη λεπτομέρειες θα μπορούσαν να τη βελτιώσουν.",
    essay_overall_feedback_71_90: "Πολύ καλή δουλειά! Η ανάλυσή σου είναι σχετική και καλά δομημένη. Δείχνεις εξαιρετική κατανόηση.",
    essay_overall_feedback_91_100: "Εξαιρετική δουλειά! Ο προβληματισμός σου είναι εμπεριστατωμένος, καλά τεκμηριωμένος και δείχνει πλήρη γνώση του θέματος.",

    // True/False Question
    true_false_prompt_role: "Είστε ειδικός στον εκπαιδευτικό σχεδιασμό και δημιουργείτε μια ερώτηση Σωστό/Λάθος για μια δραστηριότητα H5P.",
    true_false_prompt_mission: "Η αποστολή σας είναι να δημιουργήσετε ένα αντικείμενο JSON για μια ερώτηση Σωστό/Λάθος.",
    true_false_prompt_generate_json: "Δημιουργήστε ένα αντικείμενο JSON με βάση την ακόλουθη δομή:",
    true_false_prompt_json_structure_title: "--- ΑΝΑΜΕΝΟΜΕΝΗ ΔΟΜΗ JSON ---",
    true_false_prompt_json_structure_main_object: "Το κύριο αντικείμενο πρέπει να περιέχει τα ακόλουθα κλειδιά:",
    true_false_prompt_question: "`question`: (string) Η δήλωση προς αξιολόγηση. Μπορεί να περιέχει HTML.",
    true_false_prompt_correct: "`correct`: (string) Η σωστή απάντηση, είτε \"true\" είτε \"false\".",
    true_false_prompt_feedback_correct: "`feedbackOnCorrect`: (string) Σχόλιο που εμφανίζεται αν η απάντηση είναι σωστή.",
    true_false_prompt_feedback_wrong: "`feedbackOnWrong`: (string) Σχόλιο που εμφανίζεται αν η απάντηση είναι λανθασμένη.",
    true_false_prompt_content_rules_title: "--- ΚΑΝΟΝΕΣ ΠΕΡΙΕΧΟΜΕΝΟΥ ---",
    true_false_prompt_rule1: "Η ερώτηση πρέπει να είναι μια σαφής δήλωση.",
    true_false_prompt_rule2: "Η τιμή του `correct` πρέπει να είναι μια συμβολοσειρά: \"true\" ή \"false\".",
    true_false_prompt_example_json_title: "--- ΠΑΡΑΔΕΙΓΜΑ JSON ---",
    true_false_prompt_example: `\`\`\`json
{
"question": "<p>Το Όσλο είναι η πρωτεύουσα της Νορβηγίας.</p>",
"correct": "true",
"feedbackOnCorrect": "Σωστή απάντηση! Το Όσλο είναι πράγματι η πρωτεύουσα της Νορβηγίας.",
"feedbackOnWrong": "Λάθος απάντηση. Η πρωτεύουσα της Νορβηγίας είναι το Όσλο."
}
    \`\`\` `,
    true_false_prompt_generate_only_json: "Θέλω να δημιουργήσετε μόνο το JSON, χωρίς σχόλια ή εισαγωγικό κείμενο.",
    true_false_true_text: "Σωστό",
    true_false_false_text: "Λάθος",
    true_false_score: "Έχετε @score από @total πόντους",
    true_false_check_answer: "Έλεγχος",
    true_false_show_solution_button: "Εμφάνιση λύσης",
    true_false_try_again: "Προσπαθήστε ξανά",
    true_false_wrong_answer_message: "Λάθος απάντηση",
    true_false_correct_answer_message: "Σωστή απάντηση",
    true_false_score_bar_label: "Έχετε :num από τους :total πόντους",
    true_false_submit_answer: "Υποβολή",
    true_false_a11y_check: "Ελέγξτε τις απαντήσεις. Οι απαντήσεις θα επισημανθούν ως σωστές, λανθασμένες ή αναπάντητες.",
    true_false_a11y_show_solution: "Εμφάνιση της λύσης. Η εργασία θα επισημανθεί με τη σωστή λύση της.",
    true_false_a11y_retry: "Επαναλάβετε την εργασία. Επαναφέρετε όλες τις απαντήσεις και ξεκινήστε την εργασία από την αρχή.",
    true_false_finish_header: "Ολοκλήρωση;",
    true_false_finish_body: "Είστε σίγουροι ότι θέλετε να ολοκληρώσετε;",
    true_false_cancel_label: "Άκυρο",
    true_false_finish_label: "Ολοκλήρωση",
    true_false_retry_header: "Επανάληψη;",
    true_false_retry_body: "Είστε σίγουροι ότι θέλετε να προσπαθήσετε ξανά;",
    true_false_retry_confirm_label: "Επιβεβαίωση",

    // Multiple Choice UI translations
    checkAnswerButton: "Έλεγχος",
    showSolutionButton: "Εμφάνιση λύσης",
    tryAgainButton: "Προσπάθησε ξανά",
    submitAnswerButton: "Υποβολή",
    scoreBarLabel: "Έχετε :num από τους :total πόντους",
    confirmCheckHeader: "Ολοκλήρωση;",
    confirmCheckBody: "Είστε σίγουροι ότι θέλετε να ολοκληρώσετε;",
    confirmCheckCancelLabel: "Άκυρο",
    confirmCheckConfirmLabel: "Ολοκλήρωση",
    confirmRetryHeader: "Επανάληψη;",
    confirmRetryBody: "Είστε σίγουροι ότι θέλετε να προσπαθήσετε ξανά;",
    confirmRetryCancelLabel: "Άκυρο",
    confirmRetryConfirmLabel: "Επιβεβαίωση",

    // Multiple Choice Prompt
    multiple_choice_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Πολλαπλή Επιλογή\".",
    multiple_choice_prompt_mission: "**Αποστολή σου:**",
    multiple_choice_prompt_generate_json: "Δημιούργησε ένα πλήρες και έγκυρο αντικείμενο JSON για δραστηριότητα H5P Πολλαπλής Επιλογής.",
    multiple_choice_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    multiple_choice_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    multiple_choice_prompt_question: "`question`: Η ερώτηση προς υποβολή (μορφή HTML).",
    multiple_choice_prompt_answers_array: "`answers`: Ένας πίνακας αντικειμένων, καθένα από τα οποία αντιπροσωπεύει μια απάντηση.",
    multiple_choice_prompt_text: "`text`: Το κείμενο της απάντησης (μορφή HTML).",
    multiple_choice_prompt_correct: "`correct`: Μια λογική τιμή (`true` ή `false`) που υποδεικνύει αν είναι η σωστή απάντηση.",
    multiple_choice_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά.",
    multiple_choice_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    multiple_choice_prompt_rule1: "1.  Πρέπει να υπάρχει μόνο μία σωστή απάντηση (`\"correct\": true`).",
    multiple_choice_prompt_rule2: "2.  Δώσε πολλές λανθασμένες απαντήσεις (`\"correct\": false`).",
    multiple_choice_prompt_example_json_title: "**Παράδειγμα JSON:**",
    multiple_choice_prompt_example: `\`\`\`json
{
"question": "<p>Ποιο είναι το πραγματικό χρώμα του φραγκοστάφυλου (cassis);</p>",
"answers": [
{
"correct": true,
"text": "<div>Πολύ σκούρο μωβ</div>"
},
{
"correct": false,
"text": "<div>Μπλε</div>"
},
{
"correct": false,
"text": "<div>Μαύρο</div>"
}
]
}
\`\`\` `,
    multiple_choice_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",

    // Find the Words UI translations
    check: "Έλεγχος",
    tryAgain: "Προσπάθησε ξανά",
    showSolution: "Εμφάνιση λύσης",
    found: "Βρέθηκαν @found από @totalWords λέξεις",
    timeSpent: "Χρόνος που δαπανήθηκε",
    score: "Έχετε @score από τους @total πόντους",
    wordListHeader: "Λίστα λέξεων",

    // Find the Words Prompt
    find_the_words_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Κρυπτόλεξο\".",
    find_the_words_prompt_mission: "**Αποστολή σου:**",
    find_the_words_prompt_generate_json: "Δημιούργησε ένα πλήρες και έγκυρο αντικείμενο JSON για δραστηριότητα H5P Κρυπτόλεξο.",
    find_the_words_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    find_the_words_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    find_the_words_prompt_task_description: "`taskDescription`: Σαφείς οδηγίες για τη δραστηριότητα.",
    find_the_words_prompt_word_list: "`wordList`: Μια συμβολοσειρά με τις λέξεις προς εύρεση, χωρισμένες με κόμμα χωρίς κενά.",
    find_the_words_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    find_the_words_prompt_rule1: "1.  Η `wordList` πρέπει να είναι μια ενιαία συμβολοσειρά με λέξεις χωρισμένες με κόμμα.",
    find_the_words_prompt_example_json_title: "**Παράδειγμα JSON:**",
    find_the_words_prompt_example: `\`\`\`json
{
"taskDescription": "Βρες τα ονόματα των πόλεων στο παρακάτω πλέγμα",
"wordList": "Καμπέρα,Μινσκ,Πεκίνο,Όσλο,Παρίσι,Λονδίνο,Μαδρίτη,Αθήνα,Τόκιο,Μόσχα,Ουάσινγκτον,Στοκχόλμη"
}
\`\`\` `,
    find_the_words_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",
    fillPool: "αβγδεζηθικλμνξοπρστυφχψω",

    // Sort the Paragraphs UI translations
    checkAnswer: "Έλεγχος",
    submitAnswer: "Υποβολή",
    up: "Πάνω",
    down: "Κάτω",
    disabled: "Απενεργοποιημένο",
    a11y_yourResult: "Έχετε @score από τους @total πόντους",
    a11y_paragraph: "Παράγραφος",
    a11y_correct: "σωστό",
    a11y_wrong: "λάθος",
    a11y_point: "@score πόντος",
    a11y_sevenOfNine: "@current από @total",
    a11y_currentPosition: "Τρέχουσα θέση στη λίστα",
    a11y_instructionsSelected: "Πατήστε το πλήκτρο διαστήματος για αναδιάταξη",
    a11y_instructionsGrabbed: "Πατήστε τα πλήκτρα πάνω και κάτω βέλους για να αλλάξετε θέση, το πλήκτρο διαστήματος για να αφήσετε, το escape για ακύρωση",
    a11y_grabbed: "Πιάστηκε",
    a11y_moved: "Μετακινήθηκε",
    a11y_dropped: "Αφέθηκε",
    a11y_reorderCancelled: "Η αναδιάταξη ακυρώθηκε",
    a11y_finalPosition: "Τελική θέση",
    a11y_nextParagraph: "Επόμενη παράγραφος",
    a11y_correctParagraph: "Σωστή παράγραφος στη θέση",
    a11y_listDescription: "Λίστα παραγράφων με δυνατότητα ταξινόμησης.",
    a11y_listDescriptionCheckAnswer: "Λίστα παραγράφων με αποτελέσματα.",
    a11y_listDescriptionShowSolution: "Λίστα παραγράφων με λύσεις.",

    // Sort the Paragraphs Prompt
    sort_the_paragraphs_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Ταξινόμηση παραγράφων\".",
    sort_the_paragraphs_prompt_mission: "**Αποστολή σου:**",
    sort_the_paragraphs_prompt_generate_json: "Δημιούργησε ένα πλήρες και έγκυρο αντικείμενο JSON για δραστηριότητα H5P Ταξινόμησης παραγράφων.",
    sort_the_paragraphs_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    sort_the_paragraphs_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    sort_the_paragraphs_prompt_task_description: "`taskDescription`: Σαφείς οδηγίες για τη δραστηριότητα.",
    sort_the_paragraphs_prompt_paragraphs_array: "`paragraphs`: Ένας πίνακας συμβολοσειρών, καθεμία από τις οποίες αντιπροσωπεύει μια παράγραφο προς ταξινόμηση. Οι παράγραφοι πρέπει να είναι με τη σωστή σειρά.",
    sort_the_paragraphs_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά.",
    sort_the_paragraphs_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    sort_the_paragraphs_prompt_rule1: "1.  Ο πίνακας `paragraphs` πρέπει να περιέχει μια λίστα παραγράφων με τη σωστή λογική σειρά.",
    sort_the_paragraphs_prompt_example_json_title: "**Παράδειγμα JSON:**",
    sort_the_paragraphs_prompt_example: `\`\`\`json
{
"taskDescription": "<p>Η πρωινή μου ρουτίνα:</p>",
"paragraphs": [
"<p>Πρώτα, ξυπνάω στις 7:30 π.μ.</p>",
"<p>Μετά, ντύνομαι</p>",
"<p>Έπειτα, τρώω πρωινό</p>",
"<p>Κατόπιν, βουρτσίζω τα δόντια μου</p>",
"<p>Τέλος, πηγαίνω στο σχολείο</p>"
]
}
 \`\`\` `, 
    sort_the_paragraphs_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",

    // Single Choice Set UI translations
    showSolutionButtonLabel: "Εμφάνιση λύσης",
    retryButtonLabel: "Προσπάθησε ξανά",
    solutionViewTitle: "Λύση",
    correctText: "Σωστό!",
    incorrectText: "Λάθος!",
    muteButtonLabel: "Σίγαση",
    closeButtonLabel: "Κλείσιμο",
    slideOfTotal: "Διαφάνεια @slide από @total",
    nextButtonLabel: "Επόμενο",
    solutionListQuestionNumber: "Ερώτηση @question",
    a11yShowSolution: "Εμφάνιση της λύσης. Η εργασία θα επισημανθεί με τη σωστή λύση της.",
    a11yRetry: "Επαναλάβετε την εργασία. Επαναφέρετε όλες τις απαντήσεις και ξεκινήστε την εργασία από την αρχή.",
    shouldSelect: "Πρέπει να επιλέξει",
    shouldNotSelect: "Δεν πρέπει να επιλέξει",

    // Single Choice Set Prompt
    single_choice_set_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Σετ απλής επιλογής\".",
    single_choice_set_prompt_mission: "**Αποστολή σου:**",
    single_choice_set_prompt_generate_json: "Δημιούργησε ένα πλήρες και έγκυρο αντικείμενο JSON για δραστηριότητα H5P τύπου Σετ απλής επιλογής.",
    single_choice_set_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    single_choice_set_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    single_choice_set_prompt_choices_array: "`choices`: Ένας πίνακας αντικειμένων, όπου κάθε αντικείμενο αντιπροσωπεύει μια ερώτηση και περιλαμβάνει:",
    single_choice_set_prompt_question: "`question`: Η ερώτηση προς υποβολή.",
    single_choice_set_prompt_answers_array: "`answers`: Ένας πίνακας συμβολοσειρών. Η πρώτη συμβολοσειρά είναι πάντα η σωστή απάντηση.",
    single_choice_set_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας 6 αντικειμένων για την τελική ανατροφοδότηση, με βαθμολογίες από 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100. Το κείμενο (`feedback`) πρέπει να είναι ενθαρρυντικό, σταδιακό και πάντα διατυπωμένο θετικά.",
    single_choice_set_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    single_choice_set_prompt_rule1: "1. Σε κάθε πίνακα `answers`, η πρώτη απάντηση είναι πάντα η σωστή.",
    single_choice_set_prompt_example_json_title: "**Παράδειγμα JSON:**",
    single_choice_set_prompt_example: `\`\`\`json
{
"choices": [
{
"question": "Τα μούρα γκότζι είναι επίσης γνωστά ως ...",
"answers": ["Μούρα λύκου", "Μούρα γάτας", "Μούρα αρκούδας"]
},
{
"question": "Τα μούρα γκότζι κατάγονται από ...",
"answers": ["Ασία", "Αφρική", "Ευρώπη"]
}
],
"overallFeedback": [
{"from": 0, "to": 100, "feedback": "Έχεις :numcorrect σωστές απαντήσεις από :maxscore"}
]
}
\`\`\` `,
    single_choice_set_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON, χωρίς σχόλια.",

    // Dialog Cards UI translations
    answer: "Γύρισμα",
    next: "Επόμενο",
    prev: "Προηγούμενο",
    retry: "Επανάληψη",
    progressText: "Κάρτα @card από @total",
    cardFrontLabel: "Μπροστινή πλευρά κάρτας",
    cardBackLabel: "Πίσω πλευρά κάρτας",
    tipButtonLabel: "Εμφάνιση συμβουλής",
    audioNotSupported: "Το πρόγραμμα περιήγησής σας δεν υποστηρίζει αυτόν τον ήχο",

    // Dialog Cards Prompt
    dialog_cards_prompt_role: "Είσαι ειδικός/ή στον εκπαιδευτικό σχεδιασμό και δημιουργείς δραστηριότητα H5P \"Κάρτες διαλόγου\".",
    dialog_cards_prompt_mission: "**Αποστολή σου:**",
    dialog_cards_prompt_generate_json: "Δημιούργησε ένα αντικείμενο JSON που να περιέχει μόνο τα κλειδιά `title`, `description` και `dialogs` για μια δραστηριότητα H5P τύπου Κάρτες διαλόγου.",
    dialog_cards_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    dialog_cards_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    dialog_cards_prompt_title: "`title`: Ένας τίτλος για τη δραστηριότητα (μορφή HTML).",
    dialog_cards_prompt_description: "`description`: Μια σύντομη περιγραφή ή οδηγία (μορφή HTML).",
    dialog_cards_prompt_dialogs_array: "`dialogs`: Ένας πίνακας ${nombreQuestions} αντικειμένων, καθένα από τα οποία αντιπροσωπεύει μια κάρτα και περιέχει:",
    dialog_cards_prompt_text: "`text`: Το κείμενο στην μπροστινή πλευρά της κάρτας (μορφή HTML).",
    dialog_cards_prompt_answer: "`answer`: Το κείμενο στην πίσω πλευρά της κάρτας (μορφή HTML).",
    dialog_cards_prompt_tips: "`tips` (προαιρετικό): Ένα αντικείμενο για υποδείξεις. Εάν το κρίνετε παιδαγωγικά χρήσιμο, προσθέστε μια υπόδειξη για την μπροστινή όψη με το κλειδί `front` ή/και για την πίσω όψη με το κλειδί `back`.",
    dialog_cards_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    dialog_cards_prompt_rule1: "1. Τα κείμενα για την μπροστινή (`text`) και την πίσω (`answer`) όψη πρέπει να είναι σαφή και συνοπτικά. **Μορφοποιήστε το περιεχόμενο με HTML (<strong> για έντονα, <em> για πλάγια) για να βελτιώσετε την αναγνωσιμότητα και να τονίσετε σημαντικές πληροφορίες.**",
    dialog_cards_prompt_rule2: "2. Μην προσθέτετε εικόνες ή ήχους.",
    dialog_cards_prompt_rule3: "",
    dialog_cards_prompt_example_json_title: "**Παράδειγμα JSON:**",
    dialog_cards_prompt_example: `\`\`\`json
{
"title": "<p>Μάθετε τα ονόματα των φρούτων στα Αγγλικά</p>",
"description": "<p>Τα ονόματα των φρούτων εμφανίζονται στα Ελληνικά. Γυρίστε τις κάρτες για να δείτε τη σωστή αγγλική μετάφραση.</p>",
"dialogs": [
{
"text": "<p style=\"text-align: center;\">Φράουλες</p>",
"answer": "<p style=\"text-align: center;\">Strawberries</p>",
"image": {
"copyright": {
"license": "CC BY-SA",
"source": "https://commons.wikimedia.org/wiki/File:Bowl_of_Strawberries.jpg",
"author": "ShakataGaNai",
"title": "Bowl_of_Strawberries.jpg",
"version": "4.0"
},
"imageAltText": "Κόκκινα φρούτα με πράσινα φύλλα"
},
"audio": [],
"tips": {}
},
{
"text": "<p style=\"text-align: center;\">Σμέουρα</p>",
"answer": "<p style=\"text-align: center;\">Raspberries</p>",
"image": {
"copyright": {
"license": "CC BY",
"source": "https://commons.wikimedia.org/wiki/File:Summer_raspberries,_2008.jpg",
"title": "Summer_raspberries,_2008.jpg",
"author": "www.bluewaikiki.com",
"version": "4.0"
},
"imageAltText": "Κόκκινα μούρα"
},
"audio": [],
"tips": {}
}
]
}
\`\`\` `,
    dialog_cards_prompt_generate_only_json: "Παράγετε μόνο έγκυρο JSON που περιέχει τα κλειδιά `title`, `description` και `dialogs`, χωρίς σχόλια.",

    // Dialog Cards specific UI translations
    correctAnswer: "Το βρήκα σωστά!",
    incorrectAnswer: "Έκανα λάθος",
    round: "Γύρος @round",
    cardsLeft: "Κάρτες που απομένουν: @number",
    nextRound: "Προχωρήστε στον γύρο @round",
    startOver: "Ξεκινήστε από την αρχή",
    showSummary: "Επόμενο",
    summary: "Περίληψη",
    summaryCardsRight: "Κάρτες που βρήκατε σωστά:",
    summaryCardsWrong: "Κάρτες που κάνατε λάθος:",
    summaryCardsNotShown: "Κάρτες στην τράπουλα που δεν εμφανίστηκαν:",
    summaryOverallScore: "Συνολική βαθμολογία",
    summaryCardsCompleted: "Κάρτες που έχετε ολοκληρώσει την εκμάθηση:",
    summaryCompletedRounds: "Ολοκληρωμένοι γύροι:",
    summaryAllDone: "Μπράβο! Απαντήσατε σωστά σε όλες τις @cards κάρτες @max φορές στη σειρά!",
    confirmStartingOverHeader: "Ξεκινήσετε από την αρχή;",
    confirmStartingOverBody: "Όλη η πρόοδος θα χαθεί. Είστε σίγουροι ότι θέλετε να ξεκινήσετε από την αρχή;",
    confirmStartingOverCancelLabel: "Άκυρο",
    confirmStartingOverConfirmLabel: "Ξεκινήστε από την αρχή",

    // Complex Fill the Blanks Prompt
    complex_blanks_prompt_role: "Είστε ειδικός στον εκπαιδευτικό σχεδιασμό και δημιουργείτε μια δραστηριότητα H5P \"Complex Fill the Blanks\".",
    complex_blanks_prompt_mission: "**Η αποστολή σας:**",
    complex_blanks_prompt_generate_json: "Δημιουργήστε ένα πλήρες και έγκυρο αντικείμενο JSON για μια δραστηριότητα H5P τύπου Complex Fill the Blanks.",
    complex_blanks_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    complex_blanks_prompt_json_structure_main_object: "Το κύριο αντικείμενο πρέπει να περιέχει τα κλειδιά `content` και `overallFeedback`.",
    complex_blanks_prompt_task: "`task`: Οι οδηγίες για την άσκηση (σε HTML).",
    complex_blanks_prompt_blanks_text: "`blanksText`: Το κείμενο που περιέχει τα κενά, τα οποία αναπαρίστανται με `___________`.",
    complex_blanks_prompt_blanks_list: "`blanksList`: Ένας πίνακας αντικειμένων, ένα για κάθε κενό, με τη σειρά εμφάνισης.",
    complex_blanks_prompt_correct_answer: "`correctAnswerText`: Η σωστή απάντηση (μπορεί να περιλαμβάνει εναλλακτικές με `/`).",
    complex_blanks_prompt_incorrect_answers_list: "`incorrectAnswersList`: Ένας πίνακας αντικειμένων για συνήθη λάθη.",
    complex_blanks_prompt_incorrect_answer_text: "`incorrectAnswerText`: Το κείμενο ενός συνηθισμένου λάθους.",
    complex_blanks_prompt_incorrect_answer_feedback: "`incorrectAnswerFeedback`: Η ειδική ανατροφοδότηση για αυτό το λάθος (σε HTML).",
    complex_blanks_prompt_overall_feedback: "`overallFeedback`: Ένας πίνακας για γενική ανατροφοδότηση βάσει της βαθμολογίας.",
    complex_blanks_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    complex_blanks_prompt_rule1: "1. Ο αριθμός των αντικειμένων στο `blanksList` πρέπει να αντιστοιχεί στον αριθμό των κενών στο `blanksText`.",
    complex_blanks_prompt_rule2: "2. Παρέχετε συνήθη λάθη και εποικοδομητική ανατροφοδότηση.",
    complex_blanks_prompt_rule3: "3. Το κείμενο και η ανατροφοδότηση μπορούν να περιέχουν απλές ετικέτες HTML όπως `<p>`, `<strong>`, `<em>`.",
    complex_blanks_prompt_example_json_title: "**Παράδειγμα JSON:**",
    complex_blanks_prompt_example: `\`\`\`json
{
"content": {
"task": "<p>Βάλε τα ρήματα στον σωστό χρόνο. Θα λάβεις ατομικά σχόλια για συνηθισμένα λάθη.</p>",
"blanksList": [
{
"correctAnswerText": "δεν μιλά",
"incorrectAnswersList": [
{
"incorrectAnswerText": "μιλά όχι",
"incorrectAnswerFeedback": "<div>Θυμήσου ότι η άρνηση μπαίνει πριν από το ρήμα <em>(μιλάω)</em>.</div>"
},
{
"incorrectAnswerText": "δεν μιλάμε",
"incorrectAnswerFeedback": "<div>Ξέχασες ότι το υποκείμενο είναι τρίτο πρόσωπο ενικού <em>(αυτός)</em>.</div>"
}
]
}
],
"blanksText": "<p>Μιλάει αγγλικά αλλά (δεν / μιλάω) ___________<strong>&nbsp;</strong>γερμανικά.</p>"
},
"overallFeedback": [
{"from": 0, "to": 50, "feedback": "Δοκίμασε ξανά!"},
{"from": 51, "to": 75, "feedback": "Καλά τα πήγες!"},
{"from": 76, "to": 100, "feedback": "Μπράβο!"}
]
}
\`\`\` `,
   complex_blanks_prompt_generate_only_json: "Δημιουργήστε μόνο τον έγκυρο κώδικα JSON, χωρίς κανένα σχόλιο.",

    // Chart Prompt
    chart_prompt_role: "Είστε ειδικός στον εκπαιδευτικό σχεδιασμό και δημιουργείτε μια δραστηριότητα H5P \"Γράφημα\".",
    chart_prompt_mission: "**Η αποστολή σας:**",
    chart_prompt_generate_json: "Δημιουργήστε ένα πλήρες και έγκυρο αντικείμενο JSON για μια δραστηριότητα H5P τύπου Γράφημα.",
    chart_prompt_json_structure_title: "**Αναμενόμενη δομή JSON:**",
    chart_prompt_json_structure_main_object: "Το αντικείμενο πρέπει να περιέχει:",
    chart_prompt_graph_mode: "`graphMode`: Επιλέξτε τον πιο σχετικό τύπο γραφήματος, 'pieChart' (πίτα) ή 'barChart' (ράβδων), με βάση το πλαίσιο, εκτός αν δοθεί άλλη εντολή.",
    chart_prompt_list_of_types: "`listOfTypes`: Ένας πίνακας αντικειμένων, καθένα από τα οποία αντιπροσωπεύει ένα σημείο δεδομένων στο γράφημα.",
    chart_prompt_value: "`value`: Η αριθμητική τιμή του σημείου δεδομένων.",
    chart_prompt_color: "`color`: Το χρώμα του σημείου δεδομένων (δεκαεξαδικός κώδικας).",
    chart_prompt_font_color: "`fontColor`: Το χρώμα του κειμένου για το σημείο δεδομένων (δεκαεξαδικός κώδικας).",
    chart_prompt_text: "`text`: Η ετικέτα για το σημείο δεδομένων.",
    chart_prompt_figure_definition: "`figureDefinition`: Μια σύντομη περιγραφή του γραφήματος.",
    chart_prompt_content_rules_title: "**Κανόνες περιεχομένου:**",
    chart_prompt_rule1: "1. Επιλέξτε χρώματα με αντίθεση για καλή αναγνωσιμότητα.",
    chart_prompt_rule2: "2. Οι ετικέτες πρέπει να είναι σύντομες και σαφείς.",
    chart_prompt_rule3: "3. Εάν μια τιμή είναι πολύ χαμηλή σε σύγκριση με άλλες, προτιμήστε ένα 'barChart' για καλύτερη οπτικοποίηση.",
    chart_prompt_example_json_title: "**Παράδειγμα JSON:**",
    chart_prompt_example: `\`\`\`json
{
"graphMode": "pieChart",
"listOfTypes": [
{"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Μύρτιλα"},
{"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Σμέουρα"}
],
"figureDefinition": "Διάγραμμα"
}
\`\`\` `,
    chart_prompt_generate_only_json: "Δημιουργήστε μόνο τον έγκυρο κώδικα JSON, χωρίς κανένα σχόλιο.",

    // createH5PWithDynamicDependencies
    quiz_prev_button: "Προηγούμενο",
    quiz_next_button: "Επόμενο",
    quiz_finish_button: "Τέλος",
    quiz_submit_button: "Υποβολή",
    quiz_textual_progress: "Ερώτηση @current από @total",
    quiz_no_result_message: "Ολοκληρώθηκε",
    quiz_result_message: "Τα αποτελέσματά σας:",
    quiz_score_bar_label: "Έχετε @finals από τους @totals πόντους",
    quiz_solution_button_text: "Εμφάνιση λύσης",
    quiz_retry_button_text: "Επανάληψη",
    quiz_finish_button_text: "Τέλος",
    quiz_submit_button_text: "Υποβολή",
    quiz_feedback_available: "Διαθέσιμη ανατροφοδότηση",
    quiz_read_feedback: "Διαβάστε την ανατροφοδότηση",
    quiz_wrong_answer: "Λάθος απάντηση",
    quiz_correct_answer: "Σωστή απάντηση",
    quiz_should_check: "Θα έπρεπε να έχει επιλεγεί",
    quiz_should_not_check: "Δεν θα έπρεπε να έχει επιλεγεί",
    quiz_no_input: "Παρακαλώ απαντήστε πριν δείτε τη λύση.",
    quiz_a11y_check: "Ελέγξτε τις απαντήσεις. Οι απαντήσεις θα επισημανθούν ως σωστές, λανθασμένες ή αναπάντητες.",
    quiz_a11y_show_solution: "Εμφάνιση της λύσης. Η εργασία θα επισημανθεί με τη σωστή λύση της.",
    quiz_a11y_retry: "Επαναλάβετε την εργασία. Επαναφέρετε όλες τις απαντήσεις και ξεκινήστε την εργασία από την αρχή.",

    // Albert generation
    generate_with_albert: "Δημιουργία με τον Albert",
    generation_in_progress: "Δημιουργία σε εξέλιξη, παρακαλώ περιμένετε...",
    request_sent_to_ia: "Αίτημα εστάλη στην ΤΝ, παρακαλώ περιμένετε...",
    generation_successful: "Το περιεχόμενο H5P δημιουργήθηκε με επιτυχία!",
    generation_failed_empty: "Η δημιουργία απέτυχε. Η απάντηση ήταν κενή.",
    generation_failed_error: "Σφάλμα κατά τη δημιουργία: {errorMessage}",

    // Albert models description
    albert_small_summary: "Γρήγορο, απλό, κατάλληλο για γρήγορες και δομημένες ασκήσεις.",
    albert_small_technical: "Llama 3.1",
    albert_large_summary: "Ισχυρό, με αποχρώσεις, ιδανικό για σύνθετες εργασίες και συγγραφή.",
    albert_large_technical: "Mistral Small 3.2",
    albert_code_summary: "Εξειδικευμένο, ακριβές, σχεδιασμένο για προγραμματισμό και κώδικα.",
    albert_code_technical: "Qwen 2.5 Coder",

    // Albert models pills
    albert_model_source: "Μοντέλο προέλευσης:",
    albert_model_parameters: "Μέγεθος μοντέλου:",
    albert_model_parameters_small: "8 δισ. παράμετροι",
    albert_model_parameters_large: "24 δισ. παράμετροι",
    albert_model_parameters_code: "32,5 δισ. παράμετροι",
    language: "Γλώσσα",
    tutorial: "Οδηγός",

    // Προτροπή Γλωσσαρίου XML
    glossaire_xml_prompt_role: "Είσαι ειδικός στον εκπαιδευτικό σχεδιασμό και θα δημιουργήσεις το περιεχόμενο για ένα γλωσσάρι.",
    glossaire_xml_prompt_mission: "**Η αποστολή σου:** Πρέπει να δημιουργήσεις ένα απλό αντικείμενο JSON που να περιέχει μια λίστα όρων για ένα γλωσσάρι. Κάθε όρος πρέπει να έχει μια έννοια, έναν ορισμό και, αν είναι σχετικό, μια λίστα από ψευδώνυμα/συνώνυμα.",
    glossaire_xml_prompt_structure_title: "**Αναμενόμενη δομή JSON:**",
    glossaire_xml_prompt_structure_rules: `
-   **Ρίζα:** Ένα κύριο αντικείμενο που περιέχει δύο κλειδιά: \`name\` (το όνομα του γλωσσαρίου) και \`entries\` (ένας πίνακας αντικειμένων).
-   **Κάθε αντικείμενο στο \`entries\` πρέπει να περιέχει:**
    -   \`concept\`: Τη λέξη ή φράση που θα οριστεί.
    -   \`definition\`: Τον σαφή και συνοπτικό ορισμό.
    -   \`aliases\` (προαιρετικό): Ένας πίνακας συμβολοσειρών για συνώνυμα ή εναλλακτικούς όρους. Πρόσθεσε αυτό το κλειδί μόνο αν υπάρχουν σχετικά ψευδώνυμα.`,
    glossaire_xml_prompt_example_title: "**Παράδειγμα JSON:**",
    glossaire_xml_prompt_example: `\`\`\`json
{
  "name": "Το γλωσσάρι της πληροφορίας",
  "entries": [
    {
      "concept": "Δημοσιογράφος",
      "definition": "Άτομο που συλλέγει, επαληθεύει και διαδίδει πληροφορίες.",
      "aliases": ["Ρεπόρτερ", "Χρονογράφος"]
    },
    {
      "concept": "Πηγή",
      "definition": "Προέλευση μιας πληροφορίας."
    }
  ]
}
\`\`\``,
    glossaire_xml_prompt_generate_only_xml: "Παρήγαγε μόνο έγκυρο κώδικα JSON, χωρίς κανένα σχόλιο.",
};