"""Compare les réexports manuels au lot figé, conserve les preuves locales."""
from pathlib import Path
import hashlib
import html
import json
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'tests/sonde-parcours/audit-activites-2026-09-11/lot-utilisateur-26'
DOWNLOADS = Path.home() / 'Downloads'
inventory = json.loads((BASE / 'inventaire.json').read_text())
OUT = BASE / 'retours-elea'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def readable(text):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html.unescape(text))).strip()

def compare(a, b, path=''):
    changes = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            p = path + '.' + k if path else k
            if k not in a: changes.append({'chemin': p, 'type': 'ajout_natif', 'apres': b[k]})
            elif k not in b: changes.append({'chemin': p, 'type': 'retrait_natif', 'avant': a[k]})
            else: changes.extend(compare(a[k], b[k], p))
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b): changes.append({'chemin': path, 'type': 'taille_liste', 'avant': len(a), 'apres': len(b)})
        for i, (x, y) in enumerate(zip(a, b)): changes.extend(compare(x, y, f'{path}[{i}]'))
    elif a != b:
        normalisation = isinstance(a, str) and isinstance(b, str) and readable(a) == readable(b)
        changes.append({'chemin': path, 'type': 'normalisation_html' if normalisation else 'modification', 'avant': a, 'apres': b})
    return changes

def media_paths(value):
    found = set()
    if isinstance(value, dict):
        p = value.get('path')
        if isinstance(p, str) and p.startswith(('images/', 'audios/', 'videos/')): found.add('content/' + p)
        for v in value.values(): found.update(media_paths(v))
    elif isinstance(value, list):
        for v in value: found.update(media_paths(v))
    return found

reports = []
for item in inventory:
    candidates = sorted(DOWNLOADS.glob(Path(item['fichier']).stem + '*.h5p'), key=lambda p: p.stat().st_mtime, reverse=True)
    returned = None
    for p in candidates:
        with zipfile.ZipFile(p) as z:
            if any(n.endswith('/library.json') for n in z.namelist()): returned = p; break
    if returned is None:
        reports.append({'numero': item['numero'], 'module': item['module'], 'recu': False})
        continue
    source = BASE / 'a-importer' / item['fichier']
    corrected = BASE / 'correctifs/23-FindTheHotspot-corrige.h5p'
    if item['module'] == 'FindTheHotspot' and corrected.exists(): source = corrected
    with zipfile.ZipFile(source) as a, zipfile.ZipFile(returned) as b:
        original = json.loads(a.read('content/content.json')); content = json.loads(b.read('content/content.json'))
        original_metadata = json.loads(a.read('h5p.json'))
        metadata = json.loads(b.read('h5p.json'))
        differences = compare(original, content)
        libraries = [json.loads(b.read(n)) for n in b.namelist() if n.endswith('/library.json')]
        out = OUT / item['module']; out.mkdir(exist_ok=True)
        shutil.copyfile(returned, out / item['fichier'])
        (out / 'content.json').write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
        (out / 'ecarts.json').write_text(json.dumps(differences, ensure_ascii=False, indent=2) + '\n')
        hashes = {digest(b.read(n)) for n in b.namelist() if n.startswith('content/') and not n.endswith('/') and n != 'content/content.json'}
        media = [{'chemin': p, 'identique_dans_retour': digest(a.read(p)) in hashes} for p in sorted(media_paths(original))]
        missing = [p for p in media_paths(content) if p not in b.namelist()]
        # Conserver les semantics principales réellement renvoyées par Éléa.
        main = metadata['mainLibrary']
        sem = next((n for n in b.namelist() if n.startswith(main + '-') and n.endswith('/semantics.json')), None)
        if sem: (out / 'semantics.json').write_bytes(b.read(sem))
        relu = [d['chemin'] for d in differences if 'RELU' in json.dumps(d.get('apres', ''), ensure_ascii=False).upper() and d['type'] != 'normalisation_html']
        r = {'numero': item['numero'], 'module': item['module'], 'recu': True, 'fichier_telechargement': returned.name,
             'sha256_source': digest(source.read_bytes()), 'sha256_retour': digest(returned.read_bytes()),
             'source_comparee': str(source.relative_to(BASE)),
             'titre': metadata['title'], 'titre_modifie': metadata['title'] != original_metadata['title'], 'champs_retouches_relu': relu,
             'bibliotheques': [{'nom': l['machineName'], 'version': '.'.join(str(l[k]) for k in ['majorVersion', 'minorVersion', 'patchVersion'])} for l in libraries],
             'medias_sources': media, 'medias_references_absents_du_retour': missing,
             'ecarts': {k: sum(d['type'] == k for d in differences) for k in ['modification', 'normalisation_html', 'ajout_natif', 'retrait_natif', 'taille_liste']}}
        (out / 'preuve.json').write_text(json.dumps(r, ensure_ascii=False, indent=2) + '\n')
        reports.append(r)

(OUT / 'comparaison.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2) + '\n')
rows = []
for r in reports:
    if not r['recu']: rows.append(f'| {r["numero"]} | {r["module"]} | Non reçu | — | — |'); continue
    fields = ', '.join('`' + p + '`' for p in r['champs_retouches_relu']) or ('Titre interne' if r['titre_modifie'] else 'Enregistrement natif ; aucun marqueur RELU repéré')
    media = r['medias_sources']; state = f'{sum(m["identique_dans_retour"] for m in media)}/{len(media)} identiques' if media else 'Aucun média source'
    rows.append(f'| {r["numero"]} | {r["module"]} | {len(r["bibliotheques"])} bibliothèques | {fields} | {state} |')
received = sum(r['recu'] for r in reports)
text = f'''# Retour du lot manuel — {received}/26 archives reçues

Les archives sont comparées aux fichiers remis, restés figés. Les écarts complets,
les contenus, les semantics principales et les SHA-256 sont conservés par activité.
Un réexport ne clôture pas à lui seul l’audit de l’éditeur et des documents.

L’utilisateur signale que le n° 23 était sans image. Le défaut est confirmé :
le script de préparation avait imbriqué l’image dans un groupe qui doit être aplati.
Le processeur Caramel gérait déjà cet aplatissement ; le défaut venait de la sonde.

| N° | Activité | Réexport | Retouche repérée | Médias sources |
|---|---|---|---|---|
''' + '\n'.join(rows) + '''

Les normalisations HTML (paragraphes, apostrophes échappées) sont distinguées des
modifications de valeur. Les ajouts de défauts et retraits natifs restent à qualifier
contre les semantics, activité par activité ; ils ne sont pas tous des pertes.
Les temps vidéo et certaines positions sont aussi ajustés par l’éditeur natif.
'''
(BASE / 'BILAN_RETOURS.md').write_text(text)
print(f'{received}/26 réexports conservés et comparés.')
print('Retouches RELU :', sum(bool(r.get('champs_retouches_relu')) or r.get('titre_modifie', False) for r in reports))
print('Médias sources non retrouvés :', [(r['module'], m['chemin']) for r in reports if r['recu'] for m in r['medias_sources'] if not m['identique_dans_retour']])
print('Médias référencés absents :', [(r['module'], r['medias_references_absents_du_retour']) for r in reports if r['recu'] and r['medias_references_absents_du_retour']])
