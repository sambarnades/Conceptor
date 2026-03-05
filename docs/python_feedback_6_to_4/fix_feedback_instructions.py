#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour corriger les références aux tranches de feedbacks dans les instructions.
Remplace les références aux anciennes tranches (0-10, 11-30, etc.) par les nouvelles (0-25, 26-50, etc.)
"""

import re
import sys
from pathlib import Path

class InstructionFixer:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.modified_files = []
        self.total_replacements = 0

    def fix_file(self, filepath: Path) -> bool:
        """Corrige les références aux tranches de feedbacks."""
        print(f"\n[FICHIER] {filepath}")

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"  [ERREUR] {e}")
            return False

        original = content
        replacements = 0

        # Pattern 1: "6 tranches : 0-10, 11-30, 31-50, 51-70, 71-90, 91-100"
        content, count = re.subn(
            r'6\s+tranches\s*:\s*0-10,\s*11-30,\s*31-50,\s*51-70,\s*71-90,\s*91-100',
            '4 tranches : 0-25, 26-50, 51-75, 76-100',
            content
        )
        replacements += count

        # Pattern 2: "6 objets pour le score final : 0-10, 11-30, 31-50, 51-70, 71-90, 91-100"
        content, count = re.subn(
            r'6\s+objets\s+pour\s+le\s+score\s+final\s*:\s*0-10,\s*11-30,\s*31-50,\s*51-70,\s*71-90,\s*91-100',
            '4 objets pour le score final : 0-25, 26-50, 51-75, 76-100',
            content
        )
        replacements += count

        # Pattern 3: "Tableau global de 6 objets pour le score final du QuizSet : 0-10, 11-30, 31-50, 51-70, 71-90, 91-100"
        content, count = re.subn(
            r'Tableau\s+global\s+de\s+6\s+objets\s+pour\s+le\s+score\s+final\s+du\s+QuizSet\s*:\s*0-10,\s*11-30,\s*31-50,\s*51-70,\s*71-90,\s*91-100',
            'Tableau global de 4 objets pour le score final du QuizSet : 0-25, 26-50, 51-75, 76-100',
            content,
            flags=re.IGNORECASE
        )
        replacements += count

        # Pattern 4: "tableau de 4 objets pour le score final (0-10, 11-30, 31-50, 51-70, 71-90, 91-100)"
        content, count = re.subn(
            r'tableau\s+de\s+4\s+objets\s+pour\s+le\s+score\s+final\s*\(0-10,\s*11-30,\s*31-50,\s*51-70,\s*71-90,\s*91-100\)',
            'tableau de 4 objets pour le score final (0-25, 26-50, 51-75, 76-100)',
            content,
            flags=re.IGNORECASE
        )
        replacements += count

        # Pattern 5: "en respectant scrupuleusement les tranches de score suivantes : 0-10, 11-30, 31-50, 51-70, 71-90, et 91-100"
        content, count = re.subn(
            r'en\s+respectant\s+scrupuleusement\s+les\s+tranches\s+de\s+score\s+suivantes\s*:\s*0-10,\s*11-30,\s*31-50,\s*51-70,\s*71-90,\s*et\s*91-100',
            'en respectant scrupuleusement les tranches de score suivantes : 0-25, 26-50, 51-75, et 76-100',
            content,
            flags=re.IGNORECASE
        )
        replacements += count

        # Pattern 6: "6 tranches" générique
        content, count = re.subn(
            r'\(6\s+tranches\)',
            '(4 tranches)',
            content
        )
        replacements += count

        # Pattern 7: Cas où on a juste les tranches sans texte avant
        content, count = re.subn(
            r'\(0-10,\s*11-30,\s*31-50,\s*51-70,\s*71-90,\s*91-100\)',
            '(0-25, 26-50, 51-75, 76-100)',
            content
        )
        replacements += count

        if content != original:
            if not self.dry_run:
                try:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  [OK] {replacements} remplacement(s) effectue(s)")
                except Exception as e:
                    print(f"  [ERREUR] {e}")
                    return False
            else:
                print(f"  [DRY-RUN] {replacements} remplacement(s) detecte(s)")

            self.modified_files.append(str(filepath))
            self.total_replacements += replacements
            return True
        else:
            print(f"  [SKIP] Aucune modification necessaire")
            return False

    def process_directory(self, directory: Path, pattern: str = "*.md"):
        """Traite tous les fichiers d'un répertoire."""
        files = list(directory.rglob(pattern))
        print(f"\n[DIR] {directory}")
        print(f"   {len(files)} fichier(s) trouve(s)")

        for filepath in files:
            self.fix_file(filepath)

    def process_translation_files(self, translations_dir: Path):
        """Traite tous les fichiers de traduction .js"""
        files = list(translations_dir.glob("*.json"))
        print(f"\n[DIR] {translations_dir}")
        print(f"   {len(files)} fichier(s) de traduction trouve(s)")

        for filepath in files:
            self.fix_file(filepath)

    def print_summary(self):
        """Affiche un résumé."""
        print("\n" + "="*70)
        print("RESUME")
        print("="*70)
        print(f"Mode : {'DRY-RUN' if self.dry_run else 'MODIFICATION REELLE'}")
        print(f"Fichiers modifies : {len(self.modified_files)}")
        print(f"Total de remplacements : {self.total_replacements}")

        if self.modified_files:
            print("\nFichiers concernes :")
            for f in sorted(self.modified_files):
                print(f"   - {f}")


def main():
    print("="*70)
    print("CORRECTION DES REFERENCES AUX TRANCHES DE FEEDBACKS")
    print("="*70)

    apply = '--apply' in sys.argv or '-a' in sys.argv

    base_dir = Path(__file__).parent
    prompts_dir = base_dir / "assets" / "data" / "prompts"
    translations_dir = base_dir / "js" / "locales"

    if not prompts_dir.exists():
        print(f"[ERREUR] Repertoire introuvable : {prompts_dir}")
        return
    if not translations_dir.exists():
        print(f"[ERREUR] Repertoire introuvable : {translations_dir}")
        return

    if not apply:
        print("\nPHASE : DRY-RUN (apercu des changements)")
        print("-"*70)
        print("Utilisez --apply ou -a pour appliquer les modifications")
        print("-"*70)
        fixer = InstructionFixer(dry_run=True)
    else:
        print("\nPHASE : APPLICATION DES MODIFICATIONS")
        print("-"*70)
        fixer = InstructionFixer(dry_run=False)

    # Traiter les prompts
    fixer.process_directory(prompts_dir, "*.md")

    # Traiter les traductions
    fixer.process_translation_files(translations_dir)

    # Afficher le résumé
    fixer.print_summary()

    if not apply and fixer.modified_files:
        print("\n[INFO] Pour appliquer ces modifications, relancez avec --apply")
    elif apply and fixer.modified_files:
        print("\n[OK] Modifications appliquees avec succes !")
    else:
        print("\n[OK] Aucune modification necessaire.")


if __name__ == "__main__":
    main()
