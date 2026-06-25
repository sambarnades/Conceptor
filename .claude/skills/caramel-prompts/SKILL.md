---
name: caramel-prompts
description: Créer ou modifier les prompts LLM pour générer des activités. À utiliser quand l'utilisateur dit "modifier prompt LLM", "améliorer prompt", "le LLM produit mal pour X", "ajouter prompt activité", "template prompt", "assets/data/prompts", ou veut tuner les instructions envoyées à l'IA pour une activité.
---

# Prompts LLM Caramel

Templates : `assets/data/prompts/{ActivityName}.md` (un fichier par activité H5P et Moodle).

Mais aussi, la **majorité des chaînes de prompt vivent dans les fichiers locales** (`js/locales/{lang}.json`, sections `prompt_*`) pour permettre la traduction. Le générateur (`js/services/prompt-generator.js`) assemble : système + locale-prompt + variables utilisateur.

## Structure d'un prompt

Variables interpolées par `prompt-generator.js` :
- `{{qui}}` : public cible (élèves, étudiants, ...)
- `{{quoi}}` : sujet
- `{{niveau}}` : niveau scolaire
- `{{nombreQuestions}}` : nombre d'items demandés
- `{{contexte}}` : texte additionnel (extrait OCR/PDF, etc.)
- + activity-specific vars selon le besoin

## Convention de clés (locales)

Pour chaque activité X :
- `prompt_{x}_intro` : contexte + mission
- `prompt_{x}_format` : format JSON attendu, schéma
- `prompt_{x}_constraints` : règles (ex: "Pas de HTML dans le champ Y", "Max 200 chars")
- `prompt_{x}_example` : exemple de sortie valide
- `prompt_{x}_latex` : directives LaTeX (auto-généré par `update-locale-latex.mjs` si applicable)

## Workflow d'amélioration de prompt

1. **Reproduire le problème** : générer plusieurs fois la même activité avec mêmes inputs → identifier le pattern d'erreur
2. **Inspecter raw LLM** en mode `?debug` (avant healer)
3. **Identifier la cause** :
   - Champ manquant → ajouter dans `prompt_x_format`
   - Mauvais format → préciser dans `prompt_x_constraints`
   - LaTeX cassé → vérifier `prompt_x_latex` + `field-constraints.js`
   - Structure imbriquée mal comprise → enrichir `prompt_x_example`
4. **Modifier la clé locale concernée** dans `fr.json` (référence)
5. **Propager dans les 10 autres locales** (voir skill `caramel-translations`)
6. **Tester** : 5-10 générations consécutives pour valider la robustesse
7. **Si LaTeX changé** : `node scripts/update-locale-latex.mjs` puis `node scripts/verify-locale-latex.mjs`

## Choix du modèle LLM

`services/llm.js` définit les modèles disponibles. Override par activité :
```javascript
const MODEL_OVERRIDES = {
  QuizSetQCM: 'gpt-oss-120b',     // gros modèle pour structures complexes
  QuizSetVF: 'gpt-oss-120b',
  QuizSet: 'gpt-oss-120b',
  Page: 'gpt-oss-120b',           // pages longues structurées
  test_elea: 'gpt-oss-120b'
  // défaut : mistral-small-3.2-24b
};
```

Si une activité plante systématiquement avec le modèle par défaut → essayer un override.

## Système de prompts générés (assets/data/prompts)

Les fichiers `assets/data/prompts/{Activity}.md` sont **des modèles statiques** servant de référence/fallback. Le pipeline réel passe par les locales JSON. Si tu modifies un `.md` mais pas la locale → aucun effet en runtime.

Exception : certaines activités (rare) utilisent directement le `.md` via `prompt-generator.js` → vérifier le code.

## Exemples (pour le LLM)

`assets/data/examples/{Activity}.json` : échantillons de sorties JSON valides. Servent à :
- Donner au LLM des exemples few-shot dans le prompt (parfois embarqués)
- Tests visuels (lancement direct dans Caramel sans appel LLM)
- Documentation pour développeurs

## Pièges connus

- **Modifier le `.md` sans toucher la locale** : aucun effet runtime
- **Variables non interpolées** : `{{qui}}` non remplacé → vérifier que le générateur connaît la variable
- **LaTeX dans le prompt** : si tu écris `\frac` dans le prompt, le LLM peut sortir `\\frac` (double-échappement) — préférer demander explicitement le format `\(...\)` et le mode JSON
- **Trop long** : un prompt > 3000 tokens dégrade la qualité — privilégier conciseness
- **Exemples contradictoires** : si l'exemple JSON et le format texte divergent, le LLM suit l'exemple — bien synchroniser
- **Clés `prompt_*` manquantes dans 1 langue** : génération en anglais → fallback FR ? Vérifier le comportement de `t()` quand clé manque
- **Modules Éléa** : leurs prompts peuvent réutiliser ceux du module H5P équivalent (ex: `prompt_test_*` pour `test_elea`) — mais à valider cas par cas

## Audit

```bash
# Lister les clés prompt_* dans fr.json
grep -oE '"prompt_[a-z_]+"' js/locales/fr.json | sort -u

# Vérifier qu'une clé existe dans toutes les locales
for f in js/locales/*.json; do
  echo -n "$(basename $f): "
  grep -c "prompt_flashcards_intro" "$f"
done
```
