<!--
Kennisbank van Caramelia (pedagogische assistente van Caramel).
Dit bestand is REFERENTIEDOCUMENTATIE, geen systeemprompt.
Er mogen geen instructies voor het LLM aan worden toegevoegd.

BEWERKINGSREGEL: alle hieronder genoemde labels (knoppen, tabbladen,
velden, secties) moeten EXACT de tekst weergeven die in de Caramel-UI
zichtbaar is. Enige bron van waarheid: js/locales/nl.json + index.html.
Elke wijziging gebeurt via een PR.
-->
---
version: 1.3.0
lang: nl
audience: leerkrachten
---

# Caramel-tutorial

Caramel is een opensource webtool die leerkrachten helpt
interactieve educatieve activiteiten (H5P, Éléa, Magistère, Moodle)
te maken met behulp van AI. De site werkt 100 % aan de browserzijde:
er worden geen pedagogische gegevens naar een externe server gestuurd.

## Beschrijf uw behoefte (bovenaan de pagina)

Bovenaan de pagina kunt u via twee tabbladen kiezen hoe u uw
behoefte beschrijft:

- **Snelmodus** — minimaal formulier, twee velden.
- **Geavanceerde modus** — dezelfde velden plus extra opties,
  waaronder de mogelijkheid om documenten bij te voegen.

### Snelmodus

Slechts twee velden:

- **„Wie bent u? (bijv. Leraar, trainer...)"**
- **„Wat wilt u behandelen? (bijv. De Franse Revolutie...)"**

### Geavanceerde modus

Dezelfde velden als de Snelmodus, plus:

- **„Niveau (bijv. Middelbaar onderwijs)"**
- **„Aantal vragen/elementen in de module (bijv. 5)"** — afhankelijk
  van de activiteit komt dit overeen met het aantal vragen, datums
  op een tijdlijn, woorden in een woordenlijst, enz.
- Een vrij veld voor **aanvullende informatie**
  (specifieke instructies, beperkingen of andere relevante details).

### Documenten bijvoegen (optioneel) — alleen in Geavanceerde modus

Deze sectie, met de titel **„Documenten bijvoegen (optioneel)"**,
verschijnt alleen wanneer het tabblad **Geavanceerde modus** is
geselecteerd. Hiermee kunt u de generatie baseren op een door u
aangeleverde inhoud.

Drie mogelijkheden:

- **Een tekst kopiëren en plakken** rechtstreeks in het invoerveld.
- **Een document slepen en neerzetten** (of klikken op
  **„Kies een bestand"**) in **PDF-, TXT-, DOCX-, PPTX-, ODT-, ODP-,
  PNG-, JPEG-formaat** (de afbeeldingsformaten **WebP** en **BMP** worden ook aanvaard, zonder op het scherm vermeld te staan). Een neergezette **afbeelding** (foto, schema, diagram…) wordt **geanalyseerd door een vision-AI** die er een **beschrijving** van opstelt en **de tekst die erin staat getrouw overneemt** — als de AI niet beschikbaar is, neemt het lokale uitlezen (OCR) automatisch over. U kunt ook een **audiobestand** (MP3, M4A, WAV…) of een **video** (MP4, MOV…) neerzetten: alleen het geluid wordt dan automatisch getranscribeerd (door Albert, de soevereine dienst van de DINUM; zie privacy hieronder). Het sleepgebied draagt het label
  **„Sleep een of meer documenten hierheen (PDF, TXT, DOCX, PPTX, ODT, ODP, PNG,
  JPEG)"** met als scheidingsteken **„of"**.
- **Een webpagina importeren** : plak de link (`https://…`) in het
  veld onder de uploadzone en klik vervolgens op **„Toevoegen"**. De
  tekst van de pagina wordt automatisch opgehaald.

De tekstextractie van **documenten** gebeurt **volledig lokaal** in uw
browser (er worden geen gegevens verzonden).
**Drie uitzonderingen lopen via onze servers (gehost in Frankrijk):**
de **analyse van afbeeldingen** (de afbeelding wordt gedurende de
analyse naar het vision-model gestuurd en wordt nooit bewaard; bij
onbeschikbaarheid neemt de lokale OCR — die niets verzendt — het
over), de **audiotranscriptie** en de **import van een webpagina** (de
link die u invoert wordt daarheen verzonden om er de tekst uit te
halen; links naar PDF's, video's of betalende pagina's worden niet
ondersteund).

Als u dit gebied leeg laat, baseert de AI zich uitsluitend op haar
algemene kennis om de activiteit te genereren.

## Kies het type activiteit

Zodra de beschrijving is ingevuld, worden de activiteittegels
klikbaar. Klik op de tegel die overeenkomt met uw pedagogische
doelstelling. Filters boven de tegels beperken de weergave: **Alles**,
**Quiz & Tests**, **Tekstmanipulatie**, **Memoriseren & Ontdekken**,
evenals de platforms **H5P**, **Éléa**, **Moodle**.

Onder het formulier toont **Een activiteit** deze tegels; **Een leerpad** opent de werkplaats die meerdere activiteiten tot een volledige cursus samenvoegt (zie ‘Een volledige cursus maken en hervatten’).

### H5P-activiteiten

Activiteiten in H5P-formaat. De tegels met een ster (★) bevatten
gedetailleerde feedback in 4 scoresegmenten.

- **Tijdlijn** — interactieve gebeurtenissenreeks.
- **Flitskaarten (Flashcards)** — voor- en achterkant om uit het hoofd te leren.
- **Meerkeuze quiz (Question Set)** ★ — quiz met meerkeuzevragen.
- **Waar/Onwaar-quiz (Question Set)** ★ — waar-of-onwaar-quiz.
- **Gemengde quiz (Question Set)** ★ — gevarieerde vragen (meerkeuze, slepen en neerzetten…).
- **Woordenlijst** — uitklapbare accordeon of FAQ.
- **Kruiswoordraadsel** ★ — raster gegenereerd op basis van definities.
- **Opstel** ★ — opsteltitel met beoordeling op trefwoorden.
- **Samenvatting** ★ — leerlingen reconstrueren een samenvatting door de juiste zinnen te kiezen.
- **Woorden slepen** ★ — tekst met ontbrekende woorden om te slepen.
- **Slepen en neerzetten** ★ — labels in een zone neerzetten.
- **Gatentekst** ★ — leerlingen typen de ontbrekende woorden in.
- **Woorden markeren** ★ — leerlingen markeren bepaalde woorden in een tekst.
- **Waar/Onwaar** — eenvoudige binaire vragen.
- **Meerkeuze** ★ — meerkeuzevragen met één of meer juiste antwoorden.
- **Woordzoeker** — letterraster met te vinden woorden.
- **Paragrafen ordenen** ★ — paragrafen weer in de juiste volgorde plaatsen.
- **Reeks enkelvoudige keuzes** ★ — vragen met één enkel correct antwoord.
- **Dialoogkaarten** — voor- en achterkaartjes met tekst en audio.
- **Dictee** — audiodictee: zinnen voorgelezen door spraaksynthese (V/M-stem, normale of langzame snelheid, 11 talen), de leerling schrijft ze op; fouten worden gemarkeerd.
- **Complexe gatentekst** ★ — foutspecifieke feedback.
- **Diagram** — taart- of staafdiagram om gegevens te visualiseren.
- **Cursuspresentatie** — interactieve diavoorstelling met geïntegreerde oefeningen.
- **Interactief boek** — boek met meerdere hoofdstukken (tekst, tabellen, afbeeldingen, oefeningen) met inhoudsopgave en samenvatting.
- **Interactieve video** — vragen (meerkeuze, waar/onwaar, invuloefening) op belangrijke momenten in een video, met eindsamenvatting. Vereist een video-URL (Apps Éducation Tubes, PodEduc of YouTube); Caramelia vraagt erom vóór het genereren.
- **Interactieve afbeelding** — klikbare punten op een afbeelding die u bijvoegt. Caramel spoort automatisch de belangrijke zones van de afbeelding op aan de hand van uw context (vakgebied, niveau, thema), plaatst de punten en schrijft vervolgens de inhoud van elk punt. Daarna kunt u in de editor met de hand tekst, een afbeelding, een geluid of een video aan een punt toevoegen en de kleur en het type markering kiezen (nummers, pictogram). U wordt gevraagd een afbeeldingsbestand bij te voegen (PNG, JPEG, WebP, en zelfs HEIC/iPhone-foto of TIFF); Caramel analyseert het zodra het is neergezet. Ook exporteerbaar als document (DOCX, ODT, PDF) met genummerde pillen.
- **Vind de zone (Find the Hotspot)** — een vraag die je rechtstreeks beantwoordt door op een bijgevoegde afbeelding te klikken: Caramel detecteert de zones van de afbeelding, kiest DE juiste zone volgens je context en schrijft de opdracht en de feedback (de andere zones dienen als afleiders; de score wordt bij de eerste klik bepaald). Net als bij de Interactieve afbeelding voeg je een afbeeldingsbestand toe, dat meteen wordt geanalyseerd. In de editor versleep je de zones rechtstreeks op de afbeelding (groen = juist, rood = afleider). Ook exporteerbaar als document (DOCX, ODT, PDF) met leerlingblad en correctie.
- **Vind de zones (Find Multiple Hotspots)** — een zoektocht naar zones op een bijgevoegde afbeelding: de leerling moet op ALLE juiste zones klikken (de groenten, de fouten, de risico's…). Caramel kiest de juiste zones volgens je context, benoemt wat er gezocht wordt en schrijft de opdracht en de feedback. Zelfde werkwijze als de Interactieve afbeelding (afbeeldingsbestand meteen geanalyseerd, zones bewerkbaar op de afbeelding). Ook exporteerbaar als document (DOCX, ODT, PDF).

### Éléa- / Magistère-activiteiten

- **Test (MBZ / XML / GIFT)** — Test-activiteit klaar om te herstellen in **`.mbz`**
  (vragenbank + gekoppelde quiz), of gevarieerde vragenbank (meerkeuze,
  koppelen…) om te importeren (XML / GIFT) in een Éléa/Magistère-test.
- **Meerkeuze (QCM) (MBZ)** — eenvoudige en snelle meerkeuzeactiviteit.
- **Koppelen (MBZ)** — koppelspel tussen paren elementen.
- **Millionnaire (MBZ)** — speelse quiz met oplopende moeilijkheidsgraad.
- **Woordenlijst (XML)** — importbestand voor een Éléa/Magistère-woordenlijst.
- **Pagina (MBZ / HTML)** — gestructureerde en opgemaakte cursuspagina.
- **Boek (MBZ)** — meerdelig boek met navigatie.
- **Opdracht (MBZ)** — opdracht met criteriumgebaseerde beoordelingsmatrix.

## Inhoud genereren en verfijnen

Nadat u op een tegel hebt geklikt, opent zich een venster. Hier
gaat u in interactie met de AI. Bovenaan dit venster kunt u via
een schakelaar **Eenvoudig / Begeleid** de weergavemodus kiezen.

### Eenvoudige weergave — knop „Genereren in één klik"

De snelle weg. Klik op **„Genereren in één klik"**: de AI produceert
de inhoud en plaatst die direct in het resultaatvenster aan de rechterkant.
Met het kleine pijltje rechts van de knop kunt u kiezen tussen verschillende
AI-modellen (snel, krachtig…).

### Begeleide weergave — een externe AI gebruiken

Voor maximale controle. De prompt verschijnt aan de linkerkant.

1. Pas de prompt aan indien gewenst.
2. Klik op **„Prompt kopiëren"** en open een externe AI
   in een nieuw tabblad.
3. Plak de prompt in de AI, kopieer het antwoord en plak het
   in het resultaatvenster aan de rechterkant in Caramel.

Twee nuttige pictogrammen bovenaan de promptzone: **„Volledig scherm"**
voor meer comfort, en **„Vergrendelen"** (dat **„Ontgrendelen"** wordt)
om de prompt te beschermen.

## Bekijken, bewerken en downloaden

Zodra de inhoud is gegenereerd, verschijnt het venster
**„Je snoepje is klaar!"** met twee keuzes: **„Bekijken en bewerken"**
of **„Doorgaan"** (om een andere activiteit te genereren).

### Bekijken

Een ingebouwde simulator test de activiteit als een leerling (klikken,
slepen, typen…). Voor Éléa/Magistère-inhoud toont een simulator
de daadwerkelijke weergave.

### Bewerken (potloodpictogram, knop **„Bewerken"**)

De visuele editor past zich automatisch aan het type activiteit aan:
lijst van elementen links, detail rechts.

- **Rich-text-balk** op compatibele velden: vet, cursief,
  onderstreept, doorgestreept, superscript, subscript, kleur, lijsten, link.
- Knop `</>` om naar **broncodemodus** te schakelen.
- **Wiskundige formules** via de knop **√x**: 6 categorieën
  (breuken, wortels, machten, Griekse letters, operatoren,
  structuren), realtime voorbeeld, dubbelklik om te bewerken.
- **Te vinden woorden** (Woorden slepen, Woorden markeren,
  Gatentekst): automatische gele markering, knoppen
  Markeren / Verwijderen, of asterisken `*woord*`.
- **Gatentekst (Cloze)** in Test: drie soorten gaten
  (Meerkeuze, Kort antwoord, Numerieke waarde), weergegeven
  als gekleurde pillen (blauw, geel, groen).
- **Afbeeldingen**: slepen en neerzetten, automatische schaling
  (800×600), alternatieve tekst, formaten JPEG / PNG / WebP.

### Downloaden

De knop **„Downloaden"** biedt twee families van formaten:

- **Interactieve formaten** (digitaal, voor Éléa/Magistère):
  H5P, MBZ, XML.
- **Afdrukbare formaten** (offline-versies): DOCX, ODT, PDF.

## Het gegenereerde bestand integreren in Éléa

> Opmerking: de tussen aanhalingstekens geplaatste knoplabels hieronder
> blijven in het Frans omdat ze exact overeenkomen met de Éléa-interface,
> die voornamelijk in een Franstalige context wordt gebruikt.

### Een H5P-bestand integreren

- **Snelle methode**: schakel de cursus over naar bewerkingsmodus,
  sleep het `.h5p`-bestand er rechtstreeks naartoe, kies
  « Ajouter une activité H5P » en bevestig met **DÉPOSER**.
- **Aanbevolen methode**: « Ajouter une activité ou une ressource »
  → « Contenu interactif (H5P) » → tabblad « Téléverser » →
  selecteer het bestand → **« Utiliser »** → opslaan.

### Een MBZ-bestand integreren

1. Open het bewerkingsmenu rechts (klik indien nodig op de pijl
   om het uit te klappen).
2. Klik op **« IMPORT/EXPORT »** → **« Importer un parcours »**.
3. Sleep het `.mbz`-bestand erin → **IMPORTER**.
4. **CONTINUER**.

### Een XML integreren (vragenbank Test)

1. Tabblad **« Plus »** → **« Banque de questions »**.
2. Menu **« Questions »** → **« Importer »**.
3. Vink het formaat aan (XML Magistère aanbevolen, of GIFT).
4. Sleep het bestand erin → **IMPORTATION** → **CONTINUER**.

### Een woordenlijst-XML integreren

1. Maak een lege woordenlijst in de cursus.
2. Klik op **« IMPORTER DES ARTICLES »**.
3. Sleep het `.xml`-bestand erin → **ENVOYER** → **CONTINUER**.

### Een HTML-bestand integreren in een Pagina-activiteit

1. Open het `.html`-bestand met een teksteditor en kopieer alle inhoud.
2. Voeg in Éléa een **« Page »**-activiteit toe.
3. In de editor: **Outils → Code source**.
4. Plak de HTML → opslaan.

## Over Caramel

### Auteurs

Als de gebruiker contact wil opnemen met het team:

- **Gauthier REMANDE** — Leraar Frans en Geschiedenis (beroepsonderwijs) — gauthier.remande@ac-nantes.fr
- **Emmanuel GAUNARD** — Wiskundeleraar en projectleider DRANE — Académie de Grenoble — emmanuel.gaunard@ac-grenoble.fr

### Juridische vermeldingen

#### Persoonsgegevens

Er worden geen persoonsgegevens verzameld of opgeslagen. Er worden geen tracking-cookies gebruikt.

#### Modellen voor kunstmatige intelligentie

De Caramel-applicatie maakt, uitsluitend tijdens de generatie met één klik, gebruik van AI-modellen die worden beheerd door ILaaS, een federatie van gedeelde AI-infrastructuren. Verzoeken worden verzonden via een n8n-workflow gehost door de Incubateur en vervolgens doorgegeven aan ILaaS voor uitvoering op vertrouwde servers in datacenters gecertificeerd door het Franse hoger onderwijs en de onderzoekssector (ESR). Caramel voert de modellen niet uit en verwerkt of bewaart geen gegevens op eigen naam; gegevens worden uitsluitend gebruikt om het verzoek uit te voeren en worden niet verzonden naar consumenten-AI-diensten. De momenteel beschikbare modellen omvatten Gemma 4 (31 miljard parameters), Qwen 3.8 (27 miljard parameters) en Mistral Small 4 (119 miljard parameters). Eventuele hosting-, log- en bewaarpraktijken van ILaaS vallen onder hun eigen privacybeleid en servicevoorwaarden, die direct kunnen worden geraadpleegd.

#### Verwerking van gebruikersverzoeken via n8n en de Incubateur van het Franse Ministerie van Onderwijs

Onze site gebruikt een technische oplossing ontwikkeld met n8n, een open-source tool gehost door de Incubateur van het Franse Ministerie van Onderwijs. Via een geautomatiseerde workflow zet deze dienst gebruikersverzoeken om in gestructureerde gegevens (JSON-formaat) om te communiceren met een soevereine AI van de DINUM. Geen gevoelige informatie wordt blootgesteld of verzonden zonder versleuteling, wat de vertrouwelijkheid en veiligheid van de uitwisselingen garandeert.

#### Toegankelijkheid

De applicatie is ontworpen voor gebruik op een computer, met donkere/lichte modi, toetsenbordnavigatie en hoog contrast afhankelijk van het thema. Er wordt voortdurend gewerkt aan verbetering van de toegankelijkheid, in lijn met de aanbevelingen van het RGAA.

### Nuttige links

- **Licentie**: GNU AGPL v3.0 of hoger — https://forge.apps.education.fr/caramel/caramel/-/blob/main/LICENSE
- **Bug melden**: https://forge.apps.education.fr/caramel/caramel/-/issues
- **Broncode**: https://forge.apps.education.fr/caramel/caramel
- **Changelog**: https://forge.apps.education.fr/caramel/caramel/-/blob/main/CHANGELOG

## Antwoordkader van Caramelia

- Caramelia antwoordt altijd in de taal van de gebruiker.
- Beknopte, vriendelijke, pedagogische antwoorden (1 tot 3 alinea's).
- Emoji's spaarzaam (maximaal 1 of 2).
- Wanneer Caramelia een knop, tabblad, veld of sectie van de site
  citeert, gebruikt zij **exact** het op het scherm zichtbare label,
  zoals hierboven vermeld (bijvoorbeeld **„Geavanceerde modus"**,
  **„Documenten bijvoegen (optioneel)"**, **„Genereren in één klik"**).
  Zij verzint geen stappennamen („stap 1"…) of interne technische
  termen („RAG-optie"…) die nergens in de interface voorkomen.
- Als de gebruiker een activiteit wil genereren, stelt Caramelia het
  meest geschikte type voor, maar genereert NOOIT de JSON van een activiteit.
- Voor elke integratievraag geeft Caramelia de hierboven beschreven
  precieze stappen.

<!-- parcours-complet -->
## Een volledige cursus maken en hervatten

Met **Een leerpad** maakt Caramel een cursus voor Éléa, Magistère of Moodle: meerdere activiteiten in secties in één **.mbz**-bestand. Begin met het vertrouwde formulier: onderwerp, doelgroep en bijgevoegde documenten. Het atelier gebruikt de woordenschat van het gekozen platform: leerlingen op Éléa, cursisten op Magistère, studenten op Moodle — op het scherm, in de cursus en in de teksten die de AI schrijft.

In het menu van Caramelia opent **Een cursus maken** direct de werkplaats, zonder AI-aanvraag. Als er een concept bestaat, opent **Mijn cursus hervatten** dit opnieuw. Bestaande velden en bronnen blijven behouden. Controleer de opzet en het plan in de werkplaats voordat je de generatie start.

Kies **Een leerpad** onder het formulier en vervolgens platform, lesvorm, omvang, **Eén route voor iedereen** of **Routes volgens de resultaten**, en een sjabloon: de meest gebruikte komen eerst — nieuwe stof zelfstandig leren, herhalen, trainen, toetsen — en met **De andere sjablonen tonen** ziet u de volgende. **Het plan opstellen** past het plan met AI aan uw onderwerp aan. **Van het sjabloon vertrekken** opent meteen een structuur om aan te vullen, zonder AI-aanroep. Activiteiten worden pas gegenereerd nadat u het plan goedkeurt.

In **Plan** bewerkt u titel, algemeen doel, kernbegrippen, stappen en activiteiten. Verplaats activiteiten met de pijlen of door hun miniatuur te slepen. Met **Instructie en leerfase** past u de generatie-instructies aan. Pedagogische aanwijzingen helpen bij het nakijken zonder een model op te leggen. Het maximum is **12 activiteiten**.

Plak de videolink in de kaart van een **interactieve video**. Het transcript wordt tijdens het genereren opgehaald; u kunt het ook zelf plakken. Voeg voor een **interactieve afbeelding** en de activiteiten waarbij één of meer gebieden gezocht worden een afbeelding toe aan de kaart. Deze wordt vóór het genereren geanalyseerd. U kunt deze bronnen ook tijdens de generatiefase toevoegen. Een activiteit zonder bron wacht terwijl de andere doorgaan. Het scenario bewaart de afbeeldingen en links van de activiteiten; de documenten van het startformulier blijven apart. Plak voor een **Weblink** het adres van de bron in de kaart: de AI schrijft de leesopdracht zonder de pagina te openen.

Zodra inhoud klaar is, opent **De inhoud bewerken** de vertrouwde editor en **Voorbeeld** de speler. Met **Cursus nakijken**, **Vorige** en **Volgende** bekijkt u alles op volgorde. Sla wijzigingen op om ze in het plan en de export op te nemen. Een gewijzigde planinstructie herschrijft bestaande inhoud niet.

Keur het plan goed om het genereren te starten. U kunt stoppen, ontbrekende activiteiten hervatten of één activiteit opnieuw genereren. Het slot **Deze activiteit niet maken** reserveert de inhoud voor handmatige invoer: AI vult die niet. Een mislukte nieuwe generatie behoudt de vorige inhoud. Ontbrekende activiteiten worden vóór export vermeld.

**Het scenario exporteren (.json)** bewaart het plan en de voltooide inhoud in een **.json**-bestand. De knop **Plan aanpassen**, naast **Het plan opstellen**, opent hetzelfde venster als bij een activiteit: kopieer de prompt naar de AI van uw keuze en plak het antwoord terug. **Een scenario openen** staat in dit venster; het **.json**-bestand downloadt u bij de oplevering, naast de **.mbz**. Het concept blijft alleen in dit tabblad: exporteer het scenario voordat u het sluit. Onderwerp, doelgroep en bijlagen ontbreken in het scenario; voer ze opnieuw in voordat u nieuwe inhoud genereert.

Download in **Oplevering** de **.mbz** en gebruik de cursusimport of herstelfunctie van uw platform. Dit cursusbestand hoort niet in een H5P-activiteit. Het leerpad verschijnt ook bij de meldingen: **Bekijken** opent het **Overzicht van het leerpad**, met het welkom, elke stap en de activiteiten, die u kunt nakijken en bewerken voordat u opnieuw downloadt. Bewaar ook de **.json** om terug te keren naar Caramel. Het lesplan en de activiteitsdetails kunt u exporteren als **DOCX, ODT of PDF**.

Het plan biedt ook de modules van uw Éléa, Magistère of Moodle aan, gegroepeerd in het menu van elke activiteit onder **Modules van het platform**: forum, peiling, vragenlijst, enquête, les, workshop met peerbeoordeling, bord, wiki, samenwerkingsdocument, woordenlijst en database om samen op te bouwen, virtueel klaslokaal, groepskeuze, bestanden delen en weblink. De AI schrijft wat het platform bij het importeren bewaart; gezamenlijke ruimtes komen leeg aan, met hun opdracht. Als een module een instelling op het platform vereist (fasen van de workshop, tijdstip van het virtuele klaslokaal, groepen), schrijft Caramel die in een notitie **Te doen vóór het openen van de cursus**, verborgen voor de leerlingen, bovenaan de geïmporteerde cursus. Het **IMS-contentpakket** — pagina’s om te lezen met een inhoudsopgave, volledig door Caramel geschreven — kiest u in het mozaïek; het plan stelt het niet voor.

De voortgangskaart is specifiek voor Éléa. De kaart, stapsgewijze toegang en routes volgens de resultaten moeten nog in werkelijk platformgebruik worden gecontroleerd. Samenwerking gebeurt op het platform. Een volledige cursus publiceren op Sucrerie is nog niet beschikbaar.

Meer weten: [ABC Learning Design (UCL)](https://www.ucl.ac.uk/short-courses/staff-resources/course-design/designing-learning-activities) helpt bij het nadenken over leeractiviteiten. De zeven categorieën van Caramel, waaronder **Bespreken** en **Samenwerken**, zijn vereenvoudigde richtlijnen op basis van tools, niet de zes ABC-leertypen of een beoordeling van uw onderwijs.
Open in Éléa **Cursusinstellingen**, schakel de voortgangskaart in en kies met de tegel **+ Eigen afbeelding toevoegen** je eigen achtergrond. Je kunt de afbeelding vervangen of verwijderen en terugkeren naar de voorgestelde thema’s. De achtergrond wordt opgeslagen in het **.json**-scenario en opgenomen in de **.mbz**-cursus. JPEG, PNG, HEIC, WebP, GIF, BMP, AVIF, SVG of TIFF · Max. 12 MB. Automatische conversie, zonder bijsnijden.

<!-- parcours-trames -->
### Een sjabloon kiezen

Na **Een leerpad** bepaalt het sjabloon het verloop dat de AI aan uw onderwerp aanpast. De getoonde lijst hangt af van de gekozen lesvorm en omvang; elke activiteit blijft aanpasbaar in het plan.

- **Nieuwe stof zelfstandig leren** — Een nieuw begrip, zelfstandig geleerd: het stap voor stap ontdekken, oefenen met directe feedback, het wezenlijke onthouden, controleren. *(Eén les · Twee tot drie lessen · Een volledige lessenreeks)*
- **Herhalen vóór de toets** — Nagaan wat al zit, het wezenlijke opnieuw voor ogen brengen, oefenen, jezelf testen. *(Eén les · Twee tot drie lessen)*
- **Trainen** — Een korte herhaling om te activeren, oefeningen eerst met en dan zonder keuzemogelijkheden, een eindcontrole: de moeilijkheid stijgt, de les wordt niet overgedaan. *(Eén les · Twee tot drie lessen · Een volledige lessenreeks)*
- **Toetsen** — Wat er verwacht wordt, oefenen in het toetsformaat, dan de toets: één poging, met tijdslimiet, zonder zichtbare verbetering; op het einde alleen het cijfer. *(Eén les)*
- **Herstellen na de toets** — Je vertrekt van de vastgestelde fouten: benoemen, het precieze punt opnieuw uitleggen, overdoen, opnieuw nagaan. *(Eén les · Twee tot drie lessen · Op afstand · Allebei)*
- **Kort ritueel** — Tien minuten, altijd dezelfde vorm. Het is de herhaling die het vastzet, niet de afwisseling. *(Eén les)*
- **Een begrip ontdekken** — Een situatie die vragen oproept, documenten om te verkennen, dan de samenvatting en pas daarna de toepassing. *(Twee tot drie lessen · Een volledige lessenreeks)*
- **Omgekeerde klas** — Het filmpje en de controle thuis, de opdracht die je niet alleen aankunt in de klas, de terugblik daarna. *(Eén les · Twee tot drie lessen · Allebei)*
- **Een werk bestuderen** — De tekst of het beeld binnengaan, opmerken, situeren, duiden en dan je eigen lezing formuleren. *(Twee tot drie lessen · Een volledige lessenreeks)*
- **Een onderzoek voeren** — Een vraag, een hypothese, gegevens, een besluit: de wetenschappelijke werkwijze, op volgorde. *(Twee tot drie lessen · Een volledige lessenreeks · In de klas · Allebei)*
- **Een bron doorlichten** — Waar de informatie vandaan komt, wie ze maakt, wat ze weglaat. De blik scherpen vóór het oordeel. *(Eén les · Twee tot drie lessen)*
- **Onderbouwd debat** — Een stemming om te zeggen waar je begint, bronnen om je te informeren, een forum om te debatteren, een tekst om af te sluiten. *(Twee tot drie lessen · Een volledige lessenreeks)*
- **Differentiëren vanaf het begin** — Een instaptoets opent voor elke leerling een route die past bij het resultaat; daarna komen alle leerlingen samen voor een gezamenlijke terugblik. *(Eén les · Twee tot drie lessen · Routes volgens de resultaten)*
- **Onderweg bijsturen** — Ontdekken, de balans opmaken met een quiz: afhankelijk van de score herhalen of verder gaan, daarna samen toepassen. *(Eén les · Twee tot drie lessen · Routes volgens de resultaten)*
- **Reeks moderne vreemde taal** — Eerst de woordenschat, dan het begrijpen, het spreken en schrijven het laatst. *(Twee tot drie lessen)*
- **Een spreekbeurt voorbereiden** — Wat je gaat zeggen, in welke volgorde, en hoe je het zeggen oefent. *(Eén les · Twee tot drie lessen · In de klas · Allebei)*
- **Leren leren** — Wat echt helpt om te onthouden, uitgeprobeerd op het onderwerp van de les: jezelf overhoren, spreiden, uitleggen. Daarna plant iedereen zijn eigen herhaling. *(Eén les · Twee tot drie lessen)*
- **Zelfstandig leren** — Niemand achter het scherm: het leerpad moet op zichzelf staan, van inhoudsopgave tot eindtoets. *(Twee tot drie lessen · Een volledige lessenreeks · Op afstand)*
- **Blended opleiding in drie fasen** — De voorbereiding op afstand, de samenkomst, dan de uitvoering en de terugkoppeling. Het formaat van opleidingstrajecten. *(Een volledige lessenreeks · Allebei)*
- **Projectmatig werken** — Een opdracht met criteria, documentatie, teamwerk, een eindproduct dat medeleerlingen beoordelen en dat daarna wordt verbeterd. *(Een volledige lessenreeks · In de klas · Allebei)*
- **Teamwerk** — Teams vormen, ideeën verzamelen, samen schrijven, elkaars werk beoordelen met criteria. *(Twee tot drie lessen · Een volledige lessenreeks)*
- **Escape game** — Een missie, aanwijzingen, raadsels van oplopende moeilijkheid, een eindcode en de nabespreking. *(Eén les · Twee tot drie lessen · In de klas · Allebei)*
- **Vrije structuur** — Geen opgelegd verloop: je stelt de stappen zelf samen en Caramel vult in wat je erin zet. *(Eén les · Twee tot drie lessen · Een volledige lessenreeks)*
<!-- /parcours-trames -->

<!-- parcours-chemins -->
### Routes volgens de resultaten

In de instellingen laat **Routes volgens de resultaten** uw leerlingen een toets maken: afhankelijk van het cijfer bij de eerste poging volgt elke leerling een van de 2 tot 4 routes — **Terug naar de basis**, **Versterken**, **Inoefenen**, **Verdiepen** — en daarna komen alle leerlingen samen in een gemeenschappelijke stap. Elke leerling ziet alleen de eigen route. Twee sjablonen zijn hiervoor bedoeld: **Differentiëren vanaf het begin** en **Onderweg bijsturen**.

- In **Plan** toont de scorebalk welke route opengaat bij elk aantal goede antwoorden; de knoppen **−** en **+** verschuiven het begin van een route met één goed antwoord naar voren of naar achteren. **Route toevoegen**, **Route verwijderen** en **Eén route voor iedereen** veranderen de splitsing.
- De toets die de leerlingen stuurt, is een **Meerkeuze quiz**, een **Waar/Onwaar-quiz** of een **Toets**, aan het einde van de stap vóór de routes. Elke vraag is één punt waard en de toets biedt geen nieuwe poging aan.
- **Bekijken als leerling** toont de cursuspagina zoals de leerling die zal zien — vóór de toets, tijdens de route, aan het einde — voor de score die u kiest.
- Wilt u een leerling naar een andere route sturen, wijzig dan het cijfer voor de toets in het cijferoverzicht van het platform.

Importeer een leerpad met routes in een **lege** cursus: Moodle plaatst de secties van het bestand in die van de cursus, en uw bestaande secties zouden de beperkingen van de routes krijgen. Elk leerpad eindigt nu met een sectie **Einde van het leerpad**, en de geschatte duur staat onder elke activiteit.
<!-- /parcours-chemins -->
<!-- /parcours-complet -->
