import os
import re

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
REPORT_FILE = os.path.join(SCRIPT_DIR, "CLES_TRADUCTION_DOUBLON.MD")
TRANSLATIONS_DIR = os.path.join(PROJECT_ROOT, "js", "translations")

def get_keys_to_remove():
    """Extrait les noms des clés du rapport markdown."""
    if not os.path.exists(REPORT_FILE):
        print(f"❌ Erreur : Le fichier {REPORT_FILE} est introuvable.")
        return []
    
    keys = []
    with open(REPORT_FILE, "r", encoding="utf-8") as f:
        content = f.read()
        # Cherche les lignes du type "- Ligne 123 : nom_de_la_cle"
        matches = re.findall(r"- Ligne \d+ : ([a-zA-Z0-9_]+)", content)
        keys = matches
    
    return keys

def clean_translation_file(filepath, keys):
    """Supprime les lignes correspondant aux clés données dans un fichier."""
    if not os.path.exists(filepath):
        return False
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    new_lines = []
    removed_count = 0
    
    for line in lines:
        should_remove = False
        for key in keys:
            # Regex pour matcher "key:" ou "key :" en début de ligne (après espaces)
            # On s'assure que c'est bien la clé et pas un mot dans une chaîne
            if re.search(fr'^\s*{key}\s*:', line):
                should_remove = True
                removed_count += 1
                break
        
        if not should_remove:
            new_lines.append(line)
            
    if removed_count > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"   ✅ {filepath} : {removed_count} ligne(s) supprimée(s)")
        return True
    else:
        print(f"   ℹ️ {filepath} : aucune modification")
        return False

def main():
    keys = get_keys_to_remove()
    if not keys:
        print("ℹ️ Aucune clé à supprimer.")
        return

    print(f"🚀 Suppression de {len(keys)} clés dans les fichiers de traduction...")
    
    if not os.path.exists(TRANSLATIONS_DIR):
        print(f"❌ Dossier {TRANSLATIONS_DIR} introuvable.")
        return

    files = [f for f in os.listdir(TRANSLATIONS_DIR) if f.endswith(".js")]
    
    for filename in files:
        filepath = os.path.join(TRANSLATIONS_DIR, filename)
        clean_translation_file(filepath, keys)

    print("\n✨ Nettoyage terminé !")

if __name__ == "__main__":
    main()
