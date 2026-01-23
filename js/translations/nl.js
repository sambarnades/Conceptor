const translations_nl = {
  subtitle: "Ondersteunde creatie van bronnen en activiteiten voor Moodle en Éléa",
  help_modal_title: "🚀 Compleet Caramel-handboek voor docenten",
  help_modal_content: `
    <p>Welkom bij <strong>Caramel</strong>! Deze gids begeleidt je stap voor stap, ook als je net begint. Ons doel is om je te helpen interactieve leeractiviteiten eenvoudig en efficiënt te maken.</p>
    
    <div class="help-nav">
        <a href="#decrire" class="help-nav-link"><span class="help-step-number">1</span> Beschrijven</a>
        <a href="#choisir" class="help-nav-link"><span class="help-step-number">2</span> Kiezen</a>
        <a href="#generer" class="help-nav-link"><span class="help-step-number">3</span> Genereren</a>
        <a href="#integrer" class="help-nav-link"><span class="help-step-number">4</span> Bekijken & downloaden</a>
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
            Met deze krachtige optie kunt u de generatie baseren op door u verstrekte inhoud. U kunt <strong>tekst kopiëren en plakken</strong> of <strong>een document uploaden (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)</strong>.
            <br><strong><i class="fas fa-lock"></i> Privacy:</strong> Maak u geen zorgen, de verwerking van uw document vindt <strong>volledig lokaal op uw computer</strong> plaats. Er worden geen gegevens naar het internet verzonden.</p>
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
            <h5><i class="fas fa-rocket"></i> Optie A: Eenvoudige Weergave - In één klik genereren</h5>
            <p>De snelle route. Klik op <button class="help-btn-example-llm">In één klik genereren</button> zodat de AI de inhoud maakt en direct rechts in het resultaatgebied plaatst. Via het pijltje rechts op de knop kies je verschillende AI-modellen (snel, krachtig...).</p>
        </div>
        <div class="help-subsection">
            <h5><i class="fas fa-tools"></i> Optie B: Begeleide Weergave - Externe AI gebruiken</h5>
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
        <h4><span class="help-step-number">4</span> Bekijken en downloaden</h4>
        <p>Zodra de inhoud is gegenereerd, kunt u deze bekijken, testen en downloaden in verschillende formaten.</p>

        <details class="help-subsection-details">
            <summary><i class="fas fa-eye"></i> Bekijken en testen</summary>
            <p>Neem de tijd om uw activiteit te controleren in het weergavevenster:</p>
            <ul>
                <li><strong>Scroll</strong> door de inhoud om alles te controleren.</li>
                <li><strong>Test</strong> de activiteit als een leerling (klik, sleep, typ...).</li>
                <li>Voor <strong>Éléa/Magistère/Moodle</strong> inhoud laat een simulator u de werkelijke weergave zien.</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_visualisation.PNG" alt="Weergavevenster" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Test de activiteit rechtstreeks in de simulator.</em></figcaption>
            </figure>
        </details>

        <details class="help-subsection-details">
            <summary><i class="fas fa-download"></i> Downloaden (Formaten & Exports)</summary>
            <p>U heeft verschillende opties om uw werk op te halen:</p>
            <ul>
                <li><strong>Interactief formaat (hoofdknop):</strong> Om het digitale bestand (bijv. .h5p, .mbz) op te halen voor uw platform.</li>
                <li><strong>Andere formaten (dropdownmenu):</strong> Klik op de pijl om te downloaden in <strong>PDF, DOCX of ODT</strong> (handig voor printen of archiveren).</li>
            </ul>
            <figure class="help-figure" style="text-align:center; margin: 1rem 0;">
                <img src="images/wiki/modale_menu_export.PNG" alt="Exportmenu" style="max-width:90%; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <figcaption><em>Open het menu voor PDF, DOCX exports...</em></figcaption>
            </figure>
        </details>

        <h5><i class="fas fa-file-import"></i> Integreren in Éléa/Magistère</h5>
        <p>Zodra het bestand is gedownload, leest u hier hoe u het aan uw cursus toevoegt:</p>
        
        <div class="import-guide">
            <details class="import-details" open>
                <summary><span class="help-badge-file">.h5p</span> (H5P-activiteiten)</summary>
                <div class="import-content">
                    <ul>
                        <li>
                            <strong>Eenvoudige methode:</strong> Schakel bewerken in voor je cursus en sleep het .h5p-bestand rechtstreeks naar de gewenste sectie. Kies vervolgens "Ajouter une activité H5P" en rond af met de knop "DÉPOSER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-ajouter-h5p.webp" alt="Snel een H5P-activiteit toevoegen" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Voeg de H5P-activiteit toe en klik op DÉPOSER.</em></figcaption>
                            </figure>
                        </li>
                        <li><strong>Aanbevolen methode (voor ontwerpers):</strong> Klik op "Activiteit of bron toevoegen", kies "Interactieve inhoud (H5P)" en selecteer in het veld "Editor" het tabblad "Téléverser" om verder te gaan met "Téléverser un fichier". Rond af met "Utiliser", vul de nodige elementen in en sla op. Zo wordt de activiteit zeker meegenomen wanneer je de cursus deelt.</li>
                    </ul>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.mbz</span> (Pagina, Miljonair, Koppelen, MC)</summary>
                <div class="import-content">
                    <p>Dit formaat importeert een complete activiteit in je cursus.</p>
                    <ol>
                        <li>
                            <p>Open het bewerkingsmenu helemaal rechts op het scherm. Als het is ingeklapt, gebruik dan het kleine pijltje om het zichtbaar te maken.</p>
                            <div class="import-step-images" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;">
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-1.webp" alt="Bewerkingsmenu geopend in de rechterkolom" style="width:75%;height:auto;">
                                    <figcaption><em>Bewerkingsmenu geopend.</em></figcaption>
                                </figure>
                                <figure class="import-step-figure" style="flex:1 1 240px;margin:0;text-align:center;">
                                    <img src="images/tutoriels/elea-import-parcours-2.webp" alt="Pijl om het bewerkingspaneel uit te klappen" style="width:75%;height:auto;">
                                    <figcaption><em>Klap het paneel uit indien nodig.</em></figcaption>
                                </figure>
                            </div>
                        </li>
                        <li>
                            <p>Klik op "IMPORT/EXPORT" en vervolgens op "Importer un parcours" in het submenu.</p>
                            <figure class="import-step-figure" style="text-align:center;">
                                <img src="images/tutoriels/elea-import-parcours-3.webp" alt="IMPORT/EXPORT-knop in Moodle/Éléa" style="max-width:360px;width:75%;height:auto;">
                                <figcaption><em>Kies Importer un parcours.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            Sleep je .mbz-bestand naar het importgebied en klik op "IMPORTER".
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-import-parcours-4.webp" alt="Zone om het MBZ-bestand neer te zetten" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Zet het bestand neer en bevestig met IMPORTER.</em></figcaption>
                            </figure>
                        </li>
                        <li>Rond af door bij de laatste stap op "CONTINUER" te klikken: de activiteit staat nu in je cursus.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> (Woordenlijst-activiteit)</summary>
                <div class="import-content">
                    <p>Dit formaat stelt je in staat om een lijst met definities te importeren in een Éléa/Moodle-woordenlijst.</p>
                    <ol>
                        <li>
                            <p>Maak een lege Woordenlijst-activiteit in je cursus en open deze.</p>
                        </li>
                        <li>
                            <p>Eenmaal in de Woordenlijst, klik op de knop "IMPORTER DES ARTICLES".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-1.webp" alt="IMPORTER DES ARTICLES knop in de woordenlijst" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Klik op IMPORTER DES ARTICLES.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Sleep je .xml-bestand naar het importgebied en klik op de knop "ENVOYER".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-2.webp" alt="Neerzetgebied voor het XML-bestand van de woordenlijst" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Plaats het bestand en valideer met ENVOYER.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Je items zijn gedetecteerd. Rond af door op de knop "CONTINUER" te klikken.</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-glossaire-import-3.webp" alt="Bevestiging van gedetecteerde items" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Klik op CONTINUER om de import te voltooien.</em></figcaption>
                            </figure>
                        </li>
                        <li>De import is voltooid. Je definities zijn nu beschikbaar in de Woordenlijst.</li>
                    </ol>
                </div>
            </details>
            <details class="import-details">
                <summary><span class="help-badge-file">.xml</span> en <span class="help-badge-file">.GIFT</span> (Toetsactiviteit)</summary>
                <div class="import-content">
                    <p>Deze formaten importeren vragen in de "Vragenbank".</p>
                    <ol>
                        <li>
                            <p>Ga in je Éléa-cursus naar het tabblad "Meer" en klik op "Vragenbank".</p>
                        </li>
                        <li>
                            <p>In het vervolgkeuzemenu waar "Vragen" wordt weergegeven, selecteer "Importeren".</p>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-1.webp" alt="Selectie van de knop Importeren in de vragenbank" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Selecteer Importeren in het vervolgkeuzemenu.</em></figcaption>
                            </figure>
                        </li>
                        <li>
                            <p>Selecteer het formaat dat overeenkomt met je bestand:</p>
                            <ul>
                                <li><strong>Moodle XML-formaat</strong> (aanbevolen): volledig formaat dat alle vraagtypen ondersteunt.</li>
                                <li><strong>GIFT-formaat</strong>: eenvoudiger alternatief maar beperkt in vraagtypen.</li>
                            </ul>
                            <figure class="import-step-figure" style="text-align:center;margin-top:0.5rem;">
                                <img src="images/tutoriels/elea-importation-banquequestions-2.webp" alt="Keuze tussen Moodle XML-formaat en GIFT-formaat" style="max-width:460px;width:75%;height:auto;">
                                <figcaption><em>Selecteer het passende formaat voor je bestand.</em></figcaption>
                            </figure>
                        </li>
                        <li>Sleep je bestand naar het uploadgebied en laat het los.</li>
                        <li>Klik op de knop "IMPORTATION". Het scherm toont vervolgens de toegevoegde vragen (bijvoorbeeld: 10 vragen zijn toegevoegd).</li>
                        <li>Voltooi door onderaan de pagina op "CONTINUER" te klikken.</li>
                        <li>De vragen zijn nu klaar om te worden toegevoegd aan een Toetsactiviteit. Raadpleeg de <a href="https://moodle-doc.forge.apps.education.fr/elea/docs/Tutoriels/Concevoir_un_parcours/Ajouter_des_activites/Le_test/banque" target="_blank" rel="noopener noreferrer">Éléa-tutorial</a> om een Toetsactiviteit te maken en vragen uit de bank te laden.</li>
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
                        <li>Klik in de pagina-editor op het pictogram om naar HTML-modus te schakelen (vaak weergegeven als "&lt;&gt;").</li>
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

  // ============================================================================
  // HOOFDINTERFACE
  // ============================================================================
  language: "Taal",
  tutorial: "Handleiding",
  notifications: "Meldingen",
  fast_mode: "Snelmodus",
  guided_mode: "Geavanceerde modus",
  who_are_you: "Wie bent u? (bijv. Leraar, trainer...)",
  what_to_address: "Wat wilt u behandelen? (bijv. De Franse Revolutie...)",
  level: "Niveau (bijv. Middelbaar onderwijs)",
  number_of_elements: "Aantal vragen/elementen in de module (bijv. 5)",

  // ============================================================================
  // DOCUMENTEN (RAG/OCR)
  // ============================================================================
  rag_title: "Documenten bijvoegen (optioneel)",
  rag_note: "Als u wilt dat de AI uitsluitend op basis van uw documenten werkt, plak dan hier uw tekst of sleep uw bestanden hierheen. Laat dit veld anders leeg zodat de AI zelf informatie kan zoeken.",
  error_duplicate_file: "Dit bestand is al toegevoegd.",
  error_unsupported_format: "Formaat niet ondersteund. Toegestane formaten: ",
  ocr_scanned_page: "Gescande pagina gedetecteerd, OCR wordt uitgevoerd",
  ocr_image_processing: "Beeldherkenning (OCR) in uitvoering",
  ocr_initializing: "OCR initialiseren...",
  ocr_loading_language: "Taalmodel laden...",
  ocr_preparing: "Analyse voorbereiden...",
  docx_processing: "DOCX-tekst extraheren...",
  pptx_processing: "PPTX-tekst extraheren...",
  odt_processing: "ODT-tekst extraheren...",
  odp_processing: "ODP-tekst extraheren...",
  file_loading: "Bestand laden...",
  extraction_success: "Document succesvol verwerkt.",
  extraction_error: "Er is een fout opgetreden tijdens de verwerking.",
  error_fullscreen: "Volledig scherm mislukt:",
  lock_text: "Vergrendelen",
  unlock_text: "Ontgrendelen",
  drag_drop_text: "Sleep een document hierheen (PDF, DOCX, PPTX, ODT, ODP, PNG, JPEG)",
  or_text: "of",
  upload_pdf_btn: "Kies een bestand",
  paste_your_text_here: "Plak hier uw tekst...",
  rag_tags_tuto: "Hieronder vindt u de geüploade documenten. Klik op de gekleurde cirkel om de markering van elk document aanなte passen.",

  // ============================================================================
  // TABBLADEN
  // ============================================================================
  tab_all: "Alles",
  tab_quiz: "Quiz & Tests",
  tab_text: "Tekstmanipulatie",
  tab_memory: "Memoriseren & Ontdekken",
  tab_elea: "Éléa",
  tab_h5p: "H5P",
  tab_moodle: "Magistère",

  // ============================================================================
  // H5P-ACTIVITEITEN - DETAILS
  // ============================================================================
  h5p_timeline_name: "Tijdlijn",
  h5p_timeline_description: "Maak een interactieve tijdlijn om een reeks gebeurtenissen te presenteren.",
  h5p_flashcards_name: "Flitskaarten",
  h5p_flashcards_description: "Maak dubbelzijdige kaarten om termen en definities te onthouden.",
  h5p_quiz_set_name: "Gemengde quiz",
  h5p_quiz_set_description: "Stel een reeks verschillende vragen samen (meerkeuze, slepen, enz.) om kennis te toetsen.",
  h5p_quiz_set_qcm_name: "Meerkeuze quiz",
  h5p_quiz_set_qcm_description: "Maak een quiz die uitsluitend bestaat uit meerkeuzevragen.",
  h5p_quiz_set_vf_name: "Waar/Onwaar-quiz",
  h5p_quiz_set_vf_description: "Maak een quiz die uitsluitend bestaat uit waar- of onwaar-vragen.",
  h5p_glossary_name: "Woordenlijst",
  h5p_glossary_description: "Maak een woordenlijst of FAQ in de vorm van een uitklapbaar menu.",
  h5p_crossword_name: "Kruiswoordraadsel",
  h5p_crossword_description: "Genereer een kruiswoordpuzzel op basis van een lijst met woorden en definities.",
  h5p_essay_name: "Opstel",
  h5p_essay_description: "Stel een onderwerp voor en definieer trefwoorden voor automatische correctie.",
  h5p_summary_name: "Samenvatting",
  h5p_summary_description: "Leerlingen moeten een samenvatting maken door de juiste zinnen te kiezen.",
  h5p_drag_the_words_name: "Woorden slepen",
  h5p_drag_the_words_description: "Maak een tekst met gaten waar leerlingen de ontbrekende woorden naartoe moeten slepen.",
  h5p_fill_in_the_blanks_name: "Gatentekst",
  h5p_fill_in_the_blanks_description: "Leerlingen moeten de ontbrekende woorden rechtstreeks via het toetsenbord invullen.",
  h5p_mark_the_words_name: "Woorden markeren",
  h5p_mark_the_words_description: "Vraag leerlingen om bepaalde woorden in een alinea te markeren.",
  h5p_true_false_name: "Waar/Onwaar",
  h5p_true_false_description: "Maak één <strong style='color: red;'>enkele</strong> eenvoudige vraag met een binair antwoord: waar of onwaar.",
  h5p_multiple_choice_name: "Meerkeuze",
  h5p_multiple_choice_description: "Maak één <strong style='color: red;'>enkele</strong> meerkeuzevraag met één of meer goede antwoorden.",
  h5p_find_the_words_name: "Woordzoeker",
  h5p_find_the_words_description: "Maak een rooster van letters waarin leerlingen woorden moeten vinden.",
  h5p_sort_the_paragraphs_name: "Paragrafen ordenen",
  h5p_sort_the_paragraphs_description: "Maak een set paragrafen die leerlingen in de juiste volgorde moeten zetten.",
  h5p_single_choice_set_name: "Reeks enkelvoudige keuzes",
  h5p_single_choice_set_description: "Maak een reeks vragen waarbij elke vraag slechts één goed antwoord heeft.",
  h5p_dialog_cards_name: "Dialoogkaarten",
  h5p_dialog_cards_description: "Maak interactieve dubbelzijdige kaarten met tekst en optioneel afbeeldingen.",
  h5p_complex_fill_the_blanks_name: "Complexe gatentekst",
  h5p_complex_fill_the_blanks_description: "Maak een geavanceerde gatentekst met specifieke feedback voor elke fout.",
  h5p_chart_name: "Diagram",
  h5p_chart_description: "Maak een cirkel- of staafdiagram om gegevens te visualiseren.",

  // ============================================================================
  // ÉLÉA/MOODLE-ACTIVITEITEN - DETAILS
  // ============================================================================
  moodle_xml_name: "Test",
  moodle_xml_description: "Genereer een vragenbank die direct in een 'Test'-activiteit kan worden geïmporteerd (XML- of GIFT-formaat).",
  moodle_xml_help: "Om een XML-bestand toe te voegen aan een 'Test' in Moodle, maakt u eerst de activiteit aan. Open vervolgens het menu <strong>Meer</strong> en ga naar <strong>Vragenbank</strong>. Klik op <strong>Importeren</strong>, kies <strong>Moodle XML</strong>, selecteer uw bestand en bevestig.",
  moodle_gift_name: "GIFT-formaat",
  moodle_gift_description: "Maak vragen in het GIFT-formaat, een eenvoudige manier om vragen in Moodle te importeren.",
  moodle_millionnaire_name: "Millionnaire",
  moodle_millionnaire_description: "Genereer een 'Millionnaire'-activiteit met 6 vragen die in moeilijkheidsgraad oplopen.",
  moodle_appariement_name: "Koppelen",
  moodle_appariement_description: "Genereer een koppelactiviteit met 10 vragen.",
  moodle_qcm_name: "Meerkeuze (QCM)",
  moodle_qcm_description: "Genereer een eenvoudige meerkeuze-activiteit.",
  moodle_glossaire_xml_name: "Woordenlijst (XML)",
  moodle_glossaire_xml_description: "Genereer een woordenlijst klaar voor import in XML-formaat.",
  glossaire_success_generation: "Bestand {fileName} succesvol gegenereerd!",
  glossaire_error_creation: "Fout bij het maken van de XML van de woordenlijst:",
  glossaire_error_invalid_json: "De JSON moet een naam ('name') en een reeks items ('entries') bevatten.",
  elea_page_name: "Pagina",
  elea_page_description: "Maak een visueel opgemaakte Éléa-inhoudspagina.",

  // ============================================================================
  // GENERATIE-MODAL
  // ============================================================================
  get_prompt_step: "1/2 Prompt kopiëren",
  create_file_step: "2/2 Bestand maken van JSON",
  generate_one_click: "Genereren in één klik",
  simple_mode: "Eenvoudig",
  advanced_mode: "Begeleid",
  prompt_for_ia: "Prompt voor de AI",
  copy_prompt: "Prompt kopiëren",
  fullscreen_prompt: "Volledig scherm",
  exit_fullscreen_prompt: "Volledig scherm verlaten",
  lock_prompt: "Vergrendelen",
  unlock_prompt: "Ontgrendelen",
  go_duck: "Kopiëren en naar Duck.ai gaan",
  go_mistral: "Kopiëren en naar Le chat gaan",
  create_h5p_file: "H5P-bestand maken",
  integrate_h5p_libraries: "H5P-bibliotheken integreren:",
  paste_ia_result: "Plak het resultaat van de AI hieronder om uw module te maken.",
  generate_h5p: "H5P genereren",
  create_xml_file: "XML-bestand maken",
  paste_ia_result_xml: "Plak de door de AI gegenereerde XML hieronder.",
  generate_xml_file: "XML-bestand genereren",
  export_mbz: "MBZ-formaat",
  export_gift: "GIFT-formaat",
  export_xml: "XML-formaat",
  export_html: "HTML-formaat",
  export_docx: "DOCX-formaat",
  export_odt: "ODT-formaat",
  export_pdf: "PDF-formaat",
  export_error: "Exportfout",
  create_mbz_file_appariement: "Koppelbestand maken (.mbz)",
  paste_ia_result_appariement: "Plak de door de AI gegenereerde JSON hieronder. De titel wordt automatisch overgenomen.",
  generate_mbz_appariement: "Koppelactiviteit genereren (mbz)",
  create_mbz_file_millionnaire: "Millionnaire-bestand maken (.mbz)",
  paste_ia_result_millionnaire: "Plak de door de AI gegenereerde JSON hieronder. De titel wordt automatisch overgenomen.",
  generate_mbz_millionnaire: "Millionnaire-activiteit genereren (mbz)",
  generate_mbz_test: "Test-activiteit genereren (mbz)",
  create_mbz_file_qcm: "Meerkeuzebestand maken (.mbz)",
  paste_ia_result_qcm: "Plak de door de AI gegenereerde JSON hieronder. De titel wordt automatisch overgenomen.",
  generate_mbz_qcm: "Meerkeuze-activiteit genereren (mbz)",
  create_mbz_file_page: "Paginabestand maken (.mbz)",
  paste_ia_result_page: "Plak de door de AI gegenereerde JSON hieronder om de pagina te bouwen.",
  generate_mbz_page: "Pagina-activiteit genereren (mbz)",
  generate_prompts_placeholder: "De prompt voor de AI verschijnt hier zodra u ten minste één veld hebt ingevuld.",
  paste_json_or_text: "Plak hier de JSON-inhoud of de tekst van de AI om uw activiteit te maken.",
  info_prompt_copy: "Plak deze prompt niet in het rechterpaneel. Kopieer het naar een openbare AI, en plak het resultaat daarvan vervolgens in het rechterpaneel.",
  generate_with_llm: "Genereren met Caramel AI",
  generation_in_progress: "Genereren bezig, even geduld...",
  request_sent_to_ia: "Verzoek verzonden naar AI, even geduld...",
  generation_successful: "H5P-inhoud succesvol gegenereerd!",
  generation_failed_empty: "Genereren mislukt. Het antwoord was leeg.",
  generation_failed_error: "Fout bij genereren: {errorMessage}",
  generation_failed_llm: "Genereren via Caramel AI mislukt. Oorzaak: {errorMessage}",
  llm_small_summary: "Caramel mou: snel, licht, perfect voor korte oefeningen. Laag verbruik.",
  llm_large_summary: "Caramel coulant: rijker, meer nuance, ideaal voor diepgaandere taken. Gemiddeld verbruik.",
  llm_xl_summary: "Caramel dur: krachtig en complex, voor ambitieuze projecten. Geduld vereist, gegarandeerd resultaat. Hoog verbruik.",
  llm_model_source: "Modelleverancier:",
  llm_model_parameters: "Grootte model:",
  llm_model_parameters_unit: "mrd parameters",

  // ============================================================================
  // CARAMEL-ANIMATIE
  // ============================================================================
  caramel_animation_step_1: "We doen de suiker in de pan...",
  caramel_animation_step_2: "We voegen een beetje water toe...",
  caramel_animation_step_3: "We verhitten op middelhoog vuur...",
  caramel_animation_step_4: "De suiker begint te smelten...",
  caramel_animation_step_5: "Het begint te kleuren...",
  caramel_animation_step_6: "We roeren voorzichtig...",
  caramel_animation_step_7: "De karamel krijgt een mooie amberkleur...",
  caramel_animation_step_8: "We voegen de warme room toe...",
  caramel_animation_step_9: "Pas op voor spatten!",
  caramel_animation_step_10: "We mengen goed...",
  caramel_animation_step_11: "Het is bijna klaar!",
  caramel_success_title: "Je snoepje is klaar!",

  // ============================================================================
  // MELDINGEN EN FOUTEN
  // ============================================================================
  prompts_generated_successfully: "Prompts succesvol gegenereerd!",
  success_copy: "✓ Gekopieerd!",
  error_please_fill_fields: "Vul a.u.b. ten minste één veld in van de Snelle modus.",
  error_please_fill_guided_fields: "Vul a.u.b. ten minste één veld in van de Geavanceerde modus.",
  error_field_empty: "Het veld is leeg. Genereer eerst een prompt.",
  error_copy_failed: "Kopiëren mislukt.",
  error_h5p_module_not_found: "Module '{moduleKey}' niet gevonden.",
  error_invalid_quiz_json: "De JSON voor de Quiz is ongeldig: {errorMessage}",
  error_invalid_json: "De verstrekte JSON is ongeldig. Fout: {errorMessage}",
  error_h5p_creation: "Fout bij het maken van H5P: {errorMessage}",
  error_paste_ia_content: "Plak a.u.b. de door de AI gegenereerde inhoud.",
  error_compression_module_not_ready: "De compressiemodule is nog niet klaar. Probeer het over een ogenblik opnieuw.",
  h5p_file_generated_successfully: "Bestand {fileName} succesvol gegenereerd!",
  h5p_creation_failed: "Maken van H5P-bestand mislukt: {errorMessage}",
  error_paste_json_content: "Plak a.u.b. de gegenereerde JSON-inhoud.",
  error_paste_xml_content: "Plak a.u.b. de gegenereerde XML-inhoud.",
  moodle_xml_success_generation: "Bestand {fileName} succesvol gegenereerd!",
  test_error_creation_mbz: "Fout bij het maken van de MBZ voor de Test:",
  test_success_generation: "Bestand {fileName} succesvol gegenereerd!",
  test_error_generic: "Fout:",
  test_backup_log: "Back-up automatisch gemaakt door Caramel\n",
  millionnaire_error_compression_libs: "De compressiebibliotheken (Tar.js of fflate) zijn niet geladen. Controleer je internetverbinding of ververs de pagina.",
  millionnaire_error_invalid_json: "De JSON-structuur is ongeldig. Zorg ervoor dat deze een 'title' bevat en een tabel 'questions' met 6 vragen die voldoen aan het voorbeeld.",
  millionnaire_activity_intro: "Neem deel aan dit spel om je kennis te testen.",
  millionnaire_backup_log: "Back-up automatisch gemaakt door Caramel\n",
  millionnaire_success_generation: "Bestand {fileName} succesvol gegenereerd!",
  millionnaire_error_creation_mbz: "Fout bij het maken van de MBZ:",
  millionnaire_error_generic: "Fout:",
  appariement_error_invalid_json: "De JSON-structuur is ongeldig. Zorg ervoor dat deze een 'title' bevat en een tabel 'pairs' waarbij elk paar een 'question' and een 'answer' heeft.",
  appariement_activity_intro: "Vind de bijbehorende paren.",
  appariement_success_generation: "Bestand {fileName} succesvol gegenereerd!",
  appariement_error_creation_mbz: "Fout bij het maken van de MBZ voor het koppelen:",
  qcm_error_invalid_json: "De JSON-structuur is ongeldig. Zorg ervoor dat deze een 'title' bevat en een tabel 'questions' met ten minste één vraag en antwoorden.",
  qcm_activity_intro: "Beantwoord de volgende vragen.",
  qcm_success_generation: "Bestand {fileName} succesvol gegenereerd!",
  qcm_error_creation_mbz: "Fout bij het maken van de MBZ voor de QCM:",
  version_modal_title: "Nieuwe versie beschikbaar",
  version_modal_message: "Je gebruikt momenteel versie {currentVersion}. Er is een nieuwere versie ({latestVersion}) beschikbaar. Herlaad de pagina om te profiteren van de laatste verbeteringen.",
  version_modal_update: "Nieuwe versie laden",
  version_modal_remind_later: "Herinner me er later aan",

  prompt_header_pedagogical_context: "PEDAGOGISCHE CONTEXT",
  prompt_header_specific_rules: "SPECIFIEKE REGELS",
  prompt_header_pedagogical_rules: "PEDAGOGISCHE REGELS",
  prompt_header_sources: "BRONNEN",
  prompt_header_json_structure: "VERWACHTE JSON-STRUCTUUR",
  prompt_header_rendering_example: "RENDERING VOORBEELD",
  prompt_fallback_teacher: "een leraar",
  prompt_fallback_activity: "een pedagogische activiteit maken",

  // ============================================================================

  // Gemeenschappelijke sleutels
  CONTEXTE_PEDAGOGIQUE_COMMUN: `- Je rol: [QUI]. Expert in didactiek en onderwijskunde
- Je pedagogische doel: [QUOI]
- Je publiek: [NIVEAU]`,

  REGLES_PEDAGOGIQUES_COMMUNES: `- Aanpassing en woordenschat: Pas de toon, de woordenschat en de moeilijkheidsgraad van de instructies aan het aangegeven publiek aan. Wees relevant en boeiend.
- Toon en feedback: De instructies en opmerkingen moeten constructief en bemoedigend zijn, en gericht op het leerproces.
- Naleving: Pas de inhoud VERPLICHT aan de geldende officiële referenties aan. Tenzij expliciet anders vermeld, ga je standaard uit van de Franse schoolprogramma's (Eduscol) voor het schoolpubliek, en van de wettelijke teksten van de beroepsopleiding voor volwassenen.
- Taal: De inhoud en de instructies moeten in het Nederlands worden geschreven.`,

  SOURCES_COMMUNES: `- Je gebruikt UITSLUITEND de volgende teksten om je activiteit te genereren.
---
[RAG]
---`,

  // ============================================================================
  // === TIMELINE (Frise chronologique) ===
  // ============================================================================
  TIMELINE_REGLES_SPECIFIQUES: `- Aantal gebeurtenissen: Minimaal 5 gebeurtenissen || [NOMBRE_ELEMENTS] gebeurtenissen.
- Periodes (era): Minimaal 2 periodes die groepen gebeurtenissen dekken.
- Media: Voeg indien mogelijk bronvermeldingen en bijschriften toe voor elk item. Zoek actief naar een relevante en rechtenvrije afbeelding (bijv. Wikimedia Commons).`,

  TIMELINE_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- **Hoofdobject:** Bevat de sleutel \`timeline\` (object).
- **Inhoud van \`timeline\`:** Hoofdstructuur van de activiteit.
  - \`headline\`: Algemene titel van de tijdlijn (verplichte platte tekst).
  - \`text\`: Boeiende inleiding (Markdown ondersteund).
  - \`asset\`: Coversmedia (\`media\`: directe URL, \`caption\`: bijschrift, \`credit\`: bron).
  - \`date\`: Tabel met chronologische gebeurtenissen.
  - \`era\`: Tabel met achtergrondperiodes (definiëren gekleurde vlakken in de achtergrond).
- **Structuur van de objecten \`date\` en \`era\`:**
  - \`startDate\`: **Strikte indeling** \`YYYY,MM,DD\` of \`YYYY\`. (Verplicht)
  - \`endDate\`: **Strikte indeling** \`YYYY,MM,DD\` of \`YYYY\`. (Optioneel, definieert een duur/einde van een periode)
  - \`headline\`: Expliciete titel van het element (verplichte platte tekst).
  - \`text\`: Pedagogisch verhaal. Gebruik \`**woord**\` voor vetgedrukt, \`*woord*\` voor cursief en \`\\n\` voor regeleinden.
  - \`asset\`: (Optioneel) Media-object (\`media\`: directe URL Wikimedia Commons, \`caption\`, \`credit\`).
  - \`tag\`: Kort trefwoord (bijv. 'Politiek', 'Wetenschap') waarmee gefilterd kan worden.
- **LaTeX:** Gebruik de dubbele escape: \`\\\\( (2^3)^2 \\\\)\`.`,

  TIMELINE_EXEMPLE_RENDU: `\`\`\`json
{
  "timeline": {
    "headline": "De geschiedenis van de ruimtevaart",
    "text": "Ontdek de grote stappen die het avontuur van de mens in de **ruimte** hebben gekenmerkt.",
    "asset": {
      "media": "https://upload.wikimedia.org/wikipedia/commons/a/ac/Apollo_11_launch.jpg",
      "caption": "Lancering van de Apollo 11-missie.",
      "credit": "NASA / Wikimedia Commons"
    },
    "date": [
      {
        "startDate": "1957,10,04",
        "headline": "Lancering van Spoetnik 1",
        "text": "De **eerste kunstmatige satelliet** wordt door de USSR in een baan om de aarde gebracht.",
        "tag": "Robotica"
      },
      {
        "startDate": "1969,07,20",
        "headline": "Eerste stap op de maan",
        "text": "Neil Armstrong wordt de eerste mens die op de maan loopt tijdens de **Apollo 11**-missie.",
        "tag": "Mens"
      }
    ],
    "era": [
      {
        "startDate": "1957",
        "endDate": "1975",
        "headline": "De Koude Oorlog in de ruimte",
        "text": "Periode van intense rivaliteit tussen de Verenigde Staten en de USSR.",
        "tag": "Context"
      }
    ]
  }
}
\`\`\``,

  // ============================================================================
  // === CROSSWORD (Mots croisés) ===
  // ============================================================================
  CROSSWORD_REGLES_SPECIFIQUES: `- Aantal woorden: Minimaal 6 woorden || [NOMBRE_ELEMENTS] woorden.
- Typografische regels: De antwoorden (\`answer\`) mogen alleen letters bevatten. Elk samengesteld woord, acroniem of uitdrukking moet worden samengevoegd tot één enkel woord zonder spaties, streepjes of andere tekens (bijv. 'arc-en-ciel' wordt 'arcenciel').
- Hints (\`clue\`): Het is verboden om het te vinden woord in de hint te schrijven. Ze moeten kort en nauwkeurig zijn.
- Extra hint (\`extraClue\`): De AI moet de relevantie van het toevoegen van een extra hint beoordelen.`,

  CROSSWORD_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`title\`: Een titel voor de activiteit.
- \`words\`: Een tabel met objecten die het volgende bevatten:
  - \`answer\`: Het te raden woord (samengevoegd zonder spaties of streepjes).
  - \`clue\`: De korte en nauwkeurige definitie.
  - \`extraClue\` (optioneel): Een object \`{"params": {"text": "..."}}\`. De tekst kan \`**woord**\` gebruiken voor vetgedrukt, \`*woord*\` voor cursief en \`\\n\` voor regeleinden.
- \`taskDescription\`: Een duidelijke en gecontextualiseerde instructie. Gebruik \`**woord**\` voor vetgedrukt, \`*woord*\` voor cursief en \`\\n\` voor regeleinden. Vermeld na een regeleinde: "Gebruik voor samengestelde woorden geen spaties of streepjes."
- \`overallFeedback\`: (STRIKTE REGEL) Je moet verplicht een tabel van 6 objecten genereren voor de eindfeedback, gecontextualiseerd aan het thema van de oefening, met strikte inachtneming van de volgende scorebereiken: 0-10, 11-30, 31-50, 51-70, 71-90 en 91-100.`,

  CROSSWORD_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Kruiswoordraadsel over Biologie",
  "words": [
    {"answer": "Cel", "clue": "Basiseenheid van het leven.", "extraClue": {"params": {"text": "Het kan **dierlijk** of **plantaardig** zijn."}}},
    {"answer": "DNA", "clue": "Molecuul dat genetische informatie draagt."}
  ],
  "taskDescription": "**Vul** het rooster in met biologische termen.\\nGebruik voor samengestelde woorden geen spaties of streepjes.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Er zijn inspanningen nodig om deze begrippen van de biologie goed te begrijpen."},
    {"from": 11, "to": 30, "feedback": "Je bent er bijna, ga door met je inspanningen om je kennis te consolideren."},
    {"from": 31, "to": 50, "feedback": "Het is een goed begin, maar sommige punten moeten nog worden verduidelijkt."},
    {"from": 51, "to": 70, "feedback": "Goed gedaan! Je hebt de essentie van het onderwerp begrepen."},
    {"from": 71, "to": 90, "feedback": "Zeer goede score! Je beheerst de behandelde concepten goed."},
    {"from": 91, "to": 100, "feedback": "Uitstekend! Je hebt een perfecte beheersing van deze les."}
  ]
}
\`\`\``,

  // ============================================================================
  // === FLASHCARDS (Cartes mémoires) ===
  // ============================================================================
  FLASHCARDS_REGLES_SPECIFIQUES: `- Aantal kaarten: Minimaal 5 kaarten || [NOMBRE_ELEMENTS] kaarten.
- Koppeling: De voorzijde en de achterzijde moeten verbonden zijn door een uniek en stabiel criterium (bijv.: definitie -> term, gebeurtenis -> datum, auteur -> werk). Gebruik dezelfde relatie voor alle kaarten en formuleer de instructie als volgt: « Koppel elke X aan Y ».`,

  FLASHCARDS_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- Het object moet het volgende bevatten:
  - \`title\`: Een relevante titel voor de activiteit.
  - \`description\`: Een duidelijke instructie voor de leerling.
  - \`cards\`: Een tabel met objecten, waarbij elk object een kaart (flashcard) vertegenwoordigt en het volgende bevat:
    - \`text\`: De vraag of het te raden woord (voorzijde).
    - \`answer\`: Antwoord of definitie (achterzijde). Normalisatieregels: één enkelvoudig woord of een getal (geen samengestelde woorden), kleine letters (behalve eigennamen), zonder lidwoord of interpunctie, getallen in cijfers.
    - \`tip\` (optioneel): Hint om de leerling te helpen. Je kunt \`**woord**\` gebruiken voor vetgedrukt en \`*woord*\` voor cursief.`,

  FLASHCARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Hoofdsteden van Europa",
  "description": "Koppel elk land aan zijn hoofdstad.",
  "cards": [
    {
      "text": "Frankrijk",
      "answer": "parijs",
      "tip": "Het is de stad van de **Eiffeltoren**."
    },
    {
      "text": "Spanje",
      "answer": "madrid",
      "tip": "Gelegen in het midden van het *Iberisch* schiereiland."
    },
    {
      "text": "Italië",
      "answer": "rome",
      "tip": "Bijgenaamd de *Eeuwige Stad*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ESSAY (Opstel) ===
  // ============================================================================
  ESSAY_REGLES_SPECIFIQUES: `- Trefwoorden: Minimaal 5 trefwoorden of uitdrukkingen verwacht in het antwoord || [NOMBRE_ELEMENTS] trefwoorden.
- Instructie: De instructie mag de verwachte trefwoorden niet opsommen om het antwoord niet weg te geven, behalve de naam van het algemene thema.`,

  ESSAY_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
Het object moet bevatten:
- \`taskDescription\`: Een duidelijke instructie die de leerling uitnodigt om een tekst over het thema te schrijven. Gebruik \`**woord**\` voor vet (kernconcepten), \`*woord*\` voor cursief en \`\\n\` voor regelafstotingen.
- \`keywords\`: Een tabel met objecten die de verwachte trefwoorden definiëren. Elk object moet de volgende vorm hebben:
  \`\`\`json
  {
    "keyword": "woord of uitdrukking",
    "options": { "points": 1, "caseSensitive": false }
  }
  \`\`\`
- \`overallFeedback\`: (STRIKTE REGEL) Je moet verplicht een tabel van 6 objecten genereren voor de eindfeedback, gecontexualiseerd naar het thema van de oefening, met strikte naleving van de volgende scorebereiken: 0-10, 11-30, 31-50, 51-70, 71-90, en 91-100.`,

  ESSAY_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Schrijf een korte tekst waarin je het proces van **fotosynthese** uitlegt. Je antwoord moet de essentiële elementen behandelen waarmee planten hun eigen energie kunnen produceren.",
  "keywords": [
    {"keyword": "licht", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "bladgroen", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "kooldioxide", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "water", "options": { "points": 1, "caseSensitive": false }},
    {"keyword": "glucose", "options": { "points": 1, "caseSensitive": false }}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Dit is een begin. Lees de les over fotosynthese nog eens goed door." },
    { "from": 11, "to": 30, "feedback": "Je hebt enkele elementen geïdentificeerd. Ga zo door." },
    { "from": 31, "to": 50, "feedback": "Je begrip vordert. Denk eraan om meer details te geven." },
    { "from": 51, "to": 70, "feedback": "Goed werk! Je beheerst de basis." },
    { "from": 71, "to": 90, "feedback": "Heel goed! Je tekst toont een solide begrip." },
    { "from": 91, "to": 100, "feedback": "Uitstekend! Je beheerst het onderwerp perfect." }
  ]
}
\`\`\``,

  // ============================================================================
  // === ACCORDION (H5P Woordenlijst) ===
  // ============================================================================
  ACCORDION_REGLES_SPECIFIQUES: `- Aantal items: Minimaal 5 termen || [NOMBRE_ELEMENTS] termen.
- Selectie van termen: Identificeer technische concepten, specifiek vocabulaire of complexe woorden die in de bronnen voorkomen.
- Definities: Beknopt, nauwkeurig en perfect afgestemd op het beoogde pedagogische niveau.`,

  ACCORDION_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- De gegenereerde JSON moet een TABEL zijn met evenveel objecten als de eerder genoemde termen.
- \`title\`: Het trefwoord, de uitdrukking of de vraag die gedefinieerd moet worden.
- \`text\`: De definitie. Gebruik \`**woord**\` voor vet, \`*woord*\` voor cursief en \`\\n\` voor regelafstotingen. Voor wiskundige formules gebruik je het LaTeX-formaat met dubbele escape, bijvoorbeeld: \`\\\\( (2^3)^2 \\\\)\`.`,

  ACCORDION_EXEMPLE_RENDU: `\`\`\`json
[
  {"title": "Fotosynthese", "text": "Proces waarbij planten **zonlicht** omzetten in energie.\\nDit is de basis van de voedselketen."},
  {"title": "Cel", "text": "De basis**eenheid** van alle levende wezens. Er zijn *eukaryoten* en *prokaryoten*."}
]
\`\`\``,

  // ============================================================================
  // === SUMMARY (Samenvatting) ===
  // ============================================================================
  SUMMARY_REGLES_SPECIFIQUES: `- Aantal stappen: Genereer een tabel van minimaal 5 stappen || [NOMBRE_ELEMENTS] stappen om het hele onderwerp te dekken.
- Afleiders: Stel minimaal 2 afleiders voor per stap. Ze moeten consistent zijn met het onderwerp, maar plausibele feitelijke of logische fouten bevatten.`,

  SUMMARY_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`intro\`: Een korte inleidende zin (bijv: "Kies de juiste bewering.").
- \`summaries\`: Tabel met objecten die de stappen vormen. Elk object bevat:
  - \`summary\`: ÉÉN tabel met zinnen (**Associatie**). De eerste zin van de lijst moet ALTIJD de juiste samenvatting zijn (juiste bewering).
  - \`tip\`: (Optioneel) Een contextuele aanwijzing om de leerling te helpen.
- \`overallFeedback\`: Tabel van 6 objecten voor de eindscore (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Gebruik dubbele escape voor LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SUMMARY_EXEMPLE_RENDU: `\`\`\`json
{
  "intro": "Selecteer de juiste beweringen om de samenvatting van de les op te bouwen.",
  "summaries": [
    {
      "summary": [
        "Fotosynthese is een biologisch proces waarmee planten lichtenergie omzetten in chemische energie.",
        "Fotosynthese is een proces dat alleen 's nachts plaatsvindt.",
        "Fotosynthese is het mechanisme waarmee dieren ademen."
      ],
      "tip": "Denk aan licht als energiebron."
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Er zijn inspanningen nodig om deze begrippen goed te begrijpen." },
    { "from": 11, "to": 30, "feedback": "Je bent er bijna, ga zo door." },
    { "from": 31, "to": 50, "feedback": "Dit is een goed begin, maar sommige punten moeten nog worden verduidelijkt." },
    { "from": 51, "to": 70, "feedback": "Goed werk! Je hebt de essentie begrepen." },
    { "from": 71, "to": 90, "feedback": "Zeer goede score! Je beheerst de concepten goed." },
    { "from": 91, "to": 100, "feedback": "Uitstekend! Je beheerst deze les perfect." }
  ]
}
\`\`\``,

  // ============================================================================
  // === DRAG_THE_WORDS (Woorden slepen) ===
  // ============================================================================
  DRAG_THE_WORDS_REGLES_SPECIFIQUES: `- Aantal woorden: Paragraaf van minimaal 50 woorden met ten minste 5 sleepwoorden || [NOMBRE_ELEMENTS] woorden.
- Uniciteit: Elk sleepwoord moet UNIEK zijn in de tekst (geen dubbelingen).`,

  DRAG_THE_WORDS_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
Het object moet bevatten:
- \`taskDescription\`: Een duidelijke instructie.
- \`textField\`: De aan te vullen tekst. Elke zin moet eindigen met een regelafstoting \`\\n\`.
  - **Formaat**: \`*woord*\` voor een sleepbaar element.
- \`overallFeedback\`: Tabel van 6 objecten voor de eindscore (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  DRAG_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Vul de tekst aan door de woorden te slepen.",
  "textField": "Het *zonnestelsel* bestaat uit *acht* planeten die rond de *Zon* draaien.\\nDe grootste planeet is *Jupiter*.",
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Er zijn inspanningen nodig." },
    { "from": 11, "to": 30, "feedback": "Je bent er bijna." },
    { "from": 31, "to": 50, "feedback": "Dit is een goed begin." },
    { "from": 51, "to": 70, "feedback": "Goed werk!" },
    { "from": 71, "to": 90, "feedback": "Zeer goede score!" },
    { "from": 91, "to": 100, "feedback": "Uitstekend!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FILL_IN_THE_BLANKS (Gatentekst) ===
  // ============================================================================
  FILL_IN_THE_BLANKS_REGLES_SPECIFIQUES: `- Aantal gaten: Paragraaf van minimaal 50 woorden met ten minste 3 woorden met gaten || [NOMBRE_ELEMENTS] woorden.
- Balans: Maak geen gaten in triviale woorden (lidwoorden, voorzetsels) tenzij dit het grammaticale doel is. Richt je op de kernconcepten.`,

  FILL_IN_THE_BLANKS_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
Het object moet bevatten:
- \`taskDescription\`: Een duidelijke en korte instructie die het doel van de activiteit in de globale context uitlegt. Gebruik \`**woord**\` voor vet (kernconcepten), \`*woord*\` voor cursief en \`\\n\` voor regelafstotingen.
- \`questions\`: Een tabel met tekenreeksen. Elke reeks vertegenwoordigt een aan te vullen tekstblok.
  - **Syntaxis van de gaten**: Omgren de te raden woorden met sterretjes (bijv: \`*woord*\`).
  - **Alternatieven**: Gebruik \`/\` voor meerdere geaccepteerde antwoorden (bijv: \`*woord1/woord2*\`).
  - **Help**: Gebruik \`:\` om een pedagogisch help-icoon toe te voegen (bijv: \`*woord:aanwijzing*\`).
- \`overallFeedback\`: (STRIKTE REGEL) Je moet verplicht een tabel van 6 objecten genereren voor de eindfeedback (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  FILL_IN_THE_BLANKS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Vul de hiaten in de onderstaande tekst over het zonnestelsel in.",
  "questions": [
    "De Aarde is een *planeet* van het *zonnestelsel*.",
    "Ze draait rond de *Zon:onze ster* in ongeveer 365 dagen."
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Er zijn inspanningen nodig om deze begrippen goed te begrijpen."},
    {"from": 11, "to": 30, "feedback": "Je bent er bijna, ga zo door om je kennis te consolideren."},
    {"from": 31, "to": 50, "feedback": "Dit is een goed begin, maar sommige punten moeten nog worden verduidelijkt."},
    {"from": 51, "to": 70, "feedback": "Goed werk! Je hebt de essentie van het onderwerp begrepen."},
    {"from": 71, "to": 90, "feedback": "Zeer goede score! Je beheerst de behandelde concepten goed."},
    {"from": 91, "to": 100, "feedback": "Uitstekend! Je beheerst deze les perfect."}
  ]
}
\`\`\``,

  // ============================================================================
  // === MARK_THE_WORDS (Woorden markeren) ===
  // ============================================================================
  MARK_THE_WORDS_REGLES_SPECIFIQUES: `- Aantal woorden: Paragraaf van minimaal 50 woorden met ten minste 5 te markeren woorden || [NOMBRE_ELEMENTS] woorden.`,

  MARK_THE_WORDS_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
Het object moet bevatten:
- \`taskDescription\`: Een duidelijke en aantrekkelijke instructie. Je kunt hier alleen \`**woord**\` voor vet en \`*woord*\` voor cursief gebruiken.
- \`textField\`: De volledige tekst met de te markeren woorden.
  - **MARKERING:** Elk te markeren woord moet INDIVIDUEEL worden omringd door sterretjes. (Bijv: \`*woord1* *woord2*\` is correct; \`*woord1 woord2*\` is onjuist).
  - **LEESTEKENS:** Afkappingstekens of leestekens mogen NOOIT deel uitmaken van de markering en moeten door een spatie van het woord worden gescheiden. (Bijv: \`de *vogel*\` is correct, \`de*vogel*\` is onjuist).
- \`overallFeedback\`: (STRIKTE REGEL) Je moet verplicht een tabel van 6 objecten genereren voor de eindfeedback (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MARK_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Klik op de **eigenpennen** in de volgende tekst.",
  "textField": "*Parijs* is de hoofdstad van *Frankrijk*. Het is *Europa* dat ons interesseert.",
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Er zijn inspanningen nodig om deze begrippen goed te begrijpen."},
    {"from": 11, "to": 30, "feedback": "Je bent er bijna, ga zo door om je kennis te consolideren."},
    {"from": 31, "to": 50, "feedback": "Dit is een goed begin, maar sommige punten moeten nog worden verduidelijkt."},
    {"from": 51, "to": 70, "feedback": "Goed werk! Je hebt de essentie van het onderwerp begrepen."},
    {"from": 71, "to": 90, "feedback": "Zeer goede score! Je beheerst de behandelde concepten goed."},
    {"from": 91, "to": 100, "feedback": "Uitstekend! Je beheerst deze les perfect."}
  ]
}
\`\`\``,

  // ============================================================================
  // === TRUE_FALSE (Waar/Niet waar) ===
  // ============================================================================
  TRUE_FALSE_REGLES_SPECIFIQUES: `- Vraag: Een duidelijke en ondubbelzinnige bewering.
- Antwoord: Het antwoord moet strikt "true" (Waar) of "false" (Niet waar) zijn.
- Feedbacks: Zorg voor specifieke berichten voor succes (\`feedbackOnCorrect\`) en falen (\`feedbackOnWrong\`) om het leren te versterken.`,

  TRUE_FALSE_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- Het hoofdobject moet de volgende sleutels bevatten:
  - \`question\`: (string) De te beoordelen bewering. Kan HTML bevatten.
  - \`correct\`: (string) Het juiste antwoord, ofwel "true", ofwel "false".
  - \`feedbackOnCorrect\`: (string) Commentaar weergegeven als het antwoord juist is.
  - \`feedbackOnWrong\`: (string) Commentaar weergegeven als het antwoord onjuist is.
- **Opmaak:** Gebruik Markdown-syntaxis voor vet (\`**tekst**\`) en cursief (\`*tekst*\`).
- **LaTeX:** Gebruik voor wiskundige formules UITSLUITEND het LaTeX-formaat met dubbele escapetekens: \`\\\\( ... \\\\)\`. Gebruik NOOIT het \`$\`-teken alleen.
- **Feedback:** De opmerkingen mogen GEEN LaTeX of Markdown bevatten.`,

  TRUE_FALSE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Oslo is de hoofdstad van Noorwegen.",
  "correct": "true",
  "feedbackOnCorrect": "Goed antwoord! Oslo is inderdaad de hoofdstad van Noorwegen.",
  "feedbackOnWrong": "Fout antwoord. De hoofdstad van Noorwegen is Oslo."
}
\`\`\``,

  // ============================================================================
  // === MULTIPLE_CHOICE (Meerkeuze) ===
  // ============================================================================
  MULTIPLE_CHOICE_REGLES_SPECIFIQUES: `- Vraag: Een duidelijke meerkeuzevraag.
- Antwoorden: Stel meerdere antwoordkeuzes voor (\`answers\`). Er mag maar één goed antwoord zijn (\`"correct": true\`) en meerdere plausibele afleiders (\`"correct": false\`).
- Feedbacks:
  - \`overallFeedback\`: (STRIKTE REGEL) Je moet verplicht een tabel van 6 objecten genereren voor de eindfeedback (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).`,

  MULTIPLE_CHOICE_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- Het hoofdobject moet de volgende sleutels bevatten:
  - \`question\`: (string) De tekst van de vraag. Kan HTML bevatten.
  - \`answers\`: (array) Tabel met objecten, die elk een antwoord vertegenwoordigen.
    - \`text\`: (string) De tekst van het antwoord.
    - \`correct\`: (boolean) \`true\` als het een goed antwoord is, anders \`false\`.
    - \`tipsAndFeedback\`: (object, optioneel) \`{ "tip": "", "chosenFeedback": "", "notChosenFeedback": "" }\`.
  - \`overallFeedback\`: (array) Tabel van 6 objecten die de feedbacks per scorebereik definiëren.
- **Opmaak:** Gebruik Markdown-syntaxis voor vet (\`**tekst**\`) en cursief (\`*tekst*\`).
- **LaTeX:** Gebruik voor wiskundige formules UITSLUITEND het LaTeX-formaat met dubbele escapetekens: \`\\\\( ... \\\\)\`. Gebruik NOOIT het \`$\`-teken alleen.
- **Feedback:** De opmerkingen mogen GEEN LaTeX of Markdown bevatten.`,

  MULTIPLE_CHOICE_EXEMPLE_RENDU: `\`\`\`json
{
  "question": "Wat is de werkelijke kleur van de zwarte bes?",
  "answers": [
    {"text": "Violet très foncé", "correct": true, "tipsAndFeedback": { "chosenFeedback": "Exactement !" }},
    {"text": "Bleu", "correct": false, "tipsAndFeedback": { "chosenFeedback": "Non, c'est plus foncé." }},
    {"text": "Noir", "correct": false}
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Er zijn inspanningen nodig." },
    { "from": 11, "to": 30, "feedback": "Je bent er bijna." },
    { "from": 31, "to": 50, "feedback": "Het is een goed begin." },
    { "from": 51, "to": 70, "feedback": "Goed werk!" },
    { "from": 71, "to": 90, "feedback": "Zeer goede score!" },
    { "from": 91, "to": 100, "feedback": "Uitstekend!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === FIND_THE_WORDS (Woordzoeker) ===
  // ============================================================================
  FIND_THE_WORDS_REGLES_SPECIFIQUES: `- Aantal woorden: Minimaal 6 woorden || [NOMBRE_ELEMENTS] woorden.
- Typografische regels: Woorden mogen geen accenten, cijfers, leestekens of spaties bevatten.`,

  FIND_THE_WORDS_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`taskDescription\`: Instructie voor de leerling.
- \`wordList\`: Lijst met te zoeken woorden gescheiden door komma's (zonder spaties).`,

  FIND_THE_WORDS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Vind de verborgen woorden in het rooster.",
  "wordList": "CEL,DNA,GEN,KERN"
}
\`\`\``,

  // ============================================================================
  // === SORT_THE_PARAGRAPHS (Paragrafen ordenen) ===
  // ============================================================================
  SORT_THE_PARAGRAPHS_REGLES_SPECIFIQUES: `- Aantal stappen: Minimaal 3 stappen of paragrafen om te sorteren || [NOMBRE_ELEMENTS] stappen.
- Intrinsieke logica: De paragrafen (\`paragraphs\`) moeten een logische progressie vormen die afgeleid kan worden uit de inhoud zelf.
- Verbod op kunstmatige aanwijzingen: Je mag NOOIT nummering (1, 2, 3...), expliciete tijdsindicaties (data, tijdstippen) of te eenvoudige logische verbindingswoorden ("Eerst", "Daarna", "Ten slotte") gebruiken, tenzij de gebruiker hier expliciet om vraagt.
- Rode draad: Elke paragraaf moet een enkele rode draad vooruit helpen (bijv. causaliteitsketen, overgang van algemeen naar specifiek, of een sequentie voorbereiding → actie → resultaat). De volgorde moet afgeleid kunnen worden door het begrijpen van de betekenis.`,

  SORT_THE_PARAGRAPHS_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`taskDescription\`: Een duidelijke instructie (Markdown ondersteund).
- \`paragraphs\`: Een array van strings (paragrafen) in de **juiste logische volgorde** in de JSON. Gebruik \`**woord**\` voor vet en \`*woord*\` voor cursief.
- \`overallFeedback\`: Array van 6 objecten voor de eindscore (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Gebruik dubbele escaping voor LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SORT_THE_PARAGRAPHS_EXEMPLE_RENDU: `\`\`\`json
{
  "taskDescription": "Zet deze elementen in de juiste volgorde om de oorzakelijke keten van de opwarming van de aarde te reconstrueren.",
  "paragraphs": [
    "Menselijke activiteiten, voornamelijk de verbranding van fossiele brandstoffen, stoten massaal **kooldioxide** uit in de atmosfeer.",
    "Dit overschot aan gassen versterkt het natuurlijke broeikaseffect, waardoor een deel van de infraroodstraling de aarde niet kan verlaten.",
    "De zo gevangen energie veroorzaakt een geleidelijke stijging van de gemiddelde temperatuur van de lucht en de oceanen.",
    "Deze wereldwijde opwarming leidt tot het smelten van gletsjers en een zorgwekkende stijging van de zeespiegel."
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "De causaliteitslogica moet herzien worden." },
    { "from": 11, "to": 30, "feedback": "Je hebt een begin van begrip, lees de tekst opnieuw." },
    { "from": 31, "to": 50, "feedback": "Dit is een goed begin van de ordening." },
    { "from": 51, "to": 70, "feedback": "Goede analyse van de logische voortgang." },
    { "from": 71, "to": 90, "feedback": "Zeer goed structureerwerk!" },
    { "from": 91, "to": 100, "feedback": "Perfect! De logische structuur wordt beheerst." }
  ]
}
\`\`\``,

  // ============================================================================
  // === SINGLE_CHOICE_SET (Reeks unieke keuzes) ===
  // ============================================================================
  SINGLE_CHOICE_SET_REGLES_SPECIFIQUES: `- Aantal vragen: Minimaal 3 vragen || [NOMBRE_ELEMENTS] vragen.
- Antwoorden: Stel 2 tot 3 afleiders per vraag voor. Het eerste antwoord in de lijst \`answers\` moet altijd het juiste zijn.
- Afleiders: Consistent, maar met plausibele logische of feitelijke fouten.`,

  SINGLE_CHOICE_SET_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`choices\`: Array van objecten die de vragen vormen. Elk object bevat:
  - \`question\`: De formulering van de vraag.
  - \`answers\`: Array van strings (antwoorden) waarvan de eerste altijd de juiste is.
- \`overallFeedback\`: Array van 6 objecten voor de eindscore (0-10, 11-30, 31-50, 51-70, 71-90, 91-100).
- **LaTeX:** Gebruik dubbele escaping voor LaTeX: \`\\\\( (2^3)^2 \\\\)\`.`,

  SINGLE_CHOICE_SET_EXEMPLE_RENDU: `\`\`\`json
{
  "choices": [
    {
      "question": "Wat is het belangrijkste gas dat verantwoordelijk is voor het broeikaseffect?",
      "answers": ["Kooldioxide", "Zuurstof", "Stikstof", "Argon"]
    },
    {
      "question": "Wat is de hoofdstad van Frankrijk?",
      "answers": ["Parijs", "Lyon", "Marseille", "Bordeaux"]
    }
  ],
  "overallFeedback": [
    { "from": 0, "to": 10, "feedback": "Er zijn inspanningen nodig." },
    { "from": 11, "to": 30, "feedback": "Je bent er bijna." },
    { "from": 31, "to": 50, "feedback": "Het is een goed begin." },
    { "from": 51, "to": 70, "feedback": "Goed werk!" },
    { "from": 71, "to": 90, "feedback": "Zeer goede score!" },
    { "from": 91, "to": 100, "feedback": "Uitstekend!" }
  ]
}
\`\`\``,

  // ============================================================================
  // === DIALOG_CARDS (Dialoogkaarten) ===
  // ============================================================================
  DIALOG_CARDS_REGLES_SPECIFIQUES: `- Aantal kaarten: Minimaal 3 kaarten || [NOMBRE_ELEMENTS] kaarten.
- Associatieprincipe: Voor- en achterkant moeten gekoppeld zijn door een uniek en stabiel criterium (bijv. definitie -> term, gebeurtenis -> datum, auteur -> werk).
- Instructie: De beschrijving van de activiteit moet de formule volgen: "Associeer elke [X] met zijn [Y]".`,

  DIALOG_CARDS_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- Het wortelobject MOET \`title\`, \`description\` en \`dialogs\` bevatten.
- 1. \`title\`: De titel van de activiteit (Simpele tekst, **zonder** Markdown of HTML).
- 2. \`description\`: De instructie of beschrijving (HTML-formaat of simpele tekst).
- 3. \`dialogs\`: De array van het Associatieprincipe van de kaarten: Voorzijde (text) en achterzijde (answer).
- 4. \`text\`: De voorzijde van de kaart. Gebruik \`**woord**\` voor vet en \`*woord*\` voor cursief.
- 5. \`answer\`: De achterzijde van de kaart. Deze moet kort zijn. Gebruik \`**woord**\` voor vet en \`*woord*\` voor cursief.
- 6. \`tips\` (optioneel): Voeg alleen als dat relevant is een tip toe voor de voorzijde (\`front\`) en/of de achterzijde (\`back\`). Simpele tekst **zonder** opmaak.`,

  DIALOG_CARDS_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Onregelmatige werkwoorden",
  "description": "Vind het werkwoord in de infinitief.",
  "dialogs": [
    {"text": "He **visited** his grandmother.", "answer": "to **visit**", "tips": {"front": "Identificeer de onvoltooid verleden tijd.", "back": "Basisvorm."}},
    {"text": "She **played** soccer.", "answer": "to **play**"}
  ]
}
\`\`\``,

  // ============================================================================
  // === CHART (Diagram) ===
  // ============================================================================
  CHART_REGLES_SPECIFIQUES: `- Aantal elementen: Minimaal 5 vergelijkingselementen || [NOMBRE_ELEMENTS] vergelijkingselementen.
- Type grafiek: Kies tussen het cirkeldiagram (\`pieChart\`) of het staafdiagram (\`barChart\`) op basis van de pedagogische relevantie.
- Labels en kleuren: Kleuren moeten contrasterend zijn voor een goede leesbaarheid. Labels moeten kort en duidelijk zijn.`,

  CHART_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`graphMode\`: Het type grafiek (\`pieChart\` of \`barChart\`).
- \`listOfTypes\`: Een array van objecten \`{"value": ..., "color": "...", "fontColor": "...", "text": "..."}\`.
- \`figureDefinition\`: De titel van de grafiek.`,

  CHART_EXEMPLE_RENDU: `\`\`\`json
{
  "graphMode": "pieChart",
  "listOfTypes": [
    {"value": 6, "color": "#f3c74f", "fontColor": "#fff", "text": "Bosbessen"},
    {"value": 4, "color": "#6bc98d", "fontColor": "#fff", "text": "Frambozen"}
  ],
  "figureDefinition": "Grafiek van favoriete vruchten"
}
\`\`\``,

  // ============================================================================
  // === QUIZSET (H5P Quiz) ===
  // ============================================================================
  QUIZSET_REGLES_SPECIFIQUES: `- Aantal vragen: Genereer een tabel van minimaal 5 vragen || [NOMBRE_ELEMENTS] vragen.
- Variatie: Kies de meest geschikte activiteitstypes uit de volgende lijst om de oefening af te wisselen:
  - **Meerkeuze (QCM)** (\`H5P.MultiChoice\` 1.16)
  - **Sleep de woorden** (\`H5P.DragText\` 1.10)
  - **Waar/Onwaar** (\`H5P.TrueFalse\` 1.8)
  - **Gatentekst** (\`H5P.Blanks\` 1.14)
  - **Markeer de woorden** (\`H5P.MarkTheWords\` 1.11)
  - **Essay / Open vraag** (\`H5P.Essay\` 1.5)`,

  QUIZSET_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- Het wortelobject moet bevatten:
  - \`title\`: De titel van de activiteit.
  - \`questions\`: Een array van objecten. Elk object vertegenwoordigt een vraag en moet bevatten:
    - \`library\`: De naam en exacte versie van de bibliotheek (bijv: \`H5P.MultiChoice 1.16\`).
    - \`metadata\`: Een object met een sleutel \`title\` (korte titel van de vraag).
    - \`params\`: De gegevens van de vraag.
  - \`overallFeedback\`: Globale tabel van 6 objecten voor de eindscore van de QuizSet.

**Details van de \`params\` per type:**
1. **Meerkeuze (\`H5P.MultiChoice 1.16\`)**: \`question\`, \`answers\` (array van objecten met \`text\`, \`correct\`), \`behaviour: {singleAnswer: true}\`
2. **Waar/Onwaar (\`H5P.TrueFalse 1.8\`)**: \`question\`, \`correct\` ("true" of "false" als string)
3. **Gatentekst (\`H5P.Blanks 1.14\`)**: \`taskDescription\`, \`questions\` (array van strings met \`*woord*\`)
4. **Woorden slepen (\`H5P.DragText 1.10\`)**: \`taskDescription\`, \`textField\` (met \`*woord*\`)
5. **Markeren (\`H5P.MarkTheWords 1.11\`)**: \`taskDescription\`, \`textField\` (met \`*woord*\`)
6. **Essay (\`H5P.Essay 1.5\`)**: \`taskDescription\`, \`keywords\` (array van objecten)

**Elke vraag, behalve die van het type H5P.TrueFalse 1.8, moet zijn eigen \`overallFeedback\` bevatten (6 bereiken).**
- **Opmaak:** Gebruik Markdown-syntaxis voor vet (\`**tekst**\`) en cursief (\`*tekst*\`).
- **LaTeX:** Gebruik voor wiskundige formules UITSLUITEND het LaTeX-formaat met dubbele escapetekens: \`\\\\( ... \\\\)\`. Gebruik NOOIT het \`$\`-teken alleen.
- **Feedback:** De opmerkingen mogen GEEN LaTeX of Markdown bevatten.`,

  QUIZSET_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Algemene Wetenschappelijke Kennis",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomie - Meerkeuze" },
      "params": {
        "question": "Welke planeet staat het dichtst bij de zon?",
        "answers": [
          { "text": "Mercurius", "correct": true },
          { "text": "Venus", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Fout."},
          {"from": 11, "to": 30, "feedback": "Onvoldoende."},
          {"from": 31, "to": 50, "feedback": "Matig."},
          {"from": 51, "to": 70, "feedback": "Goed."},
          {"from": 71, "to": 90, "feedback": "Zeer goed."},
          {"from": 91, "to": 100, "feedback": "Uitstekend."}
        ]
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Biologie - Waar/Onwaar" },
      "params": {
        "question": "DNA is een dubbele helix.",
        "correct": "true"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Zwak resultaat."},
    {"from": 11, "to": 30, "feedback": "Onvoldoende resultaat."},
    {"from": 31, "to": 50, "feedback": "Gemiddeld resultaat."},
    {"from": 51, "to": 70, "feedback": "Goed resultaat."},
    {"from": 71, "to": 90, "feedback": "Zeer goed resultaat."},
    {"from": 91, "to": 100, "feedback": "Uitstekend resultaat."}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET QCM (H5P Meerkeuze Quiz) ===
  // ============================================================================
  QUIZSET_QCM_REGLES_SPECIFIQUES: `- Aantal vragen: Genereer minimaal 5 vragen || [NOMBRE_ELEMENTS] vragen.
- Type: U moet ALLEEN **meerkeuzevragen** genereren (\`H5P.MultiChoice\` 1.16). Geen ander type is toegestaan.
- Kwaliteit van meerkeuzevragen:
  - Elke vraag moet minimaal 3 antwoordopties hebben.
  - Afhankelijk van de aard van de vraag kunt u één of meerdere juiste antwoorden voorstellen.
  - Distractoren (foute antwoorden) moeten plausibel en relevant zijn.
  - Vermijd negatieve formuleringen in vragen.
  - Varieer de positie van het/de juiste antwoord(en).`,

  QUIZSET_QCM_STRUCTURE_JSON: `- Genereer ALLEEN een volledige en geldige JSON in een codeblok. Uw antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of opmerkingen.
- Het hoofdobject moet bevatten:
  - \`title\`: Activiteitstitel.
  - \`questions\`: Een array van objecten. Elk object vertegenwoordigt een meerkeuzevraag en moet bevatten:
    - \`library\`: Altijd \`H5P.MultiChoice 1.16\`.
    - \`metadata\`: Een object met een \`title\` sleutel (korte vraagtitel).
    - \`params\`: Vraaggegevens.
  - \`overallFeedback\`: Globale array van 6 objecten voor de uiteindelijke QuizSet-score.

**Details van \`params\` voor meerkeuze (\`H5P.MultiChoice 1.16\`)**:
- \`question\`: De gestelde vraag (string).
- \`answers\`: Array van objecten met \`text\` (string) en \`correct\` (boolean).
- \`behaviour\`: Object met \`singleAnswer\`: \`true\` bij één juist antwoord, \`false\` bij meerdere juiste antwoorden.

**Elke vraag moet zijn eigen \`overallFeedback\` bevatten (6 bereiken: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100).**
- **Opmaak:** Gebruik Markdown-syntaxis voor vet (\`**tekst**\`) en cursief (\`*tekst*\`).
- **LaTeX:** Gebruik voor wiskundige formules UITSLUITEND het LaTeX-formaat met dubbele escapetekens: \`\\\\( ... \\\\)\`. Gebruik NOOIT het \`$\`-teken alleen.
- **Feedback:** De opmerkingen mogen GEEN LaTeX of Markdown bevatten.`,

  QUIZSET_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Meerkeuze Quiz - Wetenschap",
  "questions": [
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Astronomie - Planeten" },
      "params": {
        "question": "Welke planeet ligt het dichtst bij de zon?",
        "answers": [
          { "text": "Venus", "correct": false },
          { "text": "Mars", "correct": false },
          { "text": "Mercurius", "correct": true },
          { "text": "Jupiter", "correct": false }
        ],
        "behaviour": { "singleAnswer": true },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Onjuist."},
          {"from": 11, "to": 30, "feedback": "Onvoldoende."},
          {"from": 31, "to": 50, "feedback": "Gemiddeld."},
          {"from": 51, "to": 70, "feedback": "Goed."},
          {"from": 71, "to": 90, "feedback": "Zeer goed."},
          {"from": 91, "to": 100, "feedback": "Uitstekend!"}
        ]
      }
    },
    {
      "library": "H5P.MultiChoice 1.16",
      "metadata": { "title": "Biologie - Organellen" },
      "params": {
        "question": "Welke organellen hebben hun eigen DNA?",
        "answers": [
          { "text": "Ribosoom", "correct": false },
          { "text": "Mitochondriën", "correct": true },
          { "text": "Golgi-apparaat", "correct": false },
          { "text": "Chloroplast", "correct": true }
        ],
        "behaviour": { "singleAnswer": false },
        "overallFeedback": [
          {"from": 0, "to": 10, "feedback": "Onjuist."},
          {"from": 11, "to": 30, "feedback": "Onvoldoende."},
          {"from": 31, "to": 50, "feedback": "Gemiddeld."},
          {"from": 51, "to": 70, "feedback": "Goed."},
          {"from": 71, "to": 90, "feedback": "Zeer goed."},
          {"from": 91, "to": 100, "feedback": "Uitstekend!"}
        ]
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Zwak resultaat. Herhaal de basisprincipes."},
    {"from": 11, "to": 30, "feedback": "Onvoldoende resultaat. Blijf oefenen."},
    {"from": 31, "to": 50, "feedback": "Gemiddeld resultaat. U maakt vooruitgang."},
    {"from": 51, "to": 70, "feedback": "Goed resultaat. U beheerst verschillende concepten."},
    {"from": 71, "to": 90, "feedback": "Zeer goed resultaat. U bent op de goede weg."},
    {"from": 91, "to": 100, "feedback": "Uitstekend resultaat. Gefeliciteerd!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === QUIZSET VF (H5P Waar/Onwaar Quiz) ===
  // ============================================================================
  QUIZSET_VF_REGLES_SPECIFIQUES: `- Aantal vragen: Genereer een tabel van minimaal 5 vragen || [NOMBRE_ELEMENTS] vragen.
- Type: Je moet ALLEEN vragen genereren van het type **Waar/Onwaar** (\`H5P.TrueFalse\` 1.8). Geen enkel ander type is toegestaan.
- Kwaliteit van de vragen:
  - De beweringen moeten duidelijk en ondubbelzinnig zijn.
  - Vermijd dubbele ontkenningen.
  - Varieer tussen ware en onware beweringen.`,

  QUIZSET_VF_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- Het wortelobject moet bevatten:
  - \`title\`: De titel van de activiteit.
  - \`questions\`: Een array van objecten. Elk object vertegenwoordigt een vraag en moet bevatten:
    - \`library\`: Altijd \`H5P.TrueFalse 1.8\`.
    - \`metadata\`: Een object met een sleutel \`title\` (korte titel van de vraag).
    - \`params\`: De gegevens van de vraag.
  - \`overallFeedback\`: Globale tabel van 6 objecten voor de eindscore van de QuizSet: 0-10, 11-30, 31-50, 51-70, 71-90, 91-100.

**Details van de \`params\` voor Waar/Onwaar (\`H5P.TrueFalse 1.8\`)**:
- \`question\`: De bewering of de gestelde vraag (string).
- \`correct\`: Het juiste antwoord. Dit MOET een string zijn: "true" of "false".
- **Opmaak:** Gebruik Markdown-syntaxis voor vet (\`**tekst**\`) en cursief (\`*tekst*\`).
- **LaTeX:** Gebruik voor wiskundige formules UITSLUITEND het LaTeX-formaat met dubbele escapetekens: \`\\\\( ... \\\\)\`. Gebruik NOOIT het \`$\`-teken alleen.
- **Feedback:** De opmerkingen mogen GEEN LaTeX of Markdown bevatten.`,

  QUIZSET_VF_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz Waar/Onwaar - Geografie",
  "questions": [
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografie - Hoofdsteden" },
      "params": {
        "question": "De hoofdstad van Australië is Canberra.",
        "correct": "true"
      }
    },
    {
      "library": "H5P.TrueFalse 1.8",
      "metadata": { "title": "Geografie - Continenten" },
      "params": {
        "question": "Afrika is het grootste continent ter wereld.",
        "correct": "false"
      }
    }
  ],
  "overallFeedback": [
    {"from": 0, "to": 10, "feedback": "Zwak resultaat. Herhaal de basisprincipes."},
    {"from": 11, "to": 30, "feedback": "Onvoldoende resultaat. Blijf oefenen."},
    {"from": 31, "to": 50, "feedback": "Gemiddeld resultaat. Je maakt vooruitgang."},
    {"from": 51, "to": 70, "feedback": "Goed resultaat. Je beheerst verschillende concepten."},
    {"from": 71, "to": 90, "feedback": "Zeer goed resultaat. Je bent op de goede weg."},
    {"from": 91, "to": 100, "feedback": "Uitstekend resultaat. Gefeliciteerd!"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_TEST (Moodle/Éléa Test) ===
  // ============================================================================
  ELEA_TEST_REGLES_SPECIFIQUES: `- Aantal vragen: Minimaal 10 vragen || [NOMBRE_ELEMENTS] vragen.
- Variatie: Kies de meest geschikte vraagformaten uit de volgende:
  - **Meerkeuze** (\`multichoice\`)
  - **Koppelen** (\`matching\`)
  - **Numeriek** (\`numerical\`)
  - **Waar/Onwaar** (\`truefalse\`)
  - **Kort antwoord** (\`shortanswer\`)
  - **Gatentekst** (\`cloze\`)
- Afleiders: Stel minstens 3 afleiders voor per \`multichoice\` vraag.`,

  ELEA_TEST_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.

Het hoofdobject moet de volgende sleutels bevatten:
- \`bank_name\`: Een korte en beschrijvende naam voor de vragenbank.
- \`bank_description\`: Een zin die de inhoud van de bank beschrijft.
- \`questions\`: Een array van objecten waarbij elk object een vraag vertegenwoordigt (\`type\`, \`content\`).
  - Elke vraag moet een korte en unieke \`content.name\` hebben (bijv: "V1 - Onderwerp").

**Opmaakregels:**
- **Getallen**: gebruik de punt voor decimalen (bijv: 12.34).
- **Cloze**: respecteer strikt de syntaxis \`{1:TYPE:=Juist antwoord~Fout antwoord}\`.`,

  ELEA_TEST_EXEMPLE_RENDU: `- **Voor het type \`multichoice\` (Meerkeuze):**
  \`\`\`json
  {
    "type": "multichoice",
    "content": {
      "name": "V1 - Geografie",
      "questiontext": "Wat is de hoofdstad van Frankrijk?",
      "feedback": "Parijs is de politieke en economische hoofdstad van Frankrijk.",
      "answers": [
        { "text": "Parijs", "fraction": 100, "feedback": "Precies!" },
        { "text": "Lyon", "fraction": 0, "feedback": "Nee, Lyon is een grote stad maar niet de hoofdstad." },
        { "text": "Marseille", "fraction": 0, "feedback": "Nee, dit is de tweede stad van Frankrijk." }
      ]
    }
  }
  \`\`\`

- **Voor het type \`matching\` (Koppelen):**
  \`\`\`json
  {
    "type": "matching",
    "content": {
      "name": "V2 - Engelse Woordenschat",
      "questiontext": "Koppel elk Engels woord aan zijn Nederlandse vertaling.",
      "feedback": "Goed gedaan, je beheerst de basiswoordenschat.",
      "subquestions": [
        { "text": "Dog", "answer": "Hond" },
        { "text": "Cat", "answer": "Kat" },
        { "text": "Bird", "answer": "Vogel" }
      ]
    }
  }
  \`\`\`

- **Voor het type \`numerical\` (Numeriek):**
  \`\`\`json
  {
    "type": "numerical",
    "content": {
      "name": "V3 - Wiskunde",
      "questiontext": "Wat is de waarde van Pi afgerond op twee decimalen?",
      "feedback": "Pi is een irrationale constante ongeveer gelijk aan 3.14159...",
      "answer": { "number": 3.14, "tolerance": 0.01, "feedback": "Het is inderdaad 3.14." }
    }
  }
  \`\`\`

- **Voor het type \`truefalse\` (Waar/Onwaar):**
  \`\`\`json
  {
    "type": "truefalse",
    "content": {
      "name": "V4 - Wetenschap",
      "questiontext": "Water kookt bij 100°C op zeeniveau.",
      "feedback": "Dit is een standaard fysische eigenschap van water.",
      "answer": { "value": true, "feedback_true": "Waar.", "feedback_false": "Onwaar, water kookt inderdaad bij 100°C bij 1 atm." }
    }
  }
  \`\`\`

- **Voor het type \`shortanswer\` (Kort antwoord):**
  \`\`\`json
  {
    "type": "shortanswer",
    "content": {
      "name": "V5 - Literatuur",
      "questiontext": "Wie schreef 'Les Misérables'?",
      "feedback": "Het is een van de grootste romans van de 19e eeuw.",
      "answers": [
        { "text": "Victor Hugo", "fraction": 100, "feedback": "Correct!" },
        { "text": "Hugo", "fraction": 100, "feedback": "Correct!" }
      ]
    }
  }
  \`\`\`

- **Voor het type \`cloze\` (Gatentekst):**
  - Let op de syntaxis: \`{1:SHORTANSWER:=Goed~Slecht}\`.
  \`\`\`json
  {
    "type": "cloze",
    "content": {
      "name": "V6 - Geschiedenis",
      "questiontext": "Napoleon werd geboren in {1:SHORTANSWER:=1769} in {1:MULTICHOICE:=Ajaccio~Bastia~Parijs}.",
      "feedback": "Napoleon Bonaparte werd geboren op Corsica."
    }
  }
  \`\`\``,

  // ============================================================================
  // === ELEA_MILLIONNAIRE (Miljonair) ===
  // ============================================================================
  ELEA_MILLIONNAIRE_REGLES_SPECIFIQUES: `- Aantal vragen: PRECIES 6 vragen (mag absoluut niet worden gewijzigd)
- Progressie: De moeilijkheidsgraad van de vragen moet **toenemend en pedagogisch** zijn. Belangrijke elementen om te onthouden worden in de eerste vragen geplaatst.
- Waarheidsgetrouwheid: De inhoud moet strikt correct en relevant zijn.`,

  ELEA_MILLIONNAIRE_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
Een hoofdobject met de volgende sleutels:
- \`title\`: De titel van de activiteit (String).
- \`questions\`: Een array van PRECIES 6 objecten, waarbij elk object een vraag vertegenwoordigt en bevat:
  - \`question\`: De vraagstelling (String).
  - \`goodanswer\`: Het juiste antwoord (String).
  - \`badanswer\`: Een array van PRECIES 3 foute antwoorden (Array van strings).
  - Voor wiskundige formules is LaTeX verboden.`,

  ELEA_MILLIONNAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Quiz over de Franse Revolutie",
  "questions": [
    {
      "question": "Welke gebeurtenis markeert het begin van de Franse Revolutie op 14 juli 1789?",
      "goodanswer": "De bestorming van de Bastille",
      "badanswer": ["De eed op de kaatsbaan", "De executie van Lodewijk XVI", "De slag bij Valmy"]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_APPARIEMENT (Koppelen) ===
  // ============================================================================
  ELEA_APPARIEMENT_REGLES_SPECIFIQUES: `- Aantal paren: Minimaal 5 paren || [NOMBRE_ELEMENTS] paren.
- Logica: De relatie tussen de twee elementen moet duidelijk zijn na het lezen van de bronnen.`,

  ELEA_APPARIEMENT_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
Een hoofdobject met de volgende sleutels:
- \`title\`: De titel van de activiteit (String).
- \`intro\`: Korte instructie of inleidende tekst (String).
- \`pairs\`: Een array van objecten, waarbij elk object een paar vertegenwoordigt en bevat:
  - \`question\`: De term of het element aan de linkerkant (String).
  - \`answer\`: De definitie of het bijbehorende element aan de rechterkant (String).
  - Gebruik voor wiskundige formules het LaTeX-formaat met dubbele escapetekens, bijvoorbeeld: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_APPARIEMENT_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Geschiedenis Koppelen",
  "intro": "Koppel elke datum aan de bijbehorende gebeurtenis uit de Franse Revolutie.",
  "pairs": [
    {"question": "Bestorming van de Bastille", "answer": "14 juli 1789"},
    {"question": "Afschaffing van de privileges", "answer": "4 augustus 1789"},
    {"question": "Verklaring van de rechten van de mens", "answer": "26 augustus 1789"},
    {"question": "Mars op Versailles", "answer": "5 oktober 1789"},
    {"question": "Fête de la Fédération", "answer": "14 juli 1790"}
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_QCM (Éléa Meerkeuze) ===
  // ============================================================================
  ELEA_QCM_REGLES_SPECIFIQUES: `- Aantal vragen: Minimaal 5 vragen || [NOMBRE_ELEMENTS] vragen.
- Antwoorden: Bied tussen 2 en 5 keuzes per vraag aan.
- Afleiders: Consistent met het onderwerp maar met logische fouten.`,

  ELEA_QCM_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`title\`: Titel van de activiteit.
- \`questions\`: Array van objecten. Elk vraagobject moet bevatten:
  - \`text\`: De vraagstelling (mag eenvoudige HTML bevatten zoals \`**\` voor vetgedrukt).
  - \`answers\`: Array van objecten \`{"text": "...", "iscorrect": 1/0}\`. \`1\` voor een correct antwoord, anders \`0\`.
  - Gebruik voor wiskundige formules het LaTeX-formaat met dubbele escapetekens, bijvoorbeeld: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_QCM_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "Meerkeuzevragen over de Franse Revolutie",
  "questions": [
    {
      "text": "Wat is de datum van de bestorming van de Bastille?",
      "answers": [
        {"text": "14 juli 1789", "iscorrect": 1},
        {"text": "4 augustus 1789", "iscorrect": 0},
        {"text": "26 augustus 1789", "iscorrect": 0}
      ]
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_GLOSSAIRE (XML Woordenlijst) ===
  // ============================================================================
  ELEA_GLOSSAIRE_REGLES_SPECIFIQUES: `- Aantal items: Minimaal 5 termen || [NOMBRE_ELEMENTS] termen.
- Selectie: Identificeer trefwoorden, acroniemen en technische concepten.`,

  ELEA_GLOSSAIRE_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- **Wortel:** Een hoofdobject met twee sleutels: \`name\` (de naam van de woordenlijst) and \`entries\` (een array van objecten).
- **Elk object in \`entries\` moet bevatten:**
  - \`concept\`: De term of uitdrukking die gedefinieerd moet worden.
  - \`definition\`: De duidelijke en beknopte definitie. Gebruik **woord** voor vetgedrukt, *woord* voor cursief en \`\\n\` voor regeleinden, alleen wanneer dit pedagogisch relevant is.
  - \`aliases\` (optioneel): Een array van strings voor synoniemen of alternatieve termen. Voeg deze sleutel alleen toe als er relevante aliassen bestaan.
  - Gebruik voor wiskundige formules het LaTeX-formaat met dubbele escapetekens, bijvoorbeeld: \`\\\\( (2^3)^2 \\\\)\`.`,

  ELEA_GLOSSAIRE_EXEMPLE_RENDU: `\`\`\`json
{
  "name": "Woordenlijst Journalistiek",
  "entries": [
    {
      "concept": "Journalist",
      "definition": "Persoon die *informatie* **verzamelt** en verspreidt.",
      "aliases": ["Verslaggever", "Columnist"]
    },
    {
      "concept": "Bron",
      "definition": "Oorsprong van een geverifieerd stuk *informatie*."
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === ELEA_PAGE (Éléa Pagina) ===
  // ============================================================================
  ELEA_PAGE_REGLES_SPECIFIQUES: `- Structuur: De pagina moet minimaal 5 verschillende blokken bevatten || [NOMBRE_ELEMENTS] blokken.
- Pedagogische logica: De inhoud moet een logische opbouw volgen (bijv: Welkom -> Doelen -> Les -> Details/Lexicon -> Sitografie).
- Inhoudelijke balans: Wissel formaten af om de betrokkenheid te behouden (tekst, tabellen, lijsten, kaders).
- Verplichte inhoud: Integreer systematisch een openingsbanner (\`#01_hero_header\`), kaders met doelen of aandachtspunten (\`#04_callout_set\`), een lexicon voor technische termen (\`#06_lexique_table\`), minstens drie alinea's met substantiële inhoud (\`#12_context_paragraphs\`) en een referentie-sitografie (\`#18_sito_graphy\`).`,

  ELEA_PAGE_STRUCTURE_JSON: `- Genereer UITSLUITEND een volledige en geldige JSON in een codeblok. Je antwoord MOET beginnen met \`{\` en eindigen met \`}\`. Geen andere tekst of commentaar.
- \`title\`: Titel van de pagina (String).
- \`intro\`: Korte, boeiende inleidende tekst (String).
- \`blocks\`: Een array van objecten, waarbij elk object een sectie van de pagina vertegenwoordigt. Elk blok MOET voldoen aan een van de volgende structuren:

**Lijst van beschikbare blokken:**
- \`#01_hero_header\`: Openingsbanner. \`{ "type": "#01_hero_header", "data": { "title": "...", "subtitle": "..." } }\`
- \`#02_nav_summary\`: Inhoudsopgave met interne links. \`{ "type": "#02_nav_summary", "data": { "links": [{ "href": "#...", "text": "..." }] } }\`
- \`#03_histo_reperes\`: Historische mijlpalen in 3 kaarten. \`{ "type": "#03_histo_reperes", "data": { "title": "...", "cards": [{ "title": "...", "text": "..." }] } }\` (max 3 kaarten)
- \`#04_callout_set\`: Doelen, Wist-je-dat, Waarschuwing. \`{ "type": "#04_callout_set", "data": { "title": "...", "callouts": [{ "type": "objectif|savoir|alerte", "text": "..." }] } }\`
- \`#05_stats_cards\`: Kerncijfers in kaarten. \`{ "type": "#05_stats_cards", "data": { "title": "...", "stats": [{ "value": "...", "label": "..." }] } }\`
- \`#06_lexique_table\`: Woordenschat tabel. \`{ "type": "#06_lexique_table", "data": { "title": "...", "caption": "...", "headers": ["...", "..."], "rows": [["...","..."]] } }\`
- \`#07_glossary_chips\`: Woordenlijst in badges. \`{ "type": "#07_glossary_chips", "data": { "title": "...", "chips": ["..."] } }\`
- \`#08_monuments_grid\`: Monumentkaarten met afbeeldingen. \`{ "type": "#08_monuments_grid", "data": { "title": "...", "cards": [{ "img_src": "...", "img_alt": "...", "caption": "...", "title": "...", "text": "..." }] } }\`
- \`#09_figures_comparison\`: Vergelijking van twee afbeeldingen.
- \`#10_table_comparison\`: Vergelijkingstabel.
- \`#11_definition_box\`: Definitie-kader. \`{ "type": "#11_definition_box", "data": { "title": "Definitie", "text": "..." } }\`
- \`#12_context_paragraphs\`: Les-alinea's. \`{ "type": "#12_context_paragraphs", "data": { "title": "...", "paragraphs": ["...", "..."] } }\`
- \`#13_monument_sheet_long\`: Gedetailleerd informatieblad.
- \`#14_faq_block\`: Veelgestelde vragen. \`{ "type": "#14_faq_block", "data": { "title": "FAQ", "questions": [{ "q": "...", "a": "..." }] } }\`
- \`#15_myths_realities\`: Mythen vs Realiteit.
- \`#17_method_image_desc\`: Methode voor beeldbeschrijving.
- \`#18_sito_graphy\`: Sitografie. \`{ "type": "#18_sito_graphy", "data": { "title": "Sitografie", "links": [{ "href": "...", "text": "..." }] } }\`
- \`#19_quote_bilingual\`: Tweetalig citaat.`,

  ELEA_PAGE_EXEMPLE_RENDU: `\`\`\`json
{
  "title": "De Franse Revolutie",
  "intro": "Ontdek de belangrijkste momenten van deze historische periode.",
  "blocks": [
    {
      "type": "#01_hero_header",
      "data": {"title": "De Revolutie", "subtitle": "1789-1799"}
    },
    {
      "type": "#04_callout_set",
      "data": {
        "title": "Doelen",
        "callouts": [{"type": "objectif", "text": "De oorzaken van 1789 begrijpen."}]
      }
    },
    {
      "type": "#12_context_paragraphs",
      "data": {
        "title": "De Eed op de Kaatsbaan",
        "paragraphs": [
          "Op 20 juni 1789 kwamen de afgevaardigden van de Derde Stand bijeen...",
          "Dit gebaar markeert de geboorte van de Nationale Vergadering.",
          "Het is een belangrijk keerpunt richting het einde van het absolutisme."
        ]
      }
    },
    {
      "type": "#06_lexique_table",
      "data": {
        "title": "Woordenschat",
        "headers": ["Term", "Definitie"],
        "rows": [["Derde Stand", "Het grootste deel van de bevolking..."]]
      }
    },
    {
      "type": "#18_sito_graphy",
      "data": {
        "title": "Voor meer informatie",
        "links": [{"href": "https://...", "text": "Officiële Geschiedenis Website"}]
      }
    }
  ]
}
\`\`\``,

  // ============================================================================
  // === H5P INTERFACE VERTALINGEN (GESTANDAARDISEERD) ===
  // ============================================================================

  // Gemeenschappelijke sleutels
  h5p_check_answer: "Controleren",
  h5p_try_again: "Opnieuw",
  h5p_show_solution: "Oplossing tonen",
  h5p_submit_answer: "Verzenden",
  h5p_score: "Je hebt @score van de @total punten behaald",
  h5p_score_bar_label: "Je hebt :num van :total punten behaald",
  h5p_tip_label: "Hint",
  h5p_next: "Volgende",
  h5p_previous: "Vorige",
  h5p_close: "Sluiten",
  h5p_finish_header: "Beëindigen?",
  h5p_finish_body: "Weet je zeker dat je wilt beëindigen?",
  h5p_cancel_label: "Annuleren",
  h5p_finish_label: "Beëindigen",
  h5p_retry_header: "Opnieuw proberen?",
  h5p_retry_body: "Weet je zeker dat je het opnieuw wilt proberen?",
  h5p_retry_confirm_label: "Bevestigen",
  h5p_resume: "Hervatten",
  h5p_audio_direction: "Audio-richting",
  h5p_a11y_check: "Controleer de antwoorden. De antwoorden worden gemarkeerd als correct, incorrect of onbeantwoord.",
  h5p_a11y_show_solution: "Toon de oplossing. De taak wordt gemarkeerd met de juiste oplossing.",
  h5p_a11y_retry: "Probeer de taak opnieuw. Reset alle antwoorden en begin de taak opnieuw.",

  // Kruiswoordraadsel (Crossword)
  h5p_crossword_across: "Horizontaal",
  h5p_crossword_down: "Verticaal",
  h5p_crossword_extra_clue: "Extra aanwijzing",

  // Samenvatting (Summary)
  h5p_summary_intro: "Kies de juiste bewering.",
  h5p_summary_solved_label: "Voortgang:",
  h5p_summary_score_label: "Foutieve antwoorden:",
  h5p_summary_result_label: "Jouw resultaat",
  h5p_summary_feedback: "Je hebt @score van de @total beweringen correct (@percent%).",
  h5p_summary_label_correct: "Correct.",
  h5p_summary_label_incorrect: "Incorrect! Probeer het opnieuw.",
  h5p_summary_label_correct_answers: "Correcte antwoorden.",
  h5p_summary_progress_text: "Voortgang :num van :total",
  h5p_summary_alternative_incorrect_label: "Incorrect",

  // Woorden slepen (Drag the Words)
  h5p_drag_words_score_feedback: "Score: @score van @total.",
  h5p_drag_words_correct_text: "Correct!",
  h5p_drag_words_incorrect_text: "Incorrect!",

  // Invultekst (Fill in the Blanks)
  h5p_blanks_not_filled_out: "Vul a.u.b. alle gaten in.",
  h5p_blanks_answer_is_correct: "&#039;:ans&#039; is correct",
  h5p_blanks_answer_is_wrong: "&#039;:ans&#039; is incorrect",
  h5p_blanks_answered_correctly: "Correct beantwoord",
  h5p_blanks_answered_incorrectly: "Incorrect beantwoord",
  h5p_blanks_solution_label: "Correct antwoord:",
  h5p_blanks_input_label: "Input @num van @total",
  h5p_blanks_input_has_tip_label: "Hint beschikbaar",
  h5p_blanks_feedback: "Je hebt @score van de @total gaten correct ingevuld.",
  h5p_blanks_checking_mode_header: "Controlemodus",

  // Woorden markieren (Mark the Words)
  h5p_mark_words_correct_answer: "Correct!",
  h5p_mark_words_incorrect_answer: "Incorrect!",
  h5p_mark_words_missed_answer: "Gemist!",
  h5p_mark_words_display_solution_description: "Taak is bijgewerkt met de oplossing.",
  h5p_mark_words_a11y_full_text_label: "Volledige leesbare tekst",
  h5p_mark_words_a11y_clickable_text_label: "Volledige tekst waarin woorden gemarkeerd kunnen worden",
  h5p_mark_words_a11y_solution_mode_header: "Oplossing-modus",
  h5p_mark_words_a11y_checking_header: "Controlemodus",

  // Flitskaarten (Flashcards)
  h5p_flashcards_progress_text: "Kaart @card van @total",
  h5p_flashcards_your_answer: "Jouw antwoord",
  h5p_flashcards_correct_answer: "Correct antwoord",
  h5p_flashcards_incorrect_answer: "Fout antwoord",
  h5p_flashcards_show_solution: "Correct antwoord",
  h5p_flashcards_results: "Resultaten",
  h5p_flashcards_of_correct: "@score van de @total correct",
  h5p_flashcards_show_results: "Resultaten tonen",
  h5p_flashcards_answer_short: "A:",
  h5p_flashcards_card_announcement: "Fout antwoord. Correct antwoord was @answer",
  h5p_flashcards_correct_announcement: "@answer is correct.",
  h5p_flashcards_page_announcement: "Pagina @current van @total",

  // Essay
  h5p_essay_feedbackHeader: "Feedback",
  h5p_essay_solutionTitle: "Voorbeeldoplossing",
  h5p_essay_remainingChars: "Resterende tekens: @chars",
  h5p_essay_notEnoughChars: "Je moet minimaal @chars tekens invoeren!",
  h5p_essay_messageSave: "opgeslagen",
  h5p_essay_placeholderText: "Begin hier met schrijven...",
  h5p_essay_ariaYourResult: "Je hebt @score van @total punten behaald",
  h5p_essay_ariaNavigatedToSolution: "Genavigeerd naar voorbeeldoplossing na het tekstveld.",

  // Waar/Niet waar (True/False)
  h5p_true_false_true_text: "Waar",
  h5p_true_false_false_text: "Niet waar",
  h5p_true_false_wrong_answer_message: "Verkeerd antwoord",
  h5p_true_false_correct_answer_message: "Correct antwoord",

  // Woordzoeker (Find the Words)
  h5p_find_words_found: "@found van de @totalWords woorden gevonden",
  h5p_find_words_time_spent: "Verlopen tijd",
  h5p_find_words_word_list_header: "Woordenlijst",
  h5p_find_words_fill_pool: "abcdefghijklmnopqrstuvwxyz",

  // Paragrafen sorteren (Sort the Paragraphs)
  h5p_sort_paragraphs_up: "Omhoog",
  h5p_sort_paragraphs_down: "Omlaag",
  h5p_sort_paragraphs_disabled: "Uitgeschakeld",
  h5p_sort_paragraphs_paragraph: "Paragraaf",
  h5p_sort_paragraphs_point: "@score punt",
  h5p_sort_paragraphs_seven_of_nine: "@current van @total",
  h5p_sort_paragraphs_current_position: "Huidige positie in lijst",
  h5p_sort_paragraphs_instructions_selected: "Druk op de spatiebalk om te herordenen",
  h5p_sort_paragraphs_instructions_grabbed: "Gebruik pijltjes omhoog/omlaag om positie te wijzigen, spatiebalk om neer te zetten, escape om te annuleren",
  h5p_sort_paragraphs_grabbed: "Gepakt",
  h5p_sort_paragraphs_moved: "Verplaatst",
  h5p_sort_paragraphs_dropped: "Neergezet",
  h5p_sort_paragraphs_reorder_cancelled: "Herordenen geannuleerd",
  h5p_sort_paragraphs_final_position: "Eindpositie",
  h5p_sort_paragraphs_next_paragraph: "Volgende paragraaf",
  h5p_sort_paragraphs_correct_paragraph: "Correcte paragraaf op positie",
  h5p_sort_paragraphs_list_description: "Sorteerbare lijst van paragrafen.",
  h5p_sort_paragraphs_list_description_check: "Lijst van paragrafen met resultaten.",
  h5p_sort_paragraphs_list_description_solution: "Lijst van paragrafen met oplossingen.",

  // Single Choice Set
  h5p_single_choice_solution_view_title: "Oplossing",
  h5p_single_choice_mute_button_label: "Dempen",
  h5p_single_choice_slide_of_total: "Dia @slide van @total",
  h5p_single_choice_solution_list_question_number: "Vraag @question",
  h5p_single_choice_should_select: "Zou geselecteerd moeten zijn",
  h5p_single_choice_should_not_select: "Zou niet geselecteerd moeten zijn",

  // Dialoogkaarten (Dialog Cards)
  h5p_dialog_cards_answer: "Omdraaien",
  h5p_dialog_cards_progress_text: "Kaart @card van @total",
  h5p_dialog_cards_card_front_label: "Voorkant kaart",
  h5p_dialog_cards_card_back_label: "Achterkant kaart",
  h5p_dialog_cards_audio_not_supported: "Je browser ondersteunt dit audioformaat niet",
  h5p_dialog_cards_correct_answer: "Ik had het goed!",
  h5p_dialog_cards_incorrect_answer: "Ik had het fout",
  h5p_dialog_cards_round: "Ronde @round",
  h5p_dialog_cards_cards_left: "Resterende kaarten: @number",
  h5p_dialog_cards_next_round: "Ga naar ronde @round",
  h5p_dialog_cards_start_over: "Opnieuw proberen",
  h5p_dialog_cards_show_summary: "Volgende",
  h5p_dialog_cards_summary: "Samenvatting",
  h5p_dialog_cards_summary_cards_right: "Kaarten die je goed had:",
  h5p_dialog_cards_summary_cards_wrong: "Kaarten die je fout had:",
  h5p_dialog_cards_summary_cards_not_shown: "Kaarten niet getoond:",
  h5p_dialog_cards_summary_overall_score: "Totale score",
  h5p_dialog_cards_summary_cards_completed: "Kaarten die je hebt geleerd:",
  h5p_dialog_cards_summary_completed_rounds: "Voltooide rondes:",
  h5p_dialog_cards_summary_all_done: "Goed gedaan! Je hebt alle @cards kaarten @max keer achter elkaar voltooid!",

  // Quiz Set
  h5p_quiz_textual_progress: "Vraag @current van @total",
  h5p_quiz_no_result_message: "Voltooid",
  h5p_quiz_result_message: "Jouw resultaten:",
  h5p_quiz_feedback_available: "Feedback beschikbaar",
  h5p_quiz_read_feedback: "Feedback lezen",
  h5p_quiz_wrong_answer: "Fout antwoord",
  h5p_quiz_correct_answer: "Correct antwoord",
  h5p_quiz_should_check: "Had aangevinkt moeten zijn",
  h5p_quiz_should_not_check: "Had niet aangevinkt moeten zijn",
  h5p_quiz_no_input: "Beantwoord de vraag a.u.b. voordat je de oplossing bekijkt.",

  // ============================================================================
  // === JURIDISCHE INFORMATIE - VOETTEKST ===
  // ============================================================================
  license_info: "GNU GPL v3.0 of later",
  ticket: "Ticket",
  legal_mentions: "Juridische informatie",
  legal_title: "Juridische informatie",
  legal_editor_title: "Uitgever van de applicatie",
  legal_editor_gauthier_remande: "<strong>Gauthier REMANDE</strong>",
  legal_editor_gauthier_remande_function: "<strong>Functie:</strong> Docent (PLP) Letteren-Geschiedenis",
  legal_editor_gauthier_remande_email: "<strong>E-mail:</strong> gauthier.remande@ac-nantes.fr",
  legal_editor_gauthier_remande_address: "<strong>Adres:</strong> 39 avenue de Chanzy, 53000 Laval, Frankrijk",
  legal_editor_gauthier_remande_phone: "<strong>Telefoon:</strong> +33 2 43 67 24 00",
  legal_editor_emmanuel_gaunard: "<strong>Emmanuel GAUNARD</strong>",
  legal_editor_emmanuel_gaunard_function: "<strong>Functie:</strong> Wiskundedocent en projectmedewerker DRANE – Academie van Grenoble",
  legal_editor_emmanuel_gaunard_email: "<strong>E-mail:</strong> emmanuel.gaunard@ac-grenoble.fr",
  legal_editor_emmanuel_gaunard_address: "<strong>Adres:</strong> 30 boulevard de la République, 38200 Vienne, Frankrijk",
  legal_editor_emmanuel_gaunard_phone: "<strong>Telefoon:</strong> +33 6 46 74 20 94",
  legal_app_description: "De webapplicatie « Caramel » is een vrij, niet-commercieel project bedoeld voor het creëren van H5P- en Éléa-content. Er is geen account vereist en er worden geen persoonlijke gegevens verzameld.",
  legal_hosting_title: "Hosting",
  legal_host_name: "<strong>Host</strong>: Forge des Communs Numériques Éducatifs",
  legal_host_company: "<strong>Bedrijfsnaam</strong>: Ministerie van Nationale Opvoeding en Jeugd",
  legal_host_address: "<strong>Adres</strong>: 110 rue de Grenelle, 75007 Parijs, Frankrijk",
  legal_host_phone: "<strong>Telefoon</strong>: +33 1 55 55 10 10",
  legal_publication_director_title: "Verantwoordelijke voor de publicatie",
  legal_publication_director_name: "Gauthier REMANDE en Emmanuel GAUNARD, in de hoedanigheid van vrijwillige uitgevers.",
  legal_terms_of_use_title: "Algemene gebruiksvoorwaarden",
  legal_terms_of_use_content: "Deze site stelt gebruikers in staat om H5P- en Éléa-content te genereren. De weergave vindt lokaal plaats, zonder verzending van gebruikersgegevens. De gebruiker is als enige verantwoordelijk voor het gebruik van de gegenereerde content. De applicatie wordt gratis aangeboden, zonder enige garantie op werking of resultaat. De uitgever wijst alle verantwoordelijkheid af in geval van verkeerde interpretatie van de content of ongepast gebruik.",
  legal_intellectual_property_title: "Intellectueel eigendom",
  legal_intellectual_property_content: "Alle broncodes, grafische elementen en inhoud vallen onder de vrije licentie GNU AGPLv3. Hergebruik is toegestaan onder de voorwaarden van hun respectievelijke licentie. Bij elke herdistributie of wijziging moeten de oorspronkelijke auteurs worden vermeld: Gauthier REMANDE en Emmanuel GAUNARD. Afbeeldingen die in de H5P-modules worden gebruikt, zijn afkomstig van de site H5P.org.",
  legal_personal_data_title: "Persoonsgegevens",
  legal_personal_data_content: "Er worden geen persoonsgegevens verzameld of opgeslagen. Er worden geen trackingcookies gebruikt.",
  legal_ai_models_title: "Artificiële Intelligentie-modellen",
  legal_ai_models_content: "De applicatie Caramel maakt, uitsluitend bij generatie in één klik, gebruik van AI-modellen beheerd door ILAAS, een federatie van gedeelde AI-infrastructuren. Aanvragen worden verzonden via een n8n-workflow gehost door de Incubateur, en vervolgens doorgestuurd naar ILAAS voor uitvoering op vertrouwde servers in gecertificeerde datacenters van het Hoger Onderwijs en Onderzoek (ESR). Caramel voert de modellen niet zelf uit en verwerkt of slaat geen eigen gegevens op; gegevens worden uitsluitend gebruikt om de aanvraag uit te voeren en worden niet verzonden naar consumenten-AI's. De momenteel aangeboden modellen omvatten {{llm_model_1_name}} ({{llm_model_1_param}} {{llm_model_parameters_unit}}), {{llm_model_2_name}} ({{llm_model_2_param}} {{llm_model_parameters_unit}}) en {{llm_model_3_name}} ({{llm_model_3_param}} {{llm_model_parameters_unit}}). De modaliteiten voor hosting, logging en bewaring die eventueel door ILAAS worden uitgevoerd, vallen onder hun privacybeleid en servicevoorwaarden, waarnaar verwezen wordt.",
  legal_user_requests_processing_title: "Verwerking van gebruikersaanvragen via n8n en de Incubateur van het Ministerie van Nationale Opvoeding",
  legal_user_requests_processing_content: "Onze site maakt gebruik van een technische oplossing ontwikkeld door n8n, een open-source tool gehost door de Incubateur van het Ministerie van Nationale Opvoeding. Deze dienst maakt het mogelijk om via een geautomatiseerde workflow gebruikersaanvragen om te zetten in gestructureerde gegevens (JSON-formaat) om te communiceren met een soevereine AI van de DINUM. Er wordt geen gevoelige informatie blootgesteld of verzonden zonder versleuteling, wat de vertrouwelijkheid en veiligheid van de uitwisselingen waarborgt.",
  legal_accessibility_title: "Toegankelijkheid",
  legal_accessibility_content: "De applicatie is ontworpen om compatibel te zijn met computergebruik, inclusief donkere/lichte modi, toetsenbordnavigatie en hoog contrast volgens de thema's. Er wordt voortdurend gewerkt aan verbetering van de toegankelijkheid, in lijn met de RGAA-aanbevelingen.",
  legal_applicable_law_title: "Toepasselijk recht",
  legal_applicable_law_content: "Deze site is onderworpen aan het Franse recht. In geval van geschillen zijn de bevoegde rechtbanken die van het ressort Lyon.",
  legal_external_libraries_title: "Gebruikte externe bibliotheken",
  legal_external_libraries_intro: "De applicatie Caramel gebruikt verschillende open-source bibliotheken onder de volgende licenties:",
  legal_library_fontawesome: "<strong>Font Awesome Free</strong> (Licentie: CC BY 4.0, SIL OFL 1.1, MIT): Levert de iconen die in de interface worden gebruikt om navigatie en visuele ervaring te verbeteren.",
  legal_library_jszip: "<strong>JSZip</strong> (Licentie: MIT of GPLv3): Maakt het mogelijk om .h5p-bestanden te maken door de benodigde inhoud in een zip-archief te comprimeren.",
  legal_library_clientzip: "<strong>client-zip</strong> (Licentie: MIT): Een andere bibliotheek voor bestandscompressie, die een krachtig alternatief biedt voor het direct in de browser genereren van .h5p-archieven.",
  legal_library_fflate: "<strong>fflate</strong> (Licentie: MIT): Zeer snelle bibliotheek voor compressie en decompressie van gegevens, gebruikt voor het maken van .mbz-archieven voor Moodle-modules.",
  legal_library_tarjs: "<strong>tar-js</strong> (Licentie: MIT): Maakt het mogelijk om .tar-archieven te maken, een noodzakelijke stap voor compressie tot .mbz-bestanden voor Moodle-modules.",
  legal_library_mammoth: "<strong>Mammoth</strong> (Licentie: BSD 2-Clause): Maakt het converteren van Word-documenten (.docx) naar HTML mogelijk, wat het importeren van content uit Microsoft Word-bestanden vergemakkelijkt.",
  legal_library_pdfjs: "<strong>PDF.js</strong> (Licentie: Apache 2.0): Maakt het mogelijk om tekst direct uit PDF-bestanden te extraheren in de browser, zonder serververwerking.",
  legal_library_tesseract: "<strong>Tesseract.js</strong> (Licentie: Apache 2.0): Engine voor optische tekenherkenning (OCR) waarmee tekst uit afbeeldingen (PNG, JPG, JPEG) en gescande PDF-documenten kan worden geëxtraheerd.",
  legal_library_mathjax: "<strong>MathJax</strong> (Licentie: Apache 2.0): Gebruikt voor het weergeven van wiskundige formules (LaTeX) in voorbeelden.",
  legal_library_h5p_standalone: "<strong>H5P Standalone</strong> (Licentie: MIT): Maakt het mogelijk H5P-inhoud direct in de browser te bekijken zonder server of CMS (zoals Moodle of WordPress).",
  legal_library_jspdf: "<strong>jsPDF</strong> (Licentie: MIT): JavaScript-bibliotheek voor het direct genereren van PDF-documenten in de browser, gebruikt voor het exporteren van educatieve inhoud naar PDF-formaat.",
  legal_library_jspdf_autotable: "<strong>jsPDF-autotable</strong> (Licentie: MIT): Extensie voor jsPDF die het genereren van gestructureerde tabellen in geëxporteerde PDF-documenten mogelijk maakt.",
  legal_library_docx: "<strong>docx</strong> (Licentie: MIT): JavaScript-bibliotheek voor het maken van Word-documenten (.docx) in de browser, gebruikt voor het exporteren van educatieve inhoud naar Microsoft Word-formaat.",
  legal_library_ownership: "Elke bibliotheek blijft eigendom van de respectievelijke auteurs en wordt gebruikt in overeenstemming met de bijbehorende licentie(s).",

  // ============================================================================
  // === MELDINGEN ===
  // ============================================================================
  no_notifications: "Geen meldingen",
  clear_all: "Alles wissen",
  view: "Bekijken",
  today: "Vandaag",
  error: "Fout",
  download: "Downloaden",
  edit_content: "Bewerken",
  compatible_with: "Compatibel met:",
  preview_placeholder: "Voorbeeld binnenkort beschikbaar",
  previous: "Vorige",
  next: "Volgende",
  close_modal: "Sluiten",
  loading: "Laden...",
  preview_error: "Kan geen voorbeeld van dit bestand weergeven",
  simulator_warning: "Voorbeeld via de activiteitssimulator: de uiteindelijke weergave op Éléa kan enigszins afwijken.",
  editor_confirm_close_title: "Niet-opgeslagen wijzigingen",
  editor_confirm_close_message: "Wilt u uw wijzigingen opslaan voordat u afsluit?",
  editor_confirm_close_cancel: "In editor blijven",
  editor_confirm_close_save: "Opslaan en afsluiten",
  editor_confirm_close_discard: "Afsluiten zonder opslaan",

  // JSON Editor
  editor_title_prefix: "Bewerken:",
  editor_loading: "Editor laden...",
  editor_unknown_type: "Niet-herkend inhoudstype",
  editor_no_schema: "Schema niet beschikbaar voor dit type",
  editor_init_error: "Fout bij het initialiseren van de editor",
  editor_save: "Opslaan",
  editor_cancel: "Annuleren",
  editor_unsaved_changes: "Niet-opgeslagen wijzigingen",
  editor_confirm_discard: "Weet u zeker dat u wilt annuleren? Niet-opgeslagen wijzigingen gaan verloren.",
  editor_validation_errors: "Validatiefouten",

  // Secties
  editor_section_general: "Algemene informatie",
  editor_section_question: "Vraag",
  editor_section_questions: "Vragen",
  editor_section_answers: "Antwoorden",
  editor_section_answer: "Antwoord",
  editor_section_feedback: "Feedback",
  editor_section_cards: "Kaarten",
  editor_section_sentences: "Zinnen",
  editor_section_events: "Gebeurtenissen",
  editor_section_words: "Woorden",
  editor_section_keywords: "Trefwoorden",
  editor_section_entries: "Items",
  editor_section_pairs: "Paren",
  editor_section_text: "Tekst",

  // Algemene velden
  editor_title: "Titel",
  editor_description: "Beschrijving",
  editor_description_hint: "Instructie voor leerlingen",
  editor_intro: "Inleiding",
  editor_task_description: "Opdracht",
  editor_question_text: "Vraagtekst",

  // Kaarten
  editor_card: "Kaart",
  editor_card_front: "Voorkant",
  editor_card_front_placeholder: "Vraag of term",
  editor_card_back: "Achterkant",
  editor_card_back_placeholder: "Antwoord of definitie",
  editor_card_tip: "Tip",
  editor_add_card: "Kaart toevoegen",

  // Antwoorden
  editor_answer: "Antwoord",
  editor_answer_text: "Antwoordtekst",
  editor_is_correct: "Correct",
  editor_add_answer: "Antwoord toevoegen",

  // Tips & Feedback
  editor_tips_feedback: "Tips en feedback",
  editor_tip: "Tip",
  editor_tip_optional: "Tip (optioneel)",
  editor_tips_optional: "Tips (optioneel)",
  editor_tip_front: "Tip voorkant",
  editor_tip_back: "Tip achterkant",
  editor_chosen_feedback: "Feedback indien geselecteerd",
  editor_not_chosen_feedback: "Feedback indien niet geselecteerd",
  editor_feedback_correct: "Feedback indien correct",
  editor_feedback_wrong: "Feedback indien onjuist",
  editor_overall_feedback: "Algemene feedback per score",

  // Feedbackbereiken
  editor_feedback_ranges_label: "Feedback op basis van score",
  editor_feedback_placeholder: "Feedbackbericht voor dit bereik...",
  editor_add_range: "Bereik toevoegen",

  // Waar/Onwaar
  editor_correct_answer: "Correct antwoord",
  editor_true: "Waar",
  editor_false: "Onwaar",

  // Gaten invullen / Woorden slepen
  editor_sentence: "Zin",
  editor_sentence_text: "Zintekst",
  editor_add_sentence: "Zin toevoegen",
  editor_blanks_hint: "Omring de te raden woorden met *sterretjes*",
  editor_text_with_blanks: "Tekst met in te vullen woorden",
  editor_drag_words_hint: "Woorden tussen *sterretjes* worden sleepelementen",

  // Tijdlijn
  editor_event: "Gebeurtenis",
  editor_add_event: "Gebeurtenis toevoegen",
  editor_start_date: "Begindatum",
  editor_end_date: "Einddatum",
  editor_event_title: "Titel van de gebeurtenis",
  editor_event_description: "Beschrijving",
  editor_event_tag: "Label",

  // Kruiswoordraadsel
  editor_word: "Woord",
  editor_add_word: "Woord toevoegen",
  editor_clue: "Hint/Definitie",
  editor_orientation: "Oriëntatie",
  editor_horizontal: "Horizontaal",
  editor_vertical: "Verticaal",
  editor_crossword_answer_hint: "Het woord in hoofdletters",

  // Essay
  editor_keyword: "Trefwoord",
  editor_keyword_text: "Verwacht trefwoord",
  editor_keyword_weight: "Weging",
  editor_add_keyword: "Trefwoord toevoegen",

  // Glossarium
  editor_entry: "Item",
  editor_add_entry: "Item toevoegen",
  editor_term: "Term",
  editor_definition: "Definitie",

  // Moodle
  editor_question: "Vraag",
  editor_add_question: "Vraag toevoegen",
  editor_pair: "Paar",
  editor_add_pair: "Paar toevoegen",
  editor_left_element: "Linkerelement",
  editor_right_element: "Rechterelement",
  editor_choice: "Keuze",
  editor_choice_text: "Keuzetekst",
  editor_add_choice: "Keuze toevoegen",

  // Acties items
  editor_add_item: "Toevoegen",
  editor_drag: "Slepen",
  editor_duplicate: "Dupliceren",
  editor_delete: "Verwijderen",
  editor_confirm_delete: "Weet u zeker dat u dit item wilt verwijderen?",
  editor_min_items_reached: "Minimum aantal items bereikt",
  editor_max_items_reached: "Maximum aantal items bereikt",

  // Validatiefouten
  editor_error_required: "Dit veld is verplicht",
  editor_error_min_length: "Minimaal {0} tekens",
  editor_error_max_length: "Maximaal {0} tekens",
  editor_error_pattern: "Ongeldig formaat",
  editor_error_min_items: "Minimaal {0} item(s)",
  editor_error_max_items: "Maximaal {0} item(s)",
  editor_error_number: "Moet een getal zijn",
  editor_error_min: "Minimum {0}",
  editor_error_max: "Maximum {0}",
  editor_error_feedback_ranges: "Bereiken moeten 0-100% beslaan zonder overlap",
  editor_error_no_correct: "Ten minste één antwoord moet correct zijn",
  editor_error_date_format: "Ongeldig datumformaat (verwacht: JJJJ,M,D)",
  editor_error_no_blanks: "De tekst moet ten minste één woord tussen *sterretjes* bevatten",

  // QuizSet
  editor_library_type: "Bibliotheektype",
  editor_question_title: "Vraagtitel",
  editor_question_params: "Vraagparameters",
  editor_parameters: "Parameters",

  // Kruiswoordraadsel
  editor_extra_clue: "Extra hint",

  // FindTheWords
  editor_word_list: "Woordenlijst",

  // SingleChoiceSet
  editor_answers: "Mogelijke antwoorden",

  // MarkTheWords
  editor_text_with_marks: "Tekst met te markeren woorden",
  editor_mark_words_hint: "Omring de te markeren woorden met *sterretjes*",

  // SortParagraphs
  editor_section_paragraphs: "Paragrafen",
  editor_paragraph: "Paragraaf",
  editor_add_paragraph: "Paragraaf toevoegen",
  editor_paragraph_text: "Paragraaftekst",

  // Summary
  editor_section_summaries: "Samenvattingen",
  editor_summary_item: "Samenvattingselement",
  editor_add_summary_item: "Element toevoegen",
  editor_statement: "Bewering",
  editor_add_statement: "Bewering toevoegen",
  editor_statement_text: "Beweringstekst",

  // Moodle Test
  editor_question_type: "Vraagtype",

  // Moodle Page
  editor_section_blocks: "Blokken",
  editor_block: "Blok",
  editor_add_block: "Blok toevoegen",
  editor_block_type: "Bloktype",
  editor_block_content: "Blokinhoud",

  // Specifieke Éléa-activiteiten
  // Glossarium
  editor_glossary_name: "Naam glossarium",

  // Millionnaire
  editor_good_answer: "Correct antwoord",
  editor_bad_answers: "Onjuiste antwoorden",
  editor_bad_answer: "Onjuist antwoord",
  editor_add_bad_answer: "Onjuist antwoord toevoegen",

  // Test (vragenbank)
  editor_bank_name: "Naam vragenbank",
  editor_bank_description: "Beschrijving vragenbank",
  editor_question_name: "Vraagnaam",
  editor_question_feedback: "Algemene feedback",
  editor_answer_fraction: "Punten/Score",
  editor_answer_feedback: "Feedback op antwoord",
  editor_subquestion: "Subvraag",
  editor_add_subquestion: "Subvraag toevoegen",
  editor_numerical_value: "Numerieke waarde",
  editor_numerical_tolerance: "Tolerantie",
  editor_section_subquestions: "Subvragen",
  editor_section_content: "Inhoud",
  editor_feedback_if_true: "Feedback indien waar",
  editor_feedback_if_false: "Feedback indien onwaar",

  // Berichten
  editor_save_success: "Wijzigingen opgeslagen",
  editor_save_error: "Fout bij opslaan",
  editor_regenerating: "Bestand opnieuw genereren...",

  // ============================================================================
  // === DOCUMENT FORMATTER ===
  // ============================================================================

  // --- Global Info ---
  doc_fmt_header_title: "Caramel - Educational Resource",
  doc_fmt_generation_date: "Generation Date: ",
  doc_fmt_footer_text: "Document generated with Caramel (https://caramel.forge.apps.education.fr/)",
  doc_fmt_page_title: "Pagina",
  doc_fmt_summary_header: "Inhoudsopgave",
  doc_fmt_quiz_title: "Quiz",
  doc_fmt_instructions: "📝 Instructies: Beantwoord de volgende vragen.",
  doc_fmt_question_header: "Vraag",

  // --- Shared properties ---
  doc_fmt_type: "Type:",
  doc_fmt_feedbacks: "💬 Feedbacks:",
  doc_fmt_global_feedbacks: "Globale feedbacks",
  doc_fmt_answers: "Antwoorden:",
  doc_fmt_correct_answer_true: "Correct antwoord: WAAR ✓",
  doc_fmt_correct_answer_false: "Correct antwoord: ONWAAR ✓",
  doc_fmt_text_if_true: "Tekst indien waar:",
  doc_fmt_text_if_false: "Tekst indien onwaar:",
  doc_fmt_text_with_answers: "Tekst met antwoorden:",
  doc_fmt_text_with_marks: "Tekst met te markeren woorden:",
  doc_fmt_marks_to_find: "Te markeren woorden:",
  doc_fmt_keywords_expected: "Verwachte trefwoorden:",
  doc_fmt_accepted_answers: "Geaccepteerde antwoorden:",
  doc_fmt_text_to_complete: "Aan te vullen tekst:",
  doc_fmt_also_called: "🏷️ Ook genoemd:",
  doc_fmt_image_not_found: "⚠️ [Afbeelding niet gevonden]",

  // --- Activity-Specific ---
  doc_fmt_flashcards_title: "Flitskaarten",
  doc_fmt_card_index: "Kaart",
  doc_fmt_card_front: "Voorkant:",
  doc_fmt_card_back: "Achterkant:",
  doc_fmt_hint: "💡 Tip:",
  doc_fmt_crossword_title: "Kruiswoordraadsel",
  doc_fmt_definitions_and_answers: "Definities en antwoorden",
  doc_fmt_answer: "Antwoord:",
  doc_fmt_extra_hint: "💡 Extra tip:",
  doc_fmt_timeline_events: "Gebeurtenissen",
  doc_fmt_timeline_periods: "Perioden",
  doc_fmt_drag_the_words_title: "Sleep de woorden",
  doc_fmt_fill_in_the_blanks_title: "Vul de gaten in",
  doc_fmt_mark_the_words_title: "Markeer de woorden",
  doc_fmt_glossary_title: "Begrippenlijst",
  doc_fmt_term_index: "Term",
  doc_fmt_chart_title: "Diagram",
  doc_fmt_data: "Gegevens",
  doc_fmt_summary_title: "Samenvatting",
  doc_fmt_claim_index: "Bewering",
  doc_fmt_multiple_choice_title: "Meerkeuzevraag",
  doc_fmt_single_choice_set_title: "Set van enkelvoudige keuzevragen",
  doc_fmt_true_false_title: "Waar/Onwaar vraag",
  doc_fmt_dialog_cards_title: "Dialoogkaarten",
  doc_fmt_hint_front: "💡 Tip (voorkant):",
  doc_fmt_hint_back: "💡 Tip (achterkant):",
  doc_fmt_sort_paragraphs_title: "Paragrafen ordenen",
  doc_fmt_paragraphs_ordered: "Paragrafen in de juiste volgorde",
  doc_fmt_find_the_words_title: "Woordzoeker",
  doc_fmt_words_to_find: "Te vinden woorden",
  doc_fmt_matching_title: "Koppelen",
  doc_fmt_matching_instructions: "📝 Instructies: Combineer elk item met het bijbehorende item.",
  doc_fmt_pairs_to_match: "Te koppelen paren",
  doc_fmt_millionnaire_title: "Wie wordt miljonair?",
  doc_fmt_millionnaire_instructions: "📝 Instructies: Zoek het juiste antwoord uit de vier opties.",

  // --- Moodle / Quiz Types ---
  doc_fmt_essay_title: "Open vraag",
  doc_fmt_qcm_title: "QCM",
  doc_fmt_moodle_test_title: "Test",
  doc_fmt_associations: "Associaties:",

  // --- Question Types Labels ---
  doc_fmt_type_multichoice: "Meerkeuze (QCM)",
  doc_fmt_type_matching: "Koppelen",
  doc_fmt_type_numerical: "Numeriek",
  doc_fmt_type_truefalse: "Waar/Onwaar",
  doc_fmt_type_shortanswer: "Kort antwoord",
  doc_fmt_type_cloze: "Tekst aanvullen (Cloze)",
  doc_fmt_type_blanks: "Vul de gaten in",
  doc_fmt_type_dragtext: "Sleep de woorden",
  doc_fmt_type_markwords: "Markeer de woorden",
  doc_fmt_type_essay: "Open vraag",
  doc_fmt_type_default: "Vraag",

  // Nieuwe sleutels voor de pedagogische structuur stelling/correctie
  doc_fmt_correction_title: "Correctie",
  doc_fmt_proposed_answers: "Voorstellen:",
  doc_fmt_correct_answer: "Correct antwoord",
  doc_fmt_correct_answers: "Correcte antwoorden:",
  doc_fmt_true: "Waar",
  doc_fmt_false: "Onwaar",
  doc_fmt_words_to_place: "Woorden om te plaatsen:",
  doc_fmt_completed_text: "Voltooid tekst:",
  doc_fmt_text_to_mark: "Tekst waarin de woorden moeten worden gevonden:",
  doc_fmt_words_count_to_find: "Aantal te vinden woorden",
  doc_fmt_words_to_mark: "Te markeren woorden:",
  doc_fmt_answer_space: "Ruimte voor antwoord:",
  doc_fmt_open_answer: "Open antwoord - evaluatie volgens criteria gedefinieerd door de docent.",
  doc_fmt_definitions: "Definities",
  doc_fmt_letters: "letters",
  doc_fmt_summary_instructions: "Kies voor elke groep de juiste stelling.",
  doc_fmt_sort_instructions: "Zet de volgende paragrafen in de juiste volgorde.",
  doc_fmt_paragraphs_to_sort: "Te sorteren paragrafen",
  doc_fmt_correct_order: "Juiste volgorde",
  doc_fmt_find_instructions: "Vind",
  doc_fmt_hidden_words: "verborgen woorden in het rooster.",
  doc_fmt_hints: "Hints",
  doc_fmt_flashcards_instructions: "Zoek voor elke kaart het antwoord dat bij de vraag hoort.",
  doc_fmt_elements_to_match: "Te koppelen elementen:",
  doc_fmt_possible_matches: "Mogelijke overeenkomsten:",
  doc_fmt_correct_associations: "Correcte associaties:",

};