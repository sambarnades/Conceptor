"""Conserve les références des sondes identifiées, sans dupliquer les ZIP complets.
Usage : python3 scripts/conserver-references-elea.py DOSSIER_DOWNLOADS DOSSIER_PREUVES
Le titre natif doit porter « MODULE — relecture Éléa » (retouche enregistrée).
"""
from pathlib import Path
from zipfile import ZipFile
import hashlib, json, re, sys
source, destination = map(Path, sys.argv[1:3])
root = Path(__file__).resolve().parent.parent
inventaire = json.loads((root/'tests/sonde-parcours/audit-activites-2026-09-11/collecte-h5p/inventaire.json').read_text())
modules = {a['module'] for a in inventaire['activites']}
paquets = {}
for fichier in source.glob('*.h5p'):
    with ZipFile(fichier) as archive:
        manifeste = json.loads(archive.read('h5p.json'))
        titre = manifeste.get('title', '')
        if not titre.endswith(' — relecture Éléa'):
            continue
        module = titre.removesuffix(' — relecture Éléa')
        if module not in modules:
            continue
        if module not in paquets or fichier.stat().st_mtime > paquets[module].stat().st_mtime:
            paquets[module] = fichier
if modules != paquets.keys():
    raise SystemExit('Réexports retouchés manquants : '+', '.join(sorted(modules-paquets.keys())))
rapport = {'date': '2026-09-11', 'plateforme': 'test03.elea.apps.education.fr', 'cours': 794, 'activites': [], 'bibliotheques': {}}
for a in inventaire['activites']:
    module=a['module'];fichier=paquets[module]
    with ZipFile(fichier) as archive:
        names=archive.namelist()
        libs=[n for n in names if re.fullmatch(r'[A-Za-z0-9_.-]+/library.json',n)]
        if not libs: raise ValueError('Aucune bibliothèque : '+module)
        for name in libs:
            lib=name.split('/')[0]
            for leaf in ('library.json','semantics.json'):
                name=lib+'/'+leaf
                if name not in names: continue
                data=archive.read(name)
                path=destination/'bibliotheques'/name
                if path.exists() and json.loads(path.read_bytes()) != json.loads(data):
                    raise ValueError('Bibliothèque contradictoire : '+name)
                path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            rapport['bibliotheques'][lib]=json.loads(archive.read(lib+'/library.json')).get('patchVersion')
        for name in ('h5p.json','content/content.json'):
            data=json.loads(archive.read(name))
            # Les sondes créées pour cette recette n'ont pas d'auteur individuel.
            # Ne jamais publier accidentellement une future sonde nominative.
            def verifier(n):
                if isinstance(n,dict):
                    if n.get('authors'): raise ValueError('Auteurs à anonymiser : '+module)
                    for v in n.values(): verifier(v)
                if isinstance(n,list):
                    for v in n: verifier(v)
            verifier(data)
            path=destination/'contenus'/module/Path(name).name
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
        rapport['activites'].append({'module':module,'titreEnregistre':json.loads(archive.read('h5p.json'))['title'],
            'fichierReexport':fichier.name,'sha256':hashlib.sha256(fichier.read_bytes()).hexdigest(),'bibliotheques':len(libs),
            'contentSha256':hashlib.sha256(archive.read('content/content.json')).hexdigest()})
(destination/'collecte.json').write_text(json.dumps(rapport,ensure_ascii=False,indent=2)+'\n')
print(f"{len(paquets)} retouches retrouvées dans les réexports ; {len(rapport['bibliotheques'])} bibliothèques conservées.")
