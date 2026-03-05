#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour corriger les références restantes aux anciennes tranches de feedbacks
"""

import re
import sys
from pathlib import Path

def fix_file(filepath: Path, dry_run=True):
    """Corrige un fichier."""
    print(f"\n[FICHIER] {filepath}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  [ERREUR] {e}")
        return False

    original = content
    replacements = 0

    # Pattern 1: "6 tranches de score" -> "4 tranches de score"
    content, count = re.subn(
        r'6\s+tranches\s+de\s+score',
        '4 tranches de score',
        content
    )
    replacements += count

    # Pattern 2: Pour le fichier arabe - chercher les patterns avec nombres arabes ou réguliers
    # "مصفوفة من 6 كائنات" -> "مصفوفة من 4 كائنات" (tableau de 6 objets -> tableau de 4 objets)
    content, count = re.subn(
        r'مصفوفة\s+من\s+6\s+كائنات',
        'مصفوفة من 4 كائنات',
        content
    )
    replacements += count

    # Pattern 3: Remplacer les tranches en arabe
    # "0-10، 11-30، 31-50، 51-70، 71-90، و 91-100" -> "0-25، 26-50، 51-75، و 76-100"
    content, count = re.subn(
        r'0-10،\s*11-30،\s*31-50،\s*51-70،\s*71-90،\s*و\s*91-100',
        '0-25، 26-50، 51-75، و 76-100',
        content
    )
    replacements += count

    # Pattern 4: Sans le "و" (et)
    content, count = re.subn(
        r'0-10،\s*11-30،\s*31-50،\s*51-70،\s*71-90،\s*91-100',
        '0-25، 26-50، 51-75، 76-100',
        content
    )
    replacements += count

    # Pattern 5: Patterns génériques avec virgules et espaces (toutes langues)
    # "0-10, 11-30, 31-50, 51-70, 71-90, 91-100" ou variations avec conjonctions
    # Conjonctions: "und"(DE), "και"(EL), "and"(EN), "y"(ES), "et"(FR), "e"(IT), "en"(NL/PT), "そして"(JP), "和"(ZH)
    content, count = re.subn(
        r'0-10[,、]\s*11-30[,、]?\s*31-50[,、]?\s*51-70[,、]?\s*71-90[,、]?\s*(?:und|και|and|y|et|e|en|そして|和)?\s*91-100',
        '0-25, 26-50, 51-75, 76-100',
        content
    )
    replacements += count

    # Pattern 6: Sans conjonction à la fin
    content, count = re.subn(
        r'0-10,\s*11-30,\s*31-50,\s*51-70,\s*71-90,\s*91-100',
        '0-25, 26-50, 51-75, 76-100',
        content
    )
    replacements += count

    # Pattern 7: "6 objets" ou "6 Objekten" ou "6 αντικειμένων" ou "6 objects" ou "6 objetos"
    content, count = re.subn(
        r'6\s+(objets|Objekten|αντικειμένων|objects|objetos|oggetti|objecten|物件|オブジェクト|كائنات)',
        r'4 \1',
        content
    )
    replacements += count

    # Pattern 8: "6 Bereiche" (allemand pour 6 plages/tranches)
    content, count = re.subn(
        r'6\s+(Bereiche|κλίμακες|ranges|rangos|intervalli|bereiken|範囲|نطاقات)',
        r'4 \1',
        content
    )
    replacements += count

    if content != original:
        if not dry_run:
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  [OK] {replacements} remplacement(s)")
            except Exception as e:
                print(f"  [ERREUR] {e}")
                return False
        else:
            print(f"  [DRY-RUN] {replacements} remplacement(s)")
        return True
    else:
        print(f"  [SKIP] Aucune modification")
        return False

def main():
    print("="*70)
    print("CORRECTION DES REFERENCES RESTANTES")
    print("="*70)

    apply = '--apply' in sys.argv or '-a' in sys.argv

    base_dir = Path(__file__).parent
    translations_dir = base_dir / "js" / "locales"

    if not translations_dir.exists():
        print(f"[ERREUR] Repertoire introuvable : {translations_dir}")
        return

    modified = 0

    # Traiter tous les fichiers de traduction
    for filepath in translations_dir.glob("*.json"):
        if fix_file(filepath, dry_run=not apply):
            modified += 1

    print(f"\n{'='*70}")
    if apply:
        print(f"[OK] {modified} fichier(s) modifie(s)")
    else:
        print(f"[INFO] {modified} fichier(s) a modifier")
        print("[INFO] Utilisez --apply pour appliquer les modifications")
    print(f"{'='*70}")

if __name__ == "__main__":
    main()
