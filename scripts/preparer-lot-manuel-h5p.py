"""Prépare 26 variantes natives pour la recette utilisateur, sans appel réseau.

Ce corpus anticipe l'audit des capacités : il n'annonce pas leur prise en charge
exhaustive dans les éditeurs. Les archives originales restent intactes.
Lancer avec le Python du runtime documentaire (Pillow installé).
"""
from pathlib import Path
import copy
import hashlib
import io
import json
import uuid
import wave
import zipfile
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / 'tests/sonde-parcours/audit-activites-2026-09-11'
OUT = AUDIT / 'lot-utilisateur-26'
for folder in ['a-importer', 'retours-elea', 'sources-json', 'medias']:
    (OUT / folder).mkdir(parents=True, exist_ok=True)

# Schéma de recette original, autonome : trois zones repérables sans réseau.
im = Image.new('RGB', (800, 450), 'white')
draw = ImageDraw.Draw(im)
for i, color in enumerate(['#2266aa', '#7950a8', '#ae7100']):
    x = 80 + i * 240
    draw.rectangle((x, 120, x + 160, 300), fill=color)
    draw.text((x + 70, 200), str(i + 1), fill='white', font_size=40)
buf = io.BytesIO(); im.save(buf, format='PNG'); PNG = buf.getvalue()
(OUT / 'medias/zones.png').write_bytes(PNG)
fond = Image.new('RGB', (800, 450), '#173354')
buf = io.BytesIO(); fond.save(buf, format='PNG'); FOND = buf.getvalue()
WAV = (OUT / 'medias/dictee-paris.wav').read_bytes()
with wave.open(io.BytesIO(WAV)) as wav:
    assert wav.getnframes() / wav.getframerate() > 1
    assert any(wav.readframes(wav.getnframes()))
with zipfile.ZipFile(AUDIT / 'livre-couverture/livre-couverture-video.h5p') as z:
    VIDEO = z.read(next(n for n in z.namelist() if n.endswith('.webm')))

image = {'path': 'images/recette-zones.png', 'mime': 'image/png', 'width': 800, 'height': 450,
         'copyright': {'license': 'PD', 'version': 'CC0 1.0', 'title': 'Trois zones de recette'}}
audio = [{'path': 'audios/dictee-paris.wav', 'mime': 'audio/wav'}]

def sub(library, params, title):
    return {'library': library, 'params': params,
            'subContentId': str(uuid.uuid5(uuid.NAMESPACE_URL, 'recette-manuelle/' + title)),
            'metadata': {'title': title, 'license': 'PD', 'licenseVersion': 'CC0 1.0'}}

def image_media():
    return {'type': sub('H5P.Image 1.1', {'file': copy.deepcopy(image), 'alt': 'Zones un, deux et trois'}, 'Image de recette'),
            'disableImageZooming': False}

def lire(relative):
    with zipfile.ZipFile(AUDIT / relative) as z:
        files = {n: z.read(n) for n in z.namelist() if not n.endswith('/')}
    return files, json.loads(files['h5p.json']), json.loads(files['content/content.json'])

RECENTS = {
    'Summary': 'cartes-retouchees/resume-indice.h5p',
    'Flashcards': 'cartes-retouchees/flashcards-editees.h5p',
    'DialogCards': 'cartes-retouchees/dialogues-audio-edites.h5p',
    'SingleChoiceSet': 'cartes-retouchees/choix-unique-delais.h5p',
    'FindTheWords': 'grilles-tri/grille-options.h5p',
    'SortParagraphs': 'grilles-tri/tri-options.h5p',
    'InteractiveBook': 'livre-colonnes/livre-colonnes-edite.h5p',
    'CoursePresentation': 'verification/verification-presentation.h5p',
    'QuizSet': 'verification/verification-quiz.h5p',
    **{k: 'verification/verification-' + k + '.h5p' for k in ['MultipleChoice', 'TrueFalse', 'FillInTheBlanks', 'MarkTheWords']}
}

# Une retouche brève, choisie pour produire une référence de champ utile à l'audit.
ACTIVITES = [
    ('Summary', 'Résumé', 'Ajouter « RELU » à l’indice du premier groupe.'),
    ('DragTheWords', 'Glisser les mots', 'Ajouter « RELU » dans la consigne.'),
    ('Essay', 'Rédaction', 'Ajouter « RELU » à la réponse modèle.'),
    ('FillInTheBlanks', 'Texte à trous', 'Ajouter « RELU » à la consigne, sans modifier les astérisques.'),
    ('MarkTheWords', 'Marquer les mots', 'Ajouter « RELU » à la consigne.'),
    ('TrueFalse', 'Vrai-Faux', 'Ajouter « RELU » au retour d’une bonne réponse.'),
    ('MultipleChoice', 'Choix multiple', 'Ajouter « RELU » à l’indice de la première réponse.'),
    ('SingleChoiceSet', 'Choix unique en série', 'Modifier le délai après bonne réponse, par exemple 2 secondes.'),
    ('Flashcards', 'Cartes mémoire', 'Ajouter « RELU » à l’indice de la première carte.'),
    ('DialogCards', 'Cartes de dialogue', 'Ajouter « RELU » à l’indice recto de la première carte.'),
    ('Dictation', 'Dictée', 'Ajouter « RELU » à la description de la phrase, puis écouter le son.'),
    ('FindTheWords', 'Mots mêlés', 'Rendre visible la liste de mots ; vérifier le mot grec ΑΘΗΝΑ.'),
    ('SortParagraphs', 'Classer les paragraphes', 'Ajouter « RELU » à la consigne ; vérifier l’image au-dessus.'),
    ('Crossword', 'Mots croisés', 'Ajouter « RELU » à l’indice du premier mot.'),
    ('Glossary', 'Glossaire', 'Ajouter « RELU » au titre du premier panneau.'),
    ('QuizSet', 'Questionnaire mixte', 'Ajouter « RELU » au texte de la page d’introduction.'),
    ('QuizSetQCM', 'Questionnaire QCM', 'Ajouter « RELU » au texte de la page d’introduction.'),
    ('QuizSetVF', 'Questionnaire Vrai-Faux', 'Ajouter « RELU » au texte de la page d’introduction.'),
    ('DragAndDrop', 'Glisser-déposer', 'Ajouter « RELU » à l’indice de la première zone de dépôt.'),
    ('Timeline', 'Frise chronologique', 'Ajouter « RELU » au titre du premier événement.'),
    ('ImageHotspots', 'Image interactive', 'Ajouter « RELU » au titre du premier point.'),
    ('FindTheHotspot', 'Trouver la zone', 'Ajouter « RELU » au retour de la zone correcte (zone 2).'),
    ('FindMultipleHotspots', 'Trouver les zones', 'Ajouter « RELU » au retour de la première zone correcte (zone 1).'),
    ('CoursePresentation', 'Présentation', 'Ajouter « RELU » au texte de la première question de la présentation.'),
    ('InteractiveBook', 'Livre interactif', 'Ajouter « RELU » au titre du premier chapitre.'),
    ('InteractiveVideo', 'Vidéo interactive', 'Ajouter « RELU » au libellé du signet « Début » ; tester la question qui apparaît rapidement.')
]
assert len(ACTIVITES) == 26 and len({a[0] for a in ACTIVITES}) == 26
manifest = []
for index, (module, label, retouche) in enumerate(ACTIVITES, 2):
    source = RECENTS.get(module, 'collecte-h5p/' + module + '.h5p')
    files, meta, c = lire(source)
    if module in ['TrueFalse', 'MultipleChoice', 'FillInTheBlanks', 'MarkTheWords', 'SortParagraphs', 'Essay']:
        c['media'] = image_media()
    if module == 'Summary':
        c['summaries'][0]['tip'] = 'La Seine traverse la capitale française.'
    elif module == 'Essay':
        c['taskDescription'] = '<p>Écris une phrase avec le mot énergie.</p>'
        c['solution'] = {'introduction': 'Une proposition', 'sample': 'Le Soleil fournit de l’énergie.'}
        c['placeholderText'] = 'Écris ici ta phrase.'
        c['keywords'] = [{'keyword': 'énergie', 'alternatives': ['energie'], 'options': {'points': 2, 'occurrences': 1, 'caseSensitive': False, 'forgiveMistakes': True, 'feedbackIncluded': 'Le mot attendu est présent.', 'feedbackMissed': 'Pense au mot énergie.'}}]
        c['behaviour'].update(minimumLength=5, maximumLength=200, inputFieldSize='3', percentagePassing=50, percentageMastering=100)
    elif module == 'Dictation':
        c['taskDescription'] = '<p>Écoute puis écris la phrase.</p>'
        c['sentences'] = [{'description': 'Une capitale européenne', 'sample': audio, 'sampleAlternative': audio, 'text': 'Paris est la capitale de la France.'}]
        c['behaviour'].update(tries=3, triesAlternative=2, typoFactor='50', alternateSolution='all', overrideRTL='off', autosplit=True)
    elif module == 'FindTheWords':
        c['wordList'] = 'PARIS,ROME,ΑΘΗΝΑ'
        c['taskDescription'] = 'Retrouve PARIS, ROME et ΑΘΗΝΑ (Athènes en grec).'
        c['behaviour'].update(fillPool='XYZ', showVocabulary=False)
    elif module == 'SortParagraphs':
        c['behaviour'].update(duplicatesInterchangeable=False, addButtonsForMovement=True)
    elif module == 'Crossword':
        c['words'] = [{'answer': 'PARIS', 'clue': 'Capitale de la France', 'fixWord': True, 'row': 1, 'column': 1, 'orientation': 'across'}, {'answer': 'ROME', 'clue': 'Capitale de l’Italie', 'fixWord': True, 'row': 1, 'column': 3, 'orientation': 'down'}]
        c['taskDescription'] = 'Complète les deux capitales qui se croisent sur R.'
        c['solutionWord'] = 'PARIS'
        c['behaviour'].update(enableInstantFeedback=True, keepCorrectAnswers=True)
    elif module.startswith('QuizSet'):
        c['questions'] = c['questions'][:3]
        c['introPage'] = {'showIntroPage': True, 'title': 'Avant de commencer', 'introduction': '<p>Réponds aux questions puis consulte le résultat.</p>', 'startButtonText': 'Commencer'}
        c['disableBackwardsNavigation'] = True
        c['progressType'] = 'textual'
        c['passPercentage'] = 60
    elif module == 'DragAndDrop':
        zones = c['question']['task']['dropZones']
        for zone in zones:
            zone['showLabel'] = True
            zone['tipsAndFeedback'] = {'tip': 'Observe la terminaison du verbe.', 'feedbackOnCorrect': 'La terminaison correspond.', 'feedbackOnIncorrect': 'Compare le verbe avec le titre de la zone.'}
        c['behaviour']['dropZoneHighlighting'] = 'always'
    elif module == 'Timeline':
        # Frise courte sans dépendance à des URL d'images distantes.
        fond_frise = {**image, 'path': 'images/recette-frise.png'}
        c['timeline'] = {'headline': 'Trois étapes fictives de lecture', 'text': '<p>Une séance en trois temps.</p>', 'defaultZoomLevel': '1', 'height': 500, 'language': 'fr', 'backgroundImage': fond_frise,
                         'date': [{'startDate': f'2026,09,{11+i}', 'headline': title, 'text': text, 'asset': {}} for i, (title, text) in enumerate([('Lire', 'Lire le texte.'), ('Échanger', 'Comparer les idées.'), ('Rédiger', 'Écrire une synthèse.')])]}
    elif module == 'ImageHotspots':
        c['image'] = image; c['backgroundImageAltText'] = 'Trois rectangles numérotés de 1 à 3.'
        c['globalIconType'] = 'numbers'; c['globalColor'] = '#2266aa'
        c['hotspots'] = [{'position': {'x': x, 'y': 47, 'legacyPositioning': False}, 'alwaysFullscreen': i == 2, 'hotspotIconType': 'default', 'header': f'Zone {i+1}',
                          'content': [sub('H5P.Text 1.1', {'text': f'<p>Tu as ouvert la zone {i+1}.</p>'}, f'Zone {i+1}')]} for i, x in enumerate([20, 50, 80])]
    elif module in ['FindTheHotspot', 'FindMultipleHotspots']:
        multiple = module == 'FindMultipleHotspots'
        key = 'imageMultipleHotspotQuestion' if multiple else 'imageHotspotQuestion'
        root = c[key]
        # Le groupe à champ unique est aplati dans ImageHotspotQuestion 1.8.
        # ImageMultipleHotspotQuestion conserve, lui, son groupe à plusieurs champs.
        if multiple: root['backgroundImageSettings']['backgroundImage'] = image
        else: root['backgroundImageSettings'] = copy.deepcopy(image)
        if multiple: root['backgroundImageSettings']['questionTitle'] = 'Repérer deux zones numérotées'
        settings = root['hotspotSettings']; settings['taskDescription'] = 'Clique sur les zones 1 et 3.' if multiple else 'Clique sur la zone 2.'
        settings['hotspot'] = [{'userSettings': {'correct': (i != 1 if multiple else i == 1), 'feedbackText': f'Zone {i+1} sélectionnée.'}, 'computedSettings': {'x': x, 'y': 26.67, 'width': 20, 'height': 40, 'figure': 'rectangle'}} for i, x in enumerate([10, 40, 70])]
        settings['noneSelectedFeedback'] = 'Choisis un rectangle numéroté.'
        if multiple: settings.update(numberHotspots=2, hotspotName='zones')
    elif module == 'InteractiveVideo':
        iv = c['interactiveVideo']; iv['video']['files'] = [{'path': 'videos/recette.webm', 'mime': 'video/webm'}]
        iv['video']['startScreenOptions'] = {'title': 'Vidéo courte de recette', 'hideStartTitle': False, 'shortStartDescription': 'Une question apparaît à 0,2 seconde.', 'poster': image}
        q = copy.deepcopy(iv['assets']['interactions'][0]); q.update(duration={'from': 0.2, 'to': 1.1}, pause=True)
        q['action']['params']['question'] = 'Quelle est la capitale de la France ?'
        q['action']['params']['answers'] = [{'text': 'Paris', 'correct': True}, {'text': 'Rome', 'correct': False}]
        iv['assets'] = {'interactions': [q], 'bookmarks': [{'time': 0, 'label': 'Début'}], 'endscreens': []}
        iv.pop('summary', None)
        c['override'] = {'autoplay': False, 'loop': False, 'showBookmarksmenuOnLoad': True, 'preventSkippingMode': 'none'}

    title = f'RECETTE {index:02d} — {label}'
    meta['title'] = title
    # Références dynamiques ajoutées par les médias de recette.
    libs = {}
    def inspect(value):
        if isinstance(value, dict):
            if isinstance(value.get('library'), str):
                machine, version = value['library'].split(' ')
                major, minor = map(int, version.split('.'))
                libs[(machine, major, minor)] = {'machineName': machine, 'majorVersion': major, 'minorVersion': minor}
            for v in value.values(): inspect(v)
        elif isinstance(value, list):
            for v in value: inspect(v)
    inspect(c)
    for d in meta.get('preloadedDependencies', []): libs[(d['machineName'], d['majorVersion'], d['minorVersion'])] = d
    meta['preloadedDependencies'] = list(libs.values())
    encoded = json.dumps(c, ensure_ascii=False).encode()
    files['content/content.json'] = encoded
    files['h5p.json'] = json.dumps(meta, ensure_ascii=False).encode()
    for path, data in [('images/recette-zones.png', PNG), ('images/recette-frise.png', FOND), ('audios/dictee-paris.wav', WAV), ('videos/recette.webm', VIDEO)]:
        if path.encode() in encoded: files['content/' + path] = data
    filename = f'{index:02d}-{module}.h5p'
    with zipfile.ZipFile(OUT / 'a-importer' / filename, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items(): z.writestr(name, data)
    (OUT / 'sources-json' / (module + '.json')).write_bytes(encoded)
    manifest.append({'numero': index, 'module': module, 'libelle': label, 'fichier': filename, 'titre': title, 'source': source, 'retouche': retouche, 'sha256': hashlib.sha256((OUT/'a-importer'/filename).read_bytes()).hexdigest(), 'statut': 'prêt pour recette utilisateur ; non validé en plateforme'})

(OUT / 'inventaire.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(OUT / 'retours-elea/.gitkeep').touch()
intro = '''# Lot groupé : 26 activités H5P

Les fichiers à importer sont dans **a-importer/**. Graphique est déjà validé.
Ce lot prépare les références de champs pour l’audit restant : il ne signifie
pas que les 26 éditeurs et exports sont déjà complétés.

Dans le cours bac à sable **794**, pour chaque fichier :

1. Importer et afficher l’activité en autorisant le téléchargement du H5P.
2. Cliquer **Modifier le contenu H5P**, ajouter **— relu** au titre **interne**.
3. Faire la petite retouche proposée ci-dessous. Si elle est difficile à trouver,
   changer uniquement le titre et me le signaler ; inutile de rester bloqué.
4. Enregistrer, afficher rapidement pour repérer une erreur évidente, puis
   **Réutiliser → Télécharger** sous le contenu.

Laisser les réexports dans **Téléchargements**, ou les déposer dans **retours-elea/**.
Les titres numérotés me permettront de les associer même si Éléa renomme les fichiers.
Une erreur d’import ou un affichage cassé : noter le numéro, passer au suivant.
Le réglage d’achèvement de l’activité Moodle peut devoir être ajusté à l’enregistrement.

La vidéo est volontairement très courte (environ 1,4 s) ; la question apparaît à
0,2 s et met la lecture en pause. La dictée contient une vraie voix disant
« Paris est la capitale de la France. ». Les images des zones utilisent trois
rectangles numérotés. Aucun média distant n’est nécessaire à ces sondes.

| Fait | Fichier / activité | Petite retouche proposée |
|---|---|---|
'''
rows = '\n'.join(f'| ☐ | **{m["fichier"]}** — {m["libelle"]} | {m["retouche"]} |' for m in manifest)
(OUT / 'LIRE-MOI.md').write_text(intro + rows + '\n')
print(f'{len(manifest)} sondes préparées dans {OUT}')
