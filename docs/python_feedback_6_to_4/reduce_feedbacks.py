#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour réduire les feedbacks de 6 à 4 objets dans les prompts et traductions.
Transforme les tranches 0-10, 11-30, 31-50, 51-70, 71-90, 91-100
         en tranches 0-25, 26-50, 51-75, 76-100
"""

import re
import os
import sys
from pathlib import Path
from typing import List, Tuple

class FeedbackReducer:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.modified_files = []
        self.total_replacements = 0

    def process_file(self, filepath: Path) -> bool:
        """Traite un fichier et retourne True si des modifications ont été faites."""
        print(f"\n[FICHIER] Traitement de : {filepath}")

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"  [ERREUR] Erreur de lecture : {e}")
            return False

        original_content = content

        # Étape 1 : Remplacer "tableau de 6 objets" par "tableau de 4 objets"
        content = re.sub(
            r'tableau de 6 objets',
            'tableau de 4 objets',
            content,
            flags=re.IGNORECASE
        )

        # Étape 1.5 : Nettoyer les lignes vides entre feedbacks (issues de la première transformation)
        # Pattern pour détecter et supprimer les lignes vides dans les blocs overallFeedback
        content = re.sub(
            r'(\{\s*"from":\s*\d+,\s*"to":\s*\d+,\s*"feedback":\s*"[^"]+"\s*\},?)\s*\n\s*\n(\s*\{\s*"from":)',
            r'\1\n\2',
            content
        )

        # Étape 2 : Identifier et remplacer les blocs de 6 feedbacks
        # Pattern pour capturer un bloc complet de 6 feedbacks avec indentation variable
        # Gère à la fois {"from" et { "from"
        pattern = r'''
            (\s*)                                    # Capture l'indentation de base (group 1)
            \{\s*("from":\s*0,\s*"to":\s*10,\s*"feedback":\s*"([^"]+)"\s*)\},?\s*\n  # Ligne 1 (0-10)
            \s*\{\s*"from":\s*11,\s*"to":\s*30,\s*"feedback":\s*"[^"]+"\s*\},?\s*\n  # Ligne 2 (11-30) - supprime
            \s*\{\s*("from":\s*31,\s*"to":\s*50,\s*"feedback":\s*"([^"]+)"\s*)\},?\s*\n  # Ligne 3 (31-50)
            \s*\{\s*("from":\s*51,\s*"to":\s*70,\s*"feedback":\s*"([^"]+)"\s*)\},?\s*\n  # Ligne 4 (51-70)
            \s*\{\s*"from":\s*71,\s*"to":\s*90,\s*"feedback":\s*"[^"]+"\s*\},?\s*\n  # Ligne 5 (71-90) - supprime
            \s*\{\s*("from":\s*91,\s*"to":\s*100,\s*"feedback":\s*"([^"]+)"\s*)\}      # Ligne 6 (91-100)
        '''

        def replace_feedback(match):
            """Fonction de remplacement pour chaque bloc de 6 feedbacks."""
            indent = match.group(1)  # Indentation de base
            feedback_1 = match.group(3)  # 0-10
            feedback_3 = match.group(5)  # 31-50
            feedback_4 = match.group(7)  # 51-70
            feedback_6 = match.group(9)  # 91-100

            # Déterminer le style (avec ou sans espace après {)
            # On regarde si le premier feedback a un espace après {
            has_space = match.group(2).startswith('"')  # Si pas d'espace, ça commence par "from"
            space = " " if has_space else ""

            # Reconstruire avec 4 feedbacks et nouvelles tranches (sans lignes vides)
            new_block = f'{indent}{{{space}"from": 0, "to": 25, "feedback": "{feedback_1}"{space}}},\n'
            new_block += f'{indent}{{{space}"from": 26, "to": 50, "feedback": "{feedback_3}"{space}}},\n'
            new_block += f'{indent}{{{space}"from": 51, "to": 75, "feedback": "{feedback_4}"{space}}},\n'
            new_block += f'{indent}{{{space}"from": 76, "to": 100, "feedback": "{feedback_6}"{space}}}'

            return new_block

        # Appliquer le remplacement
        new_content, count = re.subn(
            pattern,
            replace_feedback,
            content,
            flags=re.VERBOSE | re.MULTILINE
        )

        if count > 0:
            print(f"  [OK] {count} bloc(s) de 6 feedbacks remplace(s) par 4 feedbacks")
            self.total_replacements += count

        # Vérifier si le contenu a changé
        if new_content != original_content:
            if not self.dry_run:
                try:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"  [SAVE] Fichier sauvegarde")
                except Exception as e:
                    print(f"  [ERREUR] Erreur d'ecriture : {e}")
                    return False
            else:
                print(f"  [DRY-RUN] Modifications detectees (mode dry-run)")

            self.modified_files.append(str(filepath))
            return True
        else:
            print(f"  [SKIP] Aucune modification necessaire")
            return False

    def process_directory(self, directory: Path, pattern: str = "*.md"):
        """Traite tous les fichiers d'un répertoire."""
        files = list(directory.rglob(pattern))
        print(f"\n[DIR] Repertoire : {directory}")
        print(f"   {len(files)} fichier(s) trouve(s)")

        for filepath in files:
            self.process_file(filepath)

    def process_translation_files(self, translations_dir: Path):
        """Traite tous les fichiers de traduction .js"""
        files = list(translations_dir.glob("*.json"))
        print(f"\n[DIR] Repertoire : {translations_dir}")
        print(f"   {len(files)} fichier(s) de traduction trouve(s)")

        for filepath in files:
            self.process_file(filepath)

    def print_summary(self):
        """Affiche un resume des modifications."""
        print("\n" + "="*70)
        print("RESUME")
        print("="*70)
        print(f"Mode : {'DRY-RUN (aucune modification)' if self.dry_run else 'MODIFICATION REELLE'}")
        print(f"Fichiers modifies : {len(self.modified_files)}")
        print(f"Total de blocs remplaces : {self.total_replacements}")

        if self.modified_files:
            print("\nFichiers concernes :")
            for f in sorted(self.modified_files):
                print(f"   - {f}")


def main():
    print("="*70)
    print("REDUCTION DES FEEDBACKS DE 6 A 4 OBJETS")
    print("="*70)

    # Check for --apply argument
    apply_changes = '--apply' in sys.argv or '-a' in sys.argv

    # Chemins
    base_dir = Path(__file__).parent
    prompts_dir = base_dir / "assets" / "data" / "prompts"
    translations_dir = base_dir / "js" / "locales"

    # Verification de l'existence des repertoires
    if not prompts_dir.exists():
        print(f"[ERREUR] Repertoire introuvable : {prompts_dir}")
        return
    if not translations_dir.exists():
        print(f"[ERREUR] Repertoire introuvable : {translations_dir}")
        return

    if not apply_changes:
        # Mode dry-run d'abord
        print("\nPHASE 1 : DRY-RUN (apercu des changements)")
        print("-"*70)
        print("Utilisez --apply ou -a pour appliquer les modifications")
        print("-"*70)
        reducer = FeedbackReducer(dry_run=True)

        # Traiter les prompts
        reducer.process_directory(prompts_dir, "*.md")

        # Traiter les traductions
        reducer.process_translation_files(translations_dir)

        # Afficher le résumé
        reducer.print_summary()

        if reducer.modified_files:
            print("\n[INFO] Pour appliquer ces modifications, relancez avec --apply")
        else:
            print("\n[OK] Aucune modification necessaire.")
    else:
        # Apply changes directly
        print("\nPHASE : APPLICATION DES MODIFICATIONS")
        print("-"*70)
        reducer_real = FeedbackReducer(dry_run=False)
        reducer_real.process_directory(prompts_dir, "*.md")
        reducer_real.process_translation_files(translations_dir)
        reducer_real.print_summary()

        if reducer_real.modified_files:
            print("\n[OK] Modifications appliquees avec succes !")
        else:
            print("\n[OK] Aucune modification necessaire.")


if __name__ == "__main__":
    main()
