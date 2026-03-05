#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour supprimer les lignes vides entre les feedbacks
"""

import re
import sys
from pathlib import Path

def cleanup_file(filepath: Path) -> bool:
    """Supprime les lignes vides entre les feedbacks."""
    print(f"[FICHIER] {filepath}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  [ERREUR] {e}")
        return False

    original = content

    # Supprimer les lignes vides entre les objets de feedback
    # Pattern : } ou }, suivi d'une ou plusieurs lignes vides, suivi d'indentation + {
    content = re.sub(
        r'(\}\s*,?)\s*\n\s*\n+(\s+\{\s*"from":)',
        r'\1\n\2',
        content
    )

    if content != original:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  [OK] Lignes vides supprimees")
            return True
        except Exception as e:
            print(f"  [ERREUR] {e}")
            return False
    else:
        print(f"  [SKIP] Aucune modification")
        return False

def main():
    apply = '--apply' in sys.argv or '-a' in sys.argv

    print("="*70)
    print("NETTOYAGE DES LIGNES VIDES ENTRE FEEDBACKS")
    print("="*70)

    if not apply:
        print("\nUtilisez --apply pour appliquer les modifications\n")
        return

    base_dir = Path(__file__).parent
    prompts_dir = base_dir / "assets" / "data" / "prompts"
    translations_dir = base_dir / "js" / "locales"

    modified = 0

    # Traiter les prompts
    print(f"\n[DIR] {prompts_dir}")
    for filepath in prompts_dir.rglob("*.md"):
        if cleanup_file(filepath):
            modified += 1

    # Traiter les traductions
    print(f"\n[DIR] {translations_dir}")
    for filepath in translations_dir.glob("*.json"):
        if cleanup_file(filepath):
            modified += 1

    print(f"\n{'='*70}")
    print(f"[OK] {modified} fichier(s) modifie(s)")
    print(f"{'='*70}")

if __name__ == "__main__":
    main()
