const translations_el = {
  subtitle: "Δημιουργία Πόρων και Δραστηριοτήτων για Moodle και Éléa με Υποβοήθηση ΤΝ",
  help_modal_title: "🚀 Πλήρης οδηγός Caramel για εκπαιδευτικούς",
  help_modal_content: `
    <p>Καλώς ήρθατε στο <strong>Caramel</strong>! Αυτός ο οδηγός έχει σχεδιαστεί για να σας καθοδηγεί βήμα-βήμα, ακόμη κι αν ξεκινάτε τώρα. Στόχος μας είναι να σας βοηθήσουμε να δημιουργείτε διαδραστικές μαθησιακές δραστηριότητες απλά και αποτελεσματικά.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Περιγραφή</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Επιλογή</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Δημιουργία</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Προβολή & Λήψη</a>
        <a href="#communaute" class="help-nav-link"><i class="fas fa-users"></i> Κοινότητα</a>
    </div>

    <div id="philosophie" class="help-section help-philosophy">
        <h4><i class="fas fa-lightbulb"></i> Η φιλοσοφία μας: εσείς κρατάτε τον έλεγχο!</h4>
        <p>Με το Caramel, η τεχνητή νοημοσύνη είναι βοηθός· εσείς καθοδηγείτε. Διατηρείτε τον έλεγχο σε κάθε στάδιο:</p>
        <ul>
            <li><strong>Πριν:</strong> Καθορίζετε το παιδαγωγικό πλαίσιο συμπληρώνοντας τα πεδία περιγραφής.</li>
            <li><strong>Κατά τη διάρκεια:</strong> Μόλις παραχθεί το περιεχόμενο από την ΤΝ (ο κώδικας JSON), μπορείτε να το επεξεργαστείτε απευθείας στον επεξεργαστή.</li>
            <li><strong>Μετά:</strong> Ακόμη και μετά τη λήψη του αρχείου, μπορείτε να το ανοίξετε και να το τροποποιήσετε σε άλλα εργαλεία, αν χρειαστεί.</li>
        </ul>
    </div>

    <div id="decrire" class="help-section">
        <h4><span class="help-step-number">1</span> Περιγράψτε την ανάγκη σας: το σημείο εκκίνησης</h4>
        <p>Από εδώ ξεκινούν όλα. Όσο πιο σαφής η περιγραφή, τόσο πιο σχετικό το αποτέλεσμα. Έχετε δύο επιλογές:</p>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Γρήγορη λειτουργία</span></h5>
            <p>Ιδανική για τα βασικά. Συμπληρώστε δύο πεδία:</p>
            <ul>
                <li><strong>Ποιος/ποια είστε;</strong> Να είστε άμεσοι. Δεν χρειάζεται πρόταση. Παραδείγματα: <em>Καθηγητής/τρια Μαθηματικών</em>, <em>Ακαδημαϊκός επιμορφωτής</em>.</li>
                <li><strong>Τι θέλετε να καλύψετε;</strong> Η ουσία του αιτήματός σας. Να είστε όσο πιο ολοκληρωμένοι γίνεται. Συμπεριλάβετε θέμα, επίπεδο και περιορισμούς. Παράδειγμα: <em>Εισαγωγή στα κλάσματα για μαθητές ΣΤ΄ Δημοτικού, με παραδείγματα όπως το μοίρασμα μιας τούρτας.</em></li>
            </ul>
        </div>
        <div class="help-subsection">
            <h5><span class="help-badge-mode">Προχωρημένη λειτουργία</span></h5>
            <p>Για πιο δομημένο αίτημα, αυτή η λειτουργία προσφέρει συγκεκριμένα πεδία:</p>
            <ul>
                <li><strong>Μάθημα, Θέμα, Επίπεδο:</strong> για τον καθορισμό πλαισίου.</li>
                <li><strong>Αριθμός στοιχείων:</strong> Πολύ σημαντικό! Αντιστοιχεί στον αριθμό ερωτήσεων, ημερομηνιών σε χρονογραμμή, λέξεων σε γλωσσάρι, κ.λπ.</li>
                <li><strong>Συμπληρωματικές πληροφορίες:</strong> Χώρος για ειδικές οδηγίες, περιορισμούς ή άλλα σχετικά στοιχεία.</li>
            </ul>
            <p><span class="help-badge-feature"><i class="fas fa-file-alt"></i> Ενεργοποίηση ανάγνωσης εγγράφου</span><br>
            Αυτή η ισχυρή επιλογή επιτρέπει τη δημιουργία βάσει περιεχομένου που παρέχετε. Μπορείτε είτε να <strong>κάνετε αντιγραφή-επικόλληση κειμένου</strong> είτε να <strong>ανεβάσετε ένα έγγραφο (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
            <br><strong><i class="fas fa-lock"></i> Απόρρητο :</strong> Μην ανησυχείτε, η επεξεργασία του εγγράφου σας γίνεται <strong>εξ ολοκλήρου τοπικά στον υπολογιστή σας</strong>. Κανένα δεδομένο δεν αποστέλλεται στο Διαδίκτυο.</p>
        </div>
    </div>

    <div id="choisir" class="help-section">
        <h4><span class="help-step-number">2</span> Επιλέξτε τύπο δραστηριότητας</h4>
        <p>Αφού ολοκληρώσετε την περιγραφή, οι πλακίδες δραστηριοτήτων είναι διαθέσιμες. Κάντε κλικ σε εκείνη που ταιριάζει στον διδακτικό στόχο σας.</p>
        <details>
            <summary><strong>Κάντε κλικ εδώ για λεπτομέρειες των διαθέσιμων δραστηριοτήτων</strong></summary>
            <h5><span class="help-badge-tab">H5P</span></h5>
            <p>Διαδραστικές δραστηριότητες σε μορφή H5P. Όσες έχουν αστερίσκο <span class="feedback-star">*</span> περιλαμβάνουν από προεπιλογή αναλυτικό ανατροφοδοτικό σε 6 κλίμακες βαθμολογίας.</p>
            <ul>
                <li><strong>Χρονογραμμή:</strong> Δημιουργήστε διαδραστική ακολουθία γεγονότων.</li>
                <li><strong>Κάρτες μνήμης:</strong> Κάρτες εμπρός/πίσω για απομνημόνευση.</li>
                <li><strong>Κουίζ (Question Set) <span class="feedback-star">*</span>:</strong> Σύνολο ερωτήσεων (πολλαπλής επιλογής, μεταφορά-απόθεση, κ.ά.).</li>
                <li><strong>Γλωσσάρι:</strong> Γλωσσάρι ή FAQ σε μορφή accordion.</li>
                <li><strong>Σταυρόλεξο <span class="feedback-star">*</span>:</strong> Δημιουργία σταυρολέξου από ορισμούς.</li>
                <li><strong>Έκθεση <span class="feedback-star">*</span>:</strong> Θέμα γραπτού με αυτόματη διόρθωση βάσει λέξεων-κλειδιών.</li>
                <li><strong>Περίληψη <span class="feedback-star">*</span>:</strong> Οι μαθητές ανασυνθέτουν σωστή περίληψη επιλέγοντας προτάσεις.</li>
                <li><strong>Σύρσιμο λέξεων <span class="feedback-star">*</span>:</strong> Κείμενο με έλλειψη λέξεων που σύρονται.</li>
                <li><strong>Κείμενο με κενά <span class="feedback-star">*</span>:</strong> Συμπλήρωση κενών από πληκτρολόγιο.</li>
                <li><strong>Επισήμανση λέξεων <span class="feedback-star">*</span>:</strong> Επισήμανση συγκεκριμένων λέξεων σε κείμενο.</li>
                <li><strong>Σωστό/Λάθος:</strong> Απλές δυαδικές ερωτήσεις.</li>
                <li><strong>Πολλαπλής επιλογής <span class="feedback-star">*</span>:</strong> Ερωτήσεις με μία/πολλές σωστές απαντήσεις.</li>
                <li><strong>Κρυπτόλεξο:</strong> Πλέγμα γραμμάτων για αναζήτηση λέξεων.</li>
                <li><strong>Ταξινόμηση παραγράφων <span class="feedback-star">*</span>:</strong> Επαναφορά παραγράφων στη σωστή σειρά.</li>
                <li><strong>Σειρά μονο-επιλογής <span class="feedback-star">*</span>:</strong> Σειρά ερωτήσεων με μία σωστή απάντηση.</li>
                <li><strong>Κάρτες διαλόγου:</strong> Διαδραστικές κάρτες εμπρός/πίσω με κείμενο και ήχο.</li>
                <li><strong>Σύνθετο κείμενο με κενά <span class="feedback-star">*</span>:</strong> Προηγμένο cloze με ειδική ανατροφοδότηση.</li>
                <li><strong>Διάγραμμα:</strong> Κυκλικό ή ραβδοδιάγραμμα για απεικόνιση δεδομένων.</li>
            </ul>
            <h5><span class="help-badge-tab">Moodle/Éléa</span></h5>
            <ul>
                <li><strong>Τεστ (XML / GIFT):</strong> Δημιουργία τράπεζας ερωτήσεων (πολλαπλής, αντιστοίχισης κ.λπ.) για εισαγωγή στο Moodle.</li>
                <li><strong>Πολλαπλής επιλογής (MBZ):</strong> Γρήγορη, απλή δραστηριότητα πολλαπλής επιλογής.</li>
                <li><strong>Αντιστοίχιση (MBZ):</strong> Παιχνίδι αντιστοίχισης ζευγών.</li>
                <li><strong>Εκατομμυριούχος (MBZ):</strong> Κουίζ με αυξανόμενη δυσκολία.</li>
                <li><strong>Γλωσσάρι (XML):</strong> Αρχείο για εισαγωγή λίστας ορισμών σε γλωσσάρι Moodle.</li>
                <li><strong>Σελίδα (MBZ / HTML):</strong> Δομημένη, οπτικά μορφοποιημένη σελίδα μαθήματος για Éléa.</li>
            </ul>
        </details>
    </div>

    <div id="generer" class="help-section">
        <h4><span class="help-step-number">3</span> Δημιουργία και βελτίωση περιεχομένου</h4>
        <p>Μετά το κλικ σε πλακίδα, ανοίγει ένα παράθυρο. Εκεί αλληλεπιδράτε με την ΤΝ.</p>
        <div class="help-subsection">
            <h5><i class="fas fa-rocket"></i> Επιλογή Α: Απλή Προβολή - Δημιουργία με ένα κλικ</h5>
            <p>Ο γρήγορος δρόμος. Κάντε κλικ στο <button class="help-btn-example-llm">Δημιουργία με ένα κλικ</button> ώστε η ΤΝ να παράγει το περιεχόμενο και να το τοποθετήσει δεξιά στην περιοχή αποτελεσμάτων. Μπορείτε να επιλέξετε διαφορετικά μοντέλα ΤΝ (γρήγορο, ισχυρό...) από το μικρό βέλος δεξιά του κουμπιού.</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Επιλογή Β: Καθοδηγούμενη Προβολή - Χρήση εξωτερικής ΤΝ</h5>
            <p>Για μέγιστο έλεγχο. Το prompt (οδηγία προς την ΤΝ) εμφανίζεται αριστερά.</p>
            <ol>
                <li>Τροποποιήστε το prompt αν θέλετε.</li>
                <li>Χρησιμοποιήστε το κουμπί <strong>Αντιγραφή προτροπής</strong> και ανοίξτε μια δημόσια διαθέσιμη ΤΝ της επιλογής σας σε νέα καρτέλα.</li>
                <li>Επικολλήστε το prompt στην ΤΝ, πάρτε την απάντηση και επικολλήστε την δεξιά στην περιοχή αποτελεσμάτων στο Caramel.</li>
            </ol>
            <p>Χρήσιμα εικονίδια: <span class="help-badge-icon"><i class="fas fa-expand"></i> Πλήρης οθόνη</span> για άνεση και <span class="help-badge-icon"><i class="fas fa-lock"></i> Κλείδωμα</span> για προστασία του prompt.</p>
        </div>
    </div>

    <div id="integrer" class="help-section">
        <h4><span class="help-step-number">4</span> Προβολή και λήψη</h4>
        <p>Μόλις δημιουργηθεί το περιεχόμενο, μπορείτε να το προβάλετε, να το δοκιμάσετε και να το κατεβάσετε σε διάφορες μορφές.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> Προβολή και δοκιμή</summary>
            <p>Αφιερώστε χρόνο για να ελέγξετε τη δραστηριότητά σας στο παράθυρο προβολής:</p>
            <ul>
                <li><strong>Κυλήστε</strong> στο περιεχόμενο για να διαβάσετε τα πάντα.</li>
                <li><strong>Δοκιμάστε</strong> τη δραστηριότητα ως μαθητής (κλικ, σύρσιμο, πληκτρολόγηση...).</li>
                <li>Για περιεχόμενο <strong>Éléa/Magistère/Moodle</strong>, ένας προσομοιωτής σάς δείχνει την πραγματική απόδοση.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Παράθυρο προβολής" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Δοκιμάστε τη δραστηριότητα απευθείας στον προσομοιωτή.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Λήψη (Μορφές & Εξαγωγές)</summary>
            <p>Έχετε αρκετές επιλογές για να ανακτήσετε την εργασία σας:</p>
            <ul>
                <li><strong>Διαδραστική μορφή (κύριο κουμπί):</strong> Για να ανακτήσετε το ψηφιακό αρχείο (π.χ. .h5p, .mbz) για να το τοποθετήσετε στην πλατφόρμα σας.</li>
                <li><strong>Άλλα φορμά (αναπτυσσόμενο μενού):</strong> Κάντε κλικ στο βέλος για λήψη σε <strong>PDF, DOCX ή ODT</strong> (χρήσιμο για εκτύπωση ή αρχειοθέτηση).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Μενού εξαγωγής" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Ανοίξτε το μενού για πρόσβαση σε εξαγωγές PDF, DOCX...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Ενσωμάτωση στο Éléa/Magistère</h5>
        <p>Μόλις κατέβει το αρχείο, δείτε πώς να το προσθέσετε στο μάθημά σας:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (Δραστηριότητες H5P)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Απλή μέθοδος:</strong> Ενεργοποιήστε τη λειτουργία επεξεργασίας στο μάθημά σας και σύρετε-αποθέστε το αρχείο .h5p απευθείας στην ενότητα που θέλετε. Επιλέξτε "Ajouter une activité H5P" και ολοκληρώστε με το κουμπί "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="Γρήγορη προσθήκη δραστηριότητας H5P" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Προσθέστε τη δραστηριότητα H5P και κάντε κλικ στο DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Συνιστώμενη μέθοδος (για σχεδιαστές):</strong> Κάντε κλικ στο "Προσθήκη δραστηριότητας ή πόρου", επιλέξτε "Διαδραστικό περιεχόμενο (H5P)" και στο πεδίο "Επεξεργαστής" διαλέξτε την καρτέλα "Téléverser" για να συνεχίσετε με "Téléverser un fichier". Ολοκληρώστε με "Utiliser", προσθέστε τα απαραίτητα στοιχεία και αποθηκεύστε. Έτσι η δραστηριότητα θα συμπεριληφθεί όταν κοινοποιήσετε το μάθημα.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Σελίδα, Εκατομμυριούχος, Ταίριασμα, MCQ)</summary>
                <div class="import-content">
                    <p>Η μορφή αυτή εισάγει πλήρη δραστηριότητα στο μάθημά σας.</p>
                    <ol>
                        <li>
                            <p>Ανοίξτε το μενού επεξεργασίας στα δεξιά της οθόνης. Αν είναι κρυμμένο, χρησιμοποιήστε το μικρό βέλος για να το εμφανίσετε.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Μενού επεξεργασίας ανοιχτό στη δεξιά στήλη" style="width:75%;height:auto;">
                                    <figcaption><em>Μενού επεξεργασίας ανοιχτό.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Βέλος για ανάπτυξη του πίνακα επεξεργασίας" style="width:75%;height:auto;">
                                    <figcaption><em>Αναπτύξτε το πάνελ αν χρειάζεται.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Κάντε κλικ στο "IMPORT/EXPORT" και μετά στο "Importer un parcours" στο υπομενού.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="Κουμπί IMPORT/EXPORT στο Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Επιλέξτε Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Σύρετε-αποθέστε το αρχείο .mbz στη ζώνη εισαγωγής και κάντε κλικ στο "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Περιοχή απόθεσης για το αρχείο MBZ" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Αφήστε το αρχείο και επιβεβαιώστε με IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>Ολοκληρώστε πατώντας "CONTINUER" στο τελευταίο βήμα: η δραστηριότητα προστέθηκε στο μάθημα.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Δραστηριότητα Γλωσσάριο)</summary>
                <div class="import-content">
                    <p>Αυτή η μορφή σας επιτρέπει να εισάγετε μια λίστα ορισμών σε γλωσσάριο Éléa/Moodle.</p>
                    <ol>
                        <li>
                            <p>Δημιουργήστε μια κενή δραστηριότητα Γλωσσάριο στο μάθημά σας και ανοίξτε τη.</p>
                        </li>
                        <li>
                            <p>Μόλις βρεθείτε μέσα στο Γλωσσάριο, κάντε κλικ στο κουμπί "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="Κουμπί IMPORTER DES ARTICLES στο γλωσσάριο" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Κάντε κλικ στο IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Σύρετε και αποθέστε το αρχείο .xml στην περιοχή εισαγωγής και κάντε κλικ στο κουμπί "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Ζώνη απόθεσης για το αρχείο XML του γλωσσαρίου" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Αποθέστε το αρχείο και επικυρώστε με ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Τα άρθρα σας εντοπίστηκαν. Ολοκληρώστε πατώντας το κουμπί "CONTINUER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Επιβεβαίωση εντοπισμένων άρθρων" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Κάντε κλικ στο CONTINUER για να ολοκληρώσετε την εισαγωγή.</em></figcaption>
                            </figure>
                        </li>
                        <li>Η εισαγωγή ολοκληρώθηκε. Οι ορισμοί σας είναι πλέον διαθέσιμοι στο Γλωσσάριο.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> και <span class="help-badge-file">.GIFT</span> (Δραστηριότητα Τεστ)</summary>
                <div class="import-content">
                    <p>Οι μορφές αυτές εισάγουν ερωτήσεις στην «Τράπεζα ερωτήσεων».</p>
                    <ol>
                        <li>
                            <p>Στο μάθημα Éléa σας, μεταβείτε στην καρτέλα «Περισσότερα» και κάντε κλικ στην «Τράπεζα ερωτήσεων».</p>
                        </li>
                        <li>
                            <p>Στο αναπτυσσόμενο μενού όπου εμφανίζεται «Ερωτήσεις», επιλέξτε «Εισαγωγή».</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Επιλογή του κουμπιού Εισαγωγή στην τράπεζα ερωτήσεων" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Επιλέξτε Εισαγωγή από το αναπτυσσόμενο μενού.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Επιλέξτε τη μορφή που αντιστοιχεί στο αρχείο σας:</p>
                            <ul>
                                <li><strong>Μορφή Moodle XML</strong> (συνιστάται): πλήρης μορφή που υποστηρίζει όλους τους τύπους ερωτήσεων.</li>
                                <li><strong>Μορφή GIFT</strong>: απλούστερη εναλλακτική αλλά περιορισμένη σε τύπους ερωτήσεων.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Επιλογή μεταξύ Μορφής Moodle XML και Μορφής GIFT" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Επιλέξτε τη μορφή που ταιριάζει στο αρχείο σας.</em></figcaption>
                            </figure>
                        </li>
                        <li>Σύρετε και αποθέστε το αρχείο σας στην περιοχή μεταφόρτωσης.</li>
                        <li>Κάντε κλικ στο κουμπί «IMPORTATION». Η οθόνη θα εμφανίσει τις προστεθείσες ερωτήσεις (για παράδειγμα: προστέθηκαν 10 ερωτήσεις).</li>
                        <li>Ολοκληρώστε κάνοντας κλικ στο «CONTINUER» στο κάτω μέρος της σελίδας.</li>
                        <li>Οι ερωτήσεις είναι πλέον έτοιμες να προστεθούν σε μια δραστηριότητα Τεστ. Συμβουλευτείτε το <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">εκπαιδευτικό υλικό Éléa</a> για να δημιουργήσετε μια δραστηριότητα Τεστ και να φορτώσετε ερωτήσεις από την τράπεζα.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.html</span> (Εναλλακτική για «Σελίδα»)</summary>
                <div class="import-content">
                    <p>Για χειροκίνητο έλεγχο περιεχομένου.</p>
                    <ol>
                        <li>Ανοίξτε το .html με πρόγραμμα επεξεργασίας κειμένου (π.χ. Σημειωματάριο) και αντιγράψτε όλο το περιεχόμενο.</li>
                        <li>Στο Éléa, προσθέστε δραστηριότητα «Σελίδα».</li>
                        <li>Στον επεξεργαστή σελίδας, κάντε κλικ στο εικονίδιο για να αλλάξετε σε λειτουργία HTML (συχνά με το "&lt;&gt;").</li>
                        <li>Επικολλήστε το περιεχόμενο και αποθηκεύστε.</li>
                    </ol>
                </div>
            </details>
        </div>
    </div>

    <div id="communaute" class="help-section help-community">
        <h4><i class="fas fa-users"></i> Κοινότητα & Υποστήριξη</h4>
        <p>Το Caramel είναι ένα ζωντανό έργο και η γνώμη σας είναι πολύτιμη!</p>
        <ul>
            <li><strong>Συζήτηση & Ερωτήσεις:</strong> Ελάτε στο <a href="https://edurl.fr/caramel-tchap" target="_blank" rel="noopener noreferrer">Tchap</a> για ανταλλαγή με την κοινότητα.</li>
            <li><strong>Αναφορά σφάλματος:</strong> Πρόβλημα; Δημιουργήστε <a href="https://forge.apps.education.fr/caramel/caramel.forge.apps.education.fr/-/issues" target="_blank" rel="noopener noreferrer">issue</a>. Αν είναι δυνατόν, επισυνάψτε το JSON που προκάλεσε το σφάλμα.</li>
            <li><strong>Στήριξη έργου:</strong> Αν σας αρέσει το εργαλείο, βάλτε μας ένα αστέρι στη <a href="https://forge.apps.education.fr/caramel/caramel" target="_blank" rel="noopener noreferrer">σελίδα Forge</a>. Είναι η καλύτερη ανταμοιβή!</li>
        </ul>
    </div>
    `,

  // ============================================================================
  // ΚΥΡΙΑ ΔΙΕΠΑΦΗ
  // ============================================================================
  language: "Γλώσσα",
  tutorial: "Οδηγός χρήσης",
  notifications: "Ειδοποιήσεις",
  fast_mode: "Γρήγορη Λειτουργία",
  guided_mode: "Προηγμένη Λειτουργία",
  who_are_you: "Ποια είναι η ιδιότητά σας; (π.χ. Εκπαιδευτικός, εκπαιδευτής...)",
  what_to_address: "Τι θέλετε να προσεγγίσετε; (π.χ. Η Γαλλική Επανάσταση...)",
  level: "Για ποιο επίπεδο; (π.χ. Β' Λυκείου)",
  number_of_elements: "Αριθμός ερωτήσεων/στοιχείων στην ενότητα (π.χ. 5)",

  // ============================================================================
  // ΕΠΕΞΕΡΓΑΣΙΑ ΕΓΓΡΑΦΩΝ (RAG/OCR)
  // ============================================================================
  rag_title: "Επισύναψη εγγράφων (προαιρετικό)",
  rag_note: "Εάν επιθυμείτε η ΤΝ να εργαστεί αποκλειστικά βάσει των εγγράφων σας, επικολλήστε το κείμενό σας ή ανεβάστε τα αρχεία σας εδώ. Διαφορετικά, αφήστε αυτό το πεδίο κενό για να επιτρέψετε στην ΤΝ να αναζητήσει πληροφορίες μόνη της.",
  error_duplicate_file: "Αυτό το αρχείο έχει ήδη προστεθεί.",
  error_unsupported_format: "Μη υποστηριζόμενη μορφή. Αποδεκτές μορφές: ",
  ocr_scanned_page: "Εντοπίστηκε σκαναρισμένη σελίδα, OCR σε εξέλιξη",
  ocr_image_processing: "Αναγνώριση (OCR) εικόνας",
  ocr_initializing: "Αρχικοποίηση OCR...",
  ocr_loading_language: "Φόρτωση γλωσσικού μοντέλου...",
  ocr_preparing: "Προετοιμασία ανάλυσης...",
  docx_processing: "Εξαγωγή κειμένου DOCX...",
  pptx_processing: "Εξαγωγή κειμένου PPTX...",
  odt_processing: "Εξαγωγή κειμένου ODT...",
  odp_processing: "Εξαγωγή κειμένου ODP...",
  file_loading: "Φόρτωση αρχείου...",
  extraction_success: "Η επεξεργασία του εγγράφου ολοκληρώθηκε με επιτυχία.",
  extraction_error: "Παρουσιάστηκε σφάλμα κατά την επεξεργασία.",
  error_fullscreen: "Η λειτουργία πλήρους οθόνης απέτυχε:",
  lock_text: "Κλείδωμα",
  unlock_text: "Ξεκλείδωμα",
  drag_drop_text: "Σύρετε και αποθέστε ένα έγγραφο εδώ (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "ή",
  upload_pdf_btn: "Επιλέξτε ένα αρχείο",
  paste_your_text_here: "Επικολλήστε το κείμενό σας εδώ...",
  rag_tags_tuto: "Δείτε παρακάτω τα έγγραφα που κατατέθηκαν. Κάντε κλικ στον έγχρωμο κύκλο για να προσαρμόσετε την επισήμανση κάθε εγγράφου.",

  // ============================================================================
  // ΚΑΡΤΕΛΕΣ
  // ============================================================================
  tab_all: "Όλα",
  tab_quiz: "Κουίζ & Τεστ",
  tab_text: "Χειρισμός κειμένου",
  tab_memory: "Απομνημόνευση & Ανακάλυψη",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // H5P ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ - ΛΕΠΤΟΜΕΡΕΙΕΣ
  // ============================================================================
  h5p_timeline_name: "Χρονολόγιο",
  h5p_timeline_description: "Δημιουργήστε ένα διαδραστικό χρονολόγιο για να παρουσιάσετε μια σειρά γεγονότων.",
  h5p_flashcards_name: "Κάρτες μνήμης",
  h5p_flashcards_description: "Δημιουργήστε κάρτες διπλής όψης για να βοηθήσετε στην απομνημόνευση όρων και ορισμών.",
  h5p_quiz_set_name: "Μικτό κουίζ",
  h5p_quiz_set_description: "Συνθέστε μια σειρά από ποικίλες ερωτήσεις (πολλαπλής επιλογής, drag-and-drop κ.λπ.) για την αξιολόγηση των γνώσεων.",
  h5p_quiz_set_qcm_name: "Κουίζ πολλαπλής επιλογής",
  h5p_quiz_set_qcm_description: "Δημιουργήστε ένα κουίζ που αποτελείται αποκλειστικά από ερωτήσεις πολλαπλής επιλογής.",
  h5p_quiz_set_vf_name: "Κουίζ Σωστό/Λάθος",
  h5p_quiz_set_vf_description: "Δημιουργήστε ένα κουίζ που αποτελείται αποκλειστικά από ερωτήσεις τύπου Σωστό ή Λάθος.",
  h5p_glossary_name: "Γλωσσάρι",
  h5p_glossary_description: "Δημιουργήστε ένα γλωσσάρι ή FAQ σε μορφή αναδιπλούμενου ακορντεόν.",
  h5p_crossword_name: "Σταυρόλεξο",
  h5p_crossword_description: "Δημιουργήστε ένα σταυρόλεξο από μια λίστα λέξεων και ορισμών.",
  h5p_essay_name: "Έκθεση / Σύνταξη",
  h5p_essay_description: "Προτείνετε ένα θέμα έκθεσης και ορίστε λέξεις-κλειδιά για αυτοματοποιημένη διόρθωση.",
  h5p_summary_name: "Περίληψη",
  h5p_summary_description: "Οι μαθητές πρέπει να ανασυνθέσουν μια σωστή περίληψη επιλέγοντας τις σωστές προτάσεις.",
  h5p_drag_the_words_name: "Σύρσιμο λέξεων",
  h5p_drag_the_words_description: "Δημιουργήστε ένα κείμενο με κενά όπου οι μαθητές πρέπει να σύρουν τις λέξεις που λείπουν.",
  h5p_fill_in_the_blanks_name: "Κείμενο με κενά",
  h5p_fill_in_the_blanks_description: "Οι μαθητές πρέπει να συμπληρώσουν τις λέξεις που λείπουν σε ένα κείμενο απευθείας από το πληκτρολόγιο.",
  h5p_mark_the_words_name: "Επισήμανση λέξεων",
  h5p_mark_the_words_description: "Ζητήστε από τους μαθητές να επισημάνουν ορισμένες λέξεις σε μια παράγραφο.",
  h5p_true_false_name: "Σωστό/Λάθος",
  h5p_true_false_description: "Δημιουργήστε <strong style='color: red;'>μια</strong> απλή ερώτηση με δυαδική απάντηση: σωστό ή λάθος.",
  h5p_multiple_choice_name: "Πολλαπλή επιλογή",
  h5p_multiple_choice_description: "Δημιουργήστε <strong style='color: red;'>μια</strong> ερώτηση πολλαπλής επιλογής με μία ή περισσότερες σωστές απαντήσεις.",
  h5p_find_the_words_name: "Κρυπτόλεξο",
  h5p_find_the_words_description: "Δημιουργήστε ένα πλέγμα γραμμάτων όπου οι μαθητές πρέπει να βρουν λέξεις.",
  h5p_sort_the_paragraphs_name: "Ταξινόμηση παραγράφων",
  h5p_sort_the_paragraphs_description: "Δημιουργήστε ένα σύνολο παραγράφων που οι μαθητές πρέπει να βάλουν στη σωστή σειρά.",
  h5p_single_choice_set_name: "Σειρά μοναδικής επιλογής",
  h5p_single_choice_set_description: "Δημιουργήστε μια σειρά ερωτήσεων όπου κάθε ερώτηση έχει μόνο μία σωστή απάντηση.",
  h5p_dialog_cards_name: "Κάρτες διαλόγου",
  h5p_dialog_cards_description: "Δημιουργήστε διαδραστικές κάρτες διπλής όψης με κείμενο και προαιρετικά εικόνες.",
  h5p_complex_fill_the_blanks_name: "Σύνθετο κείμενο με κενά",
  h5p_complex_fill_the_blanks_description: "Δημιουργήστε ένα προηγμένο κείμενο με κενά και εξειδικευμένη ανατροφοδότηση για κάθε λάθος.",
  h5p_chart_name: "Διάγραμμα",
  h5p_chart_description: "Δημιουργήστε ένα κυκλικό διάγραμμα ή διάγραμμα στηλών για την οπτικοποίηση δεδομένων.",

  // ============================================================================
  // ÉLÉA/MOODLE ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ - ΛΕΠΤΟΜΕΡΕΙΕΣ
  // ============================================================================
  moodle_xml_name: "Τεστ",
  moodle_xml_description: "Δημιουργήστε μια τράπεζα ερωτήσεων για άμεση εισαγωγή σε μια δραστηριότητα Τεστ (σε μορφή xml ή gift)",
  moodle_xml_help: "Για να προσθέσετε ένα αρχείο XML σε μια δραστηριότητα «Τεστ» στο Moodle, ξεκινήστε δημιουργώντας τη δραστηριότητα. Στη συνέχεια, ανοίξτε το μενού <strong>Περισσότερα</strong> και μεταβείτε στην <strong>Τράπεζα ερωτήσεων</strong>. Σε αυτό το μενού, κάντε κλικ στο <strong>Εισαγωγή</strong>, επιλέξτε τη μορφή <strong>Moodle XML</strong>, επιλέξτε το αρχείο σας και επιβεβαιώστε.",
  moodle_gift_name: "Μορφή GIFT",
  moodle_gift_description: "Δημιουργήστε ερωτήσεις σε μορφή GIFT, έναν απλό τρόπο εισαγωγής ερωτήσεων στο Moodle.",
  moodle_millionnaire_name: "Εκατομμυριούχος",
  moodle_millionnaire_description: "Δημιουργήστε μια μοναδική δραστηριότητα 'Εκατομμυριούχος' με 6 ερωτήσεις κλιμακούμενης δυσκολίας.",
  moodle_appariement_name: "Αντιστοίχιση",
  moodle_appariement_description: "Δημιουργήστε μια δραστηριότητα αντιστοίχισης 10 ερωτήσεων.",
  moodle_qcm_name: "QCM",
  moodle_qcm_description: "Δημιουργήστε μια απλή δραστηριότητα πολλαπλής επιλογής.",
  moodle_glossaire_xml_name: "Γλωσσάρι (XML)",
  moodle_glossaire_xml_description: "Δημιουργήστε ένα γλωσσάρι έτοιμο για εισαγωγή σε μορφή XML.",
  glossaire_success_generation: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
  glossaire_error_creation: "Σφάλμα κατά τη δημιουργία του XML του γλωσσαρίου:",
  glossaire_error_invalid_json: "Το JSON πρέπει να περιέχει ένα όνομα ('name') και έναν πίνακα εγγραφών ('entries').",
  elea_page_name: "Σελίδα",
  elea_page_description: "Δημιουργήστε μια σελίδα περιεχομένου Éléa με οπτική διαμόρφωση.",

  // ============================================================================
  // ΠΑΡΑΘΥΡΟ ΔΗΜΙΟΥΡΓΙΑΣ
  // ============================================================================
  get_prompt_step: "1/2 Λήψη του prompt προς αντιγραφή",
  create_file_step: "2/2 Δημιουργία του αρχείου από το JSON",
  generate_one_click: "Δημιουργία με ένα κλικ",
  simple_mode: "Απλό",
  advanced_mode: "Καθοδηγούμενο",
  prompt_for_ia: "Prompt για την ΤΝ",
  copy_prompt: "Αντιγραφή του prompt",
  fullscreen_prompt: "Πλήρης οθόνη",
  exit_fullscreen_prompt: "Έξοδος από πλήρη οθόνη",
  lock_prompt: "Κλείδωμα",
  unlock_prompt: "Ξεκλείδωμα",
  go_duck: "Αντιγραφή και μετάβαση στο Duck.ai",
  go_mistral: "Αντιγραφή και μετάβαση στο Le chat",
  create_h5p_file: "Δημιουργία αρχείου H5P",
  integrate_h5p_libraries: "Ενσωμάτωση βιβλιοθηκών H5P:",
  paste_ia_result: "Επικολλήστε το αποτέλεσμα της ΤΝ στην παρακάτω περιοχή για να δημιουργήσετε την ενότητά σας.",
  generate_h5p: "Δημιουργία H5P",
  create_xml_file: "Δημιουργία αρχείου XML",
  paste_ia_result_xml: "Επικολλήστε το XML που παρήγαγε η ΤΝ παρακάτω.",
  generate_xml_file: "Δημιουργία αρχείου XML",
  export_mbz: "Μορφή MBZ",
  export_gift: "Μορφή GIFT",
  export_xml: "Μορφή XML",
  export_html: "Μορφή HTML",
  export_docx: "Μορφή DOCX",
  export_odt: "Μορφή ODT",
  export_pdf: "Μορφή PDF",
  export_error: "Σφάλμα εξαγωγής",
  create_mbz_file_appariement: "Δημιουργία αρχείου Αντιστοίχισης (.mbz)",
  paste_ia_result_appariement: "Επικολλήστε το JSON που παρήγαγε η ΤΝ παρακάτω. Ο τίτλος της δραστηριότητας θα εξαχθεί αυτόματα από το JSON.",
  generate_mbz_appariement: "Δημιουργία δραστηριότητας Αντιστοίχισης (mbz)",
  create_mbz_file_millionnaire: "Δημιουργία αρχείου Εκατομμυριούχος (.mbz)",
  paste_ia_result_millionnaire: "Επικολλήστε το JSON που παρήγαγε η ΤΝ παρακάτω. Ο τίτλος της δραστηριότητας θα εξαχθεί αυτόματα από το JSON.",
  generate_mbz_millionnaire: "Δημιουργία δραστηριότητας Εκατομμυριούχος (mbz)",
  generate_mbz_test: "Δημιουργία δραστηριότητας Τεστ (mbz)",
  create_mbz_file_qcm: "Δημιουργία αρχείου QCM (.mbz)",
  paste_ia_result_qcm: "Επικολλήστε το JSON που παρήγαγε η ΤΝ παρακάτω. Ο τίτλος της δραστηριότητας θα εξαχθεί αυτόματα από το JSON.",
  generate_mbz_qcm: "Δημιουργία δραστηριότητας QCM (mbz)",
  create_mbz_file_page: "Δημιουργία αρχείου Σελίδας (.mbz)",
  paste_ia_result_page: "Επικολλήστε το JSON που παρήγαγε η ΤΝ παρακάτω για να κατασκευάσετε τη σελίδα.",
  generate_mbz_page: "Δημιουργία δραστηριότητας Σελίδας (mbz)",
  generate_prompts_placeholder: "Το prompt για την ΤΝ θα εμφανιστεί εδώ μόλις συμπληρώσετε τουλάχιστον ένα πεδίο της Γρήγορης ή της Προηγμένης Λειτουργίας.",
  paste_json_or_text: "Επικολλήστε εδώ το περιεχόμενο JSON ή το κείμενο που παρήγαγε η ΤΝ για να δημιουργήσετε τη δραστηριότητά σας.",
  info_prompt_copy: "Μην επικολλήσετε αυτό το prompt στο δεξί πάνελ. Αντιγράψτε το σε μια δημόσια ΤΝ για να λάβετε το αποτέλεσμα, και στη συνέχεια επικολλήστε αυτό το αποτέλεσμα στο δεξί πάνελ.",
  generate_with_llm: "Δημιουργία με την ΤΝ του Caramel",
  generation_in_progress: "Δημιουργία σε εξέλιξη, παρακαλώ περιμένετε...",
  request_sent_to_ia: "Το αίτημα στάλθηκε στην ΤΝ, παρακαλώ περιμένετε...",
  generation_successful: "Το περιεχόμενο H5P δημιουργήθηκε με επιτυχία!",
  generation_failed_empty: "Η δημιουργία απέτυχε. Η απάντηση ήταν κενή.",
  generation_failed_error: "Σφάλμα κατά τη δημιουργία: {errorMessage}",
  generation_failed_llm: "Η δημιουργία μέσω της ΤΝ του Caramel απέτυχε. Αιτία: {errorMessage}",
  llm_small_summary: "Μαλακή καραμέλα: γρήγορη, ελαφριά, ιδανική για γρήγορες ασκήσεις και άμεσες απαντήσεις. Χαμηλή κατανάλωση.",
  llm_large_summary: "Ρευστή καραμέλα: πιο πλούσια, με περισσότερες αποχρώσεις, ιδανική για εργασίες που απαιτούν βάθος. Μεγαλύτερη κατανάλωση.",
  llm_xl_summary: "Σκληρή καραμέλα: ισχυρή και σύνθετη, για φιλόδοξα έργα. Απαιτείται υπομονή, εγγυημένο αποτέλεσμα! Πολύ υψηλή κατανάλωση.",
  llm_model_source: "Πάροχος μοντέλου:",
  llm_model_parameters: "Μέγεθος μοντέλου:",
  llm_model_parameters_unit: "δισ. παράμετροι",

  // ============================================================================
  // ΚΙΝΟΥΜΕΝΑ ΣΧΕΔΙΑ ΜΑΓΕΙΡΙΚΗΣ ΚΑΡΑΜΕΛΑΣ
  // ============================================================================
  caramel_animation_step_1: "Ρίχνουμε τη ζάχαρη στην κατσαρόλα...",
  caramel_animation_step_2: "Προσθέτουμε λίγο νερό...",
  caramel_animation_step_3: "Ζεσταίνουμε σε μέτρια φωτιά...",
  caramel_animation_step_4: "Η ζάχαρη αρχίζει να λιώνει...",
  caramel_animation_step_5: "Αρχίζει να παίρνει χρώμα...",
  caramel_animation_step_6: "Ανακατεύουμε απαλά...",
  caramel_animation_step_7: "Η καραμέλα αποκτά ένα όμορφο κεχριμπαρένιο χρώμα...",
  caramel_animation_step_8: "Προσθέτουμε τη ζεστή κρέμα...",
  caramel_animation_step_9: "Προσοχή στα πιτσιλίσματα!",
  caramel_animation_step_10: "Ανακατεύουμε καλά...",
  caramel_animation_step_11: "Είναι σχεδόν έτοιμο!",
  caramel_success_title: "Το γλύκισμά σας είναι έτοιμο!",

  // ============================================================================
  // ΕΙΔΟΠΟΙΗΣΕΙΣ ΚΑΙ ΣΦΑΛΜΑΤΑ
  // ============================================================================
  prompts_generated_successfully: "Τα prompts δημιουργήθηκαν με επιτυχία!",
  success_copy: "✓ Αντιγράφηκε!",
  error_please_fill_fields: "Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο της Γρήγορης Λειτουργίας.",
  error_please_fill_guided_fields: "Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο της Προηγμένης Λειτουργίας.",
  error_field_empty: "Το πεδίο είναι κενό. Παρακαλώ δημιουργήστε πρώτα ένα prompt.",
  error_copy_failed: "Η αντιγραφή απέτυχε.",
  error_h5p_module_not_found: "Η ενότητα '{moduleKey}' δεν βρέθηκε.",
  error_invalid_quiz_json: "Το JSON για το Κουίζ δεν είναι έγκυρο: {errorMessage}",
  error_invalid_json: "Το παρεχόμενο JSON δεν είναι έγκυρο. Σφάλμα: {errorMessage}",
  error_h5p_creation: "Σφάλμα δημιουργίας H5P: {errorMessage}",
  error_paste_ia_content: "Παρακαλώ επικολλήστε το περιεχόμενο που παρήγαγε η ΤΝ.",
  error_compression_module_not_ready: "Η ενότητα συμπίεσης δεν είναι έτοιμη. Δοκιμάστε ξανά σε λίγο.",
  h5p_file_generated_successfully: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
  h5p_creation_failed: "Αποτυχία δημιουργίας αρχείου H5P: {errorMessage}",
  error_paste_json_content: "Παρακαλώ επικολλήστε το παραχθέν περιεχόμενο JSON.",
  error_paste_xml_content: "Παρακαλώ επικολλήστε το παραχθέν περιεχόμενο XML.",
  moodle_xml_success_generation: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
  test_error_creation_mbz: "Σφάλμα κατά τη δημιουργία του MBZ για το Τεστ:",
  test_success_generation: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
  test_error_generic: "Σφάλμα:",
  test_backup_log: "Αντίγραφο ασφαλείας που δημιουργήθηκε αυτόματα από το Caramel\n",
  millionnaire_error_compression_libs: "Οι βιβλιοθήκες συμπίεσης (Tar.js ή fflate) δεν έχουν φορτωθεί. Παρακαλώ ελέγξτε τη σύνδεσή σας στο διαδίκτυο ή ανανεώστε τη σελίδα.",
  millionnaire_error_invalid_json: "Η δομή του JSON δεν είναι έγκυρη. Βεβαιωθείτε ότι περιέχει έναν τίτλο ('title') και έναν πίνακα ερωτήσεων ('questions') με 6 ερωτήσεις σύμφωνα με το παράδειγμα.",
  millionnaire_activity_intro: "Συμμετάσχετε σε αυτό το παιχνίδι για να δοκιμάσετε τις γνώσεις σας.",
  millionnaire_backup_log: "Αντίγραφο ασφαλείας που δημιουργήθηκε αυτόματα από το Caramel\n",
  millionnaire_success_generation: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
  millionnaire_error_creation_mbz: "Σφάλμα κατά τη δημιουργία του MBZ:",
  millionnaire_error_generic: "Σφάλμα:",
  appariement_error_invalid_json: "Η δομή του JSON δεν είναι έγκυρη. Βεβαιωθείτε ότι περιέχει έναν τίτλο ('title') και έναν πίνακα ζευγών ('pairs') όπου κάθε ζεύγος έχει 'question' και 'answer'.",
  appariement_activity_intro: "Βρείτε τα αντίστοιχα ζεύγη.",
  appariement_success_generation: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
  appariement_error_creation_mbz: "Σφάλμα κατά τη δημιουργία του MBZ για την αντιστοίχιση:",
  qcm_error_invalid_json: "Η δομή του JSON δεν είναι έγκυρη. Βεβαιωθείτε ότι περιέχει έναν τίτλο ('title') και έναν πίνακα ερωτήσεων ('questions') με τουλάχιστον μία ερώτηση και απαντήσεις.",
  qcm_activity_intro: "Απαντήστε στις παρακάτω ερωτήσεις.",
  qcm_success_generation: "Το αρχείο {fileName} δημιουργήθηκε με επιτυχία!",
  qcm_error_creation_mbz: "Σφάλμα κατά τη δημιουργία του MBZ για το QCM:",
  version_modal_title: "Νέα έκδοση διαθέσιμη",
  version_modal_message: "Χρησιμοποιείτε αυτή τη στιγμή την έκδοση {currentVersion}. Μια νεότερη έκδοση ({latestVersion}) είναι διαθέσιμη. Ανανεώστε τη σελίδα για να επωφεληθείτε από τις τελευταίες βελτιώσεις.",
  version_modal_update: "Φόρτωση νέας έκδοσης",
  version_modal_remind_later: "Υπενθύμιση αργότερα",

  prompt_header_pedagogical_context: "ΠΑΙΔΑΓΩΓΙΚΟ ΠΛΑΙΣΙΟ",
  prompt_header_specific_rules: "ΕΙΔΙΚΟΙ ΚΑΝΟΝΕΣ",
  prompt_header_pedagogical_rules: "ΠΑΙΔΑΓΩΓΙΚΟΙ ΚΑΝΟΝΕΣ",
  prompt_header_sources: "ΠΗΓΕΣ",
  prompt_header_json_structure: "ΑΝΑΜΕΝΟΜΕΝΗ ΔΟΜΗ JSON",
  prompt_header_rendering_example: "ΠΑΡΑΔΕΙΓΜΑ ΑΠΟΔΟΣΗΣ",
  prompt_fallback_teacher: "ένας εκπαιδευτικός",
  prompt_fallback_activity: "δημιουργία μιας παιδαγωγικής δραστηριότητας",

  // ============================================================================

  // --- ΚΟΙΝΑ ΚΛΕΙΔΙΑ ---
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- Ο ρόλος σου: [QUI]. Ειδικός στη διδακτική και την εκπαιδευτική μηχανική
- Ο παιδαγωγικός σου στόχος: [QUOI]
- Το κοινό σου: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Προσαρμογή και λεξιλόγιο: Προσάρμοσε το ύφος, το λεξιλόγιο και τη δυσκολία των οδηγιών στο αναφερόμενο κοινό. Να είσαι εύστοχος και ελκυστικός.
- Ύφος και ανατροφοδότηση: Οι οδηγίες και οι παρατηρήσεις πρέπει να είναι εποικοδομητικές, ενθαρρυντικές και προσανατολισμένες στη μάθηση.
- Συμμόρφωση: Προσάρμοσε ΥΠΟΧΡΕΩΤΙΚΑ το περιεχόμενο στις ισχύουσες επίσημες αναφορές. Εκτός αν ορίζεται ρητά διαφορετικά, βασίσου από προεπιλογή στα γαλλικά σχολικά προγράμματα (Eduscol) για το σχολικό κοινό και στα κανονιστικά κείμενα της επαγγελματικής κατάρτισης για τους ενήλικες.
- Γλώσσα: Το περιεχόμενο και οι οδηγίες πρέπει να είναι γραμμένα στα ελληνικά.`,

  SOURCES_COMMUNES: `- Θα χρησιμοποιήσεις ΑΠΟΚΛΕΙΣΤΙΚΑ τα ακόλουθα κείμενα για να δημιουργήσεις τη δραστηριότητά σου.
---
[RAG]
---`,

  // ============================================================================
  // === Χρονολόγιο ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Αριθμός γεγονότων: Τουλάχιστον 5 γεγονότα || [NOMBRE_ELEMENTS] γεγονότα.
- Περίοδοι (era): Τουλάχιστον 2 περίοδοι που καλύπτουν ομάδες γεγονότων.
- Πολυμέσα: Πρόσθεσε πηγές (credits) και λεζάντες για κάθε στοιχείο αν είναι δυνατόν. Αναζήτησε ενεργά μια σχετική εικόνα ελεύθερη πνευματικών δικαιωμάτων (π.χ. Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- **Αντικείμενο ρίζα:** Περιέχει το κλειδί \`timeline\` (αντικείμενο).
- **Περιεχόμενο του \`timeline\`:** Κύρια δομή της δραστηριότητας.
  - \`headline\`: Γενικός τίτλος του χρονολογίου (υποχρεωτικό απλό κείμενο).
  - \`text\`: Ελκυστική εισαγωγή (υποστήριξη Markdown).
  - \`asset\`: Πολυμέσο εξωφύλλου (\`media\`: απευθείας URL, \`caption\`: λεζάντα, \`credit\`: πηγή).
  - \`date\`: Πίνακας χρονολογικών γεγονότων.
  - \`era\`: Πίνακας περιόδων φόντου (ορίζουν χρωματισμένες περιοχές στο παρασκήνιο).
- **Δομή των αντικειμένων \`date\` και \`era\`:**
  - \`startDate\`: **Αυστηρή μορφή** \`YYYY,MM,DD\` ή \`YYYY\`. (Υποχρεωτικό)
  - \`endDate\`: **Αυστηρή μορφή** \`YYYY,MM,DD\` ή \`YYYY\`. (Προαιρετικό, ορίζει διάρκεια/τέλος περιόδου)
  - \`headline\`: Σαφής τίτλος του στοιχείου (υποχρεωτικό απλό κείμενο).
  - \`text\`: Παιδαγωγική αφήγηση. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή, \`*λέξη*\` για πλάγια και \`\\n\` για αλλαγή γραμμής.
  - \`asset\`: (Προαιρετικό) Αντικείμενο πολυμέσου (\`media\`: απευθείας URL Wikimedia Commons, \`caption\`, \`credit\`).
  - \`tag\`: Σύντομη λέξη-κλειδί (π.χ. 'Πολιτική', 'Επιστήμη') που επιτρέπει το φιλτράρισμα.
- **LaTeX:** Χρησιμοποίησε διπλή διαφυγή: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "Η Ιστορία της Διαστημικής Κατάκτησης",
    "text": "Ανακαλύψτε τα μεγάλα στάδια που σημάδεψαν την περιπέτεια του ανθρώπου στο **διάστημα**.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Απογείωση της αποστολής Apollo 11.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Εκτόξευση του Sputnik 1",
        "text": "Ο **πρώτος τεχνητός δορυφόρος** τέθηκε σε τροχιά από την ΕΣΣΔ.",
        "tag": "Ρομποτική"
      },
      {
        "startDate": "1969,07,20",
        "headline": "Πρώτο βήμα στη Σελήνη",
        "text": "Ο Neil Armstrong γίνεται ο πρώτος άνθρωπος που περπάτησε στη Σελήνη κατά την αποστολή **Apollo 11**.",
        "tag": "Άνθρωπος"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "Ο Διαστημικός Ψυχρός Πόλεμος",
        "text": "Περίοδος έντονου ανταγωνισμού μεταξύ Ηνωμένων Πολιτειών και ΕΣΣΔ.",
        "tag": "Πλαίσιο"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === Σταυρόλεξο ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Αριθμός λέξεων: Τουλάχιστον 6 λέξεις || [NOMBRE_ELEMENTS] λέξεις.
- Τυπογραφικοί κανόνες: Οι απαντήσεις (\`answer\`) πρέπει να περιέχουν μόνο γράμματα. Οποιαδήποτε σύνθετη λέξη, ακρωνύμιο ή έκφραση πρέπει να συγχωνευθεί σε μία λέξη χωρίς κενά, παύλες ή άλλους χαρακτήρες (π.χ. 'αερο-πλάνο' γίνεται 'αεροπλανο', 'D-DAY' γίνεται 'DDAY').
- Ορισμοί (\`clue\`): Απαγορεύεται να γράψεις τη λέξη που πρέπει να βρεθεί μέσα στον ορισμό. Πρέπει να είναι σύντομοι και ακριβείς.
- Συμπληρωματική βοήθεια (\`extraClue\`): Η ΤΝ πρέπει να κρίνει αν είναι σκόπιμο να προσθέσει μία.`,

  CROSSWORD_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`title\`: Ένας τίτλος για τη δραστηριότητα.
- \`words\`: Ένας πίνακας αντικειμένων που περιέχει:
  - \`answer\`: Η λέξη που πρέπει να βρεθεί (συγχωνευμένη χωρίς κενά ή παύλες).
  - \`clue\`: Ο σύντομος και ακριβής ορισμός.
  - \`extraClue\` (προαιρετικό): Ένα αντικείμενο \`{"params": {"text": "..."}}\`. Το κείμενο μπορεί να χρησιμοποιεί \`**λέξη**\` για έντονη γραφή, \`*λέξη*\` για πλάγια και \`\\n\` για αλλαγή γραμμής.
- \`taskDescription\`: Μια σαφής και εννοιολογική οδηγία. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή, \`*λέξη*\` για πλάγια και \`\\n\` για αλλαγή γραμμής. Μετά από μια αλλαγή γραμμής, διευκρίνισε: "Για τις σύνθετες λέξεις, μην βάζετε κενό ή παύλα."
- \`overallFeedback\`: (ΑΥΣΤΗΡΟΣ ΚΑΝΟΝΑΣ) Πρέπει υποχρεωτικά να δημιουργήσεις έναν πίνακα 6 αντικειμένων για την τελική ανατροφοδότηση, προσαρμοσμένο στο θέμα της άσκησης, τηρώντας σχολαστικά τις ακόλουθες βαθμολογικές κλίμακες: 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Mots croisés sur la Biologie",
  "words": [
    {"answer": "Cellule", "clue": "Unité de base de la vie.", "extraClue": {"params": {"text": "Elle peut être **animale** ou **végétale**."}}},
    {"answer": "ADN", "clue": "Molécule portant l'information génétique."}
  ],
  "taskDescription": "**Complète** la grille avec les termes de biologie.\\nPour les mots composés, ne mettez ni espace ni tiret (ex: 'portecles' pour 'porte-clés').",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions de biologie."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Κάρτες μνήμης) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Αριθμός καρτών: Τουλάχιστον 5 κάρτες || [NOMBRE_ELEMENTS] κάρτες.
- Αντιστοίχιση: Η εμπρόσθια και η οπίσθια όψη πρέπει να συνδέονται με ένα μοναδικό και σταθερό κριτήριο (π.χ. ορισμός -> όρος, γεγονός -> ημερομηνία, συγγραφέας -> έργο). Χρησιμοποίησε την ίδια σχέση για όλες τις κάρτες και διατύπωσε την οδηγία ως εξής: «Αντιστοίχισε κάθε X με το Y».`,

  FLASHCARDS_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το αντικείμενο πρέπει να περιέχει:
  - \`title\`: Ένας σχετικός τίτλος για τη δραστηριότητα.
  - \`description\`: Μια σαφής οδηγία για τον μαθητή.
  - \`cards\`: Ένας πίνακας αντικειμένων, όπου κάθε αντικείμενο αντιπροσωπεύει μια κάρτα (flashcard) και περιέχει:
    - \`text\`: Η ερώτηση ή ο όρος που πρέπει να βρεθεί (εμπρόσθια όψη).
    - \`answer\`: Η απάντηση ή ο ορισμός (οπίσθια όψη). Κανόνες τυποποίησης: μία μόνο απλή λέξη ή ένας αριθμός (όχι σύνθετες λέξεις), πεζά γράμματα (εκτός από κύρια ονόματα), χωρίς άρθρο ή σημεία στίξης, αριθμοί σε ψηφία.
    - \`tip\` (προαιρετικό): Υπόδειξη για βοήθεια του μαθητή. Μπορείς να χρησιμοποιήσεις \`**λέξη**\` για έντονη γραφή και \`*λέξη*\` για πλάγια.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Capitales de l'Europe",
  "description": "Associe chaque pays à sa capitale.",
  "cards": [
    {
      "text": "France",
      "answer": "paris",
      "tip": "C'est la ville de la **Tour Eiffel**."
    },
    {
      "text": "Espagne",
      "answer": "madrid",
      "tip": "Située au centre de la péninsule *ibérique*."
    },
    {
      "text": "Italie",
      "answer": "rome",
      "tip": "Surnommée la *Ville Éternelle*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (Έκθεση / Σύνταξη κειμένου) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Λέξεις-κλειδιά: Τουλάχιστον 5 λέξεις-κλειδιά ή εκφράσεις που αναμένονται στην απάντηση || [NOMBRE_ELEMENTS] λέξεις-κλειδιά.
- Οδηγία: Η οδηγία δεν πρέπει να απαριθμεί τις αναμενόμενες λέξεις-κλειδιά για να μην προδίδει την απάντηση, εκτός από το όνομα του γενικού θέματος.`,

  ESSAY_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
Το αντικείμενο πρέπει να περιέχει:
- \`taskDescription\`: Μια σαφής οδηγία που καλεί τον μαθητή να συντάξει ένα κείμενο για το θέμα. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή (έννοιες-κλειδιά), \`*λέξη*\` για πλάγια και \`\\n\` για αλλαγή γραμμής.
- \`keywords\`: Ένας πίνακας αντικειμένων που ορίζει τις αναμενόμενες λέξεις-κλειδιά. Κάθε αντικείμενο πρέπει να έχει τη μορφή:
  \`\`\`json
  {
    "keyword": "λέξη ή έκφραση",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (ΑΥΣΤΗΡΟΣ ΚΑΝΟΝΑΣ) Πρέπει υποχρεωτικά να δημιουργήσεις έναν πίνακα 6 αντικειμένων για την τελική ανατροφοδότηση, προσαρμοσμένο στο θέμα της άσκησης, τηρώντας σχολαστικά τις ακόλουθες βαθμολογικές κλίμακες: 0-10, 11-30, 31-50, 51-70, 71-90 και 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Rédigez un court texte expliquant le processus de la **photosynthèse**. Votre réponse doit aborder les éléments essentiels permettant aux plantes de produire leur propre énergie.",
  "keywords": [
    {"keyword": "lumière", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "chlorophylle", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "dioxyde de carbone", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "eau", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glucose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "C'est un début. Relis bien le cours sur la photosynthèse." },
    { "from": 11, "to": 30, "feedback": "Tu avez identifié quelques éléments. Continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "Ta compréhension progresse. Pense à détailler davantage." },
    { "from": 51, "to": 70, "feedback": "Bon travail ! Tu maîtrises les bases." },
    { "from": 71, "to": 90, "feedback": "Très bien ! Ta rédaction montre une solide compréhension." },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu as une maîtrise parfaite du sujet." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (Γλωσσάρι H5P) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Αριθμός εγγραφών: Τουλάχιστον 5 όροι || [NOMBRE_ELEMENTS] όροι.
- Επιλογή όρων: Εντόπισε τεχνικές έννοιες, ειδικό λεξιλόγιο ή σύνθετες λέξεις που υπάρχουν στις πηγές.
- Ορισμοί: Συνοπτικοί, ακριβείς και απόλυτα προσαρμοσμένοι στο επιδιωκόμενο παιδαγωγικό επίπεδο.`,

  ACCORDION_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το παραχθέν JSON πρέπει να είναι ένας ΠΙΝΑΚΑΣ με τόσα αντικείμενα όσοι και οι όροι που αναφέρθηκαν προηγουμένως.
- \`title\`: Η λέξη-κλειδί, η έκφραση ή η ερώτηση προς ορισμό.
- \`text\`: Ο ορισμός. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή, \`*λέξη*\` για πλάγια και \`\\n\` για αλλαγή γραμμής. Για μαθηματικούς τύπους, χρησιμοποίησε τη μορφή LaTeX με διπλή διαφυγή, για παράδειγμα: \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Photosynthèse", "text": "Processus par lequel les plantes transforment la **lumière** du **soleil** en énergie.\\nC'est la base de la chaîne alimentaire."},
  {"title": "Cellule", "text": "**Unité** de base de tous les êtres vivants. Il en existe des *eucaryotes* et des *procaryotes*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (Περίληψη) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Αριθμός σταδίων: Δημιούργησε έναν πίνακα με τουλάχιστον 5 στάδια || [NOMBRE_ELEMENTS] στάδια για την κάλυψη ολόκληρου του θέματος.
- Παραπλανητικές απαντήσεις (Distractors): Πρότεινε τουλάχιστον 2 παραπλανητικές απαντήσεις ανά στάδιο. Πρέπει να είναι συναφείς με το θέμα αλλά να περιέχουν εύλογα πραγματολογικά ή λογικά σφάλματα.`,

  SUMMARY_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`intro\`: Μια σύντομη εισαγωγική φράση (π.χ. "Επιλέξτε τη σωστή δήλωση.").
- \`summaries\`: Πίνακας αντικειμένων που αποτελούν τα στάδια. Κάθε αντικείμενο περιέχει:
  - \`summary\`: ΕΝΑΣ πίνακας φράσεων (**Association**). Η πρώτη φράση της λίστας πρέπει ΠΑΝΤΑ να είναι η σωστή περίληψη (ακριβής δήλωση).
  - \`tip\`: (Προαιρετικό) Μια βοηθητική υπόδειξη για τον μαθητή.
- \`overallFeedback\`: Πίνακας 6 αντικειμένων για την τελική βαθμολογία (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Χρησιμοποίησε διπλή διαφυγή για το LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Sélectionnez les affirmations correctes pour construire le résumé du cours.",
  "summaries": [
    {
      "summary": [
        "La photosynthèse est un processus biologique permettant aux plantes de transformer l'énergie lumineuse en énergie chimique.",
        "La photosynthèse est un processus qui se déroule uniquement durant la nuit.",
        "La photosynthèse est le mécanisme par lequel les animaux respirent."
      ],
      "tip": "Pensez à la lumière comme source d'énergie."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir." },
    { "from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel." },
    { "from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts." },
    { "from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (Σύρσιμο λέξεων) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Αριθμός λέξεων: Παράγραφος τουλάχιστον 50 λέξεων με τουλάχιστον 5 λέξεις προς σύρσιμο || [NOMBRE_ELEMENTS] λέξεις.
- Μοναδικότητα: Κάθε λέξη προς σύρσιμο πρέπει να είναι ΜΟΝΑΔΙΚΗ στο κείμενο (όχι διπλότυπα).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
Το αντικείμενο πρέπει να περιέχει:
- \`taskDescription\`: Μια σαφής οδηγία.
- \`textField\`: Το κείμενο προς συμπλήρωση. Κάθε φράση πρέπει να τελειώνει με αλλαγή γραμμής \`\\n\`.
  - **Μορφή**: \`*λέξη*\` για ένα συρόμενο στοιχείο.
- \`overallFeedback\`: Πίνακας 6 αντικειμένων για την τελική βαθμολογία (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complète le texte en faisant glisser les mots.",
  "textField": "Le *système solaire* est composé de *huit* planètes qui tournent autour du *Soleil*.\\nLa plus grande planète est *Jupiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (Κείμενο με κενά) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Αριθμός κενών: Παράγραφος τουλάχιστον 50 λέξεων με τουλάχιστον 3 λέξεις με κενά || [NOMBRE_ELEMENTS] λέξεις.
- Ισορροπία: Μην δημιουργείς κενά σε τετριμμένες λέξεις (άρθρα, προθέσεις) εκτός αν αυτός είναι ο γραμματικός στόχος. Στόχευσε στις έννοιες-κλειδιά.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
Το αντικείμενο πρέπει να περιέχει:
- \`taskDescription\`: Μια σαφής και σύντομη οδηγία που εξηγεί τον στόχο της δραστηριότητας στο γενικό πλαίσιο. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή (έννοιες-κλειδιά), \`*λέξη*\` για πλάγια και \`\\n\` για αλλαγή γραμμής.
- \`questions\`: Ένας πίνακας συμβολοσειρών. Κάθε συμβολοσειρά αντιπροσωπεύει ένα μπλοκ κειμένου προς συμπλήρωση.
  - **Σύνταξη κενών**: Περίκλεισε τις λέξεις που πρέπει να βρεθούν με αστερίσκους (π.χ. \`*λέξη*\`).
  - **Εναλλακτικές**: Χρησιμοποίησε \`/\` για πολλαπλές αποδεκτές απαντήσεις (π.χ. \`*λέξη1/λέξη2*\`).
  - **Βοήθεια**: Χρησιμοποίησε \`:\` για να προσθέσεις μια παιδαγωγική υπόδειξη (π.χ. \`*λέξη:υπόδειξη*\`).
- \`overallFeedback\`: (ΑΥΣΤΗΡΟΣ ΚΑΝΟΝΑΣ) Πρέπει υποχρεωτικά να δημιουργήσεις έναν πίνακα 6 αντικειμένων για την τελική ανατροφοδότηση (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Complétez les lacunes du texte ci-dessous concernant le système solaire.",
  "questions": [
    "La Terre est une *planète* du système *solaire*.",
    "Elle tourne autour du *Soleil:notre étoile* en environ 365 jours."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (Επισήμανση λέξεων) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Αριθμός λέξεων: Παράγραφος τουλάχιστον 50 λέξεων με τουλάχιστον 5 λέξεις προς επισήμανση || [NOMBRE_ELEMENTS] λέξεις.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
Το αντικείμενο πρέπει να περιέχει:
- \`taskDescription\`: Μια σαφής και ελκυστική οδηγία. Μπορείς να χρησιμοποιήσεις \`**λέξη**\` για έντονη γραφή και \`*λέξη*\` για πλάγια μόνο εδώ.
- \`textField\`: Το πλήρες κείμενο που περιέχει τις λέξεις προς επισήμανση.
  - **ΕΠΙΣΗΜΑΝΣΗ:** Κάθε λέξη προς επισήμανση πρέπει να περιβάλλεται ΜΕΜΟΝΩΜΕΝΑ με αστερίσκους. (Π.χ.: \`*λέξη1* *λέξη2*\` είναι σωστό· \`*λέξη1 λέξη2*\` είναι λάθος).
  - **ΣΤΙΞΗ:** Οι απόστροφοι ή τα σημεία στίξης ΔΕΝ ΠΡΕΠΕΙ ΠΟΤΕ να αποτελούν μέρος της επισήμανσης και πρέπει να χωρίζονται από τη λέξη με κενό. (Π.χ.: Το \`η *πόλη*\` είναι σωστό, το \`η*πόλη*\` είναι λάθος).
- \`overallFeedback\`: (ΑΥΣΤΗΡΟΣ ΚΑΝΟΝΑΣ) Πρέπει υποχρεωτικά να δημιουργήσεις έναν πίνακα 6 αντικειμένων για την τελική ανατροφοδότηση (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Cliquez sur les **noms propres** dans le texte suivant.",
  "textField": "*Paris* est la capitale de la *France*. C'est l' *Europe* qui nous intéresse.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Des efforts sont nécessaires pour bien comprendre ces notions."},
    {"from": 11, "to": 30, "feedback": "Tu y es presque, continue tes efforts pour consolider tes connaissances."},
    {"from": 31, "to": 50, "feedback": "C'est un bon début, mais certains points restent à éclaircir."},
    {"from": 51, "to": 70, "feedback": "Bon travail ! Tu as compris l'essentiel du sujet."},
    {"from": 71, "to": 90, "feedback": "Très bon score ! Tu maîtrises bien les concepts abordés."},
    {"from": 91, "to": 100, "feedback": "Excellent ! Tu as une parfaite maîtrise de cette leçon."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (Σωστό/Λάθος) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Ερώτηση: Μια σαφής δήλωση χωρίς ασάφειες.
- Απάντηση: Η απάντηση πρέπει να είναι αυστηρά "true" (Σωστό) ή "false" (Λάθος).
- Ανατροφοδοτήσεις: Προέβλεψε συγκεκριμένα μηνύματα για την επιτυχία (\`feedbackOnCorrect\`) και την αποτυχία (\`feedbackOnWrong\`) για την ενίσχυση της μάθησης.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το κύριο αντικείμενο πρέπει να περιέχει τα ακόλουθα κλειδιά:
  - \`question\`: (string) Η δήλωση προς αξιολόγηση. Μπορεί να περιέχει HTML.
  - \`correct\`: (string) Η σωστή απάντηση, είτε "true" είτε "false".
  - \`feedbackOnCorrect\`: (string) Σχόλιο που εμφανίζεται αν η απάντηση είναι σωστή.
  - \`feedbackOnWrong\`: (string) Σχόλιο που εμφανίζεται αν η απάντηση είναι λανθασμένη.
- **Μορφοποίηση:** Χρησιμοποίησε τη σύνταξη Markdown για έντονη γραφή (\`**κείμενο**\`) και πλάγια γραφή (\`*κείμενο*\`).
- **LaTeX:** Για μαθηματικούς τύπους, χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τη μορφή LaTeX με διπλό escape: \`\\\\( ... \\\\)\`. Μην χρησιμοποιείς ΠΟΤΕ το σύμβολο \`$\` μόνο του.
- **Feedback:** Τα feedback ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX ή Markdown.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo est la capitale de la Norvège.",
  "correct": "true",
  "feedbackOnCorrect": "Bonne réponse ! Oslo est bien la capitale de la Norvège.",
  "feedbackOnWrong": "Mauvaise réponse. La capitale de la Norvège est Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (Πολλαπλή επιλογή) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Ερώτηση: Μια σαφής ερώτηση πολλαπλής επιλογής.
- Απαντήσεις: Πρότεινε αρκετές επιλογές απάντησης (\`answers\`). Πρέπει να υπάρχει μόνο μία σωστή απάντηση (\`"correct": true\`) και αρκετές εύλογες παραπλανητικές απαντήσεις (\`"correct": false\`).
- Ανατροφοδοτήσεις:
  - \`overallFeedback\`: (ΑΥΣΤΗΡΟΣ ΚΑΝΟΝΑΣ) Πρέπει υποχρεωτικά να δημιουργήσεις έναν πίνακα 6 αντικειμένων για την τελική ανατροφοδότηση (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το κύριο αντικείμενο πρέπει να περιέχει τα ακόλουθα κλειδιά:
  - \`question\`: (string) Η εκφώνηση της ερώτησης. Μπορεί να περιέχει HTML.
  - \`answers\`: (array) Πίνακας αντικειμένων, όπου το καθένα αντιπροσωπεύει μια απάντηση.
    - \`text\`: (string) Το κείμενο της απάντησης.
    - \`correct\`: (boolean) \`true\` αν είναι σωστή απάντηση, \`false\` διαφορετικά.
    - \`tipsAndFeedback\`: (object, προαιρετικό) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (array) Πίνακας 6 αντικειμένων που ορίζουν τα feedback ανά εύρος βαθμολογίας.
- **Μορφοποίηση:** Χρησιμοποίησε τη σύνταξη Markdown για έντονη γραφή (\`**κείμενο**\`) και πλάγια γραφή (\`*κείμενο*\`).
- **LaTeX:** Για μαθηματικούς τύπους, χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τη μορφή LaTeX με διπλό escape: \`\\\\( ... \\\\)\`. Μην χρησιμοποιείς ΠΟΤΕ το σύμβολο \`$\` μόνο του.
- **Feedback:** Τα feedback ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX ή Markdown.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Quelle est la couleur réelle de la baie de cassis ?",
  "answers": [
    {"text": "Violet très foncé", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exactement !" }},
    {"text": "Bleu", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Non, c'est plus foncé." }},
    {"text": "Noir", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (Κρυπτόλεξο) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Αριθμός λέξεων: Τουλάχιστον 6 λέξεις || [NOMBRE_ELEMENTS] λέξεις.
- Τυπογραφικοί κανόνες: Οι λέξεις δεν πρέπει να περιέχουν τόνους, αριθμούς, σημεία στίξης ή κενά.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`taskDescription\`: Οδηγία για τον μαθητή.
- \`wordList\`: Λίστα των λέξεων προς εύρεση χωρισμένων με κόμμα (χωρίς κενά).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Trouvez les mots cachés dans la grille.",
  "wordList": "CELLULE,ADN,GENE,NOYAU"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (Ταξινόμηση παραγράφων) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Αριθμός σταδίων: Τουλάχιστον 3 στάδια ή παράγραφοι προς ταξινόμηση || [NOMBRE_ELEMENTS] στάδια.
- Εσωτερική λογική: Οι παράγραφοι (\`paragraphs\`) πρέπει να σχηματίζουν μια λογική εξέλιξη που συνάγεται από το ίδιο το περιεχόμενο.
- Απαγόρευση τεχνητών ενδείξεων: Δεν πρέπει ΠΟΤΕ να χρησιμοποιείς αρίθμηση (1, 2, 3...), σαφείς χρονικούς προσδιορισμούς (ημερομηνίες, ώρες) ή υπερβολικά απλούς λογικούς συνδέσμους ("Πρώτα", "Μετά", "Τέλος"), εκτός αν ο χρήστης το ζητήσει ρητά.
- Συνεκτικός ιστός: Κάθε παράγραφος πρέπει να προωθεί έναν μοναδικό άξονα (π.χ. αλυσίδα αιτιότητας, πέρασμα από το γενικό στο ειδικό, ή μια αλληλουχία προετοιμασία → δράση → αποτέλεσμα). Η σειρά πρέπει να είναι συμπερασματικά εξαγόμενη από την κατανόηση του νοήματος.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`taskDescription\`: Μια σαφής οδηγία (υποστηρίζεται Markdown).
- \`paragraphs\`: Ένας πίνακας συμβολοσειρών (παράγραφοι) που παρουσιάζονται αρχικά στη **σωστή** λογική σειρά μέσα στο JSON. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή, \`*λέξη*\` για πλάγια.
- \`overallFeedback\`: Πίνακας 6 αντικειμένων για την τελική βαθμολογία (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Χρησιμοποίησε διπλή διαφυγή για το LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Remettez ces éléments dans l'ordre pour reconstituer la chaîne de causalité du réchauffement climatique.",
  "paragraphs": [
    "Les activités humaines, principalement la combustion d'énergies fossiles, rejettent massivement du **dioxyde de carbone** dans l'atmosphère.",
    "Ce surplus de gaz renforce l'effet de serre naturel, empêchant une partie du rayonnement infrarouge de quitter la Terre.",
    "L'énergie ainsi piégée provoque une augmentation progressive de la température moyenne de l'air et des océans.",
    "Ce réchauffement global entraîne la fonte des glaciers et une élévation préoccupante du niveau des mers."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "La logique de causalité est à revoir." },
    { "from": 11, "to": 30, "feedback": "Tu as quelques bribes de compréhension, relis le texte." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début de mise en ordre." },
    { "from": 51, "to": 70, "feedback": "Bonne analyse de la progression logique." },
    { "from": 71, "to": 90, "feedback": "Très bon travail de structuration !" },
    { "from": 91, "to": 100, "feedback": "Parfait ! La structure logique est maîtrisée." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (Σειρά μοναδικών επιλογών) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Αριθμός ερωτήσεων: Τουλάχιστον 3 ερωτήσεις || [NOMBRE_ELEMENTS] ερωτήσεις.
- Απαντήσεις: Πρότεινε από 2 έως 3 παραπλανητικές απαντήσεις ανά ερώτηση. Η πρώτη απάντηση στη λίστα \`answers\` πρέπει πάντα να είναι η σωστή.
- Παραπλανητικές απαντήσεις: Συνεκτικές αλλά με εύλογα λογικά ή πραγματολογικά λάθη.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`choices\`: Πίνακας αντικειμένων που αποτελούν τις ερωτήσεις. Κάθε αντικείμενο περιέχει:
  - \`question\`: Η εκφώνηση της ερώτησης.
  - \`answers\`: Πίνακας συμβολοσειρών (απαντήσεις) όπου η πρώτη είναι πάντα η σωστή απάντηση.
- \`overallFeedback\`: Πίνακας 6 αντικειμένων για την τελική βαθμολογία (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Χρησιμοποίησε διπλή διαφυγή για το LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "Quel est le principal gaz responsable de l'effet de serre ?",
      "answers": ["Le dioxyde de carbone", "Le dioxygène", "Le diazote", "L'argon"]
    },
    {
      "question": "Quelle est la capitale de la France ?",
      "answers": ["Paris", "Lyon", "Marseille", "Bordeaux"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Des efforts sont nécessaires." },
    { "from": 11, "to": 30, "feedback": "Tu y es presque." },
    { "from": 31, "to": 50, "feedback": "C'est un bon début." },
    { "from": 51, "to": 70, "feedback": "Bon travail !" },
    { "from": 71, "to": 90, "feedback": "Très bon score !" },
    { "from": 91, "to": 100, "feedback": "Excellent !" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (Κάρτες διαλόγου) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Αριθμός καρτών: Τουλάχιστον 3 κάρτες || [NOMBRE_ELEMENTS] κάρτες.
- Αρχή συσχέτισης: Η μπροστινή (recto) και η πίσω όψη (verso) πρέπει να συνδέονται με ένα μοναδικό και σταθερό κριτήριο (π.χ. ορισμός -> όρος, γεγονός -> ημερομηνία, συγγραφέας -> έργο).
- Οδηγία: Η περιγραφή της δραστηριότητας πρέπει να ακολουθεί τη φόρμουλα: "Αντιστοιχίστε κάθε [X] με το [Y] του".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON μέσα σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το ριζικό αντικείμενο ΠΡΕΠΕΙ να περιέχει \`title\`, \`description\` και \`dialogs\`.
- 1. \`title\`: Ο τίτλος της δραστηριότητας (Απλό κείμενο, **χωρίς** Markdown ή HTML).
- 2. \`description\`: Η οδηγία ή περιγραφή (Μορφή HTML ή απλό κείμενο).
- 3. \`dialogs\`: Ο πίνακας με την Αρχή συσχέτισης των καρτών: Η μπροστινή πλευρά (text) και η πίσω (answer).
- 4. \`text\`: Η μπροστινή πλευρά της κάρτας. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή και \`*λέξη*\` για πλάγια.
- 5. \`answer\`: Η πίσω πλευρά της κάρτας. Πρέπει να είναι σύντομη. Χρησιμοποίησε \`**λέξη**\` για έντονη γραφή και \`*λέξη*\` για πλάγια.
- 6. \`tips\` (προαιρετικό): Πρόσθεσε μια υπόδειξη για την μπροστινή (\`front\`) και/ή την πίσω πλευρά (\`back\`) μόνο αν είναι σχετική. Απλό κείμενο **χωρίς** μορφοποίηση.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Verbes irréguliers",
  "description": "Retrouvez le verbe à l'infinitif.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identifiez le prétérit.", "back": "Forme de base."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (Γράφημα) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Αριθμός στοιχείων : Τουλάχιστον 5 στοιχεία σύγκρισης || [NOMBRE_ELEMENTS] στοιχεία σύγκρισης.
- Τύπος γραφήματος : Επίλεξε μεταξύ του κυκλικού διαγράμματος (\`pieChart\`) ή του διαγράμματος ράβδων (\`barChart\`) ανάλογα με την παιδαγωγική συνάφεια.
- Ετικέτες και χρώματα : Τα χρώματα πρέπει να έχουν αντίθεση για καλή αναγνωσιμότητα. Οι ετικέτες πρέπει να είναι σύντομες και σαφείς.`,

  CHART_STRUCTURE_JSON: `- Παρήγαγε ΜΟΝΟ ένα πλήρες και έγκυρο JSON σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να αρχίζει με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`graphMode\` : Ο τύπος του γραφήματος (\`pieChart\` ή \`barChart\`).
- \`listOfTypes\` : Ένας πίνακας αντικειμένων \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\` : Ο τίτλος του γραφήματος.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Μύρτιλα"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Σμέουρα"}
  ],
  "figureDefinition": "Γράφημα των αγαπημένων φρούτων"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (Quiz H5P) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Αριθμός ερωτήσεων : Παρήγαγε έναν πίνακα με τουλάχιστον 5 ερωτήσεις || [NOMBRE_ELEMENTS] ερωτήσεις.
- Ποικιλία : Επίλεξε τους πιο κατάλληλους τύπους δραστηριοτήτων μεταξύ των παρακάτω για να ποικίλεις την άσκηση :
  - **QCM** (\`H5P.MultiChoice\` 1.16)
  - **Σύρε και άφησε τις λέξεις** (\`H5P.DragText\` 1.10)
  - **Σωστό/Λάθος** (\`H5P.TrueFalse\` 1.8)
  - **Κείμενο με κενά** (\`H5P.Blanks\` 1.14)
  - **Υπογράμμισε τις λέξεις** (\`H5P.MarkTheWords\` 1.11)
  - **Σύνταξη / Ανοιχτή ερώτηση** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Δημιούργησε ΜΟΝΟ ένα πλήρες και έγκυρο JSON μέσα σε ένα block κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το ριζικό αντικείμενο πρέπει να περιέχει:
  - \`title\`: Ο τίτλος της δραστηριότητας.
  - \`questions\`: Ένας πίνακας αντικειμένων. Κάθε αντικείμενο αντιπροσωπεύει μια ερώτηση και πρέπει να περιέχει:
    - \`library\`: Το όνομα και η ακριβής έκδοση της βιβλιοθήκης (π.χ.: \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: Ένα αντικείμενο που περιέχει ένα κλειδί \`title\` (σύντομος τίτλος της ερώτησης).
    - \`params\`: Τα δεδομένα της ερώτησης.
  - \`overallFeedback\`: Γενικός πίνακας 6 αντικειμένων για την τελική βαθμολογία του QuizSet.

**Λεπτομέρειες των \`params\` ανά τύπο:**
1. **QCM (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (πίνακας αντικειμένων με \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **Σωστό/Λάθος (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" ή "false" ως string)
3. **Συμπλήρωση κενών (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (πίνακας από strings με \`*λέξη*\`)
4. **Μεταφορά λέξεων (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (με \`*λέξη*\`)
5. **Επισήμανση λέξεων (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (με \`*λέξη*\`)
6. **Έκθεση (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (πίνακας αντικειμένων)

**Κάθε ερώτηση, εκτός από αυτές του τύπου H5P.TrueFalse 1.8, πρέπει να περιλαμβάνει το δικό της \`overallFeedback\` (6 κλίμακες).**
- **Μορφοποίηση:** Χρησιμοποίησε τη σύνταξη Markdown για έντονη γραφή (\`**κείμενο**\`) και πλάγια γραφή (\`*κείμενο*\`).
- **LaTeX:** Για μαθηματικούς τύπους, χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τη μορφή LaTeX με διπλό escape: \`\\\\( ... \\\\)\`. Μην χρησιμοποιείς ΠΟΤΕ το σύμβολο \`$\` μόνο του.
- **Feedback:** Τα feedback ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX ή Markdown.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Γενική Επιστημονική Παιδεία",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Αστρονομία - QCM" },
      "params": {
        "question": "Ποιος πλανήτης είναι ο πιο κοντινός στον Ήλιο ;",
        "answers": [
          { "text": "Ερμής", "correct": true },
          { "text": "Αφροδίτη", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Λάθος."},
          {"from": 11, "to": 30, "feedback": "Ανεπαρκές."},
          {"from": 31, "to": 50, "feedback": "Μέτριο."},
          {"from": 51, "to": 70, "feedback": "Καλό."},
          {"from": 71, "to": 90, "feedback": "Πολύ καλό."},
          {"from": 91, "to": 100, "feedback": "Εξαιρετικό."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Βιολογία - Σωστό/Λάθος" },
      "params": {
        "question": "Το DNA είναι μια διπλή έλικα.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Χαμηλό αποτέλεσμα."},
    {"from": 11, "to": 30, "feedback": "Ανεπαρκές αποτέλεσμα."},
    {"from": 31, "to": 50, "feedback": "Μέτριο αποτέλεσμα."},
    {"from": 51, "to": 70, "feedback": "Καλό αποτέλεσμα."},
    {"from": 71, "to": 90, "feedback": "Πολύ καλό αποτέλεσμα."},
    {"from": 91, "to": 100, "feedback": "Εξαιρετικό αποτέλεσμα."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (Κουίζ πολλαπλής επιλογής H5P) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Αριθμός ερωτήσεων: Δημιουργήστε τουλάχιστον 5 ερωτήσεις || [NOMBRE_ELEMENTS] ερωτήσεις.
- Τύπος: Πρέπει να δημιουργήσετε ΜΟΝΟ ερωτήσεις τύπου **πολλαπλής επιλογής** (\`H5P.MultiChoice\` 1.16). Δεν επιτρέπεται κανένας άλλος τύπος.
- Ποιότητα ερωτήσεων πολλαπλής επιλογής:
  - Κάθε ερώτηση πρέπει να έχει τουλάχιστον 3 επιλογές απάντησης.
  - Ανάλογα με τη φύση της ερώτησης, μπορείτε να προτείνετε μία ή περισσότερες σωστές απαντήσεις.
  - Οι αποπροσανατολιστές (λανθασμένες απαντήσεις) πρέπει να είναι πιθανοί και σχετικοί.
  - Αποφύγετε αρνητικές διατυπώσεις στις ερωτήσεις.
  - Ποικίλετε τη θέση της/των σωστής/ών απάντησης/εων.`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Δημιούργησε ΜΟΝΟ ένα πλήρες και έγκυρο JSON μέσα σε ένα block κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το ριζικό αντικείμενο πρέπει να περιέχει:
  - \`title\`: Ο τίτλος της δραστηριότητας.
  - \`questions\`: Ένας πίνακας αντικειμένων. Κάθε αντικείμενο αντιπροσωπεύει μια ερώτηση QCM και πρέπει να περιέχει:
    - \`library\`: Πάντα \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: Ένα αντικείμενο που περιέχει ένα κλειδί \`title\` (σύντομος τίτλος της ερώτησης).
    - \`params\`: Τα δεδομένα της ερώτησης.
  - \`overallFeedback\`: Γενικός πίνακας 6 αντικειμένων για την τελική βαθμολογία του QuizSet.

**Λεπτομέρειες των \`params\` για QCM (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: Η ερώτηση που τίθεται (string).
- \`answers\`: Πίνακας αντικειμένων με \`text\` (string) και \`correct\` (boolean).
- \`behaviour\`: Αντικείμενο με \`singleAnswer\`: \`true\` αν υπάρχει μόνο μία σωστή απάντηση, \`false\` αν υπάρχουν περισσότερες.

**Κάθε ερώτηση πρέπει να περιλαμβάνει το δικό της \`overallFeedback\` (6 κλίμακες: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Μορφοποίηση:** Χρησιμοποίησε τη σύνταξη Markdown για έντονη γραφή (\`**κείμενο**\`) και πλάγια γραφή (\`*κείμενο*\`).
- **LaTeX:** Για μαθηματικούς τύπους, χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τη μορφή LaTeX με διπλό escape: \`\\\\( ... \\\\)\`. Μην χρησιμοποιείς ΠΟΤΕ το σύμβολο \`$\` μόνο του.
- **Feedback:** Τα feedback ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX ή Markdown.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Κουίζ πολλαπλής επιλογής - Επιστήμες",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Αστρονομία - Πλανήτες" },
      "params": {
        "question": "Ποιος πλανήτης είναι πιο κοντά στον Ήλιο;",
        "answers": [
          { "text": "Αφροδίτη", "correct": false },
          { "text": "Άρης", "correct": false },
          { "text": "Ερμής", "correct": true },
          { "text": "Δίας", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Λάθος."},
          {"from": 11, "to": 30, "feedback": "Ανεπαρκές."},
          {"from": 31, "to": 50, "feedback": "Μέτριο."},
          {"from": 51, "to": 70, "feedback": "Καλό."},
          {"from": 71, "to": 90, "feedback": "Πολύ καλό."},
          {"from": 91, "to": 100, "feedback": "Εξαιρετικό!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Βιολογία - Οργανίδια" },
      "params": {
        "question": "Ποια οργανίδια έχουν το δικό τους DNA;",
        "answers": [
          { "text": "Ριβόσωμα", "correct": false },
          { "text": "Μιτοχόνδριο", "correct": true },
          { "text": "Συσκευή Golgi", "correct": false },
          { "text": "Χλωροπλάστης", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Λάθος."},
          {"from": 11, "to": 30, "feedback": "Ανεπαρκές."},
          {"from": 31, "to": 50, "feedback": "Μέτριο."},
          {"from": 51, "to": 70, "feedback": "Καλό."},
          {"from": 71, "to": 90, "feedback": "Πολύ καλό."},
          {"from": 91, "to": 100, "feedback": "Εξαιρετικό!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Αδύναμο αποτέλεσμα. Επαναλάβετε τα βασικά."},
    {"from": 11, "to": 30, "feedback": "Ανεπαρκές αποτέλεσμα. Συνεχίστε να προσπαθείτε."},
    {"from": 31, "to": 50, "feedback": "Μέτριο αποτέλεσμα. Προοδεύετε."},
    {"from": 51, "to": 70, "feedback": "Καλό αποτέλεσμα. Κατέχετε αρκετές έννοιες."},
    {"from": 71, "to": 90, "feedback": "Πολύ καλό αποτέλεσμα. Είστε στο σωστό δρόμο."},
    {"from": 91, "to": 100, "feedback": "Εξαιρετικό αποτέλεσμα. Συγχαρητήρια!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P Quiz Σωστό/Λάθος) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Αριθμός ερωτήσεων : Παρήγαγε έναν πίνακα με τουλάχιστον 5 ερωτήσεις || [NOMBRE_ELEMENTS] ερωτήσεις.
- Τύπος : Πρέπει να δημιουργήσετε ΜΟΝΟ ερωτήσεις τύπου **Σωστό/Λάθος** (\`H5P.TrueFalse\` 1.8). Δεν επιτρέπεται κανένας άλλος τύπος.
- Ποιότητα ερωτήσεων :
  - Οι δηλώσεις πρέπει να είναι σαφείς και χωρίς ασάφειες.
  - Αποφύγετε τις διπλές αρνήσεις.
  - Εναλλάξτε μεταξύ σωστών και λανθασμένων δηλώσεων.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Δημιούργησε ΜΟΝΟ ένα πλήρες και έγκυρο JSON μέσα σε ένα block κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να ξεκινά με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- Το ριζικό αντικείμενο πρέπει να περιέχει:
  - \`title\`: Ο τίτλος της δραστηριότητας.
  - \`questions\`: Ένας πίνακας αντικειμένων. Κάθε αντικείμενο αντιπροσωπεύει μια ερώτηση και πρέπει να περιέχει:
    - \`library\`: Πάντα \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: Ένα αντικείμενο που περιέχει ένα κλειδί \`title\` (σύντομος τίτλος της ερώτησης).
    - \`params\`: Τα δεδομένα της ερώτησης.
  - \`overallFeedback\`: Γενικός πίνακας 6 αντικειμένων για την τελική βαθμολογία του QuizSet: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Λεπτομέρειες των \`params\` για Σωστό/Λάθος (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: Η θέση ή η ερώτηση που τίθεται (string).
- \`correct\`: Η σωστή απάντηση. ΠΡΕΠΕΙ να είναι συμβολοσειρά (string): "true" ή "false".
- **Μορφοποίηση:** Χρησιμοποίησε τη σύνταξη Markdown για έντονη γραφή (\`**κείμενο**\`) και πλάγια γραφή (\`*κείμενο*\`).
- **LaTeX:** Για μαθηματικούς τύπους, χρησιμοποίησε ΑΠΟΚΛΕΙΣΤΙΚΑ τη μορφή LaTeX με διπλό escape: \`\\\\( ... \\\\)\`. Μην χρησιμοποιείς ΠΟΤΕ το σύμβολο \`$\` μόνο του.
- **Feedback:** Τα feedback ΔΕΝ ΠΡΕΠΕΙ να περιέχουν LaTeX ή Markdown.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz Σωστό/Λάθος - Γεωγραφία",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Γεωγραφία - Πρωτεύουσες" },
      "params": {
        "question": "Η πρωτεύουσα της Αυστραλίας είναι η Καμπέρα.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Γεωγραφία - Ήπειροι" },
      "params": {
        "question": "Η Αφρική είναι η μεγαλύτερη ήπειρος στον κόσμο.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Αδύναμο αποτέλεσμα. Επαναλάβετε τα βασικά."},
    {"from": 11, "to": 30, "feedback": "Ανεπαρκές αποτέλεσμα. Συνεχίστε να προσπαθείτε."},
    {"from": 31, "to": 50, "feedback": "Μέτριο αποτέλεσμα. Προοδεύετε."},
    {"from": 51, "to": 70, "feedback": "Καλό αποτέλεσμα. Κατέχετε αρκετές έννοιες."},
    {"from": 71, "to": 90, "feedback": "Πολύ καλό αποτέλεσμα. Είστε στο σωστό δρόμο."},
    {"from": 91, "to": 100, "feedback": "Εξαιρετικό αποτέλεσμα. Συγχαρητήρια!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Test Moodle/Éléa) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Αριθμός ερωτήσεων: Τουλάχιστον 10 ερωτήσεις || [NOMBRE_ELEMENTS] ερωτήσεις.
- Ποικιλία: Επίλεξε τις πιο κατάλληλες μορφές ερωτήσεων από τις ακόλουθες:
  - **Πολλαπλής επιλογής** (\`multichoice\`)
  - **Αντιστοίχιση** (\`matching\`)
  - **Αριθμητική** (\`numerical\`)
  - **Σωστό/Λάθος** (\`truefalse\`)
  - **Σύντομη απάντηση** (\`shortanswer\`)
  - **Συμπλήρωσης κενών** (\`cloze\`)
- Αποπροσανατολιστές: Πρότεινε τουλάχιστον 3 αποπροσανατολιστές ανά ερώτηση \`multichoice\`.`,

  ELEA_TEST_STRUCTURE_JSON: `- Παρήγαγε ΑΠΟΚΛΕΙΣΤΙΚΑ ένα πλήρες και έγκυρο JSON σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να αρχίζει με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.

Το κύριο αντικείμενο πρέπει να περιέχει τα εξής κλειδιά:
- \`bank_name\`: Ένα σύντομο και περιγραφικό όνομα για την τράπεζα ερωτήσεων.
- \`bank_description\`: Μια φράση που περιγράφει το περιεχόμενο της τράπεζας.
- \`questions\`: Ένας πίνακας αντικειμένων όπου κάθε αντικείμενο αντιπροσωπεύει μια ερώτηση (\`type\`, \`content\`).
  - Κάθε ερώτηση πρέπει να έχει ένα σύντομο και μοναδικό \`content.name\` (π.χ. "Ε1 - Θέμα").

**Κανόνες μορφοποίησης:**
- **Αριθμοί**: χρησιμοποίησε τελεία για τα δεκαδικά (π.χ. 12.34).
- **Cloze**: τήρησε αυστηρά τη σύνταξη \`{1:TYPE:=Σωστή απάντηση~Λάθος απάντηση}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **Για τον τύπο \`multichoice\` (Πολλαπλής επιλογής):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "Ε1 - Γεωγραφία",
      "questiontext": "Ποια είναι η πρωτεύουσα της Γαλλίας;",
      "feedback": "Το Παρίσι είναι η πολιτική και οικονομική πρωτεύουσα της Γαλλίας.",
      "answers": [
        { "text": "Παρίσι", "fraction": 100, "feedback": "Ακριβώς!" },
        { "text": "Λυών", "fraction": 0, "feedback": "Όχι, η Λυών είναι μια μεγάλη πόλη αλλά όχι η πρωτεύουσα." },
        { "text": "Μασσαλία", "fraction": 0, "feedback": "Όχι, είναι η δεύτερη μεγαλύτερη πόλη της Γαλλίας." }
      ]
    }
  }
  \`\`\`

- **Για τον τύπο \`matching\` (Αντιστοίχιση):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "Ε2 - Αγγλικό Λεξιλόγιο",
      "questiontext": "Αντιστοιχίστε κάθε αγγλική λέξη με την ελληνική της μετάφραση.",
      "feedback": "Μπράβο, κατέχετε το βασικό λεξιλόγιο.",
      "subquestions": [
        { "text": "Dog", "answer": "Σκύλος" },
        { "text": "Cat", "answer": "Γάτα" },
        { "text": "Bird", "answer": "Πουλί" }
      ]
    }
  }
  \`\`\`

- **Για τον τύπο \`numerical\` (Αριθμητική):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "Ε3 - Μαθηματικά",
      "questiontext": "Ποια είναι η τιμή του π στρογγυλοποιημένη σε δύο δεκαδικά;",
      "feedback": "Το π είναι μια άρρητη σταθερά περίπου ίση με 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "Είναι όντως 3.14." }
    }
  }
  \`\`\`

- **Για τον τύπο \`truefalse\` (Σωστό/Λάθος):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "Ε4 - Επιστήμη",
      "questiontext": "Το νερό βράζει στους 100°C στο επίπεδο της θάλασσας.",
      "feedback": "Είναι μια τυπική φυσική ιδιότητα του νερού.",
      "answer": { "value": true, "feedback_true": "Σωστό.", "feedback_false": "Λάθος, το νερό βράζει όντως στους 100°C σε 1 atm." }
    }
  }
  \`\`\`

- **Για τον τύπο \`shortanswer\` (Σύντομη απάντηση):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "Ε5 - Λογοτεχνία",
      "questiontext": "Ποιος έγραψε τους 'Άθλιους';",
      "feedback": "Είναι ένα από τα σπουδαιότερα μυθιστορήματα του 19ου αιώνα.",
      "answers": [
        { "text": "Βίκτωρ Ουγκό", "fraction": 100, "feedback": "Σωστά!" },
        { "text": "Ουγκό", "fraction": 100, "feedback": "Σωστά!" }
      ]
    }
  }
  \`\`\`

- **Για τον τύπο \`cloze\` (Συμπλήρωσης κενών):**
  - Προσοχή στη σύνταξη: \`{1:SHORTANSWER:=Καλή~Κακή}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "Ε6 - Ιστορία",
      "questiontext": "Ο Ναπολέων γεννήθηκε το {1:SHORTANSWER:=1769} στο {1:MULTICHOICE:=Αιάκειο~Μπαστιά~Παρίσι}.",
      "feedback": "Ο Ναπολέων Βοναπάρτης γεννήθηκε στην Κορσική."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Millionnaire) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Αριθμός ερωτήσεων : ΑΚΡΙΒΩΣ 6 ερωτήσεις (δεν πρέπει σε καμία περίπτωση να τροποποιηθεί)
- Προοδευτικότητα : Η δυσκολία των ερωτήσεων πρέπει να είναι **αυξανόμενη και παιδαγωγική**. Τα σημαντικά στοιχεία προς απομνημόνευση τοποθετούνται στις πρώτες ερωτήσεις.
- Εγκυρότητα : Το περιεχόμενο πρέπει να είναι αυστηρά ακριβές και συναφές.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Παρήγαγε ΜΟΝΟ ένα πλήρες και έγκυρο JSON σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να αρχίζει με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
Ένα κύριο αντικείμενο με τα ακόλουθα κλειδιά :
- \`title\` : Ο τίτλος της δραστηριότητας (Συμβολοσειρά).
- \`questions\` : Ένας πίνακας με ΑΚΡΙΒΩΣ 6 αντικείμενα, όπου κάθε αντικείμενο αντιπροσωπεύει μια ερώτηση και περιέχει :
  - \`question\` : Η εκφώνηση της ερώτησης (Συμβολοσειρά).
  - \`goodanswer\` : Η σωστή απάντηση (Συμβολοσειρά).
  - \`badanswer\` : Ένας πίνακας με ΑΚΡΙΒΩΣ 3 λανθασμένες απαντήσεις (Πίνακας συμβολοσειρών).
  - Για τους μαθηματικούς τύπους, το LaTeX απαγορεύεται.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Κουίζ για τη Γαλλική Επανάσταση",
  "questions": [
    {
      "question": "Ποιο γεγονός σηματοδοτεί την έναρξη της Γαλλικής Επανάστασης στις 14 Ιουλίου 1789 ;",
      "goodanswer": "Η άλωση της Βαστίλης",
      "badanswer": ["Ο όρκος του σφαιριστηρίου", "Η εκτέλεση του Λουδοβίκου ΙΣΤ'", "Η μάχη του Βαλμί"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Appariement) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Αριθμός ζευγών : Τουλάχιστον 5 ζεύγη || [NOMBRE_ELEMENTS] ζεύγη.
- Λογική : Η σχέση μεταξύ των δύο στοιχείων πρέπει να είναι προφανής μετά την ανάγνωση των πηγών.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Παρήγαγε ΜΟΝΟ ένα πλήρες και έγκυρο JSON σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να αρχίζει με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
Ένα κύριο αντικείμενο με τα ακόλουθα κλειδιά :
- \`title\` : Ο τίτλος της δραστηριότητας (Συμβολοσειρά).
- \`intro\` : Σύντομη οδηγία ή κείμενο εισαγωγής (Συμβολοσειρά).
- \`pairs\` : Ένας πίνακας αντικειμένων, όπου κάθε αντικείμενο αντιπροσωπεύει ένα ζεύγος και περιέχει :
  - \`question\` : Ο όρος ή το στοιχείο στα αριστερά (Συμβολοσειρά).
  - \`answer\` : Ο ορισμός ή το αντίστοιχο στοιχείο στα δεξιά (Συμβολοσειρά).
  - Για τους μαθηματικούς τύπους, χρησιμοποίησε τη μορφή LaTeX με διπλή διαφυγή, για παράδειγμα : \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Αντιστοίχιση Ιστορίας",
  "intro": "Αντιστοιχίστε κάθε ημερομηνία με το αντίστοιχο γεγονός της Γαλλικής Επανάστασης.",
  "pairs": [
    {"question": "Άλωση της Βαστίλης", "answer": "14 Ιουλίου 1789"},
    {"question": "Κατάργηση των προνομίων", "answer": "4 Αυγούστου 1789"},
    {"question": "Διακήρυξη των Δικαιωμάτων του Ανθρώπου", "answer": "26 Αυγούστου 1789"},
    {"question": "Πορεία των γυναικών", "answer": "5 Οκτωβρίου 1789"},
    {"question": "Γιορτή της Ομοσπονδίας", "answer": "14 Ιουλίου 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (QCM Éléa) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Αριθμός ερωτήσεων : Τουλάχιστον 5 ερωτήσεις || [NOMBRE_ELEMENTS] ερωτήσεις.
- Απαντήσεις : Πρότεινε μεταξύ 2 και 5 επιλογών ανά ερώτηση.
- Παραπλανητικά (Distracteurs) : Συνεκτικά με το θέμα αλλά περιλαμβάνουν λογικά λάθη.`,

  ELEA_QCM_STRUCTURE_JSON: `- Παρήγαγε ΜΟΝΟ ένα πλήρες και έγκυρο JSON σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να αρχίζει με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`title\` : Τίτλος της δραστηριότητας.
- \`questions\` : Πίνακας αντικειμένων. Κάθε αντικείμενο ερώτηση πρέπει να περιέχει :
  - \`text\` : Εκφώνηση της ερώτησης (μπορεί να περιέχει απλό HTML όπως \`**\` για έντονη γραφή).
  - \`answers\` : Πίνακας αντικειμένων \`{"text": "...", "iscorrect": 1/0}\`. \`1\` για μια σωστή απάντηση, \`0\` διαφορετικά.
  - Για τους μαθηματικούς τύπους, χρησιμοποίησε τη μορφή LaTeX με διπλή διαφυγή, για παράδειγμα : \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "QCM για τη Γαλλική Επανάσταση",
  "questions": [
    {
      "text": "Ποια είναι η ημερομηνία της άλωσης της Βαστίλης ;",
      "answers": [
        {"text": "14 Ιουλίου 1789", "iscorrect": 1},
        {"text": "4 Αυγούστου 1789", "iscorrect": 0},
        {"text": "26 Αυγούστου 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (Glossaire XML) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- Αριθμός καταχωρίσεων : Τουλάχιστον 5 όροι || [NOMBRE_ELEMENTS] όροι.
- Επιλογή : Προσδιόρισε τις λέξεις-κλειδιά, τα ακρωνύμια και τις τεχνικές έννοιες.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- Παρήγαγε ΜΟΝΟ ένα πλήρες και έγκυρο JSON σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να αρχίζει με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- **Ρίζα :** Ένα κύριο αντικείμενο που περιέχει δύο κλειδιά : \`name\` (το όνομα του γλωσσαρίου) και \`entries\` (ένας πίνακας αντικειμένων).
- **Κάθε αντικείμενο στο \`entries\` πρέπει να περιέχει :**
  - \`concept\` : Η λέξη ή η έκφραση προς ορισμό.
  - \`definition\` : Ο σαφής και συνοπτικός ορισμός. Χρησιμοποίησε **λέξη** για έντονη γραφή, *λέξη* για πλάγια γραφή και \`\\n\` για αλλαγές γραμμής, μόνο όταν είναι παιδαγωγικά σκόπιμο.
  - \`aliases\` (προαιρετικό) : Ένας πίνακας συμβολοσειρών για συνώνυμα ή εναλλακτικούς όρους. Πρόσθεσε αυτό το κλειδί μόνο εάν υπάρχουν σχετικά alias.
  - Για τους μαθηματικούς τύπους, χρησιμοποίησε τη μορφή LaTeX με διπλή διαφυγή, για παράδειγμα : \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Γλωσσάριο Δημοσιογραφίας",
  "entries": [
    {
      "concept": "Δημοσιογράφος",
      "definition": "Άτομο που **συλλέγει** και διαδίδει *πληροφορίες*.",
      "aliases": ["Ρεπόρτερ", "Χρονογράφος"]
    },
    {
      "concept": "Πηγή",
      "definition": "Προέλευση μιας επαληθευμένης *πληροφορίας*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Page Éléa) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Δομή : Η σελίδα πρέπει να περιλαμβάνει τουλάχιστον 5 διαφορετικά μπλοκ || [NOMBRE_ELEMENTS] μπλοκ.
- Παιδαγωγική λογική : Τα περιεχόμενα πρέπει να ακολουθούν μια συνεκτική εξέλιξη (π.χ. : Υποδοχή -> Στόχοι -> Μάθημα -> Λεπτομέρειες/Λεξιλόγιο -> Σιτογραφία).
- Ισορροπία περιεχομένων : Αναμείξτε τις μορφές για να διατηρήσετε τη δέσμευση (κείμενο, πίνακες, λίστες, πλαίσια).
- Υποχρεωτικά περιεχόμενα : Ενσωματώστε συστηματικά ένα banner έναρξης (\`#01_hero_header\`), πλαίσια στόχων ή σημείων προσοχής (\`#04_callout_set\`), ένα λεξιλόγιο για τους τεχνικούς όρους (\`#06_lexique_table\`), τουλάχιστον τρεις παραγράφους ουσιαστικού περιεχομένου (\`#12_context_paragraphs\`) και μια σιτογραφία αναφοράς (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Παρήγαγε ΜΟΝΟ ένα πλήρες και έγκυρο JSON σε ένα μπλοκ κώδικα. Η απάντησή σου ΠΡΕΠΕΙ να αρχίζει με \`{\` και να τελειώνει με \`}\`. Κανένα άλλο κείμενο ή σχόλιο.
- \`title\` : Τίτλος της σελίδας (Συμβολοσειρά).
- \`intro\` : Σύντομο ελκυστικό κείμενο εισαγωγής (Συμβολοσειρά).
- \`blocks\` : Ένας πίνακας αντικειμένων, όπου κάθε αντικείμενο αντιπροσωπεύει μια ενότητα της σελίδας. Κάθε μπλοκ ΠΡΕΠΕΙ να σέβεται μία από τις ακόλουθες δομές :

**Λίστα διαθέσιμων μπλοκ :**
- \`#01_hero_header\`: Banner έναρξης. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Σύνοψη με εσωτερικούς συνδέσμους. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Ιστορικά ορόσημα σε 3 κάρτες. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (μέγιστο 3 κάρτες)
- \`#04_callout_set\`: Banner Στόχοι, Προς γνώση, Προειδοποίηση. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Βασικά στοιχεία σε κάρτες. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Πίνακας λεξιλογίου. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Γλωσσάριο σε ετικέτες. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Κάρτες μνημείων με εικόνες. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Σύγκριση δύο εικόνων.
- \`#10_table_comparison\`: Πίνακας σύγκρισης.
- \`#11_definition_box\`: Πλαίσιο Ορισμού. \`{ "type": "#11_definition_box", "data": { "title": "Ορισμός", "text": "..." } }\`
- \`#12_context_paragraphs\`: Παράγραφοι μαθήματος. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Λεπτομερές δελτίο.
- \`#14_faq_block\`: Συχνές ερωτήσεις. \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Μύθοι vs Πραγματικότητα.
- \`#17_method_image_desc\`: Μέθοδος περιγραφής εικόνας.
- \`#18_sito_graphy\`: Σιτογραφία. \`{ "type": "#18_sito_graphy", "data": { "title": "Σιτογραφία", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Δίγλωσσο απόφθεγμα.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Η Γαλλική Επανάσταση",
  "intro": "Ανακαλύψτε τις βασικές στιγμές αυτής της ιστορικής περιόδου.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "Η Επανάσταση", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Στόχοι",
        "callouts": [{"type": "objectif", "text": "Κατανόηση των αιτιών του 1789."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "Ο Όρκος του Σφαιριστηρίου",
        "paragraphs": [
          "Στις 20 Ιουνίου 1789, οι βουλευτές της Τρίτης Τάξης συγκεντρώνονται...",
          "Αυτή η κίνηση σηματοδοτεί τη γέννηση της Εθνοσυνέλευσης.",
          "Πρόκειται για μια σημαντική καμπή προς το τέλος της απολυταρχίας."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Λεξιλόγιο",
        "headers": ["Όρος", "Ορισμός"],
        "rows": [["Τρίτη Τάξη", "Το μεγαλύτερο μέρος του πληθυσμού..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Για να προχωρήσετε περισσότερο",
        "links": [{"href": "https://...", "text": "Επίσημος ιστότοπος της Ιστορίας"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ΜΕΤΑΦΡΑΣΕΙΣ ΔΙΕΠΑΦΗΣ H5P (ΤΥΠΟΠΟΙΗΜΕΝΕΣ) ===
  // ============================================================================

  // Κοινά κλειδιά
  h5p_check_answer: "Έλεγχος",
  h5p_try_again: "Δοκιμάστε ξανά",
  h5p_show_solution: "Εμφάνιση λύσης",
  h5p_submit_answer: "Υποβολή",
  h5p_score: "Λάβατε @score από @total πόντους",
  h5p_score_bar_label: "Λάβατε :num από :total πόντους",
  h5p_tip_label: "Υπόδειξη",
  h5p_next: "Επόμενο",
  h5p_previous: "Προηγούμενο",
  h5p_close: "Κλείσιμο",
  h5p_finish_header: "Τερματισμός;",
  h5p_finish_body: "Είστε σίγουροι ότι θέλετε να τερματίσετε;",
  h5p_cancel_label: "Ακύρωση",
  h5p_finish_label: "Τερματισμός",
  h5p_retry_header: "Επαναπάλη;",
  h5p_retry_body: "Είστε σίγουροι ότι θέλετε να επαναλάβετε;",
  h5p_retry_confirm_label: "Επιβεβαίωση",
  h5p_resume: "Συνέχεια",
  h5p_audio_direction: "Κατεύθυνση ήχου",
  h5p_a11y_check: "Ελέγξτε τις απαντήσεις. Οι απαντήσεις θα επισημανθούν ως σωστές, λανθασμένες ή αναπάντητες.",
  h5p_a11y_show_solution: "Εμφάνιση της λύσης. Η εργασία θα επισημανθεί με τη σωστή της λύση.",
  h5p_a11y_retry: "Επαναλάβετε την εργασία. Επαναφέρετε όλες τις απαντήσεις και ξεκινήστε την εργασία από την αρχή.",

  // Σταυρόλεξο (Crossword)
  h5p_crossword_across: "Οριζόντια",
  h5p_crossword_down: "Κάθετα",
  h5p_crossword_extra_clue: "Επιπλέον στοιχείο",

  // Περίληψη (Summary)
  h5p_summary_intro: "Επιλέξτε τη σωστή δήλωση.",
  h5p_summary_solved_label: "Πρόοδος:",
  h5p_summary_score_label: "Λανθασμένες απαντήσεις:",
  h5p_summary_result_label: "Το αποτέλεσμά σας",
  h5p_summary_feedback: "Έχετε @score από @total σωστές δηλώσεις (@percent%).",
  h5p_summary_label_correct: "Σωστό.",
  h5p_summary_label_incorrect: "Λάθος! Παρακαλώ δοκιμάστε ξανά.",
  h5p_summary_label_correct_answers: "Σωστές απαντήσεις.",
  h5p_summary_progress_text: "Πρόοδος :num από :total",
  h5p_summary_alternative_incorrect_label: "Λάθος",

  // Σύρσιμο λέξεων (Drag the Words)
  h5p_drag_words_score_feedback: "Βαθμολογία: @score από @total.",
  h5p_drag_words_correct_text: "Σωστό!",
  h5p_drag_words_incorrect_text: "Λάθος!",

  // Συμπλήρωση κενών (Fill in the Blanks)
  h5p_blanks_not_filled_out: "Παρακαλώ συμπληρώστε όλα τα κενά.",
  h5p_blanks_answer_is_correct: "Το &#039;:ans&#039; είναι σωστό",
  h5p_blanks_answer_is_wrong: "Το &#039;:ans&#039; είναι λάθος",
  h5p_blanks_answered_correctly: "Απαντήθηκε σωστά",
  h5p_blanks_answered_incorrectly: "Απαντήθηκε λάθος",
  h5p_blanks_solution_label: "Σωστή απάντηση:",
  h5p_blanks_input_label: "Κενό @num από @total",
  h5p_blanks_input_has_tip_label: "Διαθέσιμη υπόδειξη",
  h5p_blanks_feedback: "Έχετε @score από @total κενά σωστά.",
  h5p_blanks_checking_mode_header: "Λειτουργία ελέγχου",

  // Επισήμανση λέξεων (Mark the Words)
  h5p_mark_words_correct_answer: "Σωστό!",
  h5p_mark_words_incorrect_answer: "Λάθος!",
  h5p_mark_words_missed_answer: "Παραλείφθηκε!",
  h5p_mark_words_display_solution_description: "Η εργασία ενημερώθηκε για να περιέχει τη λύση.",
  h5p_mark_words_a11y_full_text_label: "Πλήρες αναγνώσιμο κείμενο",
  h5p_mark_words_a11y_clickable_text_label: "Πλήρες κείμενο όπου οι λέξεις μπορούν να επισημανθούν",
  h5p_mark_words_a11y_solution_mode_header: "Λειτουργία λύσης",
  h5p_mark_words_a11y_checking_header: "Λειτουργία ελέγχου",

  // Κάρτες κειμένου (Flashcards)
  h5p_flashcards_progress_text: "Κάρτα @card από @total",
  h5p_flashcards_your_answer: "Η απάντησή σας",
  h5p_flashcards_correct_answer: "Σωστή απάντηση",
  h5p_flashcards_incorrect_answer: "Λάθος απάντηση",
  h5p_flashcards_show_solution: "Σωστή απάντηση",
  h5p_flashcards_results: "Αποτελέσματα",
  h5p_flashcards_of_correct: "@score από @total σωστά",
  h5p_flashcards_show_results: "Εμφάνιση αποτελεσμάτων",
  h5p_flashcards_answer_short: "Α:",
  h5p_flashcards_card_announcement: "Λάθος απάντηση. Η σωστή απάντηση ήταν @answer",
  h5p_flashcards_correct_announcement: "Το @answer είναι σωστό.",
  h5p_flashcards_page_announcement: "Σελίδα @current από @total",

  // Έκθεση (Essay)
  h5p_essay_feedbackHeader: "Σχόλια",
  h5p_essay_solutionTitle: "Δείγμα λύσης",
  h5p_essay_remainingChars: "Υπολειπόμενοι χαρακτήρες: @chars",
  h5p_essay_notEnoughChars: "Πρέπει να εισαγάγετε τουλάχιστον @chars χαρακτήρες!",
  h5p_essay_messageSave: "αποθηκεύτηκε",
  h5p_essay_placeholderText: "Ξεκινήστε να γράφετε εδώ...",
  h5p_essay_ariaYourResult: "Λάβατε @score από @total πόντους",
  h5p_essay_ariaNavigatedToSolution: "Μετάβαση στο δείγμα λύσης που μόλις συμπεριλήφθηκε μετά την περιοχή κειμένου.",

  // Σωστό/Λάθος (True/False)
  h5p_true_false_true_text: "Σωστό",
  h5p_true_false_false_text: "Λάθος",
  h5p_true_false_wrong_answer_message: "Λάθος απάντηση",
  h5p_true_false_correct_answer_message: "Σωστή απάντηση",

  // Αναζήτηση λέξεων (Find the Words)
  h5p_find_words_found: "Βρέθηκαν @found από @totalWords λέξεις",
  h5p_find_words_time_spent: "Χρόνος που δαπανήθηκε",
  h5p_find_words_word_list_header: "Λίστα λέξεων",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Ταξινόμηση παραγράφων (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "Προς τα πάνω",
  h5p_sort_paragraphs_down: "Προς τα κάτω",
  h5p_sort_paragraphs_disabled: "Απενεργοποιημένο",
  h5p_sort_paragraphs_paragraph: "Παράγραφος",
  h5p_sort_paragraphs_point: "@score πόντος",
  h5p_sort_paragraphs_seven_of_nine: "@current από @total",
  h5p_sort_paragraphs_current_position: "Τρέχουσα θέση στη λίστα",
  h5p_sort_paragraphs_instructions_selected: "Πατήστε το space για αναδιάταξη",
  h5p_sort_paragraphs_instructions_grabbed: "Πατήστε τα βέλη πάνω και κάτω για να αλλάξετε θέση, το space για τοποθέτηση, escape για ακύρωση",
  h5p_sort_paragraphs_grabbed: "Πιάστηκε",
  h5p_sort_paragraphs_moved: "Μετακινήθηκε",
  h5p_sort_paragraphs_dropped: "Τοποθετήθηκε",
  h5p_sort_paragraphs_reorder_cancelled: "Η αναδιάταξη ακυρώθηκε",
  h5p_sort_paragraphs_final_position: "Τελική θέση",
  h5p_sort_paragraphs_next_paragraph: "Επόμενη παράγραφος",
  h5p_sort_paragraphs_correct_paragraph: "Σωστή παράγραφος στη θέση",
  h5p_sort_paragraphs_list_description: "Λίστα παραγράφων με δυνατότητα ταξινόμησης.",
  h5p_sort_paragraphs_list_description_check: "Λίστα παραγράφων με αποτελέσματα.",
  h5p_sort_paragraphs_list_description_solution: "Λίστα παραγράφων με λύσεις.",

  // Σειρά μονής επιλογής (Single Choice Set)
  h5p_single_choice_solution_view_title: "Λύση",
  h5p_single_choice_mute_button_label: "Σίγαση",
  h5p_single_choice_slide_of_total: "Διαφάνεια @slide από @total",
  h5p_single_choice_solution_list_question_number: "Ερώτηση @question",
  h5p_single_choice_should_select: "Θα έπρεπε να επιλεγεί",
  h5p_single_choice_should_not_select: "Δεν θα έπρεπε να επιλεγεί",

  // Κάρτες διαλόγου (Dialog Cards)
  h5p_dialog_cards_answer: "Γύρισμα",
  h5p_dialog_cards_progress_text: "Κάρτα @card από @total",
  h5p_dialog_cards_card_front_label: "Μπροστινή όψη κάρτας",
  h5p_dialog_cards_card_back_label: "Πίσω όψη κάρτας",
  h5p_dialog_cards_audio_not_supported: "Ο περιηγητής σας δεν υποστηρίζει αυτή τη μορφή ήχου",
  h5p_dialog_cards_correct_answer: "Το βρήκα!",
  h5p_dialog_cards_incorrect_answer: "Έκανα λάθος",
  h5p_dialog_cards_round: "Γύρος @round",
  h5p_dialog_cards_cards_left: "Κάρτες που απομένουν: @number",
  h5p_dialog_cards_next_round: "Προχωρήστε στον γύρο @round",
  h5p_dialog_cards_start_over: "Επανεκκίνηση",
  h5p_dialog_cards_show_summary: "Επόμενο",
  h5p_dialog_cards_summary: "Περίληψη",
  h5p_dialog_cards_summary_cards_right: "Κάρτες που βρήκατε σωστά:",
  h5p_dialog_cards_summary_cards_wrong: "Κάρτες που χάσατε:",
  h5p_dialog_cards_summary_cards_not_shown: "Κάρτες που δεν εμφανίστηκαν:",
  h5p_dialog_cards_summary_overall_score: "Συνολική βαθμολογία",
  h5p_dialog_cards_summary_cards_completed: "Κάρτες που μάθατε:",
  h5p_dialog_cards_summary_completed_rounds: "Ολοκληρωμένοι γύροι:",
  h5p_dialog_cards_summary_all_done: "Μπράβο! Ολοκληρώσατε και τις @cards κάρτες @max φορές στη σειρά!",

  // Σύνολο ερωτήσεων (Quiz Set)
  h5p_quiz_textual_progress: "Ερώτηση @current από @total",
  h5p_quiz_no_result_message: "Ολοκληρώθηκε",
  h5p_quiz_result_message: "Τα αποτελέσματά σας:",
  h5p_quiz_feedback_available: "Διαθέσιμα σχόλια",
  h5p_quiz_read_feedback: "Διαβάστε το σχόλιο",
  h5p_quiz_wrong_answer: "Λάθος απάντηση",
  h5p_quiz_correct_answer: "Σωστή απάντηση",
  h5p_quiz_should_check: "Έπρεπε να είχε επιλεγεί εδώ",
  h5p_quiz_should_not_check: "Δεν έπρεπε να είχε επιλεγεί εδώ!",
  h5p_quiz_no_input: "Παρακαλώ απαντήστε πριν δείτε τη λύση.",

  // ============================================================================
  // === ΝΟΜΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ - ΥΠΟΣΕΛΙΔΟ ===
  // ============================================================================
  license_info: "GNU GPL v3.0 ή μεταγενέστερη",
  ticket: "Ticket",
  legal_mentions: "Νομικές σημειώσεις",
  legal_title: "Νομικές σημειώσεις",
  legal_editor_title: "Εκδότης της εφαρμογής",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Ιδιότητα :</strong> PLP Lettres-Histoire",
  legal_editor_gauthier_remande_email: "<strong>Email :</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Διεύθυνση :</strong> 39 avenue de Chanzy, 53000 Laval, France",
  legal_editor_gauthier_remande_phone: "<strong>Τηλέφωνο :</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Ιδιότητα :</strong> Καθηγητής μαθηματικών και υπεύθυνος αποστολής DRANE – Académie de Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>Email :</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Διεύθυνση :</strong> 30 boulevard de la République, 38200 Vienne, France",
  legal_editor_emmanuel_gaunard_phone: "<strong>Τηλέφωνο :</strong> +33 6 46 74 20 94",
  legal_app_description: "Η διαδικτυακή εφαρμογή « Caramel » είναι ένα έργο ελεύθερου λογισμικού, μη εμπορικό, που προορίζεται για τη δημιουργία περιεχομένου H5P και Éléa. Δεν απαιτείται λογαριασμός, δεν συλλέγονται προσωπικά δεδομένα.",
  legal_hosting_title: "Φιλοξενία",
  legal_host_name: "<strong>Πάροχος φιλοξενίας</strong> : Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>Επωνυμία</strong> : Ministère de l'Éducation nationale et de la Jeunesse",
  legal_host_address: "<strong>Διεύθυνση</strong> : 110 rue de Grenelle, 75007 Paris, France",
  legal_host_phone: "<strong>Τηλέφωνο</strong> : +33 1 55 55 10 10",
  legal_publication_director_title: "Υπεύθυνος έκδοσης",
  legal_publication_director_name: "Gauthier REMANDE και Emmanuel GAUNARD, υπό την ιδιότητα των εθελοντών εκδοτών.",
  legal_terms_of_use_title: "Γενικοί όροι χρήσης",
  legal_terms_of_use_content: "Αυτός ο ιστότοπος επιτρέπει στους χρήστες να παράγουν περιεχόμενο H5P και Éléa. Η προβολή γίνεται τοπικά, χωρίς διαβίβαση δεδομένων χρήστη. Ο χρήστης είναι αποκλειστικά υπεύθυνος για τη χρήση που κάνει στο περιεχόμενο που παράγεται. Η εφαρμογή προσφέρεται δωρεάν, χωρίς καμία εγγύηση λειτουργίας ή αποτελέσματος. Ο εκδότης αποποιείται κάθε ευθύνη σε περίπτωση κακής ερμηνείας του περιεχομένου ή ακατάλληλης χρήσης.",
  legal_intellectual_property_title: "Πνευματική ιδιοκτησία",
  legal_intellectual_property_content: "Το σύνολο των πηγαίων κωδίκων, των γραφικών στοιχείων και του περιεχομένου διατίθενται υπό την ελεύθερη άδεια GNU AGPLv3. Η επαναχρησιμοποίησή τους επιτρέπεται υπό τους όρους της αντίστοιχης άδειάς τους. Οποιαδήποτε αναδιανομή ή τροποποίηση πρέπει να αναφέρει τους αρχικούς δημιουργούς : Gauthier REMANDE και Emmanuel GAUNARD. Οι εικόνες που χρησιμοποιούνται στις ενότητες H5P ανακτώνται από τον ιστότοπο H5P.org.",
  legal_personal_data_title: "Προσωπικά δεδομένα",
  legal_personal_data_content: "Δεν συλλέγεται ούτε αποθηκεύεται κανένα προσωπικό δεδομένο. Δεν χρησιμοποιείται κανένα cookie παρακολούθησης.",
  legal_ai_models_title: "Μοντέλα Τεχνητής Νοημοσύνης",
  legal_ai_models_content: "Η εφαρμογή Caramel βασίζεται, αποκλειστικά κατά τη δημιουργία με ένα κλικ, σε μοντέλα ΤΝ που λειτουργούν από την ILAAS, μια ομοσπονδία κοινών υποδομών ΤΝ. Τα αιτήματα δρομολογούνται μέσω ενός workflow n8n που φιλοξενείται από το Incubateur, και στη συνέχεια διαβιβάζονται στην ILAAS για εκτέλεση σε αξιόπιστους διακομιστές που φιλοξενούνται σε πιστοποιημένα κέντρα δεδομένων της Τριτοβάθμιας Εκπαίδευσης και Έρευνας (ESR). Η Caramel δεν εκτελεί τα μοντέλα και δεν επεξεργάζεται ούτε αποθηκεύει τα δεδομένα η ίδια· τα δεδομένα χρησιμοποιούνται αποκλειστικά για την εκτέλεση του αιτήματος και δεν αποστέλλονται σε ΤΝ ευρείας κατανάλωσης. Τα μοντέλα που προτείνονται επί του παρόντος περιλαμβάνουν τα {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) και {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). Οι τρόποι φιλοξενίας, καταγραφής και πιθανής διατήρησης που πραγματοποιούνται από την ILAAS εμπίπτουν στην πολιτική απορρήτου τους και στους όρους παροχής υπηρεσιών τους, στους οποίους θα πρέπει να ανατρέξετε.",
  legal_user_requests_processing_title: "Επεξεργασία αιτημάτων χρηστών μέσω n8n και του Incubateur του Υπουργείου Εθνικής Παιδείας",
  legal_user_requests_processing_content: "Ο ιστότοπός μας χρησιμοποιεί μια τεχνική λύση που αναπτύχθηκε από το n8n, ένα εργαλείο ανοικτού κώδικα που φιλοξενείται από το Incubateur του Υπουργείου Εθνικής Παιδείας. Αυτή η υπηρεσία επιτρέπει, μέσω ενός αυτοματοποιημένου workflow, τη μετατροπή των αιτημάτων των χρηστών σε δομημένα δεδομένα (μορφή JSON) προκειμένου να αλληλεπιδράσουν με μια τεχνητή νοημοσύνη της DINUM, άρα κυρίαρχη. Καμία ευαίσθητη πληροφορία δεν εκτίθεται ή διαβιβάζεται χωρίς κρυπτογράφηση, διασφαλίζοντας έτσι την εμπιστευτικότητα και την ασφάλεια των ανταλλαγών.",
  legal_accessibility_title: "Προσβασιμότητα",
  legal_accessibility_content: "Η εφαρμογή έχει σχεδιαστεί για να είναι συμβατή με χρήση σε υπολογιστή, συμπεριλαμβανομένων των λειτουργιών σκούρου/ανοιχτού θέματος, της πλοήγησης με πληκτρολόγιο και της υψηλής αντίθεσης ανάλογα με τα θέματα. Μια συνεχής βελτίωση της προσβασιμότητας είναι σε εξέλιξη, σε συνάρτηση με τις συστάσεις του RGAA.",
  legal_applicable_law_title: "Εφαρμοστέο δίκαιο",
  legal_applicable_law_content: "Αυτός ο ιστότοπος υπόκειται στο γαλλικό δίκαιο. Σε περίπτωση διαφοράς, τα αρμόδια δικαστήρια θα είναι εκείνα της περιφέρειας της Λυών.",
  legal_external_libraries_title: "Εξωτερικές βιβλιοθήκες που χρησιμοποιούνται",
  legal_external_libraries_intro: "Η εφαρμογή Caramel χρησιμοποιεί αρκετές βιβλιοθήκες ανοικτού κώδικα, υπό τις ακόλουθες άδειες :",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Άδεια : CC BY 4.0, SIL OFL 1.1, MIT) : Παρέχει τα εικονίδια που χρησιμοποιούνται στη διεπαφή για τη βελτίωση της πλοήγησης και της οπτικής εμπειρίας.",
  legal_library_jszip: "<strong>JSZip</strong> (Άδεια : MIT ή GPLv3) : Επιτρέπει τη δημιουργία αρχείων .h5p συμπιέζοντας το απαραίτητο περιεχόμενο σε ένα αρχείο zip.",
  legal_library_clientzip: "<strong>client-zip</strong> (Άδεια : MIT) : Μια άλλη βιβλιοθήκη που χρησιμοποιείται για τη συμπίεση αρχείων, προσφέροντας μια αποδοτική εναλλακτική λύση για τη δημιουργία αρχείων .h5p απευθείας στο πρόγραμμα περιήγησης.",
  legal_library_fflate: "<strong>fflate</strong> (Άδεια : MIT) : Πολύ γρήγορη βιβλιοθήκη για τη συμπίεση και αποσυμπίεση δεδομένων, που χρησιμοποιείται για τη δημιουργία αρχείων .mbz των ενοτήτων Moodle.",
  legal_library_tarjs: "<strong>tar-js</strong> (Άδεια : MIT) : Επιτρέπει τη δημιουργία αρχείων .tar, ένα απαραίτητο βήμα πριν από τη συμπίεση για τον σχηματισμό των αρχείων .mbz των ενοτήτων Moodle.",
  legal_library_mammoth: "<strong>Mammoth</strong> (Άδεια : BSD 2-Clause) : Επιτρέπει τη μετατροπή εγγράφων Word (.docx) σε HTML, διευκολύνοντας την εισαγωγή και την ενσωμάτωση περιεχομένου από αρχεία Microsoft Word.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (Άδεια : Apache 2.0) : Επιτρέπει την εξαγωγή του κειμένου των αρχείων PDF απευθείας στο πρόγραμμα περιήγησης, χωρίς να απαιτείται επεξεργασία σε διακομιστή.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (Άδεια : Apache 2.0) : Μηχανή οπτικής αναγνώρισης χαρακτήρων (OCR) που επιτρέπει την εξαγωγή κειμένου από εικόνες (PNG, JPG, JPEG) και σκαναρισμένα έγγραφα PDF.",
  legal_library_mathjax: "<strong>MathJax</strong> (Άδεια: Apache 2.0): Χρησιμοποιείται για την απόδοση μαθηματικών τύπων (LaTeX) στις προεπισκοπήσεις.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (Άδεια: MIT): Επιτρέπει την προεπισκόπηση περιεχομένου H5P απευθείας στον περιηγητή χωρίς να απαιτείται διακομιστής ή CMS (όπως το Moodle ή το WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (Άδεια: MIT): Βιβλιοθήκη JavaScript για τη δημιουργία εγγράφων PDF απευθείας στο πρόγραμμα περιήγησης, που χρησιμοποιείται για την εξαγωγή εκπαιδευτικού περιεχομένου σε μορφή PDF.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (Άδεια: MIT): Επέκταση του jsPDF που επιτρέπει τη δημιουργία δομημένων πινάκων στα εξαγόμενα έγγραφα PDF.",
  legal_library_docx: "<strong>docx</strong> (Άδεια: MIT): Βιβλιοθήκη JavaScript για τη δημιουργία εγγράφων Word (.docx) στο πρόγραμμα περιήγησης, που χρησιμοποιείται για την εξαγωγή εκπαιδευτικού περιεχομένου σε μορφή Microsoft Word.",
  legal_library_ownership: "Κάθε βιβλιοθήκη παραμένει ιδιοκτησία των αντίστοιχων δημιουργών της και χρησιμοποιείται σύμφωνα με την άδεια ή τις άδειές της.",

  // ============================================================================
  // === ΕΙΔΟΠΟΙΗΣΕΙΣ ===
  // ============================================================================
  no_notifications: "Δεν υπάρχουν ειδοποιήσεις",
  clear_all: "Διαγραφή όλων",
  view: "Προβολή",
  today: "Σήμερα",
  error: "Σφάλμα",
  download: "Λήψη",
  edit_content: "Επεξεργασία",
  compatible_with: "Συμβατό με:",
  preview_placeholder: "Προεπισκόπηση διαθέσιμη σύντομα",
  previous: "Προηγούμενο",
  next: "Επόμενο",
  close_modal: "Κλείσιμο",
  loading: "Φόρτωση...",
  preview_error: "Αδυναμία προεπισκόπησης αυτού του αρχείου",
  simulator_warning: "Προεπισκόπηση μέσω του προσομοιωτή δραστηριότητας: η τελική εμφάνιση στο Éléa ενδέχεται να διαφέρει ελαφρώς.",
  editor_confirm_close_title: "Μη αποθηκευμένες αλλαγές",
  editor_confirm_close_message: "Θέλετε να αποθηκεύσετε τις αλλαγές σας πριν την έξοδο;",
  editor_confirm_close_cancel: "Παραμονή στον επεξεργαστή",
  editor_confirm_close_save: "Αποθήκευση και έξοδος",
  editor_confirm_close_discard: "Έξοδος χωρίς αποθήκευση",

  // JSON Editor
  editor_title_prefix: "Επεξεργασία:",
  editor_loading: "Φόρτωση επεξεργαστή...",
  editor_unknown_type: "Μη αναγνωρίσιμος τύπος περιεχομένου",
  editor_no_schema: "Το σχήμα δεν είναι διαθέσιμο για αυτόν τον τύπο",
  editor_init_error: "Σφάλμα κατά την αρχικοποίηση του επεξεργαστή",
  editor_save: "Αποθήκευση",
  editor_cancel: "Ακύρωση",
  editor_unsaved_changes: "Μη αποθηκευμένες αλλαγές",
  editor_confirm_discard: "Είστε σίγουροι ότι θέλετε να ακυρώσετε; Οι μη αποθηκευμένες αλλαγές θα χαθούν.",
  editor_validation_errors: "Σφάλματα επικύρωσης",

  // Ενότητες
  editor_section_general: "Γενικές πληροφορίες",
  editor_section_question: "Ερώτηση",
  editor_section_questions: "Ερωτήσεις",
  editor_section_answers: "Απαντήσεις",
  editor_section_answer: "Απάντηση",
  editor_section_feedback: "Ανατροφοδότηση",
  editor_section_cards: "Κάρτες",
  editor_section_sentences: "Προτάσεις",
  editor_section_events: "Γεγονότα",
  editor_section_words: "Λέξεις",
  editor_section_keywords: "Λέξεις-κλειδιά",
  editor_section_entries: "Καταχωρίσεις",
  editor_section_pairs: "Ζεύγη",
  editor_section_text: "Κείμενο",

  // Γενικά πεδία
  editor_title: "Τίτλος",
  editor_description: "Περιγραφή",
  editor_description_hint: "Οδηγία που εμφανίζεται στους μαθητές",
  editor_intro: "Εισαγωγή",
  editor_task_description: "Οδηγία",
  editor_question_text: "Κείμενο ερώτησης",

  // Κάρτες
  editor_card: "Κάρτα",
  editor_card_front: "Εμπρόσθια όψη",
  editor_card_front_placeholder: "Ερώτηση ή όρος",
  editor_card_back: "Οπίσθια όψη",
  editor_card_back_placeholder: "Απάντηση ή ορισμός",
  editor_card_tip: "Συμβουλή",
  editor_add_card: "Προσθήκη κάρτας",

  // Απαντήσεις
  editor_answer: "Απάντηση",
  editor_answer_text: "Κείμενο απάντησης",
  editor_is_correct: "Σωστό",
  editor_add_answer: "Προσθήκη απάντησης",

  // Συμβουλές και Ανατροφοδότηση
  editor_tips_feedback: "Συμβουλές και ανατροφοδότηση",
  editor_tip: "Συμβουλή",
  editor_tip_optional: "Συμβουλή (προαιρετικό)",
  editor_tips_optional: "Συμβουλές (προαιρετικό)",
  editor_tip_front: "Συμβουλή εμπρόσθιας όψης",
  editor_tip_back: "Συμβουλή οπίσθιας όψης",
  editor_chosen_feedback: "Ανατροφοδότηση εάν επιλεγεί",
  editor_not_chosen_feedback: "Ανατροφοδότηση εάν δεν επιλεγεί",
  editor_feedback_correct: "Ανατροφοδότηση εάν είναι σωστό",
  editor_feedback_wrong: "Ανατροφοδότηση εάν είναι λάθος",
  editor_overall_feedback: "Συνολική ανατροφοδότηση ανά βαθμολογία",

  // Εύρη ανατροφοδότησης
  editor_feedback_ranges_label: "Ανατροφοδότηση βάσει βαθμολογίας",
  editor_feedback_placeholder: "Μήνυμα ανατροφοδότησης για αυτό το εύρος...",
  editor_add_range: "Προσθήκη εύρους",

  // Σωστό/Λάθος
  editor_correct_answer: "Σωστή απάντηση",
  editor_true: "Σωστό",
  editor_false: "Λάθος",

  // Συμπλήρωση κενών / Μεταφορά λέξεων
  editor_sentence: "Πρόταση",
  editor_sentence_text: "Κείμενο πρότασης",
  editor_add_sentence: "Προσθήκη πρότασης",
  editor_blanks_hint: "Περιβάλετε τις λέξεις προς εύρεση με *αστερίσκους*",
  editor_text_with_blanks: "Κείμενο με λέξεις προς τοποθέτηση",
  editor_drag_words_hint: "Οι λέξεις μεταξύ *αστερίσκων* θα γίνουν στοιχεία μεταφοράς",

  // Χρονολόγιο
  editor_event: "Γεγονός",
  editor_add_event: "Προσθήκη γεγονότος",
  editor_start_date: "Ημερομηνία έναρξης",
  editor_end_date: "Ημερομηνία λήξης",
  editor_event_title: "Τίτλος γεγονότος",
  editor_event_description: "Περιγραφή",
  editor_event_tag: "Ετικέτα",

  // Σταυρόλεξο
  editor_word: "Λέξη",
  editor_add_word: "Προσθήκη λέξης",
  editor_clue: "Συμβουλή/Ορισμός",
  editor_orientation: "Προσανατολισμός",
  editor_horizontal: "Οριζόντια",
  editor_vertical: "Κάθετα",
  editor_crossword_answer_hint: "Η λέξη με κεφαλαία γράμματα",

  // Έκθεση
  editor_keyword: "Λέξη-κλειδί",
  editor_keyword_text: "Αναμενόμενη λέξη-κλειδί",
  editor_keyword_weight: "Βαρύτητα",
  editor_add_keyword: "Προσθήκη λέξης-κλειδί",

  // Γλωσσάριο
  editor_entry: "Καταχώριση",
  editor_add_entry: "Προσθήκη καταχώρισης",
  editor_term: "Όρος",
  editor_definition: "Ορισμός",

  // Moodle
  editor_question: "Ερώτηση",
  editor_add_question: "Προσθήκη ερώτησης",
  editor_pair: "Ζεύγος",
  editor_add_pair: "Προσθήκη ζεύγους",
  editor_left_element: "Αριστερό στοιχείο",
  editor_right_element: "Δεξί στοιχείο",
  editor_choice: "Επιλογή",
  editor_choice_text: "Κείμενο επιλογής",
  editor_add_choice: "Προσθήκη επιλογής",

  // Ενέργειες στοιχείων
  editor_add_item: "Προσθήκη",
  editor_drag: "Μεταφορά",
  editor_duplicate: "Αντιγραφή",
  editor_delete: "Διαγραφή",
  editor_confirm_delete: "Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το στοιχείο;",
  editor_min_items_reached: "Επιτεύχθηκε ο ελάχιστος αριθμός στοιχείων",
  editor_max_items_reached: "Επιτεύχθηκε ο μέγιστος αριθμός στοιχείων",

  // Σφάλματα επικύρωσης
  editor_error_required: "Αυτό το πεδίο είναι υποχρεωτικό",
  editor_error_min_length: "Τουλάχιστον {0} χαρακτήρες",
  editor_error_max_length: "Το πολύ {0} χαρακτήρες",
  editor_error_pattern: "Μη έγκυρη μορφή",
  editor_error_min_items: "Τουλάχιστον {0} στοιχείο(α)",
  editor_error_max_items: "Το πολύ {0} στοιχείο(α)",
  editor_error_number: "Πρέπει να είναι αριθμός",
  editor_error_min: "Ελάχιστο {0}",
  editor_error_max: "Μέγιστο {0}",
  editor_error_feedback_ranges: "Τα εύρη πρέπει να καλύπτουν το 0-100% χωρίς επικαλύψεις",
  editor_error_no_correct: "Τουλάχιστον μία απάντηση πρέπει να είναι σωστή",
  editor_error_date_format: "Μη έγκυρη μορφή ημερομηνίας (αναμένεται: ΕΕΕΕ,Μ,Η)",
  editor_error_no_blanks: "Το κείμενο πρέπει να περιέχει τουλάχιστον μία λέξη μεταξύ *αστερίσκων*",

  // QuizSet
  editor_library_type: "Τύπος βιβλιοθήκης",
  editor_question_title: "Τίτλος ερώτησης",
  editor_question_params: "Παράμετροι ερώτησης",
  editor_parameters: "Παράμετροι",

  // Σταυρόλεξο
  editor_extra_clue: "Επιπλέον συμβουλή",

  // FindTheWords
  editor_word_list: "Λίστα λέξεων",

  // SingleChoiceSet
  editor_answers: "Πιθανές απαντήσεις",

  // MarkTheWords
  editor_text_with_marks: "Κείμενο με λέξεις προς επισήμανση",
  editor_mark_words_hint: "Περιβάλετε τις λέξεις προς επισήμανση με *αστερίσκους*",

  // SortParagraphs
  editor_section_paragraphs: "Παράγραφοι",
  editor_paragraph: "Παράγραφος",
  editor_add_paragraph: "Προσθήκη παραγράφου",
  editor_paragraph_text: "Κείμενο παραγράφου",

  // Summary
  editor_section_summaries: "Περιλήψεις",
  editor_summary_item: "Στοιχείο περίληψης",
  editor_add_summary_item: "Προσθήκη στοιχείου",
  editor_statement: "Δήλωση",
  editor_add_statement: "Προσθήκη δήλωσης",
  editor_statement_text: "Κείμενο δήλωσης",

  // Moodle Test
  editor_question_type: "Τύπος ερώτησης",

  // Moodle Page
  editor_section_blocks: "Πλαίσια",
  editor_block: "Πλαίσιο",
  editor_add_block: "Προσθήκη πλαισίου",
  editor_block_type: "Τύπος πλαισίου",
  editor_block_content: "Περιεχόμενο πλαισίου",

  // Ειδικές δραστηριότητες Éléa
  // Γλωσσάριο
  editor_glossary_name: "Όνομα γλωσσαρίου",

  // Εκατομμυριούχος
  editor_good_answer: "Σωστή απάντηση",
  editor_bad_answers: "Λανθασμένες απαντήσεις",
  editor_bad_answer: "Λανθασμένη απάντηση",
  editor_add_bad_answer: "Προσθήκη λανθασμένης απάντησης",

  // Τεστ (Τράπεζα ερωτήσεων)
  editor_bank_name: "Όνομα τράπεζας",
  editor_bank_description: "Περιγραφή τράπεζας",
  editor_question_name: "Όνομα ερώτησης",
  editor_question_feedback: "Γενική ανατροφοδότηση",
  editor_answer_fraction: "Πόντοι/Βαθμολογία",
  editor_answer_feedback: "Ανατροφοδότηση απάντησης",
  editor_subquestion: "Υποερώτηση",
  editor_add_subquestion: "Προσθήκη υποερώτησης",
  editor_numerical_value: "Αριθμητική τιμή",
  editor_numerical_tolerance: "Ανοχή",
  editor_section_subquestions: "Υποερωτήσεις",
  editor_section_content: "Περιεχόμενο",
  editor_feedback_if_true: "Ανατροφοδότηση εάν είναι σωστό",
  editor_feedback_if_false: "Ανατροφοδότηση εάν είναι λάθος",

  // Μηνύματα
  editor_save_success: "Οι αλλαγές αποθηκεύτηκαν",
  editor_save_error: "Σφάλμα κατά την αποθήκευση",
  editor_regenerating: "Αναδημιουργία αρχείου...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Σελίδα",
  doc_fmt_summary_header: "Πίνακας Περιεχομένων",
  doc_fmt_quiz_title: "Κουίζ",
  doc_fmt_instructions: "📝 Οδηγίες: Απαντήστε στις παρακάτω ερωτήσεις.",
  doc_fmt_question_header: "Ερώτηση",

  // --- Shared properties ---
  doc_fmt_type: "Τύπος:",
  doc_fmt_feedbacks: "💬 Σχόλια:",
  doc_fmt_global_feedbacks: "Γενικά Σχόλια",
  doc_fmt_answers: "Απαντήσεις:",
  doc_fmt_correct_answer_true: "Σωστή απάντηση: ΣΩΣΤΟ ✓",
  doc_fmt_correct_answer_false: "Σωστή απάντηση: ΛΑΘΟΣ ✓",
  doc_fmt_text_if_true: "Κείμενο αν είναι σωστό:",
  doc_fmt_text_if_false: "Κείμενο αν είναι λάθος:",
  doc_fmt_text_with_answers: "Κείμενο με τις απαντήσεις:",
  doc_fmt_text_with_marks: "Κείμενο με τις λέξεις προς επισήμανση:",
  doc_fmt_marks_to_find: "Λέξεις προς επισήμανση:",
  doc_fmt_keywords_expected: "Αναμενόμενες λέξεις-κλειδιά:",
  doc_fmt_accepted_answers: "Αποδεκτές απαντήσεις:",
  doc_fmt_text_to_complete: "Κείμενο προς συμπλήρωση:",
  doc_fmt_also_called: "🏷️ Ονομάζεται επίσης:",
  doc_fmt_image_not_found: "⚠️ [Η εικόνα δεν βρέθηκε]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Flashcards",
  doc_fmt_card_index: "Κάρτα",
  doc_fmt_card_front: "Εμπρός όψη:",
  doc_fmt_card_back: "Πίσω όψη:",
  doc_fmt_hint: "💡 Υπόδειξη:",
  doc_fmt_crossword_title: "Σταυρόλεξο",
  doc_fmt_definitions_and_answers: "Ορισμοί και απαντήσεις",
  doc_fmt_answer: "Απάντηση:",
  doc_fmt_extra_hint: "💡 Πρόσθετη υπόδειξη:",
  doc_fmt_timeline_events: "Γεγονότα",
  doc_fmt_timeline_periods: "Περίοδοι",
  doc_fmt_drag_the_words_title: "Σύρετε τις λέξεις",
  doc_fmt_fill_in_the_blanks_title: "Συμπλήρωση κενών",
  doc_fmt_mark_the_words_title: "Επισήμανση λέξεων",
  doc_fmt_glossary_title: "Γλωσσάριο",
  doc_fmt_term_index: "Όρος",
  doc_fmt_chart_title: "Διάγραμμα",
  doc_fmt_data: "Δεδομένα",
  doc_fmt_summary_title: "Περίληψη",
  doc_fmt_claim_index: "Δήλωση",
  doc_fmt_multiple_choice_title: "Ερώτηση πολλαπλής επιλογής",
  doc_fmt_single_choice_set_title: "Σύνολο ερωτήσεων απλής επιλογής",
  doc_fmt_true_false_title: "Ερώτηση Σωστού/Λάθους",
  doc_fmt_dialog_cards_title: "Κάρτες διαλόγου",
  doc_fmt_hint_front: "💡 Υπόδειξη (εμπρός):",
  doc_fmt_hint_back: "💡 Υπόδειξη (πίσω):",
  doc_fmt_sort_paragraphs_title: "Ταξινόμηση παραγράφων",
  doc_fmt_paragraphs_ordered: "Παράγραφοι στη σωστή σειρά",
  doc_fmt_find_the_words_title: "Κρυπτόλεξο",
  doc_fmt_words_to_find: "Λέξεις προς εύρεση",
  doc_fmt_matching_title: "Αντιστοίχιση",
  doc_fmt_matching_instructions: "📝 Οδηγίες: Αντιστοιχίστε κάθε στοιχείο με το αντίστοιχό του.",
  doc_fmt_pairs_to_match: "Ζεύγη προς αντιστοίχιση",
  doc_fmt_millionnaire_title: "Ποιος θέλει να γίνει εκατομμυριούχος;",
  doc_fmt_millionnaire_instructions: "📝 Οδηγίες: Βρείτε τη σωστή απάντηση ανάμεσα στις τέσσερις επιλογές.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Ερώτηση ελεύθερου κειμένου",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "Τεστ",
  doc_fmt_associations: "Αντιστοιχίσεις:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Πολλαπλής επιλογής (QCM)",
  doc_fmt_type_matching: "Αντιστοίχιση",
  doc_fmt_type_numerical: "Αριθμητικό",
  doc_fmt_type_truefalse: "Σωστό/Λάθος",
  doc_fmt_type_shortanswer: "Σύντομη απάντηση",
  doc_fmt_type_cloze: "Συμπλήρωση κενών (Cloze)",
  doc_fmt_type_blanks: "Συμπλήρωση κενών",
  doc_fmt_type_dragtext: "Σύρετε τις λέξεις",
  doc_fmt_type_markwords: "Επισήμανση λέξεων",
  doc_fmt_type_essay: "Ερώτηση ελεύθερου κειμένου",
  doc_fmt_type_default: "Ερώτηση",

  // Νέα κλειδιά για την παιδαγωγική δομή δήλωση/διόρθωση
  doc_fmt_correction_title: "Διόρθωση",
  doc_fmt_proposed_answers: "Προτάσεις:",
  doc_fmt_correct_answer: "Σωστή απάντηση",
  doc_fmt_correct_answers: "Σωστές απαντήσεις:",
  doc_fmt_true: "Σωστό",
  doc_fmt_false: "Λάθος",
  doc_fmt_words_to_place: "Λέξεις προς τοποθέτηση:",
  doc_fmt_completed_text: "Ολοκληρωμένο κείμενο:",
  doc_fmt_text_to_mark: "Κείμενο στο οποίο θα βρείτε τις λέξεις:",
  doc_fmt_words_count_to_find: "Αριθμός λέξεων προς εύρεση",
  doc_fmt_words_to_mark: "Λέξεις προς επισήμανση:",
  doc_fmt_answer_space: "Χώρος για απάντηση:",
  doc_fmt_open_answer: "Ανοιχτή απάντηση - αξιολόγηση σύμφωνα με τα κριτήρια που ορίζει ο δάσκαλος.",
  doc_fmt_definitions: "Ορισμοί",
  doc_fmt_letters: "γράμματα",
  doc_fmt_summary_instructions: "Για κάθε ομάδα, επιλέξτε τη σωστή δήλωση.",
  doc_fmt_sort_instructions: "Τοποθετήστε τις παρακάτω παραγράφους στη σωστή σειρά.",
  doc_fmt_paragraphs_to_sort: "Παράγραφοι προς ταξινόμηση",
  doc_fmt_correct_order: "Σωστή σειρά",
  doc_fmt_find_instructions: "Βρείτε",
  doc_fmt_hidden_words: "κρυμμένες λέξεις στο πλέγμα.",
  doc_fmt_hints: "Συμβουλές",
  doc_fmt_flashcards_instructions: "Για κάθε κάρτα, βρείτε την απάντηση που αντιστοιχεί στην ερώτηση.",
  doc_fmt_elements_to_match: "Στοιχεία προς αντιστοίχιση:",
  doc_fmt_possible_matches: "Πιθανές αντιστοιχίσεις:",
  doc_fmt_correct_associations: "Σωστοί συσχετισμοί:",

};